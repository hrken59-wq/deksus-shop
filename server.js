require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const path = require('path');

const app = express();
const db = new sqlite3.Database('./shop.db');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.use(session({
  secret: process.env.SESSION_SECRET || 'deksus_perfect_match_2026',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

// โครงสร้างฐานข้อมูล
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    count_badge TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    name TEXT NOT NULL,
    price_min REAL NOT NULL,
    price_max REAL NOT NULL,
    sold_badge TEXT,
    stock_badge TEXT,
    image_url TEXT,
    is_out_of_stock INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS account_stocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    account_data TEXT NOT NULL,
    is_sold INTEGER DEFAULT 0,
    sold_at DATETIME
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    password TEXT,
    provider TEXT DEFAULT 'local',
    provider_id TEXT,
    role TEXT DEFAULT 'member',
    balance REAL DEFAULT 80.0,
    total_spent REAL DEFAULT 80.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    product_name TEXT,
    amount REAL NOT NULL,
    account_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS discount_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    discount_amount REAL NOT NULL,
    uses_left INTEGER DEFAULT 10
  )`);

  // ลงข้อมูลเริ่มต้น
  db.get(`SELECT COUNT(*) as count FROM categories`, (err, row) => {
    if (row.count === 0) {
      db.run(`INSERT INTO categories (name, count_badge) VALUES 
        ('ทั้งหมด', '40'),
        ('โปรแกรมช่วยเล่นบนคอม', '2'),
        ('AD & IOS', '7'),
        ('IOS', '6'),
        ('โปรแกรมช่วยเล่น AD', '8'),
        ('ID CODE', '7'),
        ('App Premium', '0'),
        ('PYBO', '0'),
        ('The Idle', '0'),
        ('VALORANT', '0')
      `);

      const pStmt = db.prepare(`INSERT INTO products (category_id, name, price_min, price_max, sold_badge, stock_badge, image_url, is_out_of_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
      pStmt.run(2, "BR MODS PC", 25.00, 299.00, "ขายแล้ว 215", "พร้อมขาย - คลัง 93", "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600", 0);
      pStmt.run(2, "DUSTU AIMKILL PC", 60.00, 400.00, "ขายแล้ว 4", "พร้อมขาย - คลัง ไม่จำกัด", "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600", 0);
      pStmt.run(3, "PANDA CHEAT IOS & AD", 30.00, 400.00, "ขายแล้ว 93", "พร้อมขาย - คลัง 469", "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600", 0);
      pStmt.run(3, "PHANTOM AD & IOS V1", 10.00, 450.00, "ขายแล้ว 10,745", "พร้อมขาย - คลัง 1,378", "https://images.unsplash.com/photo-1563089145-599997674d42?w=600", 0);
      pStmt.run(3, "XREG AD & IOS", 20.00, 200.00, "ขายแล้ว 192", "พร้อมขาย - คลัง ไม่จำกัด", "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600", 0);
      pStmt.run(3, "DRIP WIRE AD & IOS", 30.00, 200.00, "ขายแล้ว 108", "พร้อมขาย - คลัง ไม่จำกัด", "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600", 0);
      pStmt.run(4, "RLZXTEAM", 10.00, 300.00, "ขายแล้ว 381", "พร้อมขาย - คลัง 215", "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=600", 0);
      pStmt.run(4, "PROXY เบ็ตติศ", 10.00, 200.00, "ขายแล้ว 221", "พร้อมขาย - คลัง 279", "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600", 0);
      pStmt.run(5, "DripModel", 35.00, 350.00, "ขายแล้ว 84", "พร้อมขาย - คลัง ไม่จำกัด", "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600", 0);
      pStmt.run(5, "MEOWT", 20.00, 30.00, "ขายแล้ว 0", "สินค้าหมด", "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600", 1);
      pStmt.run(6, "[ โค้ด ] ไอดีชุดซาสึเกะเวล20+", 80.00, 100.00, "ขายแล้ว 209", "พร้อมขาย - คลัง 361", "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600", 0);
      pStmt.finalize();

      const sStmt = db.prepare(`INSERT INTO account_stocks (product_id, account_data) VALUES (?, ?)`);
      for (let i = 1; i <= 11; i++) {
        sStmt.run(i, `DEKSUS-VIP-KEY-00${i}-READY`);
      }
      sStmt.finalize();

      db.run(`INSERT INTO users (username, email, password, role, balance, total_spent) VALUES ('admin', 'admin@deksus.com', 'admin123', 'admin', 99999.0, 0.0)`);
      db.run(`INSERT INTO users (username, email, password, role, balance, total_spent) VALUES ('hrken59@gmail.com', 'hrken59@gmail.com', '1234', 'member', 80.0, 80.0)`);
      db.run(`INSERT INTO discount_codes (code, discount_amount, uses_left) VALUES ('FREE50', 50.0, 100)`);
    }
  });
});

// OAuth
function handleGoogleUser(profile, done) {
  const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
  const providerId = profile.id;
  const username = email || profile.displayName || `google_user_${providerId.slice(-4)}`;

  db.get(`SELECT * FROM users WHERE provider = 'google' AND provider_id = ?`, [providerId], (err, user) => {
    if (err) return done(err);
    if (user) return done(null, user);

    db.run(
      `INSERT INTO users (username, email, provider, provider_id, role, balance, total_spent) VALUES (?, ?, 'google', ?, 'member', 80.0, 0.0)`,
      [username, email, providerId],
      function (err2) {
        if (err2) {
          const fallback = `${username}_${Math.floor(100 + Math.random() * 900)}`;
          db.run(`INSERT INTO users (username, email, provider, provider_id, role, balance, total_spent) VALUES (?, ?, 'google', ?, 'member', 80.0, 0.0)`,
            [fallback, email, providerId],
            function (err3) {
              db.get(`SELECT * FROM users WHERE id = ?`, [this.lastID], (e, u) => done(e, u));
            }
          );
        } else {
          db.get(`SELECT * FROM users WHERE id = ?`, [this.lastID], (e, u) => done(e, u));
        }
      }
    );
  });
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  db.get(`SELECT id, username, email, role, balance, total_spent, provider, created_at FROM users WHERE id = ?`, [id], (err, user) => done(err, user));
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  }, (accessToken, refreshToken, profile, done) => handleGoogleUser(profile, done)));
}

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/?error=failed' }), (req, res) => res.redirect('/'));

