---
read_when:
    - Musisz debugować identyfikatory sesji, transkrypcję JSONL lub pola sessions.json
    - Zmieniasz zachowanie automatycznego Compaction albo dodajesz czynności porządkowe przed Compaction
    - Chcesz zaimplementować opróżnianie pamięci lub ciche tury systemowe
summary: 'Dogłębne omówienie: magazyn sesji + transkrypcje, cykl życia i wewnętrzne mechanizmy (auto)Compaction'
title: Dogłębne omówienie zarządzania sesjami
x-i18n:
    generated_at: "2026-05-06T09:29:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3ade29b83c2b3857c52e56275ed11c5b1f3cd07050ba9f35ea49ad427efcc39d
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw zarządza sesjami od początku do końca w tych obszarach:

- **Routing sesji** (jak wiadomości przychodzące są mapowane na `sessionKey`)
- **Magazyn sesji** (`sessions.json`) i co śledzi
- **Utrwalanie transkrypcji** (`*.jsonl`) i jej struktura
- **Higiena transkrypcji** (poprawki specyficzne dla dostawcy przed uruchomieniami)
- **Limity kontekstu** (okno kontekstu a śledzone tokeny)
- **Compaction** (ręczna i automatyczna Compaction) oraz gdzie podpiąć pracę przed Compaction
- **Ciche porządki** (zapisy pamięci, które nie powinny generować wyjścia widocznego dla użytkownika)

Jeśli najpierw chcesz uzyskać ogólny przegląd, zacznij od:

- [Zarządzanie sesjami](/pl/concepts/session)
- [Compaction](/pl/concepts/compaction)
- [Przegląd pamięci](/pl/concepts/memory)
- [Wyszukiwanie w pamięci](/pl/concepts/memory-search)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Higiena transkrypcji](/pl/reference/transcript-hygiene)

---

## Źródło prawdy: Gateway

OpenClaw jest zaprojektowany wokół pojedynczego **procesu Gateway**, który jest właścicielem stanu sesji.

- Interfejsy użytkownika (aplikacja macOS, webowy Control UI, TUI) powinny odpytywać Gateway o listy sesji i liczniki tokenów.
- W trybie zdalnym pliki sesji znajdują się na zdalnym hoście; „sprawdzanie lokalnych plików na Macu” nie odzwierciedli tego, czego używa Gateway.

---

## Dwie warstwy utrwalania

OpenClaw utrwala sesje w dwóch warstwach:

1. **Magazyn sesji (`sessions.json`)**
   - Mapa klucz/wartość: `sessionKey -> SessionEntry`
   - Mały, mutowalny, bezpieczny do edycji (lub usuwania wpisów)
   - Śledzi metadane sesji (bieżący identyfikator sesji, ostatnią aktywność, przełączniki, liczniki tokenów itd.)

2. **Transkrypcja (`<sessionId>.jsonl`)**
   - Transkrypcja tylko do dopisywania ze strukturą drzewa (wpisy mają `id` + `parentId`)
   - Przechowuje faktyczną rozmowę + wywołania narzędzi + podsumowania Compaction
   - Służy do odbudowy kontekstu modelu dla przyszłych tur
   - Duże debugowe punkty kontrolne sprzed Compaction są pomijane, gdy aktywna
     transkrypcja przekroczy limit rozmiaru punktu kontrolnego, co pozwala uniknąć drugiej ogromnej
     kopii `.checkpoint.*.jsonl`.

Czytniki historii Gateway powinny unikać materializowania całej transkrypcji, chyba że
dana powierzchnia jawnie potrzebuje dowolnego dostępu do historii. Historia pierwszej strony,
osadzona historia czatu, odzyskiwanie po restarcie oraz kontrole tokenów/użycia korzystają z ograniczonych odczytów ogona.
Pełne skany transkrypcji przechodzą przez asynchroniczny indeks transkrypcji, który jest
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

Utrwalanie sesji ma automatyczne kontrolki utrzymania (`session.maintenance`) dla `sessions.json`, artefaktów transkrypcji i plików bocznych trajektorii:

- `mode`: `warn` (domyślnie) lub `enforce`
- `pruneAfter`: próg wieku nieaktualnych wpisów (domyślnie `30d`)
- `maxEntries`: limit wpisów w `sessions.json` (domyślnie `500`)
- `resetArchiveRetention`: retencja archiwów transkrypcji `*.reset.<timestamp>` (domyślnie taka sama jak `pruneAfter`; `false` wyłącza czyszczenie)
- `maxDiskBytes`: opcjonalny budżet katalogu sesji
- `highWaterBytes`: opcjonalny cel po czyszczeniu (domyślnie `80%` z `maxDiskBytes`)

Normalne zapisy Gateway przechodzą przez przypisanego do magazynu zapisującego sesje, który szereguje mutacje w procesie bez zakładania blokady pliku w czasie działania. Pomocniki poprawek na gorącej ścieżce pożyczają zweryfikowaną mutowalną pamięć podręczną, gdy trzymają ten slot zapisu, więc duże pliki `sessions.json` nie są klonowane ani ponownie odczytywane przy każdej aktualizacji metadanych. Kod w czasie działania powinien preferować `updateSessionStore(...)` lub `updateSessionStoreEntry(...)`; bezpośrednie zapisy całego magazynu są narzędziami kompatybilności i utrzymania offline. Gdy Gateway jest osiągalny, niedziałające w trybie dry-run `openclaw sessions cleanup` i `openclaw agents delete` delegują mutacje magazynu do Gateway, aby czyszczenie dołączyło do tej samej kolejki zapisującego; `--store <path>` jest jawną ścieżką naprawy offline do bezpośredniego utrzymania plików. Czyszczenie `maxEntries` nadal jest wsadowe dla limitów rozmiaru produkcyjnego, więc magazyn może krótko przekroczyć skonfigurowany limit, zanim następne czyszczenie do poziomu high-water przepisze go z powrotem w dół. Odczyty magazynu sesji nie przycinają ani nie limitują wpisów podczas startu Gateway; do czyszczenia użyj zapisów albo `openclaw sessions cleanup --enforce`. `openclaw sessions cleanup --enforce` nadal natychmiast stosuje skonfigurowany limit i przycina stare nieodwoływane artefakty transkrypcji, punktów kontrolnych oraz trajektorii, nawet gdy nie skonfigurowano budżetu dyskowego.

Utrzymanie zachowuje trwałe zewnętrzne wskaźniki rozmów, takie jak sesje grupowe
i sesje czatu ograniczone do wątku, ale syntetyczne wpisy czasu działania dla Cron, hooków,
Heartbeat, ACP i podagentów nadal mogą zostać usunięte, gdy przekroczą
skonfigurowany wiek, liczbę lub budżet dyskowy.

OpenClaw nie tworzy już automatycznych rotacyjnych kopii zapasowych `sessions.json.bak.*` podczas zapisów Gateway. Starszy klucz `session.maintenance.rotateBytes` jest ignorowany, a `openclaw doctor --fix` usuwa go ze starszych konfiguracji.

Mutacje transkrypcji używają blokady zapisu sesji na pliku transkrypcji. Pozyskanie blokady czeka do
`session.writeLock.acquireTimeoutMs`, zanim zgłosi błąd zajętej sesji; wartość domyślna to `60000`
ms. Zwiększaj to tylko wtedy, gdy prawidłowe przygotowanie, czyszczenie, Compaction lub praca lustra transkrypcji kolidują
dłużej na wolnych maszynach. Wykrywanie nieaktualnych blokad i ostrzeżenia o maksymalnym czasie trzymania pozostają osobnymi zasadami.

Kolejność egzekwowania dla czyszczenia budżetu dyskowego (`mode: "enforce"`):

1. Najpierw usuń najstarsze zarchiwizowane, osierocone artefakty transkrypcji lub osierocone artefakty trajektorii.
2. Jeśli nadal przekracza cel, eksmituj najstarsze wpisy sesji i ich pliki transkrypcji/trajektorii.
3. Kontynuuj, aż użycie będzie na poziomie `highWaterBytes` lub poniżej.

