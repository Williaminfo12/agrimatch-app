import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Maps VITE_GOOGLE_API_KEY from Vercel to process.env.API_KEY for the app
      'process.env.API_KEY': JSON.stringify(env.VITE_GOOGLE_API_KEY || '')
    }
  };
});