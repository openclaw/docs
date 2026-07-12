---
read_when:
    - Anda ingin memeriksa atau membuat kartu Workboard dari terminal
    - Anda ingin menjalankan pekerja Workboard dari CLI
    - Anda sedang melakukan debug terhadap perilaku CLI Workboard atau perintah garis miring
summary: Referensi CLI untuk kartu, pengiriman, dan eksekusi worker `openclaw workboard`
title: CLI Papan Kerja
x-i18n:
    generated_at: "2026-07-12T14:03:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c62dd10aff146cae9f7475423148cf61fedb39983b065a9815c629349b4e233
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` adalah antarmuka terminal untuk [Plugin Workboard](/id/plugins/workboard) bawaan. Perintah ini memungkinkan operator mencantumkan kartu, membuat kartu, memeriksa satu kartu, dan meminta Gateway yang sedang berjalan untuk mengirim pekerjaan yang siap ke proses pekerja subagen.

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
openclaw workboard dispatch [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

Perintah ini membaca dan menulis basis data SQLite milik Plugin yang sama dengan yang digunakan oleh dasbor dan alat agen Workboard. ID kartu adalah UUID; perintah yang menerima ID kartu juga menerima prefiks ID yang tidak ambigu (keluaran teks ringkas menampilkan 8 karakter pertama).

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

Kolomnya adalah prefiks ID, status, prioritas, ID papan, ID agen opsional, dan judul.

| Flag                 | Tujuan                                                    |
| -------------------- | --------------------------------------------------------- |
| `--board <id>`       | Batasi hasil ke satu namespace papan                      |
| `--status <status>`  | Batasi hasil ke satu status Workboard                     |
| `--include-archived` | Sertakan kartu yang diarsipkan dalam keluaran teks ringkas |
| `--json`             | Cetak daftar kartu lengkap sebagai JSON untuk mesin       |

Secara default, keluaran teks ringkas menyembunyikan kartu yang diarsipkan agar CLI sesuai dengan `/workboard list`. Gunakan `--include-archived` untuk menampilkannya. Keluaran JSON selalu mempertahankan daftar kartu lengkap, termasuk kartu yang diarsipkan, untuk otomatisasi yang sudah ada.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| Flag                    | Tujuan                                            |
| ----------------------- | ------------------------------------------------- |
| `--notes <text>`        | Catatan awal kartu                                |
| `--status <status>`     | Status awal, default `todo`                       |
| `--priority <priority>` | Prioritas, default `normal`                       |
| `--agent <id>`          | Tetapkan kartu kepada agen atau ID pemilik        |
| `--board <id>`          | Simpan kartu dalam sebuah namespace papan         |
| `--labels <items>`      | Label yang dipisahkan koma                        |
| `--json`                | Cetak kartu yang dibuat sebagai JSON untuk mesin  |

`create` menulis langsung ke status SQLite Workboard. Kartu tersebut langsung terlihat di tab Workboard pada Control UI dan tersedia bagi alat Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

Keluaran teks mencetak baris kartu ringkas dan catatan. Keluaran JSON mengembalikan rekaman kartu lengkap, termasuk metadata eksekusi, percobaan, komentar, tautan, bukti, artefak, log pekerja, status protokol, diagnostik, dan metadata otomatisasi.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` terlebih dahulu memanggil metode RPC `workboard.cards.dispatch` pada Gateway yang sedang berjalan. Metode ini menggunakan runtime subagen yang sama dengan tindakan pengiriman pada dasbor, sehingga kartu yang siap menjadi proses pekerja yang dilacak sebagai tugas dengan kunci sesi tertaut. Kartu yang telah ditetapkan kepada agen menggunakan kunci sesi subagen dalam cakupan agen; kartu yang belum ditetapkan mempertahankan kunci subagen tanpa cakupan sehingga agen default yang dikonfigurasi pada Gateway tetap digunakan.

Perulangan pengiriman:

1. Menaikkan status anak yang dependensinya siap menjadi `ready`.
2. Memblokir klaim yang kedaluwarsa atau proses pekerja yang kehabisan waktu.
3. Merekam metadata pengiriman pada kartu yang siap.
4. Memilih sekumpulan kecil kartu siap yang belum diklaim.
5. Mengklaim setiap kartu yang dipilih untuk pengirim atau agen yang ditetapkan.
6. Memulai proses pekerja subagen dengan konteks kartu terbatas dan token klaim kartu.
7. Menyimpan ID proses pekerja, kunci sesi, keterkaitan tugas ketika dilaporkan oleh buku besar tugas Gateway, status eksekusi, dan log pekerja pada kartu.

