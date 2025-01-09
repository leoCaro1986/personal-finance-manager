import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Box,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  InputAdornment,
} from '@mui/material';
import { useSettings } from '../../context/SettingsContext';
import { useSavings } from '../../context/SavingsContext';
import { db } from '../../database/db';
import { SavingsGoal } from '../../types';

const AutoSavingsSettings: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { goals } = useSavings();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [autoSavingsConfig, setAutoSavingsConfig] = useState({
    enabled: settings.autoSavings?.enabled || false,
    percentage: settings.autoSavings?.percentage || 10,
    targetGoalId: settings.autoSavings?.targetGoalId || '',
    minimumBalance: settings.autoSavings?.minimumBalance || 1000,
  });

  const handleSave = async () => {
    try {
      if (autoSavingsConfig.enabled) {
        if (autoSavingsConfig.percentage <= 0 || autoSavingsConfig.percentage > 100) {
          setError('El porcentaje debe estar entre 1 y 100');
          return;
        }

        if (!autoSavingsConfig.targetGoalId) {
          setError('Debes seleccionar una meta de ahorro');
          return;
        }

        if (autoSavingsConfig.minimumBalance < 0) {
          setError('El balance mínimo no puede ser negativo');
          return;
        }
      }

      await updateSettings({
        ...settings,
        autoSavings: autoSavingsConfig,
      });

      setSuccess('Configuración guardada correctamente');
      setError(null);

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving auto-savings settings:', error);
      setError('Error al guardar la configuración');
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Configuración de Ahorro Automático
      </Typography>

      <Box sx={{ mt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoSavingsConfig.enabled}
                  onChange={(e) => setAutoSavingsConfig({
                    ...autoSavingsConfig,
                    enabled: e.target.checked,
                  })}
                />
              }
              label="Activar ahorro automático"
            />
          </Grid>

          {autoSavingsConfig.enabled && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Porcentaje de ahorro"
                  type="number"
                  fullWidth
                  value={autoSavingsConfig.percentage}
                  onChange={(e) => setAutoSavingsConfig({
                    ...autoSavingsConfig,
                    percentage: Number(e.target.value),
                  })}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  helperText="Porcentaje de los ingresos que se destinará al ahorro"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Balance mínimo"
                  type="number"
                  fullWidth
                  value={autoSavingsConfig.minimumBalance}
                  onChange={(e) => setAutoSavingsConfig({
                    ...autoSavingsConfig,
                    minimumBalance: Number(e.target.value),
                  })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  helperText="No se realizarán ahorros si el balance es menor a este monto"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Meta de ahorro</InputLabel>
                  <Select
                    value={autoSavingsConfig.targetGoalId}
                    label="Meta de ahorro"
                    onChange={(e) => setAutoSavingsConfig({
                      ...autoSavingsConfig,
                      targetGoalId: e.target.value,
                    })}
                  >
                    {goals
                      .filter(goal => !goal.completed)
                      .map((goal) => (
                        <MenuItem key={goal.id} value={goal.id}>
                          {goal.name} - Progreso: {((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)}%
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
              >
                Guardar Configuración
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default AutoSavingsSettings;
