# 🌐 InfoSphere
> **The AI-Powered News Nexus**

![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)
![React](https://img.shields.io/badge/React-19.2.3-61DAFB?logo=react&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?logo=vite&style=flat-square)
![Gemini AI](https://img.shields.io/badge/AI-Gemini%202.0%20Flash-8E75B2?logo=google&style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?logo=tailwind-css&style=flat-square)

**InfoSphere** is a next-generation news aggregation platform that blends cyberpunk aesthetics with the power of Google's Gemini AI. It delivers real-time, verified news stories tailored to your location and interests, while providing a secure platform for citizen journalists to contribute.

---

## ✨ Key Features

### 📡 For Citizens (Readers)
*   **Hyper-Local to Global:** Seamlessly switch between State-level (India), National, and International news.
*   **AI Curation:** Powered by **Google Gemini 2.0 Flash** to aggregate, summarize, and categorize news instantly.
*   **Smart Filtering:** Focus on what matters—Technology/AI trends or Job opportunities.
*   **Immersive UI:** A responsive, futuristic "Glassmorphism" design with neon accents and smooth animations.

### 🎙️ For Reporters (Contributors)
*   **Identity Verification:** Secure onboarding using AI to verify government-issued IDs (Aadhar, PAN, etc.) in real-time.
*   **Credibility Score:** Build a reputation as a trusted source (Coming Soon).
*   **Direct Publishing:** Submit stories directly to the InfoSphere network.

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite |
| **Styling** | Tailwind CSS, Custom Animations |
| **AI / ML** | Google GenAI SDK (Gemini 2.0 Flash) |
| **State** | React Hooks (Context-free architecture for speed) |
| **Icons** | FontAwesome 6 |

---

## 🚀 Getting Started

Follow these instructions to set up your own instance of InfoSphere.

### Prerequisites
*   **Node.js** (v18+)
*   **Google Gemini API Key** (Get it free from [Google AI Studio](https://aistudio.google.com/))

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Harsha754-ml/infosphere.git
    cd infosphere
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    *   Create a `.env` file in the root directory.
    *   Add your API key:
    ```env
    GEMINI_API_KEY=your_actual_api_key_here
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open `http://localhost:3000` (or the port shown in your terminal).

---

## 📂 Project Structure

```bash
infosphere/
├── 📂 services/
│   └── geminiService.ts    # 🧠 The AI Brain (News fetching & ID Verification)
├── 📄 App.tsx              # ⚛️ Main Application Logic & UI Components
├── 📄 constants.ts         # 🌍 Static Data (Countries, States, Styles)
├── 📄 types.ts             # 📐 TypeScript Interfaces & Enums
├── 📄 index.html           # 🚪 Entry Point
├── 📄 vite.config.ts       # ⚡ Build Configuration
└── 📄 README.md            # 📖 You are here
```

---

## 📸 Screen Previews

| **Landing Page** | **Dashboard** |
| :---: | :---: |
| ![Landing](https://via.placeholder.com/400x200/050505/00f2ff?text=Cyberpunk+Login) | ![Dashboard](https://via.placeholder.com/400x200/050505/00f2ff?text=News+Feed) |

---

## 🤝 Contributing

We welcome contributions! Since this is a community project, here's how you can help:

1.  **Fork** the project.
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  **Commit** your changes (`git commit -m 'Add some AmazingFeature'`).
4.  **Push** to the branch (`git push origin feature/AmazingFeature`).
5.  Open a **Pull Request**.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/Harsha754-ml">Harsha</a>
</p>