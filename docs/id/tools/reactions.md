---
read_when:
    - Menangani reaksi di saluran mana pun
    - Memahami perbedaan reaksi emoji di berbagai platform
summary: Semantik alat reaksi di semua kanal yang didukung
title: Reaksi
x-i18n:
    generated_at: "2026-07-12T14:42:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e148a93edbcfbe997075f6e9e191667ec257f76fa48162688fd1f333479661f0
    source_path: tools/reactions.md
    workflow: 16
---

Agen menambahkan dan menghapus reaksi emoji dengan tindakan `react` dari alat `message`. Perilakunya berbeda-beda menurut saluran.

## Cara kerjanya

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- `emoji` wajib diisi saat menambahkan reaksi.
- Atur `emoji` menjadi string kosong (`""`) untuk menghapus reaksi bot pada saluran yang mendukungnya.
- Atur `remove: true` untuk menghapus satu emoji tertentu (memerlukan `emoji` yang tidak kosong).
- Pada saluran dengan reaksi status, `trackToolCalls: true` pada suatu reaksi memungkinkan runtime menggunakan kembali pesan yang diberi reaksi tersebut untuk reaksi progres alat berikutnya selama giliran yang sama.

## Perilaku saluran

<AccordionGroup>
  <Accordion title="Discord dan Slack">
    - `emoji` kosong menghapus semua reaksi bot pada pesan.
    - `remove: true` hanya menghapus emoji yang ditentukan.

  </Accordion>

  <Accordion title="Nextcloud Talk">
    - Hanya dapat menambahkan reaksi: `emoji` wajib diisi dan tidak boleh kosong.
    - Penghapusan reaksi belum terhubung ke panggilan penghapusan; `remove: true` ditolak dengan galat eksplisit alih-alih tidak melakukan apa pun secara diam-diam.
    - Memerlukan bot Talk yang terdaftar dengan fitur `reaction` (lihat [dokumentasi saluran Nextcloud Talk](/id/channels/nextcloud-talk)).

  </Accordion>

  <Accordion title="Telegram">
    - `emoji` kosong menghapus reaksi bot.
    - `remove: true` juga menghapus reaksi, tetapi tetap memerlukan `emoji` yang tidak kosong untuk validasi alat.

  </Accordion>

  <Accordion title="WhatsApp">
    - `emoji` kosong menghapus reaksi bot.
    - `remove: true` dipetakan secara internal ke emoji kosong (tetap memerlukan `emoji` dalam panggilan alat).
    - WhatsApp memiliki satu slot reaksi bot per pesan; mengirim reaksi baru akan menggantikannya, bukan menumpuk beberapa emoji.

  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - Memerlukan `emoji` yang tidak kosong untuk penambahan maupun penghapusan.
    - `remove: true` menghapus reaksi emoji tertentu tersebut.

  </Accordion>

  <Accordion title="Feishu/Lark">
    - Menggunakan tindakan `react` yang sama seperti saluran lain (menambah/menghapus/mencantumkan melalui ID reaksi pesan), bukan alat terpisah.
    - Penambahan memerlukan `emoji` yang tidak kosong (dipetakan ke `emoji_type` Feishu, misalnya `SMILE`, `THUMBSUP`, `HEART`).
    - `remove: true` memerlukan `emoji` yang tidak kosong dan menghapus reaksi milik bot yang cocok dengan jenis emoji tersebut.
    - `emoji` kosong dengan `clearAll: true` menghapus semua reaksi bot pada pesan.

  </Accordion>

  <Accordion title="Signal">
    - Notifikasi reaksi masuk dikendalikan oleh `channels.signal.reactionNotifications`: `"off"` menonaktifkannya, `"own"` (bawaan) memancarkan peristiwa ketika pengguna bereaksi terhadap pesan bot, `"all"` memancarkan peristiwa untuk semua reaksi, dan `"allowlist"` hanya memancarkan peristiwa untuk pengirim dalam `channels.signal.reactionAllowlist`.

  </Accordion>

  <Accordion title="iMessage">
    - Reaksi keluar adalah tapback iMessage (`love`, `like`, `dislike`, `laugh`, `emphasize`, dan `question`); `emoji` harus dapat dipetakan ke salah satu jenis tersebut untuk menambahkan reaksi.
    - `remove: true` tanpa jenis tapback yang dikenali akan menghapus semua jenis tapback; dengan jenis yang dikenali, hanya jenis tersebut yang dihapus.

  </Accordion>
</AccordionGroup>

## Tingkat reaksi

`reactionLevel` per saluran membatasi seberapa sering agen mengirim reaksinya sendiri. Nilainya: `off`, `ack`, `minimal`, atau `extensive`.

- [Notifikasi reaksi Telegram](/id/channels/telegram#feature-reference) - `channels.telegram.reactionLevel` (bawaan `minimal`)
- [Tingkat reaksi WhatsApp](/id/channels/whatsapp#reaction-level) - `channels.whatsapp.reactionLevel` (bawaan `minimal`)
- [Reaksi Signal](/id/channels/signal#reactions-message-tool) - `channels.signal.reactionLevel` (bawaan `minimal`)

## Terkait

- [Pengiriman Agen](/id/tools/agent-send) - alat `message` yang mencakup `react`
- [Saluran](/id/channels) - konfigurasi khusus saluran
