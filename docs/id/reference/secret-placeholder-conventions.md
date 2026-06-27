---
read_when:
    - Menulis dokumentasi yang menyertakan token, kunci API, atau cuplikan kredensial
    - Memperbarui contoh yang mungkin dipindai oleh alat pendeteksi rahasia
summary: Konvensi placeholder yang aman untuk pemindai rahasia untuk dokumentasi dan contoh
title: Konvensi Placeholder Rahasia
x-i18n:
    generated_at: "2026-06-27T18:11:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 87e0db9ad47bf0c9d434da9bdcd6587e0b01d4eddf5ad245cf3dc87a1d166875
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Konvensi placeholder rahasia

Gunakan placeholder yang mudah dibaca manusia tetapi tidak menyerupai rahasia sungguhan.

## Gaya yang disarankan

- Utamakan nilai deskriptif seperti `example-openai-key-not-real` atau `example-discord-bot-token`.
- Untuk cuplikan shell, utamakan `${OPENAI_API_KEY}` daripada string inline yang menyerupai token.
- Pastikan contoh jelas palsu dan dibatasi sesuai tujuan (penyedia, saluran, jenis autentikasi).

## Hindari pola ini dalam dokumentasi

- Teks header atau footer kunci privat PEM literal.
- Prefiks yang menyerupai kredensial aktif, misalnya `sk-...`, `xoxb-...`, `AKIA...`.
- Token bearer yang tampak realistis dan disalin dari log runtime.

## Contoh

```bash
# Good
export OPENAI_API_KEY="example-openai-key-not-real"

# Better (when the doc is about env wiring)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
