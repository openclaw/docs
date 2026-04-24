---
read_when:
    - Melakukan scripting atau debugging browser agen melalui API kontrol lokal
    - Mencari referensi CLI `openclaw browser`
    - Menambahkan otomasi browser kustom dengan snapshot dan ref
summary: API kontrol browser OpenClaw, referensi CLI, dan tindakan scripting
title: API kontrol browser
x-i18n:
    generated_at: "2026-04-24T09:29:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: e29ad295085e2c36a6c2ce01366a4186e45a7ecfe1d3c3072353c55794b05b5f
    source_path: tools/browser-control.md
    workflow: 15
---

Untuk penyiapan, konfigurasi, dan pemecahan masalah, lihat [Browser](/id/tools/browser).
Halaman ini adalah referensi untuk API HTTP kontrol lokal, CLI `openclaw browser`,
dan pola scripting (snapshot, ref, wait, alur debug).

## API Kontrol (opsional)

Untuk integrasi lokal saja, Gateway mengekspos API HTTP loopback kecil:

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Tab: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Actions: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Unduhan: `POST /download`, `POST /wait/download`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Jaringan: `POST /response/body`
- State: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- State: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Pengaturan: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Semua endpoint menerima `?profile=<name>`.

Jika auth gateway shared-secret dikonfigurasi, rute HTTP browser juga memerlukan auth:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` atau HTTP Basic auth dengan kata sandi tersebut

Catatan:

- API browser loopback mandiri ini **tidak** mengonsumsi header identitas trusted-proxy atau Tailscale Serve.
- Jika `gateway.auth.mode` adalah `none` atau `trusted-proxy`, rute browser loopback ini tidak mewarisi mode pembawa identitas tersebut; pertahankan tetap khusus loopback.

### Kontrak galat `/act`

`POST /act` menggunakan respons galat terstruktur untuk validasi tingkat rute dan
kegagalan kebijakan:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Nilai `code` saat ini:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` hilang atau tidak dikenali.
- `ACT_INVALID_REQUEST` (HTTP 400): payload tindakan gagal normalisasi atau validasi.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` digunakan dengan jenis tindakan yang tidak didukung.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (atau `wait --fn`) dinonaktifkan oleh config.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` tingkat atas atau batched bertentangan dengan target permintaan.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): tindakan tidak didukung untuk profil existing-session.

Kegagalan runtime lain masih dapat mengembalikan `{ "error": "<message>" }` tanpa
field `code`.

### Kebutuhan Playwright

Beberapa fitur (navigate/act/AI snapshot/role snapshot, screenshot elemen,
PDF) memerlukan Playwright. Jika Playwright tidak terinstal, endpoint tersebut mengembalikan
galat 501 yang jelas.

Yang masih berfungsi tanpa Playwright:

- Snapshot ARIA
- Screenshot halaman untuk browser `openclaw` terkelola saat WebSocket CDP per-tab tersedia
- Screenshot halaman untuk profil `existing-session` / Chrome MCP
- Screenshot berbasis ref `existing-session` (`--ref`) dari output snapshot

Yang masih memerlukan Playwright:

- `navigate`
- `act`
- AI snapshot / role snapshot
- Screenshot elemen selector CSS (`--element`)
- Ekspor PDF browser penuh

Screenshot elemen juga menolak `--full-page`; rute mengembalikan `fullPage is
not supported for element screenshots`.

Jika Anda melihat `Playwright is not available in this gateway build`, perbaiki
dependensi runtime Plugin browser bawaan agar `playwright-core` terinstal,
lalu mulai ulang gateway. Untuk instalasi terpaket, jalankan `openclaw doctor --fix`.
Untuk Docker, instal juga biner browser Chromium seperti ditunjukkan di bawah.

#### Instalasi Docker Playwright

Jika Gateway Anda berjalan di Docker, hindari `npx playwright` (konflik override npm).
Gunakan CLI bawaan sebagai gantinya:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Untuk mempertahankan unduhan browser, setel `PLAYWRIGHT_BROWSERS_PATH` (misalnya,
`/home/node/.cache/ms-playwright`) dan pastikan `/home/node` dipersistenkan melalui
`OPENCLAW_HOME_VOLUME` atau bind mount. Lihat [Docker](/id/install/docker).

## Cara kerjanya (internal)

Server kontrol loopback kecil menerima permintaan HTTP dan terhubung ke browser berbasis Chromium melalui CDP. Tindakan lanjutan (click/type/snapshot/PDF) melalui Playwright di atas CDP; ketika Playwright tidak ada, hanya operasi non-Playwright yang tersedia. Agen melihat satu antarmuka stabil sementara browser dan profil lokal/remote dapat ditukar bebas di bawahnya.

## Referensi cepat CLI

Semua perintah menerima `--browser-profile <name>` untuk menargetkan profil tertentu, dan `--json` untuk output yang dapat dibaca mesin.

<AccordionGroup>

<Accordion title="Dasar: status, tab, buka/fokus/tutup">

