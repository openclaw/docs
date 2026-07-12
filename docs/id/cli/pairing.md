---
read_when:
    - Anda menggunakan DM mode pemasangan dan perlu menyetujui pengirim
summary: Referensi CLI untuk `openclaw pairing` (menyetujui/mencantumkan permintaan pemasangan)
title: Pemasangan
x-i18n:
    generated_at: "2026-07-12T14:02:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca83ad9d9e55cfffd49301cb529b28df370c2dcff03484880f7cfc85ec2d6440
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Setujui atau periksa permintaan pemasangan DM untuk saluran yang mendukung pemasangan (khusus DM obrolan—pemasangan Node/perangkat menggunakan `openclaw devices`).

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

| Opsi                    | Deskripsi                                        |
| ----------------------- | ------------------------------------------------ |
| `[channel]`             | ID saluran sebagai argumen posisi                |
| `--channel <channel>`   | ID saluran eksplisit                             |
| `--account <accountId>` | ID akun untuk saluran yang mendukung banyak akun |
| `--json`                | keluaran yang dapat dibaca mesin                  |

Jika beberapa saluran yang mendukung pemasangan telah dikonfigurasi, berikan saluran sebagai argumen posisi atau dengan `--channel`. Saluran ekstensi dapat digunakan selama ID salurannya valid.

## `pairing approve`

Setujui kode pemasangan yang tertunda dan izinkan pengirim tersebut.

Penggunaan:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` jika tepat satu saluran yang mendukung pemasangan telah dikonfigurasi

Opsi: `--channel <channel>`, `--account <accountId>`, `--notify` (kirim konfirmasi kembali kepada pemohon melalui saluran yang sama).

### Inisialisasi pemilik

Jika `commands.ownerAllowFrom` kosong saat Anda menyetujui kode pemasangan, OpenClaw juga mencatat pengirim yang disetujui sebagai pemilik perintah, menggunakan entri dengan cakupan saluran seperti `telegram:123456789`. Ini hanya menginisialisasi pemilik pertama—persetujuan pemasangan berikutnya tidak pernah mengganti atau memperluas `commands.ownerAllowFrom`.

Pemilik perintah adalah akun operator manusia yang diizinkan menjalankan perintah khusus pemilik dan menyetujui tindakan berbahaya seperti `/diagnostics`, `/export-trajectory`, `/config`, dan persetujuan eksekusi. Pemasangan hanya memungkinkan pengirim berbicara dengan agen; pemasangan itu sendiri tidak memberikan hak istimewa pemilik selain melalui inisialisasi satu kali ini.

Jika Anda menyetujui pengirim sebelum inisialisasi ini tersedia, jalankan `openclaw doctor`; perintah tersebut akan memperingatkan jika tidak ada pemilik perintah yang dikonfigurasi dan menampilkan perintah `openclaw config set commands.ownerAllowFrom ...` yang tepat untuk memperbaikinya.

## Terkait

- [Referensi CLI](/id/cli)
- [Pemasangan saluran](/id/channels/pairing)
