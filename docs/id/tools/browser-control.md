---
read_when:
    - Membuat skrip atau men-debug browser agen melalui API kontrol lokal
    - Mencari referensi CLI `openclaw browser`
    - Menambahkan otomatisasi browser khusus dengan snapshot dan referensi
summary: API kontrol browser OpenClaw, referensi CLI, dan tindakan skrip
title: API kontrol peramban
x-i18n:
    generated_at: "2026-07-16T18:47:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8063f55c9881e45e65492dc40e2902bf05feb08ae9a74986ba2d7621e0dbe71a
    source_path: tools/browser-control.md
    workflow: 16
---

Untuk penyiapan, konfigurasi, dan pemecahan masalah, lihat [Browser](/id/tools/browser).
Halaman ini merupakan referensi untuk API HTTP kontrol lokal, CLI `openclaw browser`,
dan pola skrip (snapshot, ref, penantian, alur debug).

## API Kontrol (opsional)

Khusus untuk integrasi lokal, Gateway menyediakan API HTTP loopback sederhana.
Server mandiri ini bersifat opsional — tetapkan variabel lingkungan
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` di lingkungan layanan gateway
dan mulai ulang gateway sebelum endpoint HTTP tersedia. Tanpa
variabel ini, runtime kontrol browser tetap berfungsi melalui CLI dan
alat agen, tetapi tidak ada yang mendengarkan pada port kontrol loopback.

- Status/mulai/hentikan: `GET /`, `GET /doctor`, `POST /start`, `POST /stop`, `POST /reset-profile`
- Profil: `GET /profiles`, `POST /profiles/create`, `DELETE /profiles/:name`
- Tab: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`, `POST /tabs/action`
- Snapshot/tangkapan layar: `GET /snapshot`, `POST /screenshot`
- Tindakan: `POST /navigate`, `POST /act`
- Hook: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Unduhan: `POST /download`, `POST /wait/download`
- Izin: `POST /permissions/grant`
- Debug: `GET /console`, `POST /pdf`
- Debug: `GET /errors`, `GET /requests`, `GET /dialogs`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Jaringan: `POST /response/body`
- Status: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Status: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Pengaturan: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

`POST /tabs/action` adalah bentuk batch yang digunakan CLI secara internal untuk
subperintah `browser tab` (`{"action":"new"|"label"|"select"|"close"|"list", ...}`);
utamakan rute tab dengan satu tujuan di atas saat membuat skrip secara langsung.

Semua endpoint menerima `?profile=<name>`. `POST /start?headless=true` meminta
peluncuran headless sekali pakai untuk profil lokal terkelola tanpa mengubah konfigurasi
browser yang dipertahankan; profil hanya-lampirkan, CDP jarak jauh, dan sesi yang sudah ada menolak
penggantian tersebut karena OpenClaw tidak meluncurkan proses browser itu.

Untuk endpoint tab, `targetId` adalah nama bidang kompatibilitas. Sebaiknya teruskan
`suggestedTargetId` dari `GET /tabs` atau `POST /tabs/open`; label dan handle `tabId`
seperti `t1` juga diterima. ID target CDP mentah dan prefiks ID target mentah yang unik
tetap berfungsi, tetapi merupakan handle diagnostik yang tidak stabil.

Jika autentikasi gateway dengan rahasia bersama dikonfigurasi, rute HTTP browser juga memerlukan autentikasi:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` atau autentikasi HTTP Basic dengan kata sandi tersebut

Catatan:

- API browser loopback mandiri ini **tidak** menggunakan header identitas proksi tepercaya atau
  Tailscale Serve.
- Jika `gateway.auth.mode` adalah `none` atau `trusted-proxy`, rute browser loopback ini
  tidak mewarisi mode yang membawa identitas tersebut; pertahankan agar hanya dapat diakses melalui loopback.

### Kontrak galat `/act`

`POST /act` menggunakan respons galat terstruktur untuk kegagalan validasi tingkat rute dan
kebijakan:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Nilai `code` saat ini:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` tidak ada atau tidak dikenali.
- `ACT_INVALID_REQUEST` (HTTP 400): payload tindakan gagal dinormalisasi atau divalidasi.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` digunakan dengan jenis tindakan yang tidak didukung.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (atau `wait --fn`) dinonaktifkan oleh konfigurasi.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` tingkat atas atau berbentuk batch bertentangan dengan target permintaan.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): tindakan tidak didukung untuk profil sesi yang sudah ada.

