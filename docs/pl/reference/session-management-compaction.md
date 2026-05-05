---
read_when:
    - Musisz debugować identyfikatory sesji, JSONL transkrypcji lub pola sessions.json
    - Zmieniasz zachowanie automatycznej Compaction lub dodajesz prace porządkowe przed Compaction
    - Chcesz zaimplementować czyszczenie pamięci lub ciche tury systemowe
summary: 'Dogłębna analiza: magazyn sesji + transkrypcje, cykl życia i wewnętrzne mechanizmy (auto)Compaction'
title: Szczegółowe omówienie zarządzania sesjami
x-i18n:
    generated_at: "2026-05-05T08:26:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3161dd9c98bff7ea24266f44a9261693d8a9ee2b47d9af2d152de7057016748b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw zarządza sesjami end-to-end w tych obszarach:

- **Trasowanie sesji** (jak wiadomości przychodzące są mapowane na `sessionKey`)
- **Magazyn sesji** (`sessions.json`) i to, co śledzi
- **Utrwalanie transkryptu** (`*.jsonl`) i jego struktura
- **Higiena transkryptu** (poprawki specyficzne dla dostawcy przed uruchomieniami)
- **Limity kontekstu** (okno kontekstu a śledzone tokeny)
- **Compaction** (ręczna i automatyczna Compaction) oraz miejsca podłączenia pracy przed Compaction
- **Ciche prace porządkowe** (zapisy pamięci, które nie powinny generować wyjścia widocznego dla użytkownika)

Jeśli najpierw chcesz uzyskać ogólny przegląd, zacznij od:

- [Zarządzanie sesjami](/pl/concepts/session)
- [Compaction](/pl/concepts/compaction)
- [Przegląd pamięci](/pl/concepts/memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Higiena transkryptu](/pl/reference/transcript-hygiene)

---

## Źródło prawdy: Gateway

OpenClaw jest zaprojektowany wokół jednego **procesu Gateway**, który posiada stan sesji.

- Interfejsy użytkownika (aplikacja macOS, webowy Control UI, TUI) powinny odpytywać Gateway o listy sesji i liczniki tokenów.
- W trybie zdalnym pliki sesji znajdują się na zdalnym hoście; „sprawdzenie lokalnych plików Maca” nie odzwierciedli tego, czego używa Gateway.

---

## Dwie warstwy trwałości

OpenClaw utrwala sesje w dwóch warstwach:

1. **Magazyn sesji (`sessions.json`)**
   - Mapa klucz/wartość: `sessionKey -> SessionEntry`
   - Mała, mutowalna, bezpieczna do edycji (lub usuwania wpisów)
   - Śledzi metadane sesji (bieżący identyfikator sesji, ostatnia aktywność, przełączniki, liczniki tokenów itd.)

2. **Transkrypt (`<sessionId>.jsonl`)**
   - Transkrypt tylko do dopisywania ze strukturą drzewa (wpisy mają `id` + `parentId`)
   - Przechowuje właściwą rozmowę + wywołania narzędzi + podsumowania Compaction
   - Służy do odbudowy kontekstu modelu dla przyszłych tur
   - Duże punkty kontrolne debugowania sprzed Compaction są pomijane, gdy aktywny
     transkrypt przekroczy limit rozmiaru punktu kontrolnego, co pozwala uniknąć drugiej ogromnej
     kopii `.checkpoint.*.jsonl`.

Czytniki historii Gateway powinny unikać materializowania całego transkryptu, chyba że
dana powierzchnia wyraźnie potrzebuje dowolnego dostępu do historii. Historia pierwszej strony,
osadzona historia czatu, odzyskiwanie po restarcie oraz kontrole tokenów/użycia korzystają z ograniczonych odczytów ogona.
Pełne skany transkryptu przechodzą przez asynchroniczny indeks transkryptu, który jest
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

Trwałość sesji ma automatyczne mechanizmy utrzymania (`session.maintenance`) dla `sessions.json`, artefaktów transkryptu i pobocznych plików trajektorii:

