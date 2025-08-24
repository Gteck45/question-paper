import mongoose from "mongoose";

const userProjectSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        content: []
    },
    { timestamps: true }
);

userProjectSchema.index({ userId: 1, content: 1 });

const UserProject =
    mongoose.models.UserProject || mongoose.model("UserProject", userProjectSchema);

export default UserProject;