W `mode: "warn"` OpenClaw zgłasza potencjalne eksmisje, ale nie mutuje magazynu/plików.

Uruchom utrzymanie na żądanie:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Sesje Cron i dzienniki uruchomień

Izolowane uruchomienia Cron również tworzą wpisy sesji/transkrypcje i mają dedykowane kontrolki retencji:

- `cron.sessionRetention` (domyślnie `24h`) przycina stare izolowane sesje uruchomień Cron z magazynu sesji (`false` wyłącza).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` przycinają pliki `~/.openclaw/cron/runs/<jobId>.jsonl` (domyślnie: `2_000_000` bajtów i `2000` wierszy).

Gdy Cron wymusza utworzenie nowej izolowanej sesji uruchomienia, sanityzuje poprzedni
wpis sesji `cron:<jobId>` przed zapisaniem nowego wiersza. Przenosi bezpieczne
preferencje, takie jak ustawienia myślenia/szybkości/szczegółowości, etykiety oraz jawne
wybrane przez użytkownika nadpisania modelu/autoryzacji. Odrzuca kontekst rozmowy otoczenia, taki
jak routing kanału/grupy, zasady wysyłania lub kolejkowania, podniesienie uprawnień, źródło i powiązanie czasu działania ACP,
aby świeże izolowane uruchomienie nie mogło odziedziczyć przestarzałego dostarczania lub
uprawnień czasu działania ze starszego uruchomienia.

---

## Klucze sesji (`sessionKey`)

`sessionKey` identyfikuje _koszyk rozmowy_, w którym jesteś (routing + izolacja).

Typowe wzorce:

- Główny/bezpośredni czat (na agenta): `agent:<agentId>:<mainKey>` (domyślnie `main`)
- Grupa: `agent:<agentId>:<channel>:group:<id>`
- Pokój/kanał (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` lub `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (chyba że nadpisano)

Reguły kanoniczne są udokumentowane w [/concepts/session](/pl/concepts/session).

---

## Identyfikatory sesji (`sessionId`)

Każdy `sessionKey` wskazuje bieżący `sessionId` (plik transkrypcji, który kontynuuje rozmowę).

Reguły praktyczne:

- **Reset** (`/new`, `/reset`) tworzy nowy `sessionId` dla tego `sessionKey`.
- **Dzienny reset** (domyślnie 4:00 AM czasu lokalnego na hoście Gateway) tworzy nowy `sessionId` przy następnej wiadomości po granicy resetu.
- **Wygaśnięcie bezczynności** (`session.reset.idleMinutes` lub starsze `session.idleMinutes`) tworzy nowy `sessionId`, gdy wiadomość nadejdzie po oknie bezczynności. Gdy skonfigurowano zarówno reset dzienny, jak i bezczynność, wygrywa to, co wygaśnie pierwsze.
- **Zdarzenia systemowe** (Heartbeat, wybudzenia Cron, powiadomienia exec, księgowanie Gateway) mogą mutować wiersz sesji, ale nie przedłużają świeżości resetu dziennego/bezczynności. Przeniesienie resetu odrzuca zakolejkowane powiadomienia zdarzeń systemowych dla poprzedniej sesji, zanim zostanie zbudowany świeży prompt.
- **Zasada forku rodzica** używa aktywnej gałęzi Pi podczas tworzenia wątku lub forku podagenta. Jeśli ta gałąź jest zbyt duża, OpenClaw uruchamia dziecko z izolowanym kontekstem zamiast kończyć niepowodzeniem lub dziedziczyć bezużyteczną historię. Polityka rozmiaru jest automatyczna; starsza konfiguracja `session.parentForkMaxTokens` jest usuwana przez `openclaw doctor --fix`.

Szczegół implementacyjny: decyzja zapada w `initSessionState()` w `src/auto-reply/reply/session.ts`.

---

## Schemat magazynu sesji (`sessions.json`)

Typ wartości magazynu to `SessionEntry` w `src/config/sessions.ts`.

Kluczowe pola (lista niepełna):

- `sessionId`: bieżący identyfikator transkrypcji (nazwa pliku jest wyprowadzana z niego, chyba że ustawiono `sessionFile`)
- `sessionStartedAt`: znacznik czasu rozpoczęcia dla bieżącego `sessionId`; świeżość resetu dziennego
  używa tej wartości. Starsze wiersze mogą wyprowadzać ją z nagłówka sesji JSONL.
- `lastInteractionAt`: znacznik czasu ostatniej rzeczywistej interakcji użytkownika/kanału; świeżość resetu bezczynności
  używa tej wartości, aby Heartbeat, Cron i zdarzenia exec nie utrzymywały sesji
  przy życiu. Starsze wiersze bez tego pola wracają do odzyskanego czasu rozpoczęcia sesji
  dla świeżości bezczynności.
- `updatedAt`: znacznik czasu ostatniej mutacji wiersza magazynu, używany do listowania, przycinania i
  księgowania. Nie jest źródłem prawdy dla świeżości resetu dziennego/bezczynności.
- `sessionFile`: opcjonalne jawne nadpisanie ścieżki transkrypcji
- `chatType`: `direct | group | room` (pomaga interfejsom użytkownika i zasadom wysyłania)
- `provider`, `subject`, `room`, `space`, `displayName`: metadane etykietowania grup/kanałów
- Przełączniki:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (nadpisanie dla sesji)
- Wybór modelu:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Liczniki tokenów (best-effort / zależne od dostawcy):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: jak często automatyczna Compaction zakończyła się dla tego klucza sesji
- `memoryFlushAt`: znacznik czasu ostatniego flushu pamięci przed Compaction
- `memoryFlushCompactionCount`: licznik Compaction, gdy uruchomiono ostatni flush

Magazyn jest bezpieczny do edycji, ale Gateway jest źródłem prawdy: może przepisywać lub rehydratować wpisy podczas działania sesji.

---

## Struktura transkrypcji (`*.jsonl`)

Transkrypcjami zarządza `SessionManager` z `@mariozechner/pi-coding-agent`.

Plik ma format JSONL:

- Pierwszy wiersz: nagłówek sesji (`type: "session"`, zawiera `id`, `cwd`, `timestamp`, opcjonalne `parentSession`)
- Następnie: wpisy sesji z `id` + `parentId` (drzewo)

Istotne typy wpisów:

- `message`: wiadomości użytkownika/asystenta/toolResult
- `custom_message`: wiadomości wstrzyknięte przez rozszerzenie, które _trafiają_ do kontekstu modelu (mogą być ukryte przed UI)
- `custom`: stan rozszerzenia, który _nie trafia_ do kontekstu modelu
- `compaction`: utrwalone podsumowanie Compaction z `firstKeptEntryId` i `tokensBefore`
- `branch_summary`: utrwalone podsumowanie podczas nawigacji po gałęzi drzewa

OpenClaw celowo **nie** „poprawia” transkrypcji; Gateway używa `SessionManager` do ich odczytu/zapisu.

---

## Okna kontekstu a śledzone tokeny

Znaczenie mają dwa różne pojęcia:

1. **Okno kontekstu modelu**: twardy limit na model (tokeny widoczne dla modelu)
2. **Liczniki magazynu sesji**: kroczące statystyki zapisywane do `sessions.json` (używane dla /status i pulpitów)

Jeśli dostrajasz limity:

- Okno kontekstu pochodzi z katalogu modeli (i może być nadpisane przez konfigurację).
- `contextTokens` w magazynie to szacunkowa/raportowana wartość czasu działania; nie traktuj jej jako ścisłej gwarancji.

Więcej w [/token-use](/pl/reference/token-use).

---

## Compaction: czym jest

Compaction podsumowuje starszą rozmowę do utrwalonego wpisu `compaction` w transkrypcji i pozostawia ostatnie wiadomości bez zmian.

Po Compaction przyszłe tury widzą:

- Podsumowanie Compaction
- Wiadomości po `firstKeptEntryId`

Compaction jest **trwałe** (w przeciwieństwie do przycinania sesji). Zobacz [/concepts/session-pruning](/pl/concepts/session-pruning).

## Granice fragmentów Compaction i parowanie narzędzi

Gdy OpenClaw dzieli długi transkrypt na fragmenty Compaction, utrzymuje
wywołania narzędzi asystenta sparowane z odpowiadającymi im wpisami `toolResult`.

- Jeśli podział według udziału tokenów wypada między wywołaniem narzędzia a jego wynikiem, OpenClaw
  przesuwa granicę do komunikatu wywołania narzędzia asystenta zamiast rozdzielać
  parę.
- Jeśli końcowy blok wyniku narzędzia w przeciwnym razie przekroczyłby docelowy rozmiar fragmentu,
  OpenClaw zachowuje ten oczekujący blok narzędzia i utrzymuje niepodsumowany ogon
  bez zmian.
- Przerwane lub błędne bloki wywołań narzędzi nie utrzymują otwartego oczekującego podziału.

---

## Kiedy następuje automatyczne Compaction (środowisko uruchomieniowe Pi)

We wbudowanym agencie Pi automatyczne Compaction uruchamia się w dwóch przypadkach:

1. **Odzyskiwanie po przepełnieniu**: model zwraca błąd przepełnienia kontekstu
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` oraz podobne warianty zależne od dostawcy) → kompaktuj → ponów.
2. **Utrzymanie progu**: po udanej turze, gdy:

