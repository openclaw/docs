---
read_when:
    - Menyiapkan laporan kesalahan atau permintaan dukungan
    - Memecahkan masalah crash, mulai ulang, tekanan memori, atau payload yang terlalu besar pada Gateway
    - Meninjau data diagnostik apa yang dicatat atau disamarkan
summary: Buat bundel diagnostik Gateway yang dapat dibagikan untuk laporan bug
title: Ekspor diagnostik
x-i18n:
    generated_at: "2026-05-02T09:20:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d1f7c1e1d96aeeebe30b30c8a23ec3c7b0fb4938f15a3783bf22e861770bf78
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw dapat membuat zip diagnostik lokal untuk laporan bug. Ini menggabungkan
status Gateway, kesehatan, log, bentuk konfigurasi, dan peristiwa stabilitas
terbaru tanpa payload yang telah disanitasi.

Perlakukan bundel diagnostik seperti rahasia sampai Anda meninjaunya. Bundel ini
dirancang untuk menghilangkan atau menyamarkan payload dan kredensial, tetapi
tetap merangkum log Gateway lokal dan status runtime tingkat host.

## Mulai cepat

```bash
openclaw gateway diagnostics export
```

Perintah ini mencetak jalur zip yang ditulis. Untuk memilih jalur:

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
2. OpenClaw mengirim pembuka diagnostik dan meminta satu persetujuan eksekusi
   eksplisit. Persetujuan menjalankan `openclaw gateway diagnostics export --json`.
   Jangan menyetujui diagnostik melalui aturan izinkan-semua.
3. Setelah disetujui, OpenClaw membalas dengan laporan yang dapat ditempel berisi jalur
   bundel lokal, ringkasan manifes, catatan privasi, dan id sesi yang relevan.

Dalam chat grup, pemilik tetap dapat menjalankan `/diagnostics`, tetapi OpenClaw tidak
memposting detail diagnostik kembali ke chat bersama. OpenClaw mengirim pembuka,
prompt persetujuan, hasil ekspor Gateway, dan perincian sesi/thread Codex kepada
pemilik melalui rute persetujuan privat. Grup hanya mendapatkan pemberitahuan singkat
bahwa alur diagnostik dikirim secara privat. Jika OpenClaw tidak dapat menemukan rute
pemilik privat, perintah gagal tertutup dan meminta pemilik menjalankannya dari DM.

Saat sesi OpenClaw aktif menggunakan harness OpenAI Codex native,
persetujuan eksekusi yang sama juga mencakup unggahan umpan balik OpenAI untuk thread
runtime Codex yang diketahui OpenClaw. Unggahan itu terpisah dari zip Gateway lokal
dan hanya muncul untuk sesi harness Codex. Sebelum persetujuan, prompt menjelaskan
bahwa menyetujui diagnostik juga akan mengirim umpan balik Codex, tetapi tidak
mencantumkan id sesi atau thread Codex. Setelah persetujuan, balasan chat mencantumkan
channel, id sesi OpenClaw, id thread Codex, dan perintah lanjutkan lokal
untuk thread yang dikirim ke server OpenAI. Jika Anda menolak atau mengabaikan
persetujuan, OpenClaw tidak menjalankan ekspor, tidak mengirim umpan balik Codex, dan
tidak mencetak id Codex.

Itu membuat loop debugging Codex umum menjadi singkat: lihat perilaku buruk di
Telegram, Discord, atau channel lain, jalankan `/diagnostics`, setujui sekali, bagikan
laporan dengan dukungan, lalu jalankan perintah `codex resume <thread-id>` yang dicetak
secara lokal jika Anda ingin memeriksa thread Codex native sendiri. Lihat
[harness Codex](/id/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) untuk
alur kerja pemeriksaan tersebut.

## Isi ekspor

Zip mencakup:

- `summary.md`: ikhtisar yang mudah dibaca manusia untuk dukungan.
- `diagnostics.json`: ringkasan yang mudah dibaca mesin tentang konfigurasi, log, status, kesehatan,
  dan data stabilitas.
- `manifest.json`: metadata ekspor dan daftar file.
- Bentuk konfigurasi yang disanitasi dan detail konfigurasi non-rahasia.
- Ringkasan log yang disanitasi dan baris log terbaru yang disamarkan.
- Snapshot status dan kesehatan Gateway upaya-terbaik.
- `stability/latest.json`: bundel stabilitas tersimpan terbaru, jika tersedia.

Ekspor tetap berguna bahkan saat Gateway tidak sehat. Jika Gateway tidak dapat
menjawab permintaan status atau kesehatan, log lokal, bentuk konfigurasi, dan bundel
stabilitas terbaru tetap dikumpulkan saat tersedia.

## Model privasi

Diagnostik dirancang agar dapat dibagikan. Ekspor mempertahankan data operasional
yang membantu debugging, seperti:

- nama subsistem, id plugin, id penyedia, id channel, dan mode terkonfigurasi
- kode status, durasi, jumlah byte, status antrean, dan pembacaan memori
- metadata log yang disanitasi dan pesan operasional yang disamarkan
- bentuk konfigurasi dan pengaturan fitur non-rahasia

Ekspor menghilangkan atau menyamarkan:

- teks chat, prompt, instruksi, isi webhook, dan output alat
- kredensial, API key, token, cookie, dan nilai rahasia
- isi mentah permintaan atau respons
- id akun, id pesan, id sesi mentah, hostname, dan nama pengguna lokal

Saat pesan log terlihat seperti teks payload pengguna, chat, prompt, atau alat,
ekspor hanya mempertahankan bahwa sebuah pesan dihilangkan dan jumlah byte.

## Perekam stabilitas

Gateway merekam stream stabilitas terbatas tanpa payload secara default saat
diagnostik diaktifkan. Ini untuk fakta operasional, bukan konten.

Heartbeat diagnostik yang sama merekam sampel liveness saat Gateway tetap
berjalan tetapi event loop Node.js atau CPU tampak jenuh. Peristiwa
`diagnostic.liveness.warning` ini mencakup jeda event-loop, utilisasi event-loop,
rasio core CPU, dan jumlah sesi aktif/menunggu/terantre. Sampel idle tetap berada
dalam telemetri pada level `info`; sampel tersebut hanya dicatat sebagai peringatan
Gateway saat pekerjaan diagnostik aktif, menunggu, atau terantre. Sampel tersebut
tidak me-restart Gateway dengan sendirinya.

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
- `--log-lines <count>`: maksimum baris log tersanitasi yang disertakan.
- `--log-bytes <bytes>`: maksimum byte log untuk diperiksa.
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
