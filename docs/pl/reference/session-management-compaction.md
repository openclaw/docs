---
read_when:
    - Musisz diagnozować identyfikatory sesji, pliki JSONL transkrypcji lub pola sessions.json
    - Zmieniasz zachowanie automatycznego Compaction albo dodajesz czynności porządkowe przed Compaction
    - Chcesz zaimplementować opróżnianie pamięci lub ciche tury systemowe
summary: 'Szczegółowe omówienie: magazyn sesji + transkrypty, cykl życia i wewnętrzne mechanizmy (auto)Compaction'
title: Szczegółowe omówienie zarządzania sesjami
x-i18n:
    generated_at: "2026-05-02T20:57:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8271d7b0786e1c47a8cec6e7bd73c3c86a433d629e17937fdd87fa756ed78d73
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw zarządza sesjami end-to-end w tych obszarach:

- **Routing sesji** (sposób mapowania wiadomości przychodzących na `sessionKey`)
- **Magazyn sesji** (`sessions.json`) i to, co śledzi
- **Utrwalanie transkryptu** (`*.jsonl`) i jego struktura
- **Higiena transkryptu** (poprawki specyficzne dla dostawcy przed uruchomieniami)
- **Limity kontekstu** (okno kontekstu a śledzone tokeny)
- **Compaction** (ręczna i automatyczna Compaction) oraz miejsce do podpięcia pracy przed Compaction
- **Ciche porządkowanie** (zapisy pamięci, które nie powinny tworzyć widocznego dla użytkownika wyjścia)

Jeśli najpierw chcesz uzyskać ogólny przegląd, zacznij od:

- [Zarządzanie sesjami](/pl/concepts/session)
- [Compaction](/pl/concepts/compaction)
- [Przegląd pamięci](/pl/concepts/memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Higiena transkryptu](/pl/reference/transcript-hygiene)

---

## Źródło prawdy: Gateway

OpenClaw jest zaprojektowany wokół pojedynczego **procesu Gateway**, który jest właścicielem stanu sesji.

- Interfejsy użytkownika (aplikacja macOS, webowy Control UI, TUI) powinny odpytywać Gateway o listy sesji i liczniki tokenów.
- W trybie zdalnym pliki sesji znajdują się na hoście zdalnym; „sprawdzenie lokalnych plików Maca” nie odzwierciedli tego, czego używa Gateway.

---

## Dwie warstwy trwałego przechowywania

OpenClaw utrwala sesje w dwóch warstwach:

1. **Magazyn sesji (`sessions.json`)**
   - Mapa klucz/wartość: `sessionKey -> SessionEntry`
   - Mała, modyfikowalna, bezpieczna do edycji (lub usuwania wpisów)
   - Śledzi metadane sesji (bieżący identyfikator sesji, ostatnia aktywność, przełączniki, liczniki tokenów itd.)

2. **Transkrypt (`<sessionId>.jsonl`)**
   - Transkrypt tylko do dopisywania ze strukturą drzewa (wpisy mają `id` + `parentId`)
   - Przechowuje właściwą rozmowę + wywołania narzędzi + podsumowania Compaction
   - Służy do odbudowania kontekstu modelu dla przyszłych tur
   - Duże kontrolne punkty debugowania sprzed Compaction są pomijane, gdy aktywny
     transkrypt przekroczy limit rozmiaru punktu kontrolnego, co zapobiega utworzeniu drugiej ogromnej
     kopii `.checkpoint.*.jsonl`.

Czytniki historii Gateway powinny unikać materializowania całego transkryptu, chyba że
dana powierzchnia wyraźnie wymaga dowolnego dostępu do historii. Historia pierwszej strony,
osadzona historia czatu, odzyskiwanie po restarcie oraz sprawdzanie tokenów/użycia korzystają z ograniczonych odczytów końca pliku.
Pełne skanowania transkryptu przechodzą przez asynchroniczny indeks transkryptu, który jest
cache'owany według ścieżki pliku oraz `mtimeMs`/`size` i współdzielony przez równoległych czytelników.

---

## Lokalizacje na dysku

Dla każdego agenta, na hoście Gateway:

