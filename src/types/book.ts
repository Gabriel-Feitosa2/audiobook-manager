
export interface AudioFile {
  id: string;
  file: File;
  name: string;
  size: number;
  currentTime?: number; // Add current time for playback position
}

export interface Book {
  id: string;
  title: string;
  cover?: string | null; // URL for the cover image
  coverFile?: File | null; // Adding this to handle file uploads
  audioFiles: AudioFile[];
  currentFileIndex: number;
}
