# Debate App

A real-time debate application where users can create topics, join debates, and participate in discussions. Users are assigned anonymous names and can engage in meaningful discussions on various topics.

## Features

- 🎯 Create debate topics with categories and date ranges
- 👥 Join active debates and participate in discussions
- 💬 Post comments in real-time with auto-refresh
- 🕵️ Anonymous user system with randomly generated names
- 📊 Debate status tracking (scheduled, active, expired)
- 🔍 Filter debates by status
- 📱 Responsive design for mobile and desktop

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

### Deploying to Glitch.com

1. Create a new project on Glitch
2. Upload all project files to Glitch
3. Glitch will automatically install dependencies and start the server
4. Your app will be available at: `https://your-project-name.glitch.me`

### Other Hosting Options

- **Heroku**: Similar to Render, requires credit card verification
- **Railway**: Good free option for Node.js apps
- **Vercel**: Great for static sites, requires configuration for Node.js
- **DigitalOcean**: More control but requires more setup

## Project Structure

```
├── server.js          # Main server file with Express.js
├── app.js             # Client-side JavaScript
├── index.html         # Main HTML file
├── styles.css         # CSS styles
├── package.json       # Dependencies and scripts
├── data/              # JSON data storage
│   ├── debates.json   # Debate data
│   ├── topics.json    # Topic data
│   └── users.json     # User data
└── README.md          # This file
```

## API Endpoints

- `GET /api/topics` - Get all topics
- `POST /api/topics` - Create a new topic and debate
- `GET /api/debates` - Get all debates
- `POST /api/debates/:id/join` - Join a debate
- `POST /api/debates/:id/comments` - Add a comment to a debate
- `POST /api/users/anonymous` - Create an anonymous user

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Storage**: JSON files (for development)
- **Dependencies**: 
  - `express` - Web framework
  - `cors` - Cross-origin resource sharing
  - `body-parser` - Request body parsing
  - `unique-names-generator` - Random name generation
  - `uuid` - Unique ID generation

## Environment Variables

No environment variables are required for basic functionality. The app uses:
- `PORT` - Server port (defaults to 3000)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify all dependencies are installed
3. Ensure the server is running
4. Check the server logs for any backend errors 