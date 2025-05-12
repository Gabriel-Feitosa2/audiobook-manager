import { atom } from "jotai";
import { AudioFile, Book } from "../types/book";

export const booksAtom = atom<Book[]>([]);

export const selectedBookIdAtom = atom<string>("");

export const audioFilesAtom = atom<AudioFile[]>([]);

export const currentTimeAtom = atom<number>(0);

export const audioProgressAtom = atom<number>(0);

export const durationAtom = atom<number>(0);

export const currentFileIndexAtom = atom<number>(-1);

export const isPlayingAtom = atom<boolean>(false);

export const selectFileIdAtom = atom<string | null>("");

export const searchBookAtom = atom<string>("");

export const filterBookAtom = atom((get) => {
  const books = get(booksAtom);
  const searchBook = get(searchBookAtom).toLowerCase();
  if (searchBook === "") {
    return books;
  }
  return books.filter((book) => book.title.toLowerCase().includes(searchBook));
});
