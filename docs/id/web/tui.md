---
read_when:
    - Anda menginginkan panduan langkah demi langkah TUI yang ramah bagi pemula
    - Anda memerlukan daftar lengkap fitur, perintah, dan pintasan TUI
summary: 'Antarmuka Terminal (TUI): terhubung ke Gateway atau berjalan secara lokal dalam mode tersemat'
title: TUI
x-i18n:
    generated_at: "2026-07-16T18:53:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1e171520c24d95ac1d6df28227efea0a1258a0b9e59b61fe02c09a2d87b24391
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
# atau
openclaw tui --local
```

- `openclaw chat` dan `openclaw terminal` adalah alias untuk `openclaw tui --local`.
- `--local` tidak dapat digabungkan dengan `--url`, `--token`, atau `--password`.
- Mode lokal menggunakan runtime agen tertanam secara langsung. Sebagian besar alat lokal berfungsi, tetapi fitur yang hanya tersedia di Gateway tidak tersedia.
- `openclaw` tanpa argumen (tanpa subperintah) memilih target secara otomatis: instalasi yang belum dikonfigurasi menjalankan orientasi inferensi; konfigurasi yang tidak valid membuka panduan Doctor klasik; Gateway terkonfigurasi yang dapat dijangkau membuka shell TUI ini dalam mode Gateway; jika tidak, model lokal yang terkonfigurasi membukanya dalam mode lokal.

## Yang Anda lihat

- Header: URL koneksi, agen saat ini, sesi saat ini.
- Log percakapan: pesan pengguna, balasan asisten, pemberitahuan sistem, kartu alat.
- Baris status: status koneksi/proses (menghubungkan, berjalan, streaming, menganggur, galat).
- Footer: agen + sesi + model + status sasaran + think/fast/verbose/trace/reasoning + jumlah token + pengiriman. Saat `tui.footer.showRemoteHost` diaktifkan, koneksi Gateway jarak jauh juga menampilkan host koneksi.
- Input: editor teks dengan pelengkapan otomatis.

## Model mental: agen + sesi

- Agen adalah slug unik (misalnya `main`, `research`). Gateway menyediakan daftarnya.
- Sesi dimiliki oleh agen saat ini.
- Kunci sesi disimpan sebagai `agent:<agentId>:<sessionKey>`.
  - Jika Anda mengetik `/session main`, TUI mengembangkannya menjadi `agent:<currentAgent>:main`.
  - Jika Anda mengetik `/session agent:other:main`, Anda beralih secara eksplisit ke sesi agen tersebut.
- Cakupan sesi:
  - `per-sender` (default): setiap agen memiliki banyak sesi.
  - `global`: TUI selalu menggunakan sesi `global` (pemilih mungkin kosong).
- Agen + sesi saat ini selalu terlihat di footer.
- Untuk menampilkan host Gateway bagi koneksi berbasis URL nonlokal, aktifkan dengan:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Default-nya adalah `false`. Koneksi loopback dan lokal tertanam tidak pernah menampilkan label host.

- Jika sesi memiliki [sasaran](/id/tools/goal), footer menampilkan status ringkasnya:
  `Pursuing goal`, `Goal paused (/goal resume)`, `Goal blocked (/goal resume)`, atau `Goal achieved`.
- Saat dimulai tanpa `--session`, TUI mode Gateway melanjutkan sesi terakhir yang dipilih untuk Gateway, agen, dan cakupan sesi yang sama jika sesi tersebut masih ada. Pemberian `--session`, `/session`, `/new`, atau `/reset` tetap bersifat eksplisit.

## Pengiriman pesan + penyampaian

- Pesan selalu dikirim ke Gateway (atau runtime tertanam dalam mode lokal); menyampaikan kembali balasan asisten ke penyedia percakapan merupakan langkah terpisah yang secara default dinonaktifkan.
- TUI adalah permukaan sumber internal seperti WebChat, bukan saluran keluar generik. Harness yang memerlukan `tools.message` untuk balasan yang terlihat dapat memenuhi giliran TUI aktif dengan `message.send` tanpa target; penyampaian eksplisit melalui penyedia tetap menggunakan saluran terkonfigurasi normal dan tidak pernah beralih ke `lastChannel` sebagai cadangan.
- Penyampaian ditetapkan untuk seluruh sesi TUI saat peluncuran: mulai dengan `openclaw tui --deliver` untuk mengaktifkannya. Tidak ada perintah garis miring `/deliver` atau pengalih Settings untuk mengubahnya di tengah sesi; mulai ulang TUI untuk mengubahnya.

## Pemilih + overlay

- Pemilih model: mencantumkan model yang tersedia dan menetapkan penggantian sesi.
- Pemilih agen: memilih agen lain.
- Pemilih sesi: menampilkan hingga 50 sesi untuk agen saat ini yang diperbarui dalam 7 hari terakhir. Gunakan `/session <key>` untuk berpindah ke sesi lama yang diketahui.
- Settings (`/settings`): mengalihkan perluasan output alat dan visibilitas pemikiran. Panel ini tidak mengontrol penyampaian.

## Pintasan papan ketik

- Enter: kirim pesan
- Esc: batalkan proses aktif
- Ctrl+C: hapus input (tekan dua kali untuk keluar)
- Ctrl+D: keluar
- Ctrl+L: pemilih model
- Ctrl+G: pemilih agen
- Ctrl+P: pemilih sesi
- Ctrl+O: alihkan perluasan output alat
- Ctrl+T: alihkan visibilitas pemikiran (memuat ulang riwayat)

## Perintah garis miring

Inti:

- `/help`
- `/status` (diteruskan ke Gateway; menampilkan ringkasan sesi/model)
- `/gateway-status` (alias `/gwstatus`; menampilkan status koneksi Gateway secara langsung)
- `/agent <id>` (atau `/agents`)
- `/session <key>` (atau `/sessions`)
- `/model <provider/model>` (atau `/models`)

Kontrol sesi:

- `/think <off|minimal|low|medium|high>` (tingkat yang lebih tinggi dapat menambahkan level seperti `xhigh`/`max`, tergantung pada model)
- `/fast <status|auto|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full|reset>` (`reset`/`inherit`/`clear`/`default` menghapus penggantian sesi)
- `/goal [status] | /goal start <objective> | /goal edit <objective> | /goal pause|resume|complete|block|clear`
- `/elevated <on|off|ask|full>` (alias: `/elev`)
- `/activation <mention|always>`

Siklus hidup sesi:

- `/new` (membuat sesi baru yang terisolasi dengan kunci baru; tidak memengaruhi klien TUI lain pada sesi lama)
- `/reset` (mengatur ulang kunci sesi saat ini di tempat)
- `/abort` (membatalkan proses aktif)
- `/settings`
- `/exit` (atau `/quit`)

Hanya mode lokal:

- `/auth [provider]` membuka alur autentikasi/login penyedia di dalam TUI.

OpenClaw:

- `/openclaw [request]` kembali dari TUI agen normal ke percakapan penyiapan/perbaikan [OpenClaw](#openclaw-setup-and-repair-helper), dengan opsi meneruskan satu permintaan.

Perintah garis miring Gateway lainnya (misalnya, `/context`) diteruskan ke Gateway dan ditampilkan sebagai output sistem. Lihat [Perintah garis miring](/id/tools/slash-commands).

## Perintah shell lokal

- Awali baris dengan `!` untuk menjalankan perintah shell lokal pada host TUI.
- TUI meminta izin satu kali per sesi untuk mengizinkan eksekusi lokal; penolakan membuat `!` tetap dinonaktifkan selama sesi.
- Perintah berjalan dalam shell baru noninteraktif di direktori kerja TUI (tanpa `cd`/lingkungan yang persisten).
- Perintah shell lokal menerima `OPENCLAW_SHELL=tui-local` dalam lingkungannya.
- `!` tunggal dikirim sebagai pesan normal; spasi di awal tidak memicu eksekusi lokal.

## Pembantu penyiapan dan perbaikan OpenClaw

OpenClaw adalah asisten penyiapan/perbaikan ring-zero, yang tersedia sebagai `openclaw setup` setelah model default yang dikonfigurasi lulus pemeriksaan inferensi langsung. Jika inferensi tidak tersedia, pemanggilan interaktif kembali ke orientasi inferensi dan otomatisasi gagal dengan panduan perbaikan. Asisten ini berjalan di dalam shell TUI lokal yang sama dengan `openclaw tui --local`, didukung oleh agen AI yang dibatasi pada operasi OpenClaw bertipe dan memerlukan persetujuan:

```bash
openclaw setup                       # mulai secara interaktif
openclaw setup -m "status"           # jalankan satu permintaan lalu keluar
openclaw setup -m "set default model openai/gpt-5.2" --yes   # terapkan penulisan konfigurasi
```

- Penulisan konfigurasi persisten memerlukan persetujuan: konfirmasikan secara interaktif atau berikan `--yes`.
- `--json` mencetak ringkasan awal sebagai JSON alih-alih memulai percakapan.
- Dari dalam OpenClaw, permintaan `open-tui` (misalnya, meminta berbicara dengan agen normal) keluar dari OpenClaw dan membuka TUI agen reguler; gunakan `/openclaw` di sana untuk kembali.

Gunakan mode lokal saat konfigurasi saat ini sudah tervalidasi dan Anda ingin agen tertanam memeriksanya di mesin yang sama, membandingkannya dengan dokumentasi, dan membantu memperbaiki penyimpangan tanpa bergantung pada Gateway yang sedang berjalan.

Jika `openclaw config validate` sudah gagal, mulai dengan `openclaw configure` atau `openclaw doctor --fix` terlebih dahulu; `openclaw chat` tetap memerlukan konfigurasi yang dapat dimuat untuk memulai.

Siklus umum:

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

4. Terapkan perubahan terbatas dengan `openclaw config set` atau `openclaw configure`, lalu jalankan kembali `!openclaw config validate`.
5. Jika Doctor merekomendasikan migrasi atau perbaikan otomatis, tinjau lalu jalankan `!openclaw doctor --fix`.

Kiat:

- Utamakan `openclaw config set` atau `openclaw configure` daripada mengedit `openclaw.json` secara manual.
- `openclaw docs "<query>"` mencari indeks dokumentasi langsung dari mesin yang sama.
- `openclaw config validate --json` berguna ketika Anda menginginkan skema terstruktur serta galat SecretRef/keterpecahan.

## Output alat

- Panggilan alat ditampilkan sebagai kartu dengan argumen + hasil.
- Ctrl+O beralih antara tampilan diciutkan/diperluas.
- Saat alat berjalan, pembaruan parsial dialirkan ke kartu yang sama.

## Warna terminal

- TUI mempertahankan teks isi asisten dalam warna latar depan default terminal Anda agar terminal gelap maupun terang tetap mudah dibaca.
- Jika terminal Anda menggunakan latar belakang terang dan deteksi otomatis keliru, tetapkan `OPENCLAW_THEME=light` sebelum meluncurkan `openclaw tui`.
- Untuk memaksakan palet gelap asli, tetapkan `OPENCLAW_THEME=dark`.

## Riwayat + streaming

- Saat terhubung, TUI memuat riwayat terbaru (default 200 pesan).
- Respons streaming diperbarui di tempat hingga selesai.
- TUI juga mendengarkan peristiwa alat agen untuk kartu alat yang lebih kaya.

## Detail koneksi

- TUI terhubung dengan ID klien `openclaw-tui` dalam mode klien umum `ui` (mode yang sama yang digunakan Control UI dan WebChat untuk kebijakan Gateway).
- Koneksi ulang menampilkan pesan sistem; celah peristiwa ditampilkan dalam log.

## Opsi

- `--local`: Jalankan dengan runtime agen tertanam lokal
- `--url <url>`: URL WebSocket Gateway (secara default menggunakan `gateway.remote.url` dari konfigurasi, atau `ws://127.0.0.1:<port>` pada loopback)
- `--token <token>`: Token Gateway (jika diperlukan)
- `--password <password>`: Kata sandi Gateway (jika diperlukan)
- `--tls-fingerprint <sha256>`: Sidik jari sertifikat TLS yang diharapkan untuk Gateway `wss://` yang disematkan
- `--session <key>`: Kunci sesi (default: `main`, atau `global` saat cakupannya global)
- `--deliver`: Kirim balasan asisten ke penyedia (secara default nonaktif)
- `--thinking <level>`: Timpa tingkat pemikiran untuk pengiriman
- `--message <text>`: Kirim pesan awal setelah terhubung
- `--timeout-ms <ms>`: Batas waktu agen dalam milidetik (secara default menggunakan `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Entri riwayat yang akan dimuat (default `200`)

<Warning>
Saat Anda menetapkan `--url`, TUI tidak menggunakan kredensial konfigurasi atau lingkungan sebagai fallback. Teruskan `--token` atau `--password` secara eksplisit, serta `--tls-fingerprint` jika target menggunakan sertifikat yang disematkan. Tidak adanya kredensial eksplisit merupakan kesalahan. Dalam mode lokal, jangan teruskan `--url`, `--token`, `--password`, atau `--tls-fingerprint`.
</Warning>

## Pemecahan masalah

Tidak ada keluaran setelah mengirim pesan:

- Jalankan `/status` di TUI untuk memastikan Gateway terhubung dan dalam keadaan menganggur/sibuk.
- Periksa log Gateway: `openclaw logs --follow`.
- Pastikan agen dapat berjalan: `openclaw status` dan `openclaw models status`.
- Jika Anda mengharapkan pesan di saluran obrolan, pastikan TUI dimulai dengan `--deliver` (opsi ini tidak dapat diaktifkan kemudian tanpa memulai ulang).

## Pemecahan masalah koneksi

- `disconnected`: pastikan Gateway berjalan dan `--url/--token/--password` Anda benar.
- Tidak ada agen di pemilih: periksa `openclaw agents list` dan konfigurasi perutean Anda.
- Pemilih sesi kosong: Anda mungkin berada dalam cakupan global atau belum memiliki sesi.

## Terkait

- [UI Kontrol](/id/web/control-ui) — antarmuka kontrol berbasis web
- [Konfigurasi](/id/cli/config) — periksa, validasi, dan edit `openclaw.json`
- [Doctor](/id/cli/doctor) — pemeriksaan perbaikan dan migrasi terpandu
- [Referensi CLI](/id/cli) — referensi lengkap perintah CLI
