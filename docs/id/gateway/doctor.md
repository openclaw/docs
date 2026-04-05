---
read_when:
    - Menambahkan atau mengubah migrasi doctor
    - Memperkenalkan perubahan konfigurasi yang breaking
summary: 'Perintah Doctor: pemeriksaan kesehatan, migrasi konfigurasi, dan langkah perbaikan'
title: Doctor
x-i18n:
    generated_at: "2026-04-05T13:54:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 119080ef6afe1b14382a234f844ea71336923355d991fe6d816fddc6c83cf88f
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` adalah alat perbaikan + migrasi untuk OpenClaw. Alat ini memperbaiki
konfigurasi/state yang usang, memeriksa kesehatan, dan menyediakan langkah perbaikan yang dapat ditindaklanjuti.

## Mulai cepat

```bash
openclaw doctor
```

### Headless / otomatisasi

```bash
openclaw doctor --yes
```

Terima default tanpa prompt (termasuk langkah perbaikan restart/layanan/sandbox jika berlaku).

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

Jalankan tanpa prompt dan hanya terapkan migrasi aman (normalisasi konfigurasi + pemindahan state di disk). Melewati tindakan restart/layanan/sandbox yang memerlukan konfirmasi manusia.
Migrasi state lama berjalan otomatis saat terdeteksi.

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
- Normalisasi konfigurasi untuk nilai lama.
- Migrasi konfigurasi Talk dari field datar lama `talk.*` ke `talk.provider` + `talk.providers.<provider>`.
- Pemeriksaan migrasi browser untuk konfigurasi ekstensi Chrome lama dan kesiapan Chrome MCP.
- Peringatan override provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Pemeriksaan prasyarat OAuth TLS untuk profil OAuth OpenAI Codex.
- Migrasi state lama di disk (sesi/direktori agen/auth WhatsApp).
- Migrasi kunci kontrak manifest plugin lama (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migrasi penyimpanan cron lama (`jobId`, `schedule.cron`, field delivery/payload tingkat atas, payload `provider`, pekerjaan fallback webhook sederhana `notify: true`).
- Pemeriksaan file lock sesi dan pembersihan lock usang.
- Pemeriksaan integritas dan izin state (sesi, transkrip, direktori state).
- Pemeriksaan izin file konfigurasi (chmod 600) saat berjalan secara lokal.
- Kesehatan auth model: memeriksa kedaluwarsa OAuth, dapat me-refresh token yang akan kedaluwarsa, dan melaporkan status cooldown/nonaktif profil auth.
- Deteksi direktori workspace tambahan (`~/openclaw`).
- Perbaikan image sandbox saat sandboxing diaktifkan.
- Migrasi layanan lama dan deteksi gateway tambahan.
- Migrasi state lama channel Matrix (dalam mode `--fix` / `--repair`).
- Pemeriksaan runtime gateway (layanan terpasang tetapi tidak berjalan; label launchd cache).
- Peringatan status channel (diprobe dari gateway yang sedang berjalan).
- Audit konfigurasi supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
- Pemeriksaan praktik terbaik runtime gateway (Node vs Bun, path version manager).
- Diagnostik bentrokan port gateway (default `18789`).
- Peringatan keamanan untuk kebijakan DM terbuka.
- Pemeriksaan auth gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada sumber token; tidak menimpa konfigurasi token SecretRef).
- Pemeriksaan linger systemd di Linux.
- Pemeriksaan ukuran file bootstrap workspace (peringatan pemotongan/hampir batas untuk file konteks).
- Pemeriksaan status shell completion dan auto-install/upgrade.
- Pemeriksaan kesiapan provider embedding pencarian memori (model lokal, kunci API remote, atau biner QMD).
- Pemeriksaan instalasi sumber (ketidakcocokan workspace pnpm, aset UI hilang, biner tsx hilang).
- Menulis konfigurasi yang diperbarui + metadata wizard.

## Perilaku rinci dan alasannya

### 0) Pembaruan opsional (instalasi git)

Jika ini adalah checkout git dan doctor berjalan secara interaktif, doctor menawarkan untuk
memperbarui (fetch/rebase/build) sebelum menjalankan doctor.

### 1) Normalisasi konfigurasi

Jika konfigurasi berisi bentuk nilai lama (misalnya `messages.ackReaction`
tanpa override spesifik channel), doctor menormalisasinya ke skema saat ini.

Itu mencakup field datar Talk lama. Konfigurasi Talk publik saat ini adalah
`talk.provider` + `talk.providers.<provider>`. Doctor menulis ulang bentuk lama
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` ke peta provider.

