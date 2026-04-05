---
read_when:
    - Anda menginginkan panduan ramah pemula untuk TUI
    - Anda memerlukan daftar lengkap fitur, perintah, dan shortcut TUI
summary: 'UI Terminal (TUI): terhubung ke Gateway dari mesin mana pun'
title: TUI
x-i18n:
    generated_at: "2026-04-05T14:10:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: a73f70d65ecc7bff663e8df28c07d70d2920d4732fbb8288c137d65b8653ac52
    source_path: web/tui.md
    workflow: 15
---

# TUI (UI Terminal)

## Mulai cepat

1. Mulai Gateway.

```bash
openclaw gateway
```

2. Buka TUI.

```bash
openclaw tui
```

3. Ketik pesan lalu tekan Enter.

Gateway jarak jauh:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Gunakan `--password` jika Gateway Anda menggunakan auth password.

## Yang Anda lihat

- Header: URL koneksi, agen saat ini, sesi saat ini.
- Log chat: pesan pengguna, balasan asisten, pemberitahuan sistem, kartu tool.
- Baris status: status koneksi/run (menghubungkan, berjalan, streaming, idle, error).
- Footer: status koneksi + agen + sesi + model + think/fast/verbose/reasoning + jumlah token + deliver.
- Input: editor teks dengan autocomplete.

## Model mental: agen + sesi

- Agen adalah slug unik (misalnya `main`, `research`). Gateway mengekspos daftarnya.
- Sesi dimiliki oleh agen saat ini.
- Kunci sesi disimpan sebagai `agent:<agentId>:<sessionKey>`.
  - Jika Anda mengetik `/session main`, TUI memperluasnya menjadi `agent:<currentAgent>:main`.
  - Jika Anda mengetik `/session agent:other:main`, Anda beralih ke sesi agen itu secara eksplisit.
- Cakupan sesi:
  - `per-sender` (default): setiap agen memiliki banyak sesi.
  - `global`: TUI selalu menggunakan sesi `global` (pemilih mungkin kosong).
- Agen + sesi saat ini selalu terlihat di footer.

## Pengiriman + delivery

- Pesan dikirim ke Gateway; delivery ke penyedia nonaktif secara default.
- Aktifkan delivery:
  - `/deliver on`
  - atau panel Settings
  - atau mulai dengan `openclaw tui --deliver`

## Pemilih + overlay

- Pemilih model: mencantumkan model yang tersedia dan menetapkan penimpaan sesi.
- Pemilih agen: pilih agen yang berbeda.
- Pemilih sesi: hanya menampilkan sesi untuk agen saat ini.
- Settings: aktifkan/nonaktifkan deliver, perluasan output tool, dan visibilitas thinking.

## Shortcut keyboard

- Enter: kirim pesan
- Esc: hentikan run aktif
- Ctrl+C: hapus input (tekan dua kali untuk keluar)
- Ctrl+D: keluar
- Ctrl+L: pemilih model
- Ctrl+G: pemilih agen
- Ctrl+P: pemilih sesi
- Ctrl+O: aktifkan/nonaktifkan perluasan output tool
- Ctrl+T: aktifkan/nonaktifkan visibilitas thinking (memuat ulang riwayat)

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
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

Siklus hidup sesi:

- `/new` atau `/reset` (reset sesi)
- `/abort` (batalkan run aktif)
- `/settings`
- `/exit`

Perintah slash Gateway lainnya (misalnya `/context`) diteruskan ke Gateway dan ditampilkan sebagai output sistem. Lihat [Perintah slash](/tools/slash-commands).

## Perintah shell lokal

- Awali satu baris dengan `!` untuk menjalankan perintah shell lokal di host TUI.
- TUI meminta sekali per sesi untuk mengizinkan eksekusi lokal; jika ditolak, `!` tetap nonaktif untuk sesi tersebut.
- Perintah berjalan dalam shell baru yang non-interaktif di direktori kerja TUI (tanpa `cd`/env yang persisten).
- Perintah shell lokal menerima `OPENCLAW_SHELL=tui-local` di lingkungannya.
- Satu `!` saja dikirim sebagai pesan normal; spasi di depan tidak memicu exec lokal.

## Output tool

- Pemanggilan tool ditampilkan sebagai kartu dengan argumen + hasil.
- Ctrl+O beralih antara tampilan diciutkan/diperluas.
- Saat tool berjalan, pembaruan parsial di-stream ke kartu yang sama.

## Warna terminal

- TUI mempertahankan teks isi asisten dalam warna foreground default terminal Anda agar terminal gelap maupun terang tetap mudah dibaca.
- Jika terminal Anda menggunakan latar terang dan deteksi otomatis salah, setel `OPENCLAW_THEME=light` sebelum meluncurkan `openclaw tui`.
- Untuk memaksa palet gelap asli, setel `OPENCLAW_THEME=dark`.

## Riwayat + streaming

- Saat terhubung, TUI memuat riwayat terbaru (default 200 pesan).
- Respons streaming diperbarui di tempat sampai difinalisasi.
- TUI juga mendengarkan event tool agen untuk kartu tool yang lebih kaya.

## Detail koneksi

- TUI mendaftar ke Gateway sebagai `mode: "tui"`.
- Reconnect menampilkan pesan sistem; celah event ditampilkan di log.

## Opsi

- `--url <url>`: URL WebSocket Gateway (default ke konfigurasi atau `ws://127.0.0.1:<port>`)
- `--token <token>`: token Gateway (jika diperlukan)
- `--password <password>`: password Gateway (jika diperlukan)
- `--session <key>`: kunci sesi (default: `main`, atau `global` ketika cakupannya global)
- `--deliver`: kirim balasan asisten ke penyedia (default nonaktif)
- `--thinking <level>`: timpa level thinking untuk pengiriman
- `--message <text>`: kirim pesan awal setelah terhubung
- `--timeout-ms <ms>`: timeout agen dalam ms (default ke `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: entri riwayat yang akan dimuat (default `200`)

Catatan: saat Anda menyetel `--url`, TUI tidak fallback ke kredensial dari konfigurasi atau environment.
Teruskan `--token` atau `--password` secara eksplisit. Kredensial eksplisit yang hilang adalah error.

## Pemecahan masalah

Tidak ada output setelah mengirim pesan:

- Jalankan `/status` di TUI untuk memastikan Gateway terhubung dan idle/sibuk.
- Periksa log Gateway: `openclaw logs --follow`.
- Konfirmasikan agen dapat berjalan: `openclaw status` dan `openclaw models status`.
- Jika Anda mengharapkan pesan di channel chat, aktifkan delivery (`/deliver on` atau `--deliver`).

## Pemecahan masalah koneksi

- `disconnected`: pastikan Gateway berjalan dan `--url/--token/--password` Anda benar.
- Tidak ada agen di pemilih: periksa `openclaw agents list` dan konfigurasi routing Anda.
- Pemilih sesi kosong: Anda mungkin berada dalam cakupan global atau belum memiliki sesi.

## Terkait

- [UI Kontrol](/web/control-ui) — antarmuka kontrol berbasis web
- [Referensi CLI](/cli) — referensi perintah CLI lengkap
