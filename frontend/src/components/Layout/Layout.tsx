import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../../context/AuthContext';

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  showFooter?: boolean;
}

export default function Layout({ children, showSidebar = true, showFooter = true }: LayoutProps) {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen flex bg-background-light dark:bg-background-dark transition-colors duration-200">
      {showSidebar && isAuthenticated && <Sidebar />}
      <div className={`flex-1 flex flex-col ${isAuthenticated && showSidebar ? 'ml-64' : ''}`}>
        <main className="flex-1 w-full">
          {children}
        </main>
        {showFooter && <Footer />}
      </div>
    </div>
  );
}
