  const base = process.env.BASE_URL;
if (!base) throw new Error('Falta BASE_URL (solo localhost/staging propio)');
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base) && process.env.ALLOW_STAGING !== 'true') {
  throw new Error('Por seguridad, staging requiere ALLOW_STAGING=true y autorización del equipo');
}
if (/prod|production/i.test(base)) throw new Error('Se prohíbe ejecutar esta prueba en producción');

const results = [];
const report = (name, ok, detail = '') => {
  results.push(Boolean(ok));
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
};
const request = (path, options = {}) => fetch(`${base}${path}`, options);
const json = (value) => ({ 'Content-Type': 'application/json', ...value });

async function main() {
  for (let i = 0; i < 9; i += 1) {
    const response = await request('/api/auth/login', { method: 'POST', headers: json(), body: JSON.stringify({ correo: process.env.BAD_LOGIN_EMAIL || 'invalid@test.local', password: process.env.BAD_LOGIN_PASSWORD || 'wrong' }) });
    if (i === 8) report('rate limit bloquea login después de 8 intentos', response.status === 429, `HTTP ${response.status}`);
  }

  for (const [name, token] of [['sin token', '' ], ['token alterado', `${process.env.PRL_TOKEN || 'invalid'}.bad`], ['token expirado', process.env.EXPIRED_TOKEN || '']]) {
    const response = await request('/api/usuarios', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    report(`auth ${name} => 401`, response.status === 401, `HTTP ${response.status}`);
  }

  for (const path of ['/api/usuarios', '/api/roles']) {
    const response = await request(path, { headers: { Authorization: `Bearer ${process.env.PRL_TOKEN || ''}` } });
    report(`PRL bloqueado de ${path}`, response.status === 403, `HTTP ${response.status}`);
  }

  for (const method of ['GET', 'PUT']) {
    const response = await request(`/api/casos/${process.env.CASE_OTHER_ID || 0}`, { method, headers: json({ Authorization: `Bearer ${process.env.PRL_TOKEN || ''}` }), ...(method === 'PUT' ? { body: JSON.stringify({ titulo: "' OR '1'='1 <script>alert(1)</script>" }) } : {}) });
    report(`IDOR ${method} caso de otra brigada bloqueado`, response.status === 403 || response.status === 404, `HTTP ${response.status}`);
  }

  const form = new FormData();
  form.append('archivos', new Blob(['<?php echo 1; ?>'], { type: 'application/pdf' }), 'forged.php');
  const upload = await request('/api/documentos', { method: 'POST', headers: { Authorization: `Bearer ${process.env.PRL_TOKEN || ''}` }, body: form });
  report('rechaza extensión falsificada', upload.status === 400, `HTTP ${upload.status}`);

  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const front = path.resolve(process.cwd(), '../Frontend-Proyecto-CasiAccidentes/src');
  let unsafe = false;
  try {
    const files = [];
    const walk = async (dir) => { for (const entry of await fs.readdir(dir, { withFileTypes: true })) { const full = path.join(dir, entry.name); if (entry.isDirectory()) await walk(full); else if (/\.(ts|html)$/.test(entry.name)) files.push(full); } };
    await walk(front);
    for (const file of files) if (/\[innerHTML\]|bypassSecurityTrustHtml/.test(await fs.readFile(file, 'utf8'))) unsafe = true;
    report('frontend no usa innerHTML inseguro', !unsafe);
  } catch (error) { report('escaneo estático frontend disponible', false, error.message); }

  if (results.some((ok) => !ok)) process.exitCode = 1;
}

main().catch((error) => { console.error(`FAIL script: ${error.message}`); process.exitCode = 1; });
