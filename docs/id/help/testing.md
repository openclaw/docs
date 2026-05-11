---
read_when:
    - Menjalankan pengujian secara lokal atau di CI
    - Menambahkan uji regresi untuk bug model/penyedia
    - Pemecahan masalah perilaku Gateway + agen
summary: 'Kit pengujian: suite unit/e2e/live, runner Docker, dan cakupan masing-masing pengujian'
title: Pengujian
x-i18n:
    generated_at: "2026-05-11T20:31:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfc73e8b86188dbc58a92f36a90b9fb4d59ac4cce2c60e0bd81aca662a524561
    source_path: help/testing.md
    workflow: 16
---

OpenClaw memiliki tiga suite Vitest (unit/integrasi, e2e, langsung) dan sejumlah kecil
runner Docker. Dokumen ini adalah panduan "cara kami menguji":

- Apa yang dicakup setiap suite (dan apa yang sengaja _tidak_ dicakup).
- Perintah mana yang dijalankan untuk alur kerja umum (lokal, sebelum push, debugging).
- Bagaimana pengujian langsung menemukan kredensial dan memilih model/penyedia.
- Cara menambahkan regresi untuk masalah model/penyedia dunia nyata.

<Note>
**Stack QA (qa-lab, qa-channel, jalur transport langsung)** didokumentasikan secara terpisah:

- [Ikhtisar QA](/id/concepts/qa-e2e-automation) - arsitektur, permukaan perintah, penulisan skenario.
- [QA Matrix](/id/concepts/qa-matrix) - referensi untuk `pnpm openclaw qa matrix`.
- [Kanal QA](/id/channels/qa-channel) - Plugin transport sintetis yang digunakan oleh skenario berbasis repo.

