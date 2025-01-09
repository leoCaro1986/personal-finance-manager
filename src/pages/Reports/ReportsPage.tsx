import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Grid,
  Paper,
  Typography,
  Button,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableViewIcon from '@mui/icons-material/TableView';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { DatePicker } from '@mui/x-date-pickers';
import { DateRangePicker } from '@mui/x-date-pickers-pro';
import { useTransactions } from '../../context/TransactionsContext';
import { useSettings } from '../../context/SettingsContext';
import { BarChart, PieChart, LineChart } from '@mui/x-charts';
import dayjs, { Dayjs } from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

dayjs.extend(isBetween);
dayjs.extend(quarterOfYear);

type PeriodType = 'month' | 'quarter' | 'year' | 'custom';

interface DailyData {
  date: string;
  income: number;
  expenses: number;
}

interface CategoryTotal {
  id?: string;
  label: string;
  value: number;
}

interface ComparisonData {
  currentPeriod: {
    totalIncome: number;
    totalExpenses: number;
    categoryTotals: CategoryTotal[];
  };
  previousPeriod: {
    totalIncome: number;
    totalExpenses: number;
    categoryTotals: CategoryTotal[];
  };
}

const ReportsPage: React.FC = () => {
  const { transactions } = useTransactions();
  const { formatMoney } = useSettings();
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [startDate, setStartDate] = useState<Dayjs>(dayjs().startOf('month'));
  const [endDate, setEndDate] = useState<Dayjs>(dayjs().endOf('month'));
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [categoryTotals, setCategoryTotals] = useState<CategoryTotal[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const calculatePeriodDates = (type: PeriodType): { start: Dayjs; end: Dayjs } => {
    const now = dayjs();
    
    switch (type) {
      case 'month':
        return {
          start: now.startOf('month'),
          end: now.endOf('month')
        };
      case 'quarter':
        return {
          start: now.startOf('quarter'),
          end: now.endOf('quarter')
        };
      case 'year':
        return {
          start: now.startOf('year'),
          end: now.endOf('year')
        };
      case 'custom':
        return {
          start: startDate?.startOf('day') || now.startOf('day'),
          end: endDate?.endOf('day') || now.endOf('day')
        };
    }
  };

  const calculateTotals = () => {
    if (!transactions) return;

    const { start, end } = calculatePeriodDates(periodType);
    
    const periodTotals = transactions.reduce((acc, transaction) => {
      const transactionDate = dayjs(transaction.date);
      
      if (transactionDate.isBetween(start, end, 'day', '[]')) {
        if (transaction.type === 'ingreso') {
          acc.income += transaction.amount;
        } else {
          acc.expenses += transaction.amount;
        }
      }
      return acc;
    }, { income: 0, expenses: 0 });

    const totals = {
      income: periodTotals.income,
      expenses: periodTotals.expenses,
      balance: periodTotals.income - periodTotals.expenses
    };

    return totals;
  };

  const calculateDailyData = (start: Dayjs, end: Dayjs) => {
    const dailyTotals: { [key: string]: DailyData } = {};
    
    let currentDate = start;
    while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      dailyTotals[dateStr] = {
        date: currentDate.format('DD/MM'),
        income: 0,
        expenses: 0
      };
      currentDate = currentDate.add(1, 'day');
    }

    transactions?.forEach(transaction => {
      const transactionDate = dayjs(transaction.date);
      if (transactionDate.isBetween(start, end, 'day', '[]')) {
        const dateStr = transactionDate.format('YYYY-MM-DD');
        if (transaction.type === 'ingreso') {
          dailyTotals[dateStr].income += transaction.amount;
        } else {
          dailyTotals[dateStr].expenses += transaction.amount;
        }
      }
    });

    setDailyData(Object.values(dailyTotals));
  };

  const calculateCategoryTotals = (start: Dayjs, end: Dayjs) => {
    const totals: { [key: string]: number } = {};

    transactions?.forEach(transaction => {
      const transactionDate = dayjs(transaction.date);
      if (transaction.type === 'gasto' && transactionDate.isBetween(start, end, 'day', '[]')) {
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

  const fetchPreviousPeriodData = async (currentStart: Dayjs, currentEnd: Dayjs) => {
    const duration = currentEnd.diff(currentStart, 'day');
    const previousStart = currentStart.subtract(duration + 1, 'day');
    const previousEnd = currentStart.subtract(1, 'day');

    // Simular obtención de datos del período anterior
    // TODO: Reemplazar con llamada real a la API
    const previousData = {
      totalIncome: Math.random() * 10000,
      totalExpenses: Math.random() * 8000,
      categoryTotals: [
        { id: '1', label: 'Comida', value: Math.random() * 2000 },
        { id: '2', label: 'Transporte', value: Math.random() * 1000 },
        { id: '3', label: 'Entretenimiento', value: Math.random() * 1500 }
      ]
    };

    return previousData;
  };

  const handleComparisonToggle = async () => {
    if (!showComparison && startDate && endDate) {
      const currentTotalIncome = dailyData.reduce((sum, day) => sum + day.income, 0);
      const currentTotalExpenses = dailyData.reduce((sum, day) => sum + day.expenses, 0);
      
      const previousData = await fetchPreviousPeriodData(startDate, endDate);
      
      setComparisonData({
        currentPeriod: {
          totalIncome: currentTotalIncome,
          totalExpenses: currentTotalExpenses,
          categoryTotals
        },
        previousPeriod: {
          totalIncome: previousData.totalIncome,
          totalExpenses: previousData.totalExpenses,
          categoryTotals: previousData.categoryTotals
        }
      });
    }
    setShowComparison(!showComparison);
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      // Crear hoja de Resumen
      const summaryData = [
        ['Reporte Financiero'],
        ['Período', periodType === 'custom' ? 
          `${startDate?.format('DD/MM/YYYY')} - ${endDate?.format('DD/MM/YYYY')}` : 
          periodType],
        [],
        ['Resumen Financiero'],
        ['Concepto', 'Actual', showComparison ? 'Período Anterior' : '', showComparison ? 'Variación %' : ''],
        ['Ingresos Totales', 
          formatMoney(dailyData.reduce((sum, day) => sum + day.income, 0)),
          showComparison ? formatMoney(comparisonData?.previousPeriod.totalIncome || 0) : '',
          showComparison ? `${(((dailyData.reduce((sum, day) => sum + day.income, 0) / 
            (comparisonData?.previousPeriod.totalIncome || 1)) - 1) * 100).toFixed(1)}%` : ''
        ],
        ['Gastos Totales',
          formatMoney(dailyData.reduce((sum, day) => sum + day.expenses, 0)),
          showComparison ? formatMoney(comparisonData?.previousPeriod.totalExpenses || 0) : '',
          showComparison ? `${(((dailyData.reduce((sum, day) => sum + day.expenses, 0) / 
            (comparisonData?.previousPeriod.totalExpenses || 1)) - 1) * 100).toFixed(1)}%` : ''
        ],
      ];

      // Crear hoja de Datos Diarios
      const dailySheetData = [
        ['Fecha', 'Ingresos', 'Gastos', 'Balance'],
        ...dailyData.map(day => [
          day.date,
          day.income,
          day.expenses,
          day.income - day.expenses
        ])
      ];

      // Crear hoja de Categorías
      const categorySheetData = [
        ['Categoría', 'Monto', showComparison ? 'Período Anterior' : '', showComparison ? 'Variación %' : ''],
        ...categoryTotals.map(cat => {
          const previousCat = comparisonData?.previousPeriod.categoryTotals.find(p => p.label === cat.label);
          return [
            cat.label,
            cat.value,
            showComparison ? (previousCat?.value || 0) : '',
            showComparison ? `${(((cat.value / (previousCat?.value || 1)) - 1) * 100).toFixed(1)}%` : ''
          ];
        })
      ];

      // Crear libro de Excel
      const wb = XLSX.utils.book_new();
      
      // Agregar hojas
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Resumen');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dailySheetData), 'Datos Diarios');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(categorySheetData), 'Categorías');

      // Guardar archivo
      XLSX.writeFile(wb, 'reporte-financiero.xlsx');
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
    } finally {
      setIsExporting(false);
      handleExportMenuClose();
    }
  };

  const handleExportMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  useEffect(() => {
    calculateTotals();
    if (startDate && endDate) {
      calculateDailyData(startDate, endDate);
      calculateCategoryTotals(startDate, endDate);
    }
  }, [periodType, startDate, endDate, transactions]);

  useEffect(() => {
    const { start, end } = calculatePeriodDates(periodType);
    setStartDate(start);
    setEndDate(end);
  }, [periodType]);

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriodType(newPeriod);
    if (newPeriod !== 'custom') {
      const { start, end } = calculatePeriodDates(newPeriod);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current || isExporting) return;
    
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgWidth = 210; // A4 width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Agregar título y fecha
      pdf.setFontSize(16);
      pdf.text('Reporte Financiero', 105, 15, { align: 'center' });
      pdf.setFontSize(12);
      const dateStr = startDate && endDate
        ? `${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}`
        : `Período: ${periodType}`;
      pdf.text(dateStr, 105, 25, { align: 'center' });

      // Agregar resumen financiero
      pdf.setFontSize(12);
      const totalIncome = dailyData.reduce((sum, day) => sum + day.income, 0);
      const totalExpenses = dailyData.reduce((sum, day) => sum + day.expenses, 0);
      const balance = totalIncome - totalExpenses;

      pdf.text('Resumen Financiero:', 20, 40);
      pdf.text(`Ingresos Totales: ${formatMoney(totalIncome)}`, 20, 50);
      pdf.text(`Gastos Totales: ${formatMoney(totalExpenses)}`, 20, 60);
      pdf.text(`Balance: ${formatMoney(balance)}`, 20, 70);

      // Agregar gráficos
      pdf.addImage(imgData, 'PNG', 0, 80, imgWidth, imgHeight);
      
      // Guardar PDF
      pdf.save('reporte-financiero.pdf');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" gutterBottom>
          Reportes Financieros
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <ToggleButtonGroup
            value={periodType}
            exclusive
            onChange={(e, newPeriod) => handlePeriodChange(newPeriod as PeriodType)}
            aria-label="Período de reporte"
          >
            <ToggleButton value="month" aria-label="Mes">
              Mes
            </ToggleButton>
            <ToggleButton value="quarter" aria-label="Trimestre">
              Trimestre
            </ToggleButton>
            <ToggleButton value="year" aria-label="Año">
              Año
            </ToggleButton>
            <ToggleButton value="custom" aria-label="Personalizado">
              Personalizado
            </ToggleButton>
          </ToggleButtonGroup>

          {periodType === 'custom' && (
            <DateRangePicker
              value={[startDate, endDate]}
              onChange={(newValue: [Dayjs | null, Dayjs | null]) => {
                if (newValue[0]) setStartDate(newValue[0]);
                if (newValue[1]) setEndDate(newValue[1]);
              }}
              localeText={{ start: 'Inicio', end: 'Fin' }}
            />
          )}

          <FormControlLabel
            control={
              <Switch
                checked={showComparison}
                onChange={handleComparisonToggle}
                color="primary"
              />
            }
            label="Comparar con período anterior"
          />

          <Button
            variant="contained"
            onClick={handleExportMenuClick}
            disabled={isExporting}
            startIcon={<FileDownloadIcon />}
            sx={{ ml: 'auto' }}
          >
            Exportar
          </Button>

          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={handleExportMenuClose}
          >
            <MenuItem onClick={handleExportPDF} disabled={isExporting}>
              <ListItemIcon>
                <PictureAsPdfIcon />
              </ListItemIcon>
              <ListItemText>Exportar a PDF</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleExportExcel} disabled={isExporting}>
              <ListItemIcon>
                <TableViewIcon />
              </ListItemIcon>
              <ListItemText>Exportar a Excel</ListItemText>
            </MenuItem>
          </Menu>
        </Stack>
      </Grid>

      {/* Resumen Financiero con Comparativa */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Resumen Financiero
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={showComparison ? 6 : 4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" color="text.secondary">
                  Ingresos Totales
                </Typography>
                <Typography variant="h4" color="success.main">
                  {formatMoney(dailyData.reduce((sum, day) => sum + day.income, 0))}
                </Typography>
                {showComparison && comparisonData && (
                  <Typography variant="body2" color="text.secondary">
                    vs {formatMoney(comparisonData.previousPeriod.totalIncome)}
                    {' '}
                    <Typography
                      component="span"
                      color={comparisonData.currentPeriod.totalIncome >= comparisonData.previousPeriod.totalIncome ? 'success.main' : 'error.main'}
                    >
                      ({((comparisonData.currentPeriod.totalIncome / comparisonData.previousPeriod.totalIncome - 1) * 100).toFixed(1)}%)
                    </Typography>
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={showComparison ? 6 : 4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" color="text.secondary">
                  Gastos Totales
                </Typography>
                <Typography variant="h4" color="error.main">
                  {formatMoney(dailyData.reduce((sum, day) => sum + day.expenses, 0))}
                </Typography>
                {showComparison && comparisonData && (
                  <Typography variant="body2" color="text.secondary">
                    vs {formatMoney(comparisonData.previousPeriod.totalExpenses)}
                    {' '}
                    <Typography
                      component="span"
                      color={comparisonData.currentPeriod.totalExpenses <= comparisonData.previousPeriod.totalExpenses ? 'success.main' : 'error.main'}
                    >
                      ({((comparisonData.currentPeriod.totalExpenses / comparisonData.previousPeriod.totalExpenses - 1) * 100).toFixed(1)}%)
                    </Typography>
                  </Typography>
                )}
              </Box>
            </Grid>
            {!showComparison && (
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="subtitle1" color="text.secondary">
                    Balance
                  </Typography>
                  <Typography 
                    variant="h4" 
                    color={dailyData.reduce((sum, day) => sum + day.income - day.expenses, 0) >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatMoney(dailyData.reduce((sum, day) => sum + day.income - day.expenses, 0))}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Grid>

      {/* Gráficos existentes */}
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 4 }}>
              Tendencia de Ingresos y Gastos
            </Typography>
            <Box sx={{ 
              width: '100%', 
              height: { xs: 400, sm: 450, md: 500 },
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 3
            }}>
              {dailyData.length > 0 ? (
                <LineChart
                  series={[
                    {
                      data: dailyData.map(d => d.income),
                      label: 'Ingresos',
                      color: '#4caf50',
                      area: true,
                      valueFormatter: (value) => formatMoney(value as number),
                    },
                    {
                      data: dailyData.map(d => d.expenses),
                      label: 'Gastos',
                      color: '#f44336',
                      area: true,
                      valueFormatter: (value) => formatMoney(value as number),
                    },
                  ]}
                  xAxis={[{
                    scaleType: 'point',
                    data: dailyData.map((d, i) => i % 3 === 0 ? d.date : ''),
                    tickLabelStyle: {
                      angle: 45,
                      textAnchor: 'start',
                      fontSize: 12,
                    },
                  }]}
                  yAxis={[{
                    tickSize: 1000000,
                    tickLabelStyle: {
                      fontSize: 12,
                    },
                    valueFormatter: (value: number) => `${(value/1000000).toFixed(1)}M`,
                  }]}
                  height={400}
                  margin={{
                    top: 40,
                    right: 60,
                    bottom: 100,
                    left: 100,
                  }}
                  sx={{
                    '.MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': {
                      transform: 'translate(0, 10px)',
                    },
                    '.MuiChartsLegend-root': {
                      padding: '16px 0',
                      gap: '24px',
                    },
                  }}
                />
              ) : (
                <Typography color="text.secondary">
                  No hay datos para mostrar en el período seleccionado
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 4 }}>
              Distribución de Gastos por Categoría
            </Typography>
            <Box sx={{ 
              width: '100%', 
              height: { xs: 400, sm: 450, md: 500 },
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 3
            }}>
              {categoryTotals.length > 0 ? (
                <PieChart
                  series={[
                    {
                      data: categoryTotals,
                      highlightScope: { faded: 'global', highlighted: 'item' },
                      faded: { innerRadius: 30, additionalRadius: -30 },
                      arcLabel: (item) => {
                        const percentage = Number(((item.value / categoryTotals.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(1));
                        return percentage >= 5 ? `${percentage}%` : '';
                      },
                      arcLabelMinAngle: 45,
                    },
                  ]}
                  height={400}
                  margin={{ 
                    top: 40,
                    bottom: 100,
                    left: 40,
                    right: 60 
                  }}
                  slotProps={{
                    legend: {
                      hidden: true
                    }
                  }}
                  sx={{
                    '& .MuiChartsLegend-root': {
                      display: 'none'
                    }
                  }}
                />
              ) : (
                <Typography color="text.secondary">
                  No hay gastos registrados en el período seleccionado
                </Typography>
              )}
            </Box>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 2,
              justifyContent: 'center',
              padding: '24px 0',
              width: '100%'
            }}>
              {categoryTotals.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 3,
                      backgroundColor: ['#2196f3', '#4caf50', '#f44336', '#ff9800', '#9c27b0', '#795548'][index % 6],
                    }}
                  />
                  <Typography>
                    {item.label}: {formatMoney(item.value)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 4 }}>
              Comparativa de Ingresos y Gastos
            </Typography>
            <Box sx={{ 
              width: '100%', 
              height: { xs: 400, sm: 450, md: 500 },
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 3
            }}>
              {dailyData.length > 0 ? (
                <BarChart
                  series={[
                    {
                      data: dailyData.map(d => d.income),
                      label: 'Ingresos',
                      color: '#4caf50',
                      valueFormatter: (value) => formatMoney(value as number),
                    },
                    {
                      data: dailyData.map(d => d.expenses),
                      label: 'Gastos',
                      color: '#f44336',
                      valueFormatter: (value) => formatMoney(value as number),
                    },
                  ]}
                  xAxis={[{
                    scaleType: 'band',
                    data: dailyData.map((d, i) => i % 3 === 0 ? d.date : ''),
                    tickLabelStyle: {
                      angle: 45,
                      textAnchor: 'start',
                      fontSize: 12,
                    },
                  }]}
                  yAxis={[{
                    tickSize: 1000000,
                    tickLabelStyle: {
                      fontSize: 12,
                    },
                    valueFormatter: (value: number) => `${(value/1000000).toFixed(1)}M`,
                  }]}
                  height={400}
                  margin={{
                    top: 40,
                    right: 60,
                    bottom: 100,
                    left: 100,
                  }}
                  sx={{
                    '.MuiChartsAxis-bottom .MuiChartsAxis-tickLabel': {
                      transform: 'translate(0, 10px)',
                    },
                    '.MuiChartsLegend-root': {
                      padding: '16px 0',
                      gap: '24px',
                    },
                  }}
                />
              ) : (
                <Typography color="text.secondary">
                  No hay datos para mostrar en el período seleccionado
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ReportsPage;
