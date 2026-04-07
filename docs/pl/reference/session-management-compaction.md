---
read_when:
    - Musisz debugować identyfikatory sesji, JSONL transkryptów lub pola sessions.json
    - Zmieniasz zachowanie auto-compaction lub dodajesz housekeeping „pre-compaction”
    - Chcesz zaimplementować flush pamięci lub ciche tury systemowe
summary: 'Szczegółowe omówienie: store sesji + transkrypty, cykl życia i mechanizmy (auto)compaction'
title: Szczegółowe omówienie zarządzania sesjami
x-i18n:
    generated_at: "2026-04-07T09:50:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: e379d624dd7808d3af25ed011079268ce6a9da64bb3f301598884ad4c46ab091
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Zarządzanie sesjami i compaction (szczegółowe omówienie)

Ten dokument wyjaśnia, jak OpenClaw zarządza sesjami end-to-end:

- **Session routing** (jak wiadomości przychodzące mapują się na `sessionKey`)
- **Store sesji** (`sessions.json`) i co śledzi
- **Trwałość transkryptów** (`*.jsonl`) i ich struktura
- **Higiena transkryptów** (poprawki specyficzne dla providera przed uruchomieniami)
- **Limity kontekstu** (okno kontekstu vs śledzone tokeny)
- **Compaction** (ręczny + auto-compaction) oraz gdzie podłączać pracę pre-compaction
- **Cichy housekeeping** (np. zapisy pamięci, które nie powinny generować widocznego dla użytkownika wyjścia)

Jeśli najpierw chcesz przeczytać omówienie na wyższym poziomie, zacznij od:

- [/concepts/session](/pl/concepts/session)
- [/concepts/compaction](/pl/concepts/compaction)
- [/concepts/memory](/pl/concepts/memory)
- [/concepts/memory-search](/pl/concepts/memory-search)
- [/concepts/session-pruning](/pl/concepts/session-pruning)
- [/reference/transcript-hygiene](/pl/reference/transcript-hygiene)

---

## Źródło prawdy: Gateway

OpenClaw jest zaprojektowany wokół pojedynczego **procesu Gateway**, który zarządza stanem sesji.

- Interfejsy UI (aplikacja macOS, webowy Control UI, TUI) powinny odpytywać Gateway o listy sesji i liczbę tokenów.
- W trybie zdalnym pliki sesji znajdują się na zdalnym hoście; „sprawdzanie lokalnych plików na Macu” nie będzie odzwierciedlać tego, czego używa Gateway.

---

## Dwie warstwy trwałości

OpenClaw zapisuje sesje w dwóch warstwach:

1. **Store sesji (`sessions.json`)**
   - Mapa klucz/wartość: `sessionKey -> SessionEntry`
   - Mały, mutowalny, bezpieczny do edycji (lub usuwania wpisów)
   - Śledzi metadane sesji (bieżący identyfikator sesji, ostatnią aktywność, przełączniki, liczniki tokenów itd.)

2. **Transkrypt (`<sessionId>.jsonl`)**
   - Transkrypt append-only o strukturze drzewa (wpisy mają `id` + `parentId`)
   - Przechowuje właściwą rozmowę + wywołania narzędzi + podsumowania compaction
   - Służy do odbudowy kontekstu modelu dla przyszłych tur

---

## Lokalizacje na dysku

Per agent, na hoście Gateway:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrypty: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesje tematów Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw rozwiązuje je przez `src/config/sessions.ts`.

---

## Utrzymanie store i kontrola dysku

Trwałość sesji ma automatyczne mechanizmy utrzymania (`session.maintenance`) dla `sessions.json` i artefaktów transkryptów:

- `mode`: `warn` (domyślnie) lub `enforce`
- `pruneAfter`: próg wieku nieaktualnych wpisów (domyślnie `30d`)
- `maxEntries`: limit wpisów w `sessions.json` (domyślnie `500`)
- `rotateBytes`: obraca `sessions.json`, gdy staje się zbyt duży (domyślnie `10mb`)
- `resetArchiveRetention`: retencja dla archiwów transkryptów `*.reset.<timestamp>` (domyślnie: taka sama jak `pruneAfter`; `false` wyłącza czyszczenie)
- `maxDiskBytes`: opcjonalny budżet katalogu sesji
- `highWaterBytes`: opcjonalny cel po cleanupie (domyślnie `80%` z `maxDiskBytes`)

