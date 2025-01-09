import React, { createContext, useContext, useEffect, useState } from 'react';
import { SavingsGoal } from '../types';
import { db } from '../database/db';

interface SavingsContextType {
  goals: SavingsGoal[];
  loading: boolean;
  error: string | null;
  addGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'currentAmount' | 'completed'>) => Promise<void>;
  updateGoal: (id: number, updates: Partial<SavingsGoal>) => Promise<void>;
  deleteGoal: (id: number) => Promise<void>;
  contributeToGoal: (id: number, amount: number) => Promise<void>;
  withdrawFromGoal: (id: number, amount: number) => Promise<void>;
}

const SavingsContext = createContext<SavingsContextType | undefined>(undefined);

export const SavingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const loadedGoals = await db.getSavingsGoals();
      setGoals(loadedGoals);
    } catch (error) {
      console.error('Error loading savings goals:', error);
      setError('Error al cargar los objetivos de ahorro');
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'currentAmount' | 'completed'>) => {
    try {
      await db.addSavingsGoal({
        ...goal,
        currentAmount: 0,
        completed: false,
      });
      await loadGoals();
    } catch (error) {
      console.error('Error adding savings goal:', error);
      setError('Error al agregar el objetivo de ahorro');
    }
  };

  const updateGoal = async (id: number, updates: Partial<SavingsGoal>) => {
    try {
      await db.updateSavingsGoal(id, updates);
      await loadGoals();
    } catch (error) {
      console.error('Error updating savings goal:', error);
      setError('Error al actualizar el objetivo de ahorro');
    }
  };

  const deleteGoal = async (id: number) => {
    try {
      await db.deleteSavingsGoal(id);
      await loadGoals();
    } catch (error) {
      console.error('Error deleting savings goal:', error);
      setError('Error al eliminar el objetivo de ahorro');
    }
  };

  const contributeToGoal = async (id: number, amount: number) => {
    try {
      const goal = goals.find(g => g.id === id);
      if (!goal) {
        throw new Error('Objetivo de ahorro no encontrado');
      }

      const newAmount = goal.currentAmount + amount;
      const completed = newAmount >= goal.targetAmount;

      await db.updateSavingsGoal(id, {
        currentAmount: newAmount,
        completed,
      });

      await loadGoals();
    } catch (error) {
      console.error('Error contributing to savings goal:', error);
      setError('Error al contribuir al objetivo de ahorro');
    }
  };

  const withdrawFromGoal = async (id: number, amount: number) => {
    try {
      const goal = goals.find(g => g.id === id);
      if (!goal) {
        throw new Error('Objetivo de ahorro no encontrado');
      }

      if (amount > goal.currentAmount) {
        throw new Error('No hay suficientes fondos para retirar');
      }

      const newAmount = goal.currentAmount - amount;
      await db.updateSavingsGoal(id, {
        currentAmount: newAmount,
        completed: false,
      });

      await loadGoals();
    } catch (error) {
      console.error('Error withdrawing from savings goal:', error);
      setError('Error al retirar del objetivo de ahorro');
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const value = {
    goals,
    loading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    contributeToGoal,
    withdrawFromGoal,
  };

  return (
    <SavingsContext.Provider value={value}>
      {children}
    </SavingsContext.Provider>
  );
};

export const useSavings = () => {
  const context = useContext(SavingsContext);
  if (context === undefined) {
    throw new Error('useSavings must be used within a SavingsProvider');
  }
  return context;
};
