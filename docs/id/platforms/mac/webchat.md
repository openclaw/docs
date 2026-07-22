---
read_when:
    - Men-debug tampilan WebChat Mac atau port loopback
summary: Cara aplikasi Mac menyematkan WebChat Gateway dan cara men-debug-nya
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-22T01:46:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5a8c0c609ba681758841d3604dd61756ddf28cbd236d43410a36cf6a9ce48a42
    source_path: platforms/mac/webchat.md
    workflow: 16
---

Aplikasi bilah menu macOS menyematkan UI WebChat sebagai tampilan SwiftUI native. Aplikasi ini terhubung ke Gateway dan secara default menggunakan sesi utama untuk agen yang dipilih (`main`, atau `global` ketika `session.scope` adalah `global`).

Jendela obrolan lengkap merupakan tampilan terbagi native:

- **Bilah samping sesi**: daftar sesi yang dapat dicari dengan bagian yang disematkan, grup yang didukung Gateway, dan sesi terbaru. Sesi turunan yang dibuat tersusun di bawah induknya dalam setiap bagian; induk yang diciutkan merangkum turunan yang sedang berjalan, gagal, dan belum dibaca. Menu konteks mendukung informasi sesi, penggantian nama, penyematan, fork, penandaan sudah/belum dibaca, pengarsipan/pemulihan, penyalinan kunci sesi, dan penghapusan. Tindakan utama sesi baru (atau Shift-Cmd-N) langsung membuat sesi melalui `sessions.create`; popover opsi di sebelahnya dapat memilih agen dan meminta worktree terkelola dengan referensi dasar opsional.
- **Bilah alat jendela**: indikator lingkaran penggunaan konteks (token dan biaya sesi, dengan tindakan ringkas), kontrol model, dan menu tindakan sesi. Model dikelompokkan berdasarkan penyedia dengan penyedia default di urutan pertama, sementara model yang disematkan dan terbaru tetap berada di bagian atas. Kontrol dapat mewarisi atau mengganti tingkat pemikiran model, memilih tingkat kerincian pemanggilan alat, dan mengaktifkan atau menonaktifkan respons Cepat. Menu dapat mengganti nama atau membuat fork sesi saat ini serta memperbarui status sematan, dibaca, atau arsipnya. **Sesi…** (Shift-Cmd-S) membuka pengelola Aktif/Diarsipkan untuk pencarian Gateway, pengelolaan grup, pemeriksaan sesi, penggantian nama, penyematan, pengarsipan, dan pemulihan. Mode pilih menerapkan sematkan, lepas sematan, arsipkan, atau hapus ke beberapa sesi aktif sekaligus, sambil tetap menampilkan kegagalan masing-masing. Tanda centang menu terpisah menampilkan atau menyembunyikan penalaran asisten dan aktivitas alat; keduanya aktif secara default dan diingat setiap kali aplikasi diluncurkan.
- **Transkrip dan penyusun**: pesan asisten ditampilkan sebagai teks biasa dengan avatar, sedangkan pesan pengguna sebagai gelembung berwarna aksen. Pertanyaan agen yang tertunda ditampilkan sebagai kartu native dengan opsi pilihan tunggal atau ganda, jawaban teks bebas **Lainnya**, hitung mundur kedaluwarsa, dan status terminal bersama. Obrolan kosong menawarkan prompt awal desktop. Mengetik `/` membuka pelengkapan otomatis perintah garis miring yang didukung oleh `commands.list`, dengan navigasi papan ketik menggunakan tombol panah/Tab/Return/Escape. Klik kanan pesan untuk menyalin Markdown yang terlihat tanpa penalaran tersembunyi. Pesan asisten yang terpotong juga menawarkan **Buka Pesan Lengkap**, yang memuat pembaca Markdown dengan teks yang dapat dipilih. Gunakan **Dengarkan** untuk TTS Gateway dengan ucapan lokal sebagai fallback.
- **Kontrol suara**: penyusun dapat memulai atau menghentikan Mode Bicara macOS yang ada tanpa mengganti overlay bilah menunya. Saat Mode Bicara aktif, penyusun menampilkan status mendengarkan/berpikir/berbicara, aktivitas audio langsung, dan transkrip berjalan yang dapat diperluas. Klik kanan tombol Bicara untuk memilih **System Default** atau mikrofon yang terhubung; ini merupakan pilihan mikrofon yang sama dengan yang digunakan oleh Voice Wake dan tekan-untuk-bicara. Jika mikrofon yang dipilih terputus, sesi Bicara yang aktif beralih ke default sistem dan mencoba pilihan tersebut lagi saat Mode Bicara dimulai berikutnya. Tindakan mikrofon terpisah merekam catatan suara ketika Mode Bicara tidak menguasai pengambilan audio.

