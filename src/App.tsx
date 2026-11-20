import { useMemo } from 'react';
import { TodoForm } from './components/TodoForm';
import { TodoItem } from './components/TodoItem';
import { useTodos } from './hooks/useTodos';
import type { TodoFilter } from './types';

const FILTERS: Array<{ key: TodoFilter; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'active', label: '진행 중' },
  { key: 'done', label: '완료' },
];

const EMPTY_MESSAGE: Record<TodoFilter, string> = {
  all: '아직 등록된 할 일이 없습니다.',
  active: '진행 중인 할 일이 없습니다.',
  done: '완료된 할 일이 없습니다.',
};

export default function App() {
  const todos = useTodos();

  const statusText = useMemo(() => {
    if (todos.todos.length === 0) return '할 일을 추가해 보세요.';
    return `전체 ${todos.todos.length}개 · 진행 중 ${todos.remainingCount}개 · 완료 ${todos.completedCount}개`;
  }, [todos.todos.length, todos.remainingCount, todos.completedCount]);

  return (
    <main className="app">
      <header className="app__header">
        <p className="app__eyebrow">React + TypeScript + Vite</p>
        <h1 className="app__title">AI Webapp Lab</h1>
        <p className="app__subtitle">할 일을 등록·수정·완료·삭제하면 브라우저에 그대로 저장됩니다.</p>
      </header>

      <section className="card" aria-label="할 일 관리">
        <TodoForm onAdd={todos.add} />

        <div className="toolbar">
          <div className="filters" role="group" aria-label="목록 필터">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`chip${todos.filter === key ? ' chip--active' : ''}`}
                data-testid={`filter-${key}`}
                aria-pressed={todos.filter === key}
                onClick={() => todos.setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="toolbar__status" data-testid="todo-status">
            {statusText}
          </p>
        </div>

        {todos.visibleTodos.length > 0 ? (
          <ul className="todo-list" data-testid="todo-list">
            {todos.visibleTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={todos.toggle}
                onRename={todos.rename}
                onRemove={todos.remove}
              />
            ))}
          </ul>
        ) : (
          <p className="empty" data-testid="todo-empty">
            {EMPTY_MESSAGE[todos.filter]}
          </p>
        )}

        <footer className="card__footer">
          <button
            type="button"
            className="btn"
            data-testid="clear-completed"
            onClick={todos.clearCompleted}
            disabled={todos.completedCount === 0}
          >
            완료 항목 지우기
          </button>
          {todos.canSave ? (
            <span className="save-state" data-testid="save-state">
              자동 저장됨
            </span>
          ) : (
            <span className="save-state save-state--warn" role="alert" data-testid="save-state">
              브라우저 저장에 실패했습니다. 시크릿 모드인지 확인해 주세요.
            </span>
          )}
        </footer>
      </section>

      <p className="app__note">
        데이터는 이 브라우저의 localStorage(<code>ai-webapp-lab.todos.v1</code>)에만 저장됩니다. 서버·로그인·DB를 쓰지
        않습니다.
      </p>
    </main>
  );
}
