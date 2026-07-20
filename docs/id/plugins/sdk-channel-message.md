---
summary: Alihkan ke /plugins/sdk-channel-outbound
title: API pesan saluran
x-i18n:
    generated_at: "2026-07-20T03:55:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bf0d607bd3287233cbb1fe47c15958bf57a81267ae1e37e45a1881f56e1370cb
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

Halaman ini dipindahkan ke [API keluar channel](/id/plugins/sdk-channel-outbound).

`openclaw/plugin-sdk/channel-message` tetap menjadi subpath kompatibilitas yang tidak digunakan lagi
untuk plugin lama. Plugin channel baru harus menggunakan
`openclaw/plugin-sdk/channel-outbound` untuk siklus hidup pesan, tanda terima,
pengiriman persisten, dan helper pratinjau langsung, alih-alih menambahkan helper baru ke
subpath yang tidak digunakan lagi.

Rencana penghapusan: pertahankan alias ini selama periode migrasi plugin
eksternal, lalu hapus dalam pembersihan besar SDK berikutnya setelah pemanggil
beralih ke `channel-outbound`.
