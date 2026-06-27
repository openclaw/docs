---
read_when:
    - Musisz debugować identyfikatory sesji, JSONL transkrypcji lub pola sessions.json
    - Zmieniasz zachowanie automatycznej Compaction albo dodajesz porządkowanie „przed Compaction”
    - Chcesz zaimplementować opróżnianie pamięci lub ciche tury systemowe
summary: 'Dogłębna analiza: magazyn sesji i transkrypcje, cykl życia oraz mechanizmy wewnętrzne (auto)Compaction'
title: Dogłębne omówienie zarządzania sesjami
x-i18n:
    generated_at: "2026-06-27T18:19:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d4b6195c54024a8c0096ec2462ba367dbb6e16a8f6e10f2f912b879848c65af
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw zarządza sesjami end-to-end w tych obszarach:

- **Trasowanie sesji** (jak wiadomości przychodzące mapują się na `sessionKey`)
- **Magazyn sesji** (`sessions.json`) i to, co śledzi
- **Utrwalanie transkryptu** (`*.jsonl`) i jego struktura
- **Higiena transkryptu** (poprawki specyficzne dla dostawcy przed uruchomieniami)
- **Limity kontekstu** (okno kontekstu kontra śledzone tokeny)
- **Compaction** (ręczna i automatyczna Compaction) oraz miejsca podpięcia pracy przed Compaction
- **Ciche porządkowanie** (zapisy pamięci, które nie powinny generować danych wyjściowych widocznych dla użytkownika)

Jeśli najpierw chcesz uzyskać ogólny przegląd, zacznij od:

- [Zarządzanie sesjami](/pl/concepts/session)
- [Compaction](/pl/concepts/compaction)
- [Przegląd pamięci](/pl/concepts/memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Higiena transkryptu](/pl/reference/transcript-hygiene)

---

## Źródło prawdy: Gateway

OpenClaw jest zaprojektowany wokół jednego **procesu Gateway**, który jest właścicielem stanu sesji.

- Interfejsy UI (aplikacja macOS, webowy Control UI, TUI) powinny odpytywać Gateway o listy sesji i liczniki tokenów.
- W trybie zdalnym pliki sesji znajdują się na hoście zdalnym; „sprawdzanie lokalnych plików na Macu” nie odzwierciedli tego, czego używa Gateway.

---

## Dwie warstwy utrwalania

OpenClaw utrwala sesje w dwóch warstwach:

1. **Magazyn sesji (`sessions.json`)**
   - Mapa klucz/wartość: `sessionKey -> SessionEntry`
   - Mały, modyfikowalny, bezpieczny do edycji (lub usuwania wpisów)
   - Śledzi metadane sesji (bieżący identyfikator sesji, ostatnia aktywność, przełączniki, liczniki tokenów itd.)

2. **Transkrypt (`<sessionId>.jsonl`)**
   - Transkrypt tylko do dopisywania ze strukturą drzewa (wpisy mają `id` + `parentId`)
   - Przechowuje właściwą rozmowę + wywołania narzędzi + podsumowania Compaction
   - Służy do odbudowania kontekstu modelu dla przyszłych tur
   - Punkty kontrolne Compaction są metadanymi nad skompaktowanym następczym
     transkryptem. Nowe Compaction nie zapisują drugiej kopii `.checkpoint.*.jsonl`.

Czytniki historii Gateway powinny unikać materializowania całego transkryptu, chyba że
dana powierzchnia wyraźnie potrzebuje dowolnego dostępu do historii. Historia pierwszej strony,
osadzona historia czatu, odzyskiwanie po restarcie oraz kontrole tokenów/użycia korzystają z ograniczonych odczytów ogona.
Pełne skany transkryptów przechodzą przez asynchroniczny indeks transkryptów, który jest
buforowany według ścieżki pliku oraz `mtimeMs`/`size` i współdzielony między równoczesnymi czytnikami.

---

## Lokalizacje na dysku

Dla każdego agenta, na hoście Gateway:

