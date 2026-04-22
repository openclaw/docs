---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie regresji dla błędów modelu/providera
    - Debugowanie zachowania Gateway i agenta
summary: 'Zestaw testowy: zestawy unit/e2e/live, uruchamianie w Dockerze i zakres każdego testu'
title: Testowanie
x-i18n:
    generated_at: "2026-04-22T04:23:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7309f596dc0fd8b6dac936be74af1c8b4aa1dccc98e169a6b6934206547a0ca
    source_path: help/testing.md
    workflow: 15
---

# Testowanie

OpenClaw ma trzy zestawy Vitest (unit/integration, e2e, live) oraz niewielki zestaw runnerów Docker.

Ten dokument jest przewodnikiem „jak testujemy”:

- Co obejmuje każdy zestaw (i czego celowo _nie_ obejmuje)
- Jakie polecenia uruchamiać w typowych przepływach pracy (lokalnie, przed push, debugowanie)
- Jak testy live wykrywają poświadczenia i wybierają modele/providerów
- Jak dodawać regresje dla rzeczywistych problemów modeli/providerów

## Szybki start

Na co dzień:

- Pełna bramka (oczekiwana przed push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Szybsze lokalne uruchomienie pełnego zestawu na wydajnej maszynie: `pnpm test:max`
- Bezpośrednia pętla watch Vitest: `pnpm test:watch`
- Bezpośrednie wskazywanie pliku obsługuje teraz także ścieżki rozszerzeń/kanałów: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Gdy iterujesz nad pojedynczą awarią, najpierw preferuj uruchomienia ukierunkowane.
- Witryna QA oparta na Dockerze: `pnpm qa:lab:up`
- Ścieżka QA oparta na Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy dotykasz testów lub chcesz mieć większą pewność:

- Bramka pokrycia: `pnpm test:coverage`
- Zestaw E2E: `pnpm test:e2e`

Podczas debugowania rzeczywistych providerów/modeli (wymaga prawdziwych poświadczeń):

- Zestaw live (modele + sondy narzędzi/obrazów Gateway): `pnpm test:live`
- Ciche uruchomienie jednego pliku live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Smoke kosztów Moonshot/Kimi: przy ustawionym `MOONSHOT_API_KEY` uruchom
  `openclaw models list --provider moonshot --json`, a następnie uruchom izolowane
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  dla `moonshot/kimi-k2.6`. Sprawdź, że JSON zgłasza Moonshot/K2.6 i że
  transkrypt asystenta przechowuje znormalizowane `usage.cost`.

Wskazówka: gdy potrzebujesz tylko jednego nieudanego przypadku, preferuj zawężanie testów live przez zmienne środowiskowe allowlist opisane poniżej.

## Runnery specyficzne dla QA

Te polecenia działają obok głównych zestawów testowych, gdy potrzebujesz realizmu qa-lab:

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze QA oparte na repozytorium bezpośrednio na hoście.
  - Domyślnie uruchamia równolegle wiele wybranych scenariuszy z izolowanymi
    workerami Gateway. `qa-channel` domyślnie używa współbieżności 4 (ograniczonej przez
    liczbę wybranych scenariuszy). Użyj `--concurrency <count>`, aby dostroić liczbę
    workerów, lub `--concurrency 1` dla starszej ścieżki sekwencyjnej.
  - Zwraca kod niezerowy, gdy jakikolwiek scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
    chcesz artefakty bez kończenia z błędem.
  - Obsługuje tryby providera `live-frontier`, `mock-openai` i `aimock`.
    `aimock` uruchamia lokalny serwer providera oparty na AIMock dla eksperymentalnego
    pokrycia fixture i mocków protokołu bez zastępowania świadomej scenariuszy
    ścieżki `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam zestaw QA wewnątrz jednorazowej maszyny Linux Multipass.
  - Zachowuje to samo zachowanie wyboru scenariuszy co `qa suite` na hoście.
  - Ponownie używa tych samych flag wyboru providera/modelu co `qa suite`.
  - Uruchomienia live przekazują obsługiwane wejścia auth QA, które są praktyczne dla gościa:
    klucze providera oparte na env, ścieżkę konfiguracji providera live QA oraz `CODEX_HOME`, jeśli jest obecne.
  - Katalogi wyjściowe muszą pozostać pod katalogiem głównym repozytorium, aby gość mógł zapisywać z powrotem przez
    zamontowany workspace.
  - Zapisuje standardowy raport QA + podsumowanie oraz logi Multipass w
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia witrynę QA opartą na Dockerze do pracy operatorskiej QA.
- `pnpm test:docker:bundled-channel-deps`
  - Pakuje i instaluje bieżącą kompilację OpenClaw w Dockerze, uruchamia Gateway
    z skonfigurowanym OpenAI, a następnie włącza Telegram i Discord przez edycje konfiguracji.
  - Weryfikuje, że pierwszy restart Gateway instaluje zależności runtime każdego
    dołączonego pluginu kanału na żądanie, a drugi restart nie reinstaluje
    zależności, które zostały już aktywowane.
  - Instaluje też znaną starszą bazę npm, włącza Telegram przed uruchomieniem
    `openclaw update --tag <candidate>` i weryfikuje, że
    doktor po aktualizacji w kandydacie naprawia zależności runtime dołączonych kanałów bez naprawy postinstall po stronie harnessu.
- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer providera AIMock do bezpośredniego smoke testowania
    protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia ścieżkę live QA Matrix względem jednorazowego homeservera Tuwunel opartego na Dockerze.
  - Ten host QA jest dziś tylko repo/dev. Spakowane instalacje OpenClaw nie dostarczają
    `qa-lab`, więc nie udostępniają `openclaw qa`.
  - Checkouty repozytorium ładują dołączony runner bezpośrednio; nie jest potrzebny osobny krok instalacji pluginu.
  - Tworzy trzy tymczasowe konta Matrix (`driver`, `sut`, `observer`) oraz jeden prywatny pokój, a następnie uruchamia podrzędny proces QA Gateway z prawdziwym pluginem Matrix jako transportem SUT.
  - Domyślnie używa przypiętego stabilnego obrazu Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Nadpisz przez `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, gdy chcesz przetestować inny obraz.
  - Matrix nie udostępnia współdzielonych flag źródeł poświadczeń, ponieważ ścieżka tworzy jednorazowych użytkowników lokalnie.
  - Zapisuje raport Matrix QA, podsumowanie, artefakt zaobserwowanych zdarzeń i połączony log wyjścia stdout/stderr w `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Uruchamia ścieżkę live QA Telegram względem prawdziwej prywatnej grupy przy użyciu tokenów bota driver i SUT z env.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` i `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Id grupy musi być numerycznym identyfikatorem czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych poświadczeń z puli. Domyślnie używaj trybu env albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby włączyć dzierżawy z puli.
  - Zwraca kod niezerowy, gdy jakikolwiek scenariusz się nie powiedzie. Użyj `--allow-failures`, gdy
    chcesz artefakty bez kończenia z błędem.
  - Wymaga dwóch różnych botów w tej samej prywatnej grupie, przy czym bot SUT musi udostępniać nazwę użytkownika Telegram.
  - Dla stabilnej obserwacji bot-do-bota włącz Bot-to-Bot Communication Mode w `@BotFather` dla obu botów i upewnij się, że bot driver może obserwować ruch botów w grupie.
  - Zapisuje raport Telegram QA, podsumowanie i artefakt zaobserwowanych wiadomości w `.artifacts/qa-e2e/...`.

Ścieżki live transport współdzielą jeden standardowy kontrakt, aby nowe transporty nie dryfowały:

`qa-channel` pozostaje szerokim syntetycznym zestawem QA i nie jest częścią macierzy pokrycia transportów live.

| Ścieżka  | Canary | Bramka wzmianki | Blokada allowlisty | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Dalszy ciąg wątku | Izolacja wątku | Obserwacja reakcji | Polecenie help |
| -------- | ------ | --------------- | ------------------ | ----------------------------- | ----------------------- | ----------------- | -------------- | ------------------ | -------------- |
| Matrix   | x      | x               | x                  | x                             | x                       | x                 | x              | x                  |                |
| Telegram | x      |                 |                    |                               |                         |                   |                |                    | x              |

### Współdzielone poświadczenia Telegram przez Convex (v1)

Gdy `--credential-source convex` (lub `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) jest włączone dla
`openclaw qa telegram`, qa-lab uzyskuje wyłączną dzierżawę z puli opartej na Convex, wysyła heartbeat
tej dzierżawy podczas działania ścieżki i zwalnia dzierżawę przy zamknięciu.

