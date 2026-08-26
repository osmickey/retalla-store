import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TabBar from '../components/TabBar';

export default function StorefrontLayout({ navbarVariant = 'simple' }) {
  return (
    <>
      <Navbar variant={navbarVariant} />
      <Outlet />
      <Footer />
      <TabBar />
    </>
  );
}
