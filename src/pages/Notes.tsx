import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Stethoscope, Upload, Settings, Plus, Loader2, Share, Menu, X, ArrowLeft, Calendar, Clock, MapPin, FileText } from "lucide-react";
import NotesList from '@/components/NotesList';
import AudioRecorder from '@/components/AudioRecorder';
import AudioUploader from '@/components/AudioUploader';
import TranscriptionView from '@/components/TranscriptionView';
import PatientSummaryView from '@/components/PatientSummaryView';
import MedicalSummaryView from '@/components/MedicalSummaryView';
import ComprehensiveSummaryView from '@/components/ComprehensiveSummaryView';
import BottomNavigation from '@/components/BottomNavigation';
import { Note } from '@/types/Note';
import { useIsMobile } from '@/hooks/use-mobile';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Use Vite's environment variables
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const deepgramApiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;

// Define prompts as module-level constants
const DEFAULT_PATIENT_PROMPT = `Crea un resumen médico amigable para el paciente a partir de la transcripción de la consulta médica.

IMPORTANTE: Debes incluir ÚNICAMENTE información que esté explícitamente mencionada en la transcripción. NO agregues:
- Explicaciones adicionales que el médico no haya proporcionado
- Recomendaciones que no fueron mencionadas
- Interpretaciones o razonamientos que no estén presentes en la consulta original
- Información sobre signos de alerta, a menos que el médico los haya mencionado específicamente

Tu tarea es:
1. Extraer y organizar la información proporcionada directamente por el médico en la consulta
2. Presentarla en lenguaje simple y accesible para el paciente
3. Mantener la fidelidad absoluta al contenido original de la transcripción

Si el médico no explica algo en detalle, NO proporciones explicaciones adicionales.

Organiza la información en secciones claras según lo que se haya discutido en la consulta.`;

const DEFAULT_MEDICAL_PROMPT = `Genera un resumen clínico profesional en formato SOAP a partir de la transcripción de la consulta médica.
IMPORTANTE: Incluye ÚNICAMENTE información que esté explícitamente mencionada en la transcripción.

Estructura el resumen usando el formato SOAP:
- S (Subjetivo): Información proporcionada por el paciente, síntomas, quejas y antecedentes mencionados
- O (Objetivo): Hallazgos del examen físico y resultados de pruebas mencionados en la transcripción
- A (Análisis/Evaluación): Diagnóstico o evaluación mencionada por el médico, sin añadir interpretaciones adicionales
- P (Plan): Plan de tratamiento y recomendaciones explícitamente mencionadas por el médico

Utiliza terminología médica estándar y mantén absoluta fidelidad al contenido de la transcripción.`;

const DEFAULT_AUGMENTED_MEDICAL_PROMPT = `Actúa como un asistente médico experto que ofrece una segunda opinión basada en la transcripción de una consulta médica.

Tu objetivo es ayudar al médico tratante con:
1. Posibles diagnósticos diferenciales que podrían considerarse basados en los síntomas y hallazgos
2. Sugerencias de pruebas diagnósticas adicionales que podrían ser relevantes
3. Opciones de tratamiento alternativas o complementarias basadas en la práctica médica actual
4. Referencias a guías clínicas o evidencia científica reciente relevante para el caso
5. Consideraciones especiales que podrían haberse pasado por alto
6. Posibles interacciones medicamentosas o contraindicaciones

Puedes incluir tu razonamiento clínico y explicaciones detalladas para apoyar tus sugerencias.
Organiza tu respuesta en secciones claras y utiliza lenguaje profesional médico.

NOTA: Esta segunda opinión es solo informativa y no reemplaza el juicio clínico del médico tratante.`;

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("transcription");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [comprehensiveSummary, setComprehensiveSummary] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
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
  
  // Datos de cita de ejemplo cuando se viene desde el detalle de una cita
  const appointmentData = appointmentId ? {
    id: appointmentId,
    doctorName: "Fernando Quinteros",
    specialty: "Traumatología",
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
    if (!deepgramApiKey || !geminiApiKey) {
      toast({
        title: "API keys no configuradas",
        description: "Las claves API no están configuradas en las variables de entorno",
        variant: "destructive",
      });
      return;
    }

    const savedNotes = localStorage.getItem('medicalNotes');
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes);
        setNotes(parsedNotes);
      } catch (e) {
        console.error("Error parsing saved notes:", e);
      }
    }
  }, [toast]);

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
      const augmentedMedicalSummary = await generateAugmentedMedicalSummary(transcript);
      
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
        augmentedMedicalSummary: augmentedMedicalSummary,
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
      const augmentedMedicalSummary = await generateAugmentedMedicalSummary(transcript);
      
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
        augmentedMedicalSummary: augmentedMedicalSummary,
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
    if (!deepgramApiKey) {
      throw new Error("Deepgram API key not configured in environment variables");
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
    if (!geminiApiKey) {
      throw new Error("Gemini API key not configured in environment variables");
    }

    const patientPrompt = localStorage.getItem('patientPrompt') || DEFAULT_PATIENT_PROMPT;

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
      });
      
      const prompt = `${patientPrompt}
                
      Transcripción de la consulta médica:
      ${text}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || "No se pudo generar un resumen para el paciente.";
    } catch (error) {
      console.error("Error using Gemini API:", error);
      throw new Error("Failed to generate patient summary");
    }
  };

  const generateMedicalSummary = async (text: string): Promise<string> => {
    if (!geminiApiKey) {
      throw new Error("Gemini API key not configured in environment variables");
    }

    const medicalPrompt = localStorage.getItem('medicalPrompt') || DEFAULT_MEDICAL_PROMPT;

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
      });
      
      const prompt = `${medicalPrompt}
                
      Transcripción de la consulta médica:
      ${text}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || "No se pudo generar un resumen médico.";
    } catch (error) {
      console.error("Error using Gemini API:", error);
      throw new Error("Failed to generate medical summary");
    }
  };

  const generateAugmentedMedicalSummary = async (text: string): Promise<string> => {
    if (!geminiApiKey) {
      throw new Error("Gemini API key not configured in environment variables");
    }

    try {
      const augmentedMedicalPrompt = localStorage.getItem('augmentedMedicalPrompt') || DEFAULT_AUGMENTED_MEDICAL_PROMPT;
      
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
      });
      
      const prompt = `${augmentedMedicalPrompt}
                
      Transcripción de la consulta médica:
      ${text}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || "No se pudo generar una consulta aumentada.";
    } catch (error) {
      console.error("Error using Gemini API:", error);
      throw new Error("Failed to generate augmented medical summary");
    }
  };

  const generateComprehensiveSummary = async (selectedSpecialty: string | null, selectedNoteIds: string[]): Promise<string> => {
    if (!geminiApiKey) {
      throw new Error("Gemini API key not configured in environment variables");
    }

    // Get selected notes
    const filteredNotes = notes.filter(note => selectedNoteIds.includes(note.id));
    
    // Include specialty in the system prompt if one is selected
    const systemPrompt = `Eres un experto médico especializado en resumir historias clínicas de pacientes${selectedSpecialty ? ` con enfoque en ${selectedSpecialty}` : ''}.`;
    
    // Create an array of all medical summaries with metadata
    const summaries = filteredNotes.map(note => {
      // Extract specialization and date
      const specialtyText = note.specialty ? `Especialidad: ${note.specialty}` : '';
      const dateText = `Fecha: ${new Date(note.date).toLocaleDateString()}`;
      const titleText = `Consulta: ${note.title}`;
      
      // Return formatted summary with metadata
      return `
