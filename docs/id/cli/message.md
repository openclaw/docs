---
read_when:
    - Menambahkan atau memodifikasi aksi CLI pesan
    - Mengubah perilaku saluran keluar
summary: Referensi CLI untuk `openclaw message` (kirim + tindakan saluran)
title: Pesan
x-i18n:
    generated_at: "2026-04-30T09:40:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43f14b3815d89c92a7503e620e2424f41a3f6b92e20e089504017305b19bace4
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Perintah keluar tunggal untuk mengirim pesan dan tindakan channel
(Discord/Google Chat/iMessage/Matrix/Mattermost (Plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Penggunaan

```
openclaw message <subcommand> [flags]
```

Pemilihan channel:

- `--channel` wajib jika lebih dari satu channel dikonfigurasi.
- Jika tepat satu channel dikonfigurasi, channel tersebut menjadi default.
- Nilai: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost memerlukan Plugin)
- `openclaw message` menyelesaikan channel yang dipilih ke Plugin pemiliknya ketika `--channel` atau target berawalan channel ada; jika tidak, perintah ini memuat Plugin channel yang dikonfigurasi untuk inferensi channel default.

Format target (`--target`):

- WhatsApp: E.164 atau JID grup
- Telegram: id chat atau `@username`
- Discord: `channel:<id>` atau `user:<id>` (atau penyebutan `<@id>`; id numerik mentah diperlakukan sebagai channel)
- Google Chat: `spaces/<spaceId>` atau `users/<userId>`
- Slack: `channel:<id>` atau `user:<id>` (id channel mentah diterima)
- Mattermost (Plugin): `channel:<id>`, `user:<id>`, atau `@username` (id polos diperlakukan sebagai channel)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>`, atau `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>`, atau `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server`, atau `#alias:server`
- Microsoft Teams: id percakapan (`19:...@thread.tacv2`) atau `conversation:<id>` atau `user:<aad-object-id>`

Pencarian nama:

- Untuk penyedia yang didukung (Discord/Slack/dll.), nama channel seperti `Help` atau `#help` diselesaikan melalui cache direktori.
- Saat cache tidak ditemukan, OpenClaw akan mencoba pencarian direktori langsung jika penyedia mendukungnya.

## Flag umum

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (channel atau pengguna target untuk send/poll/read/dll.)
- `--targets <name>` (ulang; hanya broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## Perilaku SecretRef

- `openclaw message` menyelesaikan SecretRef channel yang didukung sebelum menjalankan tindakan yang dipilih.
- Penyelesaian dibatasi ke target tindakan aktif jika memungkinkan:
  - berbatas channel ketika `--channel` ditetapkan (atau diinferensikan dari target berawalan seperti `discord:...`)
  - berbatas akun ketika `--account` ditetapkan (global channel + permukaan akun yang dipilih)
  - ketika `--account` dihilangkan, OpenClaw tidak memaksa cakupan SecretRef akun `default`
- SecretRef yang belum terselesaikan pada channel yang tidak terkait tidak memblokir tindakan pesan yang ditargetkan.
- Jika SecretRef channel/akun yang dipilih belum terselesaikan, perintah gagal tertutup untuk tindakan tersebut.

## Tindakan

### Inti

- `send`
  - Channel: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (Plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Wajib: `--target`, ditambah `--message`, `--media`, atau `--presentation`
  - Opsional: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Payload presentasi bersama: `--presentation` mengirim blok semantik (`text`, `context`, `divider`, `buttons`, `select`) yang dirender inti melalui kapabilitas yang dideklarasikan channel terpilih. Lihat [Presentasi Pesan](/id/plugins/message-presentation).
  - Preferensi pengiriman generik: `--delivery` menerima petunjuk pengiriman seperti `{ "pin": true }`; `--pin` adalah bentuk singkat untuk pengiriman tersemat jika channel mendukungnya.
  - Khusus Telegram: `--force-document` (mengirim gambar dan GIF sebagai dokumen untuk menghindari kompresi Telegram)
  - Khusus Telegram: `--thread-id` (id topik forum)
  - Khusus Slack: `--thread-id` (timestamp thread; `--reply-to` menggunakan field yang sama)
  - Telegram + Discord: `--silent`
  - Khusus WhatsApp: `--gif-playback`

- `poll`
  - Channel: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Wajib: `--target`, `--poll-question`, `--poll-option` (ulang)
  - Opsional: `--poll-multi`
  - Khusus Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Khusus Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Channel: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Wajib: `--message-id`, `--target`
  - Opsional: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Catatan: `--remove` memerlukan `--emoji` (hilangkan `--emoji` untuk menghapus reaksi sendiri jika didukung; lihat /tools/reactions)
  - Khusus WhatsApp: `--participant`, `--from-me`
  - Reaksi grup Signal: `--target-author` atau `--target-author-uuid` wajib

- `reactions`
  - Channel: Discord/Google Chat/Slack/Matrix
  - Wajib: `--message-id`, `--target`
  - Opsional: `--limit`

- `read`
  - Channel: Discord/Slack/Matrix
  - Wajib: `--target`
  - Opsional: `--limit`, `--before`, `--after`
  - Khusus Discord: `--around`

- `edit`
  - Channel: Discord/Slack/Matrix
  - Wajib: `--message-id`, `--message`, `--target`

- `delete`
  - Channel: Discord/Slack/Telegram/Matrix
  - Wajib: `--message-id`, `--target`

- `pin` / `unpin`
  - Channel: Discord/Slack/Matrix
  - Wajib: `--message-id`, `--target`

- `pins` (daftar)
  - Channel: Discord/Slack/Matrix
  - Wajib: `--target`

- `permissions`
  - Channel: Discord/Matrix
  - Wajib: `--target`
  - Khusus Matrix: tersedia ketika enkripsi Matrix diaktifkan dan tindakan verifikasi diizinkan

- `search`
  - Channel: Discord
  - Wajib: `--guild-id`, `--query`
  - Opsional: `--channel-id`, `--channel-ids` (ulang), `--author-id`, `--author-ids` (ulang), `--limit`

### Thread

- `thread create`
  - Channel: Discord
  - Wajib: `--thread-name`, `--target` (id channel)
  - Opsional: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Channel: Discord
  - Wajib: `--guild-id`
  - Opsional: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Channel: Discord
  - Wajib: `--target` (id thread), `--message`
  - Opsional: `--media`, `--reply-to`

### Emoji

- `emoji list`
  - Discord: `--guild-id`
  - Slack: tidak ada flag tambahan

- `emoji upload`
  - Channel: Discord
  - Wajib: `--guild-id`, `--emoji-name`, `--media`
  - Opsional: `--role-ids` (ulang)

### Stiker

- `sticker send`
  - Channel: Discord
  - Wajib: `--target`, `--sticker-id` (ulang)
  - Opsional: `--message`

- `sticker upload`
  - Channel: Discord
  - Wajib: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Peran / Channel / Anggota / Suara

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` untuk Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Event

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - Opsional: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderasi (Discord)

- `timeout`: `--guild-id`, `--user-id` (opsional `--duration-min` atau `--until`; hilangkan keduanya untuk menghapus timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` juga mendukung `--reason`

### Broadcast

- `broadcast`
  - Channel: channel apa pun yang dikonfigurasi; gunakan `--channel all` untuk menargetkan semua penyedia
  - Wajib: `--targets <target...>`
  - Opsional: `--message`, `--media`, `--dry-run`

## Contoh

Kirim balasan Discord:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Kirim pesan dengan tombol semantik:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

Inti merender payload `presentation` yang sama menjadi komponen Discord, blok Slack, tombol inline Telegram, props Mattermost, atau kartu Teams/Feishu bergantung pada kapabilitas channel. Lihat [Presentasi Pesan](/id/plugins/message-presentation) untuk kontrak lengkap dan aturan fallback.

Kirim payload presentasi yang lebih kaya:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

Buat polling Discord:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Buat polling Telegram (tutup otomatis dalam 2 menit):

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

Kirim pesan proaktif Teams:

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

Buat polling Teams:

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

Beri reaksi di Slack:

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

Beri reaksi di grup Signal:

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

Kirim tombol inline Telegram melalui presentasi generik:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

Kirim kartu Teams melalui presentasi generik:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Kirim gambar Telegram sebagai dokumen untuk menghindari kompresi:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## Terkait

- [Referensi CLI](/id/cli)
- [Kirim agent](/id/tools/agent-send)
