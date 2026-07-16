---
read_when:
    - Trzeba debugować identyfikatory sesji, zdarzenia transkrypcji lub pola wierszy sesji
    - Zmieniasz zachowanie automatycznego Compaction lub dodajesz porządkowanie przed Compaction
    - Chcesz zaimplementować opróżnianie pamięci lub ciche tury systemowe
summary: 'Analiza szczegółowa: magazyn sesji i transkrypcje, cykl życia oraz mechanizmy wewnętrzne (automatycznej) Compaction'
title: Szczegółowe omówienie zarządzania sesjami
x-i18n:
    generated_at: "2026-07-16T19:00:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7551a94a4e2dc8be8b69503795309d0200cc3b5d7231b54083dbcaade697b06c
    source_path: reference/session-management-compaction.md
    workflow: 16
---

Jeden **proces Gateway** kompleksowo zarządza stanem sesji. Interfejsy użytkownika (aplikacja macOS, webowy interfejs Control UI, TUI) wysyłają do Gateway zapytania o listy sesji i liczbę tokenów. W trybie zdalnym pliki sesji znajdują się na zdalnym hoście, więc sprawdzanie plików na lokalnym Macu nie odzwierciedla danych używanych przez Gateway.

Najpierw dokumentacja ogólna: [Zarządzanie sesjami](/pl/concepts/session), [Compaction](/pl/concepts/compaction), [Przegląd pamięci](/pl/concepts/memory), [Wyszukiwanie w pamięci](/pl/concepts/memory-search), [Oczyszczanie sesji](/pl/concepts/session-pruning), [Higiena transkrypcji](/pl/reference/transcript-hygiene), pełna dokumentacja konfiguracji: [Konfiguracja agenta](/pl/gateway/config-agents).

## Dwie warstwy trwałości

1. **Wiersze sesji (SQLite dla każdego agenta)** - mapa klucz/wartość `sessionKey -> SessionEntry`. Modyfikowalny stan środowiska uruchomieniowego zarządzany przez Gateway. Śledzi metadane: identyfikator bieżącej sesji, ostatnią aktywność, przełączniki i liczniki tokenów.
2. **Zdarzenia transkrypcji (SQLite dla każdego agenta)** - struktura drzewiasta tylko do dopisywania (wpisy mają `id` + `parentId`). Przechowuje rozmowę, wywołania narzędzi i podsumowania kompaktowania; odtwarza kontekst modelu dla przyszłych tur. Punkty kontrolne kompaktowania są metadanymi skompaktowanej transkrypcji następczej — nowe kompaktowanie nie zapisuje drugiej kopii `.checkpoint.*.jsonl`.

