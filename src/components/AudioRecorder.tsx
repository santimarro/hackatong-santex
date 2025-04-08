
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AudioRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onRecordingComplete: (audioBlob: Blob) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ isOpen, onClose, onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      setRecordingTime(0);
      setRecordedBlob(null);
    }
    
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [isOpen]);

  // Clean up effect
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  // Control audio playback
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
    
    const handleEnded = () => setIsPlaying(false);
    
    if (audioRef.current) {
      audioRef.current.addEventListener('ended', handleEnded);
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [isPlaying, recordedBlob]);

  const startRecording = async () => {
    chunksRef.current = [];
    setRecordedBlob(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/m4a' });
        setRecordedBlob(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Reset timer
      setRecordingTime(0);
      
      // Start timer using a dedicated interval
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Error",
        description: "No se pudo acceder al micrófono. Por favor verifica los permisos.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear the timer
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSubmit = () => {
    if (!recordedBlob) return;
    
    setIsUploading(true);
    
    // Send the blob to the parent component
    onRecordingComplete(recordedBlob);
    
    // Close the dialog and reset state
    onClose();
    setIsUploading(false);
    setRecordingTime(0);
    setRecordedBlob(null);
    setIsRecording(false);
    setIsPlaying(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Grabar Audio</DialogTitle>
          <DialogDescription>
            {isRecording 
              ? "Haz clic en el botón para detener la grabación"
              : recordedBlob 
                ? "Escucha tu grabación antes de confirmar" 
                : "Haz clic en el botón para comenzar a grabar"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6">
          <div className="text-4xl font-bold mb-4">{formatTime(recordingTime)}</div>
          
          <div className="mb-6">
            {isRecording ? (
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-red-500/20 animate-pulse"></div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-16 w-16 rounded-full border-red-500 border-2" 
                  onClick={toggleRecording}
                >
                  <Square className="h-6 w-6 text-red-500" />
                </Button>
              </div>
            ) : recordedBlob ? (
              <div className="flex flex-col items-center gap-4">
                <audio 
                  ref={audioRef}
                  src={URL.createObjectURL(recordedBlob)} 
                  className="hidden" 
                />
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-16 w-16 rounded-full border-primary border-2" 
                  onClick={togglePlayback}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6 text-primary" />
                  ) : (
                    <Play className="h-6 w-6 text-primary" />
                  )}
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="icon" 
                className="h-16 w-16 rounded-full border-primary border-2" 
                onClick={toggleRecording}
              >
                <Mic className="h-6 w-6 text-primary" />
              </Button>
            )}
          </div>
          
          <p className="text-sm text-gray-500">
            {isRecording ? "Grabando audio..." : 
              recordedBlob ? isPlaying ? "Reproduciendo..." : "Haz clic para reproducir" : 
              "Haz clic para empezar a grabar"}
          </p>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          
          {recordedBlob && !isRecording && (
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={startRecording}
                disabled={isUploading}
              >
                Volver a grabar
              </Button>
              
              <Button 
                onClick={handleSubmit}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : "Usar grabación"}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AudioRecorder;
