---
read_when:
    - Musisz debugować identyfikatory sesji, JSONL transkryptu lub pola sessions.json
    - Zmieniasz zachowanie automatycznej Compaction lub dodajesz porządkowanie „przed Compaction”
    - Chcesz zaimplementować opróżnianie pamięci lub ciche tury systemowe
summary: 'Dogłębna analiza: magazyn sesji + transkrypty, cykl życia i wewnętrzne mechanizmy (auto)Compaction'
title: Szczegółowe omówienie zarządzania sesjami
x-i18n:
    generated_at: "2026-05-11T20:37:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ed30f6b1943b2ed5808c5ccdd593e6899e10fb7f75ff5911e6a9623a30ed6be
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw zarządza sesjami kompleksowo w tych obszarach:

- **Routing sesji** (jak wiadomości przychodzące są mapowane na `sessionKey`)
- **Magazyn sesji** (`sessions.json`) i to, co śledzi
- **Utrwalanie transkryptu** (`*.jsonl`) i jego struktura
- **Higiena transkryptu** (poprawki specyficzne dla dostawcy przed uruchomieniami)
- **Limity kontekstu** (okno kontekstu a śledzone tokeny)
- **Compaction** (ręczna i automatyczna Compaction) oraz miejsca podpinania pracy przed Compaction
- **Ciche porządkowanie** (zapisy pamięci, które nie powinny generować wyjścia widocznego dla użytkownika)

Jeśli chcesz najpierw zapoznać się z ogólnym omówieniem, zacznij tutaj:

- [Zarządzanie sesjami](/pl/concepts/session)
- [Compaction](/pl/concepts/compaction)
- [Omówienie pamięci](/pl/concepts/memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Higiena transkryptu](/pl/reference/transcript-hygiene)

---

## Źródło prawdy: Gateway

OpenClaw zaprojektowano wokół jednego **procesu Gateway**, który jest właścicielem stanu sesji.

- Interfejsy użytkownika (aplikacja macOS, webowy Control UI, TUI) powinny odpytywać Gateway o listy sesji i liczniki tokenów.
- W trybie zdalnym pliki sesji znajdują się na zdalnym hoście; „sprawdzenie plików na lokalnym Macu” nie odzwierciedli tego, czego używa Gateway.

---

## Dwie warstwy utrwalania

OpenClaw utrwala sesje w dwóch warstwach:

1. **Magazyn sesji (`sessions.json`)**
   - Mapa klucz/wartość: `sessionKey -> SessionEntry`
   - Mały, modyfikowalny, bezpieczny do edycji (lub usuwania wpisów)
   - Śledzi metadane sesji (bieżący identyfikator sesji, ostatnią aktywność, przełączniki, liczniki tokenów itd.)

2. **Transkrypt (`<sessionId>.jsonl`)**
   - Transkrypt tylko do dopisywania ze strukturą drzewa (wpisy mają `id` + `parentId`)
   - Przechowuje właściwą rozmowę + wywołania narzędzi + podsumowania Compaction
   - Służy do odbudowy kontekstu modelu dla przyszłych tur
   - Duże punkty kontrolne debugowania sprzed Compaction są pomijane, gdy aktywny
     transkrypt przekroczy limit rozmiaru punktu kontrolnego, co pozwala uniknąć drugiej ogromnej
     kopii `.checkpoint.*.jsonl`.

Czytniki historii Gateway powinny unikać materializowania całego transkryptu, chyba że
dana powierzchnia wyraźnie potrzebuje dowolnego dostępu do historii. Historia pierwszej strony,
osadzona historia czatu, odzyskiwanie po restarcie oraz sprawdzanie tokenów/użycia używają ograniczonych
odczytów ogona. Pełne skanowanie transkryptu przechodzi przez asynchroniczny indeks transkryptu, który jest
buforowany według ścieżki pliku oraz `mtimeMs`/`size` i współdzielony przez równoczesnych czytelników.

---

## Lokalizacje na dysku

Dla każdego agenta, na hoście Gateway:

- Magazyn: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrypty: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesje tematów Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw rozwiązuje je przez `src/config/sessions.ts`.

---

## Utrzymanie magazynu i kontrola dysku

