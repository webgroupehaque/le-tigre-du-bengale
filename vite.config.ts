import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: { port: 3000, host: '0.0.0.0' },
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@kit$/, replacement: path.resolve(__dirname, 'kit/index.ts') },
      { find: /^@kit\//, replacement: `${path.resolve(__dirname, 'kit')}/` },
      { find: /^@\//, replacement: `${path.resolve(__dirname, '.')}/` },
    ],
  },
});
