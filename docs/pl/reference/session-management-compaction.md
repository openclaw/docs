---
read_when:
    - Musisz debugować identyfikatory sesji, JSONL transkrypcji lub pola sessions.json
    - Zmieniasz zachowanie automatycznej Compaction albo dodajesz porządkowanie przed Compaction
    - Chcesz zaimplementować czyszczenie pamięci lub ciche tury systemowe
summary: 'Dogłębna analiza: magazyn sesji + transkrypty, cykl życia oraz wewnętrzne mechanizmy (auto)Compaction'
title: Szczegółowe omówienie zarządzania sesjami
x-i18n:
    generated_at: "2026-04-30T16:30:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a6a7031cebd90d27784a32a0d0378ea9959249389d209f0745395f90b8a0df9
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw zarządza sesjami od początku do końca w tych obszarach:

- **Routing sesji** (jak wiadomości przychodzące mapują się na `sessionKey`)
- **Magazyn sesji** (`sessions.json`) i to, co śledzi
- **Utrwalanie transkryptu** (`*.jsonl`) i jego struktura
- **Higiena transkryptu** (poprawki specyficzne dla dostawcy przed uruchomieniami)
- **Limity kontekstu** (okno kontekstu a śledzone tokeny)
- **Compaction** (ręczna i automatyczna Compaction) oraz miejsca podłączenia pracy przed Compaction
- **Ciche porządkowanie** (zapisy pamięci, które nie powinny generować wyjścia widocznego dla użytkownika)

Jeśli chcesz najpierw uzyskać ogólny przegląd, zacznij od:

- [Zarządzanie sesjami](/pl/concepts/session)
- [Compaction](/pl/concepts/compaction)
- [Przegląd pamięci](/pl/concepts/memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Higiena transkryptu](/pl/reference/transcript-hygiene)

---

## Źródło prawdy: Gateway

OpenClaw jest zaprojektowany wokół jednego **procesu Gateway**, który jest właścicielem stanu sesji.

- UI (aplikacja macOS, webowy Control UI, TUI) powinny odpytywać Gateway o listy sesji i liczbę tokenów.
- W trybie zdalnym pliki sesji znajdują się na zdalnym hoście; „sprawdzanie plików na lokalnym Macu” nie odzwierciedli tego, czego używa Gateway.

---

## Dwie warstwy utrwalania

OpenClaw utrwala sesje w dwóch warstwach:

1. **Magazyn sesji (`sessions.json`)**
   - Mapa klucz/wartość: `sessionKey -> SessionEntry`
   - Mała, modyfikowalna, bezpieczna do edycji (lub usuwania wpisów)
   - Śledzi metadane sesji (bieżący identyfikator sesji, ostatnia aktywność, przełączniki, liczniki tokenów itd.)

2. **Transkrypt (`<sessionId>.jsonl`)**
   - Transkrypt tylko do dopisywania ze strukturą drzewa (wpisy mają `id` + `parentId`)
   - Przechowuje rzeczywistą rozmowę + wywołania narzędzi + podsumowania Compaction
   - Służy do odbudowy kontekstu modelu dla przyszłych tur
   - Duże punkty kontrolne debugowania sprzed Compaction są pomijane, gdy aktywny
     transkrypt przekracza limit rozmiaru punktu kontrolnego, co pozwala uniknąć drugiej ogromnej
     kopii `.checkpoint.*.jsonl`.

---

## Lokalizacje na dysku

Dla każdego agenta, na hoście Gateway:

- Magazyn: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrypty: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesje tematów Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw rozwiązuje te ścieżki przez `src/config/sessions.ts`.

---

## Utrzymanie magazynu i kontrola dysku

Utrwalanie sesji ma automatyczne mechanizmy utrzymania (`session.maintenance`) dla `sessions.json`, artefaktów transkryptów i plików pomocniczych trajektorii:

- `mode`: `warn` (domyślnie) albo `enforce`
- `pruneAfter`: próg wieku przestarzałych wpisów (domyślnie `30d`)
- `maxEntries`: limit wpisów w `sessions.json` (domyślnie `500`)
- `resetArchiveRetention`: retencja archiwów transkryptów `*.reset.<timestamp>` (domyślnie taka sama jak `pruneAfter`; `false` wyłącza czyszczenie)
- `maxDiskBytes`: opcjonalny budżet katalogu sesji
- `highWaterBytes`: opcjonalny cel po czyszczeniu (domyślnie `80%` z `maxDiskBytes`)

