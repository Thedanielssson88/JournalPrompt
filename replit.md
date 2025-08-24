# Family Journal App

## Overview

This is a Swedish family journal application that allows users to create, view, and manage journal entries with photos. The app features a mobile-first design with a dark theme and provides functionality for tracking family activities, memories, and experiences with categorization and photo support.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with custom dark theme and shadcn/ui component library
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom styling through shadcn/ui
- **Mobile-First Design**: Responsive layout optimized for mobile devices with bottom navigation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Storage**: In-memory storage implementation with interface for future database integration
- **Data Validation**: Zod schemas for request/response validation
- **Development**: Hot reload with Vite integration in development mode

### Data Storage Solutions
- **Current**: In-memory storage using Map data structures for development/demo
- **Configured**: Drizzle ORM with PostgreSQL support via Neon database
- **Schema**: Users and journal entries with relationships, photo arrays, and categorization
- **Migration**: Drizzle Kit for database schema management

### Authentication and Authorization
- **Current**: Mock authentication with default user for demo purposes
- **Prepared**: Session-based structure with user identification in storage layer
- **Security**: Password fields in user schema ready for implementation

### External Dependencies
- **Database**: Neon PostgreSQL (configured but not currently active)
- **Image Storage**: External URLs for photos (Unsplash for demo content)
- **UI Framework**: Radix UI for accessible component primitives
- **Development**: Replit-specific tooling for cloud development environment
- **Fonts**: Google Fonts integration for typography
- **Icons**: Lucide React for consistent iconography

The application uses a modular architecture with clear separation between client and server code, shared schema definitions, and a pluggable storage interface that allows switching from in-memory to database storage without changing the business logic.