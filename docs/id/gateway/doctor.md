---
read_when:
    - Menambahkan atau mengubah migrasi doctor
    - Memperkenalkan perubahan konfigurasi yang bersifat breaking
summary: 'Perintah Doctor: pemeriksaan kesehatan, migrasi konfigurasi, dan langkah perbaikan'
title: Doctor
x-i18n:
    generated_at: "2026-04-08T02:15:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3761a222d9db7088f78215575fa84e5896794ad701aa716e8bf9039a4424dca6
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` adalah alat perbaikan + migrasi untuk OpenClaw. Alat ini memperbaiki
config/status yang usang, memeriksa kesehatan, dan memberikan langkah perbaikan yang dapat ditindaklanjuti.

## Mulai cepat

```bash
openclaw doctor
```

### Headless / otomatisasi

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

Terapkan juga perbaikan agresif (menimpa config supervisor kustom).

```bash
openclaw doctor --non-interactive
```

Jalankan tanpa prompt dan hanya terapkan migrasi yang aman (normalisasi config + pemindahan state di disk). Melewati tindakan restart/layanan/sandbox yang memerlukan konfirmasi manusia.
Migrasi state lama berjalan otomatis saat terdeteksi.

```bash
openclaw doctor --deep
```

Pindai layanan sistem untuk instalasi gateway tambahan (launchd/systemd/schtasks).

Jika Anda ingin meninjau perubahan sebelum menulis, buka dulu file config:

```bash
cat ~/.openclaw/openclaw.json
```

## Apa yang dilakukan (ringkasan)

- Pembaruan pra-penerbangan opsional untuk instalasi git (hanya interaktif).
- Pemeriksaan kebaruan protokol UI (membangun ulang Control UI ketika skema protokol lebih baru).
- Pemeriksaan kesehatan + prompt restart.
- Ringkasan status Skills (eligible/missing/blocked) dan status plugin.
- Normalisasi config untuk nilai lama.
- Migrasi config Talk dari field datar lama `talk.*` ke `talk.provider` + `talk.providers.<provider>`.
- Pemeriksaan migrasi browser untuk config ekstensi Chrome lama dan kesiapan Chrome MCP.
- Peringatan override provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Peringatan shadowing OAuth Codex (`models.providers.openai-codex`).
- Pemeriksaan prasyarat TLS OAuth untuk profil OAuth OpenAI Codex.
- Migrasi state lama di disk (sessions/agent dir/auth WhatsApp).
- Migrasi key kontrak manifest plugin lama (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migrasi penyimpanan cron lama (`jobId`, `schedule.cron`, field delivery/payload tingkat atas, payload `provider`, job fallback webhook sederhana `notify: true`).
- Inspeksi file lock sesi dan pembersihan lock usang.
- Pemeriksaan integritas state dan izin akses (sessions, transcript, state dir).
- Pemeriksaan izin file config (chmod 600) saat berjalan secara lokal.
- Kesehatan auth model: memeriksa kedaluwarsa OAuth, dapat me-refresh token yang akan kedaluwarsa, dan melaporkan status cooldown/nonaktif profil auth.
- Deteksi direktori workspace tambahan (`~/openclaw`).
- Perbaikan image sandbox saat sandboxing diaktifkan.
- Migrasi layanan lama dan deteksi gateway tambahan.
- Migrasi state lama channel Matrix (dalam mode `--fix` / `--repair`).
- Pemeriksaan runtime gateway (layanan terinstal tetapi tidak berjalan; label launchd yang di-cache).
- Peringatan status channel (diprobe dari gateway yang sedang berjalan).
- Audit config supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
- Pemeriksaan praktik terbaik runtime gateway (Node vs Bun, path version manager).
- Diagnostik benturan port gateway (default `18789`).
- Peringatan keamanan untuk kebijakan DM yang terbuka.
- Pemeriksaan auth gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada sumber token; tidak menimpa config token SecretRef).
- Pemeriksaan `linger` systemd di Linux.
- Pemeriksaan ukuran file bootstrap workspace (peringatan pemotongan/hampir batas untuk file konteks).
- Pemeriksaan status shell completion dan auto-install/upgrade.
- Pemeriksaan kesiapan provider embedding memory search (model lokal, API key jarak jauh, atau biner QMD).
- Pemeriksaan instalasi sumber (ketidakcocokan workspace pnpm, aset UI hilang, biner tsx hilang).
- Menulis config yang diperbarui + metadata wizard.

## Perilaku rinci dan alasannya

### 0) Pembaruan opsional (instalasi git)

Jika ini adalah checkout git dan doctor berjalan secara interaktif, doctor akan menawarkan
untuk memperbarui (fetch/rebase/build) sebelum menjalankan doctor.

### 1) Normalisasi config

Jika config berisi bentuk nilai lama (misalnya `messages.ackReaction`
tanpa override spesifik channel), doctor menormalkannya ke skema
saat ini.

Itu termasuk field datar Talk lama. Config Talk publik saat ini adalah
`talk.provider` + `talk.providers.<provider>`. Doctor menulis ulang bentuk lama
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` ke dalam peta provider.

