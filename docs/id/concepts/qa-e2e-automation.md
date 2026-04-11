---
read_when:
    - Memperluas qa-lab atau qa-channel
    - Menambahkan skenario QA yang didukung repo
    - Membangun otomasi QA dengan realisme lebih tinggi di sekitar dasbor Gateway
summary: Bentuk otomasi QA privat untuk qa-lab, qa-channel, skenario seed, dan laporan protokol
title: Otomasi E2E QA
x-i18n:
    generated_at: "2026-04-11T02:44:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5427b505e26bfd542e984e3920c3f7cb825473959195ba9737eff5da944c60d0
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Otomasi E2E QA

Stack QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis,
berbentuk channel, dibandingkan yang bisa dilakukan oleh satu uji unit.

Komponen saat ini:

- `extensions/qa-channel`: channel pesan sintetis dengan permukaan DM, channel, thread,
  reaksi, edit, dan hapus.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip,
  menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `qa/`: aset seed yang didukung repo untuk tugas kickoff dan skenario QA
  dasar.

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dasbor Gateway (Control UI) dengan agen.
- Kanan: QA Lab, menampilkan transkrip bergaya Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Itu membangun situs QA, memulai lane gateway berbasis Docker, dan mengekspos
halaman QA Lab tempat operator atau loop otomasi dapat memberi agen sebuah misi QA,
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

`qa:lab:up:fast` mempertahankan layanan Docker pada image yang sudah dibangun sebelumnya dan melakukan bind-mount
`extensions/qa-lab/web/dist` ke dalam container `qa-lab`. `qa:lab:watch`
membangun ulang bundle itu saat ada perubahan, dan browser akan memuat ulang otomatis saat hash aset QA Lab berubah.

Untuk lane smoke Matrix dengan transport nyata, jalankan:

```bash
pnpm openclaw qa matrix
```

Lane itu menyediakan homeserver Tuwunel sekali pakai di Docker, mendaftarkan
pengguna driver, SUT, dan observer sementara, membuat satu room privat, lalu menjalankan
plugin Matrix nyata di dalam child QA gateway. Lane transport live menjaga config child
tetap terbatas pada transport yang sedang diuji, sehingga Matrix berjalan tanpa
`qa-channel` dalam config child.

Untuk lane smoke Telegram dengan transport nyata, jalankan:

```bash
pnpm openclaw qa telegram
```

Lane itu menargetkan satu grup Telegram privat nyata alih-alih menyediakan server sekali pakai.
Ini memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, ditambah dua bot berbeda dalam grup
privat yang sama. Bot SUT harus memiliki username Telegram, dan observasi bot-ke-bot
berfungsi paling baik saat kedua bot mengaktifkan Bot-to-Bot Communication Mode
di `@BotFather`.

Lane transport live sekarang berbagi satu kontrak yang lebih kecil alih-alih masing-masing menciptakan
bentuk daftar skenario mereka sendiri:

`qa-channel` tetap menjadi suite perilaku produk sintetis yang luas dan bukan bagian
dari matriks cakupan transport live.

| Lane     | Canary | Pengaturan mention | Blok allowlist | Balasan tingkat atas | Lanjutkan setelah restart | Tindak lanjut thread | Isolasi thread | Observasi reaksi | Perintah help |
| -------- | ------ | ------------------ | -------------- | -------------------- | ------------------------- | -------------------- | -------------- | ---------------- | ------------- |
| Matrix   | x      | x                  | x              | x                    | x                         | x                    | x              | x                |               |
| Telegram | x      |                    |                |                      |                           |                      |                |                  | x             |

Ini menjaga `qa-channel` sebagai suite perilaku produk yang luas sementara Matrix,
Telegram, dan transport live di masa depan berbagi satu daftar periksa kontrak transport yang eksplisit.