- `mode`: `warn` (domyślnie) albo `enforce`
- `pruneAfter`: próg wieku nieaktualnych wpisów (domyślnie `30d`)
- `maxEntries`: limit wpisów w `sessions.json` (domyślnie `500`)
- `resetArchiveRetention`: retencja archiwów transkryptów `*.reset.<timestamp>` (domyślnie taka sama jak `pruneAfter`; `false` wyłącza czyszczenie)
- `maxDiskBytes`: opcjonalny budżet katalogu sesji
- `highWaterBytes`: opcjonalny cel po czyszczeniu (domyślnie `80%` z `maxDiskBytes`)

Normalne zapisy Gateway przechodzą przez przypisany do magazynu writer sesji, który szereguje mutacje w procesie bez zakładania blokady pliku w runtime. Pomocniki łatek na gorącej ścieżce pożyczają zweryfikowaną mutowalną pamięć podręczną, gdy trzymają ten slot writera, więc duże pliki `sessions.json` nie są klonowane ani ponownie odczytywane przy każdej aktualizacji metadanych. Kod runtime powinien preferować `updateSessionStore(...)` albo `updateSessionStoreEntry(...)`; bezpośrednie zapisy całego magazynu są narzędziami kompatybilności i utrzymania offline. Gdy Gateway jest osiągalny, niedziałające w trybie dry-run polecenia `openclaw sessions cleanup` i `openclaw agents delete` delegują mutacje magazynu do Gateway, aby czyszczenie dołączyło do tej samej kolejki writera; `--store <path>` jest jawną ścieżką naprawy offline do bezpośredniego utrzymania plików. Czyszczenie `maxEntries` nadal jest przetwarzane partiami dla limitów produkcyjnej wielkości, więc magazyn może krótko przekraczać skonfigurowany limit, zanim następne czyszczenie wysokiego progu zapisze go z powrotem w dół. Odczyty magazynu sesji nie przycinają ani nie ograniczają wpisów podczas startu Gateway; do czyszczenia używaj zapisów albo `openclaw sessions cleanup --enforce`. `openclaw sessions cleanup --enforce` nadal natychmiast stosuje skonfigurowany limit i przycina stare, nieodwołane artefakty transkryptów, punktów kontrolnych i trajektorii, nawet gdy nie skonfigurowano budżetu dyskowego.

Utrzymanie zachowuje trwałe zewnętrzne wskaźniki rozmów, takie jak sesje grupowe
i sesje czatu w zakresie wątku, ale syntetyczne wpisy runtime dla cron, hooków,
Heartbeat, ACP i podagentów nadal mogą zostać usunięte, gdy przekroczą
skonfigurowany wiek, licznik lub budżet dyskowy.

OpenClaw nie tworzy już automatycznych kopii zapasowych rotacji `sessions.json.bak.*` podczas zapisów Gateway. Starszy klucz `session.maintenance.rotateBytes` jest ignorowany, a `openclaw doctor --fix` usuwa go ze starszych konfiguracji.

Mutacje transkryptu używają blokady zapisu sesji na pliku transkryptu. Pozyskanie blokady czeka do
`session.writeLock.acquireTimeoutMs`, zanim zgłosi błąd zajętej sesji; domyślna wartość to `60000`
ms. Zwiększaj to tylko wtedy, gdy prawidłowe przygotowanie, czyszczenie, Compaction lub praca lustra transkryptu powodują
dłuższą rywalizację na wolnych maszynach. Wykrywanie nieaktualnych blokad i ostrzeżenia o maksymalnym czasie trzymania pozostają osobnymi zasadami.

Kolejność egzekwowania czyszczenia budżetu dyskowego (`mode: "enforce"`):

1. Najpierw usuń najstarsze zarchiwizowane, osierocone artefakty transkryptów albo osierocone artefakty trajektorii.
2. Jeśli nadal przekracza cel, eksmituj najstarsze wpisy sesji oraz ich pliki transkryptów/trajektorii.
3. Kontynuuj, aż użycie będzie równe lub niższe niż `highWaterBytes`.

