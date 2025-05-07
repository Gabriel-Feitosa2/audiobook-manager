import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/ui/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/ui/components/ui/tabs";
import { BookAudio, List } from "lucide-react";
import { useToast } from "@/ui/hooks/use-toast";

import AudioUploader from "./AudioUploader";
import AudioControls from "./AudioControls";
import BookCover from "./BookCover";
import PlaylistItem from "./PlaylistItem";
import BookCollection from "../BookCollection";
import { Book } from "@/ui/types/book";
import { databaseService } from "@/ui/services/database";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useAtom } from "jotai";
import {
  audioFilesAtom,
  audioProgressAtom,
  booksAtom,
  currentFileIndexAtom,
  currentTimeAtom,
  isPlayingAtom,
  selectedBookIdAtom,
  selectFileIdAtom,
} from "@/ui/atom/books";
import { useAudiobooks } from "@/ui/hooks/usebook";
import { activeTabAtom } from "@/ui/atom/ui";
import Player from "./Player";

const AudioPlayer: React.FC = () => {
  const [books, setBooks] = useAtom(booksAtom);
  const [selectedBookId, setSelectedBookId] = useAtom(selectedBookIdAtom);
  const [audioFiles, setAudioFiles] = useAtom(audioFilesAtom);
  const [currentFileIndex, setCurrentFileIndex] = useAtom(currentFileIndexAtom);
  const [isPlaying, setIsPlaying] = useAtom(isPlayingAtom);
  const [audioProgress, setAudioProgress] = useAtom(audioProgressAtom);
  const [currentTime, setCurrentTime] = useAtom(currentTimeAtom);
  const [volume, setVolume] = useState(1);
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);
  const [isLoading, setIsLoading] = useState(true);
  const [selectFileId, setSelectFileId] = useAtom(selectFileIdAtom);

  const {
    loadAudio,
    saveCurrentTime,
    changeTrack,
    togglePlay,
    prevTrack,
    nextTrack,
    handleEnded,
    skip,
    audioRef,
    audioUrlRef,
  } = useAudiobooks();

  const currentBook = selectedBookId
    ? books.find((book) => book.id === selectedBookId)
    : null;
  const currentBookFiles = currentBook ? currentBook.audioFiles : audioFiles;

  const { toast } = useToast();

  // Load data from DB when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Load books

        const savedBooks = await window.electronAPI.getAllBooks();
        setBooks(savedBooks);

        // Load loose audio files

        const savedAudioFiles = await window.electronAPI.getAllLooseAudios();
        setAudioFiles(savedAudioFiles);

        // Load settings

        const settings = await window.electronAPI.getSettings();

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
      saveCurrentTime();
    };
  }, [toast]);

  useEffect(() => {
    // load selectFileId

    setSelectFileId(currentBookFiles[currentFileIndex]?.id || null);
  }, [currentFileIndex, currentBookFiles]);

  const saveCurrentSettings = async () => {
    await window.electronAPI.saveSettings({
      selectedBookId: selectedBookId,
      currentFileIndex,
      currentPlaybackTime: currentTime,
    });
  };

  // Save settings whenever they change

  useEffect(() => {
    if (!isLoading) {
      saveCurrentSettings();
    }
  }, [selectedBookId, currentFileIndex, isLoading, currentTime]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress =
        (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
      setCurrentTime(audioRef.current.currentTime);
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

  const getCurrentFileName = () => {
    if (selectedBookId) {
      const book = books.find((b) => b.id === selectedBookId);

      if (
        book &&
        currentFileIndex >= 0 &&
        currentFileIndex < book?.audioFiles?.length
      ) {
        return book.audioFiles?.[currentFileIndex]?.name;
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
                    selectedBookId={selectedBookId}
                  />
                </TabsContent>

                <TabsContent value="upload" className="mt-0">
                  <AudioUploader
                    books={books}
                    selectedBookId={selectedBookId}
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
                            file={file}
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

                        <div className="flex items-baseline mb-4 gap-4">
                          <p className="text-audiobook-grayText text-sm mb-6">
                            Track {currentFileIndex + 1} of{" "}
                            {currentBookFiles.length}
                          </p>

                          <Select
                            value={selectFileId || "no-selection"}
                            onValueChange={(value) => changeTrack(value)}
                          >
                            <SelectTrigger className="w-60 h-8">
                              <SelectValue placeholder="Select a track" />
                            </SelectTrigger>
                            <SelectContent>
                              {currentBookFiles.map((file) => (
                                <SelectItem key={file.id} value={file.id}>
                                  {file.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <AudioControls
                          audioRef={audioRef}
                          isPlaying={isPlaying}
                          togglePlay={togglePlay}
                          audioProgress={audioProgress}
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
