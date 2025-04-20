import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Stethoscope, FileText, Loader2, ShieldCheck } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/lib/auth-context";
import { getProfile } from "@/lib/profile-service";
import { getUpcomingAppointments } from "@/lib/appointment-service";
import { getUserConsultations } from "@/lib/consultation-service";
import { isUserAdmin } from "@/lib/supabase";
import { Profile, Appointment, Consultation } from "@/types/Note";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [recentConsultations, setRecentConsultations] = useState<Consultation[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch user profile
        const userProfile = await getProfile(user.id);
        setProfile(userProfile);
        
        // Check if user is admin
        const adminStatus = await isUserAdmin();
        setIsAdmin(adminStatus);
        
        // Fetch upcoming appointments
        const appointments = await getUpcomingAppointments(user.id);
        setUpcomingAppointments(appointments.slice(0, 2)); // Limit to 2 appointments
        
        // Fetch recent consultations
        const consultations = await getUserConsultations(user.id);
        setRecentConsultations(consultations.slice(0, 2)); // Limit to 2 consultations
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
              Welcome {profile?.full_name || 'User'}
            </h1>
            <div className="mt-4 flex justify-center">
              <div className="w-1/3">
                <img 
                  src={profile?.avatar_url || "/assets/avatar.png"} 
                  alt="Avatar" 
                  className="mx-auto rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/150';
                  }}
                />
              </div>
            </div>
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
              className="w-full mb-6" 
              onClick={() => navigate('/appointments')}
            >
              View all appointments
            </Button>
          </div>

          {/* Previous consultation notes */}
          <div className="mt-2 px-6">
            <h2 className="text-lg font-medium mb-2">Previous Consultations</h2>
            
            {recentConsultations.length > 0 ? (
              recentConsultations.map((consultation) => (
                <Card 
                  key={consultation.id}
                  className="mb-4 cursor-pointer" 
                  onClick={() => navigate(`/note/${consultation.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{consultation.title}</h3>
                        <p className="text-sm text-gray-500">
                          {consultation.appointment_location || 'No location'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(consultation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                You have no previous consultations
              </div>
            )}
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/notes')}
            >
              View all consultations
            </Button>
          </div>

          {/* Admin section - only visible to admins */}
          {isAdmin && (
            <div className="mt-6 px-6 pb-6">
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-medium">Admin Dashboard</h2>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Manage users and control who can register in the application.
                  </p>
                  <Button 
                    onClick={() => navigate('/admin')} 
                    className="w-full"
                  >
                    Access Admin Panel
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Dashboard; 