import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Stethoscope, Upload, ArrowRight, Settings } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Setup = () => {
  const [deepgramApiKey, setDeepgramApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [patientPrompt, setPatientPrompt] = useState('');
  const [medicalPrompt, setMedicalPrompt] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [activeTab, setActiveTab] = useState("apiKeys");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Default system prompts
  const defaultPatientPrompt = `Create a patient-friendly medical summary from the medical consultation transcription.
Include:
- Simple explanation of the diagnosis and what it means
- Treatment steps explained in plain language
- Warning signs that require medical attention
- When to schedule follow-up
- Lifestyle recommendations
- Answers to common questions

Use simple language, avoid medical jargon, and organize information in clear, easy-to-understand sections.`;

  const defaultMedicalPrompt = `Generate a professional clinical summary from the medical consultation transcription.
Include:
- Patient demographic data
- Relevant medical history
- Physical examination and findings
- Test results and interpretation
- Differential diagnosis and justification
- Treatment plan with specific dosage
- Follow-up recommendations with timeframes
- Special considerations

Use standard medical terminology, be concise but comprehensive, and structure the summary in SOAP format when possible.`;

  // Check if API keys and prompts are already stored
  useEffect(() => {
    const storedDeepgramKey = localStorage.getItem('deepgramApiKey');
    const storedGeminiKey = localStorage.getItem('geminiApiKey');
    const storedPatientPrompt = localStorage.getItem('patientPrompt');
    const storedMedicalPrompt = localStorage.getItem('medicalPrompt');
    
    if (storedDeepgramKey && storedGeminiKey) {
      setDeepgramApiKey(storedDeepgramKey);
      setGeminiApiKey(storedGeminiKey);
    }

    if (storedPatientPrompt) {
      setPatientPrompt(storedPatientPrompt);
    } else {
      setPatientPrompt(defaultPatientPrompt);
    }
    
    if (storedMedicalPrompt) {
      setMedicalPrompt(storedMedicalPrompt);
    } else {
      setMedicalPrompt(defaultMedicalPrompt);
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

    // Store API keys and system prompts in localStorage
    localStorage.setItem('deepgramApiKey', deepgramApiKey);
    localStorage.setItem('geminiApiKey', geminiApiKey);
    
    // Store prompts if they're not empty, otherwise use the defaults
    if (patientPrompt.trim()) {
      localStorage.setItem('patientPrompt', patientPrompt);
    } else {
      localStorage.setItem('patientPrompt', defaultPatientPrompt);
      setPatientPrompt(defaultPatientPrompt);
    }
    
    if (medicalPrompt.trim()) {
      localStorage.setItem('medicalPrompt', medicalPrompt);
    } else {
      localStorage.setItem('medicalPrompt', defaultMedicalPrompt);
      setMedicalPrompt(defaultMedicalPrompt);
    }

    toast({
      title: "Success",
      description: "Configuration saved successfully",
    });

    setIsValidating(false);
    navigate('/notes');
  };

  const handleResetPatientPrompt = () => {
    setPatientPrompt(defaultPatientPrompt);
    toast({
      title: "Reset",
      description: "Patient instructions restored",
    });
  };
  
  const handleResetMedicalPrompt = () => {
    setMedicalPrompt(defaultMedicalPrompt);
    toast({
      title: "Reset",
      description: "Medical instructions restored",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-light to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-primary">Harvey</CardTitle>
          <CardDescription className="text-center">
            Take control of your medical consultations
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
                    Get a key at <a href="https://console.deepgram.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Deepgram Console</a>
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
                    Get a key at <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google AI Studio</a>
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
                    <Label htmlFor="patientPrompt">Patient summary instructions</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleResetPatientPrompt}
                      className="text-xs h-7"
                    >
                      Reset
                    </Button>
                  </div>
                  <Textarea
                    id="patientPrompt"
                    placeholder="Instructions for patient-oriented summary"
                    value={patientPrompt}
                    onChange={(e) => setPatientPrompt(e.target.value)}
                    className="min-h-[150px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Customize how patient summaries are generated
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="medicalPrompt">Medical summary instructions</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleResetMedicalPrompt}
                      className="text-xs h-7"
                    >
                      Reset
                    </Button>
                  </div>
                  <Textarea
                    id="medicalPrompt"
                    placeholder="Instructions for healthcare professional-oriented summary"
                    value={medicalPrompt}
                    onChange={(e) => setMedicalPrompt(e.target.value)}
                    className="min-h-[150px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Customize how technical summaries for healthcare professionals are generated
                  </p>
                </div>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
        <CardFooter>
          <Button onClick={handleSubmit} disabled={isValidating} className="w-full">
            {isValidating ? "Validating..." : "Continue to my medical notes"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
        <div className="flex justify-center items-center pb-6 gap-8">
          <div className="flex flex-col items-center">
            <div className="bg-primary-light p-3 rounded-full">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs mt-2">Record consultation</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-primary-light p-3 rounded-full">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xs mt-2">Upload audio</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Setup;
