---
read_when:
    - Musisz debugować identyfikatory sesji, transkrypcje JSONL lub pola sessions.json
    - Zmieniasz zachowanie automatycznego procesu Compaction albo dodajesz porządkowanie przed Compaction
    - Chcesz zaimplementować opróżnianie pamięci lub ciche tury systemowe
summary: 'Dogłębna analiza: magazyn sesji + transkrypcje, cykl życia i wewnętrzne mechanizmy (auto)Compaction'
title: Szczegółowe omówienie zarządzania sesjami
x-i18n:
    generated_at: "2026-05-02T10:02:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9ca8a35210625051f5051e90a18a005d6103bc1d65d356c34f818d2bfc0058c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw zarządza sesjami end-to-end w tych obszarach:

- **Routing sesji** (jak wiadomości przychodzące mapują się na `sessionKey`)
- **Magazyn sesji** (`sessions.json`) i to, co śledzi
- **Trwałość transkrypcji** (`*.jsonl`) i jej struktura
- **Higiena transkrypcji** (poprawki specyficzne dla dostawcy przed uruchomieniami)
- **Limity kontekstu** (okno kontekstu a śledzone tokeny)
- **Compaction** (ręczna i automatyczna Compaction) oraz gdzie podpiąć pracę przed Compaction
- **Ciche porządki** (zapisy pamięci, które nie powinny generować widocznego dla użytkownika wyjścia)

Jeśli chcesz najpierw uzyskać ogólny przegląd, zacznij od:

- [Zarządzanie sesjami](/pl/concepts/session)
- [Compaction](/pl/concepts/compaction)
- [Przegląd pamięci](/pl/concepts/memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Higiena transkrypcji](/pl/reference/transcript-hygiene)

---

## Źródło prawdy: Gateway

OpenClaw jest zaprojektowany wokół pojedynczego **procesu Gateway**, który jest właścicielem stanu sesji.

- Interfejsy użytkownika (aplikacja macOS, webowy Control UI, TUI) powinny odpytywać Gateway o listy sesji i liczby tokenów.
- W trybie zdalnym pliki sesji znajdują się na zdalnym hoście; „sprawdzanie lokalnych plików na Macu” nie odzwierciedli tego, czego używa Gateway.

---

## Dwie warstwy trwałości

OpenClaw utrwala sesje w dwóch warstwach:

1. **Magazyn sesji (`sessions.json`)**
   - Mapa klucz/wartość: `sessionKey -> SessionEntry`
   - Mała, mutowalna, bezpieczna do edycji (lub usuwania wpisów)
   - Śledzi metadane sesji (bieżący identyfikator sesji, ostatnią aktywność, przełączniki, liczniki tokenów itp.)

2. **Transkrypcja (`<sessionId>.jsonl`)**
   - Transkrypcja tylko do dopisywania ze strukturą drzewa (wpisy mają `id` + `parentId`)
   - Przechowuje właściwą rozmowę + wywołania narzędzi + podsumowania Compaction
   - Służy do odbudowy kontekstu modelu dla przyszłych tur
   - Duże punkty kontrolne debugowania sprzed Compaction są pomijane, gdy aktywna
     transkrypcja przekroczy limit rozmiaru punktu kontrolnego, co pozwala uniknąć drugiej ogromnej
     kopii `.checkpoint.*.jsonl`.

Czytniki historii Gateway powinny unikać materializowania całej transkrypcji, chyba że
dana powierzchnia jawnie potrzebuje dostępu do dowolnej historii. Historia pierwszej strony,
osadzona historia czatu, odzyskiwanie po restarcie oraz kontrole tokenów/użycia korzystają z ograniczonych
odczytów ogona. Pełne skanowania transkrypcji przechodzą przez asynchroniczny indeks transkrypcji, który jest
buforowany według ścieżki pliku oraz `mtimeMs`/`size` i współdzielony między równoczesnymi czytnikami.

---

## Lokalizacje na dysku

Dla każdego agenta, na hoście Gateway:

- Magazyn: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrypcje: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesje tematów Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw rozwiązuje je przez `src/config/sessions.ts`.

---

## Utrzymanie magazynu i kontrola dysku

Trwałość sesji ma automatyczne mechanizmy utrzymania (`session.maintenance`) dla `sessions.json`, artefaktów transkrypcji i plików bocznych trajektorii:

