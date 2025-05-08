import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  IterationCwIcon,
  IterationCcwIcon,
  TableOfContents,
  Volume,
  Volume1,
  VolumeOff,
} from "lucide-react";
import { useState } from "react";
import { Slider } from "../ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useAtomValue, useSetAtom } from "jotai";
import {
  audioFilesAtom,
  audioProgressAtom,
  booksAtom,
  currentFileIndexAtom,
  durationAtom,
  selectedBookIdAtom,
} from "@/ui/atom/books";
import PlaylistItem from "./PlaylistItem";
import BookCover from "./BookCover";
import { useAudiobooks } from "@/ui/hooks/usebook";

interface AudioControlsProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  togglePlay: () => void;
  audioProgress: number;
  currentTime: number;
  skip: (seconds: number) => void;
  volume: number;
  setVolume: React.Dispatch<React.SetStateAction<number>>;
  nextTrack: () => void;
  prevTrack: () => void;
  hasNextTrack: boolean;
  hasPrevTrack: boolean;
  selectAudio: (index: number) => void;
}

function Player({
  audioRef,
  isPlaying,
  togglePlay,
  audioProgress,
  currentTime,
  skip,
  volume,
  setVolume,
  nextTrack,
  prevTrack,
  hasNextTrack,
  hasPrevTrack,
  selectAudio,
}: AudioControlsProps) {
  const { getCurrentFileName } = useAudiobooks();

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const books = useAtomValue(booksAtom);
  const selectedBookId = useAtomValue(selectedBookIdAtom);
  const audioFiles = useAtomValue(audioFilesAtom);
  const currentFileIndex = useAtomValue(currentFileIndexAtom);
  const duration = useAtomValue(durationAtom);
  const setAudioProgress = useSetAtom(audioProgressAtom);

  const currentBook = selectedBookId
    ? books.find((book) => book.id === selectedBookId)
    : null;
  const currentBookFiles = currentBook ? currentBook.audioFiles : audioFiles;

  // Format time in MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0];
    setAudioProgress(newProgress);
    if (audioRef.current) {
      audioRef.current.currentTime = (newProgress / 100) * duration;
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume / 100);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const hanleVolumeIcon = () => {
    if (volume === 0) {
      return <VolumeOff size={20} className="ml-4" />;
    }
    if (volume > 0 && volume <= 0.3) {
      return <Volume size={20} className="ml-4" />;
    }
    if (volume > 0.3 && volume <= 0.7) {
      return <Volume1 size={20} className="ml-4" />;
    }

    if (volume > 0.7) {
      return <Volume2 size={20} className="ml-4" />;
    }
  };

  const toggleMute = () => {
    if (volume > 0) {
      setVolume(0);
      if (audioRef.current) audioRef.current.volume = 0;
    } else {
      setVolume(1);
      if (audioRef.current) audioRef.current.volume = 1;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-neutral-900 text-white shadow-lg p-4 flex flex-col items-center gap-4">
      <div className="flex justify-between items-center w-full">
        <div className="flex gap-4">
          <BookCover
            fileName={getCurrentFileName()}
            isPlaying={isPlaying}
            coverUrl={currentBook?.cover || null}
            title={currentBook?.title || null}
          />
          <div className="flex flex-col justify-center">
            <span className="text-sm font-semibold">{currentBook?.title}</span>
            <span className="text-xs text-neutral-400">
              {getCurrentFileName()}
            </span>
            <p className="text-audiobook-grayText text-xs">
              Track {currentFileIndex + 1} of {currentBookFiles.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 pr-32">
          <button onClick={prevTrack} disabled={!hasPrevTrack}>
            <SkipBack size={20} />
          </button>
          <IterationCcwIcon
            className="rotate-180 cursor-pointer"
            onClick={() => skip(-10)}
          />
          <button
            onClick={togglePlay}
            className="bg-green-500 hover:bg-green-600 text-black p-2 rounded-full"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <IterationCwIcon
            className="rotate-180 cursor-pointer"
            onClick={() => skip(30)}
          />
          <button onClick={nextTrack} disabled={!hasNextTrack}>
            <SkipForward size={20} />
          </button>
        </div>
        <div className="flex gap-2">
          <TableOfContents
            className="cursor-pointer"
            onClick={() => setIsDialogOpen(true)}
          />
          <div onClick={() => toggleMute()} className="cursor-pointer">
            {hanleVolumeIcon()}
          </div>
          <Slider
            defaultValue={[100]}
            value={[volume * 100]}
            min={0}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="w-24"
          />
        </div>
      </div>
      <div className="flex w-full gap-4">
        <span>{formatTime(currentTime)}</span>
        <Slider
          defaultValue={[0]}
          value={[audioProgress]}
          min={0}
          max={100}
          step={0.1}
          onValueChange={handleProgressChange}
          className="cursor-pointer"
        />
        <span>{formatTime(duration)}</span>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="h-[32rem] overflow-auto">
          <DialogHeader>
            <DialogTitle>Tracks</DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Player;