Panel obrolan ringkas yang tertambat dari bilah menu mempertahankan tata letak ringkas satu kolom dengan kontrol model, pemikiran, kerincian, dan Cepat yang sama secara sebaris, ditambah prompt awal, Mode Bicara, catatan suara, dan Dengarkan. Penalaran asisten dan aktivitas alat tetap disembunyikan pada tampilan ringkas ini.

## Beberapa jendela Gateway

Buka **Settings → Gateways** untuk menambahkan atau menghapus profil Gateway yang dapat digunakan kembali. Setiap
profil berisi endpoint `ws://` atau `wss://` beserta token atau
kata sandi opsionalnya; kredensial disimpan di Keychain macOS. Menghapus profil
juga menutup jendela yang terbuka dan memutus koneksi sekundernya.

Pilih **File → New Gateway Window…** atau tekan Cmd-N, lalu pilih salah satu
profil yang tersimpan tersebut. Pemilih mengingat profil yang terakhir digunakan. Setiap
pemilihan membuat jendela independen baru, sehingga Gateway yang sama dapat muncul di
beberapa jendela dengan sesi aktif dan status navigasi yang berbeda.

Setiap profil tersimpan memiliki satu koneksi Gateway bersama, cakupan autentikasi perangkat,
cache transkrip, kotak keluar luring, dan sewa rute. Jendela untuk profil tersebut
menggunakan kembali sumber daya itu sambil tetap dapat dinavigasi secara independen. Jendela untuk
profil yang berbeda tetap terhubung dan menjalankan obrolan secara bersamaan.

Gateway yang dikonfigurasi pada aplikasi bilah menu tetap menjadi pemilik kapabilitas Node Mac
dan Mode Bicara. Jendela Gateway tambahan hanya untuk operator, sehingga
Gateway kedua tidak dapat secara diam-diam mengalihkan kontrol mikrofon atau perangkat global.
Dengarkan/TTS dan tindakan obrolan biasa menggunakan koneksi Gateway milik jendela tersebut.

## Bilah Obrolan Cepat

Tekan Option-Space (⌥Space) atau pilih **Obrolan Cepat** dari menu bilah menu untuk membuka penyusun mengambang bagi sesi utama. Ubah pintasan global dengan perekam di **Pengaturan → Umum → Pintasan Obrolan Cepat**.

Obrolan Cepat menampilkan agen yang dituju (avatar atau emoji, dengan nama agen sebagai placeholder) dan mengirim ke sesi utama agen tersebut. Setelah Return menerima pengiriman, bilah tetap terbuka dan mengembang ke bawah dengan balasan Markdown yang dialirkan serta transkrip terbaru. Input bilah tetap menjadi penyusun. Tekan Command-Return untuk mengirim dan membuka target yang sama di jendela obrolan lengkap, Shift-Return untuk baris baru, atau Escape untuk menutup seluruh bilah dan area balasan. Mengeklik di luar juga akan menutupnya. Ketika izin macOS yang relevan belum diberikan, strip terlampir menawarkan tindakan **Berikan** dan **Jangan sekarang**.

Gunakan tombol mikrofon untuk mendikte ke dalam penyusun. Hasil ucapan parsial mengganti rentang yang didiktekan secara langsung sambil mempertahankan teks yang sudah ada di penyusun. Tekan tombol itu lagi, Return, atau Escape untuk berhenti; mengirim, menyembunyikan, atau menghilangkan fokus dari Obrolan Cepat juga melepaskan mikrofon. Penggunaan pertama meminta akses Mikrofon dan Pengenalan Ucapan macOS. Obrolan Cepat menggunakan Apple Speech dan mungkin menggunakan layanan jaringannya; hanya Voice Wake pasif yang memerlukan pengenalan pada perangkat.

Kontrol model ringkas menampilkan model dan tingkat penalaran sesi target saat ini. Pilihan model memperbarui sesi tersebut sehingga tersimpan di sana, sedangkan pilihan penalaran hanya diterapkan pada setiap pesan yang dikirim dari tampilan Obrolan Cepat saat ini. Pilihan lokal diatur ulang saat bilah disembunyikan. Beralih agen atau memilih sesi terbaru mempertahankan pilihan eksplisit, tetapi memuat ulang status model dasar sesi yang baru dituju.

Klik tombol riwayat untuk memilih dari lima sesi yang terakhir diperbarui atau kembali ke **Pesan baru untuk &lt;agen&gt;**. Pilihan sesi terbaru mengirim ke sesi tersebut secara persis dan mengubah placeholder menjadi **Balas di &lt;sesi&gt;**. Menyembunyikan Obrolan Cepat mengatur ulang target sementara ini ke sesi utama agen yang dipilih; beralih agen dari menu avatar juga menghapusnya.

