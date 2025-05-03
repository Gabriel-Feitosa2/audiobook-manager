import Dexie, { Table } from 'dexie';
import { Book, AudioFile } from '@/types/book';

// Define a new interface for storing audio files in IndexedDB
export interface StoredAudioFile {
  id: string;
  name: string;
  size: number;
  data: ArrayBuffer;
}

// Interface for loose audio files (not attached to books)
export interface StoredLooseAudio {
  id: string;
  name: string;
  size: number;
  data: ArrayBuffer;
  currentTime?: number; // Store playback position for loose audio files
}

// Modified BookStore interface to avoid file property in storage
export interface StoredBook extends Omit<Book, 'audioFiles' | 'coverFile'> {
  audioFiles: {
    id: string;
    name: string; 
    size: number;
    currentTime?: number; // Store playback position for each audio file
  }[];
}

export interface AudiobookDatabase extends Dexie {
  books: Table<StoredBook>;
  audioFiles: Table<StoredAudioFile>;
  looseAudios: Table<StoredLooseAudio>;
  settings: Table<{ 
    id: string; 
    selectedBookId: string | null; 
    currentFileIndex: number;
    currentPlaybackTime: number; // Added to store current playback time
  }>;
}

class AudiobookDatabaseService {
  private db: AudiobookDatabase;

  constructor() {
    this.db = new Dexie('AudiobookDatabase') as AudiobookDatabase;
    this.db.version(2).stores({
      books: 'id, title', // Book data without actual audio files
      audioFiles: 'id, name', // Audio files with book association
      looseAudios: 'id, name', // Audio files not associated with books
      settings: 'id' // General settings like selected book, current track, etc.
    });
  }

  // Books operations
  async saveBook(book: Book, audioFileBlobs?: { id: string, file: File }[]): Promise<string> {
    // First save the book without audio files - we create a book object that matches our StoredBook interface
    const bookToSave: StoredBook = {
      id: book.id,
      title: book.title,
      cover: book.cover,
      audioFiles: book.audioFiles.map(af => ({ 
        id: af.id, 
        name: af.name, 
        size: af.size,
        currentTime: af.currentTime // Save the playback position for each file
      })),
      currentFileIndex: book.currentFileIndex
    };
    
    await this.db.books.put(bookToSave);
    
    // Then save each audio file separately if provided
    if (audioFileBlobs && audioFileBlobs.length > 0) {
      for (const { id, file } of audioFileBlobs) {
        await this.db.audioFiles.put({
          id,
          name: file.name,
          size: file.size,
          data: await file.arrayBuffer()
        });
      }
    }
    
    return book.id;
  }
  
  // Updated to also include currentTime in the returned book
  async getAllBooks(): Promise<Book[]> {
    const books = await this.db.books.toArray();
    return books.map(book => ({
      ...book,
      audioFiles: book.audioFiles.map(af => ({
        ...af,
        file: new File([], af.name), // Placeholder file, will be filled later when needed
        currentTime: af.currentTime || 0
      })),
      coverFile: null, // Add null coverFile as it's not stored in the database
    }));
  }
  
  // Updated to also include currentTime in the returned book
  async getBook(id: string): Promise<Book | undefined> {
    const book = await this.db.books.get(id);
    if (!book) return undefined;
    
    return {
      ...book,
      audioFiles: book.audioFiles.map(af => ({
        ...af,
        file: new File([], af.name), // Placeholder file, will be filled later when needed
        currentTime: af.currentTime || 0
      })),
      coverFile: null, // Add null coverFile as it's not stored in the database
    };
  }
  
  async deleteBook(id: string): Promise<void> {
    // Get the book to find its audio file IDs
    const book = await this.db.books.get(id);
    if (book) {
      // Delete the book
      await this.db.books.delete(id);
      
      // Delete associated audio files
      if (book.audioFiles && book.audioFiles.length > 0) {
        const audioIds = book.audioFiles.map(af => af.id);
        await Promise.all(audioIds.map(id => this.db.audioFiles.delete(id)));
      }
    }
  }
  
  // Audio file operations
  async getAudioFile(id: string): Promise<File | null> {
    const storedFile = await this.db.audioFiles.get(id);
    if (!storedFile) return null;
    
    return new File([storedFile.data], storedFile.name);
  }
  
  // Update current time for a specific audio file in a book
  async updateAudioFileTime(bookId: string, fileId: string, currentTime: number): Promise<void> {
    const book = await this.db.books.get(bookId);
    if (book) {
      const updatedAudioFiles = book.audioFiles.map(af => 
        af.id === fileId ? { ...af, currentTime } : af
      );
      
      await this.db.books.update(bookId, { audioFiles: updatedAudioFiles });
    }
  }
  
  // Update current time for a loose audio file
  async updateLooseAudioTime(fileId: string, currentTime: number): Promise<void> {
    await this.db.looseAudios.update(fileId, { currentTime });
  }
  
  // Loose audio operations (not associated with a book)
  async saveLooseAudio(audioFile: AudioFile): Promise<void> {
    const buffer = await audioFile.file.arrayBuffer();
    await this.db.looseAudios.put({
      id: audioFile.id,
      name: audioFile.name,
      size: audioFile.size,
      data: buffer,
      currentTime: audioFile.currentTime || 0
    });
  }
  
  async getAllLooseAudios(): Promise<AudioFile[]> {
    const looseAudios = await this.db.looseAudios.toArray();
    
    return await Promise.all(
      looseAudios.map(async (audio) => ({
        id: audio.id,
        name: audio.name,
        size: audio.size,
        file: new File([audio.data], audio.name),
        currentTime: audio.currentTime || 0
      }))
    );
  }
  
  async deleteLooseAudio(id: string): Promise<void> {
    await this.db.looseAudios.delete(id);
  }
  
  // Settings
  async saveSettings(selectedBookId: string | null, currentFileIndex: number, currentPlaybackTime: number = 0): Promise<void> {
    await this.db.settings.put({
      id: 'app-settings',
      selectedBookId,
      currentFileIndex,
      currentPlaybackTime
    });
  }
  
  async getSettings(): Promise<{ selectedBookId: string | null, currentFileIndex: number, currentPlaybackTime: number } | null> {
    const settings = await this.db.settings.get('app-settings');
    if (!settings) return null;
    return {
      selectedBookId: settings.selectedBookId,
      currentFileIndex: settings.currentFileIndex,
      currentPlaybackTime: settings.currentPlaybackTime || 0
    };
  }
}

export const databaseService = new AudiobookDatabaseService();
