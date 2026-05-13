---
read_when:
    - Meninjau unggahan untuk penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau panduan operasional peninjau
    - Memutuskan apakah suatu skill harus disembunyikan atau pengguna diblokir
summary: 'Kebijakan marketplace: apa yang diizinkan ClawHub dan apa yang tidak akan dihostingnya.'
x-i18n:
    generated_at: "2026-05-13T02:51:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

Halaman ini menjelaskan jenis Skills dan konten yang dapat diterima ClawHub, serta alur kerja penyalahgunaan yang tidak akan dihostingnya.

Aturan ini sengaja dibuat praktis. Kami paling peduli pada alur kerja penyalahgunaan menyeluruh, bukan hanya kata kunci yang terisolasi. Jika sebuah skill dibuat untuk menghindari pertahanan, menyalahgunakan platform, menipu orang, melanggar privasi, atau memungkinkan perilaku tanpa persetujuan, skill tersebut tidak layak berada di ClawHub.

## Pola terbaru yang secara eksplisit kami izinkan

- Pekerjaan frontend dan sistem desain yang menggunakan komponen nyata, token semantik, status yang aksesibel, dan alur pengguna yang telah diuji.
- Komposisi shadcn/ui yang menggunakan komponen sumber terpasang, alias proyek, dan varian terdokumentasi alih-alih markup sekali pakai.
- Konversi UI5 JavaScript-ke-TypeScript yang mempertahankan komentar, menggunakan tipe UI5 konkret, dan menjaga antarmuka kontrol yang dihasilkan tetap dapat ditinjau.
- Tinjauan keamanan defensif, alat moderasi, dan prompt deteksi penyalahgunaan yang menunjukkan bukti dan menjaga batas persetujuan manusia tetap jelas.
- Otomasi alur kerja berbasis persetujuan untuk akun pribadi atau tim dengan kredensial eksplisit, penyiapan transparan, dan mode dry-run atau pratinjau.
- Dokumentasi, runbook migrasi, utilitas pengembang, dan fixture pengujian yang dibatasi pada perangkat lunak yang didukungnya.

## Tidak diperbolehkan

- Alur kerja bypass keamanan atau akses tanpa otorisasi.
  - Contoh: bypass autentikasi, pengambilalihan akun, bypass CAPTCHA, penghindaran Cloudflare atau anti-bot, bypass pembatasan laju, scraping tersembunyi yang dirancang untuk mengalahkan perlindungan, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan ulang, menyetujui otomatis alur pairing untuk pengguna yang belum disetujui.

- Penyalahgunaan platform dan penghindaran larangan.
  - Contoh: akun tersembunyi setelah larangan, pemanasan/peternakan akun, interaksi palsu, pembinaan karma atau pengikut, otomasi multi-akun, posting massal, bot spam, otomasi marketplace atau sosial yang dibuat untuk menghindari deteksi.

- Penipuan, scam, dan alur kerja keuangan yang menyesatkan.
  - Contoh: sertifikat palsu, faktur palsu, alur pembayaran menyesatkan, penjangkauan scam, bukti sosial palsu, alat yang memungkinkan pengeluaran atau penagihan tanpa persetujuan manusia yang jelas dan kontrol transparan, atau alur kerja identitas sintetis yang dibuat untuk membuat akun bagi penipuan.

- Scraping, pengayaan, atau pengawasan yang melanggar privasi.
  - Contoh: scraping detail kontak dalam skala besar untuk spam, doxxing, stalking, ekstraksi prospek yang dipasangkan dengan penjangkauan tanpa diminta, pemantauan terselubung, pencarian wajah atau pencocokan biometrik yang digunakan tanpa persetujuan yang jelas, atau membeli, menerbitkan, mengunduh, atau mengoperasionalkan data bocor atau dump pelanggaran.

- Impersonasi tanpa persetujuan atau manipulasi identitas yang menyesatkan.
  - Contoh: face swap, kembaran digital, persona palsu, influencer kloning, atau alat manipulasi identitas lain yang digunakan untuk menyamar atau menyesatkan.

- Konten seksual eksplisit dan pembuatan konten dewasa dengan keamanan dinonaktifkan.
  - Contoh: pembuatan gambar/video/konten NSFW, pembungkus konten dewasa di sekitar API pihak ketiga, atau skills yang tujuan utamanya adalah konten seksual eksplisit.

- Persyaratan eksekusi yang tersembunyi, tidak aman, atau menyesatkan.
  - Contoh: perintah instalasi yang diobfuskasi, `curl | sh`, persyaratan secret yang tidak dideklarasikan, penggunaan private key yang tidak dideklarasikan, eksekusi jarak jauh `npx @latest` tanpa kemampuan tinjauan yang jelas, metadata menyesatkan yang menyembunyikan apa yang sebenarnya dibutuhkan skill untuk berjalan.

## Pola terbaru yang secara eksplisit tidak kami izinkan

- “Buat akun penjual tersembunyi setelah larangan marketplace.”
- “Ubah pairing Telegram agar pengguna yang belum disetujui otomatis menerima kode pairing.”
- “Kembangkan akun Reddit/Twitter dengan otomasi yang tidak terdeteksi.”
- “Buat sertifikat profesional atau faktur untuk penggunaan sembarang.”
- “Buat konten NSFW dengan pemeriksaan keamanan dinonaktifkan.”
- “Scrape prospek, perkaya kontak, dan luncurkan penjangkauan dingin dalam skala besar.”
- “Beli, terbitkan, atau unduh data bocor atau dump pelanggaran.”
- “Buat akun email atau sosial secara massal dengan identitas sintetis atau penyelesaian CAPTCHA.”

## Catatan untuk peninjau

- Konteks penting. Topik yang sama dapat sah dalam pengaturan defensif yang sempit atau berbasis persetujuan, dan tidak dapat diterima ketika dikemas sebagai alur kerja penyalahgunaan.
- Kami harus cenderung mengambil tindakan ketika sebuah skill jelas dioptimalkan untuk penghindaran, penipuan, atau penggunaan tanpa persetujuan.
- Unggahan berulang dalam kategori ini menjadi dasar untuk menyembunyikan konten dan memblokir akun.

## Penegakan

- Kami dapat menyembunyikan, menghapus, atau menghapus permanen skills yang melanggar.
- Kami dapat mencabut token, melakukan soft-delete pada konten terkait, dan memblokir pelanggar berulang atau berat.
- Kami tidak menjamin penegakan dengan peringatan terlebih dahulu untuk penyalahgunaan yang jelas.
