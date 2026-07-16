---
read_when:
    - Anda sedang membuktikan peralihan penyimpanan SQLite Jalur 3 terhadap Gateway aktif
    - Anda perlu membedakan penyimpangan JSONL lama yang diperkirakan dari kegagalan runtime
    - Anda sedang membangun atau meninjau harness E2E SQLite langsung berbasis agen
summary: Desain untuk pembuktian Gateway langsung atas peralihan sesi/transkrip SQLite Jalur 3
title: Harness E2E SQLite langsung Jalur 3
x-i18n:
    generated_at: "2026-07-16T18:39:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2749bf47cb4967bc80a5ed37a12f2a553f3b388ed8cd90cfb3217e1b5e8afae9
    source_path: reference/path3-live-sqlite-e2e-harness.md
    workflow: 16
---

Harness E2E SQLite langsung Path 3 membuktikan bahwa Gateway menggunakan SQLite sebagai
penyimpanan sesi dan transkrip kanonis, sementara file JSONL lama tetap menjadi
input migrasi atau materi arsip. Ini adalah harness pembuktian untuk pengelola, bukan
diagnostik pengguna biasa.

Setelah Gateway memproses lalu lintas pascamigrasi, paritas JSONL lama tidak
lagi menjadi sinyal kesehatan runtime yang valid. Gateway termigrasi yang sehat dapat memiliki
baris transkrip SQLite yang jumlahnya berbeda dari JSONL lama karena giliran baru
seharusnya hanya memajukan SQLite. Karena itu, harness langsung harus mengukur perilaku
Gateway, perubahan baris SQLite, keadaan diam file lama, dan kesehatan log pada setiap
langkah.

## Bentuk perintah

Perintah langsung yang dimaksud adalah:

```bash
node scripts/path3-live-sqlite-e2e.mjs \
  --url http://127.0.0.1:18789 \
  --agent main \
  --session-key agent:main:path3-live-e2e:<timestamp> \
  --json
```

Perintah tersebut terhubung ke Gateway yang sudah berjalan. Perintah ini tidak memulai, menghentikan,
mengimpor, atau menjalankan ulang migrasi, kecuali mode migrasi eksplisit ditambahkan
kemudian. Varian CI atau lokal terisolasi dapat menggunakan
`test/helpers/openclaw-test-instance.ts`, tetapi jalur pembuktian langsung harus memeriksa
Gateway operator yang sebenarnya dan basis data SQLite per agen yang sesungguhnya.

## Pembuktian CLI hasil build yang terisolasi

Runner pembuktian CLI hasil build menginisialisasi penyimpanan sesi lama yang terisolasi, memulai
Gateway yang dibangun ulang, dan membuktikan bahwa saat dimulai, sesi lama yang aktif diimpor ke
SQLite sebelum pembacaan runtime dimulai. Runner tidak boleh menjalankan `openclaw doctor --fix`
sebelum Gateway pertama kali dimulai karena hal itu akan membuktikan jalur migrasi manual,
bukan jalur peningkatan yang diterima pengguna saat boot pertama setelah peralihan.

Setelah impor saat startup, pembuktian terisolasi dapat menjalankan
`openclaw doctor --session-sqlite inspect` dan
`openclaw doctor --session-sqlite validate` sebagai bukti diagnostik. Perintah
doctor tersebut bukan penggerak migrasi untuk pembuktian peningkatan saat startup.
Skenario impor doctor yang terpisah harus menginisialisasi file transkrip lama beserta
sidecar lintasan dan memverifikasi bahwa doctor mengarsipkan artefak tersebut sementara SQLite
tetap kanonis.

## Pemeriksaan awal

Pemeriksaan awal mengumpulkan garis dasar dan gagal sebelum mengirim giliran pembuktian jika
Gateway tidak dapat digunakan:

- `GET /health` dan status mendalam Gateway harus melaporkan Gateway yang berjalan dan dapat
  dijangkau.
- Versi CLI dan Gateway harus cocok dengan cabang yang diuji.
- Harness mencatat kursor log untuk log file Gateway yang aktif.
- Harness mencatat jumlah tabel SQLite per agen untuk `sessions`,
  `session_entries`, `transcript_events`, `transcript_event_identities`, dan
  `session_routes`.
- Harness mencatat `mtime`, `size`, dan keberadaan untuk
  `sessions.json` lama, file JSONL yang dirujuk, dan kandidat jalur JSONL
  sesi pembuktian.
- `lsof -p <gateway-pid>` harus menunjukkan handle DB/WAL/SHM SQLite dan tidak ada handle
  `.jsonl` atau `sessions.json` yang aktif.

`openclaw doctor --session-sqlite validate` hanya bersifat informatif dalam mode langsung.
Setelah lalu lintas pascaperalihan, perintah tersebut dapat melaporkan penyimpangan yang diperkirakan terhadap file lama. Harness
harus menggunakan keluaran doctor untuk klasifikasi dan inventaris migrasi,
bukan sebagai penentu lulus/gagal runtime.

## Skenario yang digerakkan agen

Skenario langsung menggunakan kunci sesi pembuktian khusus dan menggerakkan Gateway
melalui jalur RPC publik jika memungkinkan. Satu giliran agen seharusnya cukup untuk
menjalankan persistensi biasa, tetapi pembuktian lengkap harus mencakup sambungan 3.1b
yang sebelumnya memerlukan pemeriksaan langsung tersendiri:

- Giliran percakapan biasa: buat atau gunakan kembali sesi pembuktian, kirim prompt agen
  yang nyata, tunggu hasil akhir asisten, dan verifikasi `chat.history` atau
  proyeksi Gateway yang setara.
