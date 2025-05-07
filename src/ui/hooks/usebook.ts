import { useCallback, useRef } from "react";
import { Book } from "../types/book";
import {
  audioFilesAtom,
  audioProgressAtom,
  booksAtom,
  currentFileIndexAtom,
  currentTimeAtom,
  durationAtom,
  isPlayingAtom,
  selectedBookIdAtom,
  selectFileIdAtom,
} from "../atom/books";
import { useAtom, useSetAtom } from "jotai";
import { databaseService } from "../services/database";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/ui/hooks/use-toast";
import { activeTabAtom } from "../atom/ui";

export function useAudiobooks() {
  const [books, setBooks] = useAtom(booksAtom);
  const [selectedBookId, setSelectedBookId] = useAtom(selectedBookIdAtom);
  const [audioFiles, setAudioFiles] = useAtom(audioFilesAtom);
  const [currentTime, setCurrentTime] = useAtom(currentTimeAtom);
  const setAudioProgress = useSetAtom(audioProgressAtom);
  const setDuration = useSetAtom(durationAtom);
  const [currentFileIndex, setCurrentFileIndex] = useAtom(currentFileIndexAtom);
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);
  const setActiveTab = useSetAtom(activeTabAtom);
  const setSelectFileId = useSetAtom(selectFileIdAtom);

  const { toast } = useToast();

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioUrlRef = useRef<string | null>(null);

  const currentBook = selectedBookId
    ? books.find((book) => book.id === selectedBookId)
    : null;
  const currentBookFiles = currentBook ? currentBook.audioFiles : audioFiles;

  const handleCreateBook = useCallback(
    async (book: Book) => {
      try {
        setBooks((prev) => [...prev, book]);
        setSelectedBookId(book.id);

        await window.electronAPI.saveBook(book);
      } catch (error) {
        console.error("Erro ao buscar audiobooks:", error);
      }
    },
    [setBooks]
  );

  const handleDeleteBook = useCallback(
    async (bookId: string) => {
      setBooks((prev) => prev.filter((book) => book.id !== bookId));

      await window.electronAPI.deleteBook(bookId);
    },
    [setBooks]
  );

  const loadAudio = async (index: number, bookId?: string) => {
    console.log("teste");
    // Clean up previous object URL if any
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
    }

    const files =
      bookId && bookId !== "no-selection"
        ? books.find((b) => b.id === bookId)?.audioFiles || []
        : audioFiles;

    const audioFile = files[index];
    if (!audioFile) return;

    let file = audioFile.path;

    // If we're selecting a book track, we need to load the actual file data
    if (bookId && bookId !== "no-selection") {
      const actualFile = await window.electronAPI.getAudioFilePath(
        audioFile.id
      );

      if (actualFile) {
        file = actualFile.filePath;
        // Update our in-memory representation
        setBooks((prev) =>
          prev.map((book) => {
            if (book.id === bookId) {
              const updatedAudioFiles = [...book.audioFiles];
              updatedAudioFiles[index] = {
                ...updatedAudioFiles[index],
              };
              return {
                ...book,
                audioFiles: updatedAudioFiles,
              };
            }
            return book;
          })
        );
      }
    }

    const audioUrl = `file://${file}`;
    audioUrlRef.current = audioUrl;

    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.load();

      // Set up audio event listeners
      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);

          // Set the current time to the saved position if it exists
          const savedTime = audioFile.currentTime || 0;
          if (savedTime > 0) {
            audioRef.current.currentTime = savedTime;
            setCurrentTime(savedTime);
            setAudioProgress((savedTime / audioRef.current.duration) * 100);
          } else {
            setCurrentTime(0);
            setAudioProgress(0);
          }
        }
      };
    }

    setCurrentFileIndex(index);

    // Update current file index in book if needed
    if (bookId && bookId !== "no-selection") {
      setBooks((prev) =>
        prev.map((book) => {
          if (book.id === bookId) {
            const updatedBook = { ...book, currentFileIndex: index };
            databaseService.saveBook(updatedBook);
            return updatedBook;
          }
          return book;
        })
      );
    }

    setIsPlaying(false);
  };

  const handleFileUpload = async (
    files: { path: string; name: string }[],
    bookId?: string
  ) => {
    const newAudioFiles = files.map((file) => ({
      id: uuidv4(),
      path: file.path,
      name: file.name,
    }));

    if (bookId && bookId !== "no-selection") {
      // Add to book
      setBooks((prev) => {
        const updatedBooks = prev.map((book) => {
          if (book.id === bookId) {
            // Check if files already exist in this book

            const filteredNewFiles = newAudioFiles.filter((newFile) => {
              return !book.audioFiles.some(
                (existingFile) =>
                  existingFile?.name === newFile?.name &&
                  existingFile?.path === newFile?.path
              );
            });

            if (filteredNewFiles.length < newAudioFiles.length) {
              toast({
                title: "Some files already exist",
                description: `${
                  newAudioFiles.length - filteredNewFiles.length
                } files were already in this book`,
                variant: "default",
              });
            }

            if (filteredNewFiles.length === 0) return book;

            const updatedBook = {
              ...book,
              audioFiles: [...book.audioFiles, ...filteredNewFiles],
            };

            // Save book to IndexedDB

            window.electronAPI.saveBook(updatedBook, filteredNewFiles);

            return updatedBook;
          }
          return book;
        });

        return updatedBooks;
      });

      setSelectedBookId(bookId);

      // If this is the first file in the book, or no file is currently playing, load it
      const book = books.find((b) => b.id === bookId);
      if (book && book.audioFiles.length === 0 && currentFileIndex === -1) {
        setActiveTab("player");
        loadAudio(0, bookId);
      }
    } else {
      // Add to loose files
      const updatedAudioFiles = [...audioFiles];

      // Filter out already existing files
      const filteredNewFiles = newAudioFiles.filter((newFile) => {
        return !audioFiles.some(
          (existingFile) =>
            existingFile.name === newFile.name &&
            existingFile.path === newFile.path
        );
      });

      if (filteredNewFiles.length < newAudioFiles.length) {
        toast({
          title: "Some files already exist",
          description: `${
            newAudioFiles.length - filteredNewFiles.length
          } files were already in your playlist`,
          variant: "default",
        });
      }

      if (filteredNewFiles.length > 0) {
        // Save to IndexedDB
        for (const file of filteredNewFiles) {
          await databaseService.saveLooseAudio(file);
        }

        const combinedFiles = [...updatedAudioFiles, ...filteredNewFiles];
        setAudioFiles(combinedFiles);

        // If this is the first file, select it automatically
        if (audioFiles.length === 0 && !selectedBookId) {
          setActiveTab("player");
          loadAudio(0);
        }
      }
    }
  };

  const saveCurrentTime = async () => {
    const selectBook = books.find((b) => b.id === selectedBookId);

    const audioFile = selectBook.audioFiles[currentFileIndex];

    await window.electronAPI.updateAudioCurrentTime(
      audioFile.id,
      currentTime,
      false
    );
  };

  const nextTrack = () => {
    saveCurrentTime();
    const currentFiles =
      selectedBookId && selectedBookId !== "no-selection"
        ? books.find((b) => b.id === selectedBookId)?.audioFiles || []
        : audioFiles;

    if (currentFileIndex < currentFiles.length - 1) {
      loadAudio(currentFileIndex + 1, selectedBookId || undefined);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.play();
      }
    }
  };

  const prevTrack = () => {
    saveCurrentTime();
    if (currentFileIndex > 0) {
      loadAudio(currentFileIndex - 1, selectedBookId || undefined);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.play();
      }
    }
  };

  const changeTrack = (id: string) => {
    saveCurrentTime();
    const nextIndex = currentBookFiles.findIndex((file) => file.id === id);
    setSelectFileId(id);
    loadAudio(nextIndex, selectedBookId || undefined);
  };

  const togglePlay = async () => {
    saveCurrentTime();
    if (selectedBookId) {
      const book = books.find((b) => b.id === selectedBookId);
      if (!book) return;

      if (currentFileIndex === -1 && book.audioFiles.length > 0) {
        loadAudio(0, selectedBookId);
        setIsPlaying(true);
        audioRef.current?.play();
        return;
      }
    } else if (currentFileIndex === -1 && audioFiles.length > 0) {
      loadAudio(0);
      setIsPlaying(true);
      audioRef.current?.play();
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;

      saveCurrentTime(); // Save position after skipping
    }
  };

  const onSelectBook = (bookId: string) => {
    if (bookId === "no-selection") {
      setSelectedBookId(null);
    } else {
      setSelectedBookId(bookId);
    }
  };

  const handleEnded = () => {
    const currentFiles = selectedBookId
      ? books.find((b) => b.id === selectedBookId)?.audioFiles || []
      : audioFiles;

    if (currentFileIndex < currentFiles.length - 1) {
      // Play next track
      loadAudio(currentFileIndex + 1, selectedBookId || undefined);
      setIsPlaying(true);
      audioRef.current?.play();
    } else {
      // End of playlist
      setIsPlaying(false);
      setAudioProgress(0);
      setCurrentTime(0);
      toast({
        title: "Playback ended",
        description: "You've reached the end of the audiobook",
      });
    }
  };

  return {
    handleCreateBook,
    handleDeleteBook,
    loadAudio,
    handleFileUpload,
    saveCurrentTime,
    nextTrack,
    prevTrack,
    togglePlay,
    changeTrack,
    onSelectBook,
    handleEnded,
    skip,
    audioRef,
    audioUrlRef,
  };
}
