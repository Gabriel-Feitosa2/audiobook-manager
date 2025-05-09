import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path, { join, basename } from "path";
import { promises } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AudiobookService {
  async init() {
    const dbPath = join(__dirname, "..", "..", "audiobook.db");
    this.db = await open({ filename: dbPath, driver: sqlite3.Database });

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        cover TEXT,
        currentFileIndex INTEGER DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS audio_files (
        id TEXT PRIMARY KEY,
        book_id TEXT,
        name TEXT NOT NULL,
        size INTEGER,
        filePath TEXT,
        currentTime REAL DEFAULT 0,
        FOREIGN KEY(book_id) REFERENCES books(id)
      );

      CREATE TABLE IF NOT EXISTS loose_audios (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        size INTEGER,
        filePath TEXT,
        currentTime REAL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        selectedBookId TEXT,
        currentFileIndex INTEGER,
        currentPlaybackTime REAL
      );
    `);
  }

  async saveBook(book, audioFilePaths = []) {
    await this.db.run(
      `INSERT OR REPLACE INTO books (id, title, cover, currentFileIndex) VALUES (?, ?, ?, ?)`,
      book.id,
      book.title,
      book.cover || null,
      book.currentFileIndex || 0
    );

    for (const { id, path: filePath } of audioFilePaths) {
      const stats = await promises.stat(filePath);
      await this.db.run(
        `INSERT OR REPLACE INTO audio_files (id, book_id, name, size, filePath) VALUES (?, ?, ?, ?, ?)`,
        id,
        book.id,
        basename(filePath),
        stats.size,
        filePath
      );
    }
  }

  async updateBook(book) {
    await this.db.run(
      `UPDATE books
     SET title = ?, cover = ?, currentFileIndex = ?
     WHERE id = ?`,
      book.title,
      book.cover || null,
      book.currentFileIndex || 0,
      book.id
    );
  }

  async deleteBook(bookId) {
    // Exclui primeiro os arquivos de áudio associados ao livro
    await this.db.run(`DELETE FROM audio_files WHERE book_id = ?`, bookId);

    // Em seguida, exclui o próprio livro
    await this.db.run(`DELETE FROM books WHERE id = ?`, bookId);

    // Se o livro deletado estiver nas configurações, reseta as configurações
    const currentSettings = await this.getSettings();
    if (currentSettings?.selectedBookId === bookId) {
      await this.saveSettings({
        selectedBookId: null,
        currentFileIndex: 0,
        currentPlaybackTime: 0,
      });
    }
  }

  async getAllBooks() {
    const books = await this.db.all(`SELECT * FROM books`);
    for (const book of books) {
      const files = await this.db.all(
        `SELECT id, name, size, filePath, currentTime FROM audio_files WHERE book_id = ?`,
        book.id
      );
      book.audioFiles = files;
    }
    return books;
  }

  async getAudioFilePath(id) {
    const row = await this.db.get(
      `SELECT name, filePath FROM audio_files WHERE id = ?`,
      id
    );
    return row || null;
  }

  async saveLooseAudio(audio) {
    const stats = await promises.stat(audio.path);
    await this.db.run(
      `INSERT OR REPLACE INTO loose_audios (id, name, size, filePath, currentTime) VALUES (?, ?, ?, ?, ?)`,
      audio.id,
      audio.name,
      stats.size,
      audio.path,
      audio.currentTime || 0
    );
  }

  async getAllLooseAudios() {
    return await this.db.all(
      `SELECT id, name, size, filePath, currentTime FROM loose_audios`
    );
  }

  async getLooseAudioPath(id) {
    return await this.db.get(
      `SELECT name, filePath FROM loose_audios WHERE id = ?`,
      id
    );
  }

  async updateAudioCurrentTime(id, currentTime, isLoose = false) {
    const table = isLoose ? "loose_audios" : "audio_files";
    await this.db.run(
      `UPDATE ${table} SET currentTime = ? WHERE id = ?`,
      currentTime,
      id
    );
  }

  async saveSettings(settings) {
    await this.db.run(
      `INSERT OR REPLACE INTO settings (id, selectedBookId, currentFileIndex, currentPlaybackTime) VALUES (?, ?, ?, ?)`,
      "app-settings",
      settings.selectedBookId,
      settings.currentFileIndex,
      settings.currentPlaybackTime
    );
  }

  async getSettings() {
    return await this.db.get(
      `SELECT * FROM settings WHERE id = 'app-settings'`
    );
  }
}

export const databaseService = new AudiobookService();
