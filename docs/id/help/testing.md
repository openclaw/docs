---
read_when:
    - Menjalankan pengujian secara lokal atau di CI
    - Menambahkan uji regresi untuk bug model/penyedia
    - Men-debug perilaku Gateway + agen
summary: 'Kit pengujian: suite unit/e2e/live, runner Docker, dan cakupan setiap pengujian'
title: Pengujian
x-i18n:
    generated_at: "2026-04-30T09:54:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b506350f11431195cb55c84cb10e99efb5f43b934079528b982627024d1ffc
    source_path: help/testing.md
    workflow: 16
---

OpenClaw memiliki tiga suite Vitest (unit/integrasi, e2e, langsung) dan sejumlah kecil penjalan Docker. Dokumen ini adalah panduan "cara kami menguji":

- Apa yang dicakup setiap suite (dan apa yang sengaja _tidak_ dicakup).
- Perintah mana yang dijalankan untuk alur kerja umum (lokal, prapush, debugging).
- Cara pengujian langsung menemukan kredensial dan memilih model/penyedia.
- Cara menambahkan regresi untuk masalah model/penyedia dunia nyata.

<Note>
**Tumpukan QA (qa-lab, qa-channel, jalur transport langsung)** didokumentasikan secara terpisah:

- [Ikhtisar QA](/id/concepts/qa-e2e-automation) — arsitektur, permukaan perintah, penulisan skenario.
- [QA matriks](/id/concepts/qa-matrix) — referensi untuk `pnpm openclaw qa matrix`.
- [Kanal QA](/id/channels/qa-channel) — Plugin transport sintetis yang digunakan oleh skenario berbasis repo.

