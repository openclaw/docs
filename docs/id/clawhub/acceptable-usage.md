---
read_when:
    - Meninjau unggahan untuk penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau panduan operasional peninjau
    - Menentukan apakah skill harus disembunyikan atau pengguna diblokir
summary: 'Kebijakan lokapasar: hal yang diizinkan ClawHub dan hal yang tidak akan ditampungnya.'
x-i18n:
    generated_at: "2026-05-13T04:18:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

Halaman ini menjelaskan jenis skill dan konten yang dapat diterima oleh ClawHub, serta alur kerja penyalahgunaan yang tidak akan di-host.

Aturan ini sengaja dibuat praktis. Yang paling kami perhatikan adalah alur kerja penyalahgunaan dari ujung ke ujung, bukan sekadar kata kunci yang terisolasi. Jika sebuah skill dibuat untuk menghindari pertahanan, menyalahgunakan platform, menipu orang, melanggar privasi, atau memungkinkan perilaku non-konsensual, skill tersebut tidak pantas berada di ClawHub.

## Pola terbaru yang secara eksplisit kami terima

- Pekerjaan frontend dan sistem desain yang menggunakan komponen nyata, token semantik, status yang aksesibel, dan alur pengguna yang teruji.
- Komposisi shadcn/ui yang menggunakan komponen sumber terinstal, alias proyek, dan varian terdokumentasi, bukan markup sekali pakai.
- Konversi UI5 JavaScript-ke-TypeScript yang mempertahankan komentar, menggunakan tipe UI5 konkret, dan menjaga antarmuka kontrol yang dihasilkan tetap mudah ditinjau.
- Tinjauan keamanan defensif, tooling moderasi, dan prompt deteksi penyalahgunaan yang menampilkan bukti dan menjaga batas persetujuan manusia tetap jelas.
- Otomatisasi alur kerja berbasis persetujuan untuk akun pribadi atau tim dengan kredensial eksplisit, penyiapan transparan, dan mode dry-run atau pratinjau.
- Dokumentasi, runbook migrasi, utilitas pengembang, dan fixture pengujian yang dibatasi pada perangkat lunak yang didukungnya.

## Tidak diperbolehkan

- Alur kerja bypass keamanan atau akses tanpa izin.
  - Contoh: bypass autentikasi, pengambilalihan akun, bypass CAPTCHA, penghindaran Cloudflare atau anti-bot, bypass rate-limit, stealth scraping yang dirancang untuk mengalahkan perlindungan, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan kembali, persetujuan otomatis alur pairing untuk pengguna yang tidak disetujui.

- Penyalahgunaan platform dan penghindaran ban.
  - Contoh: akun stealth setelah ban, pemanasan/peternakan akun, engagement palsu, penumbuhan karma atau pengikut, otomatisasi multi-akun, posting massal, bot spam, otomatisasi marketplace atau sosial yang dibuat untuk menghindari deteksi.

- Penipuan, scam, dan alur kerja keuangan yang menyesatkan.
  - Contoh: sertifikat palsu, invoice palsu, alur pembayaran menyesatkan, outreach scam, bukti sosial palsu, alat yang memungkinkan pengeluaran atau penagihan tanpa persetujuan manusia yang jelas dan kontrol transparan, atau alur kerja identitas sintetis yang dibuat untuk membuat akun demi penipuan.

- Scraping, enrichment, atau pengawasan yang melanggar privasi.
  - Contoh: scraping detail kontak dalam skala besar untuk spam, doxxing, stalking, ekstraksi lead yang dipasangkan dengan outreach tanpa diminta, pemantauan terselubung, pencarian wajah atau pencocokan biometrik yang digunakan tanpa persetujuan jelas, atau membeli, menerbitkan, mengunduh, atau mengoperasionalkan data bocor atau dump breach.

- Peniruan non-konsensual atau manipulasi identitas yang menyesatkan.
  - Contoh: face swap, kembaran digital, persona palsu, influencer kloning, atau tooling manipulasi identitas lain yang digunakan untuk meniru atau menyesatkan.

- Konten seksual eksplisit dan pembuatan konten dewasa dengan pengaman dinonaktifkan.
  - Contoh: pembuatan gambar/video/konten NSFW, wrapper konten dewasa di sekitar API pihak ketiga, atau skill yang tujuan utamanya adalah konten seksual eksplisit.

- Persyaratan eksekusi yang tersembunyi, tidak aman, atau menyesatkan.
  - Contoh: perintah instalasi yang diobfusikasi, `curl | sh`, persyaratan secret yang tidak dinyatakan, penggunaan private-key yang tidak dinyatakan, eksekusi `npx @latest` jarak jauh tanpa kemampuan tinjau yang jelas, metadata menyesatkan yang menyembunyikan apa yang sebenarnya dibutuhkan skill untuk berjalan.

## Pola terbaru yang secara eksplisit tidak kami terima

- “Buat akun penjual stealth setelah ban marketplace.”
- “Ubah pairing Telegram agar pengguna yang tidak disetujui otomatis menerima kode pairing.”
- “Kembangkan akun Reddit/Twitter dengan otomatisasi yang tidak terdeteksi.”
- “Buat sertifikat profesional atau invoice untuk penggunaan apa pun.”
- “Buat konten NSFW dengan pemeriksaan keamanan dinonaktifkan.”
- “Scrape lead, perkaya kontak, dan luncurkan cold outreach dalam skala besar.”
- “Beli, terbitkan, atau unduh data bocor atau dump breach.”
- “Buat email atau akun sosial secara massal dengan identitas sintetis atau penyelesaian CAPTCHA.”

## Catatan untuk peninjau

- Konteks penting. Topik yang sama bisa sah dalam pengaturan defensif yang sempit atau berbasis persetujuan, dan tidak dapat diterima ketika dikemas sebagai alur kerja penyalahgunaan.
- Kita sebaiknya condong untuk bertindak ketika sebuah skill jelas dioptimalkan untuk penghindaran, penipuan, atau penggunaan non-konsensual.
- Unggahan berulang dalam kategori ini menjadi dasar untuk menyembunyikan konten dan memblokir akun.

## Penegakan

- Kami dapat menyembunyikan, menghapus, atau menghapus permanen skill yang melanggar.
- Kami dapat mencabut token, menghapus lunak konten terkait, dan memblokir pelanggar berulang atau berat.
- Kami tidak menjamin penegakan dengan peringatan terlebih dahulu untuk penyalahgunaan yang jelas.
