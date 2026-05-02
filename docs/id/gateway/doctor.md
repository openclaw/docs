---
read_when:
    - Menambahkan atau memodifikasi migrasi doctor
    - Memperkenalkan perubahan konfigurasi yang merusak kompatibilitas
sidebarTitle: Doctor
summary: 'Perintah doctor: pemeriksaan kesehatan, migrasi konfigurasi, dan langkah perbaikan'
title: Dokter
x-i18n:
    generated_at: "2026-05-02T09:20:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff4ab00fd6a11588abe790350fe139bc49f61e688bcd741389dd63732aa4430c
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

    Pindai layanan sistem untuk instalasi Gateway tambahan (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Jika Anda ingin meninjau perubahan sebelum menulis, buka file konfigurasi terlebih dahulu:

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
    - Normalisasi konfigurasi untuk nilai lama.
    - Migrasi konfigurasi Talk dari field datar lama `talk.*` ke `talk.provider` + `talk.providers.<provider>`.
    - Pemeriksaan migrasi browser untuk konfigurasi ekstensi Chrome lama dan kesiapan MCP Chrome.
    - Peringatan override penyedia OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Peringatan shadowing OAuth Codex (`models.providers.openai-codex`).
    - Pemeriksaan prasyarat TLS OAuth untuk profil OAuth OpenAI Codex.
    - Peringatan allowlist Plugin/alat saat `plugins.allow` bersifat restriktif tetapi kebijakan alat masih meminta wildcard atau alat milik plugin.
    - Migrasi status lama di disk (sesi/direktori agen/autentikasi WhatsApp).
    - Migrasi kunci kontrak manifest plugin lama (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrasi penyimpanan Cron lama (`jobId`, `schedule.cron`, field delivery/payload tingkat atas, payload `provider`, job fallback Webhook sederhana `notify: true`).
    - Migrasi runtime-policy agen lama ke `agents.defaults.agentRuntime` dan `agents.list[].agentRuntime`.
    - Pembersihan konfigurasi plugin usang saat plugin diaktifkan; saat `plugins.enabled=false`, referensi plugin usang diperlakukan sebagai konfigurasi containment inert dan dipertahankan.

  </Accordion>
  <Accordion title="State and integrity">
    - Inspeksi file kunci sesi dan pembersihan kunci usang.
    - Perbaikan transkrip sesi untuk cabang prompt-rewrite duplikat yang dibuat oleh build 2026.4.24 yang terdampak.
    - Deteksi tombstone pemulihan-restart subagen yang macet, dengan dukungan `--fix` untuk membersihkan flag pemulihan yang dibatalkan dan usang agar startup tidak terus memperlakukan child sebagai restart-dibatalkan.
    - Pemeriksaan integritas status dan izin (sesi, transkrip, direktori status).
    - Pemeriksaan izin file konfigurasi (chmod 600) saat berjalan secara lokal.
    - Kesehatan autentikasi model: memeriksa kedaluwarsa OAuth, dapat menyegarkan token yang hampir kedaluwarsa, dan melaporkan status cooldown/dinonaktifkan auth-profile.
    - Deteksi direktori workspace tambahan (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Perbaikan image sandbox saat sandboxing diaktifkan.
    - Migrasi layanan lama dan deteksi Gateway tambahan.
    - Migrasi status lama channel Matrix (dalam mode `--fix` / `--repair`).
    - Pemeriksaan runtime Gateway (layanan terinstal tetapi tidak berjalan; label launchd yang di-cache).
    - Peringatan status channel (diprobe dari Gateway yang sedang berjalan).
    - Audit konfigurasi supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
    - Pembersihan lingkungan proxy tertanam untuk layanan Gateway yang menangkap nilai shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` saat instalasi atau pembaruan.
    - Pemeriksaan praktik terbaik runtime Gateway (Node vs Bun, path version-manager).
    - Diagnostik bentrok port Gateway (default `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Peringatan keamanan untuk kebijakan DM terbuka.
    - Pemeriksaan autentikasi Gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada sumber token; tidak menimpa konfigurasi SecretRef token).
    - Deteksi masalah pairing perangkat (permintaan pair pertama kali yang tertunda, peningkatan peran/cakupan yang tertunda, drift cache token perangkat lokal yang usang, dan drift autentikasi catatan pair).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Pemeriksaan systemd linger di Linux.
    - Pemeriksaan ukuran file bootstrap workspace (peringatan pemotongan/hampir batas untuk file konteks).
    - Pemeriksaan status penyelesaian shell dan instalasi/upgrade otomatis.
    - Pemeriksaan kesiapan penyedia embedding pencarian memori (model lokal, kunci API jarak jauh, atau biner QMD).
    - Pemeriksaan instalasi sumber (ketidakcocokan workspace pnpm, aset UI hilang, biner tsx hilang).
    - Menulis konfigurasi yang diperbarui + metadata wizard.

  </Accordion>
</AccordionGroup>

## Backfill dan reset UI Dreams

Scene Dreams Control UI menyertakan tindakan **Backfill**, **Reset**, dan **Clear Grounded** untuk alur kerja Dreaming grounded. Tindakan ini menggunakan metode RPC bergaya doctor Gateway, tetapi **bukan** bagian dari perbaikan/migrasi CLI `openclaw doctor`.

Yang dilakukan:

- **Backfill** memindai file historis `memory/YYYY-MM-DD.md` di workspace aktif, menjalankan pass diary REM grounded, dan menulis entri backfill yang dapat dibalik ke `DREAMS.md`.
- **Reset** hanya menghapus entri diary backfill yang ditandai tersebut dari `DREAMS.md`.
- **Clear Grounded** hanya menghapus entri jangka pendek khusus grounded yang sudah di-stage, yang berasal dari replay historis dan belum mengakumulasi recall live atau dukungan harian.

Yang **tidak** dilakukan sendiri:

- tindakan ini tidak mengedit `MEMORY.md`
- tindakan ini tidak menjalankan migrasi doctor penuh
- tindakan ini tidak otomatis men-stage kandidat grounded ke penyimpanan promosi jangka pendek live kecuali Anda secara eksplisit menjalankan path CLI staged terlebih dahulu

Jika Anda ingin replay historis grounded memengaruhi lane promosi mendalam normal, gunakan alur CLI sebagai gantinya:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Itu men-stage kandidat durable grounded ke penyimpanan Dreaming jangka pendek sambil mempertahankan `DREAMS.md` sebagai permukaan peninjauan.

## Perilaku terperinci dan alasan

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Jika ini adalah checkout git dan doctor berjalan secara interaktif, doctor menawarkan untuk memperbarui (fetch/rebase/build) sebelum menjalankan doctor.
  </Accordion>
  <Accordion title="1. Config normalization">
    Jika konfigurasi berisi bentuk nilai lama (misalnya `messages.ackReaction` tanpa override khusus channel), doctor menormalisasikannya ke skema saat ini.

    Itu mencakup field datar Talk lama. Konfigurasi Talk publik saat ini adalah `talk.provider` + `talk.providers.<provider>`. Doctor menulis ulang bentuk lama `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ke map penyedia.

    Doctor juga memperingatkan saat `plugins.allow` tidak kosong dan kebijakan alat menggunakan
    entri alat wildcard atau milik plugin. `tools.allow: ["*"]` hanya cocok dengan alat
    dari plugin yang benar-benar dimuat; ini tidak melewati allowlist plugin eksklusif.

  </Accordion>
  <Accordion title="2. Legacy config key migrations">
    Saat konfigurasi berisi kunci yang sudah deprecated, perintah lain menolak berjalan dan meminta Anda menjalankan `openclaw doctor`.

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
    - Untuk channel dengan `accounts` bernama tetapi masih memiliki nilai channel tingkat atas akun tunggal lama, pindahkan nilai yang tercakup akun itu ke akun yang dipromosikan yang dipilih untuk channel tersebut (`accounts.default` untuk sebagian besar channel; Matrix dapat mempertahankan target bernama/default yang cocok jika sudah ada)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - hapus `agents.defaults.llm`; gunakan `models.providers.<id>.timeoutSeconds` untuk batas waktu provider/model yang lambat
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - hapus `browser.relayBindHost` (pengaturan relai extension lama)
    - `models.providers.*.api: "openai"` lama → `"openai-completions"` (startup Gateway juga melewati provider yang `api`-nya disetel ke nilai enum masa depan atau tidak dikenal, alih-alih gagal tertutup)

    Peringatan doctor juga menyertakan panduan default akun untuk channel multi-akun:

    - Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa routing fallback dapat memilih akun yang tidak diharapkan.
    - Jika `channels.<channel>.defaultAccount` disetel ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

  </Accordion>
  <Accordion title="2b. Penggantian provider OpenCode">
    Jika Anda menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go` secara manual, itu menggantikan katalog OpenCode bawaan dari `@mariozechner/pi-ai`. Hal itu dapat memaksa model ke API yang salah atau meniadakan biaya. Doctor memperingatkan agar Anda dapat menghapus penggantian tersebut dan memulihkan routing API + biaya per model.
  </Accordion>
  <Accordion title="2c. Migrasi browser dan kesiapan Chrome MCP">
    Jika konfigurasi browser Anda masih menunjuk ke path extension Chrome yang telah dihapus, doctor menormalkannya ke model lampiran Chrome MCP host-lokal saat ini:

    - `browser.profiles.*.driver: "extension"` menjadi `"existing-session"`
    - `browser.relayBindHost` dihapus

    Doctor juga mengaudit path Chrome MCP host-lokal saat Anda menggunakan `defaultProfile: "user"` atau profil `existing-session` yang dikonfigurasi:

    - memeriksa apakah Google Chrome terpasang di host yang sama untuk profil koneksi otomatis default
    - memeriksa versi Chrome yang terdeteksi dan memperingatkan jika di bawah Chrome 144
    - mengingatkan Anda untuk mengaktifkan debugging jarak jauh di halaman inspeksi browser (misalnya `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, atau `edge://inspect/#remote-debugging`)

    Doctor tidak dapat mengaktifkan pengaturan sisi Chrome untuk Anda. Chrome MCP host-lokal tetap membutuhkan:

    - browser berbasis Chromium 144+ pada host gateway/node
    - browser berjalan secara lokal
    - debugging jarak jauh diaktifkan di browser tersebut
    - menyetujui prompt persetujuan lampiran pertama di browser

    Kesiapan di sini hanya tentang prasyarat lampiran lokal. Existing-session mempertahankan batas rute Chrome MCP saat ini; rute lanjutan seperti `responsebody`, ekspor PDF, intersepsi unduhan, dan aksi batch tetap membutuhkan browser terkelola atau profil CDP mentah.

    Pemeriksaan ini **tidak** berlaku untuk Docker, sandbox, remote-browser, atau alur headless lainnya. Alur tersebut tetap menggunakan CDP mentah.

  </Accordion>
  <Accordion title="2d. Prasyarat TLS OAuth">
    Saat profil OAuth OpenAI Codex dikonfigurasi, doctor memeriksa endpoint otorisasi OpenAI untuk memverifikasi bahwa stack TLS Node/OpenSSL lokal dapat memvalidasi rantai sertifikat. Jika pemeriksaan gagal dengan kesalahan sertifikat (misalnya `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat yang ditandatangani sendiri), doctor mencetak panduan perbaikan khusus platform. Di macOS dengan Node dari Homebrew, perbaikannya biasanya `brew postinstall ca-certificates`. Dengan `--deep`, pemeriksaan tetap berjalan meskipun gateway sehat.
  </Accordion>
  <Accordion title="2e. Penggantian provider OAuth Codex">
    Jika sebelumnya Anda menambahkan pengaturan transport OpenAI lama di bawah `models.providers.openai-codex`, pengaturan tersebut dapat menutupi path provider OAuth Codex bawaan yang digunakan otomatis oleh rilis yang lebih baru. Doctor memperingatkan saat melihat pengaturan transport lama tersebut berdampingan dengan OAuth Codex agar Anda dapat menghapus atau menulis ulang penggantian transport yang usang dan mendapatkan kembali perilaku routing/fallback bawaan. Proxy kustom dan penggantian khusus header tetap didukung dan tidak memicu peringatan ini.
  </Accordion>
  <Accordion title="2f. Peringatan rute Plugin Codex">
    Saat Plugin Codex bawaan diaktifkan, doctor juga memeriksa apakah ref model primer `openai-codex/*` masih di-resolve melalui runner PI default. Kombinasi itu valid saat Anda menginginkan autentikasi OAuth/langganan Codex melalui PI, tetapi mudah tertukar dengan harness app-server Codex native. Doctor memperingatkan dan menunjuk ke bentuk app-server eksplisit: `openai/*` plus `agentRuntime.id: "codex"` atau `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor tidak memperbaikinya secara otomatis karena kedua rute valid:

    - `openai-codex/*` + PI berarti "gunakan autentikasi OAuth/langganan Codex melalui runner OpenClaw normal."
    - `openai/*` + `agentRuntime.id: "codex"` berarti "jalankan giliran tertanam melalui app-server Codex native."
    - `/codex ...` berarti "kendalikan atau ikat percakapan Codex native dari chat."
    - `/acp ...` atau `runtime: "acp"` berarti "gunakan adapter ACP/acpx eksternal."

    Jika peringatan muncul, pilih rute yang Anda maksud dan edit konfigurasi secara manual. Biarkan peringatan apa adanya saat OAuth PI Codex memang disengaja.

  </Accordion>
  <Accordion title="3. Migrasi state lama (tata letak disk)">
    Doctor dapat memigrasikan tata letak on-disk lama ke struktur saat ini:

    - Penyimpanan sesi + transkrip:
      - dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
    - Direktori agen:
      - dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
    - State autentikasi WhatsApp (Baileys):
      - dari `~/.openclaw/credentials/*.json` lama (kecuali `oauth.json`)
      - ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (id akun default: `default`)

    Migrasi ini bersifat upaya terbaik dan idempoten; doctor akan mengeluarkan peringatan saat meninggalkan folder lama sebagai cadangan. Gateway/CLI juga memigrasikan otomatis sesi lama + direktori agen saat startup sehingga riwayat/autentikasi/model masuk ke path per agen tanpa perlu menjalankan doctor secara manual. Autentikasi WhatsApp sengaja hanya dimigrasikan melalui `openclaw doctor`. Normalisasi provider/peta-provider Talk sekarang membandingkan berdasarkan kesetaraan struktural, sehingga diff yang hanya berupa urutan key tidak lagi memicu perubahan `doctor --fix` no-op berulang.

  </Accordion>
  <Accordion title="3a. Migrasi manifest Plugin lama">
    Doctor memindai semua manifest Plugin yang terpasang untuk key kapabilitas tingkat atas yang sudah tidak digunakan (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Saat ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts` dan menulis ulang file manifest di tempat. Migrasi ini idempoten; jika key `contracts` sudah memiliki nilai yang sama, key lama dihapus tanpa menggandakan data.
  </Accordion>
  <Accordion title="3b. Migrasi penyimpanan cron lama">
    Doctor juga memeriksa penyimpanan tugas cron (`~/.openclaw/cron/jobs.json` secara default, atau `cron.store` saat diganti) untuk bentuk tugas lama yang masih diterima scheduler demi kompatibilitas.

    Pembersihan cron saat ini mencakup:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - field payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
    - field pengiriman tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias pengiriman payload `provider` → `delivery.channel` eksplisit
    - tugas fallback webhook `notify: true` lama yang sederhana → `delivery.mode="webhook"` eksplisit dengan `delivery.to=cron.webhook`

    Doctor hanya memigrasikan otomatis tugas `notify: true` saat dapat melakukannya tanpa mengubah perilaku. Jika sebuah tugas menggabungkan fallback notify lama dengan mode pengiriman non-webhook yang sudah ada, doctor memperingatkan dan membiarkan tugas tersebut untuk ditinjau manual.

    Di Linux, doctor juga memperingatkan saat crontab pengguna masih memanggil `~/.openclaw/bin/ensure-whatsapp.sh` lama. Skrip host-lokal itu tidak dipelihara oleh OpenClaw saat ini dan dapat menulis pesan `Gateway inactive` palsu ke `~/.openclaw/logs/whatsapp-health.log` saat cron tidak dapat menjangkau bus pengguna systemd. Hapus entri crontab usang dengan `crontab -e`; gunakan `openclaw channels status --probe`, `openclaw doctor`, dan `openclaw gateway status` untuk pemeriksaan kesehatan saat ini.

  </Accordion>
  <Accordion title="3c. Pembersihan kunci sesi">
    Doctor memindai setiap direktori sesi agen untuk mencari file kunci tulis yang kedaluwarsa — file yang tertinggal ketika sesi keluar secara tidak normal. Untuk setiap file kunci yang ditemukan, Doctor melaporkan: jalur, PID, apakah PID masih hidup, usia kunci, dan apakah kunci dianggap kedaluwarsa (PID mati atau lebih lama dari 30 menit). Dalam mode `--fix` / `--repair`, Doctor menghapus file kunci kedaluwarsa secara otomatis; jika tidak, Doctor mencetak catatan dan menginstruksikan Anda untuk menjalankan ulang dengan `--fix`.
  </Accordion>
  <Accordion title="3d. Perbaikan cabang transkrip sesi">
    Doctor memindai file JSONL sesi agen untuk mencari bentuk cabang duplikat yang dibuat oleh bug penulisan ulang transkrip prompt 2026.4.24: giliran pengguna yang ditinggalkan dengan konteks runtime internal OpenClaw ditambah sibling aktif yang berisi prompt pengguna terlihat yang sama. Dalam mode `--fix` / `--repair`, doctor mencadangkan setiap file terdampak di sebelah file asli dan menulis ulang transkrip ke cabang aktif sehingga riwayat Gateway dan pembaca memori tidak lagi melihat giliran duplikat.
  </Accordion>
  <Accordion title="4. Pemeriksaan integritas status (persistensi sesi, perutean, dan keamanan)">
    Direktori status adalah batang otak operasional. Jika direktori ini hilang, Anda kehilangan sesi, kredensial, log, dan konfigurasi (kecuali Anda memiliki cadangan di tempat lain).

    Doctor memeriksa:

    - **Direktori status hilang**: memperingatkan tentang kehilangan status yang katastrofik, meminta untuk membuat ulang direktori, dan mengingatkan Anda bahwa data yang hilang tidak dapat dipulihkan.
    - **Izin direktori status**: memverifikasi kemampuan tulis; menawarkan untuk memperbaiki izin (dan mengeluarkan petunjuk `chown` ketika ketidakcocokan pemilik/grup terdeteksi).
    - **Direktori status tersinkron cloud macOS**: memperingatkan ketika status mengarah ke bawah iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau `~/Library/CloudStorage/...` karena jalur berbasis sinkronisasi dapat menyebabkan I/O lebih lambat dan race kunci/sinkronisasi.
    - **Direktori status SD atau eMMC Linux**: memperingatkan ketika status mengarah ke sumber mount `mmcblk*`, karena I/O acak berbasis SD atau eMMC dapat lebih lambat dan lebih cepat aus saat penulisan sesi dan kredensial.
    - **Direktori sesi hilang**: `sessions/` dan direktori penyimpanan sesi diperlukan untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
    - **Ketidakcocokan transkrip**: memperingatkan ketika entri sesi terbaru memiliki file transkrip yang hilang.
    - **Sesi utama "JSONL 1 baris"**: menandai ketika transkrip utama hanya memiliki satu baris (riwayat tidak bertambah).
    - **Beberapa direktori status**: memperingatkan ketika beberapa folder `~/.openclaw` ada di berbagai direktori home atau ketika `OPENCLAW_STATE_DIR` menunjuk ke lokasi lain (riwayat dapat terpecah antar instalasi).
    - **Pengingat mode remote**: jika `gateway.mode=remote`, doctor mengingatkan Anda untuk menjalankannya di host remote (status berada di sana).
    - **Izin file konfigurasi**: memperingatkan jika `~/.openclaw/openclaw.json` dapat dibaca oleh grup/dunia dan menawarkan untuk memperketat ke `600`.

  </Accordion>
  <Accordion title="5. Kesehatan auth model (kedaluwarsa OAuth)">
    Doctor memeriksa profil OAuth di penyimpanan auth, memperingatkan ketika token akan kedaluwarsa/sudah kedaluwarsa, dan dapat menyegarkannya ketika aman. Jika profil OAuth/token Anthropic kedaluwarsa, Doctor menyarankan kunci API Anthropic atau jalur setup-token Anthropic. Prompt penyegaran hanya muncul saat berjalan secara interaktif (TTY); `--non-interactive` melewati upaya penyegaran.

    Ketika penyegaran OAuth gagal secara permanen (misalnya `refresh_token_reused`, `invalid_grant`, atau penyedia meminta Anda masuk lagi), doctor melaporkan bahwa re-auth diperlukan dan mencetak perintah persis `openclaw models auth login --provider ...` yang harus dijalankan.

    Doctor juga melaporkan profil auth yang untuk sementara tidak dapat digunakan karena:

    - cooldown singkat (batas laju/timeout/kegagalan auth)
    - penonaktifan lebih lama (kegagalan penagihan/kredit)

  </Accordion>
  <Accordion title="6. Validasi model hook">
    Jika `hooks.gmail.model` disetel, doctor memvalidasi referensi model terhadap katalog dan allowlist serta memperingatkan ketika referensi tidak dapat di-resolve atau tidak diizinkan.
  </Accordion>
  <Accordion title="7. Perbaikan image sandbox">
    Ketika sandboxing diaktifkan, doctor memeriksa image Docker dan menawarkan untuk membangun atau beralih ke nama legacy jika image saat ini hilang.
  </Accordion>
  <Accordion title="7b. Pembersihan instalasi Plugin">
    Doctor menghapus status staging dependensi plugin legacy yang dihasilkan OpenClaw dalam mode `openclaw doctor --fix` / `openclaw doctor --repair`. Ini mencakup root dependensi yang dihasilkan yang sudah kedaluwarsa, direktori tahap instalasi lama, dan debris lokal paket dari kode perbaikan dependensi bundled-plugin sebelumnya.

    Doctor juga dapat menginstal ulang plugin unduhan yang dikonfigurasi ketika konfigurasi merujuknya tetapi registry plugin lokal tidak dapat menemukannya. Startup Gateway dan pemuatan ulang konfigurasi tidak menjalankan package manager; instalasi plugin tetap merupakan pekerjaan doctor/install/update eksplisit.

  </Accordion>
  <Accordion title="8. Migrasi layanan Gateway dan petunjuk pembersihan">
    Doctor mendeteksi layanan gateway legacy (launchd/systemd/schtasks) dan menawarkan untuk menghapusnya serta menginstal layanan OpenClaw menggunakan port gateway saat ini. Doctor juga dapat memindai layanan tambahan yang mirip gateway dan mencetak petunjuk pembersihan. Layanan Gateway OpenClaw bernama profil dianggap kelas utama dan tidak ditandai sebagai "tambahan."

    Di Linux, jika layanan gateway tingkat pengguna hilang tetapi layanan Gateway OpenClaw tingkat sistem ada, doctor tidak menginstal layanan tingkat pengguna kedua secara otomatis. Periksa dengan `openclaw gateway status --deep` atau `openclaw doctor --deep`, lalu hapus duplikat atau setel `OPENCLAW_SERVICE_REPAIR_POLICY=external` ketika supervisor sistem memiliki siklus hidup gateway.

  </Accordion>
  <Accordion title="8b. Migrasi Startup Matrix">
    Ketika akun channel Matrix memiliki migrasi status legacy yang tertunda atau dapat ditindaklanjuti, doctor (dalam mode `--fix` / `--repair`) membuat snapshot pra-migrasi lalu menjalankan langkah migrasi best-effort: migrasi status Matrix legacy dan persiapan status terenkripsi legacy. Kedua langkah bersifat non-fatal; error dicatat dan startup berlanjut. Dalam mode baca-saja (`openclaw doctor` tanpa `--fix`) pemeriksaan ini dilewati sepenuhnya.
  </Accordion>
  <Accordion title="8c. Pairing perangkat dan drift auth">
    Doctor kini memeriksa status pairing perangkat sebagai bagian dari pemeriksaan kesehatan normal.

    Yang dilaporkan:

    - permintaan pairing pertama kali yang tertunda
    - upgrade peran yang tertunda untuk perangkat yang sudah dipasangkan
    - upgrade cakupan yang tertunda untuk perangkat yang sudah dipasangkan
    - perbaikan ketidakcocokan kunci publik ketika id perangkat masih cocok tetapi identitas perangkat tidak lagi cocok dengan catatan yang disetujui
    - catatan pasangan yang kehilangan token aktif untuk peran yang disetujui
    - token pasangan yang cakupannya drift keluar dari baseline pairing yang disetujui
    - entri token perangkat cache lokal untuk mesin saat ini yang lebih lama dari rotasi token sisi gateway atau membawa metadata cakupan kedaluwarsa

    Doctor tidak menyetujui permintaan pairing secara otomatis atau merotasi token perangkat secara otomatis. Sebagai gantinya, Doctor mencetak langkah berikutnya yang tepat:

    - periksa permintaan tertunda dengan `openclaw devices list`
    - setujui permintaan tepat dengan `openclaw devices approve <requestId>`
    - rotasi token baru dengan `openclaw devices rotate --device <deviceId> --role <role>`
    - hapus dan setujui ulang catatan kedaluwarsa dengan `openclaw devices remove <deviceId>`

    Ini menutup celah umum "sudah dipasangkan tetapi masih mendapatkan pairing required": doctor kini membedakan pairing pertama kali dari upgrade peran/cakupan yang tertunda dan dari drift token/identitas-perangkat yang kedaluwarsa.

  </Accordion>
  <Accordion title="9. Peringatan keamanan">
    Doctor mengeluarkan peringatan ketika penyedia terbuka untuk DM tanpa allowlist, atau ketika kebijakan dikonfigurasi dengan cara yang berbahaya.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jika berjalan sebagai layanan pengguna systemd, doctor memastikan lingering diaktifkan agar gateway tetap hidup setelah logout.
  </Accordion>
  <Accordion title="11. Status workspace (Skills, plugin, dan direktori legacy)">
    Doctor mencetak ringkasan status workspace untuk agen default:

    - **Status Skills**: menghitung skill yang memenuhi syarat, persyaratan-hilang, dan diblokir-allowlist.
    - **Direktori workspace legacy**: memperingatkan ketika `~/openclaw` atau direktori workspace legacy lain ada berdampingan dengan workspace saat ini.
    - **Status Plugin**: menghitung plugin yang diaktifkan/dinonaktifkan/error; mencantumkan ID plugin untuk setiap error; melaporkan kemampuan plugin bundle.
    - **Peringatan kompatibilitas Plugin**: menandai plugin yang memiliki masalah kompatibilitas dengan runtime saat ini.
    - **Diagnostik Plugin**: menampilkan peringatan atau error waktu muat yang dikeluarkan oleh registry plugin.

  </Accordion>
  <Accordion title="11b. Ukuran file bootstrap">
    Doctor memeriksa apakah file bootstrap workspace (misalnya `AGENTS.md`, `CLAUDE.md`, atau file konteks terinjeksi lain) mendekati atau melebihi anggaran karakter yang dikonfigurasi. Doctor melaporkan jumlah karakter mentah vs. terinjeksi per file, persentase pemotongan, penyebab pemotongan (`max/file` atau `max/total`), dan total karakter terinjeksi sebagai fraksi dari total anggaran. Ketika file dipotong atau mendekati batas, doctor mencetak tips untuk menyetel `agents.defaults.bootstrapMaxChars` dan `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pembersihan plugin channel kedaluwarsa">
    Ketika `openclaw doctor --fix` menghapus plugin channel yang hilang, Doctor juga menghapus konfigurasi bercakupan channel yang menggantung yang merujuk plugin tersebut: entri `channels.<id>`, target Heartbeat yang menamai channel, dan override `agents.*.models["<channel>/*"]`. Ini mencegah boot loop Gateway ketika runtime channel hilang tetapi konfigurasi masih meminta gateway untuk mengikat ke sana.
  </Accordion>
  <Accordion title="11c. Pelengkapan shell">
    Doctor memeriksa apakah pelengkapan tab terinstal untuk shell saat ini (zsh, bash, fish, atau PowerShell):

    - Jika profil shell menggunakan pola pelengkapan dinamis yang lambat (`source <(openclaw completion ...)`), doctor meng-upgrade-nya ke varian file cache yang lebih cepat.
    - Jika pelengkapan dikonfigurasi di profil tetapi file cache hilang, doctor membuat ulang cache secara otomatis.
    - Jika tidak ada pelengkapan yang dikonfigurasi sama sekali, doctor meminta untuk menginstalnya (hanya mode interaktif; dilewati dengan `--non-interactive`).

    Jalankan `openclaw completion --write-state` untuk membuat ulang cache secara manual.

  </Accordion>
  <Accordion title="12. Pemeriksaan auth Gateway (token lokal)">
    Doctor memeriksa kesiapan auth token gateway lokal.

    - Jika mode token membutuhkan token dan tidak ada sumber token, doctor menawarkan untuk membuatnya.
    - Jika `gateway.auth.token` dikelola SecretRef tetapi tidak tersedia, doctor memperingatkan dan tidak menimpanya dengan plaintext.
    - `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya ketika tidak ada SecretRef token yang dikonfigurasi.

  </Accordion>
  <Accordion title="12b. Perbaikan baca-saja yang sadar SecretRef">
    Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku fail-fast runtime.

    - `openclaw doctor --fix` kini menggunakan model ringkasan SecretRef baca-saja yang sama seperti perintah keluarga status untuk perbaikan konfigurasi tertarget.
    - Contoh: perbaikan Telegram `allowFrom` / `groupAllowFrom` `@username` mencoba menggunakan kredensial bot yang dikonfigurasi ketika tersedia.
    - Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia di jalur perintah saat ini, doctor melaporkan bahwa kredensial dikonfigurasi-tetapi-tidak-tersedia dan melewati resolusi otomatis alih-alih crash atau salah melaporkan token sebagai hilang.

  </Accordion>
  <Accordion title="13. Pemeriksaan kesehatan Gateway + restart">
    Doctor menjalankan pemeriksaan kesehatan dan menawarkan untuk merestart gateway ketika terlihat tidak sehat.
  </Accordion>
  <Accordion title="13b. Kesiapan pencarian memori">
    Doctor memeriksa apakah penyedia embedding pencarian memori yang dikonfigurasi siap untuk agen default. Perilaku bergantung pada backend dan penyedia yang dikonfigurasi:

    - **Backend QMD**: memeriksa apakah biner `qmd` tersedia dan dapat dijalankan. Jika tidak, mencetak panduan perbaikan termasuk paket npm dan opsi path biner manual.
    - **Penyedia lokal eksplisit**: memeriksa file model lokal atau URL model jarak jauh/yang dapat diunduh yang dikenali. Jika hilang, menyarankan beralih ke penyedia jarak jauh.
    - **Penyedia jarak jauh eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa API key tersedia di lingkungan atau penyimpanan auth. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika hilang.
    - **Penyedia otomatis**: memeriksa ketersediaan model lokal terlebih dahulu, lalu mencoba setiap penyedia jarak jauh sesuai urutan pemilihan otomatis.

    Saat hasil probe Gateway yang di-cache tersedia (Gateway sehat pada saat pemeriksaan), doctor membandingkan hasilnya dengan konfigurasi yang terlihat oleh CLI dan mencatat setiap ketidaksesuaian. Doctor tidak memulai ping embedding baru pada path default; gunakan perintah status memori mendalam saat Anda menginginkan pemeriksaan penyedia live.

    Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

  </Accordion>
  <Accordion title="14. Peringatan status channel">
    Jika Gateway sehat, doctor menjalankan probe status channel dan melaporkan peringatan dengan perbaikan yang disarankan.
  </Accordion>
  <Accordion title="15. Audit + perbaikan konfigurasi supervisor">
    Doctor memeriksa konfigurasi supervisor yang terpasang (launchd/systemd/schtasks) untuk default yang hilang atau usang (misalnya dependensi network-online systemd dan jeda restart). Saat menemukan ketidakcocokan, doctor merekomendasikan pembaruan dan dapat menulis ulang file service/task ke default saat ini.

    Catatan:

    - `openclaw doctor` meminta konfirmasi sebelum menulis ulang konfigurasi supervisor.
    - `openclaw doctor --yes` menerima prompt perbaikan default.
    - `openclaw doctor --repair` menerapkan perbaikan yang direkomendasikan tanpa prompt.
    - `openclaw doctor --repair --force` menimpa konfigurasi supervisor kustom.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` menjaga doctor tetap read-only untuk siklus hidup service Gateway. Doctor tetap melaporkan kesehatan service dan menjalankan perbaikan non-service, tetapi melewati install/start/restart/bootstrap service, penulisan ulang konfigurasi supervisor, dan pembersihan service lama karena supervisor eksternal memiliki siklus hidup tersebut.
    - Di Linux, doctor tidak menulis ulang metadata command/entrypoint saat unit systemd Gateway yang cocok sedang aktif. Doctor juga mengabaikan unit ekstra yang mirip Gateway non-legacy yang tidak aktif selama pemindaian service duplikat sehingga file service pendamping tidak menimbulkan noise pembersihan.
    - Jika auth token memerlukan token dan `gateway.auth.token` dikelola SecretRef, install/repair service doctor memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang di-resolve ke metadata lingkungan service supervisor.
    - Doctor mendeteksi nilai lingkungan service terkelola berbasis `.env`/SecretRef yang oleh instalasi LaunchAgent, systemd, atau Windows Scheduled Task lama disematkan inline, lalu menulis ulang metadata service agar nilai tersebut dimuat dari sumber runtime, bukan dari definisi supervisor.
    - Doctor mendeteksi ketika command service masih mem-pin `--port` lama setelah `gateway.port` berubah dan menulis ulang metadata service ke port saat ini.
    - Jika auth token memerlukan token dan SecretRef token yang dikonfigurasi tidak terselesaikan, doctor memblokir path install/repair dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum disetel, doctor memblokir install/repair hingga mode disetel secara eksplisit.
    - Untuk unit user-systemd Linux, pemeriksaan drift token doctor sekarang menyertakan sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata auth service.
    - Perbaikan service doctor menolak menulis ulang, menghentikan, atau me-restart service Gateway dari biner OpenClaw yang lebih lama saat konfigurasi terakhir ditulis oleh versi yang lebih baru. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostik runtime + port Gateway">
    Doctor memeriksa runtime service (PID, status exit terakhir) dan memperingatkan saat service terpasang tetapi tidak benar-benar berjalan. Doctor juga memeriksa tabrakan port pada port Gateway (default `18789`) dan melaporkan kemungkinan penyebabnya (Gateway sudah berjalan, tunnel SSH).
  </Accordion>
  <Accordion title="17. Praktik terbaik runtime Gateway">
    Doctor memperingatkan saat service Gateway berjalan di Bun atau path Node yang dikelola versi (`nvm`, `fnm`, `volta`, `asdf`, dll.). Channel WhatsApp + Telegram memerlukan Node, dan path version-manager dapat rusak setelah upgrade karena service tidak memuat init shell Anda. Doctor menawarkan migrasi ke instalasi Node sistem saat tersedia (Homebrew/apt/choco).

    Service yang baru dipasang atau diperbaiki mempertahankan root lingkungan eksplisit (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) dan direktori user-bin yang stabil, tetapi direktori fallback version-manager hasil tebakan hanya ditulis ke PATH service jika direktori tersebut ada di disk. Ini menjaga PATH supervisor yang dihasilkan tetap selaras dengan audit PATH minimal yang sama yang dijalankan doctor nanti.

  </Accordion>
  <Accordion title="18. Penulisan konfigurasi + metadata wizard">
    Doctor menyimpan setiap perubahan konfigurasi dan memberi cap metadata wizard untuk mencatat jalannya doctor.
  </Accordion>
  <Accordion title="19. Tips workspace (backup + sistem memori)">
    Doctor menyarankan sistem memori workspace saat tidak ada dan mencetak tips backup jika workspace belum berada di bawah git.

    Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap tentang struktur workspace dan backup git (GitHub atau GitLab privat direkomendasikan).

  </Accordion>
</AccordionGroup>

## Terkait

- [Runbook Gateway](/id/gateway)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
