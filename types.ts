export enum AppStep {
  UPLOAD_PROFILE,
  GENERATE_BODY,
  UPLOAD_CLOTHES,
  GENERATE_OUTFIT,
  RESULTS,
}

export interface ClothingItem {
  itemUrl: string;
  imageUrl: string;
  itemCaption: string;
  itemName: string;
}

export interface UserProfile {
  age: number;
  gender: string;
}
