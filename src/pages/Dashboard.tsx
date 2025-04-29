import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Stethoscope, Loader2, QrCode } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/lib/auth-context";
import { getProfile } from "@/lib/profile-service";
import { getUpcomingAppointments } from "@/lib/appointment-service";
import { Profile, Appointment } from "@/types/Note";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch user profile
        const userProfile = await getProfile(user.id);
        setProfile(userProfile);
        
        // Fetch upcoming appointments
        const appointments = await getUpcomingAppointments(user.id);
        setUpcomingAppointments(appointments.slice(0, 2)); // Limit to 2 appointments
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [user]);

  // Format date and time for display
  const formatAppointmentDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const isToday = new Date().toDateString() === date.toDateString();
    
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Today, ${timeStr}`;
    return `${date.toLocaleDateString()}, ${timeStr}`;
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary flex items-center">
          <Stethoscope className="h-5 w-5 mr-2" />
          Harvey
        </h1>
      </header>

      {/* Main content */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-auto pb-16">
          {/* Welcome banner */}
          <div className="pt-4 px-6">
            <h1 className="text-xl font-bold">
              Welcome {profile?.full_name?.split(' ')[0] || 'User'}
            </h1>
          </div>

          {/* Emergency QR Code */}
          <div className="mt-6 px-6">
            <h2 className="text-lg font-medium mb-2">Emergency QR Code</h2>
            <Card className="mb-6">
              <CardContent className="p-4 flex flex-col items-center">
                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <QrCode className="h-32 w-32 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Show this QR code in case of emergency to access your medical information
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming appointments */}
          <div className="mt-6 px-6">
            <h2 className="text-lg font-medium mb-2">Upcoming Appointments</h2>
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <Card 
                  key={appointment.id}
                  className="mb-4 cursor-pointer" 
                  onClick={() => navigate(`/appointment/${appointment.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{appointment.title}</h3>
                        <p className="text-sm text-gray-500">
                          {appointment.location || 'No location'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatAppointmentDateTime(appointment.scheduled_for)}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                You have no upcoming appointments
              </div>
            )}
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/appointments')}
            >
              View all appointments
            </Button>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
};

export default Dashboard; 