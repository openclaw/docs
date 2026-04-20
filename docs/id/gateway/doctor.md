---
read_when:
    - Menambahkan atau mengubah migrasi doctor
    - Memperkenalkan perubahan konfigurasi yang merusak
summary: 'Perintah doctor: pemeriksaan kesehatan, migrasi konfigurasi, dan langkah perbaikan'
title: Doctor
x-i18n:
    generated_at: "2026-04-20T09:27:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61a5e01a306058c49be6095f7c8082d779a55d63cf3b5f4c4096173943faf51b
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` adalah alat perbaikan + migrasi untuk OpenClaw. Alat ini memperbaiki
konfigurasi/status yang usang, memeriksa kesehatan, dan menyediakan langkah perbaikan yang dapat ditindaklanjuti.

## Mulai cepat

```bash
openclaw doctor
```

### Headless / otomatisasi

```bash
openclaw doctor --yes
```

Terima nilai default tanpa prompt (termasuk langkah perbaikan restart/layanan/sandbox jika berlaku).

```bash
openclaw doctor --repair
```

Terapkan perbaikan yang direkomendasikan tanpa prompt (perbaikan + restart jika aman).

```bash
openclaw doctor --repair --force
```

Terapkan juga perbaikan agresif (menimpa konfigurasi supervisor kustom).

```bash
openclaw doctor --non-interactive
```

Jalankan tanpa prompt dan hanya terapkan migrasi aman (normalisasi konfigurasi + pemindahan status di disk). Melewati tindakan restart/layanan/sandbox yang memerlukan konfirmasi manusia.
Migrasi status lama berjalan otomatis saat terdeteksi.

```bash
openclaw doctor --deep
```

Pindai layanan sistem untuk instalasi gateway tambahan (launchd/systemd/schtasks).

Jika Anda ingin meninjau perubahan sebelum menulis, buka file konfigurasi terlebih dahulu:

```bash
cat ~/.openclaw/openclaw.json
```

## Apa yang dilakukannya (ringkasan)

- Pembaruan pra-penerbangan opsional untuk instalasi git (hanya interaktif).
- Pemeriksaan kebaruan protokol UI (membangun ulang Control UI saat skema protokol lebih baru).
- Pemeriksaan kesehatan + prompt restart.
- Ringkasan status Skills (memenuhi syarat/tidak ada/terblokir) dan status plugin.
- Normalisasi konfigurasi untuk nilai lama.
- Migrasi konfigurasi Talk dari field datar `talk.*` lama ke `talk.provider` + `talk.providers.<provider>`.
- Pemeriksaan migrasi browser untuk konfigurasi ekstensi Chrome lama dan kesiapan Chrome MCP.
- Peringatan override provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Peringatan shadowing OAuth Codex (`models.providers.openai-codex`).
- Pemeriksaan prasyarat TLS OAuth untuk profil OAuth OpenAI Codex.
- Migrasi status lama di disk (sesi/direktori agent/autentikasi WhatsApp).
- Migrasi kunci kontrak manifest plugin lama (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migrasi penyimpanan Cron lama (`jobId`, `schedule.cron`, field delivery/payload tingkat atas, payload `provider`, pekerjaan fallback Webhook sederhana `notify: true`).
- Inspeksi file kunci sesi dan pembersihan kunci usang.
- Pemeriksaan integritas dan izin status (sesi, transkrip, direktori status).
- Pemeriksaan izin file konfigurasi (`chmod 600`) saat berjalan secara lokal.
- Kesehatan autentikasi model: memeriksa kedaluwarsa OAuth, dapat menyegarkan token yang akan kedaluwarsa, dan melaporkan status cooldown/nonaktif profil autentikasi.
- Deteksi direktori workspace tambahan (`~/openclaw`).
- Perbaikan image sandbox saat sandboxing diaktifkan.
- Migrasi layanan lama dan deteksi gateway tambahan.
- Migrasi status lama channel Matrix (dalam mode `--fix` / `--repair`).
- Pemeriksaan runtime Gateway (layanan terpasang tetapi tidak berjalan; label launchd yang di-cache).
- Peringatan status channel (diprobe dari gateway yang sedang berjalan).
- Audit konfigurasi supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
- Pemeriksaan praktik terbaik runtime Gateway (Node vs Bun, path version manager).
- Diagnostik benturan port Gateway (default `18789`).
- Peringatan keamanan untuk kebijakan DM terbuka.
- Pemeriksaan autentikasi Gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada sumber token; tidak menimpa konfigurasi token SecretRef).
- Deteksi masalah pairing perangkat (permintaan pair pertama kali yang tertunda, peningkatan role/scope yang tertunda, drift cache token perangkat lokal yang usang, dan drift autentikasi paired-record).
- Pemeriksaan linger systemd di Linux.
- Pemeriksaan ukuran file bootstrap workspace (peringatan pemotongan/mendekati batas untuk file konteks).
- Pemeriksaan status shell completion serta instalasi/peningkatan otomatis.
- Pemeriksaan kesiapan provider embedding pencarian memori (model lokal, kunci API jarak jauh, atau biner QMD).
- Pemeriksaan instalasi source (ketidakcocokan workspace pnpm, aset UI yang hilang, biner tsx yang hilang).
- Menulis konfigurasi + metadata wizard yang diperbarui.

## Backfill dan reset UI Dreams

Scene Dreams di Control UI mencakup tindakan **Backfill**, **Reset**, dan **Clear Grounded**
untuk alur grounded dreaming. Tindakan ini menggunakan metode RPC
bergaya doctor gateway, tetapi tindakan ini **bukan** bagian dari perbaikan/migrasi CLI `openclaw doctor`.

Yang dilakukan:

- **Backfill** memindai file `memory/YYYY-MM-DD.md` historis di workspace
  aktif, menjalankan proses diary REM grounded, dan menulis entri backfill yang dapat dibalik ke `DREAMS.md`.
- **Reset** hanya menghapus entri diary backfill yang ditandai tersebut dari `DREAMS.md`.
- **Clear Grounded** hanya menghapus entri jangka pendek khusus grounded yang ditahap
  yang berasal dari replay historis dan belum mengumpulkan recall langsung atau
  dukungan harian.

Yang **tidak** dilakukan sendiri oleh tindakan ini:

- tindakan ini tidak mengedit `MEMORY.md`
- tindakan ini tidak menjalankan migrasi doctor penuh
- tindakan ini tidak otomatis menahapkan kandidat grounded ke penyimpanan promosi jangka pendek langsung
  kecuali Anda secara eksplisit menjalankan jalur CLI yang ditahap terlebih dahulu

Jika Anda ingin replay historis grounded memengaruhi jalur promosi mendalam normal,
gunakan alur CLI sebagai gantinya:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Itu menahapkan kandidat durable grounded ke penyimpanan dreaming jangka pendek sambil
menjaga `DREAMS.md` sebagai permukaan tinjauan.

## Perilaku dan alasan terperinci

### 0) Pembaruan opsional (instalasi git)

Jika ini adalah checkout git dan doctor berjalan secara interaktif, doctor akan menawarkan untuk
memperbarui (fetch/rebase/build) sebelum menjalankan doctor.

### 1) Normalisasi konfigurasi

Jika konfigurasi berisi bentuk nilai lama (misalnya `messages.ackReaction`
tanpa override khusus channel), doctor menormalkannya ke
skema saat ini.

Itu termasuk field datar Talk lama. Konfigurasi Talk publik saat ini adalah
`talk.provider` + `talk.providers.<provider>`. Doctor menulis ulang bentuk lama
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` ke dalam peta provider.

