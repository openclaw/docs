---
read_when:
    - Musisz debugować identyfikatory sesji, JSONL transkryptu lub pola sessions.json
    - Zmieniasz zachowanie automatycznej Compaction albo dodajesz porządkowanie przed Compaction
    - Chcesz zaimplementować opróżnianie pamięci lub ciche tury systemowe
summary: 'Dogłębna analiza: magazyn sesji + transkrypcje, cykl życia i mechanizmy wewnętrzne (auto)Compaction'
title: Szczegółowe omówienie zarządzania sesjami
x-i18n:
    generated_at: "2026-04-30T10:17:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9785723ebf9b5411440a8f3b2885a50d659f669811ba749c431a2b3aeed700
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw zarządza sesjami od początku do końca w tych obszarach:

- **Routing sesji** (jak wiadomości przychodzące są mapowane na `sessionKey`)
- **Magazyn sesji** (`sessions.json`) i co śledzi
- **Utrwalanie transkryptu** (`*.jsonl`) i jego struktura
- **Higiena transkryptu** (poprawki specyficzne dla dostawcy przed uruchomieniami)
- **Limity kontekstu** (okno kontekstu a śledzone tokeny)
- **Compaction** (ręczna i automatyczna Compaction) oraz gdzie podłączyć pracę przed Compaction
- **Ciche prace porządkowe** (zapisy pamięci, które nie powinny generować widocznych dla użytkownika wyników)

Jeśli chcesz najpierw uzyskać ogólny przegląd, zacznij od:

- [Zarządzanie sesjami](/pl/concepts/session)
- [Compaction](/pl/concepts/compaction)
- [Przegląd pamięci](/pl/concepts/memory)
- [Wyszukiwanie pamięci](/pl/concepts/memory-search)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Higiena transkryptu](/pl/reference/transcript-hygiene)

---

## Źródło prawdy: Gateway

OpenClaw jest zaprojektowany wokół jednego **procesu Gateway**, który jest właścicielem stanu sesji.

- Interfejsy użytkownika (aplikacja macOS, webowy Control UI, TUI) powinny odpytywać Gateway o listy sesji i liczby tokenów.
- W trybie zdalnym pliki sesji znajdują się na zdalnym hoście; „sprawdzenie lokalnych plików na Macu” nie odzwierciedli tego, czego używa Gateway.

---

## Dwie warstwy utrwalania

OpenClaw utrwala sesje w dwóch warstwach:

1. **Magazyn sesji (`sessions.json`)**
   - Mapa klucz/wartość: `sessionKey -> SessionEntry`
   - Mała, modyfikowalna, bezpieczna do edycji (lub usuwania wpisów)
   - Śledzi metadane sesji (bieżący identyfikator sesji, ostatnią aktywność, przełączniki, liczniki tokenów itd.)

2. **Transkrypt (`<sessionId>.jsonl`)**
   - Transkrypt tylko do dopisywania ze strukturą drzewa (wpisy mają `id` + `parentId`)
   - Przechowuje właściwą rozmowę + wywołania narzędzi + podsumowania Compaction
   - Służy do odbudowy kontekstu modelu w przyszłych turach
   - Duże punkty kontrolne debugowania sprzed Compaction są pomijane, gdy aktywny
     transkrypt przekroczy limit rozmiaru punktu kontrolnego, co pozwala uniknąć drugiej ogromnej
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

Utrwalanie sesji ma automatyczne mechanizmy utrzymania (`session.maintenance`) dla `sessions.json`, artefaktów transkryptu i plików pomocniczych trajektorii:

- `mode`: `warn` (domyślnie) albo `enforce`
- `pruneAfter`: granica wieku nieaktualnych wpisów (domyślnie `30d`)
- `maxEntries`: limit wpisów w `sessions.json` (domyślnie `500`)
- `resetArchiveRetention`: retencja archiwów transkryptów `*.reset.<timestamp>` (domyślnie: taka sama jak `pruneAfter`; `false` wyłącza czyszczenie)
- `maxDiskBytes`: opcjonalny budżet katalogu sesji
- `highWaterBytes`: opcjonalny cel po czyszczeniu (domyślnie `80%` z `maxDiskBytes`)

