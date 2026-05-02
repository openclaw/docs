---
read_when:
    - Membuat skrip atau men-debug browser agen melalui API kontrol lokal
    - Mencari referensi CLI `openclaw browser`
    - Menambahkan otomatisasi peramban khusus dengan cuplikan dan referensi
summary: API kontrol peramban OpenClaw, referensi CLI, dan aksi skrip
title: API kontrol peramban
x-i18n:
    generated_at: "2026-05-02T09:33:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef996319c09bfa8de9b5c3a340c68496ac3698295b62f4f07c79f3e233eda2a2
    source_path: tools/browser-control.md
    workflow: 16
---

Untuk penyiapan, konfigurasi, dan pemecahan masalah, lihat [Browser](/id/tools/browser).
Halaman ini adalah referensi untuk API HTTP kontrol lokal, CLI `openclaw browser`, dan pola scripting (snapshot, ref, penantian, alur debug).

## API Kontrol (opsional)

Hanya untuk integrasi lokal, Gateway mengekspos API HTTP loopback kecil:

- Status/mulai/hentikan: `GET /`, `POST /start`, `POST /stop`
- Tab: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/tangkapan layar: `GET /snapshot`, `POST /screenshot`
- Tindakan: `POST /navigate`, `POST /act`
- Hook: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Unduhan: `POST /download`, `POST /wait/download`
- Izin: `POST /permissions/grant`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Jaringan: `POST /response/body`
- Status: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Status: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Pengaturan: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Semua endpoint menerima `?profile=<name>`. `POST /start?headless=true` meminta peluncuran headless sekali jalan untuk profil terkelola lokal tanpa mengubah konfigurasi browser yang dipersistenkan; profil attach-only, CDP jarak jauh, dan sesi yang sudah ada menolak override tersebut karena OpenClaw tidak meluncurkan proses browser itu.

Jika autentikasi gateway dengan shared-secret dikonfigurasi, rute HTTP browser juga memerlukan autentikasi:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` atau autentikasi HTTP Basic dengan kata sandi tersebut

Catatan:

- API browser loopback mandiri ini **tidak** memakai header identitas trusted-proxy atau Tailscale Serve.
- Jika `gateway.auth.mode` adalah `none` atau `trusted-proxy`, rute browser loopback ini tidak mewarisi mode yang membawa identitas tersebut; tetap batasi pada loopback.

### Kontrak error `/act`

`POST /act` menggunakan respons error terstruktur untuk validasi tingkat rute dan kegagalan kebijakan:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Nilai `code` saat ini:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` hilang atau tidak dikenali.
- `ACT_INVALID_REQUEST` (HTTP 400): payload tindakan gagal dinormalisasi atau divalidasi.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` digunakan dengan jenis tindakan yang tidak didukung.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (atau `wait --fn`) dinonaktifkan oleh konfigurasi.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` tingkat atas atau batch berkonflik dengan target permintaan.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): tindakan tidak didukung untuk profil sesi yang sudah ada.

Kegagalan runtime lain mungkin tetap mengembalikan `{ "error": "<message>" }` tanpa field `code`.

### Persyaratan Playwright

Beberapa fitur (navigate/act/snapshot AI/snapshot role, tangkapan layar elemen, PDF) memerlukan Playwright. Jika Playwright belum terinstal, endpoint tersebut mengembalikan error 501 yang jelas.

Yang tetap berfungsi tanpa Playwright:

- Snapshot ARIA
- Snapshot aksesibilitas bergaya role (`--interactive`, `--compact`, `--depth`, `--efficient`) saat WebSocket CDP per tab tersedia. Ini adalah fallback untuk inspeksi dan penemuan ref; Playwright tetap menjadi engine tindakan utama.
- Tangkapan layar halaman untuk browser `openclaw` terkelola saat WebSocket CDP per tab tersedia
- Tangkapan layar halaman untuk profil `existing-session` / Chrome MCP
- Tangkapan layar berbasis ref `existing-session` (`--ref`) dari output snapshot

Yang tetap memerlukan Playwright:

- `navigate`
- `act`
- Snapshot AI yang bergantung pada format snapshot AI native Playwright
- Tangkapan layar elemen dengan CSS-selector (`--element`)
- ekspor PDF browser penuh

Tangkapan layar elemen juga menolak `--full-page`; rute mengembalikan `fullPage is not supported for element screenshots`.

Jika Anda melihat `Playwright is not available in this gateway build`, Gateway yang dipaketkan kehilangan dependensi runtime browser inti. Instal ulang atau perbarui OpenClaw, lalu mulai ulang gateway. Untuk Docker, instal juga binary browser Chromium seperti ditunjukkan di bawah.

