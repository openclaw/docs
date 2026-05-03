---
read_when:
    - Men-debug atau mengonfigurasi akses WebChat
summary: Host statis WebChat Loopback dan penggunaan WS Gateway untuk UI chat
title: Chat Web
x-i18n:
    generated_at: "2026-05-03T09:21:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48024e58259901c6feb67168c5c1ce32f46b8ad9b6f4511e56d2000478a3ed60
    source_path: web/webchat.md
    workflow: 16
---

Status: UI chat SwiftUI macOS/iOS berbicara langsung ke WebSocket Gateway.

## Apa itu

- UI chat native untuk Gateway (tanpa browser tertanam dan tanpa server statis lokal).
- Menggunakan sesi dan aturan perutean yang sama seperti channel lain.
- Perutean deterministik: balasan selalu kembali ke WebChat.

## Mulai cepat

1. Mulai Gateway.
2. Buka UI WebChat (aplikasi macOS/iOS) atau tab chat Control UI.
3. Pastikan jalur auth Gateway yang valid telah dikonfigurasi (shared-secret secara default,
   bahkan pada loopback).

## Cara kerjanya (perilaku)

- UI terhubung ke WebSocket Gateway dan menggunakan `chat.history`, `chat.send`, dan `chat.inject`.
- `chat.history` dibatasi demi stabilitas: Gateway dapat memotong field teks yang panjang, menghilangkan metadata berat, dan mengganti entri yang terlalu besar dengan `[chat.history omitted: message too large]`.
- `chat.history` mengikuti cabang transkrip aktif untuk file sesi append-only modern, sehingga cabang rewrite yang ditinggalkan dan salinan prompt yang digantikan tidak dirender di WebChat.
- Entri Compaction dirender sebagai pembatas riwayat terpadatkan yang eksplisit. Pembatas tersebut menjelaskan bahwa giliran sebelumnya dipertahankan di checkpoint dan menautkan ke kontrol checkpoint Sesi, tempat operator dapat membuat cabang atau memulihkan tampilan pra-Compaction ketika izin mereka mengizinkannya.
- Control UI mengingat `sessionId` Gateway pendukung yang dikembalikan oleh `chat.history` dan menyertakannya pada panggilan lanjutan `chat.send`, sehingga koneksi ulang dan refresh halaman melanjutkan percakapan tersimpan yang sama kecuali pengguna memulai atau mereset sesi.
- Control UI menggabungkan submit in-flight duplikat untuk sesi, pesan, dan lampiran yang sama sebelum membuat id run `chat.send` baru; Gateway tetap melakukan dedupe pada permintaan berulang yang memakai ulang kunci idempotensi yang sama.
- `chat.history` juga dinormalisasi untuk tampilan: konteks OpenClaw yang hanya runtime,
  pembungkus envelope masuk, tag direktif pengiriman inline
  seperti `[[reply_to_*]]` dan `[[audio_as_voice]]`, payload XML tool-call teks polos
  (termasuk `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, dan blok tool-call yang terpotong), serta
  token kontrol model ASCII/full-width yang bocor dihapus dari teks yang terlihat,
  dan entri asisten yang seluruh teks terlihatnya hanya token senyap persis
  `NO_REPLY` / `no_reply` dihilangkan.
- Payload balasan yang ditandai reasoning (`isReasoning: true`) dikecualikan dari konten asisten WebChat, teks replay transkrip, dan blok konten audio, sehingga payload khusus pemikiran tidak muncul sebagai pesan asisten yang terlihat atau audio yang dapat diputar.
- `chat.inject` menambahkan catatan asisten langsung ke transkrip dan menyiarkannya ke UI (tanpa run agen).
- Run yang dibatalkan dapat tetap mempertahankan output asisten parsial yang terlihat di UI.
- Gateway mempertahankan teks asisten parsial yang dibatalkan ke riwayat transkrip ketika output yang di-buffer ada, dan menandai entri tersebut dengan metadata pembatalan.
- Riwayat selalu diambil dari Gateway (tanpa pemantauan file lokal).
- Jika Gateway tidak dapat dijangkau, WebChat bersifat hanya-baca.

## Panel alat agen Control UI

- Panel Tools Control UI `/agents` memiliki dua tampilan terpisah:
  - **Tersedia Saat Ini** menggunakan `tools.effective(sessionKey=...)` dan menampilkan apa yang benar-benar dapat digunakan
    sesi saat ini pada runtime, termasuk alat milik core, Plugin, dan channel.
  - **Konfigurasi Alat** menggunakan `tools.catalog` dan tetap berfokus pada profil, override, dan
    semantik katalog.
- Ketersediaan runtime bersifat terikat sesi. Berpindah sesi pada agen yang sama dapat mengubah daftar
  **Tersedia Saat Ini**.
- Editor konfigurasi tidak menyiratkan ketersediaan runtime; akses efektif tetap mengikuti prioritas kebijakan
  (`allow`/`deny`, override per agen dan provider/channel).

## Penggunaan jarak jauh

- Mode jarak jauh menyalurkan WebSocket Gateway melalui SSH/Tailscale.
- Anda tidak perlu menjalankan server WebChat terpisah.

## Referensi konfigurasi (WebChat)

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

Opsi WebChat:

- `gateway.webchat.chatHistoryMaxChars`: jumlah karakter maksimum untuk field teks dalam respons `chat.history`. Ketika entri transkrip melampaui batas ini, Gateway memotong field teks yang panjang dan dapat mengganti pesan yang terlalu besar dengan placeholder. `maxChars` per permintaan juga dapat dikirim oleh klien untuk mengganti default ini untuk satu panggilan `chat.history`.

Opsi global terkait:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  auth WebSocket shared-secret.
- `gateway.auth.allowTailscale`: tab chat Control UI browser dapat menggunakan header identitas Tailscale
  Serve saat diaktifkan.
- `gateway.auth.mode: "trusted-proxy"`: auth reverse-proxy untuk klien browser di belakang sumber proxy **non-loopback** yang sadar identitas (lihat [Auth Proxy Tepercaya](/id/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: target Gateway jarak jauh.
- `session.*`: penyimpanan sesi dan default kunci utama.

## Terkait

- [Control UI](/id/web/control-ui)
- [Dasbor](/id/web/dashboard)
