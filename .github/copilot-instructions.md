# Aguas - Water Management Application

## Project Overview
Next.js application for water/aquatic resource management with modern React frontend and backend API routes.

## Technology Stack
- **Framework:** Next.js 15+ with TypeScript
- **Styling:** Tailwind CSS
- **Frontend:** React with App Router
- **Backend:** Next.js API Routes
- **Linting:** ESLint
- **Node.js:** v24.11.1 (portable)

## Project Setup Status

- [x] Verify that the copilot-instructions.md file in the .github directory is created
- [x] Scaffold the Project
- [x] Install dependencies
- [x] Compile the Project
- [ ] Install Recommended Extensions (optional)
- [ ] Create and Run Task
- [ ] Launch the Project
- [x] Ensure Documentation is Complete

## Node.js Portable Setup

Before using npm, set the PATH environment variable:

```powershell
$env:PATH = "$env:USERPROFILE\Downloads\node-v24.11.1-win-x64;" + $env:PATH
```

## Build & Run Commands

- Development: `npm run dev` (runs on http://localhost:3000)
- Production build: `npm run build`
- Production start: `npm start`
- Linting: `npm run lint`

## Directory Structure
- `/app` - Next.js App Router pages and layouts
- `/public` - Static assets
- `/components` - Reusable React components
- `/.github` - GitHub configuration and instructions
- `/node_modules` - Dependencies (created by npm install)

## Key Files
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `next.config.ts` - Next.js configuration
- `eslint.config.mjs` - ESLint configuration