- Magazyn: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrypty: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesje tematów Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw rozwiązuje je przez `src/config/sessions.ts`.

---

## Utrzymanie magazynu i kontrola dysku

Trwałe przechowywanie sesji ma automatyczne mechanizmy utrzymania (`session.maintenance`) dla `sessions.json`, artefaktów transkryptu i bocznych plików trajektorii:

- `mode`: `warn` (domyślnie) albo `enforce`
- `pruneAfter`: próg wieku nieaktualnych wpisów (domyślnie `30d`)
- `maxEntries`: limit wpisów w `sessions.json` (domyślnie `500`)
- `resetArchiveRetention`: retencja archiwów transkryptów `*.reset.<timestamp>` (domyślnie: taka sama jak `pruneAfter`; `false` wyłącza czyszczenie)
- `maxDiskBytes`: opcjonalny budżet katalogu sesji
- `highWaterBytes`: opcjonalny cel po czyszczeniu (domyślnie `80%` wartości `maxDiskBytes`)

Normalne zapisy Gateway przechodzą przez przypisany do magazynu zapis sesji, który serializuje mutacje w procesie bez zakładania blokady pliku w czasie wykonania. Pomocnicze funkcje poprawek na ścieżce krytycznej pożyczają zweryfikowaną modyfikowalną pamięć podręczną, gdy trzymają swój slot zapisu, dzięki czemu duże pliki `sessions.json` nie są klonowane ani ponownie odczytywane przy każdej aktualizacji metadanych. Kod wykonywania powinien preferować `updateSessionStore(...)` lub `updateSessionStoreEntry(...)`; bezpośrednie zapisy całego magazynu są narzędziami zgodności i utrzymania offline. Gdy Gateway jest osiągalny, niebędące trybem testowym polecenia `openclaw sessions cleanup` i `openclaw agents delete` delegują mutacje magazynu do Gateway, aby czyszczenie dołączało do tej samej kolejki zapisu; `--store <path>` to jawna ścieżka naprawy offline dla bezpośredniego utrzymania plików. Czyszczenie `maxEntries` nadal jest wsadowe dla limitów wielkości produkcyjnej, więc magazyn może przez krótki czas przekroczyć skonfigurowany limit, zanim kolejne czyszczenie do poziomu high-water ponownie go zmniejszy. Odczyty magazynu sesji nie przycinają ani nie limitują wpisów podczas uruchamiania Gateway; do czyszczenia użyj zapisów albo `openclaw sessions cleanup --enforce`. `openclaw sessions cleanup --enforce` nadal natychmiast stosuje skonfigurowany limit.

Utrzymanie zachowuje trwałe zewnętrzne wskaźniki rozmów, takie jak sesje grupowe
i sesje czatu w zakresie wątku, ale syntetyczne wpisy czasu wykonania dla Cron, hooków,
Heartbeat, ACP i podagentów nadal mogą zostać usunięte, gdy przekroczą
skonfigurowany wiek, liczbę lub budżet dysku.

OpenClaw nie tworzy już automatycznych rotacyjnych kopii zapasowych `sessions.json.bak.*` podczas zapisów Gateway. Starszy klucz `session.maintenance.rotateBytes` jest ignorowany, a `openclaw doctor --fix` usuwa go ze starszych konfiguracji.

Mutacje transkryptu używają blokady zapisu sesji na pliku transkryptu. Pozyskiwanie blokady czeka do
`session.writeLock.acquireTimeoutMs`, zanim zgłosi błąd zajętej sesji; domyślnie jest to `60000`
ms. Zwiększaj tę wartość tylko wtedy, gdy prawidłowe przygotowanie, czyszczenie, Compaction lub praca lustra transkryptu
rywalizują dłużej na wolnych maszynach. Wykrywanie przestarzałych blokad i ostrzeżenia o maksymalnym czasie trzymania pozostają osobnymi politykami.

Kolejność egzekwowania czyszczenia budżetu dysku (`mode: "enforce"`):

1. Najpierw usuń najstarsze zarchiwizowane artefakty, osierocone transkrypty lub osierocone artefakty trajektorii.
2. Jeśli nadal jest powyżej celu, eksmituj najstarsze wpisy sesji i ich pliki transkryptów/trajektorii.
3. Kontynuuj, aż użycie będzie równe `highWaterBytes` lub niższe.

