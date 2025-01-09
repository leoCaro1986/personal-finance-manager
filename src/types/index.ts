export interface Transaction {
  id?: number;
  type: 'ingreso' | 'gasto';
  amount: number;
  category: string;
  description: string;
  date: Date;
  createdAt?: Date;
}

export interface Category {
  id?: number;
  name: string;
  type: 'ingreso' | 'gasto';
  isDefault?: boolean;
  createdAt?: Date;
}

export interface SavingsGoal {
  id?: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  category: string;
  description?: string;
  createdAt?: Date;
  completed: boolean;
}
