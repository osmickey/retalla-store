import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TabBar from '../components/TabBar';

// No Footer here — confirmed login.html/register.html have no <footer> at all.
export default function AuthLayout() {
  return (
    <div className="auth-page-bg">
      <Navbar variant="transparent" />
      <Outlet />
      <TabBar />
    </div>
  );
}
