
export enum AppStep {
  UPLOAD_PROFILE,
  GENERATE_BODY,
  UPLOAD_CLOTHES,
  GENERATE_OUTFIT,
  RESULTS,
}

export interface ClothingItem {
    id: number;
    name: string;
    imageUrl: string;
}

export interface UserProfile {
    age: number;
    gender: string;
}