Utrwalanie sesji ma automatyczne mechanizmy utrzymania (`session.maintenance`) dla `sessions.json`, artefaktów transkryptów i plików towarzyszących trajektorii:

- `mode`: `warn` (domyślnie) albo `enforce`
- `pruneAfter`: próg wieku nieaktualnych wpisów (domyślnie `30d`)
- `maxEntries`: limit wpisów w `sessions.json` (domyślnie `500`)
- `resetArchiveRetention`: retencja archiwów transkryptów `*.reset.<timestamp>` (domyślnie taka sama jak `pruneAfter`; `false` wyłącza czyszczenie)
- `maxDiskBytes`: opcjonalny budżet katalogu sesji
- `highWaterBytes`: opcjonalny cel po czyszczeniu (domyślnie `80%` z `maxDiskBytes`)

Normalne zapisy Gateway przechodzą przez przypisany do magazynu writer sesji, który serializuje mutacje w procesie bez zakładania blokady pliku w czasie wykonywania. Pomocniki poprawek na gorącej ścieżce pożyczają zweryfikowaną modyfikowalną pamięć podręczną, gdy trzymają ten slot writera, więc duże pliki `sessions.json` nie są klonowane ani ponownie odczytywane przy każdej aktualizacji metadanych. Kod runtime powinien preferować `updateSessionStore(...)` albo `updateSessionStoreEntry(...)`; bezpośrednie zapisy całego magazynu są narzędziami kompatybilności i utrzymania offline. Gdy Gateway jest osiągalny, niedziałające w trybie dry-run polecenia `openclaw sessions cleanup` i `openclaw agents delete` delegują mutacje magazynu do Gateway, aby czyszczenie trafiło do tej samej kolejki writera; `--store <path>` jest jawną ścieżką naprawy offline dla bezpośredniego utrzymania plików. Czyszczenie `maxEntries` nadal jest grupowane dla limitów o rozmiarach produkcyjnych, więc magazyn może krótkotrwale przekroczyć skonfigurowany limit, zanim kolejne czyszczenie wysokiego poziomu zredukuje go ponownie. Odczyty magazynu sesji nie przycinają ani nie limitują wpisów podczas uruchamiania Gateway; do czyszczenia użyj zapisów albo `openclaw sessions cleanup --enforce`. `openclaw sessions cleanup --enforce` nadal natychmiast stosuje skonfigurowany limit i przycina stare nieodwołane artefakty transkryptów, punktów kontrolnych i trajektorii, nawet gdy nie skonfigurowano budżetu dyskowego.

Utrzymanie zachowuje trwałe zewnętrzne wskaźniki rozmów, takie jak sesje grupowe
i sesje czatu ograniczone do wątku, ale syntetyczne wpisy runtime dla Cron, hooków,
Heartbeat, ACP i podagentów nadal mogą zostać usunięte, gdy przekroczą
skonfigurowany wiek, liczbę lub budżet dyskowy.

OpenClaw nie tworzy już automatycznych rotacyjnych kopii zapasowych `sessions.json.bak.*` podczas zapisów Gateway. Starszy klucz `session.maintenance.rotateBytes` jest ignorowany, a `openclaw doctor --fix` usuwa go ze starszych konfiguracji.

Mutacje transkryptu używają blokady zapisu sesji na pliku transkryptu. Uzyskanie blokady czeka maksymalnie
`session.writeLock.acquireTimeoutMs`, zanim zgłosi błąd zajętej sesji; wartość domyślna to `60000`
ms. Zwiększaj ją tylko wtedy, gdy uzasadnione przygotowanie, czyszczenie, Compaction lub praca nad lustrem transkryptu rywalizują
dłużej na wolnych maszynach. Wykrywanie nieaktualnych blokad i ostrzeżenia o maksymalnym czasie trzymania pozostają osobnymi politykami.

Kolejność egzekwowania czyszczenia budżetu dyskowego (`mode: "enforce"`):

1. Najpierw usuń najstarsze zarchiwizowane, osierocone artefakty transkryptów lub osierocone artefakty trajektorii.
2. Jeśli nadal przekroczony jest cel, usuń najstarsze wpisy sesji i ich pliki transkryptów/trajektorii.
3. Kontynuuj, aż użycie będzie równe `highWaterBytes` lub niższe.

