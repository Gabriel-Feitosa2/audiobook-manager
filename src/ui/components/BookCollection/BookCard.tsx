import React from "react";
import { Book } from "@/ui/types/book";
import { BookAudio, Disc3, EllipsisVertical } from "lucide-react";
import { Card, CardContent } from "@/ui/components/ui/card";
import { cn } from "@/ui/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface BookCardProps {
  book: Book;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}

const BookCard: React.FC<BookCardProps> = ({
  book,
  isSelected,
  onClick,
  onDelete,
}) => {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg overflow-hidden border-none",
        isSelected ? "ring-2 ring-audiobook-purple" : ""
      )}
      onClick={onClick}
    >
      <div className="aspect-square relative">
        {book.cover ? (
          <img
            src={`file://${book.cover}`}
            className="w-full h-full bg-cover bg-center"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-audiobook-purple to-audiobook-teal/40 flex items-center justify-center">
            <BookAudio className="h-16 w-16 text-white/80" />
          </div>
        )}
      </div>
      <CardContent className="p-3 flex justify-between bg-neutral-900">
        <div>
          <h3 className="font-medium text-sm line-clamp-1 text-white">
            {book.title}
          </h3>
          <div className="flex items-center mt-1 text-xs text-audiobook-grayText">
            <Disc3 className="h-3 w-3 mr-1" />
            {book.audioFiles.length}{" "}
            {book.audioFiles.length === 1 ? "file" : "files"}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <EllipsisVertical className="h-3 w-3 text-white" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
};

export default BookCard;