W `mode: "warn"` OpenClaw raportuje potencjalne eksmisje, ale nie mutuje magazynu/plików.

Uruchom utrzymanie na żądanie:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesje Cron i logi uruchomień

Izolowane uruchomienia Cron również tworzą wpisy sesji/transkrypty i mają dedykowane mechanizmy retencji:

- `cron.sessionRetention` (domyślnie `24h`) przycina stare izolowane sesje uruchomień Cron z magazynu sesji (`false` wyłącza).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` przycinają pliki `~/.openclaw/cron/runs/<jobId>.jsonl` (domyślnie: `2_000_000` bajtów i `2000` wierszy).

Gdy Cron wymusza utworzenie nowej izolowanej sesji uruchomienia, sanityzuje poprzedni
wpis sesji `cron:<jobId>` przed zapisaniem nowego wiersza. Przenosi bezpieczne
preferencje, takie jak ustawienia thinking/fast/verbose, etykiety oraz jawne
wybrane przez użytkownika nadpisania modelu/autoryzacji. Odrzuca otaczający kontekst rozmowy, taki
jak trasowanie kanału/grupy, zasada wysyłania lub kolejkowania, podniesienie uprawnień, pochodzenie i
powiązanie runtime ACP, aby świeże izolowane uruchomienie nie mogło odziedziczyć nieaktualnego dostarczania ani
uprawnień runtime ze starszego uruchomienia.

---

## Klucze sesji (`sessionKey`)

`sessionKey` identyfikuje _koszyk rozmowy_, w którym jesteś (trasowanie + izolacja).

Typowe wzorce:

- Główny/bezpośredni czat (na agenta): `agent:<agentId>:<mainKey>` (domyślnie `main`)
- Grupa: `agent:<agentId>:<channel>:group:<id>`
- Pokój/kanał (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` albo `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (chyba że nadpisano)

Kanoniczne reguły są udokumentowane w [/concepts/session](/pl/concepts/session).

---

## Identyfikatory sesji (`sessionId`)

Każdy `sessionKey` wskazuje na bieżący `sessionId` (plik transkryptu, który kontynuuje rozmowę).

Praktyczne zasady:

- **Reset** (`/new`, `/reset`) tworzy nowy `sessionId` dla tego `sessionKey`.
- **Codzienny reset** (domyślnie 4:00 czasu lokalnego na hoście Gateway) tworzy nowy `sessionId` przy następnej wiadomości po granicy resetu.
- **Wygaśnięcie bezczynności** (`session.reset.idleMinutes` albo starsze `session.idleMinutes`) tworzy nowy `sessionId`, gdy wiadomość nadejdzie po oknie bezczynności. Gdy skonfigurowano zarówno dzienny reset, jak i bezczynność, wygrywa to, co wygaśnie pierwsze.
- **Zdarzenia systemowe** (Heartbeat, wybudzenia Cron, powiadomienia exec, księgowość Gateway) mogą mutować wiersz sesji, ale nie przedłużają świeżości resetu dziennego/bezczynności. Przejście resetu odrzuca zakolejkowane powiadomienia zdarzeń systemowych dla poprzedniej sesji, zanim zostanie zbudowany świeży prompt.
- **Zasada forka rodzica** używa aktywnej gałęzi PI podczas tworzenia wątku lub forka podagenta. Jeśli ta gałąź jest zbyt duża, OpenClaw uruchamia dziecko z izolowanym kontekstem zamiast kończyć niepowodzeniem albo dziedziczyć bezużyteczną historię. Zasada rozmiaru jest automatyczna; starsza konfiguracja `session.parentForkMaxTokens` jest usuwana przez `openclaw doctor --fix`.

Szczegół implementacyjny: decyzja zapada w `initSessionState()` w `src/auto-reply/reply/session.ts`.

---

## Schemat magazynu sesji (`sessions.json`)

Typem wartości magazynu jest `SessionEntry` w `src/config/sessions.ts`.

Kluczowe pola (lista nie jest wyczerpująca):

- `sessionId`: bieżący identyfikator transkryptu (nazwa pliku jest z niego wyprowadzana, chyba że ustawiono `sessionFile`)
- `sessionStartedAt`: znacznik czasu rozpoczęcia bieżącego `sessionId`; świeżość dziennego resetu
  używa tego pola. Starsze wiersze mogą wyprowadzać je z nagłówka sesji JSONL.
- `lastInteractionAt`: znacznik czasu ostatniej rzeczywistej interakcji użytkownika/kanału; świeżość resetu bezczynności
  używa tego pola, aby zdarzenia Heartbeat, Cron i exec nie utrzymywały sesji
  przy życiu. Starsze wiersze bez tego pola wracają do odzyskanego czasu rozpoczęcia sesji
  dla świeżości bezczynności.
- `updatedAt`: znacznik czasu ostatniej mutacji wiersza magazynu, używany do listowania, przycinania i
  księgowości. Nie jest autorytetem dla świeżości resetu dziennego/bezczynności.
- `sessionFile`: opcjonalne jawne nadpisanie ścieżki transkryptu
- `chatType`: `direct | group | room` (pomaga interfejsom użytkownika i zasadzie wysyłania)
- `provider`, `subject`, `room`, `space`, `displayName`: metadane etykietowania grup/kanałów
- Przełączniki:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (nadpisanie dla sesji)
- Wybór modelu:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Liczniki tokenów (najlepsze przybliżenie / zależne od dostawcy):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: jak często automatyczna Compaction zakończyła się dla tego klucza sesji
- `memoryFlushAt`: znacznik czasu ostatniego opróżnienia pamięci przed Compaction
- `memoryFlushCompactionCount`: licznik Compaction, gdy ostatnie opróżnienie zostało uruchomione

Magazyn jest bezpieczny do edycji, ale Gateway jest autorytetem: może przepisywać lub rehydratować wpisy w trakcie działania sesji.

---

## Struktura transkryptu (`*.jsonl`)

Transkrypty są zarządzane przez `SessionManager` z `@mariozechner/pi-coding-agent`.

Plik jest w formacie JSONL:

- Pierwszy wiersz: nagłówek sesji (`type: "session"`, zawiera `id`, `cwd`, `timestamp`, opcjonalnie `parentSession`)
- Następnie: wpisy sesji z `id` + `parentId` (drzewo)

Ważne typy wpisów:

- `message`: wiadomości użytkownika/asystenta/toolResult
- `custom_message`: wiadomości wstrzyknięte przez rozszerzenie, które _wchodzą_ do kontekstu modelu (mogą być ukryte przed UI)
- `custom`: stan rozszerzenia, który _nie wchodzi_ do kontekstu modelu
- `compaction`: utrwalone podsumowanie Compaction z `firstKeptEntryId` i `tokensBefore`
- `branch_summary`: utrwalone podsumowanie podczas nawigowania po gałęzi drzewa

OpenClaw celowo **nie** „naprawia” transkryptów; Gateway używa `SessionManager` do ich odczytu/zapisu.

---

## Okna kontekstu a śledzone tokeny

Znaczenie mają dwa różne pojęcia:

1. **Okno kontekstu modelu**: twardy limit dla modelu (tokeny widoczne dla modelu)
2. **Liczniki magazynu sesji**: kroczące statystyki zapisywane w `sessions.json` (używane do /status i pulpitów)

Jeśli dostrajasz limity:

- Okno kontekstu pochodzi z katalogu modeli (i może zostać nadpisane przez konfigurację).
- `contextTokens` w magazynie jest runtime'ową wartością szacunkową/raportową; nie traktuj jej jako ścisłej gwarancji.

Więcej informacji: [/token-use](/pl/reference/token-use).

---

## Compaction: czym jest

Compaction podsumowuje starszą rozmowę w utrwalonym wpisie `compaction` w transkrypcie i pozostawia ostatnie wiadomości bez zmian.

Po Compaction przyszłe tury widzą:

- Podsumowanie Compaction
- Wiadomości po `firstKeptEntryId`

Compaction jest **trwała** (w przeciwieństwie do przycinania sesji). Zobacz [/concepts/session-pruning](/pl/concepts/session-pruning).

## Granice fragmentów Compaction i parowanie narzędzi

Gdy OpenClaw dzieli długi transkrypt na fragmenty Compaction, zachowuje
wywołania narzędzi asystenta sparowane z odpowiadającymi im wpisami `toolResult`.

- Jeśli podział według udziału tokenów wypada między wywołaniem narzędzia a jego wynikiem, OpenClaw
  przesuwa granicę do komunikatu wywołania narzędzia asystenta zamiast rozdzielać
  parę.
- Jeśli końcowy blok wyniku narzędzia w przeciwnym razie przekroczyłby cel fragmentu,
  OpenClaw zachowuje ten oczekujący blok narzędzia i pozostawia niesumowany ogon
  bez zmian.
- Przerwane/błędne bloki wywołań narzędzi nie utrzymują oczekującego podziału otwartego.

---

## Kiedy następuje automatyczna Compaction (środowisko wykonawcze Pi)

W osadzonym agencie Pi automatyczna Compaction uruchamia się w dwóch przypadkach:

1. **Odzyskiwanie po przepełnieniu**: model zwraca błąd przepełnienia kontekstu
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` oraz podobne warianty w kształcie dostawcy) → compact → ponów próbę.
2. **Utrzymanie progu**: po udanej turze, gdy:

`contextTokens > contextWindow - reserveTokens`

Gdzie:

- `contextWindow` to okno kontekstu modelu
- `reserveTokens` to zapas zarezerwowany na prompty + następne wyjście modelu

Są to semantyki środowiska wykonawczego Pi (OpenClaw konsumuje zdarzenia, ale Pi decyduje, kiedy wykonać Compaction).

OpenClaw może też uruchomić wstępną lokalną Compaction przed otwarciem następnego
uruchomienia, gdy ustawiono `agents.defaults.compaction.maxActiveTranscriptBytes`, a
aktywny plik transkryptu osiągnie ten rozmiar. Jest to zabezpieczenie rozmiaru pliku dla kosztu
lokalnego ponownego otwarcia, a nie surowa archiwizacja: OpenClaw nadal wykonuje normalną semantyczną Compaction
i wymaga `truncateAfterCompaction`, aby skompaktowane podsumowanie mogło stać się
nowym transkryptem następczym.

Dla osadzonych uruchomień Pi `agents.defaults.compaction.midTurnPrecheck.enabled: true`
dodaje opcjonalne zabezpieczenie pętli narzędzi. Po dołączeniu wyniku narzędzia i przed
następnym wywołaniem modelu OpenClaw szacuje presję promptu przy użyciu tej samej logiki
budżetu wstępnego, która jest używana na początku tury. Jeśli kontekst już się nie mieści, zabezpieczenie
nie wykonuje Compaction wewnątrz hooka `transformContext` Pi. Zgłasza ustrukturyzowany
sygnał wstępnej kontroli w połowie tury, zatrzymuje bieżące przesyłanie promptu i pozwala
zewnętrznej pętli uruchomienia użyć istniejącej ścieżki odzyskiwania: obciąć zbyt duże wyniki narzędzi,
gdy to wystarczy, albo uruchomić skonfigurowany tryb Compaction i ponowić próbę. Opcja
jest domyślnie wyłączona i działa z trybami Compaction `default` oraz `safeguard`,
w tym z Compaction safeguard obsługiwaną przez dostawcę.
Jest to niezależne od `maxActiveTranscriptBytes`: zabezpieczenie rozmiaru bajtowego działa
przed otwarciem tury, natomiast wstępna kontrola w połowie tury działa później w osadzonej pętli narzędzi Pi,
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

