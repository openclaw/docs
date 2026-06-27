---
read_when:
    - Anda ingin memeriksa atau membuat kartu Workboard dari terminal
    - Anda ingin mengirimkan eksekusi worker Workboard dari CLI
    - Anda sedang men-debug perilaku CLI Workboard atau perintah garis miring
summary: Referensi CLI untuk kartu `openclaw workboard`, dispatch, dan run worker
title: CLI Papan Kerja
x-i18n:
    generated_at: "2026-06-27T17:22:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb6f5ab36b3f1f4d0eb06e5dfa9adbbe9bb14bf2ac389630da7725811ac6f47f
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` adalah permukaan terminal untuk [Plugin Workboard](/id/plugins/workboard)
bawaan. Perintah ini memungkinkan operator mencantumkan kartu, membuat kartu,
memeriksa satu kartu, dan meminta Gateway yang sedang berjalan untuk
mengirimkan pekerjaan siap ke run pekerja subagen.

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

Perintah ini membaca dan menulis database SQLite milik Plugin yang sama yang
digunakan oleh dasbor dan alat agen Workboard. Id kartu dapat diteruskan sebagai
id lengkap atau sebagai prefiks yang tidak ambigu saat sebuah perintah menerima
id kartu.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

Output teks bersifat ringkas:

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

Kolomnya adalah prefiks id, status, prioritas, id board, id agen opsional, dan
judul.

Flag:

| Flag                 | Tujuan                                             |
| -------------------- | -------------------------------------------------- |
| `--board <id>`       | Batasi hasil ke satu namespace board               |
| `--status <status>`  | Batasi hasil ke satu status Workboard              |
| `--include-archived` | Sertakan kartu yang diarsipkan dalam output ringkas |
| `--json`             | Cetak daftar kartu lengkap sebagai JSON mesin      |

Output teks ringkas menyembunyikan kartu yang diarsipkan secara default agar CLI
sesuai dengan perintah `/workboard list`. Teruskan `--include-archived` untuk
menampilkannya. Output JSON mempertahankan daftar kartu lengkap, termasuk kartu
yang diarsipkan, untuk otomatisasi yang sudah ada.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

Flag:

| Flag                    | Tujuan                                      |
| ----------------------- | ------------------------------------------- |
| `--notes <text>`        | Catatan awal kartu                          |
| `--status <status>`     | Status awal, default `todo`                 |
| `--priority <priority>` | Prioritas, default `normal`                 |
| `--agent <id>`          | Tetapkan kartu ke agen atau id pemilik      |
| `--board <id>`          | Simpan kartu pada namespace board           |
| `--labels <items>`      | Label yang dipisahkan koma                  |
| `--json`                | Cetak kartu yang dibuat sebagai JSON mesin  |

`create` menulis langsung ke status SQLite Workboard. Kartu langsung terlihat di
tab Workboard Control UI dan bagi alat Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

Output teks mencetak baris kartu ringkas dan catatan. Output JSON mengembalikan
rekaman kartu lengkap, termasuk metadata eksekusi, percobaan, komentar, tautan,
bukti, artefak, log pekerja, status protokol, diagnostik, dan metadata
otomatisasi.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` terlebih dahulu memanggil metode RPC Gateway yang sedang berjalan
`workboard.cards.dispatch`. Jalur tersebut menggunakan runtime subagen yang sama
seperti tindakan dispatch dasbor, sehingga kartu siap menjadi run pekerja yang
dilacak tugas dengan kunci sesi tertaut. Kartu dengan agen yang ditetapkan
menggunakan kunci sesi subagen bercakupan agen; kartu tanpa penetapan
mempertahankan kunci subagen tanpa cakupan sehingga agen default yang
dikonfigurasi Gateway tetap dipertahankan.

Loop dispatch:

1. Mempromosikan turunan yang dependensinya siap menjadi `ready`.
2. Memblokir klaim yang kedaluwarsa atau run pekerja yang timeout.
3. Merekam metadata dispatch pada kartu siap.
4. Memilih batch kecil kartu siap yang belum diklaim.
5. Mengklaim setiap kartu yang dipilih untuk dispatcher atau agen yang
   ditetapkan.
6. Memulai run pekerja subagen dengan konteks kartu terbatas dan token klaim
   kartu.
7. Menyimpan id run pekerja, kunci sesi, penautan tugas saat ledger tugas Gateway
   melaporkannya, status eksekusi, dan log pekerja pada kartu.

