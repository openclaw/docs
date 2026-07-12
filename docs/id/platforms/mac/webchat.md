---
read_when:
    - Men-debug tampilan WebChat Mac atau port local loopback
summary: Cara aplikasi Mac menyematkan WebChat Gateway dan cara men-debug-nya
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-12T14:22:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7139ada530e4d5c3833500c36364d742dff301608a8a1a7902003b5f5384512c
    source_path: platforms/mac/webchat.md
    workflow: 16
---

Aplikasi bilah menu macOS menyematkan UI WebChat sebagai tampilan SwiftUI native. Aplikasi ini terhubung ke Gateway dan secara default menggunakan sesi utama untuk agen yang dipilih (`main`, atau `global` ketika `session.scope` bernilai `global`).

Jendela obrolan lengkap merupakan tampilan terbagi native:

- **Bilah samping sesi**: daftar sesi yang dapat dicari dengan bagian disematkan dan terbaru, indikator belum dibaca, serta menu konteks untuk menyematkan/melepas sematan, menyalin kunci sesi, dan menghapus. Tombol bilah alat (atau Cmd-N) membuat sesi baru yang sebenarnya melalui `sessions.create`.
- **Bilah alat jendela**: cincin penggunaan konteks (token dan biaya sesi, dengan tindakan ringkas), pemilih tingkat pemikiran, pemilih model, serta menu tindakan sesi (sesi baru, segarkan, salin kunci sesi, ekspor transkrip, padatkan, hapus riwayat).
- **Transkrip dan kotak penulisan**: pesan asisten ditampilkan sebagai teks biasa dengan avatar, sedangkan pesan pengguna sebagai gelembung berwarna aksen. Mengetik `/` membuka pelengkapan otomatis perintah garis miring yang didukung oleh `commands.list`, dengan navigasi papan ketik menggunakan panah/Tab/Return/Escape. Klik kanan pesan untuk menyalinnya.

Panel obrolan cepat yang ditambatkan dari bilah menu mempertahankan tata letak satu kolom yang ringkas dengan pemilih sebaris.

- **Mode lokal**: terhubung langsung ke WebSocket Gateway lokal.
- **Mode jarak jauh**: meneruskan porta kontrol Gateway melalui SSH dan menggunakan terowongan tersebut sebagai bidang data.

## Peluncuran dan penelusuran kesalahan

- Manual: menu Lobster -> "Open Chat".
- Buka otomatis untuk pengujian:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (`--webchat` diterima sebagai alias lama.)

- Log: `./scripts/clawlog.sh` (subsistem `ai.openclaw`, kategori `WebChatSwiftUI`).

## Cara penghubungannya

- Bidang data: metode WS Gateway `chat.history`, `chat.send`, `chat.abort`, `chat.inject`, serta peristiwa `chat`, `agent`, `presence`, `tick`, `health`.
- `chat.history` mengembalikan transkrip yang telah dinormalisasi untuk tampilan: tag arahan sebaris dihapus dari teks yang terlihat, muatan XML pemanggilan alat dalam teks biasa (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, termasuk blok yang terpotong) dan token kontrol model yang bocor dihapus, baris asisten yang hanya berisi token senyap seperti `NO_REPLY`/`no_reply` persis dihilangkan, dan baris yang terlalu besar dapat diganti dengan penampung terpotong.
- Sesi: secara default menggunakan sesi utama seperti dijelaskan di atas; UI dapat beralih antar-sesi.
- Orientasi awal menggunakan sesi khusus agar penyiapan saat pertama kali dijalankan tetap terpisah.
- Cache luring: aplikasi menyimpan cache baca-saja berukuran kecil yang berisi sesi dan transkrip obrolan terbaru untuk setiap Gateway (`~/Library/Application Support/OpenClaw/chat-cache.sqlite`): saat dibuka dari keadaan dingin, aplikasi langsung menampilkan transkrip terakhir yang diketahui dan menyegarkannya setelah Gateway merespons, sedangkan obrolan terbaru tetap dapat ditelusuri ketika koneksi terputus (pengiriman tetap dinonaktifkan hingga koneksi pulih).

## Permukaan keamanan

- Mode jarak jauh hanya meneruskan porta kontrol WebSocket Gateway melalui SSH.

## Keterbatasan yang diketahui

- UI dioptimalkan untuk sesi obrolan, bukan sebagai sandbox peramban lengkap.

## Terkait

- [WebChat](/id/web/webchat)
- [Aplikasi macOS](/id/platforms/macos)