- Magazyn: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrypty: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesje tematów Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw rozwiązuje je przez `src/config/sessions.ts`.

---

## Utrzymanie magazynu i kontrola dysku

Utrwalanie sesji ma automatyczne mechanizmy utrzymania (`session.maintenance`) dla `sessions.json`, artefaktów transkryptów i pobocznych plików trajektorii:

- `mode`: `enforce` (domyślnie) albo `warn`
- `pruneAfter`: próg wieku nieaktualnych wpisów (domyślnie `30d`)
- `maxEntries`: limit wpisów w `sessions.json` (domyślnie `500`)
- Retencja krótkotrwałych sond uruchomienia modelu Gateway jest stała i wynosi `24h`, ale jest bramkowana presją: usuwa nieaktualne wiersze ścisłych sond tylko wtedy, gdy osiągnięta zostanie presja utrzymania/limitu wpisów sesji. Dotyczy to wyłącznie ścisłych jawnych kluczy sond pasujących do `agent:*:explicit:model-run-<uuid>` i, gdy działa, uruchamia się przed globalnym czyszczeniem/ograniczaniem nieaktualnych wpisów.
- `resetArchiveRetention`: retencja archiwów transkryptów `*.reset.<timestamp>` (domyślnie: taka sama jak `pruneAfter`; `false` wyłącza czyszczenie)
- `maxDiskBytes`: opcjonalny budżet katalogu sesji
- `highWaterBytes`: opcjonalny cel po czyszczeniu (domyślnie `80%` z `maxDiskBytes`)

Normalne zapisy Gateway przechodzą przez piszącego sesje dla danego magazynu, który serializuje mutacje w procesie bez zakładania blokady pliku w czasie działania. Pomocniki poprawek na gorącej ścieżce pożyczają zweryfikowaną modyfikowalną pamięć podręczną, gdy trzymają ten slot piszącego, więc duże pliki `sessions.json` nie są klonowane ani ponownie odczytywane przy każdej aktualizacji metadanych. Kod czasu działania powinien preferować `updateSessionStore(...)` albo `updateSessionStoreEntry(...)`; bezpośrednie zapisy całego magazynu są narzędziami zgodności i utrzymania offline. Gdy Gateway jest osiągalny, niedziałające w trybie próbnym `openclaw sessions cleanup` i `openclaw agents delete` delegują mutacje magazynu do Gateway, dzięki czemu czyszczenie dołącza do tej samej kolejki piszącego; `--store <path>` jest jawną ścieżką naprawy offline do bezpośredniego utrzymania pliku. Czyszczenie `maxEntries` nadal jest porcjowane dla limitów o rozmiarze produkcyjnym, więc magazyn może przez krótki czas przekraczać skonfigurowany limit, zanim kolejne czyszczenie wysokiego poziomu zapisze go z powrotem poniżej limitu. Odczyty magazynu sesji nie przycinają ani nie ograniczają wpisów podczas uruchamiania Gateway; do czyszczenia użyj zapisów albo `openclaw sessions cleanup --enforce`. `openclaw sessions cleanup --enforce` nadal natychmiast stosuje skonfigurowany limit i przycina stare nieodwoływane artefakty transkryptów, punktów kontrolnych i trajektorii, nawet gdy nie skonfigurowano budżetu dysku.

Utrzymanie zachowuje trwałe zewnętrzne wskaźniki rozmów, takie jak sesje grupowe
i sesje czatu ograniczone do wątku, ale syntetyczne wpisy czasu działania dla cron, hooków,
Heartbeat, ACP i podagentów nadal mogą zostać usunięte, gdy przekroczą
skonfigurowany wiek, liczbę lub budżet dysku. Sesje sond uruchomienia modelu Gateway używają
osobnej retencji uruchomienia modelu `24h` tylko wtedy, gdy ich klucz dokładnie pasuje do
`agent:*:explicit:model-run-<uuid>`; inne jawne sesje nie są częścią
tej retencji. Czyszczenie uruchomień modelu jest stosowane tylko pod presją limitu wpisów
sesji. Izolowane uruchomienia cron zachowują własną kontrolę `cron.sessionRetention`,
niezależną od retencji sond uruchomienia modelu.

