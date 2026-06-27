---
read_when:
    - Menambahkan atau memodifikasi tindakan CLI pesan
    - Mengubah perilaku saluran keluar
summary: Referensi CLI untuk `openclaw message` (kirim + tindakan channel)
title: Pesan
x-i18n:
    generated_at: "2026-06-27T17:19:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a8a716435313efa41a13ee5c6392eb2e4cfca2ede3e4690b157d26d077f7d56
    source_path: cli/message.md
    workflow: 16
---

# `openclaw message`

Perintah keluar tunggal untuk mengirim pesan dan tindakan kanal
(Discord/Google Chat/iMessage/Matrix/Mattermost (plugin)/Microsoft Teams/Signal/Slack/Telegram/WhatsApp).

## Penggunaan

```
openclaw message <subcommand> [flags]
```

Pemilihan kanal:

- `--channel` wajib jika lebih dari satu kanal dikonfigurasi.
- Jika tepat satu kanal dikonfigurasi, kanal itu menjadi default.
- Nilai: `discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp` (Mattermost memerlukan plugin)
- `openclaw message` menyelesaikan kanal yang dipilih ke plugin pemiliknya saat `--channel` atau target berprefiks kanal tersedia; jika tidak, perintah ini memuat plugin kanal yang dikonfigurasi untuk inferensi kanal default.

Format target (`--target`):

- WhatsApp: E.164, JID grup, atau JID Kanal/Buletin WhatsApp (`...@newsletter`)
- Telegram: id chat, `@username`, atau target topik forum (`-1001234567890:topic:42`, atau `--thread-id 42`)
- Discord: `channel:<id>` atau `user:<id>` (atau sebutan `<@id>`; id numerik mentah diperlakukan sebagai kanal)
- Google Chat: `spaces/<spaceId>` atau `users/<userId>`
- Slack: `channel:<id>` atau `user:<id>` (id kanal mentah diterima)
- Mattermost (plugin): `channel:<id>`, `user:<id>`, atau `@username` (id polos diperlakukan sebagai kanal)
- Signal: `+E.164`, `group:<id>`, `signal:+E.164`, `signal:group:<id>`, atau `username:<name>`/`u:<name>`
- iMessage: handle, `chat_id:<id>`, `chat_guid:<guid>`, atau `chat_identifier:<id>`
- Matrix: `@user:server`, `!room:server`, atau `#alias:server`
- Microsoft Teams: id percakapan (`19:...@thread.tacv2`) atau `conversation:<id>` atau `user:<aad-object-id>`

Pencarian nama:

- Untuk penyedia yang didukung (Discord/Slack/dll.), nama kanal seperti `Help` atau `#help` diselesaikan melalui cache direktori.
- Saat cache tidak ditemukan, OpenClaw akan mencoba pencarian direktori langsung jika penyedia mendukungnya.

## Flag umum

- `--channel <name>`
- `--account <id>`
- `--target <dest>` (kanal target atau pengguna untuk send/poll/read/dll.)
- `--targets <name>` (ulang; hanya broadcast)
- `--json`
- `--dry-run`
- `--verbose`

## Perilaku SecretRef

- `openclaw message` menyelesaikan SecretRef kanal yang didukung sebelum menjalankan tindakan yang dipilih.
- Penyelesaian dibatasi ke target tindakan aktif jika memungkinkan:
  - cakupan kanal saat `--channel` ditetapkan (atau diinferensikan dari target berprefiks seperti `discord:...`)
  - cakupan akun saat `--account` ditetapkan (global kanal + permukaan akun yang dipilih)
  - saat `--account` dihilangkan, OpenClaw tidak memaksa cakupan SecretRef akun `default`
- SecretRef yang belum terselesaikan pada kanal yang tidak terkait tidak memblokir tindakan pesan tertarget.
- Jika SecretRef kanal/akun yang dipilih belum terselesaikan, perintah gagal tertutup untuk tindakan tersebut.

## Tindakan

### Inti

- `send`
  - Kanal: WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost (plugin)/Signal/iMessage/Matrix/Microsoft Teams
  - Wajib: `--target`, ditambah `--message`, `--media`, atau `--presentation`
  - Opsional: `--media`, `--presentation`, `--delivery`, `--pin`, `--reply-to`, `--thread-id`, `--gif-playback`, `--force-document`, `--silent`
  - Payload presentasi bersama: `--presentation` mengirim blok semantik (`text`, `context`, `divider`, `buttons`, `select`) yang dirender inti melalui kapabilitas yang dideklarasikan kanal terpilih. Lihat [Presentasi Pesan](/id/plugins/message-presentation).
  - Preferensi pengiriman generik: `--delivery` menerima petunjuk pengiriman seperti `{ "pin": true }`; `--pin` adalah singkatan untuk pengiriman yang disematkan saat kanal mendukungnya.
  - Telegram + WhatsApp: `--force-document` (mengirim gambar, GIF, dan video sebagai dokumen untuk menghindari kompresi kanal)
  - Khusus Telegram: `--thread-id` (id topik forum)
  - Khusus Slack: `--thread-id` (timestamp thread; `--reply-to` menggunakan bidang yang sama)
  - Telegram + Discord: `--silent`
  - Khusus WhatsApp: `--gif-playback`; Kanal/Buletin WhatsApp dialamatkan dengan JID native `@newsletter` mereka.

- `poll`
  - Kanal: WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - Wajib: `--target`, `--poll-question`, `--poll-option` (ulang)
  - Opsional: `--poll-multi`
  - Khusus Discord: `--poll-duration-hours`, `--silent`, `--message`
  - Khusus Telegram: `--poll-duration-seconds` (5-600), `--silent`, `--poll-anonymous` / `--poll-public`, `--thread-id`

