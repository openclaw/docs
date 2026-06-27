---
read_when:
    - Bekerja dengan reaksi di saluran apa pun
    - Memahami bagaimana reaksi emoji berbeda di berbagai platform
summary: Semantik alat reaksi di semua kanal yang didukung
title: Reaksi
x-i18n:
    generated_at: "2026-06-27T18:20:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2dc9575eaeb79a56ca82ee491c2974e9984b1a12999762b1532ca9affdbbd72f
    source_path: tools/reactions.md
    workflow: 16
---

Agen dapat menambahkan dan menghapus reaksi emoji pada pesan menggunakan tool `message`
dengan aksi `react`. Perilaku reaksi bervariasi menurut kanal dan transport.

## Cara kerjanya

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` wajib saat menambahkan reaksi.
- Atur `emoji` ke string kosong (`""`) untuk menghapus reaksi bot.
- Atur `remove: true` untuk menghapus emoji tertentu (memerlukan `emoji` yang tidak kosong).
- Pada kanal yang mendukung reaksi status, `trackToolCalls: true` pada sebuah
  reaksi memungkinkan runtime menggunakan pesan yang diberi reaksi tersebut untuk reaksi
  progres tool berikutnya selama giliran yang sama.

## Perilaku kanal

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - `emoji` kosong menghapus semua reaksi bot pada pesan.
    - `remove: true` hanya menghapus emoji yang ditentukan.

  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` kosong menghapus reaksi aplikasi pada pesan.
    - `remove: true` hanya menghapus emoji yang ditentukan.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - Hanya menambahkan reaksi: `emoji` wajib dan tidak boleh kosong.
    - Penghapusan reaksi belum didukung; panggilan dengan `remove: true` (atau `emoji` kosong) ditolak dengan galat yang jelas, bukan diam-diam tidak melakukan apa pun.
    - Mengharuskan bot Talk terdaftar dengan fitur `reaction` (lihat [dokumentasi kanal Nextcloud Talk](/id/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - `emoji` kosong menghapus reaksi bot.
    - `remove: true` juga menghapus reaksi tetapi tetap memerlukan `emoji` yang tidak kosong untuk validasi tool.

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` kosong menghapus reaksi bot.
    - `remove: true` dipetakan ke emoji kosong secara internal (tetap memerlukan `emoji` dalam panggilan tool).
    - WhatsApp memiliki satu slot reaksi bot per pesan; pembaruan reaksi status mengganti slot tersebut, bukan menumpuk beberapa emoji.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Memerlukan `emoji` yang tidak kosong.
    - `remove: true` menghapus reaksi emoji tertentu tersebut.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Gunakan tool `feishu_reaction` dengan aksi `add`, `remove`, dan `list`.
    - Tambah/hapus memerlukan `emoji_type`; hapus juga memerlukan `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Notifikasi reaksi masuk dikendalikan oleh `channels.signal.reactionNotifications`: `"off"` menonaktifkannya, `"own"` (default) memancarkan peristiwa saat pengguna bereaksi ke pesan bot, dan `"all"` memancarkan peristiwa untuk semua reaksi.

  </Accordion>

  <Accordion title="iMessage">
    - Reaksi keluar adalah tapback iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize`, dan `question`).
    - Notifikasi tapback masuk dikendalikan oleh `channels.imessage.reactionNotifications`: `"off"` menonaktifkannya, `"own"` (default) memancarkan peristiwa saat pengguna bereaksi ke pesan yang ditulis oleh bot, dan `"all"` memancarkan peristiwa untuk semua tapback dari pengirim yang diotorisasi.

  </Accordion>
</AccordionGroup>

## Tingkat reaksi

Konfigurasi `reactionLevel` per kanal mengontrol seberapa luas agen menggunakan reaksi. Nilainya biasanya `off`, `ack`, `minimal`, atau `extensive`.

- [Telegram reactionLevel](/id/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/id/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Atur `reactionLevel` pada masing-masing kanal untuk menyesuaikan seberapa aktif agen bereaksi terhadap pesan di setiap platform.

## Terkait

- [Pengiriman Agen](/id/tools/agent-send) — tool `message` yang menyertakan `react`
- [Kanal](/id/channels) — konfigurasi khusus kanal
