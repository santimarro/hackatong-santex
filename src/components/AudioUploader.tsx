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
        title: "Invalid file",
        description: "Please upload an audio file",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 100MB",
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
      <DialogContent className="sm:max-w-md max-w-[95vw] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-center sm:text-left">Upload Medical Consultation Recording</DialogTitle>
        </DialogHeader>
        
        {!selectedFile ? (
          <div 
            className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center ${
              isDragging ? 'border-primary bg-primary-light' : 'border-gray-300'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-gray-400 mb-3 sm:mb-4" />
            <p className="text-sm font-medium mb-1">Drag and drop an audio file</p>
            <p className="text-xs text-gray-500 mb-3 sm:mb-4">or</p>
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
              className="w-full sm:w-auto"
            >
              Select file
            </Button>
            <p className="text-xs text-gray-500 mt-3 sm:mt-4">
              Allowed formats: MP3, WAV, M4A, etc.
            </p>
            <p className="text-xs text-gray-500 mt-1 sm:mt-2">
              Maximum size: 100MB
            </p>
          </div>
        ) : (
          <div className="border rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex justify-center sm:justify-start">
                <div className="p-2 bg-primary-light rounded">
                  <FileAudio className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="font-medium text-sm break-words">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="mx-auto sm:ml-2 sm:mx-0"
                onClick={handleRemoveFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 p-3 bg-primary-light/50 rounded-lg mt-3 sm:mt-4">
          <p className="font-medium text-primary mb-1">Tips for quality recordings:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Make sure the recording has good audio quality</li>
            <li>Ideally, the recording should include the entire consultation</li>
            <li>Avoid files with too much background noise</li>
          </ul>
        </div>
        
        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 sm:gap-0 mt-4">
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={isUploading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          
          {selectedFile && (
            <Button 
              onClick={handleSubmit}
              disabled={isUploading}
              className="w-full sm:w-auto bg-secondary hover:bg-secondary/90"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : "Process consultation"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AudioUploader;
