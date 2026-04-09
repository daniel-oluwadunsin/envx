# Contributing to envx

Thanks for your interest in contributing to envx.

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB connection
- Redis instance

## Development Setup

1. Fork and clone the repository.
2. Install dependencies in each package:
   - cd server && npm install
   - cd client && npm install
   - cd cli && npm install
3. Create env files from samples:
   - cp server/.env.sample server/.env
   - cp client/.env.sample client/.env
4. Start services:
   - server: cd server && npm run start:dev
   - client: cd client && npm run dev
   - cli: cd cli && npm run dev

## Branching and Commits

1. Create a feature branch from main.
2. Keep commits focused and descriptive.
3. Reference issue IDs in commit messages when available.

## Pull Requests

1. Ensure your branch is up to date with main.
2. Include a clear summary and testing notes.
3. Link related issues.
4. Add screenshots for UI changes.

## Quality Checks

Run these before opening a pull request:

- server: npm run lint, npm test
- client: npm run lint, npm run build
- cli: npm run build

## Reporting Bugs

Please include:

- Environment details (OS, Node version)
- Reproduction steps
- Expected behavior and actual behavior
- Relevant logs (with secrets redacted)

## Security

Do not open public issues for security vulnerabilities. See SECURITY.md.
