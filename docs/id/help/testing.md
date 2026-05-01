---
read_when:
    - Menjalankan pengujian secara lokal atau di CI
    - Menambahkan uji regresi untuk bug model/penyedia
    - Pemecahan masalah perilaku Gateway + agen
summary: 'Kit pengujian: rangkaian unit/e2e/langsung, runner Docker, dan cakupan tiap pengujian'
title: Pengujian
x-i18n:
    generated_at: "2026-05-01T09:25:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b0414138f708ca43e47a0d91bc565186d9dda1d487a6813191a383d169b8ae3
    source_path: help/testing.md
    workflow: 16
---

OpenClaw memiliki tiga suite Vitest (unit/integrasi, e2e, langsung) dan sekumpulan kecil runner Docker. Dokumen ini adalah panduan "cara kami menguji":

- Apa yang dicakup setiap suite (dan apa yang sengaja _tidak_ dicakup).
- Perintah mana yang dijalankan untuk alur kerja umum (lokal, pra-push, debugging).
- Bagaimana pengujian langsung menemukan kredensial dan memilih model/provider.
- Bagaimana menambahkan regresi untuk masalah model/provider dunia nyata.

<Note>
**Tumpukan QA (qa-lab, qa-channel, lane transport langsung)** didokumentasikan secara terpisah:

- [Ikhtisar QA](/id/concepts/qa-e2e-automation) — arsitektur, permukaan perintah, penulisan skenario.
- [QA Matrix](/id/concepts/qa-matrix) — referensi untuk `pnpm openclaw qa matrix`.
- [Channel QA](/id/channels/qa-channel) — plugin transport sintetis yang digunakan oleh skenario berbasis repo.

