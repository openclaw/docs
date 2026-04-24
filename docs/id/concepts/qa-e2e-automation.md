---
read_when:
    - Memperluas qa-lab atau qa-channel
    - Menambahkan skenario QA yang didukung repo
    - Membangun otomasi QA dengan realisme lebih tinggi di sekitar dasbor Gateway
summary: Bentuk otomasi QA privat untuk qa-lab, qa-channel, skenario yang di-seed, dan laporan protokol
title: Otomasi E2E QA
x-i18n:
    generated_at: "2026-04-24T09:05:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbde51169a1572dc6753ab550ca29ca98abb2394e8991a8482bd7b66ea80ce76
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

Stack QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis,
berbentuk channel, daripada yang bisa dicapai oleh satu unit test.

Komponen saat ini:

- `extensions/qa-channel`: channel pesan sintetis dengan permukaan DM, channel, thread,
  reaksi, edit, dan hapus.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip,
  menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `qa/`: aset seed berbasis repo untuk tugas kickoff dan skenario QA
  baseline.

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dasbor Gateway (UI Control) dengan agen.
- Kanan: QA Lab, menampilkan transkrip bergaya Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Perintah itu membangun situs QA, memulai lane gateway berbasis Docker, dan mengekspos
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

`qa:lab:up:fast` menjaga layanan Docker tetap menggunakan image yang sudah dibangun sebelumnya dan melakukan bind-mount
`extensions/qa-lab/web/dist` ke container `qa-lab`. `qa:lab:watch`
membangun ulang bundle tersebut saat ada perubahan, dan browser melakukan muat ulang otomatis saat hash aset QA Lab berubah.

Untuk lane smoke Matrix transport-riil, jalankan:

```bash
pnpm openclaw qa matrix
```

