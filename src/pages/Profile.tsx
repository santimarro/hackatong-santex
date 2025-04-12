import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, User, Settings, LogOut, Shield, Bell } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";

const Profile = () => {
  const navigate = useNavigate();
  
  // Mock user data
  const user = {
    name: "Juan Pérez",
    email: "juan.perez@example.com",
    phone: "+54 9 351 555 1234",
    birthdate: "15/08/1965",
    address: "Av. Colón 1234, Córdoba, Argentina",
    bloodType: "O+",
    emergencyContact: {
      name: "Ana Pérez (hija)",
      phone: "+54 9 351 555 7788"
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
        <h1 className="text-xl font-bold">Perfil</h1>
      </header>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto py-6 px-6 pb-16">
        <div className="space-y-6">
          {/* User profile card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-gray-200 rounded-full p-4 mr-4">
                  <User className="h-10 w-10 text-gray-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{user.name}</h2>
                  <p className="text-gray-500">{user.email}</p>
                  <p className="text-gray-500">{user.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Personal information */}
          <div>
            <h3 className="font-medium text-lg mb-3">Información personal</h3>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-gray-500">Fecha de nacimiento</p>
                    <p>{user.birthdate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Grupo sanguíneo</p>
                    <p>{user.bloodType}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p>{user.address}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Contacto de emergencia</p>
                  <p>{user.emergencyContact.name} - {user.emergencyContact.phone}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Settings menu */}
          <div>
            <h3 className="font-medium text-lg mb-3">Configuración</h3>
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-gray-100">
                  <li>
                    <button className="flex items-center w-full p-4 hover:bg-gray-50">
                      <Shield className="h-5 w-5 mr-3 text-gray-500" />
                      <span>Privacidad y seguridad</span>
                    </button>
                  </li>
                  <li>
                    <button className="flex items-center w-full p-4 hover:bg-gray-50">
                      <Bell className="h-5 w-5 mr-3 text-gray-500" />
                      <span>Notificaciones</span>
                    </button>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          {/* Logout button */}
          <Button 
            variant="outline" 
            className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Profile; 