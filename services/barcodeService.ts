
const OFF_API_URL = 'https://world.openfoodfacts.org/api/v2/product';

export interface ProductData {
    product_name: string;
    brands: string;
    image_url: string;
    nutriments: {
        energy_kcal_100g?: number;
        proteins_100g?: number;
        carbohydrates_100g?: number;
        fat_100g?: number;
        fiber_100g?: number;
        salt_100g?: number;
    };
    ingredients_text: string;
    labels_tags: string[];
    allergens_tags: string[];
    categories_tags: string[];
    nova_group?: number;
    nutriscore_grade?: string;
    _keywords: string[];
}

export interface DietaryAnalysis {
    isCompatible: boolean;
    status: 'safe' | 'caution' | 'avoid';
    reasons: string[];
    positivePoints: string[];
}

// Map app diet IDs to OpenFoodFacts tags/keywords
const DIET_RULES: Record<string, { avoid: string[], require?: string[] }> = {
    vegan: {
        avoid: [
            'en:milk', 'en:egg', 'en:honey', 'en:meat', 'en:fish', 'en:shellfish',
            'en:gelatin', 'en:whey', 'en:casein', 'en:lactose', 'en:beeswax',
            'en:cochineal', 'en:carmine', 'en:animal-rennet'
        ],
        require: ['en:vegan'] // If 'en:vegan' tag is present, we can trust it
    },
    vegetarian: {
        avoid: [
            'en:meat', 'en:fish', 'en:shellfish', 'en:gelatin', 'en:animal-rennet'
        ],
        require: ['en:vegetarian']
    },
    glutenfree: {
        avoid: [
            'en:gluten', 'en:wheat', 'en:barley', 'en:rye', 'en:oats',
            'en:spelt', 'en:kamut'
        ],
        require: ['en:gluten-free']
    },
    dairyfree: {
        avoid: ['en:milk', 'en:lactose', 'en:cream', 'en:cheese', 'en:butter', 'en:yogurt', 'en:whey', 'en:casein'],
        require: ['en:dairy-free']
    },
    keto: {
        avoid: ['en:sugar', 'en:added-sugar'], // Basic check, keto is complex to determine just by tags
        // Logic for keto helps to check carbs count, will do in code
    },
    paleo: {
        avoid: ['en:grains', 'en:legumes', 'en:dairy', 'en:sugar', 'en:processed-food'],
    }
};

export const fetchProductByBarcode = async (barcode: string): Promise<ProductData | null> => {
    try {
        const response = await fetch(`${OFF_API_URL}/${barcode}.json`);
        const data = await response.json();

        if (data.status === 1) {
            return data.product as ProductData;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching product:", error);
        return null;
    }
};

export const analyzeDietarySuitability = (product: ProductData, userDiets: string[]): DietaryAnalysis => {
    const analysis: DietaryAnalysis = {
        isCompatible: true,
        status: 'safe',
        reasons: [],
        positivePoints: []
    };

    if (!userDiets || userDiets.length === 0) {
        return analysis;
    }

    // Helper to check if tags contain a keyword
    const checkTags = (tags: string[], keywords: string[]) => {
        return tags.some(tag => keywords.some(k => tag.toLowerCase().includes(k)));
    };

    const ingredients = (product.ingredients_text || "").toLowerCase();
    const tags = [
        ...(product.labels_tags || []),
        ...(product.allergens_tags || []),
        ...(product.categories_tags || [])
    ];

    userDiets.forEach(diet => {
        const rules = DIET_RULES[diet];
        if (!rules) return;

        // Check specific requirements first (e.g., if product is explicitly labelled 'vegan')
        if (rules.require && checkTags(product.labels_tags || [], rules.require)) {
            analysis.positivePoints.push(`Certified ${diet}`);
            return; // Skip further checks for this diet if explicitly certified
        }

        // Check unavoidable ingredients/tags
        const violatingTags = rules.avoid.filter(keyword => checkTags(tags, [keyword]));

        // Also check raw ingredients text for common names
        // This is simple string matching, not perfect
        const violatingIngredients = rules.avoid.filter(keyword => {
            const key = keyword.startsWith('en:') ? keyword.substring(3) : keyword;
            return ingredients.includes(key);
        });

        if (violatingTags.length > 0 || violatingIngredients.length > 0) {
            analysis.isCompatible = false;
            analysis.status = 'avoid';
            analysis.reasons.push(`Contains ingredients not suitable for ${diet} diet.`);
        }

        // Special Logic for Keto (Low Carb)
        if (diet === 'keto') {
            const carbs = product.nutriments.carbohydrates_100g || 0;
            if (carbs > 10) { // Arbitrary threshold for "high carb" per 100g for this check
                analysis.status = analysis.status === 'avoid' ? 'avoid' : 'caution';
                analysis.reasons.push(`High carbohydrates (${carbs}g/100g) for Keto.`);
                if (carbs > 20) analysis.isCompatible = false;
            }
        }
    });

    if (analysis.status === 'safe' && analysis.positivePoints.length === 0 && userDiets.length > 0) {
        // If we didn't find reasons to avoid but also no explicit certification
        analysis.status = 'safe'; // We default to safe if no red flags found, user can double check
        analysis.positivePoints.push("No conflicting ingredients found.");
    }

    return analysis;
};
