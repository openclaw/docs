---
read_when:
    - Musisz debugować identyfikatory sesji, JSONL transkryptów lub pola sessions.json
    - Zmieniasz zachowanie automatycznej Compaction albo dodajesz porządkowanie „przed Compaction”
    - Chcesz zaimplementować czyszczenie pamięci lub ciche tury systemowe
summary: 'Szczegółowa analiza: magazyn sesji i transkrypty, cykl życia oraz wewnętrzne mechanizmy (auto)Compaction'
title: Szczegółowe omówienie zarządzania sesjami
x-i18n:
    generated_at: "2026-07-04T20:45:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c97994f674e14ec01b2eaadc10a61e524f5071f95b2ef84957d71abacbdc719b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw zarządza sesjami kompleksowo w tych obszarach:

- **Routing sesji** (jak wiadomości przychodzące mapują się na `sessionKey`)
- **Magazyn sesji** (`sessions.json`) i to, co śledzi
- **Utrwalanie transkryptu** (`*.jsonl`) i jego struktura
- **Higiena transkryptu** (poprawki specyficzne dla dostawcy przed uruchomieniami)
- **Limity kontekstu** (okno kontekstu a śledzone tokeny)
- **Compaction** (ręczna i automatyczna kompakcja) oraz miejsca podpięcia pracy przed kompakcją
- **Ciche porządkowanie** (zapisy pamięci, które nie powinny generować wyjścia widocznego dla użytkownika)

Jeśli najpierw chcesz uzyskać ogólniejszy przegląd, zacznij od:

- [Zarządzanie sesjami](/pl/concepts/session)
- [Compaction](/pl/concepts/compaction)
- [Przegląd pamięci](/pl/concepts/memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Higiena transkryptu](/pl/reference/transcript-hygiene)

---

## Źródło prawdy: Gateway

OpenClaw jest zaprojektowany wokół jednego **procesu Gateway**, który jest właścicielem stanu sesji.

- Interfejsy użytkownika (aplikacja macOS, webowy Control UI, TUI) powinny odpytywać Gateway o listy sesji i liczby tokenów.
- W trybie zdalnym pliki sesji znajdują się na hoście zdalnym; „sprawdzanie plików na lokalnym Macu” nie odzwierciedli tego, czego używa Gateway.

---

## Dwie warstwy utrwalania

OpenClaw utrwala sesje w dwóch warstwach:

1. **Magazyn sesji (`sessions.json`)**
   - Mapa klucz/wartość: `sessionKey -> SessionEntry`
   - Mały, mutowalny, bezpieczny do edycji (lub usuwania wpisów)
   - Śledzi metadane sesji (bieżący identyfikator sesji, ostatnia aktywność, przełączniki, liczniki tokenów itd.)

2. **Transkrypt (`<sessionId>.jsonl`)**
   - Transkrypt tylko do dopisywania ze strukturą drzewa (wpisy mają `id` + `parentId`)
   - Przechowuje faktyczną rozmowę + wywołania narzędzi + podsumowania kompakcji
   - Służy do odbudowania kontekstu modelu dla przyszłych tur
   - Punkty kontrolne kompakcji są metadanymi nad skompaktowanym transkryptem następczym. Nowe kompakcje nie zapisują drugiej kopii `.checkpoint.*.jsonl`.

Czytniki historii Gateway powinny unikać materializowania całego transkryptu, chyba że
dana powierzchnia jawnie potrzebuje dowolnego dostępu do historii. Historia pierwszej strony,
osadzona historia czatu, odzyskiwanie po restarcie oraz kontrole tokenów/użycia korzystają
z ograniczonych odczytów końcówki. Pełne skany transkryptu przechodzą przez asynchroniczny indeks transkryptu, który jest
buforowany według ścieżki pliku oraz `mtimeMs`/`size` i współdzielony między równoległymi czytnikami.

---

## Lokalizacje na dysku

Dla każdego agenta, na hoście Gateway:

- Magazyn: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkrypty: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Sesje tematów Telegram: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw rozwiązuje te ścieżki przez `src/config/sessions.ts`.

