import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';
import { SharedArray } from 'k6/data';

const failures = new Rate('failed_checks');
const createdCases = new Counter('created_cases');
const users = new SharedArray('login users', () => JSON.parse(__ENV.LOGIN_USERS || '[]'));
const payload = __ENV.CASE_PAYLOAD;
export const options = {
  stages: [
    { duration: '1m', target: 10 }, { duration: '2m', target: 50 },
    { duration: '2m', target: 100 }, { duration: '2m', target: 200 }, { duration: '1m', target: 0 },
  ],
  thresholds: { http_req_duration: ['p(95)<1500', 'p(99)<4000'], failed_checks: ['rate<0.05'] },
};

export default function () {
  const base = __ENV.BASE_URL;
  if (!base) throw new Error('Define BASE_URL apuntando a localhost/staging controlado');
  const identity = users.length ? users[(__VU - 1) % users.length] : null;
  let token = __ENV.TOKEN || '';
  if (identity) {
    const login = http.post(`${base}/api/auth/login`, JSON.stringify(identity), { headers: { 'Content-Type': 'application/json' } });
    const ok = check(login, { 'login 200': (r) => r.status === 200 });
    failures.add(!ok);
    if (ok) token = login.json('data.token') || '';
  }
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const inbox = http.get(`${base}/api/casos/bandeja`, { headers });
  failures.add(!check(inbox, { 'bandeja responde': (r) => r.status === 200 }));
  const dashboard = http.get(`${base}/api/dashboard/resumen`, { headers });
  failures.add(!check(dashboard, { 'dashboard responde': (r) => r.status === 200 }));

  if (payload && __ENV.CREATE_CASES === 'true' && token) {
    const created = http.post(`${base}/api/casos`, payload, { headers: { ...headers, 'Content-Type': 'application/json' } });
    const ok = check(created, { 'caso creado sin colisión': (r) => r.status === 201 });
    failures.add(!ok);
    if (ok) createdCases.add(1);
  }
  sleep(1);
}
