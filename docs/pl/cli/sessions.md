---
read_when:
    - Chcesz wyświetlić zapisane sesje i zobaczyć ostatnią aktywność
summary: Dokumentacja referencyjna CLI dla `openclaw sessions` (lista zapisanych sesji + użycie)
title: Sesje
x-i18n:
    generated_at: "2026-07-04T20:44:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7c24ee8a632998624ee41945b26ace3bfe37cadf9447f7632c373784a9301bde
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Wyświetl zapisane sesje konwersacji.

Listy sesji nie są kontrolami dostępności kanału ani providera. Pokazują utrwalone
wiersze konwersacji z magazynów sesji. Cichy Discord, Slack, Telegram lub
inny kanał może ponownie połączyć się pomyślnie bez tworzenia nowego wiersza sesji
do czasu przetworzenia wiadomości. Użyj `openclaw channels status --probe`,
`openclaw status --deep` lub `openclaw health --verbose`, gdy potrzebujesz bieżącej
łączności kanału.

Odpowiedzi `openclaw sessions` i Gateway `sessions.list` są domyślnie ograniczone,
aby duże, długo działające magazyny nie mogły zmonopolizować procesu CLI ani pętli
zdarzeń Gateway. CLI domyślnie zwraca najnowsze 100 sesji; przekaż
`--limit <n>` dla mniejszego/większego okna albo `--limit all`, gdy celowo
potrzebujesz pełnego magazynu. Odpowiedzi JSON zawierają `totalCount`, `limitApplied` i
`hasMore`, gdy wywołujący muszą pokazać, że istnieje więcej wierszy.

Klienci RPC mogą przekazać `configuredAgentsOnly: true`, aby zachować szerokie,
połączone źródło odkrywania, ale zwracać tylko wiersze dla agentów aktualnie
obecnych w konfiguracji. Control UI używa tego trybu domyślnie, dzięki czemu usunięte
lub istniejące tylko na dysku magazyny agentów nie pojawiają się ponownie w widoku Sessions.

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
- `--all-agents`: agreguj wszystkie skonfigurowane magazyny agentów
- `--store <path>`: jawna ścieżka magazynu (nie można łączyć z `--agent` ani `--all-agents`)
- `--limit <n|all>`: maksymalna liczba wierszy do wypisania (domyślnie `100`; `all` przywraca pełne wyjście)

Śledź czytelny dla człowieka postęp trajektorii zapisanych sesji:

```bash
openclaw sessions tail
openclaw sessions tail --follow
openclaw sessions tail --session-key "agent:main:telegram:direct:123" --tail 25
openclaw sessions --agent work tail --follow
openclaw sessions --all-agents tail --follow
```

`openclaw sessions tail` renderuje ostatnie zdarzenia JSONL trajektorii jako zwięzłe linie postępu. Bez `--session-key` najpierw śledzi uruchomione sesje, a potem najnowszą zapisaną sesję. `--tail <count>` kontroluje, ile istniejących zdarzeń zostanie wypisanych przed trybem obserwowania; wartość domyślna to `80`, a `0` zaczyna od bieżącego końca. `--follow` kontynuuje obserwowanie wybranych plików trajektorii, w tym przeniesionych plików wskazanych przez `<session>.trajectory-path.json`.

Widok postępu jest celowo zachowawczy: tekst promptu, argumenty narzędzi i treści wyników narzędzi nie są wypisywane. Wywołania narzędzi pokazują nazwę narzędzia z `{...redacted...}`; wyniki narzędzi pokazują status, taki jak `ok`, `error` lub `done`; linie ukończenia modelu pokazują providera/model i status końcowy.

Eksportuj pakiet trajektorii dla zapisanej sesji:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

To jest ścieżka polecenia używana przez polecenie ukośnikowe `/export-trajectory` po
zatwierdzeniu żądania wykonania przez właściciela. Katalog wyjściowy jest zawsze rozwiązywany
wewnątrz `.openclaw/trajectory-exports/` pod wybranym obszarem roboczym.

