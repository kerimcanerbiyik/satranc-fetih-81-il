const tahtaEl = document.getElementById('satranc-tahtasi');
const durumEl = document.getElementById('durum-bilgisi');
const aktifSehirEl = document.getElementById('aktif-sehir');
const skorEl = document.getElementById('skor');
const ilSeciciEl = document.getElementById('il-secici');
const ipucuEl = document.getElementById('il-ipucu');

const TASLAR = {
  r: '♜', n: '♞', b: '♝', q: '♛', k: '♚', p: '♟',
  R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔', P: '♙'
};
const PUAN = { p: 10, n: 30, b: 30, r: 50, q: 90, k: 900 };

let tahta = [];
let seciliKare = null;
let siraBeyazda = true;
let hedefSehir = null;
let fethedilenler = JSON.parse(localStorage.getItem('fethedilen_iller')) || ['ankara'];

const tumIller = Array.from(document.querySelectorAll('#iller path'));

function ilListesiniDoldur() {
  ilSeciciEl.innerHTML = '<option value="">-- Hedef İl Seçin --</option>';
  tumIller
    .sort((a, b) => Number(a.dataset.plaka) - Number(b.dataset.plaka))
    .forEach(il => {
      const opt = document.createElement('option');
      opt.value = il.id;
      const durum = fethedilenler.includes(il.id) ? '✓' : '⚔️';
      opt.textContent = `${il.dataset.plaka} - ${il.dataset.iladi} (${durum})`;
      ilSeciciEl.appendChild(opt);
    });
}

function hedefBelirle(ilEl) {
  if (!ilEl) return;
  if (fethedilenler.includes(ilEl.id)) {
    durumEl.textContent = `${ilEl.dataset.plaka} ${ilEl.dataset.iladi} zaten sizin kontrolünüzde!`;
    return;
  }
  hedefSehir = { id: ilEl.id, ad: `${ilEl.dataset.plaka} - ${ilEl.dataset.iladi}` };
  aktifSehirEl.textContent = hedefSehir.ad;
  ilSeciciEl.value = ilEl.id;
  durumEl.textContent = `${hedefSehir.ad} kuşatması başladı! Beyaz taşlarla oynuyorsunuz.`;
  haritaSiniflariniGuncelle();
  tahtayiSifirla();
}

function haritaSiniflariniGuncelle() {
  tumIller.forEach(il => {
    il.classList.remove('fethedildi', 'secili-hedef');
    if (fethedilenler.includes(il.id)) {
      il.classList.add('fethedildi');
    } else if (hedefSehir && hedefSehir.id === il.id) {
      il.classList.add('secili-hedef');
    }
  });
  skorEl.textContent = fethedilenler.length;
}

async function haritayiGuncelle() {
  try {
    const yanit = await fetch('/api/durum');
    if (yanit.ok) {
      const veri = await yanit.json();
      if (Array.isArray(veri.fethedilenler) && veri.fethedilenler.length > 0) {
        fethedilenler = Array.from(new Set([...fethedilenler, ...veri.fethedilenler]));
        localStorage.setItem('fethedilen_iller', JSON.stringify(fethedilenler));
      }
    }
  } catch (err) {}
  haritaSiniflariniGuncelle();
  ilListesiniDoldur();
}

tumIller.forEach(il => {
  il.addEventListener('click', () => hedefBelirle(il));
  il.addEventListener('mousemove', (e) => {
    const rect = il.ownerSVGElement.parentElement.getBoundingClientRect();
    const durum = fethedilenler.includes(il.id) ? 'Fethedildi' : 'Düşman Bölgesi';
    ipucuEl.textContent = `${il.dataset.plaka} ${il.dataset.iladi} • ${durum}`;
    ipucuEl.style.left = `${e.clientX - rect.left + 12}px`;
    ipucuEl.style.top = `${e.clientY - rect.top - 28}px`;
    ipucuEl.hidden = false;
  });
  il.addEventListener('mouseleave', () => { ipucuEl.hidden = true; });
});

ilSeciciEl.addEventListener('change', (e) => {
  const secilen = document.getElementById(e.target.value);
  hedefBelirle(secilen);
});

