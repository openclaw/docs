---
read_when:
    - Anda ingin membuka UI Kontrol dengan token Anda saat ini
    - Anda ingin mencetak URL tanpa membuka peramban
summary: Referensi CLI untuk `openclaw dashboard` (buka UI Kontrol)
title: Dasbor
x-i18n:
    generated_at: "2026-07-12T14:03:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 349dff4bad7fc6aa622067ed502d7d6800b93ebcfe26d2594e602e06e564993f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Buka UI Kontrol menggunakan autentikasi Anda saat ini.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --yes
```

- `--no-open`: cetak URL tetapi jangan membuka peramban.
- `--yes`: mulai/instal Gateway tanpa meminta konfirmasi saat diperlukan.

Catatan:

- Menyelesaikan SecretRef `gateway.auth.token` yang dikonfigurasi jika memungkinkan.
- Mengikuti `gateway.tls.enabled`: Gateway yang mengaktifkan TLS mencetak/membuka URL UI Kontrol `https://` dan terhubung melalui `wss://`.
- Untuk pengikatan `lan` atau `custom` dengan wildcard, peluncuran pada host yang sama selalu menggunakan local loopback karena wildcard bukan tujuan peramban. Pengikatan `tailnet` dan `custom` tanpa enkripsi juga menggunakan `127.0.0.1` agar peramban memiliki konteks aman; host spesifik yang mengaktifkan TLS mempertahankan alamat yang dikonfigurasi agar nama sertifikat cocok.
- Sebelum memberikan URL local loopback terautentikasi untuk pengikatan antarmuka tertentu, perintah memeriksa antarmuka yang dikonfigurasi dan memverifikasi bahwa antarmuka tersebut serta `127.0.0.1` dimiliki oleh proses Gateway yang sama. Kepemilikan listener yang ambigu akan ditolak secara aman dengan panduan status.
- Untuk token yang dikelola SecretRef (baik terselesaikan maupun belum), URL yang dicetak/disalin/dibuka tidak pernah menyertakan token, sehingga rahasia eksternal tidak bocor ke keluaran terminal, riwayat papan klip, atau argumen peluncuran peramban.
- Jika `gateway.auth.token` dikelola SecretRef tetapi belum terselesaikan, perintah mencetak URL tanpa token dan panduan perbaikan, bukan placeholder token yang tidak valid.
- Jika pengiriman melalui papan klip/peramban gagal untuk URL yang diautentikasi dengan token, perintah mencatat petunjuk autentikasi manual yang aman dengan menyebutkan `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token`, dan kunci fragmen URL `token`, tanpa mencetak nilai token.

## Terkait

- [Referensi CLI](/id/cli)
- [Dasbor](/id/web/dashboard)