### 2) Migrasi key config lama

Saat config berisi key yang sudah tidak digunakan lagi, perintah lain akan menolak berjalan dan meminta
Anda untuk menjalankan `openclaw doctor`.

Doctor akan:

- Menjelaskan key lama mana yang ditemukan.
- Menampilkan migrasi yang diterapkannya.
- Menulis ulang `~/.openclaw/openclaw.json` dengan skema yang diperbarui.

Gateway juga otomatis menjalankan migrasi doctor saat startup ketika mendeteksi
format config lama, sehingga config usang diperbaiki tanpa intervensi manual.
Migrasi penyimpanan job cron ditangani oleh `openclaw doctor --fix`.

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
- Untuk channel dengan `accounts` bernama tetapi masih memiliki nilai channel tingkat atas single-account, pindahkan nilai dengan cakupan akun tersebut ke akun yang dipromosikan yang dipilih untuk channel itu (`accounts.default` untuk sebagian besar channel; Matrix dapat mempertahankan target bernama/default yang cocok yang sudah ada)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- hapus `browser.relayBindHost` (pengaturan relay ekstensi lama)

Peringatan doctor juga mencakup panduan default akun untuk channel multi-akun:

- Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa routing fallback dapat memilih akun yang tidak diharapkan.
- Jika `channels.<channel>.defaultAccount` disetel ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

### 2b) Override provider OpenCode

Jika Anda menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go`
secara manual, itu akan menimpa katalog OpenCode bawaan dari `@mariozechner/pi-ai`.
Hal itu dapat memaksa model ke API yang salah atau membuat biaya menjadi nol. Doctor memperingatkan agar Anda
dapat menghapus override tersebut dan memulihkan routing API + biaya per model.

### 2c) Migrasi browser dan kesiapan Chrome MCP

Jika config browser Anda masih menunjuk ke jalur ekstensi Chrome yang sudah dihapus, doctor
menormalkannya ke model attach Chrome MCP lokal-host saat ini:

- `browser.profiles.*.driver: "extension"` menjadi `"existing-session"`
- `browser.relayBindHost` dihapus

Doctor juga mengaudit jalur Chrome MCP lokal-host saat Anda menggunakan `defaultProfile:
"user"` atau profil `existing-session` yang dikonfigurasi:

- memeriksa apakah Google Chrome terinstal pada host yang sama untuk profil
  auto-connect default
- memeriksa versi Chrome yang terdeteksi dan memperingatkan jika di bawah Chrome 144
- mengingatkan Anda untuk mengaktifkan remote debugging di halaman inspect browser (misalnya
  `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  atau `edge://inspect/#remote-debugging`)

Doctor tidak dapat mengaktifkan pengaturan sisi Chrome untuk Anda. Chrome MCP lokal-host
tetap memerlukan:

- browser berbasis Chromium 144+ pada host gateway/node
- browser berjalan secara lokal
- remote debugging diaktifkan pada browser tersebut
- menyetujui prompt persetujuan attach pertama di browser

Kesiapan di sini hanya tentang prasyarat attach lokal. Existing-session mempertahankan
batas rute Chrome MCP saat ini; rute lanjutan seperti `responsebody`, ekspor PDF,
intersepsi unduhan, dan tindakan batch tetap memerlukan browser terkelola
atau profil CDP mentah.

Pemeriksaan ini **tidak** berlaku untuk Docker, sandbox, remote-browser, atau alur
headless lainnya. Alur tersebut tetap menggunakan CDP mentah.

