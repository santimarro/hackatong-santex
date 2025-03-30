
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Note } from '@/types/Note';
import { cn } from '@/lib/utils';

interface NotesListProps {
  notes: Note[];
  selectedNote: Note | null;
  onSelectNote: (note: Note) => void;
}

const NotesList: React.FC<NotesListProps> = ({ notes, selectedNote, onSelectNote }) => {
  if (notes.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No hay notas todavía</p>
        <p className="text-sm mt-1">Graba o sube un archivo de audio</p>
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
          <h3 className="font-medium truncate">{note.title}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {formatDistanceToNow(new Date(note.date), { addSuffix: true })}
          </p>
          <p className="text-xs text-gray-500 mt-1 truncate">
            {note.transcription.substring(0, 60)}...
          </p>
        </div>
      ))}
    </div>
  );
};

export default NotesList;
