---
read_when:
    - Anda ingin membuka UI Control dengan token saat ini
    - Anda ingin mencetak URL tanpa meluncurkan browser
summary: Referensi CLI untuk `openclaw dashboard` (membuka UI Control)
title: dashboard
x-i18n:
    generated_at: "2026-04-05T13:45:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34cd109a3803e2910fcb4d32f2588aa205a4933819829ef5598f0780f586c94
    source_path: cli/dashboard.md
    workflow: 15
---

# `openclaw dashboard`

Buka UI Control menggunakan auth Anda saat ini.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Catatan:

- `dashboard` meresolusikan SecretRef `gateway.auth.token` yang dikonfigurasi bila memungkinkan.
- Untuk token yang dikelola SecretRef (teresolusikan atau tidak teresolusikan), `dashboard` mencetak/menyalin/membuka URL tanpa token untuk menghindari tereksposnya secret eksternal dalam output terminal, riwayat clipboard, atau argumen peluncuran browser.
- Jika `gateway.auth.token` dikelola SecretRef tetapi tidak teresolusikan dalam jalur perintah ini, perintah mencetak URL tanpa token dan panduan perbaikan yang eksplisit alih-alih menyematkan placeholder token yang tidak valid.
