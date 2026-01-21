import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Usar './' torna o build relativo, permitindo que funcione em qualquer caminho (raiz ou subpasta)
  base: './', 
});