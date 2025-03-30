
export interface Note {
  id: string;
  title: string;
  date: string;
  audioBlob: Blob;
  transcription: string;
  summary: string;
}
