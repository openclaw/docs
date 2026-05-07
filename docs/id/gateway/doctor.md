---
read_when:
    - Menambahkan atau memodifikasi migrasi doctor
    - Memperkenalkan perubahan konfigurasi yang merusak kompatibilitas
sidebarTitle: Doctor
summary: 'Perintah doctor: pemeriksaan kesehatan, migrasi konfigurasi, dan langkah perbaikan'
title: Dokter
x-i18n:
    generated_at: "2026-05-07T01:52:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: d76a31a8f2197e226894f90fb534f53acf969b75ca1dfdf438a26059880e7ab2
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` adalah alat perbaikan + migrasi untuk OpenClaw. Alat ini memperbaiki konfigurasi/status usang, memeriksa kesehatan, dan menyediakan langkah perbaikan yang dapat ditindaklanjuti.

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

## Yang dilakukan (ringkasan)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - Pembaruan pra-jalan opsional untuk instalasi git (hanya interaktif).
    - Pemeriksaan kesegaran protokol UI (membangun ulang Control UI saat skema protokol lebih baru).
    - Pemeriksaan kesehatan + prompt restart.
    - Ringkasan status Skills (memenuhi syarat/hilang/diblokir) dan status plugin.

  </Accordion>
  <Accordion title="Config and migrations">
    - Normalisasi konfigurasi untuk nilai lama.
    - Migrasi konfigurasi Talk dari field datar lama `talk.*` ke `talk.provider` + `talk.providers.<provider>`.
    - Pemeriksaan migrasi browser untuk konfigurasi ekstensi Chrome lama dan kesiapan Chrome MCP.
    - Peringatan override penyedia OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Peringatan shadowing OAuth Codex (`models.providers.openai-codex`).
    - Pemeriksaan prasyarat TLS OAuth untuk profil OAuth OpenAI Codex.
    - Peringatan allowlist Plugin/alat saat `plugins.allow` bersifat restriktif tetapi kebijakan alat masih meminta wildcard atau alat milik plugin.
    - Migrasi status lama di disk (sessions/dir agen/auth WhatsApp).
    - Migrasi kunci kontrak manifes plugin lama (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrasi store cron lama (`jobId`, `schedule.cron`, field delivery/payload tingkat atas, payload `provider`, fallback job webhook sederhana `notify: true`).
    - Migrasi kebijakan runtime agen lama ke `agents.defaults.agentRuntime` dan `agents.list[].agentRuntime`.
    - Pembersihan konfigurasi plugin usang saat plugin diaktifkan; saat `plugins.enabled=false`, referensi plugin usang diperlakukan sebagai konfigurasi containment inert dan dipertahankan.

  </Accordion>
  <Accordion title="State and integrity">
    - Inspeksi file kunci sesi dan pembersihan kunci usang.
    - Perbaikan transkrip sesi untuk cabang prompt-rewrite duplikat yang dibuat oleh build 2026.4.24 yang terdampak.
    - Deteksi tombstone pemulihan-restart subagen yang macet, dengan dukungan `--fix` untuk menghapus flag pemulihan dibatalkan yang usang agar startup tidak terus memperlakukan child sebagai dibatalkan karena restart.
    - Pemeriksaan integritas status dan izin (sesi, transkrip, dir status).
    - Pemeriksaan izin file konfigurasi (chmod 600) saat berjalan secara lokal.
    - Kesehatan auth model: memeriksa kedaluwarsa OAuth, dapat menyegarkan token yang akan kedaluwarsa, dan melaporkan status cooldown/dinonaktifkan auth-profile.
    - Deteksi dir workspace tambahan (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Perbaikan image sandbox saat sandboxing diaktifkan.
    - Migrasi layanan lama dan deteksi gateway tambahan.
    - Migrasi status lama channel Matrix (dalam mode `--fix` / `--repair`).
    - Pemeriksaan runtime Gateway (layanan terpasang tetapi tidak berjalan; label launchd yang di-cache).
    - Peringatan status channel (diprobe dari gateway yang sedang berjalan).
    - Pemeriksaan responsivitas WhatsApp untuk kesehatan event-loop Gateway yang menurun dengan klien TUI lokal masih berjalan; `--fix` hanya menghentikan klien TUI lokal yang terverifikasi.
    - Perbaikan rute Codex untuk referensi model lama `openai-codex/*` dalam model utama, fallback, override heartbeat/subagen/compaction, hook, override model channel, dan pin rute sesi; `--fix` menulis ulangnya ke `openai/*` dan memilih `agentRuntime.id: "codex"` hanya saat plugin Codex terpasang, diaktifkan, menyumbangkan harness `codex`, dan memiliki OAuth yang dapat digunakan. Jika tidak, alat ini memilih `agentRuntime.id: "pi"`.
    - Audit konfigurasi supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
    - Pembersihan lingkungan proxy tertanam untuk layanan gateway yang menangkap nilai shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` selama instalasi atau pembaruan.
    - Pemeriksaan praktik terbaik runtime Gateway (Node vs Bun, path version-manager).
    - Diagnostik tabrakan port Gateway (default `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Peringatan keamanan untuk kebijakan DM terbuka.
    - Pemeriksaan auth Gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada sumber token; tidak menimpa konfigurasi token SecretRef).
    - Deteksi masalah pairing perangkat (permintaan pair pertama kali yang tertunda, upgrade peran/cakupan yang tertunda, drift cache token perangkat lokal yang usang, dan drift auth paired-record).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Pemeriksaan linger systemd di Linux.
    - Pemeriksaan ukuran file bootstrap workspace (peringatan terpotong/mendekati batas untuk file konteks).
    - Pemeriksaan kesiapan Skills untuk agen default; melaporkan skill yang diizinkan dengan bin, env, konfigurasi, atau persyaratan OS yang hilang, dan `--fix` dapat menonaktifkan skill yang tidak tersedia di `skills.entries`.
    - Pemeriksaan status shell completion dan pemasangan/upgrade otomatis.
    - Pemeriksaan kesiapan penyedia embedding pencarian memori (model lokal, kunci API jarak jauh, atau biner QMD).
    - Pemeriksaan instalasi sumber (ketidakcocokan workspace pnpm, aset UI hilang, biner tsx hilang).
    - Menulis konfigurasi yang diperbarui + metadata wizard.

  </Accordion>
</AccordionGroup>

## Backfill dan reset UI Dreams

Scene Dreams di Control UI menyertakan tindakan **Backfill**, **Reset**, dan **Clear Grounded** untuk alur kerja dreaming yang grounded. Tindakan ini menggunakan metode RPC bergaya doctor gateway, tetapi tindakan tersebut **bukan** bagian dari perbaikan/migrasi CLI `openclaw doctor`.

Yang dilakukan:

- **Backfill** memindai file historis `memory/YYYY-MM-DD.md` di workspace aktif, menjalankan pass grounded REM diary, dan menulis entri backfill yang dapat dibalik ke `DREAMS.md`.
- **Reset** hanya menghapus entri diary backfill bertanda tersebut dari `DREAMS.md`.
- **Clear Grounded** hanya menghapus entri jangka pendek staged yang khusus grounded yang berasal dari replay historis dan belum mengumpulkan recall live atau dukungan harian.

Yang **tidak** dilakukan sendiri:

- tindakan ini tidak mengedit `MEMORY.md`
- tindakan ini tidak menjalankan migrasi doctor penuh
- tindakan ini tidak otomatis men-stage kandidat grounded ke store promosi jangka pendek live kecuali Anda secara eksplisit menjalankan path CLI staged terlebih dahulu

Jika Anda ingin replay historis grounded memengaruhi jalur promosi mendalam normal, gunakan alur CLI sebagai gantinya:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Itu men-stage kandidat durable grounded ke store dreaming jangka pendek sambil mempertahankan `DREAMS.md` sebagai permukaan tinjauan.

## Perilaku terperinci dan alasan

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Jika ini adalah checkout git dan doctor berjalan secara interaktif, alat ini menawarkan pembaruan (fetch/rebase/build) sebelum menjalankan doctor.
  </Accordion>
  <Accordion title="1. Config normalization">
    Jika konfigurasi berisi bentuk nilai lama (misalnya `messages.ackReaction` tanpa override khusus channel), doctor menormalisasinya ke skema saat ini.

    Itu termasuk field datar Talk lama. Konfigurasi speech Talk publik saat ini adalah `talk.provider` + `talk.providers.<provider>`, dan konfigurasi voice realtime adalah `talk.realtime.*`. Doctor menulis ulang bentuk lama `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ke map penyedia, dan menulis ulang selector realtime tingkat atas lama (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) ke `talk.realtime`.

    Doctor juga memperingatkan saat `plugins.allow` tidak kosong dan kebijakan alat menggunakan
    wildcard atau entri alat milik plugin. `tools.allow: ["*"]` hanya cocok dengan alat
    dari plugin yang benar-benar dimuat; itu tidak melewati allowlist plugin eksklusif.
    Doctor menulis `plugins.bundledDiscovery: "compat"` untuk konfigurasi
    allowlist lama yang dimigrasikan guna mempertahankan perilaku penyedia bundled yang ada, lalu
    mengarah ke pengaturan `"allowlist"` yang lebih ketat.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Saat konfigurasi berisi kunci yang tidak digunakan lagi, perintah lain menolak berjalan dan meminta Anda menjalankan `openclaw doctor`.

    Doctor akan:

    - Menjelaskan kunci lama mana yang ditemukan.
    - Menampilkan migrasi yang diterapkan.
    - Menulis ulang `~/.openclaw/openclaw.json` dengan skema yang diperbarui.

    Startup Gateway menolak format konfigurasi lama dan meminta Anda menjalankan `openclaw doctor --fix`; startup tidak menulis ulang `openclaw.json`. Migrasi store job Cron juga ditangani oleh `openclaw doctor --fix`.

    Migrasi saat ini:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - konfigurasi saluran yang dikonfigurasi tanpa kebijakan balasan terlihat → `messages.groupChat.visibleReplies: "message_tool"`
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
    - Untuk saluran dengan `accounts` bernama tetapi masih memiliki nilai saluran tingkat atas akun tunggal lama, pindahkan nilai yang dicakup akun tersebut ke akun yang dipromosikan yang dipilih untuk saluran itu (`accounts.default` untuk sebagian besar saluran; Matrix dapat mempertahankan target bernama/default cocok yang sudah ada)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - hapus `agents.defaults.llm`; gunakan `models.providers.<id>.timeoutSeconds` untuk timeout penyedia/model yang lambat
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - hapus `browser.relayBindHost` (pengaturan relay extension lama)
    - `models.providers.*.api: "openai"` lama → `"openai-completions"` (startup Gateway juga melewati penyedia yang `api`-nya diatur ke nilai enum masa depan atau tidak dikenal, alih-alih gagal tertutup)

    Peringatan doctor juga menyertakan panduan default akun untuk saluran multi-akun:

    - Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa routing fallback dapat memilih akun yang tidak terduga.
    - Jika `channels.<channel>.defaultAccount` diatur ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

  </Accordion>
  <Accordion title="2b. Override penyedia OpenCode">
    Jika Anda menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go` secara manual, itu menimpa katalog OpenCode bawaan dari `@mariozechner/pi-ai`. Hal itu dapat memaksa model ke API yang salah atau mengosongkan biaya. Doctor memperingatkan agar Anda dapat menghapus override dan memulihkan routing API + biaya per model.
  </Accordion>
  <Accordion title="2c. Migrasi browser dan kesiapan Chrome MCP">
    Jika konfigurasi browser Anda masih menunjuk ke path Chrome extension yang telah dihapus, doctor menormalkannya ke model attach Chrome MCP host-lokal saat ini:

    - `browser.profiles.*.driver: "extension"` menjadi `"existing-session"`
    - `browser.relayBindHost` dihapus

    Doctor juga mengaudit path Chrome MCP host-lokal saat Anda menggunakan `defaultProfile: "user"` atau profil `existing-session` yang dikonfigurasi:

    - memeriksa apakah Google Chrome terinstal di host yang sama untuk profil auto-connect default
    - memeriksa versi Chrome yang terdeteksi dan memperingatkan saat versinya di bawah Chrome 144
    - mengingatkan Anda untuk mengaktifkan remote debugging di halaman inspect browser (misalnya `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, atau `edge://inspect/#remote-debugging`)

    Doctor tidak dapat mengaktifkan pengaturan sisi Chrome untuk Anda. Chrome MCP host-lokal tetap memerlukan:

    - browser berbasis Chromium 144+ pada host gateway/node
    - browser berjalan secara lokal
    - remote debugging diaktifkan di browser tersebut
    - menyetujui prompt persetujuan attach pertama di browser

    Kesiapan di sini hanya tentang prasyarat attach lokal. Existing-session mempertahankan batas rute Chrome MCP saat ini; rute lanjutan seperti `responsebody`, ekspor PDF, intersepsi unduhan, dan aksi batch masih memerlukan browser terkelola atau profil CDP mentah.

    Pemeriksaan ini **tidak** berlaku untuk Docker, sandbox, remote-browser, atau flow headless lainnya. Semua itu tetap menggunakan CDP mentah.

  </Accordion>
  <Accordion title="2d. Prasyarat TLS OAuth">
    Saat profil OpenAI Codex OAuth dikonfigurasi, doctor memeriksa endpoint otorisasi OpenAI untuk memverifikasi bahwa stack TLS Node/OpenSSL lokal dapat memvalidasi rantai sertifikat. Jika pemeriksaan gagal dengan error sertifikat (misalnya `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat self-signed), doctor mencetak panduan perbaikan khusus platform. Di macOS dengan Node Homebrew, perbaikannya biasanya `brew postinstall ca-certificates`. Dengan `--deep`, pemeriksaan berjalan meskipun gateway sehat.
  </Accordion>
  <Accordion title="2e. Override penyedia Codex OAuth">
    Jika sebelumnya Anda menambahkan pengaturan transport OpenAI lama di bawah `models.providers.openai-codex`, pengaturan tersebut dapat membayangi path penyedia Codex OAuth bawaan yang digunakan otomatis oleh rilis yang lebih baru. Doctor memperingatkan saat melihat pengaturan transport lama tersebut bersama Codex OAuth agar Anda dapat menghapus atau menulis ulang override transport usang dan mengembalikan perilaku routing/fallback bawaan. Proxy kustom dan override khusus header tetap didukung dan tidak memicu peringatan ini.
  </Accordion>
  <Accordion title="2f. Perbaikan rute Codex">
    Doctor memeriksa referensi model `openai-codex/*` lama. Routing harness Codex native menggunakan referensi model `openai/*` kanonis plus `agentRuntime.id: "codex"` sehingga turn melewati harness app-server Codex, bukan path OpenClaw PI OpenAI.

    Dalam mode `--fix` / `--repair`, doctor menulis ulang referensi default-agent dan per-agent yang terpengaruh, termasuk model utama, fallback, override heartbeat/subagent/compaction, hook, override model saluran, dan status rute sesi tersimpan yang usang:

    - `openai-codex/gpt-*` menjadi `openai/gpt-*`.
    - Runtime agen yang cocok menjadi `agentRuntime.id: "codex"` hanya saat Codex terinstal, diaktifkan, menyumbangkan harness `codex`, dan memiliki OAuth yang dapat digunakan.
    - Jika tidak, runtime agen yang cocok menjadi `agentRuntime.id: "pi"`.
    - Daftar fallback model yang ada dipertahankan dengan entri lama ditulis ulang; pengaturan per-model yang disalin berpindah dari kunci lama ke kunci `openai/*` kanonis.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, pemberitahuan fallback, pin auth-profile, dan pin harness Codex tersimpan diperbaiki di semua penyimpanan sesi agen yang ditemukan.
    - `/codex ...` berarti "mengontrol atau mengikat percakapan Codex native dari chat."
    - `/acp ...` atau `runtime: "acp"` berarti "menggunakan adaptor ACP/acpx eksternal."

  </Accordion>
  <Accordion title="2g. Pembersihan rute sesi">
    Doctor juga memindai penyimpanan sesi agen yang ditemukan untuk status rute auto-created yang usang setelah Anda memindahkan model atau runtime yang dikonfigurasi dari rute milik Plugin seperti Codex.

    `openclaw doctor --fix` dapat membersihkan status usang auto-created seperti pin model `modelOverrideSource: "auto"`, metadata model runtime, ID harness yang dipin, binding sesi CLI, dan override auth-profile otomatis saat rute pemiliknya tidak lagi dikonfigurasi. Pilihan model sesi eksplisit pengguna atau lama dilaporkan untuk ditinjau manual dan dibiarkan tidak tersentuh; ganti dengan `/model ...`, `/new`, atau reset sesi saat rute tersebut tidak lagi dimaksudkan.

  </Accordion>
  <Accordion title="3. Migrasi status lama (tata letak disk)">
    Doctor dapat memigrasikan tata letak di disk lama ke struktur saat ini:

    - Penyimpanan sesi + transkrip:
      - dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
    - Direktori agen:
      - dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
    - Status auth WhatsApp (Baileys):
      - dari `~/.openclaw/credentials/*.json` lama (kecuali `oauth.json`)
      - ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (id akun default: `default`)

    Migrasi ini bersifat best-effort dan idempoten; doctor akan memancarkan peringatan saat meninggalkan folder lama apa pun sebagai cadangan. Gateway/CLI juga otomatis memigrasikan sesi lama + direktori agen saat startup sehingga riwayat/auth/model mendarat di path per-agent tanpa perlu menjalankan doctor manual. Normalisasi provider/provider-map Talk sekarang membandingkan berdasarkan kesetaraan struktural, sehingga diff yang hanya berupa urutan kunci tidak lagi memicu perubahan `doctor --fix` no-op berulang.

  </Accordion>
  <Accordion title="3a. Migrasi manifest Plugin lama">
    Doctor memindai semua manifest Plugin yang terinstal untuk kunci kapabilitas tingkat atas yang sudah tidak digunakan (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Saat ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts` dan menulis ulang file manifest di tempat. Migrasi ini idempoten; jika kunci `contracts` sudah memiliki nilai yang sama, kunci lama dihapus tanpa menduplikasi data.
  </Accordion>
  <Accordion title="3b. Migrasi penyimpanan cron lama">
    Doctor juga memeriksa penyimpanan job cron (`~/.openclaw/cron/jobs.json` secara default, atau `cron.store` saat dioverride) untuk bentuk job lama yang masih diterima scheduler demi kompatibilitas.

    Pembersihan cron saat ini meliputi:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - field payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
    - field pengiriman tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias pengiriman `provider` payload → `delivery.channel` eksplisit
    - sentinel `payload.model` cron tersimpan yang tidak valid (`"default"`, `"null"`, string kosong, JSON `null`) → override model dihapus
    - job fallback webhook `notify: true` lama yang sederhana → `delivery.mode="webhook"` eksplisit dengan `delivery.to=cron.webhook`

    Doctor hanya melakukan migrasi otomatis pada pekerjaan `notify: true` jika dapat melakukannya tanpa mengubah perilaku. Jika sebuah pekerjaan menggabungkan fallback notify lama dengan mode pengiriman non-webhook yang sudah ada, doctor memberi peringatan dan membiarkan pekerjaan itu untuk ditinjau secara manual.

    Di Linux, doctor juga memberi peringatan ketika crontab pengguna masih menjalankan `~/.openclaw/bin/ensure-whatsapp.sh` lama. Skrip lokal-host itu tidak dipelihara oleh OpenClaw saat ini dan dapat menulis pesan `Gateway inactive` palsu ke `~/.openclaw/logs/whatsapp-health.log` ketika cron tidak dapat menjangkau bus pengguna systemd. Hapus entri crontab usang dengan `crontab -e`; gunakan `openclaw channels status --probe`, `openclaw doctor`, dan `openclaw gateway status` untuk pemeriksaan kesehatan saat ini.

  </Accordion>
  <Accordion title="3c. Pembersihan kunci sesi">
    Doctor memindai setiap direktori sesi agen untuk menemukan file write-lock usang — file yang tertinggal ketika sebuah sesi keluar secara tidak normal. Untuk setiap file kunci yang ditemukan, doctor melaporkan: path, PID, apakah PID masih hidup, usia kunci, dan apakah dianggap usang (PID mati atau lebih lama dari 30 menit). Dalam mode `--fix` / `--repair`, doctor menghapus file kunci usang secara otomatis; jika tidak, doctor mencetak catatan dan menginstruksikan Anda untuk menjalankan ulang dengan `--fix`.
  </Accordion>
  <Accordion title="3d. Perbaikan cabang transkrip sesi">
    Doctor memindai file JSONL sesi agen untuk bentuk cabang duplikat yang dibuat oleh bug penulisan ulang transkrip prompt 2026.4.24: satu giliran pengguna yang ditinggalkan dengan konteks runtime internal OpenClaw plus sibling aktif yang berisi prompt pengguna terlihat yang sama. Dalam mode `--fix` / `--repair`, doctor mencadangkan setiap file terdampak di sebelah file asli dan menulis ulang transkrip ke cabang aktif sehingga riwayat gateway dan pembaca memori tidak lagi melihat giliran duplikat.
  </Accordion>
  <Accordion title="4. Pemeriksaan integritas status (persistensi sesi, perutean, dan keamanan)">
    Direktori status adalah pusat kendali operasional. Jika hilang, Anda kehilangan sesi, kredensial, log, dan konfigurasi (kecuali Anda memiliki cadangan di tempat lain).

    Doctor memeriksa:

    - **Direktori status hilang**: memperingatkan tentang hilangnya status secara fatal, meminta untuk membuat ulang direktori, dan mengingatkan bahwa doctor tidak dapat memulihkan data yang hilang.
    - **Izin direktori status**: memverifikasi kemampuan tulis; menawarkan untuk memperbaiki izin (dan mengeluarkan petunjuk `chown` ketika ketidakcocokan pemilik/grup terdeteksi).
    - **Direktori status tersinkron cloud macOS**: memperingatkan ketika status mengarah ke bawah iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau `~/Library/CloudStorage/...` karena path yang didukung sinkronisasi dapat menyebabkan I/O lebih lambat dan race kunci/sinkronisasi.
    - **Direktori status SD atau eMMC Linux**: memperingatkan ketika status mengarah ke sumber mount `mmcblk*`, karena I/O acak berbasis SD atau eMMC dapat lebih lambat dan lebih cepat aus saat penulisan sesi dan kredensial.
    - **Direktori sesi hilang**: `sessions/` dan direktori penyimpanan sesi diperlukan untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
    - **Ketidakcocokan transkrip**: memperingatkan ketika entri sesi terbaru memiliki file transkrip yang hilang.
    - **Sesi utama "JSONL 1 baris"**: menandai ketika transkrip utama hanya memiliki satu baris (riwayat tidak bertambah).
    - **Beberapa direktori status**: memperingatkan ketika beberapa folder `~/.openclaw` ada di berbagai direktori home atau ketika `OPENCLAW_STATE_DIR` menunjuk ke tempat lain (riwayat dapat terbagi antar instalasi).
    - **Pengingat mode jarak jauh**: jika `gateway.mode=remote`, doctor mengingatkan Anda untuk menjalankannya di host jarak jauh (status berada di sana).
    - **Izin file konfigurasi**: memperingatkan jika `~/.openclaw/openclaw.json` dapat dibaca oleh grup/dunia dan menawarkan untuk memperketatnya ke `600`.

  </Accordion>
  <Accordion title="5. Kesehatan autentikasi model (kedaluwarsa OAuth)">
    Doctor memeriksa profil OAuth di penyimpanan autentikasi, memperingatkan ketika token akan kedaluwarsa/sudah kedaluwarsa, dan dapat menyegarkannya ketika aman. Jika profil OAuth/token Anthropic sudah usang, doctor menyarankan kunci API Anthropic atau path setup-token Anthropic. Prompt penyegaran hanya muncul saat berjalan secara interaktif (TTY); `--non-interactive` melewati upaya penyegaran.

    Ketika penyegaran OAuth gagal permanen (misalnya `refresh_token_reused`, `invalid_grant`, atau penyedia meminta Anda masuk lagi), doctor melaporkan bahwa autentikasi ulang diperlukan dan mencetak perintah `openclaw models auth login --provider ...` persis yang harus dijalankan.

    Doctor juga melaporkan profil autentikasi yang sementara tidak dapat digunakan karena:

    - cooldown singkat (batas laju/timeout/kegagalan autentikasi)
    - penonaktifan lebih lama (kegagalan penagihan/kredit)

  </Accordion>
  <Accordion title="6. Validasi model hook">
    Jika `hooks.gmail.model` disetel, doctor memvalidasi referensi model terhadap katalog dan allowlist serta memperingatkan ketika referensi tidak dapat diselesaikan atau tidak diizinkan.
  </Accordion>
  <Accordion title="7. Perbaikan image sandbox">
    Ketika sandboxing diaktifkan, doctor memeriksa image Docker dan menawarkan untuk membangun atau beralih ke nama lama jika image saat ini hilang.
  </Accordion>
  <Accordion title="7b. Pembersihan instalasi Plugin">
    Doctor menghapus status staging dependensi Plugin lama yang dibuat OpenClaw dalam mode `openclaw doctor --fix` / `openclaw doctor --repair`. Ini mencakup root dependensi hasil generasi yang usang, direktori tahap instalasi lama, sisa paket lokal dari kode perbaikan dependensi bundled-plugin sebelumnya, serta salinan npm terkelola dari Plugin `@openclaw/*` bawaan yang yatim atau dipulihkan yang dapat membayangi manifes bawaan saat ini.

    Doctor juga dapat menginstal ulang Plugin yang dapat diunduh yang hilang ketika konfigurasi merujuknya tetapi registry Plugin lokal tidak dapat menemukannya. Contohnya mencakup `plugins.entries` material, pengaturan channel/provider/search yang dikonfigurasi, dan runtime agen yang dikonfigurasi. Selama pembaruan paket, doctor menghindari menjalankan perbaikan Plugin package-manager saat paket inti sedang ditukar; jalankan `openclaw doctor --fix` lagi setelah pembaruan jika Plugin yang dikonfigurasi masih perlu dipulihkan. Startup Gateway dan pemuatan ulang konfigurasi tidak menjalankan package manager; instalasi Plugin tetap merupakan pekerjaan eksplisit doctor/install/update.

  </Accordion>
  <Accordion title="8. Migrasi layanan Gateway dan petunjuk pembersihan">
    Doctor mendeteksi layanan gateway lama (launchd/systemd/schtasks) dan menawarkan untuk menghapusnya serta memasang layanan OpenClaw menggunakan port gateway saat ini. Doctor juga dapat memindai layanan tambahan yang mirip gateway dan mencetak petunjuk pembersihan. Layanan gateway OpenClaw bernama profil dianggap kelas utama dan tidak ditandai sebagai "tambahan."

    Di Linux, jika layanan gateway tingkat pengguna hilang tetapi layanan gateway OpenClaw tingkat sistem ada, doctor tidak otomatis memasang layanan tingkat pengguna kedua. Periksa dengan `openclaw gateway status --deep` atau `openclaw doctor --deep`, lalu hapus duplikatnya atau setel `OPENCLAW_SERVICE_REPAIR_POLICY=external` ketika supervisor sistem memiliki siklus hidup gateway.

  </Accordion>
  <Accordion title="8b. Migrasi Startup Matrix">
    Ketika akun channel Matrix memiliki migrasi status lama yang tertunda atau dapat ditindaklanjuti, doctor (dalam mode `--fix` / `--repair`) membuat snapshot pra-migrasi lalu menjalankan langkah migrasi upaya terbaik: migrasi status Matrix lama dan persiapan status terenkripsi lama. Kedua langkah bersifat non-fatal; kesalahan dicatat dan startup berlanjut. Dalam mode hanya-baca (`openclaw doctor` tanpa `--fix`), pemeriksaan ini dilewati seluruhnya.
  </Accordion>
  <Accordion title="8c. Pairing perangkat dan drift autentikasi">
    Doctor sekarang memeriksa status pairing perangkat sebagai bagian dari pemeriksaan kesehatan normal.

    Yang dilaporkan:

    - permintaan pairing pertama kali yang tertunda
    - peningkatan peran tertunda untuk perangkat yang sudah dipairing
    - peningkatan cakupan tertunda untuk perangkat yang sudah dipairing
    - perbaikan ketidakcocokan kunci publik ketika id perangkat masih cocok tetapi identitas perangkat tidak lagi cocok dengan catatan yang disetujui
    - catatan pairing yang tidak memiliki token aktif untuk peran yang disetujui
    - token pairing yang cakupannya drift keluar dari baseline pairing yang disetujui
    - entri device-token cache lokal untuk mesin saat ini yang lebih lama dari rotasi token sisi gateway atau membawa metadata cakupan usang

    Doctor tidak menyetujui otomatis permintaan pairing atau merotasi otomatis token perangkat. Doctor mencetak langkah berikutnya yang tepat sebagai gantinya:

    - periksa permintaan tertunda dengan `openclaw devices list`
    - setujui permintaan persisnya dengan `openclaw devices approve <requestId>`
    - rotasi token baru dengan `openclaw devices rotate --device <deviceId> --role <role>`
    - hapus dan setujui ulang catatan usang dengan `openclaw devices remove <deviceId>`

    Ini menutup celah umum "sudah dipairing tetapi masih mendapat pairing required": doctor sekarang membedakan pairing pertama kali dari peningkatan peran/cakupan yang tertunda dan dari drift token/identitas perangkat yang usang.

  </Accordion>
  <Accordion title="9. Peringatan keamanan">
    Doctor mengeluarkan peringatan ketika penyedia terbuka untuk DM tanpa allowlist, atau ketika kebijakan dikonfigurasi dengan cara yang berbahaya.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jika berjalan sebagai layanan pengguna systemd, doctor memastikan lingering diaktifkan agar gateway tetap hidup setelah logout.
  </Accordion>
  <Accordion title="11. Status workspace (Skills, Plugin, dan direktori lama)">
    Doctor mencetak ringkasan status workspace untuk agen default:

    - **Status Skills**: menghitung skill yang memenuhi syarat, persyaratannya hilang, dan diblokir allowlist.
    - **Direktori workspace lama**: memperingatkan ketika `~/openclaw` atau direktori workspace lama lainnya ada berdampingan dengan workspace saat ini.
    - **Status Plugin**: menghitung Plugin yang aktif/nonaktif/bermasalah; mencantumkan ID Plugin untuk setiap kesalahan; melaporkan kapabilitas Plugin bundel.
    - **Peringatan kompatibilitas Plugin**: menandai Plugin yang memiliki masalah kompatibilitas dengan runtime saat ini.
    - **Diagnostik Plugin**: menampilkan peringatan atau kesalahan saat pemuatan yang dikeluarkan oleh registry Plugin.

  </Accordion>
  <Accordion title="11b. Ukuran file bootstrap">
    Doctor memeriksa apakah file bootstrap workspace (misalnya `AGENTS.md`, `CLAUDE.md`, atau file konteks injeksi lainnya) mendekati atau melampaui batas karakter yang dikonfigurasi. Doctor melaporkan jumlah karakter mentah vs. terinjeksi per file, persentase pemotongan, penyebab pemotongan (`max/file` atau `max/total`), dan total karakter terinjeksi sebagai fraksi dari total batas. Ketika file dipotong atau mendekati batas, doctor mencetak tips untuk menyesuaikan `agents.defaults.bootstrapMaxChars` dan `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pembersihan Plugin channel usang">
    Ketika `openclaw doctor --fix` menghapus Plugin channel yang hilang, doctor juga menghapus konfigurasi bergantung lingkup channel yang merujuk Plugin tersebut: entri `channels.<id>`, target Heartbeat yang menamai channel, dan override `agents.*.models["<channel>/*"]`. Ini mencegah loop boot Gateway ketika runtime channel sudah tidak ada tetapi konfigurasi masih meminta gateway untuk bind ke runtime tersebut.
  </Accordion>
  <Accordion title="11c. Pelengkapan shell">
    Doctor memeriksa apakah pelengkapan tab terpasang untuk shell saat ini (zsh, bash, fish, atau PowerShell):

    - Jika profil shell menggunakan pola pelengkapan dinamis lambat (`source <(openclaw completion ...)`), doctor meningkatkannya ke varian file cache yang lebih cepat.
    - Jika pelengkapan dikonfigurasi di profil tetapi file cache hilang, doctor membuat ulang cache secara otomatis.
    - Jika tidak ada pelengkapan yang dikonfigurasi sama sekali, doctor meminta untuk memasangnya (hanya mode interaktif; dilewati dengan `--non-interactive`).

    Jalankan `openclaw completion --write-state` untuk membuat ulang cache secara manual.

  </Accordion>
  <Accordion title="12. Pemeriksaan autentikasi Gateway (token lokal)">
    Doctor memeriksa kesiapan autentikasi token gateway lokal.

    - Jika mode token membutuhkan token dan tidak ada sumber token, doctor menawarkan untuk membuatnya.
    - Jika `gateway.auth.token` dikelola SecretRef tetapi tidak tersedia, doctor memperingatkan dan tidak menimpanya dengan teks biasa.
    - `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya ketika tidak ada token SecretRef yang dikonfigurasi.

  </Accordion>
  <Accordion title="12b. Perbaikan hanya-baca yang sadar SecretRef">
    Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku runtime yang gagal cepat.

    - `openclaw doctor --fix` sekarang menggunakan model ringkasan SecretRef hanya-baca yang sama seperti perintah keluarga status untuk perbaikan konfigurasi tertarget.
    - Contoh: perbaikan Telegram `allowFrom` / `groupAllowFrom` `@username` mencoba menggunakan kredensial bot yang dikonfigurasi saat tersedia.
    - Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia di jalur perintah saat ini, doctor melaporkan bahwa kredensial sudah dikonfigurasi tetapi tidak tersedia dan melewati resolusi otomatis alih-alih crash atau salah melaporkan token sebagai hilang.

  </Accordion>
  <Accordion title="13. Pemeriksaan kesehatan Gateway + mulai ulang">
    Doctor menjalankan pemeriksaan kesehatan dan menawarkan untuk memulai ulang Gateway saat tampak tidak sehat.
  </Accordion>
  <Accordion title="13b. Kesiapan pencarian memori">
    Doctor memeriksa apakah penyedia embedding pencarian memori yang dikonfigurasi siap untuk agen default. Perilakunya bergantung pada backend dan penyedia yang dikonfigurasi:

    - **Backend QMD**: memeriksa apakah biner `qmd` tersedia dan dapat dimulai. Jika tidak, mencetak panduan perbaikan termasuk paket npm dan opsi jalur biner manual.
    - **Penyedia lokal eksplisit**: memeriksa file model lokal atau URL model jarak jauh/dapat diunduh yang dikenali. Jika hilang, menyarankan beralih ke penyedia jarak jauh.
    - **Penyedia jarak jauh eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa kunci API ada di lingkungan atau penyimpanan autentikasi. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika hilang.
    - **Penyedia otomatis**: memeriksa ketersediaan model lokal terlebih dahulu, lalu mencoba setiap penyedia jarak jauh sesuai urutan pemilihan otomatis.

    Saat hasil probe Gateway yang di-cache tersedia (Gateway sehat pada saat pemeriksaan), doctor membandingkan silang hasilnya dengan konfigurasi yang terlihat oleh CLI dan mencatat setiap ketidaksesuaian. Doctor tidak memulai ping embedding baru pada jalur default; gunakan perintah status memori mendalam saat Anda menginginkan pemeriksaan penyedia langsung.

    Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

  </Accordion>
  <Accordion title="14. Peringatan status channel">
    Jika Gateway sehat, doctor menjalankan probe status channel dan melaporkan peringatan dengan perbaikan yang disarankan.
  </Accordion>
  <Accordion title="15. Audit + perbaikan konfigurasi supervisor">
    Doctor memeriksa konfigurasi supervisor yang terpasang (launchd/systemd/schtasks) untuk default yang hilang atau sudah usang (misalnya, dependensi systemd network-online dan jeda mulai ulang). Saat menemukan ketidakcocokan, doctor merekomendasikan pembaruan dan dapat menulis ulang file layanan/tugas ke default saat ini.

    Catatan:

    - `openclaw doctor` meminta konfirmasi sebelum menulis ulang konfigurasi supervisor.
    - `openclaw doctor --yes` menerima prompt perbaikan default.
    - `openclaw doctor --repair` menerapkan perbaikan yang direkomendasikan tanpa prompt.
    - `openclaw doctor --repair --force` menimpa konfigurasi supervisor kustom.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` membuat doctor tetap hanya-baca untuk siklus hidup layanan Gateway. Doctor tetap melaporkan kesehatan layanan dan menjalankan perbaikan non-layanan, tetapi melewati pemasangan/mulai/mulai ulang/bootstrap layanan, penulisan ulang konfigurasi supervisor, dan pembersihan layanan lama karena supervisor eksternal memiliki siklus hidup tersebut.
    - Di Linux, doctor tidak menulis ulang metadata perintah/entrypoint saat unit systemd Gateway yang cocok sedang aktif. Doctor juga mengabaikan unit tambahan mirip Gateway non-legacy yang tidak aktif selama pemindaian layanan duplikat sehingga file layanan pendamping tidak membuat gangguan pembersihan.
    - Jika autentikasi token memerlukan token dan `gateway.auth.token` dikelola SecretRef, pemasangan/perbaikan layanan doctor memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang terselesaikan ke metadata lingkungan layanan supervisor.
    - Doctor mendeteksi nilai lingkungan layanan terkelola berbasis `.env`/SecretRef yang disematkan inline oleh instalasi LaunchAgent, systemd, atau Windows Scheduled Task lama dan menulis ulang metadata layanan agar nilai tersebut dimuat dari sumber runtime alih-alih definisi supervisor.
    - Doctor mendeteksi saat perintah layanan masih mengunci `--port` lama setelah `gateway.port` berubah dan menulis ulang metadata layanan ke port saat ini.
    - Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi belum terselesaikan, doctor memblokir jalur pemasangan/perbaikan dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum diatur, doctor memblokir pemasangan/perbaikan sampai mode diatur secara eksplisit.
    - Untuk unit user-systemd Linux, pemeriksaan pergeseran token doctor sekarang mencakup sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata autentikasi layanan.
    - Perbaikan layanan doctor menolak menulis ulang, menghentikan, atau memulai ulang layanan Gateway dari biner OpenClaw yang lebih lama saat konfigurasi terakhir ditulis oleh versi yang lebih baru. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostik runtime Gateway + port">
    Doctor memeriksa runtime layanan (PID, status keluar terakhir) dan memperingatkan saat layanan terpasang tetapi sebenarnya tidak berjalan. Doctor juga memeriksa tabrakan port pada port Gateway (default `18789`) dan melaporkan kemungkinan penyebab (Gateway sudah berjalan, tunnel SSH).
  </Accordion>
  <Accordion title="17. Praktik terbaik runtime Gateway">
    Doctor memperingatkan saat layanan Gateway berjalan di Bun atau jalur Node yang dikelola versi (`nvm`, `fnm`, `volta`, `asdf`, dll.). Channel WhatsApp + Telegram memerlukan Node, dan jalur pengelola versi dapat rusak setelah peningkatan karena layanan tidak memuat inisialisasi shell Anda. Doctor menawarkan migrasi ke instalasi Node sistem saat tersedia (Homebrew/apt/choco).

    LaunchAgent macOS yang baru dipasang atau diperbaiki menggunakan PATH sistem kanonis (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) alih-alih menyalin PATH shell interaktif, sehingga Volta, asdf, fnm, pnpm, dan direktori pengelola versi lainnya tidak mengubah Node mana yang ditemukan oleh proses turunan. Layanan Linux tetap mempertahankan root lingkungan eksplisit (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) dan direktori user-bin yang stabil, tetapi direktori fallback pengelola versi yang ditebak hanya ditulis ke PATH layanan saat direktori tersebut ada di disk.

  </Accordion>
  <Accordion title="18. Penulisan konfigurasi + metadata wizard">
    Doctor menyimpan perubahan konfigurasi apa pun dan memberi cap metadata wizard untuk mencatat proses doctor.
  </Accordion>
  <Accordion title="19. Tips workspace (cadangan + sistem memori)">
    Doctor menyarankan sistem memori workspace saat belum ada dan mencetak tips pencadangan jika workspace belum berada di bawah git.

    Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap tentang struktur workspace dan pencadangan git (GitHub atau GitLab privat direkomendasikan).

  </Accordion>
</AccordionGroup>

## Terkait

- [Runbook Gateway](/id/gateway)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
