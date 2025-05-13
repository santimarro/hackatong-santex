import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, ChevronRight, Loader2 } from "lucide-react";
import { formatDistanceToNow, format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from '@/lib/auth-context';
import { getUpcomingAppointments } from '@/lib/appointment-service';
import { Appointment } from '@/types/Note';
import { useToast } from '@/components/ui/use-toast';

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Show a toast message if passed via navigation state
  useEffect(() => {
    if (location.state?.message) {
      toast({
        title: "Success",
        description: location.state.message,
      });
      // Clear the state after showing the toast
      navigate(location.pathname, { replace: true });
    }
  }, [location, toast, navigate]);

  // Fetch upcoming appointments when component mounts
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await getUpcomingAppointments(user.id);
        setAppointments(data);
      } catch (err: any) {
        console.error('Error fetching appointments:', err);
        setError(err.message || 'Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return formatDistanceToNow(date, { addSuffix: true, locale: enUS });
    }
  };

  // Extract time from ISO date string for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };
  
  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="flex items-center px-6 py-4 border-b border-gray-200">
        <button 
          className="mr-2" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Appointments</h1>
        <div className="ml-auto">
          <Button 
            size="sm" 
            onClick={() => navigate('/appointments/new')}
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto py-4 px-6 pb-16">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-800 rounded-md">
            {error}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4">No upcoming appointments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map(appointment => {
              const handleClick = () => {
                if (appointment.status === 'completed' && appointment.consultation_id) {
                  navigate(`/notes/${appointment.consultation_id}`);
                } else {
                  navigate(`/appointment/${appointment.id}`);
                }
              };

              return (
                <Card 
                  key={appointment.id} 
                  className="cursor-pointer" 
                  onClick={handleClick}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{appointment.title || "Medical Appointment"}</h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(appointment.scheduled_for)}, {formatTime(appointment.scheduled_for)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {appointment.location || "Virtual"}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default AppointmentsPage;