---
read_when:
    - Anda ingin membuka UI Control dengan token Anda saat ini
    - Anda ingin mencetak URL tanpa meluncurkan browser
summary: Referensi CLI untuk `openclaw dashboard` (membuka UI Control)
title: Dasbor
x-i18n:
    generated_at: "2026-04-24T09:01:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0864d9c426832ffb9e2acd9d7cb7fc677d859a5b7588132e993a36a5c5307802
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Buka UI Control menggunakan autentikasi Anda saat ini.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Catatan:

- `dashboard` me-resolve SecretRef `gateway.auth.token` yang dikonfigurasi jika memungkinkan.
- Untuk token yang dikelola SecretRef (ter-resolve atau tidak), `dashboard` mencetak/menyalin/membuka URL tanpa token untuk menghindari mengekspos rahasia eksternal di output terminal, riwayat clipboard, atau argumen peluncuran browser.
- Jika `gateway.auth.token` dikelola SecretRef tetapi tidak dapat di-resolve dalam jalur perintah ini, perintah akan mencetak URL tanpa token dan panduan remediasi yang eksplisit alih-alih menyematkan placeholder token yang tidak valid.

## Terkait

- [Referensi CLI](/id/cli)
- [Dasbor](/id/web/dashboard)
