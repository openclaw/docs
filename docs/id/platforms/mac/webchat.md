---
read_when:
    - Men-debug tampilan WebChat Mac atau port loopback
summary: Cara aplikasi Mac menyematkan WebChat Gateway dan cara men-debug-nya
title: WebChat (macOS)
x-i18n:
    generated_at: "2026-07-21T12:34:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 222b2ffe3951a499b3d20e2219ac5bf6ec7b3ea894d64d251cbffd909a25f387
    source_path: platforms/mac/webchat.md
    workflow: 16
---

Aplikasi bilah menu macOS menyematkan UI WebChat sebagai tampilan SwiftUI native. Aplikasi ini terhubung ke Gateway dan secara default menggunakan sesi utama untuk agen yang dipilih (`main`, atau `global` ketika `session.scope` adalah `global`).

Jendela obrolan lengkap merupakan tampilan terbagi native:

- **Bilah samping sesi**: daftar sesi yang dapat dicari dengan bagian yang disematkan, grup berbasis Gateway, dan terbaru. Sesi anak yang dibuat ditampilkan bertingkat di bawah induknya dalam setiap bagian; induk yang diciutkan merangkum turunan yang sedang berjalan, gagal, dan belum dibaca. Menu konteks mendukung info sesi, penggantian nama, penyematan, fork, penandaan sudah/belum dibaca, pengarsipan/pemulihan, penyalinan kunci sesi, dan penghapusan. Tindakan utama untuk sesi baru (atau Shift-Cmd-N) langsung membuat sesi melalui `sessions.create`; popover opsi di sebelahnya dapat memilih agen dan meminta worktree terkelola dengan ref dasar opsional.
- **Bilah alat jendela**: cincin penggunaan konteks (token dan biaya sesi, dengan tindakan ringkas), kontrol model, dan menu tindakan sesi. Model dikelompokkan berdasarkan penyedia dengan penyedia default berada di urutan pertama, sementara model yang disematkan dan terbaru tetap berada di bagian atas. Kontrol dapat mewarisi atau mengganti tingkat pemikiran model, memilih tingkat detail pemanggilan alat, dan mengaktifkan atau menonaktifkan respons Fast. Menu dapat mengganti nama atau melakukan fork pada sesi saat ini serta memperbarui status sematan, sudah dibaca, atau arsipnya. **Sessions…** (Shift-Cmd-S) membuka pengelola Active/Archived untuk pencarian Gateway, pengelolaan grup, pemeriksaan sesi, penggantian nama, penyematan, pengarsipan, dan pemulihan. Mode pemilihan menerapkan penyematan, pelepasan sematan, pengarsipan, atau penghapusan pada beberapa sesi aktif sekaligus sambil tetap menampilkan setiap kegagalan. Tanda centang menu terpisah menampilkan atau menyembunyikan penalaran asisten dan aktivitas alat; keduanya aktif secara default dan diingat di antara peluncuran.
- **Transkrip dan penyusun**: pesan asisten dirender sebagai teks biasa dengan avatar, sedangkan pesan pengguna sebagai gelembung berwarna aksen. Pertanyaan agen yang tertunda dirender sebagai kartu native dengan opsi pilihan tunggal atau multipilihan, jawaban teks bebas **Other**, hitung mundur kedaluwarsa, dan status terminal bersama. Obrolan kosong menawarkan prompt awal desktop. Mengetik `/` membuka pelengkapan otomatis perintah garis miring yang didukung oleh `commands.list`, dengan navigasi papan ketik menggunakan tombol panah/Tab/Return/Escape. Klik kanan pesan untuk menyalin Markdown yang terlihat tanpa penalaran tersembunyi. Pesan asisten yang terpotong juga menawarkan **Open Full Message**, yang memuat pembaca Markdown dengan teks yang dapat dipilih. Gunakan **Listen** untuk TTS Gateway dengan ucapan lokal sebagai fallback.
- **Kontrol suara**: penyusun dapat memulai atau menghentikan Talk Mode macOS yang sudah ada tanpa mengganti overlay bilah menunya. Saat Talk Mode aktif, penyusun menampilkan status mendengarkan/berpikir/berbicara, aktivitas audio langsung, dan transkrip bergulir yang dapat diperluas. Klik kanan tombol Talk untuk memilih **System Default** atau mikrofon yang terhubung; ini merupakan pilihan mikrofon yang sama dengan yang digunakan oleh Voice Wake dan tekan-untuk-bicara. Jika mikrofon yang dipilih terputus, sesi Talk yang aktif beralih ke default sistem dan mencoba pilihan tersebut lagi saat Talk Mode dimulai berikutnya. Tindakan mikrofon terpisah merekam catatan suara ketika Talk Mode tidak menguasai perekaman audio.

