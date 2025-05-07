export interface AudioFile {
  id: string;
  path: string;
  name: string;
  currentTime?: number;
}

export interface Book {
  id: string;
  title: string;
  cover?: string | null; // URL for the cover image
  coverFile?: File | null; // Adding this to handle file uploads
  audioFiles: AudioFile[];
  currentFileIndex: number;
}