`contextTokens > contextWindow - reserveTokens`

Gdzie:

- `contextWindow` to okno kontekstu modelu
- `reserveTokens` to zapas zarezerwowany na prompty + następne wyjście modelu

Są to semantyki środowiska uruchomieniowego Pi (OpenClaw zużywa zdarzenia, ale Pi decyduje, kiedy kompaktować).

OpenClaw może też uruchomić lokalne Compaction wstępne przed otwarciem następnego
uruchomienia, gdy ustawiono `agents.defaults.compaction.maxActiveTranscriptBytes`, a
aktywny plik transkryptu osiągnie ten rozmiar. Jest to zabezpieczenie rozmiaru pliku dla lokalnego
kosztu ponownego otwarcia, nie surowej archiwizacji: OpenClaw nadal uruchamia zwykłe semantyczne Compaction,
a wymaga `truncateAfterCompaction`, aby skompaktowane podsumowanie mogło stać się
nowym transkryptem następczym.

Dla wbudowanych uruchomień Pi, `agents.defaults.compaction.midTurnPrecheck.enabled: true`
dodaje opcjonalne zabezpieczenie pętli narzędzi. Po dołączeniu wyniku narzędzia i przed
następnym wywołaniem modelu OpenClaw szacuje presję promptu przy użyciu tej samej logiki
budżetu wstępnego, której używa na początku tury. Jeśli kontekst już się nie mieści, zabezpieczenie
nie kompaktuje wewnątrz haka `transformContext` Pi. Zgłasza ustrukturyzowany
sygnał wstępnego sprawdzenia w połowie tury, zatrzymuje bieżące przesyłanie promptu i pozwala
zewnętrznej pętli uruchomieniowej użyć istniejącej ścieżki odzyskiwania: obciąć zbyt duże wyniki narzędzi,
gdy to wystarcza, albo uruchomić skonfigurowany tryb Compaction i ponowić. Opcja
jest domyślnie wyłączona i działa zarówno z trybem `default`, jak i `safeguard`
Compaction, w tym z Compaction zabezpieczającym obsługiwanym przez dostawcę.
Jest to niezależne od `maxActiveTranscriptBytes`: zabezpieczenie rozmiaru w bajtach działa
przed otwarciem tury, natomiast wstępne sprawdzenie w połowie tury działa później we wbudowanej pętli narzędzi Pi
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

