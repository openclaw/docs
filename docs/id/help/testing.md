---
read_when:
    - Menjalankan pengujian secara lokal atau di CI
    - Menambahkan regresi untuk bug model/penyedia
    - Men-debug perilaku Gateway + agen
summary: 'Kit pengujian: suite unit/e2e/live, runner Docker, dan apa yang dicakup tiap pengujian'
title: Testing
x-i18n:
    generated_at: "2026-04-24T09:11:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c88325e0edb49437e7faa2eaf730eb3be59054d8c4bb86e56a42bc39a29a2b1
    source_path: help/testing.md
    workflow: 15
---

OpenClaw memiliki tiga suite Vitest (unit/integration, e2e, live) dan sejumlah kecil
runner Docker. Dokumen ini adalah panduan "cara kami menguji":

- Apa yang dicakup setiap suite (dan apa yang dengan sengaja _tidak_ dicakup).
- Perintah mana yang dijalankan untuk alur kerja umum (lokal, sebelum push, debugging).
- Cara pengujian live menemukan kredensial dan memilih model/penyedia.
- Cara menambahkan regresi untuk masalah model/penyedia di dunia nyata.

## Mulai cepat

Sebagian besar hari:

- Gate penuh (diharapkan sebelum push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Run full-suite lokal yang lebih cepat pada mesin yang lapang: `pnpm test:max`
- Loop watch Vitest langsung: `pnpm test:watch`
- Penargetan file langsung sekarang juga merutekan path extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Pilih run terarah terlebih dahulu saat Anda sedang mengiterasi satu kegagalan.
- Situs QA berbasis Docker: `pnpm qa:lab:up`
- Lane QA berbasis VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Saat Anda menyentuh pengujian atau ingin keyakinan tambahan:

- Gate cakupan: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Saat men-debug penyedia/model nyata (memerlukan kredensial nyata):

- Suite live (probe model + alat/gambar gateway): `pnpm test:live`
- Target satu file live secara senyap: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Sweep model live Docker: `pnpm test:docker:live-models`
  - Setiap model yang dipilih sekarang menjalankan satu giliran teks plus probe kecil bergaya pembacaan file.
    Model yang metadata-nya mengiklankan input `image` juga menjalankan giliran gambar kecil.
    Nonaktifkan probe tambahan dengan `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` atau
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` saat mengisolasi kegagalan penyedia.
  - Cakupan CI: `OpenClaw Scheduled Live And E2E Checks` harian dan
    `OpenClaw Release Checks` manual sama-sama memanggil workflow live/E2E reusable dengan
    `include_live_suites: true`, yang mencakup job matriks model live Docker terpisah
    yang di-shard berdasarkan penyedia.
  - Untuk rerun CI yang terfokus, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    dengan `include_live_suites: true` dan `live_models_only: true`.
  - Tambahkan secret penyedia high-signal baru ke `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dan pemanggil terjadwal/rilisnya.
- Smoke bound-chat Codex native: `pnpm test:docker:live-codex-bind`
  - Menjalankan lane live Docker terhadap path app-server Codex, mengikat DM
    Slack sintetis dengan `/codex bind`, menjalankan `/codex fast` dan
    `/codex permissions`, lalu memverifikasi balasan biasa dan lampiran gambar
    dirutekan melalui binding Plugin native, bukan ACP.
- Smoke biaya Moonshot/Kimi: dengan `MOONSHOT_API_KEY` disetel, jalankan
  `openclaw models list --provider moonshot --json`, lalu jalankan
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  yang terisolasi terhadap `moonshot/kimi-k2.6`. Verifikasi JSON melaporkan Moonshot/K2.6 dan transkrip
  asisten menyimpan `usage.cost` yang telah dinormalisasi.

Tip: saat Anda hanya membutuhkan satu kasus gagal, pilih penyempitan pengujian live melalui var env allowlist yang dijelaskan di bawah.

## Runner khusus QA

Perintah-perintah ini berada di samping suite pengujian utama saat Anda memerlukan realisme QA-lab:

CI menjalankan QA Lab dalam workflow khusus. `Parity gate` berjalan pada PR yang cocok dan
dari dispatch manual dengan penyedia mock. `QA-Lab - All Lanes` berjalan setiap malam pada
`main` dan dari dispatch manual dengan parity gate mock, lane Matrix live, dan lane Telegram live yang dikelola Convex sebagai job paralel. `OpenClaw Release Checks`
menjalankan lane yang sama sebelum persetujuan rilis.

- `pnpm openclaw qa suite`
  - Menjalankan skenario QA berbasis repo langsung di host.
  - Menjalankan beberapa skenario terpilih secara paralel secara default dengan worker
    gateway terisolasi. `qa-channel` default ke konkurensi 4 (dibatasi oleh
    jumlah skenario yang dipilih). Gunakan `--concurrency <count>` untuk menyetel
    jumlah worker, atau `--concurrency 1` untuk lane serial lama.
  - Keluar non-zero saat ada skenario yang gagal. Gunakan `--allow-failures` saat Anda
    menginginkan artefak tanpa exit code gagal.
  - Mendukung mode penyedia `live-frontier`, `mock-openai`, dan `aimock`.
    `aimock` memulai server penyedia lokal berbasis AIMock untuk cakupan fixture
    dan protocol-mock eksperimental tanpa menggantikan lane `mock-openai` yang sadar skenario.
- `pnpm openclaw qa suite --runner multipass`
  - Menjalankan suite QA yang sama di dalam VM Linux Multipass sekali pakai.
  - Mempertahankan perilaku pemilihan skenario yang sama seperti `qa suite` di host.
  - Menggunakan kembali flag pemilihan penyedia/model yang sama seperti `qa suite`.
  - Run live meneruskan input auth QA yang didukung dan praktis untuk guest:
    kunci penyedia berbasis env, path config penyedia live QA, dan `CODEX_HOME`
    bila ada.
  - Direktori output harus tetap berada di bawah root repo agar guest dapat menulis balik melalui
    workspace yang di-mount.
  - Menulis laporan + ringkasan QA normal plus log Multipass di bawah
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Memulai situs QA berbasis Docker untuk pekerjaan QA bergaya operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Membangun tarball npm dari checkout saat ini, menginstalnya secara global di
    Docker, menjalankan onboarding kunci API OpenAI non-interaktif, mengonfigurasi Telegram
    secara default, memverifikasi bahwa pengaktifan Plugin menginstal dependensi runtime sesuai kebutuhan, menjalankan doctor, dan menjalankan satu giliran agen lokal terhadap endpoint OpenAI yang di-mock.
  - Gunakan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` untuk menjalankan lane instalasi terpaket yang sama dengan Discord.
- `pnpm test:docker:npm-telegram-live`
  - Menginstal paket OpenClaw yang dipublikasikan di Docker, menjalankan onboarding paket terinstal, mengonfigurasi Telegram melalui CLI yang terinstal, lalu menggunakan kembali lane QA Telegram live dengan paket terinstal tersebut sebagai Gateway SUT.
  - Default ke `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Menggunakan kredensial env Telegram yang sama atau sumber kredensial Convex seperti
    `pnpm openclaw qa telegram`. Untuk otomasi CI/rilis, setel
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` dan secret role. Jika
    `OPENCLAW_QA_CONVEX_SITE_URL` dan secret role Convex ada di CI,
    wrapper Docker memilih Convex secara otomatis.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` mengoverride
    `OPENCLAW_QA_CREDENTIAL_ROLE` bersama hanya untuk lane ini.
  - GitHub Actions mengekspos lane ini sebagai workflow maintainer manual
    `NPM Telegram Beta E2E`. Ini tidak berjalan saat merge. Workflow tersebut menggunakan
    environment `qa-live-shared` dan lease kredensial CI Convex.
- `pnpm test:docker:bundled-channel-deps`
  - Mengemas dan menginstal build OpenClaw saat ini di Docker, memulai Gateway
    dengan OpenAI yang dikonfigurasi, lalu mengaktifkan channel/Plugin bawaan melalui edit config.
  - Memverifikasi penemuan setup membuat dependensi runtime Plugin yang belum dikonfigurasi tetap tidak ada, run Gateway atau doctor pertama yang dikonfigurasi menginstal dependensi runtime setiap Plugin bawaan sesuai kebutuhan, dan restart kedua tidak menginstal ulang dependensi yang sudah diaktifkan.
  - Juga menginstal baseline npm lama yang diketahui, mengaktifkan Telegram sebelum menjalankan
    `openclaw update --tag <candidate>`, dan memverifikasi bahwa
    doctor pasca-pembaruan kandidat memperbaiki dependensi runtime channel bawaan tanpa perbaikan postinstall di sisi harness.
- `pnpm openclaw qa aimock`
  - Hanya memulai server penyedia AIMock lokal untuk smoke pengujian protokol langsung.
- `pnpm openclaw qa matrix`
  - Menjalankan lane QA live Matrix terhadap homeserver Tuwunel berbasis Docker sekali pakai.
  - Host QA ini saat ini hanya untuk repo/dev. Instalasi OpenClaw terpaket tidak mengirim
    `qa-lab`, jadi tidak mengekspos `openclaw qa`.
  - Checkout repo memuat runner bawaan langsung; tidak diperlukan langkah instalasi Plugin terpisah.
  - Menyediakan tiga pengguna Matrix sementara (`driver`, `sut`, `observer`) plus satu room privat, lalu memulai child QA gateway dengan Plugin Matrix nyata sebagai transport SUT.
  - Menggunakan image Tuwunel stabil yang dipin `ghcr.io/matrix-construct/tuwunel:v1.5.1` secara default. Override dengan `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` saat Anda perlu menguji image yang berbeda.
  - Matrix tidak mengekspos flag sumber kredensial bersama karena lane ini menyediakan pengguna sekali pakai secara lokal.
  - Menulis laporan QA Matrix, ringkasan, artefak observed-events, dan log output stdout/stderr gabungan di bawah `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Menjalankan lane QA live Telegram terhadap grup privat nyata menggunakan token bot driver dan SUT dari env.
  - Memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Id grup harus berupa id chat Telegram numerik.
  - Mendukung `--credential-source convex` untuk kredensial bersama yang dipool. Gunakan mode env secara default, atau setel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` untuk memilih lease yang dipool.
  - Keluar non-zero saat ada skenario yang gagal. Gunakan `--allow-failures` saat Anda
    menginginkan artefak tanpa exit code gagal.
  - Memerlukan dua bot berbeda di grup privat yang sama, dengan bot SUT mengekspos username Telegram.
  - Untuk observasi bot-ke-bot yang stabil, aktifkan Bot-to-Bot Communication Mode di `@BotFather` untuk kedua bot dan pastikan bot driver dapat mengamati lalu lintas bot grup.
  - Menulis laporan QA Telegram, ringkasan, dan artefak observed-messages di bawah `.artifacts/qa-e2e/...`. Skenario balasan menyertakan RTT dari permintaan kirim driver ke balasan SUT yang diamati.

Lane transport live berbagi satu kontrak standar sehingga transport baru tidak menyimpang:

`qa-channel` tetap menjadi suite QA sintetis yang luas dan bukan bagian dari matriks cakupan transport live.

| Lane     | Canary | Pembatasan mention | Blok allowlist | Balasan tingkat atas | Lanjut setelah restart | Follow-up thread | Isolasi thread | Observasi reaksi | Perintah help |
| -------- | ------ | ------------------ | -------------- | -------------------- | ---------------------- | ---------------- | -------------- | ---------------- | ------------- |
| Matrix   | x      | x                  | x              | x                    | x                      | x                | x              | x                |               |
| Telegram | x      |                    |                |                      |                        |                  |                |                  | x             |

### Kredensial Telegram bersama melalui Convex (v1)

Saat `--credential-source convex` (atau `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) diaktifkan untuk
`openclaw qa telegram`, QA lab memperoleh lease eksklusif dari pool yang didukung Convex, mengirim heartbeat
lease tersebut saat lane berjalan, dan melepaskan lease saat shutdown.

Scaffold proyek Convex referensi:

- `qa/convex-credential-broker/`

Var env yang diperlukan:

- `OPENCLAW_QA_CONVEX_SITE_URL` (misalnya `https://your-deployment.convex.site`)
- Satu secret untuk role yang dipilih:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` untuk `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` untuk `ci`
- Pemilihan role kredensial:
  - CLI: `--credential-role maintainer|ci`
  - Default env: `OPENCLAW_QA_CREDENTIAL_ROLE` (default ke `ci` di CI, `maintainer` selain itu)

Var env opsional:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (default `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (default `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (default `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (default `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (default `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id pelacakan opsional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` mengizinkan URL Convex loopback `http://` untuk pengembangan lokal saja.

`OPENCLAW_QA_CONVEX_SITE_URL` seharusnya menggunakan `https://` dalam operasi normal.

Perintah admin maintainer (tambah/hapus/daftar pool) memerlukan
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` secara khusus.

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
- `POST /admin/add` (hanya secret maintainer)
  - Permintaan: `{ kind, actorId, payload, note?, status? }`
  - Berhasil: `{ status: "ok", credential }`
- `POST /admin/remove` (hanya secret maintainer)
  - Permintaan: `{ credentialId, actorId }`
  - Berhasil: `{ status: "ok", changed, credential }`
  - Pengaman lease aktif: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (hanya secret maintainer)
  - Permintaan: `{ kind?, status?, includePayload?, limit? }`
  - Berhasil: `{ status: "ok", credentials, count }`

Bentuk payload untuk jenis Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` harus berupa string id chat Telegram numerik.
- `admin/add` memvalidasi bentuk ini untuk `kind: "telegram"` dan menolak payload yang salah bentuk.

### Menambahkan channel ke QA

Menambahkan channel ke sistem QA Markdown memerlukan tepat dua hal:

1. Adapter transport untuk channel tersebut.
2. Paket skenario yang menguji kontrak channel.

Jangan tambahkan root perintah QA tingkat atas baru ketika host `qa-lab` bersama dapat
memiliki alurnya.

`qa-lab` memiliki mekanik host bersama:

- root perintah `openclaw qa`
- startup dan teardown suite
- konkurensi worker
- penulisan artefak
- pembuatan laporan
- eksekusi skenario
- alias kompatibilitas untuk skenario `qa-channel` lama

Plugin runner memiliki kontrak transport:

- bagaimana `openclaw qa <runner>` dipasang di bawah root `qa` bersama
- bagaimana gateway dikonfigurasi untuk transport tersebut
- bagaimana kesiapan diperiksa
- bagaimana event masuk disuntikkan
- bagaimana pesan keluar diamati
- bagaimana transkrip dan state transport ternormalisasi diekspos
- bagaimana tindakan berbasis transport dieksekusi
- bagaimana reset atau pembersihan khusus transport ditangani

Standar adopsi minimum untuk channel baru adalah:

1. Pertahankan `qa-lab` sebagai pemilik root `qa` bersama.
2. Implementasikan runner transport pada seam host `qa-lab` bersama.
3. Pertahankan mekanik khusus transport di dalam plugin runner atau harness channel.
4. Pasang runner sebagai `openclaw qa <runner>` alih-alih mendaftarkan root perintah yang bersaing.
   Plugin runner harus mendeklarasikan `qaRunners` di `openclaw.plugin.json` dan mengekspor array `qaRunnerCliRegistrations` yang cocok dari `runtime-api.ts`.
   Pertahankan `runtime-api.ts` tetap ringan; eksekusi CLI dan runner yang lazy harus tetap berada di balik entrypoint terpisah.
5. Tulis atau adaptasikan skenario Markdown di bawah direktori bertema `qa/scenarios/`.
6. Gunakan helper skenario generik untuk skenario baru.
7. Pertahankan alias kompatibilitas yang ada tetap berfungsi kecuali repo sedang melakukan migrasi yang disengaja.

Aturan keputusannya ketat:

- Jika perilaku dapat diekspresikan sekali di `qa-lab`, letakkan di `qa-lab`.
- Jika perilaku bergantung pada satu transport channel, pertahankan di plugin runner atau harness plugin tersebut.
- Jika sebuah skenario membutuhkan kemampuan baru yang dapat digunakan lebih dari satu channel, tambahkan helper generik alih-alih cabang khusus channel di `suite.ts`.
- Jika suatu perilaku hanya bermakna untuk satu transport, pertahankan skenario tetap khusus transport dan buat itu eksplisit dalam kontrak skenario.

Nama helper generik yang disarankan untuk skenario baru adalah:

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

Alias kompatibilitas tetap tersedia untuk skenario yang sudah ada, termasuk:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Pekerjaan channel baru seharusnya menggunakan nama helper generik.
Alias kompatibilitas ada untuk menghindari migrasi serentak, bukan sebagai model untuk
penulisan skenario baru.

## Suite pengujian (apa yang berjalan di mana)

Anggap suite sebagai “realisme yang meningkat” (dan flakiness/biaya yang meningkat):

### Unit / integration (default)

- Perintah: `pnpm test`
- Config: run yang tidak ditargetkan menggunakan set shard `vitest.full-*.config.ts` dan dapat memperluas shard multi-proyek menjadi config per-proyek untuk penjadwalan paralel
- File: inventaris inti/unit di bawah `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts`, dan pengujian Node `ui` yang masuk allowlist yang dicakup oleh `vitest.unit.config.ts`
- Cakupan:
  - Pengujian unit murni
  - Pengujian integrasi dalam proses (auth gateway, routing, tooling, parsing, config)
  - Regresi deterministik untuk bug yang diketahui
- Ekspektasi:
  - Berjalan di CI
  - Tidak memerlukan kunci nyata
  - Harus cepat dan stabil
    <AccordionGroup>
    <Accordion title="Proyek, shard, dan lane yang dibatasi"> - `pnpm test` yang tidak ditargetkan menjalankan dua belas config shard yang lebih kecil (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) alih-alih satu proses root-project native yang sangat besar. Ini mengurangi puncak RSS pada mesin yang sibuk dan mencegah pekerjaan auto-reply/extension membuat suite yang tidak terkait kelaparan. - `pnpm test --watch` tetap menggunakan graf proyek root `vitest.config.ts` native, karena loop watch multi-shard tidak praktis. - `pnpm test`, `pnpm test:watch`, dan `pnpm test:perf:imports` merutekan target file/direktori eksplisit melalui lane yang dibatasi terlebih dahulu, sehingga `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` menghindari biaya startup proyek root penuh. - `pnpm test:changed` memperluas path git yang berubah ke lane yang dibatasi yang sama ketika diff hanya menyentuh file source/test yang dapat dirutekan; edit config/setup tetap fallback ke rerun proyek root yang luas. - `pnpm check:changed` adalah gate lokal pintar normal untuk pekerjaan sempit. Ini mengklasifikasikan diff ke core, pengujian core, extensions, pengujian extension, apps, dokumentasi, metadata rilis, dan tooling, lalu menjalankan lane typecheck/lint/test yang cocok. Perubahan SDK Plugin publik dan kontrak plugin mencakup satu lintasan validasi extension karena extension bergantung pada kontrak inti tersebut. Kenaikan versi yang hanya menyentuh metadata rilis menjalankan pemeriksaan versi/config/dependensi root yang terarah alih-alih suite penuh, dengan pengaman yang menolak perubahan package di luar field versi tingkat atas. - Pengujian unit ringan-import dari agents, commands, plugins, helper auto-reply, `plugin-sdk`, dan area utilitas murni serupa dirutekan melalui lane `unit-fast`, yang melewati `test/setup-openclaw-runtime.ts`; file yang stateful/berat-runtime tetap pada lane yang ada. - File source helper `plugin-sdk` dan `commands` tertentu juga memetakan run mode-changed ke pengujian sibling eksplisit di lane ringan tersebut, sehingga edit helper menghindari rerun suite berat penuh untuk direktori itu. - `auto-reply` memiliki tiga bucket khusus: helper inti tingkat atas, pengujian integrasi `reply.*` tingkat atas, dan subtree `src/auto-reply/reply/**`. Ini menjaga pekerjaan harness reply terberat tetap terpisah dari pengujian status/chunk/token yang murah.
    </Accordion>

      <Accordion title="Cakupan embedded runner">
        - Saat Anda mengubah input penemuan message-tool atau konteks runtime Compaction,
          pertahankan kedua tingkat cakupan.
        - Tambahkan regresi helper terfokus untuk batas routing dan normalisasi murni.
        - Pertahankan suite integrasi embedded runner tetap sehat:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, dan
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
        - Suite tersebut memverifikasi bahwa id yang dibatasi dan perilaku Compaction tetap mengalir
          melalui jalur nyata `run.ts` / `compact.ts`; pengujian khusus helper bukan
          pengganti yang memadai untuk jalur integrasi tersebut.
      </Accordion>

      <Accordion title="Default pool dan isolasi Vitest">
        - Config dasar Vitest default ke `threads`.
        - Config Vitest bersama menetapkan `isolate: false` dan menggunakan runner
          non-terisolasi di seluruh proyek root, config e2e, dan live.
        - Lane UI root mempertahankan setup dan optimizer `jsdom`, tetapi berjalan pada
          runner non-terisolasi bersama juga.
        - Setiap shard `pnpm test` mewarisi default `threads` + `isolate: false`
          yang sama dari config Vitest bersama.
        - `scripts/run-vitest.mjs` menambahkan `--no-maglev` untuk proses Node child Vitest
          secara default guna mengurangi churn kompilasi V8 selama run lokal besar.
          Setel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` untuk membandingkan dengan
          perilaku V8 bawaan.
      </Accordion>

      <Accordion title="Iterasi lokal cepat">
        - `pnpm changed:lanes` menampilkan lane arsitektur mana yang dipicu oleh suatu diff.
        - Hook pre-commit hanya untuk pemformatan. Hook ini men-stage ulang file yang
          diformat dan tidak menjalankan lint, typecheck, atau pengujian.
        - Jalankan `pnpm check:changed` secara eksplisit sebelum handoff atau push saat Anda
          memerlukan gate lokal pintar. Perubahan SDK Plugin publik dan kontrak plugin
          mencakup satu lintasan validasi extension.
        - `pnpm test:changed` merutekan melalui lane yang dibatasi saat path yang berubah
          dipetakan dengan bersih ke suite yang lebih kecil.
        - `pnpm test:max` dan `pnpm test:changed:max` mempertahankan perilaku routing yang sama, hanya dengan batas worker yang lebih tinggi.
        - Auto-scaling worker lokal sengaja konservatif dan mengurangi skala
          saat rata-rata beban host sudah tinggi, sehingga beberapa run
          Vitest yang bersamaan secara default menimbulkan kerusakan yang lebih kecil.
        - Config dasar Vitest menandai proyek/file config sebagai
          `forceRerunTriggers` agar rerun mode-changed tetap benar saat wiring pengujian berubah.
        - Config mempertahankan `OPENCLAW_VITEST_FS_MODULE_CACHE` tetap aktif pada
          host yang didukung; setel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` jika Anda menginginkan
          satu lokasi cache eksplisit untuk profiling langsung.
      </Accordion>

      <Accordion title="Debugging performa">
        - `pnpm test:perf:imports` mengaktifkan pelaporan durasi impor Vitest plus
          output rincian impor.
        - `pnpm test:perf:imports:changed` membatasi tampilan profiling yang sama ke
          file yang berubah sejak `origin/main`.
        - Saat satu hot test masih menghabiskan sebagian besar waktunya pada impor startup,
          pertahankan dependensi berat di balik seam lokal `*.runtime.ts` yang sempit dan
          mock seam itu secara langsung alih-alih melakukan deep-import helper runtime hanya
          untuk meneruskannya melalui `vi.mock(...)`.
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan
          `test:changed` yang dirutekan dengan jalur root-project native untuk diff yang di-commit tersebut
          dan mencetak wall time plus RSS maksimum macOS.
        - `pnpm test:perf:changed:bench -- --worktree` membenchmark dirty tree saat ini
          dengan merutekan daftar file yang berubah melalui
          `scripts/test-projects.mjs` dan config root Vitest.
        - `pnpm test:perf:profile:main` menulis profil CPU main-thread untuk
          overhead startup dan transform Vitest/Vite.
        - `pnpm test:perf:profile:runner` menulis profil CPU+heap runner untuk
          suite unit dengan paralelisme file dinonaktifkan.
      </Accordion>
    </AccordionGroup>

### Stability (gateway)

- Perintah: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, dipaksa ke satu worker
- Cakupan:
  - Memulai Gateway loopback nyata dengan diagnostik diaktifkan secara default
  - Mendorong churn pesan gateway, memori, dan payload besar sintetis melalui jalur event diagnostik
  - Mengkueri `diagnostics.stability` melalui RPC WS Gateway
  - Mencakup helper persistensi paket stabilitas diagnostik
  - Menegaskan perekam tetap terbatas, sampel RSS sintetis tetap di bawah anggaran tekanan, dan kedalaman antrean per sesi terkuras kembali ke nol
- Ekspektasi:
  - Aman untuk CI dan tanpa kunci
  - Lane sempit untuk tindak lanjut regresi stabilitas, bukan pengganti suite Gateway penuh

### E2E (smoke gateway)

- Perintah: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, dan pengujian E2E Plugin bawaan di bawah `extensions/`
- Default runtime:
  - Menggunakan Vitest `threads` dengan `isolate: false`, sama seperti repo lainnya.
  - Menggunakan worker adaptif (CI: hingga 2, lokal: 1 secara default).
  - Berjalan dalam mode senyap secara default untuk mengurangi overhead I/O konsol.
- Override yang berguna:
  - `OPENCLAW_E2E_WORKERS=<n>` untuk memaksa jumlah worker (dibatasi maksimal 16).
  - `OPENCLAW_E2E_VERBOSE=1` untuk mengaktifkan kembali output konsol verbose.
- Cakupan:
  - Perilaku end-to-end Gateway multi-instance
  - Permukaan WebSocket/HTTP, pairing Node, dan jaringan yang lebih berat
- Ekspektasi:
  - Berjalan di CI (saat diaktifkan di pipeline)
  - Tidak memerlukan kunci nyata
  - Lebih banyak komponen bergerak dibanding pengujian unit (bisa lebih lambat)

### E2E: smoke backend OpenShell

- Perintah: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Cakupan:
  - Memulai Gateway OpenShell terisolasi di host melalui Docker
  - Membuat sandbox dari Dockerfile lokal sementara
  - Menguji backend OpenShell OpenClaw melalui `sandbox ssh-config` + SSH exec nyata
  - Memverifikasi perilaku filesystem remote-kanonis melalui fs bridge sandbox
- Ekspektasi:
  - Hanya opt-in; bukan bagian dari run default `pnpm test:e2e`
  - Memerlukan CLI `openshell` lokal plus daemon Docker yang berfungsi
  - Menggunakan `HOME` / `XDG_CONFIG_HOME` terisolasi, lalu menghancurkan gateway dan sandbox pengujian
- Override yang berguna:
  - `OPENCLAW_E2E_OPENSHELL=1` untuk mengaktifkan pengujian saat menjalankan suite e2e yang lebih luas secara manual
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` untuk mengarah ke biner CLI non-default atau wrapper script

### Live (penyedia nyata + model nyata)

- Perintah: `pnpm test:live`
- Config: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, dan pengujian live Plugin bawaan di bawah `extensions/`
- Default: **diaktifkan** oleh `pnpm test:live` (menyetel `OPENCLAW_LIVE_TEST=1`)
- Cakupan:
  - “Apakah penyedia/model ini benar-benar berfungsi _hari ini_ dengan kredensial nyata?”
  - Menangkap perubahan format penyedia, keanehan tool-calling, masalah auth, dan perilaku batas laju
- Ekspektasi:
  - Secara desain tidak stabil untuk CI (jaringan nyata, kebijakan penyedia nyata, kuota, outage)
  - Menghabiskan uang / menggunakan batas laju
  - Pilih menjalankan subset yang dipersempit, bukan “semuanya”
- Run live mengambil `~/.profile` untuk mengambil kunci API yang hilang.
- Secara default, run live tetap mengisolasi `HOME` dan menyalin materi config/auth ke home pengujian sementara sehingga fixture unit tidak dapat mengubah `~/.openclaw` nyata Anda.
- Setel `OPENCLAW_LIVE_USE_REAL_HOME=1` hanya saat Anda memang membutuhkan pengujian live menggunakan direktori home nyata Anda.
- `pnpm test:live` sekarang default ke mode yang lebih tenang: tetap mempertahankan output progres `[live] ...`, tetapi menekan pemberitahuan `~/.profile` tambahan dan membisukan log bootstrap gateway/keributan Bonjour. Setel `OPENCLAW_LIVE_TEST_QUIET=0` jika Anda ingin log startup lengkap kembali.
- Rotasi kunci API (khusus penyedia): setel `*_API_KEYS` dengan format koma/titik koma atau `*_API_KEY_1`, `*_API_KEY_2` (misalnya `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) atau override per-live melalui `OPENCLAW_LIVE_*_KEY`; pengujian akan mencoba ulang pada respons batas laju.
- Output progres/heartbeat:
  - Suite live sekarang mengeluarkan baris progres ke stderr sehingga panggilan penyedia yang lama tampak aktif meskipun pengambilan konsol Vitest tenang.
  - `vitest.live.config.ts` menonaktifkan intersepsi konsol Vitest sehingga baris progres penyedia/gateway mengalir segera selama run live.
  - Sesuaikan heartbeat model langsung dengan `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Sesuaikan heartbeat gateway/probe dengan `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Suite mana yang harus saya jalankan?

Gunakan tabel keputusan ini:

- Mengedit logika/pengujian: jalankan `pnpm test` (dan `pnpm test:coverage` jika Anda banyak mengubah)
- Menyentuh jaringan gateway / protokol WS / pairing: tambahkan `pnpm test:e2e`
- Men-debug “bot saya down” / kegagalan khusus penyedia / tool calling: jalankan `pnpm test:live` yang dipersempit

## Pengujian live (menyentuh jaringan)

Untuk matriks model live, smoke backend CLI, smoke ACP, harness app-server Codex,
dan semua pengujian live penyedia media (Deepgram, BytePlus, ComfyUI, gambar,
musik, video, media harness) — ditambah penanganan kredensial untuk run live — lihat
[Testing — live suites](/id/help/testing-live).

## Runner Docker (opsional "berfungsi di Linux" checks)

Runner Docker ini terbagi ke dua kelompok:

- Runner model live: `test:docker:live-models` dan `test:docker:live-gateway` hanya menjalankan file live profile-key yang cocok di dalam image Docker repo (`src/agents/models.profiles.live.test.ts` dan `src/gateway/gateway-models.profiles.live.test.ts`), me-mount direktori config dan workspace lokal Anda (dan mengambil `~/.profile` jika di-mount). Entry point lokal yang cocok adalah `test:live:models-profiles` dan `test:live:gateway-profiles`.
- Runner live Docker default ke batas smoke yang lebih kecil sehingga sweep Docker penuh tetap praktis:
  `test:docker:live-models` default ke `OPENCLAW_LIVE_MAX_MODELS=12`, dan
  `test:docker:live-gateway` default ke `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, dan
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Override var env tersebut saat Anda
  secara eksplisit menginginkan pemindaian besar yang menyeluruh.
- `test:docker:all` membangun image live Docker sekali melalui `test:docker:live-build`, lalu menggunakannya kembali untuk dua lane live Docker. Perintah ini juga membangun satu image bersama `scripts/e2e/Dockerfile` melalui `test:docker:e2e-build` dan menggunakannya kembali untuk runner smoke container E2E yang menguji aplikasi yang telah dibangun.
- Runner smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, dan `test:docker:config-reload` mem-boot satu atau lebih container nyata dan memverifikasi jalur integrasi tingkat lebih tinggi.

Runner Docker model live juga melakukan bind-mount hanya home auth CLI yang dibutuhkan (atau semua yang didukung saat run tidak dipersempit), lalu menyalinnya ke home container sebelum run agar OAuth CLI eksternal dapat menyegarkan token tanpa mengubah store auth host:

- Model langsung: `pnpm test:docker:live-models` (skrip: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (skrip: `scripts/test-live-acp-bind-docker.sh`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (skrip: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (skrip: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agen dev: `pnpm test:docker:live-gateway` (skrip: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (skrip: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, scaffolding penuh): `pnpm test:docker:onboard` (skrip: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agen tarball npm: `pnpm test:docker:npm-onboard-channel-agent` menginstal tarball OpenClaw yang dikemas secara global di Docker, mengonfigurasi OpenAI melalui onboarding env-ref plus Telegram secara default, memverifikasi doctor memperbaiki dependensi runtime Plugin yang diaktifkan, dan menjalankan satu giliran agen OpenAI yang di-mock. Gunakan kembali tarball prabangun dengan `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati rebuild host dengan `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, atau ganti channel dengan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke instalasi global Bun: `bash scripts/e2e/bun-global-install-smoke.sh` mengemas tree saat ini, menginstalnya dengan `bun install -g` di home terisolasi, dan memverifikasi `openclaw infer image providers --json` mengembalikan penyedia gambar bawaan alih-alih hang. Gunakan kembali tarball prabangun dengan `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati build host dengan `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, atau salin `dist/` dari image Docker yang telah dibangun dengan `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker installer: `bash scripts/test-install-sh-docker.sh` berbagi satu cache npm di seluruh container root, update, dan direct-npm. Smoke update default ke npm `latest` sebagai baseline stabil sebelum upgrade ke tarball kandidat. Pemeriksaan installer non-root mempertahankan cache npm terisolasi agar entri cache milik root tidak menyamarkan perilaku instalasi lokal pengguna. Setel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` untuk menggunakan kembali cache root/update/direct-npm di rerun lokal.
- CI Install Smoke melewati pembaruan global direct-npm duplikat dengan `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; jalankan skrip secara lokal tanpa env itu saat cakupan `npm install -g` langsung diperlukan.
- Jaringan Gateway (dua container, auth + health WS): `pnpm test:docker:gateway-network` (skrip: `scripts/e2e/gateway-network-docker.sh`)
- Regresi penalaran minimal `web_search` OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (skrip: `scripts/e2e/openai-web-search-minimal-docker.sh`) menjalankan server OpenAI yang di-mock melalui Gateway, memverifikasi `web_search` menaikkan `reasoning.effort` dari `minimal` ke `low`, lalu memaksa penolakan skema penyedia dan memeriksa detail mentah muncul di log Gateway.
- Bridge channel MCP (Gateway yang di-seed + bridge stdio + smoke frame notifikasi Claude mentah): `pnpm test:docker:mcp-channels` (skrip: `scripts/e2e/mcp-channels-docker.sh`)
- Alat MCP bundel Pi (server MCP stdio nyata + smoke allow/deny profil Pi tersemat): `pnpm test:docker:pi-bundle-mcp-tools` (skrip: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pembersihan MCP Cron/subagen (Gateway nyata + teardown child MCP stdio setelah Cron terisolasi dan run subagen one-shot): `pnpm test:docker:cron-mcp-cleanup` (skrip: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke install + alias `/plugin` + semantik restart bundel Claude): `pnpm test:docker:plugins` (skrip: `scripts/e2e/plugins-docker.sh`)
- Smoke plugin update unchanged: `pnpm test:docker:plugin-update` (skrip: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke metadata reload config: `pnpm test:docker:config-reload` (skrip: `scripts/e2e/config-reload-source-docker.sh`)
- Dependensi runtime Plugin bawaan: `pnpm test:docker:bundled-channel-deps` membangun image runner Docker kecil secara default, membangun dan mengemas OpenClaw sekali di host, lalu me-mount tarball itu ke setiap skenario instalasi Linux. Gunakan kembali image dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`, lewati rebuild host setelah build lokal baru dengan `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, atau arahkan ke tarball yang ada dengan `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Sempitkan dependensi runtime Plugin bawaan saat iterasi dengan menonaktifkan skenario yang tidak terkait, misalnya:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Untuk membangun sebelumnya dan menggunakan kembali image built-app bersama secara manual:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Override image khusus suite seperti `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` tetap menang saat disetel. Saat `OPENCLAW_SKIP_DOCKER_BUILD=1` menunjuk ke image bersama remote, skrip akan menariknya jika belum ada secara lokal. Pengujian Docker QR dan installer tetap mempertahankan Dockerfile mereka sendiri karena memvalidasi perilaku package/install, bukan runtime built-app bersama.

Runner Docker model live juga melakukan bind-mount checkout saat ini sebagai hanya-baca dan
menahapkannya ke workdir sementara di dalam container. Ini menjaga image runtime
tetap ramping sambil tetap menjalankan Vitest terhadap source/config lokal Anda yang tepat.
Langkah staging melewati cache lokal besar dan output build aplikasi seperti
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, dan direktori output `.build` atau
Gradle lokal-aplikasi sehingga run live Docker tidak menghabiskan menit-menit untuk menyalin
artefak khusus mesin.
Runner ini juga menyetel `OPENCLAW_SKIP_CHANNELS=1` agar probe live gateway tidak memulai
worker channel Telegram/Discord/dll. nyata di dalam container.
`test:docker:live-models` tetap menjalankan `pnpm test:live`, jadi teruskan juga
`OPENCLAW_LIVE_GATEWAY_*` saat Anda perlu mempersempit atau mengecualikan cakupan live
gateway dari lane Docker itu.
`test:docker:openwebui` adalah smoke kompatibilitas tingkat lebih tinggi: perintah ini memulai
container gateway OpenClaw dengan endpoint HTTP yang kompatibel dengan OpenAI diaktifkan,
memulai container Open WebUI yang dipin terhadap gateway tersebut, masuk melalui
Open WebUI, memverifikasi `/api/models` mengekspos `openclaw/default`, lalu mengirim
permintaan chat nyata melalui proxy `/api/chat/completions` milik Open WebUI.
Run pertama bisa terasa jauh lebih lambat karena Docker mungkin perlu menarik
image Open WebUI dan Open WebUI mungkin perlu menyelesaikan cold-start setup-nya sendiri.
Lane ini mengharapkan kunci model live yang dapat digunakan, dan `OPENCLAW_PROFILE_FILE`
(`~/.profile` secara default) adalah cara utama untuk menyediakannya dalam run yang didockerkan.
Run yang berhasil mencetak payload JSON kecil seperti `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` sengaja deterministik dan tidak memerlukan akun
Telegram, Discord, atau iMessage nyata. Perintah ini mem-boot container
Gateway yang di-seed, memulai container kedua yang memunculkan `openclaw mcp serve`, lalu
memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran,
perilaku antrean event live, perutean pengiriman keluar, dan notifikasi channel +
izin bergaya Claude melalui bridge MCP stdio nyata. Pemeriksaan notifikasi
memeriksa frame MCP stdio mentah secara langsung sehingga smoke memvalidasi apa yang
sebenarnya dipancarkan oleh bridge, bukan hanya apa yang kebetulan ditampilkan oleh SDK klien tertentu.
`test:docker:pi-bundle-mcp-tools` deterministik dan tidak memerlukan kunci model live.
Perintah ini membangun image Docker repo, memulai server probe MCP stdio nyata
di dalam container, mematerialisasikan server tersebut melalui runtime MCP bundel Pi
tersemat, mengeksekusi alat, lalu memverifikasi `coding` dan `messaging` tetap
mempertahankan alat `bundle-mcp` sementara `minimal` dan `tools.deny: ["bundle-mcp"]` memfilternya.
`test:docker:cron-mcp-cleanup` deterministik dan tidak memerlukan kunci model live.
Perintah ini memulai Gateway yang di-seed dengan server probe MCP stdio nyata, menjalankan
giliran Cron terisolasi dan giliran child one-shot `/subagents spawn`, lalu memverifikasi
proses child MCP keluar setelah setiap run.

Smoke thread bahasa alami ACP manual (bukan CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Pertahankan skrip ini untuk alur kerja regresi/debug. Skrip ini mungkin diperlukan lagi untuk validasi perutean thread ACP, jadi jangan dihapus.

Var env yang berguna:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) di-mount ke `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) di-mount ke `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (default: `~/.profile`) di-mount ke `/home/node/.profile` dan di-source sebelum menjalankan pengujian
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` untuk memverifikasi hanya var env yang di-source dari `OPENCLAW_PROFILE_FILE`, menggunakan direktori config/workspace sementara dan tanpa mount auth CLI eksternal
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) di-mount ke `/home/node/.npm-global` untuk instalasi CLI yang di-cache di dalam Docker
- Direktori/file auth CLI eksternal di bawah `$HOME` di-mount hanya-baca di bawah `/host-auth...`, lalu disalin ke `/home/node/...` sebelum pengujian dimulai
  - Direktori default: `.minimax`
  - File default: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Run penyedia yang dipersempit hanya me-mount direktori/file yang dibutuhkan yang disimpulkan dari `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manual dengan `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, atau daftar koma seperti `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` untuk mempersempit run
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` untuk memfilter penyedia di dalam container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` untuk menggunakan kembali image `openclaw:local-live` yang sudah ada untuk rerun yang tidak memerlukan rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memastikan kredensial berasal dari store profil (bukan env)
- `OPENCLAW_OPENWEBUI_MODEL=...` untuk memilih model yang diekspos oleh gateway untuk smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` untuk mengoverride prompt pemeriksaan nonce yang digunakan oleh smoke Open WebUI
- `OPENWEBUI_IMAGE=...` untuk mengoverride tag image Open WebUI yang dipin

## Kesehatan dokumentasi

Jalankan pemeriksaan dokumentasi setelah edit dokumentasi: `pnpm check:docs`.
Jalankan validasi anchor Mintlify penuh saat Anda juga membutuhkan pemeriksaan heading dalam halaman: `pnpm docs:check-links:anchors`.

## Regresi offline (aman untuk CI)

Ini adalah regresi “pipeline nyata” tanpa penyedia nyata:

- Tool calling Gateway (OpenAI di-mock, gateway nyata + loop agen): `src/gateway/gateway.test.ts` (kasus: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, menulis config + auth diberlakukan): `src/gateway/gateway.test.ts` (kasus: "runs wizard over ws and writes auth token config")

## Evaluasi keandalan agen (Skills)

Kami sudah memiliki beberapa pengujian aman untuk CI yang berperilaku seperti “evaluasi keandalan agen”:

- Mock tool-calling melalui gateway nyata + loop agen (`src/gateway/gateway.test.ts`).
- Alur wizard end-to-end yang memvalidasi wiring sesi dan efek config (`src/gateway/gateway.test.ts`).

Yang masih kurang untuk Skills (lihat [Skills](/id/tools/skills)):

- **Pengambilan keputusan:** saat Skills tercantum di prompt, apakah agen memilih skill yang tepat (atau menghindari yang tidak relevan)?
- **Kepatuhan:** apakah agen membaca `SKILL.md` sebelum digunakan dan mengikuti langkah/argumen yang diwajibkan?
- **Kontrak alur kerja:** skenario multi-giliran yang menegaskan urutan alat, carryover riwayat sesi, dan batas sandbox.

Evaluasi masa depan seharusnya tetap deterministik terlebih dahulu:

- Runner skenario menggunakan penyedia mock untuk menegaskan pemanggilan alat + urutannya, pembacaan file skill, dan wiring sesi.
- Suite kecil skenario yang berfokus pada skill (gunakan vs hindari, gating, prompt injection).
- Evaluasi live opsional (opt-in, dibatasi env) hanya setelah suite aman untuk CI tersedia.

## Pengujian kontrak (bentuk Plugin dan channel)

Pengujian kontrak memverifikasi bahwa setiap Plugin dan channel yang terdaftar mematuhi
kontrak antarmukanya. Pengujian ini mengiterasi semua Plugin yang ditemukan dan menjalankan suite
penegasan bentuk dan perilaku. Lane unit default `pnpm test` sengaja
melewati file seam bersama dan smoke ini; jalankan perintah kontrak secara eksplisit
saat Anda menyentuh permukaan channel atau penyedia bersama.

### Perintah

- Semua kontrak: `pnpm test:contracts`
- Hanya kontrak channel: `pnpm test:contracts:channels`
- Hanya kontrak penyedia: `pnpm test:contracts:plugins`

### Kontrak channel

Berada di `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Bentuk Plugin dasar (id, nama, kemampuan)
- **setup** - Kontrak wizard setup
- **session-binding** - Perilaku binding sesi
- **outbound-payload** - Struktur payload pesan
- **inbound** - Penanganan pesan masuk
- **actions** - Handler tindakan channel
- **threading** - Penanganan id thread
- **directory** - API direktori/roster
- **group-policy** - Penegakan kebijakan grup

### Kontrak status penyedia

Berada di `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe status channel
- **registry** - Bentuk registry Plugin

### Kontrak penyedia

Berada di `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrak alur auth
- **auth-choice** - Pilihan/pemilihan auth
- **catalog** - API katalog model
- **discovery** - Penemuan Plugin
- **loader** - Pemuatan Plugin
- **runtime** - Runtime penyedia
- **shape** - Bentuk/antarmuka Plugin
- **wizard** - Wizard setup

### Kapan harus dijalankan

- Setelah mengubah export atau subpath plugin-sdk
- Setelah menambahkan atau memodifikasi Plugin channel atau penyedia
- Setelah refactor registrasi atau penemuan Plugin

Pengujian kontrak berjalan di CI dan tidak memerlukan kunci API nyata.

## Menambahkan regresi (panduan)

Saat Anda memperbaiki masalah penyedia/model yang ditemukan di live:

- Tambahkan regresi aman untuk CI jika memungkinkan (penyedia mock/stub, atau tangkap transformasi bentuk permintaan yang tepat)
- Jika secara inheren hanya-live (batas laju, kebijakan auth), pertahankan pengujian live tetap sempit dan opt-in melalui var env
- Pilih menargetkan lapisan terkecil yang menangkap bug:
  - bug konversi/replay permintaan penyedia → pengujian model langsung
  - bug pipeline sesi/riwayat/alat gateway → smoke live gateway atau pengujian mock gateway aman untuk CI
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` menurunkan satu target sampel per kelas SecretRef dari metadata registry (`listSecretTargetRegistryEntries()`), lalu menegaskan id exec segmen traversal ditolak.
  - Jika Anda menambahkan keluarga target SecretRef `includeInPlan` baru di `src/secrets/target-registry-data.ts`, perbarui `classifyTargetClass` di pengujian itu. Pengujian ini sengaja gagal pada id target yang tidak terklasifikasi sehingga kelas baru tidak bisa diam-diam dilewati.

## Terkait

- [Testing live](/id/help/testing-live)
- [CI](/id/ci)
