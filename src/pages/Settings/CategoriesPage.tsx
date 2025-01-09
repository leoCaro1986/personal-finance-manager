import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Box,
  Chip,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { db, Category } from '../../database/db';

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'ingreso' as 'ingreso' | 'gasto',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const ingresos = await db.getCategories('ingreso');
    const gastos = await db.getCategories('gasto');
    setCategories([...ingresos, ...gastos]);
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setNewCategory({
        name: category.name,
        type: category.type,
      });
    } else {
      setEditingCategory(null);
      setNewCategory({
        name: '',
        type: 'ingreso',
      });
    }
    setDialogOpen(true);
    setError(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setNewCategory({
      name: '',
      type: 'ingreso',
    });
    setError(null);
  };

  const handleSave = async () => {
    try {
      if (!newCategory.name.trim()) {
        setError('El nombre de la categoría es requerido');
        return;
      }

      // Verificar si ya existe una categoría con el mismo nombre y tipo
      const existingCategory = categories.find(
        c => c.name.toLowerCase() === newCategory.name.toLowerCase() &&
            c.type === newCategory.type &&
            c.id !== editingCategory?.id
      );

      if (existingCategory) {
        setError('Ya existe una categoría con este nombre');
        return;
      }

      if (editingCategory?.id) {
        // Actualizar categoría existente
        await db.categories.update(editingCategory.id, {
          ...editingCategory,
          name: newCategory.name,
          type: newCategory.type,
        });
      } else {
        // Agregar nueva categoría
        await db.addCategory({
          name: newCategory.name,
          type: newCategory.type,
          isDefault: false,
        });
      }

      await loadCategories();
      handleCloseDialog();
    } catch (error) {
      console.error('Error al guardar la categoría:', error);
      setError('Error al guardar la categoría');
    }
  };

  const handleDelete = async (category: Category) => {
    try {
      // Verificar si la categoría está en uso
      const transactions = await db.transactions
        .where('category')
        .equals(category.name)
        .count();

      if (transactions > 0) {
        setError(`No se puede eliminar la categoría "${category.name}" porque está siendo utilizada en ${transactions} transacción(es)`);
        return;
      }

      if (category.isDefault) {
        setError('No se pueden eliminar las categorías predeterminadas');
        return;
      }

      await db.deleteCategory(category.id!);
      await loadCategories();
    } catch (error) {
      console.error('Error al eliminar la categoría:', error);
      setError('Error al eliminar la categoría');
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Gestión de Categorías</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Nueva Categoría
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Categorías de Ingresos */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Categorías de Ingresos
              </Typography>
              <List>
                {categories
                  .filter((cat) => cat.type === 'ingreso')
                  .map((category) => (
                    <React.Fragment key={category.id}>
                      <ListItem
                        secondaryAction={
                          <Box>
                            <Tooltip title="Editar categoría">
                              <IconButton
                                edge="end"
                                aria-label="edit"
                                onClick={() => handleOpenDialog(category)}
                                disabled={category.isDefault}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={
                              category.isDefault
                                ? 'No se puede eliminar una categoría predeterminada'
                                : 'Eliminar categoría'
                            }>
                              <span>
                                <IconButton
                                  edge="end"
                                  aria-label="delete"
                                  onClick={() => handleDelete(category)}
                                  disabled={category.isDefault}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {category.name}
                              {category.isDefault && (
                                <Chip
                                  label="Predeterminada"
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
              </List>
            </Grid>

            {/* Categorías de Gastos */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" color="error" gutterBottom>
                Categorías de Gastos
              </Typography>
              <List>
                {categories
                  .filter((cat) => cat.type === 'gasto')
                  .map((category) => (
                    <React.Fragment key={category.id}>
                      <ListItem
                        secondaryAction={
                          <Box>
                            <Tooltip title="Editar categoría">
                              <IconButton
                                edge="end"
                                aria-label="edit"
                                onClick={() => handleOpenDialog(category)}
                                disabled={category.isDefault}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={
                              category.isDefault
                                ? 'No se puede eliminar una categoría predeterminada'
                                : 'Eliminar categoría'
                            }>
                              <span>
                                <IconButton
                                  edge="end"
                                  aria-label="delete"
                                  onClick={() => handleDelete(category)}
                                  disabled={category.isDefault}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {category.name}
                              {category.isDefault && (
                                <Chip
                                  label="Predeterminada"
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
              </List>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Diálogo para agregar/editar categoría */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>
          {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin="dense"
                label="Nombre de la categoría"
                fullWidth
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                error={!!error}
                helperText={error}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={newCategory.type}
                  label="Tipo"
                  onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value as 'ingreso' | 'gasto' })}
                  disabled={editingCategory?.isDefault}
                >
                  <MenuItem value="ingreso">Ingreso</MenuItem>
                  <MenuItem value="gasto">Gasto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default CategoriesPage;
