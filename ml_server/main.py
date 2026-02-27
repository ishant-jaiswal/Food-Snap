import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import io
import json
import os
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from model.nutrition_model import get_model
from utils.nutrition_lookup import NutritionDB

app = FastAPI(title="FitBite Custom ML API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "food_model.pth")
LABELS_PATH = os.path.join(BASE_DIR, "model", "labels.json")
NUTRITION_DB_PATH = os.path.join(BASE_DIR, "data", "nutrition_data.csv")

# Global variables
model = None
labels = {}
nutrition_db = None

# Image preprocessing
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

@app.on_event("startup")
def load_resources():
    global model, labels, nutrition_db
    # Load labels
    if os.path.exists(LABELS_PATH):
        try:
            with open(LABELS_PATH, "r") as f:
                labels = json.load(f)
        except Exception as e:
            print(f"Error loading labels: {e}")
    
    # Load Nutrition DB
    nutrition_db = NutritionDB(NUTRITION_DB_PATH)
    
    # Load model
    num_classes = len(labels) if labels else 2
    model = get_model(num_classes)
    
    if os.path.exists(MODEL_PATH):
        try:
            model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device('cpu')))
            print("Model weights loaded successfully.")
        except Exception as e:
            print(f"Error loading model weights: {e}")
    else:
        print("Warning: food_model.pth not found. Running with uninitialized weights.")
    
    model.eval()

@app.get("/")
async def root():
    return {
        "message": "FitBite ML Server is running",
        "model_loaded": os.path.exists(MODEL_PATH),
        "num_classes": len(labels),
        "nutrition_db_loaded": nutrition_db is not None and nutrition_db.data is not None
    }

@app.post("/analyze")
async def analyze_food(image: UploadFile = File(...)):
    if model is None:
        return {"error": "Model not initialized"}

    try:
        # Read image
        content = await image.read()
        img = Image.open(io.BytesIO(content)).convert("RGB")
        
        # Preprocess
        input_tensor = preprocess(img)
        input_batch = input_tensor.unsqueeze(0)
        
        # Inference
        with torch.no_grad():
            output = model(input_batch)
            probabilities = torch.nn.functional.softmax(output[0], dim=0)
            confidence, index = torch.max(probabilities, 0)
        
        label = labels.get(str(index.item()), "Unknown")
        
        # Nutrition Lookup
        nutrition = {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fats": 0
        }
        
        if nutrition_db:
            db_result = nutrition_db.lookup(label)
            if db_result:
                nutrition = db_result
        
        return {
            "isFood": True,
            "name": label,
            "confidence": round(confidence.item() * 100, 2),
            **nutrition
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