W `mode: "warn"` OpenClaw zgłasza potencjalne eksmisje, ale nie modyfikuje magazynu/plików.

Uruchom utrzymanie na żądanie:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesje Cron i dzienniki uruchomień

Izolowane uruchomienia Cron również tworzą wpisy sesji/transkrypty i mają dedykowane mechanizmy kontroli retencji:

- `cron.sessionRetention` (domyślnie `24h`) przycina stare izolowane sesje uruchomień Cron z magazynu sesji (`false` wyłącza).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` przycinają pliki `~/.openclaw/cron/runs/<jobId>.jsonl` (domyślnie: `2_000_000` bajtów i `2000` wierszy).

Gdy Cron wymusza utworzenie nowej izolowanej sesji uruchomienia, sanityzuje poprzedni
wpis sesji `cron:<jobId>` przed zapisaniem nowego wiersza. Przenosi bezpieczne
preferencje, takie jak ustawienia thinking/fast/verbose, etykiety oraz jawne
wybrane przez użytkownika nadpisania modelu/autoryzacji. Odrzuca otaczający kontekst rozmowy, taki
jak routing kanału/grupy, politykę wysyłania lub kolejkowania, podniesienie uprawnień, pochodzenie i
powiązanie czasu wykonania ACP, aby świeże izolowane uruchomienie nie mogło odziedziczyć przestarzałego dostarczania ani
uprawnień czasu wykonania ze starszego uruchomienia.

---

## Klucze sesji (`sessionKey`)

`sessionKey` identyfikuje _koszyk rozmowy_, w którym jesteś (routing + izolacja).

Typowe wzorce:

- Główny/bezpośredni czat (na agenta): `agent:<agentId>:<mainKey>` (domyślnie `main`)
- Grupa: `agent:<agentId>:<channel>:group:<id>`
- Pokój/kanał (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` albo `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (chyba że nadpisano)

Reguły kanoniczne są udokumentowane w [/concepts/session](/pl/concepts/session).

---

## Identyfikatory sesji (`sessionId`)

Każdy `sessionKey` wskazuje bieżący `sessionId` (plik transkryptu kontynuujący rozmowę).

Reguły praktyczne:

- **Reset** (`/new`, `/reset`) tworzy nowy `sessionId` dla tego `sessionKey`.
- **Reset dzienny** (domyślnie 4:00 rano czasu lokalnego na hoście Gateway) tworzy nowy `sessionId` przy następnej wiadomości po granicy resetu.
- **Wygaśnięcie bezczynności** (`session.reset.idleMinutes` albo starsze `session.idleMinutes`) tworzy nowy `sessionId`, gdy wiadomość przychodzi po oknie bezczynności. Gdy skonfigurowane są jednocześnie reset dzienny i bezczynność, wygrywa to, co wygasa pierwsze.
- **Zdarzenia systemowe** (Heartbeat, wybudzenia Cron, powiadomienia exec, księgowanie Gateway) mogą modyfikować wiersz sesji, ale nie przedłużają świeżości resetu dziennego/bezczynności. Przejście resetu odrzuca zakolejkowane powiadomienia zdarzeń systemowych dla poprzedniej sesji przed zbudowaniem świeżego promptu.
- **Polityka forka rodzica** używa aktywnej gałęzi PI podczas tworzenia wątku lub forka podagenta. Jeśli ta gałąź jest zbyt duża, OpenClaw uruchamia dziecko z izolowanym kontekstem zamiast kończyć się błędem albo dziedziczyć bezużyteczną historię. Polityka rozmiaru jest automatyczna; starsza konfiguracja `session.parentForkMaxTokens` jest usuwana przez `openclaw doctor --fix`.

Szczegół implementacyjny: decyzja zapada w `initSessionState()` w `src/auto-reply/reply/session.ts`.

---

## Schemat magazynu sesji (`sessions.json`)

Typem wartości magazynu jest `SessionEntry` w `src/config/sessions.ts`.

Kluczowe pola (lista nie jest wyczerpująca):

- `sessionId`: bieżący identyfikator transkryptu (nazwa pliku pochodzi od niego, chyba że ustawiono `sessionFile`)
- `sessionStartedAt`: znacznik czasu rozpoczęcia dla bieżącego `sessionId`; świeżość resetu dziennego
  używa tego pola. Starsze wiersze mogą wyprowadzać go z nagłówka sesji JSONL.
- `lastInteractionAt`: znacznik czasu ostatniej rzeczywistej interakcji użytkownika/kanału; świeżość resetu bezczynności
  używa tego pola, więc zdarzenia Heartbeat, Cron i exec nie utrzymują sesji
  przy życiu. Starsze wiersze bez tego pola wracają do odzyskanego czasu rozpoczęcia sesji
  dla świeżości bezczynności.
- `updatedAt`: znacznik czasu ostatniej mutacji wiersza magazynu, używany do listowania, przycinania i
  księgowania. Nie jest źródłem prawdy dla świeżości resetu dziennego/bezczynności.
- `sessionFile`: opcjonalne jawne nadpisanie ścieżki transkryptu
- `chatType`: `direct | group | room` (pomaga interfejsom użytkownika i polityce wysyłania)
- `provider`, `subject`, `room`, `space`, `displayName`: metadane do etykietowania grup/kanałów
- Przełączniki:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (nadpisanie dla sesji)
- Wybór modelu:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Liczniki tokenów (best-effort / zależne od dostawcy):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: jak często automatyczna Compaction zakończyła się dla tego klucza sesji
- `memoryFlushAt`: znacznik czasu ostatniego flushu pamięci przed Compaction
- `memoryFlushCompactionCount`: liczba Compaction, gdy ostatni flush został uruchomiony

Magazyn jest bezpieczny do edycji, ale Gateway jest źródłem prawdy: może przepisać lub ponownie nawodnić wpisy podczas działania sesji.

---

## Struktura transkryptu (`*.jsonl`)

Transkrypty są zarządzane przez `SessionManager` z `@mariozechner/pi-coding-agent`.

Plik jest w formacie JSONL:

- Pierwszy wiersz: nagłówek sesji (`type: "session"`, zawiera `id`, `cwd`, `timestamp`, opcjonalnie `parentSession`)
- Następnie: wpisy sesji z `id` + `parentId` (drzewo)

Ważne typy wpisów:

- `message`: wiadomości użytkownika/asystenta/toolResult
- `custom_message`: wiadomości wstrzyknięte przez rozszerzenie, które _wchodzą_ do kontekstu modelu (mogą być ukryte w UI)
- `custom`: stan rozszerzenia, który _nie wchodzi_ do kontekstu modelu
- `compaction`: utrwalone podsumowanie Compaction z `firstKeptEntryId` i `tokensBefore`
- `branch_summary`: utrwalone podsumowanie podczas nawigowania po gałęzi drzewa

OpenClaw celowo **nie** „poprawia” transkryptów; Gateway używa `SessionManager` do ich odczytu/zapisu.

---

## Okna kontekstu a śledzone tokeny

Znaczenie mają dwa różne pojęcia:

1. **Okno kontekstu modelu**: twardy limit na model (tokeny widoczne dla modelu)
2. **Liczniki magazynu sesji**: kroczące statystyki zapisywane w `sessions.json` (używane przez /status i pulpity)

Jeśli dostrajasz limity:

- Okno kontekstu pochodzi z katalogu modeli (i może być nadpisane przez konfigurację).
- `contextTokens` w magazynie jest estymacją/wartością raportową czasu wykonania; nie traktuj go jako ścisłej gwarancji.

Więcej znajdziesz w [/token-use](/pl/reference/token-use).

---

## Compaction: czym jest

Compaction podsumowuje starszą rozmowę do utrwalonego wpisu `compaction` w transkrypcie i pozostawia ostatnie wiadomości bez zmian.

Po Compaction przyszłe tury widzą:

- Podsumowanie Compaction
- Wiadomości po `firstKeptEntryId`

Compaction jest **trwała** (w przeciwieństwie do przycinania sesji). Zobacz [/concepts/session-pruning](/pl/concepts/session-pruning).

## Granice fragmentów Compaction i parowanie narzędzi

Gdy OpenClaw dzieli długi transkrypt na fragmenty Compaction, zachowuje
wywołania narzędzi asystenta w parze z odpowiadającymi im wpisami `toolResult`.

- Jeśli podział według udziału tokenów wypada między wywołaniem narzędzia a jego wynikiem, OpenClaw
  przesuwa granicę do komunikatu asystenta z wywołaniem narzędzia zamiast rozdzielać
  parę.
- Jeśli końcowy blok wyniku narzędzia w przeciwnym razie przekroczyłby docelowy rozmiar fragmentu,
  OpenClaw zachowuje ten oczekujący blok narzędzia i utrzymuje nieskrócony ogon
  w całości.
- Przerwane/błędne bloki wywołań narzędzi nie utrzymują otwartego oczekującego podziału.

---

## Kiedy następuje automatyczna Compaction (środowisko uruchomieniowe Pi)

We wbudowanym agencie Pi automatyczna Compaction jest wyzwalana w dwóch przypadkach:

1. **Odzyskiwanie po przepełnieniu**: model zwraca błąd przepełnienia kontekstu
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` oraz podobne warianty ukształtowane przez dostawcę) → compact → ponowna próba.
2. **Utrzymanie progu**: po pomyślnej turze, gdy:

