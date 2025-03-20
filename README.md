# Macro Muncher v2

A gamified nutrition tracking application that helps users track their macronutrient intake while making the experience engaging and fun through gamification elements.

## Features

### User Management
- **Authentication**: Email-based registration and login
- **Personalized Onboarding**: Set up profile with personal details, fitness goals, and dietary preferences
- **Profile Management**: Update personal information and nutrition targets

### Food Tracking
- **Food Logging**: Log meals and food items throughout the day
- **Food Search**: Search from a comprehensive database of food items
- **Custom Foods**: Create and save custom food items
- **Barcode Scanning**: Quick food entry through barcode scanning (placeholder UI implemented)
- **Nutrition Tracking**: Monitor daily calories, protein, carbs, and fat intake

### Analytics & Insights
- **Dashboard**: Overview of daily nutrition, recent meals, and progress
- **Statistics**: Visualize nutrition trends over time
- **Recommendations**: Get personalized recommendations based on your nutrition data

### Gamification
- **Achievements**: Unlock achievements for reaching nutrition and tracking goals
- **Challenges**: Join time-limited challenges to earn extra points
- **Streaks**: Build and maintain tracking streaks for consistency
- **Points & Levels**: Earn points and level up through consistent tracking
- **Real-time Notifications**: Get instant feedback on achievements and progress

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **State Management**: Zustand
- **Routing**: React Router
- **Backend Integration**: Firebase (Authentication, Firestore)
- **UI Components**: Custom components with React Icons

## Project Structure

```
src/
├── components/         # Reusable UI components
├── firebase/           # Firebase configuration and services
├── layouts/            # Layout components for pages
├── pages/              # Application pages
├── stores/             # Zustand state management stores
├── App.tsx             # Main application component
└── index.tsx           # Application entry point
```

## Key Pages & Components

### Pages
- **Onboarding**: User profile setup
- **Dashboard**: Main home screen with overview
- **FoodLog**: Daily food tracking interface
- **FoodSearch**: Food database search
- **FoodDetail**: Detailed food item information
- **CreateFood**: Custom food creation
- **Achievements**: Achievement tracking and display
- **Challenges**: Challenge participation and tracking
- **Statistics**: Nutrition data visualization
- **Profile**: User settings and information
- **Login/Register**: Authentication screens

### Components
- **NotificationSystem**: Toast-style notifications for achievements, goals, etc.
- **GamificationNotifier**: Monitors achievements and streaks
- **NutritionProgressMonitor**: Provides feedback on nutrition targets

## Setup and Installation

1. Clone the repository:
```bash
git clone https://github.com/Cappahccino/Macro-Muncher-v2.git
cd Macro-Muncher-v2
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Authentication with Email/Password
   - Create Firestore database
   - Add your Firebase configuration to `src/firebase/config.ts`

4. Start the development server:
```bash
npm start
```

## Usage

### First-time Usage
1. Register an account
2. Complete the onboarding process
3. Begin logging your first meal

### Daily Usage
1. Log in to your account
2. View your dashboard for daily summary
3. Track meals through the Food Log
4. Check achievements and challenges for motivation
5. Review statistics to understand trends

## Contribution

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
