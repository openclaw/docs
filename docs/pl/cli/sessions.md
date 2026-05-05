---
read_when:
    - Chcesz wyświetlić zapisane sesje i zobaczyć ostatnią aktywność
summary: Dokumentacja referencyjna CLI dla `openclaw sessions` (wyświetlanie zapisanych sesji + użycie)
title: Sesje
x-i18n:
    generated_at: "2026-05-05T08:25:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: a204189952bc82788eb724c0a6b6db93c7d6795ad69bb6d498e8575236c3272e
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Wyświetla listę zapisanych sesji rozmów.

Listy sesji nie są kontrolami dostępności kanału/dostawcy. Pokazują utrwalone
wiersze rozmów z magazynów sesji. Cichy Discord, Slack, Telegram lub
inny kanał może ponownie połączyć się pomyślnie bez tworzenia nowego wiersza
sesji, dopóki nie zostanie przetworzona wiadomość. Użyj `openclaw channels status --probe`,
`openclaw status --deep` lub `openclaw health --verbose`, gdy potrzebujesz aktywnej
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
zatwierdzeniu żądania exec przez właściciela. Katalog wyjściowy jest zawsze rozwiązywany
wewnątrz `.openclaw/trajectory-exports/` w wybranym obszarze roboczym.

`openclaw sessions --all-agents` odczytuje skonfigurowane magazyny agentów. Wykrywanie sesji
Gateway i ACP jest szersze: obejmuje też magazyny wyłącznie na dysku znalezione pod
domyślnym korzeniem `agents/` lub szablonowym korzeniem `session.store`. Te
wykryte magazyny muszą rozwiązywać się do zwykłych plików `sessions.json` wewnątrz
korzenia agenta; dowiązania symboliczne i ścieżki poza korzeniem są pomijane.

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

- Uwaga dotycząca zakresu: `openclaw sessions cleanup` konserwuje magazyny sesji, transkrypty i powiązane pliki trajektorii. Nie przycina dzienników uruchomień cron (`cron/runs/<jobId>.jsonl`), które są zarządzane przez `cron.runLog.maxBytes` i `cron.runLog.keepLines` w [konfiguracji Cron](/pl/automation/cron-jobs#configuration) oraz wyjaśnione w [konserwacji Cron](/pl/automation/cron-jobs#maintenance).
- Czyszczenie przycina też nieodwoływane transkrypty podstawowe, punkty kontrolne Compaction oraz powiązane pliki trajektorii starsze niż `session.maintenance.pruneAfter`; pliki nadal wskazywane przez `sessions.json` są zachowywane.

- `--dry-run`: podgląd liczby wpisów, które zostałyby przycięte/ograniczone bez zapisywania.
  - W trybie tekstowym dry-run wypisuje tabelę działań dla poszczególnych sesji (`Action`, `Key`, `Age`, `Model`, `Flags`), aby pokazać, co zostałoby zachowane, a co usunięte.
- `--enforce`: stosuje konserwację nawet wtedy, gdy `session.maintenance.mode` ma wartość `warn`.
- `--fix-missing`: usuwa wpisy, których pliki transkryptów nie istnieją, nawet jeśli normalnie nie zostałyby jeszcze usunięte ze względu na wiek/liczbę.
- `--active-key <key>`: chroni określony aktywny klucz przed usunięciem w ramach budżetu dyskowego. Trwałe zewnętrzne wskaźniki rozmów, takie jak sesje grupowe i sesje czatu ograniczone do wątku, są również zachowywane przez konserwację opartą na wieku/liczbie/budżecie dyskowym.
- `--agent <id>`: uruchamia czyszczenie dla jednego skonfigurowanego magazynu agenta.
- `--all-agents`: uruchamia czyszczenie dla wszystkich skonfigurowanych magazynów agentów.
- `--store <path>`: uruchamia wobec konkretnego pliku `sessions.json`.
- `--json`: wypisuje podsumowanie JSON. Z `--all-agents` wyjście zawiera jedno podsumowanie na magazyn.

Gdy Gateway jest osiągalny, czyszczenie bez dry-run dla skonfigurowanych magazynów agentów jest
wysyłane przez Gateway, aby współdzieliło ten sam mechanizm zapisu magazynu sesji co ruch
środowiska wykonawczego. Użyj `--store <path>` do jawnej naprawy offline pliku magazynu.

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