`contextTokens > contextWindow - reserveTokens`

Gdzie:

- `contextWindow` to okno kontekstu modelu
- `reserveTokens` to zapas zarezerwowany na prompty + następne wyjście modelu

Są to semantyki środowiska uruchomieniowego Pi (OpenClaw zużywa zdarzenia, ale Pi decyduje, kiedy wykonać compact).

OpenClaw może też wyzwolić lokalną Compaction przed kontrolą wstępną przed otwarciem następnego
uruchomienia, gdy ustawiono `agents.defaults.compaction.maxActiveTranscriptBytes`, a
aktywny plik transkryptu osiągnie ten rozmiar. Jest to zabezpieczenie rozmiaru pliku dla lokalnego
kosztu ponownego otwarcia, a nie surowa archiwizacja: OpenClaw nadal uruchamia normalną semantyczną Compaction
i wymaga `truncateAfterCompaction`, aby skompaktowane podsumowanie mogło stać się
nowym następczym transkryptem.

Dla wbudowanych uruchomień Pi `agents.defaults.compaction.midTurnPrecheck.enabled: true`
dodaje opcjonalne zabezpieczenie pętli narzędzi. Po dołączeniu wyniku narzędzia i przed
następnym wywołaniem modelu OpenClaw szacuje nacisk promptu, używając tej samej logiki budżetu kontroli wstępnej
co na początku tury. Jeśli kontekst już się nie mieści, zabezpieczenie
nie wykonuje compact wewnątrz hooka `transformContext` Pi. Zgłasza ustrukturyzowany
sygnał kontroli wstępnej w środku tury, zatrzymuje bieżące przesłanie promptu i pozwala
zewnętrznej pętli uruchomienia użyć istniejącej ścieżki odzyskiwania: skrócić zbyt duże wyniki narzędzi,
gdy to wystarczy, albo wyzwolić skonfigurowany tryb Compaction i spróbować ponownie. Opcja
jest domyślnie wyłączona i działa zarówno z trybem Compaction `default`, jak i `safeguard`,
w tym z Compaction `safeguard` obsługiwaną przez dostawcę.
Jest to niezależne od `maxActiveTranscriptBytes`: zabezpieczenie rozmiaru w bajtach działa
przed otwarciem tury, natomiast kontrola wstępna w środku tury działa później we wbudowanej pętli narzędzi Pi
po dołączeniu nowych wyników narzędzi.

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

