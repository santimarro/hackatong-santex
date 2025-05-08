import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

interface RequireDoctorProps {
  children: React.ReactNode;
}

const RequireDoctor = ({ children }: RequireDoctorProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isDoctor, setIsDoctor] = useState(false);

  useEffect(() => {
    const checkDoctorStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_doctor')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking doctor status:', error);
          setIsDoctor(false);
        } else {
          setIsDoctor(data.is_doctor);
        }
      } catch (error) {
        console.error('Error checking doctor status:', error);
        setIsDoctor(false);
      } finally {
        setLoading(false);
      }
    };

    checkDoctorStatus();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isDoctor) {
    // Redirect them to the login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default RequireDoctor; 