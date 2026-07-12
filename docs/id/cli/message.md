---
read_when:
    - Menambahkan atau memodifikasi tindakan CLI pesan
    - Mengubah perilaku kanal keluar
summary: Referensi CLI untuk `openclaw message` (pengiriman + tindakan saluran)
title: Pesan
x-i18n:
    generated_at: "2026-07-12T14:02:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2d1cca9be7cfa7625cac3e440ecb5847d9fab9c545c9267a41a2f99c26c514b
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Perintah keluar tunggal untuk mengirim pesan dan tindakan saluran melalui
Discord, Google Chat, iMessage, Matrix, Mattermost (Plugin), Microsoft Teams,
Signal, Slack, Telegram, dan WhatsApp.

```bash
openclaw message <subcommand> [flags]
```

## Pemilihan saluran

- `--channel <name>` wajib digunakan jika lebih dari satu saluran dikonfigurasi;
  jika tepat satu saluran dikonfigurasi, saluran tersebut menjadi bawaan.
- Nilai: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`
  (Mattermost memerlukan Plugin).
- Target dengan prefiks saluran (misalnya `discord:channel:123`) menentukan
  Plugin pemilik tanpa `--channel` eksplisit.

## Format target (`-t, --target`)

| Saluran             | Format                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Discord             | `channel:<id>`, `user:<id>`, penyebutan `<@id>`, atau ID numerik polos (diperlakukan sebagai ID saluran)                 |
| Google Chat         | `spaces/<spaceId>` atau `users/<userId>`                                                                                 |
| iMessage            | alamat, `chat_id:<id>`, `chat_guid:<guid>`, atau `chat_identifier:<id>`                                                  |
| Mattermost (Plugin) | `channel:<id>`, `user:<id>`, `@username`, atau ID polos (diperlakukan sebagai saluran)                                   |
| Matrix              | `@user:server`, `!room:server`, atau `#alias:server`                                                                      |
| Microsoft Teams     | `conversation:<id>` (`19:...@thread.tacv2`), ID percakapan polos, atau `user:<aad-object-id>`                            |
| Signal              | `+E.164`, `group:<id>`, `uuid:<id>`, `username:<name>`/`u:<name>`, atau salah satunya dengan prefiks `signal:`           |
| Slack               | `channel:<id>` atau `user:<id>` (ID polos diperlakukan sebagai saluran)                                                  |
| Telegram            | ID obrolan, `@username`, atau target topik forum: `<chatId>:topic:<topicId>` (atau `--thread-id <topicId>`)              |
| WhatsApp            | E.164, JID grup (`...@g.us`), atau JID Saluran/Buletin (`...@newsletter`)                                                |

Pencarian nama saluran: untuk penyedia yang memiliki direktori
(Discord/Slack/dan sebagainya), nama seperti `Help` atau `#help` ditentukan
melalui singgahan direktori. Jika tidak ditemukan dalam singgahan, pencarian
direktori langsung digunakan apabila didukung oleh penyedia.

## Flag umum

Setiap tindakan menerima: `--channel <name>`, `--account <id>`, `--json`,
`--dry-run`, `--verbose`. Tindakan yang memerlukan tujuan juga menerima
`-t, --target <dest>`.

## Resolusi SecretRef

`openclaw message` menyelesaikan SecretRef saluran sebelum menjalankan tindakan,
dengan cakupan sesempit mungkin:

- cakupan saluran ketika `--channel` ditetapkan (atau disimpulkan dari target berprefiks)
- cakupan akun ketika `--account` juga ditetapkan
- semua saluran yang dikonfigurasi ketika keduanya tidak ditetapkan

SecretRef yang belum terselesaikan pada saluran yang tidak terkait tidak pernah
memblokir tindakan bertarget; SecretRef yang belum terselesaikan pada
saluran/akun terpilih menyebabkan tindakan gagal secara tertutup.

## Tindakan

### Inti

