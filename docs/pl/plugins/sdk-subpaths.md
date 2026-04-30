---
read_when:
    - Wybór właściwej podścieżki plugin-sdk dla importu Plugin
    - Audyt podścieżek dołączonych pluginów i powierzchni pomocniczych
summary: 'Katalog podścieżek SDK Plugin: gdzie znajdują się poszczególne importy, pogrupowane według obszaru'
title: Podścieżki Plugin SDK
x-i18n:
    generated_at: "2026-04-30T10:10:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6a8c431c1835fff6720a00984171e3f55886363654074d81859f50ca28a35104
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  SDK Plugin jest udostępniany jako zestaw wąskich ścieżek podrzędnych pod `openclaw/plugin-sdk/`.
  Ta strona kataloguje często używane ścieżki podrzędne pogrupowane według przeznaczenia. Wygenerowana
  pełna lista ponad 200 ścieżek podrzędnych znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`;
  zarezerwowane ścieżki podrzędne pomocników wbudowanych Pluginów pojawiają się tam, ale są szczegółem
  implementacyjnym, chyba że strona dokumentacji jawnie je promuje. Maintainerzy mogą audytować aktywne
  zarezerwowane ścieżki podrzędne pomocników za pomocą `pnpm plugins:boundary-report:summary`; nieużywane
  zarezerwowane eksporty pomocników powodują niepowodzenie raportu CI zamiast pozostawać w publicznym SDK
  jako uśpiony dług zgodności.

  Przewodnik tworzenia Pluginów znajdziesz w [Przeglądzie SDK Plugin](/pl/plugins/sdk-overview).

  ## Wejście Plugin

  | Ścieżka podrzędna                         | Kluczowe eksporty                                                                                                                                                           |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                                       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Szeroki barrel zgodności dla starszych testów Pluginów; w nowych testach rozszerzeń preferuj ukierunkowane ścieżki podrzędne testów                                         |
  | `plugin-sdk/plugin-test-api`              | Minimalny konstruktor makiet `OpenClawPluginApi` do bezpośrednich testów jednostkowych rejestracji Pluginów                                                                 |
  | `plugin-sdk/agent-runtime-test-contracts` | Natywne fixtures kontraktów adaptera agent-runtime dla profili uwierzytelniania, tłumienia dostarczania, klasyfikacji fallback, haków narzędzi, nakładek promptów, schematów i naprawy transkryptu |
  | `plugin-sdk/channel-test-helpers`         | Pomocniki testów cyklu życia konta kanału, katalogu, send-config, makiety runtime, haka, wpisu wbudowanego kanału, znacznika czasu koperty, odpowiedzi parowania i ogólnego kontraktu kanału |
  | `plugin-sdk/channel-target-testing`       | Współdzielony zestaw testów przypadków błędów rozpoznawania celu kanału                                                                                                      |
  | `plugin-sdk/plugin-test-contracts`        | Pomocniki kontraktów rejestracji Plugin, manifestu pakietu, artefaktu publicznego, API runtime, efektów ubocznych importu i bezpośredniego importu                          |
  | `plugin-sdk/plugin-test-runtime`          | Fixtures testowe runtime Plugin, rejestru, rejestracji providera, kreatora konfiguracji i przepływu zadań runtime                                                           |
  | `plugin-sdk/provider-test-contracts`      | Pomocniki kontraktów runtime providera, uwierzytelniania, wykrywania, onboardingu, katalogu, możliwości mediów, zasad replay, realtime STT live-audio, web-search/fetch i kreatora |
  | `plugin-sdk/provider-http-test-mocks`     | Opcjonalne makiety HTTP/uwierzytelniania Vitest dla testów providera, które używają `plugin-sdk/provider-http`                                                              |
  | `plugin-sdk/test-env`                     | Fixtures środowiska testowego, fetch/sieci, jednorazowego serwera HTTP, żądania przychodzącego, testu live, tymczasowego systemu plików i kontroli czasu                    |
  | `plugin-sdk/test-fixtures`                | Ogólne fixtures testowe CLI, sandboxa, skill, komunikatu agenta, zdarzenia systemowego, przeładowania modułu, ścieżki wbudowanego Pluginu, terminala, dzielenia na fragmenty, auth-token i typed-case |
  | `plugin-sdk/test-node-mocks`              | Ukierunkowane pomocniki makiet wbudowanych Node do użycia wewnątrz fabryk Vitest `vi.mock("node:*")`                                                                         |
  | `plugin-sdk/migration`                    | Pomocniki elementów providera migracji, takie jak `createMigrationItem`, stałe powodów, znaczniki statusu elementu, pomocniki redakcji i `summarizeMigrationItems`           |
  | `plugin-sdk/migration-runtime`            | Pomocniki migracji runtime, takie jak `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` i `writeMigrationReport`                                                   |

  <AccordionGroup>
  <Accordion title="Ścieżki podrzędne kanałów">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` oraz `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone pomocniki kreatora konfiguracji, prompty listy dozwolonych, konstruktory statusu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Pomocniki konfiguracji wielu kont i bramki akcji, pomocniki fallback konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, pomocniki normalizacji account-id |
    | `plugin-sdk/account-resolution` | Pomocniki wyszukiwania konta i fallbacku domyślnego |
    | `plugin-sdk/account-helpers` | Wąskie pomocniki listy kont i akcji konta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Współdzielone prymitywy schematu konfiguracji kanału i ogólny konstruktor |
    | `plugin-sdk/bundled-channel-config-schema` | Schematy konfiguracji wbudowanych kanałów OpenClaw tylko dla utrzymywanych wbudowanych Pluginów |
    | `plugin-sdk/channel-config-schema-legacy` | Przestarzały alias zgodności dla schematów konfiguracji wbudowanych kanałów |
    | `plugin-sdk/telegram-command-config` | Pomocniki normalizacji/walidacji niestandardowych poleceń Telegram z fallbackiem kontraktu wbudowanego |
    | `plugin-sdk/command-gating` | Wąskie pomocniki bramki autoryzacji poleceń |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, pomocniki cyklu życia/finalizacji szkicowego strumienia |
    | `plugin-sdk/inbound-envelope` | Współdzielone pomocniki trasy przychodzącej i konstruktora koperty |
    | `plugin-sdk/inbound-reply-dispatch` | Współdzielone pomocniki rejestrowania i wysyłania przychodzących rekordów |
    | `plugin-sdk/messaging-targets` | Pomocniki parsowania/dopasowywania celów |
    | `plugin-sdk/outbound-media` | Współdzielone pomocniki ładowania mediów wychodzących |
    | `plugin-sdk/outbound-send-deps` | Lekki lookup zależności wysyłania wychodzącego dla adapterów kanałów |
    | `plugin-sdk/outbound-runtime` | Pomocniki dostarczania wychodzącego, tożsamości, delegata wysyłania, sesji, formatowania i planowania payloadu |
    | `plugin-sdk/poll-runtime` | Wąskie pomocniki normalizacji ankiet |
    | `plugin-sdk/thread-bindings-runtime` | Pomocniki cyklu życia powiązań wątków i adaptera |
    | `plugin-sdk/agent-media-payload` | Starszy konstruktor payloadu mediów agenta |
    | `plugin-sdk/conversation-runtime` | Pomocniki konwersacji/powiązań wątków, parowania i skonfigurowanych powiązań |
    | `plugin-sdk/runtime-config-snapshot` | Pomocnik migawki konfiguracji runtime |
    | `plugin-sdk/runtime-group-policy` | Pomocniki rozpoznawania zasad grup runtime |
    | `plugin-sdk/channel-status` | Współdzielone pomocniki migawki/podsumowania statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Pomocniki autoryzacji zapisu konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty prelude Pluginu kanału |
    | `plugin-sdk/allowlist-config-edit` | Pomocniki edycji/odczytu konfiguracji listy dozwolonych |
    | `plugin-sdk/group-access` | Współdzielone pomocniki decyzji dostępu grupowego |
    | `plugin-sdk/direct-dm` | Współdzielone pomocniki uwierzytelniania/ochrony bezpośrednich DM |
    | `plugin-sdk/discord` | Przestarzała fasada zgodności Discord dla opublikowanego `@openclaw/discord@2026.3.13` i śledzonej zgodności właściciela; nowe Pluginy powinny używać ogólnych ścieżek podrzędnych SDK kanału |
    | `plugin-sdk/telegram-account` | Przestarzała fasada zgodności rozpoznawania kont Telegram dla śledzonej zgodności właściciela; nowe Pluginy powinny używać wstrzykniętych pomocników runtime lub ogólnych ścieżek podrzędnych SDK kanału |
    | `plugin-sdk/zalouser` | Przestarzała fasada zgodności Zalo Personal dla opublikowanych pakietów Lark/Zalo, które nadal importują autoryzację poleceń nadawcy; nowe Pluginy powinny używać `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Pomocniki semantycznej prezentacji wiadomości, dostarczania i starszych interaktywnych odpowiedzi. Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel zgodności dla debounce przychodzących, dopasowywania wzmianek, pomocników zasad wzmianek i pomocników kopert |
    | `plugin-sdk/channel-inbound-debounce` | Wąskie pomocniki debounce przychodzących |
    | `plugin-sdk/channel-mention-gating` | Wąskie pomocniki zasad wzmianek, znacznika wzmianki i tekstu wzmianki bez szerszej powierzchni runtime przychodzącego |
    | `plugin-sdk/channel-envelope` | Wąskie pomocniki formatowania koperty przychodzącej |
    | `plugin-sdk/channel-location` | Kontekst lokalizacji kanału i pomocniki formatowania |
    | `plugin-sdk/channel-logging` | Pomocniki logowania kanału dla odrzuceń przychodzących oraz niepowodzeń pisania/ack |
    | `plugin-sdk/channel-send-result` | Typy wyniku odpowiedzi |
    | `plugin-sdk/channel-actions` | Pomocniki akcji wiadomości kanału oraz przestarzałe pomocniki natywnego schematu zachowane dla zgodności Pluginów |
    | `plugin-sdk/channel-route` | Współdzielona normalizacja tras, rozpoznawanie celu sterowane parserem, zamiana thread-id na string, klucze tras dedupe/compact, typy parsed-target i pomocniki porównywania tras/celów |
    | `plugin-sdk/channel-targets` | Pomocniki parsowania celów; wywołujący porównywanie tras powinni używać `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Typy kontraktu kanału |
    | `plugin-sdk/channel-feedback` | Połączenia feedbacku/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie pomocniki kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` i typy celów sekretów |
  </Accordion>

  <Accordion title="Podścieżki dostawców">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Obsługiwana fasada dostawcy LM Studio do konfiguracji, wykrywania katalogu i przygotowywania modeli w czasie wykonywania |
    | `plugin-sdk/lmstudio-runtime` | Obsługiwana fasada czasu wykonywania LM Studio dla domyślnych ustawień lokalnego serwera, wykrywania modeli, nagłówków żądań i helperów załadowanych modeli |
    | `plugin-sdk/provider-setup` | Wyselekcjonowane helpery konfiguracji lokalnego/samodzielnie hostowanego dostawcy |
    | `plugin-sdk/self-hosted-provider-setup` | Wyspecjalizowane helpery konfiguracji samodzielnie hostowanego dostawcy zgodnego z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI + stałe mechanizmu watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpery rozwiązywania kluczy API w czasie wykonywania dla pluginów dostawców |
    | `plugin-sdk/provider-auth-api-key` | Helpery onboardingu klucza API/zapisu profilu, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy konstruktor wyniku uwierzytelniania OAuth |
    | `plugin-sdk/provider-auth-login` | Współdzielone helpery interaktywnego logowania dla pluginów dostawców |
    | `plugin-sdk/provider-env-vars` | Helpery wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory zasad odtwarzania, helpery punktów końcowych dostawcy oraz helpery normalizacji identyfikatorów modeli, takie jak `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hak czasu wykonywania rozszerzania katalogu dostawcy i połączenia rejestru plugin-dostawca dla testów kontraktu |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ogólne helpery możliwości HTTP/punktów końcowych dostawcy, błędy HTTP dostawcy oraz helpery formularzy multipart do transkrypcji audio |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie helpery kontraktu konfiguracji/wyboru pobierania z sieci, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpery rejestracji/pamięci podręcznej dostawcy pobierania z sieci |
    | `plugin-sdk/provider-web-search-config-contract` | Wąskie helpery konfiguracji/poświadczeń wyszukiwania w sieci dla dostawców, którzy nie potrzebują okablowania włączania pluginu |
    | `plugin-sdk/provider-web-search-contract` | Wąskie helpery kontraktu konfiguracji/poświadczeń wyszukiwania w sieci, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowe settery/gettery poświadczeń |
    | `plugin-sdk/provider-web-search` | Helpery rejestracji/pamięci podręcznej/czasu wykonywania dostawcy wyszukiwania w sieci |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematów Gemini + diagnostyka oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` i podobne |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz współdzielone helpery wrapperów Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpery natywnego transportu dostawcy, takie jak chronione pobieranie, transformacje komunikatów transportowych i zapisywalne strumienie zdarzeń transportu |
    | `plugin-sdk/provider-onboard` | Helpery łatek konfiguracji onboardingu |
    | `plugin-sdk/global-singleton` | Helpery singletonów/map/pamięci podręcznej lokalnych dla procesu |
    | `plugin-sdk/group-activation` | Wąskie helpery trybu aktywacji grupy i parsowania poleceń |
  </Accordion>

  <Accordion title="Podścieżki uwierzytelniania i bezpieczeństwa">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpery rejestru poleceń, w tym formatowanie menu dynamicznych argumentów, helpery autoryzacji nadawcy |
    | `plugin-sdk/command-status` | Konstruktory komunikatów poleceń/pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Rozwiązywanie zatwierdzających i helpery uwierzytelniania działań w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Helpery natywnych profili/filtrów zatwierdzania wykonywania |
    | `plugin-sdk/approval-delivery-runtime` | Natywne adaptery możliwości/dostarczania zatwierdzeń |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony helper rozwiązywania Gateway zatwierdzeń |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie helpery ładowania natywnego adaptera zatwierdzeń dla gorących punktów wejścia kanałów |
    | `plugin-sdk/approval-handler-runtime` | Szersze helpery czasu wykonywania obsługi zatwierdzeń; preferuj węższe połączenia adaptera/Gateway, gdy są wystarczające |
    | `plugin-sdk/approval-native-runtime` | Natywny cel zatwierdzenia + helpery wiązania konta |
    | `plugin-sdk/approval-reply-runtime` | Helpery ładunków odpowiedzi zatwierdzeń exec/plugin |
    | `plugin-sdk/approval-runtime` | Helpery ładunków zatwierdzeń exec/plugin, helpery routingu/czasu wykonywania natywnych zatwierdzeń oraz helpery strukturalnego wyświetlania zatwierdzeń, takie jak `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Wąskie helpery resetowania deduplikacji odpowiedzi przychodzących |
    | `plugin-sdk/channel-contract-testing` | Wąskie helpery testów kontraktu kanału bez szerokiego barrel testowego |
    | `plugin-sdk/command-auth-native` | Natywne uwierzytelnianie poleceń, formatowanie menu dynamicznych argumentów i helpery natywnych celów sesji |
    | `plugin-sdk/command-detection` | Współdzielone helpery wykrywania poleceń |
    | `plugin-sdk/command-primitives-runtime` | Lekkie predykaty tekstu poleceń dla gorących ścieżek kanałów |
    | `plugin-sdk/command-surface` | Normalizacja treści poleceń i helpery powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery zbierania kontraktów sekretów dla powierzchni sekretów kanału/pluginu |
    | `plugin-sdk/secret-ref-runtime` | Wąskie helpery typowania `coerceSecretRef` i SecretRef do parsowania kontraktu sekretów/konfiguracji |
    | `plugin-sdk/security-runtime` | Współdzielone helpery zaufania, blokowania DM, treści zewnętrznych, redagowania tekstu wrażliwego, stałoczasowego porównywania sekretów i zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Helpery listy dozwolonych hostów i zasad SSRF sieci prywatnej |
    | `plugin-sdk/ssrf-dispatcher` | Wąskie helpery przypiętego dispatchera bez szerokiej powierzchni czasu wykonywania infrastruktury |
    | `plugin-sdk/ssrf-runtime` | Przypięty dispatcher, pobieranie chronione przed SSRF, błąd SSRF i helpery zasad SSRF |
    | `plugin-sdk/secret-input` | Helpery parsowania wejścia sekretu |
    | `plugin-sdk/webhook-ingress` | Helpery żądań/celów Webhook i koercja surowego websocketu/treści |
    | `plugin-sdk/webhook-request-guards` | Helpery rozmiaru treści żądania/limitu czasu |
  </Accordion>

  <Accordion title="Podścieżki środowiska uruchomieniowego i pamięci masowej">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie pomocniki środowiska uruchomieniowego, rejestrowania, kopii zapasowych i instalacji Pluginów |
    | `plugin-sdk/runtime-env` | Wąskie pomocniki env środowiska uruchomieniowego, loggera, limitu czasu, ponawiania i wycofywania |
    | `plugin-sdk/browser-config` | Obsługiwana fasada konfiguracji przeglądarki do znormalizowanego profilu/wartości domyślnych, parsowania adresów URL CDP i pomocników uwierzytelniania sterowania przeglądarką |
    | `plugin-sdk/channel-runtime-context` | Ogólne pomocniki rejestracji i wyszukiwania kontekstu środowiska uruchomieniowego kanału |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone pomocniki poleceń, hooków, HTTP i interakcji Pluginów |
    | `plugin-sdk/hook-runtime` | Współdzielone pomocniki potoku webhooków/wewnętrznych hooków |
    | `plugin-sdk/lazy-runtime` | Pomocniki leniwego importu i wiązania środowiska uruchomieniowego, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Pomocniki wykonywania procesów |
    | `plugin-sdk/cli-runtime` | Pomocniki formatowania CLI, oczekiwania, wersji, wywołań argumentów i leniwych grup poleceń |
    | `plugin-sdk/gateway-runtime` | Klient Gateway, pomocnik uruchamiania klienta gotowego na pętlę zdarzeń, RPC CLI Gateway, błędy protokołu Gateway i pomocniki łatek statusu kanału |
    | `plugin-sdk/config-types` | Powierzchnia konfiguracji tylko typów dla kształtów konfiguracji Pluginów, takich jak `OpenClawConfig` i typy konfiguracji kanałów/dostawców |
    | `plugin-sdk/plugin-config-runtime` | Pomocniki wyszukiwania konfiguracji Pluginów w środowisku uruchomieniowym, takie jak `requireRuntimeConfig`, `resolvePluginConfigObject` i `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Pomocniki transakcyjnej mutacji konfiguracji, takie jak `mutateConfigFile`, `replaceConfigFile` i `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Pomocniki migawki konfiguracji bieżącego procesu, takie jak `getRuntimeConfig`, `getRuntimeConfigSnapshot` i settery migawek testowych |
    | `plugin-sdk/telegram-command-config` | Normalizacja nazw/opisów poleceń Telegram oraz sprawdzanie duplikatów/konfliktów, nawet gdy dołączona powierzchnia kontraktu Telegram jest niedostępna |
    | `plugin-sdk/text-autolink-runtime` | Wykrywanie automatycznych linków odwołań do plików bez szerokiego barrela text-runtime |
    | `plugin-sdk/approval-runtime` | Pomocniki zatwierdzania exec/Pluginów, konstruktory możliwości zatwierdzania, pomocniki uwierzytelniania/profili, natywne pomocniki routingu/środowiska uruchomieniowego i formatowanie ścieżek wyświetlania strukturalnych zatwierdzeń |
    | `plugin-sdk/reply-runtime` | Współdzielone pomocniki środowiska uruchomieniowego przychodzących wiadomości/odpowiedzi, dzielenia na fragmenty, wysyłki, Heartbeat, planisty odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie pomocniki wysyłki/finalizacji odpowiedzi i etykiet konwersacji |
    | `plugin-sdk/reply-history` | Współdzielone pomocniki i znaczniki historii odpowiedzi z krótkiego okna, takie jak `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie pomocniki dzielenia tekstu/markdown na fragmenty |
    | `plugin-sdk/session-store-runtime` | Pomocniki ścieżki magazynu sesji, klucza sesji, updated-at i mutacji magazynu |
    | `plugin-sdk/cron-store-runtime` | Pomocniki ścieżki/wczytywania/zapisu magazynu Cron |
    | `plugin-sdk/state-paths` | Pomocniki ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/routing` | Pomocniki routingu/klucza sesji/wiązania konta, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone pomocniki podsumowania statusu kanału/konta, domyślne wartości stanu środowiska uruchomieniowego i pomocniki metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone pomocniki resolvera celu |
    | `plugin-sdk/string-normalization-runtime` | Pomocniki normalizacji slugów/ciągów znaków |
    | `plugin-sdk/request-url` | Wyodrębnianie adresów URL jako ciągów znaków z danych wejściowych podobnych do fetch/request |
    | `plugin-sdk/run-command` | Uruchamiacz poleceń z limitem czasu i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Wspólne czytniki parametrów narzędzi/CLI |
    | `plugin-sdk/tool-payload` | Wyodrębnianie znormalizowanych ładunków z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
    | `plugin-sdk/temp-path` | Współdzielone pomocniki ścieżek tymczasowych pobrań |
    | `plugin-sdk/logging-core` | Pomocniki loggera podsystemu i redakcji |
    | `plugin-sdk/markdown-table-runtime` | Pomocniki trybu tabel Markdown i konwersji |
    | `plugin-sdk/model-session-runtime` | Pomocniki nadpisań modelu/sesji, takie jak `applyModelOverrideToSessionEntry` i `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Pomocniki rozwiązywania konfiguracji dostawcy rozmów |
    | `plugin-sdk/json-store` | Małe pomocniki odczytu/zapisu stanu JSON |
    | `plugin-sdk/file-lock` | Pomocniki re-entrant file-lock |
    | `plugin-sdk/persistent-dedupe` | Pomocniki cache deduplikacji opartego na dysku |
    | `plugin-sdk/acp-runtime` | Pomocniki środowiska uruchomieniowego/sesji ACP i wysyłki odpowiedzi |
    | `plugin-sdk/acp-runtime-backend` | Lekkie pomocniki rejestracji backendu ACP i wysyłki odpowiedzi dla Pluginów ładowanych przy starcie |
    | `plugin-sdk/acp-binding-resolve-runtime` | Rozwiązywanie powiązań ACP tylko do odczytu bez importów uruchamiania cyklu życia |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji środowiska uruchomieniowego agenta |
    | `plugin-sdk/boolean-param` | Luźny czytnik parametrów logicznych |
    | `plugin-sdk/dangerous-name-runtime` | Pomocniki rozwiązywania dopasowywania niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Pomocniki bootstrapu urządzenia i tokenów parowania |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy pomocnicze pasywnego kanału, statusu i ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Pomocniki odpowiedzi polecenia/dostawcy `/models` |
    | `plugin-sdk/skill-commands-runtime` | Pomocniki listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Pomocniki rejestru/budowania/serializacji natywnych poleceń |
    | `plugin-sdk/agent-harness` | Eksperymentalna powierzchnia zaufanych Pluginów dla niskopoziomowych harnessów agentów: typy harnessów, pomocniki sterowania/przerywania aktywnego uruchomienia, pomocniki mostu narzędzi OpenClaw, pomocniki polityki narzędzi planu środowiska uruchomieniowego, klasyfikacja wyniku terminala, pomocniki formatowania/szczegółów postępu narzędzi i narzędzia wyników prób |
    | `plugin-sdk/provider-zai-endpoint` | Pomocniki wykrywania punktów końcowych Z.AI |
    | `plugin-sdk/async-lock-runtime` | Pomocnik lokalnej dla procesu blokady asynchronicznej dla małych plików stanu środowiska uruchomieniowego |
    | `plugin-sdk/channel-activity-runtime` | Pomocnik telemetrii aktywności kanału |
    | `plugin-sdk/concurrency-runtime` | Pomocnik ograniczonej współbieżności zadań asynchronicznych |
    | `plugin-sdk/dedupe-runtime` | Pomocniki cache deduplikacji w pamięci |
    | `plugin-sdk/delivery-queue-runtime` | Pomocnik opróżniania oczekujących dostarczeń wychodzących |
    | `plugin-sdk/file-access-runtime` | Pomocniki bezpiecznych ścieżek plików lokalnych i źródeł multimediów |
    | `plugin-sdk/heartbeat-runtime` | Pomocniki zdarzeń i widoczności Heartbeat |
    | `plugin-sdk/number-runtime` | Pomocnik koercji numerycznej |
    | `plugin-sdk/secure-random-runtime` | Pomocniki bezpiecznych tokenów/UUID |
    | `plugin-sdk/system-event-runtime` | Pomocniki kolejki zdarzeń systemowych |
    | `plugin-sdk/transport-ready-runtime` | Pomocnik oczekiwania na gotowość transportu |
    | `plugin-sdk/infra-runtime` | Przestarzały shim zgodności; użyj powyższych wyspecjalizowanych podścieżek środowiska uruchomieniowego |
    | `plugin-sdk/collection-runtime` | Pomocniki małego ograniczonego cache |
    | `plugin-sdk/diagnostic-runtime` | Pomocniki flag diagnostycznych, zdarzeń i kontekstu śledzenia |
    | `plugin-sdk/error-runtime` | Graf błędów, formatowanie, współdzielone pomocniki klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Opakowany fetch, proxy, opcja EnvHttpProxyAgent i pomocniki przypiętego wyszukiwania |
    | `plugin-sdk/runtime-fetch` | Fetch środowiska uruchomieniowego świadomy dispatchera bez importów proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Ograniczony czytnik treści odpowiedzi bez szerokiej powierzchni środowiska uruchomieniowego multimediów |
    | `plugin-sdk/session-binding-runtime` | Bieżący stan powiązania konwersacji bez skonfigurowanego routingu powiązań lub magazynów parowania |
    | `plugin-sdk/session-store-runtime` | Pomocniki magazynu sesji bez szerokich importów zapisów/utrzymania konfiguracji |
    | `plugin-sdk/context-visibility-runtime` | Rozwiązywanie widoczności kontekstu i filtrowanie kontekstu uzupełniającego bez szerokich importów konfiguracji/zabezpieczeń |
    | `plugin-sdk/string-coerce-runtime` | Wąskie pomocniki koercji i normalizacji prymitywnych rekordów/ciągów znaków bez importów markdown/rejestrowania |
    | `plugin-sdk/host-runtime` | Pomocniki normalizacji nazw hostów i hostów SCP |
    | `plugin-sdk/retry-runtime` | Pomocniki konfiguracji ponawiania i uruchamiacza ponowień |
    | `plugin-sdk/agent-runtime` | Pomocniki katalogu/tożsamości/przestrzeni roboczej agenta |
    | `plugin-sdk/directory-runtime` | Zapytanie/deduplikacja katalogu opartego na konfiguracji |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Capability and testing subpaths">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Wspólne pomocniki do pobierania/przekształcania/przechowywania multimediów, wykrywanie wymiarów wideo oparte na ffprobe oraz konstruktory ładunków multimedialnych |
    | `plugin-sdk/media-store` | Wąskie pomocniki magazynu multimediów, takie jak `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Wspólne pomocniki przełączania awaryjnego generowania multimediów, wybór kandydatów i komunikaty o brakującym modelu |
    | `plugin-sdk/media-understanding` | Typy dostawców rozumienia multimediów oraz eksporty pomocników obrazu/audio dla dostawców |
    | `plugin-sdk/text-runtime` | Wspólne pomocniki tekstu/Markdown/logowania, takie jak usuwanie tekstu widocznego dla asystenta, pomocniki renderowania/dzielenia Markdown/tabel, pomocniki redakcji, pomocniki tagów dyrektyw i narzędzia bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Pomocnik dzielenia tekstu wychodzącego |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz eksporty dyrektyw, rejestru, walidacji, konstruktora TTS zgodnego z OpenAI i pomocników mowy dla dostawców |
    | `plugin-sdk/speech-core` | Wspólne typy dostawców mowy, rejestr, dyrektywa, normalizacja i eksporty pomocników mowy |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji w czasie rzeczywistym, pomocniki rejestru i wspólny pomocnik sesji WebSocket |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu w czasie rzeczywistym i pomocniki rejestru |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów oraz pomocniki zasobów obrazów/adresów URL danych i konstruktor dostawcy obrazów zgodny z OpenAI |
    | `plugin-sdk/image-generation-core` | Wspólne typy generowania obrazów, przełączanie awaryjne, uwierzytelnianie i pomocniki rejestru |
    | `plugin-sdk/music-generation` | Typy dostawców/żądań/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Wspólne typy generowania muzyki, pomocniki przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie odwołań do modeli |
    | `plugin-sdk/video-generation` | Typy dostawców/żądań/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Wspólne typy generowania wideo, pomocniki przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie odwołań do modeli |
    | `plugin-sdk/webhook-targets` | Rejestr celów Webhook i pomocniki instalacji tras |
    | `plugin-sdk/webhook-path` | Pomocniki normalizacji ścieżek Webhook |
    | `plugin-sdk/web-media` | Wspólne pomocniki ładowania multimediów zdalnych/lokalnych |
    | `plugin-sdk/zod` | Ponownie wyeksportowany `zod` dla użytkowników SDK Plugin |
    | `plugin-sdk/testing` | Szeroki barrel zgodności dla starszych testów plugin. Nowe testy pluginów powinny zamiast tego importować wyspecjalizowane ścieżki podrzędne SDK, takie jak `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` lub `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Minimalny pomocnik `createTestPluginApi` do bezpośrednich testów jednostkowych rejestracji plugin bez importowania mostków pomocników testowych repozytorium |
    | `plugin-sdk/agent-runtime-test-contracts` | Natywne fixture kontraktów adaptera środowiska wykonawczego agenta do testów uwierzytelniania, dostarczania, fallbacku, hooków narzędzi, nakładki promptu, schematu i projekcji transkryptu |
    | `plugin-sdk/channel-test-helpers` | Pomocniki testowe zorientowane na kanały dla ogólnych kontraktów akcji/konfiguracji/statusu, asercji katalogów, cyklu życia uruchamiania konta, wątkowania konfiguracji wysyłania, mocków środowiska wykonawczego, problemów statusu, dostarczania wychodzącego i rejestracji hooków |
    | `plugin-sdk/channel-target-testing` | Wspólny zestaw przypadków błędów rozwiązywania celów dla testów kanałów |
    | `plugin-sdk/plugin-test-contracts` | Pomocniki kontraktów pakietu plugin, rejestracji, artefaktu publicznego, bezpośredniego importu, API środowiska wykonawczego i efektów ubocznych importu |
    | `plugin-sdk/provider-test-contracts` | Pomocniki kontraktów środowiska wykonawczego dostawcy, uwierzytelniania, wykrywania, onboardingu, katalogu, kreatora, możliwości multimedialnych, polityki odtwarzania, dźwięku na żywo STT w czasie rzeczywistym, wyszukiwania/pobierania z sieci i strumienia |
    | `plugin-sdk/provider-http-test-mocks` | Opcjonalne mocki HTTP/uwierzytelniania Vitest dla testów dostawców, które ćwiczą `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Ogólne fixture przechwytywania środowiska wykonawczego CLI, kontekstu piaskownicy, zapisywania umiejętności, wiadomości agenta, zdarzeń systemowych, przeładowania modułu, ścieżki dołączonego plugin, tekstu terminala, dzielenia na fragmenty, tokenu uwierzytelniającego i typowanych przypadków |
    | `plugin-sdk/test-node-mocks` | Wyspecjalizowane pomocniki mocków wbudowanych modułów Node do użycia wewnątrz fabryk Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Memory subpaths">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Dołączona powierzchnia pomocnicza memory-core dla pomocników menedżera/konfiguracji/plików/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada środowiska wykonawczego indeksu/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika fundamentu hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrakty osadzania hosta pamięci, dostęp do rejestru, dostawca lokalny i ogólne pomocniki wsadowe/zdalne |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika magazynu hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Pomocniki multimodalne hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Pomocniki zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Pomocniki sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Pomocniki dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-core-host-status` | Pomocniki statusu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Pomocniki środowiska wykonawczego CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Pomocniki głównego środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Pomocniki plików/środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny względem dostawcy alias pomocników głównego środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny względem dostawcy alias pomocników dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Neutralny względem dostawcy alias pomocników plików/środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-host-markdown` | Wspólne pomocniki zarządzanego Markdown dla pluginów sąsiadujących z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada środowiska wykonawczego Active Memory dla dostępu do menedżera wyszukiwania |
    | `plugin-sdk/memory-host-status` | Neutralny względem dostawcy alias pomocników statusu hosta pamięci |
  </Accordion>

  <Accordion title="Reserved bundled-helper subpaths">
    Obecnie nie ma zarezerwowanych ścieżek podrzędnych SDK z dołączonymi pomocnikami. Pomocniki specyficzne dla właściciela
    znajdują się w pakiecie plugin będącego właścicielem, a kontrakty hosta wielokrotnego użytku
    używają ogólnych ścieżek podrzędnych SDK, takich jak `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` i `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Przegląd SDK Plugin](/pl/plugins/sdk-overview)
- [Konfiguracja SDK Plugin](/pl/plugins/sdk-setup)
- [Tworzenie pluginów](/pl/plugins/building-plugins)