Referencyjny szkielet projektu Convex:

- `qa/convex-credential-broker/`

Wymagane zmienne środowiskowe:

- `OPENCLAW_QA_CONVEX_SITE_URL` (na przykład `https://your-deployment.convex.site`)
- Jeden sekret dla wybranej roli:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` dla `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` dla `ci`
- Wybór roli poświadczeń:
  - CLI: `--credential-role maintainer|ci`
  - Domyślne env: `OPENCLAW_QA_CREDENTIAL_ROLE` (domyślnie `ci` w CI, w przeciwnym razie `maintainer`)

Opcjonalne zmienne środowiskowe:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (domyślnie `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (domyślnie `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (domyślnie `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (domyślnie `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (domyślnie `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (opcjonalny identyfikator śledzenia)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` dopuszcza loopback `http://` URL-e Convex do lokalnego developmentu.

`OPENCLAW_QA_CONVEX_SITE_URL` powinno w normalnej pracy używać `https://`.

Polecenia administracyjne maintainera (dodaj/usuń/lista puli) wymagają konkretnie
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocnicze polecenia CLI dla maintainerów:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Użyj `--json`, aby uzyskać wynik czytelny maszynowo w skryptach i narzędziach CI.

Domyślny kontrakt endpointu (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Żądanie: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sukces: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Wyczerpane/powtarzalne: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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

Kształt ładunku dla rodzaju Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` musi być ciągiem z numerycznym identyfikatorem czatu Telegram.
- `admin/add` waliduje ten kształt dla `kind: "telegram"` i odrzuca nieprawidłowe ładunki.

### Dodawanie kanału do QA

Dodanie kanału do markdownowego systemu QA wymaga dokładnie dwóch rzeczy:

1. Adaptera transportowego dla kanału.
2. Pakietu scenariuszy, który ćwiczy kontrakt kanału.

Nie dodawaj nowego najwyższego poziomu poleceń QA, gdy współdzielony host `qa-lab` może
obsługiwać ten przepływ.

`qa-lab` jest właścicielem współdzielonej mechaniki hosta:

- głównego drzewa poleceń `openclaw qa`
- uruchamiania i zamykania zestawu
- współbieżności workerów
- zapisu artefaktów
- generowania raportów
- wykonywania scenariuszy
- aliasów zgodności dla starszych scenariuszy `qa-channel`

Pluginy runnerów są właścicielami kontraktu transportowego:

- tego, jak `openclaw qa <runner>` jest montowane pod współdzielonym korzeniem `qa`
- tego, jak Gateway jest konfigurowany dla tego transportu
- tego, jak sprawdzana jest gotowość
- tego, jak wstrzykiwane są zdarzenia przychodzące
- tego, jak obserwowane są wiadomości wychodzące
- tego, jak udostępniane są transkrypty i znormalizowany stan transportu
- tego, jak wykonywane są akcje wspierane przez transport
- tego, jak obsługiwany jest reset lub czyszczenie specyficzne dla transportu

Minimalny próg wdrożenia dla nowego kanału to:

1. Zachowaj `qa-lab` jako właściciela współdzielonego korzenia `qa`.
2. Zaimplementuj runner transportowy na współdzielonym styku hosta `qa-lab`.
3. Zachowaj mechanikę specyficzną dla transportu wewnątrz pluginu runnera lub harnessu kanału.
4. Montuj runner jako `openclaw qa <runner>` zamiast rejestrować konkurencyjne główne polecenie.
   Pluginy runnerów powinny deklarować `qaRunners` w `openclaw.plugin.json` i eksportować pasującą tablicę `qaRunnerCliRegistrations` z `runtime-api.ts`.
   Zachowaj lekkość `runtime-api.ts`; leniwe CLI i wykonanie runnera powinny pozostać za osobnymi entrypointami.
5. Twórz lub dostosowuj scenariusze markdown w tematycznych katalogach `qa/scenarios/`.
6. Używaj generycznych helperów scenariuszy dla nowych scenariuszy.
7. Utrzymuj działanie istniejących aliasów zgodności, chyba że repozytorium przeprowadza celową migrację.

Reguła decyzyjna jest ścisła:

- Jeśli zachowanie da się wyrazić raz w `qa-lab`, umieść je w `qa-lab`.
- Jeśli zachowanie zależy od jednego transportu kanału, pozostaw je w tym pluginie runnera lub harnessie pluginu.
- Jeśli scenariusz potrzebuje nowej możliwości, z której może skorzystać więcej niż jeden kanał, dodaj generyczny helper zamiast gałęzi specyficznej dla kanału w `suite.ts`.
- Jeśli zachowanie ma sens tylko dla jednego transportu, zachowaj scenariusz jako specyficzny dla tego transportu i wyraź to jasno w kontrakcie scenariusza.

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

Aliasy zgodności nadal są dostępne dla istniejących scenariuszy, w tym:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Nowa praca nad kanałami powinna używać generycznych nazw helperów.
Aliasy zgodności istnieją po to, aby uniknąć migracji typu flag day, a nie jako model
dla tworzenia nowych scenariuszy.

## Zestawy testowe (co uruchamia się gdzie)

Myśl o zestawach jak o „rosnącym realizmie” (i rosnącej zawodności/koszcie):

### Unit / integration (domyślny)

- Polecenie: `pnpm test`
- Konfiguracja: dziesięć sekwencyjnych uruchomień shardów (`vitest.full-*.config.ts`) na istniejących zakresowanych projektach Vitest
- Pliki: inwentarze core/unit w `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` oraz dopuszczone testy node w `ui` objęte przez `vitest.unit.config.ts`
- Zakres:
  - Czyste testy unit
  - Testy integracyjne w procesie (auth Gateway, routing, narzędzia, parsowanie, konfiguracja)
  - Deterministyczne regresje dla znanych błędów
- Oczekiwania:
  - Uruchamia się w CI
  - Nie wymaga prawdziwych kluczy
  - Powinien być szybki i stabilny
- Uwaga o projektach:
  - Niekierunkowane `pnpm test` uruchamia teraz jedenaście mniejszych konfiguracji shardów (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego ogromnego procesu głównego projektu. To obniża szczytowe RSS na obciążonych maszynach i zapobiega zagłodzeniu niezwiązanych zestawów przez pracę auto-reply/rozszerzeń.
  - `pnpm test --watch` nadal używa natywnego grafu projektów głównego `vitest.config.ts`, ponieważ pętla watch z wieloma shardami nie jest praktyczna.
  - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` najpierw kierują jawne cele plików/katalogów przez zakresowane ścieżki, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` unika kosztu pełnego uruchomienia głównego projektu.
  - `pnpm test:changed` rozwija zmienione ścieżki gita do tych samych zakresowanych ścieżek, gdy diff dotyka tylko routowalnych plików źródłowych/testowych; edycje konfiguracji/setup nadal wracają do szerokiego ponownego uruchomienia głównego projektu.
  - `pnpm check:changed` to standardowa inteligentna lokalna bramka dla wąskich zmian. Klasyfikuje diff do core, testów core, rozszerzeń, testów rozszerzeń, aplikacji, dokumentacji, metadanych wydania i narzędzi, a następnie uruchamia pasujące ścieżki typecheck/lint/test. Zmiany publicznego SDK Plugin i kontraktów pluginów obejmują walidację rozszerzeń, ponieważ rozszerzenia zależą od tych kontraktów core. Wersjonowanie ograniczone wyłącznie do metadanych wydania uruchamia ukierunkowane kontrole wersji/konfiguracji/zależności głównych zamiast pełnego zestawu, z ochroną odrzucającą zmiany pakietów poza głównym polem wersji.
  - Testy unit o lekkim imporcie z agentów, poleceń, pluginów, helperów auto-reply, `plugin-sdk` i podobnych czystych obszarów narzędziowych trafiają do ścieżki `unit-fast`, która pomija `test/setup-openclaw-runtime.ts`; pliki stanowe/ciężkie dla runtime pozostają na istniejących ścieżkach.
  - Wybrane pliki źródłowe helperów `plugin-sdk` i `commands` również mapują uruchomienia trybu changed do jawnych testów sąsiednich w tych lekkich ścieżkach, dzięki czemu edycje helperów nie wymuszają ponownego uruchomienia pełnego ciężkiego zestawu dla tego katalogu.
  - `auto-reply` ma teraz trzy dedykowane koszyki: helpery core najwyższego poziomu, testy integracyjne najwyższego poziomu `reply.*` oraz poddrzewo `src/auto-reply/reply/**`. Dzięki temu najcięższa praca harnessu odpowiedzi nie trafia do tanich testów status/chunk/token.
- Uwaga o embedded runner:
  - Gdy zmieniasz wejścia odkrywania message-tool lub kontekst runtime Compaction,
    zachowaj oba poziomy pokrycia.
  - Dodawaj ukierunkowane regresje helperów dla czystych granic routingu/normalizacji.
  - Utrzymuj też zdrowe zestawy integracyjne embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` oraz
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Te zestawy weryfikują, że zakresowane ID i zachowanie Compaction nadal przepływają
    przez rzeczywiste ścieżki `run.ts` / `compact.ts`; same testy helperów nie są
    wystarczającym substytutem tych ścieżek integracyjnych.
- Uwaga o puli:
  - Bazowa konfiguracja Vitest ma teraz domyślnie `threads`.
  - Współdzielona konfiguracja Vitest ustawia też na stałe `isolate: false` i używa nieizolowanego runnera w projektach głównych, konfiguracjach e2e i live.
  - Główna ścieżka UI zachowuje konfigurację `jsdom` i optymalizator, ale teraz również działa na współdzielonym nieizolowanym runnerze.
  - Każdy shard `pnpm test` dziedziczy te same domyślne `threads` + `isolate: false` ze współdzielonej konfiguracji Vitest.
  - Współdzielony launcher `scripts/run-vitest.mjs` domyślnie dodaje teraz także `--no-maglev` dla podrzędnych procesów Node Vitest, aby ograniczyć churn kompilacji V8 podczas dużych lokalnych uruchomień. Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, jeśli chcesz porównać działanie ze standardowym V8.
- Uwaga o szybkiej lokalnej iteracji:
  - `pnpm changed:lanes` pokazuje, które ścieżki architektoniczne wyzwala diff.
  - Hook pre-commit uruchamia `pnpm check:changed --staged` po formatowaniu/lintowaniu staged, więc commity tylko do core nie płacą kosztu testów rozszerzeń, chyba że dotykają publicznych kontraktów skierowanych do rozszerzeń. Commity dotyczące wyłącznie metadanych wydania pozostają na ukierunkowanej ścieżce wersji/konfiguracji/zależności głównych.
  - `pnpm test:changed` kieruje przez zakresowane ścieżki, gdy zmienione ścieżki czysto mapują się na mniejszy zestaw.
  - `pnpm test:max` i `pnpm test:changed:max` zachowują to samo zachowanie routingu, tylko z wyższym limitem workerów.
  - Automatyczne skalowanie lokalnych workerów jest teraz celowo zachowawcze i dodatkowo wycofuje się, gdy średnie obciążenie hosta jest już wysokie, więc wiele równoczesnych uruchomień Vitest domyślnie wyrządza mniej szkód.
  - Bazowa konfiguracja Vitest oznacza projekty/pliki konfiguracyjne jako `forceRerunTriggers`, aby ponowne uruchomienia w trybie changed pozostały poprawne, gdy zmienia się okablowanie testów.
  - Konfiguracja utrzymuje `OPENCLAW_VITEST_FS_MODULE_CACHE` włączone na obsługiwanych hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz mieć jedną jawną lokalizację cache do bezpośredniego profilowania.
- Uwaga o debugowaniu wydajności:
  - `pnpm test:perf:imports` włącza raportowanie czasu importu Vitest oraz wynik rozbicia importów.
  - `pnpm test:perf:imports:changed` ogranicza ten sam widok profilowania do plików zmienionych od `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje routowane `test:changed` z natywną ścieżką głównego projektu dla tego zatwierdzonego diffu i wypisuje czas ścienny oraz maksymalne RSS na macOS.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżące brudne drzewo, kierując listę zmienionych plików przez `scripts/test-projects.mjs` i główną konfigurację Vitest.
  - `pnpm test:perf:profile:main` zapisuje profil CPU głównego wątku dla narzutu startu i transformacji Vitest/Vite.
  - `pnpm test:perf:profile:runner` zapisuje profile CPU+heap runnera dla zestawu unit z wyłączoną równoległością plików.

### E2E (gateway smoke)

- Polecenie: `pnpm test:e2e`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Domyślne ustawienia runtime:
  - Używa Vitest `threads` z `isolate: false`, zgodnie z resztą repozytorium.
  - Używa adaptacyjnych workerów (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie uruchamia się w trybie cichym, aby ograniczyć narzut I/O konsoli.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>`, aby wymusić liczbę workerów (ograniczoną do 16).
  - `OPENCLAW_E2E_VERBOSE=1`, aby ponownie włączyć szczegółowe wyjście konsoli.
- Zakres:
  - Zachowanie end-to-end Gateway z wieloma instancjami
  - Powierzchnie WebSocket/HTTP, parowanie Node i cięższa sieć
- Oczekiwania:
  - Uruchamia się w CI (gdy jest włączone w pipeline)
  - Nie wymaga prawdziwych kluczy
  - Więcej ruchomych części niż testy unit (może być wolniejszy)

### E2E: smoke backendu OpenShell

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `test/openshell-sandbox.e2e.test.ts`
- Zakres:
  - Uruchamia izolowany Gateway OpenShell na hoście przez Docker
  - Tworzy sandbox z tymczasowego lokalnego Dockerfile
  - Testuje backend OpenShell OpenClaw przez rzeczywiste `sandbox ssh-config` + wykonanie SSH
  - Weryfikuje zachowanie zdalnie kanonicznego systemu plików przez most fs sandboxa
- Oczekiwania:
  - Tylko opt-in; nie jest częścią domyślnego uruchomienia `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` oraz działającego demona Docker
  - Używa izolowanych `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy testowy Gateway i sandbox
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1`, aby włączyć test przy ręcznym uruchamianiu szerszego zestawu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, aby wskazać niestandardowy binarny plik CLI lub skrypt wrappera

### Live (prawdziwi providerzy + prawdziwe modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten provider/model faktycznie działa _dzisiaj_ z prawdziwymi poświadczeniami?”
  - Wychwytuje zmiany formatu providera, niuanse wywoływania narzędzi, problemy auth i zachowanie limitów szybkości
- Oczekiwania:
  - Z definicji niestabilne w CI (prawdziwe sieci, prawdziwe polityki providerów, limity, awarie)
  - Kosztują pieniądze / zużywają limity szybkości
  - Lepiej uruchamiać zawężone podzbiory niż „wszystko”
- Uruchomienia live pobierają `~/.profile`, aby znaleźć brakujące klucze API.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują materiał config/auth do tymczasowego katalogu testowego, aby fixture unit nie mogły modyfikować Twojego prawdziwego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy świadomie potrzebujesz, aby testy live używały Twojego prawdziwego katalogu domowego.
- `pnpm test:live` ma teraz domyślnie cichszy tryb: zachowuje wyjście postępu `[live] ...`, ale ukrywa dodatkową informację o `~/.profile` i wycisza logi bootstrappingu Gateway/szum Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz z powrotem pełne logi startowe.
- Rotacja kluczy API (specyficzna dla providera): ustaw `*_API_KEYS` w formacie rozdzielanym przecinkami/średnikami lub `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) albo nadpisanie per live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają przy odpowiedziach rate limit.
- Wyjście postępu/heartbeat:
  - Zestawy live emitują teraz linie postępu do stderr, aby długie wywołania providera były widocznie aktywne nawet wtedy, gdy przechwytywanie konsoli Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli Vitest, więc linie postępu providera/Gateway są streamowane natychmiast podczas uruchomień live.
  - Strojenie heartbeatów modeli bezpośrednich przez `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Strojenie heartbeatów Gateway/probe przez `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który zestaw powinienem uruchomić?

Użyj tej tabeli decyzyjnej:

- Edycja logiki/testów: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli zmieniłeś dużo)
- Dotykasz sieci Gateway / protokołu WS / parowania: dodaj `pnpm test:e2e`
- Debugowanie „mój bot nie działa” / awarii specyficznych dla providera / wywoływania narzędzi: uruchom zawężone `pnpm test:live`

## Live: przegląd możliwości Android Node

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skrypt: `pnpm android:test:integration`
- Cel: wywołać **każde polecenie aktualnie ogłaszane** przez połączony Android Node i potwierdzić zachowanie kontraktu polecenia.
- Zakres:
  - Wstępnie przygotowana/ręczna konfiguracja (zestaw nie instaluje/nie uruchamia/nie paruje aplikacji).
  - Walidacja `node.invoke` Gateway polecenie po poleceniu dla wybranego Android Node.
- Wymagana wcześniejsza konfiguracja:
  - Aplikacja Android jest już połączona i sparowana z Gateway.
  - Aplikacja jest utrzymywana na pierwszym planie.
  - Uprawnienia/zgoda na przechwytywanie są przyznane dla możliwości, które mają przejść.
- Opcjonalne nadpisania celu:
  - `OPENCLAW_ANDROID_NODE_ID` lub `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Pełne szczegóły konfiguracji Android: [Aplikacja Android](/pl/platforms/android)

## Live: smoke modeli (klucze profili)

Testy live są podzielone na dwie warstwy, aby można było izolować awarie:

- „Direct model” mówi nam, czy provider/model w ogóle potrafi odpowiedzieć przy użyciu danego klucza.
- „Gateway smoke” mówi nam, czy pełny pipeline gateway+agent działa dla tego modelu (sesje, historia, narzędzia, polityka sandboxa itd.).

### Warstwa 1: Bezpośrednie completion modelu (bez Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Cel:
  - Wyliczyć wykryte modele
  - Użyć `getApiKeyForModel`, aby wybrać modele, do których masz poświadczenia
  - Uruchomić małe completion per model (oraz ukierunkowane regresje tam, gdzie trzeba)
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Ustaw `OPENCLAW_LIVE_MODELS=modern` (lub `all`, alias dla modern), aby faktycznie uruchomić ten zestaw; w przeciwnym razie zostanie pominięty, aby `pnpm test:live` pozostało skupione na gateway smoke
- Jak wybierać modele:
  - `OPENCLAW_LIVE_MODELS=modern`, aby uruchomić nowoczesną allowlistę (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` jest aliasem dla nowoczesnej allowlisty
  - albo `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlista rozdzielana przecinkami)
  - Przebiegi modern/all domyślnie używają dobranego limitu o wysokim sygnale; ustaw `OPENCLAW_LIVE_MAX_MODELS=0` dla wyczerpującego przebiegu modern albo wartość dodatnią dla mniejszego limitu.
- Jak wybierać providerów:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlista rozdzielana przecinkami)
- Skąd pochodzą klucze:
  - Domyślnie: ze store profili i fallbacków env
  - Ustaw `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić tylko **store profili**
- Dlaczego to istnieje:
  - Oddziela „API providera jest zepsute / klucz jest nieprawidłowy” od „pipeline agenta Gateway jest zepsuty”
  - Zawiera małe, izolowane regresje (przykład: replay rozumowania OpenAI Responses/Codex Responses + przepływy tool-call)

### Warstwa 2: Gateway + smoke agenta dev (to, co faktycznie robi „@openclaw”)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Cel:
  - Uruchomić Gateway w procesie
  - Utworzyć/zmodyfikować sesję `agent:dev:*` (nadpisanie modelu per uruchomienie)
  - Iterować po modelach-z-kluczami i potwierdzać:
    - „sensowną” odpowiedź (bez narzędzi)
    - że działa rzeczywiste wywołanie narzędzia (read probe)
    - opcjonalne dodatkowe sondy narzędzi (exec+read probe)
    - że ścieżki regresji OpenAI (tylko tool-call → follow-up) nadal działają
- Szczegóły sond (aby szybko wyjaśniać awarie):
  - sonda `read`: test zapisuje plik nonce w workspace i prosi agenta o jego `read` i odesłanie nonce.
  - sonda `exec+read`: test prosi agenta o zapisanie nonce do pliku tymczasowego przez `exec`, a następnie o jego odczytanie przez `read`.
  - sonda obrazu: test dołącza wygenerowany PNG (cat + losowy kod) i oczekuje, że model zwróci `cat <CODE>`.
  - Referencja implementacji: `src/gateway/gateway-models.profiles.live.test.ts` oraz `src/gateway/live-image-probe.ts`.
- Jak włączyć:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
- Jak wybierać modele:
  - Domyślnie: nowoczesna allowlista (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` jest aliasem dla nowoczesnej allowlisty
  - Albo ustaw `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (lub listę rozdzielaną przecinkami), aby zawęzić
  - Przebiegi gateway modern/all domyślnie używają dobranego limitu o wysokim sygnale; ustaw `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` dla wyczerpującego przebiegu modern albo wartość dodatnią dla mniejszego limitu.
- Jak wybierać providerów (unikaj „wszystkiego z OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlista rozdzielana przecinkami)
- Sondy narzędzi + obrazu są zawsze włączone w tym teście live:
  - sonda `read` + sonda `exec+read` (obciążenie narzędzi)
  - sonda obrazu uruchamia się, gdy model deklaruje obsługę wejścia obrazu
  - Przepływ (na wysokim poziomie):
    - Test generuje mały PNG z napisem „CAT” + losowym kodem (`src/gateway/live-image-probe.ts`)
    - Wysyła go przez `agent` jako `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parsuje attachments do `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Embedded agent przekazuje multimodalną wiadomość użytkownika do modelu
    - Asercja: odpowiedź zawiera `cat` + kod (tolerancja OCR: dopuszczalne są drobne błędy)

Wskazówka: aby zobaczyć, co możesz testować na swojej maszynie (oraz dokładne identyfikatory `provider/model`), uruchom:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke backendu CLI (Claude, Codex, Gemini lub inne lokalne CLI)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Cel: zweryfikować pipeline Gateway + agent przy użyciu lokalnego backendu CLI, bez dotykania domyślnej konfiguracji.
- Domyślne smoke backendu specyficzne dla backendu znajdują się w definicji `cli-backend.ts` należącej do odpowiedniego rozszerzenia.
- Włączanie:
  - `pnpm test:live` (lub `OPENCLAW_LIVE_TEST=1`, jeśli wywołujesz Vitest bezpośrednio)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Domyślne ustawienia:
  - Domyślny provider/model: `claude-cli/claude-sonnet-4-6`
  - Zachowanie command/args/image pochodzi z metadanych pluginu będącego właścicielem backendu CLI.
- Nadpisania (opcjonalne):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, aby wysłać rzeczywisty załącznik obrazu (ścieżki są wstrzykiwane do promptu).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, aby przekazywać ścieżki plików obrazu jako argumenty CLI zamiast wstrzykiwania do promptu.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (lub `"list"`), aby kontrolować sposób przekazywania argumentów obrazu, gdy ustawiono `IMAGE_ARG`.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, aby wysłać drugą turę i zweryfikować przepływ wznowienia.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, aby wyłączyć domyślną sondę ciągłości tej samej sesji Claude Sonnet -> Opus (ustaw `1`, aby wymusić ją, gdy wybrany model obsługuje cel przełączenia).

Przykład:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Przepis Docker:

```bash
pnpm test:docker:live-cli-backend
```

Przepisy Docker dla pojedynczego providera:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Uwagi:

- Runner Docker znajduje się w `scripts/test-live-cli-backend-docker.sh`.
- Uruchamia smoke live CLI-backend wewnątrz obrazu Docker repozytorium jako nieuprzywilejowany użytkownik `node`.
- Rozwiązuje metadane smoke CLI z rozszerzenia będącego właścicielem, a następnie instaluje pasujący pakiet Linux CLI (`@anthropic-ai/claude-code`, `@openai/codex` lub `@google/gemini-cli`) do cache'owanego zapisywalnego prefiksu w `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (domyślnie: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` wymaga przenośnego subskrypcyjnego OAuth Claude Code przez `~/.claude/.credentials.json` z `claudeAiOauth.subscriptionType` albo `CLAUDE_CODE_OAUTH_TOKEN` z `claude setup-token`. Najpierw potwierdza bezpośrednie `claude -p` w Dockerze, a potem uruchamia dwie tury Gateway CLI-backend bez zachowywania zmiennych env z kluczem API Anthropic. Ta ścieżka subskrypcyjna domyślnie wyłącza sondy Claude MCP/tool i obrazu, ponieważ Claude obecnie kieruje użycie aplikacji zewnętrznych przez dodatkowe rozliczanie użycia zamiast zwykłych limitów planu subskrypcji.
- Smoke live CLI-backend testuje teraz ten sam pełny przepływ end-to-end dla Claude, Codex i Gemini: tura tekstowa, tura klasyfikacji obrazu, a następnie wywołanie narzędzia MCP `cron` zweryfikowane przez Gateway CLI.
- Domyślny smoke Claude dodatkowo modyfikuje sesję z Sonnet na Opus i weryfikuje, że wznowiona sesja nadal pamięta wcześniejszą notatkę.

## Live: smoke ACP bind (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Cel: zweryfikować rzeczywisty przepływ bind rozmowy ACP z live ACP agentem:
  - wysłać `/acp spawn <agent> --bind here`
  - powiązać syntetyczną rozmowę kanału wiadomości w miejscu
  - wysłać zwykły follow-up w tej samej rozmowie
  - zweryfikować, że follow-up trafia do transkryptu powiązanej sesji ACP
- Włączanie:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Domyślne ustawienia:
  - Agenci ACP w Dockerze: `claude,codex,gemini`
  - Agent ACP dla bezpośredniego `pnpm test:live ...`: `claude`
  - Syntetyczny kanał: kontekst rozmowy w stylu Slack DM
  - Backend ACP: `acpx`
- Nadpisania:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Uwagi:
  - Ta ścieżka używa powierzchni `chat.send` Gateway z syntetycznymi polami originating-route przeznaczonymi tylko dla administratora, dzięki czemu testy mogą dołączać kontekst kanału wiadomości bez udawania zewnętrznego dostarczania.
  - Gdy `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nie jest ustawione, test używa wbudowanego rejestru agentów pluginu `acpx` dla wybranego agenta harnessu ACP.

Przykład:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Przepis Docker:

```bash
pnpm test:docker:live-acp-bind
```

Przepisy Docker dla pojedynczego agenta:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Uwagi Docker:

- Runner Docker znajduje się w `scripts/test-live-acp-bind-docker.sh`.
- Domyślnie uruchamia smoke ACP bind względem wszystkich obsługiwanych live agentów CLI po kolei: `claude`, `codex`, następnie `gemini`.
- Użyj `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` lub `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, aby zawęzić macierz.
- Pobiera `~/.profile`, przygotowuje pasujący materiał auth CLI do kontenera, instaluje `acpx` do zapisywalnego prefiksu npm, a następnie instaluje wymagane live CLI (`@anthropic-ai/claude-code`, `@openai/codex` lub `@google/gemini-cli`), jeśli go brakuje.
- Wewnątrz Dockera runner ustawia `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, aby acpx zachował zmienne env providera z pobranego profilu dostępne dla podrzędnego harnessu CLI.

## Live: smoke harnessu app-server Codex

- Cel: zweryfikować harness Codex należący do pluginu przez standardową metodę Gateway
  `agent`:
  - załadować dołączony plugin `codex`
  - wybrać `OPENCLAW_AGENT_RUNTIME=codex`
  - wysłać pierwszą turę agenta Gateway do `codex/gpt-5.4`
  - wysłać drugą turę do tej samej sesji OpenClaw i zweryfikować, że wątek
    app-server może zostać wznowiony
  - uruchomić `/codex status` i `/codex models` przez tę samą ścieżkę polecenia
    Gateway
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Domyślny model: `codex/gpt-5.4`
- Opcjonalna sonda obrazu: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Opcjonalna sonda MCP/narzędzia: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Smoke ustawia `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, aby uszkodzony harness Codex
  nie mógł przejść przez cichy fallback do PI.
- Auth: `OPENAI_API_KEY` z shella/profilu oraz opcjonalnie skopiowane
  `~/.codex/auth.json` i `~/.codex/config.toml`

Lokalny przepis:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Przepis Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Uwagi Docker:

- Runner Docker znajduje się w `scripts/test-live-codex-harness-docker.sh`.
- Pobiera zamontowane `~/.profile`, przekazuje `OPENAI_API_KEY`, kopiuje pliki auth
  CLI Codex, jeśli są obecne, instaluje `@openai/codex` do zapisywalnego zamontowanego prefiksu npm,
  przygotowuje drzewo źródeł, a następnie uruchamia tylko test live harnessu Codex.
- Docker domyślnie włącza sondy obrazu oraz MCP/narzędzi. Ustaw
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` lub
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`, gdy potrzebujesz węższego przebiegu debugowania.
- Docker eksportuje również `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, zgodnie z konfiguracją
  testu live, tak aby fallback `openai-codex/*` lub PI nie mógł ukryć regresji
  harnessu Codex.

### Zalecane przepisy live

Wąskie, jawne allowlisty są najszybsze i najmniej zawodne:

- Pojedynczy model, direct (bez Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Pojedynczy model, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Wywoływanie narzędzi przez kilku providerów:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Skupienie na Google (klucz API Gemini + Antigravity):
  - Gemini (klucz API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Uwagi:

- `google/...` używa API Gemini (klucz API).
- `google-antigravity/...` używa mostu OAuth Antigravity (endpoint agenta w stylu Cloud Code Assist).
- `google-gemini-cli/...` używa lokalnego Gemini CLI na Twojej maszynie (osobne auth + niuanse narzędzi).
- API Gemini vs Gemini CLI:
  - API: OpenClaw wywołuje hostowane API Gemini Google przez HTTP (auth przez klucz API / profil); to właśnie większość użytkowników ma na myśli, mówiąc „Gemini”.
  - CLI: OpenClaw wywołuje lokalny binarny plik `gemini`; ma własne auth i może zachowywać się inaczej (streaming/obsługa narzędzi/rozjazd wersji).

## Live: macierz modeli (co obejmujemy)

Nie ma stałej „listy modeli CI” (live jest opt-in), ale to są **zalecane** modele do regularnego pokrycia na maszynie developerskiej z kluczami.

### Nowoczesny zestaw smoke (wywoływanie narzędzi + obraz)

To jest przebieg „typowych modeli”, który oczekujemy utrzymać w działaniu:

- OpenAI (bez Codex): `openai/gpt-5.4` (opcjonalnie: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` i `google/gemini-3-flash-preview` (unikaj starszych modeli Gemini 2.x)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` i `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Uruchom gateway smoke z narzędziami + obrazem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Bazowy zestaw: wywoływanie narzędzi (Read + opcjonalnie Exec)

Wybierz co najmniej jeden model na rodzinę providerów:

- OpenAI: `openai/gpt-5.4` (lub `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (lub `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (lub `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Opcjonalne dodatkowe pokrycie (warto mieć):

- xAI: `xai/grok-4` (lub najnowszy dostępny)
- Mistral: `mistral/`… (wybierz jeden model obsługujący `tools`, który masz włączony)
- Cerebras: `cerebras/`… (jeśli masz dostęp)
- LM Studio: `lmstudio/`… (lokalne; wywoływanie narzędzi zależy od trybu API)

### Vision: wysyłanie obrazu (załącznik → wiadomość multimodalna)

Uwzględnij co najmniej jeden model obsługujący obrazy w `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/warianty OpenAI obsługujące vision itd.), aby przećwiczyć sondę obrazu.

### Agregatory / alternatywne Gateway

Jeśli masz włączone klucze, obsługujemy również testowanie przez:

- OpenRouter: `openrouter/...` (setki modeli; użyj `openclaw models scan`, aby znaleźć kandydatów obsługujących narzędzia i obrazy)
- OpenCode: `opencode/...` dla Zen oraz `opencode-go/...` dla Go (auth przez `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Więcej providerów, których możesz uwzględnić w macierzy live (jeśli masz poświadczenia/konfigurację):

- Wbudowani: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Przez `models.providers` (niestandardowe endpointy): `minimax` (cloud/API) oraz dowolny proxy zgodny z OpenAI/Anthropic (LM Studio, vLLM, LiteLLM itd.)

Wskazówka: nie próbuj wpisywać na sztywno „wszystkich modeli” w dokumentacji. Autorytatywną listą jest to, co zwraca `discoverModels(...)` na Twojej maszynie + jakie klucze są dostępne.

## Poświadczenia (nigdy nie commituj)

Testy live wykrywają poświadczenia tak samo, jak robi to CLI. Praktyczne konsekwencje:

- Jeśli działa CLI, testy live powinny znaleźć te same klucze.
- Jeśli test live mówi „no creds”, debuguj to tak samo, jak debugowałbyś `openclaw models list` / wybór modelu.

- Profile auth per agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (to właśnie oznaczają „profile keys” w testach live)
- Konfiguracja: `~/.openclaw/openclaw.json` (lub `OPENCLAW_CONFIG_PATH`)
- Starszy katalog stanu: `~/.openclaw/credentials/` (kopiowany do przygotowanego katalogu domowego live, jeśli istnieje, ale nie jest głównym store kluczy profilu)
- Lokalne uruchomienia live domyślnie kopiują aktywną konfigurację, pliki `auth-profiles.json` per agent, starszy `credentials/` oraz obsługiwane zewnętrzne katalogi auth CLI do tymczasowego katalogu domowego testu; przygotowane katalogi domowe live pomijają `workspace/` i `sandboxes/`, a nadpisania ścieżek `agents.*.workspace` / `agentDir` są usuwane, aby sondy nie działały na Twoim rzeczywistym workspace hosta.

Jeśli chcesz polegać na kluczach env (np. wyeksportowanych w `~/.profile`), uruchamiaj lokalne testy po `source ~/.profile` albo użyj runnerów Docker poniżej (mogą montować `~/.profile` do kontenera).

## Live Deepgram (transkrypcja audio)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Włączanie: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Test: `src/agents/byteplus.live.test.ts`
- Włączanie: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Opcjonalne nadpisanie modelu: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live mediów workflow ComfyUI

- Test: `extensions/comfy/comfy.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Zakres:
  - Testuje dołączone ścieżki obrazów, wideo i `music_generate` comfy
  - Pomija każdą możliwość, jeśli `models.providers.comfy.<capability>` nie jest skonfigurowane
  - Przydatne po zmianie zgłaszania workflow comfy, odpytywania, pobierania lub rejestracji pluginu

## Live generowanie obrazów

- Test: `src/image-generation/runtime.live.test.ts`
- Polecenie: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Zakres:
  - Wylicza każdy zarejestrowany plugin providera generowania obrazów
  - Ładuje brakujące zmienne env providera z Twojego login shell (`~/.profile`) przed sondowaniem
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami auth, aby nieaktualne testowe klucze w `auth-profiles.json` nie maskowały rzeczywistych poświadczeń shell
  - Pomija providerów bez używalnego auth/profilu/modelu
  - Uruchamia standardowe warianty generowania obrazów przez współdzieloną możliwość runtime:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Obecnie objęci dołączeni providerzy:
  - `openai`
  - `google`
- Opcjonalne zawężanie:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Opcjonalne zachowanie auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić auth ze store profili i ignorować nadpisania tylko z env

## Live generowanie muzyki

- Test: `extensions/music-generation-providers.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Zakres:
  - Testuje współdzieloną dołączoną ścieżkę providera generowania muzyki
  - Obecnie obejmuje Google i MiniMax
  - Ładuje zmienne env providera z Twojego login shell (`~/.profile`) przed sondowaniem
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami auth, aby nieaktualne testowe klucze w `auth-profiles.json` nie maskowały rzeczywistych poświadczeń shell
  - Pomija providerów bez używalnego auth/profilu/modelu
  - Uruchamia oba zadeklarowane tryby runtime, gdy są dostępne:
    - `generate` z wejściem opartym wyłącznie na promcie
    - `edit`, gdy provider deklaruje `capabilities.edit.enabled`
  - Obecne pokrycie współdzielonej ścieżki:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: osobny plik live Comfy, nie ten współdzielony przebieg
- Opcjonalne zawężanie:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Opcjonalne zachowanie auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić auth ze store profili i ignorować nadpisania tylko z env

## Live generowanie wideo

- Test: `extensions/video-generation-providers.live.test.ts`
- Włączanie: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Zakres:
  - Testuje współdzieloną dołączoną ścieżkę providera generowania wideo
  - Domyślnie używa bezpiecznej dla wydania ścieżki smoke: providerzy bez FAL, jedno żądanie text-to-video na providera, jednosekundowy prompt z homarem i limit operacji per provider z `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (domyślnie `180000`)
  - Domyślnie pomija FAL, ponieważ opóźnienie kolejki po stronie providera może zdominować czas wydania; przekaż `--video-providers fal` lub `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, aby uruchomić go jawnie
  - Ładuje zmienne env providera z Twojego login shell (`~/.profile`) przed sondowaniem
  - Domyślnie używa kluczy API live/env przed zapisanymi profilami auth, aby nieaktualne testowe klucze w `auth-profiles.json` nie maskowały rzeczywistych poświadczeń shell
  - Pomija providerów bez używalnego auth/profilu/modelu
  - Domyślnie uruchamia tylko `generate`
  - Ustaw `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, aby uruchomić także zadeklarowane tryby transformacji, gdy są dostępne:
    - `imageToVideo`, gdy provider deklaruje `capabilities.imageToVideo.enabled` i wybrany provider/model akceptuje lokalne wejście obrazu oparte na buforze we współdzielonym przebiegu
    - `videoToVideo`, gdy provider deklaruje `capabilities.videoToVideo.enabled` i wybrany provider/model akceptuje lokalne wejście wideo oparte na buforze we współdzielonym przebiegu
  - Obecni providerzy `imageToVideo` zadeklarowani, ale pomijani we współdzielonym przebiegu:
    - `vydra`, ponieważ dołączony `veo3` obsługuje tylko tekst, a dołączony `kling` wymaga zdalnego URL obrazu
  - Pokrycie specyficzne dla providera Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ten plik uruchamia `veo3` text-to-video oraz ścieżkę `kling`, która domyślnie używa fixture zdalnego URL obrazu
  - Obecne pokrycie live `videoToVideo`:
    - tylko `runway`, gdy wybranym modelem jest `runway/gen4_aleph`
  - Obecni providerzy `videoToVideo` zadeklarowani, ale pomijani we współdzielonym przebiegu:
    - `alibaba`, `qwen`, `xai`, ponieważ te ścieżki obecnie wymagają zdalnych referencyjnych URL-i `http(s)` / MP4
    - `google`, ponieważ obecna współdzielona ścieżka Gemini/Veo używa lokalnego wejścia opartego na buforze i ta ścieżka nie jest akceptowana we współdzielonym przebiegu
    - `openai`, ponieważ obecna współdzielona ścieżka nie ma gwarancji dostępu do funkcji video inpaint/remix specyficznych dla organizacji
- Opcjonalne zawężanie:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, aby uwzględnić każdego providera w domyślnym przebiegu, w tym FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, aby zmniejszyć limit operacji każdego providera dla agresywnego przebiegu smoke
- Opcjonalne zachowanie auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby wymusić auth ze store profili i ignorować nadpisania tylko z env

## Harness live mediów

- Polecenie: `pnpm test:live:media`
- Cel:
  - Uruchamia współdzielone zestawy live obrazów, muzyki i wideo przez jeden natywny dla repozytorium entrypoint
  - Automatycznie ładuje brakujące zmienne env providera z `~/.profile`
  - Domyślnie automatycznie zawęża każdy zestaw do providerów, którzy obecnie mają używalne auth
  - Ponownie używa `scripts/test-live.mjs`, dzięki czemu zachowanie heartbeat i trybu cichego pozostaje spójne
- Przykłady:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runnery Docker (opcjonalne kontrole „działa w Linuxie”)

Te runnery Docker dzielą się na dwa koszyki:

- Runnery modeli live: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko pasujący plik live z kluczami profilu wewnątrz obrazu Docker repozytorium (`src/agents/models.profiles.live.test.ts` i `src/gateway/gateway-models.profiles.live.test.ts`), montując lokalny katalog konfiguracji i workspace (oraz pobierając `~/.profile`, jeśli jest zamontowane). Pasujące lokalne entrypointy to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Runnery live Docker domyślnie używają mniejszego limitu smoke, aby pełny przebieg Docker pozostał praktyczny:
  `test:docker:live-models` domyślnie używa `OPENCLAW_LIVE_MAX_MODELS=12`, a
  `test:docker:live-gateway` domyślnie używa `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Nadpisz te zmienne env, gdy
  jawnie chcesz większego, wyczerpującego skanu.
- `test:docker:all` buduje obraz live Docker raz przez `test:docker:live-build`, a następnie ponownie używa go dla dwóch ścieżek live Docker.
- Runnery smoke kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` i `test:docker:plugins` uruchamiają jeden lub więcej rzeczywistych kontenerów i weryfikują ścieżki integracji wyższego poziomu.

Runnery modeli live Docker dodatkowo bind-mountują tylko potrzebne katalogi auth CLI (lub wszystkie obsługiwane, gdy przebieg nie jest zawężony), a następnie kopiują je do katalogu domowego kontenera przed uruchomieniem, aby zewnętrzny OAuth CLI mógł odświeżać tokeny bez modyfikowania store auth hosta:

- Modele direct: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`)
- Smoke backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harnessu app-server Codex: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełne scaffoldowanie): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Sieć Gateway (dwa kontenery, auth WS + health): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Most kanału MCP (zasiany Gateway + most stdio + smoke surowej ramki powiadomień Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Pluginy (smoke instalacji + alias `/plugin` + semantyka restartu pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)

Runnery modeli live Docker dodatkowo bind-mountują bieżący checkout tylko do odczytu i
przygotowują go do tymczasowego katalogu roboczego wewnątrz kontenera. Dzięki temu obraz runtime
pozostaje lekki, a jednocześnie Vitest działa na dokładnie Twoich lokalnych źródłach/konfiguracji.
Krok przygotowania pomija duże lokalne cache i wyniki budowania aplikacji, takie jak
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne dla aplikacji katalogi `.build` lub
katalogi wyników Gradle, dzięki czemu uruchomienia live Docker nie tracą minut na kopiowanie
artefaktów specyficznych dla maszyny.
Ustawiają też `OPENCLAW_SKIP_CHANNELS=1`, aby sondy live Gateway nie uruchamiały
rzeczywistych workerów kanałów Telegram/Discord itd. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekaż także
`OPENCLAW_LIVE_GATEWAY_*`, gdy chcesz zawęzić lub wykluczyć pokrycie gateway
live z tej ścieżki Docker.
`test:docker:openwebui` to smoke zgodności wyższego poziomu: uruchamia
kontener Gateway OpenClaw z włączonymi endpointami HTTP zgodnymi z OpenAI,
uruchamia przypięty kontener Open WebUI względem tego Gateway, loguje się przez
Open WebUI, weryfikuje, że `/api/models` udostępnia `openclaw/default`, a następnie wysyła
rzeczywiste żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Pierwsze uruchomienie może być zauważalnie wolniejsze, ponieważ Docker może potrzebować pobrać
obraz Open WebUI, a Open WebUI może potrzebować zakończyć własny cold-start setup.
Ta ścieżka oczekuje używalnego klucza modelu live, a `OPENCLAW_PROFILE_FILE`
(domyslnie `~/.profile`) jest podstawowym sposobem dostarczenia go w uruchomieniach dockerowych.
Pomyślne uruchomienia wypisują mały ładunek JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczne i nie potrzebuje
rzeczywistego konta Telegram, Discord ani iMessage. Uruchamia zasiany kontener
Gateway, startuje drugi kontener uruchamiający `openclaw mcp serve`, a następnie
weryfikuje wykrywanie routowanych rozmów, odczyty transkryptów, metadane załączników,
zachowanie kolejki zdarzeń live, routing wysyłania wychodzącego oraz powiadomienia w stylu Claude dotyczące kanału +
uprawnień przez rzeczywisty most MCP stdio. Kontrola powiadomień
sprawdza bezpośrednio surowe ramki stdio MCP, więc smoke weryfikuje to, co most
faktycznie emituje, a nie tylko to, co akurat ujawnia konkretny SDK klienta.

Ręczny smoke ACP plain-language thread (nie CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt dla przepływów regresji/debugowania. Może być ponownie potrzebny do walidacji routingu wątków ACP, więc go nie usuwaj.

Przydatne zmienne env:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowane do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowane do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (domyślnie: `~/.profile`) montowane do `/home/node/.profile` i pobierane przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, aby weryfikować tylko zmienne env pobrane z `OPENCLAW_PROFILE_FILE`, używając tymczasowych katalogów config/workspace i bez montowań zewnętrznego auth CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowane do `/home/node/.npm-global` dla cache'owanych instalacji CLI w Dockerze
- Zewnętrzne katalogi/pliki auth CLI pod `$HOME` są montowane tylko do odczytu pod `/host-auth...`, a następnie kopiowane do `/home/node/...` przed startem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone przebiegi providera montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Nadpisanie ręczne przez `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` lub listę rozdzielaną przecinkami, np. `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić przebieg
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować providerów wewnątrz kontenera
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby ponownie użyć istniejącego obrazu `openclaw:local-live` dla ponownych uruchomień, które nie wymagają przebudowy
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby upewnić się, że poświadczenia pochodzą ze store profili (a nie z env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model udostępniany przez Gateway dla smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt sprawdzania nonce używany przez smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Sprawdzenie poprawności dokumentacji

Uruchom kontrole dokumentacji po edycji dokumentów: `pnpm check:docs`.
Uruchom pełną walidację kotwic Mintlify, gdy potrzebujesz też sprawdzeń nagłówków w obrębie strony: `pnpm docs:check-links:anchors`.

## Regresja offline (bezpieczna dla CI)

To regresje „prawdziwego pipeline” bez prawdziwych providerów:

- Wywoływanie narzędzi Gateway (mock OpenAI, prawdziwy Gateway + pętla agenta): `src/gateway/gateway.test.ts` (przypadek: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Kreator Gateway (WS `wizard.start`/`wizard.next`, wymuszone zapisy config + auth): `src/gateway/gateway.test.ts` (przypadek: "runs wizard over ws and writes auth token config")

## Ewaluacje niezawodności agenta (Skills)

Mamy już kilka bezpiecznych dla CI testów, które zachowują się jak „ewaluacje niezawodności agenta”:

- Mock wywoływania narzędzi przez rzeczywisty Gateway + pętlę agenta (`src/gateway/gateway.test.ts`).
- Pełne przepływy kreatora, które weryfikują okablowanie sesji i efekty konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla Skills (zobacz [Skills](/pl/tools/skills)):

- **Decyzyjność:** gdy Skills są wymienione w promptcie, czy agent wybiera właściwe Skill (albo unika nieistotnych)?
- **Zgodność:** czy agent czyta `SKILL.md` przed użyciem i wykonuje wymagane kroki/argumenty?
- **Kontrakty przepływu pracy:** scenariusze wieloturowe, które potwierdzają kolejność narzędzi, przenoszenie historii sesji i granice sandboxa.

Przyszłe ewaluacje powinny najpierw pozostać deterministyczne:

- Runner scenariuszy używający mock providerów do potwierdzania wywołań narzędzi + kolejności, odczytów plików Skill i okablowania sesji.
- Mały zestaw scenariuszy skupionych na Skills (użyj vs unikaj, bramkowanie, prompt injection).
- Opcjonalne ewaluacje live (opt-in, ograniczane przez env) dopiero po wdrożeniu zestawu bezpiecznego dla CI.

## Testy kontraktowe (kształt pluginu i kanału)

Testy kontraktowe weryfikują, że każdy zarejestrowany plugin i kanał jest zgodny ze swoim
kontraktem interfejsu. Iterują po wszystkich wykrytych pluginach i uruchamiają zestaw
asercji kształtu i zachowania. Domyślna ścieżka unit `pnpm test` celowo
pomija te współdzielone pliki styku i smoke; uruchamiaj polecenia kontraktowe jawnie,
gdy dotykasz współdzielonych powierzchni kanałów lub providerów.

### Polecenia

- Wszystkie kontrakty: `pnpm test:contracts`
- Tylko kontrakty kanałów: `pnpm test:contracts:channels`
- Tylko kontrakty providerów: `pnpm test:contracts:plugins`

### Kontrakty kanałów

Znajdują się w `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Podstawowy kształt pluginu (id, name, capabilities)
- **setup** - Kontrakt kreatora konfiguracji
- **session-binding** - Zachowanie wiązania sesji
- **outbound-payload** - Struktura ładunku wiadomości
- **inbound** - Obsługa wiadomości przychodzących
- **actions** - Handlery akcji kanału
- **threading** - Obsługa ID wątku
- **directory** - API katalogu/listy
- **group-policy** - Egzekwowanie polityki grup

### Kontrakty statusu providerów

Znajdują się w `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondy statusu kanału
- **registry** - Kształt rejestru pluginów

### Kontrakty providerów

Znajdują się w `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrakt przepływu auth
- **auth-choice** - Wybór/selekcja auth
- **catalog** - API katalogu modeli
- **discovery** - Wykrywanie pluginów
- **loader** - Ładowanie pluginów
- **runtime** - Runtime providera
- **shape** - Kształt/interfejs pluginu
- **wizard** - Kreator konfiguracji

### Kiedy uruchamiać

- Po zmianie eksportów lub podścieżek plugin-sdk
- Po dodaniu lub modyfikacji pluginu kanału lub providera
- Po refaktoryzacji rejestracji lub wykrywania pluginów

Testy kontraktowe uruchamiają się w CI i nie wymagają prawdziwych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem providera/modelu wykryty w live:

- Dodaj regresję bezpieczną dla CI, jeśli to możliwe (mock/stub providera albo przechwycenie dokładnej transformacji kształtu żądania)
- Jeśli z natury jest to tylko live (limity szybkości, polityki auth), zachowaj test live wąski i opt-in przez zmienne env
- Preferuj celowanie w najmniejszą warstwę, która wychwytuje błąd:
  - błąd konwersji/replay żądania providera → test modeli direct
  - błąd pipeline sesji/historii/narzędzi Gateway → gateway live smoke lub bezpieczny dla CI mock test Gateway
- Zabezpieczenie SecretRef traversal:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza jeden przykładowy cel na klasę SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie potwierdza, że exec ids segmentów traversalu są odrzucane.
  - Jeśli dodasz nową rodzinę celów SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo kończy się niepowodzeniem dla niesklasyfikowanych target id, aby nowych klas nie dało się po cichu pominąć.
