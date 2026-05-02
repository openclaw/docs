---
read_when:
    - Memahami bagaimana rangkaian QA saling terhubung
    - Memperluas qa-lab, qa-channel, atau adapter transport
    - Menambahkan skenario QA berbasis repositori
    - Membangun otomatisasi QA dengan realisme lebih tinggi untuk dasbor Gateway
summary: 'Ikhtisar stack QA: qa-lab, qa-channel, skenario berbasis repo, jalur transport langsung, adapter transport, dan pelaporan.'
title: Ikhtisar QA
x-i18n:
    generated_at: "2026-05-02T20:44:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1cba04d6624bb1e0fc54105bd836f16ada0ba1cc1de9ab7065b90220e23bdf
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Stack QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis
dan berbentuk kanal dibandingkan satu uji unit.

Komponen saat ini:

- `extensions/qa-channel`: kanal pesan sintetis dengan permukaan DM, kanal, utas,
  reaksi, edit, dan hapus.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip,
  menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `extensions/qa-matrix`, Plugin runner mendatang: adapter transport langsung yang
  menggerakkan kanal nyata di dalam Gateway QA anak.
- `qa/`: aset seed berbasis repo untuk tugas awal dan skenario QA dasar.

## Permukaan Perintah

Setiap alur QA berjalan di bawah `pnpm openclaw qa <subcommand>`. Banyak yang memiliki alias skrip `pnpm qa:*`;
kedua bentuk didukung.

