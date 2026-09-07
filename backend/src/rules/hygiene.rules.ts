export interface HygieneChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'protection' | 'cleanliness' | 'personal' | 'water' | 'waste' | 'storage';
  mandatory: boolean;
}

/**
 * Controlled hygiene checklist rules based on FSSAI Schedule 4 (Street Food Vendors & Petty FBOs).
 * IMPORTANT:
 * 1. OpenAI does NOT invent or generate these rules.
 * 2. Completing these items is part of an independent civic UX prototype and does NOT confer official certification.
 */
export const CONTROLLED_HYGIENE_CHECKLIST: HygieneChecklistItem[] = [
  {
    id: 'HY001',
    title: 'Food Protection',
    description: 'Keep all prepared foods and cooked items covered in clean food-grade containers to protect against dust, flies, and air contaminants.',
    category: 'protection',
    mandatory: true,
  },
  {
    id: 'HY002',
    title: 'Clean Preparation Area',
    description: 'Maintain clean, wiped, and sanitized cooking surfaces, cutting boards, and serving utensils throughout daily operation.',
    category: 'cleanliness',
    mandatory: true,
  },
  {
    id: 'HY003',
    title: 'Personal & Hand Hygiene',
    description: 'Wear clean clothes or an apron, tie back hair, and wash hands with soap and water before handling any food item.',
    category: 'personal',
    mandatory: true,
  },
  {
    id: 'HY004',
    title: 'Safe Potable Water',
    description: 'Use only verified potable drinking water (municipal treated tap or sealed water jars) for food preparation, tea brewing, and dishwashing.',
    category: 'water',
    mandatory: true,
  },
  {
    id: 'HY005',
    title: 'Covered Waste Management',
    description: 'Provide an accessible covered or pedal-operated dustbin lined with a bag for customer and cooking waste, emptied daily.',
    category: 'waste',
    mandatory: true,
  },
  {
    id: 'HY006',
    title: 'Protection from Contamination',
    description: 'Store raw materials and cleaning chemicals strictly separated from cooked or ready-to-serve food products.',
    category: 'storage',
    mandatory: true,
  },
];

export const VALID_HYGIENE_ITEM_IDS = new Set(CONTROLLED_HYGIENE_CHECKLIST.map((i) => i.id));

export const getHygieneChecklistForBusiness = (
  _kindOfBusiness?: string
): HygieneChecklistItem[] => {
  // Returns the controlled baseline checklist for petty food & street vendors
  return CONTROLLED_HYGIENE_CHECKLIST;
};