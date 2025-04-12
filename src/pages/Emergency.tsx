import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, AlertTriangle, Printer, Stethoscope } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import QRCode from "react-qr-code";

const Emergency = () => {
  const navigate = useNavigate();
  
  // Datos de emergencia de ejemplo
  const emergencyData = {
    id: "user123", // User ID for the public link
    fullName: "Juan Pérez",
    age: 58,
    bloodType: "O+",
    allergies: ["Ninguna conocida"],
    conditions: [
      "Hipertensión arterial",
      "Insuficiencia cardíaca leve (NYHA II)",
      "Dislipemia"
    ],
    medications: [
      "Enalapril 10 mg cada 12 h",
      "Bisoprolol 2.5 mg diarios",
      "Atorvastatina 20 mg nocturna"
    ],
    lastConsultation: "05/04/2024",
    emergencyContact: {
      name: "Ana Pérez (hija)",
      phone: "351 555 7788"
    },
    recommendations: [
      "Evitar esfuerzos físicos intensos",
      "Dieta hiposódica",
      "Seguimiento mensual"
    ],
    pendingTests: [
      "Ecocardiograma control pendiente"
    ]
  };

  // Generate the full URL for the public emergency page
  const publicEmergencyUrl = `${window.location.origin}/emergency/public/${emergencyData.id}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <button className="mr-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-primary flex items-center">
            <Stethoscope className="h-5 w-5 mr-2" />
            Harvey
          </h1>
        </div>
        <h2 className="text-base font-medium">En caso de Emergencia</h2>
      </header>
      
      {/* Contenido principal */}
      <div className="flex-1 overflow-auto p-6 pb-16">
        <div className="flex flex-col items-center">
          <p className="text-center mb-4">
            Imprima este QR el cual contiene información<br/>
            vital de Juan Pérez
          </p>
          
          {/* Código QR generado dinámicamente */}
          <div className="border-2 border-black p-4 mb-6 bg-white">
            <QRCode
              value={publicEmergencyUrl}
              size={256}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              viewBox={`0 0 256 256`}
            />
          </div>
          
          <Button className="mb-6" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir QR
          </Button>
          
          {/* Vista previa de información de emergencia */}
          <Card className="w-full max-w-md border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <h2 className="text-lg font-bold text-red-500">Información médica de emergencia</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Paciente: {emergencyData.fullName}</h3>
                  <p className="text-sm">Edad: {emergencyData.age} años</p>
                  <p className="text-sm">Grupo sanguíneo: {emergencyData.bloodType}</p>
                </div>
                
                <div>
                  <h3 className="font-medium">Alergias:</h3>
                  <ul className="list-disc pl-5 text-sm">
                    {emergencyData.allergies.map((allergy, index) => (
                      <li key={index}>{allergy}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium">Condiciones médicas preexistentes:</h3>
                  <ul className="list-disc pl-5 text-sm">
                    {emergencyData.conditions.map((condition, index) => (
                      <li key={index}>{condition}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium">Medicación actual:</h3>
                  <ul className="list-disc pl-5 text-sm">
                    {emergencyData.medications.map((med, index) => (
                      <li key={index}>{med}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium">Última consulta médica: {emergencyData.lastConsultation}</h3>
                </div>
                
                <div>
                  <h3 className="font-medium">Contacto de emergencia:</h3>
                  <p className="text-sm">{emergencyData.emergencyContact.name} — {emergencyData.emergencyContact.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Navegación inferior */}
      <BottomNavigation />
    </div>
  );
};

export default Emergency; 