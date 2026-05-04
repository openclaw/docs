---
read_when:
    - Memahami bagaimana susunan QA saling terintegrasi
    - Memperluas qa-lab, qa-channel, atau adapter transport
    - Menambahkan skenario QA yang didukung repo
    - Membangun otomatisasi QA dengan realisme lebih tinggi untuk dasbor Gateway
summary: 'Ikhtisar stack QA: qa-lab, qa-channel, skenario berbasis repo, lane transport live, adaptor transport, dan pelaporan.'
title: Ikhtisar QA
x-i18n:
    generated_at: "2026-05-04T07:04:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 067f5aa0831724659ae36d548ef2e7bd28b40aad9cef45f325a01a2748003b29
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Stack QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis dan berbentuk channel daripada yang bisa dilakukan oleh satu pengujian unit.

Bagian saat ini:

- `extensions/qa-channel`: channel pesan sintetis dengan permukaan DM, channel, thread, reaksi, edit, dan hapus.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip, menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `extensions/qa-matrix`, Plugin runner mendatang: adaptor transport langsung yang menggerakkan channel nyata di dalam Gateway QA anak.
- `qa/`: aset seed berbasis repo untuk tugas kickoff dan skenario QA baseline.
- [Mantis](/id/concepts/mantis): verifikasi langsung sebelum dan sesudah untuk bug yang membutuhkan transport nyata, tangkapan layar browser, status VM, dan bukti PR.

## Permukaan perintah

Setiap alur QA berjalan di bawah `pnpm openclaw qa <subcommand>`. Banyak yang memiliki alias skrip `pnpm qa:*`; kedua bentuk didukung.

