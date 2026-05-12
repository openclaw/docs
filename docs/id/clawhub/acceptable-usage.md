---
read_when:
    - Meninjau unggahan untuk mendeteksi penyalahgunaan atau pelanggaran kebijakan
    - Menulis dokumentasi moderasi atau runbook peninjau
    - Menentukan apakah Skills perlu disembunyikan atau pengguna perlu diblokir
summary: 'Kebijakan marketplace: apa yang diizinkan ClawHub dan apa yang tidak akan dihostingnya.'
x-i18n:
    generated_at: "2026-05-12T00:56:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bacb9c526d1c5698355f2538ba0f8d6acf3e8a9b7b7c12b98ec7680edde16f0
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Penggunaan yang Dapat Diterima

Halaman ini menjelaskan jenis Skills dan konten yang dapat diterima oleh ClawHub, serta alur kerja penyalahgunaan yang tidak akan dihostingnya.

Aturan ini sengaja bersifat praktis. Kami paling peduli pada alur kerja penyalahgunaan end-to-end, bukan sekadar kata kunci yang terisolasi. Jika sebuah Skill dibuat untuk menghindari pertahanan, menyalahgunakan platform, menipu orang, melanggar privasi, atau memungkinkan perilaku tanpa persetujuan, Skill tersebut tidak pantas berada di ClawHub.

## Pola terbaru yang secara eksplisit kami terima

- Pekerjaan frontend dan sistem desain yang menggunakan komponen nyata, token semantik, state aksesibel, dan alur pengguna yang teruji.
- Komposisi shadcn/ui yang menggunakan komponen sumber yang terpasang, alias proyek, dan varian terdokumentasi, bukan markup sekali pakai.
- Konversi UI5 JavaScript ke TypeScript yang mempertahankan komentar, menggunakan tipe UI5 yang konkret, dan menjaga antarmuka kontrol yang dihasilkan tetap dapat ditinjau.
- Tinjauan keamanan defensif, tooling moderasi, dan prompt deteksi penyalahgunaan yang menunjukkan bukti dan menjaga batas persetujuan manusia tetap jelas.
- Otomasi alur kerja berbasis persetujuan untuk akun pribadi atau tim dengan kredensial eksplisit, penyiapan transparan, dan mode dry-run atau pratinjau.
- Dokumentasi, runbook migrasi, utilitas developer, dan fixture pengujian yang dibatasi pada perangkat lunak yang didukungnya.

## Tidak dapat diterima

- Alur kerja bypass keamanan atau akses tanpa otorisasi.
  - Contoh: bypass auth, pengambilalihan akun, bypass CAPTCHA, penghindaran Cloudflare atau anti-bot, bypass rate-limit, scraping terselubung yang dirancang untuk mengalahkan proteksi, pengambilalihan panggilan langsung atau agen, pencurian sesi yang dapat digunakan ulang, persetujuan otomatis alur pairing untuk pengguna yang tidak disetujui.

- Penyalahgunaan platform dan penghindaran pemblokiran.
  - Contoh: akun terselubung setelah pemblokiran, warming/farming akun, engagement palsu, pengembangan karma atau pengikut, otomasi multi-akun, posting massal, bot spam, otomasi marketplace atau sosial yang dibuat untuk menghindari deteksi.

- Penipuan, scam, dan alur kerja keuangan yang menyesatkan.
  - Contoh: sertifikat palsu, faktur palsu, alur pembayaran yang menyesatkan, outreach scam, bukti sosial palsu, alat yang memungkinkan pengeluaran atau penagihan tanpa persetujuan manusia yang jelas dan kontrol transparan, atau alur kerja identitas sintetis yang dibuat untuk membuat akun demi penipuan.

- Scraping, pengayaan, atau pengawasan yang melanggar privasi.
  - Contoh: scraping detail kontak dalam skala besar untuk spam, doxxing, stalking, ekstraksi prospek yang dipasangkan dengan outreach tanpa diminta, pemantauan terselubung, pencarian wajah atau pencocokan biometrik yang digunakan tanpa persetujuan jelas, atau membeli, menerbitkan, mengunduh, atau mengoperasionalkan data bocor atau dump pelanggaran.

- Peniruan tanpa persetujuan atau manipulasi identitas yang menyesatkan.
  - Contoh: face swap, digital twin, persona palsu, influencer kloning, atau tooling manipulasi identitas lain yang digunakan untuk meniru atau menyesatkan.

- Konten seksual eksplisit dan pembuatan konten dewasa dengan keamanan dinonaktifkan.
  - Contoh: pembuatan gambar/video/konten NSFW, wrapper konten dewasa di sekitar API pihak ketiga, atau Skills yang tujuan utamanya adalah konten seksual eksplisit.

- Persyaratan eksekusi yang tersembunyi, tidak aman, atau menyesatkan.
  - Contoh: perintah instalasi yang diobfuscate, `curl | sh`, persyaratan secret yang tidak dideklarasikan, penggunaan private key yang tidak dideklarasikan, eksekusi jarak jauh `npx @latest` tanpa kemampuan peninjauan yang jelas, metadata menyesatkan yang menyembunyikan apa yang sebenarnya dibutuhkan Skill untuk berjalan.

## Pola terbaru yang secara eksplisit tidak kami terima

- “Buat akun penjual terselubung setelah pemblokiran marketplace.”
- “Ubah pairing Telegram agar pengguna yang tidak disetujui otomatis menerima kode pairing.”
- “Kembangkan akun Reddit/Twitter dengan otomasi yang tidak terdeteksi.”
- “Buat sertifikat profesional atau faktur untuk penggunaan sembarang.”
- “Buat konten NSFW dengan pemeriksaan keamanan dinonaktifkan.”
- “Scrape prospek, perkaya kontak, dan jalankan cold outreach dalam skala besar.”
- “Beli, terbitkan, atau unduh data bocor atau dump pelanggaran.”
- “Buat email atau akun sosial secara massal dengan identitas sintetis atau pemecahan CAPTCHA.”

## Catatan untuk peninjau

- Konteks penting. Topik yang sama dapat sah dalam pengaturan defensif yang sempit atau berbasis persetujuan, dan tidak dapat diterima ketika dikemas sebagai alur kerja penyalahgunaan.
- Kami harus condong untuk bertindak ketika sebuah Skill jelas dioptimalkan untuk penghindaran, penipuan, atau penggunaan tanpa persetujuan.
- Unggahan berulang dalam kategori ini menjadi dasar untuk menyembunyikan konten dan memblokir akun.

## Penegakan

- Kami dapat menyembunyikan, menghapus, atau menghapus permanen Skills yang melanggar.
- Kami dapat mencabut token, melakukan soft-delete pada konten terkait, dan memblokir pelanggar berulang atau berat.
- Kami tidak menjamin penegakan dengan peringatan terlebih dahulu untuk penyalahgunaan yang jelas.
