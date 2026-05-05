#!/usr/bin/env node
// Idempotent provisioner for Cloudflare Access on /admin* and /api/*.
//
// Required env:
//   CF_API_TOKEN        token with Access:Edit on the account
//   CF_ACCOUNT_ID       Cloudflare account id
//   ACCESS_EMAILS       comma-separated allowed emails
//   MELIDO_DOMAIN       public hostname for the worker (e.g. meli-do.<sub>.workers.dev)
//
// On first run, ensures a Zero Trust org exists. If not, prints the dashboard
// click-path and exits non-zero. Once bootstrapped, ensures group `meli-admins`
// and an Access app whose paths cover /admin* and /api/*.

const API = 'https://api.cloudflare.com/client/v4';

function reqEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env: ${name}`);
    process.exit(1);
  }
  return v;
}

const TOKEN = reqEnv('CF_API_TOKEN');
const ACCOUNT_ID = reqEnv('CF_ACCOUNT_ID');
const EMAILS = reqEnv('ACCESS_EMAILS').split(',').map((s) => s.trim()).filter(Boolean);
const DOMAIN = reqEnv('MELIDO_DOMAIN');

async function cf(path, init = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const json = await res.json();
  if (!json.success) {
    throw new Error(`CF API ${path} failed: ${JSON.stringify(json.errors)}`);
  }
  return json.result;
}

async function ensureOrg() {
  const res = await fetch(`${API}/accounts/${ACCOUNT_ID}/access/organizations`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const json = await res.json();
  if (json.success && json.result?.auth_domain) {
    return json.result;
  }
  console.error(
    [
      '',
      'No Cloudflare Zero Trust organization found on this account.',
      'Bootstrap is a one-time manual step:',
      '  1. https://one.dash.cloudflare.com/',
      '  2. Pick a team name (becomes <team>.cloudflareaccess.com).',
      '  3. Re-run: node scripts/setup-access.mjs',
      '',
    ].join('\n'),
  );
  process.exit(2);
}

async function ensureGroup() {
  const groups = await cf(`/accounts/${ACCOUNT_ID}/access/groups`);
  const existing = groups.find((g) => g.name === 'meli-admins');
  const includeRules = EMAILS.map((email) => ({ email: { email } }));

  if (existing) {
    return cf(`/accounts/${ACCOUNT_ID}/access/groups/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: 'meli-admins', include: includeRules }),
    });
  }
  return cf(`/accounts/${ACCOUNT_ID}/access/groups`, {
    method: 'POST',
    body: JSON.stringify({ name: 'meli-admins', include: includeRules }),
  });
}

async function ensureApp(group) {
  const apps = await cf(`/accounts/${ACCOUNT_ID}/access/apps`);
  const existing = apps.find((a) => a.name === 'meli.do admin');
  const body = {
    name: 'meli.do admin',
    domain: `${DOMAIN}/admin`,
    self_hosted_domains: [
      `${DOMAIN}/admin`,
      `${DOMAIN}/api`,
      `*-${DOMAIN}/admin`,
      `*-${DOMAIN}/api`,
      'mellen.do/admin',
      'mellen.do/api',
    ],
    type: 'self_hosted',
    session_duration: '24h',
    policies: [
      {
        name: 'allow meli-admins',
        decision: 'allow',
        include: [{ group: { id: group.id } }],
      },
    ],
  };

  if (existing) {
    return cf(`/accounts/${ACCOUNT_ID}/access/apps/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }
  return cf(`/accounts/${ACCOUNT_ID}/access/apps`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

(async () => {
  const org = await ensureOrg();
  console.log(`org: ${org.auth_domain}`);
  const group = await ensureGroup();
  console.log(`group: meli-admins (${group.id}) — ${EMAILS.length} member(s)`);
  const app = await ensureApp(group);
  console.log(`app: ${app.name} (${app.id}) → ${DOMAIN}/{admin,api} + *-${DOMAIN}/{admin,api}`);
  console.log('');
  console.log('Set these for the worker:');
  console.log(`  ACCESS_TEAM_DOMAIN=${org.auth_domain}`);
  console.log(`  ACCESS_AUD=${app.aud}`);
  console.log('');
  console.log('  wrangler secret put ACCESS_TEAM_DOMAIN');
  console.log('  wrangler secret put ACCESS_AUD');
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
