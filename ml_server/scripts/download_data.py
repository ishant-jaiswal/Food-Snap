import os
try:
    import kaggle
except ImportError:
    print("Please install kaggle: pip install kaggle")
    exit(1)

def download_datasets():
    datasets = [
        "dansbecker/food-101",
        "iamsouravbanerjee/indian-food-images-dataset",
        "utsav507/food-nutrition-dataset"
    ]
    
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    os.makedirs(data_dir, exist_ok=True)
    
    for ds in datasets:
        print(f"Downloading {ds}...")
        kaggle.api.dataset_download_files(ds, path=data_dir, unzip=True)

if __name__ == "__main__":
    # Ensure you have kaggle.json in ~/.kaggle/
    download_datasets()