Halaman ini membahas menjalankan suite pengujian reguler dan runner Docker/Parallels. Bagian runner khusus QA di bawah ([runner khusus QA](#qa-specific-runners)) mencantumkan pemanggilan `qa` yang konkret dan mengarah kembali ke referensi di atas.
</Note>

## Mulai cepat

Pada kebanyakan hari:

- Gate penuh (diharapkan sebelum push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Jalankan suite penuh lokal yang lebih cepat di mesin yang lapang: `pnpm test:max`
- Loop watch Vitest langsung: `pnpm test:watch`
- Penargetan file langsung kini juga merutekan path ekstensi/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Utamakan menjalankan target spesifik saat Anda sedang mengiterasi satu kegagalan.
- Situs QA berbasis Docker: `pnpm qa:lab:up`
- Lane QA berbasis VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Saat Anda menyentuh pengujian atau menginginkan keyakinan tambahan:

- Gate cakupan: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Saat men-debug provider/model nyata (memerlukan kredensial nyata):

- Suite langsung (model + probe alat/gambar gateway): `pnpm test:live`
- Targetkan satu file langsung secara senyap: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Sweep model langsung Docker: `pnpm test:docker:live-models`
  - Setiap model yang dipilih kini menjalankan satu giliran teks plus probe kecil bergaya pembacaan file.
    Model yang metadatanya mengiklankan input `image` juga menjalankan satu giliran gambar kecil.
    Nonaktifkan probe tambahan dengan `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` atau
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` saat mengisolasi kegagalan provider.
  - Cakupan CI: `OpenClaw Scheduled Live And E2E Checks` harian dan
    `OpenClaw Release Checks` manual sama-sama memanggil alur kerja langsung/E2E yang dapat digunakan ulang dengan
    `include_live_suites: true`, yang mencakup job matriks model langsung Docker terpisah
    yang di-shard berdasarkan provider.
  - Untuk menjalankan ulang CI yang terfokus, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    dengan `include_live_suites: true` dan `live_models_only: true`.
  - Tambahkan secret provider baru yang bersinyal tinggi ke `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dan pemanggil
    terjadwal/rilisnya.
- Smoke chat terikat Codex native: `pnpm test:docker:live-codex-bind`
  - Menjalankan lane langsung Docker terhadap path app-server Codex, mengikat DM
    Slack sintetis dengan `/codex bind`, menjalankan `/codex fast` dan
    `/codex permissions`, lalu memverifikasi balasan biasa dan lampiran gambar
    dirutekan melalui binding plugin native, bukan ACP.
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness`
  - Menjalankan giliran agen gateway melalui harness app-server Codex milik plugin,
    memverifikasi `/codex status` dan `/codex models`, dan secara default menjalankan probe gambar,
    cron MCP, sub-agen, dan Guardian. Nonaktifkan probe sub-agen dengan
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` saat mengisolasi kegagalan app-server Codex
    lainnya. Untuk pemeriksaan sub-agen yang terfokus, nonaktifkan probe lain:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Ini keluar setelah probe sub-agen kecuali
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` disetel.
- Smoke perintah penyelamatan Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Pemeriksaan berlapis opt-in untuk permukaan perintah penyelamatan channel pesan.
    Ini menjalankan `/crestodian status`, mengantrekan perubahan model persisten,
    membalas `/crestodian yes`, dan memverifikasi path tulis audit/konfigurasi.
- Smoke Docker planner Crestodian: `pnpm test:docker:crestodian-planner`
  - Menjalankan Crestodian dalam container tanpa konfigurasi dengan CLI Claude palsu di `PATH`
    dan memverifikasi fallback planner fuzzy diterjemahkan menjadi penulisan konfigurasi bertipe yang diaudit.
- Smoke Docker first-run Crestodian: `pnpm test:docker:crestodian-first-run`
  - Dimulai dari direktori status OpenClaw kosong, merutekan `openclaw` polos ke
    Crestodian, menerapkan setup/model/agen/plugin Discord + penulisan SecretRef,
    memvalidasi konfigurasi, dan memverifikasi entri audit. Path setup Ring 0 yang sama
    juga dicakup di QA Lab oleh
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Smoke biaya Moonshot/Kimi: dengan `MOONSHOT_API_KEY` disetel, jalankan
  `openclaw models list --provider moonshot --json`, lalu jalankan
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  terisolasi terhadap `moonshot/kimi-k2.6`. Verifikasi JSON melaporkan Moonshot/K2.6 dan
  transkrip asisten menyimpan `usage.cost` yang dinormalisasi.

<Tip>
Saat Anda hanya membutuhkan satu kasus gagal, utamakan mempersempit pengujian langsung melalui variabel env allowlist yang dijelaskan di bawah.
</Tip>

## Runner khusus QA

Perintah ini berada di samping suite pengujian utama saat Anda membutuhkan realisme QA-lab:

CI menjalankan QA Lab dalam alur kerja khusus. `Parity gate` berjalan pada PR yang cocok dan
dari dispatch manual dengan provider tiruan. `QA-Lab - All Lanes` berjalan setiap malam di
`main` dan dari dispatch manual dengan gate paritas tiruan, lane Matrix langsung,
lane Telegram langsung yang dikelola Convex, dan lane Discord langsung yang dikelola Convex sebagai
job paralel. QA terjadwal dan pemeriksaan rilis meneruskan Matrix `--profile fast`
secara eksplisit, sementara default input CLI Matrix dan alur kerja manual tetap
`all`; dispatch manual dapat men-shard `all` menjadi job `transport`, `media`, `e2ee-smoke`,
`e2ee-deep`, dan `e2ee-cli`. `OpenClaw Release Checks` menjalankan paritas plus
lane Matrix cepat dan Telegram sebelum persetujuan rilis, menggunakan
`mock-openai/gpt-5.5` untuk pemeriksaan transport rilis agar tetap deterministik
dan menghindari startup provider-plugin normal. Gateway transport langsung ini menonaktifkan
pencarian memori; perilaku memori tetap dicakup oleh suite paritas QA.

Shard media langsung rilis penuh menggunakan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang sudah memiliki
`ffmpeg` dan `ffprobe`. Shard model/backend langsung Docker menggunakan image bersama
`ghcr.io/openclaw/openclaw-live-test:<sha>` yang dibangun sekali per commit terpilih,
lalu menariknya dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`, bukan membangun ulang
di dalam setiap shard.

- `pnpm openclaw qa suite`
  - Menjalankan skenario QA berbasis repo langsung di host.
  - Menjalankan beberapa skenario terpilih secara paralel secara default dengan worker
    gateway terisolasi. `qa-channel` default ke konkurensi 4 (dibatasi oleh
    jumlah skenario terpilih). Gunakan `--concurrency <count>` untuk menyesuaikan jumlah
    worker, atau `--concurrency 1` untuk lane serial yang lebih lama.
  - Keluar dengan non-zero saat skenario mana pun gagal. Gunakan `--allow-failures` saat Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Mendukung mode provider `live-frontier`, `mock-openai`, dan `aimock`.
    `aimock` memulai server provider lokal berbasis AIMock untuk cakupan fixture
    eksperimental dan mock protokol tanpa mengganti lane `mock-openai` yang sadar skenario.
- `pnpm test:gateway:cpu-scenarios`
  - Menjalankan bench startup gateway plus paket kecil skenario QA Lab tiruan
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) dan menulis ringkasan observasi CPU gabungan
    di bawah `.artifacts/gateway-cpu-scenarios/`.
  - Secara default hanya menandai observasi CPU panas yang berkelanjutan (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), sehingga lonjakan startup singkat dicatat sebagai metrik
    tanpa terlihat seperti regresi gateway peg selama beberapa menit.
  - Menggunakan artefak `dist` yang sudah dibangun; jalankan build terlebih dahulu saat checkout belum
    memiliki output runtime terbaru.
- `pnpm openclaw qa suite --runner multipass`
  - Menjalankan suite QA yang sama di dalam VM Linux Multipass sekali pakai.
  - Menjaga perilaku pemilihan skenario yang sama seperti `qa suite` di host.
  - Menggunakan ulang flag pemilihan provider/model yang sama seperti `qa suite`.
  - Jalankan langsung meneruskan input auth QA yang didukung dan praktis untuk guest:
    kunci provider berbasis env, path konfigurasi provider langsung QA, dan `CODEX_HOME`
    saat ada.
  - Direktori output harus tetap berada di bawah root repo agar guest dapat menulis kembali melalui
    workspace yang di-mount.
  - Menulis laporan + ringkasan QA normal plus log Multipass di bawah
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Memulai situs QA berbasis Docker untuk kerja QA bergaya operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Membangun tarball npm dari checkout saat ini, memasangnya secara global di
    Docker, menjalankan onboarding kunci API OpenAI noninteraktif, mengonfigurasi Telegram
    secara default, memverifikasi bahwa mengaktifkan plugin memasang dependensi runtime sesuai
    kebutuhan, menjalankan doctor, dan menjalankan satu giliran agen lokal terhadap endpoint OpenAI
    tiruan.
  - Gunakan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` untuk menjalankan lane instalasi paket yang sama
    dengan Discord.
- `pnpm test:docker:session-runtime-context`
  - Menjalankan smoke Docker aplikasi terbangun yang deterministik untuk transkrip konteks runtime
    tertanam. Ini memverifikasi konteks runtime OpenClaw tersembunyi dipersistenkan sebagai
    pesan kustom non-tampilan, bukan bocor ke giliran pengguna yang terlihat,
    lalu menanam JSONL sesi rusak yang terdampak dan memverifikasi
    `openclaw doctor --fix` menulis ulang ke branch aktif dengan cadangan.
- `pnpm test:docker:npm-telegram-live`
  - Memasang kandidat paket OpenClaw di Docker, menjalankan onboarding paket terpasang,
    mengonfigurasi Telegram melalui CLI terpasang, lalu menggunakan ulang lane QA Telegram
    langsung dengan paket terpasang itu sebagai Gateway SUT.
  - Default ke `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; setel
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` atau
    `OPENCLAW_CURRENT_PACKAGE_TGZ` untuk menguji tarball lokal yang sudah di-resolve, bukan
    memasang dari registry.
  - Menggunakan kredensial env Telegram yang sama atau sumber kredensial Convex seperti
    `pnpm openclaw qa telegram`. Untuk otomatisasi CI/rilis, setel
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` dan secret peran. Jika
    `OPENCLAW_QA_CONVEX_SITE_URL` dan secret peran Convex ada di CI,
    wrapper Docker memilih Convex secara otomatis.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` menimpa
    `OPENCLAW_QA_CREDENTIAL_ROLE` bersama hanya untuk lane ini.
  - GitHub Actions mengekspos lane ini sebagai alur kerja maintainer manual
    `NPM Telegram Beta E2E`. Ini tidak berjalan saat merge. Alur kerja menggunakan lingkungan
    `qa-live-shared` dan lease kredensial CI Convex.
- GitHub Actions juga mengekspos `Package Acceptance` untuk bukti produk side-run
  terhadap satu kandidat paket. Ini menerima ref tepercaya, spesifikasi npm yang dipublikasikan,
  URL tarball HTTPS plus SHA-256, atau artefak tarball dari run lain, mengunggah
  `openclaw-current.tgz` yang dinormalisasi sebagai `package-under-test`, lalu menjalankan
  penjadwal Docker E2E yang ada dengan profil lane smoke, package, product, full, atau custom.
  Setel `telegram_mode=mock-openai` atau `live-frontier` untuk menjalankan alur kerja QA
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

- Bukti artefak mengunduh artefak tarball dari proses Actions lain:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Mengemas dan menginstal build OpenClaw saat ini di Docker, memulai Gateway
    dengan OpenAI yang dikonfigurasi, lalu mengaktifkan channel/plugin bawaan melalui pengeditan
    konfigurasi.
  - Memverifikasi bahwa penemuan penyiapan membiarkan dependensi runtime Plugin
    yang belum dikonfigurasi tetap tidak ada, proses Gateway atau doctor pertama
    yang dikonfigurasi menginstal dependensi runtime setiap Plugin bawaan sesuai kebutuhan,
    dan restart kedua tidak menginstal ulang dependensi yang sudah diaktifkan.
  - Juga menginstal baseline npm lama yang diketahui, mengaktifkan Telegram sebelum menjalankan
    `openclaw update --tag <candidate>`, dan memverifikasi bahwa doctor pasca-pembaruan
    kandidat memperbaiki dependensi runtime channel bawaan tanpa perbaikan postinstall
    dari sisi harness.
- `pnpm test:parallels:npm-update`
  - Menjalankan smoke pembaruan instalasi paket native di seluruh guest Parallels. Setiap
    platform yang dipilih pertama-tama menginstal paket baseline yang diminta, lalu menjalankan
    perintah `openclaw update` yang terinstal di guest yang sama dan memverifikasi
    versi terinstal, status pembaruan, kesiapan Gateway, dan satu giliran agen lokal.
  - Gunakan `--platform macos`, `--platform windows`, atau `--platform linux` saat
    melakukan iterasi pada satu guest. Gunakan `--json` untuk jalur artefak ringkasan dan
    status per lane.
  - Lane OpenAI menggunakan `openai/gpt-5.5` untuk bukti giliran agen live secara
    default. Teruskan `--model <provider/model>` atau atur
    `OPENCLAW_PARALLELS_OPENAI_MODEL` saat sengaja memvalidasi model
    OpenAI lain.
  - Bungkus proses lokal yang panjang dengan timeout host agar kemacetan transport Parallels tidak
    menghabiskan sisa jendela pengujian:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrip menulis log lane bertingkat di bawah `/tmp/openclaw-parallels-npm-update.*`.
    Periksa `windows-update.log`, `macos-update.log`, atau `linux-update.log`
    sebelum menganggap wrapper luar macet.
  - Pembaruan Windows dapat menghabiskan 10 hingga 15 menit dalam perbaikan dependensi
    doctor/runtime pasca-pembaruan pada guest dingin; itu masih sehat ketika log debug
    npm bertingkat terus bergerak.
  - Jangan jalankan wrapper agregat ini secara paralel dengan lane smoke Parallels
    macOS, Windows, atau Linux individual. Semuanya berbagi status VM dan dapat bertabrakan pada
    pemulihan snapshot, penyajian paket, atau status Gateway guest.
  - Bukti pasca-pembaruan menjalankan permukaan Plugin bawaan normal karena
    facade kapabilitas seperti ucapan, pembuatan gambar, dan pemahaman media
    dimuat melalui API runtime bawaan bahkan ketika giliran agen itu sendiri
    hanya memeriksa respons teks sederhana.

- `pnpm openclaw qa aimock`
  - Hanya memulai server penyedia AIMock lokal untuk pengujian smoke
    protokol langsung.
- `pnpm openclaw qa matrix`
  - Menjalankan lane QA live Matrix terhadap homeserver Tuwunel sekali pakai yang didukung Docker. Hanya source-checkout — instalasi paket tidak mengirimkan `qa-lab`.
  - CLI lengkap, katalog profil/skenario, variabel env, dan tata letak artefak: [QA Matrix](/id/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Menjalankan lane QA live Telegram terhadap grup privat nyata menggunakan token bot driver dan SUT dari env.
  - Memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID grup harus berupa ID chat Telegram numerik.
  - Mendukung `--credential-source convex` untuk kredensial gabungan bersama. Gunakan mode env secara default, atau atur `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` untuk ikut menggunakan lease gabungan.
  - Keluar dengan status non-nol saat skenario apa pun gagal. Gunakan `--allow-failures` ketika Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Memerlukan dua bot berbeda dalam grup privat yang sama, dengan bot SUT mengekspos nama pengguna Telegram.
  - Untuk observasi bot-ke-bot yang stabil, aktifkan Bot-to-Bot Communication Mode di `@BotFather` untuk kedua bot dan pastikan bot driver dapat mengamati traffic bot grup.
  - Menulis laporan QA Telegram, ringkasan, dan artefak pesan yang diamati di bawah `.artifacts/qa-e2e/...`. Skenario balasan menyertakan RTT dari permintaan kirim driver hingga balasan SUT yang diamati.

Lane transport live berbagi satu kontrak standar agar transport baru tidak menyimpang; matriks cakupan per-lane berada di [ringkasan QA → Cakupan transport live](/id/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` adalah suite sintetis luas dan bukan bagian dari matriks tersebut.

### Kredensial Telegram bersama melalui Convex (v1)

Saat `--credential-source convex` (atau `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) diaktifkan untuk
`openclaw qa telegram`, lab QA memperoleh lease eksklusif dari pool yang didukung Convex, mengirim Heartbeat
untuk lease tersebut saat lane berjalan, dan melepas lease saat shutdown.

Scaffold proyek Convex referensi:

- `qa/convex-credential-broker/`

Variabel env yang diperlukan:

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
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID jejak opsional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` mengizinkan URL Convex `http://` loopback untuk pengembangan khusus lokal.

`OPENCLAW_QA_CONVEX_SITE_URL` harus menggunakan `https://` dalam operasi normal.

Perintah admin maintainer (tambah/hapus/daftar pool) secara khusus memerlukan
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI untuk maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gunakan `doctor` sebelum proses live untuk memeriksa URL situs Convex, rahasia broker,
prefiks endpoint, timeout HTTP, dan keterjangkauan admin/list tanpa mencetak
nilai rahasia. Gunakan `--json` untuk keluaran yang dapat dibaca mesin dalam skrip dan utilitas
CI.

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
- `groupId` harus berupa string ID chat Telegram numerik.
- `admin/add` memvalidasi bentuk ini untuk `kind: "telegram"` dan menolak payload yang tidak valid.

### Menambahkan channel ke QA

Arsitektur dan nama helper skenario untuk adapter channel baru berada di [ringkasan QA → Menambahkan channel](/id/concepts/qa-e2e-automation#adding-a-channel). Batas minimum: implementasikan runner transport pada seam host `qa-lab` bersama, deklarasikan `qaRunners` dalam manifes Plugin, pasang sebagai `openclaw qa <runner>`, dan tulis skenario di bawah `qa/scenarios/`.

## Suite pengujian (apa yang berjalan di mana)

Anggap suite sebagai “realisme yang meningkat” (dan flakiness/biaya yang meningkat):

### Unit / integrasi (default)

- Perintah: `pnpm test`
- Konfigurasi: proses tanpa target menggunakan set shard `vitest.full-*.config.ts` dan dapat memperluas shard multiproyek menjadi konfigurasi per proyek untuk penjadwalan paralel
- File: inventaris core/unit di bawah `src/**/*.test.ts`, `packages/**/*.test.ts`, dan `test/**/*.test.ts`; pengujian unit UI berjalan di shard khusus `unit-ui`
- Cakupan:
  - Pengujian unit murni
  - Pengujian integrasi dalam proses (autentikasi Gateway, routing, tooling, parsing, konfigurasi)
  - Regresi deterministik untuk bug yang diketahui
- Ekspektasi:
  - Berjalan di CI
  - Tidak memerlukan kunci nyata
  - Harus cepat dan stabil
  - Pengujian resolver dan loader permukaan publik harus membuktikan perilaku fallback `api.js` dan
    `runtime-api.js` yang luas dengan fixture Plugin kecil yang dihasilkan, bukan
    API sumber Plugin bawaan nyata. Pemuatan API Plugin nyata termasuk dalam
    suite kontrak/integrasi milik Plugin.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` tanpa target menjalankan dua belas konfigurasi shard yang lebih kecil (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) alih-alih satu proses proyek root native yang besar. Ini memangkas RSS puncak pada mesin yang sibuk dan menghindari pekerjaan auto-reply/ekstensi membuat suite yang tidak terkait kekurangan sumber daya.
    - `pnpm test --watch` tetap menggunakan grafik proyek root native `vitest.config.ts`, karena loop watch multi-shard tidak praktis.
    - `pnpm test`, `pnpm test:watch`, dan `pnpm test:perf:imports` merutekan target file/direktori eksplisit melalui lane terskop terlebih dahulu, sehingga `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` menghindari biaya startup proyek root penuh.
    - `pnpm test:changed` memperluas path git yang berubah menjadi lane terskop yang murah secara default: edit test langsung, file saudara `*.test.ts`, pemetaan sumber eksplisit, dan dependent grafik impor lokal. Edit config/setup/package tidak menjalankan test secara luas kecuali Anda secara eksplisit memakai `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` adalah gerbang pemeriksaan lokal pintar normal untuk pekerjaan sempit. Ini mengklasifikasikan diff menjadi core, test core, ekstensi, test ekstensi, app, docs, metadata rilis, tooling Docker live, dan tooling, lalu menjalankan perintah typecheck, lint, dan guard yang cocok. Ini tidak menjalankan test Vitest; panggil `pnpm test:changed` atau `pnpm test <target>` eksplisit untuk bukti test. Kenaikan versi yang hanya metadata rilis menjalankan pemeriksaan versi/config/dependensi-root yang ditargetkan, dengan guard yang menolak perubahan package di luar field versi tingkat atas.
    - Edit harness Docker ACP live menjalankan pemeriksaan terfokus: sintaks shell untuk skrip auth Docker live dan dry-run scheduler Docker live. Perubahan `package.json` hanya disertakan ketika diff dibatasi ke `scripts["test:docker:live-*"]`; edit dependensi, ekspor, versi, dan permukaan package lainnya tetap memakai guard yang lebih luas.
    - Test unit ringan-impor dari agen, command, plugin, helper auto-reply, `plugin-sdk`, dan area utilitas murni serupa dirutekan melalui lane `unit-fast`, yang melewati `test/setup-openclaw-runtime.ts`; file stateful/berat-runtime tetap berada di lane yang sudah ada.
    - File sumber helper `plugin-sdk` dan `commands` terpilih juga memetakan run mode-berubah ke test saudara eksplisit di lane ringan tersebut, sehingga edit helper menghindari menjalankan ulang suite berat penuh untuk direktori itu.
    - `auto-reply` memiliki bucket khusus untuk helper core tingkat atas, test integrasi `reply.*` tingkat atas, dan subtree `src/auto-reply/reply/**`. CI lebih lanjut membagi subtree reply menjadi shard agent-runner, dispatch, dan commands/state-routing sehingga satu bucket berat-impor tidak memiliki seluruh ekor Node.
    - CI PR/main normal sengaja melewati sweep batch ekstensi dan shard khusus-rilis `agentic-plugins`. Full Release Validation menjalankan workflow anak `Plugin Prerelease` terpisah untuk suite yang berat pada plugin/ekstensi tersebut pada kandidat rilis.

  </Accordion>

  <Accordion title="Cakupan runner tertanam">

    - Saat Anda mengubah input penemuan message-tool atau konteks runtime compaction, pertahankan kedua tingkat cakupan.
    - Tambahkan regresi helper terfokus untuk batas routing dan normalisasi murni.
    - Jaga suite integrasi runner tertanam tetap sehat:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, dan
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Suite tersebut memverifikasi bahwa id terskop dan perilaku compaction masih mengalir melalui path `run.ts` / `compact.ts` nyata; test yang hanya helper bukan pengganti yang cukup untuk path integrasi tersebut.

  </Accordion>

  <Accordion title="Default pool dan isolasi Vitest">

    - Config Vitest dasar memakai default `threads`.
    - Config Vitest bersama menetapkan `isolate: false` dan menggunakan runner non-terisolasi di seluruh proyek root, e2e, dan config live.
    - Lane UI root mempertahankan setup dan optimizer `jsdom`-nya, tetapi juga berjalan pada runner non-terisolasi bersama.
    - Setiap shard `pnpm test` mewarisi default `threads` + `isolate: false` yang sama dari config Vitest bersama.
    - `scripts/run-vitest.mjs` menambahkan `--no-maglev` untuk proses Node anak Vitest secara default untuk mengurangi churn kompilasi V8 selama run lokal besar. Setel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` untuk membandingkan dengan perilaku V8 standar.

  </Accordion>

  <Accordion title="Iterasi lokal cepat">

    - `pnpm changed:lanes` menampilkan lane arsitektural mana yang dipicu oleh sebuah diff.
    - Hook pre-commit hanya untuk pemformatan. Hook ini men-stage ulang file yang diformat dan tidak menjalankan lint, typecheck, atau test.
    - Jalankan `pnpm check:changed` secara eksplisit sebelum handoff atau push saat Anda memerlukan gerbang pemeriksaan lokal pintar.
    - `pnpm test:changed` dirutekan melalui lane terskop yang murah secara default. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika agen memutuskan bahwa edit harness, config, package, atau kontrak benar-benar membutuhkan cakupan Vitest yang lebih luas.
    - `pnpm test:max` dan `pnpm test:changed:max` mempertahankan perilaku routing yang sama, hanya dengan batas worker lebih tinggi.
    - Penskalaan otomatis worker lokal sengaja konservatif dan mundur ketika rata-rata load host sudah tinggi, sehingga beberapa run Vitest bersamaan secara default menimbulkan dampak lebih kecil.
    - Config Vitest dasar menandai proyek/file config sebagai `forceRerunTriggers` sehingga rerun mode-berubah tetap benar saat wiring test berubah.
    - Config mempertahankan `OPENCLAW_VITEST_FS_MODULE_CACHE` aktif pada host yang didukung; setel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` jika Anda menginginkan satu lokasi cache eksplisit untuk profiling langsung.

  </Accordion>

  <Accordion title="Debugging perf">

    - `pnpm test:perf:imports` mengaktifkan pelaporan durasi impor Vitest plus output perincian impor.
    - `pnpm test:perf:imports:changed` menskop tampilan profiling yang sama ke file yang berubah sejak `origin/main`.
    - Data timing shard ditulis ke `.artifacts/vitest-shard-timings.json`. Run seluruh-config memakai path config sebagai key; shard CI include-pattern menambahkan nama shard sehingga shard terfilter dapat dilacak secara terpisah.
    - Ketika satu test panas masih menghabiskan sebagian besar waktunya pada impor startup, letakkan dependensi berat di balik seam lokal sempit `*.runtime.ts` dan mock seam itu secara langsung alih-alih deep-import helper runtime hanya untuk meneruskannya melalui `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan `test:changed` yang dirutekan dengan path proyek-root native untuk diff commit tersebut dan mencetak wall time plus RSS maksimum macOS.
    - `pnpm test:perf:changed:bench -- --worktree` melakukan benchmark tree kotor saat ini dengan merutekan daftar file yang berubah melalui `scripts/test-projects.mjs` dan config Vitest root.
    - `pnpm test:perf:profile:main` menulis profil CPU main-thread untuk startup Vitest/Vite dan overhead transformasi.
    - `pnpm test:perf:profile:runner` menulis profil CPU+heap runner untuk suite unit dengan paralelisme file dinonaktifkan.

  </Accordion>
</AccordionGroup>

### Stabilitas (gateway)

- Command: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, dipaksa ke satu worker
- Cakupan:
  - Memulai Gateway loopback nyata dengan diagnostik aktif secara default
  - Menggerakkan churn pesan gateway sintetis, memori, dan payload besar melalui path event diagnostik
  - Mengueri `diagnostics.stability` melalui RPC WS Gateway
  - Mencakup helper persistensi bundle stabilitas diagnostik
  - Menegaskan recorder tetap terbatas, sampel RSS sintetis tetap di bawah anggaran tekanan, dan kedalaman antrean per sesi mengalir kembali ke nol
- Ekspektasi:
  - Aman untuk CI dan tanpa key
  - Lane sempit untuk tindak lanjut regresi stabilitas, bukan pengganti suite Gateway penuh

### E2E (smoke gateway)

- Command: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, dan test E2E bundled-plugin di bawah `extensions/`
- Default runtime:
  - Menggunakan `threads` Vitest dengan `isolate: false`, sesuai dengan bagian repo lainnya.
  - Menggunakan worker adaptif (CI: hingga 2, lokal: 1 secara default).
  - Berjalan dalam mode silent secara default untuk mengurangi overhead I/O console.
- Override berguna:
  - `OPENCLAW_E2E_WORKERS=<n>` untuk memaksa jumlah worker (dibatasi pada 16).
  - `OPENCLAW_E2E_VERBOSE=1` untuk mengaktifkan ulang output console verbose.
- Cakupan:
  - Perilaku end-to-end gateway multi-instance
  - Permukaan WebSocket/HTTP, pairing node, dan networking yang lebih berat
- Ekspektasi:
  - Berjalan di CI (ketika diaktifkan dalam pipeline)
  - Tidak memerlukan key nyata
  - Lebih banyak bagian bergerak daripada test unit (bisa lebih lambat)

### E2E: smoke backend OpenShell

- Command: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Cakupan:
  - Memulai gateway OpenShell terisolasi di host melalui Docker
  - Membuat sandbox dari Dockerfile lokal sementara
  - Melatih backend OpenShell OpenClaw melalui `sandbox ssh-config` nyata + exec SSH
  - Memverifikasi perilaku filesystem remote-canonical melalui bridge fs sandbox
- Ekspektasi:
  - Hanya opt-in; bukan bagian dari run default `pnpm test:e2e`
  - Memerlukan CLI `openshell` lokal plus daemon Docker yang berfungsi
  - Menggunakan `HOME` / `XDG_CONFIG_HOME` terisolasi, lalu menghancurkan gateway test dan sandbox
- Override berguna:
  - `OPENCLAW_E2E_OPENSHELL=1` untuk mengaktifkan test saat menjalankan suite e2e yang lebih luas secara manual
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` untuk menunjuk ke biner CLI non-default atau skrip wrapper

### Live (provider nyata + model nyata)

- Command: `pnpm test:live`
- Config: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, dan test live bundled-plugin di bawah `extensions/`
- Default: **aktif** oleh `pnpm test:live` (menyetel `OPENCLAW_LIVE_TEST=1`)
- Cakupan:
  - “Apakah provider/model ini benar-benar berfungsi _hari ini_ dengan kredensial nyata?”
  - Menangkap perubahan format provider, kekhasan tool-calling, masalah auth, dan perilaku rate limit
- Ekspektasi:
  - Tidak stabil untuk CI secara desain (jaringan nyata, kebijakan provider nyata, kuota, outage)
  - Menghabiskan uang / memakai rate limit
  - Lebih baik menjalankan subset yang dipersempit alih-alih “semuanya”
- Run live melakukan source `~/.profile` untuk mengambil API key yang hilang.
- Secara default, run live tetap mengisolasi `HOME` dan menyalin material config/auth ke home test sementara sehingga fixture unit tidak dapat memutasi `~/.openclaw` nyata Anda.
- Setel `OPENCLAW_LIVE_USE_REAL_HOME=1` hanya saat Anda sengaja membutuhkan test live untuk memakai direktori home nyata Anda.
- `pnpm test:live` sekarang default ke mode yang lebih senyap: ia mempertahankan output progres `[live] ...`, tetapi menekan pemberitahuan ekstra `~/.profile` dan membisukan log bootstrap gateway/obrolan Bonjour. Setel `OPENCLAW_LIVE_TEST_QUIET=0` jika Anda ingin log startup penuh kembali.
- Rotasi API key (spesifik-provider): setel `*_API_KEYS` dengan format koma/titik koma atau `*_API_KEY_1`, `*_API_KEY_2` (misalnya `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) atau override per-live melalui `OPENCLAW_LIVE_*_KEY`; test mencoba ulang pada respons rate limit.
- Output progres/heartbeat:
  - Suite live sekarang memancarkan baris progres ke stderr sehingga panggilan provider yang panjang terlihat aktif bahkan ketika capture console Vitest senyap.
  - `vitest.live.config.ts` menonaktifkan intersepsi console Vitest sehingga baris progres provider/gateway mengalir langsung selama run live.
  - Sesuaikan heartbeat model-langsung dengan `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Sesuaikan heartbeat gateway/probe dengan `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Suite mana yang harus saya jalankan?

Gunakan tabel keputusan ini:

- Logika/pengujian pengeditan: jalankan `pnpm test` (dan `pnpm test:coverage` jika Anda mengubah banyak hal)
- Menyentuh jaringan Gateway / protokol WS / penyandingan: tambahkan `pnpm test:e2e`
- Men-debug “bot saya sedang down” / kegagalan khusus penyedia / pemanggilan alat: jalankan `pnpm test:live` yang dipersempit

## Pengujian langsung (menyentuh jaringan)

Untuk matriks model langsung, smoke backend CLI, smoke ACP, harness server aplikasi Codex,
dan semua pengujian langsung penyedia media (Deepgram, BytePlus, ComfyUI, gambar,
musik, video, harness media) — ditambah penanganan kredensial untuk proses langsung — lihat
[Pengujian — rangkaian langsung](/id/help/testing-live).

## Runner Docker (pemeriksaan opsional "berfungsi di Linux")

Runner Docker ini terbagi menjadi dua kelompok:

- Runner model langsung: `test:docker:live-models` dan `test:docker:live-gateway` hanya menjalankan file langsung kunci profil yang cocok di dalam image Docker repo (`src/agents/models.profiles.live.test.ts` dan `src/gateway/gateway-models.profiles.live.test.ts`), dengan memasang direktori konfigurasi lokal dan workspace Anda (serta memuat `~/.profile` jika dipasang). Titik masuk lokal yang cocok adalah `test:live:models-profiles` dan `test:live:gateway-profiles`.
- Runner Docker langsung menggunakan batas smoke yang lebih kecil secara default agar sweep Docker penuh tetap praktis:
  `test:docker:live-models` default ke `OPENCLAW_LIVE_MAX_MODELS=12`, dan
  `test:docker:live-gateway` default ke `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, dan
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Timpa variabel env tersebut saat Anda
  secara eksplisit menginginkan pemindaian lengkap yang lebih besar.
- `test:docker:all` membangun image Docker langsung satu kali melalui `test:docker:live-build`, mengemas OpenClaw satu kali sebagai tarball npm melalui `scripts/package-openclaw-for-docker.mjs`, lalu membangun/menggunakan ulang dua image `scripts/e2e/Dockerfile`. Image bare hanyalah runner Node/Git untuk lane instalasi/pembaruan/dependensi Plugin; lane tersebut memasang tarball yang sudah dibangun. Image fungsional menginstal tarball yang sama ke `/app` untuk lane fungsionalitas aplikasi yang sudah dibangun. Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`; logika perencana berada di `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` mengeksekusi rencana yang dipilih. Agregat menggunakan scheduler lokal berbobot: `OPENCLAW_DOCKER_ALL_PARALLELISM` mengontrol slot proses, sementara batas sumber daya mencegah lane langsung berat, instalasi npm, dan multi-layanan dimulai sekaligus. Jika satu lane lebih berat daripada batas aktif, scheduler tetap dapat memulainya saat pool kosong lalu membiarkannya berjalan sendiri sampai kapasitas tersedia lagi. Default-nya adalah 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; sesuaikan `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` hanya saat host Docker memiliki ruang lebih. Runner melakukan preflight Docker secara default, menghapus container E2E OpenClaw yang kedaluwarsa, mencetak status setiap 30 detik, menyimpan waktu lane yang berhasil di `.artifacts/docker-tests/lane-timings.json`, dan menggunakan waktu tersebut untuk memulai lane yang lebih lama terlebih dahulu pada proses berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifes lane berbobot tanpa membangun atau menjalankan Docker, atau `node scripts/test-docker-all.mjs --plan-json` untuk mencetak rencana CI untuk lane yang dipilih, kebutuhan paket/image, dan kredensial.
- `Package Acceptance` adalah gate paket native GitHub untuk "apakah tarball yang dapat diinstal ini berfungsi sebagai produk?" Ini menyelesaikan satu paket kandidat dari `source=npm`, `source=ref`, `source=url`, atau `source=artifact`, mengunggahnya sebagai `package-under-test`, lalu menjalankan lane E2E Docker yang dapat digunakan ulang terhadap tarball persis tersebut alih-alih mengemas ulang ref yang dipilih. `workflow_ref` memilih skrip workflow/harness tepercaya, sementara `package_ref` memilih commit/branch/tag sumber untuk dikemas saat `source=ref`; ini memungkinkan logika penerimaan saat ini memvalidasi commit tepercaya yang lebih lama. Profil diurutkan berdasarkan cakupan: `smoke` adalah instalasi/channel/agent cepat ditambah gateway/konfigurasi, `package` adalah kontrak paket/pembaruan/Plugin ditambah fixture penyintas upgrade tanpa kunci, lane penyintas upgrade baseline yang dipublikasikan, dan pengganti native default untuk sebagian besar cakupan paket/pembaruan Parallels, `product` menambahkan channel MCP, pembersihan cron/subagent, pencarian web OpenAI, dan OpenWebUI, serta `full` menjalankan chunk Docker jalur rilis dengan OpenWebUI. Untuk `published-upgrade-survivor`, Package Acceptance selalu menggunakan `package-under-test` sebagai kandidat dan `published_upgrade_survivor_baseline` sebagai baseline terbitan fallback, dengan default `openclaw@latest`; tetapkan `published_upgrade_survivor_baselines=release-history` untuk melakukan shard lane ke seluruh matriks yang dideduplikasi dari enam rilis stabil terbaru, `2026.4.23`, dan rilis stabil terbaru sebelum `2026-03-15`. Lane terbitan mengonfigurasi baseline-nya dengan resep perintah `openclaw config set` bawaan, lalu mencatat langkah resep dalam ringkasan lane. Validasi rilis menjalankan delta paket khusus (`bundled-channel-deps-compat plugins-offline`) ditambah QA paket Telegram karena chunk Docker jalur rilis sudah mencakup lane paket/pembaruan/Plugin yang tumpang tindih. Perintah rerun Docker GitHub tertarget yang dihasilkan dari artefak mencakup artefak paket sebelumnya, input image yang sudah disiapkan, dan daftar baseline penyintas upgrade terbitan jika tersedia, sehingga lane yang gagal dapat menghindari pembangunan ulang paket dan image.
- Pemeriksaan build dan rilis menjalankan `scripts/check-cli-bootstrap-imports.mjs` setelah tsdown. Guard menelusuri grafik build statis dari `dist/entry.js` dan `dist/cli/run-main.js` dan gagal jika startup pra-dispatch mengimpor dependensi paket seperti Commander, UI prompt, undici, atau logging sebelum dispatch perintah; guard juga menjaga chunk proses Gateway yang dibundel tetap di bawah anggaran dan menolak impor statis jalur Gateway dingin yang diketahui. Smoke CLI terpaket juga mencakup bantuan root, bantuan onboard, bantuan doctor, status, skema konfigurasi, dan perintah daftar model.
- Kompatibilitas lama Package Acceptance dibatasi pada `2026.4.25` (termasuk `2026.4.25-beta.*`). Sampai batas tersebut, harness hanya menoleransi celah metadata paket terkirim: entri inventaris QA privat yang dihilangkan, `gateway install --wrapper` yang hilang, file patch yang hilang di fixture git turunan tarball, `update.channel` persisten yang hilang, lokasi catatan instalasi Plugin lama, persistensi catatan instalasi marketplace yang hilang, dan migrasi metadata konfigurasi selama `plugins update`. Untuk paket setelah `2026.4.25`, jalur tersebut menjadi kegagalan ketat.
- Runner smoke container: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, dan `test:docker:config-reload` menjalankan satu atau beberapa container nyata dan memverifikasi jalur integrasi tingkat lebih tinggi.

Runner Docker model langsung juga hanya melakukan bind-mount home autentikasi CLI yang diperlukan (atau semua yang didukung saat proses tidak dipersempit), lalu menyalinnya ke home container sebelum proses berjalan sehingga OAuth CLI eksternal dapat menyegarkan token tanpa mengubah penyimpanan autentikasi host:

- Model langsung: `pnpm test:docker:live-models` (skrip: `scripts/test-live-models-docker.sh`)
- Smoke test bind ACP: `pnpm test:docker:live-acp-bind` (skrip: `scripts/test-live-acp-bind-docker.sh`; mencakup Claude, Codex, dan Gemini secara default, dengan cakupan Droid/OpenCode yang ketat melalui `pnpm test:docker:live-acp-bind:droid` dan `pnpm test:docker:live-acp-bind:opencode`)
- Smoke test backend CLI: `pnpm test:docker:live-cli-backend` (skrip: `scripts/test-live-cli-backend-docker.sh`)
- Smoke test harness app-server Codex: `pnpm test:docker:live-codex-harness` (skrip: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agen dev: `pnpm test:docker:live-gateway` (skrip: `scripts/test-live-gateway-models-docker.sh`)
- Smoke test observabilitas: `pnpm qa:otel:smoke` adalah lane checkout sumber QA privat. Ini sengaja tidak menjadi bagian dari lane rilis Docker paket karena tarball npm menghilangkan QA Lab.
- Smoke test langsung Open WebUI: `pnpm test:docker:openwebui` (skrip: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, scaffolding penuh): `pnpm test:docker:onboard` (skrip: `scripts/e2e/onboard-docker.sh`)
- Smoke test onboarding/channel/agen tarball Npm: `pnpm test:docker:npm-onboard-channel-agent` memasang tarball OpenClaw yang dipaketkan secara global di Docker, mengonfigurasi OpenAI melalui onboarding env-ref plus Telegram secara default, memverifikasi doctor memperbaiki dependensi runtime plugin yang diaktifkan, dan menjalankan satu giliran agen OpenAI yang dimock. Gunakan kembali tarball yang sudah dibuat dengan `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati rebuild host dengan `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, atau ganti channel dengan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke test pergantian channel pembaruan: `pnpm test:docker:update-channel-switch` memasang tarball OpenClaw yang dipaketkan secara global di Docker, beralih dari paket `stable` ke git `dev`, memverifikasi channel yang dipersistenkan dan kerja plugin pascapembaruan, lalu beralih kembali ke paket `stable` dan memeriksa status pembaruan.
- Smoke test penyintas upgrade: `pnpm test:docker:upgrade-survivor` memasang tarball OpenClaw yang dipaketkan di atas fixture pengguna lama yang kotor dengan agen, konfigurasi channel, allowlist plugin, status dependensi runtime plugin yang usang, serta file workspace/sesi yang sudah ada. Ini menjalankan pembaruan paket plus doctor noninteraktif tanpa penyedia langsung atau kunci channel, lalu memulai Gateway loopback dan memeriksa pelestarian konfigurasi/status serta batas startup/status.
- Smoke test penyintas upgrade terpublikasi: `pnpm test:docker:published-upgrade-survivor` memasang `openclaw@latest` secara default, menanam file pengguna yang sudah ada secara realistis, mengonfigurasi baseline itu dengan resep perintah bawaan, memvalidasi konfigurasi yang dihasilkan, memperbarui instalasi terpublikasi itu ke tarball kandidat, menjalankan doctor noninteraktif, menulis `.artifacts/upgrade-survivor/summary.json`, lalu memulai Gateway loopback dan memeriksa intent yang dikonfigurasi, pelestarian status, startup, `/healthz`, `/readyz`, serta batas status RPC. Timpa satu baseline dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, minta penjadwal agregat memperluas baseline persis dengan `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, dan perluas fixture berbentuk isu dengan `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` seperti `reported-issues`; Package Acceptance mengeksposnya sebagai `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines`, dan `published_upgrade_survivor_scenarios`.
- Smoke test konteks runtime sesi: `pnpm test:docker:session-runtime-context` memverifikasi persistensi transkrip konteks runtime tersembunyi plus perbaikan doctor untuk cabang prompt-rewrite terduplikasi yang terdampak.
- Smoke test instalasi global Bun: `bash scripts/e2e/bun-global-install-smoke.sh` memaketkan pohon saat ini, memasangnya dengan `bun install -g` di home terisolasi, dan memverifikasi `openclaw infer image providers --json` mengembalikan penyedia gambar bawaan alih-alih hang. Gunakan kembali tarball yang sudah dibuat dengan `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati build host dengan `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, atau salin `dist/` dari image Docker yang sudah dibangun dengan `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke test Docker penginstal: `bash scripts/test-install-sh-docker.sh` berbagi satu cache npm di seluruh kontainer root, update, dan direct-npm. Smoke test pembaruan default ke npm `latest` sebagai baseline stabil sebelum upgrade ke tarball kandidat. Timpa dengan `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` secara lokal, atau dengan input `update_baseline_version` milik workflow Install Smoke di GitHub. Pemeriksaan penginstal non-root mempertahankan cache npm terisolasi agar entri cache milik root tidak menutupi perilaku instalasi lokal pengguna. Atur `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` untuk menggunakan kembali cache root/update/direct-npm di rerun lokal.
- CI Install Smoke melewati pembaruan global direct-npm duplikat dengan `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; jalankan skrip secara lokal tanpa env itu saat cakupan langsung `npm install -g` diperlukan.
- Smoke test CLI hapus workspace bersama agen: `pnpm test:docker:agents-delete-shared-workspace` (skrip: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) membangun image Dockerfile root secara default, menanam dua agen dengan satu workspace di home kontainer terisolasi, menjalankan `agents delete --json`, dan memverifikasi JSON valid plus perilaku workspace yang dipertahankan. Gunakan kembali image install-smoke dengan `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Jaringan Gateway (dua kontainer, autentikasi WS + health): `pnpm test:docker:gateway-network` (skrip: `scripts/e2e/gateway-network-docker.sh`)
- Smoke test snapshot Browser CDP: `pnpm test:docker:browser-cdp-snapshot` (skrip: `scripts/e2e/browser-cdp-snapshot-docker.sh`) membangun image E2E sumber plus lapisan Chromium, memulai Chromium dengan CDP mentah, menjalankan `browser doctor --deep`, dan memverifikasi snapshot peran CDP mencakup URL tautan, clickable yang dipromosikan kursor, ref iframe, dan metadata frame.
- Regresi penalaran minimal `web_search` OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (skrip: `scripts/e2e/openai-web-search-minimal-docker.sh`) menjalankan server OpenAI yang dimock melalui Gateway, memverifikasi `web_search` menaikkan `reasoning.effort` dari `minimal` ke `low`, lalu memaksa penolakan skema penyedia dan memeriksa detail mentah muncul di log Gateway.
- Bridge channel MCP (Gateway yang ditanam + bridge stdio + smoke test frame notifikasi Claude mentah): `pnpm test:docker:mcp-channels` (skrip: `scripts/e2e/mcp-channels-docker.sh`)
- Alat MCP bundel Pi (server MCP stdio nyata + smoke test allow/deny profil Pi tertanam): `pnpm test:docker:pi-bundle-mcp-tools` (skrip: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pembersihan MCP Cron/subagen (Gateway nyata + teardown child MCP stdio setelah cron terisolasi dan run subagen sekali jalan): `pnpm test:docker:cron-mcp-cleanup` (skrip: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (smoke test instalasi, instalasi/uninstal ClawHub kitchen-sink, pembaruan marketplace, dan pengaktifan/inspeksi bundel Claude): `pnpm test:docker:plugins` (skrip: `scripts/e2e/plugins-docker.sh`)
  Atur `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` untuk melewati blok ClawHub, atau timpa pasangan paket/runtime kitchen-sink default dengan `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` dan `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Tanpa `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, pengujian memakai server fixture ClawHub lokal hermetik.
- Smoke test pembaruan Plugin tanpa perubahan: `pnpm test:docker:plugin-update` (skrip: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke test metadata muat ulang konfigurasi: `pnpm test:docker:config-reload` (skrip: `scripts/e2e/config-reload-source-docker.sh`)
- Dependensi runtime plugin bawaan: `pnpm test:docker:bundled-channel-deps` membangun image runner Docker kecil secara default, membangun dan memaketkan OpenClaw sekali di host, lalu memasang tarball itu ke setiap skenario instalasi Linux. Gunakan kembali image dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`, lewati rebuild host setelah build lokal baru dengan `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, atau arahkan ke tarball yang sudah ada dengan `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Agregat Docker penuh dan chunk bundled-channel jalur rilis mem-pra-paketkan tarball ini sekali, lalu memecah pemeriksaan channel bawaan ke lane independen, termasuk lane pembaruan terpisah untuk Telegram, Discord, Slack, Feishu, memory-lancedb, dan ACPX. Chunk rilis memisahkan smoke test channel, target pembaruan, dan kontrak setup/runtime ke dalam `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b`, dan `bundled-channels-contracts`; chunk agregat `bundled-channels` tetap tersedia untuk rerun manual. Workflow rilis juga memisahkan chunk penginstal penyedia dan chunk install/uninstall plugin bawaan; chunk lama `package-update`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias agregat untuk rerun manual. Gunakan `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` untuk mempersempit matriks channel saat menjalankan lane bawaan secara langsung, atau `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` untuk mempersempit skenario pembaruan. Run Docker per skenario default ke `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; skenario pembaruan multi-target default ke `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. Lane ini juga memverifikasi bahwa `channels.<id>.enabled=false` dan `plugins.entries.<id>.enabled=false` menekan perbaikan dependensi doctor/runtime.
- Persempit dependensi runtime plugin bawaan saat iterasi dengan menonaktifkan skenario yang tidak terkait, misalnya:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Untuk pra-membangun dan menggunakan kembali image fungsional bersama secara manual:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Override image khusus suite seperti `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` tetap menang saat diatur. Saat `OPENCLAW_SKIP_DOCKER_BUILD=1` menunjuk ke image bersama jarak jauh, skrip menariknya jika belum ada secara lokal. Pengujian Docker QR dan penginstal mempertahankan Dockerfile masing-masing karena keduanya memvalidasi perilaku paket/instal alih-alih runtime aplikasi terbangun bersama.

Runner Docker live-model juga melakukan bind-mount checkout saat ini secara read-only dan
men-stage-nya ke workdir sementara di dalam container. Ini menjaga image runtime
tetap ramping sambil tetap menjalankan Vitest terhadap source/config lokal Anda yang persis.
Langkah staging melewati cache besar yang hanya lokal dan output build aplikasi seperti
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, serta direktori output `.build`
lokal aplikasi atau Gradle agar run live Docker tidak menghabiskan menit-menit untuk menyalin
artefak khusus mesin.
Runner tersebut juga menetapkan `OPENCLAW_SKIP_CHANNELS=1` agar probe live gateway tidak memulai
worker channel Telegram/Discord/dll. yang nyata di dalam container.
`test:docker:live-models` tetap menjalankan `pnpm test:live`, jadi teruskan juga
`OPENCLAW_LIVE_GATEWAY_*` saat Anda perlu mempersempit atau mengecualikan cakupan live
Gateway dari lane Docker tersebut.
`test:docker:openwebui` adalah smoke kompatibilitas tingkat lebih tinggi: ia memulai
container Gateway OpenClaw dengan endpoint HTTP yang kompatibel dengan OpenAI diaktifkan,
memulai container Open WebUI yang dipin terhadap Gateway tersebut, masuk melalui
Open WebUI, memverifikasi `/api/models` mengekspos `openclaw/default`, lalu mengirim
request chat nyata melalui proxy `/api/chat/completions` milik Open WebUI.
Run pertama bisa terasa jauh lebih lambat karena Docker mungkin perlu menarik image
Open WebUI dan Open WebUI mungkin perlu menyelesaikan penyiapan cold-start-nya sendiri.
Lane ini mengharapkan kunci model live yang dapat digunakan, dan `OPENCLAW_PROFILE_FILE`
(`~/.profile` secara default) adalah cara utama untuk menyediakannya dalam run Dockerized.
Run yang berhasil mencetak payload JSON kecil seperti `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` sengaja deterministik dan tidak memerlukan akun
Telegram, Discord, atau iMessage nyata. Ia mem-boot container Gateway yang sudah di-seed,
memulai container kedua yang menjalankan `openclaw mcp serve`, lalu memverifikasi
penemuan percakapan yang di-route, pembacaan transkrip, metadata lampiran,
perilaku antrean event live, routing pengiriman outbound, serta notifikasi channel +
izin gaya Claude melalui bridge MCP stdio nyata. Pemeriksaan notifikasi
menginspeksi frame MCP stdio mentah secara langsung sehingga smoke memvalidasi apa yang
benar-benar diemit oleh bridge, bukan hanya apa yang kebetulan diekspos oleh SDK client tertentu.
`test:docker:pi-bundle-mcp-tools` bersifat deterministik dan tidak memerlukan kunci model live.
Ia membangun image Docker repo, memulai server probe MCP stdio nyata
di dalam container, mewujudkan server tersebut melalui runtime MCP bundle Pi tertanam,
mengeksekusi tool, lalu memverifikasi `coding` dan `messaging` mempertahankan
tool `bundle-mcp` sementara `minimal` dan `tools.deny: ["bundle-mcp"]` memfilternya.
`test:docker:cron-mcp-cleanup` bersifat deterministik dan tidak memerlukan kunci model live.
Ia memulai Gateway yang sudah di-seed dengan server probe MCP stdio nyata, menjalankan
turn cron terisolasi dan turn child satu-kali `/subagents spawn`, lalu memverifikasi
proses child MCP keluar setelah setiap run.

Smoke thread ACP bahasa biasa manual (bukan CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Pertahankan skrip ini untuk workflow regresi/debug. Skrip ini mungkin dibutuhkan lagi untuk validasi routing thread ACP, jadi jangan hapus.

Env vars yang berguna:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) di-mount ke `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) di-mount ke `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (default: `~/.profile`) di-mount ke `/home/node/.profile` dan di-source sebelum menjalankan test
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` untuk memverifikasi hanya env vars yang di-source dari `OPENCLAW_PROFILE_FILE`, menggunakan direktori config/workspace sementara dan tanpa mount auth CLI eksternal
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) di-mount ke `/home/node/.npm-global` untuk instalasi CLI yang di-cache di dalam Docker
- Direktori/file auth CLI eksternal di bawah `$HOME` di-mount read-only di bawah `/host-auth...`, lalu disalin ke `/home/node/...` sebelum test dimulai
  - Direktori default: `.minimax`
  - File default: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Run provider yang dipersempit hanya me-mount direktori/file yang diperlukan, disimpulkan dari `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Override secara manual dengan `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, atau daftar koma seperti `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` untuk mempersempit run
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` untuk memfilter provider di dalam container
- `OPENCLAW_SKIP_DOCKER_BUILD=1` untuk menggunakan kembali image `openclaw:local-live` yang sudah ada untuk rerun yang tidak memerlukan rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memastikan kredensial berasal dari penyimpanan profil (bukan env)
- `OPENCLAW_OPENWEBUI_MODEL=...` untuk memilih model yang diekspos oleh gateway untuk smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` untuk meng-override prompt nonce-check yang digunakan oleh smoke Open WebUI
- `OPENWEBUI_IMAGE=...` untuk meng-override tag image Open WebUI yang dipin

## Sanity docs

Jalankan pemeriksaan docs setelah edit docs: `pnpm check:docs`.
Jalankan validasi anchor Mintlify penuh saat Anda juga membutuhkan pemeriksaan heading di dalam halaman: `pnpm docs:check-links:anchors`.

## Regresi offline (aman untuk CI)

Ini adalah regresi “pipeline nyata” tanpa provider nyata:

- Tool calling Gateway (mock OpenAI, gateway nyata + loop agent): `src/gateway/gateway.test.ts` (kasus: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, menulis config + auth diberlakukan): `src/gateway/gateway.test.ts` (kasus: "runs wizard over ws and writes auth token config")

## Eval reliabilitas agent (skills)

Kita sudah memiliki beberapa test aman untuk CI yang berperilaku seperti “eval reliabilitas agent”:

- Mock tool-calling melalui Gateway nyata + loop agent (`src/gateway/gateway.test.ts`).
- Alur wizard end-to-end yang memvalidasi wiring session dan efek config (`src/gateway/gateway.test.ts`).

Yang masih kurang untuk Skills (lihat [Skills](/id/tools/skills)):

- **Pengambilan keputusan:** ketika skills dicantumkan dalam prompt, apakah agent memilih skill yang tepat (atau menghindari yang tidak relevan)?
- **Kepatuhan:** apakah agent membaca `SKILL.md` sebelum digunakan dan mengikuti langkah/argumen yang diwajibkan?
- **Kontrak workflow:** skenario multi-turn yang menegaskan urutan tool, carryover riwayat session, dan batas sandbox.

Eval mendatang harus tetap deterministik terlebih dahulu:

- Runner skenario yang menggunakan provider mock untuk menegaskan tool calls + urutan, pembacaan file skill, dan wiring session.
- Suite kecil skenario berfokus skill (gunakan vs hindari, gating, prompt injection).
- Eval live opsional (opt-in, env-gated) hanya setelah suite aman untuk CI tersedia.

## Test kontrak (bentuk plugin dan channel)

Test kontrak memverifikasi bahwa setiap plugin dan channel terdaftar mematuhi
kontrak interface-nya. Test ini mengiterasi semua plugin yang ditemukan dan menjalankan suite
assertion bentuk dan perilaku. Lane unit default `pnpm test` sengaja
melewati file smoke dan seam bersama ini; jalankan perintah kontrak secara eksplisit
saat Anda menyentuh permukaan channel atau provider bersama.

### Perintah

- Semua kontrak: `pnpm test:contracts`
- Hanya kontrak channel: `pnpm test:contracts:channels`
- Hanya kontrak provider: `pnpm test:contracts:plugins`

### Kontrak channel

Berada di `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Bentuk plugin dasar (id, nama, capabilities)
- **setup** - Kontrak wizard penyiapan
- **session-binding** - Perilaku binding session
- **outbound-payload** - Struktur payload pesan
- **inbound** - Penanganan pesan inbound
- **actions** - Handler action channel
- **threading** - Penanganan ID thread
- **directory** - API directory/roster
- **group-policy** - Penerapan kebijakan grup

### Kontrak status provider

Berada di `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe status channel
- **registry** - Bentuk registry plugin

### Kontrak provider

Berada di `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrak alur auth
- **auth-choice** - Pilihan/seleksi auth
- **catalog** - API katalog model
- **discovery** - Penemuan plugin
- **loader** - Pemuatan plugin
- **runtime** - Runtime provider
- **shape** - Bentuk/interface plugin
- **wizard** - Wizard penyiapan

### Kapan menjalankan

- Setelah mengubah export atau subpath plugin-sdk
- Setelah menambahkan atau memodifikasi channel atau provider plugin
- Setelah melakukan refactor registrasi atau penemuan plugin

Test kontrak berjalan di CI dan tidak memerlukan kunci API nyata.

## Menambahkan regresi (panduan)

Saat Anda memperbaiki masalah provider/model yang ditemukan secara live:

- Tambahkan regresi aman untuk CI jika memungkinkan (provider mock/stub, atau tangkap transformasi request-shape yang persis)
- Jika secara inheren hanya live (rate limit, kebijakan auth), pertahankan test live sempit dan opt-in melalui env vars
- Lebih pilih menargetkan layer terkecil yang menangkap bug:
  - bug konversi/replay request provider → test model langsung
  - bug pipeline session/history/tool Gateway → smoke live Gateway atau test mock Gateway aman untuk CI
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` memperoleh satu target sampel per kelas SecretRef dari metadata registry (`listSecretTargetRegistryEntries()`), lalu menegaskan id exec segmen traversal ditolak.
  - Jika Anda menambahkan keluarga target SecretRef `includeInPlan` baru di `src/secrets/target-registry-data.ts`, perbarui `classifyTargetClass` dalam test tersebut. Test ini sengaja gagal pada id target yang tidak terklasifikasi agar kelas baru tidak dapat dilewati diam-diam.

## Terkait

- [Pengujian live](/id/help/testing-live)
- [CI](/id/ci)