- `react`
  - Kanal: Discord/Google Chat/Matrix/Nextcloud Talk/Signal/Slack/Telegram/WhatsApp
  - Wajib: `--message-id`, `--target`
  - Opsional: `--emoji`, `--remove`, `--participant`, `--from-me`, `--target-author`, `--target-author-uuid`
  - Catatan: `--remove` memerlukan `--emoji` (hilangkan `--emoji` untuk menghapus reaksi sendiri jika didukung; lihat /tools/reactions)
  - Khusus WhatsApp: `--participant`, `--from-me`
  - Reaksi grup Signal: `--target-author` atau `--target-author-uuid` wajib
  - Nextcloud Talk: hanya menambahkan reaksi; `--remove` ditolak dengan galat yang jelas (lihat /tools/reactions)

- `reactions`
  - Kanal: Discord/Google Chat/Slack/Matrix
  - Wajib: `--message-id`, `--target`
  - Opsional: `--limit`

- `read`
  - Kanal: Discord/Slack/Matrix
  - Wajib: `--target`
  - Opsional: `--limit`, `--message-id`, `--before`, `--after`
  - Khusus Slack: `--message-id` membaca timestamp pesan Slack tertentu; gabungkan dengan `--thread-id` untuk membaca balasan thread yang persis.
  - Khusus Discord: `--around`

- `edit`
  - Kanal: Discord/Slack/Matrix
  - Wajib: `--message-id`, `--message`, `--target`

- `delete`
  - Kanal: Discord/Slack/Telegram/Matrix
  - Wajib: `--message-id`, `--target`

- `pin` / `unpin`
  - Kanal: Discord/Slack/Matrix
  - Wajib: `--message-id`, `--target`

- `pins` (daftar)
  - Kanal: Discord/Slack/Matrix
  - Wajib: `--target`

- `permissions`
  - Kanal: Discord/Matrix
  - Wajib: `--target`
  - Khusus Matrix: tersedia saat enkripsi Matrix diaktifkan dan tindakan verifikasi diizinkan

- `search`
  - Kanal: Discord
  - Wajib: `--guild-id`, `--query`
  - Opsional: `--channel-id`, `--channel-ids` (ulang), `--author-id`, `--author-ids` (ulang), `--limit`

### Thread

- `thread create`
  - Kanal: Discord
  - Wajib: `--thread-name`, `--target` (id kanal)
  - Opsional: `--message-id`, `--message`, `--auto-archive-min`

- `thread list`
  - Kanal: Discord
  - Wajib: `--guild-id`
  - Opsional: `--channel-id`, `--include-archived`, `--before`, `--limit`

- `thread reply`
  - Kanal: Discord
  - Wajib: `--target` (id thread), `--message`
  - Opsional: `--media`, `--reply-to`

### Emoji

- `emoji list`
  - Discord: `--guild-id`
  - Slack: tidak ada flag tambahan

- `emoji upload`
  - Kanal: Discord
  - Wajib: `--guild-id`, `--emoji-name`, `--media`
  - Opsional: `--role-ids` (ulang)

### Stiker

- `sticker send`
  - Kanal: Discord
  - Wajib: `--target`, `--sticker-id` (ulang)
  - Opsional: `--message`

- `sticker upload`
  - Kanal: Discord
  - Wajib: `--guild-id`, `--sticker-name`, `--sticker-desc`, `--sticker-tags`, `--media`

### Peran / Kanal / Anggota / Suara

- `role info` (Discord): `--guild-id`
- `role add` / `role remove` (Discord): `--guild-id`, `--user-id`, `--role-id`
- `channel info` (Discord): `--target`
- `channel list` (Discord): `--guild-id`
- `member info` (Discord/Slack): `--user-id` (+ `--guild-id` untuk Discord)
- `voice status` (Discord): `--guild-id`, `--user-id`

### Peristiwa

- `event list` (Discord): `--guild-id`
- `event create` (Discord): `--guild-id`, `--event-name`, `--start-time`
  - Opsional: `--end-time`, `--desc`, `--channel-id`, `--location`, `--event-type`

### Moderasi (Discord)

- `timeout`: `--guild-id`, `--user-id` (`--duration-min` atau `--until` opsional; hilangkan keduanya untuk menghapus timeout)
- `kick`: `--guild-id`, `--user-id` (+ `--reason`)
- `ban`: `--guild-id`, `--user-id` (+ `--delete-days`, `--reason`)
  - `timeout` juga mendukung `--reason`

### Broadcast

- `broadcast`
  - Saluran: saluran apa pun yang dikonfigurasi; gunakan `--channel all` untuk menargetkan semua provider
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

Core merender payload `presentation` yang sama menjadi komponen Discord, blok Slack, tombol inline Telegram, props Mattermost, atau kartu Teams/Feishu bergantung pada kapabilitas saluran. Lihat [Presentasi Pesan](/id/plugins/message-presentation) untuk kontrak lengkap dan aturan fallback.

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

Kirim tombol Mini App Telegram melalui presentasi generik:

```
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

Tombol web app Telegram hanya didukung dalam chat privat antara pengguna dan
bot. Payload JSON lama yang menggunakan `web_app` masih dapat di-parse, tetapi `webApp` adalah
bidang presentasi kanonis.

Kirim kartu Teams melalui presentasi generik:

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

Kirim gambar Telegram atau WhatsApp sebagai dokumen untuk menghindari kompresi:

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## Terkait

- [Referensi CLI](/id/cli)
- [Pengiriman agen](/id/tools/agent-send)
