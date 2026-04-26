---
read_when:
    - Menjalankan pengujian secara lokal atau di CI
    - Menambahkan regresi untuk bug model/provider
    - Men-debug perilaku Gateway + agent
summary: 'Kit pengujian: suite unit/e2e/live, runner Docker, dan cakupan setiap pengujian'
title: Pengujian
x-i18n:
    generated_at: "2026-04-26T11:32:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46c01493284511d99c37a18fc695cc0af19f87eb6d99eb2ef1beec331c290155
    source_path: help/testing.md
    workflow: 15
---

OpenClaw memiliki tiga suite Vitest (unit/integration, e2e, live) dan sejumlah kecil
runner Docker. Dokumen ini adalah panduan "bagaimana kami menguji":

- Apa yang dicakup setiap suite (dan apa yang sengaja _tidak_ dicakup).
- Perintah mana yang dijalankan untuk alur kerja umum (lokal, sebelum push, debugging).
- Bagaimana pengujian live menemukan kredensial dan memilih model/provider.
- Cara menambahkan regresi untuk masalah model/provider dunia nyata.

## Mulai cepat

Pada sebagian besar hari:

- Gate penuh (diharapkan sebelum push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Menjalankan suite penuh lokal yang lebih cepat pada mesin yang lapang: `pnpm test:max`
- Loop watch Vitest langsung: `pnpm test:watch`
- Penargetan file langsung sekarang juga merutekan path extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Lebih baik mulai dengan run yang ditargetkan saat Anda sedang mengiterasi satu kegagalan.
- Situs QA berbasis Docker: `pnpm qa:lab:up`
- Lane QA berbasis Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Saat Anda menyentuh pengujian atau ingin keyakinan ekstra:

- Gate cakupan: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Saat men-debug provider/model nyata (memerlukan kredensial nyata):

- Suite live (model + probe tool/image Gateway): `pnpm test:live`
- Targetkan satu file live dengan tenang: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Sweep model live Docker: `pnpm test:docker:live-models`
  - Setiap model yang dipilih sekarang menjalankan satu giliran teks plus probe kecil bergaya baca-file.
    Model yang metadata-nya mengiklankan input `image` juga menjalankan giliran gambar kecil.
    Nonaktifkan probe tambahan dengan `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` atau
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` saat mengisolasi kegagalan provider.
  - Cakupan CI: `OpenClaw Scheduled Live And E2E Checks` harian dan
    `OpenClaw Release Checks` manual sama-sama memanggil reusable workflow live/E2E dengan
    `include_live_suites: true`, yang mencakup job matriks model live Docker terpisah
    yang di-shard menurut provider.
  - Untuk rerun CI terfokus, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    dengan `include_live_suites: true` dan `live_models_only: true`.
  - Tambahkan secret provider dengan sinyal tinggi baru ke `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dan pemanggil
    terjadwal/rilisnya.
- Smoke bound-chat Codex bawaan: `pnpm test:docker:live-codex-bind`
  - Menjalankan lane live Docker terhadap path app-server Codex, melakukan bind
    Slack DM sintetis dengan `/codex bind`, menjalankan `/codex fast` dan
    `/codex permissions`, lalu memverifikasi balasan biasa dan lampiran gambar
    dirutekan melalui binding Plugin bawaan alih-alih ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Menjalankan giliran agent Gateway melalui harness app-server Codex milik Plugin,
    memverifikasi `/codex status` dan `/codex models`, dan secara default menjalankan probe image,
    Cron MCP, sub-agent, dan Guardian. Nonaktifkan probe sub-agent dengan
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` saat mengisolasi kegagalan
    app-server Codex lainnya. Untuk pemeriksaan sub-agent yang terfokus, nonaktifkan probe lain:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Ini keluar setelah probe sub-agent kecuali
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` disetel.
- Smoke perintah rescue Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Pemeriksaan belt-and-suspenders opt-in untuk
    surface perintah rescue message-channel. Ini menjalankan `/crestodian status`, mengantrekan perubahan
    model persisten, membalas `/crestodian yes`, dan memverifikasi jalur penulisan audit/config.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Menjalankan Crestodian dalam kontainer tanpa config dengan Claude CLI palsu pada `PATH`
    dan memverifikasi fallback planner fuzzy diterjemahkan menjadi penulisan config bertipe yang diaudit.
- Smoke Docker first-run Crestodian: `pnpm test:docker:crestodian-first-run`
  - Memulai dari state dir OpenClaw kosong, merutekan `openclaw` mentah ke
    Crestodian, menerapkan penulisan setup/model/agent/Plugin Discord + SecretRef,
    memvalidasi config, dan memverifikasi entri audit. Jalur setup Ring 0 yang sama
    juga dicakup di QA Lab oleh
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke biaya Moonshot/Kimi: dengan `MOONSHOT_API_KEY` disetel, jalankan
  `openclaw models list --provider moonshot --json`, lalu jalankan
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  yang terisolasi terhadap `moonshot/kimi-k2.6`. Verifikasi JSON melaporkan Moonshot/K2.6 dan
  transkrip assistant menyimpan `usage.cost` yang dinormalisasi.

Tip: saat Anda hanya membutuhkan satu kasus yang gagal, lebih baik mempersempit pengujian live melalui env var allowlist yang dijelaskan di bawah.

## Runner khusus QA

Perintah ini berada di samping suite pengujian utama saat Anda memerlukan realisme QA-lab:

CI menjalankan QA Lab dalam workflow khusus. `Parity gate` berjalan pada PR yang cocok dan
dari dispatch manual dengan provider mock. `QA-Lab - All Lanes` berjalan setiap malam di
`main` dan dari dispatch manual dengan parity gate mock, lane Matrix live, dan lane Telegram live terkelola Convex sebagai job paralel. `OpenClaw Release Checks`
menjalankan lane yang sama sebelum persetujuan rilis.

- `pnpm openclaw qa suite`
  - Menjalankan skenario QA berbasis repo langsung pada host.
  - Menjalankan beberapa skenario terpilih secara paralel secara default dengan worker
    Gateway terisolasi. `qa-channel` default ke konkurensi 4 (dibatasi oleh jumlah
    skenario yang dipilih). Gunakan `--concurrency <count>` untuk menyetel jumlah
    worker, atau `--concurrency 1` untuk lane serial lama.
  - Keluar non-zero bila ada skenario yang gagal. Gunakan `--allow-failures` saat Anda
    menginginkan artefak tanpa exit code gagal.
  - Mendukung mode provider `live-frontier`, `mock-openai`, dan `aimock`.
    `aimock` memulai server provider lokal berbasis AIMock untuk cakupan fixture dan protocol-mock eksperimental tanpa menggantikan
    lane `mock-openai` yang sadar skenario.
- `pnpm openclaw qa suite --runner multipass`
  - Menjalankan suite QA yang sama di dalam Linux VM Multipass sekali pakai.
  - Mempertahankan perilaku pemilihan skenario yang sama seperti `qa suite` pada host.
  - Menggunakan ulang flag pemilihan provider/model yang sama seperti `qa suite`.
  - Run live meneruskan input auth QA yang didukung dan praktis untuk guest:
    key provider berbasis env, path config provider live QA, dan `CODEX_HOME`
    bila ada.
  - Direktori output harus tetap berada di bawah root repo agar guest dapat menulis balik melalui
    workspace yang dimount.
  - Menulis laporan + ringkasan QA normal plus log Multipass di bawah
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Memulai situs QA berbasis Docker untuk pekerjaan QA ala operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Membangun npm tarball dari checkout saat ini, menginstalnya secara global di
    Docker, menjalankan onboarding OpenAI API-key non-interaktif, mengonfigurasi Telegram
    secara default, memverifikasi bahwa mengaktifkan Plugin memasang dependensi runtime sesuai kebutuhan, menjalankan
    doctor, dan menjalankan satu giliran agent lokal terhadap endpoint OpenAI yang dimock.
  - Gunakan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` untuk menjalankan lane instalasi paket
    yang sama dengan Discord.
- `pnpm test:docker:session-runtime-context`
  - Menjalankan smoke Docker built-app deterministik untuk transkrip konteks runtime
    tertanam. Ini memverifikasi konteks runtime OpenClaw tersembunyi dipersistenkan sebagai
    pesan kustom non-tampilan alih-alih bocor ke giliran pengguna yang terlihat,
    lalu melakukan seed pada JSONL sesi rusak yang terpengaruh dan memverifikasi
    `openclaw doctor --fix` menulis ulangnya ke branch aktif dengan backup.
- `pnpm test:docker:npm-telegram-live`
  - Menginstal paket OpenClaw yang dipublikasikan di Docker, menjalankan onboarding
    paket-terinstal, mengonfigurasi Telegram melalui CLI terinstal, lalu menggunakan ulang lane QA Telegram live
    dengan paket terinstal tersebut sebagai SUT Gateway.
  - Default ke `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Menggunakan kredensial env Telegram atau sumber kredensial Convex yang sama seperti
    `pnpm openclaw qa telegram`. Untuk otomatisasi CI/rilis, setel
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` dan role secret. Jika
    `OPENCLAW_QA_CONVEX_SITE_URL` dan role secret Convex ada di CI,
    wrapper Docker memilih Convex secara otomatis.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` menimpa
    `OPENCLAW_QA_CREDENTIAL_ROLE` bersama hanya untuk lane ini.
  - GitHub Actions mengekspos lane ini sebagai workflow maintainer manual
    `NPM Telegram Beta E2E`. Ini tidak berjalan saat merge. Workflow ini menggunakan environment
    `qa-live-shared` dan lease kredensial CI Convex.
- `pnpm test:docker:bundled-channel-deps`
  - Mem-pack dan menginstal build OpenClaw saat ini di Docker, memulai Gateway
    dengan OpenAI yang dikonfigurasi, lalu mengaktifkan saluran/Plugin bawaan melalui
    pengeditan config.
  - Memverifikasi bahwa penemuan setup membiarkan dependensi runtime Plugin yang belum dikonfigurasi tetap
    tidak ada, run Gateway atau doctor pertama yang telah dikonfigurasi memasang dependensi runtime setiap Plugin bawaan sesuai kebutuhan,
    dan restart kedua tidak memasang ulang dependensi yang sudah diaktifkan.
  - Juga menginstal baseline npm lama yang diketahui, mengaktifkan Telegram sebelum menjalankan
    `openclaw update --tag <candidate>`, dan memverifikasi bahwa
    doctor pasca-pembaruan kandidat memperbaiki dependensi runtime saluran bawaan tanpa
    perbaikan postinstall dari sisi harness.
- `pnpm test:parallels:npm-update`
  - Menjalankan smoke pembaruan instalasi paket bawaan lintas guest Parallels. Setiap
    platform terpilih pertama-tama menginstal paket baseline yang diminta, lalu menjalankan
    perintah `openclaw update` yang terinstal pada guest yang sama dan memverifikasi versi
    terinstal, status pembaruan, kesiapan gateway, dan satu giliran agent lokal.
  - Gunakan `--platform macos`, `--platform windows`, atau `--platform linux` saat
    mengiterasi pada satu guest. Gunakan `--json` untuk path artefak ringkasan dan
    status per-lane.
  - Lane OpenAI menggunakan `openai/gpt-5.5` untuk bukti giliran agent live
    secara default. Berikan `--model <provider/model>` atau setel
    `OPENCLAW_PARALLELS_OPENAI_MODEL` saat secara sengaja memvalidasi model OpenAI lain.
  - Bungkus run lokal yang panjang dengan timeout host agar stall transport Parallels tidak
    menghabiskan sisa jendela pengujian:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrip menulis log lane bertingkat di bawah `/tmp/openclaw-parallels-npm-update.*`.
    Periksa `windows-update.log`, `macos-update.log`, atau `linux-update.log`
    sebelum berasumsi wrapper luar macet.
  - Pembaruan Windows dapat menghabiskan 10 hingga 15 menit dalam perbaikan doctor/runtime dependency pasca-pembaruan pada guest dingin; itu tetap sehat saat log debug npm bertingkat terus bergerak.
  - Jangan jalankan wrapper agregat ini secara paralel dengan lane smoke Parallels macOS, Windows, atau Linux individual. Mereka berbagi state VM dan dapat berbenturan pada
    pemulihan snapshot, penyajian paket, atau state gateway guest.
  - Bukti pasca-pembaruan menjalankan surface Plugin bawaan normal karena
    capability facade seperti speech, pembuatan gambar, dan
    pemahaman media dimuat melalui API runtime bawaan bahkan ketika giliran
    agent itu sendiri hanya memeriksa respons teks sederhana.

- `pnpm openclaw qa aimock`
  - Hanya memulai server provider AIMock lokal untuk pengujian smoke protokol langsung.
- `pnpm openclaw qa matrix`
  - Menjalankan lane QA Matrix live terhadap homeserver Tuwunel sekali pakai berbasis Docker.
  - Host QA ini saat ini hanya untuk repo/dev. Instalasi OpenClaw terpaket tidak mengirim
    `qa-lab`, jadi tidak mengekspos `openclaw qa`.
  - Checkout repo memuat runner bawaan secara langsung; tidak diperlukan langkah
    instalasi Plugin terpisah.
  - Menyediakan tiga pengguna Matrix sementara (`driver`, `sut`, `observer`) plus satu room privat, lalu memulai child QA gateway dengan Plugin Matrix nyata sebagai transport SUT.
  - Secara default menggunakan image Tuwunel stabil yang dipatok `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Override dengan `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` saat Anda perlu menguji image lain.
  - Matrix tidak mengekspos flag sumber kredensial bersama karena lane ini menyediakan pengguna sekali pakai secara lokal.
  - Menulis laporan QA Matrix, ringkasan, artefak observed-events, dan log output stdout/stderr gabungan di bawah `.artifacts/qa-e2e/...`.
  - Mengeluarkan progres secara default dan menerapkan timeout run keras dengan `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (default 30 menit). Cleanup dibatasi oleh `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` dan kegagalan menyertakan perintah pemulihan `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Menjalankan lane QA Telegram live terhadap grup privat nyata menggunakan token bot driver dan SUT dari env.
  - Memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Id grup harus berupa numeric chat id Telegram.
  - Mendukung `--credential-source convex` untuk kredensial bersama yang dipool. Gunakan mode env secara default, atau setel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` untuk memilih lease yang dipool.
  - Keluar non-zero saat ada skenario yang gagal. Gunakan `--allow-failures` saat Anda
    menginginkan artefak tanpa exit code gagal.
  - Memerlukan dua bot berbeda dalam grup privat yang sama, dengan bot SUT mengekspos username Telegram.
  - Untuk observasi bot-ke-bot yang stabil, aktifkan Bot-to-Bot Communication Mode di `@BotFather` untuk kedua bot dan pastikan bot driver dapat mengamati traffic bot grup.
  - Menulis laporan QA Telegram, ringkasan, dan artefak observed-messages di bawah `.artifacts/qa-e2e/...`. Skenario balasan menyertakan RTT dari permintaan kirim driver hingga balasan SUT yang teramati.

Lane transport live berbagi satu kontrak standar agar transport baru tidak menyimpang:

`qa-channel` tetap menjadi suite QA sintetis yang luas dan bukan bagian dari matriks cakupan transport live.

| Lane     | Canary | Gating mention | Blok allowlist | Balasan tingkat atas | Lanjut setelah restart | Tindak lanjut thread | Isolasi thread | Observasi reaksi | Perintah help |
| -------- | ------ | -------------- | --------------- | -------------------- | ---------------------- | -------------------- | -------------- | ---------------- | ------------- |
| Matrix   | x      | x              | x               | x                    | x                      | x                    | x              | x                |               |
| Telegram | x      |                |                 |                      |                        |                      |                |                  | x             |

### Kredensial Telegram bersama via Convex (v1)

Saat `--credential-source convex` (atau `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) diaktifkan untuk
`openclaw qa telegram`, QA lab memperoleh lease eksklusif dari pool berbasis Convex, mengirim Heartbeat
untuk lease tersebut saat lane berjalan, dan melepaskan lease saat shutdown.

Scaffold proyek Convex referensi:

- `qa/convex-credential-broker/`

Variabel lingkungan yang diperlukan:

- `OPENCLAW_QA_CONVEX_SITE_URL` (misalnya `https://your-deployment.convex.site`)
- Satu secret untuk peran yang dipilih:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` untuk `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` untuk `ci`
- Pemilihan peran kredensial:
  - CLI: `--credential-role maintainer|ci`
  - Default env: `OPENCLAW_QA_CREDENTIAL_ROLE` (default ke `ci` di CI, `maintainer` selain itu)

Variabel lingkungan opsional:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (default `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (default `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (default `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (default `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (default `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id trace opsional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` mengizinkan URL Convex loopback `http://` hanya untuk pengembangan lokal.

`OPENCLAW_QA_CONVEX_SITE_URL` sebaiknya menggunakan `https://` dalam operasi normal.

Perintah admin maintainer (tambah/hapus/daftar pool) memerlukan
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` secara khusus.

Helper CLI untuk maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gunakan `doctor` sebelum run live untuk memeriksa URL situs Convex, secret broker,
prefiks endpoint, timeout HTTP, dan keterjangkauan admin/list tanpa mencetak
nilai secret. Gunakan `--json` untuk output yang dapat dibaca mesin dalam skrip dan utilitas CI.

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
  - Guard lease aktif: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (hanya secret maintainer)
  - Permintaan: `{ kind?, status?, includePayload?, limit? }`
  - Berhasil: `{ status: "ok", credentials, count }`

Bentuk payload untuk jenis Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` harus berupa string numeric chat id Telegram.
- `admin/add` memvalidasi bentuk ini untuk `kind: "telegram"` dan menolak payload yang malformed.

### Menambahkan saluran ke QA

Menambahkan saluran ke sistem QA markdown memerlukan tepat dua hal:

1. Adapter transport untuk saluran tersebut.
2. Paket skenario yang menjalankan kontrak saluran.

Jangan tambahkan root perintah QA tingkat atas baru ketika host `qa-lab` bersama dapat
memiliki alur tersebut.

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
- bagaimana event masuk diinjeksi
- bagaimana pesan keluar diamati
- bagaimana transkrip dan state transport yang dinormalisasi diekspos
- bagaimana aksi berbasis transport dieksekusi
- bagaimana reset atau cleanup khusus transport ditangani

Standar adopsi minimum untuk saluran baru adalah:

1. Pertahankan `qa-lab` sebagai pemilik root `qa` bersama.
2. Implementasikan runner transport pada seam host `qa-lab` bersama.
3. Pertahankan mekanik khusus transport di dalam Plugin runner atau harness saluran.
4. Pasang runner sebagai `openclaw qa <runner>` alih-alih mendaftarkan root perintah yang bersaing.
   Plugin runner harus mendeklarasikan `qaRunners` di `openclaw.plugin.json` dan mengekspor array `qaRunnerCliRegistrations` yang cocok dari `runtime-api.ts`.
   Jaga `runtime-api.ts` tetap ringan; CLI malas dan eksekusi runner harus tetap berada di belakang entrypoint terpisah.
5. Tulis atau adaptasikan skenario markdown di bawah direktori bertema `qa/scenarios/`.
6. Gunakan helper skenario generik untuk skenario baru.
7. Pertahankan alias kompatibilitas yang ada tetap berfungsi kecuali repo sedang melakukan migrasi yang disengaja.

Aturan keputusannya ketat:

- Jika perilaku dapat diekspresikan sekali di `qa-lab`, letakkan di `qa-lab`.
- Jika perilaku bergantung pada satu transport saluran, pertahankan di Plugin runner atau harness Plugin tersebut.
- Jika skenario membutuhkan kapabilitas baru yang dapat digunakan lebih dari satu saluran, tambahkan helper generik alih-alih cabang khusus saluran di `suite.ts`.
- Jika suatu perilaku hanya bermakna untuk satu transport, pertahankan skenario tetap khusus transport dan buat itu eksplisit dalam kontrak skenario.

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

Pekerjaan saluran baru sebaiknya menggunakan nama helper generik.
Alias kompatibilitas ada untuk menghindari migrasi besar sekaligus, bukan sebagai model untuk penulisan skenario baru.

## Suite pengujian (apa yang berjalan di mana)

Pikirkan suite sebagai “realisme yang meningkat” (dan flakiness/biaya yang meningkat):

### Unit / integration (default)

- Perintah: `pnpm test`
- Config: run yang tidak ditargetkan menggunakan set shard `vitest.full-*.config.ts` dan dapat memperluas shard multi-project menjadi config per-project untuk penjadwalan paralel
- File: inventaris core/unit di bawah `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts`, dan pengujian node `ui` yang di-whitelist yang dicakup oleh `vitest.unit.config.ts`
- Cakupan:
  - Pengujian unit murni
  - Pengujian integration in-process (auth Gateway, perutean, tooling, parsing, config)
  - Regresi deterministik untuk bug yang diketahui
- Ekspektasi:
  - Berjalan di CI
  - Tidak memerlukan key nyata
  - Harus cepat dan stabil

<AccordionGroup>
  <Accordion title="Proyek, shard, dan lane bercakupan">

    - Run `pnpm test` yang tidak ditargetkan menggunakan dua belas config shard yang lebih kecil (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) alih-alih satu proses root-project bawaan yang sangat besar. Ini mengurangi puncak RSS pada mesin yang sibuk dan menghindari pekerjaan auto-reply/extension membuat suite lain kelaparan.
    - `pnpm test --watch` tetap menggunakan graf proyek root `vitest.config.ts` bawaan, karena loop watch multi-shard tidak praktis.
    - `pnpm test`, `pnpm test:watch`, dan `pnpm test:perf:imports` merutekan target file/direktori eksplisit melalui lane bercakupan terlebih dahulu, jadi `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tidak perlu membayar biaya startup penuh root project.
    - `pnpm test:changed` memperluas path git yang berubah ke lane bercakupan yang sama saat diff hanya menyentuh file source/test yang dapat dirutekan; edit config/setup tetap fallback ke rerun root-project yang lebih luas.
    - `pnpm check:changed` adalah gate lokal cerdas normal untuk pekerjaan sempit. Ia mengklasifikasikan diff menjadi core, pengujian core, extensions, pengujian extension, apps, docs, metadata rilis, tooling Docker live, dan tooling, lalu menjalankan lane typecheck/lint/test yang cocok. Perubahan SDK Plugin publik dan plugin-contract mencakup satu pass validasi extension karena extension bergantung pada kontrak core tersebut. Kenaikan versi khusus metadata rilis menjalankan pemeriksaan versi/config/dependensi root yang ditargetkan alih-alih suite penuh, dengan guard yang menolak perubahan package di luar field versi tingkat atas.
    - Edit harness ACP Docker live menjalankan gate lokal yang terfokus: sintaks shell untuk skrip auth Docker live, dry-run scheduler Docker live, pengujian unit bind ACP, dan pengujian extension ACPX. Perubahan `package.json` hanya disertakan ketika diff terbatas pada `scripts["test:docker:live-*"]`; edit dependensi, export, versi, dan surface package lainnya tetap menggunakan guard yang lebih luas.
    - Pengujian unit ringan-impor dari agents, commands, plugins, helper auto-reply, `plugin-sdk`, dan area utilitas murni serupa dirutekan melalui lane `unit-fast`, yang melewati `test/setup-openclaw-runtime.ts`; file yang berat pada state/runtime tetap berada di lane yang ada.
    - Beberapa file source helper `plugin-sdk` dan `commands` yang dipilih juga memetakan run mode-changed ke pengujian sibling eksplisit di lane ringan tersebut, sehingga edit helper menghindari rerun seluruh suite berat untuk direktori itu.
    - `auto-reply` memiliki bucket khusus untuk helper core tingkat atas, pengujian integration `reply.*` tingkat atas, dan subtree `src/auto-reply/reply/**`. CI selanjutnya membagi subtree reply menjadi shard agent-runner, dispatch, dan commands/state-routing agar satu bucket yang berat-impor tidak memiliki seluruh tail Node.

  </Accordion>

  <Accordion title="Cakupan embedded runner">

    - Saat Anda mengubah input penemuan message-tool atau konteks runtime
      Compaction, pertahankan kedua tingkat cakupan.
    - Tambahkan regresi helper yang terfokus untuk batas perutean dan normalisasi
      murni.
    - Jaga suite integration embedded runner tetap sehat:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, dan
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Suite tersebut memverifikasi bahwa id bercakupan dan perilaku Compaction tetap mengalir
      melalui path `run.ts` / `compact.ts` yang nyata; pengujian khusus-helper
      bukan pengganti yang memadai untuk path integration tersebut.

  </Accordion>

  <Accordion title="Default pool dan isolasi Vitest">

    - Config Vitest dasar default ke `threads`.
    - Config Vitest bersama menetapkan `isolate: false` dan menggunakan runner
      non-isolated di seluruh root projects, config e2e, dan live.
    - Lane UI root mempertahankan setup dan optimizer `jsdom`-nya, tetapi tetap berjalan pada
      runner non-isolated bersama.
    - Setiap shard `pnpm test` mewarisi default `threads` + `isolate: false`
      yang sama dari config Vitest bersama.
    - `scripts/run-vitest.mjs` menambahkan `--no-maglev` untuk proses Node child Vitest
      secara default untuk mengurangi churn kompilasi V8 selama run lokal besar.
      Setel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` untuk membandingkan dengan
      perilaku V8 bawaan.

  </Accordion>

  <Accordion title="Iterasi lokal cepat">

    - `pnpm changed:lanes` menampilkan lane arsitektural mana yang dipicu oleh suatu diff.
    - Hook pre-commit hanya untuk pemformatan. Ia men-stage ulang file yang diformat dan
      tidak menjalankan lint, typecheck, atau pengujian.
    - Jalankan `pnpm check:changed` secara eksplisit sebelum handoff atau push saat Anda
      memerlukan gate lokal cerdas. Perubahan SDK Plugin publik dan plugin-contract
      mencakup satu pass validasi extension.
    - `pnpm test:changed` merutekan melalui lane bercakupan saat path yang berubah
      dipetakan dengan bersih ke suite yang lebih kecil.
    - `pnpm test:max` dan `pnpm test:changed:max` mempertahankan perilaku perutean yang sama,
      hanya dengan batas worker yang lebih tinggi.
    - Auto-scaling worker lokal sengaja konservatif dan mengurangi beban saat
      load average host sudah tinggi, sehingga beberapa run Vitest serentak
      secara default tidak terlalu merusak.
    - Config Vitest dasar menandai file projects/config sebagai
      `forceRerunTriggers` agar rerun mode-changed tetap benar saat wiring pengujian berubah.
    - Config menjaga `OPENCLAW_VITEST_FS_MODULE_CACHE` tetap aktif pada host yang didukung;
      setel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` jika Anda menginginkan
      satu lokasi cache eksplisit untuk profiling langsung.

  </Accordion>

  <Accordion title="Debugging performa">

    - `pnpm test:perf:imports` mengaktifkan pelaporan durasi impor Vitest plus
      output rincian impor.
    - `pnpm test:perf:imports:changed` membatasi tampilan profiling yang sama ke
      file yang berubah sejak `origin/main`.
    - Data waktu shard ditulis ke `.artifacts/vitest-shard-timings.json`.
      Run seluruh-config menggunakan path config sebagai kuncinya; shard CI berpola include
      menambahkan nama shard agar shard yang difilter dapat dilacak
      secara terpisah.
    - Saat satu hot test masih menghabiskan sebagian besar waktunya pada import startup,
      simpan dependensi berat di balik seam lokal `*.runtime.ts` yang sempit dan
      mock seam tersebut secara langsung alih-alih deep-import helper runtime hanya
      untuk meneruskannya melalui `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan
      `test:changed` yang dirutekan terhadap path root-project bawaan untuk diff yang di-commit tersebut dan mencetak wall time plus RSS maksimum macOS.
    - `pnpm test:perf:changed:bench -- --worktree` membenchmark dirty tree saat ini dengan merutekan daftar file yang berubah melalui
      `scripts/test-projects.mjs` dan config root Vitest.
    - `pnpm test:perf:profile:main` menulis profil CPU main-thread untuk
      overhead startup dan transform Vitest/Vite.
    - `pnpm test:perf:profile:runner` menulis profil CPU+heap runner untuk
      suite unit dengan paralelisme file dinonaktifkan.

  </Accordion>
</AccordionGroup>

### Stability (Gateway)

- Perintah: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, dipaksa ke satu worker
- Cakupan:
  - Memulai Gateway loopback nyata dengan diagnostik aktif secara default
  - Menggerakkan churn pesan gateway sintetis, memori, dan payload besar melalui jalur event diagnostik
  - Melakukan query `diagnostics.stability` melalui WS RPC Gateway
  - Mencakup helper persistensi bundle stability diagnostik
  - Menegaskan recorder tetap dibatasi, sampel RSS sintetis tetap di bawah anggaran tekanan, dan kedalaman antrean per-sesi kembali turun ke nol
- Ekspektasi:
  - Aman untuk CI dan tanpa key
  - Lane sempit untuk tindak lanjut regresi stability, bukan pengganti suite Gateway penuh

### E2E (smoke Gateway)

- Perintah: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, dan pengujian E2E Plugin bawaan di bawah `extensions/`
- Default runtime:
  - Menggunakan Vitest `threads` dengan `isolate: false`, sesuai dengan seluruh repo.
  - Menggunakan worker adaptif (CI: hingga 2, lokal: 1 secara default).
  - Berjalan dalam mode senyap secara default untuk mengurangi overhead I/O konsol.
- Override yang berguna:
  - `OPENCLAW_E2E_WORKERS=<n>` untuk memaksa jumlah worker (dibatasi hingga 16).
  - `OPENCLAW_E2E_VERBOSE=1` untuk mengaktifkan kembali output konsol verbose.
- Cakupan:
  - Perilaku end-to-end Gateway multi-instance
  - Surface WebSocket/HTTP, pairing Node, dan networking yang lebih berat
- Ekspektasi:
  - Berjalan di CI (saat diaktifkan di pipeline)
  - Tidak memerlukan key nyata
  - Lebih banyak bagian bergerak dibanding pengujian unit (bisa lebih lambat)

### E2E: smoke backend OpenShell

- Perintah: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Cakupan:
  - Memulai Gateway OpenShell terisolasi di host melalui Docker
  - Membuat sandbox dari Dockerfile lokal sementara
  - Menjalankan backend OpenShell OpenClaw melalui `sandbox ssh-config` + exec SSH nyata
  - Memverifikasi perilaku filesystem kanonis-jarak-jauh melalui bridge fs sandbox
- Ekspektasi:
  - Hanya opt-in; bukan bagian dari run default `pnpm test:e2e`
  - Memerlukan CLI `openshell` lokal plus daemon Docker yang berfungsi
  - Menggunakan `HOME` / `XDG_CONFIG_HOME` terisolasi, lalu menghancurkan Gateway dan sandbox pengujian
- Override yang berguna:
  - `OPENCLAW_E2E_OPENSHELL=1` untuk mengaktifkan pengujian saat menjalankan suite e2e yang lebih luas secara manual
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` untuk menunjuk ke binary CLI non-default atau wrapper script

### Live (provider nyata + model nyata)

- Perintah: `pnpm test:live`
- Config: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, dan pengujian live Plugin bawaan di bawah `extensions/`
- Default: **aktif** oleh `pnpm test:live` (menyetel `OPENCLAW_LIVE_TEST=1`)
- Cakupan:
  - “Apakah provider/model ini benar-benar berfungsi _hari ini_ dengan kredensial nyata?”
  - Menangkap perubahan format provider, kekhasan pemanggilan tool, masalah auth, dan perilaku rate limit
- Ekspektasi:
  - Sengaja tidak stabil untuk CI (jaringan nyata, kebijakan provider nyata, kuota, gangguan)
  - Menghabiskan uang / menggunakan rate limit
  - Lebih baik menjalankan subset yang dipersempit daripada “semuanya”
- Run live melakukan source `~/.profile` untuk mengambil API key yang hilang.
- Secara default, run live tetap mengisolasi `HOME` dan menyalin material config/auth ke home pengujian sementara agar fixture unit tidak dapat memodifikasi `~/.openclaw` nyata Anda.
- Setel `OPENCLAW_LIVE_USE_REAL_HOME=1` hanya saat Anda memang ingin pengujian live menggunakan direktori home nyata Anda.
- `pnpm test:live` sekarang default ke mode yang lebih senyap: tetap mempertahankan output progres `[live] ...`, tetapi menekan pemberitahuan `~/.profile` tambahan dan membisukan log bootstrap Gateway/chatter Bonjour. Setel `OPENCLAW_LIVE_TEST_QUIET=0` jika Anda ingin log startup penuh kembali.
- Rotasi API key (khusus provider): setel `*_API_KEYS` dengan format koma/titik koma atau `*_API_KEY_1`, `*_API_KEY_2` (misalnya `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) atau override per-live melalui `OPENCLAW_LIVE_*_KEY`; pengujian akan mencoba ulang pada respons rate limit.
- Output progres/Heartbeat:
  - Suite live sekarang mengeluarkan baris progres ke stderr sehingga pemanggilan provider yang panjang tampak aktif secara visual bahkan ketika penangkapan konsol Vitest senyap.
  - `vitest.live.config.ts` menonaktifkan intersepsi konsol Vitest sehingga baris progres provider/gateway langsung mengalir selama run live.
  - Setel Heartbeat model langsung dengan `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Setel Heartbeat gateway/probe dengan `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Suite mana yang sebaiknya saya jalankan?

Gunakan tabel keputusan ini:

- Mengedit logika/pengujian: jalankan `pnpm test` (dan `pnpm test:coverage` jika Anda banyak mengubah)
- Menyentuh networking Gateway / protokol WS / pairing: tambahkan `pnpm test:e2e`
- Men-debug “bot saya mati” / kegagalan khusus provider / pemanggilan tool: jalankan `pnpm test:live` yang dipersempit

## Pengujian live (menyentuh jaringan)

Untuk matriks model live, smoke backend CLI, smoke ACP, harness app-server Codex,
dan semua pengujian live provider media (Deepgram, BytePlus, ComfyUI, image,
musik, video, media harness) — plus penanganan kredensial untuk run live — lihat
[Pengujian — suite live](/id/help/testing-live).

## Runner Docker (opsional, pemeriksaan "berfungsi di Linux")

Runner Docker ini dibagi menjadi dua bucket:

- Runner model-live: `test:docker:live-models` dan `test:docker:live-gateway` hanya menjalankan file live dengan profile-key yang cocok di dalam image Docker repo (`src/agents/models.profiles.live.test.ts` dan `src/gateway/gateway-models.profiles.live.test.ts`), dengan mount direktori config dan workspace lokal Anda (serta melakukan source `~/.profile` jika dimount). Entrypoint lokal yang cocok adalah `test:live:models-profiles` dan `test:live:gateway-profiles`.
- Runner live Docker secara default menggunakan batas smoke yang lebih kecil agar satu sweep Docker penuh tetap praktis:
  `test:docker:live-models` default ke `OPENCLAW_LIVE_MAX_MODELS=12`, dan
  `test:docker:live-gateway` default ke `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, dan
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Override env var tersebut saat Anda
  secara eksplisit menginginkan pemindaian lengkap yang lebih besar.
- `test:docker:all` membangun image Docker live sekali melalui `test:docker:live-build`, lalu menggunakannya kembali untuk lane Docker live. Ia juga membangun satu image `scripts/e2e/Dockerfile` bersama melalui `test:docker:e2e-build` dan menggunakannya kembali untuk runner smoke kontainer E2E yang menjalankan built app. Agregat ini menggunakan scheduler lokal berbobot: `OPENCLAW_DOCKER_ALL_PARALLELISM` mengontrol slot proses, sementara batas resource menjaga lane live berat, npm-install, dan multi-service agar tidak semuanya dimulai sekaligus. Default adalah 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; setel `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` hanya ketika host Docker memiliki lebih banyak ruang. Runner melakukan preflight Docker secara default, menghapus kontainer OpenClaw E2E yang basi, mencetak status setiap 30 detik, menyimpan timing lane yang berhasil di `.artifacts/docker-tests/lane-timings.json`, dan menggunakan timing tersebut untuk memulai lane yang lebih lama terlebih dahulu pada run berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifest lane berbobot tanpa membangun atau menjalankan Docker.
- Runner smoke kontainer: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, dan `test:docker:config-reload` mem-boot satu atau lebih kontainer nyata dan memverifikasi jalur integration tingkat lebih tinggi.

Runner Docker model-live juga melakukan bind-mount hanya pada home auth CLI yang dibutuhkan (atau semuanya yang didukung saat run tidak dipersempit), lalu menyalinnya ke home kontainer sebelum run agar OAuth CLI eksternal dapat me-refresh token tanpa memutasi auth store host:

- Model langsung: `pnpm test:docker:live-models` (skrip: `scripts/test-live-models-docker.sh`)
- Smoke bind ACP: `pnpm test:docker:live-acp-bind` (skrip: `scripts/test-live-acp-bind-docker.sh`; mencakup Claude, Codex, dan Gemini secara default, dengan cakupan Droid/OpenCode strict melalui `pnpm test:docker:live-acp-bind:droid` dan `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (skrip: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (skrip: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev: `pnpm test:docker:live-gateway` (skrip: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (skrip: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, scaffolding penuh): `pnpm test:docker:onboard` (skrip: `scripts/e2e/onboard-docker.sh`)
- Smoke npm tarball onboarding/channel/agent: `pnpm test:docker:npm-onboard-channel-agent` menginstal tarball OpenClaw yang di-pack secara global di Docker, mengonfigurasi OpenAI melalui onboarding env-ref plus Telegram secara default, memverifikasi doctor memperbaiki deps runtime Plugin yang diaktifkan, dan menjalankan satu giliran agent OpenAI yang dimock. Gunakan ulang tarball pra-bangun dengan `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati rebuild host dengan `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, atau ganti saluran dengan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke pergantian saluran update: `pnpm test:docker:update-channel-switch` menginstal tarball OpenClaw yang di-pack secara global di Docker, beralih dari paket `stable` ke git `dev`, memverifikasi bahwa saluran yang dipersistenkan dan pasca-pembaruan Plugin berfungsi, lalu beralih kembali ke paket `stable` dan memeriksa status update.
- Smoke konteks runtime sesi: `pnpm test:docker:session-runtime-context` memverifikasi persistensi transkrip konteks runtime tersembunyi plus perbaikan doctor pada branch tulis-ulang prompt ganda yang terpengaruh.
- Smoke instalasi global Bun: `bash scripts/e2e/bun-global-install-smoke.sh` mem-pack tree saat ini, menginstalnya dengan `bun install -g` pada home terisolasi, dan memverifikasi `openclaw infer image providers --json` mengembalikan provider image bawaan alih-alih macet. Gunakan ulang tarball pra-bangun dengan `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati build host dengan `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, atau salin `dist/` dari image Docker yang sudah dibangun dengan `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker installer: `bash scripts/test-install-sh-docker.sh` berbagi satu cache npm di seluruh kontainer root, update, dan direct-npm. Smoke update default ke npm `latest` sebagai baseline stabil sebelum upgrade ke candidate tarball. Pemeriksaan installer non-root mempertahankan cache npm terisolasi agar entri cache milik root tidak menutupi perilaku instalasi lokal pengguna. Setel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` untuk menggunakan ulang cache root/update/direct-npm di seluruh rerun lokal.
- CI Install Smoke melewati update global direct-npm duplikat dengan `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; jalankan skrip secara lokal tanpa env tersebut saat cakupan `npm install -g` langsung dibutuhkan.
- Smoke CLI hapus workspace bersama agents: `pnpm test:docker:agents-delete-shared-workspace` (skrip: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) membangun image Dockerfile root secara default, melakukan seed pada dua agent dengan satu workspace di home kontainer terisolasi, menjalankan `agents delete --json`, dan memverifikasi JSON yang valid plus perilaku workspace yang dipertahankan. Gunakan ulang image install-smoke dengan `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Networking Gateway (dua kontainer, auth WS + health): `pnpm test:docker:gateway-network` (skrip: `scripts/e2e/gateway-network-docker.sh`)
- Smoke snapshot browser CDP: `pnpm test:docker:browser-cdp-snapshot` (skrip: `scripts/e2e/browser-cdp-snapshot-docker.sh`) membangun image E2E sumber plus layer Chromium, memulai Chromium dengan CDP mentah, menjalankan `browser doctor --deep`, dan memverifikasi snapshot peran CDP mencakup URL tautan, clickable yang dipromosikan oleh kursor, ref iframe, dan metadata frame.
- Regresi reasoning minimal OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrip: `scripts/e2e/openai-web-search-minimal-docker.sh`) menjalankan server OpenAI yang dimock melalui Gateway, memverifikasi `web_search` menaikkan `reasoning.effort` dari `minimal` ke `low`, lalu memaksa schema reject provider dan memeriksa detail mentah muncul di log Gateway.
- Bridge saluran MCP (Gateway seeded + bridge stdio + smoke notification-frame Claude mentah): `pnpm test:docker:mcp-channels` (skrip: `scripts/e2e/mcp-channels-docker.sh`)
- Tool MCP bundel Pi (server MCP stdio nyata + smoke allow/deny profil Pi tertanam): `pnpm test:docker:pi-bundle-mcp-tools` (skrip: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cleanup MCP Cron/subagent (Gateway nyata + teardown child MCP stdio setelah run Cron terisolasi dan subagent one-shot): `pnpm test:docker:cron-mcp-cleanup` (skrip: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke instalasi, instal/uninstal ClawHub, pembaruan marketplace, dan aktifkan/periksa bundel Claude): `pnpm test:docker:plugins` (skrip: `scripts/e2e/plugins-docker.sh`)
  Setel `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` untuk melewati blok ClawHub live, atau override package default dengan `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` dan `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`.
- Smoke tidak berubah untuk update Plugin: `pnpm test:docker:plugin-update` (skrip: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke metadata reload config: `pnpm test:docker:config-reload` (skrip: `scripts/e2e/config-reload-source-docker.sh`)
- Deps runtime Plugin bawaan: `pnpm test:docker:bundled-channel-deps` membangun image runner Docker kecil secara default, membangun dan mem-pack OpenClaw sekali di host, lalu me-mount tarball itu ke setiap skenario instalasi Linux. Gunakan ulang image dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`, lewati rebuild host setelah build lokal baru dengan `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, atau arahkan ke tarball yang ada dengan `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Agregat Docker penuh mem-pack tarball ini sekali, lalu membagi pemeriksaan saluran bawaan ke lane independen, termasuk lane update terpisah untuk Telegram, Discord, Slack, Feishu, memory-lancedb, dan ACPX. Gunakan `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` untuk mempersempit matriks saluran saat menjalankan lane bawaan secara langsung, atau `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` untuk mempersempit skenario update. Lane ini juga memverifikasi bahwa `channels.<id>.enabled=false` dan `plugins.entries.<id>.enabled=false` menekan perbaikan doctor/dependensi runtime.
- Sempitkan deps runtime Plugin bawaan saat iterasi dengan menonaktifkan skenario yang tidak terkait, misalnya:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Untuk membangun lebih dulu dan menggunakan ulang image built-app bersama secara manual:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Override image khusus suite seperti `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` tetap menang saat disetel. Saat `OPENCLAW_SKIP_DOCKER_BUILD=1` menunjuk ke image bersama jarak jauh, skrip akan menariknya jika belum ada secara lokal. Pengujian Docker QR dan installer tetap mempertahankan Dockerfile sendiri karena mereka memvalidasi perilaku package/install alih-alih runtime built-app bersama.

Runner Docker model-live juga melakukan bind-mount checkout saat ini sebagai read-only dan
men-stage-nya ke workdir sementara di dalam kontainer. Ini menjaga image runtime
tetap ramping sambil tetap menjalankan Vitest terhadap source/config lokal Anda yang persis.
Langkah staging melewati cache besar yang hanya lokal dan output build app seperti
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, dan direktori output `.build` lokal app atau
Gradle sehingga run live Docker tidak menghabiskan waktu ber menit-menit menyalin
artefak yang spesifik untuk mesin.
Runner ini juga menyetel `OPENCLAW_SKIP_CHANNELS=1` agar probe live gateway tidak memulai
worker saluran Telegram/Discord/dll. nyata di dalam kontainer.
`test:docker:live-models` tetap menjalankan `pnpm test:live`, jadi teruskan
`OPENCLAW_LIVE_GATEWAY_*` juga saat Anda perlu mempersempit atau mengecualikan cakupan
live gateway dari lane Docker tersebut.
`test:docker:openwebui` adalah smoke kompatibilitas tingkat lebih tinggi: ia memulai
kontainer gateway OpenClaw dengan endpoint HTTP yang kompatibel dengan OpenAI aktif,
memulai kontainer Open WebUI yang dipatok terhadap gateway tersebut, login melalui
Open WebUI, memverifikasi `/api/models` mengekspos `openclaw/default`, lalu mengirim
permintaan chat nyata melalui proxy `/api/chat/completions` milik Open WebUI.
Run pertama bisa terasa lebih lambat karena Docker mungkin perlu menarik image
Open WebUI dan Open WebUI mungkin perlu menyelesaikan setup cold-start miliknya sendiri.
Lane ini mengharapkan key model live yang dapat digunakan, dan `OPENCLAW_PROFILE_FILE`
(`~/.profile` secara default) adalah cara utama untuk menyediakannya dalam run berbasis Docker.
Run yang berhasil mencetak payload JSON kecil seperti `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` sengaja deterministik dan tidak memerlukan akun
Telegram, Discord, atau iMessage nyata. Ia mem-boot
kontainer Gateway seeded, memulai kontainer kedua yang menjalankan `openclaw mcp serve`, lalu
memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran,
perilaku antrean event live, perutean pengiriman keluar, dan notifikasi ala Claude untuk saluran +
izin melalui bridge MCP stdio yang nyata. Pemeriksaan notifikasi
memeriksa frame MCP stdio mentah secara langsung sehingga smoke ini memvalidasi apa yang benar-benar dikeluarkan bridge,
bukan hanya apa yang kebetulan ditampilkan oleh SDK klien tertentu.
`test:docker:pi-bundle-mcp-tools` bersifat deterministik dan tidak memerlukan
key model live. Ia membangun image Docker repo, memulai server probe MCP stdio nyata
di dalam kontainer, mewujudkan server itu melalui runtime MCP bundel Pi tertanam,
mengeksekusi tool, lalu memverifikasi `coding` dan `messaging` mempertahankan
tool `bundle-mcp` sementara `minimal` dan `tools.deny: ["bundle-mcp"]` memfilternya.
`test:docker:cron-mcp-cleanup` bersifat deterministik dan tidak memerlukan key model live.
Ia memulai Gateway seeded dengan server probe MCP stdio nyata, menjalankan
giliran Cron terisolasi dan giliran child one-shot `/subagents spawn`, lalu memverifikasi
proses child MCP keluar setelah setiap run.

Smoke thread bahasa alami ACP manual (bukan CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Simpan skrip ini untuk alur kerja regresi/debug. Skrip ini mungkin diperlukan lagi untuk validasi perutean thread ACP, jadi jangan dihapus.

Variabel lingkungan yang berguna:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) dimount ke `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) dimount ke `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (default: `~/.profile`) dimount ke `/home/node/.profile` dan di-source sebelum menjalankan pengujian
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` untuk memverifikasi hanya env var yang di-source dari `OPENCLAW_PROFILE_FILE`, menggunakan direktori config/workspace sementara dan tanpa mount auth CLI eksternal
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) dimount ke `/home/node/.npm-global` untuk instalasi CLI cache di dalam Docker
- Direktori/file auth CLI eksternal di bawah `$HOME` dimount read-only di bawah `/host-auth...`, lalu disalin ke `/home/node/...` sebelum pengujian dimulai
  - Direktori default: `.minimax`
  - File default: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Run provider yang dipersempit hanya memount direktori/file yang dibutuhkan yang disimpulkan dari `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override manual dengan `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, atau daftar koma seperti `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` untuk mempersempit run
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` untuk memfilter provider di dalam kontainer
- `OPENCLAW_SKIP_DOCKER_BUILD=1` untuk menggunakan ulang image `openclaw:local-live` yang ada untuk rerun yang tidak memerlukan rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memastikan kredensial berasal dari store profil (bukan env)
- `OPENCLAW_OPENWEBUI_MODEL=...` untuk memilih model yang diekspos oleh gateway untuk smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` untuk menimpa prompt pemeriksaan nonce yang digunakan oleh smoke Open WebUI
- `OPENWEBUI_IMAGE=...` untuk menimpa tag image Open WebUI yang dipatok

## Kesehatan dokumentasi

Jalankan pemeriksaan docs setelah edit docs: `pnpm check:docs`.
Jalankan validasi anchor Mintlify penuh saat Anda juga memerlukan pemeriksaan heading di dalam halaman: `pnpm docs:check-links:anchors`.

## Regresi offline (aman untuk CI)

Ini adalah regresi “pipeline nyata” tanpa provider nyata:

- Pemanggilan tool Gateway (mock OpenAI, loop Gateway + agent nyata): `src/gateway/gateway.test.ts` (kasus: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, penulisan config + auth diterapkan): `src/gateway/gateway.test.ts` (kasus: "runs wizard over ws and writes auth token config")

## Evaluasi keandalan agent (Skills)

Kami sudah memiliki beberapa pengujian aman untuk CI yang berperilaku seperti “evaluasi keandalan agent”:

- Mock tool-calling melalui loop Gateway + agent nyata (`src/gateway/gateway.test.ts`).
- Alur wizard end-to-end yang memvalidasi wiring sesi dan efek config (`src/gateway/gateway.test.ts`).

Yang masih kurang untuk Skills (lihat [Skills](/id/tools/skills)):

- **Pengambilan keputusan:** saat Skills tercantum di prompt, apakah agent memilih Skill yang tepat (atau menghindari yang tidak relevan)?
- **Kepatuhan:** apakah agent membaca `SKILL.md` sebelum penggunaan dan mengikuti langkah/argumen yang diwajibkan?
- **Kontrak alur kerja:** skenario multi-giliran yang menegaskan urutan tool, carryover riwayat sesi, dan batas sandbox.

Evaluasi mendatang sebaiknya tetap deterministik terlebih dahulu:

- Runner skenario yang menggunakan provider mock untuk menegaskan pemanggilan tool + urutan, pembacaan file Skill, dan wiring sesi.
- Suite kecil skenario yang berfokus pada Skill (gunakan vs hindari, gating, prompt injection).
- Evaluasi live opsional (opt-in, di-gate env) hanya setelah suite aman untuk CI tersedia.

## Pengujian kontrak (bentuk Plugin dan saluran)

Pengujian kontrak memverifikasi bahwa setiap Plugin dan saluran terdaftar mematuhi
kontrak antarmukanya. Pengujian ini mengiterasi semua Plugin yang ditemukan dan menjalankan suite
asersi bentuk dan perilaku. Lane unit default `pnpm test` sengaja
melewati file seam dan smoke bersama ini; jalankan perintah kontrak secara eksplisit
saat Anda menyentuh surface saluran atau provider bersama.

### Perintah

- Semua kontrak: `pnpm test:contracts`
- Hanya kontrak saluran: `pnpm test:contracts:channels`
- Hanya kontrak provider: `pnpm test:contracts:plugins`

### Kontrak saluran

Berada di `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Bentuk Plugin dasar (id, nama, kapabilitas)
- **setup** - Kontrak wizard penyiapan
- **session-binding** - Perilaku binding sesi
- **outbound-payload** - Struktur payload pesan
- **inbound** - Penanganan pesan masuk
- **actions** - Handler aksi saluran
- **threading** - Penanganan ID thread
- **directory** - API direktori/roster
- **group-policy** - Penegakan kebijakan grup

### Kontrak status provider

Berada di `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe status saluran
- **registry** - Bentuk registry Plugin

### Kontrak provider

Berada di `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrak alur auth
- **auth-choice** - Pilihan/seleksi auth
- **catalog** - API katalog model
- **discovery** - Penemuan Plugin
- **loader** - Pemuatan Plugin
- **runtime** - Runtime provider
- **shape** - Bentuk/antarmuka Plugin
- **wizard** - Wizard penyiapan

### Kapan dijalankan

- Setelah mengubah export atau subpath plugin-sdk
- Setelah menambahkan atau memodifikasi Plugin saluran atau provider
- Setelah refactor pendaftaran atau penemuan Plugin

Pengujian kontrak berjalan di CI dan tidak memerlukan API key nyata.

## Menambahkan regresi (panduan)

Saat Anda memperbaiki masalah provider/model yang ditemukan secara live:

- Tambahkan regresi yang aman untuk CI jika memungkinkan (mock/stub provider, atau tangkap transformasi bentuk request yang tepat)
- Jika secara inheren hanya-live (rate limit, kebijakan auth), pertahankan pengujian live tetap sempit dan opt-in melalui env var
- Lebih baik targetkan lapisan terkecil yang menangkap bug:
  - bug konversi/replay request provider → pengujian model langsung
  - bug pipeline sesi/riwayat/tool Gateway → smoke gateway live atau pengujian mock gateway yang aman untuk CI
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` menurunkan satu target sampel per kelas SecretRef dari metadata registry (`listSecretTargetRegistryEntries()`), lalu menegaskan exec id traversal-segmen ditolak.
  - Jika Anda menambahkan keluarga target SecretRef `includeInPlan` baru di `src/secrets/target-registry-data.ts`, perbarui `classifyTargetClass` dalam pengujian tersebut. Pengujian ini sengaja gagal pada id target yang tidak terklasifikasi agar kelas baru tidak dapat dilewati secara diam-diam.

## Terkait

- [Pengujian live](/id/help/testing-live)
- [CI](/id/ci)