---

## Utrzymanie magazynu i kontrole dysku

Utrwalanie sesji ma automatyczne kontrole utrzymania (`session.maintenance`) dla `sessions.json`, artefaktów transkryptów i plików pomocniczych trajektorii:

- `mode`: `enforce` (domyślnie) albo `warn`
- `pruneAfter`: próg wieku nieaktualnych wpisów (domyślnie `30d`)
- `maxEntries`: limit wpisów w `sessions.json` (domyślnie `500`)
- Retencja krótkotrwałych sond uruchomień modelu Gateway jest stała i wynosi `24h`, ale jest zależna od presji: usuwa nieaktualne ścisłe wiersze sond tylko wtedy, gdy osiągnięta zostanie presja utrzymania/limitu wpisów sesji. Dotyczy to wyłącznie ścisłych jawnych kluczy sond pasujących do `agent:*:explicit:model-run-<uuid>` i działa przed globalnym czyszczeniem/limitowaniem nieaktualnych wpisów, gdy zostanie uruchomione.
- `resetArchiveRetention`: retencja archiwów transkryptów `*.reset.<timestamp>` (domyślnie taka sama jak `pruneAfter`; `false` wyłącza czyszczenie)
- `maxDiskBytes`: opcjonalny budżet katalogu sesji
- `highWaterBytes`: opcjonalny cel po czyszczeniu (domyślnie `80%` z `maxDiskBytes`)

Normalne zapisy Gateway przechodzą przez pisarz sesji przypisany do magazynu, który serializuje mutacje w procesie bez zakładania runtime’owej blokady pliku. Pomocniki poprawek na gorącej ścieżce pożyczają zwalidowaną mutowalną pamięć podręczną, gdy trzymają ten slot pisarza, dzięki czemu duże pliki `sessions.json` nie są klonowane ani ponownie odczytywane przy każdej aktualizacji metadanych. Kod runtime powinien preferować `updateSessionStore(...)` lub `updateSessionStoreEntry(...)`; bezpośrednie zapisy całego magazynu są narzędziami zgodności i utrzymania offline. Gdy Gateway jest osiągalny, niedziałające w trybie dry-run polecenia `openclaw sessions cleanup` i `openclaw agents delete` delegują mutacje magazynu do Gateway, dzięki czemu czyszczenie dołącza do tej samej kolejki pisarza; `--store <path>` jest jawną ścieżką naprawy offline do bezpośredniego utrzymania pliku. Czyszczenie `maxEntries` nadal jest wykonywane partiami dla limitów o rozmiarze produkcyjnym, więc magazyn może krótko przekroczyć skonfigurowany limit, zanim kolejne czyszczenie do poziomu high-water przepisze go z powrotem poniżej limitu. Odczyty magazynu sesji nie przycinają ani nie limitują wpisów podczas startu Gateway; do czyszczenia użyj zapisów albo `openclaw sessions cleanup --enforce`. `openclaw sessions cleanup --enforce` nadal natychmiast stosuje skonfigurowany limit oraz przycina stare niepowiązane artefakty transkryptów, punktów kontrolnych i trajektorii, nawet gdy nie skonfigurowano budżetu dyskowego.

Utrzymanie zachowuje trwałe zewnętrzne wskaźniki rozmów, takie jak sesje grupowe
i sesje czatu ograniczone do wątku, ale syntetyczne wpisy runtime dla cron, hooków,
heartbeat, ACP i podagentów nadal mogą zostać usunięte, gdy przekroczą
skonfigurowany wiek, liczbę lub budżet dyskowy. Sesje sond uruchomień modelu Gateway używają
osobnej retencji uruchomień modelu `24h` tylko wtedy, gdy ich klucz dokładnie pasuje do
`agent:*:explicit:model-run-<uuid>`; inne jawne sesje nie są częścią
tej retencji. Czyszczenie uruchomień modelu jest stosowane tylko pod presją limitu wpisów sesji. Izolowane uruchomienia cron zachowują własną kontrolę `cron.sessionRetention`,
niezależną od retencji sond uruchomień modelu.

