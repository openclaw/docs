---
read_when:
    - Melakukan scripting atau debugging browser agen melalui API kontrol lokal
    - Mencari referensi CLI `openclaw browser`
    - Menambahkan otomasi browser kustom dengan snapshot dan ref
summary: API kontrol browser OpenClaw, referensi CLI, dan aksi scripting
title: API kontrol browser
x-i18n:
    generated_at: "2026-04-26T11:39:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: bdaaff3d218aeee4c9a01478b3a3380b813ad4578d7eb74120e0745c87af66f6
    source_path: tools/browser-control.md
    workflow: 15
---

Untuk penyiapan, konfigurasi, dan pemecahan masalah, lihat [Browser](/id/tools/browser).
Halaman ini adalah referensi untuk API HTTP kontrol lokal, CLI `openclaw browser`,
dan pola scripting (snapshot, ref, wait, alur debug).

## API kontrol (opsional)

Hanya untuk integrasi lokal, Gateway mengekspos API HTTP loopback kecil:

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Tab: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Aksi: `POST /navigate`, `POST /act`
- Hook: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Unduhan: `POST /download`, `POST /wait/download`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Jaringan: `POST /response/body`
- Status: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Status: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Pengaturan: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Semua endpoint menerima `?profile=<name>`. `POST /start?headless=true` meminta
peluncuran headless sekali pakai untuk profil terkelola lokal tanpa mengubah
konfigurasi browser yang tersimpan; profil attach-only, CDP jarak jauh, dan profil sesi yang sudah ada menolak
override itu karena OpenClaw tidak meluncurkan proses browser tersebut.

Jika autentikasi Gateway dengan secret bersama dikonfigurasi, rute HTTP browser juga memerlukan autentikasi:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` atau HTTP Basic auth dengan password tersebut

Catatan:

- API browser loopback mandiri ini **tidak** menggunakan trusted-proxy atau
  header identitas Tailscale Serve.
- Jika `gateway.auth.mode` adalah `none` atau `trusted-proxy`, rute browser loopback ini
  tidak mewarisi mode pembawa identitas tersebut; pertahankan hanya loopback.

### Kontrak error `/act`

`POST /act` menggunakan respons error terstruktur untuk validasi tingkat rute dan
kegagalan kebijakan:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Nilai `code` saat ini:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` tidak ada atau tidak dikenali.
- `ACT_INVALID_REQUEST` (HTTP 400): payload aksi gagal dinormalisasi atau divalidasi.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` digunakan dengan jenis aksi yang tidak didukung.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (atau `wait --fn`) dinonaktifkan oleh konfigurasi.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` tingkat atas atau batch bertentangan dengan target permintaan.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): aksi tidak didukung untuk profil sesi yang sudah ada.

Kegagalan runtime lainnya mungkin tetap mengembalikan `{ "error": "<message>" }` tanpa
field `code`.

### Persyaratan Playwright

Beberapa fitur (navigate/act/AI snapshot/role snapshot, screenshot elemen,
PDF) memerlukan Playwright. Jika Playwright tidak terpasang, endpoint tersebut mengembalikan
error 501 yang jelas.

Yang masih berfungsi tanpa Playwright:

- Snapshot ARIA
- Snapshot aksesibilitas bergaya role (`--interactive`, `--compact`,
  `--depth`, `--efficient`) saat WebSocket CDP per tab tersedia. Ini adalah
  fallback untuk inspeksi dan penemuan ref; Playwright tetap mesin aksi utama.
- Screenshot halaman untuk browser `openclaw` terkelola saat CDP WebSocket per tab
  tersedia
- Screenshot halaman untuk profil `existing-session` / Chrome MCP
- Screenshot berbasis ref `existing-session` (`--ref`) dari output snapshot

Yang masih memerlukan Playwright:

- `navigate`
- `act`
- Snapshot AI yang bergantung pada format snapshot AI native Playwright
- Screenshot elemen selector CSS (`--element`)
- ekspor PDF browser penuh

Screenshot elemen juga menolak `--full-page`; rute mengembalikan `fullPage is
not supported for element screenshots`.

Jika Anda melihat `Playwright is not available in this gateway build`, perbaiki
dependensi runtime plugin browser bawaan agar `playwright-core` terpasang,
lalu mulai ulang gateway. Untuk instalasi terpaket, jalankan `openclaw doctor --fix`.
Untuk Docker, pasang juga binary browser Chromium seperti ditunjukkan di bawah.

#### Instalasi Playwright Docker

