---
read_when:
    - Menyiapkan laporan bug atau permintaan dukungan
    - Men-debug kegagalan Gateway, mulai ulang, tekanan memori, atau muatan berukuran terlalu besar
    - Meninjau data diagnostik apa saja yang dicatat atau disamarkan
summary: Buat bundel diagnostik Gateway yang dapat dibagikan untuk laporan bug
title: Ekspor diagnostik
x-i18n:
    generated_at: "2026-04-30T09:48:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: e66f1391da77e531b5d3b0ed19600da222d80960d1b6e54d51925c04b06dae46
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw dapat membuat zip diagnostik lokal untuk laporan bug. Zip ini menggabungkan
status Gateway, kesehatan, log, bentuk konfigurasi, dan peristiwa stabilitas terbaru
tanpa payload yang telah disanitasi.

Perlakukan bundel diagnostik seperti rahasia sampai Anda meninjaunya. Bundel ini
dirancang untuk menghilangkan atau menyunting payload dan kredensial, tetapi tetap
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

1. Kirim `/diagnostics` dalam percakapan tempat Anda melihat masalah. Tambahkan
   catatan singkat jika membantu, misalnya `/diagnostics bad tool choice`.
2. OpenClaw mengirim pembuka diagnostik dan meminta satu persetujuan eksekusi
   eksplisit. Persetujuan tersebut menjalankan `openclaw gateway diagnostics export --json`.
   Jangan setujui diagnostik melalui aturan izinkan-semua.
3. Setelah disetujui, OpenClaw membalas dengan laporan yang dapat ditempel berisi jalur
   bundel lokal, ringkasan manifes, catatan privasi, dan id sesi yang relevan.

Dalam chat grup, pemilik tetap dapat menjalankan `/diagnostics`, tetapi OpenClaw tidak
memposting detail diagnostik kembali ke chat bersama. OpenClaw mengirim pembuka,
prompt persetujuan, hasil ekspor Gateway, dan perincian sesi/thread Codex kepada
pemilik melalui rute persetujuan privat. Grup hanya menerima pemberitahuan singkat
bahwa alur diagnostik dikirim secara privat. Jika OpenClaw tidak dapat menemukan rute
pemilik privat, perintah gagal tertutup dan meminta pemilik menjalankannya dari DM.

Ketika sesi OpenClaw aktif menggunakan harness OpenAI Codex native,
persetujuan eksekusi yang sama juga mencakup unggahan masukan OpenAI untuk thread
runtime Codex yang diketahui OpenClaw. Unggahan tersebut terpisah dari zip Gateway
lokal dan hanya muncul untuk sesi harness Codex. Sebelum persetujuan, prompt
menjelaskan bahwa menyetujui diagnostik juga akan mengirim masukan Codex, tetapi
tidak mencantumkan id sesi atau thread Codex. Setelah persetujuan, balasan chat
mencantumkan channel, id sesi OpenClaw, id thread Codex, dan perintah resume lokal
untuk thread yang dikirim ke server OpenAI. Jika Anda menolak atau mengabaikan
persetujuan, OpenClaw tidak menjalankan ekspor, tidak mengirim masukan Codex, dan
tidak mencetak id Codex.

Itu membuat loop debugging Codex yang umum menjadi singkat: lihat perilaku buruk di
Telegram, Discord, atau channel lain, jalankan `/diagnostics`, setujui sekali, bagikan
laporan dengan dukungan, lalu jalankan perintah `codex resume <thread-id>` yang dicetak
secara lokal jika Anda ingin memeriksa sendiri thread Codex native. Lihat
[Harness Codex](/id/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) untuk
alur kerja pemeriksaan tersebut.

## Isi ekspor

Zip mencakup:

- `summary.md`: ringkasan yang mudah dibaca manusia untuk dukungan.
- `diagnostics.json`: ringkasan yang mudah dibaca mesin tentang konfigurasi, log, status, kesehatan,
  dan data stabilitas.
- `manifest.json`: metadata ekspor dan daftar file.
- Bentuk konfigurasi yang telah disanitasi dan detail konfigurasi nonrahasia.
- Ringkasan log yang telah disanitasi dan baris log terbaru yang telah disunting.
- Snapshot status dan kesehatan Gateway upaya terbaik.
- `stability/latest.json`: bundel stabilitas tersimpan terbaru, jika tersedia.

Ekspor tetap berguna bahkan ketika Gateway tidak sehat. Jika Gateway tidak dapat
menjawab permintaan status atau kesehatan, log lokal, bentuk konfigurasi, dan bundel
stabilitas terbaru tetap dikumpulkan jika tersedia.

## Model privasi

Diagnostik dirancang agar dapat dibagikan. Ekspor mempertahankan data operasional
yang membantu debugging, seperti:

- nama subsistem, id plugin, id penyedia, id channel, dan mode yang dikonfigurasi
- kode status, durasi, jumlah byte, status antrean, dan pembacaan memori
- metadata log yang telah disanitasi dan pesan operasional yang telah disunting
- bentuk konfigurasi dan pengaturan fitur nonrahasia

Ekspor menghilangkan atau menyunting:

- teks chat, prompt, instruksi, badan webhook, dan output alat
- kredensial, kunci API, token, cookie, dan nilai rahasia
- badan permintaan atau respons mentah
- id akun, id pesan, id sesi mentah, hostname, dan nama pengguna lokal

Ketika pesan log terlihat seperti teks payload pengguna, chat, prompt, atau alat,
ekspor hanya menyimpan bahwa sebuah pesan dihilangkan dan jumlah byte-nya.

## Perekam stabilitas

Gateway merekam aliran stabilitas terbatas tanpa payload secara default ketika
diagnostik diaktifkan. Ini untuk fakta operasional, bukan konten.

Heartbeat diagnostik yang sama mencatat peringatan liveness ketika Gateway tetap
berjalan tetapi event loop Node.js atau CPU terlihat jenuh. Peristiwa
`diagnostic.liveness.warning` ini mencakup penundaan event loop, utilisasi event loop,
rasio core CPU, dan jumlah sesi aktif/menunggu/diantrekan. Peristiwa ini
tidak memulai ulang Gateway dengan sendirinya.

Periksa perekam live:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Periksa bundel stabilitas tersimpan terbaru setelah keluar fatal, timeout shutdown,
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

- `--output <path>`: tulis ke jalur zip tertentu.
- `--log-lines <count>`: jumlah maksimum baris log yang telah disanitasi untuk disertakan.
- `--log-bytes <bytes>`: jumlah maksimum byte log untuk diperiksa.
- `--url <url>`: URL WebSocket Gateway untuk snapshot status dan kesehatan.
- `--token <token>`: token Gateway untuk snapshot status dan kesehatan.
- `--password <password>`: kata sandi Gateway untuk snapshot status dan kesehatan.
- `--timeout <ms>`: timeout snapshot status dan kesehatan.
- `--no-stability-bundle`: lewati pencarian bundel stabilitas tersimpan.
- `--json`: cetak metadata ekspor yang mudah dibaca mesin.

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
