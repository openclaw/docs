---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie testów regresji dla błędów modeli/dostawców
    - Debugowanie zachowania Gateway i agenta
summary: 'Zestaw testowy: pakiety testów unit/e2e/live, uruchamianie w Dockerze oraz zakres pokrycia poszczególnych testów'
title: Testowanie
x-i18n:
    generated_at: "2026-04-17T09:49:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55483bc68d3b24daca3189fba3af1e896f39b8e83068d102fed06eac05b36102
    source_path: help/testing.md
    workflow: 15
---

# Testowanie

OpenClaw ma trzy pakiety Vitest (unit/integration, e2e, live) oraz niewielki zestaw uruchomień w Dockerze.

Ten dokument jest przewodnikiem „jak testujemy”:

- Co obejmuje każdy pakiet (i czego celowo _nie_ obejmuje)
- Jakie polecenia uruchamiać w typowych przepływach pracy (lokalnie, przed wypchnięciem, debugowanie)
- Jak testy live wykrywają poświadczenia oraz wybierają modele/dostawców
- Jak dodawać testy regresji dla rzeczywistych problemów z modelami/dostawcami

## Szybki start

Na co dzień:

- Pełna bramka (oczekiwana przed wypchnięciem): `pnpm build && pnpm check && pnpm test`
- Szybsze lokalne uruchomienie pełnego pakietu na wydajnej maszynie: `pnpm test:max`
- Bezpośrednia pętla obserwacji Vitest: `pnpm test:watch`
- Bezpośrednie wskazywanie plików obsługuje teraz także ścieżki rozszerzeń/kanałów: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Gdy pracujesz nad pojedynczym błędem, najpierw wybieraj uruchomienia ukierunkowane.
- Witryna QA oparta na Dockerze: `pnpm qa:lab:up`
- Ścieżka QA oparta na maszynie wirtualnej Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy modyfikujesz testy lub chcesz mieć większą pewność:

- Bramka pokrycia: `pnpm test:coverage`
- Pakiet E2E: `pnpm test:e2e`

Podczas debugowania rzeczywistych dostawców/modeli (wymaga prawdziwych poświadczeń):

- Pakiet live (modele + sondy narzędzi/obrazów Gateway): `pnpm test:live`
- Ciche uruchomienie jednego pliku live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Wskazówka: gdy potrzebujesz tylko jednego błędnego przypadku, zawężaj testy live za pomocą zmiennych środowiskowych allowlist opisanych poniżej.

## Uruchomienia specyficzne dla QA

