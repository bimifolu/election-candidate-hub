import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('./', import.meta.url);
const files = new Map([
  ['/', ['index.html', 'text/html']],
  ['/index.html', ['index.html', 'text/html']],
  ['/styles.css', ['styles.css', 'text/css']],
  ['/app.js', ['app.js', 'text/javascript']],
  ['/data.js', ['data.js', 'text/javascript']],
  ['/map-data.js', ['map-data.js', 'text/javascript']],
  ['/senate-data.js', ['senate-data.js', 'text/javascript']],
  ['/reps-data.js', ['reps-data.js', 'text/javascript']],
  ['/sources/senate-2027.pdf', ['sources/senate-2027.pdf', 'application/pdf']],
  ['/sources/reps-2027.pdf', ['sources/reps-2027.pdf', 'application/pdf']],
]);
const server = http.createServer(async (req, res) => {
  const file = files.get(new URL(req.url, 'http://localhost').pathname);
  if (!file) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const body = await readFile(fileURLToPath(new URL(file[0], root)));
    res.writeHead(200, { 'Content-Type': file[1] === 'application/pdf' ? file[1] : `${file[1]}; charset=utf-8`, 'X-Content-Type-Options': 'nosniff' });
    res.end(body);
  } catch { res.writeHead(500); res.end('Unable to load page'); }
});
server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log(`Candidate Hub running on port ${server.address().port}`));
