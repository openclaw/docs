---
read_when:
    - Men-debug atau mengonfigurasi akses WebChat
summary: Host statis loopback WebChat dan penggunaan WS Gateway untuk UI chat
title: WebChat
x-i18n:
    generated_at: "2026-04-05T14:10:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2588be04e9ae38149bdf284bf4d75b6784d63899026d2351c4e0e7efdf05ff39
    source_path: web/webchat.md
    workflow: 15
---

# WebChat (UI WebSocket Gateway)

Status: UI chat SwiftUI macOS/iOS berbicara langsung ke Gateway WebSocket.

## Apa itu

- UI chat native untuk gateway (tanpa browser tersemat dan tanpa server statis lokal).
- Menggunakan sesi dan aturan routing yang sama seperti channel lainnya.
- Routing deterministik: balasan selalu kembali ke WebChat.

## Memulai cepat

1. Mulai gateway.
2. Buka UI WebChat (app macOS/iOS) atau tab chat Control UI.
3. Pastikan jalur auth gateway yang valid sudah dikonfigurasi (shared-secret secara default,
   bahkan pada loopback).

## Cara kerjanya (perilaku)

- UI terhubung ke Gateway WebSocket dan menggunakan `chat.history`, `chat.send`, dan `chat.inject`.
- `chat.history` dibatasi demi stabilitas: Gateway dapat memotong field teks yang panjang, menghilangkan metadata yang berat, dan mengganti entri yang terlalu besar dengan `[chat.history omitted: message too large]`.
- `chat.history` juga dinormalisasi untuk tampilan: tag directive pengiriman inline
  seperti `[[reply_to_*]]` dan `[[audio_as_voice]]`, payload XML tool-call
  teks biasa (termasuk `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, dan blok tool-call yang terpotong), serta
  token kontrol model ASCII/full-width yang bocor dihapus dari teks yang terlihat,
  dan entri asisten yang seluruh teks terlihatnya hanya token diam persis
  `NO_REPLY` / `no_reply` dihilangkan.
- `chat.inject` menambahkan catatan asisten langsung ke transkrip dan menyiarkannya ke UI (tanpa eksekusi agen).
- Eksekusi yang dibatalkan dapat tetap menampilkan keluaran asisten parsial di UI.
- Gateway mempersistenkan teks asisten parsial yang dibatalkan ke riwayat transkrip ketika keluaran yang dibuffer ada, dan menandai entri tersebut dengan metadata pembatalan.
- Riwayat selalu diambil dari gateway (tanpa pemantauan file lokal).
- Jika gateway tidak dapat dijangkau, WebChat bersifat baca-saja.

## Panel tool agen di Control UI

- Panel Tools `/agents` pada Control UI memiliki dua tampilan terpisah:
  - **Available Right Now** menggunakan `tools.effective(sessionKey=...)` dan menampilkan apa yang benar-benar
    dapat digunakan sesi saat ini pada runtime, termasuk tool milik core, plugin, dan channel.
  - **Tool Configuration** menggunakan `tools.catalog` dan tetap berfokus pada profil, override, dan
    semantik katalog.
- Ketersediaan runtime memiliki scope sesi. Berpindah sesi pada agen yang sama dapat mengubah daftar
  **Available Right Now**.
- Editor config tidak menyiratkan ketersediaan runtime; akses efektif tetap mengikuti precedence
  kebijakan (`allow`/`deny`, override per agen dan per provider/channel).

## Penggunaan jarak jauh

- Mode jarak jauh menyalurkan Gateway WebSocket melalui SSH/Tailscale.
- Anda tidak perlu menjalankan server WebChat terpisah.

## Referensi konfigurasi (WebChat)

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

Opsi WebChat:

- `gateway.webchat.chatHistoryMaxChars`: jumlah karakter maksimum untuk field teks dalam respons `chat.history`. Ketika entri transkrip melebihi batas ini, Gateway memotong field teks yang panjang dan dapat mengganti pesan yang terlalu besar dengan placeholder. `maxChars` per request juga dapat dikirim oleh klien untuk mengoverride default ini untuk satu panggilan `chat.history`.

Opsi global terkait:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  auth WebSocket shared-secret.
- `gateway.auth.allowTailscale`: tab chat Control UI berbasis browser dapat menggunakan header identitas Tailscale
  Serve saat diaktifkan.
- `gateway.auth.mode: "trusted-proxy"`: auth reverse-proxy untuk klien browser di belakang sumber proxy **non-loopback** yang sadar identitas (lihat [Auth Trusted Proxy](/id/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: target gateway jarak jauh.
- `session.*`: penyimpanan sesi dan default key utama.
