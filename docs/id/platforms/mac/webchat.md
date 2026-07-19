---
read_when:
    - Men-debug tampilan WebChat Mac atau port loopback
summary: Cara aplikasi Mac menyematkan WebChat Gateway dan cara men-debug-nya
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-19T05:02:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8a403f5083ccac3d810dc6e103183a6ab73de3fab20abe74a2f7d7e94aed2c25
    source_path: platforms/mac/webchat.md
    workflow: 16
---

Aplikasi bilah menu macOS menyematkan UI WebChat sebagai tampilan SwiftUI native. Aplikasi ini terhubung ke Gateway dan secara default menggunakan sesi utama untuk agen yang dipilih (`main`, atau `global` ketika `session.scope` adalah `global`).

Jendela chat lengkap merupakan tampilan terbagi native:

- **Bilah samping sesi**: daftar sesi yang dapat dicari dengan bagian disematkan, grup yang didukung Gateway, dan terbaru. Sesi turunan yang dibuat tersarang di bawah induknya dalam setiap bagian; induk yang diciutkan merangkum turunan yang sedang berjalan, gagal, dan belum dibaca. Menu konteks mendukung info sesi, penggantian nama, penyematan, fork, penandaan sudah/belum dibaca, pengarsipan/pemulihan, penyalinan kunci sesi, dan penghapusan. Tindakan utama untuk sesi baru (atau Cmd-N) langsung membuat sesi melalui `sessions.create`; popover opsi di sebelahnya dapat memilih agen dan meminta worktree terkelola dengan ref dasar opsional.
- **Bilah alat jendela**: cincin penggunaan konteks (token dan biaya sesi, dengan tindakan ringkas), kontrol model, dan menu tindakan sesi. Model dikelompokkan berdasarkan penyedia dengan penyedia default berada di urutan pertama, sedangkan model yang disematkan dan baru digunakan tetap berada di bagian atas. Kontrol dapat mewarisi atau mengganti tingkat pemikiran model, memilih tingkat detail pemanggilan alat, dan mengaktifkan atau menonaktifkan respons Fast. Menu dapat mengganti nama atau membuat fork sesi saat ini serta memperbarui status penyematan, sudah dibaca, atau pengarsipannya. **Sesi…** (Shift-Cmd-S) membuka pengelola Aktif/Diarsipkan untuk pencarian Gateway, pengelolaan grup, pemeriksaan sesi, penggantian nama, penyematan, pengarsipan, dan pemulihan. Mode pilih menerapkan penyematan, pelepasan sematan, pengarsipan, atau penghapusan pada beberapa sesi aktif sekaligus sambil tetap menampilkan setiap kegagalan. Tanda centang menu terpisah menampilkan atau menyembunyikan penalaran asisten dan aktivitas alat; keduanya aktif secara default dan diingat antarpeluncuran.
- **Transkrip dan penyusun**: pesan asisten dirender sebagai teks biasa dengan avatar, sedangkan pesan pengguna sebagai gelembung berwarna aksen. Pertanyaan agen yang tertunda dirender sebagai kartu native dengan opsi pilihan tunggal atau ganda, jawaban teks bebas **Lainnya**, hitung mundur kedaluwarsa, dan status terminal bersama. Chat kosong menawarkan prompt awal desktop. Mengetik `/` membuka pelengkapan otomatis perintah garis miring yang didukung oleh `commands.list`, dengan navigasi papan ketik menggunakan panah/Tab/Return/Escape. Klik kanan pesan untuk menyalin Markdown yang terlihat tanpa penalaran tersembunyi. Pesan asisten yang terpotong juga menawarkan **Buka Pesan Lengkap**, yang memuat pembaca Markdown dengan teks yang dapat dipilih. Gunakan **Dengarkan** untuk TTS Gateway dengan fallback ucapan lokal.
- **Kontrol suara**: penyusun dapat memulai atau menghentikan Mode Bicara macOS yang ada tanpa mengganti overlay bilah menunya. Saat Mode Bicara aktif, penyusun menampilkan status mendengarkan/berpikir/berbicara, aktivitas audio langsung, dan transkrip berjalan yang dapat diperluas. Klik kanan tombol Bicara untuk memilih **System Default** atau mikrofon yang terhubung; pilihan mikrofon yang sama digunakan oleh Voice Wake dan tekan-untuk-bicara. Jika mikrofon yang dipilih terputus, sesi Bicara aktif beralih ke default sistem dan mencoba pilihan tersebut lagi saat Mode Bicara dimulai berikutnya. Tindakan mikrofon terpisah merekam catatan suara ketika Mode Bicara tidak menguasai perekaman audio.

