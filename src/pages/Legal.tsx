import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PageContainer = ({ title, children }: { title: string, children: React.ReactNode }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen w-full bg-black text-white/80 p-6 sm:p-12 font-sans overflow-y-auto">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center text-cyan-400 hover:text-cyan-300 transition-colors mb-8 text-sm font-bold uppercase tracking-wider"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Back
      </button>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-6 pb-20"
      >
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-8">{title}</h1>
        <div className="space-y-6 text-sm leading-relaxed">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export const PrivacyPolicy = () => (
  <PageContainer title="Privacy Policy">
    <p className="text-cyan-400 font-black tracking-widest text-[10px] uppercase">Last updated: {new Date().toLocaleDateString()}</p>
    <h2 className="text-xl font-black italic tracking-tight text-white mt-8 mb-4">1. Information We Collect</h2>
    <p>Orbis ("we", "us", "our") collects information you provide directly to us when you create an account, update your profile, use the interactive features of our services, or otherwise communicate with us. This includes your email address, username, profile picture, and interaction data.</p>
    
    <h2 className="text-xl font-black italic tracking-tight text-white mt-8 mb-4">2. How We Use Information</h2>
    <p>We use the information we collect to provide, maintain, and improve our services. We also use the information to personalize your experience, provide customer support, and send you technical notices and updates.</p>
    
    <h2 className="text-xl font-black italic tracking-tight text-white mt-8 mb-4">3. Data Security</h2>
    <p>We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. However, no security system is impenetrable, and we cannot guarantee the security of our systems 100%.</p>
    
    <h2 className="text-xl font-black italic tracking-tight text-white mt-8 mb-4">4. Third-Party Services</h2>
    <p>Our application may contain links to third-party websites or services. We are not responsible for the privacy practices or content of these third-party sites. We use services like Supabase for authentication and database management; their privacy policies apply to the data they process on our behalf.</p>
    
    <h2 className="text-xl font-black italic tracking-tight text-white mt-8 mb-4">5. Contact Us</h2>
    <p>If you have any questions about this Privacy Policy, please contact us at privacy@orbis.com.</p>
  </PageContainer>
);

export const TermsOfService = () => (
  <PageContainer title="Terms of Service">
    <p className="text-cyan-400 font-black tracking-widest text-[10px] uppercase">Last updated: {new Date().toLocaleDateString()}</p>
    <h2 className="text-xl font-black italic tracking-tight text-white mt-8 mb-4">1. Acceptance of Terms</h2>
    <p>By accessing or using Orbis (the "Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service.</p>
    
    <h2 className="text-xl font-black italic tracking-tight text-white mt-8 mb-4">2. User Accounts</h2>
    <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</p>
    
    <h2 className="text-xl font-black italic tracking-tight text-white mt-8 mb-4">3. Acceptable Use</h2>
    <p>You agree not to use the Service to upload, post, or transmit any content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, invasive of another's privacy, hateful, or otherwise objectionable.</p>
    
    <h2 className="text-xl font-black italic tracking-tight text-white mt-8 mb-4">4. Intellectual Property</h2>
    <p>The Service and its original content, features, and functionality are and will remain the exclusive property of Orbis and its licensors. The Service is protected by copyright, trademark, and other laws.</p>
    
    <h2 className="text-xl font-black italic tracking-tight text-white mt-8 mb-4">5. Termination</h2>
    <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.</p>
  </PageContainer>
);
