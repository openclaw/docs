---
read_when:
    - Anda ingin mencari ID kontak/grup/diri sendiri untuk sebuah channel
    - Anda sedang mengembangkan adapter direktori channel
summary: Referensi CLI untuk `openclaw directory` (self, peer, grup)
title: Direktori
x-i18n:
    generated_at: "2026-04-24T09:01:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: f63ed92469738501ae1f8f08aec3edf01d1f0f46008571ed38ccd9c77e5ba15e
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

Pencarian direktori untuk channel yang mendukungnya (kontak/peer, grup, dan “saya”).

## Flag umum

- `--channel <name>`: id/alias channel (wajib saat beberapa channel dikonfigurasi; otomatis saat hanya satu yang dikonfigurasi)
- `--account <id>`: id akun (default: channel default)
- `--json`: output JSON

## Catatan

- `directory` dimaksudkan untuk membantu Anda menemukan ID yang dapat ditempel ke perintah lain (terutama `openclaw message send --target ...`).
- Untuk banyak channel, hasil didukung oleh config (allowlist / grup yang dikonfigurasi) alih-alih direktori provider live.
- Output default adalah `id` (dan kadang `name`) yang dipisahkan dengan tab; gunakan `--json` untuk scripting.

## Menggunakan hasil dengan `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Format ID (per channel)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (grup)
- Telegram: `@username` atau id chat numerik; grup adalah id numerik
- Slack: `user:U…` dan `channel:C…`
- Discord: `user:<id>` dan `channel:<id>`
- Matrix (Plugin): `user:@user:server`, `room:!roomId:server`, atau `#alias:server`
- Microsoft Teams (Plugin): `user:<id>` dan `conversation:<id>`
- Zalo (Plugin): id pengguna (Bot API)
- Zalo Personal / `zalouser` (Plugin): id thread (DM/grup) dari `zca` (`me`, `friend list`, `group list`)

## Diri sendiri ("me")

```bash
openclaw directory self --channel zalouser
```

## Peer (kontak/pengguna)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## Grup

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## Terkait

- [Referensi CLI](/id/cli)
