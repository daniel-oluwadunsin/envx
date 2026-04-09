- GITHUB AND GITLAB SECRETS UPDATE

- envx githost authorize [github/gitlab] (if github has already been authorized for the project, ignore)
  multiple hosts can be authorized, if used without command, tell which one has already been authorized

- envx githost logout [gitlab/github]

- envx githost get-origins [github/gitlab]

- envx githost add origin http://localhost:3000/oauth.git (gets the host from the url, first check if check if they have access to the repo)
- envx githost add gitlab-origin ....

- envx githost origin/gitlab-origin deploy-secrets [enviroment/action]
  --environment production
  --version number
  --githost-environment staging (only is envrionment is used not action)
  --no-merge

- envx githost origin/gitlab-origin remove-secret [enviroment/action] <env_key>
  --githost-environment staging (only is envrionment is used not action)