OpenClaw nie tworzy już automatycznych rotacyjnych kopii zapasowych `sessions.json.bak.*` podczas zapisów Gateway. Starszy klucz `session.maintenance.rotateBytes` jest ignorowany, a `openclaw doctor --fix` usuwa go ze starszych konfiguracji.

Mutacje transkryptu używają blokady zapisu sesji na pliku transkryptu. Pozyskiwanie blokady czeka do
`session.writeLock.acquireTimeoutMs`, zanim zgłosi błąd zajętej sesji; wartość domyślna to `60000`
ms. Zwiększaj to tylko wtedy, gdy legalne przygotowanie, czyszczenie, Compaction lub praca lustra transkryptu konkurują
dłużej na wolnych maszynach. `session.writeLock.staleMs` kontroluje, kiedy istniejącą blokadę można
odzyskać jako nieaktualną; wartość domyślna to `1800000` ms. `session.writeLock.maxHoldMs` kontroluje
próg zwolnienia przez watchdog w procesie; wartość domyślna to `300000` ms. Awaryjne nadpisania env to
`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS` oraz
`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.

Kolejność wymuszania czyszczenia budżetu dysku (`mode: "enforce"`):

1. Najpierw usuń najstarsze zarchiwizowane, osierocone artefakty transkryptów lub osierocone artefakty trajektorii.
2. Jeśli nadal przekracza cel, eksmituj najstarsze wpisy sesji oraz ich pliki transkryptów/trajektorii.
3. Kontynuuj, aż użycie będzie równe `highWaterBytes` lub niższe.

W `mode: "warn"` OpenClaw raportuje potencjalne eksmisje, ale nie modyfikuje magazynu/plików.

Uruchom utrzymanie na żądanie:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesje cron i dzienniki uruchomień

Izolowane uruchomienia cron również tworzą wpisy sesji/transkrypty i mają dedykowane mechanizmy retencji:

- `cron.sessionRetention` (domyślnie `24h`) przycina stare izolowane sesje uruchomień cron z magazynu sesji (`false` wyłącza).
- `cron.runLog.keepLines` przycina zachowane wiersze historii uruchomień SQLite dla każdego zadania cron (domyślnie: `2000`). `cron.runLog.maxBytes` pozostaje akceptowane dla starszych dzienników uruchomień opartych na plikach.

Gdy cron wymusza utworzenie nowej izolowanej sesji uruchomienia, sanityzuje poprzedni
wpis sesji `cron:<jobId>` przed zapisaniem nowego wiersza. Przenosi bezpieczne
preferencje, takie jak ustawienia myślenia/szybkości/szczegółowości, etykiety oraz jawne
nadpisania modelu/autoryzacji wybrane przez użytkownika. Odrzuca otaczający kontekst rozmowy,
taki jak trasowanie kanału/grupy, zasady wysyłania lub kolejkowania, podniesienie uprawnień, pochodzenie i powiązanie czasu działania
ACP, aby świeże izolowane uruchomienie nie mogło odziedziczyć nieaktualnego dostarczania ani
uprawnień czasu działania po starszym uruchomieniu.

---

## Klucze sesji (`sessionKey`)

`sessionKey` identyfikuje _koszyk rozmowy_, w którym jesteś (trasowanie + izolacja).

Typowe wzorce:

- Główny/bezpośredni czat (na agenta): `agent:<agentId>:<mainKey>` (domyślnie `main`)
- Grupa: `agent:<agentId>:<channel>:group:<id>`
- Pokój/kanał (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` albo `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (chyba że nadpisano)

Reguły kanoniczne są udokumentowane na [/concepts/session](/pl/concepts/session).

---

## Identyfikatory sesji (`sessionId`)

Każdy `sessionKey` wskazuje na bieżący `sessionId` (plik transkryptu, który kontynuuje rozmowę).

Praktyczne zasady:

- **Reset** (`/new`, `/reset`) tworzy nowy `sessionId` dla tego `sessionKey`.
- **Codzienny reset** (domyślnie 4:00 rano czasu lokalnego na hoście Gateway) tworzy nowy `sessionId` przy następnej wiadomości po granicy resetu.
- **Wygaśnięcie bezczynności** (`session.reset.idleMinutes` albo starsze `session.idleMinutes`) tworzy nowy `sessionId`, gdy wiadomość przychodzi po oknie bezczynności. Gdy skonfigurowane są zarówno codzienny reset, jak i bezczynność, wygrywa to, co wygaśnie pierwsze.
- **Wznowienie po ponownym połączeniu Control UI** może zachować aktualnie widoczną sesję dla jednego wysłania po ponownym połączeniu, gdy Gateway otrzyma pasujący `sessionId` od klienckiego UI operatora. Zwykłe nieaktualne wysłania nadal tworzą nowy `sessionId`.
- **Zdarzenia systemowe** (Heartbeat, wybudzenia cron, powiadomienia exec, księgowanie Gateway) mogą mutować wiersz sesji, ale nie przedłużają świeżości dziennego resetu/bezczynności. Rollover resetu odrzuca zakolejkowane powiadomienia zdarzeń systemowych dla poprzedniej sesji przed zbudowaniem świeżego promptu.
- **Zasada forka rodzica** używa aktywnej gałęzi OpenClaw podczas tworzenia wątku lub forka podagenta. Jeśli ta gałąź jest zbyt duża, OpenClaw uruchamia dziecko z izolowanym kontekstem zamiast kończyć się niepowodzeniem albo dziedziczyć nieużywalną historię. Zasada rozmiaru jest automatyczna; starsza konfiguracja `session.parentForkMaxTokens` jest usuwana przez `openclaw doctor --fix`.

Szczegół implementacyjny: decyzja zapada w `initSessionState()` w `src/auto-reply/reply/session.ts`.

---

## Schemat magazynu sesji (`sessions.json`)

Typ wartości magazynu to `SessionEntry` w `src/config/sessions.ts`.

Kluczowe pola (lista niewyczerpująca):

- `sessionId`: bieżący identyfikator transkryptu (nazwa pliku jest wyprowadzana z niego, chyba że ustawiono `sessionFile`)
- `sessionStartedAt`: znacznik czasu rozpoczęcia bieżącego `sessionId`; świeżość dziennego resetu
  używa tego pola. Starsze wiersze mogą wyprowadzać je z nagłówka sesji JSONL.
- `lastInteractionAt`: znacznik czasu ostatniej rzeczywistej interakcji użytkownika/kanału; świeżość resetu bezczynności
  używa tego pola, więc Heartbeat, cron i zdarzenia exec nie utrzymują sesji
  przy życiu. Starsze wiersze bez tego pola wracają do odzyskanego czasu rozpoczęcia sesji
  dla świeżości bezczynności.
- `updatedAt`: znacznik czasu ostatniej mutacji wiersza magazynu, używany do listowania, przycinania i
  księgowania. Nie jest źródłem prawdy dla świeżości dziennego resetu/bezczynności.
- `sessionFile`: opcjonalne jawne nadpisanie ścieżki transkryptu
- `chatType`: `direct | group | room` (pomaga UI i zasadom wysyłania)
- `provider`, `subject`, `room`, `space`, `displayName`: metadane etykietowania grup/kanałów
- Przełączniki:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (nadpisanie dla sesji)
- Wybór modelu:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Liczniki tokenów (najlepsze przybliżenie / zależne od dostawcy):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: ile razy automatyczna Compaction zakończyła się dla tego klucza sesji
- `memoryFlushAt`: znacznik czasu ostatniego opróżnienia pamięci przed Compaction
- `memoryFlushCompactionCount`: liczba Compaction, przy której uruchomiono ostatnie opróżnienie

Magazyn jest bezpieczny do edycji, ale Gateway jest źródłem prawdy: może przepisywać lub odtwarzać wpisy podczas działania sesji.

---

## Struktura transkryptu (`*.jsonl`)

Transkrypty są zarządzane przez `SessionManager` z `openclaw/plugin-sdk/agent-sessions`.

Plik ma format JSONL:

- Pierwszy wiersz: nagłówek sesji (`type: "session"`, zawiera `id`, `cwd`, `timestamp`, opcjonalnie `parentSession`)
- Następnie: wpisy sesji z `id` + `parentId` (drzewo)

Ważne typy wpisów:

- `message`: komunikaty użytkownika/asystenta/toolResult
- `custom_message`: komunikaty wstrzyknięte przez rozszerzenie, które _trafiają_ do kontekstu modelu (mogą być ukryte w UI)
- `custom`: stan rozszerzenia, który _nie trafia_ do kontekstu modelu
- `compaction`: utrwalone podsumowanie Compaction z `firstKeptEntryId` i `tokensBefore`
- `branch_summary`: utrwalone podsumowanie podczas nawigowania po gałęzi drzewa

OpenClaw celowo **nie** „naprawia” transkrypcji; Gateway używa `SessionManager` do ich odczytu/zapisu.

---

## Okna kontekstu a śledzone tokeny

Znaczenie mają dwa różne pojęcia:

1. **Okno kontekstu modelu**: twardy limit dla modelu (tokeny widoczne dla modelu)
2. **Liczniki magazynu sesji**: statystyki kroczące zapisywane w `sessions.json` (używane przez /status i pulpity)

Jeśli dostrajasz limity:

- Okno kontekstu pochodzi z katalogu modeli (i można je nadpisać przez konfigurację).
- `contextTokens` w magazynie to szacowana/raportowana wartość środowiska wykonawczego; nie traktuj jej jako ścisłej gwarancji.

Więcej informacji znajdziesz w [/token-use](/pl/reference/token-use).

---

## Compaction: czym jest

Compaction podsumowuje starszą rozmowę do utrwalonego wpisu `compaction` w transkrypcji i pozostawia ostatnie komunikaty bez zmian.

Po Compaction przyszłe tury widzą:

- Podsumowanie Compaction
- Komunikaty po `firstKeptEntryId`

Ponowne wstrzyknięcie sekcji AGENTS.md po Compaction jest opcjonalne przez
`agents.defaults.compaction.postCompactionSections`; gdy nie jest ustawione lub ma wartość `[]`,
OpenClaw nie dołącza fragmentów AGENTS.md nad podsumowaniem Compaction.

Compaction jest **trwałe** (w przeciwieństwie do przycinania sesji). Zobacz [/concepts/session-pruning](/pl/concepts/session-pruning).

## Granice fragmentów Compaction i parowanie narzędzi

Gdy OpenClaw dzieli długą transkrypcję na fragmenty Compaction, zachowuje
wywołania narzędzi asystenta sparowane z odpowiadającymi im wpisami `toolResult`.

- Jeśli podział według udziału tokenów wypada między wywołaniem narzędzia a jego wynikiem, OpenClaw
  przesuwa granicę do komunikatu asystenta z wywołaniem narzędzia zamiast rozdzielać
  parę.
- Jeśli końcowy blok wyniku narzędzia w przeciwnym razie przesunąłby fragment ponad cel,
  OpenClaw zachowuje ten oczekujący blok narzędzia i pozostawia niepodsumowany ogon
  nienaruszony.
- Przerwane/błędne bloki wywołań narzędzi nie utrzymują otwartego oczekującego podziału.

---

## Kiedy następuje automatyczne Compaction (środowisko wykonawcze OpenClaw)

We wbudowanym agencie OpenClaw automatyczne Compaction uruchamia się w dwóch przypadkach:

1. **Odzyskiwanie po przepełnieniu**: model zwraca błąd przepełnienia kontekstu
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` i podobne warianty w kształcie dostawcy) → Compaction → ponów próbę.
   Gdy dostawca raportuje liczbę tokenów użytych w próbie, OpenClaw przekazuje tę
   zaobserwowaną liczbę do Compaction w odzyskiwaniu po przepełnieniu. Jeśli dostawca potwierdza
   przepełnienie, ale nie ujawnia możliwej do sparsowania liczby, OpenClaw przekazuje do silników
   Compaction i diagnostyki minimalnie
   przekraczającą budżet liczbę syntetyczną.
   Jeśli odzyskiwanie po przepełnieniu nadal się nie powiedzie, OpenClaw pokazuje użytkownikowi
   jawne wskazówki i zachowuje bieżące mapowanie sesji zamiast po cichu obracać
   klucz sesji do świeżego identyfikatora sesji. Następny krok jest kontrolowany przez operatora:
   ponów komunikat, uruchom `/compact` albo uruchom `/new`, gdy preferowana jest świeża sesja.
