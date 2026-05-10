---
read_when:
    - Menjalankan pengujian secara lokal atau di CI
    - Menambahkan uji regresi untuk bug model/penyedia
    - Menelusuri kesalahan perilaku Gateway + agen
summary: 'Perangkat pengujian: rangkaian pengujian unit/e2e/live, runner Docker, dan cakupan setiap pengujian'
title: Pengujian
x-i18n:
    generated_at: "2026-05-10T19:39:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: af4c839e5557ddbe8350a022afa06f2d73b455323d8e3928e1ee1ed8910da76e
    source_path: help/testing.md
    workflow: 16
---

OpenClaw memiliki tiga suite Vitest (unit/integrasi, e2e, live) dan sekumpulan kecil
runner Docker. Dokumen ini adalah panduan "cara kami menguji":

- Apa yang dicakup setiap suite (dan apa yang sengaja _tidak_ dicakup).
- Perintah mana yang dijalankan untuk alur kerja umum (lokal, pra-push, debugging).
- Bagaimana pengujian live menemukan kredensial dan memilih model/provider.
- Cara menambahkan regresi untuk masalah model/provider dunia nyata.

<Note>
**Stack QA (qa-lab, qa-channel, jalur transport live)** didokumentasikan secara terpisah:

- [Ikhtisar QA](/id/concepts/qa-e2e-automation) - arsitektur, permukaan perintah, penulisan skenario.
- [Matrix QA](/id/concepts/qa-matrix) - referensi untuk `pnpm openclaw qa matrix`.
- [Channel QA](/id/channels/qa-channel) - plugin transport sintetis yang digunakan oleh skenario berbasis repo.

