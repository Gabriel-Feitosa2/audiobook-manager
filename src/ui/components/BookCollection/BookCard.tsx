import React, { useState } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import BookForm from "./BookForm";
import { useToast } from "../ui/use-toast";
import { useAudiobooks } from "@/ui/hooks/usebook";
import { useAtomValue } from "jotai";
import { booksAtom, selectedBookIdAtom } from "@/ui/atom/books";
import { motion } from "framer-motion";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { handleUpdateBook } = useAudiobooks();
  const { toast } = useToast();

  const books = useAtomValue(booksAtom);
  const selectedBookId = useAtomValue(selectedBookIdAtom);

  const EditBook = (bookData: Partial<Book>) => {
    const editBook: Book = {
      id: bookData.id,
      title: bookData.title || "Untitled Audiobook",
      cover: bookData.cover || null,
      audioFiles: [],
      currentFileIndex: 0,
    };

    handleUpdateBook(editBook);
    setIsDialogOpen(false);

    toast({
      title: "Book Edit",
      description: `"${editBook.title}" has been Edit`,
    });
  };

  const currentBook = selectedBookId
    ? books.find((book) => book.id === selectedBookId)
    : null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all ease-in-out duration-300 hover:shadow-lg hover:scale-105 overflow-hidden border-none",
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
                  setIsDialogOpen(true);
                }}
              >
                Edit
              </DropdownMenuItem>
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md bg-neutral-800 text-white">
            <DialogHeader>
              <DialogTitle>Edit Audiobook</DialogTitle>
            </DialogHeader>
            <BookForm
              onSave={EditBook}
              onCancel={() => setIsDialogOpen(false)}
              book={book}
            />
          </DialogContent>
        </Dialog>
      </Card>
    </motion.div>
  );
};

export default BookCard;
