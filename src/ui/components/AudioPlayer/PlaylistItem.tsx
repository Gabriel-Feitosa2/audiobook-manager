import React from "react";
import { Play, Pause, Music } from "lucide-react";
import { Button } from "@/ui/components/ui/button";

interface PlaylistItemProps {
  file: File;
  isActive: boolean;
  isPlaying: boolean;
  onClick: () => void;
}

const PlaylistItem: React.FC<PlaylistItemProps> = ({
  file,
  isActive,
  isPlaying,
  onClick,
}) => {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-md transition-colors ${
        isActive
          ? "bg-audiobook-lightPurple/20 border-l-4 border-audiobook-purple"
          : "hover:bg-gray-100 border-l-4 border-transparent"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div
          className={`p-2 rounded-full ${
            isActive
              ? "bg-audiobook-purple text-white"
              : "bg-gray-200 text-gray-500"
          }`}
        >
          <Music className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span
            className={`font-medium ${
              isActive ? "text-audiobook-darkText" : "text-gray-700"
            }`}
          >
            {file.name.length > 25
              ? file.name.substring(0, 25) + "..."
              : file.name}
          </span>
          <span className="text-xs text-gray-500">
            {(file.size / (1024 * 1024)).toFixed(2)} MB
          </span>
        </div>
      </div>

      {isActive && (
        <Button
          variant="ghost"
          size="sm"
          className="text-audiobook-purple hover:bg-audiobook-lightPurple/20"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
};

export default PlaylistItem;
