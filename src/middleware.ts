import { defineMiddleware } from 'astro:middleware';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const PROTECTED_PREFIXES = ['/admin', '/api'];

let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;
let jwksTeamDomain: string | null = null;

function getJWKS(teamDomain: string) {
  if (!jwksCache || jwksTeamDomain !== teamDomain) {
    jwksCache = createRemoteJWKSet(
      new URL(`https://${teamDomain}/cdn-cgi/access/certs`),
    );
    jwksTeamDomain = teamDomain;
  }
  return jwksCache;
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = new URL(context.request.url);
  if (!isProtected(pathname)) return next();

  if (import.meta.env.DEV) {
    context.locals.accessUser = { email: 'dev@local', sub: 'dev' };
    return next();
  }

  const env = context.locals.runtime?.env;
  const teamDomain = env?.ACCESS_TEAM_DOMAIN;
  const aud = env?.ACCESS_AUD;
  if (!teamDomain || !aud) {
    return new Response('Access not configured (ACCESS_TEAM_DOMAIN / ACCESS_AUD missing).', { status: 500 });
  }

  const token =
    context.request.headers.get('Cf-Access-Jwt-Assertion') ??
    context.request.headers
      .get('cookie')
      ?.match(/(?:^|;\s*)CF_Authorization=([^;]+)/)?.[1] ??
    null;

  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, getJWKS(teamDomain), {
      issuer: `https://${teamDomain}`,
      audience: aud,
    });
    context.locals.accessUser = {
      email: typeof payload.email === 'string' ? payload.email : 'unknown',
      sub: typeof payload.sub === 'string' ? payload.sub : 'unknown',
    };
    return next();
  } catch {
    return new Response('Forbidden', { status: 403 });
  }
});
