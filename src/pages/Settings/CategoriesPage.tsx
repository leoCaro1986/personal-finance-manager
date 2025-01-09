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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { db } from '../../database/db';
import { Category } from '../../types';

interface CategoryFormData {
  name: string;
  type: 'ingreso' | 'gasto';
}

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    type: 'gasto',
  });

  const loadCategories = async () => {
    try {
      setLoading(true);
      const loadedCategories = await db.getCategories();
      setCategories(loadedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        name: category.name,
        type: category.type,
      });
    } else {
      setSelectedCategory(null);
      setFormData({
        name: '',
        type: 'gasto',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCategory(null);
    setFormData({
      name: '',
      type: 'gasto',
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        setError('El nombre de la categoría es requerido');
        return;
      }

      if (selectedCategory) {
        // La actualización de categorías no está implementada en la base de datos
        // Por ahora, eliminamos la categoría antigua y creamos una nueva
        await db.deleteCategory(selectedCategory.id!);
        await db.addCategory(formData);
      } else {
        await db.addCategory(formData);
      }

      await loadCategories();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving category:', error);
      setError('Error al guardar la categoría');
    }
  };

  const handleDelete = async (category: Category) => {
    if (!category.isDefault && window.confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
      try {
        await db.deleteCategory(category.id!);
        await loadCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        setError('Error al eliminar la categoría');
      }
    }
  };

  const filterCategories = (type: 'ingreso' | 'gasto') => {
    return categories.filter(category => category.type === type);
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
          <Typography variant="h4">Categorías</Typography>
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
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Categorías de Ingresos
          </Typography>
          <List>
            {filterCategories('ingreso').map((category) => (
              <React.Fragment key={category.id}>
                <ListItem>
                  <ListItemText primary={category.name} />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleOpenDialog(category)}
                      disabled={category.isDefault}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDelete(category)}
                      disabled={category.isDefault}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Categorías de Gastos
          </Typography>
          <List>
            {filterCategories('gasto').map((category) => (
              <React.Fragment key={category.id}>
                <ListItem>
                  <ListItemText primary={category.name} />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() => handleOpenDialog(category)}
                      disabled={category.isDefault}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() => handleDelete(category)}
                      disabled={category.isDefault}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Grid>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedCategory ? 'Editar Categoría' : 'Nueva Categoría'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Nombre"
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.type}
                  label="Tipo"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'ingreso' | 'gasto' })}
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
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default CategoriesPage;