| Perintah                                            | Tujuan                                                                                                                                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Pemeriksaan mandiri QA bawaan; menulis laporan Markdown.                                                                                                              |
| `qa suite`                                          | Menjalankan skenario berbasis repo terhadap jalur Gateway QA. Alias: `pnpm openclaw qa suite --runner multipass` untuk VM Linux sekali pakai.                         |
| `qa coverage`                                       | Mencetak inventaris cakupan skenario markdown (`--json` untuk keluaran mesin).                                                                                        |
| `qa parity-report`                                  | Membandingkan dua file `qa-suite-summary.json` dan menulis laporan paritas agentik.                                                                                    |
| `qa character-eval`                                 | Menjalankan skenario QA karakter di beberapa model langsung dengan laporan yang dinilai. Lihat [Pelaporan](#reporting).                                               |
| `qa manual`                                         | Menjalankan prompt sekali pakai terhadap jalur penyedia/model yang dipilih.                                                                                            |
| `qa ui`                                             | Memulai UI debugger QA dan bus QA lokal (alias: `pnpm qa:lab:ui`).                                                                                                    |
| `qa docker-build-image`                             | Membangun image Docker QA yang sudah dipanggang.                                                                                                                       |
| `qa docker-scaffold`                                | Menulis scaffold docker-compose untuk dasbor QA + jalur Gateway.                                                                                                      |
| `qa up`                                             | Membangun situs QA, memulai stack berbasis Docker, mencetak URL (alias: `pnpm qa:lab:up`; varian `:fast` menambahkan `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Memulai hanya server penyedia AIMock.                                                                                                                                 |
| `qa mock-openai`                                    | Memulai hanya server penyedia `mock-openai` yang sadar skenario.                                                                                                      |
| `qa credentials doctor` / `add` / `list` / `remove` | Mengelola pool kredensial Convex bersama.                                                                                                                             |
| `qa matrix`                                         | Jalur transport langsung terhadap homeserver Tuwunel sekali pakai. Lihat [QA Matrix](/id/concepts/qa-matrix).                                                           |
| `qa telegram`                                       | Jalur transport langsung terhadap grup Telegram privat nyata.                                                                                                         |
| `qa discord`                                        | Jalur transport langsung terhadap kanal guild Discord privat nyata.                                                                                                   |

## Alur Operator

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: Dasbor Gateway (Control UI) dengan agen.
- Kanan: QA Lab, menampilkan transkrip bergaya Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Itu membangun situs QA, memulai jalur Gateway berbasis Docker, dan mengekspos
halaman QA Lab tempat operator atau loop otomasi dapat memberi agen misi QA,
mengamati perilaku kanal nyata, dan mencatat apa yang berhasil, gagal, atau
tetap terblokir.

Untuk iterasi UI QA Lab yang lebih cepat tanpa membangun ulang image Docker setiap kali,
mulai stack dengan bundle QA Lab yang dipasang bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` menjaga layanan Docker pada image yang sudah dibangun dan memasang bind
`extensions/qa-lab/web/dist` ke dalam kontainer `qa-lab`. `qa:lab:watch`
membangun ulang bundle itu saat ada perubahan, dan browser otomatis memuat ulang saat hash aset QA Lab
berubah.

Untuk smoke trace OpenTelemetry lokal, jalankan:

```bash
pnpm qa:otel:smoke
```

Skrip itu memulai penerima trace OTLP/HTTP lokal, menjalankan skenario QA
`otel-trace-smoke` dengan Plugin `diagnostics-otel` diaktifkan, lalu
mendekode span protobuf yang diekspor dan menegaskan bentuk penting untuk rilis:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled`, dan `openclaw.message.delivery` harus ada;
panggilan model tidak boleh mengekspor `StreamAbandoned` pada giliran yang berhasil; ID diagnostik mentah dan
atribut `openclaw.content.*` harus tetap berada di luar trace. Skrip ini menulis
`otel-smoke-summary.json` di sebelah artefak suite QA.

QA observabilitas tetap hanya untuk checkout sumber. Tarball npm sengaja menghilangkan
QA Lab, sehingga jalur rilis Docker paket tidak menjalankan perintah `qa`. Gunakan
`pnpm qa:otel:smoke` dari checkout sumber yang sudah dibangun saat mengubah instrumentasi
diagnostik.

Untuk jalur smoke Matrix yang benar-benar memakai transport nyata, jalankan:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Referensi CLI lengkap, katalog profil/skenario, env var, dan tata letak artefak untuk jalur ini ada di [QA Matrix](/id/concepts/qa-matrix). Sekilas: jalur ini menyediakan homeserver Tuwunel sekali pakai di Docker, mendaftarkan pengguna driver/SUT/observer sementara, menjalankan Plugin Matrix nyata di dalam Gateway QA anak yang dibatasi pada transport itu (tanpa `qa-channel`), lalu menulis laporan Markdown, ringkasan JSON, artefak observed-events, dan log keluaran gabungan di bawah `.artifacts/qa-e2e/matrix-<timestamp>/`.

Untuk jalur smoke Telegram dan Discord yang benar-benar memakai transport nyata:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Keduanya menargetkan kanal nyata yang sudah ada dengan dua bot (driver + SUT). Env var yang diperlukan, daftar skenario, artefak keluaran, dan pool kredensial Convex didokumentasikan dalam [referensi QA Telegram dan Discord](#telegram-and-discord-qa-reference) di bawah.

Sebelum memakai kredensial langsung yang dipool, jalankan:

```bash
pnpm openclaw qa credentials doctor
```

Doctor memeriksa env broker Convex, memvalidasi pengaturan endpoint, dan memverifikasi keterjangkauan admin/list saat secret maintainer tersedia. Ia hanya melaporkan status disetel/hilang untuk secret.

## Cakupan Transport Langsung

Jalur transport langsung berbagi satu kontrak, bukan masing-masing menciptakan bentuk daftar skenarionya sendiri. `qa-channel` adalah suite perilaku produk sintetis yang luas dan bukan bagian dari matriks cakupan transport langsung.

| Jalur    | Canary | Gating mention | Bot-ke-bot | Blok allowlist | Balasan tingkat atas | Lanjut setelah restart | Tindak lanjut utas | Isolasi utas | Observasi reaksi | Perintah bantuan | Registrasi perintah native |
| -------- | ------ | -------------- | ---------- | --------------- | -------------------- | ---------------------- | ------------------ | ------------ | ---------------- | ---------------- | -------------------------- |
| Matrix   | x      | x              | x          | x               | x                    | x                      | x                  | x            | x                |                  |                            |
| Telegram | x      | x              | x          |                 |                      |                        |                    |              |                  | x                |                            |
| Discord  | x      | x              | x          |                 |                      |                        |                    |              |                  |                  | x                          |

Ini menjaga `qa-channel` sebagai suite perilaku produk yang luas sementara Matrix,
Telegram, dan transport langsung mendatang berbagi satu checklist kontrak transport yang eksplisit.

Untuk jalur VM Linux sekali pakai tanpa membawa Docker ke jalur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Ini mem-boot guest Multipass baru, menginstal dependensi, membangun OpenClaw
di dalam guest, menjalankan `qa suite`, lalu menyalin laporan QA normal dan
ringkasan kembali ke `.artifacts/qa-e2e/...` pada host.
Ini menggunakan kembali perilaku pemilihan skenario yang sama seperti `qa suite` pada host.
Jalankan suite host dan Multipass mengeksekusi beberapa skenario terpilih secara paralel
dengan worker Gateway terisolasi secara default. `qa-channel` default ke konkurensi
4, dibatasi oleh jumlah skenario yang dipilih. Gunakan `--concurrency <count>` untuk menyesuaikan
jumlah worker, atau `--concurrency 1` untuk eksekusi serial.
Perintah keluar non-nol saat ada skenario yang gagal. Gunakan `--allow-failures` saat
Anda menginginkan artefak tanpa kode keluar gagal.
Jalankan langsung meneruskan input auth QA yang didukung dan praktis untuk
guest: kunci penyedia berbasis env, path konfigurasi penyedia langsung QA, dan
`CODEX_HOME` saat ada. Jaga `--output-dir` di bawah root repo agar guest
dapat menulis kembali melalui workspace yang dipasang.

## Referensi QA Telegram dan Discord

Matrix memiliki [halaman khusus](/id/concepts/qa-matrix) karena jumlah skenarionya dan penyediaan homeserver berbasis Docker. Telegram dan Discord lebih kecil — masing-masing beberapa skenario, tanpa sistem profil, terhadap kanal nyata yang sudah ada — sehingga referensinya berada di sini.

### Flag CLI Bersama

Kedua jalur mendaftar melalui `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` dan menerima flag yang sama:

| Flag                                  | Nilai bawaan                                              | Deskripsi                                                                                                             |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | Jalankan hanya skenario ini. Dapat diulang.                                                                           |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Tempat laporan/ringkasan/pesan yang diamati dan log keluaran ditulis. Path relatif di-resolve terhadap `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Root repositori saat dipanggil dari cwd netral.                                                                       |
| `--sut-account <id>`                  | `sut`                                                     | Id akun sementara di dalam konfigurasi QA Gateway.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` atau `live-frontier` (`live-openai` lama masih berfungsi).                                              |
| `--model <ref>` / `--alt-model <ref>` | bawaan penyedia                                           | Ref model utama/alternatif.                                                                                           |
| `--fast`                              | nonaktif                                                  | Mode cepat penyedia jika didukung.                                                                                    |
| `--credential-source <env\|convex>`   | `env`                                                     | Lihat [kumpulan kredensial Convex](#convex-credential-pool).                                                          |
| `--credential-role <maintainer\|ci>`  | `ci` di CI, selain itu `maintainer`                       | Peran yang digunakan saat `--credential-source convex`.                                                               |

Keduanya keluar dengan kode non-nol pada skenario yang gagal. `--allow-failures` menulis artefak tanpa menetapkan kode keluar gagal.

### QA Telegram

```bash
pnpm openclaw qa telegram
```

Menargetkan satu grup Telegram privat nyata dengan dua bot berbeda (driver + SUT). Bot SUT harus memiliki nama pengguna Telegram; pengamatan bot-ke-bot bekerja paling baik saat kedua bot mengaktifkan **Mode Komunikasi Bot-ke-Bot** di `@BotFather`.

Env wajib saat `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` — id chat numerik (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Opsional:

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` mempertahankan isi pesan dalam artefak pesan yang diamati (bawaan disunting).

Skenario (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts:44`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-context-command`

Artefak keluaran:

- `telegram-qa-report.md`
- `telegram-qa-summary.json` — menyertakan RTT per balasan (driver mengirim → balasan SUT yang diamati) mulai dari canary.
- `telegram-qa-observed-messages.json` — isi disunting kecuali `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

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

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` mempertahankan isi pesan dalam artefak pesan yang diamati.

Skenario (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`

Artefak keluaran:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — isi disunting kecuali `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.

### Kumpulan kredensial Convex

Lane Telegram dan Discord sama-sama dapat menyewa kredensial dari kumpulan Convex bersama alih-alih membaca variabel env di atas. Berikan `--credential-source convex` (atau set `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab memperoleh lease eksklusif, mengirim Heartbeat selama durasi proses berjalan, dan melepaskannya saat shutdown. Jenis kumpulan adalah `"telegram"` dan `"discord"`.

Bentuk payload yang divalidasi broker pada `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` harus berupa string chat-id numerik.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Variabel env operasional dan kontrak endpoint broker Convex berada di [Pengujian → Kredensial Telegram bersama melalui Convex](/id/help/testing#shared-telegram-credentials-via-convex-v1) (nama bagian ini mendahului dukungan Discord; semantik broker identik untuk kedua jenis).

## Seed berbasis repositori

Aset seed berada di `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Ini sengaja berada di git agar rencana QA terlihat oleh manusia dan agen.

`qa-lab` harus tetap menjadi runner markdown generik. Setiap file markdown skenario adalah sumber kebenaran untuk satu test run dan harus mendefinisikan:

- metadata skenario
- metadata kategori, kapabilitas, lane, dan risiko opsional
- ref docs dan kode
- persyaratan Plugin opsional
- patch konfigurasi Gateway opsional
- `qa-flow` yang dapat dieksekusi

Permukaan runtime yang dapat digunakan ulang yang menopang `qa-flow` boleh tetap generik dan lintas-bidang. Misalnya, skenario markdown dapat menggabungkan helper sisi transport dengan helper sisi browser yang mengendalikan Control UI tertanam melalui seam Gateway `browser.request` tanpa menambahkan runner kasus khusus.

File skenario harus dikelompokkan menurut kapabilitas produk, bukan folder pohon sumber. Pertahankan ID skenario tetap stabil saat file dipindahkan; gunakan `docsRefs` dan `codeRefs` untuk keterlacakan implementasi.

Daftar baseline harus tetap cukup luas untuk mencakup:

- DM dan chat kanal
- perilaku thread
- siklus hidup aksi pesan
- callback cron
- pemanggilan ulang memori
- pergantian model
- handoff subagen
- pembacaan repositori dan pembacaan docs
- satu tugas build kecil seperti Lobster Invaders

## Lane mock penyedia

`qa suite` memiliki dua lane mock penyedia lokal:

- `mock-openai` adalah mock OpenClaw yang sadar skenario. Ini tetap menjadi lane mock deterministik bawaan untuk QA berbasis repositori dan gate paritas.
- `aimock` memulai server penyedia berbasis AIMock untuk cakupan protokol, fixture, rekam/putar ulang, dan chaos eksperimental. Ini bersifat aditif dan tidak menggantikan dispatcher skenario `mock-openai`.

Implementasi lane penyedia berada di bawah `extensions/qa-lab/src/providers/`. Setiap penyedia memiliki default-nya sendiri, startup server lokal, konfigurasi model Gateway, kebutuhan staging profil auth, dan flag kapabilitas live/mock. Kode suite bersama dan Gateway harus merutekan melalui registry penyedia alih-alih bercabang berdasarkan nama penyedia.

## Adapter transport

`qa-lab` memiliki seam transport generik untuk skenario QA markdown. `qa-channel` adalah adapter pertama pada seam itu, tetapi target desainnya lebih luas: kanal nyata atau sintetis di masa depan harus dipasang ke runner suite yang sama alih-alih menambahkan runner QA khusus transport.

Pada tingkat arsitektur, pembagiannya adalah:

- `qa-lab` memiliki eksekusi skenario generik, konkurensi worker, penulisan artefak, dan pelaporan.
- Adapter transport memiliki konfigurasi Gateway, kesiapan, pengamatan inbound dan outbound, aksi transport, dan state transport ternormalisasi.
- File skenario markdown di bawah `qa/scenarios/` mendefinisikan test run; `qa-lab` menyediakan permukaan runtime yang dapat digunakan ulang untuk mengeksekusinya.

### Menambahkan kanal

Menambahkan kanal ke sistem QA markdown memerlukan tepat dua hal:

1. Adapter transport untuk kanal tersebut.
2. Paket skenario yang menguji kontrak kanal tersebut.

Jangan menambahkan root perintah QA tingkat atas baru saat host `qa-lab` bersama dapat memiliki alurnya.

`qa-lab` memiliki mekanika host bersama:

- root perintah `openclaw qa`
- startup dan teardown suite
- konkurensi worker
- penulisan artefak
- pembuatan laporan
- eksekusi skenario
- alias kompatibilitas untuk skenario `qa-channel` lama

Plugin runner memiliki kontrak transport:

- bagaimana `openclaw qa <runner>` dipasang di bawah root `qa` bersama
- bagaimana Gateway dikonfigurasi untuk transport tersebut
- bagaimana kesiapan diperiksa
- bagaimana event inbound diinjeksi
- bagaimana pesan outbound diamati
- bagaimana transkrip dan state transport ternormalisasi diekspos
- bagaimana aksi berbasis transport dieksekusi
- bagaimana reset atau pembersihan khusus transport ditangani

Batas adopsi minimum untuk kanal baru:

1. Pertahankan `qa-lab` sebagai pemilik root `qa` bersama.
2. Implementasikan runner transport pada seam host `qa-lab` bersama.
3. Pertahankan mekanika khusus transport di dalam Plugin runner atau harness kanal.
4. Pasang runner sebagai `openclaw qa <runner>` alih-alih mendaftarkan perintah root pesaing. Plugin runner harus mendeklarasikan `qaRunners` di `openclaw.plugin.json` dan mengekspor array `qaRunnerCliRegistrations` yang cocok dari `runtime-api.ts`. Jaga `runtime-api.ts` tetap ringan; CLI lazy dan eksekusi runner harus tetap berada di balik entrypoint terpisah.
5. Tulis atau adaptasi skenario markdown di bawah direktori bertema `qa/scenarios/`.
6. Gunakan helper skenario generik untuk skenario baru.
7. Pertahankan alias kompatibilitas yang ada tetap berfungsi kecuali repositori sedang melakukan migrasi yang disengaja.

Aturan keputusannya ketat:

- Jika perilaku dapat diekspresikan sekali di `qa-lab`, letakkan di `qa-lab`.
- Jika perilaku bergantung pada satu transport kanal, pertahankan di Plugin runner atau harness Plugin tersebut.
- Jika skenario membutuhkan kapabilitas baru yang dapat digunakan lebih dari satu kanal, tambahkan helper generik alih-alih cabang khusus kanal di `suite.ts`.
- Jika perilaku hanya bermakna untuk satu transport, pertahankan skenario tetap khusus transport dan buat hal itu eksplisit dalam kontrak skenario.

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

Alias kompatibilitas tetap tersedia untuk skenario yang ada — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — tetapi penulisan skenario baru harus menggunakan nama generik. Alias ada untuk menghindari migrasi serentak, bukan sebagai model ke depannya.

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari timeline bus yang diamati.
Laporan harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

Untuk inventaris skenario yang tersedia — berguna saat mengukur pekerjaan lanjutan atau menyambungkan transport baru — jalankan `pnpm openclaw qa coverage` (tambahkan `--json` untuk output yang dapat dibaca mesin).

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

Perintah ini menjalankan proses anak Gateway QA lokal, bukan Docker. Skenario evaluasi karakter
harus menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa
seperti obrolan, bantuan workspace, dan tugas file kecil. Model kandidat
tidak boleh diberi tahu bahwa model tersebut sedang dievaluasi. Perintah ini mempertahankan setiap
transkrip lengkap, mencatat statistik dasar proses, lalu meminta model juri dalam mode cepat dengan
penalaran `xhigh` jika didukung untuk mengurutkan proses berdasarkan kewajaran, nuansa, dan humor.
Gunakan `--blind-judge-models` saat membandingkan penyedia: prompt juri tetap mendapatkan
setiap transkrip dan status proses, tetapi ref kandidat diganti dengan
label netral seperti `candidate-01`; laporan memetakan peringkat kembali ke ref asli setelah
parsing.
Proses kandidat secara default menggunakan thinking `high`, dengan `medium` untuk GPT-5.5 dan `xhigh`
untuk ref evaluasi OpenAI lama yang mendukungnya. Timpa kandidat tertentu secara inline dengan
`--model provider/model,thinking=<level>`. `--thinking <level>` tetap menetapkan
fallback global, dan bentuk lama `--model-thinking <provider/model=level>` tetap
dipertahankan untuk kompatibilitas.
Ref kandidat OpenAI secara default menggunakan mode cepat sehingga pemrosesan prioritas digunakan jika
penyedia mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline saat
satu kandidat atau juri memerlukan penimpaan. Berikan `--fast` hanya saat Anda ingin
memaksa mode cepat aktif untuk setiap model kandidat. Durasi kandidat dan juri
dicatat dalam laporan untuk analisis benchmark, tetapi prompt juri secara eksplisit mengatakan
agar tidak membuat peringkat berdasarkan kecepatan.
Proses model kandidat dan juri keduanya secara default menggunakan concurrency 16. Turunkan
`--concurrency` atau `--judge-concurrency` saat batas penyedia atau tekanan Gateway
lokal membuat proses terlalu berisik.
Saat tidak ada `--model` kandidat yang diberikan, evaluasi karakter secara default menggunakan
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` saat tidak ada `--model` yang diberikan.
Saat tidak ada `--judge-model` yang diberikan, juri secara default menggunakan
`openai/gpt-5.5,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-6,thinking=high`.

## Dokumen terkait

- [QA Matriks](/id/concepts/qa-matrix)
- [Kanal QA](/id/channels/qa-channel)
- [Pengujian](/id/help/testing)
- [Dasbor](/id/web/dashboard)
