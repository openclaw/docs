---
read_when:
    - Chcesz przeszukiwać dokumentację OpenClaw na żywo z terminala
summary: Dokumentacja CLI dla `openclaw docs` (przeszukiwanie indeksu dokumentacji na żywo)
title: docs
x-i18n:
    generated_at: "2026-04-05T13:48:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: cfcceed872d7509b9843af3fae733a136bc5e26ded55c2ac47a16489a1636989
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

Przeszukuj indeks dokumentacji na żywo.

Argumenty:

- `[query...]`: terminy wyszukiwania wysyłane do indeksu dokumentacji na żywo

Przykłady:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Uwagi:

- Bez zapytania `openclaw docs` otwiera punkt wejścia wyszukiwania dokumentacji na żywo.
- Zapytania wielowyrazowe są przekazywane jako jedno żądanie wyszukiwania.