### 2d) Prasyarat TLS OAuth

Saat profil OAuth OpenAI Codex dikonfigurasi, doctor mem-probe endpoint otorisasi OpenAI
untuk memverifikasi bahwa stack TLS Node/OpenSSL lokal dapat
memvalidasi rantai sertifikat. Jika probe gagal dengan kesalahan sertifikat (misalnya
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat self-signed),
doctor mencetak panduan perbaikan spesifik platform. Di macOS dengan Homebrew Node,
perbaikannya biasanya `brew postinstall ca-certificates`. Dengan `--deep`, probe dijalankan
bahkan jika gateway sehat.

### 2c) Override provider OAuth Codex

Jika sebelumnya Anda menambahkan pengaturan transport OpenAI lama di bawah
`models.providers.openai-codex`, pengaturan tersebut dapat membayangi jalur
provider OAuth Codex bawaan yang digunakan rilis lebih baru secara otomatis. Doctor memperingatkan saat melihat
pengaturan transport lama tersebut bersamaan dengan OAuth Codex agar Anda dapat menghapus atau menulis ulang
override transport usang dan mendapatkan kembali perilaku routing/fallback bawaan.
Proxy kustom dan override header-only tetap didukung dan tidak
memicu peringatan ini.

### 3) Migrasi state lama (tata letak disk)

Doctor dapat memigrasikan tata letak lama di disk ke struktur saat ini:

- Penyimpanan sesi + transcript:
  - dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
- Direktori agent:
  - dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
- State auth WhatsApp (Baileys):
  - dari `~/.openclaw/credentials/*.json` lama (kecuali `oauth.json`)
  - ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID akun default: `default`)

Migrasi ini bersifat best-effort dan idempoten; doctor akan mengeluarkan peringatan saat
masih menyisakan folder lama sebagai cadangan. Gateway/CLI juga memigrasikan otomatis
sesi lama + direktori agent saat startup sehingga riwayat/auth/model berada di
jalur per-agent tanpa perlu menjalankan doctor secara manual. Auth WhatsApp sengaja hanya
dimigrasikan melalui `openclaw doctor`. Normalisasi Talk provider/peta provider kini
membandingkan dengan kesetaraan struktural, sehingga perbedaan urutan key saja tidak lagi memicu
perubahan no-op `doctor --fix` yang berulang.

### 3a) Migrasi manifest plugin lama

