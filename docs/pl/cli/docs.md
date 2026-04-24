---
read_when:
    - Chcesz przeszukiwać aktualną dokumentację OpenClaw z terminala
summary: Odwołanie CLI dla `openclaw docs` (przeszukiwanie indeksu dokumentacji na żywo)
title: Dokumentacja
x-i18n:
    generated_at: "2026-04-24T09:02:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d208f5b9a3576ce0597abca600df109db054d20068359a9f2070ac30b1a8f69
    source_path: cli/docs.md
    workflow: 15
---

# `openclaw docs`

Przeszukuj aktualny indeks dokumentacji.

Argumenty:

- `[query...]`: wyszukiwane terminy wysyłane do aktualnego indeksu dokumentacji

Przykłady:

```bash
openclaw docs
openclaw docs browser existing-session
openclaw docs sandbox allowHostControl
openclaw docs gateway token secretref
```

Uwagi:

- Bez zapytania `openclaw docs` otwiera punkt wejścia wyszukiwania w aktualnej dokumentacji.
- Zapytania wielowyrazowe są przekazywane jako jedno żądanie wyszukiwania.

## Powiązane

- [Odwołanie CLI](/pl/cli)
