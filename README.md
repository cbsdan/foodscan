# 🍽️ FoodScan: Deep Learning Nutrient Estimation from Food Images using PyTorch

**Developed by:**  
- **Balla, Justine Juliana G.**  
- **Cabasa, Daniel O.**

---

## 📱 Overview
**FoodScan** is a mobile application built with **React Native** and powered by a **Python-based backend** using **PyTorch** for machine learning inference. It enables users to scan food images and automatically estimate their nutritional content — including **calories, protein, carbohydrates, and fat** — through a **ResNet50** deep learning model.

The system integrates **computer vision** and **nutrition science** to provide a fast, accurate, and accessible solution for dietary tracking and healthcare applications.

---

## 🚀 Introduction
FoodScan utilizes a **ResNet50-based Convolutional Neural Network (CNN)** implemented in **PyTorch** to identify food items and estimate their nutritional values. The mobile front end built with **React Native** allows real-time interaction, while the Python backend processes images and returns predictions via a REST API.

Manual dietary tracking is prone to inaccuracies and user fatigue. FoodScan automates this process, providing a scalable and precise solution suitable for **fitness monitoring**, **medical nutrition therapy**, and **health research**.

---

## 🧠 Background
The integration of **deep learning** into dietary assessment represents a major leap in health technology. Traditional machine learning approaches with hand-crafted features often failed to generalize across different food presentations. In contrast, **deep CNNs** like ResNet50 can learn complex hierarchical visual patterns for improved classification and nutrient estimation.

Key challenges in food image analysis include:
- Variability in lighting and presentation  
- Ambiguity in portion estimation  
- Complexity in mixed dishes  

FoodScan addresses these issues using **deep residual learning**, which enhances training stability and model accuracy.

---

## ⚙️ Functionalities

### 1. Core Deep Learning & Analysis
- **Food Identification:** Recognizes a wide range of food items through a ResNet50 CNN.  
- **Nutrient Estimation:** Predicts calorie, protein, carbohydrate, and fat content per serving.  

### 2. Technical & System Architecture
- **Backend Framework:** Python-based REST API using Flask or FastAPI for prediction endpoints.  
- **Machine Learning Model:** PyTorch ResNet50 architecture trained on labeled food datasets.  
- **Inference Optimization:** Supports concurrent processing for multiple requests.  

### 3. Healthcare & Research Applications
- **Dietary Management:** Useful for managing conditions such as diabetes and obesity.  
- **Fitness Integration:** Enables tracking for athletes and fitness enthusiasts.  
- **Nutritional Research:** Facilitates dietary data collection and validation.  

---

## 🛠️ Tech Stack
| Component | Technology |
|------------|-------------|
| **Frontend** | React Native |
| **Backend** | Python (Flask / FastAPI) |
| **Machine Learning** | PyTorch |
| **Model Architecture** | ResNet50 CNN |
| **API Communication** | REST |
| **Platform** | Android / iOS |

---

## 📷 How It Works
1. The user captures or uploads a **food image** from the app.  
2. The image is sent to the **Python backend API**.  
3. The **PyTorch model** (ResNet50) processes the image and extracts features.  
4. The model predicts macronutrient values.  
5. The app displays the results in an intuitive and user-friendly interface.  

---

## 🧩 Future Enhancements
- Multi-item detection for mixed meals  
- Portion estimation using image depth inference  
- On-device inference using PyTorch Mobile  
- Integration with health and fitness platforms  

---

## 📚 References
- He, K., Zhang, X., Ren, S., & Sun, J. (2016). *Deep Residual Learning for Image Recognition (ResNet)*.  
- Meyers, A. et al. (2015). *Im2Calories: Towards an Automated System for Image-based Dietary Assessment*.  
- PyTorch Documentation: [https://pytorch.org/docs/stable/](https://pytorch.org/docs/stable/)  

---

## 🧾 License
This project is for **academic and research purposes only**. Unauthorized commercial use is prohibited.

---

> **FoodScan** — Deep Learning for Healthier Living.