Starsze instalacje mogą nadal zawierać pliki `sessions.json` w katalogu agenta `sessions/`. Pliki te należy traktować jako starsze dane wejściowe migracji wierszy sesji lub jawne cele konserwacji offline. Uruchomienie Gateway i polecenie `openclaw doctor --fix` automatycznie importują aktywne starsze wiersze oraz historię transkrypcji do magazynu SQLite poszczególnych agentów. Gdy potrzebna jest jawna inspekcja lub dowód walidacji, należy uruchomić `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents`, a następnie wykonać [sekwencję migracji narzędzia Doctor](/pl/cli/doctor#session-sqlite-migration). Jeśli migracja nie powiedzie się po zarchiwizowaniu starszych artefaktów transkrypcji, należy użyć trybu odzyskiwania narzędzia Doctor opisanego w tej sekwencji. Odzyskiwanie korzysta z manifestów migracji, przywraca wyłącznie odpowiednie zarchiwizowane artefakty pomocnicze, na żądanie przygotowuje oczyszczone zgłoszenie problemu w GitHubie i nie powoduje ponownego odczytywania plików JSONL przez aktywne środowisko uruchomieniowe.

Mechanizmy odczytu historii Gateway nie materializują całej transkrypcji, chyba że dana powierzchnia wymaga swobodnego dostępu do danych historycznych. Historia pierwszej strony, osadzona historia czatu, odzyskiwanie po ponownym uruchomieniu oraz kontrole tokenów i użycia korzystają z ograniczonych odczytów końca danych z SQLite. Pełne skanowanie transkrypcji odbywa się za pośrednictwem asynchronicznego indeksu transkrypcji i jest współdzielone przez współbieżne mechanizmy odczytu.

## Lokalizacje na dysku

Dla każdego agenta na hoście Gateway (ustalane za pomocą `src/config/sessions.ts`):

- Magazyn wierszy sesji środowiska uruchomieniowego: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Wiersze transkrypcji środowiska uruchomieniowego: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- Starsze/zarchiwizowane artefakty transkrypcji: `~/.openclaw/agents/<agentId>/sessions/`
- Starsze dane wejściowe migracji wierszy: `~/.openclaw/agents/<agentId>/sessions/sessions.json`

## Konserwacja magazynu i limity dyskowe

`session.maintenance` steruje automatyczną konserwacją wierszy sesji SQLite, wierszy transkrypcji SQLite, artefaktów archiwalnych oraz plików pomocniczych trajektorii:

| Klucz                   | Wartość domyślna      | Uwagi                                                                                                  |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------------------ |
| `mode`                  | `"enforce"`           | lub `"warn"` (tylko raportowanie, bez modyfikacji)                                                     |
| `pruneAfter`            | `"30d"`               | graniczny wiek nieaktualnych wpisów                                                                    |
| `maxEntries`            | `500`                 | limit liczby wpisów sesji                                                                               |
| `resetArchiveRetention` | zachowaj (bez limitu wieku) | graniczny wiek archiwów transkrypcji `*.reset.*`/`*.deleted.*`; podanie czasu trwania włącza usuwanie |
| `maxDiskBytes`          | `2gb`                 | budżet dyskowy sesji dla każdego agenta; `false` wyłącza                                              |
| `highWaterBytes`        | 80% z `maxDiskBytes`  | wartość docelowa po oczyszczaniu budżetu                                                               |

Zarchiwizowane transkrypcje są domyślnie zachowywane i kompresowane za pomocą zstd (`*.jsonl.<reason>.<timestamp>.zst`), jeśli środowisko uruchomieniowe to obsługuje, dzięki czemu usunięcie lub zresetowanie sesji nigdy nie powoduje niejawnego odrzucenia historii rozmowy. Budżet dyskowy najpierw usuwa najstarsze archiwa, zanim wpłynie na aktywne sesje.

Aktywne wymuszanie limitu `maxDiskBytes` w SQLite mierzy dla każdej sesji łączną liczbę bajtów danych JSON wiersza sesji i zdarzeń transkrypcji; starsze wymuszanie limitów podczas konserwacji offline mierzy pliki w wybranym katalogu sesji.

Sesje testowe uruchomień modelu Gateway (klucze pasujące do `agent:*:explicit:model-run-<uuid>`) mają oddzielny, stały okres przechowywania `24h`. To oczyszczanie jest uruchamiane pod presją: następuje wyłącznie po osiągnięciu progu konserwacji lub limitu liczby wpisów sesji i tylko przed globalnym etapem usuwania lub ograniczania liczby nieaktualnych wpisów. Inne jawne sesje nie korzystają z tego okresu przechowywania.

Kolejność wymuszania podczas oczyszczania budżetu dyskowego (`mode: "enforce"`):

1. Najpierw usuń najstarsze zarchiwizowane artefakty transkrypcji, osierocone starsze artefakty lub osierocone artefakty trajektorii.
2. Jeśli wartość nadal przekracza cel, usuń najstarsze wpisy sesji wraz z ich wierszami transkrypcji lub artefaktami trajektorii.
3. Powtarzaj, aż użycie będzie równe lub niższe niż `highWaterBytes`.

`mode: "warn"` zgłasza potencjalne usunięcia bez modyfikowania magazynu ani plików.

Uruchamianie konserwacji na żądanie:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

Konserwacja zachowuje trwałe zewnętrzne wskaźniki rozmów, takie jak sesje grupowe i sesje czatu powiązane z wątkiem, ale syntetyczne wpisy środowiska uruchomieniowego (cron, hooki, heartbeat, ACP, podagenci) mogą zostać usunięte po przekroczeniu skonfigurowanego wieku, liczby lub budżetu dyskowego. Izolowane uruchomienia cron korzystają z oddzielnego ustawienia `cron.sessionRetention`, niezależnego od okresu przechowywania sesji testowych uruchomień modelu.

Zwykłe zapisy Gateway przechodzą przez akcesor sesji, który serializuje modyfikacje SQLite dla poszczególnych agentów za pośrednictwem ścieżki zapisu środowiska uruchomieniowego. Kod środowiska uruchomieniowego powinien preferować funkcje pomocnicze akcesora w `src/config/sessions/session-accessor.ts`; starsze funkcje pomocnicze `sessions.json` są narzędziami migracji i konserwacji offline. Gdy Gateway jest osiągalny, polecenia `openclaw sessions cleanup` i `openclaw agents delete` bez trybu próbnego przekazują modyfikacje magazynu do Gateway, dzięki czemu oczyszczanie dołącza do tej samej kolejki zapisu; `--store <path>` jest jawną ścieżką naprawy offline wybranego starszego magazynu i zawsze pozostaje lokalne (tak samo jak `--dry-run`). Oczyszczanie `maxEntries` odbywa się partiami w przypadku magazynów o rozmiarze produkcyjnym, więc magazyn może przez krótki czas przekraczać skonfigurowany limit, zanim kolejne oczyszczanie po przekroczeniu górnego progu zmniejszy go do wymaganej wielkości. Odczyty nigdy nie oczyszczają ani nie ograniczają liczby wpisów podczas uruchamiania Gateway — robią to wyłącznie zapisy lub `openclaw sessions cleanup --enforce`; to ostatnie również natychmiast stosuje limit i usuwa stare, nieużywane starsze artefakty transkrypcji, punktów kontrolnych oraz trajektorii, nawet jeśli nie skonfigurowano budżetu dyskowego.

OpenClaw nie tworzy już automatycznych kopii zapasowych rotacji `sessions.json.bak.*` podczas zapisów Gateway. Bieżący schemat odrzuca starszy klucz `session.maintenance.rotateBytes`, a `openclaw doctor --fix` usuwa go ze starszych konfiguracji.

Modyfikacje transkrypcji korzystają z kolejki zapisu sesji dla docelowej transkrypcji SQLite:

| Ustawienie                           | Wartość domyślna | Nadpisanie zmienną środowiskową                 |
| ------------------------------------ | ---------------- | ----------------------------------------------- |
| `session.writeLock.acquireTimeoutMs` | `60000`   | `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS` |
| `session.writeLock.staleMs`          | `1800000` | `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`           |
| `session.writeLock.maxHoldMs`        | `300000`  | `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`        |

`acquireTimeoutMs` określa, jak długo oczekiwanie na blokadę powoduje zgłaszanie błędu zajętej sesji przed rezygnacją; wartość tę należy zwiększać tylko wtedy, gdy uzasadnione przygotowanie, oczyszczanie, kompaktowanie lub tworzenie kopii lustrzanej transkrypcji powoduje dłuższe konflikty na wolnych maszynach. `staleMs` określa, kiedy istniejąca blokada może zostać odzyskana jako nieaktualna. `maxHoldMs` to próg zwolnienia blokady przez mechanizm nadzorczy w obrębie procesu.

### Powrót do starszej wersji po przejściu na SQLite

Przed uruchomieniem starszej wersji OpenClaw korzystającej z plików należy przywrócić zarchiwizowane starsze artefakty transkrypcji:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Migracja pozostawia starsze pliki `sessions.json` na potrzeby pomocy technicznej i wycofania zmian, ale aktywne pliki JSONL transkrypcji zaimportowane do SQLite są przemianowywane na `session-sqlite-import-archive/`. Starsze środowiska uruchomieniowe korzystające z plików odwołują się do ścieżek `sessionFile` w `sessions.json`, dlatego wymagają przywrócenia tych artefaktów przed uruchomieniem. Przywracanie korzysta z manifestów migracji, przenosi wyłącznie zarejestrowane zarchiwizowane artefakty, których oryginalne ścieżki nie istnieją, i pozostawia bazę danych SQLite na miejscu na potrzeby późniejszego odzyskiwania.

Sesje utworzone po przejściu na SQLite istnieją wyłącznie w SQLite i nie będą widoczne dla starszego środowiska uruchomieniowego korzystającego z plików. W przypadku ponownego uaktualnienia po powrocie do starszej wersji należy ponownie wykonać sekwencję inspekcji i walidacji narzędzia Doctor, aby OpenClaw mógł zweryfikować przywrócone starsze artefakty przed importem.

## Sesje cron i dzienniki uruchomień

Izolowane uruchomienia cron tworzą własne wpisy sesji i transkrypcje z dedykowanym okresem przechowywania:

- `cron.sessionRetention` (domyślnie `"24h"`) usuwa z magazynu stare sesje izolowanych uruchomień cron; `false` wyłącza tę funkcję.
- Historia uruchomień zachowuje 2000 najnowszych wierszy końcowych dla każdego zadania cron. Utracone wiersze zachowują 24-godzinne okno oczyszczania.

Gdy cron wymusza utworzenie nowej izolowanej sesji uruchomienia, przed zapisaniem nowego wiersza oczyszcza poprzedni wpis sesji `cron:<jobId>`: przenosi bezpieczne preferencje (ustawienia myślenia, szybkości, szczegółowości i rozumowania, etykiety oraz nazwę wyświetlaną) i jawnie wybrane przez użytkownika nadpisania modelu oraz uwierzytelniania, ale usuwa otaczający kontekst rozmowy (trasowanie kanału i grupy, zasady wysyłania i kolejkowania, podwyższenie uprawnień, źródło oraz powiązanie środowiska uruchomieniowego ACP), dzięki czemu nowe izolowane uruchomienie nie może odziedziczyć nieaktualnych uprawnień do dostarczania ani środowiska uruchomieniowego po starszym uruchomieniu.

## Klucze sesji (`sessionKey`)

`sessionKey` określa używany zasobnik rozmowy (trasowanie i izolacja). Reguły kanoniczne: [/concepts/session](/pl/concepts/session).

| Wzorzec                         | Przykład                                                    |
| ------------------------------- | ----------------------------------------------------------- |
| Czat główny/bezpośredni (na agenta) | `agent:<agentId>:<mainKey>` (domyślnie `main`)             |
| Grupa                           | `agent:<agentId>:<channel>:group:<id>`                                          |
| Pokój/kanał (Discord/Slack)     | `agent:<agentId>:<channel>:channel:<id>` lub `...:room:<id>`                   |
| Cron                            | `cron:<job.id>`                                          |
| Webhook                         | `hook:<uuid>` (o ile nie nadpisano)                    |

## Identyfikatory sesji (`sessionId`)

Każdy `sessionKey` wskazuje bieżący `sessionId` (tożsamość transkrypcji SQLite kontynuującej rozmowę). Logika decyzyjna znajduje się w `initSessionState()` w `src/auto-reply/reply/session.ts`.

- **Resetowanie** (`/new`, `/reset`) tworzy nową wartość `sessionId` dla tego `sessionKey`.
- **Resetowanie codzienne** (domyślnie o 4:00 czasu lokalnego na hoście Gateway) tworzy nową wartość `sessionId` przy pierwszej wiadomości po przekroczeniu granicy resetowania.
- **Wygaśnięcie bezczynności** (`session.reset.idleMinutes` lub starsze `session.idleMinutes`) tworzy nową wartość `sessionId`, gdy wiadomość nadejdzie po upływie okresu bezczynności. Jeśli skonfigurowano zarówno resetowanie codzienne, jak i wygaśnięcie bezczynności, obowiązuje to, które nastąpi wcześniej.
- **Wznowienie po ponownym połączeniu interfejsu sterowania** zachowuje aktualnie widoczną sesję na potrzeby jednego wysłania po ponownym połączeniu, gdy Gateway otrzyma pasującą wartość `sessionId` od klienckiego interfejsu operatora. Jest to sygnał jednorazowy; zwykłe wysłania z nieaktualnym stanem nadal tworzą nową wartość `sessionId`.
- **Zdarzenia systemowe** (Heartbeat, wybudzenia Cron, powiadomienia exec, wewnętrzna obsługa Gateway) mogą modyfikować wiersz sesji, ale nigdy nie przedłużają okresu aktualności resetowania codziennego ani resetowania po bezczynności. Przejście do nowej sesji podczas resetowania odrzuca oczekujące powiadomienia o zdarzeniach systemowych z poprzedniej sesji przed utworzeniem nowego promptu.
- **Zasady rozwidlania sesji nadrzędnej** podczas tworzenia wątku lub rozwidlenia podagenta korzystają z aktywnej gałęzi OpenClaw. Jeśli ta gałąź jest zbyt duża (przekracza stały wewnętrzny limit, obecnie 100K tokenów), OpenClaw uruchamia sesję podrzędną z odizolowanym kontekstem, zamiast zgłaszać błąd lub dziedziczyć bezużyteczną historię. Dobór rozmiaru odbywa się automatycznie i nie można go konfigurować; starsza konfiguracja `session.parentForkMaxTokens` jest usuwana przez `openclaw doctor --fix`.
- **Rozwidlenia operatora**: `sessions.create { parentSessionKey, fork: true }` tworzy nową sesję, której transkrypcja rozgałęzia się od bieżącego stanu sesji nadrzędnej (wykorzystując ten sam mechanizm rozwidlania co przy uruchamianiu podagentów, w tym powyższy limit rozmiaru). Rozwidlenie jest odrzucane, gdy sesja nadrzędna ma aktywne uruchomienie, dziedziczy wybór modelu sesji nadrzędnej, chyba że jawnie przekazano inny, oraz oznacza sesję podrzędną jako `forkedFromParent` z nowymi licznikami tokenów.

## Schemat magazynu sesji

Magazyn środowiska uruchomieniowego przechowuje wartości `SessionEntry` w bazie SQLite poszczególnych agentów. Typ wartości to `SessionEntry` w `src/config/sessions.ts`. Najważniejsze pola (lista niewyczerpująca):

- `sessionId`: bieżący identyfikator transkrypcji używany do adresowania jej wierszy w SQLite
- `sessionStartedAt`: znacznik czasu rozpoczęcia bieżącej wartości `sessionId`; jest używany do określania aktualności resetowania codziennego. Starsze wiersze mogą wyznaczać go z nagłówka sesji JSONL.
- `lastInteractionAt`: znacznik czasu ostatniej rzeczywistej interakcji użytkownika lub kanału; jest używany do określania aktualności resetowania po bezczynności, dzięki czemu zdarzenia Heartbeat, Cron i exec nie utrzymują sesji przy życiu. W przypadku starszych wierszy bez tego pola używany jest odzyskany czas rozpoczęcia sesji.
- `updatedAt`: znacznik czasu ostatniej modyfikacji wiersza magazynu, używany do wyświetlania list, usuwania i wewnętrznej obsługi — nie jest źródłem rozstrzygającym o aktualności resetowania codziennego ani resetowania po bezczynności.
- `archivedAt`: opcjonalny znacznik czasu archiwizacji. Zarchiwizowane sesje pozostają w magazynie z nienaruszoną transkrypcją i są wykluczone ze zwykłych list aktywnych sesji.
- `pinnedAt`: opcjonalny znacznik czasu przypięcia. Aktywne przypięte sesje są sortowane przed nieprzypiętymi; zarchiwizowanie sesji usuwa jej przypięcie.
- Współdziałanie z wątkami Codex: oba pola są zgodne ze strukturą zarządzania wątkami Codex — wartości logiczne `archived`/`pinned` przesyłane protokołem są zawsze wyprowadzane ze znacznika czasu i nadawane po stronie serwera, zgodnie z semantyką Codex `threads.archived_at` oraz serializacją camelCase. Znaczniki czasu OpenClaw są wyrażane w milisekundach epoki, natomiast Codex używa sekund epoki, dlatego mosty dokonują konwersji na granicy pluginu `codex`. Codex nie ma jeszcze interfejsu API przypinania (obsługuje tylko `thread/archive`/`thread/unarchive`); stan przypięcia pozostaje po stronie OpenClaw do czasu udostępnienia takiego interfejsu, a wtedy zgodność struktur umożliwi powiązanym sesjom mechaniczne przekazywanie stanu przypięcia w obie strony.
- Nadzór Codex wyświetla tylko niezarchiwizowane wątki natywne. Lokalny dla Gateway wątek `idle` lub `notLoaded` o nieznanej aktywności można zarchiwizować przez natywne `thread/archive` dopiero po jawnym potwierdzeniu przez operatora, że nie należy on do żadnego innego procesu Codex; plugin najpierw ponownie odczytuje lokalny stan procesu, po czym wątek znika z katalogu. Odczyt ten nie może dowieść, że inny proces App Server nie korzysta z wątku. OpenClaw odmawia archiwizowania aktywnych wierszy oraz wierszy w stanie błędu, a archiwizacja na sparowanym węźle jest niedostępna, dopóki most węzła nie będzie mógł obsługiwać pełnego cyklu życia strumieniowanego wątku. Cofnięcie archiwizacji w natywnym kliencie Codex sprawia, że wątek może pojawić się ponownie.
- `lastReadAt` / `markedUnreadAt`: znaczniki czasu stanu odczytu nadawane po stronie serwera przez `sessions.patch { unread }` — `unread: false` rejestruje odczyt (ustawia `lastReadAt`, usuwa `markedUnreadAt`); `unread: true` oznacza sesję jako nieprzeczytaną do następnego odczytu. Wiersze sesji udostępniają wyprowadzoną wartość logiczną `unread`: sesja jest jawnie oznaczona jako nieprzeczytana albo została odczytana przed ostatnią aktywnością. Sesje, których nigdy nie oznaczono jako przeczytane, pozostają `unread: false`, dzięki czemu istniejące instalacje nie wskazują ich jako nieprzeczytane po uaktualnieniu.
- `lastActivityAt`: znacznik czasu ostatniego ukończonego uruchomienia agenta, które jest uznawane za aktywność powodującą stan nieprzeczytany (uruchomienia użytkownika, kanału i Cron). Tury Heartbeat i zdarzeń wewnętrznych oraz poprawki metadanych go nie aktualizują; `updatedAt` nie jest sygnałem aktywności.
- `sessionFile`: starszy znacznik zachowany na potrzeby zgodności migracji i archiwizacji; aktywne środowisko uruchomieniowe używa tożsamości SQLite
- `chatType`: `direct | group | room`
- `provider`, `subject`, `room`, `space`, `displayName`: metadane etykietowania grupy/kanału
- Przełączniki: `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`, `sendPolicy` (nadpisanie dla poszczególnej sesji)
- Wybór modelu: `providerOverride`, `modelOverride`, `authProfileOverride`
- Liczniki tokenów (orientacyjne/zależne od dostawcy): `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: liczba ukończeń automatycznej operacji Compaction dla tego klucza sesji
- `memoryFlushAt` / `memoryFlushCompactionCount`: znacznik czasu i liczba operacji Compaction ostatniego opróżnienia pamięci przed operacją Compaction

Gateway jest źródłem rozstrzygającym: może przepisywać lub ponownie odtwarzać wpisy w trakcie
działania sesji. W starszych instalacjach korzystających z magazynu plikowego należy przeprowadzić migrację za pomocą
`openclaw doctor --session-sqlite import --session-sqlite-all-agents`, zamiast
edytować `sessions.json` i oczekiwać, że środowisko uruchomieniowe nadal będzie odczytywać ten plik.

## Struktura zdarzeń transkrypcji

Transkrypcjami zarządza moduł dostępu do sesji OpenClaw, a kod środowiska uruchomieniowego uzyskuje do nich dostęp przez pomocnicze funkcje oparte na tożsamości. Strumień zdarzeń umożliwia wyłącznie dopisywanie:

- Pierwszy wpis: nagłówek sesji — `type: "session"`, `id`, `cwd`, `timestamp`, opcjonalnie `parentSession`.
- Następnie: wpisy z `id` + `parentId` (struktura drzewa).

Istotne typy wpisów:

- `message`: wiadomości użytkownika/asystenta/toolResult
- `custom_message`: wiadomość wstrzyknięta przez rozszerzenie, która _wchodzi_ do kontekstu modelu (renderowana w TUI, gdy `display: true`, całkowicie ukryta, gdy `display: false`)
- `custom`: stan rozszerzenia, który _nie wchodzi_ do kontekstu modelu (służy do utrwalania stanu rozszerzenia między ponownymi załadowaniami)
- `compaction`: utrwalone podsumowanie operacji Compaction z `firstKeptEntryId` i `tokensBefore`
- `branch_summary`: utrwalone podsumowanie podczas nawigowania po gałęzi drzewa

OpenClaw celowo nie „naprawia” transkrypcji; Gateway używa `SessionManager` do ich odczytu/zapisu.

## Okna kontekstu a śledzone tokeny

Są to dwa różne pojęcia:

1. **Okno kontekstu modelu**: sztywny limit dla poszczególnych modeli (tokeny widoczne dla modelu). Pochodzi z katalogu modeli i może zostać nadpisany w konfiguracji.
2. **Liczniki magazynu sesji**: statystyki kroczące zapisywane w wierszu sesji (używane przez `/status` i pulpity). `contextTokens` jest wartością szacowaną/raportowaną przez środowisko uruchomieniowe — nie należy traktować jej jako ścisłej gwarancji.

Więcej informacji o limitach: [/reference/token-use](/pl/reference/token-use).

## Compaction: czym jest

Compaction podsumowuje starszą część rozmowy w utrwalonym wpisie `compaction` w transkrypcji i zachowuje ostatnie wiadomości bez zmian. Po operacji Compaction przyszłe tury widzą jej podsumowanie oraz wiadomości po `firstKeptEntryId`. Compaction jest **trwała**, w przeciwieństwie do przycinania sesji — zobacz [/concepts/session-pruning](/pl/concepts/session-pruning).

Ponowne wstrzykiwanie sekcji AGENTS.md po operacji Compaction jest opcjonalne i włączane przez `agents.defaults.compaction.postCompactionSections`; gdy ta wartość nie jest ustawiona lub wynosi `[]`, OpenClaw nie dołącza fragmentów AGENTS.md do podsumowania operacji Compaction.

### Granice fragmentów i parowanie narzędzi

Podczas dzielenia długiej transkrypcji na fragmenty na potrzeby operacji Compaction OpenClaw zachowuje wywołania narzędzi przez asystenta w parze z odpowiadającymi im wpisami `toolResult`:

- Jeśli podział według udziału tokenów miałby wypaść między wywołaniem narzędzia a jego wynikiem, OpenClaw przesuwa granicę do wiadomości asystenta zawierającej wywołanie narzędzia, zamiast rozdzielać parę.
- Jeśli końcowy blok wyników narzędzi przekroczyłby docelowy rozmiar fragmentu, OpenClaw zachowuje ten oczekujący blok narzędzia i pozostawia niepodsumowany koniec transkrypcji bez zmian.
- Przerwane lub zakończone błędem bloki wywołań narzędzi nie utrzymują oczekującego podziału w stanie otwartym.

## Kiedy następuje automatyczna operacja Compaction

W osadzonym agencie OpenClaw istnieją dwa wyzwalacze:

1. **Odzyskiwanie po przepełnieniu**: model zwraca błąd przepełnienia kontekstu (`request_too_large`, `context length exceeded`, `input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `input is too long for the model`, `ollama error: context length exceeded` i inne warianty zależne od dostawcy) — wykonaj operację Compaction, a następnie ponów próbę. Gdy dostawca zgłasza liczbę tokenów użytych w próbie, OpenClaw przekazuje tę zaobserwowaną liczbę do operacji Compaction podczas odzyskiwania po przepełnieniu; jeśli dostawca potwierdza przepełnienie, ale nie udostępnia liczby możliwej do przeanalizowania, OpenClaw przekazuje mechanizmom Compaction i diagnostyce syntetyczną liczbę minimalnie przekraczającą budżet. Jeśli odzyskiwanie po przepełnieniu nadal się nie powiedzie, OpenClaw wyświetla jednoznaczne wskazówki i zachowuje bieżące mapowanie sesji, zamiast po cichu przełączać się na nowy identyfikator sesji — należy ponowić wiadomość, uruchomić `/compact` lub uruchomić `/new`.
2. **Utrzymanie progu**: po pomyślnej turze, gdy `contextTokens > contextWindow - reserveTokens`, gdzie `contextWindow` jest oknem kontekstu modelu, a `reserveTokens` jest zapasem zarezerwowanym na prompty oraz następną odpowiedź modelu.

