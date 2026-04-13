---
read_when:
    - Memperluas qa-lab atau qa-channel
    - Menambahkan skenario QA yang didukung repo
    - Membangun otomatisasi QA dengan realisme lebih tinggi di sekitar dasbor Gateway
summary: Bentuk otomatisasi QA privat untuk qa-lab, qa-channel, skenario seeded, dan laporan protokol
title: Otomatisasi E2E QA
x-i18n:
    generated_at: "2026-04-13T08:50:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4a4f5c765163565c95c2a071f201775fd9d8d60cad4ff25d71e4710559c1570
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Otomatisasi E2E QA

Stack QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis,
berbentuk channel, dibandingkan yang bisa dicapai oleh satu unit test.

Komponen saat ini:

- `extensions/qa-channel`: channel pesan sintetis dengan permukaan DM, channel, thread,
  reaction, edit, dan delete.
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

Perintah itu membangun situs QA, memulai lane Gateway berbasis Docker, dan mengekspos
halaman QA Lab tempat operator atau loop otomatisasi dapat memberi agen
misi QA, mengamati perilaku channel nyata, dan mencatat apa yang berhasil, gagal, atau
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
membangun ulang bundle tersebut saat ada perubahan, dan browser akan memuat ulang otomatis saat hash aset QA Lab berubah.

Untuk lane smoke Matrix transport-real, jalankan:

```bash
pnpm openclaw qa matrix
```

Lane itu menyediakan homeserver Tuwunel sekali pakai di Docker, mendaftarkan
pengguna driver, SUT, dan observer sementara, membuat satu room privat, lalu menjalankan
Plugin Matrix nyata di dalam child Gateway QA. Lane transport live menjaga config child tetap terbatas pada transport yang diuji, sehingga Matrix berjalan tanpa
`qa-channel` dalam config child.

Untuk lane smoke Telegram transport-real, jalankan:

```bash
pnpm openclaw qa telegram
```

Lane itu menargetkan satu grup Telegram privat nyata alih-alih menyediakan server sekali pakai. Lane ini memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, serta dua bot berbeda di grup
privat yang sama. Bot SUT harus memiliki username Telegram, dan
observasi bot-ke-bot bekerja paling baik ketika kedua bot mengaktifkan
Bot-to-Bot Communication Mode di `@BotFather`.

Lane transport live kini berbagi satu kontrak yang lebih kecil alih-alih masing-masing
menciptakan bentuk daftar skenario sendiri:

`qa-channel` tetap menjadi suite luas untuk perilaku produk sintetis dan bukan bagian
dari matriks cakupan transport live.

| Lane     | Canary | Mention gating | Blokir allowlist | Balasan tingkat atas | Lanjut setelah restart | Tindak lanjut thread | Isolasi thread | Observasi reaction | Perintah bantuan |
| -------- | ------ | -------------- | ---------------- | -------------------- | ---------------------- | -------------------- | -------------- | ------------------ | ---------------- |
| Matrix   | x      | x              | x                | x                    | x                      | x                    | x              | x                  |                  |
| Telegram | x      |                |                  |                      |                        |                      |                |                    | x                |

Ini menjaga `qa-channel` sebagai suite luas untuk perilaku produk, sementara Matrix,
Telegram, dan transport live mendatang berbagi satu checklist kontrak transport yang eksplisit.

Untuk lane VM Linux sekali pakai tanpa membawa Docker ke dalam alur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Ini akan mem-boot guest Multipass baru, menginstal dependensi, membangun OpenClaw
di dalam guest, menjalankan `qa suite`, lalu menyalin laporan QA normal dan
ringkasan kembali ke `.artifacts/qa-e2e/...` di host.
Perintah ini menggunakan perilaku pemilihan skenario yang sama seperti `qa suite` di host.
Eksekusi suite di host dan Multipass menjalankan beberapa skenario terpilih secara paralel
dengan worker Gateway yang terisolasi secara default, hingga 64 worker atau sejumlah
skenario yang dipilih. Gunakan `--concurrency <count>` untuk menyesuaikan jumlah worker, atau
`--concurrency 1` untuk eksekusi serial.
Eksekusi live meneruskan input auth QA yang didukung dan praktis untuk
guest: key provider berbasis env, path config provider live QA, dan
`CODEX_HOME` bila ada. Pastikan `--output-dir` berada di bawah root repo agar guest
dapat menulis kembali melalui workspace yang di-mount.

## Seed yang didukung repo

