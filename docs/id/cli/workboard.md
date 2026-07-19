---
read_when:
    - Anda ingin memeriksa atau membuat kartu Workboard dari terminal
    - Anda ingin menjalankan proses worker Workboard dari CLI
    - Anda sedang men-debug perilaku CLI atau perintah garis miring Workboard
summary: Referensi CLI untuk kartu `openclaw workboard`, dispatch, dan eksekusi worker
title: CLI Papan Kerja
x-i18n:
    generated_at: "2026-07-19T16:35:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 640260ea6f5959b3aee1cdce76f2501097bff79e9bf1741bdd9ff7a8b43e1a7f
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` adalah antarmuka terminal untuk [Plugin Workboard](/id/plugins/workboard) bawaan. Perintah ini memungkinkan operator mencantumkan kartu, membuat kartu, memeriksa satu kartu, dan meminta Gateway yang sedang berjalan untuk mengirimkan pekerjaan yang siap ke proses kerja subagen.

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

Perintah membaca dan menulis basis data SQLite milik Plugin yang sama dengan yang digunakan oleh dasbor dan alat agen Workboard. ID kartu adalah UUID; perintah yang menerima ID kartu juga menerima awalan ID yang tidak ambigu (keluaran teks ringkas menampilkan 8 karakter pertama).

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

Kolomnya adalah awalan ID, status, prioritas, ID papan, ID agen opsional, dan judul.

| Flag                 | Tujuan                                        |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | Batasi hasil ke satu namespace papan          |
| `--status <status>`  | Batasi hasil ke satu status Workboard         |
| `--include-archived` | Sertakan kartu yang diarsipkan dalam keluaran teks ringkas |
| `--json`             | Cetak daftar kartu lengkap sebagai JSON mesin |

Keluaran teks ringkas menyembunyikan kartu yang diarsipkan secara default agar CLI sesuai dengan `/workboard list`. Teruskan `--include-archived` untuk menampilkannya. Keluaran JSON selalu mempertahankan daftar kartu lengkap, termasuk kartu yang diarsipkan, untuk automasi yang sudah ada.

## `create`

```bash
openclaw workboard create "Perbaiki Heartbeat pekerja yang kedaluwarsa" --priority high --labels bug,workboard
openclaw workboard create "Tulis dokumentasi Workboard" --status ready --agent docs-agent --board docs --notes "Bahas CLI, perintah garis miring, pengiriman, dan status SQLite."
```

| Flag                    | Tujuan                                  |
| ----------------------- | --------------------------------------- |
| `--notes <text>`        | Catatan awal kartu                      |
| `--status <status>`     | Status awal, default `todo`           |
| `--priority <priority>` | Prioritas, default `normal`             |
| `--agent <id>`          | Tetapkan kartu kepada ID agen atau pemilik |
| `--board <id>`          | Simpan kartu pada namespace papan       |
| `--labels <items>`      | Label yang dipisahkan koma              |
| `--json`                | Cetak kartu yang dibuat sebagai JSON mesin |

`create` menulis langsung ke status SQLite Workboard. Kartu langsung terlihat di tab Workboard Control UI dan oleh alat Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

Keluaran teks mencetak baris kartu ringkas dan catatan. Keluaran JSON mengembalikan catatan kartu lengkap, termasuk metadata eksekusi, percobaan, komentar, tautan, bukti, artefak, log pekerja, status protokol, diagnostik, dan metadata automasi.

Status bukti dalam JSON adalah hasil yang dilaporkan oleh pekerja. `passed` mencatat
penilaian mandiri pekerja terhadap perintah atau pemeriksaan yang dilampirkan; ini bukan hasil
verifikasi independen.

## `move`

```bash
openclaw workboard move 7f4a2c10 --status review
openclaw workboard move 7f4a2c10 --status done --json
```

`move` mengubah status kartu menggunakan jalur operator manual yang sama seperti saat menyeret kartu di dasbor. Perintah ini menerima ID kartu lengkap atau awalan yang tidak ambigu. Penahanan dependensi dan jadwal yang aktif tetap berlaku. Operator dapat memindahkan kartu yang telah diklaim tanpa token klaim agennya; token klaim tetap dibatasi untuk mutasi alat agen dan disamarkan dari keluaran JSON.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --max-starts 10
openclaw workboard dispatch --admin
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` pertama-tama memanggil metode RPC Gateway yang sedang berjalan, yaitu `workboard.cards.dispatch`, yang menggunakan runtime subagen yang sama dengan tindakan pengiriman dasbor, sehingga kartu yang siap menjadi proses kerja yang dilacak sebagai tugas dengan kunci sesi tertaut. `--max-starts` menggunakan metode aditif `workboard.cards.dispatchWithOptions` agar Gateway lama menolak opsi sebelum memulai pekerja apa pun; mulai ulang Gateway setelah peningkatan sebelum menggunakan flag tersebut. Kartu dengan agen yang ditetapkan menggunakan kunci sesi subagen yang dibatasi untuk agen; kartu yang belum ditetapkan mempertahankan kunci subagen tanpa cakupan agar agen default yang dikonfigurasi pada Gateway tetap digunakan.

Perulangan pengiriman:

1. Menaikkan status turunan yang dependensinya siap menjadi `ready`.
2. Memblokir klaim kedaluwarsa atau proses kerja yang kehabisan waktu.
3. Mencatat metadata pengiriman pada kartu yang siap.
4. Memilih sejumlah kecil kartu siap yang belum diklaim.
5. Mengklaim setiap kartu yang dipilih untuk pengirim atau agen yang ditetapkan.
6. Memulai proses kerja subagen dengan konteks kartu terbatas dan token klaim kartu.
7. Menyimpan ID proses kerja, kunci sesi, keterkaitan tugas saat dilaporkan oleh buku besar tugas Gateway, status eksekusi, dan log pekerja pada kartu.

