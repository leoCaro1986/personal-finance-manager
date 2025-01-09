import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import TransactionsPage from './pages/Transactions/TransactionsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import SavingsPage from './pages/Savings/SavingsPage';
import ReportsPage from './pages/Reports/ReportsPage';
import { TransactionsProvider } from './context/TransactionsContext';
import { SettingsProvider } from './context/SettingsContext';
import { SavingsProvider } from './context/SavingsContext';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// Tema personalizado
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <SettingsProvider>
          <SavingsProvider>
            <TransactionsProvider>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/transactions" element={<TransactionsPage />} />
                  <Route path="/savings" element={<SavingsPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </MainLayout>
            </TransactionsProvider>
          </SavingsProvider>
        </SettingsProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
