import { Document, Types } from 'mongoose';
import { LocationType } from 'src/common/interfaces/location.interface';

export interface Customer extends Document {
    userId: Types.ObjectId
    locations: LocationType[]
}