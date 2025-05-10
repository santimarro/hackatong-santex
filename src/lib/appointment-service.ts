import { supabase } from './supabase';
import { Database } from '../types/supabase';
import { withCache, dataCache } from './utils';

type Appointment = Database['public']['Tables']['appointments']['Row'];
type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];

// Cache TTL constants (in milliseconds)
const APPOINTMENT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const APPOINTMENTS_LIST_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export async function createAppointment(
  appointment: AppointmentInsert
): Promise<Appointment | null> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointment)
      .select()
      .single();

    if (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }

    // Invalidate appointments list cache for this user
    if (appointment.patient_id) {
      dataCache.invalidateByPrefix(`appointments:user:${appointment.patient_id}`);
    }
    if (appointment.doctor_id) {
      dataCache.invalidateByPrefix(`appointments:user:${appointment.doctor_id}`);
    }

    return data;
  } catch (error) {
    console.error('Error creating appointment:', error);
    return null;
  }
}

// Original fetch function for a single appointment
async function fetchAppointment(id: string): Promise<Appointment | null> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching appointment:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return null;
  }
}

// Cached version of getAppointment
export const getAppointment = withCache(
  fetchAppointment,
  (id: string) => `appointment:${id}`,
  APPOINTMENT_CACHE_TTL
);

// Original function for fetching user appointments
async function fetchUserAppointments(userId: string): Promise<Appointment[]> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .or(`patient_id.eq.${userId},doctor_id.eq.${userId}`)
      .order('scheduled_for', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
}

// Cached version of getUserAppointments
export const getUserAppointments = withCache(
  fetchUserAppointments,
  (userId: string) => `appointments:user:${userId}:all`,
  APPOINTMENTS_LIST_CACHE_TTL
);

// Original function for fetching upcoming appointments
async function fetchUpcomingAppointments(userId: string): Promise<Appointment[]> {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .or(`patient_id.eq.${userId},doctor_id.eq.${userId}`)
      .eq('status', 'scheduled')
      .gte('scheduled_for', now)
      .order('scheduled_for', { ascending: true });

    if (error) {
      console.error('Error fetching upcoming appointments:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    return [];
  }
}

// Cached version of getUpcomingAppointments
export const getUpcomingAppointments = withCache(
  fetchUpcomingAppointments,
  (userId: string) => `appointments:user:${userId}:upcoming`,
  APPOINTMENTS_LIST_CACHE_TTL
);

// Original function for fetching past appointments
async function fetchPastAppointments(userId: string): Promise<Appointment[]> {
  try {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .or(`patient_id.eq.${userId},doctor_id.eq.${userId}`)
      .or('status.eq.completed,scheduled_for.lt.' + now)
      .order('scheduled_for', { ascending: false });

    if (error) {
      console.error('Error fetching past appointments:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching past appointments:', error);
    return [];
  }
}

// Cached version of getPastAppointments
export const getPastAppointments = withCache(
  fetchPastAppointments,
  (userId: string) => `appointments:user:${userId}:past`,
  APPOINTMENTS_LIST_CACHE_TTL
);

export async function updateAppointment(
  id: string,
  updates: AppointmentUpdate
): Promise<Appointment | null> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }

    // Invalidate specific appointment cache
    dataCache.invalidate(`appointment:${id}`);
    
    // Invalidate user appointment list caches
    // We need to fetch the appointment to get user IDs
    const appointment = await fetchAppointment(id);
    if (appointment) {
      if (appointment.patient_id) {
        dataCache.invalidateByPrefix(`appointments:user:${appointment.patient_id}`);
      }
      if (appointment.doctor_id) {
        dataCache.invalidateByPrefix(`appointments:user:${appointment.doctor_id}`);
      }
    }

    return data;
  } catch (error) {
    console.error('Error updating appointment:', error);
    return null;
  }
}

export async function cancelAppointment(id: string): Promise<boolean> {
  try {
    // First get the appointment to invalidate user caches later
    const appointment = await fetchAppointment(id);
    
    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }

    // Invalidate specific appointment cache
    dataCache.invalidate(`appointment:${id}`);
    
    // Invalidate user appointment list caches
    if (appointment) {
      if (appointment.patient_id) {
        dataCache.invalidateByPrefix(`appointments:user:${appointment.patient_id}`);
      }
      if (appointment.doctor_id) {
        dataCache.invalidateByPrefix(`appointments:user:${appointment.doctor_id}`);
      }
    }

    return true;
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return false;
  }
}

