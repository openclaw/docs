---
read_when:
    - Menambahkan atau memodifikasi migrasi doctor
    - Memperkenalkan perubahan konfigurasi yang merusak kompatibilitas
sidebarTitle: Doctor
summary: 'Perintah doctor: pemeriksaan kesehatan, migrasi konfigurasi, dan langkah perbaikan'
title: Dokter
x-i18n:
    generated_at: "2026-05-01T09:24:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: eef5715d485609fa60bdb4aa97ee441b053a60519b9dea03b0c8ec09db157474
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` adalah alat perbaikan + migrasi untuk OpenClaw. Alat ini memperbaiki konfigurasi/status yang usang, memeriksa kesehatan, dan menyediakan langkah perbaikan yang dapat ditindaklanjuti.

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

    Terima default tanpa prompt (termasuk langkah perbaikan mulai ulang/layanan/sandbox jika berlaku).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    Terapkan perbaikan yang direkomendasikan tanpa prompt (perbaikan + mulai ulang jika aman).

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

    Jalankan tanpa prompt dan hanya terapkan migrasi aman (normalisasi konfigurasi + pemindahan status di disk). Melewati tindakan mulai ulang/layanan/sandbox yang memerlukan konfirmasi manusia. Migrasi status lama berjalan otomatis saat terdeteksi.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Pindai layanan sistem untuk instalasi Gateway tambahan (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Jika Anda ingin meninjau perubahan sebelum menulis, buka file konfigurasi terlebih dahulu:

```bash
cat ~/.openclaw/openclaw.json
```

## Yang dilakukan (ringkasan)

<AccordionGroup>
  <Accordion title="Kesehatan, UI, dan pembaruan">
    - Pembaruan pra-jalan opsional untuk instalasi git (hanya interaktif).
    - Pemeriksaan kesegaran protokol UI (membangun ulang Control UI saat skema protokol lebih baru).
    - Pemeriksaan kesehatan + prompt mulai ulang.
    - Ringkasan status Skills (memenuhi syarat/hilang/diblokir) dan status plugin.

  </Accordion>
  <Accordion title="Konfigurasi dan migrasi">
    - Normalisasi konfigurasi untuk nilai lama.
    - Migrasi konfigurasi Talk dari field `talk.*` datar lama ke `talk.provider` + `talk.providers.<provider>`.
    - Pemeriksaan migrasi browser untuk konfigurasi ekstensi Chrome lama dan kesiapan Chrome MCP.
    - Peringatan override penyedia OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Peringatan pembayangan OAuth Codex (`models.providers.openai-codex`).
    - Pemeriksaan prasyarat TLS OAuth untuk profil OAuth OpenAI Codex.
    - Peringatan daftar izin Plugin/alat saat `plugins.allow` bersifat membatasi tetapi kebijakan alat masih meminta wildcard atau alat milik plugin.
    - Migrasi status lama di disk (sessions/agent dir/WhatsApp auth).
    - Migrasi kunci kontrak manifest plugin lama (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrasi penyimpanan cron lama (`jobId`, `schedule.cron`, field delivery/payload tingkat atas, payload `provider`, job fallback webhook `notify: true` sederhana).
    - Migrasi kebijakan runtime agen lama ke `agents.defaults.agentRuntime` dan `agents.list[].agentRuntime`.
    - Pembersihan konfigurasi plugin basi saat plugin diaktifkan; saat `plugins.enabled=false`, referensi plugin basi diperlakukan sebagai konfigurasi penahanan inert dan dipertahankan.

  </Accordion>
  <Accordion title="Status dan integritas">
    - Inspeksi file kunci sesi dan pembersihan kunci basi.
    - Perbaikan transkrip sesi untuk cabang penulisan ulang prompt duplikat yang dibuat oleh build 2026.4.24 yang terdampak.
    - Deteksi tombstone pemulihan mulai ulang subagen yang macet, dengan dukungan `--fix` untuk membersihkan flag pemulihan dibatalkan yang basi agar startup tidak terus memperlakukan anak sebagai dibatalkan mulai ulang.
    - Pemeriksaan integritas status dan izin (sesi, transkrip, direktori status).
    - Pemeriksaan izin file konfigurasi (chmod 600) saat berjalan secara lokal.
    - Kesehatan autentikasi model: memeriksa kedaluwarsa OAuth, dapat menyegarkan token yang hampir kedaluwarsa, dan melaporkan status cooldown/dinonaktifkan auth-profile.
    - Deteksi direktori workspace tambahan (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, layanan, dan supervisor">
    - Perbaikan image sandbox saat sandboxing diaktifkan.
    - Migrasi layanan lama dan deteksi Gateway tambahan.
    - Migrasi status lama channel Matrix (dalam mode `--fix` / `--repair`).
    - Pemeriksaan runtime Gateway (layanan terpasang tetapi tidak berjalan; label launchd tersimpan cache).
    - Peringatan status channel (diprobe dari Gateway yang sedang berjalan).
    - Audit konfigurasi supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
    - Pembersihan lingkungan proxy tertanam untuk layanan Gateway yang menangkap nilai shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` selama instalasi atau pembaruan.
    - Pemeriksaan praktik terbaik runtime Gateway (Node vs Bun, path pengelola versi).
    - Diagnostik tabrakan port Gateway (default `18789`).

  </Accordion>
  <Accordion title="Autentikasi, keamanan, dan pemasangan">
    - Peringatan keamanan untuk kebijakan DM terbuka.
    - Pemeriksaan autentikasi Gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada sumber token; tidak menimpa konfigurasi token SecretRef).
    - Deteksi masalah pemasangan perangkat (permintaan pasangan pertama kali yang tertunda, peningkatan peran/cakupan yang tertunda, drift cache token perangkat lokal yang basi, dan drift autentikasi catatan pasangan).

  </Accordion>
  <Accordion title="Workspace dan shell">
    - Pemeriksaan linger systemd di Linux.
    - Pemeriksaan ukuran file bootstrap workspace (peringatan pemotongan/hampir batas untuk file konteks).
    - Pemeriksaan status penyelesaian shell dan pemasangan/peningkatan otomatis.
    - Pemeriksaan kesiapan penyedia embedding pencarian memori (model lokal, kunci API jarak jauh, atau biner QMD).
    - Pemeriksaan instalasi sumber (ketidakcocokan workspace pnpm, aset UI hilang, biner tsx hilang).
    - Menulis konfigurasi yang diperbarui + metadata wizard.

  </Accordion>
