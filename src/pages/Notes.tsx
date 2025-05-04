import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShieldCheck, Calendar, MapPin, ArrowRight, Stethoscope, Upload, Plus, FileText } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { useAuth } from "@/lib/auth-context";
import { getUpcomingAppointments, getPastAppointments } from "@/lib/appointment-service";
import { isUserAdmin } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import AudioRecorder from '@/components/AudioRecorder';
import AudioUploader from '@/components/AudioUploader';
import ComprehensiveSummaryView from '@/components/ComprehensiveSummaryView';
import { Note, Consultation, consultationToNote } from '@/types/Note';
import { 
  getConsultation, 
  uploadConsultationAudio, 
  createTranscription, 
  createSummary, 
  updateConsultation, 
  getUserConsultations,
  getTranscription,
  getSummaries
} from '@/lib/consultation-service';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Use Vite's environment variables
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
const deepgramApiKey = import.meta.env.VITE_DEEPGRAM_API_KEY as string;

interface Appointment {
  id: string;
  title: string;
  scheduled_for: string;
  location?: string;
}
 
const formatAppointmentDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const isToday = new Date().toDateString() === date.toDateString();
  
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today, ${timeStr}`;
  return `${date.toLocaleDateString()}, ${timeStr}`;
};

const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  if (!deepgramApiKey) {
    throw new Error("Deepgram API key not configured in environment variables");
  }

  const buffer = await audioBlob.arrayBuffer();
  
  const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&detect_language=true", {
    method: "POST",
    headers: {
      "Authorization": `Token ${deepgramApiKey}`,
      "Content-Type": "audio/m4a",
    },
    body: buffer,
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Deepgram API error: ${response.status} ${error}`);
  }
  
  const result = await response.json();
  return result.results?.channels[0]?.alternatives[0]?.transcript || "";
};

const generatePatientSummary = async (text: string): Promise<{ patient_summary: string; reminders: string[] }> => {
  if (!geminiApiKey) {
    throw new Error("Gemini API key not configured in environment variables");
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
    });
    
    const prompt = `Create a patient-friendly medical summary based on the transcription of the medical consultation.

IMPORTANT: You should include ONLY information that is explicitly mentioned in the transcription. DO NOT add:
- Additional explanations that the doctor did not provide
- Recommendations that were not mentioned
- Interpretations or reasoning that are not present in the original consultation
- Information about warning signs, unless the doctor specifically mentioned them

Your task is to:
1. Extract and organize the information provided directly by the doctor in the consultation for the summary.
2. Present the summary in simple and accessible language for the patient.
3. Extract specific tasks or instructions for the reminders list. Each reminder should be a single, clear action.
4. Maintain absolute fidelity to the original content of the transcription for both summary and reminders.

If the doctor does not explain something in detail, DO NOT provide additional explanations.

Organize the information in clear sections according to what was discussed in the consultation.

Medical consultation transcription:
${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();
    
    // Extract reminders from the summary
    const reminders = summary
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(1).trim());

    return {
      patient_summary: summary,
      reminders
    };
  } catch (error) {
    console.error("Error generating patient summary:", error);
    throw new Error("Failed to generate patient summary");
  }
};

const generateMedicalSummary = async (text: string): Promise<string> => {
  if (!geminiApiKey) {
    throw new Error("Gemini API key not configured in environment variables");
  } 
 
  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
    });
    
    const prompt = `Generate a professional clinical summary in SOAP format based on the transcription of the medical consultation.
IMPORTANT: Include ONLY information that is explicitly mentioned in the transcription.

Structure the summary using the SOAP format:
- S (Subjective): Information provided by the patient, symptoms, complaints, and history mentioned
- O (Objective): Physical examination findings and test results mentioned in the transcription
- A (Analysis/Assessment): Diagnosis or assessment mentioned by the doctor, without adding additional interpretations
- P (Plan): Treatment plan and recommendations explicitly mentioned by the doctor

Use standard medical terminology and maintain absolute fidelity to the content of the transcription.

Medical consultation transcription:
${text}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating medical summary:", error);
    throw new Error("Failed to generate medical summary");
  }
};

