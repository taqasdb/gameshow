// Gameshow "Thắp sáng Mùa Vọng" (Mùa Vọng năm B) - không cần cài thư viện, chỉ cần Node 18+
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 3000;
const KEY = process.env.HOST_PASSWORD || 'giaoly';          // mật khẩu quản trò
const TIME = Number(process.env.TIME_MS) || 10000;           // 10 giây mỗi câu
// [chặng(0-3 = Chúa nhật I-IV), trích dẫn, câu hỏi, 4 đáp án, vị trí đáp án đúng 0-3]
const Q = [
[0,"Mc 13,33","Đức Giêsu kêu gọi anh em phải coi chừng, phải làm gì vì anh em không biết khi nào thời ấy đến?",["Cầu nguyện","Tỉnh thức","Tránh xa tội lỗi","Tránh xa biệt phái"],1],
[0,"Mc 13,34","Ông chủ trẩy đi đâu, để lại nhà trao quyền cho các đầy tớ của mình?",["Dự tiệc cưới","Hành hương","Phương xa","Yết kiến hoàng đế để được phong vương"],2],
[0,"Mc 13,34","Khi người chủ trẩy đi phương xa, để lại nhà, trao quyền cho ai?",["Các môn đệ","Các đầy tớ","Các tá điền","Các tư tế"],1],
[0,"Mc 13,35","Chủ nhà có thể đến vào những lúc nào?",["Nửa đêm","Rạng sáng","Lúc chập tối","Cả ba lúc trên đều đúng"],3],
[0,"Mc 13,35","Anh em phải làm gì vì anh em không biết khi nào chủ nhà đến?",["Cầu nguyện","Canh thức","Lo lắng","Sẵn sàng"],1],
[0,"Mc 13,36","Anh em phải canh thức, kẻo lỡ ra ông chủ đến bất thần, thấy anh em đang làm gì?",["Làm việc","Chè chén say sưa","Ngủ","Tỉnh thức"],2],
[1,"Mc 1,2","“Này Ta sai sứ giả của Ta đi trước mặt Con, người sẽ dọn đường cho Con.” Đây là lời của ngôn sứ nào?",["Ngôn sứ Isaia","Ngôn sứ Giêrêmia","Ngôn sứ Êdêkien","Ngôn sứ Dacaria"],0],
[1,"Mc 1,4","Ai xuất hiện trong hoang địa, rao giảng kêu gọi người ta chịu phép rửa tỏ lòng sám hối để được tha tội?",["Đức Giêsu","Ông Môsê","Ông Phaolô","Ông Gioan Tẩy Giả"],3],
[1,"Mc 1,5","Ông Gioan làm phép rửa cho mọi người ở đâu?",["Bên biển hồ Galilê","Bên hồ Silôác","Trong sông Êuphơrát","Trong sông Giođan"],3],
[1,"Mc 1,6","Thức ăn của ông Gioan Tẩy Giả là gì?",["Mật ong rừng","Châu chấu","Thịt dê","Mật ong rừng và châu chấu"],3],
[1,"Mc 1,5","Những người thuộc miền nào đã đến với ông Gioan Tẩy Giả?",["Miền Galilê","Miền Samaria","Miền Thập Tỉnh","Miền Giuđê"],3],
[1,"Mc 1,5","Những người thuộc thành nào kéo đến thú tội và xin ông Gioan làm phép rửa?",["Thành Đamát","Thành Nadarét","Thành Giêrusalem","Thành Caphácnaum"],2],
[1,"Mc 1,7-8","Hoàn thành câu: “Tôi làm phép rửa cho anh em trong nước, còn Người, Người sẽ làm phép rửa cho anh em …”",["Trong Thần Khí và Sự Thật","Trong Thánh Thần","Trong Thiên Chúa","Trong nước và lửa"],1],
[2,"Ga 1,6-7","Người được Thiên Chúa sai đến để làm chứng về ánh sáng là ai?",["Đức Giêsu","Ông Môsê","Ông Ápraham","Ông Gioan"],3],
[2,"Ga 1,7","Ông Gioan được Thiên Chúa sai đến để làm gì?",["Làm chứng về ánh sáng","Rao giảng Nước Trời","Kêu gọi mọi người sám hối và tin vào Tin Mừng","Chỉ a và c đúng"],0],
[2,"Ga 1,19","Những người từ Giêrusalem được cử đến hỏi ông Gioan là ai?",["Các thượng tế","Các thầy Lêvi","Các tư tế","Các thầy Lêvi và các tư tế"],3],
[2,"Ga 1,20","Ông Gioan tuyên bố ông không phải là ai?",["Con Thiên Chúa","Đấng Kitô","Tôi tớ trung thành của Thiên Chúa","Thiên sứ của Thiên Chúa"],1],
[2,"Ga 1,28","Ông Gioan đã làm phép rửa tại đâu?",["Biển hồ Tibêria","Sông Giođan","Giếng Giacóp","Hồ Silôác"],1],
[2,"Ga 1,23","“Tôi là tiếng người hô trong hoang địa: hãy sửa đường cho thẳng để Đức Chúa đi.” Đây là lời của ngôn sứ nào?",["Ngôn sứ Êdêkien","Ngôn sứ Malakhi","Ngôn sứ Isaia","Ngôn sứ Dacaria"],2],
[2,"Ga 1,26-27","Hoàn thành câu: “Có một vị đang ở giữa các ông mà các ông không biết. Người sẽ đến sau tôi và …”",["Tôi chỉ là người tiền hô cho Người","Tôi không đáng cởi quai dép cho Người","Tôi đi trước Người","Tôi chỉ chuẩn bị đường cho Người"],1],
[3,"Lc 1,26","Bà Êlisabét có thai được mấy tháng thì Thiên Chúa sai sứ thần Gáprien truyền tin cho cô Maria?",["Ba tháng","Sáu tháng","Chín tháng","Mười hai tháng"],1],
[3,"Lc 1,26","Sứ thần truyền tin cho Đức Maria tên là gì?",["Sứ thần Gáprien","Sứ thần Micaen","Sứ thần Raphaen","Sứ thần Kêrubim"],0],
[3,"Lc 1,27","Người thiếu nữ được truyền tin tên là gì?",["Cô Gioanna","Cô Maria","Cô Êlisabét","Cô Anna"],1],
[3,"Lc 1,27","Trinh nữ Maria cư ngụ nơi thành nào?",["Thành Giêrusalem","Thành Nadarét","Thành Caphácnaum","Thành Samaria"],1],
[3,"Lc 1,27","Hôn phu của Đức Maria thuộc dòng dõi vua nào?",["Vua Salem","Vua Đavít","Vua Hêrôđê","Vua Pharaô"],1],
[3,"Lc 1,28","Hoàn thành câu: “Mừng vui lên, hỡi Đấng đầy …, Đức Chúa ở cùng bà.”",["Tốt lành","Công chính","Ân sủng","Niềm vui"],2],
[3,"Lc 1,31","Trinh nữ Maria sẽ sinh hạ một con trai, và đứa trẻ được đặt tên là gì?",["Gioan","Giêsu","Samson","Giôsuê"],1],
[3,"Lc 1,32","Con trai của trinh nữ Maria sẽ nên cao cả và được gọi là gì?",["Đấng Mêsia","Con Đấng Tối Cao","Ngôi Hai Thiên Chúa","Hoàng Tử Hòa Bình"],1],
[3,"Lc 1,36","Người chị họ của cô Maria tên là gì?",["Êliseva","Bátseva","Êlisabét","Anna"],2],
[3,"Lc 1,38","“Vâng, tôi đây là nữ tỳ của Chúa, xin Chúa cứ làm cho tôi như lời sứ thần nói.” Đây là lời của ai?",["Cô Mácta","Cô Maria","Cô Êlisabét","Cô Anna"],1]
].map(x => ({ s: x[0], ref: x[1], q: x[2], o: x[3], a: x[4] }));

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
