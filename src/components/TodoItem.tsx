import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Todo } from '../types';
import { MAX_TITLE_LENGTH } from '../lib/storage';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onRename: (id: string, title: string) => boolean;
  onRemove: (id: string) => void;
}

export function TodoItem({ todo, onToggle, onRename, onRemove }: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function startEditing() {
    setDraft(todo.title);
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setError(null);
    setDraft(todo.title);
  }

  function commit() {
    if (!onRename(todo.id, draft)) {
      setError('수정할 내용을 입력해 주세요.');
      inputRef.current?.focus();
      return;
    }
    setEditing(false);
    setError(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      commit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditing();
    }
  }

  return (
    <li className={`todo-item${todo.done ? ' todo-item--done' : ''}`} data-testid="todo-item" data-id={todo.id}>
      <input
        type="checkbox"
        className="todo-item__check"
        data-testid="todo-toggle"
        checked={todo.done}
        aria-label={`${todo.title} 완료 표시`}
        onChange={() => onToggle(todo.id)}
      />

      {editing ? (
        <div className="todo-item__edit">
          <label className="sr-only" htmlFor={`edit-${todo.id}`}>
            할 일 수정
          </label>
          <input
            id={`edit-${todo.id}`}
            ref={inputRef}
            className="todo-item__edit-input"
            data-testid="todo-edit-input"
            value={draft}
            maxLength={MAX_TITLE_LENGTH}
            aria-invalid={error !== null}
            onChange={(event) => {
              setDraft(event.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
          />
          {error ? (
            <p className="todo-item__error" role="alert" data-testid="todo-edit-error">
              {error}
            </p>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          className="todo-item__title"
          data-testid="todo-title"
          title="눌러서 수정"
          onClick={startEditing}
        >
          {todo.title}
        </button>
      )}

      <div className="todo-item__actions">
        {editing ? (
          <>
            <button type="button" className="btn btn--primary" data-testid="todo-save" onClick={commit}>
              저장
            </button>
            <button type="button" className="btn" data-testid="todo-cancel" onClick={cancelEditing}>
              취소
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn" data-testid="todo-edit" onClick={startEditing}>
              수정
            </button>
            <button
              type="button"
              className="btn btn--danger"
              data-testid="todo-delete"
              onClick={() => onRemove(todo.id)}
            >
              삭제
            </button>
          </>
        )}
      </div>
    </li>
  );
}