Pemilihan bersifat konservatif: satu pengiriman memulai paling banyak tiga pekerja secara default, melewati kartu yang diarsipkan atau sudah diklaim, dan hanya memulai satu kartu per pemilik atau agen dalam satu lintasan. Kartu yang sudah dimiliki oleh pekerjaan aktif yang sedang berjalan atau sedang ditinjau ditinggalkan untuk pengiriman berikutnya. Teruskan `--max-starts <count>` dengan bilangan bulat positif untuk mengubah batas per lintasan; aturan satu kartu per pemilik tetap berlaku, sehingga jumlah mulai yang efektif dapat lebih rendah.

Jika pekerja gagal dimulai setelah kartu diklaim, Workboard memblokir kartu tersebut, menghapus klaim, dan mencatat kegagalan dalam metadata eksekusi kartu dan log pekerja, sehingga kegagalan mulai tetap terlihat alih-alih secara diam-diam mengembalikan kartu ke antrean.

Jika tidak ada target Gateway eksplisit yang diberikan dan Gateway lokal tidak tersedia atau belum mengekspos metode pengiriman Workboard, CLI beralih ke pengiriman khusus data terhadap status Workboard lokal. Pengiriman khusus data tetap dapat menaikkan dependensi, membersihkan klaim kedaluwarsa, dan memblokir proses yang kehabisan waktu, tetapi tidak memulai pekerja. Kegagalan autentikasi, izin, dan validasi, serta kegagalan untuk target `--url` atau `--token` yang eksplisit, dilaporkan langsung alih-alih memicu fallback.

Keluaran teks melaporkan pekerja yang dimulai:

```text
pengiriman selesai: dimulai=2 kegagalan=0
```

Keluaran fallback bersifat eksplisit:

```text
gateway tidak tersedia; hanya pengiriman data: dinaikkan=1 diblokir=0
```

Keluaran JSON menyertakan hasil pengiriman. Pengiriman yang didukung Gateway dapat menyertakan `started` dan `startFailures`; fallback khusus data menyertakan `gatewayUnavailable: true`. Token klaim disamarkan dari keluaran JSON kartu.

Di dasbor, hasil pengiriman yang sama ditampilkan sebagai ringkasan singkat agar operator dapat melihat jumlah kartu yang dimulai, dinaikkan, diblokir, diklaim kembali, atau gagal tanpa membuka detail kartu.

## Kesetaraan perintah garis miring

Channel yang mendukung perintah dapat menggunakan perintah garis miring yang sesuai:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Perbaiki Heartbeat pekerja yang kedaluwarsa
/workboard move 7f4a2c10 --status review
/workboard dispatch
```

Pengiriman melalui perintah garis miring juga menggunakan runtime subagen Gateway, sehingga mengikuti perilaku klaim, mulai pekerja, dan kegagalan yang sama seperti jalur Gateway dasbor dan CLI.

`/workboard list` dan `/workboard show` adalah perintah baca untuk pengirim perintah yang berwenang. `/workboard create`, `/workboard move`, dan `/workboard dispatch` memutasi status papan dan memerlukan status pemilik pada antarmuka obrolan atau klien Gateway dengan `operator.write` atau `operator.admin`.

## Izin

Jalur pengiriman CLI biasanya meminta cakupan Gateway `operator.write` dan `operator.read`. Kartu yang terikat ke ruang kerja berjalan langsung di ruang kerja agen terkonfigurasi yang tepat; permintaan worktree dipersempit ke direktori tersebut alih-alih mengizinkan host mewujudkan kode yang dikendalikan repositori. Pekerja yang dipilih harus memiliki akses sandbox Docker yang dapat ditulis dan tidak dibagikan ke ruang kerja tersebut secara tepat, hash kontainer aktif yang cocok dengan mount dan kebijakan yang diminta, serta tidak memiliki kemampuan untuk keluar ke host. Teruskan `--admin` untuk secara eksplisit meminta `operator.admin`, mengizinkan checkout host lain, dan menggunakan penyiapan worktree terkelola yang normal; koneksi gagal jika cakupan tersebut tidak disetujui untuk klien. Token Gateway hanya-baca dapat memeriksa data Workboard melalui metode baca, tetapi tidak dapat membuat kartu atau mengirim pekerja. Batas ruang kerja tidak mengubah pemindahan kartu manual untuk pemanggil yang memiliki izin mutasi Workboard.

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

Kemudian coba lagi `openclaw workboard dispatch`. Fallback khusus data berguna untuk pembersihan status lokal, tetapi proses kerja memerlukan Gateway aktif.

### Pengiriman tidak memulai apa pun

Periksa bahwa setidaknya ada satu kartu `ready` tanpa klaim aktif:

```bash
openclaw workboard list --status ready
```

Kartu juga dapat dilewati ketika pemilik yang sama sudah memiliki pekerjaan yang sedang berjalan atau sedang ditinjau. Pindahkan pekerjaan yang selesai ke `done`, lepaskan klaim kedaluwarsa melalui alat Workboard, atau jalankan pengiriman lagi setelah pekerja aktif selesai.

## Terkait

- [Plugin Workboard](/id/plugins/workboard)
- [Referensi CLI](/id/cli)
- [Perintah garis miring](/id/tools/slash-commands)
- [Control UI](/id/web/control-ui)