</AccordionGroup>

## Backfill dan reset UI Dreams

Scene Dreams di Control UI menyertakan tindakan **Backfill**, **Reset**, dan **Clear Grounded** untuk alur kerja dreaming berbasis grounded. Tindakan ini menggunakan metode RPC bergaya doctor Gateway, tetapi **bukan** bagian dari perbaikan/migrasi CLI `openclaw doctor`.

Yang dilakukan:

- **Backfill** memindai file historis `memory/YYYY-MM-DD.md` di workspace aktif, menjalankan pass diary REM berbasis grounded, dan menulis entri backfill yang dapat dibalik ke `DREAMS.md`.
- **Reset** hanya menghapus entri diary backfill bertanda tersebut dari `DREAMS.md`.
- **Clear Grounded** hanya menghapus entri jangka pendek khusus grounded yang sudah di-stage, yang berasal dari replay historis dan belum mengumpulkan recall langsung atau dukungan harian.

Yang **tidak** dilakukan sendiri:

- tindakan ini tidak mengedit `MEMORY.md`
- tindakan ini tidak menjalankan migrasi doctor penuh
- tindakan ini tidak otomatis melakukan stage kandidat grounded ke store promosi jangka pendek langsung kecuali Anda menjalankan path CLI staged secara eksplisit terlebih dahulu

Jika Anda ingin replay historis grounded memengaruhi jalur promosi mendalam normal, gunakan alur CLI sebagai gantinya:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Perintah itu melakukan stage kandidat durable grounded ke store dreaming jangka pendek sambil mempertahankan `DREAMS.md` sebagai permukaan peninjauan.

## Perilaku terperinci dan alasan

