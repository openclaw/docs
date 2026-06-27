---
read_when:
    - Menambahkan atau memodifikasi migrasi doctor
    - Memperkenalkan perubahan konfigurasi yang merusak kompatibilitas
sidebarTitle: Doctor
summary: 'Perintah doctor: pemeriksaan kesehatan, migrasi konfigurasi, dan langkah perbaikan'
title: Dokter
x-i18n:
    generated_at: "2026-06-27T17:29:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdb5e3fb437a8678c427dee698a0ea6004b22b71c6e38cc6f75ba674fa4fcc5e
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` adalah alat perbaikan + migrasi untuk OpenClaw. Alat ini memperbaiki konfigurasi/status lama, memeriksa kesehatan, dan menyediakan langkah perbaikan yang dapat ditindaklanjuti.

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

    Terima nilai default tanpa meminta konfirmasi (termasuk langkah perbaikan restart/layanan/sandbox jika berlaku).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Terapkan perbaikan yang direkomendasikan tanpa meminta konfirmasi (perbaikan + restart jika aman).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    Jalankan pemeriksaan kesehatan terstruktur untuk CI atau otomatisasi preflight. Mode ini
    hanya-baca: tidak meminta konfirmasi, memperbaiki, memigrasikan konfigurasi, memulai ulang layanan, atau
    menyentuh status.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
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

## Mode lint hanya-baca

`openclaw doctor --lint` adalah saudara dari
`openclaw doctor --fix` yang ramah otomatisasi. Keduanya menggunakan pemeriksaan kesehatan doctor, tetapi posturnya
berbeda:

| Mode                     | Prompt    | Menulis konfigurasi/status | Output                     | Gunakan untuk                    |
| ------------------------ | --------- | -------------------------- | -------------------------- | -------------------------------- |
| `openclaw doctor`        | ya        | tidak                      | laporan kesehatan ramah    | manusia yang memeriksa status    |
| `openclaw doctor --fix`  | terkadang | ya, dengan kebijakan perbaikan | log perbaikan ramah     | menerapkan perbaikan yang disetujui |
| `openclaw doctor --lint` | tidak     | tidak                      | temuan terstruktur         | CI, preflight, dan gerbang tinjauan |

Pemeriksaan kesehatan yang dimodernisasi dapat menyediakan implementasi `repair()` opsional.
`doctor --fix` menerapkan perbaikan tersebut saat tersedia dan terus menggunakan
alur perbaikan doctor yang ada untuk pemeriksaan yang belum dimigrasikan.
Kontrak perbaikan terstruktur juga memisahkan pelaporan perbaikan dari deteksi:
`detect()` melaporkan temuan saat ini, sementara `repair()` dapat melaporkan perubahan,
diff konfigurasi/file, dan efek samping non-file. Ini menjaga jalur migrasi tetap terbuka
untuk output `doctor --fix --dry-run` dan diff di masa mendatang tanpa membuat pemeriksaan lint
merencanakan mutasi.

Contoh:

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Output JSON mencakup:

- `ok`: apakah ada temuan terlihat yang memenuhi ambang tingkat keparahan yang dipilih
- `checksRun`: jumlah pemeriksaan kesehatan yang dijalankan
- `checksSkipped`: pemeriksaan yang dilewati oleh profil yang dipilih, `--only`, atau `--skip`
- `findings`: diagnostik terstruktur dengan `checkId`, `severity`, `message`, dan
  `path`, `line`, `column`, `ocPath`, serta `fixHint` opsional

Kode keluar:

- `0`: tidak ada temuan pada atau di atas ambang yang dipilih
- `1`: satu atau beberapa temuan memenuhi ambang yang dipilih
- `2`: kegagalan perintah/runtime sebelum temuan lint dapat dikeluarkan

Gunakan `--severity-min info|warning|error` untuk mengontrol apa yang dicetak dan apa
yang menyebabkan lint keluar dengan nilai non-zero. Gunakan `--all` untuk menjalankan inventaris lint lengkap,
termasuk pemeriksaan opt-in yang lebih mendalam yang dikecualikan dari set otomatisasi default. Gunakan `--only <id>` untuk gerbang preflight sempit dan
`--skip <id>` untuk sementara mengecualikan pemeriksaan yang berisik sambil tetap menjaga sisa
proses lint aktif.
Opsi output lint seperti `--json`, `--severity-min`, `--all`, `--only`, dan
`--skip` harus dipasangkan dengan `--lint`; proses doctor dan perbaikan reguler menolaknya.

## Apa yang dilakukannya (ringkasan)

<AccordionGroup>
  <Accordion title="Health, UI, and updates">
    - Pembaruan pre-flight opsional untuk instalasi git (hanya interaktif).
    - Pemeriksaan kesegaran protokol UI (membangun ulang Control UI saat skema protokol lebih baru).
    - Pemeriksaan kesehatan + prompt restart.
    - Ringkasan status Skills (memenuhi syarat/hilang/diblokir) dan status plugin.

  </Accordion>
  <Accordion title="Config and migrations">
    - Normalisasi konfigurasi untuk nilai lama.
    - Migrasi konfigurasi Talk dari field datar lama `talk.*` ke `talk.provider` + `talk.providers.<provider>`.
    - Pemeriksaan migrasi browser untuk konfigurasi ekstensi Chrome lama dan kesiapan MCP Chrome.
    - Peringatan override penyedia OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
    - Migrasi penyedia/profil OpenAI Codex lama (`openai-codex` → `openai`) dan peringatan shadowing untuk `models.providers.openai-codex` yang usang.
    - Pemeriksaan prasyarat TLS OAuth untuk profil OAuth OpenAI Codex.
    - Peringatan allowlist plugin/alat saat `plugins.allow` bersifat membatasi tetapi kebijakan alat masih meminta wildcard atau alat milik plugin.
    - Migrasi status lama di disk (sessions/agent dir/autentikasi WhatsApp).
    - Migrasi kunci kontrak manifest plugin lama (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrasi penyimpanan cron lama (`jobId`, `schedule.cron`, field delivery/payload tingkat atas, payload `provider`, pekerjaan fallback webhook `notify: true`).
    - Pembersihan runtime-policy seluruh agen lama; runtime policy penyedia/model adalah pemilih rute aktif.
    - Pembersihan konfigurasi plugin usang saat plugin diaktifkan; saat `plugins.enabled=false`, referensi plugin usang diperlakukan sebagai konfigurasi kontainmen inert dan dipertahankan.

  </Accordion>
  <Accordion title="State and integrity">
    - Inspeksi file kunci sesi dan pembersihan kunci usang.
    - Perbaikan transkrip sesi untuk cabang prompt-rewrite duplikat yang dibuat oleh build 2026.4.24 yang terdampak.
    - Deteksi tombstone pemulihan-restart subagen yang macet, dengan dukungan `--fix` untuk menghapus flag pemulihan dibatalkan yang usang agar startup tidak terus memperlakukan anak sebagai restart-aborted.
    - Pemeriksaan integritas status dan izin (sesi, transkrip, direktori status).
    - Pemeriksaan izin file konfigurasi (chmod 600) saat berjalan secara lokal.
    - Kesehatan autentikasi model: memeriksa kedaluwarsa OAuth, dapat menyegarkan token yang akan kedaluwarsa, dan melaporkan status cooldown/dinonaktifkan profil autentikasi.

  </Accordion>
  <Accordion title="Gateway, services, and supervisors">
    - Perbaikan image sandbox saat sandboxing diaktifkan.
    - Migrasi layanan lama dan deteksi gateway tambahan.
    - Migrasi status lama channel Matrix (dalam mode `--fix` / `--repair`).
    - Pemeriksaan runtime Gateway (layanan terinstal tetapi tidak berjalan; label launchd yang di-cache).
    - Peringatan status channel (diprobe dari gateway yang sedang berjalan).
    - Pemeriksaan izin khusus channel berada di bawah `openclaw channels capabilities`; misalnya, izin channel suara Discord diaudit dengan `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Pemeriksaan responsivitas WhatsApp untuk kesehatan event-loop Gateway yang menurun saat klien TUI lokal masih berjalan; `--fix` hanya menghentikan klien TUI lokal yang terverifikasi.
    - Perbaikan rute Codex untuk ref model `openai-codex/*` lama pada model utama, fallback, model generasi gambar/video, override heartbeat/subagen/compaction, hook, override model channel, dan pin rute sesi; `--fix` menulis ulangnya menjadi `openai/*`, memigrasikan profil/urutan autentikasi `openai-codex:*` ke `openai:*`, menghapus pin runtime sesi/seluruh agen yang usang, dan membiarkan ref agen OpenAI kanonis pada harness Codex default.
    - Audit konfigurasi supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
    - Pembersihan lingkungan proxy tertanam untuk layanan gateway yang menangkap nilai shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` selama instalasi atau pembaruan.
    - Pemeriksaan praktik terbaik runtime Gateway (Node vs Bun, path version-manager).
    - Diagnostik benturan port Gateway (default `18789`).

  </Accordion>
  <Accordion title="Auth, security, and pairing">
    - Peringatan keamanan untuk kebijakan DM terbuka.
    - Pemeriksaan autentikasi Gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada sumber token; tidak menimpa konfigurasi SecretRef token).
    - Deteksi masalah pairing perangkat (permintaan pair pertama kali yang tertunda, upgrade role/scope yang tertunda, drift cache device-token lokal yang usang, dan drift autentikasi record yang sudah dipasangkan).

  </Accordion>
  <Accordion title="Workspace and shell">
    - Pemeriksaan systemd linger di Linux.
    - Pemeriksaan ukuran file bootstrap workspace (peringatan pemotongan/hampir batas untuk file konteks).
    - Pemeriksaan kesiapan Skills untuk agen default; melaporkan skill yang diizinkan dengan bin, env, konfigurasi, atau persyaratan OS yang hilang, dan `--fix` dapat menonaktifkan skill yang tidak tersedia di `skills.entries`.
    - Pemeriksaan status shell completion dan instalasi/upgrade otomatis.
    - Pemeriksaan kesiapan penyedia embedding pencarian memori (model lokal, kunci API jarak jauh, atau binary QMD).
    - Pemeriksaan instalasi sumber (ketidakcocokan workspace pnpm, aset UI hilang, binary tsx hilang).
    - Menulis konfigurasi yang diperbarui + metadata wizard.

  </Accordion>
</AccordionGroup>

## Backfill dan reset UI Dreams

Scene Dreams Control UI mencakup tindakan **Backfill**, **Reset**, dan **Clear Grounded** untuk alur kerja grounded dreaming. Tindakan ini menggunakan metode RPC bergaya gateway doctor, tetapi **bukan** bagian dari perbaikan/migrasi CLI `openclaw doctor`.

Yang dilakukan:

- **Backfill** memindai file historis `memory/YYYY-MM-DD.md` di workspace aktif, menjalankan pass diary REM grounded, dan menulis entri backfill yang dapat dibalik ke `DREAMS.md`.
- **Reset** hanya menghapus entri diary backfill yang ditandai tersebut dari `DREAMS.md`.
- **Clear Grounded** hanya menghapus entri jangka pendek staged grounded-only yang berasal dari replay historis dan belum mengakumulasi recall live atau dukungan harian.

Yang **tidak** dilakukan sendiri:

- tindakan tersebut tidak mengedit `MEMORY.md`
- tindakan tersebut tidak menjalankan migrasi doctor penuh
- tindakan tersebut tidak otomatis melakukan stage kandidat grounded ke penyimpanan promosi jangka pendek live kecuali Anda secara eksplisit menjalankan jalur CLI staged terlebih dahulu

Jika Anda ingin replay historis grounded memengaruhi lane promosi mendalam normal, gunakan alur CLI sebagai gantinya:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Itu melakukan stage kandidat durable grounded ke penyimpanan dreaming jangka pendek sambil mempertahankan `DREAMS.md` sebagai permukaan tinjauan.

## Perilaku dan alasan terperinci

<AccordionGroup>
  <Accordion title="0. Optional update (git installs)">
    Jika ini adalah checkout git dan doctor berjalan secara interaktif, ia menawarkan untuk memperbarui (fetch/rebase/build) sebelum menjalankan doctor.
  </Accordion>
  <Accordion title="1. Config normalization">
    Jika konfigurasi berisi bentuk nilai lama (misalnya `messages.ackReaction` tanpa override khusus channel), doctor menormalkannya ke skema saat ini.

    Itu mencakup field datar Talk lama. Konfigurasi speech Talk publik saat ini adalah `talk.provider` + `talk.providers.<provider>`, dan konfigurasi voice realtime adalah `talk.realtime.*`. Doctor menulis ulang bentuk `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` lama ke dalam map penyedia, dan menulis ulang selector realtime tingkat atas lama (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) ke `talk.realtime`.

    Doctor juga memperingatkan ketika `plugins.allow` tidak kosong dan kebijakan alat menggunakan
    entri alat wildcard atau milik plugin. `tools.allow: ["*"]` hanya cocok dengan alat
    dari plugin yang benar-benar dimuat; itu tidak melewati allowlist plugin eksklusif.

  </Accordion>
  <Accordion title="2. Migrasi kunci konfigurasi lama">
    Ketika konfigurasi berisi kunci yang sudah tidak digunakan, perintah lain menolak berjalan dan meminta Anda menjalankan `openclaw doctor`.

    Doctor akan:

    - Menjelaskan kunci lama mana yang ditemukan.
    - Menampilkan migrasi yang diterapkan.
    - Menulis ulang `~/.openclaw/openclaw.json` dengan skema yang diperbarui.

    Startup Gateway menolak format konfigurasi lama dan meminta Anda menjalankan `openclaw doctor --fix`; itu tidak menulis ulang `openclaw.json` saat startup. Migrasi penyimpanan tugas Cron juga ditangani oleh `openclaw doctor --fix`.

    Migrasi saat ini:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - hapus `channels.webchat` dan `gateway.webchat` yang sudah dihentikan
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → `bindings` tingkat atas
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` lama → `talk.provider` + `talk.providers.<provider>`
    - pemilih Talk realtime tingkat atas lama (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` dan `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` dan `messages.tts.providers.microsoft`
    - bidang pemilihan pembicara TTS (`voice`/`voiceName`/`voiceId`) → `speakerVoice`/`speakerVoiceId`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` dan `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` dan `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - Untuk channel dengan `accounts` bernama tetapi masih memiliki nilai channel tingkat atas akun tunggal yang tersisa, pindahkan nilai berbasis akun tersebut ke akun yang dipromosikan yang dipilih untuk channel itu (`accounts.default` untuk sebagian besar channel; Matrix dapat mempertahankan target bernama/default yang cocok jika sudah ada)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - hapus `agents.defaults.llm`; gunakan `models.providers.<id>.timeoutSeconds` untuk timeout provider/model lambat, dan pertahankan timeout agen/run di atas nilai itu ketika keseluruhan run harus berlangsung lebih lama
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - hapus `browser.relayBindHost` (pengaturan relay ekstensi lama)
    - `models.providers.*.api: "openai"` lama → `"openai-completions"` (startup Gateway juga melewati provider yang `api`-nya diatur ke nilai enum masa depan atau tidak dikenal, alih-alih gagal tertutup)
    - hapus `plugins.entries.codex.config.codexDynamicToolsProfile`; server aplikasi Codex selalu mempertahankan alat workspace native Codex tetap native

    Peringatan Doctor juga mencakup panduan default akun untuk channel multi-akun:

    - Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa perutean fallback dapat memilih akun yang tidak terduga.
    - Jika `channels.<channel>.defaultAccount` diatur ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

  </Accordion>
  <Accordion title="2b. Override provider OpenCode">
    Jika Anda menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go` secara manual, itu menggantikan katalog OpenCode bawaan dari `openclaw/plugin-sdk/llm`. Hal itu dapat memaksa model ke API yang salah atau mengosongkan biaya. Doctor memperingatkan agar Anda dapat menghapus override dan memulihkan perutean API + biaya per model.
  </Accordion>
  <Accordion title="2c. Migrasi browser dan kesiapan Chrome MCP">
    Jika konfigurasi browser Anda masih menunjuk ke jalur ekstensi Chrome yang sudah dihapus, doctor menormalkannya ke model attach Chrome MCP host-lokal saat ini:

    - `browser.profiles.*.driver: "extension"` menjadi `"existing-session"`
    - `browser.relayBindHost` dihapus

    Doctor juga mengaudit jalur Chrome MCP host-lokal ketika Anda menggunakan `defaultProfile: "user"` atau profil `existing-session` yang dikonfigurasi:

    - memeriksa apakah Google Chrome terinstal pada host yang sama untuk profil auto-connect default
    - memeriksa versi Chrome yang terdeteksi dan memperingatkan ketika versinya di bawah Chrome 144
    - mengingatkan Anda untuk mengaktifkan remote debugging di halaman inspeksi browser (misalnya `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, atau `edge://inspect/#remote-debugging`)

    Doctor tidak dapat mengaktifkan pengaturan sisi Chrome untuk Anda. Chrome MCP host-lokal tetap memerlukan:

    - browser berbasis Chromium 144+ pada host gateway/node
    - browser berjalan secara lokal
    - remote debugging diaktifkan di browser tersebut
    - menyetujui prompt persetujuan attach pertama di browser

    Kesiapan di sini hanya tentang prasyarat attach lokal. Existing-session mempertahankan batas rute Chrome MCP saat ini; rute lanjutan seperti `responsebody`, ekspor PDF, intersepsi unduhan, dan aksi batch tetap memerlukan browser terkelola atau profil CDP mentah.

    Pemeriksaan ini **tidak** berlaku untuk Docker, sandbox, remote-browser, atau alur headless lainnya. Alur tersebut tetap menggunakan CDP mentah.

  </Accordion>
  <Accordion title="2d. Prasyarat TLS OAuth">
    Ketika profil OAuth OpenAI Codex dikonfigurasi, doctor memeriksa endpoint otorisasi OpenAI untuk memverifikasi bahwa stack TLS Node/OpenSSL lokal dapat memvalidasi rantai sertifikat. Jika pemeriksaan gagal dengan kesalahan sertifikat (misalnya `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat self-signed), doctor mencetak panduan perbaikan khusus platform. Di macOS dengan Node Homebrew, perbaikannya biasanya `brew postinstall ca-certificates`. Dengan `--deep`, pemeriksaan berjalan meskipun gateway sehat.
  </Accordion>
  <Accordion title="2e. Override provider OAuth Codex">
    Jika sebelumnya Anda menambahkan pengaturan transport OpenAI lama di bawah `models.providers.openai-codex`, pengaturan itu dapat menutupi jalur provider OAuth Codex bawaan yang digunakan secara otomatis oleh rilis yang lebih baru. Doctor memperingatkan ketika melihat pengaturan transport lama tersebut bersama OAuth Codex agar Anda dapat menghapus atau menulis ulang override transport usang dan mendapatkan kembali perilaku perutean/fallback bawaan. Proxy khusus dan override hanya-header tetap didukung dan tidak memicu peringatan ini.
  </Accordion>
  <Accordion title="2f. Perbaikan rute Codex">
    Doctor memeriksa referensi model `openai-codex/*` lama. Perutean harness Codex native menggunakan referensi model `openai/*` kanonis; giliran agen OpenAI melewati harness app-server Codex alih-alih jalur provider OpenClaw OpenAI.

    Dalam mode `--fix` / `--repair`, doctor menulis ulang referensi agen default dan per agen yang terdampak, termasuk model primer, fallback, model pembuatan gambar/video, override heartbeat/subagent/compaction, hook, override model channel, dan state rute sesi tersimpan yang usang:

    - `openai-codex/gpt-*` menjadi `openai/gpt-*`.
    - Intent Codex dipindahkan ke entri `agentRuntime.id: "codex"` berbasis cakupan provider/model untuk referensi model agen yang diperbaiki.
    - Konfigurasi runtime seluruh agen yang usang dan pin runtime sesi tersimpan dihapus karena pemilihan runtime berbasis cakupan provider/model.
    - Kebijakan runtime provider/model yang ada dipertahankan kecuali referensi model lama yang diperbaiki memerlukan perutean Codex untuk mempertahankan jalur auth lama.
    - Daftar fallback model yang ada dipertahankan dengan entri lamanya ditulis ulang; pengaturan per model yang disalin dipindahkan dari kunci lama ke kunci kanonis `openai/*`.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride`, pemberitahuan fallback, dan pin profil auth sesi tersimpan diperbaiki di semua penyimpanan sesi agen yang ditemukan.
    - `/codex ...` berarti "mengontrol atau mengikat percakapan Codex native dari chat."
    - `/acp ...` atau `runtime: "acp"` berarti "menggunakan adapter ACP/acpx eksternal."

  </Accordion>
  <Accordion title="2g. Pembersihan rute sesi">
    Doctor juga memindai penyimpanan sesi agen yang ditemukan untuk state rute lama yang dibuat otomatis setelah Anda memindahkan model atau runtime yang dikonfigurasi keluar dari rute milik plugin seperti Codex.

    `openclaw doctor --fix` dapat membersihkan state usang yang dibuat otomatis seperti pin model `modelOverrideSource: "auto"`, metadata model runtime, ID harness yang dipin, binding sesi CLI, dan override profil auth otomatis ketika rute pemiliknya tidak lagi dikonfigurasi. Pilihan model sesi eksplisit pengguna atau lama dilaporkan untuk ditinjau manual dan dibiarkan tidak tersentuh; alihkan dengan `/model ...`, `/new`, atau reset sesi ketika rute itu tidak lagi dimaksudkan.

  </Accordion>
  <Accordion title="3. Migrasi state lama (tata letak disk)">
    Doctor dapat memigrasikan tata letak lama di disk ke struktur saat ini:

    - Penyimpanan sesi + transkrip:
      - dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
    - Direktori agen:
      - dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
    - State auth WhatsApp (Baileys):
      - dari `~/.openclaw/credentials/*.json` lama (kecuali `oauth.json`)
      - ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID akun default: `default`)

    Migrasi ini bersifat upaya terbaik dan idempoten; doctor akan mengeluarkan peringatan ketika meninggalkan folder lama sebagai cadangan. Gateway/CLI juga otomatis memigrasikan sesi lama + direktori agen saat startup sehingga riwayat/auth/model masuk ke jalur per agen tanpa menjalankan doctor secara manual. Normalisasi provider/peta-provider Talk kini membandingkan berdasarkan kesetaraan struktural, sehingga diff yang hanya berbeda urutan kunci tidak lagi memicu perubahan `doctor --fix` no-op berulang.

  </Accordion>
  <Accordion title="3a. Migrasi manifes plugin legacy">
    Doctor memindai semua manifes plugin yang terpasang untuk kunci kapabilitas tingkat atas yang sudah usang (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Saat ditemukan, Doctor menawarkan untuk memindahkannya ke objek `contracts` dan menulis ulang file manifes di tempat. Migrasi ini idempoten; jika kunci `contracts` sudah memiliki nilai yang sama, kunci legacy dihapus tanpa menduplikasi data.
  </Accordion>
  <Accordion title="3b. Migrasi penyimpanan cron legacy">
    Doctor juga memeriksa penyimpanan job cron (`~/.openclaw/cron/jobs.json` secara default, atau `cron.store` saat ditimpa) untuk bentuk job lama yang masih diterima scheduler demi kompatibilitas.

    Pembersihan cron saat ini mencakup:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - field payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
    - field pengiriman tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias pengiriman `provider` payload → `delivery.channel` eksplisit
    - job fallback webhook legacy `notify: true` → pengiriman webhook eksplisit dari `cron.webhook` saat disetel; job pengumuman mempertahankan pengiriman chat-nya dan mendapatkan `delivery.completionDestination`. Saat `cron.webhook` tidak disetel, penanda tingkat atas `notify` yang tidak aktif dihapus untuk job tanpa target (pengiriman yang ada, termasuk pengumuman, dipertahankan) karena pengiriman runtime tidak pernah membacanya

    Gateway juga membersihkan baris cron yang salah bentuk saat waktu pemuatan agar job yang valid tetap berjalan. Baris mentah yang salah bentuk disalin ke `jobs-quarantine.json` di samping penyimpanan aktif sebelum dihapus dari `jobs.json`; Doctor melaporkan baris yang dikarantina agar Anda dapat meninjau atau memperbaikinya secara manual.

    Startup Gateway menormalkan proyeksi runtime dan mengabaikan penanda tingkat atas `notify`, tetapi membiarkan konfigurasi cron yang tersimpan untuk diperbaiki Doctor. Saat `cron.webhook` tidak disetel, Doctor menghapus penanda tidak aktif untuk job tanpa target migrasi (`delivery.mode` none/tidak ada, target webhook yang tidak dapat digunakan, atau pengiriman announce/chat yang ada), membiarkan pengiriman yang ada tidak berubah, sehingga eksekusi `doctor --fix` berulang tidak lagi memberi peringatan ulang tentang job yang sama. Jika `cron.webhook` disetel tetapi bukan URL HTTP(S) yang valid, Doctor tetap memperingatkan dan membiarkan penanda agar Anda dapat memperbaiki URL.

    Di Linux, Doctor juga memperingatkan saat crontab pengguna masih memanggil `~/.openclaw/bin/ensure-whatsapp.sh` legacy. Skrip lokal host tersebut tidak dikelola oleh OpenClaw saat ini dan dapat menulis pesan `Gateway inactive` palsu ke `~/.openclaw/logs/whatsapp-health.log` saat cron tidak dapat menjangkau bus pengguna systemd. Hapus entri crontab usang dengan `crontab -e`; gunakan `openclaw channels status --probe`, `openclaw doctor`, dan `openclaw gateway status` untuk pemeriksaan kesehatan saat ini.

  </Accordion>
  <Accordion title="3c. Pembersihan kunci sesi">
    Doctor memindai setiap direktori sesi agen untuk file write-lock usang — file yang tertinggal saat sesi keluar secara abnormal. Untuk setiap file kunci yang ditemukan, Doctor melaporkan: path, PID, apakah PID masih hidup, usia kunci, dan apakah kunci dianggap usang (PID mati, metadata pemilik salah bentuk, lebih lama dari 30 menit, atau PID hidup yang dapat dibuktikan milik proses non-OpenClaw). Dalam mode `--fix` / `--repair`, Doctor otomatis menghapus kunci dengan pemilik mati, yatim, didaur ulang, lama-salah bentuk, atau non-OpenClaw. Kunci lama yang masih dimiliki oleh proses OpenClaw hidup dilaporkan tetapi dibiarkan tetap ada agar Doctor tidak memutus penulis transkrip aktif.
  </Accordion>
  <Accordion title="3d. Perbaikan cabang transkrip sesi">
    Doctor memindai file JSONL sesi agen untuk bentuk cabang duplikat yang dibuat oleh bug penulisan ulang transkrip prompt 2026.4.24: giliran pengguna yang ditinggalkan dengan konteks runtime internal OpenClaw plus sibling aktif yang berisi prompt pengguna terlihat yang sama. Dalam mode `--fix` / `--repair`, Doctor mencadangkan setiap file yang terdampak di samping file asli dan menulis ulang transkrip ke cabang aktif sehingga riwayat Gateway dan pembaca memori tidak lagi melihat giliran duplikat.
  </Accordion>
  <Accordion title="4. Pemeriksaan integritas state (persistensi sesi, perutean, dan keamanan)">
    Direktori state adalah batang otak operasional. Jika direktori ini hilang, Anda kehilangan sesi, kredensial, log, dan konfigurasi (kecuali Anda memiliki cadangan di tempat lain).

    Doctor memeriksa:

    - **Direktori state hilang**: memperingatkan tentang kehilangan state yang katastrofik, meminta untuk membuat ulang direktori, dan mengingatkan bahwa Doctor tidak dapat memulihkan data yang hilang.
    - **Izin direktori state**: memverifikasi kemampuan tulis; menawarkan untuk memperbaiki izin (dan mengeluarkan petunjuk `chown` saat ketidakcocokan pemilik/grup terdeteksi).
    - **Direktori state macOS yang disinkronkan cloud**: memperingatkan saat state berada di bawah iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau `~/Library/CloudStorage/...` karena path yang didukung sinkronisasi dapat menyebabkan I/O lebih lambat dan race kunci/sinkronisasi.
    - **Direktori state Linux SD atau eMMC**: memperingatkan saat state mengarah ke sumber mount `mmcblk*`, karena I/O acak yang didukung SD atau eMMC dapat lebih lambat dan lebih cepat aus saat penulisan sesi dan kredensial.
    - **Direktori state volatile Linux**: memperingatkan saat state mengarah ke `tmpfs` atau `ramfs`, karena sesi, kredensial, konfigurasi, dan state SQLite dengan sidecar WAL/journal-nya akan hilang saat reboot. Mount `overlay` Docker sengaja tidak ditandai karena lapisan tulisnya bertahan melewati reboot host selama container tetap ada.
    - **Direktori sesi hilang**: `sessions/` dan direktori penyimpanan sesi diperlukan untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
    - **Ketidakcocokan transkrip**: memperingatkan saat entri sesi terbaru memiliki file transkrip yang hilang.
    - **Sesi utama "JSONL 1 baris"**: menandai saat transkrip utama hanya memiliki satu baris (riwayat tidak terakumulasi).
    - **Beberapa direktori state**: memperingatkan saat beberapa folder `~/.openclaw` ada di berbagai direktori home atau saat `OPENCLAW_STATE_DIR` menunjuk ke tempat lain (riwayat dapat terpecah antarinstalasi).
    - **Pengingat mode jarak jauh**: jika `gateway.mode=remote`, Doctor mengingatkan Anda untuk menjalankannya di host jarak jauh (state berada di sana).
    - **Izin file konfigurasi**: memperingatkan jika `~/.openclaw/openclaw.json` dapat dibaca oleh grup/dunia dan menawarkan untuk memperketat ke `600`.

  </Accordion>
  <Accordion title="5. Kesehatan auth model (kedaluwarsa OAuth)">
    Doctor memeriksa profil OAuth di penyimpanan auth, memperingatkan saat token akan kedaluwarsa/sudah kedaluwarsa, dan dapat menyegarkannya saat aman. Jika profil OAuth/token Anthropic sudah usang, Doctor menyarankan kunci API Anthropic atau path setup-token Anthropic. Prompt penyegaran hanya muncul saat berjalan secara interaktif (TTY); `--non-interactive` melewati upaya penyegaran.

    Saat penyegaran OAuth gagal permanen (misalnya `refresh_token_reused`, `invalid_grant`, atau penyedia meminta Anda masuk lagi), Doctor melaporkan bahwa re-auth diperlukan dan mencetak perintah `openclaw models auth login --provider ...` persis yang harus dijalankan.

    Doctor juga melaporkan profil auth yang sementara tidak dapat digunakan karena:

    - cooldown singkat (batas laju/timeout/kegagalan auth)
    - penonaktifan lebih lama (kegagalan penagihan/kredit)

    Profil OAuth Codex legacy yang tokennya berada di macOS Keychain (onboarding lama sebelum tata letak sidecar berbasis file) hanya diperbaiki oleh Doctor. Jalankan `openclaw doctor --fix` sekali dari terminal interaktif untuk memigrasikan token legacy yang didukung Keychain secara inline ke `auth-profiles.json`; setelah itu, giliran tertanam (Telegram, cron, dispatch sub-agen) menyelesaikannya sebagai profil OAuth OpenAI kanonis.

  </Accordion>
  <Accordion title="6. Validasi model hook">
    Jika `hooks.gmail.model` disetel, Doctor memvalidasi referensi model terhadap katalog dan allowlist serta memperingatkan saat referensi tidak akan terselesaikan atau tidak diizinkan.
  </Accordion>
  <Accordion title="7. Perbaikan image sandbox">
    Saat sandboxing diaktifkan, Doctor memeriksa image Docker dan menawarkan untuk membangun atau beralih ke nama legacy jika image saat ini hilang.
  </Accordion>
  <Accordion title="7b. Pembersihan instalasi plugin">
    Doctor menghapus state staging dependensi plugin legacy yang dibuat OpenClaw dalam mode `openclaw doctor --fix` / `openclaw doctor --repair`. Ini mencakup root dependensi usang yang dihasilkan, direktori tahap instal lama, sisa lokal paket dari kode perbaikan dependensi bundled-plugin sebelumnya, serta salinan npm terkelola dari plugin bundled `@openclaw/*` yang yatim atau dipulihkan dan dapat membayangi manifes bundled saat ini. Doctor juga menautkan ulang paket host `openclaw` ke plugin npm terkelola yang mendeklarasikan `peerDependencies.openclaw`, sehingga impor runtime lokal paket seperti `openclaw/plugin-sdk/*` tetap terselesaikan setelah pembaruan atau perbaikan npm.

    Doctor juga dapat menginstal ulang plugin yang dapat diunduh yang hilang saat konfigurasi merujuknya tetapi registry plugin lokal tidak dapat menemukannya. Contohnya mencakup `plugins.entries` material, pengaturan channel/provider/search yang dikonfigurasi, dan runtime agen yang dikonfigurasi. Selama pembaruan paket, Doctor menghindari menjalankan perbaikan plugin package-manager saat paket core sedang diganti; jalankan `openclaw doctor --fix` lagi setelah pembaruan jika plugin yang dikonfigurasi masih memerlukan pemulihan. Startup Gateway dan pemuatan ulang konfigurasi tidak menjalankan package manager; instalasi plugin tetap merupakan pekerjaan Doctor/install/update yang eksplisit.

  </Accordion>
  <Accordion title="8. Migrasi layanan Gateway dan petunjuk pembersihan">
    Doctor mendeteksi layanan Gateway legacy (launchd/systemd/schtasks) dan menawarkan untuk menghapusnya serta memasang layanan OpenClaw menggunakan port Gateway saat ini. Doctor juga dapat memindai layanan tambahan yang mirip Gateway dan mencetak petunjuk pembersihan. Layanan Gateway OpenClaw bernama profil dianggap kelas satu dan tidak ditandai sebagai "tambahan."

    Di Linux, jika layanan Gateway tingkat pengguna hilang tetapi layanan Gateway OpenClaw tingkat sistem ada, Doctor tidak otomatis memasang layanan tingkat pengguna kedua. Periksa dengan `openclaw gateway status --deep` atau `openclaw doctor --deep`, lalu hapus duplikat atau setel `OPENCLAW_SERVICE_REPAIR_POLICY=external` saat supervisor sistem memiliki siklus hidup Gateway.

  </Accordion>
  <Accordion title="8b. Migrasi startup Matrix">
    Saat akun channel Matrix memiliki migrasi state legacy yang tertunda atau dapat ditindaklanjuti, Doctor (dalam mode `--fix` / `--repair`) membuat snapshot pra-migrasi lalu menjalankan langkah migrasi best-effort: migrasi state Matrix legacy dan persiapan encrypted-state legacy. Kedua langkah bersifat non-fatal; kesalahan dicatat dan startup berlanjut. Dalam mode baca-saja (`openclaw doctor` tanpa `--fix`) pemeriksaan ini dilewati sepenuhnya.
  </Accordion>
  <Accordion title="8c. Pairing perangkat dan drift auth">
    Doctor sekarang memeriksa state pairing perangkat sebagai bagian dari lintasan kesehatan normal.

    Yang dilaporkan:

    - permintaan pairing pertama kali yang tertunda
    - upgrade peran tertunda untuk perangkat yang sudah dipasangkan
    - upgrade cakupan tertunda untuk perangkat yang sudah dipasangkan
    - perbaikan ketidakcocokan kunci publik saat id perangkat masih cocok tetapi identitas perangkat tidak lagi cocok dengan catatan yang disetujui
    - catatan pairing yang kehilangan token aktif untuk peran yang disetujui
    - token pairing yang cakupannya drift di luar baseline pairing yang disetujui
    - entri token perangkat cache lokal untuk mesin saat ini yang lebih lama daripada rotasi token sisi Gateway atau membawa metadata cakupan usang

    Doctor tidak otomatis menyetujui permintaan pairing atau otomatis merotasi token perangkat. Doctor mencetak langkah berikutnya yang persis sebagai gantinya:

    - periksa permintaan tertunda dengan `openclaw devices list`
    - setujui permintaan persis dengan `openclaw devices approve <requestId>`
    - rotasi token baru dengan `openclaw devices rotate --device <deviceId> --role <role>`
    - hapus dan setujui ulang catatan usang dengan `openclaw devices remove <deviceId>`

    Ini menutup celah umum "sudah dipasangkan tetapi masih mendapatkan pairing required": doctor kini membedakan penyandingan pertama kali dari peningkatan peran/cakupan yang tertunda dan dari drift token/identitas perangkat yang usang.

  </Accordion>
  <Accordion title="9. Peringatan keamanan">
    Doctor mengeluarkan peringatan saat sebuah penyedia terbuka untuk DM tanpa daftar izin, atau saat kebijakan dikonfigurasi dengan cara yang berbahaya.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jika berjalan sebagai layanan pengguna systemd, doctor memastikan lingering diaktifkan agar gateway tetap hidup setelah logout.
  </Accordion>
  <Accordion title="11. Status workspace (skills, plugin, dan TaskFlow)">
    Doctor mencetak ringkasan status workspace untuk agen default:

    - **Status Skills**: menghitung skill yang memenuhi syarat, persyaratannya hilang, dan diblokir daftar izin.
    - **Status Plugin**: menghitung plugin yang diaktifkan/dinonaktifkan/bermasalah; mencantumkan ID plugin untuk setiap error; melaporkan kapabilitas plugin bundel.
    - **Peringatan kompatibilitas Plugin**: menandai plugin yang memiliki masalah kompatibilitas dengan runtime saat ini.
    - **Diagnostik Plugin**: memunculkan peringatan atau error waktu muat yang dikeluarkan oleh registry plugin.
    - **Pemulihan TaskFlow**: memunculkan TaskFlow terkelola yang mencurigakan dan perlu inspeksi manual atau pembatalan.

  </Accordion>
  <Accordion title="11b. Ukuran file bootstrap">
    Doctor memeriksa apakah file bootstrap workspace (misalnya `AGENTS.md`, `CLAUDE.md`, atau file konteks terinjeksi lainnya) mendekati atau melampaui anggaran karakter yang dikonfigurasi. Ini melaporkan jumlah karakter mentah vs. terinjeksi per file, persentase pemotongan, penyebab pemotongan (`max/file` atau `max/total`), dan total karakter terinjeksi sebagai bagian dari total anggaran. Saat file dipotong atau mendekati batas, doctor mencetak kiat untuk menyetel `agents.defaults.bootstrapMaxChars` dan `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11d. Pembersihan plugin channel usang">
    Saat `openclaw doctor --fix` menghapus plugin channel yang hilang, ini juga menghapus config bercakupan channel yang menggantung dan merujuk ke plugin tersebut: entri `channels.<id>`, target heartbeat yang menamai channel, dan override `agents.*.models["<channel>/*"]`. Ini mencegah loop boot Gateway ketika runtime channel sudah hilang tetapi config masih meminta gateway untuk mengikat ke sana.
  </Accordion>
  <Accordion title="11c. Pelengkapan shell">
    Doctor memeriksa apakah pelengkapan tab terinstal untuk shell saat ini (zsh, bash, fish, atau PowerShell):

    - Jika profil shell menggunakan pola pelengkapan dinamis yang lambat (`source <(openclaw completion ...)`), doctor meningkatkannya ke varian file cache yang lebih cepat.
    - Jika pelengkapan dikonfigurasi di profil tetapi file cache hilang, doctor membuat ulang cache secara otomatis.
    - Jika tidak ada pelengkapan yang dikonfigurasi sama sekali, doctor meminta untuk menginstalnya (hanya mode interaktif; dilewati dengan `--non-interactive`).

    Jalankan `openclaw completion --write-state` untuk membuat ulang cache secara manual.

  </Accordion>
  <Accordion title="12. Pemeriksaan autentikasi Gateway (token lokal)">
    Doctor memeriksa kesiapan autentikasi token gateway lokal.

    - Jika mode token membutuhkan token dan tidak ada sumber token, doctor menawarkan untuk membuatnya.
    - Jika `gateway.auth.token` dikelola SecretRef tetapi tidak tersedia, doctor memperingatkan dan tidak menimpanya dengan plaintext.
    - `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya saat tidak ada SecretRef token yang dikonfigurasi.

  </Accordion>
  <Accordion title="12b. Perbaikan read-only yang sadar SecretRef">
    Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku runtime fail-fast.

    - `openclaw doctor --fix` kini menggunakan model ringkasan SecretRef read-only yang sama seperti perintah keluarga status untuk perbaikan config yang ditargetkan.
    - Contoh: perbaikan `allowFrom` / `groupAllowFrom` `@username` Telegram mencoba menggunakan kredensial bot yang dikonfigurasi saat tersedia.
    - Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia di jalur perintah saat ini, doctor melaporkan bahwa kredensial dikonfigurasi-tetapi-tidak-tersedia dan melewati resolusi otomatis alih-alih crash atau salah melaporkan token sebagai hilang.

  </Accordion>
  <Accordion title="13. Pemeriksaan kesehatan Gateway + restart">
    Doctor menjalankan pemeriksaan kesehatan dan menawarkan untuk me-restart gateway ketika tampak tidak sehat.
  </Accordion>
  <Accordion title="13b. Kesiapan pencarian memori">
    Doctor memeriksa apakah penyedia embedding pencarian memori yang dikonfigurasi siap untuk agen default. Perilakunya bergantung pada backend dan penyedia yang dikonfigurasi:

    - **Backend QMD**: memeriksa apakah binary `qmd` tersedia dan dapat dimulai. Jika tidak, mencetak panduan perbaikan termasuk paket npm dan opsi jalur binary manual.
    - **Penyedia lokal eksplisit**: memeriksa file model lokal atau URL model jarak jauh/dapat diunduh yang dikenali. Jika hilang, menyarankan beralih ke penyedia jarak jauh.
    - **Penyedia jarak jauh eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa API key ada di environment atau auth store. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika hilang.
    - **Penyedia auto legacy**: memperlakukan `memorySearch.provider: "auto"` sebagai OpenAI, memeriksa kesiapan OpenAI, dan `doctor --fix` menulis ulangnya menjadi `provider: "openai"`.

    Saat hasil probe gateway yang di-cache tersedia (gateway sehat pada saat pemeriksaan), doctor mencocokkan hasilnya dengan config yang terlihat oleh CLI dan mencatat setiap ketidaksesuaian. Doctor tidak memulai ping embedding baru di jalur default; gunakan perintah status memori mendalam saat Anda menginginkan pemeriksaan penyedia live.

    Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

  </Accordion>
  <Accordion title="14. Peringatan status channel">
    Jika gateway sehat, doctor menjalankan probe status channel dan melaporkan peringatan dengan perbaikan yang disarankan.
  </Accordion>
  <Accordion title="15. Audit config supervisor + perbaikan">
    Doctor memeriksa config supervisor yang terinstal (launchd/systemd/schtasks) untuk default yang hilang atau usang (misalnya dependensi systemd network-online dan jeda restart). Saat menemukan ketidakcocokan, ini merekomendasikan pembaruan dan dapat menulis ulang file layanan/task ke default saat ini.

    Catatan:

    - `openclaw doctor` meminta konfirmasi sebelum menulis ulang config supervisor.
    - `openclaw doctor --yes` menerima prompt perbaikan default.
    - `openclaw doctor --fix` menerapkan perbaikan yang direkomendasikan tanpa prompt (`--repair` adalah alias).
    - `openclaw doctor --fix --force` menimpa config supervisor kustom.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` menjaga doctor tetap read-only untuk lifecycle layanan gateway. Ini tetap melaporkan kesehatan layanan dan menjalankan perbaikan non-layanan, tetapi melewati install/start/restart/bootstrap layanan, penulisan ulang config supervisor, dan pembersihan layanan legacy karena supervisor eksternal memiliki lifecycle tersebut.
    - Di Linux, doctor tidak menulis ulang metadata command/entrypoint saat unit gateway systemd yang cocok aktif. Ini juga mengabaikan unit tambahan mirip gateway non-legacy yang tidak aktif selama pemindaian layanan duplikat sehingga file layanan pendamping tidak menimbulkan noise pembersihan.
    - Jika autentikasi token membutuhkan token dan `gateway.auth.token` dikelola SecretRef, install/perbaikan layanan doctor memvalidasi SecretRef tetapi tidak menyimpan nilai token plaintext yang telah di-resolve ke metadata environment layanan supervisor.
    - Doctor mendeteksi nilai environment layanan terkelola berbasis `.env`/SecretRef yang ditanam inline oleh install LaunchAgent, systemd, atau Windows Scheduled Task lama dan menulis ulang metadata layanan agar nilai tersebut dimuat dari sumber runtime alih-alih definisi supervisor.
    - Doctor mendeteksi saat command layanan masih mematok `--port` lama setelah `gateway.port` berubah dan menulis ulang metadata layanan ke port saat ini.
    - Jika autentikasi token membutuhkan token dan SecretRef token yang dikonfigurasi belum ter-resolve, doctor memblokir jalur install/perbaikan dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi dan `gateway.auth.mode` belum disetel, doctor memblokir install/perbaikan sampai mode disetel secara eksplisit.
    - Untuk unit user-systemd Linux, pemeriksaan drift token doctor kini menyertakan sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata autentikasi layanan.
    - Perbaikan layanan doctor menolak menulis ulang, menghentikan, atau me-restart layanan gateway dari binary OpenClaw yang lebih lama saat config terakhir ditulis oleh versi yang lebih baru. Lihat [Pemecahan masalah Gateway](/id/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostik runtime Gateway + port">
    Doctor memeriksa runtime layanan (PID, status exit terakhir) dan memperingatkan saat layanan terinstal tetapi tidak benar-benar berjalan. Ini juga memeriksa tabrakan port pada port gateway (default `18789`) dan melaporkan kemungkinan penyebab (gateway sudah berjalan, tunnel SSH).
  </Accordion>
  <Accordion title="17. Praktik terbaik runtime Gateway">
    Doctor memperingatkan saat layanan gateway berjalan di Bun atau jalur Node yang dikelola versi (`nvm`, `fnm`, `volta`, `asdf`, dll.). Channel WhatsApp + Telegram memerlukan Node, dan jalur pengelola versi dapat rusak setelah upgrade karena layanan tidak memuat init shell Anda. Doctor menawarkan untuk bermigrasi ke install Node sistem saat tersedia (Homebrew/apt/choco).

    LaunchAgent macOS yang baru diinstal atau diperbaiki menggunakan PATH sistem kanonis (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`) alih-alih menyalin PATH shell interaktif, sehingga binary sistem yang dikelola Homebrew tetap tersedia sementara direktori Volta, asdf, fnm, pnpm, dan pengelola versi lainnya tidak mengubah Node mana yang di-resolve oleh proses anak. Layanan Linux tetap mempertahankan root environment eksplisit (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) dan direktori user-bin yang stabil, tetapi direktori fallback pengelola versi yang ditebak hanya ditulis ke PATH layanan saat direktori tersebut ada di disk.

  </Accordion>
  <Accordion title="18. Penulisan config + metadata wizard">
    Doctor menyimpan perubahan config apa pun dan memberi stempel metadata wizard untuk mencatat run doctor.
  </Accordion>
  <Accordion title="19. Kiat workspace (backup + sistem memori)">
    Doctor menyarankan sistem memori workspace saat hilang dan mencetak kiat backup jika workspace belum berada di bawah git.

    Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap tentang struktur workspace dan backup git (GitHub atau GitLab privat direkomendasikan).

  </Accordion>
</AccordionGroup>

## Terkait

- [Runbook Gateway](/id/gateway)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
