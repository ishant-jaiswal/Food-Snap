import torch
import torch.nn as nn
from torchvision import models

class FoodClassifier(nn.Module):
    def __init__(self, num_classes):
        super(FoodClassifier, self).__init__()
        # Use EfficientNet-V2-S as the base model
        self.base_model = models.efficientnet_v2_s(weights=models.EfficientNet_V2_S_Weights.DEFAULT)
        
        # Modify the classifier head for our number of classes
        num_features = self.base_model.classifier[1].in_features
        self.base_model.classifier[1] = nn.Sequential(
            nn.Dropout(p=0.2, inplace=True),
            nn.Linear(num_features, num_classes)
        )

    def forward(self, x):
        return self.base_model(x)

def get_model(num_classes):
    return FoodClassifier(num_classes)
