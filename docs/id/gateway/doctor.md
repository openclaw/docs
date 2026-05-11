---
read_when:
    - Menambahkan atau memodifikasi migrasi doctor
    - Memperkenalkan perubahan konfigurasi yang tidak kompatibel
sidebarTitle: Doctor
summary: 'Perintah Doctor: pemeriksaan kesehatan, migrasi konfigurasi, dan langkah perbaikan'
title: Dokter
x-i18n:
    generated_at: "2026-05-11T20:29:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4994177bb3a3751211437403becc1c68c7f07fa52a72b84c9d129c7922705522
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` adalah alat perbaikan + migrasi untuk OpenClaw. Alat ini memperbaiki konfigurasi/status yang usang, memeriksa kesehatan, dan menyediakan langkah perbaikan yang dapat ditindaklanjuti.

## Mulai cepat

```bash
openclaw doctor
```

### Mode headless dan otomasi

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    Terima default tanpa prompt (termasuk langkah restart/layanan/perbaikan sandbox saat berlaku).

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
    - Pembaruan pra-jalan opsional untuk instalasi git (hanya interaktif).
    - Pemeriksaan kesegaran protokol UI (membangun ulang Control UI saat skema protokol lebih baru).
    - Pemeriksaan kesehatan + prompt restart.
    - Ringkasan status Skills (memenuhi syarat/hilang/diblokir) dan status plugin.

  </Accordion>
  <Accordion title="Konfigurasi dan migrasi">
    - Normalisasi konfigurasi untuk nilai lama.
    - Migrasi konfigurasi Talk dari bidang datar lama `talk.*` ke `talk.provider` + `talk.providers.<provider>`.
    - Pemeriksaan migrasi browser untuk konfigurasi ekstensi Chrome lama dan kesiapan Chrome MCP.
    - Peringatan penggantian penyedia OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Peringatan pembayangan OAuth Codex (`models.providers.openai-codex`).
    - Pemeriksaan prasyarat TLS OAuth untuk profil OAuth OpenAI Codex.
    - Peringatan allowlist Plugin/alat saat `plugins.allow` bersifat membatasi tetapi kebijakan alat masih meminta wildcard atau alat milik plugin.
    - Migrasi status lama di disk (sessions/agent dir/autentikasi WhatsApp).
    - Migrasi kunci kontrak manifes plugin lama (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrasi penyimpanan cron lama (`jobId`, `schedule.cron`, bidang delivery/payload tingkat atas, payload `provider`, pekerjaan fallback webhook sederhana `notify: true`).
    - Pembersihan runtime-policy seluruh agen lama; kebijakan runtime penyedia/model adalah pemilih rute aktif.
    - Pembersihan konfigurasi plugin usang saat plugin diaktifkan; saat `plugins.enabled=false`, referensi plugin usang diperlakukan sebagai konfigurasi containment inert dan dipertahankan.

  </Accordion>
  <Accordion title="Status dan integritas">
    - Inspeksi file kunci sesi dan pembersihan kunci usang.
    - Perbaikan transkrip sesi untuk cabang penulisan ulang prompt duplikat yang dibuat oleh build 2026.4.24 yang terdampak.
    - Deteksi tombstone pemulihan-restart subagen yang tersangkut, dengan dukungan `--fix` untuk membersihkan flag pemulihan dibatalkan yang usang agar startup tidak terus memperlakukan child sebagai restart-aborted.
    - Pemeriksaan integritas status dan izin (sesi, transkrip, direktori status).
    - Pemeriksaan izin file konfigurasi (chmod 600) saat berjalan secara lokal.
    - Kesehatan autentikasi model: memeriksa kedaluwarsa OAuth, dapat menyegarkan token yang hampir kedaluwarsa, dan melaporkan status cooldown/dinonaktifkan auth-profile.
    - Deteksi direktori workspace tambahan (`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, layanan, dan supervisor">
    - Perbaikan image sandbox saat sandboxing diaktifkan.
    - Migrasi layanan lama dan deteksi gateway tambahan.
    - Migrasi status lama kanal Matrix (dalam mode `--fix` / `--repair`).
    - Pemeriksaan runtime Gateway (layanan terinstal tetapi tidak berjalan; label launchd yang di-cache).
    - Peringatan status kanal (diprobe dari gateway yang sedang berjalan).
    - Pemeriksaan izin khusus kanal berada di bawah `openclaw channels capabilities`; misalnya, izin kanal suara Discord diaudit dengan `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Pemeriksaan responsivitas WhatsApp untuk kesehatan event-loop Gateway yang menurun dengan klien TUI lokal yang masih berjalan; `--fix` hanya menghentikan klien TUI lokal yang terverifikasi.
    - Perbaikan rute Codex untuk ref model lama `openai-codex/*` dalam model utama, fallback, penggantian heartbeat/subagen/compaction, hook, penggantian model kanal, dan pin rute sesi; `--fix` menulis ulang semuanya menjadi `openai/*`, menghapus pin runtime sesi/seluruh agen yang usang, dan membiarkan ref agen OpenAI kanonis pada harness Codex default.
    - Audit konfigurasi supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
    - Pembersihan lingkungan proxy tertanam untuk layanan gateway yang menangkap nilai shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` selama instalasi atau pembaruan.
    - Pemeriksaan praktik terbaik runtime Gateway (Node vs Bun, jalur version-manager).
    - Diagnostik benturan port Gateway (default `18789`).

  </Accordion>
  <Accordion title="Autentikasi, keamanan, dan pairing">
    - Peringatan keamanan untuk kebijakan DM terbuka.
    - Pemeriksaan autentikasi Gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada sumber token; tidak menimpa konfigurasi token SecretRef).
    - Deteksi masalah pairing perangkat (permintaan pairing pertama kali yang tertunda, peningkatan peran/cakupan yang tertunda, drift cache device-token lokal yang usang, dan drift autentikasi catatan yang telah dipasangkan).

  </Accordion>
  <Accordion title="Workspace dan shell">
    - Pemeriksaan linger systemd di Linux.
    - Pemeriksaan ukuran file bootstrap workspace (peringatan terpotong/hampir batas untuk file konteks).
    - Pemeriksaan kesiapan Skills untuk agen default; melaporkan skill yang diizinkan dengan bin, env, konfigurasi, atau persyaratan OS yang hilang, dan `--fix` dapat menonaktifkan skill yang tidak tersedia di `skills.entries`.
    - Pemeriksaan status penyelesaian shell dan instal/pembaruan otomatis.
    - Pemeriksaan kesiapan penyedia embedding pencarian memori (model lokal, kunci API jarak jauh, atau biner QMD).
    - Pemeriksaan instalasi sumber (ketidaksesuaian workspace pnpm, aset UI hilang, biner tsx hilang).
    - Menulis konfigurasi terbaru + metadata wizard.

  </Accordion>
</AccordionGroup>

## Backfill dan reset UI Dreams

Scene Dreams Control UI mencakup tindakan **Backfill**, **Reset**, dan **Clear Grounded** untuk alur kerja dreaming yang grounded. Tindakan ini menggunakan metode RPC bergaya gateway doctor, tetapi **bukan** bagian dari perbaikan/migrasi CLI `openclaw doctor`.

Yang dilakukan:

- **Backfill** memindai file historis `memory/YYYY-MM-DD.md` di workspace aktif, menjalankan pass buku harian REM yang grounded, dan menulis entri backfill yang dapat dibalik ke `DREAMS.md`.
- **Reset** hanya menghapus entri buku harian backfill bertanda tersebut dari `DREAMS.md`.
- **Clear Grounded** hanya menghapus entri jangka pendek khusus grounded yang telah distage, berasal dari replay historis, dan belum mengakumulasi recall live atau dukungan harian.

Yang **tidak** dilakukan sendiri:

- tindakan ini tidak mengedit `MEMORY.md`
- tindakan ini tidak menjalankan migrasi doctor penuh
- tindakan ini tidak otomatis men-stage kandidat grounded ke penyimpanan promosi jangka pendek live kecuali Anda secara eksplisit menjalankan jalur CLI staged terlebih dahulu

Jika Anda ingin replay historis grounded memengaruhi lane promosi dalam normal, gunakan alur CLI sebagai gantinya:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Itu men-stage kandidat durable grounded ke penyimpanan dreaming jangka pendek sambil menjaga `DREAMS.md` sebagai permukaan peninjauan.

## Perilaku dan alasan terperinci

<AccordionGroup>
  <Accordion title="0. Pembaruan opsional (instalasi git)">
    Jika ini adalah checkout git dan doctor berjalan secara interaktif, ia menawarkan untuk memperbarui (fetch/rebase/build) sebelum menjalankan doctor.
  </Accordion>
  <Accordion title="1. Normalisasi konfigurasi">
    Jika konfigurasi berisi bentuk nilai lama (misalnya `messages.ackReaction` tanpa penggantian khusus kanal), doctor menormalisasikannya ke skema saat ini.

    Itu mencakup bidang datar Talk lama. Konfigurasi speech Talk publik saat ini adalah `talk.provider` + `talk.providers.<provider>`, dan konfigurasi suara realtime adalah `talk.realtime.*`. Doctor menulis ulang bentuk lama `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ke peta penyedia, dan menulis ulang pemilih realtime tingkat atas lama (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) ke `talk.realtime`.

    Doctor juga memperingatkan saat `plugins.allow` tidak kosong dan kebijakan alat menggunakan
    entri alat wildcard atau milik plugin. `tools.allow: ["*"]` hanya cocok dengan alat
    dari plugin yang benar-benar dimuat; itu tidak melewati allowlist plugin eksklusif.
    Doctor menulis `plugins.bundledDiscovery: "compat"` untuk konfigurasi allowlist lama yang dimigrasikan guna mempertahankan perilaku penyedia bundled yang sudah ada, lalu
    mengarahkan ke pengaturan `"allowlist"` yang lebih ketat.

  </Accordion>
  <Accordion title="2. Migrasi kunci konfigurasi lama">
    Saat konfigurasi berisi kunci yang sudah tidak digunakan, perintah lain menolak berjalan dan meminta Anda menjalankan `openclaw doctor`.

    Doctor akan:

    - Menjelaskan kunci lama mana yang ditemukan.
    - Menampilkan migrasi yang diterapkan.
    - Menulis ulang `~/.openclaw/openclaw.json` dengan skema yang diperbarui.

    Startup Gateway menolak format konfigurasi lama dan meminta Anda menjalankan `openclaw doctor --fix`; ia tidak menulis ulang `openclaw.json` saat startup. Migrasi penyimpanan pekerjaan Cron juga ditangani oleh `openclaw doctor --fix`.

    Migrasi saat ini:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - konfigurasi saluran terkonfigurasi yang tidak memiliki kebijakan balasan terlihat → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` tingkat atas
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` lama → `talk.provider` + `talk.providers.<provider>`
    - pemilih Talk waktu nyata tingkat atas lama (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - Untuk saluran dengan `accounts` bernama tetapi masih memiliki nilai saluran tingkat atas akun tunggal yang tersisa, pindahkan nilai yang tercakup akun tersebut ke akun yang dipromosikan yang dipilih untuk saluran itu (`accounts.default` untuk sebagian besar saluran; Matrix dapat mempertahankan target bernama/default yang cocok yang sudah ada)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - hapus `agents.defaults.llm`; gunakan `models.providers.<id>.timeoutSeconds` untuk batas waktu penyedia/model yang lambat
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - hapus `browser.relayBindHost` (pengaturan relay ekstensi lama)
    - `models.providers.*.api: "openai"` lama → `"openai-completions"` (startup Gateway juga melewati penyedia yang `api`-nya disetel ke nilai enum masa depan atau tidak dikenal, alih-alih gagal secara tertutup)
    - hapus `plugins.entries.codex.config.codexDynamicToolsProfile`; server aplikasi Codex selalu mempertahankan alat ruang kerja native Codex tetap native

    Peringatan doctor juga mencakup panduan default akun untuk saluran multi-akun:

    - Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa routing fallback dapat memilih akun yang tidak terduga.
    - Jika `channels.<channel>.defaultAccount` disetel ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

  </Accordion>
  <Accordion title="2b. Penimpaan penyedia OpenCode">
    Jika Anda menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go` secara manual, itu menimpa katalog bawaan OpenCode dari `@earendil-works/pi-ai`. Hal itu dapat memaksa model ke API yang salah atau mengosongkan biaya. Doctor memperingatkan agar Anda dapat menghapus penimpaan tersebut dan memulihkan routing API + biaya per model.
  </Accordion>
  <Accordion title="2c. Migrasi browser dan kesiapan Chrome MCP">
    Jika konfigurasi browser Anda masih menunjuk ke jalur ekstensi Chrome yang telah dihapus, doctor menormalkannya ke model attach Chrome MCP host-lokal saat ini:

    - `browser.profiles.*.driver: "extension"` menjadi `"existing-session"`
    - `browser.relayBindHost` dihapus

    Doctor juga mengaudit jalur Chrome MCP host-lokal saat Anda menggunakan `defaultProfile: "user"` atau profil `existing-session` yang dikonfigurasi:

    - memeriksa apakah Google Chrome terinstal di host yang sama untuk profil koneksi otomatis default
    - memeriksa versi Chrome yang terdeteksi dan memperingatkan jika versinya di bawah Chrome 144
    - mengingatkan Anda untuk mengaktifkan debugging jarak jauh di halaman inspeksi browser (misalnya `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, atau `edge://inspect/#remote-debugging`)

    Doctor tidak dapat mengaktifkan pengaturan sisi Chrome untuk Anda. Chrome MCP host-lokal tetap memerlukan:

    - browser berbasis Chromium 144+ pada host gateway/node
    - browser berjalan secara lokal
    - debugging jarak jauh diaktifkan di browser tersebut
    - menyetujui prompt persetujuan attach pertama di browser

    Kesiapan di sini hanya terkait prasyarat attach lokal. Existing-session mempertahankan batas rute Chrome MCP saat ini; rute lanjutan seperti `responsebody`, ekspor PDF, intersepsi unduhan, dan tindakan batch tetap memerlukan browser terkelola atau profil CDP mentah.

    Pemeriksaan ini **tidak** berlaku untuk Docker, sandbox, remote-browser, atau alur headless lainnya. Alur tersebut tetap menggunakan CDP mentah.

  </Accordion>
  <Accordion title="2d. Prasyarat OAuth TLS">
    Saat profil OpenAI Codex OAuth dikonfigurasi, doctor memeriksa endpoint otorisasi OpenAI untuk memverifikasi bahwa stack TLS Node/OpenSSL lokal dapat memvalidasi rantai sertifikat. Jika pemeriksaan gagal dengan kesalahan sertifikat (misalnya `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat yang ditandatangani sendiri), doctor mencetak panduan perbaikan khusus platform. Di macOS dengan Node Homebrew, perbaikannya biasanya `brew postinstall ca-certificates`. Dengan `--deep`, pemeriksaan berjalan meskipun gateway sehat.
  </Accordion>
  <Accordion title="2e. Penimpaan penyedia Codex OAuth">
    Jika sebelumnya Anda menambahkan pengaturan transport OpenAI lama di bawah `models.providers.openai-codex`, pengaturan itu dapat membayangi jalur penyedia Codex OAuth bawaan yang digunakan otomatis oleh rilis yang lebih baru. Doctor memperingatkan saat melihat pengaturan transport lama tersebut bersama Codex OAuth agar Anda dapat menghapus atau menulis ulang penimpaan transport yang basi dan mendapatkan kembali perilaku routing/fallback bawaan. Proxy kustom dan penimpaan hanya-header tetap didukung dan tidak memicu peringatan ini.
  </Accordion>
  <Accordion title="2f. Perbaikan rute Codex">
    Doctor memeriksa referensi model `openai-codex/*` lama. Routing harness Codex native menggunakan referensi model kanonis `openai/*`; giliran agen OpenAI melewati harness server aplikasi Codex, bukan jalur OpenClaw PI OpenAI.

    Dalam mode `--fix` / `--repair`, doctor menulis ulang referensi default-agent dan per-agent yang terdampak, termasuk model utama, fallback, penimpaan heartbeat/subagent/compaction, hook, penimpaan model saluran, dan status rute sesi tersimpan yang basi:

    - `openai-codex/gpt-*` menjadi `openai/gpt-*`.
    - Intensi Codex dipindahkan ke entri `agentRuntime.id: "codex"` yang tercakup penyedia/model untuk referensi model agen yang diperbaiki agar profil auth `openai-codex:...` masih dapat dipilih setelah referensi model menjadi `openai/*`.
    - Konfigurasi runtime seluruh agen yang basi dan pin runtime sesi tersimpan dihapus karena pemilihan runtime tercakup penyedia/model.
    - Kebijakan runtime penyedia/model yang sudah ada dipertahankan kecuali referensi model lama yang diperbaiki memerlukan routing Codex untuk mempertahankan jalur auth lama.
    - Daftar fallback model yang sudah ada dipertahankan dengan entri lama ditulis ulang; pengaturan per-model yang disalin dipindahkan dari kunci lama ke kunci `openai/*` kanonis.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, pemberitahuan fallback, dan pin profil auth sesi tersimpan diperbaiki di semua penyimpanan sesi agen yang ditemukan.
    - `/codex ...` berarti "mengontrol atau mengikat percakapan Codex native dari chat."
    - `/acp ...` atau `runtime: "acp"` berarti "menggunakan adaptor ACP/acpx eksternal."

  </Accordion>
  <Accordion title="2g. Pembersihan rute sesi">
    Doctor juga memindai penyimpanan sesi agen yang ditemukan untuk status rute yang dibuat otomatis dan basi setelah Anda memindahkan model atau runtime yang dikonfigurasi menjauh dari rute milik plugin seperti Codex.

    `openclaw doctor --fix` dapat membersihkan status basi yang dibuat otomatis seperti pin model `modelOverrideSource: "auto"`, metadata model runtime, ID harness yang dipin, binding sesi CLI, dan penimpaan profil auth otomatis saat rute pemiliknya tidak lagi dikonfigurasi. Pilihan model sesi eksplisit pengguna atau lama dilaporkan untuk tinjauan manual dan dibiarkan apa adanya; alihkan dengan `/model ...`, `/new`, atau reset sesi saat rute itu tidak lagi dimaksudkan.

  </Accordion>
  <Accordion title="3. Migrasi status lama (tata letak disk)">
    Doctor dapat memigrasikan tata letak lama di disk ke struktur saat ini:

    - Penyimpanan sesi + transkrip:
      - dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
    - Direktori agen:
      - dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
    - Status auth WhatsApp (Baileys):
      - dari `~/.openclaw/credentials/*.json` lama (kecuali `oauth.json`)
      - ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (id akun default: `default`)

    Migrasi ini bersifat upaya terbaik dan idempoten; doctor akan mengeluarkan peringatan saat meninggalkan folder lama sebagai cadangan. Gateway/CLI juga memigrasikan otomatis sesi lama + direktori agen saat startup sehingga riwayat/auth/model masuk ke jalur per-agen tanpa perlu menjalankan doctor secara manual. Normalisasi penyedia/peta-penyedia Talk kini membandingkan berdasarkan kesetaraan struktural, sehingga diff yang hanya berupa urutan kunci tidak lagi memicu perubahan `doctor --fix` no-op berulang.

  </Accordion>
  <Accordion title="3a. Migrasi manifes Plugin lama">
    Doctor memindai semua manifes plugin yang terinstal untuk kunci kapabilitas tingkat atas yang sudah usang (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Saat ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts` dan menulis ulang file manifes di tempat. Migrasi ini idempoten; jika kunci `contracts` sudah memiliki nilai yang sama, kunci lama dihapus tanpa menggandakan data.
  </Accordion>
  <Accordion title="3b. Migrasi penyimpanan Cron lama">
    Doctor juga memeriksa penyimpanan job cron (`~/.openclaw/cron/jobs.json` secara default, atau `cron.store` saat ditimpa) untuk bentuk job lama yang masih diterima scheduler demi kompatibilitas.

    Pembersihan cron saat ini mencakup:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - bidang payload tingkat teratas (`message`, `model`, `thinking`, ...) → `payload`
    - bidang pengiriman tingkat teratas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias pengiriman `provider` payload → `delivery.channel` eksplisit
    - tugas fallback webhook `notify: true` lama yang sederhana → `delivery.mode="webhook"` eksplisit dengan `delivery.to=cron.webhook`

    Doctor hanya memigrasikan otomatis tugas `notify: true` ketika dapat melakukannya tanpa mengubah perilaku. Jika sebuah tugas menggabungkan fallback notify lama dengan mode pengiriman non-webhook yang sudah ada, doctor memperingatkan dan membiarkan tugas tersebut untuk peninjauan manual.

    Di Linux, doctor juga memperingatkan ketika crontab pengguna masih memanggil `~/.openclaw/bin/ensure-whatsapp.sh` lama. Skrip lokal host tersebut tidak dipelihara oleh OpenClaw saat ini dan dapat menulis pesan `Gateway inactive` palsu ke `~/.openclaw/logs/whatsapp-health.log` ketika cron tidak dapat menjangkau bus pengguna systemd. Hapus entri crontab usang dengan `crontab -e`; gunakan `openclaw channels status --probe`, `openclaw doctor`, dan `openclaw gateway status` untuk pemeriksaan kesehatan saat ini.

  </Accordion>
  <Accordion title="3c. Pembersihan kunci sesi">
    Doctor memindai setiap direktori sesi agen untuk file kunci tulis yang usang — file yang tertinggal ketika sesi keluar secara tidak normal. Untuk setiap file kunci yang ditemukan, doctor melaporkan: path, PID, apakah PID masih hidup, usia kunci, dan apakah dianggap usang (PID mati, lebih lama dari 30 menit, atau PID hidup yang dapat dibuktikan milik proses non-OpenClaw). Dalam mode `--fix` / `--repair`, doctor menghapus file kunci usang secara otomatis; jika tidak, doctor mencetak catatan dan menginstruksikan Anda untuk menjalankan ulang dengan `--fix`.
  </Accordion>
  <Accordion title="3d. Perbaikan cabang transkrip sesi">
    Doctor memindai file JSONL sesi agen untuk bentuk cabang duplikat yang dibuat oleh bug penulisan ulang transkrip prompt 2026.4.24: giliran pengguna yang ditinggalkan dengan konteks runtime internal OpenClaw plus sibling aktif yang berisi prompt pengguna terlihat yang sama. Dalam mode `--fix` / `--repair`, doctor mencadangkan setiap file yang terdampak di sebelah file asli dan menulis ulang transkrip ke cabang aktif sehingga riwayat gateway dan pembaca memori tidak lagi melihat giliran duplikat.
  </Accordion>
  <Accordion title="4. Pemeriksaan integritas status (persistensi sesi, perutean, dan keamanan)">
    Direktori status adalah batang otak operasional. Jika hilang, Anda kehilangan sesi, kredensial, log, dan konfigurasi (kecuali Anda memiliki cadangan di tempat lain).

    Doctor memeriksa:

    - **Direktori status hilang**: memperingatkan tentang kehilangan status yang katastrofik, meminta untuk membuat ulang direktori, dan mengingatkan bahwa data yang hilang tidak dapat dipulihkan.
    - **Izin direktori status**: memverifikasi kemampuan tulis; menawarkan untuk memperbaiki izin (dan mengeluarkan petunjuk `chown` ketika ketidakcocokan pemilik/grup terdeteksi).
    - **Direktori status tersinkron cloud macOS**: memperingatkan ketika status mengarah ke bawah iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau `~/Library/CloudStorage/...` karena path berbasis sinkronisasi dapat menyebabkan I/O lebih lambat dan race kunci/sinkronisasi.
    - **Direktori status SD atau eMMC Linux**: memperingatkan ketika status mengarah ke sumber mount `mmcblk*`, karena I/O acak berbasis SD atau eMMC dapat lebih lambat dan lebih cepat aus di bawah penulisan sesi dan kredensial.
    - **Direktori sesi hilang**: `sessions/` dan direktori penyimpanan sesi diperlukan untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
    - **Ketidakcocokan transkrip**: memperingatkan ketika entri sesi terbaru memiliki file transkrip yang hilang.
    - **Sesi utama "JSONL 1 baris"**: menandai ketika transkrip utama hanya memiliki satu baris (riwayat tidak terakumulasi).
    - **Beberapa direktori status**: memperingatkan ketika beberapa folder `~/.openclaw` ada di berbagai direktori home atau ketika `OPENCLAW_STATE_DIR` mengarah ke tempat lain (riwayat dapat terpisah antarinstalasi).
    - **Pengingat mode jarak jauh**: jika `gateway.mode=remote`, doctor mengingatkan Anda untuk menjalankannya di host jarak jauh (status berada di sana).
    - **Izin file konfigurasi**: memperingatkan jika `~/.openclaw/openclaw.json` dapat dibaca oleh grup/dunia dan menawarkan untuk memperketatnya menjadi `600`.

  </Accordion>
  <Accordion title="5. Kesehatan autentikasi model (kedaluwarsa OAuth)">
    Doctor memeriksa profil OAuth di penyimpanan auth, memperingatkan ketika token akan kedaluwarsa/sudah kedaluwarsa, dan dapat menyegarkannya ketika aman. Jika profil OAuth/token Anthropic usang, doctor menyarankan kunci API Anthropic atau jalur setup-token Anthropic. Prompt penyegaran hanya muncul ketika berjalan secara interaktif (TTY); `--non-interactive` melewati upaya penyegaran.

    Ketika penyegaran OAuth gagal permanen (misalnya `refresh_token_reused`, `invalid_grant`, atau penyedia meminta Anda masuk lagi), doctor melaporkan bahwa autentikasi ulang diperlukan dan mencetak perintah `openclaw models auth login --provider ...` persis yang harus dijalankan.

    Doctor juga melaporkan profil auth yang sementara tidak dapat digunakan karena:

    - cooldown singkat (batas laju/timeout/kegagalan auth)
    - penonaktifan lebih lama (kegagalan penagihan/kredit)

  </Accordion>
  <Accordion title="6. Validasi model hooks">
    Jika `hooks.gmail.model` disetel, doctor memvalidasi referensi model terhadap katalog dan allowlist serta memperingatkan ketika referensi tidak dapat di-resolve atau tidak diizinkan.
  </Accordion>
  <Accordion title="7. Perbaikan image sandbox">
    Ketika sandboxing diaktifkan, doctor memeriksa image Docker dan menawarkan untuk membangun atau beralih ke nama lama jika image saat ini hilang.
  </Accordion>
  <Accordion title="7b. Pembersihan instalasi Plugin">
    Doctor menghapus status staging dependensi plugin lama yang dihasilkan OpenClaw dalam mode `openclaw doctor --fix` / `openclaw doctor --repair`. Ini mencakup root dependensi hasil generasi yang usang, direktori tahap instalasi lama, sisa lokal paket dari kode perbaikan dependensi bundled-plugin sebelumnya, dan salinan npm terkelola yatim atau dipulihkan dari plugin bundled `@openclaw/*` yang dapat membayangi manifest bundled saat ini.

    Doctor juga dapat memasang ulang plugin unduhan yang hilang ketika konfigurasi mereferensikannya tetapi registry plugin lokal tidak dapat menemukannya. Contohnya mencakup `plugins.entries` material, pengaturan channel/provider/search yang dikonfigurasi, dan runtime agen yang dikonfigurasi. Selama pembaruan paket, doctor menghindari menjalankan perbaikan plugin package-manager saat paket inti sedang ditukar; jalankan `openclaw doctor --fix` lagi setelah pembaruan jika plugin terkonfigurasi masih perlu dipulihkan. Startup Gateway dan muat ulang konfigurasi tidak menjalankan package manager; instalasi plugin tetap merupakan pekerjaan doctor/install/update yang eksplisit.

  </Accordion>
  <Accordion title="8. Migrasi layanan Gateway dan petunjuk pembersihan">
    Doctor mendeteksi layanan gateway lama (launchd/systemd/schtasks) dan menawarkan untuk menghapusnya serta memasang layanan OpenClaw menggunakan port gateway saat ini. Doctor juga dapat memindai layanan mirip gateway tambahan dan mencetak petunjuk pembersihan. Layanan gateway OpenClaw bernama profil dianggap kelas utama dan tidak ditandai sebagai "tambahan."

    Di Linux, jika layanan gateway tingkat pengguna hilang tetapi layanan gateway OpenClaw tingkat sistem ada, doctor tidak memasang layanan tingkat pengguna kedua secara otomatis. Periksa dengan `openclaw gateway status --deep` atau `openclaw doctor --deep`, lalu hapus duplikatnya atau setel `OPENCLAW_SERVICE_REPAIR_POLICY=external` ketika supervisor sistem memiliki siklus hidup gateway.

  </Accordion>
  <Accordion title="8b. Migrasi Startup Matrix">
    Ketika akun channel Matrix memiliki migrasi status lama yang tertunda atau dapat ditindaklanjuti, doctor (dalam mode `--fix` / `--repair`) membuat snapshot pra-migrasi lalu menjalankan langkah migrasi upaya-terbaik: migrasi status Matrix lama dan persiapan status terenkripsi lama. Kedua langkah tidak fatal; error dicatat dan startup berlanjut. Dalam mode hanya-baca (`openclaw doctor` tanpa `--fix`) pemeriksaan ini dilewati sepenuhnya.
  </Accordion>
  <Accordion title="8c. Penyandingan perangkat dan pergeseran auth">
    Doctor sekarang memeriksa status penyandingan perangkat sebagai bagian dari pemeriksaan kesehatan normal.

    Yang dilaporkan:

    - permintaan penyandingan pertama kali yang tertunda
    - peningkatan peran tertunda untuk perangkat yang sudah disandingkan
    - peningkatan cakupan tertunda untuk perangkat yang sudah disandingkan
    - perbaikan ketidakcocokan kunci publik ketika id perangkat masih cocok tetapi identitas perangkat tidak lagi cocok dengan catatan yang disetujui
    - catatan tersanding yang tidak memiliki token aktif untuk peran yang disetujui
    - token tersanding yang cakupannya bergeser di luar baseline penyandingan yang disetujui
    - entri token perangkat cache lokal untuk mesin saat ini yang lebih lama dari rotasi token sisi gateway atau membawa metadata cakupan usang

    Doctor tidak menyetujui otomatis permintaan penyandingan atau memutar otomatis token perangkat. Sebagai gantinya, doctor mencetak langkah berikutnya persis:

    - periksa permintaan tertunda dengan `openclaw devices list`
    - setujui permintaan persis dengan `openclaw devices approve <requestId>`
    - putar token baru dengan `openclaw devices rotate --device <deviceId> --role <role>`
    - hapus dan setujui ulang catatan usang dengan `openclaw devices remove <deviceId>`

    Ini menutup celah umum "sudah disandingkan tetapi masih mendapat pairing required": doctor sekarang membedakan penyandingan pertama kali dari peningkatan peran/cakupan tertunda dan dari pergeseran token/identitas-perangkat yang usang.

  </Accordion>
  <Accordion title="9. Peringatan keamanan">
    Doctor mengeluarkan peringatan ketika penyedia terbuka untuk DM tanpa allowlist, atau ketika kebijakan dikonfigurasi dengan cara berbahaya.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jika berjalan sebagai layanan pengguna systemd, doctor memastikan lingering diaktifkan agar gateway tetap hidup setelah logout.
  </Accordion>
  <Accordion title="11. Status workspace (skills, plugin, dan direktori lama)">
    Doctor mencetak ringkasan status workspace untuk agen default:

    - **Status Skills**: menghitung skill yang memenuhi syarat, persyaratan-hilang, dan diblokir-allowlist.
    - **Direktori workspace lama**: memperingatkan ketika `~/openclaw` atau direktori workspace lama lainnya ada berdampingan dengan workspace saat ini.
    - **Status Plugin**: menghitung plugin yang diaktifkan/dinonaktifkan/error; mencantumkan ID plugin untuk error apa pun; melaporkan kapabilitas plugin bundle.
    - **Peringatan kompatibilitas Plugin**: menandai plugin yang memiliki masalah kompatibilitas dengan runtime saat ini.
    - **Diagnostik Plugin**: memunculkan peringatan atau error waktu muat yang dikeluarkan oleh registry plugin.

  </Accordion>
  <Accordion title="11b. Ukuran file bootstrap">
    Doctor memeriksa apakah file bootstrap workspace (misalnya `AGENTS.md`, `CLAUDE.md`, atau file konteks lain yang diinjeksi) mendekati atau melampaui anggaran karakter yang dikonfigurasi. Doctor melaporkan jumlah karakter mentah vs. terinjeksi per file, persentase pemotongan, penyebab pemotongan (`max/file` atau `max/total`), dan total karakter terinjeksi sebagai fraksi dari total anggaran. Ketika file dipotong atau mendekati batas, doctor mencetak tips untuk menyetel `agents.defaults.bootstrapMaxChars` dan `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pembersihan plugin channel usang">
    Ketika `openclaw doctor --fix` menghapus plugin channel yang hilang, doctor juga menghapus konfigurasi bercakupan channel yang menggantung yang mereferensikan plugin tersebut: entri `channels.<id>`, target Heartbeat yang menamai channel, dan override `agents.*.models["<channel>/*"]`. Ini mencegah loop boot Gateway ketika runtime channel sudah hilang tetapi konfigurasi masih meminta gateway untuk mengikatnya.
  </Accordion>
  <Accordion title="11c. Pelengkapan shell">
    Doctor memeriksa apakah pelengkapan tab terpasang untuk shell saat ini (zsh, bash, fish, atau PowerShell):

    - Jika profil shell menggunakan pola pelengkapan dinamis yang lambat (`source <(openclaw completion ...)`), doctor meningkatkannya ke varian file cache yang lebih cepat.
    - Jika pelengkapan dikonfigurasi di profil tetapi file cache hilang, doctor membuat ulang cache secara otomatis.
    - Jika tidak ada pelengkapan yang dikonfigurasi sama sekali, doctor meminta untuk memasangnya (hanya mode interaktif; dilewati dengan `--non-interactive`).

    Jalankan `openclaw completion --write-state` untuk membuat ulang cache secara manual.

  </Accordion>
  <Accordion title="12. Pemeriksaan autentikasi Gateway (token lokal)">
    Perintah doctor memeriksa kesiapan autentikasi token Gateway lokal.

    - Jika mode token memerlukan token dan tidak ada sumber token, doctor menawarkan untuk membuatnya.
    - Jika `gateway.auth.token` dikelola SecretRef tetapi tidak tersedia, doctor memperingatkan dan tidak menimpanya dengan teks biasa.
    - `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya ketika tidak ada SecretRef token yang dikonfigurasi.

  </Accordion>
  <Accordion title="12b. Perbaikan sadar-SecretRef baca-saja">
    Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku gagal-cepat runtime.

    - `openclaw doctor --fix` sekarang menggunakan model ringkasan SecretRef baca-saja yang sama seperti perintah keluarga status untuk perbaikan konfigurasi tertarget.
    - Contoh: perbaikan `allowFrom` / `groupAllowFrom` `@username` Telegram mencoba menggunakan kredensial bot yang dikonfigurasi jika tersedia.
    - Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia di jalur perintah saat ini, doctor melaporkan bahwa kredensial dikonfigurasi-tetapi-tidak-tersedia dan melewati resolusi otomatis alih-alih mengalami crash atau keliru melaporkan token sebagai hilang.

  </Accordion>
  <Accordion title="13. Pemeriksaan kesehatan Gateway + mulai ulang">
    Doctor menjalankan pemeriksaan kesehatan dan menawarkan untuk memulai ulang Gateway ketika tampak tidak sehat.
  </Accordion>
  <Accordion title="13b. Kesiapan pencarian memori">
    Doctor memeriksa apakah penyedia embedding pencarian memori yang dikonfigurasi siap untuk agen default. Perilakunya bergantung pada backend dan penyedia yang dikonfigurasi:

    - **Backend QMD**: memeriksa apakah binary `qmd` tersedia dan dapat dimulai. Jika tidak, mencetak panduan perbaikan termasuk paket npm dan opsi jalur binary manual.
    - **Penyedia lokal eksplisit**: memeriksa file model lokal atau URL model jarak jauh/dapat diunduh yang dikenali. Jika hilang, menyarankan beralih ke penyedia jarak jauh.
    - **Penyedia jarak jauh eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa kunci API ada di lingkungan atau penyimpanan autentikasi. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika hilang.
    - **Penyedia otomatis**: memeriksa ketersediaan model lokal terlebih dahulu, lalu mencoba setiap penyedia jarak jauh sesuai urutan pemilihan otomatis.

    Ketika hasil probe Gateway yang di-cache tersedia (Gateway sehat pada saat pemeriksaan), doctor merujuk-silang hasilnya dengan konfigurasi yang terlihat oleh CLI dan mencatat setiap ketidaksesuaian. Doctor tidak memulai ping embedding baru pada jalur default; gunakan perintah status memori mendalam saat Anda menginginkan pemeriksaan penyedia langsung.

    Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

  </Accordion>
  <Accordion title="14. Peringatan status kanal">
    Jika Gateway sehat, doctor menjalankan probe status kanal dan melaporkan peringatan dengan perbaikan yang disarankan.
  </Accordion>
  <Accordion title="15. Audit + perbaikan konfigurasi supervisor">
    Doctor memeriksa konfigurasi supervisor yang terpasang (launchd/systemd/schtasks) untuk default yang hilang atau usang (misalnya, dependensi network-online systemd dan jeda mulai ulang). Ketika menemukan ketidakcocokan, doctor merekomendasikan pembaruan dan dapat menulis ulang file layanan/tugas ke default saat ini.

    Catatan:

    - `openclaw doctor` meminta konfirmasi sebelum menulis ulang konfigurasi supervisor.
    - `openclaw doctor --yes` menerima prompt perbaikan default.
    - `openclaw doctor --repair` menerapkan perbaikan yang direkomendasikan tanpa prompt.
    - `openclaw doctor --repair --force` menimpa konfigurasi supervisor kustom.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` membuat doctor tetap baca-saja untuk siklus hidup layanan Gateway. Doctor tetap melaporkan kesehatan layanan dan menjalankan perbaikan non-layanan, tetapi melewati pemasangan/mulai/mulai ulang/bootstrap layanan, penulisan ulang konfigurasi supervisor, dan pembersihan layanan lama karena supervisor eksternal memiliki siklus hidup tersebut.
    - Di Linux, doctor tidak menulis ulang metadata perintah/entrypoint saat unit Gateway systemd yang cocok sedang aktif. Doctor juga mengabaikan unit tambahan mirip-Gateway non-legacy yang tidak aktif selama pemindaian layanan duplikat agar file layanan pendamping tidak menimbulkan derau pembersihan.
    - Jika autentikasi token memerlukan token dan `gateway.auth.token` dikelola SecretRef, pemasangan/perbaikan layanan doctor memvalidasi SecretRef tetapi tidak menyimpan nilai token teks biasa yang telah di-resolve ke metadata lingkungan layanan supervisor.
    - Doctor mendeteksi nilai lingkungan layanan yang dikelola `.env`/berbasis SecretRef yang ditanam inline oleh pemasangan LaunchAgent, systemd, atau Windows Scheduled Task lama dan menulis ulang metadata layanan agar nilai tersebut dimuat dari sumber runtime alih-alih definisi supervisor.
    - Doctor mendeteksi ketika perintah layanan masih menyematkan `--port` lama setelah `gateway.port` berubah dan menulis ulang metadata layanan ke port saat ini.
    - Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi belum terselesaikan, doctor memblokir jalur pemasangan/perbaikan dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` belum diatur, doctor memblokir pemasangan/perbaikan hingga mode diatur secara eksplisit.
    - Untuk unit user-systemd Linux, pemeriksaan pergeseran token doctor kini menyertakan sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata autentikasi layanan.
    - Perbaikan layanan doctor menolak menulis ulang, menghentikan, atau memulai ulang layanan Gateway dari binary OpenClaw yang lebih lama ketika konfigurasi terakhir ditulis oleh versi yang lebih baru. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostik runtime + port Gateway">
    Doctor memeriksa runtime layanan (PID, status keluar terakhir) dan memperingatkan ketika layanan terpasang tetapi sebenarnya tidak berjalan. Doctor juga memeriksa benturan port pada port Gateway (default `18789`) dan melaporkan kemungkinan penyebab (Gateway sudah berjalan, tunnel SSH).
  </Accordion>
  <Accordion title="17. Praktik terbaik runtime Gateway">
    Doctor memperingatkan ketika layanan Gateway berjalan di Bun atau jalur Node yang dikelola versi (`nvm`, `fnm`, `volta`, `asdf`, dll.). Kanal WhatsApp + Telegram memerlukan Node, dan jalur pengelola versi dapat rusak setelah pemutakhiran karena layanan tidak memuat init shell Anda. Doctor menawarkan migrasi ke pemasangan Node sistem ketika tersedia (Homebrew/apt/choco).

    LaunchAgent macOS yang baru dipasang atau diperbaiki menggunakan PATH sistem kanonis (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) alih-alih menyalin PATH shell interaktif, sehingga binary sistem yang dikelola Homebrew tetap tersedia sementara Volta, asdf, fnm, pnpm, dan direktori pengelola versi lainnya tidak mengubah Node mana yang di-resolve oleh proses anak. Layanan Linux tetap mempertahankan root lingkungan eksplisit (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) dan direktori user-bin yang stabil, tetapi direktori fallback pengelola versi hasil tebakan hanya ditulis ke PATH layanan ketika direktori tersebut ada di disk.

  </Accordion>
  <Accordion title="18. Penulisan konfigurasi + metadata wizard">
    Doctor menyimpan setiap perubahan konfigurasi dan mencap metadata wizard untuk mencatat eksekusi doctor.
  </Accordion>
  <Accordion title="19. Tips ruang kerja (cadangan + sistem memori)">
    Doctor menyarankan sistem memori ruang kerja ketika hilang dan mencetak tips cadangan jika ruang kerja belum berada di bawah git.

    Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap tentang struktur ruang kerja dan cadangan git (disarankan GitHub atau GitLab privat).

  </Accordion>
</AccordionGroup>

## Terkait

- [Runbook Gateway](/id/gateway)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
