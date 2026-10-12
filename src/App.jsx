import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SectorProvider } from './context/SectorContext';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <SectorProvider>
            <AppRoutes />
          </SectorProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}