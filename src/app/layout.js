import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import localFont from 'next/font/local';
import "./globals.css";
import AllProvider from "./store/all";
import { NavigationProvider } from "./store/navigationContext";
import { AuthProvider } from "./store/authContext";
import Navbar from "./component/Navbar";
import NavigationWarningModal from "./component/NavigationWarningModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const roboto = localFont({
  src: './fonts/Roboto-Regular.ttf',
});

export const metadata = {
  title: "QuestionPaper - AI-Powered Question Paper Generator",
  description: "Create professional question papers with AI assistance, translation support, and customizable templates",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        // ✅ Add the roboto.className here to apply the font
        className={`${roboto.className} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AllProvider>
          <AuthProvider>
            <NavigationProvider>
              <Navbar />
              <NavigationWarningModal />
              <Toaster position="top-center" reverseOrder={false} />
              {children}
            </NavigationProvider>
          </AuthProvider>
        </AllProvider>
      </body>
    </html>
  );
}