# VibeKnowing Frontend

## 🔥 Project Overview
**VibeKnowing Frontend** is a modern, AI-powered learning assistant that transforms any video, audio, text, or document into interactive learning materials. Built with React and Tailwind CSS, it provides a seamless, distraction-free interface for extracting insights, generating summaries, creating quizzes, and engaging in contextual conversations about your content.

## 🎯 Core Features

### 📹 Multi-Modal Input Support
- **Video URLs**: YouTube, TED, Vimeo, Instagram, TikTok, and more
- **Audio Files**: MP3, WAV, M4A, AAC, OGG, FLAC, WMA, AIFF
- **Documents**: PDF, DOCX, DOC, TXT files
- **Raw Text**: Direct text input with instant processing
- **Audio URLs**: Direct links to audio files and platforms (Spotify, SoundCloud, etc.)
- **Website URLs**: Scrape and analyze web content

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
- **Custom Domain**: Live at [vibeknowing.com](https://vibeknowing.com)

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
- Worker service running (see worker README)

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
   REACT_APP_API_BASE_URL=https://your-backend-url.onrender.com
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
   - **URL**: Paste YouTube, Vimeo, Instagram, TikTok, TED, or website URLs
   - **File**: Upload audio files or documents (PDF, DOCX, TXT)
   - **Text**: Type or paste text directly

2. **Process Content**
   - Click "Analyze" for URLs
   - Click "Upload & Extract" for files
   - Click "Submit Text" for text input

3. **Explore Outputs**
   - **Transcript**: View extracted text with timestamps
   - **Summary**: Read AI-generated summaries
   - **Quiz**: Test knowledge with generated questions
   - **Chat**: Ask questions about the content

### Feature Details

#### Video Processing
- Supports YouTube, TED, Vimeo, Instagram, TikTok
- Extracts transcripts with timestamps
- Shows embedded video player
- Generates video-specific summaries
- Handles playlists and multiple videos

#### Audio Processing
- Handles multiple audio formats (MP3, WAV, M4A, AAC, OGG, FLAC, WMA, AIFF)
- Supports direct audio URLs
- Processes large files with progress tracking
- Generates audio-specific insights

#### Document Processing
- PDF, DOCX, DOC, TXT support
- Extracts text content
- Generates document summaries
- Creates context-aware quizzes

#### Website Scraping
- Scrapes web content from URLs
- Extracts text and structure
- Generates summaries from web content
- Handles multi-page websites

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

#### 1. API Connection Errors
**Error**: `Failed to fetch` or network errors
**Solution**:
- Verify backend is running and accessible
- Check `REACT_APP_API_BASE_URL` environment variable
- Ensure CORS is properly configured on backend

#### 2. File Upload Issues
**Error**: `File upload failed`
**Solution**:
- Check file size limits (100MB max)
- Ensure file format is supported
- Verify backend file processing is working

#### 3. Video Processing Issues
**Error**: `Failed to fetch transcript`
**Solution**:
- Ensure video has captions/subtitles
- Check if video is publicly accessible
- Verify worker service is running
- Check ngrok tunnel is active

#### 4. Build Issues
**Error**: `Build failed`
**Solution**:
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version (16+ required)
- Verify all dependencies are compatible

#### 5. Styling Issues
**Error**: `CSS not loading properly`
**Solution**:
- Run `npm run build:css` to rebuild Tailwind
- Clear browser cache
- Check Tailwind configuration

## 🚀 Deployment

### Render Deployment (Recommended)

1. **Connect Repository**
   - Link your GitHub repository to Render
   - Select the `quicklearn-ai-frontend` directory

2. **Configure Build Settings**
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
   - **Environment**: `Static Site`

3. **Set Environment Variables**
   ```
   REACT_APP_API_BASE_URL=https://your-backend-url.onrender.com
   ```

4. **Deploy**
   - Click "Create Static Site"
   - Render will automatically build and deploy

### Other Platforms

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
# Push build/ directory to gh-pages branch
```

## 🔒 Security Considerations

### Environment Variables
- Never commit API keys to version control
- Use environment variables for sensitive data
- Validate API URLs in production

### Content Security
- Validate file uploads
- Sanitize user inputs
- Implement proper error handling

### CORS Configuration
- Configure allowed origins properly
- Use HTTPS in production
- Validate cross-origin requests

## 📊 Performance Optimization

### Build Optimization
- Use production build for deployment
- Enable code splitting
- Optimize bundle size

### Runtime Optimization
- Implement lazy loading
- Use React.memo for expensive components
- Optimize re-renders

### Caching Strategy
- Cache API responses
- Implement service workers
- Use browser caching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the API documentation
3. Open an issue on GitHub
4. Contact the development team

---

**VibeKnowing Frontend** - Empowering learning through AI-powered content analysis and interaction.