Kolejność egzekwowania cleanupu przy budżecie dyskowym (`mode: "enforce"`):

1. Najpierw usuń najstarsze zarchiwizowane lub osierocone artefakty transkryptów.
2. Jeśli nadal przekroczony jest cel, usuń najstarsze wpisy sesji i ich pliki transkryptów.
3. Kontynuuj, aż użycie będzie na poziomie `highWaterBytes` lub poniżej.

W trybie `mode: "warn"` OpenClaw zgłasza potencjalne usunięcia, ale nie modyfikuje store ani plików.

Uruchom utrzymanie na żądanie:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesje cron i logi uruchomień

Izolowane uruchomienia cron również tworzą wpisy sesji/transkrypty i mają dedykowane mechanizmy retencji:

- `cron.sessionRetention` (domyślnie `24h`) usuwa stare sesje izolowanych uruchomień cron ze store sesji (`false` wyłącza).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` przycinają pliki `~/.openclaw/cron/runs/<jobId>.jsonl` (domyślnie: `2_000_000` bajtów i `2000` linii).

---

## Klucze sesji (`sessionKey`)

`sessionKey` identyfikuje, _w którym koszyku rozmowy_ się znajdujesz (routing + izolacja).

Typowe wzorce:

- Główny/czat bezpośredni (per agent): `agent:<agentId>:<mainKey>` (domyślnie `main`)
- Grupa: `agent:<agentId>:<channel>:group:<id>`
- Pokój/kanał (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` lub `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (chyba że nadpisano)

Kanoniczne zasady są opisane w [/concepts/session](/pl/concepts/session).

---

## Identyfikatory sesji (`sessionId`)

Każdy `sessionKey` wskazuje na bieżący `sessionId` (plik transkryptu, który kontynuuje rozmowę).

Praktyczne zasady:

- **Reset** (`/new`, `/reset`) tworzy nowy `sessionId` dla tego `sessionKey`.
- **Codzienny reset** (domyślnie 4:00 czasu lokalnego hosta gateway) tworzy nowy `sessionId` przy następnej wiadomości po przekroczeniu granicy resetu.
- **Wygaśnięcie bezczynności** (`session.reset.idleMinutes` lub starsze `session.idleMinutes`) tworzy nowy `sessionId`, gdy wiadomość nadejdzie po upływie okna bezczynności. Gdy skonfigurowane są jednocześnie reset dzienny i bezczynność, wygrywa ten, który wygaśnie wcześniej.
- **Zabezpieczenie forkowania po rodzicu wątku** (`session.parentForkMaxTokens`, domyślnie `100000`) pomija forkowanie transkryptu rodzica, gdy sesja nadrzędna jest już zbyt duża; nowy wątek zaczyna się od zera. Ustaw `0`, aby wyłączyć.

Szczegół implementacyjny: decyzja zapada w `initSessionState()` w `src/auto-reply/reply/session.ts`.

---

## Schemat store sesji (`sessions.json`)

Typ wartości store to `SessionEntry` w `src/config/sessions.ts`.

Kluczowe pola (lista niepełna):

- `sessionId`: bieżący identyfikator transkryptu (nazwa pliku jest od niego wyprowadzana, chyba że ustawiono `sessionFile`)
- `updatedAt`: znacznik czasu ostatniej aktywności
- `sessionFile`: opcjonalne jawne nadpisanie ścieżki transkryptu
- `chatType`: `direct | group | room` (pomaga UI i polityce wysyłania)
- `provider`, `subject`, `room`, `space`, `displayName`: metadane do etykietowania grup/kanałów
- Przełączniki:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (nadpisanie per sesja)
- Wybór modelu:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Liczniki tokenów (best-effort / zależne od providera):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: jak często auto-compaction zakończył się dla tego klucza sesji
- `memoryFlushAt`: znacznik czasu ostatniego flush pamięci pre-compaction
- `memoryFlushCompactionCount`: licznik compaction, przy którym wykonano ostatni flush

Store można bezpiecznie edytować, ale autorytetem pozostaje Gateway: może przepisywać lub ponownie hydradować wpisy podczas działania sesji.

---

## Struktura transkryptu (`*.jsonl`)

Transkryptami zarządza `SessionManager` z `@mariozechner/pi-coding-agent`.

Plik ma format JSONL:

- Pierwsza linia: nagłówek sesji (`type: "session"`, zawiera `id`, `cwd`, `timestamp`, opcjonalnie `parentSession`)
- Dalej: wpisy sesji z `id` + `parentId` (drzewo)

Ważne typy wpisów:

- `message`: wiadomości user/assistant/toolResult
- `custom_message`: wiadomości wstrzyknięte przez rozszerzenie, które _wchodzą_ do kontekstu modelu (mogą być ukryte przed UI)
- `custom`: stan rozszerzenia, który _nie wchodzi_ do kontekstu modelu
- `compaction`: utrwalone podsumowanie compaction z `firstKeptEntryId` i `tokensBefore`
- `branch_summary`: utrwalone podsumowanie przy nawigacji po gałęzi drzewa

OpenClaw celowo **nie** „naprawia” transkryptów; Gateway używa `SessionManager` do ich odczytu/zapisu.

---

## Okna kontekstu vs śledzone tokeny

Znaczenie mają dwa różne pojęcia:

1. **Okno kontekstu modelu**: twardy limit per model (tokeny widoczne dla modelu)
2. **Liczniki store sesji**: statystyki kroczące zapisywane do `sessions.json` (używane przez /status i dashboardy)

Jeśli dostrajasz limity:

- Okno kontekstu pochodzi z katalogu modeli (i może być nadpisane przez config).
- `contextTokens` w store to wartość szacunkowa/raportowa z runtime; nie traktuj jej jako ścisłej gwarancji.

Więcej informacji znajdziesz w [/token-use](/pl/reference/token-use).

---

## Compaction: czym jest

Compaction podsumowuje starszą część rozmowy do utrwalonego wpisu `compaction` w transkrypcie i pozostawia nienaruszone ostatnie wiadomości.

Po compaction przyszłe tury widzą:

- Podsumowanie compaction
- Wiadomości po `firstKeptEntryId`

Compaction jest **trwały** (w przeciwieństwie do session pruning). Zobacz [/concepts/session-pruning](/pl/concepts/session-pruning).

## Granice chunków compaction i parowanie narzędzi

Gdy OpenClaw dzieli długi transkrypt na chunki do compaction, utrzymuje
powiązanie wywołań narzędzi asystenta z odpowiadającymi im wpisami `toolResult`.

- Jeśli podział według udziału tokenów wypada między wywołaniem narzędzia a jego wynikiem, OpenClaw
  przesuwa granicę do wiadomości asystenta zawierającej wywołanie narzędzia zamiast rozdzielać
  tę parę.
- Jeśli końcowy blok wyniku narzędzia w przeciwnym razie przesunąłby chunk ponad docelowy rozmiar,
  OpenClaw zachowuje ten oczekujący blok narzędzia i pozostawia niepodsumowany ogon
  bez zmian.
- Przerwane/błędne bloki wywołań narzędzi nie utrzymują otwartego oczekującego podziału.

---

## Kiedy zachodzi auto-compaction (runtime Pi)

W osadzonym agencie Pi auto-compaction uruchamia się w dwóch przypadkach:

1. **Odzyskiwanie po overflow**: model zwraca błąd przepełnienia kontekstu
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` oraz podobne warianty zależne od providera) → compact → ponów próbę.
2. **Utrzymanie progu**: po pomyślnej turze, gdy:

`contextTokens > contextWindow - reserveTokens`

Gdzie:

- `contextWindow` to okno kontekstu modelu
- `reserveTokens` to zapas zarezerwowany na prompty + następne wyjście modelu

To semantyka runtime Pi (OpenClaw konsumuje zdarzenia, ale Pi decyduje, kiedy robić compact).

---

## Ustawienia compaction (`reserveTokens`, `keepRecentTokens`)

Ustawienia compaction Pi znajdują się w ustawieniach Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw wymusza też minimalny próg bezpieczeństwa dla osadzonych uruchomień:

- Jeśli `compaction.reserveTokens < reserveTokensFloor`, OpenClaw go podnosi.
- Domyślny próg to `20000` tokenów.
- Ustaw `agents.defaults.compaction.reserveTokensFloor: 0`, aby wyłączyć ten próg.
- Jeśli wartość jest już wyższa, OpenClaw pozostawia ją bez zmian.

Dlaczego: pozostawia to wystarczający zapas na wieloturowy „housekeeping” (np. zapisy pamięci), zanim compaction stanie się nieunikniony.

Implementacja: `ensurePiCompactionReserveTokens()` w `src/agents/pi-settings.ts`
(wywoływane z `src/agents/pi-embedded-runner.ts`).

---

## Powierzchnie widoczne dla użytkownika

