---
read_when:
    - Anda menginginkan panduan TUI yang ramah untuk pemula
    - Anda memerlukan daftar lengkap fitur, perintah, dan pintasan TUI
summary: 'Antarmuka Terminal (TUI): terhubung ke Gateway atau jalankan secara lokal dalam mode tersemat'
title: TUI
x-i18n:
    generated_at: "2026-04-24T09:34:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6168ab6cec8e0069f660ddcfca03275c407b613b6eb756aa6ef7e97f2312effe
    source_path: web/tui.md
    workflow: 15
---

## Mulai cepat

### Mode Gateway

1. Jalankan Gateway.

```bash
openclaw gateway
```

2. Buka TUI.

```bash
openclaw tui
```

3. Ketik pesan dan tekan Enter.

Gateway remote:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gunakan `--password` jika Gateway Anda menggunakan autentikasi kata sandi.

### Mode lokal

Jalankan TUI tanpa Gateway:

```bash
openclaw chat
# atau
openclaw tui --local
```

Catatan:

- `openclaw chat` dan `openclaw terminal` adalah alias untuk `openclaw tui --local`.
- `--local` tidak dapat digabungkan dengan `--url`, `--token`, atau `--password`.
- Mode lokal menggunakan runtime agen tersemat secara langsung. Sebagian besar alat lokal berfungsi, tetapi fitur khusus Gateway tidak tersedia.

## Yang Anda lihat

- Header: URL koneksi, agen saat ini, sesi saat ini.
- Log chat: pesan pengguna, balasan asisten, pemberitahuan sistem, kartu alat.
- Baris status: status koneksi/eksekusi (menghubungkan, berjalan, streaming, idle, error).
- Footer: status koneksi + agen + sesi + model + think/fast/verbose/trace/reasoning + jumlah token + deliver.
- Input: editor teks dengan autocomplete.

## Model mental: agen + sesi

- Agen adalah slug unik (mis. `main`, `research`). Gateway mengekspos daftarnya.
- Sesi dimiliki oleh agen saat ini.
- Kunci sesi disimpan sebagai `agent:<agentId>:<sessionKey>`.
  - Jika Anda mengetik `/session main`, TUI memperluasnya menjadi `agent:<currentAgent>:main`.
  - Jika Anda mengetik `/session agent:other:main`, Anda beralih ke sesi agen itu secara eksplisit.
- Cakupan sesi:
  - `per-sender` (default): setiap agen memiliki banyak sesi.
  - `global`: TUI selalu menggunakan sesi `global` (picker mungkin kosong).
- Agen + sesi saat ini selalu terlihat di footer.

## Pengiriman + delivery

- Pesan dikirim ke Gateway; delivery ke penyedia dinonaktifkan secara default.
- Aktifkan delivery:
  - `/deliver on`
  - atau panel Settings
  - atau mulai dengan `openclaw tui --deliver`

## Picker + overlay

- Picker model: menampilkan model yang tersedia dan menyetel override sesi.
- Picker agen: pilih agen yang berbeda.
- Picker sesi: hanya menampilkan sesi untuk agen saat ini.
- Settings: toggle deliver, perluasan output alat, dan visibilitas thinking.

## Pintasan keyboard

- Enter: kirim pesan
- Esc: batalkan eksekusi aktif
- Ctrl+C: kosongkan input (tekan dua kali untuk keluar)
- Ctrl+D: keluar
- Ctrl+L: picker model
- Ctrl+G: picker agen
- Ctrl+P: picker sesi
- Ctrl+O: toggle perluasan output alat
- Ctrl+T: toggle visibilitas thinking (memuat ulang riwayat)

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
- `/abort` (batalkan eksekusi aktif)
- `/settings`
- `/exit`

Hanya mode lokal:

- `/auth [provider]` membuka alur autentikasi/login penyedia di dalam TUI.

Perintah slash Gateway lainnya (misalnya, `/context`) diteruskan ke Gateway dan ditampilkan sebagai output sistem. Lihat [Slash commands](/id/tools/slash-commands).

## Perintah shell lokal

- Awali baris dengan `!` untuk menjalankan perintah shell lokal pada host TUI.
- TUI akan meminta izin satu kali per sesi untuk mengizinkan eksekusi lokal; jika ditolak, `!` tetap dinonaktifkan untuk sesi itu.
- Perintah berjalan di shell baru yang non-interaktif di direktori kerja TUI (tanpa `cd`/env yang persisten).
- Perintah shell lokal menerima `OPENCLAW_SHELL=tui-local` dalam lingkungannya.
- `!` tunggal dikirim sebagai pesan normal; spasi di awal tidak memicu eksekusi lokal.

## Memperbaiki konfigurasi dari TUI lokal