OpenClaw wymusza też dolny próg bezpieczeństwa dla osadzonych uruchomień:

- Jeśli `compaction.reserveTokens < reserveTokensFloor`, OpenClaw go podnosi.
- Domyślny próg to `20000` tokenów.
- Ustaw `agents.defaults.compaction.reserveTokensFloor: 0`, aby wyłączyć próg.
- Jeśli jest już wyższy, OpenClaw pozostawia go bez zmian.
- Ręczne `/compact` respektuje jawne `agents.defaults.compaction.keepRecentTokens`
  i zachowuje punkt odcięcia ostatniego ogona Pi. Bez jawnego budżetu zachowania
  ręczna Compaction pozostaje twardym punktem kontrolnym, a odbudowany kontekst zaczyna się od
  nowego podsumowania.
- Ustaw `agents.defaults.compaction.midTurnPrecheck.enabled: true`, aby uruchamiać
  opcjonalną wstępną kontrolę pętli narzędzi po nowych wynikach narzędzi i przed następnym wywołaniem
  modelu. To tylko wyzwalacz; generowanie podsumowania nadal używa skonfigurowanej
  ścieżki Compaction. Jest niezależne od `maxActiveTranscriptBytes`, które jest
  zabezpieczeniem rozmiaru bajtowego aktywnego transkryptu na początku tury.