OpenClaw nie tworzy już automatycznych rotacyjnych kopii zapasowych `sessions.json.bak.*` podczas zapisów Gateway. Starszy klucz `session.maintenance.rotateBytes` jest ignorowany, a `openclaw doctor --fix` usuwa go ze starszych konfiguracji.

Mutacje transkryptu używają blokady zapisu sesji na pliku transkryptu. Pozyskiwanie blokady czeka do
`session.writeLock.acquireTimeoutMs`, zanim zgłosi błąd zajętej sesji; domyślna wartość to `60000`
ms. Zwiększaj ją tylko wtedy, gdy uzasadnione przygotowanie, czyszczenie, kompakcja lub praca lustra transkryptu rywalizuje
dłużej na wolnych maszynach. `session.writeLock.staleMs` kontroluje, kiedy istniejąca blokada może zostać
odzyskana jako nieaktualna; domyślna wartość to `1800000` ms. `session.writeLock.maxHoldMs` kontroluje
próg zwolnienia przez watchdog w procesie; domyślna wartość to `300000` ms. Awaryjne nadpisania env to
`OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`, `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS` i
`OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`.

Kolejność wymuszania czyszczenia budżetu dyskowego (`mode: "enforce"`):

1. Najpierw usuń najstarsze zarchiwizowane, osierocone artefakty transkryptów lub osierocone artefakty trajektorii.
2. Jeśli nadal przekracza cel, eksmituj najstarsze wpisy sesji i ich pliki transkryptów/trajektorii.
3. Kontynuuj, aż użycie będzie równe `highWaterBytes` lub niższe.

W `mode: "warn"` OpenClaw zgłasza potencjalne eksmisje, ale nie mutuje magazynu/plików.

Uruchom utrzymanie na żądanie:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesje cron i logi uruchomień

Izolowane uruchomienia cron również tworzą wpisy sesji/transkrypty i mają dedykowane kontrole retencji:

- `cron.sessionRetention` (domyślnie `24h`) przycina stare izolowane sesje uruchomień cron z magazynu sesji (`false` wyłącza).
- `cron.runLog.keepLines` przycina zachowane wiersze historii uruchomień SQLite dla każdego zadania cron (domyślnie: `2000`). `cron.runLog.maxBytes` pozostaje akceptowane dla starszych logów uruchomień opartych na plikach.

Gdy cron wymusza utworzenie nowej izolowanej sesji uruchomienia, sanityzuje poprzedni
wpis sesji `cron:<jobId>` przed zapisaniem nowego wiersza. Przenosi bezpieczne
preferencje, takie jak ustawienia thinking/fast/verbose, etykiety oraz jawne
wybrane przez użytkownika nadpisania modelu/uwierzytelniania. Odrzuca otaczający kontekst rozmowy, taki
jak routing kanału/grupy, polityka wysyłania lub kolejkowania, podniesienie uprawnień, pochodzenie i powiązanie runtime ACP,
aby świeże izolowane uruchomienie nie mogło odziedziczyć nieaktualnego dostarczania lub
uprawnień runtime ze starszego uruchomienia.

---

## Klucze sesji (`sessionKey`)

`sessionKey` identyfikuje _wiadro rozmowy_, w którym jesteś (routing + izolacja).

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

Praktyczne reguły:

