---
read_when:
    - Men-debug atau mengonfigurasi akses WebChat
summary: Host statis WebChat loopback dan penggunaan WS Gateway untuk UI chat
title: WebChat
x-i18n:
    generated_at: "2026-06-27T18:23:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 108dd98f975a2d2e980921bd0f486c3683c18ba6eb37111163af87929a9d7973
    source_path: web/webchat.md
    workflow: 16
---

Status: UI chat SwiftUI macOS/iOS berbicara langsung ke Gateway WebSocket.

## Apa ini

- UI chat native untuk gateway (tanpa peramban tertanam dan tanpa server statis lokal).
- Menggunakan sesi dan aturan perutean yang sama seperti kanal lain.
- Perutean deterministik: balasan selalu kembali ke WebChat.

## Mulai cepat

1. Jalankan gateway.
2. Buka UI WebChat (aplikasi macOS/iOS) atau tab chat Control UI.
3. Pastikan jalur autentikasi gateway yang valid telah dikonfigurasi (shared-secret secara default,
   bahkan pada loopback).

## Cara kerjanya (perilaku)

- UI terhubung ke Gateway WebSocket dan menggunakan `chat.history`, `chat.send`, dan `chat.inject`.
- `chat.history` dibatasi demi stabilitas: Gateway dapat memotong kolom teks panjang, menghilangkan metadata berat, dan mengganti entri yang terlalu besar dengan `[chat.history omitted: message too large]`.
- Ketika pesan asisten yang terlihat dipotong di `chat.history`, Control UI dapat membuka pembaca samping dan mengambil entri lengkap yang dinormalisasi untuk tampilan sesuai permintaan melalui `chat.message.get` tanpa menambah payload riwayat default.
- `chat.history` mengikuti cabang transkrip aktif untuk berkas sesi append-only modern, sehingga cabang penulisan ulang yang ditinggalkan dan salinan prompt yang digantikan tidak dirender di WebChat.
- Entri Compaction dirender sebagai pemisah riwayat-terpadatkan yang eksplisit. Pemisah tersebut menjelaskan bahwa transkrip yang dipadatkan dipertahankan sebagai checkpoint dan menautkan ke kontrol checkpoint Sessions, tempat operator dapat membuat cabang atau memulihkan dari tampilan yang dipadatkan itu saat izin mereka mengizinkannya.
- Control UI mengingat Gateway `sessionId` pendukung yang dikembalikan oleh `chat.history` dan menyertakannya pada panggilan lanjutan `chat.send`, sehingga koneksi ulang dan penyegaran halaman melanjutkan percakapan tersimpan yang sama kecuali pengguna memulai atau mereset sesi.
- Control UI menggabungkan submit duplikat yang sedang berjalan untuk sesi, pesan, dan lampiran yang sama sebelum membuat id run `chat.send` baru; Gateway tetap melakukan deduplikasi permintaan berulang yang memakai ulang kunci idempotensi yang sama.
- Berkas startup workspace dan instruksi `BOOTSTRAP.md` yang tertunda disediakan melalui Project Context pada prompt sistem agen, bukan disalin ke pesan pengguna WebChat. Pemotongan bootstrap hanya menambahkan pemberitahuan pemulihan prompt sistem yang ringkas; hitungan terperinci dan kenop konfigurasi tetap berada di permukaan diagnostik.
- `chat.history` juga dinormalisasi untuk tampilan: konteks OpenClaw yang hanya untuk runtime,
  pembungkus envelope masuk, tag direktif pengiriman inline
  seperti `[[reply_to_*]]` dan `[[audio_as_voice]]`, payload XML panggilan alat teks biasa
  (termasuk `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, dan blok panggilan alat yang terpotong), serta
  token kontrol model ASCII/lebar-penuh yang bocor dihapus dari teks yang terlihat,
  dan entri asisten yang seluruh teks terlihatnya hanya token senyap persis
  `NO_REPLY` / `no_reply` dihilangkan.
- Payload balasan yang ditandai sebagai penalaran (`isReasoning: true`) dikecualikan dari konten asisten WebChat, teks pemutaran ulang transkrip, dan blok konten audio, sehingga payload khusus berpikir tidak muncul sebagai pesan asisten yang terlihat atau audio yang dapat diputar.
- `chat.inject` menambahkan catatan asisten langsung ke transkrip dan menyiarkannya ke UI (tanpa run agen).
- Run yang dibatalkan dapat tetap menampilkan output asisten parsial di UI.
- Gateway mempertahankan teks asisten parsial yang dibatalkan ke riwayat transkrip ketika output tersangga ada, dan menandai entri tersebut dengan metadata pembatalan.
- Riwayat selalu diambil dari gateway (tanpa pemantauan berkas lokal).
- Jika gateway tidak dapat dijangkau, WebChat bersifat hanya-baca.

### Model transkrip dan pengiriman

WebChat memiliki dua jalur data terpisah:

- Berkas JSONL sesi adalah transkrip model/runtime yang tahan lama. Untuk run agen normal, runtime OpenClaw tertanam mempertahankan pesan `user`, `assistant`, dan `toolResult` yang terlihat oleh model melalui manajer sesinya. WebChat tidak menulis pengiriman, status, atau teks pembantu arbitrer ke transkrip tersebut.
- Event Gateway `ReplyPayload` adalah proyeksi pengiriman live. Event tersebut dapat dinormalisasi untuk tampilan WebChat/kanal, streaming blok, tag direktif, penyematan media, flag TTS/audio, dan perilaku fallback UI. Event tersebut sendiri bukan log sesi kanonis.
- Harness yang membutuhkan balasan terlihat melalui `tools.message` tetap menggunakan WebChat sebagai penampung balasan sumber internal untuk run saat ini. `message.send` tanpa target dari run WebChat aktif tersebut diproyeksikan ke chat yang sama dan dicerminkan ke transkrip sesi; WebChat tidak menjadi kanal keluar yang dapat digunakan ulang dan tidak pernah mewarisi `lastChannel`.
- WebChat menyuntikkan entri transkrip asisten hanya ketika Gateway memiliki pesan yang ditampilkan di luar giliran agen tertanam normal: `chat.inject`, balasan perintah non-agen, output parsial yang dibatalkan, dan suplemen transkrip media yang dikelola WebChat.
- `chat.history` membaca transkrip sesi yang tersimpan dan menerapkan proyeksi tampilan WebChat. Jika teks asisten live muncul selama run tetapi hilang setelah riwayat dimuat ulang, periksa terlebih dahulu apakah JSONL mentah memuat teks asisten tersebut, lalu apakah proyeksi `chat.history` menghapusnya, lalu apakah penggabungan optimistic-tail Control UI mengganti status pengiriman lokal dengan snapshot yang dipertahankan.
- `chat.message.get` menggunakan cabang transkrip dan aturan proyeksi tampilan yang sama seperti `chat.history`, termasuk cakupan agen aktif, tetapi menargetkan satu entri transkrip berdasarkan `messageId` dan mengembalikan alasan tidak tersedia yang jujur ketika konten lengkap tidak lagi dapat dikembalikan.

Jawaban akhir run agen normal seharusnya tahan lama karena runtime tertanam menulis `message_end` asisten. Fallback apa pun yang mencerminkan payload akhir yang terkirim ke transkrip harus terlebih dahulu menghindari duplikasi giliran asisten yang sudah ditulis oleh runtime tertanam.

## Panel alat agen Control UI

- Panel Tools Control UI `/agents` memiliki dua tampilan terpisah:
  - **Tersedia Saat Ini** menggunakan `tools.effective(sessionKey=...)` dan menampilkan proyeksi hanya-baca yang diturunkan server
    dari inventaris sesi saat ini, termasuk alat inti, plugin, milik kanal,
    dan alat server MCP yang sudah ditemukan.
  - **Konfigurasi Alat** menggunakan `tools.catalog` dan tetap berfokus pada profil, override, dan
    semantik katalog.
- Ketersediaan runtime bersifat tercakup-sesi. Beralih sesi pada agen yang sama dapat mengubah daftar
  **Tersedia Saat Ini**. Jika server MCP yang dikonfigurasi belum terhubung atau telah berubah
  sejak penemuan terakhir, panel menampilkan pemberitahuan alih-alih diam-diam memulai transport MCP
  dari jalur baca.
- Editor konfigurasi tidak menyiratkan ketersediaan runtime; akses efektif tetap mengikuti presedensi kebijakan
  (`allow`/`deny`, override per-agen dan penyedia/kanal).

## Penggunaan jarak jauh

- Mode jarak jauh menerowongkan gateway WebSocket melalui SSH/Tailscale.
- Anda tidak perlu menjalankan server WebChat terpisah.

## Referensi konfigurasi (WebChat)

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

WebChat tidak memiliki bagian konfigurasi yang dipertahankan. Gateway menggunakan batas tampilan `chat.history` bawaan; klien API dapat mengirim `maxChars` per-permintaan untuk menimpanya bagi satu panggilan `chat.history`. Konfigurasi lama `channels.webchat` dan `gateway.webchat` telah dipensiunkan; jalankan `openclaw doctor --fix` untuk menghapusnya.

Opsi global terkait:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autentikasi WebSocket shared-secret.
- `gateway.auth.allowTailscale`: tab chat Control UI peramban dapat menggunakan header identitas Tailscale
  Serve saat diaktifkan.
- `gateway.auth.mode: "trusted-proxy"`: autentikasi reverse-proxy untuk klien peramban di balik sumber proksi **non-loopback** yang sadar identitas (lihat [Autentikasi Proksi Tepercaya](/id/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: target gateway jarak jauh.
- `session.*`: penyimpanan sesi dan default kunci utama.

## Terkait

- [Control UI](/id/web/control-ui)
- [Dashboard](/id/web/dashboard)
