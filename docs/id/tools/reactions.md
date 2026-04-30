---
read_when:
    - Menangani reaksi di saluran apa pun
    - Memahami bagaimana reaksi emoji berbeda di berbagai platform
summary: Semantik alat reaksi di semua kanal yang didukung
title: Reaksi
x-i18n:
    generated_at: "2026-04-30T10:16:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29cbb4a3afa4c0fdd049bfd615890b0fccea26bf28f109d6cba6f041423ca5e0
    source_path: tools/reactions.md
    workflow: 16
---

Agen dapat menambahkan dan menghapus reaksi emoji pada pesan menggunakan alat `message`
dengan tindakan `react`. Perilaku reaksi bervariasi menurut kanal dan transport.

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

  <Accordion title="Telegram">
    - `emoji` kosong menghapus reaksi bot.
    - `remove: true` juga menghapus reaksi tetapi tetap memerlukan `emoji` yang tidak kosong untuk validasi alat.

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` kosong menghapus reaksi bot.
    - `remove: true` dipetakan secara internal ke emoji kosong (tetap memerlukan `emoji` dalam panggilan alat).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Memerlukan `emoji` yang tidak kosong.
    - `remove: true` menghapus reaksi emoji tertentu tersebut.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Gunakan alat `feishu_reaction` dengan tindakan `add`, `remove`, dan `list`.
    - Menambah/menghapus memerlukan `emoji_type`; menghapus juga memerlukan `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Notifikasi reaksi masuk dikontrol oleh `channels.signal.reactionNotifications`: `"off"` menonaktifkannya, `"own"` (default) memancarkan peristiwa saat pengguna bereaksi terhadap pesan bot, dan `"all"` memancarkan peristiwa untuk semua reaksi.

  </Accordion>
</AccordionGroup>

## Tingkat reaksi

Konfigurasi `reactionLevel` per kanal mengontrol seberapa luas agen menggunakan reaksi. Nilainya biasanya `off`, `ack`, `minimal`, atau `extensive`.

- [Telegram reactionLevel](/id/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/id/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Atur `reactionLevel` pada kanal individual untuk menyesuaikan seberapa aktif agen bereaksi terhadap pesan di setiap platform.

## Terkait

- [Agent Send](/id/tools/agent-send) — alat `message` yang menyertakan `react`
- [Kanal](/id/channels) — konfigurasi khusus kanal
