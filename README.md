# QuickLearn.AI Frontend

## 🔥 Project Overview
**QuickLearn.AI Frontend** is a modern, AI-powered learning assistant that transforms any video, audio, text, or document into interactive learning materials. Built with React and Tailwind CSS, it provides a seamless, distraction-free interface for extracting insights, generating summaries, creating quizzes, and engaging in contextual conversations about your content.

## 🎯 Core Features

### 📹 Multi-Modal Input Support
- **Video URLs**: YouTube, TED, Vimeo, Instagram, TikTok, and more
- **Audio Files**: MP3, WAV, M4A, AAC, OGG, FLAC, WMA, AIFF
- **Documents**: PDF, DOCX, DOC, TXT files
- **Raw Text**: Direct text input with instant processing
- **Audio URLs**: Direct links to audio files and platforms (Spotify, SoundCloud, etc.)

### 🧠 AI-Powered Outputs
- **Transcript Extraction**: Get full transcripts with timestamps
- **Smart Summaries**: AI-generated notes and key insights
- **Quiz Generation**: Context-aware questions and answers
- **Interactive Chat**: Ask questions about your content
- **Suggested Questions**: AI-generated follow-up questions

### 🎨 User Experience
- **Modern UI**: Clean, responsive design with dark/light theme support
- **Real-time Processing**: Streaming responses with progress indicators
- **Tab-based Navigation**: Easy switching between input types and outputs
- **Action Buttons**: Download PDFs, copy content, refresh results
- **Responsive Design**: Works seamlessly on desktop and mobile

## 🧠 Tech Stack
- **React 18.2.0** - Modern React with hooks and functional components
- **Tailwind CSS 3.4.3** - Utility-first CSS framework
- **Axios 1.9.0** - HTTP client for API communication
- **React Markdown 10.1.0** - Markdown rendering with math support
- **KaTeX 0.16.22** - Math equation rendering
- **jsPDF 3.0.1** - PDF generation for downloads
- **React Icons 4.12.0** - Icon library
- **React Router DOM 6.22.3** - Client-side routing

## 📁 Project Structure
```
quicklearn-ai-frontend/
├── public/                    # Static assets
│   ├── index.html            # Main HTML template
│   ├── favicon.ico           # App icon
│   ├── manifest.json         # PWA manifest
│   └── robots.txt            # SEO robots file
├── src/                      # Source code
│   ├── components/           # Reusable UI components
│   │   ├── ChatPanel.js      # Interactive chat interface
│   │   ├── VideoPanel.js     # Video player component
│   │   ├── QuizPanel.js      # Quiz display component
│   │   └── MarkdownSummary.js # Markdown summary renderer
│   ├── pages/                # Page components
│   │   ├── About.js          # About page
│   │   ├── Contact.js        # Contact page
│   │   └── Privacy.js        # Privacy policy page
│   ├── App.js                # Main app component with routing
│   ├── MainApp.js            # Core application logic
│   ├── LandingPage.js        # Landing page component
│   ├── index.js              # React entry point
│   ├── input.css             # Tailwind CSS input
│   └── output.css            # Compiled CSS output
├── package.json              # Dependencies and scripts
├── tailwind.config.js        # Tailwind configuration
├── postcss.config.js         # PostCSS configuration
└── README.md                 # This file
```

## ⚙️ Environment Setup

### Prerequisites
- Node.js 16.0 or higher
- npm or yarn package manager
- Backend server running (see backend README)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd quicklearn-ai-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Create environment file**
   ```bash
   # Create .env file in the root directory
   touch .env
   ```

4. **Configure environment variables**
   ```env
   REACT_APP_API_BASE_URL=http://localhost:8000
   ```

5. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm start
```
The app will open at `http://localhost:3000`

### Production Build
```bash
npm run build
```
Creates optimized build in the `build/` directory

### Testing
```bash
npm test
```
Runs the test suite in interactive mode

### Linting
```bash
npm run lint
```
Runs ESLint to check code quality

### CSS Development
```bash
npm run build:css
```
Watches and compiles Tailwind CSS

## 🎮 Usage Guide

### Getting Started

1. **Choose Input Type**
   - **Video**: Paste YouTube or other video URLs
   - **Audio**: Upload audio files or paste audio URLs
   - **File**: Upload documents (PDF, DOCX, TXT)
   - **Text**: Type or paste text directly

2. **Process Content**
   - Click "Analyze" for URLs
   - Click "Upload & Extract" for files
   - Click "Submit Text" for text input

3. **Explore Outputs**
   - **Transcript**: View extracted text with timestamps
   - **Notes**: Read AI-generated summaries
   - **Quiz**: Test knowledge with generated questions
   - **Chat**: Ask questions about the content

### Feature Details

#### Video Processing
- Supports YouTube, TED, Vimeo, Instagram, TikTok
- Extracts transcripts with timestamps
- Shows embedded video player
- Generates video-specific summaries

#### Audio Processing
- Handles multiple audio formats
- Supports direct audio URLs
- Processes large files with progress tracking
- Generates audio-specific insights