Aset seed berada di `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Ini sengaja disimpan di git agar rencana QA terlihat oleh manusia maupun
agen.

`qa-lab` harus tetap menjadi runner markdown generik. Setiap file markdown skenario adalah
source of truth untuk satu eksekusi uji dan harus mendefinisikan:

- metadata skenario
- referensi docs dan kode
- persyaratan Plugin opsional
- patch config Gateway opsional
- `qa-flow` yang dapat dieksekusi

Permukaan runtime yang dapat digunakan ulang dan mendasari `qa-flow` boleh tetap generik
dan lintas-cutting. Misalnya, skenario markdown dapat menggabungkan helper sisi transport
dengan helper sisi browser yang menggerakkan Control UI tersemat melalui seam
Gateway `browser.request` tanpa menambahkan runner khusus.

Daftar dasar harus tetap cukup luas untuk mencakup:

- chat DM dan channel
- perilaku thread
- siklus hidup aksi pesan
- callback Cron
- pemanggilan memori
- pergantian model
- handoff subagen
- membaca repo dan docs
- satu tugas build kecil seperti Lobster Invaders

## Adapter transport

`qa-lab` memiliki seam transport generik untuk skenario QA markdown.
`qa-channel` adalah adapter pertama pada seam itu, tetapi target desainnya lebih luas:
channel nyata atau sintetis di masa depan harus dapat dipasang ke runner suite yang sama
alih-alih menambahkan runner QA khusus transport.

Pada level arsitektur, pembagiannya adalah:

- `qa-lab` memiliki eksekusi skenario generik, konkurensi worker, penulisan artifact, dan pelaporan.
- adapter transport memiliki config gateway, kesiapan, observasi inbound dan outbound, aksi transport, dan state transport yang dinormalisasi.
- file skenario markdown di bawah `qa/scenarios/` mendefinisikan eksekusi uji; `qa-lab` menyediakan permukaan runtime yang dapat digunakan ulang untuk mengeksekusinya.

Panduan adopsi untuk maintainer bagi adapter channel baru tersedia di
[Testing](/id/help/testing#adding-a-channel-to-qa).

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari timeline bus yang diamati.
Laporan tersebut harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

Untuk pemeriksaan karakter dan gaya, jalankan skenario yang sama di beberapa ref model live
dan tulis laporan Markdown hasil penilaian:

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

Perintah ini menjalankan proses child Gateway QA lokal, bukan Docker. Skenario character eval
harus menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa
seperti chat, bantuan workspace, dan tugas file kecil. Model kandidat
tidak boleh diberi tahu bahwa model tersebut sedang dievaluasi. Perintah ini mempertahankan setiap
transkrip lengkap, mencatat statistik dasar eksekusi, lalu meminta model juri dalam mode fast dengan
penalaran `xhigh` untuk memberi peringkat eksekusi berdasarkan naturalitas, vibe, dan humor.
Gunakan `--blind-judge-models` saat membandingkan provider: prompt juri tetap menerima
setiap transkrip dan status eksekusi, tetapi ref kandidat diganti dengan label netral
seperti `candidate-01`; laporan memetakan kembali peringkat ke ref asli setelah
parsing.
Eksekusi kandidat secara default menggunakan thinking `high`, dengan `xhigh` untuk model OpenAI yang
mendukungnya. Override kandidat tertentu secara inline dengan
`--model provider/model,thinking=<level>`. `--thinking <level>` tetap menetapkan
fallback global, dan bentuk lama `--model-thinking <provider/model=level>` tetap dipertahankan untuk kompatibilitas.
Ref kandidat OpenAI secara default menggunakan mode fast sehingga pemrosesan prioritas digunakan ketika
provider mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline ketika
satu kandidat atau juri memerlukan override. Berikan `--fast` hanya jika Anda ingin
memaksa mode fast aktif untuk setiap model kandidat. Durasi kandidat dan juri dicatat
dalam laporan untuk analisis benchmark, tetapi prompt juri secara eksplisit menyatakan
agar tidak memberi peringkat berdasarkan kecepatan.
Eksekusi model kandidat dan juri keduanya secara default menggunakan konkurensi 16. Turunkan
`--concurrency` atau `--judge-concurrency` ketika batas provider atau tekanan Gateway lokal
membuat suatu eksekusi terlalu bising.
Saat tidak ada kandidat `--model` yang diberikan, character eval secara default menggunakan
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` saat tidak ada `--model` yang diberikan.
Saat tidak ada `--judge-model` yang diberikan, juri secara default menggunakan
`openai/gpt-5.4,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-6,thinking=high`.

## Docs terkait

- [Testing](/id/help/testing)
- [QA Channel](/id/channels/qa-channel)
- [Dasbor](/web/dashboard)
