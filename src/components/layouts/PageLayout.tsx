
import React, { ReactNode, useEffect, useState } from 'react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import MobileSidebar from '../MobileSidebar';
import ContactBanner from '../ContactBanner';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  noFooter?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  className,
  fullWidth = false,
  noFooter = false
}) => {
  const [isPageVisible, setIsPageVisible] = useState(false);
  
  useEffect(() => {
    // When component mounts, delay slightly before showing to ensure animation runs
    const timer = setTimeout(() => {
      setIsPageVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main 
        className={cn(
          "flex-1 pt-16 md:pt-24 pb-8 md:pb-12 px-4 md:px-6 lg:px-8 transition-all duration-500",
          fullWidth ? "" : "max-w-7xl mx-auto w-full",
          isPageVisible 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-8",
          className
        )}
      >
        {children}
      </main>
      <ContactBanner />
      {!noFooter && <Footer />}
      <MobileSidebar />
    </div>
  );
};

export default PageLayout;
