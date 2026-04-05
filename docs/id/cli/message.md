---
read_when:
    - Menambahkan atau mengubah aksi CLI message
    - Mengubah perilaku saluran keluar
summary: Referensi CLI untuk `openclaw message` (kirim + aksi saluran)
title: message
x-i18n:
    generated_at: "2026-04-05T13:49:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: b70f36189d028d59db25cd8b39d7c67883eaea71bea2358ee6314eec6cd2fa51
    source_path: cli/message.md
    workflow: 15
---

# `openclaw message`

Perintah keluar tunggal untuk mengirim pesan dan aksi saluran
(Discord/Google Chat/iMessage/Matrix/Mattermost (plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Penggunaan

```
openclaw message <subcommand> [flags]
```

Pemilihan saluran:

- `--channel` wajib jika lebih dari satu saluran dikonfigurasi.
- Jika tepat satu saluran dikonfigurasi, saluran itu menjadi default.
- Nilai: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost memerlukan plugin)

Format target (`--target`):

- WhatsApp: E.164 atau JID grup
- Telegram: id chat atau `@username`
- Discord: `channel:<id>` atau `user:<id>` (atau mention `<@id>`; id numerik mentah diperlakukan sebagai saluran)
- Google Chat: `spaces/<spaceId>` atau `users/<userId>`
- Slack: `channel:<id>` atau `user:<id>` (id saluran mentah diterima)
- Mattermost (plugin): `channel:<id>`, `user:<id>`, atau `@username` (id polos diperlakukan sebagai saluran)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>`, atau `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>`, atau `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server`, atau `#alias:server`
- Microsoft Teams: id percakapan (`19:...@thread.tacv2`) atau `conversation:<id>` atau `user:<aad-object-id>`

Pencarian nama:

- Untuk provider yang didukung (Discord/Slack/dll), nama saluran seperti `Help` atau `#help` diselesaikan melalui cache direktori.
- Saat cache miss, OpenClaw akan mencoba pencarian direktori langsung jika provider mendukungnya.

## Flag umum

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (saluran target atau pengguna untuk kirim/poll/baca/dll)
- `--targets <name>` (ulangi; hanya siaran)
- `--json`
- `--dry-run`
- `--verbose`

## Perilaku SecretRef

- `openclaw message` menyelesaikan SecretRef saluran yang didukung sebelum menjalankan aksi yang dipilih.
- Penyelesaian dibatasi ke target aksi aktif bila memungkinkan:
  - cakupan saluran saat `--channel` diatur (atau disimpulkan dari target berawalan seperti `discord:...`)
  - cakupan akun saat `--account` diatur (global saluran + permukaan akun yang dipilih)
  - saat `--account` dihilangkan, OpenClaw tidak memaksakan cakupan SecretRef akun `default`
- SecretRef yang tidak terselesaikan pada saluran yang tidak terkait tidak memblokir aksi message yang ditargetkan.
- Jika SecretRef saluran/akun yang dipilih tidak terselesaikan, perintah gagal tertutup untuk aksi tersebut.

## Aksi

### Inti

- `send`
  - Saluran: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Wajib: `--target`, ditambah `--message` atau `--media`
  - Opsional: `--media`, `--interactive`, `--buttons`, `--components`, `--card`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Payload interaktif bersama: `--interactive` mengirim payload JSON interaktif native saluran jika didukung
  - Khusus Telegram: `--buttons` (memerlukan `channels.telegram.capabilities.inlineButtons` agar mengizinkannya)
  - Khusus Telegram: `--force-document` (kirim gambar dan GIF sebagai dokumen untuk menghindari kompresi Telegram)
  - Khusus Telegram: `--thread-id` (id topik forum)
  - Khusus Slack: `--thread-id` (timestamp thread; `--reply-to` menggunakan field yang sama)
  - Khusus Discord: payload JSON `--components`
  - Saluran Adaptive Card: payload JSON `--card` jika didukung
  - Telegram + Discord: `--silent`
  - Khusus WhatsApp: `--gif-playback`

- `poll`
  - Saluran: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Wajib: `--target`, `--poll-question`, `--poll-option` (ulangi)
  - Opsional: `--poll-multi`
  - Khusus Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Khusus Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Saluran: Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/Matrix
  - Wajib: `--message-id`, `--target`
  - Opsional: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Catatan: `--remove` memerlukan `--emoji` (hilangkan `--emoji` untuk menghapus reaksi sendiri jika didukung; lihat /tools/reactions)
  - Khusus WhatsApp: `--participant`, `--from-me`
  - Reaksi grup Signal: `--target-author` atau `--target-author-uuid` wajib

- `reactions`
  - Saluran: Discord/Google Chat/Slack/Matrix
  - Wajib: `--message-id`, `--target`
  - Opsional: `--limit`

- `read`
  - Saluran: Discord/Slack/Matrix
  - Wajib: `--target`
  - Opsional: `--limit`, `--before`, `--after`
  - Khusus Discord: `--around`

- `edit`
  - Saluran: Discord/Slack/Matrix
  - Wajib: `--message-id`, `--message`, `--target`

- `delete`
  - Saluran: Discord/Slack/Telegram/Matrix
  - Wajib: `--message-id`, `--target`

- `pin` / `unpin`
  - Saluran: Discord/Slack/Matrix
  - Wajib: `--message-id`, `--target`

- `pins` (daftar)
  - Saluran: Discord/Slack/Matrix
  - Wajib: `--target`

- `permissions`
  - Saluran: Discord/Matrix
  - Wajib: `--target`
  - Khusus Matrix: tersedia saat enkripsi Matrix diaktifkan dan aksi verifikasi diizinkan

- `search`
  - Saluran: Discord
  - Wajib: `--guild-id`, `--query`
  - Opsional: `--channel-id`, `--channel-ids` (ulangi), `--author-id`, `--author-ids` (ulangi), `--limit`

### Thread

- `thread create`
  - Saluran: Discord
  - Wajib: `--thread-name`, `--target` (id saluran)
  - Opsional: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Saluran: Discord
  - Wajib: `--guild-id`
  - Opsional: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Saluran: Discord
  - Wajib: `--target` (id thread), `--message`
  - Opsional: `--media`, `--reply-to`

### Emoji

- `emoji list`
  - Discord: `--guild-id`
  - Slack: tidak ada flag tambahan

- `emoji upload`
  - Saluran: Discord
  - Wajib: `--guild-id`, `--emoji-name`, `--media`
  - Opsional: `--role-ids` (ulangi)

### Stiker

- `sticker send`
  - Saluran: Discord
  - Wajib: `--target`, `--sticker-id` (ulangi)
  - Opsional: `--message`

- `sticker upload`
  - Saluran: Discord
  - Wajib: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Role / Saluran / Anggota / Suara

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

### Siaran

- `broadcast`
  - Saluran: saluran terkonfigurasi apa pun; gunakan `--channel all` untuk menargetkan semua provider
  - Wajib: `--targets <target...>`
  - Opsional: `--message`, `--media`, `--dry-run`

## Contoh

Kirim balasan Discord:

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

Kirim pesan Discord dengan komponen:

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --components '{"text":"Choose a path","blocks":[{"type":"actions","buttons":[{"label":"Approve","style":"success"},{"label":"Decline","style":"danger"}]}]}'
```

Lihat [Komponen Discord](/id/channels/discord#interactive-components) untuk skema lengkapnya.

Kirim payload interaktif bersama:

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --interactive '{"text":"Choose a path","blocks":[{"type":"actions","buttons":[{"label":"Approve"},{"label":"Decline"}]}]}'
```

Buat poll Discord:

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

Buat poll Telegram (tutup otomatis dalam 2 menit):

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

Buat poll Teams:

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

Kirim tombol inline Telegram:

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --buttons '[ [{"text":"Yes","callback_data":"cmd:yes"}], [{"text":"No","callback_data":"cmd:no"}] ]'
```

Kirim Adaptive Card Teams:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Status update"}]}'
```

Kirim gambar Telegram sebagai dokumen untuk menghindari kompresi:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```
