---
read_when:
    - Chcesz wyświetlić zapisane sesje i zobaczyć ostatnią aktywność
summary: Dokumentacja CLI dla `openclaw sessions` (lista zapisanych sesji + użycie)
title: Sesje
x-i18n:
    generated_at: "2026-04-30T09:45:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fea2014f538b00a27fa0078391a421843052333c5bcfc8100fced515eed0004
    source_path: cli/sessions.md
    workflow: 16
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

Wyeksportuj pakiet trajektorii dla zapisanej sesji:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

To jest ścieżka polecenia używana przez polecenie z ukośnikiem `/export-trajectory` po
zatwierdzeniu żądania wykonania przez właściciela. Katalog wyjściowy jest zawsze rozwiązywany
wewnątrz `.openclaw/trajectory-exports/` w wybranym obszarze roboczym.

`openclaw sessions --all-agents` odczytuje skonfigurowane magazyny agentów. Wykrywanie sesji
Gateway i ACP ma szerszy zakres: obejmuje także magazyny istniejące tylko na dysku, znalezione
pod domyślnym katalogiem głównym `agents/` albo szablonowym katalogiem głównym `session.store`.
Te wykryte magazyny muszą rozwiązywać się do zwykłych plików `sessions.json` wewnątrz katalogu
głównego agenta; dowiązania symboliczne i ścieżki poza katalogiem głównym są pomijane.

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

Uruchom konserwację teraz (zamiast czekać na następny cykl zapisu):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` używa ustawień `session.maintenance` z konfiguracji:

- Uwaga dotycząca zakresu: `openclaw sessions cleanup` utrzymuje magazyny sesji, transkrypty i pliki poboczne trajektorii. Nie przycina dzienników uruchomień cron (`cron/runs/<jobId>.jsonl`), którymi zarządzają `cron.runLog.maxBytes` i `cron.runLog.keepLines` w [konfiguracji Cron](/pl/automation/cron-jobs#configuration) oraz które opisano w [konserwacji Cron](/pl/automation/cron-jobs#maintenance).

- `--dry-run`: podgląd liczby wpisów, które zostałyby przycięte/ograniczone bez zapisywania.
  - W trybie tekstowym dry-run wypisuje tabelę działań dla każdej sesji (`Action`, `Key`, `Age`, `Model`, `Flags`), aby było widać, co zostałoby zachowane, a co usunięte.
- `--enforce`: zastosuj konserwację nawet wtedy, gdy `session.maintenance.mode` ma wartość `warn`.
- `--fix-missing`: usuń wpisy, których plików transkryptu brakuje, nawet jeśli normalnie nie zostałyby jeszcze usunięte z powodu wieku/liczby.
- `--active-key <key>`: chroń określony aktywny klucz przed eksmisją z powodu budżetu dysku.
- `--agent <id>`: uruchom czyszczenie dla jednego skonfigurowanego magazynu agenta.
- `--all-agents`: uruchom czyszczenie dla wszystkich skonfigurowanych magazynów agentów.
- `--store <path>`: uruchom względem konkretnego pliku `sessions.json`.
- `--json`: wypisz podsumowanie JSON. Z `--all-agents` wynik zawiera po jednym podsumowaniu dla każdego magazynu.

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
