---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie testów regresji dla błędów modeli/dostawców
    - Debugowanie zachowania Gateway i agenta
summary: 'Zestaw do testowania: pakiety unit/e2e/live, runnery Docker i zakres każdego testu'
title: Testowanie
x-i18n:
    generated_at: "2026-04-21T09:55:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3290113f28dab37f4b6ceb0bda6ced70c7d2b24ad3fccac6488b6aab1ad65e52
    source_path: help/testing.md
    workflow: 15
---

# Testowanie

OpenClaw ma trzy pakiety Vitest (unit/integration, e2e, live) oraz niewielki zestaw runnerów Docker.

Ten dokument jest przewodnikiem „jak testujemy”:

- Co obejmuje każdy pakiet testów (i czego celowo _nie_ obejmuje)
- Jakie polecenia uruchamiać w typowych przepływach pracy (lokalnie, przed push, debugowanie)
- Jak testy live wykrywają poświadczenia i wybierają modele/dostawców
- Jak dodawać testy regresji dla rzeczywistych problemów modeli/dostawców

## Szybki start

W większości dni:

- Pełna bramka (oczekiwana przed push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Szybsze lokalne uruchomienie pełnego pakietu na maszynie z dużą ilością zasobów: `pnpm test:max`
- Bezpośrednia pętla watch Vitest: `pnpm test:watch`
- Bezpośrednie wskazywanie plików obsługuje teraz także ścieżki extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Podczas iteracji nad pojedynczą awarią najpierw preferuj uruchomienia ukierunkowane.
- Strona QA oparta na Docker: `pnpm qa:lab:up`
- Pakiet QA oparty na Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy modyfikujesz testy lub chcesz mieć większą pewność:

- Bramka pokrycia: `pnpm test:coverage`
- Pakiet E2E: `pnpm test:e2e`

Podczas debugowania rzeczywistych dostawców/modeli (wymaga prawdziwych poświadczeń):

- Pakiet live (modele + sondy narzędzi/obrazów gateway): `pnpm test:live`
- Ciche uruchomienie jednego pliku live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Test kosztów Moonshot/Kimi: przy ustawionym `MOONSHOT_API_KEY` uruchom
  `openclaw models list --provider moonshot --json`, a następnie uruchom izolowane
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  przeciwko `moonshot/kimi-k2.6`. Sprawdź, czy JSON raportuje Moonshot/K2.6 oraz czy
  transkrypcja asystenta zapisuje znormalizowane `usage.cost`.

Wskazówka: gdy potrzebujesz tylko jednego nieudanego przypadku, preferuj zawężanie testów live przez zmienne środowiskowe allowlist opisane poniżej.

## Runnery specyficzne dla QA

Te polecenia działają obok głównych pakietów testów, gdy potrzebujesz realizmu qa-lab:

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze QA oparte na repo bezpośrednio na hoście.
  - Domyślnie uruchamia wiele wybranych scenariuszy równolegle z izolowanymi
    workerami gateway. `qa-channel` domyślnie używa współbieżności 4 (ograniczonej przez
    liczbę wybranych scenariuszy). Użyj `--concurrency <count>`, aby dostroić liczbę
    workerów, albo `--concurrency 1`, aby użyć starszego trybu sekwencyjnego.
  - Zwraca kod różny od zera, jeśli jakikolwiek scenariusz zakończy się niepowodzeniem. Użyj `--allow-failures`, jeśli chcesz uzyskać artefakty bez nieudanego kodu wyjścia.
  - Obsługuje tryby dostawców `live-frontier`, `mock-openai` i `aimock`.
    `aimock` uruchamia lokalny serwer dostawcy oparty na AIMock do eksperymentalnego
    testowania fixture i mocków protokołu bez zastępowania świadomego scenariuszy
    trybu `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam pakiet QA wewnątrz jednorazowej maszyny wirtualnej Multipass Linux.
  - Zachowuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
  - Ponownie używa tych samych flag wyboru dostawcy/modelu co `qa suite`.
  - Uruchomienia live przekazują obsługiwane wejścia autoryzacji QA praktyczne dla gościa:
    klucze dostawców oparte na env, ścieżkę konfiguracji dostawcy QA live oraz `CODEX_HOME`,
    jeśli jest obecne.
  - Katalogi wyjściowe muszą pozostać pod katalogiem głównym repo, aby gość mógł zapisywać z powrotem przez
    zamontowany obszar roboczy.
  - Zapisuje zwykły raport i podsumowanie QA oraz logi Multipass w
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia stronę QA opartą na Docker do pracy QA w stylu operatorskim.
- `pnpm test:docker:bundled-channel-deps`
  - Pakuje i instaluje bieżący build OpenClaw w Docker, uruchamia Gateway
    ze skonfigurowanym OpenAI, a następnie włącza Telegram i Discord przez edycje konfiguracji.
  - Weryfikuje, że pierwszy restart Gateway instaluje zależności runtime każdego wbudowanego Plugin kanału na żądanie, a drugi restart nie reinstaluje
    zależności, które zostały już aktywowane.
- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer dostawcy AIMock do bezpośrednich testów smoke protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia pakiet Matrix QA live przeciwko jednorazowemu homeserverowi Tuwunel opartemu na Docker.
  - Ten host QA jest dziś przeznaczony tylko do repo/developmentu. Spakowane instalacje OpenClaw nie dostarczają
    `qa-lab`, więc nie udostępniają `openclaw qa`.
  - Check-outy repo ładują wbudowany runner bezpośrednio; nie jest potrzebny osobny krok instalacji Plugin.
  - Tworzy tymczasowo trzech użytkowników Matrix (`driver`, `sut`, `observer`) oraz jeden prywatny pokój, a następnie uruchamia podrzędny gateway QA z prawdziwym Plugin Matrix jako transportem SUT.
  - Domyślnie używa przypiętego stabilnego obrazu Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Nadpisz przez `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, gdy musisz przetestować inny obraz.
  - Matrix nie udostępnia współdzielonych flag źródła poświadczeń, ponieważ ten tryb lokalnie tworzy jednorazowych użytkowników.
  - Zapisuje raport Matrix QA, podsumowanie, artefakt observed-events oraz połączony log wyjścia stdout/stderr w `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Uruchamia pakiet Telegram QA live przeciwko rzeczywistej prywatnej grupie przy użyciu tokenów bota driver i SUT z env.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` i `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Id grupy musi być numerycznym id czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych poświadczeń z puli. Domyślnie używaj trybu env albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby przejść na dzierżawy z puli.
  - Zwraca kod różny od zera, jeśli jakikolwiek scenariusz zakończy się niepowodzeniem. Użyj `--allow-failures`, jeśli chcesz uzyskać artefakty bez nieudanego kodu wyjścia.
  - Wymaga dwóch różnych botów w tej samej prywatnej grupie, przy czym bot SUT musi udostępniać nazwę użytkownika Telegram.
  - Dla stabilnej obserwacji bot-do-bota włącz Bot-to-Bot Communication Mode w `@BotFather` dla obu botów i upewnij się, że bot driver może obserwować ruch botów w grupie.
  - Zapisuje raport Telegram QA, podsumowanie i artefakt observed-messages w `.artifacts/qa-e2e/...`.

Tryby transportu live współdzielą jeden standardowy kontrakt, aby nowe transporty nie rozjeżdżały się:

`qa-channel` pozostaje szerokim syntetycznym pakietem QA i nie jest częścią macierzy pokrycia transportów live.

| Tryb     | Canary | Bramka wzmianek | Blokada allowlist | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Follow-up wątku | Izolacja wątku | Obserwacja reakcji | Polecenie pomocy |
| -------- | ------ | --------------- | ----------------- | ----------------------------- | ----------------------- | --------------- | -------------- | ------------------ | ---------------- |
| Matrix   | x      | x               | x                 | x                             | x                       | x               | x              | x                  |                  |
| Telegram | x      |                 |                   |                               |                         |                 |                |                    | x                |

### Współdzielone poświadczenia Telegram przez Convex (v1)

Gdy dla `openclaw qa telegram` włączone jest `--credential-source convex` (lub `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab pobiera wyłączną dzierżawę z puli opartej na Convex, wysyła Heartbeat tej
dzierżawy podczas działania trybu i zwalnia dzierżawę przy zamknięciu.

Referencyjny szkielet projektu Convex:

- `qa/convex-credential-broker/`

Wymagane zmienne środowiskowe:

- `OPENCLAW_QA_CONVEX_SITE_URL` (na przykład `https://your-deployment.convex.site`)
- Jeden sekret dla wybranej roli:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` dla `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` dla `ci`
- Wybór roli poświadczeń:
  - CLI: `--credential-role maintainer|ci`
  - Domyślne z env: `OPENCLAW_QA_CREDENTIAL_ROLE` (domyślnie `ci` w CI, w przeciwnym razie `maintainer`)

Opcjonalne zmienne środowiskowe:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (domyślnie `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (domyślnie `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (domyślnie `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (domyślnie `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (domyślnie `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (opcjonalny trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` pozwala na loopbackowe adresy URL Convex `http://` tylko do lokalnego developmentu.

`OPENCLAW_QA_CONVEX_SITE_URL` w normalnym działaniu powinno używać `https://`.

Administracyjne polecenia maintainera (dodawanie/usuwanie/listowanie puli) wymagają
konkretnie `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocnicze polecenia CLI dla maintainerów:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Użyj `--json`, aby uzyskać wynik czytelny maszynowo w skryptach i narzędziach CI.

Domyślny kontrakt punktu końcowego (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Żądanie: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sukces: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Wyczerpanie/możliwość ponowienia: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
- `groupId` musi być stringiem z numerycznym id czatu Telegram.
- `admin/add` waliduje ten kształt dla `kind: "telegram"` i odrzuca nieprawidłowe payloady.

### Dodawanie kanału do QA

Dodanie kanału do systemu QA Markdown wymaga dokładnie dwóch rzeczy:

1. Adaptera transportowego dla kanału.
2. Pakietu scenariuszy, który wykonuje kontrakt kanału.

Nie dodawaj nowego głównego korzenia poleceń QA, jeśli współdzielony host `qa-lab`
może obsłużyć ten przepływ.

`qa-lab` jest właścicielem współdzielonej mechaniki hosta:

- korzenia poleceń `openclaw qa`
- uruchamiania i zamykania pakietu
- współbieżności workerów
- zapisu artefaktów
- generowania raportów
- wykonywania scenariuszy
- aliasów zgodności dla starszych scenariuszy `qa-channel`

Plugin runnera są właścicielami kontraktu transportowego:

- jak `openclaw qa <runner>` jest montowane pod współdzielonym korzeniem `qa`
- jak gateway jest konfigurowany dla tego transportu
- jak sprawdzana jest gotowość
- jak wstrzykiwane są zdarzenia przychodzące
- jak obserwowane są wiadomości wychodzące
- jak udostępniane są transkrypcje i znormalizowany stan transportu
- jak wykonywane są akcje oparte na transporcie
- jak obsługiwany jest reset lub czyszczenie specyficzne dla transportu

Minimalny próg wdrożenia dla nowego kanału jest następujący:

1. Zachowaj `qa-lab` jako właściciela współdzielonego korzenia `qa`.
2. Zaimplementuj runner transportu na współdzielonej warstwie hosta `qa-lab`.
3. Zachowaj mechanikę specyficzną dla transportu wewnątrz Plugin runnera lub harnessu kanału.
4. Zamontuj runner jako `openclaw qa <runner>` zamiast rejestrować konkurencyjny główny korzeń poleceń.
   Plugin runnera powinny deklarować `qaRunners` w `openclaw.plugin.json` i eksportować pasującą tablicę `qaRunnerCliRegistrations` z `runtime-api.ts`.
   Zachowaj lekkość `runtime-api.ts`; leniwe CLI i wykonanie runnera powinny pozostać za oddzielnymi entrypointami.
5. Twórz lub adaptuj scenariusze Markdown w tematycznych katalogach `qa/scenarios/`.
6. Używaj generycznych helperów scenariuszy dla nowych scenariuszy.
7. Zachowaj działanie istniejących aliasów zgodności, chyba że repo przeprowadza celową migrację.

Reguła decyzyjna jest ścisła:

- Jeśli zachowanie można wyrazić raz w `qa-lab`, umieść je w `qa-lab`.
- Jeśli zachowanie zależy od jednego transportu kanału, zachowaj je w tym Plugin runnera lub harnessie Plugin.
- Jeśli scenariusz potrzebuje nowej możliwości, z której może korzystać więcej niż jeden kanał, dodaj helper generyczny zamiast gałęzi specyficznej dla kanału w `suite.ts`.
- Jeśli zachowanie ma sens tylko dla jednego transportu, zachowaj scenariusz jako specyficzny dla tego transportu i jasno zaznacz to w kontrakcie scenariusza.

Preferowane nazwy helperów generycznych dla nowych scenariuszy to:

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

Nowe prace nad kanałami powinny używać nazw helperów generycznych.
Aliasy zgodności istnieją po to, aby uniknąć migracji typu flag day, a nie jako model
dla tworzenia nowych scenariuszy.

## Pakiety testów (co uruchamia się gdzie)

Myśl o pakietach jako o „rosnącym realizmie” (i rosnącej zawodności/koszcie):

### Unit / integration (domyślne)

- Polecenie: `pnpm test`
- Konfiguracja: dziesięć sekwencyjnych uruchomień shardów (`vitest.full-*.config.ts`) nad istniejącymi zakresowymi projektami Vitest
- Pliki: inwentarze core/unit w `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` oraz dozwolone testy node `ui` objęte przez `vitest.unit.config.ts`
- Zakres:
  - Czyste testy jednostkowe
  - Testy integracyjne w procesie (auth gateway, routing, narzędzia, parsowanie, konfiguracja)
  - Deterministyczne regresje dla znanych błędów
- Oczekiwania:
  - Uruchamia się w CI
  - Nie są wymagane prawdziwe klucze
  - Powinno być szybkie i stabilne
- Uwaga o projektach:
  - Niezawężone `pnpm test` uruchamia teraz jedenaście mniejszych konfiguracji shardów (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego ogromnego procesu root-project native. To obniża szczytowe RSS na obciążonych maszynach i zapobiega zagłodzeniu niezwiązanych pakietów przez pracę auto-reply/extension.
  - `pnpm test --watch` nadal używa grafu projektów root `vitest.config.ts`, ponieważ pętla watch z wieloma shardami nie jest praktyczna.
  - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` najpierw kierują jawne cele plików/katalogów przez zakresowe ścieżki, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` unika kosztu pełnego uruchamiania root project.
  - `pnpm test:changed` rozwija zmienione ścieżki git do tych samych zakresowych ścieżek, gdy diff dotyczy tylko źródeł/testów dających się zrutować; edycje config/setup nadal wracają do szerokiego ponownego uruchomienia root project.
  - `pnpm check:changed` to normalna inteligentna lokalna bramka dla wąskich zmian. Klasyfikuje diff do kategorii core, testy core, extensions, testy extension, apps, docs i tooling, a następnie uruchamia pasujące ścieżki typecheck/lint/test. Zmiany publicznego SDK Plugin i kontraktów Plugin obejmują walidację extension, ponieważ extensions zależą od tych kontraktów core.
  - Testy jednostkowe z lekkim importem z agentów, poleceń, Plugin, helperów auto-reply, `plugin-sdk` i podobnych czystych obszarów narzędziowych są kierowane przez ścieżkę `unit-fast`, która pomija `test/setup-openclaw-runtime.ts`; pliki stanowe/ciężkie runtime pozostają w istniejących ścieżkach.
  - Wybrane pliki źródłowe helperów `plugin-sdk` i `commands` także mapują uruchomienia changed-mode do jawnych testów sąsiednich w tych lekkich ścieżkach, więc edycje helperów nie wymuszają ponownego uruchamiania pełnego ciężkiego pakietu dla tego katalogu.
  - `auto-reply` ma teraz trzy dedykowane koszyki: helpery core najwyższego poziomu, testy integracyjne najwyższego poziomu `reply.*` oraz poddrzewo `src/auto-reply/reply/**`. Dzięki temu najcięższa praca harnessu reply nie trafia do tanich testów status/chunk/token.
- Uwaga o embedded runner:
  - Gdy zmieniasz wejścia odkrywania message-tool lub kontekst runtime Compaction,
    zachowaj oba poziomy pokrycia.
  - Dodawaj ukierunkowane regresje helperów dla czystych granic routingu/normalizacji.
  - Utrzymuj też zdrowie pakietów integracyjnych embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` oraz
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Te pakiety weryfikują, że zakresowe id i zachowanie Compaction nadal przepływają
    przez rzeczywiste ścieżki `run.ts` / `compact.ts`; testy tylko helperów nie są
    wystarczającym zamiennikiem dla tych ścieżek integracyjnych.
- Uwaga o puli:
  - Bazowa konfiguracja Vitest domyślnie używa teraz `threads`.
  - Współdzielona konfiguracja Vitest ustawia też `isolate: false` i używa runnera bez izolacji w root projects, konfiguracjach e2e i live.
  - Główna ścieżka UI zachowuje ustawienia `jsdom` i optimizer, ale teraz też działa na współdzielonym runnerze bez izolacji.
  - Każdy shard `pnpm test` dziedziczy te same domyślne ustawienia `threads` + `isolate: false` ze współdzielonej konfiguracji Vitest.
  - Współdzielony launcher `scripts/run-vitest.mjs` domyślnie dodaje teraz także `--no-maglev` dla podrzędnych procesów Node Vitest, aby ograniczyć churn kompilacji V8 podczas dużych lokalnych uruchomień. Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, jeśli chcesz porównać zachowanie ze standardowym V8.
- Uwaga o szybkiej lokalnej iteracji:
  - `pnpm changed:lanes` pokazuje, które ścieżki architektoniczne wyzwala diff.
  - Hook pre-commit uruchamia `pnpm check:changed --staged` po sformatowaniu/lintowaniu staged, więc commity tylko core nie płacą kosztu testów extension, chyba że dotykają publicznych kontraktów skierowanych do extension.
  - `pnpm test:changed` kieruje przez zakresowe ścieżki, gdy zmienione ścieżki czysto mapują się do mniejszego pakietu.
  - `pnpm test:max` i `pnpm test:changed:max` zachowują to samo routowanie, tylko z wyższym limitem workerów.
  - Automatyczne skalowanie workerów lokalnych jest teraz celowo konserwatywne i dodatkowo wycofuje się, gdy średnie obciążenie hosta jest już wysokie, więc wiele równoległych uruchomień Vitest domyślnie powoduje mniej szkód.
  - Bazowa konfiguracja Vitest oznacza projekty/pliki konfiguracyjne jako `forceRerunTriggers`, aby ponowne uruchomienia changed-mode pozostały poprawne, gdy zmienia się okablowanie testów.
  - Konfiguracja utrzymuje `OPENCLAW_VITEST_FS_MODULE_CACHE` w stanie włączonym na obsługiwanych hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz jedną jawną lokalizację pamięci podręcznej do bezpośredniego profilowania.
- Uwaga o debugowaniu wydajności:
  - `pnpm test:perf:imports` włącza raportowanie czasu importu Vitest oraz wynik z rozbiciem importów.
  - `pnpm test:perf:imports:changed` ogranicza ten sam widok profilowania do plików zmienionych od `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje routowane `test:changed` z natywną ścieżką root-project dla tego zacommitowanego diffu i wypisuje wall time oraz macOS max RSS.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżące brudne drzewo, kierując listę zmienionych plików przez `scripts/test-projects.mjs` i konfigurację root Vitest.
  - `pnpm test:perf:profile:main` zapisuje profil CPU głównego wątku dla kosztów uruchomienia i transformacji Vitest/Vite.
  - `pnpm test:perf:profile:runner` zapisuje profile CPU+heap runnera dla pakietu unit przy wyłączonej równoległości plików.

### E2E (smoke gateway)

- Polecenie: `pnpm test:e2e`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Domyślne ustawienia runtime:
  - Używa Vitest `threads` z `isolate: false`, zgodnie z resztą repo.
  - Używa workerów adaptacyjnych (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie uruchamia się w trybie cichym, aby ograniczyć narzut I/O konsoli.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>`, aby wymusić liczbę workerów (limit 16).
  - `OPENCLAW_E2E_VERBOSE=1`, aby ponownie włączyć szczegółowe wyjście konsoli.
- Zakres:
  - Zachowanie end-to-end wielu instancji gateway
  - Powierzchnie WebSocket/HTTP, parowanie Node i cięższa sieć
- Oczekiwania:
  - Uruchamia się w CI (gdy jest włączone w pipeline)
  - Nie są wymagane prawdziwe klucze
  - Więcej ruchomych części niż w testach unit (może być wolniejsze)

### E2E: smoke backendu OpenShell

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `test/openshell-sandbox.e2e.test.ts`
- Zakres:
  - Uruchamia izolowany gateway OpenShell na hoście przez Docker
  - Tworzy sandbox z tymczasowego lokalnego Dockerfile
  - Testuje backend OpenShell OpenClaw przez rzeczywiste `sandbox ssh-config` + SSH exec
  - Weryfikuje zdalne kanoniczne zachowanie systemu plików przez most fs sandboxa
- Oczekiwania:
  - Tylko opt-in; nie jest częścią domyślnego uruchomienia `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` oraz działającego demona Docker
  - Używa izolowanego `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy gateway testowy i sandbox
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1`, aby włączyć test przy ręcznym uruchamianiu szerszego pakietu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, aby wskazać niestandardowe binarium CLI lub skrypt wrapper

### Live (prawdziwi dostawcy + prawdziwe modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten dostawca/model rzeczywiście działa _dzisiaj_ z prawdziwymi poświadczeniami?”
  - Wyłapywanie zmian formatu dostawców, osobliwości tool calling, problemów auth i zachowania limitów szybkości
- Oczekiwania:
  - Celowo nie jest stabilne w CI (prawdziwe sieci, prawdziwe polityki dostawców, limity, awarie)
  - Kosztuje pieniądze / zużywa limity szybkości
  - Preferuj uruchamianie zawężonych podzbiorów zamiast „wszystkiego”
- Uruchomienia live pobierają `~/.profile`, aby dobrać brakujące klucze API.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują materiał config/auth do tymczasowego home testowego, aby fixtury unit nie mogły mutować twojego rzeczywistego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo potrzebujesz, aby testy live używały twojego prawdziwego katalogu domowego.
- `pnpm test:live` domyślnie działa teraz w cichszym trybie: zachowuje wyjście postępu `[live] ...`, ale ukrywa dodatkową informację o `~/.profile` i wycisza logi bootstrap gateway/chatter Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz z powrotem pełne logi startowe.
- Rotacja kluczy API (specyficzna dla dostawcy): ustaw `*_API_KEYS` w formacie przecinek/średnik lub `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) albo nadpisanie per live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają próby przy odpowiedziach z limitem szybkości.
- Wyjście postępu/Heartbeat:
  - Pakiety live emitują teraz linie postępu do stderr, aby długie wywołania dostawców były widocznie aktywne nawet wtedy, gdy przechwytywanie konsoli Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli przez Vitest, dzięki czemu linie postępu dostawcy/gateway są strumieniowane natychmiast podczas uruchomień live.
  - Dostrój Heartbeat bezpośredniego modelu przez `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostrój Heartbeat gateway/probe przez `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który pakiet powinienem uruchomić?

Użyj tej tabeli decyzyjnej:

- Edytujesz logikę/testy: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli dużo zmieniłeś)
- Dotykasz sieci gateway / protokołu WS / parowania: dodaj `pnpm test:e2e`
- Debugujesz „mój bot nie działa” / awarie specyficzne dla dostawcy / tool calling: uruchom zawężone `pnpm test:live`

## Live: przegląd możliwości Android Node

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skrypt: `pnpm android:test:integration`
- Cel: wywołać **każde polecenie aktualnie reklamowane** przez podłączony Android Node i potwierdzić zachowanie kontraktu poleceń.
- Zakres:
  - Ręczna konfiguracja wstępna / warunek wstępny (pakiet nie instaluje, nie uruchamia ani nie paruje aplikacji).
  - Walidacja gateway `node.invoke` polecenie po poleceniu dla wybranego Android Node.
- Wymagana wstępna konfiguracja:
  - Aplikacja Android już połączona i sparowana z gateway.
  - Aplikacja utrzymywana na pierwszym planie.
  - Przyznane uprawnienia / zgoda na przechwytywanie dla możliwości, które mają przejść.
- Opcjonalne nadpisania celu:
  - `OPENCLAW_ANDROID_NODE_ID` lub `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Pełne szczegóły konfiguracji Androida: [Aplikacja Android](/pl/platforms/android)

## Live: smoke modeli (klucze profili)

Testy live są podzielone na dwie warstwy, aby można było izolować awarie:

- „Direct model” mówi nam, czy dostawca/model w ogóle potrafi odpowiedzieć przy danym kluczu.
- „Gateway smoke” mówi nam, czy pełny pipeline gateway+agent działa dla tego modelu (sesje, historia, narzędzia, polityka sandbox itp.).

### Warstwa 1: Bezpośrednie completion modelu (bez gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Cel:
  - Wyliczyć wykryte modele
  - Użyć `getApiKeyForModel`, aby wybrać modele, dla których masz poświadczenia
  - Uruchomić małe completion per model (oraz ukierunkowane regresje tam, gdzie potrzeba)
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Ustaw `OPENCLAW_LIVE_MODELS=modern` (lub `all`, alias dla modern), aby rzeczywiście uruchomić ten pakiet; w przeciwnym razie zostanie pominięty, aby `pnpm test:live` pozostawało skupione na gateway smoke
- Jak wybierać modele:
  - `OPENCLAW_LIVE_MODELS=modern`, aby uruchomić nowoczesną allowlistę (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` jest aliasem dla nowoczesnej allowlisty
  - albo `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlista rozdzielana przecinkami)
  - Przebiegi modern/all domyślnie używają dobranego limitu o wysokim sygnale; ustaw `OPENCLAW_LIVE_MAX_MODELS=0`, aby wykonać pełny przebieg modern, albo dodatnią liczbę dla mniejszego limitu.
- Jak wybierać dostawców:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlista rozdzielana przecinkami)
- Skąd pochodzą klucze:
  - Domyślnie: magazyn profili i fallbacki env
  - Ustaw `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić tylko **magazyn profili**
- Dlaczego to istnieje:
  - Oddziela „API dostawcy jest zepsute / klucz jest nieprawidłowy” od „pipeline agenta gateway jest zepsuty”
  - Zawiera małe, izolowane regresje (przykład: replay reasoning OpenAI Responses/Codex Responses + przepływy tool-call)

### Warstwa 2: Smoke gateway + agent dev (to, co faktycznie robi "@openclaw")

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Cel:
  - Uruchomić gateway in-process
  - Utworzyć/załatać sesję `agent:dev:*` (nadpisanie modelu per uruchomienie)
  - Iterować po modelach-z-kluczami i potwierdzić:
    - „znaczącą” odpowiedź (bez narzędzi)
    - że działa rzeczywiste wywołanie narzędzia (sonda read)
    - opcjonalne dodatkowe sondy narzędzi (sonda exec+read)
    - że nadal działają ścieżki regresji OpenAI (tylko tool-call → follow-up)
- Szczegóły sond (aby można było szybko wyjaśniać awarie):
  - Sonda `read`: test zapisuje plik nonce w obszarze roboczym i prosi agenta o `read` tego pliku oraz odesłanie nonce.
  - Sonda `exec+read`: test prosi agenta o zapis nonce do pliku tymczasowego przez `exec`, a następnie odczytanie go przez `read`.
  - Sonda obrazu: test dołącza wygenerowany PNG (kot + losowy kod) i oczekuje, że model zwróci `cat <CODE>`.
  - Referencja implementacji: `src/gateway/gateway-models.profiles.live.test.ts` i `src/gateway/live-image-probe.ts`.
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Jak wybierać modele:
  - Domyślnie: nowoczesna allowlista (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` jest aliasem dla nowoczesnej allowlisty
  - Albo ustaw `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (lub listę rozdzielaną przecinkami), aby zawęzić
  - Przebiegi gateway modern/all domyślnie używają dobranego limitu o wysokim sygnale; ustaw `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0`, aby wykonać pełny przebieg modern, albo dodatnią liczbę dla mniejszego limitu.
- Jak wybierać dostawców (aby uniknąć „wszystkiego z OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlista rozdzielana przecinkami)
- Sondy narzędzi i obrazu są w tym teście live zawsze włączone:
  - sonda `read` + sonda `exec+read` (stres dla narzędzi)
  - sonda obrazu uruchamia się, gdy model reklamuje obsługę wejścia obrazowego
  - Przepływ (wysoki poziom):
    - Test generuje mały PNG z „CAT” + losowym kodem (`src/gateway/live-image-probe.ts`)
    - Wysyła go przez `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parsuje załączniki do `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent przekazuje multimodalną wiadomość użytkownika do modelu
    - Potwierdzenie: odpowiedź zawiera `cat` + kod (tolerancja OCR: drobne błędy są dozwolone)

Wskazówka: aby zobaczyć, co możesz testować na swojej maszynie (i dokładne id `provider/model`), uruchom:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke backendu CLI (Claude, Codex, Gemini lub inne lokalne CLI)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Cel: zwalidować pipeline Gateway + agent przy użyciu lokalnego backendu CLI, bez dotykania domyślnej konfiguracji.
- Domyślne ustawienia smoke specyficzne dla backendu znajdują się w definicji `cli-backend.ts` należącej do odpowiedniego extension.
- Włączanie:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Ustawienia domyślne:
  - Domyślny dostawca/model: `claude-cli/claude-sonnet-4-6`
  - Zachowanie command/args/image pochodzi z metadanych Plugin właściciela backendu CLI.
- Nadpisania (opcjonalne):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, aby wysłać rzeczywisty załącznik obrazu (ścieżki są wstrzykiwane do promptu).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, aby przekazywać ścieżki plików obrazu jako argumenty CLI zamiast przez wstrzyknięcie do promptu.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (lub `"list"`), aby sterować przekazywaniem argumentów obrazu, gdy ustawiono `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, aby wysłać drugi turn i zwalidować przepływ wznowienia.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, aby wyłączyć domyślną sondę ciągłości tej samej sesji Claude Sonnet -> Opus (ustaw `1`, aby wymusić ją, gdy wybrany model obsługuje cel przełączenia).

Przykład:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Receptura Docker:

```bash
pnpm test:docker:live-cli-backend
```

Receptury Docker dla pojedynczego dostawcy:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Uwagi:

- Runner Docker znajduje się w `scripts/test-live-cli-backend-docker.sh`.
- Uruchamia smoke live backendu CLI wewnątrz obrazu Docker repo jako użytkownik `node` bez uprawnień root.
- Rozwiązuje metadane smoke CLI od extension właściciela, a następnie instaluje pasujący pakiet Linux CLI (`@anthropic-ai/claude-code`, `@openai/codex` lub `@google/gemini-cli`) do buforowanego zapisywalnego prefiksu w `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (domyślnie: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` wymaga przenośnego OAuth subskrypcji Claude Code przez `~/.claude/.credentials.json` z `claudeAiOauth.subscriptionType` albo `CLAUDE_CODE_OAUTH_TOKEN` z `claude setup-token`. Najpierw potwierdza bezpośrednie `claude -p` w Docker, a następnie uruchamia dwa turny Gateway CLI-backend bez zachowywania zmiennych środowiskowych klucza API Anthropic. Ten tryb subskrypcyjny domyślnie wyłącza sondy Claude MCP/tool i obrazu, ponieważ Claude obecnie kieruje użycie aplikacji innych firm przez dodatkowe rozliczanie użycia zamiast zwykłych limitów planu subskrypcji.
- Smoke live backendu CLI testuje teraz ten sam pełny przepływ end-to-end dla Claude, Codex i Gemini: turn tekstowy, turn klasyfikacji obrazu, a następnie wywołanie narzędzia MCP `cron` weryfikowane przez CLI gateway.
- Domyślny smoke Claude dodatkowo łata sesję z Sonnet do Opus i weryfikuje, że wznowiona sesja nadal pamięta wcześniejszą notatkę.

## Live: smoke ACP bind (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Cel: zwalidować rzeczywisty przepływ conversation-bind ACP z live ACP agent:
  - wysłać `/acp spawn <agent> --bind here`
  - powiązać syntetyczną rozmowę kanału wiadomości w miejscu
  - wysłać zwykły follow-up w tej samej rozmowie
  - zweryfikować, że follow-up trafia do transkrypcji powiązanej sesji ACP
- Włączanie:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Ustawienia domyślne:
  - ACP agenty w Docker: `claude,codex,gemini`
  - ACP agent dla bezpośredniego `pnpm test:live ...`: `claude`
  - Syntetyczny kanał: kontekst rozmowy w stylu Slack DM
  - Backend ACP: `acpx`
- Nadpisania:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Uwagi:
  - Ten tryb używa powierzchni gateway `chat.send` z polami synthetic originating-route tylko dla administratora, aby testy mogły dołączać kontekst kanału wiadomości bez udawania zewnętrznego dostarczenia.
  - Gdy `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nie jest ustawione, test używa wbudowanego rejestru agentów Plugin `acpx` dla wybranego agenta harness ACP.

Przykład:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Receptura Docker:

```bash
pnpm test:docker:live-acp-bind
```

Receptury Docker dla pojedynczego agenta:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Uwagi Docker:

- Runner Docker znajduje się w `scripts/test-live-acp-bind-docker.sh`.
- Domyślnie uruchamia smoke ACP bind kolejno przeciwko wszystkim obsługiwanym live CLI agentom: `claude`, `codex`, a następnie `gemini`.
- Użyj `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` lub `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, aby zawęzić macierz.
- Pobiera `~/.profile`, umieszcza pasujący materiał auth CLI w kontenerze, instaluje `acpx` do zapisywalnego prefiksu npm, a następnie instaluje żądane live CLI (`@anthropic-ai/claude-code`, `@openai/codex` lub `@google/gemini-cli`), jeśli go brakuje.
- Wewnątrz Docker runner ustawia `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, aby `acpx` zachował zmienne środowiskowe dostawcy z pobranego profilu dostępne dla podrzędnego CLI harnessu.

## Live: smoke harnessu Codex app-server

- Cel: zwalidować harness Codex należący do Plugin przez normalną metodę gateway
  `agent`:
  - załadować wbudowany Plugin `codex`
  - wybrać `OPENCLAW_AGENT_RUNTIME=codex`
  - wysłać pierwszy turn agenta gateway do `codex/gpt-5.4`
  - wysłać drugi turn do tej samej sesji OpenClaw i zweryfikować, że wątek
    app-server może zostać wznowiony
  - uruchomić `/codex status` i `/codex models` przez tę samą ścieżkę
    poleceń gateway
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Model domyślny: `codex/gpt-5.4`
- Opcjonalna sonda obrazu: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Opcjonalna sonda MCP/tool: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Smoke ustawia `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, aby uszkodzony harness Codex
  nie mógł przejść przez cichy fallback do PI.
- Auth: `OPENAI_API_KEY` z powłoki/profilu oraz opcjonalnie skopiowane
  `~/.codex/auth.json` i `~/.codex/config.toml`

Receptura lokalna:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Receptura Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Uwagi Docker:

- Runner Docker znajduje się w `scripts/test-live-codex-harness-docker.sh`.
- Pobiera zamontowane `~/.profile`, przekazuje `OPENAI_API_KEY`, kopiuje pliki auth CLI Codex,
  jeśli są obecne, instaluje `@openai/codex` do zapisywalnego zamontowanego prefiksu npm,
  przygotowuje drzewo źródłowe, a następnie uruchamia tylko test live Codex-harness.
- Docker domyślnie włącza sondy obrazu oraz MCP/tool. Ustaw
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` lub
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`, gdy potrzebujesz węższego przebiegu debugowania.
- Docker eksportuje też `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, zgodnie z konfiguracją testu live,
  dzięki czemu fallback `openai-codex/*` lub PI nie może ukryć regresji harnessu Codex.

### Zalecane receptury live

Wąskie, jawne allowlisty są najszybsze i najmniej zawodne:

- Pojedynczy model, bezpośrednio (bez gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Pojedynczy model, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling u kilku dostawców:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Skupienie na Google (klucz API Gemini + Antigravity):
  - Gemini (klucz API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Uwagi:

- `google/...` używa Gemini API (klucz API).
- `google-antigravity/...` używa mostu OAuth Antigravity (punkt końcowy agenta w stylu Cloud Code Assist).
- `google-gemini-cli/...` używa lokalnego Gemini CLI na twojej maszynie (osobne auth + osobliwości narzędzi).
- Gemini API vs Gemini CLI:
  - API: OpenClaw wywołuje hostowane Gemini API Google przez HTTP (auth kluczem API / profilem); to właśnie większość użytkowników ma na myśli, mówiąc „Gemini”.
  - CLI: OpenClaw wywołuje lokalne binarium `gemini`; ma własne auth i może zachowywać się inaczej (obsługa strumieniowania/narzędzi/rozjazd wersji).

## Live: macierz modeli (co obejmujemy)

Nie istnieje stała „lista modeli CI” (live jest opt-in), ale to są **zalecane** modele do regularnego obejmowania na maszynie deweloperskiej z kluczami.

### Nowoczesny zestaw smoke (tool calling + obraz)

To jest przebieg „typowych modeli”, który powinien stale działać:

- OpenAI (nie-Codex): `openai/gpt-5.4` (opcjonalnie: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` i `google/gemini-3-flash-preview` (unikaj starszych modeli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` i `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Uruchom gateway smoke z narzędziami + obrazem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Bazowy poziom: tool calling (Read + opcjonalnie Exec)

Wybierz co najmniej jeden model z każdej rodziny dostawców:

- OpenAI: `openai/gpt-5.4` (lub `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (lub `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Opcjonalne dodatkowe pokrycie (warto mieć):

- xAI: `xai/grok-4` (lub najnowszy dostępny)
- Mistral: `mistral/`… (wybierz jeden model zdolny do `tools`, który masz włączony)
- Cerebras: `cerebras/`… (jeśli masz dostęp)
- LM Studio: `lmstudio/`… (lokalnie; tool calling zależy od trybu API)

### Vision: wysyłanie obrazu (załącznik → wiadomość multimodalna)

Uwzględnij co najmniej jeden model obsługujący obrazy w `OPENCLAW_LIVE_GATEWAY_MODELS` (warianty Claude/Gemini/OpenAI obsługujące vision itd.), aby wykonać sondę obrazu.

### Agregatory / alternatywne gatewaye

Jeśli masz włączone klucze, obsługujemy też testowanie przez:

- OpenRouter: `openrouter/...` (setki modeli; użyj `openclaw models scan`, aby znaleźć kandydatów obsługujących tools+image)
- OpenCode: `opencode/...` dla Zen i `opencode-go/...` dla Go (auth przez `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Więcej dostawców, których możesz uwzględnić w macierzy live (jeśli masz poświadczenia/konfigurację):

- Wbudowani: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Przez `models.providers` (punkty końcowe niestandardowe): `minimax` (chmura/API) oraz dowolny proxy zgodny z OpenAI/Anthropic (LM Studio, vLLM, LiteLLM itd.)

Wskazówka: nie próbuj na sztywno wpisywać w dokumentacji „wszystkich modeli”. Autorytatywną listą jest to, co `discoverModels(...)` zwraca na twojej maszynie + jakie klucze są dostępne.

## Poświadczenia (nigdy nie commituj)

Testy live wykrywają poświadczenia tak samo jak CLI. Praktyczne konsekwencje:

- Jeśli działa CLI, testy live powinny znaleźć te same klucze.
- Jeśli test live mówi „no creds”, debuguj go tak samo, jak debugowałbyś `openclaw models list` / wybór modelu.

- Profile auth per agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (to właśnie oznacza „profile keys” w testach live)
- Konfiguracja: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
- Starszy katalog stanu: `~/.openclaw/credentials/` (kopiowany do przygotowanego home live, jeśli istnieje, ale nie jest głównym magazynem kluczy profili)
- Lokalne uruchomienia live domyślnie kopiują aktywną konfigurację, pliki `auth-profiles.json` per agent, starsze `credentials/` i obsługiwane zewnętrzne katalogi auth CLI do tymczasowego home testowego; przygotowane home live pomijają `workspace/` i `sandboxes/`, a nadpisania ścieżek `agents.*.workspace` / `agentDir` są usuwane, aby sondy nie trafiały do rzeczywistego obszaru roboczego hosta.

Jeśli chcesz polegać na kluczach env (np. eksportowanych w `~/.profile`), uruchamiaj testy lokalne po `source ~/.profile` albo używaj runnerów Docker poniżej (mogą zamontować `~/.profile` do kontenera).

## Deepgram live (transkrypcja audio)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Włączanie: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Test: `src/agents/byteplus.live.test.ts`
- Włączanie: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Opcjonalne nadpisanie modelu: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Test: `extensions/comfy/comfy.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Zakres:
  - Testuje wbudowane ścieżki obrazów, wideo i `music_generate` w comfy
  - Pomija każdą możliwość, jeśli `models.providers.comfy.<capability>` nie jest skonfigurowane
  - Przydatne po zmianach w zgłaszaniu workflow comfy, polling, pobieraniu lub rejestracji Plugin

## Image generation live

- Test: `src/image-generation/runtime.live.test.ts`
- Polecenie: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Zakres:
  - Wylicza każdy zarejestrowany Plugin dostawcy generowania obrazów
  - Wczytuje brakujące zmienne środowiskowe dostawcy z twojej powłoki logowania (`~/.profile`) przed wykonaniem sond
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami auth, aby nieaktualne klucze testowe w `auth-profiles.json` nie maskowały rzeczywistych poświadczeń z powłoki
  - Pomija dostawców bez używalnego auth/profilu/modelu
  - Uruchamia standardowe warianty generowania obrazów przez współdzieloną możliwość runtime:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Aktualnie objęci wbudowani dostawcy:
  - `openai`
  - `google`
- Opcjonalne zawężanie:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Opcjonalne zachowanie auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić auth z magazynu profili i ignorować nadpisania tylko z env

## Music generation live

- Test: `extensions/music-generation-providers.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Zakres:
  - Testuje współdzieloną wbudowaną ścieżkę dostawcy generowania muzyki
  - Obecnie obejmuje Google i MiniMax
  - Wczytuje zmienne środowiskowe dostawcy z twojej powłoki logowania (`~/.profile`) przed wykonaniem sond
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami auth, aby nieaktualne klucze testowe w `auth-profiles.json` nie maskowały rzeczywistych poświadczeń z powłoki
  - Pomija dostawców bez używalnego auth/profilu/modelu
  - Uruchamia oba zadeklarowane tryby runtime, gdy są dostępne:
    - `generate` z wejściem tylko promptowym
    - `edit`, gdy dostawca deklaruje `capabilities.edit.enabled`
  - Aktualne pokrycie współdzielonej ścieżki:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: osobny plik live Comfy, nie ten współdzielony przebieg
- Opcjonalne zawężanie:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Opcjonalne zachowanie auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić auth z magazynu profili i ignorować nadpisania tylko z env

## Video generation live

- Test: `extensions/video-generation-providers.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Zakres:
  - Testuje współdzieloną wbudowaną ścieżkę dostawcy generowania wideo
  - Domyślnie używa bezpiecznej dla wydań ścieżki smoke: dostawcy inni niż FAL, jedno żądanie text-to-video na dostawcę, jednosekundowy prompt z homarem oraz limit operacji per dostawca z `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (domyślnie `180000`)
  - Domyślnie pomija FAL, ponieważ opóźnienie kolejki po stronie dostawcy może dominować czas wydania; przekaż `--video-providers fal` lub `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, aby uruchomić go jawnie
  - Wczytuje zmienne środowiskowe dostawcy z twojej powłoki logowania (`~/.profile`) przed wykonaniem sond
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami auth, aby nieaktualne klucze testowe w `auth-profiles.json` nie maskowały rzeczywistych poświadczeń z powłoki
  - Pomija dostawców bez używalnego auth/profilu/modelu
  - Domyślnie uruchamia tylko `generate`
  - Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchamiać także zadeklarowane tryby transformacji, gdy są dostępne:
    - `imageToVideo`, gdy dostawca deklaruje `capabilities.imageToVideo.enabled` i wybrany dostawca/model akceptuje lokalne wejście obrazu oparte na buforze we współdzielonym przebiegu
    - `videoToVideo`, gdy dostawca deklaruje `capabilities.videoToVideo.enabled` i wybrany dostawca/model akceptuje lokalne wejście wideo oparte na buforze we współdzielonym przebiegu
  - Aktualni dostawcy `imageToVideo` zadeklarowani, ale pomijani we współdzielonym przebiegu:
    - `vydra`, ponieważ wbudowany `veo3` jest tylko tekstowy, a wbudowany `kling` wymaga zdalnego URL obrazu
  - Pokrycie specyficzne dla dostawcy Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ten plik uruchamia `veo3` text-to-video oraz ścieżkę `kling`, która domyślnie używa fixture zdalnego URL obrazu
  - Aktualne pokrycie live `videoToVideo`:
    - tylko `runway`, gdy wybranym modelem jest `runway/gen4_aleph`
  - Aktualni dostawcy `videoToVideo` zadeklarowani, ale pomijani we współdzielonym przebiegu:
    - `alibaba`, `qwen`, `xai`, ponieważ te ścieżki obecnie wymagają zdalnych referencyjnych URL `http(s)` / MP4
    - `google`, ponieważ obecna współdzielona ścieżka Gemini/Veo używa lokalnego wejścia opartego na buforze i ta ścieżka nie jest akceptowana we współdzielonym przebiegu
    - `openai`, ponieważ obecna współdzielona ścieżka nie gwarantuje dostępu do org-specyficznych funkcji video inpaint/remix
- Opcjonalne zawężanie:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, aby uwzględnić każdego dostawcę w domyślnym przebiegu, w tym FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, aby zmniejszyć limit operacji każdego dostawcy dla agresywnego przebiegu smoke
- Opcjonalne zachowanie auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić auth z magazynu profili i ignorować nadpisania tylko z env

## Media live harness

- Polecenie: `pnpm test:live:media`
- Cel:
  - Uruchamia współdzielone pakiety live obrazów, muzyki i wideo przez jeden natywny dla repo entrypoint
  - Automatycznie wczytuje brakujące zmienne środowiskowe dostawców z `~/.profile`
  - Domyślnie automatycznie zawęża każdy pakiet do dostawców, którzy aktualnie mają używalne auth
  - Ponownie używa `scripts/test-live.mjs`, więc zachowanie Heartbeat i trybu cichego pozostaje spójne
- Przykłady:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runnery Docker (opcjonalne kontrole „działa w Linuxie”)

Te runnery Docker dzielą się na dwa koszyki:

- Runnery live-model: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko pasujący plik live profile-key wewnątrz obrazu Docker repo (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując lokalny katalog konfiguracji i obszar roboczy (oraz pobierając `~/.profile`, jeśli jest zamontowany). Pasujące lokalne entrypointy to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Runnery live Docker domyślnie używają mniejszego limitu smoke, aby pełny przebieg Docker pozostawał praktyczny:
  `test:docker:live-models` domyślnie ustawia `OPENCLAW_LIVE_MAX_MODELS=12`, a
  `test:docker:live-gateway` domyślnie ustawia `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Nadpisz te zmienne środowiskowe, gdy
  jawnie chcesz większe, wyczerpujące skanowanie.
- `test:docker:all` buduje obraz Docker live raz przez `test:docker:live-build`, a następnie ponownie go używa dla dwóch ścieżek Docker live.
- Container smoke runners: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` i `test:docker:plugins` uruchamiają jeden lub więcej rzeczywistych kontenerów i weryfikują ścieżki integracji wyższego poziomu.

Runnery Docker live-model bind-mountują też tylko potrzebne katalogi auth CLI (lub wszystkie obsługiwane, gdy przebieg nie jest zawężony), a następnie kopiują je do home kontenera przed uruchomieniem, aby zewnętrzne OAuth CLI mogło odświeżać tokeny bez mutowania auth store hosta:

- Bezpośrednie modele: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`)
- Smoke backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harnessu Codex app-server: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Live smoke Open WebUI: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełne scaffolding): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Sieć Gateway (dwa kontenery, auth WS + health): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Most kanału MCP (zasiany Gateway + most stdio + surowy smoke ramki powiadomień Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Plugin (smoke instalacji + alias `/plugin` + semantyka restartu pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)

Runnery Docker live-model dodatkowo bind-mountują bieżący checkout tylko do odczytu i
przygotowują go w tymczasowym workdir wewnątrz kontenera. Dzięki temu obraz runtime
pozostaje smukły, a jednocześnie Vitest działa na dokładnie twoim lokalnym źródle/konfiguracji.
Krok przygotowania pomija duże lokalne pamięci podręczne i wyniki buildów aplikacji, takie
jak `.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne dla aplikacji katalogi
`.build` lub wyjściowe katalogi Gradle, dzięki czemu uruchomienia Docker live nie tracą minut na kopiowanie
artefaktów specyficznych dla maszyny.
Ustawiają też `OPENCLAW_SKIP_CHANNELS=1`, aby sondy gateway live nie uruchamiały
rzeczywistych workerów kanałów Telegram/Discord/itd. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekazuj dalej
także `OPENCLAW_LIVE_GATEWAY_*`, gdy musisz zawęzić lub wykluczyć pokrycie gateway
live z tej ścieżki Docker.
`test:docker:openwebui` to smoke zgodności wyższego poziomu: uruchamia kontener
gateway OpenClaw z włączonymi punktami końcowymi HTTP zgodnymi z OpenAI,
uruchamia przypięty kontener Open WebUI przeciwko temu gateway, loguje się przez
Open WebUI, weryfikuje, że `/api/models` udostępnia `openclaw/default`, a następnie wysyła
rzeczywiste żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Pierwsze uruchomienie może być zauważalnie wolniejsze, ponieważ Docker może potrzebować pobrać
obraz Open WebUI, a Open WebUI może potrzebować dokończyć własną konfigurację cold-start.
Ta ścieżka oczekuje używalnego klucza modelu live, a `OPENCLAW_PROFILE_FILE`
(domyslnie `~/.profile`) to podstawowy sposób dostarczenia go w uruchomieniach dockerowych.
Udane uruchomienia wypisują mały payload JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczne i nie potrzebuje
rzeczywistego konta Telegram, Discord ani iMessage. Uruchamia zasiany kontener
Gateway, uruchamia drugi kontener, który uruchamia `openclaw mcp serve`, a następnie
weryfikuje odkrywanie rozmów przez routing, odczyty transkrypcji, metadane załączników,
zachowanie kolejki zdarzeń live, routing wysyłek wychodzących oraz powiadomienia w stylu Claude o kanałach +
uprawnieniach przez rzeczywisty most stdio MCP. Kontrola powiadomień
sprawdza bezpośrednio surowe ramki stdio MCP, dzięki czemu smoke waliduje to, co most
rzeczywiście emituje, a nie tylko to, co akurat udostępnia konkretny SDK klienta.

Ręczny smoke ACP plain-language thread (nie CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt dla przepływów regresji/debugowania. Może znów być potrzebny do walidacji routingu wątków ACP, więc go nie usuwaj.

Przydatne zmienne środowiskowe:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowane do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowane do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (domyślnie: `~/.profile`) montowane do `/home/node/.profile` i pobierane przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, aby weryfikować tylko zmienne środowiskowe pobrane z `OPENCLAW_PROFILE_FILE`, używając tymczasowych katalogów config/workspace i bez montowania zewnętrznych auth CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowane do `/home/node/.npm-global` dla buforowanych instalacji CLI wewnątrz Docker
- Zewnętrzne katalogi/pliki auth CLI w `$HOME` są montowane tylko do odczytu pod `/host-auth...`, a następnie kopiowane do `/home/node/...` przed startem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone przebiegi dostawców montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Nadpisanie ręczne: `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` albo lista rozdzielana przecinkami, np. `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić przebieg
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować dostawców w kontenerze
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby ponownie użyć istniejącego obrazu `openclaw:local-live` dla ponownych uruchomień, które nie wymagają przebudowy
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby upewnić się, że poświadczenia pochodzą z magazynu profili (a nie z env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model udostępniany przez gateway dla smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt sprawdzania nonce używany przez smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Kontrola poprawności dokumentacji

Po edycjach dokumentacji uruchom kontrole docs: `pnpm check:docs`.
Uruchom pełną walidację anchorów Mintlify, gdy potrzebujesz także kontroli nagłówków w obrębie strony: `pnpm docs:check-links:anchors`.

## Regresja offline (bezpieczna dla CI)

To są regresje „prawdziwego pipeline” bez prawdziwych dostawców:

- Tool calling gateway (mock OpenAI, rzeczywisty gateway + pętla agenta): `src/gateway/gateway.test.ts` (przypadek: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Kreator gateway (WS `wizard.start`/`wizard.next`, zapis config + wymuszone auth): `src/gateway/gateway.test.ts` (przypadek: "runs wizard over ws and writes auth token config")

## Evale niezawodności agenta (Skills)

Mamy już kilka bezpiecznych dla CI testów, które zachowują się jak „evale niezawodności agenta”:

- Mock tool-calling przez rzeczywisty gateway + pętlę agenta (`src/gateway/gateway.test.ts`).
- Przepływy kreatora end-to-end, które walidują okablowanie sesji i efekty konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla Skills (zobacz [Skills](/pl/tools/skills)):

- **Decyzje:** gdy Skills są wymienione w prompcie, czy agent wybiera właściwe Skills (albo unika nieistotnych)?
- **Zgodność:** czy agent przed użyciem czyta `SKILL.md` i wykonuje wymagane kroki/argumenty?
- **Kontrakty przepływu pracy:** scenariusze wieloturowe, które potwierdzają kolejność narzędzi, przenoszenie historii sesji i granice sandbox.

Przyszłe evale powinny najpierw pozostać deterministyczne:

- Runner scenariuszy używający mock dostawców do potwierdzania wywołań narzędzi + kolejności, odczytów plików skill i okablowania sesji.
- Mały pakiet scenariuszy skupionych na Skills (użyj vs unikaj, gating, prompt injection).
- Opcjonalne evale live (opt-in, ograniczone przez env) dopiero po wdrożeniu pakietu bezpiecznego dla CI.

## Testy kontraktowe (kształt Plugin i kanałów)

Testy kontraktowe weryfikują, że każdy zarejestrowany Plugin i kanał jest zgodny ze swoim
kontraktem interfejsu. Iterują po wszystkich wykrytych Plugin i uruchamiają pakiet
potwierdzeń kształtu i zachowania. Domyślna ścieżka unit `pnpm test` celowo
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
- **session-binding** - Zachowanie wiązania sesji
- **outbound-payload** - Struktura payloadu wiadomości
- **inbound** - Obsługa wiadomości przychodzących
- **actions** - Handlery akcji kanału
- **threading** - Obsługa ID wątków
- **directory** - API katalogu/listy
- **group-policy** - Egzekwowanie polityki grup

### Kontrakty statusu dostawców

Znajdują się w `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondy statusu kanału
- **registry** - Kształt rejestru Plugin

### Kontrakty dostawców

Znajdują się w `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrakt przepływu auth
- **auth-choice** - Wybór/selekcja auth
- **catalog** - API katalogu modeli
- **discovery** - Odkrywanie Plugin
- **loader** - Ładowanie Plugin
- **runtime** - Runtime dostawcy
- **shape** - Kształt/interfejs Plugin
- **wizard** - Kreator konfiguracji

### Kiedy uruchamiać

- Po zmianie eksportów lub podścieżek plugin-sdk
- Po dodaniu lub modyfikacji kanału albo Plugin dostawcy
- Po refaktoryzacji rejestracji lub odkrywania Plugin

Testy kontraktowe uruchamiają się w CI i nie wymagają prawdziwych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem dostawcy/modelu wykryty w live:

- Jeśli to możliwe, dodaj regresję bezpieczną dla CI (mock/stub dostawcy albo przechwycenie dokładnej transformacji kształtu żądania)
- Jeśli problem z natury występuje tylko w live (limity szybkości, polityki auth), utrzymuj test live wąski i opt-in przez zmienne środowiskowe
- Preferuj celowanie w najmniejszą warstwę, która wyłapuje błąd:
  - błąd konwersji/replay żądania dostawcy → test bezpośrednich modeli
  - błąd pipeline sesji/historii/narzędzi gateway → gateway live smoke albo bezpieczny dla CI test mock gateway
- Barierka ochronna traversalu SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza jeden przykładowy cel na klasę SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie potwierdza, że identyfikatory exec segmentów traversalu są odrzucane.
  - Jeśli dodasz nową rodzinę celów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo kończy się niepowodzeniem przy niesklasyfikowanych identyfikatorach celów, aby nowych klas nie można było pominąć po cichu.
