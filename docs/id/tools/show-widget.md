---
read_when:
    - Anda ingin agen menampilkan hasil interaktif di dalam obrolan web
    - Anda memerlukan kontrak input, keamanan, atau retensi `show_widget`
sidebarTitle: Show widget
summary: Render widget SVG atau HTML mandiri secara inline dalam obrolan web
title: Tampilkan widget
x-i18n:
    generated_at: "2026-07-12T14:45:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2de3760ec3aba9e6551eb31129c32f74fc69a8a158f9d6bde5a823136e5eae87
    source_path: tools/show-widget.md
    workflow: 16
---

`show_widget` merender fragmen SVG atau HTML mandiri secara inline dalam transkrip obrolan UI Kontrol. Plugin Canvas bawaan memiliki alat ini dan meng-host setiap hasil sebagai dokumen Canvas dengan origin yang sama.

Alat ini hanya tersedia ketika klien Gateway asal mendeklarasikan kapabilitas `inline-widgets`. UI Kontrol mendeklarasikan kapabilitas ini secara otomatis. Proses kanal seperti Telegram dan WhatsApp tidak menerima `show_widget`.

Transpor kapabilitas mencakup backend model tertanam, server aplikasi Codex, dan yang didukung CLI. Pemanggil MCP yang diautentikasi dengan grant dan pemanggil alat langsung melalui HTTP tetap ditolak secara default karena tidak mendeklarasikan kapabilitas klien.

## Menggunakan alat

Agen menyediakan dua string wajib:

<ParamField path="title" type="string" required>
  Judul singkat yang ditampilkan bersama pratinjau inline dan pada judul dokumen yang di-host.
</ParamField>

<ParamField path="widget_code" type="string" required>
  Fragmen SVG atau HTML mandiri. Masukan yang diawali dengan `<svg` setelah spasi kosong dihapus akan dirender dalam mode SVG; semua masukan lainnya diperlakukan sebagai fragmen HTML. Panjang maksimum: 262.144 karakter.
</ParamField>

Hasil alat menyertakan handle pratinjau Canvas, sehingga obrolan web merender widget langsung dari pemanggilan alat dan memulihkannya setelah riwayat dimuat ulang. Transkrip yang tidak merender pratinjau tetap menampilkan jalur Canvas yang di-host.

## Keamanan dan penyimpanan

Dokumen widget menggunakan Kebijakan Keamanan Konten yang ketat: gaya dan skrip inline diizinkan, gambar dapat menggunakan URL `data:`, sedangkan pengambilan eksternal dan pemuatan sumber daya diblokir. Simpan semua markup, gaya, skrip, dan data gambar di dalam `widget_code`.

Iframe selalu menghilangkan `allow-same-origin`, bahkan ketika mode penyematan global UI Kontrol adalah `trusted`, sehingga skrip widget tidak dapat membaca origin aplikasi induk. Host Canvas juga menyajikan dokumen widget dengan header respons `Content-Security-Policy: sandbox allow-scripts`, sehingga membuka URL yang di-host secara langsung tetap menjalankan widget dalam origin opak, bukan origin UI Kontrol. Sandbox peramban tidak mencegah skrip menavigasi iframe-nya sendiri; hanya render kode widget yang bersedia Anda jalankan dalam bingkai terisolasi tersebut.

Iframe juga mengikuti [`gateway.controlUi.embedSandbox`](/id/web/control-ui#hosted-embeds). Tingkat `scripts` bawaan mendukung widget interaktif sekaligus mempertahankan isolasi origin.

Canvas menyimpan paling banyak 32 widget per sesi (atau per agen ketika sesi tidak tersedia). Pembuatan widget lain akan menghapus dokumen terlama dalam cakupan tersebut.

## Terkait

- [Penyematan yang di-host UI Kontrol](/id/web/control-ui#hosted-embeds)
- [Plugin Canvas](/id/plugins/reference/canvas)
- [Kapabilitas klien protokol Gateway](/id/gateway/protocol#client-capabilities)