Poza tymi dwoma wyzwalaczami działają jeszcze dwa zabezpieczenia:

- **Lokalna operacja Compaction przed uruchomieniem**: należy ustawić `agents.defaults.compaction.maxActiveTranscriptBytes` (w bajtach lub jako ciąg taki jak `"20mb"`), aby przed rozpoczęciem następnego uruchomienia wyzwolić lokalną operację Compaction, gdy aktywna transkrypcja osiągnie ten rozmiar. Jest to zabezpieczenie rozmiaru ograniczające lokalny koszt ponownego otwarcia, a nie prosta archiwizacja — nadal wykonywana jest zwykła semantyczna operacja Compaction, która wymaga `truncateAfterCompaction`, aby podsumowanie operacji Compaction stało się nową transkrypcją następczą.
- **Kontrola wstępna w trakcie tury**: należy ustawić `agents.defaults.compaction.midTurnPrecheck.enabled: true` (domyślnie `false`), aby dodać zabezpieczenie pętli narzędzi. Po dopisaniu wyniku narzędzia, a przed następnym wywołaniem modelu, OpenClaw szacuje obciążenie promptu przy użyciu tej samej logiki budżetu wstępnego, która jest stosowana na początku tury. Jeśli kontekst przestaje się mieścić, zabezpieczenie nie wykonuje operacji Compaction bezpośrednio — zgłasza ustrukturyzowany sygnał kontroli wstępnej w trakcie tury, zatrzymuje bieżące przesyłanie promptu i pozwala zewnętrznej pętli uruchomienia użyć istniejącej ścieżki odzyskiwania (przyciąć zbyt duże wyniki narzędzi, jeśli to wystarczy, albo wyzwolić skonfigurowany tryb Compaction i ponowić próbę). Działa z trybami Compaction `default` i `safeguard`, w tym z zabezpieczającą operacją Compaction obsługiwaną przez dostawcę. Jest niezależne od `maxActiveTranscriptBytes`: zabezpieczenie rozmiaru w bajtach działa przed rozpoczęciem tury, a kontrola wstępna w trakcie tury działa później, po dopisaniu nowych wyników narzędzi.

