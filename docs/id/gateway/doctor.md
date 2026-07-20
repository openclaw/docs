---
read_when:
    - Menambahkan atau memodifikasi migrasi doctor
    - Memperkenalkan perubahan konfigurasi yang bersifat breaking
sidebarTitle: Doctor
summary: 'Perintah doctor: pemeriksaan kesehatan, migrasi konfigurasi, dan langkah-langkah perbaikan'
title: Dokter
x-i18n:
    generated_at: "2026-07-20T03:52:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2b33c4ae538f8aa8b8049012a788261f3b9051b006f84b17c0e10fe94dc0fdc
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` adalah alat perbaikan dan migrasi untuk OpenClaw. Alat ini memperbaiki konfigurasi/status usang, memeriksa kesehatan, dan menyediakan langkah-langkah perbaikan yang dapat ditindaklanjuti.

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

    Terima nilai default tanpa perintah konfirmasi (termasuk langkah perbaikan mulai ulang/layanan/sandbox jika berlaku).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Terapkan perbaikan yang direkomendasikan tanpa perintah konfirmasi (`--repair` adalah alias).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    Jalankan pemeriksaan kesehatan terstruktur untuk CI atau otomatisasi prapemeriksaan. Hanya-baca: tanpa
    perintah konfirmasi, perbaikan, migrasi, mulai ulang, atau penulisan status.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    Terapkan juga perbaikan agresif (menimpa konfigurasi supervisor khusus).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    Jalankan tanpa perintah konfirmasi, dengan hanya menerapkan migrasi aman (normalisasi konfigurasi +
    pemindahan status pada disk). Melewati tindakan mulai ulang/layanan/sandbox yang memerlukan
    konfirmasi manusia. Migrasi status lama tetap berjalan otomatis saat terdeteksi.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    Pindai layanan sistem untuk instalasi Gateway tambahan (launchd/systemd/schtasks).

  </Tab>
</Tabs>

Untuk meninjau perubahan sebelum menulis, buka file konfigurasi terlebih dahulu:

```bash
cat ~/.openclaw/openclaw.json
```

## Mode lint hanya-baca

`openclaw doctor --lint` adalah padanan `openclaw doctor --fix` yang ramah otomatisasi.
Keduanya berbagi registri aturan Doctor yang sama, tetapi tidak memilih atau
menjalankan aturan dengan cara yang sama:

| Mode                     | Perintah konfirmasi | Menulis konfigurasi/status | Keluaran                  | Gunakan untuk                           |
| ------------------------ | ------------------- | -------------------------- | ------------------------- | --------------------------------------- |
| `openclaw doctor`        | ya                  | tidak                      | laporan kesehatan ramah   | manusia yang memeriksa status           |
| `openclaw doctor --fix`  | terkadang           | ya, dengan kebijakan perbaikan | log perbaikan ramah   | menerapkan perbaikan yang disetujui     |
| `openclaw doctor --lint` | tidak               | tidak                      | temuan terstruktur        | CI, prapemeriksaan, dan gerbang review  |

Secara default, `doctor --lint` menjalankan profil otomatisasi luas-aman: pemeriksaan yang
statis, lokal, dan berguna dalam keluaran CI atau prapemeriksaan. Mode ini melewati pemeriksaan opsional yang
bersifat saran, sensitif terhadap lingkungan, bergantung pada layanan aktif, berupa inventaris
akun/ruang kerja, atau pembersihan historis. Gunakan `doctor --lint --all` jika Anda menginginkan
audit lint terdaftar lengkap, termasuk pemeriksaan opsional tersebut, atau `--only <id>` untuk
pemeriksaan yang ditargetkan.

`doctor --fix` tidak menggunakan profil default lint dan tidak menerima
`--all`. Perintah ini menjalankan jalur perbaikan terurut milik Doctor: pemeriksaan kesehatan modern dapat menyediakan
implementasi `repair()` opsional, sementara area lama masih menggunakan alur
perbaikan Doctor lama. Beberapa temuan lint sengaja hanya bersifat diagnostik, sehingga
munculnya pemeriksaan dalam `--lint --all` tidak berarti `--fix` akan memodifikasi area tersebut.
Kontrak ini memisahkan `detect()` (melaporkan temuan) dari `repair()` (melaporkan
perubahan/diff/efek samping), sehingga tetap membuka jalur untuk
`doctor --fix --dry-run` pada masa mendatang tanpa mengubah pemeriksaan lint menjadi perencana modifikasi.

Beberapa pemeriksaan bawaan dinonaktifkan secara default secara internal agar tetap tersedia bagi
`--all`, `--only`, dan alur perbaikan Doctor tanpa menjadi bagian dari profil otomatisasi
default `doctor --lint`. Tingkat keparahan temuan tetap dikeluarkan untuk setiap
temuan (`info`, `warning`, atau `error`); pemilihan default bukanlah tingkat
keparahan.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

Bidang keluaran JSON:

- `ok`: apakah ada temuan yang memenuhi ambang tingkat keparahan yang dipilih
- `checksRun` / `checksSkipped`: jumlah (dilewati karena profil, `--only`, atau `--skip`)
- `findings`: diagnostik terstruktur dengan `checkId`, `severity`, `message`, serta `path`, `line`, `column`, `ocPath`, `source`, `target`, `requirement`, `fixHint` opsional

Kode keluar:

| Kode | Arti                                                          |
| ---- | ------------------------------------------------------------- |
| `0`  | tidak ada temuan pada atau di atas ambang yang dipilih         |
| `1`  | satu atau beberapa temuan memenuhi ambang yang dipilih         |
| `2`  | kegagalan perintah/runtime sebelum temuan dapat dikeluarkan    |

Flag:

- `--severity-min info|warning|error` (default `warning`): mengontrol hal yang dicetak dan hal yang menyebabkan keluar dengan nilai bukan nol.
- `--all`: menjalankan setiap pemeriksaan lint terdaftar, termasuk pemeriksaan opsional yang dikecualikan dari kumpulan otomatisasi default.
- `--only <id>` (dapat diulang): hanya menjalankan ID pemeriksaan yang disebutkan; ID yang tidak dikenal dilaporkan sebagai temuan kesalahan.
- `--skip <id>` (dapat diulang): mengecualikan pemeriksaan sambil mempertahankan pemeriksaan lainnya tetap aktif.
- `--json`, `--severity-min`, `--all`, `--only`, dan `--skip` memerlukan `--lint`; eksekusi biasa `openclaw doctor` dan `--fix` menolaknya.

## Yang dilakukan (ringkasan)

<AccordionGroup>
  <Accordion title="Kesehatan, UI, dan pembaruan">
    - Pembaruan prapenerbangan opsional untuk instalasi git (hanya interaktif).
    - Pemeriksaan keterkinian protokol UI (membangun ulang Control UI saat skema protokol lebih baru).
    - Pemeriksaan kesehatan + perintah konfirmasi mulai ulang.
    - Catatan Skills dan Plugin hanya untuk masalah; inventaris yang sehat tetap berada di `openclaw skills check` dan `openclaw plugins list`.

  </Accordion>
  <Accordion title="Konfigurasi dan migrasi">
    - Normalisasi konfigurasi untuk bentuk nilai lama.
    - Migrasi konfigurasi Talk dari bidang datar lama `talk.*` ke `talk.provider` + `talk.providers.<provider>`.
    - Pemeriksaan migrasi browser untuk konfigurasi ekstensi Chrome lama dan kesiapan Chrome MCP.
    - Peringatan penggantian penyedia OpenCode (`models.providers.opencode` / `opencode-zen` / `opencode-go`).
    - Migrasi penyedia/profil OpenAI Codex lama (`openai-codex` → `openai`) dan peringatan pembayangan untuk `models.providers.openai-codex` yang usang.
    - Pemeriksaan prasyarat TLS OAuth untuk profil OAuth OpenAI Codex.
    - Peringatan daftar izin Plugin/alat ketika `plugins.allow` bersifat membatasi tetapi kebijakan alat masih meminta karakter pengganti atau alat milik Plugin.
    - Migrasi status lama pada disk (sesi/direktori agen/autentikasi WhatsApp).
    - Migrasi kunci kontrak manifes Plugin lama (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrasi penyimpanan Cron lama (`jobId`, `schedule.cron`, bidang pengiriman/payload tingkat atas, payload `provider`, pekerjaan fallback Webhook `notify: true`).
    - Perbaikan pin runtime Codex CLI (`agentRuntime.id: "codex-cli"` → `"codex"`) pada `agents.defaults`, `agents.list[]`, dan `models.providers.*` (termasuk entri per model).
    - Pembersihan konfigurasi Plugin usang saat Plugin diaktifkan; ketika `plugins.enabled=false`, referensi Plugin usang dipertahankan sebagai konfigurasi pembatasan inert.

  </Accordion>
  <Accordion title="Status dan integritas">
    - Pemeriksaan file kunci sesi dan pembersihan kunci usang.
    - Perbaikan transkrip sesi untuk cabang penulisan ulang prompt duplikat yang dibuat oleh build 2026.4.24 yang terdampak.
    - Deteksi tombstone pemulihan mulai ulang sesi utama dan subagen yang macet. Doctor melaporkan sesi yang terblokir dan hanya memperbaiki flag pembatalan usang yang bertentangan dengan tombstone yang ada; Doctor tidak mengaktifkan kembali pemulihan otomatis.
    - Pemeriksaan integritas dan izin status (sesi, transkrip, direktori status).
    - Pemeriksaan izin file konfigurasi (chmod 600) saat dijalankan secara lokal.
    - Kesehatan autentikasi model: memeriksa kedaluwarsa OAuth, dapat menyegarkan token yang akan segera kedaluwarsa, dan melaporkan status waktu tunggu/profil autentikasi yang dinonaktifkan.

  </Accordion>
  <Accordion title="Gateway, layanan, dan supervisor">
    - Perbaikan citra sandbox saat sandboxing diaktifkan.
    - Migrasi layanan lama dan deteksi Gateway tambahan.
    - Migrasi status lama kanal Matrix (dalam mode `--fix` / `--repair`).
    - Pemeriksaan runtime Gateway (layanan terinstal tetapi tidak berjalan; label launchd yang di-cache).
    - Peringatan status kanal (diperiksa dari Gateway yang sedang berjalan).
    - Pemeriksaan izin khusus kanal berada di bawah `openclaw channels capabilities`; misalnya, izin kanal suara Discord diaudit dengan `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Pemeriksaan responsivitas WhatsApp untuk kesehatan loop peristiwa Gateway yang menurun saat klien TUI lokal masih berjalan; `--fix` hanya menghentikan klien TUI lokal yang telah diverifikasi.
    - Perbaikan rute Codex untuk referensi model lama `openai-codex/*` dalam model utama, fallback, model pembuatan gambar/video, penggantian Heartbeat/subagen/Compaction, hook, penggantian model kanal, dan pin rute sesi; `--fix` menulis ulang semuanya menjadi `openai/*`, memigrasikan profil/urutan autentikasi `openai-codex:*` ke `openai:*`, menghapus pin runtime sesi/seluruh agen yang usang, dan membiarkan rute efektif yang telah diperbaiki menentukan apakah Codex kompatibel.
    - Audit konfigurasi supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
    - Pembersihan lingkungan proxy tertanam untuk layanan Gateway yang menangkap nilai shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` selama instalasi atau pembaruan.
    - Pemeriksaan runtime Gateway (layanan Bun lama yang tidak didukung, jalur pengelola versi).
    - Diagnostik benturan port Gateway (default `18789`).

  </Accordion>
  <Accordion title="Autentikasi, keamanan, dan pemasangan">
    - Peringatan keamanan untuk kebijakan DM terbuka.
    - Pemeriksaan autentikasi Gateway untuk mode token lokal (menawarkan pembuatan token jika tidak ada sumber token; tidak menimpa konfigurasi SecretRef token).
    - Deteksi masalah pemasangan perangkat (permintaan pemasangan pertama kali yang tertunda, peningkatan peran/cakupan yang tertunda, pergeseran cache token perangkat lokal yang usang, dan pergeseran autentikasi rekaman pemasangan).

  </Accordion>
  <Accordion title="Ruang kerja dan shell">
    - Pemeriksaan linger systemd di Linux.
    - Pemeriksaan ukuran file bootstrap ruang kerja (peringatan pemotongan/mendekati batas untuk file konteks).
    - Pemeriksaan kesiapan Skills untuk agen default; melaporkan Skills yang diizinkan tetapi kehilangan biner, lingkungan, konfigurasi, atau persyaratan OS, dan `--fix` dapat menonaktifkan Skills yang tidak tersedia dalam `skills.entries`.
    - Pemeriksaan status penyelesaian shell serta instalasi/peningkatan otomatis.
    - Pemeriksaan kesiapan penyedia embedding pencarian memori (model lokal, kunci API jarak jauh, atau biner QMD).
    - Pemeriksaan instalasi sumber (ketidakcocokan ruang kerja pnpm, aset UI yang hilang, biner tsx yang hilang).
    - Menulis konfigurasi yang diperbarui + metadata wizard.

  </Accordion>
</AccordionGroup>

## Pengisian ulang dan pengaturan ulang UI Dreams

  Adegan Dreams pada UI Kontrol mencakup tindakan **Backfill**, **Reset**, dan **Clear Grounded** untuk alur kerja dreaming grounded. Tindakan ini menggunakan metode RPC bergaya doctor pada Gateway, tetapi **bukan** bagian dari perbaikan/migrasi CLI `openclaw doctor`.

  | Tindakan       | Fungsinya                                                                                                                                                      |
  | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | Backfill       | Memindai file historis `memory/YYYY-MM-DD.md` di ruang kerja aktif, menjalankan proses buku harian REM grounded, dan menulis entri backfill yang dapat dibatalkan ke dalam `DREAMS.md`. |
  | Reset          | Hanya menghapus entri buku harian backfill yang ditandai dari `DREAMS.md`.                                                                                                  |
  | Clear Grounded | Hanya menghapus entri jangka pendek khusus grounded yang telah di-stage dari replay historis dan belum mengakumulasi recall langsung atau dukungan harian.                           |

  Tidak satu pun tindakan ini mengedit `MEMORY.md`, menjalankan migrasi doctor lengkap, atau secara mandiri melakukan stage kandidat grounded ke penyimpanan promosi jangka pendek langsung. Untuk memasukkan replay historis grounded ke jalur promosi mendalam normal, gunakan alur CLI sebagai gantinya:

  ```bash
  openclaw memory rem-backfill --path ./memory --stage-short-term
  ```

  Tindakan tersebut melakukan stage kandidat durable grounded ke penyimpanan dreaming jangka pendek, sementara `DREAMS.md` tetap menjadi permukaan review.

  ## Perilaku dan alasan terperinci

  <AccordionGroup>
  <Accordion title="0. Pembaruan opsional (instalasi git)">
    Jika ini adalah checkout git dan doctor dijalankan secara interaktif, doctor menawarkan pembaruan (fetch/rebase/build) sebelum dijalankan.
  </Accordion>
  <Accordion title="1. Normalisasi konfigurasi">
    Doctor menormalkan bentuk nilai lama ke dalam skema saat ini. Konfigurasi ucapan Talk saat ini adalah `talk.provider` + `talk.providers.<provider>`, dengan konfigurasi suara waktu nyata di bawah `talk.realtime.*`. Doctor menulis ulang bentuk lama `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ke dalam peta penyedia, dan menulis ulang pemilih waktu nyata tingkat teratas lama (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) menjadi `talk.realtime`.

    Doctor juga memperingatkan ketika `plugins.allow` tidak kosong dan kebijakan alat menggunakan wildcard atau entri alat milik plugin. `tools.allow: ["*"]` hanya mencocokkan alat dari plugin yang benar-benar dimuat; ini tidak melewati daftar izin plugin eksklusif.

  </Accordion>
  <Accordion title="2. Migrasi kunci konfigurasi lama">
    Ketika konfigurasi berisi kunci yang tidak digunakan lagi dengan migrasi aktif, perintah lain menolak untuk berjalan dan meminta Anda menjalankan `openclaw doctor`. Doctor menjelaskan kunci lama yang ditemukan, menunjukkan migrasi yang diterapkan, dan menulis ulang `~/.openclaw/openclaw.json` dengan skema yang diperbarui. Saat dimulai, Gateway menolak format konfigurasi lama dan meminta Anda menjalankan `openclaw doctor --fix`; Gateway tidak menulis ulang `openclaw.json` saat dimulai. Migrasi penyimpanan tugas Cron juga ditangani oleh `openclaw doctor --fix`.

    <Note>
      Doctor hanya menyediakan migrasi otomatis selama sekitar dua bulan setelah suatu
      kunci dihentikan. Kunci lama yang lebih tua (misalnya
      `routing.queue`, `routing.bindings`, `routing.agents`/`defaultAgentId`,
      `routing.transcribeAudio`, `agent.*` tingkat teratas, atau `identity` tingkat teratas
      dari bentuk konfigurasi sebelum multiagen) tidak lagi memiliki jalur migrasi;
      konfigurasi yang menggunakannya kini gagal divalidasi alih-alih ditulis ulang. Perbaiki
      kunci tersebut secara manual berdasarkan referensi konfigurasi saat ini sebelum doctor
      dapat melanjutkan.
    </Note>

    Migrasi aktif:

    | Kunci lama                                                                                    | Kunci saat ini                                                                 |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | dihapus (WebChat telah dihentikan)                                                 |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours` (dan per akun)      | `...threadBindings.idleHours`                                               |
    | `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` lama        | `talk.provider` + `talk.providers.<provider>`                               |
    | pemilih Talk waktu nyata tingkat teratas lama (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) | `talk.realtime`                                                              |
    | `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)                             | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | Bidang pembicara TTS `voice`/`voiceName`/`voiceId`                                                 | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>` (semua saluran kecuali Discord)                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>` (semua saluran, termasuk Discord)                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"` (saat dimulai, Gateway juga melewati penyedia yang `api`-nya merupakan nilai enum mendatang/tidak dikenal, alih-alih gagal dalam kondisi tertutup) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | dihapus (pengaturan relay ekstensi Chrome lama)                             |
    | `mcp.servers.*.type` (alias bawaan CLI)                                                        | `mcp.servers.*.transport`                                                    |
    | Alias batas waktu MCP `connectTimeout`/`connect_timeout`/`timeout`                                 | `connectionTimeoutMs`/`requestTimeoutMs`                                    |
    | `defaultModel` tingkat teratas                                                                         | `agents.defaults.model`                                                      |
    | `messages.messagePrefix`                                                                         | `channels.whatsapp.messagePrefix`                                            |
    | `session.maintenance.pruneDays`, `session.resetByType.dm`                                        | `session.maintenance.pruneAfter`, `session.resetByType.direct`               |
    | `tui` tingkat teratas                                                                                  | dihapus (footer TUI menggunakan default ringkas)                            |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | dihapus (server aplikasi Codex selalu mempertahankan alat ruang kerja bawaan Codex sebagai alat native) |
    | `commands.modelsWrite`                                                                           | dihapus (`/models add` tidak digunakan lagi)                                       |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | dihapus (`NO_REPLY` yang sama persis tidak lagi ditulis ulang menjadi teks fallback yang terlihat)  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | dihapus (OpenClaw memiliki prompt sistem yang dihasilkan)                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | dihapus (gunakan `models.providers.<id>.timeoutSeconds` untuk batas waktu model/penyedia yang lambat, tetap di bawah batas maksimum batas waktu agen/proses) |
    | `memorySearch` tingkat teratas                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path` (tingkat mana pun)                                                            | dihapus (indeks memori berada di setiap basis data agen)                       |
    | `heartbeat` tingkat teratas                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | ID kebijakan `plugins.openai-codex`                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | dihapus (tidak digunakan lagi)                                                        |
    | Kenop penyetelan runtime dan saluran yang dihentikan pada 2026.7                                               | dihapus (default produksi bawaan berlaku)                               |

    <Note>
      Baris `plugins.entries.voice-call.config.*` di atas dinormalisasi oleh
      plugin Voice Call itu sendiri pada setiap pemuatan konfigurasi, bukan oleh `openclaw
      doctor`. Plugin tersebut juga mencatat peringatan saat mulai yang mengarah ke `openclaw
      doctor --fix`, tetapi doctor saat ini tidak menulis ulang
      `openclaw.json` untuk kunci-kunci ini; normalisasi milik plugin sendirilah yang
      menerapkan perubahan saat runtime.
    </Note>

    Panduan akun default untuk saluran multiakun:

    - Jika dua atau lebih entri `channels.<channel>.accounts` dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa perutean fallback dapat memilih akun yang tidak diharapkan.
    - Jika `channels.<channel>.defaultAccount` ditetapkan ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

  </Accordion>
  <Accordion title="2b. Penggantian penyedia OpenCode">
    Jika Anda telah menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go` secara manual, pengaturan tersebut menggantikan katalog bawaan OpenCode dari `openclaw/plugin-sdk/llm`. Hal itu dapat memaksa model menggunakan API yang salah atau membuat biaya menjadi nol. Doctor memperingatkan agar Anda dapat menghapus penggantian tersebut dan memulihkan perutean API + biaya per model.
  </Accordion>
  <Accordion title="2c. Migrasi browser dan kesiapan Chrome MCP">
    Jika konfigurasi browser Anda masih mengarah ke jalur ekstensi Chrome yang telah dihapus, doctor menormalisasinya ke model pemasangan Chrome MCP lokal-host saat ini (`browser.profiles.*.driver: "extension"` → `"existing-session"`; `browser.relayBindHost` dihapus).

    Doctor juga mengaudit jalur Chrome MCP lokal-host saat Anda menggunakan `defaultProfile: "user"` atau profil `existing-session` yang dikonfigurasi:

    - memeriksa apakah Google Chrome terpasang pada host yang sama untuk profil koneksi otomatis default
    - memeriksa versi Chrome yang terdeteksi dan memperingatkan jika versinya di bawah Chrome 144
    - mengingatkan Anda untuk mengaktifkan debugging jarak jauh di halaman inspeksi browser (misalnya `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, atau `edge://inspect/#remote-debugging`)

    Doctor tidak dapat mengaktifkan pengaturan sisi Chrome untuk Anda. Chrome MCP lokal-host tetap memerlukan browser berbasis Chromium 144+ pada host gateway/node, berjalan secara lokal, dengan debugging jarak jauh diaktifkan dan permintaan persetujuan pemasangan pertama disetujui di browser.

    Kesiapan di sini hanya mencakup prasyarat pemasangan lokal. Existing-session mempertahankan batas rute Chrome MCP saat ini; rute lanjutan seperti `responsebody`, ekspor PDF, intersepsi unduhan, dan tindakan batch tetap memerlukan browser terkelola atau profil CDP mentah. Pemeriksaan ini tidak berlaku untuk Docker, sandbox, browser jarak jauh, atau alur headless lainnya, yang tetap menggunakan CDP mentah.

  </Accordion>
  <Accordion title="2d. Prasyarat TLS OAuth">
    Saat profil OAuth OpenAI Codex dikonfigurasi, doctor menguji endpoint otorisasi OpenAI untuk memverifikasi bahwa tumpukan TLS Node/OpenSSL lokal dapat memvalidasi rantai sertifikat. Jika pengujian gagal akibat kesalahan sertifikat (misalnya `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat yang ditandatangani sendiri), doctor menampilkan panduan perbaikan khusus platform. Pada macOS dengan Node dari Homebrew, perbaikannya biasanya adalah `brew postinstall ca-certificates`. Dengan `--deep`, pengujian tetap dijalankan meskipun gateway sehat.
  </Accordion>
  <Accordion title="2e. Penggantian penyedia OAuth Codex">
    Jika sebelumnya Anda menambahkan pengaturan transpor OpenAI lama di bawah `models.providers.openai-codex`, pengaturan tersebut dapat membayangi jalur penyedia OAuth Codex bawaan. Doctor memperingatkan saat menemukan pengaturan transpor lama tersebut bersama OAuth Codex agar Anda dapat menghapus atau menulis ulang penggantian transpor usang dan memulihkan perilaku perutean saat ini. Proksi khusus dan penggantian khusus header tetap didukung dan tidak memicu peringatan ini, tetapi rute permintaan buatan tersebut tidak memenuhi syarat untuk pemilihan Codex implisit.
  </Accordion>
  <Accordion title="2f. Perbaikan rute Codex">
    Doctor memeriksa referensi model `openai-codex/*` lama. Perutean harness Codex native menggunakan referensi model `openai/*` kanonis, tetapi prefiks saja tidak pernah memilih Codex. Jika kebijakan runtime tidak ditetapkan atau bernilai `auto`, hanya rute resmi HTTPS Platform Responses atau ChatGPT Responses yang persis cocok dan tanpa penggantian permintaan buatan yang memenuhi syarat. Lihat [runtime agen implisit OpenAI](/id/providers/openai#implicit-agent-runtime).

    Dalam mode `--fix` / `--repair`, doctor menulis ulang referensi agen default dan per agen yang terdampak, termasuk model utama, fallback, model pembuatan gambar/video, penggantian heartbeat/subagen/compaction, hook, penggantian model saluran, dan status rute sesi tersimpan yang usang:

    - `openai-codex/gpt-*` menjadi `openai/gpt-*`.
    - Maksud Codex dipindahkan ke entri `agentRuntime.id: "codex"` yang cakupannya dibatasi per penyedia/model untuk referensi model agen yang diperbaiki.
    - Konfigurasi runtime seluruh agen yang usang dan pin runtime sesi tersimpan dihapus karena pemilihan runtime dicakup per penyedia/model.
    - Kebijakan runtime penyedia/model yang ada dipertahankan kecuali referensi model lama yang diperbaiki memerlukan perutean Codex untuk mempertahankan jalur autentikasi lama.
    - Daftar fallback model yang ada dipertahankan dengan entri lamanya ditulis ulang; pengaturan per model yang disalin dipindahkan dari kunci lama ke kunci `openai/*` kanonis.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride` sesi tersimpan, pemberitahuan fallback, dan pin profil autentikasi diperbaiki di semua penyimpanan sesi agen yang ditemukan.
    - Doctor secara terpisah memperbaiki pin `agentRuntime.id: "codex-cli"` usang (ID runtime lama yang berbeda) menjadi `"codex"` di seluruh entri model `agents.defaults`, `agents.list[]`, dan `models.providers.*`.
    - `/codex ...` berarti "mengontrol atau mengikat percakapan Codex native dari chat."
    - `/acp ...` atau `runtime: "acp"` berarti "menggunakan adaptor ACP/acpx eksternal."

  </Accordion>
  <Accordion title="2g. Pembersihan rute sesi">
    Doctor juga memindai penyimpanan sesi agen yang ditemukan untuk mencari status rute usang yang dibuat otomatis setelah Anda memindahkan model atau runtime yang dikonfigurasi dari rute milik plugin seperti Codex.

    `openclaw doctor --fix` dapat menghapus status usang yang dibuat otomatis seperti pin model `modelOverrideSource: "auto"`, metadata model runtime, ID harness yang dipasangi pin, pengikatan sesi CLI, dan penggantian profil autentikasi otomatis saat rute pemiliknya tidak lagi dikonfigurasi. Pilihan model sesi eksplisit milik pengguna atau sesi lama dilaporkan untuk ditinjau secara manual dan dibiarkan tidak berubah; alihkan dengan `/model ...`, `/new`, atau reset sesi saat rute tersebut tidak lagi dimaksudkan untuk digunakan.

  </Accordion>
  <Accordion title="3. Migrasi status lama (tata letak disk)">
    Doctor dapat memigrasikan tata letak lama pada disk ke struktur saat ini:

    - Penyimpanan sesi + transkrip: dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
    - Direktori agen: dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
    - Status autentikasi WhatsApp (Baileys): dari `~/.openclaw/credentials/*.json` lama (kecuali `oauth.json`) ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID akun default: `default`)
    - Identitas perangkat bertanda tangan: dari `~/.openclaw/identity/device.json` ke baris `device_identities` `primary` di `state/openclaw.sqlite`; file autentikasi perangkat terpisah dibiarkan tidak berubah

    Migrasi ini dilakukan dengan upaya terbaik dan idempoten; doctor mengeluarkan peringatan saat meninggalkan folder lama sebagai cadangan. Gateway/CLI juga memigrasikan otomatis sesi lama + direktori agen saat mulai agar riwayat/autentikasi/model ditempatkan di jalur per agen tanpa menjalankan doctor secara manual. Autentikasi WhatsApp sengaja hanya dimigrasikan melalui `openclaw doctor`. Normalisasi penyedia/peta penyedia Talk membandingkan berdasarkan kesetaraan struktural, sehingga perbedaan yang hanya berupa urutan kunci tidak lagi memicu perubahan `doctor --fix` tanpa operasi secara berulang.

  </Accordion>
  <Accordion title="3a. Migrasi manifes plugin lama">
    Doctor memindai semua manifes plugin yang terpasang untuk mencari kunci kapabilitas tingkat atas yang tidak digunakan lagi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Jika ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts` dan menulis ulang file manifes di tempat. Migrasi ini idempoten; jika `contracts` sudah memiliki nilai yang sama, kunci lama dihapus tanpa menduplikasi data.
  </Accordion>
  <Accordion title="3b. Migrasi penyimpanan cron lama">
    Doctor juga memeriksa penyimpanan tugas cron (`~/.openclaw/cron/jobs.json` secara default, atau `cron.store` jika diganti) untuk bentuk tugas lama yang masih diterima penjadwal demi kompatibilitas.

    Pembersihan cron saat ini meliputi:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - bidang payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
    - bidang pengiriman tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias pengiriman `provider` payload → `delivery.channel` eksplisit
    - tugas fallback webhook `notify: true` lama → pengiriman webhook eksplisit dari nilai mentah `cron.webhook` yang telah dihentikan jika valid; tugas pengumuman mempertahankan pengiriman chat dan memperoleh `delivery.completionDestination`. Doctor kemudian menghapus kunci konfigurasi lama. Tanpa webhook lama yang dapat digunakan, penanda `notify` tingkat atas yang tidak aktif dihapus untuk tugas tanpa target (pengiriman yang ada, termasuk pengumuman, dipertahankan) karena pengiriman runtime tidak pernah membacanya.

    Gateway juga membersihkan baris cron yang salah bentuk saat dimuat agar tugas yang valid tetap berjalan. Baris mentah yang salah bentuk disalin ke `jobs-quarantine.json` di sebelah penyimpanan aktif sebelum dihapus dari `jobs.json`; doctor melaporkan baris yang dikarantina agar Anda dapat meninjau atau memperbaikinya secara manual.

    Saat mulai, Gateway menormalisasi proyeksi runtime dan mengabaikan penanda `notify` tingkat atas, tetapi membiarkan status cron tersimpan untuk diperbaiki doctor. Doctor menghapus penanda yang tidak aktif untuk tugas tanpa target migrasi (`delivery.mode` tidak ada/absen, target webhook lama yang tidak dapat digunakan, atau pengiriman pengumuman/chat yang sudah ada), tanpa mengubah pengiriman yang ada, sehingga eksekusi `doctor --fix` berulang tidak lagi memperingatkan tentang tugas yang sama.

    Di Linux, doctor juga memperingatkan jika crontab pengguna masih memanggil `~/.openclaw/bin/ensure-whatsapp.sh` lama. Skrip lokal-host tersebut tidak dipelihara oleh OpenClaw saat ini dan dapat menulis pesan `Gateway inactive` yang keliru ke `~/.openclaw/logs/whatsapp-health.log` saat cron tidak dapat menjangkau bus pengguna systemd. Hapus entri crontab usang dengan `crontab -e`; gunakan `openclaw channels status --probe`, `openclaw doctor`, dan `openclaw gateway status` untuk pemeriksaan kesehatan saat ini.

  </Accordion>
  <Accordion title="3c. Pembersihan kunci sesi">
    Doctor memindai setiap direktori sesi agen untuk mencari berkas kunci tulis usang yang tertinggal saat sesi berakhir secara tidak normal. Untuk setiap berkas kunci yang ditemukan, Doctor melaporkan: path, PID, apakah PID masih aktif, usia kunci, dan apakah kunci dianggap usang (PID mati, metadata pemilik tidak valid, lebih lama dari 30 menit, atau PID aktif yang terbukti milik proses non-OpenClaw). Dalam mode `--fix` / `--repair`, Doctor secara otomatis menghapus kunci dengan pemilik yang mati, yatim, didaur ulang, tidak valid dan lama, atau bukan OpenClaw. Kunci lama yang masih dimiliki oleh proses OpenClaw aktif dilaporkan tetapi dibiarkan tetap ada agar Doctor tidak memutus penulis transkrip yang aktif.
  </Accordion>
  <Accordion title="3d. Perbaikan cabang transkrip sesi">
    Doctor memindai berkas JSONL sesi agen untuk mencari bentuk cabang duplikat yang dibuat oleh bug penulisan ulang transkrip prompt versi 2026.4.24: giliran pengguna yang ditinggalkan dengan konteks runtime internal OpenClaw serta cabang saudara aktif yang berisi prompt pengguna terlihat yang sama. Dalam mode `--fix` / `--repair`, Doctor mencadangkan setiap berkas yang terdampak di samping berkas asli dan menulis ulang transkrip ke cabang aktif agar riwayat Gateway dan pembaca memori tidak lagi melihat giliran duplikat.
  </Accordion>
  <Accordion title="4. Pemeriksaan integritas status (persistensi sesi, perutean, dan keamanan)">
    Direktori status adalah batang otak operasional. Jika direktori ini hilang, sesi, kredensial, log, dan konfigurasi akan hilang kecuali Anda memiliki cadangan di tempat lain.

    Doctor memeriksa:

    - **Direktori status tidak ada**: memperingatkan tentang kehilangan status yang fatal, meminta Anda membuat ulang direktori, dan mengingatkan bahwa data yang hilang tidak dapat dipulihkan.
    - **Izin direktori status**: memverifikasi kemampuan tulis; menawarkan perbaikan izin (dan menampilkan petunjuk `chown` saat ketidakcocokan pemilik/grup terdeteksi).
    - **Direktori status tersinkronisasi cloud macOS**: memperingatkan saat status berada di bawah iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau `~/Library/CloudStorage/...`, karena path yang didukung sinkronisasi dapat menyebabkan I/O lebih lambat serta kondisi balapan kunci/sinkronisasi.
    - **Direktori status SD atau eMMC Linux**: memperingatkan saat status berada pada sumber pemasangan `mmcblk*`, karena I/O acak yang didukung SD/eMMC dapat menjadi lebih lambat dan lebih cepat aus akibat penulisan sesi dan kredensial.
    - **Direktori status volatil Linux**: memperingatkan saat status berada di `tmpfs` atau `ramfs`, karena sesi, kredensial, konfigurasi, dan status SQLite (beserta berkas pendamping WAL/jurnal) hilang saat sistem dimulai ulang. Pemasangan Docker `overlay` sengaja tidak ditandai karena lapisan yang dapat ditulis tetap bertahan setelah hos dimulai ulang selama kontainer tetap ada.
    - **Direktori sesi tidak ada**: `sessions/` dan direktori penyimpanan sesi diperlukan untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
    - **Ketidakcocokan transkrip**: memperingatkan saat entri sesi terbaru tidak memiliki berkas transkrip.
    - **Sesi utama "JSONL 1 baris"**: menandai saat transkrip utama hanya memiliki satu baris (riwayat tidak terakumulasi).
    - **Beberapa direktori status**: memperingatkan saat terdapat beberapa folder `~/.openclaw` di berbagai direktori beranda, atau saat `OPENCLAW_STATE_DIR` menunjuk ke lokasi lain (riwayat dapat terbagi di antara instalasi).
    - **Pengingat mode jarak jauh**: jika `gateway.mode=remote`, Doctor mengingatkan Anda untuk menjalankannya pada hos jarak jauh (status berada di sana).
    - **Izin berkas konfigurasi**: memperingatkan jika `~/.openclaw/openclaw.json` dapat dibaca oleh grup/semua pengguna dan menawarkan untuk memperketatnya menjadi `600`.

  </Accordion>
  <Accordion title="5. Kesehatan autentikasi model (kedaluwarsa OAuth)">
    Doctor memeriksa profil OAuth di penyimpanan autentikasi, memperingatkan saat token akan/sudah kedaluwarsa, dan dapat menyegarkannya jika aman. Jika profil OAuth/token Anthropic sudah usang, Doctor menyarankan kunci API Anthropic atau jalur token penyiapan Anthropic. Prompt penyegaran hanya muncul saat dijalankan secara interaktif (TTY); `--non-interactive` melewati upaya penyegaran.

    Saat penyegaran OAuth gagal secara permanen (misalnya `refresh_token_reused`, `invalid_grant`, atau penyedia meminta Anda masuk kembali), Doctor melaporkan bahwa autentikasi ulang diperlukan dan mencetak perintah `openclaw models auth login --provider ...` persis yang harus dijalankan.

    Doctor juga melaporkan profil autentikasi yang untuk sementara tidak dapat digunakan karena masa tunggu singkat (batas laju/batas waktu/kegagalan autentikasi) atau penonaktifan yang lebih lama (kegagalan penagihan/kredit).

    Profil OAuth Codex lama yang tokennya berada di Keychain macOS (orientasi awal lama sebelum tata letak berkas pendamping berbasis berkas) hanya diperbaiki oleh Doctor. Jalankan `openclaw doctor --fix` satu kali dari terminal interaktif untuk memigrasikan token lama berbasis Keychain secara langsung ke dalam `auth-profiles.json`; setelah itu, giliran tertanam (Telegram, cron, pengiriman subagen) mengenalinya sebagai profil OAuth OpenAI kanonis.

  </Accordion>
  <Accordion title="6. Validasi model hook">
    Jika `hooks.gmail.model` ditetapkan, Doctor memvalidasi referensi model terhadap katalog dan daftar izin serta memperingatkan saat referensi tersebut tidak dapat dikenali atau tidak diizinkan.
  </Accordion>
  <Accordion title="7. Perbaikan citra sandbox">
    Saat sandbox diaktifkan, Doctor memeriksa citra Docker dan menawarkan untuk membangun atau beralih ke nama lama jika citra saat ini tidak ada.
  </Accordion>
  <Accordion title="7b. Pembersihan instalasi Plugin">
    Dalam mode `openclaw doctor --fix` / `openclaw doctor --repair`, Doctor menghapus status penahapan dependensi Plugin lama yang dihasilkan OpenClaw: root dependensi hasil pembuatan yang usang, direktori tahap instalasi lama, sisa lokal paket dari kode perbaikan dependensi Plugin terpaket sebelumnya, serta salinan npm terkelola yatim atau dipulihkan dari Plugin `@openclaw/*` terpaket yang dapat membayangi manifes terpaket saat ini. Doctor juga menautkan kembali paket `openclaw` hos ke dalam Plugin npm terkelola yang mendeklarasikan `peerDependencies.openclaw`, agar impor runtime lokal paket seperti `openclaw/plugin-sdk/*` tetap dapat dikenali setelah pembaruan atau perbaikan npm.

    Doctor juga dapat menginstal ulang Plugin yang dapat diunduh dan hilang saat konfigurasi merujuknya tetapi registri Plugin lokal tidak dapat menemukannya (`plugins.entries` material, pengaturan saluran/penyedia/pencarian yang dikonfigurasi, runtime agen yang dikonfigurasi). Selama pembaruan paket, Doctor menghindari penginstalan ulang paket Plugin ketika paket inti sedang diganti; jalankan kembali `openclaw doctor --fix` setelah pembaruan jika Plugin yang dikonfigurasi masih perlu dipulihkan. Di luar pengecualian startup citra kontainer di bawah ini, startup Gateway dan pemuatan ulang konfigurasi tidak menjalankan perbaikan paket; instalasi Plugin tetap merupakan pekerjaan Doctor/instalasi/pembaruan yang eksplisit.

    Startup Gateway dalam kontainer memiliki pengecualian peningkatan versi yang terbatas: saat `openclaw gateway run` dimulai pada versi OpenClaw baru, proses tersebut menjalankan migrasi status yang aman dan konvergensi Plugin pasca-inti yang ada sebelum kesiapan, lalu mencatat titik pemeriksaan per versi. Proses startup ini dapat membersihkan catatan Plugin terpaket yang usang, memperbaiki tautan Plugin lokal, menginstal ulang paket Plugin yang dikonfigurasi saat jalur konvergensi memerlukannya, dan memeriksa payload Plugin aktif. Jika startup tidak dapat melakukan perbaikan dengan aman, jalankan citra yang sama satu kali dengan `openclaw doctor --fix` terhadap status/konfigurasi terpasang yang sama sebelum memulai ulang kontainer secara normal.

  </Accordion>
  <Accordion title="8. Migrasi layanan Gateway dan petunjuk pembersihan">
    Doctor mendeteksi layanan Gateway lama (launchd/systemd/schtasks) dan menawarkan untuk menghapusnya serta menginstal layanan OpenClaw menggunakan port Gateway saat ini. Doctor juga dapat memindai layanan tambahan yang menyerupai Gateway dan mencetak petunjuk pembersihan. Layanan Gateway OpenClaw yang dinamai berdasarkan profil dianggap sebagai layanan kelas utama dan tidak ditandai sebagai "tambahan."

    Di Linux, jika layanan Gateway tingkat pengguna tidak ada tetapi layanan Gateway OpenClaw tingkat sistem tersedia, Doctor tidak menginstal layanan tingkat pengguna kedua secara otomatis. Periksa dengan `openclaw gateway status --deep` atau `openclaw doctor --deep`, lalu hapus duplikat atau tetapkan `OPENCLAW_SERVICE_REPAIR_POLICY=external` saat supervisor sistem mengelola siklus hidup Gateway.

  </Accordion>
  <Accordion title="8b. Migrasi Matrix saat startup">
    Saat akun saluran Matrix memiliki migrasi status lama yang tertunda atau dapat ditindaklanjuti, Doctor (dalam mode `--fix` / `--repair`) membuat snapshot pramigrasi lalu menjalankan langkah migrasi dengan upaya terbaik: migrasi status Matrix lama dan persiapan status terenkripsi lama. Kedua langkah tersebut tidak fatal; kesalahan dicatat dan startup dilanjutkan. Dalam mode hanya baca (`openclaw doctor` tanpa `--fix`), pemeriksaan ini sepenuhnya dilewati.
  </Accordion>
  <Accordion title="8c. Pemasangan perangkat dan penyimpangan autentikasi">
    Doctor memeriksa status pemasangan perangkat sebagai bagian dari pemeriksaan kesehatan normal, dengan melaporkan:

    - permintaan pemasangan pertama kali yang tertunda
    - peningkatan peran atau cakupan yang tertunda untuk perangkat yang telah dipasangkan
    - perbaikan ketidakcocokan kunci publik saat ID perangkat masih cocok tetapi identitas perangkat tidak lagi cocok dengan catatan yang disetujui
    - catatan pemasangan yang tidak memiliki token aktif untuk peran yang disetujui
    - token pemasangan yang cakupannya menyimpang dari tolok ukur pemasangan yang disetujui
    - entri token perangkat yang di-cache secara lokal untuk mesin saat ini yang dibuat sebelum rotasi token di sisi Gateway atau berisi metadata cakupan yang usang

    Doctor tidak menyetujui permintaan pemasangan atau merotasi token perangkat secara otomatis. Doctor mencetak langkah berikutnya secara persis:

    - periksa permintaan yang tertunda dengan `openclaw devices list`
    - setujui permintaan yang tepat dengan `openclaw devices approve <requestId>`
    - rotasi token baru dengan `openclaw devices rotate --device <deviceId> --role <role>`
    - hapus dan setujui ulang catatan usang dengan `openclaw devices remove <deviceId>`

    Hal ini membedakan pemasangan pertama kali dari peningkatan peran/cakupan yang tertunda dan dari penyimpangan token/identitas perangkat yang usang, sehingga menutup celah umum "sudah dipasangkan tetapi masih mendapatkan pesan pemasangan diperlukan."

  </Accordion>
  <Accordion title="9. Peringatan keamanan">
    Doctor hanya menampilkan catatan Keamanan saat menemukan peringatan, seperti penyedia yang terbuka untuk DM tanpa daftar izin atau kebijakan yang dikonfigurasi secara berbahaya. Gunakan `openclaw security audit` untuk inventaris keamanan lengkap.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jika dijalankan sebagai layanan pengguna systemd, Doctor memastikan linger diaktifkan agar Gateway tetap aktif setelah keluar.
  </Accordion>
  <Accordion title="11. Status ruang kerja (Skills, Plugin, dan TaskFlow)">
    Doctor mencetak masalah dan tindakan untuk agen default, bukan inventaris status sehat:

    - **Skills**: mencantumkan nama skill yang diizinkan tetapi tidak dapat digunakan; gunakan `openclaw skills check` untuk detail persyaratan dan jumlah lengkap.
    - **Plugin**: hanya melaporkan ID Plugin yang mengalami kesalahan; gunakan `openclaw plugins list` untuk inventaris Plugin yang dimuat, diimpor, dinonaktifkan, dan terpaket.
    - **Peringatan kompatibilitas Plugin**: menandai Plugin yang memiliki masalah kompatibilitas dengan runtime saat ini.
    - **Diagnostik Plugin**: menampilkan setiap peringatan atau kesalahan saat pemuatan yang dikeluarkan oleh registri Plugin.
    - **Pemulihan TaskFlow**: menampilkan TaskFlow terkelola mencurigakan yang memerlukan pemeriksaan atau pembatalan manual.
    - **CLI Claude**: hanya melaporkan masalah biner, autentikasi, profil, ruang kerja, atau direktori proyek; detail pemeriksaan yang sehat dihilangkan.

  </Accordion>
  <Accordion title="11b. Ukuran berkas bootstrap">
    Doctor memeriksa apakah berkas bootstrap ruang kerja (misalnya `AGENTS.md`, `CLAUDE.md`, atau berkas konteks lain yang diinjeksi) mendekati atau melampaui anggaran karakter yang dikonfigurasi. Doctor melaporkan jumlah karakter mentah dibandingkan karakter yang diinjeksi per berkas, persentase pemotongan, penyebab pemotongan (`max/file` atau `max/total`), dan total karakter yang diinjeksi sebagai bagian dari total anggaran. Saat berkas dipotong atau mendekati batas, Doctor mencetak kiat untuk menyesuaikan `agents.defaults.bootstrapMaxChars` dan `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Pelengkapan shell">
    Doctor memeriksa apakah pelengkapan tab terinstal untuk shell saat ini (zsh, bash, fish, atau PowerShell):

    - Jika profil shell menggunakan pola penyelesaian dinamis yang lambat (`source <(openclaw completion ...)`), doctor memutakhirkannya ke varian berkas cache yang lebih cepat.
    - Jika penyelesaian dikonfigurasi dalam profil tetapi berkas cache tidak ada, doctor membuat ulang cache secara otomatis.
    - Jika penyelesaian sama sekali belum dikonfigurasi, doctor meminta untuk menginstalnya (hanya mode interaktif; dilewati dengan `--non-interactive`).

    Jalankan `openclaw completion --write-state` untuk membuat ulang cache secara manual.

  </Accordion>
  <Accordion title="11d. Pembersihan plugin saluran usang">
    Saat `openclaw doctor --fix` menghapus plugin saluran yang tidak ada, perintah ini juga menghapus konfigurasi lingkup saluran yang menggantung dan merujuk ke plugin tersebut: entri `channels.<id>`, target heartbeat yang menyebutkan saluran tersebut, dan penggantian `agents.*.models["<channel>/*"]`. Ini mencegah perulangan boot Gateway ketika runtime saluran sudah tidak ada, tetapi konfigurasi masih meminta gateway untuk terikat dengannya.
  </Accordion>
  <Accordion title="12. Pemeriksaan autentikasi Gateway (token lokal)">
    Doctor memeriksa kesiapan autentikasi token gateway lokal.

    - Jika mode token memerlukan token dan tidak ada sumber token, doctor menawarkan untuk membuatnya.
    - Jika `gateway.auth.token` dikelola oleh SecretRef tetapi tidak tersedia, doctor memberikan peringatan dan tidak menimpanya dengan teks biasa.
    - `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya jika tidak ada SecretRef token yang dikonfigurasi.

  </Accordion>
  <Accordion title="12b. Perbaikan hanya-baca yang memahami SecretRef">
    Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku gagal-cepat runtime.

    - `openclaw doctor --fix` menggunakan model ringkasan SecretRef hanya-baca yang sama seperti perintah keluarga status untuk perbaikan konfigurasi yang ditargetkan.
    - Contoh: perbaikan Telegram `allowFrom` / `groupAllowFrom` `@username` mencoba menggunakan kredensial bot yang dikonfigurasi jika tersedia.
    - Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia pada jalur perintah saat ini, doctor melaporkan bahwa kredensial telah dikonfigurasi tetapi tidak tersedia dan melewati resolusi otomatis, alih-alih mengalami crash atau salah melaporkan bahwa token tidak ada.

  </Accordion>
  <Accordion title="13. Pemeriksaan kesehatan + mulai ulang Gateway">
    Doctor menjalankan pemeriksaan kesehatan dan menawarkan untuk memulai ulang gateway saat kondisinya tampak tidak sehat.
  </Accordion>
  <Accordion title="13b. Kesiapan pencarian memori">
    Doctor memeriksa apakah penyedia embedding pencarian memori yang dikonfigurasi siap untuk agen default. Perilakunya bergantung pada backend dan penyedia yang dikonfigurasi:

    - **Backend QMD**: memeriksa apakah biner `qmd` tersedia dan dapat dimulai. Jika tidak, mencetak panduan perbaikan yang mencakup `npm install -g @tobilu/qmd` (atau padanan Bun) dan opsi jalur biner manual.
    - **Penyedia lokal eksplisit**: memeriksa berkas model lokal atau URL model jarak jauh/dapat diunduh yang dikenali. Jika tidak ada, menyarankan untuk beralih ke penyedia jarak jauh.
    - **Penyedia jarak jauh eksplisit** (`openai`, `voyage`, dan sebagainya): memverifikasi bahwa kunci API tersedia di lingkungan atau penyimpanan autentikasi. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika tidak ada.
    - **Penyedia otomatis lama**: memperlakukan `memorySearch.provider: "auto"` sebagai OpenAI, memeriksa kesiapan OpenAI, dan `doctor --fix` menulis ulangnya menjadi `provider: "openai"`.

    Jika hasil pemeriksaan gateway dalam cache tersedia (gateway sehat pada saat pemeriksaan), doctor membandingkan hasilnya dengan konfigurasi yang terlihat oleh CLI dan mencatat setiap ketidaksesuaian. Doctor tidak memulai ping embedding baru pada jalur default; gunakan perintah status memori mendalam jika Anda menginginkan pemeriksaan penyedia langsung.

    Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

  </Accordion>
  <Accordion title="14. Peringatan status saluran">
    Jika gateway sehat, doctor menjalankan pemeriksaan status saluran dan melaporkan peringatan beserta saran perbaikan.
  </Accordion>
  <Accordion title="15. Audit + perbaikan konfigurasi supervisor">
    Doctor memeriksa konfigurasi supervisor yang terinstal (launchd/systemd/schtasks) untuk menemukan default yang tidak ada atau usang (misalnya dependensi network-online systemd dan jeda mulai ulang). Saat menemukan ketidaksesuaian, doctor merekomendasikan pembaruan dan dapat menulis ulang berkas layanan/tugas sesuai default saat ini.

    Catatan:

    - `openclaw doctor` meminta konfirmasi sebelum menulis ulang konfigurasi supervisor.
    - `openclaw doctor --yes` menerima permintaan perbaikan default.
    - `openclaw doctor --fix` menerapkan perbaikan yang direkomendasikan tanpa meminta konfirmasi (`--repair` adalah alias).
    - `openclaw doctor --fix --force` menimpa konfigurasi supervisor khusus.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mempertahankan doctor dalam mode hanya-baca untuk siklus hidup layanan gateway. Doctor tetap melaporkan kesehatan layanan dan menjalankan perbaikan nonlayanan, tetapi melewati instalasi/mulai/mulai ulang/bootstrap layanan, penulisan ulang konfigurasi supervisor, dan pembersihan layanan lama karena supervisor eksternal memiliki siklus hidup tersebut.
    - Di Linux, doctor tidak menulis ulang metadata perintah/titik masuk saat unit gateway systemd yang sesuai sedang aktif. Doctor juga mengabaikan unit tambahan mirip gateway nonlama yang tidak aktif selama pemindaian layanan duplikat agar berkas layanan pendamping tidak menimbulkan gangguan pembersihan.
    - Jika autentikasi token memerlukan token dan `gateway.auth.token` dikelola oleh SecretRef, instalasi/perbaikan layanan doctor memvalidasi SecretRef tetapi tidak menyimpan nilai token teks biasa yang telah diresolusi ke dalam metadata lingkungan layanan supervisor.
    - Doctor mendeteksi nilai lingkungan layanan `.env`/yang didukung SecretRef dan dikelola, yang disematkan secara sebaris oleh instalasi LaunchAgent, systemd, atau Windows Scheduled Task lama, lalu menulis ulang metadata layanan agar nilai tersebut dimuat dari sumber runtime, bukan dari definisi supervisor.
    - Doctor mendeteksi saat perintah layanan masih menetapkan `--port` lama setelah perubahan `gateway.port`, lalu menulis ulang metadata layanan ke port saat ini.
    - Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi tidak dapat diresolusi, doctor memblokir jalur instalasi/perbaikan dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi dan `gateway.auth.mode` tidak ditetapkan, doctor memblokir instalasi/perbaikan hingga mode ditetapkan secara eksplisit.
    - Untuk unit systemd pengguna Linux, pemeriksaan penyimpangan token oleh doctor mencakup sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata autentikasi layanan.
    - Perbaikan layanan doctor menolak untuk menulis ulang, menghentikan, atau memulai ulang layanan gateway dari biner OpenClaw lama ketika konfigurasi terakhir kali ditulis oleh versi yang lebih baru. Lihat [pemecahan masalah Gateway](/id/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Anda selalu dapat memaksa penulisan ulang penuh melalui `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostik runtime + port Gateway">
    Doctor memeriksa runtime layanan (PID, status keluar terakhir) dan memperingatkan saat layanan terinstal tetapi sebenarnya tidak berjalan. Doctor juga memeriksa konflik port pada port gateway (default `18789`) dan melaporkan kemungkinan penyebabnya (gateway sudah berjalan, terowongan SSH).
  </Accordion>
  <Accordion title="17. Praktik terbaik runtime Gateway">
    Doctor memperingatkan saat layanan gateway berjalan pada Bun atau jalur Node yang dikelola versi (`nvm`, `fnm`, `volta`, `asdf`, dan sebagainya). Bun tidak dapat membuka penyimpanan status `node:sqlite` milik OpenClaw, sehingga perbaikan memigrasikan layanan Bun lama ke Node. Jalur pengelola versi dapat rusak setelah pemutakhiran karena layanan tidak memuat inisialisasi shell Anda. Doctor menawarkan migrasi ke instalasi Node sistem jika tersedia (Homebrew/apt/choco).

    LaunchAgent macOS yang baru diinstal atau diperbaiki menggunakan PATH sistem kanonis (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`), bukan menyalin PATH shell interaktif, sehingga biner sistem yang dikelola Homebrew tetap tersedia sementara direktori Volta, asdf, fnm, pnpm, dan pengelola versi lainnya tidak mengubah Node mana yang diresolusi oleh proses anak. Layanan Linux tetap mempertahankan root lingkungan eksplisit (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) dan direktori biner pengguna yang stabil, tetapi direktori fallback pengelola versi yang diperkirakan hanya ditulis ke PATH layanan jika direktori tersebut ada di disk.

  </Accordion>
  <Accordion title="18. Penulisan konfigurasi + metadata wizard">
    Doctor menyimpan setiap perubahan konfigurasi dan membubuhkan metadata wizard untuk mencatat eksekusi doctor.
  </Accordion>
  <Accordion title="19. Kiat ruang kerja (pencadangan + sistem memori)">
    Doctor menyarankan sistem memori ruang kerja jika belum ada dan mencetak kiat pencadangan jika ruang kerja belum berada di bawah git.

    Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap mengenai struktur ruang kerja dan pencadangan git (GitHub atau GitLab privat direkomendasikan).

  </Accordion>
</AccordionGroup>

## Terkait

- [Panduan operasional Gateway](/id/gateway)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