Untuk lane VM Linux sekali pakai tanpa membawa Docker ke jalur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Ini mem-boot guest Multipass baru, menginstal dependensi, membangun OpenClaw
di dalam guest, menjalankan `qa suite`, lalu menyalin laporan dan
ringkasan QA normal kembali ke `.artifacts/qa-e2e/...` di host.
Ini menggunakan kembali perilaku pemilihan skenario yang sama seperti `qa suite` di host.
Eksekusi suite host dan Multipass menjalankan beberapa skenario terpilih secara paralel
dengan worker gateway terisolasi secara default, hingga 64 worker atau sejumlah
skenario yang dipilih. Gunakan `--concurrency <count>` untuk menyesuaikan jumlah worker, atau
`--concurrency 1` untuk eksekusi serial.
Eksekusi live meneruskan input auth QA yang didukung dan praktis untuk
guest: kunci provider berbasis env, jalur config provider live QA, dan
`CODEX_HOME` jika ada. Pertahankan `--output-dir` di bawah root repo agar guest
dapat menulis kembali melalui workspace yang di-mount.

## Seed yang didukung repo

Aset seed berada di `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Ini sengaja disimpan di git agar rencana QA terlihat oleh manusia maupun
agen. Daftar dasar harus tetap cukup luas untuk mencakup:

- chat DM dan channel
- perilaku thread
- siklus hidup aksi pesan
- callback cron
- pemanggilan memori
- pergantian model
- handoff subagent
- membaca repo dan membaca docs
- satu tugas build kecil seperti Lobster Invaders

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari linimasa bus yang diamati.
Laporan itu harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

Untuk pemeriksaan karakter dan gaya, jalankan skenario yang sama pada beberapa ref model live
dan tulis laporan Markdown yang dinilai:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.4,thinking=xhigh \
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

Perintah ini menjalankan proses child QA gateway lokal, bukan Docker. Skenario evaluasi karakter
harus menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa
seperti chat, bantuan workspace, dan tugas file kecil. Model kandidat
tidak boleh diberi tahu bahwa ia sedang dievaluasi. Perintah ini mempertahankan setiap
transkrip lengkap, merekam statistik dasar eksekusi, lalu meminta model juri dalam mode fast dengan
penalaran `xhigh` untuk memberi peringkat eksekusi berdasarkan kealamian, vibe, dan humor.
Gunakan `--blind-judge-models` saat membandingkan provider: prompt juri tetap menerima
setiap transkrip dan status eksekusi, tetapi ref kandidat diganti dengan label netral
seperti `candidate-01`; laporan memetakan kembali peringkat ke ref nyata setelah
parsing.
Eksekusi kandidat secara default menggunakan thinking `high`, dengan `xhigh` untuk model OpenAI yang
mendukungnya. Ganti kandidat tertentu secara inline dengan
`--model provider/model,thinking=<level>`. `--thinking <level>` tetap menetapkan
fallback global, dan bentuk lama `--model-thinking <provider/model=level>` tetap
dipertahankan untuk kompatibilitas.
Ref kandidat OpenAI secara default menggunakan mode fast sehingga pemrosesan prioritas dipakai jika
provider mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline ketika
satu kandidat atau juri memerlukan penggantian. Berikan `--fast` hanya jika Anda ingin
memaksa mode fast aktif untuk setiap model kandidat. Durasi kandidat dan juri
dicatat dalam laporan untuk analisis benchmark, tetapi prompt juri secara eksplisit mengatakan
untuk tidak memberi peringkat berdasarkan kecepatan.
Eksekusi model kandidat dan juri keduanya menggunakan konkurensi 16 secara default. Turunkan
`--concurrency` atau `--judge-concurrency` ketika batas provider atau tekanan gateway lokal
membuat eksekusi terlalu berisik.
Saat tidak ada kandidat `--model` yang diberikan, evaluasi karakter secara default menggunakan
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` saat tidak ada `--model` yang diberikan.
Saat tidak ada `--judge-model` yang diberikan, juri secara default menggunakan
`openai/gpt-5.4,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-6,thinking=high`.

## Dokumen terkait

- [Testing](/id/help/testing)
- [QA Channel](/id/channels/qa-channel)
- [Dashboard](/web/dashboard)
