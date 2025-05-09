const { contextBridge, ipcRenderer } = require("electron/renderer");

contextBridge.exposeInMainWorld("electronAPI", {
  selectFile: () => ipcRenderer.invoke("select-file"),
  selectAudio: () => ipcRenderer.invoke("select-audio"),
  getAllBooks: () => ipcRenderer.invoke("db:getAllBooks"),
  getAudioFilePath: (id) => ipcRenderer.invoke("db:getAudioFilePath", id),

  getAllLooseAudios: () => ipcRenderer.invoke("db:getAllLooseAudios"),
  getLooseAudioPath: (id) => ipcRenderer.invoke("db:getLooseAudioPath", id),

  saveBook: (book, filePaths) =>
    ipcRenderer.invoke("db:saveBook", book, filePaths),

  updateBook: (book) => ipcRenderer.invoke("db:updateBook", book),

  deleteBook: (bookId) => ipcRenderer.invoke("db:deleteBook", bookId),

  saveLooseAudio: (audio) => ipcRenderer.invoke("db:saveLooseAudio", audio),

  updateAudioCurrentTime: (id, currentTime, isLoose) =>
    ipcRenderer.invoke("db:updateAudioCurrentTime", {
      id,
      currentTime,
      isLoose,
    }),

  saveSettings: (settings) => ipcRenderer.invoke("db:saveSettings", settings),
  getSettings: () => ipcRenderer.invoke("db:getSettings"),
});
