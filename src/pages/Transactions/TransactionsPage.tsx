import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  InputAdornment,
  CircularProgress,
  Box,
  Chip,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, AddCircleOutline as AddCircleOutlineIcon } from '@mui/icons-material';
import { useTransactions } from '../../context/TransactionsContext';
import { useSettings } from '../../context/SettingsContext';
import { Transaction, Category, db } from '../../database/db';

const TransactionsPage: React.FC = () => {
  const { transactions, addTransaction, deleteTransaction, loading } = useTransactions();
  const { formatMoney, settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [newTransaction, setNewTransaction] = useState<Omit<Transaction, 'id' | 'createdAt'>>({
    type: 'ingreso',
    amount: 0,
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadCategories(newTransaction.type);
  }, [newTransaction.type]);

  const loadCategories = async (type: 'ingreso' | 'gasto') => {
    const loadedCategories = await db.getCategories(type);
    setCategories(loadedCategories);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setNewTransaction({
      type: 'ingreso',
      amount: 0,
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleNewCategoryClick = () => {
    setNewCategoryDialogOpen(true);
  };

  const handleNewCategoryClose = () => {
    setNewCategoryDialogOpen(false);
    setNewCategory('');
  };

  const handleNewCategorySubmit = async () => {
    if (newCategory.trim()) {
      await db.addCategory({
        name: newCategory.trim(),
        type: newTransaction.type,
        isDefault: false,
      });
      await loadCategories(newTransaction.type);
      handleNewCategoryClose();
    }
  };

  const handleSave = async () => {
    if (newTransaction.amount && newTransaction.category) {
      try {
        await addTransaction(newTransaction);
        handleClose();
      } catch (error) {
        console.error('Error al guardar la transacción:', error);
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTransaction(id);
    } catch (error) {
      console.error('Error al eliminar la transacción:', error);
    }
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
        <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography component="h1" variant="h5">
            Transacciones
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleClickOpen}
          >
            Nueva Transacción
          </Button>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Categoría</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>
                    <Typography
                      color={transaction.type === 'ingreso' ? 'success.main' : 'error.main'}
                    >
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.category}
                      size="small"
                      color={transaction.type === 'ingreso' ? 'success' : 'error'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell align="right">
                    <Typography
                      color={transaction.type === 'ingreso' ? 'success.main' : 'error.main'}
                    >
                      {formatMoney(transaction.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => transaction.id && handleDelete(transaction.id)}
                      color="error"
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

      {/* Diálogo de Nueva Transacción */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Transacción</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={newTransaction.type}
                  label="Tipo"
                  onChange={(e) => {
                    const newType = e.target.value as 'ingreso' | 'gasto';
                    setNewTransaction({ 
                      ...newTransaction, 
                      type: newType,
                      category: '' // Resetear categoría al cambiar el tipo
                    });
                  }}
                >
                  <MenuItem value="ingreso">Ingreso</MenuItem>
                  <MenuItem value="gasto">Gasto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Monto"
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">{settings.currency.symbol}</InputAdornment>,
                }}
                value={newTransaction.amount === 0 ? '' : newTransaction.amount}
                onChange={(e) => {
                  const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  setNewTransaction({ ...newTransaction, amount: value });
                }}
                placeholder="0.00"
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl fullWidth>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={newTransaction.category}
                    label="Categoría"
                    onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.name}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Tooltip title="Agregar nueva categoría">
                  <IconButton 
                    color="primary" 
                    onClick={handleNewCategoryClick}
                    sx={{ mt: 1 }}
                  >
                    <AddCircleOutlineIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Fecha"
                type="date"
                value={newTransaction.date}
                onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Nueva Categoría */}
      <Dialog open={newCategoryDialogOpen} onClose={handleNewCategoryClose}>
        <DialogTitle>Nueva Categoría</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre de la categoría"
            fullWidth
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNewCategoryClose}>Cancelar</Button>
          <Button onClick={handleNewCategorySubmit} variant="contained" color="primary">
            Agregar
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default TransactionsPage;