## Ustawienia Compaction

```json5
{
  agents: {
    defaults: {
      compaction: {
        enabled: true,
        reserveTokens: 16384,
        keepRecentTokens: 20000,
      },
    },
  },
}
```

OpenClaw wymusza również minimalny próg bezpieczeństwa dla uruchomień osadzonych: jeśli `compaction.reserveTokens` jest mniejsze niż `reserveTokensFloor` (domyślnie `20000`), OpenClaw zwiększa tę wartość. Ustaw `agents.defaults.compaction.reserveTokensFloor: 0`, aby wyłączyć ten próg. Gdy okno kontekstu aktywnego modelu jest znane, zarówno próg, jak i ostateczna efektywna rezerwa są ograniczane, aby rezerwa nie mogła pochłonąć całego budżetu promptu. Dzięki temu modele z małym kontekstem (na przykład lokalny model z 16 tys. tokenów) nie rozpoczynają Compaction od pierwszego tokenu; bez znanego okna kontekstu skonfigurowane i bieżące budżety rezerwy pozostają nieograniczone. Po co w ogóle próg: aby pozostawić wystarczający zapas na wieloturowe „prace porządkowe” (takie jak opisany niżej zapis pamięci), zanim Compaction stanie się nieuniknione. Implementacja: `applyAgentCompactionSettingsFromConfig()` w `src/agents/agent-settings.ts`, wywoływane ze ścieżek konfiguracji tury osadzonego modułu uruchomieniowego i Compaction.

