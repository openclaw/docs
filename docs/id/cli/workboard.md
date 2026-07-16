---
read_when:
    - Anda ingin memeriksa atau membuat kartu Workboard dari terminal
    - Anda ingin menjalankan proses worker Workboard dari CLI
    - Anda sedang men-debug perilaku CLI Workboard atau perintah garis miring
summary: Referensi CLI untuk kartu `openclaw workboard`, pengiriman, dan eksekusi worker
title: CLI Papan Kerja
x-i18n:
    generated_at: "2026-07-16T17:57:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c109402dad26a44a277febf895e4f4305060e3b6c8ecc024aca5f255de8b5717
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` adalah antarmuka terminal untuk [Plugin Workboard](/id/plugins/workboard) bawaan. Antarmuka ini memungkinkan operator mencantumkan kartu, membuat kartu, memeriksa satu kartu, dan meminta Gateway yang sedang berjalan untuk mengirimkan pekerjaan yang siap ke proses pekerja subagen.

Aktifkan Plugin sebelum menggunakan perintah:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## Penggunaan

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard move <id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--max-starts <count>] [--admin] [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

Perintah membaca dan menulis basis data SQLite milik Plugin yang sama dengan yang digunakan oleh dasbor dan alat agen Workboard. ID kartu adalah UUID; perintah yang menerima ID kartu juga menerima prefiks ID yang tidak ambigu (keluaran teks ringkas menampilkan 8 karakter pertama).

Nilai `status` yang valid: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`. Nilai `priority` yang valid: `low`, `normal`, `high`, `urgent`.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

Keluaran teks bersifat ringkas:

```text
7f4a2c10  ready     high    default agent-a  Perbaiki Heartbeat pekerja yang kedaluwarsa
```

Kolom terdiri atas prefiks ID, status, prioritas, ID papan, ID agen opsional, dan judul.

| Flag                 | Tujuan                                        |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | Batasi hasil ke satu namespace papan          |
| `--status <status>`  | Batasi hasil ke satu status Workboard         |
| `--include-archived` | Sertakan kartu yang diarsipkan dalam keluaran teks ringkas |
| `--json`             | Cetak daftar lengkap kartu sebagai JSON mesin |

Secara default, keluaran teks ringkas menyembunyikan kartu yang diarsipkan agar CLI cocok dengan `/workboard list`. Gunakan `--include-archived` untuk menampilkannya. Keluaran JSON selalu mempertahankan daftar lengkap kartu, termasuk kartu yang diarsipkan, untuk otomatisasi yang sudah ada.

## `create`

```bash
openclaw workboard create "Perbaiki Heartbeat pekerja yang kedaluwarsa" --priority high --labels bug,workboard
openclaw workboard create "Tulis dokumentasi Workboard" --status ready --agent docs-agent --board docs --notes "Bahas CLI, perintah garis miring, pengiriman, dan status SQLite."
```

| Flag                    | Tujuan                                  |
| ----------------------- | --------------------------------------- |
| `--notes <text>`        | Catatan awal kartu                      |
| `--status <status>`     | Status awal, default `todo`           |
| `--priority <priority>` | Prioritas, default `normal`              |
| `--agent <id>`          | Tetapkan kartu kepada agen atau ID pemilik |
| `--board <id>`          | Simpan kartu dalam namespace papan      |
| `--labels <items>`      | Label yang dipisahkan koma              |
| `--json`                | Cetak kartu yang dibuat sebagai JSON mesin |

`create` menulis langsung ke status SQLite Workboard. Kartu segera terlihat di tab Workboard pada Control UI dan oleh alat Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

Keluaran teks mencetak baris ringkas kartu dan catatan. Keluaran JSON mengembalikan rekaman lengkap kartu, termasuk metadata eksekusi, percobaan, komentar, tautan, bukti, artefak, log pekerja, status protokol, diagnostik, dan metadata otomatisasi.

## `move`

```bash
openclaw workboard move 7f4a2c10 --status review
openclaw workboard move 7f4a2c10 --status done --json
```

