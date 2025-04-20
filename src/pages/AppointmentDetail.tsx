import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Stethoscope, Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from '@/lib/auth-context';
import { getAppointment, completeAppointment } from '@/lib/appointment-service';
import { createConsultation } from '@/lib/consultation-service';
import { Appointment } from '@/types/Note';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const AppointmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingConsultation, setStartingConsultation] = useState(false);

  // Fetch appointment details when component mounts
  useEffect(() => {
    const fetchAppointment = async () => {
      if (!id || !user) {
        setLoading(false);
        return;
      }

      try {
        const data = await getAppointment(id);
        if (!data) {
          throw new Error('Appointment not found');
        }
        
        // Check if the user is authorized to view this appointment
        if (data.patient_id !== user.id && data.doctor_id !== user.id) {
          throw new Error('You are not authorized to view this appointment');
        }
        
        setAppointment(data);
      } catch (err: any) {
        console.error('Error fetching appointment:', err);
        setError(err.message || 'Failed to load appointment details');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id, user]);

  // Format date and time from ISO string
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return { date: 'N/A', time: 'N/A' };
    
    const date = new Date(dateString);
    return {
      date: format(date, 'PPP'), // e.g., April 18, 2025
      time: format(date, 'h:mm a') // e.g., 11:00 AM
    };
  };

  const handleStartConsultation = async () => {
    if (!appointment || !user || !id) {
      toast({
        title: "Error",
        description: "Unable to start consultation",
        variant: "destructive",
      });
      return;
    }

    setStartingConsultation(true);

    try {
      // Create a new consultation linked to this appointment
      const consultationData = {
        title: appointment.title || 'Medical Consultation',
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        appointment_date: appointment.scheduled_for,
        appointment_location: appointment.location,
        status: 'pending',
        custom_notes: appointment.notes || '',
      };

      const consultation = await createConsultation(consultationData);

      if (!consultation) {
        throw new Error('Failed to create consultation');
      }

      // Mark the appointment as completed and link it to the consultation
      await completeAppointment(id, consultation.id);

      // Navigate to the notes page with the consultation ID
      navigate(`/notes?consultation=${consultation.id}`);
    } catch (err: any) {
      console.error('Error starting consultation:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to start consultation",
        variant: "destructive",
      });
      setStartingConsultation(false);
    }
  };

  // Extract the formatted date and time
  const { date, time } = formatDateTime(appointment?.scheduled_for);

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
        <h1 className="text-xl font-bold">Appointment Details</h1>
      </header>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto py-6 px-6">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-800 rounded-md">
            {error}
          </div>
        ) : appointment ? (
          <div className="space-y-6">
            {/* Appointment title */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold">{appointment.title || "Medical Appointment"}</h2>
              <div className="flex items-center text-sm text-gray-500">
                <div className={`h-2 w-2 rounded-full mr-2 ${
                  appointment.status === 'scheduled' ? 'bg-green-500' : 
                  appointment.status === 'completed' ? 'bg-blue-500' : 
                  appointment.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-500'
                }`} />
                <span className="capitalize">{appointment.status}</span>
              </div>
            </div>
            
            {/* Appointment details */}
            <Card className="bg-gray-50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{date}</span>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{time}</span>
                </div>
                
                {appointment.location && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                    <span>{appointment.location}</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Notes */}
            {appointment.notes && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <div className="p-3 border border-gray-200 rounded-md bg-white min-h-[100px]">
                  {appointment.notes.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">Appointment not found</p>
          </div>
        )}
      </div>
      
      {/* Actions */}
      {appointment && appointment.status === 'scheduled' && (
        <div className="p-6 border-t border-gray-200 pb-24">
          <Button 
            className="w-full"
            onClick={handleStartConsultation}
            disabled={startingConsultation}
          >
            {startingConsultation ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting Consultation...
              </>
            ) : (
              "Start Consultation"
            )}
          </Button>
        </div>
      )}
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default AppointmentDetail;