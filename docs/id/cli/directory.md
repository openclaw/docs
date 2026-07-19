---
read_when:
    - Anda ingin mencari ID kontak/grup/diri sendiri untuk suatu saluran
    - Anda sedang mengembangkan adaptor direktori kanal
summary: Referensi CLI untuk `openclaw directory` (diri sendiri, peer, grup)
title: Direktori
x-i18n:
    generated_at: "2026-07-19T04:52:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 33f1cabd0954f2e6e6affbfbff9f8e1f543bffebc54baff7c1ffaa21778744a0
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

Pencarian direktori untuk channel yang mendukungnya: kontak/rekan, grup, dan "saya" (diri sendiri).

Hasilnya dimaksudkan untuk ditempelkan ke perintah lain, terutama `openclaw message send --target ...`.

## Flag umum

- `--channel <name>`: id/alias channel (wajib jika beberapa channel dikonfigurasi; dipilih secara otomatis jika hanya satu yang dikonfigurasi)
- `--account <id>`: id akun (default: default channel)
- `--json`: keluaran JSON

Keluaran default (non-JSON) adalah `id` (dan terkadang `name`) yang dipisahkan oleh tab.

## Catatan

- Untuk banyak channel, hasil berasal dari konfigurasi (daftar yang diizinkan/grup yang dikonfigurasi), bukan dari direktori penyedia secara langsung.
- Daftar grup WhatsApp bersifat langsung. Pencarian Gateway menggunakan kembali koneksi yang dikelolanya; perintah mandiri hanya membuka sesi tertaut jika tidak ada proses lain yang mengelola akun tersebut, dan jika tidak, melaporkan bahwa grup langsung tidak tersedia.
- Plugin channel yang sudah terinstal mungkin tidak mendukung direktori. Dalam hal ini, perintah melaporkan bahwa operasi tersebut tidak didukung; perintah tidak mencoba menginstal ulang atau meningkatkan versi plugin untuk menambahkan dukungan.

## Menggunakan hasil dengan `message send`

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## Format ID menurut channel

| Channel                             | Format id target                                                                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567` (DM), `1234567890-1234567890@g.us` (grup), `120363123456789@newsletter` (Channel/Newsletter, hanya keluar) |
| Signal                              | Alias yang dikonfigurasi diubah menjadi target DM E.164/UUID atau target grup `group:<id>`                                           |
| Telegram                            | `@username` atau id obrolan numerik; grup menggunakan id numerik                                                                      |
| Slack                               | `user:U…` dan `channel:C…`                                                                                                  |
| Discord                             | `user:<id>` dan `channel:<id>`                                                                                              |
| Matrix (plugin)                     | `user:@user:server`, `room:!roomId:server`, atau `#alias:server`                                                              |
| Microsoft Teams (plugin)            | `user:<id>` dan `conversation:<id>`                                                                                         |
| Zalo (plugin)                       | Id pengguna (Bot API)                                                                                                           |
| Zalo Personal / `zalouser` (plugin) | Id utas (DM/grup), dari `zca` (`me`, `friend list`, `group list`)                                                        |

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
