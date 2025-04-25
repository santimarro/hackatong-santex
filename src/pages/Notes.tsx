import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Stethoscope, Upload, Plus, Loader2, Calendar, Clock, MapPin, FileText, ChevronRight } from "lucide-react";
import AudioRecorder from '@/components/AudioRecorder';
import AudioUploader from '@/components/AudioUploader';
import ComprehensiveSummaryView from '@/components/ComprehensiveSummaryView';
import BottomNavigation from '@/components/BottomNavigation';
import { Note, Consultation, consultationToNote } from '@/types/Note';
import { useIsMobile } from '@/hooks/use-mobile';
import { GoogleGenerativeAI, SchemaType, ArraySchema } from "@google/generative-ai";
import { sampleNote } from '@/data/sampleNotes';
import { useAuth } from '@/lib/auth-context';
import { getConsultation, uploadConsultationAudio, createTranscription, createSummary, updateConsultation } from '@/lib/consultation-service';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Use Vite's environment variables
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const deepgramApiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;

// Define prompts as module-level constants
const DEFAULT_PATIENT_PROMPT = `Create a patient-friendly medical summary based on the transcription of the medical consultation.

IMPORTANT: You should include ONLY information that is explicitly mentioned in the transcription. DO NOT add:
- Additional explanations that the doctor did not provide
- Recommendations that were not mentioned
- Interpretations or reasoning that are not present in the original consultation
- Information about warning signs, unless the doctor specifically mentioned them
- Reminders MUST come directly from the transcription; do not invent or infer tasks.

Your task is to:
1. Extract and organize the information provided directly by the doctor in the consultation for the summary.
2. Present the summary in simple and accessible language for the patient.
3. Extract specific tasks or instructions for the reminders list strictly from the transcription. Each reminder should be a single, clear action mentioned by the doctor. Do not infer or add reminders that were not explicitly stated.
4. Maintain absolute fidelity to the original content of the transcription for both summary and reminders.

If the doctor does not explain something in detail, DO NOT provide additional explanations.

Organize the information in clear sections according to what was discussed in the consultation.

OUTPUT FORMAT:
{
  "patient_summary": "string", // The patient-friendly summary as a single string.
  "reminders": ["string"]      // An array of strings, each representing a single reminder explicitly mentioned in the transcription. Example: ["Schedule follow-up appointment in 3 months", "Take Medication X twice daily for 1 week"]. If no specific reminders are mentioned, return an empty array: [].
}`;

const DEFAULT_MEDICAL_PROMPT = `Generate a professional clinical summary in SOAP format based on the transcription of the medical consultation.
IMPORTANT: Include ONLY information that is explicitly mentioned in the transcription.

Structure the summary using the SOAP format:
- S (Subjective): Information provided by the patient, symptoms, complaints, and history mentioned
- O (Objective): Physical examination findings and test results mentioned in the transcription
- A (Analysis/Assessment): Diagnosis or assessment mentioned by the doctor, without adding additional interpretations
- P (Plan): Treatment plan and recommendations explicitly mentioned by the doctor

Use standard medical terminology and maintain absolute fidelity to the content of the transcription.`;

const DEFAULT_AUGMENTED_MEDICAL_PROMPT = `Act as an expert medical assistant offering a second opinion based on the transcription of a medical consultation.

Your goal is to help the treating physician with:
1. Possible differential diagnoses that could be considered based on the symptoms and findings
2. Suggestions for additional diagnostic tests that might be relevant
3. Alternative or complementary treatment options based on current medical practice
4. References to clinical guidelines or recent scientific evidence relevant to the case
5. Special considerations that might have been overlooked
6. Possible drug interactions or contraindications

You may include your clinical reasoning and detailed explanations to support your suggestions.
Organize your response in clear sections and use professional medical language.

NOTE: This second opinion is for informational purposes only and does not replace the treating physician's clinical judgment.`;

// New prompt for reminders
const DEFAULT_REMINDERS_PROMPT = `Based on the provided medical consultation transcription, extract any specific actions, follow-ups, appointments, medication instructions, or other tasks that the patient needs to remember or perform.

Return the reminders as a JSON array of strings. Each string should represent a single, clear reminder.

Example format:
["Schedule follow-up appointment in 3 months", "Take Medication X twice daily for 1 week", "Get blood tests done before next visit"]

If no specific reminders are mentioned, return an empty array: [].`;

