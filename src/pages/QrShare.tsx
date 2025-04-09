
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, QrCode, Share2 } from "lucide-react";
import { Note } from '@/types/Note';
import BottomNavigation from '@/components/BottomNavigation';
import { useToast } from "@/hooks/use-toast";

// QR code generation would typically use a library like qrcode.react
// For now we'll use a placeholder image
const QrShare = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const savedNotes = localStorage.getItem('medicalNotes');
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes);
        setNotes(parsedNotes);
        if (parsedNotes.length > 0) {
          setSelectedNote(parsedNotes[0]);
        }
      } catch (e) {
        console.error("Error parsing notes:", e);
      }
    }
  }, []);

  const handleShare = () => {
    // In a real app, this would trigger a native share dialog
    toast({
      title: "Compartido",
      description: "Enlace del resumen médico compartido",
    });
  };

  const renderQRCode = () => {
    if (!selectedNote) {
      return (
        <div className="flex flex-col items-center justify-center p-10">
          <QrCode className="w-20 h-20 text-gray-300" />
          <p className="mt-4 text-gray-500">Selecciona una consulta para generar su código QR</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <img 
            src="/lovable-uploads/28543a9e-7c2f-4f6a-b038-6af0d7dcc8d5.png" 
            alt="QR Code" 
            className="w-48 h-48"
          />
        </div>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-1">Escanea este código para acceder al</p>
          <p className="font-medium">Resumen Médico de {selectedNote.title}</p>
        </div>
        <Button onClick={handleShare} className="mt-6 flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Compartir
        </Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="p-4 border-b flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold flex-1">Compartir Consulta</h1>
      </header>

      <main className="flex-1 p-4 pb-20 overflow-auto">
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Selecciona la consulta que deseas compartir:</p>
          <Select 
            value={selectedNote?.id} 
            onValueChange={(value) => {
              const note = notes.find(note => note.id === value);
              if (note) setSelectedNote(note);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una consulta" />
            </SelectTrigger>
            <SelectContent>
              {notes.map((note) => (
                <SelectItem key={note.id} value={note.id}>
                  {note.title} - {new Date(note.date).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            {renderQRCode()}
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default QrShare;