Pemilihan sengaja dibuat konservatif. Satu dispatch memulai paling banyak tiga
pekerja secara default, melewati kartu yang diarsipkan atau sudah diklaim, dan
hanya memulai satu kartu per pemilik atau agen dalam satu lintasan. Kartu yang
sudah dimiliki oleh pekerjaan aktif yang sedang berjalan atau sedang ditinjau
ditinggalkan untuk dispatch berikutnya.

Jika start pekerja gagal setelah kartu diklaim, Workboard memblokir kartu
tersebut, menghapus klaim, dan mencatat kegagalan dalam metadata eksekusi kartu
dan log pekerja. Ini membuat start yang gagal tetap terlihat alih-alih diam-diam
mengembalikan kartu ke antrean.

Jika tidak ada target Gateway eksplisit yang diberikan dan Gateway lokal tidak
tersedia atau belum mengekspos metode dispatch Workboard, CLI beralih ke dispatch
khusus data terhadap status Workboard lokal. Dispatch khusus data masih dapat
mempromosikan dependensi, membersihkan klaim usang, dan memblokir run yang
timeout, tetapi tidak memulai pekerja. Kegagalan autentikasi, izin, validasi,
serta kegagalan untuk target `--url` atau `--token` eksplisit dilaporkan secara
langsung.

Output teks melaporkan start pekerja:

```text
dispatch complete: started=2 failures=0
```

Output fallback bersifat eksplisit:

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

Output JSON menyertakan hasil dispatch. Dispatch yang didukung Gateway dapat
menyertakan `started` dan `startFailures`; fallback khusus data menyertakan
`gatewayUnavailable: true`. Token klaim disamarkan dari output JSON kartu.

Di dasbor, hasil dispatch yang sama ditampilkan sebagai ringkasan pendek sehingga
operator dapat melihat berapa banyak kartu yang dimulai, dipromosikan, diblokir,
direklaim, atau gagal tanpa membuka detail kartu.

## Kesetaraan Perintah Slash

Channel yang mendukung perintah dapat menggunakan perintah slash yang sesuai:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

Dispatch perintah slash juga menggunakan runtime subagen Gateway, sehingga
mengikuti perilaku klaim, start pekerja, dan kegagalan yang sama seperti jalur
Gateway dasbor dan CLI.

`/workboard list` dan `/workboard show` adalah perintah baca untuk pengirim
perintah yang berwenang. `/workboard create` dan `/workboard dispatch` mengubah
status board dan memerlukan status pemilik pada permukaan chat atau klien Gateway
dengan `operator.write` atau `operator.admin`.

## Izin

Jalur dispatch CLI memanggil RPC Gateway dengan cakupan `operator.read` dan
`operator.write`. Token Gateway hanya-baca dapat memeriksa data Workboard melalui
metode baca, tetapi tidak dapat membuat kartu atau mengirimkan pekerja.

Perintah lokal `list`, `create`, dan `show` beroperasi pada direktori status
OpenClaw lokal yang digunakan oleh profil saat ini. Gunakan `--dev` atau
`--profile <name>` pada perintah `openclaw` tingkat atas saat Anda memerlukan
root status yang berbeda.

## Pemecahan Masalah

### Tidak Ada Kartu yang Muncul

Pastikan Plugin diaktifkan untuk profil dan root status yang sama:

```bash
openclaw plugins inspect workboard --runtime --json
```

Jika dasbor menampilkan kartu tetapi CLI tidak, periksa bahwa kedua perintah
menggunakan pengaturan `--dev` atau `--profile` yang sama.

### Dispatch Mengatakan Khusus Data

Mulai atau mulai ulang Gateway:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Lalu coba lagi `openclaw workboard dispatch`. Fallback khusus data berguna untuk
pembersihan status lokal, tetapi run pekerja memerlukan Gateway yang aktif.

### Dispatch Tidak Memulai Apa Pun

Periksa setidaknya ada satu kartu `ready` tanpa klaim aktif:

```bash
openclaw workboard list --status ready
```

Kartu juga dapat dilewati saat pemilik yang sama sudah memiliki pekerjaan yang
sedang berjalan atau sedang ditinjau. Pindahkan pekerjaan selesai ke `done`,
lepaskan klaim usang melalui alat Workboard, atau jalankan dispatch lagi setelah
pekerja aktif selesai.

## Terkait

- [Plugin Workboard](/id/plugins/workboard)
- [Referensi CLI](/id/cli)
- [Perintah slash](/id/tools/slash-commands)
- [Control UI](/id/web/control-ui)
