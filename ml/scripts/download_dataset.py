import os
import glob
import zipfile
import shutil
from pathlib import Path
from tqdm import tqdm

def extract_and_split():
    base_data_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed')
    train_dir = os.path.join(base_data_dir, 'train')
    val_dir = os.path.join(base_data_dir, 'validation')
    test_dir = os.path.join(base_data_dir, 'test')

    # Look for downloaded tfds zip
    home_dir = os.path.expanduser('~')
    tfds_dir = os.path.join(home_dir, 'tensorflow_datasets', 'downloads', 'plant_village')
    zip_files = [f for f in glob.glob(os.path.join(tfds_dir, '*')) if not f.endswith('.INFO') and zipfile.is_zipfile(f)]

    if not zip_files:
        print("No downloaded zip found in tfds directory.")
        return

    archive_path = zip_files[0]
    print(f"Opening archive: {archive_path}")

    with zipfile.ZipFile(archive_path, 'r') as z:
        all_files = [f for f in z.namelist() if not f.endswith('/') and f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        print(f"Total images found in archive: {len(all_files)}")

        # Group by class (folder name)
        classes = {}
        for f in all_files:
            parts = f.split('/')
            if len(parts) >= 2:
                cls_name = parts[-2]
                classes.setdefault(cls_name, []).append(f)

        print(f"Found {len(classes)} classes. Extracting and creating train/validation/test splits...")

        for cls_name, fnames in tqdm(classes.items(), desc="Classes"):
            total = len(fnames)
            train_cnt = int(0.8 * total)
            val_cnt = int(0.1 * total)

            splits = {
                train_dir: fnames[:train_cnt],
                val_dir: fnames[train_cnt:train_cnt + val_cnt],
                test_dir: fnames[train_cnt + val_cnt:]
            }

            for split_dir, split_files in splits.items():
                target_cls_dir = os.path.join(split_dir, cls_name)
                os.makedirs(target_cls_dir, exist_ok=True)
                for file_in_zip in split_files:
                    fname = os.path.basename(file_in_zip)
                    dest = os.path.join(target_cls_dir, fname)
                    if not os.path.exists(dest):
                        with z.open(file_in_zip) as src, open(dest, 'wb') as dst:
                            shutil.copyfileobj(src, dst)

    print(f"\nDataset successfully extracted to {base_data_dir}")
    print(f"Train path: {train_dir}")
    print(f"Validation path: {val_dir}")
    print(f"Test path: {test_dir}")

if __name__ == '__main__':
    extract_and_split()