- **Reset** (`/new`, `/reset`) tworzy nowy `sessionId` dla tego `sessionKey`.
- **Codzienny reset** (domyślnie 4:00 czasu lokalnego na hoście Gateway) tworzy nowy `sessionId` przy następnej wiadomości po granicy resetu.
- **Wygaśnięcie bezczynności** (`session.reset.idleMinutes` albo starsze `session.idleMinutes`) tworzy nowy `sessionId`, gdy wiadomość przychodzi po oknie bezczynności. Gdy skonfigurowane są zarówno reset dzienny, jak i bezczynność, wygrywa to, co wygaśnie pierwsze.
- **Wznowienie po ponownym połączeniu Control UI** może zachować aktualnie widoczną sesję dla jednej wysyłki po ponownym połączeniu, gdy Gateway otrzyma pasujący `sessionId` od klienckiego interfejsu operatora. Zwykłe nieaktualne wysyłki nadal tworzą nowy `sessionId`.
- **Zdarzenia systemowe** (heartbeat, wybudzenia cron, powiadomienia exec, księgowanie gateway) mogą mutować wiersz sesji, ale nie przedłużają świeżości dziennego/bezczynnościowego resetu. Przetoczenie resetu odrzuca zakolejkowane powiadomienia zdarzeń systemowych dla poprzedniej sesji, zanim zostanie zbudowany świeży prompt.
- **Polityka forka rodzica** używa aktywnej gałęzi OpenClaw podczas tworzenia wątku lub forka podagenta. Jeśli ta gałąź jest zbyt duża, OpenClaw uruchamia dziecko z izolowanym kontekstem zamiast kończyć się błędem lub dziedziczyć nieużywalną historię. Polityka rozmiaru jest automatyczna; starsza konfiguracja `session.parentForkMaxTokens` jest usuwana przez `openclaw doctor --fix`.

Szczegół implementacyjny: decyzja zapada w `initSessionState()` w `src/auto-reply/reply/session.ts`.

---

## Schemat magazynu sesji (`sessions.json`)

Typ wartości magazynu to `SessionEntry` w `src/config/sessions.ts`.

Kluczowe pola (lista niepełna):

- `sessionId`: bieżący identyfikator transkryptu (nazwa pliku jest wyprowadzana z niego, chyba że ustawiono `sessionFile`)
- `sessionStartedAt`: znacznik czasu rozpoczęcia dla bieżącego `sessionId`; używa go
  świeżość resetu dziennego. Starsze wiersze mogą wyprowadzać go z nagłówka
  sesji JSONL.
- `lastInteractionAt`: znacznik czasu ostatniej rzeczywistej interakcji użytkownika/kanału; używa go
  świeżość resetu bezczynności, dzięki czemu zdarzenia Heartbeat, Cron i exec nie utrzymują
  sesji przy życiu. Starsze wiersze bez tego pola wracają do odzyskanego czasu
  rozpoczęcia sesji dla świeżości bezczynności.
- `updatedAt`: znacznik czasu ostatniej mutacji wiersza magazynu, używany do listowania, przycinania i
  ewidencji. Nie jest źródłem prawdy dla świeżości resetu dziennego/bezczynności.
- `archivedAt`: opcjonalny znacznik czasu archiwizacji. Zarchiwizowane sesje pozostają w magazynie
  z nienaruszonym transkryptem i są wykluczane ze zwykłych list aktywnych sesji.
- `pinnedAt`: opcjonalny znacznik czasu przypięcia. Aktywne przypięte sesje są sortowane przed
  nieprzypiętymi sesjami; zarchiwizowanie sesji czyści jej przypięcie.
- Interoperacyjność wątku Codex: oba pola stosują kształt zarządzania wątkami Codex —
  wartości logiczne `archived`/`pinned` przesyłane po kablu są zawsze wyprowadzane ze
  znacznika czasu i oznaczane po stronie serwera, zgodnie z semantyką Codex
  `threads.archived_at` oraz serializacją camelCase. Znaczniki czasu OpenClaw są w milisekundach
  epoki, podczas gdy Codex używa sekund epoki, więc mosty konwertują je na granicy pluginu codex.
  Codex nie ma jeszcze API przypinania (tylko `thread/archive`/`thread/unarchive`);
  stan przypięcia pozostaje po stronie OpenClaw, dopóki takie API nie powstanie, a wtedy
  zgodny kształt pozwoli powiązanym sesjom mechanicznie przenosić stan przypięcia tam i z powrotem.
