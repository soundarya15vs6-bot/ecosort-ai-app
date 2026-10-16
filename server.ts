import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/live' });
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Mock database for B2B dispatch logs & smart bins
interface DispatchRequest {
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

let dispatchLog: DispatchRequest[] = [
  {
    id: 'DISP-8921',
    binId: 'BIN-CENTRAL-04',
    binType: 'Cardboard & Paper Compactor',
    location: 'District 4 - Maple Community Plaza',
    fillLevel: 94,
    weightEstKg: 420,
    assignedFactory: 'Metro Fiber Re-Pulp & Paper Corp',
    status: 'En Route',
    etaMinutes: 12,
    truckId: 'EV-TRUCK #408',
    dispatchedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    divertedCo2Kg: 395,
  },
  {
    id: 'DISP-8919',
    binId: 'BIN-WEST-02',
    binType: 'Rigid Plastics (PET / HDPE)',
    location: 'Westside Residential Hub',
    fillLevel: 88,
    weightEstKg: 260,
    assignedFactory: 'EcoPolymers Circular Logistics Ltd',
    status: 'Processed',
    etaMinutes: 0,
    truckId: 'EV-TRUCK #105',
    dispatchedAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    divertedCo2Kg: 310,
  },
];

// Helper for fallback waste identification
function getFallbackWasteAnalysis(queryText?: string) {
  const query = (queryText || 'cardboard box').toLowerCase();

  if (query.includes('cardboard') || query.includes('box') || query.includes('carton')) {
    return {
      itemName: 'Corrugated Cardboard Box',
      wasteCategory: 'paper_cardboard',
      binColor: 'Blue Bin (Paper & Cardboard)',
      confidenceScore: 97,
      materialComposition: '100% Unbleached Kraft Paper pulp fiber',
      binInstructions: [
        'Break down and flatten the box completely to preserve bin volume',
        'Peel away heavy plastic tape or packing labels if easily removable',
        'Ensure the box is dry and free of pizza grease or food contamination',
      ],
      contaminationWarning: 'Cardboard soaked in cooking oil or food scraps belongs in Green Organic Compost or General Waste, not the Blue bin.',
      environmentalImpact: {
        co2SavedKg: 0.85,
        waterSavedLiters: 14.2,
        landfillDivertedGrams: 450,
      },
      isNeighbourhoodWanted: true,
      neighbourhoodDemandReason: 'High community demand! 3 neighbours within 0.8 miles are actively seeking clean boxes for moving & package shipping.',
      suggestedCommunityCategory: 'Moving Boxes & Cardboard',
      fastHomeUpcycle: {
        title: 'Desk Drawer Organizer & Cable Caddy',
        timeEstimateMinutes: 8,
        difficulty: 'Easy',
        toolsNeeded: ['Scissors or utility knife', 'Ruler', 'Tape or glue'],
        steps: [
          'Measure the height of your desk drawer or bookshelf shelf.',
          'Cut the cardboard box flaps into rectangular dividers to fit the drawer length.',
          'Slot the dividers perpendicular into each other by making small half-way cuts.',
          'Organize cables, pens, tools, or art supplies neatly!',
        ],
        benefit: 'Replaces $15 plastic organizers and avoids 450g of paper waste instantly.',
      },
      coinsReward: 25,
      reverseVending: {
        isEligible: true,
        depositRefundValue: '$0.45 / kg clean baled cardboard at Municipal Depot',
        rvmKioskType: 'Smart Cardboard Compactor RVM Hub',
        nearestKiosk: 'Oakridge Community Recycle Center RVM - 0.4 miles away',
        diyRevendingOption: {
          title: 'DIY Resale: Bundle 5-10 Moving Boxes for $10 to Neighbors',
          estimatedResaleValue: '$10 - $15',
          revendSteps: [
            'Flatten and group 5-10 boxes by size (small, medium, large)',
            'Tie neatly with jute twine or tape into a bundle',
            'List on Community Exchange Board for neighbor relocation pickup',
          ],
          marketplaceCategory: 'Moving Supplies',
        },
        instantRevendReward: {
          bonusCoins: 35,
          cashRefund: '$0.50',
        },
      },
    };
  }

  if (query.includes('plastic') || query.includes('bottle') || query.includes('water bottle')) {
    return {
      itemName: 'PET Plastic Beverage Bottle',
      wasteCategory: 'plastics',
      binColor: 'Yellow / Blue Bin (Recyclable Containers)',
      confidenceScore: 95,
      materialComposition: 'Polyethylene Terephthalate (PET / Resin Code #1)',
      binInstructions: [
        'Empty all liquid contents and give a quick rinse with cold water',
        'Crush the bottle flat to minimize transport volume',
        'Leave the plastic cap screwed on so it does not jam sorting machinery',
      ],
      contaminationWarning: 'Do not place plastic bags, cling film, or black plastic in standard curbside bins without checking local rules.',
      environmentalImpact: {
        co2SavedKg: 0.42,
        waterSavedLiters: 4.8,
        landfillDivertedGrams: 45,
      },
      isNeighbourhoodWanted: true,
      neighbourhoodDemandReason: 'Local community garden members collect clean clear bottles for greenhouse mini-cloches and seed starters.',
      suggestedCommunityCategory: 'Gardening & Planters',
      fastHomeUpcycle: {
        title: 'Self-Watering Kitchen Herb Planter',
        timeEstimateMinutes: 6,
        difficulty: 'Easy',
        toolsNeeded: ['Clean bottle', 'Scissors', 'Cotton string/strip of cloth', 'Potting soil & herb seed'],
        steps: [
          'Cut the bottle horizontally in half with scissors.',
          'Invert the top funnel half and place it upside-down into the bottom reservoir base.',
          'Thread a piece of cotton yarn through the bottle spout to act as a capillary wick.',
          'Fill top with soil and plant basil/mint. Fill bottom with water for self-watering!',
        ],
        benefit: 'Keeps kitchen herbs thriving automatically for up to 10 days.',
      },
      coinsReward: 20,
      reverseVending: {
        isEligible: true,
        depositRefundValue: '$0.10 deposit refund per bottle at Smart RVM',
        rvmKioskType: 'Automated Container Reverse Vending Machine (RVM)',
        nearestKiosk: 'Green Earth Market Automated Bottle RVM - 0.3 miles away',
        diyRevendingOption: {
          title: 'DIY Resale: Upcycle into Self-Watering Planters & Sell for $6',
          estimatedResaleValue: '$6 - $8',
          revendSteps: [
            'Cut and invert bottle as self-watering planter',
            'Add potting mix and culinary mint or basil cutting',
            'Offer on Community Board / Local Green Market for $6',
          ],
          marketplaceCategory: 'Garden & Planters',
        },
        instantRevendReward: {
          bonusCoins: 30,
          cashRefund: '$0.10',
        },
      },
    };
  }

  if (query.includes('glass') || query.includes('jar')) {
    return {
      itemName: 'Clear Glass Food Jar with Metal Lid',
      wasteCategory: 'glass',
      binColor: 'Teal / Blue Bin (Glass Containers)',
      confidenceScore: 98,
      materialComposition: '100% Infinitely Recyclable Soda-Lime Silica Glass',
      binInstructions: [
        'Rinse sauce or jam residue with warm water',
        'Remove metal lid (recycle metal lid separately or together depending on local depot)',
        'Do not break or crush glass containers when placing in bin',
      ],
      contaminationWarning: 'Ceramics, Pyrex heat-resistant glass, and mirror shards melt at higher temperatures and contaminate container glass.',
      environmentalImpact: {
        co2SavedKg: 0.65,
        waterSavedLiters: 8.5,
        landfillDivertedGrams: 320,
      },
      isNeighbourhoodWanted: true,
      neighbourhoodDemandReason: 'Top requested item! Local home cooks and jam makers regularly ask for reusable 250ml-500ml jars.',
      suggestedCommunityCategory: 'Glass Jars & Storage',
      fastHomeUpcycle: {
        title: 'Spice Shaker or Ambient Tea-Light Lantern',
        timeEstimateMinutes: 5,
        difficulty: 'Easy',
        toolsNeeded: ['Clean dry jar', 'Parchment paper or twine', 'Tea light or bulk spices'],
        steps: [
          'Soak in warm soapy water for 3 minutes to effortlessly peel off paper label.',
          'Dry thoroughly.',
          'Wrap rustic jute twine around the neck for a warm rustic candle lantern, or label for pantry spice refills.',
        ],
        benefit: 'Eliminates buying new glassware and keeps airtight pantry freshness.',
      },
      coinsReward: 25,
    };
  }

  if (query.includes('food') || query.includes('banana') || query.includes('apple') || query.includes('vegetable') || query.includes('peel') || query.includes('coffee')) {
    return {
      itemName: 'Organic Kitchen Food Scraps & Peels',
      wasteCategory: 'organics_food',
      binColor: 'Green Bin (Organics & Compost)',
      confidenceScore: 99,
      materialComposition: '100% Biodegradable Compostable Biomass',
      binInstructions: [
        'Remove produce stickers, twist ties, or plastic packaging completely',
        'Wrap in newspaper or certified BPI compostable liner if required',
        'Deposit promptly into the green bin to prevent anaerobic odor',
      ],
      contaminationWarning: 'Never include plastic cutlery, pet feces, or chemically treated wood in municipal green bins.',
      environmentalImpact: {
        co2SavedKg: 1.15,
        waterSavedLiters: 2.2,
        landfillDivertedGrams: 380,
      },
      isNeighbourhoodWanted: true,
      neighbourhoodDemandReason: 'Nearby community composters and permaculture urban gardeners accept fruit & vegetable trimmings.',
      suggestedCommunityCategory: 'Gardening & Compost',
      fastHomeUpcycle: {
        title: 'Natural Citrus Surface Cleaner or Soil Conditioner',
        timeEstimateMinutes: 4,
        difficulty: 'Easy',
        toolsNeeded: ['White vinegar', 'Glass jar', 'Fruit peels'],
        steps: [
          'Place citrus peels into a glass jar and cover with distilled white vinegar.',
          'Let infuse for 1-2 weeks in a cool pantry.',
          'Strain liquid into a spray bottle for an all-natural grease-cutting countertop cleaner!',
        ],
        benefit: 'Replaces chemical household cleaners and repurposes organic rind oils.',
      },
      coinsReward: 20,
    };
  }

  // Default general recyclable item
  return {
    itemName: 'Consumer Packaging / Dry Recyclable Item',
    wasteCategory: 'paper_cardboard',
    binColor: 'Blue Bin (Curbside Recyclables)',
    confidenceScore: 91,
    materialComposition: 'Mixed Recyclable Packaging Material',
    binInstructions: [
      'Empty any leftover fluids or food remnants',
      'Separate composite layers (e.g. foil film from paper)',
      'Place loosely in your municipal recycling container',
    ],
    contaminationWarning: 'When in doubt, ensure the item is clean and dry. Moisture degrades paper recycling fibers.',
    environmentalImpact: {
      co2SavedKg: 0.52,
      waterSavedLiters: 6.5,
      landfillDivertedGrams: 180,
    },
    isNeighbourhoodWanted: true,
    neighbourhoodDemandReason: 'Neighborhood crafters and school projects frequently seek clean cartons and packaging materials.',
    suggestedCommunityCategory: 'Packaging & Craft Materials',
    fastHomeUpcycle: {
      title: 'Compact Desktop Cable Wrap or Tag',
      timeEstimateMinutes: 5,
      difficulty: 'Easy',
      toolsNeeded: ['Scissors'],
      steps: [
        'Trim into a 2x10cm strip.',
        'Notch both ends with small triangular cuts.',
        'Wrap around headphone or charging cables to prevent messy tangles.',
      ],
      benefit: 'Instantly organizes charging cords without buying Velcro or plastic ties.',
    },
    coinsReward: 20,
  };
}

function parseJsonSafely(raw: string): any {
  if (!raw) throw new Error('Empty response from model');
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned.trim());
}

