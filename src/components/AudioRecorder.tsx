import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Stethoscope, Square, Loader2, AlertTriangle } from "lucide-react";
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
  const [debugInfo, setDebugInfo] = useState<string>("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopButtonRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();

  // Debug helper
  const logDebug = (message: string) => {
    console.log(message);
    setDebugInfo(prev => `${message}\n${prev}`.slice(0, 500));
  };

  // Add manual event listener to stop button when it's mounted
  useEffect(() => {
    const stopButton = stopButtonRef.current;
    if (stopButton) {
      const forceStop = () => {
        logDebug("🔴 Stop button clicked with direct event listener");
        emergencyStop();
      };
      
      stopButton.addEventListener('click', forceStop);
      return () => {
        stopButton.removeEventListener('click', forceStop);
      };
    }
  }, [isRecording]);

  // Reset recording when dialog closes
  useEffect(() => {
    if (!isOpen) {
      emergencyStop();
      setRecordedBlob(null);
      setDebugInfo("");
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return emergencyStop;
  }, []);

  // Function for emergency stop that bypasses MediaRecorder API
  const emergencyStop = () => {
    logDebug("🚨 Emergency stop called");
    
    // Force UI update immediately
    setIsRecording(false);
    
    // Stop timer first
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
      logDebug("⏱️ Timer cleared");
    }
    
    // Stop all tracks directly
    if (streamRef.current) {
      try {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => {
          track.stop();
          logDebug(`🎤 Track ${track.kind} stopped directly`);
        });
        streamRef.current = null;
      } catch (e) {
        logDebug(`❌ Error stopping tracks: ${e}`);
      }
    }
    
    // Try saving any collected audio data
    try {
      if (chunksRef.current.length > 0) {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        logDebug(`💾 Audio blob created in emergency: ${audioBlob.size} bytes`);
      }
    } catch (e) {
      logDebug(`❌ Error creating blob: ${e}`);
    }
    
    // Reset MediaRecorder
    mediaRecorderRef.current = null;
  };

  const startRecording = async () => {
    // Clean up any existing recording first
    emergencyStop();
    
    // Reset state
    chunksRef.current = [];
    setRecordingTime(0);
    setRecordedBlob(null);
    setDebugInfo("");
    
    logDebug("▶️ Starting recording...");
    
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      logDebug("🎤 Microphone access granted");
      
      // Set up media recorder with proper options
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up data collection
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
          logDebug(`📦 Data chunk collected: ${event.data.size} bytes`);
        }
      };
      
      // Set up stop handler
      mediaRecorder.onstop = () => {
        logDebug(`⏹️ MediaRecorder.onstop fired, chunks: ${chunksRef.current.length}`);
        
        // Create audio blob from recorded chunks
        if (chunksRef.current.length > 0) {
          try {
            const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
            setRecordedBlob(audioBlob);
            logDebug(`💾 Final blob created: ${audioBlob.size} bytes`);
          } catch (e) {
            logDebug(`❌ Error in onstop handler: ${e}`);
          }
        }
      };
      
      // Start recorder with 500ms data chunks for more frequent updates
      mediaRecorder.start(500);
      logDebug(`▶️ MediaRecorder started: ${mediaRecorder.state}`);
      
      // Update UI
      setIsRecording(true);
      
      // Set up timer for UI
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prevTime => {
          // Auto-stop after 5 minutes as a safety measure
          if (prevTime >= 300) {
            logDebug("⏱️ Auto-stopping after 5 minutes");
            stopRecording();
            return prevTime;
          }
          return prevTime + 1;
        });
      }, 1000);
      
    } catch (error) {
      logDebug(`❌ Error starting recording: ${error}`);
      toast({
        title: "Error",
        description: "No se pudo acceder al micrófono. Verifica los permisos.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    logDebug("🛑 Standard stop recording called");
    
    // Update UI immediately
    setIsRecording(false);
    
    // Try the standard way first
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          // Request final data chunk
          mediaRecorderRef.current.requestData();
          logDebug("📦 Final data requested");
          
          // Stop recording
          mediaRecorderRef.current.stop();
          logDebug("⏹️ MediaRecorder.stop() called");
        } else {
          logDebug(`⚠️ MediaRecorder not recording: ${mediaRecorderRef.current.state}`);
        }
      } catch (e) {
        logDebug(`❌ Error in standard stop: ${e}`);
      }
    }
    
    // Always follow up with emergency stop to be sure
    setTimeout(emergencyStop, 100);
  };

  const handleSubmit = () => {
    if (!recordedBlob) {
      logDebug("❌ No blob available for submission");
      return;
    }
    
    setIsUploading(true);
    logDebug("📤 Submitting recording");
    
    try {
      // Send the blob to the parent component
      onRecordingComplete(recordedBlob);
      logDebug("✅ Recording submitted successfully");
      
      // Close the dialog and reset state
      onClose();
    } catch (error) {
      logDebug(`❌ Error submitting: ${error}`);
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
                <div className="absolute -inset-2 rounded-full bg-destructive/30 animate-pulse"></div>
                {/* Primary stop button with ref for direct event handling */}
                <Button 
                  ref={stopButtonRef}
                  variant="default" 
                  size="icon" 
                  className="h-20 w-20 rounded-full bg-destructive hover:bg-destructive/90" 
                  onClick={stopRecording}
                >
                  <Square className="h-8 w-8 text-white" />
                </Button>
              </div>
            ) : recordedBlob ? (
              <div className="text-center">
                <audio src={URL.createObjectURL(recordedBlob)} controls className="mb-4 w-full" />
                <p className="text-sm text-gray-500 mb-2">Reproducir para verificar</p>
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
            {isRecording ? (
              <span className="font-medium text-destructive">
                Haz clic en el botón para detener la grabación
              </span>
            ) : !recordedBlob ? (
              "Haz clic para comenzar a grabar la consulta"
            ) : null}
          </p>
          
          {/* Emergency stop button when recording */}
          {isRecording && (
            <Button 
              variant="destructive"
              size="sm"
              onClick={emergencyStop}
              className="mt-4"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Parar grabación
            </Button>
          )}
          
          {!isRecording && !recordedBlob && (
            <div className="mt-4 max-w-xs text-center text-xs text-gray-500">
              <p>Coloca tu dispositivo cerca del médico para capturar claramente la conversación.</p>
              <p className="mt-2">Recuerda obtener permiso antes de grabar la consulta.</p>
            </div>
          )}
          
          {/* Debug information section
          {debugInfo && (
            <div className="mt-4 p-2 border border-gray-200 rounded text-xs w-full bg-gray-50 overflow-auto max-h-20">
              <pre className="whitespace-pre-wrap">{debugInfo}</pre>
            </div>
          )} */}
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
              className="bg-secondary hover:bg-secondary/90 px-6"
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
