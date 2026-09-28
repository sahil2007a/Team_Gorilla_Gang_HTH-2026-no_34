import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
import copy

import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from models.plant_classifier import PlantClassifier

def train_model():
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed')
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Transforms (Data Augmentation)
    data_transforms = {
        'train': transforms.Compose([
            transforms.RandomResizedCrop(224),
            transforms.RandomHorizontalFlip(),
            transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
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

    image_datasets = {x: datasets.ImageFolder(os.path.join(data_dir, x), data_transforms[x])
                      for x in ['train', 'validation']}
    
    dataloaders = {x: DataLoader(image_datasets[x], batch_size=32, shuffle=True, num_workers=0)
                   for x in ['train', 'validation']}
    
    dataset_sizes = {x: len(image_datasets[x]) for x in ['train', 'validation']}
    class_names = image_datasets['train'].classes
    num_classes = len(class_names)
    
    model = PlantClassifier(num_classes=num_classes).to(device)
    os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'weights'), exist_ok=True)
    weights_path = os.path.join(os.path.dirname(__file__), '..', 'weights', 'plant_classifier.pth')
    torch.save(model.state_dict(), weights_path)
    print(f"Pretrained PlantClassifier ({num_classes} classes) initialized and saved to {weights_path}")

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=7, gamma=0.1)

    best_model_wts = copy.deepcopy(model.state_dict())
    best_acc = 0.0
    patience = 5
    patience_counter = 0
    num_epochs = 25

    for epoch in range(num_epochs):
        print(f'Epoch {epoch}/{num_epochs - 1}')
        print('-' * 10)

        for phase in ['train', 'validation']:
            if phase == 'train':
                model.train()
            else:
                model.eval()

            running_loss = 0.0
            running_corrects = 0

            for inputs, labels in dataloaders[phase]:
                inputs = inputs.to(device)
                labels = labels.to(device)

                optimizer.zero_grad()

                with torch.set_grad_enabled(phase == 'train'):
                    outputs = model(inputs)
                    _, preds = torch.max(outputs, 1)
                    loss = criterion(outputs, labels)

                    if phase == 'train':
                        loss.backward()
                        optimizer.step()

                running_loss += loss.item() * inputs.size(0)
                running_corrects += torch.sum(preds == labels.data)

            if phase == 'train':
                scheduler.step()

            epoch_loss = running_loss / dataset_sizes[phase]
            epoch_acc = running_corrects.double() / dataset_sizes[phase]

            print(f'{phase} Loss: {epoch_loss:.4f} Acc: {epoch_acc:.4f}')

            if phase == 'validation':
                if epoch_acc > best_acc:
                    best_acc = epoch_acc
                    best_model_wts = copy.deepcopy(model.state_dict())
                    patience_counter = 0
                else:
                    patience_counter += 1

        if patience_counter >= patience:
            print("Early stopping triggered.")
            break

    print(f'Best val Acc: {best_acc:4f}')
    
    model.load_state_dict(best_model_wts)
    os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'weights'), exist_ok=True)
    torch.save(model.state_dict(), os.path.join(os.path.dirname(__file__), '..', 'weights', 'plant_classifier.pth'))
    print("Model saved to ml/weights/plant_classifier.pth")

if __name__ == '__main__':
    train_model()
