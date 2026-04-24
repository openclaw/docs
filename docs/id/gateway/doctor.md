---
read_when:
    - Menambahkan atau memodifikasi migrasi doctor
    - Memperkenalkan perubahan konfigurasi yang breaking
summary: 'Perintah doctor: pemeriksaan kesehatan, migrasi konfigurasi, dan langkah perbaikan'
title: Doctor
x-i18n:
    generated_at: "2026-04-24T09:07:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cc0ddb91af47a246c9a37528942b7d53c166255469169d6cb0268f83359c400
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` adalah tool perbaikan + migrasi untuk OpenClaw. Tool ini memperbaiki
konfigurasi/status yang usang, memeriksa kesehatan, dan memberikan langkah perbaikan yang dapat ditindaklanjuti.

## Mulai cepat

```bash
openclaw doctor
```

### Headless / otomasi

```bash
openclaw doctor --yes
```

Terima default tanpa prompt (termasuk langkah perbaikan restart/layanan/sandbox bila berlaku).

```bash
openclaw doctor --repair
```

Terapkan perbaikan yang direkomendasikan tanpa prompt (perbaikan + restart jika aman).

```bash
openclaw doctor --repair --force
```

Terapkan perbaikan agresif juga (menimpa konfigurasi supervisor kustom).

```bash
openclaw doctor --non-interactive
```

Jalankan tanpa prompt dan hanya terapkan migrasi aman (normalisasi konfigurasi + pemindahan status di disk). Lewati tindakan restart/layanan/sandbox yang memerlukan konfirmasi manusia.
Migrasi status legacy dijalankan secara otomatis ketika terdeteksi.

```bash
openclaw doctor --deep
```

Pindai layanan sistem untuk instalasi gateway tambahan (launchd/systemd/schtasks).

Jika Anda ingin meninjau perubahan sebelum menulis, buka file konfigurasi terlebih dahulu:

```bash
cat ~/.openclaw/openclaw.json
```

## Apa yang dilakukan (ringkasan)

- Pembaruan pre-flight opsional untuk instalasi git (hanya interaktif).
- Pemeriksaan kesegaran protokol UI (membangun ulang Control UI saat skema protokol lebih baru).
- Pemeriksaan kesehatan + prompt restart.
- Ringkasan status Skills (eligible/missing/blocked) dan status plugin.
- Normalisasi konfigurasi untuk nilai legacy.
- Migrasi konfigurasi Talk dari field `talk.*` datar lama ke `talk.provider` + `talk.providers.<provider>`.
- Pemeriksaan migrasi browser untuk konfigurasi Chrome extension lama dan kesiapan Chrome MCP.
- Peringatan override provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Peringatan shadowing OAuth Codex (`models.providers.openai-codex`).
- Pemeriksaan prasyarat OAuth TLS untuk profil OAuth OpenAI Codex.
- Migrasi status legacy di disk (sessions/agent dir/autentikasi WhatsApp).
- Migrasi key kontrak manifest plugin legacy (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migrasi penyimpanan Cron legacy (`jobId`, `schedule.cron`, field delivery/payload tingkat atas, payload `provider`, pekerjaan fallback webhook sederhana `notify: true`).
- Inspeksi file lock sesi dan pembersihan lock usang.
- Pemeriksaan integritas status dan izin (sessions, transcripts, direktori status).
- Pemeriksaan izin file konfigurasi (chmod 600) saat berjalan secara lokal.
- Kesehatan autentikasi model: memeriksa kedaluwarsa OAuth, dapat me-refresh token yang akan kedaluwarsa, dan melaporkan status cooldown/disabled auth-profile.
- Deteksi direktori workspace ekstra (`~/openclaw`).
- Perbaikan image sandbox saat sandboxing diaktifkan.
- Migrasi layanan legacy dan deteksi gateway tambahan.
- Migrasi status legacy kanal Matrix (dalam mode `--fix` / `--repair`).
- Pemeriksaan runtime Gateway (layanan terinstal tetapi tidak berjalan; label launchd yang di-cache).
- Peringatan status kanal (di-probe dari gateway yang sedang berjalan).
- Audit konfigurasi supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
- Pemeriksaan best practice runtime Gateway (Node vs Bun, path version-manager).
- Diagnostik benturan port Gateway (default `18789`).
- Peringatan keamanan untuk kebijakan DM terbuka.
- Pemeriksaan autentikasi Gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada sumber token; tidak menimpa konfigurasi token SecretRef).
- Deteksi masalah pairing perangkat (permintaan pair pertama yang tertunda, upgrade role/scope yang tertunda, drift cache device-token lokal yang usang, dan drift autentikasi paired-record).
- Pemeriksaan linger systemd di Linux.
- Pemeriksaan ukuran file bootstrap workspace (peringatan truncation/hampir batas untuk file konteks).
- Pemeriksaan status shell completion dan auto-install/upgrade.
- Pemeriksaan kesiapan provider embedding memory search (model lokal, API key remote, atau binary QMD).
- Pemeriksaan instalasi source (ketidakcocokan workspace pnpm, aset UI hilang, binary tsx hilang).
- Menulis konfigurasi yang diperbarui + metadata wizard.

## Backfill dan reset UI Dreams

Adegan Dreams di Control UI mencakup aksi **Backfill**, **Reset**, dan **Clear Grounded**
untuk alur grounded dreaming. Aksi-aksi ini menggunakan metode RPC bergaya gateway
doctor, tetapi **bukan** bagian dari perbaikan/migrasi CLI `openclaw doctor`.

Yang mereka lakukan:

- **Backfill** memindai file `memory/YYYY-MM-DD.md` historis di workspace
  aktif, menjalankan grounded REM diary pass, dan menulis entri backfill yang dapat dibalik
  ke `DREAMS.md`.
- **Reset** hanya menghapus entri diary backfill bertanda tersebut dari `DREAMS.md`.
- **Clear Grounded** hanya menghapus entri jangka pendek grounded-only yang di-stage
  dari replay historis dan belum mengakumulasi recall live atau dukungan harian.

Yang **tidak** mereka lakukan dengan sendirinya:

- mereka tidak mengedit `MEMORY.md`
- mereka tidak menjalankan migrasi doctor penuh
- mereka tidak otomatis meng-stage kandidat grounded ke penyimpanan promosi
  jangka pendek live kecuali Anda secara eksplisit menjalankan jalur CLI staged terlebih dahulu

Jika Anda ingin replay historis grounded memengaruhi jalur promosi mendalam normal,
gunakan alur CLI sebagai gantinya:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Itu meng-stage kandidat tahan lama grounded ke penyimpanan dreaming jangka pendek sambil
mempertahankan `DREAMS.md` sebagai permukaan tinjauan.

## Perilaku rinci dan alasannya

### 0) Pembaruan opsional (instalasi git)

Jika ini adalah checkout git dan doctor berjalan secara interaktif, tool ini menawarkan untuk
memperbarui (fetch/rebase/build) sebelum menjalankan doctor.

### 1) Normalisasi konfigurasi

Jika konfigurasi berisi bentuk nilai legacy (misalnya `messages.ackReaction`
tanpa override spesifik kanal), doctor menormalisasikannya ke
skema saat ini.

Ini termasuk field datar Talk legacy. Konfigurasi Talk publik saat ini adalah
`talk.provider` + `talk.providers.<provider>`. Doctor menulis ulang bentuk lama
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` ke peta provider.