Panel obrolan ringkas yang tertambat dari bilah menu mempertahankan tata letak satu kolom yang ringkas dengan kontrol model, pemikiran, tingkat detail, dan Fast yang sama secara sebaris, ditambah prompt awal, Talk Mode, catatan suara, dan Listen. Penalaran asisten dan aktivitas alat tetap disembunyikan pada permukaan ringkas ini.

## Beberapa jendela Gateway

Buka **Settings → Gateways** untuk menambahkan atau menghapus profil Gateway yang dapat digunakan kembali. Setiap
profil berisi endpoint `ws://` atau `wss://` beserta token atau
kata sandi opsionalnya; kredensial disimpan di macOS Keychain. Menghapus profil
juga menutup jendela yang terbuka dan mematikan koneksi sekundernya.

Pilih **File → New Gateway Window…** atau tekan Cmd-N, lalu pilih salah satu
profil yang disimpan tersebut. Pemilih mengingat profil yang terakhir digunakan. Setiap
pemilihan membuat jendela independen baru, sehingga Gateway yang sama dapat muncul di
beberapa jendela dengan sesi aktif dan status navigasi yang berbeda.

Setiap profil yang disimpan memiliki satu koneksi Gateway bersama, cakupan autentikasi perangkat,
cache transkrip, kotak keluar luring, dan sewa rute. Jendela untuk profil tersebut
menggunakan kembali sumber daya itu sambil tetap dapat dinavigasi secara independen. Jendela untuk
profil yang berbeda tetap terhubung dan menjalankan obrolan secara bersamaan.

Gateway yang dikonfigurasi pada aplikasi bilah menu tetap menjadi pemilik kapabilitas Node Mac
dan Talk Mode. Jendela Gateway tambahan hanya ditujukan untuk operator, sehingga
Gateway kedua tidak dapat secara diam-diam mengalihkan kontrol mikrofon atau perangkat global.
Listen/TTS dan tindakan obrolan normal menggunakan koneksi Gateway milik jendela tersebut.

## Bilah Quick Chat

Tekan Option-Space (⌥Space) atau pilih **Quick Chat** dari menu bilah menu untuk membuka penyusun mengambang bagi sesi utama. Ubah pintasan global dengan perekam di **Settings → General → Quick Chat shortcut**.

Quick Chat menampilkan agen yang dituju (avatar atau emoji, dengan nama agen sebagai placeholder) dan mengirim ke sesi utama agen tersebut. Setelah Return menerima pengiriman, bilah tetap terbuka dan meluas ke bawah dengan balasan Markdown yang dialirkan serta transkrip terbaru. Input bilah tetap menjadi penyusun. Tekan Command-Return untuk mengirim dan membuka target yang sama di jendela obrolan lengkap, Shift-Return untuk baris baru, atau Escape untuk menutup seluruh bilah dan area balasan. Mengeklik di luar juga menutupnya. Ketika izin macOS yang relevan belum diberikan, strip terlampir menawarkan tindakan **Grant** dan **Not now**.

Gunakan tombol mikrofon untuk mendikte ke penyusun. Hasil ucapan parsial mengganti rentang yang didiktekan secara langsung sambil mempertahankan teks yang sudah ada di penyusun. Tekan kembali tombol tersebut, Return, atau Escape untuk berhenti; mengirim, menyembunyikan, atau menghilangkan fokus dari Quick Chat juga melepaskan mikrofon. Penggunaan pertama meminta akses Microphone dan Speech Recognition macOS.

Kontrol model ringkas menampilkan model dan tingkat penalaran saat ini dari sesi target. Pilihan model memperbarui sesi tersebut sehingga tetap tersimpan di sana, sedangkan pilihan penalaran hanya berlaku untuk setiap pesan yang dikirim dari tampilan Quick Chat saat ini. Pilihan lokal diatur ulang saat bilah disembunyikan. Beralih agen atau memilih sesi terbaru mempertahankan pilihan eksplisit tetapi memuat ulang status model dasar sesi yang baru dituju.

Klik tombol riwayat untuk memilih dari lima sesi yang paling baru diperbarui atau kembali ke **New message to &lt;agent&gt;**. Pilihan terbaru mengirim ke sesi tersebut secara tepat dan mengubah placeholder menjadi **Reply in &lt;session&gt;**. Menyembunyikan Quick Chat mengatur ulang target sementara ini ke sesi utama agen yang dipilih; beralih agen dari menu avatar juga menghapusnya.

Command-Return membuka percakapan agen yang menerima kiriman, termasuk ketika cakupan sesi bersifat global.

