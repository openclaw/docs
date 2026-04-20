---
read_when:
    - Memperluas qa-lab atau qa-channel
    - Menambahkan skenario QA yang didukung repo
    - Membangun otomasi QA dengan realisme lebih tinggi di sekitar dasbor Gateway
summary: Bentuk otomasi QA privat untuk qa-lab, qa-channel, skenario yang di-seed, dan laporan protokol
title: Otomasi E2E QA
x-i18n:
    generated_at: "2026-04-20T09:27:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34245ce871356caeab0d9e0eeeaa9fb4e408920a4a97ad27567fa365d8db17c7
    source_path: concepts/qa-e2e-automation.md
    workflow: 15
---

# Otomasi E2E QA

Stack QA privat dimaksudkan untuk menguji OpenClaw dengan cara yang lebih realistis,
berbentuk kanal, dibandingkan yang bisa dilakukan oleh satu unit test.

Komponen saat ini:

- `extensions/qa-channel`: kanal pesan sintetis dengan permukaan DM, kanal, thread,
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

Perintah itu membangun situs QA, memulai lane gateway berbasis Docker, dan membuka
halaman QA Lab tempat operator atau loop otomasi dapat memberi agen
misi QA, mengamati perilaku kanal nyata, dan mencatat apa yang berhasil, gagal, atau
tetap terblokir.

