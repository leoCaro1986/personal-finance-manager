import React, { createContext, useContext, useEffect, useState } from 'react';
import { Transaction, db } from '../database/db';

interface TransactionsContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  monthlyTotals: {
    income: number;
    expenses: number;
  };
  loading: boolean;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState({ income: 0, expenses: 0 });
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    try {
      const loadedTransactions = await db.getTransactions();
      setTransactions(loadedTransactions);

      const currentDate = new Date();
      const totals = await db.getMonthlyTotals(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1
      );
      setMonthlyTotals(totals);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      await db.addTransaction(transaction);
      await loadTransactions();
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: number) => {
    try {
      await db.deleteTransaction(id);
      await loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  return (
    <TransactionsContext.Provider
      value={{
        transactions,
        addTransaction,
        deleteTransaction,
        monthlyTotals,
        loading,
      }}
    >
      {children}
    </TransactionsContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
};
