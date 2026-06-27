---
read_when:
    - Anda ingin memasangkan aplikasi node seluler dengan gateway secara cepat
    - Anda memerlukan output kode penyiapan untuk berbagi jarak jauh/manual
summary: Referensi CLI untuk `openclaw qr` (hasilkan QR penyandingan seluler + kode penyiapan)
title: QR
x-i18n:
    generated_at: "2026-06-27T17:20:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d08bbeb69627dafea45c912af4e92c08cd5c79d4ae52bb3f0a6fba5e789acb51
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

- `--remote`: utamakan `gateway.remote.url`; jika belum diatur, `gateway.tailscale.mode=serve|funnel` masih dapat menyediakan URL publik jarak jauh
- `--url <url>`: timpa URL gateway yang digunakan dalam payload
- `--public-url <url>`: timpa URL publik yang digunakan dalam payload
- `--token <token>`: timpa token gateway yang digunakan alur bootstrap untuk autentikasi
- `--password <password>`: timpa kata sandi gateway yang digunakan alur bootstrap untuk autentikasi
- `--setup-code-only`: cetak hanya kode penyiapan
- `--no-ascii`: lewati rendering QR ASCII
- `--json`: keluarkan JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Catatan

- `--token` dan `--password` saling eksklusif.
- Kode penyiapan itu sendiri kini membawa `bootstrapToken` buram berumur pendek, bukan token/kata sandi gateway bersama.
- Bootstrap kode penyiapan bawaan mengembalikan token utama `node` dengan `scopes: []` plus token serah-terima `operator` terbatas untuk onboarding seluler tepercaya.
- Token operator yang diserahterimakan dibatasi ke `operator.approvals`, `operator.read`, `operator.talk.secrets`, dan `operator.write`; `operator.admin` dan `operator.pairing` memerlukan pemasangan operator yang disetujui secara terpisah atau alur token.
- Pemasangan seluler gagal tertutup untuk URL gateway `ws://` Tailscale/publik. Alamat LAN privat dan host Bonjour `.local` tetap didukung melalui `ws://`, tetapi rute seluler Tailscale/publik sebaiknya menggunakan Tailscale Serve/Funnel atau URL gateway `wss://`.
- Dengan `--remote`, OpenClaw memerlukan `gateway.remote.url` atau
  `gateway.tailscale.mode=serve|funnel`.
- Dengan `--remote`, jika kredensial jarak jauh yang efektif aktif dikonfigurasi sebagai SecretRefs dan Anda tidak meneruskan `--token` atau `--password`, perintah menyelesaikannya dari snapshot gateway aktif. Jika gateway tidak tersedia, perintah gagal cepat.
- Tanpa `--remote`, SecretRefs autentikasi gateway lokal diselesaikan ketika tidak ada override autentikasi CLI yang diteruskan:
  - `gateway.auth.token` diselesaikan ketika autentikasi token dapat menang (`gateway.auth.mode="token"` eksplisit atau mode tersimpulkan ketika tidak ada sumber kata sandi yang menang).
  - `gateway.auth.password` diselesaikan ketika autentikasi kata sandi dapat menang (`gateway.auth.mode="password"` eksplisit atau mode tersimpulkan tanpa token pemenang dari auth/env).
- Jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi (termasuk SecretRefs) dan `gateway.auth.mode` belum diatur, resolusi kode penyiapan gagal hingga mode diatur secara eksplisit.
- Catatan ketidaksesuaian versi Gateway: jalur perintah ini memerlukan gateway yang mendukung `secrets.resolve`; gateway lama mengembalikan kesalahan metode tidak dikenal.
- Setelah memindai, setujui pemasangan perangkat dengan:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Terkait

- [Referensi CLI](/id/cli)
- [Pemasangan](/id/cli/pairing)