#### Document Processing
- PDF, DOCX, DOC, TXT support
- Extracts text content
- Generates document summaries
- Creates context-aware quizzes

#### Text Input
- Direct text processing
- Instant summary generation
- No transcript step needed
- Streamlined workflow

#### Interactive Features
- **Download**: Save content as PDF
- **Copy**: Copy formatted content to clipboard
- **Refresh**: Regenerate AI outputs
- **Chat**: Ask follow-up questions
- **Suggested Questions**: AI-generated prompts

## 🎨 UI Components

### MainApp.js
The core application component that handles:
- Input type switching
- API communication
- State management
- Real-time updates
- File uploads
- Streaming responses

### ChatPanel.js
Interactive chat interface with:
- Real-time message streaming
- Suggested questions dropdown
- Message history
- Markdown rendering
- Math equation support

### VideoPanel.js
Video player component with:
- Embedded video display
- Video summary overlay
- Responsive design
- Platform-specific handling

### MarkdownSummary.js
Summary renderer with:
- Markdown parsing
- Math equation rendering
- Syntax highlighting
- Responsive typography

## 🔧 Configuration

### Environment Variables
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `REACT_APP_API_BASE_URL` | Backend API URL | Yes | `http://localhost:8000` |

### Tailwind Configuration
The app uses a custom Tailwind configuration with:
- Custom color palette
- Typography plugin
- Responsive breakpoints
- Custom animations

### Theme Support
- **Light Theme**: Default theme with clean, modern design
- **Dark Theme**: Dark mode with purple accents
- **Auto-switching**: Toggle between themes

## 🚨 Troubleshooting

### Common Issues

#### 1. Backend Connection Errors
**Error**: `Failed to fetch` or `Network error`
**Solution**:
- Ensure backend server is running
- Check `REACT_APP_API_BASE_URL` in `.env`
- Verify CORS settings on backend
- Check network connectivity

#### 2. File Upload Issues
**Error**: `File upload failed` or `Unsupported file type`
**Solution**:
- Check file size (max 100MB)
- Ensure file format is supported
- Verify file is not corrupted
- Check browser console for errors

#### 3. YouTube URL Issues
**Error**: `Invalid URL` or `No transcript found`
**Solution**:
- Ensure video has captions/subtitles
- Check if video is publicly accessible
- Try with a different YouTube video
- Verify URL format

#### 4. Build Errors
**Error**: `Module not found` or `Build failed`
**Solution**:
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear npm cache: `npm cache clean --force`
- Check Node.js version compatibility
- Verify all dependencies are installed

#### 5. Styling Issues
**Error**: `CSS not loading` or `Styles missing`
**Solution**:
- Run `npm run build:css` to compile Tailwind
- Check `tailwind.config.js` configuration
- Verify PostCSS setup
- Clear browser cache

### Performance Optimization

#### 1. Large File Handling
- Implement file size validation
- Add progress indicators
- Use streaming for large uploads
- Implement chunked processing

#### 2. API Optimization
- Implement request caching
- Add request debouncing
- Use optimistic updates
- Implement error retry logic

#### 3. Bundle Optimization
- Code splitting for routes
- Lazy loading for components
- Tree shaking for unused code
- Image optimization

## 🧪 Testing

### Manual Testing Checklist
- [ ] Video URL processing (YouTube, TED, etc.)
- [ ] Audio file upload and processing
- [ ] Document upload and extraction
- [ ] Text input and processing
- [ ] Transcript generation with timestamps
- [ ] Summary generation
- [ ] Quiz generation
- [ ] Chat functionality
- [ ] Download PDF functionality
- [ ] Copy to clipboard
- [ ] Theme switching
- [ ] Responsive design
- [ ] Error handling

### Automated Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## 🔒 Security Considerations

### Frontend Security
- Input validation and sanitization
- XSS prevention
- CSRF protection
- Secure file handling

### API Security
- HTTPS in production
- API key protection
- Request validation
- Error message sanitization

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Various Platforms

#### Vercel
```bash
npm install -g vercel
vercel
```

#### Netlify
```bash
npm run build
# Upload build/ directory to Netlify
```

#### GitHub Pages
```bash
npm run build
# Push build/ to gh-pages branch
```

#### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Analytics and Monitoring

### Performance Monitoring
- Implement React Profiler
- Monitor bundle size
- Track API response times
- Monitor user interactions

### Error Tracking
- Implement error boundaries
- Add error logging
- Monitor JavaScript errors
- Track API failures

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

### Development Guidelines
- Follow React best practices
- Use functional components with hooks
- Maintain consistent code style
- Add proper error handling
- Write meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the backend README
3. Open an issue on GitHub
4. Contact the development team

## 🔗 Related Links

- [Backend Repository](../README.md)
- [API Documentation](../README.md#api-documentation)
- [Deployment Guide](../DEPLOYMENT.md)
- [Live Demo](https://your-demo-url.com)

---

**QuickLearn.AI Frontend** - Transforming learning through intelligent content analysis and interaction.
