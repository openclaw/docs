---
read_when:
    - Menambahkan atau mengubah migrasi doctor
    - Memperkenalkan perubahan konfigurasi yang tidak kompatibel
sidebarTitle: Doctor
summary: 'Perintah doctor: pemeriksaan kesehatan, migrasi konfigurasi, dan langkah perbaikan'
title: Dokter
x-i18n:
    generated_at: "2026-05-05T01:45:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e374f91d00d4b43a3852de6f746b044471e80af936d464a789061a31cadd09d
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

    Terima default tanpa meminta konfirmasi (termasuk langkah perbaikan restart/service/sandbox bila berlaku).

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

    Terapkan juga perbaikan agresif (menimpa konfigurasi supervisor khusus).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Jalankan tanpa prompt dan hanya terapkan migrasi aman (normalisasi konfigurasi + pemindahan status di disk). Melewati tindakan restart/service/sandbox yang memerlukan konfirmasi manusia. Migrasi status lama berjalan otomatis saat terdeteksi.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Pindai service sistem untuk instalasi gateway tambahan (launchd/systemd/schtasks).

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
    - Pemeriksaan kesegaran protokol UI (membangun ulang UI Kontrol saat skema protokol lebih baru).
    - Pemeriksaan kesehatan + prompt restart.
    - Ringkasan status Skills (memenuhi syarat/hilang/diblokir) dan status plugin.

  </Accordion>
  <Accordion title="Konfigurasi dan migrasi">
    - Normalisasi konfigurasi untuk nilai lama.
    - Migrasi konfigurasi Talk dari field datar `talk.*` lama ke `talk.provider` + `talk.providers.<provider>`.
    - Pemeriksaan migrasi browser untuk konfigurasi Chrome extension lama dan kesiapan Chrome MCP.
    - Peringatan override penyedia OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Peringatan bayangan OAuth Codex (`models.providers.openai-codex`).
    - Pemeriksaan prasyarat OAuth TLS untuk profil OAuth OpenAI Codex.
    - Peringatan allowlist plugin/alat saat `plugins.allow` bersifat membatasi tetapi kebijakan alat masih meminta wildcard atau alat milik plugin.
    - Migrasi status lama di disk (sessions/agent dir/auth WhatsApp).
    - Migrasi kunci kontrak manifest plugin lama (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrasi penyimpanan Cron lama (`jobId`, `schedule.cron`, field delivery/payload tingkat atas, payload `provider`, job fallback webhook sederhana `notify: true`).
    - Migrasi runtime-policy agent lama ke `agents.defaults.agentRuntime` dan `agents.list[].agentRuntime`.
    - Pembersihan konfigurasi plugin usang saat plugin diaktifkan; saat `plugins.enabled=false`, referensi plugin usang diperlakukan sebagai konfigurasi kontainmen inert dan dipertahankan.

  </Accordion>
  <Accordion title="Status dan integritas">
    - Inspeksi file lock sesi dan pembersihan lock usang.
    - Perbaikan transkrip sesi untuk cabang prompt-rewrite duplikat yang dibuat oleh build 2026.4.24 yang terdampak.
    - Deteksi tombstone restart-recovery subagent yang macet, dengan dukungan `--fix` untuk membersihkan flag pemulihan dibatalkan yang usang agar startup tidak terus memperlakukan child sebagai restart-aborted.
    - Pemeriksaan integritas status dan izin (sessions, transcripts, state dir).
    - Pemeriksaan izin file konfigurasi (chmod 600) saat berjalan secara lokal.
    - Kesehatan auth model: memeriksa kedaluwarsa OAuth, dapat menyegarkan token yang hampir kedaluwarsa, dan melaporkan status cooldown/dinonaktifkan auth-profile.
    - Deteksi dir workspace tambahan (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, service, dan supervisor">
    - Perbaikan image sandbox saat sandboxing diaktifkan.
    - Migrasi service lama dan deteksi gateway tambahan.
    - Migrasi status lama channel Matrix (dalam mode `--fix` / `--repair`).
    - Pemeriksaan runtime Gateway (service terinstal tetapi tidak berjalan; label launchd yang di-cache).
    - Peringatan status channel (diprobe dari gateway yang sedang berjalan).
    - Audit konfigurasi supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
    - Pembersihan lingkungan proxy tertanam untuk service gateway yang menangkap nilai shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` selama instalasi atau pembaruan.
    - Pemeriksaan praktik terbaik runtime Gateway (Node vs Bun, jalur version-manager).
    - Diagnostik konflik port Gateway (default `18789`).

  </Accordion>
  <Accordion title="Auth, keamanan, dan pairing">
    - Peringatan keamanan untuk kebijakan DM terbuka.
    - Pemeriksaan auth Gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada sumber token; tidak menimpa konfigurasi token SecretRef).
    - Deteksi masalah pairing perangkat (permintaan pair pertama kali yang tertunda, peningkatan peran/cakupan yang tertunda, drift cache device-token lokal yang usang, dan drift auth paired-record).

  </Accordion>
  <Accordion title="Workspace dan shell">
    - Pemeriksaan systemd linger di Linux.
    - Pemeriksaan ukuran file bootstrap workspace (peringatan pemotongan/hampir batas untuk file konteks).
    - Pemeriksaan kesiapan Skills untuk agent default; melaporkan skills yang diizinkan dengan bin, env, konfigurasi, atau persyaratan OS yang hilang, dan `--fix` dapat menonaktifkan skills yang tidak tersedia di `skills.entries`.
    - Pemeriksaan status penyelesaian shell dan pemasangan/peningkatan otomatis.
    - Pemeriksaan kesiapan penyedia embedding pencarian memori (model lokal, kunci API jarak jauh, atau binary QMD).
    - Pemeriksaan instalasi sumber (ketidakcocokan workspace pnpm, aset UI hilang, binary tsx hilang).
    - Menulis konfigurasi yang diperbarui + metadata wizard.

  </Accordion>
</AccordionGroup>

## Backfill dan reset UI Dreams

Scene Dreams UI Kontrol menyertakan tindakan **Backfill**, **Reset**, dan **Clear Grounded** untuk alur kerja grounded Dreaming. Tindakan ini menggunakan metode RPC bergaya doctor gateway, tetapi tindakan tersebut **bukan** bagian dari perbaikan/migrasi CLI `openclaw doctor`.

Yang dilakukan:

- **Backfill** memindai file historis `memory/YYYY-MM-DD.md` di workspace aktif, menjalankan pass diary REM grounded, dan menulis entri backfill yang dapat dibalik ke `DREAMS.md`.
- **Reset** hanya menghapus entri diary backfill yang ditandai tersebut dari `DREAMS.md`.
- **Clear Grounded** hanya menghapus entri jangka pendek khusus grounded yang sudah di-stage, yang berasal dari replay historis dan belum mengakumulasi recall langsung atau dukungan harian.

Yang **tidak** dilakukan sendiri:

- tindakan tersebut tidak mengedit `MEMORY.md`
- tindakan tersebut tidak menjalankan migrasi doctor penuh
- tindakan tersebut tidak otomatis men-stage kandidat grounded ke penyimpanan promosi jangka pendek live kecuali Anda secara eksplisit menjalankan jalur CLI staged terlebih dahulu

Jika Anda ingin replay historis grounded memengaruhi lane promosi mendalam normal, gunakan alur CLI sebagai gantinya:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Perintah tersebut men-stage kandidat tahan lama grounded ke penyimpanan Dreaming jangka pendek sambil menjaga `DREAMS.md` sebagai permukaan tinjauan.

## Perilaku dan alasan terperinci

<AccordionGroup>
  <Accordion title="0. Pembaruan opsional (instalasi git)">
    Jika ini adalah checkout git dan doctor berjalan secara interaktif, doctor menawarkan pembaruan (fetch/rebase/build) sebelum menjalankan doctor.
  </Accordion>
  <Accordion title="1. Normalisasi konfigurasi">
    Jika konfigurasi berisi bentuk nilai lama (misalnya `messages.ackReaction` tanpa override khusus channel), doctor menormalisasinya ke skema saat ini.

    Itu mencakup field datar Talk lama. Konfigurasi Talk publik saat ini adalah `talk.provider` + `talk.providers.<provider>`. Doctor menulis ulang bentuk `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` lama ke peta penyedia.

    Doctor juga memperingatkan saat `plugins.allow` tidak kosong dan kebijakan alat menggunakan
    entri alat wildcard atau milik plugin. `tools.allow: ["*"]` hanya mencocokkan alat
    dari plugin yang benar-benar dimuat; itu tidak melewati allowlist plugin eksklusif.
    Doctor menulis `plugins.bundledDiscovery: "compat"` untuk konfigurasi allowlist
    lama yang dimigrasikan demi mempertahankan perilaku penyedia bundled yang ada, lalu
    mengarahkan ke pengaturan `"allowlist"` yang lebih ketat.

  </Accordion>
  <Accordion title="2. Migrasi kunci konfigurasi lama">
    Saat konfigurasi berisi kunci yang tidak berlaku lagi, perintah lain menolak berjalan dan meminta Anda menjalankan `openclaw doctor`.

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
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - konfigurasi kanal yang dikonfigurasi tidak memiliki kebijakan balasan terlihat → `messages.groupChat.visibleReplies: "message_tool"`
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
    - Untuk kanal dengan `accounts` bernama tetapi masih memiliki nilai kanal tingkat atas akun tunggal lama, pindahkan nilai bercakupan akun tersebut ke akun yang dipromosikan yang dipilih untuk kanal itu (`accounts.default` untuk sebagian besar kanal; Matrix dapat mempertahankan target bernama/default yang sudah ada dan cocok)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - hapus `agents.defaults.llm`; gunakan `models.providers.<id>.timeoutSeconds` untuk batas waktu provider/model yang lambat
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - hapus `browser.relayBindHost` (pengaturan relay ekstensi lama)
    - `models.providers.*.api: "openai"` lama → `"openai-completions"` (startup Gateway juga melewati provider yang `api`-nya disetel ke nilai enum masa depan atau tidak dikenal, alih-alih gagal tertutup)

    Peringatan doctor juga mencakup panduan default akun untuk kanal multi-akun:

    - Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa perutean fallback dapat memilih akun yang tidak terduga.
    - Jika `channels.<channel>.defaultAccount` disetel ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

  </Accordion>
  <Accordion title="2b. Override provider OpenCode">
    Jika Anda menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go` secara manual, itu akan menggantikan katalog OpenCode bawaan dari `@mariozechner/pi-ai`. Hal itu dapat memaksa model menggunakan API yang salah atau mengosongkan biaya. Doctor memperingatkan agar Anda dapat menghapus override dan memulihkan perutean API + biaya per model.
  </Accordion>
  <Accordion title="2c. Migrasi browser dan kesiapan Chrome MCP">
    Jika konfigurasi browser Anda masih mengarah ke jalur ekstensi Chrome yang sudah dihapus, doctor menormalkannya ke model attach Chrome MCP host-lokal saat ini:

    - `browser.profiles.*.driver: "extension"` menjadi `"existing-session"`
    - `browser.relayBindHost` dihapus

    Doctor juga mengaudit jalur Chrome MCP host-lokal saat Anda menggunakan `defaultProfile: "user"` atau profil `existing-session` yang dikonfigurasi:

    - memeriksa apakah Google Chrome terinstal pada host yang sama untuk profil koneksi otomatis default
    - memeriksa versi Chrome yang terdeteksi dan memperingatkan ketika versinya di bawah Chrome 144
    - mengingatkan Anda untuk mengaktifkan debugging jarak jauh di halaman inspeksi browser (misalnya `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, atau `edge://inspect/#remote-debugging`)

    Doctor tidak dapat mengaktifkan pengaturan sisi Chrome untuk Anda. Chrome MCP host-lokal tetap memerlukan:

    - browser berbasis Chromium 144+ pada host gateway/node
    - browser berjalan secara lokal
    - debugging jarak jauh diaktifkan di browser tersebut
    - menyetujui prompt persetujuan attach pertama di browser

    Kesiapan di sini hanya tentang prasyarat attach lokal. Existing-session mempertahankan batas rute Chrome MCP saat ini; rute lanjutan seperti `responsebody`, ekspor PDF, intersepsi unduhan, dan tindakan batch masih memerlukan browser terkelola atau profil CDP mentah.

    Pemeriksaan ini **tidak** berlaku untuk Docker, sandbox, remote-browser, atau alur headless lainnya. Alur tersebut tetap menggunakan CDP mentah.

  </Accordion>
  <Accordion title="2d. Prasyarat TLS OAuth">
    Saat profil OAuth OpenAI Codex dikonfigurasi, doctor memeriksa endpoint otorisasi OpenAI untuk memverifikasi bahwa stack TLS Node/OpenSSL lokal dapat memvalidasi rantai sertifikat. Jika pemeriksaan gagal dengan kesalahan sertifikat (misalnya `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat self-signed), doctor mencetak panduan perbaikan khusus platform. Di macOS dengan Node Homebrew, perbaikannya biasanya `brew postinstall ca-certificates`. Dengan `--deep`, pemeriksaan berjalan meskipun gateway sehat.
  </Accordion>
  <Accordion title="2e. Override provider OAuth Codex">
    Jika sebelumnya Anda menambahkan pengaturan transport OpenAI lama di bawah `models.providers.openai-codex`, pengaturan tersebut dapat membayangi jalur provider OAuth Codex bawaan yang digunakan otomatis oleh rilis yang lebih baru. Doctor memperingatkan saat melihat pengaturan transport lama tersebut bersama OAuth Codex agar Anda dapat menghapus atau menulis ulang override transport yang usang dan mendapatkan kembali perilaku perutean/fallback bawaan. Proksi kustom dan override khusus header tetap didukung dan tidak memicu peringatan ini.
  </Accordion>
  <Accordion title="2f. Peringatan rute Plugin Codex">
    Saat Plugin Codex bawaan diaktifkan, doctor juga memeriksa apakah ref model utama `openai-codex/*` masih di-resolve melalui runner PI default. Kombinasi itu valid ketika Anda menginginkan auth OAuth/langganan Codex melalui PI, tetapi mudah tertukar dengan harness app-server Codex native. Doctor memperingatkan dan menunjuk ke bentuk app-server eksplisit: `openai/*` plus `agentRuntime.id: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor tidak memperbaiki ini secara otomatis karena kedua rute valid:

    - `openai-codex/*` + PI berarti "gunakan autentikasi OAuth/langganan Codex melalui runner OpenClaw normal."
    - `openai/*` + `agentRuntime.id: "codex"` berarti "jalankan turn tersemat melalui app-server Codex native."
    - `/codex ...` berarti "kontrol atau kaitkan percakapan Codex native dari chat."
    - `/acp ...` atau `runtime: "acp"` berarti "gunakan adapter ACP/acpx eksternal."

    Jika peringatan muncul, pilih rute yang Anda maksud dan edit konfigurasi secara manual. Pertahankan peringatan apa adanya ketika OAuth PI Codex memang disengaja.

  </Accordion>
  <Accordion title="2g. Pembersihan rute sesi">
    Doctor juga memindai penyimpanan sesi aktif untuk status rute lama yang dibuat otomatis setelah Anda memindahkan model atau runtime default/fallback yang dikonfigurasi dari rute milik Plugin seperti Codex.

    `openclaw doctor --fix` dapat menghapus status lama yang dibuat otomatis seperti pin model `modelOverrideSource: "auto"`, metadata model runtime, id harness yang dipin, binding sesi CLI, dan override profil autentikasi otomatis ketika rute pemiliknya tidak lagi dikonfigurasi. Pilihan model sesi eksplisit dari pengguna atau legacy dilaporkan untuk ditinjau manual dan dibiarkan apa adanya; ganti dengan `/model ...`, `/new`, atau reset sesi ketika rute tersebut tidak lagi dimaksudkan.

  </Accordion>
  <Accordion title="3. Migrasi status legacy (tata letak disk)">
    Doctor dapat memigrasikan tata letak lama di disk ke struktur saat ini:

    - Penyimpanan sesi + transkrip:
      - dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
    - Direktori agen:
      - dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
    - Status autentikasi WhatsApp (Baileys):
      - dari legacy `~/.openclaw/credentials/*.json` (kecuali `oauth.json`)
      - ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (id akun default: `default`)

    Migrasi ini bersifat upaya terbaik dan idempoten; doctor akan mengeluarkan peringatan ketika meninggalkan folder legacy apa pun sebagai cadangan. Gateway/CLI juga memigrasikan otomatis sesi legacy + direktori agen saat startup sehingga riwayat/autentikasi/model masuk ke jalur per-agen tanpa perlu menjalankan doctor secara manual. Autentikasi WhatsApp sengaja hanya dimigrasikan melalui `openclaw doctor`. Normalisasi penyedia/peta-penyedia percakapan kini membandingkan berdasarkan kesetaraan struktural, sehingga perbedaan yang hanya berupa urutan kunci tidak lagi memicu perubahan `doctor --fix` no-op berulang.

  </Accordion>
  <Accordion title="3a. Migrasi manifes Plugin legacy">
    Doctor memindai semua manifes Plugin yang terinstal untuk kunci kapabilitas tingkat atas yang sudah tidak digunakan (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Jika ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts` dan menulis ulang file manifes di tempat. Migrasi ini idempoten; jika kunci `contracts` sudah memiliki nilai yang sama, kunci legacy dihapus tanpa menduplikasi data.
  </Accordion>
  <Accordion title="3b. Migrasi penyimpanan Cron legacy">
    Doctor juga memeriksa penyimpanan pekerjaan Cron (`~/.openclaw/cron/jobs.json` secara default, atau `cron.store` saat ditimpa) untuk bentuk pekerjaan lama yang masih diterima scheduler demi kompatibilitas.

    Pembersihan Cron saat ini mencakup:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - field payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
    - field pengiriman tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias pengiriman `provider` payload → `delivery.channel` eksplisit
    - pekerjaan fallback Webhook `notify: true` legacy sederhana → `delivery.mode="webhook"` eksplisit dengan `delivery.to=cron.webhook`

    Doctor hanya memigrasikan otomatis pekerjaan `notify: true` ketika dapat melakukannya tanpa mengubah perilaku. Jika sebuah pekerjaan menggabungkan fallback notify legacy dengan mode pengiriman non-Webhook yang sudah ada, doctor memperingatkan dan membiarkan pekerjaan tersebut untuk ditinjau manual.

    Di Linux, doctor juga memperingatkan ketika crontab pengguna masih memanggil `~/.openclaw/bin/ensure-whatsapp.sh` lama. Skrip lokal-host itu tidak dipelihara oleh OpenClaw saat ini dan dapat menulis pesan `Gateway inactive` palsu ke `~/.openclaw/logs/whatsapp-health.log` ketika cron tidak dapat menjangkau bus pengguna systemd. Hapus entri crontab usang dengan `crontab -e`; gunakan `openclaw channels status --probe`, `openclaw doctor`, dan `openclaw gateway status` untuk pemeriksaan kesehatan saat ini.

  </Accordion>
  <Accordion title="3c. Pembersihan kunci sesi">
    Doctor memindai setiap direktori sesi agen untuk file kunci tulis yang usang — file yang tertinggal ketika sesi keluar secara tidak normal. Untuk setiap file kunci yang ditemukan, ia melaporkan: jalur, PID, apakah PID masih hidup, usia kunci, dan apakah file tersebut dianggap usang (PID mati atau lebih lama dari 30 menit). Dalam mode `--fix` / `--repair`, ia menghapus file kunci usang secara otomatis; jika tidak, ia mencetak catatan dan menginstruksikan Anda untuk menjalankan ulang dengan `--fix`.
  </Accordion>
  <Accordion title="3d. Perbaikan cabang transkrip sesi">
    Doctor memindai file JSONL sesi agen untuk bentuk cabang duplikat yang dibuat oleh bug penulisan ulang transkrip prompt 2026.4.24: giliran pengguna yang ditinggalkan dengan konteks runtime internal OpenClaw ditambah saudara aktif yang berisi prompt pengguna terlihat yang sama. Dalam mode `--fix` / `--repair`, doctor mencadangkan setiap file terdampak di sebelah file asli dan menulis ulang transkrip ke cabang aktif sehingga riwayat gateway dan pembaca memori tidak lagi melihat giliran duplikat.
  </Accordion>
  <Accordion title="4. Pemeriksaan integritas status (persistensi sesi, routing, dan keselamatan)">
    Direktori status adalah batang otak operasional. Jika hilang, Anda kehilangan sesi, kredensial, log, dan konfigurasi (kecuali Anda memiliki cadangan di tempat lain).

    Doctor memeriksa:

    - **Direktori status hilang**: memperingatkan tentang kehilangan status yang katastrofik, meminta untuk membuat ulang direktori, dan mengingatkan bahwa ia tidak dapat memulihkan data yang hilang.
    - **Izin direktori status**: memverifikasi kemampuan tulis; menawarkan untuk memperbaiki izin (dan mengeluarkan petunjuk `chown` ketika ketidakcocokan pemilik/grup terdeteksi).
    - **Direktori status yang disinkronkan cloud macOS**: memperingatkan ketika status terselesaikan di bawah iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau `~/Library/CloudStorage/...` karena jalur berbasis sinkronisasi dapat menyebabkan I/O lebih lambat dan race kunci/sinkronisasi.
    - **Direktori status SD atau eMMC Linux**: memperingatkan ketika status terselesaikan ke sumber mount `mmcblk*`, karena I/O acak berbasis SD atau eMMC dapat lebih lambat dan lebih cepat aus saat penulisan sesi dan kredensial.
    - **Direktori sesi hilang**: `sessions/` dan direktori penyimpanan sesi diperlukan untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
    - **Ketidakcocokan transkrip**: memperingatkan ketika entri sesi terbaru memiliki file transkrip yang hilang.
    - **Sesi utama "JSONL 1 baris"**: menandai ketika transkrip utama hanya memiliki satu baris (riwayat tidak terakumulasi).
    - **Beberapa direktori status**: memperingatkan ketika beberapa folder `~/.openclaw` ada di berbagai direktori home atau ketika `OPENCLAW_STATE_DIR` menunjuk ke tempat lain (riwayat dapat terpecah antarinstalasi).
    - **Pengingat mode jarak jauh**: jika `gateway.mode=remote`, doctor mengingatkan Anda untuk menjalankannya di host jarak jauh (status berada di sana).
    - **Izin file konfigurasi**: memperingatkan jika `~/.openclaw/openclaw.json` dapat dibaca grup/dunia dan menawarkan untuk memperketat ke `600`.

  </Accordion>
  <Accordion title="5. Kesehatan autentikasi model (kedaluwarsa OAuth)">
    Doctor memeriksa profil OAuth di penyimpanan autentikasi, memperingatkan ketika token akan kedaluwarsa/sudah kedaluwarsa, dan dapat menyegarkannya ketika aman. Jika profil OAuth/token Anthropic usang, ia menyarankan kunci API Anthropic atau jalur setup-token Anthropic. Prompt penyegaran hanya muncul saat berjalan secara interaktif (TTY); `--non-interactive` melewati upaya penyegaran.

    Ketika penyegaran OAuth gagal permanen (misalnya `refresh_token_reused`, `invalid_grant`, atau penyedia meminta Anda masuk lagi), doctor melaporkan bahwa autentikasi ulang diperlukan dan mencetak perintah `openclaw models auth login --provider ...` yang tepat untuk dijalankan.

    Doctor juga melaporkan profil autentikasi yang sementara tidak dapat digunakan karena:

    - cooldown singkat (batas laju/timeout/kegagalan autentikasi)
    - penonaktifan lebih lama (kegagalan penagihan/kredit)

  </Accordion>
  <Accordion title="6. Validasi model hooks">
    Jika `hooks.gmail.model` diatur, doctor memvalidasi referensi model terhadap katalog dan daftar izin serta memperingatkan ketika referensi itu tidak akan terselesaikan atau tidak diizinkan.
  </Accordion>
  <Accordion title="7. Perbaikan image sandbox">
    Ketika sandboxing diaktifkan, doctor memeriksa image Docker dan menawarkan untuk membangun atau beralih ke nama lama jika image saat ini hilang.
  </Accordion>
  <Accordion title="7b. Pembersihan instalasi Plugin">
    Doctor menghapus status staging dependensi Plugin lama yang dihasilkan OpenClaw dalam mode `openclaw doctor --fix` / `openclaw doctor --repair`. Ini mencakup akar dependensi lama yang dihasilkan, direktori tahap-instal lama, sisa paket-lokal dari kode perbaikan dependensi bundled-plugin sebelumnya, dan salinan npm terkelola dari Plugin `@openclaw/*` bundel yang yatim atau dipulihkan yang dapat membayangi manifes bundel saat ini.

    Doctor juga dapat menginstal ulang Plugin yang dapat diunduh yang hilang ketika konfigurasi mereferensikannya tetapi registry Plugin lokal tidak dapat menemukannya. Contohnya mencakup `plugins.entries` material, pengaturan kanal/penyedia/pencarian yang dikonfigurasi, dan runtime agen yang dikonfigurasi. Selama pembaruan paket, doctor menghindari menjalankan perbaikan Plugin manajer paket saat paket inti sedang diganti; jalankan `openclaw doctor --fix` lagi setelah pembaruan jika Plugin yang dikonfigurasi masih perlu pemulihan. Startup Gateway dan pemuatan ulang konfigurasi tidak menjalankan manajer paket; instalasi Plugin tetap merupakan pekerjaan doctor/install/update eksplisit.

  </Accordion>
  <Accordion title="8. Migrasi layanan Gateway dan petunjuk pembersihan">
    Doctor mendeteksi layanan gateway lama (launchd/systemd/schtasks) dan menawarkan untuk menghapusnya serta menginstal layanan OpenClaw menggunakan port gateway saat ini. Ia juga dapat memindai layanan tambahan yang mirip gateway dan mencetak petunjuk pembersihan. Layanan gateway OpenClaw bernama profil dianggap kelas utama dan tidak ditandai sebagai "tambahan."

    Di Linux, jika layanan gateway tingkat pengguna hilang tetapi layanan gateway OpenClaw tingkat sistem ada, doctor tidak menginstal layanan tingkat pengguna kedua secara otomatis. Periksa dengan `openclaw gateway status --deep` atau `openclaw doctor --deep`, lalu hapus duplikat atau atur `OPENCLAW_SERVICE_REPAIR_POLICY=external` ketika supervisor sistem memiliki lifecycle gateway.

  </Accordion>
  <Accordion title="8b. Migrasi startup Matrix">
    Ketika akun kanal Matrix memiliki migrasi status lama yang tertunda atau dapat ditindaklanjuti, doctor (dalam mode `--fix` / `--repair`) membuat snapshot pra-migrasi lalu menjalankan langkah migrasi upaya-terbaik: migrasi status Matrix lama dan persiapan status terenkripsi lama. Kedua langkah tidak fatal; kesalahan dicatat dan startup berlanjut. Dalam mode hanya-baca (`openclaw doctor` tanpa `--fix`) pemeriksaan ini dilewati sepenuhnya.
  </Accordion>
  <Accordion title="8c. Pairing perangkat dan drift autentikasi">
    Doctor sekarang memeriksa status pairing perangkat sebagai bagian dari pemeriksaan kesehatan normal.

    Yang dilaporkannya:

    - permintaan pairing pertama kali yang tertunda
    - peningkatan peran yang tertunda untuk perangkat yang sudah dipairing
    - peningkatan cakupan yang tertunda untuk perangkat yang sudah dipairing
    - perbaikan ketidakcocokan kunci publik ketika id perangkat masih cocok tetapi identitas perangkat tidak lagi cocok dengan catatan yang disetujui
    - catatan yang dipairing kehilangan token aktif untuk peran yang disetujui
    - token yang dipairing yang cakupannya drift di luar baseline pairing yang disetujui
    - entri token perangkat cache lokal untuk mesin saat ini yang lebih lama daripada rotasi token sisi gateway atau membawa metadata cakupan usang

    Doctor tidak menyetujui otomatis permintaan pairing atau merotasi otomatis token perangkat. Ia mencetak langkah berikutnya yang tepat sebagai gantinya:

    - periksa permintaan tertunda dengan `openclaw devices list`
    - setujui permintaan yang tepat dengan `openclaw devices approve <requestId>`
    - rotasi token baru dengan `openclaw devices rotate --device <deviceId> --role <role>`
    - hapus dan setujui ulang catatan usang dengan `openclaw devices remove <deviceId>`

    Ini menutup celah umum "sudah dipairing tetapi masih mendapat pairing required": doctor sekarang membedakan pairing pertama kali dari peningkatan peran/cakupan yang tertunda dan dari drift token/identitas-perangkat yang usang.

  </Accordion>
  <Accordion title="9. Peringatan keamanan">
    Doctor mengeluarkan peringatan ketika penyedia terbuka untuk DM tanpa daftar izin, atau ketika kebijakan dikonfigurasi dengan cara yang berbahaya.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jika berjalan sebagai layanan pengguna systemd, doctor memastikan lingering diaktifkan sehingga gateway tetap hidup setelah logout.
  </Accordion>
  <Accordion title="11. Status workspace (skills, Plugin, dan direktori lama)">
    Doctor mencetak ringkasan status workspace untuk agen default:

    - **Status Skills**: menghitung skill yang memenuhi syarat, persyaratan hilang, dan diblokir daftar izin.
    - **Direktori workspace lama**: memperingatkan ketika `~/openclaw` atau direktori workspace lama lainnya ada berdampingan dengan workspace saat ini.
    - **Status Plugin**: menghitung Plugin yang diaktifkan/dinonaktifkan/error; mencantumkan ID Plugin untuk error apa pun; melaporkan kapabilitas Plugin bundel.
    - **Peringatan kompatibilitas Plugin**: menandai Plugin yang memiliki masalah kompatibilitas dengan runtime saat ini.
    - **Diagnostik Plugin**: menampilkan peringatan atau error saat pemuatan yang dikeluarkan oleh registry Plugin.

  </Accordion>
  <Accordion title="11b. Ukuran file bootstrap">
    Doctor memeriksa apakah file bootstrap workspace (misalnya `AGENTS.md`, `CLAUDE.md`, atau file konteks injeksi lainnya) mendekati atau melebihi anggaran karakter yang dikonfigurasi. Ia melaporkan jumlah karakter mentah vs. injeksi per file, persentase pemotongan, penyebab pemotongan (`max/file` atau `max/total`), dan total karakter injeksi sebagai fraksi dari total anggaran. Ketika file dipotong atau mendekati batas, doctor mencetak tips untuk menyesuaikan `agents.defaults.bootstrapMaxChars` dan `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pembersihan Plugin kanal usang">
    Ketika `openclaw doctor --fix` menghapus Plugin kanal yang hilang, ia juga menghapus konfigurasi berskup kanal yang menggantung yang mereferensikan Plugin tersebut: entri `channels.<id>`, target Heartbeat yang menamai kanal, dan override `agents.*.models["<channel>/*"]`. Ini mencegah boot loop Gateway ketika runtime kanal sudah hilang tetapi konfigurasi masih meminta gateway untuk mengikatnya.
  </Accordion>
  <Accordion title="11c. Pelengkapan shell">
    Doctor memeriksa apakah pelengkapan tab terinstal untuk shell saat ini (zsh, bash, fish, atau PowerShell):

    - Jika profil shell menggunakan pola pelengkapan dinamis lambat (`source <(openclaw completion ...)`), doctor meningkatkannya ke varian file cache yang lebih cepat.
    - Jika pelengkapan dikonfigurasi di profil tetapi file cache hilang, doctor meregenerasi cache secara otomatis.
    - Jika tidak ada pelengkapan yang dikonfigurasi sama sekali, doctor meminta untuk menginstalnya (hanya mode interaktif; dilewati dengan `--non-interactive`).

    Jalankan `openclaw completion --write-state` untuk meregenerasi cache secara manual.

  </Accordion>
  <Accordion title="12. Pemeriksaan autentikasi Gateway (token lokal)">
    Doctor memeriksa kesiapan autentikasi token gateway lokal.

    - Jika mode token memerlukan token dan tidak ada sumber token, doctor menawarkan untuk membuatnya.
    - Jika `gateway.auth.token` dikelola SecretRef tetapi tidak tersedia, doctor memperingatkan dan tidak menimpanya dengan plaintext.
    - `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya ketika tidak ada SecretRef token yang dikonfigurasi.

  </Accordion>
  <Accordion title="12b. Perbaikan hanya-baca yang sadar SecretRef">
    Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku fail-fast runtime.

    - `openclaw doctor --fix` kini menggunakan model ringkasan SecretRef baca-saja yang sama seperti perintah keluarga status untuk perbaikan konfigurasi tertarget.
    - Contoh: perbaikan Telegram `allowFrom` / `groupAllowFrom` `@username` mencoba menggunakan kredensial bot yang dikonfigurasi saat tersedia.
    - Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia di jalur perintah saat ini, doctor melaporkan bahwa kredensial sudah dikonfigurasi tetapi tidak tersedia, lalu melewati resolusi otomatis alih-alih crash atau salah melaporkan token sebagai hilang.

  </Accordion>
  <Accordion title="13. Pemeriksaan kesehatan Gateway + mulai ulang">
    Doctor menjalankan pemeriksaan kesehatan dan menawarkan untuk memulai ulang gateway ketika terlihat tidak sehat.
  </Accordion>
  <Accordion title="13b. Kesiapan pencarian memori">
    Doctor memeriksa apakah penyedia embedding pencarian memori yang dikonfigurasi siap untuk agen default. Perilakunya bergantung pada backend dan penyedia yang dikonfigurasi:

    - **Backend QMD**: memeriksa apakah biner `qmd` tersedia dan dapat dijalankan. Jika tidak, mencetak panduan perbaikan termasuk paket npm dan opsi jalur biner manual.
    - **Penyedia lokal eksplisit**: memeriksa file model lokal atau URL model jarak jauh/yang dapat diunduh yang dikenali. Jika hilang, menyarankan beralih ke penyedia jarak jauh.
    - **Penyedia jarak jauh eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa kunci API ada di lingkungan atau penyimpanan auth. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika hilang.
    - **Penyedia otomatis**: memeriksa ketersediaan model lokal terlebih dahulu, lalu mencoba setiap penyedia jarak jauh dalam urutan pemilihan otomatis.

    Saat hasil probe gateway yang di-cache tersedia (gateway sehat pada saat pemeriksaan), doctor mencocokkan hasilnya dengan konfigurasi yang terlihat oleh CLI dan mencatat setiap ketidaksesuaian. Doctor tidak memulai ping embedding baru pada jalur default; gunakan perintah status memori mendalam saat Anda menginginkan pemeriksaan penyedia langsung.

    Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

  </Accordion>
  <Accordion title="14. Peringatan status saluran">
    Jika gateway sehat, doctor menjalankan probe status saluran dan melaporkan peringatan dengan perbaikan yang disarankan.
  </Accordion>
  <Accordion title="15. Audit konfigurasi supervisor + perbaikan">
    Doctor memeriksa konfigurasi supervisor yang terpasang (launchd/systemd/schtasks) untuk default yang hilang atau usang (misalnya, dependensi systemd network-online dan penundaan mulai ulang). Saat menemukan ketidakcocokan, doctor merekomendasikan pembaruan dan dapat menulis ulang file layanan/tugas ke default saat ini.

    Catatan:

    - `openclaw doctor` meminta konfirmasi sebelum menulis ulang konfigurasi supervisor.
    - `openclaw doctor --yes` menerima prompt perbaikan default.
    - `openclaw doctor --repair` menerapkan perbaikan yang direkomendasikan tanpa prompt.
    - `openclaw doctor --repair --force` menimpa konfigurasi supervisor kustom.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` menjaga doctor tetap baca-saja untuk siklus hidup layanan gateway. Doctor tetap melaporkan kesehatan layanan dan menjalankan perbaikan non-layanan, tetapi melewati pemasangan/mulai/mulai ulang/bootstrap layanan, penulisan ulang konfigurasi supervisor, dan pembersihan layanan legacy karena supervisor eksternal memiliki siklus hidup tersebut.
    - Di Linux, doctor tidak menulis ulang metadata perintah/entrypoint saat unit gateway systemd yang cocok aktif. Doctor juga mengabaikan unit tambahan mirip gateway non-legacy yang tidak aktif selama pemindaian layanan duplikat agar file layanan pendamping tidak membuat noise pembersihan.
    - Jika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, pemasangan/perbaikan layanan doctor memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang diselesaikan ke dalam metadata lingkungan layanan supervisor.
    - Doctor mendeteksi nilai lingkungan layanan yang dikelola `.env`/didukung SecretRef yang disematkan inline oleh pemasangan LaunchAgent, systemd, atau Windows Scheduled Task lama, lalu menulis ulang metadata layanan agar nilai tersebut dimuat dari sumber runtime, bukan dari definisi supervisor.
    - Doctor mendeteksi ketika perintah layanan masih mematok `--port` lama setelah `gateway.port` berubah dan menulis ulang metadata layanan ke port saat ini.
    - Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi belum terselesaikan, doctor memblokir jalur pemasangan/perbaikan dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum disetel, doctor memblokir pemasangan/perbaikan sampai mode disetel secara eksplisit.
    - Untuk unit user-systemd Linux, pemeriksaan drift token doctor kini menyertakan sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata auth layanan.
    - Perbaikan layanan Doctor menolak menulis ulang, menghentikan, atau memulai ulang layanan gateway dari biner OpenClaw lama ketika konfigurasi terakhir ditulis oleh versi yang lebih baru. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostik runtime Gateway + port">
    Doctor memeriksa runtime layanan (PID, status keluar terakhir) dan memperingatkan saat layanan terpasang tetapi tidak benar-benar berjalan. Doctor juga memeriksa tabrakan port pada port gateway (default `18789`) dan melaporkan kemungkinan penyebab (gateway sudah berjalan, tunnel SSH).
  </Accordion>
  <Accordion title="17. Praktik terbaik runtime Gateway">
    Doctor memperingatkan saat layanan gateway berjalan di Bun atau jalur Node yang dikelola versi (`nvm`, `fnm`, `volta`, `asdf`, dll.). Saluran WhatsApp + Telegram memerlukan Node, dan jalur manajer versi dapat rusak setelah upgrade karena layanan tidak memuat init shell Anda. Doctor menawarkan migrasi ke instalasi Node sistem saat tersedia (Homebrew/apt/choco).

    LaunchAgent macOS yang baru dipasang atau diperbaiki menggunakan PATH sistem kanonis (`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) alih-alih menyalin PATH shell interaktif, sehingga Volta, asdf, fnm, pnpm, dan direktori manajer versi lain tidak mengubah Node mana yang diselesaikan oleh proses anak. Layanan Linux tetap mempertahankan root lingkungan eksplisit (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) dan direktori user-bin yang stabil, tetapi direktori fallback manajer versi yang ditebak hanya ditulis ke PATH layanan saat direktori tersebut ada di disk.

  </Accordion>
  <Accordion title="18. Penulisan konfigurasi + metadata wizard">
    Doctor mempertahankan setiap perubahan konfigurasi dan memberi cap metadata wizard untuk merekam jalannya doctor.
  </Accordion>
  <Accordion title="19. Tips workspace (cadangan + sistem memori)">
    Doctor menyarankan sistem memori workspace saat hilang dan mencetak tips cadangan jika workspace belum berada di bawah git.

    Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap tentang struktur workspace dan cadangan git (GitHub atau GitLab pribadi direkomendasikan).

  </Accordion>
</AccordionGroup>

## Terkait

- [Runbook Gateway](/id/gateway)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
