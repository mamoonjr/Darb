const phone = process.argv[2] || '0791197079';
const password = process.argv[3] || '12345';
const base = process.argv[4] || 'http://localhost:3000/api';

async function main() {
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });
  const data = await res.json().catch(() => ({}));
  console.log('status', res.status);
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