2. **Utrzymanie progu**: po udanej turze, gdy:

`contextTokens > contextWindow - reserveTokens`

Gdzie:

- `contextWindow` to okno kontekstu modelu
- `reserveTokens` to zapas zarezerwowany na prompty + następne wyjście modelu

To są semantyki środowiska wykonawczego OpenClaw.

OpenClaw może też uruchomić lokalne Compaction preflight przed otwarciem następnego
uruchomienia, gdy ustawiono `agents.defaults.compaction.maxActiveTranscriptBytes`, a
aktywny plik transkrypcji osiągnie ten rozmiar. To zabezpieczenie rozmiaru pliku dla lokalnego
kosztu ponownego otwarcia, a nie surowej archiwizacji: OpenClaw nadal uruchamia normalne semantyczne Compaction,
i wymaga `truncateAfterCompaction`, aby skompaktowane podsumowanie mogło stać się
nową transkrypcją następczą.

Dla wbudowanych uruchomień OpenClaw `agents.defaults.compaction.midTurnPrecheck.enabled: true`
dodaje opcjonalne zabezpieczenie pętli narzędzi. Po dołączeniu wyniku narzędzia i przed
następnym wywołaniem modelu OpenClaw szacuje presję promptu przy użyciu tej samej logiki
budżetu preflight, która jest używana na początku tury. Jeśli kontekst już się nie mieści, zabezpieczenie
nie wykonuje Compaction wewnątrz haka `transformContext` środowiska wykonawczego OpenClaw. Podnosi ustrukturyzowany
sygnał precheck w środku tury, zatrzymuje bieżące przesyłanie promptu i pozwala
zewnętrznej pętli uruchomienia użyć istniejącej ścieżki odzyskiwania: przyciąć zbyt duże wyniki narzędzi,
gdy to wystarczy, albo uruchomić skonfigurowany tryb Compaction i ponowić próbę. Opcja
jest domyślnie wyłączona i działa zarówno z trybami Compaction `default`, jak i `safeguard`,
w tym z Compaction `safeguard` obsługiwanym przez dostawcę.
Jest to niezależne od `maxActiveTranscriptBytes`: zabezpieczenie rozmiaru w bajtach działa
przed otwarciem tury, a precheck w środku tury działa później we wbudowanej pętli narzędzi OpenClaw
po dołączeniu nowych wyników narzędzi.