Kegagalan runtime lainnya masih dapat mengembalikan `{ "error": "<message>" }` tanpa
bidang `code`.

### Persyaratan Playwright

Beberapa fitur (navigasi/tindakan/snapshot AI/snapshot peran, tangkapan layar elemen,
PDF) memerlukan Playwright. Jika Playwright tidak terpasang, endpoint tersebut mengembalikan
galat 501 yang jelas.

Yang tetap berfungsi tanpa Playwright:

- Snapshot ARIA
- Snapshot aksesibilitas bergaya peran (`--interactive`, `--compact`,
  `--depth`, `--efficient`) saat WebSocket CDP per tab tersedia. Ini merupakan
  fallback untuk inspeksi dan penemuan ref; Playwright tetap menjadi mesin
  tindakan utama.
- Tangkapan layar halaman untuk browser `openclaw` terkelola saat WebSocket CDP
  per tab tersedia
- Tangkapan layar halaman untuk profil `existing-session` / Chrome MCP
- Tangkapan layar berbasis ref `existing-session` (`--ref`) dari keluaran snapshot

Yang tetap memerlukan Playwright:

- `navigate`
- `act`
- Snapshot AI yang bergantung pada format snapshot AI native Playwright
- Tangkapan layar elemen dengan pemilih CSS (`--element`)
- Ekspor PDF browser lengkap

Tangkapan layar elemen juga menolak `--full-page`; rute mengembalikan `fullPage is
not supported for element screenshots`.

Jika Anda melihat `Playwright is not available in this gateway build`, Gateway yang dikemas
tidak memiliki dependensi runtime browser inti. Pasang ulang atau perbarui
OpenClaw, lalu mulai ulang gateway. Untuk Docker, pasang juga biner browser
Chromium seperti ditunjukkan di bawah.

#### Pemasangan Playwright di Docker

Jika Gateway Anda berjalan di Docker, hindari `npx playwright` (konflik penggantian npm).
Untuk image khusus, sertakan Chromium di dalam image:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Untuk image yang sudah ada, pasang melalui CLI bawaan sebagai gantinya:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Untuk mempertahankan unduhan browser, tetapkan `PLAYWRIGHT_BROWSERS_PATH` (misalnya,
`/home/node/.cache/ms-playwright`) dan pastikan `/home/node` dipertahankan melalui
`OPENCLAW_HOME_VOLUME` atau bind mount. OpenClaw secara otomatis mendeteksi
Chromium yang dipertahankan di Linux. Lihat [Docker](/id/install/docker).

## Cara kerjanya (internal)

Server kontrol loopback sederhana menerima permintaan HTTP dan terhubung ke browser berbasis Chromium melalui CDP. Tindakan lanjutan (klik/ketik/snapshot/PDF) dijalankan melalui Playwright di atas CDP; jika Playwright tidak tersedia, hanya operasi non-Playwright yang dapat digunakan. Agen melihat satu antarmuka stabil sementara browser dan profil lokal/jarak jauh dapat saling berganti secara bebas di baliknya.

## Referensi cepat CLI

Semua perintah menerima `--browser-profile <name>` untuk menargetkan profil tertentu, dan `--json` untuk keluaran yang dapat dibaca mesin.

<AccordionGroup>

<Accordion title="Dasar: status, tab, buka/fokus/tutup">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # tambahkan pemeriksaan snapshot langsung
openclaw browser start
openclaw browser start --headless # peluncuran headless terkelola lokal sekali pakai
openclaw browser stop            # juga menghapus emulasi pada CDP hanya-lampirkan/jarak jauh
openclaw browser reset-profile   # memindahkan data browser profil ke Trash
openclaw browser tabs
openclaw browser tab             # pintasan untuk tab saat ini
openclaw browser tab new
openclaw browser tab new --label research
openclaw browser tab label abcd1234 research
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Profil: daftar, buat, hapus">

