---
read_when:
    - Menambahkan atau memodifikasi migrasi doctor
    - Memperkenalkan perubahan konfigurasi yang tidak kompatibel
sidebarTitle: Doctor
summary: 'Perintah doctor: pemeriksaan kesehatan, migrasi konfigurasi, dan langkah perbaikan'
title: Dokter
x-i18n:
    generated_at: "2026-05-07T13:17:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7826cb4f3e97e56b07a5ba3b1c61860b15d6831d29012a0a16fe8f5f7014d1d
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` adalah alat perbaikan + migrasi untuk OpenClaw. Alat ini memperbaiki config/state yang usang, memeriksa kesehatan, dan menyediakan langkah perbaikan yang dapat ditindaklanjuti.

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

    Jalankan tanpa prompt dan hanya terapkan migrasi aman (normalisasi config + pemindahan state di disk). Melewati tindakan restart/service/sandbox yang memerlukan konfirmasi manusia. Migrasi state lama berjalan otomatis saat terdeteksi.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Pindai service sistem untuk instalasi Gateway tambahan (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Jika Anda ingin meninjau perubahan sebelum menulis, buka file config terlebih dahulu:

```bash
cat ~/.openclaw/openclaw.json
```

## Yang dilakukannya (ringkasan)

<AccordionGroup>
  <Accordion title="Kesehatan, UI, dan pembaruan">
    - Pembaruan pra-jalan opsional untuk instalasi git (hanya interaktif).
    - Pemeriksaan kesegaran protokol UI (membangun ulang Control UI saat skema protokol lebih baru).
    - Pemeriksaan kesehatan + prompt restart.
    - Ringkasan status Skills (memenuhi syarat/hilang/diblokir) dan status plugin.

  </Accordion>
  <Accordion title="Config dan migrasi">
    - Normalisasi config untuk nilai lama.
    - Migrasi config Talk dari field `talk.*` datar lama ke `talk.provider` + `talk.providers.<provider>`.
    - Pemeriksaan migrasi browser untuk config ekstensi Chrome lama dan kesiapan MCP Chrome.
    - Peringatan override provider OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Peringatan shadowing OAuth Codex (`models.providers.openai-codex`).
    - Pemeriksaan prasyarat OAuth TLS untuk profil OAuth OpenAI Codex.
    - Peringatan allowlist Plugin/tool saat `plugins.allow` bersifat restriktif tetapi kebijakan tool masih meminta wildcard atau tool milik plugin.
    - Migrasi state lama di disk (sessions/agent dir/auth WhatsApp).
    - Migrasi key kontrak manifest plugin lama (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrasi store cron lama (`jobId`, `schedule.cron`, field delivery/payload tingkat atas, payload `provider`, job fallback webhook sederhana `notify: true`).
    - Migrasi runtime-policy agent lama ke `agents.defaults.agentRuntime` dan `agents.list[].agentRuntime`.
    - Pembersihan config plugin usang saat plugin diaktifkan; saat `plugins.enabled=false`, referensi plugin usang diperlakukan sebagai config containment inert dan dipertahankan.

  </Accordion>
  <Accordion title="State dan integritas">
    - Inspeksi file lock sesi dan pembersihan lock usang.
    - Perbaikan transkrip sesi untuk cabang prompt-rewrite duplikat yang dibuat oleh build 2026.4.24 terdampak.
    - Deteksi tombstone restart-recovery subagent yang macet, dengan dukungan `--fix` untuk menghapus flag recovery dibatalkan yang usang agar startup tidak terus memperlakukan child sebagai restart-aborted.
    - Pemeriksaan integritas state dan izin (sessions, transkrip, state dir).
    - Pemeriksaan izin file config (chmod 600) saat berjalan secara lokal.
    - Kesehatan auth model: memeriksa kedaluwarsa OAuth, dapat menyegarkan token yang akan kedaluwarsa, dan melaporkan state cooldown/dinonaktifkan auth-profile.
    - Deteksi dir workspace tambahan (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, service, dan supervisor">
    - Perbaikan image sandbox saat sandboxing diaktifkan.
    - Migrasi service lama dan deteksi Gateway tambahan.
    - Migrasi state lama channel Matrix (dalam mode `--fix` / `--repair`).
    - Pemeriksaan runtime Gateway (service terinstal tetapi tidak berjalan; label launchd cache).
    - Peringatan status channel (diprobe dari Gateway yang sedang berjalan).
    - Pemeriksaan izin khusus channel berada di bawah `openclaw channels capabilities`; misalnya, izin channel suara Discord diaudit dengan `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Pemeriksaan responsivitas WhatsApp untuk kesehatan event-loop Gateway yang terdegradasi dengan klien TUI lokal masih berjalan; `--fix` hanya menghentikan klien TUI lokal yang terverifikasi.
    - Perbaikan rute Codex untuk ref model `openai-codex/*` lama dalam model utama, fallback, override heartbeat/subagent/compaction, hooks, override model channel, dan pin rute sesi; `--fix` menulis ulang semuanya ke `openai/*` dan memilih `agentRuntime.id: "codex"` hanya ketika plugin Codex terinstal, diaktifkan, menyediakan harness `codex`, dan memiliki OAuth yang dapat digunakan. Jika tidak, ia memilih `agentRuntime.id: "pi"`.
    - Audit config supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
    - Pembersihan lingkungan proxy tertanam untuk service Gateway yang menangkap nilai shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` selama instalasi atau pembaruan.
    - Pemeriksaan praktik terbaik runtime Gateway (Node vs Bun, path version-manager).
    - Diagnostik benturan port Gateway (default `18789`).

  </Accordion>
  <Accordion title="Auth, keamanan, dan pairing">
    - Peringatan keamanan untuk kebijakan DM terbuka.
    - Pemeriksaan auth Gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada sumber token; tidak menimpa config SecretRef token).
    - Deteksi masalah pairing perangkat (permintaan pair pertama kali yang tertunda, upgrade role/scope yang tertunda, drift cache device-token lokal yang usang, dan drift auth paired-record).

  </Accordion>
  <Accordion title="Workspace dan shell">
    - Pemeriksaan systemd linger di Linux.
    - Pemeriksaan ukuran file bootstrap workspace (peringatan pemotongan/hampir batas untuk file konteks).
    - Pemeriksaan kesiapan Skills untuk agent default; melaporkan skill yang diizinkan dengan bin, env, config, atau persyaratan OS yang hilang, dan `--fix` dapat menonaktifkan skill yang tidak tersedia di `skills.entries`.
    - Pemeriksaan status penyelesaian shell dan auto-install/upgrade.
    - Pemeriksaan kesiapan provider embedding pencarian memori (model lokal, key API jarak jauh, atau binary QMD).
    - Pemeriksaan instalasi source (ketidakcocokan workspace pnpm, aset UI hilang, binary tsx hilang).
    - Menulis config yang diperbarui + metadata wizard.

  </Accordion>
</AccordionGroup>

## Backfill dan reset UI Dreams

Scene Dreams Control UI mencakup tindakan **Backfill**, **Reset**, dan **Clear Grounded** untuk workflow grounded dreaming. Tindakan ini menggunakan metode RPC bergaya doctor Gateway, tetapi **bukan** bagian dari perbaikan/migrasi CLI `openclaw doctor`.

Yang dilakukan:

- **Backfill** memindai file historis `memory/YYYY-MM-DD.md` di workspace aktif, menjalankan pass diari REM grounded, dan menulis entri backfill yang dapat dibalik ke `DREAMS.md`.
- **Reset** hanya menghapus entri diari backfill bertanda tersebut dari `DREAMS.md`.
- **Clear Grounded** hanya menghapus entri jangka pendek khusus grounded bertahap yang berasal dari replay historis dan belum mengakumulasi recall live atau dukungan harian.

Yang **tidak** dilakukannya sendiri:

- tidak mengedit `MEMORY.md`
- tidak menjalankan migrasi doctor penuh
- tidak secara otomatis men-stage kandidat grounded ke store promosi jangka pendek live kecuali Anda secara eksplisit menjalankan path CLI bertahap terlebih dahulu

Jika Anda ingin replay historis grounded memengaruhi lane promosi mendalam normal, gunakan flow CLI sebagai gantinya:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Itu men-stage kandidat durable grounded ke store dreaming jangka pendek sambil menjaga `DREAMS.md` sebagai permukaan peninjauan.

## Perilaku terperinci dan alasan

<AccordionGroup>
  <Accordion title="0. Pembaruan opsional (instalasi git)">
    Jika ini adalah checkout git dan doctor berjalan secara interaktif, ia menawarkan pembaruan (fetch/rebase/build) sebelum menjalankan doctor.
  </Accordion>
  <Accordion title="1. Normalisasi config">
    Jika config berisi bentuk nilai lama (misalnya `messages.ackReaction` tanpa override khusus channel), doctor menormalisasikannya ke skema saat ini.

    Itu mencakup field datar Talk lama. Config speech Talk publik saat ini adalah `talk.provider` + `talk.providers.<provider>`, dan config voice realtime adalah `talk.realtime.*`. Doctor menulis ulang bentuk lama `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ke map provider, dan menulis ulang selector realtime tingkat atas lama (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) ke `talk.realtime`.

    Doctor juga memperingatkan saat `plugins.allow` tidak kosong dan kebijakan tool menggunakan
    entri tool wildcard atau milik plugin. `tools.allow: ["*"]` hanya cocok dengan tool
    dari plugin yang benar-benar dimuat; itu tidak melewati allowlist plugin eksklusif.
    Doctor menulis `plugins.bundledDiscovery: "compat"` untuk config allowlist lama yang dimigrasikan
    demi mempertahankan perilaku provider bundel yang ada, lalu
    menunjuk ke pengaturan `"allowlist"` yang lebih ketat.

  </Accordion>
  <Accordion title="2. Migrasi key config lama">
    Saat config berisi key yang sudah usang, perintah lain menolak berjalan dan meminta Anda menjalankan `openclaw doctor`.

    Doctor akan:

    - Menjelaskan key lama mana yang ditemukan.
    - Menampilkan migrasi yang diterapkan.
    - Menulis ulang `~/.openclaw/openclaw.json` dengan skema yang diperbarui.

    Startup Gateway menolak format config lama dan meminta Anda menjalankan `openclaw doctor --fix`; ia tidak menulis ulang `openclaw.json` saat startup. Migrasi store job Cron juga ditangani oleh `openclaw doctor --fix`.

    Migrasi saat ini:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - konfigurasi configured-channel yang tidak memiliki kebijakan balasan terlihat → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` tingkat atas
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` lama → `talk.provider` + `talk.providers.<provider>`
    - pemilih Talk realtime tingkat atas lama (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Untuk channel dengan `accounts` bernama tetapi masih memiliki nilai channel tingkat atas akun tunggal, pindahkan nilai yang tercakup akun tersebut ke akun yang dipromosikan dan dipilih untuk channel itu (`accounts.default` untuk sebagian besar channel; Matrix dapat mempertahankan target bernama/default cocok yang sudah ada)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - hapus `agents.defaults.llm`; gunakan `models.providers.<id>.timeoutSeconds` untuk timeout penyedia/model yang lambat
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - hapus `browser.relayBindHost` (pengaturan relay ekstensi lama)
    - `models.providers.*.api: "openai"` lama → `"openai-completions"` (startup Gateway juga melewati penyedia yang `api`-nya diatur ke nilai enum masa depan atau tidak dikenal, bukan gagal tertutup)

    Peringatan doctor juga mencakup panduan default akun untuk channel multi-akun:

    - Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa routing fallback dapat memilih akun yang tidak terduga.
    - Jika `channels.<channel>.defaultAccount` diatur ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

  </Accordion>
  <Accordion title="2b. Penggantian penyedia OpenCode">
    Jika Anda telah menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go` secara manual, itu akan menggantikan katalog OpenCode bawaan dari `@mariozechner/pi-ai`. Hal itu dapat memaksa model ke API yang salah atau mengosongkan biaya. Doctor memperingatkan agar Anda dapat menghapus penggantian tersebut dan memulihkan routing API per model + biaya.
  </Accordion>
  <Accordion title="2c. Migrasi browser dan kesiapan Chrome MCP">
    Jika konfigurasi browser Anda masih mengarah ke jalur ekstensi Chrome yang telah dihapus, doctor menormalkannya ke model attach Chrome MCP host-lokal saat ini:

    - `browser.profiles.*.driver: "extension"` menjadi `"existing-session"`
    - `browser.relayBindHost` dihapus

    Doctor juga mengaudit jalur Chrome MCP host-lokal saat Anda menggunakan `defaultProfile: "user"` atau profil `existing-session` yang dikonfigurasi:

    - memeriksa apakah Google Chrome terpasang di host yang sama untuk profil auto-connect default
    - memeriksa versi Chrome yang terdeteksi dan memperingatkan saat versinya di bawah Chrome 144
    - mengingatkan Anda untuk mengaktifkan debugging jarak jauh di halaman inspeksi browser (misalnya `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, atau `edge://inspect/#remote-debugging`)

    Doctor tidak dapat mengaktifkan pengaturan sisi Chrome untuk Anda. Chrome MCP host-lokal tetap memerlukan:

    - browser berbasis Chromium 144+ di host gateway/node
    - browser berjalan secara lokal
    - debugging jarak jauh diaktifkan di browser tersebut
    - menyetujui prompt persetujuan attach pertama di browser

    Kesiapan di sini hanya tentang prasyarat attach lokal. Existing-session mempertahankan batas rute Chrome MCP saat ini; rute lanjutan seperti `responsebody`, ekspor PDF, intersepsi unduhan, dan tindakan batch tetap memerlukan browser terkelola atau profil CDP mentah.

    Pemeriksaan ini **tidak** berlaku untuk Docker, sandbox, remote-browser, atau alur headless lainnya. Alur tersebut tetap menggunakan CDP mentah.

  </Accordion>
  <Accordion title="2d. Prasyarat OAuth TLS">
    Saat profil OpenAI Codex OAuth dikonfigurasi, doctor memeriksa endpoint otorisasi OpenAI untuk memastikan stack Node/OpenSSL TLS lokal dapat memvalidasi rantai sertifikat. Jika pemeriksaan gagal dengan kesalahan sertifikat (misalnya `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat self-signed), doctor mencetak panduan perbaikan khusus platform. Di macOS dengan Node Homebrew, perbaikannya biasanya `brew postinstall ca-certificates`. Dengan `--deep`, pemeriksaan berjalan meskipun gateway sehat.
  </Accordion>
  <Accordion title="2e. Penggantian penyedia Codex OAuth">
    Jika sebelumnya Anda menambahkan pengaturan transport OpenAI lama di bawah `models.providers.openai-codex`, pengaturan itu dapat membayangi jalur penyedia Codex OAuth bawaan yang digunakan otomatis oleh rilis yang lebih baru. Doctor memperingatkan saat melihat pengaturan transport lama tersebut bersama Codex OAuth agar Anda dapat menghapus atau menulis ulang penggantian transport yang usang dan mendapatkan kembali perilaku routing/fallback bawaan. Proxy khusus dan penggantian khusus header tetap didukung dan tidak memicu peringatan ini.
  </Accordion>
  <Accordion title="2f. Perbaikan rute Codex">
    Doctor memeriksa ref model `openai-codex/*` lama. Routing harness Codex native menggunakan ref model kanonis `openai/*`; giliran agen OpenAI melewati harness app-server Codex, bukan jalur OpenClaw PI OpenAI.

    Dalam mode `--fix` / `--repair`, doctor menulis ulang ref default-agent dan per-agent yang terdampak, termasuk model primer, fallback, penggantian heartbeat/subagent/compaction, hook, penggantian model channel, dan status rute sesi tersimpan yang usang:

    - `openai-codex/gpt-*` menjadi `openai/gpt-*`.
    - Runtime agen yang cocok menjadi `agentRuntime.id: "codex"` hanya jika Codex terpasang, diaktifkan, menyumbangkan harness `codex`, dan memiliki OAuth yang dapat digunakan.
    - Jika tidak, runtime agen yang cocok menjadi `agentRuntime.id: "pi"`.
    - Daftar fallback model yang ada dipertahankan dengan entri lamanya ditulis ulang; pengaturan per-model yang disalin dipindahkan dari kunci lama ke kunci kanonis `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, pemberitahuan fallback, pin auth-profile, dan pin harness Codex sesi tersimpan diperbaiki di semua store sesi agen yang ditemukan.
    - `/codex ...` berarti "mengontrol atau mengikat percakapan Codex native dari chat."
    - `/acp ...` atau `runtime: "acp"` berarti "menggunakan adapter ACP/acpx eksternal."

  </Accordion>
  <Accordion title="2g. Pembersihan rute sesi">
    Doctor juga memindai store sesi agen yang ditemukan untuk status rute yang dibuat otomatis dan usang setelah Anda memindahkan model atau runtime yang dikonfigurasi dari rute milik Plugin seperti Codex.

    `openclaw doctor --fix` dapat menghapus status usang yang dibuat otomatis seperti pin model `modelOverrideSource: "auto"`, metadata model runtime, ID harness yang dipin, binding sesi CLI, dan penggantian auth-profile otomatis saat rute pemiliknya tidak lagi dikonfigurasi. Pilihan model sesi eksplisit pengguna atau lama dilaporkan untuk ditinjau manual dan dibiarkan apa adanya; alihkan dengan `/model ...`, `/new`, atau reset sesi saat rute tersebut tidak lagi dimaksudkan.

  </Accordion>
  <Accordion title="3. Migrasi status lama (tata letak disk)">
    Doctor dapat memigrasikan tata letak lama di disk ke struktur saat ini:

    - Store sesi + transkrip:
      - dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
    - Direktori agen:
      - dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
    - Status auth WhatsApp (Baileys):
      - dari `~/.openclaw/credentials/*.json` lama (kecuali `oauth.json`)
      - ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID akun default: `default`)

    Migrasi ini bersifat best-effort dan idempoten; doctor akan mengeluarkan peringatan saat meninggalkan folder lama sebagai cadangan. Gateway/CLI juga memigrasikan otomatis sesi lama + direktori agen saat startup sehingga riwayat/auth/model masuk ke jalur per-agen tanpa perlu menjalankan doctor manual. Normalisasi penyedia/peta-penyedia Talk kini membandingkan berdasarkan kesetaraan struktural, sehingga diff yang hanya berbeda urutan kunci tidak lagi memicu perubahan `doctor --fix` no-op berulang.

  </Accordion>
  <Accordion title="3a. Migrasi manifes Plugin lama">
    Doctor memindai semua manifes Plugin yang terpasang untuk kunci kapabilitas tingkat atas yang sudah tidak digunakan (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Saat ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts` dan menulis ulang file manifes di tempat. Migrasi ini idempoten; jika kunci `contracts` sudah memiliki nilai yang sama, kunci lama dihapus tanpa menduplikasi data.
  </Accordion>
  <Accordion title="3b. Migrasi store Cron lama">
    Doctor juga memeriksa store pekerjaan cron (`~/.openclaw/cron/jobs.json` secara default, atau `cron.store` saat diganti) untuk bentuk pekerjaan lama yang masih diterima scheduler demi kompatibilitas.

    Pembersihan cron saat ini mencakup:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - bidang payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
    - bidang pengiriman tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias pengiriman `provider` payload → `delivery.channel` eksplisit
    - pekerjaan fallback webhook `notify: true` sederhana lama → `delivery.mode="webhook"` eksplisit dengan `delivery.to=cron.webhook`

    Doctor hanya memigrasikan otomatis job `notify: true` ketika dapat melakukannya tanpa mengubah perilaku. Jika sebuah job menggabungkan fallback notify lama dengan mode pengiriman non-webhook yang sudah ada, doctor memperingatkan dan membiarkan job tersebut untuk ditinjau manual.

    Di Linux, doctor juga memperingatkan ketika crontab pengguna masih menjalankan `~/.openclaw/bin/ensure-whatsapp.sh` lama. Skrip host-local itu tidak dipelihara oleh OpenClaw saat ini dan dapat menulis pesan `Gateway inactive` palsu ke `~/.openclaw/logs/whatsapp-health.log` ketika cron tidak dapat menjangkau bus pengguna systemd. Hapus entri crontab usang dengan `crontab -e`; gunakan `openclaw channels status --probe`, `openclaw doctor`, dan `openclaw gateway status` untuk pemeriksaan kesehatan saat ini.

  </Accordion>
  <Accordion title="3c. Pembersihan kunci sesi">
    Doctor memindai setiap direktori sesi agent untuk file write-lock usang — file yang tertinggal ketika sesi keluar secara tidak normal. Untuk setiap file kunci yang ditemukan, ia melaporkan: path, PID, apakah PID masih hidup, usia kunci, dan apakah dianggap usang (PID mati atau lebih lama dari 30 menit). Dalam mode `--fix` / `--repair`, ia menghapus file kunci usang secara otomatis; jika tidak, ia mencetak catatan dan menginstruksikan Anda untuk menjalankan ulang dengan `--fix`.
  </Accordion>
  <Accordion title="3d. Perbaikan cabang transkrip sesi">
    Doctor memindai file JSONL sesi agent untuk bentuk cabang duplikat yang dibuat oleh bug penulisan ulang transkrip prompt 2026.4.24: giliran pengguna yang ditinggalkan dengan konteks runtime internal OpenClaw ditambah sibling aktif yang berisi prompt pengguna terlihat yang sama. Dalam mode `--fix` / `--repair`, doctor mencadangkan setiap file yang terdampak di sebelah file asli dan menulis ulang transkrip ke cabang aktif sehingga riwayat gateway dan pembaca memori tidak lagi melihat giliran duplikat.
  </Accordion>
  <Accordion title="4. Pemeriksaan integritas state (persistensi sesi, routing, dan keamanan)">
    Direktori state adalah pusat operasi. Jika hilang, Anda kehilangan sesi, kredensial, log, dan config (kecuali Anda memiliki cadangan di tempat lain).

    Doctor memeriksa:

    - **Direktori state hilang**: memperingatkan tentang kehilangan state yang katastropik, meminta untuk membuat ulang direktori, dan mengingatkan bahwa ia tidak dapat memulihkan data yang hilang.
    - **Izin direktori state**: memverifikasi kemampuan tulis; menawarkan untuk memperbaiki izin (dan mengeluarkan petunjuk `chown` ketika ketidakcocokan owner/group terdeteksi).
    - **Direktori state tersinkronisasi cloud macOS**: memperingatkan ketika state berada di bawah iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau `~/Library/CloudStorage/...` karena path berbasis sinkronisasi dapat menyebabkan I/O lebih lambat dan race kunci/sinkronisasi.
    - **Direktori state SD atau eMMC Linux**: memperingatkan ketika state berada pada sumber mount `mmcblk*`, karena I/O acak berbasis SD atau eMMC dapat lebih lambat dan lebih cepat aus akibat penulisan sesi dan kredensial.
    - **Direktori sesi hilang**: `sessions/` dan direktori penyimpanan sesi diperlukan untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
    - **Ketidakcocokan transkrip**: memperingatkan ketika entri sesi terbaru memiliki file transkrip yang hilang.
    - **Sesi utama "1-line JSONL"**: menandai ketika transkrip utama hanya memiliki satu baris (riwayat tidak terakumulasi).
    - **Beberapa direktori state**: memperingatkan ketika beberapa folder `~/.openclaw` ada di berbagai direktori home atau ketika `OPENCLAW_STATE_DIR` menunjuk ke tempat lain (riwayat dapat terpecah antarinstalasi).
    - **Pengingat mode remote**: jika `gateway.mode=remote`, doctor mengingatkan Anda untuk menjalankannya di host remote (state berada di sana).
    - **Izin file config**: memperingatkan jika `~/.openclaw/openclaw.json` dapat dibaca oleh group/world dan menawarkan untuk memperketat ke `600`.

  </Accordion>
  <Accordion title="5. Kesehatan auth model (kedaluwarsa OAuth)">
    Doctor memeriksa profil OAuth di penyimpanan auth, memperingatkan ketika token akan kedaluwarsa/sudah kedaluwarsa, dan dapat menyegarkannya ketika aman. Jika profil OAuth/token Anthropic sudah usang, ia menyarankan API key Anthropic atau path setup-token Anthropic. Prompt refresh hanya muncul ketika berjalan secara interaktif (TTY); `--non-interactive` melewati upaya refresh.

    Ketika refresh OAuth gagal permanen (misalnya `refresh_token_reused`, `invalid_grant`, atau provider meminta Anda masuk lagi), doctor melaporkan bahwa re-auth diperlukan dan mencetak perintah `openclaw models auth login --provider ...` persis yang harus dijalankan.

    Doctor juga melaporkan profil auth yang sementara tidak dapat digunakan karena:

    - cooldown singkat (rate limit/timeout/kegagalan auth)
    - penonaktifan lebih lama (kegagalan billing/credit)

  </Accordion>
  <Accordion title="6. Validasi model hooks">
    Jika `hooks.gmail.model` disetel, doctor memvalidasi referensi model terhadap katalog dan allowlist serta memperingatkan ketika referensi tidak dapat di-resolve atau tidak diizinkan.
  </Accordion>
  <Accordion title="7. Perbaikan image sandbox">
    Ketika sandboxing diaktifkan, doctor memeriksa image Docker dan menawarkan untuk membangun atau beralih ke nama lama jika image saat ini hilang.
  </Accordion>
  <Accordion title="7b. Pembersihan instalasi Plugin">
    Doctor menghapus state staging dependensi Plugin lama yang dihasilkan OpenClaw dalam mode `openclaw doctor --fix` / `openclaw doctor --repair`. Ini mencakup root dependensi hasil generate yang usang, direktori tahap instalasi lama, debris lokal paket dari kode perbaikan dependensi bundled-plugin sebelumnya, dan salinan npm terkelola dari Plugin `@openclaw/*` bundel yang yatim atau dipulihkan yang dapat membayangi manifest bundel saat ini.

    Doctor juga dapat menginstal ulang Plugin yang dapat diunduh yang hilang ketika config mereferensikannya tetapi registry Plugin lokal tidak dapat menemukannya. Contohnya meliputi `plugins.entries` material, pengaturan channel/provider/search yang dikonfigurasi, dan runtime agent yang dikonfigurasi. Selama pembaruan paket, doctor menghindari menjalankan perbaikan Plugin package-manager ketika paket core sedang ditukar; jalankan `openclaw doctor --fix` lagi setelah pembaruan jika Plugin yang dikonfigurasi masih memerlukan pemulihan. Startup Gateway dan reload config tidak menjalankan package manager; instalasi Plugin tetap merupakan pekerjaan doctor/install/update yang eksplisit.

  </Accordion>
  <Accordion title="8. Migrasi layanan Gateway dan petunjuk pembersihan">
    Doctor mendeteksi layanan gateway lama (launchd/systemd/schtasks) dan menawarkan untuk menghapusnya serta menginstal layanan OpenClaw menggunakan port gateway saat ini. Ia juga dapat memindai layanan tambahan yang mirip gateway dan mencetak petunjuk pembersihan. Layanan gateway OpenClaw bernama profil dianggap kelas utama dan tidak ditandai sebagai "extra."

    Di Linux, jika layanan gateway tingkat pengguna hilang tetapi layanan gateway OpenClaw tingkat sistem ada, doctor tidak menginstal layanan tingkat pengguna kedua secara otomatis. Periksa dengan `openclaw gateway status --deep` atau `openclaw doctor --deep`, lalu hapus duplikatnya atau setel `OPENCLAW_SERVICE_REPAIR_POLICY=external` ketika supervisor sistem memiliki siklus hidup gateway.

  </Accordion>
  <Accordion title="8b. Migrasi startup Matrix">
    Ketika akun channel Matrix memiliki migrasi state lama yang pending atau dapat ditindaklanjuti, doctor (dalam mode `--fix` / `--repair`) membuat snapshot pra-migrasi lalu menjalankan langkah migrasi best-effort: migrasi state Matrix lama dan persiapan encrypted-state lama. Kedua langkah tidak fatal; error dicatat dan startup berlanjut. Dalam mode read-only (`openclaw doctor` tanpa `--fix`) pemeriksaan ini dilewati sepenuhnya.
  </Accordion>
  <Accordion title="8c. Pairing perangkat dan drift auth">
    Doctor sekarang memeriksa state device-pairing sebagai bagian dari health pass normal.

    Yang dilaporkan:

    - permintaan pairing pertama kali yang pending
    - upgrade role yang pending untuk perangkat yang sudah dipair
    - upgrade scope yang pending untuk perangkat yang sudah dipair
    - perbaikan ketidakcocokan public-key ketika id perangkat masih cocok tetapi identitas perangkat tidak lagi cocok dengan record yang disetujui
    - record yang dipair tanpa token aktif untuk role yang disetujui
    - token yang dipair yang scope-nya drift di luar baseline pairing yang disetujui
    - entri device-token cache lokal untuk mesin saat ini yang lebih lama dari rotasi token sisi gateway atau membawa metadata scope usang

    Doctor tidak menyetujui otomatis permintaan pair atau merotasi otomatis token perangkat. Ia mencetak langkah berikutnya yang persis sebagai gantinya:

    - periksa permintaan pending dengan `openclaw devices list`
    - setujui permintaan persis dengan `openclaw devices approve <requestId>`
    - rotasi token baru dengan `openclaw devices rotate --device <deviceId> --role <role>`
    - hapus dan setujui ulang record usang dengan `openclaw devices remove <deviceId>`

    Ini menutup celah umum "sudah dipair tetapi masih mendapat pairing required": doctor sekarang membedakan pairing pertama kali dari upgrade role/scope pending dan dari drift token/identitas perangkat yang usang.

  </Accordion>
  <Accordion title="9. Peringatan keamanan">
    Doctor mengeluarkan peringatan ketika provider terbuka untuk DM tanpa allowlist, atau ketika policy dikonfigurasi dengan cara yang berbahaya.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jika berjalan sebagai layanan pengguna systemd, doctor memastikan lingering diaktifkan agar gateway tetap hidup setelah logout.
  </Accordion>
  <Accordion title="11. Status workspace (skills, plugins, dan direktori lama)">
    Doctor mencetak ringkasan state workspace untuk agent default:

    - **Status Skills**: menghitung skill yang eligible, missing-requirements, dan diblokir allowlist.
    - **Direktori workspace lama**: memperingatkan ketika `~/openclaw` atau direktori workspace lama lainnya ada berdampingan dengan workspace saat ini.
    - **Status Plugin**: menghitung Plugin yang enabled/disabled/errored; mencantumkan ID Plugin untuk setiap error; melaporkan kapabilitas Plugin bundel.
    - **Peringatan kompatibilitas Plugin**: menandai Plugin yang memiliki masalah kompatibilitas dengan runtime saat ini.
    - **Diagnostik Plugin**: menampilkan peringatan atau error waktu muat apa pun yang dikeluarkan oleh registry Plugin.

  </Accordion>
  <Accordion title="11b. Ukuran file bootstrap">
    Doctor memeriksa apakah file bootstrap workspace (misalnya `AGENTS.md`, `CLAUDE.md`, atau file konteks lain yang diinjeksikan) mendekati atau melebihi character budget yang dikonfigurasi. Ia melaporkan jumlah karakter mentah vs. terinjeksikan per file, persentase pemotongan, penyebab pemotongan (`max/file` atau `max/total`), dan total karakter terinjeksikan sebagai fraksi dari total budget. Ketika file dipotong atau mendekati batas, doctor mencetak tips untuk menyetel `agents.defaults.bootstrapMaxChars` dan `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pembersihan Plugin channel usang">
    Ketika `openclaw doctor --fix` menghapus Plugin channel yang hilang, ia juga menghapus config dangling berscope channel yang mereferensikan Plugin tersebut: entri `channels.<id>`, target Heartbeat yang menamai channel, dan override `agents.*.models["<channel>/*"]`. Ini mencegah loop boot Gateway ketika runtime channel sudah hilang tetapi config masih meminta gateway untuk bind ke sana.
  </Accordion>
  <Accordion title="11c. Shell completion">
    Doctor memeriksa apakah tab completion diinstal untuk shell saat ini (zsh, bash, fish, atau PowerShell):

    - Jika profil shell menggunakan pola completion dinamis yang lambat (`source <(openclaw completion ...)`), doctor meningkatkannya ke varian file cache yang lebih cepat.
    - Jika completion dikonfigurasi di profil tetapi file cache hilang, doctor membuat ulang cache secara otomatis.
    - Jika tidak ada completion yang dikonfigurasi sama sekali, doctor meminta untuk menginstalnya (hanya mode interaktif; dilewati dengan `--non-interactive`).

    Jalankan `openclaw completion --write-state` untuk membuat ulang cache secara manual.

  </Accordion>
  <Accordion title="12. Pemeriksaan auth Gateway (token lokal)">
    Doctor memeriksa kesiapan auth token gateway lokal.

    - Jika mode token membutuhkan token dan tidak ada sumber token, doctor menawarkan untuk membuatnya.
    - Jika `gateway.auth.token` dikelola SecretRef tetapi tidak tersedia, doctor memperingatkan dan tidak menimpanya dengan plaintext.
    - `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya ketika tidak ada SecretRef token yang dikonfigurasi.

  </Accordion>
  <Accordion title="12b. Perbaikan sadar SecretRef yang hanya-baca">
    Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku runtime gagal-cepat.

    - `openclaw doctor --fix` kini menggunakan model ringkasan SecretRef hanya-baca yang sama seperti perintah keluarga status untuk perbaikan konfigurasi tertarget.
    - Contoh: perbaikan Telegram `allowFrom` / `groupAllowFrom` `@username` mencoba menggunakan kredensial bot yang dikonfigurasi jika tersedia.
    - Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia di jalur perintah saat ini, doctor melaporkan bahwa kredensial dikonfigurasi-tetapi-tidak-tersedia dan melewati resolusi otomatis alih-alih crash atau salah melaporkan token sebagai hilang.

  </Accordion>
  <Accordion title="13. Pemeriksaan kesehatan Gateway + mulai ulang">
    Doctor menjalankan pemeriksaan kesehatan dan menawarkan untuk memulai ulang Gateway ketika tampaknya tidak sehat.
  </Accordion>
  <Accordion title="13b. Kesiapan pencarian memori">
    Doctor memeriksa apakah penyedia embedding pencarian memori yang dikonfigurasi siap untuk agen default. Perilakunya bergantung pada backend dan penyedia yang dikonfigurasi:

    - **Backend QMD**: memeriksa apakah biner `qmd` tersedia dan dapat dimulai. Jika tidak, mencetak panduan perbaikan termasuk paket npm dan opsi jalur biner manual.
    - **Penyedia lokal eksplisit**: memeriksa file model lokal atau URL model jarak jauh/dapat diunduh yang dikenali. Jika hilang, menyarankan untuk beralih ke penyedia jarak jauh.
    - **Penyedia jarak jauh eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa kunci API ada di lingkungan atau penyimpanan auth. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika hilang.
    - **Penyedia otomatis**: memeriksa ketersediaan model lokal terlebih dahulu, lalu mencoba setiap penyedia jarak jauh dalam urutan pemilihan otomatis.

    Ketika hasil probe Gateway yang di-cache tersedia (Gateway sehat pada saat pemeriksaan), doctor mencocokkan silang hasilnya dengan konfigurasi yang terlihat oleh CLI dan mencatat perbedaan apa pun. Doctor tidak memulai ping embedding baru pada jalur default; gunakan perintah status memori mendalam saat Anda menginginkan pemeriksaan penyedia langsung.

    Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

  </Accordion>
  <Accordion title="14. Peringatan status kanal">
    Jika Gateway sehat, doctor menjalankan probe status kanal dan melaporkan peringatan dengan perbaikan yang disarankan.
  </Accordion>
  <Accordion title="15. Audit konfigurasi supervisor + perbaikan">
    Doctor memeriksa konfigurasi supervisor yang terpasang (launchd/systemd/schtasks) untuk default yang hilang atau usang (misalnya, dependensi systemd network-online dan jeda mulai ulang). Ketika menemukan ketidaksesuaian, doctor merekomendasikan pembaruan dan dapat menulis ulang file layanan/tugas ke default saat ini.

    Catatan:

    - `openclaw doctor` meminta konfirmasi sebelum menulis ulang konfigurasi supervisor.
    - `openclaw doctor --yes` menerima prompt perbaikan default.
    - `openclaw doctor --repair` menerapkan perbaikan yang direkomendasikan tanpa prompt.
    - `openclaw doctor --repair --force` menimpa konfigurasi supervisor kustom.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` menjaga doctor tetap hanya-baca untuk siklus hidup layanan Gateway. Ini tetap melaporkan kesehatan layanan dan menjalankan perbaikan non-layanan, tetapi melewati pemasangan/mulai/mulai ulang/bootstrap layanan, penulisan ulang konfigurasi supervisor, dan pembersihan layanan lama karena supervisor eksternal memiliki siklus hidup tersebut.
    - Di Linux, doctor tidak menulis ulang metadata perintah/entrypoint saat unit Gateway systemd yang sesuai sedang aktif. Doctor juga mengabaikan unit tambahan non-legacy mirip Gateway yang tidak aktif selama pemindaian layanan duplikat sehingga file layanan pendamping tidak membuat kebisingan pembersihan.
    - Jika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, pemasangan/perbaikan layanan doctor memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang diselesaikan ke metadata lingkungan layanan supervisor.
    - Doctor mendeteksi nilai lingkungan layanan terkelola berbasis `.env`/SecretRef yang disematkan inline oleh pemasangan LaunchAgent, systemd, atau Windows Scheduled Task lama dan menulis ulang metadata layanan sehingga nilai tersebut dimuat dari sumber runtime alih-alih dari definisi supervisor.
    - Doctor mendeteksi ketika perintah layanan masih mematok `--port` lama setelah `gateway.port` berubah dan menulis ulang metadata layanan ke port saat ini.
    - Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi tidak terselesaikan, doctor memblokir jalur pemasangan/perbaikan dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum disetel, doctor memblokir pemasangan/perbaikan sampai mode disetel secara eksplisit.
    - Untuk unit user-systemd Linux, pemeriksaan penyimpangan token doctor kini mencakup sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata auth layanan.
    - Perbaikan layanan doctor menolak untuk menulis ulang, menghentikan, atau memulai ulang layanan Gateway dari biner OpenClaw yang lebih lama ketika konfigurasi terakhir ditulis oleh versi yang lebih baru. Lihat [pemecahan masalah Gateway](/id/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostik runtime + port Gateway">
    Doctor memeriksa runtime layanan (PID, status keluar terakhir) dan memperingatkan ketika layanan terpasang tetapi tidak benar-benar berjalan. Doctor juga memeriksa tabrakan port pada port Gateway (default `18789`) dan melaporkan kemungkinan penyebabnya (Gateway sudah berjalan, tunnel SSH).
  </Accordion>
  <Accordion title="17. Praktik terbaik runtime Gateway">
    Doctor memperingatkan ketika layanan Gateway berjalan di Bun atau jalur Node yang dikelola versi (`nvm`, `fnm`, `volta`, `asdf`, dll.). Kanal WhatsApp + Telegram memerlukan Node, dan jalur pengelola versi dapat rusak setelah peningkatan karena layanan tidak memuat init shell Anda. Doctor menawarkan migrasi ke pemasangan Node sistem jika tersedia (Homebrew/apt/choco).

    LaunchAgent macOS yang baru dipasang atau diperbaiki menggunakan PATH sistem kanonis (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) alih-alih menyalin PATH shell interaktif, sehingga direktori Volta, asdf, fnm, pnpm, dan pengelola versi lain tidak mengubah proses anak Node mana yang di-resolve. Layanan Linux tetap mempertahankan root lingkungan eksplisit (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) dan direktori user-bin stabil, tetapi direktori fallback pengelola versi yang ditebak hanya ditulis ke PATH layanan ketika direktori tersebut ada di disk.

  </Accordion>
  <Accordion title="18. Penulisan konfigurasi + metadata wizard">
    Doctor menyimpan perubahan konfigurasi apa pun dan membubuhkan metadata wizard untuk mencatat proses doctor.
  </Accordion>
  <Accordion title="19. Kiat workspace (cadangan + sistem memori)">
    Doctor menyarankan sistem memori workspace jika belum ada dan mencetak kiat cadangan jika workspace belum berada di bawah git.

    Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap tentang struktur workspace dan cadangan git (GitHub atau GitLab privat direkomendasikan).

  </Accordion>
</AccordionGroup>

## Terkait

- [Runbook Gateway](/id/gateway)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
