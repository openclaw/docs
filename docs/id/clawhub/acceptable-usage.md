---
read_when:
    - Meninjau unggahan untuk mendeteksi penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau runbook peninjau
    - Menentukan apakah sebuah skill harus disembunyikan atau seorang pengguna diblokir
summary: 'Kebijakan lokapasar: apa yang diizinkan ClawHub dan apa yang tidak akan ditampungnya.'
x-i18n:
    generated_at: "2026-05-10T19:25:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

Halaman ini menjelaskan jenis Skills dan konten yang dapat diterima ClawHub, serta alur kerja penyalahgunaan yang tidak akan dihostingnya.

Aturan ini sengaja dibuat praktis. Kami paling peduli pada alur kerja penyalahgunaan dari awal hingga akhir, bukan sekadar kata kunci yang terisolasi. Jika sebuah Skills dibuat untuk menghindari pertahanan, menyalahgunakan platform, menipu orang, melanggar privasi, atau memungkinkan perilaku tanpa persetujuan, Skills tersebut tidak pantas berada di ClawHub.

## Pola terbaru yang secara eksplisit kami perbolehkan

- Pekerjaan frontend dan sistem desain yang menggunakan komponen nyata, token semantik, state yang aksesibel, dan alur pengguna yang teruji.
- Komposisi shadcn/ui yang menggunakan komponen sumber yang terinstal, alias proyek, dan varian terdokumentasi alih-alih markup sekali pakai.
- Konversi UI5 JavaScript-ke-TypeScript yang mempertahankan komentar, menggunakan tipe UI5 konkret, dan menjaga antarmuka kontrol yang dihasilkan tetap dapat ditinjau.
- Tinjauan keamanan defensif, alat moderasi, dan prompt deteksi penyalahgunaan yang menunjukkan bukti dan menjaga batas persetujuan manusia tetap jelas.
- Otomatisasi alur kerja berbasis persetujuan untuk akun pribadi atau tim dengan kredensial eksplisit, penyiapan transparan, dan mode uji coba atau pratinjau.
- Dokumentasi, runbook migrasi, utilitas pengembang, dan fixture pengujian yang dibatasi pada perangkat lunak yang didukungnya.

## Tidak diperbolehkan

- Alur kerja bypass keamanan atau akses tanpa izin.
  - Contoh: bypass autentikasi, pengambilalihan akun, bypass CAPTCHA, penghindaran Cloudflare atau anti-bot, bypass batas laju, scraping terselubung yang dirancang untuk mengalahkan perlindungan, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan ulang, persetujuan otomatis alur pairing untuk pengguna yang tidak disetujui.

- Penyalahgunaan platform dan penghindaran larangan.
  - Contoh: akun terselubung setelah diblokir, pemanasan/peternakan akun, engagement palsu, pembinaan karma atau pengikut, otomatisasi multi-akun, posting massal, bot spam, otomatisasi marketplace atau sosial yang dibuat untuk menghindari deteksi.

- Penipuan, scam, dan alur kerja keuangan yang menyesatkan.
  - Contoh: sertifikat palsu, faktur palsu, alur pembayaran menyesatkan, outreach scam, bukti sosial palsu, alat yang memungkinkan pengeluaran atau penagihan tanpa persetujuan manusia yang jelas dan kontrol transparan, atau alur kerja identitas sintetis yang dibuat untuk membuat akun demi penipuan.

- Scraping, pengayaan, atau pengawasan yang melanggar privasi.
  - Contoh: scraping detail kontak dalam skala besar untuk spam, doxxing, stalking, ekstraksi prospek yang dipasangkan dengan outreach tanpa diminta, pemantauan terselubung, pencarian wajah atau pencocokan biometrik yang digunakan tanpa persetujuan yang jelas, atau membeli, menerbitkan, mengunduh, atau mengoperasionalkan data bocor atau dump pelanggaran.

- Peniruan tanpa persetujuan atau manipulasi identitas yang menyesatkan.
  - Contoh: face swap, kembar digital, persona palsu, influencer kloning, atau alat manipulasi identitas lain yang digunakan untuk meniru atau menyesatkan.

- Konten seksual eksplisit dan generasi dewasa dengan keamanan dinonaktifkan.
  - Contoh: generasi gambar/video/konten NSFW, wrapper konten dewasa di sekitar API pihak ketiga, atau Skills yang tujuan utamanya adalah konten seksual eksplisit.

- Persyaratan eksekusi yang tersembunyi, tidak aman, atau menyesatkan.
  - Contoh: perintah instalasi tersamarkan, `curl | sh`, persyaratan rahasia yang tidak dideklarasikan, penggunaan kunci privat yang tidak dideklarasikan, eksekusi `npx @latest` jarak jauh tanpa kemampuan peninjauan yang jelas, metadata menyesatkan yang menyembunyikan apa yang sebenarnya dibutuhkan Skills untuk berjalan.

## Pola terbaru yang secara eksplisit tidak kami perbolehkan

- “Buat akun penjual terselubung setelah larangan marketplace.”
- “Modifikasi pairing Telegram agar pengguna yang tidak disetujui otomatis menerima kode pairing.”
- “Kembangkan akun Reddit/Twitter dengan otomatisasi yang tidak terdeteksi.”
- “Buat sertifikat profesional atau faktur untuk penggunaan apa pun.”
- “Buat konten NSFW dengan pemeriksaan keamanan dinonaktifkan.”
- “Scrape prospek, perkaya kontak, dan jalankan cold outreach dalam skala besar.”
- “Beli, terbitkan, atau unduh data bocor atau dump pelanggaran.”
- “Buat akun email atau sosial secara massal dengan identitas sintetis atau pemecahan CAPTCHA.”

## Catatan untuk peninjau

- Konteks penting. Topik yang sama dapat sah dalam pengaturan defensif yang sempit atau berbasis persetujuan dan tidak dapat diterima ketika dikemas sebagai alur kerja penyalahgunaan.
- Kami sebaiknya condong untuk bertindak ketika sebuah Skills jelas dioptimalkan untuk penghindaran, penipuan, atau penggunaan tanpa persetujuan.
- Unggahan berulang dalam kategori ini menjadi dasar untuk menyembunyikan konten dan memblokir akun.

## Penegakan

- Kami dapat menyembunyikan, menghapus, atau menghapus permanen Skills yang melanggar.
- Kami dapat mencabut token, menghapus sementara konten terkait, dan memblokir pelanggar berulang atau berat.
- Kami tidak menjamin penegakan yang didahului peringatan untuk penyalahgunaan yang jelas.
