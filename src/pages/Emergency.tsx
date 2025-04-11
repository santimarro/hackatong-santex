import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, AlertTriangle, Printer } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";

const Emergency = () => {
  const navigate = useNavigate();
  
  // Mock emergency data
  const emergencyData = {
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

  const handlePrint = () => {
    window.print();
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
        <h1 className="text-xl font-bold">En caso de Emergencia</h1>
      </header>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto p-6 pb-16">
        <div className="flex flex-col items-center">
          <p className="text-center mb-4">
            imprima este QR el cual contiene informacion<br/>
            Vital de Juan Perez
          </p>
          
          {/* QR Code - Replace with actual QR code component */}
          <div className="border-2 border-black p-2 mb-6">
            <img 
              src="/qr-placeholder.png" 
              alt="QR Code" 
              className="w-64 h-64"
              onError={(e) => {
                // Fallback to a basic QR representation if image not found
                e.currentTarget.outerHTML = `<div class="w-64 h-64 bg-gray-200 flex items-center justify-center text-gray-500">QR Code</div>`;
              }}
            />
          </div>
          
          <Button className="mb-6" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir QR
          </Button>
          
          {/* Emergency information preview */}
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
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Emergency; 