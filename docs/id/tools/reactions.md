---
read_when:
    - Menangani reaksi di saluran apa pun
    - Memahami bagaimana reaksi emoji berbeda di berbagai platform
summary: Semantik alat reaksi di semua saluran yang didukung
title: Reaksi
x-i18n:
    generated_at: "2026-05-03T21:38:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99008cdaf1fa7462bbe72066be7c404880df237a79d3deba01bffe00083c1e34
    source_path: tools/reactions.md
    workflow: 16
---

Agen dapat menambahkan dan menghapus reaksi emoji pada pesan menggunakan alat `message`
dengan tindakan `react`. Perilaku reaksi berbeda-beda menurut saluran dan transport.

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
  reaksi memungkinkan runtime menggunakan pesan yang direaksikan tersebut untuk reaksi
  progres alat berikutnya selama giliran yang sama.

## Perilaku saluran

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
    - `remove: true` dipetakan ke emoji kosong secara internal (tetap memerlukan `emoji` dalam pemanggilan alat).

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Memerlukan `emoji` yang tidak kosong.
    - `remove: true` menghapus reaksi emoji tertentu tersebut.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Gunakan alat `feishu_reaction` dengan tindakan `add`, `remove`, dan `list`.
    - Tambah/hapus memerlukan `emoji_type`; hapus juga memerlukan `reaction_id`.

  </Accordion>

  <Accordion title="Signal">
    - Notifikasi reaksi masuk dikendalikan oleh `channels.signal.reactionNotifications`: `"off"` menonaktifkannya, `"own"` (default) memancarkan peristiwa saat pengguna bereaksi terhadap pesan bot, dan `"all"` memancarkan peristiwa untuk semua reaksi.

  </Accordion>
</AccordionGroup>

## Tingkat reaksi

Konfigurasi `reactionLevel` per saluran mengontrol seberapa luas agen menggunakan reaksi. Nilai biasanya `off`, `ack`, `minimal`, atau `extensive`.

- [Telegram reactionLevel](/id/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/id/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

Atur `reactionLevel` pada masing-masing saluran untuk menyesuaikan seberapa aktif agen bereaksi terhadap pesan di setiap platform.

## Terkait

- [Agent Send](/id/tools/agent-send) — alat `message` yang menyertakan `react`
- [Saluran](/id/channels) — konfigurasi khusus saluran
