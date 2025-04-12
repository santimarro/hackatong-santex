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
  augmentedMedicalSummary?: string;
}
