---
read_when:
    - Menambahkan atau memodifikasi migrasi doctor
    - Memperkenalkan perubahan config yang breaking
sidebarTitle: Doctor
summary: 'Perintah doctor: pemeriksaan health, migrasi config, dan langkah perbaikan'
title: Doctor
x-i18n:
    generated_at: "2026-04-26T11:28:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 592a9f886e0e6dcbfeb41a09c765ab289f3ed16ed360be37ff9fbefba920754f
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` adalah tool perbaikan + migrasi untuk OpenClaw. Tool ini memperbaiki config/state yang usang, memeriksa health, dan menyediakan langkah perbaikan yang dapat ditindaklanjuti.

## Mulai cepat

```bash
openclaw doctor
```

### Mode headless dan otomatisasi

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Terima default tanpa prompt (termasuk langkah perbaikan restart/service/sandbox jika berlaku).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Terapkan perbaikan yang direkomendasikan tanpa prompt (perbaikan + restart jika aman).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    Terapkan juga perbaikan agresif (menimpa config supervisor kustom).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Jalankan tanpa prompt dan hanya terapkan migrasi aman (normalisasi config + pemindahan state di disk). Melewati tindakan restart/service/sandbox yang memerlukan konfirmasi manusia. Migrasi state legacy berjalan otomatis saat terdeteksi.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Pindai layanan sistem untuk instalasi gateway tambahan (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Jika Anda ingin meninjau perubahan sebelum menulis, buka file config terlebih dahulu:

```bash
cat ~/.openclaw/openclaw.json
```

## Yang dilakukan (ringkasan)

<AccordionGroup>
  <Accordion title="Health, UI, dan pembaruan">
    - Pembaruan pre-flight opsional untuk instalasi git (hanya interaktif).
    - Pemeriksaan kesegaran protokol UI (membangun ulang Control UI saat schema protokol lebih baru).
    - Pemeriksaan health + prompt restart.
    - Ringkasan status Skills (eligible/missing/blocked) dan status Plugin.
  </Accordion>
  <Accordion title="Config dan migrasi">
    - Normalisasi config untuk nilai legacy.
    - Migrasi config Talk dari field datar legacy `talk.*` ke `talk.provider` + `talk.providers.<provider>`.
    - Pemeriksaan migrasi browser untuk config ekstensi Chrome legacy dan kesiapan Chrome MCP.
    - Peringatan override provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Peringatan shadowing OAuth Codex (`models.providers.openai-codex`).
    - Pemeriksaan prasyarat TLS OAuth untuk profil OAuth OpenAI Codex.
    - Migrasi state legacy di disk (sesi/dir agent/auth WhatsApp).
    - Migrasi key kontrak manifest Plugin legacy (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrasi store Cron legacy (`jobId`, `schedule.cron`, field delivery/payload tingkat atas, payload `provider`, job fallback Webhook sederhana `notify: true`).
    - Migrasi legacy runtime-policy agent ke `agents.defaults.agentRuntime` dan `agents.list[].agentRuntime`.
  </Accordion>
  <Accordion title="State dan integritas">
    - Inspeksi file lock sesi dan pembersihan lock basi.
    - Perbaikan transkrip sesi untuk cabang prompt-rewrite duplikat yang dibuat oleh build 2026.4.24 yang terdampak.
    - Pemeriksaan integritas dan izin state (sesi, transkrip, state dir).
    - Pemeriksaan izin file config (`chmod 600`) saat berjalan secara lokal.
    - Health auth model: memeriksa kedaluwarsa OAuth, dapat me-refresh token yang akan kedaluwarsa, dan melaporkan status cooldown/dinonaktifkan pada auth-profile.
    - Deteksi workspace dir tambahan (`~/openclaw`).
  </Accordion>
  <Accordion title="Gateway, layanan, dan supervisor">
    - Perbaikan image sandbox saat sandboxing diaktifkan.
    - Migrasi layanan legacy dan deteksi gateway tambahan.
    - Migrasi state legacy channel Matrix (dalam mode `--fix` / `--repair`).
    - Pemeriksaan runtime Gateway (layanan terinstal tetapi tidak berjalan; label launchd yang di-cache).
    - Peringatan status channel (di-probe dari gateway yang sedang berjalan).
    - Audit config supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
    - Pemeriksaan best practice runtime Gateway (Node vs Bun, path version-manager).
    - Diagnostik bentrokan port Gateway (default `18789`).
  </Accordion>
  <Accordion title="Auth, keamanan, dan pairing">
    - Peringatan keamanan untuk kebijakan DM terbuka.
    - Pemeriksaan auth Gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada source token; tidak menimpa config SecretRef token).
    - Deteksi masalah pairing perangkat (permintaan pairing pertama kali yang tertunda, peningkatan role/scope yang tertunda, drift cache token perangkat lokal yang basi, dan drift auth paired-record).
  </Accordion>
  <Accordion title="Workspace dan shell">
    - Pemeriksaan linger systemd di Linux.
    - Pemeriksaan ukuran file bootstrap workspace (peringatan truncation/mendekati batas untuk file context).
    - Pemeriksaan status shell completion dan instalasi/upgrade otomatis.
    - Pemeriksaan kesiapan provider embedding memory search (model lokal, API key remote, atau biner QMD).
    - Pemeriksaan instalasi source (mismatch workspace pnpm, aset UI hilang, biner tsx hilang).
    - Menulis config dan metadata wizard yang diperbarui.
  </Accordion>
</AccordionGroup>

## Backfill dan reset UI Dreams

Scene Dreams pada Control UI mencakup tindakan **Backfill**, **Reset**, dan **Clear Grounded** untuk alur grounded Dreaming. Tindakan ini menggunakan metode RPC bergaya doctor gateway, tetapi **bukan** bagian dari perbaikan/migrasi CLI `openclaw doctor`.

Yang dilakukan:

- **Backfill** memindai file historis `memory/YYYY-MM-DD.md` di workspace aktif, menjalankan pass diary REM grounded, dan menulis entri backfill yang dapat dibalik ke `DREAMS.md`.
- **Reset** menghapus hanya entri diary backfill bertanda tersebut dari `DREAMS.md`.
- **Clear Grounded** menghapus hanya entri short-term khusus grounded yang di-stage yang berasal dari replay historis dan belum mengakumulasi recall live atau dukungan harian.

Yang **tidak** dilakukan sendiri:

- tidak mengedit `MEMORY.md`
- tidak menjalankan migrasi doctor penuh
- tidak secara otomatis men-stage kandidat grounded ke store promosi short-term live kecuali Anda secara eksplisit menjalankan jalur CLI staged terlebih dahulu

Jika Anda ingin replay historis grounded memengaruhi lane promosi mendalam normal, gunakan alur CLI berikut:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Ini men-stage kandidat durable grounded ke store Dreaming short-term sambil mempertahankan `DREAMS.md` sebagai permukaan peninjauan.

## Perilaku dan alasan terperinci

<AccordionGroup>
  <Accordion title="0. Pembaruan opsional (instalasi git)">
    Jika ini adalah git checkout dan doctor berjalan secara interaktif, doctor menawarkan pembaruan (fetch/rebase/build) sebelum menjalankan doctor.
  </Accordion>
  <Accordion title="1. Normalisasi config">
    Jika config berisi bentuk nilai legacy (misalnya `messages.ackReaction` tanpa override spesifik channel), doctor menormalisasikannya ke schema saat ini.

    Itu termasuk field datar Talk legacy. Config Talk publik saat ini adalah `talk.provider` + `talk.providers.<provider>`. Doctor menulis ulang bentuk lama `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ke peta provider.

  </Accordion>
  <Accordion title="2. Migrasi key config legacy">
    Saat config berisi key yang deprecated, perintah lain menolak berjalan dan meminta Anda menjalankan `openclaw doctor`.

    Doctor akan:

    - Menjelaskan key legacy mana yang ditemukan.
    - Menampilkan migrasi yang diterapkan.
    - Menulis ulang `~/.openclaw/openclaw.json` dengan schema yang diperbarui.

    Gateway juga otomatis menjalankan migrasi doctor saat startup ketika mendeteksi format config legacy, sehingga config basi diperbaiki tanpa intervensi manual. Migrasi store job Cron ditangani oleh `openclaw doctor --fix`.

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
    - `messages.tts.provider: "edge"` dan `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` dan `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` dan `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` dan `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Untuk channel dengan `accounts` bernama tetapi masih menyisakan nilai channel tingkat atas akun tunggal, pindahkan nilai yang dicakup akun tersebut ke akun yang dipromosikan yang dipilih untuk channel itu (`accounts.default` untuk sebagian besar channel; Matrix dapat mempertahankan target bernama/default yang cocok yang sudah ada)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - hapus `browser.relayBindHost` (pengaturan relay ekstensi legacy)

    Peringatan doctor juga mencakup panduan default akun untuk channel multi-akun:

    - Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa perutean fallback dapat memilih akun yang tidak terduga.
    - Jika `channels.<channel>.defaultAccount` diatur ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

  </Accordion>
  <Accordion title="2b. Override provider OpenCode">
    Jika Anda menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go` secara manual, itu menimpa katalog OpenCode bawaan dari `@mariozechner/pi-ai`. Hal ini dapat memaksa model ke API yang salah atau menjadikan biaya nol. Doctor memperingatkan agar Anda dapat menghapus override dan memulihkan perutean API + biaya per model.
  </Accordion>
  <Accordion title="2c. Migrasi browser dan kesiapan Chrome MCP">
    Jika config browser Anda masih menunjuk ke jalur ekstensi Chrome yang sudah dihapus, doctor menormalisasikannya ke model attach Chrome MCP host-lokal saat ini:

    - `browser.profiles.*.driver: "extension"` menjadi `"existing-session"`
    - `browser.relayBindHost` dihapus

    Doctor juga mengaudit path Chrome MCP host-lokal saat Anda menggunakan `defaultProfile: "user"` atau profil `existing-session` yang dikonfigurasi:

    - memeriksa apakah Google Chrome terinstal pada host yang sama untuk profil auto-connect default
    - memeriksa versi Chrome yang terdeteksi dan memperingatkan jika di bawah Chrome 144
    - mengingatkan Anda untuk mengaktifkan remote debugging di halaman inspect browser (misalnya `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, atau `edge://inspect/#remote-debugging`)

    Doctor tidak dapat mengaktifkan pengaturan sisi Chrome untuk Anda. Chrome MCP host-lokal tetap memerlukan:

    - browser berbasis Chromium 144+ pada host gateway/node
    - browser berjalan secara lokal
    - remote debugging diaktifkan pada browser tersebut
    - menyetujui prompt persetujuan attach pertama di browser

    Kesiapan di sini hanya terkait prasyarat attach lokal. Existing-session tetap mempertahankan batas rute Chrome MCP saat ini; rute lanjutan seperti `responsebody`, ekspor PDF, intersepsi unduhan, dan aksi batch tetap memerlukan browser terkelola atau profil CDP mentah.

    Pemeriksaan ini **tidak** berlaku untuk Docker, sandbox, remote-browser, atau alur headless lainnya. Alur-alur tersebut tetap menggunakan CDP mentah.

  </Accordion>
  <Accordion title="2d. Prasyarat TLS OAuth">
    Saat profil OAuth OpenAI Codex dikonfigurasi, doctor melakukan probe ke endpoint otorisasi OpenAI untuk memverifikasi bahwa stack TLS Node/OpenSSL lokal dapat memvalidasi rantai sertifikat. Jika probe gagal dengan error sertifikat (misalnya `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat self-signed), doctor mencetak panduan perbaikan khusus platform. Di macOS dengan Node Homebrew, perbaikannya biasanya `brew postinstall ca-certificates`. Dengan `--deep`, probe tetap dijalankan bahkan jika gateway sehat.
  </Accordion>
  <Accordion title="2e. Override provider OAuth Codex">
    Jika sebelumnya Anda menambahkan pengaturan transport OpenAI legacy di bawah `models.providers.openai-codex`, itu dapat menimpa jalur provider OAuth Codex bawaan yang digunakan otomatis oleh rilis yang lebih baru. Doctor memperingatkan saat melihat pengaturan transport lama tersebut bersama OAuth Codex agar Anda dapat menghapus atau menulis ulang override transport basi dan mendapatkan kembali perilaku perutean/fallback bawaan. Proxy kustom dan override khusus header tetap didukung dan tidak memicu peringatan ini.
  </Accordion>
  <Accordion title="2f. Peringatan rute Plugin Codex">
    Saat Plugin Codex bawaan diaktifkan, doctor juga memeriksa apakah ref model utama `openai-codex/*` masih diresolusikan melalui runner PI default. Kombinasi itu valid saat Anda ingin auth OAuth/langganan Codex melalui PI, tetapi mudah tertukar dengan harness app-server Codex native. Doctor memperingatkan dan menunjuk ke bentuk app-server eksplisit: `openai/*` plus `agentRuntime.id: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor tidak memperbaiki ini secara otomatis karena kedua rute valid:

    - `openai-codex/*` + PI berarti "gunakan auth OAuth/langganan Codex melalui runner OpenClaw normal."
    - `openai/*` + `runtime: "codex"` berarti "jalankan giliran tersemat melalui app-server Codex native."
    - `/codex ...` berarti "kendalikan atau ikat percakapan Codex native dari chat."
    - `/acp ...` atau `runtime: "acp"` berarti "gunakan adapter ACP/acpx eksternal."

    Jika peringatan ini muncul, pilih rute yang memang Anda maksud dan edit config secara manual. Biarkan peringatan apa adanya jika PI Codex OAuth memang disengaja.

  </Accordion>
  <Accordion title="3. Migrasi state legacy (layout disk)">
    Doctor dapat memigrasikan layout lama di disk ke struktur saat ini:

    - Store sesi + transkrip:
      - dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
    - Dir agent:
      - dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
    - State auth WhatsApp (Baileys):
      - dari legacy `~/.openclaw/credentials/*.json` (kecuali `oauth.json`)
      - ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID akun default: `default`)

    Migrasi ini bersifat best-effort dan idempoten; doctor akan mengeluarkan peringatan saat meninggalkan folder legacy apa pun sebagai cadangan. Gateway/CLI juga otomatis memigrasikan sesi legacy + dir agent saat startup sehingga riwayat/auth/model masuk ke path per-agent tanpa perlu menjalankan doctor secara manual. Auth WhatsApp sengaja hanya dimigrasikan melalui `openclaw doctor`. Normalisasi provider/peta provider Talk sekarang membandingkan berdasarkan kesetaraan struktural, sehingga perbedaan urutan key saja tidak lagi memicu perubahan `doctor --fix` no-op berulang.

  </Accordion>
  <Accordion title="3a. Migrasi manifest Plugin legacy">
    Doctor memindai semua manifest Plugin yang terinstal untuk key kapabilitas tingkat atas yang deprecated (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Saat ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts` dan menulis ulang file manifest di tempat. Migrasi ini idempoten; jika key `contracts` sudah memiliki nilai yang sama, key legacy dihapus tanpa menduplikasi data.
  </Accordion>
  <Accordion title="3b. Migrasi store Cron legacy">
    Doctor juga memeriksa store job Cron (`~/.openclaw/cron/jobs.json` secara default, atau `cron.store` jika dioverride) untuk bentuk job lama yang masih diterima scheduler demi kompatibilitas.

    Pembersihan Cron saat ini mencakup:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - field payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
    - field delivery tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias delivery `provider` payload → `delivery.channel` eksplisit
    - job fallback Webhook legacy sederhana `notify: true` → `delivery.mode="webhook"` eksplisit dengan `delivery.to=cron.webhook`

    Doctor hanya otomatis memigrasikan job `notify: true` ketika bisa melakukannya tanpa mengubah perilaku. Jika sebuah job menggabungkan fallback notify legacy dengan mode delivery non-webhook yang sudah ada, doctor memperingatkan dan membiarkan job tersebut untuk ditinjau secara manual.

  </Accordion>
  <Accordion title="3c. Pembersihan lock sesi">
    Doctor memindai setiap direktori sesi agent untuk file write-lock basi — file yang tertinggal saat sesi keluar secara tidak normal. Untuk setiap file lock yang ditemukan, doctor melaporkan: path, PID, apakah PID masih hidup, usia lock, dan apakah lock dianggap basi (PID mati atau lebih lama dari 30 menit). Dalam mode `--fix` / `--repair`, doctor menghapus file lock basi secara otomatis; jika tidak, doctor mencetak catatan dan menginstruksikan Anda untuk menjalankan ulang dengan `--fix`.
  </Accordion>
  <Accordion title="3d. Perbaikan cabang transkrip sesi">
    Doctor memindai file JSONL sesi agent untuk bentuk cabang duplikat yang dibuat oleh bug penulisan ulang transkrip prompt 2026.4.24: giliran user yang ditinggalkan dengan context runtime internal OpenClaw ditambah sibling aktif yang berisi prompt user terlihat yang sama. Dalam mode `--fix` / `--repair`, doctor mencadangkan setiap file yang terdampak di samping file asli dan menulis ulang transkrip ke cabang aktif sehingga riwayat gateway dan pembaca memori tidak lagi melihat giliran duplikat.
  </Accordion>
  <Accordion title="4. Pemeriksaan integritas state (persistensi sesi, perutean, dan keamanan)">
    Direktori state adalah batang otak operasional. Jika hilang, Anda kehilangan sesi, kredensial, log, dan config (kecuali jika Anda punya cadangan di tempat lain).

    Doctor memeriksa:

    - **Direktori state hilang**: memperingatkan tentang kehilangan state yang katastrofik, meminta untuk membuat ulang direktori, dan mengingatkan bahwa doctor tidak dapat memulihkan data yang hilang.
    - **Izin direktori state**: memverifikasi dapat ditulis; menawarkan untuk memperbaiki izin (dan mengeluarkan petunjuk `chown` saat terdeteksi ketidakcocokan owner/group).
    - **Direktori state macOS yang tersinkron cloud**: memperingatkan saat state diresolusikan di bawah iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau `~/Library/CloudStorage/...` karena path yang didukung sinkronisasi dapat menyebabkan I/O lebih lambat dan race lock/sinkronisasi.
    - **Direktori state Linux di SD atau eMMC**: memperingatkan saat state diresolusikan ke sumber mount `mmcblk*`, karena I/O acak yang didukung SD atau eMMC bisa lebih lambat dan lebih cepat aus di bawah penulisan sesi dan kredensial.
    - **Direktori sesi hilang**: `sessions/` dan direktori store sesi diperlukan untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
    - **Ketidakcocokan transkrip**: memperingatkan saat entri sesi terbaru memiliki file transkrip yang hilang.
    - **Sesi utama "JSONL 1 baris"**: menandai saat transkrip utama hanya memiliki satu baris (riwayat tidak terakumulasi).
    - **Beberapa direktori state**: memperingatkan saat beberapa folder `~/.openclaw` ada di berbagai direktori home atau saat `OPENCLAW_STATE_DIR` menunjuk ke tempat lain (riwayat dapat terpecah antarinstalasi).
    - **Pengingat mode remote**: jika `gateway.mode=remote`, doctor mengingatkan Anda untuk menjalankannya pada host remote (state berada di sana).
    - **Izin file config**: memperingatkan jika `~/.openclaw/openclaw.json` dapat dibaca group/world dan menawarkan untuk mengetatkan ke `600`.

  </Accordion>
  <Accordion title="5. Health auth model (kedaluwarsa OAuth)">
    Doctor memeriksa profil OAuth di store auth, memperingatkan saat token akan kedaluwarsa/sudah kedaluwarsa, dan dapat me-refresh-nya jika aman. Jika profil OAuth/token Anthropic basi, doctor menyarankan Anthropic API key atau jalur setup-token Anthropic. Prompt refresh hanya muncul saat berjalan interaktif (TTY); `--non-interactive` melewati upaya refresh.

    Saat refresh OAuth gagal secara permanen (misalnya `refresh_token_reused`, `invalid_grant`, atau provider memberi tahu Anda untuk login lagi), doctor melaporkan bahwa autentikasi ulang diperlukan dan mencetak perintah `openclaw models auth login --provider ...` yang tepat untuk dijalankan.

    Doctor juga melaporkan profil auth yang sementara tidak dapat digunakan karena:

    - cooldown singkat (batas laju/timeout/kegagalan auth)
    - penonaktifan lebih lama (kegagalan penagihan/kredit)

  </Accordion>
  <Accordion title="6. Validasi model hook">
    Jika `hooks.gmail.model` diatur, doctor memvalidasi referensi model terhadap katalog dan allowlist serta memperingatkan jika model tersebut tidak akan diresolusikan atau tidak diizinkan.
  </Accordion>
  <Accordion title="7. Perbaikan image sandbox">
    Saat sandboxing diaktifkan, doctor memeriksa image Docker dan menawarkan untuk membangun atau beralih ke nama legacy jika image saat ini tidak ada.
  </Accordion>
  <Accordion title="7b. Dependensi runtime Plugin bawaan">
    Doctor memverifikasi dependensi runtime hanya untuk Plugin bawaan yang aktif dalam config saat ini atau diaktifkan oleh default manifest bawaannya, misalnya `plugins.entries.discord.enabled: true`, legacy `channels.discord.enabled: true`, atau provider bawaan yang diaktifkan secara default. Jika ada yang hilang, doctor melaporkan paket-paket tersebut dan menginstalnya dalam mode `openclaw doctor --fix` / `openclaw doctor --repair`. Plugin eksternal tetap menggunakan `openclaw plugins install` / `openclaw plugins update`; doctor tidak menginstal dependensi untuk path Plugin arbitrer.

    Gateway dan CLI lokal juga dapat memperbaiki dependensi runtime Plugin bawaan aktif sesuai kebutuhan sebelum mengimpor Plugin bawaan. Instalasi ini dibatasi ke root instalasi runtime Plugin, berjalan dengan script dinonaktifkan, tidak menulis package lock, dan dijaga oleh lock install-root sehingga start CLI atau Gateway secara bersamaan tidak mengubah tree `node_modules` yang sama pada waktu yang sama.

  </Accordion>
  <Accordion title="8. Migrasi layanan Gateway dan petunjuk pembersihan">
    Doctor mendeteksi layanan gateway legacy (launchd/systemd/schtasks) dan menawarkan untuk menghapusnya serta menginstal layanan OpenClaw menggunakan port gateway saat ini. Doctor juga dapat memindai layanan tambahan yang menyerupai gateway dan mencetak petunjuk pembersihan. Layanan gateway OpenClaw bernama profil dianggap sebagai kelas satu dan tidak ditandai sebagai "tambahan."
  </Accordion>
  <Accordion title="8b. Migrasi Matrix saat startup">
    Saat akun channel Matrix memiliki migrasi state legacy yang tertunda atau dapat ditindaklanjuti, doctor (dalam mode `--fix` / `--repair`) membuat snapshot pra-migrasi lalu menjalankan langkah migrasi best-effort: migrasi state Matrix legacy dan persiapan encrypted-state legacy. Kedua langkah ini tidak fatal; error dicatat dalam log dan startup tetap berlanjut. Dalam mode baca-saja (`openclaw doctor` tanpa `--fix`) pemeriksaan ini dilewati sepenuhnya.
  </Accordion>
  <Accordion title="8c. Drift pairing perangkat dan auth">
    Doctor sekarang memeriksa state pairing perangkat sebagai bagian dari health pass normal.

    Yang dilaporkan:

    - permintaan pairing pertama kali yang tertunda
    - peningkatan role yang tertunda untuk perangkat yang sudah dipasangkan
    - peningkatan scope yang tertunda untuk perangkat yang sudah dipasangkan
    - perbaikan ketidakcocokan public-key ketika ID perangkat masih cocok tetapi identitas perangkat tidak lagi cocok dengan catatan yang disetujui
    - catatan pairing yang tidak memiliki token aktif untuk role yang disetujui
    - token pairing yang scope-nya menyimpang di luar baseline pairing yang disetujui
    - entri token perangkat cache lokal untuk mesin saat ini yang mendahului rotasi token sisi gateway atau membawa metadata scope basi

    Doctor tidak menyetujui permintaan pair secara otomatis atau merotasi token perangkat secara otomatis. Sebagai gantinya, doctor mencetak langkah berikutnya yang tepat:

    - periksa permintaan yang tertunda dengan `openclaw devices list`
    - setujui permintaan yang tepat dengan `openclaw devices approve <requestId>`
    - rotasi token baru dengan `openclaw devices rotate --device <deviceId> --role <role>`
    - hapus dan setujui ulang catatan basi dengan `openclaw devices remove <deviceId>`

    Ini menutup celah umum "sudah dipasangkan tetapi masih mendapatkan pairing required": doctor sekarang membedakan pairing pertama kali dari peningkatan role/scope yang tertunda dan dari drift token/identitas perangkat yang basi.

  </Accordion>
  <Accordion title="9. Peringatan keamanan">
    Doctor mengeluarkan peringatan saat sebuah provider terbuka untuk DM tanpa allowlist, atau saat sebuah kebijakan dikonfigurasi بطريقة berbahaya.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jika berjalan sebagai layanan pengguna systemd, doctor memastikan lingering diaktifkan agar gateway tetap hidup setelah logout.
  </Accordion>
  <Accordion title="11. Status workspace (Skills, Plugin, dan dir legacy)">
    Doctor mencetak ringkasan state workspace untuk agent default:

    - **Status Skills**: menghitung Skills yang eligible, missing-requirements, dan allowlist-blocked.
    - **Dir workspace legacy**: memperingatkan saat `~/openclaw` atau direktori workspace legacy lainnya ada berdampingan dengan workspace saat ini.
    - **Status Plugin**: menghitung Plugin yang enabled/disabled/errored; mencantumkan ID Plugin untuk error apa pun; melaporkan kapabilitas Plugin bundle.
    - **Peringatan kompatibilitas Plugin**: menandai Plugin yang memiliki masalah kompatibilitas dengan runtime saat ini.
    - **Diagnostik Plugin**: menampilkan peringatan atau error saat load-time yang dikeluarkan oleh registry Plugin.

  </Accordion>
  <Accordion title="11b. Ukuran file bootstrap">
    Doctor memeriksa apakah file bootstrap workspace (misalnya `AGENTS.md`, `CLAUDE.md`, atau file context lain yang diinjeksi) mendekati atau melebihi anggaran karakter yang dikonfigurasi. Doctor melaporkan jumlah karakter mentah vs. karakter yang diinjeksi per file, persentase truncation, penyebab truncation (`max/file` atau `max/total`), dan total karakter yang diinjeksi sebagai fraksi dari total anggaran. Saat file mengalami truncation atau mendekati batas, doctor mencetak tips untuk menyesuaikan `agents.defaults.bootstrapMaxChars` dan `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor memeriksa apakah tab completion terinstal untuk shell saat ini (zsh, bash, fish, atau PowerShell):

    - Jika profil shell menggunakan pola completion dinamis yang lambat (`source <(openclaw completion ...)`), doctor meningkatkannya ke varian file cache yang lebih cepat.
    - Jika completion dikonfigurasi di profil tetapi file cache tidak ada, doctor secara otomatis meregenerasi cache.
    - Jika tidak ada completion yang dikonfigurasi sama sekali, doctor meminta untuk menginstalnya (hanya mode interaktif; dilewati dengan `--non-interactive`).

    Jalankan `openclaw completion --write-state` untuk meregenerasi cache secara manual.

  </Accordion>
  <Accordion title="12. Pemeriksaan auth Gateway (token lokal)">
    Doctor memeriksa kesiapan auth token Gateway lokal.

    - Jika mode token memerlukan token dan tidak ada source token, doctor menawarkan untuk membuatnya.
    - Jika `gateway.auth.token` dikelola SecretRef tetapi tidak tersedia, doctor memperingatkan dan tidak menimpanya dengan plaintext.
    - `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya saat tidak ada SecretRef token yang dikonfigurasi.

  </Accordion>
  <Accordion title="12b. Perbaikan sadar-SecretRef baca-saja">
    Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku fail-fast runtime.

    - `openclaw doctor --fix` sekarang menggunakan model ringkasan SecretRef baca-saja yang sama seperti perintah keluarga status untuk perbaikan config yang ditargetkan.
    - Contoh: perbaikan Telegram `allowFrom` / `groupAllowFrom` `@username` mencoba menggunakan kredensial bot yang dikonfigurasi jika tersedia.
    - Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia pada jalur perintah saat ini, doctor melaporkan bahwa kredensial telah dikonfigurasi tetapi tidak tersedia dan melewati auto-resolution alih-alih crash atau salah melaporkan token sebagai hilang.

  </Accordion>
  <Accordion title="13. Pemeriksaan health Gateway + restart">
    Doctor menjalankan pemeriksaan health dan menawarkan untuk me-restart gateway saat tampak tidak sehat.
  </Accordion>
  <Accordion title="13b. Kesiapan memory search">
    Doctor memeriksa apakah provider embedding memory search yang dikonfigurasi siap untuk agent default. Perilakunya bergantung pada backend dan provider yang dikonfigurasi:

    - **Backend QMD**: memeriksa apakah biner `qmd` tersedia dan dapat dijalankan. Jika tidak, doctor mencetak panduan perbaikan termasuk paket npm dan opsi path biner manual.
    - **Provider lokal eksplisit**: memeriksa keberadaan file model lokal atau URL model remote/dapat-diunduh yang dikenali. Jika hilang, doctor menyarankan beralih ke provider remote.
    - **Provider remote eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa API key ada di environment atau auth store. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika tidak ada.
    - **Provider auto**: memeriksa ketersediaan model lokal terlebih dahulu, lalu mencoba setiap provider remote dalam urutan auto-selection.

    Saat hasil probe gateway tersedia (gateway sehat saat pemeriksaan dilakukan), doctor melakukan cross-reference hasilnya dengan config yang terlihat oleh CLI dan mencatat setiap perbedaan.

    Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

  </Accordion>
  <Accordion title="14. Peringatan status channel">
    Jika gateway sehat, doctor menjalankan probe status channel dan melaporkan peringatan dengan saran perbaikan.
  </Accordion>
  <Accordion title="15. Audit config supervisor + perbaikan">
    Doctor memeriksa config supervisor yang terinstal (launchd/systemd/schtasks) untuk default yang hilang atau usang (misalnya dependensi systemd network-online dan jeda restart). Saat doctor menemukan ketidakcocokan, doctor merekomendasikan pembaruan dan dapat menulis ulang file layanan/task ke default saat ini.

    Catatan:

    - `openclaw doctor` meminta konfirmasi sebelum menulis ulang config supervisor.
    - `openclaw doctor --yes` menerima prompt perbaikan default.
    - `openclaw doctor --repair` menerapkan perbaikan yang direkomendasikan tanpa prompt.
    - `openclaw doctor --repair --force` menimpa config supervisor kustom.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` membuat doctor tetap baca-saja untuk lifecycle layanan gateway. Doctor tetap melaporkan health layanan dan menjalankan perbaikan non-layanan, tetapi melewati install/start/restart/bootstrap layanan, penulisan ulang config supervisor, dan pembersihan layanan legacy karena supervisor eksternal memiliki lifecycle tersebut.
    - Jika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, install/perbaikan layanan doctor memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang diresolusikan ke metadata environment layanan supervisor.
    - Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi tidak teresolusikan, doctor memblokir jalur install/perbaikan dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak diatur, doctor memblokir install/perbaikan sampai mode diatur secara eksplisit.
    - Untuk unit user-systemd Linux, pemeriksaan drift token doctor sekarang mencakup source `Environment=` dan `EnvironmentFile=` saat membandingkan metadata auth layanan.
    - Perbaikan layanan doctor menolak menulis ulang, menghentikan, atau me-restart layanan gateway dari biner OpenClaw yang lebih lama saat config terakhir kali ditulis oleh versi yang lebih baru. Lihat [Gateway troubleshooting](/id/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostik runtime + port Gateway">
    Doctor memeriksa runtime layanan (PID, status exit terakhir) dan memperingatkan saat layanan terinstal tetapi sebenarnya tidak berjalan. Doctor juga memeriksa bentrokan port pada port gateway (default `18789`) dan melaporkan kemungkinan penyebabnya (gateway sudah berjalan, SSH tunnel).
  </Accordion>
  <Accordion title="17. Praktik terbaik runtime Gateway">
    Doctor memperingatkan saat layanan gateway berjalan di Bun atau path Node yang dikelola version manager (`nvm`, `fnm`, `volta`, `asdf`, dll.). Channel WhatsApp + Telegram memerlukan Node, dan path version-manager dapat rusak setelah pembaruan karena layanan tidak memuat init shell Anda. Doctor menawarkan untuk bermigrasi ke instalasi Node sistem jika tersedia (Homebrew/apt/choco).
  </Accordion>
  <Accordion title="18. Penulisan config + metadata wizard">
    Doctor mempersistenkan perubahan config apa pun dan memberi stempel metadata wizard untuk mencatat eksekusi doctor.
  </Accordion>
  <Accordion title="19. Tips workspace (cadangan + sistem memori)">
    Doctor menyarankan sistem memori workspace jika belum ada dan mencetak tips pencadangan jika workspace belum berada di bawah git.

    Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap struktur workspace dan cadangan git (direkomendasikan GitHub atau GitLab privat).

  </Accordion>
</AccordionGroup>

## Terkait

- [Runbook Gateway](/id/gateway)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
