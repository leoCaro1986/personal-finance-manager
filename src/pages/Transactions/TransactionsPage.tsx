import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useTransactions } from '../../context/TransactionsContext';
import { useSettings } from '../../context/SettingsContext';
import { Transaction, Category } from '../../types';
import { db } from '../../database/db';

interface TransactionFormData {
  type: 'ingreso' | 'gasto';
  amount: number;
  category: string;
  description: string;
  date: string;
}

const TransactionsPage: React.FC = () => {
  const { transactions, loading, addTransaction, deleteTransaction } = useTransactions();
  const { formatMoney } = useSettings();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'gasto',
    amount: '' as unknown as number,
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (dialogOpen) {
      loadCategories();
    }
  }, [dialogOpen, formData.type]);

  const loadCategories = async () => {
    try {
      const allCategories = await db.getCategories();
      const filteredCategories = allCategories.filter(cat => cat.type === formData.type);
      setCategories(filteredCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Error al cargar las categorías');
    }
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setFormData({
      type: 'gasto',
      amount: '' as unknown as number,
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setError(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      type: 'gasto',
      amount: '' as unknown as number,
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setError(null);
  };

  const handleSave = async () => {
    try {
      const amount = Number(formData.amount);
      if (!amount || amount <= 0) {
        setError('El monto debe ser mayor a 0');
        return;
      }

      if (!formData.category) {
        setError('La categoría es requerida');
        return;
      }

      await addTransaction({
        ...formData,
        date: new Date(formData.date),
      });

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving transaction:', error);
      setError('Error al guardar la transacción');
    }
  };

  const handleDelete = async (transactionId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta transacción?')) {
      try {
        await deleteTransaction(transactionId);
      } catch (error) {
        console.error('Error deleting transaction:', error);
        setError('Error al eliminar la transacción');
      }
    }
  };

  const calculateBalance = () => {
    return transactions.reduce((acc, transaction) => {
      return acc + (transaction.type === 'ingreso' ? transaction.amount : -transaction.amount);
    }, 0);
  };

  if (loading) {
    return (
      <Grid container justifyContent="center" alignItems="center" style={{ minHeight: '400px' }}>
        <CircularProgress />
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Transacciones</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Nueva Transacción
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Balance Actual: {formatMoney(calculateBalance())}
          </Typography>
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {new Date(transaction.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {transaction.type === 'ingreso' ? 'Ingreso' : 'Gasto'}
                  </TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell align="right" sx={{
                    color: transaction.type === 'ingreso' ? 'success.main' : 'error.main',
                  }}>
                    {formatMoney(transaction.amount)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(transaction.id!)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Transacción</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.type}
                  label="Tipo"
                  onChange={(e) => setFormData({
                    ...formData,
                    type: e.target.value as 'ingreso' | 'gasto',
                    category: '',
                  })}
                >
                  <MenuItem value="ingreso">Ingreso</MenuItem>
                  <MenuItem value="gasto">Gasto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Monto"
                type="number"
                fullWidth
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value ? Number(e.target.value) : '' as unknown as number })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={formData.category}
                  label="Categoría"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.name}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descripción"
                fullWidth
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Fecha"
                type="date"
                fullWidth
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default TransactionsPage;
