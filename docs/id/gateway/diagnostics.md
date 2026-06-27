---
read_when:
    - Menyiapkan laporan bug atau permintaan dukungan
    - Men-debug crash, restart, tekanan memori, atau payload yang terlalu besar pada Gateway
    - Meninjau data diagnostik apa yang direkam atau disunting
summary: Buat bundel diagnostik Gateway yang dapat dibagikan untuk laporan bug
title: Ekspor diagnostik
x-i18n:
    generated_at: "2026-06-27T17:29:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ce431bafa51a245f2a3829074b0ca92e2d30ddfc1ae9738eed46a4e51ae98208
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw dapat membuat zip diagnostik lokal untuk laporan bug. Zip ini menggabungkan
status Gateway yang disanitasi, kesehatan, log, bentuk konfigurasi, dan peristiwa
stabilitas terbaru tanpa payload.

Perlakukan bundel diagnostik seperti rahasia sampai Anda meninjaunya. Bundel ini
dirancang untuk menghilangkan atau menyunting payload dan kredensial, tetapi tetap
merangkum log Gateway lokal dan status runtime tingkat host.

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
Gunakan ini ketika bug terjadi dalam percakapan nyata dan Anda menginginkan satu
laporan yang dapat disalin-tempel untuk dukungan:

1. Kirim `/diagnostics` di percakapan tempat Anda melihat masalah. Tambahkan
   catatan singkat jika membantu, misalnya `/diagnostics bad tool choice`.
2. OpenClaw mengirim pembuka diagnostik dan meminta satu persetujuan exec
   eksplisit. Persetujuan ini menjalankan `openclaw gateway diagnostics export --json`.
   Jangan setujui diagnostik melalui aturan allow-all.
3. Setelah disetujui, OpenClaw membalas dengan laporan yang dapat ditempel berisi path
   bundel lokal, ringkasan manifes, catatan privasi, dan id sesi yang relevan.

Di chat grup, pemilik tetap dapat menjalankan `/diagnostics`, tetapi OpenClaw tidak
memposting detail diagnostik kembali ke chat bersama. OpenClaw mengirim pembuka,
prompt persetujuan, hasil ekspor Gateway, dan perincian sesi/utas Codex kepada
pemilik melalui rute persetujuan pribadi. Grup hanya menerima pemberitahuan singkat
bahwa alur diagnostik dikirim secara pribadi. Jika OpenClaw tidak dapat menemukan rute
pemilik pribadi, perintah gagal tertutup dan meminta pemilik menjalankannya dari DM.

Ketika sesi OpenClaw aktif menggunakan harness OpenAI Codex native,
persetujuan exec yang sama juga mencakup unggahan umpan balik OpenAI untuk utas runtime
Codex yang diketahui OpenClaw. Unggahan itu terpisah dari zip Gateway lokal dan hanya
muncul untuk sesi harness Codex. Sebelum persetujuan, prompt menjelaskan bahwa
menyetujui diagnostik juga akan mengirim umpan balik Codex, tetapi tidak mencantumkan
id sesi atau utas Codex. Setelah persetujuan, balasan chat mencantumkan kanal, id sesi
OpenClaw, id utas Codex, dan perintah resume lokal untuk utas yang dikirim ke server
OpenAI. Jika Anda menolak atau mengabaikan persetujuan, OpenClaw tidak menjalankan
ekspor, tidak mengirim umpan balik Codex, dan tidak mencetak id Codex.