- `mode`: `warn` (domyślnie) albo `enforce`
- `pruneAfter`: próg wieku nieaktualnych wpisów (domyślnie `30d`)
- `maxEntries`: limit wpisów w `sessions.json` (domyślnie `500`)
- `resetArchiveRetention`: retencja archiwów transkrypcji `*.reset.<timestamp>` (domyślnie taka sama jak `pruneAfter`; `false` wyłącza czyszczenie)
- `maxDiskBytes`: opcjonalny budżet katalogu sesji
- `highWaterBytes`: opcjonalny cel po czyszczeniu (domyślnie `80%` z `maxDiskBytes`)

Normalne zapisy Gateway grupują czyszczenie `maxEntries` dla limitów rozmiaru produkcyjnego, więc magazyn może na krótko przekroczyć skonfigurowany limit, zanim następne czyszczenie wysokiego progu zapisze go z powrotem w mniejszym rozmiarze. Odczyty magazynu sesji nie przycinają ani nie limitują wpisów podczas startu Gateway; do czyszczenia użyj zapisów albo `openclaw sessions cleanup --enforce`. `openclaw sessions cleanup --enforce` nadal stosuje skonfigurowany limit natychmiast.

Utrzymanie zachowuje trwałe zewnętrzne wskaźniki rozmów, takie jak sesje grupowe
i sesje czatu ograniczone do wątków, ale syntetyczne wpisy runtime dla cron, hooków,
heartbeat, ACP i subagentów nadal mogą zostać usunięte, gdy przekroczą
skonfigurowany wiek, liczbę lub budżet dyskowy.

OpenClaw nie tworzy już automatycznych kopii rotacyjnych `sessions.json.bak.*` podczas zapisów Gateway. Starszy klucz `session.maintenance.rotateBytes` jest ignorowany, a `openclaw doctor --fix` usuwa go ze starszych konfiguracji.

Kolejność egzekwowania czyszczenia budżetu dyskowego (`mode: "enforce"`):

1. Najpierw usuń najstarsze zarchiwizowane, osierocone artefakty transkrypcji albo osierocone artefakty trajektorii.
2. Jeśli nadal przekraczasz cel, wyrzuć najstarsze wpisy sesji oraz ich pliki transkrypcji/trajektorii.
3. Kontynuuj, aż użycie będzie równe lub niższe od `highWaterBytes`.

W `mode: "warn"` OpenClaw zgłasza potencjalne usunięcia, ale nie modyfikuje magazynu/plików.

Uruchom utrzymanie na żądanie:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesje Cron i dzienniki uruchomień

Izolowane uruchomienia cron również tworzą wpisy sesji/transkrypcje i mają dedykowane mechanizmy retencji:

