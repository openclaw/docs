---
read_when:
    - Anda ingin mencari kontak/grup/id diri sendiri untuk sebuah channel
    - Anda sedang mengembangkan adaptor direktori saluran
summary: Referensi CLI untuk `openclaw directory` (diri sendiri, rekan, grup)
title: Direktori
x-i18n:
    generated_at: "2026-07-03T17:41:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d17f545ce0bbe23a6c1ba74e4d1b44b103cc985b52affe4b25fbc6a6d1121045
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Pencarian direktori untuk channel yang mendukungnya (kontak/peer, grup, dan "saya").

## Flag umum

- `--channel <name>`: id/alias channel (wajib saat beberapa channel dikonfigurasi; otomatis saat hanya satu yang dikonfigurasi)
- `--account <id>`: id akun (default: default channel)
- `--json`: keluarkan JSON

## Catatan

- `directory` dimaksudkan untuk membantu Anda menemukan ID yang dapat ditempelkan ke perintah lain (terutama `openclaw message send --target ...`).
- Untuk banyak channel, hasil didukung konfigurasi (allowlist / grup yang dikonfigurasi), bukan direktori penyedia langsung.
- Plugin channel yang terpasang tetap dapat tidak menyediakan dukungan direktori; dalam kasus itu, perintah melaporkan operasi direktori yang tidak didukung alih-alih memasang ulang Plugin.
- Output default adalah `id` (dan terkadang `name`) yang dipisahkan oleh tab; gunakan `--json` untuk skrip.

## Menggunakan hasil dengan `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Format ID (berdasarkan channel)

- WhatsApp: `+15551234567` (DM), `1234567890-1234567890@g.us` (grup), `120363123456789@newsletter` (target keluar Channel/Newsletter)
- Signal: alias yang dikonfigurasi diselesaikan menjadi target DM E.164/UUID atau target grup `group:<id>`
- Telegram: `@username` atau id chat numerik; grup menggunakan id numerik
- Slack: `user:U…` dan `channel:C…`
- Discord: `user:<id>` dan `channel:<id>`
- Matrix (plugin): `user:@user:server`, `room:!roomId:server`, atau `#alias:server`
- Microsoft Teams (plugin): `user:<id>` dan `conversation:<id>`
- Zalo (plugin): id pengguna (Bot API)
- Zalo Personal / `zalouser` (plugin): id utas (DM/grup) dari `zca` (`me`, `friend list`, `group list`)

## Diri sendiri ("saya")

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
