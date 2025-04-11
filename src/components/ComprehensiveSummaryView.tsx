import React, { useState, useEffect } from 'react';
import { Note } from '@/types/Note';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Download, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ComprehensiveSummaryViewProps {
  notes: Note[];
  onRegenerateSummary: (selectedSpecialty: string | null, notesToInclude: string[]) => void;
  isGenerating: boolean;
  comprehensiveSummary: string;
}

const ComprehensiveSummaryView: React.FC<ComprehensiveSummaryViewProps> = ({
  notes,
  onRegenerateSummary,
  isGenerating,
  comprehensiveSummary
}) => {
  const { toast } = useToast();
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  
  // Get unique specialties from all notes
  const specialties = Array.from(
    new Set(notes.filter(note => note.specialty).map(note => note.specialty))
  );

  // Initialize selected notes to include all notes IDs
  useEffect(() => {
    setSelectedNotes(notes.map(note => note.id));
  }, [notes]);

  const handleSpecialtyChange = (value: string) => {
    setSelectedSpecialty(value === "all" ? null : value);
  };

  const handleNoteToggle = (noteId: string) => {
    setSelectedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId) 
        : [...prev, noteId]
    );
  };

  const handleRegenerateSummary = () => {
    onRegenerateSummary(selectedSpecialty, selectedNotes);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(comprehensiveSummary);
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
    const blob = new Blob([comprehensiveSummary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumen-completo${selectedSpecialty ? `-${selectedSpecialty}` : ''}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="space-y-2 flex-1">
          <Label htmlFor="specialty-filter">Filtrar por especialidad</Label>
          <Select onValueChange={handleSpecialtyChange} defaultValue="all">
            <SelectTrigger id="specialty-filter" className="w-full">
              <SelectValue placeholder="Todas las especialidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las especialidades</SelectItem>
              {specialties.map((specialty) => (
                <SelectItem key={specialty} value={specialty || ""}>
                  {specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-end gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyToClipboard}
            disabled={!comprehensiveSummary || isGenerating}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copiar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadSummary}
            disabled={!comprehensiveSummary || isGenerating}
          >
            <Download className="h-4 w-4 mr-1" />
            Descargar
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleRegenerateSummary}
            disabled={isGenerating || selectedNotes.length === 0}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generando...' : 'Generar resumen'}
          </Button>
        </div>
      </div>

      <div className="border rounded-md p-4 max-h-64 overflow-auto">
        <Label className="mb-2 block">Consultas a incluir</Label>
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="flex items-center space-x-2">
              <Checkbox
                id={`note-${note.id}`}
                checked={selectedNotes.includes(note.id)}
                onCheckedChange={() => handleNoteToggle(note.id)}
              />
              <Label htmlFor={`note-${note.id}`} className="text-sm flex-1 cursor-pointer">
                {note.title} {note.specialty ? `- ${note.specialty}` : ''} ({new Date(note.date).toLocaleDateString()})
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {isGenerating ? (
            <div className="flex items-center justify-center p-6">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Generando resumen completo...</span>
            </div>
          ) : comprehensiveSummary ? (
            <div className="bg-white prose prose-headings:text-primary prose-sm md:prose-base max-w-none">
              <MarkdownRenderer 
                markdown={comprehensiveSummary} 
                className="prose prose-headings:text-primary prose-sm md:prose-base max-w-none"
              />
            </div>
          ) : (
            <div className="text-center text-gray-500 p-6">
              <p>Selecciona las consultas y especialidades que deseas incluir en el resumen completo.</p>
              <p className="text-sm mt-2">Haz clic en "Generar resumen" para crear un resumen médico integral de todas tus consultas seleccionadas.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComprehensiveSummaryView; 