OpenClaw wymusza też dolny limit bezpieczeństwa dla wbudowanych uruchomień:

- Jeśli `compaction.reserveTokens < reserveTokensFloor`, OpenClaw podnosi tę wartość.
- Domyślny limit to `20000` tokenów.
- Ustaw `agents.defaults.compaction.reserveTokensFloor: 0`, aby wyłączyć limit.
- Jeśli wartość jest już wyższa, OpenClaw pozostawia ją bez zmian.
- Ręczne `/compact` honoruje jawne `agents.defaults.compaction.keepRecentTokens`
  i zachowuje punkt odcięcia ostatniego ogona Pi. Bez jawnego budżetu zachowania,
  ręczne Compaction pozostaje twardym punktem kontrolnym, a odbudowany kontekst zaczyna się od
  nowego podsumowania.
- Ustaw `agents.defaults.compaction.midTurnPrecheck.enabled: true`, aby uruchamiać
  opcjonalne wstępne sprawdzenie pętli narzędzi po nowych wynikach narzędzi i przed następnym
  wywołaniem modelu. To tylko wyzwalacz; generowanie podsumowania nadal używa skonfigurowanej
  ścieżki Compaction. Jest niezależne od `maxActiveTranscriptBytes`, które jest
  zabezpieczeniem rozmiaru aktywnego transkryptu w bajtach na początku tury.