Lane itu menyediakan homeserver Tuwunel sekali pakai di Docker, mendaftarkan
pengguna driver, SUT, dan observer sementara, membuat satu room privat, lalu menjalankan
Plugin Matrix nyata di dalam child QA gateway. Lane transport live menjaga config child
tetap dibatasi pada transport yang sedang diuji, sehingga Matrix berjalan tanpa
`qa-channel` di config child. Lane ini menulis artefak laporan terstruktur dan
log gabungan stdout/stderr ke direktori output Matrix QA yang dipilih. Untuk
menangkap juga output build/launcher `scripts/run-node.mjs` bagian luar, setel
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` ke file log lokal-repo.

Untuk lane smoke Telegram transport-riil, jalankan:

```bash
pnpm openclaw qa telegram
```

Lane itu menargetkan satu grup Telegram privat nyata alih-alih menyediakan
server sekali pakai. Lane ini memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, ditambah dua bot berbeda dalam grup
privat yang sama. Bot SUT harus memiliki username Telegram, dan observasi bot-ke-bot
berfungsi paling baik saat kedua bot memiliki Bot-to-Bot Communication Mode
diaktifkan di `@BotFather`.
Perintah keluar dengan status non-zero saat ada skenario yang gagal. Gunakan `--allow-failures` saat
Anda menginginkan artefak tanpa exit code gagal.
Laporan dan ringkasan Telegram menyertakan RTT per-balasan dari permintaan kirim
pesan driver ke balasan SUT yang teramati, dimulai dari canary.

Untuk lane smoke Discord transport-riil, jalankan:

```bash
pnpm openclaw qa discord
```

Lane itu menargetkan satu channel guild Discord privat nyata dengan dua bot: sebuah
bot driver yang dikendalikan harness dan bot SUT yang dimulai oleh child
Gateway OpenClaw melalui Plugin Discord bawaan. Lane ini memerlukan
`OPENCLAW_QA_DISCORD_GUILD_ID`, `OPENCLAW_QA_DISCORD_CHANNEL_ID`,
`OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`, `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`,
dan `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` saat menggunakan kredensial env.
Lane ini memverifikasi penanganan mention channel dan memeriksa bahwa bot SUT telah
mendaftarkan perintah native `/help` ke Discord.
Perintah keluar dengan status non-zero saat ada skenario yang gagal. Gunakan `--allow-failures` saat
Anda menginginkan artefak tanpa exit code gagal.

Lane transport live sekarang berbagi satu kontrak yang lebih kecil alih-alih masing-masing menciptakan
bentuk daftar skenario sendiri:

`qa-channel` tetap menjadi suite luas perilaku produk sintetis dan bukan bagian
dari matriks cakupan transport live.

| Lane     | Canary | Pembatasan mention | Blok allowlist | Balasan tingkat atas | Lanjut setelah restart | Follow-up thread | Isolasi thread | Observasi reaksi | Perintah help | Pendaftaran perintah native |
| -------- | ------ | ------------------ | -------------- | -------------------- | ---------------------- | ---------------- | -------------- | ---------------- | ------------- | --------------------------- |
| Matrix   | x      | x                  | x              | x                    | x                      | x                | x              | x                |               |                             |
| Telegram | x      | x                  |                |                      |                        |                  |                |                  | x             |                             |
| Discord  | x      | x                  |                |                      |                        |                  |                |                  |               | x                           |

Ini menjaga `qa-channel` sebagai suite luas perilaku produk sementara Matrix,
Telegram, dan transport live mendatang berbagi satu checklist kontrak transport
yang eksplisit.

Untuk lane VM Linux sekali pakai tanpa membawa Docker ke jalur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Perintah ini mem-boot guest Multipass baru, memasang dependensi, membangun OpenClaw
di dalam guest, menjalankan `qa suite`, lalu menyalin laporan dan
ringkasan QA normal kembali ke `.artifacts/qa-e2e/...` di host.
Perintah ini menggunakan kembali perilaku pemilihan skenario yang sama seperti `qa suite` di host.
Run suite host dan Multipass mengeksekusi beberapa skenario terpilih secara paralel
dengan worker gateway terisolasi secara default. `qa-channel` default ke konkurensi
4, dibatasi oleh jumlah skenario yang dipilih. Gunakan `--concurrency <count>` untuk menyetel
jumlah worker, atau `--concurrency 1` untuk eksekusi serial.
Perintah keluar dengan status non-zero saat ada skenario yang gagal. Gunakan `--allow-failures` saat
Anda menginginkan artefak tanpa exit code gagal.
Run live meneruskan input auth QA yang didukung dan praktis untuk
guest: kunci penyedia berbasis env, path config penyedia live QA, dan
`CODEX_HOME` bila ada. Pertahankan `--output-dir` di bawah root repo agar guest
dapat menulis kembali melalui workspace yang di-mount.

## Seed berbasis repo

Aset seed berada di `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Aset ini sengaja ada di git agar rencana QA terlihat oleh manusia maupun
agen.

`qa-lab` harus tetap menjadi runner Markdown generik. Setiap file Markdown skenario adalah
sumber kebenaran untuk satu run pengujian dan harus mendefinisikan:

- metadata skenario
- metadata kategori, kemampuan, lane, dan risiko opsional
- referensi dokumentasi dan kode
- persyaratan Plugin opsional
- patch config Gateway opsional
- `qa-flow` yang dapat dieksekusi

Permukaan runtime yang dapat digunakan ulang yang mendukung `qa-flow` diizinkan untuk tetap generik
dan lintas potong. Misalnya, skenario Markdown dapat menggabungkan helper
sisi transport dengan helper sisi browser yang mengendalikan UI Control tersemat melalui
seam `browser.request` Gateway tanpa menambahkan runner kasus khusus.

File skenario harus dikelompokkan berdasarkan kemampuan produk, bukan folder
pohon sumber. Pertahankan ID skenario tetap stabil saat file dipindahkan; gunakan `docsRefs` dan `codeRefs`
untuk keterlacakan implementasi.

Daftar baseline harus tetap cukup luas untuk mencakup:

- chat DM dan channel
- perilaku thread
- siklus hidup tindakan pesan
- callback Cron
- recall memori
- pergantian model
- handoff subagen
- pembacaan repo dan dokumentasi
- satu tugas build kecil seperti Lobster Invaders

## Lane mock penyedia

`qa suite` memiliki dua lane mock penyedia lokal:

- `mock-openai` adalah mock OpenClaw yang sadar skenario. Lane ini tetap menjadi
  lane mock deterministik default untuk QA berbasis repo dan gerbang paritas.