===== ${titleText} =====
${dateText}
${specialtyText ? specialtyText + '\n' : ''}

${note.medicalSummary}
      `;
    }).join("\n\n");

    // Format the comprehensive prompt similar to the Python example
    const comprehensivePrompt = `Aquí hay resúmenes de varias consultas médicas del paciente:

<resúmenes>
${summaries}
</resúmenes>

Por favor, realiza lo siguiente:
1. Lee detalladamente los resúmenes proporcionados de las diversas consultas médicas.
2. Combina los resúmenes en una única narrativa coherente y completa del historial médico del paciente.${selectedSpecialty ? `\n3. Enfócate principalmente en la información relacionada con ${selectedSpecialty}.` : ''}
3. La narrativa debe proporcionar una visión longitudinal de la actividad clínica del paciente basada en las diversas consultas.
4. Destaca cualquier hallazgo anormal en pruebas o resultados de laboratorio si están disponibles.
5. No inferir condiciones que no se mencionen explícitamente.
6. Excluir condiciones descartadas o descartadas.
7. Organiza la información cronológicamente cuando sea posible.
8. Asegúrate de usar el formato markdown adecuadamente para los encabezados, listas y párrafos.
9. Usa encabezados de nivel 2 (##) para las secciones principales y nivel 3 (###) para subsecciones.
10. Utiliza listas con viñetas (*) para enumerar elementos relacionados.
11. Agrega espacio después de los símbolos de marcado (# para encabezados, * para listas) para asegurar el formato correcto.

La respuesta debe ser un único documento resumido, bien estructurado, con formato markdown, que un profesional médico pueda usar para entender rápidamente el historial completo del paciente.
`;

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      });
      
      const result = await model.generateContent(comprehensivePrompt);
      const response = await result.response;
      return response.text() || "No se pudo generar un resumen médico integral.";
    } catch (error) {
      console.error("Error using Gemini API:", error);
      throw new Error("Failed to generate comprehensive medical summary");
    }
  };

  const handleGenerateComprehensiveSummary = async (selectedSpecialty: string | null, selectedNoteIds: string[]) => {
    setIsGeneratingSummary(true);
    
    try {
      const summary = await generateComprehensiveSummary(selectedSpecialty, selectedNoteIds);
      setComprehensiveSummary(summary);
      
      toast({
        title: "Éxito",
        description: "Resumen médico integral generado correctamente",
      });
    } catch (error) {
      console.error("Error generando resumen integral:", error);
      toast({
        title: "Error",
        description: "Error al generar el resumen médico integral",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSummary(false);
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
            René
          </h1>
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
            <Tabs defaultValue="new" className="flex-1 flex flex-col overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-2">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="new">Nueva consulta</TabsTrigger>
                  <TabsTrigger value="comprehensive" disabled={notes.length === 0}>
                    <FileText className="h-4 w-4 mr-1" />
                    Resumen integral
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="new" className="flex-1 overflow-auto pb-24">
                <div className="flex-1 flex items-center justify-center">
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
              </TabsContent>
              <TabsContent value="comprehensive" className="flex-1 overflow-auto p-6 pb-24">
                <ComprehensiveSummaryView 
                  notes={notes}
                  onRegenerateSummary={handleGenerateComprehensiveSummary}
                  isGenerating={isGeneratingSummary}
                  comprehensiveSummary={comprehensiveSummary}
                />
              </TabsContent>
            </Tabs>
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