const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
];

// 1. Identify Waste Endpoint
app.post('/api/identify-waste', async (req, res) => {
  try {
    const { imageBase64, mimeType, queryText } = req.body;

    // Check if Gemini API key exists
    if (!process.env.GEMINI_API_KEY) {
      const fallback = getFallbackWasteAnalysis(queryText);
      return res.json({ success: true, data: fallback, source: 'smart_fallback' });
    }

    const prompt = `You are EcoSort AI, a specialized municipal recycling, anti-contamination, and circular economy vision system.
You MUST carefully examine the SPECIFIC trash item shown in the user's uploaded photograph${queryText ? ` (user query note: "${queryText}")` : ''}.
Do NOT output a generic canned response. Analyze the EXACT visual cues from the photograph: shape, color, transparency, branding/labels, creases, grease/food residues, cap/lid type, material thickness.

Respond strictly in valid JSON without markdown wrapping:
{
  "itemName": "Precise detected item name (e.g. 'Crushed Coca-Cola Aluminium Can 330ml', 'Clear Glass Pasta Sauce Jar with Red Twist Metal Lid', 'Greasy Domino\\'s Cardboard Pizza Box with Cheese Stains', 'Bic Plastic Ballpoint Pen with Blue Cap', 'Rechargeable 18650 Li-ion Battery')",
  "detectedVisualFeatures": "Exact 1-2 sentence description of visual cues identified directly in this user image (e.g. 'Cylindrical aluminium can with red and white printed branding, crushed at midsection with pull-tab open')",
  "wasteCategory": "one of: paper_cardboard | plastics | organics_food | glass | metals | hazardous_ewaste | general_landfill",
  "binColor": "Exact municipal bin recommendation (e.g. 'Blue Bin (Paper & Cardboard)', 'Green Bin (Compost & Organics)', 'Yellow Bin (Plastics & Metals)', 'Teal / Blue Bin (Glass Containers)', 'Grey / Black Bin (Landfill)', 'Red Depot (Hazardous & E-Waste)')",
  "confidenceScore": 96,
  "materialComposition": "Specific material breakdown (e.g. 'Food-grade Aluminium Alloy 3104 / 5182', 'Soda-Lime Silica Glass + Tinplate Steel Cap', 'Corrugated unbleached Kraft paperboard')",
  "binInstructions": [
    "Step 1: specific preparation step for this exact item",
    "Step 2: specific preparation step for this exact item",
    "Step 3: specific preparation step for this exact item"
  ],
  "contaminationWarning": "Direct, specific contamination warning for this type of waste in municipal bins",
  "environmentalImpact": {
    "co2SavedKg": 0.48,
    "waterSavedLiters": 5.4,
    "landfillDivertedGrams": 165
  },
  "isNeighbourhoodWanted": true,
  "neighbourhoodDemandReason": "Specific reason why neighbors, gardeners, crafters, or movers could reuse this item directly instead of throwing away",
  "suggestedCommunityCategory": "one of: Moving Boxes & Cardboard | Glass Jars & Storage | Gardening & Compost | Craft & Fabrics | Wood & Pallets | Packaging & Bubblewrap",
  "fastHomeUpcycle": {
    "title": "Creative 5-15 minute home DIY upcycling project tailored to this exact item",
    "timeEstimateMinutes": 8,
    "difficulty": "Easy",
    "toolsNeeded": ["Scissors", "Ruler", "Twine or Glue"],
    "steps": [
      "Step 1: Prep and trim...",
      "Step 2: Fold / shape / assemble...",
      "Step 3: Finish and utilize..."
    ],
    "benefit": "Specific utility and money saved"
  },
  "reverseVending": {
    "isEligible": true,
    "depositRefundValue": "$0.10 deposit refund per unit at municipal RVM",
    "rvmKioskType": "Automated Smart Reverse Vending Machine (RVM)",
    "nearestKiosk": "Green Earth Supermarket RVM Kiosk - 0.3 miles away",
    "diyRevendingOption": {
      "title": "DIY Resale: Upcycle into functional home decor, organizer, or planter for local sale",
      "estimatedResaleValue": "$6 - $14",
      "revendSteps": [
        "Clean, sanitize, and remove labels or grease",
        "Perform quick 5-min upcycling transformation (e.g. desk organizer, candle holder, seedling pot)",
        "Post on Community Exchange / DIY Resale for neighbor purchase"
      ],
      "marketplaceCategory": "Upcycled Home & Garden"
    },
    "instantRevendReward": {
      "bonusCoins": 35,
      "cashRefund": "$0.10"
    }
  },
  "coinsReward": 25
}`;

    let contentsPayload: any;

    if (imageBase64) {
      const cleanBase64 = imageBase64.includes('base64,')
        ? imageBase64.split('base64,')[1].trim()
        : imageBase64.trim();

      let detectedMime = mimeType || 'image/jpeg';
      if (imageBase64.startsWith('data:')) {
        const match = imageBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
        if (match) detectedMime = match[1];
      }

      contentsPayload = [
        {
          inlineData: {
            mimeType: detectedMime,
            data: cleanBase64,
          },
        },
        prompt,
      ];
    } else {
      contentsPayload = prompt;
    }

    let parsedResult: any = null;

    // Try candidate models in order (gemini-3.1-flash-lite first for instant response and high throughput)
    for (const modelName of CANDIDATE_MODELS) {
      try {
        console.log(`[EcoSort AI] Calling model ${modelName} for waste identification...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contentsPayload,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          parsedResult = parseJsonSafely(response.text);
          console.log(`[EcoSort AI] Real-time success with ${modelName}:`, parsedResult.itemName);
          return res.json({
            success: true,
            data: parsedResult,
            source: `gemini_${modelName}`,
          });
        }
      } catch (err: any) {
        console.warn(`[EcoSort AI] Model ${modelName} encountered (${err?.status || err?.message}). Trying next model...`);
      }
    }

    // Fallback if all API models fail
    const fallback = getFallbackWasteAnalysis(req.body?.queryText);
    return res.json({ success: true, data: fallback, source: 'fallback_error' });
  } catch (error: any) {
    console.error('Error analyzing waste:', error);
    const fallback = getFallbackWasteAnalysis(req.body?.queryText);
    return res.json({ success: true, data: fallback, source: 'fallback_error', error: error?.message });
  }
});

// 2. Custom Home Upcycle Generator
app.post('/api/generate-upcycle', async (req, res) => {
  try {
    const { itemDescription, timeLimitMinutes } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: true,
        data: {
          title: `Creative Home Upcycle for ${itemDescription || 'Household Item'}`,
          timeEstimateMinutes: timeLimitMinutes || 10,
          difficulty: 'Easy',
          toolsNeeded: ['Scissors', 'Ruler', 'Repurposed container'],
          steps: [
            'Clean and dry the item thoroughly.',
            'Measure and mark target cut or fold lines.',
            'Assemble into an organized desk, garden, or kitchen accessory.',
            'Test stability and enjoy your zero-cost home upgrade!',
          ],
          ecoSavings: 'Diverts 350g from landfills and saves $12 in store-bought supplies.',
        },
      });
    }

    const prompt = `Create a fast, practical, fun DIY home upcycling project for: "${itemDescription}".
The user wants something taking under ${timeLimitMinutes || 15} minutes using common household tools (scissors, glue, string, etc.).
Output JSON with:
{
  "title": "catchy project title",
  "timeEstimateMinutes": 8,
  "difficulty": "Easy",
  "toolsNeeded": ["Scissors", "Glue"],
  "steps": ["Step 1", "Step 2", "Step 3"],
  "ecoSavings": "estimated environmental or cost savings"
}`;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response.text) {
          const parsed = parseJsonSafely(response.text);
          return res.json({ success: true, data: parsed, source: modelName });
        }
      } catch (err) {
        // try next model
      }
    }

    return res.status(500).json({ success: false, error: 'Could not generate upcycle' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3. AI Eco Chat Assistant
app.post('/api/chat-eco-assistant', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: true,
        reply: "I am your EcoSort AI assistant! Cardboard boxes are among the highest-demand items in local neighborhoods for moving and packaging. Always remember to flatten boxes to maximize bin capacity, remove plastic packing tape, and keep oily pizza residues out of dry paper recycling. You can also list surplus boxes on our Community Exchange Board for neighbors to pick up!",
      });
    }

    const systemPrompt = `You are EcoSort AI, a knowledgeable, encouraging recycling, zero-waste, and community circular economy expert.
You help users sort waste into correct municipal bins, suggest fast home DIY upcycling ideas, explain neighborhood donation exchanges, and advise on B2B recycling logistics.
Keep responses concise, warm, actionable, and formatted with bullet points when explaining steps.`;

    const chatHistory = messages.map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n');
    const fullPrompt = `${systemPrompt}\n\nChat History:\n${chatHistory}\n\nAssistant:`;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: fullPrompt,
        });

        if (response.text) {
          return res.json({ success: true, reply: response.text, source: modelName });
        }
      } catch (err) {
        // try next model
      }
    }

    return res.json({
      success: true,
      reply: "Always ensure recyclables are clean and dry before binning. Clean cardboard and containers can also be gifted to neighbors on the Community Board!",
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. B2B Municipal & Recycling Factory Logistics API
app.get('/api/b2b/dispatches', (req, res) => {
  return res.json({ success: true, dispatches: dispatchLog });
});

app.post('/api/b2b/dispatch-alert', (req, res) => {
  const { binId, binType, location, fillLevel, notes } = req.body;

  const factories: Record<string, string> = {
    cardboard: 'Metro Fiber Re-Pulp & Paper Corp',
    plastic: 'EcoPolymers Circular Logistics Ltd',
    glass: 'Vitreous Eco-Smelting & Glass Works',
    organic: 'BioMatrix Municipal Compost & Biogas Facility',
    metals: 'Allied Scrap & Recycled Metallics Inc',
    general: 'City Clean Energy Waste-to-Energy Facility',
  };

  const key = (binType || 'cardboard').toLowerCase();
  let assignedFactory = 'Metro Fiber Re-Pulp & Paper Corp';
  for (const [k, v] of Object.entries(factories)) {
    if (key.includes(k)) {
      assignedFactory = v;
      break;
    }
  }

  const weightEstKg = Math.round(((fillLevel || 90) / 100) * 350 + Math.random() * 80);
  const divertedCo2Kg = Math.round(weightEstKg * 0.92);

  const newDispatch: DispatchRequest = {
    id: `DISP-${Math.floor(1000 + Math.random() * 9000)}`,
    binId: binId || `BIN-SMART-${Math.floor(10 + Math.random() * 90)}`,
    binType: binType || 'Cardboard & Corrugated Paper Compactor',
    location: location || 'Oakridge Central Community Hub',
    fillLevel: fillLevel || 92,
    weightEstKg,
    assignedFactory,
    status: 'Dispatched',
    etaMinutes: Math.floor(10 + Math.random() * 25),
    truckId: `EV-TRUCK #${Math.floor(100 + Math.random() * 900)}`,
    dispatchedAt: new Date().toISOString(),
    divertedCo2Kg,
  };

  dispatchLog.unshift(newDispatch);
  if (dispatchLog.length > 20) dispatchLog.pop();

  return res.json({
    success: true,
    message: 'Pickup alert transmitted to Municipal Logistics Dispatch & Recycling Factory.',
    dispatch: newDispatch,
  });
});

// 5. Audio Transcription Endpoint using gemini-3.5-transcribe
app.post('/api/transcribe-audio', async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ success: false, error: 'No audio provided' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: true,
        transcription: 'Clean glass jar with twist lid',
      });
    }

    const cleanBase64 = audioBase64.includes('base64,')
      ? audioBase64.split('base64,')[1].trim()
      : audioBase64.trim();

    let detectedMime = mimeType || 'audio/webm';
    if (audioBase64.startsWith('data:')) {
      const match = audioBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
      if (match) detectedMime = match[1];
    }

    console.log('[EcoSort AI] Transcribing audio with gemini-3.5-transcribe, mime:', detectedMime);

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: detectedMime,
              data: cleanBase64,
            },
          },
          { text: 'Transcribe the spoken audio verbatim. Return only the transcription text without commentary.' },
        ],
      },
    });

    const transcription = response.text?.trim() || '';
    console.log('[EcoSort AI] gemini-3.5-transcribe output:', transcription);
    return res.json({ success: true, transcription });
  } catch (err: any) {
    console.error('[EcoSort AI] Transcription error with gemini-3.5-transcribe:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Live API Voice Conversation WebSocket Bridge using gemini-3.8-live
wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[EcoSort AI Live API] Client connected to /live');
  try {
    const session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction:
          'You are EcoSort AI, a friendly, encouraging real-time voice recycling and zero-waste circular economy advisor. Speak verbally with users to help them identify which municipal bin trash belongs to, suggest quick 5-15 minute DIY home upcycling ideas, guide neighborhood cardboard and jar donations, explain container reverse vending (RVM) deposit refunds, and discuss municipal smart bin pickup logistics. Keep spoken responses concise, energetic, and natural.',
      },
      callbacks: {
        onmessage: (message: any) => {
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          const text = message.serverContent?.modelTurn?.parts?.[0]?.text;
          if (audio) {
            clientWs.send(JSON.stringify({ type: 'audio', audio }));
          }
          if (text) {
            clientWs.send(JSON.stringify({ type: 'text', text }));
          }
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ type: 'interrupted', interrupted: true }));
          }
        },
      },
    });

    clientWs.on('message', (data: any) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        } else if (parsed.text) {
          session.sendRealtimeInput({
            text: parsed.text,
          });
        }
      } catch (e) {
        console.error('[Live API] Error processing client message:', e);
      }
    });

    clientWs.on('close', () => {
      console.log('[EcoSort AI Live API] Client disconnected from /live');
    });
  } catch (err: any) {
    console.error('[EcoSort AI Live API] Connection error:', err);
    clientWs.send(JSON.stringify({ type: 'error', message: err.message }));
  }
});

// Vite middleware in dev or static serving in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`EcoSort AI server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
