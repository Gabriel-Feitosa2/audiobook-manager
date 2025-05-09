# Audiobook Manager

**Audiobook Manager** é um aplicativo de desktop construído com **Electron**, **React**, **Vite** e **TailwindCSS** para gerenciar audiobooks localmente. Utiliza **SQLite** para armazenamento persistente, com uma interface moderna baseada em Radix UI.

---

## 🧰 Tecnologias Principais

- [Electron](https://www.electronjs.org/) – empacotamento e execução desktop

- [React 18](https://react.dev/) – construção da interface do usuário

- [Vite](https://vitejs.dev/) – build e servidor de desenvolvimento rápidos

- [Tailwind CSS](https://tailwindcss.com/) – estilos utilitários

- [SQLite](https://www.sqlite.org/index.html) – banco de dados local

- [Dexie.js](https://dexie.org/) – IndexedDB (em transição para SQLite)

- [Zod](https://zod.dev/) – validação de esquemas

- [Radix UI](https://www.radix-ui.com/) – componentes acessíveis e sem estilo

- [Electron Builder](https://www.electron.build/) – empacotamento final da aplicação

---

## 🚀 Instalação e Execução

### ⚠️ Importante durante o desenvolvimento:

No modo desenvolvimento, é necessário **alterar o campo `main` no `package.json`** de:

```json

"main": "dist/main.js"

```

para:

```json

"main": "src/electron/main.js"

```

Isso é necessário para que o Electron use os arquivos fonte diretamente ao invés do build final.

---

### Pré-requisitos

- Node.js v18 ou superior

- NPM v9 ou superior

---

### 1. Instale as dependências

```bash

npm  install

```

---

### 2. Build inicial (necessário por causa do uso de SQLite)

Antes de rodar o Electron, é necessário gerar o build do front-end:

```bash

npm  run  build

```

---

### 3. Rode a aplicação

```bash

npm  run  electron

```

> 💡 O comando `npm run dev` **não é suficiente** por si só devido à integração com SQLite. Sempre rode `npm run build` antes de iniciar o Electron.

---

## 🛠️ Scripts Disponíveis

| Script | Descrição |

| ---------------- | ----------------------------------------------------------------------------- |

| `dev` | Inicia o Vite em modo desenvolvimento _(⚠️ não usar isoladamente com SQLite)_ |

| `build` | Compila o front-end com Vite |

| `build:dev` | Compila com modo development |

| `lint` | Roda o ESLint |

| `preview` | Serve o build para preview |

| `electron` | Inicia o Electron com o código atual |

| `copy:main` | Copia arquivos da pasta `src/electron` para `dist` |

| `electron:build` | Build completo para produção (.exe) |

| `postinstall` | Instala dependências nativas do Electron |

---

## 🧪 Build para Produção (.exe)

Para empacotar a aplicação como um executável (.exe) no Windows:

```bash

npm  run  electron:build

```

O pacote gerado estará disponível na pasta `dist/`.

---

## 📁 Estrutura Esperada

```

/

├── src/

│ ├── electron/ # scripts principais do Electron

│ └── renderer/ # código React + UI

├── dist/ # build do Electron

├── dist-react/ # build do Vite (renderer)

├── audiobookIcon.png # ícone do app

├── package.json

└── README.md

```

---

## 📦 Distribuição

O Electron Builder está configurado para gerar builds para Windows (`portable` e `msi`). Outros alvos podem ser adicionados facilmente no campo `build` do `package.json`.

---

## 🧱 Roadmap

- [x] Integração com IndexedDB via Dexie

- [x] Suporte a SQLite local

- [ ] Sincronização em nuvem (futuramente)

- [ ] Suporte a capítulos e marcadores

- [ ] Tema escuro/sistema

---

## 📄 Licença

Este projeto é **privado** no momento. Entre em contato com o autor para mais informações.

---

## 👤 Autor

Gabriel Feitosa

[LinkedIn](https://www.linkedin.com/in/gabriel-feitosa-b02b70186)

```



```
