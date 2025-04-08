
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Note } from '@/types/Note';
import { cn } from '@/lib/utils';
import { Stethoscope } from 'lucide-react';

interface NotesListProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
}

const NotesList: React.FC<NotesListProps> = ({ notes, selectedNote, onSelectNote }) => {
  if (notes.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No hay notas médicas todavía</p>
        <p className="text-sm mt-1">Graba o sube una consulta médica</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {notes.map((note) => (
        <div
          key={note.id}
          className={cn(
            "px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors",
            selectedNote?.id === note.id ? "bg-primary-light" : ""
          )}
          onClick={() => onSelectNote(note)}
        >
          <div className="flex items-start">
            <div className="mr-2 text-primary">
              <Stethoscope className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium truncate">{note.title}</h3>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <span>{formatDistanceToNow(new Date(note.date), { addSuffix: true, locale: es })}</span>
                {note.specialty && (
                  <>
                    <span className="mx-1">•</span>
                    <span>{note.specialty}</span>
                  </>
                )}
              </div>
              {note.diagnosis && (
                <p className="text-xs text-gray-700 mt-1 truncate">
                  Diagnóstico: {note.diagnosis}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1 truncate">
                {note.transcription.substring(0, 60)}...
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotesList;
