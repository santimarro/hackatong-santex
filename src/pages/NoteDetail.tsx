import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Calendar, Clock, MapPin, User, Stethoscope } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import TranscriptionView from '@/components/TranscriptionView';
import PatientSummaryView from '@/components/PatientSummaryView';
import MedicalSummaryView from '@/components/MedicalSummaryView';
import BottomNavigation from '@/components/BottomNavigation';
import { Note, consultationToNote } from '@/types/Note';
import { EmergencyInfo, MedicationReminder } from '@/types/Profile';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/lib/auth-context';
import { getProfile, updateEmergencyInfo } from '@/lib/profile-service';
import { getConsultation, getTranscription, getSummaries } from '@/lib/consultation-service';
import { format } from 'date-fns';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { sampleNote } from '@/data/sampleNotes';

const NoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('patientSummary');
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAugmented, setShowAugmented] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchConsultationData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        // Handle sample note case
        if (id === 'sample-note-1') {
          setNote(sampleNote);
          setLoading(false);
          return;
        }
        
        // Fetch consultation data
        const consultation = await getConsultation(id);
        
        if (!consultation) {
          setLoading(false);
          return;
        }
        
        // Fetch transcription
        const transcription = await getTranscription(id);
        
        // Fetch summaries
        const summaries = await getSummaries(id);
        
        // Convert to Note type for UI
        const consultationNote = consultationToNote(consultation, transcription, summaries);
        
        setNote(consultationNote);
      } catch (error) {
        console.error('Error fetching consultation data:', error);
        toast({
          title: "Error",
          description: "Failed to load consultation data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConsultationData();
  }, [id, toast]);

  // --- Function to Add Reminders to Profile --- (Moved outside useEffect)
  const addRemindersToProfile = async (reminderTexts: string[]) => {
    if (!user) throw new Error("User not logged in");

    try {
      const profile = await getProfile(user.id);
      if (!profile) throw new Error("Profile not found");

      const currentInfo = (profile.emergency_info || {}) as EmergencyInfo;
      const existingReminders = currentInfo.medicationReminders || [];

      const newReminders: MedicationReminder[] = reminderTexts.map(text => ({
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        name: text,
        dosage: '', 
        frequency: 'daily',
        time: '09:00',
        active: true,
      }));

      const allReminders = [...existingReminders, ...newReminders];
      await updateEmergencyInfo(user.id, { ...currentInfo, medicationReminders: allReminders });

      // Optional: Navigate or just let the toast in child component handle success
      // navigate('/reminders');

    } catch (error) {
      console.error("Failed to save reminders to profile:", error);
      throw error; // Re-throw for PatientSummaryView to catch
    }
  };
  // --- End Function to Add Reminders ---

  const handleUpdateNote = (updatedNote: Note) => {
    setNote(updatedNote);
  };

  const handleBackClick = () => {
    navigate('/notes');
  };

  // Format date and time from ISO string
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return { date: 'N/A', time: 'N/A' };
    
    const date = new Date(dateString);
    return {
      date: format(date, 'PPP'), // e.g., April 18, 2025
      time: format(date, 'h:mm a') // e.g., 11:00 AM
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <header className="flex items-center px-6 py-4 border-b border-gray-200">
          <button className="mr-2" onClick={handleBackClick}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Detalle de Consulta</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <header className="flex items-center px-6 py-4 border-b border-gray-200">
          <button className="mr-2" onClick={handleBackClick}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Detalle de Consulta</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">Consulta no encontrada</p>
            <button 
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
              onClick={() => navigate('/notes')}
            >
              Ver todas las consultas
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Extract date and time
  const { date, time } = formatDateTime(note.date);

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="flex items-center px-6 py-4 border-b border-gray-200">
        <button className="mr-2" onClick={handleBackClick}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold truncate">{note.title}</h1>
      </header>

      {/* Consultation metadata */}
      <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
            {date}
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-gray-400" />
            {time}
          </div>
          {note.doctorName && (
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1 text-gray-400" />
              Dr. {note.doctorName}
            </div>
          )}
          {note.specialty && (
            <div className="flex items-center">
              <Stethoscope className="h-4 w-4 mr-1 text-gray-400" />
              {note.specialty}
            </div>
          )}
          {note.location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
              {note.location}
            </div>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-2">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="patientSummary">Resumen Paciente</TabsTrigger>
            <TabsTrigger value="transcription">Transcripción</TabsTrigger>
            <TabsTrigger value="medicalSummary">Resumen Médico</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="patientSummary" className="flex-1 overflow-auto p-6 pb-24">
          {note && (
            <PatientSummaryView 
              note={note} 
              onAddReminders={addRemindersToProfile}
            />
          )}
        </TabsContent>
        
        <TabsContent value="transcription" className="flex-1 overflow-auto p-6 pb-24">
          <TranscriptionView note={note} onUpdateNote={handleUpdateNote} />
        </TabsContent>
        
        <TabsContent value="medicalSummary" className="flex-1 overflow-auto p-6 pb-24">
          {activeTab === "medicalSummary" && (
            <div className="mb-4 flex items-center justify-end space-x-2">
              <Switch 
                id="augmented-mode" 
                checked={showAugmented}
                onCheckedChange={setShowAugmented}
              />
              <Label htmlFor="augmented-mode">
                Consulta aumentada
              </Label>
            </div>
          )}
          
          {showAugmented && note.augmentedMedicalSummary ? (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="prose prose-sm md:prose-base max-w-none">
                  <MarkdownRenderer markdown={note.augmentedMedicalSummary} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <MedicalSummaryView note={note} />
          )}
        </TabsContent>
      </Tabs>

      <BottomNavigation />
    </div>
  );
};

export default NoteDetail; 