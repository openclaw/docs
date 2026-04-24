---
read_when:
    - Mengerjakan reaksi di channel mana pun
    - Memahami bagaimana reaksi emoji berbeda di berbagai platform
summary: Semantik tool reaction di semua channel yang didukung
title: Reaksi
x-i18n:
    generated_at: "2026-04-24T09:32:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 58d9a85114e715fd1813a4d662b02a6b8b9cad9a8eea9c63d024a933ba573a65
    source_path: tools/reactions.md
    workflow: 15
---

Agen dapat menambahkan dan menghapus reaksi emoji pada pesan menggunakan tool `message`
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
- Atur `emoji` ke string kosong (`""`) untuk menghapus reaksi bot.
- Atur `remove: true` untuk menghapus emoji tertentu (memerlukan `emoji` yang tidak kosong).

## Perilaku channel

<AccordionGroup>
  <Accordion title="Discord dan Slack">
    - `emoji` kosong menghapus semua reaksi bot pada pesan itu.
    - `remove: true` hanya menghapus emoji yang ditentukan.
  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` kosong menghapus reaksi aplikasi pada pesan itu.
    - `remove: true` hanya menghapus emoji yang ditentukan.
  </Accordion>

  <Accordion title="Telegram">
    - `emoji` kosong menghapus reaksi bot.
    - `remove: true` juga menghapus reaksi tetapi tetap memerlukan `emoji` yang tidak kosong untuk validasi tool.
  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` kosong menghapus reaksi bot.
    - `remove: true` dipetakan ke emoji kosong secara internal (tetap memerlukan `emoji` dalam pemanggilan tool).
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Memerlukan `emoji` yang tidak kosong.
    - `remove: true` menghapus reaksi emoji tertentu tersebut.
  </Accordion>

  <Accordion title="Feishu/Lark">
    - Gunakan tool `feishu_reaction` dengan aksi `add`, `remove`, dan `list`.
    - Add/remove memerlukan `emoji_type`; remove juga memerlukan `reaction_id`.
  </Accordion>

  <Accordion title="Signal">
    - Notifikasi reaksi masuk dikendalikan oleh `channels.signal.reactionNotifications`: `"off"` menonaktifkannya, `"own"` (default) memancarkan peristiwa saat pengguna bereaksi pada pesan bot, dan `"all"` memancarkan peristiwa untuk semua reaksi.
  </Accordion>
</AccordionGroup>

## Tingkat reaksi

Config `reactionLevel` per-channel mengontrol seberapa luas agen menggunakan reaksi. Nilainya biasanya `off`, `ack`, `minimal`, atau `extensive`.

- [Telegram reactionLevel](/id/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/id/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Atur `reactionLevel` pada channel individual untuk menyetel seberapa aktif agen bereaksi terhadap pesan di setiap platform.

## Terkait

- [Agent Send](/id/tools/agent-send) — tool `message` yang mencakup `react`
- [Channels](/id/channels) — konfigurasi khusus channel
