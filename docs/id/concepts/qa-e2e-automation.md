---
read_when:
    - Memahami bagaimana tumpukan QA saling terintegrasi
    - Memperluas qa-lab, qa-channel, atau adapter transport
    - Menambahkan skenario QA berbasis repositori
    - Membangun otomatisasi QA yang lebih realistis untuk dasbor Gateway
summary: 'Ikhtisar tumpukan QA: qa-lab, qa-channel, skenario yang didukung repositori, jalur transport langsung, adapter transport, dan pelaporan.'
title: Ikhtisar QA
x-i18n:
    generated_at: "2026-05-03T21:30:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a1446fddb00855634d34662a0a47be1e5054a9e7bfed5bc9ae21185d87094d8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

Stack QA privat ditujukan untuk menguji OpenClaw dengan cara yang lebih realistis,
berbentuk saluran, daripada yang dapat dilakukan oleh satu uji unit.

Komponen saat ini:

- `extensions/qa-channel`: saluran pesan sintetis dengan permukaan DM, saluran, utas,
  reaksi, edit, dan hapus.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip,
  menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `extensions/qa-matrix`, Plugin runner masa depan: adaptor transportasi live yang
  menjalankan saluran nyata di dalam QA gateway turunan.
- `qa/`: aset seed berbasis repo untuk tugas kickoff dan skenario QA
  baseline.
- [Mantis](/id/concepts/mantis): verifikasi live sebelum dan sesudah untuk bug yang
  memerlukan transportasi nyata, tangkapan layar browser, status VM, dan bukti PR.

## Permukaan Perintah

Setiap alur QA berjalan di bawah `pnpm openclaw qa <subcommand>`. Banyak yang memiliki alias skrip `pnpm qa:*`;
kedua bentuk didukung.