Jika Gateway Anda berjalan di Docker, hindari `npx playwright` (konflik override npm).
Gunakan CLI bawaan sebagai gantinya:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Untuk mempertahankan unduhan browser, setel `PLAYWRIGHT_BROWSERS_PATH` (misalnya,
`/home/node/.cache/ms-playwright`) dan pastikan `/home/node` dipertahankan melalui
`OPENCLAW_HOME_VOLUME` atau bind mount. Lihat [Docker](/id/install/docker).

## Cara kerjanya (internal)

Server kontrol loopback kecil menerima permintaan HTTP dan terhubung ke browser berbasis Chromium melalui CDP. Aksi lanjutan (click/type/snapshot/PDF) berjalan melalui Playwright di atas CDP; saat Playwright tidak tersedia, hanya operasi non-Playwright yang tersedia. Agen melihat satu antarmuka stabil sementara browser dan profil lokal/jarak jauh dapat ditukar bebas di bawahnya.

## Referensi cepat CLI

Semua perintah menerima `--browser-profile <name>` untuk menargetkan profil tertentu, dan `--json` untuk output yang dapat dibaca mesin.

<AccordionGroup>

<Accordion title="Dasar: status, tab, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # peluncuran headless lokal terkelola sekali pakai
openclaw browser stop            # juga menghapus emulasi pada attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut untuk tab saat ini
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspeksi: screenshot, snapshot, console, errors, requests">

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
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Aksi: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # atau e12 untuk ref role
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
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="Status: cookies, storage, offline, headers, geo, device">

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

- `upload` dan `dialog` adalah panggilan **arming**; jalankan sebelum click/press yang memicu pemilih file/dialog.
- `click`/`type`/dll memerlukan `ref` dari `snapshot` (numerik `12`, ref role `e12`, atau ref ARIA yang dapat ditindaklanjuti `ax12`). Selector CSS sengaja tidak didukung untuk aksi. Gunakan `click-coords` saat posisi viewport yang terlihat adalah satu-satunya target yang andal.
- Path unduhan, trace, dan upload dibatasi ke root temp OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` juga dapat mengatur input file secara langsung melalui `--input-ref` atau `--element`.

ID tab dan label stabil tetap bertahan saat penggantian raw-target Chromium ketika OpenClaw
dapat membuktikan tab pengganti, seperti URL yang sama atau satu tab lama menjadi
satu tab baru setelah pengiriman formulir. ID target mentah tetap volatil; pilih
`suggestedTargetId` dari `tabs` dalam script.

Ringkasan flag snapshot:

- `--format ai` (default dengan Playwright): snapshot AI dengan ref numerik (`aria-ref="<n>"`).
- `--format aria`: pohon aksesibilitas dengan ref `axN`. Saat Playwright tersedia, OpenClaw mengikat ref dengan backend DOM id ke halaman aktif sehingga aksi lanjutan dapat menggunakannya; jika tidak, perlakukan output hanya untuk inspeksi.
- `--efficient` (atau `--mode efficient`): preset snapshot role yang ringkas. Setel `browser.snapshotDefaults.mode: "efficient"` untuk menjadikannya default (lihat [Konfigurasi Gateway](/id/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` memaksa snapshot role dengan ref `ref=e12`. `--frame "<iframe>"` membatasi snapshot role ke iframe.
- `--labels` menambahkan screenshot hanya-viewport dengan label ref overlay (mencetak `MEDIA:<path>`).
- `--urls` menambahkan tujuan tautan yang ditemukan ke snapshot AI.

## Snapshot dan ref

OpenClaw mendukung dua gaya “snapshot”:

- **Snapshot AI (ref numerik)**: `openclaw browser snapshot` (default; `--format ai`)
  - Output: snapshot teks yang menyertakan ref numerik.
  - Aksi: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Secara internal, ref diresolusikan melalui `aria-ref` Playwright.

- **Snapshot role (ref role seperti `e12`)**: `openclaw browser snapshot --interactive` (atau `--compact`, `--depth`, `--selector`, `--frame`)
  - Output: daftar/pohon berbasis role dengan `[ref=e12]` (dan opsional `[nth=1]`).
  - Aksi: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Secara internal, ref diresolusikan melalui `getByRole(...)` (ditambah `nth()` untuk duplikat).
  - Tambahkan `--labels` untuk menyertakan screenshot viewport dengan label `e12` overlay.
  - Tambahkan `--urls` saat teks tautan ambigu dan agen memerlukan
    target navigasi yang konkret.

