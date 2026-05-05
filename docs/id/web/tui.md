---
read_when:
    - Anda menginginkan panduan langkah demi langkah TUI yang ramah bagi pemula
    - Anda memerlukan daftar lengkap fitur, perintah, dan pintasan TUI
summary: 'Antarmuka Terminal (TUI): sambungkan ke Gateway atau jalankan secara lokal dalam mode tertanam'
title: TUI
x-i18n:
    generated_at: "2026-05-05T09:28:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b517ff434cc440aeffd8698df75d4d85c22a19e59b38a1f2383e58e1b4084ff
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
- `openclaw` dan `openclaw crestodian` juga menggunakan shell TUI ini, dengan Crestodian sebagai backend chat penyiapan dan perbaikan lokal.

## Yang Anda lihat

- Header: URL koneksi, agen saat ini, sesi saat ini.
- Log chat: pesan pengguna, balasan asisten, pemberitahuan sistem, kartu alat.
- Baris status: status koneksi/jalankan (menghubungkan, berjalan, streaming, idle, error).
- Footer: status koneksi + agen + sesi + model + think/fast/verbose/trace/reasoning + jumlah token + deliver.
- Input: editor teks dengan pelengkapan otomatis.

## Model mental: agen + sesi

- Agen adalah slug unik (mis. `main`, `research`). Gateway mengekspos daftar tersebut.
- Sesi dimiliki oleh agen saat ini.
- Kunci sesi disimpan sebagai `agent:<agentId>:<sessionKey>`.
  - Jika Anda mengetik `/session main`, TUI memperluasnya menjadi `agent:<currentAgent>:main`.
  - Jika Anda mengetik `/session agent:other:main`, Anda beralih secara eksplisit ke sesi agen tersebut.
- Cakupan sesi:
  - `per-sender` (default): setiap agen memiliki banyak sesi.
  - `global`: TUI selalu menggunakan sesi `global` (pemilih mungkin kosong).
- Agen + sesi saat ini selalu terlihat di footer.
- Saat dimulai tanpa `--session`, TUI mode Gateway melanjutkan sesi terakhir yang dipilih untuk gateway, agen, dan cakupan sesi yang sama jika sesi tersebut masih ada. Meneruskan `--session`, `/session`, `/new`, atau `/reset` tetap eksplisit.

## Pengiriman + deliver

- Pesan dikirim ke Gateway; deliver ke penyedia nonaktif secara default.
- Aktifkan deliver:
  - `/deliver on`
  - atau panel Pengaturan
  - atau mulai dengan `openclaw tui --deliver`

## Pemilih + overlay

- Pemilih model: mencantumkan model yang tersedia dan menetapkan override sesi.
- Pemilih agen: pilih agen lain.
- Pemilih sesi: menampilkan hingga 50 sesi untuk agen saat ini yang diperbarui dalam 7 hari terakhir. Gunakan `/session <key>` untuk melompat ke sesi lama yang sudah diketahui.
- Pengaturan: alihkan deliver, perluasan output alat, dan visibilitas berpikir.

## Pintasan keyboard

- Enter: kirim pesan
- Esc: batalkan jalankan aktif
- Ctrl+C: bersihkan input (tekan dua kali untuk keluar)
- Ctrl+D: keluar
- Ctrl+L: pemilih model
- Ctrl+G: pemilih agen
- Ctrl+P: pemilih sesi
- Ctrl+O: alihkan perluasan output alat
- Ctrl+T: alihkan visibilitas berpikir (memuat ulang riwayat)

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
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Siklus hidup sesi:

- `/new` atau `/reset` (reset sesi)
- `/abort` (batalkan jalankan aktif)
- `/settings`
- `/exit`

Hanya mode lokal:

- `/auth [provider]` membuka alur autentikasi/login penyedia di dalam TUI.

Perintah slash Gateway lainnya (misalnya, `/context`) diteruskan ke Gateway dan ditampilkan sebagai output sistem. Lihat [Perintah slash](/id/tools/slash-commands).

## Perintah shell lokal

- Awali baris dengan `!` untuk menjalankan perintah shell lokal di host TUI.
- TUI meminta izin sekali per sesi untuk mengizinkan eksekusi lokal; menolak membuat `!` tetap dinonaktifkan untuk sesi tersebut.
- Perintah berjalan di shell baru yang non-interaktif di direktori kerja TUI (tidak ada `cd`/env persisten).
- Perintah shell lokal menerima `OPENCLAW_SHELL=tui-local` di lingkungannya.
- `!` tunggal dikirim sebagai pesan normal; spasi di awal tidak memicu eksekusi lokal.

