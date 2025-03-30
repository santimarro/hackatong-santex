
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, Upload, Settings, Plus, Loader2 } from "lucide-react";
import NotesList from '@/components/NotesList';
import AudioRecorder from '@/components/AudioRecorder';
import AudioUploader from '@/components/AudioUploader';
import TranscriptionView from '@/components/TranscriptionView';
import SummaryView from '@/components/SummaryView';
import { Note } from '@/types/Note';

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("transcription");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if API keys exist
  useEffect(() => {
    const deepgramApiKey = localStorage.getItem('deepgramApiKey');
    const geminiApiKey = localStorage.getItem('geminiApiKey');

    if (!deepgramApiKey || !geminiApiKey) {
      toast({
        title: "Missing API Keys",
        description: "Please set up your API keys first",
        variant: "destructive",
      });
      navigate('/setup');
    } else {
      // Load saved notes from localStorage
      const savedNotes = localStorage.getItem('audioNotes');
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
    }
  }, [navigate, toast]);

  // Save notes when they change
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('audioNotes', JSON.stringify(notes));
    }
  }, [notes]);

  const handleRecordComplete = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Transcribe audio with Deepgram
      const transcript = await transcribeAudio(audioBlob);
      
      // Summarize with Gemini
      const summary = await summarizeText(transcript);
      
      // Create new note
      const newNote: Note = {
        id: Date.now().toString(),
        title: `Note ${notes.length + 1}`,
        date: new Date().toISOString(),
        audioBlob: audioBlob,
        transcription: transcript,
        summary: summary,
      };
      
      setNotes(prev => [newNote, ...prev]);
      setSelectedNote(newNote);
      
      toast({
        title: "Success",
        description: "Audio processed successfully",
      });
    } catch (error) {
      console.error("Error processing audio:", error);
      toast({
        title: "Error",
        description: "Failed to process audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    
    try {
      // Convert File to Blob
      const audioBlob = new Blob([file], { type: file.type });
      
      // Transcribe audio with Deepgram
      const transcript = await transcribeAudio(audioBlob);
      
      // Summarize with Gemini
      const summary = await summarizeText(transcript);
      
      // Create new note
      const newNote: Note = {
        id: Date.now().toString(),
        title: file.name.replace(/\.[^/.]+$/, "") || `Note ${notes.length + 1}`,
        date: new Date().toISOString(),
        audioBlob: audioBlob,
        transcription: transcript,
        summary: summary,
      };
      
      setNotes(prev => [newNote, ...prev]);
      setSelectedNote(newNote);
      
      toast({
        title: "Success",
        description: "Audio processed successfully",
      });
    } catch (error) {
      console.error("Error processing audio:", error);
      toast({
        title: "Error",
        description: "Failed to process audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
  };

  const handleNewNote = () => {
    setSelectedNote(null);
    setActiveTab("transcription");
  };

  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    const deepgramApiKey = localStorage.getItem('deepgramApiKey');
    if (!deepgramApiKey) {
      throw new Error("Deepgram API key not found");
    }

    // Convert Blob to ArrayBuffer
    const buffer = await audioBlob.arrayBuffer();
    
    // Make a direct HTTP request to Deepgram API
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
    
    // Extract the transcript text
    return result.results?.channels[0]?.alternatives[0]?.transcript || "";
  };

  const summarizeText = async (text: string): Promise<string> => {
    const geminiApiKey = localStorage.getItem('geminiApiKey');
    if (!geminiApiKey) {
      throw new Error("Gemini API key not found");
    }

    try {
      // Use Google GenAI SDK
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
                  text: `Create a study summary of the following Spanish text. Include key points, main topics, and important concepts to review.
                  Format the output with clear sections, bullet points, and emphasize important terms.
                  
                  Text to summarize:
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
      return data.candidates[0].content.parts[0].text || "No summary generated";
    } catch (error) {
      console.error("Error using Gemini API:", error);
      throw new Error("Failed to generate summary");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="border-b border-gray-200 bg-white py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary">Audio Note Magic</h1>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/setup')}>
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-medium">Mis Notas</h2>
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
              <Mic className="h-4 w-4 mr-1" />
              Record
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1" 
              onClick={() => setIsUploading(true)}
              disabled={isRecording || isUploading || isProcessing}
            >
              <Upload className="h-4 w-4 mr-1" />
              Upload
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {isProcessing ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-500">Processing your audio...</p>
                <p className="text-xs text-gray-400 mt-2">This may take a minute</p>
              </div>
            </div>
          ) : selectedNote ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-2">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="transcription">Transcripción</TabsTrigger>
                  <TabsTrigger value="summary">Resumen de Estudio</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="transcription" className="flex-1 overflow-auto p-6">
                <TranscriptionView note={selectedNote} />
              </TabsContent>
              <TabsContent value="summary" className="flex-1 overflow-auto p-6">
                <SummaryView note={selectedNote} />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Card className="w-96 bg-primary-light border-none">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <h3 className="font-semibold">Empieza con una nueva nota</h3>
                    <p className="text-sm text-gray-600">Graba o sube un archivo de audio en español para transcribirlo y resumirlo.</p>
                    <div className="flex justify-center gap-4 pt-2">
                      <Button 
                        variant="default" 
                        onClick={() => setIsRecording(true)}
                        disabled={isRecording || isUploading}
                      >
                        <Mic className="h-4 w-4 mr-2" />
                        Grabar Audio
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsUploading(true)}
                        disabled={isRecording || isUploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Subir Audio
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
    </div>
  );
};

export default Notes;
