# User Setup Required: GitHub App OAuth

**Plan:** 01-02 (GitHub App OAuth and API integration)  
**Status:** Incomplete - Awaiting user configuration

---

## Required Services

### GitHub App

**Purpose:** OAuth authentication and GitHub API access

#### Account Setup

1. **Create GitHub App**
   - **Location:** GitHub Settings → Developer settings → GitHub Apps → New GitHub App
   - **Details:**
     - App name: `GSD Orchestrator (Dev)`
     - Homepage URL: `http://localhost:3000`
     - Callback URL: `http://localhost:3000/api/auth/callback`
     - Webhook: Disabled (for now)
     - Permissions:
       * Actions: Read & Write
       * Checks: Read-only
       * Contents: Read-only
       * Metadata: Read-only
     - Where can this app be installed: Only on this account

2. **Generate private key**
   - **Location:** GitHub App settings → Generate a private key
   - **Details:** Download `.pem` file, save to project root as `github-app-private-key.pem`

#### Environment Variables

Create a `.env` file in the project root with these values:

| Variable | Source | Example |
|----------|--------|---------|
| `GITHUB_APP_ID` | GitHub App settings → App ID (top of page) | `123456` |
| `GITHUB_APP_PRIVATE_KEY_PATH` | Path to downloaded .pem file | `./github-app-private-key.pem` |
| `GITHUB_CLIENT_ID` | GitHub App settings → Client ID | `Iv1.1234567890abcdef` |
| `GITHUB_CLIENT_SECRET` | GitHub App settings → Generate a new client secret | `1234567890abcdef1234567890abcdef12345678` |
| `GITHUB_CALLBACK_URL` | OAuth callback URL | `http://localhost:3000/api/auth/callback` |

#### Verification Commands

After setting environment variables:

```bash
# 1. Start the server
npm run dev

# 2. Test auth endpoint (should return GitHub OAuth URL)
curl http://localhost:3000/api/auth/login

# 3. Visit the URL in a browser, authorize the app
# You should be redirected back to http://localhost:3000/dashboard

# 4. Check auth status
curl http://localhost:3000/api/auth/status
# Should return: {"authenticated":true,"expiresAt":<timestamp>}

# 5. Test repo endpoint (should work now that you're authenticated)
curl -X POST http://localhost:3000/api/repos \
  -H "Content-Type: application/json" \
  -d '{"owner":"octocat","name":"Hello-World"}'

# 6. List repos
curl http://localhost:3000/api/repos
```

---

## Notes

- **Private key security:** The `.pem` file contains sensitive credentials. Never commit it to git (already in `.gitignore`).
- **Client secret security:** Store securely, never commit to git. Rotate if compromised.
- **Token expiry:** OAuth access tokens expire in 8 hours. Re-authenticate by visiting `/api/auth/login` again.
- **Installation ID:** Not needed for OAuth flow, only for GitHub App installation tokens (used internally by the API client).

---

*Setup created: 2026-02-10*  
*Complete the steps above before proceeding to Plan 01-03*