### 2) Migrasi kunci konfigurasi lama

Saat konfigurasi berisi kunci yang sudah usang, perintah lain menolak berjalan dan meminta
Anda menjalankan `openclaw doctor`.

Doctor akan:

- Menjelaskan kunci lama mana yang ditemukan.
- Menampilkan migrasi yang diterapkan.
- Menulis ulang `~/.openclaw/openclaw.json` dengan skema yang diperbarui.

Gateway juga otomatis menjalankan migrasi doctor saat startup ketika mendeteksi
format konfigurasi lama, sehingga konfigurasi usang diperbaiki tanpa intervensi manual.
Migrasi penyimpanan pekerjaan cron ditangani oleh `openclaw doctor --fix`.

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
- Untuk channel dengan `accounts` bernama tetapi masih memiliki nilai channel tingkat atas akun tunggal, pindahkan nilai yang dicakup akun tersebut ke akun yang dipromosikan yang dipilih untuk channel itu (`accounts.default` untuk sebagian besar channel; Matrix dapat mempertahankan target default/bernama yang cocok)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- hapus `browser.relayBindHost` (pengaturan relay ekstensi lama)

Peringatan doctor juga mencakup panduan default akun untuk channel multi-akun:

- Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa perutean fallback dapat memilih akun yang tidak diharapkan.
- Jika `channels.<channel>.defaultAccount` disetel ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

### 2b) Override provider OpenCode

Jika Anda menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go`
secara manual, itu akan menimpa katalog OpenCode bawaan dari `@mariozechner/pi-ai`.
Hal itu dapat memaksa model ke API yang salah atau membuat biaya menjadi nol. Doctor memperingatkan agar Anda
dapat menghapus override dan memulihkan perutean API + biaya per model.

### 2c) Migrasi browser dan kesiapan Chrome MCP

Jika konfigurasi browser Anda masih menunjuk ke path ekstensi Chrome yang telah dihapus, doctor
menormalisasinya ke model attach Chrome MCP lokal host saat ini:

- `browser.profiles.*.driver: "extension"` menjadi `"existing-session"`
- `browser.relayBindHost` dihapus

Doctor juga mengaudit path Chrome MCP lokal host saat Anda menggunakan `defaultProfile:
"user"` atau profil `existing-session` yang dikonfigurasi:

- memeriksa apakah Google Chrome terpasang pada host yang sama untuk profil
  auto-connect default
- memeriksa versi Chrome yang terdeteksi dan memperingatkan saat di bawah Chrome 144
- mengingatkan Anda untuk mengaktifkan remote debugging di halaman inspeksi browser (misalnya
  `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  atau `edge://inspect/#remote-debugging`)

Doctor tidak dapat mengaktifkan pengaturan sisi Chrome untuk Anda. Chrome MCP lokal host
tetap memerlukan:

- browser berbasis Chromium 144+ di host gateway/node
- browser berjalan secara lokal
- remote debugging diaktifkan di browser tersebut
- menyetujui prompt persetujuan attach pertama di browser

Kesiapan di sini hanya tentang prasyarat attach lokal. Existing-session mempertahankan batas rute Chrome MCP saat ini; rute lanjutan seperti `responsebody`, ekspor PDF, intersepsi unduhan, dan tindakan batch tetap memerlukan browser terkelola atau profil CDP mentah.

Pemeriksaan ini **tidak** berlaku untuk Docker, sandbox, remote-browser, atau alur headless lainnya. Alur tersebut tetap menggunakan CDP mentah.

### 2d) Prasyarat OAuth TLS

