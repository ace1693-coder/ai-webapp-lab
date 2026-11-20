import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Todo, TodoFilter } from '../types';
import { MAX_TITLE_LENGTH, loadTodos, saveTodos } from '../lib/storage';

export interface UseTodos {
  todos: Todo[];
  visibleTodos: Todo[];
  filter: TodoFilter;
  setFilter: (filter: TodoFilter) => void;
  remainingCount: number;
  completedCount: number;
  canSave: boolean;
  add: (title: string) => boolean;
  rename: (id: string, title: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clearCompleted: () => void;
}

let idCounter = 0;
function createId(): string {
  idCounter += 1;
  const random = Math.random().toString(36).slice(2, 8);
  return `todo-${Date.now().toString(36)}-${idCounter}-${random}`;
}

/** 입력값을 정리하고 검증한다. 빈 문자열이면 null. */
export function normalizeTitle(raw: string): string | null {
  const title = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_TITLE_LENGTH);
  return title.length > 0 ? title : null;
}

export function useTodos(): UseTodos {
  const [todos, setTodos] = useState<Todo[]>(() => loadTodos());
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [canSave, setCanSave] = useState(true);
  const isFirstRender = useRef(true);

  // 상태가 바뀔 때마다 localStorage에 반영한다. 첫 렌더링 때는 이미 저장된 값을 읽어온 상태이므로 쓰지 않는다.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCanSave(saveTodos(todos));
  }, [todos]);

  const add = useCallback((raw: string): boolean => {
    const title = normalizeTitle(raw);
    if (!title) return false;
    const now = Date.now();
    setTodos((prev) => [{ id: createId(), title, done: false, createdAt: now, updatedAt: now }, ...prev]);
    return true;
  }, []);

  const rename = useCallback((id: string, raw: string): boolean => {
    const title = normalizeTitle(raw);
    if (!title) return false;
    setTodos((prev) => {
      const target = prev.find((todo) => todo.id === id);
      if (!target || target.title === title) return prev;
      return prev.map((todo) => (todo.id === id ? { ...todo, title, updatedAt: Date.now() } : todo));
    });
    return true;
  }, []);

  const toggle = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, done: !todo.done, updatedAt: Date.now() } : todo)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setTodos((prev) => prev.filter((todo) => !todo.done));
  }, []);

  const visibleTodos = useMemo(() => {
    if (filter === 'active') return todos.filter((todo) => !todo.done);
    if (filter === 'done') return todos.filter((todo) => todo.done);
    return todos;
  }, [filter, todos]);

  const completedCount = useMemo(() => todos.filter((todo) => todo.done).length, [todos]);

  return {
    todos,
    visibleTodos,
    filter,
    setFilter,
    remainingCount: todos.length - completedCount,
    completedCount,
    canSave,
    add,
    rename,
    toggle,
    remove,
    clearCompleted,
  };
}
