---
read_when:
    - Men-debug atau mengonfigurasi akses WebChat
summary: Host statis WebChat loopback dan penggunaan WS Gateway untuk UI obrolan
title: WebChat
x-i18n:
    generated_at: "2026-07-16T18:40:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e31558b3f82fc75b660455ad7835e0b43ea07de28fbbc98d4efd82f5d30425fc
    source_path: web/webchat.md
    workflow: 16
---

Status: UI obrolan SwiftUI macOS/iOS berkomunikasi langsung dengan WebSocket Gateway. Tidak ada peramban tertanam, tidak ada server statis lokal.

## Apa itu

- UI obrolan native untuk Gateway.
- Menggunakan sesi dan aturan perutean yang sama seperti saluran lainnya.
- Perutean deterministik: balasan selalu kembali ke WebChat.
- Riwayat selalu diambil dari Gateway (tanpa pemantauan berkas lokal). Jika Gateway tidak dapat dijangkau, WebChat hanya dapat dibaca.

## Mulai cepat

1. Mulai Gateway.
2. Buka UI WebChat (aplikasi macOS/iOS) atau tab obrolan Control UI.
3. Pastikan jalur autentikasi Gateway yang valid telah dikonfigurasi (rahasia bersama secara default, bahkan pada loopback).

## Cara kerjanya

- UI terhubung ke WebSocket Gateway dan menggunakan metode RPC `chat.history`, `chat.send`, `chat.inject`, dan `chat.message.get`.
- `chat.history` dibatasi demi stabilitas: Gateway dapat memotong bidang teks yang panjang, menghilangkan metadata berat, dan mengganti entri yang terlalu besar dengan `[chat.history omitted: message too large]`. Klien API dapat mengirim `maxChars` per permintaan untuk mengganti batas default bagi satu panggilan.
- Ketika pesan asisten yang terlihat dipotong dalam `chat.history`, Control UI dapat membuka pembaca samping dan mengambil entri lengkap yang telah dinormalisasi untuk tampilan sesuai permintaan melalui `chat.message.get`, tanpa meningkatkan payload riwayat default. `chat.message.get` menggunakan cabang transkrip dan aturan tampilan yang sama seperti `chat.history`, tetapi menargetkan satu entri berdasarkan `messageId` dan mengembalikan alasan tidak tersedia yang sebenarnya ketika konten lengkap tidak lagi dapat dikembalikan.
- `chat.history` mengikuti cabang transkrip aktif untuk berkas sesi khusus-tambah, sehingga cabang penulisan ulang yang ditinggalkan dan salinan prompt yang telah digantikan tidak dirender di WebChat.
- Entri Compaction dirender sebagai pemisah "Riwayat yang dipadatkan" yang menjelaskan bahwa transkrip yang dipadatkan dipertahankan sebagai titik pemeriksaan, dengan tindakan untuk membuka titik pemeriksaan sesi (membuat cabang atau memulihkan, jika izin mengizinkan).
- Control UI mengingat `sessionId` Gateway pendukung yang dikembalikan oleh `chat.history` dan menyertakannya dalam panggilan `chat.send` lanjutan, sehingga koneksi ulang dan penyegaran halaman melanjutkan percakapan tersimpan yang sama kecuali pengguna memulai atau mengatur ulang sesi.
- `chat.send` menerima kunci idempotensi (Control UI menggunakan ID proses); Gateway menghapus duplikasi permintaan berulang yang menggunakan kembali kunci yang sama, sehingga pengiriman ulang atau duplikat yang masih berlangsung untuk sesi/pesan/lampiran yang sama tidak membuat proses kedua.
- Berkas permulaan ruang kerja dan instruksi `BOOTSTRAP.md` yang tertunda diberikan melalui bagian `# Project Context` pada prompt sistem agen, bukan disalin ke pesan pengguna WebChat. Jika konten bootstrap dipotong, prompt sistem akan menerima "Pemberitahuan Konteks Bootstrap" singkat sebagai gantinya; jumlah terperinci dan opsi konfigurasi tetap berada pada permukaan diagnostik.
- Normalisasi tampilan pada `chat.history` menghapus: konteks OpenClaw khusus runtime, pembungkus amplop masuk, tag direktif pengiriman sebaris seperti `[[reply_to_current]]`, `[[reply_to:<id>]]`, dan `[[audio_as_voice]]`, payload XML panggilan alat berupa teks biasa (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, termasuk blok yang dipotong), serta token kontrol model ASCII/lebar penuh yang bocor. Entri asisten yang seluruh teks terlihatnya hanya berupa token senyap `NO_REPLY` (tanpa membedakan huruf besar-kecil) dihilangkan.
- Payload balasan yang ditandai sebagai penalaran (`isReasoning: true`) dikecualikan dari konten asisten WebChat, teks pemutaran ulang transkrip, dan blok konten audio, sehingga payload khusus pemikiran tidak muncul sebagai pesan asisten yang terlihat atau audio yang dapat diputar.
- `chat.inject` menambahkan catatan asisten langsung ke transkrip dan menyiarkannya ke UI (tanpa menjalankan agen).
- Proses yang dibatalkan dapat mempertahankan keluaran parsial asisten agar tetap terlihat di UI. Gateway menyimpan teks parsial tersebut ke dalam riwayat transkrip ketika keluaran yang disangga tersedia, dan menandai entri dengan metadata pembatalan.