W `mode: "warn"` OpenClaw zgłasza potencjalne usunięcia, ale nie modyfikuje magazynu/plików.

Uruchom utrzymanie na żądanie:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesje Cron i logi uruchomień

Izolowane uruchomienia Cron również tworzą wpisy sesji/transkrypty i mają dedykowane mechanizmy retencji:

- `cron.sessionRetention` (domyślnie `24h`) przycina stare izolowane sesje uruchomień Cron z magazynu sesji (`false` wyłącza).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` przycinają pliki `~/.openclaw/cron/runs/<jobId>.jsonl` (domyślnie: `2_000_000` bajtów i `2000` linii).

Gdy Cron wymusza utworzenie nowej izolowanej sesji uruchomienia, sanityzuje poprzedni
wpis sesji `cron:<jobId>` przed zapisaniem nowego wiersza. Przenosi bezpieczne
preferencje, takie jak ustawienia myślenia/szybkości/szczegółowości, etykiety oraz jawne
wybrane przez użytkownika nadpisania modelu/uwierzytelniania. Odrzuca otaczający kontekst rozmowy, taki
jak routing kanału/grupy, politykę wysyłania lub kolejkowania, podniesienie uprawnień, pochodzenie oraz powiązanie runtime ACP,
aby świeże izolowane uruchomienie nie mogło odziedziczyć przestarzałego dostarczania ani
uprawnień runtime ze starszego uruchomienia.

---

## Klucze sesji (`sessionKey`)

`sessionKey` identyfikuje _koszyk rozmowy_, w którym jesteś (routing + izolacja).

Typowe wzorce:

- Główny/bezpośredni czat (dla agenta): `agent:<agentId>:<mainKey>` (domyślnie `main`)
- Grupa: `agent:<agentId>:<channel>:group:<id>`
- Pokój/kanał (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` albo `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (chyba że nadpisano)

Reguły kanoniczne są udokumentowane na [/concepts/session](/pl/concepts/session).

---

## Identyfikatory sesji (`sessionId`)

Każdy `sessionKey` wskazuje bieżący `sessionId` (plik transkryptu, który kontynuuje rozmowę).

Zasady ogólne:

- **Reset** (`/new`, `/reset`) tworzy nowy `sessionId` dla tego `sessionKey`.
- **Reset dzienny** (domyślnie 4:00 AM czasu lokalnego na hoście gateway) tworzy nowy `sessionId` przy następnej wiadomości po granicy resetu.
- **Wygaśnięcie bezczynności** (`session.reset.idleMinutes` albo starsze `session.idleMinutes`) tworzy nowy `sessionId`, gdy wiadomość nadejdzie po oknie bezczynności. Gdy skonfigurowano zarówno reset dzienny, jak i bezczynność, wygrywa ten, który wygaśnie pierwszy.
- **Zdarzenia systemowe** (Heartbeat, wybudzenia Cron, powiadomienia exec, księgowość gateway) mogą modyfikować wiersz sesji, ale nie przedłużają świeżości resetu dziennego/bezczynności. Przejście resetu odrzuca zakolejkowane powiadomienia zdarzeń systemowych dla poprzedniej sesji przed zbudowaniem świeżego promptu.
- **Polityka forka rodzica** używa aktywnej gałęzi Pi podczas tworzenia wątku lub forka podagenta. Jeśli ta gałąź jest zbyt duża, OpenClaw uruchamia dziecko z izolowanym kontekstem zamiast kończyć błędem lub dziedziczyć nieużywalną historię. Polityka rozmiaru jest automatyczna; starsza konfiguracja `session.parentForkMaxTokens` jest usuwana przez `openclaw doctor --fix`.

Szczegół implementacyjny: decyzja zapada w `initSessionState()` w `src/auto-reply/reply/session.ts`.

---

## Schemat magazynu sesji (`sessions.json`)

Typem wartości magazynu jest `SessionEntry` w `src/config/sessions.ts`.

Kluczowe pola (lista niepełna):

- `sessionId`: bieżący identyfikator transkryptu (nazwa pliku jest wyprowadzana z niego, chyba że ustawiono `sessionFile`)
- `sessionStartedAt`: znacznik czasu początku bieżącego `sessionId`; świeżość resetu dziennego
  używa tej wartości. Starsze wiersze mogą wyprowadzać ją z nagłówka sesji JSONL.
- `lastInteractionAt`: znacznik czasu ostatniej rzeczywistej interakcji użytkownika/kanału; świeżość resetu
  bezczynności używa tej wartości, aby Heartbeat, Cron i zdarzenia exec nie utrzymywały sesji
  przy życiu. Starsze wiersze bez tego pola wracają do odzyskanego czasu rozpoczęcia sesji
  dla świeżości bezczynności.
- `updatedAt`: znacznik czasu ostatniej mutacji wiersza magazynu, używany do listowania, przycinania i
  księgowości. Nie jest autorytetem dla świeżości resetu dziennego/bezczynności.
- `sessionFile`: opcjonalne jawne nadpisanie ścieżki transkryptu
- `chatType`: `direct | group | room` (pomaga interfejsom użytkownika i polityce wysyłania)
- `provider`, `subject`, `room`, `space`, `displayName`: metadane etykietowania grup/kanałów
- Przełączniki:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (nadpisanie dla sesji)
- Wybór modelu:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Liczniki tokenów (najlepsze możliwe / zależne od dostawcy):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: ile razy automatyczna Compaction zakończyła się dla tego klucza sesji
- `memoryFlushAt`: znacznik czasu ostatniego zrzutu pamięci przed Compaction
- `memoryFlushCompactionCount`: liczba Compaction, gdy ostatni zrzut został uruchomiony

Magazyn jest bezpieczny do edycji, ale Gateway jest autorytetem: może przepisać lub ponownie nawodnić wpisy podczas działania sesji.

---

## Struktura transkryptu (`*.jsonl`)

Transkryptami zarządza `SessionManager` z `@earendil-works/pi-coding-agent`.

Plik jest w formacie JSONL:

- Pierwsza linia: nagłówek sesji (`type: "session"`, zawiera `id`, `cwd`, `timestamp`, opcjonalnie `parentSession`)
- Następnie: wpisy sesji z `id` + `parentId` (drzewo)

Ważne typy wpisów:

- `message`: wiadomości użytkownika/asystenta/toolResult
- `custom_message`: wiadomości wstrzyknięte przez rozszerzenie, które _wchodzą_ do kontekstu modelu (mogą być ukryte przed UI)
- `custom`: stan rozszerzenia, który _nie wchodzi_ do kontekstu modelu
- `compaction`: utrwalone podsumowanie Compaction z `firstKeptEntryId` i `tokensBefore`
- `branch_summary`: utrwalone podsumowanie podczas nawigacji po gałęzi drzewa

OpenClaw celowo **nie** „poprawia” transkryptów; Gateway używa `SessionManager` do ich odczytu/zapisu.

---

## Okna kontekstu a śledzone tokeny

Znaczenie mają dwie różne koncepcje:

1. **Okno kontekstu modelu**: twardy limit dla modelu (tokeny widoczne dla modelu)
2. **Liczniki magazynu sesji**: kroczące statystyki zapisywane w `sessions.json` (używane przez /status i pulpity)

Jeśli dostrajasz limity:

- Okno kontekstu pochodzi z katalogu modeli (i można je nadpisać przez konfigurację).
- `contextTokens` w magazynie to wartość szacowana/raportowana w runtime; nie traktuj jej jako ścisłej gwarancji.

Więcej informacji znajdziesz w [/token-use](/pl/reference/token-use).

---

## Compaction: czym jest

Compaction podsumowuje starszą rozmowę w utrwalonym wpisie `compaction` w transkrypcie i zachowuje najnowsze wiadomości bez zmian.

Po Compaction przyszłe tury widzą:

- Podsumowanie Compaction
- Wiadomości po `firstKeptEntryId`

Compaction jest **trwałe** (w przeciwieństwie do przycinania sesji). Zobacz [/concepts/session-pruning](/pl/concepts/session-pruning).

## Granice fragmentów Compaction i parowanie narzędzi

Gdy OpenClaw dzieli długi transkrypt na fragmenty Compaction, zachowuje
wywołania narzędzi asystenta sparowane z odpowiadającymi im wpisami `toolResult`.

- Jeśli podział według udziału tokenów wypada między wywołaniem narzędzia a jego wynikiem, OpenClaw
  przesuwa granicę do komunikatu wywołania narzędzia asystenta zamiast rozdzielać
  parę.
- Jeśli końcowy blok wyniku narzędzia w przeciwnym razie przekroczyłby docelowy rozmiar fragmentu,
  OpenClaw zachowuje ten oczekujący blok narzędzia i pozostawia nieskrócony ogon
  w stanie nienaruszonym.
- Przerwane/blokowe wywołania narzędzi zakończone błędem nie utrzymują oczekującego podziału otwartym.

---

## Kiedy następuje automatyczne Compaction (środowisko uruchomieniowe Pi)

W osadzonym agencie Pi automatyczne Compaction uruchamia się w dwóch przypadkach:

1. **Odzyskiwanie po przepełnieniu**: model zwraca błąd przepełnienia kontekstu
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` oraz podobne warianty specyficzne dla dostawcy) → wykonaj Compaction → spróbuj ponownie.
2. **Utrzymanie progu**: po udanej turze, gdy:

