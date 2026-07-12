---
read_when:
    - Chcesz szybko sprawdzić stan działania uruchomionego Gatewaya
summary: Dokumentacja CLI dla `openclaw health` (migawka stanu Gateway przez RPC)
title: Stan działania
x-i18n:
    generated_at: "2026-07-12T14:59:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a26ce5ade9ab56c9751c3dde814c38a1e01e74d91c2fd57e56d3c44ca529d0d8
    source_path: cli/health.md
    workflow: 16
---

# `openclaw health`

Pobiera migawkę stanu z uruchomionego Gateway za pośrednictwem RPC WebSocket (bez bezpośrednich gniazd kanałów z CLI).

## Opcje

| Flaga            | Domyślnie | Opis                                                                                                                   |
| ---------------- | --------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--json`         | `false`   | Wyświetla dane JSON przeznaczone do odczytu maszynowego zamiast tekstu.                                                |
| `--timeout <ms>` | `10000`   | Limit czasu połączenia w milisekundach.                                                                                |
| `--verbose`      | `false`   | Wymusza sprawdzenie na żywo i rozszerza dane wyjściowe o wszystkie skonfigurowane konta i agentów.                     |
| `--debug`        | `false`   | Alias opcji `--verbose`.                                                                                               |

Przykłady:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

## Działanie

- Bez opcji `--verbose` Gateway może zwrócić migawkę z pamięci podręcznej (aktualną przez maksymalnie 60 sekund i zgodną z bieżącym stanem środowiska wykonawczego kanałów), a następnie odświeżyć ją w tle dla kolejnego wywołującego.
- Opcja `--verbose` wymusza sprawdzenie na żywo (sprawdzenia kont dla poszczególnych kanałów), wyświetla szczegóły połączenia z Gateway oraz rozszerza dane wyjściowe przeznaczone do odczytu przez człowieka o wszystkie skonfigurowane konta i agentów zamiast tylko domyślnego agenta.
- Opcja `--json` zawsze zwraca pełną migawkę: kanały, wyniki sprawdzeń poszczególnych kont, stan ładowania pluginów, stan kwarantanny silnika kontekstu, stan pamięci podręcznej cen modeli, stan pętli zdarzeń oraz magazyny sesji poszczególnych agentów.

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [`openclaw status`](/pl/cli/status) — lokalna diagnostyka i sprawdzanie kanałów bez pełnej migawki stanu
- [Stan Gateway](/pl/gateway/health)
