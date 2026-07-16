# Pink Maternal - AI-Powered Maternal & Neonatal Health Shield

**Empowering Motherhood through Precision AI and Seamless Health Monitoring.**

Pink Maternal is a comprehensive health monitoring ecosystem designed to detect critical maternal and neonatal risks—including Cardiovascular strain, Anemia, and Jaundice—using advanced machine learning and real-time biometric analysis.

---

## 🌟 Key Features

### 🩺 Advanced AI Diagnostic Modules
*   **Cardiovascular Health:** Real-time analysis of PPG signals using XGBoost to predict heart strain and preeclampsia risks with high clinical accuracy.
*   **Anemia Detection:** Non-invasive hemoglobin estimation using optical sensor data and predictive modeling.
*   **Jaundice Screening:** Neonatal bilirubin estimation through computer vision (OpenCV) analysis of smartphone-captured images.

### 📊 Intelligent Dashboard
*   **Centralized Navigation:** A beautiful, responsive header system with unified access to all health modules.
*   **Dynamic Profiles:** Personalized user dashboards that synchronize health data and preferences across the session.
*   **Notification Engine:** Real-time health alerts, hydration reminders, and appointment tracking to ensure adherence to care plans.

### 🤖 Generative AI Assistant
*   **Context-Aware Support:** An integrated GenAI Chat Widget that provides instant guidance based on the user's current health metrics and the page they are viewing.

---

## 🛠 Tech Stack

### **Frontend**
*   **Modern Web Tech:** HTML5, Vanilla JavaScript (ES6+), CSS3.
*   **UI Framework:** Tailwind CSS for a premium, responsive glassmorphism aesthetic.
*   **Icons & Fonts:** Google Fonts (Inter) and Material Symbols for a modern, clean interface.

### **Backend & Services**
*   **App Server:** Node.js & Express for core application logic and user management.
*   **AI Microservices:** FastAPI (Python) for ultra-fast machine learning inference.
*   **Database:** SQLite3 for robust, local-first data persistence.

### **AI & ML**
*   **ML Engines:** XGBoost, Scikit-learn.
*   **Computer Vision:** OpenCV for image processing and feature extraction.

---

## 🏗 System Architecture

Pink Maternal follows a modern **Microservices Architecture**:
1.  **Orchestration Layer:** The Node.js backend manages user sessions, documentation, and routes requests to specialized AI services.
2.  **Inference Layer:** Dedicated FastAPI services run high-performance Python models for specialized health metrics.
3.  **UI Layer:** A centralized navigation system ensures consistency and high engagement across all health-specific portals.

---

## 📂 Project Structure
```text
├── Backend/          # Node.js Express server
├── Frontend/         # Standardized HTML/JS application
│   ├── index.html    # Hero landing page
│   ├── home.html     # Main user dashboard
│   └── *.html        # Specific health modules
└── ML/               # Python-based diagnostic engines
```

**Developed with ❤️ for mothers and clinicians everywhere.**