`contextTokens > contextWindow - reserveTokens`

Gdzie:

- `contextWindow` to okno kontekstu modelu
- `reserveTokens` to zapas zarezerwowany na prompty + następne wyjście modelu

Są to semantyki środowiska uruchomieniowego Pi (OpenClaw konsumuje zdarzenia, ale Pi decyduje, kiedy wykonać Compaction).

OpenClaw może także uruchomić lokalne Compaction przed sprawdzeniem wstępnym, przed otwarciem następnego
uruchomienia, gdy ustawiono `agents.defaults.compaction.maxActiveTranscriptBytes`, a
aktywny plik transkryptu osiągnie ten rozmiar. To zabezpieczenie rozmiaru pliku dla lokalnego
kosztu ponownego otwarcia, a nie surowa archiwizacja: OpenClaw nadal wykonuje zwykłe semantyczne Compaction
i wymaga `truncateAfterCompaction`, aby skompaktowane podsumowanie mogło stać się
nowym następnikiem transkryptu.

Dla osadzonych uruchomień Pi `agents.defaults.compaction.midTurnPrecheck.enabled: true`
dodaje opcjonalne zabezpieczenie pętli narzędzi. Po dołączeniu wyniku narzędzia i przed
następnym wywołaniem modelu OpenClaw szacuje presję promptu, używając tej samej logiki budżetu
sprawdzenia wstępnego, która jest używana na początku tury. Jeśli kontekst już się nie mieści, zabezpieczenie
nie wykonuje Compaction wewnątrz hooka `transformContext` Pi. Zgłasza ustrukturyzowany
sygnał sprawdzenia wstępnego w połowie tury, zatrzymuje bieżące przesłanie promptu i pozwala
zewnętrznej pętli uruchomieniowej użyć istniejącej ścieżki odzyskiwania: przyciąć zbyt duże wyniki narzędzi,
gdy to wystarczy, albo uruchomić skonfigurowany tryb Compaction i spróbować ponownie. Ta
opcja jest domyślnie wyłączona i działa zarówno z trybem Compaction `default`, jak i `safeguard`,
w tym z Compaction `safeguard` wspieranym przez dostawcę.
Jest to niezależne od `maxActiveTranscriptBytes`: zabezpieczenie rozmiaru w bajtach działa
przed otwarciem tury, natomiast sprawdzenie wstępne w połowie tury działa później w osadzonej pętli narzędzi Pi,
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

