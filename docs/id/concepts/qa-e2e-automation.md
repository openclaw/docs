---
read_when:
    - Memperluas qa-lab atau qa-channel
    - Menambahkan skenario QA berbasis repo
    - Membangun otomasi QA dengan realisme lebih tinggi di sekitar dasbor Gateway
summary: Bentuk otomasi QA privat untuk qa-lab, qa-channel, skenario seed, dan laporan protokol
title: Otomasi QA E2E
x-i18n:
    generated_at: "2026-04-18T09:05:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: adf8c5f74e8fabdc8e9fd7ecd41afce8b60354c7dd24d92ac926d3c527927cd4
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Otomasi QA E2E

Stack QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis dan berbentuk seperti channel dibandingkan yang dapat dilakukan oleh satu unit test.

Bagian saat ini:

- `extensions/qa-channel`: channel pesan sintetis dengan permukaan DM, channel, thread, reaction, edit, dan delete.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip, menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `qa/`: aset seed berbasis repo untuk tugas kickoff dan skenario QA baseline.

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dasbor Gateway (Control UI) dengan agen.
- Kanan: QA Lab, yang menampilkan transkrip bergaya Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Perintah itu membangun situs QA, memulai lane gateway berbasis Docker, dan mengekspos halaman QA Lab tempat operator atau loop otomasi dapat memberi agen misi QA, mengamati perilaku channel nyata, dan mencatat apa yang berhasil, gagal, atau tetap terblokir.

Untuk iterasi UI QA Lab yang lebih cepat tanpa membangun ulang image Docker setiap kali, mulai stack dengan bundle QA Lab yang di-bind-mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` menjaga layanan Docker tetap berjalan pada image yang sudah dibangun sebelumnya dan melakukan bind-mount `extensions/qa-lab/web/dist` ke dalam container `qa-lab`. `qa:lab:watch` membangun ulang bundle tersebut saat ada perubahan, dan browser memuat ulang secara otomatis saat hash aset QA Lab berubah.

Untuk lane smoke Matrix dengan transport nyata, jalankan:

```bash
pnpm openclaw qa matrix
```

Lane itu menyediakan homeserver Tuwunel sekali pakai di Docker, mendaftarkan pengguna driver, SUT, dan observer sementara, membuat satu room privat, lalu menjalankan plugin Matrix nyata di dalam child Gateway QA. Lane transport live menjaga konfigurasi child tetap dibatasi pada transport yang sedang diuji, sehingga Matrix berjalan tanpa `qa-channel` di konfigurasi child. Lane ini menulis artefak laporan terstruktur dan log stdout/stderr gabungan ke direktori output QA Matrix yang dipilih. Untuk juga menangkap output build/launcher luar dari `scripts/run-node.mjs`, set `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` ke file log lokal repo.

Untuk lane smoke Telegram dengan transport nyata, jalankan:

```bash
pnpm openclaw qa telegram
```

Lane itu menargetkan satu grup Telegram privat nyata alih-alih menyediakan server sekali pakai. Lane ini memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, serta dua bot berbeda dalam grup privat yang sama. Bot SUT harus memiliki username Telegram, dan observasi bot-ke-bot bekerja paling baik saat kedua bot mengaktifkan Bot-to-Bot Communication Mode di `@BotFather`.

Lane transport live sekarang berbagi satu kontrak yang lebih kecil alih-alih masing-masing menciptakan bentuk daftar skenario sendiri:

`qa-channel` tetap menjadi suite perilaku produk sintetis yang luas dan bukan bagian dari matriks cakupan transport live.

| Lane     | Canary | Gating mention | Blokir allowlist | Balasan tingkat atas | Lanjut setelah restart | Tindak lanjut thread | Isolasi thread | Observasi reaction | Perintah help |
| -------- | ------ | -------------- | ---------------- | -------------------- | ---------------------- | -------------------- | -------------- | ------------------ | ------------- |
| Matrix   | x      | x              | x                | x                    | x                      | x                    | x              | x                  |               |
| Telegram | x      |                |                  |                      |                        |                      |                |                    | x             |

Ini menjaga `qa-channel` sebagai suite perilaku produk yang luas, sementara Matrix, Telegram, dan transport live di masa mendatang berbagi satu daftar periksa kontrak transport yang eksplisit.

Untuk lane VM Linux sekali pakai tanpa membawa Docker ke jalur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Ini menyalakan guest Multipass baru, memasang dependensi, membangun OpenClaw di dalam guest, menjalankan `qa suite`, lalu menyalin kembali laporan dan ringkasan QA normal ke `.artifacts/qa-e2e/...` di host.
Lane ini menggunakan kembali perilaku pemilihan skenario yang sama seperti `qa suite` di host.
Eksekusi suite di host dan Multipass menjalankan beberapa skenario terpilih secara paralel dengan worker Gateway terisolasi secara default, hingga 64 worker atau sebanyak jumlah skenario yang dipilih. Gunakan `--concurrency <count>` untuk menyesuaikan jumlah worker, atau `--concurrency 1` untuk eksekusi serial.
Eksekusi live meneruskan input auth QA yang didukung dan praktis untuk guest: key provider berbasis env, path konfigurasi provider live QA, dan `CODEX_HOME` jika ada. Pertahankan `--output-dir` di bawah root repo agar guest dapat menulis kembali melalui workspace yang di-mount.

## Seed berbasis repo

Aset seed berada di `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Ini sengaja disimpan di git agar rencana QA terlihat baik oleh manusia maupun agen.

`qa-lab` harus tetap menjadi runner markdown generik. Setiap file markdown skenario adalah sumber kebenaran untuk satu eksekusi pengujian dan harus mendefinisikan:

- metadata skenario
- metadata kategori, capability, lane, dan risk opsional
- referensi docs dan code
- persyaratan Plugin opsional
- patch konfigurasi Gateway opsional
- `qa-flow` yang dapat dieksekusi

Permukaan runtime yang dapat digunakan ulang dan mendukung `qa-flow` boleh tetap generik dan lintas area. Misalnya, skenario markdown dapat menggabungkan helper sisi transport dengan helper sisi browser yang mengendalikan Control UI tersemat melalui seam Gateway `browser.request` tanpa menambahkan runner kasus khusus.

File skenario harus dikelompokkan berdasarkan capability produk, bukan folder pohon sumber. Pertahankan ID skenario tetap stabil saat file dipindahkan; gunakan `docsRefs` dan `codeRefs` untuk keterlacakan implementasi.

Daftar baseline harus tetap cukup luas untuk mencakup:

- chat DM dan channel
- perilaku thread
- siklus hidup aksi pesan
- callback Cron
- penarikan memori
- perpindahan model
- handoff subagen
- membaca repo dan docs
- satu tugas build kecil seperti Lobster Invaders

## Lane mock provider

`qa suite` memiliki dua lane mock provider lokal:

- `mock-openai` adalah mock OpenClaw yang sadar skenario. Ini tetap menjadi lane mock deterministik default untuk QA berbasis repo dan gate paritas.
- `aimock` memulai server provider berbasis AIMock untuk cakupan protokol, fixture, record/replay, dan chaos yang eksperimental. Ini bersifat tambahan dan tidak menggantikan dispatcher skenario `mock-openai`.

Implementasi lane provider berada di `extensions/qa-lab/src/providers/`.
Setiap provider memiliki default, startup server lokal, konfigurasi model Gateway, kebutuhan staging auth-profile, dan flag capability live/mock masing-masing. Kode suite dan gateway bersama harus merutekan melalui registry provider alih-alih bercabang berdasarkan nama provider.

## Adapter transport

`qa-lab` memiliki seam transport generik untuk skenario QA markdown.
`qa-channel` adalah adapter pertama pada seam itu, tetapi target desainnya lebih luas:
channel nyata atau sintetis di masa mendatang harus dapat dipasang ke runner suite yang sama alih-alih menambahkan runner QA khusus transport.

Pada tingkat arsitektur, pembagiannya adalah:

- `qa-lab` memiliki eksekusi skenario generik, konkurensi worker, penulisan artefak, dan pelaporan.
- adapter transport memiliki konfigurasi Gateway, kesiapan, observasi inbound dan outbound, aksi transport, dan status transport yang dinormalisasi.
- file skenario markdown di bawah `qa/scenarios/` mendefinisikan eksekusi pengujian; `qa-lab` menyediakan permukaan runtime yang dapat digunakan ulang yang mengeksekusinya.

Panduan adopsi untuk maintainer terkait adapter channel baru tersedia di
[Testing](/id/help/testing#adding-a-channel-to-qa).

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari timeline bus yang diamati.
Laporan tersebut harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

Untuk pemeriksaan karakter dan gaya, jalankan skenario yang sama di beberapa ref model live dan tulis laporan Markdown yang dinilai:

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

Perintah tersebut menjalankan child process gateway QA lokal, bukan Docker. Skenario evaluasi karakter harus menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa seperti chat, bantuan workspace, dan tugas file kecil. Model kandidat tidak boleh diberi tahu bahwa model itu sedang dievaluasi. Perintah ini mempertahankan setiap transkrip lengkap, mencatat statistik dasar eksekusi, lalu meminta model juri dalam mode cepat dengan penalaran `xhigh` untuk memberi peringkat eksekusi berdasarkan naturalness, vibe, dan humor.
Gunakan `--blind-judge-models` saat membandingkan provider: prompt juri tetap mendapatkan setiap transkrip dan status eksekusi, tetapi ref kandidat diganti dengan label netral seperti `candidate-01`; laporan memetakan peringkat kembali ke ref nyata setelah parsing.
Eksekusi kandidat default menggunakan thinking `high`, dengan `xhigh` untuk model OpenAI yang mendukungnya. Override kandidat tertentu secara inline dengan
`--model provider/model,thinking=<level>`. `--thinking <level>` tetap menetapkan fallback global, dan bentuk lama `--model-thinking <provider/model=level>` dipertahankan untuk kompatibilitas.
Ref kandidat OpenAI default ke mode cepat sehingga pemrosesan prioritas digunakan saat provider mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline saat satu kandidat atau juri memerlukan override. Berikan `--fast` hanya jika Anda ingin memaksa mode cepat aktif untuk setiap model kandidat. Durasi kandidat dan juri dicatat dalam laporan untuk analisis benchmark, tetapi prompt juri secara eksplisit mengatakan untuk tidak memberi peringkat berdasarkan kecepatan.
Eksekusi model kandidat dan juri sama-sama default ke konkurensi 16. Turunkan
`--concurrency` atau `--judge-concurrency` saat batas provider atau tekanan gateway lokal membuat eksekusi terlalu bising.
Saat tidak ada kandidat `--model` yang diberikan, evaluasi karakter akan default ke
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` saat tidak ada `--model` yang diberikan.
Saat tidak ada `--judge-model` yang diberikan, juri akan default ke
`openai/gpt-5.4,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-6,thinking=high`.

## Dokumen terkait

- [Testing](/id/help/testing)
- [QA Channel](/id/channels/qa-channel)
- [Dashboard](/web/dashboard)
