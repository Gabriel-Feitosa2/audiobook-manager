import React, { useState } from "react";
import { Book } from "@/ui/types/book";
import { Button } from "@/ui/components/ui/button";
import { PlusCircle, BookAudio, FolderPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/ui/dialog";
import BookCard from "./BookCard";
import BookForm from "./BookForm";
import { useToast } from "@/ui/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { useAudiobooks } from "@/ui/hooks/usebook";
import { Input } from "../ui/input";
import { useAtom, useAtomValue } from "jotai";
import { filterBookAtom, searchBookAtom } from "@/ui/atom/books";
import { AnimatePresence } from "framer-motion";

interface BookCollectionProps {
  books: Book[];
  onBookSelect: (book: Book) => void;
  selectedBookId: string | null;
}

const BookCollection: React.FC<BookCollectionProps> = ({
  books,
  onBookSelect,
  selectedBookId,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { handleCreateBook, handleDeleteBook } = useAudiobooks();
  const { toast } = useToast();
  const filterBooks = useAtomValue(filterBookAtom);
  const [, setSearchBook] = useAtom(searchBookAtom);

  const CreateBook = (bookData: Partial<Book>) => {
    const newBook: Book = {
      id: uuidv4(),
      title: bookData.title || "Untitled Audiobook",
      cover: bookData.cover || null,
      audioFiles: [],
      currentFileIndex: 0,
    };

    handleCreateBook(newBook);
    setIsDialogOpen(false);

    toast({
      title: "Book created",
      description: `"${newBook.title}" has been created`,
    });
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = event.target.value.toLowerCase();
    setSearchBook(searchTerm);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex text-white items-center">
          <BookAudio className="mr-2 h-5 w-5 text-audiobook-purple" />
          Your Audiobooks
        </h2>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-audiobook-purple hover:bg-audiobook-darkPurple"
          size="sm"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New Book
        </Button>
      </div>

      <div className="mb-4 text-white w-40">
        <Input placeholder="Seach..." onChange={handleSearch} />
      </div>

      {books.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <FolderPlus className="h-12 w-12 mx-auto text-audiobook-grayText mb-3" />
          <p className="text-audiobook-grayText">No audiobooks yet</p>
          <Button
            variant="link"
            onClick={() => setIsDialogOpen(true)}
            className="mt-2 text-audiobook-purple"
          >
            Create your first audiobook
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2 max-h-[40rem] overflow-auto [&::-webkit-scrollbar]:bg-neutral-800 [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-thumb]:bg-neutral-700">
          <AnimatePresence>
            {filterBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                isSelected={book.id === selectedBookId}
                onClick={() => onBookSelect(book)}
                onDelete={() => handleDeleteBook(book.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-neutral-800 text-white">
          <DialogHeader>
            <DialogTitle>Create New Audiobook</DialogTitle>
          </DialogHeader>
          <BookForm
            onSave={CreateBook}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookCollection;
