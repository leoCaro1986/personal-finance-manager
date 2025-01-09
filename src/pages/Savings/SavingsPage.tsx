import React, { useState } from 'react';
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
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tooltip,
  CircularProgress,
  OutlinedInput,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowUpward as ContributeIcon,
  ArrowDownward as WithdrawIcon,
} from '@mui/icons-material';
import { useSettings } from '../../context/SettingsContext';
import { useSavings } from '../../context/SavingsContext';
import { SavingsGoal } from '../../types';

interface GoalDialogData {
  name: string;
  targetAmount: string;
  deadline: string;
  category: string;
  description: string;
}

interface ContributionDialogData {
  amount: number;
}

const SavingsPage: React.FC = () => {
  const { formatMoney } = useSettings();
  const { goals, loading, addGoal, updateGoal, deleteGoal, contributeToGoal, withdrawFromGoal } = useSavings();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contributionDialogOpen, setContributionDialogOpen] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [dialogData, setDialogData] = useState<GoalDialogData>({
    name: '',
    targetAmount: '',
    deadline: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
  });
  const [contributionData, setContributionData] = useState<ContributionDialogData>({
    amount: 0,
  });

  const handleOpenDialog = (goal?: SavingsGoal) => {
    if (goal) {
      setDialogData({
        name: goal.name,
        targetAmount: goal.targetAmount.toString(),
        deadline: new Date(goal.deadline).toISOString().split('T')[0],
        category: goal.category,
        description: goal.description || '',
      });
      setSelectedGoal(goal);
    } else {
      setDialogData({
        name: '',
        targetAmount: '',
        deadline: new Date().toISOString().split('T')[0],
        category: '',
        description: '',
      });
      setSelectedGoal(null);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedGoal(null);
    setDialogData({
      name: '',
      targetAmount: '',
      deadline: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
    });
  };

  const handleOpenContributionDialog = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setContributionData({ amount: 0 });
    setContributionDialogOpen(true);
  };

  const handleCloseContributionDialog = () => {
    setContributionDialogOpen(false);
    setSelectedGoal(null);
    setContributionData({ amount: 0 });
  };

  const handleOpenWithdrawalDialog = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setContributionData({ amount: 0 });
    setWithdrawalDialogOpen(true);
  };

  const handleCloseWithdrawalDialog = () => {
    setWithdrawalDialogOpen(false);
    setSelectedGoal(null);
    setContributionData({ amount: 0 });
  };

  const handleSaveGoal = async () => {
    const numericAmount = dialogData.targetAmount === '' ? 0 : parseFloat(dialogData.targetAmount);
    
    if (selectedGoal) {
      await updateGoal(selectedGoal.id!, {
        ...dialogData,
        deadline: new Date(dialogData.deadline),
        targetAmount: numericAmount,
      });
    } else {
      await addGoal({
        ...dialogData,
        deadline: new Date(dialogData.deadline),
        targetAmount: numericAmount,
      });
    }
    handleCloseDialog();
  };

  const handleContribute = async () => {
    if (selectedGoal && contributionData.amount > 0) {
      await contributeToGoal(selectedGoal.id!, contributionData.amount);
      handleCloseContributionDialog();
    }
  };

  const handleWithdraw = async () => {
    if (selectedGoal && contributionData.amount > 0) {
      await withdrawFromGoal(selectedGoal.id!, contributionData.amount);
      handleCloseWithdrawalDialog();
    }
  };

  const calculateProgress = (goal: SavingsGoal) => {
    return (goal.currentAmount / goal.targetAmount) * 100;
  };

  const getDaysRemaining = (deadline: Date) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
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
          <Typography variant="h4">Objetivos de Ahorro</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Nuevo Objetivo
          </Button>
        </Box>
      </Grid>

      {goals.map((goal) => (
        <Grid item xs={12} sm={6} md={4} key={goal.id}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="h6" gutterBottom>
                {goal.name}
              </Typography>
              <Box>
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => handleOpenDialog(goal)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Contribuir">
                  <IconButton size="small" onClick={() => handleOpenContributionDialog(goal)}>
                    <ContributeIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Retirar">
                  <IconButton size="small" onClick={() => handleOpenWithdrawalDialog(goal)}>
                    <WithdrawIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton size="small" onClick={() => deleteGoal(goal.id!)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {goal.description}
            </Typography>
            <Box mt={2}>
              <Typography variant="subtitle2">
                Progreso: {formatMoney(goal.currentAmount)} de {formatMoney(goal.targetAmount)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={calculateProgress(goal)}
                sx={{ mt: 1, mb: 1, height: 8, borderRadius: 4 }}
                color={goal.completed ? "success" : "primary"}
              />
              <Typography variant="body2" color="text.secondary">
                {getDaysRemaining(goal.deadline)} días restantes
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Categoría: {goal.category}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      ))}

      {/* Diálogo para agregar/editar objetivo */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        disableEscapeKeyDown={false}
        onClick={(e) => {
          console.log('Dialog clicked');
          e.stopPropagation();
        }}
      >
        <DialogTitle>{selectedGoal ? 'Editar Objetivo' : 'Nuevo Objetivo'}</DialogTitle>
        <DialogContent>
          <Box 
            component="form" 
            noValidate 
            autoComplete="off"
            onClick={(e) => {
              console.log('Form clicked');
              e.stopPropagation();
            }}
          >
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Nombre"
                  fullWidth
                  value={dialogData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setDialogData({ ...dialogData, name: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Meta de ahorro"
                  type="number"
                  fullWidth
                  value={dialogData.targetAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDialogData({
                      ...dialogData,
                      targetAmount: value
                    });
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  inputProps={{
                    min: "0",
                    step: "0.01"
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Fecha Límite"
                  type="date"
                  fullWidth
                  value={dialogData.deadline}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setDialogData({ ...dialogData, deadline: e.target.value })
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Categoría"
                  fullWidth
                  value={dialogData.category}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setDialogData({ ...dialogData, category: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Descripción"
                  fullWidth
                  multiline
                  rows={3}
                  value={dialogData.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setDialogData({ ...dialogData, description: e.target.value })
                  }
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveGoal} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para contribuir */}
      <Dialog open={contributionDialogOpen} onClose={handleCloseContributionDialog}>
        <DialogTitle>Contribuir al Objetivo</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Monto a Contribuir"
                type="number"
                fullWidth
                value={contributionData.amount}
                onChange={(e) => setContributionData({ amount: Number(e.target.value) })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseContributionDialog}>Cancelar</Button>
          <Button onClick={handleContribute} variant="contained" color="primary">
            Contribuir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para retirar */}
      <Dialog open={withdrawalDialogOpen} onClose={handleCloseWithdrawalDialog}>
        <DialogTitle>Retirar del Objetivo</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Monto a Retirar"
                type="number"
                fullWidth
                value={contributionData.amount}
                onChange={(e) => setContributionData({ amount: Number(e.target.value) })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseWithdrawalDialog}>Cancelar</Button>
          <Button onClick={handleWithdraw} variant="contained" color="primary">
            Retirar
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default SavingsPage;