`move` mengubah status kartu menggunakan jalur operator manual yang sama seperti saat menyeret kartu di dasbor. Perintah ini menerima ID kartu lengkap atau prefiks yang tidak ambigu. Penangguhan dependensi dan jadwal yang aktif tetap berlaku. Operator dapat memindahkan kartu yang telah diklaim tanpa token klaim agennya; token klaim tetap terbatas pada mutasi alat agen dan disamarkan dari keluaran JSON.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --max-starts 10
openclaw workboard dispatch --admin
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` mula-mula memanggil metode RPC `workboard.cards.dispatch` pada Gateway yang sedang berjalan, yang menggunakan runtime subagen yang sama dengan tindakan pengiriman dasbor, sehingga kartu yang siap menjadi proses pekerja terlacak tugas dengan kunci sesi tertaut. `--max-starts` menggunakan metode tambahan `workboard.cards.dispatchWithOptions` sehingga Gateway lama menolak opsi tersebut sebelum memulai pekerja apa pun; mulai ulang Gateway setelah peningkatan sebelum menggunakan flag tersebut. Kartu dengan agen yang ditetapkan menggunakan kunci sesi subagen yang tercakup untuk agen; kartu tanpa agen yang ditetapkan mempertahankan kunci subagen tanpa cakupan agar agen default yang dikonfigurasi pada Gateway tetap digunakan.

Perulangan pengiriman:

1. Menaikkan anak yang dependensinya siap ke `ready`.
2. Memblokir klaim yang kedaluwarsa atau proses pekerja yang kehabisan waktu.
3. Mencatat metadata pengiriman pada kartu yang siap.
4. Memilih sekumpulan kecil kartu siap yang belum diklaim.
5. Mengklaim setiap kartu yang dipilih untuk pengirim atau agen yang ditetapkan.
6. Memulai proses pekerja subagen dengan konteks kartu terbatas dan token klaim kartu.
7. Menyimpan ID proses pekerja, kunci sesi, keterkaitan tugas saat buku besar tugas Gateway melaporkannya, status eksekusi, dan log pekerja pada kartu.

Pemilihan dilakukan secara konservatif: secara default, satu pengiriman memulai paling banyak tiga pekerja, melewati kartu yang diarsipkan atau sudah diklaim, dan hanya memulai satu kartu per pemilik atau agen dalam satu putaran. Kartu yang sudah dimiliki oleh pekerjaan aktif yang sedang berjalan atau dalam peninjauan dibiarkan untuk pengiriman berikutnya. Gunakan `--max-starts <count>` dengan bilangan bulat positif untuk mengubah batas per putaran; aturan satu kartu per pemilik tetap berlaku, sehingga jumlah mulai yang efektif dapat lebih rendah.

Jika pekerja gagal dimulai setelah kartu diklaim, Workboard memblokir kartu tersebut, menghapus klaim, dan mencatat kegagalan dalam metadata eksekusi kartu serta log pekerja, sehingga kegagalan memulai tetap terlihat alih-alih diam-diam mengembalikan kartu ke antrean.

Jika tidak ada target Gateway eksplisit yang diberikan dan Gateway lokal tidak tersedia atau belum menyediakan metode pengiriman Workboard, CLI beralih ke pengiriman khusus data terhadap status Workboard lokal. Pengiriman khusus data tetap dapat menaikkan dependensi, membersihkan klaim kedaluwarsa, dan memblokir proses yang kehabisan waktu, tetapi tidak memulai pekerja. Kegagalan autentikasi, izin, dan validasi, serta kegagalan untuk target `--url` atau `--token` eksplisit, dilaporkan secara langsung alih-alih memicu peralihan tersebut.

Keluaran teks melaporkan pekerja yang dimulai:

```text
pengiriman selesai: dimulai=2 kegagalan=0
```

Keluaran peralihan bersifat eksplisit:

```text
gateway tidak tersedia; hanya pengiriman data: dinaikkan=1 diblokir=0
```

Keluaran JSON menyertakan hasil pengiriman. Pengiriman yang didukung Gateway dapat menyertakan `started` dan `startFailures`; peralihan khusus data menyertakan `gatewayUnavailable: true`. Token klaim disamarkan dari keluaran JSON kartu.

Di dasbor, hasil pengiriman yang sama ditampilkan sebagai ringkasan singkat agar operator dapat melihat jumlah kartu yang dimulai, dinaikkan, diblokir, diklaim kembali, atau gagal tanpa membuka detail kartu.

## Kesetaraan perintah garis miring

Saluran yang mendukung perintah dapat menggunakan perintah garis miring yang sesuai:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Perbaiki Heartbeat pekerja yang kedaluwarsa
/workboard move 7f4a2c10 --status review
/workboard dispatch
```

