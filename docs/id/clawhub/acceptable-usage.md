---
read_when:
    - Meninjau unggahan untuk mendeteksi penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau runbook peninjau
    - Menentukan apakah suatu skill harus disembunyikan atau seorang pengguna diblokir
summary: 'Kebijakan marketplace: apa yang diizinkan ClawHub dan apa yang tidak akan dihostingnya.'
x-i18n:
    generated_at: "2026-05-12T15:42:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

Halaman ini menjelaskan jenis keterampilan dan konten yang dapat diterima oleh ClawHub, serta alur kerja penyalahgunaan yang tidak akan dihosting.

Aturan ini sengaja dibuat praktis. Kami paling peduli pada alur kerja penyalahgunaan end-to-end, bukan hanya kata kunci yang terisolasi. Jika sebuah keterampilan dibuat untuk menghindari pertahanan, menyalahgunakan platform, menipu orang, melanggar privasi, atau memungkinkan perilaku tanpa persetujuan, keterampilan tersebut tidak layak berada di ClawHub.

## Pola terbaru yang secara eksplisit kami terima

- Pekerjaan frontend dan design-system yang menggunakan komponen nyata, token semantik, status yang aksesibel, dan alur pengguna yang teruji.
- Komposisi shadcn/ui yang menggunakan komponen sumber terpasang, alias proyek, dan varian terdokumentasi alih-alih markup sekali pakai.
- Konversi UI5 JavaScript-ke-TypeScript yang mempertahankan komentar, menggunakan tipe UI5 konkret, dan menjaga antarmuka kontrol yang dihasilkan tetap dapat ditinjau.
- Tinjauan keamanan defensif, perkakas moderasi, dan prompt deteksi penyalahgunaan yang menampilkan bukti dan menjaga batas persetujuan manusia tetap jelas.
- Otomatisasi alur kerja berbasis persetujuan untuk akun pribadi atau tim dengan kredensial eksplisit, penyiapan transparan, serta mode dry-run atau pratinjau.
- Dokumentasi, runbook migrasi, utilitas pengembang, dan fixture pengujian yang dibatasi pada perangkat lunak yang didukungnya.

## Tidak dapat diterima

- Alur kerja bypass keamanan atau akses tanpa izin.
  - Contoh: bypass autentikasi, pengambilalihan akun, bypass CAPTCHA, pengelakan Cloudflare atau anti-bot, bypass rate-limit, scraping terselubung yang dirancang untuk mengalahkan perlindungan, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan ulang, persetujuan otomatis alur pairing untuk pengguna yang tidak disetujui.

- Penyalahgunaan platform dan pengelakan banned.
  - Contoh: akun terselubung setelah banned, pemanasan/pembudidayaan akun, engagement palsu, pembudidayaan karma atau pengikut, otomatisasi multi-akun, posting massal, bot spam, otomatisasi marketplace atau sosial yang dibuat untuk menghindari deteksi.

- Penipuan, scam, dan alur kerja finansial yang menyesatkan.
  - Contoh: sertifikat palsu, faktur palsu, alur pembayaran yang menyesatkan, penjangkauan scam, bukti sosial palsu, alat yang memungkinkan pembelanjaan atau penagihan tanpa persetujuan manusia yang jelas dan kontrol transparan, atau alur kerja identitas sintetis yang dibuat untuk membuat akun bagi penipuan.

- Scraping, pengayaan, atau pengawasan yang melanggar privasi.
  - Contoh: scraping detail kontak dalam skala besar untuk spam, doxxing, stalking, ekstraksi lead yang dipasangkan dengan penjangkauan tanpa diminta, pemantauan tersembunyi, pencarian wajah atau pencocokan biometrik yang digunakan tanpa persetujuan yang jelas, atau membeli, menerbitkan, mengunduh, atau mengoperasionalkan data bocor atau dump pelanggaran data.

- Peniruan tanpa persetujuan atau manipulasi identitas yang menyesatkan.
  - Contoh: tukar wajah, kembaran digital, persona palsu, influencer kloning, atau perkakas manipulasi identitas lain yang digunakan untuk meniru atau menyesatkan.

- Konten seksual eksplisit dan pembuatan konten dewasa dengan keamanan dinonaktifkan.
  - Contoh: pembuatan gambar/video/konten NSFW, wrapper konten dewasa di sekitar API pihak ketiga, atau keterampilan yang tujuan utamanya adalah konten seksual eksplisit.

- Persyaratan eksekusi yang tersembunyi, tidak aman, atau menyesatkan.
  - Contoh: perintah instalasi yang diobfuskasi, `curl | sh`, persyaratan rahasia yang tidak dinyatakan, penggunaan private-key yang tidak dinyatakan, eksekusi jarak jauh `npx @latest` tanpa keterlihatan tinjauan yang jelas, metadata menyesatkan yang menyembunyikan apa yang sebenarnya diperlukan keterampilan untuk berjalan.

## Pola terbaru yang secara eksplisit tidak kami terima

- “Buat akun penjual terselubung setelah banned dari marketplace.”
- “Ubah pairing Telegram agar pengguna yang tidak disetujui otomatis menerima kode pairing.”
- “Kembangkan akun Reddit/Twitter dengan otomatisasi yang tidak terdeteksi.”
- “Buat sertifikat profesional atau faktur untuk penggunaan arbitrer.”
- “Buat konten NSFW dengan pemeriksaan keamanan dinonaktifkan.”
- “Scrape lead, perkaya kontak, dan luncurkan penjangkauan dingin dalam skala besar.”
- “Beli, terbitkan, atau unduh data bocor atau dump pelanggaran data.”
- “Buat akun email atau sosial secara massal dengan identitas sintetis atau penyelesaian CAPTCHA.”

## Catatan untuk peninjau

- Konteks penting. Topik yang sama dapat sah dalam pengaturan defensif atau berbasis persetujuan yang sempit dan tidak dapat diterima ketika dikemas sebagai alur kerja penyalahgunaan.
- Kami sebaiknya condong untuk bertindak ketika sebuah keterampilan jelas dioptimalkan untuk pengelakan, penipuan, atau penggunaan tanpa persetujuan.
- Unggahan berulang dalam kategori ini menjadi dasar untuk menyembunyikan konten dan mem-banned akun.

## Penegakan

- Kami dapat menyembunyikan, menghapus, atau menghapus permanen keterampilan yang melanggar.
- Kami dapat mencabut token, menghapus lunak konten terkait, dan mem-banned pelanggar berulang atau berat.
- Kami tidak menjamin penegakan yang didahului peringatan untuk penyalahgunaan yang jelas.
