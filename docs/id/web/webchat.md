---
read_when:
    - Men-debug atau mengonfigurasi akses WebChat
summary: Host statis WebChat loopback dan penggunaan WS Gateway untuk UI obrolan
title: WebChat
x-i18n:
    generated_at: "2026-07-19T05:16:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 05309caff8e3fe5d14627ea9bc50667c5154a2f493ef4fd1e813d9d9bf82fbc4
    source_path: web/webchat.md
    workflow: 16
---

Status: antarmuka chat SwiftUI macOS/iOS berkomunikasi langsung dengan WebSocket Gateway. Tidak ada peramban tertanam, tidak ada server statis lokal.

## Apa itu

- Antarmuka chat native untuk Gateway.
- Menggunakan sesi dan aturan perutean yang sama seperti saluran lainnya.
- Perutean deterministik: balasan selalu dikirim kembali ke WebChat.
- Riwayat selalu diambil dari Gateway (tanpa pemantauan file lokal). Jika Gateway tidak dapat dijangkau, WebChat bersifat hanya-baca.

## Mulai cepat

1. Mulai Gateway.
2. Buka antarmuka WebChat (aplikasi macOS/iOS) atau tab chat Control UI.
3. Pastikan jalur autentikasi Gateway yang valid telah dikonfigurasi (secara default menggunakan rahasia bersama, bahkan pada loopback).

## Cara kerjanya

- Antarmuka terhubung ke WebSocket Gateway dan menggunakan metode RPC `chat.history`, `chat.send`, `chat.inject`, dan `chat.message.get`.
- `chat.history` dibatasi demi stabilitas: Gateway dapat memotong kolom teks yang panjang, menghilangkan metadata berukuran besar, dan mengganti entri yang terlalu besar dengan `[chat.history omitted: message too large]`. Klien API dapat mengirim `maxChars` per permintaan untuk mengganti batas default bagi satu panggilan.
- Ketika pesan asisten yang terlihat terpotong dalam `chat.history`, Control UI dapat membuka pembaca samping dan mengambil entri lengkap yang telah dinormalisasi untuk tampilan sesuai permintaan melalui `chat.message.get`, tanpa meningkatkan muatan riwayat default. `chat.message.get` menggunakan cabang transkrip dan aturan tampilan yang sama seperti `chat.history`, tetapi menargetkan satu entri berdasarkan `messageId` dan mengembalikan alasan ketidaktersediaan yang sebenarnya ketika konten lengkap tidak lagi dapat dikembalikan.
- `chat.history` mengikuti cabang transkrip aktif untuk file sesi yang hanya dapat ditambahi, sehingga cabang penulisan ulang yang ditinggalkan dan salinan prompt yang telah digantikan tidak dirender di WebChat.
- Entri Compaction dirender sebagai pemisah "Riwayat yang dipadatkan" yang menjelaskan bahwa transkrip yang dipadatkan dipertahankan sebagai titik pemeriksaan, dengan tindakan untuk membuka titik pemeriksaan sesi (membuat cabang atau memulihkan, jika izin memungkinkan).
- Control UI mengingat `sessionId` Gateway pendukung yang dikembalikan oleh `chat.history` dan menyertakannya pada panggilan `chat.send` berikutnya, sehingga penyambungan ulang dan penyegaran halaman melanjutkan percakapan tersimpan yang sama kecuali pengguna memulai atau mengatur ulang sesi.
- `chat.send` menerima kunci idempotensi (Control UI menggunakan ID proses); Gateway mendeduplikasi permintaan berulang yang menggunakan kembali kunci yang sama, sehingga pengiriman ulang atau duplikat yang masih berlangsung untuk sesi/pesan/lampiran yang sama tidak membuat proses kedua.
- Membalas pesan tertentu (klik kanan → Reply) mengirim ID transkrip target sebagai `replyToId` pada `chat.send`. Gateway mencari pesan tersebut dari riwayat sesi dan mengisi metadata konteks balasan agnostik-saluran yang sama seperti yang digunakan balasan Discord: agen melihat `has_reply_context` beserta blok tidak tepercaya "Target balasan pesan pengguna saat ini" yang memuat label pengirim dan isi pesan. (Prompt WebChat tetap menyembunyikan ID percakapan volatil seperti `reply_to_id`, sesuai kebijakan prompt stabil-byte yang ada untuk sesi WebChat langsung.) Target balasan tanpa ID transkrip yang dipertahankan (misalnya pengiriman yang masih tertunda) kembali menggunakan kutipan sebaris dalam isi pesan.
- File awal ruang kerja dan instruksi `BOOTSTRAP.md` yang tertunda disediakan melalui bagian `# Project Context` pada prompt sistem agen, bukan disalin ke pesan pengguna WebChat. Jika konten bootstrap terpotong, prompt sistem akan menerima "Pemberitahuan Konteks Bootstrap" singkat sebagai gantinya; jumlah terperinci dan opsi konfigurasi tetap tersedia pada permukaan diagnostik.
- Normalisasi tampilan pada `chat.history` menghapus: konteks OpenClaw khusus runtime, pembungkus amplop masuk, tag arahan pengiriman sebaris seperti `[[reply_to_current]]`, `[[reply_to:<id>]]`, dan `[[audio_as_voice]]`, muatan XML panggilan alat dalam teks biasa (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, termasuk blok yang terpotong), serta token kontrol model ASCII/lebar-penuh yang bocor. Entri asisten yang seluruh teks terlihatnya hanya berupa token senyap `NO_REPLY` (tanpa membedakan huruf besar-kecil) dihilangkan.
- Muatan balasan yang ditandai sebagai penalaran (`isReasoning: true`) dikecualikan dari konten asisten WebChat, teks pemutaran ulang transkrip, dan blok konten audio, sehingga muatan yang hanya berisi pemikiran tidak muncul sebagai pesan asisten yang terlihat atau audio yang dapat diputar.
- `chat.inject` menambahkan catatan asisten secara langsung ke transkrip dan menyiarkannya ke antarmuka (tanpa menjalankan agen).
- Proses yang dibatalkan dapat mempertahankan keluaran parsial asisten agar tetap terlihat di antarmuka. Gateway menyimpan teks parsial tersebut ke dalam riwayat transkrip ketika terdapat keluaran dalam buffer, dan menandai entri tersebut dengan metadata pembatalan.

