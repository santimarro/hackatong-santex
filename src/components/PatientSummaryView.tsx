import React, { useState } from 'react';
import { Note } from '@/types/Note';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Download, Share, PlusCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { useIsMobile } from '@/hooks/use-mobile';
import ReminderItem from './ReminderItem';

interface PatientSummaryViewProps {
  note: Note;
  // Function to call when adding selected reminders
  onAddReminders: (reminderTexts: string[]) => Promise<void>; 
}

const PatientSummaryView: React.FC<PatientSummaryViewProps> = ({ note, onAddReminders }) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // State to track checked reminders (using index as key)
  const [checkedReminders, setCheckedReminders] = useState<Record<number, boolean>>({});
  const [isAddingReminders, setIsAddingReminders] = useState(false); // Loading state

  // Handler for when a ReminderItem checkbox changes
  const handleReminderCheckChange = (index: number, isChecked: boolean) => {
    setCheckedReminders(prev => ({ ...prev, [index]: isChecked }));
  };

  // Handler for the "Add to Reminders" button
  const handleAddSelectedToReminders = async () => {
    const selectedReminderTexts = note.reminders
      ? note.reminders.filter((_, index) => checkedReminders[index])
      : [];

    if (selectedReminderTexts.length === 0) {
      toast({
        title: "No Reminders Selected",
        description: "Please check the reminders you want to add.",
        variant: "default",
      });
      return;
    }

    setIsAddingReminders(true); // Start loading
    try {
      // Call the passed-in function to handle adding
      await onAddReminders(selectedReminderTexts);
      
      toast({
        title: "Success",
        description: "Selected reminders added.",
      });
      
      // Clear selection after successful add
      setCheckedReminders({});
      
    } catch (error) {
      console.error("Error adding reminders:", error);
      toast({
        title: "Error Adding Reminders",
        description: "Could not add the selected reminders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingReminders(false); // Stop loading
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(note.patientSummary);
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
    const blob = new Blob([note.patientSummary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumen-paciente-${note.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareSummary = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Resumen de consulta médica',
          text: note.patientSummary,
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
      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <h3 className="text-lg font-medium">Resumen para el paciente</h3>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyToClipboard}
            className="flex-1 sm:flex-initial"
          >
            <Copy className="h-4 w-4 mr-1" />
            {isMobile ? '' : 'Copiar'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadSummary}
            className="flex-1 sm:flex-initial"
          >
            <Download className="h-4 w-4 mr-1" />
            {isMobile ? '' : 'Descargar'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShareSummary}
            className="flex-1 sm:flex-initial"
          >
            <Share className="h-4 w-4 mr-1" />
            {isMobile ? '' : 'Compartir'}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="bg-white">
            <MarkdownRenderer markdown={note.patientSummary} className="prose prose-headings:text-primary prose-sm md:prose-base max-w-none" />
          </div>
        </CardContent>
      </Card>

      {/* Reminders Section */}
      {note.reminders && note.reminders.length > 0 && (
        <div className="space-y-4 pt-4">  {/* Add some top padding */}
          <h3 className="text-lg font-medium">Recordatorios</h3>
          <Card>
            <CardContent className="p-0">
              {note.reminders.map((reminder, index) => (
                <ReminderItem 
                  key={index} 
                  reminderText={reminder} 
                  isChecked={!!checkedReminders[index]}
                  onCheckedChange={(isChecked) => handleReminderCheckChange(index, isChecked)}
                />
              ))}
            </CardContent>
          </Card>
          <div className="flex justify-end mt-4">
            <Button 
              onClick={handleAddSelectedToReminders}
              disabled={Object.values(checkedReminders).every(v => !v) || isAddingReminders}
            >
              {isAddingReminders ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
              )}
              {isAddingReminders ? 'Adding...' : 'Add to Reminders'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientSummaryView;
