# Frontend Server Setup

This directory contains a simple Express server to host the built frontend application.

## Development Mode

To run the frontend in development mode with hot reload:

```bash
npm run dev
```

This will start the Vite development server on http://localhost:5137

## Production Mode

### 1. Install Dependencies

First, make sure all dependencies are installed:

```bash
npm install
```

### 2. Build the Application

Build the production-ready files:

```bash
npm run build
```

This creates an optimized build in the `dist` directory.

### 3. Start the Production Server

Run the Express server to serve the built files:

```bash
npm start
```

The server will start on http://localhost:3000 (or the port specified in the PORT environment variable).

## Custom Port

To run the server on a different port:

```bash
PORT=8080 npm start
```

## Server Features

- Serves static files from the `dist` directory
- Handles client-side routing (returns index.html for all routes)
- Lightweight Express server
- Production-ready setup

## Notes

- Make sure to build the application (`npm run build`) before starting the production server
- The development server (`npm run dev`) is recommended for development work
- The production server (`npm start`) is for serving the built application