### 2) Migrasi kunci konfigurasi lama

Saat konfigurasi berisi kunci yang sudah usang, perintah lain akan menolak berjalan dan meminta
Anda menjalankan `openclaw doctor`.

Doctor akan:

- Menjelaskan kunci lama mana yang ditemukan.
- Menampilkan migrasi yang diterapkan.
- Menulis ulang `~/.openclaw/openclaw.json` dengan skema yang diperbarui.

Gateway juga otomatis menjalankan migrasi doctor saat startup ketika mendeteksi
format konfigurasi lama, sehingga konfigurasi usang diperbaiki tanpa intervensi manual.
Migrasi penyimpanan pekerjaan Cron ditangani oleh `openclaw doctor --fix`.

Migrasi saat ini:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` tingkat atas
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` lama → `talk.provider` + `talk.providers.<provider>`
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
- Untuk channel dengan `accounts` bernama tetapi masih memiliki nilai channel tingkat atas akun tunggal, pindahkan nilai yang dicakup akun tersebut ke akun yang dipromosikan yang dipilih untuk channel tersebut (`accounts.default` untuk sebagian besar channel; Matrix dapat mempertahankan target bernama/default yang cocok yang sudah ada)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- hapus `browser.relayBindHost` (pengaturan relay ekstensi lama)

