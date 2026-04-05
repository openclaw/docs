---
read_when:
    - Anda ingin mencari ID kontak/grup/diri sendiri untuk sebuah channel
    - Anda sedang mengembangkan adapter direktori channel
summary: Referensi CLI untuk `openclaw directory` (diri sendiri, peer, grup)
title: directory
x-i18n:
    generated_at: "2026-04-05T13:45:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a81a037e0a33f77c24b1adabbc4be16ed4d03c419873f3cbdd63f2ce84a1064
    source_path: cli/directory.md
    workflow: 15
---

# `openclaw directory`

Lookup direktori untuk channel yang mendukungnya (kontak/peer, grup, dan “saya”).

## Flag umum

- `--channel <name>`: id/alias channel (wajib saat beberapa channel dikonfigurasi; otomatis saat hanya satu yang dikonfigurasi)
- `--account <id>`: id akun (default: channel default)
- `--json`: output JSON

## Catatan

- `directory` dimaksudkan untuk membantu Anda menemukan ID yang dapat ditempel ke perintah lain (terutama `openclaw message send --target ...`).
- Untuk banyak channel, hasil didukung config (allowlist / grup yang dikonfigurasi) alih-alih direktori provider langsung.
- Output default adalah `id` (dan kadang `name`) yang dipisahkan oleh tab; gunakan `--json` untuk skrip.

## Menggunakan hasil dengan `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Format ID (berdasarkan channel)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (grup)
- Telegram: `@username` atau id chat numerik; grup adalah id numerik
- Discord: `user:<id>` dan `channel:<id>`
- Matrix (plugin): `user:@user:server`, `room:!roomId:server`, atau `#alias:server`
- Microsoft Teams (plugin): `user:<id>` dan `conversation:<id>`
- Zalo (plugin): id pengguna (Bot API)
- Zalo Personal / `zalouser` (plugin): id thread (DM/grup) dari `zca` (`me`, `friend list`, `group list`)

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
