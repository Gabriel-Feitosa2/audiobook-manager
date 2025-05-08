import React from "react";

interface BookCoverProps {
  fileName: string;
  isPlaying: boolean;
  coverUrl: string | null;
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
      className={`relative w-16 h-16  rounded-xl shadow-lg flex items-center justify-center overflow-hidden ${
        isPlaying ? "animate-pulse-light" : ""
      }`}
    >
      {coverUrl ? (
        <>
          <img
            src={`file://${coverUrl}`}
            alt={title || fileName}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20"></div>
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-audiobook-purple to-audiobook-teal/40"></div>
      )}
    </div>
  );
};

export default BookCover;
