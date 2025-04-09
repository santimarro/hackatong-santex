
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight, Stethoscope, MessageSquare, QrCode, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Appointment } from '@/types/Note';
import BottomNavigation from '@/components/BottomNavigation';

const Home = () => {
  const [userName, setUserName] = useState('Usuario');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user name from local storage if exists
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    }

    // Get appointments from local storage if exist
    const storedAppointments = localStorage.getItem('appointments');
    if (storedAppointments) {
      try {
        setAppointments(JSON.parse(storedAppointments));
      } catch (e) {
        console.error("Error parsing appointments:", e);
      }
    } else {
      // Add sample appointment if none exist
      const sampleAppointment: Appointment = {
        id: "1",
        doctorName: "Fernando Quintero",
        specialty: "Traumatología",
        date: new Date().toISOString().split('T')[0],
        time: "11:00 AM",
        location: "Hospital Italiano"
      };
      
      setAppointments([sampleAppointment]);
      localStorage.setItem('appointments', JSON.stringify([sampleAppointment]));
    }
  }, []);

  const goToConsultations = () => {
    navigate('/notes');
  };
  
  const goToAppointments = () => {
    navigate('/appointments');
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <main className="flex-1 p-6 pb-20 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Bienvenido {userName}</h1>
        </div>

        <div className="flex justify-center mb-8">
          <img 
            src="/lovable-uploads/2056ecb1-f5c1-46d8-b817-a8501cb36756.png" 
            alt="Ilustración de usuario" 
            className="w-40 h-40 object-contain"
          />
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Próximos Turnos</h2>
          <ScrollArea className="h-32">
            {appointments.length > 0 ? (
              appointments.map((appointment) => (
                <Card key={appointment.id} className="mb-3">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium">{appointment.doctorName}</div>
                      <div className="text-sm text-gray-600">{appointment.specialty}</div>
                      <div className="text-sm text-gray-600">
                        Today, {appointment.time}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={goToAppointments}>
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-500">No tienes turnos programados</p>
            )}
          </ScrollArea>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Button 
            className="h-14 bg-indigo-500 hover:bg-indigo-600" 
            onClick={goToConsultations}
          >
            Iniciar Consulta
          </Button>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Home;
