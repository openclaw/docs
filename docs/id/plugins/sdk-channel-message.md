---
summary: Alihkan ke /plugins/sdk-channel-outbound
title: API pesan kanal
x-i18n:
    generated_at: "2026-06-27T17:58:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16a8218a33b379f82c43c8b7e6ee5423cc7338f72f8489d55aa4c7abb2c53721
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Halaman ini dipindahkan ke [API outbound kanal](/id/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` dan
`openclaw/plugin-sdk/channel-message-runtime` tetap menjadi subjalur kompatibilitas
yang tidak digunakan lagi untuk plugin lama. Plugin kanal baru sebaiknya menggunakan
`openclaw/plugin-sdk/channel-outbound` untuk siklus hidup pesan, tanda terima, pengiriman tahan lama,
dan helper pratinjau langsung. Subjalur yang tidak digunakan lagi adalah alias tipis atas
inti pesan kanal bersama dan permukaan SDK inbound/outbound yang terfokus;
jangan tambahkan helper baru di sana.

Rencana penghapusan: pertahankan alias ini selama jendela migrasi plugin eksternal,
lalu hapus dalam pembersihan SDK mayor berikutnya setelah pemanggil berpindah ke
`channel-outbound`.
