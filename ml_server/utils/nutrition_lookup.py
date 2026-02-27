import pandas as pd
import os

class NutritionDB:
    def __init__(self, csv_path):
        self.csv_path = csv_path
        self.data = None
        self.load_db()

    def load_db(self):
        if os.path.exists(self.csv_path):
            try:
                self.data = pd.read_csv(self.csv_path)
                print(f"Nutrition database loaded from {self.csv_path}")
            except Exception as e:
                print(f"Error loading nutrition CSV: {e}")
        else:
            print(f"Warning: Nutrition CSV not found at {self.csv_path}")

    def lookup(self, food_name):
        if self.data is None:
            return None
        
        # Simple case-insensitive match
        result = self.data[self.data['name'].str.contains(food_name, case=False, na=False)]
        
        if not result.empty:
            row = result.iloc[0]
            return {
                "calories": float(row.get('calories', 0)),
                "protein": float(row.get('protein', 0)),
                "carbs": float(row.get('carbs', 0)),
                "fats": float(row.get('fats', 0))
            }
        return None
