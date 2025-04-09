
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquare, Stethoscope, QrCode, User } from "lucide-react";
import { cn } from "@/lib/utils";

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around p-2">
        <button 
          onClick={() => navigate('/chat')}
          className={cn(
            "flex flex-col items-center p-2 rounded-md w-16",
            isActive('/chat') ? "text-indigo-600" : "text-gray-500"
          )}
        >
          <MessageSquare className="h-6 w-6" />
          <span className="text-xs mt-1">Chat</span>
        </button>

        <button 
          onClick={() => navigate('/notes')}
          className={cn(
            "flex flex-col items-center p-2 rounded-md w-16", 
            isActive('/notes') ? "text-indigo-600" : "text-gray-500"
          )}
        >
          <Stethoscope className="h-6 w-6" />
          <span className="text-xs mt-1">Consultas</span>
        </button>

        <button 
          onClick={() => navigate('/qr')}
          className={cn(
            "flex flex-col items-center p-2 rounded-md w-16",
            isActive('/qr') ? "text-indigo-600" : "text-gray-500"
          )}
        >
          <QrCode className="h-6 w-6" />
          <span className="text-xs mt-1">QRs</span>
        </button>

        <button 
          onClick={() => navigate('/profile')}
          className={cn(
            "flex flex-col items-center p-2 rounded-md w-16",
            isActive('/profile') ? "text-indigo-600" : "text-gray-500"
          )}
        >
          <User className="h-6 w-6" />
          <span className="text-xs mt-1">Perfil</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNavigation;
