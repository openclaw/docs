---
read_when:
    - Chcesz wyświetlić zapisane sesje i zobaczyć ostatnią aktywność
summary: Referencja CLI dla `openclaw sessions` (lista zapisanych sesji + użycie)
title: Sesje
x-i18n:
    generated_at: "2026-05-02T09:46:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c7f0d521756ace4af05451b925256f89661bf971533541764c128e2be9d6431
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Wyświetl zapisane sesje konwersacji.

Listy sesji nie są testami aktywności kanału/dostawcy. Pokazują utrwalone
wiersze konwersacji z magazynów sesji. Cichy Discord, Slack, Telegram lub
inny kanał może ponownie połączyć się poprawnie bez tworzenia nowego wiersza
sesji, dopóki wiadomość nie zostanie przetworzona. Użyj `openclaw channels status --probe`,
`openclaw status --deep` lub `openclaw health --verbose`, gdy potrzebujesz aktywnej
łączności kanału.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Wybór zakresu:

- domyślnie: skonfigurowany magazyn agenta domyślnego
- `--verbose`: szczegółowe rejestrowanie
- `--agent <id>`: jeden skonfigurowany magazyn agenta
- `--all-agents`: agreguj wszystkie skonfigurowane magazyny agentów
- `--store <path>`: jawna ścieżka magazynu (nie można łączyć z `--agent` ani `--all-agents`)

Wyeksportuj pakiet trajektorii dla zapisanej sesji:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

To jest ścieżka polecenia używana przez polecenie ukośnikowe `/export-trajectory` po
zatwierdzeniu żądania exec przez właściciela. Katalog wyjściowy jest zawsze rozwiązywany
wewnątrz `.openclaw/trajectory-exports/` w wybranym obszarze roboczym.

`openclaw sessions --all-agents` odczytuje skonfigurowane magazyny agentów. Wykrywanie
sesji Gateway i ACP jest szersze: obejmuje także magazyny istniejące tylko na dysku,
znalezione pod domyślnym katalogiem głównym `agents/` albo szablonowym katalogiem głównym
`session.store`. Te wykryte magazyny muszą rozwiązywać się do zwykłych plików
`sessions.json` wewnątrz katalogu głównego agenta; dowiązania symboliczne i ścieżki poza
katalogiem głównym są pomijane.

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

- Uwaga dotycząca zakresu: `openclaw sessions cleanup` utrzymuje magazyny sesji, transkrypty i pliki pomocnicze trajektorii. Nie usuwa dzienników uruchomień cron (`cron/runs/<jobId>.jsonl`), które są zarządzane przez `cron.runLog.maxBytes` i `cron.runLog.keepLines` w [konfiguracji Cron](/pl/automation/cron-jobs#configuration) oraz wyjaśnione w [konserwacji Cron](/pl/automation/cron-jobs#maintenance).

- `--dry-run`: pokaż podgląd liczby wpisów, które zostałyby usunięte/przycięte bez zapisu.
  - W trybie tekstowym dry-run wypisuje tabelę działań dla każdej sesji (`Action`, `Key`, `Age`, `Model`, `Flags`), aby było widać, co zostałoby zachowane, a co usunięte.
- `--enforce`: zastosuj konserwację nawet wtedy, gdy `session.maintenance.mode` ma wartość `warn`.
- `--fix-missing`: usuń wpisy, których pliki transkryptów nie istnieją, nawet jeśli normalnie nie zostałyby jeszcze usunięte ze względu na wiek/liczbę.
- `--active-key <key>`: chroń konkretny aktywny klucz przed eksmisją z powodu budżetu dyskowego. Trwałe zewnętrzne wskaźniki konwersacji, takie jak sesje grupowe i sesje czatu ograniczone do wątku, są także zachowywane przez konserwację opartą na wieku/liczbie/budżecie dyskowym.
- `--agent <id>`: uruchom czyszczenie dla jednego skonfigurowanego magazynu agenta.
- `--all-agents`: uruchom czyszczenie dla wszystkich skonfigurowanych magazynów agentów.
- `--store <path>`: uruchom na określonym pliku `sessions.json`.
- `--json`: wypisz podsumowanie JSON. Z `--all-agents` dane wyjściowe obejmują po jednym podsumowaniu na magazyn.

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
