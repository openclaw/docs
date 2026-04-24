---
read_when:
    - Musisz debugować identyfikatory sesji, JSONL transkryptu lub pola sessions.json
    - Zmieniasz zachowanie automatycznej Compaction albo dodajesz porządkowanie „przed Compaction”
    - Chcesz zaimplementować opróżnianie pamięci lub ciche tury systemowe
summary: 'Szczegółowe omówienie: magazyn sesji + transkrypty, cykl życia i wewnętrzne działanie (auto)Compaction'
title: Szczegółowe omówienie zarządzania sesjami
x-i18n:
    generated_at: "2026-04-24T09:32:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e236840ebf9d4980339c801c1ecb70a7f413ea18987400ac47db0818b5cab8c
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Zarządzanie sesjami i Compaction (szczegółowe omówienie)

Ten dokument wyjaśnia, jak OpenClaw zarządza sesjami end-to-end:

- **Routing sesji** (jak wiadomości przychodzące mapują się do `sessionKey`)
- **Magazyn sesji** (`sessions.json`) i co śledzi
- **Utrwalanie transkryptu** (`*.jsonl`) i jego strukturę
- **Higienę transkryptu** (poprawki specyficzne dla dostawcy przed przebiegami)
- **Limity kontekstu** (okno kontekstu vs śledzone tokeny)
- **Compaction** (ręczną + automatyczną Compaction) i miejsca do podpinania pracy przed Compaction
- **Ciche porządkowanie** (np. zapisy pamięci, które nie powinny generować widocznego dla użytkownika wyniku)

Jeśli chcesz najpierw zobaczyć przegląd wyższego poziomu, zacznij od:

- [/concepts/session](/pl/concepts/session)
- [/concepts/compaction](/pl/concepts/compaction)
- [/concepts/memory](/pl/concepts/memory)
- [/concepts/memory-search](/pl/concepts/memory-search)
- [/concepts/session-pruning](/pl/concepts/session-pruning)
- [/reference/transcript-hygiene](/pl/reference/transcript-hygiene)

---

## Źródło prawdy: Gateway

OpenClaw jest zaprojektowany wokół pojedynczego **procesu Gateway**, który posiada stan sesji.

- Interfejsy UI (aplikacja macOS, web Control UI, TUI) powinny odpytywać Gateway o listy sesji i liczniki tokenów.
- W trybie zdalnym pliki sesji znajdują się na hoście zdalnym; „sprawdzanie lokalnych plików na Macu” nie odzwierciedla tego, czego używa Gateway.

---

## Dwie warstwy utrwalania

OpenClaw utrwala sesje w dwóch warstwach:

1. **Magazyn sesji (`sessions.json`)**
   - Mapa klucz/wartość: `sessionKey -> SessionEntry`
   - Mały, mutowalny, bezpieczny do edycji (lub usuwania wpisów)
   - Śledzi metadane sesji (bieżący identyfikator sesji, ostatnią aktywność, przełączniki, liczniki tokenów itd.)

2. **Transkrypt (`<sessionId>.jsonl`)**
   - Transkrypt append-only o strukturze drzewa (wpisy mają `id` + `parentId`)
   - Przechowuje właściwą rozmowę + wywołania narzędzi + podsumowania Compaction
   - Służy do odbudowywania kontekstu modelu dla przyszłych tur

---

## Lokalizacje na dysku

Per agent, na hoście Gateway:

- Magazyn: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrypty: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesje tematów Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw rozwiązuje te ścieżki przez `src/config/sessions.ts`.

---

## Utrzymanie magazynu i kontrola dysku

Utrwalanie sesji ma automatyczne mechanizmy utrzymania (`session.maintenance`) dla `sessions.json` i artefaktów transkryptów:

- `mode`: `warn` (domyślnie) albo `enforce`
- `pruneAfter`: granica wieku dla nieaktualnych wpisów (domyślnie `30d`)
- `maxEntries`: limit wpisów w `sessions.json` (domyślnie `500`)
- `rotateBytes`: obracaj `sessions.json`, gdy jest za duży (domyślnie `10mb`)
- `resetArchiveRetention`: retencja dla archiwów transkryptów `*.reset.<timestamp>` (domyślnie: taka sama jak `pruneAfter`; `false` wyłącza czyszczenie)
- `maxDiskBytes`: opcjonalny budżet katalogu sesji
- `highWaterBytes`: opcjonalny cel po czyszczeniu (domyślnie `80%` z `maxDiskBytes`)

Kolejność egzekwowania czyszczenia budżetu dyskowego (`mode: "enforce"`):

