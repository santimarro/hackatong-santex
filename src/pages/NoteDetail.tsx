import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Calendar, Clock, MapPin, User, Stethoscope } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import TranscriptionView from '@/components/TranscriptionView';
import PatientSummaryView from '@/components/PatientSummaryView';
import MedicalSummaryView from '@/components/MedicalSummaryView';
import BottomNavigation from '@/components/BottomNavigation';
import { Note, consultationToNote } from '@/types/Note';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/lib/auth-context';
import { getProfile, updateEmergencyInfo } from '@/lib/profile-service';
import { getConsultation, getTranscription, getSummaries } from '@/lib/consultation-service';
import { format } from 'date-fns';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { sampleNote } from '@/data/sampleNotes';

// --- Share with Doctor Imports ---
import { supabase } from '@/lib/supabase'; // Your Supabase client instance
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
// --- End Share with Doctor Imports ---

// Define interfaces that were previously imported from '@/types/Profile'
interface MedicationReminder {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  active: boolean;
}

interface EmergencyInfo {
  bloodType?: string;
  allergies?: string[];
  conditions?: string[];
  medications?: string[];
  medicationReminders?: MedicationReminder[];
  // Add other fields as needed
}

const NoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('patientSummary');
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAugmented, setShowAugmented] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // --- Share with Doctor State ---
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [doctorEmail, setDoctorEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  // --- End Share with Doctor State ---

  useEffect(() => {
    const fetchConsultationData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        // Handle sample note case
        if (id === 'sample-note-1') {
          setNote(sampleNote);
          setLoading(false);
          return;
        }
        
        // Fetch consultation data
        
        const consultation = await getConsultation(id);
        
        if (!consultation) {
          setLoading(false);
          return;
        }
        console.log('consultation', consultation);
        // Fetch transcription
        const transcription = await getTranscription(id);
        
        // Fetch summaries
        const summaries = await getSummaries(id);
        
        // Convert to Note type for UI
        const consultationNote = consultationToNote(consultation, transcription, summaries);
        
        setNote(consultationNote);
      } catch (error) {
        console.error('Error fetching consultation data:', error);
        toast({
          title: "Error",
          description: "Failed to load consultation data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchConsultationData();
  }, [id, toast]);

  // --- Share with Doctor Function (Client-Side Workaround) ---
  const handleShareConsultation = async () => {
    if (!id || !user) {
      toast({ title: 'Error', description: 'Consultation ID or user information is missing.', variant: 'destructive' });
      return;
    }
    if (!doctorEmail.trim()) {
      setShareError('Please enter a valid email address for the doctor.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(doctorEmail)) {
      setShareError('Invalid email format.');
      return;
    }

    setIsSharing(true);
    setShareError(null);

    try {
      const shareHash = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 3); // 3-day expiry

      // 1. Update consultations table
      const { error: updateConsultationError } = await supabase
        .from('consultations')
        .update({
          doctor_email: doctorEmail,
          shared_with_doctor_at: new Date().toISOString(),
          share_hash: shareHash,
          share_hash_expires_at: expiresAt.toISOString(),
          review_status: 'pending_review', 
        })
        .eq('id', id)
        .eq('patient_id', user.id); 

      if (updateConsultationError) {
        console.error('Error updating consultation:', updateConsultationError);
        throw new Error('Failed to update consultation with share details. ' + updateConsultationError.message);
      }

      // 2. Create or Update record in doctor_invitations
      const { error: invitationError } = await supabase
        .from('doctor_invitations')
        .upsert({
          patient_profile_id: user.id,
          doctor_email: doctorEmail,
          consultation_id: id,
          status: 'link_prepared_for_user', 
          invitation_sent_at: new Date().toISOString(), 
        }, {
          onConflict: 'doctor_email,consultation_id',
        });

      if (invitationError) {
        console.error('Error upserting doctor invitation record:', invitationError);
      }

      // 3. Prepare and open mailto link
      const appDomain = window.location.origin; // Simplify to just use origin, avoid import.meta.env linter error
      const shareLinkUrl = `${appDomain}/doctor/review/${shareHash}`;
      
      const patientName = user.user_metadata?.full_name || 'A Harvey User';
      const consultationTitle = note?.title || 'a medical consultation';

      const emailSubject = `Review Request: ${consultationTitle} - Shared by ${patientName}`;
      const emailBody = `Hello Dr. ${doctorEmail.split('@')[0] || ''},

${patientName} has shared a summary of their recent medical consultation ("${consultationTitle}") with you via the Harvey app.

Please review the summary here: ${shareLinkUrl}
This link is secure and will expire in 3 days.

With Harvey, you can easily review consultation summaries, copy key information to your EHR, and (soon) validate summaries for your patients.

If you're interested in streamlining this process for all your patients, consider joining Harvey for free!

Best regards,
${patientName}
(via Harvey App)`;

      const mailtoLink = `mailto:${doctorEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      
      // Close the dialog before attempting to open email client
      setIsShareDialogOpen(false); 
      setDoctorEmail('');

      // Create and click an anchor element instead of setting window.location.href
      // This approach has better compatibility with mobile devices
      const mailtoLinkElement = document.createElement('a');
      mailtoLinkElement.href = mailtoLink;
      mailtoLinkElement.target = '_blank'; // This often helps with mailto links
      mailtoLinkElement.rel = 'noopener noreferrer';
      document.body.appendChild(mailtoLinkElement);
      mailtoLinkElement.click();
      document.body.removeChild(mailtoLinkElement);
      
      toast({
        title: 'Email Ready to Send!',
        description: "Your default email app should open with a pre-filled message. Please review and send it to your doctor.",
        duration: 7000, 
      });

      // Add fallback message in case email client doesn't open
      setTimeout(() => {
        toast({
          title: 'Having trouble?',
          description: "If your email app didn't open, copy the doctor's email and share the consultation manually.",
          duration: 10000,
        });
      }, 5000); // Show after 5 seconds if user is still on the page

    } catch (error: any) {
      console.error('Error preparing share link:', error);
      setShareError(error.message || 'Failed to prepare share link. Please try again.');
      toast({
        title: 'Preparation Failed',
        description: error.message || 'An error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  };
  // --- End Share with Doctor Function ---

  // --- Function to Add Reminders to Profile --- (Moved outside useEffect)
  const addRemindersToProfile = async (reminderTexts: string[]) => {
    if (!user) throw new Error("User not logged in");

    try {
      const profile = await getProfile(user.id);
      if (!profile) throw new Error("Profile not found");

      const currentInfo = (profile.emergency_info || {}) as EmergencyInfo;
      const existingReminders = currentInfo.medicationReminders || [];

      const newReminders: MedicationReminder[] = reminderTexts.map(text => ({
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        name: text,
        dosage: '', 
        frequency: 'daily',
        time: '09:00',
        active: true,
      }));

      const allReminders = [...existingReminders, ...newReminders];
      await updateEmergencyInfo(user.id, { ...currentInfo, medicationReminders: allReminders });

      // Optional: Navigate or just let the toast in child component handle success
      // navigate('/reminders');

    } catch (error) {
      console.error("Failed to save reminders to profile:", error);
      throw error; // Re-throw for PatientSummaryView to catch
    }
  };
  // --- End Function to Add Reminders ---

  const handleUpdateNote = (updatedNote: Note) => {
    setNote(updatedNote);
  };

  const handleBackClick = () => {
    navigate('/notes');
  };

  // Format date and time from ISO string
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return { date: 'N/A', time: 'N/A' };
    
    const date = new Date(dateString);
    return {
      date: format(date, 'PPP'), // e.g., April 18, 2025
      time: format(date, 'h:mm a') // e.g., 11:00 AM
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <header className="flex items-center px-6 py-4 border-b border-gray-200">
          <button className="mr-2" onClick={handleBackClick}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Consultation Details</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <header className="flex items-center px-6 py-4 border-b border-gray-200">
          <button className="mr-2" onClick={handleBackClick}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Consultation Details</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">Consultation not found</p>
            <button 
              className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
              onClick={() => navigate('/notes')}
            >
              View all consultations
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Extract date and time
  const { date, time } = formatDateTime(note.date);

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="flex items-center px-6 py-4 border-b border-gray-200">
        <button className="mr-2" onClick={handleBackClick}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold truncate">{note.title}</h1>
      </header>

      {/* Consultation metadata */}
      <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
            {date}
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1 text-gray-400" />
            {time}
          </div>
          {note.doctorName && (
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1 text-gray-400" />
              Dr. {note.doctorName}
            </div>
          )}
          {note.specialty && (
            <div className="flex items-center">
              <Stethoscope className="h-4 w-4 mr-1 text-gray-400" />
              {note.specialty}
            </div>
          )}
          {note.location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
              {note.location}
            </div>
          )}
        </div>
      </div>
      
      {/* Share with Doctor Button and Dialog - MOVED to above tabs */}
      {note && (
        <div className="px-6 py-2 border-b border-gray-200 bg-white">
          <Dialog open={isShareDialogOpen} onOpenChange={(open) => {
            setIsShareDialogOpen(open);
            if (!open) {
              setShareError(null);
              setDoctorEmail('');
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                Share with Doctor (via your Email)
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Share Consultation via Your Email</DialogTitle>
                <DialogDescription>
                  Enter the doctor's email. We'll save this and prepare an email for you to send from your own email client.
                  The secure link will expire in 3 days.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="doctor-email" className="text-right">
                    Doctor's Email
                  </Label>
                  <Input
                    id="doctor-email"
                    type="email"
                    value={doctorEmail}
                    onChange={(e) => {
                      setDoctorEmail(e.target.value);
                      if (shareError) setShareError(null); 
                    }}
                    className="col-span-3"
                    placeholder="doctor@example.com"
                  />
                </div>
                {shareError && (
                  <p className="col-span-4 text-sm text-red-600 text-center px-1">{shareError}</p>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" onClick={handleShareConsultation} disabled={isSharing || !doctorEmail.trim()}>
                  {isSharing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    'Prepare Email & Share Link'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-2">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="patientSummary">Patient Summary</TabsTrigger>
            <TabsTrigger value="transcription">Transcription</TabsTrigger>
            <TabsTrigger value="medicalSummary">Medical Summary</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="patientSummary" className="flex-1 overflow-auto p-6 pb-24">
          {note && (
            <PatientSummaryView 
              note={note} 
              onAddReminders={addRemindersToProfile}
            />
          )}
        </TabsContent>
        
        <TabsContent value="transcription" className="flex-1 overflow-auto p-6 pb-24">
          <TranscriptionView note={note} onUpdateNote={handleUpdateNote} />
        </TabsContent>
        
        <TabsContent value="medicalSummary" className="flex-1 overflow-auto p-6 pb-24">
          <MedicalSummaryView note={note} />
        </TabsContent>
      </Tabs>

      <BottomNavigation />
    </div>
  );
};

export default NoteDetail; 