Halaman ini mencakup menjalankan suite pengujian reguler dan penjalan Docker/Parallels. Bagian penjalan khusus QA di bawah ([Penjalan khusus QA](#qa-specific-runners)) mencantumkan pemanggilan `qa` konkret dan merujuk kembali ke referensi di atas.
</Note>

## Mulai cepat

Hampir setiap hari:

- Gerbang penuh (diharapkan sebelum push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Jalankan suite penuh lokal lebih cepat pada mesin yang lapang: `pnpm test:max`
- Loop pengamatan Vitest langsung: `pnpm test:watch`
- Penargetan berkas langsung kini juga merutekan path ekstensi/kanal: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Utamakan menjalankan target spesifik terlebih dahulu saat Anda mengiterasi satu kegagalan.
- Situs QA berbasis Docker: `pnpm qa:lab:up`
- Jalur QA berbasis VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Saat Anda menyentuh pengujian atau menginginkan keyakinan tambahan:

- Gerbang cakupan: `pnpm test:coverage`
- Suite E2E: `pnpm test:e2e`

Saat men-debug penyedia/model nyata (memerlukan kredensial nyata):

- Suite langsung (model + probe alat/gambar Gateway): `pnpm test:live`
- Targetkan satu berkas langsung secara senyap: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Sapuan model langsung Docker: `pnpm test:docker:live-models`
  - Setiap model yang dipilih kini menjalankan satu giliran teks plus probe kecil bergaya pembacaan berkas.
    Model yang metadatanya mengiklankan input `image` juga menjalankan satu giliran gambar kecil.
    Nonaktifkan probe tambahan dengan `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` atau
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` saat mengisolasi kegagalan penyedia.
  - Cakupan CI: `OpenClaw Scheduled Live And E2E Checks` harian dan
    `OpenClaw Release Checks` manual sama-sama memanggil alur kerja langsung/E2E yang dapat dipakai ulang dengan
    `include_live_suites: true`, yang mencakup job matriks model langsung Docker terpisah
    yang dibagi berdasarkan penyedia.
  - Untuk menjalankan ulang CI yang terfokus, dispatch `OpenClaw Live And E2E Checks (Reusable)`
    dengan `include_live_suites: true` dan `live_models_only: true`.
  - Tambahkan rahasia penyedia bernilai sinyal tinggi baru ke `scripts/ci-hydrate-live-auth.sh`
    plus `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` dan pemanggil
    terjadwal/rilisnya.
- Smoke chat terikat Codex native: `pnpm test:docker:live-codex-bind`
  - Menjalankan jalur langsung Docker terhadap path server aplikasi Codex, mengikat DM
    Slack sintetis dengan `/codex bind`, menjalankan `/codex fast` dan
    `/codex permissions`, lalu memverifikasi balasan biasa dan lampiran gambar
    dirutekan melalui pengikatan Plugin native, bukan ACP.
- Smoke harness server aplikasi Codex: `pnpm test:docker:live-codex-harness`
  - Menjalankan giliran agen Gateway melalui harness server aplikasi Codex milik Plugin,
    memverifikasi `/codex status` dan `/codex models`, dan secara default menjalankan probe gambar,
    Cron MCP, subagen, dan Guardian. Nonaktifkan probe subagen dengan
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0` saat mengisolasi kegagalan server aplikasi Codex
    lainnya. Untuk pemeriksaan subagen yang terfokus, nonaktifkan probe lain:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Ini keluar setelah probe subagen kecuali
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` disetel.
- Smoke perintah penyelamatan Crestodian: `pnpm test:live:crestodian-rescue-channel`
  - Pemeriksaan ikut serta berlapis untuk permukaan perintah penyelamatan kanal pesan.
    Ini menjalankan `/crestodian status`, mengantre perubahan model persisten,
    membalas `/crestodian yes`, dan memverifikasi path tulis audit/konfigurasi.
- Smoke Docker perencana Crestodian: `pnpm test:docker:crestodian-planner`
  - Menjalankan Crestodian dalam kontainer tanpa konfigurasi dengan CLI Claude palsu di `PATH`
    dan memverifikasi fallback perencana fuzzy diterjemahkan menjadi penulisan konfigurasi bertipe
    yang diaudit.
- Smoke Docker pertama kali Crestodian: `pnpm test:docker:crestodian-first-run`
  - Memulai dari direktori state OpenClaw kosong, merutekan `openclaw` polos ke
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
Saat Anda hanya membutuhkan satu kasus gagal, utamakan mempersempit pengujian langsung melalui variabel lingkungan daftar izin yang dijelaskan di bawah.
</Tip>

## Penjalan khusus QA

Perintah ini berada di samping suite pengujian utama saat Anda membutuhkan realisme QA Lab:

CI menjalankan QA Lab dalam alur kerja khusus. `Parity gate` berjalan pada PR yang cocok dan
dari dispatch manual dengan penyedia mock. `QA-Lab - All Lanes` berjalan setiap malam di
`main` dan dari dispatch manual dengan gerbang paritas mock, jalur Matrix langsung,
jalur Telegram langsung yang dikelola Convex, dan jalur Discord langsung yang dikelola Convex sebagai
job paralel. QA terjadwal dan pemeriksaan rilis meneruskan Matrix `--profile fast`
secara eksplisit, sementara masukan default CLI Matrix dan alur kerja manual tetap
`all`; dispatch manual dapat membagi `all` menjadi job `transport`, `media`, `e2ee-smoke`,
`e2ee-deep`, dan `e2ee-cli`. `OpenClaw Release Checks` menjalankan paritas plus
jalur Matrix cepat dan Telegram sebelum persetujuan rilis, menggunakan
`mock-openai/gpt-5.5` untuk pemeriksaan transport rilis agar tetap deterministik
dan menghindari startup Plugin penyedia normal. Gateway transport langsung ini menonaktifkan
pencarian memori; perilaku memori tetap dicakup oleh suite paritas QA.

Shard media langsung rilis penuh menggunakan
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, yang sudah memiliki
`ffmpeg` dan `ffprobe`. Shard model/backend langsung Docker menggunakan image bersama
`ghcr.io/openclaw/openclaw-live-test:<sha>` yang dibangun sekali per commit yang dipilih,
lalu menariknya dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`, bukan membangun ulang
di dalam setiap shard.

- `pnpm openclaw qa suite`
  - Menjalankan skenario QA berbasis repo langsung di host.
  - Menjalankan beberapa skenario yang dipilih secara paralel secara default dengan worker
    Gateway terisolasi. `qa-channel` default ke konkurensi 4 (dibatasi oleh
    jumlah skenario yang dipilih). Gunakan `--concurrency <count>` untuk menyesuaikan jumlah worker,
    atau `--concurrency 1` untuk jalur serial lama.
  - Keluar bukan nol saat skenario apa pun gagal. Gunakan `--allow-failures` saat Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Mendukung mode penyedia `live-frontier`, `mock-openai`, dan `aimock`.
    `aimock` memulai server penyedia lokal berbasis AIMock untuk cakupan fixture eksperimental
    dan mock protokol tanpa menggantikan jalur `mock-openai` yang sadar skenario.
- `pnpm test:gateway:cpu-scenarios`
  - Menjalankan benchmark startup Gateway plus paket kecil skenario mock QA Lab
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) dan menulis ringkasan observasi CPU gabungan
    di bawah `.artifacts/gateway-cpu-scenarios/`.
  - Menandai hanya observasi CPU panas yang berkelanjutan secara default (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), sehingga lonjakan startup singkat dicatat sebagai metrik
    tanpa terlihat seperti regresi Gateway yang terpaku selama beberapa menit.
  - Menggunakan artefak `dist` yang telah dibangun; jalankan build terlebih dahulu saat checkout belum
    memiliki keluaran runtime yang segar.
- `pnpm openclaw qa suite --runner multipass`
  - Menjalankan suite QA yang sama di dalam VM Linux Multipass sekali pakai.
  - Mempertahankan perilaku pemilihan skenario yang sama seperti `qa suite` di host.
  - Menggunakan ulang flag pemilihan penyedia/model yang sama seperti `qa suite`.
  - Eksekusi langsung meneruskan masukan auth QA yang didukung dan praktis untuk tamu:
    kunci penyedia berbasis env, path konfigurasi penyedia langsung QA, dan `CODEX_HOME`
    jika ada.
  - Direktori keluaran harus tetap berada di bawah root repo agar tamu dapat menulis balik melalui
    workspace yang dipasang.
  - Menulis laporan + ringkasan QA normal plus log Multipass di bawah
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Memulai situs QA berbasis Docker untuk pekerjaan QA bergaya operator.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Membangun tarball npm dari checkout saat ini, menginstalnya secara global di
    Docker, menjalankan onboarding kunci API OpenAI noninteraktif, mengonfigurasi Telegram
    secara default, memverifikasi bahwa mengaktifkan Plugin menginstal dependensi runtime sesuai
    permintaan, menjalankan doctor, dan menjalankan satu giliran agen lokal terhadap endpoint OpenAI
    yang dimock.
  - Gunakan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` untuk menjalankan jalur instalasi paket yang sama
    dengan Discord.
- `pnpm test:docker:session-runtime-context`
  - Menjalankan smoke Docker aplikasi terbangun yang deterministik untuk transkrip konteks runtime
    tertanam. Ini memverifikasi konteks runtime OpenClaw tersembunyi dipersistenkan sebagai
    pesan kustom non-tampilan, bukan bocor ke giliran pengguna yang terlihat,
    lalu menyemai JSONL sesi rusak yang terdampak dan memverifikasi
    `openclaw doctor --fix` menulis ulangnya ke cabang aktif dengan cadangan.
- `pnpm test:docker:npm-telegram-live`
  - Menginstal kandidat paket OpenClaw di Docker, menjalankan onboarding paket terinstal,
    mengonfigurasi Telegram melalui CLI terinstal, lalu menggunakan ulang jalur QA Telegram
    langsung dengan paket terinstal itu sebagai Gateway SUT.
  - Default ke `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; setel
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` atau
    `OPENCLAW_CURRENT_PACKAGE_TGZ` untuk menguji tarball lokal yang telah di-resolve, bukan
    menginstal dari registry.
  - Menggunakan kredensial env Telegram yang sama atau sumber kredensial Convex seperti
    `pnpm openclaw qa telegram`. Untuk otomatisasi CI/rilis, setel
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` dan rahasia peran. Jika
    `OPENCLAW_QA_CONVEX_SITE_URL` dan rahasia peran Convex ada di CI,
    pembungkus Docker memilih Convex secara otomatis.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` menggantikan
    `OPENCLAW_QA_CREDENTIAL_ROLE` bersama hanya untuk jalur ini.
  - GitHub Actions mengekspos jalur ini sebagai alur kerja maintainer manual
    `NPM Telegram Beta E2E`. Ini tidak berjalan saat merge. Alur kerja menggunakan
    lingkungan `qa-live-shared` dan lease kredensial CI Convex.
- GitHub Actions juga mengekspos `Package Acceptance` untuk bukti produk sampingan
  terhadap satu paket kandidat. Ini menerima ref tepercaya, spec npm terpublikasi,
  URL tarball HTTPS plus SHA-256, atau artefak tarball dari run lain, mengunggah
  `openclaw-current.tgz` yang dinormalisasi sebagai `package-under-test`, lalu menjalankan
  penjadwal E2E Docker yang ada dengan profil jalur smoke, package, product, full, atau custom.
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

- Bukti artefak mengunduh artefak tarball dari run Actions lain:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Mengemas dan menginstal build OpenClaw saat ini di Docker, memulai Gateway
    dengan OpenAI yang dikonfigurasi, lalu mengaktifkan channel/Plugin bawaan melalui edit
    konfigurasi.
  - Memverifikasi bahwa penemuan penyiapan membiarkan dependensi runtime Plugin
    yang belum dikonfigurasi tetap tidak ada, run Gateway atau doctor pertama yang
    dikonfigurasi menginstal dependensi runtime setiap Plugin bawaan sesuai kebutuhan,
    dan restart kedua tidak menginstal ulang dependensi yang sudah diaktifkan.
  - Juga menginstal baseline npm lama yang diketahui, mengaktifkan Telegram sebelum menjalankan
    `openclaw update --tag <candidate>`, dan memverifikasi bahwa doctor pasca-pembaruan
    kandidat memperbaiki dependensi runtime channel bawaan tanpa perbaikan postinstall
    dari sisi harness.
- `pnpm test:parallels:npm-update`
  - Menjalankan smoke pembaruan instalasi terpaket native di seluruh tamu Parallels. Setiap
    platform yang dipilih pertama-tama menginstal paket baseline yang diminta, lalu menjalankan
    perintah `openclaw update` yang terinstal di tamu yang sama dan memverifikasi
    versi yang terinstal, status pembaruan, kesiapan gateway, dan satu giliran agen
    lokal.
  - Gunakan `--platform macos`, `--platform windows`, atau `--platform linux` saat
    mengiterasi satu tamu. Gunakan `--json` untuk jalur artefak ringkasan dan
    status per-lane.
  - Lane OpenAI menggunakan `openai/gpt-5.5` untuk bukti giliran agen live secara
    default. Berikan `--model <provider/model>` atau setel
    `OPENCLAW_PARALLELS_OPENAI_MODEL` saat sengaja memvalidasi model OpenAI lain.
  - Bungkus run lokal yang panjang dalam timeout host agar macet transport Parallels tidak
    menghabiskan sisa jendela pengujian:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Skrip menulis log lane bersarang di bawah `/tmp/openclaw-parallels-npm-update.*`.
    Periksa `windows-update.log`, `macos-update.log`, atau `linux-update.log`
    sebelum menganggap wrapper luar macet.
  - Pembaruan Windows dapat menghabiskan 10 hingga 15 menit dalam perbaikan dependensi
    doctor/runtime pasca-pembaruan pada tamu dingin; itu masih sehat saat log debug
    npm bersarang terus bergerak.
  - Jangan jalankan wrapper agregat ini secara paralel dengan lane smoke Parallels
    macOS, Windows, atau Linux individual. Mereka berbagi status VM dan dapat bertabrakan pada
    pemulihan snapshot, penyajian paket, atau status gateway tamu.
  - Bukti pasca-pembaruan menjalankan permukaan Plugin bawaan normal karena
    facade kapabilitas seperti speech, pembuatan gambar, dan pemahaman media
    dimuat melalui API runtime bawaan meskipun giliran agen itu sendiri hanya
    memeriksa respons teks sederhana.

- `pnpm openclaw qa aimock`
  - Hanya memulai server penyedia AIMock lokal untuk pengujian smoke protokol
    langsung.
- `pnpm openclaw qa matrix`
  - Menjalankan lane QA live Matrix terhadap homeserver Tuwunel sekali pakai yang didukung Docker. Hanya checkout sumber — instalasi terpaket tidak mengirimkan `qa-lab`.
  - CLI lengkap, katalog profil/skenario, variabel env, dan tata letak artefak: [QA Matrix](/id/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Menjalankan lane QA live Telegram terhadap grup privat nyata menggunakan token bot driver dan SUT dari env.
  - Memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. ID grup harus berupa ID obrolan Telegram numerik.
  - Mendukung `--credential-source convex` untuk kredensial pool bersama. Gunakan mode env secara default, atau setel `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` untuk ikut memakai lease pool.
  - Keluar non-nol saat skenario apa pun gagal. Gunakan `--allow-failures` saat Anda
    menginginkan artefak tanpa kode keluar gagal.
  - Memerlukan dua bot berbeda dalam grup privat yang sama, dengan bot SUT mengekspos nama pengguna Telegram.
  - Untuk observasi bot-ke-bot yang stabil, aktifkan Mode Komunikasi Bot-ke-Bot di `@BotFather` untuk kedua bot dan pastikan bot driver dapat mengamati lalu lintas bot grup.
  - Menulis laporan QA Telegram, ringkasan, dan artefak pesan-teramati di bawah `.artifacts/qa-e2e/...`. Skenario balasan mencakup RTT dari permintaan kirim driver hingga balasan SUT yang teramati.

Lane transport live berbagi satu kontrak standar agar transport baru tidak menyimpang; matriks cakupan per-lane berada di [ikhtisar QA → Cakupan transport live](/id/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` adalah suite sintetis luas dan bukan bagian dari matriks itu.

### Kredensial Telegram bersama melalui Convex (v1)

Saat `--credential-source convex` (atau `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) diaktifkan untuk
`openclaw qa telegram`, lab QA memperoleh lease eksklusif dari pool yang didukung Convex, mengirim Heartbeat
untuk lease itu selama lane berjalan, dan merilis lease saat shutdown.

Scaffold proyek Convex referensi:

- `qa/convex-credential-broker/`

Variabel env wajib:

- `OPENCLAW_QA_CONVEX_SITE_URL` (misalnya `https://your-deployment.convex.site`)
- Satu secret untuk peran yang dipilih:
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
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` mengizinkan URL Convex loopback `http://` untuk pengembangan khusus lokal.

`OPENCLAW_QA_CONVEX_SITE_URL` sebaiknya menggunakan `https://` dalam operasi normal.

Perintah admin maintainer (pool tambah/hapus/daftar) secara khusus memerlukan
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helper CLI untuk maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Gunakan `doctor` sebelum run live untuk memeriksa URL situs Convex, secret broker,
prefiks endpoint, timeout HTTP, dan keterjangkauan admin/daftar tanpa mencetak
nilai secret. Gunakan `--json` untuk output yang dapat dibaca mesin dalam skrip dan
utilitas CI.

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
  - Pelindung lease aktif: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (hanya secret maintainer)
  - Permintaan: `{ kind?, status?, includePayload?, limit? }`
  - Berhasil: `{ status: "ok", credentials, count }`

Bentuk payload untuk jenis Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` harus berupa string ID obrolan Telegram numerik.
- `admin/add` memvalidasi bentuk ini untuk `kind: "telegram"` dan menolak payload yang salah bentuk.

### Menambahkan channel ke QA

Nama arsitektur dan helper skenario untuk adaptor channel baru berada di [ikhtisar QA → Menambahkan channel](/id/concepts/qa-e2e-automation#adding-a-channel). Ambang minimum: implementasikan runner transport pada seam host `qa-lab` bersama, deklarasikan `qaRunners` dalam manifes Plugin, pasang sebagai `openclaw qa <runner>`, dan tulis skenario di bawah `qa/scenarios/`.

## Suite pengujian (apa yang berjalan di mana)

Pikirkan suite sebagai “realisme yang meningkat” (dan flakiness/biaya yang meningkat):

### Unit / integrasi (default)

- Perintah: `pnpm test`
- Konfigurasi: run tanpa target menggunakan set shard `vitest.full-*.config.ts` dan dapat memperluas shard multi-proyek menjadi konfigurasi per-proyek untuk penjadwalan paralel
- File: inventaris core/unit di bawah `src/**/*.test.ts`, `packages/**/*.test.ts`, dan `test/**/*.test.ts`; pengujian unit UI berjalan di shard khusus `unit-ui`
- Cakupan:
  - Pengujian unit murni
  - Pengujian integrasi dalam-proses (autentikasi gateway, routing, tooling, parsing, konfigurasi)
  - Regresi deterministik untuk bug yang diketahui
- Ekspektasi:
  - Berjalan di CI
  - Tidak memerlukan key nyata
  - Harus cepat dan stabil
  - Pengujian resolver dan loader permukaan publik harus membuktikan perilaku fallback `api.js` dan
    `runtime-api.js` yang luas dengan fixture Plugin kecil yang dihasilkan, bukan
    API sumber Plugin bawaan nyata. Load API Plugin nyata berada dalam
    suite kontrak/integrasi milik Plugin.

<AccordionGroup>
  <Accordion title="Projects, shards, and scoped lanes">

    - `pnpm test` tanpa target menjalankan dua belas konfigurasi shard yang lebih kecil (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) alih-alih satu proses root-project native yang sangat besar. Ini memangkas puncak RSS pada mesin berbeban dan mencegah pekerjaan auto-reply/ekstensi membuat suite yang tidak terkait kekurangan sumber daya.
    - `pnpm test --watch` tetap menggunakan grafik proyek native root `vitest.config.ts`, karena loop watch multi-shard tidak praktis.
    - `pnpm test`, `pnpm test:watch`, dan `pnpm test:perf:imports` merutekan target file/direktori eksplisit melalui lane berscope terlebih dahulu, sehingga `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` menghindari biaya startup proyek root penuh.
    - `pnpm test:changed` memperluas path git yang berubah menjadi lane berscope murah secara default: edit pengujian langsung, file sibling `*.test.ts`, pemetaan sumber eksplisit, dan dependen grafik impor lokal. Edit config/setup/package tidak menjalankan pengujian luas kecuali Anda secara eksplisit menggunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` adalah gate pemeriksaan lokal cerdas normal untuk pekerjaan sempit. Ini mengklasifikasikan diff ke core, pengujian core, ekstensi, pengujian ekstensi, app, dokumentasi, metadata rilis, tooling Docker live, dan tooling, lalu menjalankan typecheck, lint, dan perintah guard yang sesuai. Ini tidak menjalankan pengujian Vitest; panggil `pnpm test:changed` atau `pnpm test <target>` eksplisit untuk bukti pengujian. Kenaikan versi khusus metadata rilis menjalankan pemeriksaan versi/config/dependensi-root tertarget, dengan guard yang menolak perubahan package di luar field versi tingkat atas.
    - Edit harness ACP Docker live menjalankan pemeriksaan terfokus: sintaks shell untuk skrip auth Docker live dan dry-run scheduler Docker live. Perubahan `package.json` hanya disertakan ketika diff terbatas pada `scripts["test:docker:live-*"]`; edit dependensi, export, versi, dan permukaan package lain tetap menggunakan guard yang lebih luas.
    - Pengujian unit ringan-impor dari agents, commands, plugins, helper auto-reply, `plugin-sdk`, dan area utilitas murni serupa dirutekan melalui lane `unit-fast`, yang melewati `test/setup-openclaw-runtime.ts`; file yang stateful/berat-runtime tetap pada lane yang ada.
    - File sumber helper `plugin-sdk` dan `commands` terpilih juga memetakan run mode berubah ke pengujian sibling eksplisit di lane ringan tersebut, sehingga edit helper menghindari menjalankan ulang seluruh suite berat untuk direktori itu.
    - `auto-reply` memiliki bucket khusus untuk helper core tingkat atas, pengujian integrasi `reply.*` tingkat atas, dan subtree `src/auto-reply/reply/**`. CI memecah lagi subtree reply menjadi shard agent-runner, dispatch, dan commands/state-routing sehingga satu bucket berat-impor tidak menguasai seluruh ekor Node.
    - CI PR/main normal sengaja melewati sweep batch ekstensi dan shard `agentic-plugins` khusus rilis. Validasi Rilis Penuh menjalankan workflow turunan `Plugin Prerelease` terpisah untuk suite berat Plugin/ekstensi tersebut pada kandidat rilis.

  </Accordion>

  <Accordion title="Cakupan runner tertanam">

    - Saat Anda mengubah input discovery message-tool atau konteks runtime compaction, pertahankan kedua tingkat cakupan.
    - Tambahkan regresi helper terfokus untuk batas routing dan normalisasi murni.
    - Jaga suite integrasi runner tertanam tetap sehat:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts`, dan
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Suite tersebut memverifikasi bahwa id berscope dan perilaku compaction tetap mengalir melalui path `run.ts` / `compact.ts` nyata; pengujian khusus helper bukan pengganti yang memadai untuk path integrasi tersebut.

  </Accordion>

  <Accordion title="Default pool dan isolasi Vitest">

    - Config Vitest dasar default ke `threads`.
    - Config Vitest bersama menetapkan `isolate: false` dan menggunakan runner non-terisolasi di seluruh proyek root, e2e, dan config live.
    - Lane UI root mempertahankan setup dan optimizer `jsdom` miliknya, tetapi juga berjalan pada runner non-terisolasi bersama.
    - Setiap shard `pnpm test` mewarisi default `threads` + `isolate: false` yang sama dari config Vitest bersama.
    - `scripts/run-vitest.mjs` menambahkan `--no-maglev` untuk proses Node turunan Vitest secara default untuk mengurangi churn kompilasi V8 selama run lokal besar. Setel `OPENCLAW_VITEST_ENABLE_MAGLEV=1` untuk membandingkan dengan perilaku V8 bawaan.

  </Accordion>

  <Accordion title="Iterasi lokal cepat">

    - `pnpm changed:lanes` menampilkan lane arsitektural mana yang dipicu oleh diff.
    - Hook pre-commit hanya untuk pemformatan. Hook ini melakukan stage ulang file yang diformat dan tidak menjalankan lint, typecheck, atau pengujian.
    - Jalankan `pnpm check:changed` secara eksplisit sebelum handoff atau push ketika Anda membutuhkan gate pemeriksaan lokal cerdas.
    - `pnpm test:changed` dirutekan melalui lane berscope murah secara default. Gunakan `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` hanya ketika agent memutuskan bahwa edit harness, config, package, atau kontrak benar-benar membutuhkan cakupan Vitest yang lebih luas.
    - `pnpm test:max` dan `pnpm test:changed:max` mempertahankan perilaku routing yang sama, hanya dengan batas worker yang lebih tinggi.
    - Auto-scaling worker lokal sengaja konservatif dan mengurangi beban ketika rata-rata beban host sudah tinggi, sehingga beberapa run Vitest bersamaan secara default menimbulkan dampak yang lebih kecil.
    - Config Vitest dasar menandai proyek/file config sebagai `forceRerunTriggers` sehingga rerun mode berubah tetap benar ketika wiring pengujian berubah.
    - Config menjaga `OPENCLAW_VITEST_FS_MODULE_CACHE` tetap aktif pada host yang didukung; setel `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` jika Anda menginginkan satu lokasi cache eksplisit untuk profiling langsung.

  </Accordion>

  <Accordion title="Debugging performa">

    - `pnpm test:perf:imports` mengaktifkan pelaporan durasi impor Vitest plus output rincian impor.
    - `pnpm test:perf:imports:changed` membatasi tampilan profiling yang sama ke file yang berubah sejak `origin/main`.
    - Data waktu shard ditulis ke `.artifacts/vitest-shard-timings.json`. Run seluruh config menggunakan path config sebagai key; shard CI include-pattern menambahkan nama shard sehingga shard terfilter dapat dilacak secara terpisah.
    - Ketika satu pengujian panas masih menghabiskan sebagian besar waktunya pada impor startup, simpan dependensi berat di balik seam `*.runtime.ts` lokal yang sempit dan mock seam itu secara langsung alih-alih melakukan deep-import helper runtime hanya untuk meneruskannya melalui `vi.mock(...)`.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` membandingkan `test:changed` yang dirutekan dengan path root-project native untuk diff yang sudah dikomit tersebut dan mencetak wall time plus RSS maksimum macOS.
    - `pnpm test:perf:changed:bench -- --worktree` melakukan benchmark pada tree kotor saat ini dengan merutekan daftar file yang berubah melalui `scripts/test-projects.mjs` dan config Vitest root.
    - `pnpm test:perf:profile:main` menulis profil CPU main-thread untuk overhead startup dan transform Vitest/Vite.
    - `pnpm test:perf:profile:runner` menulis profil CPU+heap runner untuk suite unit dengan paralelisme file dinonaktifkan.

  </Accordion>
</AccordionGroup>

### Stabilitas (Gateway)

- Perintah: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, dipaksa ke satu worker
- Scope:
  - Memulai Gateway loopback nyata dengan diagnostik aktif secara default
  - Mendorong churn pesan Gateway sintetis, memori, dan payload besar melalui path event diagnostik
  - Mengkueri `diagnostics.stability` melalui RPC WS Gateway
  - Mencakup helper persistensi bundel stabilitas diagnostik
  - Menegaskan recorder tetap berbatas, sampel RSS sintetis tetap di bawah anggaran tekanan, dan kedalaman antrean per sesi terkuras kembali ke nol
- Ekspektasi:
  - Aman untuk CI dan tanpa key
  - Lane sempit untuk tindak lanjut regresi stabilitas, bukan pengganti suite Gateway penuh

### E2E (smoke Gateway)

- Perintah: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- File: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`, dan pengujian E2E bundled-plugin di bawah `extensions/`
- Default runtime:
  - Menggunakan `threads` Vitest dengan `isolate: false`, sesuai dengan bagian repo lainnya.
  - Menggunakan worker adaptif (CI: hingga 2, lokal: default 1).
  - Berjalan dalam mode senyap secara default untuk mengurangi overhead I/O konsol.
- Override yang berguna:
  - `OPENCLAW_E2E_WORKERS=<n>` untuk memaksa jumlah worker (dibatasi pada 16).
  - `OPENCLAW_E2E_VERBOSE=1` untuk mengaktifkan ulang output konsol verbose.
- Scope:
  - Perilaku end-to-end gateway multi-instans
  - Permukaan WebSocket/HTTP, pairing node, dan jaringan yang lebih berat
- Ekspektasi:
  - Berjalan di CI (ketika diaktifkan dalam pipeline)
  - Tidak memerlukan key nyata
  - Lebih banyak komponen bergerak daripada pengujian unit (bisa lebih lambat)

### E2E: smoke backend OpenShell

- Perintah: `pnpm test:e2e:openshell`
- File: `extensions/openshell/src/backend.e2e.test.ts`
- Scope:
  - Memulai gateway OpenShell terisolasi pada host melalui Docker
  - Membuat sandbox dari Dockerfile lokal sementara
  - Menguji backend OpenShell OpenClaw melalui `sandbox ssh-config` nyata + exec SSH
  - Memverifikasi perilaku filesystem remote-canonical melalui bridge fs sandbox
- Ekspektasi:
  - Hanya opt-in; bukan bagian dari run default `pnpm test:e2e`
  - Memerlukan CLI `openshell` lokal plus daemon Docker yang berfungsi
  - Menggunakan `HOME` / `XDG_CONFIG_HOME` terisolasi, lalu menghancurkan gateway dan sandbox pengujian
- Override yang berguna:
  - `OPENCLAW_E2E_OPENSHELL=1` untuk mengaktifkan pengujian ketika menjalankan suite e2e yang lebih luas secara manual
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` untuk menunjuk ke biner CLI non-default atau skrip wrapper

### Live (provider nyata + model nyata)

- Perintah: `pnpm test:live`
- Config: `vitest.live.config.ts`
- File: `src/**/*.live.test.ts`, `test/**/*.live.test.ts`, dan pengujian live bundled-plugin di bawah `extensions/`
- Default: **aktif** oleh `pnpm test:live` (menetapkan `OPENCLAW_LIVE_TEST=1`)
- Scope:
  - “Apakah provider/model ini benar-benar berfungsi _hari ini_ dengan kredensial nyata?”
  - Menangkap perubahan format provider, keunikan tool-calling, masalah auth, dan perilaku batas rate
- Ekspektasi:
  - Secara desain tidak stabil untuk CI (jaringan nyata, kebijakan provider nyata, kuota, outage)
  - Menghabiskan uang / menggunakan batas rate
  - Lebih baik menjalankan subset yang dipersempit daripada “semuanya”
- Run live mengambil sumber `~/.profile` untuk mengambil API key yang hilang.
- Secara default, run live tetap mengisolasi `HOME` dan menyalin material config/auth ke home pengujian sementara sehingga fixture unit tidak dapat mengubah `~/.openclaw` nyata Anda.
- Setel `OPENCLAW_LIVE_USE_REAL_HOME=1` hanya ketika Anda secara sengaja memerlukan pengujian live untuk menggunakan direktori home nyata Anda.
- `pnpm test:live` sekarang default ke mode yang lebih senyap: mode ini mempertahankan output progres `[live] ...`, tetapi menekan pemberitahuan ekstra `~/.profile` dan membisukan log bootstrap gateway/obrolan Bonjour. Setel `OPENCLAW_LIVE_TEST_QUIET=0` jika Anda ingin log startup penuh kembali.
- Rotasi API key (khusus provider): setel `*_API_KEYS` dengan format koma/titik koma atau `*_API_KEY_1`, `*_API_KEY_2` (misalnya `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) atau override per-live melalui `OPENCLAW_LIVE_*_KEY`; pengujian mencoba ulang pada respons batas rate.
- Output progres/heartbeat:
  - Suite live sekarang memancarkan baris progres ke stderr sehingga panggilan provider yang panjang terlihat aktif bahkan ketika capture konsol Vitest senyap.
  - `vitest.live.config.ts` menonaktifkan intersepsi konsol Vitest sehingga baris progres provider/gateway mengalir langsung selama run live.
  - Setel heartbeat direct-model dengan `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Setel heartbeat gateway/probe dengan `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Suite mana yang harus saya jalankan?

Gunakan tabel keputusan ini:

- Logika/pengujian penyuntingan: jalankan `pnpm test` (dan `pnpm test:coverage` jika Anda mengubah banyak hal)
- Menyentuh jaringan Gateway / protokol WS / pemasangan: tambahkan `pnpm test:e2e`
- Men-debug “bot saya mati” / kegagalan khusus penyedia / pemanggilan alat: jalankan `pnpm test:live` yang dipersempit

## Pengujian langsung (menyentuh jaringan)

Untuk matriks model langsung, smoke backend CLI, smoke ACP, harness server aplikasi Codex, dan semua pengujian langsung penyedia media (Deepgram, BytePlus, ComfyUI, gambar, musik, video, harness media) — plus penanganan kredensial untuk run langsung — lihat [Pengujian — suite langsung](/id/help/testing-live).

## Runner Docker (pemeriksaan opsional "berjalan di Linux")

Runner Docker ini terbagi menjadi dua kelompok:

- Runner model langsung: `test:docker:live-models` dan `test:docker:live-gateway` hanya menjalankan file langsung kunci profil yang cocok di dalam image Docker repo (`src/agents/models.profiles.live.test.ts` dan `src/gateway/gateway-models.profiles.live.test.ts`), dengan me-mount direktori konfigurasi lokal dan workspace Anda (serta mengambil sumber `~/.profile` jika di-mount). Entry point lokal yang cocok adalah `test:live:models-profiles` dan `test:live:gateway-profiles`.
- Runner langsung Docker secara default memakai batas smoke yang lebih kecil agar sweep Docker penuh tetap praktis:
  `test:docker:live-models` default ke `OPENCLAW_LIVE_MAX_MODELS=12`, dan
  `test:docker:live-gateway` default ke `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000`, dan
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Timpa variabel env tersebut saat Anda
  secara eksplisit menginginkan pemindaian menyeluruh yang lebih besar.
- `test:docker:all` membangun image Docker langsung sekali melalui `test:docker:live-build`, mengemas OpenClaw sekali sebagai tarball npm lewat `scripts/package-openclaw-for-docker.mjs`, lalu membangun/menggunakan ulang dua image `scripts/e2e/Dockerfile`. Image polos hanya runner Node/Git untuk lane install/update/dependensi Plugin; lane tersebut me-mount tarball yang sudah dibangun. Image fungsional menginstal tarball yang sama ke `/app` untuk lane fungsionalitas aplikasi yang sudah dibangun. Definisi lane Docker berada di `scripts/lib/docker-e2e-scenarios.mjs`; logika perencana berada di `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` mengeksekusi rencana yang dipilih. Agregat memakai penjadwal lokal berbobot: `OPENCLAW_DOCKER_ALL_PARALLELISM` mengontrol slot proses, sedangkan batas sumber daya mencegah lane langsung berat, install npm, dan multi-layanan mulai sekaligus. Jika satu lane lebih berat daripada batas aktif, penjadwal tetap dapat memulainya saat pool kosong lalu membiarkannya berjalan sendiri sampai kapasitas tersedia lagi. Default-nya 10 slot, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10`, dan `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; setel `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` atau `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` hanya saat host Docker memiliki ruang kapasitas lebih besar. Runner melakukan preflight Docker secara default, menghapus kontainer E2E OpenClaw yang usang, mencetak status setiap 30 detik, menyimpan timing lane yang berhasil di `.artifacts/docker-tests/lane-timings.json`, dan memakai timing tersebut untuk memulai lane yang lebih lama terlebih dahulu pada run berikutnya. Gunakan `OPENCLAW_DOCKER_ALL_DRY_RUN=1` untuk mencetak manifes lane berbobot tanpa membangun atau menjalankan Docker, atau `node scripts/test-docker-all.mjs --plan-json` untuk mencetak rencana CI bagi lane yang dipilih, kebutuhan paket/image, dan kredensial.
- `Package Acceptance` adalah gate paket native GitHub untuk "apakah tarball yang dapat diinstal ini berfungsi sebagai produk?" Gate ini menyelesaikan satu paket kandidat dari `source=npm`, `source=ref`, `source=url`, atau `source=artifact`, mengunggahnya sebagai `package-under-test`, lalu menjalankan lane E2E Docker reusable terhadap tarball persis tersebut alih-alih mengemas ulang ref yang dipilih. `workflow_ref` memilih workflow/skrip harness tepercaya, sedangkan `package_ref` memilih commit/branch/tag sumber untuk dikemas saat `source=ref`; ini memungkinkan logika acceptance saat ini memvalidasi commit tepercaya yang lebih lama. Profil diurutkan berdasarkan cakupan: `smoke` adalah install/channel/agent cepat plus gateway/config, `package` adalah kontrak package/update/Plugin dan pengganti native default untuk sebagian besar cakupan paket/update Parallels, `product` menambahkan channel MCP, pembersihan cron/subagen, pencarian web OpenAI, dan OpenWebUI, serta `full` menjalankan potongan Docker jalur rilis dengan OpenWebUI. Validasi rilis menjalankan delta paket kustom (`bundled-channel-deps-compat plugins-offline`) plus QA paket Telegram karena potongan Docker jalur rilis sudah mencakup lane package/update/Plugin yang tumpang tindih. Perintah rerun Docker GitHub tertarget yang dihasilkan dari artefak menyertakan artefak paket sebelumnya dan input image yang telah disiapkan bila tersedia, sehingga lane yang gagal dapat menghindari pembangunan ulang paket dan image.
- Pemeriksaan build dan rilis menjalankan `scripts/check-cli-bootstrap-imports.mjs` setelah tsdown. Guard menelusuri grafik build statis dari `dist/entry.js` dan `dist/cli/run-main.js` dan gagal jika startup pra-dispatch mengimpor dependensi paket seperti Commander, UI prompt, undici, atau logging sebelum dispatch perintah; guard juga menjaga chunk run Gateway yang dibundel tetap di bawah anggaran dan menolak impor statis jalur Gateway dingin yang diketahui. Smoke CLI terpaket juga mencakup bantuan root, bantuan onboard, bantuan doctor, status, skema konfigurasi, dan perintah daftar model.
- Kompatibilitas lama Package Acceptance dibatasi pada `2026.4.25` (termasuk `2026.4.25-beta.*`). Sampai batas tersebut, harness hanya menoleransi celah metadata paket yang sudah dikirim: entri inventaris QA privat yang dihilangkan, `gateway install --wrapper` yang hilang, file patch yang hilang di fixture git turunan tarball, `update.channel` tersimpan yang hilang, lokasi install-record Plugin lama, persistensi install-record marketplace yang hilang, dan migrasi metadata konfigurasi selama `plugins update`. Untuk paket setelah `2026.4.25`, jalur tersebut menjadi kegagalan ketat.
- Runner smoke kontainer: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, dan `test:docker:config-reload` mem-boot satu atau beberapa kontainer nyata dan memverifikasi jalur integrasi tingkat lebih tinggi.

Runner Docker model langsung juga hanya bind-mount home auth CLI yang diperlukan (atau semua yang didukung saat run tidak dipersempit), lalu menyalinnya ke home kontainer sebelum run sehingga OAuth CLI eksternal dapat menyegarkan token tanpa mengubah penyimpanan auth host:

- Model langsung: `pnpm test:docker:live-models` (skrip: `scripts/test-live-models-docker.sh`)
- Uji smoke pengikatan ACP: `pnpm test:docker:live-acp-bind` (skrip: `scripts/test-live-acp-bind-docker.sh`; mencakup Claude, Codex, dan Gemini secara default, dengan cakupan Droid/OpenCode yang ketat melalui `pnpm test:docker:live-acp-bind:droid` dan `pnpm test:docker:live-acp-bind:opencode`)
- Uji smoke backend CLI: `pnpm test:docker:live-cli-backend` (skrip: `scripts/test-live-cli-backend-docker.sh`)
- Uji smoke harness server aplikasi Codex: `pnpm test:docker:live-codex-harness` (skrip: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agen dev: `pnpm test:docker:live-gateway` (skrip: `scripts/test-live-gateway-models-docker.sh`)
- Uji smoke observabilitas: `pnpm qa:otel:smoke` adalah jalur pemeriksaan sumber QA privat. Ini sengaja bukan bagian dari jalur rilis Docker paket karena tarball npm tidak menyertakan QA Lab.
- Uji smoke live Open WebUI: `pnpm test:docker:openwebui` (skrip: `scripts/e2e/openwebui-docker.sh`)
- Wizard onboarding (TTY, scaffolding lengkap): `pnpm test:docker:onboard` (skrip: `scripts/e2e/onboard-docker.sh`)
- Uji smoke tarball npm untuk onboarding/kanal/agen: `pnpm test:docker:npm-onboard-channel-agent` memasang tarball OpenClaw yang telah dipaketkan secara global di Docker, mengonfigurasi OpenAI melalui onboarding env-ref plus Telegram secara default, memverifikasi bahwa doctor memperbaiki dependensi runtime Plugin yang diaktifkan, dan menjalankan satu giliran agen OpenAI yang di-mock. Gunakan ulang tarball yang telah dibuat dengan `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati rebuild host dengan `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, atau ganti kanal dengan `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Uji smoke pengalihan kanal pembaruan: `pnpm test:docker:update-channel-switch` memasang tarball OpenClaw yang telah dipaketkan secara global di Docker, beralih dari paket `stable` ke git `dev`, memverifikasi kanal yang tersimpan dan pekerjaan pascapembaruan Plugin, lalu beralih kembali ke paket `stable` dan memeriksa status pembaruan.
- Uji smoke konteks runtime sesi: `pnpm test:docker:session-runtime-context` memverifikasi persistensi transkrip konteks runtime tersembunyi plus perbaikan doctor untuk cabang prompt-rewrite duplikat yang terdampak.
- Uji smoke pemasangan global Bun: `bash scripts/e2e/bun-global-install-smoke.sh` mengemas tree saat ini, memasangnya dengan `bun install -g` di home yang terisolasi, dan memverifikasi `openclaw infer image providers --json` mengembalikan penyedia gambar bawaan alih-alih macet. Gunakan ulang tarball yang telah dibuat dengan `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, lewati build host dengan `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, atau salin `dist/` dari image Docker yang telah dibangun dengan `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Uji smoke Docker pemasang: `bash scripts/test-install-sh-docker.sh` berbagi satu cache npm di seluruh kontainer root, update, dan direct-npm. Uji smoke update default ke npm `latest` sebagai baseline stable sebelum meningkatkan ke tarball kandidat. Override dengan `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` secara lokal, atau dengan input `update_baseline_version` workflow Install Smoke di GitHub. Pemeriksaan pemasang non-root mempertahankan cache npm terisolasi agar entri cache milik root tidak menutupi perilaku pemasangan lokal pengguna. Setel `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` untuk menggunakan ulang cache root/update/direct-npm di rerun lokal.
- CI Install Smoke melewati pembaruan global direct-npm duplikat dengan `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; jalankan skrip secara lokal tanpa env tersebut saat cakupan langsung `npm install -g` diperlukan.
- Uji smoke CLI penghapusan workspace bersama agen: `pnpm test:docker:agents-delete-shared-workspace` (skrip: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) membangun image Dockerfile root secara default, menyiapkan dua agen dengan satu workspace di home kontainer terisolasi, menjalankan `agents delete --json`, dan memverifikasi JSON valid plus perilaku workspace yang dipertahankan. Gunakan ulang image install-smoke dengan `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Jaringan Gateway (dua kontainer, auth WS + kesehatan): `pnpm test:docker:gateway-network` (skrip: `scripts/e2e/gateway-network-docker.sh`)
- Uji smoke snapshot CDP browser: `pnpm test:docker:browser-cdp-snapshot` (skrip: `scripts/e2e/browser-cdp-snapshot-docker.sh`) membangun image E2E sumber plus lapisan Chromium, memulai Chromium dengan CDP mentah, menjalankan `browser doctor --deep`, dan memverifikasi snapshot peran CDP mencakup URL tautan, clickable yang dipromosikan kursor, ref iframe, dan metadata frame.
- Regresi penalaran minimal OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrip: `scripts/e2e/openai-web-search-minimal-docker.sh`) menjalankan server OpenAI yang di-mock melalui Gateway, memverifikasi `web_search` menaikkan `reasoning.effort` dari `minimal` ke `low`, lalu memaksa penolakan skema penyedia dan memeriksa detail mentah muncul di log Gateway.
- Bridge kanal MCP (Gateway yang disiapkan + bridge stdio + uji smoke frame notifikasi Claude mentah): `pnpm test:docker:mcp-channels` (skrip: `scripts/e2e/mcp-channels-docker.sh`)
- Alat MCP bundle Pi (server MCP stdio nyata + uji smoke allow/deny profil Pi tertanam): `pnpm test:docker:pi-bundle-mcp-tools` (skrip: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Pembersihan MCP Cron/subagen (Gateway nyata + teardown anak MCP stdio setelah cron terisolasi dan run subagen sekali jalan): `pnpm test:docker:cron-mcp-cleanup` (skrip: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugin (uji smoke pemasangan, pemasangan/pencopotan kitchen-sink ClawHub, pembaruan marketplace, dan pengaktifan/inspeksi bundle Claude): `pnpm test:docker:plugins` (skrip: `scripts/e2e/plugins-docker.sh`)
  Setel `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` untuk melewati blok ClawHub, atau override pasangan package/runtime kitchen-sink default dengan `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` dan `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Tanpa `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL`, pengujian menggunakan server fixture ClawHub lokal yang hermetik.
- Uji smoke pembaruan Plugin tanpa perubahan: `pnpm test:docker:plugin-update` (skrip: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Uji smoke metadata pemuatan ulang konfigurasi: `pnpm test:docker:config-reload` (skrip: `scripts/e2e/config-reload-source-docker.sh`)
- Dependensi runtime Plugin bawaan: `pnpm test:docker:bundled-channel-deps` membangun image runner Docker kecil secara default, membangun dan mengemas OpenClaw sekali di host, lalu memasang tarball itu ke setiap skenario pemasangan Linux. Gunakan ulang image dengan `OPENCLAW_SKIP_DOCKER_BUILD=1`, lewati rebuild host setelah build lokal baru dengan `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, atau arahkan ke tarball yang ada dengan `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz`. Agregat Docker penuh dan chunk bundled-channel jalur rilis melakukan pra-paket tarball ini sekali, lalu men-shard pemeriksaan kanal bawaan ke jalur independen, termasuk jalur pembaruan terpisah untuk Telegram, Discord, Slack, Feishu, memory-lancedb, dan ACPX. Chunk rilis memisahkan smoke kanal, target pembaruan, dan kontrak setup/runtime menjadi `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b`, dan `bundled-channels-contracts`; chunk agregat `bundled-channels` tetap tersedia untuk rerun manual. Workflow rilis juga memisahkan chunk pemasang penyedia dan chunk pemasangan/pencopotan Plugin bawaan; chunk lama `package-update`, `plugins-runtime`, dan `plugins-integrations` tetap menjadi alias agregat untuk rerun manual. Gunakan `OPENCLAW_BUNDLED_CHANNELS=telegram,slack` untuk mempersempit matriks kanal saat menjalankan jalur bawaan secara langsung, atau `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx` untuk mempersempit skenario pembaruan. Run Docker per skenario default ke `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; skenario pembaruan multi-target default ke `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. Jalur ini juga memverifikasi bahwa `channels.<id>.enabled=false` dan `plugins.entries.<id>.enabled=false` menekan perbaikan dependensi doctor/runtime.
- Persempit dependensi runtime Plugin bawaan saat iterasi dengan menonaktifkan skenario yang tidak terkait, misalnya:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Untuk melakukan prebuild dan menggunakan ulang image fungsional bersama secara manual:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Override image khusus suite seperti `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` tetap menang saat disetel. Saat `OPENCLAW_SKIP_DOCKER_BUILD=1` mengarah ke image bersama jarak jauh, skrip akan menariknya jika belum ada secara lokal. Pengujian Docker QR dan pemasang mempertahankan Dockerfile masing-masing karena pengujian tersebut memvalidasi perilaku paket/pemasangan, bukan runtime aplikasi bawaan bersama.

Runner Docker live-model juga melakukan bind-mount checkout saat ini secara read-only dan
menyiapkannya ke workdir sementara di dalam kontainer. Ini menjaga image runtime
tetap ramping sambil tetap menjalankan Vitest terhadap sumber/konfigurasi lokal persis milik Anda.
Langkah staging melewati cache lokal besar dan output build aplikasi seperti
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__`, serta direktori output `.build` lokal aplikasi atau
Gradle agar run live Docker tidak menghabiskan menit untuk menyalin
artefak khusus mesin.
Runner tersebut juga menyetel `OPENCLAW_SKIP_CHANNELS=1` agar probe live gateway tidak memulai
worker kanal Telegram/Discord/dll. nyata di dalam kontainer.
`test:docker:live-models` tetap menjalankan `pnpm test:live`, jadi teruskan
`OPENCLAW_LIVE_GATEWAY_*` juga saat Anda perlu mempersempit atau mengecualikan cakupan
live gateway dari jalur Docker tersebut.
`test:docker:openwebui` adalah uji smoke kompatibilitas tingkat lebih tinggi: ini memulai
kontainer gateway OpenClaw dengan endpoint HTTP kompatibel OpenAI yang diaktifkan,
memulai kontainer Open WebUI yang dipin terhadap gateway tersebut, masuk melalui
Open WebUI, memverifikasi `/api/models` mengekspos `openclaw/default`, lalu mengirim
permintaan chat nyata melalui proxy `/api/chat/completions` milik Open WebUI.
Run pertama bisa terasa lebih lambat karena Docker mungkin perlu menarik image
Open WebUI dan Open WebUI mungkin perlu menyelesaikan setup cold-start-nya sendiri.
Jalur ini mengharapkan kunci model live yang dapat digunakan, dan `OPENCLAW_PROFILE_FILE`
(`~/.profile` secara default) adalah cara utama untuk menyediakannya dalam run terdokerisasi.
Run yang berhasil mencetak payload JSON kecil seperti `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` sengaja deterministik dan tidak memerlukan akun
Telegram, Discord, atau iMessage nyata. Ini mem-boot kontainer Gateway yang telah disiapkan,
memulai kontainer kedua yang memunculkan `openclaw mcp serve`, lalu
memverifikasi penemuan percakapan yang dirutekan, pembacaan transkrip, metadata lampiran,
perilaku antrean peristiwa live, routing pengiriman keluar, dan notifikasi kanal bergaya Claude +
izin melalui bridge MCP stdio nyata. Pemeriksaan notifikasi
menginspeksi frame MCP stdio mentah secara langsung sehingga uji smoke memvalidasi apa yang
benar-benar dipancarkan bridge, bukan hanya apa yang kebetulan ditampilkan oleh SDK klien tertentu.
`test:docker:pi-bundle-mcp-tools` bersifat deterministik dan tidak memerlukan kunci model live.
Ini membangun image Docker repo, memulai server probe MCP stdio nyata
di dalam kontainer, mematerialisasikan server tersebut melalui runtime MCP bundle Pi tertanam,
mengeksekusi alat, lalu memverifikasi `coding` dan `messaging` mempertahankan
alat `bundle-mcp` sementara `minimal` dan `tools.deny: ["bundle-mcp"]` memfilternya.
`test:docker:cron-mcp-cleanup` bersifat deterministik dan tidak memerlukan kunci model live.
Ini memulai Gateway yang telah disiapkan dengan server probe MCP stdio nyata, menjalankan
giliran cron terisolasi dan giliran anak sekali jalan `/subagents spawn`, lalu memverifikasi
proses anak MCP keluar setelah setiap run.

Uji smoke thread bahasa biasa ACP manual (bukan CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Simpan skrip ini untuk alur kerja regresi/debug. Skrip ini mungkin diperlukan lagi untuk validasi perutean thread ACP, jadi jangan hapus.

Variabel env yang berguna:

- `OPENCLAW_CONFIG_DIR=...` (default: `~/.openclaw`) dipasang ke `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (default: `~/.openclaw/workspace`) dipasang ke `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (default: `~/.profile`) dipasang ke `/home/node/.profile` dan di-source sebelum menjalankan pengujian
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` untuk memverifikasi hanya variabel env yang di-source dari `OPENCLAW_PROFILE_FILE`, menggunakan direktori konfigurasi/ruang kerja sementara dan tanpa pemasangan autentikasi CLI eksternal
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (default: `~/.cache/openclaw/docker-cli-tools`) dipasang ke `/home/node/.npm-global` untuk instalasi CLI yang di-cache di dalam Docker
- Direktori/file autentikasi CLI eksternal di bawah `$HOME` dipasang hanya-baca di bawah `/host-auth...`, lalu disalin ke `/home/node/...` sebelum pengujian dimulai
  - Direktori default: `.minimax`
  - File default: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Proses provider yang dipersempit hanya memasang direktori/file yang diperlukan, yang disimpulkan dari `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Timpa secara manual dengan `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none`, atau daftar koma seperti `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` untuk mempersempit proses
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` untuk memfilter provider di dalam kontainer
- `OPENCLAW_SKIP_DOCKER_BUILD=1` untuk menggunakan kembali image `openclaw:local-live` yang sudah ada untuk proses ulang yang tidak memerlukan pembangunan ulang
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` untuk memastikan kredensial berasal dari penyimpanan profil (bukan env)
- `OPENCLAW_OPENWEBUI_MODEL=...` untuk memilih model yang diekspos oleh Gateway untuk smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` untuk menimpa prompt pemeriksaan nonce yang digunakan oleh smoke Open WebUI
- `OPENWEBUI_IMAGE=...` untuk menimpa tag image Open WebUI yang dipin

## Pemeriksaan dokumentasi

Jalankan pemeriksaan dokumentasi setelah pengeditan dokumen: `pnpm check:docs`.
Jalankan validasi anchor Mintlify penuh ketika Anda juga memerlukan pemeriksaan heading dalam halaman: `pnpm docs:check-links:anchors`.

## Regresi offline (aman untuk CI)

Ini adalah regresi “pipeline nyata” tanpa provider nyata:

- Pemanggilan alat Gateway (mock OpenAI, Gateway nyata + loop agen): `src/gateway/gateway.test.ts` (kasus: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Wizard Gateway (WS `wizard.start`/`wizard.next`, menulis konfigurasi + autentikasi diberlakukan): `src/gateway/gateway.test.ts` (kasus: "runs wizard over ws and writes auth token config")

## Evaluasi keandalan agen (Skills)

Kita sudah memiliki beberapa pengujian aman untuk CI yang berperilaku seperti “evaluasi keandalan agen”:

- Pemanggilan alat mock melalui Gateway nyata + loop agen (`src/gateway/gateway.test.ts`).
- Alur wizard end-to-end yang memvalidasi wiring sesi dan efek konfigurasi (`src/gateway/gateway.test.ts`).

Yang masih belum ada untuk Skills (lihat [Skills](/id/tools/skills)):

- **Pengambilan keputusan:** ketika Skills tercantum dalam prompt, apakah agen memilih skill yang tepat (atau menghindari yang tidak relevan)?
- **Kepatuhan:** apakah agen membaca `SKILL.md` sebelum digunakan dan mengikuti langkah/argumen yang diwajibkan?
- **Kontrak alur kerja:** skenario multi-giliran yang menegaskan urutan alat, penerusan riwayat sesi, dan batas sandbox.

Evaluasi mendatang harus tetap deterministik terlebih dahulu:

- Runner skenario menggunakan provider mock untuk menegaskan pemanggilan alat + urutan, pembacaan file skill, dan wiring sesi.
- Suite kecil skenario yang berfokus pada skill (gunakan vs hindari, gating, injeksi prompt).
- Evaluasi live opsional (opt-in, dijaga env) hanya setelah suite aman untuk CI tersedia.

## Pengujian kontrak (bentuk plugin dan channel)

Pengujian kontrak memverifikasi bahwa setiap plugin dan channel terdaftar mematuhi
kontrak antarmukanya. Pengujian ini mengiterasi semua plugin yang ditemukan dan menjalankan suite
asersi bentuk dan perilaku. Lane unit `pnpm test` default dengan sengaja
melewati file smoke dan seam bersama ini; jalankan perintah kontrak secara eksplisit
ketika Anda menyentuh permukaan channel atau provider bersama.

### Perintah

- Semua kontrak: `pnpm test:contracts`
- Hanya kontrak channel: `pnpm test:contracts:channels`
- Hanya kontrak provider: `pnpm test:contracts:plugins`

### Kontrak channel

Terletak di `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Bentuk plugin dasar (id, nama, kapabilitas)
- **setup** - Kontrak wizard penyiapan
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
- **registry** - Bentuk registri Plugin

### Kontrak provider

Terletak di `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrak alur autentikasi
- **auth-choice** - Pilihan/seleksi autentikasi
- **catalog** - API katalog model
- **discovery** - Penemuan Plugin
- **loader** - Pemuatan Plugin
- **runtime** - Runtime provider
- **shape** - Bentuk/antarmuka Plugin
- **wizard** - Wizard penyiapan

### Kapan menjalankan

- Setelah mengubah ekspor atau subpath plugin-sdk
- Setelah menambahkan atau memodifikasi plugin channel atau provider
- Setelah merombak pendaftaran atau penemuan plugin

Pengujian kontrak berjalan di CI dan tidak memerlukan kunci API nyata.

## Menambahkan regresi (panduan)

Ketika Anda memperbaiki masalah provider/model yang ditemukan secara live:

- Tambahkan regresi aman untuk CI jika memungkinkan (provider mock/stub, atau tangkap transformasi bentuk permintaan yang tepat)
- Jika secara inheren hanya live (batas laju, kebijakan autentikasi), jaga pengujian live tetap sempit dan opt-in melalui variabel env
- Pilih lapisan terkecil yang menangkap bug:
  - bug konversi/replay permintaan provider → pengujian model langsung
  - bug pipeline sesi/riwayat/alat Gateway → smoke live Gateway atau pengujian mock Gateway aman untuk CI
- Guardrail traversal SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` menurunkan satu target sampel per kelas SecretRef dari metadata registri (`listSecretTargetRegistryEntries()`), lalu menegaskan bahwa id exec segmen traversal ditolak.
  - Jika Anda menambahkan keluarga target SecretRef `includeInPlan` baru di `src/secrets/target-registry-data.ts`, perbarui `classifyTargetClass` dalam pengujian itu. Pengujian ini sengaja gagal pada id target yang tidak terklasifikasi agar kelas baru tidak dapat dilewati diam-diam.

## Terkait

- [Pengujian live](/id/help/testing-live)
- [CI](/id/ci)
