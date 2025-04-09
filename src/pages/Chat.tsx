
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SendHorizonal, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import BottomNavigation from '@/components/BottomNavigation';

const Chat = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "¡Hola! Soy tu asistente médico virtual. ¿En qué puedo ayudarte hoy?", isBot: true },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const navigate = useNavigate();

  const handleSendMessage = () => {
    if (newMessage.trim() === "") return;

    // Add user message
    const userMessage = { id: Date.now(), text: newMessage, isBot: false };
    setMessages(prev => [...prev, userMessage]);
    setNewMessage("");

    // Simulate bot response
    setTimeout(() => {
      const botMessage = { 
        id: Date.now() + 1, 
        text: "Esta es una simulación de asistente. En una versión completa, responderé preguntas sobre tus consultas médicas y recordatorios.", 
        isBot: true 
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold">Asistente</h1>
      </header>

      <main className="flex-1 p-4 pb-20 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 pr-2">
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
              >
                <div 
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.isBot 
                      ? "bg-gray-100 text-gray-800" 
                      : "bg-indigo-500 text-white"
                  }`}
                >
                  {message.isBot && (
                    <div className="flex items-center mb-1 text-indigo-600">
                      <Bot className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">MediBot</span>
                    </div>
                  )}
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-4 flex gap-2">
          <Input 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
            <SendHorizonal className="h-5 w-5" />
          </Button>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default Chat;