1. Najpierw usuń najstarsze zarchiwizowane albo osierocone artefakty transkryptów.
2. Jeśli nadal jest powyżej celu, usuń najstarsze wpisy sesji i ich pliki transkryptów.
3. Kontynuuj, aż użycie spadnie do `highWaterBytes` lub niżej.

W trybie `mode: "warn"` OpenClaw zgłasza potencjalne usunięcia, ale nie modyfikuje magazynu/plików.

Uruchamianie utrzymania na żądanie:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesje Cron i logi przebiegów

Izolowane przebiegi Cron również tworzą wpisy sesji/transkrypty i mają dedykowane mechanizmy retencji:

- `cron.sessionRetention` (domyślnie `24h`) usuwa stare sesje izolowanych przebiegów Cron z magazynu sesji (`false` wyłącza).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` przycinają pliki `~/.openclaw/cron/runs/<jobId>.jsonl` (domyślnie: `2_000_000` bajtów i `2000` wierszy).

---

## Klucze sesji (`sessionKey`)

`sessionKey` identyfikuje _wiadro rozmowy_, w którym jesteś (routing + izolacja).

Typowe wzorce:

- Main/czat prywatny (per agent): `agent:<agentId>:<mainKey>` (domyślnie `main`)
- Grupa: `agent:<agentId>:<channel>:group:<id>`
- Pokój/kanał (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` albo `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (chyba że nadpisano)

Kanoniczne zasady są udokumentowane w [/concepts/session](/pl/concepts/session).

---

## Identyfikatory sesji (`sessionId`)

Każdy `sessionKey` wskazuje bieżący `sessionId` (plik transkryptu kontynuujący rozmowę).

Zasady praktyczne:

- **Reset** (`/new`, `/reset`) tworzy nowy `sessionId` dla tego `sessionKey`.
- **Codzienny reset** (domyślnie 4:00 czasu lokalnego na hoście gateway) tworzy nowy `sessionId` przy następnej wiadomości po granicy resetu.
- **Wygaśnięcie bezczynności** (`session.reset.idleMinutes` albo starsze `session.idleMinutes`) tworzy nowy `sessionId`, gdy wiadomość nadejdzie po upływie okna bezczynności. Gdy skonfigurowane są jednocześnie reset dzienny i bezczynność, wygrywa to, co wygaśnie wcześniej.
- **Ochrona rozwidlenia rodzica wątku** (`session.parentForkMaxTokens`, domyślnie `100000`) pomija rozwidlanie transkryptu rodzica, gdy sesja rodzica jest już zbyt duża; nowy wątek zaczyna się od zera. Ustaw `0`, aby wyłączyć.

Szczegół implementacyjny: decyzja zapada w `initSessionState()` w `src/auto-reply/reply/session.ts`.

---

## Schemat magazynu sesji (`sessions.json`)

Typ wartości magazynu to `SessionEntry` w `src/config/sessions.ts`.

Kluczowe pola (lista niepełna):

- `sessionId`: bieżący identyfikator transkryptu (nazwa pliku jest od niego wyprowadzana, chyba że ustawiono `sessionFile`)
- `updatedAt`: znacznik czasu ostatniej aktywności
- `sessionFile`: opcjonalne jawne nadpisanie ścieżki transkryptu
- `chatType`: `direct | group | room` (pomaga interfejsom UI i polityce wysyłania)
- `provider`, `subject`, `room`, `space`, `displayName`: metadane do etykietowania grup/kanałów
- Przełączniki:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (nadpisanie per sesja)
- Wybór modelu:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Liczniki tokenów (best-effort / zależne od dostawcy):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: ile razy automatyczna Compaction zakończyła się dla tego klucza sesji
- `memoryFlushAt`: znacznik czasu ostatniego opróżnienia pamięci przed Compaction
- `memoryFlushCompactionCount`: liczba Compaction w momencie ostatniego flush

Magazyn można bezpiecznie edytować, ale źródłem prawdy jest Gateway: może przepisywać lub
rehydratować wpisy podczas działania sesji.

---

## Struktura transkryptu (`*.jsonl`)

Transkryptami zarządza `SessionManager` z `@mariozechner/pi-coding-agent`.

Plik ma format JSONL:

- Pierwszy wiersz: nagłówek sesji (`type: "session"`, zawiera `id`, `cwd`, `timestamp`, opcjonalne `parentSession`)
- Następnie: wpisy sesji z `id` + `parentId` (drzewo)

Ważne typy wpisów:

- `message`: wiadomości user/assistant/toolResult
- `custom_message`: wiadomości wstrzyknięte przez rozszerzenia, które _wchodzą_ do kontekstu modelu (mogą być ukryte przed UI)
- `custom`: stan rozszerzeń, który _nie wchodzi_ do kontekstu modelu
- `compaction`: utrwalone podsumowanie Compaction z `firstKeptEntryId` i `tokensBefore`
- `branch_summary`: utrwalone podsumowanie przy nawigacji po gałęzi drzewa

OpenClaw celowo **nie** „naprawia” transkryptów; Gateway używa `SessionManager` do ich odczytu/zapisu.

---

## Okna kontekstu vs śledzone tokeny

Znaczenie mają dwa różne pojęcia:

1. **Okno kontekstu modelu**: twardy limit per model (tokeny widoczne dla modelu)
2. **Liczniki magazynu sesji**: rolling stats zapisywane do `sessions.json` (używane przez /status i dashboardy)

Jeśli dostrajasz limity:

- Okno kontekstu pochodzi z katalogu modeli (i może być nadpisane przez config).
- `contextTokens` w magazynie to oszacowanie/wartość raportowana w czasie działania; nie traktuj tego jako ścisłej gwarancji.

Więcej informacji: [/token-use](/pl/reference/token-use).

---

## Compaction: czym jest

Compaction podsumowuje starszą część rozmowy do utrwalonego wpisu `compaction` w transkrypcie i zachowuje nienaruszone ostatnie wiadomości.

Po Compaction przyszłe tury widzą:

- Podsumowanie Compaction
- Wiadomości po `firstKeptEntryId`

Compaction jest **trwała** (w odróżnieniu od przycinania sesji). Zobacz [/concepts/session-pruning](/pl/concepts/session-pruning).

## Granice chunków Compaction i parowanie narzędzi

Gdy OpenClaw dzieli długi transkrypt na chunki Compaction, utrzymuje
wywołania narzędzi asystenta sparowane z odpowiadającymi im wpisami `toolResult`.

- Jeśli podział udziału tokenów wypada między wywołaniem narzędzia a jego wynikiem, OpenClaw
  przesuwa granicę do wiadomości asystenta z wywołaniem narzędzia, zamiast rozdzielać
  parę.
- Jeśli końcowy blok tool-result w przeciwnym razie przesunąłby chunk ponad cel,
  OpenClaw zachowuje ten oczekujący blok narzędzia i utrzymuje niesumaryzowany ogon w stanie nienaruszonym.
- Przerwane/błędne bloki wywołań narzędzi nie utrzymują otwartego oczekującego podziału.

---

## Kiedy zachodzi automatyczna Compaction (runtime Pi)

W osadzonym agencie Pi automatyczna Compaction uruchamia się w dwóch przypadkach:

1. **Odzyskiwanie po przepełnieniu**: model zwraca błąd przepełnienia kontekstu
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` i podobne warianty specyficzne dla dostawców) → compaction → retry.
2. **Utrzymanie progowe**: po udanej turze, gdy:

`contextTokens > contextWindow - reserveTokens`

Gdzie:

- `contextWindow` to okno kontekstu modelu
- `reserveTokens` to rezerwa na prompt + wynik następnego modelu

To semantyka runtime Pi (OpenClaw konsumuje zdarzenia, ale to Pi decyduje, kiedy wykonywać Compaction).

---

## Ustawienia Compaction (`reserveTokens`, `keepRecentTokens`)

Ustawienia Compaction Pi znajdują się w ustawieniach Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw wymusza też minimalny bezpieczny próg dla przebiegów osadzonych:

- Jeśli `compaction.reserveTokens < reserveTokensFloor`, OpenClaw go podnosi.
- Domyślny próg to `20000` tokenów.
- Ustaw `agents.defaults.compaction.reserveTokensFloor: 0`, aby wyłączyć próg.
- Jeśli wartość jest już wyższa, OpenClaw pozostawia ją bez zmian.

Dlaczego: pozostaw wystarczająco dużo miejsca na wieloturowe „porządkowanie” (takie jak zapisy pamięci), zanim Compaction stanie się nieunikniona.

Implementacja: `ensurePiCompactionReserveTokens()` w `src/agents/pi-settings.ts`
(wywoływane z `src/agents/pi-embedded-runner.ts`).

---

## Wymienne dostawcy Compaction

Pluginy mogą rejestrować dostawcę Compaction przez `registerCompactionProvider()` w API Pluginu. Gdy `agents.defaults.compaction.provider` jest ustawione na identyfikator zarejestrowanego dostawcy, rozszerzenie safeguard deleguje podsumowywanie do tego dostawcy zamiast do wbudowanego pipeline `summarizeInStages`.

