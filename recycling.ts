export interface EnvironmentalImpact {
  co2SavedKg: number;
  waterSavedLiters: number;
  landfillDivertedGrams: number;
}

export interface FastHomeUpcycle {
  title: string;
  timeEstimateMinutes: number;
  difficulty: 'Easy' | 'Medium';
  toolsNeeded: string[];
  steps: string[];
  benefit: string;
}

export interface ReverseVendingInfo {
  isEligible: boolean;
  depositRefundValue: string;
  rvmKioskType: string;
  nearestKiosk: string;
  diyRevendingOption: {
    title: string;
    estimatedResaleValue: string;
    revendSteps: string[];
    marketplaceCategory: string;
  };
  instantRevendReward: {
    bonusCoins: number;
    cashRefund: string;
  };
}

export interface WasteAnalysisResult {
  itemName: string;
  wasteCategory: 'paper_cardboard' | 'plastics' | 'organics_food' | 'glass' | 'metals' | 'hazardous_ewaste' | 'general_landfill';
  binColor: string;
  confidenceScore: number;
  materialComposition: string;
  binInstructions: string[];
  contaminationWarning: string;
  environmentalImpact: EnvironmentalImpact;
  isNeighbourhoodWanted: boolean;
  neighbourhoodDemandReason: string;
  suggestedCommunityCategory: string;
  fastHomeUpcycle: FastHomeUpcycle;
  coinsReward: number;
  detectedVisualFeatures?: string;
  scannedImageUrl?: string;
  reverseVending?: ReverseVendingInfo;
}

export interface CommunityListing {
  id: string;
  title: string;
  category: string;
  quantity: string;
  condition: 'Like New' | 'Gently Used' | 'Clean Surplus';
  description: string;
  donorName: string;
  donorAvatar: string;
  distanceMiles: number;
  locationArea: string;
  pickupType: 'Porch Pickup' | 'Direct Handoff' | 'Curbside Box';
  status: 'Available' | 'Reserved' | 'Completed';
  claimedBy?: string;
  createdAt: string;
  imageUrl?: string;
  iconName: string;
  listingType?: 'Donation' | 'DIY Revend';
  revendPrice?: string;
}

export interface CommunityWantedRequest {
  id: string;
  title: string;
  category: string;
  quantityNeeded: string;
  requestedBy: string;
  distanceMiles: number;
  urgency: 'High' | 'Medium' | 'Normal';
  message: string;
  dateNeeded: string;
}

export interface CouponReward {
  id: string;
  title: string;
  partner: string;
  category: 'Groceries' | 'Cafe' | 'Transit' | 'Utility Credits' | 'Eco Store' | 'Tree Planting';
  coinCost: number;
  discountValue: string;
  description: string;
  icon: string;
  badge: string;
}

export interface UserCoupon {
  id: string;
  couponId: string;
  title: string;
  partner: string;
  discountValue: string;
  code: string;
  redeemedAt: string;
  expiresAt: string;
  used: boolean;
}

export interface SmartBin {
  id: string;
  name: string;
  type: 'Cardboard & Paper' | 'Plastics & Bottles' | 'Organic & Food' | 'Glass Depot' | 'Metals & E-Waste';
  location: string;
  district: string;
  fillPercentage: number;
  capacityKg: number;
  currentKg: number;
  lastEmptied: string;
  status: 'Normal' | 'Warning' | 'Full / Pickup Needed';
  sensorBatteryPercent: number;
}

export interface B2BDispatchOrder {
  id: string;
  binId: string;
  binType: string;
  location: string;
  fillLevel: number;
  weightEstKg: number;
  assignedFactory: string;
  status: 'Dispatched' | 'En Route' | 'Collected' | 'Processed';
  etaMinutes: number;
  truckId: string;
  dispatchedAt: string;
  divertedCo2Kg: number;
}
