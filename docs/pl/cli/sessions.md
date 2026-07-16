---
read_when:
    - Chcesz wyświetlić zapisane sesje i zobaczyć ostatnią aktywność
summary: Dokumentacja CLI dla `openclaw sessions` (lista zapisanych sesji i użycie)
title: Sesje
x-i18n:
    generated_at: "2026-07-16T18:15:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e00d846229dfad1ada1a8c9a548e26f26247d3f7e5a35106903f6cd4818878b5
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Wyświetla zapisane sesje konwersacji.

Listy sesji nie służą do sprawdzania dostępności kanału ani dostawcy. Pokazują utrwalone
wiersze konwersacji z magazynów sesji. Nieaktywny Discord, Slack, Telegram lub
inny kanał może pomyślnie nawiązać ponowne połączenie bez utworzenia nowego wiersza sesji,
dopóki wiadomość nie zostanie przetworzona. Gdy potrzebne jest sprawdzenie bieżącej
łączności kanału, należy użyć `openclaw channels status --probe`,
`openclaw status --deep` lub `openclaw health --verbose`.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --store ./tmp/sessions.json
openclaw sessions --json
```

Flagi:

| Flaga                 | Opis                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| `--agent <id>`       | Jeden skonfigurowany magazyn agenta (domyślnie: skonfigurowany agent domyślny).        |
| `--all-agents`       | Agreguje wszystkie skonfigurowane magazyny agentów.                                 |
| `--store <path>`     | Jawna ścieżka magazynu (nie można łączyć z `--agent` ani `--all-agents`). |
| `--active <minutes>` | Wyświetla tylko sesje zaktualizowane w ciągu ostatnich N minut.                  |
| `--limit <n\|all>`   | Maksymalna liczba zwracanych wierszy (domyślnie `100`; `all` przywraca pełne dane wyjściowe).        |
| `--json`             | Dane wyjściowe do odczytu maszynowego.                                               |
| `--verbose`          | Szczegółowe rejestrowanie.                                                       |

`openclaw sessions` oraz RPC `sessions.list` Gateway mają domyślnie ograniczony zakres,
aby duże, długotrwałe magazyny nie mogły zmonopolizować procesu CLI ani pętli zdarzeń
Gateway. CLI domyślnie zwraca 100 najnowszych sesji; należy przekazać `--limit <n>`,
aby uzyskać mniejszy lub większy zakres, albo `--limit all`, gdy celowo potrzebny jest
pełny magazyn. Odpowiedzi JSON zawierają `totalCount`, `limitApplied` oraz `hasMore`,
gdy wywołujący muszą wskazać, że istnieją dodatkowe wiersze.

Klienty RPC mogą przekazać `configuredAgentsOnly: true`, aby zachować szerokie,
połączone źródło wykrywania, ale zwrócić tylko wiersze agentów obecnych obecnie w konfiguracji.
Control UI domyślnie używa tego trybu, dzięki czemu usunięte magazyny agentów lub magazyny
istniejące wyłącznie na dysku nie pojawiają się ponownie w widoku sesji.

`--all-agents` odczytuje skonfigurowane magazyny agentów. Wykrywanie sesji przez Gateway i ACP
ma szerszy zakres: obejmuje również magazyny SQLite rozpoznane na podstawie
skonfigurowanych katalogów głównych agentów lub szablonowego katalogu głównego `session.store`. Starsze ścieżki
selektorów muszą być rozpoznawane wewnątrz katalogu głównego agenta; dowiązania symboliczne i ścieżki
wychodzące poza ten katalog są pomijane.

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
    { "agentId": "main", "key": "agent:main:main", "model": "openai/gpt-5.6-sol" },
    { "agentId": "work", "key": "agent:work:main", "model": "anthropic/claude-sonnet-4-6" }
  ]
}
```

