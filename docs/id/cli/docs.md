---
read_when:
    - Anda ingin mencari dokumentasi OpenClaw live dari terminal
summary: Referensi CLI untuk `openclaw docs` (mencari indeks dokumentasi live)
title: docs
x-i18n:
    generated_at: "2026-04-05T13:45:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfcceed872d7509b9843af3fae733a136bc5e26ded55c2ac47a16489a1636989
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

Cari indeks dokumentasi live.

Argumen:

- `[query...]`: istilah pencarian yang akan dikirim ke indeks dokumentasi live

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
