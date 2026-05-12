import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function fetchAIResponse(prompt: string, usePro = false) {
  const geminiKeys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "").split(',').filter(k => k.trim() !== "");

  if (geminiKeys.length === 0) {
    throw new Error("SYSTEM ERROR: API Cores not found in environment.");
  }

  const modelName = usePro ? "gemini-1.5-pro" : "gemini-1.5-flash";

  for (const key of geminiKeys) {
    try {
      const ai = new GoogleGenerativeAI(key.trim());
      const model = ai.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return { reply: response.text(), provider: `Gemini ${usePro ? "Pro" : "Flash"}` };
    } catch (e: any) {
      console.error(`Gemini ${modelName} rotation signal: ${e.message}`);
      if (e.message?.includes("429")) continue; // Rotate on rate limit
      // Non-rate-limit errors might still be worth retrying with a different key if it's an auth/quota issue
      continue;
    }
  }

  throw new Error("All API cores depleted or rejected.");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 0. AWAKENING ONBOARDING 
    if (body.onboardingStep !== undefined) {
      const { onboardingStep, answers } = body;
      
      if (onboardingStep === 3) {
         const prompt = `
         You are the System Architect. The Measurement Test is complete. 
         Analyze the Hunter's responses and generate their Core Persona.
         
         RECORDS:
         1. Academic Endgame: ${answers[0] || "Unknown"}
         2. Circadian Mana Mapping: ${answers[1] || "Unknown"}
         3. Psychological Profile: ${answers[2] || "Unknown"}
         
         ALGORITHM:
         - Intelligence (INT): High if answers are detailed, analytical, or academic.
         - Strength (STR): High if the user mentions discipline, physical endurance, or brute force studying.
         - Agility (AGI): High if they focus on speed, efficiency, or "Night Owl" bursts.
         - Perception (PER): High if they mention accuracy, specific targets, or exams.
         - Vitality (VIT): High if they focus on consistency, sustainability, or health.
         
         OUTPUT: Return ONLY a raw JSON block. No markdown. No chatter.
         {
           "hunter_rank": "E",
           "name": "${body.userName || 'HUNTER'}",
           "goal": "${answers[0] || 'Unknown'}",
           "stats": { "INT": 15, "STR": 10, "AGI": 12, "PER": 8, "VIT": 10 },
           "avatar_string": "A dark cloaked figure with a faint ${onboardingStep === 2 ? 'blue' : 'purple'} aura, representing their ${answers[2]} drive.",
           "scheduling_meta": { "peak_hours": "${answers[1]}", "rest_required": 8 },
           "initial_week_strategy": "A 3-sentence high-level strategy for their first 7 days."
         }
         `;
         const aiData = await fetchAIResponse(prompt, true); // Use Pro for persona synthesis
         const sanitized = aiData.reply.replace(/```json|```/g, "").trim();
         return NextResponse.json({ reply: sanitized, provider: aiData.provider, type: "awakening_complete" });
      }

      const prompt = `
      You are the System Architect. Tone: Mechanical, precise, cold, and authoritative. 
      You are conducting the Awakening Interview (Pillar ${onboardingStep + 1} of 3).
      
      CONTEXT:
      Step 1: Academic Endgame (Exam/Goal)
      Step 2: Circadian Mana (Peak focus windows)
      Step 3: Psychological Profile (Motivation: Rank, Mastery, or Rewards)
      
      CURRENT PROGRESS: ${JSON.stringify(answers || [])}.
      
      TARGET: 
      Fetch Pillar ${onboardingStep + 1} data.
      
      RESPONSE:
      Acknowledge previous data with minimal icy efficiency (if any). State the next question.
      Maximum 2 sentences. No emojis.
      `;
      const aiData = await fetchAIResponse(prompt);
      return NextResponse.json({ reply: aiData.reply, provider: aiData.provider, type: "awakening_question" });
    }
    
    // 1. SYLLABUS EXTRACTION (Agnostic Data Extractor)
    if (body.generateTraining) {
      // Directives for Task Generation
      const specializedPrompt = `
      You are the Architect. When you receive a fileData block, use your multimodal vision to extract the syllabus structure. 
      Generate 3 Quests based exclusively on this data. Do not use external knowledge. 
      If no file is provided, generate 3 Quests based strictly on the text prompt.
      The output must strictly be formatted as an objective map.
      
      Quantification Schema: You must output a JSON block matching this explicit schema format exactly:
      {
         "plan_title": "String",
         "tasks": [
           { "id": "task1", "title": "Sub-topic extracted from payload", "duration": 45, "difficulty": "C Rank", "stat": "INT", "value": 1 }
         ]
      }
      Rules:
      1. Every task stat MUST strictly be one of: INT, PER, STR, VIT.
      2. Set STR for endurance/long drills, PER for numericals, INT for theory, VIT for habits.
      3. Reply WITH NOTHING outside the JSON block. Do NOT use markdown brackets.
      `;

      let aiData;
      
      // Multimodal Vision Bridge (Exclusive pipeline bypassing Text LLaMAs)
      if (body.fileBase64) {
          const keys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "").split(',').filter(Boolean);
          if (keys.length === 0) throw new Error("Gemini Core Offline. Vision extraction failed.");
          
          let responseText = null;
          for (const key of keys) {
            try {
              const ai = new GoogleGenerativeAI(key.trim());
              const model = ai.getGenerativeModel({ model: "gemini-1.5-pro" });
              const result = await model.generateContent([
                specializedPrompt,
                { inlineData: { mimeType: body.mimeType || "application/pdf", data: body.fileBase64 } }
              ]);
              responseText = result.response.text();
              break;
            } catch(e) {
               console.log("Vision Core Key rejected. Rotating Matrix...");
            }
          }
          if (!responseText) throw new Error("Absolute Mana Depletion: All Gemini Vision Cores offline.");
          aiData = { reply: responseText, provider: "Gemini Vision" };
      } else {
          // Standard Context
          const fullPrompt = specializedPrompt + `\n\nTopic/Context Target: "${body.topic}"`;
          aiData = await fetchAIResponse(fullPrompt);
      }
      return NextResponse.json({ reply: aiData.reply, provider: aiData.provider, type: "training_plan" });
    }

    // 2. THE TRIAL (Post-Task Quiz Logic)
    if (body.triggerTrial) {
      const prompt = `
      You are the System Administrator. The user just finished studying the specific concept: "${body.topic}".
      Generate a Targeted Assessment of 5 high-level multiple choice objective questions solely related to understanding this concept.
      You must strictly return a pure JSON array containing the questions formatted exactly like this:
      [
        { "q": "Question string?", "options": ["Option A", "Option B", "Option C", "Option D"], "a": "The exact string of correct option" }
      ]
      Output ONLY the array.
      `;
      const aiData = await fetchAIResponse(prompt);
      const sanitized = aiData.reply.replace(/```json|```/g, "").trim();
      return NextResponse.json({ reply: sanitized, provider: aiData.provider, type: "trial" });
    }

    // 3. BOSS BATTLE / MASTERY SIEGE (Cross-Task Synthesis)
    if (body.triggerBossBattle) {
      const tasksStr = body.priorTasks?.map((t: any) => t.title).join(", ") || "Unknown Concepts";
      const prompt = `
      You are generating a BOSS BATTLE Mastery Siege.
      Synthesize questions assessing the culmination of the prior 3 completed tasks in the user's active session: [${tasksStr}].
      Generate a 10-question Master Test evaluating all these domains.
      Format required: 
      [
        { "q": "Question testing cross-concept logic?", "options": ["String A", "String B", "String C", "String D"], "a": "Exact String" }
      ]
      Output ONLY the array. Do not use conversational filler.
      `;
      const aiData = await fetchAIResponse(prompt);
      const sanitized = aiData.reply.replace(/```json|```/g, "").trim();
      return NextResponse.json({ reply: sanitized, provider: aiData.provider, type: "boss_battle" });
    }

    return NextResponse.json({ error: "Invalid systemic execution route." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "SYSTEM: Connection failed." }, { status: 500 });
  }
}
