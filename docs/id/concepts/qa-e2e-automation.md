---
read_when:
    - Memperluas qa-lab atau qa-channel
    - Menambahkan skenario QA yang didukung repo
    - Membangun otomasi QA dengan realisme lebih tinggi di sekitar dashboard Gateway
summary: Bentuk otomasi QA privat untuk qa-lab, qa-channel, skenario ber-seed, dan laporan protokol
title: Otomasi QA E2E
x-i18n:
    generated_at: "2026-04-26T11:27:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3803f2bc5cdf2368c3af59b412de8ef732708995a54f7771d3f6f16e8be0592b
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

Stack QA privat ditujukan untuk menguji OpenClaw dengan cara yang lebih realistis,
berbentuk channel, dibandingkan yang bisa dicapai oleh satu unit test.

Komponen saat ini:

- `extensions/qa-channel`: channel pesan sintetis dengan permukaan DM, channel, thread,
  reaction, edit, dan delete.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip,
  menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `qa/`: aset seed berbasis repo untuk tugas kickoff dan skenario QA
  dasar.

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dashboard Gateway (Control UI) dengan agen.
- Kanan: QA Lab, menampilkan transkrip bergaya Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Itu membangun situs QA, memulai lane gateway berbasis Docker, dan mengekspos
halaman QA Lab tempat operator atau loop otomasi dapat memberi agen misi QA,
mengamati perilaku channel nyata, dan mencatat apa yang berhasil, gagal, atau
tetap terblokir.

Untuk iterasi UI QA Lab yang lebih cepat tanpa membangun ulang image Docker setiap kali,
mulai stack dengan bundle QA Lab yang di-bind-mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` menjaga layanan Docker tetap berjalan pada image yang sudah dibangun sebelumnya dan melakukan bind-mount
`extensions/qa-lab/web/dist` ke dalam container `qa-lab`. `qa:lab:watch`
membangun ulang bundle tersebut saat ada perubahan, dan browser melakukan auto-reload saat hash aset QA Lab berubah.

Untuk smoke lokal jejak OpenTelemetry, jalankan:

```bash
pnpm qa:otel:smoke
```

Skrip tersebut memulai receiver jejak OTLP/HTTP lokal, menjalankan
skenario QA `otel-trace-smoke` dengan Plugin `diagnostics-otel` diaktifkan, lalu
mendekode span protobuf yang diekspor dan memverifikasi bentuk yang kritis untuk rilis:
`openclaw.run`, `openclaw.harness.run`, `openclaw.model.call`,
`openclaw.context.assembled`, dan `openclaw.message.delivery` harus ada;
panggilan model tidak boleh mengekspor `StreamAbandoned` pada giliran yang berhasil; ID diagnostik mentah dan
atribut `openclaw.content.*` harus tetap tidak masuk ke jejak. Skrip ini menulis
`otel-smoke-summary.json` di samping artefak suite QA.

Untuk lane smoke Matrix dengan transport nyata, jalankan:

```bash
pnpm openclaw qa matrix
```

Lane tersebut memprovisikan homeserver Tuwunel sekali pakai di Docker, mendaftarkan
pengguna driver, SUT, dan observer sementara, membuat satu room privat, lalu menjalankan
plugin Matrix nyata di dalam child gateway QA. Lane transport langsung menjaga konfigurasi child
tetap dicakup ke transport yang sedang diuji, sehingga Matrix berjalan tanpa
`qa-channel` di konfigurasi child. Lane ini menulis artefak laporan terstruktur dan
log gabungan stdout/stderr ke direktori output QA Matrix yang dipilih. Untuk
menangkap output build/launcher luar `scripts/run-node.mjs` juga, atur
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` ke file log lokal repo.
Progres Matrix dicetak secara default. `OPENCLAW_QA_MATRIX_TIMEOUT_MS` membatasi
seluruh proses, dan `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` membatasi pembersihan agar teardown Docker
yang macet melaporkan perintah pemulihan yang tepat alih-alih menggantung.

Untuk lane smoke Telegram dengan transport nyata, jalankan:

```bash
pnpm openclaw qa telegram
```

Lane tersebut menargetkan satu grup Telegram privat nyata alih-alih memprovisikan
server sekali pakai. Lane ini memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, ditambah dua bot berbeda di grup
privat yang sama. Bot SUT harus memiliki username Telegram, dan observasi bot-ke-bot
bekerja paling baik saat kedua bot mengaktifkan Bot-to-Bot Communication Mode
di `@BotFather`.
Perintah ini keluar non-zero ketika ada skenario yang gagal. Gunakan `--allow-failures` ketika
Anda menginginkan artefak tanpa kode keluar gagal.
Laporan dan ringkasan Telegram mencakup RTT per balasan dari permintaan kirim pesan driver
hingga balasan SUT yang diamati, dimulai dari canary.

