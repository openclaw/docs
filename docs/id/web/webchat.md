---
read_when:
    - Men-debug atau mengonfigurasi akses WebChat
summary: Penggunaan host statis WebChat loopback dan Gateway WS untuk UI chat
title: WebChat
x-i18n:
    generated_at: "2026-04-26T11:41:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: eb64bf7771f833a6d97c1b0ad773e763422af25e85a3084519e05aa8d3d0ab69
    source_path: web/webchat.md
    workflow: 15
---

Status: UI chat SwiftUI macOS/iOS berbicara langsung ke WebSocket Gateway.

## Apa itu

- UI chat native untuk gateway (tanpa browser tersemat dan tanpa server statis lokal).
- Menggunakan sesi dan aturan perutean yang sama seperti saluran lain.
- Perutean deterministik: balasan selalu kembali ke WebChat.

## Mulai cepat

1. Mulai gateway.
2. Buka UI WebChat (app macOS/iOS) atau tab chat Control UI.
3. Pastikan jalur autentikasi gateway yang valid telah dikonfigurasi (default-nya shared-secret,
   bahkan pada loopback).

## Cara kerjanya (perilaku)

- UI terhubung ke WebSocket Gateway dan menggunakan `chat.history`, `chat.send`, dan `chat.inject`.
- `chat.history` dibatasi demi stabilitas: Gateway dapat memangkas field teks yang panjang, menghilangkan metadata yang berat, dan mengganti entri yang terlalu besar dengan `[chat.history omitted: message too large]`.
- `chat.history` juga dinormalisasi untuk tampilan: konteks OpenClaw yang hanya untuk runtime,
  wrapper envelope masuk, tag direktif pengiriman inline
  seperti `[[reply_to_*]]` dan `[[audio_as_voice]]`, payload XML pemanggilan alat
  teks biasa (termasuk `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, dan blok pemanggilan alat yang terpotong), serta
  token kontrol model ASCII/full-width yang bocor dihapus dari teks yang terlihat,
  dan entri asisten yang seluruh teks terlihatnya hanya token senyap
  persis `NO_REPLY` / `no_reply` dihilangkan.
- Payload balasan yang ditandai sebagai reasoning (`isReasoning: true`) dikecualikan dari konten asisten WebChat, teks replay transkrip, dan blok konten audio, sehingga payload khusus thinking tidak muncul sebagai pesan asisten yang terlihat atau audio yang dapat diputar.
- `chat.inject` menambahkan catatan asisten langsung ke transkrip dan menyiarkannya ke UI (tanpa eksekusi agen).
- Eksekusi yang dibatalkan dapat mempertahankan keluaran asisten parsial tetap terlihat di UI.
- Gateway mempertahankan teks asisten parsial yang dibatalkan ke riwayat transkrip saat keluaran buffer tersedia, dan menandai entri tersebut dengan metadata pembatalan.
- Riwayat selalu diambil dari gateway (tanpa pemantauan file lokal).
- Jika gateway tidak dapat dijangkau, WebChat bersifat hanya-baca.

## Panel alat agen Control UI

- Panel Alat `/agents` di Control UI memiliki dua tampilan terpisah:
  - **Tersedia Saat Ini** menggunakan `tools.effective(sessionKey=...)` dan menampilkan apa yang benar-benar
    dapat digunakan sesi saat ini saat runtime, termasuk alat milik core, Plugin, dan saluran.
  - **Konfigurasi Alat** menggunakan `tools.catalog` dan tetap berfokus pada profil, override, dan
    semantik katalog.
- Ketersediaan runtime dicakup per sesi. Mengganti sesi pada agen yang sama dapat mengubah daftar
  **Tersedia Saat Ini**.
- Editor config tidak menyiratkan ketersediaan runtime; akses efektif tetap mengikuti prioritas kebijakan
  (`allow`/`deny`, override per agen dan provider/saluran).

## Penggunaan jarak jauh

- Mode jarak jauh menyalurkan WebSocket gateway melalui SSH/Tailscale.
- Anda tidak perlu menjalankan server WebChat terpisah.

## Referensi konfigurasi (WebChat)

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

Opsi WebChat:

- `gateway.webchat.chatHistoryMaxChars`: jumlah karakter maksimum untuk field teks dalam respons `chat.history`. Saat entri transkrip melebihi batas ini, Gateway memangkas field teks yang panjang dan dapat mengganti pesan yang terlalu besar dengan placeholder. `maxChars` per permintaan juga dapat dikirim oleh klien untuk menimpa default ini untuk satu panggilan `chat.history`.

Opsi global terkait:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autentikasi WebSocket shared-secret.
- `gateway.auth.allowTailscale`: tab chat Control UI berbasis browser dapat menggunakan header identitas Tailscale
  Serve saat diaktifkan.
- `gateway.auth.mode: "trusted-proxy"`: autentikasi reverse-proxy untuk klien browser di belakang sumber proxy **non-loopback** yang sadar identitas (lihat [Trusted Proxy Auth](/id/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: target gateway jarak jauh.
- `session.*`: penyimpanan sesi dan default kunci utama.

## Terkait

- [Control UI](/id/web/control-ui)
- [Dashboard](/id/web/dashboard)
