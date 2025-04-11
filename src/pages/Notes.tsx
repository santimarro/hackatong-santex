import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Stethoscope, Upload, Settings, Plus, Loader2, Share, Menu, X, ArrowLeft, Calendar, Clock, MapPin } from "lucide-react";
import NotesList from '@/components/NotesList';
import AudioRecorder from '@/components/AudioRecorder';
import AudioUploader from '@/components/AudioUploader';
import TranscriptionView from '@/components/TranscriptionView';
import PatientSummaryView from '@/components/PatientSummaryView';
import MedicalSummaryView from '@/components/MedicalSummaryView';
import BottomNavigation from '@/components/BottomNavigation';
import { Note } from '@/types/Note';
import { useIsMobile } from '@/hooks/use-mobile';

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("transcription");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Parse the appointment ID from the query string if coming from appointment detail
  const queryParams = new URLSearchParams(location.search);
  const appointmentId = queryParams.get('appointment');
  
  // If redirected from consultation/new with preserveSearch state, include the original search params
  useEffect(() => {
    if (location.state && location.state.preserveSearch && !location.search) {
      const currentPath = location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      navigate(`${currentPath}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`, { replace: true });
    }
  }, [location, navigate]);
  
  // Mock appointment data when coming from appointment detail
  const appointmentData = appointmentId ? {
    id: appointmentId,
    doctorName: "Fernando Quinteros",
    specialty: "Traumatologia",
    institution: "Hospital Italiano",
    date: new Date(),
    time: "11:00 AM",
    location: "Consultorio 305, Piso 3",
    notes: "Primera consulta por dolor en la rodilla derecha."
  } : null;

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    const deepgramApiKey = localStorage.getItem('deepgramApiKey');
    const geminiApiKey = localStorage.getItem('geminiApiKey');

    if (!deepgramApiKey || !geminiApiKey) {
      toast({
        title: "Faltan claves API",
        description: "Por favor configura tus claves API primero",
        variant: "destructive",
      });
      navigate('/setup');
    } else {
      const savedNotes = localStorage.getItem('medicalNotes');
      if (savedNotes) {
        try {
          const parsedNotes = JSON.parse(savedNotes);
          setNotes(parsedNotes);
        } catch (e) {
          console.error("Error parsing saved notes:", e);
        }
      }
    }
  }, [navigate, toast]);

  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('medicalNotes', JSON.stringify(notes));
    }
  }, [notes]);

  const handleRecordComplete = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      const transcript = await transcribeAudio(audioBlob);
      
      const patientSummary = await generatePatientSummary(transcript);
      const medicalSummary = await generateMedicalSummary(transcript);
      
      const title = appointmentData 
        ? `Consulta ${appointmentData.doctorName} - ${appointmentData.specialty}`
        : `Consulta ${notes.length + 1}`;
        
      const newNote: Note = {
        id: Date.now().toString(),
        title: title,
        date: new Date().toISOString(),
        audioBlob: audioBlob,
        transcription: transcript,
        patientSummary: patientSummary,
        medicalSummary: medicalSummary,
      };
      
      setNotes(prev => [newNote, ...prev]);
      setSelectedNote(newNote);
      
      toast({
        title: "Éxito",
        description: "Consulta médica procesada correctamente",
      });
    } catch (error) {
      console.error("Error procesando el audio:", error);
      toast({
        title: "Error",
        description: "Error al procesar el audio. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob([file], { type: file.type });
      
      const transcript = await transcribeAudio(audioBlob);
      
      const patientSummary = await generatePatientSummary(transcript);
      const medicalSummary = await generateMedicalSummary(transcript);
      
      const title = appointmentData 
        ? `Consulta ${appointmentData.doctorName} - ${appointmentData.specialty}`
        : file.name.replace(/\.[^/.]+$/, "") || `Consulta ${notes.length + 1}`;
        
      const newNote: Note = {
        id: Date.now().toString(),
        title: title,
        date: new Date().toISOString(),
        audioBlob: audioBlob,
        transcription: transcript,
        patientSummary: patientSummary,
        medicalSummary: medicalSummary,
      };
      
      setNotes(prev => [newNote, ...prev]);
      setSelectedNote(newNote);
      
      toast({
        title: "Éxito",
        description: "Consulta médica procesada correctamente",
      });
    } catch (error) {
      console.error("Error procesando el audio:", error);
      toast({
        title: "Error",
        description: "Error al procesar el audio. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleNewNote = () => {
    setSelectedNote(null);
    setActiveTab("transcription");
  };

  const handleUpdateNote = (updatedNote: Note) => {
    setNotes(notes.map(note => note.id === updatedNote.id ? updatedNote : note));
    setSelectedNote(updatedNote);
  };

  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    const deepgramApiKey = localStorage.getItem('deepgramApiKey');
    if (!deepgramApiKey) {
      throw new Error("Deepgram API key not found");
    }

    const buffer = await audioBlob.arrayBuffer();
    
    const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&detect_language=true", {
      method: "POST",
      headers: {
        "Authorization": `Token ${deepgramApiKey}`,
        "Content-Type": "audio/m4a",
      },
      body: buffer,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Deepgram API error: ${response.status} ${error}`);
    }
    
    const result = await response.json();
    
    return result.results?.channels[0]?.alternatives[0]?.transcript || "";
  };

  const generatePatientSummary = async (text: string): Promise<string> => {
    const geminiApiKey = localStorage.getItem('geminiApiKey');
    if (!geminiApiKey) {
      throw new Error("Gemini API key not found");
    }

    const patientPrompt = localStorage.getItem('patientPrompt') || 
      `Crea un resumen médico amigable para el paciente a partir de la transcripción de la consulta médica. 
Incluye:
- Explicación simple del diagnóstico y qué significa
- Pasos de tratamiento explicados en lenguaje sencillo
- Signos de alerta que requieren atención médica
- Cuándo programar seguimiento
- Recomendaciones de estilo de vida
- Respuestas a preguntas frecuentes

Usa lenguaje simple, evita jerga médica, y organiza la información en secciones claras y fáciles de entender.`;

    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${patientPrompt}
                  
                  Transcripción de la consulta médica:
                  ${text}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text || "No se pudo generar un resumen para el paciente.";
    } catch (error) {
      console.error("Error using Gemini API:", error);
      throw new Error("Failed to generate patient summary");
    }
  };

  const generateMedicalSummary = async (text: string): Promise<string> => {
    const geminiApiKey = localStorage.getItem('geminiApiKey');
    if (!geminiApiKey) {
      throw new Error("Gemini API key not found");
    }

    const medicalPrompt = localStorage.getItem('medicalPrompt') || 
      `Genera un resumen clínico profesional a partir de la transcripción de la consulta médica.
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

    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${medicalPrompt}
                  
                  Transcripción de la consulta médica:
                  ${text}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text || "No se pudo generar un resumen médico.";
    } catch (error) {
      console.error("Error using Gemini API:", error);
      throw new Error("Failed to generate medical summary");
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Render based on context
  if (appointmentData && !selectedNote && !isProcessing) {
    // Render the consultation view when coming from appointment
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
          <h1 className="text-xl font-bold">Consulta - Datos Iniciales</h1>
        </header>
        
        {/* Main content */}
        <div className="flex-1 overflow-auto py-6 px-6">
          <div className="space-y-6">
            {/* Doctor info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Médico</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-md" 
                  value={appointmentData.doctorName} 
                  readOnly 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Especialidad</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-md" 
                  value={appointmentData.specialty} 
                  readOnly 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Institución</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-md" 
                  value={appointmentData.institution} 
                  readOnly 
                />
              </div>
            </div>
            
            {/* Appointment details */}
            <Card className="bg-gray-50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{appointmentData.date.toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{appointmentData.time}</span>
                </div>
                
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{appointmentData.location}</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas</label>
              <textarea 
                className="w-full p-2 border border-gray-300 rounded-md min-h-[100px]" 
                value={appointmentData.notes}
                readOnly
              />
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-6 border-t border-gray-200 pb-24">
          <div className="flex gap-4">
            <Button 
              className="flex-1"
              onClick={() => setIsRecording(true)}
            >
              <Stethoscope className="h-4 w-4 mr-2" />
              Grabar Consulta
            </Button>
            
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsUploading(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Subir Audio
            </Button>
          </div>
        </div>
        
        <AudioRecorder 
          isOpen={isRecording} 
          onClose={() => setIsRecording(false)} 
          onRecordingComplete={handleRecordComplete} 
        />
        
        <AudioUploader 
          isOpen={isUploading} 
          onClose={() => setIsUploading(false)} 
          onFileUpload={handleFileUpload} 
        />
        
        <BottomNavigation />
      </div>
    );
  }

  // Regular Notes page rendering
  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="border-b border-gray-200 bg-white py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          {isMobile && (
            <Button variant="ghost" size="sm" onClick={toggleSidebar} className="mr-2">
              {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          )}
          <h1 className="text-xl font-bold text-primary flex items-center">
            <Stethoscope className="h-5 w-5 mr-2" />
            MediNote
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/setup')}>
            <Settings className="h-4 w-4 mr-1" />
            Ajustes
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {(isSidebarOpen || !isMobile) && (
          <div className={`${isMobile ? 'absolute inset-0 z-50 bg-white' : 'relative'} w-64 border-r border-gray-200 bg-gray-50 flex flex-col`}>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-medium">Mis consultas</h2>
              <Button variant="ghost" size="sm" onClick={handleNewNote}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <NotesList notes={notes} selectedNote={selectedNote} onSelectNote={handleNoteSelect} />
            </ScrollArea>
            <div className="p-4 flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1" 
                onClick={() => setIsRecording(true)}
                disabled={isRecording || isUploading || isProcessing}
              >
                <Stethoscope className="h-4 w-4 mr-1" />
                Grabar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1" 
                onClick={() => setIsUploading(true)}
                disabled={isRecording || isUploading || isProcessing}
              >
                <Upload className="h-4 w-4 mr-1" />
                Subir
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {isProcessing ? (
            <div className="flex flex-1 items-center justify-center pb-24">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-500">Procesando tu consulta médica...</p>
                <p className="text-xs text-gray-400 mt-2">Esto puede tardar un minuto</p>
              </div>
            </div>
          ) : selectedNote ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-2">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="transcription">Detalles</TabsTrigger>
                  <TabsTrigger value="patientSummary">Resumen Paciente</TabsTrigger>
                  <TabsTrigger value="medicalSummary">Resumen Médico</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="transcription" className="flex-1 overflow-auto p-6 pb-24">
                <TranscriptionView note={selectedNote} onUpdateNote={handleUpdateNote} />
              </TabsContent>
              <TabsContent value="patientSummary" className="flex-1 overflow-auto p-6 pb-24">
                <PatientSummaryView note={selectedNote} />
              </TabsContent>
              <TabsContent value="medicalSummary" className="flex-1 overflow-auto p-6 pb-24">
                <MedicalSummaryView note={selectedNote} />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex-1 flex items-center justify-center pb-24">
              <Card className="w-96 bg-primary-light border-none">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <Stethoscope className="h-12 w-12 text-primary mx-auto" />
                    <h3 className="font-semibold text-lg">Registra tus consultas médicas</h3>
                    <p className="text-sm text-gray-600">Graba o sube un audio de tu consulta médica para transcribirla y obtener resúmenes personalizados.</p>
                    <div className="flex justify-center gap-4 pt-2">
                      <Button 
                        variant="default" 
                        onClick={() => setIsRecording(true)}
                        disabled={isRecording || isUploading}
                      >
                        <Stethoscope className="h-4 w-4 mr-2" />
                        Grabar consulta
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsUploading(true)}
                        disabled={isRecording || isUploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Subir audio
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <AudioRecorder 
        isOpen={isRecording} 
        onClose={() => setIsRecording(false)} 
        onRecordingComplete={handleRecordComplete} 
      />
      
      <AudioUploader 
        isOpen={isUploading} 
        onClose={() => setIsUploading(false)} 
        onFileUpload={handleFileUpload} 
      />

      <BottomNavigation />
    </div>
  );
};

export default Notes;