`openclaw sessions --all-agents` odczytuje skonfigurowane magazyny agentów. Odkrywanie
sesji przez Gateway i ACP jest szersze: obejmuje także magazyny istniejące tylko na dysku
znalezione pod domyślnym korzeniem `agents/` lub szablonowanym korzeniem `session.store`.
Te odkryte magazyny muszą rozwiązywać się do zwykłych plików `sessions.json` wewnątrz
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
openclaw sessions cleanup --dry-run --fix-dm-scope
openclaw sessions cleanup --json
```

`openclaw sessions cleanup` używa ustawień `session.maintenance` z konfiguracji:

- Uwaga dotycząca zakresu: `openclaw sessions cleanup` utrzymuje magazyny sesji, transkrypcje i pliki boczne trajektorii. Nie przycina historii uruchomień Cron, która jest zarządzana przez `cron.runLog.keepLines` w [konfiguracji Cron](/pl/automation/cron-jobs#configuration) i wyjaśniona w [konserwacji Cron](/pl/automation/cron-jobs#maintenance).
- Czyszczenie przycina także niepowiązane podstawowe transkrypcje, punkty kontrolne Compaction i pliki boczne trajektorii starsze niż `session.maintenance.pruneAfter`; pliki nadal wskazywane przez `sessions.json` są zachowywane.
- Czyszczenie raportuje osobno krótkotrwałe czyszczenie sond uruchomień modeli Gateway jako `modelRunPruned`. Pasuje to tylko do ścisłych, jawnych kluczy w kształcie `agent:*:explicit:model-run-<uuid>`. Stały okres retencji to `24h`, ale jest on uzależniony od presji: usuwa nieaktualne wiersze sond tylko wtedy, gdy zostanie osiągnięta konserwacja wpisów sesji albo presja limitu. Gdy zostanie uruchomione, czyszczenie uruchomień modelu odbywa się przed globalnym czyszczeniem nieaktualnych wpisów i ograniczaniem.

- `--dry-run`: podgląd, ile wpisów zostałoby przyciętych/ograniczonych bez zapisu.
  - W trybie tekstowym dry-run wypisuje tabelę działań dla każdej sesji (`Action`, `Key`, `Age`, `Model`, `Flags`) oraz podsumowanie pogrupowane według etykiety sesji, aby było widać, co zostałoby zachowane, a co usunięte.
- `--enforce`: zastosuj konserwację nawet wtedy, gdy `session.maintenance.mode` ma wartość `warn`.
- `--fix-missing`: usuń wpisy, których plików transkrypcji brakuje albo które mają tylko nagłówek/są puste, nawet jeśli normalnie nie zostałyby jeszcze wykluczone przez wiek/licznik.
- `--fix-dm-scope`: gdy `session.dmScope` ma wartość `main`, wycofaj nieaktualne, kluczowane peerem wiersze bezpośrednich DM pozostawione przez wcześniejszy routing `per-peer`, `per-channel-peer` lub `per-account-channel-peer`. Najpierw użyj `--dry-run`; zastosowanie czyszczenia usuwa te wiersze z `sessions.json` i zachowuje ich transkrypcje jako usunięte archiwa.
- `--active-key <key>`: chroń konkretny aktywny klucz przed usunięciem z powodu budżetu dyskowego. Trwałe zewnętrzne wskaźniki konwersacji, takie jak sesje grupowe i sesje czatu o zakresie wątku, są także zachowywane przez konserwację wieku/licznika/budżetu dyskowego.
- `--agent <id>`: uruchom czyszczenie dla jednego skonfigurowanego magazynu agenta.
- `--all-agents`: uruchom czyszczenie dla wszystkich skonfigurowanych magazynów agentów.
- `--store <path>`: uruchom na konkretnym pliku `sessions.json`.
- `--json`: wypisz podsumowanie JSON. Z `--all-agents` wyjście zawiera jedno podsumowanie na magazyn.

Gdy Gateway jest osiągalny, czyszczenie bez dry-run dla skonfigurowanych magazynów agentów
jest wysyłane przez Gateway, aby współdzieliło ten sam zapis magazynu sesji co ruch
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

## Kompaktuj sesję

Odzyskaj budżet kontekstu dla zablokowanej lub zbyt dużej sesji. `openclaw sessions compact <key>` to pierwszorzędny wrapper wokół RPC Gateway `sessions.compact` i wymaga działającego Gateway.

```bash
openclaw sessions compact "agent:main:main"
openclaw sessions compact "agent:main:main" --max-lines 200
openclaw sessions compact "agent:work:main" --agent work --json
```

- Bez `--max-lines` Gateway podsumowuje transkrypcję za pomocą LLM. CLI domyślnie nie narzuca terminu po stronie klienta; Gateway jest właścicielem skonfigurowanego cyklu życia Compaction.
- Z `--max-lines <n>` obcina do ostatnich `n` linii transkrypcji i archiwizuje wcześniejszą transkrypcję jako plik boczny `.bak`.
- `--agent <id>`: agent, który jest właścicielem sesji; wymagane dla kluczy `global`.
- `--url` / `--token` / `--password`: nadpisania połączenia Gateway.
- `--timeout <ms>`: opcjonalny limit czasu RPC po stronie klienta w milisekundach.
- `--json`: wypisz surowy payload RPC.

Polecenie kończy się kodem niezerowym, gdy Gateway zgłosi nieudaną Compaction albo jest nieosiągalny, dzięki czemu crony i skrypty nigdy nie pomylą cichego braku działania z sukcesem.

> Uwaga: `openclaw agent --message '/compact ...'` **nie** jest ścieżką Compaction. Polecenia ukośnikowe z CLI są odrzucane przez kontrolę autoryzowanego nadawcy; takie wywołanie kończy się kodem niezerowym ze wskazówką prowadzącą tutaj, zamiast po cichu nic nie robić.

### RPC sessions.compact

`openclaw gateway call sessions.compact --params '<json>'` akceptuje:

| Pole       | Typ         | Wymagane | Opis                                                       |
| ---------- | ----------- | -------- | ---------------------------------------------------------- |
| `key`      | string      | tak      | Klucz sesji do kompaktowania (na przykład `agent:main:main`). |
| `agentId`  | string      | nie      | Identyfikator agenta, który jest właścicielem sesji (dla kluczy `global`). |
| `maxLines` | integer ≥ 1 | nie      | Obetnij do ostatnich N linii zamiast podsumowania LLM.      |

Przykładowa odpowiedź podsumowania LLM:

```json
{
  "ok": true,
  "key": "agent:main:main",
  "compacted": true,
  "result": { "tokensBefore": 243868, "tokensAfter": 34941 }
}
```

Przykładowa odpowiedź obcięcia (`--max-lines 200`):

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

- Konfiguracja sesji: [Odwołanie konfiguracji](/pl/gateway/config-agents#session)
- [Odwołanie CLI](/pl/cli)
- [Zarządzanie sesjami](/pl/concepts/session)
