---
read_when:
    - Menjalankan pengujian secara lokal atau di CI
    - Menambahkan uji regresi untuk bug model/penyedia
    - Men-debug perilaku Gateway + agen
summary: 'Kit pengujian: rangkaian unit/e2e/live, runner Docker, dan cakupan setiap pengujian'
title: Pengujian
x-i18n:
    generated_at: "2026-05-05T06:17:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63f27190fb00b7091c99f64edcb990be14b1025db89bc091d9c54bd1322dda24
    source_path: help/testing.md
    workflow: 16
---

OpenClaw memiliki tiga rangkaian Vitest (unit/integrasi, e2e, live) dan sekumpulan kecil
runner Docker. Dokumen ini adalah panduan "cara kami menguji":

- Apa yang dicakup setiap rangkaian (dan apa yang sengaja _tidak_ dicakup).
- Perintah mana yang dijalankan untuk alur kerja umum (lokal, sebelum push, debugging).
- Cara pengujian live menemukan kredensial dan memilih model/penyedia.
- Cara menambahkan regresi untuk masalah model/penyedia dunia nyata.

<Note>
**Stack QA (qa-lab, qa-channel, lane transport live)** didokumentasikan secara terpisah:

- [Ikhtisar QA](/id/concepts/qa-e2e-automation) — arsitektur, permukaan perintah, penulisan skenario.
- [Matrix QA](/id/concepts/qa-matrix) — referensi untuk `pnpm openclaw qa matrix`.
- [QA channel](/id/channels/qa-channel) — Plugin transport sintetis yang digunakan oleh skenario berbasis repo.

