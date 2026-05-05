---
read_when:
    - Menambahkan atau memodifikasi migrasi doctor
    - Memperkenalkan perubahan konfigurasi yang tidak kompatibel
sidebarTitle: Doctor
summary: 'Perintah doctor: pemeriksaan kesehatan, migrasi konfigurasi, dan langkah perbaikan'
title: Dokter
x-i18n:
    generated_at: "2026-05-05T08:25:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360f9f7a349e4633ff61d526f1eb5b668b595b4f35c5e0fd2a314715a0599c4c
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` adalah alat perbaikan + migrasi untuk OpenClaw. Alat ini memperbaiki config/status yang usang, memeriksa kesehatan, dan menyediakan langkah perbaikan yang dapat ditindaklanjuti.

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

    Terima default tanpa prompt (termasuk langkah perbaikan restart/service/sandbox saat berlaku).

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

    Jalankan tanpa prompt dan hanya terapkan migrasi aman (normalisasi config + pemindahan status di disk). Melewati tindakan restart/service/sandbox yang memerlukan konfirmasi manusia. Migrasi status lama berjalan otomatis saat terdeteksi.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Pindai service sistem untuk instalasi gateway tambahan (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Jika Anda ingin meninjau perubahan sebelum menulis, buka file config terlebih dahulu:

```bash
cat ~/.openclaw/openclaw.json
```

## Yang dilakukan (ringkasan)

<AccordionGroup>
  <Accordion title="Kesehatan, UI, dan pembaruan">
    - Pembaruan pra-jalan opsional untuk instalasi git (hanya interaktif).
    - Pemeriksaan kesegaran protokol UI (membangun ulang Control UI saat skema protokol lebih baru).
    - Pemeriksaan kesehatan + prompt restart.
    - Ringkasan status Skills (memenuhi syarat/hilang/diblokir) dan status plugin.

  </Accordion>
  <Accordion title="Config dan migrasi">
    - Normalisasi config untuk nilai lama.
    - Migrasi config Talk dari field datar lama `talk.*` ke `talk.provider` + `talk.providers.<provider>`.
    - Pemeriksaan migrasi browser untuk config ekstensi Chrome lama dan kesiapan Chrome MCP.
    - Peringatan override penyedia OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Peringatan shadowing OAuth Codex (`models.providers.openai-codex`).
    - Pemeriksaan prasyarat OAuth TLS untuk profil OAuth OpenAI Codex.
    - Peringatan allowlist Plugin/alat saat `plugins.allow` restriktif tetapi kebijakan alat masih meminta wildcard atau alat milik plugin.
    - Migrasi status lama di disk (sessions/agent dir/auth WhatsApp).
    - Migrasi kunci kontrak manifest plugin lama (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrasi penyimpanan Cron lama (`jobId`, `schedule.cron`, field delivery/payload tingkat atas, payload `provider`, job fallback webhook sederhana `notify: true`).
    - Migrasi runtime-policy agent lama ke `agents.defaults.agentRuntime` dan `agents.list[].agentRuntime`.
    - Pembersihan config plugin usang saat plugin diaktifkan; saat `plugins.enabled=false`, referensi plugin usang diperlakukan sebagai config containment inert dan dipertahankan.

  </Accordion>
  <Accordion title="Status dan integritas">
    - Inspeksi file lock sesi dan pembersihan lock usang.
    - Perbaikan transkrip sesi untuk cabang penulisan ulang prompt duplikat yang dibuat oleh build 2026.4.24 yang terdampak.
    - Deteksi tombstone pemulihan restart subagent yang macet, dengan dukungan `--fix` untuk menghapus flag pemulihan aborted yang usang agar startup tidak terus memperlakukan child sebagai restart-aborted.
    - Pemeriksaan integritas dan izin status (sesi, transkrip, direktori status).
    - Pemeriksaan izin file config (chmod 600) saat berjalan secara lokal.
    - Kesehatan auth model: memeriksa kedaluwarsa OAuth, dapat me-refresh token yang hampir kedaluwarsa, dan melaporkan status cooldown/dinonaktifkan auth-profile.
    - Deteksi direktori workspace tambahan (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, service, dan supervisor">
    - Perbaikan image sandbox saat sandboxing diaktifkan.
    - Migrasi service lama dan deteksi gateway tambahan.
    - Migrasi status lama channel Matrix (dalam mode `--fix` / `--repair`).
    - Pemeriksaan runtime Gateway (service terpasang tetapi tidak berjalan; label launchd yang di-cache).
    - Peringatan status channel (di-probe dari gateway yang sedang berjalan).
    - Pemeriksaan responsivitas WhatsApp untuk kesehatan event-loop Gateway yang menurun dengan klien TUI lokal masih berjalan; `--fix` hanya menghentikan klien TUI lokal yang terverifikasi.
    - Audit config supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
    - Pembersihan lingkungan proxy tertanam untuk service gateway yang menangkap nilai shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` selama instalasi atau pembaruan.
    - Pemeriksaan praktik terbaik runtime Gateway (Node vs Bun, path version-manager).
    - Diagnostik benturan port Gateway (default `18789`).

  </Accordion>
  <Accordion title="Auth, keamanan, dan pairing">
    - Peringatan keamanan untuk kebijakan DM terbuka.
    - Pemeriksaan auth Gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada sumber token; tidak menimpa config token SecretRef).
    - Deteksi masalah pairing perangkat (permintaan pair pertama kali yang tertunda, upgrade role/scope yang tertunda, drift cache device-token lokal usang, dan drift auth catatan paired).

  </Accordion>
  <Accordion title="Workspace dan shell">
    - Pemeriksaan systemd linger di Linux.
    - Pemeriksaan ukuran file bootstrap workspace (peringatan pemotongan/mendekati batas untuk file konteks).
    - Pemeriksaan kesiapan Skills untuk agent default; melaporkan skill yang diizinkan dengan bin, env, config, atau persyaratan OS yang hilang, dan `--fix` dapat menonaktifkan skill yang tidak tersedia di `skills.entries`.
    - Pemeriksaan status completion shell dan auto-install/upgrade.
    - Pemeriksaan kesiapan penyedia embedding pencarian memori (model lokal, kunci API jarak jauh, atau biner QMD).
    - Pemeriksaan instalasi source (ketidakcocokan workspace pnpm, aset UI hilang, biner tsx hilang).
    - Menulis config yang diperbarui + metadata wizard.

  </Accordion>