Panel chat ringkas yang tertambat dari bilah menu mempertahankan tata letak ringkas satu kolom dengan kontrol model, pemikiran, tingkat detail, dan Fast yang sama secara sejajar, ditambah prompt awal, Mode Bicara, catatan suara, dan Dengarkan. Penalaran asisten dan aktivitas alat tetap tersembunyi pada permukaan ringkas ini.

## Bilah Chat Cepat

Tekan Option-Space (⌥Space) atau pilih **Chat Cepat** dari menu bilah menu untuk membuka penyusun mengambang bagi sesi utama. Ubah pintasan global dengan perekam di **Pengaturan → Umum → Pintasan Chat Cepat**.

Chat Cepat menampilkan agen yang dituju (avatar atau emoji, dengan nama agen sebagai placeholder) dan mengirim ke sesi utama agen tersebut. Setelah Return menerima pengiriman, bilah tetap terbuka dan meluas ke bawah dengan balasan Markdown yang dialirkan serta transkrip terbaru. Input bilah tetap menjadi penyusun. Tekan Command-Return untuk mengirim dan membuka target yang sama di jendela chat lengkap, Shift-Return untuk baris baru, atau Escape untuk menutup seluruh bilah dan area balasan. Mengklik di luar juga akan menutupnya. Ketika izin macOS yang relevan belum diberikan, strip terlampir menawarkan tindakan **Berikan** dan **Jangan sekarang**.

Gunakan tombol mikrofon untuk mendikte ke penyusun. Hasil ucapan parsial mengganti rentang yang didiktekan secara langsung sambil mempertahankan teks yang sudah ada di penyusun. Tekan kembali tombol tersebut, Return, atau Escape untuk berhenti; mengirim, menyembunyikan, atau menghilangkan fokus dari Chat Cepat juga melepaskan mikrofon. Penggunaan pertama meminta akses Mikrofon dan Pengenalan Ucapan macOS.

Kontrol model ringkas menampilkan model dan tingkat penalaran saat ini untuk sesi target. Pilihan model memperbarui sesi tersebut sehingga tetap tersimpan di sana, sedangkan pilihan penalaran hanya berlaku untuk setiap pesan yang dikirim dari tampilan Chat Cepat saat ini. Pilihan lokal diatur ulang ketika bilah disembunyikan. Beralih agen atau memilih sesi terbaru mempertahankan pilihan eksplisit, tetapi memuat ulang status model yang mendasari sesi yang baru dituju.

Klik tombol riwayat untuk memilih dari lima sesi yang paling baru diperbarui atau kembali ke **Pesan baru untuk &lt;agent&gt;**. Pilihan sesi terbaru mengirim ke sesi tersebut secara tepat dan mengubah placeholder menjadi **Balas di &lt;session&gt;**. Menyembunyikan Chat Cepat mengatur ulang target sementara ini ke sesi utama agen yang dipilih; beralih agen dari menu avatar juga menghapusnya.

Command-Return membuka percakapan agen yang menerima kiriman, termasuk ketika cakupan sesi bersifat global.

Tombol kamera membuka menu untuk **Tangkap Jendela…** atau **Tangkap Area…**. Penangkapan jendela memberi label pada setiap jendela yang terlihat; penangkapan area meredupkan setiap layar saat Anda menyeret suatu wilayah dan menampilkan ukurannya secara langsung. Tangkapan layar yang dipilih dikirim ke agen pilihan dengan teks yang diketik sebagai keterangannya. Penggunaan pertama meminta akses Perekaman Layar macOS. Escape, mengklik ruang kosong, atau mengklik tanpa menyeret area yang bermakna akan membatalkan tindakan.

