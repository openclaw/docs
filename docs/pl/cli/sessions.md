---
read_when:
    - Chcesz wyświetlić zapisane sesje i zobaczyć ostatnią aktywność
summary: Dokumentacja CLI dla `openclaw sessions` (wyświetlanie zapisanych sesji + użycia)
title: sessions
x-i18n:
    generated_at: "2026-04-05T13:49:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47eb55d90bd0681676283310cfa50dcacc95dff7d9a39bf2bb188788c6e5e5ba
    source_path: cli/sessions.md
    workflow: 15
---

# `openclaw sessions`

Wyświetl zapisane sesje konwersacji.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Wybór zakresu:

- domyślnie: skonfigurowany domyślny magazyn agenta
- `--verbose`: szczegółowe logowanie
- `--agent <id>`: jeden skonfigurowany magazyn agenta
- `--all-agents`: agreguj wszystkie skonfigurowane magazyny agentów
- `--store <path>`: jawna ścieżka magazynu (nie można łączyć z `--agent` ani `--all-agents`)

`openclaw sessions --all-agents` odczytuje skonfigurowane magazyny agentów. Wykrywanie sesji Gateway i ACP
jest szersze: obejmuje także magazyny tylko na dysku znalezione pod
domyślnym katalogiem głównym `agents/` lub templatyzowanym katalogiem głównym `session.store`. Te
wykryte magazyny muszą rozwiązywać się do zwykłych plików `sessions.json` wewnątrz
katalogu głównego agenta; symlinki i ścieżki poza katalogiem głównym są pomijane.

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

## Utrzymanie czyszczenia

Uruchom utrzymanie teraz (zamiast czekać do następnego cyklu zapisu):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` używa ustawień `session.maintenance` z konfiguracji:

- Uwaga dotycząca zakresu: `openclaw sessions cleanup` utrzymuje tylko magazyny sesji/transkrypty. Nie przycina logów uruchomień cron (`cron/runs/<jobId>.jsonl`), którymi zarządzają `cron.runLog.maxBytes` i `cron.runLog.keepLines` w [Konfiguracji Cron](/pl/automation/cron-jobs#configuration), a które są wyjaśnione w [Utrzymaniu Cron](/pl/automation/cron-jobs#maintenance).

- `--dry-run`: podejrzyj, ile wpisów zostałoby przyciętych/ograniczonych bez zapisu.
  - W trybie tekstowym dry-run drukuje tabelę działań per sesja (`Action`, `Key`, `Age`, `Model`, `Flags`), aby było widać, co zostałoby zachowane, a co usunięte.
- `--enforce`: zastosuj utrzymanie nawet wtedy, gdy `session.maintenance.mode` ma wartość `warn`.
- `--fix-missing`: usuń wpisy, których pliki transkryptu są brakujące, nawet jeśli normalnie nie zostałyby jeszcze usunięte ze względu na wiek/liczność.
- `--active-key <key>`: chroń określony aktywny klucz przed usunięciem z powodu limitu miejsca na dysku.
- `--agent <id>`: uruchom czyszczenie dla jednego skonfigurowanego magazynu agenta.
- `--all-agents`: uruchom czyszczenie dla wszystkich skonfigurowanych magazynów agentów.
- `--store <path>`: uruchom względem konkretnego pliku `sessions.json`.
- `--json`: wypisz podsumowanie JSON. Z `--all-agents` wyjście zawiera jedno podsumowanie na magazyn.

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

- Konfiguracja sesji: [Dokumentacja konfiguracji](/gateway/configuration-reference#session)