Gunakan mode lokal ketika konfigurasi saat ini sudah valid dan Anda ingin agen
tersemat memeriksanya di mesin yang sama, membandingkannya dengan dokumentasi,
dan membantu memperbaiki drift tanpa bergantung pada Gateway yang sedang berjalan.

Jika `openclaw config validate` sudah gagal, mulai dengan `openclaw configure`
atau `openclaw doctor --fix` terlebih dahulu. `openclaw chat` tidak melewati guard
konfigurasi tidak valid.

Alur yang umum:

1. Mulai mode lokal:

```bash
openclaw chat
```

2. Tanyakan kepada agen apa yang ingin Anda periksa, misalnya:

```text
Bandingkan konfigurasi autentikasi gateway saya dengan dokumentasi dan sarankan perbaikan terkecil.
```

3. Gunakan perintah shell lokal untuk bukti dan validasi yang tepat:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. Terapkan perubahan sempit dengan `openclaw config set` atau `openclaw configure`, lalu jalankan ulang `!openclaw config validate`.
5. Jika Doctor merekomendasikan migrasi atau perbaikan otomatis, tinjau lalu jalankan `!openclaw doctor --fix`.

Tips:

- Gunakan `openclaw config set` atau `openclaw configure` alih-alih mengedit `openclaw.json` secara manual.
- `openclaw docs "<query>"` mencari indeks dokumentasi live dari mesin yang sama.
- `openclaw config validate --json` berguna saat Anda menginginkan error skema dan SecretRef/resolvability yang terstruktur.

## Output alat

- Panggilan alat ditampilkan sebagai kartu dengan argumen + hasil.
- Ctrl+O melakukan toggle antara tampilan diringkas/diperluas.
- Saat alat berjalan, pembaruan parsial di-stream ke kartu yang sama.

## Warna terminal

- TUI mempertahankan teks isi asisten dalam warna foreground default terminal Anda agar terminal gelap dan terang tetap mudah dibaca.
- Jika terminal Anda menggunakan latar terang dan deteksi otomatis salah, setel `OPENCLAW_THEME=light` sebelum menjalankan `openclaw tui`.
- Untuk memaksa palet gelap asli, setel `OPENCLAW_THEME=dark`.

## Riwayat + streaming

- Saat terhubung, TUI memuat riwayat terbaru (default 200 pesan).
- Respons streaming diperbarui di tempat hingga difinalisasi.
- TUI juga mendengarkan event alat agen untuk kartu alat yang lebih kaya.

## Detail koneksi

- TUI mendaftar ke Gateway sebagai `mode: "tui"`.
- Reconnect menampilkan pesan sistem; celah event ditampilkan di log.

## Opsi

- `--local`: Jalankan terhadap runtime agen tersemat lokal
- `--url <url>`: URL WebSocket Gateway (default dari konfigurasi atau `ws://127.0.0.1:<port>`)
- `--token <token>`: token Gateway (jika diperlukan)
- `--password <password>`: kata sandi Gateway (jika diperlukan)
- `--session <key>`: kunci sesi (default: `main`, atau `global` saat cakupan global)
- `--deliver`: Kirim balasan asisten ke penyedia (default nonaktif)
- `--thinking <level>`: Override level thinking untuk pengiriman
- `--message <text>`: Kirim pesan awal setelah terhubung
- `--timeout-ms <ms>`: timeout agen dalam ms (default ke `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: entri riwayat yang dimuat (default `200`)

Catatan: saat Anda menyetel `--url`, TUI tidak melakukan fallback ke kredensial konfigurasi atau environment.
Berikan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang tidak ada adalah error.
Dalam mode lokal, jangan berikan `--url`, `--token`, atau `--password`.

## Pemecahan masalah

Tidak ada output setelah mengirim pesan:

- Jalankan `/status` di TUI untuk memastikan Gateway terhubung dan idle/sibuk.
- Periksa log Gateway: `openclaw logs --follow`.
- Pastikan agen dapat berjalan: `openclaw status` dan `openclaw models status`.
- Jika Anda mengharapkan pesan di channel chat, aktifkan delivery (`/deliver on` atau `--deliver`).

## Pemecahan masalah koneksi

- `disconnected`: pastikan Gateway berjalan dan `--url/--token/--password` Anda benar.
- Tidak ada agen di picker: periksa `openclaw agents list` dan konfigurasi routing Anda.
- Picker sesi kosong: Anda mungkin berada dalam cakupan global atau belum memiliki sesi.

## Terkait

- [Control UI](/id/web/control-ui) — antarmuka kontrol berbasis web
- [Config](/id/cli/config) — periksa, validasi, dan edit `openclaw.json`
- [Doctor](/id/cli/doctor) — pemeriksaan perbaikan dan migrasi terpandu
- [CLI Reference](/id/cli) — referensi lengkap perintah CLI
