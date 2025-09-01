# Question Paper Generator

A modern, AI-powered web application for creating, editing, and managing question papers. Built with Next.js 15, featuring Google OAuth authentication, AI-assisted content generation, and PDF export capabilities.

## 🚀 Features

- **AI-Powered Generation**: Generate question papers using Google Generative AI
- **Dual Authentication**: Support for both email/password and Google OAuth
- **Project Management**: Create, organize, and manage multiple question paper projects
- **Real-time Editing**: Interactive editor with AI chat assistance
- **PDF Export**: Generate professional PDFs using Puppeteer
- **Translation Support**: Instant translation to multiple languages
- **Responsive Design**: Modern UI built with Tailwind CSS and Framer Motion
- **Secure Authentication**: JWT-based authentication with HTTP-only cookies

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: NextAuth.js with Google OAuth
- **AI Integration**: Google Generative AI
- **PDF Generation**: Puppeteer
- **Email**: Nodemailer
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+
- MongoDB database
- Google Cloud Project (for OAuth and AI)
- Gmail account (for email functionality)

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Gteck45/question-paper.git
   cd question-paper
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/question-paper

   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-here

   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret

   # Google AI
   GOOGLE_AI_API_KEY=your-google-ai-api-key

   # Email Configuration
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password

   # JWT Secret
   JWT_SECRET=your-jwt-secret-here
   ```

4. **Google Cloud Setup**
   - Create a Google Cloud Project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Configure authorized redirect URIs: `http://localhost:3000/api/auth/google`

5. **MongoDB Setup**
   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGODB_URI` in your `.env` file

## 🚀 Running the Application

1. **Development Mode**
   ```bash
   npm run dev
   ```

2. **Production Build**
   ```bash
   npm run build
   npm start
   ```

3. **Linting**
   ```bash
   npm run lint
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

### User Authentication
- **Sign Up**: Create account with email/password or Google OAuth
- **Login**: Access existing account
- **Password Reset**: OTP-based password recovery

### Project Management
- Create new question paper projects
- Rename and delete existing projects
- Organize projects in a clean dashboard

### Question Paper Generation
- Generate papers from subject and marks
- Upload files for content-based generation
- Use custom prompts for specific requirements
- Enhance existing question papers

### AI Features
- Interactive AI chat for content assistance
- Real-time question generation
- Content translation

### Export Options
- Generate PDFs with professional formatting
- Print directly from the application
- Share digitally

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth.js handler
- `POST /api/signup` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `POST /api/forgot-password/send-otp` - Send password reset OTP
- `POST /api/forgot-password/verify-otp` - Verify OTP
- `POST /api/forgot-password/reset-password` - Reset password

### Projects
- `GET /api/usersprojects` - Get user projects
- `POST /api/usersprojects` - Create new project
- `PUT /api/usersprojects` - Rename project
- `DELETE /api/usersprojects` - Delete project

### Question Papers
- `POST /api/generateai` - Generate question paper
- `GET /api/projectedit/[projectId]` - Get project details
- `PUT /api/projectedit/[projectId]` - Update project
- `POST /api/generate-pdf` - Generate PDF

## 📁 Project Structure

```
question-paper/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── component/        # React components
│   │   ├── dashboard/        # Dashboard page
│   │   ├── login/           # Login page
│   │   ├── signup/          # Signup page
│   │   ├── forgot-password/ # Password reset
│   │   ├── question-paper/  # Main application
│   │   └── store/           # Context providers
│   ├── fonts/               # Custom fonts
│   └── lib/                 # Database connections
├── models/                  # MongoDB models
├── public/                  # Static assets
└── lib/                     # Utility functions
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Google Generative AI](https://ai.google.dev/) - AI capabilities
- [MongoDB](https://www.mongodb.com/) - Database
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [NextAuth.js](https://next-auth.js.org/) - Authentication

## 📞 Support

For support, email support@questionpaper.com or create an issue in this repository.

---

Built with ❤️ using Next.js
