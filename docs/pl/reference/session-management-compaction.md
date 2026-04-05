---
read_when:
    - Musisz debugować identyfikatory sesji, JSONL transkryptów lub pola sessions.json
    - Zmieniasz zachowanie automatycznego kompaktowania lub dodajesz porządki „przed kompaktowaniem”
    - Chcesz zaimplementować zrzuty pamięci lub ciche tury systemowe
summary: 'Szczegółowe omówienie: magazyn sesji i transkrypty, cykl życia oraz mechanizmy kompaktowania (automatycznego)'
title: Szczegółowe omówienie zarządzania sesjami
x-i18n:
    generated_at: "2026-04-05T14:05:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: e379d624dd7808d3af25ed011079268ce6a9da64bb3f301598884ad4c46ab091
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Zarządzanie sesjami i kompaktowanie (szczegółowe omówienie)

Ten dokument wyjaśnia, jak OpenClaw zarządza sesjami od początku do końca:

- **Trasowanie sesji** (jak wiadomości przychodzące są mapowane na `sessionKey`)
- **Magazyn sesji** (`sessions.json`) i co śledzi
- **Trwałość transkryptów** (`*.jsonl`) i ich struktura
- **Higiena transkryptów** (poprawki specyficzne dla dostawcy przed uruchomieniami)
- **Limity kontekstu** (okno kontekstu a śledzone tokeny)
- **Kompaktowanie** (ręczne + automatyczne kompaktowanie) oraz miejsca, w których można podpiąć działania przed kompaktowaniem
- **Ciche porządki** (na przykład zapisy pamięci, które nie powinny generować widocznych dla użytkownika wyników)

Jeśli najpierw chcesz zobaczyć omówienie na wyższym poziomie, zacznij od:

- [/concepts/session](/pl/concepts/session)
- [/concepts/compaction](/pl/concepts/compaction)
- [/concepts/memory](/pl/concepts/memory)
- [/concepts/memory-search](/pl/concepts/memory-search)
- [/concepts/session-pruning](/pl/concepts/session-pruning)
- [/reference/transcript-hygiene](/reference/transcript-hygiene)

---

## Źródło prawdy: Gateway

OpenClaw został zaprojektowany wokół pojedynczego **procesu Gateway**, który zarządza stanem sesji.

- Interfejsy użytkownika (aplikacja macOS, webowy interfejs Control UI, TUI) powinny odpytywać Gateway o listy sesji i liczniki tokenów.
- W trybie zdalnym pliki sesji znajdują się na zdalnym hoście; „sprawdzanie lokalnych plików na Macu” nie odzwierciedli tego, czego używa Gateway.

---

## Dwie warstwy trwałości

OpenClaw zapisuje sesje w dwóch warstwach:

1. **Magazyn sesji (`sessions.json`)**
   - Mapa klucz/wartość: `sessionKey -> SessionEntry`
   - Mały, mutowalny, bezpieczny do edycji (lub usuwania wpisów)
   - Śledzi metadane sesji (bieżący identyfikator sesji, ostatnią aktywność, przełączniki, liczniki tokenów itd.)

2. **Transkrypt (`<sessionId>.jsonl`)**
   - Transkrypt tylko do dopisywania o strukturze drzewa (wpisy mają `id` + `parentId`)
   - Przechowuje rzeczywistą rozmowę + wywołania narzędzi + podsumowania kompaktowania
   - Jest używany do odtworzenia kontekstu modelu dla przyszłych tur

---

## Lokalizacje na dysku

Dla każdego agenta, na hoście Gateway:

- Magazyn: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrypty: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesje tematów Telegrama: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw rozstrzyga te ścieżki przez `src/config/sessions.ts`.

---

## Utrzymanie magazynu i kontrola dysku

Trwałość sesji ma automatyczne mechanizmy utrzymania (`session.maintenance`) dla `sessions.json` i artefaktów transkryptów:

- `mode`: `warn` (domyślnie) albo `enforce`
- `pruneAfter`: granica wieku nieaktualnych wpisów (domyślnie `30d`)
- `maxEntries`: limit wpisów w `sessions.json` (domyślnie `500`)
- `rotateBytes`: rotacja `sessions.json`, gdy jest zbyt duży (domyślnie `10mb`)
- `resetArchiveRetention`: retencja archiwów transkryptów `*.reset.<timestamp>` (domyślnie: taka sama jak `pruneAfter`; `false` wyłącza czyszczenie)
- `maxDiskBytes`: opcjonalny budżet katalogu sesji
- `highWaterBytes`: opcjonalny cel po czyszczeniu (domyślnie `80%` z `maxDiskBytes`)