const Notes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(true);
  const [isSummarySheetOpen, setIsSummarySheetOpen] = useState<boolean>(false);
  const [comprehensiveSummary, setComprehensiveSummary] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);
  const [consultation, setConsultation] = useState<Consultation | null>(null);

  // Parse the consultation ID from the query string
  const queryParams = new URLSearchParams(location.search);
  const consultationId = queryParams.get('consultation');

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Check if user is admin
        const adminStatus = await isUserAdmin();
        setIsAdmin(adminStatus);
        
        // Fetch appointments
        const [upcoming, past] = await Promise.all([
          getUpcomingAppointments(user.id),
          getPastAppointments(user.id)
        ]);
        
        setUpcomingAppointments(upcoming);
        setPastAppointments(past);

        // Fetch consultations
        const consultationsData = await getUserConsultations(user.id);
        if (consultationsData && consultationsData.length > 0) {
          const dbNotes: Note[] = [];
          for (const consultation of consultationsData) {
            try {
              const transcription = await getTranscription(consultation.id);
              const summaries = await getSummaries(consultation.id);
              const note = consultationToNote(consultation, transcription, summaries || []);
              dbNotes.push(note);
            } catch (err) {
              console.error(`Error processing consultation ${consultation.id}:`, err);
            }
          }
          setNotes(dbNotes);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setIsLoadingNotes(false);
      }
    }
    
    fetchData();
  }, [user, toast]);

  // Fetch consultation data if consultationId is provided
  useEffect(() => {
    if (consultationId && user) {
      const fetchConsultation = async () => {
        try {
          const data = await getConsultation(consultationId);
          if (data) {
            setConsultation(data);
          }
        } catch (error) {
          console.error('Error fetching consultation:', error);
          toast({
            title: "Error",
            description: "Failed to load consultation data",
            variant: "destructive",
          });
        }
      };
      
      fetchConsultation();
    }
  }, [consultationId, user, toast]);

  const handleRecordComplete = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      if (consultationId && user && consultation) {
        const fileName = `${user.id}/${consultationId}/audio-${Date.now()}.webm`;
        const audioFile = new File([audioBlob], fileName, { type: 'audio/webm' });
        
        const { filePath, error } = await uploadConsultationAudio(consultationId, audioFile, user.id);
        if (error || !filePath) {
          throw new Error('Failed to upload audio file');
        }
        
        await updateConsultation(consultationId, { status: 'transcribing' });
        
        const transcript = await transcribeAudio(audioBlob);
        
        const transcriptionData = {
          consultation_id: consultationId,
          content: transcript,
          provider: 'deepgram'
        };
        
        await createTranscription(transcriptionData);
        
        const patientSummary = await generatePatientSummary(transcript);
        const medicalSummary = await generateMedicalSummary(transcript);
        
        await createSummary({
          consultation_id: consultationId,
          type: 'patient',
          content: patientSummary.patient_summary,
          provider: 'gemini'
        });
        
        await createSummary({
          consultation_id: consultationId,
          type: 'medical',
          content: medicalSummary,
          provider: 'gemini'
        });
        
        await updateConsultation(consultationId, { status: 'completed' });
        
        const updatedConsultation = await getConsultation(consultationId);
        setConsultation(updatedConsultation);
        
        const newNote: Note = {
          id: consultationId,
          title: updatedConsultation?.title || 'Medical Consultation',
          date: updatedConsultation?.created_at || new Date().toISOString(),
          doctorName: updatedConsultation?.doctor_id ? 'Dr. Provider' : undefined,
          location: updatedConsultation?.appointment_location,
          audioBlob: audioBlob,
          transcription: transcript,
          patientSummary: patientSummary.patient_summary,
          medicalSummary: medicalSummary,
          reminders: patientSummary.reminders,
        };
        
        setNotes(prev => [newNote, ...prev]);
        navigate(`/note/${newNote.id}`);
      }
      
      toast({
        title: "Success",
        description: "Medical consultation processed successfully",
      });
    } catch (error: any) {
      console.error("Error processing audio:", error);
      toast({
        title: "Error",
        description: error.message || "Error processing audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob([file], { type: file.type });
      
      if (consultationId && user && consultation) {
        const fileName = `${user.id}/${consultationId}/audio-${Date.now()}.${file.name.split('.').pop()}`;
        
        const { filePath, error } = await uploadConsultationAudio(consultationId, file, user.id);
        if (error || !filePath) {
          throw new Error('Failed to upload audio file');
        }
        
        await updateConsultation(consultationId, { status: 'transcribing' });
        
        const transcript = await transcribeAudio(audioBlob);
        
        const transcriptionData = {
          consultation_id: consultationId,
          content: transcript,
          provider: 'deepgram'
        };
        
        await createTranscription(transcriptionData);
        
        const patientSummary = await generatePatientSummary(transcript);
        const medicalSummary = await generateMedicalSummary(transcript);
        
        await createSummary({
          consultation_id: consultationId,
          type: 'patient',
          content: patientSummary.patient_summary,
          provider: 'gemini'
        });
        
        await createSummary({
          consultation_id: consultationId,
          type: 'medical',
          content: medicalSummary,
          provider: 'gemini'
        });
        
        await updateConsultation(consultationId, { status: 'completed' });
        
        const updatedConsultation = await getConsultation(consultationId);
        setConsultation(updatedConsultation);
        
        const newNote: Note = {
          id: consultationId,
          title: updatedConsultation?.title || file.name.replace(/\.[^/.]+$/, "") || 'Medical Consultation',
          date: updatedConsultation?.created_at || new Date().toISOString(),
          doctorName: updatedConsultation?.doctor_id ? 'Dr. Provider' : undefined,
          location: updatedConsultation?.appointment_location,
          audioBlob: audioBlob,
          transcription: transcript,
          patientSummary: patientSummary.patient_summary,
          medicalSummary: medicalSummary,
          reminders: patientSummary.reminders,
        };
        
        setNotes(prev => [newNote, ...prev]);
        navigate(`/note/${newNote.id}`);
      }
      
      toast({
        title: "Success",
        description: "Medical consultation processed successfully",
      });
    } catch (error: any) {
      console.error("Error processing audio:", error);
      toast({
        title: "Error",
        description: error.message || "Error processing audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateComprehensiveSummary = async (selectedSpecialty: string | null, selectedNoteIds: string[]) => {
    setIsGeneratingSummary(true);
    
    try {
      const filteredNotes = notes.filter(note => selectedNoteIds.includes(note.id));
      
      const summaries = filteredNotes.map(note => {
        const specialtyText = note.specialty ? `Specialty: ${note.specialty}` : '';
        const dateText = `Date: ${new Date(note.date).toLocaleDateString()}`;
        const titleText = `Consultation: ${note.title}`;
        
        return `
===== ${titleText} =====
${dateText}
${specialtyText ? specialtyText + '\n' : ''}

${note.medicalSummary}
        `;
      }).join("\n\n");

      const prompt = `Here are summaries of various medical consultations for the patient:

<summaries>
${summaries}
</summaries>

Please do the following:
1. Carefully read the provided summaries from the various medical consultations.
2. Combine the summaries into a single coherent and comprehensive narrative of the patient's medical history.${selectedSpecialty ? `\n3. Focus primarily on information related to ${selectedSpecialty}.` : ''}
3. The narrative should provide a longitudinal view of the patient's clinical activity based on the various consultations.
4. Highlight any abnormal findings in tests or laboratory results if available.
5. Do not infer conditions that are not explicitly mentioned.
6. Exclude ruled-out or dismissed conditions.
7. Organize the information chronologically when possible.
8. Make sure to use proper markdown formatting for headings, lists, and paragraphs.
9. Use level 2 headings (##) for main sections and level 3 (###) for subsections.
10. Use bullet lists (*) to enumerate related items.
11. Add space after markdown symbols (# for headings, * for lists) to ensure proper formatting.

The response should be a single summarized, well-structured document with markdown formatting that a medical professional can use to quickly understand the patient's complete history.`;

      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${geminiApiKey}`,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const result = await response.json();
      const summary = result.candidates[0].content.parts[0].text;
      
      setComprehensiveSummary(summary);
      
      toast({
        title: "Success",
        description: "Comprehensive medical summary generated successfully",
      });
    } catch (error) {
      console.error("Error generating comprehensive summary:", error);
      toast({
        title: "Error",
        description: "Error generating the comprehensive medical summary",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Render consultation view if consultation exists
  if (consultation && !isProcessing) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <header className="border-b border-gray-200 bg-white py-4 px-6">
          <h1 className="text-xl font-bold text-primary">Consultation</h1>
        </header>

        <div className="flex-1 overflow-auto py-6 px-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">{consultation.title || "Medical Consultation"}</h2>
            </div>

            <Card className="bg-gray-50">
              <CardContent className="p-4 space-y-3">
                {consultation.appointment_date && (
                  <>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                      <span>{formatAppointmentDateTime(consultation.appointment_date)}</span>
                    </div>
                  </>
                )}
                
                {consultation.appointment_location && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                    <span>{consultation.appointment_location}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {consultation.custom_notes && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <div className="p-3 border border-gray-200 rounded-md bg-white min-h-[100px]">
                  {consultation.custom_notes.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 pb-24">
          <div className="flex gap-4">
            <Button 
              className="flex-1"
              onClick={() => setIsRecording(true)}
            >
              <Stethoscope className="h-4 w-4 mr-2" />
              Record Consultation
            </Button>
            
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setIsUploading(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Audio
            </Button>
          </div>
        </div>

        <AudioRecorder 
          isOpen={isRecording} 
          onClose={() => setIsRecording(false)} 
          onRecordingComplete={handleRecordComplete} 
        />

        <AudioUploader 
          isOpen={isUploading} 
          onClose={() => setIsUploading(false)} 
          onFileUpload={handleFileUpload} 
        />

        <BottomNavigation />
      </div>
    );
  }

  // Render main notes view
  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="border-b border-gray-200 bg-white py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary">Visits</h1>
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => setIsSummarySheetOpen(true)}
          disabled={notes.length === 0}
        >
          <FileText className="h-4 w-4 mr-2" />
          Summary
        </Button>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-auto pb-16">
          {/* Upcoming Appointments */}
          <div className="mt-4 px-6">
            <h2 className="text-lg font-medium mb-2">Upcoming Appointments</h2>
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <Card 
                  key={appointment.id}
                  className="mb-4 cursor-pointer" 
                  onClick={() => navigate(`/appointment/${appointment.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{appointment.title}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{formatAppointmentDateTime(appointment.scheduled_for)}</span>
                        </div>
                        {appointment.location && (
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{appointment.location}</span>
                          </div>
                        )}
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                You have no upcoming appointments
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full mb-6" 
              onClick={() => navigate('/appointments')}
            >
              View all upcoming appointments
            </Button>
          </div>

          {/* Previous Appointments */}
          <div className="mt-6 px-6">
            <h2 className="text-lg font-medium mb-2">Previous Appointments</h2>
            {pastAppointments.length > 0 ? (
              pastAppointments.map((appointment) => (
                <Card 
                  key={appointment.id}
                  className="mb-4 cursor-pointer" 
                  onClick={() => navigate(`/appointment/${appointment.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{appointment.title}</h3>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{formatAppointmentDateTime(appointment.scheduled_for)}</span>
                        </div>
                        {appointment.location && (
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{appointment.location}</span>
                          </div>
                        )}
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                You have no previous appointments
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full mb-6" 
              onClick={() => navigate('/appointments')}
            >
              View all previous appointments
            </Button>
          </div>

          {/* Admin section - only visible to admins */}
          {isAdmin && (
            <div className="mt-6 px-6 pb-6">
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-medium">Admin Dashboard</h2>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Manage users and control who can register in the application.
                  </p>
                  <Button 
                    onClick={() => navigate('/admin')} 
                    className="w-full"
                  >
                    Access Admin Panel
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Floating action button for new consultation */}
      <div className="fixed right-6 bottom-20">
        <Button
          onClick={() => setIsRecording(true)}
          className="h-14 w-14 rounded-full shadow-lg"
          disabled={isProcessing}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <AudioRecorder 
        isOpen={isRecording} 
        onClose={() => setIsRecording(false)} 
        onRecordingComplete={handleRecordComplete} 
      />

      <AudioUploader 
        isOpen={isUploading} 
        onClose={() => setIsUploading(false)} 
        onFileUpload={handleFileUpload} 
      />

      {/* Comprehensive Summary Sheet */}
      <Sheet open={isSummarySheetOpen} onOpenChange={setIsSummarySheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] sm:max-w-xl sm:h-screen">
          <SheetHeader>
            <SheetTitle>Comprehensive Summary</SheetTitle>
          </SheetHeader>
          <div className="mt-6 overflow-y-auto h-[calc(100%-4rem)]">
            <ComprehensiveSummaryView 
              notes={notes}
              onRegenerateSummary={handleGenerateComprehensiveSummary}
              isGenerating={isGeneratingSummary}
              comprehensiveSummary={comprehensiveSummary}
            />
          </div>
        </SheetContent>
      </Sheet>

      <BottomNavigation />
    </div>
  );
};

export default Notes;