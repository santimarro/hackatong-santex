import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import AppointmentForm from '@/components/AppointmentForm';
import { createAppointment } from '@/lib/appointment-service';
import { Database } from '@/types/supabase';
import { toast } from '@/components/ui/use-toast';

// Use the correct type for appointment insert
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];

const NewAppointment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (appointmentData: any) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create an appointment",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Format date and time for Supabase
      const scheduledDateTime = new Date(appointmentData.date);
      const [hours, minutes] = appointmentData.time.split(':');
      scheduledDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      // Create doctor name from the selected doctor
      const doctorName = appointmentData.doctorName;
      const specialty = appointmentData.specialty;

      // Create the appointment in Supabase
      const newAppointment: AppointmentInsert = {
        patient_id: user.id,
        doctor_id: null, // Using null instead of the mock doctorId since these aren't real UUIDs
        title: `${specialty} with ${doctorName}`,
        scheduled_for: scheduledDateTime.toISOString(),
        location: appointmentData.location || 'Virtual',
        status: 'scheduled',
        notes: appointmentData.reason + (appointmentData.additionalInfo ? `\n\nAdditional Info: ${appointmentData.additionalInfo}` : ''),
      };

      const appointment = await createAppointment(newAppointment);

      if (!appointment) {
        throw new Error('Failed to create appointment');
      }

      toast({
        title: "Success",
        description: "Appointment created successfully",
      });

      // Navigate back to appointments list
      navigate('/appointments', { state: { message: "Appointment scheduled successfully" } });
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create appointment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppointmentForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
  );
};

export default NewAppointment;