Peringatan doctor juga mencakup panduan default akun untuk channel multi-akun:

- Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa routing fallback dapat memilih akun yang tidak diharapkan.
- Jika `channels.<channel>.defaultAccount` diatur ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

### 2b) Override provider OpenCode

Jika Anda menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go`
secara manual, itu akan meng-override katalog OpenCode bawaan dari `@mariozechner/pi-ai`.
Ini dapat memaksa model ke API yang salah atau membuat biaya menjadi nol. Doctor memperingatkan agar Anda
dapat menghapus override tersebut dan memulihkan routing API per-model + biaya.

### 2c) Migrasi browser dan kesiapan Chrome MCP

Jika konfigurasi browser Anda masih menunjuk ke jalur ekstensi Chrome yang telah dihapus, doctor
menormalkannya ke model attach Chrome MCP host-lokal saat ini:

- `browser.profiles.*.driver: "extension"` menjadi `"existing-session"`
- `browser.relayBindHost` dihapus

Doctor juga mengaudit jalur Chrome MCP host-lokal saat Anda menggunakan `defaultProfile:
"user"` atau profil `existing-session` yang dikonfigurasi:

- memeriksa apakah Google Chrome terpasang pada host yang sama untuk profil auto-connect default
- memeriksa versi Chrome yang terdeteksi dan memperingatkan jika di bawah Chrome 144
- mengingatkan Anda untuk mengaktifkan remote debugging di halaman inspect browser (misalnya
  `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  atau `edge://inspect/#remote-debugging`)

Doctor tidak dapat mengaktifkan pengaturan sisi Chrome untuk Anda. Chrome MCP host-lokal
tetap memerlukan:

- browser berbasis Chromium 144+ pada host gateway/node
- browser berjalan secara lokal
- remote debugging diaktifkan di browser tersebut
- menyetujui prompt persetujuan attach pertama di browser

Kesiapan di sini hanya terkait prasyarat attach lokal. Existing-session mempertahankan
batas rute Chrome MCP saat ini; rute lanjutan seperti `responsebody`, ekspor PDF,
intersepsi unduhan, dan tindakan batch tetap memerlukan browser terkelola
atau profil CDP mentah.

Pemeriksaan ini **tidak** berlaku untuk Docker, sandbox, remote-browser, atau alur headless lainnya. Alur tersebut tetap menggunakan CDP mentah.

### 2d) Prasyarat TLS OAuth

Saat profil OAuth OpenAI Codex dikonfigurasi, doctor memeriksa endpoint otorisasi OpenAI
untuk memverifikasi bahwa stack TLS Node/OpenSSL lokal dapat
memvalidasi rantai sertifikat. Jika pemeriksaan gagal dengan kesalahan sertifikat (misalnya
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat self-signed),
doctor mencetak panduan perbaikan khusus platform. Di macOS dengan Node Homebrew,
perbaikannya biasanya `brew postinstall ca-certificates`. Dengan `--deep`, pemeriksaan berjalan
bahkan jika gateway sehat.

### 2c) Override provider OAuth Codex

Jika Anda sebelumnya menambahkan pengaturan transport OpenAI lama di bawah
`models.providers.openai-codex`, pengaturan tersebut dapat membayangi jalur provider
OAuth Codex bawaan yang digunakan otomatis oleh rilis yang lebih baru. Doctor memperingatkan saat melihat
pengaturan transport lama tersebut bersamaan dengan OAuth Codex agar Anda dapat menghapus atau menulis ulang
override transport usang tersebut dan mendapatkan kembali perilaku routing/fallback
bawaan. Proxy kustom dan override khusus header tetap didukung dan tidak
memicu peringatan ini.

### 3) Migrasi status lama (tata letak disk)

Doctor dapat memigrasikan tata letak lama di disk ke struktur saat ini:

- Penyimpanan sesi + transkrip:
  - dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
- Direktori agent:
  - dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
- Status autentikasi WhatsApp (Baileys):
  - dari `~/.openclaw/credentials/*.json` lama (kecuali `oauth.json`)
  - ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID akun default: `default`)

