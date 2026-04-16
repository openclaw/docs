---
read_when:
    - Memperluas qa-lab atau qa-channel
    - Menambahkan skenario QA yang didukung repo
    - Membangun otomatisasi QA dengan realisme lebih tinggi di sekitar dasbor Gateway
summary: Bentuk otomatisasi QA privat untuk qa-lab, qa-channel, skenario yang di-seed, dan laporan protokol
title: Otomatisasi QA E2E
x-i18n:
    generated_at: "2026-04-16T21:51:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7deefda1c90a0d2e21e2155ffd8b585fb999e7416bdbaf0ff57eb33ccc063afc
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Otomatisasi QA E2E

Stack QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis dan berbentuk saluran dibandingkan yang bisa dilakukan oleh satu unit test.

Bagian yang ada saat ini:

- `extensions/qa-channel`: saluran pesan sintetis dengan permukaan DM, saluran, thread, reaksi, edit, dan hapus.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip, menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `qa/`: aset seed yang didukung repo untuk tugas kickoff dan skenario QA dasar.

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dasbor Gateway (Control UI) dengan agen.
- Kanan: QA Lab, menampilkan transkrip bergaya Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Itu membangun situs QA, memulai lane gateway berbasis Docker, dan mengekspos halaman QA Lab tempat operator atau loop otomatisasi dapat memberi agen misi QA, mengamati perilaku saluran nyata, dan mencatat apa yang berhasil, gagal, atau tetap terblokir.

Untuk iterasi UI QA Lab yang lebih cepat tanpa membangun ulang image Docker setiap kali, mulai stack dengan bundle QA Lab yang di-bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mempertahankan layanan Docker pada image yang sudah dibangun sebelumnya dan melakukan bind-mount `extensions/qa-lab/web/dist` ke dalam container `qa-lab`. `qa:lab:watch` membangun ulang bundle tersebut saat ada perubahan, dan browser akan memuat ulang otomatis ketika hash aset QA Lab berubah.

Untuk lane smoke Matrix dengan transport nyata, jalankan:

```bash
pnpm openclaw qa matrix
```

Lane itu menyediakan homeserver Tuwunel sekali pakai di Docker, mendaftarkan pengguna driver, SUT, dan observer sementara, membuat satu room privat, lalu menjalankan Plugin Matrix nyata di dalam child gateway QA. Lane transport langsung menjaga config child tetap dibatasi pada transport yang sedang diuji, sehingga Matrix berjalan tanpa `qa-channel` di config child. Lane ini menulis artefak laporan terstruktur dan log gabungan stdout/stderr ke direktori output Matrix QA yang dipilih. Untuk juga menangkap output build/launcher luar `scripts/run-node.mjs`, set `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` ke file log lokal repo.

Untuk lane smoke Telegram dengan transport nyata, jalankan:

```bash
pnpm openclaw qa telegram
```

Lane itu menargetkan satu grup Telegram privat nyata alih-alih menyediakan server sekali pakai. Lane ini memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, plus dua bot yang berbeda dalam grup privat yang sama. Bot SUT harus memiliki username Telegram, dan observasi bot-ke-bot bekerja paling baik ketika kedua bot mengaktifkan Bot-to-Bot Communication Mode di `@BotFather`.

Lane transport langsung sekarang berbagi satu kontrak yang lebih kecil alih-alih masing-masing membuat bentuk daftar skenario sendiri.

`qa-channel` tetap menjadi suite perilaku produk sintetis yang luas dan bukan bagian dari matriks cakupan transport langsung.

| Lane     | Canary | Pembatasan mention | Blok allowlist | Balasan tingkat atas | Lanjut setelah restart | Tindak lanjut thread | Isolasi thread | Observasi reaksi | Perintah bantuan |
| -------- | ------ | ------------------ | -------------- | -------------------- | ---------------------- | -------------------- | -------------- | ---------------- | ---------------- |
| Matrix   | x      | x                  | x              | x                    | x                      | x                    | x              | x                |                  |
| Telegram | x      |                    |                |                      |                        |                      |                |                  | x                |

Ini menjaga `qa-channel` tetap sebagai suite perilaku produk yang luas sementara Matrix, Telegram, dan transport langsung di masa depan berbagi satu daftar periksa kontrak transport yang eksplisit.

Untuk lane VM Linux sekali pakai tanpa membawa Docker ke jalur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Ini mem-boot guest Multipass baru, memasang dependensi, membangun OpenClaw di dalam guest, menjalankan `qa suite`, lalu menyalin laporan dan ringkasan QA normal kembali ke `.artifacts/qa-e2e/...` di host.
Ini menggunakan kembali perilaku pemilihan skenario yang sama seperti `qa suite` di host.
Eksekusi suite di host dan Multipass menjalankan beberapa skenario terpilih secara paralel dengan worker gateway terisolasi secara default, hingga 64 worker atau sebanyak jumlah skenario yang dipilih. Gunakan `--concurrency <count>` untuk menyesuaikan jumlah worker, atau `--concurrency 1` untuk eksekusi serial.
Eksekusi langsung meneruskan input auth QA yang didukung dan praktis untuk guest: key provider berbasis env, path config provider langsung QA, dan `CODEX_HOME` jika ada. Pastikan `--output-dir` tetap di bawah root repo agar guest dapat menulis balik melalui workspace yang di-mount.