Gunakan tombol teks-dokumen untuk melampirkan teks dari jendela yang sedang difokuskan pada aplikasi yang sedang difokuskan. Chat Cepat menampilkan hasil sebagai chip konteks yang dapat dihapus, alih-alih menempatkan teks yang ditangkap dalam penyusun; pengiriman menambahkan teks chip ke pesan keluar lalu menghapusnya. Tindakan ini memerlukan izin Aksesibilitas macOS. Teks terlampir juga dihapus setiap kali Chat Cepat ditutup, sehingga konteks dari satu tampilan tidak dapat bocor ke pengiriman berikutnya.

Setelah balasan selesai, pilih **Tempel ke &lt;app&gt;** untuk menyalin teks asisten yang terlihat, tanpa penalaran tersembunyi, ke papan tempel umum dan menempelkannya ke aplikasi yang sebelumnya berada paling depan. Tindakan ini memerlukan izin Aksesibilitas macOS. Tindakan tersebut mengganti isi papan tempel saat ini, lalu menyembunyikan Chat Cepat.

Nonaktifkan fitur ini sepenuhnya melalui **Pengaturan → Umum → Chat Cepat**; bagian yang sama juga memuat perekam pintasan.

- **Mode lokal**: terhubung langsung ke WebSocket Gateway lokal.
- **Mode jarak jauh**: meneruskan port kontrol Gateway melalui SSH dan menggunakan terowongan tersebut sebagai bidang data.

## Peluncuran dan proses debug

- Manual: menu Lobster -> "Buka Chat".
- Buka otomatis untuk pengujian:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (`--webchat` diterima sebagai alias lama.)

- Log: `./scripts/clawlog.sh` (subsistem `ai.openclaw`, kategori `WebChatSwiftUI`).

## Cara pengkabelannya

- Bidang data: metode WS Gateway `chat.history`, `chat.message.get`, `chat.send`, `chat.abort`, `chat.inject`, ditambah `question.list` dan `question.resolve`, serta peristiwa `chat`, `agent`, `presence`, `tick`, `health`; kartu pertanyaan mengikuti peristiwa `question.requested` dan `question.resolved` serta disegarkan dari `question.list` setelah koneksi ulang.
- `chat.history` mengembalikan transkrip yang dinormalisasi untuk tampilan: tag direktif sebaris dihapus dari teks yang terlihat, payload XML pemanggilan alat dalam teks biasa (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, termasuk blok yang terpotong) dan token kontrol model yang bocor dihapus, baris asisten yang hanya berisi token senyap seperti `NO_REPLY`/`no_reply` persis dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder terpotong.
- Sesi: secara default menggunakan sesi utama seperti di atas; UI dapat beralih antar-sesi.
- Grup sesi: `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename`, dan `sessions.groups.delete` mengelola katalog grup. Keanggotaan adalah `category` sesi yang diperbarui melalui `sessions.patch`.
- Status belum dibaca: setelah sesi diaktifkan dan riwayat langsungnya berhasil dimuat, aplikasi menghapus penanda belum dibaca sesi tersebut. Kegagalan pemuatan riwayat tidak menghapusnya; kegagalan patch sementara akan dicoba kembali pada aktivasi berikutnya.
- Orientasi awal menggunakan sesi khusus agar penyiapan saat pertama kali dijalankan tetap terpisah.
- Cache luring: aplikasi menyimpan cache kecil hanya-baca untuk sesi chat dan transkrip terbaru per Gateway (`~/Library/Application Support/OpenClaw/chat-cache.sqlite`): saat dibuka dari keadaan dingin, transkrip terakhir yang diketahui langsung ditampilkan dan disegarkan setelah Gateway merespons, sementara chat terbaru tetap dapat ditelusuri saat koneksi terputus (pengiriman tetap dinonaktifkan hingga koneksi kembali).

## Permukaan keamanan

- Mode jarak jauh hanya meneruskan port kontrol WebSocket Gateway melalui SSH.

## Keterbatasan yang diketahui

- UI dioptimalkan untuk sesi chat, bukan sandbox peramban lengkap.

## Terkait

- [WebChat](/id/web/webchat)
- [Aplikasi macOS](/id/platforms/macos)
