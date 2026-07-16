---
read_when:
    - Anda perlu menjawab siapa yang menjalankan agen atau alat, kapan dijalankan, dan bagaimana prosesnya berakhir
    - Anda memerlukan metadata siklus hidup pesan masuk atau keluar tanpa konten
    - Anda memerlukan ekspor aktivitas terbatas yang aman dari pengungkapan data sensitif
summary: Referensi CLI untuk catatan audit siklus hidup eksekusi khusus metadata, alat, dan pesan
title: Catatan audit
x-i18n:
    generated_at: "2026-07-16T17:52:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: da9df6f388b0a24c3b79d755fa59d047cce99262bc6d9c890be7a83da75693a8
    source_path: cli/audit.md
    workflow: 16
---

# `openclaw audit`

Kueri buku besar audit khusus metadata milik Gateway untuk proses agen, tindakan alat, dan
catatan siklus hidup pesan yang diaktifkan secara opsional.

Buku besar diaktifkan secara default untuk peristiwa proses dan alat. Atur
[`audit.enabled: false`](/id/gateway/configuration-reference#audit) dan mulai ulang
Gateway untuk menghentikan semua pencatatan peristiwa baru. Catatan pesan dinonaktifkan secara terpisah
secara default; atur `audit.messages` ke `direct` atau `all` dan mulai ulang Gateway untuk
mencatatnya. Catatan yang ada tetap dapat dikueri hingga kedaluwarsa (30 hari).

Buku besar ini terpisah dari transkrip percakapan: buku besar mencatat identitas,
urutan, asal-usul, tindakan, status, dan kode hasil yang dinormalisasi, tetapi tidak pernah
menyimpan konten, dan pengidentifikasi pesan hanya muncul sebagai pseudonim berkunci
yang bersifat lokal untuk instalasi. [Riwayat audit](/gateway/audit) mencakup model data lengkap,
semantik privasi, batas penyimpanan/retensi, dan batas cakupan; halaman ini
membahas antarmuka perintah.

```bash
openclaw audit
openclaw audit --agent main --status failed
openclaw audit --session "agent:main:main" --after 2026-07-01T00:00:00Z
openclaw audit --run 8c69f72e-8b11-4c54-98d5-1a3dd67450c3
openclaw audit --kind tool_action --limit 50 --json
openclaw audit --kind message --direction outbound --channel telegram --json
```

## Filter

- `--agent <id>`: id agen yang persis
- `--session <key>`: kunci sesi yang persis
- `--run <id>`: id proses yang persis
- `--kind <kind>`: `agent_run`, `tool_action`, atau `message`
- `--status <status>`: `started`, `succeeded`, `failed`, `cancelled`,
  `timed_out`, `blocked`, atau `unknown`
- `--direction <direction>`: arah pesan, `inbound` atau `outbound`
- `--channel <channel>`: saluran pesan yang persis
- `--after <timestamp>` / `--before <timestamp>`: stempel waktu ISO inklusif atau
  milidetik Unix
- `--limit <count>`: ukuran halaman dari 1 hingga 500; default `100`
- `--cursor <sequence>`: lanjutkan kueri terdahulu dengan urutan terbaru lebih dahulu
- `--json`: cetak halaman yang dibatasi sebagai JSON

CLI mengueri RPC aktivitas berversi sehingga satu perintah menampilkan buku besar
terkonfigurasi secara lengkap. Keluaran teks menampilkan waktu, jenis, arah, saluran, status,
agen, proses, dan tindakan. Asal-usul pesan yang tidak tersedia ditampilkan sebagai `-`; OpenClaw
tidak mengarang id agen atau proses. Tindakan alat juga menampilkan nama alat. Keluaran
JSON menyertakan `nextCursor` jika halaman lain tersedia. Teruskan nilai tersebut ke
`--cursor` untuk melanjutkan tanpa mengubah urutan catatan yang masuk selama pemuatan halaman.

Ekspor ini tetap merupakan metadata operasional sensitif meskipun isi pesan
dan bidang identitas pesan mentah tidak disertakan. Id agen, sesi, dan proses, waktu,
saluran, hasil, serta referensi HMAC yang stabil dapat digunakan untuk mengorelasikan aktivitas. Lindungi
semuanya dengan kontrol akses dan praktik retensi yang sama seperti catatan
operator lainnya.

## Peristiwa yang dicatat

Gateway memproyeksikan aliran siklus hidup tepercaya ke dalam enam tindakan:

- `agent.run.started`
- `agent.run.finished`
- `tool.action.started`
- `tool.action.finished`
- `message.inbound.processed`
- `message.outbound.finished`

Setiap catatan yang dikembalikan memiliki id peristiwa yang stabil, urutan buku besar
yang meningkat secara monoton, stempel waktu siklus hidup, pelaku, tindakan, status,
penanda `schemaVersion: 1`, urutan sumber, dan `redaction: "metadata_only"`.
Asal-usul agen/sesi/proses dan bidang khusus peristiwa hanya tersedia jika
sumber tepercaya menyediakannya. Catatan pesan sengaja menghilangkan
`sessionKey` dan `sessionId`, sehingga filter `--session` hanya berlaku untuk catatan proses dan alat.

Catatan terminal untuk proses dan alat membedakan keberhasilan, kegagalan, pembatalan,
batas waktu, dan pemblokiran kebijakan dengan status tertutup serta kode kesalahan. `unknown` adalah
hasil eksplisit yang tidak berhasil ketika runtime hulu tidak mengekspos
hasil terminal yang otoritatif. Id panggilan alat hanya diekspor sebagai
sidik jari yang stabil. Nama alat harus sesuai dengan kontrak nama ringkas
yang dihadapkan ke model; nilai lainnya menjadi `unknown`.

Catatan pesan menambahkan arah, saluran, jenis percakapan, hasil, serta
jenis pengiriman, tahap kegagalan, durasi, jumlah hasil, kode alasan yang dinormalisasi,
dan pseudonim akun/percakapan/pesan/target berkunci yang bersifat opsional. Batas masuk
saat ini mencakup pesan yang diterima dan mencapai pengiriman inti, termasuk hasil
duplikat inti dan pemrosesan terminal. Batas keluar menulis satu baris terminal
per muatan balasan logis asli yang mencapai pengiriman tahan lama bersama; pemecahan
menjadi potongan dan fan-out adaptor diagregasikan dalam `resultCount`. Pengiriman yang diantrekan,
dapat dicoba ulang, atau ambigu hanya dicatat setelah konfirmasi, dead letter, atau rekonsiliasi
menjadikan hasilnya terminal. Jalur lokal Plugin dan pengiriman langsung yang melewati
batas bersama tersebut belum tercakup; tidak adanya baris tidak membuktikan bahwa
pesan tidak pernah ada.

Buku besar audit tidak menggantikan transkrip, riwayat tugas, riwayat proses cron,
atau log. Buku besar menyediakan indeks lintas proses yang kecil untuk pertanyaan operator tanpa
menyalin konten percakapan ke penyimpanan lain.

Untuk baris masuk, `durationMs` mengukur pengiriman inti dan `resultCount` menghitung
muatan alat, blok, dan balasan antrean yang telah difinalisasi. Untuk baris keluar,
`durationMs` mencakup kepemilikan pengiriman hingga status terminalnya (dan karena itu
waktu tunggu dalam antrean), sementara `resultCount` menghitung pengiriman fisik platform
yang teridentifikasi. `deliveryKind`, jika tersedia, menjelaskan muatan efektif setelah hook
dan setelah perenderan; baris yang ditekan dan yang ambigu akibat crash tidak menyertakannya.

## RPC Gateway

`audit.activity.list` memerlukan `operator.read` dan menerima filter yang sama. RPC ini
mengembalikan union peristiwa aktivitas V1 bernama, termasuk catatan proses, alat, pesan masuk,
dan pesan keluar.

```bash
openclaw gateway call audit.activity.list --params '{"channel":"telegram","limit":50}'
```

Hasilnya adalah `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.
Hasil diurutkan dari yang terbaru dan dibatasi hingga 500 catatan per permintaan.

RPC `audit.list` yang disertakan tetap tidak berubah untuk klien proses/alat lama. Ketika
`audit.activity.list` tidak tersedia pada Gateway lama, CLI mencoba kembali
`audit.list` hanya jika setiap filter yang diminta didukung oleh metode lama tersebut. `--kind message`,
`--direction`, dan `--channel` gagal dengan pesan peningkatan versi pada Gateway lama
alih-alih diabaikan secara diam-diam.

## Terkait

- [Riwayat audit](/gateway/audit)
- [Protokol Gateway](/id/gateway/protocol#audit-ledger-rpc)
- [Sesi](/id/cli/sessions)
- [Tugas](/id/cli/tasks)
- [Pekerjaan Cron](/id/automation/cron-jobs)