Doctor memindai semua manifest plugin yang terinstal untuk key kapabilitas tingkat atas yang sudah usang
(`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Saat ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts`
dan menulis ulang file manifest secara langsung. Migrasi ini idempoten;
jika key `contracts` sudah memiliki nilai yang sama, key lama akan dihapus
tanpa menduplikasi data.

### 3b) Migrasi penyimpanan cron lama

Doctor juga memeriksa penyimpanan job cron (`~/.openclaw/cron/jobs.json` secara default,
atau `cron.store` bila dioverride) untuk bentuk job lama yang masih
diterima scheduler demi kompatibilitas.

Pembersihan cron saat ini mencakup:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- field payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
- field delivery tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias delivery `provider` payload → `delivery.channel` yang eksplisit
- job fallback webhook lama sederhana `notify: true` → `delivery.mode="webhook"` yang eksplisit dengan `delivery.to=cron.webhook`

Doctor hanya memigrasikan otomatis job `notify: true` bila dapat dilakukan tanpa
mengubah perilaku. Jika sebuah job menggabungkan fallback notify lama dengan mode
delivery non-webhook yang sudah ada, doctor akan memperingatkan dan membiarkan job itu untuk ditinjau manual.

### 3c) Pembersihan lock sesi

Doctor memindai setiap direktori sesi agent untuk file write-lock usang — file yang tertinggal
ketika sebuah sesi berakhir secara abnormal. Untuk setiap file lock yang ditemukan, doctor melaporkan:
path, PID, apakah PID masih hidup, usia lock, dan apakah
dianggap usang (PID mati atau lebih lama dari 30 menit). Dalam mode `--fix` / `--repair`
doctor menghapus file lock usang secara otomatis; jika tidak, doctor mencetak catatan dan
menginstruksikan Anda untuk menjalankan ulang dengan `--fix`.

### 4) Pemeriksaan integritas state (persistensi sesi, routing, dan keamanan)

Direktori state adalah pusat operasional. Jika hilang, Anda akan kehilangan
sesi, kredensial, log, dan config (kecuali jika Anda memiliki cadangan di tempat lain).

Doctor memeriksa:

- **Direktori state hilang**: memperingatkan tentang kehilangan state yang katastrofik, meminta untuk membuat ulang
  direktori, dan mengingatkan bahwa doctor tidak dapat memulihkan data yang hilang.
- **Izin direktori state**: memverifikasi dapat ditulisi; menawarkan untuk memperbaiki izin
  (dan mengeluarkan petunjuk `chown` saat terdeteksi ketidakcocokan owner/group).
- **Direktori state tersinkron cloud macOS**: memperingatkan saat state berada di bawah iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau
  `~/Library/CloudStorage/...` karena path berbasis sinkronisasi dapat menyebabkan I/O lebih lambat
  dan race lock/sinkronisasi.
- **Direktori state pada SD atau eMMC Linux**: memperingatkan saat state berada pada sumber mount `mmcblk*`,
  karena random I/O berbasis SD atau eMMC bisa lebih lambat dan lebih cepat aus
  akibat penulisan sesi dan kredensial.
- **Direktori sesi hilang**: `sessions/` dan direktori penyimpanan sesi diperlukan
  untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
- **Ketidakcocokan transcript**: memperingatkan saat entri sesi terbaru memiliki
  file transcript yang hilang.
- **Sesi utama “1-line JSONL”**: menandai saat transcript utama hanya memiliki satu
  baris (riwayat tidak bertambah).
- **Beberapa direktori state**: memperingatkan saat ada beberapa folder `~/.openclaw` di
  berbagai home directory atau saat `OPENCLAW_STATE_DIR` menunjuk ke tempat lain (riwayat dapat terbelah antar instalasi).
- **Pengingat mode remote**: jika `gateway.mode=remote`, doctor mengingatkan Anda untuk menjalankannya
  di host remote (state berada di sana).
- **Izin file config**: memperingatkan jika `~/.openclaw/openclaw.json` dapat dibaca
  oleh group/world dan menawarkan untuk mengetatkannya ke `600`.

### 5) Kesehatan auth model (kedaluwarsa OAuth)

Doctor memeriksa profil OAuth dalam penyimpanan auth, memperingatkan saat token
akan kedaluwarsa/sudah kedaluwarsa, dan dapat me-refresh-nya bila aman. Jika profil
OAuth/token Anthropic usang, doctor menyarankan Anthropic API key atau
jalur setup-token Anthropic.
Prompt refresh hanya muncul saat berjalan secara interaktif (TTY); `--non-interactive`
melewati upaya refresh.

Doctor juga melaporkan profil auth yang sementara tidak dapat digunakan karena:

- cooldown singkat (rate limit/timeout/kegagalan auth)
- penonaktifan yang lebih lama (kegagalan billing/kredit)

### 6) Validasi model hooks

Jika `hooks.gmail.model` disetel, doctor memvalidasi referensi model terhadap
katalog dan allowlist serta memperingatkan bila model tidak akan ter-resolve atau tidak diizinkan.

### 7) Perbaikan image sandbox

Saat sandboxing diaktifkan, doctor memeriksa image Docker dan menawarkan untuk membangun atau
beralih ke nama lama jika image saat ini tidak ada.

### 7b) Dependensi runtime plugin bawaan

Doctor memverifikasi bahwa dependensi runtime plugin bawaan (misalnya paket
runtime plugin Discord) ada di root instalasi OpenClaw.
Jika ada yang hilang, doctor melaporkan paket tersebut dan menginstalnya dalam
mode `openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migrasi layanan gateway dan petunjuk pembersihan

Doctor mendeteksi layanan gateway lama (launchd/systemd/schtasks) dan
menawarkan untuk menghapusnya serta menginstal layanan OpenClaw menggunakan port gateway
saat ini. Doctor juga dapat memindai layanan tambahan yang mirip gateway dan mencetak petunjuk pembersihan.
Layanan gateway OpenClaw bernama profil dianggap kelas satu dan tidak
ditandai sebagai "tambahan."

### 8b) Migrasi Matrix saat startup

Saat akun channel Matrix memiliki migrasi state lama yang tertunda atau dapat ditindaklanjuti,
doctor (dalam mode `--fix` / `--repair`) membuat snapshot pra-migrasi lalu
menjalankan langkah migrasi best-effort: migrasi state Matrix lama dan persiapan state terenkripsi lama.
Kedua langkah bersifat non-fatal; error dicatat dan startup berlanjut. Dalam mode read-only (`openclaw doctor` tanpa `--fix`) pemeriksaan
ini dilewati sepenuhnya.

### 9) Peringatan keamanan

Doctor mengeluarkan peringatan saat sebuah provider terbuka untuk DM tanpa allowlist, atau
saat suatu kebijakan dikonfigurasi dengan cara yang berbahaya.

### 10) `linger` systemd (Linux)

Jika berjalan sebagai layanan pengguna systemd, doctor memastikan lingering diaktifkan agar
gateway tetap hidup setelah logout.

### 11) Status workspace (Skills, plugin, dan direktori lama)

Doctor mencetak ringkasan state workspace untuk agent default:

- **Status Skills**: menghitung skill yang eligible, missing-requirements, dan allowlist-blocked.
- **Direktori workspace lama**: memperingatkan saat `~/openclaw` atau direktori workspace lama lainnya
  ada berdampingan dengan workspace saat ini.
- **Status plugin**: menghitung plugin loaded/disabled/errored; mencantumkan ID plugin untuk setiap
  error; melaporkan kapabilitas bundled plugin.
- **Peringatan kompatibilitas plugin**: menandai plugin yang memiliki masalah kompatibilitas dengan
  runtime saat ini.
- **Diagnostik plugin**: menampilkan peringatan atau error waktu muat yang dikeluarkan oleh
  registry plugin.

### 11b) Ukuran file bootstrap

Doctor memeriksa apakah file bootstrap workspace (misalnya `AGENTS.md`,
`CLAUDE.md`, atau file konteks lain yang diinjeksi) mendekati atau melebihi
anggaran karakter yang dikonfigurasi. Doctor melaporkan jumlah karakter mentah vs. yang diinjeksi per file, persentase
pemotongan, penyebab pemotongan (`max/file` atau `max/total`), dan total karakter
yang diinjeksi sebagai bagian dari total anggaran. Saat file dipotong atau mendekati
batas, doctor mencetak tips untuk menyesuaikan `agents.defaults.bootstrapMaxChars`
dan `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Shell completion

Doctor memeriksa apakah tab completion terinstal untuk shell saat ini
(zsh, bash, fish, atau PowerShell):

- Jika profil shell menggunakan pola dynamic completion yang lambat
  (`source <(openclaw completion ...)`), doctor meng-upgrade-nya ke
  varian file cache yang lebih cepat.
- Jika completion dikonfigurasi di profil tetapi file cache tidak ada,
  doctor meregenerasi cache secara otomatis.
- Jika tidak ada completion yang dikonfigurasi sama sekali, doctor meminta untuk menginstalnya
  (hanya mode interaktif; dilewati dengan `--non-interactive`).

Jalankan `openclaw completion --write-state` untuk meregenerasi cache secara manual.

### 12) Pemeriksaan auth gateway (token lokal)

Doctor memeriksa kesiapan auth token gateway lokal.

- Jika mode token membutuhkan token dan tidak ada sumber token, doctor menawarkan untuk membuatnya.
- Jika `gateway.auth.token` dikelola SecretRef tetapi tidak tersedia, doctor memperingatkan dan tidak menimpanya dengan plaintext.
- `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya saat tidak ada token SecretRef yang dikonfigurasi.

### 12b) Perbaikan read-only yang sadar SecretRef

Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku fail-fast runtime.

- `openclaw doctor --fix` kini menggunakan model ringkasan SecretRef read-only yang sama seperti keluarga perintah status untuk perbaikan config yang ditargetkan.
- Contoh: perbaikan Telegram `allowFrom` / `groupAllowFrom` `@username` mencoba menggunakan kredensial bot yang dikonfigurasi jika tersedia.
- Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia di jalur perintah saat ini, doctor melaporkan bahwa kredensial dikonfigurasi-tetapi-tidak-tersedia dan melewati auto-resolution alih-alih crash atau salah melaporkan token sebagai hilang.

### 13) Pemeriksaan kesehatan gateway + restart

Doctor menjalankan pemeriksaan kesehatan dan menawarkan untuk me-restart gateway saat gateway terlihat
tidak sehat.

### 13b) Kesiapan memory search

Doctor memeriksa apakah provider embedding memory search yang dikonfigurasi siap
untuk agent default. Perilakunya bergantung pada backend dan provider yang dikonfigurasi:

- **Backend QMD**: mem-probe apakah biner `qmd` tersedia dan dapat dijalankan.
  Jika tidak, doctor mencetak panduan perbaikan termasuk paket npm dan opsi path biner manual.
- **Provider lokal eksplisit**: memeriksa file model lokal atau URL model
  jarak jauh/dapat diunduh yang dikenali. Jika tidak ada, doctor menyarankan beralih ke provider jarak jauh.
- **Provider jarak jauh eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa API key
  ada di environment atau penyimpanan auth. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika tidak ada.
- **Provider otomatis**: memeriksa ketersediaan model lokal terlebih dahulu, lalu mencoba setiap provider
  jarak jauh sesuai urutan auto-selection.

Saat hasil probe gateway tersedia (gateway sehat pada saat
pemeriksaan), doctor mereferensikan silang hasilnya dengan config yang terlihat oleh CLI dan mencatat
setiap ketidaksesuaian.

Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

### 14) Peringatan status channel

Jika gateway sehat, doctor menjalankan probe status channel dan melaporkan
peringatan beserta saran perbaikan.

### 15) Audit + perbaikan config supervisor

Doctor memeriksa config supervisor yang terinstal (launchd/systemd/schtasks) untuk
default yang hilang atau usang (misalnya dependensi systemd network-online dan
jeda restart). Saat menemukan ketidakcocokan, doctor merekomendasikan pembaruan dan dapat
menulis ulang file layanan/task ke default saat ini.

Catatan:

- `openclaw doctor` meminta konfirmasi sebelum menulis ulang config supervisor.
- `openclaw doctor --yes` menerima prompt perbaikan default.
- `openclaw doctor --repair` menerapkan perbaikan yang direkomendasikan tanpa prompt.
- `openclaw doctor --repair --force` menimpa config supervisor kustom.
- Jika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, jalur instalasi/perbaikan layanan doctor memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang telah di-resolve ke metadata environment layanan supervisor.
- Jika auth token memerlukan token dan token SecretRef yang dikonfigurasi tidak ter-resolve, doctor memblokir jalur instalasi/perbaikan dengan panduan yang dapat ditindaklanjuti.
- Jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi dan `gateway.auth.mode` tidak disetel, doctor memblokir instalasi/perbaikan sampai mode disetel secara eksplisit.
- Untuk unit user-systemd Linux, pemeriksaan drift token doctor kini mencakup sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata auth layanan.
- Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

### 16) Diagnostik runtime + port gateway

Doctor memeriksa runtime layanan (PID, status keluar terakhir) dan memperingatkan saat
layanan terinstal tetapi sebenarnya tidak berjalan. Doctor juga memeriksa benturan port
pada port gateway (default `18789`) dan melaporkan kemungkinan penyebabnya (gateway sudah
berjalan, tunnel SSH).

### 17) Praktik terbaik runtime gateway

Doctor memperingatkan saat layanan gateway berjalan di Bun atau path Node yang dikelola version manager
(`nvm`, `fnm`, `volta`, `asdf`, dll.). Channel WhatsApp + Telegram memerlukan Node,
dan path version manager dapat rusak setelah upgrade karena layanan tidak
memuat init shell Anda. Doctor menawarkan untuk memigrasikan ke instalasi Node sistem saat
tersedia (Homebrew/apt/choco).

### 18) Penulisan config + metadata wizard

Doctor menyimpan perubahan config dan menandai metadata wizard untuk mencatat
jalannya doctor.

### 19) Tips workspace (cadangan + sistem memori)

Doctor menyarankan sistem memori workspace bila belum ada dan mencetak tip cadangan
jika workspace belum berada di bawah git.

Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap tentang
struktur workspace dan cadangan git (disarankan GitHub atau GitLab privat).