- **Snapshot ARIA (ref ARIA seperti `ax12`)**: `openclaw browser snapshot --format aria`
  - Output: pohon aksesibilitas sebagai node terstruktur.
  - Aksi: `openclaw browser click ax12` berfungsi saat path snapshot dapat mengikat
    ref melalui Playwright dan Chrome backend DOM id.
- Jika Playwright tidak tersedia, snapshot ARIA tetap dapat berguna untuk
  inspeksi, tetapi ref mungkin tidak dapat ditindaklanjuti. Ambil snapshot ulang dengan `--format ai`
  atau `--interactive` saat Anda memerlukan ref aksi.
- Bukti Docker untuk path fallback raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  memulai Chromium dengan CDP, menjalankan `browser doctor --deep`, dan memverifikasi snapshot
  role menyertakan URL tautan, clickable yang dipromosikan kursor, dan metadata iframe.

Perilaku ref:

- Ref **tidak stabil antar navigasi**; jika sesuatu gagal, jalankan ulang `snapshot` dan gunakan ref baru.
- `/act` mengembalikan `targetId` mentah saat ini setelah penggantian yang dipicu aksi
  ketika dapat membuktikan tab pengganti. Tetap gunakan ID/label tab stabil untuk
  perintah lanjutan.
- Jika snapshot role diambil dengan `--frame`, ref role dibatasi ke iframe tersebut sampai snapshot role berikutnya.
- Ref `axN` yang tidak dikenal atau usang gagal cepat alih-alih diteruskan ke
  selector `aria-ref` milik Playwright. Jalankan snapshot baru pada tab yang sama ketika
  itu terjadi.

## Peningkatan wait

Anda dapat menunggu lebih dari sekadar waktu/teks:

- Tunggu URL (glob didukung oleh Playwright):
  - `openclaw browser wait --url "**/dash"`
- Tunggu status load:
  - `openclaw browser wait --load networkidle`
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

Saat sebuah aksi gagal (misalnya “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Gunakan `click <ref>` / `type <ref>` (utamakan ref role dalam mode interaktif)
3. Jika masih gagal: `openclaw browser highlight <ref>` untuk melihat apa yang ditargetkan Playwright
4. Jika halaman berperilaku aneh:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Untuk debugging mendalam: rekam trace:
   - `openclaw browser trace start`
   - reproduksi masalahnya
   - `openclaw browser trace stop` (mencetak `TRACE:<path>`)

## Output JSON

`--json` digunakan untuk scripting dan alat terstruktur.

Contoh:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Snapshot role dalam JSON menyertakan `refs` ditambah blok `stats` kecil (lines/chars/refs/interactive) sehingga alat dapat memahami ukuran dan kepadatan payload.

## Knob status dan lingkungan

Ini berguna untuk alur kerja “buat situs berperilaku seperti X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (versi lama `set headers --json '{"X-Debug":"1"}'` tetap didukung)
- HTTP basic auth: `set credentials user pass` (atau `--clear`)
- Geolokasi: `set geo <lat> <lon> --origin "https://example.com"` (atau `--clear`)
- Media: `set media dark|light|no-preference|none`
- Zona waktu / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (preset device Playwright)
  - `set viewport 1280 720`

## Keamanan dan privasi

- Profil browser openclaw mungkin berisi sesi yang sudah login; perlakukan sebagai hal yang sensitif.
- `browser act kind=evaluate` / `openclaw browser evaluate` dan `wait --fn`
  menjalankan JavaScript arbitrer dalam konteks halaman. Prompt injection dapat
  mengarahkan ini. Nonaktifkan dengan `browser.evaluateEnabled=false` jika Anda tidak membutuhkannya.
- Untuk login dan catatan anti-bot (X/Twitter, dll.), lihat [Browser login + posting X/Twitter](/id/tools/browser-login).
- Jaga host Gateway/node tetap privat (hanya loopback atau tailnet).
- Endpoint CDP jarak jauh sangat kuat; tunneling dan lindungi mereka.

Contoh mode ketat (blok tujuan privat/internal secara default):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // izin exact opsional
    },
  },
}
```

## Terkait

- [Browser](/id/tools/browser) — ikhtisar, konfigurasi, profil, keamanan
- [Browser login](/id/tools/browser-login) — masuk ke situs
- [Pemecahan masalah Browser Linux](/id/tools/browser-linux-troubleshooting)
- [Pemecahan masalah Browser WSL2](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
