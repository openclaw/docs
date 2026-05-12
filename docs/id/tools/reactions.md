---
read_when:
    - Menangani reaksi di saluran apa pun
    - Memahami bagaimana reaksi emoji berbeda di berbagai platform
summary: Semantik alat reaksi di semua kanal yang didukung
title: Reaksi
x-i18n:
    generated_at: "2026-05-12T01:00:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 835c2a580f7f3e098ee956274de24191587929bfea7405a022cd68b35710c455
    source_path: tools/reactions.md
    workflow: 16
---

Agen dapat menambahkan dan menghapus reaksi emoji pada pesan menggunakan tool `message` dengan tindakan `react`. Perilaku reaksi berbeda-beda menurut saluran dan transport.

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
- Pada saluran yang mendukung reaksi status, `trackToolCalls: true` pada
  reaksi memungkinkan runtime menggunakan pesan yang diberi reaksi tersebut untuk reaksi
  progres tool berikutnya selama giliran yang sama.

## Perilaku saluran

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
    - Gunakan tool `feishu_reaction` dengan tindakan `add`, `remove`, dan `list`.
    - Add/remove memerlukan `emoji_type`; remove juga memerlukan `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Notifikasi reaksi masuk dikontrol oleh `channels.signal.reactionNotifications`: `"off"` menonaktifkannya, `"own"` (default) memancarkan peristiwa saat pengguna bereaksi terhadap pesan bot, dan `"all"` memancarkan peristiwa untuk semua reaksi.

  </Accordion>

  <Accordion title="iMessage">
    - Reaksi keluar adalah tapback iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize`, dan `question`).
    - Notifikasi tapback masuk dikontrol oleh `channels.imessage.reactionNotifications`: `"off"` menonaktifkannya, `"own"` (default) memancarkan peristiwa saat pengguna bereaksi terhadap pesan yang dibuat bot, dan `"all"` memancarkan peristiwa untuk semua tapback dari pengirim yang diotorisasi.

  </Accordion>
</AccordionGroup>

## Tingkat reaksi

Konfigurasi `reactionLevel` per saluran mengontrol seberapa luas agen menggunakan reaksi. Nilainya biasanya `off`, `ack`, `minimal`, atau `extensive`.

- [Telegram reactionLevel](/id/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/id/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Atur `reactionLevel` pada saluran individual untuk menyesuaikan seberapa aktif agen bereaksi terhadap pesan pada setiap platform.

## Terkait

- [Agent Send](/id/tools/agent-send) — tool `message` yang mencakup `react`
- [Saluran](/id/channels) — konfigurasi khusus saluran
