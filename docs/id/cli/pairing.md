---
read_when:
    - Anda menggunakan DM mode pemasangan dan perlu menyetujui pengirim
summary: Referensi CLI untuk `openclaw pairing` (menyetujui/mencantumkan permintaan pemasangan)
title: Pemasangan pasangan
x-i18n:
    generated_at: "2026-07-16T17:56:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 740459efe4d0fa2e9fa04a20b944592fed3dc9a22211658e1418c1e49a736997
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Setujui atau periksa permintaan pemasangan DM untuk saluran yang mendukung pemasangan (hanya DM obrolan - pemasangan node/perangkat menggunakan `openclaw devices`).

Terkait: [Alur pemasangan](/id/channels/pairing)

## Perintah

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

Cantumkan permintaan pemasangan yang tertunda untuk satu saluran.

| Opsi                    | Deskripsi                                  |
| ----------------------- | ------------------------------------------ |
| `[channel]`      | ID saluran posisional                      |
| `--channel <channel>`      | ID saluran eksplisit                       |
| `--account <accountId>`      | ID akun untuk saluran dengan banyak akun   |
| `--json`      | keluaran yang dapat dibaca mesin            |

Jika beberapa saluran yang mendukung pemasangan dikonfigurasi, berikan saluran secara posisional atau dengan `--channel`. Saluran ekstensi berfungsi selama ID salurannya valid.

## `pairing approve`

Setujui kode pemasangan yang tertunda dan izinkan pengirim tersebut.

Penggunaan:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` ketika tepat satu saluran yang mendukung pemasangan dikonfigurasi

Opsi: `--channel <channel>`, `--account <accountId>`, `--notify` (kirim konfirmasi kembali kepada pemohon di saluran yang sama).

### Bootstrap pemilik

Jika `commands.ownerAllowFrom` kosong saat Anda menyetujui kode pemasangan, OpenClaw juga mencatat pengirim yang disetujui sebagai pemilik perintah, menggunakan entri dengan cakupan saluran seperti `telegram:123456789`. Ini hanya melakukan bootstrap untuk pemilik pertama - persetujuan pemasangan berikutnya tidak pernah mengganti atau memperluas `commands.ownerAllowFrom`.

Pemilik perintah adalah akun operator manusia yang diizinkan menjalankan perintah khusus pemilik dan menyetujui tindakan berbahaya seperti `/diagnostics`, `/export-session`, `/export-trajectory`, `/config`, dan persetujuan eksekusi. Pemasangan hanya memungkinkan pengirim berbicara dengan agen; pemasangan itu sendiri tidak memberikan hak istimewa pemilik selain melalui bootstrap satu kali ini.

Jika Anda menyetujui pengirim sebelum bootstrap ini tersedia, jalankan `openclaw doctor`; perintah tersebut memperingatkan ketika tidak ada pemilik perintah yang dikonfigurasi dan menampilkan perintah `openclaw config set commands.ownerAllowFrom ...` yang tepat untuk memperbaikinya.

## Terkait

- [Referensi CLI](/id/cli)
- [Pemasangan saluran](/id/channels/pairing)
