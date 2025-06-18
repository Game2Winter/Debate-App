# Debate App

A real-time debate application where users can create topics, join debates, and participate in discussions.

## Features

- Create debate topics
- Join active debates
- Post comments in real-time
- Anonymous user system
- Debate status tracking (scheduled, active, expired)

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000 in your browser

## Deployment

### Deploying to Render.com

1. Create a Render account at https://render.com
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure the service:
   - Name: debate-app (or your preferred name)
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free

### Environment Variables

No environment variables are required for basic functionality.

## Project Structure

- `server.js` - Main server file
- `app.js` - Client-side JavaScript
- `index.html` - Main HTML file
- `styles.css` - CSS styles
- `data/` - JSON data files
  - `debates.json` - Debate data
  - `topics.json` - Topic data
  - `users.json` - User data

## Technologies Used

- Node.js
- Express.js
- HTML/CSS/JavaScript
- JSON file storage 