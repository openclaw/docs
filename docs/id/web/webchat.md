---
read_when:
    - Men-debug atau mengonfigurasi akses WebChat
summary: Host statis WebChat loopback dan penggunaan WS Gateway untuk antarmuka obrolan
title: Chat Web
x-i18n:
    generated_at: "2026-05-02T23:39:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad3a09c8962e3a6dda83716d319df7ba27e18105cee50721278b5cba0a85c52f
    source_path: web/webchat.md
    workflow: 16
---

Status: UI chat SwiftUI macOS/iOS berkomunikasi langsung dengan Gateway WebSocket.

## Apa ini

- UI chat native untuk gateway (tanpa browser tertanam dan tanpa server statis lokal).
- Menggunakan sesi dan aturan perutean yang sama seperti kanal lain.
- Perutean deterministik: balasan selalu kembali ke WebChat.

## Mulai cepat

1. Mulai gateway.
2. Buka UI WebChat (aplikasi macOS/iOS) atau tab chat Control UI.
3. Pastikan jalur autentikasi gateway yang valid telah dikonfigurasi (shared-secret secara default,
   bahkan pada loopback).

## Cara kerjanya (perilaku)

- UI terhubung ke Gateway WebSocket dan menggunakan `chat.history`, `chat.send`, `chat.inject`, dan `chat.transcribeAudio`.
- `chat.history` dibatasi demi stabilitas: Gateway dapat memotong kolom teks panjang, menghilangkan metadata berat, dan mengganti entri yang terlalu besar dengan `[chat.history omitted: message too large]`.
- `chat.history` mengikuti cabang transkrip aktif untuk file sesi append-only modern, sehingga cabang penulisan ulang yang ditinggalkan dan salinan prompt yang sudah digantikan tidak dirender di WebChat.
- Control UI mengingat Gateway `sessionId` dasar yang dikembalikan oleh `chat.history` dan menyertakannya pada panggilan lanjutan `chat.send`, sehingga koneksi ulang dan penyegaran halaman melanjutkan percakapan tersimpan yang sama kecuali pengguna memulai atau mereset sesi.
- Control UI menggabungkan submit in-flight duplikat untuk sesi, pesan, dan lampiran yang sama sebelum menghasilkan id run `chat.send` baru; Gateway tetap melakukan dedupe pada permintaan berulang yang menggunakan ulang kunci idempotensi yang sama.
- `chat.history` juga dinormalisasi untuk tampilan: konteks OpenClaw khusus runtime,
  pembungkus envelope masuk, tag arahan pengiriman inline
  seperti `[[reply_to_*]]` dan `[[audio_as_voice]]`, payload XML panggilan alat teks biasa
  (termasuk `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, dan blok panggilan alat yang terpotong), serta
  token kontrol model ASCII/full-width yang bocor dihapus dari teks yang terlihat,
  dan entri asisten yang seluruh teks terlihatnya hanya token senyap persis
  `NO_REPLY` / `no_reply` dihilangkan.
- Payload balasan yang ditandai sebagai penalaran (`isReasoning: true`) dikecualikan dari konten asisten WebChat, teks pemutaran ulang transkrip, dan blok konten audio, sehingga payload khusus pemikiran tidak muncul sebagai pesan asisten yang terlihat atau audio yang dapat diputar.
- `chat.transcribeAudio` menjalankan dikte sisi server di composer chat Control UI. Browser merekam audio mikrofon, mengirimkannya sebagai base64 ke Gateway, dan Gateway menjalankan pipeline `tools.media.audio` yang dikonfigurasi. Transkrip yang dikembalikan disisipkan ke draf; tidak ada run agen yang dimulai sampai pengguna mengirimkannya.
- `chat.inject` menambahkan catatan asisten langsung ke transkrip dan menyiarkannya ke UI (tanpa run agen).
- Run yang dibatalkan dapat tetap menampilkan output asisten parsial di UI.
- Gateway mempertahankan teks asisten parsial yang dibatalkan ke dalam riwayat transkrip saat output buffered ada, dan menandai entri tersebut dengan metadata pembatalan.
- Riwayat selalu diambil dari gateway (tanpa pemantauan file lokal).
- Jika gateway tidak dapat dijangkau, WebChat bersifat baca-saja.

## Panel alat agen Control UI

- Panel Tools Control UI `/agents` memiliki dua tampilan terpisah:
  - **Tersedia Saat Ini** menggunakan `tools.effective(sessionKey=...)` dan menampilkan apa yang benar-benar dapat digunakan sesi saat ini pada runtime, termasuk alat inti, plugin, dan milik kanal.
  - **Konfigurasi Alat** menggunakan `tools.catalog` dan tetap berfokus pada profil, override, dan semantik katalog.
- Ketersediaan runtime bersifat tercakup per sesi. Beralih sesi pada agen yang sama dapat mengubah daftar
  **Tersedia Saat Ini**.
- Editor konfigurasi tidak menyiratkan ketersediaan runtime; akses efektif tetap mengikuti prioritas kebijakan
  (`allow`/`deny`, override per agen dan provider/kanal).

## Penggunaan jarak jauh

- Mode jarak jauh membuat tunnel untuk gateway WebSocket melalui SSH/Tailscale.
- Anda tidak perlu menjalankan server WebChat terpisah.

## Referensi konfigurasi (WebChat)

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

Opsi WebChat:

- `gateway.webchat.chatHistoryMaxChars`: jumlah karakter maksimum untuk kolom teks dalam respons `chat.history`. Ketika entri transkrip melebihi batas ini, Gateway memotong kolom teks panjang dan dapat mengganti pesan yang terlalu besar dengan placeholder. `maxChars` per permintaan juga dapat dikirim oleh klien untuk menimpa default ini untuk satu panggilan `chat.history`.

Opsi global terkait:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autentikasi WebSocket shared-secret.
- `gateway.auth.allowTailscale`: tab chat Control UI browser dapat menggunakan header identitas Tailscale
  Serve saat diaktifkan.
- `gateway.auth.mode: "trusted-proxy"`: autentikasi reverse-proxy untuk klien browser di belakang sumber proxy **non-loopback** yang sadar identitas (lihat [Autentikasi Proxy Tepercaya](/id/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: target gateway jarak jauh.
- `session.*`: penyimpanan sesi dan default kunci utama.

## Terkait

- [Control UI](/id/web/control-ui)
- [Dashboard](/id/web/dashboard)
