import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Stethoscope, Upload, Calendar, Clock, MapPin } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";

const AppointmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Mock data for the appointment
  const appointment = {
    id: id || '1',
    doctorName: "Fernando Quinteros",
    specialty: "Traumatologia",
    institution: "Hospital Italiano",
    date: new Date(),
    time: "11:00 AM",
    location: "Consultorio 305, Piso 3",
    status: "scheduled" as const, // Type assertion
    notes: "Primera consulta por dolor en la rodilla derecha."
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    // Navigate to the notes page with the appointment ID as a query parameter
    navigate(`/notes?appointment=${id}`);
  };

  const handleUploadAudio = () => {
    setIsUploading(true);
    // This would open the upload modal
    // For now we'll navigate directly to the consultation page
    navigate(`/consultation/new?appointment=${id}`);
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
        <h1 className="text-xl font-bold">Consulta - Datos Iniciales</h1>
      </header>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto py-6 px-6">
        <div className="space-y-6">
          {/* Doctor info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Médico</label>
              <input 
                type="text" 
                className="w-full p-2 border border-gray-300 rounded-md" 
                value={appointment.doctorName} 
                readOnly 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Especialidad</label>
              <input 
                type="text" 
                className="w-full p-2 border border-gray-300 rounded-md" 
                value={appointment.specialty} 
                readOnly 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Institución</label>
              <input 
                type="text" 
                className="w-full p-2 border border-gray-300 rounded-md" 
                value={appointment.institution} 
                readOnly 
              />
            </div>
          </div>
          
          {/* Appointment details */}
          <Card className="bg-gray-50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                <span>{appointment.date.toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-gray-500" />
                <span>{appointment.time}</span>
              </div>
              
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                <span>{appointment.location}</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notas</label>
            <textarea 
              className="w-full p-2 border border-gray-300 rounded-md min-h-[100px]" 
              value={appointment.notes}
              readOnly
            />
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="p-6 border-t border-gray-200 pb-24">
        <Button 
          className="w-full mb-3"
          onClick={handleStartRecording}
        >
          Iniciar Consulta
        </Button>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default AppointmentDetail; 