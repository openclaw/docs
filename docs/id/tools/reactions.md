---
read_when:
    - Mengerjakan reactions di channel apa pun
    - Memahami bagaimana reaction emoji berbeda di berbagai platform
summary: Semantik tool reaction di semua channel yang didukung
title: Reactions
x-i18n:
    generated_at: "2026-04-05T14:08:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9af2951eee32e73adb982dbdf39b32e4065993454e9cce2ad23b27565cab4f84
    source_path: tools/reactions.md
    workflow: 15
---

# Reactions

Agen dapat menambahkan dan menghapus reaction emoji pada pesan menggunakan tool `message`
dengan action `react`. Perilaku reaction berbeda-beda menurut channel.

## Cara kerjanya

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` wajib diisi saat menambahkan reaction.
- Setel `emoji` ke string kosong (`""`) untuk menghapus reaction bot.
- Setel `remove: true` untuk menghapus emoji tertentu (memerlukan `emoji` yang tidak kosong).

## Perilaku channel

<AccordionGroup>
  <Accordion title="Discord and Slack">
    - `emoji` kosong menghapus semua reaction bot pada pesan.
    - `remove: true` hanya menghapus emoji yang ditentukan.
  </Accordion>

  <Accordion title="Google Chat">
    - `emoji` kosong menghapus reaction aplikasi pada pesan.
    - `remove: true` hanya menghapus emoji yang ditentukan.
  </Accordion>

  <Accordion title="Telegram">
    - `emoji` kosong menghapus reaction bot.
    - `remove: true` juga menghapus reaction tetapi tetap memerlukan `emoji` yang tidak kosong untuk validasi tool.
  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` kosong menghapus reaction bot.
    - `remove: true` dipetakan secara internal ke emoji kosong (tetap memerlukan `emoji` dalam pemanggilan tool).
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Memerlukan `emoji` yang tidak kosong.
    - `remove: true` menghapus reaction emoji tertentu.
  </Accordion>

  <Accordion title="Feishu/Lark">
    - Gunakan tool `feishu_reaction` dengan action `add`, `remove`, dan `list`.
    - Menambahkan/menghapus memerlukan `emoji_type`; menghapus juga memerlukan `reaction_id`.
  </Accordion>

  <Accordion title="Signal">
    - Notifikasi reaction masuk dikendalikan oleh `channels.signal.reactionNotifications`: `"off"` menonaktifkannya, `"own"` (default) memunculkan event saat pengguna bereaksi terhadap pesan bot, dan `"all"` memunculkan event untuk semua reaction.
  </Accordion>
</AccordionGroup>

## Tingkat reaction

Config `reactionLevel` per channel mengontrol seberapa luas agen menggunakan reaction. Nilainya biasanya `off`, `ack`, `minimal`, atau `extensive`.

- [Telegram reactionLevel](/id/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/id/channels/whatsapp#reactions) — `channels.whatsapp.reactionLevel`

Setel `reactionLevel` pada masing-masing channel untuk menyesuaikan seberapa aktif agen bereaksi terhadap pesan di setiap platform.

## Terkait

- [Agent Send](/tools/agent-send) — tool `message` yang mencakup `react`
- [Channels](/id/channels) — konfigurasi khusus channel
