---
read_when:
    - Terminalden canlı OpenClaw dokümantasyonunda arama yapmak istiyorsanız
summary: '`openclaw docs` için CLI başvurusu (canlı dokümantasyon dizininde arama)'
title: docs
x-i18n:
    generated_at: "2026-04-05T13:48:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfcceed872d7509b9843af3fae733a136bc5e26ded55c2ac47a16489a1636989
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

Canlı dokümantasyon dizininde arama yapın.

Bağımsız değişkenler:

- `[query...]`: canlı dokümantasyon dizinine gönderilecek arama terimleri

Örnekler:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Notlar:

- Sorgu yoksa `openclaw docs`, canlı dokümantasyon arama giriş noktasını açar.
- Çok sözcüklü sorgular tek bir arama isteği olarak iletilir.