| Perintah                                            | Tujuan                                                                                                                                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `qa run`                                            | Pemeriksaan mandiri QA bawaan; menulis laporan Markdown.                                                                                                                                               |
| `qa suite`                                          | Jalankan skenario berbasis repo terhadap lane Gateway QA. Alias: `pnpm openclaw qa suite --runner multipass` untuk VM Linux sekali pakai.                                                              |
| `qa coverage`                                       | Cetak inventaris cakupan skenario markdown (`--json` untuk output mesin).                                                                                                                              |
| `qa parity-report`                                  | Bandingkan dua berkas `qa-suite-summary.json` dan tulis laporan paritas agentik.                                                                                                                       |
| `qa character-eval`                                 | Jalankan skenario QA karakter di beberapa model langsung dengan laporan yang dinilai. Lihat [Pelaporan](#reporting).                                                                                   |
| `qa manual`                                         | Jalankan prompt sekali pakai terhadap lane penyedia/model yang dipilih.                                                                                                                                 |
| `qa ui`                                             | Mulai UI debugger QA dan bus QA lokal (alias: `pnpm qa:lab:ui`).                                                                                                                                        |
| `qa docker-build-image`                             | Bangun image Docker QA prapaket.                                                                                                                                                                       |
| `qa docker-scaffold`                                | Tulis scaffold docker-compose untuk dasbor QA + lane Gateway.                                                                                                                                          |
| `qa up`                                             | Bangun situs QA, mulai stack yang didukung Docker, cetak URL (alias: `pnpm qa:lab:up`; varian `:fast` menambahkan `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                              |
| `qa aimock`                                         | Mulai hanya server penyedia AIMock.                                                                                                                                                                    |
| `qa mock-openai`                                    | Mulai hanya server penyedia `mock-openai` yang sadar skenario.                                                                                                                                         |
| `qa credentials doctor` / `add` / `list` / `remove` | Kelola pool kredensial Convex bersama.                                                                                                                                                                 |
| `qa matrix`                                         | Lane transport langsung terhadap homeserver Tuwunel sekali pakai. Lihat [QA Matrix](/id/concepts/qa-matrix).                                                                                              |
| `qa telegram`                                       | Lane transport langsung terhadap grup Telegram privat nyata.                                                                                                                                           |
| `qa discord`                                        | Lane transport langsung terhadap channel guild Discord privat nyata.                                                                                                                                    |
| `qa slack`                                          | Lane transport langsung terhadap channel Slack privat nyata.                                                                                                                                            |
| `qa mantis`                                         | Runner verifikasi sebelum dan sesudah untuk bug transport langsung, dengan bukti reaksi status Discord, smoke desktop/browser Crabbox, dan smoke Slack-di-VNC. Lihat [Mantis](/id/concepts/mantis).       |

## Alur operator

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dasbor Gateway (Control UI) dengan agent.
- Kanan: QA Lab, menampilkan transkrip bergaya Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Itu membangun situs QA, memulai lane Gateway yang didukung Docker, dan mengekspos halaman QA Lab tempat operator atau loop otomasi dapat memberi agent misi QA, mengamati perilaku channel nyata, serta mencatat apa yang berhasil, gagal, atau tetap terblokir.

Untuk iterasi UI QA Lab yang lebih cepat tanpa membangun ulang image Docker setiap kali, mulai stack dengan bundle QA Lab yang di-bind-mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mempertahankan layanan Docker pada image prabangun dan melakukan bind-mount `extensions/qa-lab/web/dist` ke dalam container `qa-lab`. `qa:lab:watch` membangun ulang bundle tersebut saat berubah, dan browser memuat ulang otomatis ketika hash aset QA Lab berubah.

Untuk smoke trace OpenTelemetry lokal, jalankan:

```bash
pnpm qa:otel:smoke
```

Skrip tersebut memulai receiver trace OTLP/HTTP lokal, menjalankan skenario QA `otel-trace-smoke` dengan Plugin `diagnostics-otel` diaktifkan, lalu mendekode span protobuf yang diekspor dan menegaskan bentuk yang kritis untuk rilis: `openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`, `openclaw.context.assembled`, dan `openclaw.message.delivery` harus ada; panggilan model tidak boleh mengekspor `StreamAbandoned` pada turn yang berhasil; ID diagnostik mentah dan atribut `openclaw.content.*` harus tetap berada di luar trace. Ini menulis `otel-smoke-summary.json` di sebelah artefak suite QA.

QA observabilitas tetap hanya untuk checkout sumber. Tarball npm sengaja menghilangkan QA Lab, sehingga lane rilis Docker paket tidak menjalankan perintah `qa`. Gunakan `pnpm qa:otel:smoke` dari checkout sumber yang sudah dibangun saat mengubah instrumentasi diagnostik.

Untuk lane smoke Matrix dengan transport nyata, jalankan:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Referensi CLI lengkap, katalog profil/skenario, variabel env, dan tata letak artefak untuk lane ini ada di [QA Matrix](/id/concepts/qa-matrix). Sekilas: ini menyediakan homeserver Tuwunel sekali pakai di Docker, mendaftarkan pengguna driver/SUT/observer sementara, menjalankan Plugin Matrix nyata di dalam Gateway QA anak yang dicakup untuk transport tersebut (tanpa `qa-channel`), lalu menulis laporan Markdown, ringkasan JSON, artefak observed-events, dan log output gabungan di bawah `.artifacts/qa-e2e/matrix-<timestamp>/`.

Untuk lane smoke Telegram, Discord, dan Slack dengan transport nyata:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
```

Mereka menargetkan channel nyata yang sudah ada dengan dua bot (driver + SUT). Variabel env yang diperlukan, daftar skenario, artefak output, dan pool kredensial Convex didokumentasikan dalam [Referensi QA Telegram, Discord, dan Slack](#telegram-discord-and-slack-qa-reference) di bawah.

Untuk run VM desktop Slack penuh dengan penyelamatan VNC, jalankan:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Perintah itu menyewa mesin desktop/browser Crabbox, menjalankan lane langsung Slack di dalam VM, membuka Slack Web di browser VNC, menangkap desktop, dan menyalin `slack-qa/` plus `slack-desktop-smoke.png` kembali ke direktori artefak Mantis. Gunakan ulang `--lease-id <cbx_...>` setelah masuk ke Slack Web secara manual melalui VNC. Dengan `--gateway-setup`, Mantis meninggalkan Gateway Slack OpenClaw persisten yang berjalan di dalam VM pada port `38973`; tanpa itu, perintah menjalankan lane QA Slack bot-ke-bot normal dan keluar setelah penangkapan artefak.

Sebelum menggunakan kredensial langsung yang dipool, jalankan:

```bash
pnpm openclaw qa credentials doctor
```

Doctor memeriksa env broker Convex, memvalidasi pengaturan endpoint, dan memverifikasi keterjangkauan admin/list saat rahasia maintainer tersedia. Ini hanya melaporkan status ditetapkan/hilang untuk rahasia.

## Cakupan transport langsung

Lane transport langsung berbagi satu kontrak alih-alih masing-masing menciptakan bentuk daftar skenario sendiri. `qa-channel` adalah suite perilaku produk sintetis yang luas dan bukan bagian dari matriks cakupan transport langsung.

| Lane     | Canary | Gating mention | Bot-ke-bot | Blokir allowlist | Balasan tingkat atas | Lanjutkan setelah restart | Tindak lanjut thread | Isolasi thread | Pengamatan reaksi | Perintah bantuan | Registrasi perintah native |
| -------- | ------ | -------------- | ---------- | ---------------- | -------------------- | ------------------------- | --------------------- | -------------- | ----------------- | ---------------- | -------------------------- |
| Matrix   | x      | x              | x          | x                | x                    | x                         | x                     | x              | x                 |                  |                            |
| Telegram | x      | x              | x          |                  |                      |                           |                       |                |                   | x                |                            |
| Discord  | x      | x              | x          |                  |                      |                           |                       |                |                   |                  | x                          |
| Slack    | x      | x              | x          |                  |                      |                           |                       |                |                   |                  |                            |

Ini mempertahankan `qa-channel` sebagai suite perilaku produk yang luas, sementara Matrix, Telegram, dan transport langsung mendatang berbagi satu checklist kontrak transport yang eksplisit.

Untuk lane VM Linux sekali pakai tanpa membawa Docker ke jalur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Ini mem-boot guest Multipass baru, menginstal dependensi, membangun OpenClaw
di dalam guest, menjalankan `qa suite`, lalu menyalin laporan QA normal dan
ringkasan kembali ke `.artifacts/qa-e2e/...` pada host.
Ini menggunakan kembali perilaku pemilihan skenario yang sama seperti `qa suite` pada host.
Eksekusi suite host dan Multipass menjalankan beberapa skenario terpilih secara paralel
dengan worker Gateway yang terisolasi secara default. `qa-channel` secara default menggunakan konkurensi
4, dibatasi oleh jumlah skenario yang dipilih. Gunakan `--concurrency <count>` untuk menyesuaikan
jumlah worker, atau `--concurrency 1` untuk eksekusi serial.
Perintah keluar dengan kode non-nol ketika ada skenario yang gagal. Gunakan `--allow-failures` ketika
Anda menginginkan artefak tanpa kode keluar gagal.
Eksekusi live meneruskan input auth QA yang didukung dan praktis untuk
guest: kunci provider berbasis env, path konfigurasi provider live QA, dan
`CODEX_HOME` ketika ada. Simpan `--output-dir` di bawah root repo agar guest
dapat menulis kembali melalui workspace yang di-mount.

## Referensi QA Telegram, Discord, dan Slack

Matrix memiliki [halaman khusus](/id/concepts/qa-matrix) karena jumlah skenarionya dan penyediaan homeserver berbasis Docker. Telegram, Discord, dan Slack lebih kecil — masing-masing hanya beberapa skenario, tanpa sistem profil, terhadap channel nyata yang sudah ada — sehingga referensinya ada di sini.

### Flag CLI bersama

Lane ini didaftarkan melalui `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` dan menerima flag yang sama:

| Flag                                  | Default                                                         | Deskripsi                                                                                                             |
| ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                               | Jalankan hanya skenario ini. Dapat diulang.                                                                           |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord,slack}-<timestamp>` | Tempat laporan/ringkasan/pesan teramati dan log output ditulis. Path relatif di-resolve terhadap `--repo-root`.       |
| `--repo-root <path>`                  | `process.cwd()`                                                 | Root repositori ketika dipanggil dari cwd netral.                                                                     |
| `--sut-account <id>`                  | `sut`                                                           | Id akun sementara di dalam konfigurasi Gateway QA.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                                 | `mock-openai` atau `live-frontier` (`live-openai` lama masih berfungsi).                                              |
| `--model <ref>` / `--alt-model <ref>` | default provider                                                | Ref model utama/alternatif.                                                                                           |
| `--fast`                              | mati                                                            | Mode cepat provider jika didukung.                                                                                    |
| `--credential-source <env\|convex>`   | `env`                                                           | Lihat [pool kredensial Convex](#convex-credential-pool).                                                              |
| `--credential-role <maintainer\|ci>`  | `ci` di CI, selain itu `maintainer`                             | Peran yang digunakan ketika `--credential-source convex`.                                                             |

Setiap lane keluar dengan kode non-nol pada skenario yang gagal. `--allow-failures` menulis artefak tanpa menetapkan kode keluar gagal.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Menargetkan satu grup Telegram privat nyata dengan dua bot berbeda (driver + SUT). Bot SUT harus memiliki nama pengguna Telegram; observasi bot-ke-bot bekerja paling baik ketika kedua bot mengaktifkan **Bot-to-Bot Communication Mode** di `@BotFather`.

Env wajib ketika `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — id chat numerik (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opsional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` mempertahankan isi pesan dalam artefak pesan teramati (default menyunting).

Skenario (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

Artefak output:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — menyertakan RTT per-balasan (driver mengirim → balasan SUT teramati) dimulai dari canary.
- `telegram-qa-observed-messages.json` — isi disunting kecuali `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Menargetkan satu channel guild Discord privat nyata dengan dua bot: bot driver yang dikendalikan oleh harness dan bot SUT yang dimulai oleh Gateway OpenClaw anak melalui Plugin Discord bawaan. Memverifikasi penanganan mention channel, bahwa bot SUT telah mendaftarkan perintah native `/help` dengan Discord, dan skenario bukti Mantis opt-in.

Env wajib ketika `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — harus cocok dengan id pengguna bot SUT yang dikembalikan oleh Discord (lane gagal cepat jika tidak).

Opsional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mempertahankan isi pesan dalam artefak pesan teramati.

Skenario (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-status-reactions-tool-only` — skenario Mantis opt-in. Berjalan sendiri karena mengalihkan SUT ke balasan guild selalu aktif, hanya tool, dengan `messages.statusReactions.enabled=true`, lalu menangkap timeline reaksi REST plus artefak visual HTML/PNG.

Jalankan skenario reaksi status Mantis secara eksplisit:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Artefak output:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — isi disunting kecuali `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` dan `discord-status-reactions-tool-only-timeline.png` ketika skenario reaksi status berjalan.

### QA Slack

```bash
pnpm openclaw qa slack
```

Menargetkan satu channel Slack privat nyata dengan dua bot berbeda: bot driver yang dikendalikan oleh harness dan bot SUT yang dimulai oleh Gateway OpenClaw anak melalui Plugin Slack bawaan.

Env wajib ketika `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opsional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` mempertahankan isi pesan dalam artefak pesan teramati.

Skenario (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts:39`):

- `slack-canary`
- `slack-mention-gating`

Artefak output:

- `slack-qa-report.md`
- `slack-qa-summary.json`
- `slack-qa-observed-messages.json` — isi disunting kecuali `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.

### Pool kredensial Convex

Lane Telegram, Discord, dan Slack dapat menyewa kredensial dari pool Convex bersama alih-alih membaca env var di atas. Berikan `--credential-source convex` (atau tetapkan `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab memperoleh lease eksklusif, mengirim Heartbeat selama durasi eksekusi, dan melepaskannya saat shutdown. Jenis pool adalah `"telegram"`, `"discord"`, dan `"slack"`.

Bentuk payload yang divalidasi broker pada `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` harus berupa string chat-id numerik.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Env var operasional dan kontrak endpoint broker Convex ada di [Pengujian → Kredensial Telegram bersama melalui Convex](/id/help/testing#shared-telegram-credentials-via-convex-v1) (nama bagian mendahului dukungan Discord; semantik broker identik untuk kedua jenis).

## Seed berbasis repo

Aset seed berada di `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Ini sengaja ada di git sehingga rencana QA terlihat oleh manusia maupun
agent.

`qa-lab` harus tetap menjadi runner markdown generik. Setiap file markdown skenario adalah
sumber kebenaran untuk satu eksekusi pengujian dan harus mendefinisikan:

- metadata skenario
- metadata kategori, kapabilitas, lane, dan risiko opsional
- ref docs dan kode
- persyaratan Plugin opsional
- patch konfigurasi Gateway opsional
- `qa-flow` yang dapat dieksekusi

Permukaan runtime yang dapat digunakan ulang yang mendukung `qa-flow` boleh tetap generik
dan lintas area. Misalnya, skenario markdown dapat menggabungkan helper sisi transport
dengan helper sisi browser yang mengendalikan Control UI tertanam melalui
seam Gateway `browser.request` tanpa menambahkan runner kasus khusus.

File skenario harus dikelompokkan berdasarkan kapabilitas produk, bukan folder
source tree. Pertahankan ID skenario tetap stabil ketika file dipindahkan; gunakan `docsRefs` dan `codeRefs`
untuk ketertelusuran implementasi.

Daftar baseline harus tetap cukup luas untuk mencakup:

- DM dan chat channel
- perilaku thread
- siklus hidup tindakan pesan
- callback Cron
- recall memory
- pengalihan model
- handoff subagent
- pembacaan repo dan pembacaan docs
- satu tugas build kecil seperti Lobster Invaders

## Lane mock provider

`qa suite` memiliki dua lane mock provider lokal:

- `mock-openai` adalah mock OpenClaw yang sadar skenario. Ini tetap menjadi lane mock
  deterministik default untuk QA berbasis repo dan gate paritas.
- `aimock` memulai server provider berbasis AIMock untuk cakupan protokol eksperimental,
  fixture, record/replay, dan chaos. Ini bersifat aditif dan tidak
  menggantikan dispatcher skenario `mock-openai`.

Implementasi lane provider berada di bawah `extensions/qa-lab/src/providers/`.
Setiap provider memiliki defaultnya sendiri, startup server lokal, konfigurasi model Gateway,
kebutuhan staging auth-profile, dan flag kapabilitas live/mock. Kode suite bersama dan
Gateway harus merutekan melalui registri provider alih-alih bercabang berdasarkan
nama provider.

## Adapter transport

`qa-lab` memiliki seam transport generik untuk skenario QA markdown. `qa-channel` adalah adapter pertama pada seam itu, tetapi target desainnya lebih luas: channel nyata atau sintetis di masa depan harus tersambung ke runner suite yang sama alih-alih menambahkan runner QA khusus transport.

Pada level arsitektur, pembagiannya adalah:

- `qa-lab` memiliki eksekusi skenario generik, konkurensi worker, penulisan artefak, dan pelaporan.
- Adapter transport memiliki konfigurasi Gateway, kesiapan, observasi masuk dan keluar, tindakan transport, dan status transport yang dinormalisasi.
- File skenario markdown di bawah `qa/scenarios/` mendefinisikan eksekusi pengujian; `qa-lab` menyediakan permukaan runtime yang dapat digunakan ulang untuk mengeksekusinya.

### Menambahkan channel

Menambahkan channel ke sistem QA markdown memerlukan tepat dua hal:

1. Adapter transport untuk channel tersebut.
2. Paket skenario yang menguji kontrak channel.

Jangan tambahkan root perintah QA top-level baru ketika host `qa-lab` bersama dapat memiliki flow.

`qa-lab` memiliki mekanisme host bersama:

- root perintah `openclaw qa`
- startup dan teardown suite
- konkurensi worker
- penulisan artefak
- pembuatan laporan
- eksekusi skenario
- alias kompatibilitas untuk skenario `qa-channel` lama

Plugin runner memiliki kontrak transport:

- cara `openclaw qa <runner>` dipasang di bawah root `qa` bersama
- cara gateway dikonfigurasi untuk transport tersebut
- cara kesiapan diperiksa
- cara event masuk diinjeksi
- cara pesan keluar diamati
- cara transkrip dan status transport yang dinormalisasi diekspos
- cara tindakan berbasis transport dieksekusi
- cara reset atau pembersihan khusus transport ditangani

Batas minimum adopsi untuk channel baru:

1. Pertahankan `qa-lab` sebagai pemilik root `qa` bersama.
2. Implementasikan runner transport pada seam host `qa-lab` bersama.
3. Pertahankan mekanisme khusus transport di dalam Plugin runner atau harness channel.
4. Pasang runner sebagai `openclaw qa <runner>`, bukan mendaftarkan perintah root tandingan. Plugin runner harus mendeklarasikan `qaRunners` di `openclaw.plugin.json` dan mengekspor array `qaRunnerCliRegistrations` yang cocok dari `runtime-api.ts`. Jaga agar `runtime-api.ts` tetap ringan; CLI lazy dan eksekusi runner harus tetap berada di balik entrypoint terpisah.
5. Tulis atau adaptasi skenario markdown di bawah direktori bertema `qa/scenarios/`.
6. Gunakan helper skenario generik untuk skenario baru.
7. Pertahankan alias kompatibilitas yang ada tetap berfungsi kecuali repo sedang melakukan migrasi yang disengaja.

Aturan keputusannya ketat:

- Jika perilaku dapat diekspresikan sekali di `qa-lab`, letakkan di `qa-lab`.
- Jika perilaku bergantung pada satu transport channel, pertahankan di Plugin runner atau harness Plugin tersebut.
- Jika sebuah skenario membutuhkan kemampuan baru yang dapat digunakan lebih dari satu channel, tambahkan helper generik alih-alih cabang khusus channel di `suite.ts`.
- Jika suatu perilaku hanya bermakna untuk satu transport, pertahankan skenario tersebut khusus transport dan buat hal itu eksplisit dalam kontrak skenario.

### Nama helper skenario

Helper generik yang disarankan untuk skenario baru:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Alias kompatibilitas tetap tersedia untuk skenario yang ada — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — tetapi penulisan skenario baru harus menggunakan nama generik. Alias ada untuk menghindari migrasi serentak, bukan sebagai model ke depannya.

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari timeline bus yang diamati.
Laporan harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

Untuk inventaris skenario yang tersedia — berguna saat memperkirakan pekerjaan tindak lanjut atau menyambungkan transport baru — jalankan `pnpm openclaw qa coverage` (tambahkan `--json` untuk output yang dapat dibaca mesin).

Untuk pemeriksaan karakter dan gaya, jalankan skenario yang sama di beberapa ref model live
dan tulis laporan Markdown yang dinilai:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Perintah tersebut menjalankan proses anak Gateway QA lokal, bukan Docker. Skenario evaluasi karakter
harus menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa
seperti chat, bantuan workspace, dan tugas file kecil. Model kandidat tidak boleh
diberi tahu bahwa ia sedang dievaluasi. Perintah ini mempertahankan setiap
transkrip lengkap, mencatat statistik run dasar, lalu meminta model juri dalam mode cepat dengan
penalaran `xhigh` jika didukung untuk memberi peringkat run berdasarkan kewajaran, nuansa, dan humor.
Gunakan `--blind-judge-models` saat membandingkan provider: prompt juri tetap mendapatkan
setiap transkrip dan status run, tetapi ref kandidat diganti dengan label netral
seperti `candidate-01`; laporan memetakan peringkat kembali ke ref sebenarnya setelah
parsing.
Run kandidat secara default menggunakan thinking `high`, dengan `medium` untuk GPT-5.5 dan `xhigh`
untuk ref evaluasi OpenAI lama yang mendukungnya. Timpa kandidat tertentu secara inline dengan
`--model provider/model,thinking=<level>`. `--thinking <level>` masih menetapkan
fallback global, dan bentuk lama `--model-thinking <provider/model=level>` tetap
dipertahankan untuk kompatibilitas.
Ref kandidat OpenAI secara default menggunakan mode cepat agar pemrosesan prioritas digunakan jika
provider mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline ketika
satu kandidat atau juri membutuhkan override. Berikan `--fast` hanya ketika Anda ingin
memaksa mode cepat aktif untuk setiap model kandidat. Durasi kandidat dan juri
dicatat dalam laporan untuk analisis benchmark, tetapi prompt juri secara eksplisit mengatakan
untuk tidak memberi peringkat berdasarkan kecepatan.
Run model kandidat dan juri keduanya secara default menggunakan konkurensi 16. Turunkan
`--concurrency` atau `--judge-concurrency` ketika batas provider atau tekanan Gateway lokal
membuat run terlalu berisik.
Jika tidak ada kandidat `--model` yang diberikan, evaluasi karakter secara default menggunakan
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` ketika tidak ada `--model` yang diberikan.
Jika tidak ada `--judge-model` yang diberikan, juri secara default menggunakan
`openai/gpt-5.5,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-6,thinking=high`.

## Dokumen terkait

- [QA Matriks](/id/concepts/qa-matrix)
- [Channel QA](/id/channels/qa-channel)
- [Pengujian](/id/help/testing)
- [Dasbor](/id/web/dashboard)
