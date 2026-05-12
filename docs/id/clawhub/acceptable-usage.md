---
read_when:
    - Meninjau unggahan untuk mendeteksi penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau runbook peninjau
    - Menentukan apakah suatu skill harus disembunyikan atau pengguna diblokir
summary: 'Kebijakan pasar aplikasi: apa yang diizinkan ClawHub dan apa yang tidak akan dihostingnya.'
x-i18n:
    generated_at: "2026-05-12T23:29:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

Halaman ini menjelaskan jenis Skills dan konten yang dapat diterima oleh ClawHub, serta alur kerja penyalahgunaan yang tidak akan dihostingnya.

Aturan ini sengaja dibuat praktis. Kami paling peduli pada alur kerja penyalahgunaan dari awal hingga akhir, bukan sekadar kata kunci yang berdiri sendiri. Jika suatu skill dibuat untuk menghindari pertahanan, menyalahgunakan platform, menipu orang, melanggar privasi, atau memungkinkan perilaku tanpa persetujuan, skill tersebut tidak pantas berada di ClawHub.

## Pola terbaru yang secara eksplisit kami anggap boleh

- Pekerjaan frontend dan sistem desain yang menggunakan komponen nyata, token semantik, status yang dapat diakses, dan alur pengguna yang telah diuji.
- Komposisi shadcn/ui yang menggunakan komponen sumber terpasang, alias proyek, dan varian terdokumentasi alih-alih markup sekali pakai.
- Konversi UI5 dari JavaScript ke TypeScript yang mempertahankan komentar, menggunakan tipe UI5 konkret, dan menjaga antarmuka kontrol yang dihasilkan tetap dapat ditinjau.
- Tinjauan keamanan defensif, alat moderasi, dan prompt deteksi penyalahgunaan yang menunjukkan bukti dan menjaga batas persetujuan manusia tetap jelas.
- Otomasi alur kerja berbasis persetujuan untuk akun pribadi atau tim dengan kredensial eksplisit, penyiapan transparan, serta mode uji coba atau pratinjau.
- Dokumentasi, runbook migrasi, utilitas pengembang, dan fixture pengujian yang dibatasi pada perangkat lunak yang didukungnya.

## Tidak boleh

- Alur kerja untuk melewati keamanan atau akses tanpa izin.
  - Contoh: melewati autentikasi, pengambilalihan akun, melewati CAPTCHA, penghindaran Cloudflare atau anti-bot, melewati batas laju, scraping terselubung yang dirancang untuk mengalahkan proteksi, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan ulang, persetujuan otomatis alur pairing untuk pengguna yang belum disetujui.

- Penyalahgunaan platform dan penghindaran pemblokiran.
  - Contoh: akun terselubung setelah diblokir, pemanasan/peternakan akun, interaksi palsu, pengembangan karma atau pengikut, otomasi multi-akun, posting massal, bot spam, otomasi marketplace atau sosial yang dibuat untuk menghindari deteksi.

- Penipuan, scam, dan alur kerja finansial yang menyesatkan.
  - Contoh: sertifikat palsu, faktur palsu, alur pembayaran yang menipu, penjangkauan scam, bukti sosial palsu, alat yang memungkinkan pembelanjaan atau penagihan tanpa persetujuan manusia yang jelas dan kontrol transparan, atau alur kerja identitas sintetis yang dibuat untuk membuat akun demi penipuan.

- Scraping, pengayaan, atau pengawasan yang melanggar privasi.
  - Contoh: scraping detail kontak dalam skala besar untuk spam, doxxing, penguntitan, ekstraksi prospek yang dipasangkan dengan penjangkauan tanpa diminta, pemantauan terselubung, pencarian wajah atau pencocokan biometrik yang digunakan tanpa persetujuan jelas, atau membeli, menerbitkan, mengunduh, atau mengoperasionalkan data bocor atau kumpulan data hasil pelanggaran.

- Peniruan tanpa persetujuan atau manipulasi identitas yang menipu.
  - Contoh: tukar wajah, kembaran digital, persona palsu, influencer kloning, atau alat manipulasi identitas lain yang digunakan untuk meniru atau menyesatkan.

- Konten seksual eksplisit dan pembuatan konten dewasa dengan pengaman dinonaktifkan.
  - Contoh: pembuatan gambar/video/konten NSFW, wrapper konten dewasa di sekitar API pihak ketiga, atau skill yang tujuan utamanya adalah konten seksual eksplisit.

- Persyaratan eksekusi yang tersembunyi, tidak aman, atau menyesatkan.
  - Contoh: perintah instalasi yang diobfuskasi, `curl | sh`, persyaratan rahasia yang tidak dinyatakan, penggunaan kunci privat yang tidak dinyatakan, eksekusi `npx @latest` jarak jauh tanpa kemampuan peninjauan yang jelas, metadata menyesatkan yang menyembunyikan apa yang sebenarnya dibutuhkan skill untuk berjalan.

## Pola terbaru yang secara eksplisit kami anggap tidak boleh

- “Buat akun penjual terselubung setelah pemblokiran marketplace.”
- “Ubah pairing Telegram agar pengguna yang belum disetujui otomatis menerima kode pairing.”
- “Kembangkan akun Reddit/Twitter dengan otomasi yang tidak terdeteksi.”
- “Buat sertifikat profesional atau faktur untuk penggunaan apa pun.”
- “Buat konten NSFW dengan pemeriksaan keamanan dinonaktifkan.”
- “Scrape prospek, perkaya kontak, dan luncurkan penjangkauan dingin dalam skala besar.”
- “Beli, terbitkan, atau unduh data bocor atau kumpulan data hasil pelanggaran.”
- “Buat akun email atau sosial secara massal dengan identitas sintetis atau pemecahan CAPTCHA.”

## Catatan untuk peninjau

- Konteks penting. Topik yang sama bisa sah dalam lingkup defensif yang sempit atau berbasis persetujuan, tetapi tidak dapat diterima ketika dikemas sebagai alur kerja penyalahgunaan.
- Kami sebaiknya cenderung mengambil tindakan ketika suatu skill jelas dioptimalkan untuk penghindaran, penipuan, atau penggunaan tanpa persetujuan.
- Unggahan berulang dalam kategori ini menjadi dasar untuk menyembunyikan konten dan memblokir akun.

## Penegakan

- Kami dapat menyembunyikan, menghapus, atau menghapus permanen skill yang melanggar.
- Kami dapat mencabut token, menghapus secara lunak konten terkait, dan memblokir pelanggar berulang atau berat.
- Kami tidak menjamin penegakan dengan peringatan terlebih dahulu untuk penyalahgunaan yang jelas.
