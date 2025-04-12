import React, { useState, useEffect } from 'react';
import { Note } from '@/types/Note';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Copy, Edit, Save, Play, Pause, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TranscriptionViewProps {
  note: Note;
  onUpdateNote?: (updatedNote: Note) => void;
}

const TranscriptionView: React.FC<TranscriptionViewProps> = ({ note, onUpdateNote }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [doctorName, setDoctorName] = useState(note.doctorName || '');
  const [specialty, setSpecialty] = useState(note.specialty || '');
  const [location, setLocation] = useState(note.location || '');
  const [diagnosis, setDiagnosis] = useState(note.diagnosis || '');
  const [treatment, setTreatment] = useState(note.treatment || '');
  const [followUp, setFollowUp] = useState(note.followUp || '');
  const [transcription, setTranscription] = useState(note.transcription);
  const [symptoms, setSymptoms] = useState<string[]>(note.symptoms || []);
  const [newSymptom, setNewSymptom] = useState('');
  const [questions, setQuestions] = useState<string[]>(note.questions || []);
  const [newQuestion, setNewQuestion] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Create object URL when component mounts or when note changes
  useEffect(() => {
    // Check if audioBlob exists and is valid before creating an object URL
    if (note.audioBlob && note.audioBlob instanceof Blob && note.audioBlob.size > 0) {
      const url = URL.createObjectURL(note.audioBlob);
      setAudioUrl(url);
      
      // Clean up the URL when component unmounts
      return () => {
        if (url) URL.revokeObjectURL(url);
      };
    } else {
      console.warn("Audio blob inválido o faltante para la nota:", note.id);
    }
  }, [note]);

  const handleSave = () => {
    if (onUpdateNote) {
      const updatedNote = {
        ...note,
        title,
        doctorName,
        specialty,
        location,
        diagnosis,
        treatment,
        followUp,
        symptoms,
        questions,
        transcription
      };
      onUpdateNote(updatedNote);
    }
    
    setIsEditing(false);
    toast({
      title: "Guardado",
      description: "Información de la consulta actualizada",
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcription);
    toast({
      title: "Copiado",
      description: "Transcripción copiada al portapapeles",
    });
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const addSymptom = () => {
    if (newSymptom.trim()) {
      setSymptoms([...symptoms, newSymptom.trim()]);
      setNewSymptom('');
    }
  };

  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setQuestions([...questions, newQuestion.trim()]);
      setNewQuestion('');
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="max-w-xs"
              placeholder="Título de la consulta"
            />
            <Button size="sm" onClick={handleSave} className="bg-secondary hover:bg-secondary/90">
              <Save className="h-4 w-4 mr-1" />
              Guardar
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-primary">{title}</h2>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={togglePlayPause}
            disabled={!audioUrl}
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-1" />
                Pausar
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Reproducir
              </>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="doctorName">Nombre del médico</Label>
              <Input
                id="doctorName"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Dr. Apellido"
              />
            </div>
            
            <div>
              <Label htmlFor="specialty">Especialidad</Label>
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger id="specialty">
                  <SelectValue placeholder="Seleccionar especialidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medicina-general">Medicina General</SelectItem>
                  <SelectItem value="cardiologia">Cardiología</SelectItem>
                  <SelectItem value="dermatologia">Dermatología</SelectItem>
                  <SelectItem value="gastroenterologia">Gastroenterología</SelectItem>
                  <SelectItem value="neurologia">Neurología</SelectItem>
                  <SelectItem value="obstetricia">Obstetricia y Ginecología</SelectItem>
                  <SelectItem value="oftalmologia">Oftalmología</SelectItem>
                  <SelectItem value="ortopedia">Ortopedia</SelectItem>
                  <SelectItem value="pediatria">Pediatría</SelectItem>
                  <SelectItem value="psiquiatria">Psiquiatría</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Hospital / Clínica"
              />
            </div>
            
            <div>
              <Label htmlFor="diagnosis">Diagnóstico</Label>
              <Input
                id="diagnosis"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Diagnóstico principal"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="treatment">Tratamiento</Label>
              <Textarea
                id="treatment"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                placeholder="Medicamentos, dosis, duración..."
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="followUp">Seguimiento</Label>
              <Input
                id="followUp"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                placeholder="Próxima cita / estudios"
              />
            </div>
            
            <div>
              <Label>Síntomas</Label>
              <div className="flex space-x-2 mb-2">
                <Input
                  value={newSymptom}
                  onChange={(e) => setNewSymptom(e.target.value)}
                  placeholder="Agregar síntoma"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSymptom();
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={addSymptom}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {symptoms.map((symptom, index) => (
                  <div key={index} className="bg-primary-light text-primary text-sm py-1 px-2 rounded-full flex items-center">
                    {symptom}
                    <button
                      onClick={() => removeSymptom(index)}
                      className="ml-1 text-primary hover:text-primary-dark"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label>Preguntas para próxima consulta</Label>
              <div className="flex space-x-2 mb-2">
                <Input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Agregar pregunta"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addQuestion();
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={addQuestion}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-1">
                {questions.map((question, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 text-sm py-1 px-2 rounded">
                    <span>{question}</span>
                    <button
                      onClick={() => removeQuestion(index)}
                      className="text-gray-500 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Card className="mb-4">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              {doctorName && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Médico</h4>
                  <p>{doctorName}</p>
                </div>
              )}
              
              {specialty && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Especialidad</h4>
                  <p>{specialty}</p>
                </div>
              )}
              
              {location && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Ubicación</h4>
                  <p>{location}</p>
                </div>
              )}
              
              {diagnosis && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Diagnóstico</h4>
                  <p>{diagnosis}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              {treatment && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Tratamiento</h4>
                  <p className="whitespace-pre-wrap">{treatment}</p>
                </div>
              )}
              
              {followUp && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Seguimiento</h4>
                  <p>{followUp}</p>
                </div>
              )}
              
              {symptoms && symptoms.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Síntomas</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {symptoms.map((symptom, index) => (
                      <span key={index} className="bg-primary-light text-primary text-xs py-0.5 px-2 rounded-full">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {questions && questions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Preguntas pendientes</h4>
                  <ul className="list-disc list-inside text-sm">
                    {questions.map((question, index) => (
                      <li key={index}>{question}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">Transcripción de la consulta</h3>
          {isEditing ? (
            <textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              className="w-full h-96 p-2 border border-gray-200 rounded-md"
            ></textarea>
          ) : (
            <div className="whitespace-pre-wrap">{transcription}</div>
          )}
        </CardContent>
      </Card>
      
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onEnded={handleAudioEnded}
          className="hidden"
        />
      )}
    </div>
  );
};

export default TranscriptionView;