---

## Ustawienia Compaction (`reserveTokens`, `keepRecentTokens`)

Ustawienia Compaction środowiska wykonawczego OpenClaw znajdują się w ustawieniach agenta:

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
- Domyślny próg to `20000` tokenów.
- Ustaw `agents.defaults.compaction.reserveTokensFloor: 0`, aby wyłączyć próg.
- Jeśli jest już wyższy, OpenClaw zostawia go bez zmian.
- Ręczne `/compact` honoruje jawne `agents.defaults.compaction.keepRecentTokens`
  i zachowuje punkt odcięcia ostatniego ogona środowiska wykonawczego OpenClaw. Bez jawnego budżetu zachowania
  ręczne Compaction pozostaje twardym punktem kontrolnym, a odbudowany kontekst zaczyna się od
  nowego podsumowania.
- Ustaw `agents.defaults.compaction.midTurnPrecheck.enabled: true`, aby uruchomić
  opcjonalny precheck pętli narzędzi po nowych wynikach narzędzi i przed następnym
  wywołaniem modelu. To tylko wyzwalacz; generowanie podsumowania nadal używa skonfigurowanej
  ścieżki Compaction. Jest niezależne od `maxActiveTranscriptBytes`, które jest
  zabezpieczeniem rozmiaru aktywnej transkrypcji w bajtach na początku tury.