Normalne zapisy Gateway grupują czyszczenie `maxEntries` dla limitów o rozmiarach produkcyjnych, więc magazyn może krótko przekroczyć skonfigurowany limit, zanim kolejne czyszczenie górnego progu zapisze go z powrotem poniżej limitu. `openclaw sessions cleanup --enforce` nadal stosuje skonfigurowany limit natychmiast.

OpenClaw nie tworzy już automatycznych kopii rotacyjnych `sessions.json.bak.*` podczas zapisów Gateway. Starszy klucz `session.maintenance.rotateBytes` jest ignorowany, a `openclaw doctor --fix` usuwa go ze starszych konfiguracji.

Kolejność egzekwowania czyszczenia budżetu dyskowego (`mode: "enforce"`):

1. Najpierw usuń najstarsze zarchiwizowane, osierocone transkrypty lub osierocone artefakty trajektorii.
2. Jeśli nadal przekracza cel, eksmituj najstarsze wpisy sesji oraz ich pliki transkryptów/trajektorii.
3. Kontynuuj, aż użycie będzie równe `highWaterBytes` lub niższe.

W `mode: "warn"` OpenClaw zgłasza potencjalne eksmisje, ale nie modyfikuje magazynu ani plików.

Uruchom utrzymanie na żądanie:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesje Cron i dzienniki uruchomień

Izolowane uruchomienia Cron także tworzą wpisy sesji/transkrypty i mają dedykowane mechanizmy retencji:

