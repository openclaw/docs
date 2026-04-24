---
read_when:
    - Chcesz wyświetlić zapisane sesje i zobaczyć ostatnią aktywność.
summary: Dokumentacja CLI dla `openclaw sessions` (lista zapisanych sesji + użycie)
title: Sesje
x-i18n:
    generated_at: "2026-04-24T09:04:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d9fdc5d4cc968784e6e937a1000e43650345c27765208d46611e1fe85ee9293
    source_path: cli/sessions.md
    workflow: 15
---

# `openclaw sessions`

Wyświetl zapisane sesje rozmów.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Wybór zakresu:

- domyślnie: magazyn domyślnego skonfigurowanego agenta
- `--verbose`: szczegółowe logowanie
- `--agent <id>`: magazyn jednego skonfigurowanego agenta
- `--all-agents`: agreguje wszystkie magazyny skonfigurowanych agentów
- `--store <path>`: jawna ścieżka magazynu (nie można łączyć z `--agent` ani `--all-agents`)

`openclaw sessions --all-agents` odczytuje magazyny skonfigurowanych agentów. Odkrywanie sesji przez Gateway i ACP
jest szersze: obejmuje również magazyny znajdujące się tylko na dysku pod
domyślnym korzeniem `agents/` albo templatyzowanym korzeniem `session.store`. Takie
wykryte magazyny muszą wskazywać zwykłe pliki `sessions.json` wewnątrz katalogu głównego
agenta; dowiązania symboliczne i ścieżki poza katalogiem głównym są pomijane.

Przykłady JSON:

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Konserwacja czyszczenia

Uruchom konserwację teraz (zamiast czekać na kolejny cykl zapisu):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` używa ustawień `session.maintenance` z konfiguracji:

- Uwaga dotycząca zakresu: `openclaw sessions cleanup` konserwuje tylko magazyny sesji/transkrypty. Nie przycina logów uruchomień Cron (`cron/runs/<jobId>.jsonl`), którymi zarządzają `cron.runLog.maxBytes` i `cron.runLog.keepLines` w [konfiguracji Cron](/pl/automation/cron-jobs#configuration) i które są opisane w [konserwacji Cron](/pl/automation/cron-jobs#maintenance).

- `--dry-run`: podgląd liczby wpisów, które zostałyby usunięte/ograniczone bez zapisu.
  - W trybie tekstowym dry-run wypisuje tabelę działań per sesja (`Action`, `Key`, `Age`, `Model`, `Flags`), aby pokazać, co zostałoby zachowane, a co usunięte.
- `--enforce`: stosuje konserwację nawet wtedy, gdy `session.maintenance.mode` ma wartość `warn`.
- `--fix-missing`: usuwa wpisy, których pliki transkryptów nie istnieją, nawet jeśli normalnie nie zostałyby jeszcze usunięte z powodu wieku/liczby.
- `--active-key <key>`: chroni określony aktywny klucz przed usunięciem z powodu budżetu dyskowego.
- `--agent <id>`: uruchamia cleanup dla magazynu jednego skonfigurowanego agenta.
- `--all-agents`: uruchamia cleanup dla wszystkich magazynów skonfigurowanych agentów.
- `--store <path>`: uruchamia na określonym pliku `sessions.json`.
- `--json`: wypisuje podsumowanie JSON. Przy `--all-agents` dane wyjściowe zawierają jedno podsumowanie na magazyn.

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

Powiązane:

- Konfiguracja sesji: [Dokumentacja konfiguracji](/pl/gateway/config-agents#session)

## Powiązane

- [Dokumentacja CLI](/pl/cli)
- [Zarządzanie sesjami](/pl/concepts/session)
