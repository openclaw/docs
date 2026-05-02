---
read_when:
    - Menelusuri kesalahan atau mengonfigurasi akses WebChat
summary: Host statis WebChat loopback dan penggunaan WS Gateway untuk UI obrolan
title: Obrolan Web
x-i18n:
    generated_at: "2026-05-02T09:35:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe6d3cb30ed18d651b0d0ca8fd188b47c5f1d186410ee340deb79315f194ed8d
    source_path: web/webchat.md
    workflow: 16
---

Status: UI chat SwiftUI macOS/iOS berkomunikasi langsung dengan Gateway WebSocket.

## Apa ini

- UI chat native untuk gateway (tanpa browser tertanam dan tanpa server statis lokal).
- Menggunakan sesi dan aturan perutean yang sama seperti channel lain.
- Perutean deterministik: balasan selalu kembali ke WebChat.

## Mulai cepat

1. Jalankan gateway.
2. Buka UI WebChat (aplikasi macOS/iOS) atau tab chat Control UI.
3. Pastikan jalur auth gateway yang valid telah dikonfigurasi (shared-secret secara default,
   bahkan pada loopback).

## Cara kerjanya (perilaku)

- UI terhubung ke Gateway WebSocket dan menggunakan `chat.history`, `chat.send`, dan `chat.inject`.
- `chat.history` dibatasi untuk stabilitas: Gateway dapat memotong kolom teks panjang, menghilangkan metadata berat, dan mengganti entri yang terlalu besar dengan `[chat.history omitted: message too large]`.
- `chat.history` mengikuti cabang transkrip aktif untuk file sesi append-only modern, sehingga cabang penulisan ulang yang ditinggalkan dan salinan prompt yang tergantikan tidak dirender di WebChat.
- Control UI mengingat Gateway `sessionId` pendukung yang dikembalikan oleh `chat.history` dan menyertakannya pada panggilan lanjutan `chat.send`, sehingga koneksi ulang dan penyegaran halaman melanjutkan percakapan tersimpan yang sama kecuali pengguna memulai atau mereset sesi.
- Control UI menggabungkan submit dalam proses yang duplikat untuk sesi, pesan, dan lampiran yang sama sebelum membuat id run `chat.send` baru; Gateway tetap melakukan dedupe pada permintaan berulang yang memakai kembali kunci idempotensi yang sama.
- `chat.history` juga dinormalisasi untuk tampilan: konteks OpenClaw khusus runtime,
  pembungkus envelope masuk, tag directive pengiriman inline
  seperti `[[reply_to_*]]` dan `[[audio_as_voice]]`, payload XML tool-call teks biasa
  (termasuk `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, dan blok tool-call yang terpotong), serta
  token kontrol model ASCII/full-width yang bocor dihapus dari teks yang terlihat,
  dan entri assistant yang seluruh teks terlihatnya hanya token senyap persis
  `NO_REPLY` / `no_reply` dihilangkan.
- Payload balasan bertanda reasoning (`isReasoning: true`) dikecualikan dari konten assistant WebChat, teks replay transkrip, dan blok konten audio, sehingga payload khusus berpikir tidak muncul sebagai pesan assistant yang terlihat atau audio yang dapat diputar.
- `chat.inject` menambahkan catatan assistant langsung ke transkrip dan menyiarkannya ke UI (tanpa run agent).
- Run yang dibatalkan dapat tetap menampilkan output assistant parsial di UI.
- Gateway menyimpan teks assistant parsial yang dibatalkan ke dalam riwayat transkrip saat output buffer tersedia, dan menandai entri tersebut dengan metadata pembatalan.
- Riwayat selalu diambil dari gateway (tanpa pemantauan file lokal).
- Jika gateway tidak dapat dijangkau, WebChat bersifat hanya-baca.

## Panel alat agent Control UI

- Panel Tools Control UI `/agents` memiliki dua tampilan terpisah:
  - **Tersedia Saat Ini** menggunakan `tools.effective(sessionKey=...)` dan menampilkan apa yang benar-benar dapat digunakan sesi saat ini pada runtime, termasuk alat milik core, plugin, dan channel.
  - **Konfigurasi Alat** menggunakan `tools.catalog` dan tetap berfokus pada profil, override, dan semantik katalog.
- Ketersediaan runtime bersifat tercakup per sesi. Mengganti sesi pada agent yang sama dapat mengubah daftar
  **Tersedia Saat Ini**.
- Editor konfigurasi tidak menyiratkan ketersediaan runtime; akses efektif tetap mengikuti presedensi kebijakan
  (`allow`/`deny`, override per-agent dan provider/channel).

## Penggunaan jarak jauh

- Mode jarak jauh menyalurkan Gateway WebSocket melalui SSH/Tailscale.
- Anda tidak perlu menjalankan server WebChat terpisah.

## Referensi konfigurasi (WebChat)

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

Opsi WebChat:

- `gateway.webchat.chatHistoryMaxChars`: jumlah karakter maksimum untuk kolom teks dalam respons `chat.history`. Saat entri transkrip melebihi batas ini, Gateway memotong kolom teks panjang dan dapat mengganti pesan yang terlalu besar dengan placeholder. `maxChars` per-permintaan juga dapat dikirim oleh klien untuk menimpa default ini bagi satu panggilan `chat.history`.

Opsi global terkait:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  auth WebSocket shared-secret.
- `gateway.auth.allowTailscale`: tab chat browser Control UI dapat menggunakan header identitas Tailscale
  Serve saat diaktifkan.
- `gateway.auth.mode: "trusted-proxy"`: auth reverse-proxy untuk klien browser di belakang sumber proxy **non-loopback** yang sadar identitas (lihat [Auth Proxy Tepercaya](/id/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: target gateway jarak jauh.
- `session.*`: penyimpanan sesi dan default kunci utama.

## Terkait

- [Control UI](/id/web/control-ui)
- [Dasbor](/id/web/dashboard)