- `cron.sessionRetention` (domyślnie `24h`) przycina stare sesje izolowanych uruchomień Cron z magazynu sesji (`false` wyłącza).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` przycinają pliki `~/.openclaw/cron/runs/<jobId>.jsonl` (domyślnie: `2_000_000` bajtów i `2000` wierszy).

Gdy Cron wymusza utworzenie nowej izolowanej sesji uruchomienia, sanityzuje poprzedni
wpis sesji `cron:<jobId>` przed zapisaniem nowego wiersza. Przenosi bezpieczne
preferencje, takie jak ustawienia myślenia/szybkości/szczegółowości, etykiety oraz jawne
nadpisania modelu/uwierzytelniania wybrane przez użytkownika. Odrzuca otaczający kontekst rozmowy,
taki jak routing kanału/grupy, zasady wysyłania lub kolejkowania, podniesienie uprawnień, pochodzenie oraz
powiązanie środowiska uruchomieniowego ACP, aby świeże izolowane uruchomienie nie mogło odziedziczyć nieaktualnego dostarczania lub
uprawnień środowiska uruchomieniowego ze starszego uruchomienia.

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

Każdy `sessionKey` wskazuje bieżący `sessionId` (plik transkryptu, który kontynuuje rozmowę).

Praktyczne zasady:

- **Reset** (`/new`, `/reset`) tworzy nowy `sessionId` dla tego `sessionKey`.
- **Codzienny reset** (domyślnie 4:00 czasu lokalnego na hoście Gateway) tworzy nowy `sessionId` przy następnej wiadomości po granicy resetu.
- **Wygaśnięcie bezczynności** (`session.reset.idleMinutes` albo starsze `session.idleMinutes`) tworzy nowy `sessionId`, gdy wiadomość nadejdzie po oknie bezczynności. Gdy skonfigurowano zarówno reset codzienny, jak i bezczynność, wygrywa ten, który wygaśnie pierwszy.
- **Zdarzenia systemowe** (Heartbeat, wybudzenia Cron, powiadomienia exec, księgowanie Gateway) mogą modyfikować wiersz sesji, ale nie odświeżają ważności resetu codziennego/bezczynności. Przeniesienie resetu odrzuca zakolejkowane powiadomienia o zdarzeniach systemowych dla poprzedniej sesji, zanim zostanie zbudowany świeży prompt.
- **Strażnik rozgałęzienia rodzica wątku** (`session.parentForkMaxTokens`, domyślnie `100000`) pomija forking transkryptu rodzica, gdy sesja rodzica jest już zbyt duża; nowy wątek zaczyna od nowa. Ustaw `0`, aby wyłączyć.

Szczegół implementacyjny: decyzja zapada w `initSessionState()` w `src/auto-reply/reply/session.ts`.

---

## Schemat magazynu sesji (`sessions.json`)

Typem wartości magazynu jest `SessionEntry` w `src/config/sessions.ts`.

Kluczowe pola (lista nie jest wyczerpująca):

- `sessionId`: bieżący identyfikator transkryptu (nazwa pliku jest wyprowadzana z niego, chyba że ustawiono `sessionFile`)
- `sessionStartedAt`: znacznik czasu rozpoczęcia bieżącego `sessionId`; świeżość codziennego resetu
  używa tego pola. Starsze wiersze mogą wyprowadzać je z nagłówka sesji JSONL.
- `lastInteractionAt`: znacznik czasu ostatniej rzeczywistej interakcji użytkownika/kanału; świeżość resetu bezczynności
  używa tego pola, dzięki czemu zdarzenia Heartbeat, Cron i exec nie utrzymują sesji
  przy życiu. Starsze wiersze bez tego pola wracają do odzyskanego czasu rozpoczęcia sesji
  na potrzeby świeżości bezczynności.
- `updatedAt`: znacznik czasu ostatniej modyfikacji wiersza magazynu, używany do listowania, przycinania i
  księgowania. Nie jest autorytetem dla świeżości resetu codziennego/bezczynności.
- `sessionFile`: opcjonalne jawne nadpisanie ścieżki transkryptu
- `chatType`: `direct | group | room` (pomaga interfejsom użytkownika i zasadom wysyłania)
- `provider`, `subject`, `room`, `space`, `displayName`: metadane etykietowania grupy/kanału
- Przełączniki:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (nadpisanie dla sesji)
- Wybór modelu:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Liczniki tokenów (najlepsze możliwe / zależne od dostawcy):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: jak często automatyczna Compaction zakończyła się dla tego klucza sesji
- `memoryFlushAt`: znacznik czasu ostatniego opróżnienia pamięci przed Compaction
- `memoryFlushCompactionCount`: liczba Compaction w momencie ostatniego opróżnienia

Magazyn jest bezpieczny do edycji, ale autorytetem jest Gateway: może przepisywać lub odtwarzać wpisy w trakcie działania sesji.

---

## Struktura transkryptu (`*.jsonl`)

Transkryptami zarządza `SessionManager` z `@mariozechner/pi-coding-agent`.

Plik jest w formacie JSONL:

- Pierwszy wiersz: nagłówek sesji (`type: "session"`, zawiera `id`, `cwd`, `timestamp`, opcjonalne `parentSession`)
- Następnie: wpisy sesji z `id` + `parentId` (drzewo)

Godne uwagi typy wpisów:

- `message`: wiadomości użytkownika/asystenta/toolResult
- `custom_message`: wiadomości wstrzyknięte przez Plugin, które _wchodzą_ do kontekstu modelu (mogą być ukryte w UI)
- `custom`: stan Plugin, który _nie_ wchodzi do kontekstu modelu
- `compaction`: utrwalone podsumowanie Compaction z `firstKeptEntryId` i `tokensBefore`
- `branch_summary`: utrwalone podsumowanie podczas nawigacji po gałęzi drzewa

OpenClaw celowo **nie** „poprawia” transkryptów; Gateway używa `SessionManager` do ich odczytu/zapisu.

---

## Okna kontekstu a śledzone tokeny

Znaczenie mają dwa różne pojęcia:

1. **Okno kontekstu modelu**: twardy limit na model (tokeny widoczne dla modelu)
2. **Liczniki magazynu sesji**: kroczące statystyki zapisywane w `sessions.json` (używane przez /status i pulpity)

Jeśli dostrajasz limity:

- Okno kontekstu pochodzi z katalogu modeli (i można je nadpisać przez konfigurację).
- `contextTokens` w magazynie to szacunek/wartość raportowa środowiska uruchomieniowego; nie traktuj go jako ścisłej gwarancji.

Więcej informacji znajdziesz w [/token-use](/pl/reference/token-use).

---

## Compaction: czym jest

Compaction streszcza starszą rozmowę do utrwalonego wpisu `compaction` w transkrypcie i pozostawia ostatnie wiadomości bez zmian.

Po Compaction przyszłe tury widzą:

- Podsumowanie Compaction
- Wiadomości po `firstKeptEntryId`

Compaction jest **trwała** (w przeciwieństwie do przycinania sesji). Zobacz [/concepts/session-pruning](/pl/concepts/session-pruning).

## Granice fragmentów Compaction i parowanie narzędzi

Gdy OpenClaw dzieli długi transkrypt na fragmenty Compaction, utrzymuje
wywołania narzędzi asystenta sparowane z odpowiadającymi im wpisami `toolResult`.

- Jeśli podział według udziału tokenów wypada między wywołaniem narzędzia a jego wynikiem, OpenClaw
  przesuwa granicę do wiadomości asystenta z wywołaniem narzędzia zamiast rozdzielać
  parę.
- Jeśli końcowy blok wyników narzędzi w przeciwnym razie wypchnąłby fragment ponad cel,
  OpenClaw zachowuje ten oczekujący blok narzędzi i pozostawia nieskrócony ogon
  bez zmian.
- Przerwane/błędne bloki wywołań narzędzi nie utrzymują oczekującego podziału otwartego.

---

## Kiedy następuje automatyczna Compaction (środowisko uruchomieniowe Pi)

We wbudowanym agencie Pi automatyczna Compaction uruchamia się w dwóch przypadkach:

1. **Odzyskiwanie po przepełnieniu**: model zwraca błąd przepełnienia kontekstu
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` i podobne warianty ukształtowane przez dostawców) → Compaction → ponów próbę.
2. **Utrzymanie progowe**: po pomyślnej turze, gdy:

`contextTokens > contextWindow - reserveTokens`

Gdzie:

- `contextWindow` to okno kontekstu modelu
- `reserveTokens` to zapas zarezerwowany na prompty + następny wynik modelu

To semantyka środowiska uruchomieniowego Pi (OpenClaw konsumuje zdarzenia, ale Pi decyduje, kiedy wykonać Compaction).

OpenClaw może także wyzwolić lokalną Compaction przed uruchomieniem przed otwarciem następnego
uruchomienia, gdy ustawiono `agents.defaults.compaction.maxActiveTranscriptBytes`, a
aktywny plik transkryptu osiągnie ten rozmiar. To strażnik rozmiaru pliku dla kosztu lokalnego
ponownego otwarcia, a nie surowa archiwizacja: OpenClaw nadal wykonuje normalną semantyczną Compaction,
i wymaga `truncateAfterCompaction`, aby skompaktowane podsumowanie mogło stać się
nowym transkryptem następczym.

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

OpenClaw wymusza też bezpieczne minimum dla osadzonych uruchomień:

- Jeśli `compaction.reserveTokens < reserveTokensFloor`, OpenClaw je podnosi.
- Domyślne minimum to `20000` tokenów.
- Ustaw `agents.defaults.compaction.reserveTokensFloor: 0`, aby wyłączyć to minimum.
- Jeśli wartość jest już wyższa, OpenClaw pozostawia ją bez zmian.
- Ręczne `/compact` respektuje jawne `agents.defaults.compaction.keepRecentTokens`
  i zachowuje punkt odcięcia ostatniego ogona Pi. Bez jawnego budżetu zachowania,
  ręczne kompaktowanie pozostaje twardym punktem kontrolnym, a odbudowany kontekst zaczyna się od
  nowego podsumowania.
