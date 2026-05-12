---
read_when:
    - Meninjau unggahan untuk penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau runbook peninjau
    - Menentukan apakah sebuah keterampilan harus disembunyikan atau pengguna diblokir
summary: 'Kebijakan lokapasar: apa yang diizinkan ClawHub dan apa yang tidak akan dihostingnya.'
x-i18n:
    generated_at: "2026-05-12T12:49:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

Halaman ini menjelaskan jenis keterampilan dan konten yang dapat diterima oleh ClawHub, serta alur kerja penyalahgunaan yang tidak akan dihostingnya.

Aturan ini sengaja dibuat praktis. Kami paling peduli pada alur kerja penyalahgunaan ujung ke ujung, bukan hanya kata kunci yang terisolasi. Jika sebuah keterampilan dibuat untuk menghindari pertahanan, menyalahgunakan platform, menipu orang, melanggar privasi, atau memungkinkan perilaku tanpa persetujuan, itu tidak layak berada di ClawHub.

## Pola terbaru yang secara eksplisit kami terima

- Pekerjaan frontend dan sistem desain yang menggunakan komponen nyata, token semantik, status yang aksesibel, dan alur pengguna yang teruji.
- Komposisi shadcn/ui yang menggunakan komponen sumber yang terpasang, alias proyek, dan varian terdokumentasi, bukan markup sekali pakai.
- Konversi UI5 JavaScript-ke-TypeScript yang mempertahankan komentar, menggunakan tipe UI5 konkret, dan menjaga antarmuka kontrol yang dihasilkan tetap dapat ditinjau.
- Tinjauan keamanan defensif, alat moderasi, dan prompt deteksi penyalahgunaan yang menunjukkan bukti dan menjaga batas persetujuan manusia tetap jelas.
- Otomatisasi alur kerja berbasis persetujuan untuk akun pribadi atau tim dengan kredensial eksplisit, penyiapan transparan, dan mode uji coba atau pratinjau.
- Dokumentasi, runbook migrasi, utilitas pengembang, dan fixture pengujian yang dibatasi pada perangkat lunak yang didukungnya.

## Tidak dapat diterima

- Alur kerja untuk melewati keamanan atau akses tanpa izin.
  - Contoh: melewati autentikasi, pengambilalihan akun, melewati CAPTCHA, penghindaran Cloudflare atau anti-bot, melewati batas laju, scraping senyap yang dirancang untuk mengalahkan perlindungan, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan ulang, menyetujui otomatis alur pairing untuk pengguna yang tidak disetujui.

- Penyalahgunaan platform dan penghindaran pemblokiran.
  - Contoh: akun senyap setelah pemblokiran, pemanasan/peternakan akun, keterlibatan palsu, pembinaan karma atau pengikut, otomatisasi multi-akun, posting massal, bot spam, otomatisasi marketplace atau sosial yang dibuat untuk menghindari deteksi.

- Penipuan, scam, dan alur kerja keuangan yang menyesatkan.
  - Contoh: sertifikat palsu, faktur palsu, alur pembayaran yang menyesatkan, outreach scam, bukti sosial palsu, alat yang memungkinkan pembelanjaan atau penagihan tanpa persetujuan manusia yang jelas dan kontrol transparan, atau alur kerja identitas sintetis yang dibuat untuk membuat akun demi penipuan.

- Scraping, pengayaan, atau pengawasan yang melanggar privasi.
  - Contoh: scraping detail kontak dalam skala besar untuk spam, doxxing, stalking, ekstraksi prospek yang dipasangkan dengan outreach tanpa diminta, pemantauan terselubung, pencarian wajah atau pencocokan biometrik yang digunakan tanpa persetujuan jelas, atau membeli, menerbitkan, mengunduh, atau mengoperasionalkan data bocor atau dump pelanggaran data.

- Peniruan tanpa persetujuan atau manipulasi identitas yang menyesatkan.
  - Contoh: face swap, kembaran digital, persona palsu, influencer hasil kloning, atau alat manipulasi identitas lain yang digunakan untuk meniru atau menyesatkan.

- Konten seksual eksplisit dan pembuatan konten dewasa dengan keamanan dinonaktifkan.
  - Contoh: pembuatan gambar/video/konten NSFW, wrapper konten dewasa di sekitar API pihak ketiga, atau keterampilan yang tujuan utamanya adalah konten seksual eksplisit.

- Persyaratan eksekusi yang tersembunyi, tidak aman, atau menyesatkan.
  - Contoh: perintah instalasi yang diobfuscate, `curl | sh`, persyaratan rahasia yang tidak dideklarasikan, penggunaan kunci privat yang tidak dideklarasikan, eksekusi jarak jauh `npx @latest` tanpa kemampuan peninjauan yang jelas, metadata menyesatkan yang menyembunyikan apa yang benar-benar dibutuhkan keterampilan untuk dijalankan.

## Pola terbaru yang secara eksplisit tidak kami terima

- “Buat akun penjual senyap setelah pemblokiran marketplace.”
- “Ubah pairing Telegram agar pengguna yang tidak disetujui otomatis menerima kode pairing.”
- “Bangun akun Reddit/Twitter dengan otomatisasi yang tidak terdeteksi.”
- “Buat sertifikat profesional atau faktur untuk penggunaan arbitrer.”
- “Buat konten NSFW dengan pemeriksaan keamanan dinonaktifkan.”
- “Scrape prospek, perkaya kontak, dan jalankan outreach dingin dalam skala besar.”
- “Beli, terbitkan, atau unduh data bocor atau dump pelanggaran data.”
- “Buat massal akun email atau sosial dengan identitas sintetis atau pemecahan CAPTCHA.”

## Catatan untuk peninjau

- Konteks penting. Topik yang sama bisa sah dalam pengaturan defensif yang sempit atau berbasis persetujuan, dan tidak dapat diterima ketika dikemas sebagai alur kerja penyalahgunaan.
- Kami sebaiknya condong untuk bertindak ketika sebuah keterampilan jelas dioptimalkan untuk penghindaran, penipuan, atau penggunaan tanpa persetujuan.
- Unggahan berulang dalam kategori ini menjadi dasar untuk menyembunyikan konten dan memblokir akun.

## Penegakan

- Kami dapat menyembunyikan, menghapus, atau menghapus permanen keterampilan yang melanggar.
- Kami dapat mencabut token, menghapus lunak konten terkait, dan memblokir pelanggar berulang atau berat.
- Kami tidak menjamin penegakan dengan peringatan terlebih dahulu untuk penyalahgunaan yang jelas.