| Tindakan        | Saluran                                                                                                         | Wajib                                                          | Catatan                                                                                                                                                                                                                                                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `send`          | Discord, Google Chat, iMessage, Matrix, Mattermost (Plugin), Microsoft Teams, Signal, Slack, Telegram, WhatsApp | `--target`, ditambah salah satu `--message`/`--media`/`--presentation` | Lihat [Kirim](#send) di bawah.                                                                                                                                                                                                                                                                                                                   |
| `poll`          | Discord, Matrix, Microsoft Teams, Telegram, WhatsApp                                                            | `--target`, `--poll-question`, `--poll-option` (berulang)      | Lihat [Jajak pendapat](#poll) di bawah.                                                                                                                                                                                                                                                                                                          |
| `react`         | Discord, Matrix, Nextcloud Talk, Signal, Slack, Telegram, WhatsApp                                              | `--message-id`, `--target`                                     | `--emoji`, `--remove` (memerlukan `--emoji`; hilangkan untuk menghapus reaksi sendiri jika didukung, lihat [Reaksi](/id/tools/reactions)). WhatsApp: `--participant`, `--from-me`. Reaksi grup Signal memerlukan `--target-author` atau `--target-author-uuid`. Nextcloud Talk hanya menambahkan reaksi; `--remove` menghasilkan galat. |
| `reactions`     | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `--limit`.                                                                                                                                                                                                                                                                                                                                      |
| `read`          | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`, `--message-id`, `--before`, `--after`. Discord: `--around`, `--include-thread`. Slack: `--message-id` membaca stempel waktu tertentu; gabungkan dengan `--thread-id` untuk balasan utas yang tepat.                                                                                                                                       |
| `edit`          | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--message`, `--target`                        | Utas forum Telegram menggunakan `--thread-id`.                                                                                                                                                                                                                                                                                                  |
| `delete`        | Discord, Matrix, Microsoft Teams, Slack, Telegram                                                               | `--message-id`, `--target`                                     |                                                                                                                                                                                                                                                                                                                                                 |
| `pin` / `unpin` | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--message-id`, `--target`                                     | `unpin` juga menerima `--pinned-message-id` (Microsoft Teams: ID sumber daya sematkan/daftar sematan, bukan ID pesan obrolan).                                                                                                                                                                                                                   |
| `pins` (daftar) | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--target`                                                     | `--limit`.                                                                                                                                                                                                                                                                                                                                      |
| `permissions`   | Discord, Matrix                                                                                                 | `--target`                                                     | Matrix: hanya tersedia ketika enkripsi diaktifkan dan tindakan verifikasi diizinkan.                                                                                                                                                                                                                                                            |
| `search`        | Discord                                                                                                         | `--guild-id`, `--query`                                        | `--channel-id`, `--channel-ids` (berulang), `--author-id`, `--author-ids` (berulang), `--limit`.                                                                                                                                                                                                                                                 |
| `member info`   | Discord, Matrix, Microsoft Teams, Slack                                                                         | `--user-id`                                                    | `--guild-id` (Discord).                                                                                                                                                                                                                                                                                                                         |

### Kirim

```bash
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

- `--media <path-or-url>`: lampirkan gambar/audio/video/dokumen (jalur lokal atau
  URL).
- `--presentation <json>`: muatan bersama dengan blok `text`, `context`,
  `divider`, `chart`, `table`, `buttons`, dan `select`, yang dirender sesuai
  kemampuan setiap saluran. Lihat [Presentasi Pesan](/id/plugins/message-presentation).
- `--delivery <json>`: preferensi pengiriman umum, misalnya `{"pin":
true}`. `--pin` merupakan bentuk singkat untuk pengiriman yang disematkan jika
  didukung oleh saluran.
- `--reply-to <id>`, `--thread-id <id>` (topik forum Telegram; stempel waktu
  utas Slack, bidang yang sama dengan `--reply-to`).
- `--force-document` (Telegram, WhatsApp): kirim gambar/GIF/video sebagai
  dokumen untuk menghindari kompresi saluran.
- `--silent` (Telegram, Discord): kirim tanpa notifikasi.
- `--gif-playback` (khusus WhatsApp): perlakukan media video sebagai pemutaran GIF.

```bash
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Slack merender blok bagan yang didukung secara native; saluran lain menerima
data yang sama sebagai teks yang mudah dibaca:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"blocks":[{"type":"chart","chartType":"bar","title":"Quarterly revenue","categories":["Q1","Q2"],"series":[{"name":"Revenue","values":[120,145]}],"xLabel":"Quarter"}]}'
```

Slack juga merender blok tabel eksplisit secara native. Kanal lain menerima
keterangan dan setiap baris sebagai teks deterministik:

```bash
openclaw message send --channel slack --target channel:C123 \
  --presentation '{"title":"Pipeline report","blocks":[{"type":"table","caption":"Open pipeline","headers":["Account","Stage","ARR"],"rows":[["Acme","Won",125000],["Globex","Review",82000]],"rowHeaderColumnIndex":0}]}'
```

Tombol Mini App Telegram menggunakan `webApp` (`web_app` masih dapat diurai untuk JSON
lama) dan hanya dirender dalam obrolan privat antara pengguna dan bot:

```bash
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

### Jajak pendapat

```bash
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

- `--poll-option <choice>`: ulangi 2-12 kali.
- `--poll-multi`: izinkan beberapa pilihan.
- Discord: `--poll-duration-hours`, `--silent`, `--message`.
- Telegram: `--poll-duration-seconds <n>` (5-600), `--silent`,
  `--poll-anonymous` / `--poll-public`, `--thread-id`.

```bash
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

```bash
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

### Utas

- `thread create`: kanal Discord. Wajib: `--thread-name`, `--target`
  (ID kanal). Opsional: `--message-id`, `--message`, `--auto-archive-min`.
- `thread list`: kanal Discord. Wajib: `--guild-id`. Opsional:
  `--channel-id`, `--include-archived`, `--before`, `--limit`.
- `thread reply`: kanal Discord. Wajib: `--target` (ID utas),
  `--message`. Opsional: `--media`, `--reply-to`.

### Emoji

- `emoji list`: Discord (`--guild-id`), Slack (tanpa flag tambahan).
- `emoji upload`: Discord. Wajib: `--guild-id`, `--emoji-name`, `--media`.
  Opsional: `--role-ids` (ulangi).

### Stiker

- `sticker send`: Discord. Wajib: `--target`, `--sticker-id` (ulangi).
  Opsional: `--message`.
- `sticker upload`: Discord. Wajib: `--guild-id`, `--sticker-name`,
  `--sticker-desc`, `--sticker-tags`, `--media`.

### Peran, kanal, suara, acara (Discord)

- `role info`: `--guild-id`.
- `role add` / `role remove`: `--guild-id`, `--user-id`, `--role-id`.
- `channel info`: `--target`.
- `channel list`: `--guild-id`.
- `voice status`: `--guild-id`, `--user-id`.
- `event list`: `--guild-id`.
- `event create`: wajib `--guild-id`, `--event-name`, `--start-time`;
  opsional `--end-time`, `--desc`, `--channel-id`, `--location`,
  `--event-type`, `--image <url-or-path>`.

### Moderasi (Discord)

- `timeout`: `--guild-id`, `--user-id`; opsional `--duration-min` atau
  `--until` (hilangkan keduanya untuk menghapus batas waktu), `--reason`.
- `kick`: `--guild-id`, `--user-id`, `--reason`.
- `ban`: `--guild-id`, `--user-id`, `--delete-days`, `--reason`.

### Siaran

```bash
openclaw message broadcast --targets <target...> [--channel all] [--message <text>] [--media <url>] [--dry-run]
```

Mengirim satu muatan ke beberapa target. `--targets` menerima daftar yang dipisahkan
spasi. Gunakan `--channel all` untuk menargetkan setiap penyedia yang dikonfigurasi.

## Terkait

- [Referensi CLI](/id/cli)
- [Pengiriman agen](/id/tools/agent-send)
- [Presentasi Pesan](/id/plugins/message-presentation)