Ręczne `/compact` respektuje jawne `agents.defaults.compaction.keepRecentTokens` i zachowuje punkt odcięcia ostatniej części środowiska uruchomieniowego. Bez jawnego budżetu zachowania ręczne Compaction jest twardym punktem kontrolnym, a odbudowany kontekst rozpoczyna się od nowego podsumowania.

Gdy włączone jest `truncateAfterCompaction`, OpenClaw po Compaction przełącza aktywną transkrypcję na skompaktowanego następcę. Akcje punktu kontrolnego rozgałęzienia/przywracania używają tego skompaktowanego następcy; starsze pliki punktów kontrolnych sprzed Compaction pozostają możliwe do odczytu, dopóki istnieją do nich odwołania.

## Wymienni dostawcy Compaction

Pluginy rejestrują dostawcę Compaction za pośrednictwem `registerCompactionProvider()` w API pluginu. Gdy `agents.defaults.compaction.provider` jest ustawione na identyfikator zarejestrowanego dostawcy, rozszerzenie zabezpieczające deleguje podsumowywanie do tego dostawcy zamiast używać wbudowanego potoku `summarizeInStages`.

- `provider`: identyfikator zarejestrowanego pluginu dostawcy Compaction. Pozostaw bez ustawienia, aby używać domyślnego podsumowywania przez LLM. Ustawienie `provider` wymusza `mode: "safeguard"`.
- Dostawcy otrzymują te same instrukcje Compaction i zasady zachowywania identyfikatorów co ścieżka wbudowana, a zabezpieczenie nadal zachowuje po wyniku dostawcy kontekst ostatnich tur oraz końcowy kontekst podzielonej tury.
- Wbudowane podsumowywanie zabezpieczające ponownie destyluje wcześniejsze podsumowania wraz z nowymi wiadomościami, zamiast zachowywać dosłownie pełne poprzednie podsumowanie.
- Tryb zabezpieczający domyślnie włącza audyty jakości podsumowań; ustaw `qualityGuard.enabled: false`, aby pominąć ponawianie po otrzymaniu nieprawidłowo sformatowanego wyniku.
- Jeśli dostawca zawiedzie lub zwróci pusty wynik, OpenClaw automatycznie użyje wbudowanego podsumowywania przez LLM. Sygnały przerwania/przekroczenia limitu czasu jawnie wywołane przez kod wywołujący są ponownie zgłaszane, a nie pomijane, dzięki czemu anulowanie jest zawsze respektowane.

