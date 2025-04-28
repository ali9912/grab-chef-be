export type LocationType = {
  name: string;
  address?: string;
  key?: string;
  location?: { coordinates: number[]; type?: 'Point' }; //long/lat
};