OpenClaw wymusza też dolny próg bezpieczeństwa dla wbudowanych uruchomień:

- Jeśli `compaction.reserveTokens < reserveTokensFloor`, OpenClaw go podnosi.
- Domyślny dolny próg to `20000` tokenów.
- Ustaw `agents.defaults.compaction.reserveTokensFloor: 0`, aby wyłączyć dolny próg.
- Jeśli jest już wyższy, OpenClaw pozostawia go bez zmian.
- Ręczne `/compact` respektuje jawne `agents.defaults.compaction.keepRecentTokens`
  i zachowuje punkt odcięcia ostatniego ogona Pi. Bez jawnego budżetu zachowania
  ręczna Compaction pozostaje twardym punktem kontrolnym, a odbudowany kontekst zaczyna się od
  nowego podsumowania.
- Ustaw `agents.defaults.compaction.midTurnPrecheck.enabled: true`, aby uruchomić
  opcjonalną kontrolę wstępną pętli narzędzi po nowych wynikach narzędzi i przed następnym
  wywołaniem modelu. To tylko wyzwalacz; generowanie podsumowania nadal używa skonfigurowanej
  ścieżki Compaction. Jest niezależne od `maxActiveTranscriptBytes`, które jest
  zabezpieczeniem rozmiaru aktywnego transkryptu w bajtach na początku tury.
