import React, { useState } from 'react';
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
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

interface Transaction {
  id: number;
  type: 'ingreso' | 'gasto';
  amount: number;
  category: string;
  description: string;
  date: string;
}

const TransactionsPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 1,
      type: 'ingreso',
      amount: 1500,
      category: 'Salario',
      description: 'Salario mensual',
      date: '2025-01-08',
    },
    {
      id: 2,
      type: 'gasto',
      amount: 500,
      category: 'Alimentación',
      description: 'Compras del supermercado',
      date: '2025-01-07',
    },
  ]);
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    type: 'ingreso',
    amount: 0,
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const categories = {
    ingreso: ['Salario', 'Freelance', 'Inversiones', 'Otros'],
    gasto: ['Alimentación', 'Transporte', 'Servicios', 'Entretenimiento', 'Otros'],
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

  const handleSave = () => {
    if (newTransaction.amount && newTransaction.category) {
      setTransactions([
        ...transactions,
        {
          ...newTransaction,
          id: transactions.length + 1,
        } as Transaction,
      ]);
      handleClose();
    }
  };

  const handleDelete = (id: number) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

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
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell align="right">
                    <Typography
                      color={transaction.type === 'ingreso' ? 'success.main' : 'error.main'}
                    >
                      ${transaction.amount.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(transaction.id)}
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
                  onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value as 'ingreso' | 'gasto' })}
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
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={newTransaction.category}
                  label="Categoría"
                  onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                >
                  {categories[newTransaction.type || 'ingreso'].map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
    </Grid>
  );
};

export default TransactionsPage;
