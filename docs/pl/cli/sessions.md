---
read_when:
    - Chcesz wyświetlić zapisane sesje i zobaczyć ostatnią aktywność
summary: Dokumentacja referencyjna CLI dla `openclaw sessions` (lista zapisanych sesji + użycie)
title: Sesje
x-i18n:
    generated_at: "2026-05-04T07:02:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dc90344f40c53513bd6db3696bc709279155f26e7c3b6ea27e81a07a2f9f15e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Wyświetla listę zapisanych sesji konwersacji.

Listy sesji nie są sprawdzeniem aktywności kanału/dostawcy. Pokazują utrwalone
wiersze konwersacji z magazynów sesji. Cichy Discord, Slack, Telegram lub
inny kanał może ponownie połączyć się pomyślnie bez utworzenia nowego wiersza
sesji, dopóki nie zostanie przetworzona wiadomość. Użyj `openclaw channels status --probe`,
`openclaw status --deep` lub `openclaw health --verbose`, gdy potrzebujesz
łączności kanału na żywo.

Odpowiedzi Gateway `sessions.list` są domyślnie ograniczone, aby duże, długo działające
magazyny nie mogły zmonopolizować pętli zdarzeń Gateway. Przekaż jawny dodatni
`limit` z klientów RPC, gdy potrzebne jest inne okno wyników; odpowiedzi
zawierają `totalCount`, `limitApplied` i `hasMore`, gdy wywołujący muszą pokazać,
że istnieje więcej wierszy.

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

Eksport pakietu trajektorii dla zapisanej sesji:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

To jest ścieżka polecenia używana przez polecenie slash `/export-trajectory` po tym,
jak właściciel zatwierdzi żądanie wykonania. Katalog wyjściowy jest zawsze rozwiązywany
wewnątrz `.openclaw/trajectory-exports/` w wybranym obszarze roboczym.

`openclaw sessions --all-agents` odczytuje skonfigurowane magazyny agentów. Wykrywanie
sesji Gateway i ACP jest szersze: obejmuje także magazyny istniejące tylko na dysku,
znalezione w domyślnym katalogu głównym `agents/` lub w szablonowym katalogu głównym
`session.store`. Te wykryte magazyny muszą wskazywać zwykłe pliki `sessions.json`
wewnątrz katalogu głównego agenta; dowiązania symboliczne i ścieżki poza katalogiem
głównym są pomijane.

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

- Uwaga dotycząca zakresu: `openclaw sessions cleanup` konserwuje magazyny sesji, transkrypty i pliki towarzyszące trajektorii. Nie przycina dzienników uruchomień Cron (`cron/runs/<jobId>.jsonl`), którymi zarządzają `cron.runLog.maxBytes` i `cron.runLog.keepLines` w [konfiguracji Cron](/pl/automation/cron-jobs#configuration) i które są wyjaśnione w [konserwacji Cron](/pl/automation/cron-jobs#maintenance).

- `--dry-run`: podgląd, ile wpisów zostałoby przyciętych/ograniczonych bez zapisywania.
  - W trybie tekstowym dry-run wypisuje tabelę działań dla każdej sesji (`Action`, `Key`, `Age`, `Model`, `Flags`), aby było widać, co zostałoby zachowane, a co usunięte.
- `--enforce`: zastosuj konserwację nawet wtedy, gdy `session.maintenance.mode` ma wartość `warn`.
- `--fix-missing`: usuń wpisy, których pliki transkryptów nie istnieją, nawet jeśli normalnie nie zostałyby jeszcze usunięte ze względu na wiek/liczbę.
- `--active-key <key>`: chroń określony aktywny klucz przed usunięciem z powodu budżetu dysku. Trwałe zewnętrzne wskaźniki konwersacji, takie jak sesje grupowe i sesje czatu o zakresie wątku, także są zachowywane przez konserwację według wieku/liczby/budżetu dysku.
- `--agent <id>`: uruchom czyszczenie dla jednego skonfigurowanego magazynu agenta.
- `--all-agents`: uruchom czyszczenie dla wszystkich skonfigurowanych magazynów agentów.
- `--store <path>`: uruchom względem konkretnego pliku `sessions.json`.
- `--json`: wypisz podsumowanie JSON. Z `--all-agents` dane wyjściowe zawierają jedno podsumowanie na magazyn.

Gdy Gateway jest osiągalny, czyszczenie bez dry-run dla skonfigurowanych magazynów agentów
jest wysyłane przez Gateway, aby współdzieliło ten sam zapisujący magazyn sesji co ruch
w czasie działania. Użyj `--store <path>` do jawnej naprawy pliku magazynu offline.

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

- Konfiguracja sesji: [Informacje o konfiguracji](/pl/gateway/config-agents#session)

## Powiązane

- [Informacje o CLI](/pl/cli)
- [Zarządzanie sesjami](/pl/concepts/session)
