import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false }, // Make optional for OAuth users
    projects: [
        {
            name: { type: String, required: false },
            createAt: { type: Date, default: Date.now },
            projectId: { type: String, required: false },
        }
    ]
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);
