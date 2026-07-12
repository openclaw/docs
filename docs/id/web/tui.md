---
read_when:
    - Anda menginginkan panduan langkah demi langkah tentang TUI yang mudah dipahami pemula
    - Anda memerlukan daftar lengkap fitur, perintah, dan pintasan TUI
summary: 'Antarmuka pengguna terminal (TUI): hubungkan ke Gateway atau jalankan secara lokal dalam mode tertanam'
title: TUI
x-i18n:
    generated_at: "2026-07-12T14:44:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d7181ea88643a129532f698908fd3dd3d93078b7e33b0ab1166dcfca2ecc2abd
    source_path: web/tui.md
    workflow: 16
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
- `openclaw` saja (tanpa subperintah) memilih target secara otomatis: instalasi yang belum dikonfigurasi menjalankan orientasi inferensi; konfigurasi yang tidak valid membuka panduan Doctor klasik; Gateway terkonfigurasi yang dapat dijangkau membuka shell TUI ini dalam mode Gateway; jika tidak, model lokal yang terkonfigurasi membukanya dalam mode lokal.

## Yang Anda lihat

- Header: URL koneksi, agen saat ini, sesi saat ini.
- Log obrolan: pesan pengguna, balasan asisten, pemberitahuan sistem, kartu alat.
- Baris status: status koneksi/proses (menghubungkan, berjalan, streaming, menganggur, galat).
- Footer: agen + sesi + model + status sasaran + pikir/cepat/terperinci/jejak/penalaran + jumlah token + pengiriman. Saat `tui.footer.showRemoteHost` diaktifkan, koneksi Gateway jarak jauh juga menampilkan host koneksi.
- Input: editor teks dengan pelengkapan otomatis.

## Model mental: agen + sesi

- Agen adalah slug unik (misalnya `main`, `research`). Gateway menyediakan daftarnya.
- Sesi dimiliki oleh agen saat ini.
- Kunci sesi disimpan sebagai `agent:<agentId>:<sessionKey>`.
  - Jika Anda mengetik `/session main`, TUI mengembangkannya menjadi `agent:<currentAgent>:main`.
  - Jika Anda mengetik `/session agent:other:main`, Anda beralih secara eksplisit ke sesi agen tersebut.
- Cakupan sesi:
  - `per-sender` (bawaan): setiap agen memiliki banyak sesi.
  - `global`: TUI selalu menggunakan sesi `global` (pemilih mungkin kosong).
- Agen + sesi saat ini selalu terlihat di footer.
- Untuk menampilkan host Gateway bagi koneksi berbasis URL nonlokal, aktifkan dengan:

  ```bash
  openclaw config set tui.footer.showRemoteHost true
  ```

  Nilai bawaannya adalah `false`. Koneksi local loopback dan koneksi lokal tertanam tidak pernah menampilkan label host.

- Jika sesi memiliki [sasaran](/id/tools/goal), footer menampilkan status ringkasnya:
  `Mengejar sasaran`, `Sasaran dijeda (/goal resume)`, `Sasaran terblokir (/goal resume)`, atau `Sasaran tercapai`.
- Saat dimulai tanpa `--session`, TUI mode Gateway melanjutkan sesi yang terakhir dipilih untuk Gateway, agen, dan cakupan sesi yang sama jika sesi tersebut masih ada. Penggunaan `--session`, `/session`, `/new`, atau `/reset` tetap bersifat eksplisit.

## Pengiriman pesan + penyampaian

- Pesan selalu dikirim ke Gateway (atau runtime tertanam dalam mode lokal); menyampaikan balasan asisten kembali ke penyedia obrolan merupakan langkah terpisah yang secara bawaan dinonaktifkan.
- TUI adalah permukaan sumber internal seperti WebChat, bukan saluran keluar generik. Harness yang mengharuskan `tools.message` untuk balasan yang terlihat dapat memenuhi giliran TUI aktif dengan `message.send` tanpa target; penyampaian eksplisit ke penyedia tetap menggunakan saluran terkonfigurasi biasa dan tidak pernah beralih ke `lastChannel`.
- Penyampaian ditetapkan untuk seluruh sesi TUI saat peluncuran: mulai dengan `openclaw tui --deliver` untuk mengaktifkannya. Tidak ada perintah garis miring `/deliver` atau sakelar Pengaturan untuk mengubahnya di tengah sesi; mulai ulang TUI untuk mengubahnya.

## Pemilih + hamparan

