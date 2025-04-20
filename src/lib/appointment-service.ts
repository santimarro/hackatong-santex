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