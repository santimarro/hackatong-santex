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
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Reset recording when dialog closes
  useEffect(() => {
    if (!isOpen) {
      cleanupRecording();
      setRecordedBlob(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanupRecording;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to clean up recording resources
  const cleanupRecording = () => {
    // Stop recording if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error("Error stopping media recorder:", err);
      }
    }
    
    // Clear the timer interval
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop and clean up media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
    setRecordingTime(0);
  };

  const startRecording = async () => {
    // Clean up any existing recording first
    cleanupRecording();
    
    // Reset state
    chunksRef.current = [];
    setRecordingTime(0);
    setRecordedBlob(null);
    
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Set up media recorder with proper options
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      // This will be called whenever there is data available
      mediaRecorder.ondataavailable = (event) => {
        console.log("Data available", event.data.size);
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      // This will be called when recording stops
      mediaRecorder.onstop = () => {
        console.log("MediaRecorder stopped", chunksRef.current.length);
        // Create audio blob from recorded chunks
        if (chunksRef.current.length > 0) {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          setRecordedBlob(audioBlob);
          console.log("Blob created", audioBlob.size);
        } else {
          console.warn("No audio data collected");
        }
        
        // Stop all audio tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Clear the timer
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        // Update state
        setIsRecording(false);
      };
      
      // Request data every second
      mediaRecorder.start(1000);
      console.log("MediaRecorder started", mediaRecorder.state);
      setIsRecording(true);
      
      // Set up timer to update UI
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
        description: "No se pudo acceder al micrófono. Verifica los permisos.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    console.log("Stopping recording");
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
        console.log("MediaRecorder is recording, stopping now");
        try {
          // Request data one final time before stopping
          mediaRecorderRef.current.requestData();
          // Then stop the recorder
          mediaRecorderRef.current.stop();
        } catch (err) {
          console.error("Error stopping recorder:", err);
          // Fallback cleanup in case of error
          cleanupRecording();
        }
      } else {
        console.log("MediaRecorder is not recording", mediaRecorderRef.current.state);
      }
    } else {
      console.log("No MediaRecorder found");
    }
  };

  const handleSubmit = () => {
    if (!recordedBlob) return;
    
    setIsUploading(true);
    
    try {
      // Send the blob to the parent component
      onRecordingComplete(recordedBlob);
      
      // Close the dialog and reset state
      onClose();
    } catch (error) {
      console.error("Error processing recording:", error);
      toast({
        title: "Error",
        description: "Error al procesar la grabación.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setRecordingTime(0);
      setRecordedBlob(null);
      setIsRecording(false);
    }
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
