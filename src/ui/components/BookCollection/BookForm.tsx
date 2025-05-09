import React, { useState } from "react";
import { Book } from "@/ui/types/book";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { Label } from "@/ui/components/ui/label";
import { Upload, BookAudio, X } from "lucide-react";
import { useToast } from "@/ui/hooks/use-toast";

interface BookFormProps {
  book?: Partial<Book>;
  onSave: (book: Partial<Book>) => void;
  onCancel: () => void;
}

const BookForm: React.FC<BookFormProps> = ({ book, onSave, onCancel }) => {
  const [title, setTitle] = useState(book?.title || "");
  const [coverPreview, setCoverPreview] = useState<string | null>(
    book?.cover || null
  );
  const [coverFile, setCoverFile] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCoverChange = async () => {
    const imagePath = await window.electronAPI.selectFile();

    setCoverFile(imagePath.path);

    setCoverPreview(imagePath.path);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your audiobook",
        variant: "destructive",
      });
      return;
    }

    onSave({
      id: book?.id || null,
      title,
      cover: coverFile,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Book Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter audiobook title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cover">Cover Image</Label>
        <div className="flex items-center space-x-4">
          <div className="w-24 h-24 border rounded-md overflow-hidden flex items-center justify-center bg-neutral-900 border-neutral-950 ">
            {coverPreview ? (
              <div className="relative w-full h-full">
                <img
                  src={`file://${coverPreview}`}
                  alt="Book cover"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white"
                  onClick={() => {
                    if (coverPreview) URL.revokeObjectURL(coverPreview);
                    setCoverPreview(null);
                    setCoverFile(null);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <BookAudio className="h-8 w-8 text-gray-400" />
            )}
          </div>

          <div>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleCoverChange()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Cover
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-audiobook-purple hover:bg-audiobook-darkPurple"
        >
          Save Book
        </Button>
      </div>
    </form>
  );
};

export default BookForm;
