import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kutrryjfdbtsngkwhpny.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1dHJyeWpmZGJ0c25na3docG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDAyMTMsImV4cCI6MjA5NDE3NjIxM30.Dz0s6yCv7G5NKAFIpreepqfuTspezaXwTj6UgIg9GBE';

const hybridStorage = {
  getItem: (key: string): string | null => {
    try {
      const val = localStorage.getItem(key);
      if (val) return val;
    } catch (e) {}

    try {
      const name = key + "=";
      const decodedCookie = decodeURIComponent(document.cookie);
      const ca = decodedCookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1);
        if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
      }
    } catch (e) {}
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {}

    try {
      const d = new Date();
      d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
      const expires = "expires=" + d.toUTCString();
      document.cookie = key + "=" + value + ";" + expires + ";path=/;SameSite=Lax;Secure";
    } catch (e) {}
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {}

    try {
      document.cookie = key + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;SameSite=Lax;Secure";
    } catch (e) {}
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: hybridStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
