
import React from 'react';
import { Note } from '@/types/Note';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Download, Mail, Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { marked } from 'marked';

interface MedicalSummaryViewProps {
  note: Note;
}

const MedicalSummaryView: React.FC<MedicalSummaryViewProps> = ({ note }) => {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(note.medicalSummary);
    toast({
      title: "Copiado",
      description: "Resumen médico copiado al portapapeles",
    });
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([note.medicalSummary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${note.title}-resumen-medico.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Descargado",
      description: "Resumen médico descargado como archivo de texto",
    });
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Informe médico: ${note.title}`);
    const body = encodeURIComponent(note.medicalSummary);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    
    toast({
      title: "Email",
      description: "Preparando email con el resumen médico",
    });
  };

  // Render the summary with markdown formatting
  const renderedSummary = marked(note.medicalSummary);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-primary">Resumen clínico</h2>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Descargar
          </Button>
          <Button variant="outline" size="sm" onClick={handleEmail}>
            <Mail className="h-4 w-4 mr-1" />
            Email
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <div 
            className="prose prose-sm max-w-none prose-headings:text-primary prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: renderedSummary }}
          />
        </CardContent>
      </Card>
      
      <div className="rounded-lg bg-primary-light p-4 text-sm">
        <p className="font-medium">Información para profesionales médicos</p>
        <p className="text-xs mt-1 text-gray-600">Este resumen utiliza terminología médica y está destinado a ser compartido con profesionales de la salud.</p>
      </div>
    </div>
  );
};

export default MedicalSummaryView;
