# Good Vibes Frontend

A React application for displaying Good Vibes from Officevibe with comprehensive avatar support and modern UI design using the Hopper Design System.

## Features

- 🎨 **Modern UI**: Built with Workleap's Hopper Design System
- 👤 **Avatar Integration**: Real profile images with colored initials fallback
- 🔄 **Adaptive UI**: Smart layout based on content type (replies vs reactions)
- 📱 **Responsive Design**: Works on all device sizes
- ⚡ **Performance**: Optimized React 19 with TypeScript

## Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager

## GitHub Integration & Automatic Builds

This project is configured with GitHub Actions for automatic building and deployment.

### Setup Instructions

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/good-vibes-frontend.git
   git push -u origin main
   ```

2. **Enable GitHub Pages** (for automatic deployment):
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under "Source", select **GitHub Actions**
   - The site will be available at `https://YOUR_USERNAME.github.io/good-vibes-frontend`

3. **Automatic Builds**:
   - Every push to `main` branch triggers a build
   - Pull requests are automatically tested
   - Build artifacts are saved for 7 days
   - Failed builds will block deployment

### Workflows

- **`build-and-deploy.yml`**: Builds and deploys to GitHub Pages on main branch
- **`ci.yml`**: Runs tests and builds on all branches and PRs

## Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Backend Integration

This frontend connects to a .NET backend that provides:
- Good Vibes data from Officevibe API  
- User avatar images from Workleap API
- Caching and rate limiting for optimal performance

Make sure the backend is running on `http://localhost:5000` for development.

## Technology Stack

- **React 19** with TypeScript
- **Hopper Design System** (@hopper-ui/components) 
- **React Aria** for accessibility
- **Lucide React** for additional icons

## Deployment Options

### GitHub Pages (Recommended)
Automatic deployment is configured via GitHub Actions. Just push to main branch.

### Manual Deployment
1. Run `npm run build`
2. Deploy the `build/` folder to any static hosting service:
   - Vercel
   - Netlify  
   - AWS S3
   - Azure Static Web Apps

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