Pemilihannya bersifat konservatif: secara default, satu pengiriman memulai paling banyak tiga pekerja, melewati kartu yang diarsipkan atau sudah diklaim, dan hanya memulai satu kartu per pemilik atau agen dalam satu putaran. Kartu yang sudah dimiliki oleh pekerjaan aktif berstatus berjalan atau peninjauan dibiarkan untuk pengiriman berikutnya.

Jika pekerja gagal dimulai setelah kartu diklaim, Workboard memblokir kartu tersebut, menghapus klaim, dan mencatat kegagalan dalam metadata eksekusi kartu serta log pekerja. Dengan demikian, kegagalan memulai tetap terlihat alih-alih mengembalikan kartu ke antrean secara diam-diam.

Jika tidak ada target Gateway eksplisit yang diberikan dan Gateway lokal tidak tersedia atau belum mengekspos metode pengiriman Workboard, CLI beralih ke pengiriman khusus data terhadap status Workboard lokal. Pengiriman khusus data tetap dapat menaikkan status dependensi, membersihkan klaim kedaluwarsa, dan memblokir proses yang kehabisan waktu, tetapi tidak memulai pekerja. Kegagalan autentikasi, izin, dan validasi, serta kegagalan untuk target `--url` atau `--token` eksplisit, dilaporkan secara langsung alih-alih memicu mekanisme cadangan.

Keluaran teks melaporkan pekerja yang dimulai:

```text
pengiriman selesai: dimulai=2 kegagalan=0
```

Keluaran mekanisme cadangan bersifat eksplisit:

```text
gateway tidak tersedia; hanya pengiriman data: dinaikkan=1 diblokir=0
```

Keluaran JSON menyertakan hasil pengiriman. Pengiriman yang didukung Gateway dapat menyertakan `started` dan `startFailures`; mekanisme cadangan khusus data menyertakan `gatewayUnavailable: true`. Token klaim disamarkan dari keluaran JSON kartu.

Di dasbor, hasil pengiriman yang sama ditampilkan sebagai ringkasan singkat agar operator dapat melihat jumlah kartu yang dimulai, dinaikkan statusnya, diblokir, diklaim kembali, atau gagal tanpa membuka detail kartu.

## Kesetaraan perintah garis miring

Kanal yang mendukung perintah dapat menggunakan perintah garis miring yang sesuai:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Perbaiki Heartbeat pekerja yang kedaluwarsa
/workboard dispatch
```

Pengiriman melalui perintah garis miring juga menggunakan runtime subagen Gateway, sehingga mengikuti perilaku klaim, pemulaian pekerja, dan kegagalan yang sama seperti jalur Gateway pada dasbor dan CLI.

`/workboard list` dan `/workboard show` adalah perintah baca bagi pengirim perintah yang berwenang. `/workboard create` dan `/workboard dispatch` mengubah status papan dan memerlukan status pemilik pada antarmuka percakapan atau klien Gateway dengan `operator.write` atau `operator.admin`.

## Izin

Jalur pengiriman CLI memanggil RPC Gateway dengan cakupan `operator.read` dan `operator.write`. Token Gateway hanya-baca dapat memeriksa data Workboard melalui metode baca, tetapi tidak dapat membuat kartu atau mengirim pekerja.

Perintah lokal `list`, `create`, dan `show` beroperasi pada direktori status OpenClaw lokal yang digunakan oleh profil saat ini. Gunakan `--dev` atau `--profile <name>` pada perintah `openclaw` tingkat teratas jika Anda memerlukan akar status yang berbeda.

## Pemecahan masalah

### Tidak ada kartu yang muncul

Pastikan Plugin diaktifkan untuk profil dan akar status yang sama:

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

Kemudian coba lagi `openclaw workboard dispatch`. Mekanisme cadangan khusus data berguna untuk pembersihan status lokal, tetapi proses pekerja memerlukan Gateway yang aktif.

### Pengiriman tidak memulai apa pun

Periksa apakah ada setidaknya satu kartu `ready` tanpa klaim aktif:

```bash
openclaw workboard list --status ready
```

Kartu juga dapat dilewati ketika pemilik yang sama sudah memiliki pekerjaan berstatus berjalan atau peninjauan. Pindahkan pekerjaan yang selesai ke `done`, lepaskan klaim kedaluwarsa melalui alat Workboard, atau jalankan kembali pengiriman setelah pekerja aktif selesai.

## Terkait

- [Plugin Workboard](/id/plugins/workboard)
- [Referensi CLI](/id/cli)
- [Perintah garis miring](/id/tools/slash-commands)
- [Control UI](/id/web/control-ui)