</AccordionGroup>

## Backfill dan reset UI Dreams

Scene Dreams Control UI mencakup tindakan **Backfill**, **Reset**, dan **Clear Grounded** untuk alur kerja dreaming grounded. Tindakan ini menggunakan metode RPC bergaya gateway doctor, tetapi **bukan** bagian dari perbaikan/migrasi CLI `openclaw doctor`.

Yang dilakukan:

- **Backfill** memindai file historis `memory/YYYY-MM-DD.md` di workspace aktif, menjalankan pass diari REM grounded, dan menulis entri backfill yang dapat dibalik ke `DREAMS.md`.
- **Reset** hanya menghapus entri diari backfill bertanda tersebut dari `DREAMS.md`.
- **Clear Grounded** hanya menghapus entri jangka pendek khusus grounded yang sudah di-stage, yang berasal dari replay historis dan belum mengumpulkan recall live atau dukungan harian.

Yang **tidak** dilakukan sendiri:

- tindakan tersebut tidak mengedit `MEMORY.md`
- tindakan tersebut tidak menjalankan migrasi doctor penuh
- tindakan tersebut tidak otomatis men-stage kandidat grounded ke penyimpanan promosi jangka pendek live kecuali Anda secara eksplisit menjalankan path CLI staged terlebih dahulu

Jika Anda ingin replay historis grounded memengaruhi lane promosi mendalam normal, gunakan alur CLI sebagai gantinya:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Itu men-stage kandidat durable grounded ke penyimpanan dreaming jangka pendek sambil menjaga `DREAMS.md` sebagai permukaan tinjauan.

## Perilaku terperinci dan alasan

