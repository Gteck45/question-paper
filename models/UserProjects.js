import mongoose from "mongoose";

// Option schema (recursive)
const optionSchema = new mongoose.Schema(
    {
        // THE FIX: Change Number to String to allow "a", "b", "i", "ii", etc.
        index: { type: String, default: "a" },
        styles: { type: [String], default: [] },
        text: { type: String, default: "" },
        // This 'marks' field was also missing from your optionSchema
        marks: { type: Number, default: 0 },
        options: { type: [mongoose.Schema.Types.Mixed], default: [] },
    },
    { _id: false }
);

// Question schema
const questionSchema = new mongoose.Schema(
    {
        index: { type: Number, default: 1 },
        styles: { type: [String], default: [] },
        text: { type: String, default: "" },
        marks: { type: Number, default: 0 },
        options: { type: [optionSchema], default: [] },
    },
    { _id: false }
);

// Header schema – flexible: only 1 key + styles
const headerSchema = new mongoose.Schema(
    {
        // Instead of fixed fields, we allow mixed so it can be
        // { courseName: "name", styles: [...] }
        // { examinationType: "type", styles: [...] }
        // etc.
    },
    { _id: false, strict: false } // allow dynamic keys
);

// Content schema
const contentSchema = new mongoose.Schema(
    {
        headers: { type: [headerSchema], default: [] },
        questions: { type: [questionSchema], default: [] },
    },
    { _id: false }
);

// User project schema
const userProjectSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: { type: [contentSchema], default: [] },
    },
    { timestamps: true }
);

userProjectSchema.index({ userId: 1 });

const UserProject =
    mongoose.models.UserProject ||
    mongoose.model("UserProject", userProjectSchema);

export default UserProject;