## Śledzenie postępu trajektorii

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` przedstawia ostatnie zdarzenia trajektorii środowiska wykonawczego jako zwięzłe
wiersze postępu. Bez `--session-key` najpierw śledzi uruchomione sesje, a następnie
najnowszą zapisaną sesję. `--tail <count>` określa liczbę istniejących zdarzeń
wyświetlanych przed przejściem w tryb śledzenia; wartość domyślna to `80`, a `0` rozpoczyna od bieżącego końca.
`--follow` kontynuuje obserwowanie wybranej sesji opartej na SQLite lub jawnie
wskazanego starszego pliku trajektorii.

Widok postępu jest celowo zachowawczy: tekst promptu, argumenty narzędzi
ani treści wyników narzędzi nie są wyświetlane. Wywołania narzędzi pokazują nazwę narzędzia wraz z
`{...redacted...}`; wyniki narzędzi pokazują stan, taki jak `ok`, `error` lub `done`;
wiersze ukończenia modelu pokazują dostawcę/model i stan końcowy.

## Eksport pakietu trajektorii

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Jest to ścieżka polecenia używana przez polecenie ukośnikowe `/export-trajectory` po
zatwierdzeniu żądania wykonania przez właściciela. Katalog wyjściowy jest zawsze rozpoznawany
wewnątrz `.openclaw/trajectory-exports/` w wybranym obszarze roboczym.

## Konserwacyjne czyszczenie

Konserwację można uruchomić teraz zamiast czekać na kolejny cykl zapisu:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` używa ustawień `session.maintenance` z konfiguracji
([Dokumentacja konfiguracji](/pl/gateway/config-agents#session)):

- Uwaga dotycząca zakresu: `openclaw sessions cleanup` utrzymuje magazyny sesji,
  transkrypcje, wiersze trajektorii i starsze pliki pomocnicze trajektorii. Nie
  usuwa historii uruchomień Cron, która automatycznie zachowuje 2000 najnowszych wierszy dla każdego zadania
  ([Konfiguracja Cron](/pl/automation/cron-jobs#configuration)).
- Czyszczenie usuwa również nieużywane starsze/zarchiwizowane artefakty transkrypcji,
  punkty kontrolne Compaction oraz pliki pomocnicze trajektorii starsze niż
  `session.maintenance.pruneAfter`; artefakty nadal wskazywane przez wiersze sesji SQLite
  są zachowywane.
- Czyszczenie raportuje osobno usuwanie krótkotrwałych sond uruchomień modeli Gateway jako
  `modelRunPruned`. Dopasowywane są wyłącznie ścisłe, jawne klucze o postaci
  `agent:*:explicit:model-run-<uuid>`. Okres przechowywania ma stałą wartość `24h`, a usuwanie
  zależy od presji: nieaktualne wiersze sond są usuwane tylko po osiągnięciu
  progu konserwacji lub limitu wpisów sesji. Gdy operacja jest wykonywana, czyszczenie uruchomień modeli
  następuje przed globalnym usuwaniem nieaktualnych danych i stosowaniem limitów.

Flagi:

| Flaga                 | Opis                                                                                                                                                                                                                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--dry-run`          | Wyświetla podgląd liczby wpisów, które zostałyby usunięte lub objęte limitem, bez zapisywania zmian. W trybie tekstowym wyświetla tabelę działań dla poszczególnych sesji (`Action`, `Key`, `Age`, `Model`, `Flags`) oraz podsumowanie pogrupowane według etykiety sesji.                                                                                                       |
| `--enforce`          | Stosuje konserwację nawet wtedy, gdy `session.maintenance.mode` ma wartość `warn`.                                                                                                                                                                                                                                          |
| `--fix-missing`      | Usuwa starsze wpisy, których zarchiwizowane artefakty transkrypcji nie istnieją albo zawierają wyłącznie nagłówek lub są puste, nawet jeśli zwykle nie zostałyby jeszcze usunięte ze względu na wiek lub liczbę.                                                                                                                                                             |
| `--fix-dm-scope`     | Gdy `session.dmScope` ma wartość `main`, wycofuje nieaktualne wiersze bezpośrednich wiadomości prywatnych indeksowane kluczem uczestnika, pozostawione przez wcześniejsze trasowanie `per-peer`, `per-channel-peer` lub `per-account-channel-peer`. Najpierw należy użyć `--dry-run`; zastosowanie tej operacji usuwa te wiersze z SQLite i zachowuje ich starsze artefakty transkrypcji jako usunięte archiwa. |
| `--active-key <key>` | Chroni określony aktywny klucz przed usunięciem z powodu limitu miejsca na dysku. Trwałe zewnętrzne wskaźniki konwersacji, takie jak sesje grupowe i sesje czatu ograniczone do wątku, są również zachowywane podczas konserwacji według wieku, liczby i limitu miejsca na dysku.                                                                                               |
| `--agent <id>`       | Uruchamia czyszczenie dla jednego skonfigurowanego magazynu agenta.                                                                                                                                                                                                                                                                |
| `--all-agents`       | Uruchamia czyszczenie dla wszystkich skonfigurowanych magazynów agentów.                                                                                                                                                                                                                                                               |
| `--store <path>`     | Uruchamia operację dla określonej ścieżki selektora starszego magazynu.                                                                                                                                                                                                                                                         |
| `--json`             | Wyświetla podsumowanie JSON. W połączeniu z `--all-agents` dane wyjściowe zawierają osobne podsumowanie dla każdego magazynu.                                                                                                                                                                                                                          |

Gdy Gateway jest dostępny, czyszczenie skonfigurowanych magazynów agentów inne niż próbne
jest przesyłane przez Gateway, dzięki czemu korzysta z tego samego mechanizmu zapisu magazynu sesji co
ruch środowiska wykonawczego. Do jawnej naprawy offline selektora starszego magazynu
należy użyć `--store <path>`.

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

## Kompaktowanie sesji

Odzyskuje budżet kontekstu dla zablokowanej lub zbyt dużej sesji. `openclaw sessions
compact <key>` jest pełnoprawną nakładką na RPC `sessions.compact`
Gateway i wymaga uruchomionego Gateway.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Bez `--max-lines` Gateway podsumowuje transkrypcję za pomocą LLM. CLI
  domyślnie nie narzuca limitu czasu po stronie klienta; Gateway zarządza
  skonfigurowanym cyklem życia Compaction.
- Z `--max-lines <n>` transkrypcja jest skracana do ostatnich `n` wierszy, a
  wcześniejsza transkrypcja zostaje zarchiwizowana jako plik pomocniczy `.bak`.
- `--agent <id>`: agent będący właścicielem sesji; wymagany dla kluczy `global`.
- `--url` / `--token` / `--password`: ustawienia zastępujące połączenie z Gateway.
- `--timeout <ms>`: opcjonalny limit czasu RPC po stronie klienta w milisekundach.
- `--json`: wyświetla nieprzetworzony ładunek RPC.

Polecenie kończy się kodem różnym od zera, gdy Gateway zgłasza nieudaną operację Compaction lub jest
nieosiągalny, dzięki czemu zadania Cron i skrypty nigdy nie uznają bezgłośnej operacji bez efektu za sukces.

<Note>
`openclaw agent --message '/compact ...'` **nie jest** ścieżką Compaction. Polecenia
ukośnikowe z CLI są odrzucane przez kontrolę autoryzowanego nadawcy; to
wywołanie kończy się kodem różnym od zera i wyświetla wskazówki prowadzące tutaj, zamiast
bezgłośnie nie wykonywać żadnej operacji.
</Note>

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` przyjmuje:

| Pole       | Typ         | Wymagane | Opis                                                       |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | ciąg znaków | tak      | Klucz sesji do kompaktowania (na przykład `agent:main:main`). |
| `agentId`  | ciąg znaków | nie      | Identyfikator agenta będącego właścicielem sesji (dla kluczy `global`). |
| `maxLines` | liczba całkowita ≥ 1 | nie       | Przycięcie do ostatnich N wierszy zamiast podsumowania przez LLM. |

Przykładowa odpowiedź podsumowania przez LLM:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Przykładowa odpowiedź przycięcia (`--max-lines 200`):

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "archived": "/home/user/.openclaw/agents/main/sessions/transcripts/<id>.jsonl.bak",
  "kept": 200
}
```

## Powiązane

- [Konfiguracja sesji](/pl/gateway/config-agents#session)
- [Zarządzanie sesjami](/pl/concepts/session)
- [Compaction](/pl/concepts/compaction)
- [Dokumentacja CLI](/pl/cli)
