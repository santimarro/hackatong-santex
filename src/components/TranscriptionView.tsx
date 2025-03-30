
import React, { useState, useEffect } from 'react';
import { Note } from '@/types/Note';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy, Edit, Save, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TranscriptionViewProps {
  note: Note;
}

const TranscriptionView: React.FC<TranscriptionViewProps> = ({ note }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [transcription, setTranscription] = useState(note.transcription);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Create object URL when component mounts or when note changes
  useEffect(() => {
    // Check if audioBlob exists and is valid before creating an object URL
    if (note.audioBlob && note.audioBlob instanceof Blob && note.audioBlob.size > 0) {
      const url = URL.createObjectURL(note.audioBlob);
      setAudioUrl(url);
      
      // Clean up the URL when component unmounts
      return () => {
        if (url) URL.revokeObjectURL(url);
      };
    } else {
      console.warn("Invalid or missing audio blob for note:", note.id);
    }
  }, [note]);

  const handleSave = () => {
    // In a real app, you would save this to the database
    // For now, we'll just update the state
    setIsEditing(false);
    toast({
      title: "Guardado",
      description: "Transcripción actualizada",
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcription);
    toast({
      title: "Copiado",
      description: "Transcripción copiada al portapapeles",
    });
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  // Handle audio ended event
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="max-w-xs"
            />
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" />
              Guardar
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">{title}</h2>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={togglePlayPause}
            disabled={!audioUrl}
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-1" />
                Pausar
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Reproducir
              </>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-4">
          {isEditing ? (
            <textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              className="w-full h-96 p-2 border border-gray-200 rounded-md"
            ></textarea>
          ) : (
            <div className="whitespace-pre-wrap">{transcription}</div>
          )}
        </CardContent>
      </Card>
      
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onEnded={handleAudioEnded}
          className="hidden"
        />
      )}
    </div>
  );
};

export default TranscriptionView;
