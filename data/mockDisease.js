// Comprehensive crop disease database — simple language everyone can understand
const DISEASE_DATABASE = [
  {
    disease: 'Leaf Blight',
    scientificName: 'Cercospora sojina',
    confidence: 94,
    severity: 'Medium',
    riskLevel: 'Moderate',
    symptoms: [
      'Brown or dark spots appearing on the leaves',
      'Leaves turning yellow around the spots',
      'Leaves falling off the plant early',
    ],
    recommendation:
      'Do not worry — this disease can be controlled if you act in the next 2 to 3 days. Remove damaged leaves first, then spray fungicide on the plant. Make sure water does not collect near the roots.',
    treatment: {
      chemical: 'Mancozeb 75% WP — mix 2.5 grams in 1 litre of water and spray',
      organic: 'Neem oil — mix 5 mL in 1 litre of water and spray in the evening',
      frequency: 'Spray once every 7 days, for 3 times total',
    },
  },
  {
    disease: 'Powdery Mildew',
    scientificName: 'Erysiphe cichoracearum',
    confidence: 91,
    severity: 'Low',
    riskLevel: 'Low',
    symptoms: [
      'White powder-like coating on the surface of leaves',
      'The plant looks smaller and weaker than usual',
      'Young leaves appear twisted or curled',
    ],
    recommendation:
      'This disease looks scary but it is easy to control. It spreads in humid weather. Space out your plants so air can pass through. Do not water the plants from above — water only at the base.',
    treatment: {
      chemical: 'Sulfur 80% WP — mix 2 grams in 1 litre of water and spray',
      organic: 'Mix 5 grams baking soda in 1 litre of water and spray on leaves',
      frequency: 'Spray once every 10 days, for 2 times total',
    },
  },
  {
    disease: 'Root Rot',
    scientificName: 'Phytophthora capsici',
    confidence: 88,
    severity: 'High',
    riskLevel: 'High',
    symptoms: [
      'Plant is wilting or drooping even though the soil has water',
      'The stem near the ground looks dark brown or black',
      'Lower leaves are turning yellow and dropping',
    ],
    recommendation:
      'This is serious — act today! The roots of the plant are rotting because of too much water in the soil. Remove and destroy all infected plants immediately so it does not spread to healthy plants. Improve drainage in your field.',
    treatment: {
      chemical: 'Metalaxyl 35% WS — mix 3 grams in 1 litre of water, pour near roots',
      organic: 'Mix Trichoderma viride (10 grams per kg of soil) into the soil near roots',
      frequency: 'Apply to soil once every 14 days',
    },
  },
  {
    disease: 'Bacterial Wilt',
    scientificName: 'Ralstonia solanacearum',
    confidence: 89,
    severity: 'High',
    riskLevel: 'High',
    symptoms: [
      'The entire plant wilts and falls over very quickly',
      'When you cut the stem, you can see dark brown streaks inside',
      'A sticky white liquid comes out of the cut stem',
    ],
    recommendation:
      'This is a very dangerous disease — there is no medicine to cure it. Remove and burn all infected plants immediately. Do not touch healthy plants after touching infected ones. Next year, plant a different crop in this field.',
    treatment: {
      chemical: 'Copper Oxychloride — use only to prevent, not cure (3g per litre)',
      organic: 'Change the crop next season — do not plant the same crop here again',
      frequency: 'Preventive spray every 14 days before disease appears',
    },
  },
  {
    disease: 'Healthy Crop',
    scientificName: 'No pathogen detected',
    confidence: 97,
    severity: 'Low',
    riskLevel: 'Low',
    symptoms: [
      'Leaves are bright green and look healthy',
      'No spots, holes, or powder seen on any leaf',
      'Plant is growing at a normal, healthy pace',
    ],
    recommendation:
      'Congratulations! Your crop is perfectly healthy. Keep doing what you are doing. To protect it from future diseases, spray neem oil once every 3 weeks as a natural shield.',
    treatment: {
      chemical: 'No treatment needed right now',
      organic: 'Neem oil spray — 3 mL per litre of water, once every 3 weeks',
      frequency: 'Preventive spray once every 21 days',
    },
  },
  {
    disease: 'Iron Deficiency',
    scientificName: 'Fe Micronutrient Deficiency',
    confidence: 86,
    severity: 'Medium',
    riskLevel: 'Moderate',
    symptoms: [
      'New leaves look pale yellow but the veins remain green',
      'The older leaves at the bottom still look green',
      'Overall the crop looks lighter in colour than usual',
    ],
    recommendation:
      'Your crop is not sick — it is hungry for iron! This often happens when the soil is too alkaline (too much lime). You can fix this by spraying iron solution on the leaves or adding it to the soil.',
    treatment: {
      chemical: 'Ferrous Sulphate — mix 5 grams in 1 litre of water and spray on leaves',
      organic: 'Chelated iron solution — 2 mL per litre of water, spray on leaves',
      frequency: 'Spray once every 7 days until the leaves turn green again',
    },
  },
];

// Smart randomizer that picks different diseases each time
let lastIndex = -1;
const getSmartResult = () => {
  let index;
  do {
    index = Math.floor(Math.random() * DISEASE_DATABASE.length);
  } while (index === lastIndex);
  lastIndex = index;
  return { ...DISEASE_DATABASE[index], scannedAt: new Date().toISOString() };
};

export const mockDiseaseResult = DISEASE_DATABASE[0];
export { getSmartResult };
