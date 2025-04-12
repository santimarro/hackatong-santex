
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Stethoscope, Upload, ArrowRight, Settings } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Setup = () => {
  const [deepgramApiKey, setDeepgramApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [patientPrompt, setPatientPrompt] = useState('');
  const [medicalPrompt, setMedicalPrompt] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [activeTab, setActiveTab] = useState("apiKeys");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Default system prompts
  const defaultPatientPrompt = `Crea un resumen médico amigable para el paciente a partir de la transcripción de la consulta médica. 
Incluye:
- Explicación simple del diagnóstico y qué significa
- Pasos de tratamiento explicados en lenguaje sencillo
- Signos de alerta que requieren atención médica
- Cuándo programar seguimiento
- Recomendaciones de estilo de vida
- Respuestas a preguntas frecuentes

Usa lenguaje simple, evita jerga médica, y organiza la información en secciones claras y fáciles de entender.`;

  const defaultMedicalPrompt = `Genera un resumen clínico profesional a partir de la transcripción de la consulta médica.
Incluye:
- Datos demográficos del paciente
- Historia clínica relevante
- Examen físico y hallazgos
- Resultados de pruebas e interpretación
- Diagnóstico diferencial y justificación
- Plan de tratamiento con dosificación específica
- Recomendaciones de seguimiento con plazos
- Consideraciones especiales

Utiliza terminología médica estándar, sé conciso pero completo, y estructura el resumen en formato SOAP cuando sea posible.`;

  // Check if API keys and prompts are already stored
  useEffect(() => {
    const storedDeepgramKey = localStorage.getItem('deepgramApiKey');
    const storedGeminiKey = localStorage.getItem('geminiApiKey');
    const storedPatientPrompt = localStorage.getItem('patientPrompt');
    const storedMedicalPrompt = localStorage.getItem('medicalPrompt');
    
    if (storedDeepgramKey && storedGeminiKey) {
      setDeepgramApiKey(storedDeepgramKey);
      setGeminiApiKey(storedGeminiKey);
    }

    if (storedPatientPrompt) {
      setPatientPrompt(storedPatientPrompt);
    } else {
      setPatientPrompt(defaultPatientPrompt);
    }
    
    if (storedMedicalPrompt) {
      setMedicalPrompt(storedMedicalPrompt);
    } else {
      setMedicalPrompt(defaultMedicalPrompt);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);

    // Basic validation - check for non-empty keys
    if (!deepgramApiKey.trim() || !geminiApiKey.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa ambas claves API",
        variant: "destructive",
      });
      setIsValidating(false);
      return;
    }

    // Store API keys and system prompts in localStorage
    localStorage.setItem('deepgramApiKey', deepgramApiKey);
    localStorage.setItem('geminiApiKey', geminiApiKey);
    
    // Store prompts if they're not empty, otherwise use the defaults
    if (patientPrompt.trim()) {
      localStorage.setItem('patientPrompt', patientPrompt);
    } else {
      localStorage.setItem('patientPrompt', defaultPatientPrompt);
      setPatientPrompt(defaultPatientPrompt);
    }
    
    if (medicalPrompt.trim()) {
      localStorage.setItem('medicalPrompt', medicalPrompt);
    } else {
      localStorage.setItem('medicalPrompt', defaultMedicalPrompt);
      setMedicalPrompt(defaultMedicalPrompt);
    }

    toast({
      title: "Éxito",
      description: "Configuración guardada correctamente",
    });

    setIsValidating(false);
    navigate('/notes');
  };

  const handleResetPatientPrompt = () => {
    setPatientPrompt(defaultPatientPrompt);
    toast({
      title: "Reiniciado",
      description: "Instrucciones para pacientes restablecidas",
    });
  };
  
  const handleResetMedicalPrompt = () => {
    setMedicalPrompt(defaultMedicalPrompt);
    toast({
      title: "Reiniciado",
      description: "Instrucciones para médicos restablecidas",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-light to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-primary">René</CardTitle>
          <CardDescription className="text-center">
            Toma el control de tus consultas médicas
          </CardDescription>
        </CardHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="apiKeys">Claves API</TabsTrigger>
            <TabsTrigger value="aiSettings">Configuración IA</TabsTrigger>
          </TabsList>
          
          <TabsContent value="apiKeys" className="space-y-4">
            <CardContent>
              <form className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="deepgramApiKey">Clave API de Deepgram</Label>
                  <Input
                    id="deepgramApiKey"
                    type="password"
                    placeholder="Ingresa tu clave API de Deepgram"
                    value={deepgramApiKey}
                    onChange={(e) => setDeepgramApiKey(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Obtén una clave en <a href="https://console.deepgram.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Deepgram Console</a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="geminiApiKey">Clave API de Gemini</Label>
                  <Input
                    id="geminiApiKey"
                    type="password"
                    placeholder="Ingresa tu clave API de Gemini"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Obtén una clave en <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>
                  </p>
                </div>
              </form>
            </CardContent>
          </TabsContent>
          
          <TabsContent value="aiSettings" className="space-y-4">
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="patientPrompt">Instrucciones para resumen de paciente</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleResetPatientPrompt}
                      className="text-xs h-7"
                    >
                      Restablecer
                    </Button>
                  </div>
                  <Textarea
                    id="patientPrompt"
                    placeholder="Instrucciones para el resumen orientado al paciente"
                    value={patientPrompt}
                    onChange={(e) => setPatientPrompt(e.target.value)}
                    className="min-h-[150px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Personaliza cómo se generan los resúmenes para pacientes
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="medicalPrompt">Instrucciones para resumen médico</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleResetMedicalPrompt}
                      className="text-xs h-7"
                    >
                      Restablecer
                    </Button>
                  </div>
                  <Textarea
                    id="medicalPrompt"
                    placeholder="Instrucciones para el resumen orientado a profesionales médicos"
                    value={medicalPrompt}
                    onChange={(e) => setMedicalPrompt(e.target.value)}
                    className="min-h-[150px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Personaliza cómo se generan los resúmenes técnicos para médicos
                  </p>
                </div>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
        <CardFooter>
          <Button onClick={handleSubmit} disabled={isValidating} className="w-full">
            {isValidating ? "Validando..." : "Continuar a mis notas médicas"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
        <div className="flex justify-center items-center pb-6 gap-8">
          <div className="flex flex-col items-center">
            <div className="bg-primary-light p-3 rounded-full">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs mt-2">Grabar consulta</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-primary-light p-3 rounded-full">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs mt-2">Subir audio</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Setup;
