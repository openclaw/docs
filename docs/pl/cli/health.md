---
read_when:
    - Chcesz szybko sprawdzić stan uruchomionego gateway
summary: Dokumentacja CLI dla `openclaw health` (migawka stanu gateway przez RPC)
title: health
x-i18n:
    generated_at: "2026-04-05T13:48:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4ed2b9ceefee6159cabaae9172d2d88174626456e7503d5d2bcd142634188ff0
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

Pobierz stan z uruchomionego gateway.

Opcje:

- `--json`: wyjście czytelne maszynowo
- `--timeout <ms>`: limit czasu połączenia w milisekundach (domyślnie `10000`)
- `--verbose`: szczegółowe logowanie
- `--debug`: alias dla `--verbose`

Przykłady:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Uwagi:

- Domyślne `openclaw health` pyta uruchomiony gateway o jego migawkę stanu. Gdy
  gateway ma już świeżą zbuforowaną migawkę, może zwrócić ten zbuforowany ładunek i
  odświeżyć go w tle.
- `--verbose` wymusza sondę na żywo, wypisuje szczegóły połączenia gateway i rozszerza
  czytelne dla człowieka wyjście na wszystkie skonfigurowane konta i agentów.
- Wyjście zawiera magazyny sesji per agent, gdy skonfigurowano wielu agentów.
