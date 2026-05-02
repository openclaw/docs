---
read_when:
    - Anda ingin mencari ID kontak/grup/diri sendiri untuk sebuah saluran
    - Anda sedang mengembangkan adaptor direktori saluran
summary: Referensi CLI untuk `openclaw directory` (diri sendiri, rekan, grup)
title: Direktori
x-i18n:
    generated_at: "2026-05-02T09:15:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcd0be284c0ec1aa347084d84f7001f1e2f47977ec5198025ba303297858aaab
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Pencarian direktori untuk saluran yang mendukungnya (kontak/peer, grup, dan “saya”).

## Flag umum

- `--channel <name>`: id/alias saluran (wajib ketika beberapa saluran dikonfigurasi; otomatis ketika hanya satu yang dikonfigurasi)
- `--account <id>`: id akun (default: default saluran)
- `--json`: keluarkan JSON

## Catatan

- `directory` dimaksudkan untuk membantu Anda menemukan ID yang dapat ditempelkan ke perintah lain (terutama `openclaw message send --target ...`).
- Untuk banyak saluran, hasil didukung konfigurasi (daftar yang diizinkan / grup yang dikonfigurasi), bukan direktori penyedia langsung.
- Plugin saluran yang terinstal tetap dapat tidak menyertakan dukungan direktori; dalam kasus tersebut, perintah melaporkan operasi direktori yang tidak didukung, bukan menginstal ulang Plugin.
- Output default adalah `id` (dan kadang `name`) yang dipisahkan dengan tab; gunakan `--json` untuk skrip.

## Menggunakan hasil dengan `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Format ID (berdasarkan saluran)

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
