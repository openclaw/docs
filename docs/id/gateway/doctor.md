---
read_when:
    - Menambahkan atau memodifikasi migrasi doctor
    - Memperkenalkan perubahan konfigurasi yang tidak kompatibel
sidebarTitle: Doctor
summary: 'Perintah doctor: pemeriksaan kesehatan, migrasi konfigurasi, dan langkah perbaikan'
title: Dokter
x-i18n:
    generated_at: "2026-05-10T19:36:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417440c2f658be5848b305bffeb006ad435f069d93f7e73ffbeef9468b58e1b3
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` adalah alat perbaikan + migrasi untuk OpenClaw. Alat ini memperbaiki konfigurasi/status yang kedaluwarsa, memeriksa kesehatan, dan menyediakan langkah perbaikan yang dapat ditindaklanjuti.

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

    Terima default tanpa prompt (termasuk langkah perbaikan restart/layanan/sandbox jika berlaku).

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

    Jalankan tanpa prompt dan hanya terapkan migrasi aman (normalisasi konfigurasi + pemindahan status di disk). Melewati tindakan restart/layanan/sandbox yang memerlukan konfirmasi manusia. Migrasi status lama berjalan otomatis saat terdeteksi.

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
    - Pemeriksaan kesegaran protokol UI (membangun ulang Control UI saat skema protokol lebih baru).
    - Pemeriksaan kesehatan + prompt restart.
    - Ringkasan status Skills (memenuhi syarat/hilang/diblokir) dan status plugin.

  </Accordion>
  <Accordion title="Konfigurasi dan migrasi">
    - Normalisasi konfigurasi untuk nilai lama.
    - Migrasi konfigurasi Talk dari bidang lama datar `talk.*` ke `talk.provider` + `talk.providers.<provider>`.
    - Pemeriksaan migrasi browser untuk konfigurasi lama ekstensi Chrome dan kesiapan MCP Chrome.
    - Peringatan override penyedia OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Peringatan pembayangan OAuth Codex (`models.providers.openai-codex`).
    - Pemeriksaan prasyarat TLS OAuth untuk profil OAuth OpenAI Codex.
    - Peringatan daftar izin Plugin/alat saat `plugins.allow` bersifat membatasi tetapi kebijakan alat masih meminta wildcard atau alat milik plugin.
    - Migrasi status lama di disk (sessions/agent dir/autentikasi WhatsApp).
    - Migrasi kunci kontrak manifes plugin lama (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrasi penyimpanan Cron lama (`jobId`, `schedule.cron`, bidang delivery/payload tingkat atas, payload `provider`, job fallback webhook sederhana `notify: true`).
    - Pembersihan runtime-policy lama seluruh agen; runtime policy penyedia/model adalah pemilih rute aktif.
    - Pembersihan konfigurasi plugin yang kedaluwarsa saat plugin diaktifkan; saat `plugins.enabled=false`, referensi plugin yang kedaluwarsa diperlakukan sebagai konfigurasi kontainmen inert dan dipertahankan.

  </Accordion>
  <Accordion title="Status dan integritas">
    - Inspeksi file kunci sesi dan pembersihan kunci kedaluwarsa.
    - Perbaikan transkrip sesi untuk cabang penulisan ulang prompt duplikat yang dibuat oleh build 2026.4.24 yang terdampak.
    - Deteksi tombstone pemulihan-restart subagen yang tersangkut, dengan dukungan `--fix` untuk menghapus flag pemulihan dibatalkan yang kedaluwarsa agar startup tidak terus memperlakukan child sebagai dibatalkan-restart.
    - Pemeriksaan integritas status dan izin (sesi, transkrip, direktori status).
    - Pemeriksaan izin file konfigurasi (chmod 600) saat berjalan secara lokal.
    - Kesehatan autentikasi model: memeriksa kedaluwarsa OAuth, dapat menyegarkan token yang hampir kedaluwarsa, dan melaporkan status cooldown/dinonaktifkan auth-profile.
    - Deteksi direktori workspace tambahan (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, layanan, dan supervisor">
    - Perbaikan image sandbox saat sandboxing diaktifkan.
    - Migrasi layanan lama dan deteksi gateway tambahan.
    - Migrasi status lama channel Matrix (dalam mode `--fix` / `--repair`).
    - Pemeriksaan runtime Gateway (layanan terinstal tetapi tidak berjalan; label launchd tersimpan cache).
    - Peringatan status channel (diprobe dari gateway yang berjalan).
    - Pemeriksaan izin khusus channel berada di bawah `openclaw channels capabilities`; misalnya, izin channel suara Discord diaudit dengan `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Pemeriksaan responsivitas WhatsApp untuk kesehatan event-loop Gateway yang menurun saat klien TUI lokal masih berjalan; `--fix` hanya menghentikan klien TUI lokal yang terverifikasi.
    - Perbaikan rute Codex untuk ref model lama `openai-codex/*` di model utama, fallback, override heartbeat/subagen/compaction, hook, override model channel, dan pin rute sesi; `--fix` menulis ulangnya menjadi `openai/*`, menghapus pin runtime sesi/seluruh-agen yang kedaluwarsa, dan membiarkan ref agen OpenAI kanonis pada harness Codex default.
    - Audit konfigurasi supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
    - Pembersihan lingkungan proxy tertanam untuk layanan gateway yang menangkap nilai shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` saat instalasi atau pembaruan.
    - Pemeriksaan praktik terbaik runtime Gateway (Node vs Bun, jalur version-manager).
    - Diagnostik benturan port Gateway (default `18789`).

  </Accordion>
  <Accordion title="Autentikasi, keamanan, dan pairing">
    - Peringatan keamanan untuk kebijakan DM terbuka.
    - Pemeriksaan autentikasi Gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada sumber token; tidak menimpa konfigurasi SecretRef token).
    - Deteksi masalah pairing perangkat (permintaan pair pertama kali yang tertunda, peningkatan peran/cakupan yang tertunda, drift cache device-token lokal yang kedaluwarsa, dan drift autentikasi paired-record).

  </Accordion>
  <Accordion title="Workspace dan shell">
    - Pemeriksaan systemd linger di Linux.
    - Pemeriksaan ukuran file bootstrap workspace (peringatan pemotongan/hampir batas untuk file konteks).
    - Pemeriksaan kesiapan Skills untuk agen default; melaporkan skill yang diizinkan dengan bin, env, konfigurasi, atau persyaratan OS yang hilang, dan `--fix` dapat menonaktifkan skill yang tidak tersedia di `skills.entries`.
    - Pemeriksaan status penyelesaian shell dan instal/upgrade otomatis.
    - Pemeriksaan kesiapan penyedia embedding pencarian memori (model lokal, kunci API jarak jauh, atau biner QMD).
    - Pemeriksaan instalasi sumber (ketidakcocokan workspace pnpm, aset UI hilang, biner tsx hilang).
    - Menulis konfigurasi yang diperbarui + metadata wizard.

  </Accordion>
</AccordionGroup>

## Backfill dan reset UI Dreams

Adegan Dreams Control UI mencakup tindakan **Backfill**, **Reset**, dan **Clear Grounded** untuk alur kerja dreaming yang grounded. Tindakan ini menggunakan metode RPC bergaya gateway doctor, tetapi **bukan** bagian dari perbaikan/migrasi CLI `openclaw doctor`.

Yang dilakukan:

- **Backfill** memindai file historis `memory/YYYY-MM-DD.md` di workspace aktif, menjalankan pass diary REM grounded, dan menulis entri backfill yang dapat dibalik ke `DREAMS.md`.
- **Reset** hanya menghapus entri diary backfill bertanda tersebut dari `DREAMS.md`.
- **Clear Grounded** hanya menghapus entri jangka pendek staged grounded-only yang berasal dari replay historis dan belum mengakumulasi recall live atau dukungan harian.

Yang **tidak** dilakukan sendiri:

- tidak mengedit `MEMORY.md`
- tidak menjalankan migrasi doctor penuh
- tidak otomatis melakukan stage kandidat grounded ke penyimpanan promosi jangka pendek live kecuali Anda secara eksplisit menjalankan jalur CLI staged terlebih dahulu

Jika Anda ingin replay historis grounded memengaruhi jalur promosi mendalam normal, gunakan alur CLI sebagai gantinya:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Itu melakukan stage kandidat durable grounded ke penyimpanan dreaming jangka pendek sambil tetap menjadikan `DREAMS.md` sebagai permukaan peninjauan.

## Perilaku terperinci dan alasan

<AccordionGroup>
  <Accordion title="0. Pembaruan opsional (instalasi git)">
    Jika ini adalah checkout git dan doctor berjalan secara interaktif, alat ini menawarkan untuk memperbarui (fetch/rebase/build) sebelum menjalankan doctor.
  </Accordion>
  <Accordion title="1. Normalisasi konfigurasi">
    Jika konfigurasi berisi bentuk nilai lama (misalnya `messages.ackReaction` tanpa override khusus channel), doctor menormalisasinya ke skema saat ini.

    Itu mencakup bidang datar Talk lama. Konfigurasi speech Talk publik saat ini adalah `talk.provider` + `talk.providers.<provider>`, dan konfigurasi suara realtime adalah `talk.realtime.*`. Doctor menulis ulang bentuk lama `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ke dalam peta penyedia, dan menulis ulang selector realtime tingkat atas lama (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) ke `talk.realtime`.

    Doctor juga memperingatkan saat `plugins.allow` tidak kosong dan kebijakan alat menggunakan
    entri alat wildcard atau milik plugin. `tools.allow: ["*"]` hanya mencocokkan alat
    dari plugin yang benar-benar dimuat; itu tidak melewati daftar izin plugin eksklusif.
    Doctor menulis `plugins.bundledDiscovery: "compat"` untuk konfigurasi daftar izin lama yang dimigrasikan
    guna mempertahankan perilaku penyedia bundled yang ada, lalu
    menunjuk ke pengaturan `"allowlist"` yang lebih ketat.

  </Accordion>
  <Accordion title="2. Migrasi kunci konfigurasi lama">
    Saat konfigurasi berisi kunci yang sudah tidak digunakan, perintah lain menolak berjalan dan meminta Anda menjalankan `openclaw doctor`.

    Doctor akan:

    - Menjelaskan kunci lama mana yang ditemukan.
    - Menampilkan migrasi yang diterapkan.
    - Menulis ulang `~/.openclaw/openclaw.json` dengan skema yang diperbarui.

    Startup Gateway menolak format konfigurasi lama dan meminta Anda menjalankan `openclaw doctor --fix`; startup tidak menulis ulang `openclaw.json`. Migrasi penyimpanan job Cron juga ditangani oleh `openclaw doctor --fix`.

    Migrasi saat ini:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - konfigurasi kanal terkonfigurasi yang tidak memiliki kebijakan balasan terlihat → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` tingkat teratas
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` legacy → `talk.provider` + `talk.providers.<provider>`
    - pemilih Talk realtime tingkat teratas legacy (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Untuk kanal dengan `accounts` bernama tetapi masih memiliki nilai kanal tingkat teratas akun tunggal yang tersisa, pindahkan nilai yang tercakup akun tersebut ke akun yang dipromosikan yang dipilih untuk kanal itu (`accounts.default` untuk sebagian besar kanal; Matrix dapat mempertahankan target bernama/default cocok yang sudah ada)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - hapus `agents.defaults.llm`; gunakan `models.providers.<id>.timeoutSeconds` untuk timeout penyedia/model yang lambat
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - hapus `browser.relayBindHost` (pengaturan relay ekstensi legacy)
    - `models.providers.*.api: "openai"` legacy → `"openai-completions"` (startup Gateway juga melewati penyedia yang `api`-nya diatur ke nilai enum masa depan atau tidak dikenal, alih-alih gagal tertutup)
    - hapus `plugins.entries.codex.config.codexDynamicToolsProfile`; server aplikasi Codex selalu mempertahankan alat workspace native Codex sebagai native

    Peringatan doctor juga mencakup panduan default akun untuk kanal multi-akun:

    - Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa routing fallback dapat memilih akun yang tidak diharapkan.
    - Jika `channels.<channel>.defaultAccount` diatur ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

  </Accordion>
  <Accordion title="2b. Override penyedia OpenCode">
    Jika Anda telah menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go` secara manual, itu mengesampingkan katalog OpenCode bawaan dari `@mariozechner/pi-ai`. Hal itu dapat memaksa model ke API yang salah atau mengosongkan biaya. Doctor memperingatkan agar Anda dapat menghapus override dan memulihkan routing API + biaya per model.
  </Accordion>
  <Accordion title="2c. Migrasi browser dan kesiapan Chrome MCP">
    Jika konfigurasi browser Anda masih menunjuk ke path ekstensi Chrome yang telah dihapus, doctor menormalisasikannya ke model attach Chrome MCP host-lokal saat ini:

    - `browser.profiles.*.driver: "extension"` menjadi `"existing-session"`
    - `browser.relayBindHost` dihapus

    Doctor juga mengaudit path Chrome MCP host-lokal saat Anda menggunakan `defaultProfile: "user"` atau profil `existing-session` yang dikonfigurasi:

    - memeriksa apakah Google Chrome terinstal pada host yang sama untuk profil auto-connect default
    - memeriksa versi Chrome yang terdeteksi dan memperingatkan saat versinya di bawah Chrome 144
    - mengingatkan Anda untuk mengaktifkan remote debugging di halaman inspect browser (misalnya `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, atau `edge://inspect/#remote-debugging`)

    Doctor tidak dapat mengaktifkan pengaturan sisi Chrome untuk Anda. Chrome MCP host-lokal tetap memerlukan:

    - browser berbasis Chromium 144+ pada host gateway/node
    - browser berjalan secara lokal
    - remote debugging diaktifkan di browser tersebut
    - menyetujui prompt persetujuan attach pertama di browser

    Kesiapan di sini hanya tentang prasyarat attach lokal. Existing-session mempertahankan batas rute Chrome MCP saat ini; rute lanjutan seperti `responsebody`, ekspor PDF, intersepsi unduhan, dan aksi batch masih memerlukan browser terkelola atau profil CDP mentah.

    Pemeriksaan ini **tidak** berlaku untuk Docker, sandbox, remote-browser, atau alur headless lainnya. Alur tersebut tetap menggunakan CDP mentah.

  </Accordion>
  <Accordion title="2d. Prasyarat TLS OAuth">
    Saat profil OAuth OpenAI Codex dikonfigurasi, doctor memeriksa endpoint otorisasi OpenAI untuk memverifikasi bahwa stack TLS Node/OpenSSL lokal dapat memvalidasi rantai sertifikat. Jika pemeriksaan gagal dengan error sertifikat (misalnya `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat self-signed), doctor mencetak panduan perbaikan khusus platform. Di macOS dengan Node Homebrew, perbaikannya biasanya `brew postinstall ca-certificates`. Dengan `--deep`, pemeriksaan tetap berjalan meskipun gateway sehat.
  </Accordion>
  <Accordion title="2e. Override penyedia OAuth Codex">
    Jika sebelumnya Anda menambahkan pengaturan transport OpenAI legacy di bawah `models.providers.openai-codex`, pengaturan tersebut dapat membayangi path penyedia OAuth Codex bawaan yang digunakan rilis lebih baru secara otomatis. Doctor memperingatkan saat melihat pengaturan transport lama tersebut bersama OAuth Codex agar Anda dapat menghapus atau menulis ulang override transport usang dan mendapatkan kembali perilaku routing/fallback bawaan. Proxy kustom dan override khusus header tetap didukung dan tidak memicu peringatan ini.
  </Accordion>
  <Accordion title="2f. Perbaikan rute Codex">
    Doctor memeriksa ref model `openai-codex/*` legacy. Routing harness Codex native menggunakan ref model `openai/*` kanonis; giliran agen OpenAI melewati harness server aplikasi Codex alih-alih path OpenClaw PI OpenAI.

    Dalam mode `--fix` / `--repair`, doctor menulis ulang ref default-agent dan per-agent yang terdampak, termasuk model primer, fallback, override heartbeat/subagent/compaction, hook, override model kanal, dan status rute sesi persisten yang usang:

    - `openai-codex/gpt-*` menjadi `openai/gpt-*`.
    - Intent Codex dipindahkan ke entri `agentRuntime.id: "codex"` bercakupan penyedia/model untuk ref model agen yang diperbaiki agar profil auth `openai-codex:...` tetap dapat dipilih setelah ref model menjadi `openai/*`.
    - Konfigurasi runtime seluruh agen yang usang dan pin runtime sesi persisten dihapus karena pemilihan runtime bercakupan penyedia/model.
    - Kebijakan runtime penyedia/model yang sudah ada dipertahankan kecuali ref model legacy yang diperbaiki memerlukan routing Codex untuk menjaga path auth lama.
    - Daftar fallback model yang sudah ada dipertahankan dengan entri legacy-nya ditulis ulang; pengaturan per-model yang disalin berpindah dari kunci legacy ke kunci `openai/*` kanonis.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, pemberitahuan fallback, dan pin profil auth sesi persisten diperbaiki di semua store sesi agen yang ditemukan.
    - `/codex ...` berarti "mengontrol atau mengikat percakapan Codex native dari chat."
    - `/acp ...` atau `runtime: "acp"` berarti "menggunakan adapter ACP/acpx eksternal."

  </Accordion>
  <Accordion title="2g. Pembersihan rute sesi">
    Doctor juga memindai store sesi agen yang ditemukan untuk status rute yang dibuat otomatis dan usang setelah Anda memindahkan model atau runtime yang dikonfigurasi dari rute milik Plugin seperti Codex.

    `openclaw doctor --fix` dapat membersihkan status usang yang dibuat otomatis seperti pin model `modelOverrideSource: "auto"`, metadata model runtime, ID harness yang dipin, binding sesi CLI, dan override profil auth otomatis saat rute pemiliknya tidak lagi dikonfigurasi. Pilihan model sesi eksplisit pengguna atau legacy dilaporkan untuk tinjauan manual dan dibiarkan tidak tersentuh; alihkan dengan `/model ...`, `/new`, atau reset sesi saat rute itu tidak lagi dimaksudkan.

  </Accordion>
  <Accordion title="3. Migrasi status legacy (tata letak disk)">
    Doctor dapat memigrasikan tata letak lama di disk ke struktur saat ini:

    - Store sesi + transkrip:
      - dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
    - Direktori agen:
      - dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
    - Status auth WhatsApp (Baileys):
      - dari `~/.openclaw/credentials/*.json` legacy (kecuali `oauth.json`)
      - ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID akun default: `default`)

    Migrasi ini bersifat upaya terbaik dan idempoten; doctor akan mengeluarkan peringatan saat meninggalkan folder legacy sebagai cadangan. Gateway/CLI juga memigrasikan otomatis sesi legacy + direktori agen saat startup sehingga riwayat/auth/model masuk ke path per-agen tanpa perlu menjalankan doctor secara manual. Auth WhatsApp sengaja hanya dimigrasikan melalui `openclaw doctor`. Normalisasi penyedia/peta-penyedia Talk kini membandingkan berdasarkan kesetaraan struktural, sehingga diff yang hanya berupa urutan kunci tidak lagi memicu perubahan `doctor --fix` no-op berulang.

  </Accordion>
  <Accordion title="3a. Migrasi manifest Plugin legacy">
    Doctor memindai semua manifest Plugin terinstal untuk kunci kapabilitas tingkat teratas yang sudah usang (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Saat ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts` dan menulis ulang file manifest di tempat. Migrasi ini idempoten; jika kunci `contracts` sudah memiliki nilai yang sama, kunci legacy dihapus tanpa menduplikasi data.
  </Accordion>
  <Accordion title="3b. Migrasi store cron legacy">
    Doctor juga memeriksa store job cron (`~/.openclaw/cron/jobs.json` secara default, atau `cron.store` saat dioverride) untuk bentuk job lama yang masih diterima scheduler demi kompatibilitas.

    Pembersihan cron saat ini mencakup:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - bidang payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
    - bidang pengiriman tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias pengiriman `provider` payload → `delivery.channel` eksplisit
    - pekerjaan fallback webhook `notify: true` sederhana lama → `delivery.mode="webhook"` eksplisit dengan `delivery.to=cron.webhook`

    Doctor hanya memigrasikan otomatis pekerjaan `notify: true` ketika dapat melakukannya tanpa mengubah perilaku. Jika sebuah pekerjaan menggabungkan fallback notify lama dengan mode pengiriman non-webhook yang sudah ada, doctor memperingatkan dan membiarkan pekerjaan itu untuk ditinjau manual.

    Di Linux, doctor juga memperingatkan ketika crontab pengguna masih menjalankan `~/.openclaw/bin/ensure-whatsapp.sh` lama. Skrip lokal host tersebut tidak dipelihara oleh OpenClaw saat ini dan dapat menulis pesan `Gateway inactive` palsu ke `~/.openclaw/logs/whatsapp-health.log` ketika cron tidak dapat menjangkau bus pengguna systemd. Hapus entri crontab usang dengan `crontab -e`; gunakan `openclaw channels status --probe`, `openclaw doctor`, dan `openclaw gateway status` untuk pemeriksaan kesehatan saat ini.

  </Accordion>
  <Accordion title="3c. Pembersihan kunci sesi">
    Doctor memindai setiap direktori sesi agen untuk mencari file kunci tulis usang — file yang tertinggal ketika sesi keluar secara tidak normal. Untuk setiap file kunci yang ditemukan, doctor melaporkan: jalur, PID, apakah PID masih aktif, usia kunci, dan apakah file tersebut dianggap usang (PID mati, lebih lama dari 30 menit, atau PID aktif yang dapat dibuktikan milik proses non-OpenClaw). Dalam mode `--fix` / `--repair`, doctor menghapus file kunci usang secara otomatis; jika tidak, doctor mencetak catatan dan menginstruksikan Anda untuk menjalankan ulang dengan `--fix`.
  </Accordion>
  <Accordion title="3d. Perbaikan cabang transkrip sesi">
    Doctor memindai file JSONL sesi agen untuk mencari bentuk cabang duplikat yang dibuat oleh bug penulisan ulang transkrip prompt 2026.4.24: giliran pengguna yang ditinggalkan dengan konteks runtime internal OpenClaw plus saudara aktif yang berisi prompt pengguna terlihat yang sama. Dalam mode `--fix` / `--repair`, doctor mencadangkan setiap file yang terdampak di samping file asli dan menulis ulang transkrip ke cabang aktif sehingga riwayat Gateway dan pembaca memori tidak lagi melihat giliran duplikat.
  </Accordion>
  <Accordion title="4. Pemeriksaan integritas status (persistensi sesi, perutean, dan keselamatan)">
    Direktori status adalah batang otak operasional. Jika hilang, Anda kehilangan sesi, kredensial, log, dan konfigurasi (kecuali Anda memiliki cadangan di tempat lain).

    Doctor memeriksa:

    - **Direktori status hilang**: memperingatkan tentang kehilangan status yang katastrofik, meminta untuk membuat ulang direktori, dan mengingatkan Anda bahwa data yang hilang tidak dapat dipulihkan.
    - **Izin direktori status**: memverifikasi apakah dapat ditulis; menawarkan untuk memperbaiki izin (dan mengeluarkan petunjuk `chown` ketika ketidakcocokan pemilik/grup terdeteksi).
    - **Direktori status tersinkron cloud macOS**: memperingatkan ketika status berada di bawah iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau `~/Library/CloudStorage/...` karena jalur berbasis sinkronisasi dapat menyebabkan I/O lebih lambat dan race kunci/sinkronisasi.
    - **Direktori status SD atau eMMC Linux**: memperingatkan ketika status mengarah ke sumber mount `mmcblk*`, karena I/O acak berbasis SD atau eMMC dapat lebih lambat dan lebih cepat aus akibat penulisan sesi dan kredensial.
    - **Direktori sesi hilang**: `sessions/` dan direktori penyimpanan sesi diperlukan untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
    - **Ketidakcocokan transkrip**: memperingatkan ketika entri sesi terbaru kehilangan file transkrip.
    - **Sesi utama "JSONL 1 baris"**: menandai ketika transkrip utama hanya memiliki satu baris (riwayat tidak bertambah).
    - **Beberapa direktori status**: memperingatkan ketika beberapa folder `~/.openclaw` ada di berbagai direktori home atau ketika `OPENCLAW_STATE_DIR` menunjuk ke tempat lain (riwayat dapat terpecah antarinstalasi).
    - **Pengingat mode jarak jauh**: jika `gateway.mode=remote`, doctor mengingatkan Anda untuk menjalankannya di host jarak jauh (status berada di sana).
    - **Izin file konfigurasi**: memperingatkan jika `~/.openclaw/openclaw.json` dapat dibaca grup/dunia dan menawarkan untuk memperketat ke `600`.

  </Accordion>
  <Accordion title="5. Kesehatan autentikasi model (kedaluwarsa OAuth)">
    Doctor memeriksa profil OAuth di penyimpanan auth, memperingatkan ketika token akan kedaluwarsa/sudah kedaluwarsa, dan dapat menyegarkannya ketika aman. Jika profil OAuth/token Anthropic sudah usang, doctor menyarankan kunci API Anthropic atau jalur setup-token Anthropic. Prompt penyegaran hanya muncul ketika berjalan secara interaktif (TTY); `--non-interactive` melewati upaya penyegaran.

    Ketika penyegaran OAuth gagal permanen (misalnya `refresh_token_reused`, `invalid_grant`, atau provider meminta Anda masuk lagi), doctor melaporkan bahwa autentikasi ulang diperlukan dan mencetak perintah `openclaw models auth login --provider ...` yang tepat untuk dijalankan.

    Doctor juga melaporkan profil auth yang sementara tidak dapat digunakan karena:

    - cooldown singkat (batas laju/timeout/kegagalan auth)
    - penonaktifan lebih lama (kegagalan penagihan/kredit)

  </Accordion>
  <Accordion title="6. Validasi model hook">
    Jika `hooks.gmail.model` diatur, doctor memvalidasi referensi model terhadap katalog dan allowlist serta memperingatkan ketika referensi tersebut tidak dapat diselesaikan atau tidak diizinkan.
  </Accordion>
  <Accordion title="7. Perbaikan image sandbox">
    Ketika sandboxing diaktifkan, doctor memeriksa image Docker dan menawarkan untuk membangun atau beralih ke nama lama jika image saat ini hilang.
  </Accordion>
  <Accordion title="7b. Pembersihan instalasi Plugin">
    Doctor menghapus status staging dependensi Plugin lama yang dihasilkan OpenClaw dalam mode `openclaw doctor --fix` / `openclaw doctor --repair`. Ini mencakup root dependensi hasil generasi yang usang, direktori tahap instal lama, sisa lokal paket dari kode perbaikan dependensi Plugin bawaan sebelumnya, dan salinan npm terkelola yatim atau dipulihkan dari Plugin `@openclaw/*` bawaan yang dapat menutupi manifes bawaan saat ini.

    Doctor juga dapat menginstal ulang Plugin unduhan yang hilang ketika konfigurasi merujuknya tetapi registry Plugin lokal tidak dapat menemukannya. Contohnya mencakup `plugins.entries` material, pengaturan channel/provider/search yang dikonfigurasi, dan runtime agen yang dikonfigurasi. Selama pembaruan paket, doctor menghindari menjalankan perbaikan Plugin manajer paket ketika paket inti sedang diganti; jalankan `openclaw doctor --fix` lagi setelah pembaruan jika Plugin yang dikonfigurasi masih memerlukan pemulihan. Startup Gateway dan pemuatan ulang konfigurasi tidak menjalankan manajer paket; instalasi Plugin tetap menjadi pekerjaan eksplisit doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrasi layanan Gateway dan petunjuk pembersihan">
    Doctor mendeteksi layanan gateway lama (launchd/systemd/schtasks) dan menawarkan untuk menghapusnya serta menginstal layanan OpenClaw menggunakan port gateway saat ini. Doctor juga dapat memindai layanan tambahan yang mirip gateway dan mencetak petunjuk pembersihan. Layanan gateway OpenClaw yang dinamai sesuai profil dianggap kelas utama dan tidak ditandai sebagai "tambahan."

    Di Linux, jika layanan gateway tingkat pengguna tidak ada tetapi layanan gateway OpenClaw tingkat sistem ada, doctor tidak menginstal layanan tingkat pengguna kedua secara otomatis. Periksa dengan `openclaw gateway status --deep` atau `openclaw doctor --deep`, lalu hapus duplikatnya atau atur `OPENCLAW_SERVICE_REPAIR_POLICY=external` ketika supervisor sistem memiliki siklus hidup gateway.

  </Accordion>
  <Accordion title="8b. Migrasi Startup Matrix">
    Ketika akun saluran Matrix memiliki migrasi status lama yang tertunda atau dapat ditindaklanjuti, doctor (dalam mode `--fix` / `--repair`) membuat snapshot pra-migrasi lalu menjalankan langkah-langkah migrasi upaya terbaik: migrasi status Matrix lama dan persiapan status terenkripsi lama. Kedua langkah ini tidak fatal; kesalahan dicatat dan startup berlanjut. Dalam mode hanya-baca (`openclaw doctor` tanpa `--fix`) pemeriksaan ini dilewati sepenuhnya.
  </Accordion>
  <Accordion title="8c. Penyandingan perangkat dan pergeseran auth">
    Doctor sekarang memeriksa status penyandingan perangkat sebagai bagian dari pemeriksaan kesehatan normal.

    Yang dilaporkan:

    - permintaan penyandingan pertama kali yang tertunda
    - peningkatan peran yang tertunda untuk perangkat yang sudah disandingkan
    - peningkatan cakupan yang tertunda untuk perangkat yang sudah disandingkan
    - perbaikan ketidakcocokan kunci publik ketika id perangkat masih cocok tetapi identitas perangkat tidak lagi cocok dengan catatan yang disetujui
    - catatan tersanding yang tidak memiliki token aktif untuk peran yang disetujui
    - token tersanding yang cakupannya bergeser di luar baseline penyandingan yang disetujui
    - entri token perangkat cache lokal untuk mesin saat ini yang mendahului rotasi token sisi gateway atau membawa metadata cakupan usang

    Doctor tidak menyetujui otomatis permintaan penyandingan atau memutar otomatis token perangkat. Doctor mencetak langkah berikutnya yang tepat sebagai gantinya:

    - periksa permintaan tertunda dengan `openclaw devices list`
    - setujui permintaan yang tepat dengan `openclaw devices approve <requestId>`
    - putar token baru dengan `openclaw devices rotate --device <deviceId> --role <role>`
    - hapus dan setujui ulang catatan usang dengan `openclaw devices remove <deviceId>`

    Ini menutup celah umum "sudah disandingkan tetapi masih mendapatkan pairing required": doctor sekarang membedakan penyandingan pertama kali dari peningkatan peran/cakupan yang tertunda dan dari pergeseran token/identitas perangkat yang usang.

  </Accordion>
  <Accordion title="9. Peringatan keamanan">
    Doctor mengeluarkan peringatan ketika provider terbuka untuk DM tanpa allowlist, atau ketika kebijakan dikonfigurasi dengan cara yang berbahaya.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jika berjalan sebagai layanan pengguna systemd, doctor memastikan lingering diaktifkan agar gateway tetap hidup setelah logout.
  </Accordion>
  <Accordion title="11. Status workspace (skills, plugin, dan direktori lama)">
    Doctor mencetak ringkasan status workspace untuk agen default:

    - **Status Skills**: menghitung skills yang memenuhi syarat, persyaratannya hilang, dan diblokir allowlist.
    - **Direktori workspace lama**: memperingatkan ketika `~/openclaw` atau direktori workspace lama lainnya ada berdampingan dengan workspace saat ini.
    - **Status Plugin**: menghitung plugin yang diaktifkan/dinonaktifkan/bermasalah; mencantumkan ID plugin untuk kesalahan apa pun; melaporkan kapabilitas plugin bundle.
    - **Peringatan kompatibilitas Plugin**: menandai plugin yang memiliki masalah kompatibilitas dengan runtime saat ini.
    - **Diagnostik Plugin**: menampilkan peringatan atau kesalahan waktu pemuatan yang dikeluarkan oleh registry plugin.

  </Accordion>
  <Accordion title="11b. Ukuran file bootstrap">
    Doctor memeriksa apakah file bootstrap workspace (misalnya `AGENTS.md`, `CLAUDE.md`, atau file konteks lain yang diinjeksi) mendekati atau melampaui anggaran karakter yang dikonfigurasi. Doctor melaporkan jumlah karakter mentah vs. terinjeksi per file, persentase pemotongan, penyebab pemotongan (`max/file` atau `max/total`), dan total karakter terinjeksi sebagai fraksi dari total anggaran. Ketika file dipotong atau mendekati batas, doctor mencetak tips untuk menyesuaikan `agents.defaults.bootstrapMaxChars` dan `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pembersihan plugin saluran usang">
    Ketika `openclaw doctor --fix` menghapus plugin saluran yang hilang, doctor juga menghapus konfigurasi bercakupan saluran yang menggantung dan mereferensikan plugin tersebut: entri `channels.<id>`, target heartbeat yang menamai saluran, dan override `agents.*.models["<channel>/*"]`. Ini mencegah boot loop Gateway ketika runtime saluran sudah hilang tetapi konfigurasi masih meminta gateway untuk bind ke runtime tersebut.
  </Accordion>
  <Accordion title="11c. Pelengkapan shell">
    Doctor memeriksa apakah pelengkapan tab terinstal untuk shell saat ini (zsh, bash, fish, atau PowerShell):

    - Jika profil shell menggunakan pola pelengkapan dinamis yang lambat (`source <(openclaw completion ...)`), doctor meningkatkannya ke varian file cache yang lebih cepat.
    - Jika pelengkapan dikonfigurasi di profil tetapi file cache hilang, doctor meregenerasi cache secara otomatis.
    - Jika tidak ada pelengkapan yang dikonfigurasi sama sekali, doctor meminta untuk menginstalnya (hanya mode interaktif; dilewati dengan `--non-interactive`).

    Jalankan `openclaw completion --write-state` untuk meregenerasi cache secara manual.

  </Accordion>
  <Accordion title="12. Pemeriksaan autentikasi Gateway (token lokal)">
    Doctor memeriksa kesiapan autentikasi token gateway lokal.

    - Jika mode token memerlukan token dan tidak ada sumber token, doctor menawarkan untuk membuatnya.
    - Jika `gateway.auth.token` dikelola SecretRef tetapi tidak tersedia, doctor memperingatkan dan tidak menimpanya dengan teks polos.
    - `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya ketika tidak ada SecretRef token yang dikonfigurasi.

  </Accordion>
  <Accordion title="12b. Perbaikan hanya-baca yang sadar SecretRef">
    Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku runtime gagal-cepat.

    - `openclaw doctor --fix` sekarang menggunakan model ringkasan SecretRef hanya-baca yang sama seperti perintah keluarga status untuk perbaikan konfigurasi yang ditargetkan.
    - Contoh: perbaikan Telegram `allowFrom` / `groupAllowFrom` `@username` mencoba menggunakan kredensial bot yang dikonfigurasi saat tersedia.
    - Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia di jalur perintah saat ini, doctor melaporkan bahwa kredensial tersebut dikonfigurasi-tetapi-tidak-tersedia dan melewati resolusi otomatis, bukan mengalami crash atau salah melaporkan token sebagai hilang.

  </Accordion>
  <Accordion title="13. Pemeriksaan kesehatan Gateway + mulai ulang">
    Doctor menjalankan pemeriksaan kesehatan dan menawarkan untuk memulai ulang gateway ketika tampak tidak sehat.
  </Accordion>
  <Accordion title="13b. Kesiapan pencarian memori">
    Doctor memeriksa apakah provider embedding pencarian memori yang dikonfigurasi siap untuk agen default. Perilakunya bergantung pada backend dan provider yang dikonfigurasi:

    - **Backend QMD**: memeriksa apakah binary `qmd` tersedia dan dapat dimulai. Jika tidak, mencetak panduan perbaikan termasuk paket npm dan opsi jalur binary manual.
    - **Provider lokal eksplisit**: memeriksa file model lokal atau URL model jarak jauh/dapat diunduh yang dikenali. Jika tidak ada, menyarankan beralih ke provider jarak jauh.
    - **Provider jarak jauh eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa kunci API ada di environment atau penyimpanan autentikasi. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika hilang.
    - **Provider otomatis**: memeriksa ketersediaan model lokal terlebih dahulu, lalu mencoba setiap provider jarak jauh dalam urutan pemilihan otomatis.

    Ketika hasil probe gateway yang di-cache tersedia (gateway sehat pada saat pemeriksaan), doctor membandingkan hasilnya dengan konfigurasi yang terlihat oleh CLI dan mencatat setiap ketidaksesuaian. Doctor tidak memulai ping embedding baru pada jalur default; gunakan perintah status memori mendalam ketika Anda menginginkan pemeriksaan provider langsung.

    Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

  </Accordion>
  <Accordion title="14. Peringatan status channel">
    Jika gateway sehat, doctor menjalankan probe status channel dan melaporkan peringatan dengan saran perbaikan.
  </Accordion>
  <Accordion title="15. Audit + perbaikan konfigurasi supervisor">
    Doctor memeriksa konfigurasi supervisor yang terpasang (launchd/systemd/schtasks) untuk default yang hilang atau usang (misalnya, dependensi network-online systemd dan jeda mulai ulang). Ketika menemukan ketidaksesuaian, doctor merekomendasikan pembaruan dan dapat menulis ulang file layanan/tugas ke default saat ini.

    Catatan:

    - `openclaw doctor` meminta konfirmasi sebelum menulis ulang konfigurasi supervisor.
    - `openclaw doctor --yes` menerima prompt perbaikan default.
    - `openclaw doctor --repair` menerapkan perbaikan yang direkomendasikan tanpa prompt.
    - `openclaw doctor --repair --force` menimpa konfigurasi supervisor kustom.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` menjaga doctor tetap hanya-baca untuk siklus hidup layanan gateway. Doctor tetap melaporkan kesehatan layanan dan menjalankan perbaikan non-layanan, tetapi melewati pemasangan/mulai/mulai ulang/bootstrap layanan, penulisan ulang konfigurasi supervisor, dan pembersihan layanan lama karena supervisor eksternal memiliki siklus hidup tersebut.
    - Di Linux, doctor tidak menulis ulang metadata perintah/entrypoint saat unit gateway systemd yang cocok sedang aktif. Doctor juga mengabaikan unit mirip gateway tambahan non-legacy yang tidak aktif selama pemindaian layanan duplikat agar file layanan pendamping tidak membuat derau pembersihan.
    - Jika autentikasi token memerlukan token dan `gateway.auth.token` dikelola SecretRef, pemasangan/perbaikan layanan doctor memvalidasi SecretRef tetapi tidak menyimpan nilai token teks polos yang diselesaikan ke metadata environment layanan supervisor.
    - Doctor mendeteksi nilai environment layanan terkelola berbasis `.env`/SecretRef yang disematkan inline oleh pemasangan LaunchAgent, systemd, atau Windows Scheduled Task lama dan menulis ulang metadata layanan agar nilai tersebut dimuat dari sumber runtime, bukan dari definisi supervisor.
    - Doctor mendeteksi ketika perintah layanan masih mengunci `--port` lama setelah `gateway.port` berubah dan menulis ulang metadata layanan ke port saat ini.
    - Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi belum terselesaikan, doctor memblokir jalur pemasangan/perbaikan dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum disetel, doctor memblokir pemasangan/perbaikan sampai mode disetel secara eksplisit.
    - Untuk unit user-systemd Linux, pemeriksaan drift token doctor sekarang mencakup sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata autentikasi layanan.
    - Perbaikan layanan doctor menolak menulis ulang, menghentikan, atau memulai ulang layanan gateway dari binary OpenClaw lama ketika konfigurasi terakhir ditulis oleh versi yang lebih baru. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostik runtime + port Gateway">
    Doctor memeriksa runtime layanan (PID, status keluar terakhir) dan memperingatkan ketika layanan terpasang tetapi sebenarnya tidak berjalan. Doctor juga memeriksa bentrokan port pada port gateway (default `18789`) dan melaporkan kemungkinan penyebab (gateway sudah berjalan, tunnel SSH).
  </Accordion>
  <Accordion title="17. Praktik terbaik runtime Gateway">
    Doctor memperingatkan ketika layanan gateway berjalan di Bun atau jalur Node yang dikelola versi (`nvm`, `fnm`, `volta`, `asdf`, dll.). Channel WhatsApp + Telegram memerlukan Node, dan jalur pengelola versi dapat rusak setelah peningkatan karena layanan tidak memuat init shell Anda. Doctor menawarkan migrasi ke instalasi Node sistem saat tersedia (Homebrew/apt/choco).

    LaunchAgent macOS yang baru dipasang atau diperbaiki menggunakan PATH sistem kanonis (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) alih-alih menyalin PATH shell interaktif, sehingga binary sistem yang dikelola Homebrew tetap tersedia sementara direktori Volta, asdf, fnm, pnpm, dan pengelola versi lainnya tidak mengubah Node mana yang di-resolve oleh proses anak. Layanan Linux tetap mempertahankan root environment eksplisit (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) dan direktori user-bin yang stabil, tetapi direktori fallback pengelola versi yang ditebak hanya ditulis ke PATH layanan ketika direktori tersebut ada di disk.

  </Accordion>
  <Accordion title="18. Penulisan konfigurasi + metadata wizard">
    Doctor menyimpan setiap perubahan konfigurasi dan memberi cap metadata wizard untuk mencatat jalannya doctor.
  </Accordion>
  <Accordion title="19. Kiat workspace (cadangan + sistem memori)">
    Doctor menyarankan sistem memori workspace ketika belum ada dan mencetak kiat cadangan jika workspace belum berada di bawah git.

    Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap tentang struktur workspace dan cadangan git (GitHub atau GitLab privat direkomendasikan).

  </Accordion>
</AccordionGroup>

## Terkait

- [Runbook Gateway](/id/gateway)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