- `aimock` memulai server penyedia berbasis AIMock untuk cakupan protokol, fixture, record/replay, dan chaos yang eksperimental. Lane ini bersifat tambahan dan tidak menggantikan dispatcher skenario `mock-openai`.

Implementasi lane penyedia berada di bawah `extensions/qa-lab/src/providers/`.
Setiap penyedia memiliki default, startup server lokal, config model Gateway,
kebutuhan staging auth-profile, dan flag kemampuan live/mock sendiri. Kode suite dan gateway bersama seharusnya merutekan melalui registry penyedia alih-alih bercabang berdasarkan nama penyedia.

## Adapter transport

`qa-lab` memiliki seam transport generik untuk skenario QA Markdown.
`qa-channel` adalah adapter pertama pada seam tersebut, tetapi target desainnya lebih luas:
channel nyata atau sintetis di masa depan harus dipasang ke runner suite yang sama
alih-alih menambahkan runner QA khusus transport.

Pada tingkat arsitektur, pembagiannya adalah:

- `qa-lab` memiliki eksekusi skenario generik, konkurensi worker, penulisan artefak, dan pelaporan.
- adapter transport memiliki config gateway, kesiapan, observasi masuk dan keluar, tindakan transport, dan state transport yang dinormalisasi.
- file skenario Markdown di bawah `qa/scenarios/` mendefinisikan run pengujian; `qa-lab` menyediakan permukaan runtime yang dapat digunakan ulang yang mengeksekusinya.

Panduan adopsi untuk adapter channel baru yang ditujukan bagi maintainer ada di
[Testing](/id/help/testing#adding-a-channel-to-qa).

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari timeline bus yang diamati.
Laporan tersebut harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario lanjutan apa yang layak ditambahkan

Untuk pemeriksaan karakter dan gaya, jalankan skenario yang sama di beberapa ref model live
dan tulis laporan Markdown yang dinilai:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-6,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.4,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-6,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

Perintah tersebut menjalankan child process Gateway QA lokal, bukan Docker. Skenario evaluasi karakter
harus menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa
seperti chat, bantuan workspace, dan tugas file kecil. Model kandidat
tidak boleh diberi tahu bahwa model tersebut sedang dievaluasi. Perintah ini menyimpan setiap
transkrip lengkap, mencatat statistik run dasar, lalu meminta model juri dalam mode cepat dengan
penalaran `xhigh` bila didukung untuk memberi peringkat run berdasarkan naturalness, vibe, dan humor.
Gunakan `--blind-judge-models` saat membandingkan penyedia: prompt juri tetap mendapatkan
setiap transkrip dan status run, tetapi ref kandidat diganti dengan label netral
seperti `candidate-01`; laporan memetakan kembali peringkat ke ref sebenarnya setelah
parsing.
Run kandidat default ke thinking `high`, dengan `medium` untuk GPT-5.4 dan `xhigh`
untuk ref eval OpenAI lama yang mendukungnya. Override kandidat tertentu secara inline dengan
`--model provider/model,thinking=<level>`. `--thinking <level>` tetap menetapkan fallback
global, dan bentuk lama `--model-thinking <provider/model=level>` tetap
dipertahankan demi kompatibilitas.
Ref kandidat OpenAI default ke mode cepat sehingga pemrosesan prioritas digunakan saat
penyedia mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline saat
satu kandidat atau juri memerlukan override. Berikan `--fast` hanya saat Anda ingin
memaksa mode cepat aktif untuk setiap model kandidat. Durasi kandidat dan juri
dicatat dalam laporan untuk analisis benchmark, tetapi prompt juri secara eksplisit mengatakan
agar tidak memberi peringkat berdasarkan kecepatan.
Run model kandidat dan juri keduanya default ke konkurensi 16. Turunkan
`--concurrency` atau `--judge-concurrency` saat batas penyedia atau tekanan gateway lokal
membuat run terlalu bising.
Saat tidak ada kandidat `--model` yang diberikan, evaluasi karakter default ke
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` saat tidak ada `--model` yang diberikan.
Saat tidak ada `--judge-model` yang diberikan, juri default ke
`openai/gpt-5.4,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-6,thinking=high`.

## Dokumentasi terkait

- [Testing](/id/help/testing)
- [QA Channel](/id/channels/qa-channel)
- [Dashboard](/id/web/dashboard)
