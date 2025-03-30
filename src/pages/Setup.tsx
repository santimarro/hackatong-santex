
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { Mic, Upload, ArrowRight } from "lucide-react";

const Setup = () => {
  const [deepgramApiKey, setDeepgramApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if API keys are already stored
  useEffect(() => {
    const storedDeepgramKey = localStorage.getItem('deepgramApiKey');
    const storedGeminiKey = localStorage.getItem('geminiApiKey');
    
    if (storedDeepgramKey && storedGeminiKey) {
      setDeepgramApiKey(storedDeepgramKey);
      setGeminiApiKey(storedGeminiKey);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);

    // Basic validation - check for non-empty keys
    if (!deepgramApiKey.trim() || !geminiApiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter both API keys",
        variant: "destructive",
      });
      setIsValidating(false);
      return;
    }

    // Store API keys in localStorage
    localStorage.setItem('deepgramApiKey', deepgramApiKey);
    localStorage.setItem('geminiApiKey', geminiApiKey);

    toast({
      title: "Success",
      description: "API keys saved successfully",
    });

    setIsValidating(false);
    navigate('/notes');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-light to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Audio Note Magic</CardTitle>
          <CardDescription className="text-center">
            Enter your API keys to get started with transcription and summarization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="deepgramApiKey">Deepgram API Key</Label>
              <Input
                id="deepgramApiKey"
                type="password"
                placeholder="Enter your Deepgram API key"
                value={deepgramApiKey}
                onChange={(e) => setDeepgramApiKey(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Get a key from <a href="https://console.deepgram.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Deepgram Console</a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="geminiApiKey">Gemini API Key</Label>
              <Input
                id="geminiApiKey"
                type="password"
                placeholder="Enter your Gemini API key"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Get a key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>
              </p>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} disabled={isValidating} className="w-full">
            {isValidating ? "Validating..." : "Continue to App"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
        <div className="flex justify-center items-center pb-6 gap-8">
          <div className="flex flex-col items-center">
            <div className="bg-primary-light p-3 rounded-full">
              <Mic className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs mt-2">Record Audio</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-primary-light p-3 rounded-full">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs mt-2">Upload Audio</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Setup;
