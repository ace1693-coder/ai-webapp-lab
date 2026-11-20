/**
 * 실제 브라우저(Chromium)에서 프로덕션 빌드(dist/)를 열어 핵심 기능을 검증하는 선택 스크립트.
 *
 * 준비:
 *   npm run build
 *   npm i -D playwright && npx playwright install chromium   (최초 1회)
 * 실행:
 *   node e2e/browser-check.mjs
 *
 * 검증 항목: 등록 / 빈 입력 방지 / 수정 / 완료 토글 / 삭제 / 새로고침 후 유지 / localStorage 내용
 * 결과: e2e/screenshots/*.png 캡처 + 콘솔 로그. 실패 시 exit code 1.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../dist', import.meta.url));
const shotDir = fileURLToPath(new URL('./screenshots', import.meta.url));
const PORT = 4183;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
};

if (!existsSync(join(root, 'index.html'))) {
  console.error('dist/index.html이 없습니다. 먼저 `npm run build`를 실행하세요.');
  process.exit(1);
}

const server = createServer(async (req, res) => {
  const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/');
  const relative = normalize(urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, ''));
  const filePath = join(root, relative);
  try {
    const body = await readFile(filePath);
    res.writeHead(200, { 'content-type': MIME[extname(filePath)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});

await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${PORT}/`;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 2 });
const page = await context.newPage();
const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(String(err)));

const steps = [];
function step(name, detail) {
  steps.push({ name, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

const items = () => page.locator('[data-testid="todo-item"]');
const titles = () => page.locator('[data-testid="todo-title"]');
const storageDump = () => page.evaluate(() => window.localStorage.getItem('ai-webapp-lab.todos.v1'));

try {
  // 1. 최초 로드
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="todo-empty"]');
  assert.equal(await page.title(), 'AI Webapp Lab — 할 일 관리');
  step('최초 로드', '빈 목록 안내 표시');
  await page.screenshot({ path: join(shotDir, '1-empty.png'), fullPage: true });

  // 2. 등록
  await page.fill('[data-testid="todo-input"]', '장보기 목록 정리');
  await page.click('[data-testid="todo-add"]');
  await page.fill('[data-testid="todo-input"]', '주간 보고서 작성');
  await page.press('[data-testid="todo-input"]', 'Enter');
  assert.equal(await items().count(), 2);
  assert.equal(await titles().first().innerText(), '주간 보고서 작성');
  step('등록 2건', '최신 항목이 맨 위');

  // 3. 빈 입력 방지
  await page.fill('[data-testid="todo-input"]', '   ');
  await page.click('[data-testid="todo-add"]');
  await page.waitForSelector('[data-testid="todo-error"]');
  assert.equal(await items().count(), 2);
  step('빈 입력 방지', '오류 문구 표시, 항목 수 그대로 2건');
  await page.fill('[data-testid="todo-input"]', '');

  // 4. 수정
  await items().nth(1).locator('[data-testid="todo-edit"]').click();
  await page.fill('[data-testid="todo-edit-input"]', '장보기 목록 (우유·계란)');
  await page.click('[data-testid="todo-save"]');
  assert.equal(await titles().nth(1).innerText(), '장보기 목록 (우유·계란)');
  step('수정', '장보기 목록 정리 → 장보기 목록 (우유·계란)');

  // 5. 완료 토글
  await items().nth(0).locator('[data-testid="todo-toggle"]').check();
  assert.match(await page.locator('[data-testid="todo-status"]').innerText(), /완료 1개/);
  step('완료 처리', '주간 보고서 작성 체크, 취소선 적용');
  await page.screenshot({ path: join(shotDir, '2-after-edit-toggle.png'), fullPage: true });

  // 6. 새로고침 후 유지
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="todo-list"]');
  assert.equal(await items().count(), 2);
  assert.equal(await titles().nth(1).innerText(), '장보기 목록 (우유·계란)');
  assert.equal(await items().nth(0).locator('[data-testid="todo-toggle"]').isChecked(), true);
  const storedAfterReload = JSON.parse(await storageDump());
  assert.equal(storedAfterReload.length, 2);
  step('새로고침 후 유지', `localStorage에 ${storedAfterReload.length}건, 완료 상태 유지`);
  await page.screenshot({ path: join(shotDir, '3-after-reload.png'), fullPage: true });

  // 7. 필터
  await page.click('[data-testid="filter-done"]');
  assert.equal(await items().count(), 1);
  await page.click('[data-testid="filter-all"]');
  assert.equal(await items().count(), 2);
  step('필터', '완료 1건 / 전체 2건');

  // 8. 삭제 + 재새로고침 확인
  await items().nth(0).locator('[data-testid="todo-delete"]').click();
  assert.equal(await items().count(), 1);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('[data-testid="todo-list"]');
  assert.equal(await items().count(), 1);
  assert.equal(await titles().first().innerText(), '장보기 목록 (우유·계란)');
  step('삭제 후 새로고침', '삭제한 항목이 다시 나타나지 않음');
  await page.screenshot({ path: join(shotDir, '4-after-delete-reload.png'), fullPage: true });

  assert.deepEqual(errors, [], `콘솔 오류: ${errors.join(' | ')}`);
  step('콘솔 오류 없음');

  console.log(`\n브라우저 E2E 통과: ${steps.length}개 검증 항목`);
} catch (error) {
  await page.screenshot({ path: join(shotDir, 'failed.png'), fullPage: true }).catch(() => {});
  console.error('\n브라우저 E2E 실패:', error);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
