import React from "react";
import { Book } from "@/ui/types/book";
import { BookAudio, Disc3 } from "lucide-react";
import { Card, CardContent } from "@/ui/components/ui/card";
import { cn } from "@/ui/lib/utils";

interface BookCardProps {
  book: Book;
  isSelected: boolean;
  onClick: () => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, isSelected, onClick }) => {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg overflow-hidden",
        isSelected ? "ring-2 ring-audiobook-purple" : ""
      )}
      onClick={onClick}
    >
      <div className="aspect-square relative">
        {book.cover ? (
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${URL.createObjectURL(book.cover)})`,
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-audiobook-purple to-audiobook-teal/40 flex items-center justify-center">
            <BookAudio className="h-16 w-16 text-white/80" />
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium text-sm line-clamp-1">{book.title}</h3>
        <div className="flex items-center mt-1 text-xs text-audiobook-grayText">
          <Disc3 className="h-3 w-3 mr-1" />
          {book.audioFiles.length}{" "}
          {book.audioFiles.length === 1 ? "file" : "files"}
        </div>
      </CardContent>
    </Card>
  );
};

export default BookCard;
