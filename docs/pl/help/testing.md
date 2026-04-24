---
read_when:
    - Uruchamianie testów lokalnie lub w CI
    - Dodawanie regresji dla błędów modeli/providerów
    - Debugowanie zachowania Gateway + agenta
summary: 'Zestaw testowy: pakiety unit/e2e/live, uruchomienia Docker i zakres każdego testu'
title: Testowanie
x-i18n:
    generated_at: "2026-04-24T09:14:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c88325e0edb49437e7faa2eaf730eb3be59054d8c4bb86e56a42bc39a29a2b1
    source_path: help/testing.md
    workflow: 15
---

OpenClaw ma trzy pakiety Vitest (unit/integration, e2e, live) oraz niewielki zestaw uruchomień Docker. Ten dokument to przewodnik „jak testujemy”:

- Co obejmuje każdy pakiet (i czego celowo _nie_ obejmuje).
- Jakie polecenia uruchamiać w typowych przepływach pracy (lokalnie, przed push, debugowanie).
- Jak testy live wykrywają poświadczenia i wybierają modele/providerów.
- Jak dodawać regresje dla rzeczywistych problemów modeli/providerów.

## Szybki start

W większość dni:

- Pełna bramka (oczekiwana przed push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Szybsze lokalne uruchomienie pełnego pakietu na wydajnej maszynie: `pnpm test:max`
- Bezpośrednia pętla watch Vitest: `pnpm test:watch`
- Bezpośrednie wskazywanie pliku teraz kieruje też ścieżki extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Gdy iterujesz nad pojedynczą awarią, najpierw preferuj uruchomienia celowane.
- Strona QA oparta na Docker: `pnpm qa:lab:up`
- Linia QA oparta na Linux VM: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Gdy dotykasz testów albo chcesz mieć większą pewność:

- Bramka pokrycia: `pnpm test:coverage`
- Pakiet E2E: `pnpm test:e2e`

Podczas debugowania rzeczywistych providerów/modeli (wymaga prawdziwych poświadczeń):

- Pakiet live (modele + probe narzędzi/obrazów gateway): `pnpm test:live`
- Uruchom po cichu jeden plik live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Sweep modeli live w Docker: `pnpm test:docker:live-models`
  - Każdy wybrany model uruchamia teraz turę tekstową plus mały probe w stylu odczytu pliku.
    Modele, których metadane deklarują wejście `image`, uruchamiają też małą turę obrazową.
    Wyłącz dodatkowe probe przez `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` lub
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, gdy izolujesz awarie providera.
  - Pokrycie CI: codzienne `OpenClaw Scheduled Live And E2E Checks` oraz ręczne
    `OpenClaw Release Checks` wywołują współużywany workflow live/E2E z
    `include_live_suites: true`, co obejmuje osobne zadania macierzy modeli live w Docker
    podzielone na shardy według providera.
  - Dla ukierunkowanych ponownych uruchomień CI wywołaj `OpenClaw Live And E2E Checks (Reusable)`
    z `include_live_suites: true` i `live_models_only: true`.
  - Dodawaj nowe sekrety providerów o wysokim sygnale do `scripts/ci-hydrate-live-auth.sh`
    oraz `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` i jego
    wywołań schedule/release.
- Natywny smoke Codex bound-chat: `pnpm test:docker:live-codex-bind`
  - Uruchamia linię live Docker względem ścieżki app-server Codex, wiąże syntetyczny
    Slack DM przez `/codex bind`, wykonuje `/codex fast` i
    `/codex permissions`, a następnie weryfikuje, że zwykła odpowiedź i załącznik obrazu
    przechodzą przez natywne powiązanie Plugin zamiast ACP.
- Smoke kosztów Moonshot/Kimi: przy ustawionym `MOONSHOT_API_KEY` uruchom
  `openclaw models list --provider moonshot --json`, a następnie izolowane
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  względem `moonshot/kimi-k2.6`. Zweryfikuj, że JSON raportuje Moonshot/K2.6 i że
  transkrypt asystenta przechowuje znormalizowane `usage.cost`.

Wskazówka: gdy potrzebujesz tylko jednego zawodzącego przypadku, zawężaj testy live przez zmienne env allowlisty opisane poniżej.

## Runnery specyficzne dla QA

Te polecenia znajdują się obok głównych pakietów testowych, gdy potrzebujesz realizmu qa-lab:

CI uruchamia QA Lab w dedykowanych workflow. `Parity gate` uruchamia się dla pasujących PR-ów
i z ręcznego dispatch z mock providerami. `QA-Lab - All Lanes` uruchamia się nocą na
`main` i z ręcznego dispatch z mock parity gate, linią live Matrix oraz linią
live Telegram zarządzaną przez Convex jako równoległe zadania. `OpenClaw Release Checks`
uruchamia te same linie przed zatwierdzeniem wydania.

- `pnpm openclaw qa suite`
  - Uruchamia scenariusze QA oparte na repo bezpośrednio na hoście.
  - Domyślnie uruchamia równolegle wiele wybranych scenariuszy z izolowanymi
    workerami gateway. `qa-channel` domyślnie używa współbieżności 4 (ograniczonej przez
    liczbę wybranych scenariuszy). Użyj `--concurrency <count>`, aby dostroić liczbę workerów,
    albo `--concurrency 1` dla starszej linii sekwencyjnej.
  - Kończy się kodem niezerowym, gdy którykolwiek scenariusz zawiedzie. Użyj `--allow-failures`, gdy
    chcesz artefakty bez kończenia z błędem.
  - Obsługuje tryby providera `live-frontier`, `mock-openai` i `aimock`.
    `aimock` uruchamia lokalny serwer providera oparty na AIMock do eksperymentalnego
    pokrycia fixture i mocków protokołu bez zastępowania świadomej scenariuszy linii `mock-openai`.
- `pnpm openclaw qa suite --runner multipass`
  - Uruchamia ten sam pakiet QA w jednorazowej Linux VM Multipass.
  - Zachowuje takie samo zachowanie wyboru scenariuszy jak `qa suite` na hoście.
  - Współużywa te same flagi wyboru providera/modelu co `qa suite`.
  - Uruchomienia live przekazują obsługiwane wejścia auth QA, które są praktyczne dla gościa:
    klucze providerów oparte na env, ścieżkę konfiguracji live providera QA oraz `CODEX_HOME`, gdy jest obecne.
  - Katalogi wyjściowe muszą pozostać pod katalogiem głównym repo, aby gość mógł zapisywać z powrotem przez
    zamontowany obszar roboczy.
  - Zapisuje zwykły raport QA + podsumowanie oraz logi Multipass w
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Uruchamia opartą na Docker stronę QA do pracy QA w stylu operatora.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Buduje tarball npm z bieżącego checkoutu, instaluje go globalnie w
    Docker, uruchamia nieinteraktywne onboarding z kluczem API OpenAI, konfiguruje domyślnie Telegram,
    weryfikuje, że włączenie Plugin instaluje zależności runtime na żądanie,
    uruchamia doctor i jedną lokalną turę agenta przeciwko mockowanemu endpointowi OpenAI.
  - Użyj `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, aby uruchomić tę samą linię
    instalacji pakietowej z Discord.
- `pnpm test:docker:npm-telegram-live`
  - Instaluje opublikowany pakiet OpenClaw w Docker, uruchamia onboarding
    zainstalowanego pakietu, konfiguruje Telegram przez zainstalowane CLI, a następnie ponownie używa
    linii live Telegram QA z tym zainstalowanym pakietem jako SUT Gateway.
  - Domyślnie używa `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Używa tych samych poświadczeń env Telegram albo źródła poświadczeń Convex co
    `pnpm openclaw qa telegram`. Dla automatyzacji CI/release ustaw
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` i sekret roli. Jeśli
    `OPENCLAW_QA_CONVEX_SITE_URL` oraz sekret roli Convex są obecne w CI,
    wrapper Docker wybierze Convex automatycznie.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` nadpisuje współdzielone
    `OPENCLAW_QA_CREDENTIAL_ROLE` tylko dla tej linii.
  - GitHub Actions udostępnia tę linię jako ręczny workflow maintainera
    `NPM Telegram Beta E2E`. Nie uruchamia się przy merge. Workflow używa
    środowiska `qa-live-shared` i dzierżaw poświadczeń CI Convex.
- `pnpm test:docker:bundled-channel-deps`
  - Pakuje i instaluje bieżącą kompilację OpenClaw w Docker, uruchamia Gateway
    ze skonfigurowanym OpenAI, a następnie włącza dołączone kanały/Plugins przez edycje konfiguracji.
  - Weryfikuje, że wykrywanie setup pozostawia nieskonfigurowane zależności runtime Plugin
    nieobecne, że pierwszy skonfigurowany Gateway lub doctor instaluje zależności runtime każdego dołączonego Plugin na żądanie oraz że drugi restart nie reinstaluje zależności już aktywowanych.
  - Instaluje też znaną starszą bazę npm, włącza Telegram przed uruchomieniem
    `openclaw update --tag <candidate>` i weryfikuje, że doctor po aktualizacji kandydata
    naprawia zależności runtime dołączonych kanałów bez naprawy postinstall po stronie harness.
- `pnpm openclaw qa aimock`
  - Uruchamia tylko lokalny serwer providera AIMock do bezpośredniego smoke protokołu.
- `pnpm openclaw qa matrix`
  - Uruchamia linię live QA Matrix przeciwko jednorazowemu homeserverowi Tuwunel opartemu na Docker.
  - Ten host QA jest dziś tylko dla repo/dev. Spakowane instalacje OpenClaw nie dostarczają
    `qa-lab`, więc nie udostępniają `openclaw qa`.
  - Checkouty repo ładują dołączony runner bezpośrednio; nie jest potrzebny osobny krok instalacji Plugin.
  - Przygotowuje trzech tymczasowych użytkowników Matrix (`driver`, `sut`, `observer`) oraz jeden prywatny pokój, a następnie uruchamia podrzędny gateway QA z prawdziwym Plugin Matrix jako transportem SUT.
  - Domyślnie używa przypiętego stabilnego obrazu Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Nadpisz przez `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, gdy chcesz przetestować inny obraz.
  - Matrix nie udostępnia współdzielonych flag źródła poświadczeń, ponieważ linia przygotowuje jednorazowych użytkowników lokalnie.
  - Zapisuje raport QA Matrix, podsumowanie, artefakt observed-events oraz połączony log stdout/stderr w `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Uruchamia linię live QA Telegram przeciwko prawdziwej prywatnej grupie przy użyciu tokenów bota driver i SUT z env.
  - Wymaga `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` i `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Identyfikator grupy musi być numerycznym identyfikatorem czatu Telegram.
  - Obsługuje `--credential-source convex` dla współdzielonych poświadczeń z puli. Domyślnie używaj trybu env albo ustaw `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, aby włączyć współdzielone dzierżawy.
  - Kończy się kodem niezerowym, gdy którykolwiek scenariusz zawiedzie. Użyj `--allow-failures`, gdy
    chcesz artefakty bez kończenia z błędem.
  - Wymaga dwóch różnych botów w tej samej prywatnej grupie, przy czym bot SUT musi udostępniać nazwę użytkownika Telegram.
  - Dla stabilnej obserwacji bot-do-bota włącz Bot-to-Bot Communication Mode w `@BotFather` dla obu botów i upewnij się, że bot driver może obserwować ruch botów w grupie.
  - Zapisuje raport QA Telegram, podsumowanie i artefakt observed-messages w `.artifacts/qa-e2e/...`. Scenariusze odpowiedzi zawierają RTT od żądania wysłania przez driver do zaobserwowanej odpowiedzi SUT.

Linie transportu live współdzielą jeden standardowy kontrakt, aby nowe transporty nie dryfowały:

`qa-channel` pozostaje szerokim syntetycznym pakietem QA i nie jest częścią macierzy pokrycia transportów live.

| Linia    | Canary | Wymaganie wzmianki | Blokada allowlisty | Odpowiedź najwyższego poziomu | Wznowienie po restarcie | Dalsza odpowiedź w wątku | Izolacja wątku | Obserwacja reakcji | Polecenie pomocy |
| -------- | ------ | ------------------ | ------------------ | ----------------------------- | ----------------------- | ------------------------ | -------------- | ------------------ | ---------------- |
| Matrix   | x      | x                  | x                  | x                             | x                       | x                        | x              | x                  |                  |
| Telegram | x      |                    |                    |                               |                         |                          |                |                    | x                |

### Współdzielone poświadczenia Telegram przez Convex (v1)

Gdy dla `openclaw qa telegram` włączono `--credential-source convex` (lub `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`),
QA lab uzyskuje wyłączną dzierżawę z puli obsługiwanej przez Convex, utrzymuje heartbeat
tej dzierżawy podczas działania linii i zwalnia ją przy zamykaniu.

Referencyjny szkielet projektu Convex:

- `qa/convex-credential-broker/`

Wymagane zmienne env:

- `OPENCLAW_QA_CONVEX_SITE_URL` (na przykład `https://your-deployment.convex.site`)
- Jeden sekret dla wybranej roli:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` dla `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` dla `ci`
- Wybór roli poświadczeń:
  - CLI: `--credential-role maintainer|ci`
  - Domyślna wartość env: `OPENCLAW_QA_CREDENTIAL_ROLE` (domyślnie `ci` w CI, w przeciwnym razie `maintainer`)

Opcjonalne zmienne env:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (domyślnie `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (domyślnie `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (domyślnie `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (domyślnie `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (domyślnie `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (opcjonalny trace id)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` zezwala na loopback `http://` URL-e Convex tylko dla lokalnego developmentu.

`OPENCLAW_QA_CONVEX_SITE_URL` powinno normalnie używać `https://`.

Polecenia administracyjne maintainera (dodawanie/usuwanie/listowanie puli) wymagają
konkretnie `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Pomocnicze polecenia CLI dla maintainerów:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Użyj `--json`, aby uzyskać dane wyjściowe czytelne dla maszyn w skryptach i narzędziach CI.

Domyślny kontrakt punktu końcowego (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Żądanie: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sukces: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Wyczerpane / do ponowienia: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
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
- `groupId` musi być ciągiem liczbowego identyfikatora czatu Telegram.
- `admin/add` waliduje ten kształt dla `kind: "telegram"` i odrzuca nieprawidłowe ładunki.

### Dodawanie kanału do QA

Dodanie kanału do systemu markdown QA wymaga dokładnie dwóch rzeczy:

1. Adaptera transportowego dla kanału.
2. Pakietu scenariuszy, który ćwiczy kontrakt kanału.

Nie dodawaj nowego głównego korzenia poleceń QA, gdy współdzielony host `qa-lab` może
obsłużyć ten przepływ.

`qa-lab` zarządza współdzieloną mechaniką hosta:

- korzeniem poleceń `openclaw qa`
- uruchamianiem i zamykaniem pakietu
- współbieżnością workerów
- zapisywaniem artefaktów
- generowaniem raportów
- wykonywaniem scenariuszy
- aliasami zgodności dla starszych scenariuszy `qa-channel`

Plugin runnerów zarządzają kontraktem transportu:

- tym, jak `openclaw qa <runner>` jest montowane pod współdzielonym korzeniem `qa`
- tym, jak gateway jest konfigurowany dla danego transportu
- tym, jak sprawdzana jest gotowość
- tym, jak wstrzykiwane są zdarzenia przychodzące
- tym, jak obserwowane są wiadomości wychodzące
- tym, jak ujawniane są transkrypty i znormalizowany stan transportu
- tym, jak wykonywane są akcje oparte na transporcie
- tym, jak obsługiwane są reset lub czyszczenie specyficzne dla transportu

Minimalny próg wdrożenia dla nowego kanału to:

1. Pozostaw `qa-lab` jako właściciela współdzielonego korzenia `qa`.
2. Zaimplementuj runner transportu na współdzielonym punkcie styku hosta `qa-lab`.
3. Zachowaj mechanikę specyficzną dla transportu wewnątrz Plugin runnera lub harness kanału.
4. Zamontuj runner jako `openclaw qa <runner>` zamiast rejestrować konkurencyjny korzeń poleceń.
   Plugin runnerów powinny deklarować `qaRunners` w `openclaw.plugin.json` i eksportować pasującą tablicę `qaRunnerCliRegistrations` z `runtime-api.ts`.
   Utrzymuj `runtime-api.ts` lekkie; leniwe CLI i wykonanie runnera powinny pozostawać za oddzielnymi punktami wejścia.
5. Twórz lub dostosowuj scenariusze markdown w tematycznych katalogach `qa/scenarios/`.
6. Używaj ogólnych helperów scenariuszy dla nowych scenariuszy.
7. Zachowaj działanie istniejących aliasów zgodności, chyba że repo przechodzi celową migrację.

Reguła decyzyjna jest ścisła:

- Jeśli zachowanie można wyrazić raz w `qa-lab`, umieść je w `qa-lab`.
- Jeśli zachowanie zależy od jednego transportu kanału, trzymaj je w Plugin runnera lub harness tego Plugin.
- Jeśli scenariusz potrzebuje nowej możliwości, z której może skorzystać więcej niż jeden kanał, dodaj ogólny helper zamiast gałęzi specyficznej dla kanału w `suite.ts`.
- Jeśli zachowanie ma sens tylko dla jednego transportu, utrzymuj scenariusz jako transport-specyficzny i zaznacz to jasno w kontrakcie scenariusza.

Preferowane nazwy ogólnych helperów dla nowych scenariuszy to:

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

Nowa praca nad kanałami powinna używać ogólnych nazw helperów.
Aliasy zgodności istnieją, aby uniknąć migracji typu flag day, a nie jako model
dla tworzenia nowych scenariuszy.

## Pakiety testów (co działa gdzie)

Myśl o pakietach jako o „rosnącym realizmie” (i rosnącej niestabilności/koszcie):

### Unit / integration (domyślny)

- Polecenie: `pnpm test`
- Konfiguracja: uruchomienia nietargetowane używają zestawu shardów `vitest.full-*.config.ts` i mogą rozwijać shardy wieloprojektowe do konfiguracji per project na potrzeby harmonogramowania równoległego
- Pliki: inwentarze core/unit w `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` oraz dozwolone testy node `ui` objęte przez `vitest.unit.config.ts`
- Zakres:
  - Czyste testy jednostkowe
  - Testy integracyjne in-process (auth gateway, routing, narzędzia, parsowanie, konfiguracja)
  - Deterministyczne regresje dla znanych błędów
- Oczekiwania:
  - Uruchamia się w CI
  - Nie są wymagane prawdziwe klucze
  - Powinno być szybkie i stabilne
    <AccordionGroup>
    <Accordion title="Projekty, shardy i linie zakresowe"> - Nietargetowane `pnpm test` uruchamia dwanaście mniejszych konfiguracji shardów (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) zamiast jednego ogromnego natywnego procesu root-project. Zmniejsza to szczytowe RSS na obciążonych maszynach i zapobiega temu, by prace auto-reply/extension zagłodziły niezwiązane pakiety. - `pnpm test --watch` nadal używa natywnego grafu projektów root `vitest.config.ts`, ponieważ pętla watch z wieloma shardami nie jest praktyczna. - `pnpm test`, `pnpm test:watch` i `pnpm test:perf:imports` najpierw kierują jawne cele plików/katalogów przez linie zakresowe, więc `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` unika pełnego kosztu uruchomienia projektu root. - `pnpm test:changed` rozwija zmienione ścieżki git do tych samych linii zakresowych, gdy diff dotyczy tylko routowalnych plików źródłowych/testowych; edycje config/setup nadal wracają do szerokiego ponownego uruchomienia projektu root. - `pnpm check:changed` to normalna inteligentna lokalna bramka dla wąskich zmian. Klasyfikuje diff do core, testów core, extensions, testów extension, apps, docs, metadanych release i tooling, a następnie uruchamia pasujące linie typecheck/lint/test. Zmiany publicznego Plugin SDK i kontraktu pluginów obejmują jedną walidację extension, ponieważ extension zależą od tych kontraktów core. Zmiany tylko w metadanych release przy podbiciu wersji uruchamiają ukierunkowane sprawdzenia wersji/config/zależności root zamiast pełnego pakietu, z guardem odrzucającym zmiany pakietów poza polem wersji najwyższego poziomu. - Lekkie importowo testy jednostkowe agentów, commands, plugins, helperów auto-reply, `plugin-sdk` i podobnych czystych obszarów narzędziowych trafiają do linii `unit-fast`, która pomija `test/setup-openclaw-runtime.ts`; pliki stanowe/runtime-heavy pozostają na istniejących liniach. - Wybrane pliki źródłowe helperów `plugin-sdk` i `commands` również mapują uruchomienia trybu changed do jawnych testów rodzeństwa w tych lekkich liniach, dzięki czemu edycje helperów nie wymagają ponownego uruchamiania pełnego ciężkiego pakietu dla tego katalogu. - `auto-reply` ma trzy dedykowane koszyki: helpery core najwyższego poziomu, testy integracyjne najwyższego poziomu `reply.*` oraz poddrzewo `src/auto-reply/reply/**`. Dzięki temu najcięższa praca harness reply jest oddzielona od tanich testów status/chunk/token.
    </Accordion>

      <Accordion title="Pokrycie embedded runner">
        - Gdy zmieniasz wejścia wykrywania message-tool lub kontekst środowiska uruchomieniowego Compaction,
          zachowaj oba poziomy pokrycia.
        - Dodawaj ukierunkowane regresje helperów dla czystych granic routingu i normalizacji.
        - Utrzymuj zdrowe pakiety integracyjne embedded runner:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` oraz
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
        - Te pakiety weryfikują, że scoped ids i zachowanie Compaction nadal przepływają
          przez prawdziwe ścieżki `run.ts` / `compact.ts`; testy tylko helperów nie są
          wystarczającym zamiennikiem dla tych ścieżek integracyjnych.
      </Accordion>

      <Accordion title="Domyślne ustawienia puli i izolacji Vitest">
        - Bazowa konfiguracja Vitest domyślnie używa `threads`.
        - Współdzielona konfiguracja Vitest ustawia `isolate: false` i używa
          runnera bez izolacji w projektach root, konfiguracjach e2e i live.
        - Główna linia UI zachowuje konfigurację `jsdom` i optimizer, ale także działa na
          współdzielonym runnerze bez izolacji.
        - Każdy shard `pnpm test` dziedziczy te same domyślne ustawienia `threads` + `isolate: false`
          ze współdzielonej konfiguracji Vitest.
        - `scripts/run-vitest.mjs` domyślnie dodaje `--no-maglev` dla procesów podrzędnych Node Vitest,
          aby zmniejszyć churn kompilacji V8 podczas dużych lokalnych uruchomień.
          Ustaw `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, aby porównać ze stockowym
          zachowaniem V8.
      </Accordion>

      <Accordion title="Szybka lokalna iteracja">
        - `pnpm changed:lanes` pokazuje, które linie architektoniczne uruchamia diff.
        - Hook pre-commit robi tylko formatowanie. Ponownie stage’uje sformatowane pliki i
          nie uruchamia lint, typecheck ani testów.
        - Uruchom jawnie `pnpm check:changed` przed przekazaniem lub push, gdy
          potrzebujesz inteligentnej lokalnej bramki. Zmiany publicznego Plugin SDK i kontraktu pluginów
          obejmują jedną walidację extension.
        - `pnpm test:changed` kieruje ruch przez linie zakresowe, gdy zmienione ścieżki
          dają się czysto zmapować do mniejszego pakietu.
        - `pnpm test:max` i `pnpm test:changed:max` zachowują ten sam routing,
          tylko z wyższym limitem workerów.
        - Automatyczne skalowanie workerów lokalnych jest celowo konserwatywne i wycofuje się,
          gdy średnie obciążenie hosta jest już wysokie, dzięki czemu wiele współbieżnych
          uruchomień Vitest domyślnie robi mniejsze szkody.
        - Bazowa konfiguracja Vitest oznacza projekty/pliki config jako
          `forceRerunTriggers`, aby ponowne uruchomienia trybu changed pozostawały poprawne, gdy zmienia się okablowanie testów.
        - Konfiguracja utrzymuje włączone `OPENCLAW_VITEST_FS_MODULE_CACHE` na
          obsługiwanych hostach; ustaw `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, jeśli chcesz
          jedną jawną lokalizację cache do bezpośredniego profilowania.
      </Accordion>

      <Accordion title="Debugowanie wydajności">
        - `pnpm test:perf:imports` włącza raportowanie czasu importów Vitest oraz
          dane wyjściowe rozbicia importów.
        - `pnpm test:perf:imports:changed` ogranicza ten sam widok profilowania do
          plików zmienionych od `origin/main`.
        - Gdy jeden gorący test nadal spędza większość czasu na importach startowych,
          trzymaj ciężkie zależności za wąskim lokalnym punktem styku `*.runtime.ts` i
          mockuj ten punkt styku bezpośrednio zamiast robić głębokie importy helperów runtime
          tylko po to, by przepuścić je przez `vi.mock(...)`.
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` porównuje routowane
          `test:changed` z natywną ścieżką root-project dla tego zatwierdzonego diffu
          i wypisuje czas ścienny oraz maksymalny RSS macOS.
        - `pnpm test:perf:changed:bench -- --worktree` benchmarkuje bieżące brudne drzewo,
          przepuszczając listę zmienionych plików przez
          `scripts/test-projects.mjs` i główną konfigurację Vitest.
        - `pnpm test:perf:profile:main` zapisuje profil CPU głównego wątku dla
          narzutu startowego i transformacji Vitest/Vite.
        - `pnpm test:perf:profile:runner` zapisuje profile CPU+heap runnera dla
          pakietu unit przy wyłączonej równoległości plików.
      </Accordion>
    </AccordionGroup>

### Stabilność (gateway)

- Polecenie: `pnpm test:stability:gateway`
- Konfiguracja: `vitest.gateway.config.ts`, wymuszone do jednego workera
- Zakres:
  - Uruchamia prawdziwy loopback Gateway z domyślnie włączoną diagnostyką
  - Przepuszcza syntetyczny churn wiadomości gateway, memory i dużych ładunków przez ścieżkę zdarzeń diagnostycznych
  - Odpytuje `diagnostics.stability` przez Gateway WS RPC
  - Obejmuje helpery trwałości pakietu stabilności diagnostycznej
  - Asertywnie sprawdza, że recorder pozostaje ograniczony, syntetyczne próbki RSS pozostają poniżej budżetu ciśnienia, a głębokości kolejek per session wracają do zera
- Oczekiwania:
  - Bezpieczne dla CI i bez kluczy
  - Wąska linia do dalszej pracy nad regresjami stabilności, a nie zamiennik pełnego pakietu Gateway

### E2E (smoke gateway)

- Polecenie: `pnpm test:e2e`
- Konfiguracja: `vitest.e2e.config.ts`
- Pliki: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` i testy E2E dołączonych Plugin pod `extensions/`
- Domyślne ustawienia runtime:
  - Używa Vitest `threads` z `isolate: false`, zgodnie z resztą repo.
  - Używa adaptacyjnych workerów (CI: do 2, lokalnie: domyślnie 1).
  - Domyślnie działa w trybie silent, aby zmniejszyć narzut I/O konsoli.
- Przydatne nadpisania:
  - `OPENCLAW_E2E_WORKERS=<n>` aby wymusić liczbę workerów (ograniczoną do 16).
  - `OPENCLAW_E2E_VERBOSE=1`, aby ponownie włączyć szczegółowe dane wyjściowe konsoli.
- Zakres:
  - Zachowanie end-to-end wielu instancji gateway
  - Powierzchnie WebSocket/HTTP, Pairing Node i cięższa sieć
- Oczekiwania:
  - Uruchamia się w CI (gdy jest włączone w potoku)
  - Nie są wymagane prawdziwe klucze
  - Więcej ruchomych części niż w testach unit (może być wolniejsze)

### E2E: smoke backendu OpenShell

- Polecenie: `pnpm test:e2e:openshell`
- Plik: `extensions/openshell/src/backend.e2e.test.ts`
- Zakres:
  - Uruchamia izolowany gateway OpenShell na hoście przez Docker
  - Tworzy sandbox z tymczasowego lokalnego Dockerfile
  - Ćwiczy backend OpenShell OpenClaw przez prawdziwe `sandbox ssh-config` + SSH exec
  - Weryfikuje zdalno-kanoniczne zachowanie systemu plików przez most fs sandbox
- Oczekiwania:
  - Tylko opt-in; nie jest częścią domyślnego uruchomienia `pnpm test:e2e`
  - Wymaga lokalnego CLI `openshell` i działającego demona Docker
  - Używa izolowanych `HOME` / `XDG_CONFIG_HOME`, a następnie niszczy testowy gateway i sandbox
- Przydatne nadpisania:
  - `OPENCLAW_E2E_OPENSHELL=1`, aby włączyć test podczas ręcznego uruchamiania szerszego pakietu e2e
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, aby wskazać niestandardowe binarium CLI lub skrypt wrappera

### Live (prawdziwi providerzy + prawdziwe modele)

- Polecenie: `pnpm test:live`
- Konfiguracja: `vitest.live.config.ts`
- Pliki: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` oraz testy live dołączonych Plugin pod `extensions/`
- Domyślnie: **włączone** przez `pnpm test:live` (ustawia `OPENCLAW_LIVE_TEST=1`)
- Zakres:
  - „Czy ten provider/model naprawdę działa _dzisiaj_ z prawdziwymi poświadczeniami?”
  - Wykrywanie zmian formatu providera, osobliwości wywoływania narzędzi, problemów auth i zachowania limitów szybkości
- Oczekiwania:
  - Z założenia niestabilne w CI (prawdziwe sieci, prawdziwe polityki providerów, limity, awarie)
  - Kosztuje pieniądze / zużywa limity szybkości
  - Preferuj uruchamianie zawężonych podzbiorów zamiast „wszystkiego”
- Uruchomienia live pobierają `~/.profile`, aby wychwycić brakujące klucze API.
- Domyślnie uruchomienia live nadal izolują `HOME` i kopiują materiał config/auth do tymczasowego katalogu domowego testu, aby fixture unit nie mogły modyfikować Twojego prawdziwego `~/.openclaw`.
- Ustaw `OPENCLAW_LIVE_USE_REAL_HOME=1` tylko wtedy, gdy celowo chcesz, by testy live używały Twojego prawdziwego katalogu domowego.
- `pnpm test:live` domyślnie używa teraz cichszego trybu: zachowuje dane wyjściowe postępu `[live] ...`, ale ukrywa dodatkowy komunikat `~/.profile` i wycisza logi bootstrap gateway / chatter Bonjour. Ustaw `OPENCLAW_LIVE_TEST_QUIET=0`, jeśli chcesz z powrotem pełne logi startowe.
- Rotacja kluczy API (specyficzna dla providera): ustaw `*_API_KEYS` w formacie przecinek/średnik lub `*_API_KEY_1`, `*_API_KEY_2` (na przykład `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) albo nadpisanie per-live przez `OPENCLAW_LIVE_*_KEY`; testy ponawiają po odpowiedziach rate limit.
- Dane wyjściowe postępu/heartbeat:
  - Pakiety live emitują teraz wiersze postępu do stderr, więc długie wywołania providera są widocznie aktywne nawet wtedy, gdy przechwytywanie konsoli Vitest jest ciche.
  - `vitest.live.config.ts` wyłącza przechwytywanie konsoli Vitest, więc wiersze postępu providera/gateway są natychmiast strumieniowane podczas uruchomień live.
  - Dostosuj heartbeat bezpośredniego modelu przez `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Dostosuj heartbeat gateway/probe przez `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Który pakiet powinienem uruchomić?

Użyj tej tabeli decyzyjnej:

- Edycja logiki/testów: uruchom `pnpm test` (oraz `pnpm test:coverage`, jeśli zmieniłeś dużo)
- Dotykanie sieci gateway / protokołu WS / Pairing: dodaj `pnpm test:e2e`
- Debugowanie „mój bot nie działa” / awarii specyficznych dla providera / wywoływania narzędzi: uruchom zawężone `pnpm test:live`

## Testy live (dotykające sieci)

Dla macierzy modeli live, smoke backendów CLI, smoke ACP, harness app-server
Codex oraz wszystkich testów live providerów multimediów (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — plus obsługi poświadczeń dla uruchomień live — zobacz
[Testowanie — pakiety live](/pl/help/testing-live).

## Runnery Docker (opcjonalne kontrole „działa w Linux”)

Te runnery Docker dzielą się na dwie grupy:

- Runnery modeli live: `test:docker:live-models` i `test:docker:live-gateway` uruchamiają tylko odpowiadający im plik live z kluczem profilu wewnątrz obrazu Docker repo (`src/agents/models.profiles.live.test.ts` oraz `src/gateway/gateway-models.profiles.live.test.ts`), montując Twój lokalny katalog config i obszar roboczy (oraz pobierając `~/.profile`, jeśli jest zamontowany). Odpowiadające lokalne punkty wejścia to `test:live:models-profiles` i `test:live:gateway-profiles`.
- Runnery Docker live domyślnie używają mniejszego limitu smoke, aby pełny sweep Docker pozostawał praktyczny:
  `test:docker:live-models` domyślnie używa `OPENCLAW_LIVE_MAX_MODELS=12`, a
  `test:docker:live-gateway` domyślnie używa `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` oraz
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Nadpisz te zmienne env, gdy
  jawnie chcesz większego, wyczerpującego skanu.
- `test:docker:all` buduje obraz live Docker raz przez `test:docker:live-build`, a następnie używa go ponownie dla dwóch linii Docker live. Buduje też jeden współdzielony obraz `scripts/e2e/Dockerfile` przez `test:docker:e2e-build` i używa go ponownie dla runnerów smoke kontenerów E2E, które ćwiczą zbudowaną aplikację.
- Runnery smoke kontenerów: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` i `test:docker:config-reload` uruchamiają jeden lub więcej prawdziwych kontenerów i weryfikują ścieżki integracji wyższego poziomu.

Runnery Docker modeli live również montują przez bind tylko potrzebne katalogi auth CLI (albo wszystkie obsługiwane, gdy uruchomienie nie jest zawężone), a następnie kopiują je do katalogu domowego kontenera przed uruchomieniem, tak aby zewnętrzne CLI OAuth mogły odświeżać tokeny bez modyfikowania magazynu auth hosta:

- Modele bezpośrednie: `pnpm test:docker:live-models` (skrypt: `scripts/test-live-models-docker.sh`)
- Smoke ACP bind: `pnpm test:docker:live-acp-bind` (skrypt: `scripts/test-live-acp-bind-docker.sh`)
- Smoke backendu CLI: `pnpm test:docker:live-cli-backend` (skrypt: `scripts/test-live-cli-backend-docker.sh`)
- Smoke harness app-server Codex: `pnpm test:docker:live-codex-harness` (skrypt: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev: `pnpm test:docker:live-gateway` (skrypt: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live Open WebUI: `pnpm test:docker:openwebui` (skrypt: `scripts/e2e/openwebui-docker.sh`)
- Kreator onboardingu (TTY, pełne scaffolding): `pnpm test:docker:onboard` (skrypt: `scripts/e2e/onboard-docker.sh`)
- Smoke onboardingu/kanału/agenta z tarballa npm: `pnpm test:docker:npm-onboard-channel-agent` instaluje spakowany tarball OpenClaw globalnie w Docker, konfiguruje OpenAI przez onboarding env-ref oraz domyślnie Telegram, weryfikuje, że doctor naprawia aktywowane zależności runtime Plugin, i uruchamia jedną mockowaną turę agenta OpenAI. Użyj ponownie wcześniej zbudowanego tarballa przez `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń przebudowę hosta przez `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, albo przełącz kanał przez `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke instalacji globalnej Bun: `bash scripts/e2e/bun-global-install-smoke.sh` pakuje bieżące drzewo, instaluje je przez `bun install -g` w izolowanym katalogu domowym i weryfikuje, że `openclaw infer image providers --json` zwraca dołączonych providerów obrazów zamiast się zawieszać. Użyj ponownie wcześniej zbudowanego tarballa przez `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pomiń budowę hosta przez `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` albo skopiuj `dist/` z obrazu Docker przez `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke instalatora Docker: `bash scripts/test-install-sh-docker.sh` współdzieli jeden cache npm między kontenerami root, update i direct-npm. Smoke update domyślnie używa npm `latest` jako stabilnej bazy przed aktualizacją do tarballa kandydata. Sprawdzenia instalatora bez uprawnień root utrzymują izolowany cache npm, aby wpisy cache należące do root nie maskowały zachowania instalacji lokalnej użytkownika. Ustaw `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, aby ponownie użyć cache root/update/direct-npm przy lokalnych ponownych uruchomieniach.
- Install Smoke CI pomija zduplikowaną bezpośrednią aktualizację globalną npm przez `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; uruchom skrypt lokalnie bez tego env, gdy potrzebujesz pokrycia bezpośredniego `npm install -g`.
- Sieć Gateway (dwa kontenery, auth WS + health): `pnpm test:docker:gateway-network` (skrypt: `scripts/e2e/gateway-network-docker.sh`)
- Regresja minimal reasoning OpenAI Responses web_search: `pnpm test:docker:openai-web-search-minimal` (skrypt: `scripts/e2e/openai-web-search-minimal-docker.sh`) uruchamia mockowany serwer OpenAI przez Gateway, weryfikuje, że `web_search` podnosi `reasoning.effort` z `minimal` do `low`, a następnie wymusza odrzucenie schematu providera i sprawdza, że surowy detal pojawia się w logach Gateway.
- Most kanałowy MCP (seedowany Gateway + most stdio + surowy smoke ramek powiadomień Claude): `pnpm test:docker:mcp-channels` (skrypt: `scripts/e2e/mcp-channels-docker.sh`)
- Narzędzia Pi bundle MCP (prawdziwy serwer stdio MCP + smoke allow/deny w osadzonym profilu Pi): `pnpm test:docker:pi-bundle-mcp-tools` (skrypt: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Czyszczenie Cron/subagent MCP (prawdziwy Gateway + zamykanie potomka stdio MCP po izolowanym Cron i jednorazowych uruchomieniach podagentów): `pnpm test:docker:cron-mcp-cleanup` (skrypt: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke instalacji + alias `/plugin` + semantyka restartu pakietu Claude): `pnpm test:docker:plugins` (skrypt: `scripts/e2e/plugins-docker.sh`)
- Smoke niezmienionej aktualizacji Plugin: `pnpm test:docker:plugin-update` (skrypt: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke metadanych reload konfiguracji: `pnpm test:docker:config-reload` (skrypt: `scripts/e2e/config-reload-source-docker.sh`)
- Zależności runtime dołączonych Plugin: `pnpm test:docker:bundled-channel-deps` domyślnie buduje mały obraz runnera Docker, buduje i pakuje OpenClaw raz na hoście, a następnie montuje ten tarball w każdym scenariuszu instalacji Linux. Użyj obrazu ponownie przez `OPENCLAW_SKIP_DOCKER_BUILD=1`, pomiń przebudowę hosta po świeżej lokalnej kompilacji przez `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` albo wskaż istniejący tarball przez `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Podczas iteracji zawężaj zależności runtime dołączonych Plugin, wyłączając niepowiązane scenariusze, na przykład:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Aby ręcznie zbudować wcześniej i ponownie użyć współdzielonego obrazu built-app:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Nadpisania obrazów specyficzne dla pakietu, takie jak `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, nadal mają pierwszeństwo, gdy są ustawione. Gdy `OPENCLAW_SKIP_DOCKER_BUILD=1` wskazuje zdalny współdzielony obraz, skrypty pobierają go, jeśli nie jest jeszcze lokalnie dostępny. Testy QR i instalatora Docker zachowują własne Dockerfile, ponieważ walidują zachowanie pakietu/instalacji, a nie współdzielone środowisko uruchomieniowe built-app.

Runnery Docker modeli live również montują przez bind bieżący checkout tylko do odczytu i
etapują go do tymczasowego katalogu roboczego wewnątrz kontenera. Dzięki temu obraz runtime pozostaje lekki, a jednocześnie Vitest działa na dokładnie Twoim lokalnym źródle/konfiguracji.
Krok etapowania pomija duże lokalne cache i wyniki budowania aplikacji, takie jak
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` oraz lokalne katalogi `.build` aplikacji lub
katalogi wyjściowe Gradle, dzięki czemu uruchomienia Docker live nie tracą minut na kopiowanie artefaktów specyficznych dla maszyny.
Ustawiają też `OPENCLAW_SKIP_CHANNELS=1`, aby probe gateway live nie uruchamiały
prawdziwych workerów kanałów Telegram/Discord/itd. wewnątrz kontenera.
`test:docker:live-models` nadal uruchamia `pnpm test:live`, więc przekaż także
`OPENCLAW_LIVE_GATEWAY_*`, gdy chcesz zawęzić lub wykluczyć pokrycie gateway
live z tej linii Docker.
`test:docker:openwebui` to smoke zgodności wyższego poziomu: uruchamia kontener gateway
OpenClaw z włączonymi punktami końcowymi HTTP zgodnymi z OpenAI, uruchamia przypięty
kontener Open WebUI względem tego gateway, loguje się przez Open WebUI, weryfikuje, że `/api/models` udostępnia `openclaw/default`, a następnie wysyła
prawdziwe żądanie czatu przez proxy `/api/chat/completions` Open WebUI.
Pierwsze uruchomienie może być zauważalnie wolniejsze, ponieważ Docker może potrzebować pobrać
obraz Open WebUI, a samo Open WebUI może potrzebować zakończyć własną konfigurację cold-start.
Ta linia oczekuje użytecznego klucza modelu live, a `OPENCLAW_PROFILE_FILE`
(domyślnie `~/.profile`) jest podstawowym sposobem jego dostarczenia w uruchomieniach dockerowych.
Udane uruchomienia wypisują mały ładunek JSON, taki jak `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` jest celowo deterministyczny i nie wymaga
prawdziwego konta Telegram, Discord ani iMessage. Uruchamia seedowany kontener Gateway,
uruchamia drugi kontener, który uruchamia `openclaw mcp serve`, a następnie
weryfikuje wykrywanie routowanych konwersacji, odczyt transkryptów, metadane załączników,
zachowanie kolejki zdarzeń na żywo, routing wysyłania wychodzącego oraz powiadomienia kanałów +
uprawnień w stylu Claude przez prawdziwy most stdio MCP. Sprawdzenie powiadomień
bezpośrednio inspektuje surowe ramki stdio MCP, więc smoke waliduje to, co most faktycznie emituje,
a nie tylko to, co ujawnia konkretne SDK klienta.
`test:docker:pi-bundle-mcp-tools` jest deterministyczny i nie wymaga klucza
modelu live. Buduje obraz Docker repo, uruchamia prawdziwy serwer probe stdio MCP
wewnątrz kontenera, materializuje ten serwer przez osadzone środowisko runtime bundle MCP Pi,
wykonuje narzędzie, a następnie weryfikuje, że `coding` i `messaging` zachowują
narzędzia `bundle-mcp`, podczas gdy `minimal` i `tools.deny: ["bundle-mcp"]` je filtrują.
`test:docker:cron-mcp-cleanup` jest deterministyczny i nie wymaga klucza modelu live.
Uruchamia seedowany Gateway z prawdziwym serwerem probe stdio MCP, wykonuje
izolowaną turę Cron i jednorazową turę potomną `/subagents spawn`, a następnie weryfikuje,
że proces potomny MCP kończy się po każdym uruchomieniu.

Ręczny smoke wątku ACP plain-language (nie CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Zachowaj ten skrypt do przepływów pracy regresji/debugowania. Może być znów potrzebny do walidacji routingu wątków ACP, więc go nie usuwaj.

Przydatne zmienne env:

- `OPENCLAW_CONFIG_DIR=...` (domyślnie: `~/.openclaw`) montowane do `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (domyślnie: `~/.openclaw/workspace`) montowane do `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (domyślnie: `~/.profile`) montowane do `/home/node/.profile` i pobierane przed uruchomieniem testów
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, aby zweryfikować tylko zmienne env pobrane z `OPENCLAW_PROFILE_FILE`, z użyciem tymczasowych katalogów config/workspace i bez montowania zewnętrznego auth CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (domyślnie: `~/.cache/openclaw/docker-cli-tools`) montowane do `/home/node/.npm-global` dla buforowanych instalacji CLI wewnątrz Docker
- Zewnętrzne katalogi/pliki auth CLI pod `$HOME` są montowane tylko do odczytu pod `/host-auth...`, a następnie kopiowane do `/home/node/...` przed rozpoczęciem testów
  - Domyślne katalogi: `.minimax`
  - Domyślne pliki: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Zawężone uruchomienia providerów montują tylko potrzebne katalogi/pliki wywnioskowane z `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Nadpisz ręcznie przez `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` albo listę rozdzielaną przecinkami, np. `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, aby zawęzić uruchomienie
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, aby filtrować providerów wewnątrz kontenera
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, aby ponownie użyć istniejącego obrazu `openclaw:local-live` przy ponownych uruchomieniach, które nie wymagają przebudowy
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, aby upewnić się, że poświadczenia pochodzą z magazynu profilu (a nie env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, aby wybrać model udostępniany przez gateway dla smoke Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...`, aby nadpisać prompt sprawdzania nonce używany przez smoke Open WebUI
- `OPENWEBUI_IMAGE=...`, aby nadpisać przypięty tag obrazu Open WebUI

## Kontrola poprawności dokumentacji

Uruchom kontrole dokumentacji po edycjach dokumentów: `pnpm check:docs`.
Uruchom pełną walidację kotwic Mintlify, gdy potrzebujesz także sprawdzenia nagłówków w obrębie strony: `pnpm docs:check-links:anchors`.

## Regresja offline (bezpieczna dla CI)

To regresje „prawdziwego potoku” bez prawdziwych providerów:

- Wywoływanie narzędzi Gateway (mock OpenAI, prawdziwy gateway + pętla agenta): `src/gateway/gateway.test.ts` (przypadek: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Kreator Gateway (WS `wizard.start`/`wizard.next`, zapisuje config + wymuszony auth): `src/gateway/gateway.test.ts` (przypadek: "runs wizard over ws and writes auth token config")

## Ewalucje niezawodności agentów (Skills)

Mamy już kilka testów bezpiecznych dla CI, które zachowują się jak „ewaluacje niezawodności agentów”:

- Mockowane wywoływanie narzędzi przez prawdziwy gateway + pętlę agenta (`src/gateway/gateway.test.ts`).
- Przepływy kreatora end-to-end, które walidują okablowanie sesji i efekty konfiguracji (`src/gateway/gateway.test.ts`).

Czego nadal brakuje dla Skills (zobacz [Skills](/pl/tools/skills)):

- **Decisioning:** gdy Skills są wymienione w prompcie, czy agent wybiera właściwy Skill (albo unika nieistotnych)?
- **Compliance:** czy agent czyta `SKILL.md` przed użyciem i wykonuje wymagane kroki/argumenty?
- **Workflow contracts:** scenariusze wieloturowe, które asertywnie sprawdzają kolejność narzędzi, przenoszenie historii sesji i granice sandbox.

Przyszłe ewaluacje powinny w pierwszej kolejności pozostać deterministyczne:

- Runner scenariuszy używający mock providerów do asercji wywołań narzędzi + ich kolejności, odczytów plików Skill i okablowania sesji.
- Mały pakiet scenariuszy skoncentrowanych na Skills (użyj vs unikaj, gating, prompt injection).
- Opcjonalne ewaluacje live (opt-in, kontrolowane przez env) dopiero po wdrożeniu pakietu bezpiecznego dla CI.

## Testy kontraktowe (kształt Plugin i kanałów)

Testy kontraktowe weryfikują, że każdy zarejestrowany Plugin i kanał jest zgodny
ze swoim kontraktem interfejsu. Iterują po wszystkich wykrytych Plugin i uruchamiają
pakiet asercji kształtu i zachowania. Domyślna linia unit `pnpm test` celowo
pomija te współdzielone pliki seam i smoke; uruchamiaj polecenia kontraktowe jawnie,
gdy dotykasz współdzielonych powierzchni kanałów lub providerów.

### Polecenia

- Wszystkie kontrakty: `pnpm test:contracts`
- Tylko kontrakty kanałów: `pnpm test:contracts:channels`
- Tylko kontrakty providerów: `pnpm test:contracts:plugins`

### Kontrakty kanałów

Znajdują się w `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Podstawowy kształt Plugin (id, name, capabilities)
- **setup** - Kontrakt kreatora konfiguracji
- **session-binding** - Zachowanie powiązania sesji
- **outbound-payload** - Struktura ładunku wiadomości
- **inbound** - Obsługa wiadomości przychodzących
- **actions** - Handlery akcji kanału
- **threading** - Obsługa identyfikatorów wątków
- **directory** - API katalogu/listy
- **group-policy** - Egzekwowanie polityki grupowej

### Kontrakty statusu providerów

Znajdują się w `src/plugins/contracts/*.contract.test.ts`.

- **status** - Probe statusu kanałów
- **registry** - Kształt rejestru Plugin

### Kontrakty providerów

Znajdują się w `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Kontrakt przepływu auth
- **auth-choice** - Wybór/selekcja auth
- **catalog** - API katalogu modeli
- **discovery** - Wykrywanie Plugin
- **loader** - Ładowanie Plugin
- **runtime** - Runtime providera
- **shape** - Kształt/interfejs Plugin
- **wizard** - Kreator konfiguracji

### Kiedy uruchamiać

- Po zmianie eksportów `plugin-sdk` lub podścieżek
- Po dodaniu lub modyfikacji kanału albo Plugin providera
- Po refaktoryzacji rejestracji Plugin lub wykrywania

Testy kontraktowe uruchamiają się w CI i nie wymagają prawdziwych kluczy API.

## Dodawanie regresji (wskazówki)

Gdy naprawiasz problem providera/modelu wykryty na live:

- Jeśli to możliwe, dodaj regresję bezpieczną dla CI (mock/stub providera albo przechwycenie dokładnej transformacji kształtu żądania)
- Jeśli z natury jest to tylko przypadek live (limity szybkości, polityki auth), utrzymuj test live wąski i opt-in przez zmienne env
- Preferuj celowanie w najmniejszą warstwę, która wychwytuje błąd:
  - błąd konwersji/odtworzenia żądania providera → test modeli bezpośrednich
  - błąd potoku sesji/historii/narzędzi gateway → smoke gateway live lub bezpieczny dla CI test mockowanego gateway
- Guardrail przechodzenia SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` wyprowadza jeden próbkowany cel na klasę SecretRef z metadanych rejestru (`listSecretTargetRegistryEntries()`), a następnie asertywnie sprawdza, że identyfikatory exec segmentów przechodzenia są odrzucane.
  - Jeśli dodasz nową rodzinę docelową SecretRef `includeInPlan` w `src/secrets/target-registry-data.ts`, zaktualizuj `classifyTargetClass` w tym teście. Test celowo kończy się niepowodzeniem przy niesklasyfikowanych identyfikatorach celów, aby nowe klasy nie mogły zostać cicho pominięte.

## Powiązane

- [Testowanie live](/pl/help/testing-live)
- [CI](/pl/ci)
