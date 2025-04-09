
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, ChevronLeft, Calendar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Appointment } from '@/types/Note';
import BottomNavigation from '@/components/BottomNavigation';
import { useToast } from "@/hooks/use-toast";

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAppointment, setNewAppointment] = useState<Partial<Appointment>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const storedAppointments = localStorage.getItem('appointments');
    if (storedAppointments) {
      try {
        setAppointments(JSON.parse(storedAppointments));
      } catch (e) {
        console.error("Error parsing appointments:", e);
      }
    }
  }, []);

  const saveAppointments = (updatedAppointments: Appointment[]) => {
    localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
    setAppointments(updatedAppointments);
  };

  const handleAddAppointment = () => {
    if (!newAppointment.doctorName || !newAppointment.date || !newAppointment.time || !newAppointment.specialty) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    const appointment: Appointment = {
      id: Date.now().toString(),
      doctorName: newAppointment.doctorName || '',
      specialty: newAppointment.specialty || '',
      date: newAppointment.date || '',
      time: newAppointment.time || '',
      location: newAppointment.location,
      notes: newAppointment.notes,
    };

    const updatedAppointments = [...appointments, appointment];
    saveAppointments(updatedAppointments);
    setNewAppointment({});
    setShowAddForm(false);

    toast({
      title: "Éxito",
      description: "Turno agregado correctamente",
    });
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="p-4 border-b flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold flex-1">Mis Turnos</h1>
        <Button variant="ghost" size="icon" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-5 w-5" />
        </Button>
      </header>

      <main className="flex-1 p-4 pb-20 overflow-auto">
        {showAddForm ? (
          <Card className="mb-6">
            <CardContent className="p-4 space-y-4">
              <h2 className="font-semibold">Nuevo Turno</h2>
              <div className="space-y-3">
                <Input 
                  placeholder="Nombre del Médico" 
                  value={newAppointment.doctorName || ''}
                  onChange={(e) => setNewAppointment({...newAppointment, doctorName: e.target.value})}
                />
                <Input 
                  placeholder="Especialidad" 
                  value={newAppointment.specialty || ''}
                  onChange={(e) => setNewAppointment({...newAppointment, specialty: e.target.value})}
                />
                <Input 
                  placeholder="Institución" 
                  value={newAppointment.location || ''}
                  onChange={(e) => setNewAppointment({...newAppointment, location: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input 
                    type="date" 
                    value={newAppointment.date || ''}
                    onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                  />
                  <Input 
                    type="time" 
                    value={newAppointment.time || ''}
                    onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowAddForm(false)}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={handleAddAppointment}>
                    Guardar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="space-y-3">
            {appointments.length > 0 ? (
              appointments.map((appointment) => (
                <Card key={appointment.id} className="mb-3">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">Dr. {appointment.doctorName}</h3>
                        <p className="text-sm text-gray-600">{appointment.specialty}</p>
                        {appointment.location && (
                          <p className="text-sm text-gray-600">{appointment.location}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{new Date(appointment.date).toLocaleDateString()}</p>
                        <p className="text-sm font-medium">{appointment.time}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No tienes turnos programados</p>
                <Button className="mt-4" onClick={() => setShowAddForm(true)}>
                  Agregar Turno
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Appointments;
