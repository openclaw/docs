---
read_when:
    - Menambahkan atau memodifikasi migrasi doctor
    - Memperkenalkan perubahan konfigurasi yang merusak kompatibilitas
sidebarTitle: Doctor
summary: 'Perintah doctor: pemeriksaan kesehatan, migrasi konfigurasi, dan langkah perbaikan'
title: Dokter
x-i18n:
    generated_at: "2026-05-04T09:33:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bc8615f5e49e8c20785a9dc9779c447fd0d5794c80663d2396b0a20b4187798
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` adalah alat perbaikan + migrasi untuk OpenClaw. Alat ini memperbaiki konfigurasi/status yang usang, memeriksa kesehatan, dan menyediakan langkah perbaikan yang dapat ditindaklanjuti.

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

    Terima default tanpa prompt (termasuk langkah perbaikan restart/layanan/sandbox saat berlaku).

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

    Terapkan juga perbaikan agresif (menimpa konfigurasi supervisor kustom).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Jalankan tanpa prompt dan hanya terapkan migrasi yang aman (normalisasi konfigurasi + pemindahan status di disk). Melewati tindakan restart/layanan/sandbox yang memerlukan konfirmasi manusia. Migrasi status lama berjalan otomatis saat terdeteksi.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Pindai layanan sistem untuk instalasi gateway tambahan (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Jika Anda ingin meninjau perubahan sebelum menulis, buka file konfigurasi terlebih dahulu:

```bash
cat ~/.openclaw/openclaw.json
```

## Apa yang dilakukan (ringkasan)

<AccordionGroup>
  <Accordion title="Kesehatan, UI, dan pembaruan">
    - Pembaruan pra-jalan opsional untuk instalasi git (hanya interaktif).
    - Pemeriksaan kebaruan protokol UI (membangun ulang UI Kontrol saat skema protokol lebih baru).
    - Pemeriksaan kesehatan + prompt restart.
    - Ringkasan status Skills (memenuhi syarat/hilang/diblokir) dan status Plugin.

  </Accordion>
  <Accordion title="Konfigurasi dan migrasi">
    - Normalisasi konfigurasi untuk nilai lama.
    - Migrasi konfigurasi Talk dari bidang datar lama `talk.*` ke `talk.provider` + `talk.providers.<provider>`.
    - Pemeriksaan migrasi browser untuk konfigurasi ekstensi Chrome lama dan kesiapan Chrome MCP.
    - Peringatan override penyedia OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Peringatan shadowing OAuth Codex (`models.providers.openai-codex`).
    - Pemeriksaan prasyarat TLS OAuth untuk profil OAuth OpenAI Codex.
    - Peringatan allowlist Plugin/alat saat `plugins.allow` bersifat membatasi tetapi kebijakan alat masih meminta wildcard atau alat milik Plugin.
    - Migrasi status lama di disk (sessions/agent dir/autentikasi WhatsApp).
    - Migrasi kunci kontrak manifes Plugin lama (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrasi penyimpanan Cron lama (`jobId`, `schedule.cron`, bidang delivery/payload tingkat atas, payload `provider`, pekerjaan fallback Webhook sederhana `notify: true`).
    - Migrasi kebijakan runtime agen lama ke `agents.defaults.agentRuntime` dan `agents.list[].agentRuntime`.
    - Pembersihan konfigurasi Plugin usang saat Plugin diaktifkan; saat `plugins.enabled=false`, referensi Plugin usang diperlakukan sebagai konfigurasi containment inert dan dipertahankan.

  </Accordion>
  <Accordion title="Status dan integritas">
    - Inspeksi file kunci sesi dan pembersihan kunci usang.
    - Perbaikan transkrip sesi untuk cabang prompt-rewrite duplikat yang dibuat oleh build 2026.4.24 yang terdampak.
    - Deteksi tombstone pemulihan-restart subagen yang macet, dengan dukungan `--fix` untuk menghapus flag pemulihan abort usang agar startup tidak terus memperlakukan child sebagai restart-aborted.
    - Pemeriksaan integritas status dan izin (sesi, transkrip, direktori status).
    - Pemeriksaan izin file konfigurasi (chmod 600) saat berjalan secara lokal.
    - Kesehatan autentikasi model: memeriksa kedaluwarsa OAuth, dapat menyegarkan token yang hampir kedaluwarsa, dan melaporkan status cooldown/dinonaktifkan auth-profile.
    - Deteksi direktori workspace tambahan (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, layanan, dan supervisor">
    - Perbaikan image sandbox saat sandboxing diaktifkan.
    - Migrasi layanan lama dan deteksi gateway tambahan.
    - Migrasi status lama channel Matrix (dalam mode `--fix` / `--repair`).
    - Pemeriksaan runtime Gateway (layanan terpasang tetapi tidak berjalan; label launchd yang di-cache).
    - Peringatan status channel (di-probe dari gateway yang sedang berjalan).
    - Audit konfigurasi supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
    - Pembersihan lingkungan proxy tertanam untuk layanan gateway yang menangkap nilai shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` selama instalasi atau pembaruan.
    - Pemeriksaan praktik terbaik runtime Gateway (Node vs Bun, path version-manager).
    - Diagnostik tabrakan port Gateway (default `18789`).

  </Accordion>
  <Accordion title="Autentikasi, keamanan, dan pemasangan">
    - Peringatan keamanan untuk kebijakan DM terbuka.
    - Pemeriksaan autentikasi Gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada sumber token; tidak menimpa konfigurasi SecretRef token).
    - Deteksi masalah pemasangan perangkat (permintaan pemasangan pertama kali yang tertunda, peningkatan peran/cakupan yang tertunda, drift cache token perangkat lokal yang usang, dan drift autentikasi catatan terpasang).

  </Accordion>
  <Accordion title="Workspace dan shell">
    - Pemeriksaan systemd linger di Linux.
    - Pemeriksaan ukuran file bootstrap workspace (peringatan pemotongan/hampir batas untuk file konteks).
    - Pemeriksaan kesiapan Skills untuk agen default; melaporkan skill yang diizinkan dengan bin, env, konfigurasi, atau persyaratan OS yang hilang, dan `--fix` dapat menonaktifkan skill yang tidak tersedia di `skills.entries`.
    - Pemeriksaan status shell completion dan pemasangan/peningkatan otomatis.
    - Pemeriksaan kesiapan penyedia embedding pencarian memori (model lokal, kunci API jarak jauh, atau biner QMD).
    - Pemeriksaan instalasi source (ketidakcocokan workspace pnpm, aset UI hilang, biner tsx hilang).
    - Menulis konfigurasi yang diperbarui + metadata wizard.

  </Accordion>