Itu membuat loop debugging Codex umum menjadi singkat: lihat perilaku buruk di
Telegram, Discord, atau kanal lain, jalankan `/diagnostics`, setujui sekali, bagikan
laporan dengan dukungan, lalu jalankan perintah `codex resume <thread-id>` yang dicetak
secara lokal jika Anda ingin memeriksa sendiri utas Codex native. Lihat
[harness Codex](/id/plugins/codex-harness#inspect-codex-threads-locally) untuk
alur kerja pemeriksaan tersebut.

## Isi ekspor

Zip mencakup:

- `summary.md`: ringkasan yang mudah dibaca manusia untuk dukungan.
- `diagnostics.json`: ringkasan yang dapat dibaca mesin tentang konfigurasi, log, status, kesehatan,
  dan data stabilitas.
- `manifest.json`: metadata ekspor dan daftar file.
- Bentuk konfigurasi yang disanitasi dan detail konfigurasi non-rahasia.
- Ringkasan log yang disanitasi dan baris log terbaru yang disunting.
- Snapshot status dan kesehatan Gateway upaya terbaik.
- `stability/latest.json`: bundel stabilitas tersimpan terbaru, jika tersedia.

Ekspor tetap berguna walaupun Gateway tidak sehat. Jika Gateway tidak dapat
menjawab permintaan status atau kesehatan, log lokal, bentuk konfigurasi, dan bundel
stabilitas terbaru tetap dikumpulkan jika tersedia.

## Model privasi

Diagnostik dirancang agar dapat dibagikan. Ekspor mempertahankan data operasional
yang membantu debugging, seperti:

- nama subsistem, id Plugin, id penyedia, id kanal, dan mode yang dikonfigurasi
- kode status, durasi, jumlah byte, status antrean, dan pembacaan memori
- metadata log yang disanitasi dan pesan operasional yang disunting
- bentuk konfigurasi dan pengaturan fitur non-rahasia

Ekspor menghilangkan atau menyunting:

- teks chat, prompt, instruksi, bodi Webhook, dan keluaran alat
- kredensial, kunci API, token, cookie, dan nilai rahasia
- bodi permintaan atau respons mentah
- id akun, id pesan, id sesi mentah, hostname, dan nama pengguna lokal

Ketika pesan log tampak seperti teks pengguna, chat, prompt, atau payload alat,
ekspor hanya menyimpan bahwa pesan dihilangkan dan jumlah byte.

## Perekam stabilitas

Gateway merekam stream stabilitas terbatas tanpa payload secara default ketika
diagnostik diaktifkan. Ini untuk fakta operasional, bukan konten.

Heartbeat diagnostik yang sama merekam sampel liveness ketika Gateway tetap
berjalan tetapi loop peristiwa Node.js atau CPU terlihat jenuh. Peristiwa
`diagnostic.liveness.warning` ini mencakup jeda loop peristiwa, utilisasi loop peristiwa,
rasio core CPU, jumlah sesi aktif/menunggu/diantrekan, fase startup/runtime saat ini
jika diketahui, rentang fase terbaru, dan label pekerjaan aktif/diantrekan yang dibatasi.
Sampel idle tetap berada di telemetri pada level `info`. Sampel liveness menjadi
peringatan Gateway hanya ketika pekerjaan sedang menunggu atau diantrekan, atau ketika
pekerjaan aktif bertumpang tindih dengan jeda loop peristiwa yang berkelanjutan.
Lonjakan max-delay sementara selama pekerjaan latar belakang yang sehat tetap berada
di log debug. Peristiwa itu tidak memulai ulang Gateway dengan sendirinya.

Fase startup juga memancarkan peristiwa `diagnostic.phase.completed` dengan timing
wall-clock dan CPU. Diagnostik embedded-run yang macet menandai `terminalProgressStale=true`
ketika progres bridge terakhir terlihat terminal, seperti item respons mentah atau
peristiwa penyelesaian respons, tetapi Gateway masih menganggap embedded run aktif.

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

Snapshot tekanan memori kritis nonaktif secara default. Untuk mempertahankan
peristiwa diagnostik dan juga menangkap snapshot stabilitas pra-OOM:

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Gunakan ini hanya pada host yang dapat menoleransi pemindaian sistem file tambahan
dan penulisan snapshot selama tekanan memori kritis. Peristiwa tekanan memori normal
tetap merekam RSS, heap, ambang batas, dan fakta pertumbuhan ketika snapshot nonaktif.

## Terkait

- [Pemeriksaan kesehatan](/id/gateway/health)
- [CLI Gateway](/id/cli/gateway#gateway-diagnostics-export)
- [Protokol Gateway](/id/gateway/protocol#system-and-identity)
- [Logging](/id/logging)
- [Ekspor OpenTelemetry](/id/gateway/opentelemetry) — alur terpisah untuk mengalirkan diagnostik ke kolektor
