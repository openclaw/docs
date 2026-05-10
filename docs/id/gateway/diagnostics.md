---
read_when:
    - Menyiapkan laporan bug atau permintaan dukungan
    - Memecahkan masalah kegagalan Gateway, mulai ulang, tekanan memori, atau muatan berukuran terlalu besar
    - Meninjau data diagnostik mana yang dicatat atau disamarkan
summary: Buat bundel diagnostik Gateway yang dapat dibagikan untuk laporan bug
title: Ekspor diagnostik
x-i18n:
    generated_at: "2026-05-10T19:35:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6df695c590fd8239226e2e4d4e266a7b705f3963f00a005be38c526b1f28afb
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw dapat membuat zip diagnostik lokal untuk laporan bug. Zip ini menggabungkan
status Gateway yang disanitasi, kesehatan, log, bentuk konfigurasi, dan peristiwa
stabilitas terbaru yang bebas payload.

Perlakukan bundel diagnostik seperti rahasia sampai Anda meninjaunya. Bundel ini
dirancang untuk menghilangkan atau meredaksi payload dan kredensial, tetapi tetap
merangkum log Gateway lokal dan status runtime tingkat host.

## Mulai cepat

```bash
openclaw gateway diagnostics export
```

Perintah ini mencetak jalur zip yang ditulis. Untuk memilih jalur:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Untuk otomasi:

```bash
openclaw gateway diagnostics export --json
```

## Perintah chat

Pemilik dapat menggunakan `/diagnostics [note]` di chat untuk meminta ekspor Gateway lokal.
Gunakan ini ketika bug terjadi dalam percakapan nyata dan Anda menginginkan satu
laporan yang dapat disalin-tempel untuk dukungan:

1. Kirim `/diagnostics` dalam percakapan tempat Anda melihat masalahnya. Tambahkan
   catatan singkat jika membantu, misalnya `/diagnostics bad tool choice`.
2. OpenClaw mengirim pembuka diagnostik dan meminta satu persetujuan exec eksplisit.
   Persetujuan menjalankan `openclaw gateway diagnostics export --json`.
   Jangan setujui diagnostik melalui aturan izinkan-semua.
3. Setelah disetujui, OpenClaw membalas dengan laporan yang dapat ditempel berisi jalur
   bundel lokal, ringkasan manifes, catatan privasi, dan ID sesi yang relevan.

Dalam chat grup, pemilik tetap dapat menjalankan `/diagnostics`, tetapi OpenClaw tidak
memposting detail diagnostik kembali ke chat bersama. OpenClaw mengirim pembuka,
prompt persetujuan, hasil ekspor Gateway, dan rincian sesi/thread Codex kepada
pemilik melalui rute persetujuan privat. Grup hanya mendapatkan pemberitahuan singkat
bahwa alur diagnostik dikirim secara privat. Jika OpenClaw tidak dapat menemukan rute
pemilik privat, perintah gagal tertutup dan meminta pemilik menjalankannya dari DM.

Ketika sesi OpenClaw aktif menggunakan harness OpenAI Codex native,
persetujuan exec yang sama juga mencakup unggahan umpan balik OpenAI untuk thread
runtime Codex yang diketahui OpenClaw. Unggahan itu terpisah dari zip Gateway lokal
dan hanya muncul untuk sesi harness Codex. Sebelum persetujuan, prompt menjelaskan
bahwa menyetujui diagnostik juga akan mengirim umpan balik Codex, tetapi tidak
mencantumkan ID sesi atau thread Codex. Setelah disetujui, balasan chat mencantumkan
channel, ID sesi OpenClaw, ID thread Codex, dan perintah resume lokal untuk thread
yang dikirim ke server OpenAI. Jika Anda menolak atau mengabaikan persetujuan,
OpenClaw tidak menjalankan ekspor, tidak mengirim umpan balik Codex, dan tidak
mencetak ID Codex.