- `sessionFile`: opcjonalne jawne nadpisanie ścieżki transkryptu
- `chatType`: `direct | group | room` (pomaga UI i zasadom wysyłania)
- `provider`, `subject`, `room`, `space`, `displayName`: metadane do etykietowania grup/kanałów
- Przełączniki:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (nadpisanie dla sesji)
- Wybór modelu:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Liczniki tokenów (najlepsze oszacowanie / zależne od dostawcy):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: ile razy automatyczna Compaction zakończyła się dla tego klucza sesji
- `memoryFlushAt`: znacznik czasu ostatniego opróżnienia pamięci przed Compaction
- `memoryFlushCompactionCount`: liczba Compaction, gdy uruchomiono ostatnie opróżnienie

Magazyn można bezpiecznie edytować, ale Gateway jest źródłem prawdy: może przepisywać lub odtwarzać wpisy podczas działania sesji.

---

## Struktura transkryptu (`*.jsonl`)

Transkrypty są zarządzane przez `SessionManager` z `openclaw/plugin-sdk/agent-sessions`.

Plik jest w formacie JSONL:

- Pierwszy wiersz: nagłówek sesji (`type: "session"`, zawiera `id`, `cwd`, `timestamp`, opcjonalnie `parentSession`)
- Następnie: wpisy sesji z `id` + `parentId` (drzewo)

Ważne typy wpisów:

- `message`: wiadomości użytkownika/asystenta/toolResult
- `custom_message`: wiadomości wstrzyknięte przez rozszerzenie, które _wchodzą_ do kontekstu modelu (mogą być ukryte przed UI)
- `custom`: stan rozszerzenia, który _nie_ wchodzi do kontekstu modelu
- `compaction`: utrwalone podsumowanie Compaction z `firstKeptEntryId` i `tokensBefore`
- `branch_summary`: utrwalone podsumowanie podczas nawigowania po gałęzi drzewa

OpenClaw celowo **nie** „naprawia” transkryptów; Gateway używa `SessionManager` do ich odczytu/zapisu.

---

## Okna kontekstu a śledzone tokeny

Znaczenie mają dwa różne pojęcia:

1. **Okno kontekstu modelu**: twardy limit dla modelu (tokeny widoczne dla modelu)
2. **Liczniki magazynu sesji**: statystyki kroczące zapisywane w `sessions.json` (używane przez /status i pulpity)

Jeśli stroisz limity:

- Okno kontekstu pochodzi z katalogu modeli (i może być nadpisane przez konfigurację).
- `contextTokens` w magazynie jest runtime’owym oszacowaniem/wartością raportową; nie traktuj go jako ścisłej gwarancji.

Więcej informacji znajdziesz w [/token-use](/pl/reference/token-use).

---

## Compaction: czym jest

Compaction podsumowuje starszą rozmowę do utrwalonego wpisu `compaction` w transkrypcie i pozostawia ostatnie wiadomości bez zmian.

Po Compaction przyszłe tury widzą:

- Podsumowanie Compaction
- Wiadomości po `firstKeptEntryId`

Ponowne wstrzykiwanie sekcji AGENTS.md po Compaction jest opcjonalne przez
`agents.defaults.compaction.postCompactionSections`; gdy nie jest ustawione lub ma wartość `[]`,
OpenClaw nie dodaje fragmentów AGENTS.md na wierzchu podsumowania Compaction.

Compaction jest **trwała** (w przeciwieństwie do przycinania sesji). Zobacz [/concepts/session-pruning](/pl/concepts/session-pruning).

## Granice porcji Compaction i parowanie narzędzi

Gdy OpenClaw dzieli długi transkrypt na porcje Compaction, zachowuje
wywołania narzędzi asystenta sparowane z odpowiadającymi im wpisami `toolResult`.

- Jeśli podział według udziału tokenów trafia między wywołanie narzędzia a jego wynik, OpenClaw
  przesuwa granicę do wiadomości wywołania narzędzia asystenta zamiast rozdzielać
  parę.
- Jeśli końcowy blok wyników narzędzia w przeciwnym razie przesunąłby porcję ponad cel,
  OpenClaw zachowuje ten oczekujący blok narzędzia i pozostawia niepodsumowany ogon
  bez zmian.