Untuk iterasi UI QA Lab yang lebih cepat tanpa membangun ulang image Docker setiap kali,
mulai stack dengan bundle QA Lab yang di-bind-mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` menjaga layanan Docker tetap berjalan pada image yang sudah dibangun dan melakukan bind-mount
`extensions/qa-lab/web/dist` ke dalam container `qa-lab`. `qa:lab:watch`
membangun ulang bundle tersebut saat ada perubahan, dan browser akan memuat ulang otomatis ketika hash aset QA Lab berubah.

Untuk lane smoke Matrix dengan transport nyata, jalankan:

```bash
pnpm openclaw qa matrix
```

Lane itu memprovisikan homeserver Tuwunel sekali pakai di Docker, mendaftarkan
pengguna driver, SUT, dan observer sementara, membuat satu room privat, lalu menjalankan
Plugin Matrix nyata di dalam child gateway QA. Lane transport live menjaga config child
tetap terbatas pada transport yang sedang diuji, sehingga Matrix berjalan tanpa
`qa-channel` di config child. Lane ini menulis artefak laporan terstruktur dan
log gabungan stdout/stderr ke direktori output Matrix QA yang dipilih. Untuk
menangkap output build/launcher luar `scripts/run-node.mjs` juga, set
`OPENCLAW_RUN_NODE_OUTPUT_LOG=<path>` ke file log lokal repo.

Untuk lane smoke Telegram dengan transport nyata, jalankan:

```bash
pnpm openclaw qa telegram
```

Lane itu menargetkan satu grup Telegram privat nyata alih-alih memprovisikan server
sekali pakai. Lane ini memerlukan `OPENCLAW_QA_TELEGRAM_GROUP_ID`,
`OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`, dan
`OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`, ditambah dua bot berbeda di grup
privat yang sama. Bot SUT harus memiliki username Telegram, dan observasi bot-ke-bot
bekerja paling baik saat kedua bot mengaktifkan Bot-to-Bot Communication Mode
di `@BotFather`.
Perintah akan keluar dengan status non-zero ketika ada skenario yang gagal. Gunakan `--allow-failures` ketika
Anda menginginkan artefak tanpa exit code gagal.

Lane transport live sekarang berbagi satu kontrak yang lebih kecil alih-alih masing-masing
menciptakan bentuk daftar skenario sendiri:

`qa-channel` tetap menjadi suite perilaku produk sintetis yang luas dan tidak termasuk
dalam matriks cakupan transport live.

| Lane     | Canary | Penyaringan mention | Blok allowlist | Balasan tingkat atas | Lanjut setelah restart | Tindak lanjut thread | Isolasi thread | Observasi reaksi | Perintah help |
| -------- | ------ | ------------------- | -------------- | -------------------- | ---------------------- | -------------------- | -------------- | ---------------- | ------------- |
| Matrix   | x      | x                   | x              | x                    | x                      | x                    | x              | x                |               |
| Telegram | x      |                     |                |                      |                        |                      |                |                  | x             |

Ini menjaga `qa-channel` tetap sebagai suite perilaku produk yang luas sementara Matrix,
Telegram, dan transport live di masa depan berbagi satu daftar pemeriksaan kontrak transport yang eksplisit.

Untuk lane VM Linux sekali pakai tanpa membawa Docker ke dalam jalur QA, jalankan:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Ini mem-boot guest Multipass baru, menginstal dependensi, membangun OpenClaw
di dalam guest, menjalankan `qa suite`, lalu menyalin kembali laporan dan
ringkasan QA normal ke `.artifacts/qa-e2e/...` di host.
Perintah ini menggunakan kembali perilaku pemilihan skenario yang sama seperti `qa suite` di host.
Eksekusi suite host dan Multipass menjalankan beberapa skenario terpilih secara paralel
dengan worker gateway terisolasi secara default. `qa-channel` default ke concurrency
4, dibatasi oleh jumlah skenario yang dipilih. Gunakan `--concurrency <count>` untuk menyesuaikan
jumlah worker, atau `--concurrency 1` untuk eksekusi serial.
Perintah akan keluar dengan status non-zero ketika ada skenario yang gagal. Gunakan `--allow-failures` ketika
Anda menginginkan artefak tanpa exit code gagal.
Eksekusi live meneruskan input auth QA yang didukung dan praktis untuk
guest: key provider berbasis env, path config provider live QA, dan
`CODEX_HOME` bila ada. Pertahankan `--output-dir` di bawah root repo agar guest
dapat menulis kembali melalui workspace yang di-mount.

## Seed yang didukung repo

Aset seed berada di `qa/`:

- `qa/scenarios/index.md`
- `qa/scenarios/<theme>/*.md`

Ini sengaja disimpan di git agar rencana QA terlihat oleh manusia maupun
agen.

`qa-lab` harus tetap menjadi runner markdown generik. Setiap file markdown skenario adalah
sumber kebenaran untuk satu eksekusi pengujian dan harus mendefinisikan:

- metadata skenario
- metadata kategori, kapabilitas, lane, dan risiko opsional
- referensi docs dan kode
- persyaratan Plugin opsional
- patch config gateway opsional
- `qa-flow` yang dapat dieksekusi

Permukaan runtime yang dapat digunakan ulang yang mendukung `qa-flow` boleh tetap generik
dan lintas bidang. Sebagai contoh, skenario markdown dapat menggabungkan helper sisi transport
dengan helper sisi browser yang menggerakkan Control UI tersemat melalui
seam Gateway `browser.request` tanpa menambahkan runner kasus khusus.

File skenario harus dikelompokkan berdasarkan kapabilitas produk, bukan folder
pohon sumber. Jaga ID skenario tetap stabil saat file dipindahkan; gunakan `docsRefs` dan `codeRefs`
untuk keterlacakan implementasi.

Daftar dasar harus tetap cukup luas untuk mencakup:

- DM dan chat kanal
- perilaku thread
- siklus hidup aksi pesan
- callback Cron
- pemanggilan kembali memori
- pergantian model
- handoff subagen
- pembacaan repo dan pembacaan docs
- satu tugas build kecil seperti Lobster Invaders

## Lane mock provider

`qa suite` memiliki dua lane mock provider lokal:

- `mock-openai` adalah mock OpenClaw yang sadar skenario. Ini tetap menjadi
  lane mock deterministik default untuk QA yang didukung repo dan gate paritas.
- `aimock` memulai server provider berbasis AIMock untuk cakupan protokol,
  fixture, record/replay, dan chaos eksperimental. Ini bersifat tambahan dan tidak menggantikan dispatcher skenario `mock-openai`.

Implementasi lane provider berada di `extensions/qa-lab/src/providers/`.
Setiap provider memiliki default, startup server lokal, config model gateway,
kebutuhan staging auth-profile, dan flag kapabilitas live/mock sendiri. Kode suite dan gateway
bersama harus merutekan melalui registry provider alih-alih bercabang berdasarkan
nama provider.

## Adaptor transport

`qa-lab` memiliki seam transport generik untuk skenario QA markdown.
`qa-channel` adalah adaptor pertama pada seam tersebut, tetapi target desainnya lebih luas:
kanal nyata atau sintetis di masa depan harus dapat dipasang ke runner suite yang sama
alih-alih menambahkan runner QA khusus transport.

Pada tingkat arsitektur, pembagiannya adalah:

- `qa-lab` memiliki eksekusi skenario generik, concurrency worker, penulisan artefak, dan pelaporan.
- adaptor transport memiliki config gateway, kesiapan, observasi masuk dan keluar, aksi transport, dan state transport yang dinormalisasi.
- file skenario markdown di bawah `qa/scenarios/` mendefinisikan eksekusi pengujian; `qa-lab` menyediakan permukaan runtime yang dapat digunakan ulang untuk mengeksekusinya.

Panduan adopsi untuk adaptor kanal baru yang ditujukan bagi maintainer berada di
[Testing](/id/help/testing#adding-a-channel-to-qa).

## Pelaporan

`qa-lab` mengekspor laporan protokol Markdown dari timeline bus yang diamati.
Laporan tersebut harus menjawab:

- Apa yang berhasil
- Apa yang gagal
- Apa yang tetap terblokir
- Skenario tindak lanjut apa yang layak ditambahkan

Untuk pemeriksaan karakter dan gaya, jalankan skenario yang sama di beberapa ref model live
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

Perintah ini menjalankan proses child gateway QA lokal, bukan Docker. Skenario evaluasi karakter
harus menetapkan persona melalui `SOUL.md`, lalu menjalankan giliran pengguna biasa
seperti chat, bantuan workspace, dan tugas file kecil. Model kandidat
tidak boleh diberi tahu bahwa model tersebut sedang dievaluasi. Perintah ini mempertahankan setiap
transkrip lengkap, mencatat statistik dasar eksekusi, lalu meminta model penilai dalam mode fast dengan
penalaran `xhigh` untuk memberi peringkat eksekusi berdasarkan kealamian, vibe, dan humor.
Gunakan `--blind-judge-models` saat membandingkan provider:
prompt penilai tetap mendapatkan setiap transkrip dan status eksekusi, tetapi ref kandidat diganti
dengan label netral seperti `candidate-01`; laporan memetakan kembali peringkat ke ref nyata setelah
parsing.
Eksekusi kandidat default ke thinking `high`, dengan `xhigh` untuk model OpenAI yang
mendukungnya. Override kandidat tertentu secara inline dengan
`--model provider/model,thinking=<level>`. `--thinking <level>` tetap menetapkan
fallback global, dan bentuk lama `--model-thinking <provider/model=level>` tetap
dipertahankan untuk kompatibilitas.
Ref kandidat OpenAI default ke mode fast sehingga pemrosesan prioritas digunakan jika
provider mendukungnya. Tambahkan `,fast`, `,no-fast`, atau `,fast=false` secara inline ketika satu
kandidat atau penilai memerlukan override. Berikan `--fast` hanya jika Anda ingin
memaksa mode fast aktif untuk setiap model kandidat. Durasi kandidat dan penilai
dicatat dalam laporan untuk analisis benchmark, tetapi prompt penilai secara eksplisit mengatakan
untuk tidak memberi peringkat berdasarkan kecepatan.
Eksekusi model kandidat dan penilai keduanya default ke concurrency 16. Turunkan
`--concurrency` atau `--judge-concurrency` saat batas provider atau tekanan gateway lokal
membuat eksekusi terlalu bising.
Saat tidak ada kandidat `--model` yang diberikan, evaluasi karakter akan default ke
`openai/gpt-5.4`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-6`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5`, dan
`google/gemini-3.1-pro-preview` saat tidak ada `--model` yang diberikan.
Saat tidak ada `--judge-model` yang diberikan, penilai akan default ke
`openai/gpt-5.4,thinking=xhigh,fast` dan
`anthropic/claude-opus-4-6,thinking=high`.

## Docs terkait

- [Testing](/id/help/testing)
- [QA Channel](/id/channels/qa-channel)
- [Dasbor](/web/dashboard)