OpenClaw wymusza także dolny próg bezpieczeństwa dla osadzonych uruchomień:

- Jeśli `compaction.reserveTokens < reserveTokensFloor`, OpenClaw go podnosi.
- Domyślny próg to `20000` tokenów.
- Ustaw `agents.defaults.compaction.reserveTokensFloor: 0`, aby wyłączyć ten próg.
- Jeśli wartość jest już wyższa, OpenClaw zostawia ją bez zmian.
- Ręczne `/compact` respektuje jawne `agents.defaults.compaction.keepRecentTokens`
  i zachowuje punkt odcięcia ostatniego ogona Pi. Bez jawnego budżetu zachowania,
  ręczne Compaction pozostaje twardym punktem kontrolnym, a odbudowany kontekst zaczyna się od
  nowego podsumowania.
- Ustaw `agents.defaults.compaction.midTurnPrecheck.enabled: true`, aby uruchamiać
  opcjonalne sprawdzenie wstępne pętli narzędzi po nowych wynikach narzędzi i przed następnym
  wywołaniem modelu. To tylko wyzwalacz; generowanie podsumowania nadal używa skonfigurowanej
  ścieżki Compaction. Jest niezależne od `maxActiveTranscriptBytes`, które jest
  zabezpieczeniem rozmiaru w bajtach aktywnego transkryptu na początku tury.
