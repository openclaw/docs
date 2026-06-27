---
read_when:
    - Chcesz wyświetlić zapisane sesje i zobaczyć ostatnią aktywność
summary: Dokumentacja referencyjna CLI dla `openclaw sessions` (lista zapisanych sesji + użycie)
title: Sesje
x-i18n:
    generated_at: "2026-06-27T17:23:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b9454e4b6ef925f8f90b5e8beceb6bea6404539f460cb78bcf82e241dff168d
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Wyświetla zapisane sesje rozmów.

Listy sesji nie są kontrolami aktywności kanału ani dostawcy. Pokazują utrwalone
wiersze rozmów z magazynów sesji. Cichy Discord, Slack, Telegram lub inny kanał
może ponownie połączyć się pomyślnie bez utworzenia nowego wiersza sesji, dopóki
nie zostanie przetworzona wiadomość. Użyj `openclaw channels status --probe`,
`openclaw status --deep` albo `openclaw health --verbose`, gdy potrzebujesz
łączności kanału na żywo.

Odpowiedzi `openclaw sessions` i Gateway `sessions.list` są domyślnie ograniczone,
aby duże, długo działające magazyny nie mogły zmonopolizować procesu CLI ani
pętli zdarzeń Gateway. CLI domyślnie zwraca najnowsze 100 sesji; przekaż
`--limit <n>` dla mniejszego/większego okna albo `--limit all`, gdy celowo
potrzebujesz pełnego magazynu. Odpowiedzi JSON zawierają `totalCount`,
`limitApplied` i `hasMore`, gdy wywołujący muszą pokazać, że istnieje więcej
wierszy.

Klienci RPC mogą przekazać `configuredAgentsOnly: true`, aby zachować szerokie,
połączone źródło wykrywania, ale zwracać tylko wiersze dla agentów aktualnie
obecnych w konfiguracji. Control UI domyślnie używa tego trybu, dzięki czemu
usunięte lub istniejące tylko na dysku magazyny agentów nie pojawiają się ponownie
w widoku Sesje.

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

Śledzenie czytelnego dla człowieka postępu trajektorii zapisanych sesji:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` renderuje ostatnie zdarzenia trajektorii JSONL jako zwięzłe linie postępu. Bez `--session-key` najpierw śledzi uruchomione sesje, a następnie najnowszą zapisaną sesję. `--tail <count>` kontroluje, ile istniejących zdarzeń zostanie wypisanych przed trybem obserwowania; domyślnie jest to `80`, a `0` zaczyna od bieżącego końca. `--follow` kontynuuje obserwowanie wybranych plików trajektorii, w tym przeniesionych plików wskazanych przez `<session>.trajectory-path.json`.

Widok postępu jest celowo zachowawczy: tekst promptu, argumenty narzędzi i treści wyników narzędzi nie są wypisywane. Wywołania narzędzi pokazują nazwę narzędzia z `{...redacted...}`; wyniki narzędzi pokazują status, taki jak `ok`, `error` lub `done`; linie ukończenia modelu pokazują dostawcę/model i status końcowy.

Eksportowanie pakietu trajektorii dla zapisanej sesji:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

To ścieżka polecenia używana przez polecenie slash `/export-trajectory` po
zatwierdzeniu żądania wykonania przez właściciela. Katalog wyjściowy jest zawsze
rozwiązywany wewnątrz `.openclaw/trajectory-exports/` pod wybranym obszarem roboczym.

`openclaw sessions --all-agents` odczytuje skonfigurowane magazyny agentów. Wykrywanie
sesji Gateway i ACP jest szersze: obejmuje także magazyny istniejące tylko na dysku,
znalezione pod domyślnym katalogiem głównym `agents/` lub szablonowym katalogiem
głównym `session.store`. Te wykryte magazyny muszą rozwiązywać się do zwykłych
plików `sessions.json` wewnątrz katalogu głównego agenta; dowiązania symboliczne
i ścieżki poza katalogiem głównym są pomijane.

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
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` używa ustawień `session.maintenance` z konfiguracji:

