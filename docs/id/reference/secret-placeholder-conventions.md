---
read_when:
    - Menulis dokumentasi yang menyertakan token, kunci API, atau cuplikan kredensial
    - Memperbarui contoh yang mungkin dipindai oleh alat pendeteksi rahasia
summary: Konvensi placeholder yang aman bagi pemindai rahasia untuk dokumentasi dan contoh
title: Konvensi Placeholder Rahasia
x-i18n:
    generated_at: "2026-07-12T14:40:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0864f0fcc6fb1e4a3147b4b2ce0aac475437a19d694f3d059374782428c7f248
    source_path: reference/secret-placeholder-conventions.md
    workflow: 16
---

# Konvensi placeholder rahasia

Gunakan placeholder yang mudah dibaca manusia, tetapi tidak menyerupai rahasia asli.

## Gaya yang disarankan

- Utamakan nilai deskriptif seperti `example-openai-key-not-real` atau `example-discord-bot-token`.
- Untuk cuplikan shell, utamakan `${OPENAI_API_KEY}` daripada string menyerupai token yang ditulis langsung.
- Pastikan contoh tampak jelas palsu dan dibatasi sesuai tujuan (penyedia, saluran, jenis autentikasi).

## Hindari pola ini dalam dokumentasi

- Teks harfiah header atau footer kunci privat PEM.
- Prefiks yang menyerupai kredensial aktif, misalnya `sk-...`, `xoxb-...`, `AKIA...`.
- Token bearer yang tampak realistis dan disalin dari log runtime.

## Contoh

```bash
# Baik
export OPENAI_API_KEY="example-openai-key-not-real"

# Lebih baik (ketika dokumentasi membahas pengaturan variabel lingkungan)
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
