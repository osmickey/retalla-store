import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TabBar from '../components/TabBar';

export default function StorefrontLayout() {
  return (
    <>
      <Navbar variant="simple" />
      <Outlet />
      <Footer />
      <TabBar />
    </>
  );
}
