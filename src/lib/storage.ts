import type { Todo } from '../types';

export const STORAGE_KEY = 'ai-webapp-lab.todos.v1';
export const MAX_TITLE_LENGTH = 120;

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.done === 'boolean' &&
    typeof candidate.createdAt === 'number'
  );
}

/**
 * localStorage에서 할 일 목록을 읽는다.
 * 저장소가 비어 있으면 빈 배열, 값이 깨졌으면 빈 배열을 돌려주고 쓰레기 값은 지운다.
 * (테스트에서 storage를 주입할 수 있도록 인자로 받는다.)
 */
export function loadTodos(storage: Pick<Storage, 'getItem' | 'removeItem'> = window.localStorage): Todo[] {
  let raw: string | null = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return [];
  }
  if (raw === null) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('stored value is not an array');
    return parsed.filter(isTodo).map((todo) => ({
      ...todo,
      updatedAt: typeof todo.updatedAt === 'number' ? todo.updatedAt : todo.createdAt,
    }));
  } catch {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      /* 저장소를 지울 수 없어도 앱은 계속 동작해야 한다 */
    }
    return [];
  }
}

/** 할 일 목록을 localStorage에 저장한다. 저장 실패(사생활 보호 모드, 용량 초과)는 false로 알린다. */
export function saveTodos(
  todos: Todo[],
  storage: Pick<Storage, 'setItem'> = window.localStorage,
): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(todos));
    return true;
  } catch {
    return false;
  }
}
