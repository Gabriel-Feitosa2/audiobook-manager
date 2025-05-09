import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { databaseService } from "./databaseService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createWindow() {
  await databaseService.init();

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
  //mainWindow.loadURL("http://localhost:8080/");
}

app.on("ready", () => {
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC handlers

ipcMain.handle("select-file", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  const filePath = result.filePaths[0];
  const fileName = path.basename(filePath);

  return { path: filePath, name: fileName };
});

ipcMain.handle("select-audio", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    filters: [{ name: "Audio Files", extensions: ["mp3", "wav", "m4a"] }],
  });

  if (result.canceled) return null;

  return result.filePaths.map((filePath) => {
    const fileName = path.basename(filePath);
    return { path: filePath, name: fileName };
  });
});

ipcMain.handle("db:getAllBooks", () => databaseService.getAllBooks());
ipcMain.handle("db:getAudioFilePath", (event, id) =>
  databaseService.getAudioFilePath(id)
);

ipcMain.handle("db:getAllLooseAudios", () =>
  databaseService.getAllLooseAudios()
);
ipcMain.handle("db:getLooseAudioPath", (event, id) =>
  databaseService.getLooseAudioPath(id)
);

ipcMain.handle("db:saveBook", (event, book, paths) =>
  databaseService.saveBook(book, paths)
);

ipcMain.handle("db:updateBook", (event, book) =>
  databaseService.updateBook(book)
);

ipcMain.handle("db:deleteBook", (event, bookId) =>
  databaseService.deleteBook(bookId)
);

ipcMain.handle("db:saveLooseAudio", (event, audio) =>
  databaseService.saveLooseAudio(audio)
);

ipcMain.handle(
  "db:updateAudioCurrentTime",
  async (event, { id, currentTime, isLoose }) => {
    await databaseService.updateAudioCurrentTime(id, currentTime, isLoose);
  }
);

ipcMain.handle("db:saveSettings", (event, settings) =>
  databaseService.saveSettings(settings)
);
ipcMain.handle("db:getSettings", () => databaseService.getSettings());