- `provider`: identyfikator zarejestrowanego Pluginu dostawcy Compaction. Pozostaw nieustawione dla domyślnego podsumowywania przez LLM.
- Ustawienie `provider` wymusza `mode: "safeguard"`.
- Dostawcy otrzymują te same instrukcje Compaction i politykę zachowania identyfikatorów co wbudowana ścieżka.
- Safeguard nadal zachowuje kontekst ostatnich tur i sufiksu podzielonej tury po wyniku dostawcy.
- Jeśli dostawca zawiedzie albo zwróci pusty wynik, OpenClaw automatycznie wraca do wbudowanego podsumowywania przez LLM.
- Sygnały abort/timeout są ponownie rzucane (nie są pochłaniane), aby respektować anulowanie przez wywołującego.

Źródło: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Powierzchnie widoczne dla użytkownika

Możesz obserwować Compaction i stan sesji przez:

- `/status` (w dowolnej sesji czatu)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Tryb verbose: `🧹 Auto-compaction complete` + liczba Compaction

---

## Ciche porządkowanie (`NO_REPLY`)

OpenClaw obsługuje „ciche” tury dla zadań w tle, gdzie użytkownik nie powinien widzieć pośredniego wyniku.

Konwencja:

- Asystent rozpoczyna swój wynik od dokładnego cichego tokenu `NO_REPLY` /
  `no_reply`, aby wskazać „nie dostarczaj odpowiedzi użytkownikowi”.
- OpenClaw usuwa/tłumi to w warstwie dostarczania.
- Tłumienie dokładnego cichego tokenu jest niewrażliwe na wielkość liter, więc `NO_REPLY` i
  `no_reply` liczą się tak samo, gdy cały ładunek jest tylko tym cichym tokenem.
- To jest przeznaczone tylko dla prawdziwie działających w tle / bez dostarczenia tur; nie jest to skrót dla
  zwykłych żądań użytkownika wymagających działania.

Od wersji `2026.1.10` OpenClaw tłumi również **strumieniowanie draft/typing**, gdy
częściowy chunk zaczyna się od `NO_REPLY`, dzięki czemu ciche operacje nie ujawniają częściowego
wyniku w połowie tury.

---

## „Opróżnianie pamięci” przed Compaction (zaimplementowane)

Cel: zanim nastąpi automatyczna Compaction, uruchomić cichą turę agentową, która zapisze trwały
stan na dysk (np. `memory/YYYY-MM-DD.md` w obszarze roboczym agenta), tak aby Compaction nie mogła
usunąć krytycznego kontekstu.

OpenClaw używa podejścia **flush przed progiem**:

1. Monitoruj użycie kontekstu sesji.
2. Gdy przekroczy „miękki próg” (poniżej progu Compaction Pi), uruchom cichą
   dyrektywę „zapisz pamięć teraz” do agenta.
3. Użyj dokładnego cichego tokenu `NO_REPLY` / `no_reply`, aby użytkownik nic
   nie zobaczył.

Konfiguracja (`agents.defaults.compaction.memoryFlush`):

- `enabled` (domyślnie: `true`)
- `softThresholdTokens` (domyślnie: `4000`)
- `prompt` (wiadomość użytkownika dla tury flush)
- `systemPrompt` (dodatkowy prompt systemowy dołączany do tury flush)

Uwagi:

- Domyślny prompt/system prompt zawiera wskazówkę `NO_REPLY`, aby tłumić
  dostarczanie.
- Flush jest uruchamiany raz na cykl Compaction (śledzony w `sessions.json`).
- Flush działa tylko dla osadzonych sesji Pi (backendy CLI go pomijają).
- Flush jest pomijany, gdy obszar roboczy sesji jest tylko do odczytu (`workspaceAccess: "ro"` albo `"none"`).
- Zobacz [Pamięć](/pl/concepts/memory), aby poznać układ plików obszaru roboczego i wzorce zapisu.

Pi udostępnia też Hook `session_before_compact` w API rozszerzeń, ale logika
flush OpenClaw znajduje się dziś po stronie Gateway.

---

## Lista kontrolna rozwiązywania problemów

- Nieprawidłowy klucz sesji? Zacznij od [/concepts/session](/pl/concepts/session) i potwierdź `sessionKey` w `/status`.
- Niedopasowanie magazynu i transkryptu? Potwierdź host Gateway i ścieżkę magazynu z `openclaw status`.
- Spam Compaction? Sprawdź:
  - okno kontekstu modelu (za małe)
  - ustawienia Compaction (`reserveTokens` zbyt wysokie względem okna modelu może powodować wcześniejszą Compaction)
  - rozdęcie wyników narzędzi: włącz/dostrój przycinanie sesji
- Ciche tury przeciekają? Potwierdź, że odpowiedź zaczyna się od `NO_REPLY` (niewrażliwy na wielkość liter dokładny token) i używasz kompilacji zawierającej poprawkę tłumienia strumieniowania.

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Silnik kontekstu](/pl/concepts/context-engine)
