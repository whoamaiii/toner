# Replit.md

## Overview

This is a full-stack web application built with React and TypeScript on the frontend and Express.js on the backend. The application appears to be designed as an AI-powered chat interface, specifically styled as "SuperGrok" with a dark theme and modern UI components. The project uses a monorepo structure with shared schemas and TypeScript configurations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React hooks with custom state management
- **Data Fetching**: TanStack Query (React Query) for server state management
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Session Management**: Express sessions with PostgreSQL store
- **API Pattern**: RESTful API endpoints under `/api` prefix

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for shared database definitions
- **Migrations**: Managed through `drizzle-kit` with migrations stored in `./migrations`

## Key Components

### Frontend Components
- **Chat Interface**: Main chat component with message display and input
- **Action Buttons**: Feature buttons for image creation, editing, news, and personas
- **Sidebar**: Navigation with collapsible menu
- **Header**: Top navigation with branding and status indicators
- **UI Components**: Comprehensive shadcn/ui component library with dark theme

### Backend Services
- **AI Service**: Placeholder service for AI chat functionality
- **Storage Layer**: In-memory storage implementation with interface for future database integration
- **Route Handlers**: API endpoints for chat and AI services

### Database Schema
- **Users**: User authentication and profile management
- **Chat Sessions**: Chat conversation organization
- **Messages**: Individual chat messages with metadata support

## Data Flow

1. **User Interaction**: User inputs messages through the chat interface
2. **State Management**: Local state updates trigger UI changes and loading states
3. **API Communication**: Frontend sends requests to `/api/ai/chat` endpoint
4. **AI Processing**: Backend processes requests (currently returns mock responses)
5. **Response Handling**: AI responses are displayed in the chat interface
6. **Data Persistence**: Chat sessions and messages are stored in PostgreSQL

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Database ORM and query builder
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight React router
- **express**: Node.js web framework

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Utility for component variants

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds the React application to `dist/public`
- **Backend**: esbuild bundles the Express server to `dist/index.js`
- **Database**: Drizzle migrations are applied using `drizzle-kit push`

### Environment Configuration
- **Development**: Uses Vite dev server with Express backend
- **Production**: Serves static files from Express with API routes
- **Database**: Requires `DATABASE_URL` environment variable for PostgreSQL connection

### Scripts
- `dev`: Development mode with hot reloading
- `build`: Production build for both frontend and backend
- `start`: Production server execution
- `db:push`: Database schema synchronization

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 05, 2025. Initial setup