# AgriFlow: Machine Learning Backend Integration

We have built a fully functional Machine Learning backend powered by PyTorch and FastAPI to analyze crop diseases, identify plants, and detect valid leaves.

## ML Setup & Installation

### 1. Install ML Dependencies
Navigate to the `ml/` directory and install the required Python packages (Python 3.9+ recommended).
```bash
cd ml
pip install -r requirements-ml.txt
```

### 2. Download and Prepare the Dataset
We use the PlantVillage dataset via TensorFlow Datasets. Run the download script:
```bash
python scripts/download_dataset.py
```
*Note: This will download several GBs of data and split it into `ml/data/processed/train`, `validation`, and `test` folders.*

### 3. Train the Models
You need to train three models. We use pretrained MobileNetV3-Small and EfficientNet-B0 models. **GPU recommended.**
```bash
python scripts/train_leaf_validator.py
python scripts/train_plant_classifier.py
python scripts/train_health_classifier.py
```
*This will generate `.pth` files inside `ml/weights/`.*

### 4. Start the ML Backend API
Once the models are trained (or even if they aren't, the pipeline handles fallback gracefully):
```bash
python api/main.py
```
*The FastAPI server will start on `http://0.0.0.0:8000`.*

### 5. Start the React Native Frontend
In a new terminal at the root of the project:
```bash
npm start
```
*Ensure your `.env` or `aiService.js` points `API_BASE_URL` to your local machine IP (or `http://10.0.2.2:8000` for Android emulator).*

## End-to-End Testing
1. Open the **AI Scanner** in the app.
2. Click **Scan Leaf**.
3. The image is sent to the local Python FastAPI via POST `/api/plant/analyze`.
4. The ML pipeline runs Leaf Validation -> Plant Identification -> Disease Classification.
5. The UI renders the real Machine Learning metrics, confidence percentages, and mapped agricultural recommendations.