Halaman ini mencakup menjalankan suite pengujian reguler dan runner Docker/Parallels. Bagian runner khusus QA di bawah ([Runner khusus QA](#qa-specific-runners)) mencantumkan invokasi `qa` yang konkret dan merujuk kembali ke referensi di atas.
</Note>

## Mulai cepat

Pada kebanyakan hari:

- Gate penuh (diharapkan sebelum push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Jalankan full-suite lokal yang lebih cepat di mesin yang lega: `pnpm test:max`
- Loop watch Vitest langsung: `pnpm test:watch`
- Penargetan file langsung kini juga merutekan path extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Utamakan run bertarget terlebih dahulu saat Anda melakukan iterasi pada satu kegagalan.
- Situs QA berbasis Docker: `pnpm qa:lab:up`
- Jalur QA berbasis VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Saat Anda menyentuh pengujian atau menginginkan keyakinan ekstra:

- Gate cakupan: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Saat men-debug provider/model nyata (memerlukan kredensial nyata):

- Suite live (model + probe tool/gambar gateway): `pnpm test:live`
- Targetkan satu file live secara senyap: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Laporan performa runtime: dispatch `OpenClaw Performance` dengan
  `live_gpt54=true` untuk giliran agen `openai/gpt-5.4` nyata atau
  `deep_profile=true` untuk artefak CPU/heap/trace Kova. Run terjadwal harian
  menerbitkan artefak jalur mock-provider, deep-profile, dan GPT 5.4 ke
  `openclaw/clawgrit-reports` ketika `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi. Laporan
  mock-provider juga mencakup angka boot Gateway tingkat sumber, memori,
  tekanan Plugin, hello-loop fake-model berulang, dan startup CLI.
- Sweep model live Docker: `pnpm test:docker:live-models`
  - Setiap model yang dipilih kini menjalankan satu giliran teks ditambah probe kecil bergaya baca-file.
    Model yang metadatanya mengiklankan input `image` juga menjalankan satu giliran gambar kecil.
    Nonaktifkan probe ekstra dengan `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` atau
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` saat mengisolasi kegagalan provider.
  - Cakupan CI: `OpenClaw Scheduled Live And E2E Checks` harian dan
    `OpenClaw Release Checks` manual sama-sama memanggil workflow live/E2E yang dapat digunakan ulang dengan
    `include_live_suites: true`, yang mencakup job matriks model live Docker terpisah
    yang di-shard berdasarkan provider.
  - Untuk rerun CI terfokus, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    dengan `include_live_suites: true` dan `live_models_only: true`.
  - Tambahkan secret provider bersinyal tinggi baru ke `scripts/ci-hydrate-live-auth.sh`
    serta `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dan caller
    terjadwal/rilisnya.
- Smoke bound-chat Codex native: `pnpm test:docker:live-codex-bind`
  - Menjalankan jalur live Docker terhadap path app-server Codex, mengikat DM Slack sintetis dengan `/codex bind`, menjalankan `/codex fast` dan
    `/codex permissions`, lalu memverifikasi reply biasa dan attachment gambar
    dirutekan melalui binding Plugin native alih-alih ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Menjalankan giliran agen gateway melalui harness app-server Codex milik Plugin,
    memverifikasi `/codex status` dan `/codex models`, dan secara default menjalankan probe gambar,
    Cron MCP, sub-agen, dan Guardian. Nonaktifkan probe sub-agen dengan
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` saat mengisolasi kegagalan app-server Codex lain. Untuk pemeriksaan sub-agen terfokus, nonaktifkan probe lain:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Ini keluar setelah probe sub-agen kecuali
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` disetel.
- Smoke instalasi Codex sesuai permintaan: `pnpm test:docker:codex-on-demand`
  - Menginstal tarball OpenClaw yang telah dikemas di Docker, menjalankan onboarding kunci API OpenAI,
    dan memverifikasi Plugin Codex plus dependensi `@openai/codex`
    diunduh ke root npm terkelola sesuai permintaan.
- Smoke dependensi tool Plugin live: `pnpm test:docker:live-plugin-tool`
  - Mengemas Plugin fixture dengan dependensi `slugify` nyata, menginstalnya melalui
    `npm-pack:`, memverifikasi dependensi di bawah root npm terkelola, lalu meminta
    model OpenAI live untuk memanggil tool Plugin dan mengembalikan slug tersembunyi.
- Smoke perintah rescue Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Pemeriksaan opt-in berlapis untuk permukaan perintah rescue channel pesan.
    Ini menjalankan `/crestodian status`, mengantrekan perubahan model persisten,
    membalas `/crestodian yes`, dan memverifikasi path tulis audit/konfigurasi.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Menjalankan Crestodian dalam container tanpa konfigurasi dengan CLI Claude palsu di `PATH`
    dan memverifikasi fallback planner fuzzy diterjemahkan menjadi penulisan konfigurasi bertipe yang diaudit.
- Smoke Docker first-run Crestodian: `pnpm test:docker:crestodian-first-run`
  - Memulai dari direktori state OpenClaw kosong, merutekan `openclaw` polos ke
    Crestodian, menerapkan penulisan setup/model/agen/Plugin Discord + SecretRef,
    memvalidasi konfigurasi, dan memverifikasi entri audit. Path setup Ring 0 yang sama
    juga dicakup di QA Lab oleh
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke biaya Moonshot/Kimi: dengan `MOONSHOT_API_KEY` disetel, jalankan
  `openclaw models list --provider moonshot --json`, lalu jalankan
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  yang terisolasi terhadap `moonshot/kimi-k2.6`. Verifikasi JSON melaporkan Moonshot/K2.6 dan
  transkrip asisten menyimpan `usage.cost` yang dinormalisasi.

<Tip>
Saat Anda hanya membutuhkan satu kasus yang gagal, utamakan mempersempit pengujian live melalui env var allowlist yang dijelaskan di bawah.
</Tip>

## Runner khusus QA

Perintah-perintah ini berada di samping suite pengujian utama saat Anda membutuhkan realisme QA-lab:

CI menjalankan QA Lab dalam workflow khusus. Paritas agentic bersarang di bawah
`QA-Lab - All Lanes` dan validasi rilis, bukan workflow PR mandiri.
Validasi luas harus menggunakan `Full Release Validation` dengan
`rerun_group=qa-parity` atau grup QA release-checks. Pemeriksaan rilis stabil/default
menyimpan soak live/Docker menyeluruh di balik `run_release_soak=true`; profil
`full` memaksa soak aktif. `QA-Lab - All Lanes`
berjalan setiap malam di `main` dan dari dispatch manual dengan jalur mock parity, jalur Matrix live, jalur Telegram live terkelola Convex, dan jalur Discord live terkelola Convex sebagai job paralel. QA terjadwal dan pemeriksaan rilis meneruskan Matrix
`--profile fast` secara eksplisit, sementara input workflow CLI Matrix dan manual
tetap default `all`; dispatch manual dapat men-shard `all` menjadi job `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`. `OpenClaw Release
Checks` menjalankan parity plus jalur Matrix cepat dan Telegram sebelum persetujuan rilis, menggunakan `mock-openai/gpt-5.5` untuk pemeriksaan transport rilis agar tetap
deterministik dan menghindari startup Plugin provider normal. Gateway transport live ini
menonaktifkan pencarian memori; perilaku memori tetap dicakup oleh suite QA parity.

Shard media live rilis penuh menggunakan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang sudah memiliki
`ffmpeg` dan `ffprobe`. Shard model/backend live Docker menggunakan image bersama
`ghcr.io/openclaw/openclaw-live-test:<sha>` yang dibangun sekali per commit yang dipilih,
lalu menariknya dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` alih-alih membangun ulang
di dalam setiap shard.

- `pnpm openclaw qa suite`
  - Menjalankan skenario QA berbasis repo langsung di host.
  - Menjalankan beberapa skenario terpilih secara paralel secara default dengan
    worker gateway yang terisolasi. `qa-channel` default ke konkurensi 4 (dibatasi oleh
    jumlah skenario yang dipilih). Gunakan `--concurrency <count>` untuk menyesuaikan jumlah
    worker, atau `--concurrency 1` untuk jalur serial yang lebih lama.
  - Keluar dengan non-zero ketika skenario mana pun gagal. Gunakan `--allow-failures` ketika Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Mendukung mode provider `live-frontier`, `mock-openai`, dan `aimock`.
    `aimock` memulai server provider lokal berbasis AIMock untuk cakupan fixture
    dan mock protokol eksperimental tanpa menggantikan jalur `mock-openai`
    yang sadar skenario.
- `pnpm test:plugins:kitchen-sink-live`
  - Menjalankan gauntlet Plugin OpenAI Kitchen Sink langsung melalui QA Lab. Ini
    menginstal paket Kitchen Sink eksternal, memverifikasi inventaris permukaan SDK plugin,
    memeriksa `/healthz` dan `/readyz`, mencatat bukti CPU/RSS Gateway,
    menjalankan satu giliran OpenAI langsung, dan memeriksa diagnostik adversarial.
    Memerlukan autentikasi OpenAI langsung seperti `OPENAI_API_KEY`. Dalam sesi Testbox
    yang terhidrasi, ini otomatis memuat profil autentikasi langsung Testbox ketika helper
    `openclaw-testbox-env` tersedia.
- `pnpm test:gateway:cpu-scenarios`
  - Menjalankan bench startup Gateway plus paket skenario kecil mock QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) dan menulis ringkasan observasi CPU gabungan
    di bawah `.artifacts/gateway-cpu-scenarios/`.
  - Secara default hanya menandai observasi CPU panas yang berkelanjutan (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), sehingga lonjakan startup singkat dicatat sebagai metrik
    tanpa terlihat seperti regresi Gateway yang terkunci selama beberapa menit.
  - Menggunakan artefak `dist` yang sudah dibangun; jalankan build terlebih dahulu ketika checkout
    belum memiliki output runtime yang segar.
- `pnpm openclaw qa suite --runner multipass`
  - Menjalankan suite QA yang sama di dalam VM Linux Multipass sekali pakai.
  - Mempertahankan perilaku pemilihan skenario yang sama seperti `qa suite` di host.
  - Menggunakan ulang flag pemilihan provider/model yang sama seperti `qa suite`.
  - Run langsung meneruskan input autentikasi QA yang didukung dan praktis untuk guest:
    kunci provider berbasis env, path konfigurasi provider langsung QA, dan `CODEX_HOME`
    bila ada.
  - Direktori output harus tetap berada di bawah root repo agar guest dapat menulis kembali melalui
    workspace yang di-mount.
  - Menulis laporan + ringkasan QA normal serta log Multipass di bawah
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Memulai situs QA berbasis Docker untuk pekerjaan QA bergaya operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Membangun tarball npm dari checkout saat ini, menginstalnya secara global di
    Docker, menjalankan onboarding kunci API OpenAI non-interaktif, mengonfigurasi Telegram
    secara default, memverifikasi runtime plugin terpaket dimuat tanpa perbaikan dependensi
    saat startup, menjalankan doctor, dan menjalankan satu giliran agen lokal terhadap
    endpoint OpenAI yang di-mock.
  - Gunakan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` untuk menjalankan jalur install terpaket
    yang sama dengan Discord.
- `pnpm test:docker:session-runtime-context`
  - Menjalankan smoke Docker app terbangun yang deterministik untuk transkrip konteks runtime
    tertanam. Ini memverifikasi konteks runtime OpenClaw tersembunyi dipertahankan sebagai
    pesan kustom non-display alih-alih bocor ke giliran pengguna yang terlihat,
    lalu menanam JSONL sesi rusak yang terdampak dan memverifikasi
    `openclaw doctor --fix` menulis ulangnya ke branch aktif dengan backup.
- `pnpm test:docker:npm-telegram-live`
  - Menginstal kandidat paket OpenClaw di Docker, menjalankan onboarding paket terinstal,
    mengonfigurasi Telegram melalui CLI terinstal, lalu menggunakan ulang jalur QA Telegram
    langsung dengan paket terinstal tersebut sebagai Gateway SUT.
  - Wrapper hanya me-mount sumber harness `qa-lab` dari checkout; paket terinstal
    memiliki `dist`, `openclaw/plugin-sdk`, dan runtime plugin terbundel sehingga jalur
    tidak mencampur plugin checkout saat ini ke dalam paket yang diuji.
  - Default ke `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; setel
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` atau
    `OPENCLAW_CURRENT_PACKAGE_TGZ` untuk menguji tarball lokal yang sudah di-resolve alih-alih
    menginstal dari registry.
  - Menggunakan kredensial env Telegram yang sama atau sumber kredensial Convex seperti
    `pnpm openclaw qa telegram`. Untuk otomatisasi CI/rilis, setel
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` dan secret peran. Jika
    `OPENCLAW_QA_CONVEX_SITE_URL` dan secret peran Convex ada di CI,
    wrapper Docker memilih Convex secara otomatis.
  - Wrapper memvalidasi env kredensial Telegram atau Convex di host sebelum
    pekerjaan build/install Docker. Setel `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    hanya ketika sengaja men-debug penyiapan pra-kredensial.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` mengesampingkan
    `OPENCLAW_QA_CREDENTIAL_ROLE` bersama hanya untuk jalur ini.
  - GitHub Actions mengekspos jalur ini sebagai workflow maintainer manual
    `NPM Telegram Beta E2E`. Ini tidak berjalan saat merge. Workflow menggunakan environment
    `qa-live-shared` dan lease kredensial Convex CI.
- GitHub Actions juga mengekspos `Package Acceptance` untuk bukti produk side-run
  terhadap satu paket kandidat. Ini menerima ref tepercaya, spec npm yang dipublikasikan,
  URL tarball HTTPS plus SHA-256, atau artefak tarball dari run lain, mengunggah
  `openclaw-current.tgz` yang dinormalisasi sebagai `package-under-test`, lalu menjalankan
  scheduler Docker E2E yang ada dengan profil jalur smoke, package, product, full, atau custom.
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
    dengan OpenAI yang dikonfigurasi, lalu mengaktifkan channel/plugin terbundel melalui edit
    konfigurasi.
  - Memverifikasi discovery penyiapan membiarkan plugin downloadable yang belum dikonfigurasi tetap tidak ada,
    perbaikan doctor pertama yang dikonfigurasi menginstal setiap plugin downloadable yang hilang
    secara eksplisit, dan restart kedua tidak menjalankan perbaikan dependensi
    tersembunyi.
  - Juga menginstal baseline npm lama yang diketahui, mengaktifkan Telegram sebelum menjalankan
    `openclaw update --tag <candidate>`, dan memverifikasi doctor pasca-update kandidat
    membersihkan sisa dependensi plugin legacy tanpa perbaikan postinstall
    di sisi harness.
- `pnpm test:parallels:npm-update`
  - Menjalankan smoke update install terpaket native di seluruh guest Parallels. Setiap
    platform terpilih pertama-tama menginstal paket baseline yang diminta, lalu menjalankan
    perintah `openclaw update` yang terinstal di guest yang sama dan memverifikasi
    versi terinstal, status update, kesiapan Gateway, dan satu giliran agen lokal.
  - Gunakan `--platform macos`, `--platform windows`, atau `--platform linux` saat
    iterasi pada satu guest. Gunakan `--json` untuk path artefak ringkasan dan
    status per jalur.
  - Jalur OpenAI menggunakan `openai/gpt-5.5` untuk bukti giliran agen langsung secara
    default. Berikan `--model <provider/model>` atau setel
    `OPENCLAW_PARALLELS_OPENAI_MODEL` ketika sengaja memvalidasi model OpenAI
    lain.
  - Bungkus run lokal yang panjang dalam timeout host agar kemacetan transport Parallels tidak
    menghabiskan sisa jendela pengujian:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrip menulis log jalur bertingkat di bawah `/tmp/openclaw-parallels-npm-update.*`.
    Periksa `windows-update.log`, `macos-update.log`, atau `linux-update.log`
    sebelum mengasumsikan wrapper luar macet.
  - Update Windows dapat menghabiskan 10 hingga 15 menit dalam pekerjaan doctor pasca-update dan
    update paket pada guest dingin; itu masih sehat ketika log debug npm
    bertingkat terus berjalan.
  - Jangan jalankan wrapper agregat ini secara paralel dengan jalur smoke Parallels
    macOS, Windows, atau Linux individual. Mereka berbagi state VM dan dapat bertabrakan pada
    pemulihan snapshot, penyajian paket, atau state Gateway guest.
  - Bukti pasca-update menjalankan permukaan plugin terbundel normal karena
    facade capability seperti ucapan, pembuatan gambar, dan pemahaman media
    dimuat melalui API runtime terbundel bahkan ketika giliran agen itu sendiri
    hanya memeriksa respons teks sederhana.

- `pnpm openclaw qa aimock`
  - Memulai hanya server provider AIMock lokal untuk pengujian smoke protokol
    langsung.
- `pnpm openclaw qa matrix`
  - Menjalankan jalur QA Matrix langsung terhadap homeserver Tuwunel sekali pakai berbasis Docker. Hanya checkout sumber - install terpaket tidak menyertakan `qa-lab`.
  - CLI lengkap, katalog profil/skenario, env vars, dan tata letak artefak: [QA Matrix](/id/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Menjalankan jalur QA Telegram langsung terhadap grup privat nyata menggunakan token bot driver dan SUT dari env.
  - Memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID grup harus berupa ID chat Telegram numerik.
  - Mendukung `--credential-source convex` untuk kredensial pooled bersama. Gunakan mode env secara default, atau setel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` untuk ikut menggunakan lease pooled.
  - Default mencakup canary, gating mention, addressing perintah, `/status`, balasan bot-ke-bot yang disebut, dan balasan perintah native inti. Default `mock-openai` juga mencakup regresi reply-chain deterministik dan streaming pesan final Telegram. Gunakan `--list-scenarios` untuk probe opsional seperti `session_status`.
  - Keluar dengan non-zero ketika skenario mana pun gagal. Gunakan `--allow-failures` ketika Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Memerlukan dua bot berbeda dalam grup privat yang sama, dengan bot SUT mengekspos username Telegram.
  - Untuk observasi bot-ke-bot yang stabil, aktifkan Mode Komunikasi Bot-ke-Bot di `@BotFather` untuk kedua bot dan pastikan bot driver dapat mengamati traffic bot grup.
  - Menulis laporan QA Telegram, ringkasan, dan artefak pesan yang diamati di bawah `.artifacts/qa-e2e/...`. Skenario balasan mencakup RTT dari permintaan kirim driver hingga balasan SUT yang diamati.

`Mantis Telegram Live` adalah wrapper bukti PR di sekitar jalur ini. Ini menjalankan
ref kandidat dengan kredensial Telegram yang di-lease Convex, merender transkrip
pesan yang diamati dan sudah direduksi di browser desktop Crabbox, merekam bukti MP4,
menghasilkan GIF yang dipangkas berdasarkan gerakan, mengunggah bundle artefak, dan memposting bukti PR
inline melalui Mantis GitHub App ketika `pr_number` disetel. Maintainer dapat
memulainya dari UI Actions melalui `Mantis Scenario` (`scenario_id:
telegram-live`) atau langsung dari komentar pull request:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Menyewa atau menggunakan ulang desktop Linux Crabbox, menginstal Telegram Desktop native, mengonfigurasi OpenClaw dengan token bot SUT Telegram yang disewa, memulai gateway, dan merekam bukti tangkapan layar/MP4 dari desktop VNC yang terlihat.
  - Default ke `--credential-source convex` sehingga alur kerja hanya memerlukan rahasia broker Convex. Gunakan `--credential-source env` dengan variabel `OPENCLAW_QA_TELEGRAM_*` yang sama seperti `pnpm openclaw qa telegram`.
  - Telegram Desktop tetap memerlukan login/profil pengguna. Token bot hanya mengonfigurasi OpenClaw. Gunakan `--telegram-profile-archive-env <name>` untuk arsip profil `.tgz` base64, atau gunakan `--keep-lease` dan masuk secara manual melalui VNC satu kali.
  - Menulis `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png`, dan `telegram-desktop-builder.mp4` di bawah direktori output.

Lane transport live berbagi satu kontrak standar agar transport baru tidak menyimpang; matriks cakupan per-lane berada di [Ikhtisar QA → Cakupan transport live](/id/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` adalah suite sintetis luas dan bukan bagian dari matriks tersebut.

### Kredensial Telegram bersama melalui Convex (v1)

Saat `--credential-source convex` (atau `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) diaktifkan untuk
QA transport live, lab QA memperoleh lease eksklusif dari pool yang didukung Convex, mengirim heartbeat untuk
lease tersebut saat lane berjalan, dan melepaskan lease saat shutdown. Nama bagian ini mendahului
dukungan Discord, Slack, dan WhatsApp; kontrak lease dibagikan lintas jenis.

Scaffold proyek Convex referensi:

- `qa/convex-credential-broker/`

Variabel env wajib:

- `OPENCLAW_QA_CONVEX_SITE_URL` (misalnya `https://your-deployment.convex.site`)
- Satu rahasia untuk peran yang dipilih:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` untuk `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` untuk `ci`
- Pemilihan peran kredensial:
  - CLI: `--credential-role maintainer|ci`
  - Default env: `OPENCLAW_QA_CREDENTIAL_ROLE` (default ke `ci` di CI, selain itu `maintainer`)

Variabel env opsional:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (default `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (default `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (default `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (default `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (default `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id pelacakan opsional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` mengizinkan URL Convex loopback `http://` untuk pengembangan khusus lokal.

`OPENCLAW_QA_CONVEX_SITE_URL` sebaiknya menggunakan `https://` dalam operasi normal.

Perintah admin maintainer (tambah/hapus/daftar pool) secara khusus memerlukan
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI untuk maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gunakan `doctor` sebelum run live untuk memeriksa URL situs Convex, rahasia broker,
prefiks endpoint, timeout HTTP, dan keterjangkauan admin/list tanpa mencetak
nilai rahasia. Gunakan `--json` untuk output yang dapat dibaca mesin dalam skrip dan utilitas CI.

Kontrak endpoint default (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Permintaan: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Berhasil: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Habis/dapat dicoba ulang: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /payload-chunk`
  - Permintaan: `{ kind, ownerId, actorRole, credentialId, leaseToken, index }`
  - Berhasil: `{ status: "ok", index, data }`
- `POST /heartbeat`
  - Permintaan: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Berhasil: `{ status: "ok" }` (atau `2xx` kosong)
- `POST /release`
  - Permintaan: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Berhasil: `{ status: "ok" }` (atau `2xx` kosong)
- `POST /admin/add` (hanya rahasia maintainer)
  - Permintaan: `{ kind, actorId, payload, note?, status? }`
  - Berhasil: `{ status: "ok", credential }`
- `POST /admin/remove` (hanya rahasia maintainer)
  - Permintaan: `{ credentialId, actorId }`
  - Berhasil: `{ status: "ok", changed, credential }`
  - Pelindung lease aktif: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (hanya rahasia maintainer)
  - Permintaan: `{ kind?, status?, includePayload?, limit? }`
  - Berhasil: `{ status: "ok", credentials, count }`

Bentuk payload untuk jenis Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` harus berupa string id chat Telegram numerik.
- `admin/add` memvalidasi bentuk ini untuk `kind: "telegram"` dan menolak payload yang tidak sesuai.

Bentuk payload untuk jenis pengguna nyata Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId`, dan `telegramApiId` harus berupa string numerik.
- `tdlibArchiveSha256` dan `desktopTdataArchiveSha256` harus berupa string heksadesimal SHA-256.
- `kind: "telegram-user"` merepresentasikan satu akun burner Telegram. Perlakukan lease sebagai seluas akun: driver CLI TDLib dan saksi visual Telegram Desktop dipulihkan dari payload yang sama, dan hanya satu job yang boleh memegang lease pada satu waktu.

Pemulihan lease pengguna nyata Telegram:

```bash
tmp=$(mktemp -d /tmp/openclaw-telegram-user.XXXXXX)
node --import tsx scripts/e2e/telegram-user-credential.ts lease-restore \
  --user-driver-dir "$tmp/user-driver" \
  --desktop-workdir "$tmp/desktop" \
  --lease-file "$tmp/lease.json"
TELEGRAM_USER_DRIVER_STATE_DIR="$tmp/user-driver" \
  uv run ~/.codex/skills/custom/telegram-e2e-bot-to-bot/scripts/user-driver.py status --json
node --import tsx scripts/e2e/telegram-user-credential.ts release --lease-file "$tmp/lease.json"
```

Gunakan profil Desktop yang dipulihkan dengan `Telegram -workdir "$tmp/desktop"` saat perekaman visual diperlukan. Di lingkungan operator lokal, `scripts/e2e/telegram-user-credential.ts` membaca `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env` secara default jika variabel env proses tidak ada.

Sesi Crabbox yang digerakkan agen:

```bash
pnpm qa:telegram-user:crabbox -- start \
  --tdlib-url http://artifacts.openclaw.ai/tdlib-v1.8.0-linux-x64.tgz \
  --output-dir .artifacts/qa-e2e/telegram-user-crabbox/pr-review
pnpm qa:telegram-user:crabbox -- send \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json \
  --text /status
pnpm qa:telegram-user:crabbox -- finish \
  --session .artifacts/qa-e2e/telegram-user-crabbox/pr-review/session.json
```

`start` menyewa kredensial `telegram-user`, memulihkan akun yang sama ke
TDLib dan Telegram Desktop pada desktop Linux Crabbox, memulai gateway SUT mock lokal
dari checkout saat ini, membuka chat Telegram yang terlihat, memulai
perekaman desktop, dan menulis `session.json` privat. Selama sesi
aktif, agen dapat terus menguji hingga puas:

- `send --session <file> --text <message>` mengirim melalui pengguna TDLib nyata dan menunggu balasan SUT.
- `run --session <file> -- <remote command>` menjalankan perintah arbitrer di Crabbox dan menyimpan outputnya, misalnya `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- `screenshot --session <file>` menangkap desktop yang saat ini terlihat.
- `status --session <file>` mencetak lease dan perintah WebVNC.
- `finish --session <file>` menghentikan recorder, menangkap artefak tangkapan layar/video/motion-trim, melepaskan kredensial Convex, menghentikan proses SUT lokal, dan menghentikan lease Crabbox kecuali `--keep-box` diberikan.
- `publish --session <file> --pr <number>` memublikasikan komentar PR hanya GIF secara default. Berikan `--full-artifacts` hanya saat log atau artefak JSON memang diperlukan.

Untuk repro visual deterministik, berikan `--mock-response-file <path>` ke `start`
atau ke singkatan satu perintah `probe`. Runner default ke kelas
Crabbox standar, perekaman 24fps, pratinjau GIF motion 24fps, dan lebar GIF
1920px. Timpa dengan `--class`, `--record-fps`, `--preview-fps`, dan
`--preview-width` hanya saat bukti memerlukan pengaturan tangkapan yang berbeda.

Bukti Crabbox satu perintah:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

Perintah default `probe` adalah singkatan untuk satu siklus start/send/finish. Gunakan
itu untuk smoke `/status` cepat. Gunakan perintah sesi untuk review PR,
pekerjaan reproduksi bug, atau kasus apa pun saat agen memerlukan beberapa menit
eksperimen arbitrer sebelum memutuskan bukti sudah lengkap. Gunakan `--id <cbx_...>` untuk
menggunakan ulang lease desktop hangat, `--keep-box` untuk menjaga VNC tetap terbuka setelah finish,
`--desktop-chat-title <name>` untuk memilih chat yang terlihat, dan `--tdlib-url <tgz>`
saat menggunakan arsip Linux `libtdjson.so` yang sudah dipanggang alih-alih membangun TDLib di
box baru. Runner memverifikasi `--tdlib-url` dengan `--tdlib-sha256 <hex>` atau,
secara default, file saudara `<url>.sha256`.

Payload multi-channel yang divalidasi broker:

- Discord: `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string, voiceChannelId?: string }`
- WhatsApp: `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`

Lane Slack juga dapat menyewa dari pool, tetapi validasi payload Slack saat ini
berada di runner QA Slack, bukan di broker. Gunakan
`{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`
untuk baris Slack.

### Menambahkan channel ke QA

Arsitektur dan nama helper skenario untuk adapter channel baru berada di [Ikhtisar QA → Menambahkan channel](/id/concepts/qa-e2e-automation#adding-a-channel). Batas minimum: implementasikan runner transport pada seam host `qa-lab` bersama, deklarasikan `qaRunners` dalam manifes plugin, mount sebagai `openclaw qa <runner>`, dan tulis skenario di bawah `qa/scenarios/`.

## Suite pengujian (apa yang berjalan di mana)

Anggap suite sebagai "realisme yang meningkat" (dan flakiness/biaya yang meningkat):

### Unit / integrasi (default)

- Perintah: `pnpm test`
- Konfigurasi: run tanpa target menggunakan set shard `vitest.full-*.config.ts` dan dapat memperluas shard multi-proyek menjadi konfigurasi per-proyek untuk penjadwalan paralel
- File: inventori core/unit di bawah `src/**/*.test.ts`, `packages/**/*.test.ts`, dan `test/**/*.test.ts`; pengujian unit UI berjalan di shard khusus `unit-ui`
- Cakupan:
  - Pengujian unit murni
  - Pengujian integrasi dalam proses (auth gateway, routing, tooling, parsing, config)
  - Regresi deterministik untuk bug yang diketahui
- Ekspektasi:
  - Berjalan di CI
  - Tidak memerlukan key nyata
  - Harus cepat dan stabil
  - Pengujian resolver dan loader permukaan publik harus membuktikan perilaku fallback `api.js` dan
    `runtime-api.js` luas dengan fixture plugin kecil yang dihasilkan, bukan
    API sumber plugin bawaan nyata. Load API plugin nyata berada di
    suite kontrak/integrasi milik plugin.

Kebijakan dependensi native:

- Instalasi pengujian default melewati build opus Discord native opsional. Penerimaan suara Discord menggunakan decoder `opusscript` JS murni, dan `@discordjs/opus` tetap berada di `ignoredBuiltDependencies` sehingga pengujian lokal dan lane Testbox tidak mengompilasi addon native.
- Gunakan lane performa suara Discord khusus atau lane live jika Anda sengaja perlu membandingkan build opus native. Jangan menambahkan `@discordjs/opus` kembali ke `onlyBuiltDependencies` default; itu membuat loop instalasi/pengujian yang tidak terkait mengompilasi kode native.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` tanpa target menjalankan dua belas konfigurasi shard yang lebih kecil (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) alih-alih satu proses proyek root native yang sangat besar. Ini mengurangi puncak RSS pada mesin yang sedang terbebani dan mencegah pekerjaan auto-reply/ekstensi membuat suite lain kekurangan sumber daya.
    - `pnpm test --watch` tetap menggunakan grafik proyek root native `vitest.config.ts`, karena loop watch multi-shard tidak praktis.
    - `pnpm test`, `pnpm test:watch`, dan `pnpm test:perf:imports` merutekan target file/direktori eksplisit melalui lane berscope terlebih dahulu, sehingga `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` menghindari biaya startup proyek root penuh.
    - `pnpm test:changed` secara default memperluas path git yang berubah menjadi lane berscope murah: edit test langsung, file saudara `*.test.ts`, pemetaan source eksplisit, dan dependen grafik impor lokal. Edit config/setup/package tidak menjalankan test secara luas kecuali Anda secara eksplisit menggunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` adalah gate pemeriksaan lokal cerdas normal untuk pekerjaan sempit. Perintah ini mengklasifikasikan diff ke dalam core, test core, ekstensi, test ekstensi, aplikasi, docs, metadata rilis, tooling Docker live, dan tooling, lalu menjalankan typecheck, lint, dan perintah guard yang sesuai. Perintah ini tidak menjalankan test Vitest; panggil `pnpm test:changed` atau `pnpm test <target>` eksplisit untuk bukti test. Kenaikan versi yang hanya metadata rilis menjalankan pemeriksaan versi/config/dependensi-root bertarget, dengan guard yang menolak perubahan package di luar field versi tingkat atas.
    - Edit harness Docker ACP live menjalankan pemeriksaan terfokus: sintaks shell untuk skrip auth Docker live dan dry-run scheduler Docker live. Perubahan `package.json` hanya disertakan ketika diff terbatas pada `scripts["test:docker:live-*"]`; edit dependensi, export, versi, dan permukaan package lainnya tetap menggunakan guard yang lebih luas.
    - Test unit ringan impor dari agents, commands, plugins, helper auto-reply, `plugin-sdk`, dan area utilitas murni serupa dirutekan melalui lane `unit-fast`, yang melewati `test/setup-openclaw-runtime.ts`; file stateful/berat runtime tetap berada di lane yang ada.
    - File source helper `plugin-sdk` dan `commands` tertentu juga memetakan run mode changed ke test saudara eksplisit di lane ringan tersebut, sehingga edit helper menghindari menjalankan ulang seluruh suite berat untuk direktori itu.
    - `auto-reply` memiliki bucket khusus untuk helper core tingkat atas, test integrasi `reply.*` tingkat atas, dan subtree `src/auto-reply/reply/**`. CI selanjutnya memecah subtree reply menjadi shard agent-runner, dispatch, dan commands/state-routing agar satu bucket yang berat impor tidak memiliki seluruh ekor Node.
    - CI PR/main normal sengaja melewati sweep batch ekstensi dan shard `agentic-plugins` khusus rilis. Full Release Validation memicu workflow anak `Plugin Prerelease` terpisah untuk suite yang berat plugin/ekstensi tersebut pada kandidat rilis.

  </Accordion>

  <Accordion title="Cakupan runner tertanam">

    - Saat Anda mengubah input penemuan message-tool atau konteks runtime Compaction,
      pertahankan kedua tingkat cakupan.
    - Tambahkan regresi helper terfokus untuk batas routing dan normalisasi
      murni.
    - Jaga agar suite integrasi runner tertanam tetap sehat:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, dan
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Suite tersebut memverifikasi bahwa id berscope dan perilaku Compaction tetap mengalir
      melalui path `run.ts` / `compact.ts` nyata; test yang hanya helper
      bukan pengganti yang memadai untuk path integrasi tersebut.

  </Accordion>

  <Accordion title="Default pool dan isolasi Vitest">

    - Config Vitest dasar default ke `threads`.
    - Config Vitest bersama menetapkan `isolate: false` dan menggunakan
      runner non-terisolasi di seluruh proyek root, config e2e, dan live.
    - Lane UI root mempertahankan setup dan optimizer `jsdom`-nya, tetapi juga berjalan pada
      runner non-terisolasi bersama.
    - Setiap shard `pnpm test` mewarisi default `threads` + `isolate: false`
      yang sama dari config Vitest bersama.
    - `scripts/run-vitest.mjs` menambahkan `--no-maglev` untuk proses Node anak
      Vitest secara default guna mengurangi churn kompilasi V8 selama run lokal besar.
      Tetapkan `OPENCLAW_VITEST_ENABLE_MAGLEV=1` untuk membandingkan dengan perilaku V8
      standar.

  </Accordion>

  <Accordion title="Iterasi lokal cepat">

    - `pnpm changed:lanes` menampilkan lane arsitektur mana yang dipicu oleh diff.
    - Hook pre-commit hanya formatting. Hook ini men-stage ulang file yang diformat dan
      tidak menjalankan lint, typecheck, atau test.
    - Jalankan `pnpm check:changed` secara eksplisit sebelum handoff atau push ketika Anda
      membutuhkan gate pemeriksaan lokal cerdas.
    - `pnpm test:changed` dirutekan melalui lane berscope murah secara default. Gunakan
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika agent
      memutuskan edit harness, config, package, atau kontrak benar-benar membutuhkan
      cakupan Vitest yang lebih luas.
    - `pnpm test:max` dan `pnpm test:changed:max` mempertahankan perilaku routing
      yang sama, hanya dengan batas worker yang lebih tinggi.
    - Auto-scaling worker lokal sengaja konservatif dan mundur
      ketika rata-rata beban host sudah tinggi, sehingga beberapa run Vitest
      bersamaan secara default menghasilkan dampak lebih kecil.
    - Config Vitest dasar menandai proyek/file config sebagai
      `forceRerunTriggers` agar rerun mode changed tetap benar saat wiring test
      berubah.
    - Config mempertahankan `OPENCLAW_VITEST_FS_MODULE_CACHE` aktif pada host yang didukung;
      tetapkan `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` jika Anda menginginkan
      satu lokasi cache eksplisit untuk profiling langsung.

  </Accordion>

  <Accordion title="Debugging performa">

    - `pnpm test:perf:imports` mengaktifkan pelaporan durasi impor Vitest ditambah
      output perincian impor.
    - `pnpm test:perf:imports:changed` membatasi tampilan profiling yang sama ke
      file yang berubah sejak `origin/main`.
    - Data timing shard ditulis ke `.artifacts/vitest-shard-timings.json`.
      Run seluruh config menggunakan path config sebagai key; shard CI
      include-pattern menambahkan nama shard agar shard yang difilter dapat dilacak
      secara terpisah.
    - Ketika satu test panas masih menghabiskan sebagian besar waktunya pada impor startup,
      simpan dependensi berat di balik seam lokal `*.runtime.ts` yang sempit dan
      mock seam itu secara langsung alih-alih deep-import helper runtime hanya
      untuk meneruskannya melalui `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan
      `test:changed` yang dirutekan dengan path proyek root native untuk diff yang sudah di-commit
      tersebut dan mencetak wall time ditambah RSS maksimum macOS.
    - `pnpm test:perf:changed:bench -- --worktree` menjalankan benchmark pada tree dirty
      saat ini dengan merutekan daftar file yang berubah melalui
      `scripts/test-projects.mjs` dan config Vitest root.
    - `pnpm test:perf:profile:main` menulis profil CPU thread utama untuk
      overhead startup dan transform Vitest/Vite.
    - `pnpm test:perf:profile:runner` menulis profil CPU+heap runner untuk
      suite unit dengan paralelisme file dinonaktifkan.

  </Accordion>
</AccordionGroup>

### Stabilitas (gateway)

- Perintah: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, dipaksa ke satu worker
- Scope:
  - Memulai Gateway loopback nyata dengan diagnostik aktif secara default
  - Menjalankan churn pesan gateway sintetis, memori, dan payload besar melalui path event diagnostik
  - Mengueri `diagnostics.stability` melalui RPC WS Gateway
  - Mencakup helper persistensi bundle stabilitas diagnostik
  - Menegaskan bahwa recorder tetap berbatas, sampel RSS sintetis tetap di bawah anggaran tekanan, dan kedalaman antrean per sesi kembali turun ke nol
- Ekspektasi:
  - Aman untuk CI dan tanpa key
  - Lane sempit untuk tindak lanjut regresi stabilitas, bukan pengganti suite Gateway penuh

### E2E (smoke gateway)

- Perintah: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, dan test E2E plugin bundled di bawah `extensions/`
- Default runtime:
  - Menggunakan `threads` Vitest dengan `isolate: false`, sesuai dengan seluruh repo.
  - Menggunakan worker adaptif (CI: hingga 2, lokal: 1 secara default).
  - Berjalan dalam mode silent secara default untuk mengurangi overhead I/O konsol.
- Override berguna:
  - `OPENCLAW_E2E_WORKERS=<n>` untuk memaksa jumlah worker (dibatasi hingga 16).
  - `OPENCLAW_E2E_VERBOSE=1` untuk mengaktifkan kembali output konsol verbose.
- Scope:
  - Perilaku end-to-end gateway multi-instance
  - Permukaan WebSocket/HTTP, pairing node, dan networking yang lebih berat
- Ekspektasi:
  - Berjalan di CI (ketika diaktifkan dalam pipeline)
  - Tidak memerlukan key nyata
  - Lebih banyak bagian bergerak dibanding test unit (bisa lebih lambat)

### E2E: smoke backend OpenShell

- Perintah: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Scope:
  - Memulai gateway OpenShell terisolasi pada host melalui Docker
  - Membuat sandbox dari Dockerfile lokal sementara
  - Melatih backend OpenShell OpenClaw melalui `sandbox ssh-config` nyata + exec SSH
  - Memverifikasi perilaku filesystem remote-kanonis melalui bridge fs sandbox
- Ekspektasi:
  - Hanya opt-in; bukan bagian dari run default `pnpm test:e2e`
  - Memerlukan CLI `openshell` lokal ditambah daemon Docker yang berfungsi
  - Menggunakan `HOME` / `XDG_CONFIG_HOME` terisolasi, lalu menghancurkan gateway dan sandbox test
- Override berguna:
  - `OPENCLAW_E2E_OPENSHELL=1` untuk mengaktifkan test saat menjalankan suite e2e yang lebih luas secara manual
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` untuk menunjuk ke binary CLI atau skrip wrapper non-default

### Live (provider nyata + model nyata)

- Perintah: `pnpm test:live`
- Config: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, dan test live plugin bundled di bawah `extensions/`
- Default: **aktif** oleh `pnpm test:live` (menetapkan `OPENCLAW_LIVE_TEST=1`)
- Scope:
  - "Apakah provider/model ini benar-benar berfungsi _hari ini_ dengan kredensial nyata?"
  - Menangkap perubahan format provider, keunikan tool-calling, masalah auth, dan perilaku rate limit
- Ekspektasi:
  - Secara desain tidak stabil untuk CI (jaringan nyata, kebijakan provider nyata, kuota, outage)
  - Menghabiskan uang / menggunakan rate limit
  - Lebih baik menjalankan subset yang dipersempit daripada "semuanya"
- Run live melakukan source `~/.profile` untuk mengambil API key yang hilang.
- Secara default, run live masih mengisolasi `HOME` dan menyalin material config/auth ke home test sementara sehingga fixture unit tidak dapat mengubah `~/.openclaw` nyata Anda.
- Tetapkan `OPENCLAW_LIVE_USE_REAL_HOME=1` hanya ketika Anda sengaja membutuhkan test live untuk menggunakan direktori home nyata Anda.
- `pnpm test:live` sekarang default ke mode yang lebih senyap: perintah ini mempertahankan output progres `[live] ...`, tetapi menekan pemberitahuan ekstra `~/.profile` dan membisukan log bootstrap gateway/obrolan Bonjour. Tetapkan `OPENCLAW_LIVE_TEST_QUIET=0` jika Anda ingin log startup penuh kembali.
- Rotasi API key (khusus provider): tetapkan `*_API_KEYS` dengan format koma/titik koma atau `*_API_KEY_1`, `*_API_KEY_2` (misalnya `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) atau override per-live melalui `OPENCLAW_LIVE_*_KEY`; test mencoba ulang pada respons rate limit.
- Output progres/Heartbeat:
  - Suite live sekarang mengeluarkan baris progres ke stderr sehingga panggilan provider yang panjang terlihat aktif bahkan ketika capture konsol Vitest senyap.
  - `vitest.live.config.ts` menonaktifkan intersepsi konsol Vitest sehingga baris progres provider/gateway langsung mengalir selama run live.
  - Atur Heartbeat model langsung dengan `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Atur Heartbeat gateway/probe dengan `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Suite mana yang harus saya jalankan?

Gunakan tabel keputusan ini:

- Mengedit logika/pengujian: jalankan `pnpm test` (dan `pnpm test:coverage` jika Anda mengubah banyak hal)
- Menyentuh jaringan gateway / protokol WS / pemasangan: tambahkan `pnpm test:e2e`
- Men-debug "bot saya sedang down" / kegagalan khusus penyedia / pemanggilan alat: jalankan `pnpm test:live` yang dipersempit

## Pengujian langsung (menyentuh jaringan)

Untuk matriks model langsung, smoke backend CLI, smoke ACP, harness server aplikasi Codex, dan semua pengujian langsung penyedia media (Deepgram, BytePlus, ComfyUI, gambar, musik, video, harness media) - ditambah penanganan kredensial untuk eksekusi langsung - lihat [Menguji suite langsung](/id/help/testing-live). Untuk checklist khusus validasi pembaruan dan Plugin, lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins).

## Runner Docker (pemeriksaan opsional "berfungsi di Linux")

Runner Docker ini terbagi menjadi dua kelompok:

- Runner model langsung: `test:docker:live-models` dan `test:docker:live-gateway` hanya menjalankan berkas langsung kunci-profil yang cocok di dalam image Docker repo (`src/agents/models.profiles.live.test.ts` dan `src/gateway/gateway-models.profiles.live.test.ts`), dengan memasang direktori konfigurasi lokal dan workspace Anda (serta memuat `~/.profile` jika dipasang). Titik masuk lokal yang cocok adalah `test:live:models-profiles` dan `test:live:gateway-profiles`.
- Runner langsung Docker secara default memakai batas smoke yang lebih kecil agar sweep Docker penuh tetap praktis:
  `test:docker:live-models` secara default memakai `OPENCLAW_LIVE_MAX_MODELS=12`, dan
  `test:docker:live-gateway` secara default memakai `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, dan
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Timpa variabel env tersebut ketika Anda
  secara eksplisit menginginkan pemindaian menyeluruh yang lebih besar.
- `test:docker:all` membangun image Docker langsung satu kali melalui `test:docker:live-build`, mengemas OpenClaw satu kali sebagai tarball npm melalui `scripts/package-openclaw-for-docker.mjs`, lalu membangun/menggunakan ulang dua image `scripts/e2e/Dockerfile`. Image dasar hanya runner Node/Git untuk jalur install/update/plugin-dependency; jalur tersebut memasang tarball yang sudah dibangun. Image fungsional menginstal tarball yang sama ke `/app` untuk jalur fungsionalitas aplikasi yang sudah dibangun. Definisi jalur Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`; logika perencana berada di `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` menjalankan rencana yang dipilih. Agregat menggunakan penjadwal lokal berbobot: `OPENCLAW_DOCKER_ALL_PARALLELISM` mengontrol slot proses, sementara batas sumber daya mencegah jalur langsung berat, npm-install, dan multi-layanan semuanya dimulai sekaligus. Jika satu jalur lebih berat daripada batas aktif, penjadwal tetap dapat memulainya saat pool kosong lalu membiarkannya berjalan sendiri sampai kapasitas tersedia lagi. Default-nya adalah 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; sesuaikan `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` hanya ketika host Docker memiliki ruang sumber daya lebih besar. Runner menjalankan pemeriksaan awal Docker secara default, menghapus container OpenClaw E2E usang, mencetak status setiap 30 detik, menyimpan waktu jalur yang berhasil di `.artifacts/docker-tests/lane-timings.json`, dan menggunakan waktu tersebut untuk memulai jalur yang lebih lama terlebih dahulu pada eksekusi berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifes jalur berbobot tanpa membangun atau menjalankan Docker, atau `node scripts/test-docker-all.mjs --plan-json` untuk mencetak rencana CI bagi jalur yang dipilih, kebutuhan paket/image, dan kredensial.
- `Penerimaan Paket` adalah gate paket native GitHub untuk "apakah tarball yang dapat diinstal ini berfungsi sebagai produk?" Ini menyelesaikan satu paket kandidat dari `source=npm`, `source=ref`, `source=url`, atau `source=artifact`, mengunggahnya sebagai `package-under-test`, lalu menjalankan jalur Docker E2E yang dapat digunakan ulang terhadap tarball persis tersebut alih-alih mengemas ulang ref yang dipilih. Profil diurutkan berdasarkan cakupan: `smoke`, `package`, `product`, dan `full`. Lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins) untuk kontrak paket/pembaruan/Plugin, matriks survivor peningkatan terpublikasi, default rilis, dan triase kegagalan.
- Pemeriksaan build dan rilis menjalankan `scripts/check-cli-bootstrap-imports.mjs` setelah tsdown. Guard menelusuri grafik build statis dari `dist/entry.js` dan `dist/cli/run-main.js` dan gagal jika startup pra-dispatch mengimpor dependensi paket seperti Commander, prompt UI, undici, atau logging sebelum dispatch perintah; ini juga menjaga chunk eksekusi Gateway terbundel tetap dalam batas anggaran dan menolak impor statis dari path Gateway dingin yang diketahui. Smoke CLI terpaket juga mencakup bantuan root, bantuan onboard, bantuan doctor, status, skema konfigurasi, dan perintah daftar model.
- Kompatibilitas legacy Penerimaan Paket dibatasi hingga `2026.4.25` (termasuk `2026.4.25-beta.*`). Hingga batas tersebut, harness hanya menoleransi celah metadata paket yang sudah dikirim: entri inventaris QA privat yang dihilangkan, `gateway install --wrapper` yang hilang, berkas patch yang hilang dalam fixture git turunan tarball, `update.channel` persisten yang hilang, lokasi catatan instalasi Plugin legacy, persistensi catatan instalasi marketplace yang hilang, dan migrasi metadata konfigurasi selama `plugins update`. Untuk paket setelah `2026.4.25`, path tersebut menjadi kegagalan ketat.
- Runner smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, dan `test:docker:config-reload` mem-boot satu atau beberapa container nyata dan memverifikasi path integrasi tingkat lebih tinggi.

Runner Docker model langsung juga melakukan bind-mount hanya pada home auth CLI yang dibutuhkan (atau semua yang didukung ketika eksekusi tidak dipersempit), lalu menyalinnya ke home container sebelum eksekusi sehingga OAuth CLI eksternal dapat me-refresh token tanpa mengubah store auth host:

- Model langsung: `pnpm test:docker:live-models` (skrip: `scripts/test-live-models-docker.sh`)
- Smoke bind ACP: `pnpm test:docker:live-acp-bind` (skrip: `scripts/test-live-acp-bind-docker.sh`; mencakup Claude, Codex, dan Gemini secara default, dengan cakupan Droid/OpenCode yang ketat melalui `pnpm test:docker:live-acp-bind:droid` dan `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (skrip: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness server aplikasi Codex: `pnpm test:docker:live-codex-harness` (skrip: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agen dev: `pnpm test:docker:live-gateway` (skrip: `scripts/test-live-gateway-models-docker.sh`)
- Smoke observabilitas: `pnpm qa:otel:smoke` adalah lane QA source-checkout privat. Ini sengaja tidak menjadi bagian dari lane rilis Docker paket karena tarball npm menghilangkan QA Lab.
- Smoke langsung Open WebUI: `pnpm test:docker:openwebui` (skrip: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, scaffolding penuh): `pnpm test:docker:onboard` (skrip: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agen tarball npm: `pnpm test:docker:npm-onboard-channel-agent` menginstal tarball OpenClaw yang sudah dipaketkan secara global di Docker, mengonfigurasi OpenAI melalui onboarding env-ref plus Telegram secara default, menjalankan doctor, dan menjalankan satu giliran agen OpenAI tiruan. Gunakan kembali tarball yang sudah dibuat dengan `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati build ulang host dengan `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, atau ganti channel dengan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` atau `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Smoke instalasi Skill: `pnpm test:docker:skill-install` menginstal tarball OpenClaw yang sudah dipaketkan secara global di Docker, menonaktifkan instalasi arsip yang diunggah dalam konfigurasi, menyelesaikan slug skill ClawHub langsung saat ini dari pencarian, menginstalnya dengan `openclaw skills install`, dan memverifikasi skill yang terinstal plus metadata asal/lock `.clawhub`.
- Smoke pergantian channel pembaruan: `pnpm test:docker:update-channel-switch` menginstal tarball OpenClaw yang sudah dipaketkan secara global di Docker, beralih dari paket `stable` ke git `dev`, memverifikasi channel yang dipersistenkan dan kerja Plugin pascapembaruan, lalu beralih kembali ke paket `stable` dan memeriksa status pembaruan.
- Smoke penyintas peningkatan: `pnpm test:docker:upgrade-survivor` menginstal tarball OpenClaw yang sudah dipaketkan di atas fixture pengguna lama yang kotor dengan agen, konfigurasi channel, allowlist Plugin, status dependensi Plugin usang, serta file workspace/sesi yang sudah ada. Ini menjalankan pembaruan paket plus doctor non-interaktif tanpa kunci penyedia langsung atau channel, lalu memulai Gateway loopback dan memeriksa pelestarian konfigurasi/status plus anggaran startup/status.
- Smoke penyintas peningkatan terpublikasi: `pnpm test:docker:published-upgrade-survivor` menginstal `openclaw@latest` secara default, menanam file pengguna lama yang realistis, mengonfigurasi baseline itu dengan resep perintah bawaan, memvalidasi konfigurasi yang dihasilkan, memperbarui instalasi terpublikasi itu ke tarball kandidat, menjalankan doctor non-interaktif, menulis `.artifacts/upgrade-survivor/summary.json`, lalu memulai Gateway loopback dan memeriksa intent terkonfigurasi, pelestarian status, startup, `/healthz`, `/readyz`, serta anggaran status RPC. Timpa satu baseline dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, minta scheduler agregat memperluas baseline lokal persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` seperti `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, dan perluas fixture berbentuk isu dengan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` seperti `reported-issues`; set reported-issues mencakup `configured-plugin-installs` untuk perbaikan otomatis instalasi Plugin OpenClaw eksternal. Package Acceptance mengeksposnya sebagai `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, dan `published_upgrade_survivor_scenarios`, menyelesaikan token baseline meta seperti `last-stable-4` atau `all-since-2026.4.23`, dan Full Release Validation memperluas gate paket release-soak menjadi `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Smoke konteks runtime sesi: `pnpm test:docker:session-runtime-context` memverifikasi persistensi transkrip konteks runtime tersembunyi plus perbaikan doctor pada cabang prompt-rewrite terduplikasi yang terdampak.
- Smoke instalasi global Bun: `bash scripts/e2e/bun-global-install-smoke.sh` memaketkan pohon saat ini, menginstalnya dengan `bun install -g` di home terisolasi, dan memverifikasi `openclaw infer image providers --json` mengembalikan penyedia gambar bawaan alih-alih macet. Gunakan kembali tarball yang sudah dibuat dengan `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati build host dengan `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, atau salin `dist/` dari image Docker yang sudah dibangun dengan `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker installer: `bash scripts/test-install-sh-docker.sh` membagikan satu cache npm di seluruh container root, update, dan direct-npm miliknya. Smoke pembaruan secara default menggunakan npm `latest` sebagai baseline stabil sebelum meningkatkan ke tarball kandidat. Timpa dengan `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` secara lokal, atau dengan input `update_baseline_version` milik workflow Install Smoke di GitHub. Pemeriksaan installer non-root mempertahankan cache npm terisolasi agar entri cache milik root tidak menutupi perilaku instalasi lokal pengguna. Atur `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` untuk menggunakan kembali cache root/update/direct-npm di seluruh rerun lokal.
- CI Install Smoke melewati pembaruan global direct-npm duplikat dengan `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; jalankan skrip secara lokal tanpa env itu ketika cakupan langsung `npm install -g` diperlukan.
- Smoke CLI hapus workspace bersama agen: `pnpm test:docker:agents-delete-shared-workspace` (skrip: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) membangun image Dockerfile root secara default, menanam dua agen dengan satu workspace di home container terisolasi, menjalankan `agents delete --json`, dan memverifikasi JSON valid plus perilaku workspace yang dipertahankan. Gunakan kembali image install-smoke dengan `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Jaringan Gateway (dua container, auth WS + health): `pnpm test:docker:gateway-network` (skrip: `scripts/e2e/gateway-network-docker.sh`)
- Smoke snapshot CDP browser: `pnpm test:docker:browser-cdp-snapshot` (skrip: `scripts/e2e/browser-cdp-snapshot-docker.sh`) membangun image E2E source plus lapisan Chromium, memulai Chromium dengan CDP mentah, menjalankan `browser doctor --deep`, dan memverifikasi snapshot peran CDP mencakup URL tautan, clickable yang dipromosikan kursor, ref iframe, dan metadata frame.
- Regresi reasoning minimal OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrip: `scripts/e2e/openai-web-search-minimal-docker.sh`) menjalankan server OpenAI tiruan melalui Gateway, memverifikasi `web_search` menaikkan `reasoning.effort` dari `minimal` ke `low`, lalu memaksa penolakan skema penyedia dan memeriksa detail mentah muncul di log Gateway.
- Bridge channel MCP (Gateway yang disemai + bridge stdio + smoke notification-frame Claude mentah): `pnpm test:docker:mcp-channels` (skrip: `scripts/e2e/mcp-channels-docker.sh`)
- Alat MCP bundel Pi (server MCP stdio nyata + smoke allow/deny profil Pi tertanam): `pnpm test:docker:pi-bundle-mcp-tools` (skrip: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pembersihan MCP Cron/subagen (Gateway nyata + teardown child MCP stdio setelah cron terisolasi dan run subagen one-shot): `pnpm test:docker:cron-mcp-cleanup` (skrip: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke install/update untuk path lokal, `file:`, registry npm dengan dependensi hoisted, ref git bergerak, kitchen-sink ClawHub, pembaruan marketplace, dan enable/inspect Claude-bundle): `pnpm test:docker:plugins` (skrip: `scripts/e2e/plugins-docker.sh`)
  Atur `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` untuk melewati blok ClawHub, atau timpa pasangan paket/runtime kitchen-sink default dengan `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` dan `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Tanpa `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, pengujian menggunakan server fixture ClawHub lokal hermetik.
- Smoke pembaruan Plugin tanpa perubahan: `pnpm test:docker:plugin-update` (skrip: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke matriks siklus hidup Plugin: `pnpm test:docker:plugin-lifecycle-matrix` menginstal tarball OpenClaw yang sudah dipaketkan dalam container kosong, menginstal Plugin npm, mengaktifkan/menonaktifkan, meningkatkan dan menurunkannya melalui registry npm lokal, menghapus kode yang terinstal, lalu memverifikasi uninstall tetap menghapus status usang sambil mencatat metrik RSS/CPU untuk setiap fase siklus hidup.
- Smoke metadata reload konfigurasi: `pnpm test:docker:config-reload` (skrip: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` mencakup smoke install/update untuk path lokal, `file:`, registry npm dengan dependensi hoisted, ref git bergerak, fixture ClawHub, pembaruan marketplace, dan enable/inspect Claude-bundle. `pnpm test:docker:plugin-update` mencakup perilaku pembaruan tanpa perubahan untuk Plugin yang terinstal. `pnpm test:docker:plugin-lifecycle-matrix` mencakup instalasi, enable, disable, upgrade, downgrade, dan uninstall saat kode hilang untuk Plugin npm yang dilacak sumber dayanya.

Untuk melakukan prebuild dan menggunakan kembali image fungsional bersama secara manual:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Timpa image khusus suite seperti `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` tetap menang ketika diatur. Ketika `OPENCLAW_SKIP_DOCKER_BUILD=1` menunjuk ke image bersama jarak jauh, skrip akan menariknya jika belum ada secara lokal. Pengujian QR dan Docker installer mempertahankan Dockerfile masing-masing karena keduanya memvalidasi perilaku paket/instalasi, bukan runtime aplikasi terbangun bersama.

Runner Docker model langsung juga mengikat-mount checkout saat ini sebagai hanya-baca dan
men-stage-nya ke workdir sementara di dalam container. Ini menjaga image runtime
tetap ramping sambil tetap menjalankan Vitest terhadap sumber/konfigurasi lokal Anda yang persis.
Langkah staging melewati cache lokal-saja yang besar dan output build aplikasi seperti
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, serta direktori output `.build` lokal aplikasi atau
Gradle, sehingga run langsung Docker tidak menghabiskan menit-menit untuk menyalin
artefak khusus mesin.
Runner tersebut juga menetapkan `OPENCLAW_SKIP_CHANNELS=1` sehingga probe langsung gateway tidak memulai
worker channel Telegram/Discord/dll. sungguhan di dalam container.
`test:docker:live-models` tetap menjalankan `pnpm test:live`, jadi teruskan juga
`OPENCLAW_LIVE_GATEWAY_*` saat Anda perlu mempersempit atau mengecualikan cakupan langsung gateway
dari lane Docker tersebut.
`test:docker:openwebui` adalah smoke kompatibilitas tingkat lebih tinggi: ini memulai
container gateway OpenClaw dengan endpoint HTTP yang kompatibel dengan OpenAI diaktifkan,
memulai container Open WebUI yang dipin terhadap gateway tersebut, masuk melalui
Open WebUI, memverifikasi `/api/models` mengekspos `openclaw/default`, lalu mengirim
permintaan chat sungguhan melalui proxy `/api/chat/completions` milik Open WebUI.
Tetapkan `OPENWEBUI_SMOKE_MODE=models` untuk pemeriksaan CI jalur rilis yang harus berhenti
setelah masuk Open WebUI dan penemuan model, tanpa menunggu penyelesaian model langsung.
Run pertama bisa terasa lebih lambat karena Docker mungkin perlu menarik image
Open WebUI dan Open WebUI mungkin perlu menyelesaikan setup cold-start miliknya sendiri.
Lane ini mengharapkan kunci model langsung yang dapat digunakan, dan `OPENCLAW_PROFILE_FILE`
(`~/.profile` secara default) adalah cara utama untuk menyediakannya dalam run terdokerisasi.
Run yang berhasil mencetak payload JSON kecil seperti `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` sengaja deterministik dan tidak memerlukan akun
Telegram, Discord, atau iMessage sungguhan. Ini mem-boot container Gateway yang sudah di-seed,
memulai container kedua yang men-spawn `openclaw mcp serve`, lalu
memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran,
perilaku antrean peristiwa langsung, perutean pengiriman keluar, dan notifikasi channel +
izin bergaya Claude melalui bridge MCP stdio sungguhan. Pemeriksaan notifikasi
menginspeksi frame MCP stdio mentah secara langsung sehingga smoke memvalidasi apa yang
benar-benar dipancarkan bridge, bukan hanya apa yang kebetulan diekspos SDK klien tertentu.
`test:docker:pi-bundle-mcp-tools` bersifat deterministik dan tidak memerlukan kunci model langsung.
Ini membangun image Docker repo, memulai server probe MCP stdio sungguhan
di dalam container, mewujudkan server tersebut melalui runtime MCP bundle Pi yang tertanam,
mengeksekusi tool, lalu memverifikasi `coding` dan `messaging` mempertahankan
tool `bundle-mcp` sementara `minimal` dan `tools.deny: ["bundle-mcp"]` memfilternya.
`test:docker:cron-mcp-cleanup` bersifat deterministik dan tidak memerlukan kunci model langsung.
Ini memulai Gateway yang sudah di-seed dengan server probe MCP stdio sungguhan, menjalankan
giliran cron terisolasi dan giliran anak sekali jalan `/subagents spawn`, lalu memverifikasi
proses anak MCP keluar setelah setiap run.

Smoke thread ACP bahasa biasa manual (bukan CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Pertahankan skrip ini untuk alur kerja regresi/debug. Skrip ini mungkin diperlukan lagi untuk validasi perutean thread ACP, jadi jangan hapus.

Env var berguna:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) di-mount ke `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) di-mount ke `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (default: `~/.profile`) di-mount ke `/home/node/.profile` dan di-source sebelum menjalankan pengujian
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` untuk memverifikasi hanya env var yang di-source dari `OPENCLAW_PROFILE_FILE`, menggunakan direktori konfigurasi/workspace sementara dan tanpa mount auth CLI eksternal
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) di-mount ke `/home/node/.npm-global` untuk instalasi CLI yang di-cache di dalam Docker
- Direktori/file auth CLI eksternal di bawah `$HOME` di-mount hanya-baca di bawah `/host-auth...`, lalu disalin ke `/home/node/...` sebelum pengujian dimulai
  - Direktori default: `.minimax`
  - File default: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Run provider yang dipersempit hanya me-mount direktori/file yang diperlukan yang disimpulkan dari `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Timpa secara manual dengan `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, atau daftar koma seperti `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` untuk mempersempit run
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` untuk memfilter provider di dalam container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` untuk menggunakan ulang image `openclaw:local-live` yang sudah ada untuk run ulang yang tidak memerlukan rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memastikan kredensial berasal dari penyimpanan profil (bukan env)
- `OPENCLAW_OPENWEBUI_MODEL=...` untuk memilih model yang diekspos oleh gateway untuk smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` untuk menimpa prompt pemeriksaan nonce yang digunakan oleh smoke Open WebUI
- `OPENWEBUI_IMAGE=...` untuk menimpa tag image Open WebUI yang dipin

## Sanity docs

Jalankan pemeriksaan docs setelah pengeditan docs: `pnpm check:docs`.
Jalankan validasi anchor Mintlify penuh saat Anda juga membutuhkan pemeriksaan heading dalam halaman: `pnpm docs:check-links:anchors`.

## Regresi offline (aman-CI)

Ini adalah regresi "pipeline nyata" tanpa provider sungguhan:

- Pemanggilan tool Gateway (OpenAI mock, gateway nyata + loop agen): `src/gateway/gateway.test.ts` (kasus: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, menulis konfigurasi + auth diberlakukan): `src/gateway/gateway.test.ts` (kasus: "runs wizard over ws and writes auth token config")

## Eval keandalan agen (skills)

Kita sudah memiliki beberapa pengujian aman-CI yang berperilaku seperti "eval keandalan agen":

- Pemanggilan tool mock melalui gateway nyata + loop agen (`src/gateway/gateway.test.ts`).
- Alur wizard end-to-end yang memvalidasi wiring sesi dan efek konfigurasi (`src/gateway/gateway.test.ts`).

Yang masih kurang untuk Skills (lihat [Skills](/id/tools/skills)):

- **Pengambilan keputusan:** saat Skills tercantum dalam prompt, apakah agen memilih skill yang tepat (atau menghindari yang tidak relevan)?
- **Kepatuhan:** apakah agen membaca `SKILL.md` sebelum digunakan dan mengikuti langkah/argumen yang diwajibkan?
- **Kontrak alur kerja:** skenario multi-giliran yang menegaskan urutan tool, penerusan riwayat sesi, dan batas sandbox.

Eval mendatang sebaiknya tetap deterministik terlebih dahulu:

- Runner skenario yang menggunakan provider mock untuk menegaskan panggilan tool + urutan, pembacaan file skill, dan wiring sesi.
- Suite kecil skenario yang berfokus pada skill (gunakan vs hindari, gating, injeksi prompt).
- Eval langsung opsional (opt-in, dipagari env) hanya setelah suite aman-CI tersedia.

## Pengujian kontrak (bentuk Plugin dan channel)

Pengujian kontrak memverifikasi bahwa setiap Plugin dan channel yang terdaftar sesuai dengan
kontrak antarmukanya. Pengujian ini mengiterasi semua Plugin yang ditemukan dan menjalankan suite
asersi bentuk dan perilaku. Lane unit default `pnpm test` sengaja
melewati file seam bersama dan smoke ini; jalankan perintah kontrak secara eksplisit
saat Anda menyentuh permukaan channel atau provider bersama.

### Perintah

- Semua kontrak: `pnpm test:contracts`
- Hanya kontrak channel: `pnpm test:contracts:channels`
- Hanya kontrak provider: `pnpm test:contracts:plugins`

### Kontrak channel

Berada di `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Bentuk Plugin dasar (id, nama, kapabilitas)
- **setup** - Kontrak wizard setup
- **session-binding** - Perilaku pengikatan sesi
- **outbound-payload** - Struktur payload pesan
- **inbound** - Penanganan pesan masuk
- **actions** - Handler aksi channel
- **threading** - Penanganan ID thread
- **directory** - API direktori/roster
- **group-policy** - Penerapan kebijakan grup

### Kontrak status provider

Berada di `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe status channel
- **registry** - Bentuk registri Plugin

### Kontrak provider

Berada di `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrak alur auth
- **auth-choice** - Pilihan/seleksi auth
- **catalog** - API katalog model
- **discovery** - Penemuan Plugin
- **loader** - Pemuatan Plugin
- **runtime** - Runtime provider
- **shape** - Bentuk/antarmuka Plugin
- **wizard** - Wizard setup

### Kapan menjalankan

- Setelah mengubah ekspor atau subpath plugin-sdk
- Setelah menambahkan atau memodifikasi channel atau Plugin provider
- Setelah merefaktor pendaftaran atau penemuan Plugin

Pengujian kontrak berjalan di CI dan tidak memerlukan kunci API sungguhan.

## Menambahkan regresi (panduan)

Saat Anda memperbaiki masalah provider/model yang ditemukan secara langsung:

- Tambahkan regresi aman-CI jika memungkinkan (provider mock/stub, atau tangkap transformasi bentuk permintaan yang persis)
- Jika secara inheren hanya langsung (rate limit, kebijakan auth), pertahankan pengujian langsung tetap sempit dan opt-in melalui env var
- Lebih pilih menargetkan lapisan terkecil yang menangkap bug:
  - bug konversi/replay permintaan provider → pengujian model langsung
  - bug pipeline sesi/riwayat/tool gateway → smoke langsung gateway atau pengujian mock gateway aman-CI
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` menurunkan satu target sampel per kelas SecretRef dari metadata registri (`listSecretTargetRegistryEntries()`), lalu menegaskan exec id segmen traversal ditolak.
  - Jika Anda menambahkan keluarga target SecretRef `includeInPlan` baru di `src/secrets/target-registry-data.ts`, perbarui `classifyTargetClass` dalam pengujian tersebut. Pengujian sengaja gagal pada id target yang tidak terklasifikasi sehingga kelas baru tidak dapat dilewati diam-diam.

## Terkait

- [Pengujian langsung](/id/help/testing-live)
- [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins)
- [CI](/id/ci)