#### Instalasi Docker Playwright

Jika Gateway Anda berjalan di Docker, hindari `npx playwright` (konflik override npm). Gunakan CLI bawaan sebagai gantinya:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Untuk mempertahankan unduhan browser, atur `PLAYWRIGHT_BROWSERS_PATH` (misalnya, `/home/node/.cache/ms-playwright`) dan pastikan `/home/node` dipersistenkan melalui `OPENCLAW_HOME_VOLUME` atau bind mount. Lihat [Docker](/id/install/docker).

## Cara kerjanya (internal)

Server kontrol loopback kecil menerima permintaan HTTP dan terhubung ke browser berbasis Chromium melalui CDP. Tindakan lanjutan (click/type/snapshot/PDF) berjalan melalui Playwright di atas CDP; saat Playwright tidak ada, hanya operasi non-Playwright yang tersedia. Agen melihat satu antarmuka stabil sementara browser dan profil lokal/jarak jauh berganti bebas di bawahnya.

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

<Accordion title="Tindakan: navigate, click, type, drag, wait, evaluate">

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

<Accordion title="Status: cookie, penyimpanan, offline, header, geo, perangkat">

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

- `upload` dan `dialog` adalah panggilan **arming**; jalankan sebelum click/press yang memicu chooser/dialog.
- `click`/`type`/dll. memerlukan `ref` dari `snapshot` (numerik `12`, ref role `e12`, atau ref ARIA yang dapat ditindaklanjuti `ax12`). CSS selector sengaja tidak didukung untuk tindakan. Gunakan `click-coords` saat posisi viewport yang terlihat adalah satu-satunya target yang andal.
- Jalur download, trace, dan upload dibatasi ke root temp OpenClaw: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` juga dapat mengatur input file secara langsung melalui `--input-ref` atau `--element`.

Id tab stabil dan label bertahan dari penggantian raw-target Chromium saat OpenClaw dapat membuktikan tab penggantinya, seperti URL yang sama atau satu tab lama menjadi satu tab baru setelah pengiriman formulir. Id target mentah tetap volatil; pilih `suggestedTargetId` dari `tabs` dalam script.

Sekilas flag snapshot:

- `--format ai` (default dengan Playwright): snapshot AI dengan ref numerik (`aria-ref="<n>"`).
- `--format aria`: pohon aksesibilitas dengan ref `axN`. Saat Playwright tersedia, OpenClaw mengikat ref dengan id DOM backend ke halaman live sehingga tindakan lanjutan dapat menggunakannya; jika tidak, perlakukan output hanya untuk inspeksi.
- `--efficient` (atau `--mode efficient`): preset snapshot role ringkas. Atur `browser.snapshotDefaults.mode: "efficient"` untuk menjadikannya default (lihat [konfigurasi Gateway](/id/gateway/configuration-reference#browser)).
- `--interactive`, `--compact`, `--depth`, `--selector` memaksa snapshot role dengan ref `ref=e12`. `--frame "<iframe>"` membatasi snapshot role ke iframe.
- `--labels` menambahkan tangkapan layar khusus viewport dengan label ref yang ditumpangkan (mencetak `MEDIA:<path>`).
- `--urls` menambahkan tujuan tautan yang ditemukan ke snapshot AI.

## Snapshot dan ref

OpenClaw mendukung dua gaya “snapshot”:

- **Snapshot AI (ref numerik)**: `openclaw browser snapshot` (default; `--format ai`)
  - Output: snapshot teks yang menyertakan ref numerik.
  - Tindakan: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Secara internal, ref diselesaikan melalui `aria-ref` milik Playwright.

- **Snapshot role (ref role seperti `e12`)**: `openclaw browser snapshot --interactive` (atau `--compact`, `--depth`, `--selector`, `--frame`)
  - Output: daftar/pohon berbasis role dengan `[ref=e12]` (dan opsional `[nth=1]`).
  - Tindakan: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Secara internal, ref diselesaikan melalui `getByRole(...)` (ditambah `nth()` untuk duplikat).
  - Tambahkan `--labels` untuk menyertakan tangkapan layar viewport dengan label `e12` yang ditumpangkan.
  - Tambahkan `--urls` saat teks tautan ambigu dan agen membutuhkan target navigasi yang konkret.

- **Snapshot ARIA (ref ARIA seperti `ax12`)**: `openclaw browser snapshot --format aria`
  - Output: pohon aksesibilitas sebagai node terstruktur.
  - Tindakan: `openclaw browser click ax12` berfungsi saat jalur snapshot dapat mengikat ref melalui Playwright dan id DOM backend Chrome.
- Jika Playwright tidak tersedia, snapshot ARIA tetap bisa berguna untuk inspeksi, tetapi ref mungkin tidak dapat ditindaklanjuti. Buat snapshot ulang dengan `--format ai` atau `--interactive` saat Anda membutuhkan ref tindakan.
- Bukti Docker untuk jalur fallback raw-CDP: `pnpm test:docker:browser-cdp-snapshot` memulai Chromium dengan CDP, menjalankan `browser doctor --deep`, dan memverifikasi snapshot role menyertakan URL tautan, elemen dapat diklik yang dipromosikan kursor, dan metadata iframe.

Perilaku ref:

- Ref **tidak stabil di seluruh navigasi**; jika sesuatu gagal, jalankan ulang `snapshot` dan gunakan ref baru.
- `/act` mengembalikan `targetId` mentah saat ini setelah penggantian yang dipicu tindakan
  ketika dapat membuktikan tab pengganti. Tetap gunakan id/label tab yang stabil untuk
  perintah lanjutan.
- Jika snapshot peran diambil dengan `--frame`, ref peran dibatasi ke iframe tersebut sampai snapshot peran berikutnya.
- Ref `axN` yang tidak dikenal atau usang gagal cepat alih-alih diteruskan ke
  selektor `aria-ref` milik Playwright. Jalankan snapshot baru pada tab yang sama saat
  itu terjadi.

## Peningkatan wait

Anda dapat menunggu lebih dari sekadar waktu/teks:

- Tunggu URL (glob didukung oleh Playwright):
  - `openclaw browser wait --url "**/dash"`
- Tunggu status muat:
  - `openclaw browser wait --load networkidle`
- Tunggu predikat JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Tunggu selektor menjadi terlihat:
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

Ketika tindakan gagal (mis. “tidak terlihat”, “pelanggaran strict mode”, “tertutup”):

1. `openclaw browser snapshot --interactive`
2. Gunakan `click <ref>` / `type <ref>` (utamakan ref peran dalam mode interaktif)
3. Jika masih gagal: `openclaw browser highlight <ref>` untuk melihat apa yang ditargetkan Playwright
4. Jika halaman berperilaku aneh:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Untuk debug mendalam: rekam trace:
   - `openclaw browser trace start`
   - reproduksi masalahnya
   - `openclaw browser trace stop` (mencetak `TRACE:<path>`)

## Output JSON

`--json` ditujukan untuk skrip dan tooling terstruktur.

Contoh:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Snapshot peran dalam JSON menyertakan `refs` plus blok `stats` kecil (baris/karakter/ref/interaktif) agar alat dapat menalar ukuran dan kepadatan payload.

## Kenop status dan lingkungan

Ini berguna untuk alur kerja “buat situs berperilaku seperti X”:

- Cookie: `cookies`, `cookies set`, `cookies clear`
- Penyimpanan: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Header: `set headers --headers-json '{"X-Debug":"1"}'` (warisan `set headers --json '{"X-Debug":"1"}'` tetap didukung)
- Autentikasi dasar HTTP: `set credentials user pass` (atau `--clear`)
- Geolokasi: `set geo <lat> <lon> --origin "https://example.com"` (atau `--clear`)
- Media: `set media dark|light|no-preference|none`
- Zona waktu / lokal: `set timezone ...`, `set locale ...`
- Perangkat / viewport:
  - `set device "iPhone 14"` (preset perangkat Playwright)
  - `set viewport 1280 720`

## Keamanan dan privasi

- Profil browser openclaw mungkin berisi sesi yang sudah login; perlakukan sebagai sensitif.
- `browser act kind=evaluate` / `openclaw browser evaluate` dan `wait --fn`
  menjalankan JavaScript arbitrer dalam konteks halaman. Prompt injection dapat mengarahkan
  ini. Nonaktifkan dengan `browser.evaluateEnabled=false` jika Anda tidak membutuhkannya.
- Untuk login dan catatan anti-bot (X/Twitter, dll.), lihat [Login browser + posting X/Twitter](/id/tools/browser-login).
- Jaga host Gateway/node tetap privat (loopback atau hanya tailnet).
- Endpoint CDP jarak jauh sangat kuat; buat tunnel dan lindungi endpoint tersebut.

Contoh strict-mode (blokir tujuan privat/internal secara default):

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
- [Login browser](/id/tools/browser-login) — masuk ke situs
- [Pemecahan masalah Browser Linux](/id/tools/browser-linux-troubleshooting)
- [Pemecahan masalah Browser WSL2](/id/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
