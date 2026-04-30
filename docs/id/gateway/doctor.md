---
read_when:
    - Menambahkan atau memodifikasi migrasi doctor
    - Memperkenalkan perubahan konfigurasi yang tidak kompatibel
sidebarTitle: Doctor
summary: 'Perintah doctor: pemeriksaan kesehatan, migrasi konfigurasi, dan langkah perbaikan'
title: Diagnostik
x-i18n:
    generated_at: "2026-04-30T09:48:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: c27b8e85eb0a577e676f0e6e205262775ff37303453e64fc1bc2adaf8b51147c
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

    Terapkan juga perbaikan agresif (menimpa konfigurasi supervisor khusus).

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
    - Pembaruan pre-flight opsional untuk instalasi git (hanya interaktif).
    - Pemeriksaan kesegaran protokol UI (membangun ulang UI Kontrol saat skema protokol lebih baru).
    - Pemeriksaan kesehatan + prompt restart.
    - Ringkasan status Skills (memenuhi syarat/hilang/diblokir) dan status Plugin.

  </Accordion>
  <Accordion title="Konfigurasi dan migrasi">
    - Normalisasi konfigurasi untuk nilai lama.
    - Migrasi konfigurasi Talk dari field datar lama `talk.*` ke `talk.provider` + `talk.providers.<provider>`.
    - Pemeriksaan migrasi browser untuk konfigurasi ekstensi Chrome lama dan kesiapan Chrome MCP.
    - Peringatan override penyedia OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Peringatan shadowing OAuth Codex (`models.providers.openai-codex`).
    - Pemeriksaan prasyarat OAuth TLS untuk profil OAuth OpenAI Codex.
    - Migrasi status lama di disk (sessions/agent dir/autentikasi WhatsApp).
    - Migrasi kunci kontrak manifes Plugin lama (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrasi penyimpanan cron lama (`jobId`, `schedule.cron`, field delivery/payload tingkat atas, payload `provider`, job fallback webhook `notify: true` sederhana).
    - Migrasi runtime-policy agen lama ke `agents.defaults.agentRuntime` dan `agents.list[].agentRuntime`.
    - Pembersihan konfigurasi Plugin usang saat Plugin diaktifkan; saat `plugins.enabled=false`, referensi Plugin usang diperlakukan sebagai konfigurasi containment inert dan dipertahankan.

  </Accordion>
  <Accordion title="Status dan integritas">
    - Inspeksi file lock sesi dan pembersihan lock usang.
    - Perbaikan transkrip sesi untuk cabang prompt-rewrite duplikat yang dibuat oleh build 2026.4.24 yang terdampak.
    - Pemeriksaan integritas status dan izin (sessions, transcripts, state dir).
    - Pemeriksaan izin file konfigurasi (chmod 600) saat berjalan secara lokal.
    - Kesehatan autentikasi model: memeriksa kedaluwarsa OAuth, dapat menyegarkan token yang hampir kedaluwarsa, dan melaporkan status cooldown/dinonaktifkan auth-profile.
    - Deteksi direktori workspace tambahan (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, layanan, dan supervisor">
    - Perbaikan image sandbox saat sandboxing diaktifkan.
    - Migrasi layanan lama dan deteksi Gateway tambahan.
    - Migrasi status lama channel Matrix (dalam mode `--fix` / `--repair`).
    - Pemeriksaan runtime Gateway (layanan terpasang tetapi tidak berjalan; label launchd yang di-cache).
    - Peringatan status channel (di-probe dari Gateway yang sedang berjalan).
    - Audit konfigurasi supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
    - Pembersihan lingkungan proxy tersemat untuk layanan Gateway yang menangkap nilai shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` selama instalasi atau pembaruan.
    - Pemeriksaan praktik terbaik runtime Gateway (Node vs Bun, path version-manager).
    - Diagnostik benturan port Gateway (default `18789`).

  </Accordion>
  <Accordion title="Autentikasi, keamanan, dan pairing">
    - Peringatan keamanan untuk kebijakan DM terbuka.
    - Pemeriksaan autentikasi Gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada sumber token; tidak menimpa konfigurasi token SecretRef).
    - Deteksi masalah pairing perangkat (permintaan pairing pertama kali yang tertunda, peningkatan peran/cakupan yang tertunda, drift cache device-token lokal yang usang, dan drift autentikasi catatan paired).

  </Accordion>
  <Accordion title="Workspace dan shell">
    - Pemeriksaan systemd linger di Linux.
    - Pemeriksaan ukuran file bootstrap workspace (peringatan terpotong/hampir batas untuk file konteks).
    - Pemeriksaan status shell completion dan instalasi/peningkatan otomatis.
    - Pemeriksaan kesiapan penyedia embedding pencarian memori (model lokal, kunci API jarak jauh, atau biner QMD).
    - Pemeriksaan instalasi sumber (ketidaksesuaian workspace pnpm, aset UI hilang, biner tsx hilang).
    - Menulis konfigurasi yang diperbarui + metadata wizard.

  </Accordion>
</AccordionGroup>

## Backfill dan reset UI Dreams

Adegan Dreams UI Kontrol menyertakan tindakan **Backfill**, **Reset**, dan **Bersihkan Grounded** untuk alur kerja dreaming berbasis grounding. Tindakan ini menggunakan metode RPC bergaya Gateway doctor, tetapi tindakan ini **bukan** bagian dari perbaikan/migrasi CLI `openclaw doctor`.

Yang dilakukan:

- **Backfill** memindai file historis `memory/YYYY-MM-DD.md` di workspace aktif, menjalankan pass diary REM berbasis grounding, dan menulis entri backfill yang dapat dibalik ke `DREAMS.md`.
- **Reset** hanya menghapus entri diary backfill bertanda tersebut dari `DREAMS.md`.
- **Bersihkan Grounded** hanya menghapus entri jangka pendek khusus grounded yang sudah di-stage, yang berasal dari replay historis dan belum mengakumulasi recall live atau dukungan harian.

Yang **tidak** dilakukan dengan sendirinya:

- tidak mengedit `MEMORY.md`
- tidak menjalankan migrasi doctor penuh
- tidak secara otomatis men-stage kandidat grounded ke penyimpanan promosi jangka pendek live kecuali Anda menjalankan jalur CLI staging secara eksplisit terlebih dahulu

Jika Anda ingin replay historis berbasis grounding memengaruhi lane promosi mendalam normal, gunakan alur CLI sebagai gantinya:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Itu men-stage kandidat durable berbasis grounding ke penyimpanan dreaming jangka pendek sambil tetap menjadikan `DREAMS.md` sebagai permukaan peninjauan.

## Perilaku detail dan alasan

<AccordionGroup>
  <Accordion title="0. Pembaruan opsional (instalasi git)">
    Jika ini adalah git checkout dan doctor berjalan secara interaktif, doctor menawarkan pembaruan (fetch/rebase/build) sebelum menjalankan doctor.
  </Accordion>
  <Accordion title="1. Normalisasi konfigurasi">
    Jika konfigurasi berisi bentuk nilai lama (misalnya `messages.ackReaction` tanpa override khusus channel), doctor menormalisasinya ke skema saat ini.

    Itu mencakup field datar Talk lama. Konfigurasi Talk publik saat ini adalah `talk.provider` + `talk.providers.<provider>`. Doctor menulis ulang bentuk lama `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ke peta penyedia.

  </Accordion>
  <Accordion title="2. Migrasi kunci konfigurasi lama">
    Saat konfigurasi berisi kunci yang sudah tidak digunakan, perintah lain menolak berjalan dan meminta Anda menjalankan `openclaw doctor`.

    Doctor akan:

    - Menjelaskan kunci lama mana yang ditemukan.
    - Menampilkan migrasi yang diterapkan.
    - Menulis ulang `~/.openclaw/openclaw.json` dengan skema yang diperbarui.

    Gateway juga menjalankan otomatis migrasi doctor saat startup ketika mendeteksi format konfigurasi lama, sehingga konfigurasi usang diperbaiki tanpa intervensi manual. Migrasi penyimpanan job Cron ditangani oleh `openclaw doctor --fix`.

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
    - Untuk channel dengan `accounts` bernama tetapi masih memiliki nilai channel tingkat atas akun tunggal yang tertinggal, pindahkan nilai bercakupan akun tersebut ke akun yang dipromosikan dan dipilih untuk channel itu (`accounts.default` untuk sebagian besar channel; Matrix dapat mempertahankan target bernama/default yang cocok jika sudah ada)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - hapus `agents.defaults.llm`; gunakan `models.providers.<id>.timeoutSeconds` untuk timeout penyedia/model yang lambat
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - hapus `browser.relayBindHost` (pengaturan relay ekstensi lama)
    - `models.providers.*.api: "openai"` lama → `"openai-completions"` (startup Gateway juga melewati penyedia yang `api`-nya disetel ke nilai enum masa depan atau tidak dikenal, bukan gagal tertutup)

    Peringatan doctor juga mencakup panduan default akun untuk channel multi-akun:

    - Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa routing fallback dapat memilih akun yang tidak terduga.
    - Jika `channels.<channel>.defaultAccount` disetel ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

  </Accordion>
  <Accordion title="2b. Penimpaan penyedia OpenCode">
    Jika Anda menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go` secara manual, itu menimpa katalog OpenCode bawaan dari `@mariozechner/pi-ai`. Itu dapat memaksa model ke API yang salah atau mengosongkan biaya. Doctor memperingatkan agar Anda dapat menghapus penimpaan dan memulihkan perutean API per model + biaya.
  </Accordion>
  <Accordion title="2c. Migrasi peramban dan kesiapan Chrome MCP">
    Jika konfigurasi peramban Anda masih mengarah ke jalur ekstensi Chrome yang telah dihapus, doctor menormalkannya ke model lampiran Chrome MCP host-lokal saat ini:

    - `browser.profiles.*.driver: "extension"` menjadi `"existing-session"`
    - `browser.relayBindHost` dihapus

    Doctor juga mengaudit jalur Chrome MCP host-lokal saat Anda menggunakan `defaultProfile: "user"` atau profil `existing-session` yang dikonfigurasi:

    - memeriksa apakah Google Chrome terpasang di host yang sama untuk profil koneksi otomatis default
    - memeriksa versi Chrome yang terdeteksi dan memperingatkan jika versinya di bawah Chrome 144
    - mengingatkan Anda untuk mengaktifkan debugging jarak jauh di halaman inspeksi peramban (misalnya `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, atau `edge://inspect/#remote-debugging`)

    Doctor tidak dapat mengaktifkan pengaturan sisi Chrome untuk Anda. Chrome MCP host-lokal masih memerlukan:

    - peramban berbasis Chromium 144+ pada host gateway/node
    - peramban berjalan secara lokal
    - debugging jarak jauh diaktifkan di peramban tersebut
    - menyetujui prompt persetujuan lampiran pertama di peramban

    Kesiapan di sini hanya tentang prasyarat lampiran lokal. Existing-session mempertahankan batas rute Chrome MCP saat ini; rute lanjutan seperti `responsebody`, ekspor PDF, intersepsi unduhan, dan tindakan batch masih memerlukan peramban terkelola atau profil CDP mentah.

    Pemeriksaan ini **tidak** berlaku untuk Docker, sandbox, remote-browser, atau alur headless lainnya. Semua itu tetap menggunakan CDP mentah.

  </Accordion>
  <Accordion title="2d. Prasyarat OAuth TLS">
    Saat profil OAuth OpenAI Codex dikonfigurasi, doctor memeriksa endpoint otorisasi OpenAI untuk memverifikasi bahwa stack TLS Node/OpenSSL lokal dapat memvalidasi rantai sertifikat. Jika pemeriksaan gagal dengan kesalahan sertifikat (misalnya `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat yang ditandatangani sendiri), doctor mencetak panduan perbaikan khusus platform. Di macOS dengan Node dari Homebrew, perbaikannya biasanya `brew postinstall ca-certificates`. Dengan `--deep`, pemeriksaan berjalan meskipun gateway sehat.
  </Accordion>
  <Accordion title="2e. Penimpaan penyedia OAuth Codex">
    Jika sebelumnya Anda menambahkan pengaturan transport OpenAI lama di bawah `models.providers.openai-codex`, pengaturan tersebut dapat menutupi jalur penyedia OAuth Codex bawaan yang digunakan rilis yang lebih baru secara otomatis. Doctor memperingatkan saat melihat pengaturan transport lama tersebut bersama OAuth Codex agar Anda dapat menghapus atau menulis ulang penimpaan transport yang usang dan mendapatkan kembali perilaku perutean/fallback bawaan. Proxy kustom dan penimpaan khusus header tetap didukung dan tidak memicu peringatan ini.
  </Accordion>
  <Accordion title="2f. Peringatan rute Plugin Codex">
    Saat Plugin Codex bawaan diaktifkan, doctor juga memeriksa apakah ref model utama `openai-codex/*` masih diselesaikan melalui runner PI default. Kombinasi itu valid saat Anda menginginkan autentikasi OAuth/langganan Codex melalui PI, tetapi mudah tertukar dengan harness server aplikasi Codex native. Doctor memperingatkan dan menunjuk ke bentuk server aplikasi eksplisit: `openai/*` plus `agentRuntime.id: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor tidak memperbaiki ini secara otomatis karena kedua rute valid:

    - `openai-codex/*` + PI berarti "gunakan autentikasi OAuth/langganan Codex melalui runner OpenClaw normal."
    - `openai/*` + `runtime: "codex"` berarti "jalankan giliran tersemat melalui server aplikasi Codex native."
    - `/codex ...` berarti "kendalikan atau ikat percakapan Codex native dari chat."
    - `/acp ...` atau `runtime: "acp"` berarti "gunakan adaptor ACP/acpx eksternal."

    Jika peringatan muncul, pilih rute yang Anda maksud dan edit konfigurasi secara manual. Biarkan peringatan apa adanya saat OAuth Codex PI memang disengaja.

  </Accordion>
  <Accordion title="3. Migrasi status lama (tata letak disk)">
    Doctor dapat memigrasikan tata letak lama di disk ke struktur saat ini:

    - Penyimpanan sesi + transkrip:
      - dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
    - Direktori agen:
      - dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
    - Status autentikasi WhatsApp (Baileys):
      - dari `~/.openclaw/credentials/*.json` lama (kecuali `oauth.json`)
      - ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (id akun default: `default`)

    Migrasi ini bersifat upaya terbaik dan idempoten; doctor akan memunculkan peringatan saat meninggalkan folder lama apa pun sebagai cadangan. Gateway/CLI juga memigrasikan otomatis sesi lama + direktori agen saat startup sehingga riwayat/autentikasi/model masuk ke jalur per agen tanpa menjalankan doctor secara manual. Autentikasi WhatsApp sengaja hanya dimigrasikan melalui `openclaw doctor`. Normalisasi talk provider/provider-map kini membandingkan berdasarkan kesetaraan struktural, sehingga diff yang hanya berupa urutan kunci tidak lagi memicu perubahan `doctor --fix` tanpa operasi secara berulang.

  </Accordion>
  <Accordion title="3a. Migrasi manifes Plugin lama">
    Doctor memindai semua manifes Plugin terpasang untuk mencari kunci capability tingkat atas yang tidak digunakan lagi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Jika ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts` dan menulis ulang file manifes di tempat. Migrasi ini idempoten; jika kunci `contracts` sudah memiliki nilai yang sama, kunci lama dihapus tanpa menduplikasi data.
  </Accordion>
  <Accordion title="3b. Migrasi penyimpanan cron lama">
    Doctor juga memeriksa penyimpanan job cron (`~/.openclaw/cron/jobs.json` secara default, atau `cron.store` saat ditimpa) untuk bentuk job lama yang masih diterima scheduler demi kompatibilitas.

    Pembersihan cron saat ini mencakup:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - field payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
    - field pengiriman tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias pengiriman `provider` payload → `delivery.channel` eksplisit
    - job fallback webhook `notify: true` lama yang sederhana → `delivery.mode="webhook"` eksplisit dengan `delivery.to=cron.webhook`

    Doctor hanya memigrasikan otomatis job `notify: true` saat dapat melakukannya tanpa mengubah perilaku. Jika sebuah job menggabungkan fallback notify lama dengan mode pengiriman non-webhook yang sudah ada, doctor memperingatkan dan membiarkan job tersebut untuk ditinjau manual.

  </Accordion>
  <Accordion title="3c. Pembersihan kunci sesi">
    Doctor memindai setiap direktori sesi agen untuk file write-lock usang — file yang tertinggal saat sesi keluar secara tidak normal. Untuk setiap file kunci yang ditemukan, doctor melaporkan: jalur, PID, apakah PID masih hidup, usia kunci, dan apakah dianggap usang (PID mati atau lebih lama dari 30 menit). Dalam mode `--fix` / `--repair`, doctor menghapus file kunci usang secara otomatis; jika tidak, doctor mencetak catatan dan menginstruksikan Anda untuk menjalankan ulang dengan `--fix`.
  </Accordion>
  <Accordion title="3d. Perbaikan cabang transkrip sesi">
    Doctor memindai file JSONL sesi agen untuk bentuk cabang duplikat yang dibuat oleh bug penulisan ulang transkrip prompt 2026.4.24: giliran pengguna yang ditinggalkan dengan konteks runtime internal OpenClaw plus sibling aktif yang berisi prompt pengguna terlihat yang sama. Dalam mode `--fix` / `--repair`, doctor mencadangkan setiap file terdampak di sebelah aslinya dan menulis ulang transkrip ke cabang aktif sehingga pembaca riwayat dan memori gateway tidak lagi melihat giliran duplikat.
  </Accordion>
  <Accordion title="4. Pemeriksaan integritas status (persistensi sesi, perutean, dan keselamatan)">
    Direktori status adalah batang otak operasional. Jika hilang, Anda kehilangan sesi, kredensial, log, dan konfigurasi (kecuali Anda memiliki cadangan di tempat lain).

    Doctor memeriksa:

    - **Direktori status hilang**: memperingatkan tentang kehilangan status yang katastrofik, meminta untuk membuat ulang direktori, dan mengingatkan Anda bahwa data yang hilang tidak dapat dipulihkan.
    - **Izin direktori status**: memverifikasi kemampuan tulis; menawarkan untuk memperbaiki izin (dan memunculkan petunjuk `chown` saat ketidakcocokan pemilik/grup terdeteksi).
    - **Direktori status tersinkron cloud macOS**: memperingatkan saat status diselesaikan di bawah iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau `~/Library/CloudStorage/...` karena jalur berbasis sinkronisasi dapat menyebabkan I/O lebih lambat dan race kunci/sinkronisasi.
    - **Direktori status SD atau eMMC Linux**: memperingatkan saat status diselesaikan ke sumber mount `mmcblk*`, karena I/O acak berbasis SD atau eMMC dapat lebih lambat dan lebih cepat aus saat penulisan sesi dan kredensial.
    - **Direktori sesi hilang**: `sessions/` dan direktori penyimpanan sesi diperlukan untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
    - **Ketidakcocokan transkrip**: memperingatkan saat entri sesi terbaru kehilangan file transkrip.
    - **Sesi utama "JSONL 1 baris"**: menandai saat transkrip utama hanya memiliki satu baris (riwayat tidak bertambah).
    - **Beberapa direktori status**: memperingatkan saat beberapa folder `~/.openclaw` ada di berbagai direktori home atau saat `OPENCLAW_STATE_DIR` menunjuk ke tempat lain (riwayat dapat terpisah antar instalasi).
    - **Pengingat mode jarak jauh**: jika `gateway.mode=remote`, doctor mengingatkan Anda untuk menjalankannya di host jarak jauh (status berada di sana).
    - **Izin file konfigurasi**: memperingatkan jika `~/.openclaw/openclaw.json` dapat dibaca grup/dunia dan menawarkan untuk memperketat ke `600`.

  </Accordion>
  <Accordion title="5. Kesehatan autentikasi model (kedaluwarsa OAuth)">
    Doctor memeriksa profil OAuth di penyimpanan autentikasi, memperingatkan saat token akan kedaluwarsa/sudah kedaluwarsa, dan dapat menyegarkannya saat aman. Jika profil OAuth/token Anthropic sudah usang, doctor menyarankan kunci API Anthropic atau jalur setup-token Anthropic. Prompt penyegaran hanya muncul saat berjalan secara interaktif (TTY); `--non-interactive` melewati upaya penyegaran.

    Saat penyegaran OAuth gagal permanen (misalnya `refresh_token_reused`, `invalid_grant`, atau penyedia meminta Anda masuk lagi), doctor melaporkan bahwa autentikasi ulang diperlukan dan mencetak perintah `openclaw models auth login --provider ...` persis yang perlu dijalankan.

    Doctor juga melaporkan profil autentikasi yang sementara tidak dapat digunakan karena:

    - cooldown singkat (batas laju/timeout/kegagalan autentikasi)
    - penonaktifan yang lebih lama (kegagalan penagihan/kredit)

  </Accordion>
  <Accordion title="6. Validasi model hooks">
    Jika `hooks.gmail.model` disetel, doctor memvalidasi referensi model terhadap katalog dan allowlist serta memperingatkan saat tidak dapat diselesaikan atau tidak diizinkan.
  </Accordion>
  <Accordion title="7. Perbaikan image sandbox">
    Saat sandboxing diaktifkan, doctor memeriksa image Docker dan menawarkan untuk membangun atau beralih ke nama lama jika image saat ini hilang.
  </Accordion>
  <Accordion title="7b. Dependensi runtime Plugin bawaan">
    Doctor memverifikasi dependensi runtime hanya untuk Plugin bawaan yang aktif dalam konfigurasi saat ini atau diaktifkan oleh default manifes bawaannya, misalnya `plugins.entries.discord.enabled: true`, `channels.discord.enabled: true` lama, `models.providers.*` / ref model agen yang dikonfigurasi, atau Plugin bawaan yang diaktifkan default tanpa kepemilikan penyedia. Jika ada yang hilang, doctor melaporkan paket dan memasangnya dalam mode `openclaw doctor --fix` / `openclaw doctor --repair`. Plugin eksternal tetap menggunakan `openclaw plugins install` / `openclaw plugins update`; doctor tidak memasang dependensi untuk jalur Plugin arbitrer.

    Selama perbaikan doctor, pemasangan npm dependensi runtime bawaan melaporkan progres spinner dalam sesi TTY dan progres baris berkala dalam keluaran berpipa/headless. Gateway dan CLI lokal juga dapat memperbaiki dependensi runtime Plugin bawaan yang aktif sesuai permintaan sebelum mengimpor Plugin bawaan. Pemasangan ini dibatasi ke root pemasangan runtime Plugin, berjalan dengan skrip dinonaktifkan, tidak menulis package lock, dan dilindungi oleh kunci root pemasangan agar proses mulai CLI atau Gateway yang bersamaan tidak memutasi pohon `node_modules` yang sama pada saat yang sama.

  </Accordion>
  <Accordion title="8. Migrasi layanan Gateway dan petunjuk pembersihan">
    Doctor mendeteksi layanan gateway lama (launchd/systemd/schtasks) dan menawarkan untuk menghapusnya serta memasang layanan OpenClaw menggunakan port gateway saat ini. Doctor juga dapat memindai layanan tambahan yang mirip gateway dan mencetak petunjuk pembersihan. Layanan gateway OpenClaw yang diberi nama profil dianggap kelas utama dan tidak ditandai sebagai "ekstra."

    Di Linux, jika layanan gateway tingkat pengguna tidak ada tetapi layanan gateway OpenClaw tingkat sistem ada, doctor tidak memasang layanan tingkat pengguna kedua secara otomatis. Periksa dengan `openclaw gateway status --deep` atau `openclaw doctor --deep`, lalu hapus duplikatnya atau tetapkan `OPENCLAW_SERVICE_REPAIR_POLICY=external` ketika supervisor sistem memiliki lifecycle gateway.

  </Accordion>
  <Accordion title="8b. Migrasi Startup Matrix">
    Ketika akun kanal Matrix memiliki migrasi status lama yang tertunda atau dapat ditindaklanjuti, doctor (dalam mode `--fix` / `--repair`) membuat snapshot pra-migrasi lalu menjalankan langkah migrasi best-effort: migrasi status Matrix lama dan persiapan status terenkripsi lama. Kedua langkah tidak fatal; kesalahan dicatat dan startup berlanjut. Dalam mode hanya baca (`openclaw doctor` tanpa `--fix`) pemeriksaan ini dilewati sepenuhnya.
  </Accordion>
  <Accordion title="8c. Penyandingan perangkat dan pergeseran auth">
    Doctor kini memeriksa status penyandingan perangkat sebagai bagian dari pemeriksaan kesehatan normal.

    Yang dilaporkan:

    - permintaan penyandingan pertama kali yang tertunda
    - peningkatan peran yang tertunda untuk perangkat yang sudah tersanding
    - peningkatan cakupan yang tertunda untuk perangkat yang sudah tersanding
    - perbaikan ketidakcocokan kunci publik ketika id perangkat masih cocok tetapi identitas perangkat tidak lagi cocok dengan catatan yang disetujui
    - catatan tersanding yang tidak memiliki token aktif untuk peran yang disetujui
    - token tersanding yang cakupannya bergeser di luar baseline penyandingan yang disetujui
    - entri token perangkat cache lokal untuk mesin saat ini yang lebih lama dari rotasi token sisi gateway atau membawa metadata cakupan yang usang

    Doctor tidak menyetujui otomatis permintaan penyandingan atau merotasi otomatis token perangkat. Doctor mencetak langkah berikutnya yang tepat sebagai gantinya:

    - periksa permintaan tertunda dengan `openclaw devices list`
    - setujui permintaan yang tepat dengan `openclaw devices approve <requestId>`
    - rotasi token baru dengan `openclaw devices rotate --device <deviceId> --role <role>`
    - hapus dan setujui ulang catatan usang dengan `openclaw devices remove <deviceId>`

    Ini menutup celah umum "sudah tersanding tetapi masih mendapat pairing required": doctor kini membedakan penyandingan pertama kali dari peningkatan peran/cakupan yang tertunda dan dari pergeseran token/identitas perangkat yang usang.

  </Accordion>
  <Accordion title="9. Peringatan keamanan">
    Doctor mengeluarkan peringatan ketika penyedia terbuka untuk DM tanpa allowlist, atau ketika kebijakan dikonfigurasi dengan cara yang berbahaya.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jika berjalan sebagai layanan pengguna systemd, doctor memastikan lingering diaktifkan agar gateway tetap hidup setelah logout.
  </Accordion>
  <Accordion title="11. Status workspace (skills, plugin, dan direktori lama)">
    Doctor mencetak ringkasan status workspace untuk agen default:

    - **Status Skills**: menghitung skills yang memenuhi syarat, persyaratannya hilang, dan diblokir allowlist.
    - **Direktori workspace lama**: memperingatkan ketika `~/openclaw` atau direktori workspace lama lainnya ada berdampingan dengan workspace saat ini.
    - **Status Plugin**: menghitung plugin yang diaktifkan/dinonaktifkan/bermasalah; mencantumkan ID plugin untuk kesalahan apa pun; melaporkan kapabilitas plugin bundel.
    - **Peringatan kompatibilitas Plugin**: menandai plugin yang memiliki masalah kompatibilitas dengan runtime saat ini.
    - **Diagnostik Plugin**: menampilkan peringatan atau kesalahan waktu muat apa pun yang dikeluarkan oleh registry plugin.

  </Accordion>
  <Accordion title="11b. Ukuran file bootstrap">
    Doctor memeriksa apakah file bootstrap workspace (misalnya `AGENTS.md`, `CLAUDE.md`, atau file konteks tersuntik lainnya) mendekati atau melebihi anggaran karakter yang dikonfigurasi. Doctor melaporkan jumlah karakter mentah vs. tersuntik per file, persentase pemotongan, penyebab pemotongan (`max/file` atau `max/total`), dan total karakter tersuntik sebagai fraksi dari total anggaran. Ketika file dipotong atau mendekati batas, doctor mencetak tips untuk menyetel `agents.defaults.bootstrapMaxChars` dan `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pembersihan plugin kanal usang">
    Ketika `openclaw doctor --fix` menghapus plugin kanal yang hilang, doctor juga menghapus konfigurasi bercakupan kanal yang menggantung yang merujuk plugin tersebut: entri `channels.<id>`, target heartbeat yang menamai kanal, dan override `agents.*.models["<channel>/*"]`. Ini mencegah loop boot Gateway ketika runtime kanal sudah hilang tetapi konfigurasi masih meminta gateway untuk mengikat ke sana.
  </Accordion>
  <Accordion title="11c. Pelengkapan shell">
    Doctor memeriksa apakah pelengkapan tab terpasang untuk shell saat ini (zsh, bash, fish, atau PowerShell):

    - Jika profil shell menggunakan pola pelengkapan dinamis yang lambat (`source <(openclaw completion ...)`), doctor meningkatkannya ke varian file cache yang lebih cepat.
    - Jika pelengkapan dikonfigurasi di profil tetapi file cache hilang, doctor meregenerasi cache secara otomatis.
    - Jika tidak ada pelengkapan yang dikonfigurasi sama sekali, doctor meminta untuk memasangnya (hanya mode interaktif; dilewati dengan `--non-interactive`).

    Jalankan `openclaw completion --write-state` untuk meregenerasi cache secara manual.

  </Accordion>
  <Accordion title="12. Pemeriksaan auth Gateway (token lokal)">
    Doctor memeriksa kesiapan auth token gateway lokal.

    - Jika mode token membutuhkan token dan tidak ada sumber token, doctor menawarkan untuk membuatnya.
    - Jika `gateway.auth.token` dikelola SecretRef tetapi tidak tersedia, doctor memperingatkan dan tidak menimpanya dengan plaintext.
    - `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya ketika tidak ada SecretRef token yang dikonfigurasi.

  </Accordion>
  <Accordion title="12b. Perbaikan sadar SecretRef yang hanya baca">
    Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku runtime fail-fast.

    - `openclaw doctor --fix` kini menggunakan model ringkasan SecretRef hanya baca yang sama seperti perintah keluarga status untuk perbaikan konfigurasi bertarget.
    - Contoh: perbaikan `allowFrom` / `groupAllowFrom` `@username` Telegram mencoba menggunakan kredensial bot yang dikonfigurasi ketika tersedia.
    - Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia di jalur perintah saat ini, doctor melaporkan bahwa kredensial dikonfigurasi-tetapi-tidak-tersedia dan melewati resolusi otomatis alih-alih crash atau salah melaporkan token sebagai hilang.

  </Accordion>
  <Accordion title="13. Pemeriksaan kesehatan Gateway + restart">
    Doctor menjalankan pemeriksaan kesehatan dan menawarkan untuk me-restart gateway ketika terlihat tidak sehat.
  </Accordion>
  <Accordion title="13b. Kesiapan pencarian memori">
    Doctor memeriksa apakah penyedia embedding pencarian memori yang dikonfigurasi siap untuk agen default. Perilakunya bergantung pada backend dan penyedia yang dikonfigurasi:

    - **Backend QMD**: memeriksa apakah biner `qmd` tersedia dan dapat dimulai. Jika tidak, mencetak panduan perbaikan termasuk paket npm dan opsi jalur biner manual.
    - **Penyedia lokal eksplisit**: memeriksa file model lokal atau URL model jarak jauh/dapat diunduh yang dikenali. Jika hilang, menyarankan beralih ke penyedia jarak jauh.
    - **Penyedia jarak jauh eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa kunci API ada di environment atau penyimpanan auth. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika hilang.
    - **Penyedia otomatis**: memeriksa ketersediaan model lokal terlebih dahulu, lalu mencoba setiap penyedia jarak jauh dalam urutan pemilihan otomatis.

    Ketika hasil probe gateway cache tersedia (gateway sehat pada saat pemeriksaan), doctor mencocokkan silang hasilnya dengan konfigurasi yang terlihat oleh CLI dan mencatat setiap perbedaan. Doctor tidak memulai ping embedding baru pada jalur default; gunakan perintah status memori mendalam ketika Anda menginginkan pemeriksaan penyedia langsung.

    Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

  </Accordion>
  <Accordion title="14. Peringatan status kanal">
    Jika gateway sehat, doctor menjalankan probe status kanal dan melaporkan peringatan dengan perbaikan yang disarankan.
  </Accordion>
  <Accordion title="15. Audit + perbaikan konfigurasi supervisor">
    Doctor memeriksa konfigurasi supervisor yang terpasang (launchd/systemd/schtasks) untuk default yang hilang atau kedaluwarsa (misalnya dependensi systemd network-online dan jeda restart). Ketika menemukan ketidakcocokan, doctor merekomendasikan pembaruan dan dapat menulis ulang file layanan/tugas ke default saat ini.

    Catatan:

    - `openclaw doctor` meminta konfirmasi sebelum menulis ulang konfigurasi supervisor.
    - `openclaw doctor --yes` menerima prompt perbaikan default.
    - `openclaw doctor --repair` menerapkan perbaikan yang direkomendasikan tanpa prompt.
    - `openclaw doctor --repair --force` menimpa konfigurasi supervisor kustom.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` menjaga doctor tetap hanya baca untuk lifecycle layanan gateway. Doctor tetap melaporkan kesehatan layanan dan menjalankan perbaikan non-layanan, tetapi melewati pemasangan/mulai/restart/bootstrap layanan, penulisan ulang konfigurasi supervisor, dan pembersihan layanan lama karena supervisor eksternal memiliki lifecycle tersebut.
    - Di Linux, doctor tidak menulis ulang metadata perintah/entrypoint ketika unit gateway systemd yang cocok aktif. Doctor juga mengabaikan unit ekstra mirip gateway non-legacy yang tidak aktif selama pemindaian layanan duplikat agar file layanan pendamping tidak menimbulkan noise pembersihan.
    - Jika auth token membutuhkan token dan `gateway.auth.token` dikelola SecretRef, pemasangan/perbaikan layanan doctor memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang terselesaikan ke metadata environment layanan supervisor.
    - Doctor mendeteksi nilai environment layanan yang dikelola `.env`/didukung SecretRef yang disematkan inline oleh pemasangan LaunchAgent, systemd, atau Windows Scheduled Task lama dan menulis ulang metadata layanan agar nilai tersebut dimuat dari sumber runtime, bukan dari definisi supervisor.
    - Doctor mendeteksi ketika perintah layanan masih mengunci `--port` lama setelah `gateway.port` berubah dan menulis ulang metadata layanan ke port saat ini.
    - Jika auth token membutuhkan token dan SecretRef token yang dikonfigurasi tidak terselesaikan, doctor memblokir jalur pemasangan/perbaikan dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak disetel, doctor memblokir pemasangan/perbaikan sampai mode disetel secara eksplisit.
    - Untuk unit user-systemd Linux, pemeriksaan pergeseran token doctor kini mencakup sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata auth layanan.
    - Perbaikan layanan doctor menolak menulis ulang, menghentikan, atau me-restart layanan gateway dari biner OpenClaw lama ketika konfigurasi terakhir ditulis oleh versi yang lebih baru. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Runtime Gateway + diagnostik port">
    Doctor memeriksa runtime layanan (PID, status keluar terakhir) dan memperingatkan ketika layanan terinstal tetapi sebenarnya tidak berjalan. Doctor juga memeriksa bentrokan port pada port gateway (default `18789`) dan melaporkan kemungkinan penyebabnya (gateway sudah berjalan, tunnel SSH).
  </Accordion>
  <Accordion title="17. Praktik terbaik runtime Gateway">
    Doctor memperingatkan ketika layanan gateway berjalan di Bun atau jalur Node yang dikelola versi (`nvm`, `fnm`, `volta`, `asdf`, dll.). Channel WhatsApp + Telegram memerlukan Node, dan jalur pengelola versi dapat rusak setelah peningkatan karena layanan tidak memuat init shell Anda. Doctor menawarkan migrasi ke instalasi Node sistem ketika tersedia (Homebrew/apt/choco).

    Layanan yang baru diinstal atau diperbaiki mempertahankan root lingkungan eksplisit (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) dan direktori user-bin yang stabil, tetapi direktori fallback pengelola versi yang ditebak hanya ditulis ke PATH layanan ketika direktori tersebut ada di disk. Ini menjaga PATH supervisor yang dihasilkan tetap selaras dengan audit minimal-PATH yang dijalankan doctor nanti.

  </Accordion>
  <Accordion title="18. Penulisan config + metadata wizard">
    Doctor menyimpan setiap perubahan config dan memberi cap metadata wizard untuk mencatat eksekusi doctor.
  </Accordion>
  <Accordion title="19. Tips workspace (backup + sistem memori)">
    Doctor menyarankan sistem memori workspace ketika belum ada dan mencetak tips backup jika workspace belum berada di bawah git.

    Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap tentang struktur workspace dan backup git (disarankan GitHub atau GitLab privat).

  </Accordion>
</AccordionGroup>

## Terkait

- [Runbook Gateway](/id/gateway)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