### Model transkrip dan pengiriman

WebChat memiliki dua jalur data terpisah:

- Baris transkrip SQLite merupakan transkrip model/runtime yang persisten. Untuk proses agen normal, runtime OpenClaw tertanam menyimpan pesan `user`, `assistant`, dan `toolResult` yang terlihat oleh model melalui pengakses sesi. WebChat tidak menulis teks pengiriman, status, atau bantuan arbitrer ke dalam transkrip tersebut.
- Peristiwa `ReplyPayload` Gateway merupakan proyeksi pengiriman langsung: dinormalisasi untuk tampilan WebChat/saluran, streaming blok, tag direktif, penyematan media, tanda TTS/audio, dan perilaku fallback UI. Peristiwa tersebut bukan merupakan log sesi kanonis.
- Harness yang memerlukan balasan terlihat melalui `tools.message` tetap menggunakan WebChat sebagai tujuan internal balasan sumber untuk proses saat ini. `message.send` tanpa target dari proses WebChat aktif tersebut diproyeksikan ke obrolan yang sama dan dicerminkan ke transkrip sesi; WebChat tidak menjadi saluran keluar yang dapat digunakan kembali dan tidak pernah mewarisi `lastChannel`.
- WebChat memasukkan entri transkrip asisten hanya ketika Gateway memiliki pesan yang ditampilkan di luar giliran agen tertanam normal: `chat.inject`, balasan perintah nonagen, keluaran parsial yang dibatalkan, dan pelengkap transkrip media yang dikelola WebChat.
- Jika teks asisten langsung muncul selama proses tetapi menghilang setelah riwayat dimuat ulang, periksa secara berurutan: apakah transkrip SQLite berisi teks asisten, apakah proyeksi tampilan `chat.history` menghapusnya, lalu apakah penggabungan ekor optimistis Control UI mengganti status pengiriman lokal dengan snapshot yang disimpan.

Jawaban akhir proses agen normal seharusnya persisten karena runtime tertanam menulis `message_end` asisten. Setiap fallback yang mencerminkan payload akhir terkirim ke dalam transkrip harus terlebih dahulu menghindari duplikasi giliran asisten yang telah ditulis oleh runtime tertanam.

## Panel alat agen Control UI

- Panel Tools `/agents` Control UI memiliki tampilan "Tersedia Saat Ini" yang didukung oleh `tools.effective(sessionKey=...)`: proyeksi hanya-baca yang berasal dari server atas inventaris alat sesi saat ini, termasuk alat inti, Plugin, milik saluran, dan server MCP yang telah ditemukan.
- Tampilan pengeditan konfigurasi terpisah (didukung oleh `tools.catalog`) mencakup profil, penggantian per agen, dan semantik katalog.
- Ketersediaan runtime terbatas pada sesi. Beralih sesi pada agen yang sama dapat mengubah daftar "Tersedia Saat Ini". Jika server MCP yang dikonfigurasi belum terhubung atau telah berubah sejak penemuan terakhir, panel menampilkan pemberitahuan alih-alih memulai transpor MCP secara diam-diam dari jalur baca.
- Editor konfigurasi tidak menyiratkan ketersediaan runtime; akses efektif tetap mengikuti prioritas kebijakan (`allow`/`deny`, penggantian per agen dan penyedia/saluran).

## Penggunaan jarak jauh

- Mode jarak jauh menyalurkan WebSocket Gateway melalui SSH/Tailscale.
- Anda tidak perlu menjalankan server WebChat terpisah.

## Referensi konfigurasi (WebChat)

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

WebChat tidak memiliki bagian konfigurasi yang dipertahankan. Gateway menggunakan batas tampilan bawaan `chat.history`; klien API dapat mengirim `maxChars` per permintaan untuk menggantinya bagi satu panggilan. Konfigurasi lama `channels.webchat` dan `gateway.webchat` telah dihentikan; jalankan `openclaw doctor --fix` untuk menghapusnya.

Opsi global terkait:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autentikasi WebSocket dengan rahasia bersama.
- `gateway.auth.allowTailscale`: tab obrolan Control UI di peramban dapat menggunakan header identitas
  Tailscale Serve ketika diaktifkan.
- `gateway.auth.mode: "trusted-proxy"`: autentikasi proksi balik untuk klien peramban di belakang sumber proksi **non-loopback** yang mengenali identitas (lihat [Autentikasi Proksi Tepercaya](/id/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: target Gateway jarak jauh.
- `session.*`: penyimpanan sesi dan default kunci utama.

## Terkait

- [Control UI](/id/web/control-ui)
- [Dasbor](/id/web/dashboard)
