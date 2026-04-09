import Link from "next/link";

export type NavItem = {
  title: string;
  href: string;
  description?: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export type DocPage = {
  slug: string[];
  title: string;
  description: string;
  related?: NavItem[];
  content: React.ReactNode;
};

export const docsNavGroups: NavGroup[] = [
  {
    title: "Getting Started",
    items: [
      {
        title: "Overview",
        href: "/docs/overview",
        description: "What envx is and how the system fits together",
      },
      {
        title: "Installation",
        href: "/docs/installation",
        description: "Run server/client locally and install CLI globally",
      },
      {
        title: "Guides and Tutorials",
        href: "/docs/guides/tutorials",
        description: "First-time workflows using dashboard and CLI",
      },
    ],
  },
  {
    title: "CLI Reference",
    items: [
      {
        title: "Setup",
        href: "/docs/cli/setup",
        description: "init, configure, login, logout, and help",
      },
      {
        title: "Projects and Organizations",
        href: "/docs/cli/projects-organizations",
        description: "organizations list and projects list",
      },
      {
        title: "Environment Management",
        href: "/docs/cli/environment-management",
        description: "environments list/create and switch",
      },
      {
        title: "Syncing",
        href: "/docs/cli/syncing",
        description: "pull and push",
      },
      {
        title: "Git Host Integration",
        href: "/docs/cli/githost",
        description: "authorize, origins, and secret deployment",
      },
    ],
  },
  {
    title: "Platform",
    items: [
      {
        title: "Dashboard",
        href: "/docs/dashboard",
        description: "Web flows for orgs, projects, and auth",
      },
      {
        title: "Security",
        href: "/docs/security",
        description: "Encryption model, auth flow, and key handling",
      },
    ],
  },
  {
    title: "Community",
    items: [
      {
        title: "Contribution",
        href: "/docs/contribution",
        description: "Open-source workflow and quality checks",
      },
      {
        title: "FAQs",
        href: "/docs/faqs",
        description: "Common onboarding and troubleshooting answers",
      },
    ],
  },
];

export const allDocPages: DocPage[] = [
  {
    slug: ["overview"],
    title: "Overview",
    description:
      "envx combines a CLI, an API, and a dashboard to make environment management secure and practical for teams.",
    related: [
      { title: "Installation", href: "/docs/installation" },
      { title: "Security", href: "/docs/security" },
      { title: "CLI Setup", href: "/docs/cli/setup" },
    ],
    content: (
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            How envx Works
          </h2>
          <p className="text-muted-foreground">
            envx uses three surfaces together: the CLI for daily developer
            workflows, the server API for encrypted transport and persistence,
            and the dashboard for team and project management.
          </p>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`Developer CLI  --->  NestJS API  --->  Encrypted Blob Storage
       |                 |                    |
       |                 +--> MongoDB         +--> .env versions
       |                 +--> Redis
       |
       +--> Browser auth handoff (device login)`}</code>
          </pre>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Core CLI Surface
          </h2>
          <p className="text-muted-foreground">
            The command set is designed around setup, project selection,
            environment syncing, and deployment to supported git providers.
          </p>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`envx init
envx configure
envx login
envx logout
envx organizations list
envx projects list --organization <organizationId>
envx environments list --project <projectId>
envx environments create [name] --project <projectId>
envx switch <environment> --version <version>
envx pull [options]
envx push --changelog "message"
envx githost <subcommand>
envx help [command]`}</code>
          </pre>
          <p className="text-sm text-muted-foreground">
            Continue with{" "}
            <Link className="underline" href="/docs/guides/tutorials">
              Guides and Tutorials
            </Link>{" "}
            for a first end-to-end flow.
          </p>
        </section>
      </div>
    ),
  },
  {
    slug: ["installation"],
    title: "Installation",
    description:
      "Set up API and dashboard locally, then install the CLI from npm.",
    related: [
      { title: "Guides and Tutorials", href: "/docs/guides/tutorials" },
      { title: "CLI Setup", href: "/docs/cli/setup" },
    ],
    content: (
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Prerequisites
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Node.js 18 or newer</li>
            <li>npm 9 or newer</li>
            <li>MongoDB connection string</li>
            <li>Redis instance</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Install Local App Dependencies
          </h2>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`git clone https://github.com/daniel-oluwadunsin/envx.git
cd envx

cd server && npm install
cd ../client && npm install`}</code>
          </pre>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Install envx CLI from npm
          </h2>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`npm i -g @envx/cli
envx --version`}</code>
          </pre>
          <p className="text-sm text-muted-foreground">
            This installs the published CLI globally so you can use envx in any
            project.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Configure Environment Files
          </h2>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`cp server/.env.sample server/.env
cp client/.env.sample client/.env`}</code>
          </pre>
          <p className="text-sm text-muted-foreground">
            Keep secrets out of git and rotate anything accidentally exposed.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            envx-config.json in Project Root
          </h2>
          <p className="text-muted-foreground">
            Running <code>envx init</code> creates an{" "}
            <code>envx-config.json</code>
            file in your current project root. envx reads this file for project
            and environment context in commands like <code>pull</code>,
            <code>push</code>, <code>switch</code>, and all
            <code>githost</code> operations.
          </p>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`{
  "projectId": "<project-id>",
  "currentEnvVersion": 3,
  "environment": "staging",
  "localBackupBeforePull": true,
  "localBackupPath": ".env.backup",
  "envFilePath": ".env",
  "alwaysOverrideEnvFile": false
}`}</code>
          </pre>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Property</th>
                  <th className="px-3 py-2 font-medium">Meaning</th>
                  <th className="px-3 py-2 font-medium">Default on init</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-3 py-2">projectId</td>
                  <td className="px-3 py-2">Selected envx project ID.</td>
                  <td className="px-3 py-2">(set during prompts)</td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">environment</td>
                  <td className="px-3 py-2">Active environment slug.</td>
                  <td className="px-3 py-2">empty string if none selected</td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">currentEnvVersion</td>
                  <td className="px-3 py-2">Tracked active version number.</td>
                  <td className="px-3 py-2">1 or selected env latest</td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">envFilePath</td>
                  <td className="px-3 py-2">
                    Local env file path for pull/push.
                  </td>
                  <td className="px-3 py-2">.env</td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">localBackupBeforePull</td>
                  <td className="px-3 py-2">Create backup before pull.</td>
                  <td className="px-3 py-2">true</td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">localBackupPath</td>
                  <td className="px-3 py-2">Backup file path.</td>
                  <td className="px-3 py-2">.env.backup</td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">alwaysOverrideEnvFile</td>
                  <td className="px-3 py-2">
                    Whether pulls fully overwrite by default.
                  </td>
                  <td className="px-3 py-2">false</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">
            File path is always your current working directory plus
            <code>envx-config.json</code>. Run commands from your project root.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Run Each Surface
          </h2>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`# Terminal 1
cd server
npm run start:dev

# Terminal 2
cd client
npm run dev

# Terminal 3
envx help`}</code>
          </pre>
        </section>
      </div>
    ),
  },
  {
    slug: ["guides", "tutorials"],
    title: "Guides and Tutorials",
    description:
      "Practical flows for first-time teams using both the dashboard and CLI.",
    related: [
      { title: "Dashboard", href: "/docs/dashboard" },
      { title: "Syncing", href: "/docs/cli/syncing" },
      { title: "Git Host Integration", href: "/docs/cli/githost" },
    ],
    content: (
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Tutorial: First Project Setup
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
            <li>
              Sign in on the dashboard and ensure you belong to an organization.
            </li>
            <li>Install envx CLI globally from npm.</li>
            <li>Run CLI login to authenticate your local machine.</li>
            <li>
              Run init to choose organization, project, and default environment.
            </li>
            <li>
              Pull variables, edit locally, then push a new version with
              changelog.
            </li>
          </ol>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`npm i -g @envx/cli
envx login
envx init
envx pull
envx push --changelog "Add STRIPE_WEBHOOK_SECRET"`}</code>
          </pre>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Tutorial: Deploy to Git Provider
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
            <li>Authorize your project with GitHub or GitLab.</li>
            <li>Register the repository origin URL.</li>
            <li>Deploy to action or environment target.</li>
          </ol>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`envx githost authorize github
envx githost add app-repo https://github.com/acme/app
envx githost deploy app-repo action -e production`}</code>
          </pre>
          <p className="text-sm text-muted-foreground">
            For flags and target semantics, see{" "}
            <Link className="underline" href="/docs/cli/githost">
              Git Host Integration
            </Link>
            .
          </p>
        </section>
      </div>
    ),
  },
  {
    slug: ["dashboard"],
    title: "Dashboard",
    description:
      "Use the web app for account authentication, organizations, projects, and invitations.",
    related: [
      { title: "Guides and Tutorials", href: "/docs/guides/tutorials" },
      { title: "CLI Setup", href: "/docs/cli/setup" },
    ],
    content: (
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            What You Do in the Dashboard
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Passwordless sign up and sign in</li>
            <li>Organization and project membership management</li>
            <li>Project-level views for environments and versions</li>
            <li>CLI login authorization handoff during device flow</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            CLI + Dashboard Handoff
          </h2>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`1) Run: envx login
2) Browser opens with /cli?code=<deviceCode>
3) Confirm authorization in dashboard
4) CLI receives token and stores it in OS keychain`}</code>
          </pre>
          <p className="text-sm text-muted-foreground">
            Continue to{" "}
            <Link className="underline" href="/docs/cli/setup">
              CLI Setup
            </Link>{" "}
            after authorization.
          </p>
        </section>
      </div>
    ),
  },
  {
    slug: ["security"],
    title: "Security",
    description:
      "Understand transport encryption, storage encryption, and key access patterns.",
    related: [
      { title: "Overview", href: "/docs/overview" },
      { title: "Git Host Integration", href: "/docs/cli/githost" },
    ],
    content: (
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Transport Encryption Flow
          </h2>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`CLI / Dashboard
    |
    | 1) Generate AES key
    | 2) Encrypt request body (AES-256-GCM)
    | 3) Encrypt AES key with server RSA public key
    v
Server API
    |
    | 4) Decrypt AES key (RSA private key)
    | 5) Decrypt request body
    | 6) Process request
    | 7) Encrypt response body back to client
    v
CLI / Dashboard`}</code>
          </pre>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Environment Storage Encryption Flow
          </h2>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`Incoming .env payload
    |
    v
Server decrypts payload
    |
    v
Re-encrypt with projectKey
    |
    v
Upload encrypted blob to object storage
    |
    v
Store blob URL + version metadata in database`}</code>
          </pre>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Operational Security Tips
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              Keep JWT secret, Redis credentials, and private keys out of source
              control.
            </li>
            <li>
              Use least-privilege IAM and OAuth scopes for deployment
              integrations.
            </li>
            <li>
              Rotate credentials when team membership changes or after suspected
              leakage.
            </li>
            <li>Use changelogs on push for auditability.</li>
          </ul>
        </section>
      </div>
    ),
  },
  {
    slug: ["contribution"],
    title: "Contribution",
    description:
      "Open-source workflow and quality expectations for contributors.",
    related: [
      { title: "FAQs", href: "/docs/faqs" },
      { title: "Installation", href: "/docs/installation" },
    ],
    content: (
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Contribution Workflow
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
            <li>Fork and create a focused feature branch.</li>
            <li>
              Implement changes in the relevant package(s): client, server, or
              cli.
            </li>
            <li>Run package-level checks before opening a PR.</li>
            <li>Submit a PR with context, screenshots, and testing notes.</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Local Validation Commands
          </h2>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`# server
cd server && npm run lint && npm test

# client
cd client && npm run lint && npm run build

# cli
cd cli && npm run build`}</code>
          </pre>
          <p className="text-sm text-muted-foreground">
            See repository-level policies in CONTRIBUTING.md,
            CODE_OF_CONDUCT.md, and SECURITY.md.
          </p>
        </section>
      </div>
    ),
  },
  {
    slug: ["faqs"],
    title: "FAQs",
    description: "Frequently asked questions for first-time operators.",
    related: [
      { title: "Installation", href: "/docs/installation" },
      { title: "CLI Syncing", href: "/docs/cli/syncing" },
      { title: "Security", href: "/docs/security" },
    ],
    content: (
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Common Questions
          </h2>
          <div className="space-y-5 text-muted-foreground">
            <div>
              <h3 className="font-medium text-foreground">
                Why does pull ask for confirmation when versions differ?
              </h3>
              <p>
                The CLI protects you from accidental rollback or overwrite when
                the local tracked version is ahead of or equal to remote.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                Where are CLI auth tokens stored?
              </h3>
              <p>
                Tokens are stored in the OS keychain via keytar, not in
                envx-config.json.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                Where is envx-config.json created?
              </h3>
              <p>
                envx writes envx-config.json to your current working directory.
                Run envx from your project root so pull, push, switch, and
                githost commands use the expected config file.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                What happens with githost deploy --no-merge?
              </h3>
              <p>
                Non-matching remote secrets are removed so the destination
                exactly matches the selected env source.
              </p>
            </div>
          </div>
        </section>
      </div>
    ),
  },
  {
    slug: ["cli", "setup"],
    title: "CLI Setup",
    description:
      "Install the CLI package, then run setup and discovery commands.",
    related: [
      { title: "Installation", href: "/docs/installation" },
      {
        title: "Projects and Organizations",
        href: "/docs/cli/projects-organizations",
      },
      {
        title: "Environment Management",
        href: "/docs/cli/environment-management",
      },
    ],
    content: (
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Install the CLI Package
          </h2>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`npm i -g @envx/cli
envx --version`}</code>
          </pre>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">Commands</h2>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`envx init
envx configure
envx login
envx logout
envx help [command]`}</code>
          </pre>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Usage Examples
          </h2>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`npm i -g @envx/cli
envx login
envx init
envx configure
envx help
envx help pull`}</code>
          </pre>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Step-by-Step
          </h2>
          <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
            <li>Install the published CLI package globally.</li>
            <li>Run login and complete browser authorization.</li>
            <li>
              Run init to select organization, project, and default environment.
            </li>
            <li>Use configure when project or env context changes.</li>
            <li>
              Use help for command-specific usage and option descriptions.
            </li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            What envx init Asks You
          </h2>
          <p className="text-muted-foreground">
            <code>envx init</code> is interactive. The exact questions depend on
            your organization/project state.
          </p>
          <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
            <li>
              Organization: if you belong to multiple orgs, it asks
              <code>Select an organization:</code>. If there is only one org, it
              auto-selects it.
            </li>
            <li>
              Project: it asks <code>Select a project:</code> with existing
              projects plus <code>Create new project</code>.
            </li>
            <li>
              New project name: if you choose create project, it asks
              <code>
                What do you want to name your new project? (You can also change
                this later in the web app)
              </code>
              .
            </li>
            <li>
              Environment: if environments exist, it asks
              <code>Select an environment to pull:</code>. If none exist, it
              skips this and still writes config.
            </li>
          </ol>
          <p className="text-sm text-muted-foreground">
            After selection, envx writes <code>envx-config.json</code> and tries
            to pull the selected environment version into your local env file.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            What envx configure Asks You
          </h2>
          <p className="text-muted-foreground">
            <code>envx configure</code> uses the same prompt flow as
            <code>init</code>, but starts from your existing
            <code>envx-config.json</code> and rewrites it with your new
            selections.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>It requires envx-config.json to already exist.</li>
            <li>It prints your current config first.</li>
            <li>
              It re-asks organization, project, and environment selection.
            </li>
            <li>
              If no environments are found for the selected project, it warns
              and sets an empty environment in config.
            </li>
          </ul>
        </section>
      </div>
    ),
  },
  {
    slug: ["cli", "projects-organizations"],
    title: "CLI Projects and Organizations",
    description:
      "List your organizations and projects using server-backed access control.",
    related: [
      { title: "CLI Setup", href: "/docs/cli/setup" },
      {
        title: "Environment Management",
        href: "/docs/cli/environment-management",
      },
    ],
    content: (
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">Commands</h2>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`envx organizations list
envx projects list
envx projects list --organization <organizationId>`}</code>
          </pre>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">Options</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Command</th>
                  <th className="px-3 py-2 font-medium">Flag</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-3 py-2">projects list</td>
                  <td className="px-3 py-2">
                    -o, --organization &lt;organizationId&gt;
                  </td>
                  <td className="px-3 py-2">
                    Filter projects by organization ID.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    ),
  },
  {
    slug: ["cli", "environment-management"],
    title: "CLI Environment Management",
    description:
      "Create, list, and switch environment contexts for a configured project.",
    related: [
      { title: "CLI Syncing", href: "/docs/cli/syncing" },
      {
        title: "CLI Projects and Organizations",
        href: "/docs/cli/projects-organizations",
      },
    ],
    content: (
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">Commands</h2>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`envx environments list [--project <projectId>]
envx environments create [name] [--project <projectId>]
envx switch <environment> [--project <projectId>] [--version <version>]`}</code>
          </pre>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">Options</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Command</th>
                  <th className="px-3 py-2 font-medium">Flag</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-3 py-2">environments list</td>
                  <td className="px-3 py-2">-p --project &lt;projectId&gt;</td>
                  <td className="px-3 py-2">Specify target project ID.</td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">environments create</td>
                  <td className="px-3 py-2">-p --project &lt;projectId&gt;</td>
                  <td className="px-3 py-2">
                    Create environment in provided project.
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">switch</td>
                  <td className="px-3 py-2">-p --project &lt;projectId&gt;</td>
                  <td className="px-3 py-2">
                    Switch in a specific project context.
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">switch</td>
                  <td className="px-3 py-2">-v, --version &lt;version&gt;</td>
                  <td className="px-3 py-2">
                    Pin environment to a specific version.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    ),
  },
  {
    slug: ["cli", "syncing"],
    title: "CLI Syncing",
    description:
      "Pull remote env versions to local files and push local changes as new versions.",
    related: [
      {
        title: "CLI Environment Management",
        href: "/docs/cli/environment-management",
      },
      { title: "Git Host Integration", href: "/docs/cli/githost" },
    ],
    content: (
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">Commands</h2>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`envx pull [options]
envx push --changelog "message"`}</code>
          </pre>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Options Table
          </h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Command</th>
                  <th className="px-3 py-2 font-medium">Flag</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-3 py-2">pull</td>
                  <td className="px-3 py-2">-f --file &lt;filePath&gt;</td>
                  <td className="px-3 py-2">
                    Write output to custom env path.
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">pull</td>
                  <td className="px-3 py-2">
                    -e --environment &lt;environment&gt;
                  </td>
                  <td className="px-3 py-2">
                    Override configured environment.
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">pull</td>
                  <td className="px-3 py-2">-v, --version &lt;version&gt;</td>
                  <td className="px-3 py-2">Pull a specific remote version.</td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">pull</td>
                  <td className="px-3 py-2">--no-backup</td>
                  <td className="px-3 py-2">Skip local backup before pull.</td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">pull</td>
                  <td className="px-3 py-2">
                    --backup-path &lt;backupPath&gt;
                  </td>
                  <td className="px-3 py-2">Set custom backup file path.</td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">pull</td>
                  <td className="px-3 py-2">--no-config</td>
                  <td className="px-3 py-2">
                    Do not persist env/version to config.
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">pull</td>
                  <td className="px-3 py-2">--no-override</td>
                  <td className="px-3 py-2">
                    Merge instead of overriding local env file.
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">push</td>
                  <td className="px-3 py-2">
                    -c, --changelog &lt;changelog&gt;
                  </td>
                  <td className="px-3 py-2">
                    Required changelog message for version creation.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Usage Examples
          </h2>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`envx pull --environment staging --version 4 --file .env.staging
envx pull --no-backup --no-config --no-override
envx push --changelog "Rotate DB credentials"`}</code>
          </pre>
        </section>
      </div>
    ),
  },
  {
    slug: ["cli", "githost"],
    title: "CLI Git Host Integration",
    description:
      "Authorize providers, register repository origins, and deploy secrets.",
    related: [
      { title: "CLI Syncing", href: "/docs/cli/syncing" },
      { title: "Security", href: "/docs/security" },
    ],
    content: (
      <div className="space-y-8">
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">Commands</h2>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`envx githost authorize [provider]
envx githost logout [provider] [--remove-origins]
envx githost add <originName> <url>
envx githost get-hosts [provider]
envx githost deploy <originName> <deployTarget> [options]`}</code>
          </pre>
          <p className="text-sm text-muted-foreground">
            Supported providers: github, gitlab.
          </p>
          <p className="text-sm text-muted-foreground">
            Deploy targets: environment, action.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Options Table
          </h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Command</th>
                  <th className="px-3 py-2 font-medium">Flag</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-3 py-2">githost logout</td>
                  <td className="px-3 py-2">--remove-origins</td>
                  <td className="px-3 py-2">
                    Also remove associated origins when revoking provider auth.
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">githost deploy</td>
                  <td className="px-3 py-2">
                    -e, --environment &lt;envxEnvironment&gt;
                  </td>
                  <td className="px-3 py-2">Source envx environment slug.</td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">githost deploy</td>
                  <td className="px-3 py-2">-v, --version &lt;version&gt;</td>
                  <td className="px-3 py-2">
                    Source version number. Latest used when omitted.
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">githost deploy</td>
                  <td className="px-3 py-2">
                    --ge, --githost-environment &lt;githostEnvironment&gt;
                  </td>
                  <td className="px-3 py-2">
                    Required when deployTarget is environment.
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2">githost deploy</td>
                  <td className="px-3 py-2">--no-merge</td>
                  <td className="px-3 py-2">
                    Delete remote secrets not present in source env.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            Usage Examples
          </h2>
          <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-sm">
            <code>{`envx githost authorize github
envx githost add web https://github.com/acme/web
envx githost get-hosts github
envx githost deploy web action -e production -v 3
envx githost deploy web environment -e production --ge staging --no-merge`}</code>
          </pre>
        </section>
      </div>
    ),
  },
];

export const DOCS_HOME_CARDS: NavItem[] = docsNavGroups.flatMap(
  (group) => group.items,
);

export function findDocBySlug(slug: string[]): DocPage | undefined {
  return allDocPages.find((page) => page.slug.join("/") === slug.join("/"));
}

export function pageHref(page: DocPage): string {
  return `/docs/${page.slug.join("/")}`;
}
