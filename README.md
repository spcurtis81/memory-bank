# Memory Bank

A self-hosted web service for personal URL bookmarking with folders, tags, and search capabilities.

## Features

- Save URLs with automatically parsed titles
- Organize bookmarks into hierarchical folders
- Add tags to bookmarks for easier searching
- Switch between grid and list views
- Mobile-friendly responsive design
- Stores data in SQLite database

## Project Structure

- `backend/`: Express.js REST API server with SQLite database
- `frontend/`: React application with styled-components

## Requirements

- Node.js 16+ and npm (for local development)
- Docker and docker-compose (for containerized deployment)

## Running Locally

### Backend

```bash
cd backend
npm install
npm run dev
```

The backend will be available at http://localhost:3001

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:3000

## Using Docker

```bash
# Start both services
docker-compose up

# Build and start both services
docker-compose up --build

# Start in detached mode
docker-compose up -d

# Stop services
docker-compose down
```

## API Endpoints

### Bookmarks

- `GET /api/bookmarks` - List all bookmarks
- `GET /api/bookmarks/:id` - Get a specific bookmark
- `POST /api/bookmarks` - Create a new bookmark
- `PUT /api/bookmarks/:id` - Update a bookmark
- `DELETE /api/bookmarks/:id` - Delete a bookmark
- `GET /api/bookmarks/search?q=query` - Search bookmarks
- `POST /api/bookmarks/fetch-metadata` - Fetch metadata for a URL

### Folders

- `GET /api/folders` - List all folders
- `GET /api/folders/:id` - Get a specific folder
- `POST /api/folders` - Create a new folder
- `PUT /api/folders/:id` - Update a folder
- `DELETE /api/folders/:id` - Delete a folder
- `GET /api/folders/:id/bookmarks` - Get bookmarks in a folder

### Tags

- `GET /api/tags` - List all tags
- `GET /api/tags/:id` - Get a specific tag
- `POST /api/tags` - Create a new tag
- `PUT /api/tags/:id` - Update a tag
- `DELETE /api/tags/:id` - Delete a tag
- `GET /api/tags/:id/bookmarks` - Get bookmarks with a specific tag

## License

MIT
