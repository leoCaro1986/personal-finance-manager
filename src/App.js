import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import TransactionsPage from './pages/Transactions/TransactionsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import { TransactionsProvider } from './context/TransactionsContext';
import { SettingsProvider } from './context/SettingsContext';

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
      <SettingsProvider>
        <TransactionsProvider>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/reports" element={<div>Página de Reportes (en desarrollo)</div>} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </MainLayout>
        </TransactionsProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
