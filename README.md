eync (env sync)

AUTHENTICATION

- Users sign in with google, implement sso back to vs code when do the eync login, we store their keys in the platform keychain
- Eync login logs them in, eync logout logs them out
- When they run eync init, checks their root folder for a .eyncconfig file, adds .env.backup to gitignore for backup

.eync config file should contain project_id, organization_id, organization_name, project_name, current environment (skips adding environment when they call eync pull), local_backup_before_pull: true/false

.eync -h “echo commands”

- eync init - checks if there is a .eyncconfig file already
- eync projects list, lists all project that you have
- eync configure, lists all the projects that you have and you select the one you want
- Eync push (env optional)
  - If environment doesn’t exist, ask “are you sure you want to create a new environment, select organization and create project, or set them in the .eyncconfig file”
  - If exists, push
  - If the env is not provided, check the eync config file
- Eync pull -f <file_path>, if environment doesn’t exist, do not pull
  - if local_backup_before_pull is true: set the data of current .env to .env.backup and pull to update .env
- Eync switch <environemnt> environment to switch to
- Eync list - lists all environments

Checks

1. If creating for the first time, runs init, if there is no .eyncconfig, asks you to select projects or create a project just enter the name
2. If there is a .eyncconfig, checks the project id and if you have permission to use it, if you don’t have permission to use it, tells that you don’t have access to project in the .eyncconfig, delete it and configure a new .eyncconfig

MORE FEATURES
Phase 1 (2–3 weeks)

- Auth
- Organizations
- Projects
- Environments
- Upload encrypted env
- Pull env
- Basic CLI
  Phase 2
- Version rollback
- Audit logs
- Team roles
- CI/CD integration
  Phase 3 (🔥 killer features)
- Auto env switching per branch
- GitHub integration
- Secret rotation
- Local machine fingerprinting
- Drift detection
