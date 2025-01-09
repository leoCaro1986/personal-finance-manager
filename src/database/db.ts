import Dexie, { Table } from 'dexie';
import { Transaction, Category, SavingsGoal } from '../types';

class AppDatabase extends Dexie {
  transactions!: Table<Transaction, number>;
  categories!: Table<Category, number>;
  savingsGoals!: Table<SavingsGoal, number>;

  constructor() {
    super('FinanceManagerDB');
    
    this.version(1).stores({
      transactions: '++id, type, amount, category, date, createdAt',
      categories: '++id, name, type, isDefault, createdAt',
      savingsGoals: '++id, name, targetAmount, currentAmount, deadline, category, createdAt, completed'
    });

    // Agregar categorías por defecto
    this.on('populate', () => {
      this.categories.bulkAdd([
        { name: 'Salario', type: 'ingreso', isDefault: true, createdAt: new Date() },
        { name: 'Freelance', type: 'ingreso', isDefault: true, createdAt: new Date() },
        { name: 'Inversiones', type: 'ingreso', isDefault: true, createdAt: new Date() },
        { name: 'Alquiler', type: 'gasto', isDefault: true, createdAt: new Date() },
        { name: 'Servicios', type: 'gasto', isDefault: true, createdAt: new Date() },
        { name: 'Alimentación', type: 'gasto', isDefault: true, createdAt: new Date() },
        { name: 'Transporte', type: 'gasto', isDefault: true, createdAt: new Date() },
        { name: 'Entretenimiento', type: 'gasto', isDefault: true, createdAt: new Date() },
      ]);
    });
  }

  async addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<number> {
    const id = await this.transactions.add({
      ...transaction,
      date: new Date(transaction.date),
      createdAt: new Date(),
    });
    return id as number;
  }

  async getTransactions(): Promise<Transaction[]> {
    const transactions = await this.transactions.orderBy('date').reverse().toArray();
    return transactions.map(transaction => ({
      ...transaction,
      date: new Date(transaction.date),
    }));
  }

  async deleteTransaction(id: number): Promise<void> {
    await this.transactions.delete(id);
  }

  async addCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<number> {
    const id = await this.categories.add({
      ...category,
      createdAt: new Date(),
    });
    return id as number;
  }

  async getCategories(): Promise<Category[]> {
    return await this.categories.toArray();
  }

  async deleteCategory(id: number): Promise<void> {
    await this.categories.delete(id);
  }

  async addSavingsGoal(goal: Omit<SavingsGoal, 'id' | 'createdAt'>): Promise<number> {
    const id = await this.savingsGoals.add({
      ...goal,
      deadline: new Date(goal.deadline),
      createdAt: new Date(),
    });
    return id as number;
  }

  async getSavingsGoals(): Promise<SavingsGoal[]> {
    const goals = await this.savingsGoals.orderBy('deadline').toArray();
    return goals.map(goal => ({
      ...goal,
      deadline: new Date(goal.deadline),
    }));
  }

  async updateSavingsGoal(id: number, updates: Partial<SavingsGoal>): Promise<void> {
    await this.savingsGoals.update(id, updates);
  }

  async deleteSavingsGoal(id: number): Promise<void> {
    await this.savingsGoals.delete(id);
  }
}

export const db = new AppDatabase();