Command-Return membuka percakapan agen yang menerima pengiriman, termasuk ketika cakupan sesi bersifat global.

Tombol kamera membuka menu untuk **Capture Window…** atau **Capture Area…**. Pengambilan jendela memberi label pada setiap jendela yang terlihat; pengambilan area meredupkan setiap layar saat Anda menyeret suatu wilayah dan menampilkan ukurannya secara langsung. Tangkapan layar yang dipilih dikirim ke agen yang dipilih dengan teks yang diketik sebagai keterangannya. Penggunaan pertama meminta akses Perekaman Layar macOS. Escape, mengeklik ruang kosong, atau mengeklik tanpa menyeret area yang berarti akan membatalkan.

Gunakan tombol teks dokumen untuk melampirkan teks dari jendela aktif aplikasi yang sedang difokuskan. Obrolan Cepat menampilkan hasilnya sebagai chip konteks yang dapat dihapus alih-alih menempatkan teks yang diambil ke dalam penyusun; pengiriman menambahkan teks chip ke pesan keluar lalu menghapusnya. Ini memerlukan izin Aksesibilitas macOS. Teks terlampir juga dihapus setiap kali Obrolan Cepat ditutup, sehingga konteks dari satu tampilan tidak dapat bocor ke pengiriman berikutnya.

Setelah balasan selesai, pilih **Tempel ke &lt;aplikasi&gt;** untuk menyalin teks asisten yang terlihat, tanpa penalaran tersembunyi, ke papan klip umum dan menempelkannya ke aplikasi yang sebelumnya berada paling depan. Ini memerlukan izin Aksesibilitas macOS. Tindakan ini mengganti isi papan klip saat ini lalu menyembunyikan Obrolan Cepat.

Nonaktifkan fitur sepenuhnya melalui **Pengaturan → Umum → Obrolan Cepat**; bagian yang sama memuat perekam pintasan.

- **Mode lokal**: terhubung langsung ke WebSocket Gateway lokal.
- **Mode jarak jauh**: meneruskan port kontrol Gateway melalui SSH dan menggunakan terowongan tersebut sebagai bidang data.

## Peluncuran dan pengawakutuan

- Manual: menu Lobster -> "Buka Obrolan".
- Buka otomatis untuk pengujian:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (`--webchat` diterima sebagai alias lama.)

- Log: `./scripts/clawlog.sh` (subsistem `ai.openclaw`, kategori `WebChatSwiftUI`).

## Cara pengkabelannya

- Bidang data: metode WS Gateway `chat.history`, `chat.message.get`, `chat.send`, `chat.abort`, `chat.inject`, ditambah `question.list` dan `question.resolve`, serta peristiwa `chat`, `agent`, `presence`, `tick`, `health`; kartu pertanyaan mengikuti peristiwa `question.requested` dan `question.resolved` serta dimuat ulang dari `question.list` setelah koneksi tersambung kembali.
- `chat.history` mengembalikan transkrip yang dinormalisasi untuk tampilan: tag direktif sebaris dihapus dari teks yang terlihat, payload XML pemanggilan alat berupa teks biasa (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, termasuk blok yang terpotong) dan token kontrol model yang bocor dihapus, baris asisten yang hanya berisi token senyap seperti `NO_REPLY`/`no_reply` persis dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder terpotong.
- Sesi: secara default menggunakan sesi utama seperti di atas; UI dapat beralih antar-sesi.
- Grup sesi: `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename`, dan `sessions.groups.delete` memiliki katalog grup. Keanggotaan adalah `category` sesi yang diperbarui melalui `sessions.patch`.
- Status belum dibaca: setelah sesi diaktifkan dan riwayat langsungnya berhasil dimuat, aplikasi menghapus penanda belum dibaca sesi tersebut. Kegagalan memuat riwayat tidak menghapusnya; kegagalan patch sementara akan dicoba kembali saat aktivasi berikutnya.
- Orientasi awal menggunakan sesi khusus agar penyiapan pertama kali tetap terpisah.
- Cache luring: aplikasi menyimpan cache kecil hanya-baca berisi sesi obrolan dan transkrip terbaru per gateway (`~/Library/Application Support/OpenClaw/chat-cache.sqlite`): pembukaan awal segera menampilkan transkrip terakhir yang diketahui dan memuat ulang setelah Gateway merespons, serta obrolan terbaru tetap dapat ditelusuri saat koneksi terputus (pengiriman tetap dinonaktifkan hingga koneksi kembali).

## Permukaan keamanan

- Mode jarak jauh hanya meneruskan port kontrol WebSocket Gateway melalui SSH.

## Keterbatasan yang diketahui

- UI dioptimalkan untuk sesi obrolan, bukan sandbox peramban lengkap.

## Terkait

- [WebChat](/id/web/webchat)
- [aplikasi macOS](/id/platforms/macos)
