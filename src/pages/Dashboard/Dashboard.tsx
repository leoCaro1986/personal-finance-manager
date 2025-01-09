import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';
import { useTransactions } from '../../context/TransactionsContext';
import { useSettings } from '../../context/SettingsContext';
import { BarChart, PieChart } from '@mui/x-charts';

interface MonthlyData {
  [key: string]: string | number;
  month: string;
  income: number;
  expenses: number;
}

interface CategoryTotal {
  id: string;
  value: number;
  label: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const defaultMonthlyData: MonthlyData[] = Array.from({ length: 6 }, (_, i) => {
  const date = new Date();
  date.setMonth(date.getMonth() - i);
  return {
    month: date.toLocaleDateString('es-ES', { month: 'short' }),
    income: 0,
    expenses: 0,
  };
}).reverse();

const Dashboard: React.FC = () => {
  const { transactions, loading } = useTransactions();
  const { formatMoney } = useSettings();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>(defaultMonthlyData);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState({ income: 0, expenses: 0 });

  useEffect(() => {
    if (transactions) {
      calculateMonthlyData();
      calculateCategoryTotals();
      calculateMonthlyTotals();
    }
  }, [transactions]);

  const calculateMonthlyTotals = () => {
    if (!transactions) return;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const totals = transactions.reduce(
      (acc, transaction) => {
        const transactionDate = new Date(transaction.date);
        if (
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        ) {
          if (transaction.type === 'ingreso') {
            acc.income += transaction.amount;
          } else {
            acc.expenses += transaction.amount;
          }
        }
        return acc;
      },
      { income: 0, expenses: 0 }
    );

    setMonthlyTotals(totals);
  };

  const calculateMonthlyData = () => {
    if (!transactions) return;

    const monthlyMap = new Map<string, MonthlyData>();
    
    // Inicializar con los últimos 6 meses
    defaultMonthlyData.forEach(data => {
      monthlyMap.set(data.month, { ...data });
    });

    // Agrupar transacciones por mes
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = date.toLocaleDateString('es-ES', { month: 'short' });

      if (monthlyMap.has(monthKey)) {
        const data = monthlyMap.get(monthKey)!;
        if (transaction.type === 'ingreso') {
          data.income += transaction.amount;
        } else {
          data.expenses += transaction.amount;
        }
      }
    });

    setMonthlyData(Array.from(monthlyMap.values()));
  };

  const calculateCategoryTotals = () => {
    if (!transactions) return;

    const totals: { [key: string]: number } = {};

    transactions.forEach(transaction => {
      if (transaction.type === 'gasto') {
        totals[transaction.category] = (totals[transaction.category] || 0) + transaction.amount;
      }
    });

    const categoryData = Object.entries(totals)
      .map(([category, value]) => ({
        id: category,
        value,
        label: category,
      }))
      .sort((a, b) => b.value - a.value);

    setCategoryTotals(categoryData);
  };

  if (loading) {
    return (
      <Grid container justifyContent="center" alignItems="center" style={{ minHeight: '400px' }}>
        <CircularProgress />
      </Grid>
    );
  }

  const chartData = monthlyData.length > 0 ? monthlyData : defaultMonthlyData;
  const pieData = categoryTotals.length > 0 
    ? categoryTotals 
    : [{ id: 'sin-datos', value: 1, label: 'Sin datos' }];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
      </Grid>

      {/* Resumen del mes actual */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Ingresos del Mes
          </Typography>
          <Typography variant="h4" color="success.main">
            {formatMoney(monthlyTotals.income)}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Gastos del Mes
          </Typography>
          <Typography variant="h4" color="error.main">
            {formatMoney(monthlyTotals.expenses)}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Balance del Mes
          </Typography>
          <Typography
            variant="h4"
            color={monthlyTotals.income - monthlyTotals.expenses >= 0 ? 'success.main' : 'error.main'}
          >
            {formatMoney(monthlyTotals.income - monthlyTotals.expenses)}
          </Typography>
        </Paper>
      </Grid>

      {/* Gráfico de barras */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Ingresos vs Gastos por Mes
          </Typography>
          <Box sx={{ 
            width: '100%', 
            height: { xs: 250, sm: 300, md: 350 },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}>
            <BarChart
              dataset={chartData}
              xAxis={[{ 
                scaleType: 'band',
                dataKey: 'month',
              }]}
              series={[
                {
                  dataKey: 'income',
                  label: 'Ingresos',
                  color: '#4caf50',
                  valueFormatter: (value) => formatMoney(value as number),
                },
                {
                  dataKey: 'expenses',
                  label: 'Gastos',
                  color: '#f44336',
                  valueFormatter: (value) => formatMoney(value as number),
                },
              ]}
              height={300}
              margin={{
                top: 20,
                bottom: 30,
                left: 40,
                right: 10
              }}
              sx={{
                '& .MuiChartsLegend-root': {
                  flexWrap: 'wrap',
                  gap: '16px',
                  justifyContent: 'center',
                  '& .MuiChartsLegend-label': {
                    fontSize: '0.875rem',
                  },
                },
                '& .MuiChartsAxis-tickLabel': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                },
                '& .MuiBarElement-root': {
                  minWidth: { xs: 12, sm: 20 },
                  maxWidth: 50,
                },
              }}
            />
          </Box>
        </Paper>
      </Grid>

      {/* Gráfico circular */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Distribución de Gastos por Categoría
          </Typography>
          <Box sx={{ 
            width: '100%', 
            height: { xs: 250, sm: 300, md: 350 },
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative'
          }}>
            <PieChart
              series={[
                {
                  data: pieData,
                  highlightScope: { faded: 'global', highlighted: 'item' },
                  faded: { innerRadius: 30, additionalRadius: -30 },
                  arcLabel: (item) => `${((item.value / pieData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(0)}%`,
                  arcLabelMinAngle: 45,
                },
              ]}
              legend={{
                direction: 'row',
                position: { vertical: 'bottom', horizontal: 'middle' },
              }}
              height={300}
              margin={{ 
                top: 20,
                bottom: 80,
                left: 20,
                right: 20 
              }}
              sx={{
                '& .MuiChartsLegend-root': {
                  flexWrap: 'wrap',
                  gap: '16px',
                  justifyContent: 'center',
                  '& .MuiChartsLegend-label': {
                    fontSize: '0.875rem',
                  },
                },
              }}
            />
          </Box>
        </Paper>
      </Grid>

      {/* Lista de totales por categoría */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Totales por Categoría
          </Typography>
          <Box>
            {categoryTotals.map((category, index) => (
              <Box
                key={category.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1,
                  p: 1,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                }}
              >
                <Typography
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    '&::before': {
                      content: '""',
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: COLORS[index % COLORS.length],
                      marginRight: 1,
                    },
                  }}
                >
                  {category.id}
                </Typography>
                <Typography>{formatMoney(category.value)}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Dashboard;
