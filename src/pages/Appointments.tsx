import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Plus, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import BottomNavigation from "@/components/BottomNavigation";

const Appointments = () => {
  const navigate = useNavigate();
  
  // Mock data for upcoming appointments
  const appointments = [
    {
      id: '1',
      doctorName: "Fernando Quinteros",
      specialty: "Traumatologia",
      date: new Date(),
      time: "11:00 AM"
    },
    {
      id: '2',
      doctorName: "Fernando Quinteros",
      specialty: "Traumatologia",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      time: "10:00 AM"
    },
    {
      id: '3',
      doctorName: "Fernando Quinteros",
      specialty: "Traumatologia",
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      time: "09:30 AM"
    }
  ];

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    }
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
        <h1 className="text-xl font-bold">Consultas</h1>
        <div className="ml-auto">
          <Button 
            size="sm" 
            onClick={() => navigate('/appointments/new')}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nuevo
          </Button>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto py-4 px-6 pb-16">
        <div className="space-y-4">
          {appointments.map(appointment => (
            <Card 
              key={appointment.id} 
              className="cursor-pointer" 
              onClick={() => navigate(`/appointment/${appointment.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Dr. {appointment.doctorName}</h3>
                    <p className="text-sm text-gray-500">{appointment.specialty}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(appointment.date)}, {appointment.time}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Appointments; 