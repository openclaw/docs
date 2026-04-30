---
read_when:
    - Menambahkan atau mengubah migrasi doctor
    - Memperkenalkan perubahan konfigurasi yang tidak kompatibel
sidebarTitle: Doctor
summary: 'Perintah doctor: pemeriksaan kesehatan, migrasi konfigurasi, dan langkah perbaikan'
title: Dokter
x-i18n:
    generated_at: "2026-04-30T16:29:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89150fe2b2848f1f168b42ca6b240bc0e6a0edee4f1bcad7f79d297face9c95e
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

    Terima default tanpa meminta konfirmasi (termasuk langkah restart/service/perbaikan sandbox bila berlaku).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Terapkan perbaikan yang direkomendasikan tanpa meminta konfirmasi (perbaikan + restart jika aman).

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

    Jalankan tanpa prompt dan hanya terapkan migrasi aman (normalisasi config + pemindahan status di disk). Melewati tindakan restart/service/sandbox yang memerlukan konfirmasi manusia. Migrasi status legacy berjalan otomatis saat terdeteksi.

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
  <Accordion title="Health, UI, and updates">
    - Pembaruan pre-flight opsional untuk instalasi git (hanya interaktif).
    - Pemeriksaan kesegaran protokol UI (membangun ulang Control UI ketika skema protokol lebih baru).
    - Pemeriksaan kesehatan + prompt restart.
    - Ringkasan status Skills (memenuhi syarat/hilang/diblokir) dan status plugin.

  </Accordion>
  <Accordion title="Config and migrations">
    - Normalisasi config untuk nilai legacy.
    - Migrasi config Talk dari field datar legacy `talk.*` ke dalam `talk.provider` + `talk.providers.<provider>`.
    - Pemeriksaan migrasi browser untuk config ekstensi Chrome legacy dan kesiapan Chrome MCP.
    - Peringatan override penyedia OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Peringatan shadowing OAuth Codex (`models.providers.openai-codex`).
    - Pemeriksaan prasyarat OAuth TLS untuk profil OpenAI Codex OAuth.
    - Migrasi status legacy di disk (sessions/direktori agent/auth WhatsApp).
    - Migrasi kunci kontrak manifes plugin legacy (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrasi penyimpanan cron legacy (`jobId`, `schedule.cron`, field delivery/payload tingkat atas, payload `provider`, pekerjaan fallback Webhook sederhana `notify: true`).
    - Migrasi runtime-policy agent legacy ke `agents.defaults.agentRuntime` dan `agents.list[].agentRuntime`.
    - Pembersihan config plugin usang saat plugin diaktifkan; ketika `plugins.enabled=false`, referensi plugin usang diperlakukan sebagai config containment inert dan dipertahankan.

  </Accordion>
  <Accordion title="State and integrity">
    - Inspeksi file lock session dan pembersihan lock usang.
    - Perbaikan transkrip session untuk cabang prompt-rewrite duplikat yang dibuat oleh build 2026.4.24 yang terdampak.
    - Deteksi tombstone restart-recovery subagent yang macet, dengan dukungan `--fix` untuk membersihkan flag pemulihan aborted yang usang agar startup tidak terus memperlakukan child sebagai restart-aborted.
    - Pemeriksaan integritas status dan izin (sessions, transkrip, direktori status).
    - Pemeriksaan izin file config (chmod 600) saat berjalan lokal.
    - Kesehatan auth model: memeriksa kedaluwarsa OAuth, dapat menyegarkan token yang hampir kedaluwarsa, dan melaporkan status cooldown/dinonaktifkan auth-profile.
    - Deteksi direktori workspace tambahan (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Perbaikan image sandbox saat sandboxing diaktifkan.
    - Migrasi service legacy dan deteksi Gateway tambahan.
    - Migrasi status legacy channel Matrix (dalam mode `--fix` / `--repair`).
    - Pemeriksaan runtime Gateway (service terpasang tetapi tidak berjalan; label launchd yang di-cache).
    - Peringatan status channel (diprobe dari Gateway yang sedang berjalan).
    - Audit config supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
    - Pembersihan environment proxy tertanam untuk service Gateway yang menangkap nilai shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` saat instalasi atau pembaruan.
    - Pemeriksaan praktik terbaik runtime Gateway (Node vs Bun, path version-manager).
    - Diagnostik tabrakan port Gateway (default `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Peringatan keamanan untuk kebijakan DM terbuka.
    - Pemeriksaan auth Gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada sumber token; tidak menimpa config token SecretRef).
    - Deteksi masalah pairing perangkat (permintaan pair pertama kali yang tertunda, peningkatan role/scope yang tertunda, drift cache device-token lokal usang, dan drift auth catatan paired).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Pemeriksaan linger systemd di Linux.
    - Pemeriksaan ukuran file bootstrap workspace (peringatan pemotongan/hampir batas untuk file konteks).
    - Pemeriksaan status shell completion dan instalasi/upgrade otomatis.
    - Pemeriksaan kesiapan penyedia embedding pencarian memory (model lokal, kunci API remote, atau biner QMD).
    - Pemeriksaan instalasi source (ketidakcocokan workspace pnpm, aset UI hilang, biner tsx hilang).
    - Menulis config yang diperbarui + metadata wizard.

  </Accordion>
</AccordionGroup>

## Backfill dan reset UI Dreams

Scene Dreams Control UI menyertakan tindakan **Backfill**, **Reset**, dan **Clear Grounded** untuk alur kerja dreaming grounded. Tindakan ini menggunakan metode RPC bergaya doctor Gateway, tetapi **bukan** bagian dari perbaikan/migrasi CLI `openclaw doctor`.

Yang dilakukan:

- **Backfill** memindai file historis `memory/YYYY-MM-DD.md` di workspace aktif, menjalankan pass diary REM grounded, dan menulis entri backfill yang dapat dibalik ke `DREAMS.md`.
- **Reset** hanya menghapus entri diary backfill bertanda tersebut dari `DREAMS.md`.
- **Clear Grounded** hanya menghapus entri jangka pendek staged khusus grounded yang berasal dari replay historis dan belum mengumpulkan recall live atau dukungan harian.

Yang **tidak** dilakukan sendiri:

- tindakan ini tidak mengedit `MEMORY.md`
- tindakan ini tidak menjalankan migrasi doctor penuh
- tindakan ini tidak otomatis men-stage kandidat grounded ke penyimpanan promosi jangka pendek live kecuali Anda secara eksplisit menjalankan path CLI staged terlebih dahulu

Jika Anda ingin replay historis grounded memengaruhi jalur promosi deep normal, gunakan alur CLI sebagai gantinya:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Itu men-stage kandidat durable grounded ke penyimpanan dreaming jangka pendek sambil mempertahankan `DREAMS.md` sebagai permukaan peninjauan.

## Perilaku dan alasan terperinci

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Jika ini adalah checkout git dan doctor berjalan secara interaktif, ia menawarkan pembaruan (fetch/rebase/build) sebelum menjalankan doctor.
  </Accordion>
  <Accordion title="1. Config normalization">
    Jika config berisi bentuk nilai legacy (misalnya `messages.ackReaction` tanpa override khusus channel), doctor menormalisasikannya ke skema saat ini.

    Itu mencakup field datar Talk legacy. Config Talk publik saat ini adalah `talk.provider` + `talk.providers.<provider>`. Doctor menulis ulang bentuk lama `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ke dalam peta penyedia.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Ketika config berisi kunci yang sudah tidak digunakan, perintah lain menolak berjalan dan meminta Anda menjalankan `openclaw doctor`.

    Doctor akan:

    - Menjelaskan kunci legacy mana yang ditemukan.
    - Menampilkan migrasi yang diterapkan.
    - Menulis ulang `~/.openclaw/openclaw.json` dengan skema yang diperbarui.

    Gateway juga menjalankan otomatis migrasi doctor saat startup ketika mendeteksi format config legacy, sehingga config usang diperbaiki tanpa intervensi manual. Migrasi penyimpanan pekerjaan Cron ditangani oleh `openclaw doctor --fix`.

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
    - Untuk channel dengan `accounts` bernama tetapi masih memiliki nilai channel tingkat atas akun tunggal yang tertinggal, pindahkan nilai berlingkup akun tersebut ke akun promoted yang dipilih untuk channel itu (`accounts.default` untuk sebagian besar channel; Matrix dapat mempertahankan target bernama/default yang cocok yang sudah ada)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - hapus `agents.defaults.llm`; gunakan `models.providers.<id>.timeoutSeconds` untuk timeout penyedia/model lambat
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - hapus `browser.relayBindHost` (pengaturan relay ekstensi legacy)
    - legacy `models.providers.*.api: "openai"` → `"openai-completions"` (startup Gateway juga melewati penyedia yang `api`-nya disetel ke nilai enum masa depan atau tidak dikenal, alih-alih gagal tertutup)

    Peringatan doctor juga mencakup panduan default akun untuk channel multi-akun:

    - Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa routing fallback dapat memilih akun yang tidak terduga.
    - Jika `channels.<channel>.defaultAccount` diatur ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

  </Accordion>
  <Accordion title="2b. Penggantian penyedia OpenCode">
    Jika Anda menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go` secara manual, itu akan menggantikan katalog OpenCode bawaan dari `@mariozechner/pi-ai`. Hal itu dapat memaksa model ke API yang salah atau menihilkan biaya. Doctor memperingatkan agar Anda dapat menghapus penggantian tersebut dan memulihkan routing API + biaya per model.
  </Accordion>
  <Accordion title="2c. Migrasi browser dan kesiapan Chrome MCP">
    Jika konfigurasi browser Anda masih menunjuk ke jalur ekstensi Chrome yang telah dihapus, doctor menormalkannya ke model attach Chrome MCP host-lokal saat ini:

    - `browser.profiles.*.driver: "extension"` menjadi `"existing-session"`
    - `browser.relayBindHost` dihapus

    Doctor juga mengaudit jalur Chrome MCP host-lokal saat Anda menggunakan `defaultProfile: "user"` atau profil `existing-session` yang dikonfigurasi:

    - memeriksa apakah Google Chrome terinstal di host yang sama untuk profil auto-connect default
    - memeriksa versi Chrome yang terdeteksi dan memperingatkan saat versinya di bawah Chrome 144
    - mengingatkan Anda untuk mengaktifkan debugging jarak jauh di halaman inspeksi browser (misalnya `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, atau `edge://inspect/#remote-debugging`)

    Doctor tidak dapat mengaktifkan pengaturan sisi Chrome untuk Anda. Chrome MCP host-lokal tetap memerlukan:

    - browser berbasis Chromium 144+ pada host gateway/node
    - browser berjalan secara lokal
    - debugging jarak jauh diaktifkan di browser tersebut
    - menyetujui prompt persetujuan attach pertama di browser

    Kesiapan di sini hanya tentang prasyarat attach lokal. Existing-session mempertahankan batas rute Chrome MCP saat ini; rute lanjutan seperti `responsebody`, ekspor PDF, intersepsi unduhan, dan tindakan batch tetap memerlukan browser terkelola atau profil CDP mentah.

    Pemeriksaan ini **tidak** berlaku untuk Docker, sandbox, remote-browser, atau alur headless lainnya. Semua itu tetap menggunakan CDP mentah.

  </Accordion>
  <Accordion title="2d. Prasyarat TLS OAuth">
    Saat profil OAuth OpenAI Codex dikonfigurasi, doctor memeriksa endpoint otorisasi OpenAI untuk memverifikasi bahwa stack TLS Node/OpenSSL lokal dapat memvalidasi rantai sertifikat. Jika pemeriksaan gagal dengan kesalahan sertifikat (misalnya `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat yang ditandatangani sendiri), doctor mencetak panduan perbaikan khusus platform. Di macOS dengan Node dari Homebrew, perbaikannya biasanya `brew postinstall ca-certificates`. Dengan `--deep`, pemeriksaan berjalan meskipun gateway sehat.
  </Accordion>
  <Accordion title="2e. Penggantian penyedia OAuth Codex">
    Jika sebelumnya Anda menambahkan pengaturan transport OpenAI lama di bawah `models.providers.openai-codex`, pengaturan itu dapat menutupi jalur penyedia OAuth Codex bawaan yang digunakan otomatis oleh rilis yang lebih baru. Doctor memperingatkan saat melihat pengaturan transport lama tersebut bersama OAuth Codex agar Anda dapat menghapus atau menulis ulang penggantian transport yang usang dan mendapatkan kembali perilaku routing/fallback bawaan. Proxy kustom dan penggantian hanya-header tetap didukung dan tidak memicu peringatan ini.
  </Accordion>
  <Accordion title="2f. Peringatan rute plugin Codex">
    Saat plugin Codex bawaan diaktifkan, doctor juga memeriksa apakah ref model primer `openai-codex/*` masih diselesaikan melalui runner PI default. Kombinasi itu valid saat Anda menginginkan autentikasi OAuth/langganan Codex melalui PI, tetapi mudah tertukar dengan harness app-server Codex native. Doctor memperingatkan dan menunjuk ke bentuk app-server eksplisit: `openai/*` plus `agentRuntime.id: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor tidak memperbaiki ini secara otomatis karena kedua rute valid:

    - `openai-codex/*` + PI berarti "gunakan autentikasi OAuth/langganan Codex melalui runner OpenClaw normal."
    - `openai/*` + `runtime: "codex"` berarti "jalankan turn tertanam melalui app-server Codex native."
    - `/codex ...` berarti "kontrol atau ikat percakapan Codex native dari chat."
    - `/acp ...` atau `runtime: "acp"` berarti "gunakan adaptor ACP/acpx eksternal."

    Jika peringatan muncul, pilih rute yang Anda maksud dan edit konfigurasi secara manual. Biarkan peringatan apa adanya saat PI Codex OAuth memang disengaja.

  </Accordion>
  <Accordion title="3. Migrasi state lama (tata letak disk)">
    Doctor dapat memigrasikan tata letak lama di disk ke struktur saat ini:

    - Penyimpanan sesi + transkrip:
      - dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
    - Direktori agen:
      - dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
    - State autentikasi WhatsApp (Baileys):
      - dari `~/.openclaw/credentials/*.json` lama (kecuali `oauth.json`)
      - ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (id akun default: `default`)

    Migrasi ini bersifat best-effort dan idempoten; doctor akan memunculkan peringatan saat meninggalkan folder lama sebagai cadangan. Gateway/CLI juga melakukan auto-migrasi sesi lama + direktori agen saat startup sehingga riwayat/autentikasi/model masuk ke jalur per-agen tanpa perlu menjalankan doctor secara manual. Autentikasi WhatsApp sengaja hanya dimigrasikan melalui `openclaw doctor`. Normalisasi penyedia talk/provider-map kini membandingkan berdasarkan kesetaraan struktural, sehingga perbedaan yang hanya berupa urutan kunci tidak lagi memicu perubahan no-op `doctor --fix` berulang.

  </Accordion>
  <Accordion title="3a. Migrasi manifes plugin lama">
    Doctor memindai semua manifes plugin yang terinstal untuk kunci capability tingkat atas yang sudah tidak digunakan (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Saat ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts` dan menulis ulang file manifes di tempat. Migrasi ini idempoten; jika kunci `contracts` sudah memiliki nilai yang sama, kunci lama dihapus tanpa menduplikasi data.
  </Accordion>
  <Accordion title="3b. Migrasi penyimpanan cron lama">
    Doctor juga memeriksa penyimpanan job cron (`~/.openclaw/cron/jobs.json` secara default, atau `cron.store` saat diganti) untuk bentuk job lama yang masih diterima scheduler demi kompatibilitas.

    Pembersihan cron saat ini mencakup:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - field payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
    - field delivery tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias delivery payload `provider` → `delivery.channel` eksplisit
    - job fallback webhook `notify: true` lama sederhana → `delivery.mode="webhook"` eksplisit dengan `delivery.to=cron.webhook`

    Doctor hanya melakukan auto-migrasi job `notify: true` saat dapat melakukannya tanpa mengubah perilaku. Jika sebuah job menggabungkan fallback notify lama dengan mode delivery non-webhook yang sudah ada, doctor memperingatkan dan membiarkan job tersebut untuk ditinjau manual.

  </Accordion>
  <Accordion title="3c. Pembersihan lock sesi">
    Doctor memindai setiap direktori sesi agen untuk file write-lock usang — file yang tertinggal saat sesi keluar secara abnormal. Untuk setiap file lock yang ditemukan, doctor melaporkan: jalur, PID, apakah PID masih hidup, usia lock, dan apakah dianggap usang (PID mati atau lebih lama dari 30 menit). Dalam mode `--fix` / `--repair`, doctor menghapus file lock usang secara otomatis; jika tidak, doctor mencetak catatan dan menginstruksikan Anda untuk menjalankan ulang dengan `--fix`.
  </Accordion>
  <Accordion title="3d. Perbaikan cabang transkrip sesi">
    Doctor memindai file JSONL sesi agen untuk bentuk cabang terduplikasi yang dibuat oleh bug penulisan ulang transkrip prompt 2026.4.24: turn pengguna yang ditinggalkan dengan konteks runtime internal OpenClaw plus sibling aktif yang berisi prompt pengguna terlihat yang sama. Dalam mode `--fix` / `--repair`, doctor mencadangkan setiap file terdampak di sebelah file asli dan menulis ulang transkrip ke cabang aktif sehingga riwayat gateway dan pembaca memori tidak lagi melihat turn duplikat.
  </Accordion>
  <Accordion title="4. Pemeriksaan integritas state (persistensi sesi, routing, dan keamanan)">
    Direktori state adalah pusat operasional. Jika hilang, Anda kehilangan sesi, kredensial, log, dan konfigurasi (kecuali Anda memiliki cadangan di tempat lain).

    Doctor memeriksa:

    - **Direktori state hilang**: memperingatkan tentang kehilangan state yang katastrofik, meminta untuk membuat ulang direktori, dan mengingatkan Anda bahwa data yang hilang tidak dapat dipulihkan.
    - **Izin direktori state**: memverifikasi kemampuan tulis; menawarkan untuk memperbaiki izin (dan memunculkan petunjuk `chown` saat ketidakcocokan owner/group terdeteksi).
    - **Direktori state tersinkron cloud macOS**: memperingatkan saat state berada di bawah iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau `~/Library/CloudStorage/...` karena jalur berbasis sinkronisasi dapat menyebabkan I/O lebih lambat dan race lock/sinkronisasi.
    - **Direktori state SD atau eMMC Linux**: memperingatkan saat state mengarah ke sumber mount `mmcblk*`, karena I/O acak berbasis SD atau eMMC dapat lebih lambat dan lebih cepat aus saat penulisan sesi dan kredensial.
    - **Direktori sesi hilang**: `sessions/` dan direktori penyimpanan sesi diperlukan untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
    - **Ketidakcocokan transkrip**: memperingatkan saat entri sesi terbaru memiliki file transkrip yang hilang.
    - **Sesi utama "JSONL 1-baris"**: menandai saat transkrip utama hanya memiliki satu baris (riwayat tidak bertambah).
    - **Beberapa direktori state**: memperingatkan saat beberapa folder `~/.openclaw` ada di beberapa direktori home atau saat `OPENCLAW_STATE_DIR` menunjuk ke tempat lain (riwayat dapat terpecah antar instalasi).
    - **Pengingat mode jarak jauh**: jika `gateway.mode=remote`, doctor mengingatkan Anda untuk menjalankannya di host jarak jauh (state berada di sana).
    - **Izin file konfigurasi**: memperingatkan jika `~/.openclaw/openclaw.json` dapat dibaca oleh group/world dan menawarkan untuk memperketat ke `600`.

  </Accordion>
  <Accordion title="5. Kesehatan autentikasi model (kedaluwarsa OAuth)">
    Doctor memeriksa profil OAuth di penyimpanan autentikasi, memperingatkan saat token akan kedaluwarsa/sudah kedaluwarsa, dan dapat menyegarkannya saat aman. Jika profil OAuth/token Anthropic sudah usang, doctor menyarankan kunci API Anthropic atau jalur setup-token Anthropic. Prompt penyegaran hanya muncul saat berjalan secara interaktif (TTY); `--non-interactive` melewati upaya penyegaran.

    Saat penyegaran OAuth gagal permanen (misalnya `refresh_token_reused`, `invalid_grant`, atau penyedia memberi tahu Anda untuk masuk lagi), doctor melaporkan bahwa autentikasi ulang diperlukan dan mencetak perintah persis `openclaw models auth login --provider ...` yang harus dijalankan.

    Doctor juga melaporkan profil autentikasi yang sementara tidak dapat digunakan karena:

    - cooldown singkat (batas laju/timeout/kegagalan autentikasi)
    - penonaktifan lebih lama (kegagalan penagihan/kredit)

  </Accordion>
  <Accordion title="6. Validasi model hooks">
    Jika `hooks.gmail.model` disetel, doctor memvalidasi referensi model terhadap katalog dan allowlist serta memperingatkan ketika referensi tersebut tidak dapat di-resolve atau tidak diizinkan.
  </Accordion>
  <Accordion title="7. Perbaikan image sandbox">
    Saat sandboxing diaktifkan, doctor memeriksa image Docker dan menawarkan untuk membangun atau beralih ke nama lama jika image saat ini tidak ada.
  </Accordion>
  <Accordion title="7b. Dependensi runtime Plugin bawaan">
    Doctor memverifikasi dependensi runtime hanya untuk Plugin bawaan yang aktif dalam config saat ini atau diaktifkan oleh default manifest bawaannya, misalnya `plugins.entries.discord.enabled: true`, legacy `channels.discord.enabled: true`, `models.providers.*` / referensi model agen yang dikonfigurasi, atau Plugin bawaan yang default-nya aktif tanpa kepemilikan provider. Jika ada yang hilang, doctor melaporkan paketnya dan menginstalnya dalam mode `openclaw doctor --fix` / `openclaw doctor --repair`. Plugin eksternal tetap menggunakan `openclaw plugins install` / `openclaw plugins update`; doctor tidak menginstal dependensi untuk path Plugin arbitrer.

    Selama perbaikan doctor, instalasi npm dependensi runtime bawaan melaporkan progres spinner dalam sesi TTY dan progres baris berkala dalam output piped/headless. Gateway dan CLI lokal juga dapat memperbaiki dependensi runtime Plugin bawaan yang aktif sesuai permintaan sebelum mengimpor Plugin bawaan. Instalasi ini dibatasi pada root instal runtime Plugin, dijalankan dengan skrip dinonaktifkan, tidak menulis package lock, dan dijaga oleh lock root instal sehingga start CLI atau Gateway bersamaan tidak memutasi tree `node_modules` yang sama pada waktu yang sama.

  </Accordion>
  <Accordion title="8. Migrasi layanan Gateway dan petunjuk pembersihan">
    Doctor mendeteksi layanan gateway lama (launchd/systemd/schtasks) dan menawarkan untuk menghapusnya serta menginstal layanan OpenClaw menggunakan port gateway saat ini. Doctor juga dapat memindai layanan mirip gateway tambahan dan mencetak petunjuk pembersihan. Layanan gateway OpenClaw bernama profil dianggap kelas utama dan tidak ditandai sebagai "tambahan."

    Di Linux, jika layanan gateway tingkat pengguna tidak ada tetapi layanan gateway OpenClaw tingkat sistem ada, doctor tidak otomatis menginstal layanan tingkat pengguna kedua. Periksa dengan `openclaw gateway status --deep` atau `openclaw doctor --deep`, lalu hapus duplikatnya atau setel `OPENCLAW_SERVICE_REPAIR_POLICY=external` saat supervisor sistem memiliki siklus hidup gateway.

  </Accordion>
  <Accordion title="8b. Migrasi Startup Matrix">
    Saat akun channel Matrix memiliki migrasi status lama yang tertunda atau dapat ditindaklanjuti, doctor (dalam mode `--fix` / `--repair`) membuat snapshot pra-migrasi lalu menjalankan langkah migrasi best-effort: migrasi status Matrix lama dan persiapan status terenkripsi lama. Kedua langkah bersifat non-fatal; error dicatat dan startup berlanjut. Dalam mode read-only (`openclaw doctor` tanpa `--fix`) pemeriksaan ini dilewati sepenuhnya.
  </Accordion>
  <Accordion title="8c. Pairing perangkat dan drift autentikasi">
    Doctor sekarang memeriksa status pairing perangkat sebagai bagian dari health pass normal.

    Yang dilaporkan:

    - permintaan pairing pertama kali yang tertunda
    - upgrade peran tertunda untuk perangkat yang sudah dipairing
    - upgrade scope tertunda untuk perangkat yang sudah dipairing
    - perbaikan ketidakcocokan kunci publik ketika id perangkat masih cocok tetapi identitas perangkat tidak lagi cocok dengan record yang disetujui
    - record pairing yang tidak memiliki token aktif untuk peran yang disetujui
    - token pairing yang scope-nya bergeser keluar dari baseline pairing yang disetujui
    - entri token perangkat cache lokal untuk mesin saat ini yang mendahului rotasi token sisi gateway atau membawa metadata scope usang

    Doctor tidak menyetujui otomatis permintaan pairing atau merotasi otomatis token perangkat. Doctor mencetak langkah berikutnya yang tepat sebagai gantinya:

    - periksa permintaan tertunda dengan `openclaw devices list`
    - setujui permintaan yang tepat dengan `openclaw devices approve <requestId>`
    - rotasi token baru dengan `openclaw devices rotate --device <deviceId> --role <role>`
    - hapus dan setujui ulang record usang dengan `openclaw devices remove <deviceId>`

    Ini menutup celah umum "sudah dipairing tetapi masih mendapatkan pairing required": doctor sekarang membedakan pairing pertama kali dari upgrade peran/scope tertunda dan dari drift token/identitas perangkat yang usang.

  </Accordion>
  <Accordion title="9. Peringatan keamanan">
    Doctor memunculkan peringatan saat provider terbuka untuk DM tanpa allowlist, atau saat kebijakan dikonfigurasi dengan cara yang berbahaya.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jika berjalan sebagai layanan pengguna systemd, doctor memastikan lingering diaktifkan agar gateway tetap hidup setelah logout.
  </Accordion>
  <Accordion title="11. Status workspace (skills, Plugin, dan direktori legacy)">
    Doctor mencetak ringkasan status workspace untuk agen default:

    - **Status Skills**: menghitung skill yang eligible, missing-requirements, dan diblokir allowlist.
    - **Direktori workspace legacy**: memperingatkan saat `~/openclaw` atau direktori workspace legacy lain ada berdampingan dengan workspace saat ini.
    - **Status Plugin**: menghitung Plugin yang diaktifkan/dinonaktifkan/error; mencantumkan ID Plugin untuk setiap error; melaporkan kapabilitas Plugin bundle.
    - **Peringatan kompatibilitas Plugin**: menandai Plugin yang memiliki masalah kompatibilitas dengan runtime saat ini.
    - **Diagnostik Plugin**: menampilkan peringatan atau error waktu muat apa pun yang dipancarkan oleh registry Plugin.

  </Accordion>
  <Accordion title="11b. Ukuran file bootstrap">
    Doctor memeriksa apakah file bootstrap workspace (misalnya `AGENTS.md`, `CLAUDE.md`, atau file konteks terinjeksi lainnya) mendekati atau melebihi anggaran karakter yang dikonfigurasi. Doctor melaporkan jumlah karakter mentah vs. terinjeksi per file, persentase pemotongan, penyebab pemotongan (`max/file` atau `max/total`), dan total karakter terinjeksi sebagai fraksi dari total anggaran. Saat file dipotong atau mendekati batas, doctor mencetak tips untuk menyesuaikan `agents.defaults.bootstrapMaxChars` dan `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pembersihan Plugin channel usang">
    Saat `openclaw doctor --fix` menghapus Plugin channel yang hilang, perintah ini juga menghapus config berscope channel yang menggantung dan mereferensikan Plugin tersebut: entri `channels.<id>`, target heartbeat yang menamai channel, dan override `agents.*.models["<channel>/*"]`. Ini mencegah boot loop Gateway ketika runtime channel sudah hilang tetapi config masih meminta gateway untuk bind ke runtime tersebut.
  </Accordion>
  <Accordion title="11c. Completion shell">
    Doctor memeriksa apakah tab completion sudah diinstal untuk shell saat ini (zsh, bash, fish, atau PowerShell):

    - Jika profil shell menggunakan pola completion dinamis yang lambat (`source <(openclaw completion ...)`), doctor meng-upgrade-nya ke varian file cache yang lebih cepat.
    - Jika completion dikonfigurasi dalam profil tetapi file cache hilang, doctor meregenerasi cache secara otomatis.
    - Jika tidak ada completion yang dikonfigurasi sama sekali, doctor meminta untuk menginstalnya (hanya mode interaktif; dilewati dengan `--non-interactive`).

    Jalankan `openclaw completion --write-state` untuk meregenerasi cache secara manual.

  </Accordion>
  <Accordion title="12. Pemeriksaan autentikasi Gateway (token lokal)">
    Doctor memeriksa kesiapan autentikasi token gateway lokal.

    - Jika mode token memerlukan token dan tidak ada sumber token, doctor menawarkan untuk membuatnya.
    - Jika `gateway.auth.token` dikelola SecretRef tetapi tidak tersedia, doctor memperingatkan dan tidak menimpanya dengan plaintext.
    - `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya saat tidak ada SecretRef token yang dikonfigurasi.

  </Accordion>
  <Accordion title="12b. Perbaikan read-only yang sadar SecretRef">
    Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku runtime fail-fast.

    - `openclaw doctor --fix` sekarang menggunakan model ringkasan SecretRef read-only yang sama seperti perintah keluarga status untuk perbaikan config tertarget.
    - Contoh: perbaikan `allowFrom` / `groupAllowFrom` `@username` Telegram mencoba menggunakan kredensial bot yang dikonfigurasi saat tersedia.
    - Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia dalam path perintah saat ini, doctor melaporkan bahwa kredensial dikonfigurasi-tetapi-tidak-tersedia dan melewati resolusi otomatis alih-alih crash atau salah melaporkan token sebagai hilang.

  </Accordion>
  <Accordion title="13. Health check Gateway + restart">
    Doctor menjalankan health check dan menawarkan untuk me-restart gateway saat terlihat tidak sehat.
  </Accordion>
  <Accordion title="13b. Kesiapan pencarian memori">
    Doctor memeriksa apakah provider embedding pencarian memori yang dikonfigurasi siap untuk agen default. Perilakunya bergantung pada backend dan provider yang dikonfigurasi:

    - **Backend QMD**: memeriksa apakah binary `qmd` tersedia dan dapat dijalankan. Jika tidak, mencetak panduan perbaikan termasuk paket npm dan opsi path binary manual.
    - **Provider lokal eksplisit**: memeriksa file model lokal atau URL model jarak jauh/dapat diunduh yang dikenali. Jika hilang, menyarankan beralih ke provider jarak jauh.
    - **Provider jarak jauh eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa API key ada di environment atau auth store. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika hilang.
    - **Provider otomatis**: memeriksa ketersediaan model lokal terlebih dahulu, lalu mencoba setiap provider jarak jauh dalam urutan pemilihan otomatis.

    Saat hasil probe gateway cache tersedia (gateway sehat pada saat pemeriksaan), doctor mencocokkan silang hasilnya dengan config yang terlihat oleh CLI dan mencatat setiap ketidaksesuaian. Doctor tidak memulai ping embedding baru pada path default; gunakan perintah status memori deep saat Anda menginginkan pemeriksaan provider live.

    Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

  </Accordion>
  <Accordion title="14. Peringatan status channel">
    Jika gateway sehat, doctor menjalankan probe status channel dan melaporkan peringatan dengan perbaikan yang disarankan.
  </Accordion>
  <Accordion title="15. Audit + perbaikan config supervisor">
    Doctor memeriksa config supervisor yang terinstal (launchd/systemd/schtasks) untuk default yang hilang atau usang (misalnya, dependensi systemd network-online dan jeda restart). Saat menemukan ketidaksesuaian, doctor merekomendasikan pembaruan dan dapat menulis ulang file layanan/task ke default saat ini.

    Catatan:

    - `openclaw doctor` meminta konfirmasi sebelum menulis ulang konfigurasi supervisor.
    - `openclaw doctor --yes` menerima prompt perbaikan default.
    - `openclaw doctor --repair` menerapkan perbaikan yang direkomendasikan tanpa prompt.
    - `openclaw doctor --repair --force` menimpa konfigurasi supervisor kustom.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` menjaga doctor tetap hanya-baca untuk siklus hidup layanan Gateway. Ini tetap melaporkan kesehatan layanan dan menjalankan perbaikan non-layanan, tetapi melewati pemasangan/memulai/memulai ulang/bootstrap layanan, penulisan ulang konfigurasi supervisor, dan pembersihan layanan lama karena supervisor eksternal memiliki siklus hidup tersebut.
    - Di Linux, doctor tidak menulis ulang metadata perintah/entrypoint saat unit Gateway systemd yang cocok sedang aktif. Ini juga mengabaikan unit tambahan mirip Gateway non-legacy yang tidak aktif selama pemindaian layanan duplikat sehingga file layanan pendamping tidak menimbulkan gangguan pembersihan.
    - Jika autentikasi token memerlukan token dan `gateway.auth.token` dikelola SecretRef, pemasangan/perbaikan layanan doctor memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang terselesaikan ke metadata lingkungan layanan supervisor.
    - Doctor mendeteksi nilai lingkungan layanan terkelola berbasis `.env`/SecretRef yang tertanam inline pada pemasangan LaunchAgent, systemd, atau Windows Scheduled Task lama dan menulis ulang metadata layanan agar nilai tersebut dimuat dari sumber runtime alih-alih dari definisi supervisor.
    - Doctor mendeteksi saat perintah layanan masih mengunci `--port` lama setelah `gateway.port` berubah dan menulis ulang metadata layanan ke port saat ini.
    - Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi tidak terselesaikan, doctor memblokir jalur pemasangan/perbaikan dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum diatur, doctor memblokir pemasangan/perbaikan hingga mode diatur secara eksplisit.
    - Untuk unit user-systemd Linux, pemeriksaan drift token doctor kini menyertakan sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata autentikasi layanan.
    - Perbaikan layanan doctor menolak menulis ulang, menghentikan, atau memulai ulang layanan Gateway dari biner OpenClaw lama ketika konfigurasi terakhir ditulis oleh versi yang lebih baru. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostik runtime + port Gateway">
    Doctor memeriksa runtime layanan (PID, status keluar terakhir) dan memperingatkan saat layanan terpasang tetapi sebenarnya tidak berjalan. Ini juga memeriksa tabrakan port pada port Gateway (default `18789`) dan melaporkan kemungkinan penyebab (Gateway sudah berjalan, tunnel SSH).
  </Accordion>
  <Accordion title="17. Praktik terbaik runtime Gateway">
    Doctor memperingatkan saat layanan Gateway berjalan di Bun atau path Node yang dikelola versi (`nvm`, `fnm`, `volta`, `asdf`, dll.). Kanal WhatsApp + Telegram memerlukan Node, dan path pengelola versi dapat rusak setelah peningkatan karena layanan tidak memuat inisialisasi shell Anda. Doctor menawarkan migrasi ke pemasangan Node sistem saat tersedia (Homebrew/apt/choco).

    Layanan yang baru dipasang atau diperbaiki mempertahankan root lingkungan eksplisit (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) dan direktori user-bin yang stabil, tetapi direktori fallback pengelola versi yang ditebak hanya ditulis ke PATH layanan saat direktori tersebut ada di disk. Ini menjaga PATH supervisor yang dihasilkan tetap selaras dengan audit PATH minimal yang sama yang dijalankan doctor kemudian.

  </Accordion>
  <Accordion title="18. Penulisan konfigurasi + metadata wizard">
    Doctor menyimpan perubahan konfigurasi apa pun dan membubuhkan metadata wizard untuk mencatat eksekusi doctor.
  </Accordion>
  <Accordion title="19. Kiat workspace (cadangan + sistem memori)">
    Doctor menyarankan sistem memori workspace saat belum ada dan mencetak kiat pencadangan jika workspace belum berada di bawah git.

    Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap struktur workspace dan pencadangan git (disarankan GitHub atau GitLab privat).

  </Accordion>
</AccordionGroup>

## Terkait

- [Runbook Gateway](/id/gateway)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