- Ustaw `agents.defaults.compaction.maxActiveTranscriptBytes` na wartość w bajtach lub
  ciąg, taki jak `"20mb"`, aby uruchamiać lokalne kompaktowanie przed turą, gdy aktywny
  transkrypt staje się duży. Ta ochrona działa tylko wtedy, gdy
  `truncateAfterCompaction` jest także włączone. Pozostaw tę opcję nieustawioną albo ustaw `0`, aby
  ją wyłączyć.
- Gdy `agents.defaults.compaction.truncateAfterCompaction` jest włączone,
  OpenClaw obraca aktywny transkrypt do skompaktowanego następcy JSONL po
  kompaktowaniu. Stary pełny transkrypt pozostaje zarchiwizowany i połączony z
  punktem kontrolnym kompaktowania zamiast być przepisywany w miejscu.

Dlaczego: aby zostawić wystarczający zapas dla wieloturowych „prac porządkowych” (takich jak zapisy pamięci), zanim kompaktowanie stanie się nieuniknione.

Implementacja: `ensurePiCompactionReserveTokens()` w `src/agents/pi-settings.ts`
(wywoływane z `src/agents/pi-embedded-runner.ts`).

---

## Podłączalni dostawcy kompaktowania

Pluginy mogą rejestrować dostawcę kompaktowania przez `registerCompactionProvider()` w API Plugin. Gdy `agents.defaults.compaction.provider` jest ustawione na identyfikator zarejestrowanego dostawcy, rozszerzenie zabezpieczające deleguje podsumowywanie do tego dostawcy zamiast do wbudowanego potoku `summarizeInStages`.

- `provider`: identyfikator zarejestrowanego Plugin dostawcy kompaktowania. Pozostaw nieustawione, aby używać domyślnego podsumowywania LLM.
- Ustawienie `provider` wymusza `mode: "safeguard"`.
- Dostawcy otrzymują te same instrukcje kompaktowania i zasady zachowywania identyfikatorów co wbudowana ścieżka.
- Zabezpieczenie nadal zachowuje kontekst sufiksu ostatniej tury i podzielonej tury po wyniku dostawcy.
- Wbudowane podsumowywanie zabezpieczające ponownie destyluje wcześniejsze podsumowania z nowymi wiadomościami
  zamiast zachowywać pełne poprzednie podsumowanie dosłownie.
- Tryb zabezpieczenia domyślnie włącza audyty jakości podsumowania; ustaw
  `qualityGuard.enabled: false`, aby pominąć zachowanie ponawiania przy źle sformatowanym wyniku.
- Jeśli dostawca zawiedzie lub zwróci pusty wynik, OpenClaw automatycznie wraca do wbudowanego podsumowywania LLM.
- Sygnały przerwania/przekroczenia limitu czasu są ponownie zgłaszane (nie są pochłaniane), aby respektować anulowanie przez wywołującego.

Źródło: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Powierzchnie widoczne dla użytkownika

Kompaktowanie i stan sesji możesz obserwować przez:

- `/status` (w dowolnej sesji czatu)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Tryb szczegółowy: `🧹 Auto-compaction complete` + liczba kompaktowań

---

## Ciche prace porządkowe (`NO_REPLY`)

OpenClaw obsługuje „ciche” tury dla zadań w tle, w których użytkownik nie powinien widzieć pośredniego wyniku.

Konwencja:

- Asystent zaczyna swój wynik dokładnym cichym tokenem `NO_REPLY` /
  `no_reply`, aby wskazać „nie dostarczaj odpowiedzi użytkownikowi”.
- OpenClaw usuwa/tłumi to w warstwie dostarczania.
- Dokładne tłumienie cichego tokenu jest niewrażliwe na wielkość liter, więc `NO_REPLY` i
  `no_reply` liczą się tak samo, gdy cały ładunek jest tylko cichym tokenem.
