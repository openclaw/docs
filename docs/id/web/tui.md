---
read_when:
    - Anda menginginkan panduan langkah demi langkah TUI yang ramah untuk pemula
    - Anda memerlukan daftar lengkap fitur, perintah, dan pintasan TUI
summary: 'Antarmuka Terminal (TUI): terhubung ke Gateway atau berjalan secara lokal dalam mode tertanam'
title: TUI
x-i18n:
    generated_at: "2026-06-27T18:23:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed02875ea5dcb8cef987d16fe11701eba11160525caf9791f74c610b1b6bec6e
    source_path: web/tui.md
    workflow: 16
---

## Mulai cepat

### Mode Gateway

1. Mulai Gateway.

```bash
openclaw gateway
```

2. Buka TUI.

```bash
openclaw tui
```

3. Ketik pesan dan tekan Enter.

Gateway jarak jauh:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gunakan `--password` jika Gateway Anda menggunakan autentikasi kata sandi.

### Mode lokal

Jalankan TUI tanpa Gateway:

```bash
openclaw chat
# or
openclaw tui --local
```

Catatan:

- `openclaw chat` dan `openclaw terminal` adalah alias untuk `openclaw tui --local`.
- `--local` tidak dapat digabungkan dengan `--url`, `--token`, atau `--password`.
- Mode lokal menggunakan runtime agen tertanam secara langsung. Sebagian besar alat lokal berfungsi, tetapi fitur khusus Gateway tidak tersedia.
- Setelah file konfigurasi memiliki pengaturan yang dibuat, `openclaw` dan `openclaw crestodian` juga menggunakan shell TUI ini, dengan Crestodian sebagai backend chat penyiapan dan perbaikan lokal.

## Yang Anda lihat

- Header: URL koneksi, agen saat ini, sesi saat ini.
- Log chat: pesan pengguna, balasan asisten, pemberitahuan sistem, kartu alat.
- Baris status: status koneksi/jalankan (menghubungkan, berjalan, streaming, diam, error).
- Footer: agen + sesi + model + status tujuan + think/fast/verbose/trace/reasoning + jumlah token + deliver. Saat `tui.footer.showRemoteHost` diaktifkan, koneksi Gateway jarak jauh juga menampilkan host koneksi.
- Input: editor teks dengan pelengkapan otomatis.

## Model mental: agen + sesi

- Agen adalah slug unik (mis. `main`, `research`). Gateway mengekspos daftarnya.
- Sesi milik agen saat ini.
- Kunci sesi disimpan sebagai `agent:<agentId>:<sessionKey>`.
  - Jika Anda mengetik `/session main`, TUI memperluasnya menjadi `agent:<currentAgent>:main`.
  - Jika Anda mengetik `/session agent:other:main`, Anda beralih ke sesi agen tersebut secara eksplisit.
- Cakupan sesi:
  - `per-sender` (default): setiap agen memiliki banyak sesi.
  - `global`: TUI selalu menggunakan sesi `global` (pemilih mungkin kosong).
- Agen + sesi saat ini selalu terlihat di footer.
- Untuk menampilkan host Gateway untuk koneksi berbasis URL non-lokal, aktifkan dengan:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Koneksi loopback dan lokal tertanam tidak pernah menampilkan label host.

- Jika sesi memiliki [tujuan](/id/tools/goal), footer menampilkan status ringkasnya
  seperti `Pursuing goal`, `Goal paused (/goal resume)`, atau
  `Goal achieved`.
- Saat dimulai tanpa `--session`, TUI mode Gateway melanjutkan sesi terakhir yang dipilih untuk gateway, agen, dan cakupan sesi yang sama jika sesi itu masih ada. Meneruskan `--session`, `/session`, `/new`, atau `/reset` tetap eksplisit.

## Pengiriman + delivery

- Pesan dikirim ke Gateway; delivery ke penyedia nonaktif secara default.
- TUI adalah permukaan sumber internal seperti WebChat, bukan kanal keluar generik. Harness yang memerlukan `tools.message` untuk balasan terlihat dapat memenuhi giliran TUI aktif dengan `message.send` tanpa target; delivery penyedia eksplisit tetap menggunakan kanal terkonfigurasi normal dan tidak pernah fallback ke `lastChannel`.
- Aktifkan delivery:
  - `/deliver on`
  - atau panel Settings
  - atau mulai dengan `openclaw tui --deliver`

## Pemilih + overlay

- Pemilih model: daftar model yang tersedia dan tetapkan override sesi.
- Pemilih agen: pilih agen yang berbeda.
- Pemilih sesi: menampilkan hingga 50 sesi untuk agen saat ini yang diperbarui dalam 7 hari terakhir. Gunakan `/session <key>` untuk melompat ke sesi lama yang diketahui.
- Settings: ubah delivery, perluasan output alat, dan visibilitas berpikir.

## Pintasan keyboard

- Enter: kirim pesan
- Esc: batalkan proses aktif
- Ctrl+C: bersihkan input (tekan dua kali untuk keluar)
- Ctrl+D: keluar
- Ctrl+L: pemilih model
- Ctrl+G: pemilih agen
- Ctrl+P: pemilih sesi
- Ctrl+O: ubah perluasan output alat
- Ctrl+T: ubah visibilitas berpikir (memuat ulang riwayat)

## Perintah slash

Inti:

- `/help`
- `/status`
- `/agent <id>` (atau `/agents`)
- `/session <key>` (atau `/sessions`)
- `/model <provider/model>` (atau `/models`)

Kontrol sesi:

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` menghapus override sesi)
- `/goal [status] | /goal start <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Siklus hidup sesi:

- `/new` atau `/reset` (reset sesi)
- `/abort` (batalkan proses aktif)
- `/settings`
- `/exit`