Halaman ini mencakup menjalankan suite pengujian reguler dan runner Docker/Parallels. Bagian runner khusus QA di bawah ([runner khusus QA](#qa-specific-runners)) mencantumkan invokasi `qa` konkret dan mengarahkan kembali ke referensi di atas.
</Note>

## Mulai cepat

Hampir setiap hari:

- Gate penuh (diharapkan sebelum push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Jalankan suite penuh lokal yang lebih cepat di mesin yang lapang: `pnpm test:max`
- Loop watch Vitest langsung: `pnpm test:watch`
- Penargetan file langsung sekarang juga merutekan path ekstensi/kanal: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Dahulukan menjalankan target spesifik saat Anda mengiterasi satu kegagalan.
- Situs QA berbasis Docker: `pnpm qa:lab:up`
- Jalur QA berbasis VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Saat Anda menyentuh pengujian atau menginginkan keyakinan ekstra:

- Gate cakupan: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Saat men-debug penyedia/model nyata (membutuhkan kredensial nyata):

- Suite langsung (model + probe alat/gambar Gateway): `pnpm test:live`
- Targetkan satu file langsung secara senyap: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Laporan performa runtime: dispatch `OpenClaw Performance` dengan
  `live_gpt54=true` untuk giliran agen `openai/gpt-5.4` nyata atau
  `deep_profile=true` untuk artefak CPU/heap/trace Kova. Jalankan terjadwal harian
  menerbitkan artefak jalur penyedia tiruan, profil mendalam, dan GPT 5.4 ke
  `openclaw/clawgrit-reports` saat `CLAWGRIT_REPORTS_TOKEN` dikonfigurasi. Laporan
  penyedia tiruan juga menyertakan angka boot Gateway tingkat sumber, memori,
  tekanan Plugin, loop hello model palsu berulang, dan startup CLI.
- Sweep model langsung Docker: `pnpm test:docker:live-models`
  - Setiap model yang dipilih sekarang menjalankan satu giliran teks ditambah probe kecil bergaya baca file.
    Model yang metadatanya mengiklankan input `image` juga menjalankan giliran gambar kecil.
    Nonaktifkan probe tambahan dengan `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` atau
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` saat mengisolasi kegagalan penyedia.
  - Cakupan CI: `OpenClaw Scheduled Live And E2E Checks` harian dan manual
    `OpenClaw Release Checks` sama-sama memanggil alur kerja langsung/E2E yang dapat digunakan ulang dengan
    `include_live_suites: true`, yang menyertakan job matriks model langsung Docker terpisah
    yang di-shard menurut penyedia.
  - Untuk menjalankan ulang CI terfokus, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    dengan `include_live_suites: true` dan `live_models_only: true`.
  - Tambahkan rahasia penyedia sinyal tinggi baru ke `scripts/ci-hydrate-live-auth.sh`
    ditambah `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dan pemanggil
    terjadwal/rilisnya.
- Smoke bound-chat native Codex: `pnpm test:docker:live-codex-bind`
  - Menjalankan jalur langsung Docker terhadap path app-server Codex, mengikat DM Slack sintetis
    dengan `/codex bind`, menguji `/codex fast` dan
    `/codex permissions`, lalu memverifikasi balasan biasa dan lampiran gambar
    dirutekan melalui binding Plugin native alih-alih ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Menjalankan giliran agen Gateway melalui harness app-server Codex milik Plugin,
    memverifikasi `/codex status` dan `/codex models`, dan secara default menguji probe gambar,
    MCP cron, sub-agen, dan Guardian. Nonaktifkan probe sub-agen dengan
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` saat mengisolasi kegagalan app-server
    Codex lainnya. Untuk pemeriksaan sub-agen terfokus, nonaktifkan probe lain:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Ini keluar setelah probe sub-agen kecuali
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` ditetapkan.
- Smoke instalasi sesuai permintaan Codex: `pnpm test:docker:codex-on-demand`
  - Menginstal tarball OpenClaw yang dipaketkan di Docker, menjalankan onboarding kunci API OpenAI,
    dan memverifikasi Plugin Codex plus dependensi `@openai/codex`
    diunduh ke root npm terkelola sesuai permintaan.
- Smoke dependensi alat Plugin langsung: `pnpm test:docker:live-plugin-tool`
  - Mengepak Plugin fixture dengan dependensi `slugify` nyata, menginstalnya melalui
    `npm-pack:`, memverifikasi dependensi di bawah root npm terkelola, lalu meminta
    model OpenAI langsung untuk memanggil alat Plugin dan mengembalikan slug tersembunyi.
- Smoke perintah penyelamatan Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Pemeriksaan opsional berlapis untuk permukaan perintah penyelamatan kanal pesan.
    Ini menguji `/crestodian status`, mengantrekan perubahan model persisten,
    membalas `/crestodian yes`, dan memverifikasi path penulisan audit/konfigurasi.
- Smoke Docker perencana Crestodian: `pnpm test:docker:crestodian-planner`
  - Menjalankan Crestodian dalam kontainer tanpa konfigurasi dengan CLI Claude palsu di `PATH`
    dan memverifikasi fallback perencana fuzzy diterjemahkan menjadi penulisan konfigurasi bertipe
    yang diaudit.
- Smoke Docker first-run Crestodian: `pnpm test:docker:crestodian-first-run`
  - Memulai dari direktori status OpenClaw kosong, merutekan `openclaw` polos ke
    Crestodian, menerapkan penulisan setup/model/agen/Plugin Discord + SecretRef,
    memvalidasi konfigurasi, dan memverifikasi entri audit. Path setup Ring 0 yang sama
    juga dicakup di QA Lab oleh
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke biaya Moonshot/Kimi: dengan `MOONSHOT_API_KEY` ditetapkan, jalankan
  `openclaw models list --provider moonshot --json`, lalu jalankan
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  yang terisolasi terhadap `moonshot/kimi-k2.6`. Verifikasi JSON melaporkan Moonshot/K2.6 dan
  transkrip asisten menyimpan `usage.cost` yang dinormalisasi.

<Tip>
Saat Anda hanya membutuhkan satu kasus gagal, lebih baik mempersempit pengujian langsung melalui variabel env allowlist yang dijelaskan di bawah.
</Tip>

## Runner khusus QA

Perintah ini berada di samping suite pengujian utama saat Anda membutuhkan realisme QA-lab:

CI menjalankan QA Lab dalam alur kerja khusus. Paritas agentik bersarang di bawah
`QA-Lab - All Lanes` dan validasi rilis, bukan alur kerja PR mandiri.
Validasi luas harus menggunakan `Full Release Validation` dengan
`rerun_group=qa-parity` atau grup QA release-checks. Pemeriksaan rilis stabil/default
menyimpan soak langsung/Docker menyeluruh di balik `run_release_soak=true`; profil
`full` memaksa soak aktif. `QA-Lab - All Lanes`
berjalan setiap malam di `main` dan dari dispatch manual dengan jalur paritas tiruan, jalur Matrix
langsung, jalur Telegram langsung yang dikelola Convex, dan jalur Discord langsung yang dikelola Convex
sebagai job paralel. QA terjadwal dan pemeriksaan rilis meneruskan Matrix
`--profile fast` secara eksplisit, sementara input CLI Matrix dan alur kerja manual
tetap default `all`; dispatch manual dapat membagi `all` menjadi job `transport`,
`media`, `e2ee-smoke`, `e2ee-deep`, dan `e2ee-cli`. `OpenClaw Release
Checks` menjalankan paritas plus jalur Matrix cepat dan Telegram sebelum persetujuan
rilis, menggunakan `mock-openai/gpt-5.5` untuk pemeriksaan transport rilis agar tetap
deterministik dan menghindari startup Plugin penyedia normal. Gateway transport langsung ini
menonaktifkan pencarian memori; perilaku memori tetap dicakup oleh suite paritas QA.

Shard media langsung rilis penuh menggunakan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang sudah memiliki
`ffmpeg` dan `ffprobe`. Shard model/backend langsung Docker menggunakan image bersama
`ghcr.io/openclaw/openclaw-live-test:<sha>` yang dibangun sekali per commit yang dipilih,
lalu menariknya dengan `OPENCLAW_SKIP_DOCKER_BUILD=1` alih-alih membangun ulang
di dalam setiap shard.

- `pnpm openclaw qa suite`
  - Menjalankan skenario QA berbasis repo langsung di host.
  - Menjalankan beberapa skenario terpilih secara paralel secara default dengan
    pekerja gateway yang terisolasi. `qa-channel` default ke konkurensi 4 (dibatasi oleh
    jumlah skenario terpilih). Gunakan `--concurrency <count>` untuk menyesuaikan jumlah
    pekerja, atau `--concurrency 1` untuk jalur serial lama.
  - Keluar dengan non-nol ketika ada skenario yang gagal. Gunakan `--allow-failures` ketika Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Mendukung mode penyedia `live-frontier`, `mock-openai`, dan `aimock`.
    `aimock` memulai server penyedia lokal berbasis AIMock untuk cakupan
    fixture eksperimental dan mock protokol tanpa menggantikan jalur
    `mock-openai` yang sadar skenario.
- `pnpm test:plugins:kitchen-sink-live`
  - Menjalankan rangkaian uji Plugin Kitchen Sink OpenAI live melalui QA Lab. Ini
    memasang paket Kitchen Sink eksternal, memverifikasi inventaris permukaan SDK Plugin,
    memeriksa `/healthz` dan `/readyz`, merekam bukti CPU/RSS gateway,
    menjalankan satu giliran OpenAI live, dan memeriksa diagnostik adversarial.
    Memerlukan autentikasi OpenAI live seperti `OPENAI_API_KEY`. Dalam sesi Testbox
    yang sudah dihidrasi, ini otomatis mengambil profil autentikasi live Testbox ketika helper
    `openclaw-testbox-env` tersedia.
- `pnpm test:gateway:cpu-scenarios`
  - Menjalankan bench startup gateway plus paket skenario kecil QA Lab mock
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) dan menulis ringkasan observasi CPU gabungan
    di bawah `.artifacts/gateway-cpu-scenarios/`.
  - Hanya menandai observasi CPU panas yang berkelanjutan secara default (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), sehingga lonjakan startup singkat direkam sebagai metrik
    tanpa tampak seperti regresi gateway yang terpancang selama beberapa menit.
  - Menggunakan artefak `dist` yang sudah dibangun; jalankan build terlebih dahulu ketika checkout belum
    memiliki output runtime yang segar.
- `pnpm openclaw qa suite --runner multipass`
  - Menjalankan suite QA yang sama di dalam VM Linux Multipass sekali pakai.
  - Mempertahankan perilaku pemilihan skenario yang sama seperti `qa suite` di host.
  - Menggunakan ulang flag pemilihan penyedia/model yang sama seperti `qa suite`.
  - Run live meneruskan input autentikasi QA yang didukung dan praktis untuk guest:
    kunci penyedia berbasis env, path konfigurasi penyedia live QA, dan `CODEX_HOME`
    ketika ada.
  - Direktori output harus tetap berada di bawah root repo agar guest dapat menulis balik melalui
    workspace yang di-mount.
  - Menulis laporan + ringkasan QA normal plus log Multipass di bawah
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Memulai situs QA berbasis Docker untuk pekerjaan QA bergaya operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Membuat tarball npm dari checkout saat ini, memasangnya secara global di
    Docker, menjalankan onboarding kunci API OpenAI non-interaktif, mengonfigurasi Telegram
    secara default, memverifikasi runtime Plugin terpaket dimuat tanpa perbaikan dependensi
    startup, menjalankan doctor, dan menjalankan satu giliran agen lokal terhadap endpoint
    OpenAI yang di-mock.
  - Gunakan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` untuk menjalankan jalur instalasi paket yang sama
    dengan Discord.
- `pnpm test:docker:session-runtime-context`
  - Menjalankan smoke Docker aplikasi terbangun yang deterministik untuk transkrip konteks runtime
    tertanam. Ini memverifikasi konteks runtime OpenClaw tersembunyi dipersistensikan sebagai
    pesan kustom non-tampilan alih-alih bocor ke giliran pengguna yang terlihat,
    lalu menanam JSONL sesi rusak yang terdampak dan memverifikasi
    `openclaw doctor --fix` menulis ulangnya ke cabang aktif dengan cadangan.
- `pnpm test:docker:npm-telegram-live`
  - Memasang kandidat paket OpenClaw di Docker, menjalankan onboarding paket terpasang,
    mengonfigurasi Telegram melalui CLI terpasang, lalu menggunakan ulang jalur QA Telegram
    live dengan paket terpasang tersebut sebagai Gateway SUT.
  - Wrapper hanya me-mount sumber harness `qa-lab` dari checkout; paket terpasang
    memiliki `dist`, `openclaw/plugin-sdk`, dan runtime Plugin terbundel sehingga jalur tidak
    mencampur Plugin checkout saat ini ke dalam paket yang sedang diuji.
  - Default ke `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; setel
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` atau
    `OPENCLAW_CURRENT_PACKAGE_TGZ` untuk menguji tarball lokal yang sudah diresolusikan alih-alih
    memasang dari registry.
  - Menggunakan kredensial env Telegram atau sumber kredensial Convex yang sama seperti
    `pnpm openclaw qa telegram`. Untuk otomatisasi CI/rilis, setel
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` dan rahasia peran. Jika
    `OPENCLAW_QA_CONVEX_SITE_URL` dan rahasia peran Convex ada di CI,
    wrapper Docker memilih Convex secara otomatis.
  - Wrapper memvalidasi env kredensial Telegram atau Convex di host sebelum
    pekerjaan build/install Docker. Setel `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    hanya ketika sengaja men-debug penyiapan pra-kredensial.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` menimpa
    `OPENCLAW_QA_CREDENTIAL_ROLE` bersama hanya untuk jalur ini.
  - GitHub Actions mengekspos jalur ini sebagai workflow maintainer manual
    `NPM Telegram Beta E2E`. Ini tidak berjalan saat merge. Workflow menggunakan
    environment `qa-live-shared` dan lease kredensial CI Convex.
- GitHub Actions juga mengekspos `Package Acceptance` untuk bukti produk side-run
  terhadap satu kandidat paket. Ini menerima ref tepercaya, spec npm yang dipublikasikan,
  URL tarball HTTPS plus SHA-256, atau artefak tarball dari run lain, mengunggah
  `openclaw-current.tgz` yang dinormalisasi sebagai `package-under-test`, lalu menjalankan
  scheduler E2E Docker yang ada dengan profil jalur smoke, paket, produk, penuh, atau kustom.
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
  - Mengemas dan memasang build OpenClaw saat ini di Docker, memulai Gateway
    dengan OpenAI yang dikonfigurasi, lalu mengaktifkan channel/Plugin terbundel melalui edit
    konfigurasi.
  - Memverifikasi discovery penyiapan membiarkan Plugin unduhan yang belum dikonfigurasi tetap tidak ada,
    perbaikan doctor pertama yang dikonfigurasi memasang setiap Plugin unduhan yang hilang
    secara eksplisit, dan restart kedua tidak menjalankan perbaikan dependensi
    tersembunyi.
  - Juga memasang baseline npm lama yang diketahui, mengaktifkan Telegram sebelum menjalankan
    `openclaw update --tag <candidate>`, dan memverifikasi doctor pasca-update kandidat
    membersihkan sisa dependensi Plugin legacy tanpa perbaikan postinstall sisi
    harness.
- `pnpm test:parallels:npm-update`
  - Menjalankan smoke update instalasi paket native di seluruh guest Parallels. Setiap
    platform terpilih terlebih dahulu memasang paket baseline yang diminta, lalu menjalankan
    perintah `openclaw update` yang terpasang di guest yang sama dan memverifikasi
    versi terpasang, status update, kesiapan gateway, dan satu giliran agen lokal.
  - Gunakan `--platform macos`, `--platform windows`, atau `--platform linux` saat
    beriterasi pada satu guest. Gunakan `--json` untuk path artefak ringkasan dan
    status per jalur.
  - Jalur OpenAI menggunakan `openai/gpt-5.5` untuk bukti giliran agen live secara
    default. Lewatkan `--model <provider/model>` atau setel
    `OPENCLAW_PARALLELS_OPENAI_MODEL` ketika sengaja memvalidasi model
    OpenAI lain.
  - Bungkus run lokal panjang dalam timeout host agar kemacetan transport Parallels tidak dapat
    menghabiskan sisa jendela pengujian:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrip menulis log jalur bertingkat di bawah `/tmp/openclaw-parallels-npm-update.*`.
    Periksa `windows-update.log`, `macos-update.log`, atau `linux-update.log`
    sebelum menganggap wrapper luar macet.
  - Update Windows dapat menghabiskan 10 hingga 15 menit dalam pekerjaan doctor pasca-update dan
    update paket pada guest dingin; itu masih sehat ketika log debug npm bertingkat
    terus bergerak.
  - Jangan menjalankan wrapper agregat ini secara paralel dengan jalur smoke Parallels
    macOS, Windows, atau Linux individual. Mereka berbagi state VM dan dapat bertabrakan pada
    restore snapshot, penyajian paket, atau state gateway guest.
  - Bukti pasca-update menjalankan permukaan Plugin terbundel normal karena
    facade kapabilitas seperti ucapan, pembuatan gambar, dan pemahaman media
    dimuat melalui API runtime terbundel meskipun giliran agen itu sendiri hanya
    memeriksa respons teks sederhana.

- `pnpm openclaw qa aimock`
  - Hanya memulai server penyedia AIMock lokal untuk pengujian smoke protokol
    langsung.
- `pnpm openclaw qa matrix`
  - Menjalankan jalur QA live Matrix terhadap homeserver Tuwunel sekali pakai berbasis Docker. Hanya checkout sumber - instalasi paket tidak menyertakan `qa-lab`.
  - CLI penuh, katalog profil/skenario, env var, dan tata letak artefak: [QA Matrix](/id/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Menjalankan jalur QA live Telegram terhadap grup privat nyata menggunakan token bot driver dan SUT dari env.
  - Memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID grup harus berupa ID chat Telegram numerik.
  - Mendukung `--credential-source convex` untuk kredensial pooled bersama. Gunakan mode env secara default, atau setel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` untuk ikut menggunakan lease pooled.
  - Default mencakup canary, gating mention, addressing perintah, `/status`, balasan bot-ke-bot yang disebut, dan balasan perintah native inti. Default `mock-openai` juga mencakup regresi reply-chain deterministik dan streaming pesan akhir Telegram. Gunakan `--list-scenarios` untuk probe opsional seperti `session_status`.
  - Keluar dengan non-nol ketika ada skenario yang gagal. Gunakan `--allow-failures` ketika Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Memerlukan dua bot berbeda dalam grup privat yang sama, dengan bot SUT mengekspos nama pengguna Telegram.
  - Untuk observasi bot-ke-bot yang stabil, aktifkan Bot-to-Bot Communication Mode di `@BotFather` untuk kedua bot dan pastikan bot driver dapat mengamati trafik bot grup.
  - Menulis laporan QA Telegram, ringkasan, dan artefak pesan teramati di bawah `.artifacts/qa-e2e/...`. Skenario balasan menyertakan RTT dari permintaan kirim driver hingga balasan SUT teramati.

`Mantis Telegram Live` adalah wrapper bukti PR di sekitar jalur ini. Ini menjalankan
ref kandidat dengan kredensial Telegram yang di-lease Convex, merender transkrip
pesan teramati yang sudah diredaksi di browser desktop Crabbox, merekam bukti MP4,
membuat GIF yang dipangkas berdasarkan gerakan, mengunggah bundle artefak, dan memposting bukti PR
inline melalui GitHub App Mantis ketika `pr_number` disetel. Maintainer dapat
memulainya dari UI Actions melalui `Mantis Scenario` (`scenario_id:
telegram-live`) atau langsung dari komentar pull request:

```text
@Mantis telegram
@Mantis telegram scenario=telegram-status-command
@Mantis telegram scenarios=telegram-status-command,telegram-mentioned-message-reply
```

`Mantis Telegram Desktop Proof` adalah wrapper Telegram Desktop native agentic
sebelum/sesudah untuk bukti visual PR. Mulai dari UI Actions dengan
`instructions` bebas, melalui `Mantis Scenario` (`scenario_id:
telegram-desktop-proof`), atau dari komentar PR:

```text
@Mantis telegram desktop proof
```

Agen Mantis membaca PR, memutuskan perilaku yang terlihat di Telegram apa yang membuktikan
perubahan, menjalankan lane bukti Crabbox Telegram Desktop pengguna nyata pada ref baseline dan
kandidat, mengiterasi hingga GIF native berguna, menulis manifest
`motionPreview` berpasangan, dan memposting tabel GIF 2 kolom yang sama melalui
Mantis GitHub App ketika `pr_number` disetel.

- `pnpm openclaw qa mantis telegram-desktop-builder`
  - Menyewa atau menggunakan ulang desktop Linux Crabbox, menginstal Telegram Desktop native, mengonfigurasi OpenClaw dengan token bot SUT Telegram sewaan, memulai gateway, dan merekam bukti tangkapan layar/MP4 dari desktop VNC yang terlihat.
  - Secara default menggunakan `--credential-source convex` sehingga workflow hanya membutuhkan rahasia broker Convex. Gunakan `--credential-source env` dengan variabel `OPENCLAW_QA_TELEGRAM_*` yang sama seperti `pnpm openclaw qa telegram`.
  - Telegram Desktop tetap membutuhkan login/profil pengguna. Token bot hanya mengonfigurasi OpenClaw. Gunakan `--telegram-profile-archive-env <name>` untuk arsip profil `.tgz` base64, atau gunakan `--keep-lease` dan masuk secara manual melalui VNC sekali.
  - Menulis `mantis-telegram-desktop-builder-report.md`, `mantis-telegram-desktop-builder-summary.json`, `telegram-desktop-builder.png`, dan `telegram-desktop-builder.mp4` di bawah direktori output.

Lane transport live berbagi satu kontrak standar sehingga transport baru tidak menyimpang; matriks cakupan per-lane berada di [gambaran umum QA → Cakupan transport live](/id/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` adalah suite sintetis luas dan bukan bagian dari matriks tersebut.

### Kredensial Telegram bersama melalui Convex (v1)

Ketika `--credential-source convex` (atau `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) diaktifkan untuk
QA transport live, lab QA memperoleh sewa eksklusif dari pool berbasis Convex, mengirim Heartbeat untuk
sewa tersebut selama lane berjalan, dan melepaskan sewa saat shutdown. Nama bagian ini sudah ada sebelum
dukungan Discord, Slack, dan WhatsApp; kontrak sewa dibagikan lintas jenis.

Scaffold proyek Convex referensi:

- `qa/convex-credential-broker/`

Variabel env yang diperlukan:

- `OPENCLAW_QA_CONVEX_SITE_URL` (misalnya `https://your-deployment.convex.site`)
- Satu rahasia untuk peran yang dipilih:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` untuk `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` untuk `ci`
- Pemilihan peran kredensial:
  - CLI: `--credential-role maintainer|ci`
  - Default env: `OPENCLAW_QA_CREDENTIAL_ROLE` (default ke `ci` di CI, jika tidak `maintainer`)

Variabel env opsional:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (default `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (default `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (default `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (default `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (default `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id pelacakan opsional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` mengizinkan URL Convex loopback `http://` untuk pengembangan khusus lokal.

`OPENCLAW_QA_CONVEX_SITE_URL` sebaiknya menggunakan `https://` dalam operasi normal.

Perintah admin maintainer (tambah/hapus/daftar pool) secara khusus membutuhkan
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pembantu CLI untuk maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gunakan `doctor` sebelum eksekusi live untuk memeriksa URL situs Convex, rahasia broker,
prefiks endpoint, timeout HTTP, dan keterjangkauan admin/daftar tanpa mencetak
nilai rahasia. Gunakan `--json` untuk output yang dapat dibaca mesin di skrip dan utilitas
CI.

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
  - Pelindung sewa aktif: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (hanya rahasia maintainer)
  - Permintaan: `{ kind?, status?, includePayload?, limit? }`
  - Berhasil: `{ status: "ok", credentials, count }`

Bentuk payload untuk jenis Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` harus berupa string id chat Telegram numerik.
- `admin/add` memvalidasi bentuk ini untuk `kind: "telegram"` dan menolak payload yang cacat.

Bentuk payload untuk jenis pengguna nyata Telegram:

- `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`
- `groupId`, `testerUserId`, dan `telegramApiId` harus berupa string numerik.
- `tdlibArchiveSha256` dan `desktopTdataArchiveSha256` harus berupa string heksadesimal SHA-256.
- `kind: "telegram-user"` mewakili satu akun burner Telegram. Perlakukan sewa sebagai cakupan seluruh akun: driver CLI TDLib dan saksi visual Telegram Desktop dipulihkan dari payload yang sama, dan hanya satu job yang boleh memegang sewa pada satu waktu.

Pemulihan sewa pengguna nyata Telegram:

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

Gunakan profil Desktop yang dipulihkan dengan `Telegram -workdir "$tmp/desktop"` ketika rekaman visual diperlukan. Di lingkungan operator lokal, `scripts/e2e/telegram-user-credential.ts` membaca `~/.codex/skills/custom/telegram-e2e-bot-to-bot/convex.local.env` secara default jika variabel env proses tidak ada.

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
TDLib dan Telegram Desktop pada desktop Linux Crabbox, memulai Gateway SUT mock lokal
dari checkout saat ini, membuka chat Telegram yang terlihat, memulai
perekaman desktop, dan menulis `session.json` privat. Selama sesi
aktif, agen dapat terus menguji hingga puas:

- `send --session <file> --text <message>` mengirim melalui pengguna TDLib nyata dan menunggu balasan SUT.
- `run --session <file> -- <remote command>` menjalankan perintah arbitrer di Crabbox dan menyimpan outputnya, misalnya `bash -lc 'source /tmp/openclaw-telegram-user-crabbox/env.sh && python3 /tmp/openclaw-telegram-user-crabbox/user-driver.py transcript --limit 20 --json'`.
- `screenshot --session <file>` menangkap desktop yang sedang terlihat.
- `status --session <file>` mencetak perintah sewa dan WebVNC.
- `finish --session <file>` menghentikan perekam, menangkap artefak tangkapan layar/video/motion-trim, melepaskan kredensial Convex, menghentikan proses SUT lokal, dan menghentikan sewa Crabbox kecuali `--keep-box` diteruskan.
- `publish --session <file> --pr <number>` menerbitkan komentar PR khusus GIF secara default. Teruskan `--full-artifacts` hanya ketika log atau artefak JSON memang sengaja diperlukan.

Untuk repro visual deterministik, teruskan `--mock-response-file <path>` ke `start`
atau ke shorthand satu perintah `probe`. Runner default ke kelas
Crabbox standar, perekaman 24fps, pratinjau GIF motion 24fps, dan lebar GIF
1920px. Timpa dengan `--class`, `--record-fps`, `--preview-fps`, dan
`--preview-width` hanya ketika bukti membutuhkan pengaturan penangkapan berbeda.

Bukti Crabbox satu perintah:

```bash
pnpm qa:telegram-user:crabbox -- --text /status
```

Perintah default `probe` adalah shorthand untuk satu siklus start/send/finish. Gunakan
ini untuk smoke `/status` cepat. Gunakan perintah sesi untuk peninjauan PR,
pekerjaan reproduksi bug, atau kasus apa pun ketika agen membutuhkan beberapa menit eksperimen
arbitrer sebelum memutuskan bukti sudah lengkap. Gunakan `--id <cbx_...>` untuk
menggunakan ulang sewa desktop hangat, `--keep-box` untuk menjaga VNC tetap terbuka setelah finish,
`--desktop-chat-title <name>` untuk memilih chat yang terlihat, dan `--tdlib-url <tgz>`
ketika menggunakan arsip Linux `libtdjson.so` prebaked alih-alih membangun TDLib di
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

Arsitektur dan nama pembantu skenario untuk adapter channel baru berada di [gambaran umum QA → Menambahkan channel](/id/concepts/qa-e2e-automation#adding-a-channel). Standar minimum: implementasikan runner transport pada seam host `qa-lab` bersama, deklarasikan `qaRunners` di manifest Plugin, pasang sebagai `openclaw qa <runner>`, dan tulis skenario di bawah `qa/scenarios/`.

## Suite pengujian (apa yang berjalan di mana)

Anggap suite sebagai "realisme yang meningkat" (dan flakiness/biaya yang meningkat):

### Unit / integrasi (default)

- Perintah: `pnpm test`
- Konfigurasi: eksekusi tanpa target menggunakan set shard `vitest.full-*.config.ts` dan dapat memperluas shard multi-proyek menjadi konfigurasi per-proyek untuk penjadwalan paralel
- File: inventaris core/unit di bawah `src/**/*.test.ts`, `packages/**/*.test.ts`, dan `test/**/*.test.ts`; pengujian unit UI berjalan di shard khusus `unit-ui`
- Cakupan:
  - Pengujian unit murni
  - Pengujian integrasi dalam proses (autentikasi Gateway, routing, tooling, parsing, konfigurasi)
  - Regresi deterministik untuk bug yang diketahui
- Ekspektasi:
  - Berjalan di CI
  - Tidak memerlukan key nyata
  - Harus cepat dan stabil
  - Pengujian resolver dan loader permukaan publik harus membuktikan perilaku fallback `api.js` dan
    `runtime-api.js` yang luas dengan fixture Plugin kecil yang dihasilkan, bukan
    API sumber Plugin bundel nyata. Pemuatan API Plugin nyata termasuk dalam
    suite kontrak/integrasi milik Plugin.

Kebijakan dependensi native:

- Instalasi pengujian default melewati build opus native Discord opsional. Penerimaan suara Discord menggunakan decoder pure-JS `opusscript`, dan `@discordjs/opus` tetap dinonaktifkan di `allowBuilds` agar pengujian lokal dan lane Testbox tidak mengompilasi addon native.
- Gunakan lane performa suara Discord khusus atau live jika Anda memang perlu membandingkan build opus native. Jangan setel `@discordjs/opus` ke `true` di `allowBuilds` default; itu membuat loop instalasi/pengujian yang tidak terkait mengompilasi kode native.

<AccordionGroup>
  <Accordion title="Proyek, shard, dan lane berskop">

    - `pnpm test` tanpa target menjalankan dua belas konfigurasi shard yang lebih kecil (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) alih-alih satu proses root-project native raksasa. Ini mengurangi RSS puncak pada mesin yang sibuk dan mencegah pekerjaan auto-reply/extension menghambat suite yang tidak terkait.
    - `pnpm test --watch` tetap menggunakan grafik proyek root native `vitest.config.ts`, karena loop watch multi-shard tidak praktis.
    - `pnpm test`, `pnpm test:watch`, dan `pnpm test:perf:imports` merutekan target file/direktori eksplisit melalui lane berskop terlebih dahulu, sehingga `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` tidak membayar biaya startup proyek root penuh.
    - `pnpm test:changed` secara default memperluas path git yang berubah menjadi lane berskop murah: edit pengujian langsung, file sibling `*.test.ts`, pemetaan sumber eksplisit, dan dependen grafik impor lokal. Edit config/setup/package tidak menjalankan pengujian secara luas kecuali Anda secara eksplisit menggunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` adalah gate pemeriksaan lokal pintar normal untuk pekerjaan sempit. Ini mengklasifikasikan diff ke dalam core, pengujian core, extensions, pengujian extension, apps, docs, metadata rilis, tooling Docker live, dan tooling, lalu menjalankan typecheck, lint, dan perintah guard yang sesuai. Ini tidak menjalankan pengujian Vitest; panggil `pnpm test:changed` atau `pnpm test <target>` eksplisit untuk bukti pengujian. Kenaikan versi yang hanya menyentuh metadata rilis menjalankan pemeriksaan versi/config/dependensi-root tertarget, dengan guard yang menolak perubahan package di luar field versi tingkat atas.
    - Edit harness ACP Docker live menjalankan pemeriksaan terfokus: sintaks shell untuk skrip auth Docker live dan dry-run scheduler Docker live. Perubahan `package.json` hanya disertakan ketika diff terbatas pada `scripts["test:docker:live-*"]`; edit dependensi, export, versi, dan permukaan package lain tetap menggunakan guard yang lebih luas.
    - Pengujian unit ringan impor dari agents, commands, plugins, helper auto-reply, `plugin-sdk`, dan area utilitas murni serupa dirutekan melalui lane `unit-fast`, yang melewati `test/setup-openclaw-runtime.ts`; file stateful/runtime-heavy tetap berada di lane yang ada.
    - File sumber helper `plugin-sdk` dan `commands` tertentu juga memetakan jalankan changed-mode ke pengujian sibling eksplisit di lane ringan tersebut, sehingga edit helper tidak menjalankan ulang suite berat penuh untuk direktori itu.
    - `auto-reply` memiliki bucket khusus untuk helper core tingkat atas, pengujian integrasi `reply.*` tingkat atas, dan subtree `src/auto-reply/reply/**`. CI selanjutnya membagi subtree reply menjadi shard agent-runner, dispatch, dan commands/state-routing agar satu bucket yang berat impor tidak memegang seluruh ekor Node.
    - CI PR/main normal sengaja melewati sweep batch extension dan shard `agentic-plugins` khusus rilis. Full Release Validation memicu workflow anak `Plugin Prerelease` terpisah untuk suite berat plugin/extension tersebut pada kandidat rilis.

  </Accordion>

  <Accordion title="Cakupan runner tertanam">

    - Saat Anda mengubah input discovery message-tool atau konteks runtime
      compaction, pertahankan kedua tingkat cakupan.
    - Tambahkan regresi helper terfokus untuk batas routing dan normalisasi
      murni.
    - Jaga agar suite integrasi runner tertanam tetap sehat:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, dan
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Suite tersebut memverifikasi bahwa id berskop dan perilaku compaction
      tetap mengalir melalui path `run.ts` / `compact.ts` nyata; pengujian
      khusus helper bukan pengganti yang memadai untuk path integrasi tersebut.

  </Accordion>

  <Accordion title="Default pool dan isolasi Vitest">

    - Config dasar Vitest default ke `threads`.
    - Config Vitest bersama menetapkan `isolate: false` dan menggunakan runner
      non-terisolasi di seluruh proyek root, e2e, dan config live.
    - Lane UI root mempertahankan setup dan optimizer `jsdom`-nya, tetapi juga
      berjalan pada runner non-terisolasi bersama.
    - Setiap shard `pnpm test` mewarisi default `threads` + `isolate: false`
      yang sama dari config Vitest bersama.
    - `scripts/run-vitest.mjs` menambahkan `--no-maglev` untuk proses Node
      anak Vitest secara default untuk mengurangi churn kompilasi V8 selama
      proses lokal besar. Setel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` untuk
      membandingkan dengan perilaku V8 standar.

  </Accordion>

  <Accordion title="Iterasi lokal cepat">

    - `pnpm changed:lanes` menampilkan lane arsitektural mana yang dipicu oleh diff.
    - Hook pre-commit hanya untuk formatting. Hook ini melakukan restage file
      yang sudah diformat dan tidak menjalankan lint, typecheck, atau pengujian.
    - Jalankan `pnpm check:changed` secara eksplisit sebelum handoff atau push
      saat Anda membutuhkan gate pemeriksaan lokal pintar.
    - `pnpm test:changed` secara default merutekan melalui lane berskop murah.
      Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika
      agent memutuskan edit harness, config, package, atau contract benar-benar
      membutuhkan cakupan Vitest yang lebih luas.
    - `pnpm test:max` dan `pnpm test:changed:max` mempertahankan perilaku
      routing yang sama, hanya dengan batas worker yang lebih tinggi.
    - Auto-scaling worker lokal sengaja konservatif dan mundur ketika rata-rata
      beban host sudah tinggi, sehingga beberapa proses Vitest bersamaan secara
      default lebih sedikit menyebabkan dampak.
    - Config dasar Vitest menandai file proyek/config sebagai
      `forceRerunTriggers` sehingga rerun changed-mode tetap benar saat wiring
      pengujian berubah.
    - Config mempertahankan `OPENCLAW_VITEST_FS_MODULE_CACHE` aktif pada host
      yang didukung; setel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`
      jika Anda menginginkan satu lokasi cache eksplisit untuk profiling langsung.

  </Accordion>

  <Accordion title="Debugging performa">

    - `pnpm test:perf:imports` mengaktifkan pelaporan durasi impor Vitest plus
      output import-breakdown.
    - `pnpm test:perf:imports:changed` membatasi tampilan profiling yang sama
      ke file yang berubah sejak `origin/main`.
    - Data timing shard ditulis ke `.artifacts/vitest-shard-timings.json`.
      Jalankan whole-config menggunakan path config sebagai key; shard CI
      include-pattern menambahkan nama shard agar shard terfilter dapat dilacak
      secara terpisah.
    - Ketika satu pengujian panas masih menghabiskan sebagian besar waktunya
      pada impor startup, pertahankan dependensi berat di balik seam lokal
      sempit `*.runtime.ts` dan mock seam itu secara langsung alih-alih
      deep-import helper runtime hanya untuk meneruskannya melalui `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan
      `test:changed` yang dirutekan dengan path root-project native untuk diff
      yang sudah di-commit tersebut dan mencetak wall time plus RSS maks macOS.
    - `pnpm test:perf:changed:bench -- --worktree` membenchmark tree kotor saat
      ini dengan merutekan daftar file yang berubah melalui
      `scripts/test-projects.mjs` dan config Vitest root.
    - `pnpm test:perf:profile:main` menulis profil CPU main-thread untuk
      overhead startup dan transform Vitest/Vite.
    - `pnpm test:perf:profile:runner` menulis profil CPU+heap runner untuk
      suite unit dengan paralelisme file dinonaktifkan.

  </Accordion>
</AccordionGroup>

### Stabilitas (gateway)

- Perintah: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, dipaksa ke satu worker
- Cakupan:
  - Memulai Gateway loopback nyata dengan diagnostik aktif secara default
  - Menggerakkan churn pesan gateway sintetis, memori, dan payload besar melalui path event diagnostik
  - Mengueri `diagnostics.stability` melalui RPC WS Gateway
  - Mencakup helper persistensi bundle stabilitas diagnostik
  - Menegaskan bahwa recorder tetap terbatas, sampel RSS sintetis tetap di bawah anggaran tekanan, dan kedalaman antrean per sesi terkuras kembali ke nol
- Ekspektasi:
  - Aman untuk CI dan tanpa key
  - Lane sempit untuk tindak lanjut regresi stabilitas, bukan pengganti suite Gateway penuh

### E2E (smoke gateway)

- Perintah: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, dan pengujian E2E bundled-plugin di bawah `extensions/`
- Default runtime:
  - Menggunakan `threads` Vitest dengan `isolate: false`, sesuai dengan bagian repo lainnya.
  - Menggunakan worker adaptif (CI: hingga 2, lokal: 1 secara default).
  - Berjalan dalam mode silent secara default untuk mengurangi overhead I/O konsol.
- Override yang berguna:
  - `OPENCLAW_E2E_WORKERS=<n>` untuk memaksa jumlah worker (dibatasi pada 16).
  - `OPENCLAW_E2E_VERBOSE=1` untuk mengaktifkan kembali output konsol verbose.
- Cakupan:
  - Perilaku end-to-end gateway multi-instance
  - Permukaan WebSocket/HTTP, pairing node, dan networking yang lebih berat
- Ekspektasi:
  - Berjalan di CI (saat diaktifkan dalam pipeline)
  - Tidak memerlukan key nyata
  - Lebih banyak komponen bergerak daripada pengujian unit (bisa lebih lambat)

### E2E: smoke backend OpenShell

- Perintah: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Cakupan:
  - Memulai gateway OpenShell terisolasi pada host melalui Docker
  - Membuat sandbox dari Dockerfile lokal sementara
  - Menguji backend OpenShell OpenClaw melalui `sandbox ssh-config` nyata + SSH exec
  - Memverifikasi perilaku filesystem remote-canonical melalui bridge fs sandbox
- Ekspektasi:
  - Hanya opt-in; bukan bagian dari proses `pnpm test:e2e` default
  - Memerlukan CLI `openshell` lokal plus daemon Docker yang berfungsi
  - Menggunakan `HOME` / `XDG_CONFIG_HOME` terisolasi, lalu menghancurkan gateway dan sandbox pengujian
- Override yang berguna:
  - `OPENCLAW_E2E_OPENSHELL=1` untuk mengaktifkan pengujian saat menjalankan suite e2e yang lebih luas secara manual
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` untuk menunjuk ke binary CLI non-default atau skrip wrapper

### Live (provider nyata + model nyata)

- Perintah: `pnpm test:live`
- Konfigurasi: `vitest.live.config.ts`
- Berkas: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, dan pengujian live Plugin bawaan di bawah `extensions/`
- Default: **diaktifkan** oleh `pnpm test:live` (mengatur `OPENCLAW_LIVE_TEST=1`)
- Cakupan:
  - "Apakah penyedia/model ini benar-benar berfungsi _hari ini_ dengan kredensial nyata?"
  - Menangkap perubahan format penyedia, kekhasan pemanggilan tool, masalah autentikasi, dan perilaku batas laju
- Ekspektasi:
  - Secara desain tidak stabil untuk CI (jaringan nyata, kebijakan penyedia nyata, kuota, gangguan)
  - Membutuhkan biaya / menggunakan batas laju
  - Lebih baik menjalankan subset yang dipersempit daripada "semuanya"
- Proses live mengambil sumber dari `~/.profile` untuk mengambil kunci API yang hilang.
- Secara default, proses live tetap mengisolasi `HOME` dan menyalin materi konfigurasi/autentikasi ke home pengujian sementara sehingga fixture unit tidak dapat mengubah `~/.openclaw` asli Anda.
- Tetapkan `OPENCLAW_LIVE_USE_REAL_HOME=1` hanya saat Anda sengaja memerlukan pengujian live untuk menggunakan direktori home asli Anda.
- `pnpm test:live` kini secara default menggunakan mode yang lebih senyap: tetap mempertahankan keluaran progres `[live] ...`, tetapi menyembunyikan pemberitahuan ekstra `~/.profile` dan membisukan log bootstrap Gateway/obrolan Bonjour. Tetapkan `OPENCLAW_LIVE_TEST_QUIET=0` jika Anda ingin mengembalikan log startup lengkap.
- Rotasi kunci API (spesifik penyedia): tetapkan `*_API_KEYS` dengan format koma/titik koma atau `*_API_KEY_1`, `*_API_KEY_2` (misalnya `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) atau override per-live melalui `OPENCLAW_LIVE_*_KEY`; pengujian mencoba ulang pada respons batas laju.
- Keluaran progres/Heartbeat:
  - Suite live kini memancarkan baris progres ke stderr sehingga panggilan penyedia yang lama terlihat aktif meskipun penangkapan konsol Vitest senyap.
  - `vitest.live.config.ts` menonaktifkan intersepsi konsol Vitest sehingga baris progres penyedia/Gateway langsung mengalir selama proses live.
  - Sesuaikan Heartbeat model langsung dengan `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Sesuaikan Heartbeat Gateway/probe dengan `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Suite mana yang harus saya jalankan?

Gunakan tabel keputusan ini:

- Mengedit logika/pengujian: jalankan `pnpm test` (dan `pnpm test:coverage` jika Anda mengubah banyak hal)
- Menyentuh jaringan Gateway / protokol WS / pairing: tambahkan `pnpm test:e2e`
- Men-debug "bot saya mati" / kegagalan spesifik penyedia / pemanggilan tool: jalankan `pnpm test:live` yang dipersempit

## Pengujian live (menyentuh jaringan)

Untuk matriks model live, smoke backend CLI, smoke ACP, harness server aplikasi Codex, dan semua pengujian live penyedia media (Deepgram, BytePlus, ComfyUI, gambar, musik, video, harness media) - ditambah penanganan kredensial untuk proses live - lihat [Menguji suite live](/id/help/testing-live). Untuk pembaruan khusus dan checklist validasi Plugin, lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins).

## Runner Docker (pemeriksaan opsional "berfungsi di Linux")

Runner Docker ini dibagi menjadi dua bucket:

- Runner model live: `test:docker:live-models` dan `test:docker:live-gateway` hanya menjalankan berkas live profile-key yang cocok di dalam image Docker repo (`src/agents/models.profiles.live.test.ts` dan `src/gateway/gateway-models.profiles.live.test.ts`), memasang direktori konfigurasi lokal dan workspace Anda (serta mengambil sumber dari `~/.profile` jika dipasang). Entry point lokal yang cocok adalah `test:live:models-profiles` dan `test:live:gateway-profiles`.
- Runner live Docker secara default menggunakan batas smoke yang lebih kecil agar sweep Docker penuh tetap praktis:
  `test:docker:live-models` default ke `OPENCLAW_LIVE_MAX_MODELS=12`, dan
  `test:docker:live-gateway` default ke `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, dan
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Override variabel env tersebut saat Anda
  secara eksplisit menginginkan pemindaian menyeluruh yang lebih besar.
- `test:docker:all` membangun image Docker live sekali melalui `test:docker:live-build`, mengemas OpenClaw sekali sebagai tarball npm melalui `scripts/package-openclaw-for-docker.mjs`, lalu membangun/menggunakan ulang dua image `scripts/e2e/Dockerfile`. Image bare hanya runner Node/Git untuk lane instalasi/pembaruan/dependensi-plugin; lane tersebut memasang tarball yang sudah dibuat sebelumnya. Image fungsional menginstal tarball yang sama ke `/app` untuk lane fungsionalitas aplikasi yang dibangun. Definisi lane Docker ada di `scripts/lib/docker-e2e-scenarios.mjs`; logika perencana ada di `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` menjalankan rencana yang dipilih. Agregat menggunakan scheduler lokal berbobot: `OPENCLAW_DOCKER_ALL_PARALLELISM` mengontrol slot proses, sementara batas sumber daya mencegah lane live berat, npm-install, dan multi-service semuanya dimulai sekaligus. Jika satu lane lebih berat daripada batas aktif, scheduler masih dapat memulainya saat pool kosong lalu membiarkannya berjalan sendiri hingga kapasitas tersedia lagi. Default adalah 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; sesuaikan `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` hanya saat host Docker memiliki ruang kapasitas lebih. Runner melakukan preflight Docker secara default, menghapus kontainer E2E OpenClaw yang usang, mencetak status setiap 30 detik, menyimpan timing lane yang berhasil di `.artifacts/docker-tests/lane-timings.json`, dan menggunakan timing tersebut untuk memulai lane yang lebih lama terlebih dahulu pada proses berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifes lane berbobot tanpa membangun atau menjalankan Docker, atau `node scripts/test-docker-all.mjs --plan-json` untuk mencetak rencana CI untuk lane yang dipilih, kebutuhan paket/image, dan kredensial.
- `Package Acceptance` adalah gate paket GitHub-native untuk "apakah tarball yang dapat diinstal ini berfungsi sebagai produk?" Ini menyelesaikan satu paket kandidat dari `source=npm`, `source=ref`, `source=url`, atau `source=artifact`, mengunggahnya sebagai `package-under-test`, lalu menjalankan lane E2E Docker yang dapat digunakan ulang terhadap tarball persis itu alih-alih mengemas ulang ref yang dipilih. Profil diurutkan berdasarkan luas cakupan: `smoke`, `package`, `product`, dan `full`. Lihat [Menguji pembaruan dan Plugin](/id/help/testing-updates-plugins) untuk kontrak paket/pembaruan/Plugin, matriks survivor published-upgrade, default rilis, dan triase kegagalan.
- Pemeriksaan build dan rilis menjalankan `scripts/check-cli-bootstrap-imports.mjs` setelah tsdown. Guard menelusuri graf statis yang sudah dibangun dari `dist/entry.js` dan `dist/cli/run-main.js` dan gagal jika startup pra-dispatch mengimpor dependensi paket seperti Commander, UI prompt, undici, atau logging sebelum dispatch perintah; guard juga menjaga chunk proses Gateway bawaan tetap di bawah anggaran dan menolak impor statis dari jalur cold Gateway yang diketahui. Smoke CLI terpaket juga mencakup bantuan root, bantuan onboard, bantuan doctor, status, skema konfigurasi, dan perintah daftar model.
- Kompatibilitas legacy Package Acceptance dibatasi pada `2026.4.25` (termasuk `2026.4.25-beta.*`). Hingga batas tersebut, harness hanya menoleransi kekurangan metadata paket yang sudah dikirim: entri inventaris QA privat yang dihilangkan, `gateway install --wrapper` yang hilang, berkas patch yang hilang di fixture git turunan tarball, `update.channel` tersimpan yang hilang, lokasi legacy catatan instalasi Plugin, persistensi catatan instalasi marketplace yang hilang, dan migrasi metadata konfigurasi selama `plugins update`. Untuk paket setelah `2026.4.25`, jalur tersebut menjadi kegagalan ketat.
- Runner smoke kontainer: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:skill-install`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix`, dan `test:docker:config-reload` mem-boot satu atau beberapa kontainer nyata dan memverifikasi jalur integrasi tingkat lebih tinggi.

Runner Docker model live juga hanya melakukan bind-mount home autentikasi CLI yang diperlukan (atau semua yang didukung saat proses tidak dipersempit), lalu menyalinnya ke home kontainer sebelum proses berjalan sehingga OAuth CLI eksternal dapat me-refresh token tanpa mengubah store autentikasi host:

- Model langsung: `pnpm test:docker:live-models` (skrip: `scripts/test-live-models-docker.sh`)
- Smoke bind ACP: `pnpm test:docker:live-acp-bind` (skrip: `scripts/test-live-acp-bind-docker.sh`; mencakup Claude, Codex, dan Gemini secara default, dengan cakupan Droid/OpenCode ketat melalui `pnpm test:docker:live-acp-bind:droid` dan `pnpm test:docker:live-acp-bind:opencode`)
- Smoke backend CLI: `pnpm test:docker:live-cli-backend` (skrip: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (skrip: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agen dev: `pnpm test:docker:live-gateway` (skrip: `scripts/test-live-gateway-models-docker.sh`)
- Smoke observabilitas: `pnpm qa:otel:smoke` adalah lane pemeriksaan sumber QA privat. Ini sengaja tidak menjadi bagian dari lane rilis Docker paket karena tarball npm menghilangkan QA Lab.
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (skrip: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, scaffolding penuh): `pnpm test:docker:onboard` (skrip: `scripts/e2e/onboard-docker.sh`)
- Smoke onboarding/channel/agen tarball Npm: `pnpm test:docker:npm-onboard-channel-agent` menginstal tarball OpenClaw yang sudah dikemas secara global di Docker, mengonfigurasi OpenAI melalui onboarding env-ref plus Telegram secara default, menjalankan doctor, dan menjalankan satu giliran agen OpenAI tiruan. Gunakan ulang tarball yang sudah dibuat sebelumnya dengan `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati pembangunan ulang host dengan `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, atau ganti channel dengan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` atau `OPENCLAW_NPM_ONBOARD_CHANNEL=slack`.
- Smoke pemasangan Skills: `pnpm test:docker:skill-install` menginstal tarball OpenClaw yang sudah dikemas secara global di Docker, menonaktifkan pemasangan arsip yang diunggah di konfigurasi, menyelesaikan slug Skills ClawHub live saat ini dari pencarian, memasangnya dengan `openclaw skills install`, dan memverifikasi Skills yang terpasang plus metadata asal/kunci `.clawhub`.
- Smoke pergantian channel pembaruan: `pnpm test:docker:update-channel-switch` menginstal tarball OpenClaw yang sudah dikemas secara global di Docker, beralih dari paket `stable` ke git `dev`, memverifikasi channel yang dipersistenkan dan kerja Plugin pascapembaruan, lalu beralih kembali ke paket `stable` dan memeriksa status pembaruan.
- Smoke penyintas peningkatan: `pnpm test:docker:upgrade-survivor` menginstal tarball OpenClaw yang sudah dikemas di atas fixture pengguna lama kotor dengan agen, konfigurasi channel, allowlist Plugin, status dependensi Plugin usang, dan file workspace/sesi yang sudah ada. Ini menjalankan pembaruan paket plus doctor noninteraktif tanpa penyedia live atau kunci channel, lalu memulai Gateway loopback dan memeriksa pelestarian konfigurasi/status plus anggaran startup/status.
- Smoke penyintas peningkatan terpublikasi: `pnpm test:docker:published-upgrade-survivor` menginstal `openclaw@latest` secara default, menanam file pengguna yang sudah ada secara realistis, mengonfigurasi baseline tersebut dengan resep perintah bawaan, memvalidasi konfigurasi yang dihasilkan, memperbarui instalasi terpublikasi itu ke tarball kandidat, menjalankan doctor noninteraktif, menulis `.artifacts/upgrade-survivor/summary.json`, lalu memulai Gateway loopback dan memeriksa intent yang dikonfigurasi, pelestarian status, startup, `/healthz`, `/readyz`, dan anggaran status RPC. Timpa satu baseline dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, minta penjadwal agregat memperluas baseline lokal persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` seperti `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, dan perluas fixture berbentuk isu dengan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` seperti `reported-issues`; set reported-issues mencakup `configured-plugin-installs` untuk perbaikan otomatis pemasangan Plugin OpenClaw eksternal. Package Acceptance mengeksposnya sebagai `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, dan `published_upgrade_survivor_scenarios`, menyelesaikan token baseline meta seperti `last-stable-4` atau `all-since-2026.4.23`, dan Full Release Validation memperluas gate paket release-soak menjadi `last-stable-4 2026.4.23 2026.5.2 2026.4.15` plus `reported-issues`.
- Smoke konteks runtime sesi: `pnpm test:docker:session-runtime-context` memverifikasi persistensi transkrip konteks runtime tersembunyi plus perbaikan doctor untuk cabang prompt-rewrite terdampak yang terduplikasi.
- Smoke pemasangan global Bun: `bash scripts/e2e/bun-global-install-smoke.sh` mengemas tree saat ini, memasangnya dengan `bun install -g` di home terisolasi, dan memverifikasi `openclaw infer image providers --json` mengembalikan penyedia gambar bawaan alih-alih menggantung. Gunakan ulang tarball yang sudah dibuat sebelumnya dengan `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati build host dengan `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, atau salin `dist/` dari image Docker yang sudah dibangun dengan `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker installer: `bash scripts/test-install-sh-docker.sh` membagikan satu cache npm di seluruh kontainer root, update, dan direct-npm. Smoke update default ke npm `latest` sebagai baseline stable sebelum meningkatkan ke tarball kandidat. Timpa dengan `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` secara lokal, atau dengan input `update_baseline_version` workflow Install Smoke di GitHub. Pemeriksaan installer non-root menjaga cache npm terisolasi agar entri cache milik root tidak menutupi perilaku pemasangan lokal pengguna. Atur `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` untuk menggunakan ulang cache root/update/direct-npm di seluruh rerun lokal.
- Install Smoke CI melewati pembaruan global direct-npm duplikat dengan `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; jalankan skrip secara lokal tanpa env tersebut ketika cakupan langsung `npm install -g` diperlukan.
- Smoke CLI hapus workspace bersama agen: `pnpm test:docker:agents-delete-shared-workspace` (skrip: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) membangun image Dockerfile root secara default, menanam dua agen dengan satu workspace di home kontainer terisolasi, menjalankan `agents delete --json`, dan memverifikasi JSON valid plus perilaku workspace yang dipertahankan. Gunakan ulang image install-smoke dengan `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Jaringan Gateway (dua kontainer, autentikasi WS + kesehatan): `pnpm test:docker:gateway-network` (skrip: `scripts/e2e/gateway-network-docker.sh`)
- Smoke snapshot CDP browser: `pnpm test:docker:browser-cdp-snapshot` (skrip: `scripts/e2e/browser-cdp-snapshot-docker.sh`) membangun image E2E sumber plus lapisan Chromium, memulai Chromium dengan CDP mentah, menjalankan `browser doctor --deep`, dan memverifikasi snapshot peran CDP mencakup URL tautan, clickable yang dinaikkan dari kursor, ref iframe, dan metadata frame.
- Regresi reasoning minimal `web_search` OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (skrip: `scripts/e2e/openai-web-search-minimal-docker.sh`) menjalankan server OpenAI tiruan melalui Gateway, memverifikasi `web_search` menaikkan `reasoning.effort` dari `minimal` ke `low`, lalu memaksa skema penyedia menolak dan memeriksa detail mentah muncul di log Gateway.
- Bridge channel MCP (Gateway tertanam + bridge stdio + smoke notification-frame Claude mentah): `pnpm test:docker:mcp-channels` (skrip: `scripts/e2e/mcp-channels-docker.sh`)
- Tool MCP bundle Pi (server MCP stdio nyata + smoke allow/deny profil Pi tertanam): `pnpm test:docker:pi-bundle-mcp-tools` (skrip: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pembersihan MCP Cron/subagen (Gateway nyata + teardown child MCP stdio setelah Cron terisolasi dan run subagen sekali jalan): `pnpm test:docker:cron-mcp-cleanup` (skrip: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke pasang/perbarui untuk path lokal, `file:`, registry npm dengan dependensi hoisted, ref git bergerak, kitchen-sink ClawHub, pembaruan marketplace, dan aktifkan/periksa bundle Claude): `pnpm test:docker:plugins` (skrip: `scripts/e2e/plugins-docker.sh`)
  Atur `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` untuk melewati blok ClawHub, atau timpa pasangan package/runtime kitchen-sink default dengan `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` dan `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Tanpa `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, pengujian menggunakan server fixture ClawHub lokal hermetik.
- Smoke pembaruan Plugin tanpa perubahan: `pnpm test:docker:plugin-update` (skrip: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke matriks siklus hidup Plugin: `pnpm test:docker:plugin-lifecycle-matrix` menginstal tarball OpenClaw yang sudah dikemas di kontainer kosong, menginstal Plugin npm, mengganti aktif/nonaktif, meningkatkan dan menurunkannya melalui registry npm lokal, menghapus kode yang terpasang, lalu memverifikasi uninstall tetap menghapus status usang sambil mencatat metrik RSS/CPU untuk tiap fase siklus hidup.
- Smoke metadata reload konfigurasi: `pnpm test:docker:config-reload` (skrip: `scripts/e2e/config-reload-source-docker.sh`)
- Plugin: `pnpm test:docker:plugins` mencakup smoke pasang/perbarui untuk path lokal, `file:`, registry npm dengan dependensi hoisted, ref git bergerak, fixture ClawHub, pembaruan marketplace, dan aktifkan/periksa bundle Claude. `pnpm test:docker:plugin-update` mencakup perilaku pembaruan tanpa perubahan untuk Plugin yang terpasang. `pnpm test:docker:plugin-lifecycle-matrix` mencakup pemasangan Plugin npm dengan pelacakan sumber daya, aktifkan, nonaktifkan, tingkatkan, turunkan, dan uninstall kode yang hilang.

Untuk melakukan prebuild dan menggunakan ulang image fungsional bersama secara manual:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Timpa image khusus suite seperti `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` tetap menang ketika diatur. Ketika `OPENCLAW_SKIP_DOCKER_BUILD=1` menunjuk ke image bersama jarak jauh, skrip akan menariknya jika belum ada secara lokal. Pengujian Docker QR dan installer mempertahankan Dockerfile masing-masing karena memvalidasi perilaku paket/pemasangan, bukan runtime aplikasi yang dibangun bersama.

Runner Docker model langsung juga melakukan bind-mount checkout saat ini secara baca-saja dan
menempatkannya ke workdir sementara di dalam container. Ini menjaga image runtime
tetap ramping sekaligus tetap menjalankan Vitest terhadap source/config lokal persis milik Anda.
Langkah staging melewati cache besar yang hanya lokal dan output build aplikasi seperti
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, serta direktori output `.build` lokal aplikasi atau
Gradle agar live run Docker tidak menghabiskan menit-menit untuk menyalin
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
permintaan chat nyata melalui proxy `/api/chat/completions` milik Open WebUI.
Tetapkan `OPENWEBUI_SMOKE_MODE=models` untuk pemeriksaan CI jalur rilis yang harus berhenti
setelah masuk Open WebUI dan penemuan model, tanpa menunggu penyelesaian model langsung.
Run pertama bisa terasa lebih lambat karena Docker mungkin perlu menarik image
Open WebUI dan Open WebUI mungkin perlu menyelesaikan setup cold-start miliknya sendiri.
Lane ini mengharapkan kunci model langsung yang dapat digunakan, dan `OPENCLAW_PROFILE_FILE`
(`~/.profile` secara default) adalah cara utama untuk menyediakannya dalam run yang di-Docker-kan.
Run yang berhasil mencetak payload JSON kecil seperti `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` sengaja deterministik dan tidak memerlukan akun
Telegram, Discord, atau iMessage sungguhan. Ini mem-boot container Gateway yang sudah di-seed,
memulai container kedua yang menjalankan `openclaw mcp serve`, lalu
memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran,
perilaku antrean event langsung, routing pengiriman keluar, serta notifikasi channel +
izin bergaya Claude melalui bridge MCP stdio nyata. Pemeriksaan notifikasi
menginspeksi frame MCP stdio mentah secara langsung sehingga smoke memvalidasi apa yang
benar-benar dipancarkan bridge, bukan hanya apa yang kebetulan diekspos SDK klien tertentu.
`test:docker:pi-bundle-mcp-tools` deterministik dan tidak memerlukan kunci
model langsung. Ini membangun image Docker repo, memulai server probe MCP stdio nyata
di dalam container, mematerialisasi server tersebut melalui runtime MCP bundle Pi tertanam,
menjalankan tool, lalu memverifikasi `coding` dan `messaging` mempertahankan
tool `bundle-mcp` sementara `minimal` dan `tools.deny: ["bundle-mcp"]` memfilternya.
`test:docker:cron-mcp-cleanup` deterministik dan tidak memerlukan kunci model langsung.
Ini memulai Gateway yang sudah di-seed dengan server probe MCP stdio nyata, menjalankan
turn cron terisolasi dan turn child sekali jalan `/subagents spawn`, lalu memverifikasi
proses child MCP keluar setelah setiap run.

Smoke thread bahasa alami ACP manual (bukan CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Simpan script ini untuk alur kerja regresi/debug. Ini mungkin diperlukan lagi untuk validasi routing thread ACP, jadi jangan hapus.

Env var yang berguna:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) di-mount ke `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) di-mount ke `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (default: `~/.profile`) di-mount ke `/home/node/.profile` dan di-source sebelum menjalankan test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` untuk memverifikasi hanya env var yang di-source dari `OPENCLAW_PROFILE_FILE`, menggunakan direktori config/workspace sementara dan tanpa mount auth CLI eksternal
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) di-mount ke `/home/node/.npm-global` untuk instalasi CLI yang di-cache di dalam Docker
- Direktori/file auth CLI eksternal di bawah `$HOME` di-mount baca-saja di bawah `/host-auth...`, lalu disalin ke `/home/node/...` sebelum test dimulai
  - Direktori default: `.minimax`
  - File default: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Run provider yang dipersempit hanya me-mount direktori/file yang diperlukan dan diinferensikan dari `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Timpa secara manual dengan `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, atau daftar koma seperti `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` untuk mempersempit run
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` untuk memfilter provider di dalam container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` untuk menggunakan kembali image `openclaw:local-live` yang sudah ada bagi rerun yang tidak memerlukan rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memastikan kredensial berasal dari penyimpanan profil (bukan env)
- `OPENCLAW_OPENWEBUI_MODEL=...` untuk memilih model yang diekspos oleh gateway bagi smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` untuk menimpa prompt pemeriksaan nonce yang digunakan oleh smoke Open WebUI
- `OPENWEBUI_IMAGE=...` untuk menimpa tag image Open WebUI yang dipin

## Sanitas docs

Jalankan pemeriksaan docs setelah edit docs: `pnpm check:docs`.
Jalankan validasi anchor Mintlify penuh saat Anda juga memerlukan pemeriksaan heading dalam halaman: `pnpm docs:check-links:anchors`.

## Regresi offline (aman untuk CI)

Ini adalah regresi "pipeline nyata" tanpa provider nyata:

- Pemanggilan tool Gateway (mock OpenAI, gateway nyata + agent loop): `src/gateway/gateway.test.ts` (kasus: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, menulis config + auth diberlakukan): `src/gateway/gateway.test.ts` (kasus: "runs wizard over ws and writes auth token config")

## Eval keandalan agent (skills)

Kita sudah memiliki beberapa test aman untuk CI yang berperilaku seperti "eval keandalan agent":

- Pemanggilan tool mock melalui gateway nyata + agent loop (`src/gateway/gateway.test.ts`).
- Alur wizard end-to-end yang memvalidasi pengkabelan sesi dan efek config (`src/gateway/gateway.test.ts`).

Yang masih kurang untuk skills (lihat [Skills](/id/tools/skills)):

- **Pengambilan keputusan:** saat skills dicantumkan dalam prompt, apakah agent memilih skill yang tepat (atau menghindari yang tidak relevan)?
- **Kepatuhan:** apakah agent membaca `SKILL.md` sebelum digunakan dan mengikuti langkah/argumen yang diwajibkan?
- **Kontrak alur kerja:** skenario multi-turn yang menegaskan urutan tool, penerusan riwayat sesi, dan batas sandbox.

Eval mendatang harus tetap deterministik terlebih dahulu:

- Runner skenario yang menggunakan provider mock untuk menegaskan pemanggilan tool + urutan, pembacaan file skill, dan pengkabelan sesi.
- Suite kecil skenario berfokus skill (gunakan vs hindari, gating, prompt injection).
- Eval langsung opsional (ikut serta, dibatasi env) hanya setelah suite aman untuk CI tersedia.

## Test kontrak (bentuk plugin dan channel)

Test kontrak memverifikasi bahwa setiap plugin dan channel terdaftar mematuhi
kontrak antarmukanya. Test ini mengiterasi semua plugin yang ditemukan dan menjalankan suite
asersi bentuk dan perilaku. Lane unit `pnpm test` default sengaja
melewati file smoke dan seam bersama ini; jalankan perintah kontrak secara eksplisit
saat Anda menyentuh surface channel atau provider bersama.

### Perintah

- Semua kontrak: `pnpm test:contracts`
- Hanya kontrak channel: `pnpm test:contracts:channels`
- Hanya kontrak provider: `pnpm test:contracts:plugins`

### Kontrak channel

Terletak di `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Bentuk plugin dasar (id, nama, kapabilitas)
- **setup** - Kontrak wizard setup
- **session-binding** - Perilaku pengikatan sesi
- **outbound-payload** - Struktur payload pesan
- **inbound** - Penanganan pesan masuk
- **actions** - Handler aksi channel
- **threading** - Penanganan ID thread
- **directory** - API direktori/roster
- **group-policy** - Penegakan kebijakan grup

### Kontrak status provider

Terletak di `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe status channel
- **registry** - Bentuk registry plugin

### Kontrak provider

Terletak di `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrak alur auth
- **auth-choice** - Pilihan/seleksi auth
- **catalog** - API katalog model
- **discovery** - Penemuan plugin
- **loader** - Pemuatan plugin
- **runtime** - Runtime provider
- **shape** - Bentuk/antarmuka plugin
- **wizard** - Wizard setup

### Kapan menjalankan

- Setelah mengubah ekspor atau subpath plugin-sdk
- Setelah menambahkan atau memodifikasi plugin channel atau provider
- Setelah merefaktor pendaftaran atau penemuan plugin

Test kontrak berjalan di CI dan tidak memerlukan kunci API sungguhan.

## Menambahkan regresi (panduan)

Saat Anda memperbaiki masalah provider/model yang ditemukan secara langsung:

- Tambahkan regresi aman untuk CI jika memungkinkan (provider mock/stub, atau tangkap transformasi bentuk permintaan persisnya)
- Jika secara inheren hanya langsung (rate limit, kebijakan auth), pertahankan test langsung tetap sempit dan ikut serta melalui env var
- Pilih lapisan terkecil yang menangkap bug:
  - bug konversi/replay permintaan provider → test model langsung
  - bug pipeline sesi/riwayat/tool gateway → smoke langsung gateway atau test mock gateway aman untuk CI
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` mengambil satu target sampel per kelas SecretRef dari metadata registry (`listSecretTargetRegistryEntries()`), lalu menegaskan id exec segmen traversal ditolak.
  - Jika Anda menambahkan keluarga target SecretRef `includeInPlan` baru di `src/secrets/target-registry-data.ts`, perbarui `classifyTargetClass` dalam test tersebut. Test ini sengaja gagal pada id target yang tidak terklasifikasi agar kelas baru tidak bisa dilewati secara diam-diam.

## Terkait

- [Testing live](/id/help/testing-live)
- [Testing updates and plugins](/id/help/testing-updates-plugins)
- [CI](/id/ci)