Sebelum menggunakan kredensial live pool, jalankan:

```bash
pnpm openclaw qa credentials doctor
```

Doctor memeriksa env broker Convex, memvalidasi pengaturan endpoint, dan memverifikasi
keterjangkauan admin/list saat secret maintainer tersedia. Doctor hanya melaporkan
status set/missing untuk secret.

Untuk lane smoke Discord dengan transport nyata, jalankan:

```bash
pnpm openclaw qa discord
```

Lane tersebut menargetkan satu channel guild Discord privat nyata dengan dua bot: bot
driver yang dikendalikan oleh harness dan bot SUT yang dimulai oleh child
gateway OpenClaw melalui plugin Discord bawaan. Lane ini memerlukan
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`,
dan `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` saat menggunakan kredensial env.
Lane ini memverifikasi penanganan mention channel dan memeriksa bahwa bot SUT telah
mendaftarkan perintah native `/help` ke Discord.
Perintah ini keluar non-zero ketika ada skenario yang gagal. Gunakan `--allow-failures` saat
Anda menginginkan artefak tanpa kode keluar gagal.

Lane transport langsung kini berbagi satu kontrak yang lebih kecil alih-alih masing-masing membuat
bentuk daftar skenario sendiri:

`qa-channel` tetap menjadi suite luas untuk perilaku produk sintetis dan bukan bagian
dari matriks cakupan transport langsung.

| Lane     | Canary | Mention gating | Blok allowlist | Balasan level atas | Lanjut setelah restart | Tindak lanjut thread | Isolasi thread | Observasi reaksi | Perintah help | Pendaftaran perintah native |
| -------- | ------ | -------------- | --------------- | ------------------ | ---------------------- | -------------------- | -------------- | ---------------- | ------------- | --------------------------- |
| Matrix   | x      | x              | x               | x                  | x                      | x                    | x              | x                |               |                             |
| Telegram | x      | x              |                 |                    |                        |                      |                |                  | x             |                             |
| Discord  | x      | x              |                 |                    |                        |                      |                |                  |               | x                           |

Ini menjaga `qa-channel` sebagai suite luas untuk perilaku produk sementara Matrix,
Telegram, dan transport langsung di masa depan berbagi satu checklist kontrak transport yang eksplisit.

Untuk lane VM Linux sekali pakai tanpa membawa Docker ke jalur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Ini mem-boot guest Multipass baru, memasang dependensi, membangun OpenClaw
di dalam guest, menjalankan `qa suite`, lalu menyalin laporan QA normal dan
ringkasan kembali ke `.artifacts/qa-e2e/...` di host.
Lane ini menggunakan kembali perilaku pemilihan skenario yang sama seperti `qa suite` di host.
Proses suite host dan Multipass mengeksekusi beberapa skenario terpilih secara paralel
dengan worker gateway terisolasi secara default. `qa-channel` default-nya concurrency
4, dibatasi oleh jumlah skenario yang dipilih. Gunakan `--concurrency <count>` untuk menyesuaikan
jumlah worker, atau `--concurrency 1` untuk eksekusi serial.
Perintah ini keluar non-zero ketika ada skenario yang gagal. Gunakan `--allow-failures` saat
Anda menginginkan artefak tanpa kode keluar gagal.
Proses live meneruskan input autentikasi QA yang didukung dan praktis untuk
guest: key provider berbasis env, path konfigurasi provider live QA, dan
`CODEX_HOME` bila ada. Pertahankan `--output-dir` di bawah root repo agar guest
dapat menulis balik melalui workspace yang di-mount.

## Seed berbasis repo

Aset seed berada di `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Aset-aset ini sengaja ada di git agar rencana QA terlihat oleh manusia maupun
agen.

`qa-lab` harus tetap menjadi runner markdown generik. Setiap file markdown skenario
adalah source of truth untuk satu proses uji dan harus mendefinisikan:

- metadata skenario
- metadata kategori, capability, lane, dan risk opsional
- referensi docs dan kode
- persyaratan Plugin opsional
- patch konfigurasi gateway opsional
- `qa-flow` yang dapat dieksekusi

Permukaan runtime yang dapat digunakan ulang yang mendasari `qa-flow` diizinkan untuk tetap generik
dan lintas area. Misalnya, skenario markdown dapat menggabungkan helper sisi transport
dengan helper sisi browser yang menggerakkan Control UI tertanam melalui seam
Gateway `browser.request` tanpa menambahkan runner kasus khusus.

File skenario harus dikelompokkan berdasarkan capability produk, bukan folder
pohon sumber. Pertahankan ID skenario tetap stabil saat file dipindahkan; gunakan `docsRefs` dan `codeRefs`
untuk keterlacakan implementasi.

