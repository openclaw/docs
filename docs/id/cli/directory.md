---
read_when:
    - Anda ingin mencari ID kontak/grup/diri sendiri untuk suatu kanal
    - Anda sedang mengembangkan adaptor direktori kanal
summary: Referensi CLI untuk `openclaw directory` (diri sendiri, rekan, grup)
title: Direktori
x-i18n:
    generated_at: "2026-07-12T14:05:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Pencarian direktori untuk saluran yang mendukungnya: kontak/rekan, grup, dan "saya" (diri sendiri).

Hasilnya dimaksudkan untuk ditempelkan ke perintah lain, terutama `openclaw message send --target ...`.

## Opsi umum

- `--channel <name>`: id/alias saluran (wajib jika beberapa saluran dikonfigurasi; dipilih secara otomatis jika hanya satu yang dikonfigurasi)
- `--account <id>`: id akun (bawaan: akun bawaan saluran)
- `--json`: menghasilkan JSON

Keluaran bawaan (non-JSON) adalah `id` (dan terkadang `name`) yang dipisahkan oleh tab.

## Catatan

- Untuk banyak saluran, hasil bersumber dari konfigurasi (daftar izin/grup yang dikonfigurasi), bukan dari direktori penyedia langsung.
- Plugin saluran yang sudah terpasang mungkin tidak mendukung direktori. Dalam kasus tersebut, perintah melaporkan bahwa operasi tidak didukung; perintah tidak mencoba memasang ulang atau meningkatkan versi Plugin untuk menambahkan dukungan.

## Menggunakan hasil dengan `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Format ID berdasarkan saluran

| Saluran                             | Format id target                                                                                                             |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567` (DM), `1234567890-1234567890@g.us` (grup), `120363123456789@newsletter` (Saluran/Buletin, hanya keluar)       |
| Signal                              | Alias yang dikonfigurasi diubah menjadi target DM E.164/UUID atau target grup `group:<id>`                                   |
| Telegram                            | `@username` atau id obrolan numerik; grup menggunakan id numerik                                                             |
| Slack                               | `user:U…` dan `channel:C…`                                                                                                   |
| Discord                             | `user:<id>` dan `channel:<id>`                                                                                               |
| Matrix (Plugin)                     | `user:@user:server`, `room:!roomId:server`, atau `#alias:server`                                                             |
| Microsoft Teams (Plugin)            | `user:<id>` dan `conversation:<id>`                                                                                          |
| Zalo (Plugin)                       | Id pengguna (API Bot)                                                                                                        |
| Zalo Personal / `zalouser` (Plugin) | Id utas (DM/grup), dari `zca` (`me`, `friend list`, `group list`)                                                            |

## Diri sendiri ("saya")

```bash
openclaw directory self --channel zalouser
```

## Rekan (kontak/pengguna)

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
