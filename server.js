import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const KLASOR = import.meta.dirname;
const KAYIT_DOSYASI = path.join(KLASOR, 'kayit.json');

async function kayitOku() {
  try {
    const veri = await fs.readFile(KAYIT_DOSYASI, 'utf8');
    return JSON.parse(veri);
  } catch {
    const baslangic = { fethedilenler: ['ankara'] };
    await fs.writeFile(KAYIT_DOSYASI, JSON.stringify(baslangic, null, 2));
    return baslangic;
  }
}

const sunucu = http.createServer(async (req, res) => {
  if (req.url === '/api/durum' && req.method === 'GET') {
    const veri = await kayitOku();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(veri));
  }

  if (req.url === '/api/fethet' && req.method === 'POST') {
    let govde = '';
    req.on('data', parca => govde += parca);
    req.on('end', async () => {
      const { sehirId } = JSON.parse(govde);
      const veri = await kayitOku();
      if (sehirId && !veri.fethedilenler.includes(sehirId)) {
        veri.fethedilenler.push(sehirId);
        await fs.writeFile(KAYIT_DOSYASI, JSON.stringify(veri, null, 2));
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(veri));
    });
    return;
  }

  if (req.url === '/api/sifirla' && req.method === 'POST') {
    const baslangic = { fethedilenler: ['ankara'] };
    await fs.writeFile(KAYIT_DOSYASI, JSON.stringify(baslangic, null, 2));
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(baslangic));
  }

  const dosyaYolu = path.join(KLASOR, req.url === '/' ? 'index.html' : req.url);
  const uzanti = path.extname(dosyaYolu);
  const tipler = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };

  try {
    const icerik = await fs.readFile(dosyaYolu);
    res.writeHead(200, { 'Content-Type': `${tipler[uzanti] || 'text/plain'}; charset=utf-8` });
    res.end(icerik);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Sayfa Bulunamadi');
  }
});

const PORT = process.env.PORT || 3000;
sunucu.listen(PORT, () => console.log(`Oyun hazir: http://localhost:${PORT}`));
