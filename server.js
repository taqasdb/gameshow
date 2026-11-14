// Gameshow "Thắp sáng Mùa Vọng" (Mùa Vọng năm B) - không cần cài thư viện, chỉ cần Node 18+
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 3000;
const KEY = process.env.HOST_PASSWORD || 'giaoly';          // mật khẩu quản trò
const TIME = Number(process.env.TIME_MS) || 10000;            // 10 giây mỗi câu

// Đọc danh sách câu hỏi từ file questions.json
let Q = [];
try {
  const rawData = fs.readFileSync(path.join(__dirname, 'questions.json'), 'utf8');
  Q = JSON.parse(rawData);
} catch (err) {
  console.error("Lỗi khi đọc file questions.json:", err.message);
  process.exit(1);
}

// Xáo trộn thứ tự đáp án để vị trí đúng không bị đoán trước (trừ câu có đáp án kiểu "Cả ba…", "Chỉ a và c…")
for (const x of Q) {
  if (x.o.some(t => /^(Cả|Chỉ) /.test(t))) continue;
  const right = x.o[x.a];
  for (let i = x.o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x.o[i], x.o[j]] = [x.o[j], x.o[i]]; }
  x.a = x.o.indexOf(right);
}

let S, timer = null;
const clients = new Set();
const fresh = () => { S = { phase: 'lobby', q: 0, t0: 0, players: new Map() }; };
fresh();
const sorted = () => [...S.players.values()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

function view(c) {
  const ps = [...S.players.values()];
  const v = { phase: S.phase, q: S.q, t0: S.t0, now: Date.now(), time: TIME, total: Q.length,
              count: ps.length, answered: ps.filter(p => p.ans[S.q]).length };
  if (S.phase === 'lobby') v.names = ps.map(p => p.name);
  if (S.phase === 'question' || S.phase === 'reveal') v.question = { q: Q[S.q].q, o: Q[S.q].o, s: Q[S.q].s, ref: Q[S.q].ref };
  if (S.phase === 'reveal') v.correct = Q[S.q].a;
  if (S.phase === 'reveal' || S.phase === 'final') v.top = sorted().slice(0, 3).map(p => ({ name: p.name, s: p.score }));
  if (!c.host) {
    const p = S.players.get(c.id);
    if (p) v.me = { name: p.name, choice: p.ans[S.q] ? p.ans[S.q].c : null, gain: S.phase === 'reveal' ? p.last : 0,
                    score: p.score, rank: sorted().indexOf(p) + 1, streak: p.streak };
  }
  return v;
}
function broadcast() { for (const c of clients) c.res.write('data: ' + JSON.stringify(view(c)) + '\n\n'); }
function begin(i) {
  S.phase = 'question'; S.q = i; S.t0 = Date.now();
  clearTimeout(timer); timer = setTimeout(reveal, TIME + 300);
  broadcast();
}
function reveal() {
  if (S.phase !== 'question') return;
  clearTimeout(timer);
  for (const p of S.players.values()) {
    const a = p.ans[S.q];
    if (a && a.c === Q[S.q].a) { p.streak++; p.last = a.g + Math.min(p.streak - 1, 3) * 100; }  // thưởng chuỗi đúng liên tiếp
    else { p.streak = 0; p.last = 0; }
    p.score += p.last;
  }
  S.phase = 'reveal'; broadcast();
}
function body(req) {
  return new Promise(ok => {
    let d = ''; req.on('data', x => { d += x; if (d.length > 5000) req.destroy(); });
    req.on('end', () => { try { ok(JSON.parse(d || '{}')); } catch { ok({}); } });
  });
}
const send = (res, code, o) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (req.method === 'GET' && (u.pathname === '/' || u.pathname === '/host')) {
    return fs.readFile(path.join(__dirname, 'public', 'index.html'), (e, d) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }); res.end(d);
    });
  }
  if (req.method === 'GET' && u.pathname === '/events') {
    const key = u.searchParams.get('key'), id = (u.searchParams.get('id') || '').slice(0, 40), host = key === KEY;
    if (key && !host) return send(res, 401, { error: 'key' });
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform',
                          'Connection': 'keep-alive', 'X-Accel-Buffering': 'no' });
    const c = { res, id, host }; clients.add(c);
    res.write('retry: 2000\n\ndata: ' + JSON.stringify(view(c)) + '\n\n');
    const hb = setInterval(() => res.write(': ping\n\n'), 20000);
    req.on('close', () => { clearInterval(hb); clients.delete(c); });
    return;
  }
  if (req.method === 'POST' && u.pathname === '/api/join') {
    const b = await body(req), id = String(b.id || '').slice(0, 40), name = String(b.name || '').trim().slice(0, 20);
    if (!id || !name || S.players.size >= 3000) return send(res, 400, { error: 'bad' });
    const old = S.players.get(id);
    if (old) old.name = name; else S.players.set(id, { name, ans: {}, score: 0, last: 0, streak: 0 });
    broadcast(); return send(res, 200, { ok: 1 });
  }
  if (req.method === 'POST' && u.pathname === '/api/answer') {
    const b = await body(req), p = S.players.get(String(b.id || '')), c = b.c, t = Date.now() - S.t0;
    if (!p || S.phase !== 'question' || t > TIME || p.ans[S.q] || ![0, 1, 2, 3].includes(c)) return send(res, 400, { error: 'bad' });
    p.ans[S.q] = { c, g: c === Q[S.q].a ? Math.round(500 + 500 * (1 - t / TIME)) : 0 };
    if ([...S.players.values()].every(x => x.ans[S.q])) reveal(); else broadcast();
    return send(res, 200, { ok: 1 });
  }
  if (req.method === 'POST' && u.pathname === '/api/host') {
    const b = await body(req);
    if (b.key !== KEY) return send(res, 401, { error: 'key' });
    if (b.action === 'ping') { /* kiểm tra mật khẩu */ }
    else if (b.action === 'start' && S.phase === 'lobby' && S.players.size) begin(0);
    else if (b.action === 'next' && S.phase === 'reveal' && S.q < Q.length - 1) begin(S.q + 1);
    else if (b.action === 'final' && S.phase === 'reveal' && S.q === Q.length - 1) { S.phase = 'final'; broadcast(); }
    else if (b.action === 'restart') { clearTimeout(timer); S.phase = 'lobby'; S.q = 0; S.t0 = 0;
      for (const p of S.players.values()) { p.ans = {}; p.score = 0; p.last = 0; p.streak = 0; } broadcast(); }
    else if (b.action === 'reset') { clearTimeout(timer); fresh(); broadcast(); }
    return send(res, 200, { ok: 1 });
  }
  send(res, 404, { error: 'not found' });
}).listen(PORT, () => console.log('Gameshow chạy tại cổng ' + PORT + ' — quản trò vào /host (mật khẩu: ' + KEY + ')'));