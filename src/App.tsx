import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

// Original pages
import Notes from "./pages/Notes";

import NotFound from "./pages/NotFound";

// New pages
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import AppointmentDetail from "./pages/AppointmentDetail";
import Chat from "./pages/Chat";
import Emergency from "./pages/Emergency";
import Profile from "./pages/Profile";

// Components
import AppointmentForm from "./components/AppointmentForm";

// Mobile viewport wrapper component
const MobileViewport: React.FC<{children: React.ReactNode}> = ({ children }) => {
  useEffect(() => {
    // Set viewport meta tag to control the width and scale
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    
    // Add viewport meta tag if it doesn't exist
    if (!viewport) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <div className="mx-auto h-screen overflow-hidden" style={{ 
      maxWidth: '430px', 
      boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    }}>
      {children}
    </div>
  );
};

const App = () => {
  // Create a client inside the component to ensure React context is available
  const [queryClient] = useState(() => new QueryClient());

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <MobileViewport>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/appointments/new" element={<AppointmentForm />} />
              <Route path="/appointment/:id" element={<AppointmentDetail />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/emergency" element={<Emergency />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/consultation/new" element={<Navigate to="/notes" replace state={{ preserveSearch: true }} />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MobileViewport>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
