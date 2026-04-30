---
read_when:
    - Memahami bagaimana rangkaian QA saling terintegrasi
    - Memperluas qa-lab, qa-channel, atau adaptor transport
    - Menambahkan skenario QA yang didukung repositori
    - Membangun otomatisasi QA yang lebih realistis di sekitar dasbor Gateway
summary: 'Ikhtisar rangkaian QA: qa-lab, qa-channel, skenario berbasis repo, jalur transportasi langsung, adaptor transportasi, dan pelaporan.'
title: Ikhtisar QA
x-i18n:
    generated_at: "2026-04-30T09:44:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: b62a5081fc2b67333f2ec6f3469e97043f048d5912858b9d8cc565c2e5fc8de2
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Stack QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis
dan menyerupai channel daripada satu unit test saja.

Bagian saat ini:

- `extensions/qa-channel`: channel pesan sintetis dengan permukaan DM, channel, thread,
  reaction, edit, dan delete.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip,
  menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `extensions/qa-matrix`, plugin runner mendatang: adaptor transport langsung yang
  menjalankan channel nyata di dalam Gateway QA anak.
- `qa/`: aset seed berbasis repo untuk tugas kickoff dan skenario QA
  baseline.

## Permukaan perintah

Setiap alur QA berjalan di bawah `pnpm openclaw qa <subcommand>`. Banyak yang memiliki alias skrip `pnpm qa:*`;
kedua bentuk didukung.

