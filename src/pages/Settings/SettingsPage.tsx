import React, { useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import { useSettings, availableCurrencies } from '../../context/SettingsContext';
import CategoriesPage from './CategoriesPage';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SettingsPage: React.FC = () => {
  const { settings, updateSettings, formatMoney } = useSettings();
  const [activeTab, setActiveTab] = useState(0);

  const handleCurrencyChange = (currencyCode: string) => {
    updateSettings({
      currency: availableCurrencies[currencyCode],
    });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getFormatExample = (amount: number) => {
    return formatMoney(amount);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="configuración tabs"
            >
              <Tab label="Moneda" />
              <Tab label="Categorías" />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            <Box sx={{ maxWidth: 600, px: 2 }}>
              <Typography variant="h6" gutterBottom component="div">
                Configuración de Moneda
              </Typography>
              <FormControl fullWidth>
                <InputLabel id="currency-select-label">Moneda</InputLabel>
                <Select
                  labelId="currency-select-label"
                  id="currency-select"
                  value={settings.currency.code}
                  label="Moneda"
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                >
                  {Object.values(availableCurrencies).map((currency) => (
                    <MenuItem key={currency.code} value={currency.code}>
                      {currency.name} ({currency.symbol}) - {currency.code}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="subtitle1" sx={{ mt: 4, mb: 2 }}>
                Formato Actual
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Números Pequeños"
                    secondary={getFormatExample(1234.56)}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Números Grandes"
                    secondary={getFormatExample(1234567.89)}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Detalles del Formato"
                    secondary={`
                      Símbolo: ${settings.currency.symbol}
                      Posición del símbolo: ${settings.currency.symbolPosition === 'before' ? 'Antes' : 'Después'}
                      Separador decimal: "${settings.currency.decimalSeparator}"
                      Separador de miles: "${settings.currency.thousandsSeparator}"
                    `}
                  />
                </ListItem>
              </List>
            </Box>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <CategoriesPage />
          </TabPanel>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default SettingsPage;
