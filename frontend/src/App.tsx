import { Navigate, Route, Routes } from 'react-router-dom';
import AppointmentWizard from './components/AppointmentWizard';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './components/admin/Dashboard';
import Appointments from './components/admin/Appointments';
import Services from './components/admin/Services';
import Doctors from './components/admin/Doctors';
import WorkingHours from './components/admin/WorkingHours';
import GoogleSheets from './components/admin/GoogleSheets';
import AuthGate from './components/admin/AuthGate';
import VerificationEmails from './components/admin/VerificationEmails';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<AppointmentWizard />} />
      <Route
        path="/admin"
        element={
          <AuthGate>
            <AdminLayout />
          </AuthGate>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="randevular" element={<Appointments />} />
        <Route path="hizmetler" element={<Services />} />
        <Route path="doktorlar" element={<Doctors />} />
        <Route path="calisma-saatleri" element={<WorkingHours />} />
        <Route path="google-sheets" element={<GoogleSheets />} />
        <Route path="eposta-sablonlari" element={<VerificationEmails />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