- Identitas transkrip: verifikasi bahwa penanda yang sama muncul dalam riwayat Gateway dan
  baris transkrip SQLite, termasuk baris identitas peristiwa yang stabil jika tersedia.
- Aksesori metadata sesi: baca sesi pembuktian dan sesi langsung terpilih yang sudah ada
  melalui aksesori Gateway/sesi dan bandingkan dengan baris SQLite.
- Proyeksi patch sesi: terapkan perubahan metadata model/sesi yang dapat dibalik pada
  sesi pembuktian, lalu verifikasi bahwa baris yang diproyeksikan dan respons Gateway sesuai.
- Siklus hidup titik pemeriksaan Compaction: tampilkan daftar, buat cabang, dan pulihkan titik pemeriksaan hanya
  pada sesi pembuktian atau sesi fixture sintetis yang dibuat oleh harness.
- Pemulihan setelah mulai ulang: jalankan jalur penanda pemulihan aman terhadap sesi pembuktian
  yang dikontrol atau instans pengujian terisolasi; mode langsung hanya boleh menjalankan langkah ini ketika
  kumpulan sesi target dinyatakan secara eksplisit dan dapat dibalik.
- Siklus hidup pembersihan: hapus atau reset sesi pembuktian, lalu verifikasi baris
  siklus hidup SQLite dan status transkrip yang diarsipkan.

Sambungan khusus transportasi yang tidak dapat dijalankan dengan aman pada Gateway operator
langsung, seperti ingress WhatsApp atau panggilan suara, harus menggunakan probe runtime tingkat pemilik
terhadap kontrak SQLite yang sama, bukan transportasi eksternal palsu.

## Asersi per langkah

Setiap langkah mengambil snapshot status sebelum dan sesudah serta menulis catatan asersi
terstruktur:

- Jumlah baris SQLite bertambah hanya di bagian yang diperkirakan.
- Baris runtime lintasan bertambah untuk sesi pembuktian berbasis penanda yang mencatat
  peristiwa runtime.
- Baris sesi pembuktian memiliki `session_id`, status, stempel waktu,
  metadata, dan baris rute yang diperkirakan.
- Proyeksi riwayat/sesi Gateway cocok dengan ekor transkrip SQLite.
- Tidak ada file JSONL sesi pembuktian yang dibuat atau diubah.
- Tidak ada sidecar `.trajectory.jsonl`, `.trajectory-path.json`, atau
  `trajectory/<session>.jsonl` turunan penanda untuk sesi pembuktian yang dibuat.
- File JSONL lama yang sudah ada dan `sessions.json` tetap tidak berubah, kecuali
  langkah tersebut secara eksplisit merupakan operasi migrasi luring atau pengarsipan.
- Proses Gateway tidak membuka handle `.jsonl` atau `sessions.json`.
- Log sejak kursor sebelumnya tidak memuat `ERROR`, `FATAL`, `SQLITE_`,
  `no such column`, penyimpanan sesi tidak tersedia, kegagalan pemulihan setelah mulai ulang, atau
  peringatan rekonsiliasi transkrip, kecuali skenario secara eksplisit memasukkannya ke daftar yang diizinkan.

Pemindaian log merupakan bagian dari kontrak lulus/gagal. Gateway yang menjawab pemeriksaan
kesehatan tetapi mengeluarkan kesalahan skema SQLite atau kegagalan rekonsiliasi transkrip berulang
tidak dinyatakan hijau untuk Path 3.

## Artefak bukti

Harness harus menulis bukti di bawah `.artifacts/path3-live-e2e/<timestamp>/`
dan menjauhkannya dari git:

- `summary.json`: argumen perintah, versi Gateway, hasil, asersi yang gagal, dan
  jalur artefak.
- `sqlite-before.json` dan `sqlite-after.json`: jumlah baris dan baris pembuktian
  terpilih.
- `legacy-files.json`: keberadaan file lama, `mtime`, ukuran, dan apakah setiap
  file berubah.
- `gateway-log-scan.json`: rentang kursor, baris log yang cocok, dan keputusan
  daftar yang diizinkan.
- `events.jsonl`: observasi per langkah yang diurutkan dan sesuai untuk komentar pembuktian PR.

Pembuktian PR harus merangkum artefak ini alih-alih menempelkan transkrip lengkap
atau konten pesan pribadi.

## Aturan keselamatan

- Mode langsung tidak boleh mengimpor ulang JSONL lama saat Gateway sedang berjalan.
- Mode langsung tidak boleh mengubah sesi selain sesi pembuktian, kecuali untuk probe perbaikan
  yang dipilih secara eksplisit dan dapat dibalik.
- Setiap langkah migrasi yang destruktif atau luas memerlukan cadangan baru dari
  DB SQLite dan direktori sesi lama yang terdampak.
- Cadangan harus dibatasi pada DB agen/direktori sesi yang disentuh dan digunakan kembali
  selama satu proses pembuktian untuk menghindari pertumbuhan disk tanpa batas.
- Langkah pembersihan tidak boleh menyisakan sesi pembuktian, JSONL pembuktian, atau file lama
  yang dimodifikasi, kecuali pemanggil meneruskan `--keep-artifacts`.

## Hasil lulus

Proses langsung yang lulus berarti Gateway menerima alur sesi nyata yang digerakkan agen,
semua status kanonis yang diamati berada di SQLite, file runtime lama tetap
diam, dan kesehatan log tetap bersih selama rentang waktu yang diukur. Ini tidak berarti
paritas JSONL lama tetap bersih setelah lalu lintas langsung; penyimpangan langsung memang diperkirakan
setelah SQLite menjadi penyimpanan kanonis.