</AccordionGroup>

## Backfill dan reset UI Dreams

Adegan Dreams UI Kontrol mencakup tindakan **Backfill**, **Reset**, dan **Clear Grounded** untuk alur kerja dreaming grounded. Tindakan ini menggunakan metode RPC bergaya doctor gateway, tetapi **bukan** bagian dari perbaikan/migrasi CLI `openclaw doctor`.

Yang dilakukan:

- **Backfill** memindai file historis `memory/YYYY-MM-DD.md` di workspace aktif, menjalankan pass grounded REM diary, dan menulis entri backfill yang dapat dibalik ke `DREAMS.md`.
- **Reset** hanya menghapus entri diary backfill bertanda tersebut dari `DREAMS.md`.
- **Clear Grounded** hanya menghapus entri jangka pendek staged khusus grounded yang berasal dari pemutaran ulang historis dan belum mengakumulasi recall live atau dukungan harian.

Yang **tidak** dilakukan sendiri:

- tidak mengedit `MEMORY.md`
- tidak menjalankan migrasi doctor penuh
- tidak secara otomatis men-stage kandidat grounded ke penyimpanan promosi jangka pendek live kecuali Anda secara eksplisit menjalankan path CLI staged terlebih dahulu

Jika Anda ingin pemutaran ulang historis grounded memengaruhi jalur promosi mendalam normal, gunakan alur CLI sebagai gantinya:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Itu men-stage kandidat durable grounded ke penyimpanan dreaming jangka pendek sambil mempertahankan `DREAMS.md` sebagai permukaan peninjauan.

## Perilaku terperinci dan alasan

