import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface EmergencyData {
  fullName: string;
  age: number;
  bloodType: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  lastConsultation: string;
  emergencyContact: {
    name: string;
    phone: string;
  };
}

const PublicEmergency = () => {
  const { userId } = useParams<{ userId: string }>();
  const [loading, setLoading] = useState(true);
  const [emergencyData, setEmergencyData] = useState<EmergencyData | null>(null);
  
  useEffect(() => {
    // In a real application, this would fetch data from an API
    // based on the userId parameter
    // Here we're using mock data for demonstration
    
    const fetchEmergencyData = () => {
      setLoading(true);
      
      // Simulate API call with timeout
      setTimeout(() => {
        // Mock emergency data
        const mockData: EmergencyData = {
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
          }
        };
        
        setEmergencyData(mockData);
        setLoading(false);
      }, 500);
    };
    
    fetchEmergencyData();
  }, [userId]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información de emergencia...</p>
        </div>
      </div>
    );
  }
  
  if (!emergencyData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="bg-red-100 p-4 rounded-full inline-flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Información no disponible</h1>
          <p className="mt-2 text-gray-600">No se pudo encontrar la información de emergencia solicitada.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="bg-red-100 p-4 rounded-full inline-flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Información médica de emergencia</h1>
        </div>
        
        <Card className="w-full border-red-200 mb-8">
          <CardContent className="p-4">
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
        
        <div className="text-center text-gray-500 text-sm">
          <p>Esta información es confidencial y debe ser utilizada únicamente por personal médico en caso de emergencia.</p>
        </div>
      </div>
    </div>
  );
};

export default PublicEmergency; 