| Perintah                                            | Tujuan                                                                                                                                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Pemeriksaan mandiri QA bawaan; menulis laporan Markdown.                                                                                                              |
| `qa suite`                                          | Menjalankan skenario berbasis repo terhadap lane QA gateway. Alias: `pnpm openclaw qa suite --runner multipass` untuk VM Linux sekali pakai.                          |
| `qa coverage`                                       | Mencetak inventaris cakupan skenario markdown (`--json` untuk keluaran mesin).                                                                                        |
| `qa parity-report`                                  | Membandingkan dua file `qa-suite-summary.json` dan menulis laporan paritas agentik.                                                                                   |
| `qa character-eval`                                 | Menjalankan skenario QA karakter pada beberapa model live dengan laporan yang dinilai. Lihat [Pelaporan](#reporting).                                                 |
| `qa manual`                                         | Menjalankan prompt sekali jalan terhadap lane penyedia/model yang dipilih.                                                                                             |
| `qa ui`                                             | Memulai UI debugger QA dan bus QA lokal (alias: `pnpm qa:lab:ui`).                                                                                                    |
| `qa docker-build-image`                             | Membangun image Docker QA yang sudah dipanggang.                                                                                                                       |
| `qa docker-scaffold`                                | Menulis scaffold docker-compose untuk dasbor QA + lane gateway.                                                                                                       |
| `qa up`                                             | Membangun situs QA, memulai stack yang didukung Docker, mencetak URL (alias: `pnpm qa:lab:up`; varian `:fast` menambahkan `--use-prebuilt-image --bind-ui-dist --skip-ui-build`). |
| `qa aimock`                                         | Memulai hanya server penyedia AIMock.                                                                                                                                  |
| `qa mock-openai`                                    | Memulai hanya server penyedia `mock-openai` yang sadar skenario.                                                                                                      |
| `qa credentials doctor` / `add` / `list` / `remove` | Mengelola pool kredensial Convex bersama.                                                                                                                              |
| `qa matrix`                                         | Lane transportasi live terhadap homeserver Tuwunel sekali pakai. Lihat [QA Matrix](/id/concepts/qa-matrix).                                                              |
| `qa telegram`                                       | Lane transportasi live terhadap grup Telegram privat nyata.                                                                                                           |
| `qa discord`                                        | Lane transportasi live terhadap channel guild Discord privat nyata.                                                                                                   |
| `qa mantis`                                         | Runner verifikasi sebelum dan sesudah untuk bug transportasi live, dengan skenario reaksi status Discord pertama. Lihat [Mantis](/id/concepts/mantis).                   |

## Alur Operator

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dasbor Gateway (Control UI) dengan agen.
- Kanan: QA Lab, menampilkan transkrip mirip Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Itu membangun situs QA, memulai lane gateway yang didukung Docker, dan mengekspos halaman
QA Lab tempat operator atau loop otomatisasi dapat memberi agen sebuah misi QA,
mengamati perilaku saluran nyata, dan mencatat apa yang berhasil, gagal, atau
tetap terblokir.

Untuk iterasi UI QA Lab yang lebih cepat tanpa membangun ulang image Docker setiap kali,
mulai stack dengan bundel QA Lab yang dipasang melalui bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` menjaga layanan Docker pada image prabangun dan memasang bind mount
`extensions/qa-lab/web/dist` ke dalam kontainer `qa-lab`. `qa:lab:watch`
membangun ulang bundel itu saat ada perubahan, dan browser memuat ulang otomatis ketika hash aset QA Lab
berubah.

Untuk smoke trace OpenTelemetry lokal, jalankan:

```bash
pnpm qa:otel:smoke
```

Skrip itu memulai penerima trace OTLP/HTTP lokal, menjalankan skenario QA
`otel-trace-smoke` dengan Plugin `diagnostics-otel` diaktifkan, lalu
mendekode span protobuf yang diekspor dan menegaskan bentuk yang kritis untuk rilis:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled`, dan `openclaw.message.delivery` harus ada;
panggilan model tidak boleh mengekspor `StreamAbandoned` pada giliran yang berhasil; ID diagnostik mentah dan
atribut `openclaw.content.*` harus tetap di luar trace. Skrip ini menulis
`otel-smoke-summary.json` di samping artefak suite QA.

QA observabilitas tetap hanya untuk checkout sumber. Tarball npm sengaja menghilangkan
QA Lab, sehingga lane rilis Docker paket tidak menjalankan perintah `qa`. Gunakan
`pnpm qa:otel:smoke` dari checkout sumber yang telah dibangun saat mengubah instrumentasi
diagnostik.

Untuk lane smoke Matrix yang benar-benar memakai transportasi nyata, jalankan:

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

Referensi CLI lengkap, katalog profil/skenario, variabel env, dan tata letak artefak untuk lane ini ada di [QA Matrix](/id/concepts/qa-matrix). Sekilas: ini menyediakan homeserver Tuwunel sekali pakai di Docker, mendaftarkan pengguna driver/SUT/observer sementara, menjalankan Plugin Matrix nyata di dalam QA gateway turunan yang dibatasi pada transportasi itu (tanpa `qa-channel`), lalu menulis laporan Markdown, ringkasan JSON, artefak observed-events, dan log keluaran gabungan di bawah `.artifacts/qa-e2e/matrix-<timestamp>/`.

Untuk lane smoke Telegram dan Discord yang benar-benar memakai transportasi nyata:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
```

Keduanya menargetkan saluran nyata yang sudah ada dengan dua bot (driver + SUT). Variabel env wajib, daftar skenario, artefak keluaran, dan pool kredensial Convex didokumentasikan di [Referensi QA Telegram dan Discord](#telegram-and-discord-qa-reference) di bawah.

Sebelum menggunakan kredensial live yang dipool, jalankan:

```bash
pnpm openclaw qa credentials doctor
```

Doctor memeriksa env broker Convex, memvalidasi pengaturan endpoint, dan memverifikasi keterjangkauan admin/daftar saat secret maintainer ada. Ini hanya melaporkan status disetel/tidak ada untuk secret.

## Cakupan Transportasi Live

Lane transportasi live berbagi satu kontrak, alih-alih masing-masing membuat bentuk daftar skenarionya sendiri. `qa-channel` adalah suite perilaku produk sintetis yang luas dan bukan bagian dari matriks cakupan transportasi live.

| Lane     | Canary | Gating mention | Bot-ke-bot | Blok allowlist | Balasan tingkat atas | Lanjutkan setelah restart | Tindak lanjut utas | Isolasi utas | Observasi reaksi | Perintah bantuan | Registrasi perintah native |
| -------- | ------ | -------------- | ---------- | -------------- | -------------------- | ------------------------- | ------------------ | ------------ | ---------------- | ---------------- | -------------------------- |
| Matrix   | x      | x              | x          | x              | x                    | x                         | x                  | x            | x                |                  |                            |
| Telegram | x      | x              | x          |                |                      |                           |                    |              |                  | x                |                            |
| Discord  | x      | x              | x          |                |                      |                           |                    |              |                  |                  | x                          |

Ini menjaga `qa-channel` sebagai suite perilaku produk yang luas sementara Matrix,
Telegram, dan transportasi live masa depan berbagi satu checklist kontrak transportasi
yang eksplisit.

Untuk lane VM Linux sekali pakai tanpa membawa Docker ke jalur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Ini mem-boot guest Multipass baru, menginstal dependensi, membangun OpenClaw
di dalam guest, menjalankan `qa suite`, lalu menyalin laporan QA dan
ringkasan normal kembali ke `.artifacts/qa-e2e/...` di host.
Ini menggunakan ulang perilaku pemilihan skenario yang sama seperti `qa suite` di host.
Run suite host dan Multipass menjalankan beberapa skenario yang dipilih secara paralel
dengan worker gateway terisolasi secara default. `qa-channel` secara default menggunakan konkurensi
4, dibatasi oleh jumlah skenario yang dipilih. Gunakan `--concurrency <count>` untuk menyesuaikan
jumlah worker, atau `--concurrency 1` untuk eksekusi serial.
Perintah keluar non-nol ketika ada skenario yang gagal. Gunakan `--allow-failures` ketika
Anda menginginkan artefak tanpa kode keluar gagal.
Run live meneruskan input autentikasi QA yang didukung dan praktis untuk
guest: kunci penyedia berbasis env, jalur konfigurasi penyedia live QA, dan
`CODEX_HOME` saat ada. Pertahankan `--output-dir` di bawah root repo agar guest
dapat menulis balik melalui workspace yang dipasang.

## Referensi QA Telegram dan Discord

Matrix memiliki [halaman khusus](/id/concepts/qa-matrix) karena jumlah skenarionya dan provisioning homeserver yang didukung Docker. Telegram dan Discord lebih kecil — beberapa skenario masing-masing, tanpa sistem profil, terhadap saluran nyata yang sudah ada — sehingga referensinya ada di sini.

### Flag CLI Bersama

Kedua lane mendaftar melalui `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` dan menerima flag yang sama:

| Opsi                                  | Bawaan                                                   | Deskripsi                                                                                                           |
| ------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | —                                                         | Jalankan hanya skenario ini. Dapat diulang.                                                                                   |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/{telegram,discord}-<timestamp>` | Tempat laporan/ringkasan/pesan yang diamati dan log keluaran ditulis. Jalur relatif diselesaikan terhadap `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                           | Root repositori saat dipanggil dari cwd netral.                                                                     |
| `--sut-account <id>`                  | `sut`                                                     | Id akun sementara di dalam konfigurasi Gateway QA.                                                                    |
| `--provider-mode <mode>`              | `live-frontier`                                           | `mock-openai` atau `live-frontier` (`live-openai` lama masih berfungsi).                                                  |
| `--model <ref>` / `--alt-model <ref>` | bawaan penyedia                                          | Ref model utama/alternatif.                                                                                         |
| `--fast`                              | mati                                                       | Mode cepat penyedia jika didukung.                                                                                   |
| `--credential-source <env\|convex>`   | `env`                                                     | Lihat [pool kredensial Convex](#convex-credential-pool).                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` di CI, selain itu `maintainer`                        | Peran yang digunakan saat `--credential-source convex`.                                                                          |

Keduanya keluar dengan kode bukan nol pada skenario apa pun yang gagal. `--allow-failures` menulis artefak tanpa menetapkan kode keluar gagal.

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

- `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1` mempertahankan isi pesan dalam artefak pesan yang diamati (bawaan disamarkan).

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
- `telegram-qa-summary.json` — menyertakan RTT per balasan (driver mengirim → balasan SUT teramati) mulai dari canary.
- `telegram-qa-observed-messages.json` — isi disamarkan kecuali `OPENCLAW_QA_TELEGRAM_CAPTURE_CONTENT=1`.

### QA Discord

```bash
pnpm openclaw qa discord
```

Menargetkan satu kanal guild Discord privat nyata dengan dua bot: bot driver yang dikendalikan oleh harness dan bot SUT yang dijalankan oleh Gateway OpenClaw anak melalui Plugin Discord bawaan. Memverifikasi penanganan mention kanal, bahwa bot SUT telah mendaftarkan perintah native `/help` dengan Discord, dan skenario bukti Mantis yang ikut serta secara eksplisit.

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
- `discord-status-reactions-tool-only` — skenario Mantis yang ikut serta secara eksplisit. Berjalan sendiri karena mengalihkan SUT ke balasan guild selalu aktif dan hanya alat dengan `messages.statusReactions.enabled=true`, lalu menangkap linimasa reaksi REST plus artefak visual HTML/PNG.

Jalankan skenario reaksi status Mantis secara eksplisit:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.4 \
  --alt-model openai/gpt-5.4 \
  --fast
```

Artefak keluaran:

- `discord-qa-report.md`
- `discord-qa-summary.json`
- `discord-qa-observed-messages.json` — isi disamarkan kecuali `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` dan `discord-status-reactions-tool-only-timeline.png` saat skenario reaksi status berjalan.

### Pool kredensial Convex

Lane Telegram dan Discord keduanya dapat menyewa kredensial dari pool Convex bersama alih-alih membaca env vars di atas. Berikan `--credential-source convex` (atau tetapkan `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab memperoleh sewa eksklusif, mengirim heartbeat selama durasi run, dan melepaskannya saat shutdown. Jenis pool adalah `"telegram"` dan `"discord"`.

Bentuk payload yang divalidasi broker pada `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` — `groupId` harus berupa string chat-id numerik.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.

Env vars operasional dan kontrak endpoint broker Convex ada di [Pengujian → Kredensial Telegram bersama melalui Convex](/id/help/testing#shared-telegram-credentials-via-convex-v1) (nama bagian sudah ada sebelum dukungan Discord; semantik broker identik untuk kedua jenis).

## Seed berbasis repo

Aset seed ada di `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Ini sengaja berada di git agar rencana QA terlihat oleh manusia dan
agen.

`qa-lab` harus tetap menjadi runner markdown generik. Setiap file markdown skenario adalah
sumber kebenaran untuk satu run pengujian dan harus mendefinisikan:

- metadata skenario
- metadata kategori, kapabilitas, lane, dan risiko opsional
- ref dokumen dan kode
- persyaratan Plugin opsional
- patch konfigurasi Gateway opsional
- `qa-flow` yang dapat dieksekusi

Permukaan runtime pakai ulang yang mendukung `qa-flow` boleh tetap generik
dan lintas aspek. Misalnya, skenario markdown dapat menggabungkan helper sisi transport
dengan helper sisi browser yang menggerakkan Control UI tersemat melalui
seam `browser.request` Gateway tanpa menambahkan runner kasus khusus.

File skenario harus dikelompokkan berdasarkan kapabilitas produk, bukan folder
pohon sumber. Pertahankan ID skenario agar stabil saat file berpindah; gunakan `docsRefs` dan `codeRefs`
untuk keterlacakan implementasi.

Daftar baseline harus tetap cukup luas untuk mencakup:

- chat DM dan kanal
- perilaku thread
- siklus hidup tindakan pesan
- callback cron
- pemanggilan kembali memori
- pergantian model
- handoff subagen
- pembacaan repo dan pembacaan dokumen
- satu tugas build kecil seperti Lobster Invaders

## Lane mock penyedia

`qa suite` memiliki dua lane mock penyedia lokal:

- `mock-openai` adalah mock OpenClaw yang sadar skenario. Ini tetap menjadi lane mock
  deterministik bawaan untuk QA berbasis repo dan gerbang paritas.
- `aimock` memulai server penyedia berbasis AIMock untuk cakupan protokol,
  fixture, rekam/putar ulang, dan chaos eksperimental. Ini bersifat aditif dan tidak
  menggantikan dispatcher skenario `mock-openai`.

Implementasi lane penyedia berada di bawah `extensions/qa-lab/src/providers/`.
Setiap penyedia memiliki bawaan, startup server lokal, konfigurasi model Gateway,
kebutuhan staging profil auth, dan flag kapabilitas live/mock-nya sendiri. Kode suite bersama dan
Gateway harus merutekan melalui registry penyedia alih-alih bercabang pada
nama penyedia.

## Adapter transport

`qa-lab` memiliki seam transport generik untuk skenario QA markdown. `qa-channel` adalah adapter pertama pada seam itu, tetapi target desainnya lebih luas: kanal nyata atau sintetis mendatang harus terhubung ke runner suite yang sama alih-alih menambahkan runner QA khusus transport.

Pada tingkat arsitektur, pembagiannya adalah:

- `qa-lab` memiliki eksekusi skenario generik, konkurensi worker, penulisan artefak, dan pelaporan.
- Adapter transport memiliki konfigurasi Gateway, readiness, pengamatan masuk dan keluar, tindakan transport, dan status transport ternormalisasi.
- File skenario markdown di bawah `qa/scenarios/` mendefinisikan run pengujian; `qa-lab` menyediakan permukaan runtime pakai ulang yang mengeksekusinya.

### Menambahkan kanal

Menambahkan kanal ke sistem QA markdown memerlukan tepat dua hal:

1. Adapter transport untuk kanal tersebut.
2. Paket skenario yang menguji kontrak kanal.

Jangan tambahkan root perintah QA tingkat atas baru saat host bersama `qa-lab` dapat memiliki alur tersebut.

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
- bagaimana readiness diperiksa
- bagaimana event masuk diinjeksi
- bagaimana pesan keluar diamati
- bagaimana transkrip dan status transport ternormalisasi diekspos
- bagaimana tindakan berbasis transport dieksekusi
- bagaimana reset atau pembersihan khusus transport ditangani

Batas adopsi minimum untuk kanal baru:

1. Pertahankan `qa-lab` sebagai pemilik root `qa` bersama.
2. Implementasikan runner transport pada seam host `qa-lab` bersama.
3. Pertahankan mekanika khusus transport di dalam Plugin runner atau harness kanal.
4. Pasang runner sebagai `openclaw qa <runner>` alih-alih mendaftarkan perintah root yang bersaing. Plugin runner harus mendeklarasikan `qaRunners` di `openclaw.plugin.json` dan mengekspor array `qaRunnerCliRegistrations` yang cocok dari `runtime-api.ts`. Jaga `runtime-api.ts` tetap ringan; eksekusi CLI dan runner lazy harus tetap berada di balik entrypoint terpisah.
5. Tulis atau adaptasi skenario markdown di bawah direktori `qa/scenarios/` bertema.
6. Gunakan helper skenario generik untuk skenario baru.
7. Pertahankan alias kompatibilitas yang ada tetap berfungsi kecuali repo sedang melakukan migrasi yang disengaja.

Aturan keputusannya ketat:

- Jika perilaku dapat diekspresikan sekali di `qa-lab`, letakkan di `qa-lab`.
- Jika perilaku bergantung pada satu transport kanal, pertahankan di Plugin runner atau harness Plugin tersebut.
- Jika sebuah skenario memerlukan kapabilitas baru yang dapat digunakan oleh lebih dari satu kanal, tambahkan helper generik alih-alih cabang khusus kanal di `suite.ts`.
- Jika sebuah perilaku hanya bermakna untuk satu transport, pertahankan skenario sebagai khusus transport dan buat hal itu eksplisit dalam kontrak skenario.

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

Alias kompatibilitas tetap tersedia untuk skenario yang sudah ada — `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` — tetapi penulisan skenario baru sebaiknya menggunakan nama generik. Alias tersebut ada untuk menghindari migrasi serentak, bukan sebagai model ke depannya.

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari linimasa bus yang diamati.
Laporan tersebut sebaiknya menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

Untuk inventaris skenario yang tersedia — berguna saat mengukur pekerjaan tindak lanjut atau menghubungkan transport baru — jalankan `pnpm openclaw qa coverage` (tambahkan `--json` untuk keluaran yang dapat dibaca mesin).

Untuk pemeriksaan karakter dan gaya, jalankan skenario yang sama pada beberapa referensi model live
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
sebaiknya menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa
seperti obrolan, bantuan ruang kerja, dan tugas file kecil. Model kandidat tidak boleh
diberi tahu bahwa model tersebut sedang dievaluasi. Perintah ini mempertahankan setiap
transkrip lengkap, mencatat statistik dasar proses, lalu meminta model penilai dalam mode cepat dengan
penalaran `xhigh` jika didukung untuk memeringkat proses berdasarkan kewajaran, nuansa, dan humor.
Gunakan `--blind-judge-models` saat membandingkan penyedia: prompt penilai tetap mendapatkan
setiap transkrip dan status proses, tetapi referensi kandidat diganti dengan label netral
seperti `candidate-01`; laporan memetakan peringkat kembali ke referensi asli setelah
penguraian.
Proses kandidat secara default menggunakan penalaran `high`, dengan `medium` untuk GPT-5.5 dan `xhigh`
untuk referensi evaluasi OpenAI yang lebih lama yang mendukungnya. Timpa kandidat tertentu secara inline dengan
`--model provider/model,thinking=<level>`. `--thinking <level>` tetap menetapkan
fallback global, dan bentuk lama `--model-thinking <provider/model=level>` tetap
dipertahankan untuk kompatibilitas.
Referensi kandidat OpenAI secara default menggunakan mode cepat sehingga pemrosesan prioritas digunakan jika
penyedia mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline saat
satu kandidat atau penilai memerlukan penimpaan. Berikan `--fast` hanya saat Anda ingin
memaksa mode cepat aktif untuk setiap model kandidat. Durasi kandidat dan penilai
dicatat dalam laporan untuk analisis benchmark, tetapi prompt penilai secara eksplisit mengatakan
agar tidak memeringkat berdasarkan kecepatan.
Proses model kandidat dan penilai sama-sama menggunakan konkurensi 16 secara default. Turunkan
`--concurrency` atau `--judge-concurrency` saat batas penyedia atau tekanan Gateway lokal
membuat proses terlalu berisik.
Saat tidak ada kandidat `--model` yang diberikan, evaluasi karakter secara default menggunakan
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` saat tidak ada `--model` yang diberikan.
Saat tidak ada `--judge-model` yang diberikan, penilai secara default menggunakan
`openai/gpt-5.5,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-6,thinking=high`.

## Dokumen terkait

- [QA Matriks](/id/concepts/qa-matrix)
- [QA Channel](/id/channels/qa-channel)
- [Pengujian](/id/help/testing)
- [Dasbor](/id/web/dashboard)