Normalne zapisy Gateway grupują czyszczenie `maxEntries` dla limitów o rozmiarach produkcyjnych, więc magazyn może przez krótki czas przekraczać skonfigurowany limit, zanim następne czyszczenie wysokiego poziomu zapisze go z powrotem do niższego rozmiaru. `openclaw sessions cleanup --enforce` nadal stosuje skonfigurowany limit natychmiast.

OpenClaw nie tworzy już automatycznych rotacyjnych kopii zapasowych `sessions.json.bak.*` podczas zapisów Gateway. Starszy klucz `session.maintenance.rotateBytes` jest ignorowany, a `openclaw doctor --fix` usuwa go ze starszych konfiguracji.

Kolejność egzekwowania czyszczenia budżetu dyskowego (`mode: "enforce"`):

1. Najpierw usuń najstarsze zarchiwizowane, osierocone transkrypty lub osierocone artefakty trajektorii.
2. Jeśli nadal przekraczasz cel, usuń najstarsze wpisy sesji oraz ich pliki transkryptów/trajektorii.
3. Kontynuuj, aż użycie będzie równe `highWaterBytes` lub niższe.

W `mode: "warn"` OpenClaw zgłasza potencjalne usunięcia, ale nie modyfikuje magazynu ani plików.

Uruchom utrzymanie na żądanie:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesje Cron i dzienniki uruchomień

Izolowane uruchomienia Cron również tworzą wpisy sesji/transkrypty i mają dedykowane ustawienia retencji:

- `cron.sessionRetention` (domyślnie `24h`) usuwa stare izolowane sesje uruchomień Cron z magazynu sesji (`false` wyłącza).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` przycinają pliki `~/.openclaw/cron/runs/<jobId>.jsonl` (domyślnie: `2_000_000` bajtów i `2000` linii).

Gdy Cron wymusza utworzenie nowej izolowanej sesji uruchomienia, sanituzuje poprzedni
wpis sesji `cron:<jobId>` przed zapisaniem nowego wiersza. Przenosi bezpieczne
preferencje, takie jak ustawienia myślenia/szybkości/szczegółowości, etykiety oraz jawne
nadpisania modelu/uwierzytelniania wybrane przez użytkownika. Usuwa otaczający kontekst rozmowy, taki
jak routing kanału/grupy, zasady wysyłania lub kolejkowania, podniesienie uprawnień, pochodzenie oraz
powiązanie środowiska wykonawczego ACP, aby świeże izolowane uruchomienie nie mogło odziedziczyć przestarzałych zasad dostarczania ani
uprawnień środowiska wykonawczego po starszym uruchomieniu.

---

## Klucze sesji (`sessionKey`)

`sessionKey` identyfikuje _koszyk rozmowy_, w którym jesteś (routing + izolacja).

Typowe wzorce:

- Główny/bezpośredni czat (na agenta): `agent:<agentId>:<mainKey>` (domyślnie `main`)
- Grupa: `agent:<agentId>:<channel>:group:<id>`
- Pokój/kanał (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` albo `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (chyba że nadpisano)

Kanoniczne reguły są udokumentowane w [/concepts/session](/pl/concepts/session).

---

## Identyfikatory sesji (`sessionId`)

Każdy `sessionKey` wskazuje bieżący `sessionId` (plik transkryptu, który kontynuuje rozmowę).

Praktyczne reguły:

- **Reset** (`/new`, `/reset`) tworzy nowy `sessionId` dla tego `sessionKey`.
- **Reset dzienny** (domyślnie 4:00 AM czasu lokalnego na hoście Gateway) tworzy nowy `sessionId` przy następnej wiadomości po granicy resetu.
- **Wygaśnięcie bezczynności** (`session.reset.idleMinutes` albo starsze `session.idleMinutes`) tworzy nowy `sessionId`, gdy wiadomość dotrze po oknie bezczynności. Gdy skonfigurowane są jednocześnie reset dzienny i bezczynność, wygrywa to, co wygaśnie pierwsze.
- **Zdarzenia systemowe** (heartbeat, wybudzenia Cron, powiadomienia exec, księgowanie Gateway) mogą modyfikować wiersz sesji, ale nie przedłużają świeżości resetu dziennego/bezczynności. Przełączenie resetu odrzuca zakolejkowane powiadomienia zdarzeń systemowych dla poprzedniej sesji, zanim zostanie zbudowany świeży prompt.
- **Strażnik forka rodzica wątku** (`session.parentForkMaxTokens`, domyślnie `100000`) pomija forkowanie transkryptu rodzica, gdy sesja rodzica jest już zbyt duża; nowy wątek zaczyna od nowa. Ustaw `0`, aby wyłączyć.

Szczegół implementacyjny: decyzja zapada w `initSessionState()` w `src/auto-reply/reply/session.ts`.

---

## Schemat magazynu sesji (`sessions.json`)

Typ wartości magazynu to `SessionEntry` w `src/config/sessions.ts`.

Kluczowe pola (lista nie jest pełna):

- `sessionId`: bieżący identyfikator transkryptu (nazwa pliku jest wyprowadzana z niego, chyba że ustawiono `sessionFile`)
- `sessionStartedAt`: znacznik czasu rozpoczęcia bieżącego `sessionId`; świeżość resetu dziennego
  używa tego pola. Starsze wiersze mogą wyprowadzać je z nagłówka sesji JSONL.
- `lastInteractionAt`: znacznik czasu ostatniej rzeczywistej interakcji użytkownika/kanału; świeżość resetu bezczynności
  używa tego pola, aby heartbeat, Cron i zdarzenia exec nie utrzymywały sesji
  przy życiu. Starsze wiersze bez tego pola wracają do odzyskanego czasu rozpoczęcia sesji
  dla świeżości bezczynności.
- `updatedAt`: znacznik czasu ostatniej mutacji wiersza magazynu, używany do listowania, przycinania i
  księgowania. Nie jest autorytetem dla świeżości resetu dziennego/bezczynności.
- `sessionFile`: opcjonalne jawne nadpisanie ścieżki transkryptu
- `chatType`: `direct | group | room` (pomaga UI i zasadom wysyłania)
- `provider`, `subject`, `room`, `space`, `displayName`: metadane etykietowania grup/kanałów
- Przełączniki:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (nadpisanie na poziomie sesji)
- Wybór modelu:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Liczniki tokenów (best-effort / zależne od dostawcy):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: jak często automatyczna Compaction zakończyła się dla tego klucza sesji
- `memoryFlushAt`: znacznik czasu ostatniego opróżnienia pamięci przed Compaction
- `memoryFlushCompactionCount`: licznik Compaction w chwili ostatniego opróżnienia

Magazyn jest bezpieczny do edycji, ale Gateway jest autorytetem: może przepisywać lub odtwarzać wpisy podczas działania sesji.

---

## Struktura transkryptu (`*.jsonl`)

Transkryptami zarządza `SessionManager` z `@mariozechner/pi-coding-agent`.

Plik jest w formacie JSONL:

- Pierwsza linia: nagłówek sesji (`type: "session"`, zawiera `id`, `cwd`, `timestamp`, opcjonalne `parentSession`)
- Następnie: wpisy sesji z `id` + `parentId` (drzewo)

Ważne typy wpisów:

- `message`: wiadomości użytkownika/asystenta/toolResult
- `custom_message`: wiadomości wstrzyknięte przez rozszerzenie, które _wchodzą_ do kontekstu modelu (mogą być ukryte przed UI)
- `custom`: stan rozszerzenia, który _nie wchodzi_ do kontekstu modelu
- `compaction`: utrwalone podsumowanie Compaction z `firstKeptEntryId` i `tokensBefore`
- `branch_summary`: utrwalone podsumowanie przy nawigowaniu po gałęzi drzewa

OpenClaw celowo **nie** „naprawia” transkryptów; Gateway używa `SessionManager` do ich odczytu/zapisu.

---

## Okna kontekstu a śledzone tokeny

Znaczenie mają dwa różne pojęcia:

1. **Okno kontekstu modelu**: twardy limit na model (tokeny widoczne dla modelu)
2. **Liczniki magazynu sesji**: statystyki kroczące zapisywane w `sessions.json` (używane dla /status i pulpitów)

Jeśli dostrajasz limity:

- Okno kontekstu pochodzi z katalogu modeli (i może być nadpisane przez konfigurację).
- `contextTokens` w magazynie jest wartością szacunkową/raportową w czasie działania; nie traktuj jej jako ścisłej gwarancji.

Więcej informacji znajdziesz w [/token-use](/pl/reference/token-use).

---

## Compaction: czym jest

Compaction podsumowuje starszą rozmowę do utrwalonego wpisu `compaction` w transkrypcie i pozostawia ostatnie wiadomości bez zmian.

Po Compaction przyszłe tury widzą:

- Podsumowanie Compaction
- Wiadomości po `firstKeptEntryId`

Compaction jest **trwała** (w odróżnieniu od przycinania sesji). Zobacz [/concepts/session-pruning](/pl/concepts/session-pruning).

## Granice fragmentów Compaction i parowanie narzędzi

Gdy OpenClaw dzieli długi transkrypt na fragmenty Compaction, utrzymuje
wywołania narzędzi asystenta sparowane z odpowiadającymi im wpisami `toolResult`.

- Jeśli podział według udziału tokenów wypada między wywołaniem narzędzia a jego wynikiem, OpenClaw
  przesuwa granicę do wiadomości asystenta z wywołaniem narzędzia, zamiast rozdzielać
  parę.
- Jeśli końcowy blok wyników narzędzi w przeciwnym razie wypchnąłby fragment ponad cel,
  OpenClaw zachowuje ten oczekujący blok narzędzia i pozostawia niepodsumowany ogon
  bez zmian.
- Przerwane/błędne bloki wywołań narzędzi nie utrzymują oczekującego podziału otwartego.

---

## Kiedy następuje automatyczna Compaction (środowisko wykonawcze Pi)

We wbudowanym agencie Pi automatyczna Compaction uruchamia się w dwóch przypadkach:

1. **Odzyskiwanie po przepełnieniu**: model zwraca błąd przepełnienia kontekstu
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` i podobne warianty w kształcie dostawcy) → wykonaj Compaction → ponów.
2. **Utrzymanie progowe**: po udanej turze, gdy:

`contextTokens > contextWindow - reserveTokens`

Gdzie:

- `contextWindow` to okno kontekstu modelu
- `reserveTokens` to zapas zarezerwowany na prompty + następne wyjście modelu

To są semantyki środowiska wykonawczego Pi (OpenClaw konsumuje zdarzenia, ale Pi decyduje, kiedy wykonać Compaction).

OpenClaw może także wyzwolić lokalną Compaction przedflightową przed otwarciem następnego
uruchomienia, gdy ustawiono `agents.defaults.compaction.maxActiveTranscriptBytes` i
aktywny plik transkryptu osiągnie ten rozmiar. To strażnik rozmiaru pliku dla lokalnego
kosztu ponownego otwarcia, a nie surowa archiwizacja: OpenClaw nadal uruchamia normalną semantyczną Compaction,
i wymaga `truncateAfterCompaction`, aby skompaktowane podsumowanie mogło stać się
nowym transkryptem następczym.

W przypadku osadzonych uruchomień Pi opcja `agents.defaults.compaction.midTurnPrecheck.enabled: true`
dodaje opcjonalną osłonę pętli narzędzi. Po dołączeniu wyniku narzędzia i przed
następnym wywołaniem modelu OpenClaw szacuje presję promptu, używając tej samej
logiki budżetu preflight, która jest używana na początku tury. Jeśli kontekst
już się nie mieści, osłona nie wykonuje Compaction wewnątrz haka `transformContext`
Pi. Zgłasza ustrukturyzowany sygnał sprawdzenia wstępnego w środku tury,
zatrzymuje bieżące przesłanie promptu i pozwala zewnętrznej pętli uruchomienia
użyć istniejącej ścieżki odzyskiwania: obciąć zbyt duże wyniki narzędzi, gdy to
wystarczy, albo uruchomić skonfigurowany tryb Compaction i spróbować ponownie.
Opcja jest domyślnie wyłączona i działa zarówno z trybem Compaction `default`,
jak i `safeguard`, w tym z Compaction `safeguard` obsługiwaną przez dostawcę.
Jest to niezależne od `maxActiveTranscriptBytes`: osłona rozmiaru w bajtach
działa przed otwarciem tury, natomiast sprawdzenie wstępne w środku tury działa
później w osadzonej pętli narzędzi Pi, po dołączeniu nowych wyników narzędzi.

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

OpenClaw wymusza także minimalny próg bezpieczeństwa dla uruchomień osadzonych:

