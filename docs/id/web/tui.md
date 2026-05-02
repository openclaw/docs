---
read_when:
    - Anda ingin panduan langkah demi langkah TUI yang ramah bagi pemula
    - Anda memerlukan daftar lengkap fitur, perintah, dan pintasan TUI
summary: 'Antarmuka Terminal (TUI): hubungkan ke Gateway atau jalankan secara lokal dalam mode tertanam'
title: TUI
x-i18n:
    generated_at: "2026-05-02T09:35:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c13268991bf11eece9984f21eb959e7a5fab7071be6dc3a47855b525bfe80d8
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
- Baris status: status koneksi/jalannya proses (menghubungkan, berjalan, streaming, diam, error).
- Footer: status koneksi + agen + sesi + model + think/fast/verbose/trace/reasoning + jumlah token + deliver.
- Input: editor teks dengan pelengkapan otomatis.

## Model mental: agen + sesi

- Agen adalah slug unik (mis. `main`, `research`). Gateway mengekspos daftarnya.
- Sesi milik agen saat ini.
- Kunci sesi disimpan sebagai `agent:<agentId>:<sessionKey>`.
  - Jika Anda mengetik `/session main`, TUI memperluasnya menjadi `agent:<currentAgent>:main`.
  - Jika Anda mengetik `/session agent:other:main`, Anda beralih secara eksplisit ke sesi agen tersebut.
- Cakupan sesi:
  - `per-sender` (default): setiap agen memiliki banyak sesi.
  - `global`: TUI selalu menggunakan sesi `global` (pemilih mungkin kosong).
- Agen + sesi saat ini selalu terlihat di footer.
- Ketika dimulai tanpa `--session`, TUI mode Gateway melanjutkan sesi terakhir yang dipilih untuk Gateway, agen, dan cakupan sesi yang sama jika sesi tersebut masih ada. Menyertakan `--session`, `/session`, `/new`, atau `/reset` tetap bersifat eksplisit.

## Pengiriman + delivery

- Pesan dikirim ke Gateway; delivery ke penyedia dinonaktifkan secara default.
- Aktifkan delivery:
  - `/deliver on`
  - atau panel Pengaturan
  - atau mulai dengan `openclaw tui --deliver`

## Pemilih + overlay

- Pemilih model: mencantumkan model yang tersedia dan menetapkan override sesi.
- Pemilih agen: pilih agen yang berbeda.
- Pemilih sesi: hanya menampilkan sesi untuk agen saat ini.
- Pengaturan: alihkan delivery, perluasan output alat, dan visibilitas pemikiran.

## Pintasan keyboard

- Enter: kirim pesan
- Esc: batalkan proses aktif
- Ctrl+C: bersihkan input (tekan dua kali untuk keluar)
- Ctrl+D: keluar
- Ctrl+L: pemilih model
- Ctrl+G: pemilih agen
- Ctrl+P: pemilih sesi
- Ctrl+O: alihkan perluasan output alat
- Ctrl+T: alihkan visibilitas pemikiran (memuat ulang riwayat)

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
- `/abort` (batalkan proses aktif)
- `/settings`
- `/exit`

Khusus mode lokal:

- `/auth [provider]` membuka alur autentikasi/login penyedia di dalam TUI.

Perintah slash Gateway lainnya (misalnya, `/context`) diteruskan ke Gateway dan ditampilkan sebagai output sistem. Lihat [Perintah slash](/id/tools/slash-commands).

## Perintah shell lokal

- Awali baris dengan `!` untuk menjalankan perintah shell lokal di host TUI.
- TUI meminta izin satu kali per sesi untuk mengizinkan eksekusi lokal; menolak akan membuat `!` tetap dinonaktifkan untuk sesi tersebut.
- Perintah berjalan di shell baru noninteraktif dalam direktori kerja TUI (tanpa `cd`/env yang persisten).
- Perintah shell lokal menerima `OPENCLAW_SHELL=tui-local` di lingkungannya.
- `!` tunggal dikirim sebagai pesan normal; spasi di awal tidak memicu eksekusi lokal.

## Memperbaiki konfigurasi dari TUI lokal

Gunakan mode lokal ketika konfigurasi saat ini sudah tervalidasi dan Anda ingin
agen tertanam memeriksanya di mesin yang sama, membandingkannya dengan docs,
dan membantu memperbaiki penyimpangan tanpa bergantung pada Gateway yang sedang berjalan.

