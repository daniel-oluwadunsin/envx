# envx

Secure environment variable management for teams.

envx helps you sync .env files across machines and collaborators without storing plaintext secrets on the backend. It combines a TypeScript CLI, a NestJS API, and a Next.js dashboard with encrypted API transport and project-scoped secret versioning.

## Features

- CLI-first workflow for pulling, pushing, switching, and configuring environments
- Team and organization support with project-level access
- Versioned environment snapshots with changelog support on push
- End-to-end encrypted API payload transport (request and response)
- Encrypted-at-rest environment blobs stored per project/version
- Passwordless email auth and browser-assisted CLI device login
- Git host integrations for GitHub and GitLab secret deployment
- Web dashboard for auth, organizations, projects, invitations, and profile management

## Architecture Overview

At a high level:

1. CLI or dashboard encrypts API request body with AES-256-GCM.
2. AES key is encrypted with server RSA public key and sent in headers.
3. Server decrypts request, performs action, then encrypts response body back to client.
4. For env file storage, server decrypts incoming env payload and re-encrypts it with a per-project key.
5. Only encrypted env blobs are persisted (uploaded to object storage and referenced by URL).

For project access:

- Each project has a generated projectKey.
- For each user with access, projectKey is encrypted with that user's encryptionKey and stored in UserProjectAccess.encryptedKey.
- Access checks validate this encrypted key mapping before environment operations.

## Repository Structure

```text
envx/
  cli/      # Commander-based CLI, keychain auth, local env sync
  server/   # NestJS API, auth/session, project/org/env services, encryption
  client/   # Next.js dashboard, auth/org/project UX, encrypted API client
```

## Clone and Run Locally

### Prerequisites

- Node.js 18+
- npm 9+
- MongoDB connection (Atlas or local)
- Redis instance

### 1) Clone

```bash
git clone https://github.com/daniel-oluwadunsin/envx.git
cd envx
```

### 2) Install dependencies

```bash
cd server && npm install
cd ../client && npm install
cd ../cli && npm install
cd ..
```

### 3) Configure environment files

Copy sample files and fill in your values:

```bash
cp server/.env.sample server/.env
cp client/.env.sample client/.env
```

Notes:

- server/.env contains database, redis, jwt, encryption, oauth, mail, and storage configuration.
- client/.env contains browser-side API URL and the public encryption key.
- Do not commit real secrets.

### 4) Start the backend

```bash
cd server
npm run start:dev
```

### 5) Start the web app

```bash
cd client
npm run dev
```

### 6) Build and run the CLI

```bash
cd cli
npm run build
npm run dev
```

For global CLI installation:

```bash
cd cli
npm run build
npm install -g .
envx --version
```

## Authentication Flow

### Web auth (passwordless)

1. POST /auth/sign-in (or POST /auth/sign-up) sends a 6-digit code by email.
2. Client submits code via POST /auth/sign-in-with-code.
3. Server creates a session and returns an access token.
4. Web app stores token in a persisted Zustand store.

### CLI auth (device flow)

1. envx login calls POST /auth/cli/init to create a temporary deviceCode.
2. CLI opens browser at /cli?code=<deviceCode>.
3. Signed-in user authorizes device via POST /auth/cli/authorize.
4. CLI polls POST /auth/cli/verify until status changes.
5. On success, CLI stores userId, userName, and accessToken in OS keychain via keytar.

All non-public CLI commands are guarded by a pre-action auth hook that requires a stored access token.

## CLI Usage

```bash
envx <command> [options]
```

### Core Commands

- envx init
- envx configure
- envx login
- envx logout
- envx switch <environment>
- envx pull
- envx push --changelog "..."
- envx help [command]

### Organization and Project Commands

```bash
envx organizations list
envx projects list
envx projects list --organization <organizationId>
```

### Environment Commands

```bash
envx environments list
envx environments list --project <projectId>

envx environments create
envx environments create staging
envx environments create production --project <projectId>
```

### Git Host Commands

Manage GitHub and GitLab provider authorization, registered repository origins, and secret deployment.

```bash
envx githost authorize [provider]
envx githost logout [provider] [--remove-origins]
envx githost add <originName> <url>
envx githost get-hosts [provider]
envx githost deploy <originName> <deployTarget> [options]
```

Supported providers:

- github
- gitlab

Deploy targets:

- environment
- action

githost deploy options:

- -e, --environment <envxEnvironment>
- -v, --version <version>
- --ge, --githost-environment <githostEnvironment> (required when deployTarget is environment)
- --no-merge (delete remote secrets that are not present in source env)

Examples:

```bash
envx githost authorize github
envx githost add my-repo https://github.com/acme/my-repo
envx githost get-hosts github

envx githost deploy my-repo action -e production -v 3
envx githost deploy my-repo environment -e production --ge staging
```

## Full Workflow

```bash
# 1) Authenticate CLI
envx login

# 2) Initialize project config interactively
envx init

# 3) Check available orgs/projects/envs
envx organizations list
envx projects list
envx environments list

# 4) Switch to target environment and pull latest secrets
envx switch staging
envx pull

# 5) Update local .env and push a new version
envx push --changelog "Add STRIPE_WEBHOOK_SECRET"

# 6) Deploy to git host
envx githost deploy my-repo action -e staging
```

Generated or updated local files:

- envx-config.json (project/env/version + local pull behavior)
- .env (or configured path)
- .env.backup (when backup is enabled)

## Encryption Model

envx applies encryption in two layers:

### 1) Transport encryption (CLI/dashboard <-> API)

- Request body encrypted with AES-256-GCM
- AES key encrypted with server RSA public key (RSA-OAEP-SHA256)
- Server decrypts request using private key
- Response encrypted back to client

### 2) Environment storage encryption (server-side persistence)

- Incoming env payload is decrypted server-side
- Parsed env object is re-encrypted using project-specific projectKey
- Encrypted blob is uploaded to object storage and versioned in DB
- Retrieval decrypts blob with projectKey before returning data to authorized client

Result: plaintext env data is not stored in the database or object storage.

## Security Notes

- Server uses a global auth guard; only explicit public routes bypass auth.
- CLI tokens are stored in OS keychain (keytar), not plaintext config.
- Project access is cryptographically verified before environment reads and writes.
- Environment payloads are encrypted in transit and encrypted at rest.
- Team membership changes trigger project access grant and removal events.

## Open Source Contribution Docs

- Contribution Guide: [CONTRIBUTING.md](CONTRIBUTING.md)
- Code of Conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- Security Policy: [SECURITY.md](SECURITY.md)
- License: [LICENSE](LICENSE)

Please read these before opening issues or pull requests.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make your changes in the relevant package (cli, server, client).
4. Run package-local checks/builds.
5. Open a pull request with a clear description.

See [CONTRIBUTING.md](CONTRIBUTING.md) for full details.

## License

This project is licensed under the MIT License. See LICENSE for details.
