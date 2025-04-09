
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { User, Settings, LogOut, ChevronRight } from "lucide-react";
import BottomNavigation from '@/components/BottomNavigation';
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const [userName, setUserName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  const handleSaveName = () => {
    if (userName.trim()) {
      localStorage.setItem('userName', userName);
      setIsEditing(false);
      toast({
        title: "Guardado",
        description: "Nombre actualizado correctamente",
      });
    }
  };

  const handleLogout = () => {
    // In a real app, this would clear authentication state
    toast({
      title: "Cerrando sesión",
      description: "Hasta pronto",
    });
    setTimeout(() => {
      navigate('/setup');
    }, 1500);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold">Mi Perfil</h1>
      </header>

      <main className="flex-1 p-4 pb-20 overflow-auto">
        <div className="flex flex-col items-center mb-8 pt-4">
          <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
            <User className="h-12 w-12 text-gray-500" />
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2 mt-2">
              <Input 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Tu nombre"
                className="w-48"
              />
              <Button onClick={handleSaveName}>Guardar</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{userName || 'Usuario'}</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                Editar
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Button 
                variant="ghost" 
                className="w-full justify-between py-6 rounded-none"
                onClick={() => navigate('/setup')}
              >
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5" />
                  <span>Configuración</span>
                </div>
                <ChevronRight className="h-5 w-5" />
              </Button>
              <hr className="border-gray-100" />
              <Button 
                variant="ghost" 
                className="w-full justify-between py-6 rounded-none text-red-500 hover:text-red-600"
                onClick={handleLogout}
              >
                <div className="flex items-center gap-3">
                  <LogOut className="h-5 w-5" />
                  <span>Cerrar Sesión</span>
                </div>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>

          <div className="text-center text-xs text-gray-400 mt-8">
            <p>MediNote v1.0.0</p>
            <p className="mt-1">© 2025 MediNote. Todos los derechos reservados.</p>
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Profile;
