import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import { AuthProvider } from "./lib/auth-context";
import Auth from "./components/Auth";
import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/RequireAdmin";

// Under construction page
import UnderConstruction from "./pages/UnderConstruction";

// Debug page
import Debug from "./pages/Debug";

// Pages
import Notes from "./pages/Notes";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import AppointmentDetail from "./pages/AppointmentDetail";
import NewAppointment from "./pages/NewAppointment";
import NoteDetail from "./pages/NoteDetail";
import Chat from "./pages/Chat";
import Emergency from "./pages/Emergency";
import Profile from "./pages/Profile";
import PublicEmergency from "./pages/PublicEmergency";
import Reminders from "./pages/Reminders";
import Setup from "./pages/Setup";
import Admin from "./pages/Admin";

// --- Doctor Review Page Import ---
import DoctorReviewPage from "./pages/DoctorReviewPage";
// --- End Doctor Review Page Import ---

const App = () => {
  // Create a client inside the component to ensure React context is available
  const [queryClient] = useState(() => new QueryClient());

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/emergency/public/:userId" element={<PublicEmergency />} />
              <Route path="/debug" element={<Debug />} />
              {/* --- New Public Route for Doctor Review --- */}
              <Route path="/doctor/review/:shareHash" element={<DoctorReviewPage />} />
              {/* --- End New Public Route --- */}
              
              {/* Temporary route */}
              <Route path="/under-construction" element={<UnderConstruction />} />
              
              {/* Private routes - require authentication */}
              <Route element={<RequireAuth />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/note/:id" element={<NoteDetail />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/appointments/new" element={<NewAppointment />} />
                <Route path="/appointment/:id" element={<AppointmentDetail />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/emergency" element={<Emergency />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/reminders" element={<Reminders />} />
                <Route path="/setup" element={<Setup />} />
                <Route path="/consultation/new" element={<Navigate to="/notes" replace state={{ preserveSearch: true }} />} />
              </Route>
              
              {/* Admin routes - require admin privileges */}
              <Route element={<RequireAdmin><RequireAuth /></RequireAdmin>}>
                <Route path="/admin" element={<Admin />} />
              </Route>
              
              {/* Fallback route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;