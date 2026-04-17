---
read_when:
    - Memperluas qa-lab atau qa-channel
    - Menambahkan skenario QA yang didukung repo
    - Membangun otomasi QA dengan realisme lebih tinggi di sekitar dasbor Gateway
summary: Bentuk otomasi QA privat untuk qa-lab, qa-channel, skenario ber-seed, dan laporan protokol
title: Otomasi QA E2E
x-i18n:
    generated_at: "2026-04-17T09:14:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51f97293c184d7c04c95d9858305668fbc0f93273f587ec7e54896ad5d603ab0
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Otomasi QA E2E

Stack QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis dan berbentuk kanal dibandingkan yang bisa dicapai oleh satu unit test.

Komponen saat ini:

- `extensions/qa-channel`: kanal pesan sintetis dengan permukaan DM, channel, thread, reaction, edit, dan delete.
- `extensions/qa-lab`: UI debugger dan bus QA untuk mengamati transkrip, menyuntikkan pesan masuk, dan mengekspor laporan Markdown.
- `qa/`: aset seed yang didukung repo untuk tugas kickoff dan skenario QA baseline.

Alur operator QA saat ini adalah situs QA dua panel:

- Kiri: dasbor Gateway (Control UI) dengan agen.
- Kanan: QA Lab, menampilkan transkrip bergaya Slack dan rencana skenario.

Jalankan dengan:

```bash
pnpm qa:lab:up
```

Perintah itu membangun situs QA, memulai jalur Gateway berbasis Docker, dan mengekspos halaman QA Lab tempat operator atau loop otomasi dapat memberi agen misi QA, mengamati perilaku kanal nyata, dan mencatat apa yang berhasil, gagal, atau tetap terblokir.

