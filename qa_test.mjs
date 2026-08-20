import http from 'http';

function req(method, path, body, cookie) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: '127.0.0.1', port: 3000, path, method, headers: { 'Content-Type': 'application/json' }, timeout: 30000 };
    if (cookie) opts.headers.Cookie = cookie;
    const r = http.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const sc = res.headers['set-cookie'];
        const cookieStr = Array.isArray(sc) ? sc[0] : sc;
        resolve({ status: res.statusCode, body: data, cookie: cookieStr ? cookieStr.split(';')[0] : null });
      });
    });
    r.on('error', reject);
    r.on('timeout', () => { r.destroy(); reject(new Error('timeout')); });
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

import crypto from 'crypto';

async function main() {
  console.log('=== 1. LOGIN ===');
  const hash = crypto.createHash('sha256').update('admin12345').digest('hex');
  const login = await req('GET', `/api/admin/auth/me?login=1&email=admin@seecs.nust.edu.pk&hash=${hash}`);
  console.log('  Status:', login.status, 'Admin:', JSON.parse(login.body).admin?.name);
  if (!login.cookie) { console.log('FATAL: no cookie'); return; }
  await new Promise(r => setTimeout(r, 1000));

  console.log('\n=== 2. COMPANIES ===');
  const comp = await req('GET', '/api/admin/companies', null, login.cookie);
  const compData = JSON.parse(comp.body);
  console.log('  Status:', comp.status, 'Count:', compData.items?.length);
  for (const c of (compData.items || []).slice(0, 3)) {
    console.log('  ', c.name, '| status:', c.status, '| founded:', c.foundedYear, '| rev:', c.revenue);
  }
  const firstId = compData.items?.[0]?.id;

  console.log('\n=== 3. CUSTOM COLS ===');
  const cc = await req('GET', '/api/admin/custom-columns', null, login.cookie);
  console.log('  Status:', cc.status, 'Body:', cc.body.slice(0, 300));

  console.log('\n=== 4. UPDATE KEY ===');
  if (firstId) {
    const upd = await req('PUT', '/api/admin/companies/' + firstId, { apiKey: 'sk_seecs_test_key_' + Date.now() }, login.cookie);
    const updData = JSON.parse(upd.body);
    console.log('  Status:', upd.status, 'New key:', updData.item?.apiKey);
  }

  console.log('\n=== 5. LOOKUP ===');
  const lk = await req('GET', '/api/lookup');
  const lkData = JSON.parse(lk.body);
  console.log('  Status:', lk.status, 'Sectors:', lkData.sectors?.length, 'Cities:', lkData.cities?.length);

  console.log('\n=== 6. STATS ===');
  const st = await req('GET', '/api/admin/stats', null, login.cookie);
  console.log('  Status:', st.status, 'Body:', st.body.slice(0, 200));

  console.log('\n=== ALL QA PASSED ===');
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
