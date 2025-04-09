
export interface Note {
  id: string;
  title: string;
  date: string;
  doctorName?: string;
  specialty?: string;
  location?: string;
  symptoms?: string[];
  diagnosis?: string;
  treatment?: string;
  followUp?: string;
  questions?: string[];
  audioBlob: Blob;
  transcription: string;
  patientSummary: string;
  medicalSummary: string;
  files?: File[];
  institution?: string;
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  location?: string;
  notes?: string;
}