export async function completeAppointment(
  id: string,
  consultationId?: string
): Promise<boolean> {
  try {
    // First get the appointment to invalidate user caches later
    const appointment = await fetchAppointment(id);
    
    const { error } = await supabase
      .from('appointments')
      .update({
        status: 'completed',
        consultation_id: consultationId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error completing appointment:', error);
      throw error;
    }

    // Invalidate specific appointment cache
    dataCache.invalidate(`appointment:${id}`);
    
    // Invalidate user appointment list caches
    if (appointment) {
      if (appointment.patient_id) {
        dataCache.invalidateByPrefix(`appointments:user:${appointment.patient_id}`);
      }
      if (appointment.doctor_id) {
        dataCache.invalidateByPrefix(`appointments:user:${appointment.doctor_id}`);
      }
    }

    return true;
  } catch (error) {
    console.error('Error completing appointment:', error);
    return false;
  }
}

// Function to delete an appointment by its ID
export const deleteAppointment = async (appointmentId: string): Promise<{ success: boolean; error?: any }> => {
  if (!appointmentId) {
    console.error("[Service] Attempted to delete appointment with no ID");
    return { success: false, error: new Error("Appointment ID is required for deletion.") };
  }

  try {
    // Paso 1: Obtener la appointment ANTES de eliminarla para get consultation_id y user IDs para la caché
    const { data: appointmentToDelete, error: fetchError } = await supabase
      .from('appointments')
      .select('id, consultation_id, patient_id, doctor_id')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointmentToDelete) {
      console.error(`[Service] Error fetching appointment ${appointmentId} before deletion:`, fetchError);
      return { success: false, error: fetchError || new Error("Appointment not found or failed to fetch.") };
    }

    // Paso 2: Si la appointment tiene un consultation_id, intentar eliminar la consultation correspondiente
    if (appointmentToDelete.consultation_id) {
      console.log(`[Service] Appointment ${appointmentId} has consultation_id ${appointmentToDelete.consultation_id}. Attempting to delete consultation.`);
      const { error: consultationDeleteError } = await supabase
        .from('consultations')
        .delete()
        .match({ id: appointmentToDelete.consultation_id });

      if (consultationDeleteError) {
        console.error(`[Service] Error deleting associated consultation ${appointmentToDelete.consultation_id}:`, consultationDeleteError);
        // Política de error: Por ahora, registramos el error de la consulta pero procedemos a eliminar la cita.
        // Si la eliminación de la consulta fuera crítica para el éxito de la operación, podríamos devolver un error aquí.
        // return { success: false, error: new Error(`Failed to delete associated consultation: ${consultationDeleteError.message}`) };
      } else {
        console.log(`[Service] Successfully deleted associated consultation ${appointmentToDelete.consultation_id}.`);
        // Invalidar cachés relacionadas con la consulta eliminada
        dataCache.invalidate(`consultation:${appointmentToDelete.consultation_id}`);
        dataCache.invalidateByPrefix(`summaries:${appointmentToDelete.consultation_id}`);
        dataCache.invalidateByPrefix(`transcriptions:${appointmentToDelete.consultation_id}`);
        dataCache.invalidateByPrefix(`attachments:${appointmentToDelete.consultation_id}`); // Assuming attachments are linked to consultations
      }
    }

    // Paso 3: Eliminar la appointment
    const { error: appointmentDeleteError } = await supabase
      .from('appointments')
      .delete()
      .match({ id: appointmentId });

    if (appointmentDeleteError) {
      console.error(`[Service] Error deleting appointment ${appointmentId} from Supabase:`, appointmentDeleteError);
      return { success: false, error: appointmentDeleteError };
    }

    // Paso 4: Mejorar la invalidación de caché para las listas de appointments
    console.log(`[Service] Invalidating caches for appointment ${appointmentId}`);
    dataCache.invalidate(`appointment:${appointmentId}`); // Caché de la cita individual
    if (appointmentToDelete.patient_id) {
      console.log(`[Service] Invalidating appointment list caches for patient_id: ${appointmentToDelete.patient_id}`);
      dataCache.invalidateByPrefix(`appointments:user:${appointmentToDelete.patient_id}`);
    }
    if (appointmentToDelete.doctor_id) { // Si los doctores también tienen listas de citas cacheadas por su ID
      console.log(`[Service] Invalidating appointment list caches for doctor_id: ${appointmentToDelete.doctor_id}`);
      dataCache.invalidateByPrefix(`appointments:user:${appointmentToDelete.doctor_id}`);
    }
    
    console.log(`[Service] Appointment ${appointmentId} and potentially associated consultation deleted successfully.`);
    return { success: true };

  } catch (error: any) {
    console.error(`[Service] Unexpected error during complex appointment deletion for ID ${appointmentId}:`, error);
    return { success: false, error: new Error(error.message || "An unexpected error occurred.") };
  }
};