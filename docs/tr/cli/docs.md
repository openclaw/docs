---
read_when:
    - Terminalden canlı OpenClaw belgelerinde arama yapmak istiyorsunuz
summary: '`openclaw docs` için CLI başvurusu (canlı belge dizininde arama)'
title: Belgeler
x-i18n:
    generated_at: "2026-04-24T09:02:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d208f5b9a3576ce0597abca600df109db054d20068359a9f2070ac30b1a8f69
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

Canlı belge dizininde arama yapın.

Argümanlar:

- `[query...]`: canlı belge dizinine gönderilecek arama terimleri

Örnekler:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Notlar:

- Sorgu yoksa `openclaw docs`, canlı belge arama giriş noktasını açar.
- Çok sözcüklü sorgular tek bir arama isteği olarak iletilir.

## İlgili

- [CLI başvurusu](/tr/cli)
