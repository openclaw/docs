---
read_when:
    - Men-debug atau mengonfigurasi akses WebChat
summary: Host statis WebChat loopback dan penggunaan WS Gateway untuk UI chat
title: WebChat
x-i18n:
    generated_at: "2026-04-24T09:34:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 466e1e92ea5b8bb979a34985b9cd9618c94a0a4a424444024edda26c46540f1e
    source_path: web/webchat.md
    workflow: 15
---

Status: UI chat SwiftUI macOS/iOS berbicara langsung ke WebSocket Gateway.

## Apa ini

- UI chat native untuk gateway (tanpa browser tertanam dan tanpa server statis lokal).
- Menggunakan sesi dan aturan perutean yang sama seperti channel lain.
- Perutean deterministik: balasan selalu kembali ke WebChat.

## Memulai dengan cepat

1. Mulai gateway.
2. Buka UI WebChat (aplikasi macOS/iOS) atau tab chat UI Control.
3. Pastikan jalur autentikasi gateway yang valid dikonfigurasi (shared-secret secara default,
   bahkan pada loopback).

## Cara kerjanya (perilaku)

- UI terhubung ke WebSocket Gateway dan menggunakan `chat.history`, `chat.send`, dan `chat.inject`.
- `chat.history` dibatasi demi stabilitas: Gateway dapat memotong field teks panjang, menghilangkan metadata berat, dan mengganti entri yang terlalu besar dengan `[chat.history omitted: message too large]`.
- `chat.history` juga dinormalkan untuk tampilan: tag directive pengiriman inline
  seperti `[[reply_to_*]]` dan `[[audio_as_voice]]`, payload XML tool-call
  dalam teks biasa (termasuk `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, dan blok tool-call yang terpotong), serta
  token kontrol model ASCII/full-width yang bocor dihapus dari teks yang terlihat,
  dan entri asisten yang seluruh teks terlihatnya hanya token diam persis
  `NO_REPLY` / `no_reply` akan dihilangkan.
- `chat.inject` menambahkan catatan asisten langsung ke transkrip dan menyiarkannya ke UI (tanpa eksekusi agen).
- Eksekusi yang dibatalkan dapat mempertahankan output asisten parsial tetap terlihat di UI.
- Gateway menyimpan teks asisten parsial yang dibatalkan ke riwayat transkrip saat output yang dibuffer ada, dan menandai entri tersebut dengan metadata pembatalan.
- Riwayat selalu diambil dari gateway (tanpa pemantauan file lokal).
- Jika gateway tidak dapat dijangkau, WebChat menjadi hanya-baca.

## Panel alat agen UI Control

- Panel Tools `/agents` di UI Control memiliki dua tampilan terpisah:
  - **Available Right Now** menggunakan `tools.effective(sessionKey=...)` dan menampilkan apa yang benar-benar
    dapat digunakan sesi saat ini pada runtime, termasuk alat inti, Plugin, dan alat milik channel.
  - **Tool Configuration** menggunakan `tools.catalog` dan tetap berfokus pada profil, override, dan
    semantik katalog.
- Ketersediaan runtime bersifat per sesi. Berpindah sesi pada agen yang sama dapat mengubah daftar
  **Available Right Now**.
- Editor konfigurasi tidak menyiratkan ketersediaan runtime; akses efektif tetap mengikuti prioritas
  kebijakan (`allow`/`deny`, override per agen dan provider/channel).

## Penggunaan remote

- Mode remote menyalurkan WebSocket gateway melalui SSH/Tailscale.
- Anda tidak perlu menjalankan server WebChat terpisah.

## Referensi konfigurasi (WebChat)

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

Opsi WebChat:

- `gateway.webchat.chatHistoryMaxChars`: jumlah karakter maksimum untuk field teks dalam respons `chat.history`. Saat entri transkrip melebihi batas ini, Gateway memotong field teks panjang dan dapat mengganti pesan yang terlalu besar dengan placeholder. `maxChars` per permintaan juga dapat dikirim oleh klien untuk mengganti default ini hanya untuk satu panggilan `chat.history`.

Opsi global terkait:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autentikasi WebSocket shared-secret.
- `gateway.auth.allowTailscale`: tab chat UI Control browser dapat menggunakan header identitas Tailscale
  Serve saat diaktifkan.
- `gateway.auth.mode: "trusted-proxy"`: autentikasi reverse-proxy untuk klien browser di belakang sumber proxy **non-loopback** yang sadar identitas (lihat [Trusted Proxy Auth](/id/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: target gateway remote.
- `session.*`: penyimpanan sesi dan default kunci utama.

## Terkait

- [UI Control](/id/web/control-ui)
- [Dasbor](/id/web/dashboard)
