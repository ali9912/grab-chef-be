import mongoose from "mongoose";
import { AchievementEnum } from "../interfaces/achievement.interface";

const AchievementSchema = new mongoose.Schema({
    type: { type: String, enum: Object.values(AchievementEnum), required: true },
    qty: {
        type: Number,
        required: true,
        default: 1,
    }
})

export const AchievementsSchema = new mongoose.Schema({
    label: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    conditions: [AchievementSchema]
});
