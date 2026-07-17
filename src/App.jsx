import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RedirectPage from './pages/RedirectPage';
import AdminPage from './pages/AdminPage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin/:shortCode" element={<AdminPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/:shortCode" element={<RedirectPage />} />
    </Routes>
  );
}

export default App;