<AccordionGroup>
  <Accordion title="0. Pembaruan opsional (instalasi git)">
    Jika ini adalah checkout git dan doctor berjalan secara interaktif, alat ini menawarkan pembaruan (fetch/rebase/build) sebelum menjalankan doctor.
  </Accordion>
  <Accordion title="1. Normalisasi konfigurasi">
    Jika konfigurasi berisi bentuk nilai lama (misalnya `messages.ackReaction` tanpa override khusus channel), doctor menormalkannya ke skema saat ini.

    Itu mencakup field datar Talk lama. Konfigurasi Talk publik saat ini adalah `talk.provider` + `talk.providers.<provider>`. Doctor menulis ulang bentuk lama `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ke dalam peta penyedia.

    Doctor juga memperingatkan saat `plugins.allow` tidak kosong dan kebijakan alat menggunakan
    entri alat wildcard atau milik plugin. `tools.allow: ["*"]` hanya cocok dengan alat
    dari plugin yang benar-benar dimuat; ini tidak melewati daftar izin plugin
    eksklusif.

  </Accordion>
  <Accordion title="2. Migrasi kunci konfigurasi lama">
    Saat konfigurasi berisi kunci yang sudah tidak digunakan, perintah lain menolak berjalan dan meminta Anda menjalankan `openclaw doctor`.

    Doctor akan:

    - Menjelaskan kunci lama mana yang ditemukan.
    - Menampilkan migrasi yang diterapkan.
    - Menulis ulang `~/.openclaw/openclaw.json` dengan skema yang diperbarui.

    Gateway juga menjalankan migrasi doctor secara otomatis saat startup ketika mendeteksi format konfigurasi lama, sehingga konfigurasi basi diperbaiki tanpa intervensi manual. Migrasi penyimpanan job cron ditangani oleh `openclaw doctor --fix`.

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
    - Untuk channel dengan `accounts` bernama tetapi masih memiliki nilai channel tingkat atas akun tunggal yang tersisa, pindahkan nilai berskup akun tersebut ke akun yang dipromosikan yang dipilih untuk channel itu (`accounts.default` untuk sebagian besar channel; Matrix dapat mempertahankan target bernama/default yang cocok jika sudah ada)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - hapus `agents.defaults.llm`; gunakan `models.providers.<id>.timeoutSeconds` untuk batas waktu provider/model yang lambat
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - hapus `browser.relayBindHost` (pengaturan relay ekstensi lama)
    - `models.providers.*.api: "openai"` lama → `"openai-completions"` (startup gateway juga melewati provider yang `api`-nya disetel ke nilai enum masa depan atau tidak dikenal, alih-alih gagal tertutup)

    Peringatan Doctor juga menyertakan panduan default akun untuk channel multi-akun:

    - Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa routing fallback dapat memilih akun yang tidak diharapkan.
    - Jika `channels.<channel>.defaultAccount` disetel ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    Jika Anda menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go` secara manual, itu menimpa katalog OpenCode bawaan dari `@mariozechner/pi-ai`. Hal itu dapat memaksa model ke API yang salah atau mengosongkan biaya. Doctor memperingatkan agar Anda dapat menghapus penimpaan tersebut dan memulihkan routing API + biaya per model.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    Jika konfigurasi browser Anda masih menunjuk ke jalur ekstensi Chrome yang telah dihapus, doctor menormalkannya ke model attach Chrome MCP host-lokal saat ini:

    - `browser.profiles.*.driver: "extension"` menjadi `"existing-session"`
    - `browser.relayBindHost` dihapus

    Doctor juga mengaudit jalur Chrome MCP host-lokal saat Anda menggunakan `defaultProfile: "user"` atau profil `existing-session` yang dikonfigurasi:

    - memeriksa apakah Google Chrome terpasang pada host yang sama untuk profil auto-connect default
    - memeriksa versi Chrome yang terdeteksi dan memperingatkan saat versinya di bawah Chrome 144
    - mengingatkan Anda untuk mengaktifkan remote debugging di halaman inspect browser (misalnya `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, atau `edge://inspect/#remote-debugging`)

    Doctor tidak dapat mengaktifkan pengaturan sisi Chrome untuk Anda. Chrome MCP host-lokal masih memerlukan:

    - browser berbasis Chromium 144+ pada host gateway/node
    - browser berjalan secara lokal
    - remote debugging diaktifkan di browser tersebut
    - menyetujui prompt persetujuan attach pertama di browser

    Kesiapan di sini hanya terkait prasyarat attach lokal. Existing-session mempertahankan batas rute Chrome MCP saat ini; rute lanjutan seperti `responsebody`, ekspor PDF, intersepsi unduhan, dan aksi batch masih memerlukan browser terkelola atau profil CDP mentah.

    Pemeriksaan ini **tidak** berlaku untuk Docker, sandbox, remote-browser, atau alur headless lainnya. Semua itu tetap menggunakan CDP mentah.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    Saat profil OAuth OpenAI Codex dikonfigurasi, doctor memeriksa endpoint otorisasi OpenAI untuk memverifikasi bahwa stack TLS Node/OpenSSL lokal dapat memvalidasi rantai sertifikat. Jika pemeriksaan gagal dengan kesalahan sertifikat (misalnya `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat self-signed), doctor mencetak panduan perbaikan khusus platform. Di macOS dengan Node Homebrew, perbaikannya biasanya `brew postinstall ca-certificates`. Dengan `--deep`, pemeriksaan berjalan meskipun gateway sehat.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    Jika sebelumnya Anda menambahkan pengaturan transport OpenAI lama di bawah `models.providers.openai-codex`, pengaturan itu dapat menutupi jalur provider OAuth Codex bawaan yang digunakan otomatis oleh rilis yang lebih baru. Doctor memperingatkan saat melihat pengaturan transport lama tersebut bersamaan dengan OAuth Codex agar Anda dapat menghapus atau menulis ulang penimpaan transport yang usang dan mendapatkan kembali perilaku routing/fallback bawaan. Proxy kustom dan penimpaan khusus header tetap didukung dan tidak memicu peringatan ini.
  </Accordion>
  <Accordion title="2f. Codex plugin route warnings">
    Saat Plugin Codex bawaan diaktifkan, doctor juga memeriksa apakah referensi model utama `openai-codex/*` masih diselesaikan melalui runner PI default. Kombinasi itu valid saat Anda ingin autentikasi OAuth/langganan Codex melalui PI, tetapi mudah tertukar dengan harness app-server Codex native. Doctor memperingatkan dan menunjuk ke bentuk app-server eksplisit: `openai/*` plus `agentRuntime.id: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor tidak memperbaiki ini secara otomatis karena kedua rute valid:

    - `openai-codex/*` + PI berarti "gunakan autentikasi OAuth/langganan Codex melalui runner OpenClaw normal."
    - `openai/*` + `runtime: "codex"` berarti "jalankan turn tersemat melalui app-server Codex native."
    - `/codex ...` berarti "kontrol atau ikat percakapan Codex native dari chat."
    - `/acp ...` atau `runtime: "acp"` berarti "gunakan adaptor ACP/acpx eksternal."

    Jika peringatan muncul, pilih rute yang Anda maksud dan edit konfigurasi secara manual. Biarkan peringatan apa adanya saat OAuth PI Codex memang disengaja.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor dapat memigrasikan tata letak lama di disk ke struktur saat ini:

    - Penyimpanan sesi + transkrip:
      - dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
    - Direktori agen:
      - dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
    - Status autentikasi WhatsApp (Baileys):
      - dari `~/.openclaw/credentials/*.json` lama (kecuali `oauth.json`)
      - ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (id akun default: `default`)

    Migrasi ini bersifat best-effort dan idempoten; doctor akan memunculkan peringatan saat meninggalkan folder lama sebagai cadangan. Gateway/CLI juga otomatis memigrasikan sesi lama + direktori agen saat startup sehingga riwayat/autentikasi/model masuk ke jalur per-agen tanpa menjalankan doctor secara manual. Autentikasi WhatsApp sengaja hanya dimigrasikan melalui `openclaw doctor`. Normalisasi provider/peta-provider talk kini membandingkan berdasarkan kesetaraan struktural, sehingga diff yang hanya berupa urutan key tidak lagi memicu perubahan no-op `doctor --fix` berulang.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor memindai semua manifes Plugin terpasang untuk key kapabilitas tingkat atas yang sudah tidak digunakan (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Saat ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts` dan menulis ulang file manifes di tempat. Migrasi ini idempoten; jika key `contracts` sudah memiliki nilai yang sama, key lama dihapus tanpa menggandakan data.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor juga memeriksa penyimpanan job Cron (`~/.openclaw/cron/jobs.json` secara default, atau `cron.store` saat ditimpa) untuk bentuk job lama yang masih diterima scheduler demi kompatibilitas.

    Pembersihan Cron saat ini mencakup:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - field payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
    - field delivery tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias delivery `provider` payload → `delivery.channel` eksplisit
    - job fallback Webhook `notify: true` lama yang sederhana → `delivery.mode="webhook"` eksplisit dengan `delivery.to=cron.webhook`

    Doctor hanya otomatis memigrasikan job `notify: true` saat dapat melakukannya tanpa mengubah perilaku. Jika sebuah job menggabungkan fallback notify lama dengan mode delivery non-webhook yang sudah ada, doctor memperingatkan dan membiarkan job tersebut untuk ditinjau manual.

  </Accordion>
  <Accordion title="3c. Session lock cleanup">
    Doctor memindai setiap direktori sesi agen untuk file write-lock basi — file yang tertinggal saat sesi keluar secara tidak normal. Untuk setiap file lock yang ditemukan, doctor melaporkan: jalur, PID, apakah PID masih hidup, umur lock, dan apakah dianggap basi (PID mati atau lebih lama dari 30 menit). Dalam mode `--fix` / `--repair`, doctor menghapus file lock basi secara otomatis; jika tidak, doctor mencetak catatan dan menginstruksikan Anda menjalankan ulang dengan `--fix`.
  </Accordion>
  <Accordion title="3d. Session transcript branch repair">
    Doctor memindai file JSONL sesi agen untuk bentuk branch duplikat yang dibuat oleh bug penulisan ulang transkrip prompt 2026.4.24: turn pengguna yang ditinggalkan dengan konteks runtime internal OpenClaw plus sibling aktif yang berisi prompt pengguna terlihat yang sama. Dalam mode `--fix` / `--repair`, doctor mencadangkan setiap file terdampak di sebelah file asli dan menulis ulang transkrip ke branch aktif sehingga riwayat gateway dan pembaca memori tidak lagi melihat turn duplikat.
  </Accordion>
  <Accordion title="4. State integrity checks (session persistence, routing, and safety)">
    Direktori status adalah batang otak operasional. Jika hilang, Anda kehilangan sesi, kredensial, log, dan konfigurasi (kecuali Anda memiliki cadangan di tempat lain).

    Doctor memeriksa:

    - **Direktori state tidak ada**: memperingatkan tentang kehilangan state yang katastrofik, meminta untuk membuat ulang direktori, dan mengingatkan bahwa data yang hilang tidak dapat dipulihkan.
    - **Izin direktori state**: memverifikasi kemampuan tulis; menawarkan untuk memperbaiki izin (dan mengeluarkan petunjuk `chown` saat ketidakcocokan pemilik/grup terdeteksi).
    - **Direktori state macOS yang disinkronkan cloud**: memperingatkan saat state berada di bawah iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau `~/Library/CloudStorage/...` karena path yang didukung sinkronisasi dapat menyebabkan I/O lebih lambat dan race penguncian/sinkronisasi.
    - **Direktori state Linux SD atau eMMC**: memperingatkan saat state berada pada sumber mount `mmcblk*`, karena I/O acak yang didukung SD atau eMMC dapat lebih lambat dan lebih cepat aus saat penulisan sesi dan kredensial.
    - **Direktori sesi tidak ada**: `sessions/` dan direktori penyimpanan sesi diperlukan untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
    - **Ketidakcocokan transkrip**: memperingatkan saat entri sesi terbaru tidak memiliki file transkrip.
    - **Sesi utama "JSONL 1 baris"**: menandai saat transkrip utama hanya memiliki satu baris (riwayat tidak bertambah).
    - **Beberapa direktori state**: memperingatkan saat beberapa folder `~/.openclaw` ada di berbagai direktori home atau saat `OPENCLAW_STATE_DIR` menunjuk ke tempat lain (riwayat dapat terpisah antarinstalasi).
    - **Pengingat mode jarak jauh**: jika `gateway.mode=remote`, doctor mengingatkan Anda untuk menjalankannya di host jarak jauh (state berada di sana).
    - **Izin file konfigurasi**: memperingatkan jika `~/.openclaw/openclaw.json` dapat dibaca oleh grup/dunia dan menawarkan untuk memperketatnya ke `600`.

  </Accordion>
  <Accordion title="5. Kesehatan auth model (kedaluwarsa OAuth)">
    Doctor memeriksa profil OAuth di penyimpanan auth, memperingatkan saat token akan kedaluwarsa/sudah kedaluwarsa, dan dapat menyegarkannya saat aman. Jika profil OAuth/token Anthropic sudah usang, doctor menyarankan kunci API Anthropic atau path setup-token Anthropic. Prompt penyegaran hanya muncul saat berjalan secara interaktif (TTY); `--non-interactive` melewati upaya penyegaran.

    Saat penyegaran OAuth gagal secara permanen (misalnya `refresh_token_reused`, `invalid_grant`, atau penyedia memberi tahu Anda untuk masuk lagi), doctor melaporkan bahwa re-auth diperlukan dan mencetak perintah `openclaw models auth login --provider ...` yang tepat untuk dijalankan.

    Doctor juga melaporkan profil auth yang sementara tidak dapat digunakan karena:

    - cooldown singkat (batas laju/timeout/kegagalan auth)
    - penonaktifan lebih lama (kegagalan penagihan/kredit)

  </Accordion>
  <Accordion title="6. Validasi model hooks">
    Jika `hooks.gmail.model` diatur, doctor memvalidasi referensi model terhadap katalog dan allowlist serta memperingatkan saat referensi tidak dapat di-resolve atau tidak diizinkan.
  </Accordion>
  <Accordion title="7. Perbaikan image sandbox">
    Saat sandboxing diaktifkan, doctor memeriksa image Docker dan menawarkan untuk membuat atau beralih ke nama lama jika image saat ini tidak ada.
  </Accordion>
  <Accordion title="7b. Dependensi runtime Plugin bawaan">
    Doctor memverifikasi dependensi runtime hanya untuk Plugin bawaan yang aktif dalam konfigurasi saat ini atau diaktifkan oleh default manifest bawaannya, misalnya `plugins.entries.discord.enabled: true`, `channels.discord.enabled: true` lama, `models.providers.*` / referensi model agen yang dikonfigurasi, atau Plugin bawaan yang diaktifkan secara default tanpa kepemilikan penyedia. Jika ada yang hilang, doctor melaporkan paket dan menginstalnya dalam mode `openclaw doctor --fix` / `openclaw doctor --repair`. Plugin eksternal tetap menggunakan `openclaw plugins install` / `openclaw plugins update`; doctor tidak menginstal dependensi untuk path Plugin arbitrer.

    Selama perbaikan doctor, instalasi npm dependensi runtime bawaan melaporkan progres spinner dalam sesi TTY dan progres baris periodik dalam output yang dipipe/headless. Startup Gateway dan pemuatan ulang konfigurasi memasuki mode plugin-plan sebelum mengimpor modul runtime Plugin bawaan; impor runtime normal hanya verifikasi dan tidak memunculkan perbaikan package-manager. Instalasi ini dibatasi pada root instalasi runtime Plugin, berjalan dengan skrip dinonaktifkan, tidak menulis package lock, dan dilindungi oleh kunci install-root sehingga startup CLI atau Gateway bersamaan tidak mengubah tree `node_modules` yang sama pada waktu yang sama. Kunci lama usang dari startup Docker/container yang dihentikan direklamasi saat metadata pemiliknya tidak dapat membuktikan inkarnasi proses saat ini dan file kunci sudah lama.

  </Accordion>
  <Accordion title="8. Migrasi layanan Gateway dan petunjuk pembersihan">
    Doctor mendeteksi layanan gateway lama (launchd/systemd/schtasks) dan menawarkan untuk menghapusnya serta menginstal layanan OpenClaw menggunakan port gateway saat ini. Doctor juga dapat memindai layanan tambahan yang mirip gateway dan mencetak petunjuk pembersihan. Layanan gateway OpenClaw bernama profil dianggap kelas utama dan tidak ditandai sebagai "tambahan."

    Di Linux, jika layanan gateway tingkat pengguna tidak ada tetapi layanan gateway OpenClaw tingkat sistem ada, doctor tidak menginstal layanan tingkat pengguna kedua secara otomatis. Periksa dengan `openclaw gateway status --deep` atau `openclaw doctor --deep`, lalu hapus duplikatnya atau atur `OPENCLAW_SERVICE_REPAIR_POLICY=external` saat supervisor sistem memiliki siklus hidup gateway.

  </Accordion>
  <Accordion title="8b. Migrasi Matrix startup">
    Saat akun channel Matrix memiliki migrasi state lama yang tertunda atau dapat ditindaklanjuti, doctor (dalam mode `--fix` / `--repair`) membuat snapshot pra-migrasi lalu menjalankan langkah migrasi best-effort: migrasi state Matrix lama dan persiapan state terenkripsi lama. Kedua langkah bersifat non-fatal; error dicatat dan startup berlanjut. Dalam mode hanya baca (`openclaw doctor` tanpa `--fix`) pemeriksaan ini dilewati sepenuhnya.
  </Accordion>
  <Accordion title="8c. Pairing perangkat dan drift auth">
    Doctor sekarang memeriksa state pairing perangkat sebagai bagian dari pemeriksaan kesehatan normal.

    Yang dilaporkan:

    - permintaan pairing pertama kali yang tertunda
    - peningkatan peran yang tertunda untuk perangkat yang sudah dipairing
    - peningkatan scope yang tertunda untuk perangkat yang sudah dipairing
    - perbaikan ketidakcocokan kunci publik saat id perangkat masih cocok tetapi identitas perangkat tidak lagi cocok dengan catatan yang disetujui
    - catatan pairing yang tidak memiliki token aktif untuk peran yang disetujui
    - token pairing yang scope-nya drift di luar baseline pairing yang disetujui
    - entri token perangkat cache lokal untuk mesin saat ini yang lebih lama dari rotasi token sisi gateway atau membawa metadata scope usang

    Doctor tidak menyetujui permintaan pairing atau merotasi token perangkat secara otomatis. Doctor mencetak langkah berikut yang tepat sebagai gantinya:

    - periksa permintaan tertunda dengan `openclaw devices list`
    - setujui permintaan yang tepat dengan `openclaw devices approve <requestId>`
    - rotasi token baru dengan `openclaw devices rotate --device <deviceId> --role <role>`
    - hapus dan setujui ulang catatan usang dengan `openclaw devices remove <deviceId>`

    Ini menutup celah umum "sudah dipairing tetapi masih diminta pairing": doctor sekarang membedakan pairing pertama kali dari peningkatan peran/scope yang tertunda dan dari drift token/identitas perangkat yang usang.

  </Accordion>
  <Accordion title="9. Peringatan keamanan">
    Doctor mengeluarkan peringatan saat penyedia terbuka untuk DM tanpa allowlist, atau saat kebijakan dikonfigurasi dengan cara yang berbahaya.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jika berjalan sebagai layanan pengguna systemd, doctor memastikan lingering diaktifkan agar gateway tetap hidup setelah logout.
  </Accordion>
  <Accordion title="11. Status workspace (skills, Plugin, dan direktori lama)">
    Doctor mencetak ringkasan state workspace untuk agen default:

    - **Status Skills**: menghitung skills yang memenuhi syarat, persyaratannya hilang, dan diblokir allowlist.
    - **Direktori workspace lama**: memperingatkan saat `~/openclaw` atau direktori workspace lama lainnya ada berdampingan dengan workspace saat ini.
    - **Status Plugin**: menghitung Plugin yang diaktifkan/dinonaktifkan/error; mencantumkan ID Plugin untuk error apa pun; melaporkan kemampuan Plugin bundle.
    - **Peringatan kompatibilitas Plugin**: menandai Plugin yang memiliki masalah kompatibilitas dengan runtime saat ini.
    - **Diagnostik Plugin**: menampilkan peringatan atau error waktu pemuatan yang dikeluarkan oleh registry Plugin.

  </Accordion>
  <Accordion title="11b. Ukuran file bootstrap">
    Doctor memeriksa apakah file bootstrap workspace (misalnya `AGENTS.md`, `CLAUDE.md`, atau file konteks lain yang disisipkan) mendekati atau melebihi anggaran karakter yang dikonfigurasi. Doctor melaporkan jumlah karakter mentah vs. tersisip per file, persentase pemotongan, penyebab pemotongan (`max/file` atau `max/total`), dan total karakter tersisip sebagai pecahan dari total anggaran. Saat file dipotong atau mendekati batas, doctor mencetak tips untuk menyesuaikan `agents.defaults.bootstrapMaxChars` dan `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pembersihan Plugin channel usang">
    Saat `openclaw doctor --fix` menghapus Plugin channel yang hilang, doctor juga menghapus konfigurasi berscope channel yang menggantung yang mereferensikan Plugin tersebut: entri `channels.<id>`, target heartbeat yang menamai channel, dan override `agents.*.models["<channel>/*"]`. Ini mencegah loop boot Gateway saat runtime channel sudah hilang tetapi konfigurasi masih meminta gateway untuk mengikat ke runtime tersebut.
  </Accordion>
  <Accordion title="11c. Penyelesaian shell">
    Doctor memeriksa apakah penyelesaian tab diinstal untuk shell saat ini (zsh, bash, fish, atau PowerShell):

    - Jika profil shell menggunakan pola penyelesaian dinamis yang lambat (`source <(openclaw completion ...)`), doctor meningkatkannya ke varian file cache yang lebih cepat.
    - Jika penyelesaian dikonfigurasi di profil tetapi file cache hilang, doctor meregenerasi cache secara otomatis.
    - Jika tidak ada penyelesaian yang dikonfigurasi sama sekali, doctor meminta untuk menginstalnya (hanya mode interaktif; dilewati dengan `--non-interactive`).

    Jalankan `openclaw completion --write-state` untuk meregenerasi cache secara manual.

  </Accordion>
  <Accordion title="12. Pemeriksaan auth Gateway (token lokal)">
    Doctor memeriksa kesiapan auth token gateway lokal.

    - Jika mode token membutuhkan token dan tidak ada sumber token, doctor menawarkan untuk membuatnya.
    - Jika `gateway.auth.token` dikelola SecretRef tetapi tidak tersedia, doctor memperingatkan dan tidak menimpanya dengan plaintext.
    - `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya saat tidak ada SecretRef token yang dikonfigurasi.

  </Accordion>
  <Accordion title="12b. Perbaikan hanya baca yang sadar SecretRef">
    Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku fail-fast runtime.

    - `openclaw doctor --fix` sekarang menggunakan model ringkasan SecretRef hanya baca yang sama seperti perintah keluarga status untuk perbaikan konfigurasi tertarget.
    - Contoh: perbaikan `allowFrom` / `groupAllowFrom` `@username` Telegram mencoba menggunakan kredensial bot yang dikonfigurasi saat tersedia.
    - Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia di path perintah saat ini, doctor melaporkan bahwa kredensial dikonfigurasi-tetapi-tidak-tersedia dan melewati resolusi otomatis alih-alih crash atau salah melaporkan token sebagai hilang.

  </Accordion>
  <Accordion title="13. Pemeriksaan kesehatan Gateway + restart">
    Doctor menjalankan pemeriksaan kesehatan dan menawarkan untuk me-restart gateway saat terlihat tidak sehat.
  </Accordion>
  <Accordion title="13b. Kesiapan pencarian memori">
    Doctor memeriksa apakah penyedia embedding pencarian memori yang dikonfigurasi siap untuk agen default. Perilakunya bergantung pada backend dan penyedia yang dikonfigurasi:

    - **Backend QMD**: memeriksa apakah biner `qmd` tersedia dan dapat dimulai. Jika tidak, mencetak panduan perbaikan termasuk paket npm dan opsi path biner manual.
    - **Penyedia lokal eksplisit**: memeriksa file model lokal atau URL model jarak jauh/dapat diunduh yang dikenali. Jika hilang, menyarankan untuk beralih ke penyedia jarak jauh.
    - **Penyedia jarak jauh eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa kunci API ada di lingkungan atau penyimpanan auth. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika hilang.
    - **Penyedia otomatis**: memeriksa ketersediaan model lokal terlebih dahulu, lalu mencoba setiap penyedia jarak jauh dalam urutan pemilihan otomatis.

    Saat hasil probe gateway yang di-cache tersedia (gateway sehat pada saat pemeriksaan), doctor merujuk silang hasilnya dengan konfigurasi yang terlihat oleh CLI dan mencatat setiap perbedaan. Doctor tidak memulai ping embedding baru pada jalur default; gunakan perintah status memori mendalam saat Anda menginginkan pemeriksaan penyedia secara langsung.

    Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

  </Accordion>
  <Accordion title="14. Peringatan status saluran">
    Jika gateway sehat, doctor menjalankan probe status saluran dan melaporkan peringatan dengan perbaikan yang disarankan.
  </Accordion>
  <Accordion title="15. Audit + perbaikan konfigurasi supervisor">
    Doctor memeriksa konfigurasi supervisor yang terpasang (launchd/systemd/schtasks) untuk default yang hilang atau kedaluwarsa (misalnya, dependensi systemd network-online dan penundaan mulai ulang). Saat menemukan ketidakcocokan, doctor merekomendasikan pembaruan dan dapat menulis ulang file layanan/tugas ke default saat ini.

    Catatan:

    - `openclaw doctor` meminta konfirmasi sebelum menulis ulang konfigurasi supervisor.
    - `openclaw doctor --yes` menerima prompt perbaikan default.
    - `openclaw doctor --repair` menerapkan perbaikan yang direkomendasikan tanpa prompt.
    - `openclaw doctor --repair --force` menimpa konfigurasi supervisor kustom.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` membuat doctor bersifat baca-saja untuk siklus hidup layanan gateway. Doctor tetap melaporkan kesehatan layanan dan menjalankan perbaikan non-layanan, tetapi melewati pemasangan/memulai/memulai ulang/bootstrap layanan, penulisan ulang konfigurasi supervisor, dan pembersihan layanan lama karena supervisor eksternal memiliki siklus hidup tersebut.
    - Di Linux, doctor tidak menulis ulang metadata perintah/entrypoint saat unit gateway systemd yang cocok sedang aktif. Doctor juga mengabaikan unit tambahan mirip gateway non-legacy yang tidak aktif selama pemindaian layanan duplikat sehingga file layanan pendamping tidak menimbulkan derau pembersihan.
    - Jika autentikasi token memerlukan token dan `gateway.auth.token` dikelola SecretRef, pemasangan/perbaikan layanan doctor memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang diselesaikan ke dalam metadata lingkungan layanan supervisor.
    - Doctor mendeteksi nilai lingkungan layanan terkelola yang didukung `.env`/SecretRef yang ditanamkan secara inline oleh instalasi LaunchAgent, systemd, atau Windows Scheduled Task lama dan menulis ulang metadata layanan agar nilai tersebut dimuat dari sumber runtime, bukan dari definisi supervisor.
    - Doctor mendeteksi saat perintah layanan masih menetapkan `--port` lama setelah `gateway.port` berubah dan menulis ulang metadata layanan ke port saat ini.
    - Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi tidak terselesaikan, doctor memblokir jalur pemasangan/perbaikan dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum diatur, doctor memblokir pemasangan/perbaikan hingga mode diatur secara eksplisit.
    - Untuk unit user-systemd Linux, pemeriksaan drift token doctor kini mencakup sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata autentikasi layanan.
    - Perbaikan layanan doctor menolak menulis ulang, menghentikan, atau memulai ulang layanan gateway dari biner OpenClaw yang lebih lama saat konfigurasi terakhir ditulis oleh versi yang lebih baru. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostik runtime + port Gateway">
    Doctor memeriksa runtime layanan (PID, status keluar terakhir) dan memperingatkan saat layanan terpasang tetapi sebenarnya tidak berjalan. Doctor juga memeriksa tabrakan port pada port gateway (default `18789`) dan melaporkan kemungkinan penyebabnya (gateway sudah berjalan, tunnel SSH).
  </Accordion>
  <Accordion title="17. Praktik terbaik runtime Gateway">
    Doctor memperingatkan saat layanan gateway berjalan di Bun atau path Node yang dikelola versi (`nvm`, `fnm`, `volta`, `asdf`, dll.). Saluran WhatsApp + Telegram memerlukan Node, dan path pengelola versi dapat rusak setelah peningkatan karena layanan tidak memuat init shell Anda. Doctor menawarkan migrasi ke instalasi Node sistem saat tersedia (Homebrew/apt/choco).

    Layanan yang baru dipasang atau diperbaiki mempertahankan root lingkungan eksplisit (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) dan direktori user-bin yang stabil, tetapi direktori fallback pengelola versi yang ditebak hanya ditulis ke PATH layanan saat direktori tersebut ada di disk. Ini menjaga PATH supervisor yang dihasilkan tetap selaras dengan audit PATH minimal yang sama yang dijalankan doctor nanti.

  </Accordion>
  <Accordion title="18. Penulisan konfigurasi + metadata wizard">
    Doctor menyimpan setiap perubahan konfigurasi dan membubuhkan metadata wizard untuk mencatat eksekusi doctor.
  </Accordion>
  <Accordion title="19. Tips ruang kerja (cadangan + sistem memori)">
    Doctor menyarankan sistem memori ruang kerja saat tidak ada dan mencetak tips cadangan jika ruang kerja belum berada di bawah git.

    Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap tentang struktur ruang kerja dan cadangan git (disarankan GitHub atau GitLab privat).

  </Accordion>
</AccordionGroup>

## Terkait

- [Runbook Gateway](/id/gateway)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
