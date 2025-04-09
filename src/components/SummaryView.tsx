
import React from 'react';
import { Note } from '@/types/Note';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Download, Share2, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { marked } from 'marked';
import { useNavigate } from 'react-router-dom';

interface SummaryViewProps {
  note: Note;
}

const SummaryView: React.FC<SummaryViewProps> = ({ note }) => {
  const { toast } = useToast();
  const navigate = useNavigate();

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
    element.download = `${note.title}-resumen.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Descargado",
      description: "Resumen descargado como archivo de texto",
    });
  };

  const handleShare = () => {
    // Navigate to the QR share page
    navigate('/qr');
  };

  // Render the summary with markdown formatting
  const renderedSummary = marked(note.patientSummary);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Resumen de estudio</h2>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <QrCode className="h-4 w-4 mr-1" />
            Compartir
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Descargar
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-4">
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: renderedSummary }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryView;