// Define a type for the combined patient summary and reminders output
interface PatientSummaryWithReminders {
  patient_summary: string;
  reminders: string[];
}

// Define the schema for the expected JSON object output for patient summary + reminders
const patientSchema = {
  type: SchemaType.OBJECT,
  properties: {
    patient_summary: { type: SchemaType.STRING },
    reminders: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    }
  },
  required: ['patient_summary', 'reminders']
};

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [isSummarySheetOpen, setIsSummarySheetOpen] = useState(false);
  const [comprehensiveSummary, setComprehensiveSummary] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Parse the consultation ID from the query string
  const queryParams = new URLSearchParams(location.search);
  const consultationId = queryParams.get('consultation');
  
  // If redirected from consultation/new with preserveSearch state, include the original search params
  useEffect(() => {
    if (location.state && location.state.preserveSearch && !location.search) {
      const currentPath = location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      navigate(`${currentPath}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`, { replace: true });
    }
  }, [location, navigate]);
  
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

  useEffect(() => {
    if (!deepgramApiKey || !geminiApiKey) {
      toast({
        title: "API keys not configured",
        description: "The API keys are not configured in environment variables",
        variant: "destructive",
      });
      return;
    }

    const fetchConsultations = async () => {
      setIsLoadingNotes(true);
      
      try {
        // Only proceed if we have a user
        if (!user) {
          // If no user, just show sample note
          setNotes([sampleNote]);
          setIsLoadingNotes(false);
          return;
        }

        // Import cache-enabled service function
        const { getUserConsultations, getTranscription, getSummaries } = await import('@/lib/consultation-service');
        
        // Fetch consultations using the cached service function
        const consultations = await getUserConsultations(user.id);

        if (consultations && consultations.length > 0) {
          // Convert consultations to notes
          const dbNotes: Note[] = [];

          // Process each consultation
          for (const consultation of consultations) {
            try {
              // Get the transcription using cached service
              const transcription = await getTranscription(consultation.id);

              // Get the summaries using cached service
              const summaries = await getSummaries(consultation.id);

              // Convert to Note type
              const note = consultationToNote(consultation, transcription, summaries || []);
              dbNotes.push(note);
            } catch (err) {
              console.error(`Error processing consultation ${consultation.id}:`, err);
            }
          }

          // Add sample note if no consultations were found
          if (dbNotes.length === 0) {
            dbNotes.push(sampleNote);
          }

          setNotes(dbNotes);
        } else {
          // If no consultations in database, just show sample note
          setNotes([sampleNote]);
        }
      } catch (error) {
        console.error('Error fetching consultations:', error);
        toast({
          title: "Error",
          description: "Failed to load consultations",
          variant: "destructive",
        });
        
        // Fallback to sample note
        setNotes([sampleNote]);
      } finally {
        setIsLoadingNotes(false);
      }
    };

    fetchConsultations();
  }, [user, toast, deepgramApiKey, geminiApiKey]);

  useEffect(() => {
    if (notes.length > 0) {
      // Make sure we preserve the sample note when saving to localStorage
      // by filtering out any duplicate before saving
      const notesToSave = notes.filter((note, index, self) => 
        index === self.findIndex(n => n.id === note.id)
      );
      localStorage.setItem('medicalNotes', JSON.stringify(notesToSave));
    }
  }, [notes]);

  const handleRecordComplete = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      let consultationData = consultation;
      
      // If we're recording for a specific consultation from Supabase
      if (consultationId && user && consultation) {
        // First upload the audio file to Supabase
        const fileName = `${user.id}/${consultationId}/audio-${Date.now()}.webm`;
        const audioFile = new File([audioBlob], fileName, { type: 'audio/webm' });
        
        // Upload audio to Supabase
        const { filePath, error } = await uploadConsultationAudio(consultationId, audioFile, user.id);
        
        if (error || !filePath) {
          throw new Error('Failed to upload audio file');
        }
        
        // Update consultation status
        await updateConsultation(consultationId, {
          status: 'transcribing'
        });
        
        // Begin transcription
        const transcript = await transcribeAudio(audioBlob);
        
        // Save transcription to Supabase
        const transcriptionData = {
          consultation_id: consultationId,
          content: transcript,
          provider: 'deepgram'
        };
        
        const transcriptionResult = await createTranscription(transcriptionData);
        
        if (!transcriptionResult) {
          throw new Error('Failed to save transcription');
        }
        
        // Generate and save summaries and reminders
        const patientSummary = await generatePatientSummary(transcript);
        const medicalSummary = await generateMedicalSummary(transcript);
        
        console.log('patientSummary', patientSummary);

        // Save patient summary
        const patientSummaryData = {
          consultation_id: consultationId,
          type: 'patient',
          content: patientSummary.patient_summary,
          provider: 'gemini'
        };
        
        await createSummary(patientSummaryData);
        
        // Save medical summary
        const medicalSummaryData = {
          consultation_id: consultationId,
          type: 'medical',
          content: medicalSummary,
          provider: 'gemini'
        };
        
        await createSummary(medicalSummaryData);
        
        // Save reminders (obtained from patient summary generation)
        const remindersData = {
          consultation_id: consultationId,
          type: 'reminders',
          // Store reminders as a JSON string
          content: JSON.stringify(patientSummary.reminders),
          provider: 'gemini'
        };
        
        await createSummary(remindersData);        
        
        // Generate augmented medical summary
        const augmentedMedicalSummary = await generateAugmentedMedicalSummary(transcript);
        
        // Save augmented medical summary
        const augmentedSummaryData = {
          consultation_id: consultationId,
          type: 'comprehensive',
          content: augmentedMedicalSummary,
          provider: 'gemini'
        };
        
        await createSummary(augmentedSummaryData);
        
        
        // Update consultation status
        await updateConsultation(consultationId, {
          status: 'completed'
        });
        
        // Get updated consultation data
        consultationData = await getConsultation(consultationId);
        setConsultation(consultationData);
        
        // Create a Note object for the UI
        const newNote: Note = {
          id: consultationId,
          title: consultationData?.title || 'Medical Consultation',
          date: consultationData?.created_at || new Date().toISOString(),
          doctorName: consultationData?.doctor_id ? 'Dr. Provider' : undefined,
          location: consultationData?.appointment_location,
          audioBlob: audioBlob,
          transcription: transcript,
          patientSummary: patientSummary.patient_summary,
          medicalSummary: medicalSummary,
          augmentedMedicalSummary: augmentedMedicalSummary,
          reminders: patientSummary.reminders,
        };
        
        setNotes(prev => [newNote, ...prev]);
        
        // Navigate to note detail page
        navigate(`/note/${newNote.id}`);
      } else {
        // Handle the legacy flow when not using Supabase
        const transcript = await transcribeAudio(audioBlob);
        
        const patientSummary = await generatePatientSummary(transcript);
        const medicalSummary = await generateMedicalSummary(transcript);
        const augmentedMedicalSummary = await generateAugmentedMedicalSummary(transcript);
        
        const title = `Consultation ${notes.length + 1}`;
          
        const newNote: Note = {
          id: Date.now().toString(),
          title: title,
          date: new Date().toISOString(),
          audioBlob: audioBlob,
          transcription: transcript,
          patientSummary: patientSummary.patient_summary,
          medicalSummary: medicalSummary,
          augmentedMedicalSummary: augmentedMedicalSummary,
          reminders: patientSummary.reminders,
        };
        
        setNotes(prev => [newNote, ...prev]);
        
        // Navigate to note detail page
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
      
      let consultationData = consultation;
      
      // If we're uploading for a specific consultation from Supabase
      if (consultationId && user && consultation) {
        // First upload the audio file to Supabase
        const fileName = `${user.id}/${consultationId}/audio-${Date.now()}.${file.name.split('.').pop()}`;
        
        // Upload audio to Supabase
        const { filePath, error } = await uploadConsultationAudio(consultationId, file, user.id);
        
        if (error || !filePath) {
          throw new Error('Failed to upload audio file');
        }
        
        // Update consultation status
        await updateConsultation(consultationId, {
          status: 'transcribing'
        });
        
        // Begin transcription
        const transcript = await transcribeAudio(audioBlob);
        
        // Save transcription to Supabase
        const transcriptionData = {
          consultation_id: consultationId,
          content: transcript,
          provider: 'deepgram'
        };
        
        const transcriptionResult = await createTranscription(transcriptionData);
        
        if (!transcriptionResult) {
          throw new Error('Failed to save transcription');
        }
        
        // Generate and save summaries and reminders
        const patientSummary = await generatePatientSummary(transcript);
        const medicalSummary = await generateMedicalSummary(transcript);

        // Save patient summary
        const patientSummaryData = {
          consultation_id: consultationId,
          type: 'patient',
          content: patientSummary.patient_summary,
          provider: 'gemini'
        };
        
        await createSummary(patientSummaryData);
        
        // Save medical summary
        const medicalSummaryData = {
          consultation_id: consultationId,
          type: 'medical',
          content: medicalSummary,
          provider: 'gemini'
        };
        
        await createSummary(medicalSummaryData);      
        
        // Generate augmented medical summary
        const augmentedMedicalSummary = await generateAugmentedMedicalSummary(transcript);
        
        // Save augmented medical summary
        const augmentedSummaryData = {
          consultation_id: consultationId,
          type: 'comprehensive',
          content: augmentedMedicalSummary,
          provider: 'gemini'
        };
        
        await createSummary(augmentedSummaryData);
        
        // Save reminders (obtained from patient summary generation)
        const remindersData = {
          consultation_id: consultationId,
          type: 'reminders',
          // Store reminders as a JSON string
          content: JSON.stringify(patientSummary.reminders),
          provider: 'gemini'
        };
        
        await createSummary(remindersData);
        
        // Update consultation status
        await updateConsultation(consultationId, {
          status: 'completed'
        });
        
        // Get updated consultation data
        consultationData = await getConsultation(consultationId);
        setConsultation(consultationData);
        
        // Create a Note object for the UI
        const newNote: Note = {
          id: consultationId,
          title: consultationData?.title || file.name.replace(/\.[^/.]+$/, "") || 'Medical Consultation',
          date: consultationData?.created_at || new Date().toISOString(),
          doctorName: consultationData?.doctor_id ? 'Dr. Provider' : undefined,
          location: consultationData?.appointment_location,
          audioBlob: audioBlob,
          transcription: transcript,
          patientSummary: patientSummary.patient_summary,
          medicalSummary: medicalSummary,
          augmentedMedicalSummary: augmentedMedicalSummary,
          reminders: patientSummary.reminders,
        };
        
        setNotes(prev => [newNote, ...prev]);
        
        // Navigate to note detail page
        navigate(`/note/${newNote.id}`);
      } else {
        // Handle the legacy flow when not using Supabase
        const transcript = await transcribeAudio(audioBlob);
        
        const patientSummary = await generatePatientSummary(transcript);
        const medicalSummary = await generateMedicalSummary(transcript);
        const augmentedMedicalSummary = await generateAugmentedMedicalSummary(transcript);
        
        const title = file.name.replace(/\.[^/.]+$/, "") || `Consultation ${notes.length + 1}`;
          
        const newNote: Note = {
          id: Date.now().toString(),
          title: title,
          date: new Date().toISOString(),
          audioBlob: audioBlob,
          transcription: transcript,
          patientSummary: patientSummary.patient_summary,
          medicalSummary: medicalSummary,
          augmentedMedicalSummary: augmentedMedicalSummary,
          reminders: patientSummary.reminders,
        };
        
        setNotes(prev => [newNote, ...prev]);
        
        // Navigate to note detail page
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

  const generatePatientSummary = async (text: string): Promise<PatientSummaryWithReminders> => {
    if (!geminiApiKey) {
      console.error("Gemini API key not configured."); // Log error
      toast({ // Add toast for config error
        title: "Configuration Error",
        description: "Gemini API key not configured.",
        variant: "destructive",
      });
      return { patient_summary: "Configuration error: API key missing.", reminders: [] }; // Return default on config error
    }

    const patientPrompt = localStorage.getItem('patientPrompt') || DEFAULT_PATIENT_PROMPT;

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
      });

      const prompt = `${patientPrompt}
                
      Medical consultation transcription:
      ${text}`;
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: patientSchema as any,
        }
      });
      console.log('RESULT MODEL:', result);
      const response = await result.response;
      const responseText = response.text();
      
      if (!responseText) {
          console.error("Gemini API returned an empty response.");
          return { patient_summary: "Could not generate a patient summary.", reminders: [] };
      }
      
      try {
        // Parse the JSON response string into an object
        const summaryData: PatientSummaryWithReminders = JSON.parse(responseText);
        return summaryData;
      } catch (parseError) {
        console.error("Error parsing Gemini API response:", parseError, "Raw response:", responseText);
        // Return a default object if parsing fails
        return { patient_summary: "Error processing summary.", reminders: [] };
      }
    } catch (error) {
      console.error("Error using Gemini API:", error);
      throw new Error("Failed to generate patient summary");
    }
  };

  const generateMedicalSummary = async (text: string): Promise<string> => {
    if (!geminiApiKey) {
      throw new Error("Gemini API key not configured in environment variables");
    }

    const medicalPrompt = localStorage.getItem('medicalPrompt') || DEFAULT_MEDICAL_PROMPT;

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
      });
      
      const prompt = `${medicalPrompt}
                
      Medical consultation transcription:
      ${text}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || "Could not generate a medical summary.";
    } catch (error) {
      console.error("Error using Gemini API:", error);
      throw new Error("Failed to generate medical summary");
    }
  };

  const generateAugmentedMedicalSummary = async (text: string): Promise<string> => {
    if (!geminiApiKey) {
      throw new Error("Gemini API key not configured in environment variables");
    }

    try {
      const augmentedMedicalPrompt = localStorage.getItem('augmentedMedicalPrompt') || DEFAULT_AUGMENTED_MEDICAL_PROMPT;
      
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
      });
      
      const prompt = `${augmentedMedicalPrompt}
                
      Medical consultation transcription:
      ${text}`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text() || "Could not generate an augmented consultation.";
    } catch (error) {
      console.error("Error using Gemini API:", error);
      throw new Error("Failed to generate augmented medical summary");
    }
  };

  const generateReminders = async (text: string): Promise<string[]> => {
    if (!geminiApiKey) {
      throw new Error("Gemini API key not configured in environment variables");
    }

    const remindersPrompt = localStorage.getItem('remindersPrompt') || DEFAULT_REMINDERS_PROMPT;
    const remindersSchema = {
      type: "array",
      items: { type: "string" }
    }

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
      });

      const prompt = `${remindersPrompt}
                
      Medical consultation transcription:
      ${text}`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: remindersSchema as ArraySchema,
        }
      });
      console.log('RESULT MODEL:', result);
      const response = result.response;
      const responseText = response.text();
      
      // Add console log to see the raw response
      console.log('Raw Reminders Response:', responseText);

    } catch (error) {
      console.error("Error using Gemini API:", error);
      throw new Error("Failed to generate reminders");
    }
  };

  const generateComprehensiveSummary = async (selectedSpecialty: string | null, selectedNoteIds: string[]): Promise<string> => {
    if (!geminiApiKey) {
      throw new Error("Gemini API key not configured in environment variables");
    }

    // Get selected notes
    const filteredNotes = notes.filter(note => selectedNoteIds.includes(note.id));
    
    // Include specialty in the system prompt if one is selected
    const systemPrompt = `You are a medical expert specializing in summarizing patient clinical histories${selectedSpecialty ? ` with a focus on ${selectedSpecialty}` : ''}.`;
    
    // Create an array of all medical summaries with metadata
    const summaries = filteredNotes.map(note => {
      // Extract specialization and date
      const specialtyText = note.specialty ? `Specialty: ${note.specialty}` : '';
      const dateText = `Date: ${new Date(note.date).toLocaleDateString()}`;
      const titleText = `Consultation: ${note.title}`;
      
      // Return formatted summary with metadata
      return `
