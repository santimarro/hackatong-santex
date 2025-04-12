import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Stethoscope } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Mock data for upcoming appointments
  const upcomingAppointment = {
    doctorName: "Fernando Quintero",
    specialty: "Traumatología",
    date: new Date(),
    time: "11:00 AM"
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
      <div className="flex-1 overflow-auto pb-16">
        {/* Welcome banner */}
        <div className="pt-4 px-6">
          <h1 className="text-xl font-bold">Bienvenido Juan Perez</h1>
          <div className="mt-4 flex justify-center">
            <div className="w-1/3">
              <img 
                src="/assets/avatar.png" 
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
          <h2 className="text-lg font-medium mb-2">Proximos Turnos</h2>
          
          <Card className="mb-4 cursor-pointer" onClick={() => navigate('/appointment/1')}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{upcomingAppointment.doctorName}</h3>
                  <p className="text-sm text-gray-500">{upcomingAppointment.specialty}</p>
                  <p className="text-sm text-gray-500">Today, {upcomingAppointment.time}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => navigate('/appointments')}
          >
            Ver todos los turnos
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Dashboard; 