- Jeśli `compaction.reserveTokens < reserveTokensFloor`, OpenClaw go podnosi.
- Domyślny próg wynosi `20000` tokenów.
- Ustaw `agents.defaults.compaction.reserveTokensFloor: 0`, aby wyłączyć próg.
- Jeśli jest już wyższy, OpenClaw pozostawia go bez zmian.
- Ręczne `/compact` respektuje jawne `agents.defaults.compaction.keepRecentTokens`
  i zachowuje punkt odcięcia ostatniego ogona Pi. Bez jawnego budżetu zachowania
  ręczna Compaction pozostaje twardym punktem kontrolnym, a odbudowany kontekst
  zaczyna się od nowego podsumowania.
- Ustaw `agents.defaults.compaction.midTurnPrecheck.enabled: true`, aby uruchamiać
  opcjonalne sprawdzenie wstępne pętli narzędzi po nowych wynikach narzędzi i przed
  następnym wywołaniem modelu. To wyłącznie wyzwalacz; generowanie podsumowania
  nadal używa skonfigurowanej ścieżki Compaction. Jest niezależne od
  `maxActiveTranscriptBytes`, które jest osłoną rozmiaru aktywnego transkryptu
  w bajtach na początku tury.
- Ustaw `agents.defaults.compaction.maxActiveTranscriptBytes` na wartość w bajtach
  albo ciąg taki jak `"20mb"`, aby uruchamiać lokalną Compaction przed turą, gdy
  aktywny transkrypt robi się duży. Ta osłona jest aktywna tylko wtedy, gdy
  włączone jest także `truncateAfterCompaction`. Pozostaw nieustawione albo ustaw
  `0`, aby wyłączyć.
- Gdy `agents.defaults.compaction.truncateAfterCompaction` jest włączone,
  OpenClaw obraca aktywny transkrypt do skompaktowanego następcy JSONL po
  Compaction. Stary pełny transkrypt pozostaje zarchiwizowany i powiązany z
  punktem kontrolnym Compaction, zamiast być przepisywany w miejscu.

Dlaczego: aby pozostawić wystarczający zapas na wieloturowe czynności porządkowe (takie jak zapisy pamięci), zanim Compaction stanie się nieunikniona.

Implementacja: `ensurePiCompactionReserveTokens()` w `src/agents/pi-settings.ts`
(wywoływane z `src/agents/pi-embedded-runner.ts`).

---

## Wymienni dostawcy Compaction

Plugins mogą rejestrować dostawcę Compaction przez `registerCompactionProvider()` w API Plugin. Gdy `agents.defaults.compaction.provider` jest ustawione na identyfikator zarejestrowanego dostawcy, rozszerzenie safeguard deleguje podsumowywanie do tego dostawcy zamiast do wbudowanego potoku `summarizeInStages`.

- `provider`: identyfikator zarejestrowanego Plugin dostawcy Compaction. Pozostaw nieustawione, aby używać domyślnego podsumowywania LLM.
- Ustawienie `provider` wymusza `mode: "safeguard"`.
- Dostawcy otrzymują te same instrukcje Compaction i zasady zachowywania identyfikatorów co wbudowana ścieżka.
- Safeguard nadal zachowuje kontekst ostatnich tur i sufiksu podzielonej tury po wyniku dostawcy.
- Wbudowane podsumowywanie safeguard ponownie destyluje wcześniejsze podsumowania z nowymi wiadomościami,
  zamiast zachowywać pełne poprzednie podsumowanie dosłownie.
- Tryb safeguard domyślnie włącza audyty jakości podsumowania; ustaw
  `qualityGuard.enabled: false`, aby pominąć zachowanie ponawiania przy źle sformatowanym wyniku.
- Jeśli dostawca zawiedzie albo zwróci pusty wynik, OpenClaw automatycznie wraca do wbudowanego podsumowywania LLM.
- Sygnały przerwania/limitu czasu są zgłaszane ponownie (nie są pochłaniane), aby respektować anulowanie przez wywołującego.

Źródło: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Powierzchnie widoczne dla użytkownika

Compaction i stan sesji można obserwować przez:

- `/status` (w dowolnej sesji czatu)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Tryb szczegółowy: `🧹 Auto-compaction complete` + liczba Compaction

---

## Ciche czynności porządkowe (`NO_REPLY`)

OpenClaw obsługuje „ciche” tury dla zadań w tle, w których użytkownik nie powinien widzieć pośrednich wyników.

