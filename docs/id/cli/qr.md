---
read_when:
    - Anda ingin memasangkan aplikasi Node seluler dengan Gateway dengan cepat
    - Anda memerlukan keluaran setup-code untuk berbagi jarak jauh/manual
summary: Referensi CLI untuk `openclaw qr` (buat QR pemasangan perangkat seluler + kode penyiapan)
title: QR
x-i18n:
    generated_at: "2026-05-06T09:05:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2e8f86b860701dcd625b6573070e30ed26a2f3fda9e5e7998723c8058de498b
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
- `--url <url>`: timpa URL gateway yang digunakan dalam muatan
- `--public-url <url>`: timpa URL publik yang digunakan dalam muatan
- `--token <token>`: timpa token gateway yang digunakan alur inisialisasi untuk autentikasi
- `--password <password>`: timpa kata sandi gateway yang digunakan alur inisialisasi untuk autentikasi
- `--setup-code-only`: cetak hanya kode penyiapan
- `--no-ascii`: lewati perenderan QR ASCII
- `--json`: hasilkan JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Catatan

- `--token` dan `--password` saling eksklusif.
- Kode penyiapan itu sendiri sekarang membawa `bootstrapToken` buram berumur pendek, bukan token/kata sandi Gateway bersama.
- Dalam alur inisialisasi node/operator bawaan, token node utama tetap tersimpan dengan `scopes: []`.
- Jika serah terima inisialisasi juga menerbitkan token operator, token tersebut tetap dibatasi pada daftar izin inisialisasi: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Pemeriksaan cakupan inisialisasi berprefiks peran. Daftar izin operator tersebut hanya memenuhi permintaan operator; peran non-operator tetap memerlukan cakupan di bawah prefiks perannya sendiri.
- Pemasangan seluler gagal tertutup untuk URL Gateway `ws://` Tailscale/publik. Alamat LAN privat dan host Bonjour `.local` tetap didukung melalui `ws://`, tetapi rute seluler Tailscale/publik sebaiknya menggunakan Tailscale Serve/Funnel atau URL Gateway `wss://`.
- Dengan `--remote`, OpenClaw memerlukan `gateway.remote.url` atau
  `gateway.tailscale.mode=serve|funnel`.
- Dengan `--remote`, jika kredensial jarak jauh yang efektif aktif dikonfigurasi sebagai SecretRefs dan Anda tidak meneruskan `--token` atau `--password`, perintah akan menyelesaikannya dari snapshot Gateway aktif. Jika Gateway tidak tersedia, perintah gagal dengan cepat.
- Tanpa `--remote`, SecretRefs autentikasi Gateway lokal diselesaikan ketika tidak ada penimpaan autentikasi CLI yang diteruskan:
  - `gateway.auth.token` diselesaikan ketika autentikasi token dapat menang (`gateway.auth.mode="token"` eksplisit atau mode tersimpulkan ketika tidak ada sumber kata sandi yang menang).
  - `gateway.auth.password` diselesaikan ketika autentikasi kata sandi dapat menang (`gateway.auth.mode="password"` eksplisit atau mode tersimpulkan tanpa token pemenang dari autentikasi/env).
- Jika `gateway.auth.token` dan `gateway.auth.password` sama-sama dikonfigurasi (termasuk SecretRefs) dan `gateway.auth.mode` belum diatur, penyelesaian kode penyiapan gagal sampai mode diatur secara eksplisit.
- Catatan ketidaksesuaian versi Gateway: jalur perintah ini memerlukan Gateway yang mendukung `secrets.resolve`; gateway lama mengembalikan kesalahan metode tidak dikenal.
- Setelah memindai, setujui pemasangan perangkat dengan:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Terkait

- [Referensi CLI](/id/cli)
- [Pemasangan](/id/cli/pairing)
