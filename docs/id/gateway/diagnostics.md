---
read_when:
    - Menyiapkan laporan bug atau permintaan dukungan
    - Men-debug kegagalan, mulai ulang, tekanan memori, atau muatan yang terlalu besar pada Gateway
    - Meninjau data diagnostik apa yang dicatat atau disamarkan
summary: Buat bundel diagnostik Gateway yang dapat dibagikan untuk laporan bug
title: Ekspor diagnostik
x-i18n:
    generated_at: "2026-05-03T21:32:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6cf8e00fe8033e339b5c947ce3dd10fdee736048a358ad3a0c2ccb77e939f4b
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw dapat membuat zip diagnostik lokal untuk laporan bug. Zip ini menggabungkan
status Gateway yang sudah disanitasi, kesehatan, log, bentuk konfigurasi, dan
peristiwa stabilitas terbaru tanpa payload.

Perlakukan bundel diagnostik seperti rahasia sampai Anda meninjaunya. Bundel ini
dirancang untuk menghilangkan atau menyamarkan payload dan kredensial, tetapi
tetap merangkum log Gateway lokal dan status runtime tingkat host.

## Mulai cepat

```bash
openclaw gateway diagnostics export
```

Perintah ini mencetak path zip yang ditulis. Untuk memilih path:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Untuk otomatisasi:

```bash
openclaw gateway diagnostics export --json
```

## Perintah chat

Pemilik dapat menggunakan `/diagnostics [note]` di chat untuk meminta ekspor Gateway lokal.
Gunakan ini saat bug terjadi dalam percakapan nyata dan Anda menginginkan satu
laporan yang dapat disalin-tempel untuk dukungan:

1. Kirim `/diagnostics` dalam percakapan tempat Anda melihat masalah. Tambahkan
   catatan singkat jika membantu, misalnya `/diagnostics bad tool choice`.
2. OpenClaw mengirim pembuka diagnostik dan meminta satu persetujuan exec
   eksplisit. Persetujuan menjalankan `openclaw gateway diagnostics export --json`.
   Jangan setujui diagnostik melalui aturan izinkan-semua.
3. Setelah disetujui, OpenClaw membalas dengan laporan yang dapat ditempel berisi
   path bundel lokal, ringkasan manifes, catatan privasi, dan id sesi yang relevan.

Dalam chat grup, pemilik masih dapat menjalankan `/diagnostics`, tetapi OpenClaw tidak
memposting detail diagnostik kembali ke chat bersama. OpenClaw mengirim pembuka,
prompt persetujuan, hasil ekspor Gateway, dan rincian sesi/thread Codex kepada
pemilik melalui rute persetujuan privat. Grup hanya mendapat pemberitahuan singkat
bahwa alur diagnostik dikirim secara privat. Jika OpenClaw tidak dapat menemukan rute
pemilik privat, perintah gagal tertutup dan meminta pemilik menjalankannya dari DM.

Saat sesi OpenClaw aktif menggunakan harness OpenAI Codex native,
persetujuan exec yang sama juga mencakup unggahan umpan balik OpenAI untuk thread
runtime Codex yang diketahui OpenClaw. Unggahan itu terpisah dari zip Gateway lokal
dan hanya muncul untuk sesi harness Codex. Sebelum persetujuan, prompt menjelaskan
bahwa menyetujui diagnostik juga akan mengirim umpan balik Codex, tetapi tidak
mencantumkan id sesi atau thread Codex. Setelah disetujui, balasan chat mencantumkan
channel, id sesi OpenClaw, id thread Codex, dan perintah resume lokal untuk thread
yang dikirim ke server OpenAI. Jika Anda menolak atau mengabaikan persetujuan,
OpenClaw tidak menjalankan ekspor, tidak mengirim umpan balik Codex, dan tidak
mencetak id Codex.