- Pemilih model: menampilkan model yang tersedia dan menetapkan penggantian untuk sesi.
- Pemilih agen: memilih agen lain.
- Pemilih sesi: menampilkan hingga 50 sesi untuk agen saat ini yang diperbarui dalam 7 hari terakhir. Gunakan `/session <key>` untuk beralih ke sesi lama yang kuncinya diketahui.
- Pengaturan (`/settings`): mengaktifkan atau menonaktifkan perluasan keluaran alat dan visibilitas pemikiran. Panel ini tidak mengontrol penyampaian.

## Pintasan papan ketik

- Enter: kirim pesan
- Esc: batalkan proses aktif
- Ctrl+C: hapus input (tekan dua kali untuk keluar)
- Ctrl+D: keluar
- Ctrl+L: pemilih model
- Ctrl+G: pemilih agen
- Ctrl+P: pemilih sesi
- Ctrl+O: aktifkan/nonaktifkan perluasan keluaran alat
- Ctrl+T: aktifkan/nonaktifkan visibilitas pemikiran (memuat ulang riwayat)

## Perintah garis miring

Inti:

- `/help`
- `/status` (diteruskan ke Gateway; menampilkan ringkasan sesi/model)
- `/gateway-status` (alias `/gwstatus`; menampilkan status koneksi Gateway secara langsung)
- `/agent <id>` (atau `/agents`)
- `/session <key>` (atau `/sessions`)
- `/model <provider/model>` (atau `/models`)

Kontrol sesi:

- `/think <off|minimal|low|medium|high>` (tingkatan yang lebih tinggi dapat menambahkan level seperti `xhigh`/`max`, bergantung pada model)
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

Crestodian:

