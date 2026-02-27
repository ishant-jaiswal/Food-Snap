# FitBite 👋

FitBite is an AI-powered food tracking and nutrition coaching application built with Expo.

## Features
- **AI Food Analysis**: Take a photo of your food to get instant nutritional breakdown.
- **AI Coaching**: Personalized nutrition advice based on your goals.
- **Easy Logging**: Track your meals quickly and efficiently.

## Prerequisites
Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (LTS version)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/FitBite.git
   cd FitBite
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add your API keys:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your Firebase and Gemini API keys.

4. **Start the app**
   ```bash
   npx expo start
   ```

## Technology Stack
- **Frontend**: React Native with Expo
- **Backend Service**: Firebase (Firestore, Auth)
- **AI Engine**: Google Gemini API (Transitioning to custom ML)

## License
[MIT](LICENSE)
