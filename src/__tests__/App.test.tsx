import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { STORAGE_KEY } from '../lib/storage';
import type { Todo } from '../types';

function readStored(): Todo[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Todo[]) : [];
}

async function addTodo(title: string) {
  const user = userEvent.setup();
  await user.type(screen.getByTestId('todo-input'), title);
  await user.click(screen.getByTestId('todo-add'));
}

function items() {
  return screen.queryAllByTestId('todo-item');
}

describe('AI Webapp Lab — 할 일 관리', () => {
  it('할 일을 등록하면 목록과 localStorage에 저장된다', async () => {
    render(<App />);
    expect(screen.getByTestId('todo-empty')).toHaveTextContent('아직 등록된 할 일이 없습니다.');

    await addTodo('우유 사기');

    const list = screen.getByTestId('todo-list');
    expect(within(list).getByText('우유 사기')).toBeInTheDocument();
    expect(screen.getByTestId('todo-input')).toHaveValue('');
    expect(screen.getByTestId('todo-status')).toHaveTextContent('전체 1개 · 진행 중 1개 · 완료 0개');

    const stored = readStored();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ title: '우유 사기', done: false });
  });

  it('여러 개를 등록하면 최신 항목이 위에 온다', async () => {
    render(<App />);
    await addTodo('첫 번째');
    await addTodo('두 번째');

    const titles = items().map((item) => within(item).getByTestId('todo-title').textContent);
    expect(titles).toEqual(['두 번째', '첫 번째']);
    expect(readStored().map((todo) => todo.title)).toEqual(['두 번째', '첫 번째']);
  });

  it('빈 값·공백만 입력하면 등록되지 않고 오류를 보여 준다', async () => {
    render(<App />);

    await addTodo('   ');

    expect(screen.getByTestId('todo-error')).toHaveTextContent('할 일 내용을 입력해 주세요.');
    expect(items()).toHaveLength(0);
    expect(readStored()).toHaveLength(0);
  });

  it('앞뒤 공백과 연속 공백을 정리해 등록한다', async () => {
    render(<App />);
    await addTodo('  장보기    목록  ');

    expect(screen.getByTestId('todo-title')).toHaveTextContent('장보기 목록');
  });

  it('할 일을 수정하면 목록과 localStorage에 반영된다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTodo('운동 30분');

    await user.click(screen.getByTestId('todo-edit'));
    const input = screen.getByTestId('todo-edit-input');
    expect(input).toHaveValue('운동 30분');
    expect(input).toHaveFocus();

    await user.clear(input);
    await user.type(input, '운동 1시간');
    await user.click(screen.getByTestId('todo-save'));

    expect(screen.getByTestId('todo-title')).toHaveTextContent('운동 1시간');
    expect(screen.queryByTestId('todo-edit-input')).not.toBeInTheDocument();
    expect(readStored()[0]?.title).toBe('운동 1시간');
  });

  it('수정을 Enter로 저장하고 Escape로 취소할 수 있다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTodo('독서');

    await user.click(screen.getByTestId('todo-edit'));
    await user.clear(screen.getByTestId('todo-edit-input'));
    await user.type(screen.getByTestId('todo-edit-input'), '독서 20쪽{Enter}');
    expect(screen.getByTestId('todo-title')).toHaveTextContent('독서 20쪽');

    await user.click(screen.getByTestId('todo-edit'));
    await user.clear(screen.getByTestId('todo-edit-input'));
    await user.type(screen.getByTestId('todo-edit-input'), '버려질 값{Escape}');
    expect(screen.getByTestId('todo-title')).toHaveTextContent('독서 20쪽');
    expect(readStored()[0]?.title).toBe('독서 20쪽');
  });

  it('수정 내용이 비어 있으면 저장하지 않고 오류를 보여 준다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTodo('청소');

    await user.click(screen.getByTestId('todo-edit'));
    await user.clear(screen.getByTestId('todo-edit-input'));
    await user.click(screen.getByTestId('todo-save'));

    expect(screen.getByTestId('todo-edit-error')).toHaveTextContent('수정할 내용을 입력해 주세요.');
    expect(readStored()[0]?.title).toBe('청소');
  });

  it('체크박스로 완료 처리/해제가 되고 저장된다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTodo('설거지');

    const checkbox = screen.getByTestId('todo-toggle');
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.getByTestId('todo-item')).toHaveClass('todo-item--done');
    expect(screen.getByTestId('todo-status')).toHaveTextContent('진행 중 0개 · 완료 1개');
    expect(readStored()[0]?.done).toBe(true);

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(readStored()[0]?.done).toBe(false);
  });

  it('할 일을 삭제하면 목록과 localStorage에서 사라진다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTodo('남길 일');
    await addTodo('지울 일');

    const target = screen.getByText('지울 일').closest('[data-testid="todo-item"]');
    expect(target).not.toBeNull();
    await user.click(within(target as HTMLElement).getByTestId('todo-delete'));

    expect(screen.queryByText('지울 일')).not.toBeInTheDocument();
    expect(items()).toHaveLength(1);
    expect(readStored().map((todo) => todo.title)).toEqual(['남길 일']);
  });

  it('새로고침(재마운트)해도 등록·수정·완료 상태가 유지된다', async () => {
    const user = userEvent.setup();
    const first = render(<App />);

    await addTodo('장보기');
    await addTodo('세차');
    await user.click(screen.getAllByTestId('todo-toggle')[0]!); // '세차'를 완료 처리
    await user.click(screen.getAllByTestId('todo-edit')[1]!);
    await user.clear(screen.getByTestId('todo-edit-input'));
    await user.type(screen.getByTestId('todo-edit-input'), '장보기(수정)');
    await user.click(screen.getByTestId('todo-save'));

    first.unmount(); // 브라우저 새로고침과 같은 효과: 컴포넌트 상태가 모두 사라진다

    render(<App />);

    const after = items();
    expect(after).toHaveLength(2);
    expect(within(after[0]!).getByTestId('todo-title')).toHaveTextContent('세차');
    expect(within(after[0]!).getByTestId('todo-toggle')).toBeChecked();
    expect(within(after[1]!).getByTestId('todo-title')).toHaveTextContent('장보기(수정)');
    expect(within(after[1]!).getByTestId('todo-toggle')).not.toBeChecked();
    expect(screen.getByTestId('todo-status')).toHaveTextContent('전체 2개 · 진행 중 1개 · 완료 1개');
  });

  it('필터로 전체·진행 중·완료 목록을 나눠 본다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTodo('진행 항목');
    await addTodo('완료 항목');
    await user.click(screen.getAllByTestId('todo-toggle')[0]!); // 최신 항목 = '완료 항목'

    await user.click(screen.getByTestId('filter-active'));
    expect(items()).toHaveLength(1);
    expect(screen.getByTestId('todo-title')).toHaveTextContent('진행 항목');

    await user.click(screen.getByTestId('filter-done'));
    expect(items()).toHaveLength(1);
    expect(screen.getByTestId('todo-title')).toHaveTextContent('완료 항목');

    await user.click(screen.getByTestId('filter-all'));
    expect(items()).toHaveLength(2);
  });

  it('완료 항목 지우기로 완료된 것만 삭제한다', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTodo('남는 항목');
    await addTodo('지워질 항목');
    await user.click(screen.getAllByTestId('todo-toggle')[0]!);

    await user.click(screen.getByTestId('clear-completed'));

    expect(items()).toHaveLength(1);
    expect(screen.getByTestId('todo-title')).toHaveTextContent('남는 항목');
    expect(readStored().map((todo) => todo.title)).toEqual(['남는 항목']);
    expect(screen.getByTestId('clear-completed')).toBeDisabled();
  });

  it('localStorage 값이 깨져 있어도 앱이 죽지 않고 빈 목록으로 시작한다', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json');
    render(<App />);

    expect(screen.getByTestId('todo-empty')).toBeInTheDocument();
    expect(items()).toHaveLength(0);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('형식이 맞지 않는 항목은 걸러 내고 정상 항목만 복구한다', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: 'a', title: '정상 항목', done: false, createdAt: 1, updatedAt: 1 },
        { id: 'b', title: 123, done: false },
        null,
      ]),
    );
    render(<App />);

    expect(items()).toHaveLength(1);
    expect(screen.getByTestId('todo-title')).toHaveTextContent('정상 항목');
  });
});
