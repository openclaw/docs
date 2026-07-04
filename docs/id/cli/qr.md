---
read_when:
    - Anda ingin memasangkan aplikasi Node seluler dengan Gateway dengan cepat
    - Anda memerlukan keluaran setup-code untuk berbagi secara jarak jauh/manual
summary: Referensi CLI untuk `openclaw qr` (hasilkan QR penyandingan seluler + kode penyiapan)
title: QR
x-i18n:
    generated_at: "2026-07-04T18:20:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81d15c9d551960c6f5677649b481e447ecda55a395957746959b4ecf81712bdb
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Buat QR pemasangan seluler dan kode penyiapan dari konfigurasi Gateway Anda saat ini.

## Penggunaan

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Opsi

- `--remote`: utamakan `gateway.remote.url`; jika belum diatur, `gateway.tailscale.mode=serve|funnel` tetap dapat menyediakan URL publik jarak jauh
- `--url <url>`: timpa URL gateway yang digunakan dalam payload
- `--public-url <url>`: timpa URL publik yang digunakan dalam payload
- `--token <token>`: timpa token gateway yang digunakan alur bootstrap untuk autentikasi
- `--password <password>`: timpa kata sandi gateway yang digunakan alur bootstrap untuk autentikasi
- `--setup-code-only`: cetak hanya kode penyiapan
- `--no-ascii`: lewati rendering QR ASCII
- `--json`: keluarkan JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Catatan

- `--token` dan `--password` saling eksklusif.
- Kode penyiapan itu sendiri sekarang membawa `bootstrapToken` buram berumur pendek, bukan token/kata sandi gateway bersama.
- Bootstrap kode penyiapan bawaan mengembalikan token `node` utama dengan `scopes: []` plus token serah terima `operator` terbatas untuk onboarding seluler tepercaya.
- Token operator yang diserahkan dibatasi pada `operator.approvals`, `operator.read`, `operator.talk.secrets`, dan `operator.write`; cakupan mutasi pemasangan dan `operator.admin` tetap memerlukan pemasangan operator terpisah yang disetujui atau alur token.
- Pemasangan seluler gagal tertutup untuk URL Gateway Tailscale/publik `ws://`. Alamat LAN privat dan host Bonjour `.local` tetap didukung melalui `ws://`, tetapi rute seluler Tailscale/publik sebaiknya menggunakan Tailscale Serve/Funnel atau URL Gateway `wss://`.
- Dengan `--remote`, OpenClaw memerlukan `gateway.remote.url` atau
  `gateway.tailscale.mode=serve|funnel`.
- Dengan `--remote`, jika kredensial jarak jauh yang efektif aktif dikonfigurasi sebagai SecretRefs dan Anda tidak meneruskan `--token` atau `--password`, perintah menyelesaikannya dari snapshot gateway aktif. Jika gateway tidak tersedia, perintah gagal cepat.
- Tanpa `--remote`, SecretRefs autentikasi gateway lokal diselesaikan ketika tidak ada timpa autentikasi CLI yang diteruskan:
  - `gateway.auth.token` diselesaikan ketika autentikasi token dapat menang (`gateway.auth.mode="token"` eksplisit atau mode tersimpulkan ketika tidak ada sumber kata sandi yang menang).
  - `gateway.auth.password` diselesaikan ketika autentikasi kata sandi dapat menang (`gateway.auth.mode="password"` eksplisit atau mode tersimpulkan tanpa token pemenang dari auth/env).
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi (termasuk SecretRefs) dan `gateway.auth.mode` belum diatur, resolusi kode penyiapan gagal hingga mode diatur secara eksplisit.
- Catatan ketidakselarasan versi Gateway: jalur perintah ini memerlukan gateway yang mendukung `secrets.resolve`; gateway lama mengembalikan kesalahan unknown-method.
- Aplikasi iOS dan Android resmi OpenClaw tersambung otomatis ketika metadata kode penyiapannya cocok. Jika permintaan tetap tertunda (misalnya, untuk klien nonresmi atau metadata yang tidak cocok), tinjau dan setujui dengan:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Terkait

- [Referensi CLI](/id/cli)
- [Pemasangan](/id/cli/pairing)