- Uwaga o zakresie: `openclaw sessions cleanup` utrzymuje magazyny sesji, transkrypty i pliki towarzyszące trajektorii. Nie przycina historii uruchomień cron, którą zarządza `cron.runLog.keepLines` w [konfiguracji Cron](/pl/automation/cron-jobs#configuration) i którą wyjaśnia [konserwacja Cron](/pl/automation/cron-jobs#maintenance).
- Czyszczenie przycina także nieodwoływane główne transkrypty, punkty kontrolne Compaction i pliki towarzyszące trajektorii starsze niż `session.maintenance.pruneAfter`; pliki nadal wskazywane przez `sessions.json` są zachowywane.
- Czyszczenie raportuje krótkotrwałe czyszczenie sond uruchomień modelu Gateway osobno jako `modelRunPruned`. Dopasowuje to tylko ścisłe, jawne klucze o postaci `agent:*:explicit:model-run-<uuid>`. Stały okres przechowywania to `24h`, ale jest ograniczony presją: usuwa przestarzałe wiersze sond tylko wtedy, gdy konserwacja wpisów sesji albo presja limitu zostanie osiągnięta. Gdy się uruchamia, czyszczenie uruchomień modelu następuje przed globalnym czyszczeniem przestarzałych wpisów i ograniczaniem.

- `--dry-run`: podgląd, ile wpisów zostałoby przyciętych/ograniczonych bez zapisywania.
  - W trybie tekstowym dry-run wypisuje tabelę akcji dla każdej sesji (`Action`, `Key`, `Age`, `Model`, `Flags`) oraz podsumowanie pogrupowane według etykiety sesji, aby pokazać, co zostałoby zachowane, a co usunięte.
- `--enforce`: stosuje konserwację nawet wtedy, gdy `session.maintenance.mode` ma wartość `warn`.
- `--fix-missing`: usuwa wpisy, których pliki transkryptu są brakujące albo zawierają tylko nagłówek/są puste, nawet jeśli normalnie nie zostałyby jeszcze usunięte z powodu wieku/liczby.
- `--fix-dm-scope`: gdy `session.dmScope` ma wartość `main`, wycofuje przestarzałe, kluczowane według rozmówcy wiersze bezpośrednich DM pozostawione przez wcześniejsze trasowanie `per-peer`, `per-channel-peer` lub `per-account-channel-peer`. Najpierw użyj `--dry-run`; zastosowanie czyszczenia usuwa te wiersze z `sessions.json` i zachowuje ich transkrypty jako usunięte archiwa.
- `--active-key <key>`: chroni określony aktywny klucz przed eksmisją z budżetu dyskowego. Trwałe zewnętrzne wskaźniki rozmów, takie jak sesje grupowe i sesje czatu o zakresie wątku, są również zachowywane przez konserwację wieku/liczby/budżetu dyskowego.
- `--agent <id>`: uruchamia czyszczenie dla jednego skonfigurowanego magazynu agenta.
- `--all-agents`: uruchamia czyszczenie dla wszystkich skonfigurowanych magazynów agentów.
- `--store <path>`: uruchamia na określonym pliku `sessions.json`.
- `--json`: wypisuje podsumowanie JSON. Z `--all-agents` wyjście zawiera jedno podsumowanie na magazyn.

Gdy Gateway jest osiągalny, czyszczenie magazynów skonfigurowanych agentów bez trybu dry-run
jest wysyłane przez Gateway, aby korzystało z tego samego zapisującego magazyn sesji co ruch
uruchomieniowy. Użyj `--store <path>` do jawnej naprawy pliku magazynu offline.

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

Odzyskaj budżet kontekstu dla zablokowanej lub zbyt dużej sesji. `openclaw sessions compact <key>` jest pełnoprawnym opakowaniem wokół RPC Gateway `sessions.compact` i wymaga działającego Gateway.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Bez `--max-lines` Gateway podsumowuje transkrypt przy użyciu LLM. Może to być wolne, więc domyślny `--timeout` wynosi `180000` ms.
- Z `--max-lines <n>` skraca do ostatnich `n` linii transkryptu i archiwizuje wcześniejszy transkrypt jako plik towarzyszący `.bak`.
- `--agent <id>`: agent, który jest właścicielem sesji; wymagane dla kluczy `global`.
- `--url` / `--token` / `--password`: nadpisania połączenia Gateway.
- `--timeout <ms>`: limit czasu RPC w milisekundach.
- `--json`: wypisuje surowy ładunek RPC.

Polecenie kończy się kodem różnym od zera, gdy Gateway zgłasza nieudaną Compaction albo jest nieosiągalny, więc crony i skrypty nigdy nie pomylą cichego braku działania z sukcesem.

> Uwaga: `openclaw agent --message '/compact ...'` **nie** jest ścieżką Compaction. Polecenia slash z CLI są odrzucane przez kontrolę autoryzowanego nadawcy; to wywołanie kończy się kodem różnym od zera ze wskazówką prowadzącą tutaj, zamiast cicho nic nie robić.

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` akceptuje:

| Pole       | Typ         | Wymagane | Opis                                                       |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | string      | tak      | Klucz sesji do skompaktowania (na przykład `agent:main:main`). |
| `agentId`  | string      | nie      | Identyfikator agenta, który jest właścicielem sesji (dla kluczy `global`). |
| `maxLines` | integer ≥ 1 | nie      | Skróć do ostatnich N linii zamiast podsumowania LLM.        |

Przykładowa odpowiedź podsumowania LLM:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Przykładowa odpowiedź skrócenia (`--max-lines 200`):

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

- Konfiguracja sesji: [Informacje o konfiguracji](/pl/gateway/config-agents#session)
- [Informacje o CLI](/pl/cli)
- [Zarządzanie sesjami](/pl/concepts/session)