<AccordionGroup>
  <Accordion title="0. Pembaruan opsional (instalasi git)">
    Jika ini adalah checkout git dan doctor berjalan secara interaktif, ia menawarkan pembaruan (fetch/rebase/build) sebelum menjalankan doctor.
  </Accordion>
  <Accordion title="1. Normalisasi konfigurasi">
    Jika konfigurasi berisi bentuk nilai lama (misalnya `messages.ackReaction` tanpa override khusus channel), doctor menormalkannya ke skema saat ini.

    Itu mencakup bidang datar Talk lama. Konfigurasi Talk publik saat ini adalah `talk.provider` + `talk.providers.<provider>`. Doctor menulis ulang bentuk lama `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ke dalam peta penyedia.

    Doctor juga memperingatkan saat `plugins.allow` tidak kosong dan kebijakan alat menggunakan
    entri wildcard atau alat milik Plugin. `tools.allow: ["*"]` hanya mencocokkan alat
    dari Plugin yang benar-benar dimuat; itu tidak melewati allowlist Plugin eksklusif.

  </Accordion>
  <Accordion title="2. Migrasi kunci konfigurasi lama">
    Saat konfigurasi berisi kunci yang tidak digunakan lagi, perintah lain menolak berjalan dan meminta Anda menjalankan `openclaw doctor`.

    Doctor akan:

    - Menjelaskan kunci lama mana yang ditemukan.
    - Menampilkan migrasi yang diterapkannya.
    - Menulis ulang `~/.openclaw/openclaw.json` dengan skema yang diperbarui.

    Gateway juga menjalankan otomatis migrasi doctor saat startup ketika mendeteksi format konfigurasi lama, sehingga konfigurasi usang diperbaiki tanpa intervensi manual. Migrasi penyimpanan pekerjaan Cron ditangani oleh `openclaw doctor --fix`.

    Migrasi saat ini:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - konfigurasi configured-channel yang tidak memiliki kebijakan balasan terlihat → `messages.groupChat.visibleReplies: "message_tool"`
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
    - Untuk channel dengan `accounts` bernama tetapi masih memiliki nilai channel tingkat atas akun tunggal, pindahkan nilai yang cakupannya akun itu ke akun yang dipromosikan yang dipilih untuk channel tersebut (`accounts.default` untuk sebagian besar channel; Matrix dapat mempertahankan target bernama/default yang cocok jika sudah ada)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - hapus `agents.defaults.llm`; gunakan `models.providers.<id>.timeoutSeconds` untuk batas waktu provider/model yang lambat
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - hapus `browser.relayBindHost` (pengaturan relay extension lama)
    - `models.providers.*.api: "openai"` lama → `"openai-completions"` (startup gateway juga melewati provider yang `api`-nya disetel ke nilai enum masa depan atau tidak dikenal, alih-alih gagal tertutup)

    Peringatan doctor juga menyertakan panduan default akun untuk channel multi-akun:

    - Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa routing cadangan dapat memilih akun yang tidak terduga.
    - Jika `channels.<channel>.defaultAccount` disetel ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    Jika Anda menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go` secara manual, itu menimpa katalog OpenCode bawaan dari `@mariozechner/pi-ai`. Hal itu dapat memaksa model memakai API yang salah atau mengosongkan biaya. Doctor memperingatkan agar Anda dapat menghapus override dan memulihkan routing API + biaya per model.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Jika konfigurasi browser Anda masih menunjuk ke jalur extension Chrome yang telah dihapus, doctor menormalkannya ke model attach Chrome MCP lokal host saat ini:

    - `browser.profiles.*.driver: "extension"` menjadi `"existing-session"`
    - `browser.relayBindHost` dihapus

    Doctor juga mengaudit jalur Chrome MCP lokal host saat Anda menggunakan `defaultProfile: "user"` atau profil `existing-session` yang dikonfigurasi:

    - memeriksa apakah Google Chrome terpasang di host yang sama untuk profil auto-connect default
    - memeriksa versi Chrome yang terdeteksi dan memperingatkan jika versinya di bawah Chrome 144
    - mengingatkan Anda untuk mengaktifkan remote debugging di halaman inspect browser (misalnya `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, atau `edge://inspect/#remote-debugging`)

    Doctor tidak dapat mengaktifkan pengaturan sisi Chrome untuk Anda. Chrome MCP lokal host tetap memerlukan:

    - browser berbasis Chromium 144+ pada host gateway/node
    - browser berjalan secara lokal
    - remote debugging diaktifkan di browser tersebut
    - menyetujui prompt persetujuan attach pertama di browser

    Kesiapan di sini hanya tentang prasyarat attach lokal. Existing-session mempertahankan batas rute Chrome MCP saat ini; rute lanjutan seperti `responsebody`, ekspor PDF, intersepsi unduhan, dan tindakan batch tetap memerlukan browser terkelola atau profil CDP mentah.

    Pemeriksaan ini **tidak** berlaku untuk Docker, sandbox, remote-browser, atau alur headless lainnya. Alur tersebut tetap menggunakan CDP mentah.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Saat profil OAuth OpenAI Codex dikonfigurasi, doctor memeriksa endpoint otorisasi OpenAI untuk memverifikasi bahwa stack TLS Node/OpenSSL lokal dapat memvalidasi rantai sertifikat. Jika pemeriksaan gagal dengan kesalahan sertifikat (misalnya `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat self-signed), doctor mencetak panduan perbaikan khusus platform. Di macOS dengan Node Homebrew, perbaikannya biasanya `brew postinstall ca-certificates`. Dengan `--deep`, pemeriksaan berjalan meskipun gateway sehat.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Jika sebelumnya Anda menambahkan pengaturan transport OpenAI lama di bawah `models.providers.openai-codex`, pengaturan itu dapat membayangi jalur provider OAuth Codex bawaan yang digunakan rilis yang lebih baru secara otomatis. Doctor memperingatkan saat melihat pengaturan transport lama tersebut berdampingan dengan OAuth Codex agar Anda dapat menghapus atau menulis ulang override transport usang dan mendapatkan kembali perilaku routing/cadangan bawaan. Proxy kustom dan override hanya-header tetap didukung dan tidak memicu peringatan ini.
  </Accordion>
  <Accordion title="2f. Codex plugin route warnings">
    Saat Plugin Codex bawaan diaktifkan, doctor juga memeriksa apakah referensi model utama `openai-codex/*` masih diselesaikan melalui runner PI default. Kombinasi itu valid saat Anda menginginkan autentikasi OAuth/langganan Codex melalui PI, tetapi mudah tertukar dengan harness app-server Codex native. Doctor memperingatkan dan menunjuk ke bentuk app-server eksplisit: `openai/*` plus `agentRuntime.id: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor tidak memperbaikinya secara otomatis karena kedua rute valid:

    - `openai-codex/*` + PI berarti "gunakan autentikasi OAuth/langganan Codex melalui runner OpenClaw normal."
    - `openai/*` + `agentRuntime.id: "codex"` berarti "jalankan turn tertanam melalui app-server Codex native."
    - `/codex ...` berarti "kontrol atau bind percakapan Codex native dari chat."
    - `/acp ...` atau `runtime: "acp"` berarti "gunakan adapter ACP/acpx eksternal."

    Jika peringatan muncul, pilih rute yang Anda maksud dan edit konfigurasi secara manual. Pertahankan peringatan apa adanya saat OAuth PI Codex memang disengaja.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor dapat memigrasikan tata letak lama di disk ke struktur saat ini:

    - Penyimpanan sesi + transkrip:
      - dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
    - Direktori agent:
      - dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
    - Status auth WhatsApp (Baileys):
      - dari `~/.openclaw/credentials/*.json` lama (kecuali `oauth.json`)
      - ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID akun default: `default`)

    Migrasi ini bersifat best-effort dan idempoten; doctor akan memunculkan peringatan saat meninggalkan folder lama sebagai cadangan. Gateway/CLI juga otomatis memigrasikan sesi lama + direktori agent saat startup sehingga riwayat/auth/model masuk ke jalur per-agent tanpa perlu menjalankan doctor secara manual. Normalisasi provider/peta-provider Talk kini membandingkan berdasarkan kesetaraan struktural, sehingga perbedaan urutan-key saja tidak lagi memicu perubahan `doctor --fix` tanpa efek yang berulang.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor memindai semua manifest Plugin yang terpasang untuk key kapabilitas tingkat atas yang sudah usang (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Saat ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts` dan menulis ulang file manifest di tempat. Migrasi ini idempoten; jika key `contracts` sudah memiliki nilai yang sama, key lama dihapus tanpa menduplikasi data.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor juga memeriksa penyimpanan job cron (`~/.openclaw/cron/jobs.json` secara default, atau `cron.store` saat ditimpa) untuk bentuk job lama yang masih diterima scheduler demi kompatibilitas.

    Pembersihan cron saat ini meliputi:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - field payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
    - field pengiriman tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias pengiriman `provider` payload → `delivery.channel` eksplisit
    - job fallback webhook `notify: true` lama yang sederhana → `delivery.mode="webhook"` eksplisit dengan `delivery.to=cron.webhook`

    Doctor hanya memigrasikan otomatis job `notify: true` saat dapat melakukannya tanpa mengubah perilaku. Jika job menggabungkan fallback notify lama dengan mode pengiriman non-webhook yang sudah ada, doctor memperingatkan dan membiarkan job tersebut untuk ditinjau manual.

    Di Linux, doctor juga memperingatkan saat crontab pengguna masih memanggil `~/.openclaw/bin/ensure-whatsapp.sh` lama. Skrip lokal host itu tidak dipelihara oleh OpenClaw saat ini dan dapat menulis pesan `Gateway inactive` palsu ke `~/.openclaw/logs/whatsapp-health.log` saat cron tidak dapat menjangkau bus pengguna systemd. Hapus entri crontab usang dengan `crontab -e`; gunakan `openclaw channels status --probe`, `openclaw doctor`, dan `openclaw gateway status` untuk pemeriksaan kesehatan saat ini.

  </Accordion>
  <Accordion title="3c. Pembersihan kunci sesi">
    Doctor memindai setiap direktori sesi agen untuk menemukan file kunci tulis yang usang — file yang tertinggal saat sesi keluar secara tidak normal. Untuk setiap file kunci yang ditemukan, Doctor melaporkan: jalur, PID, apakah PID masih hidup, usia kunci, dan apakah file tersebut dianggap usang (PID mati atau lebih lama dari 30 menit). Dalam mode `--fix` / `--repair`, Doctor menghapus file kunci usang secara otomatis; jika tidak, Doctor mencetak catatan dan menginstruksikan Anda untuk menjalankan ulang dengan `--fix`.
  </Accordion>
  <Accordion title="3d. Perbaikan cabang transkrip sesi">
    Doctor memindai file JSONL sesi agen untuk bentuk cabang terduplikasi yang dibuat oleh bug penulisan ulang transkrip prompt 2026.4.24: giliran pengguna yang ditinggalkan dengan konteks runtime internal OpenClaw ditambah saudara aktif yang berisi prompt pengguna terlihat yang sama. Dalam mode `--fix` / `--repair`, Doctor mencadangkan setiap file terdampak di samping file asli dan menulis ulang transkrip ke cabang aktif sehingga riwayat gateway dan pembaca memori tidak lagi melihat giliran duplikat.
  </Accordion>
  <Accordion title="4. Pemeriksaan integritas status (persistensi sesi, perutean, dan keamanan)">
    Direktori status adalah batang otak operasional. Jika menghilang, Anda kehilangan sesi, kredensial, log, dan konfigurasi (kecuali Anda memiliki cadangan di tempat lain).

    Doctor memeriksa:

    - **Direktori status hilang**: memperingatkan tentang kehilangan status yang katastrofik, meminta untuk membuat ulang direktori, dan mengingatkan Anda bahwa data yang hilang tidak dapat dipulihkan.
    - **Izin direktori status**: memverifikasi kemampuan tulis; menawarkan perbaikan izin (dan mengeluarkan petunjuk `chown` saat ketidakcocokan pemilik/grup terdeteksi).
    - **Direktori status tersinkron cloud macOS**: memperingatkan saat status berada di bawah iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau `~/Library/CloudStorage/...` karena jalur yang didukung sinkronisasi dapat menyebabkan I/O lebih lambat dan perlombaan kunci/sinkronisasi.
    - **Direktori status SD atau eMMC Linux**: memperingatkan saat status berada pada sumber mount `mmcblk*`, karena I/O acak berbasis SD atau eMMC dapat lebih lambat dan lebih cepat aus di bawah penulisan sesi dan kredensial.
    - **Direktori sesi hilang**: `sessions/` dan direktori penyimpanan sesi diperlukan untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
    - **Ketidakcocokan transkrip**: memperingatkan saat entri sesi terbaru memiliki file transkrip yang hilang.
    - **Sesi utama "JSONL 1 baris"**: menandai saat transkrip utama hanya memiliki satu baris (riwayat tidak bertambah).
    - **Beberapa direktori status**: memperingatkan saat beberapa folder `~/.openclaw` ada di berbagai direktori home atau saat `OPENCLAW_STATE_DIR` menunjuk ke tempat lain (riwayat dapat terpecah antar instalasi).
    - **Pengingat mode jarak jauh**: jika `gateway.mode=remote`, Doctor mengingatkan Anda untuk menjalankannya di host jarak jauh (status berada di sana).
    - **Izin file konfigurasi**: memperingatkan jika `~/.openclaw/openclaw.json` dapat dibaca oleh grup/dunia dan menawarkan untuk memperketatnya ke `600`.

  </Accordion>
  <Accordion title="5. Kesehatan autentikasi model (kedaluwarsa OAuth)">
    Doctor memeriksa profil OAuth di penyimpanan autentikasi, memperingatkan saat token akan kedaluwarsa/sudah kedaluwarsa, dan dapat menyegarkannya saat aman. Jika profil OAuth/token Anthropic sudah usang, Doctor menyarankan kunci API Anthropic atau jalur setup-token Anthropic. Prompt penyegaran hanya muncul saat berjalan secara interaktif (TTY); `--non-interactive` melewati upaya penyegaran.

    Saat penyegaran OAuth gagal permanen (misalnya `refresh_token_reused`, `invalid_grant`, atau penyedia meminta Anda masuk lagi), Doctor melaporkan bahwa autentikasi ulang diperlukan dan mencetak perintah `openclaw models auth login --provider ...` persis yang harus dijalankan.

    Doctor juga melaporkan profil autentikasi yang sementara tidak dapat digunakan karena:

    - cooldown singkat (batas laju/timeout/kegagalan autentikasi)
    - penonaktifan lebih lama (kegagalan penagihan/kredit)

  </Accordion>
  <Accordion title="6. Validasi model hook">
    Jika `hooks.gmail.model` diatur, Doctor memvalidasi referensi model terhadap katalog dan daftar izin serta memperingatkan saat model tidak dapat di-resolve atau tidak diizinkan.
  </Accordion>
  <Accordion title="7. Perbaikan image sandbox">
    Saat sandboxing diaktifkan, Doctor memeriksa image Docker dan menawarkan untuk membangun atau beralih ke nama lama jika image saat ini hilang.
  </Accordion>
  <Accordion title="7b. Pembersihan instalasi Plugin">
    Doctor menghapus status staging dependensi Plugin lama yang dihasilkan OpenClaw dalam mode `openclaw doctor --fix` / `openclaw doctor --repair`. Ini mencakup root dependensi usang yang dihasilkan, direktori tahap instalasi lama, sisa lokal paket dari kode perbaikan dependensi Plugin bawaan sebelumnya, dan salinan npm terkelola yatim atau dipulihkan dari Plugin `@openclaw/*` bawaan yang dapat membayangi manifes bawaan saat ini.

    Doctor juga dapat menginstal ulang Plugin unduhan yang dikonfigurasi saat konfigurasi merujuknya tetapi registri Plugin lokal tidak dapat menemukannya. Untuk eksternalisasi Plugin bawaan 2026.5.2, Doctor secara otomatis menginstal Plugin unduhan yang sudah digunakan konfigurasi yang ada lalu mengandalkan `meta.lastTouchedVersion` untuk menjalankan pass rilis itu hanya sekali. Startup Gateway dan pemuatan ulang konfigurasi tidak menjalankan manajer paket; instalasi Plugin tetap merupakan pekerjaan doctor/install/update yang eksplisit.

  </Accordion>
  <Accordion title="8. Migrasi layanan Gateway dan petunjuk pembersihan">
    Doctor mendeteksi layanan Gateway lama (launchd/systemd/schtasks) dan menawarkan untuk menghapusnya serta menginstal layanan OpenClaw menggunakan port Gateway saat ini. Doctor juga dapat memindai layanan tambahan yang mirip Gateway dan mencetak petunjuk pembersihan. Layanan Gateway OpenClaw bernama profil dianggap kelas utama dan tidak ditandai sebagai "tambahan."

    Di Linux, jika layanan Gateway tingkat pengguna hilang tetapi layanan Gateway OpenClaw tingkat sistem ada, Doctor tidak menginstal layanan tingkat pengguna kedua secara otomatis. Periksa dengan `openclaw gateway status --deep` atau `openclaw doctor --deep`, lalu hapus duplikatnya atau atur `OPENCLAW_SERVICE_REPAIR_POLICY=external` saat supervisor sistem memiliki siklus hidup Gateway.

  </Accordion>
  <Accordion title="8b. Migrasi Startup Matrix">
    Saat akun kanal Matrix memiliki migrasi status lama yang tertunda atau dapat ditindaklanjuti, Doctor (dalam mode `--fix` / `--repair`) membuat snapshot pra-migrasi lalu menjalankan langkah migrasi upaya terbaik: migrasi status Matrix lama dan persiapan status terenkripsi lama. Kedua langkah tidak fatal; kesalahan dicatat dan startup berlanjut. Dalam mode baca-saja (`openclaw doctor` tanpa `--fix`) pemeriksaan ini dilewati sepenuhnya.
  </Accordion>
  <Accordion title="8c. Penyandingan perangkat dan penyimpangan autentikasi">
    Doctor sekarang memeriksa status penyandingan perangkat sebagai bagian dari pass kesehatan normal.

    Yang dilaporkan:

    - permintaan penyandingan pertama kali yang tertunda
    - peningkatan peran yang tertunda untuk perangkat yang sudah disandingkan
    - peningkatan cakupan yang tertunda untuk perangkat yang sudah disandingkan
    - perbaikan ketidakcocokan kunci publik ketika id perangkat masih cocok tetapi identitas perangkat tidak lagi cocok dengan catatan yang disetujui
    - catatan yang sudah disandingkan yang tidak memiliki token aktif untuk peran yang disetujui
    - token yang sudah disandingkan yang cakupannya bergeser di luar baseline penyandingan yang disetujui
    - entri token-perangkat yang di-cache secara lokal untuk mesin saat ini yang lebih lama daripada rotasi token sisi Gateway atau membawa metadata cakupan yang usang

    Doctor tidak menyetujui permintaan penyandingan secara otomatis atau merotasi token perangkat secara otomatis. Sebaliknya, ia mencetak langkah berikutnya yang tepat:

    - periksa permintaan tertunda dengan `openclaw devices list`
    - setujui permintaan yang tepat dengan `openclaw devices approve <requestId>`
    - rotasi token baru dengan `openclaw devices rotate --device <deviceId> --role <role>`
    - hapus dan setujui ulang catatan usang dengan `openclaw devices remove <deviceId>`

    Ini menutup celah umum "sudah disandingkan tetapi masih mendapat pairing required": doctor kini membedakan penyandingan pertama kali dari peningkatan peran/cakupan yang tertunda serta dari pergeseran token/identitas perangkat yang usang.

  </Accordion>
  <Accordion title="9. Peringatan keamanan">
    Doctor memunculkan peringatan ketika penyedia terbuka untuk DM tanpa daftar izin, atau ketika kebijakan dikonfigurasi dengan cara yang berbahaya.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jika berjalan sebagai layanan pengguna systemd, doctor memastikan lingering diaktifkan agar Gateway tetap aktif setelah logout.
  </Accordion>
  <Accordion title="11. Status workspace (skills, plugins, dan direktori lama)">
    Doctor mencetak ringkasan status workspace untuk agen default:

    - **Status Skills**: menghitung skill yang memenuhi syarat, persyaratan-hilang, dan diblokir-daftar-izin.
    - **Direktori workspace lama**: memperingatkan ketika `~/openclaw` atau direktori workspace lama lainnya ada berdampingan dengan workspace saat ini.
    - **Status Plugin**: menghitung Plugin yang diaktifkan/dinonaktifkan/error; mencantumkan ID Plugin untuk setiap error; melaporkan kemampuan Plugin bundel.
    - **Peringatan kompatibilitas Plugin**: menandai Plugin yang memiliki masalah kompatibilitas dengan runtime saat ini.
    - **Diagnostik Plugin**: menampilkan peringatan atau error waktu-muat apa pun yang dikeluarkan oleh registri Plugin.

  </Accordion>
  <Accordion title="11b. Ukuran file bootstrap">
    Doctor memeriksa apakah file bootstrap workspace (misalnya `AGENTS.md`, `CLAUDE.md`, atau file konteks lain yang disuntikkan) mendekati atau melampaui anggaran karakter yang dikonfigurasi. Ia melaporkan hitungan karakter mentah vs. tersuntik per file, persentase pemotongan, penyebab pemotongan (`max/file` atau `max/total`), dan total karakter tersuntik sebagai pecahan dari total anggaran. Ketika file dipotong atau mendekati batas, doctor mencetak kiat untuk menyesuaikan `agents.defaults.bootstrapMaxChars` dan `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pembersihan Plugin saluran usang">
    Ketika `openclaw doctor --fix` menghapus Plugin saluran yang hilang, ia juga menghapus config bercakupan saluran yang menggantung yang merujuk ke Plugin tersebut: entri `channels.<id>`, target Heartbeat yang menamai saluran, dan override `agents.*.models["<channel>/*"]`. Ini mencegah loop boot Gateway ketika runtime saluran sudah hilang tetapi config masih meminta gateway untuk mengikat ke sana.
  </Accordion>
  <Accordion title="11c. Pelengkapan shell">
    Doctor memeriksa apakah pelengkapan tab terpasang untuk shell saat ini (zsh, bash, fish, atau PowerShell):

    - Jika profil shell menggunakan pola pelengkapan dinamis yang lambat (`source <(openclaw completion ...)`), doctor meningkatkannya ke varian file cache yang lebih cepat.
    - Jika pelengkapan dikonfigurasi di profil tetapi file cache hilang, doctor membuat ulang cache secara otomatis.
    - Jika tidak ada pelengkapan yang dikonfigurasi sama sekali, doctor meminta untuk memasangnya (hanya mode interaktif; dilewati dengan `--non-interactive`).

    Jalankan `openclaw completion --write-state` untuk membuat ulang cache secara manual.

  </Accordion>
  <Accordion title="12. Pemeriksaan auth Gateway (token lokal)">
    Doctor memeriksa kesiapan auth token gateway lokal.

    - Jika mode token membutuhkan token dan tidak ada sumber token, doctor menawarkan untuk membuatnya.
    - Jika `gateway.auth.token` dikelola SecretRef tetapi tidak tersedia, doctor memperingatkan dan tidak menimpanya dengan plaintext.
    - `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya ketika tidak ada SecretRef token yang dikonfigurasi.

  </Accordion>
  <Accordion title="12b. Perbaikan sadar SecretRef yang read-only">
    Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku runtime fail-fast.

    - `openclaw doctor --fix` kini menggunakan model ringkasan SecretRef read-only yang sama seperti perintah keluarga status untuk perbaikan config tertarget.
    - Contoh: perbaikan `allowFrom` / `groupAllowFrom` `@username` Telegram mencoba menggunakan kredensial bot yang dikonfigurasi ketika tersedia.
    - Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia di jalur perintah saat ini, doctor melaporkan bahwa kredensial dikonfigurasi-tetapi-tidak-tersedia dan melewati resolusi otomatis alih-alih crash atau salah melaporkan token sebagai hilang.

  </Accordion>
  <Accordion title="13. Pemeriksaan kesehatan Gateway + mulai ulang">
    Doctor menjalankan pemeriksaan kesehatan dan menawarkan untuk memulai ulang gateway ketika tampak tidak sehat.
  </Accordion>
  <Accordion title="13b. Kesiapan pencarian memori">
    Doctor memeriksa apakah penyedia embedding pencarian memori yang dikonfigurasi siap untuk agen default. Perilakunya bergantung pada backend dan penyedia yang dikonfigurasi:

    - **Backend QMD**: memeriksa apakah biner `qmd` tersedia dan dapat dijalankan. Jika tidak, mencetak panduan perbaikan termasuk paket npm dan opsi jalur biner manual.
    - **Penyedia lokal eksplisit**: memeriksa file model lokal atau URL model jarak jauh/dapat diunduh yang dikenali. Jika tidak ada, menyarankan untuk beralih ke penyedia jarak jauh.
    - **Penyedia jarak jauh eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa kunci API tersedia di lingkungan atau penyimpanan autentikasi. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika tidak ada.
    - **Penyedia otomatis**: memeriksa ketersediaan model lokal terlebih dahulu, lalu mencoba setiap penyedia jarak jauh sesuai urutan pemilihan otomatis.

    Ketika hasil probe gateway yang di-cache tersedia (gateway sehat pada saat pemeriksaan), doctor mencocokkan hasilnya dengan konfigurasi yang terlihat oleh CLI dan mencatat setiap perbedaan. Doctor tidak memulai ping embedding baru pada jalur default; gunakan perintah status memori mendalam saat Anda menginginkan pemeriksaan penyedia langsung.

    Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

  </Accordion>
  <Accordion title="14. Peringatan status channel">
    Jika gateway sehat, doctor menjalankan probe status channel dan melaporkan peringatan dengan perbaikan yang disarankan.
  </Accordion>
  <Accordion title="15. Audit + perbaikan konfigurasi supervisor">
    Doctor memeriksa konfigurasi supervisor yang terpasang (launchd/systemd/schtasks) untuk default yang hilang atau usang (misalnya, dependensi systemd network-online dan jeda mulai ulang). Saat menemukan ketidakcocokan, doctor merekomendasikan pembaruan dan dapat menulis ulang file layanan/tugas ke default saat ini.

    Catatan:

    - `openclaw doctor` meminta konfirmasi sebelum menulis ulang konfigurasi supervisor.
    - `openclaw doctor --yes` menerima prompt perbaikan default.
    - `openclaw doctor --repair` menerapkan perbaikan yang direkomendasikan tanpa prompt.
    - `openclaw doctor --repair --force` menimpa konfigurasi supervisor kustom.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` menjaga doctor tetap hanya-baca untuk siklus hidup layanan gateway. Doctor tetap melaporkan kesehatan layanan dan menjalankan perbaikan non-layanan, tetapi melewati pemasangan/mulai/mulai ulang/bootstrap layanan, penulisan ulang konfigurasi supervisor, dan pembersihan layanan lama karena supervisor eksternal memiliki siklus hidup tersebut.
    - Di Linux, doctor tidak menulis ulang metadata perintah/entrypoint saat unit gateway systemd yang cocok aktif. Doctor juga mengabaikan unit tambahan mirip gateway non-legacy yang tidak aktif selama pemindaian layanan duplikat, sehingga file layanan pendamping tidak membuat noise pembersihan.
    - Jika autentikasi token memerlukan token dan `gateway.auth.token` dikelola SecretRef, pemasangan/perbaikan layanan doctor memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang sudah di-resolve ke dalam metadata lingkungan layanan supervisor.
    - Doctor mendeteksi nilai lingkungan layanan terkelola berbasis `.env`/SecretRef yang dipasang inline oleh instalasi LaunchAgent, systemd, atau Windows Scheduled Task lama dan menulis ulang metadata layanan agar nilai tersebut dimuat dari sumber runtime, bukan dari definisi supervisor.
    - Doctor mendeteksi saat perintah layanan masih mengunci `--port` lama setelah `gateway.port` berubah dan menulis ulang metadata layanan ke port saat ini.
    - Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi belum ter-resolve, doctor memblokir jalur pemasangan/perbaikan dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum disetel, doctor memblokir pemasangan/perbaikan hingga mode disetel secara eksplisit.
    - Untuk unit user-systemd Linux, pemeriksaan drift token doctor kini menyertakan sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata autentikasi layanan.
    - Perbaikan layanan Doctor menolak menulis ulang, menghentikan, atau memulai ulang layanan gateway dari biner OpenClaw yang lebih lama ketika konfigurasi terakhir ditulis oleh versi yang lebih baru. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostik runtime + port Gateway">
    Doctor memeriksa runtime layanan (PID, status keluar terakhir) dan memperingatkan saat layanan terpasang tetapi sebenarnya tidak berjalan. Doctor juga memeriksa bentrokan port pada port gateway (default `18789`) dan melaporkan kemungkinan penyebabnya (gateway sudah berjalan, tunnel SSH).
  </Accordion>
  <Accordion title="17. Praktik terbaik runtime Gateway">
    Doctor memperingatkan saat layanan gateway berjalan di Bun atau jalur Node yang dikelola versi (`nvm`, `fnm`, `volta`, `asdf`, dll.). Channel WhatsApp + Telegram memerlukan Node, dan jalur pengelola versi dapat rusak setelah peningkatan karena layanan tidak memuat init shell Anda. Doctor menawarkan migrasi ke instalasi Node sistem jika tersedia (Homebrew/apt/choco).

    LaunchAgent macOS yang baru dipasang atau diperbaiki menggunakan PATH sistem kanonis (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) alih-alih menyalin PATH shell interaktif, sehingga direktori Volta, asdf, fnm, pnpm, dan pengelola versi lain tidak mengubah Node mana yang di-resolve oleh proses anak. Layanan Linux tetap mempertahankan root lingkungan eksplisit (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) dan direktori user-bin yang stabil, tetapi direktori fallback pengelola versi yang ditebak hanya ditulis ke PATH layanan saat direktori tersebut ada di disk.

  </Accordion>
  <Accordion title="18. Penulisan konfigurasi + metadata wizard">
    Doctor menyimpan perubahan konfigurasi apa pun dan memberi cap metadata wizard untuk mencatat proses doctor.
  </Accordion>
  <Accordion title="19. Tips workspace (cadangan + sistem memori)">
    Doctor menyarankan sistem memori workspace saat belum ada dan mencetak tips cadangan jika workspace belum berada di bawah git.

    Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap tentang struktur workspace dan cadangan git (GitHub atau GitLab privat direkomendasikan).

  </Accordion>
</AccordionGroup>

## Terkait

- [Runbook Gateway](/id/gateway)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
