---
read_when:
    - Chcesz szybko sprawdzić stan działającego Gateway
summary: Dokumentacja referencyjna CLI dla `openclaw health` (zrzut stanu kondycji Gateway za pośrednictwem RPC)
title: Stan
x-i18n:
    generated_at: "2026-05-06T09:05:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 443684af04efce2c54a6679e13b0bff0a5c1869f85d60fae0e853aed0a362226
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Pobiera stan z działającego Gateway.

Opcje:

- `--json`: dane wyjściowe czytelne maszynowo
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

- Domyślne `openclaw health` pyta działający gateway o migawkę jego stanu. Gdy
  gateway ma już świeżą migawkę w pamięci podręcznej, może zwrócić te dane z pamięci podręcznej i
  odświeżyć je w tle.
- `--verbose` wymusza sondę na żywo, wypisuje szczegóły połączenia z gateway i rozszerza
  czytelne dla człowieka dane wyjściowe na wszystkie skonfigurowane konta i agentów.
- Dane wyjściowe obejmują magazyny sesji poszczególnych agentów, gdy skonfigurowano wielu agentów.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Stan Gateway](/pl/gateway/health)
