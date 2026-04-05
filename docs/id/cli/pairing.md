---
read_when:
    - Anda menggunakan DM mode pairing dan perlu menyetujui pengirim
summary: Referensi CLI untuk `openclaw pairing` (menyetujui/mendaftarkan permintaan pairing)
title: pairing
x-i18n:
    generated_at: "2026-04-05T13:49:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 122a608ef83ec2b1011fdfd1b59b94950a4dcc8b598335b0956e2eedece4958f
    source_path: cli/pairing.md
    workflow: 15
---

# `openclaw pairing`

Setujui atau periksa permintaan pairing DM (untuk channel yang mendukung pairing).

Terkait:

- Alur pairing: [Pairing](/id/channels/pairing)

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

Daftarkan permintaan pairing tertunda untuk satu channel.

Opsi:

- `[channel]`: ID channel posisional
- `--channel <channel>`: ID channel eksplisit
- `--account <accountId>`: ID akun untuk channel multi-akun
- `--json`: output yang dapat dibaca mesin

Catatan:

- Jika beberapa channel yang mendukung pairing dikonfigurasi, Anda harus memberikan channel baik secara posisional maupun dengan `--channel`.
- Channel plugin diizinkan selama ID channel valid.

## `pairing approve`

Setujui kode pairing yang tertunda dan izinkan pengirim tersebut.

Penggunaan:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` ketika tepat satu channel yang mendukung pairing dikonfigurasi

Opsi:

- `--channel <channel>`: ID channel eksplisit
- `--account <accountId>`: ID akun untuk channel multi-akun
- `--notify`: kirim konfirmasi kembali ke peminta di channel yang sama

## Catatan

- Input channel: berikan secara posisional (`pairing list telegram`) atau dengan `--channel <channel>`.
- `pairing list` mendukung `--account <accountId>` untuk channel multi-akun.
- `pairing approve` mendukung `--account <accountId>` dan `--notify`.
- Jika hanya satu channel yang mendukung pairing dikonfigurasi, `pairing approve <code>` diperbolehkan.
