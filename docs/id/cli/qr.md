---
read_when:
    - Anda ingin memasangkan aplikasi node seluler dengan gateway dengan cepat
    - Anda memerlukan output kode penyiapan untuk dibagikan secara jarak jauh/manual
summary: Referensi CLI untuk `openclaw qr` (membuat QR pairing seluler + kode penyiapan)
title: qr
x-i18n:
    generated_at: "2026-04-05T13:49:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6469334ad09037318f938c7ac609b7d5e3385c0988562501bb02a1bfa411ff
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

Buat QR pairing seluler dan kode penyiapan dari konfigurasi Gateway Anda saat ini.

## Penggunaan

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Opsi

- `--remote`: utamakan `gateway.remote.url`; jika tidak disetel, `gateway.tailscale.mode=serve|funnel` masih dapat menyediakan URL publik jarak jauh
- `--url <url>`: timpa URL gateway yang digunakan dalam payload
- `--public-url <url>`: timpa URL publik yang digunakan dalam payload
- `--token <token>`: timpa token gateway mana yang diautentikasi oleh alur bootstrap
- `--password <password>`: timpa kata sandi gateway mana yang diautentikasi oleh alur bootstrap
- `--setup-code-only`: cetak hanya kode penyiapan
- `--no-ascii`: lewati rendering QR ASCII
- `--json`: keluarkan JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Catatan

- `--token` dan `--password` bersifat saling eksklusif.
- Kode penyiapan itu sendiri sekarang membawa `bootstrapToken` opak berumur pendek, bukan token/kata sandi gateway bersama.
- Dalam alur bootstrap node/operator bawaan, token node utama tetap berakhir dengan `scopes: []`.
- Jika serah terima bootstrap juga menerbitkan token operator, token itu tetap dibatasi ke allowlist bootstrap: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Pemeriksaan cakupan bootstrap berawalan peran. Allowlist operator itu hanya memenuhi permintaan operator; peran non-operator tetap memerlukan cakupan di bawah awalan peran mereka sendiri.
- Pairing seluler gagal tertutup untuk URL gateway Tailscale/publik `ws://`. `ws://` LAN privat tetap didukung, tetapi rute seluler Tailscale/publik harus menggunakan Tailscale Serve/Funnel atau URL gateway `wss://`.
- Dengan `--remote`, OpenClaw memerlukan `gateway.remote.url` atau
  `gateway.tailscale.mode=serve|funnel`.
- Dengan `--remote`, jika kredensial jarak jauh aktif yang efektif dikonfigurasi sebagai SecretRef dan Anda tidak memberikan `--token` atau `--password`, perintah akan menyelesaikannya dari snapshot gateway aktif. Jika gateway tidak tersedia, perintah gagal cepat.
- Tanpa `--remote`, SecretRef autentikasi gateway lokal diselesaikan saat tidak ada override autentikasi CLI yang diberikan:
  - `gateway.auth.token` diselesaikan saat autentikasi token dapat menang (eksplisit `gateway.auth.mode="token"` atau mode tersimpulkan saat tidak ada sumber kata sandi yang menang).
  - `gateway.auth.password` diselesaikan saat autentikasi kata sandi dapat menang (eksplisit `gateway.auth.mode="password"` atau mode tersimpulkan tanpa token pemenang dari auth/env).
- Jika `gateway.auth.token` dan `gateway.auth.password` keduanya dikonfigurasi (termasuk SecretRef) dan `gateway.auth.mode` tidak disetel, penyelesaian kode penyiapan gagal sampai mode disetel secara eksplisit.
- Catatan ketidaksesuaian versi gateway: jalur perintah ini memerlukan gateway yang mendukung `secrets.resolve`; gateway yang lebih lama mengembalikan error unknown-method.
- Setelah dipindai, setujui pairing perangkat dengan:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`
