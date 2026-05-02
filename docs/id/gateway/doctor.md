---
read_when:
    - Menambahkan atau mengubah migrasi doctor
    - Memperkenalkan perubahan konfigurasi yang memutus kompatibilitas
sidebarTitle: Doctor
summary: 'Perintah doctor: pemeriksaan kesehatan, migrasi konfigurasi, dan langkah perbaikan'
title: Dokter
x-i18n:
    generated_at: "2026-05-02T20:44:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 504cf06e8457315eb1df4970a877b88fdc2e32f34974ce789875373e9e030234
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` adalah alat perbaikan + migrasi untuk OpenClaw. Alat ini memperbaiki config/status yang usang, memeriksa kesehatan, dan menyediakan langkah perbaikan yang dapat ditindaklanjuti.

## Mulai cepat

```bash
openclaw doctor
```

### Mode tanpa antarmuka dan otomatisasi

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Terima default tanpa prompt (termasuk langkah restart/layanan/perbaikan sandbox jika berlaku).

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

    Jalankan tanpa prompt dan hanya terapkan migrasi aman (normalisasi config + pemindahan status di disk). Melewati tindakan restart/layanan/sandbox yang memerlukan konfirmasi manusia. Migrasi status lama berjalan otomatis saat terdeteksi.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Pindai layanan sistem untuk instalasi Gateway tambahan (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Jika Anda ingin meninjau perubahan sebelum menulis, buka file config terlebih dahulu:

```bash
cat ~/.openclaw/openclaw.json
```

## Apa yang dilakukan (ringkasan)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - Pembaruan pra-pemeriksaan opsional untuk instalasi git (hanya interaktif).
    - Pemeriksaan kesegaran protokol UI (membangun ulang Control UI saat skema protokol lebih baru).
    - Pemeriksaan kesehatan + prompt restart.
    - Ringkasan status Skills (memenuhi syarat/hilang/diblokir) dan status plugin.

  </Accordion>
  <Accordion title="Config and migrations">
    - Normalisasi config untuk nilai lama.
    - Migrasi config Talk dari kolom datar lama `talk.*` ke `talk.provider` + `talk.providers.<provider>`.
    - Pemeriksaan migrasi browser untuk config ekstensi Chrome lama dan kesiapan Chrome MCP.
    - Peringatan override penyedia OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Peringatan pembayangan OAuth Codex (`models.providers.openai-codex`).
    - Pemeriksaan prasyarat TLS OAuth untuk profil OAuth OpenAI Codex.
    - Peringatan allowlist Plugin/tool saat `plugins.allow` bersifat restriktif tetapi kebijakan tool masih meminta wildcard atau tool milik plugin.
    - Migrasi status lama di disk (sessions/dir agen/auth WhatsApp).
    - Migrasi kunci kontrak manifes plugin lama (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrasi store cron lama (`jobId`, `schedule.cron`, kolom delivery/payload tingkat atas, payload `provider`, job fallback webhook sederhana `notify: true`).
    - Migrasi kebijakan runtime agen lama ke `agents.defaults.agentRuntime` dan `agents.list[].agentRuntime`.
    - Pembersihan config plugin usang saat plugin diaktifkan; saat `plugins.enabled=false`, referensi plugin usang diperlakukan sebagai config containment inert dan dipertahankan.

  </Accordion>
  <Accordion title="State and integrity">
    - Inspeksi file lock session dan pembersihan lock usang.
    - Perbaikan transkrip session untuk cabang penulisan ulang prompt duplikat yang dibuat oleh build 2026.4.24 yang terdampak.
    - Deteksi tombstone pemulihan-restart subagent yang tersangkut, dengan dukungan `--fix` untuk menghapus flag pemulihan dibatalkan yang usang agar startup tidak terus memperlakukan child sebagai dibatalkan saat restart.
    - Pemeriksaan integritas status dan izin (sessions, transkrip, dir status).
    - Pemeriksaan izin file config (chmod 600) saat berjalan secara lokal.
    - Kesehatan auth model: memeriksa kedaluwarsa OAuth, dapat menyegarkan token yang hampir kedaluwarsa, dan melaporkan status cooldown/dinonaktifkan auth-profile.
    - Deteksi dir workspace tambahan (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Perbaikan image sandbox saat sandboxing diaktifkan.
    - Migrasi layanan lama dan deteksi Gateway tambahan.
    - Migrasi status lama channel Matrix (dalam mode `--fix` / `--repair`).
    - Pemeriksaan runtime Gateway (layanan terinstal tetapi tidak berjalan; label launchd yang di-cache).
    - Peringatan status channel (di-probe dari Gateway yang sedang berjalan).
    - Audit config supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
    - Pembersihan environment proxy tersemat untuk layanan Gateway yang menangkap nilai shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` selama instalasi atau pembaruan.
    - Pemeriksaan praktik terbaik runtime Gateway (Node vs Bun, path version-manager).
    - Diagnostik benturan port Gateway (default `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Peringatan keamanan untuk kebijakan DM terbuka.
    - Pemeriksaan auth Gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada sumber token; tidak menimpa config SecretRef token).
    - Deteksi masalah pairing perangkat (permintaan pair pertama kali yang tertunda, upgrade role/scope yang tertunda, drift cache token perangkat lokal yang usang, dan drift auth record yang sudah dipairing).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Pemeriksaan systemd linger di Linux.
    - Pemeriksaan ukuran file bootstrap workspace (peringatan terpotong/mendekati batas untuk file konteks).
    - Pemeriksaan kesiapan Skills untuk agen default; melaporkan skill yang diizinkan dengan bin, env, config, atau persyaratan OS yang hilang, dan `--fix` dapat menonaktifkan skill yang tidak tersedia di `skills.entries`.
    - Pemeriksaan status penyelesaian shell dan instalasi/upgrade otomatis.
    - Pemeriksaan kesiapan penyedia embedding pencarian memori (model lokal, kunci API remote, atau binary QMD).
    - Pemeriksaan instalasi source (ketidakcocokan workspace pnpm, aset UI hilang, binary tsx hilang).
    - Menulis config yang diperbarui + metadata wizard.

  </Accordion>
</AccordionGroup>

## Backfill dan reset UI Dreams

Scene Dreams di Control UI menyertakan tindakan **Backfill**, **Reset**, dan **Clear Grounded** untuk alur kerja dreaming yang grounded. Tindakan ini menggunakan metode RPC bergaya doctor Gateway, tetapi **bukan** bagian dari perbaikan/migrasi CLI `openclaw doctor`.

Yang dilakukan:

- **Backfill** memindai file historis `memory/YYYY-MM-DD.md` di workspace aktif, menjalankan pass diary REM grounded, dan menulis entri backfill yang dapat dibalik ke `DREAMS.md`.
- **Reset** hanya menghapus entri diary backfill yang ditandai tersebut dari `DREAMS.md`.
- **Clear Grounded** hanya menghapus entri jangka pendek khusus grounded yang sudah distage, yang berasal dari replay historis dan belum mengakumulasi recall live atau dukungan harian.

Yang **tidak** dilakukan sendiri:

- tindakan ini tidak mengedit `MEMORY.md`
- tindakan ini tidak menjalankan migrasi doctor penuh
- tindakan ini tidak otomatis men-stage kandidat grounded ke store promosi jangka pendek live kecuali Anda secara eksplisit menjalankan path CLI staged terlebih dahulu

Jika Anda ingin replay historis grounded memengaruhi lane promosi mendalam normal, gunakan alur CLI sebagai gantinya:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Itu men-stage kandidat tahan lama grounded ke store dreaming jangka pendek sambil mempertahankan `DREAMS.md` sebagai permukaan peninjauan.

## Perilaku mendetail dan alasan

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Jika ini adalah checkout git dan doctor berjalan secara interaktif, ia menawarkan untuk memperbarui (fetch/rebase/build) sebelum menjalankan doctor.
  </Accordion>
  <Accordion title="1. Config normalization">
    Jika config berisi bentuk nilai lama (misalnya `messages.ackReaction` tanpa override khusus channel), doctor menormalisasinya ke skema saat ini.

    Itu termasuk kolom datar Talk lama. Config Talk publik saat ini adalah `talk.provider` + `talk.providers.<provider>`. Doctor menulis ulang bentuk lama `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ke dalam map penyedia.

    Doctor juga memperingatkan saat `plugins.allow` tidak kosong dan kebijakan tool menggunakan
    entri wildcard atau tool milik plugin. `tools.allow: ["*"]` hanya cocok dengan tool
    dari plugin yang benar-benar dimuat; itu tidak melewati allowlist plugin eksklusif.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Saat config berisi kunci yang sudah deprecated, perintah lain menolak berjalan dan meminta Anda menjalankan `openclaw doctor`.

    Doctor akan:

    - Menjelaskan kunci lama mana yang ditemukan.
    - Menampilkan migrasi yang diterapkan.
    - Menulis ulang `~/.openclaw/openclaw.json` dengan skema yang diperbarui.

    Gateway juga otomatis menjalankan migrasi doctor saat startup ketika mendeteksi format config lama, sehingga config usang diperbaiki tanpa intervensi manual. Migrasi store job Cron ditangani oleh `openclaw doctor --fix`.

    Migrasi saat ini:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` tingkat teratas
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
    - Untuk kanal dengan `accounts` bernama tetapi masih memiliki nilai kanal tingkat atas akun tunggal yang tersisa, pindahkan nilai bercakupan akun tersebut ke akun yang dipromosikan yang dipilih untuk kanal itu (`accounts.default` untuk sebagian besar kanal; Matrix dapat mempertahankan target bernama/default yang sudah ada dan cocok)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - hapus `agents.defaults.llm`; gunakan `models.providers.<id>.timeoutSeconds` untuk batas waktu provider/model yang lambat
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - hapus `browser.relayBindHost` (pengaturan relai ekstensi lama)
    - `models.providers.*.api: "openai"` lama → `"openai-completions"` (startup Gateway juga melewati provider yang `api`-nya disetel ke nilai enum masa depan atau tidak dikenal, bukan gagal tertutup)

    Peringatan doctor juga menyertakan panduan default akun untuk kanal multi-akun:

    - Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa perutean fallback dapat memilih akun yang tidak terduga.
    - Jika `channels.<channel>.defaultAccount` disetel ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

  </Accordion>
  <Accordion title="2b. Override provider OpenCode">
    Jika Anda menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go` secara manual, itu menimpa katalog OpenCode bawaan dari `@mariozechner/pi-ai`. Hal itu dapat memaksa model ke API yang salah atau mengosongkan biaya. Doctor memperingatkan agar Anda dapat menghapus override tersebut dan memulihkan perutean API + biaya per model.
  </Accordion>
  <Accordion title="2c. Migrasi browser dan kesiapan Chrome MCP">
    Jika konfigurasi browser Anda masih mengarah ke jalur ekstensi Chrome yang dihapus, doctor menormalkannya ke model attach Chrome MCP host-lokal saat ini:

    - `browser.profiles.*.driver: "extension"` menjadi `"existing-session"`
    - `browser.relayBindHost` dihapus

    Doctor juga mengaudit jalur Chrome MCP host-lokal saat Anda menggunakan `defaultProfile: "user"` atau profil `existing-session` yang dikonfigurasi:

    - memeriksa apakah Google Chrome terpasang pada host yang sama untuk profil koneksi otomatis default
    - memeriksa versi Chrome yang terdeteksi dan memperingatkan saat versinya di bawah Chrome 144
    - mengingatkan Anda untuk mengaktifkan debugging jarak jauh di halaman inspeksi browser (misalnya `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, atau `edge://inspect/#remote-debugging`)

    Doctor tidak dapat mengaktifkan pengaturan sisi Chrome untuk Anda. Chrome MCP host-lokal tetap memerlukan:

    - browser berbasis Chromium 144+ di host gateway/node
    - browser berjalan secara lokal
    - debugging jarak jauh diaktifkan di browser tersebut
    - menyetujui prompt persetujuan attach pertama di browser

    Kesiapan di sini hanya terkait prasyarat attach lokal. Existing-session mempertahankan batas rute Chrome MCP saat ini; rute lanjutan seperti `responsebody`, ekspor PDF, intersepsi unduhan, dan aksi batch tetap memerlukan browser terkelola atau profil CDP mentah.

    Pemeriksaan ini **tidak** berlaku untuk Docker, sandbox, remote-browser, atau alur headless lain. Alur tersebut terus menggunakan CDP mentah.

  </Accordion>
  <Accordion title="2d. Prasyarat TLS OAuth">
    Saat profil OAuth OpenAI Codex dikonfigurasi, doctor memeriksa endpoint otorisasi OpenAI untuk memverifikasi bahwa stack TLS Node/OpenSSL lokal dapat memvalidasi rantai sertifikat. Jika pemeriksaan gagal dengan error sertifikat (misalnya `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat yang ditandatangani sendiri), doctor mencetak panduan perbaikan spesifik platform. Di macOS dengan Node Homebrew, perbaikannya biasanya `brew postinstall ca-certificates`. Dengan `--deep`, pemeriksaan berjalan meskipun gateway sehat.
  </Accordion>
  <Accordion title="2e. Override provider OAuth Codex">
    Jika sebelumnya Anda menambahkan pengaturan transport OpenAI lama di bawah `models.providers.openai-codex`, pengaturan itu dapat membayangi jalur provider OAuth Codex bawaan yang digunakan rilis yang lebih baru secara otomatis. Doctor memperingatkan saat melihat pengaturan transport lama tersebut bersama OAuth Codex agar Anda dapat menghapus atau menulis ulang override transport usang dan mendapatkan kembali perilaku perutean/fallback bawaan. Proxy kustom dan override hanya-header tetap didukung dan tidak memicu peringatan ini.
  </Accordion>
  <Accordion title="2f. Peringatan rute Plugin Codex">
    Saat Plugin Codex bawaan diaktifkan, doctor juga memeriksa apakah ref model primer `openai-codex/*` masih diselesaikan melalui runner PI default. Kombinasi itu valid saat Anda menginginkan auth OAuth/langganan Codex melalui PI, tetapi mudah tertukar dengan harness app-server Codex native. Doctor memperingatkan dan mengarah ke bentuk app-server eksplisit: `openai/*` plus `agentRuntime.id: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor tidak memperbaiki ini secara otomatis karena kedua rute valid:

    - `openai-codex/*` + PI berarti "gunakan auth OAuth/langganan Codex melalui runner OpenClaw normal."
    - `openai/*` + `agentRuntime.id: "codex"` berarti "jalankan turn tertanam melalui app-server Codex native."
    - `/codex ...` berarti "kontrol atau ikat percakapan Codex native dari chat."
    - `/acp ...` atau `runtime: "acp"` berarti "gunakan adapter ACP/acpx eksternal."

    Jika peringatan muncul, pilih rute yang Anda maksud dan edit konfigurasi secara manual. Biarkan peringatan apa adanya saat OAuth Codex PI memang disengaja.

  </Accordion>
  <Accordion title="3. Migrasi state lama (tata letak disk)">
    Doctor dapat memigrasikan tata letak lama di disk ke struktur saat ini:

    - Penyimpanan sesi + transkrip:
      - dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
    - Direktori agent:
      - dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
    - State auth WhatsApp (Baileys):
      - dari `~/.openclaw/credentials/*.json` lama (kecuali `oauth.json`)
      - ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (id akun default: `default`)

    Migrasi ini bersifat upaya terbaik dan idempoten; doctor akan mengeluarkan peringatan saat meninggalkan folder lama sebagai cadangan. Gateway/CLI juga otomatis memigrasikan sesi lama + direktori agent saat startup sehingga riwayat/auth/model mendarat di jalur per-agent tanpa menjalankan doctor secara manual. Normalisasi provider/peta-provider Talk sekarang membandingkan berdasarkan kesetaraan struktural, sehingga diff yang hanya berupa urutan kunci tidak lagi memicu perubahan `doctor --fix` tanpa-op berulang.

  </Accordion>
  <Accordion title="3a. Migrasi manifest Plugin lama">
    Doctor memindai semua manifest Plugin yang terpasang untuk kunci kapabilitas tingkat atas yang sudah tidak digunakan (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Saat ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts` dan menulis ulang file manifest di tempat. Migrasi ini idempoten; jika kunci `contracts` sudah memiliki nilai yang sama, kunci lama dihapus tanpa menduplikasi data.
  </Accordion>
  <Accordion title="3b. Migrasi store Cron lama">
    Doctor juga memeriksa store job Cron (`~/.openclaw/cron/jobs.json` secara default, atau `cron.store` saat dioverride) untuk bentuk job lama yang masih diterima scheduler demi kompatibilitas.

    Pembersihan Cron saat ini mencakup:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - field payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
    - field pengiriman tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias pengiriman `provider` payload → `delivery.channel` eksplisit
    - job fallback webhook `notify: true` lama sederhana → `delivery.mode="webhook"` eksplisit dengan `delivery.to=cron.webhook`

    Doctor hanya otomatis memigrasikan job `notify: true` saat dapat melakukannya tanpa mengubah perilaku. Jika sebuah job menggabungkan fallback notify lama dengan mode pengiriman non-webhook yang sudah ada, doctor memperingatkan dan membiarkan job tersebut untuk ditinjau manual.

    Di Linux, doctor juga memperingatkan saat crontab pengguna masih memanggil `~/.openclaw/bin/ensure-whatsapp.sh` lama. Skrip host-lokal tersebut tidak dipelihara oleh OpenClaw saat ini dan dapat menulis pesan `Gateway inactive` palsu ke `~/.openclaw/logs/whatsapp-health.log` saat cron tidak dapat menjangkau bus pengguna systemd. Hapus entri crontab usang dengan `crontab -e`; gunakan `openclaw channels status --probe`, `openclaw doctor`, dan `openclaw gateway status` untuk pemeriksaan kesehatan saat ini.

  </Accordion>
  <Accordion title="3c. Pembersihan kunci sesi">
    Doctor memindai setiap direktori sesi agen untuk mencari file kunci tulis yang kedaluwarsa — file yang tertinggal ketika sesi keluar secara tidak normal. Untuk setiap file kunci yang ditemukan, Doctor melaporkan: path, PID, apakah PID masih hidup, usia kunci, dan apakah dianggap kedaluwarsa (PID mati atau lebih lama dari 30 menit). Dalam mode `--fix` / `--repair`, Doctor menghapus file kunci kedaluwarsa secara otomatis; jika tidak, Doctor mencetak catatan dan menginstruksikan Anda untuk menjalankan ulang dengan `--fix`.
  </Accordion>
  <Accordion title="3d. Perbaikan cabang transkrip sesi">
    Doctor memindai file JSONL sesi agen untuk bentuk cabang duplikat yang dibuat oleh bug penulisan ulang transkrip prompt 2026.4.24: giliran pengguna yang ditinggalkan dengan konteks runtime internal OpenClaw plus saudara aktif yang berisi prompt pengguna terlihat yang sama. Dalam mode `--fix` / `--repair`, Doctor mencadangkan setiap file terdampak di sebelah file asli dan menulis ulang transkrip ke cabang aktif sehingga riwayat Gateway dan pembaca memori tidak lagi melihat giliran duplikat.
  </Accordion>
  <Accordion title="4. Pemeriksaan integritas status (persistensi sesi, perutean, dan keamanan)">
    Direktori status adalah batang otak operasional. Jika direktori ini hilang, Anda kehilangan sesi, kredensial, log, dan konfigurasi (kecuali Anda memiliki cadangan di tempat lain).

    Doctor memeriksa:

    - **Direktori status hilang**: memperingatkan tentang kehilangan status yang fatal, meminta untuk membuat ulang direktori, dan mengingatkan Anda bahwa data yang hilang tidak dapat dipulihkan.
    - **Izin direktori status**: memverifikasi kemampuan tulis; menawarkan untuk memperbaiki izin (dan mengeluarkan petunjuk `chown` ketika ketidakcocokan pemilik/grup terdeteksi).
    - **Direktori status tersinkron cloud macOS**: memperingatkan ketika status mengarah ke bawah iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau `~/Library/CloudStorage/...` karena path berbasis sinkronisasi dapat menyebabkan I/O lebih lambat dan race kunci/sinkronisasi.
    - **Direktori status Linux SD atau eMMC**: memperingatkan ketika status mengarah ke sumber mount `mmcblk*`, karena I/O acak berbasis SD atau eMMC dapat lebih lambat dan lebih cepat aus di bawah penulisan sesi dan kredensial.
    - **Direktori sesi hilang**: `sessions/` dan direktori penyimpanan sesi diperlukan untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
    - **Ketidakcocokan transkrip**: memperingatkan ketika entri sesi terbaru memiliki file transkrip yang hilang.
    - **Sesi utama "JSONL 1 baris"**: menandai ketika transkrip utama hanya memiliki satu baris (riwayat tidak terakumulasi).
    - **Beberapa direktori status**: memperingatkan ketika beberapa folder `~/.openclaw` ada di berbagai direktori home atau ketika `OPENCLAW_STATE_DIR` menunjuk ke tempat lain (riwayat dapat terpecah antarinstalasi).
    - **Pengingat mode remote**: jika `gateway.mode=remote`, Doctor mengingatkan Anda untuk menjalankannya di host remote (status berada di sana).
    - **Izin file konfigurasi**: memperingatkan jika `~/.openclaw/openclaw.json` dapat dibaca oleh grup/dunia dan menawarkan untuk memperketatnya menjadi `600`.

  </Accordion>
  <Accordion title="5. Kesehatan autentikasi model (kedaluwarsa OAuth)">
    Doctor memeriksa profil OAuth di penyimpanan autentikasi, memperingatkan ketika token akan kedaluwarsa/sudah kedaluwarsa, dan dapat menyegarkannya jika aman. Jika profil OAuth/token Anthropic sudah usang, Doctor menyarankan kunci API Anthropic atau path token penyiapan Anthropic. Prompt penyegaran hanya muncul ketika berjalan secara interaktif (TTY); `--non-interactive` melewati percobaan penyegaran.

    Ketika penyegaran OAuth gagal permanen (misalnya `refresh_token_reused`, `invalid_grant`, atau penyedia memberi tahu Anda untuk masuk lagi), Doctor melaporkan bahwa autentikasi ulang diperlukan dan mencetak perintah persis `openclaw models auth login --provider ...` yang harus dijalankan.

    Doctor juga melaporkan profil autentikasi yang sementara tidak dapat digunakan karena:

    - cooldown singkat (batas laju/timeout/kegagalan autentikasi)
    - penonaktifan lebih lama (kegagalan tagihan/kredit)

  </Accordion>
  <Accordion title="6. Validasi model hook">
    Jika `hooks.gmail.model` disetel, Doctor memvalidasi referensi model terhadap katalog dan allowlist serta memperingatkan ketika referensi itu tidak dapat diselesaikan atau tidak diizinkan.
  </Accordion>
  <Accordion title="7. Perbaikan image sandbox">
    Ketika sandboxing diaktifkan, Doctor memeriksa image Docker dan menawarkan untuk membangun atau beralih ke nama legacy jika image saat ini hilang.
  </Accordion>
  <Accordion title="7b. Pembersihan instalasi Plugin">
    Doctor menghapus status staging dependensi plugin legacy yang dibuat OpenClaw dalam mode `openclaw doctor --fix` / `openclaw doctor --repair`. Ini mencakup root dependensi hasil generasi yang kedaluwarsa, direktori tahap instalasi lama, dan sisa lokal paket dari kode perbaikan dependensi plugin bawaan sebelumnya.

    Doctor juga dapat memasang ulang plugin unduhan yang dikonfigurasi ketika konfigurasi mereferensikannya tetapi registry plugin lokal tidak dapat menemukannya. Untuk eksternalisasi plugin bawaan 2026.5.2, Doctor secara otomatis memasang plugin unduhan yang sudah digunakan oleh konfigurasi yang ada lalu mengandalkan `meta.lastTouchedVersion` untuk menjalankan pass rilis itu hanya sekali. Startup Gateway dan pemuatan ulang konfigurasi tidak menjalankan manajer paket; instalasi plugin tetap menjadi pekerjaan eksplisit doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrasi layanan Gateway dan petunjuk pembersihan">
    Doctor mendeteksi layanan gateway legacy (launchd/systemd/schtasks) dan menawarkan untuk menghapusnya serta memasang layanan OpenClaw menggunakan port gateway saat ini. Doctor juga dapat memindai layanan tambahan yang mirip gateway dan mencetak petunjuk pembersihan. Layanan gateway OpenClaw bernama profil dianggap sebagai kelas utama dan tidak ditandai sebagai "tambahan."

    Di Linux, jika layanan gateway level pengguna hilang tetapi layanan gateway OpenClaw level sistem ada, Doctor tidak memasang layanan level pengguna kedua secara otomatis. Periksa dengan `openclaw gateway status --deep` atau `openclaw doctor --deep`, lalu hapus duplikatnya atau setel `OPENCLAW_SERVICE_REPAIR_POLICY=external` ketika supervisor sistem memiliki siklus hidup gateway.

  </Accordion>
  <Accordion title="8b. Migrasi startup Matrix">
    Ketika akun channel Matrix memiliki migrasi status legacy yang tertunda atau dapat ditindaklanjuti, Doctor (dalam mode `--fix` / `--repair`) membuat snapshot pra-migrasi lalu menjalankan langkah migrasi best-effort: migrasi status Matrix legacy dan persiapan status terenkripsi legacy. Kedua langkah bersifat non-fatal; error dicatat dan startup berlanjut. Dalam mode hanya baca (`openclaw doctor` tanpa `--fix`) pemeriksaan ini dilewati sepenuhnya.
  </Accordion>
  <Accordion title="8c. Penyandingan perangkat dan drift autentikasi">
    Doctor sekarang memeriksa status penyandingan perangkat sebagai bagian dari pass kesehatan normal.

    Yang dilaporkan:

    - permintaan penyandingan pertama kali yang tertunda
    - peningkatan peran tertunda untuk perangkat yang sudah dipasangkan
    - peningkatan cakupan tertunda untuk perangkat yang sudah dipasangkan
    - perbaikan ketidakcocokan kunci publik ketika id perangkat masih cocok tetapi identitas perangkat tidak lagi cocok dengan catatan yang disetujui
    - catatan pasangan yang tidak memiliki token aktif untuk peran yang disetujui
    - token pasangan yang cakupannya bergeser di luar baseline penyandingan yang disetujui
    - entri token perangkat cache lokal untuk mesin saat ini yang mendahului rotasi token sisi gateway atau membawa metadata cakupan kedaluwarsa

    Doctor tidak menyetujui otomatis permintaan pasangan atau merotasi otomatis token perangkat. Sebagai gantinya, Doctor mencetak langkah berikutnya yang persis:

    - periksa permintaan tertunda dengan `openclaw devices list`
    - setujui permintaan persis dengan `openclaw devices approve <requestId>`
    - rotasi token baru dengan `openclaw devices rotate --device <deviceId> --role <role>`
    - hapus dan setujui ulang catatan usang dengan `openclaw devices remove <deviceId>`

    Ini menutup celah umum "sudah dipasangkan tetapi masih mendapatkan pesan penyandingan diperlukan": Doctor sekarang membedakan penyandingan pertama kali dari peningkatan peran/cakupan yang tertunda dan dari drift token/identitas perangkat yang usang.

  </Accordion>
  <Accordion title="9. Peringatan keamanan">
    Doctor mengeluarkan peringatan ketika penyedia terbuka untuk DM tanpa allowlist, atau ketika kebijakan dikonfigurasi dengan cara yang berbahaya.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jika berjalan sebagai layanan pengguna systemd, Doctor memastikan lingering diaktifkan agar gateway tetap hidup setelah logout.
  </Accordion>
  <Accordion title="11. Status workspace (Skills, plugin, dan direktori legacy)">
    Doctor mencetak ringkasan status workspace untuk agen default:

    - **Status Skills**: menghitung skill yang memenuhi syarat, kehilangan persyaratan, dan diblokir allowlist.
    - **Direktori workspace legacy**: memperingatkan ketika `~/openclaw` atau direktori workspace legacy lain ada berdampingan dengan workspace saat ini.
    - **Status Plugin**: menghitung plugin yang diaktifkan/dinonaktifkan/error; mencantumkan ID plugin untuk setiap error; melaporkan kapabilitas plugin bundel.
    - **Peringatan kompatibilitas Plugin**: menandai plugin yang memiliki masalah kompatibilitas dengan runtime saat ini.
    - **Diagnostik Plugin**: memunculkan setiap peringatan atau error waktu muat yang dikeluarkan oleh registry plugin.

  </Accordion>
  <Accordion title="11b. Ukuran file bootstrap">
    Doctor memeriksa apakah file bootstrap workspace (misalnya `AGENTS.md`, `CLAUDE.md`, atau file konteks injeksi lain) mendekati atau melebihi anggaran karakter yang dikonfigurasi. Doctor melaporkan jumlah karakter mentah vs. terinjeksi per file, persentase pemotongan, penyebab pemotongan (`max/file` atau `max/total`), dan total karakter terinjeksi sebagai fraksi dari total anggaran. Ketika file dipotong atau mendekati batas, Doctor mencetak tips untuk menyetel `agents.defaults.bootstrapMaxChars` dan `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pembersihan plugin channel kedaluwarsa">
    Ketika `openclaw doctor --fix` menghapus plugin channel yang hilang, itu juga menghapus konfigurasi bercakupan channel yang menggantung dan mereferensikan plugin tersebut: entri `channels.<id>`, target heartbeat yang menamai channel, dan override `agents.*.models["<channel>/*"]`. Ini mencegah loop boot Gateway ketika runtime channel sudah hilang tetapi konfigurasi masih meminta gateway untuk mengikat ke runtime tersebut.
  </Accordion>
  <Accordion title="11c. Pelengkapan shell">
    Doctor memeriksa apakah pelengkapan tab terpasang untuk shell saat ini (zsh, bash, fish, atau PowerShell):

    - Jika profil shell menggunakan pola pelengkapan dinamis lambat (`source <(openclaw completion ...)`), Doctor meningkatkannya ke varian file cache yang lebih cepat.
    - Jika pelengkapan dikonfigurasi di profil tetapi file cache hilang, Doctor meregenerasi cache secara otomatis.
    - Jika tidak ada pelengkapan yang dikonfigurasi sama sekali, Doctor meminta untuk memasangnya (hanya mode interaktif; dilewati dengan `--non-interactive`).

    Jalankan `openclaw completion --write-state` untuk meregenerasi cache secara manual.

  </Accordion>
  <Accordion title="12. Pemeriksaan autentikasi Gateway (token lokal)">
    Doctor memeriksa kesiapan autentikasi token gateway lokal.

    - Jika mode token membutuhkan token dan tidak ada sumber token, Doctor menawarkan untuk membuatnya.
    - Jika `gateway.auth.token` dikelola SecretRef tetapi tidak tersedia, Doctor memperingatkan dan tidak menimpanya dengan teks biasa.
    - `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya ketika tidak ada SecretRef token yang dikonfigurasi.

  </Accordion>
  <Accordion title="12b. Perbaikan sadar SecretRef hanya baca">
    Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku fail-fast runtime.

    - `openclaw doctor --fix` sekarang menggunakan model ringkasan SecretRef hanya baca yang sama seperti perintah keluarga status untuk perbaikan konfigurasi tertarget.
    - Contoh: perbaikan `allowFrom` / `groupAllowFrom` `@username` Telegram mencoba menggunakan kredensial bot yang dikonfigurasi ketika tersedia.
    - Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia di path perintah saat ini, Doctor melaporkan bahwa kredensial dikonfigurasi-tetapi-tidak-tersedia dan melewati resolusi otomatis alih-alih crash atau salah melaporkan token sebagai hilang.

  </Accordion>
  <Accordion title="13. Pemeriksaan kesehatan Gateway + mulai ulang">
    Doctor menjalankan pemeriksaan kesehatan dan menawarkan untuk memulai ulang gateway ketika terlihat tidak sehat.
  </Accordion>
  <Accordion title="13b. Kesiapan pencarian memori">
    Doctor memeriksa apakah penyedia embedding pencarian memori yang dikonfigurasi siap untuk agent default. Perilakunya bergantung pada backend dan penyedia yang dikonfigurasi:

    - **Backend QMD**: memeriksa apakah biner `qmd` tersedia dan dapat dimulai. Jika tidak, mencetak panduan perbaikan termasuk paket npm dan opsi jalur biner manual.
    - **Penyedia lokal eksplisit**: memeriksa file model lokal atau URL model jarak jauh/dapat diunduh yang dikenali. Jika tidak ada, menyarankan beralih ke penyedia jarak jauh.
    - **Penyedia jarak jauh eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa API key ada di environment atau auth store. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika tidak ada.
    - **Penyedia otomatis**: memeriksa ketersediaan model lokal terlebih dahulu, lalu mencoba setiap penyedia jarak jauh sesuai urutan pemilihan otomatis.

    Ketika hasil probe gateway yang di-cache tersedia (gateway sehat pada saat pemeriksaan), doctor membandingkan hasilnya dengan konfigurasi yang terlihat oleh CLI dan mencatat setiap ketidaksesuaian. Doctor tidak memulai ping embedding baru pada jalur default; gunakan perintah status memori mendalam ketika Anda menginginkan pemeriksaan penyedia langsung.

    Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

  </Accordion>
  <Accordion title="14. Peringatan status kanal">
    Jika gateway sehat, doctor menjalankan probe status kanal dan melaporkan peringatan dengan perbaikan yang disarankan.
  </Accordion>
  <Accordion title="15. Audit + perbaikan konfigurasi supervisor">
    Doctor memeriksa konfigurasi supervisor yang terpasang (launchd/systemd/schtasks) untuk default yang hilang atau usang (misalnya, dependensi systemd network-online dan jeda mulai ulang). Ketika menemukan ketidakcocokan, doctor merekomendasikan pembaruan dan dapat menulis ulang file service/task ke default saat ini.

    Catatan:

    - `openclaw doctor` meminta konfirmasi sebelum menulis ulang konfigurasi supervisor.
    - `openclaw doctor --yes` menerima prompt perbaikan default.
    - `openclaw doctor --repair` menerapkan perbaikan yang direkomendasikan tanpa prompt.
    - `openclaw doctor --repair --force` menimpa konfigurasi supervisor kustom.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` menjaga doctor tetap hanya-baca untuk siklus hidup service gateway. Ini tetap melaporkan kesehatan service dan menjalankan perbaikan non-service, tetapi melewati pemasangan/mulai/mulai ulang/bootstrap service, penulisan ulang konfigurasi supervisor, dan pembersihan service lama karena supervisor eksternal memiliki siklus hidup tersebut.
    - Di Linux, doctor tidak menulis ulang metadata perintah/entrypoint saat unit gateway systemd yang cocok aktif. Doctor juga mengabaikan unit tambahan mirip gateway non-legacy yang tidak aktif selama pemindaian service duplikat sehingga file service pendamping tidak membuat noise pembersihan.
    - Jika autentikasi token memerlukan token dan `gateway.auth.token` dikelola SecretRef, pemasangan/perbaikan service doctor memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang terselesaikan ke metadata environment service supervisor.
    - Doctor mendeteksi nilai environment service terkelola yang didukung `.env`/SecretRef yang dipasang inline oleh instalasi LaunchAgent, systemd, atau Windows Scheduled Task lama dan menulis ulang metadata service agar nilai tersebut dimuat dari sumber runtime, bukan dari definisi supervisor.
    - Doctor mendeteksi ketika perintah service masih mengunci `--port` lama setelah `gateway.port` berubah dan menulis ulang metadata service ke port saat ini.
    - Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi tidak terselesaikan, doctor memblokir jalur pemasangan/perbaikan dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum diatur, doctor memblokir pemasangan/perbaikan sampai mode diatur secara eksplisit.
    - Untuk unit user-systemd Linux, pemeriksaan drift token doctor kini mencakup sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata autentikasi service.
    - Perbaikan service doctor menolak untuk menulis ulang, menghentikan, atau memulai ulang service gateway dari biner OpenClaw lama ketika konfigurasi terakhir ditulis oleh versi yang lebih baru. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostik runtime + port Gateway">
    Doctor memeriksa runtime service (PID, status keluar terakhir) dan memperingatkan ketika service terpasang tetapi sebenarnya tidak berjalan. Doctor juga memeriksa tabrakan port pada port gateway (default `18789`) dan melaporkan kemungkinan penyebabnya (gateway sudah berjalan, tunnel SSH).
  </Accordion>
  <Accordion title="17. Praktik terbaik runtime Gateway">
    Doctor memperingatkan ketika service gateway berjalan di Bun atau jalur Node yang dikelola versi (`nvm`, `fnm`, `volta`, `asdf`, dll.). Kanal WhatsApp + Telegram memerlukan Node, dan jalur version-manager dapat rusak setelah upgrade karena service tidak memuat init shell Anda. Doctor menawarkan migrasi ke instalasi Node sistem ketika tersedia (Homebrew/apt/choco).

    LaunchAgent macOS yang baru dipasang atau diperbaiki menggunakan PATH sistem kanonis (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) alih-alih menyalin PATH shell interaktif, sehingga direktori Volta, asdf, fnm, pnpm, dan version-manager lainnya tidak mengubah Node mana yang diselesaikan oleh child process. Service Linux tetap mempertahankan root environment eksplisit (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) dan direktori user-bin yang stabil, tetapi direktori fallback version-manager hasil tebakan hanya ditulis ke PATH service ketika direktori tersebut ada di disk.

  </Accordion>
  <Accordion title="18. Penulisan konfigurasi + metadata wizard">
    Doctor menyimpan setiap perubahan konfigurasi dan memberi cap metadata wizard untuk mencatat jalannya doctor.
  </Accordion>
  <Accordion title="19. Tips workspace (cadangan + sistem memori)">
    Doctor menyarankan sistem memori workspace ketika tidak ada dan mencetak tips cadangan jika workspace belum berada di bawah git.

    Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap struktur workspace dan cadangan git (GitHub atau GitLab privat direkomendasikan).

  </Accordion>
</AccordionGroup>

## Terkait

- [Runbook Gateway](/id/gateway)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