Itu membuat loop debugging Codex yang umum menjadi singkat: lihat perilaku buruk di
Telegram, Discord, atau channel lain, jalankan `/diagnostics`, setujui sekali, bagikan
laporan kepada dukungan, lalu jalankan perintah `codex resume <thread-id>` yang dicetak
secara lokal jika Anda ingin memeriksa sendiri thread Codex native. Lihat
[Harness Codex](/id/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) untuk
alur kerja pemeriksaan tersebut.

## Isi ekspor

Zip mencakup:

- `summary.md`: ikhtisar yang mudah dibaca manusia untuk dukungan.
- `diagnostics.json`: ringkasan yang dapat dibaca mesin tentang konfigurasi, log, status, kesehatan,
  dan data stabilitas.
- `manifest.json`: metadata ekspor dan daftar file.
- Bentuk konfigurasi yang disanitasi dan detail konfigurasi non-rahasia.
- Ringkasan log yang disanitasi dan baris log terbaru yang disunting.
- Snapshot status dan kesehatan Gateway upaya-terbaik.
- `stability/latest.json`: bundel stabilitas tersimpan terbaru, bila tersedia.

Ekspor tetap berguna bahkan saat Gateway tidak sehat. Jika Gateway tidak dapat
menjawab permintaan status atau kesehatan, log lokal, bentuk konfigurasi, dan bundel
stabilitas terbaru tetap dikumpulkan bila tersedia.

## Model privasi

Diagnostik dirancang agar dapat dibagikan. Ekspor mempertahankan data operasional
yang membantu debugging, seperti:

- nama subsistem, id plugin, id penyedia, id channel, dan mode yang dikonfigurasi
- kode status, durasi, jumlah byte, status antrean, dan pembacaan memori
- metadata log yang disanitasi dan pesan operasional yang disunting
- bentuk konfigurasi dan pengaturan fitur non-rahasia

Ekspor menghilangkan atau menyamarkan:

- teks chat, prompt, instruksi, body webhook, dan output tool
- kredensial, kunci API, token, cookie, dan nilai rahasia
- body permintaan atau respons mentah
- id akun, id pesan, id sesi mentah, hostname, dan nama pengguna lokal

Saat pesan log tampak seperti teks pengguna, chat, prompt, atau payload tool,
ekspor hanya mempertahankan bahwa sebuah pesan dihilangkan dan jumlah byte.

## Perekam stabilitas

Gateway merekam stream stabilitas terbatas tanpa payload secara default saat
diagnostik diaktifkan. Ini untuk fakta operasional, bukan konten.

Heartbeat diagnostik yang sama merekam sampel liveness saat Gateway tetap
berjalan tetapi event loop Node.js atau CPU tampak jenuh. Peristiwa
`diagnostic.liveness.warning` ini mencakup keterlambatan event-loop, utilisasi
event-loop, rasio core CPU, dan jumlah sesi aktif/menunggu/antre. Sampel idle
tetap berada di telemetri pada level `info`. Sampel liveness menjadi peringatan
Gateway hanya saat pekerjaan menunggu atau mengantre, atau saat pekerjaan aktif
tumpang tindih dengan keterlambatan event-loop yang berkelanjutan. Lonjakan
max-delay sementara selama pekerjaan latar belakang yang sehat tetap berada di
log debug. Peristiwa itu tidak memulai ulang Gateway dengan sendirinya.

Periksa perekam live:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Periksa bundel stabilitas tersimpan terbaru setelah exit fatal, timeout shutdown,
atau kegagalan startup restart:

```bash
openclaw gateway stability --bundle latest
```

Buat zip diagnostik dari bundel tersimpan terbaru:

```bash
openclaw gateway stability --bundle latest --export
```

Bundel tersimpan berada di bawah `~/.openclaw/logs/stability/` saat peristiwa ada.

## Opsi berguna

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: tulis ke path zip tertentu.
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
- [Ekspor OpenTelemetry](/id/gateway/opentelemetry) — alur terpisah untuk streaming diagnostik ke kolektor