Konwencja:

- Asystent zaczyna swoje wyjście dokładnym cichym tokenem `NO_REPLY` /
  `no_reply`, aby wskazać „nie dostarczaj odpowiedzi użytkownikowi”.
- OpenClaw usuwa/tłumi to w warstwie dostarczania.
- Tłumienie dokładnego cichego tokenu nie rozróżnia wielkości liter, więc zarówno `NO_REPLY`, jak i
  `no_reply` liczą się, gdy cały ładunek jest tylko cichym tokenem.
- Jest to przeznaczone wyłącznie dla prawdziwych tur w tle/bez dostarczania; nie jest skrótem dla
  zwykłych wykonalnych żądań użytkownika.

Od `2026.1.10` OpenClaw tłumi także **strumieniowanie szkicu/pisania**, gdy
częściowy fragment zaczyna się od `NO_REPLY`, dzięki czemu ciche operacje nie ujawniają częściowego
wyniku w środku tury.

---

## „Opróżnienie pamięci” przed Compaction (zaimplementowane)

Cel: zanim nastąpi automatyczna Compaction, uruchomić cichą turę agentową, która zapisuje trwały
stan na dysku (np. `memory/YYYY-MM-DD.md` w obszarze roboczym agenta), aby Compaction nie mogła
usunąć krytycznego kontekstu.

OpenClaw używa podejścia **opróżnienia przed progiem**:

1. Monitoruj użycie kontekstu sesji.
2. Gdy przekroczy „miękki próg” (poniżej progu Compaction Pi), uruchom cichą
   dyrektywę „zapisz pamięć teraz” dla agenta.
3. Użyj dokładnego cichego tokenu `NO_REPLY` / `no_reply`, aby użytkownik nie widział
   niczego.

Konfiguracja (`agents.defaults.compaction.memoryFlush`):

- `enabled` (domyślnie: `true`)
- `model` (opcjonalne dokładne nadpisanie dostawcy/modelu dla tury opróżniania, na przykład `ollama/qwen3:8b`)
- `softThresholdTokens` (domyślnie: `4000`)
- `prompt` (wiadomość użytkownika dla tury opróżniania)
- `systemPrompt` (dodatkowy prompt systemowy dołączany dla tury opróżniania)

Uwagi:

- Domyślny prompt/prompt systemowy zawiera wskazówkę `NO_REPLY`, aby stłumić
  dostarczanie.
- Gdy ustawiono `model`, tura opróżniania używa tego modelu bez dziedziczenia
  aktywnego łańcucha awaryjnego sesji, więc lokalne czynności porządkowe nie przechodzą po cichu
  na płatny model konwersacyjny.
- Opróżnianie uruchamia się raz na cykl Compaction (śledzone w `sessions.json`).
- Opróżnianie uruchamia się tylko dla osadzonych sesji Pi (backendy CLI je pomijają).
- Opróżnianie jest pomijane, gdy obszar roboczy sesji jest tylko do odczytu (`workspaceAccess: "ro"` lub `"none"`).
- Zobacz [Pamięć](/pl/concepts/memory), aby poznać układ plików obszaru roboczego i wzorce zapisu.

Pi udostępnia także hak `session_before_compact` w API rozszerzenia, ale logika
opróżniania OpenClaw znajduje się dziś po stronie Gateway.

---

## Lista kontrolna rozwiązywania problemów

- Nieprawidłowy klucz sesji? Zacznij od [/concepts/session](/pl/concepts/session) i potwierdź `sessionKey` w `/status`.
- Niezgodność magazynu i transkryptu? Potwierdź host Gateway i ścieżkę magazynu z `openclaw status`.
- Spam Compaction? Sprawdź:
  - okno kontekstu modelu (zbyt małe)
  - ustawienia Compaction (`reserveTokens` zbyt wysokie względem okna modelu może powodować wcześniejszą Compaction)
  - rozrost wyników narzędzi: włącz/dostosuj przycinanie sesji
- Wyciekają ciche tury? Potwierdź, że odpowiedź zaczyna się od `NO_REPLY` (dokładny token bez rozróżniania wielkości liter) i że używasz kompilacji zawierającej poprawkę tłumienia strumieniowania.

## Powiązane

- [Zarządzanie sesją](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Silnik kontekstu](/pl/concepts/context-engine)
