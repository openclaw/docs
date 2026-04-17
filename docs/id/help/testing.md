---
read_when:
    - Menjalankan pengujian secara lokal atau di CI
    - Menambahkan regresi untuk bug model/provider
    - Men-debug perilaku gateway + agen
summary: 'Kit pengujian: suite unit/e2e/live, runner Docker, dan apa yang dicakup oleh setiap pengujian'
title: Pengujian
x-i18n:
    generated_at: "2026-04-17T09:14:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55483bc68d3b24daca3189fba3af1e896f39b8e83068d102fed06eac05b36102
    source_path: help/testing.md
    workflow: 15
---

# Pengujian

OpenClaw memiliki tiga suite Vitest (unit/integrasi, e2e, live) dan sejumlah kecil runner Docker.

Dokumen ini adalah panduan “cara kami menguji”:

- Apa yang dicakup oleh setiap suite (dan apa yang sengaja _tidak_ dicakup)
- Perintah mana yang dijalankan untuk alur kerja umum (lokal, sebelum push, debugging)
- Bagaimana pengujian live menemukan kredensial dan memilih model/provider
- Cara menambahkan regresi untuk masalah model/provider di dunia nyata

## Mulai cepat

Hampir setiap hari:

- Gate penuh (diharapkan sebelum push): `pnpm build && pnpm check && pnpm test`
- Menjalankan suite penuh lokal yang lebih cepat pada mesin yang lapang: `pnpm test:max`
- Loop watch Vitest langsung: `pnpm test:watch`
- Penargetan file langsung kini juga merutekan path extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Utamakan run yang terarah terlebih dahulu saat Anda sedang mengiterasi satu kegagalan.
- Situs QA berbasis Docker: `pnpm qa:lab:up`
- Lane QA berbasis Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Saat Anda menyentuh pengujian atau ingin keyakinan tambahan:

- Gate cakupan: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Saat men-debug provider/model nyata (memerlukan kredensial nyata):

- Suite live (probe model + tool/image gateway): `pnpm test:live`
- Targetkan satu file live secara senyap: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Tip: ketika Anda hanya memerlukan satu kasus gagal, lebih baik mempersempit pengujian live melalui env var allowlist yang dijelaskan di bawah.

## Runner khusus QA

Perintah-perintah ini berada di samping suite pengujian utama saat Anda memerlukan realisme QA-lab:

- `pnpm openclaw qa suite`
  - Menjalankan skenario QA berbasis repo langsung pada host.
  - Menjalankan beberapa skenario yang dipilih secara paralel secara default dengan worker gateway terisolasi, hingga 64 worker atau sebanyak jumlah skenario yang dipilih. Gunakan `--concurrency <count>` untuk menyesuaikan jumlah worker, atau `--concurrency 1` untuk lane serial lama.
  - Mendukung mode provider `live-frontier`, `mock-openai`, dan `aimock`.
    `aimock` memulai server provider lokal berbasis AIMock untuk cakupan fixture eksperimental dan protocol-mock tanpa menggantikan lane `mock-openai` yang sadar skenario.
- `pnpm openclaw qa suite --runner multipass`
  - Menjalankan suite QA yang sama di dalam VM Linux Multipass sekali pakai.
  - Mempertahankan perilaku pemilihan skenario yang sama seperti `qa suite` pada host.
  - Menggunakan ulang flag pemilihan provider/model yang sama seperti `qa suite`.
  - Run live meneruskan input auth QA yang didukung dan praktis untuk guest:
    kunci provider berbasis env, path konfigurasi provider live QA, dan `CODEX_HOME` jika ada.
  - Direktori output harus tetap berada di bawah root repo agar guest dapat menulis kembali melalui workspace yang di-mount.
  - Menulis laporan + ringkasan QA normal serta log Multipass di bawah
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Memulai situs QA berbasis Docker untuk pekerjaan QA bergaya operator.
- `pnpm openclaw qa aimock`
  - Hanya memulai server provider AIMock lokal untuk pengujian smoke protokol secara langsung.
- `pnpm openclaw qa matrix`
  - Menjalankan lane QA live Matrix terhadap homeserver Tuwunel berbasis Docker yang sekali pakai.
  - Host QA ini saat ini hanya untuk repo/dev. Instalasi OpenClaw yang dipaketkan tidak menyertakan `qa-lab`, sehingga tidak mengekspos `openclaw qa`.
  - Checkout repo memuat runner bawaan secara langsung; tidak diperlukan langkah instalasi Plugin terpisah.
  - Menyediakan tiga pengguna Matrix sementara (`driver`, `sut`, `observer`) ditambah satu room privat, lalu memulai child gateway QA dengan Plugin Matrix nyata sebagai transport SUT.
  - Menggunakan image Tuwunel stabil yang dipin `ghcr.io/matrix-construct/tuwunel:v1.5.1` secara default. Ganti dengan `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` saat Anda perlu menguji image lain.
  - Matrix tidak mengekspos flag sumber kredensial bersama karena lane ini menyediakan pengguna sekali pakai secara lokal.
  - Menulis laporan QA Matrix, ringkasan, artefak observed-events, dan log output stdout/stderr gabungan di bawah `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Menjalankan lane QA live Telegram terhadap grup privat nyata menggunakan token bot driver dan SUT dari env.
  - Memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID grup harus berupa ID chat Telegram numerik.
  - Mendukung `--credential-source convex` untuk kredensial bersama yang dipool. Gunakan mode env secara default, atau set `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` untuk memilih lease yang dipool.
  - Memerlukan dua bot berbeda dalam grup privat yang sama, dengan bot SUT mengekspos username Telegram.
  - Untuk observasi bot-ke-bot yang stabil, aktifkan Bot-to-Bot Communication Mode di `@BotFather` untuk kedua bot dan pastikan bot driver dapat mengamati lalu lintas bot grup.
  - Menulis laporan QA Telegram, ringkasan, dan artefak observed-messages di bawah `.artifacts/qa-e2e/...`.

Lane transport live berbagi satu kontrak standar sehingga transport baru tidak menyimpang:

`qa-channel` tetap menjadi suite QA sintetis yang luas dan bukan bagian dari matriks cakupan transport live.

| Lane     | Canary | Gating mention | Blok allowlist | Balasan tingkat atas | Lanjutkan setelah restart | Tindak lanjut thread | Isolasi thread | Observasi reaksi | Perintah bantuan |
| -------- | ------ | -------------- | --------------- | -------------------- | ------------------------- | -------------------- | -------------- | ---------------- | ---------------- |
| Matrix   | x      | x              | x               | x                    | x                         | x                    | x              | x                |                  |
| Telegram | x      |                |                 |                      |                           |                      |                |                  | x                |

### Kredensial Telegram bersama melalui Convex (v1)

Saat `--credential-source convex` (atau `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) diaktifkan untuk
`openclaw qa telegram`, QA lab memperoleh lease eksklusif dari pool berbasis Convex, mengirim Heartbeat
untuk lease tersebut selama lane berjalan, dan melepaskan lease saat dimatikan.

Scaffold proyek Convex referensi:

- `qa/convex-credential-broker/`

Env var yang diperlukan:

- `OPENCLAW_QA_CONVEX_SITE_URL` (misalnya `https://your-deployment.convex.site`)
- Satu secret untuk peran yang dipilih:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` untuk `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` untuk `ci`
- Pemilihan peran kredensial:
  - CLI: `--credential-role maintainer|ci`
  - Default env: `OPENCLAW_QA_CREDENTIAL_ROLE` (default `maintainer`)

Env var opsional:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (default `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (default `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (default `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (default `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (default `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID pelacakan opsional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` mengizinkan URL Convex loopback `http://` untuk pengembangan lokal saja.

`OPENCLAW_QA_CONVEX_SITE_URL` seharusnya menggunakan `https://` dalam operasi normal.

Perintah admin maintainer (tambah/hapus/daftar pool) secara khusus memerlukan
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI untuk maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gunakan `--json` untuk output yang dapat dibaca mesin dalam skrip dan utilitas CI.

Kontrak endpoint default (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Permintaan: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Berhasil: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Habis/dapat dicoba ulang: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Permintaan: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Berhasil: `{ status: "ok" }` (atau `2xx` kosong)
- `POST /release`
  - Permintaan: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Berhasil: `{ status: "ok" }` (atau `2xx` kosong)
- `POST /admin/add` (khusus secret maintainer)
  - Permintaan: `{ kind, actorId, payload, note?, status? }`
  - Berhasil: `{ status: "ok", credential }`
- `POST /admin/remove` (khusus secret maintainer)
  - Permintaan: `{ credentialId, actorId }`
  - Berhasil: `{ status: "ok", changed, credential }`
  - Pelindung lease aktif: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (khusus secret maintainer)
  - Permintaan: `{ kind?, status?, includePayload?, limit? }`
  - Berhasil: `{ status: "ok", credentials, count }`

Bentuk payload untuk jenis Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` harus berupa string ID chat Telegram numerik.
- `admin/add` memvalidasi bentuk ini untuk `kind: "telegram"` dan menolak payload yang tidak valid.

### Menambahkan channel ke QA

Menambahkan channel ke sistem QA markdown memerlukan tepat dua hal:

1. Adapter transport untuk channel tersebut.
2. Paket skenario yang menjalankan kontrak channel.

Jangan tambahkan root perintah QA tingkat atas yang baru ketika host `qa-lab` bersama
dapat memiliki alur tersebut.

`qa-lab` memiliki mekanisme host bersama:

- root perintah `openclaw qa`
- startup dan teardown suite
- konkurensi worker
- penulisan artefak
- pembuatan laporan
- eksekusi skenario
- alias kompatibilitas untuk skenario `qa-channel` yang lebih lama

Plugin runner memiliki kontrak transport:

- bagaimana `openclaw qa <runner>` dipasang di bawah root `qa` bersama
- bagaimana gateway dikonfigurasi untuk transport tersebut
- bagaimana kesiapan diperiksa
- bagaimana event inbound diinjeksi
- bagaimana pesan outbound diamati
- bagaimana transkrip dan status transport yang dinormalisasi diekspos
- bagaimana tindakan yang didukung transport dijalankan
- bagaimana reset atau cleanup yang spesifik transport ditangani

Batas adopsi minimum untuk channel baru adalah:

1. Tetap jadikan `qa-lab` sebagai pemilik root `qa` bersama.
2. Implementasikan runner transport pada seam host `qa-lab` bersama.
3. Simpan mekanisme yang spesifik transport di dalam Plugin runner atau harness channel.
4. Pasang runner sebagai `openclaw qa <runner>` alih-alih mendaftarkan root perintah pesaing.
   Plugin runner harus mendeklarasikan `qaRunners` di `openclaw.plugin.json` dan mengekspor array `qaRunnerCliRegistrations` yang sesuai dari `runtime-api.ts`.
   Jaga agar `runtime-api.ts` tetap ringan; eksekusi CLI dan runner yang lazy harus tetap berada di balik entrypoint terpisah.
5. Tulis atau adaptasi skenario markdown di bawah `qa/scenarios/`.
6. Gunakan helper skenario generik untuk skenario baru.
7. Pertahankan alias kompatibilitas yang ada tetap berfungsi kecuali repo sedang melakukan migrasi yang disengaja.

Aturan pengambilannya ketat:

- Jika perilaku dapat diekspresikan sekali di `qa-lab`, tempatkan di `qa-lab`.
- Jika perilaku bergantung pada satu transport channel, simpan di Plugin runner atau harness plugin tersebut.
- Jika sebuah skenario memerlukan kapabilitas baru yang dapat digunakan oleh lebih dari satu channel, tambahkan helper generik alih-alih cabang spesifik channel di `suite.ts`.
- Jika suatu perilaku hanya bermakna untuk satu transport, pertahankan skenario tersebut spesifik transport dan buat itu eksplisit dalam kontrak skenario.

Nama helper generik yang disukai untuk skenario baru adalah:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Alias kompatibilitas tetap tersedia untuk skenario yang ada, termasuk:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Pekerjaan channel baru harus menggunakan nama helper generik.
Alias kompatibilitas ada untuk menghindari migrasi sekaligus, bukan sebagai model untuk
penulisan skenario baru.

## Suite pengujian (apa yang berjalan di mana)

Anggap suite-suite ini sebagai “realisme yang meningkat” (dan peningkatan flakiness/biaya):

### Unit / integrasi (default)

- Perintah: `pnpm test`
- Konfigurasi: sepuluh run shard berurutan (`vitest.full-*.config.ts`) di atas project Vitest scoped yang sudah ada
- File: inventaris core/unit di bawah `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts`, dan pengujian node `ui` yang di-whitelist yang dicakup oleh `vitest.unit.config.ts`
- Cakupan:
  - Pengujian unit murni
  - Pengujian integrasi in-process (auth gateway, routing, tooling, parsing, config)
  - Regresi deterministik untuk bug yang diketahui
- Ekspektasi:
  - Berjalan di CI
  - Tidak memerlukan kunci nyata
  - Harus cepat dan stabil
- Catatan project:
  - `pnpm test` tanpa target sekarang menjalankan sebelas konfigurasi shard yang lebih kecil (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) alih-alih satu proses root-project native yang sangat besar. Ini mengurangi RSS puncak pada mesin yang sibuk dan mencegah pekerjaan auto-reply/extension membuat suite lain yang tidak terkait kekurangan sumber daya.
  - `pnpm test --watch` tetap menggunakan grafik project `vitest.config.ts` root native, karena loop watch multi-shard tidak praktis.
  - `pnpm test`, `pnpm test:watch`, dan `pnpm test:perf:imports` merutekan target file/direktori eksplisit melalui lane scoped terlebih dahulu, sehingga `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tidak perlu menanggung biaya startup root project penuh.
  - `pnpm test:changed` memperluas path git yang berubah ke lane scoped yang sama ketika diff hanya menyentuh file sumber/pengujian yang dapat dirutekan; edit config/setup tetap fallback ke rerun root-project yang luas.
  - Pengujian unit ringan impor dari agen, perintah, Plugin, helper auto-reply, `plugin-sdk`, dan area utilitas murni serupa dirutekan melalui lane `unit-fast`, yang melewati `test/setup-openclaw-runtime.ts`; file stateful/berat pada runtime tetap berada di lane yang ada.
  - Beberapa file sumber helper `plugin-sdk` dan `commands` yang dipilih juga memetakan run mode changed ke pengujian sibling eksplisit di lane ringan tersebut, sehingga edit helper tidak perlu memicu ulang suite berat penuh untuk direktori itu.
  - `auto-reply` sekarang memiliki tiga bucket khusus: helper core tingkat atas, pengujian integrasi `reply.*` tingkat atas, dan subtree `src/auto-reply/reply/**`. Ini menjaga pekerjaan harness reply yang paling berat tetap terpisah dari pengujian status/chunk/token yang murah.
- Catatan embedded runner:
  - Saat Anda mengubah input penemuan message-tool atau konteks runtime Compaction,
    pertahankan kedua tingkat cakupan.
  - Tambahkan regresi helper yang terfokus untuk batas routing/normalisasi murni.
  - Pastikan juga suite integrasi embedded runner tetap sehat:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, dan
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Suite tersebut memverifikasi bahwa ID yang di-scope dan perilaku Compaction tetap mengalir
    melalui path `run.ts` / `compact.ts` yang nyata; pengujian helper saja bukan
    pengganti yang memadai untuk path integrasi tersebut.
- Catatan pool:
  - Konfigurasi dasar Vitest sekarang default ke `threads`.
  - Konfigurasi Vitest bersama juga menetapkan `isolate: false` dan menggunakan runner non-isolated di seluruh root project, konfigurasi e2e, dan live.
  - Lane UI root mempertahankan setup dan optimizer `jsdom`, tetapi sekarang juga berjalan pada runner non-isolated bersama.
  - Setiap shard `pnpm test` mewarisi default `threads` + `isolate: false` yang sama dari konfigurasi Vitest bersama.
  - Launcher bersama `scripts/run-vitest.mjs` sekarang juga menambahkan `--no-maglev` untuk proses child Node Vitest secara default guna mengurangi churn kompilasi V8 selama run lokal yang besar. Setel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` jika Anda perlu membandingkan dengan perilaku V8 bawaan.
- Catatan iterasi lokal cepat:
  - `pnpm test:changed` merutekan melalui lane scoped ketika path yang berubah dipetakan secara bersih ke suite yang lebih kecil.
  - `pnpm test:max` dan `pnpm test:changed:max` mempertahankan perilaku routing yang sama, hanya dengan batas worker yang lebih tinggi.
  - Auto-scaling worker lokal sekarang sengaja lebih konservatif dan juga mengurangi skala ketika load average host sudah tinggi, sehingga beberapa run Vitest bersamaan secara default mengurangi dampak.
  - Konfigurasi dasar Vitest menandai file project/konfigurasi sebagai `forceRerunTriggers` agar rerun mode changed tetap benar ketika wiring pengujian berubah.
  - Konfigurasi ini mempertahankan `OPENCLAW_VITEST_FS_MODULE_CACHE` tetap aktif pada host yang didukung; setel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` jika Anda ingin satu lokasi cache eksplisit untuk profiling langsung.
- Catatan debug performa:
  - `pnpm test:perf:imports` mengaktifkan pelaporan durasi impor Vitest beserta output rincian impor.
  - `pnpm test:perf:imports:changed` membatasi tampilan profiling yang sama ke file yang berubah sejak `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan `test:changed` yang dirutekan dengan jalur root-project native untuk diff yang sudah di-commit tersebut dan mencetak wall time beserta max RSS macOS.
- `pnpm test:perf:changed:bench -- --worktree` membenchmark tree kotor saat ini dengan merutekan daftar file yang berubah melalui `scripts/test-projects.mjs` dan konfigurasi Vitest root.
  - `pnpm test:perf:profile:main` menulis profil CPU main-thread untuk overhead startup dan transform Vitest/Vite.
  - `pnpm test:perf:profile:runner` menulis profil CPU+heap runner untuk suite unit dengan paralelisme file dinonaktifkan.

### E2E (smoke gateway)

- Perintah: `pnpm test:e2e`
- Konfigurasi: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Default runtime:
  - Menggunakan Vitest `threads` dengan `isolate: false`, sama seperti bagian repo lainnya.
  - Menggunakan worker adaptif (CI: hingga 2, lokal: 1 secara default).
  - Berjalan dalam mode senyap secara default untuk mengurangi overhead I/O konsol.
- Override yang berguna:
  - `OPENCLAW_E2E_WORKERS=<n>` untuk memaksa jumlah worker (dibatasi hingga 16).
  - `OPENCLAW_E2E_VERBOSE=1` untuk mengaktifkan kembali output konsol verbose.
- Cakupan:
  - Perilaku end-to-end gateway multi-instance
  - Surface WebSocket/HTTP, pairing Node, dan jaringan yang lebih berat
- Ekspektasi:
  - Berjalan di CI (saat diaktifkan dalam pipeline)
  - Tidak memerlukan kunci nyata
  - Lebih banyak bagian bergerak dibanding pengujian unit (bisa lebih lambat)

### E2E: smoke backend OpenShell

- Perintah: `pnpm test:e2e:openshell`
- File: `test/openshell-sandbox.e2e.test.ts`
- Cakupan:
  - Memulai gateway OpenShell terisolasi pada host melalui Docker
  - Membuat sandbox dari Dockerfile lokal sementara
  - Menjalankan backend OpenShell OpenClaw melalui `sandbox ssh-config` + eksekusi SSH yang nyata
  - Memverifikasi perilaku filesystem remote-canonical melalui bridge fs sandbox
- Ekspektasi:
  - Hanya opt-in; bukan bagian dari run default `pnpm test:e2e`
  - Memerlukan CLI `openshell` lokal serta daemon Docker yang berfungsi
  - Menggunakan `HOME` / `XDG_CONFIG_HOME` terisolasi, lalu menghancurkan gateway pengujian dan sandbox
- Override yang berguna:
  - `OPENCLAW_E2E_OPENSHELL=1` untuk mengaktifkan pengujian saat menjalankan suite e2e yang lebih luas secara manual
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` untuk menunjuk ke biner CLI non-default atau skrip wrapper

### Live (provider nyata + model nyata)

- Perintah: `pnpm test:live`
- Konfigurasi: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`
- Default: **diaktifkan** oleh `pnpm test:live` (menetapkan `OPENCLAW_LIVE_TEST=1`)
- Cakupan:
  - “Apakah provider/model ini benar-benar berfungsi _hari ini_ dengan kredensial nyata?”
  - Menangkap perubahan format provider, keanehan pemanggilan tool, masalah auth, dan perilaku rate limit
- Ekspektasi:
  - Secara desain tidak stabil untuk CI (jaringan nyata, kebijakan provider nyata, kuota, gangguan)
  - Berbiaya / menggunakan rate limit
  - Lebih baik menjalankan subset yang dipersempit daripada “semuanya”
- Run live mengambil `~/.profile` untuk mengambil API key yang belum ada.
- Secara default, run live tetap mengisolasi `HOME` dan menyalin materi config/auth ke home pengujian sementara agar fixture unit tidak dapat mengubah `~/.openclaw` Anda yang nyata.
- Setel `OPENCLAW_LIVE_USE_REAL_HOME=1` hanya saat Anda memang sengaja memerlukan pengujian live menggunakan direktori home nyata Anda.
- `pnpm test:live` sekarang default ke mode yang lebih senyap: tetap mempertahankan output progres `[live] ...`, tetapi menekan notifikasi `~/.profile` tambahan dan membisukan log bootstrap gateway/chatter Bonjour. Setel `OPENCLAW_LIVE_TEST_QUIET=0` jika Anda ingin log startup lengkap kembali.
- Rotasi API key (spesifik provider): setel `*_API_KEYS` dengan format koma/titik koma atau `*_API_KEY_1`, `*_API_KEY_2` (misalnya `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) atau override per-live melalui `OPENCLAW_LIVE_*_KEY`; pengujian akan retry pada respons rate limit.
- Output progres/Heartbeat:
  - Suite live sekarang mengeluarkan baris progres ke stderr sehingga panggilan provider yang lama tampak aktif meskipun capture konsol Vitest senyap.
  - `vitest.live.config.ts` menonaktifkan intersepsi konsol Vitest sehingga baris progres provider/gateway mengalir langsung selama run live.
  - Sesuaikan Heartbeat direct-model dengan `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Sesuaikan Heartbeat gateway/probe dengan `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Suite mana yang harus saya jalankan?

Gunakan tabel keputusan ini:

- Mengedit logika/pengujian: jalankan `pnpm test` (dan `pnpm test:coverage` jika Anda banyak mengubah)
- Menyentuh jaringan gateway / protokol WS / pairing: tambahkan `pnpm test:e2e`
- Men-debug “bot saya down” / kegagalan spesifik provider / pemanggilan tool: jalankan `pnpm test:live` yang dipersempit

## Live: sapuan kapabilitas Node Android

- Pengujian: `src/gateway/android-node.capabilities.live.test.ts`
- Skrip: `pnpm android:test:integration`
- Tujuan: memanggil **setiap perintah yang saat ini diiklankan** oleh Node Android yang terhubung dan menegaskan perilaku kontrak perintah.
- Cakupan:
  - Setup manual dengan prasyarat (suite ini tidak menginstal/menjalankan/memasangkan aplikasi).
  - Validasi gateway `node.invoke` per perintah untuk Node Android yang dipilih.
- Pra-setup yang diperlukan:
  - Aplikasi Android sudah terhubung + paired ke gateway.
  - Aplikasi tetap berada di foreground.
  - Izin/persetujuan capture telah diberikan untuk kapabilitas yang Anda harapkan lolos.
- Override target opsional:
  - `OPENCLAW_ANDROID_NODE_ID` atau `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detail setup Android lengkap: [Android App](/id/platforms/android)

## Live: smoke model (kunci profil)

Pengujian live dibagi menjadi dua lapisan agar kita dapat mengisolasi kegagalan:

- “Direct model” memberi tahu kita apakah provider/model dapat merespons sama sekali dengan kunci yang diberikan.
- “Gateway smoke” memberi tahu kita apakah pipeline gateway+agen penuh berfungsi untuk model tersebut (sesi, riwayat, tool, kebijakan sandbox, dll.).

### Lapisan 1: Penyelesaian model langsung (tanpa gateway)

- Pengujian: `src/agents/models.profiles.live.test.ts`
- Tujuan:
  - Mengenumerasi model yang ditemukan
  - Menggunakan `getApiKeyForModel` untuk memilih model yang Anda miliki kredensialnya
  - Menjalankan completion kecil per model (dan regresi terarah bila diperlukan)
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
- Setel `OPENCLAW_LIVE_MODELS=modern` (atau `all`, alias untuk modern) untuk benar-benar menjalankan suite ini; jika tidak, suite ini akan skip agar `pnpm test:live` tetap fokus pada gateway smoke
- Cara memilih model:
  - `OPENCLAW_LIVE_MODELS=modern` untuk menjalankan allowlist modern (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` adalah alias untuk allowlist modern
  - atau `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist dipisahkan koma)
  - Sapuan modern/all secara default menggunakan batas curated dengan sinyal tinggi; setel `OPENCLAW_LIVE_MAX_MODELS=0` untuk sapuan modern lengkap atau angka positif untuk batas yang lebih kecil.
- Cara memilih provider:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist dipisahkan koma)
- Asal kunci:
  - Secara default: penyimpanan profil dan fallback env
  - Setel `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa **hanya** penyimpanan profil
- Alasan ini ada:
  - Memisahkan “API provider rusak / kunci tidak valid” dari “pipeline agen gateway rusak”
  - Menampung regresi kecil yang terisolasi (contoh: replay reasoning OpenAI Responses/Codex Responses + alur tool-call)

### Lapisan 2: smoke Gateway + agen dev (apa yang sebenarnya dilakukan `@openclaw`)

- Pengujian: `src/gateway/gateway-models.profiles.live.test.ts`
- Tujuan:
  - Menyalakan gateway in-process
  - Membuat/menambal sesi `agent:dev:*` (override model per run)
  - Mengiterasi model-dengan-kunci dan menegaskan:
    - respons yang “bermakna” (tanpa tool)
    - satu pemanggilan tool nyata berfungsi (probe baca)
    - probe tool tambahan opsional (probe exec+baca)
    - path regresi OpenAI (hanya-tool-call → tindak lanjut) tetap berfungsi
- Detail probe (agar Anda bisa menjelaskan kegagalan dengan cepat):
  - probe `read`: pengujian menulis file nonce di workspace lalu meminta agen untuk `read` file tersebut dan mengembalikan nonce.
  - probe `exec+read`: pengujian meminta agen untuk menulis nonce ke file sementara melalui `exec`, lalu membacanya kembali dengan `read`.
  - probe image: pengujian melampirkan PNG yang dihasilkan (kucing + kode acak) dan mengharapkan model mengembalikan `cat <CODE>`.
  - Referensi implementasi: `src/gateway/gateway-models.profiles.live.test.ts` dan `src/gateway/live-image-probe.ts`.
- Cara mengaktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
- Cara memilih model:
  - Default: allowlist modern (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` adalah alias untuk allowlist modern
  - Atau setel `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (atau daftar dipisahkan koma) untuk mempersempit
  - Sapuan gateway modern/all secara default menggunakan batas curated dengan sinyal tinggi; setel `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` untuk sapuan modern lengkap atau angka positif untuk batas yang lebih kecil.
- Cara memilih provider (hindari “semua OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist dipisahkan koma)
- Probe tool + image selalu aktif dalam pengujian live ini:
  - probe `read` + probe `exec+read` (stress tool)
  - probe image berjalan saat model mengiklankan dukungan input image
  - Alur (tingkat tinggi):
    - Pengujian menghasilkan PNG kecil dengan “CAT” + kode acak (`src/gateway/live-image-probe.ts`)
    - Mengirimkannya melalui `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway mengurai lampiran menjadi `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Agen embedded meneruskan pesan pengguna multimodal ke model
    - Asersi: balasan berisi `cat` + kode tersebut (toleransi OCR: kesalahan kecil diperbolehkan)

Tip: untuk melihat apa yang bisa Anda uji di mesin Anda (dan ID `provider/model` yang tepat), jalankan:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke backend CLI (Claude, Codex, Gemini, atau CLI lokal lainnya)

- Pengujian: `src/gateway/gateway-cli-backend.live.test.ts`
- Tujuan: memvalidasi pipeline Gateway + agen menggunakan backend CLI lokal, tanpa menyentuh config default Anda.
- Default smoke backend-spesifik berada bersama definisi `cli-backend.ts` milik extension yang memilikinya.
- Aktifkan:
  - `pnpm test:live` (atau `OPENCLAW_LIVE_TEST=1` jika memanggil Vitest secara langsung)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Default:
  - Provider/model default: `claude-cli/claude-sonnet-4-6`
  - Perilaku command/args/image berasal dari metadata Plugin backend CLI yang memilikinya.
- Override (opsional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` untuk mengirim lampiran image nyata (path diinjeksi ke prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` untuk meneruskan path file image sebagai argumen CLI alih-alih injeksi prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (atau `"list"`) untuk mengontrol bagaimana argumen image diteruskan saat `IMAGE_ARG` disetel.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` untuk mengirim giliran kedua dan memvalidasi alur resume.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` untuk menonaktifkan probe kontinuitas sesi yang sama Claude Sonnet -> Opus default (setel ke `1` untuk memaksanya aktif saat model yang dipilih mendukung target switch).

Contoh:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Resep Docker:

```bash
pnpm test:docker:live-cli-backend
```

Resep Docker penyedia tunggal:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Catatan:

- Runner Docker berada di `scripts/test-live-cli-backend-docker.sh`.
- Runner ini menjalankan smoke backend CLI live di dalam image Docker repo sebagai pengguna non-root `node`.
- Runner ini menyelesaikan metadata smoke CLI dari extension yang memilikinya, lalu memasang paket CLI Linux yang sesuai (`@anthropic-ai/claude-code`, `@openai/codex`, atau `@google/gemini-cli`) ke prefix writable yang di-cache di `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (default: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` memerlukan OAuth subscription Claude Code portabel melalui `~/.claude/.credentials.json` dengan `claudeAiOauth.subscriptionType` atau `CLAUDE_CODE_OAUTH_TOKEN` dari `claude setup-token`. Resep ini terlebih dahulu membuktikan `claude -p` langsung di Docker, lalu menjalankan dua giliran Gateway CLI-backend tanpa mempertahankan env API key Anthropic. Lane subscription ini menonaktifkan probe MCP/tool Claude dan image secara default karena Claude saat ini merutekan penggunaan aplikasi pihak ketiga melalui penagihan penggunaan tambahan, bukan batas paket subscription normal.
- Smoke backend CLI live sekarang menjalankan alur end-to-end yang sama untuk Claude, Codex, dan Gemini: giliran teks, giliran klasifikasi image, lalu pemanggilan tool MCP `cron` yang diverifikasi melalui CLI gateway.
- Smoke default Claude juga menambal sesi dari Sonnet ke Opus dan memverifikasi bahwa sesi yang di-resume masih mengingat catatan sebelumnya.

## Live: smoke bind ACP (`/acp spawn ... --bind here`)

- Pengujian: `src/gateway/gateway-acp-bind.live.test.ts`
- Tujuan: memvalidasi alur bind percakapan ACP nyata dengan agen ACP live:
  - kirim `/acp spawn <agent> --bind here`
  - bind percakapan channel-pesan sintetis secara in-place
  - kirim tindak lanjut normal pada percakapan yang sama
  - verifikasi bahwa tindak lanjut masuk ke transkrip sesi ACP yang di-bind
- Aktifkan:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Default:
  - Agen ACP di Docker: `claude,codex,gemini`
  - Agen ACP untuk `pnpm test:live ...` langsung: `claude`
  - Channel sintetis: konteks percakapan gaya Slack DM
  - Backend ACP: `acpx`
- Override:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Catatan:
  - Lane ini menggunakan surface gateway `chat.send` dengan field originating-route sintetis khusus admin sehingga pengujian dapat melampirkan konteks channel-pesan tanpa berpura-pura mengirim secara eksternal.
  - Saat `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` tidak disetel, pengujian menggunakan registri agen bawaan milik Plugin `acpx` embedded untuk agen harness ACP yang dipilih.

Contoh:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Resep Docker:

```bash
pnpm test:docker:live-acp-bind
```

Resep Docker agen tunggal:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Catatan Docker:

- Runner Docker berada di `scripts/test-live-acp-bind-docker.sh`.
- Secara default, runner ini menjalankan smoke bind ACP terhadap semua agen CLI live yang didukung secara berurutan: `claude`, `codex`, lalu `gemini`.
- Gunakan `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex`, atau `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` untuk mempersempit matriks.
- Runner ini mengambil `~/.profile`, menyiapkan materi auth CLI yang sesuai ke dalam container, memasang `acpx` ke prefix npm writable, lalu memasang CLI live yang diminta (`@anthropic-ai/claude-code`, `@openai/codex`, atau `@google/gemini-cli`) jika belum ada.
- Di dalam Docker, runner menetapkan `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` agar acpx tetap menyediakan env var provider dari profile yang diambil untuk CLI child harness.

## Live: smoke harness server-aplikasi Codex

- Tujuan: memvalidasi harness Codex milik Plugin melalui metode
  `agent` gateway normal:
  - memuat Plugin `codex` bawaan
  - memilih `OPENCLAW_AGENT_RUNTIME=codex`
  - mengirim giliran agen gateway pertama ke `codex/gpt-5.4`
  - mengirim giliran kedua ke sesi OpenClaw yang sama dan memverifikasi thread server-aplikasi
    dapat di-resume
  - menjalankan `/codex status` dan `/codex models` melalui path perintah gateway
    yang sama
- Pengujian: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model default: `codex/gpt-5.4`
- Probe image opsional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe MCP/tool opsional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Smoke ini menetapkan `OPENCLAW_AGENT_HARNESS_FALLBACK=none` sehingga harness Codex
  yang rusak tidak bisa lolos dengan diam-diam fallback ke PI.
- Auth: `OPENAI_API_KEY` dari shell/profile, ditambah salinan opsional
  `~/.codex/auth.json` dan `~/.codex/config.toml`

Resep lokal:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Resep Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Catatan Docker:

- Runner Docker berada di `scripts/test-live-codex-harness-docker.sh`.
- Runner ini mengambil `~/.profile` yang di-mount, meneruskan `OPENAI_API_KEY`, menyalin file
  auth Codex CLI saat tersedia, memasang `@openai/codex` ke prefix npm writable
  yang di-mount, menyiapkan source tree, lalu hanya menjalankan pengujian live Codex-harness.
- Docker mengaktifkan probe image dan MCP/tool secara default. Setel
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` atau
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` saat Anda memerlukan run debug yang lebih sempit.
- Docker juga mengekspor `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, sama seperti konfigurasi
  pengujian live sehingga fallback `openai-codex/*` atau PI tidak dapat menyembunyikan regresi
  harness Codex.

### Resep live yang direkomendasikan

Allowlist yang sempit dan eksplisit adalah yang tercepat dan paling sedikit flakiness:

- Satu model, langsung (tanpa gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Satu model, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Pemanggilan tool di beberapa provider:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Fokus Google (API key Gemini + Antigravity):
  - Gemini (API key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Catatan:

- `google/...` menggunakan Gemini API (API key).
- `google-antigravity/...` menggunakan bridge OAuth Antigravity (endpoint agen bergaya Cloud Code Assist).
- `google-gemini-cli/...` menggunakan Gemini CLI lokal di mesin Anda (auth + keanehan tooling yang terpisah).
- Gemini API vs Gemini CLI:
  - API: OpenClaw memanggil Gemini API yang di-host Google melalui HTTP (API key / auth profil); inilah yang biasanya dimaksud kebanyakan pengguna dengan “Gemini”.
  - CLI: OpenClaw melakukan shell out ke biner `gemini` lokal; ia memiliki auth sendiri dan dapat berperilaku berbeda (streaming/dukungan tool/ketidaksinkronan versi).

## Live: matriks model (apa yang kami cakup)

Tidak ada “daftar model CI” tetap (live bersifat opt-in), tetapi ini adalah model **yang direkomendasikan** untuk dicakup secara rutin pada mesin dev dengan kunci.

### Set smoke modern (tool calling + image)

Ini adalah run “model umum” yang kami harapkan tetap berfungsi:

- OpenAI (non-Codex): `openai/gpt-5.4` (opsional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (atau `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` dan `google/gemini-3-flash-preview` (hindari model Gemini 2.x yang lebih lama)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` dan `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Jalankan gateway smoke dengan tools + image:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Dasar: tool calling (Read + Exec opsional)

Pilih setidaknya satu per keluarga provider:

- OpenAI: `openai/gpt-5.4` (atau `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (atau `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (atau `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cakupan tambahan opsional (bagus jika ada):

- xAI: `xai/grok-4` (atau yang terbaru tersedia)
- Mistral: `mistral/`… (pilih satu model yang mendukung “tools” yang Anda aktifkan)
- Cerebras: `cerebras/`… (jika Anda memiliki akses)
- LM Studio: `lmstudio/`… (lokal; tool calling bergantung pada mode API)

### Vision: pengiriman image (lampiran → pesan multimodal)

Sertakan setidaknya satu model yang mendukung image dalam `OPENCLAW_LIVE_GATEWAY_MODELS` (varian Claude/Gemini/OpenAI yang mendukung vision, dll.) untuk menjalankan probe image.

### Aggregator / gateway alternatif

Jika Anda memiliki kunci yang diaktifkan, kami juga mendukung pengujian melalui:

- OpenRouter: `openrouter/...` (ratusan model; gunakan `openclaw models scan` untuk menemukan kandidat yang mendukung tool+image)
- OpenCode: `opencode/...` untuk Zen dan `opencode-go/...` untuk Go (auth melalui `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Provider lain yang dapat Anda sertakan dalam matriks live (jika Anda memiliki kredensial/config):

- Bawaan: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Melalui `models.providers` (endpoint kustom): `minimax` (cloud/API), ditambah proxy yang kompatibel dengan OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, dll.)

Tip: jangan mencoba meng-hardcode “semua model” dalam dokumen. Daftar yang otoritatif adalah apa pun yang dikembalikan `discoverModels(...)` di mesin Anda + kunci apa pun yang tersedia.

## Kredensial (jangan pernah commit)

Pengujian live menemukan kredensial dengan cara yang sama seperti CLI. Implikasi praktisnya:

- Jika CLI berfungsi, pengujian live seharusnya menemukan kunci yang sama.
- Jika pengujian live mengatakan “no creds”, debug dengan cara yang sama seperti Anda men-debug `openclaw models list` / pemilihan model.

- Profil auth per agen: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (inilah arti “profile keys” dalam pengujian live)
- Config: `~/.openclaw/openclaw.json` (atau `OPENCLAW_CONFIG_PATH`)
- Direktori state legacy: `~/.openclaw/credentials/` (disalin ke home live staged saat ada, tetapi bukan penyimpanan utama kunci profil)
- Run lokal live secara default menyalin config aktif, file `auth-profiles.json` per agen, `credentials/` legacy, dan direktori auth CLI eksternal yang didukung ke home pengujian sementara; home live staged melewati `workspace/` dan `sandboxes/`, dan override path `agents.*.workspace` / `agentDir` dihapus agar probe tetap tidak menyentuh workspace host nyata Anda.

Jika Anda ingin mengandalkan env key (misalnya diekspor di `~/.profile` Anda), jalankan pengujian lokal setelah `source ~/.profile`, atau gunakan runner Docker di bawah (runner tersebut dapat me-mount `~/.profile` ke dalam container).

## Live Deepgram (transkripsi audio)

- Pengujian: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Aktifkan: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live rencana coding BytePlus

- Pengujian: `src/agents/byteplus.live.test.ts`
- Aktifkan: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Override model opsional: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live media workflow ComfyUI

- Pengujian: `extensions/comfy/comfy.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Cakupan:
  - Menjalankan path image, video, dan `music_generate` comfy bawaan
  - Melewati setiap kapabilitas kecuali `models.providers.comfy.<capability>` dikonfigurasi
  - Berguna setelah mengubah pengiriman workflow comfy, polling, unduhan, atau registrasi Plugin

## Live pembuatan image

- Pengujian: `src/image-generation/runtime.live.test.ts`
- Perintah: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Cakupan:
  - Mengenumerasi setiap Plugin provider pembuatan image yang terdaftar
  - Memuat env var provider yang hilang dari login shell Anda (`~/.profile`) sebelum melakukan probe
  - Secara default menggunakan API key live/env sebelum profil auth yang tersimpan, sehingga kunci pengujian lama di `auth-profiles.json` tidak menutupi kredensial shell nyata
  - Melewati provider tanpa auth/profil/model yang dapat digunakan
  - Menjalankan varian pembuatan image bawaan melalui kapabilitas runtime bersama:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provider bawaan saat ini yang dicakup:
  - `openai`
  - `google`
- Penyempitan opsional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Perilaku auth opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa auth penyimpanan profil dan mengabaikan override hanya-env

## Live pembuatan musik

- Pengujian: `extensions/music-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Cakupan:
  - Menjalankan path provider pembuatan musik bawaan bersama
  - Saat ini mencakup Google dan MiniMax
  - Memuat env var provider dari login shell Anda (`~/.profile`) sebelum melakukan probe
  - Secara default menggunakan API key live/env sebelum profil auth yang tersimpan, sehingga kunci pengujian lama di `auth-profiles.json` tidak menutupi kredensial shell nyata
  - Melewati provider tanpa auth/profil/model yang dapat digunakan
  - Menjalankan kedua mode runtime yang dideklarasikan saat tersedia:
    - `generate` dengan input hanya prompt
    - `edit` saat provider mendeklarasikan `capabilities.edit.enabled`
  - Cakupan lane bersama saat ini:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: file live Comfy terpisah, bukan sapuan bersama ini
- Penyempitan opsional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Perilaku auth opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa auth penyimpanan profil dan mengabaikan override hanya-env

## Live pembuatan video

- Pengujian: `extensions/video-generation-providers.live.test.ts`
- Aktifkan: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Cakupan:
  - Menjalankan path provider pembuatan video bawaan bersama
  - Default ke path smoke yang aman untuk rilis: provider non-FAL, satu permintaan text-to-video per provider, prompt lobster satu detik, dan batas operasi per provider dari `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` secara default)
  - Melewati FAL secara default karena latensi antrean di sisi provider dapat mendominasi waktu rilis; kirim `--video-providers fal` atau `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` untuk menjalankannya secara eksplisit
  - Memuat env var provider dari login shell Anda (`~/.profile`) sebelum melakukan probe
  - Secara default menggunakan API key live/env sebelum profil auth yang tersimpan, sehingga kunci pengujian lama di `auth-profiles.json` tidak menutupi kredensial shell nyata
  - Melewati provider tanpa auth/profil/model yang dapat digunakan
  - Secara default hanya menjalankan `generate`
  - Setel `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` untuk juga menjalankan mode transform yang dideklarasikan saat tersedia:
    - `imageToVideo` saat provider mendeklarasikan `capabilities.imageToVideo.enabled` dan provider/model terpilih menerima input image lokal berbasis buffer dalam sapuan bersama
    - `videoToVideo` saat provider mendeklarasikan `capabilities.videoToVideo.enabled` dan provider/model terpilih menerima input video lokal berbasis buffer dalam sapuan bersama
  - Provider `imageToVideo` yang saat ini dideklarasikan tetapi dilewati dalam sapuan bersama:
    - `vydra` karena `veo3` bawaan hanya teks dan `kling` bawaan memerlukan URL image jarak jauh
  - Cakupan Vydra spesifik provider:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - file tersebut menjalankan `veo3` text-to-video ditambah lane `kling` yang secara default menggunakan fixture URL image jarak jauh
  - Cakupan live `videoToVideo` saat ini:
    - hanya `runway` saat model yang dipilih adalah `runway/gen4_aleph`
  - Provider `videoToVideo` yang saat ini dideklarasikan tetapi dilewati dalam sapuan bersama:
    - `alibaba`, `qwen`, `xai` karena path tersebut saat ini memerlukan URL referensi `http(s)` / MP4 jarak jauh
    - `google` karena lane Gemini/Veo bersama saat ini menggunakan input lokal berbasis buffer dan path itu tidak diterima dalam sapuan bersama
    - `openai` karena lane bersama saat ini tidak memiliki jaminan akses video inpaint/remix yang spesifik organisasi
- Penyempitan opsional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` untuk menyertakan setiap provider dalam sapuan default, termasuk FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` untuk mengurangi batas operasi tiap provider demi run smoke yang agresif
- Perilaku auth opsional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memaksa auth penyimpanan profil dan mengabaikan override hanya-env

## Harness media live

- Perintah: `pnpm test:live:media`
- Tujuan:
  - Menjalankan suite live image, musik, dan video bersama melalui satu entrypoint native repo
  - Memuat otomatis env var provider yang hilang dari `~/.profile`
  - Secara default mempersempit otomatis setiap suite ke provider yang saat ini memiliki auth yang dapat digunakan
  - Menggunakan ulang `scripts/test-live.mjs`, sehingga perilaku Heartbeat dan mode senyap tetap konsisten
- Contoh:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runner Docker (opsional untuk pemeriksaan “berfungsi di Linux”)

Runner Docker ini terbagi menjadi dua kelompok:

- Runner live-model: `test:docker:live-models` dan `test:docker:live-gateway` hanya menjalankan file live profile-key yang sesuai di dalam image Docker repo (`src/agents/models.profiles.live.test.ts` dan `src/gateway/gateway-models.profiles.live.test.ts`), dengan me-mount direktori config dan workspace lokal Anda (serta mengambil `~/.profile` jika di-mount). Entrypoint lokal yang sesuai adalah `test:live:models-profiles` dan `test:live:gateway-profiles`.
- Runner live Docker secara default menggunakan batas smoke yang lebih kecil agar sapuan Docker penuh tetap praktis:
  `test:docker:live-models` secara default menggunakan `OPENCLAW_LIVE_MAX_MODELS=12`, dan
  `test:docker:live-gateway` secara default menggunakan `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, dan
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Override env var tersebut saat Anda
  secara eksplisit menginginkan pemindaian lengkap yang lebih besar.
- `test:docker:all` membangun image live Docker satu kali melalui `test:docker:live-build`, lalu menggunakannya kembali untuk dua lane Docker live tersebut.
- Runner smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels`, dan `test:docker:plugins` menyalakan satu atau lebih container nyata dan memverifikasi path integrasi tingkat lebih tinggi.

Runner Docker live-model juga bind-mount hanya home auth CLI yang diperlukan (atau semuanya yang didukung bila run tidak dipersempit), lalu menyalinnya ke home container sebelum run sehingga OAuth CLI eksternal dapat me-refresh token tanpa mengubah penyimpanan auth host:

- Model langsung: `pnpm test:docker:live-models` (skrip: `scripts/test-live-models-docker.sh`)
- Smoke bind ACP: `pnpm test:docker:live-acp-bind` (skrip: `scripts/test-live-acp-bind-docker.sh`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (skrip: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness server-aplikasi Codex: `pnpm test:docker:live-codex-harness` (skrip: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agen dev: `pnpm test:docker:live-gateway` (skrip: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (skrip: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, scaffolding penuh): `pnpm test:docker:onboard` (skrip: `scripts/e2e/onboard-docker.sh`)
- Jaringan gateway (dua container, auth WS + health): `pnpm test:docker:gateway-network` (skrip: `scripts/e2e/gateway-network-docker.sh`)
- Bridge channel MCP (Gateway berisi seed + bridge stdio + smoke raw Claude notification-frame): `pnpm test:docker:mcp-channels` (skrip: `scripts/e2e/mcp-channels-docker.sh`)
- Plugin (smoke install + alias `/plugin` + semantik restart bundle Claude): `pnpm test:docker:plugins` (skrip: `scripts/e2e/plugins-docker.sh`)

Runner Docker live-model juga bind-mount checkout saat ini sebagai read-only dan
men-stage-nya ke workdir sementara di dalam container. Ini menjaga image runtime
tetap ramping sambil tetap menjalankan Vitest terhadap source/config lokal Anda yang persis.
Langkah staging melewati cache lokal besar dan output build aplikasi seperti
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, dan direktori output `.build` lokal aplikasi atau
Gradle sehingga run live Docker tidak menghabiskan waktu ber menit-menit untuk menyalin
artefak yang spesifik mesin.
Runner ini juga menetapkan `OPENCLAW_SKIP_CHANNELS=1` sehingga probe live gateway tidak menyalakan
worker channel Telegram/Discord/dll. nyata di dalam container.
`test:docker:live-models` tetap menjalankan `pnpm test:live`, jadi teruskan juga
`OPENCLAW_LIVE_GATEWAY_*` saat Anda perlu mempersempit atau mengecualikan cakupan live
gateway dari lane Docker tersebut.
`test:docker:openwebui` adalah smoke kompatibilitas tingkat lebih tinggi: ia menyalakan
container gateway OpenClaw dengan endpoint HTTP yang kompatibel dengan OpenAI diaktifkan,
menyalakan container Open WebUI yang dipin terhadap gateway tersebut, masuk melalui
Open WebUI, memverifikasi `/api/models` mengekspos `openclaw/default`, lalu mengirim
permintaan chat nyata melalui proxy `/api/chat/completions` milik Open WebUI.
Run pertama bisa terasa lebih lambat karena Docker mungkin perlu menarik
image Open WebUI dan Open WebUI mungkin perlu menyelesaikan setup cold-start miliknya sendiri.
Lane ini mengharapkan kunci model live yang dapat digunakan, dan `OPENCLAW_PROFILE_FILE`
(`~/.profile` secara default) adalah cara utama untuk menyediakannya dalam run berbasis Docker.
Run yang berhasil mencetak payload JSON kecil seperti `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` sengaja dibuat deterministik dan tidak memerlukan
akun Telegram, Discord, atau iMessage nyata. Ia menyalakan
container Gateway berisi seed, memulai container kedua yang menjalankan `openclaw mcp serve`, lalu
memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran,
perilaku antrean event live, routing pengiriman outbound, serta notifikasi channel +
izin bergaya Claude melalui bridge MCP stdio yang nyata. Pemeriksaan notifikasi
menginspeksi frame MCP stdio mentah secara langsung sehingga smoke memvalidasi apa yang benar-benar
dikeluarkan bridge, bukan hanya apa yang kebetulan ditampilkan oleh SDK klien tertentu.

Smoke thread plain-language ACP manual (bukan CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Simpan skrip ini untuk alur kerja regresi/debug. Skrip ini mungkin diperlukan lagi untuk validasi routing thread ACP, jadi jangan hapus.

Env var yang berguna:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) di-mount ke `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) di-mount ke `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (default: `~/.profile`) di-mount ke `/home/node/.profile` dan di-source sebelum menjalankan pengujian
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` untuk memverifikasi hanya env var yang di-source dari `OPENCLAW_PROFILE_FILE`, menggunakan direktori config/workspace sementara dan tanpa mount auth CLI eksternal
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) di-mount ke `/home/node/.npm-global` untuk instalasi CLI yang di-cache di dalam Docker
- Direktori/file auth CLI eksternal di bawah `$HOME` di-mount sebagai read-only di bawah `/host-auth...`, lalu disalin ke `/home/node/...` sebelum pengujian dimulai
  - Direktori default: `.minimax`
  - File default: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Run provider yang dipersempit hanya me-mount direktori/file yang diperlukan yang diinferensikan dari `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manual dengan `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, atau daftar dipisahkan koma seperti `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` untuk mempersempit run
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` untuk memfilter provider di dalam container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` untuk menggunakan ulang image `openclaw:local-live` yang sudah ada untuk rerun yang tidak memerlukan rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memastikan kredensial berasal dari penyimpanan profil (bukan env)
- `OPENCLAW_OPENWEBUI_MODEL=...` untuk memilih model yang diekspos oleh gateway untuk smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` untuk mengoverride prompt pemeriksaan nonce yang digunakan oleh smoke Open WebUI
- `OPENWEBUI_IMAGE=...` untuk mengoverride tag image Open WebUI yang dipin

## Kewarasan docs

Jalankan pemeriksaan docs setelah mengedit docs: `pnpm check:docs`.
Jalankan validasi anchor Mintlify penuh ketika Anda juga memerlukan pemeriksaan heading dalam halaman: `pnpm docs:check-links:anchors`.

## Regresi offline (aman untuk CI)

Ini adalah regresi “pipeline nyata” tanpa provider nyata:

- Tool calling gateway (mock OpenAI, gateway nyata + loop agen): `src/gateway/gateway.test.ts` (kasus: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard gateway (WS `wizard.start`/`wizard.next`, menulis config + auth ditegakkan): `src/gateway/gateway.test.ts` (kasus: "runs wizard over ws and writes auth token config")

## Evaluasi keandalan agen (Skills)

Kami sudah memiliki beberapa pengujian aman untuk CI yang berperilaku seperti “evaluasi keandalan agen”:

- Mock tool-calling melalui gateway nyata + loop agen (`src/gateway/gateway.test.ts`).
- Alur wizard end-to-end yang memvalidasi wiring sesi dan efek config (`src/gateway/gateway.test.ts`).

Yang masih kurang untuk Skills (lihat [Skills](/id/tools/skills)):

- **Pengambilan keputusan:** saat Skills dicantumkan dalam prompt, apakah agen memilih skill yang tepat (atau menghindari yang tidak relevan)?
- **Kepatuhan:** apakah agen membaca `SKILL.md` sebelum digunakan dan mengikuti langkah/argumen yang diwajibkan?
- **Kontrak alur kerja:** skenario multi-giliran yang menegaskan urutan tool, keterusan riwayat sesi, dan batas sandbox.

Evaluasi mendatang harus tetap deterministik terlebih dahulu:

- Runner skenario yang menggunakan provider mock untuk menegaskan pemanggilan tool + urutannya, pembacaan file skill, dan wiring sesi.
- Suite kecil skenario yang berfokus pada skill (gunakan vs hindari, gating, prompt injection).
- Evaluasi live opsional (opt-in, digerbangkan env) hanya setelah suite aman untuk CI tersedia.

## Pengujian kontrak (bentuk plugin dan channel)

Pengujian kontrak memverifikasi bahwa setiap plugin dan channel yang terdaftar sesuai dengan
kontrak interfacenya. Pengujian ini mengiterasi seluruh plugin yang ditemukan dan menjalankan
serangkaian asersi bentuk dan perilaku. Lane unit default `pnpm test`
sengaja melewati file seam dan smoke bersama ini; jalankan perintah kontrak secara eksplisit
saat Anda menyentuh surface channel atau provider bersama.

### Perintah

- Semua kontrak: `pnpm test:contracts`
- Hanya kontrak channel: `pnpm test:contracts:channels`
- Hanya kontrak provider: `pnpm test:contracts:plugins`

### Kontrak channel

Berada di `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Bentuk plugin dasar (id, nama, kapabilitas)
- **setup** - Kontrak wizard setup
- **session-binding** - Perilaku pengikatan sesi
- **outbound-payload** - Struktur payload pesan
- **inbound** - Penanganan pesan inbound
- **actions** - Handler aksi channel
- **threading** - Penanganan ID thread
- **directory** - API direktori/roster
- **group-policy** - Penegakan kebijakan grup

### Kontrak status provider

Berada di `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe status channel
- **registry** - Bentuk registri plugin

### Kontrak provider

Berada di `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrak alur auth
- **auth-choice** - Pilihan/seleksi auth
- **catalog** - API katalog model
- **discovery** - Penemuan plugin
- **loader** - Pemuatan plugin
- **runtime** - Runtime provider
- **shape** - Bentuk/interface plugin
- **wizard** - Wizard setup

### Kapan menjalankan

- Setelah mengubah ekspor atau subpath plugin-sdk
- Setelah menambahkan atau memodifikasi channel atau Plugin provider
- Setelah merombak registrasi atau penemuan plugin

Pengujian kontrak berjalan di CI dan tidak memerlukan API key nyata.

## Menambahkan regresi (panduan)

Saat Anda memperbaiki masalah provider/model yang ditemukan di live:

- Tambahkan regresi yang aman untuk CI jika memungkinkan (provider mock/stub, atau tangkap transformasi bentuk permintaan yang tepat)
- Jika secara inheren hanya live (rate limit, kebijakan auth), pertahankan pengujian live tetap sempit dan opt-in melalui env var
- Utamakan penargetan lapisan terkecil yang menangkap bug:
  - bug konversi/replay permintaan provider → pengujian model langsung
  - bug pipeline sesi/riwayat/tool gateway → gateway live smoke atau pengujian mock gateway yang aman untuk CI
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` menurunkan satu target sampel per kelas SecretRef dari metadata registri (`listSecretTargetRegistryEntries()`), lalu menegaskan ID exec traversal-segment ditolak.
  - Jika Anda menambahkan keluarga target SecretRef `includeInPlan` baru di `src/secrets/target-registry-data.ts`, perbarui `classifyTargetClass` dalam pengujian tersebut. Pengujian ini sengaja gagal pada ID target yang tidak terklasifikasi sehingga kelas baru tidak dapat dilewati secara diam-diam.