===== ${titleText} =====
${dateText}
${specialtyText ? specialtyText + '\n' : ''}

${note.medicalSummary}
      `;
    }).join("\n\n");

    // Format the comprehensive prompt similar to the Python example
    const comprehensivePrompt = `Here are summaries of various medical consultations for the patient:

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

The response should be a single summarized, well-structured document with markdown formatting that a medical professional can use to quickly understand the patient's complete history.
`;

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      });
      
      const result = await model.generateContent(comprehensivePrompt);
      const response = await result.response;
      return response.text() || "Could not generate a comprehensive medical summary.";
    } catch (error) {
      console.error("Error using Gemini API:", error);
      throw new Error("Failed to generate comprehensive medical summary");
    }
  };

  const handleGenerateComprehensiveSummary = async (selectedSpecialty: string | null, selectedNoteIds: string[]) => {
    setIsGeneratingSummary(true);
    
    try {
      const summary = await generateComprehensiveSummary(selectedSpecialty, selectedNoteIds);
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

  // Format date and time from ISO string
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return { date: 'N/A', time: 'N/A' };
    
    const date = new Date(dateString);
    return {
      date: format(date, 'PPP'), // e.g., April 18, 2025
      time: format(date, 'h:mm a') // e.g., 11:00 AM
    };
  };

  // Render based on context
  if (consultation && !isProcessing) {
    // Extract the formatted date and time
    const { date, time } = formatDateTime(consultation.appointment_date);
    
    // Render the consultation view when coming from appointment
    return (
      <div className="flex flex-col h-screen bg-white">
        {/* Header */}
        <div className="flex items-center px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-bold">Consultation - Initial Data</h1>
        </div>
        
        {/* Main content */}
        <div className="flex-1 overflow-auto py-6 px-6">
          <div className="space-y-6">
            {/* Title and basic info */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold">{consultation.title || "Medical Consultation"}</h2>
            </div>
            
            {/* Appointment details */}
            <Card className="bg-gray-50">
              <CardContent className="p-4 space-y-3">
                {consultation.appointment_date && (
                  <>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                      <span>{date}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-gray-500" />
                      <span>{time}</span>
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
            
            {/* Notes */}
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
        
        {/* Actions */}
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

  // Mobile-friendly Notes page rendering
  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="border-b border-gray-200 bg-white py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary">My Consultations</h1>
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => setIsSummarySheetOpen(true)}
          disabled={notes.length === 0}
        >
          <FileText className="h-4 w-4 mr-2" />
          Summary
        </Button>
      </div>

      <div className="flex-1 overflow-auto pb-20">
        {isProcessing ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-500">Processing your medical consultation...</p>
              <p className="text-xs text-gray-400 mt-2">This may take a minute</p>
            </div>
          </div>
        ) : isLoadingNotes ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-500">Loading your consultations...</p>
            </div>
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">No consultations yet</h3>
            <p className="text-gray-500 mb-6">Record or upload your medical consultations to see them here</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => setIsRecording(true)}>
                <Stethoscope className="h-4 w-4 mr-2" />
                Record Consultation
              </Button>
              <Button variant="outline" onClick={() => setIsUploading(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Audio
              </Button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notes.map((note) => (
              <Card
                key={note.id}
                className="rounded-none border-x-0 border-t-0 last:border-b-0 cursor-pointer hover:bg-gray-50"
                onClick={() => navigate(`/note/${note.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-start">
                        <div className="mr-3 mt-1">
                          <Stethoscope className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{note.title}</h3>
                          
                          {note.doctorName && (
                            <p className="text-sm text-gray-500 mt-1">
                              Dr. {note.doctorName}
                            </p>
                          )}
                          
                          {note.specialty && (
                            <p className="text-sm text-gray-500 mt-1">
                              {note.specialty}
                            </p>
                          )}
                          
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(note.date), { addSuffix: true, locale: es })}
                          </p>
                          
                          {note.diagnosis && (
                            <p className="text-sm text-gray-600 mt-2">
                              <span className="font-medium">Diagnosis:</span> {note.diagnosis}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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

      {/* Audio recorder and uploader */}
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