| Perintah                                            | Tujuan                                                                                                                                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Pemeriksaan mandiri QA bawaan; menulis laporan Markdown.                                                                                                               |
| `qa suite`                                          | Menjalankan skenario berbasis repo terhadap lane Gateway QA. Alias: `pnpm openclaw qa suite --runner multipass` untuk VM Linux sekali pakai.                           |
| `qa coverage`                                       | Mencetak inventaris cakupan skenario markdown (`--json` untuk output mesin).                                                                                           |
| `qa parity-report`                                  | Membandingkan dua file `qa-suite-summary.json` dan menulis laporan parity-gate agentic.                                                                                |
| `qa character-eval`                                 | Menjalankan skenario QA karakter di beberapa model langsung dengan laporan yang dinilai. Lihat [Pelaporan](#reporting).                                                |
| `qa manual`                                         | Menjalankan prompt sekali pakai terhadap lane provider/model yang dipilih.                                                                                             |
| `qa ui`                                             | Memulai UI debugger QA dan bus QA lokal (alias: `pnpm qa:lab:ui`).                                                                                                     |
| `qa docker-build-image`                             | Membangun image Docker QA yang sudah dipanggang.                                                                                                                       |
| `qa docker-scaffold`                                | Menulis scaffold docker-compose untuk dashboard QA + lane Gateway.                                                                                                     |
| `qa up`                                             | Membangun situs QA, memulai stack berbasis Docker, mencetak URL (alias: `pnpm qa:lab:up`; varian `:fast` menambahkan `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Memulai hanya server provider AIMock.                                                                                                                                  |
| `qa mock-openai`                                    | Memulai hanya server provider `mock-openai` yang sadar skenario.                                                                                                       |
| `qa credentials doctor` / `add` / `list` / `remove` | Mengelola pool kredensial Convex bersama.                                                                                                                              |
| `qa matrix`                                         | Lane transport langsung terhadap homeserver Tuwunel sekali pakai. Lihat [QA Matrix](/id/concepts/qa-matrix).                                                             |
| `qa telegram`                                       | Lane transport langsung terhadap grup Telegram privat nyata.                                                                                                          |
| `qa discord`                                        | Lane transport langsung terhadap channel guild Discord privat nyata.                                                                                                   |

## Alur operator

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dashboard Gateway (Control UI) dengan agent.
- Kanan: QA Lab, menampilkan transkrip bergaya Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Itu membangun situs QA, memulai lane Gateway berbasis Docker, dan mengekspos halaman
QA Lab tempat operator atau loop otomasi dapat memberi agent misi QA,
mengamati perilaku channel nyata, dan mencatat apa yang berhasil, gagal, atau
tetap terblokir.

Untuk iterasi UI QA Lab yang lebih cepat tanpa membangun ulang image Docker setiap kali,
mulai stack dengan bundle QA Lab yang dipasang bind-mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` menjaga layanan Docker pada image yang sudah dibangun dan memasang bind-mount
`extensions/qa-lab/web/dist` ke dalam kontainer `qa-lab`. `qa:lab:watch`
membangun ulang bundle tersebut saat ada perubahan, dan browser memuat ulang otomatis ketika hash aset QA Lab
berubah.

Untuk smoke trace OpenTelemetry lokal, jalankan:

```bash
pnpm qa:otel:smoke
```

Skrip itu memulai penerima trace OTLP/HTTP lokal, menjalankan
skenario QA `otel-trace-smoke` dengan plugin `diagnostics-otel` diaktifkan, lalu
mendekode span protobuf yang diekspor dan menegaskan bentuk yang kritis untuk rilis:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled`, dan `openclaw.message.delivery` harus ada;
panggilan model tidak boleh mengekspor `StreamAbandoned` pada turn yang berhasil; ID diagnostik mentah dan
atribut `openclaw.content.*` harus tetap keluar dari trace. Ini menulis
`otel-smoke-summary.json` di sebelah artefak QA suite.

QA observabilitas tetap hanya dari checkout sumber. Tarball npm sengaja menghilangkan
QA Lab, sehingga lane rilis Docker paket tidak menjalankan perintah `qa`. Gunakan
`pnpm qa:otel:smoke` dari checkout sumber yang sudah dibangun saat mengubah instrumentasi
diagnostik.

Untuk lane smoke Matrix yang transport-nyata, jalankan:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Referensi CLI lengkap, katalog profil/skenario, env var, dan tata letak artefak untuk lane ini berada di [QA Matrix](/id/concepts/qa-matrix). Sekilas: ini menyediakan homeserver Tuwunel sekali pakai di Docker, mendaftarkan pengguna driver/SUT/observer sementara, menjalankan plugin Matrix nyata di dalam Gateway QA anak yang dicakupkan ke transport tersebut (tanpa `qa-channel`), lalu menulis laporan Markdown, ringkasan JSON, artefak observed-events, dan log output gabungan di bawah `.artifacts/qa-e2e/matrix-<timestamp>/`.

Untuk lane smoke Telegram dan Discord yang transport-nyata:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Keduanya menargetkan channel nyata yang sudah ada dengan dua bot (driver + SUT). Env var yang diperlukan, daftar skenario, artefak output, dan pool kredensial Convex didokumentasikan di [Referensi QA Telegram dan Discord](#telegram-and-discord-qa-reference) di bawah.

Sebelum menggunakan kredensial langsung dari pool, jalankan:

```bash
pnpm openclaw qa credentials doctor
```

Doctor memeriksa env broker Convex, memvalidasi pengaturan endpoint, dan memverifikasi keterjangkauan admin/list saat secret maintainer ada. Ini hanya melaporkan status set/missing untuk secret.

## Cakupan transport langsung

Lane transport langsung berbagi satu kontrak alih-alih masing-masing menciptakan bentuk daftar skenario sendiri. `qa-channel` adalah suite perilaku produk sintetis yang luas dan bukan bagian dari matriks cakupan transport langsung.

| Lane     | Canary | Gating mention | Bot-ke-bot | Blok allowlist | Balasan tingkat atas | Lanjut setelah restart | Tindak lanjut thread | Isolasi thread | Observasi reaction | Perintah help | Pendaftaran perintah native |
| -------- | ------ | -------------- | ---------- | --------------- | -------------------- | ---------------------- | -------------------- | -------------- | ------------------ | ------------- | --------------------------- |
| Matrix   | x      | x              | x          | x               | x                    | x                      | x                    | x              | x                  |               |                             |
| Telegram | x      | x              | x          |                 |                      |                        |                      |                |                    | x             |                             |
| Discord  | x      | x              | x          |                 |                      |                        |                      |                |                    |               | x                           |

Ini menjaga `qa-channel` sebagai suite perilaku produk yang luas sementara Matrix,
Telegram, dan transport langsung mendatang berbagi satu checklist kontrak transport
yang eksplisit.

Untuk lane VM Linux sekali pakai tanpa membawa Docker ke jalur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Ini mem-boot guest Multipass baru, menginstal dependensi, membangun OpenClaw
di dalam guest, menjalankan `qa suite`, lalu menyalin laporan dan
ringkasan QA normal kembali ke `.artifacts/qa-e2e/...` di host.
Ini menggunakan ulang perilaku pemilihan skenario yang sama seperti `qa suite` di host.
Run suite host dan Multipass menjalankan beberapa skenario yang dipilih secara paralel
dengan worker Gateway terisolasi secara default. `qa-channel` default ke concurrency
4, dibatasi oleh jumlah skenario yang dipilih. Gunakan `--concurrency <count>` untuk menyesuaikan
jumlah worker, atau `--concurrency 1` untuk eksekusi serial.
Perintah keluar non-zero ketika skenario mana pun gagal. Gunakan `--allow-failures` ketika
Anda menginginkan artefak tanpa kode keluar gagal.
Run langsung meneruskan input auth QA yang didukung dan praktis untuk
guest: kunci provider berbasis env, path config provider langsung QA, dan
`CODEX_HOME` saat ada. Pertahankan `--output-dir` di bawah root repo agar guest
dapat menulis kembali melalui workspace yang dipasang.

## Referensi QA Telegram dan Discord

Matrix memiliki [halaman khusus](/id/concepts/qa-matrix) karena jumlah skenarionya dan provisioning homeserver berbasis Docker. Telegram dan Discord lebih kecil — beberapa skenario masing-masing, tanpa sistem profil, terhadap channel nyata yang sudah ada — sehingga referensinya berada di sini.

### Flag CLI bersama

Kedua lane mendaftar melalui `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` dan menerima flag yang sama:

| Flag                                  | Default                                                   | Deskripsi                                                                                                            |
| ------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | Jalankan hanya skenario ini. Dapat diulang.                                                                         |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Tempat laporan/ringkasan/pesan yang diamati dan log output ditulis. Path relatif diacu terhadap `--repo-root`.      |
| `--repo-root <path>`                  | `process.cwd()`                                           | Root repositori saat dipanggil dari cwd netral.                                                                     |
| `--sut-account <id>`                  | `sut`                                                     | Id akun sementara di dalam config Gateway QA.                                                                       |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` atau `live-frontier` (`live-openai` lama masih berfungsi).                                            |
| `--model <ref>` / `--alt-model <ref>` | default provider                                          | Ref model utama/alternatif.                                                                                         |
| `--fast`                              | nonaktif                                                  | Mode cepat provider jika didukung.                                                                                  |
| `--credential-source <env\|convex>`   | `env`                                                     | Lihat [pool kredensial Convex](#convex-credential-pool).                                                            |
| `--credential-role <maintainer\|ci>`  | `ci` di CI, jika tidak `maintainer`                       | Peran yang digunakan saat `--credential-source convex`.                                                             |

Keduanya keluar dengan non-zero pada skenario yang gagal. `--allow-failures` menulis artefak tanpa menetapkan kode keluar gagal.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Menargetkan satu grup Telegram privat nyata dengan dua bot berbeda (driver + SUT). Bot SUT harus memiliki nama pengguna Telegram; observasi bot-ke-bot bekerja paling baik saat kedua bot mengaktifkan **Bot-to-Bot Communication Mode** di `@BotFather`.

Env wajib saat `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — id chat numerik (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opsional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` mempertahankan isi pesan di artefak pesan-teramati (default meredaksi).

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
- `telegram-qa-summary.json` — mencakup RTT per balasan (driver mengirim → balasan SUT teramati) dimulai dengan canary.
- `telegram-qa-observed-messages.json` — isi diredaksi kecuali `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Menargetkan satu kanal guild Discord privat nyata dengan dua bot: bot driver yang dikendalikan oleh harness dan bot SUT yang dimulai oleh Gateway OpenClaw turunan melalui Plugin Discord bawaan. Memverifikasi penanganan mention kanal dan bahwa bot SUT telah mendaftarkan perintah native `/help` dengan Discord.

Env wajib saat `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` — harus cocok dengan id pengguna bot SUT yang dikembalikan oleh Discord (jika tidak, lane gagal cepat).

Opsional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mempertahankan isi pesan di artefak pesan-teramati.

Skenario (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

Artefak output:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — isi diredaksi kecuali `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.

### Pool kredensial Convex

Lane Telegram dan Discord sama-sama dapat menyewa kredensial dari pool Convex bersama alih-alih membaca env var di atas. Berikan `--credential-source convex` (atau tetapkan `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab memperoleh lease eksklusif, mengirim heartbeat selama durasi run, dan melepasnya saat shutdown. Jenis pool adalah `"telegram"` dan `"discord"`.

Bentuk payload yang divalidasi broker pada `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` harus berupa string chat-id numerik.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Env var operasional dan kontrak endpoint broker Convex ada di [Pengujian → Kredensial Telegram bersama melalui Convex](/id/help/testing#shared-telegram-credentials-via-convex-v1) (nama bagian mendahului dukungan Discord; semantik broker identik untuk kedua jenis).

## Seed berbasis repositori

Aset seed berada di `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Ini sengaja ada di git agar rencana QA terlihat oleh manusia maupun agen.

`qa-lab` harus tetap menjadi runner markdown generik. Setiap file markdown skenario adalah sumber kebenaran untuk satu run pengujian dan harus mendefinisikan:

- metadata skenario
- metadata kategori, kemampuan, lane, dan risiko opsional
- ref docs dan kode
- kebutuhan plugin opsional
- patch config Gateway opsional
- `qa-flow` yang dapat dieksekusi

Permukaan runtime yang dapat digunakan ulang yang mendukung `qa-flow` boleh tetap generik dan lintas cakupan. Misalnya, skenario markdown dapat menggabungkan helper sisi-transport dengan helper sisi-browser yang menggerakkan Control UI tertanam melalui seam `browser.request` Gateway tanpa menambahkan runner kasus-khusus.

File skenario harus dikelompokkan berdasarkan kemampuan produk, bukan folder source tree. Pertahankan ID skenario tetap stabil saat file dipindahkan; gunakan `docsRefs` dan `codeRefs` untuk keterlacakan implementasi.

Daftar baseline harus tetap cukup luas untuk mencakup:

- chat DM dan kanal
- perilaku thread
- siklus hidup aksi pesan
- callback Cron
- recall memori
- pergantian model
- handoff subagen
- pembacaan repositori dan pembacaan docs
- satu tugas build kecil seperti Lobster Invaders

## Lane mock provider

`qa suite` memiliki dua lane mock provider lokal:

- `mock-openai` adalah mock OpenClaw sadar-skenario. Ini tetap menjadi lane mock deterministik default untuk QA berbasis repositori dan gate paritas.
- `aimock` memulai server provider berbasis AIMock untuk cakupan protokol eksperimental, fixture, rekam/putar ulang, dan chaos. Ini bersifat aditif dan tidak menggantikan dispatcher skenario `mock-openai`.

Implementasi lane-provider berada di bawah `extensions/qa-lab/src/providers/`. Setiap provider memiliki default, startup server lokal, config model Gateway, kebutuhan staging auth-profile, dan flag kemampuan live/mock miliknya sendiri. Kode suite dan Gateway bersama harus merutekan melalui registry provider alih-alih bercabang pada nama provider.

## Adapter transport

`qa-lab` memiliki seam transport generik untuk skenario QA markdown. `qa-channel` adalah adapter pertama pada seam itu, tetapi target desainnya lebih luas: kanal nyata atau sintetis di masa depan harus terhubung ke runner suite yang sama alih-alih menambahkan runner QA khusus transport.

Pada tingkat arsitektur, pemisahannya adalah:

- `qa-lab` memiliki eksekusi skenario generik, konkurensi worker, penulisan artefak, dan pelaporan.
- Adapter transport memiliki config Gateway, kesiapan, observasi masuk dan keluar, aksi transport, dan state transport ternormalisasi.
- File skenario markdown di bawah `qa/scenarios/` mendefinisikan run pengujian; `qa-lab` menyediakan permukaan runtime yang dapat digunakan ulang untuk mengeksekusinya.

### Menambahkan kanal

Menambahkan kanal ke sistem QA markdown memerlukan tepat dua hal:

1. Adapter transport untuk kanal tersebut.
2. Paket skenario yang menguji kontrak kanal.

Jangan menambahkan root perintah QA tingkat-atas baru saat host bersama `qa-lab` dapat memiliki alur tersebut.

`qa-lab` memiliki mekanika host bersama:

- root perintah `openclaw qa`
- startup dan teardown suite
- konkurensi worker
- penulisan artefak
- pembuatan laporan
- eksekusi skenario
- alias kompatibilitas untuk skenario `qa-channel` lama

Plugin runner memiliki kontrak transport:

- cara `openclaw qa <runner>` dipasang di bawah root `qa` bersama
- cara Gateway dikonfigurasi untuk transport tersebut
- cara kesiapan diperiksa
- cara event masuk diinjeksi
- cara pesan keluar diamati
- cara transkrip dan state transport ternormalisasi diekspos
- cara aksi berbasis transport dieksekusi
- cara reset atau cleanup khusus transport ditangani

Ambang adopsi minimum untuk kanal baru:

1. Pertahankan `qa-lab` sebagai pemilik root `qa` bersama.
2. Implementasikan runner transport pada seam host `qa-lab` bersama.
3. Pertahankan mekanika khusus transport di dalam Plugin runner atau harness kanal.
4. Pasang runner sebagai `openclaw qa <runner>` alih-alih mendaftarkan perintah root tandingan. Plugin runner harus mendeklarasikan `qaRunners` di `openclaw.plugin.json` dan mengekspor array `qaRunnerCliRegistrations` yang cocok dari `runtime-api.ts`. Jaga `runtime-api.ts` tetap ringan; CLI lazy dan eksekusi runner harus tetap berada di balik entrypoint terpisah.
5. Tulis atau adaptasi skenario markdown di bawah direktori bertema `qa/scenarios/`.
6. Gunakan helper skenario generik untuk skenario baru.
7. Pertahankan alias kompatibilitas yang ada tetap berfungsi kecuali repositori sedang melakukan migrasi yang disengaja.

Aturan keputusannya ketat:

- Jika perilaku dapat diekspresikan sekali di `qa-lab`, tempatkan di `qa-lab`.
- Jika perilaku bergantung pada satu transport kanal, pertahankan di Plugin runner atau harness plugin tersebut.
- Jika sebuah skenario memerlukan kemampuan baru yang dapat digunakan oleh lebih dari satu kanal, tambahkan helper generik alih-alih cabang khusus kanal di `suite.ts`.
- Jika sebuah perilaku hanya bermakna untuk satu transport, pertahankan skenario sebagai khusus transport dan buat itu eksplisit dalam kontrak skenario.

### Nama helper skenario

Helper generik yang direkomendasikan untuk skenario baru:

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

Alias kompatibilitas tetap tersedia untuk skenario yang ada — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — tetapi penulisan skenario baru harus menggunakan nama generik. Alias tersebut ada untuk menghindari migrasi flag-day, bukan sebagai model ke depan.

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari timeline bus yang diamati.
Laporan tersebut harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

Untuk inventaris skenario yang tersedia — berguna saat mengukur pekerjaan lanjutan atau menghubungkan transport baru — jalankan `pnpm openclaw qa coverage` (tambahkan `--json` untuk keluaran yang dapat dibaca mesin).

Untuk pemeriksaan karakter dan gaya, jalankan skenario yang sama di beberapa referensi model live
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

Perintah ini menjalankan proses turunan Gateway QA lokal, bukan Docker. Skenario evaluasi karakter
harus menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa
seperti obrolan, bantuan ruang kerja, dan tugas file kecil. Model kandidat
tidak boleh diberi tahu bahwa ia sedang dievaluasi. Perintah ini mempertahankan setiap transkrip
lengkap, mencatat statistik proses dasar, lalu meminta model penilai dalam mode cepat dengan
penalaran `xhigh` jika didukung untuk memeringkat proses berdasarkan kewajaran, nuansa, dan humor.
Gunakan `--blind-judge-models` saat membandingkan penyedia: prompt penilai tetap mendapatkan
setiap transkrip dan status proses, tetapi referensi kandidat diganti dengan
label netral seperti `candidate-01`; laporan memetakan peringkat kembali ke referensi asli setelah
penguraian.
Proses kandidat secara default menggunakan pemikiran `high`, dengan `medium` untuk GPT-5.5 dan `xhigh`
untuk referensi evaluasi OpenAI lama yang mendukungnya. Timpa kandidat tertentu secara inline dengan
`--model provider/model,thinking=<level>`. `--thinking <level>` tetap menetapkan
fallback global, dan bentuk lama `--model-thinking <provider/model=level>` tetap
dipertahankan untuk kompatibilitas.
Referensi kandidat OpenAI secara default menggunakan mode cepat agar pemrosesan prioritas digunakan jika
penyedia mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline saat
satu kandidat atau penilai membutuhkan penimpaan. Teruskan `--fast` hanya saat Anda ingin
memaksa mode cepat aktif untuk setiap model kandidat. Durasi kandidat dan penilai
dicatat dalam laporan untuk analisis tolok ukur, tetapi prompt penilai secara eksplisit mengatakan
agar tidak memberi peringkat berdasarkan kecepatan.
Proses model kandidat dan penilai sama-sama secara default menggunakan konkurensi 16. Turunkan
`--concurrency` atau `--judge-concurrency` saat batas penyedia atau tekanan Gateway lokal
membuat proses terlalu bising.
Saat tidak ada kandidat `--model` yang diteruskan, evaluasi karakter secara default menggunakan
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` saat tidak ada `--model` yang diteruskan.
Saat tidak ada `--judge-model` yang diteruskan, penilai secara default menggunakan
`openai/gpt-5.5,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-6,thinking=high`.

## Dokumen terkait

- [Matriks QA](/id/concepts/qa-matrix)
- [Kanal QA](/id/channels/qa-channel)
- [Pengujian](/id/help/testing)
- [Dasbor](/id/web/dashboard)