- Ustaw `agents.defaults.compaction.maxActiveTranscriptBytes` na wartość bajtową albo
  ciąg, taki jak `"20mb"`, aby uruchamiać lokalną Compaction przed turą, gdy aktywny
  transkrypt staje się duży. To zabezpieczenie jest aktywne tylko wtedy, gdy
  włączono także `truncateAfterCompaction`. Pozostaw bez ustawienia albo ustaw `0`, aby
  wyłączyć.
- Gdy `agents.defaults.compaction.truncateAfterCompaction` jest włączone,
  OpenClaw obraca aktywny transkrypt do skompaktowanego następczego JSONL po
  Compaction. Stary pełny transkrypt pozostaje zarchiwizowany i połączony z
  punktem kontrolnym Compaction zamiast zostać przepisany w miejscu.

Dlaczego: aby zostawić wystarczający zapas na wieloturowe czynności „porządkowe” (takie jak zapisy pamięci), zanim Compaction stanie się nieunikniona.

Implementacja: `ensurePiCompactionReserveTokens()` w `src/agents/pi-settings.ts`
(wywoływane z `src/agents/pi-embedded-runner.ts`).

---

## Podłączalni dostawcy Compaction

Pluginy mogą rejestrować dostawcę Compaction przez `registerCompactionProvider()` w API pluginu. Gdy `agents.defaults.compaction.provider` jest ustawione na identyfikator zarejestrowanego dostawcy, rozszerzenie safeguard deleguje podsumowywanie do tego dostawcy zamiast używać wbudowanego potoku `summarizeInStages`.

- `provider`: identyfikator zarejestrowanego Pluginu dostawcy Compaction. Pozostaw bez ustawienia dla domyślnego podsumowywania LLM.
- Ustawienie `provider` wymusza `mode: "safeguard"`.
- Dostawcy otrzymują te same instrukcje Compaction i politykę zachowywania identyfikatorów co wbudowana ścieżka.
- Safeguard nadal zachowuje kontekst sufiksu ostatnich tur i podzielonych tur po wyjściu dostawcy.
- Wbudowane podsumowywanie safeguard ponownie destyluje wcześniejsze podsumowania z nowymi komunikatami
  zamiast zachowywać pełne poprzednie podsumowanie dosłownie.
- Tryb safeguard domyślnie włącza audyty jakości podsumowania; ustaw
  `qualityGuard.enabled: false`, aby pominąć zachowanie ponownej próby przy zniekształconym wyjściu.
- Jeśli dostawca zawiedzie albo zwróci pusty wynik, OpenClaw automatycznie przechodzi na wbudowane podsumowywanie LLM.
- Sygnały przerwania/przekroczenia limitu czasu są ponownie zgłaszane (nie połykane), aby uszanować anulowanie przez wywołującego.

Źródło: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Powierzchnie widoczne dla użytkownika

Compaction i stan sesji możesz obserwować przez:

- `/status` (w dowolnej sesji czatu)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Tryb szczegółowy: `🧹 Auto-compaction complete` + liczba Compaction

---

## Ciche czynności porządkowe (`NO_REPLY`)

OpenClaw obsługuje „ciche” tury dla zadań w tle, w których użytkownik nie powinien widzieć wyjścia pośredniego.

Konwencja:

- Asystent zaczyna swoje wyjście od dokładnego cichego tokenu `NO_REPLY` /
  `no_reply`, aby wskazać „nie dostarczaj odpowiedzi użytkownikowi”.
- OpenClaw usuwa/tłumi to w warstwie dostarczania.
- Tłumienie dokładnego cichego tokenu jest niewrażliwe na wielkość liter, więc `NO_REPLY` i
  `no_reply` liczą się oba, gdy cały ładunek jest tylko cichym tokenem.
- Jest to przeznaczone wyłącznie dla prawdziwych tur w tle/bez dostarczania; nie jest skrótem dla
  zwykłych, wykonalnych żądań użytkownika.

Od `2026.1.10` OpenClaw tłumi też **strumieniowanie szkicu/pisania**, gdy
częściowy fragment zaczyna się od `NO_REPLY`, więc ciche operacje nie ujawniają częściowego
wyjścia w środku tury.

---

## „Opróżnianie pamięci” przed Compaction (zaimplementowane)

Cel: zanim nastąpi automatyczna Compaction, uruchomić cichą turę agentową, która zapisuje trwały
stan na dysk (np. `memory/YYYY-MM-DD.md` w przestrzeni roboczej agenta), aby Compaction nie mogła
usunąć krytycznego kontekstu.

OpenClaw używa podejścia **opróżniania przed progiem**:

1. Monitoruj użycie kontekstu sesji.
2. Gdy przekroczy „miękki próg” (poniżej progu Compaction Pi), uruchom cichą
   dyrektywę „zapisz pamięć teraz” dla agenta.
3. Użyj dokładnego cichego tokenu `NO_REPLY` / `no_reply`, aby użytkownik nie widział
   niczego.

Konfiguracja (`agents.defaults.compaction.memoryFlush`):

- `enabled` (domyślnie: `true`)
- `model` (opcjonalne dokładne nadpisanie dostawcy/modelu dla tury opróżniania, na przykład `ollama/qwen3:8b`)
- `softThresholdTokens` (domyślnie: `4000`)
- `prompt` (komunikat użytkownika dla tury opróżniania)
- `systemPrompt` (dodatkowy prompt systemowy dołączany dla tury opróżniania)

Uwagi:

- Domyślny prompt/prompt systemowy zawiera wskazówkę `NO_REPLY`, aby tłumić
  dostarczanie.
- Gdy ustawiono `model`, tura opróżniania używa tego modelu bez dziedziczenia
  łańcucha fallback aktywnej sesji, dzięki czemu lokalne czynności porządkowe nie przechodzą po cichu
  na płatny model konwersacyjny.
- Opróżnianie uruchamia się raz na cykl Compaction (śledzone w `sessions.json`).
- Opróżnianie działa tylko dla wbudowanych sesji Pi (backendy CLI je pomijają).
- Opróżnianie jest pomijane, gdy przestrzeń robocza sesji jest tylko do odczytu (`workspaceAccess: "ro"` lub `"none"`).
- Zobacz [Pamięć](/pl/concepts/memory), aby poznać układ plików przestrzeni roboczej i wzorce zapisu.

Pi udostępnia też hook `session_before_compact` w API rozszerzeń, ale logika
opróżniania OpenClaw działa obecnie po stronie Gateway.

---

## Lista kontrolna rozwiązywania problemów

- Błędny klucz sesji? Zacznij od [/concepts/session](/pl/concepts/session) i potwierdź `sessionKey` w `/status`.
- Niezgodność magazynu z transkryptem? Potwierdź host Gateway i ścieżkę magazynu z `openclaw status`.
- Spam Compaction? Sprawdź:
  - okno kontekstu modelu (zbyt małe)
  - ustawienia Compaction (`reserveTokens` zbyt wysokie dla okna modelu może powodować wcześniejszą Compaction)
  - rozrost wyników narzędzi: włącz/dostrój przycinanie sesji
- Wyciekanie cichych tur? Potwierdź, że odpowiedź zaczyna się od `NO_REPLY` (dokładny token, bez rozróżniania wielkości liter) i że używasz kompilacji zawierającej poprawkę tłumienia strumieniowania.

## Powiązane

- [Zarządzanie sesją](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Silnik kontekstu](/pl/concepts/context-engine)