Kolejność egzekwowania podczas czyszczenia budżetu dysku (`mode: "enforce"`):

1. Najpierw usuń najstarsze zarchiwizowane lub osierocone artefakty transkryptów.
2. Jeśli nadal przekraczasz cel, usuń najstarsze wpisy sesji i ich pliki transkryptów.
3. Kontynuuj, aż użycie spadnie do `highWaterBytes` lub niżej.

W trybie `mode: "warn"` OpenClaw zgłasza potencjalne usunięcia, ale nie modyfikuje magazynu/plików.

Uruchom utrzymanie na żądanie:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesje cron i logi uruchomień

Izolowane uruchomienia cron również tworzą wpisy sesji/transkrypty i mają dedykowane mechanizmy retencji:

- `cron.sessionRetention` (domyślnie `24h`) usuwa stare sesje izolowanych uruchomień cron z magazynu sesji (`false` wyłącza).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` przycinają pliki `~/.openclaw/cron/runs/<jobId>.jsonl` (domyślnie: `2_000_000` bajtów i `2000` linii).

---

## Klucze sesji (`sessionKey`)

`sessionKey` identyfikuje _który koszyk rozmowy_ jest używany (trasowanie + izolacja).

Typowe wzorce:

- Główna/czat bezpośredni (na agenta): `agent:<agentId>:<mainKey>` (domyślnie `main`)
- Grupa: `agent:<agentId>:<channel>:group:<id>`
- Pokój/kanał (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` lub `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (chyba że nadpisano)

Kanoniczne zasady są opisane w [/concepts/session](/pl/concepts/session).

---

## Identyfikatory sesji (`sessionId`)

Każdy `sessionKey` wskazuje bieżący `sessionId` (plik transkryptu, który kontynuuje rozmowę).

Praktyczne zasady:

- **Reset** (`/new`, `/reset`) tworzy nowy `sessionId` dla tego `sessionKey`.
- **Reset dzienny** (domyślnie o 4:00 czasu lokalnego na hoście gateway) tworzy nowy `sessionId` przy następnej wiadomości po przekroczeniu granicy resetu.
- **Wygaśnięcie bezczynności** (`session.reset.idleMinutes` lub starsze `session.idleMinutes`) tworzy nowy `sessionId`, gdy wiadomość nadejdzie po oknie bezczynności. Gdy skonfigurowane są jednocześnie tryb dzienny i bezczynność, wygrywa to, które wygaśnie wcześniej.
- **Strażnik rozwidlenia od rodzica wątku** (`session.parentForkMaxTokens`, domyślnie `100000`) pomija rozwidlanie z transkryptu rodzica, gdy sesja nadrzędna jest już zbyt duża; nowy wątek zaczyna od zera. Ustaw `0`, aby wyłączyć.

Szczegół implementacyjny: decyzja zapada w `initSessionState()` w `src/auto-reply/reply/session.ts`.

---

## Schemat magazynu sesji (`sessions.json`)

Typ wartości magazynu to `SessionEntry` w `src/config/sessions.ts`.

Kluczowe pola (lista niepełna):

- `sessionId`: bieżący identyfikator transkryptu (nazwa pliku jest z niego wyprowadzana, chyba że ustawiono `sessionFile`)
- `updatedAt`: znacznik czasu ostatniej aktywności
- `sessionFile`: opcjonalne jawne nadpisanie ścieżki transkryptu
- `chatType`: `direct | group | room` (pomaga interfejsom użytkownika i zasadom wysyłania)
- `provider`, `subject`, `room`, `space`, `displayName`: metadane do etykiet grup/kanałów
- Przełączniki:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (nadpisanie dla danej sesji)
- Wybór modelu:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Liczniki tokenów (best-effort / zależne od dostawcy):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: ile razy automatyczne kompaktowanie zakończyło się dla tego klucza sesji
- `memoryFlushAt`: znacznik czasu ostatniego zrzutu pamięci przed kompaktowaniem
- `memoryFlushCompactionCount`: liczba kompaktowań w momencie ostatniego zrzutu

Magazyn można bezpiecznie edytować, ale Gateway pozostaje źródłem prawdy: może przepisać lub ponownie uwodnić wpisy podczas działania sesji.

---

## Struktura transkryptu (`*.jsonl`)

Transkryptami zarządza `SessionManager` z `@mariozechner/pi-coding-agent`.

Plik ma format JSONL:

- Pierwsza linia: nagłówek sesji (`type: "session"`, zawiera `id`, `cwd`, `timestamp`, opcjonalnie `parentSession`)
- Następnie: wpisy sesji z `id` + `parentId` (drzewo)

Istotne typy wpisów:

- `message`: wiadomości użytkownika/asystenta/toolResult
- `custom_message`: wiadomości wstrzyknięte przez rozszerzenie, które _wchodzą_ do kontekstu modelu (mogą być ukryte przed UI)
- `custom`: stan rozszerzenia, który _nie wchodzi_ do kontekstu modelu
- `compaction`: zapisane podsumowanie kompaktowania z `firstKeptEntryId` i `tokensBefore`
- `branch_summary`: zapisane podsumowanie przy nawigacji po gałęzi drzewa

OpenClaw celowo **nie** „poprawia” transkryptów; Gateway używa `SessionManager` do ich odczytu/zapisu.

---

## Okna kontekstu a śledzone tokeny

Znaczenie mają dwa różne pojęcia:

1. **Okno kontekstu modelu**: twardy limit dla modelu (tokeny widoczne dla modelu)
2. **Liczniki magazynu sesji**: kroczące statystyki zapisywane w `sessions.json` (używane przez /status i panele)

Jeśli dostrajasz limity:

- Okno kontekstu pochodzi z katalogu modeli (i może zostać nadpisane przez konfigurację).
- `contextTokens` w magazynie to wartość szacunkowa/raportowa w czasie działania; nie traktuj jej jako ścisłej gwarancji.

Więcej informacji: [/token-use](/reference/token-use).

---

## Kompaktowanie: czym jest

Kompaktowanie podsumowuje starszą część rozmowy do zapisanego wpisu `compaction` w transkrypcie i zachowuje nienaruszone najnowsze wiadomości.

Po kompaktowaniu przyszłe tury widzą:

- Podsumowanie kompaktowania
- Wiadomości po `firstKeptEntryId`

Kompaktowanie jest **trwałe** (w przeciwieństwie do przycinania sesji). Zobacz [/concepts/session-pruning](/pl/concepts/session-pruning).

## Granice fragmentów kompaktowania i parowanie narzędzi

Gdy OpenClaw dzieli długi transkrypt na fragmenty kompaktowania, utrzymuje
sparowanie wywołań narzędzi asystenta z odpowiadającymi im wpisami `toolResult`.

- Jeśli podział według udziału tokenów wypada pomiędzy wywołaniem narzędzia a jego wynikiem, OpenClaw
  przesuwa granicę do wiadomości asystenta z wywołaniem narzędzia, zamiast rozdzielać tę parę.
- Jeśli końcowy blok wyniku narzędzia w przeciwnym razie wypchnąłby fragment ponad zakładany cel,
  OpenClaw zachowuje ten oczekujący blok narzędzia i pozostawia niepodsumowany ogon bez zmian.
- Przerwane/błędne bloki wywołań narzędzi nie utrzymują oczekującego podziału.

---

## Kiedy następuje automatyczne kompaktowanie (środowisko Pi)

W osadzonym agencie Pi automatyczne kompaktowanie uruchamia się w dwóch przypadkach:

1. **Odzyskiwanie po przepełnieniu**: model zwraca błąd przepełnienia kontekstu
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` oraz podobne warianty zależne od dostawcy) → skompaktuj → ponów próbę.
2. **Utrzymanie progu**: po udanej turze, gdy:

