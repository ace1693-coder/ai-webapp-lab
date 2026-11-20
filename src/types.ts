export interface Todo {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
  updatedAt: number;
}

export type TodoFilter = 'all' | 'active' | 'done';
