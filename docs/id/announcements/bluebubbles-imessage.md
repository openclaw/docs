---
read_when:
    - Anda menggunakan kanal BlueBubbles lama dan perlu beralih ke iMessage
    - Anda sedang memilih penyiapan iMessage OpenClaw yang didukung
    - Anda memerlukan penjelasan singkat tentang penghapusan BlueBubbles
summary: Dukungan BlueBubbles telah dihapus dari OpenClaw. Gunakan plugin iMessage bawaan dengan imsg untuk penyiapan iMessage baru dan yang dimigrasikan.
title: Penghapusan BlueBubbles dan jalur iMessage imsg
x-i18n:
    generated_at: "2026-07-12T13:55:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# Penghapusan BlueBubbles dan jalur iMessage melalui imsg

OpenClaw tidak lagi menyertakan kanal BlueBubbles. Dukungan iMessage berjalan melalui plugin `imessage` bawaan: Gateway menjalankan [`imsg`](https://github.com/steipete/imsg) sebagai proses anak, secara lokal atau melalui pembungkus SSH, dan berkomunikasi menggunakan JSON-RPC melalui stdin/stdout. Tanpa server, tanpa webhook, tanpa port.

Jika konfigurasi Anda masih berisi `channels.bluebubbles`, migrasikan ke `channels.imessage`. URL dokumentasi lama `/channels/bluebubbles` dialihkan ke [Beralih dari BlueBubbles](/id/channels/imessage-from-bluebubbles), yang memuat tabel lengkap konversi konfigurasi dan daftar periksa peralihan.

## Perubahan yang terjadi

- Jalur iMessage yang didukung tidak memiliki server HTTP BlueBubbles, rute webhook, kata sandi REST, atau runtime plugin BlueBubbles.
- OpenClaw membaca dan memantau Pesan melalui `imsg` di Mac tempat Messages.app telah masuk.
- Pengiriman, penerimaan, riwayat, dan media dasar menggunakan antarmuka `imsg` biasa serta izin macOS.
- Tindakan lanjutan (balasan berutas, tapback, pengeditan, pembatalan pengiriman, efek, tanda dibaca, indikator pengetikan, pengelolaan grup) memerlukan jembatan API privat: jalankan `imsg launch`, yang mengharuskan SIP dinonaktifkan.
- Gateway Linux dan Windows tetap dapat menggunakan iMessage dengan mengarahkan `channels.imessage.cliPath` ke pembungkus SSH yang menjalankan `imsg` di Mac yang telah masuk.

## Yang harus dilakukan

1. Instal dan verifikasi `imsg` di Mac yang menjalankan Pesan:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. Berikan izin Akses Disk Penuh dan Otomatisasi kepada konteks proses yang menjalankan `imsg` dan OpenClaw.

3. Konversikan konfigurasi lama:

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"],
         groupPolicy: "allowlist",
         groupAllowFrom: ["+15555550123"],
         groups: {
           "*": { requireMention: true },
         },
         includeAttachments: true,
       },
     },
   }
   ```

4. Mulai ulang Gateway dan verifikasi:

   ```bash
   openclaw channels status --probe
   ```

5. Uji pesan langsung, grup, lampiran, dan semua tindakan API privat yang Anda andalkan sebelum menghapus server BlueBubbles lama.

## Catatan migrasi

- `channels.bluebubbles.serverUrl` dan `channels.bluebubbles.password` tidak memiliki padanan di iMessage; tidak ada server yang perlu diakses atau diautentikasi.
- `allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, dan `actions.*` tetap memiliki arti yang sama di bawah `channels.imessage`.
- `channels.imessage.includeAttachments` tetap dinonaktifkan secara bawaan. Atur secara eksplisit jika Anda mengharapkan foto, memo suara, video, atau berkas yang masuk diteruskan ke agen.
- Dengan `groupPolicy: "allowlist"`, salin blok `groups` lama, termasuk entri karakter pengganti `"*"` jika ada. Daftar yang diizinkan untuk pengirim grup dan registri grup merupakan gerbang yang terpisah; blok `groups` yang memiliki entri tetapi tidak memiliki `chat_id` yang cocok (atau tidak memiliki `"*"`) akan membuang pesan saat runtime, sedangkan blok `groups` kosong mencatat peringatan saat dimulai meskipun pemfilteran pengirim tetap meneruskan pesan.
- Pengikatan ACP dengan `match.channel: "bluebubbles"` harus diubah menjadi `"imessage"`.
- Kunci sesi BlueBubbles lama tidak berubah menjadi kunci sesi iMessage. Persetujuan pemasangan mengacu pada identitas pengirim, sehingga entri `allowFrom` yang disalin tetap berfungsi, tetapi riwayat percakapan di bawah kunci sesi BlueBubbles tidak ikut dimigrasikan.

## Lihat juga

- [Beralih dari BlueBubbles](/id/channels/imessage-from-bluebubbles)
- [iMessage](/id/channels/imessage)
- [Referensi konfigurasi - iMessage](/id/gateway/config-channels#imessage)