Jika `openclaw config validate` sudah gagal, mulai dengan `openclaw configure`
atau `openclaw doctor --fix` terlebih dahulu. `openclaw chat` tidak melewati penjaga
konfigurasi tidak valid.

Loop umum:

1. Mulai mode lokal:

```bash
openclaw chat
```

2. Minta agen memeriksa hal yang Anda inginkan, misalnya:

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. Gunakan perintah shell lokal untuk bukti dan validasi yang persis:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Terapkan perubahan sempit dengan `openclaw config set` atau `openclaw configure`, lalu jalankan ulang `!openclaw config validate`.
5. Jika Doctor merekomendasikan migrasi atau perbaikan otomatis, tinjau dan jalankan `!openclaw doctor --fix`.

Tips:

- Lebih utamakan `openclaw config set` atau `openclaw configure` daripada mengedit `openclaw.json` secara manual.
- `openclaw docs "<query>"` mencari indeks docs langsung dari mesin yang sama.
- `openclaw config validate --json` berguna ketika Anda menginginkan skema terstruktur dan error SecretRef/keterpecahan.

## Output alat

- Panggilan alat ditampilkan sebagai kartu dengan argumen + hasil.
- Ctrl+O beralih antara tampilan diciutkan/diperluas.
- Saat alat berjalan, pembaruan parsial di-stream ke kartu yang sama.

## Warna terminal

- TUI mempertahankan teks isi asisten dalam warna latar depan default terminal Anda agar terminal gelap dan terang tetap mudah dibaca.
- Jika terminal Anda menggunakan latar belakang terang dan deteksi otomatis salah, tetapkan `OPENCLAW_THEME=light` sebelum menjalankan `openclaw tui`.
- Untuk memaksa palet gelap asli sebagai gantinya, tetapkan `OPENCLAW_THEME=dark`.

## Riwayat + streaming

- Saat terhubung, TUI memuat riwayat terbaru (default 200 pesan).
- Respons streaming diperbarui di tempat sampai difinalkan.
- TUI juga mendengarkan event alat agen untuk kartu alat yang lebih kaya.

## Detail koneksi

- TUI mendaftar ke Gateway sebagai `mode: "tui"`.
- Koneksi ulang menampilkan pesan sistem; celah event ditampilkan di log.

## Opsi

- `--local`: Jalankan terhadap runtime agen tertanam lokal
- `--url <url>`: URL WebSocket Gateway (default ke konfigurasi atau `ws://127.0.0.1:<port>`)
- `--token <token>`: Token Gateway (jika diperlukan)
- `--password <password>`: Kata sandi Gateway (jika diperlukan)
- `--session <key>`: Kunci sesi (default: `main`, atau `global` ketika cakupannya global)
- `--deliver`: Kirim balasan asisten ke penyedia (default nonaktif)
- `--thinking <level>`: Override tingkat pemikiran untuk pengiriman
- `--message <text>`: Kirim pesan awal setelah terhubung
- `--timeout-ms <ms>`: Timeout agen dalam ms (default ke `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Entri riwayat yang akan dimuat (default `200`)

<Warning>
Ketika Anda menetapkan `--url`, TUI tidak kembali ke kredensial konfigurasi atau lingkungan. Sertakan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang hilang adalah error. Dalam mode lokal, jangan sertakan `--url`, `--token`, atau `--password`.
</Warning>

## Pemecahan masalah

Tidak ada output setelah mengirim pesan:

- Jalankan `/status` di TUI untuk memastikan Gateway terhubung dan diam/sibuk.
- Periksa log Gateway: `openclaw logs --follow`.
- Konfirmasi agen dapat berjalan: `openclaw status` dan `openclaw models status`.
- Jika Anda mengharapkan pesan di saluran chat, aktifkan delivery (`/deliver on` atau `--deliver`).

## Pemecahan masalah koneksi

- `disconnected`: pastikan Gateway berjalan dan `--url/--token/--password` Anda benar.
- Tidak ada agen di pemilih: periksa `openclaw agents list` dan konfigurasi routing Anda.
- Pemilih sesi kosong: Anda mungkin berada dalam cakupan global atau belum memiliki sesi.

## Terkait

- [UI Kontrol](/id/web/control-ui) — antarmuka kontrol berbasis web
- [Konfigurasi](/id/cli/config) — periksa, validasi, dan edit `openclaw.json`
- [Doctor](/id/cli/doctor) — pemeriksaan perbaikan terpandu dan migrasi
- [Referensi CLI](/id/cli) — referensi perintah CLI lengkap
