---
read_when:
    - Meninjau unggahan terkait penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau runbook peninjau
    - Menentukan apakah suatu skill harus disembunyikan atau pengguna harus diblokir
summary: 'Kebijakan lokapasar: hal yang diizinkan ClawHub dan hal yang tidak akan ditampungnya.'
x-i18n:
    generated_at: "2026-05-12T08:44:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

Halaman ini menjelaskan jenis Skills dan konten yang diterima ClawHub, serta alur kerja penyalahgunaan yang tidak akan dihostingnya.

Aturan ini sengaja dibuat praktis. Kami paling peduli pada alur kerja penyalahgunaan dari awal hingga akhir, bukan sekadar kata kunci yang terisolasi. Jika sebuah Skills dibuat untuk menghindari pertahanan, menyalahgunakan platform, menipu orang, melanggar privasi, atau memungkinkan perilaku tanpa persetujuan, Skills tersebut tidak layak berada di ClawHub.

## Pola terbaru yang secara eksplisit kami terima

- Pekerjaan frontend dan sistem desain yang menggunakan komponen nyata, token semantik, status yang mudah diakses, dan alur pengguna yang telah diuji.
- Komposisi shadcn/ui yang menggunakan komponen sumber terpasang, alias proyek, dan varian terdokumentasi alih-alih markup sekali pakai.
- Konversi UI5 JavaScript-ke-TypeScript yang mempertahankan komentar, menggunakan tipe UI5 yang konkret, dan menjaga antarmuka kontrol yang dihasilkan tetap dapat ditinjau.
- Tinjauan keamanan defensif, perkakas moderasi, dan prompt deteksi penyalahgunaan yang menunjukkan bukti dan menjaga batas persetujuan manusia tetap jelas.
- Otomatisasi alur kerja berbasis persetujuan untuk akun pribadi atau tim dengan kredensial eksplisit, penyiapan transparan, dan mode dry-run atau pratinjau.
- Dokumentasi, runbook migrasi, utilitas developer, dan fixture pengujian yang dibatasi pada perangkat lunak yang didukungnya.

## Tidak diterima

- Alur kerja bypass keamanan atau akses tanpa otorisasi.
  - Contoh: bypass autentikasi, pengambilalihan akun, bypass CAPTCHA, penghindaran Cloudflare atau anti-bot, bypass batas laju, scraping tersembunyi yang dirancang untuk mengalahkan perlindungan, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan ulang, persetujuan otomatis alur pairing untuk pengguna yang tidak disetujui.

- Penyalahgunaan platform dan penghindaran ban.
  - Contoh: akun tersembunyi setelah ban, pemanasan/peternakan akun, keterlibatan palsu, pembudidayaan karma atau pengikut, otomatisasi multi-akun, posting massal, bot spam, otomatisasi marketplace atau sosial yang dibuat untuk menghindari deteksi.

- Penipuan, scam, dan alur kerja finansial yang menyesatkan.
  - Contoh: sertifikat palsu, faktur palsu, alur pembayaran menyesatkan, outreach scam, bukti sosial palsu, alat yang memungkinkan pembelanjaan atau penagihan tanpa persetujuan manusia yang jelas dan kontrol transparan, atau alur kerja identitas sintetis yang dibuat untuk membuat akun demi penipuan.

- Scraping, pengayaan, atau pengawasan yang melanggar privasi.
  - Contoh: scraping detail kontak dalam skala besar untuk spam, doxxing, stalking, ekstraksi lead yang dipasangkan dengan outreach tanpa diminta, pemantauan terselubung, pencarian wajah atau pencocokan biometrik yang digunakan tanpa persetujuan jelas, atau membeli, menerbitkan, mengunduh, atau mengoperasionalkan data bocor atau dump pelanggaran.

- Peniruan tanpa persetujuan atau manipulasi identitas yang menyesatkan.
  - Contoh: face swap, kembaran digital, persona palsu, influencer kloning, atau perkakas manipulasi identitas lain yang digunakan untuk menyamar atau menyesatkan.

- Konten seksual eksplisit dan generasi dewasa dengan keamanan dinonaktifkan.
  - Contoh: generasi gambar/video/konten NSFW, wrapper konten dewasa di sekitar API pihak ketiga, atau Skills yang tujuan utamanya adalah konten seksual eksplisit.

- Persyaratan eksekusi yang tersembunyi, tidak aman, atau menyesatkan.
  - Contoh: perintah instal yang diobfuskasi, `curl | sh`, persyaratan secret yang tidak dideklarasikan, penggunaan private-key yang tidak dideklarasikan, eksekusi `npx @latest` jarak jauh tanpa kemampuan tinjau yang jelas, metadata menyesatkan yang menyembunyikan apa yang benar-benar dibutuhkan Skills untuk berjalan.

## Pola terbaru yang secara eksplisit tidak kami terima

- “Buat akun penjual tersembunyi setelah ban marketplace.”
- “Ubah pairing Telegram agar pengguna yang tidak disetujui otomatis menerima kode pairing.”
- “Budidayakan akun Reddit/Twitter dengan otomatisasi yang tidak terdeteksi.”
- “Buat sertifikat profesional atau faktur untuk penggunaan sembarang.”
- “Buat konten NSFW dengan pemeriksaan keamanan dinonaktifkan.”
- “Scrape lead, perkaya kontak, dan jalankan outreach dingin dalam skala besar.”
- “Beli, terbitkan, atau unduh data bocor atau dump pelanggaran.”
- “Buat akun email atau sosial secara massal dengan identitas sintetis atau penyelesaian CAPTCHA.”

## Catatan untuk peninjau

- Konteks penting. Topik yang sama dapat sah dalam pengaturan defensif yang sempit atau berbasis persetujuan, dan tidak dapat diterima ketika dikemas sebagai alur kerja penyalahgunaan.
- Kami sebaiknya condong untuk bertindak ketika sebuah Skills jelas dioptimalkan untuk penghindaran, penipuan, atau penggunaan tanpa persetujuan.
- Unggahan berulang dalam kategori ini menjadi dasar untuk menyembunyikan konten dan memblokir akun.

## Penegakan

- Kami dapat menyembunyikan, menghapus, atau menghapus permanen Skills yang melanggar.
- Kami dapat mencabut token, menghapus lunak konten terkait, dan memblokir pelanggar berulang atau berat.
- Kami tidak menjamin penegakan dengan peringatan terlebih dahulu untuk penyalahgunaan yang jelas.