- `/crestodian [request]` kembali dari TUI agen normal ke obrolan penyiapan/perbaikan [Crestodian](#crestodian-setup-and-repair-helper), dengan opsi meneruskan satu permintaan.

Perintah garis miring Gateway lainnya (misalnya `/context`) diteruskan ke Gateway dan ditampilkan sebagai keluaran sistem. Lihat [Perintah garis miring](/id/tools/slash-commands).

## Perintah shell lokal

- Awali baris dengan `!` untuk menjalankan perintah shell lokal pada host TUI.
- TUI meminta izin sekali per sesi untuk mengizinkan eksekusi lokal; menolaknya membuat `!` tetap dinonaktifkan selama sesi.
- Perintah dijalankan dalam shell baru dan noninteraktif di direktori kerja TUI (tanpa `cd`/lingkungan yang persisten).
- Perintah shell lokal menerima `OPENCLAW_SHELL=tui-local` di lingkungannya.
- `!` tunggal dikirim sebagai pesan biasa; spasi di awal tidak memicu eksekusi lokal.

## Pembantu penyiapan dan perbaikan Crestodian

Crestodian adalah asisten penyiapan/perbaikan ring-zero, yang tersedia sebagai `openclaw crestodian` setelah model bawaan yang dikonfigurasi lolos pemeriksaan inferensi langsung. Jika inferensi tidak tersedia, pemanggilan interaktif kembali ke orientasi inferensi dan otomatisasi gagal dengan panduan perbaikan. Crestodian berjalan di dalam shell TUI lokal yang sama dengan `openclaw tui --local`, didukung oleh agen AI yang dibatasi pada operasi Crestodian bertipe dan bergated persetujuan:

```bash
openclaw crestodian                       # mulai secara interaktif
openclaw crestodian -m "status"           # jalankan satu permintaan lalu keluar
openclaw crestodian -m "set default model openai/gpt-5.2" --yes   # terapkan penulisan konfigurasi
```

- Penulisan konfigurasi persisten memerlukan persetujuan: konfirmasikan secara interaktif atau berikan `--yes`.
- `--json` mencetak ringkasan awal sebagai JSON alih-alih memulai obrolan.
- Dari dalam Crestodian, permintaan `open-tui` (misalnya meminta berbicara dengan agen normal) keluar dari Crestodian dan membuka TUI agen reguler; gunakan `/crestodian` di sana untuk kembali.

Gunakan mode lokal saat konfigurasi saat ini sudah valid dan Anda ingin agen tertanam memeriksanya pada mesin yang sama, membandingkannya dengan dokumentasi, serta membantu memperbaiki penyimpangan tanpa bergantung pada Gateway yang sedang berjalan.

Jika `openclaw config validate` sudah gagal, mulai dengan `openclaw configure` atau `openclaw doctor --fix` terlebih dahulu; `openclaw chat` tetap memerlukan konfigurasi yang dapat dimuat agar dapat dimulai.

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
- `openclaw config validate --json` berguna saat Anda menginginkan skema terstruktur serta galat SecretRef/keterpecahan.

## Keluaran alat

- Pemanggilan alat ditampilkan sebagai kartu berisi argumen + hasil.
- Ctrl+O beralih antara tampilan yang diciutkan/diperluas.
- Saat alat berjalan, pembaruan parsial dialirkan ke kartu yang sama.

## Warna terminal

- TUI mempertahankan teks isi asisten dalam warna latar depan bawaan terminal Anda agar terminal gelap maupun terang tetap mudah dibaca.
- Jika terminal Anda menggunakan latar belakang terang dan deteksi otomatis keliru, atur `OPENCLAW_THEME=light` sebelum menjalankan `openclaw tui`.
- Untuk memaksakan palet gelap asli, atur `OPENCLAW_THEME=dark`.

## Riwayat + streaming

- Saat terhubung, TUI memuat riwayat terbaru (bawaan 200 pesan).
- Respons streaming diperbarui di tempat hingga selesai.
- TUI juga mendengarkan peristiwa alat agen untuk kartu alat yang lebih kaya.

## Detail koneksi

- TUI terhubung dengan ID klien `openclaw-tui` dalam mode klien umum `ui` (mode yang sama yang digunakan Control UI dan WebChat untuk kebijakan Gateway).
- Koneksi ulang menampilkan pesan sistem; celah peristiwa ditampilkan dalam log.

## Opsi

- `--local`: Jalankan terhadap runtime agen tertanam lokal
- `--url <url>`: URL WebSocket Gateway (bawaan ke `gateway.remote.url` dari konfigurasi, atau `ws://127.0.0.1:<port>` pada local loopback)
- `--token <token>`: Token Gateway (jika diperlukan)
- `--password <password>`: Kata sandi Gateway (jika diperlukan)
- `--tls-fingerprint <sha256>`: Sidik jari sertifikat TLS yang diharapkan untuk Gateway `wss://` yang dipasangi pin
- `--session <key>`: Kunci sesi (bawaan: `main`, atau `global` saat cakupan bersifat global)
- `--deliver`: Sampaikan balasan asisten ke penyedia (bawaan dinonaktifkan)
- `--thinking <level>`: Ganti level pemikiran untuk pengiriman
- `--message <text>`: Kirim pesan awal setelah terhubung
- `--timeout-ms <ms>`: Batas waktu agen dalam milidetik (bawaan ke `agents.defaults.timeoutSeconds`)
- `--history-limit <n>`: Entri riwayat yang akan dimuat (bawaan `200`)

<Warning>
Saat Anda menetapkan `--url`, TUI tidak beralih ke kredensial dari konfigurasi atau lingkungan. Berikan `--token` atau `--password` secara eksplisit, serta `--tls-fingerprint` jika target menggunakan sertifikat yang dipasangi pin. Tidak adanya kredensial eksplisit merupakan galat. Dalam mode lokal, jangan berikan `--url`, `--token`, `--password`, atau `--tls-fingerprint`.
</Warning>

## Pemecahan masalah

Tidak ada keluaran setelah mengirim pesan:

- Jalankan `/status` di TUI untuk memastikan Gateway terhubung dan menganggur/sibuk.
- Periksa log Gateway: `openclaw logs --follow`.
- Pastikan agen dapat berjalan: `openclaw status` dan `openclaw models status`.
- Jika Anda mengharapkan pesan di saluran obrolan, pastikan TUI dimulai dengan `--deliver` (opsi ini tidak dapat diaktifkan kemudian tanpa memulai ulang).

## Pemecahan masalah koneksi

- `disconnected`: pastikan Gateway sedang berjalan dan `--url/--token/--password` Anda benar.
- Tidak ada agen di pemilih: periksa `openclaw agents list` dan konfigurasi perutean Anda.
- Pemilih sesi kosong: Anda mungkin berada dalam cakupan global atau belum memiliki sesi.

## Terkait

- [Control UI](/id/web/control-ui) — antarmuka kontrol berbasis web
- [Konfigurasi](/id/cli/config) — periksa, validasi, dan edit `openclaw.json`
- [Doctor](/id/cli/doctor) — pemeriksaan perbaikan dan migrasi terpandu
- [Referensi CLI](/id/cli) — referensi lengkap perintah CLI
