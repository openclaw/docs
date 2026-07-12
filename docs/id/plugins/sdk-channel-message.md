---
summary: Alihkan ke /plugins/sdk-channel-outbound
title: API pesan kanal
x-i18n:
    generated_at: "2026-07-12T14:33:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Halaman ini dipindahkan ke [API keluar kanal](/id/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` dan
`openclaw/plugin-sdk/channel-message-runtime` tetap menjadi subjalur kompatibilitas
yang tidak digunakan lagi untuk plugin lama; keduanya merupakan alias tipis untuk inti
pesan kanal bersama. Plugin kanal baru sebaiknya menggunakan
`openclaw/plugin-sdk/channel-outbound` untuk siklus hidup pesan, tanda terima,
pengiriman tahan lama, dan pembantu pratinjau langsung, alih-alih menambahkan pembantu baru ke
subjalur yang tidak digunakan lagi.

Rencana penghapusan: pertahankan alias ini selama periode migrasi plugin
eksternal, lalu hapus dalam pembersihan besar SDK berikutnya setelah pemanggil
berpindah ke `channel-outbound`.
