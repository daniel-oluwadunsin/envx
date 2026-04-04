# envx

Secure environment variable management for teams.

envx helps you sync `.env` files across machines and collaborators without storing plaintext secrets on the backend. It combines a TypeScript CLI, a NestJS API, and a Next.js dashboard with encrypted API transport and project-scoped secret versioning.

## Features

- CLI-first workflow for pulling, pushing, switching, and configuring environments
- Team and organization support with project-level access
- Versioned environment snapshots with changelog support on push
- End-to-end encrypted API payload transport (request + response)
- Encrypted-at-rest environment blobs stored per project/version
- Passwordless email auth and browser-assisted CLI device login
- Web dashboard for auth, organizations, projects, invitations, and profile management

## Architecture Overview

At a high level:

1. CLI or dashboard encrypts API request body with AES-256-GCM.
2. AES key is encrypted with server RSA public key and sent in headers.
3. Server decrypts request, performs action, then encrypts response body back to client.
4. For env file storage, server decrypts incoming env payload and re-encrypts it with a per-project key.
5. Only encrypted env blobs are persisted (uploaded to object storage and referenced by URL).

For project access:

- Each project has a generated `projectKey`.
- For each user with access, `projectKey` is encrypted with that user's `encryptionKey` and stored in `UserProjectAccess.encryptedKey`.
- Access checks validate this encrypted key mapping before environment operations.

## Installation (CLI)

This repository contains the CLI source in `cli/`.

```bash
cd cli
npm install
npm run build
npm install -g .
```

After installation:

```bash
envx --version
```

## Authentication Flow

### Web auth (passwordless)

1. `POST /auth/sign-in` (or `POST /auth/sign-up`) sends a 6-digit code by email.
2. Client submits code via `POST /auth/sign-in-with-code`.
3. Server creates a session and returns an access token.
4. Web app stores token in a persisted Zustand store.

### CLI auth (device flow)

1. `envx login` calls `POST /auth/cli/init` to create a temporary `deviceCode`.
2. CLI opens browser at `/cli?code=<deviceCode>`.
3. Signed-in user authorizes device via `POST /auth/cli/authorize`.
4. CLI polls `POST /auth/cli/verify` until status changes.
5. On success, CLI stores `{ userId, userName, accessToken }` in OS keychain via `keytar` under service `envx-cli`.

All non-public CLI commands are guarded by a pre-action auth hook that requires a stored access token.

## CLI Usage

```bash
envx <command> [options]
```

### Global options

- `-V, --version` Show CLI version

### `init`

Initialize envx in the current project and create `envx-config.json`.

```bash
envx init
```

What it does:

- Selects organization and project (or creates a new project)
- Selects environment (if available)
- Pulls selected environment into local env file
- Writes `envx-config.json`

### `configure`

Interactively update an existing `envx-config.json`.

```bash
envx configure
```

### `login`

Authenticate CLI via browser-assisted device flow.

```bash
envx login
```

### `logout`

Clear local authenticated CLI session from keychain.

```bash
envx logout
```

### `organizations`

Organization namespace command.

```bash
envx organizations
```

### `organizations list`

List organizations available to current account.

```bash
envx organizations list
```

### `projects`

Project namespace command.

```bash
envx projects
```

### `projects list`

List accessible projects (optionally scoped to an organization).

```bash
envx projects list
envx projects list --organization <organizationId>
```

Options:

- `-o, --organization <organizationId>` Filter by organization

### `environments`

Environment namespace command.

```bash
envx environments
```

### `environments list`

List environments for a project.

```bash
envx environments list
envx environments list --project <projectId>
```

Options:

- `-p --project <projectId>` Project ID (falls back to config)

### `environments create [name]`

Create a new environment in a project.

```bash
envx environments create
envx environments create staging
envx environments create production --project <projectId>
```

Options:

- `-p --project <projectId>` Target project ID

### `switch <environment>`

Switch active environment and pull its env file locally.

```bash
envx switch staging
envx switch production --version 3
envx switch development --project <projectId>
```

Options:

- `-p --project <projectId>` Target project ID
- `-v, --version <version>` Pin environment version

### `pull`

Pull remote environment variables into local env file.

```bash
envx pull
envx pull --environment production
envx pull --environment staging --version 4 --file .env.staging
envx pull --no-backup --no-config --no-override
```

Options:

- `-f --file <filePath>` Local env file path
- `-e --environment <environment>` Environment slug
- `-v, --version <version>` Version to pull
- `--no-backup` Disable local backup before pull
- `--backup-path <backupPath>` Backup file path
- `--no-config` Do not persist pulled env/version to config
- `--no-override` Merge into local env instead of full overwrite

### `push`

Push local env file to current configured environment as a new version.

```bash
envx push --changelog "Rotate DB credentials"
```

Options:

- `-c, --changelog <changelog>` Required change description

### `help [command]`

Show overview help or command-specific help.

```bash
envx help
envx help pull
envx help "environments create"
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
```

Generated/updated local files:

- `envx-config.json` (project/env/version + local pull behavior)
- `.env` (or configured path)
- `.env.backup` (when backup is enabled)

## Encryption Model

envx applies encryption in two layers:

### 1) Transport encryption (CLI/dashboard <-> API)

- Request body encrypted with AES-256-GCM
- AES key encrypted with server RSA public key (`RSA-OAEP-SHA256`)
- Server decrypts request using private key
- Response encrypted back to client using ephemeral client-generated RSA keypair and AES

### 2) Environment storage encryption (server-side persistence)

- Incoming env payload is decrypted server-side
- Parsed env object is re-encrypted using project-specific `projectKey`
- Encrypted blob is uploaded to object storage (GCS) and versioned in DB
- Retrieval decrypts blob with `projectKey` before returning data to authorized client

Result: plaintext env data is not stored in the database or object storage.

## Security Notes

- Server uses a global auth guard; only explicit public routes bypass auth.
- CLI tokens are stored in OS keychain (`keytar`), not plaintext config.
- Project access is cryptographically verified before environment reads/writes.
- Environment payloads are encrypted in transit and encrypted at rest.
- Team membership changes trigger project access grant/removal events.

## Project Structure

```text
envx/
	cli/      # Commander-based CLI, keychain auth, local env sync
	server/   # NestJS API, auth/session, project/org/env services, encryption
	client/   # Next.js dashboard, auth/org/project UX, encrypted API client
```

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make your changes in the relevant package (`cli`, `server`, `client`).
4. Run package-local checks/builds.
5. Open a pull request with a clear description.

## License

MIT