### 2) Migrasi key konfigurasi legacy

Ketika konfigurasi berisi key yang deprecated, perintah lain menolak untuk berjalan dan meminta
Anda menjalankan `openclaw doctor`.

Doctor akan:

- Menjelaskan key legacy mana yang ditemukan.
- Menampilkan migrasi yang diterapkan.
- Menulis ulang `~/.openclaw/openclaw.json` dengan skema yang telah diperbarui.

Gateway juga otomatis menjalankan migrasi doctor saat startup ketika mendeteksi
format konfigurasi legacy, sehingga konfigurasi usang diperbaiki tanpa intervensi manual.
Migrasi penyimpanan Cron ditangani oleh `openclaw doctor --fix`.

Migrasi saat ini:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` tingkat atas
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- legacy `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Untuk kanal dengan `accounts` bernama tetapi masih memiliki nilai kanal akun tunggal tingkat atas, pindahkan nilai bercakupan akun tersebut ke akun hasil promosi yang dipilih untuk kanal itu (`accounts.default` untuk sebagian besar kanal; Matrix dapat mempertahankan target bernama/default yang sudah cocok)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- hapus `browser.relayBindHost` (pengaturan relay extension legacy)

Peringatan doctor juga mencakup panduan default akun untuk kanal multi-akun:

- Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa routing fallback dapat memilih akun yang tidak diharapkan.
- Jika `channels.<channel>.defaultAccount` disetel ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

### 2b) Override provider OpenCode

Jika Anda telah menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go`
secara manual, itu akan menimpa katalog OpenCode bawaan dari `@mariozechner/pi-ai`.
Hal ini dapat memaksa model ke API yang salah atau menjadikan biaya nol. Doctor memperingatkan agar Anda
dapat menghapus override tersebut dan memulihkan routing API + biaya per model.

### 2c) Migrasi browser dan kesiapan Chrome MCP

Jika konfigurasi browser Anda masih menunjuk ke jalur Chrome extension yang sudah dihapus, doctor
menormalisasikannya ke model attach Chrome MCP host-lokal saat ini:

- `browser.profiles.*.driver: "extension"` menjadi `"existing-session"`
- `browser.relayBindHost` dihapus

Doctor juga mengaudit jalur Chrome MCP host-lokal ketika Anda menggunakan `defaultProfile:
"user"` atau profil `existing-session` yang dikonfigurasi:

- memeriksa apakah Google Chrome terinstal di host yang sama untuk profil
  auto-connect default
- memeriksa versi Chrome yang terdeteksi dan memperingatkan jika di bawah Chrome 144
- mengingatkan Anda untuk mengaktifkan remote debugging di halaman inspect browser (misalnya `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  atau `edge://inspect/#remote-debugging`)

Doctor tidak dapat mengaktifkan pengaturan sisi Chrome untuk Anda. Chrome MCP host-lokal
tetap memerlukan:

- browser berbasis Chromium 144+ di host gateway/node
- browser berjalan secara lokal
- remote debugging diaktifkan di browser tersebut
- menyetujui prompt consent attach pertama di browser

Kesiapan di sini hanya tentang prasyarat attach lokal. Existing-session tetap
mempertahankan batas route Chrome MCP saat ini; route lanjutan seperti `responsebody`, ekspor PDF,
intersepsi unduhan, dan aksi batch masih memerlukan browser terkelola
atau profil CDP mentah.

Pemeriksaan ini **tidak** berlaku untuk Docker, sandbox, remote-browser, atau alur
headless lainnya. Alur tersebut tetap menggunakan CDP mentah.

### 2d) Prasyarat OAuth TLS

Ketika profil OAuth OpenAI Codex dikonfigurasi, doctor mem-probe endpoint otorisasi OpenAI
untuk memverifikasi bahwa stack TLS Node/OpenSSL lokal dapat
memvalidasi rantai sertifikat. Jika probe gagal dengan error sertifikat (misalnya
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat self-signed),
doctor mencetak panduan perbaikan spesifik platform. Di macOS dengan Node Homebrew,
perbaikannya biasanya adalah `brew postinstall ca-certificates`. Dengan `--deep`, probe berjalan
bahkan jika gateway sehat.

### 2c) Override provider OAuth Codex

Jika sebelumnya Anda menambahkan pengaturan transport OpenAI legacy di bawah
`models.providers.openai-codex`, pengaturan itu dapat membayangi jalur provider
OAuth Codex bawaan yang digunakan rilis terbaru secara otomatis. Doctor akan memperingatkan ketika melihat
pengaturan transport lama tersebut bersamaan dengan OAuth Codex agar Anda dapat menghapus atau menulis ulang
override transport usang tersebut dan mendapatkan kembali perilaku routing/fallback bawaan.
Proxy kustom dan override khusus header tetap didukung dan tidak memicu peringatan ini.

### 3) Migrasi status legacy (layout disk)

Doctor dapat memigrasikan layout lama di disk ke struktur saat ini:

- Penyimpanan sesi + transkrip:
  - dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
- Direktori agen:
  - dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
- Status autentikasi WhatsApp (Baileys):
  - dari legacy `~/.openclaw/credentials/*.json` (kecuali `oauth.json`)
  - ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (id akun default: `default`)

Migrasi ini bersifat best-effort dan idempoten; doctor akan mengeluarkan peringatan ketika
meninggalkan folder legacy sebagai backup. Gateway/CLI juga otomatis memigrasikan
sesi legacy + direktori agen saat startup sehingga riwayat/autentikasi/model masuk ke
path per agen tanpa perlu menjalankan doctor secara manual. Autentikasi WhatsApp sengaja hanya
dimigrasikan melalui `openclaw doctor`. Normalisasi Talk provider/provider-map kini
membandingkan dengan kesetaraan struktural, sehingga perbedaan urutan key saja tidak lagi memicu
perubahan no-op `doctor --fix` berulang.

