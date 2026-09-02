import os
import tensorflow_datasets as tfds
from PIL import Image
from tqdm import tqdm

def save_split(dataset, split_name, base_dir):
    split_dir = os.path.join(base_dir, split_name)
    os.makedirs(split_dir, exist_ok=True)
    
    print(f"Extracting {split_name} split...")
    for i, example in enumerate(tqdm(dataset)):
        image = example['image'].numpy()
        label = example['label'].numpy()
        
        # PlantVillage labels often map to Plant___Disease. 
        # For simplicity, we just save them in their label directories.
        label_dir = os.path.join(split_dir, str(label))
        os.makedirs(label_dir, exist_ok=True)
        
        img = Image.fromarray(image)
        img.save(os.path.join(label_dir, f"img_{i}.jpg"))

def download_and_extract():
    print("Downloading PlantVillage dataset using tfds...")
    # Load plant_village
    ds, info = tfds.load('plant_village', split=['train'], with_info=True)
    train_ds = ds[0]
    
    # We will manually split it for demonstration: 80% train, 10% val, 10% test
    # TFDS provides it as a single 'train' split usually.
    total = info.splits['train'].num_examples
    train_size = int(0.8 * total)
    val_size = int(0.1 * total)
    
    train_data = train_ds.take(train_size)
    rem_data = train_ds.skip(train_size)
    val_data = rem_data.take(val_size)
    test_data = rem_data.skip(val_size)
    
    base_data_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed')
    
    save_split(train_data, 'train', base_data_dir)
    save_split(val_data, 'validation', base_data_dir)
    save_split(test_data, 'test', base_data_dir)
    
    print(f"Dataset extracted to {base_data_dir}")
    print("Class mapping:")
    for i, name in enumerate(info.features['label'].names):
        print(f"{i}: {name}")

if __name__ == "__main__":
    download_and_extract()