Daftar dasar harus tetap cukup luas untuk mencakup:

- chat DM dan channel
- perilaku thread
- siklus hidup aksi pesan
- callback Cron
- recall memori
- pergantian model
- handoff subagen
- pembacaan repo dan pembacaan docs
- satu tugas build kecil seperti Lobster Invaders

## Lane mock provider

`qa suite` memiliki dua lane mock provider lokal:

- `mock-openai` adalah mock OpenClaw yang sadar skenario. Ini tetap menjadi
  lane mock deterministik default untuk QA berbasis repo dan gate paritas.
- `aimock` memulai server provider berbasis AIMock untuk cakupan protokol,
  fixture, record/replay, dan chaos yang eksperimental. Ini bersifat aditif dan tidak
  menggantikan dispatcher skenario `mock-openai`.

Implementasi lane provider berada di bawah `extensions/qa-lab/src/providers/`.
Setiap provider memiliki default, startup server lokal, konfigurasi model gateway,
kebutuhan staging auth-profile, serta flag capability live/mock miliknya sendiri. Kode suite dan gateway
bersama harus merutekan melalui registry provider alih-alih bercabang berdasarkan
nama provider.

## Adaptor transport

`qa-lab` memiliki seam transport generik untuk skenario QA markdown.
`qa-channel` adalah adaptor pertama pada seam tersebut, tetapi target desainnya lebih luas:
channel nyata atau sintetis di masa depan seharusnya dapat dipasang ke runner suite yang sama
alih-alih menambahkan runner QA khusus transport.

Pada tingkat arsitektur, pembagiannya adalah:

- `qa-lab` memiliki eksekusi skenario generik, concurrency worker, penulisan artefak, dan pelaporan.
- adaptor transport memiliki konfigurasi gateway, kesiapan, observasi masuk dan keluar, aksi transport, dan status transport yang dinormalisasi.
- file skenario markdown di bawah `qa/scenarios/` mendefinisikan proses uji; `qa-lab` menyediakan permukaan runtime yang dapat digunakan ulang yang mengeksekusinya.

Panduan adopsi untuk maintainer bagi adaptor channel baru berada di
[Testing](/id/help/testing#adding-a-channel-to-qa).

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari timeline bus yang diamati.
Laporan tersebut harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

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

Perintah ini menjalankan proses child gateway QA lokal, bukan Docker. Skenario character eval
sebaiknya menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa
seperti chat, bantuan workspace, dan tugas file kecil. Model kandidat
tidak boleh diberi tahu bahwa model tersebut sedang dievaluasi. Perintah ini mempertahankan setiap transkrip
lengkap, mencatat statistik dasar proses, lalu meminta model judge dalam mode fast dengan
reasoning `xhigh` bila didukung untuk memberi peringkat proses berdasarkan naturalness, vibe, dan humor.
Gunakan `--blind-judge-models` saat membandingkan provider: prompt judge tetap menerima
setiap transkrip dan status proses, tetapi referensi kandidat diganti dengan label netral
seperti `candidate-01`; laporan memetakan peringkat kembali ke referensi sebenarnya setelah
parsing.
Proses kandidat default ke thinking `high`, dengan `medium` untuk GPT-5.5 dan `xhigh`
untuk referensi eval OpenAI lama yang mendukungnya. Timpa kandidat tertentu secara inline dengan
`--model provider/model,thinking=<level>`. `--thinking <level>` tetap menetapkan fallback
global, dan bentuk lama `--model-thinking <provider/model=level>` dipertahankan untuk
kompatibilitas.
Referensi kandidat OpenAI default ke mode fast agar pemrosesan prioritas digunakan bila
provider mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline ketika
satu kandidat atau judge memerlukan override. Berikan `--fast` hanya jika Anda ingin
memaksa mode fast aktif untuk setiap model kandidat. Durasi kandidat dan judge
dicatat dalam laporan untuk analisis benchmark, tetapi prompt judge secara eksplisit menyatakan
agar tidak memberi peringkat berdasarkan kecepatan.
Proses model kandidat dan judge sama-sama default ke concurrency 16. Turunkan
`--concurrency` atau `--judge-concurrency` ketika batas provider atau tekanan gateway lokal
membuat proses terlalu bising.
Ketika tidak ada kandidat `--model` yang diberikan, character eval default ke
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` saat tidak ada `--model` yang diberikan.
Ketika tidak ada `--judge-model` yang diberikan, judge default ke
`openai/gpt-5.5,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-6,thinking=high`.

## Dokumen terkait

- [Testing](/id/help/testing)
- [QA Channel](/id/channels/qa-channel)
- [Dashboard](/id/web/dashboard)