Te polecenia działają obok głównych pakietów testów, gdy potrzebujesz realizmu QA-lab:

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze QA oparte na repozytorium bezpośrednio na hoście.
  - Domyślnie uruchamia wiele wybranych scenariuszy równolegle z izolowanymi workerami Gateway, do 64 workerów lub liczby wybranych scenariuszy. Użyj `--concurrency <count>`, aby dostroić liczbę workerów, albo `--concurrency 1` dla starszej ścieżki sekwencyjnej.
  - Obsługuje tryby dostawców `live-frontier`, `mock-openai` i `aimock`.
    `aimock` uruchamia lokalny serwer dostawcy oparty na AIMock dla eksperymentalnego pokrycia fixture i mocków protokołu bez zastępowania świadomej scenariuszy ścieżki `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam pakiet QA wewnątrz tymczasowej maszyny wirtualnej Linux Multipass.
  - Zachowuje takie samo zachowanie wyboru scenariuszy jak `qa suite` na hoście.
  - Używa tych samych flag wyboru dostawcy/modelu co `qa suite`.
  - Uruchomienia live przekazują do gościa obsługiwane wejścia uwierzytelniania QA, które są praktyczne:
    klucze dostawców oparte na env, ścieżkę konfiguracji dostawcy live QA oraz `CODEX_HOME`, jeśli jest obecne.
  - Katalogi wyjściowe muszą pozostać pod katalogiem głównym repozytorium, aby gość mógł zapisywać dane zwrotnie przez zamontowany obszar roboczy.
  - Zapisuje standardowy raport i podsumowanie QA oraz logi Multipass w
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia witrynę QA opartą na Dockerze do operatorskiej pracy QA.
- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer dostawcy AIMock do bezpośrednich testów smoke protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia ścieżkę QA Matrix live na jednorazowym homeserverze Tuwunel opartym na Dockerze.
  - Ten host QA jest obecnie przeznaczony wyłącznie do repozytorium/developmentu. Spakowane instalacje OpenClaw nie dostarczają `qa-lab`, więc nie udostępniają `openclaw qa`.
  - Kopie repozytorium ładują dołączony runner bezpośrednio; nie jest potrzebny osobny krok instalacji Plugin.
  - Tworzy trzech tymczasowych użytkowników Matrix (`driver`, `sut`, `observer`) oraz jeden prywatny pokój, a następnie uruchamia podrzędny proces QA Gateway z rzeczywistym Plugin Matrix jako transportem SUT.
  - Domyślnie używa przypiętego stabilnego obrazu Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Nadpisz za pomocą `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, gdy chcesz przetestować inny obraz.
  - Matrix nie udostępnia współdzielonych flag źródła poświadczeń, ponieważ ta ścieżka lokalnie tworzy tymczasowych użytkowników.
  - Zapisuje raport QA Matrix, podsumowanie, artefakt obserwowanych zdarzeń oraz połączony log wyjścia stdout/stderr w `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Uruchamia ścieżkę QA Telegram live na rzeczywistej prywatnej grupie przy użyciu tokenów bota driver i SUT z env.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` oraz `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Identyfikator grupy musi być numerycznym identyfikatorem czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych, pulowanych poświadczeń. Domyślnie używaj trybu env albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby włączyć pulowane dzierżawy.
  - Wymaga dwóch odrębnych botów w tej samej prywatnej grupie, przy czym bot SUT musi udostępniać nazwę użytkownika Telegram.
  - Aby uzyskać stabilną obserwację bot-do-bota, włącz Bot-to-Bot Communication Mode w `@BotFather` dla obu botów i upewnij się, że bot driver może obserwować ruch botów w grupie.
  - Zapisuje raport QA Telegram, podsumowanie oraz artefakt obserwowanych wiadomości w `.artifacts/qa-e2e/...`.

Ścieżki transportu live współdzielą jeden standardowy kontrakt, aby nowe transporty nie rozchodziły się funkcjonalnie:

`qa-channel` pozostaje szerokim, syntetycznym pakietem QA i nie jest częścią macierzy pokrycia transportu live.

| Ścieżka | Canary | Ograniczanie wzmianek | Blokada allowlist | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Dalszy ciąg wątku | Izolacja wątku | Obserwacja reakcji | Polecenie pomocy |
| ------- | ------ | --------------------- | ----------------- | ----------------------------- | ----------------------- | ----------------- | -------------- | ------------------ | ---------------- |
| Matrix  | x      | x                     | x                 | x                             | x                       | x                 | x              | x                  |                  |
| Telegram | x     |                       |                   |                               |                         |                   |                |                    | x                |

### Współdzielone poświadczenia Telegram przez Convex (v1)

Gdy dla `openclaw qa telegram` włączone jest `--credential-source convex` (lub `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`), QA lab pobiera wyłączną dzierżawę z puli opartej na Convex, wysyła Heartbeat tej dzierżawy podczas działania ścieżki i zwalnia dzierżawę przy zamknięciu.

Referencyjny szablon projektu Convex:

- `qa/convex-credential-broker/`

Wymagane zmienne środowiskowe:

- `OPENCLAW_QA_CONVEX_SITE_URL` (na przykład `https://your-deployment.convex.site`)
- Jeden sekret dla wybranej roli:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` dla `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` dla `ci`
- Wybór roli poświadczeń:
  - CLI: `--credential-role maintainer|ci`
  - Domyślne z env: `OPENCLAW_QA_CREDENTIAL_ROLE` (domyślnie `maintainer`)

Opcjonalne zmienne środowiskowe:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (domyślnie `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (domyślnie `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (domyślnie `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (domyślnie `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (domyślnie `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (opcjonalny identyfikator śledzenia)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` zezwala na adresy URL Convex `http://` dla loopback tylko do lokalnego developmentu.

`OPENCLAW_QA_CONVEX_SITE_URL` powinno w normalnym użyciu korzystać z `https://`.

Administracyjne polecenia maintainera (dodawanie/usuwanie/listowanie puli) wymagają konkretnie
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocnicze polecenia CLI dla maintainerów:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Użyj `--json`, aby uzyskać dane wyjściowe czytelne maszynowo w skryptach i narzędziach CI.

Domyślny kontrakt endpointu (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Żądanie: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sukces: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Wyczerpane/nadające się do ponowienia: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Żądanie: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Sukces: `{ status: "ok" }` (lub puste `2xx`)
- `POST /release`
  - Żądanie: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Sukces: `{ status: "ok" }` (lub puste `2xx`)
- `POST /admin/add` (tylko sekret maintainera)
  - Żądanie: `{ kind, actorId, payload, note?, status? }`
  - Sukces: `{ status: "ok", credential }`
- `POST /admin/remove` (tylko sekret maintainera)
  - Żądanie: `{ credentialId, actorId }`
  - Sukces: `{ status: "ok", changed, credential }`
  - Ochrona aktywnej dzierżawy: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (tylko sekret maintainera)
  - Żądanie: `{ kind?, status?, includePayload?, limit? }`
  - Sukces: `{ status: "ok", credentials, count }`

Kształt payloadu dla rodzaju Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` musi być ciągiem będącym numerycznym identyfikatorem czatu Telegram.
- `admin/add` weryfikuje ten kształt dla `kind: "telegram"` i odrzuca nieprawidłowy payload.

### Dodawanie kanału do QA

Dodanie kanału do systemu QA w Markdown wymaga dokładnie dwóch rzeczy:

1. Adaptera transportu dla kanału.
2. Pakietu scenariuszy, który sprawdza kontrakt kanału.

Nie dodawaj nowego głównego korzenia poleceń QA, gdy współdzielony host `qa-lab` może obsłużyć ten przepływ.

`qa-lab` odpowiada za współdzieloną mechanikę hosta:

- korzeń poleceń `openclaw qa`
- uruchamianie i kończenie pakietu
- współbieżność workerów
- zapisywanie artefaktów
- generowanie raportów
- wykonywanie scenariuszy
- aliasy zgodności dla starszych scenariuszy `qa-channel`

Pluginy runnerów odpowiadają za kontrakt transportu:

- jak `openclaw qa <runner>` jest montowane pod współdzielonym korzeniem `qa`
- jak Gateway jest konfigurowany dla tego transportu
- jak sprawdzana jest gotowość
- jak wstrzykiwane są zdarzenia przychodzące
- jak obserwowane są wiadomości wychodzące
- jak udostępniane są transkrypcje i znormalizowany stan transportu
- jak wykonywane są działania oparte na transporcie
- jak obsługiwany jest reset lub czyszczenie specyficzne dla transportu

Minimalny próg wdrożenia dla nowego kanału to:

1. Zachowanie `qa-lab` jako właściciela współdzielonego korzenia `qa`.
2. Implementacja runnera transportu na współdzielonym styku hosta `qa-lab`.
3. Zachowanie mechanik specyficznych dla transportu wewnątrz Plugin runnera lub harnessu Plugin.
4. Montowanie runnera jako `openclaw qa <runner>` zamiast rejestrowania konkurencyjnego korzenia poleceń.
   Pluginy runnerów powinny deklarować `qaRunners` w `openclaw.plugin.json` i eksportować pasującą tablicę `qaRunnerCliRegistrations` z `runtime-api.ts`.
   Zachowuj lekkość `runtime-api.ts`; leniwe wykonanie CLI i runnera powinno pozostać za oddzielnymi punktami wejścia.
5. Tworzenie lub adaptację scenariuszy Markdown w `qa/scenarios/`.
6. Używanie generycznych helperów scenariuszy dla nowych scenariuszy.
7. Zachowanie istniejących aliasów zgodności, chyba że repozytorium przeprowadza zamierzoną migrację.

Reguła decyzyjna jest ścisła:

- Jeśli zachowanie można wyrazić raz w `qa-lab`, umieść je w `qa-lab`.
- Jeśli zachowanie zależy od transportu jednego kanału, pozostaw je w tym Plugin runnera lub harnessie Plugin.
- Jeśli scenariusz potrzebuje nowej możliwości, z której może skorzystać więcej niż jeden kanał, dodaj generyczny helper zamiast gałęzi specyficznej dla kanału w `suite.ts`.
- Jeśli zachowanie ma znaczenie tylko dla jednego transportu, zachowaj scenariusz jako specyficzny dla transportu i jasno zaznacz to w kontrakcie scenariusza.

Preferowane nazwy generycznych helperów dla nowych scenariuszy to:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Aliasy zgodności pozostają dostępne dla istniejących scenariuszy, w tym:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Nowe prace nad kanałami powinny używać generycznych nazw helperów.
Aliasy zgodności istnieją po to, aby uniknąć migracji typu flag day, a nie jako model
dla tworzenia nowych scenariuszy.

## Pakiety testów (co uruchamia się gdzie)

Myśl o tych pakietach jako o „rosnącym realizmie” (oraz rosnącej zawodności/koszcie):

### Unit / integration (domyślnie)

- Polecenie: `pnpm test`
- Konfiguracja: dziesięć sekwencyjnych shardów (`vitest.full-*.config.ts`) uruchamianych na istniejących zakresowych projektach Vitest
- Pliki: inwentarze core/unit w `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` oraz dopuszczone dozwoloną listą testy node w `ui` objęte przez `vitest.unit.config.ts`
- Zakres:
  - Czyste testy unit
  - Testy integracyjne w procesie (uwierzytelnianie Gateway, routing, narzędzia, parsowanie, konfiguracja)
  - Deterministyczne regresje dla znanych błędów
- Oczekiwania:
  - Uruchamiane w CI
  - Nie wymagają prawdziwych kluczy
  - Powinny być szybkie i stabilne
- Uwaga o projektach:
  - Niekierowane `pnpm test` uruchamia teraz jedenaście mniejszych konfiguracji shardów (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego ogromnego natywnego procesu root-project. Zmniejsza to szczytowe RSS na obciążonych maszynach i zapobiega zagładzaniu niezwiązanych pakietów przez pracę `auto-reply`/rozszerzeń.
  - `pnpm test --watch` nadal używa natywnego grafu projektów root z `vitest.config.ts`, ponieważ pętla watch z wieloma shardami nie jest praktyczna.
  - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` najpierw kierują jawne cele plików/katalogów przez zakresowe ścieżki, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` nie płaci kosztu uruchomienia pełnego projektu root.
  - `pnpm test:changed` rozwija zmienione ścieżki git do tych samych zakresowych ścieżek, gdy diff dotyka wyłącznie routowalnych plików źródłowych/testowych; edycje konfiguracji/ustawień nadal wracają do szerokiego ponownego uruchomienia projektu root.
  - Lekkie importowo testy unit z obszarów agents, commands, plugins, helperów `auto-reply`, `plugin-sdk` i podobnych czysto użytkowych części są kierowane przez ścieżkę `unit-fast`, która pomija `test/setup-openclaw-runtime.ts`; pliki stanowe/ciężkie runtime pozostają na istniejących ścieżkach.
  - Wybrane pliki źródłowe helperów `plugin-sdk` i `commands` również mapują uruchomienia w trybie changed na jawne testy sąsiednie w tych lekkich ścieżkach, dzięki czemu edycje helperów nie wymuszają ponownego uruchomienia pełnego ciężkiego pakietu dla tego katalogu.
  - `auto-reply` ma teraz trzy dedykowane koszyki: pomocniki core najwyższego poziomu, testy integracyjne najwyższego poziomu `reply.*` oraz poddrzewo `src/auto-reply/reply/**`. Dzięki temu najcięższa praca harnessu odpowiedzi nie trafia do tanich testów status/chunk/token.
- Uwaga o osadzonym runnerze:
  - Gdy zmieniasz wejścia wykrywania message-tool lub kontekst runtime Compaction,
    zachowaj oba poziomy pokrycia.
  - Dodawaj ukierunkowane regresje helperów dla czystych granic routingu/normalizacji.
  - Utrzymuj również w dobrej kondycji pakiety integracyjne osadzonego runnera:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` oraz
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Te pakiety weryfikują, że zakresowe identyfikatory i zachowanie Compaction nadal przechodzą
    przez rzeczywiste ścieżki `run.ts` / `compact.ts`; testy tylko helperów nie są
    wystarczającym zamiennikiem dla tych ścieżek integracyjnych.
- Uwaga o puli:
  - Bazowa konfiguracja Vitest domyślnie używa teraz `threads`.
  - Współdzielona konfiguracja Vitest ustawia także `isolate: false` i używa nieizolowanego runnera w projektach root, konfiguracjach e2e i live.
  - Główna ścieżka UI zachowuje konfigurację `jsdom` i optymalizator, ale teraz również działa na współdzielonym nieizolowanym runnerze.
  - Każdy shard `pnpm test` dziedziczy te same domyślne ustawienia `threads` + `isolate: false` ze współdzielonej konfiguracji Vitest.
  - Współdzielony launcher `scripts/run-vitest.mjs` domyślnie dodaje teraz także `--no-maglev` dla podrzędnych procesów Node Vitest, aby ograniczyć churn kompilacji V8 podczas dużych lokalnych uruchomień. Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, jeśli chcesz porównać działanie ze standardowym zachowaniem V8.
- Uwaga o szybkiej lokalnej iteracji:
  - `pnpm test:changed` kieruje przez zakresowe ścieżki, gdy zmienione ścieżki da się jednoznacznie odwzorować na mniejszy pakiet.
  - `pnpm test:max` i `pnpm test:changed:max` zachowują to samo zachowanie routingu, tylko z wyższym limitem workerów.
  - Automatyczne skalowanie lokalnych workerów jest teraz celowo bardziej zachowawcze i dodatkowo wycofuje się, gdy średnie obciążenie hosta jest już wysokie, dzięki czemu wiele równoczesnych uruchomień Vitest domyślnie wyrządza mniej szkód.
  - Bazowa konfiguracja Vitest oznacza projekty/pliki konfiguracyjne jako `forceRerunTriggers`, aby ponowne uruchomienia w trybie changed pozostawały poprawne przy zmianach okablowania testów.
  - Konfiguracja utrzymuje włączone `OPENCLAW_VITEST_FS_MODULE_CACHE` na obsługiwanych hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz mieć jedną jawną lokalizację cache do bezpośredniego profilowania.
- Uwaga o debugowaniu wydajności:
  - `pnpm test:perf:imports` włącza raportowanie czasu importu Vitest wraz z danymi wyjściowymi podziału importów.
  - `pnpm test:perf:imports:changed` zawęża ten sam widok profilowania do plików zmienionych od `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje kierowane `test:changed` z natywną ścieżką projektu root dla tego zatwierdzonego diffu i wypisuje czas ścienny oraz maksymalne RSS w macOS.
- `pnpm test:perf:changed:bench -- --worktree` wykonuje benchmark bieżącego brudnego drzewa, kierując listę zmienionych plików przez `scripts/test-projects.mjs` i główną konfigurację Vitest.
  - `pnpm test:perf:profile:main` zapisuje profil CPU głównego wątku dla narzutu uruchamiania i transformacji Vitest/Vite.
  - `pnpm test:perf:profile:runner` zapisuje profile CPU+heap runnera dla pakietu unit przy wyłączonej równoległości plików.

### E2E (smoke Gateway)

- Polecenie: `pnpm test:e2e`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Domyślne ustawienia runtime:
  - Używa Vitest `threads` z `isolate: false`, zgodnie z resztą repozytorium.
  - Używa adaptacyjnej liczby workerów (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie silent, aby ograniczyć narzut I/O konsoli.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>`, aby wymusić liczbę workerów (limit 16).
  - `OPENCLAW_E2E_VERBOSE=1`, aby ponownie włączyć szczegółowe dane wyjściowe konsoli.
- Zakres:
  - Zachowanie end-to-end wielu instancji Gateway
  - Powierzchnie WebSocket/HTTP, parowanie Node i cięższa komunikacja sieciowa
- Oczekiwania:
  - Uruchamiane w CI (gdy są włączone w pipeline)
  - Nie wymagają prawdziwych kluczy
  - Mają więcej ruchomych części niż testy unit (mogą być wolniejsze)

### E2E: smoke backendu OpenShell

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `test/openshell-sandbox.e2e.test.ts`
- Zakres:
  - Uruchamia izolowany Gateway OpenShell na hoście przez Docker
  - Tworzy sandbox z tymczasowego lokalnego Dockerfile
  - Ćwiczy backend OpenShell OpenClaw przez rzeczywiste `sandbox ssh-config` + wykonanie SSH
  - Weryfikuje zdalne kanoniczne zachowanie systemu plików przez most fs sandboxa
- Oczekiwania:
  - Wyłącznie opt-in; nie jest częścią domyślnego uruchomienia `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` oraz działającego demona Docker
  - Używa izolowanych `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy testowy Gateway i sandbox
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1`, aby włączyć test przy ręcznym uruchamianiu szerszego pakietu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, aby wskazać niestandardowy binarny plik CLI lub skrypt wrappera

### Live (rzeczywiści dostawcy + rzeczywiste modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten dostawca/model rzeczywiście działa _dzisiaj_ z prawdziwymi poświadczeniami?”
  - Wychwytywanie zmian formatu dostawcy, niuansów wywoływania narzędzi, problemów z uwierzytelnianiem i zachowania limitów szybkości
- Oczekiwania:
  - Celowo niestabilne w CI (rzeczywiste sieci, rzeczywiste polityki dostawców, limity, awarie)
  - Kosztują pieniądze / zużywają limity szybkości
  - Lepiej uruchamiać zawężone podzbiory niż „wszystko”
- Uruchomienia live pobierają `~/.profile`, aby uzupełnić brakujące klucze API.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują materiał konfiguracyjny/uwierzytelniający do tymczasowego testowego katalogu domowego, aby fixture unit nie mogły modyfikować Twojego prawdziwego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo chcesz, aby testy live używały Twojego rzeczywistego katalogu domowego.
- `pnpm test:live` domyślnie działa teraz ciszej: zachowuje dane wyjściowe postępu `[live] ...`, ale ukrywa dodatkowy komunikat `~/.profile` i wycisza logi bootstrapu Gateway/komunikaty Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz ponownie zobaczyć pełne logi startowe.
- Rotacja kluczy API (specyficzna dla dostawcy): ustaw `*_API_KEYS` w formacie rozdzielanym przecinkami/średnikami lub `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) albo nadpisanie per-live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają próbę przy odpowiedziach z limitem szybkości.
- Dane wyjściowe postępu/Heartbeat:
  - Pakiety live emitują teraz linie postępu do stderr, więc długie wywołania dostawców pozostają widocznie aktywne nawet wtedy, gdy przechwytywanie konsoli Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli Vitest, aby linie postępu dostawców/Gateway były strumieniowane natychmiast podczas uruchomień live.
  - Dostosuj Heartbeat bezpośrednich modeli za pomocą `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostosuj Heartbeat Gateway/sond za pomocą `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który pakiet powinienem uruchomić?

Użyj tej tabeli decyzyjnej:

- Edycja logiki/testów: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli zmieniłeś dużo)
- Modyfikacje sieci Gateway / protokołu WS / parowania: dodaj `pnpm test:e2e`
- Debugowanie „mój bot nie działa” / awarii specyficznych dla dostawcy / wywoływania narzędzi: uruchom zawężone `pnpm test:live`

## Live: przegląd możliwości Node Android

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skrypt: `pnpm android:test:integration`
- Cel: wywołać **każde polecenie aktualnie ogłaszane** przez połączony Node Android i sprawdzić zachowanie kontraktu polecenia.
- Zakres:
  - Wstępnie przygotowana/ręczna konfiguracja (pakiet nie instaluje, nie uruchamia ani nie paruje aplikacji).
  - Walidacja `node.invoke` Gateway polecenie po poleceniu dla wybranego Node Android.
- Wymagana wstępna konfiguracja:
  - Aplikacja Android jest już połączona i sparowana z Gateway.
  - Aplikacja pozostaje na pierwszym planie.
  - Uprawnienia/zgody na przechwytywanie są przyznane dla możliwości, które mają przejść.
- Opcjonalne nadpisania celu:
  - `OPENCLAW_ANDROID_NODE_ID` lub `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Pełne szczegóły konfiguracji Android: [Aplikacja Android](/pl/platforms/android)

## Live: smoke modeli (klucze profili)

Testy live są podzielone na dwie warstwy, aby można było izolować awarie:

- „Direct model” mówi nam, czy dostawca/model w ogóle potrafi odpowiedzieć przy danym kluczu.
- „Gateway smoke” mówi nam, czy pełny pipeline gateway+agent działa dla tego modelu (sesje, historia, narzędzia, polityka sandboxa itd.).

### Warstwa 1: bezpośrednie completion modelu (bez Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Cel:
  - Wyliczyć wykryte modele
  - Użyć `getApiKeyForModel` do wyboru modeli, dla których masz poświadczenia
  - Wykonać małe completion dla każdego modelu (oraz ukierunkowane regresje tam, gdzie to potrzebne)
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli uruchamiasz Vitest bezpośrednio)
- Ustaw `OPENCLAW_LIVE_MODELS=modern` (lub `all`, alias dla modern), aby rzeczywiście uruchomić ten pakiet; w przeciwnym razie zostanie pominięty, aby `pnpm test:live` pozostawało skupione na smoke Gateway
- Jak wybierać modele:
  - `OPENCLAW_LIVE_MODELS=modern`, aby uruchomić nowoczesną allowlist (`Opus/Sonnet 4.6+`, `GPT-5.x + Codex`, `Gemini 3`, `GLM 4.7`, `MiniMax M2.7`, `Grok 4`)
  - `OPENCLAW_LIVE_MODELS=all` jest aliasem dla nowoczesnej allowlist
  - albo `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist rozdzielana przecinkami)
  - Przeglądy modern/all domyślnie używają dobranego limitu o wysokim sygnale; ustaw `OPENCLAW_LIVE_MAX_MODELS=0` dla wyczerpującego przeglądu modern albo liczbę dodatnią dla mniejszego limitu.
- Jak wybierać dostawców:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist rozdzielana przecinkami)
- Skąd pochodzą klucze:
  - Domyślnie: magazyn profili i zapasowe wartości env
  - Ustaw `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić wyłącznie **magazyn profili**
- Dlaczego to istnieje:
  - Oddziela „API dostawcy jest uszkodzone / klucz jest nieprawidłowy” od „pipeline agenta Gateway jest uszkodzony”
  - Zawiera małe, izolowane regresje (przykład: odtwarzanie reasoning replay + przepływy tool-call dla OpenAI Responses/Codex Responses)

### Warstwa 2: smoke Gateway + agenta dev (to, co faktycznie robi „@openclaw”)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Cel:
  - Uruchomić Gateway w procesie
  - Utworzyć/załatać sesję `agent:dev:*` (nadpisanie modelu dla każdego uruchomienia)
  - Iterować po modelach-z-kluczami i sprawdzać:
    - „znaczącą” odpowiedź (bez narzędzi)
    - działanie rzeczywistego wywołania narzędzia (sonda odczytu)
    - opcjonalne dodatkowe sondy narzędzi (sonda exec+read)
    - dalsze działanie ścieżek regresji OpenAI (tylko tool-call → follow-up)
- Szczegóły sond (aby dało się szybko wyjaśniać błędy):
  - sonda `read`: test zapisuje plik nonce w obszarze roboczym i prosi agenta, aby go `read` oraz zwrócił nonce.
  - sonda `exec+read`: test prosi agenta, aby zapisał nonce do pliku tymczasowego przez `exec`, a następnie odczytał go z powrotem przez `read`.
  - sonda obrazu: test dołącza wygenerowany PNG (kot + zrandomizowany kod) i oczekuje, że model zwróci `cat <CODE>`.
  - Referencja implementacji: `src/gateway/gateway-models.profiles.live.test.ts` oraz `src/gateway/live-image-probe.ts`.
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli uruchamiasz Vitest bezpośrednio)
- Jak wybierać modele:
  - Domyślnie: nowoczesna allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` jest aliasem dla nowoczesnej allowlist
  - Albo ustaw `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (lub listę rozdzielaną przecinkami), aby zawęzić wybór
  - Przeglądy gateway modern/all domyślnie używają dobranego limitu o wysokim sygnale; ustaw `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` dla wyczerpującego przeglądu modern albo liczbę dodatnią dla mniejszego limitu.
- Jak wybierać dostawców (unikaj „całego OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist rozdzielana przecinkami)
- Sondy narzędzi i obrazu są w tym teście live zawsze włączone:
  - sonda `read` + sonda `exec+read` (obciążenie narzędzi)
  - sonda obrazu uruchamia się, gdy model deklaruje obsługę wejścia obrazu
  - Przepływ (wysoki poziom):
    - Test generuje mały PNG z „CAT” + losowym kodem (`src/gateway/live-image-probe.ts`)
    - Wysyła go przez `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parsuje załączniki do `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Osadzony agent przekazuje do modelu multimodalną wiadomość użytkownika
    - Asercja: odpowiedź zawiera `cat` + kod (tolerancja OCR: dopuszczalne są drobne pomyłki)

Wskazówka: aby zobaczyć, co możesz testować na swojej maszynie (oraz dokładne identyfikatory `provider/model`), uruchom:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke backendu CLI (Claude, Codex, Gemini lub inne lokalne CLI)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Cel: zweryfikować pipeline Gateway + agenta przy użyciu lokalnego backendu CLI, bez naruszania domyślnej konfiguracji.
- Domyślne ustawienia smoke specyficzne dla backendu znajdują się w definicji `cli-backend.ts` należącej do odpowiedniego rozszerzenia.
- Włączenie:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli uruchamiasz Vitest bezpośrednio)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Domyślne ustawienia:
  - Domyślny dostawca/model: `claude-cli/claude-sonnet-4-6`
  - Zachowanie komendy/argumentów/obrazu pochodzi z metadanych Plugin właściciela backendu CLI.
- Nadpisania (opcjonalne):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, aby wysłać rzeczywisty załącznik obrazu (ścieżki są wstrzykiwane do promptu).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, aby przekazywać ścieżki plików obrazu jako argumenty CLI zamiast przez wstrzykiwanie do promptu.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (lub `"list"`), aby sterować sposobem przekazywania argumentów obrazu, gdy ustawione jest `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, aby wysłać drugą turę i zweryfikować przepływ wznowienia.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, aby wyłączyć domyślną sondę ciągłości tej samej sesji Claude Sonnet -> Opus (ustaw `1`, aby wymusić jej włączenie, gdy wybrany model obsługuje cel przełączenia).

Przykład:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Recepta Docker:

```bash
pnpm test:docker:live-cli-backend
```

Recepty Docker dla pojedynczego dostawcy:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Uwagi:

- Runner Docker znajduje się w `scripts/test-live-cli-backend-docker.sh`.
- Uruchamia smoke live backendu CLI wewnątrz obrazu Docker repozytorium jako nieuprzywilejowany użytkownik `node`.
- Rozpoznaje metadane smoke CLI od rozszerzenia właściciela, a następnie instaluje pasujący pakiet Linux CLI (`@anthropic-ai/claude-code`, `@openai/codex` lub `@google/gemini-cli`) do buforowanego zapisywalnego prefiksu pod `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (domyślnie: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` wymaga przenośnego OAuth subskrypcji Claude Code przez `~/.claude/.credentials.json` z `claudeAiOauth.subscriptionType` albo `CLAUDE_CODE_OAUTH_TOKEN` z `claude setup-token`. Najpierw potwierdza bezpośrednie `claude -p` w Dockerze, a następnie uruchamia dwie tury Gateway backendu CLI bez zachowywania zmiennych środowiskowych klucza API Anthropic. Ta ścieżka subskrypcji domyślnie wyłącza sondy MCP/tool i obrazu Claude, ponieważ Claude obecnie rozlicza użycie aplikacji firm trzecich przez billing dodatkowego użycia zamiast zwykłych limitów planu subskrypcyjnego.
- Smoke live backendu CLI ćwiczy teraz ten sam przepływ end-to-end dla Claude, Codex i Gemini: tura tekstowa, tura klasyfikacji obrazu, a następnie wywołanie narzędzia MCP `cron` zweryfikowane przez CLI Gateway.
- Domyślny smoke Claude dodatkowo łata sesję z Sonnet do Opus i weryfikuje, że wznowiona sesja nadal pamięta wcześniejszą notatkę.

## Live: smoke powiązania ACP (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Cel: zweryfikować rzeczywisty przepływ conversation-bind ACP z żywym agentem ACP:
  - wysłać `/acp spawn <agent> --bind here`
  - powiązać syntetyczną konwersację kanału wiadomości w miejscu
  - wysłać zwykły follow-up w tej samej konwersacji
  - zweryfikować, że follow-up trafia do transkryptu powiązanej sesji ACP
- Włączenie:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Domyślne ustawienia:
  - Agenci ACP w Dockerze: `claude,codex,gemini`
  - Agent ACP dla bezpośredniego `pnpm test:live ...`: `claude`
  - Syntetyczny kanał: kontekst konwersacji w stylu Slack DM
  - Backend ACP: `acpx`
- Nadpisania:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Uwagi:
  - Ta ścieżka używa powierzchni `chat.send` Gateway z polami synthetic originating-route dostępnymi tylko dla administratora, aby testy mogły dołączać kontekst kanału wiadomości bez udawania zewnętrznego dostarczenia.
  - Gdy `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nie jest ustawione, test używa wbudowanego rejestru agentów Plugin `acpx` dla wybranego agenta harness ACP.

Przykład:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Recepta Docker:

```bash
pnpm test:docker:live-acp-bind
```

Recepty Docker dla pojedynczego agenta:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Uwagi dotyczące Dockera:

- Runner Docker znajduje się w `scripts/test-live-acp-bind-docker.sh`.
- Domyślnie uruchamia smoke ACP bind kolejno dla wszystkich obsługiwanych żywych agentów CLI: `claude`, `codex`, a następnie `gemini`.
- Użyj `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` lub `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, aby zawęzić macierz.
- Pobiera `~/.profile`, przygotowuje pasujący materiał uwierzytelniający CLI do kontenera, instaluje `acpx` do zapisywalnego prefiksu npm, a następnie instaluje żądane żywe CLI (`@anthropic-ai/claude-code`, `@openai/codex` lub `@google/gemini-cli`), jeśli go brakuje.
- Wewnątrz Dockera runner ustawia `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, aby acpx zachowywał zmienne środowiskowe dostawcy z pobranego profilu dostępne dla podrzędnego CLI harnessu.

## Live: smoke harnessu serwera aplikacji Codex

- Cel: zweryfikować należący do Plugin harness Codex przez zwykłą metodę
  `agent` Gateway:
  - załadować dołączony Plugin `codex`
  - wybrać `OPENCLAW_AGENT_RUNTIME=codex`
  - wysłać pierwszą turę Gateway agent do `codex/gpt-5.4`
  - wysłać drugą turę do tej samej sesji OpenClaw i zweryfikować, że wątek
    serwera aplikacji może zostać wznowiony
  - uruchomić `/codex status` oraz `/codex models` przez tę samą ścieżkę
    poleceń Gateway
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model domyślny: `codex/gpt-5.4`
- Opcjonalna sonda obrazu: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Opcjonalna sonda MCP/tool: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Smoke ustawia `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, aby uszkodzony harness Codex
  nie mógł przejść testu przez cichy fallback do PI.
- Uwierzytelnianie: `OPENAI_API_KEY` z powłoki/profilu oraz opcjonalnie skopiowane
  `~/.codex/auth.json` i `~/.codex/config.toml`

Recepta lokalna:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Recepta Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Uwagi dotyczące Dockera:

- Runner Docker znajduje się w `scripts/test-live-codex-harness-docker.sh`.
- Pobiera zamontowany `~/.profile`, przekazuje `OPENAI_API_KEY`, kopiuje pliki
  uwierzytelniające CLI Codex, jeśli są obecne, instaluje `@openai/codex` do zapisywalnego zamontowanego prefiksu npm,
  przygotowuje drzewo źródłowe, a następnie uruchamia tylko test live harnessu Codex.
- Docker domyślnie włącza sondy obrazu oraz MCP/tool. Ustaw
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` lub
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`, gdy potrzebujesz węższego uruchomienia debugowego.
- Docker eksportuje także `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, zgodnie z konfiguracją testu live,
  tak aby fallback `openai-codex/*` lub PI nie mógł ukryć regresji harnessu Codex.

### Zalecane recepty live

Wąskie, jawne allowlist są najszybsze i najmniej zawodne:

- Pojedynczy model, bezpośrednio (bez Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Pojedynczy model, smoke Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Wywoływanie narzędzi u kilku dostawców:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Ukierunkowanie na Google (klucz API Gemini + Antigravity):
  - Gemini (klucz API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Uwagi:

- `google/...` używa API Gemini (klucz API).
- `google-antigravity/...` używa mostu OAuth Antigravity (endpoint agenta w stylu Cloud Code Assist).
- `google-gemini-cli/...` używa lokalnego CLI Gemini na Twojej maszynie (osobne uwierzytelnianie + niuanse narzędzi).
- Gemini API vs Gemini CLI:
  - API: OpenClaw wywołuje hostowane API Gemini Google przez HTTP (uwierzytelnianie kluczem API / profilem); to właśnie większość użytkowników ma na myśli, mówiąc „Gemini”.
  - CLI: OpenClaw wywołuje lokalny binarny plik `gemini`; ma własne uwierzytelnianie i może zachowywać się inaczej (streaming/obsługa narzędzi/rozjazd wersji).

## Live: macierz modeli (co obejmujemy)

Nie ma stałej „listy modeli CI” (live jest opt-in), ale to są **zalecane** modele do regularnego pokrywania na maszynie deweloperskiej z kluczami.

### Nowoczesny zestaw smoke (wywoływanie narzędzi + obraz)

To jest uruchomienie „typowych modeli”, które powinno pozostawać sprawne:

- OpenAI (bez Codex): `openai/gpt-5.4` (opcjonalnie: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` i `google/gemini-3-flash-preview` (unikaj starszych modeli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` i `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Uruchom smoke Gateway z narzędziami + obrazem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: wywoływanie narzędzi (Read + opcjonalnie Exec)

Wybierz co najmniej jeden model z każdej rodziny dostawców:

- OpenAI: `openai/gpt-5.4` (lub `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (lub `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Opcjonalne dodatkowe pokrycie (dobrze mieć):

- xAI: `xai/grok-4` (lub najnowszy dostępny)
- Mistral: `mistral/`… (wybierz jeden model z obsługą „tools”, który masz włączony)
- Cerebras: `cerebras/`… (jeśli masz dostęp)
- LM Studio: `lmstudio/`… (lokalnie; wywoływanie narzędzi zależy od trybu API)

### Vision: wysyłanie obrazu (załącznik → wiadomość multimodalna)

Uwzględnij co najmniej jeden model obsługujący obrazy w `OPENCLAW_LIVE_GATEWAY_MODELS` (warianty Claude/Gemini/OpenAI z obsługą vision itd.), aby przećwiczyć sondę obrazu.

### Agregatory / alternatywne Gateway

Jeśli masz włączone klucze, obsługujemy też testowanie przez:

- OpenRouter: `openrouter/...` (setki modeli; użyj `openclaw models scan`, aby znaleźć kandydatów z obsługą tool+image)
- OpenCode: `opencode/...` dla Zen oraz `opencode-go/...` dla Go (uwierzytelnianie przez `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Więcej dostawców, których możesz uwzględnić w macierzy live (jeśli masz poświadczenia/konfigurację):

- Wbudowani: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Przez `models.providers` (niestandardowe endpointy): `minimax` (cloud/API) oraz dowolny proxy zgodny z OpenAI/Anthropic (LM Studio, vLLM, LiteLLM itd.)

Wskazówka: nie próbuj na sztywno wpisywać „wszystkich modeli” w dokumentacji. Autorytatywna lista to wszystko, co zwraca `discoverModels(...)` na Twojej maszynie + wszystkie dostępne klucze.

## Poświadczenia (nigdy nie commituj)

Testy live wykrywają poświadczenia tak samo jak CLI. Praktyczne konsekwencje:

- Jeśli CLI działa, testy live powinny znaleźć te same klucze.
- Jeśli test live zgłasza „no creds”, debuguj to tak samo, jak debugowałbyś `openclaw models list` / wybór modelu.

- Profile uwierzytelniania per-agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (to właśnie oznaczają „profile keys” w testach live)
- Konfiguracja: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
- Starszy katalog stanu: `~/.openclaw/credentials/` (kopiowany do przygotowanego katalogu domowego live, jeśli istnieje, ale nie jest głównym magazynem kluczy profili)
- Lokalne uruchomienia live domyślnie kopiują aktywną konfigurację, pliki `auth-profiles.json` per-agent, starsze `credentials/` oraz obsługiwane zewnętrzne katalogi uwierzytelniania CLI do tymczasowego testowego katalogu domowego; przygotowane katalogi domowe live pomijają `workspace/` i `sandboxes/`, a nadpisania ścieżek `agents.*.workspace` / `agentDir` są usuwane, aby sondy nie działały na rzeczywistym obszarze roboczym hosta.

Jeśli chcesz polegać na kluczach env (np. eksportowanych w `~/.profile`), uruchamiaj testy lokalne po `source ~/.profile` albo użyj poniższych runnerów Docker (mogą montować `~/.profile` do kontenera).

## Deepgram live (transkrypcja audio)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Włączenie: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Test: `src/agents/byteplus.live.test.ts`
- Włączenie: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Opcjonalne nadpisanie modelu: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Test: `extensions/comfy/comfy.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Zakres:
  - Ćwiczy dołączone ścieżki obrazu, wideo i `music_generate` comfy
  - Pomija każdą możliwość, chyba że skonfigurowane jest `models.providers.comfy.<capability>`
  - Przydatne po zmianach w przesyłaniu workflow comfy, odpytywaniu, pobieraniu lub rejestracji Plugin

## Image generation live

- Test: `src/image-generation/runtime.live.test.ts`
- Polecenie: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Zakres:
  - Wylicza każdy zarejestrowany Plugin dostawcy image-generation
  - Ładuje brakujące zmienne środowiskowe dostawców z Twojej powłoki logowania (`~/.profile`) przed uruchomieniem sond
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami uwierzytelniania, dzięki czemu nieaktualne testowe klucze w `auth-profiles.json` nie maskują rzeczywistych poświadczeń powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Uruchamia standardowe warianty image-generation przez współdzieloną możliwość runtime:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Obecnie objęci dołączeni dostawcy:
  - `openai`
  - `google`
- Opcjonalne zawężanie:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania tylko z env

## Music generation live

- Test: `extensions/music-generation-providers.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Zakres:
  - Ćwiczy współdzieloną dołączoną ścieżkę dostawcy music-generation
  - Obecnie obejmuje Google i MiniMax
  - Ładuje zmienne środowiskowe dostawców z Twojej powłoki logowania (`~/.profile`) przed uruchomieniem sond
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami uwierzytelniania, dzięki czemu nieaktualne testowe klucze w `auth-profiles.json` nie maskują rzeczywistych poświadczeń powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Uruchamia oba zadeklarowane tryby runtime, gdy są dostępne:
    - `generate` z wejściem opartym wyłącznie na prompcie
    - `edit`, gdy dostawca deklaruje `capabilities.edit.enabled`
  - Obecne pokrycie współdzielonej ścieżki:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: osobny plik live Comfy, nie ten współdzielony przegląd
- Opcjonalne zawężanie:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania tylko z env

## Video generation live

- Test: `extensions/video-generation-providers.live.test.ts`
- Włączenie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Zakres:
  - Ćwiczy współdzieloną dołączoną ścieżkę dostawcy video-generation
  - Domyślnie używa bezpiecznej dla wydań ścieżki smoke: dostawcy inni niż FAL, jedno żądanie text-to-video na dostawcę, jednosekundowy prompt lobster oraz limit operacji per-dostawca z `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (domyślnie `180000`)
  - Domyślnie pomija FAL, ponieważ opóźnienie kolejki po stronie dostawcy może dominować czas wydania; przekaż `--video-providers fal` lub `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, aby uruchomić go jawnie
  - Ładuje zmienne środowiskowe dostawców z Twojej powłoki logowania (`~/.profile`) przed uruchomieniem sond
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami uwierzytelniania, dzięki czemu nieaktualne testowe klucze w `auth-profiles.json` nie maskują rzeczywistych poświadczeń powłoki
  - Pomija dostawców bez użytecznego uwierzytelniania/profilu/modelu
  - Domyślnie uruchamia tylko `generate`
  - Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchamiać także zadeklarowane tryby transformacji, gdy są dostępne:
    - `imageToVideo`, gdy dostawca deklaruje `capabilities.imageToVideo.enabled` i wybrany dostawca/model akceptuje lokalne wejście obrazu oparte na buforze we współdzielonym przeglądzie
    - `videoToVideo`, gdy dostawca deklaruje `capabilities.videoToVideo.enabled` i wybrany dostawca/model akceptuje lokalne wejście wideo oparte na buforze we współdzielonym przeglądzie
  - Obecni zadeklarowani, ale pomijani dostawcy `imageToVideo` we współdzielonym przeglądzie:
    - `vydra`, ponieważ dołączony `veo3` obsługuje tylko tekst, a dołączony `kling` wymaga zdalnego URL obrazu
  - Pokrycie Vydra specyficzne dla dostawcy:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ten plik uruchamia ścieżkę `veo3` text-to-video oraz ścieżkę `kling`, która domyślnie używa fixture zdalnego URL obrazu
  - Obecne pokrycie live `videoToVideo`:
    - tylko `runway`, gdy wybrany model to `runway/gen4_aleph`
  - Obecni zadeklarowani, ale pomijani dostawcy `videoToVideo` we współdzielonym przeglądzie:
    - `alibaba`, `qwen`, `xai`, ponieważ te ścieżki obecnie wymagają zdalnych referencyjnych URL `http(s)` / MP4
    - `google`, ponieważ obecna współdzielona ścieżka Gemini/Veo używa lokalnego wejścia opartego na buforze i ta ścieżka nie jest akceptowana we współdzielonym przeglądzie
    - `openai`, ponieważ obecna współdzielona ścieżka nie gwarantuje dostępu specyficznego dla organizacji do video inpaint/remix
- Opcjonalne zawężanie:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, aby uwzględnić każdego dostawcę w domyślnym przeglądzie, w tym FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, aby zmniejszyć limit operacji każdego dostawcy dla agresywnego uruchomienia smoke
- Opcjonalne zachowanie uwierzytelniania:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić uwierzytelnianie z magazynu profili i ignorować nadpisania tylko z env

## Harness media live

- Polecenie: `pnpm test:live:media`
- Cel:
  - Uruchamia współdzielone pakiety live image, music i video przez jeden natywny dla repozytorium punkt wejścia
  - Automatycznie ładuje brakujące zmienne środowiskowe dostawców z `~/.profile`
  - Domyślnie automatycznie zawęża każdy pakiet do dostawców, którzy aktualnie mają użyteczne uwierzytelnianie
  - Ponownie używa `scripts/test-live.mjs`, dzięki czemu zachowanie Heartbeat i trybu quiet pozostaje spójne
- Przykłady:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Uruchomienia Docker (opcjonalne kontrole „działa w Linuxie”)

Te uruchomienia Docker dzielą się na dwa koszyki:

- Uruchomienia live-model: `test:docker:live-models` oraz `test:docker:live-gateway` uruchamiają tylko odpowiadający im plik live z kluczami profili wewnątrz obrazu Docker repozytorium (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując lokalny katalog konfiguracji i obszar roboczy (oraz pobierając `~/.profile`, jeśli jest zamontowany). Odpowiadające im lokalne punkty wejścia to `test:live:models-profiles` oraz `test:live:gateway-profiles`.
- Uruchomienia Docker live domyślnie używają mniejszego limitu smoke, aby pełny przegląd Docker pozostawał praktyczny:
  `test:docker:live-models` domyślnie ustawia `OPENCLAW_LIVE_MAX_MODELS=12`, a
  `test:docker:live-gateway` domyślnie ustawia `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Nadpisz te zmienne env, gdy
  celowo chcesz uruchomić większy, wyczerpujący skan.
- `test:docker:all` buduje obraz live Docker raz przez `test:docker:live-build`, a następnie ponownie używa go dla dwóch ścieżek Docker live.
- Uruchomienia smoke kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` oraz `test:docker:plugins` uruchamiają jeden lub więcej rzeczywistych kontenerów i weryfikują ścieżki integracji wyższego poziomu.

Uruchomienia Docker live-model również bind-mountują tylko potrzebne katalogi domowe uwierzytelniania CLI (lub wszystkie obsługiwane, gdy uruchomienie nie jest zawężone), a następnie kopiują je do katalogu domowego kontenera przed uruchomieniem, aby zewnętrzne OAuth CLI mogło odświeżać tokeny bez modyfikowania magazynu uwierzytelniania hosta:

- Modele bezpośrednie: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Smoke powiązania ACP: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`)
- Smoke backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harnessu serwera aplikacji Codex: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Smoke Open WebUI live: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełny scaffolding): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Sieć Gateway (dwa kontenery, uwierzytelnianie WS + health): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Most kanałów MCP (zasiany Gateway + most stdio + smoke surowej ramki powiadomień Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (smoke instalacji + alias `/plugin` + semantyka restartu pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)

Uruchomienia Docker live-model również bind-mountują bieżące checkout repozytorium w trybie tylko do odczytu i przygotowują je do tymczasowego katalogu roboczego wewnątrz kontenera. Dzięki temu obraz runtime pozostaje lekki, a jednocześnie Vitest działa na dokładnie Twoim lokalnym źródle/konfiguracji.
Krok przygotowania pomija duże lokalne cache i wyniki budowania aplikacji, takie jak
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne dla aplikacji katalogi `.build` lub wyjścia Gradle, dzięki czemu uruchomienia Docker live nie tracą minut na kopiowanie artefaktów zależnych od maszyny.
Ustawiają także `OPENCLAW_SKIP_CHANNELS=1`, aby sondy Gateway live nie uruchamiały
rzeczywistych workerów kanałów Telegram/Discord/itd. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekazuj również
`OPENCLAW_LIVE_GATEWAY_*`, gdy chcesz zawęzić lub wykluczyć pokrycie Gateway
live z tej ścieżki Docker.
`test:docker:openwebui` to smoke zgodności wyższego poziomu: uruchamia kontener
Gateway OpenClaw z włączonymi endpointami HTTP zgodnymi z OpenAI, uruchamia
przypięty kontener Open WebUI względem tego Gateway, loguje się przez
Open WebUI, weryfikuje, że `/api/models` udostępnia `openclaw/default`, a następnie wysyła
rzeczywiste żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Pierwsze uruchomienie może być zauważalnie wolniejsze, ponieważ Docker może potrzebować pobrać
obraz Open WebUI, a Open WebUI może potrzebować zakończyć własną konfigurację cold-start.
Ta ścieżka oczekuje użytecznego klucza modelu live, a `OPENCLAW_PROFILE_FILE`
(domyślnie `~/.profile`) jest podstawowym sposobem dostarczenia go w uruchomieniach dockerowych.
Udane uruchomienia wypisują mały payload JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczne i nie wymaga
rzeczywistego konta Telegram, Discord ani iMessage. Uruchamia zasiany kontener
Gateway, startuje drugi kontener, który uruchamia `openclaw mcp serve`, a następnie
weryfikuje odkrywanie routowanych konwersacji, odczyty transkryptów, metadane załączników,
zachowanie kolejki zdarzeń live, routing wysyłki wychodzącej oraz powiadomienia Claude w stylu kanału +
uprawnień przez rzeczywisty most stdio MCP. Kontrola powiadomień
bezpośrednio analizuje surowe ramki stdio MCP, więc smoke weryfikuje to, co most
rzeczywiście emituje, a nie tylko to, co akurat udostępnia konkretny SDK klienta.

Ręczny smoke wątku ACP w prostym języku (nie CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt dla przepływów pracy regresji/debugowania. Może być znowu potrzebny do walidacji routingu wątków ACP, więc go nie usuwaj.

Przydatne zmienne env:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowane do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowane do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (domyślnie: `~/.profile`) montowane do `/home/node/.profile` i pobierane przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, aby zweryfikować tylko zmienne env pobrane z `OPENCLAW_PROFILE_FILE`, używając tymczasowych katalogów config/workspace i bez montowania zewnętrznego uwierzytelniania CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowane do `/home/node/.npm-global` dla buforowanych instalacji CLI wewnątrz Dockera
- Zewnętrzne katalogi/pliki uwierzytelniania CLI pod `$HOME` są montowane tylko do odczytu pod `/host-auth...`, a następnie kopiowane do `/home/node/...` przed rozpoczęciem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone uruchomienia dostawców montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Nadpisz ręcznie przez `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` lub listę rozdzielaną przecinkami, taką jak `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić uruchomienie
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować dostawców wewnątrz kontenera
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby ponownie użyć istniejącego obrazu `openclaw:local-live` przy ponownych uruchomieniach, które nie wymagają przebudowy
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby upewnić się, że poświadczenia pochodzą z magazynu profili (a nie z env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model udostępniany przez Gateway dla smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt sprawdzający nonce używany przez smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Kontrola spójności dokumentacji

Uruchom kontrole dokumentacji po edycji dokumentów: `pnpm check:docs`.
Uruchom pełną walidację anchorów Mintlify, gdy potrzebujesz także kontroli nagłówków w obrębie strony: `pnpm docs:check-links:anchors`.

## Regresja offline (bezpieczna dla CI)

To regresje „rzeczywistego pipeline’u” bez rzeczywistych dostawców:

- Wywoływanie narzędzi Gateway (mock OpenAI, rzeczywista pętla gateway + agent): `src/gateway/gateway.test.ts` (przypadek: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Kreator Gateway (WS `wizard.start`/`wizard.next`, zapisuje konfigurację + wymuszone uwierzytelnianie): `src/gateway/gateway.test.ts` (przypadek: "runs wizard over ws and writes auth token config")

## Ewalucje niezawodności agenta (Skills)

Mamy już kilka testów bezpiecznych dla CI, które działają jak „ewaluacje niezawodności agenta”:

- Mockowane wywoływanie narzędzi przez rzeczywistą pętlę gateway + agent (`src/gateway/gateway.test.ts`).
- Przepływy end-to-end kreatora, które walidują okablowanie sesji i skutki konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla Skills (zobacz [Skills](/pl/tools/skills)):

- **Podejmowanie decyzji:** gdy Skills są wymienione w prompcie, czy agent wybiera właściwą Skill (albo unika nieistotnych)?
- **Zgodność:** czy agent czyta `SKILL.md` przed użyciem i wykonuje wymagane kroki/argumenty?
- **Kontrakty przepływu pracy:** scenariusze wieloturowe, które sprawdzają kolejność narzędzi, przenoszenie historii sesji i granice sandboxa.

Przyszłe ewaluacje powinny najpierw pozostać deterministyczne:

- Runner scenariuszy używający mockowanych dostawców do sprawdzania wywołań narzędzi i ich kolejności, odczytów plików Skill oraz okablowania sesji.
- Niewielki pakiet scenariuszy skupionych na Skills (użyj vs pomiń, bramkowanie, prompt injection).
- Opcjonalne ewaluacje live (opt-in, bramkowane przez env) dopiero po wdrożeniu pakietu bezpiecznego dla CI.

## Testy kontraktowe (kształt Plugin i kanału)

Testy kontraktowe weryfikują, że każdy zarejestrowany Plugin i kanał są zgodne ze swoim
kontraktem interfejsu. Iterują po wszystkich wykrytych Pluginach i uruchamiają pakiet
asercji dotyczących kształtu i zachowania. Domyślna ścieżka unit `pnpm test` celowo
pomija te współdzielone pliki seam i smoke; uruchamiaj polecenia kontraktowe jawnie,
gdy dotykasz współdzielonych powierzchni kanałów lub dostawców.

### Polecenia

- Wszystkie kontrakty: `pnpm test:contracts`
- Tylko kontrakty kanałów: `pnpm test:contracts:channels`
- Tylko kontrakty dostawców: `pnpm test:contracts:plugins`

### Kontrakty kanałów

Znajdują się w `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Podstawowy kształt Plugin (id, nazwa, możliwości)
- **setup** - Kontrakt kreatora konfiguracji
- **session-binding** - Zachowanie powiązania sesji
- **outbound-payload** - Struktura payloadu wiadomości
- **inbound** - Obsługa wiadomości przychodzących
- **actions** - Handlery akcji kanału
- **threading** - Obsługa identyfikatorów wątków
- **directory** - API katalogu/listy
- **group-policy** - Egzekwowanie polityki grupowej

### Kontrakty statusu dostawców

Znajdują się w `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondy statusu kanałów
- **registry** - Kształt rejestru Plugin

### Kontrakty dostawców

Znajdują się w `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrakt przepływu uwierzytelniania
- **auth-choice** - Wybór/selekcja uwierzytelniania
- **catalog** - API katalogu modeli
- **discovery** - Wykrywanie Plugin
- **loader** - Ładowanie Plugin
- **runtime** - Runtime dostawcy
- **shape** - Kształt/interfejs Plugin
- **wizard** - Kreator konfiguracji

### Kiedy uruchamiać

- Po zmianie eksportów lub subścieżek Plugin SDK
- Po dodaniu albo modyfikacji Plugin kanału lub dostawcy
- Po refaktoryzacji rejestracji lub wykrywania Plugin

Testy kontraktowe są uruchamiane w CI i nie wymagają rzeczywistych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem dostawcy/modelu wykryty w live:

- Jeśli to możliwe, dodaj regresję bezpieczną dla CI (mockowany/stubowany dostawca albo przechwycenie dokładnej transformacji kształtu żądania)
- Jeśli z natury da się to odtworzyć tylko w live (limity szybkości, polityki uwierzytelniania), utrzymuj test live wąski i opt-in przez zmienne env
- Wybieraj możliwie najmniejszą warstwę, która wychwytuje błąd:
  - błąd konwersji/odtwarzania żądania dostawcy → test modeli bezpośrednich
  - błąd pipeline’u sesji/historii/narzędzi Gateway → smoke Gateway live albo bezpieczny dla CI test mockowanego Gateway
- Zabezpieczenie przechodzenia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza jeden przykładowy cel na klasę SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie sprawdza, że identyfikatory exec segmentów przechodzenia są odrzucane.
  - Jeśli dodasz nową rodzinę celów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo kończy się niepowodzeniem przy niesklasyfikowanych identyfikatorach celów, aby nie dało się po cichu pominąć nowych klas.
