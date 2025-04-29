import React, { useState } from 'react';
import { Note } from '@/types/Note';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Download, Mail, Share, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { useIsMobile } from '@/hooks/use-mobile';

interface MedicalSummaryViewProps {
  note: Note;
}

const MedicalSummaryView: React.FC<MedicalSummaryViewProps> = ({ note }) => {
  const { toast } = useToast();
  const [showAugmented, setShowAugmented] = useState(false);
  const isMobile = useIsMobile();

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(note.medicalSummary);
      toast({
        title: "Copied to clipboard",
        description: "The summary has been copied to clipboard",
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({
        title: "Error",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownloadSummary = () => {
    const blob = new Blob([note.medicalSummary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-summary-${note.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEmailSummary = () => {
    const subject = encodeURIComponent(`Medical summary: ${note.title}`);
    const body = encodeURIComponent(note.medicalSummary);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleShareSummary = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Professional medical summary',
          text: note.medicalSummary,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      toast({
        title: "Sharing not available",
        description: "This feature is not available in your browser",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <h3 className="text-lg font-medium">Professional medical summary</h3>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyToClipboard}
            className="flex-1 sm:flex-initial"
          >
            <Copy className="h-4 w-4 mr-1" />
            {isMobile ? '' : 'Copy'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownloadSummary}
            className="flex-1 sm:flex-initial"
          >
            <Download className="h-4 w-4 mr-1" />
            {isMobile ? '' : 'Download'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleEmailSummary}
            className="flex-1 sm:flex-initial"
          >
            <Mail className="h-4 w-4 mr-1" />
            {isMobile ? '' : 'Email'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShareSummary}
            className="flex-1 sm:flex-initial"
          >
            <Share className="h-4 w-4 mr-1" />
            {isMobile ? '' : 'Share'}
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
      
      {note.augmentedMedicalSummary && (
        <div className="mt-6">
          {!showAugmented ? (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              onClick={() => setShowAugmented(true)}
            >
              <Brain className="h-4 w-4 mr-2" />
              Show Augmented Consultation
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Augmented Consultation - Second Opinion</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAugmented(false)}
                >
                  Hide
                </Button>
              </div>
              <Card className="border-primary-light">
                <CardContent className="p-6">
                  <div className="bg-white">
                    <MarkdownRenderer markdown={note.augmentedMedicalSummary} className="prose prose-headings:text-primary prose-sm md:prose-base max-w-none" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicalSummaryView;