- Przerwane/błędne bloki wywołań narzędzi nie utrzymują oczekującego podziału otwartego.

---

## Kiedy następuje automatyczna Compaction (runtime OpenClaw)

We wbudowanym agencie OpenClaw automatyczna Compaction uruchamia się w dwóch przypadkach:

1. **Odzyskiwanie po przepełnieniu**: model zwraca błąd przepełnienia kontekstu
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` i podobne warianty ukształtowane przez dostawców) → kompaktuj → ponów.
   Gdy dostawca zgłasza próbowaną liczbę tokenów, OpenClaw przekazuje tę
   zaobserwowaną liczbę do Compaction odzyskiwania po przepełnieniu. Jeśli dostawca potwierdza
   przepełnienie, ale nie ujawnia możliwej do sparsowania liczby, OpenClaw przekazuje minimalnie
   przekraczającą budżet syntetyczną liczbę do silników Compaction i diagnostyki.
   Jeśli odzyskiwanie po przepełnieniu nadal się nie powiedzie, OpenClaw pokazuje użytkownikowi
   jawne wskazówki i zachowuje bieżące mapowanie sesji zamiast po cichu obracać
   klucz sesji na świeży identyfikator sesji. Następny krok jest kontrolowany przez operatora:
   ponów wiadomość, uruchom `/compact` albo uruchom `/new`, gdy preferowana jest świeża sesja.
2. **Utrzymanie progowe**: po udanej turze, gdy:

`contextTokens > contextWindow - reserveTokens`

Gdzie:

- `contextWindow` to okno kontekstu modelu
- `reserveTokens` to zapas zarezerwowany na prompty + następne wyjście modelu

To są semantyki runtime OpenClaw.

OpenClaw może też wyzwolić lokalną Compaction wstępną przed otwarciem następnego
uruchomienia, gdy ustawiono `agents.defaults.compaction.maxActiveTranscriptBytes` i aktywny
plik transkryptu osiągnie ten rozmiar. Jest to zabezpieczenie rozmiaru pliku dla kosztu
lokalnego ponownego otwarcia, a nie surowa archiwizacja: OpenClaw nadal uruchamia zwykłą
semantyczną Compaction i wymaga `truncateAfterCompaction`, aby skompaktowane podsumowanie mogło stać się
nowym następczym transkryptem.

Dla wbudowanych uruchomień OpenClaw `agents.defaults.compaction.midTurnPrecheck.enabled: true`
dodaje opcjonalne zabezpieczenie pętli narzędzi. Po dołączeniu wyniku narzędzia i przed
następnym wywołaniem modelu OpenClaw szacuje presję promptu przy użyciu tej samej logiki
budżetu wstępnego, która jest używana na początku tury. Jeśli kontekst już się nie mieści, zabezpieczenie
nie kompaktuje wewnątrz hooka `transformContext` runtime OpenClaw. Zgłasza ustrukturyzowany
sygnał wstępnego sprawdzenia w środku tury, zatrzymuje bieżące przesłanie promptu i pozwala
zewnętrznej pętli uruchomienia użyć istniejącej ścieżki odzyskiwania: obciąć zbyt duże wyniki narzędzi,
gdy to wystarczy, albo wyzwolić skonfigurowany tryb Compaction i ponowić. Opcja
jest domyślnie wyłączona i działa zarówno z trybem Compaction `default`, jak i `safeguard`,
w tym z Compaction safeguard obsługiwaną przez dostawcę.
Jest to niezależne od `maxActiveTranscriptBytes`: zabezpieczenie rozmiaru w bajtach działa
przed otwarciem tury, a wstępne sprawdzenie w środku tury działa później w pętli narzędzi
wbudowanego OpenClaw, po dołączeniu nowych wyników narzędzi.

---

## Ustawienia Compaction (`reserveTokens`, `keepRecentTokens`)

Ustawienia Compaction runtime OpenClaw znajdują się w ustawieniach agenta:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw wymusza też dolny limit bezpieczeństwa dla wbudowanych uruchomień:

- Jeśli `compaction.reserveTokens < reserveTokensFloor`, OpenClaw go podnosi.
- Domyślny dolny limit to `20000` tokenów.
- Ustaw `agents.defaults.compaction.reserveTokensFloor: 0`, aby wyłączyć dolny limit.
- Jeśli jest już wyższy, OpenClaw zostawia go bez zmian.
- Ręczne `/compact` respektuje jawne `agents.defaults.compaction.keepRecentTokens`
  i zachowuje punkt odcięcia ostatniego ogona runtime OpenClaw. Bez jawnego budżetu zachowania
  ręczna Compaction pozostaje twardym punktem kontrolnym, a odbudowany kontekst zaczyna się od
  nowego podsumowania.
- Ustaw `agents.defaults.compaction.midTurnPrecheck.enabled: true`, aby uruchamiać
  opcjonalne wstępne sprawdzenie pętli narzędzi po nowych wynikach narzędzi i przed następnym
  wywołaniem modelu. To tylko wyzwalacz; generowanie podsumowania nadal używa skonfigurowanej
  ścieżki Compaction. Jest niezależne od `maxActiveTranscriptBytes`, które jest
  zabezpieczeniem rozmiaru aktywnego transkryptu w bajtach na początku tury.
- Ustaw `agents.defaults.compaction.maxActiveTranscriptBytes` na wartość w bajtach albo
  ciąg, taki jak `"20mb"`, aby uruchamiać lokalną Compaction przed turą, gdy aktywny
  transkrypt urośnie. To zabezpieczenie jest aktywne tylko wtedy, gdy
  `truncateAfterCompaction` jest również włączone. Pozostaw nieustawione albo ustaw `0`, aby
  wyłączyć.
- Gdy `agents.defaults.compaction.truncateAfterCompaction` jest włączone,
  OpenClaw obraca aktywny transkrypt do skompaktowanego następczego JSONL po
  Compaction. Akcje punktów kontrolnych gałęzi/przywracania używają tego skompaktowanego następcy;
  starsze pliki punktów kontrolnych sprzed Compaction pozostają czytelne, gdy są referencjonowane.

Dlaczego: zostawia wystarczająco dużo zapasu na wieloturowe „porządkowanie” (takie jak zapisy pamięci), zanim Compaction stanie się nieunikniona.

Implementacja: `applyAgentCompactionSettingsFromConfig()` w `src/agents/agent-settings.ts`
(wywoływana ze ścieżek tury wbudowanego runnera i konfiguracji Compaction).

---

## Wymienni dostawcy Compaction

Pluginy mogą rejestrować dostawcę Compaction przez `registerCompactionProvider()` w API pluginu. Gdy `agents.defaults.compaction.provider` jest ustawione na identyfikator zarejestrowanego dostawcy, rozszerzenie safeguard deleguje podsumowywanie do tego dostawcy zamiast do wbudowanego potoku `summarizeInStages`.

- `provider`: identyfikator zarejestrowanego pluginu dostawcy Compaction. Pozostaw nieustawione dla domyślnego podsumowywania LLM.
- Ustawienie `provider` wymusza `mode: "safeguard"`.
- Dostawcy otrzymują te same instrukcje Compaction i zasady zachowywania identyfikatorów co wbudowana ścieżka.
- Safeguard nadal zachowuje kontekst sufiksu ostatniej tury i podzielonej tury po wyjściu dostawcy.
- Wbudowane podsumowywanie safeguard ponownie destyluje wcześniejsze podsumowania z nowymi wiadomościami
  zamiast zachowywać pełne poprzednie podsumowanie dosłownie.
- Tryb safeguard domyślnie włącza audyty jakości podsumowania; ustaw
  `qualityGuard.enabled: false`, aby pominąć zachowanie ponawiania przy źle uformowanym wyjściu.
- Jeśli dostawca zawiedzie lub zwróci pusty wynik, OpenClaw automatycznie wraca do wbudowanego podsumowywania LLM.
- Sygnały przerwania/limitu czasu są ponownie zgłaszane (nie połykane), aby respektować anulowanie przez wywołującego.

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

## Ciche porządkowanie (`NO_REPLY`)

OpenClaw obsługuje „ciche” tury dla zadań w tle, w których użytkownik nie powinien widzieć pośredniego wyjścia.

Konwencja:

- Asystent rozpoczyna swoje wyjście dokładnym cichym tokenem `NO_REPLY` /
  `no_reply`, aby wskazać „nie dostarczaj odpowiedzi użytkownikowi”.
- OpenClaw usuwa/tłumi to w warstwie dostarczania.
- Dokładne tłumienie cichego tokenu nie rozróżnia wielkości liter, więc `NO_REPLY` i
  `no_reply` liczą się tak samo, gdy cały ładunek jest tylko cichym tokenem.
- Jest to przeznaczone wyłącznie dla rzeczywistych tur działających w tle / bez dostarczania; nie jest skrótem dla
  zwykłych, wykonalnych żądań użytkownika.

Od `2026.1.10` OpenClaw tłumi także **strumieniowanie szkicu/pisania**, gdy
częściowy fragment zaczyna się od `NO_REPLY`, więc ciche operacje nie ujawniają częściowego
wyjścia w trakcie tury.

---

## „Zrzut pamięci” przed Compaction (zaimplementowane)

Cel: zanim nastąpi automatyczna Compaction, uruchomić cichą turę agenta, która zapisuje trwały
stan na dysku (np. `memory/YYYY-MM-DD.md` w przestrzeni roboczej agenta), aby Compaction nie mogła
wymazać krytycznego kontekstu.

OpenClaw używa podejścia **opróżniania przed progiem**:

1. Monitoruj użycie kontekstu sesji.
2. Gdy przekroczy „miękki próg” (poniżej progu Compaction środowiska uruchomieniowego OpenClaw), uruchom cichą
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

- Domyślny prompt/prompt systemowy zawiera wskazówkę `NO_REPLY`, aby stłumić
  dostarczanie.
- Gdy ustawiono `model`, tura opróżniania używa tego modelu bez dziedziczenia
  aktywnego łańcucha awaryjnego sesji, dzięki czemu lokalne prace porządkowe nie przełączają się po cichu
  na płatny model konwersacyjny.
- Opróżnianie uruchamia się raz na cykl Compaction (śledzone w `sessions.json`).
- Opróżnianie działa tylko dla osadzonych sesji OpenClaw (backendy CLI je pomijają).
- Opróżnianie jest pomijane, gdy przestrzeń robocza sesji jest tylko do odczytu (`workspaceAccess: "ro"` lub `"none"`).
- Zobacz [Pamięć](/pl/concepts/memory), aby poznać układ plików przestrzeni roboczej i wzorce zapisu.

OpenClaw udostępnia także hak `session_before_compact` w API rozszerzeń, ale logika
opróżniania OpenClaw znajduje się obecnie po stronie Gateway.

---

## Lista kontrolna rozwiązywania problemów

- Nieprawidłowy klucz sesji? Zacznij od [/concepts/session](/pl/concepts/session) i potwierdź `sessionKey` w `/status`.
- Niezgodność magazynu i transkrypcji? Potwierdź host Gateway oraz ścieżkę magazynu z `openclaw status`.
- Spam Compaction? Sprawdź:
  - okno kontekstu modelu (zbyt małe)
  - ustawienia Compaction (`reserveTokens` ustawione zbyt wysoko względem okna modelu może powodować wcześniejszą Compaction)
  - rozrost wyników narzędzi: włącz/dostrój przycinanie sesji
- Wyciekające ciche tury? Potwierdź, że odpowiedź zaczyna się od `NO_REPLY` (dokładny token bez rozróżniania wielkości liter) i że używasz kompilacji zawierającej poprawkę tłumienia strumieniowania.

## Powiązane

- [Zarządzanie sesją](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Silnik kontekstu](/pl/concepts/context-engine)
