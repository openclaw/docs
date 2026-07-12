---
read_when:
    - Menyiapkan OpenClaw di Hostinger
    - Mencari VPS terkelola untuk OpenClaw
    - Menggunakan OpenClaw 1-Klik Hostinger
summary: Hosting OpenClaw di Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-07-12T14:17:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dc49e741f8581928553e2426ed91f92df6e7b0c31dd8780c0d6e891a07be263
    source_path: install/hostinger.md
    workflow: 16
---

Jalankan Gateway OpenClaw persisten di [Hostinger](https://www.hostinger.com/openclaw), baik sebagai penerapan terkelola **1-Click** maupun sebagai instalasi **VPS** yang Anda kelola sendiri.

## Prasyarat

- Akun Hostinger ([daftar](https://www.hostinger.com/openclaw))
- Sekitar 5–10 menit

## Opsi A: OpenClaw 1-Click

Hostinger menangani infrastruktur, Docker, dan pembaruan otomatis. Cara tercepat untuk mendapatkan instans yang berjalan.

<Steps>
  <Step title="Beli dan luncurkan">
    1. Dari [halaman OpenClaw Hostinger](https://www.hostinger.com/openclaw), pilih paket OpenClaw Terkelola dan selesaikan pembayaran.

    <Note>
    Saat pembayaran, Anda dapat memilih kredit **Ready-to-Use AI** yang dibeli di muka dan langsung terintegrasi di dalam OpenClaw—tanpa memerlukan akun eksternal atau kunci API dari penyedia lain. Anda dapat langsung mulai mengobrol. Sebagai alternatif, masukkan kunci Anda sendiri dari Anthropic, OpenAI, Google Gemini, atau xAI saat penyiapan.
    </Note>

  </Step>

  <Step title="Pilih saluran perpesanan">
    Pilih satu atau beberapa saluran untuk dihubungkan:

    - **WhatsApp**—pindai kode QR yang ditampilkan dalam wizard penyiapan.
    - **Telegram**—tempel token bot dari [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Selesaikan instalasi">
    Klik **Finish** untuk menerapkan instans. Setelah siap, akses dasbor OpenClaw dari **OpenClaw Overview** di hPanel.
  </Step>

</Steps>

## Opsi B: OpenClaw di VPS

Memberikan kontrol lebih besar atas server. Hostinger menerapkan OpenClaw melalui Docker di VPS Anda; Anda mengelolanya melalui **Docker Manager** di hPanel.

<Steps>
  <Step title="Beli VPS">
    1. Dari [halaman OpenClaw Hostinger](https://www.hostinger.com/openclaw), pilih paket OpenClaw di VPS dan selesaikan pembayaran.

    <Note>
    Anda dapat memilih kredit **Ready-to-Use AI** saat pembayaran—kredit ini dibeli di muka dan langsung terintegrasi di dalam OpenClaw, sehingga Anda dapat mulai mengobrol tanpa akun eksternal atau kunci API dari penyedia lain.
    </Note>

  </Step>

  <Step title="Konfigurasikan OpenClaw">
    Setelah VPS disediakan, isi kolom konfigurasi:

    - **Token Gateway**—dibuat secara otomatis; simpan untuk digunakan nanti.
    - **Nomor WhatsApp**—nomor Anda beserta kode negara (opsional).
    - **Token bot Telegram**—dari [BotFather](https://t.me/BotFather) (opsional).
    - **Kunci API**—hanya diperlukan jika Anda tidak memilih kredit Ready-to-Use AI saat pembayaran.

  </Step>

  <Step title="Mulai OpenClaw">
    Klik **Deploy**. Setelah berjalan, buka dasbor OpenClaw dari hPanel dengan mengeklik **Open**.
  </Step>

</Steps>

Log, mulai ulang, dan pembaruan dijalankan dari antarmuka Docker Manager di hPanel. Untuk memperbarui, tekan **Update** di Docker Manager guna mengambil image terbaru.

## Verifikasi penyiapan Anda

Kirim "Hai" kepada asisten Anda di saluran yang telah dihubungkan. OpenClaw akan membalas dan memandu Anda mengatur preferensi awal.

## Pemecahan masalah

**Dasbor tidak dapat dimuat**—Tunggu beberapa menit hingga kontainer selesai disediakan, lalu periksa log Docker Manager di hPanel.

**Kontainer Docker terus dimulai ulang**—Buka log Docker Manager dan cari kesalahan konfigurasi (token yang tidak ada, kunci API tidak valid).

**Bot Telegram tidak merespons**—Jika pemasangan DM diperlukan, pengirim yang tidak dikenal akan menerima kode pemasangan singkat, bukan balasan. Setujui dari obrolan dasbor OpenClaw, atau dengan `openclaw pairing approve telegram <CODE>` jika Anda memiliki akses shell ke kontainer. Lihat [Pemasangan](/id/channels/pairing).

## Langkah berikutnya

- [Saluran](/id/channels)—hubungkan Telegram, WhatsApp, Discord, dan lainnya
- [Konfigurasi Gateway](/id/gateway/configuration)—semua opsi konfigurasi

## Terkait

- [Ikhtisar instalasi](/id/install)
- [Hosting VPS](/id/vps)
- [DigitalOcean](/id/install/digitalocean)
