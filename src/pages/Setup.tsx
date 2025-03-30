
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mic, Upload, ArrowRight, Settings } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Setup = () => {
  const [deepgramApiKey, setDeepgramApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [activeTab, setActiveTab] = useState("apiKeys");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Default system prompt
  const defaultSystemPrompt = `Create a study summary of the following Spanish text. Include key points, main topics, and important concepts to review.
Format the output with clear sections, bullet points, and emphasize important terms.`;

  // Check if API keys and prompt are already stored
  useEffect(() => {
    const storedDeepgramKey = localStorage.getItem('deepgramApiKey');
    const storedGeminiKey = localStorage.getItem('geminiApiKey');
    const storedSystemPrompt = localStorage.getItem('systemPrompt');
    
    if (storedDeepgramKey && storedGeminiKey) {
      setDeepgramApiKey(storedDeepgramKey);
      setGeminiApiKey(storedGeminiKey);
    }

    if (storedSystemPrompt) {
      setSystemPrompt(storedSystemPrompt);
    } else {
      setSystemPrompt(defaultSystemPrompt);
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

    // Store API keys and system prompt in localStorage
    localStorage.setItem('deepgramApiKey', deepgramApiKey);
    localStorage.setItem('geminiApiKey', geminiApiKey);
    
    // Store system prompt if it's not empty, otherwise use the default
    if (systemPrompt.trim()) {
      localStorage.setItem('systemPrompt', systemPrompt);
    } else {
      localStorage.setItem('systemPrompt', defaultSystemPrompt);
      setSystemPrompt(defaultSystemPrompt);
    }

    toast({
      title: "Success",
      description: "Settings saved successfully",
    });

    setIsValidating(false);
    navigate('/notes');
  };

  const handleResetPrompt = () => {
    setSystemPrompt(defaultSystemPrompt);
    toast({
      title: "Reset",
      description: "System prompt reset to default",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-light to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Audio Note Magic</CardTitle>
          <CardDescription className="text-center">
            Configure your application settings
          </CardDescription>
        </CardHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="apiKeys">API Keys</TabsTrigger>
            <TabsTrigger value="aiSettings">AI Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="apiKeys" className="space-y-4">
            <CardContent>
              <form className="space-y-6">
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
          </TabsContent>
          
          <TabsContent value="aiSettings" className="space-y-4">
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="systemPrompt">Gemini System Prompt</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleResetPrompt}
                      className="text-xs h-7"
                    >
                      Reset to Default
                    </Button>
                  </div>
                  <Textarea
                    id="systemPrompt"
                    placeholder="Enter instructions for Gemini AI"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="min-h-[150px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Customize how Gemini summarizes your transcribed text
                  </p>
                </div>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
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
