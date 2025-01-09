import React, { createContext, useContext, useState, useEffect } from 'react';
import Dexie from 'dexie';

interface Currency {
  code: string;
  symbol: string;
  name: string;
  symbolPosition: 'before' | 'after';
  decimalSeparator: '.' | ',';
  thousandsSeparator: '.' | ',' | ' ';
}

interface AutoSavingsConfig {
  enabled: boolean;
  percentage: number;
  targetGoalId: string;
  minimumBalance: number;
}

interface Settings {
  currency: Currency;
  language: string;
  autoSavings?: AutoSavingsConfig;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  formatMoney: (amount: number) => string;
}

const defaultCurrencies: { [key: string]: Currency } = {
  COP: {
    code: 'COP',
    symbol: '$',
    name: 'Peso Colombiano',
    symbolPosition: 'before',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'Dólar Estadounidense',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    symbolPosition: 'after',
    decimalSeparator: ',',
    thousandsSeparator: '.',
  },
  MXN: {
    code: 'MXN',
    symbol: '$',
    name: 'Peso Mexicano',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandsSeparator: ',',
  },
};

const defaultSettings: Settings = {
  currency: defaultCurrencies.COP,
  language: 'es',
  autoSavings: {
    enabled: false,
    percentage: 10,
    targetGoalId: '',
    minimumBalance: 1000,
  },
};

// Extend Dexie with settings store
class SettingsDatabase extends Dexie {
  settings: Dexie.Table<Settings, number>;

  constructor() {
    super('SettingsDatabase');
    this.version(1).stores({
      settings: '++id',
    });
    this.settings = this.table('settings');
  }
}

const db = new SettingsDatabase();

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await db.settings.toArray();
      if (savedSettings.length > 0) {
        setSettings(savedSettings[0]);
      } else {
        await db.settings.add(defaultSettings);
        setSettings(defaultSettings);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<Settings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    const savedSettings = await db.settings.toArray();
    
    if (savedSettings.length > 0) {
      await db.settings.update(1, updatedSettings);
    } else {
      await db.settings.add(updatedSettings);
    }
    
    setSettings(updatedSettings);
  };

  const formatMoney = (amount: number): string => {
    const { currency } = settings;
    const formattedNumber = new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    }).format(amount);

    return currency.symbolPosition === 'before'
      ? `${currency.symbol} ${formattedNumber}`
      : `${formattedNumber} ${currency.symbol}`;
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, formatMoney }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const availableCurrencies = defaultCurrencies;