- Ustaw `agents.defaults.compaction.maxActiveTranscriptBytes` na wartość bajtową lub
  ciąg taki jak `"20mb"`, aby uruchomić lokalne Compaction przed turą, gdy aktywny
  transkrypt stanie się duży. To zabezpieczenie jest aktywne tylko wtedy, gdy
  włączono też `truncateAfterCompaction`. Pozostaw nieustawione albo ustaw `0`, aby
  wyłączyć.
- Gdy włączone jest `agents.defaults.compaction.truncateAfterCompaction`,
  OpenClaw obraca aktywny transkrypt do skompaktowanego następczego JSONL po
  Compaction. Stary pełny transkrypt pozostaje zarchiwizowany i połączony z
  punktem kontrolnym Compaction zamiast być przepisywany w miejscu.

Dlaczego: zostaw wystarczający zapas na wieloturowe „porządkowanie” (takie jak zapisy pamięci), zanim Compaction stanie się nieuniknione.

Implementacja: `ensurePiCompactionReserveTokens()` w `src/agents/pi-settings.ts`
(wywoływane z `src/agents/pi-embedded-runner.ts`).

---

## Wymienni dostawcy Compaction

Pluginy mogą zarejestrować dostawcę Compaction przez `registerCompactionProvider()` w API pluginu. Gdy `agents.defaults.compaction.provider` jest ustawione na identyfikator zarejestrowanego dostawcy, plugin zabezpieczający deleguje podsumowywanie do tego dostawcy zamiast używać wbudowanego potoku `summarizeInStages`.

- `provider`: identyfikator zarejestrowanego pluginu dostawcy Compaction. Pozostaw nieustawione dla domyślnego podsumowywania LLM.
- Ustawienie `provider` wymusza `mode: "safeguard"`.
- Dostawcy otrzymują te same instrukcje Compaction i zasady zachowywania identyfikatorów co ścieżka wbudowana.
- Zabezpieczenie nadal zachowuje kontekst przyrostka ostatnich tur i podzielonych tur po wyjściu dostawcy.
- Wbudowane podsumowywanie zabezpieczające redestyluje wcześniejsze podsumowania z nowymi wiadomościami
  zamiast zachowywać pełne poprzednie podsumowanie dosłownie.
- Tryb zabezpieczający domyślnie włącza audyty jakości podsumowania; ustaw
  `qualityGuard.enabled: false`, aby pominąć zachowanie ponawiania przy zniekształconym wyjściu.
- Jeśli dostawca zawiedzie lub zwróci pusty wynik, OpenClaw automatycznie wraca do wbudowanego podsumowywania LLM.
- Sygnały przerwania/limitu czasu są ponownie zgłaszane (nie połykane), aby respektować anulowanie przez wywołującego.

Źródło: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Powierzchnie widoczne dla użytkownika

Compaction i stan sesji możesz obserwować przez:

- `/status` (w dowolnej sesji czatu)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Tryb szczegółowy: `🧹 Auto-compaction complete` + licznik Compaction

---

## Ciche porządkowanie (`NO_REPLY`)

OpenClaw obsługuje „ciche” tury dla zadań w tle, w których użytkownik nie powinien widzieć pośredniego wyjścia.

Konwencja:

