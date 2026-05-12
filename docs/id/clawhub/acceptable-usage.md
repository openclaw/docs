---
read_when:
    - Meninjau unggahan untuk mendeteksi penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau runbook peninjau
    - Memutuskan apakah keterampilan harus disembunyikan atau pengguna diblokir
summary: 'Kebijakan lokapasar: apa yang diizinkan ClawHub dan apa yang tidak akan ditampungnya.'
x-i18n:
    generated_at: "2026-05-12T04:09:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

Halaman ini menjelaskan jenis skill dan konten yang dapat diterima ClawHub, serta alur kerja penyalahgunaan yang tidak akan dihostingnya.

Aturan ini sengaja dibuat praktis. Kami paling peduli pada alur kerja penyalahgunaan dari awal hingga akhir, bukan hanya kata kunci yang terisolasi. Jika sebuah skill dibuat untuk menghindari pertahanan, menyalahgunakan platform, menipu orang, melanggar privasi, atau memungkinkan perilaku tanpa persetujuan, skill tersebut tidak pantas berada di ClawHub.

## Pola terbaru yang secara eksplisit kami izinkan

- Pekerjaan frontend dan sistem desain yang menggunakan komponen nyata, token semantik, status yang aksesibel, dan alur pengguna yang teruji.
- Komposisi shadcn/ui yang menggunakan komponen sumber yang terinstal, alias proyek, dan varian terdokumentasi alih-alih markup sekali pakai.
- Konversi JavaScript-ke-TypeScript UI5 yang mempertahankan komentar, menggunakan tipe UI5 konkret, dan menjaga antarmuka kontrol yang dihasilkan tetap dapat ditinjau.
- Tinjauan keamanan defensif, alat moderasi, dan prompt deteksi penyalahgunaan yang menampilkan bukti serta menjaga batas persetujuan manusia tetap jelas.
- Otomatisasi alur kerja berbasis persetujuan untuk akun pribadi atau tim dengan kredensial eksplisit, penyiapan transparan, dan mode dry-run atau pratinjau.
- Dokumentasi, runbook migrasi, utilitas pengembang, dan fixture pengujian yang dibatasi pada perangkat lunak yang didukungnya.

## Tidak diizinkan

- Alur kerja bypass keamanan atau akses tanpa izin.
  - Contoh: bypass auth, pengambilalihan akun, bypass CAPTCHA, penghindaran Cloudflare atau anti-bot, bypass rate-limit, scraping tersembunyi yang dirancang untuk mengalahkan perlindungan, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan ulang, persetujuan otomatis alur pairing untuk pengguna yang tidak disetujui.

- Penyalahgunaan platform dan penghindaran banned.
  - Contoh: akun tersembunyi setelah banned, pemanasan/peternakan akun, engagement palsu, pembentukan karma atau pengikut, otomatisasi multi-akun, posting massal, bot spam, otomatisasi marketplace atau sosial yang dibuat untuk menghindari deteksi.

- Penipuan, scam, dan alur kerja keuangan yang menyesatkan.
  - Contoh: sertifikat palsu, faktur palsu, alur pembayaran menyesatkan, outreach scam, bukti sosial palsu, alat yang memungkinkan pengeluaran atau penagihan tanpa persetujuan manusia yang jelas dan kontrol transparan, atau alur kerja identitas sintetis yang dibuat untuk membuat akun demi penipuan.

- Scraping, enrichment, atau pengawasan yang melanggar privasi.
  - Contoh: scraping detail kontak dalam skala besar untuk spam, doxxing, stalking, ekstraksi prospek yang dipasangkan dengan outreach tanpa diminta, pemantauan terselubung, pencarian wajah atau pencocokan biometrik yang digunakan tanpa persetujuan jelas, atau membeli, menerbitkan, mengunduh, atau mengoperasionalkan data bocor atau breach dump.

- Peniruan tanpa persetujuan atau manipulasi identitas yang menyesatkan.
  - Contoh: face swap, kembaran digital, persona palsu, influencer hasil kloning, atau alat manipulasi identitas lain yang digunakan untuk meniru atau menyesatkan.

- Konten seksual eksplisit dan generasi dewasa dengan keselamatan dinonaktifkan.
  - Contoh: generasi gambar/video/konten NSFW, wrapper konten dewasa di sekitar API pihak ketiga, atau skill yang tujuan utamanya adalah konten seksual eksplisit.

- Persyaratan eksekusi yang tersembunyi, tidak aman, atau menyesatkan.
  - Contoh: perintah instalasi yang diobfuscate, `curl | sh`, persyaratan secret yang tidak dinyatakan, penggunaan private-key yang tidak dinyatakan, eksekusi `npx @latest` jarak jauh tanpa kemampuan tinjau yang jelas, metadata menyesatkan yang menyembunyikan apa yang sebenarnya dibutuhkan skill untuk berjalan.

## Pola terbaru yang secara eksplisit tidak kami izinkan

- “Buat akun penjual tersembunyi setelah banned marketplace.”
- “Ubah pairing Telegram agar pengguna yang tidak disetujui otomatis menerima kode pairing.”
- “Kembangkan akun Reddit/Twitter dengan otomatisasi yang tidak terdeteksi.”
- “Buat sertifikat profesional atau faktur untuk penggunaan sewenang-wenang.”
- “Buat konten NSFW dengan pemeriksaan keselamatan dinonaktifkan.”
- “Scrape prospek, perkaya kontak, dan luncurkan cold outreach dalam skala besar.”
- “Beli, terbitkan, atau unduh data bocor atau breach dump.”
- “Buat email atau akun sosial secara massal dengan identitas sintetis atau pemecahan CAPTCHA.”

## Catatan untuk peninjau

- Konteks penting. Topik yang sama dapat sah dalam konteks defensif yang sempit atau berbasis persetujuan, dan tidak dapat diterima ketika dikemas sebagai alur kerja penyalahgunaan.
- Kami harus cenderung mengambil tindakan ketika sebuah skill jelas dioptimalkan untuk penghindaran, penipuan, atau penggunaan tanpa persetujuan.
- Unggahan berulang dalam kategori ini menjadi alasan untuk menyembunyikan konten dan mem-banned akun.

## Penegakan

- Kami dapat menyembunyikan, menghapus, atau hard-delete skill yang melanggar.
- Kami dapat mencabut token, soft-delete konten terkait, dan mem-banned pelanggar berulang atau berat.
- Kami tidak menjamin penegakan yang diawali peringatan untuk penyalahgunaan yang jelas.