<AccordionGroup>
  <Accordion title="0. Pembaruan opsional (instalasi git)">
    Jika ini adalah checkout git dan doctor berjalan secara interaktif, doctor menawarkan untuk memperbarui (fetch/rebase/build) sebelum menjalankan doctor.
  </Accordion>
  <Accordion title="1. Normalisasi config">
    Jika config berisi bentuk nilai lama (misalnya `messages.ackReaction` tanpa override khusus channel), doctor menormalisasinya ke skema saat ini.

    Ini mencakup field datar Talk lama. Config Talk publik saat ini adalah `talk.provider` + `talk.providers.<provider>`. Doctor menulis ulang bentuk lama `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ke map penyedia.

    Doctor juga memperingatkan saat `plugins.allow` tidak kosong dan kebijakan alat menggunakan
    entri alat wildcard atau milik plugin. `tools.allow: ["*"]` hanya cocok dengan alat
    dari plugin yang benar-benar dimuat; itu tidak melewati allowlist plugin eksklusif.
    Doctor menulis `plugins.bundledDiscovery: "compat"` untuk config allowlist lama yang dimigrasikan guna mempertahankan perilaku penyedia bundled yang ada, lalu
    menunjuk ke pengaturan `"allowlist"` yang lebih ketat.

  </Accordion>
  <Accordion title="2. Migrasi kunci config lama">
    Saat config berisi kunci yang sudah deprecated, perintah lain menolak berjalan dan meminta Anda menjalankan `openclaw doctor`.

    Doctor akan:

    - Menjelaskan kunci lama mana yang ditemukan.
    - Menampilkan migrasi yang diterapkannya.
    - Menulis ulang `~/.openclaw/openclaw.json` dengan skema yang diperbarui.

    Gateway juga menjalankan otomatis migrasi doctor saat startup ketika mendeteksi format config lama, sehingga config usang diperbaiki tanpa intervensi manual. Migrasi penyimpanan job Cron ditangani oleh `openclaw doctor --fix`.

    Migrasi saat ini:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - konfigurasi saluran terkonfigurasi yang tidak memiliki kebijakan balasan terlihat → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` tingkat atas
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` lama → `talk.provider` + `talk.providers.<provider>`
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
    - Untuk saluran dengan `accounts` bernama tetapi masih memiliki nilai saluran tingkat atas akun tunggal yang tersisa, pindahkan nilai cakupan akun tersebut ke akun yang dipromosikan yang dipilih untuk saluran itu (`accounts.default` untuk sebagian besar saluran; Matrix dapat mempertahankan target bernama/default yang cocok yang sudah ada)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - hapus `agents.defaults.llm`; gunakan `models.providers.<id>.timeoutSeconds` untuk batas waktu penyedia/model yang lambat
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - hapus `browser.relayBindHost` (pengaturan relay ekstensi lama)
    - `models.providers.*.api: "openai"` lama → `"openai-completions"` (startup Gateway juga melewati penyedia yang `api`-nya diatur ke nilai enum masa depan atau tidak dikenal, alih-alih gagal tertutup)

    Peringatan doctor juga mencakup panduan default akun untuk saluran multi-akun:

    - Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa routing fallback dapat memilih akun yang tidak terduga.
    - Jika `channels.<channel>.defaultAccount` diatur ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

  </Accordion>
  <Accordion title="2b. Penimpaan penyedia OpenCode">
    Jika Anda menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go` secara manual, itu menimpa katalog OpenCode bawaan dari `@mariozechner/pi-ai`. Hal itu dapat memaksa model menggunakan API yang salah atau mengosongkan biaya. Doctor memperingatkan agar Anda dapat menghapus penimpaan dan memulihkan routing API + biaya per model.
  </Accordion>
  <Accordion title="2c. Migrasi browser dan kesiapan Chrome MCP">
    Jika konfigurasi browser Anda masih menunjuk ke jalur ekstensi Chrome yang telah dihapus, doctor menormalkannya ke model attach Chrome MCP host-lokal saat ini:

    - `browser.profiles.*.driver: "extension"` menjadi `"existing-session"`
    - `browser.relayBindHost` dihapus

    Doctor juga mengaudit jalur Chrome MCP host-lokal ketika Anda menggunakan `defaultProfile: "user"` atau profil `existing-session` yang dikonfigurasi:

    - memeriksa apakah Google Chrome terpasang pada host yang sama untuk profil auto-connect default
    - memeriksa versi Chrome yang terdeteksi dan memperingatkan ketika versinya di bawah Chrome 144
    - mengingatkan Anda untuk mengaktifkan debugging jarak jauh di halaman inspeksi browser (misalnya `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, atau `edge://inspect/#remote-debugging`)

    Doctor tidak dapat mengaktifkan pengaturan sisi Chrome untuk Anda. Chrome MCP host-lokal tetap memerlukan:

    - browser berbasis Chromium 144+ pada host gateway/node
    - browser berjalan secara lokal
    - debugging jarak jauh diaktifkan di browser tersebut
    - menyetujui prompt persetujuan attach pertama di browser

    Kesiapan di sini hanya tentang prasyarat attach lokal. Existing-session mempertahankan batas rute Chrome MCP saat ini; rute lanjutan seperti `responsebody`, ekspor PDF, intersepsi unduhan, dan aksi batch tetap memerlukan browser terkelola atau profil CDP mentah.

    Pemeriksaan ini **tidak** berlaku untuk Docker, sandbox, remote-browser, atau alur headless lainnya. Alur tersebut tetap menggunakan CDP mentah.

  </Accordion>
  <Accordion title="2d. Prasyarat OAuth TLS">
    Ketika profil OpenAI Codex OAuth dikonfigurasi, doctor memeriksa endpoint otorisasi OpenAI untuk memverifikasi bahwa stack TLS Node/OpenSSL lokal dapat memvalidasi rantai sertifikat. Jika pemeriksaan gagal dengan kesalahan sertifikat (misalnya `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat self-signed), doctor mencetak panduan perbaikan khusus platform. Pada macOS dengan Node Homebrew, perbaikannya biasanya `brew postinstall ca-certificates`. Dengan `--deep`, pemeriksaan berjalan bahkan jika gateway sehat.
  </Accordion>
  <Accordion title="2e. Penimpaan penyedia Codex OAuth">
    Jika sebelumnya Anda menambahkan pengaturan transport OpenAI lama di bawah `models.providers.openai-codex`, pengaturan tersebut dapat membayangi jalur penyedia Codex OAuth bawaan yang digunakan rilis baru secara otomatis. Doctor memperingatkan ketika melihat pengaturan transport lama tersebut bersama Codex OAuth agar Anda dapat menghapus atau menulis ulang penimpaan transport yang usang dan mendapatkan kembali perilaku routing/fallback bawaan. Proxy kustom dan penimpaan hanya header tetap didukung dan tidak memicu peringatan ini.
  </Accordion>
  <Accordion title="2f. Peringatan rute Plugin Codex">
    Ketika Plugin Codex bawaan diaktifkan, doctor juga memeriksa apakah referensi model utama `openai-codex/*` masih diselesaikan melalui runner PI default. Kombinasi itu valid ketika Anda menginginkan auth OAuth/langganan Codex melalui PI, tetapi mudah tertukar dengan harness app-server Codex native. Doctor memperingatkan dan menunjuk ke bentuk app-server eksplisit: `openai/*` plus `agentRuntime.id: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor tidak memperbaiki ini secara otomatis karena kedua rute valid:

    - `openai-codex/*` + PI berarti "gunakan autentikasi OAuth/langganan Codex melalui runner OpenClaw normal."
    - `openai/*` + `agentRuntime.id: "codex"` berarti "jalankan giliran tersemat melalui server aplikasi Codex native."
    - `/codex ...` berarti "kontrol atau ikat percakapan Codex native dari chat."
    - `/acp ...` atau `runtime: "acp"` berarti "gunakan adapter ACP/acpx eksternal."

    Jika peringatan muncul, pilih rute yang Anda maksud dan edit konfigurasi secara manual. Biarkan peringatan apa adanya jika OAuth PI Codex memang disengaja.

  </Accordion>
  <Accordion title="2g. Pembersihan rute sesi">
    Doctor juga memindai penyimpanan sesi aktif untuk state rute lama yang dibuat otomatis setelah Anda memindahkan model atau runtime default/fallback yang dikonfigurasi dari rute milik plugin seperti Codex.

    `openclaw doctor --fix` dapat menghapus state lama yang dibuat otomatis seperti pin model `modelOverrideSource: "auto"`, metadata model runtime, id harness yang dipin, binding sesi CLI, dan override profil autentikasi otomatis saat rute pemiliknya tidak lagi dikonfigurasi. Pilihan model sesi eksplisit pengguna atau legacy dilaporkan untuk peninjauan manual dan dibiarkan tidak tersentuh; alihkan dengan `/model ...`, `/new`, atau reset sesi saat rute tersebut tidak lagi dimaksudkan.

  </Accordion>
  <Accordion title="3. Migrasi state legacy (tata letak disk)">
    Doctor dapat memigrasikan tata letak on-disk lama ke struktur saat ini:

    - Penyimpanan sesi + transkrip:
      - dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
    - Direktori agen:
      - dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
    - State autentikasi WhatsApp (Baileys):
      - dari legacy `~/.openclaw/credentials/*.json` (kecuali `oauth.json`)
      - ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (id akun default: `default`)

    Migrasi ini bersifat upaya terbaik dan idempoten; doctor akan mengeluarkan peringatan saat meninggalkan folder legacy sebagai cadangan. Gateway/CLI juga memigrasikan otomatis sesi legacy + direktori agen saat startup sehingga riwayat/autentikasi/model masuk ke jalur per-agen tanpa menjalankan doctor secara manual. Autentikasi WhatsApp sengaja hanya dimigrasikan melalui `openclaw doctor`. Normalisasi provider bincang/peta provider kini membandingkan berdasarkan kesetaraan struktural, sehingga diff yang hanya berupa urutan kunci tidak lagi memicu perubahan no-op `doctor --fix` berulang.

  </Accordion>
  <Accordion title="3a. Migrasi manifes plugin legacy">
    Doctor memindai semua manifes plugin yang terpasang untuk kunci kapabilitas tingkat atas yang sudah deprecated (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Saat ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts` dan menulis ulang file manifes di tempat. Migrasi ini idempoten; jika kunci `contracts` sudah memiliki nilai yang sama, kunci legacy dihapus tanpa menduplikasi data.
  </Accordion>
  <Accordion title="3b. Migrasi penyimpanan cron legacy">
    Doctor juga memeriksa penyimpanan job cron (`~/.openclaw/cron/jobs.json` secara default, atau `cron.store` saat dioverride) untuk bentuk job lama yang masih diterima scheduler demi kompatibilitas.

    Pembersihan cron saat ini meliputi:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - field payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
    - field pengiriman tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias pengiriman `provider` payload → `delivery.channel` eksplisit
    - job fallback webhook `notify: true` legacy sederhana → `delivery.mode="webhook"` eksplisit dengan `delivery.to=cron.webhook`

    Doctor hanya memigrasikan otomatis job `notify: true` saat dapat melakukannya tanpa mengubah perilaku. Jika suatu job menggabungkan fallback notify legacy dengan mode pengiriman non-webhook yang sudah ada, doctor memperingatkan dan membiarkan job tersebut untuk peninjauan manual.

    Di Linux, doctor juga memperingatkan ketika crontab pengguna masih memanggil `~/.openclaw/bin/ensure-whatsapp.sh` lawas. Skrip host-lokal itu tidak dikelola oleh OpenClaw saat ini dan dapat menulis pesan `Gateway inactive` palsu ke `~/.openclaw/logs/whatsapp-health.log` ketika cron tidak dapat menjangkau bus pengguna systemd. Hapus entri crontab usang dengan `crontab -e`; gunakan `openclaw channels status --probe`, `openclaw doctor`, dan `openclaw gateway status` untuk pemeriksaan kesehatan saat ini.

  </Accordion>
  <Accordion title="3c. Pembersihan kunci sesi">
    Doctor memindai setiap direktori sesi agen untuk file kunci tulis yang usang — file yang tertinggal ketika sesi keluar secara abnormal. Untuk setiap file kunci yang ditemukan, doctor melaporkan: path, PID, apakah PID masih hidup, usia kunci, dan apakah kunci dianggap usang (PID mati atau lebih lama dari 30 menit). Dalam mode `--fix` / `--repair`, doctor menghapus file kunci usang secara otomatis; jika tidak, doctor mencetak catatan dan menginstruksikan Anda untuk menjalankan ulang dengan `--fix`.
  </Accordion>
  <Accordion title="3d. Perbaikan cabang transkrip sesi">
    Doctor memindai file JSONL sesi agen untuk bentuk cabang terduplikasi yang dibuat oleh bug penulisan ulang transkrip prompt 2026.4.24: giliran pengguna yang ditinggalkan dengan konteks runtime internal OpenClaw plus sibling aktif yang berisi prompt pengguna terlihat yang sama. Dalam mode `--fix` / `--repair`, doctor mencadangkan setiap file yang terpengaruh di sebelah file asli dan menulis ulang transkrip ke cabang aktif sehingga riwayat gateway dan pembaca memori tidak lagi melihat giliran duplikat.
  </Accordion>
  <Accordion title="4. Pemeriksaan integritas state (persistensi sesi, perutean, dan keselamatan)">
    Direktori state adalah batang otak operasional. Jika hilang, Anda kehilangan sesi, kredensial, log, dan konfigurasi (kecuali Anda memiliki cadangan di tempat lain).

    Doctor memeriksa:

    - **Direktori state hilang**: memperingatkan tentang kehilangan state yang katastrofik, meminta untuk membuat ulang direktori, dan mengingatkan Anda bahwa doctor tidak dapat memulihkan data yang hilang.
    - **Izin direktori state**: memverifikasi kemampuan tulis; menawarkan untuk memperbaiki izin (dan memancarkan petunjuk `chown` ketika ketidakcocokan owner/group terdeteksi).
    - **Direktori state tersinkron cloud macOS**: memperingatkan ketika state mengarah ke bawah iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau `~/Library/CloudStorage/...` karena path yang didukung sinkronisasi dapat menyebabkan I/O lebih lambat dan race kunci/sinkronisasi.
    - **Direktori state SD atau eMMC Linux**: memperingatkan ketika state mengarah ke sumber mount `mmcblk*`, karena I/O acak yang didukung SD atau eMMC dapat lebih lambat dan lebih cepat aus saat penulisan sesi dan kredensial.
    - **Direktori sesi hilang**: `sessions/` dan direktori penyimpanan sesi diperlukan untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
    - **Ketidakcocokan transkrip**: memperingatkan ketika entri sesi terbaru memiliki file transkrip yang hilang.
    - **Sesi utama "JSONL 1 baris"**: menandai ketika transkrip utama hanya memiliki satu baris (riwayat tidak bertambah).
    - **Beberapa direktori state**: memperingatkan ketika beberapa folder `~/.openclaw` ada di berbagai direktori home atau ketika `OPENCLAW_STATE_DIR` menunjuk ke tempat lain (riwayat dapat terbagi antar instalasi).
    - **Pengingat mode jarak jauh**: jika `gateway.mode=remote`, doctor mengingatkan Anda untuk menjalankannya di host jarak jauh (state berada di sana).
    - **Izin file konfigurasi**: memperingatkan jika `~/.openclaw/openclaw.json` dapat dibaca group/world dan menawarkan untuk memperketatnya menjadi `600`.

  </Accordion>
  <Accordion title="5. Kesehatan auth model (kedaluwarsa OAuth)">
    Doctor memeriksa profil OAuth di penyimpanan auth, memperingatkan ketika token akan kedaluwarsa/telah kedaluwarsa, dan dapat menyegarkannya ketika aman. Jika profil OAuth/token Anthropic sudah basi, doctor menyarankan kunci API Anthropic atau path setup-token Anthropic. Prompt penyegaran hanya muncul ketika berjalan secara interaktif (TTY); `--non-interactive` melewati upaya penyegaran.

    Ketika penyegaran OAuth gagal secara permanen (misalnya `refresh_token_reused`, `invalid_grant`, atau provider memberi tahu Anda untuk masuk lagi), doctor melaporkan bahwa re-auth diperlukan dan mencetak perintah persis `openclaw models auth login --provider ...` yang harus dijalankan.

    Doctor juga melaporkan profil auth yang sementara tidak dapat digunakan karena:

    - cooldown singkat (rate limit/timeout/kegagalan auth)
    - penonaktifan lebih lama (kegagalan penagihan/kredit)

  </Accordion>
  <Accordion title="6. Validasi model hooks">
    Jika `hooks.gmail.model` disetel, doctor memvalidasi referensi model terhadap katalog dan allowlist serta memperingatkan ketika referensi tidak akan terselesaikan atau tidak diizinkan.
  </Accordion>
  <Accordion title="7. Perbaikan image sandbox">
    Ketika sandboxing diaktifkan, doctor memeriksa image Docker dan menawarkan untuk membangun atau beralih ke nama lawas jika image saat ini hilang.
  </Accordion>
  <Accordion title="7b. Pembersihan instalasi Plugin">
    Doctor menghapus state staging dependensi Plugin yang dihasilkan OpenClaw secara lawas dalam mode `openclaw doctor --fix` / `openclaw doctor --repair`. Ini mencakup root dependensi yang dihasilkan dan sudah usang, direktori install-stage lama, sisa lokal paket dari kode perbaikan dependensi Plugin bawaan sebelumnya, serta salinan npm terkelola yang yatim atau dipulihkan dari Plugin `@openclaw/*` bawaan yang dapat membayangi manifes bawaan saat ini.

    Doctor juga dapat menginstal ulang Plugin unduhan yang hilang ketika konfigurasi mereferensikannya tetapi registry Plugin lokal tidak dapat menemukannya. Contohnya mencakup `plugins.entries` material, pengaturan channel/provider/search yang dikonfigurasi, dan runtime agen yang dikonfigurasi. Selama pembaruan paket, doctor menghindari menjalankan perbaikan Plugin package-manager saat paket inti sedang ditukar; jalankan `openclaw doctor --fix` lagi setelah pembaruan jika Plugin yang dikonfigurasi masih perlu pemulihan. Startup Gateway dan pemuatan ulang konfigurasi tidak menjalankan package manager; instalasi Plugin tetap merupakan pekerjaan doctor/install/update yang eksplisit.

  </Accordion>
  <Accordion title="8. Migrasi layanan Gateway dan petunjuk pembersihan">
    Doctor mendeteksi layanan gateway lawas (launchd/systemd/schtasks) dan menawarkan untuk menghapusnya serta menginstal layanan OpenClaw menggunakan port gateway saat ini. Doctor juga dapat memindai layanan tambahan yang mirip gateway dan mencetak petunjuk pembersihan. Layanan gateway OpenClaw bernama profil dianggap kelas satu dan tidak ditandai sebagai "ekstra."

    Di Linux, jika layanan gateway tingkat pengguna hilang tetapi layanan gateway OpenClaw tingkat sistem ada, doctor tidak menginstal layanan tingkat pengguna kedua secara otomatis. Periksa dengan `openclaw gateway status --deep` atau `openclaw doctor --deep`, lalu hapus duplikatnya atau setel `OPENCLAW_SERVICE_REPAIR_POLICY=external` ketika supervisor sistem memiliki siklus hidup gateway.

  </Accordion>
  <Accordion title="8b. Migrasi startup Matrix">
    Ketika akun channel Matrix memiliki migrasi state lawas yang tertunda atau dapat ditindaklanjuti, doctor (dalam mode `--fix` / `--repair`) membuat snapshot pra-migrasi lalu menjalankan langkah migrasi best-effort: migrasi state Matrix lawas dan persiapan state terenkripsi lawas. Kedua langkah bersifat non-fatal; error dicatat dan startup berlanjut. Dalam mode baca-saja (`openclaw doctor` tanpa `--fix`) pemeriksaan ini dilewati seluruhnya.
  </Accordion>
  <Accordion title="8c. Pairing perangkat dan drift auth">
    Doctor sekarang memeriksa state pairing perangkat sebagai bagian dari health pass normal.

    Yang dilaporkan:

    - permintaan pairing pertama kali yang tertunda
    - peningkatan peran tertunda untuk perangkat yang sudah dipairing
    - peningkatan scope tertunda untuk perangkat yang sudah dipairing
    - perbaikan ketidakcocokan kunci publik ketika id perangkat masih cocok tetapi identitas perangkat tidak lagi cocok dengan record yang disetujui
    - record yang dipairing kehilangan token aktif untuk peran yang disetujui
    - token yang dipairing yang scope-nya drift keluar dari baseline pairing yang disetujui
    - entri device-token cache lokal untuk mesin saat ini yang mendahului rotasi token sisi gateway atau membawa metadata scope usang

    Doctor tidak menyetujui otomatis permintaan pairing atau merotasi otomatis token perangkat. Doctor mencetak langkah berikutnya yang tepat sebagai gantinya:

    - periksa permintaan tertunda dengan `openclaw devices list`
    - setujui permintaan persis dengan `openclaw devices approve <requestId>`
    - rotasi token baru dengan `openclaw devices rotate --device <deviceId> --role <role>`
    - hapus dan setujui ulang record usang dengan `openclaw devices remove <deviceId>`

    Ini menutup celah umum "sudah dipairing tetapi masih mendapatkan pairing required": doctor sekarang membedakan pairing pertama kali dari peningkatan peran/scope yang tertunda dan dari drift token/identitas perangkat yang usang.

  </Accordion>
  <Accordion title="9. Peringatan keamanan">
    Doctor memancarkan peringatan ketika provider terbuka untuk DM tanpa allowlist, atau ketika policy dikonfigurasi dengan cara yang berbahaya.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jika berjalan sebagai layanan pengguna systemd, doctor memastikan lingering diaktifkan agar gateway tetap hidup setelah logout.
  </Accordion>
  <Accordion title="11. Status workspace (Skills, Plugin, dan direktori lawas)">
    Doctor mencetak ringkasan state workspace untuk agen default:

    - **Status Skills**: menghitung skill yang memenuhi syarat, yang persyaratannya hilang, dan yang diblokir allowlist.
    - **Direktori workspace lawas**: memperingatkan ketika `~/openclaw` atau direktori workspace lawas lainnya ada berdampingan dengan workspace saat ini.
    - **Status Plugin**: menghitung Plugin yang diaktifkan/dinonaktifkan/error; mencantumkan ID Plugin untuk error apa pun; melaporkan kapabilitas Plugin bundel.
    - **Peringatan kompatibilitas Plugin**: menandai Plugin yang memiliki masalah kompatibilitas dengan runtime saat ini.
    - **Diagnostik Plugin**: menampilkan peringatan atau error waktu muat apa pun yang dipancarkan oleh registry Plugin.

  </Accordion>
  <Accordion title="11b. Ukuran file bootstrap">
    Doctor memeriksa apakah file bootstrap workspace (misalnya `AGENTS.md`, `CLAUDE.md`, atau file konteks terinjeksi lainnya) mendekati atau melebihi anggaran karakter yang dikonfigurasi. Doctor melaporkan jumlah karakter mentah vs. terinjeksi per file, persentase pemotongan, penyebab pemotongan (`max/file` atau `max/total`), dan total karakter terinjeksi sebagai fraksi dari total anggaran. Ketika file dipotong atau mendekati batas, doctor mencetak tips untuk menyetel `agents.defaults.bootstrapMaxChars` dan `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pembersihan Plugin channel usang">
    Ketika `openclaw doctor --fix` menghapus Plugin channel yang hilang, doctor juga menghapus konfigurasi menggantung berscope channel yang mereferensikan Plugin tersebut: entri `channels.<id>`, target heartbeat yang menyebut channel, dan override `agents.*.models["<channel>/*"]`. Ini mencegah boot loop Gateway ketika runtime channel sudah hilang tetapi konfigurasi masih meminta gateway untuk mengikat ke runtime tersebut.
  </Accordion>
  <Accordion title="11c. Completion shell">
    Doctor memeriksa apakah completion tab terinstal untuk shell saat ini (zsh, bash, fish, atau PowerShell):

    - Jika profil shell menggunakan pola completion dinamis yang lambat (`source <(openclaw completion ...)`), doctor memutakhirkannya ke varian file cache yang lebih cepat.
    - Jika completion dikonfigurasi di profil tetapi file cache hilang, doctor meregenerasi cache secara otomatis.
    - Jika tidak ada completion yang dikonfigurasi sama sekali, doctor meminta untuk menginstalnya (hanya mode interaktif; dilewati dengan `--non-interactive`).

    Jalankan `openclaw completion --write-state` untuk meregenerasi cache secara manual.

  </Accordion>
  <Accordion title="12. Pemeriksaan auth Gateway (token lokal)">
    Doctor memeriksa kesiapan auth token gateway lokal.

    - Jika mode token memerlukan token dan tidak ada sumber token, doctor menawarkan untuk membuatnya.
    - Jika `gateway.auth.token` dikelola SecretRef tetapi tidak tersedia, doctor memperingatkan dan tidak menimpanya dengan plaintext.
    - `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya ketika tidak ada SecretRef token yang dikonfigurasi.

  </Accordion>
  <Accordion title="12b. Perbaikan sadar SecretRef baca-saja">
    Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku fail-fast runtime.

    - `openclaw doctor --fix` sekarang menggunakan model ringkasan SecretRef baca-saja yang sama seperti perintah keluarga status untuk perbaikan config tertarget.
    - Contoh: Perbaikan `allowFrom` / `groupAllowFrom` `@username` Telegram mencoba menggunakan kredensial bot yang dikonfigurasi jika tersedia.
    - Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia di jalur perintah saat ini, doctor melaporkan bahwa kredensial tersebut dikonfigurasi-tetapi-tidak-tersedia dan melewati resolusi otomatis alih-alih mogok atau salah melaporkan token sebagai hilang.

  </Accordion>
  <Accordion title="13. Pemeriksaan kesehatan Gateway + mulai ulang">
    Doctor menjalankan pemeriksaan kesehatan dan menawarkan untuk memulai ulang gateway ketika terlihat tidak sehat.
  </Accordion>
  <Accordion title="13b. Kesiapan pencarian memori">
    Doctor memeriksa apakah penyedia embedding pencarian memori yang dikonfigurasi siap untuk agent default. Perilakunya bergantung pada backend dan penyedia yang dikonfigurasi:

    - **Backend QMD**: memeriksa apakah binary `qmd` tersedia dan dapat dimulai. Jika tidak, mencetak panduan perbaikan termasuk paket npm dan opsi jalur binary manual.
    - **Penyedia lokal eksplisit**: memeriksa file model lokal atau URL model jarak jauh/dapat diunduh yang dikenali. Jika hilang, menyarankan beralih ke penyedia jarak jauh.
    - **Penyedia jarak jauh eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa kunci API ada di environment atau penyimpanan auth. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika hilang.
    - **Penyedia otomatis**: memeriksa ketersediaan model lokal terlebih dahulu, lalu mencoba setiap penyedia jarak jauh sesuai urutan pemilihan otomatis.

    Ketika hasil probe gateway yang di-cache tersedia (gateway sehat pada saat pemeriksaan), doctor mencocokkan hasilnya dengan config yang terlihat oleh CLI dan mencatat setiap ketidaksesuaian. Doctor tidak memulai ping embedding baru pada jalur default; gunakan perintah status memori mendalam ketika Anda menginginkan pemeriksaan penyedia langsung.

    Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

  </Accordion>
  <Accordion title="14. Peringatan status channel">
    Jika gateway sehat, doctor menjalankan probe status channel dan melaporkan peringatan dengan saran perbaikan.
  </Accordion>
  <Accordion title="15. Audit config supervisor + perbaikan">
    Doctor memeriksa config supervisor yang terinstal (launchd/systemd/schtasks) untuk default yang hilang atau kedaluwarsa (misalnya dependensi systemd network-online dan jeda mulai ulang). Ketika menemukan ketidaksesuaian, doctor merekomendasikan pembaruan dan dapat menulis ulang file layanan/task ke default saat ini.

    Catatan:

    - `openclaw doctor` meminta konfirmasi sebelum menulis ulang config supervisor.
    - `openclaw doctor --yes` menerima prompt perbaikan default.
    - `openclaw doctor --repair` menerapkan perbaikan yang direkomendasikan tanpa prompt.
    - `openclaw doctor --repair --force` menimpa config supervisor kustom.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` menjaga doctor tetap baca-saja untuk siklus hidup layanan gateway. Doctor tetap melaporkan kesehatan layanan dan menjalankan perbaikan non-layanan, tetapi melewati instal/mulai/mulai ulang/bootstrap layanan, penulisan ulang config supervisor, dan pembersihan layanan legacy karena supervisor eksternal memiliki siklus hidup tersebut.
    - Di Linux, doctor tidak menulis ulang metadata command/entrypoint saat unit gateway systemd yang sesuai aktif. Doctor juga mengabaikan unit tambahan mirip gateway non-legacy yang tidak aktif selama pemindaian layanan duplikat sehingga file layanan pendamping tidak menimbulkan noise pembersihan.
    - Jika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, instalasi/perbaikan layanan doctor memvalidasi SecretRef tetapi tidak mempertahankan nilai token plaintext yang terselesaikan ke metadata environment layanan supervisor.
    - Doctor mendeteksi nilai environment layanan berbasis `.env` terkelola/SecretRef yang ditanamkan inline oleh instalasi LaunchAgent, systemd, atau Windows Scheduled Task lama dan menulis ulang metadata layanan agar nilai tersebut dimuat dari sumber runtime alih-alih definisi supervisor.
    - Doctor mendeteksi ketika command layanan masih mengunci `--port` lama setelah `gateway.port` berubah dan menulis ulang metadata layanan ke port saat ini.
    - Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi belum terselesaikan, doctor memblokir jalur instalasi/perbaikan dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum diatur, doctor memblokir instalasi/perbaikan sampai mode diatur secara eksplisit.
    - Untuk unit Linux user-systemd, pemeriksaan drift token doctor sekarang mencakup sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata auth layanan.
    - Perbaikan layanan doctor menolak menulis ulang, menghentikan, atau memulai ulang layanan gateway dari binary OpenClaw lama ketika config terakhir ditulis oleh versi yang lebih baru. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostik runtime Gateway + port">
    Doctor memeriksa runtime layanan (PID, status keluar terakhir) dan memperingatkan ketika layanan terinstal tetapi sebenarnya tidak berjalan. Doctor juga memeriksa tabrakan port pada port gateway (default `18789`) dan melaporkan kemungkinan penyebab (gateway sudah berjalan, tunnel SSH).
  </Accordion>
  <Accordion title="17. Praktik terbaik runtime Gateway">
    Doctor memperingatkan ketika layanan gateway berjalan di Bun atau jalur Node yang dikelola versi (`nvm`, `fnm`, `volta`, `asdf`, dll.). Channel WhatsApp + Telegram memerlukan Node, dan jalur pengelola versi dapat rusak setelah upgrade karena layanan tidak memuat init shell Anda. Doctor menawarkan migrasi ke instalasi Node sistem ketika tersedia (Homebrew/apt/choco).

    LaunchAgent macOS yang baru diinstal atau diperbaiki menggunakan PATH sistem kanonis (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) alih-alih menyalin PATH shell interaktif, sehingga direktori Volta, asdf, fnm, pnpm, dan pengelola versi lainnya tidak mengubah Node mana yang di-resolve oleh proses child. Layanan Linux tetap mempertahankan root environment eksplisit (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) dan direktori user-bin yang stabil, tetapi direktori fallback pengelola versi hasil tebakan hanya ditulis ke PATH layanan ketika direktori tersebut ada di disk.

  </Accordion>
  <Accordion title="18. Penulisan config + metadata wizard">
    Doctor mempertahankan setiap perubahan config dan memberi cap metadata wizard untuk merekam proses doctor.
  </Accordion>
  <Accordion title="19. Tips workspace (cadangan + sistem memori)">
    Doctor menyarankan sistem memori workspace ketika hilang dan mencetak tip cadangan jika workspace belum berada di bawah git.

    Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap tentang struktur workspace dan cadangan git (disarankan GitHub atau GitLab privat).

  </Accordion>
</AccordionGroup>

## Terkait

- [Runbook Gateway](/id/gateway)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
