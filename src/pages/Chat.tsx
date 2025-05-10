import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, Loader2, Stethoscope } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { Note, consultationToNote } from '@/types/Note';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useAuth } from '@/lib/auth-context';
import { 
  getUserConsultations, 
  getTranscription,
  getSummaries
} from '@/lib/consultation-service';

// Use Vite's environment variables
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'system';
  timestamp: Date;
}

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const userEmail = user?.email || 'User';
  const userName = user?.user_metadata?.full_name || userEmail;
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello ${userEmail}, how can I help you today?`,
      sender: 'system',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);

  // Load notes on component mount from Supabase
  useEffect(() => {
    async function fetchChatContextNotes() {
      if (!user) {
        setIsLoadingNotes(false);
        return;
      }
      setIsLoadingNotes(true);
      try {
        const consultationsData = await getUserConsultations(user.id);
        console.log("[ChatPage] Raw consultationsData from Supabase:", consultationsData); // LOG 1

        if (consultationsData && consultationsData.length > 0) {
          const chatNotes: Note[] = [];
          for (const consultation of consultationsData) {
            try {
              const transcription = await getTranscription(consultation.id);
              const summaries = await getSummaries(consultation.id);
              const note = consultationToNote(consultation, transcription, summaries || []); 
              chatNotes.push(note);
            } catch (err) {
              console.error(`Error processing consultation ${consultation.id} for chat context:`, err);
            }
          }
          console.log("[ChatPage] Processed chatNotes before setNotes:", chatNotes); // LOG 2
          setNotes(chatNotes);
        } else {
          console.log("[ChatPage] No consultations found in DB, setting notes to empty array."); // LOG 3
          setNotes([]); 
        }
      } catch (error) {
        console.error('Error fetching notes for chat context:', error);
        toast({
          title: "Error Loading Context",
          description: "Failed to load consultation history for the chat.",
          variant: "destructive",
        });
        setNotes([]); // Clear notes on error
      } finally {
        setIsLoadingNotes(false);
      }
    }

    fetchChatContextNotes();
  }, [user, toast]);

  // Format consultation summaries for context
  const formatConsultationSummaries = (): string => {
    console.log("[ChatPage] formatConsultationSummaries called. isLoadingNotes:", isLoadingNotes, "Current notes state:", notes); // LOG 4
    if (isLoadingNotes) return "Loading consultation history..."; // Show loading message
    if (notes.length === 0) return "No medical consultations have been registered yet.";
    
    // Sort notes from newest to oldest
    const sortedNotes = [...notes].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return sortedNotes.map(note => {
      return `
------- MEDICAL CONSULTATION ${note.date} -------
Doctor: ${note.doctorName || "Not specified"}
Specialty: ${note.specialty || "Not specified"}
Diagnosis: ${note.diagnosis || "Not specified"}
Location: ${note.location || "Not specified"}

MEDICAL SUMMARY:
${note.medicalSummary}

PATIENT SUMMARY:
${note.patientSummary}
      `;
    }).join("\n\n");
  };
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Check if Gemini API key is available from environment variables
    if (!geminiApiKey) {
      toast({
        title: "Gemini API not configured",
        description: "The Gemini API key is not configured in the environment variables",
        variant: "destructive",
      });
      return;
    }
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Format message history for context
      const messageHistory = messages
        .map(msg => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
        .join('\n');
      
      // Prepare consultation summaries
      const consultationSummaries = formatConsultationSummaries();
      console.log('Consultation Summaries for Prompt:', consultationSummaries); // Added log here
      
      // Create the prompt for Gemini
      const prompt = `
You are an AI medical assistant that helps a patient understand their previous medical consultations.
Your name is Harvey. Respond as a professional but friendly medical assistant.
**IMPORTANT: Respond in the same language as the user's last message.**

Patient Information:
- User ID: ${user?.id || 'Not available'}
- Name: ${userName}
- Email: ${userEmail}
      
Below are the records of the patient's previous medical consultations, ordered from most recent to oldest:

${consultationSummaries}

The patient is communicating with you. Help them understand their medical records, treatments, diagnoses,
or any other medical information they might need. If you don't have specific information about something, state it clearly.

The conversation so far:
${messageHistory}

User: ${inputMessage}
Assistant:`;

      // Call Gemini API
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text() || 
        "I'm sorry, I couldn't process your request at this time. Please try again later.";
      
      // Add system response
      const systemMessage: Message = {
        id: Date.now().toString(),
        text: responseText,
        sender: 'system',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      console.error("Error using Gemini API:", error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "I'm sorry, an error occurred while processing your request. Please try again later.",
        sender: 'system',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary flex items-center">
          <Stethoscope className="h-5 w-5 mr-2" />
          Harvey
        </h1>
      </header>

      {/* User info */}
      <div className="border-b border-gray-200 bg-white py-3 px-6">
        <h2 className="text-lg font-medium text-center">Welcome {userEmail}</h2>
        <p className="text-sm text-gray-500 text-center">Chat</p>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[75%] rounded-lg px-4 py-2 ${
                message.sender === 'user' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100'
              }`}
            >
              <p className="whitespace-pre-line">{message.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <p>Typing...</p>
            </div>
          </div>
        )}
      </div>

      {/* Input area - Fixed at bottom above navigation */}
      <div className="fixed bottom-16 left-0 right-0 border-t border-gray-200 bg-white p-4 z-40">
        <div className="flex items-center gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message"
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            size="icon" 
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="rounded-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default Chat; 