- `cron.sessionRetention` (domyślnie `24h`) przycina stare izolowane sesje uruchomień cron z magazynu sesji (`false` wyłącza).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` przycinają pliki `~/.openclaw/cron/runs/<jobId>.jsonl` (domyślnie: `2_000_000` bajtów i `2000` wierszy).

Gdy cron wymusza utworzenie nowej izolowanej sesji uruchomienia, sanityzuje poprzedni
wpis sesji `cron:<jobId>` przed zapisaniem nowego wiersza. Przenosi bezpieczne
preferencje, takie jak ustawienia myślenia/trybu szybkiego/szczegółowości, etykiety oraz jawne
wybrane przez użytkownika nadpisania modelu/autoryzacji. Odrzuca otaczający kontekst rozmowy, taki
jak routing kanału/grupy, zasady wysyłania lub kolejkowania, podniesienie uprawnień, źródło i
powiązanie runtime ACP, aby świeże izolowane uruchomienie nie mogło odziedziczyć nieaktualnego dostarczania lub
uprawnień runtime ze starszego uruchomienia.

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

Każdy `sessionKey` wskazuje bieżący `sessionId` (plik transkrypcji kontynuujący rozmowę).

Praktyczne reguły:

- **Reset** (`/new`, `/reset`) tworzy nowy `sessionId` dla tego `sessionKey`.
- **Reset dzienny** (domyślnie 4:00 czasu lokalnego na hoście Gateway) tworzy nowy `sessionId` przy następnej wiadomości po granicy resetu.
- **Wygaśnięcie bezczynności** (`session.reset.idleMinutes` albo starsze `session.idleMinutes`) tworzy nowy `sessionId`, gdy wiadomość nadejdzie po oknie bezczynności. Gdy skonfigurowane są jednocześnie reset dzienny i bezczynność, wygrywa to, co wygaśnie pierwsze.
- **Zdarzenia systemowe** (heartbeat, wybudzenia cron, powiadomienia exec, księgowość Gateway) mogą mutować wiersz sesji, ale nie przedłużają świeżości resetu dziennego/bezczynności. Przejście resetu odrzuca zakolejkowane powiadomienia o zdarzeniach systemowych dla poprzedniej sesji, zanim zostanie zbudowany świeży prompt.
- **Polityka forka rodzica** używa aktywnej gałęzi Pi podczas tworzenia wątku lub forka subagenta. Jeśli ta gałąź jest zbyt duża, OpenClaw uruchamia dziecko z izolowanym kontekstem zamiast zgłaszać błąd albo dziedziczyć nieużywalną historię. Polityka rozmiaru jest automatyczna; starsza konfiguracja `session.parentForkMaxTokens` jest usuwana przez `openclaw doctor --fix`.

Szczegół implementacyjny: decyzja zapada w `initSessionState()` w `src/auto-reply/reply/session.ts`.

---

## Schemat magazynu sesji (`sessions.json`)

Typem wartości magazynu jest `SessionEntry` w `src/config/sessions.ts`.

Kluczowe pola (lista nie jest wyczerpująca):

- `sessionId`: bieżący identyfikator transkrypcji (nazwa pliku jest wyprowadzana z niego, chyba że ustawiono `sessionFile`)
- `sessionStartedAt`: znacznik czasu rozpoczęcia dla bieżącego `sessionId`; świeżość resetu dziennego
  używa tego pola. Starsze wiersze mogą wyprowadzać je z nagłówka sesji JSONL.
- `lastInteractionAt`: znacznik czasu ostatniej rzeczywistej interakcji użytkownika/kanału; świeżość resetu bezczynności
  używa tego pola, więc zdarzenia heartbeat, cron i exec nie utrzymują sesji
  przy życiu. Starsze wiersze bez tego pola wracają do odzyskanego czasu rozpoczęcia sesji
  dla świeżości bezczynności.
- `updatedAt`: znacznik czasu ostatniej mutacji wiersza magazynu, używany do listowania, przycinania i
  księgowości. Nie jest źródłem prawdy dla świeżości resetu dziennego/bezczynności.
- `sessionFile`: opcjonalne jawne nadpisanie ścieżki transkrypcji
- `chatType`: `direct | group | room` (pomaga interfejsom użytkownika i zasadom wysyłania)
- `provider`, `subject`, `room`, `space`, `displayName`: metadane etykietowania grupy/kanału
- Przełączniki:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (nadpisanie dla sesji)
- Wybór modelu:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Liczniki tokenów (best-effort / zależne od dostawcy):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: jak często automatyczna Compaction zakończyła się dla tego klucza sesji
- `memoryFlushAt`: znacznik czasu ostatniego zrzutu pamięci przed Compaction
- `memoryFlushCompactionCount`: liczba Compaction w chwili ostatniego zrzutu

Magazyn jest bezpieczny do edycji, ale autorytetem jest Gateway: może przepisywać lub rehydratować wpisy w trakcie działania sesji.

---

## Struktura transkrypcji (`*.jsonl`)

Transkrypcjami zarządza `SessionManager` z `@mariozechner/pi-coding-agent`.

Plik jest w formacie JSONL:

- Pierwszy wiersz: nagłówek sesji (`type: "session"`, zawiera `id`, `cwd`, `timestamp`, opcjonalnie `parentSession`)
- Następnie: wpisy sesji z `id` + `parentId` (drzewo)

Ważne typy wpisów:

- `message`: wiadomości użytkownika/asystenta/toolResult
- `custom_message`: wiadomości wstrzykiwane przez rozszerzenie, które _wchodzą_ do kontekstu modelu (mogą być ukryte przed UI)
- `custom`: stan rozszerzenia, który _nie wchodzi_ do kontekstu modelu
- `compaction`: utrwalone podsumowanie Compaction z `firstKeptEntryId` i `tokensBefore`
- `branch_summary`: utrwalone podsumowanie podczas nawigowania po gałęzi drzewa

OpenClaw celowo **nie** „poprawia” transkrypcji; Gateway używa `SessionManager` do ich odczytu/zapisu.

---

## Okna kontekstu a śledzone tokeny

Znaczenie mają dwa różne pojęcia:

1. **Okno kontekstu modelu**: twardy limit dla modelu (tokeny widoczne dla modelu)
2. **Liczniki magazynu sesji**: kroczące statystyki zapisywane do `sessions.json` (używane przez /status i pulpity)

Jeśli dostrajasz limity:

- Okno kontekstu pochodzi z katalogu modeli (i może zostać nadpisane przez konfigurację).
- `contextTokens` w magazynie jest wartością szacunkową/raportową runtime; nie traktuj jej jako ścisłej gwarancji.

Więcej informacji znajdziesz w [/token-use](/pl/reference/token-use).

---

## Compaction: czym jest

Compaction streszcza starszą rozmowę do utrwalonego wpisu `compaction` w transkrypcji i pozostawia ostatnie wiadomości bez zmian.

Po Compaction przyszłe tury widzą:

- Podsumowanie Compaction
- Wiadomości po `firstKeptEntryId`

Compaction jest **trwała** (w przeciwieństwie do przycinania sesji). Zobacz [/concepts/session-pruning](/pl/concepts/session-pruning).

## Granice fragmentów Compaction i parowanie narzędzi

Gdy OpenClaw dzieli długą transkrypcję na fragmenty Compaction, utrzymuje
wywołania narzędzi asystenta sparowane z odpowiadającymi im wpisami `toolResult`.

- Jeśli podział według udziału tokenów wypada między wywołaniem narzędzia a jego wynikiem, OpenClaw
  przesuwa granicę do wiadomości asystenta z wywołaniem narzędzia, zamiast rozdzielać
  parę.
- Jeśli końcowy blok wyników narzędzia w przeciwnym razie wypchnąłby fragment ponad cel,
  OpenClaw zachowuje ten oczekujący blok narzędzia i pozostawia niestreszczony ogon
  bez zmian.
- Przerwane/błędne bloki wywołań narzędzi nie utrzymują oczekującego podziału otwartego.

---

## Kiedy następuje automatyczna Compaction (runtime Pi)

We wbudowanym agencie Pi automatyczna Compaction uruchamia się w dwóch przypadkach:

1. **Odzyskiwanie po przepełnieniu**: model zwraca błąd przepełnienia kontekstu
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` oraz podobne warianty w kształcie danego dostawcy) → kompaktowanie → ponowna próba.
2. **Utrzymanie progu**: po udanej turze, gdy:

`contextTokens > contextWindow - reserveTokens`

Gdzie:

- `contextWindow` to okno kontekstu modelu
- `reserveTokens` to zapas zarezerwowany na prompty + następne wyjście modelu

To semantyka środowiska uruchomieniowego Pi (OpenClaw konsumuje zdarzenia, ale Pi decyduje, kiedy kompaktować).

OpenClaw może też wyzwolić lokalną kompaktację przed lotem przed otwarciem następnego
uruchomienia, gdy ustawiono `agents.defaults.compaction.maxActiveTranscriptBytes`, a
aktywny plik transkrypcji osiągnie ten rozmiar. To zabezpieczenie rozmiaru pliku dla lokalnego
kosztu ponownego otwarcia, a nie surowa archiwizacja: OpenClaw nadal uruchamia normalną semantyczną kompaktację,
i wymaga `truncateAfterCompaction`, aby skompaktowane podsumowanie mogło stać się
nową transkrypcją następczą.

Dla osadzonych uruchomień Pi, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
dodaje opcjonalne zabezpieczenie pętli narzędziowej. Po dołączeniu wyniku narzędzia i przed
następnym wywołaniem modelu OpenClaw szacuje presję promptu za pomocą tej samej logiki budżetu
przed lotem, która jest używana na początku tury. Jeśli kontekst już się nie mieści, zabezpieczenie nie
kompaktuje wewnątrz haka `transformContext` Pi. Zgłasza ustrukturyzowany
sygnał kontroli wstępnej w połowie tury, zatrzymuje bieżące przesłanie promptu i pozwala
zewnętrznej pętli uruchomienia użyć istniejącej ścieżki odzyskiwania: obciąć zbyt duże wyniki narzędzi,
gdy to wystarczy, albo wyzwolić skonfigurowany tryb kompaktacji i ponowić próbę. Opcja
jest domyślnie wyłączona i działa zarówno z trybem kompaktacji `default`, jak i `safeguard`,
w tym z kompaktacją safeguard wspieraną przez dostawcę.
Jest to niezależne od `maxActiveTranscriptBytes`: zabezpieczenie rozmiaru w bajtach działa
przed otwarciem tury, a kontrola wstępna w połowie tury działa później w osadzonej pętli narzędziowej Pi,
po dołączeniu nowych wyników narzędzi.

