import { AudioFile, Book } from "./book";

declare global {
  interface Window {
    electronAPI: {
      selectFile: () => Promise<{ path: string; content: string } | null>;
      selectAudio: () => Promise<{ path: string; name: string }[] | null>;
      getAllBooks: () => Promise<Book[]>;
      saveBook: (
        book: Book,
        filePaths?: { path: string; name: string }[]
      ) => Promise<void>;
      deleteBook: (bookId: string) => Promise<void>;
      getAudioFilePath: (
        id: string
      ) => Promise<{ filePath: string; name: string } | null>;
      getAllLooseAudios: () => Promise<AudioFile[]>;

      updateAudioCurrentTime: (
        id: string,
        currentTime: number,
        isLoose: boolean
      ) => Promise<void>;

      getSettings: () => Promise<{
        selectedBookId: string | null;
        currentFileIndex: number;
        currentPlaybackTime: number;
      } | null>;
      saveSettings: (settings: {
        selectedBookId: string;
        currentFileIndex: number;
        currentPlaybackTime: number;
      }) => Promise<void>;
    };
  }
}
