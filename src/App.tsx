import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";

// Under construction page
import UnderConstruction from "./pages/UnderConstruction";

// Original pages (commented out during construction phase)
// import Notes from "./pages/Notes";
// import NotFound from "./pages/NotFound";
// import Dashboard from "./pages/Dashboard";
// import Appointments from "./pages/Appointments";
// import AppointmentDetail from "./pages/AppointmentDetail";
// import NoteDetail from "./pages/NoteDetail";
// import Chat from "./pages/Chat";
// import Emergency from "./pages/Emergency";
// import Profile from "./pages/Profile";
// import PublicEmergency from "./pages/PublicEmergency";
// import AppointmentForm from "./components/AppointmentForm";

const App = () => {
  // Create a client inside the component to ensure React context is available
  const [queryClient] = useState(() => new QueryClient());

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* During construction phase, all routes redirect to the Under Construction page */}
            <Route path="*" element={<UnderConstruction />} />
            
            {/* Original routes (disabled during construction phase)
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/note/:id" element={<NoteDetail />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/appointments/new" element={<AppointmentForm />} />
            <Route path="/appointment/:id" element={<AppointmentDetail />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/emergency" element={<Emergency />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/consultation/new" element={<Navigate to="/notes" replace state={{ preserveSearch: true }} />} />
            <Route path="/emergency/public/:userId" element={<PublicEmergency />} />
            <Route path="*" element={<NotFound />} />
            */}
          </Routes>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
