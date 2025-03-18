
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import Attendance from "./pages/Attendance";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Admin from './pages/Admin';
import Contact from './pages/Contact';
import SplashAnimation from "./components/SplashAnimation";
import { AttendanceProvider } from './contexts/AttendanceContext';
import { AnimatePresence } from 'framer-motion';

const queryClient = new QueryClient();

// This component wraps our routes with AnimatePresence for exit animations
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AttendanceProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          
          {/* Splash Animation */}
          {showSplash && (
            <SplashAnimation 
              onComplete={() => setShowSplash(false)}
              duration={3000} 
            />
          )}
          
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AttendanceProvider>
  );
}

export default App;