Saat profil OAuth OpenAI Codex dikonfigurasi, doctor memprobe endpoint otorisasi OpenAI
untuk memverifikasi bahwa stack TLS Node/OpenSSL lokal dapat
memvalidasi rantai sertifikat. Jika probe gagal dengan error sertifikat (misalnya
`UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat self-signed),
doctor mencetak panduan perbaikan spesifik platform. Pada macOS dengan Node Homebrew, perbaikannya
biasanya adalah `brew postinstall ca-certificates`. Dengan `--deep`, probe dijalankan
bahkan jika gateway sehat.

### 3) Migrasi state lama (tata letak disk)

Doctor dapat memigrasikan tata letak lama di disk ke struktur saat ini:

- Penyimpanan sesi + transkrip:
  - dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
- Direktori agen:
  - dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
- State auth WhatsApp (Baileys):
  - dari `~/.openclaw/credentials/*.json` lama (kecuali `oauth.json`)
  - ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (id akun default: `default`)

Migrasi ini bersifat best-effort dan idempoten; doctor akan mengeluarkan peringatan saat
meninggalkan folder lama sebagai cadangan. Gateway/CLI juga otomatis memigrasikan
sesi lama + direktori agen saat startup sehingga riwayat/auth/model masuk ke
path per agen tanpa perlu menjalankan doctor secara manual. Auth WhatsApp sengaja hanya
dimigrasikan melalui `openclaw doctor`. Normalisasi provider/peta provider Talk kini
membandingkan berdasarkan kesetaraan struktural, sehingga perbedaan urutan kunci saja tidak lagi memicu
perubahan no-op `doctor --fix` berulang.

### 3a) Migrasi manifest plugin lama

Doctor memindai semua manifest plugin yang terpasang untuk kunci kapabilitas tingkat atas
yang sudah usang (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Saat ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts`
dan menulis ulang file manifest di tempat. Migrasi ini idempoten;
jika kunci `contracts` sudah memiliki nilai yang sama, kunci lama dihapus
tanpa menduplikasi data.

### 3b) Migrasi penyimpanan cron lama

Doctor juga memeriksa penyimpanan pekerjaan cron (`~/.openclaw/cron/jobs.json` secara default,
atau `cron.store` jika dioverride) untuk bentuk pekerjaan lama yang masih
diterima scheduler demi kompatibilitas.

Pembersihan cron saat ini mencakup:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- field payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
- field delivery tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias delivery `provider` payload → `delivery.channel` eksplisit
- pekerjaan fallback webhook lama sederhana `notify: true` → `delivery.mode="webhook"` eksplisit dengan `delivery.to=cron.webhook`

Doctor hanya memigrasikan otomatis pekerjaan `notify: true` saat dapat melakukannya tanpa
mengubah perilaku. Jika sebuah pekerjaan menggabungkan fallback notify lama dengan mode delivery non-webhook
yang sudah ada, doctor memperingatkan dan membiarkan pekerjaan itu untuk tinjauan manual.

### 3c) Pembersihan lock sesi

Doctor memindai setiap direktori sesi agen untuk file write-lock usang — file yang tertinggal
ketika sesi keluar secara abnormal. Untuk setiap file lock yang ditemukan, doctor melaporkan:
path, PID, apakah PID masih hidup, usia lock, dan apakah lock tersebut
dianggap usang (PID mati atau lebih tua dari 30 menit). Dalam mode `--fix` / `--repair`,
doctor menghapus file lock usang secara otomatis; jika tidak, doctor mencetak catatan dan
menginstruksikan Anda untuk menjalankan ulang dengan `--fix`.

### 4) Pemeriksaan integritas state (persistensi sesi, perutean, dan keamanan)

Direktori state adalah pusat operasional. Jika hilang, Anda akan kehilangan
sesi, kredensial, log, dan konfigurasi (kecuali Anda memiliki cadangan di tempat lain).

Doctor memeriksa:

- **Direktori state hilang**: memperingatkan tentang kehilangan state yang fatal, meminta untuk membuat ulang
  direktori, dan mengingatkan bahwa data yang hilang tidak dapat dipulihkan.
- **Izin direktori state**: memverifikasi bahwa direktori dapat ditulis; menawarkan perbaikan izin
  (dan mengeluarkan petunjuk `chown` saat terdeteksi ketidakcocokan owner/group).
- **Direktori state macOS yang disinkronkan cloud**: memperingatkan saat state berada di bawah iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau
  `~/Library/CloudStorage/...` karena path berbasis sinkronisasi dapat menyebabkan I/O lebih lambat
  serta race lock/sinkronisasi.
- **Direktori state Linux pada SD atau eMMC**: memperingatkan saat state berada pada source mount `mmcblk*`,
  karena I/O acak berbasis SD atau eMMC dapat lebih lambat dan lebih cepat aus
  akibat penulisan sesi dan kredensial.
- **Direktori sesi hilang**: `sessions/` dan direktori penyimpanan sesi
  diperlukan untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
- **Ketidakcocokan transkrip**: memperingatkan saat entri sesi terbaru memiliki
  file transkrip yang hilang.
- **Sesi utama “1-line JSONL”**: menandai saat transkrip utama hanya memiliki satu
  baris (riwayat tidak bertambah).
- **Beberapa direktori state**: memperingatkan saat ada beberapa folder `~/.openclaw` di berbagai
  direktori home atau saat `OPENCLAW_STATE_DIR` menunjuk ke lokasi lain (riwayat dapat
  terpecah antarinstalasi).
- **Pengingat mode remote**: jika `gateway.mode=remote`, doctor mengingatkan Anda untuk menjalankannya
  di host remote (state berada di sana).
- **Izin file konfigurasi**: memperingatkan jika `~/.openclaw/openclaw.json` dapat dibaca
  oleh grup/dunia dan menawarkan untuk memperketat menjadi `600`.

### 5) Kesehatan auth model (kedaluwarsa OAuth)

Doctor memeriksa profil OAuth di penyimpanan auth, memperingatkan saat token
akan kedaluwarsa/sudah kedaluwarsa, dan dapat me-refresh-nya jika aman. Jika profil
OAuth/token Anthropic sudah usang, doctor menyarankan migrasi ke Claude CLI atau
kunci API Anthropic.
Prompt refresh hanya muncul saat berjalan secara interaktif (TTY); `--non-interactive`
melewati percobaan refresh.

Doctor juga melaporkan profil auth yang sementara tidak dapat digunakan karena:

- cooldown singkat (batas laju/timeout/kegagalan auth)
- penonaktifan lebih lama (kegagalan penagihan/kredit)

### 6) Validasi model hooks

Jika `hooks.gmail.model` disetel, doctor memvalidasi referensi model terhadap
katalog dan allowlist serta memperingatkan saat model tidak akan terselesaikan atau tidak diizinkan.

### 7) Perbaikan image sandbox

Saat sandboxing diaktifkan, doctor memeriksa image Docker dan menawarkan untuk membangun atau
beralih ke nama lama jika image saat ini hilang.

### 7b) Dependensi runtime plugin bawaan

Doctor memverifikasi bahwa dependensi runtime plugin bawaan (misalnya paket runtime plugin
Discord) ada di root instalasi OpenClaw.
Jika ada yang hilang, doctor melaporkan paket tersebut dan memasangnya dalam
mode `openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migrasi layanan gateway dan petunjuk pembersihan

Doctor mendeteksi layanan gateway lama (launchd/systemd/schtasks) dan
menawarkan untuk menghapusnya serta memasang layanan OpenClaw menggunakan port gateway saat ini.
Doctor juga dapat memindai layanan tambahan yang menyerupai gateway dan mencetak petunjuk pembersihan.
Layanan gateway OpenClaw bernama profil dianggap kelas satu dan tidak
ditandai sebagai "tambahan".

### 8b) Migrasi Matrix saat startup

Saat akun channel Matrix memiliki migrasi state lama yang tertunda atau dapat ditindaklanjuti,
doctor (dalam mode `--fix` / `--repair`) membuat snapshot pra-migrasi lalu
menjalankan langkah migrasi best-effort: migrasi state Matrix lama dan persiapan state terenkripsi lama.
Kedua langkah ini tidak fatal; error dicatat dan startup tetap berlanjut. Dalam mode read-only (`openclaw doctor` tanpa `--fix`) pemeriksaan ini
dilewati sepenuhnya.

### 9) Peringatan keamanan

Doctor mengeluarkan peringatan saat sebuah provider terbuka untuk DM tanpa allowlist, atau
saat sebuah kebijakan dikonfigurasi dengan cara yang berbahaya.

### 10) systemd linger (Linux)

Jika berjalan sebagai layanan pengguna systemd, doctor memastikan linger diaktifkan agar
gateway tetap hidup setelah logout.

### 11) Status workspace (Skills, plugin, dan direktori lama)

Doctor mencetak ringkasan state workspace untuk agen default:

- **Status Skills**: menghitung skill eligible, missing-requirements, dan skill yang diblokir allowlist.
- **Direktori workspace lama**: memperingatkan saat `~/openclaw` atau direktori workspace lama lainnya
  ada bersamaan dengan workspace saat ini.
- **Status plugin**: menghitung plugin loaded/disabled/errored; mencantumkan ID plugin untuk setiap
  error; melaporkan kapabilitas plugin bundle.
- **Peringatan kompatibilitas plugin**: menandai plugin yang memiliki masalah kompatibilitas dengan
  runtime saat ini.
- **Diagnostik plugin**: menampilkan peringatan atau error saat pemuatan yang dikeluarkan oleh
  registry plugin.

### 11b) Ukuran file bootstrap

Doctor memeriksa apakah file bootstrap workspace (misalnya `AGENTS.md`,
`CLAUDE.md`, atau file konteks injeksi lainnya) mendekati atau melebihi
anggaran karakter yang dikonfigurasi. Doctor melaporkan jumlah karakter mentah vs. hasil injeksi per file, persentase pemotongan,
penyebab pemotongan (`max/file` atau `max/total`), dan total karakter yang diinjeksi
sebagai fraksi dari total anggaran. Saat file dipotong atau mendekati
batas, doctor mencetak tips untuk menyetel `agents.defaults.bootstrapMaxChars`
dan `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Shell completion

Doctor memeriksa apakah tab completion terpasang untuk shell saat ini
(zsh, bash, fish, atau PowerShell):

- Jika profil shell menggunakan pola completion dinamis yang lambat
  (`source <(openclaw completion ...)`), doctor meng-upgrade-nya ke
  varian file cache yang lebih cepat.
- Jika completion dikonfigurasi di profil tetapi file cache hilang,
  doctor meregenerasi cache secara otomatis.
- Jika tidak ada completion yang dikonfigurasi sama sekali, doctor meminta untuk memasangnya
  (hanya mode interaktif; dilewati dengan `--non-interactive`).

Jalankan `openclaw completion --write-state` untuk meregenerasi cache secara manual.

### 12) Pemeriksaan auth gateway (token lokal)

Doctor memeriksa kesiapan auth token gateway lokal.

- Jika mode token membutuhkan token dan tidak ada sumber token, doctor menawarkan untuk membuatnya.
- Jika `gateway.auth.token` dikelola SecretRef tetapi tidak tersedia, doctor memperingatkan dan tidak menimpanya dengan plaintext.
- `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya saat tidak ada token SecretRef yang dikonfigurasi.

### 12b) Perbaikan read-only yang sadar SecretRef

Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku fail-fast runtime.

- `openclaw doctor --fix` sekarang menggunakan model ringkasan SecretRef read-only yang sama seperti keluarga perintah status untuk perbaikan konfigurasi yang ditargetkan.
- Contoh: perbaikan `allowFrom` / `groupAllowFrom` `@username` Telegram mencoba menggunakan kredensial bot yang dikonfigurasi bila tersedia.
- Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia di jalur perintah saat ini, doctor melaporkan bahwa kredensial tersebut dikonfigurasi-namun-tidak-tersedia dan melewati auto-resolution alih-alih crash atau salah melaporkan token sebagai hilang.

### 13) Pemeriksaan kesehatan gateway + restart

Doctor menjalankan pemeriksaan kesehatan dan menawarkan untuk me-restart gateway saat
gateway tampak tidak sehat.

### 13b) Kesiapan pencarian memori

Doctor memeriksa apakah provider embedding pencarian memori yang dikonfigurasi siap
untuk agen default. Perilakunya bergantung pada backend dan provider yang dikonfigurasi:

- **Backend QMD**: memprobe apakah biner `qmd` tersedia dan dapat dijalankan.
  Jika tidak, doctor mencetak panduan perbaikan termasuk paket npm dan opsi path biner manual.
- **Provider lokal eksplisit**: memeriksa adanya file model lokal atau URL model remote/yang dapat diunduh yang dikenali. Jika tidak ada, doctor menyarankan beralih ke provider remote.
- **Provider remote eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa kunci API
  ada di environment atau auth store. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika tidak ada.
- **Provider otomatis**: memeriksa ketersediaan model lokal terlebih dahulu, lalu mencoba setiap provider remote
  dalam urutan pemilihan otomatis.

Saat hasil probe gateway tersedia (gateway sehat pada saat
pemeriksaan), doctor mereferensikan hasil tersebut dengan konfigurasi yang terlihat oleh CLI dan mencatat
setiap perbedaan.

Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

### 14) Peringatan status channel

Jika gateway sehat, doctor menjalankan probe status channel dan melaporkan
peringatan beserta perbaikan yang disarankan.

### 15) Audit konfigurasi supervisor + perbaikan

Doctor memeriksa konfigurasi supervisor yang terpasang (launchd/systemd/schtasks) untuk
default yang hilang atau usang (misalnya dependensi systemd network-online dan
restart delay). Saat menemukan ketidakcocokan, doctor merekomendasikan pembaruan dan dapat
menulis ulang file layanan/task ke default saat ini.

Catatan:

- `openclaw doctor` meminta konfirmasi sebelum menulis ulang konfigurasi supervisor.
- `openclaw doctor --yes` menerima prompt perbaikan default.
- `openclaw doctor --repair` menerapkan perbaikan yang direkomendasikan tanpa prompt.
- `openclaw doctor --repair --force` menimpa konfigurasi supervisor kustom.
- Jika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, install/perbaikan layanan doctor memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang telah diselesaikan ke metadata environment layanan supervisor.
- Jika auth token memerlukan token dan token SecretRef yang dikonfigurasi tidak terselesaikan, doctor memblokir jalur install/perbaikan dengan panduan yang dapat ditindaklanjuti.
- Jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi dan `gateway.auth.mode` tidak disetel, doctor memblokir install/perbaikan sampai mode disetel secara eksplisit.
- Untuk unit user-systemd Linux, pemeriksaan token drift doctor kini mencakup sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata auth layanan.
- Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

### 16) Diagnostik runtime gateway + port

Doctor memeriksa runtime layanan (PID, status keluar terakhir) dan memperingatkan saat
layanan terpasang tetapi sebenarnya tidak berjalan. Doctor juga memeriksa bentrokan port
pada port gateway (default `18789`) dan melaporkan kemungkinan penyebabnya (gateway sudah
berjalan, tunnel SSH).

### 17) Praktik terbaik runtime gateway

Doctor memperingatkan saat layanan gateway berjalan di Bun atau path Node yang dikelola version manager
(`nvm`, `fnm`, `volta`, `asdf`, dll.). Channel WhatsApp + Telegram memerlukan Node,
dan path version manager dapat rusak setelah upgrade karena layanan tidak
memuat inisialisasi shell Anda. Doctor menawarkan untuk bermigrasi ke instalasi Node sistem saat
tersedia (Homebrew/apt/choco).

### 18) Penulisan konfigurasi + metadata wizard

Doctor menyimpan perubahan konfigurasi apa pun dan memberi cap metadata wizard untuk mencatat
eksekusi doctor.

### 19) Tip workspace (cadangan + sistem memori)

Doctor menyarankan sistem memori workspace saat belum ada dan mencetak tip cadangan
jika workspace belum berada di bawah git.

Lihat [/concepts/agent-workspace](/concepts/agent-workspace) untuk panduan lengkap mengenai
struktur workspace dan cadangan git (disarankan GitHub atau GitLab privat).
