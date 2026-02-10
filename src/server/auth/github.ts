import { createAppAuth } from '@octokit/auth-app';
import { readFileSync } from 'fs';
import { saveAuthToken, getAuthToken, deleteAuthToken } from '../db/index.js';

/**
 * Get GitHub OAuth authorization URL
 */
export function getAuthUrl(): string {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    throw new Error('GITHUB_CLIENT_ID not configured');
  }

  const redirectUri = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/callback';
  const scope = ''; // GitHub App uses permissions, not scopes

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
  });

  if (scope) {
    params.append('scope', scope);
  }

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange OAuth code for access token
 */
export async function handleCallback(code: string): Promise<{ accessToken: string; expiresAt: number }> {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GitHub OAuth credentials not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: code,
  });

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange code for token: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
  }

  const accessToken = data.access_token;
  if (!accessToken) {
    throw new Error('No access token in response');
  }

  // Access tokens expire in 8 hours
  const expiresAt = Math.floor(Date.now() / 1000) + (8 * 60 * 60);

  // Store token in database for single user (userId = 'default')
  saveAuthToken('default', accessToken, expiresAt);

  return { accessToken, expiresAt };
}

/**
 * Get installation token for GitHub App API access
 */
export async function getInstallationToken(appId: string, privateKeyPath: string, installationId: number): Promise<string> {
  try {
    // Read private key from file
    const privateKey = readFileSync(privateKeyPath, 'utf-8');

    const auth = createAppAuth({
      appId,
      privateKey,
      installationId,
    });

    const { token } = await auth({ type: 'installation' });
    return token;
  } catch (error) {
    throw new Error(`Failed to get installation token: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get stored user token
 */
export function getStoredToken(userId: string = 'default'): string | null {
  const stored = getAuthToken(userId);
  return stored ? stored.accessToken : null;
}

/**
 * Clear stored token (logout)
 */
export function clearStoredToken(userId: string = 'default'): void {
  deleteAuthToken(userId);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(userId: string = 'default'): boolean {
  return getStoredToken(userId) !== null;
}

/**
 * Get token expiry time
 */
export function getTokenExpiry(userId: string = 'default'): number | null {
  const stored = getAuthToken(userId);
  return stored ? stored.expiresAt : null;
}