Itu membuat loop debugging Codex umum menjadi singkat: lihat perilaku buruk di
Telegram, Discord, atau channel lain, jalankan `/diagnostics`, setujui sekali, bagikan
laporan dengan dukungan, lalu jalankan perintah `codex resume <thread-id>` yang dicetak
secara lokal jika Anda ingin memeriksa sendiri thread Codex native. Lihat
[harness Codex](/id/plugins/codex-harness#inspect-codex-threads-locally) untuk
alur kerja pemeriksaan tersebut.

## Isi ekspor

Zip mencakup:

- `summary.md`: ikhtisar yang mudah dibaca manusia untuk dukungan.
- `diagnostics.json`: ringkasan konfigurasi, log, status, kesehatan,
  dan data stabilitas yang dapat dibaca mesin.
- `manifest.json`: metadata ekspor dan daftar file.
- Bentuk konfigurasi yang disanitasi dan detail konfigurasi non-rahasia.
- Ringkasan log yang disanitasi dan baris log terbaru yang direduksi.
- Snapshot status dan kesehatan Gateway dengan upaya terbaik.
- `stability/latest.json`: bundel stabilitas tersimpan terbaru, jika tersedia.

Ekspor tetap berguna bahkan ketika Gateway tidak sehat. Jika Gateway tidak dapat
menjawab permintaan status atau kesehatan, log lokal, bentuk konfigurasi, dan
bundel stabilitas terbaru tetap dikumpulkan jika tersedia.

## Model privasi

Diagnostik dirancang agar dapat dibagikan. Ekspor mempertahankan data operasional
yang membantu debugging, seperti:

- nama subsistem, ID Plugin, ID penyedia, ID channel, dan mode yang dikonfigurasi
- kode status, durasi, jumlah byte, status antrean, dan pembacaan memori
- metadata log yang disanitasi dan pesan operasional yang direduksi
- bentuk konfigurasi dan pengaturan fitur non-rahasia

Ekspor menghilangkan atau meredaksi:

- teks chat, prompt, instruksi, isi webhook, dan keluaran alat
- kredensial, kunci API, token, cookie, dan nilai rahasia
- isi permintaan atau respons mentah
- ID akun, ID pesan, ID sesi mentah, hostname, dan nama pengguna lokal

Ketika pesan log terlihat seperti teks payload pengguna, chat, prompt, atau alat,
ekspor hanya menyimpan bahwa sebuah pesan dihilangkan dan jumlah byte-nya.

## Perekam stabilitas

Gateway merekam stream stabilitas terbatas dan bebas payload secara default ketika
diagnostik diaktifkan. Ini untuk fakta operasional, bukan konten.

Heartbeat diagnostik yang sama merekam sampel liveness ketika Gateway tetap
berjalan tetapi event loop Node.js atau CPU terlihat jenuh. Peristiwa
`diagnostic.liveness.warning` ini mencakup penundaan event-loop, utilisasi event-loop,
rasio core CPU, jumlah sesi aktif/menunggu/terantre, fase startup/runtime saat ini
jika diketahui, rentang fase terbaru, dan label kerja aktif/terantre yang terbatas.
Sampel idle tetap berada di telemetri pada level `info`. Sampel liveness menjadi
peringatan Gateway hanya ketika pekerjaan sedang menunggu atau terantre, atau ketika
pekerjaan aktif tumpang tindih dengan penundaan event-loop yang berkelanjutan.
Lonjakan max-delay sementara selama pekerjaan latar belakang yang tetap sehat
tetap berada di log debug. Lonjakan tersebut tidak memulai ulang Gateway dengan sendirinya.

Fase startup juga memancarkan peristiwa `diagnostic.phase.completed` dengan timing
wall-clock dan CPU. Diagnostik embedded-run yang macet menandai
`terminalProgressStale=true` ketika progres bridge terakhir terlihat terminal,
seperti item respons mentah atau peristiwa penyelesaian respons, tetapi Gateway
masih menganggap embedded run aktif.

Periksa perekam live:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Periksa bundel stabilitas tersimpan terbaru setelah fatal exit, timeout shutdown,
atau kegagalan startup restart:

```bash
openclaw gateway stability --bundle latest
```

Buat zip diagnostik dari bundel tersimpan terbaru:

```bash
openclaw gateway stability --bundle latest --export
```

Bundel tersimpan berada di bawah `~/.openclaw/logs/stability/` ketika ada peristiwa.

## Opsi berguna

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: tulis ke jalur zip tertentu.
- `--log-lines <count>`: jumlah maksimum baris log yang disanitasi untuk disertakan.
- `--log-bytes <bytes>`: byte log maksimum untuk diperiksa.
- `--url <url>`: URL WebSocket Gateway untuk snapshot status dan kesehatan.
- `--token <token>`: token Gateway untuk snapshot status dan kesehatan.
- `--password <password>`: kata sandi Gateway untuk snapshot status dan kesehatan.
- `--timeout <ms>`: timeout snapshot status dan kesehatan.
- `--no-stability-bundle`: lewati pencarian bundel stabilitas tersimpan.
- `--json`: cetak metadata ekspor yang dapat dibaca mesin.

## Nonaktifkan diagnostik

Diagnostik diaktifkan secara default. Untuk menonaktifkan perekam stabilitas dan
pengumpulan peristiwa diagnostik:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

Menonaktifkan diagnostik mengurangi detail laporan bug. Ini tidak memengaruhi
logging Gateway normal.

## Terkait

- [Pemeriksaan kesehatan](/id/gateway/health)
- [CLI Gateway](/id/cli/gateway#gateway-diagnostics-export)
- [Protokol Gateway](/id/gateway/protocol#system-and-identity)
- [Logging](/id/logging)
- [Ekspor OpenTelemetry](/id/gateway/opentelemetry) — alur terpisah untuk mengalirkan diagnostik ke kolektor