- Ustaw `agents.defaults.compaction.maxActiveTranscriptBytes` na wartość w bajtach lub
  ciąg taki jak `"20mb"`, aby uruchamiać lokalne Compaction przed turą, gdy aktywny
  transkrypt staje się duży. To zabezpieczenie jest aktywne tylko wtedy, gdy
  włączono także `truncateAfterCompaction`. Pozostaw bez ustawienia albo ustaw `0`, aby
  wyłączyć.
- Gdy `agents.defaults.compaction.truncateAfterCompaction` jest włączone,
  OpenClaw rotuje aktywny transkrypt do skompaktowanego następcy JSONL po
  Compaction. Stary pełny transkrypt pozostaje zarchiwizowany i połączony z
  punktem kontrolnym Compaction zamiast być przepisywany w miejscu.

Dlaczego: aby pozostawić wystarczający zapas na wieloturowe „porządkowanie” (takie jak zapisy pamięci), zanim Compaction stanie się nieuniknione.

Implementacja: `ensurePiCompactionReserveTokens()` w `src/agents/pi-settings.ts`
(wywoływane z `src/agents/pi-embedded-runner.ts`).

---

## Wymienne dostawcy Compaction

Pluginy mogą rejestrować dostawcę Compaction przez `registerCompactionProvider()` w API pluginu. Gdy `agents.defaults.compaction.provider` jest ustawione na zarejestrowany identyfikator dostawcy, rozszerzenie zabezpieczające deleguje podsumowywanie do tego dostawcy zamiast do wbudowanego potoku `summarizeInStages`.

- `provider`: identyfikator zarejestrowanego Pluginu dostawcy Compaction. Pozostaw bez ustawienia dla domyślnego podsumowywania LLM.
- Ustawienie `provider` wymusza `mode: "safeguard"`.
- Dostawcy otrzymują te same instrukcje Compaction i zasady zachowania identyfikatorów co ścieżka wbudowana.
- Zabezpieczenie nadal zachowuje kontekst ostatnich tur i sufiksu podzielonej tury po wyjściu dostawcy.
- Wbudowane podsumowywanie zabezpieczające ponownie destyluje wcześniejsze podsumowania z nowymi wiadomościami
  zamiast zachowywać pełne poprzednie podsumowanie dosłownie.
- Tryb zabezpieczenia domyślnie włącza audyty jakości podsumowania; ustaw
  `qualityGuard.enabled: false`, aby pominąć ponawianie przy nieprawidłowo uformowanym wyjściu.
- Jeśli dostawca zawiedzie albo zwróci pusty wynik, OpenClaw automatycznie wraca do wbudowanego podsumowywania LLM.
- Sygnały przerwania/limitu czasu są ponownie zgłaszane (nie połykane), aby respektować anulowanie przez wywołującego.

Źródło: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Powierzchnie widoczne dla użytkownika

Compaction i stan sesji możesz obserwować przez:

- `/status` (w dowolnej sesji czatu)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Logi Gateway (`pnpm gateway:watch` lub `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Tryb szczegółowy: `🧹 Auto-compaction complete` + liczba Compaction

---

## Ciche porządkowanie (`NO_REPLY`)

OpenClaw obsługuje „ciche” tury dla zadań w tle, w których użytkownik nie powinien widzieć pośredniego wyjścia.

Konwencja:

- Asystent zaczyna swoje wyjście dokładnym cichym tokenem `NO_REPLY` /
  `no_reply`, aby wskazać „nie dostarczaj odpowiedzi użytkownikowi”.
- OpenClaw usuwa/tłumi to w warstwie dostarczania.
- Tłumienie dokładnego cichego tokenu jest niewrażliwe na wielkość liter, więc `NO_REPLY` i
  `no_reply` oba się liczą, gdy cała zawartość to tylko cichy token.
- To jest przeznaczone wyłącznie dla prawdziwych tur w tle/bez dostarczania; nie jest skrótem dla
  zwykłych, wymagających działania żądań użytkownika.

Od `2026.1.10` OpenClaw tłumi także **strumieniowanie szkicu/pisania**, gdy
częściowy fragment zaczyna się od `NO_REPLY`, dzięki czemu ciche operacje nie ujawniają częściowego
wyjścia w połowie tury.

---

## „Zrzut pamięci” przed Compaction (zaimplementowane)

Cel: przed automatycznym Compaction uruchomić cichą turę agentową, która zapisuje trwały
stan na dysk (np. `memory/YYYY-MM-DD.md` w przestrzeni roboczej agenta), aby Compaction nie mogło
usunąć krytycznego kontekstu.

OpenClaw używa podejścia **zrzutu przed progiem**:

1. Monitoruj użycie kontekstu sesji.
2. Gdy przekroczy „miękki próg” (poniżej progu Compaction Pi), uruchom cichą
   dyrektywę „zapisz pamięć teraz” dla agenta.
3. Użyj dokładnego cichego tokenu `NO_REPLY` / `no_reply`, aby użytkownik
   nic nie widział.

Konfiguracja (`agents.defaults.compaction.memoryFlush`):

- `enabled` (domyślnie: `true`)
- `model` (opcjonalne dokładne nadpisanie dostawcy/modelu dla tury zrzutu, na przykład `ollama/qwen3:8b`)
- `softThresholdTokens` (domyślnie: `4000`)
- `prompt` (wiadomość użytkownika dla tury zrzutu)
- `systemPrompt` (dodatkowy prompt systemowy dołączony dla tury zrzutu)

Uwagi:

- Domyślny prompt/prompt systemowy zawiera wskazówkę `NO_REPLY`, aby stłumić
  dostarczanie.
- Gdy ustawiono `model`, tura zrzutu używa tego modelu bez dziedziczenia
  łańcucha fallback aktywnej sesji, więc lokalne porządkowanie nie przełącza się po cichu
  na płatny model konwersacyjny.
- Zrzut uruchamia się raz na cykl Compaction (śledzone w `sessions.json`).
- Zrzut działa tylko dla osadzonych sesji Pi (backendy CLI go pomijają).
- Zrzut jest pomijany, gdy przestrzeń robocza sesji jest tylko do odczytu (`workspaceAccess: "ro"` lub `"none"`).
- Zobacz [Pamięć](/pl/concepts/memory), aby poznać układ plików przestrzeni roboczej i wzorce zapisu.

Pi udostępnia także hook `session_before_compact` w API rozszerzenia, ale logika
zrzutu OpenClaw znajduje się dziś po stronie Gateway.

---

## Lista kontrolna rozwiązywania problemów

- Błędny klucz sesji? Zacznij od [/concepts/session](/pl/concepts/session) i potwierdź `sessionKey` w `/status`.
- Niezgodność magazynu i transkryptu? Potwierdź host Gateway i ścieżkę magazynu z `openclaw status`.
- Nadmiar Compaction? Sprawdź:
  - okno kontekstu modelu (za małe)
  - ustawienia Compaction (`reserveTokens` zbyt wysokie względem okna modelu może powodować wcześniejsze Compaction)
  - rozdęte wyniki narzędzi: włącz/dostosuj przycinanie sesji
- Wyciek cichych tur? Potwierdź, że odpowiedź zaczyna się od `NO_REPLY` (dokładny token niewrażliwy na wielkość liter) i że używasz kompilacji zawierającej poprawkę tłumienia strumieniowania.

## Powiązane

- [Zarządzanie sesją](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Silnik kontekstu](/pl/concepts/context-engine)