## Seed yang didukung repo

Aset seed berada di `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

Ini sengaja disimpan di git agar rencana QA terlihat oleh manusia maupun agen.

`qa-lab` harus tetap menjadi runner markdown generik. Setiap file markdown skenario adalah sumber kebenaran untuk satu eksekusi test dan harus mendefinisikan:

- metadata skenario
- referensi docs dan kode
- persyaratan Plugin opsional
- patch config gateway opsional
- `qa-flow` yang dapat dieksekusi

Permukaan runtime yang dapat digunakan kembali yang mendukung `qa-flow` boleh tetap generik dan lintas area. Misalnya, skenario markdown dapat menggabungkan helper sisi transport dengan helper sisi browser yang menggerakkan Control UI tertanam melalui seam Gateway `browser.request` tanpa menambahkan runner kasus khusus.

Daftar dasar harus tetap cukup luas untuk mencakup:

- chat DM dan saluran
- perilaku thread
- siklus hidup aksi pesan
- callback Cron
- recall memory
- penggantian model
- handoff subagen
- pembacaan repo dan pembacaan docs
- satu tugas build kecil seperti Lobster Invaders

## Adapter transport

`qa-lab` memiliki seam transport generik untuk skenario QA markdown.
`qa-channel` adalah adapter pertama pada seam tersebut, tetapi target desainnya lebih luas: saluran nyata atau sintetis di masa depan harus dapat dipasang ke suite runner yang sama alih-alih menambahkan runner QA khusus transport.

Pada tingkat arsitektur, pembagiannya adalah:

- `qa-lab` memiliki eksekusi skenario generik, konkurensi worker, penulisan artefak, dan pelaporan.
- adapter transport memiliki config gateway, kesiapan, observasi masuk dan keluar, aksi transport, dan status transport yang dinormalisasi.
- file skenario markdown di bawah `qa/scenarios/` mendefinisikan eksekusi test; `qa-lab` menyediakan permukaan runtime yang dapat digunakan kembali yang mengeksekusinya.

Panduan adopsi untuk maintainer bagi adapter saluran baru tersedia di [Testing](/id/help/testing#adding-a-channel-to-qa).

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari linimasa bus yang diamati.
Laporan tersebut harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

Untuk pemeriksaan karakter dan gaya, jalankan skenario yang sama pada beberapa ref model langsung dan tulis laporan Markdown yang dinilai:

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

Perintah ini menjalankan child process gateway QA lokal, bukan Docker. Skenario evaluasi karakter harus menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa seperti chat, bantuan workspace, dan tugas file kecil. Model kandidat tidak boleh diberi tahu bahwa model tersebut sedang dievaluasi. Perintah ini mempertahankan setiap transkrip lengkap, mencatat statistik dasar eksekusi, lalu meminta model judge dalam mode fast dengan penalaran `xhigh` untuk memberi peringkat pada hasil berdasarkan naturalitas, vibe, dan humor.
Gunakan `--blind-judge-models` saat membandingkan provider: prompt judge tetap menerima setiap transkrip dan status eksekusi, tetapi ref kandidat diganti dengan label netral seperti `candidate-01`; laporan kemudian memetakan peringkat kembali ke ref nyata setelah parsing.
Eksekusi kandidat secara default menggunakan thinking `high`, dengan `xhigh` untuk model OpenAI yang mendukungnya. Override kandidat tertentu secara inline dengan `--model provider/model,thinking=<level>`. `--thinking <level>` tetap menetapkan fallback global, dan bentuk lama `--model-thinking <provider/model=level>` tetap dipertahankan untuk kompatibilitas.
Ref kandidat OpenAI secara default menggunakan mode fast agar pemrosesan prioritas digunakan ketika provider mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline saat satu kandidat atau judge memerlukan override. Gunakan `--fast` hanya jika Anda ingin memaksa mode fast aktif untuk setiap model kandidat. Durasi kandidat dan judge dicatat dalam laporan untuk analisis benchmark, tetapi prompt judge secara eksplisit menyatakan untuk tidak memberi peringkat berdasarkan kecepatan.
Eksekusi model kandidat dan judge keduanya secara default menggunakan konkurensi 16. Turunkan `--concurrency` atau `--judge-concurrency` ketika batas provider atau tekanan gateway lokal membuat eksekusi menjadi terlalu berisik.
Saat tidak ada kandidat `--model` yang diberikan, evaluasi karakter secara default menggunakan
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` ketika tidak ada `--model` yang diberikan.
Saat tidak ada `--judge-model` yang diberikan, judge secara default menggunakan
`openai/gpt-5.4,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-6,thinking=high`.

## Docs terkait

- [Testing](/id/help/testing)
- [QA Channel](/id/channels/qa-channel)
- [Dashboard](/web/dashboard)