### 3a) Migrasi manifest plugin legacy

Doctor memindai semua manifest plugin yang terinstal untuk key kapabilitas tingkat atas yang deprecated
(`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Saat ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts`
dan menulis ulang file manifest di tempat. Migrasi ini idempoten;
jika key `contracts` sudah memiliki nilai yang sama, key legacy dihapus
tanpa menduplikasi data.

### 3b) Migrasi penyimpanan Cron legacy

Doctor juga memeriksa penyimpanan job Cron (`~/.openclaw/cron/jobs.json` secara default,
atau `cron.store` jika dioverride) untuk bentuk job lama yang masih
diterima scheduler demi kompatibilitas.

Pembersihan Cron saat ini mencakup:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- field payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
- field delivery tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias delivery `provider` payload → `delivery.channel` eksplisit
- job fallback webhook legacy sederhana `notify: true` → `delivery.mode="webhook"` eksplisit dengan `delivery.to=cron.webhook`

Doctor hanya memigrasikan otomatis job `notify: true` ketika hal itu dapat dilakukan tanpa
mengubah perilaku. Jika sebuah job menggabungkan fallback notify legacy dengan mode delivery
non-webhook yang sudah ada, doctor akan memperingatkan dan membiarkan job tersebut untuk tinjauan manual.

### 3c) Pembersihan lock sesi

Doctor memindai setiap direktori sesi agen untuk file write-lock usang — file yang tertinggal
ketika sesi keluar secara abnormal. Untuk setiap file lock yang ditemukan, doctor melaporkan:
path, PID, apakah PID masih hidup, usia lock, dan apakah lock tersebut
dianggap usang (PID mati atau lebih dari 30 menit). Dalam mode `--fix` / `--repair`
doctor menghapus file lock usang secara otomatis; jika tidak, doctor mencetak catatan dan
menginstruksikan Anda untuk menjalankan ulang dengan `--fix`.

### 4) Pemeriksaan integritas status (persistensi sesi, routing, dan keamanan)

Direktori status adalah batang otak operasional. Jika direktori ini hilang, Anda akan kehilangan
sesi, kredensial, log, dan konfigurasi (kecuali Anda memiliki cadangan di tempat lain).

Doctor memeriksa:

- **Direktori status hilang**: memperingatkan tentang kehilangan status yang katastrofik, meminta untuk membuat ulang
  direktori, dan mengingatkan bahwa doctor tidak dapat memulihkan data yang hilang.
- **Izin direktori status**: memverifikasi dapat ditulisi; menawarkan untuk memperbaiki izin
  (dan mengeluarkan petunjuk `chown` ketika terdeteksi ketidakcocokan owner/group).
- **Direktori status tersinkron cloud di macOS**: memperingatkan ketika status diselesaikan di bawah iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau
  `~/Library/CloudStorage/...` karena path berbasis sinkronisasi dapat menyebabkan I/O lebih lambat
  dan race lock/sinkronisasi.
- **Direktori status di Linux pada SD atau eMMC**: memperingatkan ketika status diselesaikan ke sumber mount `mmcblk*`,
  karena random I/O berbasis SD atau eMMC dapat lebih lambat dan lebih cepat aus
  di bawah penulisan sesi dan kredensial.
- **Direktori sesi hilang**: `sessions/` dan direktori penyimpanan sesi
  diperlukan untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
- **Ketidakcocokan transkrip**: memperingatkan ketika entri sesi terbaru memiliki file
  transkrip yang hilang.
- **Sesi utama “1-line JSONL”**: menandai ketika transkrip utama hanya memiliki satu
  baris (riwayat tidak terakumulasi).
- **Beberapa direktori status**: memperingatkan ketika beberapa folder `~/.openclaw` ada di berbagai
  direktori home atau ketika `OPENCLAW_STATE_DIR` menunjuk ke tempat lain (riwayat dapat
  terpecah di antara instalasi).
- **Pengingat mode remote**: jika `gateway.mode=remote`, doctor mengingatkan Anda untuk menjalankannya
  di host remote (karena status berada di sana).
- **Izin file konfigurasi**: memperingatkan jika `~/.openclaw/openclaw.json` dapat dibaca oleh
  group/world dan menawarkan untuk memperketat ke `600`.

### 5) Kesehatan autentikasi model (kedaluwarsa OAuth)

Doctor memeriksa profil OAuth di penyimpanan autentikasi, memperingatkan ketika token
akan kedaluwarsa/sudah kedaluwarsa, dan dapat me-refresh-nya saat aman. Jika profil
OAuth/token Anthropic sudah usang, doctor menyarankan API key Anthropic atau
jalur setup-token Anthropic.
Prompt refresh hanya muncul saat berjalan secara interaktif (TTY); `--non-interactive`
melewati upaya refresh.

Ketika refresh OAuth gagal secara permanen (misalnya `refresh_token_reused`,
`invalid_grant`, atau provider memberi tahu Anda untuk login lagi), doctor melaporkan
bahwa autentikasi ulang diperlukan dan mencetak perintah `openclaw models auth login --provider ...`
yang tepat untuk dijalankan.

Doctor juga melaporkan profil autentikasi yang sementara tidak dapat digunakan karena:

- cooldown singkat (rate limit/timeout/kegagalan autentikasi)
- penonaktifan yang lebih lama (kegagalan billing/kredit)

### 6) Validasi model hooks

Jika `hooks.gmail.model` diatur, doctor memvalidasi referensi model terhadap
katalog dan allowlist serta memperingatkan ketika model tidak akan terselesaikan atau tidak diizinkan.

### 7) Perbaikan image sandbox

Saat sandboxing diaktifkan, doctor memeriksa image Docker dan menawarkan untuk membangun atau
beralih ke nama legacy jika image saat ini hilang.

### 7b) Dependensi runtime plugin bawaan

Doctor memverifikasi dependensi runtime hanya untuk plugin bawaan yang aktif dalam
konfigurasi saat ini atau diaktifkan oleh default manifest bawaan mereka, misalnya
`plugins.entries.discord.enabled: true`, legacy
`channels.discord.enabled: true`, atau provider bawaan yang aktif secara default. Jika ada
yang hilang, doctor melaporkan paket-paket tersebut dan menginstalnya dalam mode
`openclaw doctor --fix` / `openclaw doctor --repair`. Plugin eksternal tetap
menggunakan `openclaw plugins install` / `openclaw plugins update`; doctor tidak
menginstal dependensi untuk path plugin arbitrer.

### 8) Migrasi layanan Gateway dan petunjuk pembersihan

Doctor mendeteksi layanan gateway legacy (launchd/systemd/schtasks) dan
menawarkan untuk menghapusnya serta menginstal layanan OpenClaw menggunakan port gateway
saat ini. Doctor juga dapat memindai layanan mirip gateway tambahan dan mencetak petunjuk pembersihan.
Layanan gateway OpenClaw dengan nama profile dianggap kelas satu dan tidak
ditandai sebagai "tambahan."

### 8b) Migrasi Matrix saat startup

Ketika sebuah akun kanal Matrix memiliki migrasi status legacy yang tertunda atau dapat ditindaklanjuti,
doctor (dalam mode `--fix` / `--repair`) membuat snapshot pra-migrasi dan kemudian
menjalankan langkah migrasi best-effort: migrasi status Matrix legacy dan persiapan status terenkripsi
legacy. Kedua langkah ini tidak fatal; error dicatat dan startup tetap berlanjut. Dalam mode read-only (`openclaw doctor` tanpa `--fix`) pemeriksaan ini
dilewati sepenuhnya.

### 8c) Drift pairing perangkat dan autentikasi

Doctor kini memeriksa status pairing perangkat sebagai bagian dari health pass normal.

Yang dilaporkan:

- permintaan pairing pertama yang tertunda
- upgrade role yang tertunda untuk perangkat yang sudah dipair
- upgrade scope yang tertunda untuk perangkat yang sudah dipair
- perbaikan ketidakcocokan public-key ketika id perangkat masih cocok tetapi identitas
  perangkat tidak lagi cocok dengan catatan yang disetujui
- catatan pairing yang tidak memiliki token aktif untuk role yang disetujui
- token pairing yang scope-nya melenceng dari baseline pairing yang disetujui
- entri cache device-token lokal untuk mesin saat ini yang mendahului rotasi token sisi
  gateway atau membawa metadata scope usang

Doctor tidak menyetujui permintaan pairing secara otomatis maupun merotasi token perangkat secara otomatis. Doctor
mencetak langkah berikutnya yang tepat sebagai gantinya:

- periksa permintaan yang tertunda dengan `openclaw devices list`
- setujui permintaan yang tepat dengan `openclaw devices approve <requestId>`
- rotasi token baru dengan `openclaw devices rotate --device <deviceId> --role <role>`
- hapus dan setujui ulang catatan usang dengan `openclaw devices remove <deviceId>`

Ini menutup celah umum "sudah dipair tetapi masih mendapat pairing required":
doctor kini membedakan pairing pertama kali dari upgrade role/scope
yang tertunda dan dari drift token/identitas perangkat yang usang.

### 9) Peringatan keamanan

Doctor mengeluarkan peringatan ketika suatu provider terbuka untuk DM tanpa allowlist, atau
ketika suatu kebijakan dikonfigurasi dengan cara yang berbahaya.

### 10) systemd linger (Linux)

Jika berjalan sebagai layanan pengguna systemd, doctor memastikan lingering diaktifkan agar
gateway tetap hidup setelah logout.

### 11) Status workspace (skills, plugin, dan direktori legacy)

Doctor mencetak ringkasan status workspace untuk agen default:

- **Status Skills**: jumlah skill eligible, missing-requirements, dan allowlist-blocked.
- **Direktori workspace legacy**: memperingatkan ketika `~/openclaw` atau direktori workspace legacy lainnya
  ada di samping workspace saat ini.
- **Status plugin**: menghitung plugin loaded/disabled/errored; mencantumkan ID plugin untuk
  setiap error; melaporkan kapabilitas bundle plugin.
- **Peringatan kompatibilitas plugin**: menandai plugin yang memiliki masalah kompatibilitas dengan
  runtime saat ini.
- **Diagnostik plugin**: menampilkan peringatan atau error saat load yang dikeluarkan oleh
  registry plugin.

### 11b) Ukuran file bootstrap

Doctor memeriksa apakah file bootstrap workspace (misalnya `AGENTS.md`,
`CLAUDE.md`, atau file konteks tersisip lainnya) mendekati atau melebihi
anggaran karakter yang dikonfigurasi. Doctor melaporkan jumlah karakter mentah vs. tersisip per file, persentase truncation,
penyebab truncation (`max/file` atau `max/total`), dan total karakter
tersisip sebagai fraksi dari anggaran total. Ketika file ditruncate atau mendekati
batas, doctor mencetak tips untuk menyesuaikan `agents.defaults.bootstrapMaxChars`
dan `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Shell completion

Doctor memeriksa apakah tab completion telah diinstal untuk shell saat ini
(zsh, bash, fish, atau PowerShell):

- Jika profil shell menggunakan pola dynamic completion yang lambat
  (`source <(openclaw completion ...)`), doctor akan meng-upgrade-nya ke varian
  file cache yang lebih cepat.
- Jika completion dikonfigurasi di profil tetapi file cache hilang,
  doctor meregenerasi cache secara otomatis.
- Jika tidak ada completion yang dikonfigurasi sama sekali, doctor meminta untuk menginstalnya
  (hanya mode interaktif; dilewati dengan `--non-interactive`).

Jalankan `openclaw completion --write-state` untuk meregenerasi cache secara manual.

### 12) Pemeriksaan autentikasi Gateway (token lokal)

Doctor memeriksa kesiapan autentikasi token gateway lokal.

- Jika mode token memerlukan token dan tidak ada sumber token, doctor menawarkan untuk membuat token.
- Jika `gateway.auth.token` dikelola SecretRef tetapi tidak tersedia, doctor memperingatkan dan tidak menimpanya dengan plaintext.
- `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya ketika tidak ada SecretRef token yang dikonfigurasi.

### 12b) Perbaikan read-only yang sadar SecretRef

Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku fail-fast runtime.

- `openclaw doctor --fix` kini menggunakan model ringkasan SecretRef read-only yang sama seperti perintah keluarga status untuk perbaikan konfigurasi yang terarah.
- Contoh: perbaikan Telegram `allowFrom` / `groupAllowFrom` `@username` mencoba menggunakan kredensial bot yang dikonfigurasi jika tersedia.
- Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia di jalur perintah saat ini, doctor melaporkan bahwa kredensial tersebut configured-but-unavailable dan melewati auto-resolution alih-alih crash atau salah melaporkan token sebagai hilang.

### 13) Pemeriksaan kesehatan Gateway + restart

Doctor menjalankan pemeriksaan kesehatan dan menawarkan untuk merestart gateway ketika terlihat
tidak sehat.

### 13b) Kesiapan memory search

Doctor memeriksa apakah provider embedding memory search yang dikonfigurasi siap
untuk agen default. Perilakunya bergantung pada backend dan provider yang dikonfigurasi:

- **Backend QMD**: mem-probe apakah binary `qmd` tersedia dan dapat dijalankan.
  Jika tidak, doctor mencetak panduan perbaikan termasuk paket npm dan opsi path binary manual.
- **Provider lokal eksplisit**: memeriksa file model lokal atau URL model
  remote/dapat diunduh yang dikenali. Jika tidak ada, doctor menyarankan beralih ke provider remote.
- **Provider remote eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa API key
  ada di lingkungan atau penyimpanan autentikasi. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika tidak ada.
- **Provider auto**: memeriksa ketersediaan model lokal terlebih dahulu, lalu mencoba setiap provider
  remote dalam urutan auto-selection.

Ketika hasil probe gateway tersedia (gateway sehat pada saat
pemeriksaan), doctor mencocokkan hasilnya dengan konfigurasi yang terlihat oleh CLI dan mencatat
setiap ketidaksesuaian.

Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding pada runtime.

### 14) Peringatan status kanal

Jika gateway sehat, doctor menjalankan probe status kanal dan melaporkan
peringatan beserta perbaikan yang disarankan.

### 15) Audit + perbaikan konfigurasi supervisor

Doctor memeriksa konfigurasi supervisor yang terinstal (launchd/systemd/schtasks) untuk
default yang hilang atau usang (mis., dependensi systemd network-online dan
jeda restart). Ketika menemukan ketidakcocokan, doctor merekomendasikan pembaruan dan dapat
menulis ulang file layanan/task ke default saat ini.

Catatan:

- `openclaw doctor` meminta konfirmasi sebelum menulis ulang konfigurasi supervisor.
- `openclaw doctor --yes` menerima prompt perbaikan default.
- `openclaw doctor --repair` menerapkan perbaikan yang direkomendasikan tanpa prompt.
- `openclaw doctor --repair --force` menimpa konfigurasi supervisor kustom.
- Jika autentikasi token memerlukan token dan `gateway.auth.token` dikelola SecretRef, instalasi/perbaikan layanan doctor memvalidasi SecretRef tetapi tidak mempertahankan nilai token plaintext yang telah diselesaikan ke metadata lingkungan layanan supervisor.
- Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi belum terselesaikan, doctor memblokir jalur instalasi/perbaikan dengan panduan yang dapat ditindaklanjuti.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak diatur, doctor memblokir instalasi/perbaikan sampai mode diatur secara eksplisit.
- Untuk unit Linux user-systemd, pemeriksaan drift token doctor kini mencakup sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata autentikasi layanan.
- Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

### 16) Diagnostik runtime + port Gateway

Doctor memeriksa runtime layanan (PID, status keluar terakhir) dan memperingatkan ketika
layanan terinstal tetapi tidak benar-benar berjalan. Doctor juga memeriksa benturan port
pada port gateway (default `18789`) dan melaporkan kemungkinan penyebabnya (gateway sudah
berjalan, tunnel SSH).

### 17) Best practice runtime Gateway

Doctor memperingatkan ketika layanan gateway berjalan di Bun atau path Node yang dikelola version manager
(`nvm`, `fnm`, `volta`, `asdf`, dll.). Kanal WhatsApp + Telegram memerlukan Node,
dan path version-manager dapat rusak setelah upgrade karena layanan tidak
memuat inisialisasi shell Anda. Doctor menawarkan untuk bermigrasi ke instalasi Node sistem ketika
tersedia (Homebrew/apt/choco).

### 18) Penulisan konfigurasi + metadata wizard

Doctor mempertahankan perubahan konfigurasi apa pun dan memberi stempel metadata wizard untuk mencatat
doctor run.

### 19) Tips workspace (backup + sistem memory)

Doctor menyarankan sistem memory workspace ketika belum ada dan mencetak tip backup
jika workspace belum berada di bawah git.

Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap tentang
struktur workspace dan backup git (disarankan GitHub atau GitLab privat).

## Terkait

- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
- [Runbook Gateway](/id/gateway)
