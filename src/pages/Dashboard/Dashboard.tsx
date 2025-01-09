import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { BarChart } from '@mui/x-charts';

const Dashboard: React.FC = () => {
  // Datos de ejemplo para el gráfico
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May'];
  const ingresos = [2000, 3000, 1500, 2500, 3500];
  const gastos = [1500, 2000, 1000, 1800, 2200];

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
            $3,024.00
          </Typography>
          <Typography color="text.secondary" sx={{ flex: 1 }}>
            al 8 de Enero, 2025
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
            $4,500.00
          </Typography>
          <Typography color="text.secondary" sx={{ flex: 1 }}>
            +15% vs. mes anterior
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
            $2,100.00
          </Typography>
          <Typography color="text.secondary" sx={{ flex: 1 }}>
            -8% vs. mes anterior
          </Typography>
        </Paper>
      </Grid>

      {/* Gráfico de Ingresos vs Gastos */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography component="h2" variant="h6" color="primary" gutterBottom>
            Ingresos vs Gastos
          </Typography>
          <Box sx={{ height: 400, width: '100%' }}>
            <BarChart
              width={800}
              height={350}
              series={[
                { data: ingresos, label: 'Ingresos', color: '#2e7d32' },
                { data: gastos, label: 'Gastos', color: '#d32f2f' },
              ]}
              xAxis={[{
                data: months,
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
