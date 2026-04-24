---
read_when:
    - Anda ingin melakukan pairing aplikasi node seluler dengan gateway secara cepat
    - Anda memerlukan output setup-code untuk berbagi jarak jauh/manual
summary: Referensi CLI untuk `openclaw qr` (menghasilkan QR pairing seluler + kode penyiapan)
title: QR
x-i18n:
    generated_at: "2026-04-24T09:02:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05e25f5cf4116adcd0630b148b6799e90304058c51c998293ebbed995f0a0533
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

Hasilkan QR pairing seluler dan setup code dari konfigurasi Gateway Anda saat ini.

## Penggunaan

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Opsi

- `--remote`: utamakan `gateway.remote.url`; jika tidak disetel, `gateway.tailscale.mode=serve|funnel` tetap dapat menyediakan URL publik remote
- `--url <url>`: override URL gateway yang digunakan dalam payload
- `--public-url <url>`: override URL publik yang digunakan dalam payload
- `--token <token>`: override token gateway yang digunakan alur bootstrap untuk autentikasi
- `--password <password>`: override password gateway yang digunakan alur bootstrap untuk autentikasi
- `--setup-code-only`: cetak hanya setup code
- `--no-ascii`: lewati rendering QR ASCII
- `--json`: keluarkan JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Catatan

- `--token` dan `--password` saling eksklusif.
- Setup code itu sendiri sekarang membawa `bootstrapToken` opaque berumur pendek, bukan token/password gateway bersama.
- Dalam alur bootstrap node/operator bawaan, token node utama tetap diberikan dengan `scopes: []`.
- Jika bootstrap handoff juga menerbitkan token operator, token itu tetap dibatasi pada allowlist bootstrap: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Pemeriksaan cakupan bootstrap menggunakan prefiks role. Allowlist operator tersebut hanya memenuhi permintaan operator; role non-operator tetap memerlukan scopes di bawah prefiks role mereka sendiri.
- Pairing seluler gagal tertutup untuk URL gateway Tailscale/publik `ws://`. `ws://` LAN privat tetap didukung, tetapi rute seluler Tailscale/publik sebaiknya menggunakan Tailscale Serve/Funnel atau URL gateway `wss://`.
- Dengan `--remote`, OpenClaw memerlukan `gateway.remote.url` atau
  `gateway.tailscale.mode=serve|funnel`.
- Dengan `--remote`, jika kredensial remote aktif efektif dikonfigurasi sebagai SecretRef dan Anda tidak memberikan `--token` atau `--password`, perintah akan menyelesaikannya dari snapshot gateway aktif. Jika gateway tidak tersedia, perintah gagal cepat.
- Tanpa `--remote`, SecretRef autentikasi gateway lokal diselesaikan saat tidak ada override autentikasi CLI yang diberikan:
  - `gateway.auth.token` diselesaikan saat autentikasi token dapat menang (eksplisit `gateway.auth.mode="token"` atau mode tersirat ketika tidak ada sumber password yang menang).
  - `gateway.auth.password` diselesaikan saat autentikasi password dapat menang (eksplisit `gateway.auth.mode="password"` atau mode tersirat tanpa token pemenang dari auth/env).
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi (termasuk SecretRef) dan `gateway.auth.mode` tidak disetel, resolusi setup code gagal sampai mode disetel secara eksplisit.
- Catatan perbedaan versi Gateway: jalur perintah ini memerlukan gateway yang mendukung `secrets.resolve`; gateway yang lebih lama mengembalikan error unknown-method.
- Setelah memindai, setujui pairing perangkat dengan:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Terkait

- [Referensi CLI](/id/cli)
- [Pairing](/id/cli/pairing)
