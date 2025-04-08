
import React from 'react';
import { Note } from '@/types/Note';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Download, Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { marked } from 'marked';

interface PatientSummaryViewProps {
  note: Note;
}

const PatientSummaryView: React.FC<PatientSummaryViewProps> = ({ note }) => {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(note.patientSummary);
    toast({
      title: "Copiado",
      description: "Resumen copiado al portapapeles",
    });
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([note.patientSummary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${note.title}-resumen-paciente.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Descargado",
      description: "Resumen descargado como archivo de texto",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Resumen médico: ${note.title}`,
        text: note.patientSummary,
      })
      .then(() => {
        toast({
          title: "Compartido",
          description: "Resumen compartido exitosamente",
        });
      })
      .catch((error) => {
        console.error('Error sharing', error);
        toast({
          title: "Error",
          description: "No se pudo compartir el resumen",
          variant: "destructive",
        });
      });
    } else {
      handleCopy();
    }
  };

  // Render the summary with markdown formatting
  const renderedSummary = marked(note.patientSummary);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-primary">Resumen para paciente</h2>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Descargar
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share className="h-4 w-4 mr-1" />
            Compartir
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
      
      <div className="rounded-lg bg-primary-light p-4 text-center text-sm">
        <p>Este resumen está escrito en lenguaje simple para tu mejor comprensión.</p>
        <p className="text-xs mt-1 text-gray-500">Consulta siempre con tu médico cualquier duda sobre tu tratamiento.</p>
      </div>
    </div>
  );
};

export default PatientSummaryView;
