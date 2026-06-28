---
read_when:
    - Chcesz szybko sprawdzić stan działającego Gateway
summary: Dokumentacja referencyjna CLI dla `openclaw health` (migawka kondycji Gateway za pomocą RPC)
title: Kondycja
x-i18n:
    generated_at: "2026-05-10T19:29:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26be7bbbf75c2eca1213fe145fdeeab6fee96798dff457278ac69a20145bf75d
    source_path: cli/health.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw health`

Pobiera stan z działającego Gateway.

## Opcje

| Flaga            | Domyślne | Opis                                                                    |
| ---------------- | -------- | ----------------------------------------------------------------------- |
| `--json`         | `false`  | Wypisuje JSON czytelny maszynowo zamiast tekstu.                        |
| `--timeout <ms>` | `10000`  | Limit czasu połączenia w milisekundach.                                 |
| `--verbose`      | `false`  | Szczegółowe logowanie. Wymusza sondowanie na żywo i rozszerza dane wyjściowe dla każdego agenta. |
| `--debug`        | `false`  | Alias dla `--verbose`.                                                  |

Przykłady:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

Uwagi:

- Domyślnie `openclaw health` pyta działający Gateway o migawkę jego stanu. Gdy
  Gateway ma już świeżą migawkę w pamięci podręcznej, może zwrócić ten buforowany ładunek i
  odświeżyć go w tle.
- `--verbose` wymusza sondowanie na żywo, wypisuje szczegóły połączenia z Gateway i rozszerza
  czytelne dla człowieka dane wyjściowe na wszystkie skonfigurowane konta i agentów.
- Dane wyjściowe obejmują magazyny sesji dla każdego agenta, gdy skonfigurowano wielu agentów.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Stan Gateway](/pl/gateway/health)
