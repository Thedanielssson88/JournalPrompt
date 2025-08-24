# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Swedish family journal application built with React/TypeScript frontend and Express/Node.js backend. The app allows users to create, view, and manage journal entries with photos, featuring a mobile-first dark theme design.

## Key Commands

### Development
```bash
npm run dev          # Start development server (Vite + Express)
npm run build        # Build for production
npm start           # Run production server
npm run check       # TypeScript type checking
npm run db:push     # Push database schema changes (requires DATABASE_URL)
```

## Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, TanStack Query, Wouter routing
- **UI**: Tailwind CSS, shadcn/ui components (Radix UI based), Lucide icons
- **Backend**: Express.js, Node.js with ES modules
- **Database**: PostgreSQL via Drizzle ORM (Neon configured)
- **Validation**: Zod schemas shared between client/server

### Project Structure
- `/client` - React frontend application
  - `/src/components` - Reusable UI components
  - `/src/components/ui` - shadcn/ui component library
  - `/src/pages` - Page components (Journal is main page)
  - `/src/hooks` - Custom React hooks
- `/server` - Express backend
  - `index.ts` - Server entry point with middleware
  - `routes.ts` - API route definitions
  - `storage.ts` - Storage abstraction layer
- `/shared` - Shared code between client/server
  - `schema.ts` - Drizzle schema and Zod validation

### Path Aliases
- `@/` → `./client/src/`
- `@shared/` → `./shared/`
- `@assets/` → `./attached_assets/`

### API Endpoints
- `GET /api/user` - Get current user (mocked as "default-user")
- `GET /api/journal-entries` - List all journal entries
- `GET /api/journal-entries/:id` - Get single entry
- `POST /api/journal-entries` - Create new entry

### Data Models
- **Users**: id, username, password, profileImage
- **Journal Entries**: id, userId, title, content, date, photos[], category

### Storage Strategy
Currently uses in-memory storage (`Map` structures) for development. The storage layer (`server/storage.ts`) provides an abstraction that can be swapped to use the configured PostgreSQL database without changing business logic.

### Development Notes
- Server runs on port from `process.env.PORT` (default 5000)
- Vite dev server is integrated with Express in development mode
- Mobile-first responsive design with bottom navigation
- Dark theme by default
- Swedish language UI text throughout the application