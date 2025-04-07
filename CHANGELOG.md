# Changelog

All notable changes to the Memory Bank project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial project scaffold with Express backend and React frontend
- SQLite database integration for data persistence
- Docker support for containerized deployment
- User interface with responsive design
- Bookmarks management system:
  - Add bookmarks with URL metadata extraction (title, description, favicon, and images)
  - Edit bookmark details including title, URL, folder, and tags
  - Delete bookmarks with confirmation
  - Move bookmarks between folders
  - Pinterest-style card layout for visual browsing experience
- Folder management system:
  - Create folders directly from any folder picker
  - Delete folders while preserving their contents
  - Folder sidebar navigation with toggle support for mobile
- Tag management system with the ability to add/view tags for bookmarks
- Real-time search functionality across bookmark titles, URLs, and tags
- View mode toggle between grid and list layouts
- Toast notifications for user feedback on actions
- Metadata extraction for bookmarked pages (title, favicon, description, and main image)

### Changed

### Fixed

### Removed 