---

## Ustawienia kompaktacji (`reserveTokens`, `keepRecentTokens`)

Ustawienia kompaktacji Pi znajdują się w ustawieniach Pi:

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
- Domyślny dolny próg to `20000` tokenów.
- Ustaw `agents.defaults.compaction.reserveTokensFloor: 0`, aby wyłączyć dolny próg.
- Jeśli jest już wyższy, OpenClaw zostawia go bez zmian.
- Ręczne `/compact` honoruje jawne `agents.defaults.compaction.keepRecentTokens`
  i zachowuje punkt odcięcia ostatniego ogona Pi. Bez jawnego budżetu zachowania
  ręczna kompaktacja pozostaje twardym punktem kontrolnym, a odbudowany kontekst zaczyna się od
  nowego podsumowania.
- Ustaw `agents.defaults.compaction.midTurnPrecheck.enabled: true`, aby uruchamiać
  opcjonalną kontrolę wstępną pętli narzędziowej po nowych wynikach narzędzi i przed następnym
  wywołaniem modelu. To tylko wyzwalacz; generowanie podsumowania nadal używa skonfigurowanej
  ścieżki kompaktacji. Jest niezależne od `maxActiveTranscriptBytes`, które jest
  zabezpieczeniem rozmiaru aktywnej transkrypcji w bajtach na początku tury.
- Ustaw `agents.defaults.compaction.maxActiveTranscriptBytes` na wartość w bajtach lub
  ciąg taki jak `"20mb"`, aby uruchamiać lokalną kompaktację przed turą, gdy aktywna
  transkrypcja robi się duża. To zabezpieczenie jest aktywne tylko wtedy, gdy
  włączono też `truncateAfterCompaction`. Pozostaw nieustawione lub ustaw `0`, aby
  wyłączyć.
- Gdy włączono `agents.defaults.compaction.truncateAfterCompaction`,
  OpenClaw obraca aktywną transkrypcję do skompaktowanego następcy JSONL po
  kompaktacji. Stara pełna transkrypcja pozostaje zarchiwizowana i połączona z
  punktem kontrolnym kompaktacji zamiast być przepisywana w miejscu.

Dlaczego: aby zostawić wystarczający zapas na wieloturowe „porządki” (takie jak zapisy pamięci), zanim kompaktacja stanie się nieunikniona.

Implementacja: `ensurePiCompactionReserveTokens()` w `src/agents/pi-settings.ts`
(wywoływane z `src/agents/pi-embedded-runner.ts`).

---

## Wtykowi dostawcy kompaktacji

Pluginy mogą rejestrować dostawcę kompaktacji przez `registerCompactionProvider()` w API pluginu. Gdy `agents.defaults.compaction.provider` jest ustawione na identyfikator zarejestrowanego dostawcy, rozszerzenie safeguard deleguje podsumowywanie do tego dostawcy zamiast do wbudowanego potoku `summarizeInStages`.

- `provider`: identyfikator zarejestrowanego Plugin dostawcy kompaktacji. Pozostaw nieustawione dla domyślnego podsumowywania LLM.
- Ustawienie `provider` wymusza `mode: "safeguard"`.
- Dostawcy otrzymują te same instrukcje kompaktacji i zasady zachowywania identyfikatorów co ścieżka wbudowana.
- Safeguard nadal zachowuje kontekst sufiksu ostatniej tury i podzielonej tury po wyjściu dostawcy.
- Wbudowane podsumowywanie safeguard ponownie destyluje wcześniejsze podsumowania z nowymi wiadomościami
  zamiast zachowywać pełne poprzednie podsumowanie dosłownie.
- Tryb safeguard domyślnie włącza audyty jakości podsumowania; ustaw
  `qualityGuard.enabled: false`, aby pominąć zachowanie ponawiania przy źle sformatowanym wyjściu.
- Jeśli dostawca zawiedzie lub zwróci pusty wynik, OpenClaw automatycznie wraca do wbudowanego podsumowywania LLM.
- Sygnały przerwania/limitu czasu są ponownie zgłaszane (nie połykane), aby respektować anulowanie przez wywołującego.

Źródło: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Powierzchnie widoczne dla użytkownika

Kompaktację i stan sesji można obserwować przez:

- `/status` (w dowolnej sesji czatu)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Tryb szczegółowy: `🧹 Auto-compaction complete` + liczba kompaktacji