function tahtayiSifirla() {
  tahta = [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['','','','','','','',''],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R']
  ];
  seciliKare = null;
  siraBeyazda = true;
  tahtayiCiz();
}

const beyazMi = (t) => t !== '' && t === t.toUpperCase();
const siyahMi = (t) => t !== '' && t === t.toLowerCase();

function gecerliHamleler(r, c, mevcutTahta = tahta) {
  const tas = mevcutTahta[r][c];
  if (!tas) return [];
  const hamleler = [];
  const beyaz = beyazMi(tas);
  const tip = tas.toLowerCase();

  const ekle = (nr, nc) => {
    if (nr < 0 || nr > 7 || nc < 0 || nc > 7) return false;
    const hedef = mevcutTahta[nr][nc];
    if (hedef === '') { hamleler.push([nr, nc]); return true; }
    if (beyaz ? siyahMi(hedef) : beyazMi(hedef)) { hamleler.push([nr, nc]); }
    return false;
  };

  if (tip === 'p') {
    const yon = beyaz ? -1 : 1;
    const baslangic = beyaz ? 6 : 1;
    if (mevcutTahta[r + yon]?.[c] === '') {
      hamleler.push([r + yon, c]);
      if (r === baslangic && mevcutTahta[r + 2 * yon]?.[c] === '') {
        hamleler.push([r + 2 * yon, c]);
      }
    }
    [-1, 1].forEach(dc => {
      const hedef = mevcutTahta[r + yon]?.[c + dc];
      if (hedef && (beyaz ? siyahMi(hedef) : beyazMi(hedef))) {
        hamleler.push([r + yon, c + dc]);
      }
    });
  }

  const yonler = {
    r: [[1,0],[-1,0],[0,1],[0,-1]],
    b: [[1,1],[1,-1],[-1,1],[-1,-1]],
    q: [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],
    n: [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]],
    k: [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]
  };

  if (['r', 'b', 'q'].includes(tip)) {
    yonler[tip].forEach(([dr, dc]) => {
      for (let i = 1; i < 8; i++) {
        if (!ekle(r + dr * i, c + dc * i)) break;
      }
    });
  } else if (['n', 'k'].includes(tip)) {
    yonler[tip].forEach(([dr, dc]) => ekle(r + dr, c + dc));
  }

  return hamleler;
}

function tahtayiCiz() {
  tahtaEl.innerHTML = '';
  const olasiHamleler = seciliKare ? gecerliHamleler(seciliKare[0], seciliKare[1]) : [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const kare = document.createElement('div');
      kare.className = `kare ${(r + c) % 2 === 0 ? 'acik' : 'koyu'}`;
      if (seciliKare && seciliKare[0] === r && seciliKare[1] === c) {
        kare.classList.add('secili');
      }
      if (olasiHamleler.some(([hr, hc]) => hr === r && hc === c)) {
        kare.classList.add('hamle-izi');
      }

      kare.textContent = TASLAR[tahta[r][c]] || '';
      kare.addEventListener('click', () => kareyeTiklandi(r, c));
      tahtaEl.appendChild(kare);
    }
  }
}

async function kareyeTiklandi(r, c) {
  if (!hedefSehir) {
    durumEl.textContent = 'Önce haritadan fethedeceğiniz ili seçin!';
    return;
  }
  if (!siraBeyazda) return;

  if (seciliKare) {
    const [sr, sc] = seciliKare;
    const hamleler = gecerliHamleler(sr, sc);
    if (hamleler.some(([hr, hc]) => hr === r && hc === c)) {
      hamleYap(sr, sc, r, c);
      seciliKare = null;
      tahtayiCiz();

      const bitti = await oyunBittiMi();
      if (!bitti) {
        siraBeyazda = false;
        durumEl.textContent = `${hedefSehir.ad} savunması düşünüyor...`;
        setTimeout(() => {
          bilgisayarHamlesi();
        }, 400);
      }
      return;
    }
  }

  seciliKare = beyazMi(tahta[r][c]) ? [r, c] : null;
  tahtayiCiz();
}

function hamleYap(sr, sc, hr, hc) {
  let tas = tahta[sr][sc];
  if (tas === 'P' && hr === 0) tas = 'Q';
  if (tas === 'p' && hr === 7) tas = 'q';
  tahta[hr][hc] = tas;
  tahta[sr][sc] = '';
}

