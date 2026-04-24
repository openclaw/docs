---
read_when:
    - Anda ingin menelusuri dokumentasi OpenClaw live dari terminal
summary: Referensi CLI untuk `openclaw docs` (menelusuri indeks dokumentasi live)
title: Dokumentasi
x-i18n:
    generated_at: "2026-04-24T09:01:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d208f5b9a3576ce0597abca600df109db054d20068359a9f2070ac30b1a8f69
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

Telusuri indeks dokumentasi live.

Argumen:

- `[query...]`: istilah pencarian yang dikirim ke indeks dokumentasi live

Contoh:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Catatan:

- Tanpa kueri, `openclaw docs` membuka entrypoint pencarian dokumentasi live.
- Kueri multi-kata diteruskan sebagai satu permintaan pencarian.

## Terkait

- [Referensi CLI](/id/cli)
