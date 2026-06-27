---
read_when:
    - Pembuatan skrip atau debugging browser agen melalui API kontrol lokal
    - Mencari referensi CLI `openclaw browser`
    - Menambahkan otomatisasi browser kustom dengan snapshot dan ref
summary: API kontrol browser OpenClaw, referensi CLI, dan tindakan scripting
title: API kontrol peramban
x-i18n:
    generated_at: "2026-06-27T18:15:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ccfd1ec996b0fc211e2aefa0554e0fa5c7b0899ca981836134a3741b38bf7600
    source_path: tools/browser-control.md
    workflow: 16
---

Untuk penyiapan, konfigurasi, dan pemecahan masalah, lihat [Peramban](/id/tools/browser).
Halaman ini adalah referensi untuk API HTTP kontrol lokal, CLI `openclaw browser`,
dan pola skrip (snapshot, ref, penantian, alur debug).

## API Kontrol (opsional)

Hanya untuk integrasi lokal, Gateway mengekspos API HTTP loopback kecil.
Server mandiri ini bersifat opsional — atur variabel lingkungan
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` di lingkungan layanan gateway
dan mulai ulang gateway sebelum endpoint HTTP tersedia. Tanpa
variabel ini, runtime kontrol peramban tetap bekerja melalui CLI dan
alat agen, tetapi tidak ada yang mendengarkan pada port kontrol loopback.

- Status/mulai/berhenti: `GET /`, `POST /start`, `POST /stop`
- Tab: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/tangkapan layar: `GET /snapshot`, `POST /screenshot`
- Tindakan: `POST /navigate`, `POST /act`
- Hook: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Unduhan: `POST /download`, `POST /wait/download`
- Izin: `POST /permissions/grant`
- Debug: `GET /console`, `POST /pdf`
- Debug: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Jaringan: `POST /response/body`
- Status: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Status: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Pengaturan: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Semua endpoint menerima `?profile=<name>`. `POST /start?headless=true` meminta
peluncuran headless satu kali untuk profil lokal terkelola tanpa mengubah
konfigurasi peramban yang dipersistenkan; profil attach-only, CDP jarak jauh,
dan existing-session menolak override itu karena OpenClaw tidak meluncurkan
proses peramban tersebut.

Untuk endpoint tab, `targetId` adalah nama bidang kompatibilitas. Utamakan
meneruskan `suggestedTargetId` dari `GET /tabs` atau `POST /tabs/open`; label
dan handle `tabId` seperti `t1` juga diterima. ID target CDP mentah dan prefiks
ID target mentah yang unik tetap berfungsi, tetapi itu adalah handle diagnostik
yang volatil.

Jika autentikasi gateway dengan rahasia bersama dikonfigurasi, rute HTTP peramban juga memerlukan autentikasi:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` atau autentikasi HTTP Basic dengan kata sandi tersebut

Catatan:

- API peramban loopback mandiri ini **tidak** memakai header identitas trusted-proxy atau
  Tailscale Serve.
- Jika `gateway.auth.mode` adalah `none` atau `trusted-proxy`, rute peramban loopback ini
  tidak mewarisi mode yang membawa identitas tersebut; pertahankan agar hanya loopback.

### Kontrak error `/act`

