- GITHUB AND GITLAB SECRETS UPDATE

- envx githost [github/gitlab] authorize (if github has already been authorized for the project, ignore)
  multiple hosts can be authorized, if used without command, tell which one has already been authorized

- envx githost [gitlab/github] logout

- envx githost get-origins [github/gitlab]

- envx githost add origin http://localhost:3000/oauth.git (gets the host from the url, first check if check if they have access to the repo)
- envx githost add gitlab-origin ....

- envx githost origin/gitlab-origin deploy-secrets [enviroment/action]
  --environment staging (only is envrionment is used not action)
  --attach
  --no-merge
  --use-as-variables PORT,NODE_ENV

- envx githost origin/gitlab-origin remove-secret [enviroment/action]
  --environment staging (only is envrionment is used not action)

- envx githost origin attach-envrionment envx-staging githost-staging