- Ustaw `agents.defaults.compaction.maxActiveTranscriptBytes` na wartość w bajtach albo
  ciąg taki jak `"20mb"`, aby uruchamiać lokalne Compaction przed turą, gdy aktywna
  transkrypcja robi się duża. To zabezpieczenie jest aktywne tylko wtedy, gdy
  włączono także `truncateAfterCompaction`. Pozostaw nieustawione albo ustaw `0`, aby
  wyłączyć.
- Gdy `agents.defaults.compaction.truncateAfterCompaction` jest włączone,
  OpenClaw obraca aktywną transkrypcję do skompaktowanego następcy JSONL po
  Compaction. Akcje punktów kontrolnych gałęzi/przywracania używają tego skompaktowanego następcy;
  starsze pliki punktów kontrolnych sprzed Compaction pozostają czytelne, dopóki istnieją do nich odwołania.

Dlaczego: pozostaw wystarczający zapas na wieloturowe „prace porządkowe” (takie jak zapisy pamięci), zanim Compaction stanie się nieuniknione.

Implementacja: `applyAgentCompactionSettingsFromConfig()` w `src/agents/agent-settings.ts`
(wywoływane ze ścieżek tury embedded-runner i konfiguracji Compaction).

---

## Wymienni dostawcy Compaction