`POST /act` menggunakan respons error terstruktur untuk validasi tingkat rute dan
kegagalan kebijakan:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Nilai `code` saat ini:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` hilang atau tidak dikenali.
- `ACT_INVALID_REQUEST` (HTTP 400): payload tindakan gagal dinormalisasi atau divalidasi.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` digunakan dengan jenis tindakan yang tidak didukung.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (atau `wait --fn`) dinonaktifkan oleh konfigurasi.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` tingkat atas atau batch bertentangan dengan target permintaan.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): tindakan tidak didukung untuk profil existing-session.

Kegagalan runtime lain mungkin tetap mengembalikan `{ "error": "<message>" }` tanpa
bidang `code`.

### Persyaratan Playwright

Beberapa fitur (navigasi/tindakan/snapshot AI/snapshot peran, tangkapan layar elemen,
PDF) memerlukan Playwright. Jika Playwright tidak terpasang, endpoint tersebut mengembalikan
error 501 yang jelas.

Yang tetap berfungsi tanpa Playwright:

- Snapshot ARIA
- Snapshot aksesibilitas bergaya peran (`--interactive`, `--compact`,
  `--depth`, `--efficient`) saat WebSocket CDP per tab tersedia. Ini adalah
  fallback untuk inspeksi dan penemuan ref; Playwright tetap menjadi mesin
  tindakan utama.
- Tangkapan layar halaman untuk peramban `openclaw` terkelola saat WebSocket CDP
  per tab tersedia
- Tangkapan layar halaman untuk profil `existing-session` / Chrome MCP
- Tangkapan layar berbasis ref `existing-session` (`--ref`) dari output snapshot

Yang tetap membutuhkan Playwright:

- `navigate`
- `act`
- Snapshot AI yang bergantung pada format snapshot AI native Playwright
- Tangkapan layar elemen selector CSS (`--element`)
- ekspor PDF peramban penuh

Tangkapan layar elemen juga menolak `--full-page`; rute mengembalikan `fullPage is
not supported for element screenshots`.

Jika Anda melihat `Playwright is not available in this gateway build`, Gateway
terpaket kehilangan dependensi runtime peramban inti. Pasang ulang atau perbarui
OpenClaw, lalu mulai ulang gateway. Untuk Docker, pasang juga binari peramban
Chromium seperti ditunjukkan di bawah.

#### Instalasi Playwright Docker

Jika Gateway Anda berjalan di Docker, hindari `npx playwright` (konflik override npm).
Untuk image kustom, masukkan Chromium ke dalam image:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

Untuk image yang sudah ada, pasang melalui CLI bawaan sebagai gantinya:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Untuk mempertahankan unduhan peramban, atur `PLAYWRIGHT_BROWSERS_PATH` (misalnya,
`/home/node/.cache/ms-playwright`) dan pastikan `/home/node` dipersistenkan melalui
`OPENCLAW_HOME_VOLUME` atau bind mount. OpenClaw mendeteksi Chromium yang dipersistenkan
secara otomatis di Linux. Lihat [Docker](/id/install/docker).

## Cara kerjanya (internal)

Server kontrol loopback kecil menerima permintaan HTTP dan terhubung ke peramban berbasis Chromium melalui CDP. Tindakan lanjutan (klik/ketik/snapshot/PDF) berjalan melalui Playwright di atas CDP; saat Playwright tidak ada, hanya operasi non-Playwright yang tersedia. Agen melihat satu antarmuka stabil sementara peramban dan profil lokal/jarak jauh dapat ditukar bebas di bawahnya.

## Referensi cepat CLI

Semua perintah menerima `--browser-profile <name>` untuk menargetkan profil tertentu, dan `--json` untuk output yang dapat dibaca mesin.

<AccordionGroup>

<Accordion title="Dasar: status, tab, buka/fokus/tutup">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspeksi: tangkapan layar, snapshot, konsol, error, permintaan">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
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
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser click-coords 120 340        # viewport coordinates
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
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

<Accordion title="Status: cookie, storage, offline, header, geo, perangkat">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

Catatan:

- `upload` dan `dialog` adalah panggilan **arming**; jalankan keduanya sebelum klik/tekan yang memicu pemilih/dialog. Jika suatu tindakan membuka modal, respons tindakan menyertakan `blockedByDialog` dan `browserState.dialogs.pending`; teruskan `dialogId` tersebut untuk merespons langsung. Dialog yang ditangani di luar OpenClaw muncul di bawah `browserState.dialogs.recent`.
- `click`/`type`/dll. memerlukan `ref` dari `snapshot` (numerik `12`, ref peran `e12`, atau ref ARIA yang dapat ditindaklanjuti `ax12`). Selector CSS sengaja tidak didukung untuk tindakan. Gunakan `click-coords` saat posisi viewport yang terlihat adalah satu-satunya target yang andal.
- Jalur unduhan dan trace dibatasi ke root temp OpenClaw: `/tmp/openclaw{,/downloads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` menerima file dari root unggahan temp OpenClaw dan
  media masuk yang dikelola OpenClaw. Media masuk terkelola dapat dirujuk sebagai
  `media://inbound/<id>`, `media/inbound/<id>` yang relatif terhadap sandbox, atau jalur yang di-resolve
  di dalam direktori media masuk terkelola. Ref media bertingkat,
  traversal, symlink, hardlink, dan jalur lokal arbitrer tetap ditolak.
- `upload` juga dapat mengatur input file secara langsung melalui `--input-ref` atau `--element`.

ID dan label tab stabil tetap bertahan dari penggantian raw-target Chromium saat OpenClaw
dapat membuktikan tab penggantinya, seperti URL yang sama atau satu tab lama menjadi
satu tab baru setelah pengiriman formulir. ID target mentah tetap volatil; utamakan
`suggestedTargetId` dari `tabs` dalam skrip.

Sekilas flag snapshot:

- `--format ai` (bawaan dengan Playwright): snapshot AI dengan ref numerik (`aria-ref="<n>"`).
- `--format aria`: pohon aksesibilitas dengan ref `axN`. Saat Playwright tersedia, OpenClaw mengikat ref dengan ID DOM backend ke halaman live agar tindakan lanjutan dapat menggunakannya; jika tidak, perlakukan output sebagai hanya untuk inspeksi.
- `--efficient` (atau `--mode efficient`): preset snapshot peran ringkas. Atur `browser.snapshotDefaults.mode: "efficient"` untuk menjadikannya bawaan (lihat [konfigurasi Gateway](/id/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` memaksa snapshot peran dengan ref `ref=e12`. `--frame "<iframe>"` membatasi cakupan snapshot peran ke sebuah iframe.
- Dengan Playwright, `--labels` menambahkan screenshot dengan label ref yang ditumpangkan
  (mencetak `MEDIA:<path>`) plus array `annotations` dengan kotak pembatas
  setiap ref. Pada `screenshot`, label berbasis Playwright bekerja dengan `--full-page`,
  `--ref`, dan `--element`; pada `snapshot`, screenshot pendamping tetap
  hanya viewport. Profil existing-session/chrome-mcp merender label overlay pada
  screenshot halaman tetapi tidak mengembalikan `annotations` atau menggunakan helper proyeksi
  full-page/ref/element Playwright. Tanpa Playwright atau chrome-mcp,
  screenshot berlabel tidak tersedia.
- `--urls` menambahkan tujuan tautan yang ditemukan ke snapshot AI.

## Snapshot dan ref

OpenClaw mendukung dua gaya "snapshot":

- **Snapshot AI (ref numerik)**: `openclaw browser snapshot` (bawaan; `--format ai`)
  - Output: snapshot teks yang menyertakan ref numerik.
  - Tindakan: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Secara internal, ref diselesaikan melalui `aria-ref` Playwright.

- **Snapshot peran (ref peran seperti `e12`)**: `openclaw browser snapshot --interactive` (atau `--compact`, `--depth`, `--selector`, `--frame`)
  - Output: daftar/pohon berbasis peran dengan `[ref=e12]` (dan opsional `[nth=1]`).
  - Tindakan: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Secara internal, ref diselesaikan melalui `getByRole(...)` (plus `nth()` untuk duplikat).
  - Tambahkan `--labels` untuk menyertakan screenshot dengan label `e12` yang ditumpangkan. Pada
    profil berbasis Playwright, ini juga mengembalikan metadata kotak pembatas per ref
    (`annotations[]`).
  - Tambahkan `--urls` ketika teks tautan ambigu dan agen memerlukan target
    navigasi yang konkret.

- **Snapshot ARIA (ref ARIA seperti `ax12`)**: `openclaw browser snapshot --format aria`
  - Output: pohon aksesibilitas sebagai node terstruktur.
  - Tindakan: `openclaw browser click ax12` bekerja saat jalur snapshot dapat mengikat
    ref melalui Playwright dan ID DOM backend Chrome.
- Jika Playwright tidak tersedia, snapshot ARIA masih dapat berguna untuk
  inspeksi, tetapi ref mungkin tidak dapat ditindaklanjuti. Ambil snapshot ulang dengan `--format ai`
  atau `--interactive` saat Anda memerlukan ref tindakan.
- Bukti Docker untuk jalur fallback raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  memulai Chromium dengan CDP, menjalankan `browser doctor --deep`, dan memverifikasi snapshot peran
  menyertakan URL tautan, elemen dapat diklik yang dinaikkan dari kursor, dan metadata iframe.

Perilaku ref:

- Ref **tidak stabil di antara navigasi**; jika sesuatu gagal, jalankan ulang `snapshot` dan gunakan ref baru.
- `/act` mengembalikan `targetId` mentah saat ini setelah penggantian yang dipicu tindakan
  saat dapat membuktikan tab pengganti. Tetap gunakan ID/label tab stabil untuk
  perintah lanjutan.
- Jika snapshot peran diambil dengan `--frame`, ref peran dicakup ke iframe tersebut hingga snapshot peran berikutnya.
- Ref `axN` yang tidak dikenal atau usang gagal cepat alih-alih jatuh ke
  selector `aria-ref` Playwright. Jalankan snapshot baru pada tab yang sama saat
  itu terjadi.

## Peningkatan wait

Anda dapat menunggu lebih dari sekadar waktu/teks:

- Tunggu URL (glob didukung oleh Playwright):
  - `openclaw browser wait --url "**/dash"`
- Tunggu status muat:
  - `openclaw browser wait --load networkidle`
  - Didukung pada profil `openclaw` terkelola dan profil CDP raw/remote. Profil `user` dan `existing-session` menolak `networkidle`; gunakan wait `--url`, `--text`, selector, atau `--fn` di sana.
- Tunggu predikat JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Tunggu selector menjadi terlihat:
  - `openclaw browser wait "#main"`

Ini dapat digabungkan:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Alur kerja debug

Saat tindakan gagal (misalnya "not visible", "strict mode violation", "covered"):

1. `openclaw browser snapshot --interactive`
2. Gunakan `click <ref>` / `type <ref>` (utamakan ref peran dalam mode interaktif)
3. Jika masih gagal: `openclaw browser highlight <ref>` untuk melihat apa yang ditargetkan Playwright
4. Jika halaman berperilaku aneh:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Untuk debug mendalam: rekam trace:
   - `openclaw browser trace start`
   - reproduksi masalah
   - `openclaw browser trace stop` (mencetak `TRACE:<path>`)

## Output JSON

`--json` ditujukan untuk scripting dan tooling terstruktur.

Contoh:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Snapshot peran dalam JSON menyertakan `refs` plus blok `stats` kecil (lines/chars/refs/interactive) agar tool dapat menalar ukuran dan kepadatan payload.

## Kenop status dan lingkungan

Ini berguna untuk alur kerja "buat situs berperilaku seperti X":

- Cookie: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (legacy `set headers --json '{"X-Debug":"1"}'` tetap didukung)
- Autentikasi dasar HTTP: `set credentials user pass` (atau `--clear`)
- Geolokasi: `set geo <lat> <lon> --origin "https://example.com"` (atau `--clear`)
- Media: `set media dark|light|no-preference|none`
- Zona waktu / locale: `set timezone ...`, `set locale ...`
- Perangkat / viewport:
  - `set device "iPhone 14"` (preset perangkat Playwright)
  - `set viewport 1280 720`

## Keamanan dan privasi

- Profil browser openclaw dapat berisi sesi yang sudah login; perlakukan sebagai sensitif.
- `browser act kind=evaluate` / `openclaw browser evaluate` dan `wait --fn`
  mengeksekusi JavaScript arbitrer dalam konteks halaman. Prompt injection dapat mengarahkan
  ini. Nonaktifkan dengan `browser.evaluateEnabled=false` jika Anda tidak membutuhkannya.
- `openclaw browser evaluate --fn` menerima sumber fungsi, ekspresi, atau
  body statement. Body statement dibungkus sebagai fungsi async, jadi gunakan
  `return` untuk nilai yang ingin Anda dapatkan kembali. Gunakan `--timeout-ms <ms>` saat
  fungsi sisi halaman mungkin membutuhkan waktu lebih lama daripada timeout evaluate bawaan.
- Untuk catatan login dan anti-bot (X/Twitter, dll.), lihat [Login browser + posting X/Twitter](/id/tools/browser-login).
- Jaga host Gateway/node tetap privat (loopback atau khusus tailnet).
- Endpoint CDP remote sangat kuat; tunnel dan lindungi endpoint tersebut.

Contoh strict-mode (blokir tujuan privat/internal secara bawaan):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## Terkait

- [Browser](/id/tools/browser) - ikhtisar, konfigurasi, profil, keamanan
- [Login browser](/id/tools/browser-login) - masuk ke situs
- [Pemecahan masalah Browser Linux](/id/tools/browser-linux-troubleshooting)
- [Pemecahan masalah Browser WSL2](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