```bash
openclaw browser status
openclaw browser start
openclaw browser stop            # juga membersihkan emulasi pada CDP attach-only/remote
openclaw browser tabs
openclaw browser tab             # singkatan untuk tab saat ini
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
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Tindakan: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # atau e12 untuk ref role
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

<Accordion title="State: cookies, storage, offline, headers, geo, device">

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

- `upload` dan `dialog` adalah panggilan **arming**; jalankan sebelum click/press yang memicu chooser/dialog.
- `click`/`type`/dll. memerlukan `ref` dari `snapshot` (numerik `12` atau ref role `e12`). Selector CSS sengaja tidak didukung untuk actions.
- Path download, trace, dan upload dibatasi ke root temp OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` juga dapat menyetel input file secara langsung melalui `--input-ref` atau `--element`.

Sekilas flag snapshot:

- `--format ai` (default dengan Playwright): AI snapshot dengan ref numerik (`aria-ref="<n>"`).
- `--format aria`: accessibility tree, tanpa ref; hanya untuk inspeksi.
- `--efficient` (atau `--mode efficient`): preset role snapshot ringkas. Setel `browser.snapshotDefaults.mode: "efficient"` agar ini menjadi default (lihat [Gateway configuration](/id/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` memaksa role snapshot dengan ref `ref=e12`. `--frame "<iframe>"` membatasi role snapshot ke sebuah iframe.
- `--labels` menambahkan screenshot khusus viewport dengan label ref yang dioverlay (mencetak `MEDIA:<path>`).

## Snapshot dan ref

OpenClaw mendukung dua gaya “snapshot”:

- **AI snapshot (ref numerik)**: `openclaw browser snapshot` (default; `--format ai`)
  - Output: snapshot teks yang menyertakan ref numerik.
  - Actions: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Secara internal, ref diresolusikan melalui `aria-ref` milik Playwright.

- **Role snapshot (ref role seperti `e12`)**: `openclaw browser snapshot --interactive` (atau `--compact`, `--depth`, `--selector`, `--frame`)
  - Output: daftar/pohon berbasis role dengan `[ref=e12]` (dan opsional `[nth=1]`).
  - Actions: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Secara internal, ref diresolusikan melalui `getByRole(...)` (ditambah `nth()` untuk duplikat).
  - Tambahkan `--labels` untuk menyertakan screenshot viewport dengan label `e12` dioverlay.

Perilaku ref:

- Ref **tidak stabil antar navigasi**; jika sesuatu gagal, jalankan ulang `snapshot` dan gunakan ref baru.
- Jika role snapshot diambil dengan `--frame`, ref role dibatasi ke iframe tersebut sampai role snapshot berikutnya.

## Power-up wait

Anda dapat menunggu lebih dari sekadar waktu/teks:

- Tunggu URL (glob didukung oleh Playwright):
  - `openclaw browser wait --url "**/dash"`
- Tunggu load state:
  - `openclaw browser wait --load networkidle`
- Tunggu predicate JS:
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

Saat suatu tindakan gagal (misalnya “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Gunakan `click <ref>` / `type <ref>` (pilih ref role dalam mode interaktif)
3. Jika masih gagal: `openclaw browser highlight <ref>` untuk melihat apa yang ditargetkan Playwright
4. Jika halaman berperilaku aneh:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Untuk debugging mendalam: rekam trace:
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

Role snapshot dalam JSON menyertakan `refs` plus blok `stats` kecil (lines/chars/refs/interactive) sehingga alat dapat menalar ukuran dan kepadatan payload.

## Knob state dan environment

Ini berguna untuk alur kerja “buat situs berperilaku seperti X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Penyimpanan: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (legacy `set headers --json '{"X-Debug":"1"}'` tetap didukung)
- HTTP basic auth: `set credentials user pass` (atau `--clear`)
- Geolokasi: `set geo <lat> <lon> --origin "https://example.com"` (atau `--clear`)
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (preset device Playwright)
  - `set viewport 1280 720`

## Keamanan dan privasi

- Profil browser openclaw dapat berisi sesi yang sudah login; perlakukan sebagai sensitif.
- `browser act kind=evaluate` / `openclaw browser evaluate` dan `wait --fn`
  mengeksekusi JavaScript sebarang di konteks halaman. Prompt injection dapat
  mengarahkan ini. Nonaktifkan dengan `browser.evaluateEnabled=false` jika Anda tidak membutuhkannya.
- Untuk login dan catatan anti-bot (X/Twitter, dll.), lihat [Browser login + X/Twitter posting](/id/tools/browser-login).
- Pertahankan host Gateway/Node tetap privat (hanya loopback atau tailnet).
- Endpoint CDP remote sangat kuat; tunnel dan lindungi endpoint tersebut.

Contoh mode strict (blokir tujuan privat/internal secara default):

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

- [Browser](/id/tools/browser) — ikhtisar, konfigurasi, profil, keamanan
- [Browser login](/id/tools/browser-login) — masuk ke situs
- [Browser Linux troubleshooting](/id/tools/browser-linux-troubleshooting)
- [Browser WSL2 troubleshooting](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