`contextTokens > contextWindow - reserveTokens`

Gdzie:

- `contextWindow` to okno kontekstu modelu
- `reserveTokens` to zapas zarezerwowany na prompty + następne wyjście modelu

To semantyka środowiska Pi (OpenClaw zużywa zdarzenia, ale to Pi decyduje, kiedy kompaktować).

---

## Ustawienia kompaktowania (`reserveTokens`, `keepRecentTokens`)

Ustawienia kompaktowania Pi znajdują się w ustawieniach Pi:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw dodatkowo wymusza minimalny próg bezpieczeństwa dla uruchomień osadzonych:

- Jeśli `compaction.reserveTokens < reserveTokensFloor`, OpenClaw go podnosi.
- Domyślny próg to `20000` tokenów.
- Ustaw `agents.defaults.compaction.reserveTokensFloor: 0`, aby wyłączyć ten próg.
- Jeśli wartość jest już wyższa, OpenClaw pozostawia ją bez zmian.

Dlaczego: aby zostawić wystarczający zapas na wieloturowe „porządki” (takie jak zapisy pamięci), zanim kompaktowanie stanie się nieuniknione.

Implementacja: `ensurePiCompactionReserveTokens()` w `src/agents/pi-settings.ts`
(wywoływane z `src/agents/pi-embedded-runner.ts`).

