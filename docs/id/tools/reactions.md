---
read_when:
    - Mengerjakan reaksi di channel mana pun
    - Memahami bagaimana reaksi emoji berbeda di berbagai platform
summary: Semantik alat reaksi di semua channel yang didukung
title: Reaksi
x-i18n:
    generated_at: "2026-04-11T02:47:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfac31b7f0effc89cc696e3cf34cd89503ccdbb28996723945025e4b6e159986
    source_path: tools/reactions.md
    workflow: 15
---

# Reaksi

Agen dapat menambahkan dan menghapus reaksi emoji pada pesan menggunakan alat `message`
dengan aksi `react`. Perilaku reaksi berbeda-beda menurut channel.

## Cara kerjanya

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` wajib saat menambahkan reaksi.
- Setel `emoji` ke string kosong (`""`) untuk menghapus reaksi bot.
- Setel `remove: true` untuk menghapus emoji tertentu (memerlukan `emoji` yang tidak kosong).

## Perilaku channel

<AccordionGroup>
  <Accordion title="Discord dan Slack">
    - `emoji` kosong menghapus semua reaksi bot pada pesan.
    - `remove: true` hanya menghapus emoji yang ditentukan.
  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` kosong menghapus reaksi aplikasi pada pesan.
    - `remove: true` hanya menghapus emoji yang ditentukan.
  </Accordion>

  <Accordion title="Telegram">
    - `emoji` kosong menghapus reaksi bot.
    - `remove: true` juga menghapus reaksi tetapi tetap memerlukan `emoji` yang tidak kosong untuk validasi alat.
  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` kosong menghapus reaksi bot.
    - `remove: true` dipetakan ke emoji kosong secara internal (tetap memerlukan `emoji` dalam pemanggilan alat).
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Memerlukan `emoji` yang tidak kosong.
    - `remove: true` menghapus reaksi emoji tertentu.
  </Accordion>

  <Accordion title="Feishu/Lark">
    - Gunakan alat `feishu_reaction` dengan aksi `add`, `remove`, dan `list`.
    - Penambahan/penghapusan memerlukan `emoji_type`; penghapusan juga memerlukan `reaction_id`.
  </Accordion>

  <Accordion title="Signal">
    - Notifikasi reaksi masuk dikendalikan oleh `channels.signal.reactionNotifications`: `"off"` menonaktifkannya, `"own"` (default) memunculkan event saat pengguna bereaksi pada pesan bot, dan `"all"` memunculkan event untuk semua reaksi.
  </Accordion>
</AccordionGroup>

## Tingkat reaksi

Konfigurasi `reactionLevel` per-channel mengontrol seberapa luas agen menggunakan reaksi. Nilainya biasanya `off`, `ack`, `minimal`, atau `extensive`.

- [reactionLevel Telegram](/id/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [reactionLevel WhatsApp](/id/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Setel `reactionLevel` pada masing-masing channel untuk menyesuaikan seberapa aktif agen bereaksi terhadap pesan di setiap platform.

## Terkait

- [Pengiriman Agen](/id/tools/agent-send) — alat `message` yang mencakup `react`
- [Channels](/id/channels) — konfigurasi khusus channel
