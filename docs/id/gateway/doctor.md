---
read_when:
    - Menambahkan atau memodifikasi migrasi doctor
    - Memperkenalkan perubahan konfigurasi yang tidak kompatibel dengan versi sebelumnya
sidebarTitle: Doctor
summary: 'Perintah doctor: pemeriksaan kesehatan, migrasi konfigurasi, dan langkah-langkah perbaikan'
title: Dokter
x-i18n:
    generated_at: "2026-07-16T18:08:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e5c37c31332a9128767ebf6a853aa618511b9eda7f5840a4f863ec705c58421a
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor` adalah alat perbaikan dan migrasi untuk OpenClaw. Alat ini memperbaiki konfigurasi/status yang usang, memeriksa kesehatan, dan menyediakan langkah-langkah perbaikan yang dapat ditindaklanjuti.

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

    Terima nilai default tanpa permintaan konfirmasi (termasuk langkah perbaikan mulai ulang/layanan/sandbox jika berlaku).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    Terapkan perbaikan yang disarankan tanpa permintaan konfirmasi (`--repair` adalah alias).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    Jalankan pemeriksaan kesehatan terstruktur untuk CI atau otomatisasi pra-pemeriksaan. Hanya-baca: tanpa
    permintaan konfirmasi, perbaikan, migrasi, mulai ulang, atau penulisan status.

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

    Jalankan tanpa permintaan konfirmasi, hanya dengan menerapkan migrasi aman (normalisasi konfigurasi +
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

`openclaw doctor --lint` adalah pasangan `openclaw doctor --fix` yang ramah otomatisasi.
Keduanya menggunakan registri aturan Doctor yang sama, tetapi tidak
memilih atau menindak aturan dengan cara yang sama:

| Mode                     | Permintaan konfirmasi | Menulis konfigurasi/status | Keluaran                    | Gunakan untuk                            |
| ------------------------ | --------------------- | -------------------------- | --------------------------- | ---------------------------------------- |
| `openclaw doctor`        | ya                    | tidak                      | laporan kesehatan yang ramah | manusia yang memeriksa status            |
| `openclaw doctor --fix`  | terkadang             | ya, dengan kebijakan perbaikan | log perbaikan yang ramah | menerapkan perbaikan yang disetujui      |
| `openclaw doctor --lint` | tidak                 | tidak                      | temuan terstruktur           | CI, pra-pemeriksaan, dan gerbang tinjauan |

`doctor --lint` default menjalankan profil otomatisasi aman yang luas: pemeriksaan yang
statis, lokal, dan berguna dalam keluaran CI atau pra-pemeriksaan. Profil ini melewati pemeriksaan opsional yang
bersifat saran, sensitif terhadap lingkungan, bergantung pada layanan langsung, inventaris
akun/ruang kerja, atau pembersihan historis. Gunakan `doctor --lint --all` saat menginginkan
audit lint terdaftar lengkap, termasuk pemeriksaan opsional tersebut, atau `--only <id>` untuk
pemeriksaan yang ditargetkan.

`doctor --fix` tidak menggunakan profil default lint dan tidak menerima
`--all`. Ini menjalankan jalur perbaikan Doctor yang berurutan: pemeriksaan kesehatan modern dapat menyediakan
implementasi `repair()` opsional, dan area lama masih menggunakan alur
perbaikan Doctor lamanya. Beberapa temuan lint sengaja hanya bersifat diagnostik, sehingga
pemeriksaan yang muncul dalam `--lint --all` tidak berarti `--fix` akan mengubah area tersebut.
Kontrak memisahkan `detect()` (melaporkan temuan) dari `repair()` (melaporkan
perubahan/diff/efek samping), yang tetap membuka jalur bagi
`doctor --fix --dry-run` di masa mendatang tanpa mengubah pemeriksaan lint menjadi perencana perubahan.

Beberapa pemeriksaan bawaan dinonaktifkan secara default secara internal agar tetap tersedia bagi
`--all`, `--only`, dan alur perbaikan Doctor tanpa menjadi bagian dari profil otomatisasi
`doctor --lint` default. Tingkat keparahan temuan tetap dikeluarkan per
temuan (`info`, `warning`, atau `error`); pemilihan default bukan tingkat
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
- `checksRun` / `checksSkipped`: jumlah (dilewati oleh profil, `--only`, atau `--skip`)
- `findings`: diagnostik terstruktur dengan `checkId`, `severity`, `message`, serta `path`, `line`, `column`, `ocPath`, `source`, `target`, `requirement`, `fixHint` opsional

Kode keluar:

| Kode | Arti                                                               |
| ---- | ------------------------------------------------------------------ |
| `0`  | tidak ada temuan pada atau di atas ambang yang dipilih              |
| `1`  | satu atau beberapa temuan memenuhi ambang yang dipilih              |
| `2`  | kegagalan perintah/runtime sebelum temuan dapat dikeluarkan          |

Flag:

- `--severity-min info|warning|error` (default `warning`): mengendalikan apa yang ditampilkan dan apa yang menyebabkan kode keluar bukan nol.
- `--all`: menjalankan setiap pemeriksaan lint terdaftar, termasuk pemeriksaan opsional yang dikecualikan dari kumpulan otomatisasi default.
- `--only <id>` (dapat diulang): hanya menjalankan ID pemeriksaan yang disebutkan; ID yang tidak dikenal dilaporkan sebagai temuan kesalahan.
- `--skip <id>` (dapat diulang): mengecualikan pemeriksaan sambil mempertahankan pemeriksaan lainnya tetap aktif.
- `--json`, `--severity-min`, `--all`, `--only`, dan `--skip` memerlukan `--lint`; proses `openclaw doctor` dan `--fix` biasa menolaknya.

## Yang dilakukan (ringkasan)

<AccordionGroup>
  <Accordion title="Kesehatan, UI, dan pembaruan">
    - Pembaruan pra-pemeriksaan opsional untuk instalasi git (hanya interaktif).
    - Pemeriksaan kebaruan protokol UI (membangun ulang UI Kontrol saat skema protokol lebih baru).
    - Pemeriksaan kesehatan + permintaan konfirmasi mulai ulang.
    - Catatan Skills dan Plugin hanya untuk masalah; inventaris yang sehat tetap berada di `openclaw skills check` dan `openclaw plugins list`.

  </Accordion>
  <Accordion title="Konfigurasi dan migrasi">
    - Normalisasi konfigurasi untuk bentuk nilai lama.
    - Migrasi konfigurasi percakapan dari bidang datar lama `talk.*` ke `talk.provider` + `talk.providers.<provider>`.
    - Pemeriksaan migrasi browser untuk konfigurasi ekstensi Chrome lama dan kesiapan MCP Chrome.
    - Peringatan penggantian penyedia OpenCode (`models.providers.opencode` / `opencode-zen` / `opencode-go`).
    - Migrasi penyedia/profil OpenAI Codex lama (`openai-codex` → `openai`) dan peringatan penimpaan untuk `models.providers.openai-codex` yang usang.
    - Pemeriksaan prasyarat TLS OAuth untuk profil OAuth OpenAI Codex.
    - Peringatan daftar yang diizinkan untuk Plugin/alat saat `plugins.allow` bersifat membatasi tetapi kebijakan alat masih meminta karakter pengganti atau alat milik Plugin.
    - Migrasi status lama pada disk (sesi/direktori agen/autentikasi WhatsApp).
    - Migrasi kunci kontrak manifes Plugin lama (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - Migrasi penyimpanan Cron lama (`jobId`, `schedule.cron`, bidang pengiriman/muatan tingkat atas, muatan `provider`, tugas Webhook cadangan `notify: true`).
    - Perbaikan pin runtime CLI Codex (`agentRuntime.id: "codex-cli"` → `"codex"`) di seluruh `agents.defaults`, `agents.list[]`, dan `models.providers.*` (termasuk entri per model).
    - Pembersihan konfigurasi Plugin usang saat Plugin diaktifkan; ketika `plugins.enabled=false`, referensi Plugin usang dipertahankan sebagai konfigurasi penahanan nonaktif.

  </Accordion>
  <Accordion title="Status dan integritas">
    - Pemeriksaan file kunci sesi dan pembersihan kunci usang.
    - Perbaikan transkrip sesi untuk cabang penulisan ulang prompt duplikat yang dibuat oleh build 2026.4.24 yang terdampak.
    - Deteksi penanda pemulihan mulai ulang subagen yang macet, dengan dukungan `--fix` untuk menghapus flag pemulihan dibatalkan yang usang agar proses awal tidak terus menganggap anak sebagai dibatalkan saat mulai ulang.
    - Pemeriksaan integritas status dan izin (sesi, transkrip, direktori status).
    - Pemeriksaan izin file konfigurasi (chmod 600) saat berjalan secara lokal.
    - Kesehatan autentikasi model: memeriksa masa berlaku OAuth, dapat menyegarkan token yang akan kedaluwarsa, dan melaporkan status masa jeda/dinonaktifkan pada profil autentikasi.

  </Accordion>
  <Accordion title="Gateway, layanan, dan supervisor">
    - Perbaikan citra sandbox saat penggunaan sandbox diaktifkan.
    - Migrasi layanan lama dan deteksi Gateway tambahan.
    - Migrasi status lama kanal Matrix (dalam mode `--fix` / `--repair`).
    - Pemeriksaan runtime Gateway (layanan terinstal tetapi tidak berjalan; label launchd tersimpan).
    - Peringatan status kanal (diperiksa dari Gateway yang berjalan).
    - Pemeriksaan izin khusus kanal berada di bawah `openclaw channels capabilities`; misalnya, izin kanal suara Discord diaudit dengan `openclaw channels capabilities --channel discord --target channel:<channel-id>`.
    - Pemeriksaan responsivitas WhatsApp untuk kesehatan perulangan peristiwa Gateway yang menurun saat klien TUI lokal masih berjalan; `--fix` hanya menghentikan klien TUI lokal yang terverifikasi.
    - Perbaikan rute Codex untuk referensi model `openai-codex/*` lama dalam model utama, cadangan, model pembuatan gambar/video, penggantian Heartbeat/subagen/Compaction, hook, penggantian model kanal, dan pin rute sesi; `--fix` menulis ulang referensi tersebut menjadi `openai/*`, memigrasikan profil/urutan autentikasi `openai-codex:*` ke `openai:*`, menghapus pin runtime sesi/seluruh agen yang usang, dan memungkinkan rute efektif yang diperbaiki menentukan apakah Codex kompatibel.
    - Audit konfigurasi supervisor (launchd/systemd/schtasks) dengan perbaikan opsional.
    - Pembersihan lingkungan proksi tertanam untuk layanan Gateway yang menangkap nilai shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` selama instalasi atau pembaruan.
    - Pemeriksaan runtime Gateway (layanan Bun lama yang tidak didukung, jalur pengelola versi).
    - Diagnostik benturan port Gateway (default `18789`).

  </Accordion>
  <Accordion title="Autentikasi, keamanan, dan pemasangan">
    - Peringatan keamanan untuk kebijakan DM terbuka.
    - Pemeriksaan autentikasi Gateway untuk mode token lokal (menawarkan pembuatan token saat tidak ada sumber token; tidak menimpa konfigurasi SecretRef token).
    - Deteksi masalah pemasangan perangkat (permintaan pemasangan pertama kali yang tertunda, peningkatan peran/cakupan yang tertunda, penyimpangan cache token perangkat lokal yang usang, dan penyimpangan autentikasi catatan perangkat terpasang).

  </Accordion>
  <Accordion title="Ruang kerja dan shell">
    - Pemeriksaan linger systemd di Linux.
    - Pemeriksaan ukuran file bootstrap ruang kerja (peringatan pemotongan/mendekati batas untuk file konteks).
    - Pemeriksaan kesiapan Skills untuk agen default; melaporkan Skills yang diizinkan dengan biner, lingkungan, konfigurasi, atau persyaratan OS yang hilang, dan `--fix` dapat menonaktifkan Skills yang tidak tersedia dalam `skills.entries`.
    - Pemeriksaan status pelengkapan shell dan instalasi/peningkatan otomatis.
    - Pemeriksaan kesiapan penyedia embedding pencarian memori (model lokal, kunci API jarak jauh, atau biner QMD).
    - Pemeriksaan instalasi sumber (ketidakcocokan ruang kerja pnpm, aset UI yang hilang, biner tsx yang hilang).
    - Menulis konfigurasi yang diperbarui + metadata wizard.

  </Accordion>
</AccordionGroup>

## Pengisian ulang dan pengaturan ulang UI Dreams

Adegan Dreams pada Control UI mencakup tindakan **Isi Ulang**, **Atur Ulang**, dan **Bersihkan Grounded** untuk alur kerja Dreaming grounded. Tindakan ini menggunakan metode RPC bergaya doctor pada Gateway, tetapi **bukan** bagian dari perbaikan/migrasi CLI `openclaw doctor`.

| Tindakan          | Fungsinya                                                                                                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Isi Ulang         | Memindai file historis `memory/YYYY-MM-DD.md` di ruang kerja aktif, menjalankan tahap buku harian REM grounded, dan menulis entri isi ulang yang dapat dibatalkan ke `DREAMS.md`. |
| Atur Ulang        | Hanya menghapus entri buku harian isi ulang yang ditandai dari `DREAMS.md`.                                                                                          |
| Bersihkan Grounded | Hanya menghapus entri jangka pendek khusus grounded yang telah ditahapkan dari pemutaran ulang historis dan belum mengakumulasi recall langsung atau dukungan harian.       |

Tidak satu pun dari tindakan ini mengedit `MEMORY.md`, menjalankan migrasi doctor lengkap, atau menahapkan kandidat grounded ke penyimpanan promosi jangka pendek langsung secara mandiri. Untuk memasukkan pemutaran ulang historis grounded ke jalur promosi mendalam normal, gunakan alur CLI sebagai gantinya:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Perintah tersebut menahapkan kandidat tahan lama grounded ke penyimpanan Dreaming jangka pendek, sementara `DREAMS.md` tetap menjadi permukaan peninjauan.

## Perilaku dan alasan terperinci

<AccordionGroup>
  <Accordion title="0. Pembaruan opsional (instalasi git)">
    Jika ini adalah checkout git dan doctor berjalan secara interaktif, doctor menawarkan pembaruan (fetch/rebase/build) sebelum dijalankan.
  </Accordion>
  <Accordion title="1. Normalisasi konfigurasi">
    Doctor menormalkan bentuk nilai lama ke dalam skema saat ini. Konfigurasi ucapan Talk saat ini adalah `talk.provider` + `talk.providers.<provider>`, dengan konfigurasi suara waktu nyata di bawah `talk.realtime.*`. Doctor menulis ulang bentuk lama `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` ke dalam peta penyedia, serta menulis ulang pemilih waktu nyata tingkat teratas lama (`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`) menjadi `talk.realtime`.

    Doctor juga memperingatkan ketika `plugins.allow` tidak kosong dan kebijakan alat menggunakan wildcard atau entri alat milik Plugin. `tools.allow: ["*"]` hanya mencocokkan alat dari Plugin yang benar-benar dimuat; ini tidak melewati daftar izin Plugin eksklusif.

  </Accordion>
  <Accordion title="2. Migrasi kunci konfigurasi lama">
    Ketika konfigurasi berisi kunci usang yang memiliki migrasi aktif, perintah lain menolak berjalan dan meminta Anda menjalankan `openclaw doctor`. Doctor menjelaskan kunci lama yang ditemukan, menampilkan migrasi yang diterapkan, dan menulis ulang `~/.openclaw/openclaw.json` dengan skema yang diperbarui. Saat dimulai, Gateway menolak format konfigurasi lama dan meminta Anda menjalankan `openclaw doctor --fix`; Gateway tidak menulis ulang `openclaw.json` saat dimulai. Migrasi penyimpanan tugas Cron juga ditangani oleh `openclaw doctor --fix`.

    <Note>
      Doctor hanya menyediakan migrasi otomatis selama kira-kira dua bulan setelah
      suatu kunci dihentikan. Kunci lama yang lebih tua (misalnya
      `routing.queue`, `routing.bindings`, `routing.agents`/`defaultAgentId`,
      `routing.transcribeAudio`, `agent.*` tingkat teratas, atau `identity`
      tingkat teratas dari bentuk konfigurasi sebelum multiagen) tidak lagi memiliki jalur migrasi;
      konfigurasi yang menggunakannya kini gagal divalidasi alih-alih ditulis ulang. Perbaiki
      kunci tersebut secara manual berdasarkan referensi konfigurasi saat ini sebelum doctor
      dapat melanjutkan.
    </Note>

    Migrasi aktif:

    | Kunci lama                                                                                     | Kunci saat ini                                                                |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | dihapus (WebChat telah dihentikan)                                             |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours` (dan per akun)      | `...threadBindings.idleHours`                                               |
    | `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` lama        | `talk.provider` + `talk.providers.<provider>`                               |
    | pemilih Talk waktu nyata tingkat teratas lama (`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) | `talk.realtime`                                                              |
    | `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)                             | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | Kolom pembicara TTS `voice`/`voiceName`/`voiceId`                                                 | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>` (semua kanal kecuali Discord)                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>` (semua kanal, termasuk Discord)                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"` (saat dimulai, Gateway juga melewati penyedia yang `api`-nya merupakan nilai enum mendatang/tidak dikenal, alih-alih gagal secara tertutup) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | dihapus (pengaturan relai ekstensi Chrome lama)                              |
    | `mcp.servers.*.type` (alias bawaan CLI)                                                        | `mcp.servers.*.transport`                                                    |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | dihapus (server aplikasi Codex selalu mempertahankan alat ruang kerja bawaan Codex sebagai alat bawaan) |
    | `commands.modelsWrite`                                                                           | dihapus (`/models add` telah dihentikan)                                |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | dihapus (`NO_REPLY` yang sama persis tidak lagi ditulis ulang menjadi teks fallback yang terlihat) |
    | `agents.defaults/list[].systemPromptOverride`                                                    | dihapus (OpenClaw memiliki prompt sistem yang dihasilkan)                     |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | dihapus (gunakan `models.providers.<id>.timeoutSeconds` untuk batas waktu model/penyedia yang lambat, tetap di bawah batas atas waktu tunggu agen/proses) |
    | `memorySearch` tingkat teratas                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path` (tingkat mana pun)                                                            | dihapus (indeks memori berada di setiap basis data agen)                      |
    | `heartbeat` tingkat teratas                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | ID kebijakan `plugins.openai-codex`                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | dihapus (usang)                                                               |
    | `diagnostics.memoryPressureBundle`                                                               | `diagnostics.memoryPressureSnapshot`                                        |

    <Note>
      Baris `plugins.entries.voice-call.config.*` di atas dinormalkan oleh
      Plugin Voice Call itu sendiri setiap kali konfigurasi dimuat, bukan oleh `openclaw
      doctor`. Plugin tersebut juga mencatat peringatan saat dimulai yang mengarah ke `openclaw
      doctor --fix`, tetapi doctor saat ini tidak menulis ulang
      `openclaw.json` untuk kunci-kunci ini; normalisasi milik Plugin itulah yang
      menerapkan perubahan saat runtime.
    </Note>

    Panduan akun default untuk kanal multiakun:

    - Jika dua entri `channels.<channel>.accounts` atau lebih dikonfigurasi tanpa `channels.<channel>.defaultAccount` atau `accounts.default`, doctor memperingatkan bahwa perutean fallback dapat memilih akun yang tidak diharapkan.
    - Jika `channels.<channel>.defaultAccount` ditetapkan ke ID akun yang tidak dikenal, doctor memperingatkan dan mencantumkan ID akun yang dikonfigurasi.

  </Accordion>
  <Accordion title="2b. Penggantian penyedia OpenCode">
    Jika Anda telah menambahkan `models.providers.opencode`, `opencode-zen`, atau `opencode-go` secara manual, konfigurasi tersebut menggantikan katalog bawaan OpenCode dari `openclaw/plugin-sdk/llm`. Hal itu dapat memaksa model menggunakan API yang salah atau meniadakan biaya. Doctor memperingatkan agar Anda dapat menghapus penggantian tersebut dan memulihkan perutean API + biaya per model.
  </Accordion>
  <Accordion title="2c. Migrasi browser dan kesiapan Chrome MCP">
    Jika konfigurasi browser Anda masih mengarah ke jalur ekstensi Chrome yang telah dihapus, doctor menormalisasinya ke model pemasangan Chrome MCP lokal-host saat ini (`browser.profiles.*.driver: "extension"` → `"existing-session"`; `browser.relayBindHost` dihapus).

    Doctor juga mengaudit jalur Chrome MCP lokal-host saat Anda menggunakan `defaultProfile: "user"` atau profil `existing-session` yang telah dikonfigurasi:

    - memeriksa apakah Google Chrome terpasang pada host yang sama untuk profil koneksi otomatis default
    - memeriksa versi Chrome yang terdeteksi dan memperingatkan jika versinya lebih rendah dari Chrome 144
    - mengingatkan Anda untuk mengaktifkan debugging jarak jauh di halaman inspeksi browser (misalnya `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`, atau `edge://inspect/#remote-debugging`)

    Doctor tidak dapat mengaktifkan pengaturan pada sisi Chrome untuk Anda. Chrome MCP lokal-host tetap memerlukan browser berbasis Chromium 144+ pada host gateway/node, berjalan secara lokal, dengan debugging jarak jauh diaktifkan dan permintaan persetujuan pemasangan pertama disetujui di browser.

    Kesiapan di sini hanya mencakup prasyarat pemasangan lokal. Existing-session mempertahankan batas rute Chrome MCP saat ini; rute lanjutan seperti `responsebody`, ekspor PDF, intersepsi unduhan, dan tindakan batch tetap memerlukan browser terkelola atau profil CDP mentah. Pemeriksaan ini tidak berlaku untuk alur Docker, sandbox, browser jarak jauh, atau alur headless lainnya, yang tetap menggunakan CDP mentah.

  </Accordion>
  <Accordion title="2d. Prasyarat TLS OAuth">
    Saat profil OAuth OpenAI Codex dikonfigurasi, doctor memeriksa endpoint otorisasi OpenAI untuk memastikan bahwa tumpukan TLS Node/OpenSSL lokal dapat memvalidasi rantai sertifikat. Jika pemeriksaan gagal karena kesalahan sertifikat (misalnya `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, sertifikat kedaluwarsa, atau sertifikat yang ditandatangani sendiri), doctor menampilkan panduan perbaikan khusus platform. Di macOS dengan Node dari Homebrew, perbaikannya biasanya adalah `brew postinstall ca-certificates`. Dengan `--deep`, pemeriksaan tetap dijalankan meskipun gateway sehat.
  </Accordion>
  <Accordion title="2e. Penggantian penyedia OAuth Codex">
    Jika sebelumnya Anda menambahkan pengaturan transportasi OpenAI lama di bawah `models.providers.openai-codex`, pengaturan tersebut dapat membayangi jalur penyedia OAuth Codex bawaan. Doctor memperingatkan saat mendeteksi pengaturan transportasi lama tersebut bersama OAuth Codex agar Anda dapat menghapus atau menulis ulang penggantian transportasi usang dan memulihkan perilaku perutean saat ini. Proksi khusus dan penggantian yang hanya berisi header tetap didukung dan tidak memicu peringatan ini, tetapi rute permintaan yang ditulis tersebut tidak memenuhi syarat untuk pemilihan Codex implisit.
  </Accordion>
  <Accordion title="2f. Perbaikan rute Codex">
    Doctor memeriksa referensi model `openai-codex/*` lama. Perutean harness Codex native menggunakan referensi model `openai/*` kanonis, tetapi prefiks saja tidak pernah memilih Codex. Jika kebijakan runtime tidak ditetapkan atau `auto`, hanya rute resmi HTTPS Platform Responses atau ChatGPT Responses yang cocok persis tanpa penggantian permintaan yang ditulis yang memenuhi syarat. Lihat [runtime agen implisit OpenAI](/id/providers/openai#implicit-agent-runtime).

    Dalam mode `--fix` / `--repair`, doctor menulis ulang referensi agen default dan per agen yang terdampak, termasuk model utama, fallback, model pembuatan gambar/video, penggantian heartbeat/subagen/compaction, hook, penggantian model saluran, dan status rute sesi tersimpan yang usang:

    - `openai-codex/gpt-*` menjadi `openai/gpt-*`.
    - Maksud Codex dipindahkan ke entri `agentRuntime.id: "codex"` dengan cakupan penyedia/model untuk referensi model agen yang diperbaiki.
    - Konfigurasi runtime seluruh agen yang usang dan pin runtime sesi tersimpan dihapus karena pemilihan runtime memiliki cakupan penyedia/model.
    - Kebijakan runtime penyedia/model yang ada dipertahankan kecuali referensi model lama yang diperbaiki memerlukan perutean Codex untuk mempertahankan jalur autentikasi lama.
    - Daftar fallback model yang ada dipertahankan dengan entri lamanya ditulis ulang; pengaturan per model yang disalin dipindahkan dari kunci lama ke kunci `openai/*` kanonis.
    - `modelProvider`/`providerOverride`, `model`/`modelOverride` sesi tersimpan, pemberitahuan fallback, dan pin profil autentikasi diperbaiki di seluruh penyimpanan sesi agen yang ditemukan.
    - Doctor secara terpisah memperbaiki pin `agentRuntime.id: "codex-cli"` usang (id runtime lama yang berbeda) menjadi `"codex"` di seluruh entri model `agents.defaults`, `agents.list[]`, dan `models.providers.*`.
    - `/codex ...` berarti "mengontrol atau mengikat percakapan Codex native dari obrolan."
    - `/acp ...` atau `runtime: "acp"` berarti "menggunakan adaptor ACP/acpx eksternal."

  </Accordion>
  <Accordion title="2g. Pembersihan rute sesi">
    Doctor juga memindai penyimpanan sesi agen yang ditemukan untuk status rute usang yang dibuat otomatis setelah Anda memindahkan model atau runtime yang dikonfigurasi dari rute milik Plugin seperti Codex.

    `openclaw doctor --fix` dapat menghapus status usang yang dibuat otomatis seperti pin model `modelOverrideSource: "auto"`, metadata model runtime, id harness yang dipasangi pin, pengikatan sesi CLI, dan penggantian profil autentikasi otomatis saat rute pemiliknya tidak lagi dikonfigurasi. Pilihan model sesi eksplisit oleh pengguna atau pilihan lama dilaporkan untuk ditinjau secara manual dan dibiarkan tanpa perubahan; alihkan dengan `/model ...`, `/new`, atau atur ulang sesi saat rute tersebut tidak lagi dimaksudkan.

  </Accordion>
  <Accordion title="3. Migrasi status lama (tata letak disk)">
    Doctor dapat memigrasikan tata letak lama di disk ke struktur saat ini:

    - Penyimpanan sesi + transkrip: dari `~/.openclaw/sessions/` ke `~/.openclaw/agents/<agentId>/sessions/`
    - Direktori agen: dari `~/.openclaw/agent/` ke `~/.openclaw/agents/<agentId>/agent/`
    - Status autentikasi WhatsApp (Baileys): dari `~/.openclaw/credentials/*.json` lama (kecuali `oauth.json`) ke `~/.openclaw/credentials/whatsapp/<accountId>/...` (id akun default: `default`)

    Migrasi ini dilakukan berdasarkan upaya terbaik dan bersifat idempoten; doctor mengeluarkan peringatan saat meninggalkan folder lama sebagai cadangan. Gateway/CLI juga memigrasikan sesi lama + direktori agen secara otomatis saat dimulai agar riwayat/autentikasi/model ditempatkan di jalur per agen tanpa perlu menjalankan doctor secara manual. Autentikasi WhatsApp sengaja hanya dimigrasikan melalui `openclaw doctor`. Normalisasi penyedia Talk/peta penyedia membandingkan berdasarkan kesetaraan struktural, sehingga perbedaan yang hanya disebabkan urutan kunci tidak lagi memicu perubahan tanpa efek `doctor --fix` berulang.

  </Accordion>
  <Accordion title="3a. Migrasi manifes Plugin lama">
    Doctor memindai semua manifes Plugin yang terpasang untuk mencari kunci kemampuan tingkat atas yang tidak digunakan lagi (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`). Jika ditemukan, doctor menawarkan untuk memindahkannya ke objek `contracts` dan menulis ulang file manifes di tempat. Migrasi ini bersifat idempoten; jika `contracts` sudah memiliki nilai yang sama, kunci lama dihapus tanpa menduplikasi data.
  </Accordion>
  <Accordion title="3b. Migrasi penyimpanan cron lama">
    Doctor juga memeriksa penyimpanan tugas cron (`~/.openclaw/cron/jobs.json` secara default, atau `cron.store` jika diganti) untuk bentuk tugas lama yang masih diterima penjadwal demi kompatibilitas.

    Pembersihan Cron saat ini mencakup:

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - bidang payload tingkat atas (`message`, `model`, `thinking`, ...) → `payload`
    - bidang pengiriman tingkat atas (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - alias pengiriman `provider` payload → `delivery.channel` eksplisit
    - tugas fallback Webhook `notify: true` lama → pengiriman Webhook eksplisit dari `cron.webhook` jika ditetapkan; tugas pengumuman mempertahankan pengiriman obrolannya dan mendapatkan `delivery.completionDestination`. Jika `cron.webhook` tidak ditetapkan, penanda tingkat atas `notify` yang tidak aktif dihapus untuk tugas tanpa target (pengiriman yang ada, termasuk pengumuman, dipertahankan) karena pengiriman runtime tidak pernah membacanya.

    Gateway juga membersihkan baris cron yang rusak saat pemuatan agar tugas yang valid tetap berjalan. Baris mentah yang rusak disalin ke `jobs-quarantine.json` di samping penyimpanan aktif sebelum dihapus dari `jobs.json`; doctor melaporkan baris yang dikarantina agar Anda dapat meninjau atau memperbaikinya secara manual.

    Saat dimulai, Gateway menormalisasi proyeksi runtime dan mengabaikan penanda tingkat atas `notify`, tetapi membiarkan konfigurasi cron tersimpan untuk diperbaiki doctor. Jika `cron.webhook` tidak ditetapkan, doctor menghapus penanda yang tidak aktif untuk tugas tanpa target migrasi (`delivery.mode` tidak ada/absen, target Webhook yang tidak dapat digunakan, atau pengiriman pengumuman/obrolan yang sudah ada), serta membiarkan pengiriman yang ada tanpa perubahan, sehingga eksekusi `doctor --fix` berulang tidak lagi memperingatkan tentang tugas yang sama. Jika `cron.webhook` ditetapkan tetapi bukan URL HTTP(S) yang valid, doctor tetap memperingatkan dan membiarkan penanda tersebut agar Anda dapat memperbaiki URL.

    Di Linux, doctor juga memperingatkan jika crontab pengguna masih menjalankan `~/.openclaw/bin/ensure-whatsapp.sh` lama. Skrip lokal-host tersebut tidak dikelola oleh OpenClaw saat ini dan dapat menulis pesan `Gateway inactive` palsu ke `~/.openclaw/logs/whatsapp-health.log` saat cron tidak dapat menjangkau bus pengguna systemd. Hapus entri crontab usang dengan `crontab -e`; gunakan `openclaw channels status --probe`, `openclaw doctor`, dan `openclaw gateway status` untuk pemeriksaan kesehatan saat ini.

  </Accordion>
  <Accordion title="3c. Pembersihan kunci sesi">
    Doctor memindai setiap direktori sesi agen untuk mencari file kunci tulis usang yang tertinggal saat sesi berakhir secara tidak normal. Untuk setiap file kunci yang ditemukan, doctor melaporkan: jalur, PID, apakah PID masih aktif, usia kunci, dan apakah kunci dianggap usang (PID mati, metadata pemilik rusak, lebih lama dari 30 menit, atau PID aktif yang terbukti merupakan milik proses non-OpenClaw). Dalam mode `--fix` / `--repair`, doctor secara otomatis menghapus kunci dengan pemilik yang mati, yatim, didaur ulang, rusak-lama, atau non-OpenClaw. Kunci lama yang masih dimiliki proses OpenClaw aktif dilaporkan tetapi dibiarkan agar doctor tidak memutus penulis transkrip aktif.
  </Accordion>
  <Accordion title="3d. Perbaikan cabang transkrip sesi">
    Doctor memindai file JSONL sesi agen untuk mencari bentuk cabang duplikat yang dibuat oleh bug penulisan ulang transkrip prompt 2026.4.24: giliran pengguna yang ditinggalkan dengan konteks runtime internal OpenClaw serta cabang saudara aktif yang memuat prompt pengguna terlihat yang sama. Dalam mode `--fix` / `--repair`, doctor mencadangkan setiap file yang terdampak di samping file asli dan menulis ulang transkrip ke cabang aktif agar pembaca riwayat dan memori gateway tidak lagi melihat giliran duplikat.
  </Accordion>
  <Accordion title="4. Pemeriksaan integritas status (persistensi sesi, perutean, dan keamanan)">
    Direktori status adalah batang otak operasional. Jika direktori tersebut hilang, Anda kehilangan sesi, kredensial, log, dan konfigurasi kecuali Anda memiliki cadangan di tempat lain.

    Doctor memeriksa:

    - **Direktori status tidak ada**: memperingatkan tentang kehilangan status yang fatal, meminta untuk membuat ulang direktori, dan mengingatkan Anda bahwa data yang hilang tidak dapat dipulihkan.
    - **Izin direktori status**: memverifikasi kemampuan tulis; menawarkan untuk memperbaiki izin (dan menampilkan petunjuk `chown` ketika ketidakcocokan pemilik/grup terdeteksi).
    - **Direktori status yang disinkronkan dengan cloud macOS**: memperingatkan ketika status berada di bawah iCloud Drive (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) atau `~/Library/CloudStorage/...`, karena jalur yang didukung sinkronisasi dapat menyebabkan I/O lebih lambat serta kondisi persaingan penguncian/sinkronisasi.
    - **Direktori status SD atau eMMC Linux**: memperingatkan ketika status berada pada sumber mount `mmcblk*`, karena I/O acak berbasis SD/eMMC dapat lebih lambat dan lebih cepat mengalami keausan akibat penulisan sesi dan kredensial.
    - **Direktori status volatil Linux**: memperingatkan ketika status berada di `tmpfs` atau `ramfs`, karena sesi, kredensial, konfigurasi, dan status SQLite (beserta sidecar WAL/jurnal) akan hilang saat boot ulang. Mount Docker `overlay` sengaja tidak ditandai karena lapisan yang dapat ditulis tetap bertahan setelah boot ulang host selama kontainer tetap ada.
    - **Direktori sesi tidak ada**: `sessions/` dan direktori penyimpanan sesi diperlukan untuk mempertahankan riwayat dan menghindari crash `ENOENT`.
    - **Ketidakcocokan transkrip**: memperingatkan ketika entri sesi terbaru tidak memiliki berkas transkrip.
    - **Sesi utama "JSONL 1 baris"**: menandai ketika transkrip utama hanya memiliki satu baris (riwayat tidak terakumulasi).
    - **Beberapa direktori status**: memperingatkan ketika beberapa folder `~/.openclaw` terdapat di berbagai direktori home, atau ketika `OPENCLAW_STATE_DIR` menunjuk ke tempat lain (riwayat dapat terpisah di antara instalasi).
    - **Pengingat mode jarak jauh**: jika `gateway.mode=remote`, doctor mengingatkan Anda untuk menjalankannya pada host jarak jauh (status berada di sana).
    - **Izin berkas konfigurasi**: memperingatkan jika `~/.openclaw/openclaw.json` dapat dibaca oleh grup/semua pengguna dan menawarkan untuk memperketatnya menjadi `600`.

  </Accordion>
  <Accordion title="5. Kesehatan autentikasi model (kedaluwarsa OAuth)">
    Doctor memeriksa profil OAuth dalam penyimpanan autentikasi, memperingatkan ketika token akan/sudah kedaluwarsa, dan dapat menyegarkannya jika aman. Jika profil OAuth/token Anthropic sudah usang, doctor menyarankan kunci API Anthropic atau jalur token penyiapan Anthropic. Permintaan penyegaran hanya muncul ketika dijalankan secara interaktif (TTY); `--non-interactive` melewati upaya penyegaran.

    Ketika penyegaran OAuth gagal secara permanen (misalnya `refresh_token_reused`, `invalid_grant`, atau penyedia meminta Anda masuk kembali), doctor melaporkan bahwa autentikasi ulang diperlukan dan mencetak perintah `openclaw models auth login --provider ...` yang tepat untuk dijalankan.

    Doctor juga melaporkan profil autentikasi yang sementara tidak dapat digunakan akibat masa jeda singkat (batas laju/batas waktu/kegagalan autentikasi) atau penonaktifan yang lebih lama (kegagalan penagihan/kredit).

    Profil OAuth Codex lama yang tokennya tersimpan di macOS Keychain (onboarding lama sebelum tata letak sidecar berbasis berkas) hanya diperbaiki oleh doctor. Jalankan `openclaw doctor --fix` sekali dari terminal interaktif untuk memigrasikan token lama berbasis Keychain secara langsung ke `auth-profiles.json`; setelah itu, giliran tertanam (Telegram, cron, pengiriman subagen) akan mengenalinya sebagai profil OAuth OpenAI kanonis.

  </Accordion>
  <Accordion title="6. Validasi model hook">
    Jika `hooks.gmail.model` ditetapkan, doctor memvalidasi referensi model terhadap katalog dan daftar izin serta memperingatkan ketika referensi tersebut tidak dapat diresolusi atau tidak diizinkan.
  </Accordion>
  <Accordion title="7. Perbaikan image sandbox">
    Ketika sandboxing diaktifkan, doctor memeriksa image Docker dan menawarkan untuk membuat atau beralih ke nama lama jika image saat ini tidak ada.
  </Accordion>
  <Accordion title="7b. Pembersihan instalasi Plugin">
    Doctor menghapus status staging dependensi Plugin lama yang dihasilkan OpenClaw dalam mode `openclaw doctor --fix` / `openclaw doctor --repair`: root dependensi hasil pembuatan yang sudah usang, direktori tahap instalasi lama, sisa lokal paket dari kode perbaikan dependensi Plugin bawaan sebelumnya, serta salinan npm terkelola yang yatim atau dipulihkan dari Plugin `@openclaw/*` bawaan yang dapat membayangi manifes bawaan saat ini. Doctor juga menautkan ulang paket host `openclaw` ke dalam Plugin npm terkelola yang mendeklarasikan `peerDependencies.openclaw`, sehingga impor runtime lokal paket seperti `openclaw/plugin-sdk/*` tetap dapat diresolusi setelah pembaruan atau perbaikan npm.

    Doctor juga dapat menginstal ulang Plugin yang dapat diunduh tetapi tidak ada ketika konfigurasi merujuknya namun registri Plugin lokal tidak dapat menemukannya (`plugins.entries` material, pengaturan saluran/penyedia/pencarian yang dikonfigurasi, runtime agen yang dikonfigurasi). Selama pembaruan paket, doctor menghindari penginstalan ulang paket Plugin saat paket inti sedang diganti; jalankan kembali `openclaw doctor --fix` setelah pembaruan jika Plugin yang dikonfigurasi masih perlu dipulihkan. Di luar pengecualian startup image kontainer di bawah ini, startup Gateway dan pemuatan ulang konfigurasi tidak menjalankan perbaikan paket; instalasi Plugin tetap menjadi pekerjaan doctor/instalasi/pembaruan yang eksplisit.

    Startup Gateway dalam kontainer memiliki pengecualian pemutakhiran yang terbatas: ketika `openclaw gateway run` dimulai pada versi OpenClaw baru, proses tersebut menjalankan migrasi status yang aman dan konvergensi Plugin pasca-inti yang sudah ada sebelum siap, lalu mencatat titik pemeriksaan per versi. Proses startup ini dapat membersihkan catatan Plugin bawaan yang usang, memperbaiki tautan Plugin lokal, menginstal ulang paket Plugin yang dikonfigurasi ketika jalur konvergensi memerlukannya, dan memeriksa payload Plugin aktif. Jika startup tidak dapat memperbaikinya dengan aman, jalankan image yang sama sekali dengan `openclaw doctor --fix` terhadap status/konfigurasi terpasang yang sama sebelum memulai ulang kontainer secara normal.

  </Accordion>
  <Accordion title="8. Migrasi layanan Gateway dan petunjuk pembersihan">
    Doctor mendeteksi layanan Gateway lama (launchd/systemd/schtasks) dan menawarkan untuk menghapusnya serta menginstal layanan OpenClaw menggunakan port Gateway saat ini. Doctor juga dapat memindai layanan tambahan yang menyerupai Gateway dan mencetak petunjuk pembersihan. Layanan Gateway OpenClaw yang dinamai menurut profil dianggap sebagai layanan utama dan tidak ditandai sebagai "tambahan."

    Di Linux, jika layanan Gateway tingkat pengguna tidak ada tetapi layanan Gateway OpenClaw tingkat sistem tersedia, doctor tidak menginstal layanan tingkat pengguna kedua secara otomatis. Periksa dengan `openclaw gateway status --deep` atau `openclaw doctor --deep`, lalu hapus duplikat tersebut atau tetapkan `OPENCLAW_SERVICE_REPAIR_POLICY=external` ketika supervisor sistem mengelola siklus hidup Gateway.

  </Accordion>
  <Accordion title="8b. Migrasi Matrix saat startup">
    Ketika akun saluran Matrix memiliki migrasi status lama yang tertunda atau dapat ditindaklanjuti, doctor (dalam mode `--fix` / `--repair`) membuat snapshot pramigrasi, lalu menjalankan langkah migrasi dengan upaya terbaik: migrasi status Matrix lama dan persiapan status terenkripsi lama. Kedua langkah tidak bersifat fatal; kesalahan dicatat dan startup berlanjut. Dalam mode hanya-baca (`openclaw doctor` tanpa `--fix`), pemeriksaan ini dilewati sepenuhnya.
  </Accordion>
  <Accordion title="8c. Penyandingan perangkat dan penyimpangan autentikasi">
    Doctor memeriksa status penyandingan perangkat sebagai bagian dari pemeriksaan kesehatan normal, dengan melaporkan:

    - permintaan penyandingan pertama kali yang tertunda
    - peningkatan peran atau cakupan yang tertunda untuk perangkat yang sudah disandingkan
    - perbaikan ketidakcocokan kunci publik ketika id perangkat masih cocok tetapi identitas perangkat tidak lagi cocok dengan catatan yang disetujui
    - catatan tersanding yang tidak memiliki token aktif untuk peran yang disetujui
    - token tersanding yang cakupannya menyimpang dari garis dasar penyandingan yang disetujui
    - entri token perangkat yang di-cache secara lokal untuk mesin saat ini yang mendahului rotasi token di sisi Gateway atau membawa metadata cakupan yang usang

    Doctor tidak menyetujui otomatis permintaan penyandingan atau merotasi otomatis token perangkat. Doctor mencetak langkah selanjutnya yang tepat:

    - periksa permintaan tertunda dengan `openclaw devices list`
    - setujui permintaan yang tepat dengan `openclaw devices approve <requestId>`
    - rotasi token baru dengan `openclaw devices rotate --device <deviceId> --role <role>`
    - hapus dan setujui ulang catatan usang dengan `openclaw devices remove <deviceId>`

    Ini membedakan penyandingan pertama kali dari peningkatan peran/cakupan yang tertunda serta dari penyimpangan token/identitas perangkat yang usang, sehingga menutup celah umum "sudah disandingkan tetapi masih mendapatkan pesan bahwa penyandingan diperlukan".

  </Accordion>
  <Accordion title="9. Peringatan keamanan">
    Doctor hanya menampilkan catatan Keamanan ketika menemukan peringatan, seperti penyedia yang terbuka untuk DM tanpa daftar izin atau kebijakan yang dikonfigurasi secara berbahaya. Gunakan `openclaw security audit` untuk inventaris keamanan lengkap.
  </Accordion>
  <Accordion title="10. systemd linger (Linux)">
    Jika dijalankan sebagai layanan pengguna systemd, doctor memastikan linger diaktifkan agar Gateway tetap berjalan setelah logout.
  </Accordion>
  <Accordion title="11. Status ruang kerja (Skills, Plugin, dan TaskFlow)">
    Doctor mencetak masalah dan tindakan untuk agen default, bukan inventaris status sehat:

    - **Skills**: mencantumkan nama skill yang diizinkan tetapi tidak dapat digunakan; gunakan `openclaw skills check` untuk detail persyaratan dan jumlah lengkap.
    - **Plugin**: hanya melaporkan ID Plugin yang mengalami kesalahan; gunakan `openclaw plugins list` untuk inventaris Plugin yang dimuat, diimpor, dinonaktifkan, dan Plugin bundel.
    - **Peringatan kompatibilitas Plugin**: menandai Plugin yang memiliki masalah kompatibilitas dengan runtime saat ini.
    - **Diagnostik Plugin**: menampilkan setiap peringatan atau kesalahan saat pemuatan yang dihasilkan oleh registri Plugin.
    - **Pemulihan TaskFlow**: menampilkan TaskFlow terkelola mencurigakan yang memerlukan pemeriksaan manual atau pembatalan.
    - **CLI Claude**: hanya melaporkan masalah biner, autentikasi, profil, ruang kerja, atau direktori proyek; detail pemeriksaan yang sehat dihilangkan.

  </Accordion>
  <Accordion title="11b. Ukuran berkas bootstrap">
    Doctor memeriksa apakah berkas bootstrap ruang kerja (misalnya `AGENTS.md`, `CLAUDE.md`, atau berkas konteks lain yang diinjeksi) mendekati atau melampaui anggaran karakter yang dikonfigurasi. Doctor melaporkan jumlah karakter mentah dibandingkan yang diinjeksi per berkas, persentase pemotongan, penyebab pemotongan (`max/file` atau `max/total`), dan total karakter yang diinjeksi sebagai bagian dari total anggaran. Ketika berkas dipotong atau mendekati batas, doctor mencetak kiat untuk menyesuaikan `agents.defaults.bootstrapMaxChars` dan `agents.defaults.bootstrapTotalMaxChars`.
  </Accordion>
  <Accordion title="11c. Pelengkapan shell">
    Doctor memeriksa apakah pelengkapan tab terinstal untuk shell saat ini (zsh, bash, fish, atau PowerShell):

    - Jika profil shell menggunakan pola pelengkapan dinamis yang lambat (`source <(openclaw completion ...)`), doctor memutakhirkannya ke varian berkas cache yang lebih cepat.
    - Jika pelengkapan dikonfigurasi dalam profil tetapi berkas cache tidak ada, doctor membuat ulang cache secara otomatis.
    - Jika tidak ada pelengkapan yang dikonfigurasi sama sekali, doctor meminta untuk menginstalnya (hanya mode interaktif; dilewati dengan `--non-interactive`).

    Jalankan `openclaw completion --write-state` untuk membuat ulang cache secara manual.

  </Accordion>
  <Accordion title="11d. Pembersihan Plugin saluran yang usang">
    Ketika `openclaw doctor --fix` menghapus Plugin saluran yang tidak ada, perintah tersebut juga menghapus konfigurasi lingkup saluran yang menggantung dan merujuk ke Plugin itu: entri `channels.<id>`, target Heartbeat yang menyebutkan saluran tersebut, serta penimpaan `agents.*.models["<channel>/*"]`. Ini mencegah perulangan boot Gateway ketika runtime saluran telah hilang tetapi konfigurasi masih meminta Gateway untuk mengikatnya.
  </Accordion>
  <Accordion title="12. Pemeriksaan autentikasi Gateway (token lokal)">
    Doctor memeriksa kesiapan autentikasi token Gateway lokal.

    - Jika mode token memerlukan token dan tidak ada sumber token, doctor menawarkan untuk membuatnya.
    - Jika `gateway.auth.token` dikelola oleh SecretRef tetapi tidak tersedia, doctor memperingatkan dan tidak menimpanya dengan teks biasa.
    - `openclaw doctor --generate-gateway-token` memaksa pembuatan hanya ketika tidak ada SecretRef token yang dikonfigurasi.

  </Accordion>
  <Accordion title="12b. Perbaikan hanya-baca yang mengenali SecretRef">
    Beberapa alur perbaikan perlu memeriksa kredensial yang dikonfigurasi tanpa melemahkan perilaku gagal-cepat runtime.

    - `openclaw doctor --fix` menggunakan model ringkasan SecretRef baca-saja yang sama seperti perintah keluarga status untuk perbaikan konfigurasi yang ditargetkan.
    - Contoh: upaya perbaikan Telegram `allowFrom` / `groupAllowFrom` `@username` mencoba menggunakan kredensial bot yang dikonfigurasi jika tersedia.
    - Jika token bot Telegram dikonfigurasi melalui SecretRef tetapi tidak tersedia pada jalur perintah saat ini, doctor melaporkan bahwa kredensial telah dikonfigurasi tetapi tidak tersedia dan melewati resolusi otomatis alih-alih mengalami crash atau keliru melaporkan bahwa token tidak ada.

  </Accordion>
  <Accordion title="13. Pemeriksaan kesehatan Gateway + mulai ulang">
    Doctor menjalankan pemeriksaan kesehatan dan menawarkan untuk memulai ulang Gateway ketika kondisinya tampak tidak sehat.
  </Accordion>
  <Accordion title="13b. Kesiapan pencarian memori">
    Doctor memeriksa apakah penyedia embedding pencarian memori yang dikonfigurasi siap untuk agen default. Perilakunya bergantung pada backend dan penyedia yang dikonfigurasi:

    - **Backend QMD**: memeriksa apakah biner `qmd` tersedia dan dapat dimulai. Jika tidak, mencetak panduan perbaikan termasuk `npm install -g @tobilu/qmd` (atau padanannya untuk Bun) dan opsi jalur biner manual.
    - **Penyedia lokal eksplisit**: memeriksa keberadaan file model lokal atau URL model jarak jauh/yang dapat diunduh dan dikenali. Jika tidak ada, menyarankan untuk beralih ke penyedia jarak jauh.
    - **Penyedia jarak jauh eksplisit** (`openai`, `voyage`, dll.): memverifikasi bahwa kunci API tersedia di lingkungan atau penyimpanan autentikasi. Mencetak petunjuk perbaikan yang dapat ditindaklanjuti jika tidak ada.
    - **Penyedia otomatis lama**: memperlakukan `memorySearch.provider: "auto"` sebagai OpenAI, memeriksa kesiapan OpenAI, dan `doctor --fix` menulis ulangnya menjadi `provider: "openai"`.

    Ketika hasil pemeriksaan Gateway yang di-cache tersedia (Gateway dalam kondisi sehat saat pemeriksaan dilakukan), doctor membandingkan hasilnya dengan konfigurasi yang terlihat oleh CLI dan mencatat setiap ketidaksesuaian. Doctor tidak memulai ping embedding baru pada jalur default; gunakan perintah status memori mendalam jika Anda menginginkan pemeriksaan penyedia secara langsung.

    Gunakan `openclaw memory status --deep` untuk memverifikasi kesiapan embedding saat runtime.

  </Accordion>
  <Accordion title="14. Peringatan status saluran">
    Jika Gateway sehat, doctor menjalankan pemeriksaan status saluran dan melaporkan peringatan beserta saran perbaikan.
  </Accordion>
  <Accordion title="15. Audit + perbaikan konfigurasi supervisor">
    Doctor memeriksa konfigurasi supervisor yang terpasang (launchd/systemd/schtasks) untuk menemukan default yang hilang atau usang (misalnya dependensi network-online systemd dan penundaan mulai ulang). Ketika menemukan ketidaksesuaian, doctor merekomendasikan pembaruan dan dapat menulis ulang file layanan/tugas sesuai default saat ini.

    Catatan:

    - `openclaw doctor` meminta konfirmasi sebelum menulis ulang konfigurasi supervisor.
    - `openclaw doctor --yes` menerima prompt perbaikan default.
    - `openclaw doctor --fix` menerapkan perbaikan yang direkomendasikan tanpa prompt (`--repair` adalah alias).
    - `openclaw doctor --fix --force` menimpa konfigurasi supervisor khusus.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external` mempertahankan doctor dalam mode baca-saja untuk siklus hidup layanan Gateway. Doctor tetap melaporkan kesehatan layanan dan menjalankan perbaikan nonlayanan, tetapi melewati pemasangan/mulai/mulai ulang/bootstrap layanan, penulisan ulang konfigurasi supervisor, dan pembersihan layanan lama karena supervisor eksternal memiliki siklus hidup tersebut.
    - Di Linux, doctor tidak menulis ulang metadata perintah/titik masuk ketika unit Gateway systemd yang cocok sedang aktif. Doctor juga mengabaikan unit tambahan mirip Gateway nonlama yang tidak aktif selama pemindaian layanan duplikat agar file layanan pendamping tidak menimbulkan derau pembersihan.
    - Jika autentikasi token memerlukan token dan `gateway.auth.token` dikelola oleh SecretRef, pemasangan/perbaikan layanan doctor memvalidasi SecretRef tetapi tidak menyimpan nilai token teks biasa yang telah diresolusi ke dalam metadata lingkungan layanan supervisor.
    - Doctor mendeteksi nilai lingkungan layanan terkelola `.env`/berbasis SecretRef yang disematkan langsung oleh pemasangan LaunchAgent, systemd, atau Windows Scheduled Task lama, lalu menulis ulang metadata layanan agar nilai tersebut dimuat dari sumber runtime, bukan dari definisi supervisor.
    - Doctor mendeteksi ketika perintah layanan masih menetapkan `--port` lama setelah `gateway.port` berubah dan menulis ulang metadata layanan ke port saat ini.
    - Jika autentikasi token memerlukan token dan SecretRef token yang dikonfigurasi belum diresolusi, doctor memblokir jalur pemasangan/perbaikan dengan panduan yang dapat ditindaklanjuti.
    - Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi serta `gateway.auth.mode` belum ditetapkan, doctor memblokir pemasangan/perbaikan hingga mode ditetapkan secara eksplisit.
    - Untuk unit systemd pengguna Linux, pemeriksaan penyimpangan token oleh doctor menyertakan sumber `Environment=` dan `EnvironmentFile=` saat membandingkan metadata autentikasi layanan.
    - Perbaikan layanan doctor menolak menulis ulang, menghentikan, atau memulai ulang layanan Gateway dari biner OpenClaw lama ketika konfigurasi terakhir kali ditulis oleh versi yang lebih baru. Lihat [pemecahan masalah Gateway](/id/gateway/troubleshooting#split-brain-installs-and-newer-config-guard).
    - Anda selalu dapat memaksakan penulisan ulang penuh melalui `openclaw gateway install --force`.

  </Accordion>
  <Accordion title="16. Diagnostik runtime + port Gateway">
    Doctor memeriksa runtime layanan (PID, status keluar terakhir) dan memperingatkan ketika layanan terpasang tetapi sebenarnya tidak berjalan. Doctor juga memeriksa benturan port pada port Gateway (default `18789`) dan melaporkan kemungkinan penyebabnya (Gateway sudah berjalan, tunnel SSH).
  </Accordion>
  <Accordion title="17. Praktik terbaik runtime Gateway">
    Doctor memperingatkan ketika layanan Gateway berjalan pada Bun atau jalur Node yang dikelola versi (`nvm`, `fnm`, `volta`, `asdf`, dll.). Bun tidak dapat membuka penyimpanan status `node:sqlite` milik OpenClaw, sehingga perbaikan memigrasikan layanan Bun lama ke Node. Jalur pengelola versi dapat rusak setelah peningkatan karena layanan tidak memuat inisialisasi shell Anda. Doctor menawarkan migrasi ke instalasi Node sistem jika tersedia (Homebrew/apt/choco).

    LaunchAgent macOS yang baru dipasang atau diperbaiki menggunakan PATH sistem kanonis (`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`), bukan menyalin PATH shell interaktif, sehingga biner sistem yang dikelola Homebrew tetap tersedia sementara direktori Volta, asdf, fnm, pnpm, dan pengelola versi lainnya tidak mengubah Node yang diresolusi oleh proses anak. Layanan Linux tetap mempertahankan root lingkungan eksplisit (`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`) dan direktori biner pengguna yang stabil, tetapi direktori fallback pengelola versi yang diperkirakan hanya ditulis ke PATH layanan jika direktori tersebut ada di disk.

  </Accordion>
  <Accordion title="18. Penulisan konfigurasi + metadata wizard">
    Doctor menyimpan setiap perubahan konfigurasi dan membubuhkan metadata wizard untuk mencatat eksekusi doctor.
  </Accordion>
  <Accordion title="19. Kiat ruang kerja (pencadangan + sistem memori)">
    Doctor menyarankan sistem memori ruang kerja jika belum ada dan mencetak kiat pencadangan jika ruang kerja belum dikelola dengan git.

    Lihat [/concepts/agent-workspace](/id/concepts/agent-workspace) untuk panduan lengkap mengenai struktur ruang kerja dan pencadangan git (GitHub atau GitLab privat direkomendasikan).

  </Accordion>
</AccordionGroup>

## Terkait

- [Panduan operasional Gateway](/id/gateway)
- [Pemecahan masalah Gateway](/id/gateway/troubleshooting)