- Ustaw `agents.defaults.compaction.maxActiveTranscriptBytes` na wartość bajtową lub
  ciąg taki jak `"20mb"`, aby uruchamiać lokalną Compaction przed turą, gdy aktywny
  transkrypt stanie się duży. To zabezpieczenie jest aktywne tylko wtedy, gdy
  włączono też `truncateAfterCompaction`. Pozostaw nieustawione albo ustaw `0`, aby
  wyłączyć.
- Gdy `agents.defaults.compaction.truncateAfterCompaction` jest włączone,
  OpenClaw rotuje aktywny transkrypt do skompaktowanego następczego JSONL po
  Compaction. Stary pełny transkrypt pozostaje zarchiwizowany i połączony z
  punktem kontrolnym Compaction zamiast być przepisywany w miejscu.

Dlaczego: aby zostawić wystarczający zapas na wieloturowe „porządki” (takie jak zapisy pamięci), zanim Compaction stanie się nieunikniona.

Implementacja: `ensurePiCompactionReserveTokens()` w `src/agents/pi-settings.ts`
(wywoływane z `src/agents/pi-embedded-runner.ts`).

---

## Wymienni dostawcy Compaction

Plugins mogą rejestrować dostawcę Compaction przez `registerCompactionProvider()` w API pluginu. Gdy `agents.defaults.compaction.provider` jest ustawione na zarejestrowany identyfikator dostawcy, rozszerzenie safeguard deleguje podsumowywanie do tego dostawcy zamiast do wbudowanego potoku `summarizeInStages`.

- `provider`: identyfikator zarejestrowanego Plugin dostawcy Compaction. Pozostaw nieustawione dla domyślnego podsumowywania LLM.
- Ustawienie `provider` wymusza `mode: "safeguard"`.
- Dostawcy otrzymują te same instrukcje Compaction i politykę zachowania identyfikatorów co wbudowana ścieżka.
- Safeguard nadal zachowuje kontekst sufiksu ostatnich tur i podzielonych tur po wyjściu dostawcy.
- Wbudowane podsumowywanie safeguard ponownie destyluje wcześniejsze podsumowania z nowymi komunikatami
  zamiast zachowywać pełne poprzednie podsumowanie dosłownie.
- Tryb safeguard domyślnie włącza audyty jakości podsumowań; ustaw
  `qualityGuard.enabled: false`, aby pominąć zachowanie ponawiania przy zniekształconym wyjściu.
- Jeśli dostawca zawiedzie lub zwróci pusty wynik, OpenClaw automatycznie wraca do wbudowanego podsumowywania LLM.
- Sygnały przerwania/limitu czasu są rzucane ponownie (nie połykane), aby respektować anulowanie przez wywołującego.