## Memperbaiki konfigurasi dari TUI lokal

Gunakan mode lokal saat konfigurasi saat ini sudah lolos validasi dan Anda ingin
agen tertanam memeriksanya di mesin yang sama, membandingkannya dengan dokumentasi,
dan membantu memperbaiki drift tanpa bergantung pada Gateway yang berjalan.

Jika `openclaw config validate` sudah gagal, mulai dengan `openclaw configure`
atau `openclaw doctor --fix` terlebih dahulu. `openclaw chat` tidak melewati penjaga
konfigurasi yang tidak valid.

Loop umum:

1. Mulai mode lokal:

```bash
openclaw chat
```

2. Minta agen memeriksa hal yang Anda inginkan, misalnya:

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
- `openclaw docs "<query>"` mencari indeks dokumentasi langsung dari mesin yang sama.
- `openclaw config validate --json` berguna saat Anda menginginkan skema terstruktur dan error SecretRef/resolvability.

## Output alat

- Panggilan alat ditampilkan sebagai kartu dengan argumen + hasil.
- Ctrl+O beralih antara tampilan diciutkan/diperluas.
- Saat alat berjalan, pembaruan parsial mengalir ke kartu yang sama.

## Warna terminal

- TUI mempertahankan teks isi asisten dalam foreground default terminal Anda sehingga terminal gelap dan terang tetap mudah dibaca.
- Jika terminal Anda menggunakan latar belakang terang dan deteksi otomatis salah, setel `OPENCLAW_THEME=light` sebelum meluncurkan `openclaw tui`.
- Untuk memaksa palet gelap asli sebagai gantinya, setel `OPENCLAW_THEME=dark`.

## Riwayat + streaming

- Saat terhubung, TUI memuat riwayat terbaru (default 200 pesan).
- Respons streaming diperbarui di tempat hingga selesai.
- TUI juga mendengarkan event alat agen untuk kartu alat yang lebih kaya.

## Detail koneksi

- TUI mendaftar ke Gateway sebagai `mode: "tui"`.
- Koneksi ulang menampilkan pesan sistem; celah event dimunculkan di log.

## Opsi

- `--local`: Jalankan terhadap runtime agen tertanam lokal
- `--url <url>`: URL WebSocket Gateway (default ke konfigurasi atau `ws://127.0.0.1:<port>`)
- `--token <token>`: Token Gateway (jika diperlukan)
- `--password <password>`: Kata sandi Gateway (jika diperlukan)
- `--session <key>`: Kunci sesi (default: `main`, atau `global` saat cakupan global)
- `--deliver`: Kirim balasan asisten ke penyedia (default nonaktif)
- `--thinking <level>`: Override tingkat berpikir untuk pengiriman
- `--message <text>`: Kirim pesan awal setelah terhubung
- `--timeout-ms <ms>`: Timeout agen dalam ms (default ke `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Entri riwayat yang akan dimuat (default `200`)

<Warning>
Saat Anda menyetel `--url`, TUI tidak fallback ke kredensial konfigurasi atau lingkungan. Teruskan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang hilang adalah error. Dalam mode lokal, jangan teruskan `--url`, `--token`, atau `--password`.
</Warning>

## Pemecahan masalah

Tidak ada output setelah mengirim pesan:

- Jalankan `/status` di TUI untuk memastikan Gateway terhubung dan idle/sibuk.
- Periksa log Gateway: `openclaw logs --follow`.
- Pastikan agen dapat berjalan: `openclaw status` dan `openclaw models status`.
- Jika Anda mengharapkan pesan di saluran chat, aktifkan deliver (`/deliver on` atau `--deliver`).

## Pemecahan masalah koneksi

- `disconnected`: pastikan Gateway berjalan dan `--url/--token/--password` Anda benar.
- Tidak ada agen di pemilih: periksa `openclaw agents list` dan konfigurasi routing Anda.
- Pemilih sesi kosong: Anda mungkin berada dalam cakupan global atau belum memiliki sesi.

## Terkait

- [Control UI](/id/web/control-ui) — antarmuka kontrol berbasis web
- [Config](/id/cli/config) — periksa, validasi, dan edit `openclaw.json`
- [Doctor](/id/cli/doctor) — pemeriksaan perbaikan terpandu dan migrasi
- [Referensi CLI](/id/cli) — referensi perintah CLI lengkap