- Asystent rozpoczyna swoje wyjście dokładnym cichym tokenem `NO_REPLY` /
  `no_reply`, aby wskazać „nie dostarczaj odpowiedzi użytkownikowi”.
- OpenClaw usuwa/tłumi to w warstwie dostarczania.
- Dokładne tłumienie cichego tokenu nie rozróżnia wielkości liter, więc `NO_REPLY` i
  `no_reply` liczą się, gdy cały ładunek jest tylko cichym tokenem.
- To jest przeznaczone wyłącznie dla prawdziwych tur w tle bez dostarczania; nie jest skrótem dla
  zwykłych wykonalnych żądań użytkownika.

Od `2026.1.10` OpenClaw tłumi też **strumieniowanie szkicu/pisania**, gdy
częściowy fragment zaczyna się od `NO_REPLY`, dzięki czemu ciche operacje nie ujawniają częściowego
wyjścia w połowie tury.

---

## „Zrzut pamięci” przed Compaction (zaimplementowane)

Cel: zanim nastąpi automatyczne Compaction, uruchomić cichą agentową turę, która zapisuje trwały
stan na dysku (np. `memory/YYYY-MM-DD.md` w przestrzeni roboczej agenta), aby Compaction nie mogło
usunąć krytycznego kontekstu.

OpenClaw używa podejścia **zrzutu przed progiem**:

1. Monitoruj użycie kontekstu sesji.
2. Gdy przekroczy „miękki próg” (poniżej progu Compaction Pi), uruchom cichą
   dyrektywę „zapisz pamięć teraz” dla agenta.
3. Użyj dokładnego cichego tokenu `NO_REPLY` / `no_reply`, aby użytkownik nie widział
   niczego.

Konfiguracja (`agents.defaults.compaction.memoryFlush`):

- `enabled` (domyślnie: `true`)
- `model` (opcjonalne dokładne nadpisanie dostawcy/modelu dla tury zrzutu, na przykład `ollama/qwen3:8b`)
- `softThresholdTokens` (domyślnie: `4000`)
- `prompt` (wiadomość użytkownika dla tury zrzutu)
- `systemPrompt` (dodatkowy prompt systemowy dołączany dla tury zrzutu)

Uwagi:

- Domyślny prompt/prompt systemowy zawiera wskazówkę `NO_REPLY`, aby tłumić
  dostarczanie.
- Gdy ustawiono `model`, tura zrzutu używa tego modelu bez dziedziczenia
  łańcucha awaryjnego aktywnej sesji, więc lokalne porządkowanie nie przełącza się po cichu
  na płatny model konwersacyjny.
- Zrzut uruchamia się raz na cykl Compaction (śledzone w `sessions.json`).
- Zrzut działa tylko dla wbudowanych sesji Pi (backendy CLI go pomijają).
- Zrzut jest pomijany, gdy przestrzeń robocza sesji jest tylko do odczytu (`workspaceAccess: "ro"` lub `"none"`).
- Zobacz [Pamięć](/pl/concepts/memory), aby poznać układ plików przestrzeni roboczej i wzorce zapisu.

Pi udostępnia też hak `session_before_compact` w API pluginów, ale logika
zrzutu OpenClaw znajduje się dziś po stronie Gateway.

---

## Lista kontrolna rozwiązywania problemów

- Zły klucz sesji? Zacznij od [/concepts/session](/pl/concepts/session) i potwierdź `sessionKey` w `/status`.
- Niezgodność magazynu i transkryptu? Potwierdź host Gateway oraz ścieżkę magazynu z `openclaw status`.
- Spam Compaction? Sprawdź:
  - okno kontekstu modelu (zbyt małe)
  - ustawienia Compaction (`reserveTokens` zbyt wysokie dla okna modelu może powodować wcześniejsze Compaction)
  - rozdęte wyniki narzędzi: włącz/dostrój przycinanie sesji
- Ciche tury przeciekają? Potwierdź, że odpowiedź zaczyna się od `NO_REPLY` (dokładny token bez rozróżniania wielkości liter) i że używasz kompilacji zawierającej poprawkę tłumienia strumieniowania.

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Silnik kontekstu](/pl/concepts/context-engine)