Źródło: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Powierzchnie widoczne dla użytkownika

Compaction i stan sesji możesz obserwować przez:

- `/status` (w dowolnej sesji czatu)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Tryb szczegółowy: `🧹 Auto-compaction complete` + liczba Compaction

---

## Ciche porządki (`NO_REPLY`)

OpenClaw obsługuje „ciche” tury dla zadań w tle, w których użytkownik nie powinien widzieć wyjścia pośredniego.

Konwencja:

- Asystent zaczyna swoje wyjście dokładnym cichym tokenem `NO_REPLY` /
  `no_reply`, aby wskazać „nie dostarczaj odpowiedzi użytkownikowi”.
- OpenClaw usuwa/tłumi to w warstwie dostarczania.
- Dokładne tłumienie cichego tokenu jest niewrażliwe na wielkość liter, więc `NO_REPLY` i
  `no_reply` liczą się, gdy cały ładunek jest wyłącznie cichym tokenem.
- Służy to wyłącznie prawdziwym turom w tle/bez dostarczania; nie jest skrótem dla
  zwykłych wykonalnych żądań użytkownika.

Od `2026.1.10` OpenClaw tłumi też **streaming szkicu/pisania**, gdy
częściowy fragment zaczyna się od `NO_REPLY`, więc ciche operacje nie ujawniają częściowego
wyjścia w trakcie tury.

---

## „Opróżnianie pamięci” przed Compaction (zaimplementowane)

Cel: zanim nastąpi automatyczna Compaction, uruchomić cichą agentową turę, która zapisuje trwały
stan na dysk (np. `memory/YYYY-MM-DD.md` w przestrzeni roboczej agenta), aby Compaction nie mogła
usunąć krytycznego kontekstu.

OpenClaw używa podejścia **opróżniania przed progiem**:

1. Monitoruj użycie kontekstu sesji.
2. Gdy przekroczy „miękki próg” (poniżej progu Compaction Pi), uruchom cichą
   dyrektywę „zapisz pamięć teraz” dla agenta.
3. Użyj dokładnego cichego tokenu `NO_REPLY` / `no_reply`, aby użytkownik niczego
   nie widział.

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
  łańcucha fallback aktywnej sesji, więc lokalne porządki nie przełączają się po cichu
  na płatny model konwersacyjny.
- Opróżnianie działa raz na cykl Compaction (śledzone w `sessions.json`).
- Opróżnianie działa tylko dla osadzonych sesji Pi (backendy CLI je pomijają).
- Opróżnianie jest pomijane, gdy przestrzeń robocza sesji jest tylko do odczytu (`workspaceAccess: "ro"` lub `"none"`).
- Zobacz [Pamięć](/pl/concepts/memory), aby poznać układ plików przestrzeni roboczej i wzorce zapisu.

Pi udostępnia też hook `session_before_compact` w API rozszerzenia, ale logika
opróżniania OpenClaw działa dziś po stronie Gateway.

---

## Lista kontrolna rozwiązywania problemów

- Błędny klucz sesji? Zacznij od [/concepts/session](/pl/concepts/session) i potwierdź `sessionKey` w `/status`.
- Niezgodność magazynu i transkryptu? Potwierdź host Gateway i ścieżkę magazynu z `openclaw status`.
- Spam Compaction? Sprawdź:
  - okno kontekstu modelu (zbyt małe)
  - ustawienia Compaction (`reserveTokens` zbyt wysokie dla okna modelu może powodować wcześniejszą Compaction)
  - rozdęcie wyników narzędzi: włącz/dostrój przycinanie sesji
- Ciche tury przeciekają? Potwierdź, że odpowiedź zaczyna się od `NO_REPLY` (dokładny token niewrażliwy na wielkość liter) i że używasz kompilacji zawierającej poprawkę tłumienia streamingu.

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Silnik kontekstu](/pl/concepts/context-engine)
