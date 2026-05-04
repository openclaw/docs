---
read_when:
    - Melakukan debug atau mengonfigurasi akses WebChat
summary: Host statis Loopback WebChat dan penggunaan WS Gateway untuk UI chat
title: Obrolan Web
x-i18n:
    generated_at: "2026-05-04T07:09:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: bf435585a13a1cde5885714837017109eeeb61ffa5e33a400017706f676f57ea
    source_path: web/webchat.md
    workflow: 16
---

Status: UI chat SwiftUI macOS/iOS berbicara langsung ke WebSocket Gateway.

## Apa ini

- UI chat native untuk Gateway (tanpa browser tertanam dan tanpa server statis lokal).
- Menggunakan sesi dan aturan perutean yang sama seperti channel lain.
- Perutean deterministik: balasan selalu kembali ke WebChat.

## Mulai cepat

1. Mulai Gateway.
2. Buka UI WebChat (aplikasi macOS/iOS) atau tab chat Control UI.
3. Pastikan jalur autentikasi Gateway yang valid dikonfigurasi (shared-secret secara default,
   bahkan pada loopback).

## Cara kerjanya (perilaku)

- UI terhubung ke WebSocket Gateway dan menggunakan `chat.history`, `chat.send`, dan `chat.inject`.
- `chat.history` dibatasi untuk stabilitas: Gateway dapat memotong field teks yang panjang, menghilangkan metadata berat, dan mengganti entri yang terlalu besar dengan `[chat.history omitted: message too large]`.
- `chat.history` mengikuti cabang transkrip aktif untuk file sesi append-only modern, sehingga cabang rewrite yang ditinggalkan dan salinan prompt yang sudah digantikan tidak dirender di WebChat.
- Entri Compaction dirender sebagai pemisah riwayat yang dipadatkan secara eksplisit. Pemisah tersebut menjelaskan bahwa giliran sebelumnya dipertahankan dalam checkpoint dan menautkan ke kontrol checkpoint Sesi, tempat operator dapat membuat cabang atau memulihkan tampilan pra-compaction ketika izin mereka memungkinkan.
- Control UI mengingat `sessionId` Gateway pendukung yang dikembalikan oleh `chat.history` dan menyertakannya pada panggilan lanjutan `chat.send`, sehingga penyambungan ulang dan refresh halaman melanjutkan percakapan tersimpan yang sama kecuali pengguna memulai atau mereset sesi.
- Control UI menggabungkan pengiriman duplikat yang masih berjalan untuk sesi, pesan, dan lampiran yang sama sebelum membuat id run `chat.send` baru; Gateway tetap melakukan deduplikasi permintaan berulang yang menggunakan ulang kunci idempotensi yang sama.
- File startup workspace dan instruksi `BOOTSTRAP.md` yang tertunda disediakan melalui Project Context pada prompt sistem agen, bukan disalin ke pesan pengguna WebChat. Pemotongan bootstrap hanya menambahkan notifikasi pemulihan prompt sistem yang ringkas; hitungan terperinci dan knob konfigurasi tetap berada di permukaan diagnostik.
- `chat.history` juga dinormalisasi untuk tampilan: konteks runtime-only OpenClaw,
  pembungkus amplop masuk, tag direktif pengiriman inline
  seperti `[[reply_to_*]]` dan `[[audio_as_voice]]`, payload XML tool-call teks biasa
  (termasuk `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, dan blok tool-call yang terpotong), serta
  token kontrol model ASCII/full-width yang bocor dihapus dari teks yang terlihat,
  dan entri asisten yang seluruh teks terlihatnya hanya token senyap persis
  `NO_REPLY` / `no_reply` dihilangkan.
- Payload balasan bertanda reasoning (`isReasoning: true`) dikecualikan dari konten asisten WebChat, teks replay transkrip, dan blok konten audio, sehingga payload khusus pemikiran tidak muncul sebagai pesan asisten yang terlihat atau audio yang dapat diputar.
- `chat.inject` menambahkan catatan asisten langsung ke transkrip dan menyiarkannya ke UI (tanpa run agen).
- Run yang dibatalkan dapat tetap menampilkan output asisten parsial di UI.
- Gateway mempertahankan teks asisten parsial yang dibatalkan ke dalam riwayat transkrip ketika ada output yang di-buffer, dan menandai entri tersebut dengan metadata pembatalan.
- Riwayat selalu diambil dari Gateway (tanpa pemantauan file lokal).
- Jika Gateway tidak dapat dijangkau, WebChat bersifat hanya-baca.

### Model transkrip dan pengiriman

WebChat memiliki dua jalur data terpisah:

- File JSONL sesi adalah transkrip model/runtime yang tahan lama. Untuk run agen normal, Pi mempertahankan pesan `user`, `assistant`, dan `toolResult` yang terlihat oleh model melalui pengelola sesinya. WebChat tidak menulis pengiriman, status, atau teks pembantu arbitrer ke transkrip tersebut.
- Event `ReplyPayload` Gateway adalah proyeksi pengiriman live. Event tersebut dapat dinormalisasi untuk tampilan WebChat/channel, block streaming, tag direktif, penyematan media, flag TTS/audio, dan perilaku fallback UI. Event tersebut bukan log sesi kanonis itu sendiri.
- WebChat menyuntikkan entri transkrip asisten hanya ketika Gateway memiliki pesan yang ditampilkan di luar giliran asisten Pi normal: `chat.inject`, balasan perintah non-agen, output parsial yang dibatalkan, dan pelengkap transkrip media yang dikelola WebChat.
- `chat.history` membaca transkrip sesi yang tersimpan dan menerapkan proyeksi tampilan WebChat. Jika teks asisten live muncul selama run tetapi menghilang setelah riwayat dimuat ulang, periksa terlebih dahulu apakah JSONL mentah berisi teks asisten, lalu apakah proyeksi `chat.history` menghapusnya, lalu apakah penggabungan optimistic-tail Control UI mengganti status pengiriman lokal dengan snapshot yang dipertahankan.

Jawaban akhir run agen normal harus tahan lama karena Pi menulis `message_end` asisten. Fallback apa pun yang mencerminkan payload akhir yang terkirim ke transkrip harus terlebih dahulu menghindari duplikasi giliran asisten yang sudah ditulis Pi.

## Panel alat agen Control UI

- Panel Tools `/agents` Control UI memiliki dua tampilan terpisah:
  - **Tersedia Saat Ini** menggunakan `tools.effective(sessionKey=...)` dan menunjukkan apa yang benar-benar dapat digunakan sesi saat ini pada runtime, termasuk alat milik inti, Plugin, dan channel.
  - **Konfigurasi Alat** menggunakan `tools.catalog` dan tetap berfokus pada profil, override, dan semantik katalog.
- Ketersediaan runtime dicakup per sesi. Berpindah sesi pada agen yang sama dapat mengubah daftar
  **Tersedia Saat Ini**.
- Editor konfigurasi tidak menyiratkan ketersediaan runtime; akses efektif tetap mengikuti prioritas kebijakan
  (`allow`/`deny`, override per-agen dan provider/channel).

## Penggunaan jarak jauh

- Mode jarak jauh membuat tunnel WebSocket Gateway melalui SSH/Tailscale.
- Anda tidak perlu menjalankan server WebChat terpisah.

## Referensi konfigurasi (WebChat)

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

Opsi WebChat:

- `gateway.webchat.chatHistoryMaxChars`: jumlah karakter maksimum untuk field teks dalam respons `chat.history`. Ketika entri transkrip melebihi batas ini, Gateway memotong field teks panjang dan dapat mengganti pesan yang terlalu besar dengan placeholder. `maxChars` per-permintaan juga dapat dikirim oleh klien untuk menimpa default ini untuk satu panggilan `chat.history`.

Opsi global terkait:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autentikasi WebSocket shared-secret.
- `gateway.auth.allowTailscale`: tab chat Control UI browser dapat menggunakan header identitas Tailscale
  Serve ketika diaktifkan.
- `gateway.auth.mode: "trusted-proxy"`: autentikasi reverse-proxy untuk klien browser di belakang sumber proksi **non-loopback** yang sadar identitas (lihat [Autentikasi Proksi Tepercaya](/id/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: target Gateway jarak jauh.
- `session.*`: penyimpanan sesi dan default kunci utama.

## Terkait

- [Control UI](/id/web/control-ui)
- [Dasbor](/id/web/dashboard)