Migrasi ini bersifat best-effort dan idempoten; doctor akan mengeluarkan peringatan saat
meninggalkan folder lama sebagai cadangan. Gateway/CLI juga otomatis memigrasikan
sesi lama + direktori agent saat startup sehingga riwayat/autentikasi/model masuk ke
path per-agent tanpa perlu menjalankan doctor secara manual. Autentikasi WhatsApp sengaja hanya
dimigrasikan melalui `openclaw doctor`. Normalisasi provider/peta provider Talk sekarang
membandingkan berdasarkan kesetaraan struktural, sehingga perbedaan urutan kunci saja tidak lagi memicu
perubahan no-op `doctor --fix` berulang.

### 3a) Migrasi manifest plugin lama

Doctor memindai semua manifest plugin yang terinstal untuk mencari capability tingkat atas yang sudah usang
(`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Saat ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts`
dan menulis ulang file manifest di tempat. Migrasi ini idempoten;
jika kunci `contracts` sudah memiliki nilai yang sama, kunci lama akan dihapus
tanpa menduplikasi data.

### 3b) Migrasi penyimpanan Cron lama

Doctor juga memeriksa penyimpanan pekerjaan Cron (`~/.openclaw/cron/jobs.json` secara default,
atau `cron.store` jika dioverride) untuk bentuk pekerjaan lama yang masih
diterima scheduler demi kompatibilitas.

Pembersihan Cron saat ini mencakup:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- field payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
- field delivery tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias delivery `provider` pada payload → `delivery.channel` eksplisit
- pekerjaan fallback Webhook `notify: true` lama yang sederhana → `delivery.mode="webhook"` eksplisit dengan `delivery.to=cron.webhook`

Doctor hanya memigrasikan otomatis pekerjaan `notify: true` saat dapat melakukannya tanpa
mengubah perilaku. Jika sebuah pekerjaan menggabungkan fallback notify lama dengan mode delivery
non-webhook yang sudah ada, doctor akan memperingatkan dan membiarkan pekerjaan tersebut untuk ditinjau secara manual.

### 3c) Pembersihan kunci sesi

Doctor memindai setiap direktori sesi agent untuk file kunci tulis usang — file yang tertinggal
saat sebuah sesi keluar secara tidak normal. Untuk setiap file kunci yang ditemukan, doctor melaporkan:
path, PID, apakah PID masih hidup, usia kunci, dan apakah kunci tersebut
dianggap usang (PID mati atau lebih lama dari 30 menit). Dalam mode `--fix` / `--repair`,
doctor menghapus file kunci usang secara otomatis; jika tidak, doctor mencetak catatan dan
menginstruksikan Anda untuk menjalankan ulang dengan `--fix`.

### 4) Pemeriksaan integritas status (persistensi sesi, routing, dan keamanan)

Direktori status adalah batang otak operasional. Jika direktori ini hilang, Anda akan kehilangan
sesi, kredensial, log, dan konfigurasi (kecuali Anda memiliki cadangan di tempat lain).

Doctor memeriksa:

- **Direktori status hilang**: memperingatkan tentang kehilangan status yang katastrofik, meminta untuk membuat ulang
  direktori, dan mengingatkan bahwa doctor tidak dapat memulihkan data yang hilang.
- **Izin direktori status**: memverifikasi bahwa direktori dapat ditulis; menawarkan perbaikan izin
  (dan mengeluarkan petunjuk `chown` saat terdeteksi ketidakcocokan owner/group).
- **Direktori status macOS yang disinkronkan cloud**: memperingatkan saat status berada di bawah iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau
  `~/Library/CloudStorage/...` karena path yang didukung sinkronisasi dapat menyebabkan I/O
  lebih lambat dan race lock/sinkronisasi.
- **Direktori status Linux pada SD atau eMMC**: memperingatkan saat status berada pada sumber mount `mmcblk*`,
  karena I/O acak yang didukung SD atau eMMC bisa lebih lambat dan lebih cepat aus
  saat penulisan sesi dan kredensial.
- **Direktori sesi hilang**: `sessions/` dan direktori penyimpanan sesi
  diperlukan untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
- **Ketidakcocokan transkrip**: memperingatkan saat entri sesi terbaru memiliki file
  transkrip yang hilang.
- **Sesi utama “JSONL 1 baris”**: menandai saat transkrip utama hanya memiliki satu
  baris (riwayat tidak terakumulasi).
- **Beberapa direktori status**: memperingatkan saat ada beberapa folder `~/.openclaw` di berbagai
  direktori home atau saat `OPENCLAW_STATE_DIR` menunjuk ke tempat lain (riwayat dapat
  terpecah di beberapa instalasi).
- **Pengingat mode remote**: jika `gateway.mode=remote`, doctor mengingatkan Anda untuk menjalankannya
  di host remote (status berada di sana).
- **Izin file konfigurasi**: memperingatkan jika `~/.openclaw/openclaw.json` dapat dibaca
  oleh group/dunia dan menawarkan untuk memperketatnya menjadi `600`.

### 5) Kesehatan autentikasi model (kedaluwarsa OAuth)

Doctor memeriksa profil OAuth di penyimpanan autentikasi, memperingatkan saat token
akan kedaluwarsa/sudah kedaluwarsa, dan dapat menyegarkannya jika aman. Jika profil
OAuth/token Anthropic usang, doctor menyarankan API key Anthropic atau
jalur setup-token Anthropic.
Prompt penyegaran hanya muncul saat berjalan secara interaktif (TTY); `--non-interactive`
melewati upaya penyegaran.

Saat penyegaran OAuth gagal secara permanen (misalnya `refresh_token_reused`,
`invalid_grant`, atau provider memberi tahu Anda untuk masuk lagi), doctor melaporkan
bahwa autentikasi ulang diperlukan dan mencetak perintah `openclaw models auth login --provider ...`
yang tepat untuk dijalankan.

Doctor juga melaporkan profil autentikasi yang sementara tidak dapat digunakan karena:

- cooldown singkat (batas laju/timeout/kegagalan autentikasi)
- penonaktifan yang lebih lama (kegagalan billing/kredit)

### 6) Validasi model hooks

Jika `hooks.gmail.model` diatur, doctor memvalidasi referensi model terhadap
katalog dan allowlist serta memperingatkan jika referensi tersebut tidak akan ter-resolve atau tidak diizinkan.

### 7) Perbaikan image sandbox

Saat sandboxing diaktifkan, doctor memeriksa image Docker dan menawarkan untuk membangun atau
beralih ke nama lama jika image saat ini tidak ada.

### 7b) Dependensi runtime plugin bawaan

Doctor memverifikasi bahwa dependensi runtime plugin bawaan (misalnya paket runtime plugin
Discord) ada di root instalasi OpenClaw.
Jika ada yang hilang, doctor melaporkan paket tersebut dan menginstalnya dalam
mode `openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migrasi layanan Gateway dan petunjuk pembersihan

Doctor mendeteksi layanan gateway lama (launchd/systemd/schtasks) dan
menawarkan untuk menghapusnya serta menginstal layanan OpenClaw menggunakan port gateway
saat ini. Doctor juga dapat memindai layanan tambahan yang menyerupai gateway dan mencetak petunjuk pembersihan.
Layanan gateway OpenClaw bernama profil dianggap sebagai kelas utama dan tidak
ditandai sebagai "tambahan".

### 8b) Migrasi Matrix saat startup

Saat akun channel Matrix memiliki migrasi status lama yang tertunda atau dapat ditindaklanjuti,
doctor (dalam mode `--fix` / `--repair`) membuat snapshot pra-migrasi lalu
menjalankan langkah migrasi best-effort: migrasi status Matrix lama dan persiapan
status terenkripsi lama. Kedua langkah tidak fatal; kesalahan dicatat dalam log dan
startup tetap berlanjut. Dalam mode hanya-baca (`openclaw doctor` tanpa `--fix`) pemeriksaan ini
dilewati sepenuhnya.

### 8c) Pairing perangkat dan drift autentikasi

Doctor sekarang memeriksa status pairing perangkat sebagai bagian dari pemeriksaan kesehatan normal.

Yang dilaporkan:

- permintaan pairing pertama kali yang tertunda
- peningkatan role yang tertunda untuk perangkat yang sudah dipair
- peningkatan scope yang tertunda untuk perangkat yang sudah dipair
- perbaikan ketidakcocokan kunci publik saat ID perangkat masih cocok tetapi identitas
  perangkat tidak lagi cocok dengan catatan yang disetujui
- catatan pairing yang tidak memiliki token aktif untuk role yang disetujui
- token pairing yang scopenya menyimpang di luar baseline pairing yang disetujui
- entri token perangkat cache lokal untuk mesin saat ini yang lebih lama dari
  rotasi token sisi gateway atau membawa metadata scope yang usang

Doctor tidak otomatis menyetujui permintaan pairing atau otomatis merotasi token perangkat. Doctor
mencetak langkah berikutnya yang tepat:

- periksa permintaan yang tertunda dengan `openclaw devices list`
- setujui permintaan yang tepat dengan `openclaw devices approve <requestId>`
- rotasi token baru dengan `openclaw devices rotate --device <deviceId> --role <role>`
- hapus dan setujui ulang catatan usang dengan `openclaw devices remove <deviceId>`

Ini menutup celah umum "sudah dipair tetapi masih mendapat pairing required":
doctor kini membedakan pairing pertama kali dari peningkatan role/scope yang tertunda
dan dari drift token/identitas perangkat yang usang.

### 9) Peringatan keamanan

Doctor mengeluarkan peringatan saat sebuah provider terbuka untuk DM tanpa allowlist, atau
saat sebuah kebijakan dikonfigurasi dengan cara yang berbahaya.

### 10) Linger systemd (Linux)

Jika berjalan sebagai layanan pengguna systemd, doctor memastikan lingering diaktifkan agar
gateway tetap hidup setelah logout.

### 11) Status workspace (Skills, plugin, dan direktori lama)

Doctor mencetak ringkasan status workspace untuk agent default:

- **Status Skills**: menghitung Skills yang memenuhi syarat, tidak memiliki persyaratan, dan diblokir oleh allowlist.
- **Direktori workspace lama**: memperingatkan saat `~/openclaw` atau direktori workspace lama lainnya
  ada bersama workspace saat ini.
- **Status plugin**: menghitung plugin yang dimuat/dinonaktifkan/error; mencantumkan ID plugin untuk setiap
  error; melaporkan capability plugin bundel.
- **Peringatan kompatibilitas plugin**: menandai plugin yang memiliki masalah kompatibilitas dengan
  runtime saat ini.
- **Diagnostik plugin**: menampilkan peringatan atau error waktu muat yang dikeluarkan oleh
  registri plugin.

### 11b) Ukuran file bootstrap

Doctor memeriksa apakah file bootstrap workspace (misalnya `AGENTS.md`,
`CLAUDE.md`, atau file konteks lain yang diinjeksi) mendekati atau melebihi
anggaran karakter yang dikonfigurasi. Doctor melaporkan jumlah karakter mentah vs. yang diinjeksi per file, persentase
pemotongan, penyebab pemotongan (`max/file` atau `max/total`), dan total karakter yang diinjeksi
sebagai fraksi dari total anggaran. Saat file dipotong atau mendekati
batas, doctor mencetak tips untuk menyesuaikan `agents.defaults.bootstrapMaxChars`
dan `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Shell completion

Doctor memeriksa apakah tab completion terinstal untuk shell saat ini
(zsh, bash, fish, atau PowerShell):

- Jika profil shell menggunakan pola completion dinamis yang lambat
  (`source <(openclaw completion ...)`), doctor meningkatkannya ke varian file cache
  yang lebih cepat.
- Jika completion dikonfigurasi di profil tetapi file cache hilang,
  doctor meregenerasi cache secara otomatis.
- Jika completion sama sekali tidak dikonfigurasi, doctor meminta untuk menginstalnya
  (hanya mode interaktif; dilewati dengan `--non-interactive`).

Jalankan `openclaw completion --write-state` untuk meregenerasi cache secara manual.

### 12) Pemeriksaan autentikasi Gateway (token lokal)

Doctor memeriksa kesiapan autentikasi token gateway lokal.

- Jika mode token memerlukan token dan tidak ada sumber token, doctor menawarkan untuk membuatnya.
- Jika `gateway.auth.token` dikelola oleh SecretRef tetapi tidak tersedia, doctor memperingatkan dan tidak menimpanya dengan teks biasa.
- `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya jika tidak ada SecretRef token yang dikonfigurasi.

### 12b) Perbaikan hanya-baca yang sadar SecretRef

Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku fail-fast runtime.

- `openclaw doctor --fix` sekarang menggunakan model ringkasan SecretRef hanya-baca yang sama seperti perintah keluarga status untuk perbaikan konfigurasi yang ditargetkan.
- Contoh: perbaikan Telegram `allowFrom` / `groupAllowFrom` `@username` mencoba menggunakan kredensial bot yang dikonfigurasi jika tersedia.
- Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia pada jalur perintah saat ini, doctor melaporkan bahwa kredensial tersebut dikonfigurasi-tetapi-tidak-tersedia dan melewati resolusi otomatis alih-alih crash atau salah melaporkan token sebagai hilang.

### 13) Pemeriksaan kesehatan Gateway + restart

Doctor menjalankan pemeriksaan kesehatan dan menawarkan untuk me-restart gateway saat
terlihat tidak sehat.

### 13b) Kesiapan pencarian memori

Doctor memeriksa apakah provider embedding pencarian memori yang dikonfigurasi siap
untuk agent default. Perilakunya bergantung pada backend dan provider yang dikonfigurasi:

- **Backend QMD**: memeriksa apakah biner `qmd` tersedia dan dapat dijalankan.
  Jika tidak, doctor mencetak panduan perbaikan termasuk paket npm dan opsi path biner manual.
- **Provider lokal eksplisit**: memeriksa file model lokal atau URL model remote/yang dapat diunduh
  yang dikenali. Jika tidak ada, doctor menyarankan beralih ke provider remote.
- **Provider remote eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa API key
  ada di environment atau penyimpanan autentikasi. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika tidak ada.
- **Provider otomatis**: memeriksa ketersediaan model lokal terlebih dahulu, lalu mencoba setiap provider remote
  sesuai urutan auto-selection.

Saat hasil probe gateway tersedia (gateway sehat pada saat
pemeriksaan), doctor mencocokkan hasilnya dengan konfigurasi yang terlihat oleh CLI dan mencatat
setiap ketidaksesuaian.

Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

### 14) Peringatan status channel

Jika gateway sehat, doctor menjalankan probe status channel dan melaporkan
peringatan dengan perbaikan yang disarankan.

### 15) Audit konfigurasi supervisor + perbaikan

Doctor memeriksa konfigurasi supervisor terinstal (launchd/systemd/schtasks) untuk
default yang hilang atau usang (misalnya dependensi network-online systemd dan
delay restart). Saat menemukan ketidaksesuaian, doctor merekomendasikan pembaruan dan dapat
menulis ulang file layanan/tugas ke default saat ini.

Catatan:

- `openclaw doctor` meminta konfirmasi sebelum menulis ulang konfigurasi supervisor.
- `openclaw doctor --yes` menerima prompt perbaikan default.
- `openclaw doctor --repair` menerapkan perbaikan yang direkomendasikan tanpa prompt.
- `openclaw doctor --repair --force` menimpa konfigurasi supervisor kustom.
- Jika autentikasi token memerlukan token dan `gateway.auth.token` dikelola oleh SecretRef, jalur instalasi/perbaikan layanan doctor memvalidasi SecretRef tetapi tidak menyimpan nilai token teks biasa yang telah di-resolve ke metadata environment layanan supervisor.
- Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi tidak ter-resolve, doctor memblokir jalur instalasi/perbaikan dengan panduan yang dapat ditindaklanjuti.
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak diatur, doctor memblokir instalasi/perbaikan sampai mode diatur secara eksplisit.
- Untuk unit user-systemd Linux, pemeriksaan drift token doctor sekarang mencakup sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata autentikasi layanan.
- Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

### 16) Diagnostik runtime + port Gateway

Doctor memeriksa runtime layanan (PID, status keluar terakhir) dan memperingatkan saat
layanan terinstal tetapi sebenarnya tidak berjalan. Doctor juga memeriksa benturan port
pada port gateway (default `18789`) dan melaporkan kemungkinan penyebabnya (gateway sudah
berjalan, tunnel SSH).

### 17) Praktik terbaik runtime Gateway

Doctor memperingatkan saat layanan gateway berjalan di Bun atau pada path Node yang dikelola version manager
(`nvm`, `fnm`, `volta`, `asdf`, dll.). Channel WhatsApp + Telegram memerlukan Node,
dan path version manager dapat rusak setelah upgrade karena layanan tidak
memuat init shell Anda. Doctor menawarkan untuk memigrasikan ke instalasi Node sistem jika
tersedia (Homebrew/apt/choco).

### 18) Penulisan konfigurasi + metadata wizard

Doctor menyimpan semua perubahan konfigurasi dan memberi cap metadata wizard untuk mencatat
jalannya doctor.

### 19) Tips workspace (cadangan + sistem memori)

Doctor menyarankan sistem memori workspace jika belum ada dan mencetak tip pencadangan
jika workspace belum berada di bawah git.

Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap tentang
struktur workspace dan pencadangan git (disarankan GitHub atau GitLab privat).
