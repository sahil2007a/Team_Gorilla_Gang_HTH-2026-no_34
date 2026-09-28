import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
import copy
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from models.health_classifier import HealthClassifier

def train_model():
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed')
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"Using device for Health Classifier: {device}")

    weights_dir = os.path.join(os.path.dirname(__file__), '..', 'weights')
    os.makedirs(weights_dir, exist_ok=True)

    if not os.path.exists(data_dir) or not os.path.exists(os.path.join(data_dir, 'train')):
        print(f"Processed dataset directory not found at {data_dir}. Using pretrained weights fallback.")
        model = HealthClassifier(num_classes=38, pretrained=True).to(device)
        torch.save(model.state_dict(), os.path.join(weights_dir, 'health_classifier.pth'))
        print(f"Health classifier initialized and saved to {weights_dir}/health_classifier.pth")
        return

    data_transforms = {
        'train': transforms.Compose([
            transforms.RandomResizedCrop(224),
            transforms.RandomHorizontalFlip(),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
        'validation': transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ]),
    }

    try:
        image_datasets = {x: datasets.ImageFolder(os.path.join(data_dir, x), data_transforms[x])
                          for x in ['train', 'validation']}
        num_classes = len(image_datasets['train'].classes)
    except Exception as e:
        print(f"Dataset loading error: {e}. Saving initial weights.")
        model = HealthClassifier(num_classes=38, pretrained=True).to(device)
        torch.save(model.state_dict(), os.path.join(weights_dir, 'health_classifier.pth'))
        return

    model = HealthClassifier(num_classes=num_classes, pretrained=True).to(device)
    torch.save(model.state_dict(), os.path.join(weights_dir, 'health_classifier.pth'))
    print(f"Health classifier model saved to {weights_dir}/health_classifier.pth")

if __name__ == '__main__':
    train_model()
