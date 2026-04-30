---
read_when:
    - Anda menggunakan pesan langsung dalam mode penyandingan dan perlu menyetujui pengirim
summary: Referensi CLI untuk `openclaw pairing` (menyetujui/mencantumkan permintaan penyandingan)
title: Penyandingan
x-i18n:
    generated_at: "2026-04-30T09:41:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: bffc70a8c08e298f42c8fbc2238fce06993572e72f333e87ad18dea3cf33fab5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

Setujui atau periksa permintaan penyandingan pesan langsung (untuk kanal yang mendukung penyandingan).

Terkait:

- Alur penyandingan: [Penyandingan](/id/channels/pairing)

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

Cantumkan permintaan penyandingan yang tertunda untuk satu kanal.

Opsi:

- `[channel]`: id kanal posisional
- `--channel <channel>`: id kanal eksplisit
- `--account <accountId>`: id akun untuk kanal multi-akun
- `--json`: output yang dapat dibaca mesin

Catatan:

- Jika beberapa kanal yang mendukung penyandingan dikonfigurasi, Anda harus memberikan kanal, baik secara posisional maupun dengan `--channel`.
- Kanal ekstensi diizinkan selama id kanal valid.

## `pairing approve`

Setujui kode penyandingan yang tertunda dan izinkan pengirim tersebut.

Penggunaan:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` ketika tepat satu kanal yang mendukung penyandingan dikonfigurasi

Opsi:

- `--channel <channel>`: id kanal eksplisit
- `--account <accountId>`: id akun untuk kanal multi-akun
- `--notify`: kirim konfirmasi kembali ke peminta di kanal yang sama

Bootstrap pemilik:

- Jika `commands.ownerAllowFrom` kosong saat Anda menyetujui kode penyandingan, OpenClaw juga mencatat pengirim yang disetujui sebagai pemilik perintah, menggunakan entri berlingkup kanal seperti `telegram:123456789`.
- Ini hanya melakukan bootstrap pemilik pertama. Persetujuan penyandingan berikutnya tidak mengganti atau memperluas `commands.ownerAllowFrom`.
- Pemilik perintah adalah akun operator manusia yang diizinkan menjalankan perintah khusus pemilik dan menyetujui tindakan berbahaya seperti `/diagnostics`, `/export-trajectory`, `/config`, dan persetujuan exec.

## Catatan

- Input kanal: berikan secara posisional (`pairing list telegram`) atau dengan `--channel <channel>`.
- `pairing list` mendukung `--account <accountId>` untuk kanal multi-akun.
- `pairing approve` mendukung `--account <accountId>` dan `--notify`.
- Jika hanya satu kanal yang mendukung penyandingan dikonfigurasi, `pairing approve <code>` diizinkan.
- Jika Anda menyetujui pengirim sebelum bootstrap ini ada, jalankan `openclaw doctor`; perintah tersebut memperingatkan saat tidak ada pemilik perintah yang dikonfigurasi dan menampilkan perintah `openclaw config set commands.ownerAllowFrom ...` untuk memperbaikinya.

## Terkait

- [Referensi CLI](/id/cli)
- [Penyandingan kanal](/id/channels/pairing)