---

## Ciche porządki (`NO_REPLY`)

OpenClaw obsługuje „ciche” tury dla zadań w tle, w których użytkownik nie powinien widzieć wyjścia pośredniego.

Konwencja:

- Asystent zaczyna swoje wyjście od dokładnego cichego tokenu `NO_REPLY` /
  `no_reply`, aby wskazać „nie dostarczaj odpowiedzi użytkownikowi”.
- OpenClaw usuwa/tłumi to w warstwie dostarczania.
- Tłumienie dokładnego cichego tokenu nie rozróżnia wielkości liter, więc `NO_REPLY` i
  `no_reply` liczą się tak samo, gdy cały ładunek jest tylko cichym tokenem.
- To dotyczy tylko prawdziwych tur w tle/bez dostarczenia; nie jest skrótem dla
  zwykłych, wymagających działania próśb użytkownika.

Od `2026.1.10` OpenClaw tłumi również **strumieniowanie szkicu/pisania**, gdy
częściowy fragment zaczyna się od `NO_REPLY`, więc ciche operacje nie wyciekają jako częściowe
wyjście w połowie tury.

---

## „Zrzut pamięci” przed kompaktacją (wdrożone)

Cel: zanim nastąpi automatyczna kompaktacja, uruchomić cichą turę agentową, która zapisuje trwały
stan na dysku (np. `memory/YYYY-MM-DD.md` w obszarze roboczym agenta), aby kompaktacja nie mogła
usunąć krytycznego kontekstu.

OpenClaw używa podejścia **zrzutu przed progiem**:

1. Monitoruj użycie kontekstu sesji.
2. Gdy przekroczy „miękki próg” (poniżej progu kompaktacji Pi), uruchom cichą
   dyrektywę „zapisz pamięć teraz” dla agenta.
3. Użyj dokładnego cichego tokenu `NO_REPLY` / `no_reply`, aby użytkownik niczego nie widział.

Konfiguracja (`agents.defaults.compaction.memoryFlush`):

- `enabled` (domyślnie: `true`)
- `model` (opcjonalne dokładne nadpisanie dostawcy/modelu dla tury zrzutu, na przykład `ollama/qwen3:8b`)
- `softThresholdTokens` (domyślnie: `4000`)
- `prompt` (wiadomość użytkownika dla tury zrzutu)
- `systemPrompt` (dodatkowy prompt systemowy dołączany dla tury zrzutu)

Uwagi:

- Domyślny prompt/prompt systemowy zawierają wskazówkę `NO_REPLY`, aby tłumić
  dostarczanie.
- Gdy ustawiono `model`, tura zrzutu używa tego modelu bez dziedziczenia
  łańcucha awaryjnego aktywnej sesji, więc lokalne porządki nie przełączają się po cichu
  na płatny model rozmowy.
- Zrzut działa raz na cykl kompaktacji (śledzone w `sessions.json`).
- Zrzut działa tylko dla osadzonych sesji Pi (backendy CLI go pomijają).
- Zrzut jest pomijany, gdy obszar roboczy sesji jest tylko do odczytu (`workspaceAccess: "ro"` lub `"none"`).
- Zobacz [Pamięć](/pl/concepts/memory), aby poznać układ plików obszaru roboczego i wzorce zapisu.

Pi udostępnia też hak `session_before_compact` w API rozszerzeń, ale logika
zrzutu OpenClaw znajduje się dziś po stronie Gateway.

---

## Lista kontrolna rozwiązywania problemów

- Zły klucz sesji? Zacznij od [/concepts/session](/pl/concepts/session) i potwierdź `sessionKey` w `/status`.
- Niezgodność magazynu i transkrypcji? Potwierdź host Gateway oraz ścieżkę magazynu z `openclaw status`.
- Spam kompaktacji? Sprawdź:
  - okno kontekstu modelu (zbyt małe)
  - ustawienia kompaktacji (`reserveTokens` zbyt wysokie dla okna modelu może powodować wcześniejszą kompaktację)
  - rozrost wyników narzędzi: włącz/dostrój przycinanie sesji
- Wyciek cichych tur? Potwierdź, że odpowiedź zaczyna się od `NO_REPLY` (dokładny token bez rozróżniania wielkości liter) i że używasz kompilacji zawierającej poprawkę tłumienia strumieniowania.

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Silnik kontekstu](/pl/concepts/context-engine)
