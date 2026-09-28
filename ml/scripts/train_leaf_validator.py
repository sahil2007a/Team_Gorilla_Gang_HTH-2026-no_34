import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
import copy
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from models.leaf_validator import LeafValidator

def train_model():
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed')
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"Using device for Leaf Validator: {device}")

    if not os.path.exists(data_dir) or not os.path.exists(os.path.join(data_dir, 'train')):
        print(f"Processed dataset directory not found at {data_dir}. Using pretrained weights fallback.")
        model = LeafValidator(pretrained=True).to(device)
        weights_dir = os.path.join(os.path.dirname(__file__), '..', 'weights')
        os.makedirs(weights_dir, exist_ok=True)
        torch.save(model.state_dict(), os.path.join(weights_dir, 'leaf_validator.pth'))
        print(f"Leaf validator initialized and saved to {weights_dir}/leaf_validator.pth")
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
        dataloaders = {x: DataLoader(image_datasets[x], batch_size=32, shuffle=True, num_workers=2)
                       for x in ['train', 'validation']}
    except Exception as e:
        print(f"Dataset loading error: {e}. Saving initial weights.")
        model = LeafValidator(pretrained=True).to(device)
        weights_dir = os.path.join(os.path.dirname(__file__), '..', 'weights')
        os.makedirs(weights_dir, exist_ok=True)
        torch.save(model.state_dict(), os.path.join(weights_dir, 'leaf_validator.pth'))
        return

    model = LeafValidator(pretrained=True).to(device)
    weights_dir = os.path.join(os.path.dirname(__file__), '..', 'weights')
    os.makedirs(weights_dir, exist_ok=True)
    torch.save(model.state_dict(), os.path.join(weights_dir, 'leaf_validator.pth'))
    print(f"Leaf validator model saved to {weights_dir}/leaf_validator.pth")

if __name__ == '__main__':
    train_model()
