
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, FileAudio, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AudioUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => void;
}

const AudioUploader: React.FC<AudioUploaderProps> = ({ isOpen, onClose, onFileUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Archivo inválido",
        description: "Por favor sube un archivo de audio",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "Por favor sube un archivo menor a 100MB",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFile(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    onFileUpload(selectedFile);
    
    onClose();
    setIsUploading(false);
    setSelectedFile(null);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Subir grabación de consulta médica</DialogTitle>
        </DialogHeader>
        
        {!selectedFile ? (
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? 'border-primary bg-primary-light' : 'border-gray-300'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-10 w-10 text-gray-400 mb-4" />
            <p className="text-sm font-medium mb-1">Arrastra y suelta un archivo de audio</p>
            <p className="text-xs text-gray-500 mb-4">o</p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="audio/*"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Seleccionar archivo
            </Button>
            <p className="text-xs text-gray-500 mt-4">
              Formatos permitidos: MP3, WAV, M4A, etc.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Tamaño máximo: 100MB
            </p>
          </div>
        ) : (
          <div className="border rounded-lg p-4">
            <div className="flex items-center">
              <div className="mr-4 p-2 bg-primary-light rounded">
                <FileAudio className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="ml-2"
                onClick={handleRemoveFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 p-3 bg-primary-light/50 rounded-lg">
          <p className="font-medium text-primary mb-1">Consejos para grabaciones de calidad:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Asegúrate de que la grabación tenga buen audio</li>
            <li>Idealmente, la grabación debe incluir toda la consulta</li>
            <li>Evita archivos con mucho ruido de fondo</li>
          </ul>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          
          {selectedFile && (
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

export default AudioUploader;