Untuk iterasi UI QA Lab yang lebih cepat tanpa membangun ulang image Docker setiap kali, mulai stack dengan bundle QA Lab yang di-bind-mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` menjaga layanan Docker tetap berjalan pada image yang sudah dibangun sebelumnya dan melakukan bind-mount `extensions/qa-lab/web/dist` ke dalam container `qa-lab`. `qa:lab:watch` membangun ulang bundle tersebut saat ada perubahan, dan browser memuat ulang otomatis ketika hash aset QA Lab berubah.

Untuk jalur smoke Matrix dengan transport nyata, jalankan:

```bash
pnpm openclaw qa matrix
```

Jalur ini menyediakan homeserver Tuwunel sekali pakai di Docker, mendaftarkan pengguna driver, SUT, dan observer sementara, membuat satu room privat, lalu menjalankan plugin Matrix asli di dalam child Gateway QA. Jalur transport langsung menjaga konfigurasi child tetap dibatasi pada transport yang diuji, sehingga Matrix berjalan tanpa `qa-channel` di konfigurasi child. Jalur ini menulis artefak laporan terstruktur dan log gabungan stdout/stderr ke direktori output Matrix QA yang dipilih. Untuk juga menangkap output build/launcher luar `scripts/run-node.mjs`, setel `OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` ke file log lokal repo.

Untuk jalur smoke Telegram dengan transport nyata, jalankan:

```bash
pnpm openclaw qa telegram
```

Jalur ini menargetkan satu grup Telegram privat nyata alih-alih menyediakan server sekali pakai. Jalur ini memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, serta dua bot berbeda di grup privat yang sama. Bot SUT harus memiliki username Telegram, dan observasi bot-ke-bot bekerja paling baik ketika kedua bot mengaktifkan Bot-to-Bot Communication Mode di `@BotFather`.

Jalur transport langsung kini berbagi satu kontrak yang lebih kecil alih-alih masing-masing membuat bentuk daftar skenario sendiri.

`qa-channel` tetap menjadi suite luas untuk perilaku produk sintetis dan bukan bagian dari matriks cakupan transport langsung.

| Jalur    | Canary | Penyaringan mention | Blok allowlist | Balasan tingkat atas | Lanjut setelah restart | Tindak lanjut thread | Isolasi thread | Observasi reaction | Perintah help |
| -------- | ------ | ------------------- | -------------- | -------------------- | ---------------------- | -------------------- | -------------- | ------------------ | ------------- |
| Matrix   | x      | x                   | x              | x                    | x                      | x                    | x              | x                  |               |
| Telegram | x      |                     |                |                      |                        |                      |                |                    | x             |

Ini menjaga `qa-channel` sebagai suite luas untuk perilaku produk sementara Matrix, Telegram, dan transport langsung mendatang berbagi satu checklist kontrak transport yang eksplisit.

Untuk jalur VM Linux sekali pakai tanpa membawa Docker ke jalur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Perintah ini menyalakan guest Multipass baru, menginstal dependensi, membangun OpenClaw di dalam guest, menjalankan `qa suite`, lalu menyalin laporan QA normal dan ringkasannya kembali ke `.artifacts/qa-e2e/...` di host.
Perintah ini menggunakan ulang perilaku pemilihan skenario yang sama seperti `qa suite` di host.
Eksekusi suite di host dan Multipass menjalankan beberapa skenario terpilih secara paralel dengan worker Gateway terisolasi secara default, hingga 64 worker atau sebanyak jumlah skenario yang dipilih. Gunakan `--concurrency <count>` untuk menyesuaikan jumlah worker, atau `--concurrency 1` untuk eksekusi serial.
Eksekusi langsung meneruskan input auth QA yang didukung dan praktis untuk guest: key provider berbasis env, path konfigurasi provider langsung QA, dan `CODEX_HOME` jika ada. Pastikan `--output-dir` tetap berada di bawah root repo agar guest dapat menulis kembali melalui workspace yang di-mount.

## Seed yang didukung repo

Aset seed berada di `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/*.md`

File-file ini sengaja disimpan di git agar rencana QA terlihat baik oleh manusia maupun agen.

`qa-lab` harus tetap menjadi runner markdown generik. Setiap file markdown skenario adalah sumber kebenaran untuk satu eksekusi pengujian dan harus mendefinisikan:

- metadata skenario
- referensi docs dan kode
- persyaratan plugin opsional
- patch konfigurasi Gateway opsional
- `qa-flow` yang dapat dieksekusi

Permukaan runtime yang dapat digunakan ulang dan mendukung `qa-flow` diizinkan untuk tetap generik dan lintas potongan. Misalnya, skenario markdown dapat menggabungkan helper sisi transport dengan helper sisi browser yang menggerakkan Control UI tertanam melalui seam Gateway `browser.request` tanpa menambahkan runner kasus khusus.

Daftar baseline harus tetap cukup luas untuk mencakup:

- chat DM dan channel
- perilaku thread
- siklus hidup aksi pesan
- callback Cron
- penarikan kembali memory
- perpindahan model
- handoff subagen
- pembacaan repo dan docs
- satu tugas build kecil seperti Lobster Invaders

## Jalur mock provider

`qa suite` memiliki dua jalur mock provider lokal:

- `mock-openai` adalah mock OpenClaw yang sadar skenario. Ini tetap menjadi jalur mock deterministis default untuk QA yang didukung repo dan gate paritas.
- `aimock` memulai server provider berbasis AIMock untuk cakupan protokol, fixture, record/replay, dan chaos yang bersifat eksperimental. Ini bersifat tambahan dan tidak menggantikan dispatcher skenario `mock-openai`.

Implementasi jalur provider berada di bawah `extensions/qa-lab/src/providers/`.
Setiap provider memiliki default, startup server lokal, konfigurasi model Gateway, kebutuhan staging auth-profile, serta flag kemampuan live/mock miliknya sendiri. Suite bersama dan kode Gateway harus merutekan melalui registry provider alih-alih bercabang berdasarkan nama provider.

## Adaptor transport

`qa-lab` memiliki seam transport generik untuk skenario QA markdown.
`qa-channel` adalah adaptor pertama pada seam itu, tetapi target desainnya lebih luas:
kanal nyata atau sintetis di masa depan harus dapat dihubungkan ke runner suite yang sama alih-alih menambahkan runner QA khusus transport.

Pada tingkat arsitektur, pembagiannya adalah:

- `qa-lab` memiliki eksekusi skenario generik, konkurensi worker, penulisan artefak, dan pelaporan.
- adaptor transport memiliki konfigurasi Gateway, kesiapan, observasi masuk dan keluar, aksi transport, dan status transport yang dinormalisasi.
- file skenario markdown di bawah `qa/scenarios/` mendefinisikan eksekusi pengujian; `qa-lab` menyediakan permukaan runtime yang dapat digunakan ulang untuk menjalankannya.

Panduan adopsi untuk maintainer yang berhadapan dengan adaptor kanal baru tersedia di
[Testing](/id/help/testing#adding-a-channel-to-qa).

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari timeline bus yang diamati.
Laporan tersebut harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

Untuk pemeriksaan karakter dan gaya, jalankan skenario yang sama di beberapa ref model langsung dan tulis laporan Markdown yang dinilai:

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

Perintah ini menjalankan child process Gateway QA lokal, bukan Docker. Skenario evaluasi karakter harus menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa seperti chat, bantuan workspace, dan tugas file kecil. Model kandidat tidak boleh diberi tahu bahwa model tersebut sedang dievaluasi. Perintah ini mempertahankan setiap transkrip lengkap, mencatat statistik dasar eksekusi, lalu meminta model judge dalam mode fast dengan penalaran `xhigh` untuk memberi peringkat pada eksekusi berdasarkan naturalness, vibe, dan humor.
Gunakan `--blind-judge-models` saat membandingkan provider: prompt judge tetap menerima setiap transkrip dan status eksekusi, tetapi ref kandidat diganti dengan label netral seperti `candidate-01`; laporan memetakan kembali peringkat ke ref asli setelah parsing.
Eksekusi kandidat secara default menggunakan thinking `high`, dengan `xhigh` untuk model OpenAI yang mendukungnya. Override kandidat tertentu secara inline dengan
`--model provider/model,thinking=<level>`. `--thinking <level>` tetap menetapkan fallback global, dan format lama `--model-thinking <provider/model=level>` dipertahankan demi kompatibilitas.
Ref kandidat OpenAI secara default menggunakan mode fast sehingga pemrosesan prioritas digunakan di tempat provider mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline ketika satu kandidat atau judge memerlukan override. Berikan `--fast` hanya ketika Anda ingin memaksa mode fast aktif untuk setiap model kandidat. Durasi kandidat dan judge dicatat di laporan untuk analisis benchmark, tetapi prompt judge secara eksplisit menyatakan agar tidak memberi peringkat berdasarkan kecepatan.
Eksekusi model kandidat dan judge keduanya menggunakan konkurensi default 16. Turunkan
`--concurrency` atau `--judge-concurrency` ketika batas provider atau tekanan Gateway lokal membuat eksekusi terlalu bising.
Jika tidak ada kandidat `--model` yang diberikan, evaluasi karakter secara default menggunakan
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` ketika tidak ada `--model` yang diberikan.
Jika tidak ada `--judge-model` yang diberikan, judge defaultnya adalah
`openai/gpt-5.4,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-6,thinking=high`.

## Docs terkait

- [Testing](/id/help/testing)
- [QA Channel](/id/channels/qa-channel)
- [Dashboard](/web/dashboard)
