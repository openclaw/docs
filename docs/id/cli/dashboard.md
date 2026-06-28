---
read_when:
    - Anda ingin membuka Control UI dengan token Anda saat ini
    - Anda ingin mencetak URL tanpa membuka peramban
summary: Referensi CLI untuk `openclaw dashboard` (buka Control UI)
title: Dasbor
x-i18n:
    generated_at: "2026-05-05T01:44:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51b3326b3884013ebcf570b417e66efe62ea89dcdedb5ab3173f39fb021de89f
    source_path: cli/dashboard.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw dashboard`

Buka UI Kontrol menggunakan autentikasi Anda saat ini.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Catatan:

- `dashboard` menyelesaikan SecretRef `gateway.auth.token` yang dikonfigurasi jika memungkinkan.
- `dashboard` mengikuti `gateway.tls.enabled`: gateway dengan TLS diaktifkan mencetak/membuka URL UI Kontrol
  `https://` dan terhubung melalui `wss://`.
- Jika pengiriman melalui clipboard/browser gagal untuk URL dashboard yang diautentikasi token,
  `dashboard` mencatat petunjuk autentikasi manual yang aman dengan menyebut `OPENCLAW_GATEWAY_TOKEN`,
  `gateway.auth.token`, dan kunci fragmen `token` tanpa mencetak nilai token.
- Untuk token yang dikelola SecretRef (terselesaikan atau belum terselesaikan), `dashboard` mencetak/menyalin/membuka URL tanpa token untuk menghindari pemaparan secret eksternal dalam output terminal, riwayat clipboard, atau argumen peluncuran browser.
- Jika `gateway.auth.token` dikelola SecretRef tetapi tidak terselesaikan di jalur perintah ini, perintah mencetak URL tanpa token dan panduan remediasi eksplisit alih-alih menyematkan placeholder token yang tidak valid.

## Terkait

- [Referensi CLI](/id/cli)
- [Dashboard](/id/web/dashboard)
