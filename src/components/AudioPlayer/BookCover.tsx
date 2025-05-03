import React from "react";
import { BookAudio, Music3 } from "lucide-react";

interface BookCoverProps {
  fileName: string;
  isPlaying: boolean;
  coverUrl: Blob | MediaSource | null;
  title: string | null;
}

const BookCover: React.FC<BookCoverProps> = ({
  fileName,
  isPlaying,
  coverUrl,
  title,
}) => {
  return (
    <div
      className={`relative w-full sm:w-64 h-64 rounded-xl shadow-lg flex items-center justify-center overflow-hidden ${
        isPlaying ? "animate-pulse-light" : ""
      }`}
    >
      {coverUrl ? (
        <>
          <img
            src={URL.createObjectURL(coverUrl)}
            alt={title || fileName}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-audiobook-purple to-audiobook-teal/40"></div>
      )}

      <div className="z-10 flex flex-col items-center justify-center text-white p-4">
        {isPlaying ? (
          <Music3 className="h-12 w-12 mb-4" />
        ) : (
          <BookAudio className="h-12 w-12 mb-4" />
        )}

        <div className="text-center">
          {title && (
            <h3 className="font-bold text-xl text-white break-words max-w-full mb-2">
              {title.length > 20 ? title.substring(0, 20) + "..." : title}
            </h3>
          )}

          <h4 className="font-bold text-lg text-white break-words max-w-full">
            {fileName.length > 20
              ? fileName.substring(0, 20) + "..."
              : fileName}
          </h4>

          <p className="text-white/80 text-sm mt-2">Audiobook</p>
        </div>
      </div>
    </div>
  );
};

export default BookCover;