Pluginy mogą rejestrować dostawcę Compaction przez `registerCompactionProvider()` w API pluginu. Gdy `agents.defaults.compaction.provider` jest ustawione na identyfikator zarejestrowanego dostawcy, rozszerzenie safeguard deleguje podsumowywanie do tego dostawcy zamiast do wbudowanego potoku `summarizeInStages`.

- `provider`: identyfikator zarejestrowanego Pluginu dostawcy Compaction. Pozostaw nieustawione dla domyślnego podsumowywania LLM.
- Ustawienie `provider` wymusza `mode: "safeguard"`.
- Dostawcy otrzymują te same instrukcje Compaction i politykę zachowania identyfikatorów co wbudowana ścieżka.
- Safeguard nadal zachowuje kontekst sufiksu ostatnich tur i podzielonych tur po wyjściu dostawcy.
- Wbudowane podsumowywanie safeguard ponownie destyluje wcześniejsze podsumowania z nowymi komunikatami
  zamiast zachowywać pełne poprzednie podsumowanie dosłownie.
- Tryb safeguard domyślnie włącza audyty jakości podsumowania; ustaw
  `qualityGuard.enabled: false`, aby pominąć zachowanie ponowienia przy zniekształconym wyjściu.
- Jeśli dostawca zawiedzie albo zwróci pusty wynik, OpenClaw automatycznie wraca do wbudowanego podsumowywania LLM.
- Sygnały przerwania/limitu czasu są rzucane ponownie (nie połykane), aby respektować anulowanie przez wywołującego.

Źródło: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

---

## Powierzchnie widoczne dla użytkownika

Compaction i stan sesji możesz obserwować przez:

- `/status` (w dowolnej sesji czatu)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Logi Gateway (`pnpm gateway:watch` albo `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Tryb szczegółowy: `🧹 Auto-compaction complete` + liczba Compaction

---

## Ciche prace porządkowe (`NO_REPLY`)

OpenClaw obsługuje „ciche” tury dla zadań w tle, gdy użytkownik nie powinien widzieć wyjścia pośredniego.

Konwencja:

- Asystent zaczyna swoje wyjście dokładnym cichym tokenem `NO_REPLY` /
  `no_reply`, aby wskazać „nie dostarczaj odpowiedzi użytkownikowi”.
- OpenClaw usuwa/tłumi to w warstwie dostarczania.
- Tłumienie dokładnego cichego tokenu jest nieczułe na wielkość liter, więc `NO_REPLY` i
  `no_reply` liczą się, gdy cały ładunek jest tylko cichym tokenem.
- To jest przeznaczone wyłącznie dla prawdziwych tur w tle/bez dostarczania; nie jest skrótem dla
  zwykłych, wymagających działania próśb użytkownika.

Od `2026.1.10` OpenClaw tłumi też **strumieniowanie szkicu/pisania**, gdy
częściowy fragment zaczyna się od `NO_REPLY`, więc ciche operacje nie ujawniają częściowego
wyjścia w środku tury.

---

## „Zrzut pamięci” przed Compaction (zaimplementowane)

Cel: zanim nastąpi automatyczne Compaction, uruchomić cichą agentową turę, która zapisuje trwały
stan na dysku (np. `memory/YYYY-MM-DD.md` w obszarze roboczym agenta), aby Compaction nie mogło
usunąć krytycznego kontekstu.

OpenClaw używa podejścia **zrzutu przed progiem**:

1. Monitoruj użycie kontekstu sesji.
2. Gdy przekroczy „miękki próg” (poniżej progu Compaction środowiska wykonawczego OpenClaw), uruchom cichą
   dyrektywę „zapisz pamięć teraz” do agenta.
3. Użyj dokładnego cichego tokenu `NO_REPLY` / `no_reply`, aby użytkownik niczego
   nie widział.

Konfiguracja (`agents.defaults.compaction.memoryFlush`):

- `enabled` (domyślnie: `true`)
- `model` (opcjonalne dokładne nadpisanie dostawcy/modelu dla tury zrzutu, na przykład `ollama/qwen3:8b`)
- `softThresholdTokens` (domyślnie: `4000`)
- `prompt` (komunikat użytkownika dla tury zrzutu)
- `systemPrompt` (dodatkowy prompt systemowy dołączany dla tury zrzutu)

Uwagi:

- Domyślny prompt/prompt systemowy zawierają wskazówkę `NO_REPLY`, aby tłumić
  dostarczanie.
- Gdy ustawiono `model`, tura zrzutu używa tego modelu bez dziedziczenia
  aktywnego łańcucha fallbacków sesji, więc lokalne prace porządkowe nie przełączają się po cichu
  na płatny model rozmowy.
- Zrzut uruchamia się raz na cykl Compaction (śledzone w `sessions.json`).
- Zrzut działa tylko dla wbudowanych sesji OpenClaw (backendy CLI go pomijają).
- Zrzut jest pomijany, gdy obszar roboczy sesji jest tylko do odczytu (`workspaceAccess: "ro"` albo `"none"`).
- Zobacz [Pamięć](/pl/concepts/memory), aby poznać układ plików obszaru roboczego i wzorce zapisu.

OpenClaw udostępnia też hak `session_before_compact` w API rozszerzeń, ale logika
zrzutu OpenClaw działa dziś po stronie Gateway.

---

## Lista kontrolna rozwiązywania problemów

- Zły klucz sesji? Zacznij od [/concepts/session](/pl/concepts/session) i potwierdź `sessionKey` w `/status`.
- Niezgodność magazynu i transkrypcji? Potwierdź host Gateway i ścieżkę magazynu z `openclaw status`.
- Nadmiarowe Compaction? Sprawdź:
  - okno kontekstu modelu (za małe)
  - ustawienia Compaction (`reserveTokens` zbyt wysokie dla okna modelu może powodować wcześniejsze Compaction)
  - rozdęcie wyników narzędzi: włącz/dostrój przycinanie sesji
- Przeciekające ciche tury? Potwierdź, że odpowiedź zaczyna się od `NO_REPLY` (dokładny token nieczuły na wielkość liter) i że używasz kompilacji zawierającej poprawkę tłumienia strumieniowania.

## Powiązane

- [Zarządzanie sesją](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Silnik kontekstu](/pl/concepts/context-engine)
