import Dexie, { Table } from 'dexie';

export interface Transaction {
  id?: number;
  type: 'ingreso' | 'gasto';
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: Date;
}

export interface Category {
  id?: number;
  name: string;
  type: 'ingreso' | 'gasto';
  isDefault: boolean;
}

export class FinanceDatabase extends Dexie {
  transactions!: Table<Transaction>;
  categories!: Table<Category>;

  constructor() {
    super('FinanceDatabase');
    this.version(2).stores({
      transactions: '++id, type, category, date, createdAt',
      categories: '++id, name, type',
    });

    // Agregar categorías por defecto si no existen
    this.on('ready', async () => {
      const categoriesCount = await this.categories.count();
      if (categoriesCount === 0) {
        const defaultCategories: Omit<Category, 'id'>[] = [
          { name: 'Salario', type: 'ingreso', isDefault: true },
          { name: 'Freelance', type: 'ingreso', isDefault: true },
          { name: 'Inversiones', type: 'ingreso', isDefault: true },
          { name: 'Alimentación', type: 'gasto', isDefault: true },
          { name: 'Transporte', type: 'gasto', isDefault: true },
          { name: 'Servicios', type: 'gasto', isDefault: true },
          { name: 'Entretenimiento', type: 'gasto', isDefault: true },
        ];
        await this.categories.bulkAdd(defaultCategories);
      }
    });
  }

  async addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>) {
    return await this.transactions.add({
      ...transaction,
      createdAt: new Date(),
    });
  }

  async getTransactions() {
    return await this.transactions.orderBy('date').reverse().toArray();
  }

  async getTransactionsByDateRange(startDate: string, endDate: string) {
    return await this.transactions
      .where('date')
      .between(startDate, endDate)
      .toArray();
  }

  async getTransactionsByType(type: 'ingreso' | 'gasto') {
    return await this.transactions
      .where('type')
      .equals(type)
      .toArray();
  }

  async deleteTransaction(id: number) {
    return await this.transactions.delete(id);
  }

  async getMonthlyTotals(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    const transactions = await this.getTransactionsByDateRange(startDate, endDate);
    
    return transactions.reduce(
      (acc, curr) => {
        if (curr.type === 'ingreso') {
          acc.income += curr.amount;
        } else {
          acc.expenses += curr.amount;
        }
        return acc;
      },
      { income: 0, expenses: 0 }
    );
  }

  // Métodos para categorías
  async getCategories(type: 'ingreso' | 'gasto') {
    return await this.categories
      .where('type')
      .equals(type)
      .toArray();
  }

  async addCategory(category: Omit<Category, 'id'>) {
    return await this.categories.add(category);
  }

  async deleteCategory(id: number) {
    return await this.categories.delete(id);
  }
}

// Exportar una instancia de la base de datos
export const db = new FinanceDatabase();