---

## Powierzchnie widoczne dla użytkownika

Kompaktowanie i stan sesji można obserwować przez:

- `/status` (w dowolnej sesji czatu)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Tryb verbose: `🧹 Auto-compaction complete` + liczba kompaktowań

---

## Ciche porządki (`NO_REPLY`)

OpenClaw obsługuje „ciche” tury dla zadań w tle, gdy użytkownik nie powinien widzieć pośrednich wyników.

Konwencja:

- Asystent rozpoczyna swoje wyjście od dokładnego cichego tokenu `NO_REPLY` /
  `no_reply`, aby wskazać „nie dostarczaj odpowiedzi użytkownikowi”.
- OpenClaw usuwa/tłumi to w warstwie dostarczania.
- Tłumienie dokładnego cichego tokenu jest nieczułe na wielkość liter, więc `NO_REPLY` i
  `no_reply` są uznawane, gdy cały ładunek to wyłącznie cichy token.
- Jest to przeznaczone wyłącznie dla prawdziwych tur w tle/bez dostarczenia; nie jest to skrót
  dla zwykłych, wykonalnych żądań użytkownika.

Od wersji `2026.1.10` OpenClaw tłumi również **strumieniowanie wersji roboczych/typing**, gdy
częściowy fragment zaczyna się od `NO_REPLY`, aby ciche operacje nie ujawniały
częściowego wyjścia w środku tury.

---

## „Zrzut pamięci” przed kompaktowaniem (zaimplementowane)

Cel: zanim nastąpi automatyczne kompaktowanie, uruchomić cichą agentową turę, która zapisze trwały
stan na dysk (na przykład `memory/YYYY-MM-DD.md` w workspace agenta), aby kompaktowanie nie mogło
usunąć krytycznego kontekstu.

OpenClaw używa podejścia **zrzutu przed progiem**:

1. Monitoruj użycie kontekstu sesji.
2. Gdy przekroczy „miękki próg” (poniżej progu kompaktowania Pi), uruchom cichą
   dyrektywę „zapisz pamięć teraz” dla agenta.
3. Użyj dokładnego cichego tokenu `NO_REPLY` / `no_reply`, aby użytkownik niczego
   nie zobaczył.

Konfiguracja (`agents.defaults.compaction.memoryFlush`):

- `enabled` (domyślnie: `true`)
- `softThresholdTokens` (domyślnie: `4000`)
- `prompt` (wiadomość użytkownika dla tury zrzutu)
- `systemPrompt` (dodatkowy prompt systemowy dołączany dla tury zrzutu)

Uwagi:

- Domyślny prompt/system prompt zawiera wskazówkę `NO_REPLY`, aby tłumić
  dostarczanie.
- Zrzut uruchamia się raz na cykl kompaktowania (śledzone w `sessions.json`).
- Zrzut działa tylko dla osadzonych sesji Pi (backendy CLI go pomijają).
- Zrzut jest pomijany, gdy workspace sesji jest tylko do odczytu (`workspaceAccess: "ro"` lub `"none"`).
- Zobacz [Pamięć](/pl/concepts/memory), aby poznać układ plików workspace i wzorce zapisu.

Pi udostępnia także hook `session_before_compact` w API rozszerzeń, ale logika zrzutu w OpenClaw
obecnie znajduje się po stronie Gateway.

---

## Lista kontrolna rozwiązywania problemów

- Nieprawidłowy klucz sesji? Zacznij od [/concepts/session](/pl/concepts/session) i potwierdź `sessionKey` w `/status`.
- Niezgodność magazynu i transkryptu? Potwierdź host Gateway i ścieżkę magazynu z `openclaw status`.
- Spam kompaktowania? Sprawdź:
  - okno kontekstu modelu (zbyt małe)
  - ustawienia kompaktowania (`reserveTokens` ustawione zbyt wysoko względem okna modelu może powodować wcześniejsze kompaktowanie)
  - rozrost wyników narzędzi: włącz/dostrój przycinanie sesji
- Ciche tury przeciekają? Potwierdź, że odpowiedź zaczyna się od `NO_REPLY` (dokładny token, nieczuły na wielkość liter) i że używasz wersji zawierającej poprawkę tłumienia strumieniowania.
