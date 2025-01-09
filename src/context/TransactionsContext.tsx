import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../database/db';
import { Transaction } from '../types';
import { useSettings } from './SettingsContext';
import { useSavings } from './SavingsContext';

interface TransactionsContextType {
  transactions: Transaction[];
  loading: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export const useTransactions = () => {
  const context = useContext(TransactionsContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
};

export const TransactionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSettings();
  const { contributeToGoal } = useSavings();

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const loadedTransactions = await db.getTransactions();
      setTransactions(loadedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAutoSavings = async (transaction: Transaction) => {
    const { autoSavings } = settings;
    
    if (!autoSavings?.enabled || transaction.type !== 'ingreso') {
      return;
    }

    try {
      // Calcular el balance actual
      const currentBalance = transactions.reduce((acc, t) => {
        return acc + (t.type === 'ingreso' ? t.amount : -t.amount);
      }, 0);

      // Verificar si el balance es suficiente
      if (currentBalance < autoSavings.minimumBalance) {
        console.log('Balance insuficiente para ahorro automático');
        return;
      }

      // Calcular el monto a ahorrar
      const savingsAmount = (transaction.amount * autoSavings.percentage) / 100;

      // Contribuir a la meta de ahorro
      if (autoSavings.targetGoalId) {
        await contributeToGoal(Number(autoSavings.targetGoalId), savingsAmount);
        console.log(`Ahorro automático: ${savingsAmount} agregado a la meta de ahorro`);
      }
    } catch (error) {
      console.error('Error processing auto-savings:', error);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      const id = await db.addTransaction(transaction);
      const newTransaction = {
        ...transaction,
        id,
        createdAt: new Date(),
      };

      setTransactions(prev => [...prev, newTransaction]);

      // Procesar ahorro automático si es un ingreso
      await processAutoSavings(newTransaction);
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: number) => {
    try {
      await db.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  };

  return (
    <TransactionsContext.Provider value={{
      transactions,
      loading,
      addTransaction,
      deleteTransaction,
    }}>
      {children}
    </TransactionsContext.Provider>
  );
};
