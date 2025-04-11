import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, Loader2 } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { Note } from '@/types/Note';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'system';
  timestamp: Date;
}

const Chat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hola Juan, ¿en qué puedo ayudarte hoy?',
      sender: 'system',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);

  // Load notes on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('medicalNotes');
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes);
        setNotes(parsedNotes);
      } catch (e) {
        console.error("Error parsing saved notes:", e);
      }
    }
  }, []);

  // Format consultation summaries for context
  const formatConsultationSummaries = (): string => {
    if (notes.length === 0) return "No hay consultas médicas previas registradas.";
    
    // Sort notes from newest to oldest
    const sortedNotes = [...notes].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return sortedNotes.map(note => {
      return `
------- CONSULTA MÉDICA ${note.date} -------
Doctor: ${note.doctorName || "No especificado"}
Especialidad: ${note.specialty || "No especificada"}
Diagnóstico: ${note.diagnosis || "No especificado"}
Lugar: ${note.location || "No especificado"}

RESUMEN MÉDICO:
${note.medicalSummary}

RESUMEN PARA PACIENTE:
${note.patientSummary}
      `;
    }).join("\n\n");
  };
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Check if Gemini API key is available
    const geminiApiKey = localStorage.getItem('geminiApiKey');
    if (!geminiApiKey) {
      toast({
        title: "Falta clave API de Gemini",
        description: "Por favor configura tu clave API primero",
        variant: "destructive",
      });
      navigate('/setup');
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
        .map(msg => `${msg.sender === 'user' ? 'Usuario' : 'Asistente'}: ${msg.text}`)
        .join('\n');
      
      // Prepare consultation summaries
      const consultationSummaries = formatConsultationSummaries();
      
      // Create the prompt for Gemini
      const prompt = `
Eres un asistente médico AI que ayuda a un paciente a comprender sus consultas médicas previas.
Tu nombre es MedAssist. Responde como un asistente médico profesional pero amigable.

Información del paciente:
- Nombre: Juan Pérez
- ID del paciente: #12345
      
A continuación se encuentran los registros de las consultas médicas previas del paciente, ordenadas desde la más reciente a la más antigua:

${consultationSummaries}

El paciente se está comunicando contigo. Ayúdale a entender sus registros médicos, tratamientos, diagnósticos,
o cualquier otra información médica que necesite. Si no tienes información específica sobre algo, indícalo claramente.

La conversación hasta ahora:
${messageHistory}

Usuario: ${inputMessage}
Asistente:`;

      // Call Gemini API
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
      });
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text() || 
        "Lo siento, no pude procesar tu solicitud en este momento. Por favor, intenta de nuevo más tarde.";
      
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
        text: "Lo siento, ocurrió un error al procesar tu solicitud. Por favor, intenta de nuevo más tarde.",
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
      <header className="border-b border-gray-200 bg-white py-4 px-6">
        <h1 className="text-xl font-bold text-center">Bienvenido Juan Perez</h1>
        <h2 className="text-lg font-medium text-center">Chat</h2>
      </header>

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
              <p>Escribiendo...</p>
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
            placeholder="Escribe un mensaje"
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