Halaman ini mencakup menjalankan rangkaian pengujian reguler dan runner Docker/Parallels. Bagian runner khusus QA di bawah ([Runner khusus QA](#qa-specific-runners)) mencantumkan pemanggilan `qa` konkret dan merujuk kembali ke referensi di atas.
</Note>

## Mulai cepat

Pada sebagian besar hari:

- Gate penuh (diharapkan sebelum push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Eksekusi rangkaian penuh lokal yang lebih cepat pada mesin lega: `pnpm test:max`
- Loop watch Vitest langsung: `pnpm test:watch`
- Penargetan file langsung sekarang juga merutekan path ekstensi/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Utamakan eksekusi tertarget terlebih dahulu saat Anda mengiterasi satu kegagalan.
- Situs QA berbasis Docker: `pnpm qa:lab:up`
- Lane QA berbasis VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Saat Anda menyentuh pengujian atau menginginkan keyakinan tambahan:

- Gate coverage: `pnpm test:coverage`
- Rangkaian E2E: `pnpm test:e2e`

Saat men-debug penyedia/model nyata (memerlukan kredensial nyata):

- Rangkaian live (model + probe alat/gambar Gateway): `pnpm test:live`
- Targetkan satu file live secara senyap: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Laporan performa runtime: dispatch `OpenClaw Performance` dengan
  `live_gpt54=true` untuk satu giliran agen `openai/gpt-5.4` nyata atau
  `deep_profile=true` untuk artefak CPU/heap/trace Kova. Eksekusi terjadwal harian
  menerbitkan artefak lane mock-provider, deep-profile, dan GPT 5.4 ke
  `openclaw/clawgrit-reports` saat `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi. Laporan
  mock-provider juga mencakup angka boot Gateway tingkat sumber, memori,
  tekanan Plugin, hello-loop model palsu berulang, dan startup CLI.
- Sweep model live Docker: `pnpm test:docker:live-models`
  - Setiap model yang dipilih sekarang menjalankan satu giliran teks plus probe kecil bergaya pembacaan file.
    Model yang metadatanya mengiklankan input `image` juga menjalankan satu giliran gambar kecil.
    Nonaktifkan probe tambahan dengan `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` atau
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` saat mengisolasi kegagalan penyedia.
  - Cakupan CI: `OpenClaw Scheduled Live And E2E Checks` harian dan
    `OpenClaw Release Checks` manual sama-sama memanggil workflow live/E2E yang dapat digunakan ulang dengan
    `include_live_suites: true`, yang mencakup job matriks model live Docker terpisah
    yang di-shard berdasarkan penyedia.
  - Untuk rerun CI terfokus, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    dengan `include_live_suites: true` dan `live_models_only: true`.
  - Tambahkan secret penyedia bersinyal tinggi baru ke `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dan pemanggil
    terjadwal/rilisnya.
- Smoke chat terikat Codex native: `pnpm test:docker:live-codex-bind`
  - Menjalankan lane live Docker terhadap path app-server Codex, mengikat DM Slack sintetis
    dengan `/codex bind`, menguji `/codex fast` dan
    `/codex permissions`, lalu memverifikasi balasan polos dan rute lampiran gambar
    melalui binding Plugin native alih-alih ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Menjalankan giliran agen Gateway melalui harness app-server Codex milik Plugin,
    memverifikasi `/codex status` dan `/codex models`, dan secara default menguji gambar,
    Cron MCP, sub-agent, dan probe Guardian. Nonaktifkan probe sub-agent dengan
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` saat mengisolasi kegagalan app-server Codex
    lainnya. Untuk pemeriksaan sub-agent terfokus, nonaktifkan probe lainnya:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Ini keluar setelah probe sub-agent kecuali
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` disetel.
- Smoke perintah penyelamatan Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Pemeriksaan opt-in berlapis untuk permukaan perintah penyelamatan channel pesan.
    Ini menguji `/crestodian status`, mengantrekan perubahan model persisten,
    membalas `/crestodian yes`, dan memverifikasi path penulisan audit/konfigurasi.
- Smoke Docker perencana Crestodian: `pnpm test:docker:crestodian-planner`
  - Menjalankan Crestodian dalam kontainer tanpa konfigurasi dengan CLI Claude palsu di `PATH`
    dan memverifikasi fallback perencana fuzzy diterjemahkan menjadi penulisan konfigurasi bertipe
    yang diaudit.
- Smoke Docker first-run Crestodian: `pnpm test:docker:crestodian-first-run`
  - Dimulai dari direktori status OpenClaw kosong, merutekan `openclaw` polos ke
    Crestodian, menerapkan penulisan setup/model/agen/Plugin Discord + SecretRef,
    memvalidasi konfigurasi, dan memverifikasi entri audit. Path setup Ring 0 yang sama
    juga dicakup di QA Lab oleh
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke biaya Moonshot/Kimi: dengan `MOONSHOT_API_KEY` disetel, jalankan
  `openclaw models list --provider moonshot --json`, lalu jalankan
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  terisolasi terhadap `moonshot/kimi-k2.6`. Verifikasi JSON melaporkan Moonshot/K2.6 dan
  transkrip asisten menyimpan `usage.cost` yang dinormalisasi.

<Tip>
Saat Anda hanya membutuhkan satu kasus gagal, utamakan mempersempit pengujian live melalui env var allowlist yang dijelaskan di bawah.
</Tip>

## Runner khusus QA

Perintah-perintah ini berada di samping rangkaian pengujian utama saat Anda membutuhkan realisme QA-lab:

CI menjalankan QA Lab dalam workflow khusus. Paritas agentic berada di bawah
`QA-Lab - All Lanes` dan validasi rilis, bukan workflow PR mandiri.
Validasi luas sebaiknya menggunakan `Full Release Validation` dengan
`rerun_group=qa-parity` atau grup QA release-checks. Pemeriksaan rilis stabil/default
menjaga soak live/Docker menyeluruh di balik `run_release_soak=true`; profil
`full` memaksa soak aktif. `QA-Lab - All Lanes`
berjalan setiap malam di `main` dan dari dispatch manual dengan lane paritas mock, lane
Matrix live, lane Telegram live yang dikelola Convex, dan lane Discord live yang dikelola Convex
sebagai job paralel. QA terjadwal dan pemeriksaan rilis meneruskan Matrix
`--profile fast` secara eksplisit, sementara input default CLI Matrix dan workflow manual
tetap `all`; dispatch manual dapat membagi shard `all` menjadi job `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`. `OpenClaw Release
Checks` menjalankan paritas plus lane Matrix cepat dan Telegram sebelum persetujuan
rilis, menggunakan `mock-openai/gpt-5.5` untuk pemeriksaan transport rilis agar tetap
deterministik dan menghindari startup Plugin penyedia normal. Gateway transport live ini
menonaktifkan pencarian memori; perilaku memori tetap dicakup oleh rangkaian paritas
QA.

Shard media live rilis penuh menggunakan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang sudah memiliki
`ffmpeg` dan `ffprobe`. Shard model/backend live Docker menggunakan image bersama
`ghcr.io/openclaw/openclaw-live-test:<sha>` yang dibuat sekali per commit terpilih,
lalu menariknya dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` alih-alih membangun ulang
di dalam setiap shard.

- `pnpm openclaw qa suite`
  - Menjalankan skenario QA berbasis repo langsung di host.
  - Menjalankan beberapa skenario terpilih secara paralel secara default dengan pekerja
    gateway yang terisolasi. `qa-channel` default ke konkurensi 4 (dibatasi oleh
    jumlah skenario yang dipilih). Gunakan `--concurrency <count>` untuk menyesuaikan jumlah
    pekerja, atau `--concurrency 1` untuk lane serial lama.
  - Keluar dengan nilai non-zero ketika ada skenario yang gagal. Gunakan `--allow-failures` ketika Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Mendukung mode provider `live-frontier`, `mock-openai`, dan `aimock`.
    `aimock` memulai server provider lokal berbasis AIMock untuk cakupan fixture
    dan mock protokol eksperimental tanpa menggantikan lane `mock-openai` yang sadar skenario.
- `pnpm test:plugins:kitchen-sink-live`
  - Menjalankan rangkaian pengujian Plugin live OpenAI Kitchen Sink melalui QA Lab. Ini
    menginstal paket Kitchen Sink eksternal, memverifikasi inventaris permukaan SDK Plugin,
    memeriksa `/healthz` dan `/readyz`, merekam bukti CPU/RSS Gateway,
    menjalankan satu giliran OpenAI live, dan memeriksa diagnostik adversarial.
    Memerlukan autentikasi OpenAI live seperti `OPENAI_API_KEY`. Dalam sesi Testbox
    yang terhidrasi, ini otomatis memuat profil live-auth Testbox ketika helper
    `openclaw-testbox-env` tersedia.
- `pnpm test:gateway:cpu-scenarios`
  - Menjalankan bench startup Gateway ditambah paket skenario QA Lab mock kecil
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) dan menulis ringkasan observasi CPU gabungan
    di bawah `.artifacts/gateway-cpu-scenarios/`.
  - Secara default hanya menandai observasi CPU panas yang berkelanjutan (`--cpu-core-warn`
    ditambah `--hot-wall-warn-ms`), sehingga lonjakan startup singkat direkam sebagai metrik
    tanpa terlihat seperti regresi Gateway yang terpaku selama beberapa menit.
  - Menggunakan artefak `dist` yang sudah dibangun; jalankan build terlebih dahulu ketika checkout belum
    memiliki output runtime yang segar.
- `pnpm openclaw qa suite --runner multipass`
  - Menjalankan suite QA yang sama di dalam VM Linux Multipass sekali pakai.
  - Mempertahankan perilaku pemilihan skenario yang sama seperti `qa suite` di host.
  - Menggunakan kembali flag pemilihan provider/model yang sama seperti `qa suite`.
  - Run live meneruskan input autentikasi QA yang didukung dan praktis untuk guest:
    kunci provider berbasis env, path konfigurasi provider live QA, dan `CODEX_HOME`
    bila ada.
  - Direktori output harus tetap berada di bawah root repo agar guest dapat menulis balik melalui
    workspace yang dipasang.
  - Menulis laporan + ringkasan QA normal serta log Multipass di bawah
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Memulai situs QA berbasis Docker untuk pekerjaan QA bergaya operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Membangun tarball npm dari checkout saat ini, menginstalnya secara global di
    Docker, menjalankan onboarding kunci API OpenAI non-interaktif, mengonfigurasi Telegram
    secara default, memverifikasi runtime Plugin terpaket memuat tanpa perbaikan
    dependensi startup, menjalankan doctor, dan menjalankan satu giliran agen lokal terhadap
    endpoint OpenAI yang dimock.
  - Gunakan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` untuk menjalankan lane packaged-install
    yang sama dengan Discord.
- `pnpm test:docker:session-runtime-context`
  - Menjalankan smoke Docker aplikasi terbangun yang deterministik untuk transkrip konteks runtime
    tertanam. Ini memverifikasi konteks runtime OpenClaw tersembunyi dipertahankan sebagai
    pesan kustom non-display alih-alih bocor ke giliran pengguna yang terlihat,
    lalu melakukan seed JSONL sesi rusak yang terdampak dan memverifikasi
    `openclaw doctor --fix` menulis ulangnya ke cabang aktif dengan cadangan.
- `pnpm test:docker:npm-telegram-live`
  - Menginstal kandidat paket OpenClaw di Docker, menjalankan onboarding
    installed-package, mengonfigurasi Telegram melalui CLI terinstal, lalu menggunakan kembali
    lane QA Telegram live dengan paket terinstal tersebut sebagai Gateway SUT.
  - Default ke `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; setel
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` atau
    `OPENCLAW_CURRENT_PACKAGE_TGZ` untuk menguji tarball lokal yang sudah di-resolve alih-alih
    menginstal dari registry.
  - Menggunakan kredensial env Telegram yang sama atau sumber kredensial Convex seperti
    `pnpm openclaw qa telegram`. Untuk otomatisasi CI/rilis, setel
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` ditambah
    `OPENCLAW_QA_CONVEX_SITE_URL` dan secret peran. Jika
    `OPENCLAW_QA_CONVEX_SITE_URL` dan secret peran Convex ada di CI,
    wrapper Docker memilih Convex secara otomatis.
  - Wrapper memvalidasi env kredensial Telegram atau Convex di host sebelum
    pekerjaan build/install Docker. Setel `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    hanya ketika sengaja men-debug penyiapan pra-kredensial.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` menimpa
    `OPENCLAW_QA_CREDENTIAL_ROLE` bersama hanya untuk lane ini.
  - GitHub Actions mengekspos lane ini sebagai workflow maintainer manual
    `NPM Telegram Beta E2E`. Ini tidak berjalan saat merge. Workflow menggunakan
    environment `qa-live-shared` dan lease kredensial CI Convex.
- GitHub Actions juga mengekspos `Package Acceptance` untuk bukti produk side-run
  terhadap satu paket kandidat. Ini menerima ref tepercaya, spec npm yang dipublikasikan,
  URL tarball HTTPS plus SHA-256, atau artefak tarball dari run lain, mengunggah
  `openclaw-current.tgz` yang dinormalisasi sebagai `package-under-test`, lalu menjalankan
  scheduler Docker E2E yang ada dengan profil lane smoke, package, product, full, atau custom.
  Setel `telegram_mode=mock-openai` atau `live-frontier` untuk menjalankan workflow QA
  Telegram terhadap artefak `package-under-test` yang sama.
  - Bukti produk beta terbaru:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Bukti URL tarball persis memerlukan digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Bukti artefak mengunduh artefak tarball dari run Actions lain:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Mengemas dan menginstal build OpenClaw saat ini di Docker, memulai Gateway
    dengan OpenAI yang dikonfigurasi, lalu mengaktifkan channel/Plugin bawaan melalui edit
    konfigurasi.
  - Memverifikasi discovery penyiapan membiarkan Plugin yang dapat diunduh dan belum dikonfigurasi tetap tidak ada,
    repair doctor pertama yang dikonfigurasi menginstal setiap Plugin yang dapat diunduh dan hilang
    secara eksplisit, dan restart kedua tidak menjalankan perbaikan dependensi
    tersembunyi.
  - Juga menginstal baseline npm lama yang dikenal, mengaktifkan Telegram sebelum menjalankan
    `openclaw update --tag <candidate>`, dan memverifikasi doctor pasca-update kandidat
    membersihkan sisa dependensi Plugin lama tanpa repair postinstall dari sisi
    harness.
- `pnpm test:parallels:npm-update`
  - Menjalankan smoke update packaged-install native di seluruh guest Parallels. Setiap
    platform yang dipilih terlebih dahulu menginstal paket baseline yang diminta, lalu menjalankan
    perintah `openclaw update` terinstal di guest yang sama dan memverifikasi
    versi terinstal, status update, kesiapan Gateway, dan satu giliran agen lokal.
  - Gunakan `--platform macos`, `--platform windows`, atau `--platform linux` saat
    beriterasi pada satu guest. Gunakan `--json` untuk path artefak ringkasan dan
    status per lane.
  - Lane OpenAI menggunakan `openai/gpt-5.5` untuk bukti giliran agen live secara
    default. Berikan `--model <provider/model>` atau setel
    `OPENCLAW_PARALLELS_OPENAI_MODEL` ketika sengaja memvalidasi model
    OpenAI lain.
  - Bungkus run lokal yang panjang dengan timeout host agar stall transport Parallels tidak
    menghabiskan sisa jendela pengujian:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrip menulis log lane bertingkat di bawah `/tmp/openclaw-parallels-npm-update.*`.
    Periksa `windows-update.log`, `macos-update.log`, atau `linux-update.log`
    sebelum menganggap wrapper luar macet.
  - Update Windows dapat menghabiskan 10 hingga 15 menit dalam pekerjaan doctor pasca-update dan update
    paket pada guest dingin; itu masih sehat ketika log debug npm bertingkat
    terus bergerak.
  - Jangan menjalankan wrapper agregat ini secara paralel dengan lane smoke Parallels
    macOS, Windows, atau Linux individual. Mereka berbagi status VM dan dapat bertabrakan pada
    restore snapshot, penyajian paket, atau status Gateway guest.
  - Bukti pasca-update menjalankan permukaan Plugin bawaan normal karena
    facade kapabilitas seperti ucapan, pembuatan gambar, dan pemahaman media
    dimuat melalui API runtime bawaan bahkan ketika giliran agen itu sendiri
    hanya memeriksa respons teks sederhana.

- `pnpm openclaw qa aimock`
  - Hanya memulai server provider AIMock lokal untuk pengujian smoke protokol
    langsung.
- `pnpm openclaw qa matrix`
  - Menjalankan lane QA live Matrix terhadap homeserver Tuwunel sekali pakai berbasis Docker. Hanya source-checkout — instalasi terpaket tidak mengirim `qa-lab`.
  - CLI lengkap, katalog profil/skenario, env vars, dan tata letak artefak: [QA Matrix](/id/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Menjalankan lane QA live Telegram terhadap grup privat nyata menggunakan token bot driver dan SUT dari env.
  - Memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Id grup harus berupa id chat Telegram numerik.
  - Mendukung `--credential-source convex` untuk kredensial pooled bersama. Gunakan mode env secara default, atau setel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` untuk ikut menggunakan lease pooled.
  - Keluar dengan nilai non-zero ketika ada skenario yang gagal. Gunakan `--allow-failures` ketika Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Memerlukan dua bot berbeda dalam grup privat yang sama, dengan bot SUT mengekspos username Telegram.
  - Untuk observasi bot-ke-bot yang stabil, aktifkan Bot-to-Bot Communication Mode di `@BotFather` untuk kedua bot dan pastikan bot driver dapat mengamati traffic bot grup.
  - Menulis laporan QA Telegram, ringkasan, dan artefak pesan yang diamati di bawah `.artifacts/qa-e2e/...`. Skenario balasan menyertakan RTT dari permintaan kirim driver hingga balasan SUT yang diamati.

Lane transport live berbagi satu kontrak standar sehingga transport baru tidak menyimpang; matriks cakupan per lane ada di [gambaran umum QA → Cakupan transport live](/id/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` adalah suite sintetis yang luas dan bukan bagian dari matriks tersebut.

### Kredensial Telegram bersama melalui Convex (v1)

Ketika `--credential-source convex` (atau `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) diaktifkan untuk
`openclaw qa telegram`, QA lab memperoleh lease eksklusif dari pool berbasis Convex, mengirim heartbeat
untuk lease tersebut saat lane berjalan, dan melepas lease saat shutdown.

Scaffold proyek Convex referensi:

- `qa/convex-credential-broker/`

Env vars yang diperlukan:

- `OPENCLAW_QA_CONVEX_SITE_URL` (misalnya `https://your-deployment.convex.site`)
- Satu secret untuk peran yang dipilih:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` untuk `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` untuk `ci`
- Pemilihan peran kredensial:
  - CLI: `--credential-role maintainer|ci`
  - Default env: `OPENCLAW_QA_CREDENTIAL_ROLE` (default ke `ci` di CI, `maintainer` selain itu)

Env vars opsional:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (default `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (default `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (default `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (default `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (default `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id trace opsional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` mengizinkan URL Convex `http://` loopback untuk pengembangan khusus lokal.

`OPENCLAW_QA_CONVEX_SITE_URL` harus menggunakan `https://` dalam operasi normal.

Perintah admin pemelihara (pool add/remove/list) memerlukan
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` secara khusus.

Helper CLI untuk pemelihara:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gunakan `doctor` sebelum run live untuk memeriksa URL situs Convex, rahasia broker,
prefiks endpoint, timeout HTTP, dan keterjangkauan admin/list tanpa mencetak
nilai rahasia. Gunakan `--json` untuk keluaran yang dapat dibaca mesin di skrip
dan utilitas CI.

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
- `POST /admin/add` (hanya rahasia pemelihara)
  - Permintaan: `{ kind, actorId, payload, note?, status? }`
  - Berhasil: `{ status: "ok", credential }`
- `POST /admin/remove` (hanya rahasia pemelihara)
  - Permintaan: `{ credentialId, actorId }`
  - Berhasil: `{ status: "ok", changed, credential }`
  - Pelindung lease aktif: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (hanya rahasia pemelihara)
  - Permintaan: `{ kind?, status?, includePayload?, limit? }`
  - Berhasil: `{ status: "ok", credentials, count }`

Bentuk payload untuk jenis Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` harus berupa string id obrolan Telegram numerik.
- `admin/add` memvalidasi bentuk ini untuk `kind: "telegram"` dan menolak payload yang salah bentuk.

### Menambahkan saluran ke QA

Nama arsitektur dan helper skenario untuk adapter saluran baru berada di [Ringkasan QA → Menambahkan saluran](/id/concepts/qa-e2e-automation#adding-a-channel). Batas minimum: implementasikan runner transport pada seam host `qa-lab` bersama, deklarasikan `qaRunners` di manifes Plugin, mount sebagai `openclaw qa <runner>`, dan tulis skenario di bawah `qa/scenarios/`.

## Suite pengujian (apa yang berjalan di mana)

Pikirkan suite sebagai “realisme yang meningkat” (dan flakiness/biaya yang juga meningkat):

### Unit / integrasi (default)

- Perintah: `pnpm test`
- Konfigurasi: run tanpa target menggunakan set shard `vitest.full-*.config.ts` dan dapat memperluas shard multi-proyek menjadi konfigurasi per proyek untuk penjadwalan paralel
- File: inventori core/unit di bawah `src/**/*.test.ts`, `packages/**/*.test.ts`, dan `test/**/*.test.ts`; pengujian unit UI berjalan di shard khusus `unit-ui`
- Cakupan:
  - Pengujian unit murni
  - Pengujian integrasi dalam proses (autentikasi Gateway, routing, tooling, parsing, konfigurasi)
  - Regresi deterministik untuk bug yang diketahui
- Ekspektasi:
  - Berjalan di CI
  - Tidak memerlukan kunci sungguhan
  - Harus cepat dan stabil
  - Pengujian resolver dan loader permukaan publik harus membuktikan perilaku fallback `api.js` dan
    `runtime-api.js` yang luas dengan fixture Plugin kecil yang dihasilkan, bukan
    API sumber Plugin bawaan sungguhan. Load API Plugin sungguhan berada di
    suite kontrak/integrasi milik Plugin.

<AccordionGroup>
  <Accordion title="Proyek, shard, dan lane bercakupan">

    - `pnpm test` tanpa target menjalankan dua belas konfigurasi shard yang lebih kecil (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) alih-alih satu proses proyek root native raksasa. Ini mengurangi puncak RSS pada mesin yang terbebani dan mencegah pekerjaan auto-reply/extension membuat suite yang tidak terkait kelaparan sumber daya.
    - `pnpm test --watch` tetap menggunakan grafik proyek root native `vitest.config.ts`, karena loop watch multi-shard tidak praktis.
    - `pnpm test`, `pnpm test:watch`, dan `pnpm test:perf:imports` merutekan target file/direktori eksplisit melalui lane bercakupan terlebih dahulu, sehingga `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` menghindari biaya startup penuh proyek root.
    - `pnpm test:changed` memperluas path git yang berubah menjadi lane bercakupan murah secara default: edit pengujian langsung, file saudara `*.test.ts`, pemetaan sumber eksplisit, dan dependen grafik impor lokal. Edit konfigurasi/setup/paket tidak menjalankan pengujian secara luas kecuali Anda secara eksplisit menggunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` adalah gate pemeriksaan lokal cerdas normal untuk pekerjaan sempit. Perintah ini mengklasifikasikan diff menjadi core, pengujian core, extensions, pengujian extension, aplikasi, docs, metadata rilis, tooling Docker live, dan tooling, lalu menjalankan perintah typecheck, lint, dan guard yang sesuai. Ini tidak menjalankan pengujian Vitest; panggil `pnpm test:changed` atau `pnpm test <target>` eksplisit untuk bukti pengujian. Kenaikan versi yang hanya metadata rilis menjalankan pemeriksaan versi/konfigurasi/dependensi root tertarget, dengan guard yang menolak perubahan paket di luar field versi tingkat atas.
    - Edit harness ACP Docker live menjalankan pemeriksaan terfokus: sintaks shell untuk skrip autentikasi Docker live dan dry-run scheduler Docker live. Perubahan `package.json` hanya disertakan ketika diff terbatas pada `scripts["test:docker:live-*"]`; edit dependensi, ekspor, versi, dan permukaan paket lainnya tetap menggunakan guard yang lebih luas.
    - Pengujian unit import-light dari agents, commands, plugins, helper auto-reply, `plugin-sdk`, dan area utilitas murni serupa dirutekan melalui lane `unit-fast`, yang melewati `test/setup-openclaw-runtime.ts`; file stateful/berat runtime tetap berada di lane yang ada.
    - File sumber helper `plugin-sdk` dan `commands` terpilih juga memetakan run mode berubah ke pengujian saudara eksplisit di lane ringan tersebut, sehingga edit helper menghindari menjalankan ulang seluruh suite berat untuk direktori itu.
    - `auto-reply` memiliki bucket khusus untuk helper core tingkat atas, pengujian integrasi `reply.*` tingkat atas, dan subtree `src/auto-reply/reply/**`. CI selanjutnya memecah subtree reply menjadi shard agent-runner, dispatch, dan commands/state-routing sehingga satu bucket berat impor tidak menguasai seluruh ekor Node.
    - CI PR/main normal sengaja melewati sapuan batch extension dan shard `agentic-plugins` khusus rilis. Validasi Rilis Penuh memicu workflow anak `Plugin Prerelease` terpisah untuk suite berat Plugin/extension tersebut pada kandidat rilis.

  </Accordion>

  <Accordion title="Cakupan runner tertanam">

    - Saat Anda mengubah input penemuan message-tool atau konteks runtime
      compaction, pertahankan kedua tingkat cakupan.
    - Tambahkan regresi helper terfokus untuk batas routing dan normalisasi
      murni.
    - Jaga suite integrasi runner tertanam tetap sehat:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, dan
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Suite tersebut memverifikasi bahwa id bercakupan dan perilaku compaction tetap mengalir
      melalui path `run.ts` / `compact.ts` sungguhan; pengujian khusus helper
      bukan pengganti yang cukup untuk path integrasi tersebut.

  </Accordion>

  <Accordion title="Default pool dan isolasi Vitest">

    - Konfigurasi dasar Vitest default ke `threads`.
    - Konfigurasi Vitest bersama menetapkan `isolate: false` dan menggunakan
      runner non-terisolasi di seluruh proyek root, e2e, dan konfigurasi live.
    - Lane UI root mempertahankan setup dan optimizer `jsdom`-nya, tetapi juga berjalan pada
      runner non-terisolasi bersama.
    - Setiap shard `pnpm test` mewarisi default `threads` + `isolate: false`
      yang sama dari konfigurasi Vitest bersama.
    - `scripts/run-vitest.mjs` menambahkan `--no-maglev` untuk proses Node anak
      Vitest secara default guna mengurangi churn kompilasi V8 selama run lokal besar.
      Setel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` untuk membandingkan dengan perilaku
      V8 bawaan.

  </Accordion>

  <Accordion title="Iterasi lokal cepat">

    - `pnpm changed:lanes` menampilkan lane arsitektural mana yang dipicu oleh diff.
    - Hook pre-commit hanya untuk pemformatan. Hook ini men-stage ulang file yang diformat dan
      tidak menjalankan lint, typecheck, atau pengujian.
    - Jalankan `pnpm check:changed` secara eksplisit sebelum handoff atau push saat Anda
      memerlukan gate pemeriksaan lokal cerdas.
    - `pnpm test:changed` merutekan melalui lane bercakupan murah secara default. Gunakan
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika agent
      memutuskan bahwa edit harness, konfigurasi, paket, atau kontrak benar-benar memerlukan
      cakupan Vitest yang lebih luas.
    - `pnpm test:max` dan `pnpm test:changed:max` mempertahankan perilaku routing
      yang sama, hanya dengan batas worker yang lebih tinggi.
    - Penskalaan otomatis worker lokal sengaja konservatif dan mundur
      saat load average host sudah tinggi, sehingga beberapa run Vitest
      bersamaan menimbulkan dampak lebih kecil secara default.
    - Konfigurasi dasar Vitest menandai file proyek/konfigurasi sebagai
      `forceRerunTriggers` sehingga run ulang mode berubah tetap benar saat wiring
      pengujian berubah.
    - Konfigurasi mempertahankan `OPENCLAW_VITEST_FS_MODULE_CACHE` aktif pada host yang didukung;
      setel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` jika Anda menginginkan
      satu lokasi cache eksplisit untuk profiling langsung.

  </Accordion>

  <Accordion title="Debugging performa">

    - `pnpm test:perf:imports` mengaktifkan pelaporan durasi impor Vitest plus
      keluaran import-breakdown.
    - `pnpm test:perf:imports:changed` membatasi tampilan profiling yang sama ke
      file yang berubah sejak `origin/main`.
    - Data timing shard ditulis ke `.artifacts/vitest-shard-timings.json`.
      Run seluruh konfigurasi menggunakan path konfigurasi sebagai kunci; shard CI
      include-pattern menambahkan nama shard sehingga shard terfilter dapat dilacak
      secara terpisah.
    - Saat satu pengujian panas masih menghabiskan sebagian besar waktunya di impor startup,
      pertahankan dependensi berat di balik seam lokal `*.runtime.ts` yang sempit dan
      mock seam itu secara langsung alih-alih melakukan deep-import helper runtime hanya
      untuk meneruskannya melalui `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan
      `test:changed` yang dirutekan dengan path proyek root native untuk diff yang sudah di-commit
      tersebut dan mencetak wall time plus RSS maksimum macOS.
    - `pnpm test:perf:changed:bench -- --worktree` melakukan benchmark pada tree
      kotor saat ini dengan merutekan daftar file yang berubah melalui
      `scripts/test-projects.mjs` dan konfigurasi root Vitest.
    - `pnpm test:perf:profile:main` menulis profil CPU thread utama untuk
      overhead startup dan transform Vitest/Vite.
    - `pnpm test:perf:profile:runner` menulis profil CPU+heap runner untuk
      suite unit dengan paralelisme file dinonaktifkan.

  </Accordion>
</AccordionGroup>

### Stabilitas (Gateway)

- Perintah: `pnpm test:stability:gateway`
- Konfigurasi: `vitest.gateway.config.ts`, dipaksa ke satu worker
- Cakupan:
  - Memulai Gateway loopback sungguhan dengan diagnostik aktif secara default
  - Menggerakkan churn pesan gateway sintetis, memori, dan payload besar melalui path peristiwa diagnostik
  - Mengkueri `diagnostics.stability` melalui RPC WS Gateway
  - Mencakup helper persistensi bundel stabilitas diagnostik
  - Menegaskan bahwa recorder tetap terbatas, sampel RSS sintetis tetap di bawah anggaran tekanan, dan kedalaman antrean per sesi terkuras kembali ke nol
- Ekspektasi:
  - Aman untuk CI dan tanpa kunci
  - Lane sempit untuk tindak lanjut regresi stabilitas, bukan pengganti suite Gateway penuh

### E2E (smoke Gateway)

- Perintah: `pnpm test:e2e`
- Konfigurasi: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, dan pengujian E2E Plugin terbundel di bawah `extensions/`
- Default runtime:
  - Menggunakan Vitest `threads` dengan `isolate: false`, sesuai dengan bagian repo lainnya.
  - Menggunakan worker adaptif (CI: hingga 2, lokal: 1 secara default).
  - Berjalan dalam mode senyap secara default untuk mengurangi overhead I/O konsol.
- Override berguna:
  - `OPENCLAW_E2E_WORKERS=<n>` untuk memaksa jumlah worker (dibatasi pada 16).
  - `OPENCLAW_E2E_VERBOSE=1` untuk mengaktifkan kembali output konsol verbose.
- Cakupan:
  - Perilaku end-to-end Gateway multi-instans
  - Permukaan WebSocket/HTTP, pemasangan Node, dan jaringan yang lebih berat
- Ekspektasi:
  - Berjalan di CI (ketika diaktifkan dalam pipeline)
  - Tidak memerlukan kunci asli
  - Lebih banyak bagian bergerak dibandingkan pengujian unit (bisa lebih lambat)

### E2E: Smoke backend OpenShell

- Perintah: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Cakupan:
  - Memulai Gateway OpenShell terisolasi pada host melalui Docker
  - Membuat sandbox dari Dockerfile lokal sementara
  - Menguji backend OpenShell OpenClaw melalui `sandbox ssh-config` + eksekusi SSH nyata
  - Memverifikasi perilaku sistem file kanonis jarak jauh melalui bridge fs sandbox
- Ekspektasi:
  - Hanya opt-in; bukan bagian dari eksekusi default `pnpm test:e2e`
  - Memerlukan CLI `openshell` lokal serta daemon Docker yang berfungsi
  - Menggunakan `HOME` / `XDG_CONFIG_HOME` terisolasi, lalu menghancurkan Gateway pengujian dan sandbox
- Override berguna:
  - `OPENCLAW_E2E_OPENSHELL=1` untuk mengaktifkan pengujian saat menjalankan suite e2e yang lebih luas secara manual
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` untuk menunjuk ke biner CLI atau skrip wrapper non-default

### Live (provider nyata + model nyata)

- Perintah: `pnpm test:live`
- Konfigurasi: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, dan pengujian live Plugin terbundel di bawah `extensions/`
- Default: **diaktifkan** oleh `pnpm test:live` (menyetel `OPENCLAW_LIVE_TEST=1`)
- Cakupan:
  - “Apakah provider/model ini benar-benar berfungsi _hari ini_ dengan kredensial nyata?”
  - Menangkap perubahan format provider, kekhasan pemanggilan tool, masalah auth, dan perilaku batas rate
- Ekspektasi:
  - Secara desain tidak stabil untuk CI (jaringan nyata, kebijakan provider nyata, kuota, gangguan)
  - Menghabiskan uang / menggunakan batas rate
  - Lebih disarankan menjalankan subset yang dipersempit daripada “semuanya”
- Eksekusi live mengambil sumber dari `~/.profile` untuk mengambil kunci API yang hilang.
- Secara default, eksekusi live tetap mengisolasi `HOME` dan menyalin material konfigurasi/auth ke home pengujian sementara sehingga fixture unit tidak dapat mengubah `~/.openclaw` asli Anda.
- Setel `OPENCLAW_LIVE_USE_REAL_HOME=1` hanya ketika Anda secara sengaja membutuhkan pengujian live untuk menggunakan direktori home asli Anda.
- `pnpm test:live` sekarang secara default menggunakan mode yang lebih senyap: mode ini mempertahankan output progres `[live] ...`, tetapi menekan pemberitahuan tambahan `~/.profile` dan membisukan log bootstrap Gateway/obrolan Bonjour. Setel `OPENCLAW_LIVE_TEST_QUIET=0` jika Anda ingin log startup lengkap kembali.
- Rotasi kunci API (spesifik provider): setel `*_API_KEYS` dengan format koma/titik koma atau `*_API_KEY_1`, `*_API_KEY_2` (misalnya `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) atau override per-live melalui `OPENCLAW_LIVE_*_KEY`; pengujian mencoba ulang pada respons batas rate.
- Output progres/heartbeat:
  - Suite live sekarang mengeluarkan baris progres ke stderr sehingga pemanggilan provider yang lama tampak aktif bahkan ketika tangkapan konsol Vitest senyap.
  - `vitest.live.config.ts` menonaktifkan intersepsi konsol Vitest sehingga baris progres provider/Gateway langsung mengalir selama eksekusi live.
  - Sesuaikan Heartbeat model langsung dengan `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Sesuaikan Heartbeat Gateway/probe dengan `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Suite mana yang harus saya jalankan?

Gunakan tabel keputusan ini:

- Mengedit logika/pengujian: jalankan `pnpm test` (dan `pnpm test:coverage` jika Anda mengubah banyak hal)
- Menyentuh jaringan Gateway / protokol WS / pairing: tambahkan `pnpm test:e2e`
- Men-debug “bot saya down” / kegagalan spesifik provider / pemanggilan tool: jalankan `pnpm test:live` yang dipersempit

## Pengujian live (menyentuh jaringan)

Untuk matriks model live, smoke backend CLI, smoke ACP, harness app-server Codex, dan semua pengujian live provider media (Deepgram, BytePlus, ComfyUI, image, music, video, harness media) — plus penanganan kredensial untuk eksekusi live — lihat [Menguji suite live](/id/help/testing-live). Untuk checklist khusus update dan validasi Plugin, lihat [Menguji update dan Plugin](/id/help/testing-updates-plugins).

## Runner Docker (pemeriksaan opsional "berfungsi di Linux")

Runner Docker ini terbagi menjadi dua kelompok:

- Runner model live: `test:docker:live-models` dan `test:docker:live-gateway` hanya menjalankan file live profile-key yang cocok di dalam image Docker repo (`src/agents/models.profiles.live.test.ts` dan `src/gateway/gateway-models.profiles.live.test.ts`), dengan me-mount direktori konfigurasi lokal dan workspace Anda (serta mengambil sumber `~/.profile` jika di-mount). Entrypoint lokal yang cocok adalah `test:live:models-profiles` dan `test:live:gateway-profiles`.
- Runner live Docker secara default menggunakan batas smoke yang lebih kecil agar sweep Docker penuh tetap praktis:
  `test:docker:live-models` secara default menggunakan `OPENCLAW_LIVE_MAX_MODELS=12`, dan
  `test:docker:live-gateway` secara default menggunakan `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, dan
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Override env var tersebut ketika Anda
  secara eksplisit menginginkan pemindaian menyeluruh yang lebih besar.
- `test:docker:all` membangun image Docker live satu kali melalui `test:docker:live-build`, mengemas OpenClaw satu kali sebagai tarball npm melalui `scripts/package-openclaw-for-docker.mjs`, lalu membangun/menggunakan ulang dua image `scripts/e2e/Dockerfile`. Image bare hanyalah runner Node/Git untuk lane install/update/dependensi-Plugin; lane tersebut me-mount tarball yang sudah dibangun. Image fungsional menginstal tarball yang sama ke `/app` untuk lane fungsionalitas aplikasi yang sudah dibangun. Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`; logika planner berada di `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` mengeksekusi rencana yang dipilih. Agregat menggunakan scheduler lokal berbobot: `OPENCLAW_DOCKER_ALL_PARALLELISM` mengontrol slot proses, sementara batas resource mencegah lane live berat, npm-install, dan multi-service semuanya dimulai sekaligus. Jika satu lane lebih berat daripada batas aktif, scheduler masih dapat memulainya ketika pool kosong lalu membiarkannya berjalan sendiri sampai kapasitas tersedia lagi. Default-nya adalah 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; sesuaikan `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` hanya ketika host Docker memiliki ruang lebih. Runner menjalankan preflight Docker secara default, menghapus container E2E OpenClaw yang sudah usang, mencetak status setiap 30 detik, menyimpan timing lane yang berhasil di `.artifacts/docker-tests/lane-timings.json`, dan menggunakan timing tersebut untuk memulai lane yang lebih lama terlebih dahulu pada eksekusi berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifes lane berbobot tanpa membangun atau menjalankan Docker, atau `node scripts/test-docker-all.mjs --plan-json` untuk mencetak rencana CI bagi lane yang dipilih, kebutuhan package/image, dan kredensial.
- `Package Acceptance` adalah gate package native GitHub untuk "apakah tarball yang dapat diinstal ini berfungsi sebagai produk?" Ini menyelesaikan satu package kandidat dari `source=npm`, `source=ref`, `source=url`, atau `source=artifact`, mengunggahnya sebagai `package-under-test`, lalu menjalankan lane E2E Docker reusable terhadap tarball persis tersebut alih-alih mengemas ulang ref yang dipilih. Profil diurutkan berdasarkan keluasan: `smoke`, `package`, `product`, dan `full`. Lihat [Menguji update dan Plugin](/id/help/testing-updates-plugins) untuk kontrak package/update/Plugin, matriks survivor published-upgrade, default rilis, dan triase kegagalan.
- Pemeriksaan build dan rilis menjalankan `scripts/check-cli-bootstrap-imports.mjs` setelah tsdown. Guard menelusuri graph build statis dari `dist/entry.js` dan `dist/cli/run-main.js` lalu gagal jika startup pra-dispatch mengimpor dependensi package seperti Commander, prompt UI, undici, atau logging sebelum dispatch perintah; ini juga menjaga chunk run Gateway terbundel tetap di bawah anggaran dan menolak import statis dari jalur Gateway dingin yang diketahui. Smoke CLI terpaket juga mencakup bantuan root, bantuan onboard, bantuan doctor, status, skema konfigurasi, dan perintah daftar model.
- Kompatibilitas legacy Package Acceptance dibatasi pada `2026.4.25` (termasuk `2026.4.25-beta.*`). Hingga cutoff tersebut, harness hanya menoleransi celah metadata package yang sudah dirilis: entri inventori QA privat yang dihilangkan, `gateway install --wrapper` yang hilang, file patch yang hilang dalam fixture git turunan tarball, `update.channel` tersimpan yang hilang, lokasi install-record Plugin legacy, persistensi install-record marketplace yang hilang, dan migrasi metadata konfigurasi selama `plugins update`. Untuk package setelah `2026.4.25`, jalur tersebut menjadi kegagalan ketat.
- Runner smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, dan `test:docker:config-reload` mem-boot satu atau lebih container nyata dan memverifikasi jalur integrasi tingkat lebih tinggi.

Runner Docker model live juga melakukan bind-mount hanya pada home auth CLI yang diperlukan (atau semua yang didukung ketika eksekusi tidak dipersempit), lalu menyalinnya ke home container sebelum eksekusi sehingga OAuth CLI eksternal dapat me-refresh token tanpa mengubah penyimpanan auth host:

- Model langsung: `pnpm test:docker:live-models` (skrip: `scripts/test-live-models-docker.sh`)
- Smoke pengikatan ACP: `pnpm test:docker:live-acp-bind` (skrip: `scripts/test-live-acp-bind-docker.sh`; mencakup Claude, Codex, dan Gemini secara default, dengan cakupan Droid/OpenCode yang ketat melalui `pnpm test:docker:live-acp-bind:droid` dan `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (skrip: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness server aplikasi Codex: `pnpm test:docker:live-codex-harness` (skrip: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agen dev: `pnpm test:docker:live-gateway` (skrip: `scripts/test-live-gateway-models-docker.sh`)
- Smoke observabilitas: `pnpm qa:otel:smoke` adalah jalur checkout sumber QA privat. Ini sengaja tidak menjadi bagian dari jalur rilis Docker paket karena tarball npm tidak menyertakan QA Lab.
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (skrip: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, scaffolding penuh): `pnpm test:docker:onboard` (skrip: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agen tarball Npm: `pnpm test:docker:npm-onboard-channel-agent` menginstal tarball OpenClaw yang dipaketkan secara global di Docker, mengonfigurasi OpenAI melalui onboarding env-ref plus Telegram secara default, menjalankan doctor, dan menjalankan satu giliran agen OpenAI yang dimock. Gunakan kembali tarball yang sudah dibangun dengan `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati pembangunan ulang host dengan `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, atau ganti channel dengan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` atau `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Smoke pergantian channel update: `pnpm test:docker:update-channel-switch` menginstal tarball OpenClaw yang dipaketkan secara global di Docker, beralih dari paket `stable` ke git `dev`, memverifikasi channel yang dipersistenkan dan pekerjaan pasca-update plugin, lalu beralih kembali ke paket `stable` dan memeriksa status update.
- Smoke penyintas upgrade: `pnpm test:docker:upgrade-survivor` menginstal tarball OpenClaw yang dipaketkan di atas fixture pengguna lama yang kotor dengan agen, konfigurasi channel, allowlist plugin, status dependensi plugin usang, dan file workspace/sesi yang sudah ada. Ini menjalankan update paket plus doctor noninteraktif tanpa provider live atau kunci channel, lalu memulai Gateway loopback dan memeriksa pelestarian konfigurasi/status serta anggaran startup/status.
- Smoke penyintas upgrade terpublikasi: `pnpm test:docker:published-upgrade-survivor` menginstal `openclaw@latest` secara default, menanam file pengguna yang sudah ada secara realistis, mengonfigurasi baseline itu dengan resep perintah bawaan, memvalidasi konfigurasi yang dihasilkan, memperbarui instalasi terpublikasi itu ke tarball kandidat, menjalankan doctor noninteraktif, menulis `.artifacts/upgrade-survivor/summary.json`, lalu memulai Gateway loopback dan memeriksa intent yang dikonfigurasi, pelestarian status, startup, `/healthz`, `/readyz`, dan anggaran status RPC. Override satu baseline dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, minta penjadwal agregat memperluas baseline lokal persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` seperti `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, dan perluas fixture berbentuk isu dengan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` seperti `reported-issues`; set reported-issues menyertakan `configured-plugin-installs` untuk perbaikan otomatis instalasi Plugin OpenClaw eksternal. Package Acceptance mengeksposnya sebagai `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, dan `published_upgrade_survivor_scenarios`, menyelesaikan token baseline meta seperti `last-stable-4` atau `all-since-2026.4.23`, dan Full Release Validation memperluas gate paket release-soak menjadi `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Smoke konteks runtime sesi: `pnpm test:docker:session-runtime-context` memverifikasi persistensi transkrip konteks runtime tersembunyi plus perbaikan doctor untuk cabang prompt-rewrite terdampak yang terduplikasi.
- Smoke instalasi global Bun: `bash scripts/e2e/bun-global-install-smoke.sh` memaketkan tree saat ini, menginstalnya dengan `bun install -g` di home terisolasi, dan memverifikasi `openclaw infer image providers --json` mengembalikan provider gambar bawaan alih-alih macet. Gunakan kembali tarball yang sudah dibangun dengan `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati build host dengan `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, atau salin `dist/` dari image Docker yang sudah dibangun dengan `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker installer: `bash scripts/test-install-sh-docker.sh` berbagi satu cache npm di seluruh container root, update, dan direct-npm. Smoke update secara default menggunakan npm `latest` sebagai baseline stabil sebelum upgrade ke tarball kandidat. Override dengan `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` secara lokal, atau dengan input `update_baseline_version` workflow Install Smoke di GitHub. Pemeriksaan installer non-root mempertahankan cache npm terisolasi agar entri cache milik root tidak menyamarkan perilaku instalasi lokal pengguna. Setel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` untuk menggunakan kembali cache root/update/direct-npm di seluruh rerun lokal.
- CI Install Smoke melewati update global direct-npm duplikat dengan `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; jalankan skrip secara lokal tanpa env itu saat cakupan `npm install -g` langsung diperlukan.
- Smoke CLI hapus workspace bersama agen: `pnpm test:docker:agents-delete-shared-workspace` (skrip: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) membangun image Dockerfile root secara default, menanam dua agen dengan satu workspace di home container terisolasi, menjalankan `agents delete --json`, dan memverifikasi JSON valid plus perilaku workspace yang dipertahankan. Gunakan kembali image install-smoke dengan `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Jaringan Gateway (dua container, auth WS + health): `pnpm test:docker:gateway-network` (skrip: `scripts/e2e/gateway-network-docker.sh`)
- Smoke snapshot CDP browser: `pnpm test:docker:browser-cdp-snapshot` (skrip: `scripts/e2e/browser-cdp-snapshot-docker.sh`) membangun image E2E sumber plus lapisan Chromium, memulai Chromium dengan CDP mentah, menjalankan `browser doctor --deep`, dan memverifikasi snapshot peran CDP mencakup URL tautan, clickable yang dipromosikan kursor, ref iframe, dan metadata frame.
- Regresi reasoning minimal web_search OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (skrip: `scripts/e2e/openai-web-search-minimal-docker.sh`) menjalankan server OpenAI yang dimock melalui Gateway, memverifikasi `web_search` menaikkan `reasoning.effort` dari `minimal` ke `low`, lalu memaksa penolakan skema provider dan memeriksa detail mentah muncul di log Gateway.
- Bridge channel MCP (Gateway tertanam + bridge stdio + smoke notification-frame Claude mentah): `pnpm test:docker:mcp-channels` (skrip: `scripts/e2e/mcp-channels-docker.sh`)
- Tool MCP bundle Pi (server MCP stdio nyata + smoke allow/deny profil Pi tertanam): `pnpm test:docker:pi-bundle-mcp-tools` (skrip: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pembersihan MCP Cron/subagent (Gateway nyata + teardown anak MCP stdio setelah cron terisolasi dan run subagent sekali jalan): `pnpm test:docker:cron-mcp-cleanup` (skrip: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke instal/update untuk path lokal, `file:`, registri npm dengan dependensi hoisted, ref git bergerak, kitchen-sink ClawHub, update marketplace, dan enable/inspect bundle Claude): `pnpm test:docker:plugins` (skrip: `scripts/e2e/plugins-docker.sh`)
  Setel `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` untuk melewati blok ClawHub, atau override pasangan paket/runtime kitchen-sink default dengan `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` dan `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Tanpa `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, pengujian menggunakan server fixture ClawHub lokal yang hermetik.
- Smoke update Plugin tanpa perubahan: `pnpm test:docker:plugin-update` (skrip: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke matriks lifecycle Plugin: `pnpm test:docker:plugin-lifecycle-matrix` menginstal tarball OpenClaw yang dipaketkan di container kosong, menginstal plugin npm, mengaktifkan/menonaktifkan, melakukan upgrade dan downgrade melalui registri npm lokal, menghapus kode yang terinstal, lalu memverifikasi uninstall tetap menghapus status usang sambil mencatat metrik RSS/CPU untuk setiap fase lifecycle.
- Smoke metadata reload konfigurasi: `pnpm test:docker:config-reload` (skrip: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` mencakup smoke instal/update untuk path lokal, `file:`, registri npm dengan dependensi hoisted, ref git bergerak, fixture ClawHub, update marketplace, dan enable/inspect bundle Claude. `pnpm test:docker:plugin-update` mencakup perilaku update tanpa perubahan untuk plugin terinstal. `pnpm test:docker:plugin-lifecycle-matrix` mencakup instal, enable, disable, upgrade, downgrade, dan uninstall kode hilang untuk plugin npm yang dilacak sumber dayanya.

Untuk membangun lebih dulu dan menggunakan kembali image fungsional bersama secara manual:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Override image spesifik suite seperti `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` tetap menang saat disetel. Saat `OPENCLAW_SKIP_DOCKER_BUILD=1` menunjuk ke image bersama jarak jauh, skrip menariknya jika belum ada secara lokal. Pengujian QR dan Docker installer mempertahankan Dockerfile masing-masing karena keduanya memvalidasi perilaku paket/instal, bukan runtime aplikasi yang sudah dibangun bersama.

Runner Docker model live juga melakukan bind-mount checkout saat ini secara read-only dan
men-staging-nya ke workdir sementara di dalam kontainer. Ini menjaga image runtime
tetap ramping sambil tetap menjalankan Vitest terhadap source/config lokal persis milik Anda.
Langkah staging melewati cache besar yang hanya lokal dan output build aplikasi seperti
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, serta direktori output `.build`
lokal aplikasi atau Gradle sehingga proses live Docker tidak menghabiskan beberapa menit menyalin
artefak khusus mesin.
Runner tersebut juga menetapkan `OPENCLAW_SKIP_CHANNELS=1` agar probe live gateway tidak memulai
worker kanal Telegram/Discord/dll. yang nyata di dalam kontainer.
`test:docker:live-models` tetap menjalankan `pnpm test:live`, jadi teruskan juga
`OPENCLAW_LIVE_GATEWAY_*` saat Anda perlu mempersempit atau mengecualikan cakupan live gateway
dari lane Docker tersebut.
`test:docker:openwebui` adalah uji kompatibilitas tingkat lebih tinggi: ini memulai
kontainer gateway OpenClaw dengan endpoint HTTP yang kompatibel dengan OpenAI diaktifkan,
memulai kontainer Open WebUI yang dipin terhadap gateway tersebut, masuk melalui
Open WebUI, memverifikasi `/api/models` mengekspos `openclaw/default`, lalu mengirim
permintaan chat nyata melalui proxy `/api/chat/completions` milik Open WebUI.
Jalankan pertama bisa terasa jauh lebih lambat karena Docker mungkin perlu menarik image
Open WebUI dan Open WebUI mungkin perlu menyelesaikan penyiapan cold-start-nya sendiri.
Lane ini mengharapkan kunci model live yang dapat digunakan, dan `OPENCLAW_PROFILE_FILE`
(`~/.profile` secara default) adalah cara utama untuk menyediakannya dalam run Docker.
Run yang berhasil mencetak payload JSON kecil seperti `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` sengaja deterministik dan tidak memerlukan akun
Telegram, Discord, atau iMessage nyata. Ini mem-boot kontainer Gateway yang sudah diberi seed,
memulai kontainer kedua yang men-spawn `openclaw mcp serve`, lalu
memverifikasi penemuan percakapan terarah, pembacaan transkrip, metadata lampiran,
perilaku antrean event live, routing pengiriman keluar, serta kanal bergaya Claude +
notifikasi izin melalui bridge MCP stdio nyata. Pemeriksaan notifikasi
menginspeksi frame MCP stdio mentah secara langsung sehingga uji cepat ini memvalidasi apa yang
benar-benar dipancarkan bridge, bukan hanya apa yang kebetulan diekspos oleh SDK klien tertentu.
`test:docker:pi-bundle-mcp-tools` bersifat deterministik dan tidak memerlukan kunci
model live. Ini membangun image Docker repo, memulai server probe MCP stdio nyata
di dalam kontainer, mewujudkan server tersebut melalui runtime MCP bundle Pi yang tertanam,
mengeksekusi tool, lalu memverifikasi `coding` dan `messaging` mempertahankan
tool `bundle-mcp` sementara `minimal` dan `tools.deny: ["bundle-mcp"]` memfilternya.
`test:docker:cron-mcp-cleanup` bersifat deterministik dan tidak memerlukan kunci model live.
Ini memulai Gateway yang sudah diberi seed dengan server probe MCP stdio nyata, menjalankan
turn cron terisolasi dan turn anak sekali jalan `/subagents spawn`, lalu memverifikasi
proses anak MCP keluar setelah setiap run.

Uji thread bahasa biasa ACP manual (bukan CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Simpan skrip ini untuk alur kerja regresi/debug. Ini mungkin diperlukan lagi untuk validasi routing thread ACP, jadi jangan hapus.

Env var yang berguna:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) di-mount ke `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) di-mount ke `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (default: `~/.profile`) di-mount ke `/home/node/.profile` dan di-source sebelum menjalankan pengujian
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` untuk memverifikasi hanya env var yang di-source dari `OPENCLAW_PROFILE_FILE`, menggunakan direktori config/workspace sementara dan tanpa mount auth CLI eksternal
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) di-mount ke `/home/node/.npm-global` untuk instalasi CLI cache di dalam Docker
- Direktori/file auth CLI eksternal di bawah `$HOME` di-mount read-only di bawah `/host-auth...`, lalu disalin ke `/home/node/...` sebelum pengujian dimulai
  - Direktori default: `.minimax`
  - File default: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Run provider yang dipersempit hanya me-mount direktori/file yang dibutuhkan, disimpulkan dari `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Timpa secara manual dengan `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, atau daftar koma seperti `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` untuk mempersempit run
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` untuk memfilter provider dalam kontainer
- `OPENCLAW_SKIP_DOCKER_BUILD=1` untuk menggunakan ulang image `openclaw:local-live` yang sudah ada untuk run ulang yang tidak memerlukan rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memastikan kredensial berasal dari penyimpanan profil (bukan env)
- `OPENCLAW_OPENWEBUI_MODEL=...` untuk memilih model yang diekspos oleh gateway untuk uji Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` untuk menimpa prompt nonce-check yang digunakan oleh uji Open WebUI
- `OPENWEBUI_IMAGE=...` untuk menimpa tag image Open WebUI yang dipin

## Pemeriksaan kewajaran dokumentasi

Jalankan pemeriksaan dokumentasi setelah edit dokumentasi: `pnpm check:docs`.
Jalankan validasi anchor Mintlify lengkap saat Anda juga memerlukan pemeriksaan heading dalam halaman: `pnpm docs:check-links:anchors`.

## Regresi offline (aman untuk CI)

Ini adalah regresi “pipeline nyata” tanpa provider nyata:

- Pemanggilan tool Gateway (mock OpenAI, gateway nyata + loop agen): `src/gateway/gateway.test.ts` (case: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, menulis config + auth ditegakkan): `src/gateway/gateway.test.ts` (case: "runs wizard over ws and writes auth token config")

## Evaluasi keandalan agen (skills)

Kita sudah memiliki beberapa pengujian aman untuk CI yang berperilaku seperti “evaluasi keandalan agen”:

- Pemanggilan tool mock melalui gateway nyata + loop agen (`src/gateway/gateway.test.ts`).
- Alur wizard end-to-end yang memvalidasi wiring sesi dan efek config (`src/gateway/gateway.test.ts`).

Yang masih hilang untuk skills (lihat [Skills](/id/tools/skills)):

- **Pengambilan keputusan:** saat skills dicantumkan di prompt, apakah agen memilih skill yang benar (atau menghindari yang tidak relevan)?
- **Kepatuhan:** apakah agen membaca `SKILL.md` sebelum digunakan dan mengikuti langkah/argumen yang diwajibkan?
- **Kontrak alur kerja:** skenario multi-turn yang menegaskan urutan tool, carryover riwayat sesi, dan batas sandbox.

Evaluasi mendatang sebaiknya tetap deterministik terlebih dahulu:

- Runner skenario yang menggunakan provider mock untuk menegaskan pemanggilan tool + urutan, pembacaan file skill, dan wiring sesi.
- Suite kecil skenario yang berfokus pada skill (gunakan vs hindari, gating, prompt injection).
- Evaluasi live opsional (opt-in, dijaga env) hanya setelah suite aman untuk CI tersedia.

## Pengujian kontrak (bentuk Plugin dan kanal)

Pengujian kontrak memverifikasi bahwa setiap Plugin dan kanal terdaftar sesuai dengan
kontrak antarmukanya. Pengujian ini mengiterasi semua Plugin yang ditemukan dan menjalankan suite
asersi bentuk dan perilaku. Lane unit `pnpm test` default sengaja
melewati file seam bersama dan uji cepat ini; jalankan perintah kontrak secara eksplisit
saat Anda menyentuh permukaan kanal atau provider bersama.

### Perintah

- Semua kontrak: `pnpm test:contracts`
- Hanya kontrak kanal: `pnpm test:contracts:channels`
- Hanya kontrak provider: `pnpm test:contracts:plugins`

### Kontrak kanal

Terletak di `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Bentuk Plugin dasar (id, name, capabilities)
- **setup** - Kontrak wizard penyiapan
- **session-binding** - Perilaku binding sesi
- **outbound-payload** - Struktur payload pesan
- **inbound** - Penanganan pesan masuk
- **actions** - Handler aksi kanal
- **threading** - Penanganan ID thread
- **directory** - API direktori/roster
- **group-policy** - Penegakan kebijakan grup

### Kontrak status provider

Terletak di `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe status kanal
- **registry** - Bentuk registry Plugin

### Kontrak provider

Terletak di `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrak alur auth
- **auth-choice** - Pilihan/pemilihan auth
- **catalog** - API katalog model
- **discovery** - Penemuan Plugin
- **loader** - Pemuatan Plugin
- **runtime** - Runtime provider
- **shape** - Bentuk/antarmuka Plugin
- **wizard** - Wizard penyiapan

### Kapan menjalankan

- Setelah mengubah ekspor atau subpath plugin-sdk
- Setelah menambahkan atau memodifikasi Plugin kanal atau provider
- Setelah me-refactor registrasi atau penemuan Plugin

Pengujian kontrak berjalan di CI dan tidak memerlukan kunci API nyata.

## Menambahkan regresi (panduan)

Saat Anda memperbaiki masalah provider/model yang ditemukan di live:

- Tambahkan regresi aman untuk CI jika memungkinkan (provider mock/stub, atau tangkap transformasi bentuk permintaan persisnya)
- Jika secara inheren hanya live (rate limit, kebijakan auth), pertahankan pengujian live tetap sempit dan opt-in melalui env var
- Lebih baik menargetkan lapisan terkecil yang menangkap bug:
  - bug konversi/replay permintaan provider → pengujian model langsung
  - bug pipeline sesi/riwayat/tool gateway → uji live gateway atau pengujian mock gateway aman untuk CI
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` menurunkan satu target sampel per kelas SecretRef dari metadata registry (`listSecretTargetRegistryEntries()`), lalu menegaskan id exec segmen traversal ditolak.
  - Jika Anda menambahkan keluarga target SecretRef `includeInPlan` baru di `src/secrets/target-registry-data.ts`, perbarui `classifyTargetClass` dalam pengujian tersebut. Pengujian sengaja gagal pada id target yang tidak terklasifikasi sehingga kelas baru tidak dapat dilewati secara diam-diam.

## Terkait

- [Pengujian live](/id/help/testing-live)
- [Pengujian pembaruan dan Plugin](/id/help/testing-updates-plugins)
- [CI](/id/ci)