### Model transkrip dan pengiriman

WebChat memiliki dua jalur data terpisah:

- Baris transkrip SQLite merupakan transkrip model/runtime yang tahan lama. Untuk proses agen normal, runtime OpenClaw tertanam menyimpan pesan `user`, `assistant`, dan `toolResult` yang terlihat oleh model melalui pengakses sesi. WebChat tidak menulis teks pengiriman, status, atau bantuan sembarang ke dalam transkrip tersebut.
- Peristiwa `ReplyPayload` Gateway merupakan proyeksi pengiriman langsung: dinormalisasi untuk tampilan WebChat/saluran, streaming blok, tag arahan, penyematan media, tanda TTS/audio, dan perilaku fallback antarmuka. Peristiwa tersebut bukan log sesi kanonis.
- Harness yang memerlukan balasan terlihat melalui `tools.message` tetap menggunakan WebChat sebagai tujuan balasan sumber internal untuk proses saat ini. `message.send` tanpa target dari proses WebChat aktif tersebut diproyeksikan ke chat yang sama dan dicerminkan ke transkrip sesi; WebChat tidak menjadi saluran keluar yang dapat digunakan kembali dan tidak pernah mewarisi `lastChannel`.
- WebChat menyuntikkan entri transkrip asisten hanya ketika Gateway memiliki pesan yang ditampilkan di luar giliran agen tertanam normal: `chat.inject`, balasan perintah non-agen, keluaran parsial yang dibatalkan, dan suplemen transkrip media yang dikelola WebChat.
- Jika teks asisten langsung muncul selama proses tetapi menghilang setelah riwayat dimuat ulang, periksa secara berurutan: apakah transkrip SQLite berisi teks asisten tersebut, apakah proyeksi tampilan `chat.history` menghapusnya, lalu apakah penggabungan ekor optimistis Control UI mengganti status pengiriman lokal dengan snapshot yang dipertahankan.

Jawaban akhir proses agen normal seharusnya tahan lama karena runtime tertanam menulis `message_end` asisten. Setiap fallback yang mencerminkan muatan akhir terkirim ke transkrip harus terlebih dahulu menghindari duplikasi giliran asisten yang telah ditulis oleh runtime tertanam.

## Panel alat agen Control UI

- Panel Alat `/agents` Control UI memiliki tampilan "Tersedia Saat Ini" yang didukung oleh `tools.effective(sessionKey=...)`: proyeksi hanya-baca yang berasal dari server mengenai inventaris alat sesi saat ini, termasuk alat inti, Plugin, milik saluran, dan server MCP yang telah ditemukan.
- Tampilan pengeditan konfigurasi terpisah (didukung oleh `tools.catalog`) mencakup profil, penggantian per agen, dan semantik katalog.
- Ketersediaan runtime memiliki cakupan sesi. Beralih sesi pada agen yang sama dapat mengubah daftar "Tersedia Saat Ini". Jika server MCP yang dikonfigurasi belum terhubung atau telah berubah sejak penemuan terakhir, panel menampilkan pemberitahuan alih-alih secara diam-diam memulai transport MCP dari jalur baca.
- Editor konfigurasi tidak menyiratkan ketersediaan runtime; akses efektif tetap mengikuti urutan prioritas kebijakan (`allow`/`deny`, penggantian per agen dan penyedia/saluran).

## Penggunaan jarak jauh

- Mode jarak jauh meneruskan WebSocket Gateway melalui terowongan SSH/Tailscale.
- Anda tidak perlu menjalankan server WebChat terpisah.

## Referensi konfigurasi (WebChat)

Konfigurasi lengkap: [Konfigurasi](/id/gateway/configuration)

WebChat tidak memiliki bagian konfigurasi yang dipertahankan. Gateway menggunakan batas tampilan bawaan `chat.history`; klien API dapat mengirim `maxChars` per permintaan untuk menggantinya bagi satu panggilan. Konfigurasi lama `channels.webchat` dan `gateway.webchat` telah dihentikan; jalankan `openclaw doctor --fix` untuk menghapusnya.

Opsi global terkait:

- `gateway.port`, `gateway.bind`: host/port WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autentikasi WebSocket dengan rahasia bersama.
- `gateway.auth.allowTailscale`: tab chat Control UI di peramban dapat menggunakan header identitas
  Tailscale Serve ketika diaktifkan.
- `gateway.auth.mode: "trusted-proxy"`: autentikasi proksi terbalik untuk klien peramban di belakang sumber proksi **non-loopback** yang sadar identitas (lihat [Autentikasi Proksi Tepercaya](/id/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: target Gateway jarak jauh.
- `session.*`: penyimpanan sesi dan nilai default kunci utama.

## Terkait

- [Control UI](/id/web/control-ui)
- [Dasbor](/id/web/dashboard)