- To jest przeznaczone wyłącznie dla prawdziwych tur w tle/bez dostarczania; nie jest skrótem dla
  zwykłych, wykonywalnych próśb użytkownika.

Od `2026.1.10` OpenClaw tłumi także **strumieniowanie szkicu/pisania**, gdy
częściowy fragment zaczyna się od `NO_REPLY`, więc ciche operacje nie wyciekają częściowym
wynikiem w trakcie tury.

---

## „Zrzut pamięci” przed kompaktowaniem (zaimplementowane)

Cel: zanim nastąpi automatyczne kompaktowanie, uruchomić cichą turę agentową, która zapisuje trwały
stan na dysk (np. `memory/YYYY-MM-DD.md` w przestrzeni roboczej agenta), aby kompaktowanie nie mogło
usunąć krytycznego kontekstu.

OpenClaw używa podejścia **zrzutu przed progiem**:

1. Monitoruj użycie kontekstu sesji.
2. Gdy przekroczy „miękki próg” (poniżej progu kompaktowania Pi), uruchom cichą
   dyrektywę „zapisz pamięć teraz” do agenta.
3. Użyj dokładnego cichego tokenu `NO_REPLY` / `no_reply`, aby użytkownik nie widział
   niczego.

Konfiguracja (`agents.defaults.compaction.memoryFlush`):

- `enabled` (domyślnie: `true`)
- `model` (opcjonalne dokładne nadpisanie dostawcy/modelu dla tury zrzutu, na przykład `ollama/qwen3:8b`)
- `softThresholdTokens` (domyślnie: `4000`)
- `prompt` (wiadomość użytkownika dla tury zrzutu)
- `systemPrompt` (dodatkowy prompt systemowy dołączany dla tury zrzutu)

Uwagi:

- Domyślny prompt/prompt systemowy zawierają wskazówkę `NO_REPLY`, aby tłumić
  dostarczanie.
- Gdy `model` jest ustawiony, tura zrzutu używa tego modelu bez dziedziczenia
  aktywnego łańcucha fallback sesji, więc lokalne prace porządkowe nie cofają się po cichu
  do płatnego modelu konwersacyjnego.
- Zrzut działa raz na cykl kompaktowania (śledzone w `sessions.json`).
- Zrzut działa tylko dla osadzonych sesji Pi (backendy CLI go pomijają).
- Zrzut jest pomijany, gdy przestrzeń robocza sesji jest tylko do odczytu (`workspaceAccess: "ro"` lub `"none"`).
- Zobacz [Pamięć](/pl/concepts/memory), aby poznać układ plików przestrzeni roboczej i wzorce zapisu.

Pi udostępnia także hook `session_before_compact` w API rozszerzeń, ale logika
zrzutu OpenClaw znajduje się dziś po stronie Gateway.

---

## Lista kontrolna rozwiązywania problemów

- Błędny klucz sesji? Zacznij od [/concepts/session](/pl/concepts/session) i potwierdź `sessionKey` w `/status`.
- Niezgodność magazynu z transkryptem? Potwierdź host Gateway i ścieżkę magazynu z `openclaw status`.
- Spam kompaktowania? Sprawdź:
  - okno kontekstu modelu (zbyt małe)
  - ustawienia kompaktowania (`reserveTokens` zbyt wysokie dla okna modelu może powodować wcześniejsze kompaktowanie)
  - nadmiar wyników narzędzi: włącz/dostrój przycinanie sesji
- Wyciekają ciche tury? Potwierdź, że odpowiedź zaczyna się od `NO_REPLY` (dokładny token niewrażliwy na wielkość liter) i używasz kompilacji, która zawiera poprawkę tłumienia strumieniowania.

## Powiązane

- [Zarządzanie sesją](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Silnik kontekstu](/pl/concepts/context-engine)
