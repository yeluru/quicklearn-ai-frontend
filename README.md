# QuickLearn.ai Frontend

## 🔥 Project Name
**QuickLearn.ai Frontend**

## 📘 Project Description
QuickLearn.ai is a modern, AI-powered learning assistant that lets users extract insights, summaries, notes, and quizzes from **any video, audio, text, or file input**. This frontend interface provides a seamless, distraction-free UI similar to ChatGPT, with multi-tab input/output and interactive chat components. It is designed to help users study, review, and generate context-aware learning materials — all in one place.

## 🎯 Features
- **4 Input Modes**: Supports Video URLs (YouTube), Audio uploads, File uploads (PDF/TXT), and raw Text.
- **3 Output Modes**: Transcript, AI-generated Notes, and Quiz Questions.
- **Interactive Q&A**: Chat interface for asking questions on the content.
- **Refresh & Regenerate**: Get alternate versions of summaries or quizzes.
- **Tab-based Navigation**: Quickly switch between content types and AI features.
- **Auto-scroll & Height Sync**: Modern layout with synchronized UI for left (content) and right (chat) containers.

## 🧠 Tech Stack
- **React.js** (frontend framework)
- **Tailwind CSS** (styling)
- **Axios** (API calls)
- **React-Markdown** (rendering AI answers)
- **KaTeX** (math rendering)
- **State Hooks & Refs** for interactivity

## 🗂️ Folder Structure (Key Parts)
```
src/
├── App.js              # Main frontend layout and logic
├── assets/             # Icons, images
├── components/         # UI components (input panels, chat, dropdowns)
├── utils/              # Helper functions
├── index.js            # Entry point
public/
├── index.html          # Root template
```

## ⚙️ Environment Variables (Frontend)
Make sure to define the backend API base URL in a `.env` file:
```
REACT_APP_API_BASE_URL=http://localhost:8000
```

## 🚀 To Run Locally
```bash
git clone https://github.com/yeluru/quicklearn-ai-frontend.git
cd quicklearn-ai-frontend
npm install
npm start
```
