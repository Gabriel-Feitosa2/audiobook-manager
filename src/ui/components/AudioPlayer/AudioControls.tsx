import React, { useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Volume1,
  VolumeX,
  Rewind,
  FastForward,
} from "lucide-react";
import { Slider } from "@/ui/components/ui/slider";
import { Button } from "@/ui/components/ui/button";

interface AudioControlsProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  togglePlay: () => void;
  audioProgress: number;
  duration: number;
  currentTime: number;
  setAudioProgress: React.Dispatch<React.SetStateAction<number>>;
  skip: (seconds: number) => void;
  volume: number;
  setVolume: React.Dispatch<React.SetStateAction<number>>;
  prevTrack: () => void;
  nextTrack: () => void;
  hasNextTrack: boolean;
  hasPrevTrack: boolean;
}

const AudioControls: React.FC<AudioControlsProps> = ({
  audioRef,
  isPlaying,
  togglePlay,
  audioProgress,
  duration,
  currentTime,
  setAudioProgress,
  skip,
  volume,
  setVolume,
  prevTrack,
  nextTrack,
  hasNextTrack,
  hasPrevTrack,
}) => {
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

  const getVolumeIcon = () => {
    if (volume === 0) return <VolumeX className="h-5 w-5" />;
    if (volume < 0.5) return <Volume1 className="h-5 w-5" />;
    return <Volume2 className="h-5 w-5" />;
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
    <div className="flex flex-col gap-4 w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-audiobook-grayText">
          {formatTime(currentTime)}
        </span>
        <span className="text-xs text-audiobook-grayText">
          {formatTime(duration)}
        </span>
      </div>

      <Slider
        defaultValue={[0]}
        value={[audioProgress]}
        min={0}
        max={100}
        step={0.1}
        onValueChange={handleProgressChange}
        className="cursor-pointer"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => toggleMute()}
            variant="ghost"
            size="icon"
            className="text-audiobook-grayText hover:text-audiobook-purple hover:bg-transparent"
          >
            {getVolumeIcon()}
          </Button>
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

        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button
            onClick={prevTrack}
            variant="outline"
            size="icon"
            disabled={!hasPrevTrack}
            className="audio-control-btn border-none"
          >
            <SkipBack className="h-5 w-5" />
          </Button>

          <Button
            onClick={() => skip(-10)}
            variant="outline"
            size="icon"
            className="audio-control-btn border-none"
          >
            <Rewind className="h-5 w-5" />
          </Button>

          <Button
            onClick={togglePlay}
            size="icon"
            className="bg-audiobook-purple hover:bg-audiobook-darkPurple text-white rounded-full h-12 w-12 flex items-center justify-center shadow-md"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </Button>

          <Button
            onClick={() => skip(30)}
            variant="outline"
            size="icon"
            className="audio-control-btn border-none"
          >
            <FastForward className="h-5 w-5" />
          </Button>

          <Button
            onClick={nextTrack}
            variant="outline"
            size="icon"
            disabled={!hasNextTrack}
            className="audio-control-btn border-none"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        <div className="w-[76px]">{/* Space balancer */}</div>
      </div>
    </div>
  );
};

export default AudioControls;