Źródło: `src/plugins/compaction-provider.ts`, `src/agents/agent-hooks/compaction-safeguard.ts`.

## Powierzchnie widoczne dla użytkownika

- `/status` w dowolnej sesji czatu
- `openclaw status` (CLI)
- `openclaw sessions` / `openclaw sessions --json`
- Logi Gateway (`pnpm gateway:watch` lub `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Tryb szczegółowy: `🧹 Auto-compaction complete` wraz z liczbą operacji Compaction

## Ciche prace porządkowe (`NO_REPLY`)

OpenClaw obsługuje „ciche” tury zadań w tle, w których użytkownik nie powinien widzieć wyników pośrednich.

- Asystent rozpoczyna swój wynik od dokładnego cichego tokenu `NO_REPLY` / `no_reply`, co oznacza „nie dostarczaj odpowiedzi użytkownikowi”. OpenClaw usuwa/pomija go w warstwie dostarczania.
- Pomijanie dokładnego cichego tokenu nie uwzględnia wielkości liter: zarówno `NO_REPLY`, jak i `no_reply` są rozpoznawane, gdy cały ładunek składa się wyłącznie z cichego tokenu.
- Od wersji `2026.1.10` OpenClaw pomija również strumieniowanie wersji roboczej/wskaźnika pisania, gdy częściowy fragment zaczyna się od `NO_REPLY`, dzięki czemu ciche operacje nie ujawniają częściowego wyniku w trakcie tury.
- Jest to przeznaczone wyłącznie do rzeczywistych tur działających w tle/bez dostarczania — nie jest to skrót dla zwykłych żądań użytkownika wymagających działania.

## Zapis pamięci przed Compaction

Przed automatycznym Compaction OpenClaw może uruchomić cichą turę agenta, która zapisuje trwały stan na dysku (na przykład `memory/YYYY-MM-DD.md` w przestrzeni roboczej agenta), aby Compaction nie mogło usunąć krytycznego kontekstu. Monitoruje wykorzystanie kontekstu sesji, a gdy przekroczy ono miękki próg poniżej progu Compaction, wysyła cichą dyrektywę „zapisz pamięć teraz”, używając dokładnego cichego tokenu `NO_REPLY` / `no_reply`, dzięki czemu użytkownik niczego nie widzi.

Konfiguracja (`agents.defaults.compaction.memoryFlush`), pełna dokumentacja w [/gateway/config-agents](/pl/gateway/config-agents#agentsdefaultscompaction):

| Klucz                       | Wartość domyślna | Uwagi                                                                                                                                  |
| --------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                   | `true`           |                                                                                                                                        |
| `model`                     | nieustawione      | dokładne nadpisanie dostawcy/modelu wyłącznie dla tury zapisu, na przykład `ollama/qwen3:8b`                                          |
| `softThresholdTokens`       | `4000`           | odstęp poniżej progu Compaction, który wyzwala zapis                                                                                    |
| `forceFlushTranscriptBytes` | nieustawione (wyłączone) | wymusza zapis, gdy plik transkrypcji osiągnie ten rozmiar w bajtach (lub ciąg taki jak `"2mb"`), nawet jeśli liczniki tokenów są nieaktualne; `0` wyłącza |
| `prompt`                    | wbudowana         | wiadomość użytkownika dla tury zapisu                                                                                                   |
| `systemPrompt`              | wbudowany         | dodatkowy prompt systemowy dołączany do tury zapisu                                                                                     |

Uwagi:

- Domyślny prompt/prompt systemowy zawiera wskazówkę `NO_REPLY`, która powoduje pominięcie dostarczania.
- Gdy ustawiono `model`, tura zapisu używa tego modelu bez dziedziczenia łańcucha modeli zapasowych aktywnej sesji, dzięki czemu lokalne prace porządkowe w przypadku awarii nie przełączają się po cichu na płatny model konwersacyjny.
- Zapis jest wykonywany raz na cykl Compaction (śledzony w wierszu sesji).
- Zapis jest wykonywany wyłącznie dla osadzonych sesji OpenClaw; backendy CLI i tury Heartbeat go pomijają.
- Zapis jest pomijany, gdy przestrzeń robocza sesji jest tylko do odczytu (`workspaceAccess: "ro"` lub `"none"`).
- Układ plików przestrzeni roboczej i wzorce zapisu opisano w sekcji [Pamięć](/pl/concepts/memory).

OpenClaw udostępnia punkt zaczepienia `session_before_compact` w API rozszerzeń, ale opisana powyżej logika zapisu znajduje się po stronie Gateway (`src/auto-reply/reply/memory-flush.ts`, `src/auto-reply/reply/agent-runner-memory.ts`), a nie w tym punkcie zaczepienia.

## Lista kontrolna rozwiązywania problemów

- **Nieprawidłowy klucz sesji?** Zacznij od [/concepts/session](/pl/concepts/session) i potwierdź `sessionKey` w `/status`.
- **Niezgodność magazynu z transkrypcją?** Potwierdź host Gateway oraz ścieżkę magazynu z `openclaw status`.
- **Nadmiernie częste Compaction?** Sprawdź okno kontekstu modelu (zbyt małe wymusza częste Compaction), `reserveTokens` (wartość zbyt wysoka dla okna modelu powoduje wcześniejsze Compaction) oraz nadmiarowe wyniki narzędzi (dostosuj przycinanie sesji).
- **Każdy prompt zdaje się przepełniać mały model lokalny?** Potwierdź, że dostawca zgłasza prawidłowe okno kontekstu modelu. OpenClaw może ograniczyć efektywną rezerwę tylko wtedy, gdy to okno jest znane.
- **Ciche tury ujawniają dane?** Potwierdź, że odpowiedź zaczyna się od dokładnego cichego tokenu `NO_REPLY` (bez uwzględniania wielkości liter) oraz że używana kompilacja zawiera poprawkę pomijania strumieniowania (`2026.1.10`+).

## Powiązane

- [Zarządzanie sesjami](/pl/concepts/session)
- [Przycinanie sesji](/pl/concepts/session-pruning)
- [Silnik kontekstu](/pl/concepts/context-engine)
- [Dokumentacja konfiguracji agenta](/pl/gateway/config-agents)
