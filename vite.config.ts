import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config
export default defineConfig({
  plugins: [react()],
  // 빌드 산출물의 자산 경로를 상대 경로로 둔다.
  // - GitHub Pages 프로젝트 사이트(https://<user>.github.io/ai-webapp-lab/)처럼
  //   하위 경로에 올려도, 루트(Cloudflare Pages·Vercel·Netlify)에 올려도 그대로 동작한다.
  // - 클라이언트 라우터로 중첩 경로를 쓰지 않는 단일 페이지 앱이라 상대 경로로 충분하다.
  base: './',
  // 로컬 개발/테스트 서버는 루프백 주소를 직접 쓴다(DNS에 localhost가 없는 환경에서도 동작).
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1', port: 4173 },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
