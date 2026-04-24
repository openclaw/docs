---
read_when:
    - Chcesz szybko sprawdzić kondycję uruchomionej Gateway
summary: Dokumentacja CLI dla `openclaw health` (migawka kondycji Gateway przez RPC)
title: Kondycja
x-i18n:
    generated_at: "2026-04-24T09:02:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: bf5f5b9c3ec5c08090134764966d2657241ed0ebbd28a9dc7fafde0b8c7216d6
    source_path: cli/health.md
    workflow: 15
---

# `openclaw health`

Pobierz stan kondycji z uruchomionej Gateway.

Opcje:

- `--json`: wyjście czytelne dla maszyn
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

- Domyślne `openclaw health` pyta uruchomioną Gateway o migawkę jej kondycji. Gdy
  Gateway ma już świeżą migawkę w pamięci podręcznej, może zwrócić ten zapisany ładunek i
  odświeżyć go w tle.
- `--verbose` wymusza aktywną sondę, drukuje szczegóły połączenia z Gateway i rozszerza
  wyjście czytelne dla człowieka o wszystkie skonfigurowane konta i agentów.
- Wyjście obejmuje magazyny sesji per agent, gdy skonfigurowano wielu agentów.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Kondycja Gateway](/pl/gateway/health)