Możesz obserwować compaction i stan sesji przez:

- `/status` (w dowolnej sesji czatu)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Tryb verbose: `🧹 Auto-compaction complete` + liczba compaction

---

## Cichy housekeeping (`NO_REPLY`)

OpenClaw obsługuje „ciche” tury dla zadań w tle, w których użytkownik nie powinien widzieć pośredniego wyjścia.

Konwencja:

- Asystent rozpoczyna wyjście dokładnym cichym tokenem `NO_REPLY` /
  `no_reply`, aby wskazać „nie dostarczaj odpowiedzi użytkownikowi”.
- OpenClaw usuwa/wycisza to w warstwie dostarczania.
- Wyciszanie dokładnego cichego tokenu jest niewrażliwe na wielkość liter, więc `NO_REPLY` i
  `no_reply` są traktowane tak samo, gdy cały payload składa się tylko z cichego tokenu.
- To rozwiązanie jest przeznaczone tylko dla prawdziwych tur w tle/bez dostarczania; nie jest skrótem dla
  zwykłych żądań użytkownika wymagających działania.

Od wersji `2026.1.10` OpenClaw wycisza też **draft/typing streaming**, gdy
częściowy chunk zaczyna się od `NO_REPLY`, aby ciche operacje nie ujawniały częściowego
wyjścia w trakcie tury.

---

## „Memory flush” pre-compaction (zaimplementowane)

Cel: zanim nastąpi auto-compaction, uruchomić cichą, agentową turę, która zapisze trwały
stan na dysku (np. `memory/YYYY-MM-DD.md` w obszarze roboczym agenta), tak aby compaction nie mógł
wymazać krytycznego kontekstu.

OpenClaw używa podejścia **pre-threshold flush**:

1. Monitoruj użycie kontekstu sesji.
2. Gdy przekroczy „miękki próg” (poniżej progu compaction Pi), uruchom cichą
   dyrektywę „zapisz pamięć teraz” dla agenta.
3. Użyj dokładnego cichego tokenu `NO_REPLY` / `no_reply`, aby użytkownik niczego
   nie zobaczył.

Config (`agents.defaults.compaction.memoryFlush`):

- `enabled` (domyślnie: `true`)
- `softThresholdTokens` (domyślnie: `4000`)
- `prompt` (wiadomość użytkownika dla tury flush)
- `systemPrompt` (dodatkowy system prompt dołączany do tury flush)

Uwagi:

- Domyślny prompt/system prompt zawiera wskazówkę `NO_REPLY`, aby wyciszyć
  dostarczanie.
- Flush jest uruchamiany raz na cykl compaction (śledzony w `sessions.json`).
- Flush działa tylko dla osadzonych sesji Pi (backendy CLI go pomijają).
- Flush jest pomijany, gdy obszar roboczy sesji jest tylko do odczytu (`workspaceAccess: "ro"` lub `"none"`).
- Zobacz [Memory](/pl/concepts/memory), aby poznać układ plików obszaru roboczego i wzorce zapisu.

Pi udostępnia też hook `session_before_compact` w API rozszerzeń, ale logika
flush w OpenClaw obecnie znajduje się po stronie Gateway.

---

## Lista kontrolna rozwiązywania problemów

- Zły klucz sesji? Zacznij od [/concepts/session](/pl/concepts/session) i potwierdź `sessionKey` w `/status`.
- Niezgodność store i transkryptu? Potwierdź host Gateway i ścieżkę store z `openclaw status`.
- Spam compaction? Sprawdź:
  - okno kontekstu modelu (za małe)
  - ustawienia compaction (`reserveTokens` ustawione zbyt wysoko względem okna modelu mogą powodować wcześniejszy compaction)
  - rozrost `toolResult`: włącz/skonfiguruj session pruning
- Ciche tury przeciekają? Upewnij się, że odpowiedź zaczyna się od `NO_REPLY` (dokładny token, bez rozróżniania wielkości liter) i że używasz builda zawierającego poprawkę wyciszania streamingu.