// APIs
app.get('/api/auth/me', (req, res) => {
  if (req.isAuthenticated()) return res.json({ loggedIn: true, user: req.user });
  res.json({ loggedIn: false });
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  db.run(`INSERT INTO users (username, email, password, role, balance, total_spent) VALUES (?, ?, ?, 'member', 80.0, 0.0)`,
    [username, email || '', password],
    function (err) {
      if (err) return res.status(400).json({ error: 'ชื่อผู้ใช้นี้มีคนใช้แล้ว' });
      db.get(`SELECT id, username, email, role, balance, total_spent FROM users WHERE id = ?`, [this.lastID], (e, user) => {
        req.login(user, () => res.json({ success: true, user }));
      });
    }
  );
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT id, username, email, role, balance, total_spent FROM users WHERE username = ? AND password = ?`, [username, password], (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    req.login(user, () => res.json({ success: true, user }));
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.logout(() => res.json({ success: true }));
});

app.get('/api/data', (req, res) => {
  db.all(`SELECT * FROM categories`, [], (err, categories) => {
    db.all(`SELECT p.*, COUNT(s.id) as in_stock FROM products p LEFT JOIN account_stocks s ON p.id = s.product_id AND s.is_sold = 0 GROUP BY p.id`, [], (err2, products) => {
      res.json({ categories, products });
    });
  });
});

app.post('/api/check-coupon', (req, res) => {
  const { code } = req.body;
  db.get(`SELECT * FROM discount_codes WHERE code = ? AND uses_left > 0`, [code], (err, row) => {
    if (err || !row) return res.status(400).json({ error: 'โค้ดส่วนลดไม่ถูกต้องหรือหมดสิทธิ์แล้ว' });
    res.json({ success: true, discount: row.discount_amount, code: row.code });
  });
});

app.post('/api/buy', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนทำการสั่งซื้อ' });
  const { productId, price, quantity = 1, couponCode } = req.body;
  const user = req.user;
  let cost = (price || 35.0) * quantity;

  const handleFinish = (discount = 0) => {
    const finalAmount = Math.max(0, cost - discount);
    if (user.balance < finalAmount) return res.status(400).json({ error: `ยอดเงินไม่พอ (ขาด ฿${(finalAmount - user.balance).toFixed(2)})` });

    db.get(`SELECT id, account_data FROM account_stocks WHERE product_id = ? AND is_sold = 0 LIMIT 1`, [productId], (err, stock) => {
      if (!stock) return res.status(400).json({ error: 'สินค้าหมดชั่วคราว!' });

      const newBalance = user.balance - finalAmount;
      const newSpent = (user.total_spent || 0) + finalAmount;

      db.run(`UPDATE users SET balance = ?, total_spent = ? WHERE id = ?`, [newBalance, newSpent, user.id]);
      db.run(`UPDATE account_stocks SET is_sold = 1, sold_at = datetime('now') WHERE id = ?`, [stock.id]);

      db.get(`SELECT name FROM products WHERE id = ?`, [productId], (e, p) => {
        db.run(`INSERT INTO orders (user_id, product_name, amount, account_data) VALUES (?, ?, ?, ?)`,
          [user.id, p ? p.name : 'Unknown', finalAmount, stock.account_data]
        );
      });

      if (couponCode) db.run(`UPDATE discount_codes SET uses_left = uses_left - 1 WHERE code = ?`, [couponCode]);

      req.user.balance = newBalance;
      req.user.total_spent = newSpent;
      res.json({ success: true, account: stock.account_data, newBalance });
    });
  };

  if (couponCode) {
    db.get(`SELECT discount_amount FROM discount_codes WHERE code = ? AND uses_left > 0`, [couponCode], (err, row) => {
      handleFinish(row ? row.discount_amount : 0);
    });
  } else {
    handleFinish(0);
  }
});

// Admin APIs
function requireAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') return next();
  res.status(403).json({ error: 'สำหรับแอดมินเท่านั้น' });
}

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  db.get(`SELECT IFNULL(SUM(amount), 0) as totalRevenue, COUNT(id) as totalOrders FROM orders WHERE strftime('%Y-%m', created_at) = ?`, [currentMonth], (err, s) => {
    db.get(`SELECT COUNT(id) as totalUsers FROM users`, [], (err2, u) => {
      res.json({
        month: currentMonth,
        totalRevenue: s ? s.totalRevenue : 0,
        totalOrders: s ? s.totalOrders : 0,
        totalUsers: u ? u.totalUsers : 0
      });
    });
  });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  db.all(`SELECT id, username, email, role, balance, total_spent FROM users ORDER BY id DESC`, [], (err, rows) => res.json(rows || []));
});

app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  db.run(`DELETE FROM users WHERE id = ?`, [req.params.id], () => res.json({ success: true }));
});

app.post('/api/admin/users/add-balance', requireAdmin, (req, res) => {
  const { userId, amount } = req.body;
  db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [parseFloat(amount), userId], () => res.json({ success: true }));
});

app.get('/api/admin/coupons', requireAdmin, (req, res) => {
  db.all(`SELECT * FROM discount_codes ORDER BY id DESC`, [], (err, rows) => res.json(rows || []));
});

app.post('/api/admin/coupons', requireAdmin, (req, res) => {
  const { code, discountAmount, usesLeft } = req.body;
  db.run(`INSERT INTO discount_codes (code, discount_amount, uses_left) VALUES (?, ?, ?)`, [code.toUpperCase(), discountAmount, usesLeft], () => res.json({ success: true }));
});

app.delete('/api/admin/coupons/:id', requireAdmin, (req, res) => {
  db.run(`DELETE FROM discount_codes WHERE id = ?`, [req.params.id], () => res.json({ success: true }));
});

app.post('/api/admin/add-stock', requireAdmin, (req, res) => {
  const { productId, accountsText } = req.body;
  const lines = accountsText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const stmt = db.prepare(`INSERT INTO account_stocks (product_id, account_data) VALUES (?, ?)`);
  lines.forEach(acc => stmt.run(productId, acc));
  stmt.finalize(() => res.json({ success: true, count: lines.length }));
});

// Single Page UI
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="th" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DEKSUS OFFICIAL - เว็บสุ่มรหัสเกมและโปรแกรมช่วยเล่น</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
    body { font-family: 'Kanit', sans-serif; background-color: #060608; }
    .neon-red { box-shadow: 0 0 35px rgba(220, 20, 20, 0.35); }
    .card-neon:hover { border-color: rgba(239, 45, 45, 0.8); box-shadow: 0 0 20px rgba(220, 20, 20, 0.35); transform: translateY(-4px); }
    .marquee { display: flex; overflow-x: auto; scrollbar-width: none; }
    .marquee::-webkit-scrollbar { display: none; }
    .modal-anim { animation: popIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.94) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
  </style>
</head>
<body class="text-gray-200 antialiased selection:bg-red-600 selection:text-white" onclick="closeDropdownOnClickOutside(event)">

  <!-- Navbar แคปซูลลอยด้านบน -->
  <header class="sticky top-3 z-50 px-4">
    <div class="max-w-6xl mx-auto bg-[#101114]/95 backdrop-blur-md border border-red-950/60 rounded-full px-5 py-2.5 flex items-center justify-between shadow-2xl">
      <div class="flex items-center gap-3 cursor-pointer" onclick="switchView('home')">
        <img src="/logo.png" onerror="this.src='https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100'" alt="DEKSUS" class="h-8 object-contain">
        <span class="font-black text-white tracking-wider text-sm hidden lg:inline">DEKSUS OFFICIAL</span>
      </div>

      <nav class="hidden md:flex items-center gap-1.5 text-xs font-medium">
        <button onclick="switchView('home')" id="navBtn-home" class="nav-btn bg-red-600 text-white px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-md shadow-red-600/30">
          <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg> หน้าหลัก
        </button>
        <button onclick="switchView('shop')" id="navBtn-shop" class="nav-btn text-gray-300 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5 flex items-center gap-1">🔒 ร้านค้า</button>
        <button onclick="switchView('minigame')" id="navBtn-minigame" class="nav-btn text-gray-300 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5 flex items-center gap-1">🎮 มินิเกม</button>
        <button onclick="switchView('topup')" id="navBtn-topup" class="nav-btn text-gray-300 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5 flex items-center gap-1">💰 เติมเงิน</button>
        <button onclick="switchView('history')" id="navBtn-history" class="nav-btn text-gray-300 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5 flex items-center gap-1">🕒 ประวัติ</button>
        <button onclick="toggleModal('contactModal')" class="text-gray-300 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5 flex items-center gap-1">💬 ติดต่อเรา</button>
        <button id="adminNavBtn" onclick="openAdminDashboard()" class="hidden text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-full hover:bg-amber-500/10 font-bold">⚙️ หลังบ้าน</button>
      </nav>

      <!-- ส่วนล็อกอิน & เมนูโปรไฟล์ Dropdown ขวาบน -->
      <div class="relative flex items-center gap-2" id="authNav"></div>
    </div>
  </header>

  <!-- ==================== 1. VIEW: หน้าหลัก (HOME) ==================== -->
  <div id="view-home" class="page-view">
    <section class="max-w-6xl mx-auto px-4 pt-8 pb-4">
      <div class="flex flex-col md:flex-row items-center justify-between gap-6">
        <div class="space-y-3">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-red-950/40 border border-red-800/60 text-red-500 text-xs rounded-full font-bold">
            ⚡ DEKSUS OFFICIAL
          </span>
          <h1 class="text-3xl md:text-5xl font-black text-white tracking-wide">
            ยินดีต้อนรับสู่ร้าน <span class="text-red-600 drop-shadow-[0_0_20px_rgba(220,20,20,0.6)]">DEKSUS OFFICIAL</span>
          </h1>
          <p class="text-gray-400 text-xs leading-relaxed max-w-xl">
            โปรแกรมมีปัญหาติดต่อสอบถามได้ที่ Discord เท่านั้น !!<br>
            บริการรวดเร็ว ปลอดภัย 100% สามารถสั่งซื้อสินค้าผ่านระบบออโต้ได้ตลอด 24 ชั่วโมง !!
          </p>
          <div class="flex gap-3 pt-2">
            <button onclick="switchView('shop')" class="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-1.5">
              👤 เริ่มต้นใช้งาน
            </button>
            <button class="bg-[#15161a] hover:bg-[#1d1f24] border border-gray-800 text-gray-300 text-xs font-semibold px-5 py-2.5 rounded-xl">
              วิธีการสั่งซื้อ →
            </button>
          </div>
        </div>

        <div class="w-full md:w-80 flex items-center justify-center p-2">
          <img src="/logo.png" onerror="this.src='https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500'" alt="DEKSUS LOGO" class="w-full max-w-xs object-contain drop-shadow-[0_0_25px_rgba(239,35,35,0.8)]">
        </div>
      </div>

      <!-- แบนเนอร์แดง ประกาศใหญ่กลางเว็บ -->
      <div class="mt-8 rounded-3xl p-6 md:p-10 bg-gradient-to-r from-[#380606] via-[#1a0505] to-[#0a0202] border border-red-700/60 text-center relative overflow-hidden neon-red flex flex-col items-center">
        <span class="text-white text-xs font-bold inline-flex items-center gap-1.5 bg-red-600/40 px-3 py-1 rounded-full border border-red-500/50 mb-3">
          ⚠️ หากพบปัญหาโปรดติดต่อแอดมิน
        </span>
        <img src="/logo.png" onerror="this.src='https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500'" alt="DEKSUS STORE" class="h-16 md:h-24 object-contain drop-shadow-[0_0_20px_rgba(239,35,35,0.7)] my-1">
        <p class="text-gray-200 text-sm md:text-base font-bold mt-2">บริการสุ่มรหัสเกมและโปรแกรมช่วยเล่น</p>
        <div class="pt-2">
          <span class="inline-block bg-black/60 border border-red-600/40 px-5 py-1.5 rounded-full text-xs font-mono text-red-400">
            https://deksus.com/
          </span>
        </div>
      </div>
    </section>

    <!-- จุดเด่นร้านค้า -->
    <section class="max-w-6xl mx-auto px-4 py-6">
      <h3 class="text-base font-black text-white mb-3">
        ทำไมต้องเลือก <span class="text-red-500">DEKSUS OFFICIAL</span>
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-[#0f1013] border border-gray-800/80 rounded-2xl p-4 flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center text-lg font-bold">🛡️</div>
          <div>
            <h4 class="text-white font-bold text-xs">ปลอดภัย รวดเร็ว</h4>
            <p class="text-gray-400 text-[11px] mt-0.5">ระบบความปลอดภัยขั้นสูง บริการรวดเร็ว จัดส่งออโต้ตลอด 24 ชั่วโมง</p>
          </div>
        </div>
        <div class="bg-[#0f1013] border border-gray-800/80 rounded-2xl p-4 flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center text-lg font-bold">🎧</div>
          <div>
            <h4 class="text-white font-bold text-xs">บริการลูกค้า</h4>
            <p class="text-gray-400 text-[11px] mt-0.5">ทีมงานดูแลและพร้อมให้คำปรึกษาตลอด 24 ชั่วโมง</p>
          </div>
        </div>
      </div>
    </section>

    <!-- แถบสินค้าที่ซื้อล่าสุด -->
    <section class="max-w-6xl mx-auto px-4 py-2">
      <div class="flex items-center gap-2 mb-2 text-xs font-bold text-white">
        <span class="p-1 bg-red-600/20 text-red-500 rounded">📦</span> สินค้าที่ซื้อล่าสุด
      </div>
      <div class="marquee flex gap-3 overflow-x-auto pb-2">
        <div class="flex-shrink-0 bg-[#0f1013] border border-gray-800/80 rounded-xl p-2.5 flex items-center gap-2 text-xs w-48">
          <div class="w-7 h-7 rounded bg-red-950 border border-red-600/40 flex items-center justify-center text-[10px] text-red-500 font-bold">PRO</div>
          <div class="overflow-hidden">
            <p class="text-white text-[11px] font-bold truncate">PHANTOM AD & IOS</p>
            <p class="text-gray-500 text-[10px]">👤 Mue*** 1 นาทีที่แล้ว</p>
          </div>
        </div>
        <div class="flex-shrink-0 bg-[#0f1013] border border-gray-800/80 rounded-xl p-2.5 flex items-center gap-2 text-xs w-48">
          <div class="w-7 h-7 rounded bg-red-950 border border-red-600/40 flex items-center justify-center text-[10px] text-red-500 font-bold">BR</div>
          <div class="overflow-hidden">
            <p class="text-white text-[11px] font-bold truncate">BR MODS PC</p>
            <p class="text-gray-500 text-[10px]">👤 pok*** 2 นาทีที่แล้ว</p>
          </div>
        </div>
      </div>
    </section>

    <!-- หมวดหมู่แนะนำ (4 บล็อกแบนเนอร์ใหญ่) -->
    <section class="max-w-6xl mx-auto px-4 py-6">
      <div class="flex items-center gap-2 mb-4">
        <span class="w-2.5 h-6 bg-red-600 rounded-full"></span>
        <div>
          <h3 class="text-lg font-black text-white">หมวดหมู่แนะนำ</h3>
          <p class="text-[11px] text-gray-500">Recommended Categories</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div onclick="filterCategory(2)" class="bg-gradient-to-r from-red-950/70 to-[#0f1013] border border-red-900/40 rounded-3xl p-6 relative overflow-hidden group hover:border-red-600/70 cursor-pointer">
          <div class="relative z-10 flex flex-col justify-between h-32">
            <div>
              <span class="text-[10px] text-red-400 font-bold uppercase flex items-center gap-1">⚡ โปรแกรมช่วยเล่นบน PC</span>
              <h4 class="text-3xl font-black text-white mt-1 group-hover:text-red-400">PANELPC</h4>
              <p class="text-gray-400 text-xs mt-1">โปรแกรมช่วยเล่นบนคอม รวมสินค้าในหมวด พร้อมส่งอัตโนมัติ</p>
            </div>
            <div class="flex justify-end">
              <span class="text-xs bg-white text-black font-extrabold px-4 py-1.5 rounded-full shadow-lg">● Click Here!</span>
            </div>
          </div>
        </div>

        <div onclick="filterCategory(3)" class="bg-gradient-to-r from-red-950/70 to-[#0f1013] border border-red-900/40 rounded-3xl p-6 relative overflow-hidden group hover:border-red-600/70 cursor-pointer">
          <div class="relative z-10 flex flex-col justify-between h-32">
            <div>
              <span class="text-[10px] text-red-400 font-bold uppercase flex items-center gap-1">⚡ โปรแกรมช่วยเล่นบนมือถือ</span>
              <h4 class="text-3xl font-black text-white mt-1 group-hover:text-red-400">AD & IOS</h4>
              <p class="text-gray-400 text-xs mt-1">AD & IOS รวมสินค้าในหมวด พร้อมส่งอัตโนมัติ</p>
            </div>
            <div class="flex justify-end">
              <span class="text-xs bg-red-600 text-white font-extrabold px-4 py-1.5 rounded-full shadow-lg shadow-red-600/40">● Click Here!</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- รายการสินค้าหน้าหลัก -->
    <main id="catalog" class="max-w-6xl mx-auto px-4 pb-20 space-y-12"></main>
  </div>

  <!-- ==================== 2. VIEW: หน้าร้านค้า (SHOP ตามคลิป 00:12) ==================== -->
  <div id="view-shop" class="page-view hidden max-w-6xl mx-auto px-4 py-8">
    <div class="text-center mb-6">
      <h2 class="text-2xl font-black text-white">สินค้าทั้งหมด</h2>
      <p class="text-xs text-gray-400 mt-1">เลือกดูสินค้าและบริการของเราทั้งหมด 40 รายการ</p>
    </div>

    <!-- แถบฟิลเตอร์หมวดหมู่ด้านบนเหมือนในวิดีโอ 00:12 -->
    <div class="flex flex-wrap items-center justify-center gap-2 mb-8" id="shopCategoryFilterTabs"></div>

    <div class="flex items-center justify-between gap-4 mb-6">
      <div class="relative flex-1 max-w-md">
        <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 text-xs">🔍</span>
        <input type="text" id="shopSearchInput" oninput="renderShopCatalog()" placeholder="ค้นหาสินค้า..." class="w-full bg-[#121316] border border-gray-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-red-600">
      </div>
      <button class="bg-[#121316] border border-gray-800 text-gray-300 text-xs px-4 py-2 rounded-xl flex items-center gap-1.5">
        เรียงตามค่าเริ่มต้น ▾
      </button>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-16" id="shopCatalogGrid"></div>
  </div>

  <!-- ==================== 3. VIEW: มินิเกม (MINIGAME ตามคลิป 00:20) ==================== -->
  <div id="view-minigame" class="page-view hidden max-w-4xl mx-auto px-4 py-12 text-center">
    <h2 class="text-3xl font-black text-white mb-1">มินิเกม</h2>
    <p class="text-xs text-gray-400 mb-8">หมุนวงล้อสุ่มเพื่อรับของรางวัลจากร้าน</p>

    <div class="bg-[#0f1013] border border-red-950/60 rounded-3xl p-8 max-w-md mx-auto neon-red">
      <div class="w-60 h-60 mx-auto rounded-full border-4 border-red-600/80 bg-gradient-to-tr from-black via-red-950 to-black flex items-center justify-center relative shadow-[0_0_40px_rgba(239,35,35,0.4)] mb-6">
        <span class="text-4xl">🎰</span>
      </div>
      <h4 class="text-base font-black text-white">สุ่มไอดี 10 บาท</h4>
      <p class="text-xs text-gray-500 mt-1">สุ่มรหัส VIP หรือรางวัลใหญ่</p>
      <button onclick="alert('ยอดเงินคงเหลือของคุณสามารถกดหมุนได้!')" class="mt-4 w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-red-600/40">
        เริ่มหมุนสุ่ม (฿10.00)
      </button>
    </div>
  </div>

  <!-- ==================== 4. VIEW: เติมเงิน (TOPUP ตามคลิป 00:26) ==================== -->
  <div id="view-topup" class="page-view hidden max-w-4xl mx-auto px-4 py-8">
    <div class="text-center mb-6">
      <span class="text-4xl font-black text-red-500 block" id="topupUserBalanceDisplay">฿0.00</span>
      <p class="text-xs text-gray-400 mt-1">เลือกช่องทางการเติมเงินและทำรายการได้ตลอด 24 ชม.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
      <!-- ตัวเลือกแท็บซ้ายมือ -->
      <div class="md:col-span-4 space-y-2">
        <button onclick="switchTopupMethod('wallet')" id="btnTopup-wallet" class="topup-method-btn w-full p-3.5 rounded-2xl bg-red-600 text-white flex items-center gap-3 text-left">
          <span class="text-lg">🟠</span>
          <div>
            <h5 class="text-xs font-bold">TrueMoney Wallet</h5>
            <p class="text-[10px] text-gray-200">ซองของขวัญ</p>
          </div>
        </button>

        <button onclick="switchTopupMethod('bank')" id="btnTopup-bank" class="topup-method-btn w-full p-3.5 rounded-2xl bg-[#0f1013] border border-gray-800 text-gray-300 flex items-center gap-3 text-left">
          <span class="text-lg">🏦</span>
          <div>
            <h5 class="text-xs font-bold">โอนผ่านธนาคาร</h5>
            <p class="text-[10px] text-gray-500">แนบสลิป</p>
          </div>
        </button>

        <button onclick="switchTopupMethod('give')" id="btnTopup-give" class="topup-method-btn w-full p-3.5 rounded-2xl bg-[#0f1013] border border-gray-800 text-gray-300 flex items-center gap-3 text-left">
          <span class="text-lg">🪙</span>
          <div>
            <h5 class="text-xs font-bold">g!ve</h5>
            <p class="text-[10px] text-gray-500">กรอกโค้ดกิ๊ฟ</p>
          </div>
        </button>
      </div>

      <!-- รายละเอียดเนื้อหาขวามือ -->
      <div class="md:col-span-8 bg-[#0f1013] border border-gray-800 rounded-3xl p-6">
        <!-- 1. TrueMoney -->
        <div id="topupContent-wallet" class="space-y-4">
          <h4 class="text-sm font-bold text-white flex items-center justify-between">
            <span>TrueMoney Wallet</span>
            <span class="text-[11px] text-red-400">ค่าธรรมเนียม 2.3%</span>
          </h4>
          <input type="text" placeholder="วางลิงก์ซองของขวัญที่นี่" class="w-full bg-[#15161a] border border-gray-800 rounded-xl px-3.5 py-3 text-xs text-white focus:outline-none focus:border-red-600">
          <button onclick="alert('ระบบกำลังตรวจสอบซองของขวัญ...')" class="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-red-600/30">
            ยืนยันการเติมเงิน
          </button>
        </div>

        <!-- 2. Bank โอนผ่านธนาคาร (เหมือนในวิดีโอ 00:27) -->
        <div id="topupContent-bank" class="hidden space-y-4">
          <h4 class="text-sm font-bold text-white">โอนผ่านธนาคาร</h4>
          <p class="text-xs text-gray-400">โอนเงินเข้าบัญชีและอัปโหลดสลิปเพื่อยืนยัน</p>

          <div class="bg-[#15161a] border border-gray-800 rounded-2xl p-4 space-y-2 text-xs">
            <div class="flex justify-between"><span class="text-gray-400">ชื่อบัญชี:</span> <span class="font-bold text-white">นาย ณพช สถิตย์รัก</span></div>
            <div class="flex justify-between"><span class="text-gray-400">เลขที่บัญชี:</span> <span class="font-bold text-red-500 font-mono tracking-wider">1651334719</span></div>
            <div class="flex justify-between"><span class="text-gray-400">ธนาคาร:</span> <span class="font-bold text-emerald-400">กสิกรไทย</span></div>
          </div>

          <div class="border-2 border-dashed border-gray-800 rounded-2xl p-6 text-center cursor-pointer hover:border-red-600/60">
            <span class="text-2xl block mb-1">☁️</span>
            <span class="text-xs text-gray-400">คลิกเพื่ออัปโหลดไฟล์สลิป (JPG, PNG)</span>
          </div>
          <button onclick="alert('ส่งสลิปเรียบร้อย ระบบจะอนุมัติภายใน 1-3 นาที')" class="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-red-600/30">
            ยืนยันการโอนเงิน
          </button>
        </div>

        <!-- 3. g!ve กรอกโค้ดกิ๊ฟ (เหมือนในวิดีโอ 00:28) -->
        <div id="topupContent-give" class="hidden space-y-4">
          <h4 class="text-sm font-bold text-white">กรอกโค้ดกิ๊ฟ</h4>
          <input type="text" placeholder="FREE50" class="w-full bg-[#15161a] border border-gray-800 rounded-xl px-3.5 py-3 text-xs text-white uppercase focus:outline-none focus:border-red-600">
          <button onclick="alert('ใช้โค้ดกิ๊ฟสำเร็จ ยอดเงินเพิ่มเรียบร้อย!')" class="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-red-600/30">
            ใช้โค้ด
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== 5. VIEW: ประวัติการสั่งซื้อ (HISTORY ตามคลิป 00:39) ==================== -->
  <div id="view-history" class="page-view hidden max-w-4xl mx-auto px-4 py-8">
    <div class="flex items-center gap-2 mb-2">
      <span class="p-1.5 bg-red-600/20 text-red-500 rounded-xl text-sm font-bold">🛒</span>
      <div>
        <h3 class="text-base font-black text-white">ประวัติการสั่งซื้อ</h3>
        <p class="text-[11px] text-gray-500">ตรวจสอบและย้อนดูรายการไอดี/คีย์ที่คุณเคยซื้อทั้งหมด</p>
      </div>
    </div>

    <div class="mb-4">
      <input type="text" placeholder="ค้นหาชื่อสินค้าหรือรหัสสินค้า..." class="w-full bg-[#0f1013] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-600">
    </div>

    <div class="bg-[#0f1013] border border-gray-800 rounded-2xl p-8 text-center text-xs text-gray-500">
      ยังไม่มีประวัติการสั่งซื้อ
    </div>
  </div>

  <!-- ==================== 6. VIEW: บัญชีของฉัน (PROFILE ตามคลิป 01:11) ==================== -->
  <div id="view-profile" class="page-view hidden max-w-4xl mx-auto px-4 py-8 space-y-6">
    <!-- การ์ดส่วนหัว -->
    <div class="bg-[#0f1013] border border-gray-800 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-red-600/20 border border-red-600 flex items-center justify-center text-red-500 font-black text-2xl shadow-lg shadow-red-600/30">
          H
        </div>
        <div>
          <h3 class="text-lg font-black text-white" id="profUsernameHeader">user@gmail.com</h3>
          <p class="text-xs text-gray-500" id="profEmailHeader">user@gmail.com</p>
        </div>
      </div>

      <div class="flex gap-4">
        <div class="bg-[#15161a] border border-gray-800 rounded-2xl px-5 py-3 text-center">
          <span class="text-[10px] text-gray-400 block">ยอดเงินคงเหลือ</span>
          <span class="text-xl font-black text-emerald-400" id="profBalanceDisplay">฿80.00</span>
        </div>
        <div class="bg-[#15161a] border border-gray-800 rounded-2xl px-5 py-3 text-center">
          <span class="text-[10px] text-gray-400 block">ยอดใช้จ่ายทั้งหมด</span>
          <span class="text-xl font-black text-red-500" id="profSpentDisplay">฿80.00</span>
        </div>
      </div>
    </div>

    <!-- ข้อมูลบัญชี & เปลี่ยนรหัสผ่าน -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-[#0f1013] border border-gray-800 rounded-3xl p-6 space-y-3">
        <h4 class="text-xs font-bold text-white flex items-center gap-1.5"><span class="text-red-500">👤</span> ข้อมูลบัญชี</h4>
        <div><label class="text-[10px] text-gray-500">ชื่อผู้ใช้</label><input type="text" id="profUsernameField" readonly class="w-full bg-[#15161a] border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300"></div>
        <div><label class="text-[10px] text-gray-500">อีเมล</label><input type="text" id="profEmailField" readonly class="w-full bg-[#15161a] border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-300"></div>
      </div>

      <div class="bg-[#0f1013] border border-gray-800 rounded-3xl p-6 space-y-3">
        <h4 class="text-xs font-bold text-white flex items-center gap-1.5"><span class="text-red-500">🔒</span> เปลี่ยนรหัสผ่าน</h4>
        <input type="password" placeholder="รหัสผ่านเดิม" class="w-full bg-[#15161a] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600">
        <input type="password" placeholder="รหัสผ่านใหม่" class="w-full bg-[#15161a] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600">
        <button onclick="alert('เปลี่ยนรหัสผ่านเรียบร้อย!')" class="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-xl text-xs">ยืนยันรหัสผ่าน</button>
      </div>
    </div>
  </div>

  <!-- ==================== 7. VIEW: แนะนำเพื่อน (AFFILIATE ตามคลิป 01:26) ==================== -->
  <div id="view-affiliate" class="page-view hidden max-w-4xl mx-auto px-4 py-8 space-y-6">
    <div class="text-center mb-6">
      <h2 class="text-2xl font-black text-white">เพื่อนซื้อของที่ร้าน คุณได้ส่วนแบ่งทันที</h2>
      <p class="text-xs text-gray-400 mt-1">รับส่วนแบ่ง 1% ทันทีเมื่อเพื่อนที่คุณแนะนำทำการสั่งซื้อสินค้าในระบบ</p>
    </div>

    <div class="bg-[#0f1013] border border-gray-800 rounded-3xl p-6 space-y-4">
      <label class="text-xs text-gray-400 font-semibold block">ลิงก์ชวนเพื่อนของคุณ</label>
      <div class="flex gap-2">
        <input type="text" value="https://deksus.com/?ref=DEKSUS99" readonly class="flex-1 bg-[#15161a] border border-gray-800 rounded-xl px-3.5 py-2.5 text-xs text-red-400 font-mono">
        <button onclick="navigator.clipboard.writeText('https://deksus.com/?ref=DEKSUS99'); alert('คัดลอกลิงก์สำเร็จ!')" class="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2 rounded-xl text-xs">คัดลอก</button>
      </div>
    </div>
  </div>

  <!-- ==================== 8. VIEW: หน้ารายละเอียดสินค้า ==================== -->
  <div id="view-detail" class="page-view hidden max-w-6xl mx-auto px-4 py-8">
    <div class="flex items-center gap-2 text-xs text-gray-400 mb-6">
      <button onclick="switchView('shop')" class="hover:text-red-500">ร้านค้า</button>
      <span>></span>
      <span id="detailBreadcrumbName" class="text-white font-semibold"></span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-16">
      <div class="md:col-span-5 bg-[#0e0f12] border border-gray-800/80 rounded-3xl p-6 text-center relative overflow-hidden neon-red">
        <img id="detailImg" src="" alt="3D Box" class="w-full max-h-[360px] object-contain mx-auto drop-shadow-[0_15px_30px_rgba(239,35,35,0.4)]">
      </div>

      <div class="md:col-span-7 space-y-5">
        <div>
          <h2 id="detailTitle" class="text-3xl font-black text-white tracking-wide"></h2>
          <span class="inline-block mt-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-0.5 rounded-full">● พร้อมส่งอัตโนมัติ</span>
        </div>

        <div class="space-y-2">
          <label class="text-xs text-gray-400 font-semibold block">เลือกสินค้า / ตัวเลือก</label>
          <div class="space-y-2" id="packageOptions"></div>
        </div>

        <div>
          <span class="text-3xl font-black text-red-500" id="detailPriceDisplay">฿35.00</span>
          <span id="discountNotice" class="hidden text-xs text-emerald-400 ml-2 font-medium"></span>
        </div>

        <div class="flex items-center gap-4">
          <span class="text-xs text-gray-400">จำนวน:</span>
          <div class="flex items-center bg-[#15161a] border border-gray-800 rounded-xl overflow-hidden">
            <button onclick="changeQty(-1)" class="px-3 py-1.5 text-gray-400 hover:text-white font-bold text-sm">-</button>
            <span id="qtyDisplay" class="px-4 py-1.5 text-xs text-white font-bold">1</span>
            <button onclick="changeQty(1)" class="px-3 py-1.5 text-gray-400 hover:text-white font-bold text-sm">+</button>
          </div>
        </div>

        <div class="flex gap-2 max-w-md">
          <input type="text" id="couponInput" placeholder="กรอกโค้ดส่วนลด (เช่น FREE50)" class="flex-1 bg-[#101114] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-600">
          <button onclick="applyCoupon()" class="bg-[#1f2026] hover:bg-gray-700 text-gray-300 text-xs px-4 py-2 rounded-xl transition font-medium">ใช้งาน</button>
        </div>

        <button onclick="executePurchase()" class="w-full max-w-md bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-2xl text-sm shadow-lg shadow-red-600/40 flex items-center justify-center gap-2">
          🛒 ซื้อเลย >
        </button>
      </div>
    </div>
  </div>

  <!-- Footer ตามแบบ DEKSUS OFFICIAL -->
  <footer class="border-t border-gray-900 bg-black pt-16 pb-8 text-center mt-20">
    <div class="max-w-4xl mx-auto px-4 space-y-4">
      <img src="/logo.png" onerror="this.src='https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100'" alt="DEKSUS" class="h-10 mx-auto object-contain drop-shadow-[0_0_15px_rgba(239,35,35,0.7)]">
      <h3 class="text-xl md:text-2xl font-black text-white">Deksus Official we will give the greatest experience external cheat</h3>
      <p class="text-gray-400 text-xs leading-relaxed max-w-md mx-auto">
        ร้านค้าออนไลน์ที่ให้บริการสินค้าคุณภาพ บริการ 24/7 ระบบออโต้<br>
        พร้อมระบบเติมเงินที่สะดวกและรวดเร็ว
      </p>
      <div class="border-t border-gray-900 pt-8 mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500">
        <div class="flex gap-4">
          <button onclick="switchView('home')" class="hover:text-white">หน้าหลัก</button>
          <button onclick="switchView('shop')" class="hover:text-white">ร้านค้า</button>
        </div>
        <p>● ออนไลน์ DEKSUS OFFICIAL ♡ Created by Deksus X Underground</p>
      </div>
    </div>
  </footer>

  <!-- ==================== MODALS ==================== -->

  <!-- 1. Modal ติดต่อเรา (เหมือนในวิดีโอ 00:43) -->
  <div id="contactModal" class="fixed inset-0 bg-black/85 backdrop-blur-md hidden items-center justify-center p-4 z-50">
    <div class="bg-[#111215] border border-red-950/60 rounded-3xl max-w-xs w-full p-6 text-center relative shadow-2xl modal-anim">
      <button onclick="toggleModal('contactModal')" class="absolute top-4 right-4 text-gray-500 hover:text-white">&times;</button>
      <img src="/logo.png" onerror="this.src='https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100'" alt="DEKSUS" class="h-8 mx-auto object-contain mb-2">
      <h4 class="text-base font-black text-white">DEKSUS OFFICIAL</h4>
      <p class="text-[11px] text-gray-500 mb-5">ช่องทางการติดต่อ & โซเชียล</p>
      <div class="space-y-2.5">
        <a href="https://discord.com" target="_blank" class="w-full bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2">Discord ↗</a>
        <a href="https://youtube.com" target="_blank" class="w-full bg-[#EA4335] hover:bg-[#d9382b] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2">YouTube ↗</a>
      </div>
    </div>
  </div>

  <!-- 2. Modal สมาชิก (Google OAuth & สมัครสมาชิก) -->
  <div id="authModal" class="fixed inset-0 bg-black/85 backdrop-blur-md hidden items-center justify-center p-4 z-50">
    <div class="bg-[#111215] border border-red-950/60 rounded-3xl max-w-[390px] w-full p-6 sm:p-7 relative shadow-2xl modal-anim">
      <button onclick="toggleModal('authModal')" class="absolute top-5 right-5 text-gray-500 hover:text-gray-300 text-xl">&times;</button>
      <div class="flex justify-center mb-4">
        <img src="/logo.png" onerror="this.src='https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100'" alt="DEKSUS" class="h-10 object-contain drop-shadow-[0_0_15px_rgba(239,35,35,0.7)]">
      </div>
      <div class="text-center mb-5">
        <p id="authSubtitle" class="text-red-500 text-xs font-bold tracking-wide">สมัครสมาชิก</p>
        <h3 id="authMainTitle" class="text-2xl font-black text-white mt-0.5">สร้างบัญชีใหม่</h3>
      </div>
      <div class="flex border-b border-gray-800/80 mb-5">
        <button id="tabLogin" onclick="switchAuthTab('login')" class="flex-1 pb-2.5 text-center text-xs font-medium text-gray-400">เข้าสู่ระบบ</button>
        <button id="tabRegister" onclick="switchAuthTab('register')" class="flex-1 pb-2.5 text-center text-xs font-bold text-white border-b-2 border-red-600">สมัครสมาชิก</button>
      </div>
      <form onsubmit="handleAuthSubmit(event)" class="space-y-3">
        <input type="text" id="authUsername" required placeholder="ชื่อผู้ใช้" class="w-full bg-[#16171b] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-600">
        <div id="emailField">
          <input type="email" id="authEmail" placeholder="อีเมล (ไม่บังคับ)" class="w-full bg-[#16171b] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-600">
        </div>
        <input type="password" id="authPassword" required placeholder="รหัสผ่าน" class="w-full bg-[#16171b] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-600">
        <button type="submit" id="authSubmitBtn" class="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-red-600/40">ดำเนินการต่อ →</button>
      </form>
      <div class="py-3 text-center text-[10px] text-gray-500">หรือ</div>
      <a href="/auth/google" class="w-full bg-white hover:bg-gray-100 text-gray-800 text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md">
        <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/><path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"/><path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"/></svg>
        เข้าสู่ระบบด้วย Google
      </a>
    </div>
  </div>

  <!-- 3. Modal ส่งมอบรหัส -->
  <div id="deliveryModal" class="fixed inset-0 bg-black/85 backdrop-blur-md hidden items-center justify-center p-4 z-50">
    <div class="bg-[#111215] border border-red-600/40 rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl modal-anim">
      <div class="w-12 h-12 bg-red-600/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-black">✓</div>
      <h3 class="text-lg font-bold text-white">สั่งซื้อสำเร็จ!</h3>
      <p class="text-gray-400 text-xs mb-3">รหัสของคุณถูกจัดส่งแล้ว:</p>
      <div class="bg-black/60 border border-gray-800 rounded-xl p-3 font-mono text-xs text-red-400 select-all mb-4 break-all text-left" id="accountResult"></div>
      <button onclick="navigator.clipboard.writeText(document.getElementById('accountResult').innerText); alert('คัดลอกรหัสเรียบร้อยแล้ว!')" class="w-full bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl transition mb-2 text-xs shadow-lg shadow-red-600/30">คัดลอกข้อมูล</button>
      <button onclick="toggleModal('deliveryModal')" class="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2 rounded-xl transition text-xs">ปิด</button>
    </div>
  </div>

  <!-- 4. Modal แอดมิน แดชบอร์ด -->
  <div id="adminModal" class="fixed inset-0 bg-black/85 backdrop-blur-md hidden items-center justify-center p-4 z-50">
    <div class="bg-[#111215] border border-gray-800 rounded-3xl max-w-4xl w-full p-6 relative shadow-2xl modal-anim max-h-[92vh] overflow-y-auto">
      <button onclick="toggleModal('adminModal')" class="absolute top-5 right-5 text-gray-500 hover:text-white text-xl">&times;</button>
      <div class="flex items-center gap-3 border-b border-gray-800 pb-3 mb-6">
        <span class="text-xl">⚙️</span>
        <h3 class="text-lg font-black text-white">แผงควบคุมแอดมิน (DEKSUS OFFICIAL ADMIN)</h3>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="bg-[#16171b] border border-red-900/40 rounded-2xl p-4">
          <span class="text-[11px] text-gray-400">💰 ยอดขายเดือนนี้ (<span id="statsMonth"></span>)</span>
          <h4 class="text-2xl font-black text-red-500 mt-1" id="statsRevenue">฿0.00</h4>
        </div>
        <div class="bg-[#16171b] border border-gray-800 rounded-2xl p-4">
          <span class="text-[11px] text-gray-400">📦 ออเดอร์เดือนนี้</span>
          <h4 class="text-2xl font-black text-white mt-1" id="statsOrders">0 ชิ้น</h4>
        </div>
        <div class="bg-[#16171b] border border-gray-800 rounded-2xl p-4">
          <span class="text-[11px] text-gray-400">👥 สมาชิกทั้งหมด</span>
          <h4 class="text-2xl font-black text-emerald-400 mt-1" id="statsUsers">0 คน</h4>
        </div>
      </div>
      <div class="space-y-3">
        <h4 class="text-xs font-bold text-gray-400 uppercase">รายชื่อสมาชิก</h4>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-gray-300">
            <tbody id="userTableBody" class="divide-y divide-gray-800/60"></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <script>
    let state = {
      categories: [],
      products: [],
      currentUser: null,
      selectedProduct: null,
      selectedPackagePrice: 35.0,
      quantity: 1,
      appliedDiscount: 0,
      appliedCouponCode: '',
      activeShopCategory: null,
      authMode: 'register',
      isDropdownOpen: false
    };

    async function checkAuth() {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      state.currentUser = data.loggedIn ? data.user : null;
      renderNav();
    }

    async function loadData() {
      const res = await fetch('/api/data');
      const data = await res.json();
      state.categories = data.categories;
      state.products = data.products;
      renderHomeCatalog();
      renderShopFilters();
      renderShopCatalog();
    }

    // สลับหน้าจอแบบ Single Page App (SPA)
    function switchView(viewName) {
      document.querySelectorAll('.page-view').forEach(v => v.classList.add('hidden'));
      document.querySelectorAll('.nav-btn').forEach(b => b.className = 'nav-btn text-gray-300 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5 flex items-center gap-1');

      const target = document.getElementById('view-' + viewName);
      if (target) target.classList.remove('hidden');

      const btn = document.getElementById('navBtn-' + viewName);
      if (btn) btn.className = 'nav-btn bg-red-600 text-white px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-md shadow-red-600/30';

      // อัปเดตข้อมูลหน้านั้นๆ
      if (viewName === 'profile' && state.currentUser) {
        document.getElementById('profUsernameHeader').innerText = state.currentUser.username;
        document.getElementById('profEmailHeader').innerText = state.currentUser.email || state.currentUser.username;
        document.getElementById('profUsernameField').value = state.currentUser.username;
        document.getElementById('profEmailField').value = state.currentUser.email || '';
        document.getElementById('profBalanceDisplay').innerText = '฿' + state.currentUser.balance.toFixed(2);
        document.getElementById('profSpentDisplay').innerText = '฿' + (state.currentUser.total_spent || 0).toFixed(2);
      }
      if (viewName === 'topup' && state.currentUser) {
        document.getElementById('topupUserBalanceDisplay').innerText = '฿' + state.currentUser.balance.toFixed(2);
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderNav() {
      const authNav = document.getElementById('authNav');
      const adminNavBtn = document.getElementById('adminNavBtn');

      if (state.currentUser) {
        if (state.currentUser.role === 'admin') adminNavBtn.classList.remove('hidden');
        else adminNavBtn.classList.add('hidden');

        // เมนูขวาบนพร้อม Dropdown เหมือนในคลิป 00:49
        authNav.innerHTML = \`
          <div class="relative">
            <button onclick="toggleUserDropdown(event)" class="bg-[#18191d] border border-gray-800 hover:border-red-600/50 rounded-full px-3 py-1.5 flex items-center gap-2 text-xs">
              <div class="w-6 h-6 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-[10px]">
                \${state.currentUser.username.charAt(0).toUpperCase()}
              </div>
              <span class="text-white font-bold max-w-[120px] truncate">\${state.currentUser.username}</span>
              <span class="text-gray-500 text-[10px]">▾</span>
            </button>

            <!-- Dropdown Menu -->
            <div id="userDropdown" class="hidden absolute right-0 mt-2 w-64 bg-[#111215] border border-gray-800 rounded-3xl p-4 shadow-2xl z-50 modal-anim space-y-3">
              <div class="border-b border-gray-800 pb-3">
                <span class="text-xs font-bold text-white block truncate">\${state.currentUser.username}</span>
                <div class="flex items-center justify-between mt-2">
                  <span class="text-base font-black text-white">฿\${state.currentUser.balance.toFixed(2)}</span>
                  <button onclick="switchView('topup')" class="bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md shadow-red-600/30">+ เติมเงิน</button>
                </div>
              </div>

              <div class="space-y-1 text-xs">
                <button onclick="switchView('profile')" class="w-full text-left p-2 rounded-xl hover:bg-white/5 flex items-center gap-2 text-gray-300 hover:text-white">👤 ข้อมูลของฉัน</button>
                <button onclick="switchView('history')" class="w-full text-left p-2 rounded-xl hover:bg-white/5 flex items-center gap-2 text-gray-300 hover:text-white">🕒 ประวัติการสั่งซื้อ</button>
                <button onclick="switchView('affiliate')" class="w-full text-left p-2 rounded-xl hover:bg-white/5 flex items-center gap-2 text-gray-300 hover:text-white">🤝 แนะนำเพื่อน</button>
                <button onclick="logout()" class="w-full text-left p-2 rounded-xl hover:bg-red-600/20 text-red-500 flex items-center gap-2 font-bold">🚪 ออกจากระบบ</button>
              </div>
            </div>
          </div>
        \`;
      } else {
        adminNavBtn.classList.add('hidden');
        authNav.innerHTML = \`
          <button onclick="openAuthModal('login')" class="text-gray-300 hover:text-white text-xs px-3 py-1.5 rounded-full">เข้าสู่ระบบ</button>
          <button onclick="openAuthModal('register')" class="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-1.5 rounded-full shadow-lg shadow-red-600/30">สมัครสมาชิก</button>
        \`;
      }
    }

    function toggleUserDropdown(e) {
      e.stopPropagation();
      const dd = document.getElementById('userDropdown');
      if (dd) dd.classList.toggle('hidden');
    }

    function closeDropdownOnClickOutside(e) {
      const dd = document.getElementById('userDropdown');
      if (dd && !dd.contains(e.target)) dd.classList.add('hidden');
    }

    // เรนเดอร์สินค้าหน้าหลัก
    function renderHomeCatalog() {
      const container = document.getElementById('catalog');
      container.innerHTML = state.categories.slice(1).map(cat => {
        const catProducts = state.products.filter(p => p.category_id === cat.id);
        if (catProducts.length === 0) return '';

        return \`
          <div class="space-y-4">
            <div class="flex items-center justify-between border-b border-gray-800 pb-2">
              <h3 class="text-base font-black text-white flex items-center gap-2">
                <span class="text-red-600">หมวดหมู่ :</span> \${cat.name}
              </h3>
              <span onclick="filterCategory(\${cat.id})" class="text-xs text-gray-500 hover:text-gray-300 cursor-pointer">ดูทั้งหมด ></span>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-5 gap-3.5">
              \${catProducts.map(p => renderProductCard(p)).join('')}
            </div>
          </div>
        \`;
      }).join('');
    }

    // เรนเดอร์หน้าร้านค้า
    function renderShopFilters() {
      const container = document.getElementById('shopCategoryFilterTabs');
      container.innerHTML = state.categories.map((cat, idx) => \`
        <button onclick="selectShopFilter(\${idx === 0 ? 'null' : cat.id}, this)" class="shop-filter-btn px-4 py-1.5 rounded-full text-xs font-semibold \${idx === 0 ? 'bg-red-600 text-white' : 'bg-[#101114] border border-gray-800 text-gray-400 hover:text-white'}">
          \${cat.name} (\${cat.count_badge || 0})
        </button>
      \`).join('');
    }

    function selectShopFilter(catId, btn) {
      state.activeShopCategory = catId;
      document.querySelectorAll('.shop-filter-btn').forEach(b => b.className = 'shop-filter-btn px-4 py-1.5 rounded-full text-xs font-semibold bg-[#101114] border border-gray-800 text-gray-400 hover:text-white');
      btn.className = 'shop-filter-btn px-4 py-1.5 rounded-full text-xs font-semibold bg-red-600 text-white';
      renderShopCatalog();
    }

    function renderShopCatalog() {
      const grid = document.getElementById('shopCatalogGrid');
      const search = (document.getElementById('shopSearchInput')?.value || '').toLowerCase();
      let list = state.products;

      if (state.activeShopCategory) {
        list = list.filter(p => p.category_id === state.activeShopCategory);
      }
      if (search) {
        list = list.filter(p => p.name.toLowerCase().includes(search));
      }

      grid.innerHTML = list.map(p => renderProductCard(p)).join('');
    }

    function renderProductCard(p) {
      const isSoldOut = p.is_out_of_stock || p.in_stock === 0;
      return \`
        <div onclick="openProductDetail(\${p.id})" class="bg-[#0e0f12] border border-gray-800/80 rounded-2xl overflow-hidden card-neon flex flex-col justify-between cursor-pointer">
          <div>
            <div class="relative">
              <img src="\${p.image_url}" alt="\${p.name}" class="h-40 w-full object-cover">
              <span class="absolute top-2 right-2 bg-black/80 text-[10px] text-gray-300 px-2 py-0.5 rounded border border-gray-800">\${p.sold_badge}</span>
            </div>
            <div class="p-3">
              <h4 class="font-bold text-white text-xs truncate">\${p.name}</h4>
              <div class="mt-1 flex items-baseline gap-1">
                <span class="text-red-500 font-black text-sm">฿\${p.price_min.toFixed(2)}</span>
                \${p.price_max > p.price_min ? \`<span class="text-[11px] text-gray-500">- ฿\${p.price_max.toFixed(2)}</span>\` : ''}
              </div>
              <p class="text-[10px] \${isSoldOut ? 'text-red-500' : 'text-emerald-400'} mt-1 flex items-center gap-1 font-medium">
                ● \${p.stock_badge}
              </p>
            </div>
          </div>
          <div class="p-3 pt-0">
            <button class="w-full text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 \${!isSoldOut ? 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}">
              \${!isSoldOut ? '🛒 ซื้อเลย >' : '🚫 สินค้าหมด'}
            </button>
          </div>
        </div>
      \`;
    }

    function filterCategory(catId) {
      switchView('shop');
      state.activeShopCategory = catId;
      renderShopCatalog();
    }

    // หน้ารายละเอียดสินค้า
    function openProductDetail(productId) {
      const p = state.products.find(item => item.id === productId);
      if (!p) return;
      state.selectedProduct = p;
      state.quantity = 1;
      state.selectedPackagePrice = p.price_min;
      state.appliedDiscount = 0;
      state.appliedCouponCode = '';

      switchView('detail');

      document.getElementById('detailBreadcrumbName').innerText = p.name;
      document.getElementById('detailImg').src = p.image_url;
      document.getElementById('detailTitle').innerText = p.name;
      document.getElementById('couponInput').value = '';
      document.getElementById('discountNotice').classList.add('hidden');

      const packages = [
        { name: '1 DAY', price: p.price_min },
        { name: '3 DAY', price: p.price_min * 2 },
        { name: '7 DAY', price: p.price_min * 3.5 },
        { name: '15 DAY', price: p.price_min * 5 },
        { name: '30 DAY', price: p.price_max }
      ];

      const pkgContainer = document.getElementById('packageOptions');
      pkgContainer.innerHTML = packages.map((pkg, idx) => \`
        <div onclick="selectPackage(\${pkg.price}, this)" class="package-card flex items-center justify-between p-3 rounded-xl border cursor-pointer \${idx === 0 ? 'border-red-600 bg-red-950/20' : 'border-gray-800 bg-[#111215]'}">
          <span class="text-xs font-bold text-white">\${pkg.name}</span>
          <span class="text-xs font-black text-red-500">฿\${pkg.price.toFixed(2)}</span>
        </div>
      \`).join('');

      updatePriceDisplay();
    }

    function selectPackage(price, el) {
      state.selectedPackagePrice = price;
      document.querySelectorAll('.package-card').forEach(c => c.className = 'package-card flex items-center justify-between p-3 rounded-xl border border-gray-800 bg-[#111215] cursor-pointer');
      el.className = 'package-card flex items-center justify-between p-3 rounded-xl border border-red-600 bg-red-950/20 cursor-pointer';
      updatePriceDisplay();
    }

    function changeQty(delta) {
      if (state.quantity + delta >= 1) {
        state.quantity += delta;
        document.getElementById('qtyDisplay').innerText = state.quantity;
        updatePriceDisplay();
      }
    }

    function updatePriceDisplay() {
      const raw = state.selectedPackagePrice * state.quantity;
      const finalPrice = Math.max(0, raw - state.appliedDiscount);
      document.getElementById('detailPriceDisplay').innerText = '฿' + finalPrice.toFixed(2);
    }

    async function applyCoupon() {
      const code = document.getElementById('couponInput').value.trim();
      const res = await fetch('/api/check-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (data.success) {
        state.appliedDiscount = data.discount;
        state.appliedCouponCode = data.code;
        const notice = document.getElementById('discountNotice');
        notice.innerText = '(ใช้โค้ดลด ฿' + data.discount + ')';
        notice.classList.remove('hidden');
        updatePriceDisplay();
        alert('ใช้โค้ดส่วนลดสำเร็จ!');
      } else alert(data.error);
    }

    async function executePurchase() {
      if (!state.currentUser) return openAuthModal('login');
      if (!confirm('ยืนยันการสั่งซื้อสินค้านี้?')) return;

      const res = await fetch('/api/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: state.selectedProduct.id,
          price: state.selectedPackagePrice,
          quantity: state.quantity,
          couponCode: state.appliedCouponCode
        })
      });
      const data = await res.json();
      if (data.success) {
        state.currentUser.balance = data.newBalance;
        document.getElementById('accountResult').innerText = data.account;
        toggleModal('deliveryModal');
        renderNav();
        loadData();
      } else alert(data.error);
    }

    // ระบบแท็บเติมเงิน
    function switchTopupMethod(m) {
      ['wallet', 'bank', 'give'].forEach(name => {
        document.getElementById('topupContent-' + name).classList.add('hidden');
        document.getElementById('btnTopup-' + name).className = 'topup-method-btn w-full p-3.5 rounded-2xl bg-[#0f1013] border border-gray-800 text-gray-300 flex items-center gap-3 text-left';
      });
      document.getElementById('topupContent-' + m).classList.remove('hidden');
      document.getElementById('btnTopup-' + m).className = 'topup-method-btn w-full p-3.5 rounded-2xl bg-red-600 text-white flex items-center gap-3 text-left';
    }

    // แอดมิน แดชบอร์ด
    async function openAdminDashboard() {
      toggleModal('adminModal');
      const res = await fetch('/api/admin/stats');
      const d = await res.json();
      document.getElementById('statsMonth').innerText = d.month;
      document.getElementById('statsRevenue').innerText = '฿' + d.totalRevenue.toFixed(2);
      document.getElementById('statsOrders').innerText = d.totalOrders + ' ชิ้น';
      document.getElementById('statsUsers').innerText = d.totalUsers + ' คน';

      const uRes = await fetch('/api/admin/users');
      const users = await uRes.json();
      document.getElementById('userTableBody').innerHTML = users.map(u => \`
        <tr class="hover:bg-white/5">
          <td class="p-2.5 text-gray-500 font-mono">#\${u.id}</td>
          <td class="p-2.5 font-bold text-white">\${u.username}</td>
          <td class="p-2.5 text-emerald-400 font-semibold">฿\${u.balance.toFixed(2)}</td>
          <td class="p-2.5 text-right space-x-1">
            <button onclick="promptBalance(\${u.id}, '\${u.username}')" class="bg-emerald-950 text-emerald-400 hover:bg-emerald-600 hover:text-white px-2 py-1 rounded text-[10px]">เติมเงิน</button>
            <button onclick="deleteUser(\${u.id})" class="bg-red-950 text-red-400 hover:bg-red-600 hover:text-white px-2 py-1 rounded text-[10px]">ลบ</button>
          </td>
        </tr>
      \`).join('');
    }

    async function promptBalance(userId, username) {
      const amt = prompt('ใส่จำนวนเงินที่ต้องการเพิ่มให้ ' + username + ':');
      if (!amt || isNaN(amt)) return;
      await fetch('/api/admin/users/add-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount: amt })
      });
      openAdminDashboard();
      checkAuth();
    }

    async function deleteUser(id) {
      if (!confirm('ยืนยันลบบัญชีนี้?')) return;
      await fetch('/api/admin/users/' + id, { method: 'DELETE' });
      openAdminDashboard();
    }

    function toggleModal(id) {
      const m = document.getElementById(id);
      m.classList.toggle('hidden');
      m.classList.toggle('flex');
    }

    function openAuthModal(mode) {
      switchAuthTab(mode);
      const m = document.getElementById('authModal');
      m.classList.remove('hidden');
      m.classList.add('flex');
    }

    function switchAuthTab(mode) {
      state.authMode = mode;
      const tabLogin = document.getElementById('tabLogin');
      const tabRegister = document.getElementById('tabRegister');
      const emailField = document.getElementById('emailField');
      const btn = document.getElementById('authSubmitBtn');

      if (mode === 'login') {
        tabLogin.className = 'flex-1 pb-2.5 text-center text-xs font-bold text-white border-b-2 border-red-600';
        tabRegister.className = 'flex-1 pb-2.5 text-center text-xs font-medium text-gray-400';
        emailField.classList.add('hidden');
        btn.innerText = 'เข้าสู่ระบบ →';
      } else {
        tabRegister.className = 'flex-1 pb-2.5 text-center text-xs font-bold text-white border-b-2 border-red-600';
        tabLogin.className = 'flex-1 pb-2.5 text-center text-xs font-medium text-gray-400';
        emailField.classList.remove('hidden');
        btn.innerText = 'สมัครสมาชิก →';
      }
    }

    async function handleAuthSubmit(e) {
      e.preventDefault();
      const u = document.getElementById('authUsername').value;
      const p = document.getElementById('authPassword').value;
      const em = document.getElementById('authEmail').value;
      const url = state.authMode === 'login' ? '/api/auth/login' : '/api/auth/register';

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p, email: em })
      });
      const data = await res.json();
      if (data.success) {
        state.currentUser = data.user;
        toggleModal('authModal');
        renderNav();
      } else alert(data.error);
    }

    async function logout() {
      await fetch('/api/auth/logout', { method: 'POST' });
      state.currentUser = null;
      renderNav();
      switchView('home');
    }

    checkAuth().then(loadData);
  </script>
</body>
</html>
  `);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`DEKSUS Store is running at http://localhost:${PORT}`);
});