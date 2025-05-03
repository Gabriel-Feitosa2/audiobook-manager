import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookAudio, List } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

import AudioUploader from "./AudioUploader";
import AudioControls from "./AudioControls";
import BookCover from "./BookCover";
import PlaylistItem from "./PlaylistItem";
import BookCollection from "../BookCollection";
import { Book, AudioFile } from "@/types/book";
import { databaseService } from "@/services/database";

const AudioPlayer: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [activeTab, setActiveTab] = useState<string>("library");
  const [isLoading, setIsLoading] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const audioUrlRef = useRef<string | null>(null);
  const { toast } = useToast();

  // Load data from IndexedDB when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load books
        const savedBooks = await databaseService.getAllBooks();
        setBooks(savedBooks);

        // Load loose audio files
        const savedAudioFiles = await databaseService.getAllLooseAudios();
        setAudioFiles(savedAudioFiles);

        // Load settings
        const settings = await databaseService.getSettings();
        if (settings) {
          setSelectedBookId(settings.selectedBookId);
          setCurrentFileIndex(settings.currentFileIndex);

          // If there was a selected book and track, prepare to load it
          if (settings.selectedBookId && settings.currentFileIndex >= 0) {
            const book = savedBooks.find(
              (b) => b.id === settings.selectedBookId
            );
            if (
              book &&
              book.audioFiles.length > 0 &&
              settings.currentFileIndex < book.audioFiles.length
            ) {
              // We'll need to load the actual file data
              const audioId = book.audioFiles[settings.currentFileIndex].id;
              const file = await databaseService.getAudioFile(audioId);
              if (file) {
                book.audioFiles[settings.currentFileIndex].file = file;

                // Set the initial current time if it exists
                const initialTime =
                  book.audioFiles[settings.currentFileIndex].currentTime ||
                  settings.currentPlaybackTime ||
                  0;
                setCurrentTime(initialTime);

                // We'll set the currentTime on the audio element after it loads
              }
            }
          } else if (
            !settings.selectedBookId &&
            savedAudioFiles.length > 0 &&
            settings.currentFileIndex >= 0
          ) {
            // If we have loose audio files selected
            if (settings.currentFileIndex < savedAudioFiles.length) {
              setCurrentTime(
                savedAudioFiles[settings.currentFileIndex].currentTime ||
                  settings.currentPlaybackTime ||
                  0
              );
            }
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading data from IndexedDB:", error);
        toast({
          title: "Error loading data",
          description: "Could not load your audiobooks from storage",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    loadData();

    // Clean up object URLs
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }

      // Save current playback time when component unmounts
      saveCurrentPlaybackTime();
    };
  }, [toast]);

  // Save current playback time periodically (every 5 seconds)
  useEffect(() => {
    saveCurrentPlaybackTime();
  }, [currentTime, selectedBookId, currentFileIndex]);

  // Save settings whenever they change
  useEffect(() => {
    const saveCurrentSettings = async () => {
      await databaseService.saveSettings(
        selectedBookId,
        currentFileIndex,
        currentTime
      );
    };

    if (!isLoading) {
      saveCurrentSettings();
    }
  }, [selectedBookId, currentFileIndex, isLoading]);

  // Save the current playback time to the appropriate storage
  const saveCurrentPlaybackTime = async () => {
    if (currentTime !== lastSavedTime) {
      // Only save if the time has changed since last save
      setLastSavedTime(currentTime);

      if (selectedBookId && currentFileIndex >= 0) {
        const book = books.find((b) => b.id === selectedBookId);
        if (book && book.audioFiles[currentFileIndex]) {
          const audioFile = book.audioFiles[currentFileIndex];

          // Update our local state
          const updatedBooks = books.map((b) => {
            if (b.id === selectedBookId) {
              const updatedAudioFiles = b.audioFiles.map((af, idx) =>
                idx === currentFileIndex ? { ...af, currentTime } : af
              );
              return { ...b, audioFiles: updatedAudioFiles };
            }
            return b;
          });
          setBooks(updatedBooks);

          // Update in the database
          await databaseService.updateAudioFileTime(
            selectedBookId,
            audioFile.id,
            currentTime
          );
        }
      } else if (
        currentFileIndex >= 0 &&
        currentFileIndex < audioFiles.length
      ) {
        // Update loose audio file time
        const updatedAudioFiles = audioFiles.map((af, idx) =>
          idx === currentFileIndex ? { ...af, currentTime } : af
        );
        setAudioFiles(updatedAudioFiles);

        // Update in the database
        await databaseService.updateLooseAudioTime(
          audioFiles[currentFileIndex].id,
          currentTime
        );
      }

      // Also update in general settings
      await databaseService.saveSettings(
        selectedBookId,
        currentFileIndex,
        currentTime
      );
    }
  };

  // Get current book and its files
  const currentBook = selectedBookId
    ? books.find((book) => book.id === selectedBookId)
    : null;
  const currentBookFiles = currentBook ? currentBook.audioFiles : audioFiles;

  const handleFileUpload = async (files: File[], bookId?: string) => {
    const newAudioFiles = files.map((file) => ({
      id: uuidv4(),
      file,
      name: file.name,
      size: file.size,
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
                  existingFile.name === newFile.name &&
                  existingFile.size === newFile.size
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
            databaseService.saveBook(
              updatedBook,
              filteredNewFiles.map((f) => ({ id: f.id, file: f.file }))
            );

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
            existingFile.size === newFile.size
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

  const loadAudio = async (index: number, bookId?: string) => {
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

    let file = audioFile.file;

    // If we're selecting a book track, we need to load the actual file data
    if (bookId && bookId !== "no-selection") {
      const actualFile = await databaseService.getAudioFile(audioFile.id);
      if (actualFile) {
        file = actualFile;
        // Update our in-memory representation
        setBooks((prev) =>
          prev.map((book) => {
            if (book.id === bookId) {
              const updatedAudioFiles = [...book.audioFiles];
              updatedAudioFiles[index] = {
                ...updatedAudioFiles[index],
                file: actualFile,
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

    const audioUrl = URL.createObjectURL(file);
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

  const togglePlay = () => {
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

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress =
        (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
      setCurrentTime(audioRef.current.currentTime);
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

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
      saveCurrentPlaybackTime(); // Save position after skipping
    }
  };

  const selectAudio = (index: number) => {
    if (index === currentFileIndex) {
      togglePlay();
      return;
    }

    loadAudio(index, selectedBookId || undefined);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const prevTrack = () => {
    if (currentFileIndex > 0) {
      loadAudio(currentFileIndex - 1, selectedBookId || undefined);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.play();
      }
    }
  };

  const nextTrack = () => {
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

  useEffect(() => {
    loadAudio(currentFileIndex, selectedBookId || undefined);
  }, [isLoading]);

  const handleBookSelect = async (book: Book) => {
    setSelectedBookId(book.id);
    setActiveTab("player");

    // If book has files, load the current or first one
    if (book.audioFiles.length > 0) {
      const indexToLoad =
        book.currentFileIndex >= 0 &&
        book.currentFileIndex < book.audioFiles.length
          ? book.currentFileIndex
          : 0;
      loadAudio(indexToLoad, book.id);
    }
  };

  const handleCreateBook = async (book: Book) => {
    setBooks((prev) => [...prev, book]);
    setSelectedBookId(book.id);

    // Save to IndexedDB
    await databaseService.saveBook(book);
  };

  const onSelectBook = (bookId: string) => {
    if (bookId === "no-selection") {
      setSelectedBookId(null);
    } else {
      setSelectedBookId(bookId);
    }
  };

  const getCurrentFileName = () => {
    if (selectedBookId) {
      const book = books.find((b) => b.id === selectedBookId);
      if (
        book &&
        currentFileIndex >= 0 &&
        currentFileIndex < book.audioFiles.length
      ) {
        return book.audioFiles[currentFileIndex].name;
      }
    } else if (currentFileIndex >= 0 && currentFileIndex < audioFiles.length) {
      return audioFiles[currentFileIndex].name;
    }
    return "";
  };

  // Check if we have previous or next tracks
  const currentFiles =
    selectedBookId && selectedBookId !== "no-selection"
      ? books.find((b) => b.id === selectedBookId)?.audioFiles || []
      : audioFiles;
  const hasNextTrack = currentFileIndex < currentFiles.length - 1;
  const hasPrevTrack = currentFileIndex > 0;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2 text-center flex items-center justify-center">
        <BookAudio className="mr-2 h-8 w-8 text-audiobook-purple" />
        Audiobook Player
      </h1>
      <p className="text-center text-audiobook-grayText mb-6">
        Upload and listen to your favorite audiobooks
      </p>

      <Card className="overflow-hidden shadow-md">
        <Tabs
          defaultValue="library"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <div className="bg-gray-50 p-2">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger
                value="library"
                className="data-[state=active]:bg-white"
              >
                Library
              </TabsTrigger>
              <TabsTrigger
                value="player"
                className="data-[state=active]:bg-white"
              >
                Player
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                className="data-[state=active]:bg-white"
              >
                Upload
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-audiobook-purple"></div>
              </div>
            ) : (
              <>
                <TabsContent value="library" className="mt-0">
                  <BookCollection
                    books={books}
                    onBookSelect={handleBookSelect}
                    onAddAudioToBook={(bookId, audioFile) => {
                      setBooks((prev) => {
                        const updatedBooks = prev.map((book) => {
                          if (book.id === bookId) {
                            const updatedBook = {
                              ...book,
                              audioFiles: [...book.audioFiles, audioFile],
                            };
                            // Save to IndexedDB
                            databaseService.saveBook(updatedBook, [
                              { id: audioFile.id, file: audioFile.file },
                            ]);
                            return updatedBook;
                          }
                          return book;
                        });
                        return updatedBooks;
                      });
                    }}
                    onCreateBook={handleCreateBook}
                    selectedBookId={selectedBookId}
                  />
                </TabsContent>

                <TabsContent value="upload" className="mt-0">
                  <AudioUploader
                    onFileUpload={handleFileUpload}
                    books={books}
                    selectedBookId={selectedBookId}
                    onSelectBook={onSelectBook}
                  />

                  {(audioFiles.length > 0 ||
                    (currentBook && currentBook.audioFiles.length > 0)) && (
                    <div className="mt-6">
                      <div className="flex items-center mb-3">
                        <List className="mr-2 h-5 w-5 text-audiobook-purple" />
                        <h3 className="font-semibold">
                          {currentBook
                            ? `${currentBook.title} (${currentBook.audioFiles.length} files)`
                            : `Your Playlist (${audioFiles.length})`}
                        </h3>
                      </div>

                      <div className="border rounded-md overflow-hidden max-h-80 overflow-y-auto">
                        {currentBookFiles.map((file, index) => (
                          <PlaylistItem
                            key={`${file.id}`}
                            file={file.file}
                            isActive={
                              index === currentFileIndex &&
                              (currentBook
                                ? selectedBookId === currentBook.id
                                : !selectedBookId)
                            }
                            isPlaying={
                              isPlaying &&
                              index === currentFileIndex &&
                              (currentBook
                                ? selectedBookId === currentBook.id
                                : !selectedBookId)
                            }
                            onClick={() => selectAudio(index)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="player" className="mt-0">
                  {(currentBook && currentBook.audioFiles.length === 0) ||
                  (!currentBook && audioFiles.length === 0) ? (
                    <div className="text-center py-10">
                      <p className="text-audiobook-grayText mb-4">
                        No audiobook selected. Please upload a file first.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-6 items-center">
                      <BookCover
                        fileName={getCurrentFileName()}
                        isPlaying={isPlaying}
                        coverUrl={currentBook?.cover || null}
                        title={currentBook?.title || null}
                      />

                      <div className="flex-1 w-full">
                        {currentBook ? (
                          <h2 className="text-xl font-bold mb-1 break-words">
                            {currentBook.title}
                          </h2>
                        ) : null}

                        <h3 className="text-lg font-medium mb-1 break-words">
                          {getCurrentFileName()}
                        </h3>

                        <p className="text-audiobook-grayText text-sm mb-6">
                          Track {currentFileIndex + 1} of{" "}
                          {currentBookFiles.length}
                        </p>

                        <AudioControls
                          audioRef={audioRef}
                          isPlaying={isPlaying}
                          togglePlay={togglePlay}
                          audioProgress={audioProgress}
                          duration={duration}
                          currentTime={currentTime}
                          setAudioProgress={setAudioProgress}
                          skip={skip}
                          volume={volume}
                          setVolume={setVolume}
                          prevTrack={prevTrack}
                          nextTrack={nextTrack}
                          hasNextTrack={hasNextTrack}
                          hasPrevTrack={hasPrevTrack}
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </CardContent>
        </Tabs>
      </Card>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default AudioPlayer;