Pengiriman melalui perintah garis miring juga menggunakan runtime subagen Gateway, sehingga mengikuti perilaku klaim, permulaan pekerja, dan kegagalan yang sama dengan jalur Gateway pada dasbor dan CLI.

`/workboard list` dan `/workboard show` adalah perintah baca untuk pengirim perintah yang diotorisasi. `/workboard create`, `/workboard move`, dan `/workboard dispatch` mengubah status papan dan memerlukan status pemilik pada antarmuka percakapan atau klien Gateway dengan `operator.write` atau `operator.admin`.

## Izin

Jalur pengiriman CLI biasanya meminta cakupan Gateway `operator.write` dan `operator.read`. Kartu yang terikat ruang kerja berjalan langsung dalam ruang kerja agen terkonfigurasi yang persis sesuai; permintaan worktree dibatasi ke direktori tersebut alih-alih mengizinkan host mewujudkan kode yang dikendalikan repositori. Pekerja yang dipilih harus memiliki akses sandbox Docker yang dapat ditulisi dan tidak dibagikan ke ruang kerja yang persis sama, hash kontainer aktif yang cocok dengan mount dan kebijakan yang diminta, serta tanpa kemampuan keluar ke host. Gunakan `--admin` untuk secara eksplisit meminta `operator.admin`, mengizinkan checkout host lain, dan menggunakan penyiapan worktree terkelola biasa; koneksi gagal jika cakupan tersebut tidak disetujui untuk klien. Token Gateway hanya-baca dapat memeriksa data Workboard melalui metode baca, tetapi tidak dapat membuat kartu atau mengirimkan pekerja. Batas ruang kerja selain itu tidak mengubah pemindahan kartu manual bagi pemanggil yang memiliki izin mutasi Workboard.

Perintah lokal `list`, `create`, `show`, dan `move` beroperasi pada direktori status OpenClaw lokal yang digunakan oleh profil saat ini. Gunakan `--dev` atau `--profile <name>` pada perintah tingkat atas `openclaw` saat memerlukan root status yang berbeda.

## Pemecahan masalah

### Tidak ada kartu yang muncul

Pastikan Plugin diaktifkan untuk profil dan root status yang sama:

```bash
openclaw plugins inspect workboard --runtime --json
```

Jika dasbor menampilkan kartu tetapi CLI tidak, periksa bahwa kedua perintah menggunakan pengaturan `--dev` atau `--profile` yang sama.

### Pengiriman menyatakan khusus data

Mulai atau mulai ulang Gateway:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Kemudian coba lagi `openclaw workboard dispatch`. Peralihan khusus data berguna untuk pembersihan status lokal, tetapi proses pekerja memerlukan Gateway aktif.

### Pengiriman tidak memulai apa pun

Periksa apakah ada setidaknya satu kartu `ready` tanpa klaim aktif:

```bash
openclaw workboard list --status ready
```

Kartu juga dapat dilewati ketika pemilik yang sama sudah memiliki pekerjaan yang sedang berjalan atau dalam peninjauan. Pindahkan pekerjaan yang selesai ke `done`, lepaskan klaim kedaluwarsa melalui alat Workboard, atau jalankan kembali pengiriman setelah pekerja aktif selesai.

## Terkait

- [Plugin Workboard](/id/plugins/workboard)
- [Referensi CLI](/id/cli)
- [Perintah garis miring](/id/tools/slash-commands)
- [Control UI](/id/web/control-ui)
