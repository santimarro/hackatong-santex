import React from 'react';
import { Note } from '@/types/Note';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Download, Mail, Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface MedicalSummaryViewProps {
  note: Note;
}

const MedicalSummaryView: React.FC<MedicalSummaryViewProps> = ({ note }) => {
  const { toast } = useToast();

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(note.medicalSummary);
      toast({
        title: "Copiado al portapapeles",
        description: "El resumen ha sido copiado al portapapeles",
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      });
    }
  };

  const handleDownloadSummary = () => {
    const blob = new Blob([note.medicalSummary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumen-medico-${note.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEmailSummary = () => {
    const subject = encodeURIComponent(`Resumen médico: ${note.title}`);
    const body = encodeURIComponent(note.medicalSummary);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleShareSummary = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Resumen médico profesional',
          text: note.medicalSummary,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      toast({
        title: "Compartir no disponible",
        description: "Esta función no está disponible en tu navegador",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="text-lg font-medium">Resumen médico profesional</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyToClipboard}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copiar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadSummary}
          >
            <Download className="h-4 w-4 mr-1" />
            Descargar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleEmailSummary}
          >
            <Mail className="h-4 w-4 mr-1" />
            Email
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShareSummary}
          >
            <Share className="h-4 w-4 mr-1" />
            Compartir
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="bg-white">
            <MarkdownRenderer markdown={note.medicalSummary} className="prose prose-headings:text-primary prose-sm md:prose-base max-w-none" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalSummaryView;
