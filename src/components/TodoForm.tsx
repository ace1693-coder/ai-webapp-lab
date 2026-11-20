import { useState, type FormEvent } from 'react';
import { MAX_TITLE_LENGTH } from '../lib/storage';

interface TodoFormProps {
  onAdd: (title: string) => boolean;
}

export function TodoForm({ onAdd }: TodoFormProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const added = onAdd(value);
    if (!added) {
      setError('할 일 내용을 입력해 주세요.');
      return;
    }
    setError(null);
    setValue('');
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit} noValidate>
      <label className="sr-only" htmlFor="todo-input">
        새 할 일
      </label>
      <input
        id="todo-input"
        data-testid="todo-input"
        className="todo-form__input"
        type="text"
        placeholder="할 일을 입력하고 Enter"
        value={value}
        maxLength={MAX_TITLE_LENGTH}
        aria-invalid={error !== null}
        aria-describedby={error ? 'todo-input-error' : undefined}
        onChange={(event) => {
          setValue(event.target.value);
          if (error) setError(null);
        }}
      />
      <button type="submit" className="todo-form__submit" data-testid="todo-add">
        추가
      </button>
      {error ? (
        <p className="todo-form__error" id="todo-input-error" role="alert" data-testid="todo-error">
          {error}
        </p>
      ) : null}
    </form>
  );
}
