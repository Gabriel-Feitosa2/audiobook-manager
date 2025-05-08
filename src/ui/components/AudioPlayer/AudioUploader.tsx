import React, { useState } from "react";
import { Button } from "@/ui/components/ui/button";
import { BookAudio, Upload, FileAudio } from "lucide-react";
import { useToast } from "@/ui/hooks/use-toast";
import { Book } from "@/ui/types/book";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/ui/select";
import { useAudiobooks } from "@/ui/hooks/usebook";

interface AudioUploaderProps {
  books: Book[];
  selectedBookId: string | null;
}

const AudioUploader: React.FC<AudioUploaderProps> = ({
  books,
  selectedBookId,
}) => {
  const { onSelectBook } = useAudiobooks();
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { handleFileUpload } = useAudiobooks();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFiles = (files: { path: string; name: string }[]) => {
    // const audioFiles = files.filter((file) => file.type.startsWith("audio/"));

    if (files.length === 0) {
      toast({
        title: "Invalid files",
        description: "Please upload audio files (MP3, WAV, etc.)",
        variant: "destructive",
      });
      return;
    }

    handleFileUpload(files, selectedBookId || undefined);
    toast({
      title: "Files uploaded",
      description: `${files.length} audio ${
        files.length === 1 ? "file" : "files"
      } ready to play`,
      variant: "default",
    });

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadAudios = async () => {
    const files = await window.electronAPI.selectAudio();
    console.log(files);
    processFiles(files);
  };

  return (
    <div className="space-y-4">
      {books.length > 0 && (
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-white">Add to book:</label>
          <Select
            value={selectedBookId || "no-selection"}
            onValueChange={(value) => onSelectBook(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a book" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no-selection">No book selected</SelectItem>
              {books.map((book) => (
                <SelectItem key={book.id} value={book.id}>
                  {book.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? "border-audiobook-purple bg-audiobook-lightPurple/10"
            : "border-gray-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        // onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="bg-audiobook-lightPurple/30 p-4 rounded-full">
            <FileAudio className="h-10 w-10 text-audiobook-purple" />
          </div>
          <div>
            <h3 className="text-lg text-white font-semibold">Upload Audio</h3>
            <p className="text-sm text-audiobook-grayText mt-1">
              Drag and drop multiple audio files or click to upload
              {selectedBookId && selectedBookId !== "no-selection"
                ? ` to "${books.find((b) => b.id === selectedBookId)?.title}"`
                : ""}
            </p>
          </div>
          <Button
            onClick={() => uploadAudios()}
            className="bg-audiobook-purple hover:bg-audiobook-darkPurple"
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose Files
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AudioUploader;
