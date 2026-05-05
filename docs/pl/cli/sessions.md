---
read_when:
    - Chcesz wyświetlić zapisane sesje i zobaczyć ostatnią aktywność
summary: Dokumentacja referencyjna CLI dla `openclaw sessions` (wyświetlanie zapisanych sesji + użycie)
title: Sesje
x-i18n:
    generated_at: "2026-05-05T01:44:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eb484ab1fa7686cf42dd00e640c4ae8616c4ea1c29873ea72694d72b9c680e7
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Wyświetla zapisane sesje konwersacji.

Listy sesji nie są kontrolami dostępności kanału/dostawcy. Pokazują utrwalone
wiersze konwersacji z magazynów sesji. Nieaktywny kanał Discord, Slack, Telegram
lub inny kanał może ponownie połączyć się poprawnie bez utworzenia nowego wiersza
sesji, dopóki nie zostanie przetworzona wiadomość. Użyj `openclaw channels status --probe`,
`openclaw status --deep` lub `openclaw health --verbose`, gdy potrzebujesz bieżącej
łączności kanału.

Odpowiedzi `openclaw sessions` i Gateway `sessions.list` są domyślnie ograniczone,
aby duże, długo działające magazyny nie mogły zmonopolizować procesu CLI ani pętli
zdarzeń Gateway. CLI domyślnie zwraca 100 najnowszych sesji; przekaż
`--limit <n>` dla mniejszego/większego okna albo `--limit all`, gdy celowo
potrzebujesz pełnego magazynu. Odpowiedzi JSON zawierają `totalCount`, `limitApplied` i
`hasMore`, gdy wywołujący muszą pokazać, że istnieje więcej wierszy.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

Wybór zakresu:

- domyślnie: skonfigurowany domyślny magazyn agenta
- `--verbose`: szczegółowe logowanie
- `--agent <id>`: jeden skonfigurowany magazyn agenta
- `--all-agents`: agreguje wszystkie skonfigurowane magazyny agentów
- `--store <path>`: jawna ścieżka magazynu (nie można łączyć z `--agent` ani `--all-agents`)
- `--limit <n|all>`: maksymalna liczba wierszy do wypisania (domyślnie `100`; `all` przywraca pełne wyjście)

Wyeksportuj pakiet trajektorii dla zapisanej sesji:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

To jest ścieżka polecenia używana przez polecenie ukośnikowe `/export-trajectory` po
zatwierdzeniu żądania wykonania przez właściciela. Katalog wyjściowy jest zawsze rozwiązywany
wewnątrz `.openclaw/trajectory-exports/` w wybranym obszarze roboczym.

`openclaw sessions --all-agents` odczytuje skonfigurowane magazyny agentów. Odkrywanie
sesji przez Gateway i ACP jest szersze: obejmuje także magazyny istniejące tylko na dysku,
znalezione pod domyślnym katalogiem głównym `agents/` albo szablonowym katalogiem głównym
`session.store`. Te odkryte magazyny muszą wskazywać na zwykłe pliki `sessions.json`
wewnątrz katalogu głównego agenta; dowiązania symboliczne i ścieżki poza katalogiem głównym
są pomijane.

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
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Konserwacja porządkowa

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

- Uwaga dotycząca zakresu: `openclaw sessions cleanup` utrzymuje magazyny sesji, transkrypty i pliki pomocnicze trajektorii. Nie przycina dzienników uruchomień Cron (`cron/runs/<jobId>.jsonl`), którymi zarządzają `cron.runLog.maxBytes` i `cron.runLog.keepLines` w [konfiguracji Cron](/pl/automation/cron-jobs#configuration), wyjaśnionej w [konserwacji Cron](/pl/automation/cron-jobs#maintenance).

- `--dry-run`: podgląd liczby wpisów, które zostałyby przycięte/ograniczone bez zapisywania.
  - W trybie tekstowym próba na sucho wypisuje tabelę akcji dla każdej sesji (`Action`, `Key`, `Age`, `Model`, `Flags`), aby było widać, co zostałoby zachowane, a co usunięte.
- `--enforce`: stosuje konserwację nawet wtedy, gdy `session.maintenance.mode` ma wartość `warn`.
- `--fix-missing`: usuwa wpisy, których pliki transkryptów brakują, nawet jeśli normalnie nie zostałyby jeszcze usunięte z powodu wieku/liczby.
- `--active-key <key>`: chroni określony aktywny klucz przed eksmisją z powodu budżetu dyskowego. Trwałe zewnętrzne wskaźniki konwersacji, takie jak sesje grupowe i sesje czatu ograniczone do wątku, są również zachowywane przez konserwację według wieku/liczby/budżetu dyskowego.
- `--agent <id>`: uruchamia czyszczenie dla jednego skonfigurowanego magazynu agenta.
- `--all-agents`: uruchamia czyszczenie dla wszystkich skonfigurowanych magazynów agentów.
- `--store <path>`: uruchamia na określonym pliku `sessions.json`.
- `--json`: wypisuje podsumowanie JSON. Z `--all-agents` wyjście zawiera jedno podsumowanie na magazyn.

Gdy Gateway jest osiągalny, czyszczenie bez trybu próby na sucho dla skonfigurowanych magazynów agentów jest
wysyłane przez Gateway, aby współdzieliło ten sam zapisujący komponent magazynu sesji co ruch
uruchomieniowy. Użyj `--store <path>` do jawnej naprawy pliku magazynu w trybie offline.

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
