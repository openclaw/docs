---
read_when:
    - Chcesz wyświetlić zapisane sesje i zobaczyć ostatnią aktywność
summary: Dokumentacja referencyjna CLI dla `openclaw sessions` (lista zapisanych sesji + użycie)
title: Sesje
x-i18n:
    generated_at: "2026-05-07T13:14:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdfdc9223f11da87b514f96e0a9505286e36d98647b3ff3a79b90588e4e69c1b
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Wyświetla zapisane sesje konwersacji.

Listy sesji nie są kontrolami aktywności kanału/dostawcy. Pokazują utrwalone
wiersze konwersacji z magazynów sesji. Cichy Discord, Slack, Telegram lub
inny kanał może ponownie połączyć się pomyślnie bez utworzenia nowego wiersza
sesji, dopóki wiadomość nie zostanie przetworzona. Użyj `openclaw channels status --probe`,
`openclaw status --deep` lub `openclaw health --verbose`, gdy potrzebujesz
aktywnej łączności kanału.

Odpowiedzi `openclaw sessions` i Gateway `sessions.list` są domyślnie ograniczone,
aby duże, długo działające magazyny nie mogły zmonopolizować procesu CLI ani
pętli zdarzeń Gateway. CLI domyślnie zwraca najnowsze 100 sesji; przekaż
`--limit <n>` dla mniejszego/większego okna albo `--limit all`, gdy celowo
potrzebujesz pełnego magazynu. Odpowiedzi JSON zawierają `totalCount`, `limitApplied` i
`hasMore`, gdy wywołujący muszą pokazać, że istnieje więcej wierszy.

Klienci RPC mogą przekazać `configuredAgentsOnly: true`, aby zachować szerokie,
połączone źródło wykrywania, ale zwracać tylko wiersze dla agentów obecnie
obecnych w konfiguracji. Control UI używa tego trybu domyślnie, więc usunięte
lub istniejące tylko na dysku magazyny agentów nie pojawiają się ponownie w widoku Sesje.

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

Eksport pakietu trajektorii dla zapisanej sesji:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

To ścieżka polecenia używana przez polecenie ukośnikowe `/export-trajectory` po
zatwierdzeniu żądania exec przez właściciela. Katalog wyjściowy jest zawsze rozwiązywany
wewnątrz `.openclaw/trajectory-exports/` w wybranym obszarze roboczym.

`openclaw sessions --all-agents` odczytuje skonfigurowane magazyny agentów. Wykrywanie sesji
Gateway i ACP jest szersze: obejmuje również magazyny istniejące tylko na dysku, znalezione pod
domyślnym katalogiem głównym `agents/` lub szablonowym katalogiem głównym `session.store`. Te
wykryte magazyny muszą rozwiązywać się do zwykłych plików `sessions.json` wewnątrz katalogu
głównego agenta; dowiązania symboliczne i ścieżki spoza katalogu głównego są pomijane.

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

## Utrzymanie porządkowe

Uruchom utrzymanie teraz (zamiast czekać na następny cykl zapisu):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` używa ustawień `session.maintenance` z konfiguracji:

- Uwaga dotycząca zakresu: `openclaw sessions cleanup` utrzymuje magazyny sesji, transkrypty i pliki towarzyszące trajektorii. Nie przycina dzienników uruchomień cron (`cron/runs/<jobId>.jsonl`), którymi zarządzają `cron.runLog.maxBytes` i `cron.runLog.keepLines` w [konfiguracji Cron](/pl/automation/cron-jobs#configuration) oraz które wyjaśniono w [utrzymaniu Cron](/pl/automation/cron-jobs#maintenance).
- Porządkowanie przycina także nieprzywoływane główne transkrypty, punkty kontrolne Compaction i pliki towarzyszące trajektorii starsze niż `session.maintenance.pruneAfter`; pliki nadal przywoływane przez `sessions.json` są zachowywane.

- `--dry-run`: podgląd liczby wpisów, które zostałyby przycięte/ograniczone bez zapisywania.
  - W trybie tekstowym dry-run wypisuje tabelę działań dla każdej sesji (`Action`, `Key`, `Age`, `Model`, `Flags`), aby można było zobaczyć, co zostałoby zachowane, a co usunięte.
- `--enforce`: stosuje utrzymanie nawet wtedy, gdy `session.maintenance.mode` ma wartość `warn`.
- `--fix-missing`: usuwa wpisy, których plików transkryptu brakuje, nawet jeśli normalnie nie zostałyby jeszcze usunięte z powodu wieku/liczby.
- `--fix-dm-scope`: gdy `session.dmScope` ma wartość `main`, wycofuje przestarzałe wiersze bezpośrednich DM kluczowanych według rozmówcy, pozostawione przez wcześniejsze trasowanie `per-peer`, `per-channel-peer` lub `per-account-channel-peer`. Najpierw użyj `--dry-run`; zastosowanie porządkowania usuwa te wiersze z `sessions.json` i zachowuje ich transkrypty jako usunięte archiwa.
- `--active-key <key>`: chroni określony aktywny klucz przed eksmisją z budżetu dyskowego. Trwałe zewnętrzne wskaźniki konwersacji, takie jak sesje grupowe i sesje czatu ograniczone do wątku, są również zachowywane przez utrzymanie według wieku/liczby/budżetu dyskowego.
- `--agent <id>`: uruchamia porządkowanie dla jednego skonfigurowanego magazynu agenta.
- `--all-agents`: uruchamia porządkowanie dla wszystkich skonfigurowanych magazynów agentów.
- `--store <path>`: uruchamia wobec określonego pliku `sessions.json`.
- `--json`: wypisuje podsumowanie JSON. Z `--all-agents` wyjście zawiera jedno podsumowanie na magazyn.

Gdy Gateway jest osiągalny, porządkowanie bez dry-run dla skonfigurowanych magazynów agentów jest
wysyłane przez Gateway, aby współdzieliło ten sam zapis magazynu sesji co ruch
runtime. Użyj `--store <path>` do jawnej naprawy offline pliku magazynu.

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
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "missing": 0,
      "dmScopeRetired": 0,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

Powiązane:

- Konfiguracja sesji: [Odwołanie konfiguracji](/pl/gateway/config-agents#session)

## Powiązane

- [Odwołanie CLI](/pl/cli)
- [Zarządzanie sesjami](/pl/concepts/session)