Hanya mode lokal:

- `/auth [provider]` membuka alur autentikasi/login penyedia di dalam TUI.

Perintah slash Gateway lainnya (misalnya, `/context`) diteruskan ke Gateway dan ditampilkan sebagai output sistem. Lihat [Perintah slash](/id/tools/slash-commands).

## Perintah shell lokal

- Awali baris dengan `!` untuk menjalankan perintah shell lokal pada host TUI.
- TUI meminta izin sekali per sesi untuk mengizinkan eksekusi lokal; menolak membuat `!` tetap dinonaktifkan untuk sesi.
- Perintah berjalan dalam shell baru non-interaktif di direktori kerja TUI (tanpa `cd`/env persisten).
- Perintah shell lokal menerima `OPENCLAW_SHELL=tui-local` di lingkungannya.
- `!` tunggal dikirim sebagai pesan normal; spasi di awal tidak memicu eksekusi lokal.

## Perbaiki konfigurasi dari TUI lokal

Gunakan mode lokal saat konfigurasi saat ini sudah valid dan Anda ingin
agen tertanam memeriksanya di mesin yang sama, membandingkannya dengan dokumentasi,
dan membantu memperbaiki drift tanpa bergantung pada Gateway yang berjalan.

Jika `openclaw config validate` sudah gagal, mulai dengan `openclaw configure`
atau `openclaw doctor --fix` terlebih dahulu. `openclaw chat` tidak melewati penjaga konfigurasi tidak valid.

Loop umum:

1. Mulai mode lokal:

```bash
openclaw chat
```

2. Minta agen memeriksa yang Anda inginkan, misalnya:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Gunakan perintah shell lokal untuk bukti dan validasi yang tepat:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Terapkan perubahan sempit dengan `openclaw config set` atau `openclaw configure`, lalu jalankan ulang `!openclaw config validate`.
5. Jika Doctor merekomendasikan migrasi atau perbaikan otomatis, tinjau dan jalankan `!openclaw doctor --fix`.

Tips:

- Lebih pilih `openclaw config set` atau `openclaw configure` daripada mengedit `openclaw.json` secara manual.
- `openclaw docs "<query>"` mencari indeks dokumentasi live dari mesin yang sama.
- `openclaw config validate --json` berguna saat Anda menginginkan skema terstruktur dan error SecretRef/keterpecahan resolusi.

## Output alat

- Panggilan alat ditampilkan sebagai kartu dengan argumen + hasil.
- Ctrl+O beralih antara tampilan diciutkan/diperluas.
- Saat alat berjalan, pembaruan parsial mengalir ke kartu yang sama.

## Warna terminal

- TUI mempertahankan teks isi asisten dalam warna latar depan default terminal Anda agar terminal gelap dan terang tetap mudah dibaca.
- Jika terminal Anda menggunakan latar belakang terang dan deteksi otomatis salah, tetapkan `OPENCLAW_THEME=light` sebelum meluncurkan `openclaw tui`.
- Untuk memaksa palet gelap asli sebagai gantinya, tetapkan `OPENCLAW_THEME=dark`.

## Riwayat + streaming

- Saat tersambung, TUI memuat riwayat terbaru (default 200 pesan).
- Respons streaming diperbarui di tempat hingga difinalisasi.
- TUI juga mendengarkan event alat agen untuk kartu alat yang lebih kaya.

## Detail koneksi

- TUI mendaftar ke Gateway sebagai `mode: "tui"`.
- Koneksi ulang menampilkan pesan sistem; celah event ditampilkan di log.

## Opsi

- `--local`: Jalankan terhadap runtime agen tertanam lokal
- `--url <url>`: URL WebSocket Gateway (default ke konfigurasi atau `ws://127.0.0.1:<port>`)
- `--token <token>`: Token Gateway (jika diperlukan)
- `--password <password>`: Kata sandi Gateway (jika diperlukan)
- `--session <key>`: Kunci sesi (default: `main`, atau `global` saat cakupan global)
- `--deliver`: Kirim balasan asisten ke penyedia (default nonaktif)
- `--thinking <level>`: Override tingkat berpikir untuk pengiriman
- `--message <text>`: Kirim pesan awal setelah tersambung
- `--timeout-ms <ms>`: Timeout agen dalam ms (default ke `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Entri riwayat yang akan dimuat (default `200`)

<Warning>
Saat Anda menetapkan `--url`, TUI tidak fallback ke kredensial konfigurasi atau lingkungan. Teruskan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang hilang adalah error. Dalam mode lokal, jangan teruskan `--url`, `--token`, atau `--password`.
</Warning>

## Pemecahan masalah

Tidak ada output setelah mengirim pesan:

- Jalankan `/status` di TUI untuk memastikan Gateway tersambung dan diam/sibuk.
- Periksa log Gateway: `openclaw logs --follow`.
- Pastikan agen dapat berjalan: `openclaw status` dan `openclaw models status`.
- Jika Anda mengharapkan pesan di kanal chat, aktifkan delivery (`/deliver on` atau `--deliver`).

## Pemecahan masalah koneksi

- `disconnected`: pastikan Gateway berjalan dan `--url/--token/--password` Anda benar.
- Tidak ada agen di pemilih: periksa `openclaw agents list` dan konfigurasi perutean Anda.
- Pemilih sesi kosong: Anda mungkin berada dalam cakupan global atau belum memiliki sesi.

## Terkait

- [Control UI](/id/web/control-ui) — antarmuka kontrol berbasis web
- [Config](/id/cli/config) — periksa, validasi, dan edit `openclaw.json`
- [Doctor](/id/cli/doctor) — pemeriksaan perbaikan terpandu dan migrasi
- [Referensi CLI](/id/cli) — referensi perintah CLI lengkap
