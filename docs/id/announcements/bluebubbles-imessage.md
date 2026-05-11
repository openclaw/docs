---
read_when:
    - Anda menggunakan saluran BlueBubbles lama dan perlu berpindah ke iMessage
    - Anda sedang memilih penyiapan OpenClaw iMessage yang didukung
    - Anda memerlukan penjelasan singkat tentang penghapusan BlueBubbles
summary: Dukungan BlueBubbles telah dihapus dari OpenClaw. Gunakan Plugin iMessage bawaan dengan imsg untuk penyiapan iMessage baru dan hasil migrasi.
title: Penghapusan BlueBubbles dan jalur iMessage imsg
x-i18n:
    generated_at: "2026-05-11T20:20:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 970e33772534fd3e3d8d3012222bdd9c645ed713b8d38cff21b25b276ae1f544
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# Penghapusan BlueBubbles dan jalur iMessage imsg

OpenClaw tidak lagi menyertakan saluran BlueBubbles. Dukungan iMessage kini berjalan melalui Plugin `imessage` bawaan, yang menjalankan [`imsg`](https://github.com/steipete/imsg) secara lokal atau melalui pembungkus SSH dan berkomunikasi menggunakan JSON-RPC melalui stdin/stdout.

Jika konfigurasi Anda masih berisi `channels.bluebubbles`, migrasikan ke `channels.imessage`. URL dokumentasi lama `/channels/bluebubbles` mengalihkan ke [Beralih dari BlueBubbles](/id/channels/imessage-from-bluebubbles), yang memiliki tabel lengkap penerjemahan konfigurasi dan daftar periksa cutover.

## Yang berubah

- Tidak ada server HTTP BlueBubbles, rute Webhook, kata sandi REST, atau runtime Plugin BlueBubbles dalam jalur iMessage OpenClaw yang didukung.
- OpenClaw membaca dan memantau Messages melalui `imsg` pada Mac tempat Messages.app sudah masuk.
- Pengiriman, penerimaan, riwayat, dan media dasar menggunakan surface `imsg` normal dan izin macOS.
- Tindakan lanjutan seperti balasan berutas, tapback, edit, batal kirim, efek, tanda terima baca, indikator mengetik, dan manajemen grup memerlukan `imsg launch` dengan bridge API privat yang tersedia.
- Gateway Linux dan Windows masih dapat menggunakan iMessage dengan mengatur `channels.imessage.cliPath` ke pembungkus SSH yang menjalankan `imsg` pada Mac yang sudah masuk.

## Yang perlu dilakukan

1. Instal dan verifikasi `imsg` pada Mac Messages:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. Berikan izin Full Disk Access dan Automation ke konteks proses yang menjalankan `imsg` dan OpenClaw.

3. Terjemahkan konfigurasi lama:

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

5. Uji DM, grup, lampiran, dan tindakan API privat apa pun yang Anda andalkan sebelum menghapus server BlueBubbles lama Anda.

## Catatan migrasi

- `channels.bluebubbles.serverUrl` dan `channels.bluebubbles.password` tidak memiliki padanan iMessage.
- `channels.bluebubbles.allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, root lampiran, batas ukuran media, chunking, dan toggle tindakan memiliki padanan iMessage.
- `channels.imessage.includeAttachments` tetap nonaktif secara default. Atur secara eksplisit jika Anda mengharapkan foto, memo suara, video, atau file masuk mencapai agen.
- Dengan `groupPolicy: "allowlist"`, salin blok `groups` lama, termasuk entri wildcard `"*"` apa pun. Daftar yang diizinkan pengirim grup dan registri grup adalah gate terpisah.
- Binding ACP yang cocok dengan `channel: "bluebubbles"` harus diubah menjadi `channel: "imessage"`.
- Kunci sesi BlueBubbles lama tidak menjadi kunci sesi iMessage. Persetujuan pairing terbawa berdasarkan handle, tetapi riwayat percakapan di bawah kunci sesi BlueBubbles tidak.

## Lihat juga

- [Beralih dari BlueBubbles](/id/channels/imessage-from-bluebubbles)
- [iMessage](/id/channels/imessage)
- [Referensi konfigurasi - iMessage](/id/gateway/config-channels#imessage)
