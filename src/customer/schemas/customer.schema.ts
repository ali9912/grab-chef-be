import * as mongoose from 'mongoose';
import { LocationSchema } from 'src/common/schemas/location.schema';

export const CustomerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    locations: [LocationSchema],
});
