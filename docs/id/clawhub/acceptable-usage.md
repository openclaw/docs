---
read_when:
    - Meninjau unggahan untuk penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau panduan operasional peninjau
    - Menentukan apakah suatu skill harus disembunyikan atau pengguna diblokir
summary: 'Kebijakan lokapasar: apa yang ClawHub izinkan dan apa yang tidak akan dihostingnya.'
x-i18n:
    generated_at: "2026-05-11T22:19:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

Halaman ini menjelaskan jenis Skills dan konten yang diperbolehkan di ClawHub, serta alur kerja penyalahgunaan yang tidak akan dihosting.

Aturan ini sengaja dibuat praktis. Kami paling peduli pada alur kerja penyalahgunaan dari awal hingga akhir, bukan sekadar kata kunci yang berdiri sendiri. Jika sebuah Skills dibuat untuk menghindari pertahanan, menyalahgunakan platform, menipu orang, melanggar privasi, atau memungkinkan perilaku tanpa persetujuan, Skills tersebut tidak pantas ada di ClawHub.

## Pola terbaru yang secara eksplisit kami perbolehkan

- Pekerjaan frontend dan sistem desain yang menggunakan komponen nyata, token semantik, status yang aksesibel, dan alur pengguna yang teruji.
- Komposisi shadcn/ui yang menggunakan komponen sumber terinstal, alias proyek, dan varian terdokumentasi, bukan markup sekali pakai.
- Konversi UI5 JavaScript-ke-TypeScript yang mempertahankan komentar, menggunakan tipe UI5 konkret, dan menjaga antarmuka kontrol yang dihasilkan tetap dapat ditinjau.
- Tinjauan keamanan defensif, alat moderasi, dan prompt deteksi penyalahgunaan yang menunjukkan bukti dan menjaga batas persetujuan manusia tetap jelas.
- Otomasi alur kerja berbasis persetujuan untuk akun pribadi atau tim dengan kredensial eksplisit, penyiapan transparan, dan mode uji coba atau pratinjau.
- Dokumentasi, runbook migrasi, utilitas pengembang, dan fixture pengujian yang dibatasi pada perangkat lunak yang didukungnya.

## Tidak diperbolehkan

- Alur kerja bypass keamanan atau akses tanpa izin.
  - Contoh: bypass autentikasi, pengambilalihan akun, bypass CAPTCHA, penghindaran Cloudflare atau anti-bot, bypass batas laju, scraping tersembunyi yang dirancang untuk mengalahkan perlindungan, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan ulang, persetujuan otomatis alur pairing untuk pengguna yang tidak disetujui.

- Penyalahgunaan platform dan penghindaran larangan.
  - Contoh: akun tersembunyi setelah diblokir, pemanasan/peternakan akun, engagement palsu, pembangunan karma atau pengikut, otomasi banyak akun, posting massal, bot spam, otomasi marketplace atau sosial yang dibuat untuk menghindari deteksi.

- Penipuan, scam, dan alur kerja finansial yang menyesatkan.
  - Contoh: sertifikat palsu, faktur palsu, alur pembayaran menipu, penjangkauan scam, bukti sosial palsu, alat yang memungkinkan pembelanjaan atau penagihan tanpa persetujuan manusia yang jelas dan kontrol transparan, atau alur kerja identitas sintetis yang dibuat untuk membuat akun demi penipuan.

- Scraping, pengayaan, atau pengawasan yang melanggar privasi.
  - Contoh: scraping detail kontak secara massal untuk spam, doxxing, stalking, ekstraksi prospek yang dipasangkan dengan penjangkauan tanpa diminta, pemantauan terselubung, pencarian wajah atau pencocokan biometrik yang digunakan tanpa persetujuan jelas, atau membeli, menerbitkan, mengunduh, atau mengoperasionalkan data bocor atau dump pelanggaran.

- Impersonasi tanpa persetujuan atau manipulasi identitas yang menipu.
  - Contoh: tukar wajah, kembaran digital, persona palsu, influencer kloning, atau alat manipulasi identitas lain yang digunakan untuk menyamar atau menyesatkan.

- Konten seksual eksplisit dan generasi konten dewasa dengan keamanan dinonaktifkan.
  - Contoh: pembuatan gambar/video/konten NSFW, pembungkus konten dewasa di sekitar API pihak ketiga, atau Skills yang tujuan utamanya adalah konten seksual eksplisit.

- Persyaratan eksekusi yang tersembunyi, tidak aman, atau menyesatkan.
  - Contoh: perintah instal yang diobfuskasi, `curl | sh`, persyaratan rahasia yang tidak dinyatakan, penggunaan kunci privat yang tidak dinyatakan, eksekusi `npx @latest` jarak jauh tanpa keterlacakan tinjauan yang jelas, metadata menyesatkan yang menyembunyikan apa yang sebenarnya dibutuhkan Skills untuk berjalan.

## Pola terbaru yang secara eksplisit tidak kami perbolehkan

- “Buat akun penjual tersembunyi setelah larangan marketplace.”
- “Ubah pairing Telegram agar pengguna yang tidak disetujui otomatis menerima kode pairing.”
- “Kembangkan akun Reddit/Twitter dengan otomasi yang tidak terdeteksi.”
- “Buat sertifikat profesional atau faktur untuk penggunaan sembarang.”
- “Buat konten NSFW dengan pemeriksaan keamanan dinonaktifkan.”
- “Scrape prospek, perkaya kontak, dan jalankan penjangkauan dingin dalam skala besar.”
- “Beli, terbitkan, atau unduh data bocor atau dump pelanggaran.”
- “Buat akun email atau sosial secara massal dengan identitas sintetis atau penyelesaian CAPTCHA.”

## Catatan untuk peninjau

- Konteks penting. Topik yang sama bisa sah dalam pengaturan defensif yang sempit atau berbasis persetujuan, dan tidak dapat diterima ketika dikemas sebagai alur kerja penyalahgunaan.
- Kami sebaiknya condong untuk bertindak ketika sebuah Skills jelas dioptimalkan untuk penghindaran, penipuan, atau penggunaan tanpa persetujuan.
- Unggahan berulang dalam kategori ini menjadi dasar untuk menyembunyikan konten dan melarang akun.

## Penegakan

- Kami dapat menyembunyikan, menghapus, atau menghapus permanen Skills yang melanggar.
- Kami dapat mencabut token, menghapus lunak konten terkait, dan melarang pelanggar berulang atau berat.
- Kami tidak menjamin penegakan dengan peringatan terlebih dahulu untuk penyalahgunaan yang jelas.
