
import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Stethoscope, Square, Loader2 } from "lucide-react";
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      setRecordingTime(0);
      setRecordedBlob(null);
    }
  }, [isOpen]);

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

  const startRecording = async () => {
    chunksRef.current = [];
    
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
        
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
        }
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Error",
        description: "No se pudo acceder al micrófono. Verifica los permisos.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    }
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
          <DialogTitle>Grabar consulta médica</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6">
          <div className="text-4xl font-bold mb-4">{formatTime(recordingTime)}</div>
          
          <div className="mb-6">
            {isRecording ? (
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-destructive/20 animate-pulse"></div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-16 w-16 rounded-full border-destructive border-2" 
                  onClick={stopRecording}
                >
                  <Square className="h-6 w-6 text-destructive" />
                </Button>
              </div>
            ) : recordedBlob ? (
              <div>
                <audio src={URL.createObjectURL(recordedBlob)} controls className="mb-4" />
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="icon" 
                className="h-16 w-16 rounded-full border-primary border-2" 
                onClick={startRecording}
              >
                <Stethoscope className="h-6 w-6 text-primary" />
              </Button>
            )}
          </div>
          
          <p className="text-sm text-gray-500">
            {isRecording ? "Grabando consulta..." : 
              recordedBlob ? "Reproducir para verificar" : 
              "Haz clic para comenzar a grabar la consulta"}
          </p>
          
          {!isRecording && !recordedBlob && (
            <div className="mt-4 max-w-xs text-center text-xs text-gray-500">
              <p>Coloca tu dispositivo cerca del médico para capturar claramente la conversación.</p>
              <p className="mt-2">Recuerda obtener permiso antes de grabar la consulta.</p>
            </div>
          )}
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          
          {recordedBlob && (
            <Button 
              onClick={handleSubmit}
              disabled={isUploading}
              className="bg-secondary hover:bg-secondary/90"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : "Procesar consulta"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AudioRecorder;
