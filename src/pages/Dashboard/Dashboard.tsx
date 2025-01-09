import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, CircularProgress } from '@mui/material';
import { BarChart } from '@mui/x-charts';
import { useTransactions } from '../../context/TransactionsContext';
import { useSettings } from '../../context/SettingsContext';
import { db } from '../../database/db';

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

const Dashboard: React.FC = () => {
  const { monthlyTotals, loading } = useTransactions();
  const { formatMoney } = useSettings();
  const [chartData, setChartData] = useState<MonthlyData[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);

  useEffect(() => {
    const loadChartData = async () => {
      try {
        const currentDate = new Date();
        const last5Months: MonthlyData[] = [];

        // Obtener datos de los últimos 5 meses
        for (let i = 4; i >= 0; i--) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          const totals = await db.getMonthlyTotals(date.getFullYear(), date.getMonth() + 1);
          
          last5Months.push({
            month: date.toLocaleString('es', { month: 'short' }),
            income: totals.income,
            expenses: totals.expenses
          });
        }

        setChartData(last5Months);
      } catch (error) {
        console.error('Error loading chart data:', error);
      } finally {
        setLoadingChart(false);
      }
    };

    loadChartData();
  }, []);

  if (loading || loadingChart) {
    return (
      <Grid container justifyContent="center" alignItems="center" style={{ minHeight: '400px' }}>
        <CircularProgress />
      </Grid>
    );
  }

  const currentDate = new Date().toLocaleDateString('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const balance = monthlyTotals.income - monthlyTotals.expenses;

  return (
    <Grid container spacing={3}>
      {/* Resumen de Balance */}
      <Grid item xs={12} md={4}>
        <Paper
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            height: 140,
          }}
        >
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            Balance Total
          </Typography>
          <Typography component="p" variant="h4">
            {formatMoney(balance)}
          </Typography>
          <Typography color="text.secondary" sx={{ flex: 1 }}>
            al {currentDate}
          </Typography>
        </Paper>
      </Grid>

      {/* Ingresos del Mes */}
      <Grid item xs={12} md={4}>
        <Paper
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            height: 140,
          }}
        >
          <Typography component="h2" variant="h6" style={{ color: '#2e7d32' }} gutterBottom>
            Ingresos del Mes
          </Typography>
          <Typography component="p" variant="h4">
            {formatMoney(monthlyTotals.income)}
          </Typography>
          <Typography color="text.secondary" sx={{ flex: 1 }}>
            mes actual
          </Typography>
        </Paper>
      </Grid>

      {/* Gastos del Mes */}
      <Grid item xs={12} md={4}>
        <Paper
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            height: 140,
          }}
        >
          <Typography component="h2" variant="h6" style={{ color: '#d32f2f' }} gutterBottom>
            Gastos del Mes
          </Typography>
          <Typography component="p" variant="h4">
            {formatMoney(monthlyTotals.expenses)}
          </Typography>
          <Typography color="text.secondary" sx={{ flex: 1 }}>
            mes actual
          </Typography>
        </Paper>
      </Grid>

      {/* Gráfico de Ingresos vs Gastos */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            Ingresos vs Gastos - Últimos 5 meses
          </Typography>
          <Box sx={{ height: 400, width: '100%' }}>
            <BarChart
              width={800}
              height={350}
              series={[
                { 
                  data: chartData.map(d => d.income),
                  label: 'Ingresos',
                  color: '#2e7d32',
                  valueFormatter: (value) => formatMoney(value),
                },
                { 
                  data: chartData.map(d => d.expenses),
                  label: 'Gastos',
                  color: '#d32f2f',
                  valueFormatter: (value) => formatMoney(value),
                },
              ]}
              xAxis={[{
                data: chartData.map(d => d.month),
                scaleType: 'band',
              }]}
              slotProps={{
                legend: {
                  hidden: false,
                  position: { vertical: 'top', horizontal: 'right' },
                },
              }}
            />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Dashboard;
