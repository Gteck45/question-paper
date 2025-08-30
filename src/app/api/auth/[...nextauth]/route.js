import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "../../../../../lib/mongodb"
import jwt from "jsonwebtoken"
import { connectDB } from "../../../../../lib/mongoose"
import User from "../../../../../models/User"

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // First time login with Google
        await connectDB()
        let user = await User.findOne({ email: profile.email })
        if (!user) {
          user = await User.create({ email: profile.email, password: null }) // No password for OAuth
        }
        token._id = user._id
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token._id
      return session
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      // After sign in, create JWT and set cookie
      if (account.provider === "google") {
        const token = jwt.sign({ _id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" })
        // Note: Can't set cookies here directly, need to handle in client
      }
    },
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }