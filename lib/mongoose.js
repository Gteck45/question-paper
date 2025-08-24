import mongoose from "mongoose";

export async function connectDB() {
    try {
        if (mongoose.connection.readyState === 1) {
            console.log("✅ Already connected to MongoDB");
            return;
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ MongoDB connected");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
    }
}
