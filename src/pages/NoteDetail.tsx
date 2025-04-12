import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2 } from "lucide-react";
import TranscriptionView from '@/components/TranscriptionView';
import PatientSummaryView from '@/components/PatientSummaryView';
import MedicalSummaryView from '@/components/MedicalSummaryView';
import BottomNavigation from '@/components/BottomNavigation';
import { Note } from '@/types/Note';
import { sampleNote } from '@/data/sampleNotes';

const NoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('transcription');
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This would normally fetch the note from an API
    // For now, we'll just use our sample note if the ID matches
    setLoading(true);
    
    if (id === 'sample-note-1') {
      setNote(sampleNote);
    } else {
      // In a real app, fetch from API
      // For now we just show sample note for any ID
      setNote(sampleNote);
    }
    
    setLoading(false);
  }, [id]);

  const handleUpdateNote = (updatedNote: Note) => {
    setNote(updatedNote);
    // In a real app, you would save this to backend/storage
  };

  const handleBackClick = () => {
    navigate('/notes');
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

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="flex items-center px-6 py-4 border-b border-gray-200">
        <button className="mr-2" onClick={handleBackClick}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold truncate">{note.title}</h1>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-2">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="transcription">Detalles</TabsTrigger>
            <TabsTrigger value="patientSummary">Resumen Paciente</TabsTrigger>
            <TabsTrigger value="medicalSummary">Resumen Médico</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="transcription" className="flex-1 overflow-auto p-6 pb-24">
          <TranscriptionView note={note} onUpdateNote={handleUpdateNote} />
        </TabsContent>
        <TabsContent value="patientSummary" className="flex-1 overflow-auto p-6 pb-24">
          <PatientSummaryView note={note} />
        </TabsContent>
        <TabsContent value="medicalSummary" className="flex-1 overflow-auto p-6 pb-24">
          <MedicalSummaryView note={note} />
        </TabsContent>
      </Tabs>

      <BottomNavigation />
    </div>
  );
};

export default NoteDetail; 