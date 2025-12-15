const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');
const puppeteer = require('puppeteer-core');

const BUILD_DIR = path.join(__dirname, 'build');
const PORT = process.env.PORT || 5000;
const SNAP_DIR = path.join(__dirname, 'visual-snapshots');

if (!fs.existsSync(BUILD_DIR)) {
  console.error('Build directory not found. Run `npm run build` first.');
  process.exit(1);
}
if (!fs.existsSync(SNAP_DIR)) fs.mkdirSync(SNAP_DIR);

// Minimal static server
const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  let safePath = path.normalize(parsed.pathname).replace(/^\.+/, '');
  let filePath = path.join(BUILD_DIR, safePath);
  // default to index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  if (!fs.existsSync(filePath)) filePath = path.join(BUILD_DIR, 'index.html');
  const stream = fs.createReadStream(filePath);
  res.statusCode = 200;
  stream.pipe(res);
});

server.listen(PORT, async () => {
  console.log(`Serving ${BUILD_DIR} at http://localhost:${PORT}`);

  // try common Edge/Chrome paths
  const candidates = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
  ];
  let executablePath;
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      executablePath = p;
      break;
    }
  }

  const opts = executablePath ? { executablePath } : {};

  try {
    const browser = await puppeteer.launch({
      ...opts,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const viewports = [
      { name: 'desktop', width: 1280, height: 800 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'mobile', width: 375, height: 812 }
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle2' });
      const file = path.join(SNAP_DIR, `${vp.name}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log('Saved', file);
    }

    await browser.close();
  } catch (err) {
    console.error('Screenshot run failed:', err.message || err);
  } finally {
    server.close();
    console.log('Server stopped');
  }
});