Tombol kamera membuka menu untuk **Capture Window…** atau **Capture Area…**. Perekaman jendela memberi label pada setiap jendela yang terlihat; perekaman area meredupkan setiap layar saat Anda menyeret suatu wilayah dan menampilkan ukurannya secara langsung. Tangkapan layar yang dipilih dikirim ke agen yang dipilih dengan teks yang diketik sebagai keterangannya. Penggunaan pertama meminta akses Screen Recording macOS. Escape, mengeklik ruang kosong, atau mengeklik tanpa menyeret area yang berarti akan membatalkan.

Gunakan tombol teks dokumen untuk melampirkan teks dari jendela yang sedang difokuskan pada aplikasi yang sedang difokuskan. Quick Chat menampilkan hasilnya sebagai chip konteks yang dapat dihapus alih-alih menempatkan teks yang direkam ke dalam penyusun; pengiriman menambahkan teks chip ke pesan keluar lalu menghapusnya. Ini memerlukan izin Accessibility macOS. Teks terlampir juga dihapus setiap kali Quick Chat ditutup, sehingga konteks dari satu tampilan tidak dapat bocor ke pengiriman berikutnya.

Setelah balasan selesai, pilih **Paste to &lt;app&gt;** untuk menyalin teks asisten yang terlihat, tanpa menyertakan penalaran tersembunyi, ke papan tempel umum dan menempelkannya ke aplikasi yang sebelumnya berada paling depan. Ini memerlukan izin Accessibility macOS. Tindakan tersebut mengganti isi papan tempel saat ini lalu menyembunyikan Quick Chat.

Nonaktifkan fitur sepenuhnya melalui **Settings → General → Quick Chat**; bagian yang sama memuat perekam pintasan.

- **Mode lokal**: terhubung langsung ke WebSocket Gateway lokal.
- **Mode jarak jauh**: meneruskan port kontrol Gateway melalui SSH dan menggunakan tunnel tersebut sebagai bidang data.

## Peluncuran dan penelusuran kesalahan

- Manual: menu Lobster -> "Open Chat".
- Buka otomatis untuk pengujian:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --chat
  ```

  (`--webchat` diterima sebagai alias lama.)

- Log: `./scripts/clawlog.sh` (subsistem `ai.openclaw`, kategori `WebChatSwiftUI`).

## Cara perangkaiannya

- Bidang data: metode WS Gateway `chat.history`, `chat.message.get`, `chat.send`, `chat.abort`, `chat.inject`, ditambah `question.list` dan `question.resolve`, serta peristiwa `chat`, `agent`, `presence`, `tick`, `health`; kartu pertanyaan mengikuti peristiwa `question.requested` dan `question.resolved` serta disegarkan dari `question.list` setelah koneksi ulang.
- `chat.history` mengembalikan transkrip yang dinormalisasi untuk tampilan: tag direktif sebaris dihapus dari teks yang terlihat, payload XML pemanggilan alat berupa teks biasa (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>`, termasuk blok yang terpotong) dan token kontrol model yang bocor dihapus, baris asisten yang hanya berisi token senyap seperti `NO_REPLY`/`no_reply` secara persis dihilangkan, dan baris yang terlalu besar dapat diganti dengan placeholder terpotong.
- Sesi: secara default menggunakan sesi utama seperti di atas; UI dapat beralih antar sesi.
- Grup sesi: `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename`, dan `sessions.groups.delete` memiliki katalog grup. Keanggotaan adalah `category` sesi yang diperbarui melalui `sessions.patch`.
- Status belum dibaca: setelah sesi diaktifkan dan riwayat langsungnya berhasil dimuat, aplikasi menghapus penanda belum dibaca sesi tersebut. Kegagalan pemuatan riwayat tidak menghapusnya; kegagalan patch sementara akan dicoba kembali pada aktivasi berikutnya.
- Orientasi awal menggunakan sesi khusus agar penyiapan penggunaan pertama tetap terpisah.
- Cache luring: aplikasi menyimpan cache kecil hanya-baca dari sesi dan transkrip obrolan terbaru per gateway (`~/Library/Application Support/OpenClaw/chat-cache.sqlite`): pembukaan awal langsung menampilkan transkrip terakhir yang diketahui dan menyegarkannya setelah Gateway merespons, sementara obrolan terbaru tetap dapat dijelajahi saat koneksi terputus (pengiriman tetap dinonaktifkan sampai koneksi kembali).

## Permukaan keamanan

- Mode jarak jauh hanya meneruskan port kontrol WebSocket Gateway melalui SSH.

## Batasan yang diketahui

- UI dioptimalkan untuk sesi obrolan, bukan sandbox peramban lengkap.

## Terkait

- [WebChat](/id/web/webchat)
- [aplikasi macOS](/id/platforms/macos)