async function bilgisayarHamlesi() {
  let tumHamleler = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (siyahMi(tahta[r][c])) {
        const hamleListesi = gecerliHamleler(r, c);
        hamleListesi.forEach(([hr, hc]) => {
          const hedefTas = tahta[hr][hc];
          let skor = hedefTas ? PUAN[hedefTas.toLowerCase()] : 0;

          if ((hr === 3 || hr === 4) && (hc === 3 || hc === 4)) {
            skor += 2;
          }

          const kopyaTahta = tahta.map(satir => [...satir]);
          kopyaTahta[hr][hc] = kopyaTahta[r][c];
          kopyaTahta[r][c] = '';

          let maxTehdit = 0;
          for (let br = 0; br < 8; br++) {
            for (let bc = 0; bc < 8; bc++) {
              if (beyazMi(kopyaTahta[br][bc])) {
                gecerliHamleler(br, bc, kopyaTahta).forEach(([thr, thc]) => {
                  const tehditEdilen = kopyaTahta[thr][thc];
                  if (tehditEdilen && siyahMi(tehditEdilen)) {
                    const kayip = PUAN[tehditEdilen];
                    if (kayip > maxTehdit) maxTehdit = kayip;
                  }
                });
              }
            }
          }

          skor -= maxTehdit * 0.8;
          tumHamleler.push({ sr: r, sc: c, hr, hc, skor });
        });
      }
    }
  }

  if (tumHamleler.length === 0) {
    await sehriFethet();
    return;
  }

  tumHamleler.sort((a, b) => b.skor - a.skor);
  const enIyiSkor = tumHamleler[0].skor;
  const adaylar = tumHamleler.filter(h => h.skor === enIyiSkor);
  const secim = adaylar[Math.floor(Math.random() * adaylar.length)];

  hamleYap(secim.sr, secim.sc, secim.hr, secim.hc);
  tahtayiCiz();

  const bitti = await oyunBittiMi();
  if (!bitti) {
    siraBeyazda = true;
    durumEl.textContent = `Sıra sizde! (${hedefSehir.ad} kuşatması sürüyor)`;
  }
}

async function oyunBittiMi() {
  const duzTahta = tahta.flat();
  if (!duzTahta.includes('k')) {
    await sehriFethet();
    return true;
  }
  if (!duzTahta.includes('K')) {
    durumEl.textContent = `Yenildiniz! ${hedefSehir.ad} savunmayı kazandı. Tahtayı sıfırlayıp tekrar deneyin.`;
    siraBeyazda = false;
    return true;
  }
  return false;
}

async function sehriFethet() {
  if (!hedefSehir) return;
  const fethedilenId = hedefSehir.id;
  const fethedilenAd = hedefSehir.ad;

  if (!fethedilenler.includes(fethedilenId)) {
    fethedilenler.push(fethedilenId);
    localStorage.setItem('fethedilen_iller', JSON.stringify(fethedilenler));
  }

  try {
    await fetch('/api/fethet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sehirId: fethedilenId })
    });
  } catch (err) {}

  durumEl.textContent = `ZAFER! ${fethedilenAd} fethedildi! Haritadan yeni hedef seçin.`;
  hedefSehir = null;
  aktifSehirEl.textContent = 'Seçilmedi';
  haritaSiniflariniGuncelle();
  ilListesiniDoldur();
}

document.getElementById('yeniden-baslat').addEventListener('click', tahtayiSifirla);
document.getElementById('hizli-zafer').addEventListener('click', sehriFethet);
document.getElementById('fetih-sifirla').addEventListener('click', async () => {
  fethedilenler = ['ankara'];
  localStorage.setItem('fethedilen_iller', JSON.stringify(fethedilenler));
  try {
    await fetch('/api/sifirla', { method: 'POST' });
  } catch (err) {}

  hedefSehir = null;
  aktifSehirEl.textContent = 'Seçilmedi';
  durumEl.textContent = 'Tüm fetihler sıfırlandı. Ankara başkent olarak yeniden başladı!';
  haritaSiniflariniGuncelle();
  ilListesiniDoldur();
  tahtayiSifirla();
});

haritayiGuncelle();
tahtayiSifirla();