```bash
openclaw browser profiles
openclaw browser create-profile --name research --color "#0066CC"
openclaw browser create-profile --name attach --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser delete-profile --name research
```

</Accordion>

<Accordion title="Inspeksi: tangkapan layar, snapshot, konsol, galat, permintaan">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # atau --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser snapshot --out snapshot.txt
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Tindakan: navigasi, klik, ketik, seret, tunggu, evaluasi">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # atau e12 untuk ref peran
openclaw browser click-coords 120 340        # koordinat viewport
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref e12
openclaw browser upload media://inbound/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Status: cookie, penyimpanan, luring, header, lokasi geografis, perangkat">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear untuk menghapus
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Catatan:

- Tool `browser` yang digunakan agen menyediakan `action=download` (`ref` dan
  `path` wajib) serta `action=waitfordownload` (`path` opsional). Keduanya mengembalikan URL
  unduhan yang tersimpan, nama file yang disarankan, dan jalur lokal yang dilindungi. Intersepsi unduhan
  eksplisit tersedia untuk profil Playwright terkelola; profil sesi yang sudah ada
  mengembalikan galat operasi yang tidak didukung.
- Utamakan unggahan pemilih atomik: teruskan pemicu `--ref` bersama unggahan agar OpenClaw menyiapkan dan mengeklik dalam satu permintaan. `upload` yang hanya berisi jalur tetap didukung jika pemicu berikutnya memang disengaja. Gunakan `--input-ref` atau `--element` untuk mengatur input file secara langsung. `dialog` adalah panggilan penyiapan; jalankan sebelum klik/penekanan yang memicu dialog. Jika suatu tindakan membuka modal, respons tindakan menyertakan `blockedByDialog` dan `browserState.dialogs.pending`; teruskan `dialogId` tersebut untuk merespons secara langsung. Dialog yang ditangani di luar OpenClaw muncul di bawah `browserState.dialogs.recent`.
- `click`/`type`/dan seterusnya memerlukan `ref` dari `snapshot` (`12` numerik, ref peran `e12`, atau ref ARIA yang dapat ditindaklanjuti `ax12`). Selektor CSS sengaja tidak didukung untuk tindakan. Gunakan `click-coords` ketika posisi viewport yang terlihat adalah satu-satunya target yang andal.
- Jalur unduhan dan pelacakan dibatasi ke akar sementara OpenClaw: `/tmp/openclaw{,/downloads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` menerima file dari akar unggahan sementara OpenClaw dan
  media masuk yang dikelola OpenClaw. Media masuk terkelola dapat dirujuk sebagai
  `media://inbound/<id>`, `media/inbound/<id>` yang relatif terhadap sandbox, atau jalur
  yang telah diselesaikan di dalam direktori media masuk terkelola. Ref media bertingkat,
  traversal, symlink, hardlink, dan jalur lokal sembarang tetap ditolak.
- `upload` juga dapat mengatur input file secara langsung melalui `--input-ref` atau `--element`.

ID dan label tab yang stabil tetap bertahan saat target mentah Chromium diganti jika OpenClaw
dapat membuktikan tab penggantinya, seperti pasangan lama/baru yang unik untuk URL yang sama atau
satu tab lama berubah menjadi satu tab baru setelah pengiriman formulir. Penggantian
URL duplikat yang ambigu menerima handle baru. ID target mentah tetap
tidak stabil; utamakan `suggestedTargetId` dari `tabs` dalam skrip.

Ringkasan flag snapshot:

- `--format ai` (default dengan Playwright): snapshot AI dengan ref numerik (`aria-ref="<n>"`).
- `--format aria`: pohon aksesibilitas dengan ref `axN`. Saat Playwright tersedia, OpenClaw mengikat ref dengan ID DOM backend ke halaman aktif agar tindakan lanjutan dapat menggunakannya; jika tidak, perlakukan output hanya untuk pemeriksaan.
- `--efficient` (atau `--mode efficient`): preset snapshot peran ringkas. Atur `browser.snapshotDefaults.mode: "efficient"` untuk menjadikannya default (lihat [konfigurasi Gateway](/id/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` memaksa snapshot peran dengan ref `ref=e12`. `--frame "<iframe>"` membatasi snapshot peran ke iframe.
- Dengan Playwright, `--labels` menambahkan tangkapan layar dengan label ref yang ditumpangkan
  (mencetak `MEDIA:<path>`) serta array `annotations` dengan kotak pembatas
  setiap ref. Pada `screenshot`, label berbasis Playwright berfungsi dengan `--full-page`,
  `--ref`, dan `--element`; pada `snapshot`, tangkapan layar yang menyertainya tetap
  hanya mencakup viewport. Profil sesi yang sudah ada/chrome-mcp merender label yang ditumpangkan pada
  tangkapan layar halaman, tetapi tidak mengembalikan `annotations` atau menggunakan helper proyeksi
  halaman penuh/ref/elemen Playwright. Tanpa Playwright atau chrome-mcp,
  tangkapan layar berlabel tidak tersedia.
- `--urls` menambahkan tujuan tautan yang ditemukan ke snapshot AI.

## Snapshot dan ref

OpenClaw mendukung dua gaya "snapshot":

- **Snapshot AI (ref numerik)**: `openclaw browser snapshot` (default; `--format ai`)
  - Output: snapshot teks yang menyertakan ref numerik.
  - Tindakan: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Secara internal, ref diselesaikan melalui `aria-ref` milik Playwright.

- **Snapshot peran (ref peran seperti `e12`)**: `openclaw browser snapshot --interactive` (atau `--compact`, `--depth`, `--selector`, `--frame`)
  - Output: daftar/pohon berbasis peran dengan `[ref=e12]` (dan `[nth=1]` opsional).
  - Tindakan: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Secara internal, ref diselesaikan melalui `getByRole(...)` (ditambah `nth()` untuk duplikat).
  - Tambahkan `--labels` untuk menyertakan tangkapan layar dengan label `e12` yang ditumpangkan. Pada
    profil berbasis Playwright, ini juga mengembalikan metadata kotak pembatas per ref
    (`annotations[]`).
  - Tambahkan `--urls` ketika teks tautan ambigu dan agen memerlukan target
    navigasi yang konkret.

- **Snapshot ARIA (ref ARIA seperti `ax12`)**: `openclaw browser snapshot --format aria`
  - Output: pohon aksesibilitas sebagai node terstruktur.
  - Tindakan: `openclaw browser click ax12` berfungsi ketika jalur snapshot dapat mengikat
    ref melalui Playwright dan ID DOM backend Chrome.
- Jika Playwright tidak tersedia, snapshot ARIA masih dapat berguna untuk
  pemeriksaan, tetapi ref mungkin tidak dapat ditindaklanjuti. Ambil ulang snapshot dengan `--format ai`
  atau `--interactive` ketika Anda memerlukan ref tindakan.
- Bukti Docker untuk jalur fallback CDP mentah: `pnpm test:docker:browser-cdp-snapshot`
  memulai Chromium dengan CDP, menjalankan `browser doctor --deep`, dan memverifikasi bahwa snapshot peran
  menyertakan URL tautan, elemen yang dapat diklik karena kursor, dan metadata iframe.

Perilaku ref:

- Ref **tidak stabil lintas navigasi**; jika sesuatu gagal, jalankan kembali `snapshot` dan gunakan ref baru.
- `/act` mengembalikan `targetId` mentah saat ini setelah penggantian yang dipicu tindakan
  jika tab penggantinya dapat dibuktikan. Tetap gunakan ID/label tab yang stabil untuk
  perintah lanjutan.
- Jika snapshot peran diambil dengan `--frame`, ref peran dibatasi ke iframe tersebut hingga snapshot peran berikutnya.
- Ref `axN` yang tidak dikenal atau kedaluwarsa akan langsung gagal alih-alih diteruskan ke
  selektor `aria-ref` Playwright. Ambil snapshot baru pada tab yang sama ketika
  hal itu terjadi.

## Peningkatan kemampuan tunggu

Anda dapat menunggu lebih dari sekadar waktu/teks:

- Tunggu URL (glob didukung oleh Playwright):
  - `openclaw browser wait --url "**/dash"`
- Tunggu status pemuatan:
  - `openclaw browser wait --load networkidle`
  - Didukung pada `openclaw` terkelola dan profil CDP mentah/jarak jauh. Profil yang menggunakan driver `existing-session` (termasuk profil default `user`) menolak `networkidle`; gunakan penantian `--url`, `--text`, selektor, atau `--fn` di sana.
- Tunggu predikat JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Tunggu hingga selektor terlihat:
  - `openclaw browser wait "#main"`

Semua ini dapat digabungkan:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Alur kerja debug

Ketika suatu tindakan gagal (misalnya, "tidak terlihat", "pelanggaran mode ketat", "tertutup"):

1. `openclaw browser snapshot --interactive`
2. Gunakan `click <ref>` / `type <ref>` (utamakan ref peran dalam mode interaktif)
3. Jika masih gagal: `openclaw browser highlight <ref>` untuk melihat target Playwright
4. Jika halaman berperilaku aneh:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Untuk debug mendalam, rekam trace:
   - `openclaw browser trace start`
   - reproduksi masalah
   - `openclaw browser trace stop` (mencetak `TRACE:<path>`)

## Output JSON

`--json` ditujukan untuk pembuatan skrip dan alat terstruktur.

Contoh:

```bash
openclaw browser --json status
openclaw browser --json snapshot --interactive
openclaw browser --json requests --filter api
openclaw browser --json cookies
```

Snapshot peran dalam JSON menyertakan `refs` beserta blok kecil `stats` (baris/karakter/ref/interaktif) agar alat dapat mempertimbangkan ukuran dan kepadatan payload.

## Pengaturan status dan lingkungan

Ini berguna untuk alur kerja "buat situs berperilaku seperti X":

- Cookie: `cookies`, `cookies set`, `cookies clear`
- Penyimpanan: `storage local|session get|set|clear`
- Luring: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (atau bentuk posisional `set headers '{"X-Debug":"1"}'`)
- Autentikasi dasar HTTP: `set credentials user pass` (atau `--clear`)
- Geolokasi: `set geo <lat> <lon> --origin "https://example.com"` (atau `--clear`)
- Media: `set media dark|light|no-preference|none`
- Zona waktu / lokal: `set timezone ...`, `set locale ...`
- Perangkat / viewport:
  - `set device "iPhone 14"` (preset perangkat Playwright)
  - `set viewport 1280 720`

## Keamanan dan privasi

- Profil browser openclaw mungkin berisi sesi yang telah masuk; perlakukan sebagai data sensitif.
- `browser act kind=evaluate` / `openclaw browser evaluate` dan `wait --fn`
  mengeksekusi JavaScript arbitrer dalam konteks halaman. Injeksi prompt dapat
  mengarahkannya. Nonaktifkan dengan `browser.evaluateEnabled=false` jika tidak diperlukan.
- `openclaw browser evaluate --fn` menerima sumber fungsi, ekspresi, atau
  isi pernyataan. Isi pernyataan dibungkus sebagai fungsi asinkron, jadi gunakan
  `return` untuk nilai yang ingin dikembalikan. Gunakan `--timeout-ms <ms>` ketika
  fungsi di sisi halaman mungkin memerlukan waktu lebih lama daripada batas waktu evaluasi default.
- Untuk catatan login dan anti-bot (X/Twitter, dan sebagainya), lihat [Login browser + memposting ke X/Twitter](/id/tools/browser-login).
- Jaga host Gateway/node tetap privat (hanya loopback atau tailnet).
- Endpoint CDP jarak jauh sangat kuat; gunakan tunnel dan lindungi endpoint tersebut.

Contoh mode ketat (blokir tujuan privat/internal secara default):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // izin eksak opsional
    },
  },
}
```

## Terkait

- [Browser](/id/tools/browser) - ikhtisar, konfigurasi, profil, keamanan
- [Login browser](/id/tools/browser-login) - masuk ke situs
- [Pemecahan masalah Browser di Linux](/id/tools/browser-linux-troubleshooting)
- [Pemecahan masalah Browser WSL2](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
