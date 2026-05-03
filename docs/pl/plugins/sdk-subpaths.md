---
read_when:
    - Wybór właściwej podścieżki plugin-sdk dla importu Plugin
    - Audyt podścieżek wbudowanych Pluginów i powierzchni pomocniczych
summary: 'Katalog podścieżek Plugin SDK: które importy znajdują się gdzie, pogrupowane według obszaru'
title: Podścieżki Plugin SDK
x-i18n:
    generated_at: "2026-05-03T09:53:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: b3c6d139523f060795a60bce79d124def6461c0bf6a03a7a06244604101f7eff
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  SDK Plugin jest udostępniany jako zestaw wąskich ścieżek podrzędnych pod `openclaw/plugin-sdk/`.
  Ta strona kataloguje często używane ścieżki podrzędne pogrupowane według przeznaczenia. Wygenerowana
  pełna lista ponad 200 ścieżek podrzędnych znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`;
  zarezerwowane ścieżki podrzędne pomocników wbudowanych pluginów są tam widoczne, ale stanowią szczegół
  implementacyjny, chyba że strona dokumentacji wyraźnie je promuje. Maintainerzy mogą audytować aktywne
  zarezerwowane ścieżki podrzędne pomocników za pomocą `pnpm plugins:boundary-report:summary`; nieużywane
  zarezerwowane eksporty pomocników powodują niepowodzenie raportu CI zamiast pozostawać w publicznym SDK
  jako uśpiony dług kompatybilności.

  Przewodnik tworzenia pluginów znajduje się w sekcji [Omówienie Plugin SDK](/pl/plugins/sdk-overview).

  ## Punkt wejścia Plugin

  | Ścieżka podrzędna                         | Kluczowe eksporty                                                                                                                                                            |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Szeroki barrel kompatybilności dla starszych testów pluginów; w nowych testach rozszerzeń preferuj ukierunkowane ścieżki podrzędne testów                                  |
  | `plugin-sdk/plugin-test-api`              | Minimalny konstruktor atrap `OpenClawPluginApi` do bezpośrednich testów jednostkowych rejestracji pluginów                                                                  |
  | `plugin-sdk/agent-runtime-test-contracts` | Natywne fixture’y kontraktów adaptera środowiska wykonawczego agenta dla profili uwierzytelniania, tłumienia dostarczania, klasyfikacji fallbacku, hooków narzędzi, nakładek promptów, schematów i naprawy transkrypcji |
  | `plugin-sdk/channel-test-helpers`         | Pomocniki testowe cyklu życia konta kanału, katalogu, konfiguracji wysyłania, atrapy środowiska wykonawczego, hooka, wpisu wbudowanego kanału, znacznika czasu koperty, odpowiedzi parowania i ogólnego kontraktu kanału |
  | `plugin-sdk/channel-target-testing`       | Współdzielony zestaw testów przypadków błędów rozwiązywania celu kanału                                                                                                      |
  | `plugin-sdk/plugin-test-contracts`        | Pomocniki kontraktów rejestracji pluginu, manifestu pakietu, publicznego artefaktu, API środowiska wykonawczego, efektów ubocznych importu i bezpośredniego importu          |
  | `plugin-sdk/plugin-test-runtime`          | Fixture’y testowe środowiska wykonawczego pluginu, rejestru, rejestracji providera, kreatora konfiguracji i przepływu zadań środowiska wykonawczego                         |
  | `plugin-sdk/provider-test-contracts`      | Pomocniki kontraktów środowiska wykonawczego providera, uwierzytelniania, wykrywania, onboardingu, katalogu, obsługi mediów, zasad odtwarzania, realtime STT live-audio, web-search/fetch i kreatora |
  | `plugin-sdk/provider-http-test-mocks`     | Opcjonalne atrapy HTTP/uwierzytelniania Vitest dla testów providerów, które używają `plugin-sdk/provider-http`                                                              |
  | `plugin-sdk/test-env`                     | Fixture’y środowiska testowego, fetch/sieci, jednorazowego serwera HTTP, żądania przychodzącego, testu live, tymczasowego systemu plików i kontroli czasu                   |
  | `plugin-sdk/test-fixtures`                | Ogólne fixture’y testowe CLI, sandboxa, skill, wiadomości agenta, zdarzenia systemowego, ponownego ładowania modułu, ścieżki wbudowanego pluginu, terminala, dzielenia na fragmenty, tokenu uwierzytelniania i typowanego przypadku |
  | `plugin-sdk/test-node-mocks`              | Ukierunkowane pomocniki atrap wbudowanych modułów Node do użycia wewnątrz fabryk Vitest `vi.mock("node:*")`                                                                 |
  | `plugin-sdk/migration`                    | Pomocniki elementów providera migracji, takie jak `createMigrationItem`, stałe powodów, znaczniki statusu elementu, pomocniki redakcji i `summarizeMigrationItems`           |
  | `plugin-sdk/migration-runtime`            | Pomocniki migracji środowiska wykonawczego, takie jak `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` i `writeMigrationReport`                                  |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone pomocniki kreatora konfiguracji, prompty allowlisty, konstruktory statusu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Pomocniki konfiguracji wielu kont/bramki akcji, pomocniki fallbacku konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, pomocniki normalizacji identyfikatora konta |
    | `plugin-sdk/account-resolution` | Pomocniki wyszukiwania konta i fallbacku domyślnego |
    | `plugin-sdk/account-helpers` | Wąskie pomocniki listy kont/akcji konta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Współdzielone prymitywy schematu konfiguracji kanału oraz konstruktory Zod i bezpośrednie konstruktory JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Schematy konfiguracji wbudowanych kanałów OpenClaw tylko dla utrzymywanych wbudowanych pluginów |
    | `plugin-sdk/channel-config-schema-legacy` | Przestarzały alias kompatybilności dla schematów konfiguracji wbudowanych kanałów |
    | `plugin-sdk/telegram-command-config` | Pomocniki normalizacji/walidacji niestandardowych poleceń Telegram z fallbackiem kontraktu wbudowanego |
    | `plugin-sdk/command-gating` | Wąskie pomocniki bramki autoryzacji poleceń |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, pomocniki cyklu życia/finalizacji strumienia szkicu |
    | `plugin-sdk/inbound-envelope` | Współdzielone pomocniki trasy przychodzącej i konstruktora koperty |
    | `plugin-sdk/inbound-reply-dispatch` | Współdzielone pomocniki rejestrowania i wysyłki przychodzącej |
    | `plugin-sdk/messaging-targets` | Pomocniki parsowania/dopasowywania celów |
    | `plugin-sdk/outbound-media` | Współdzielone pomocniki ładowania mediów wychodzących |
    | `plugin-sdk/outbound-send-deps` | Lekkie wyszukiwanie zależności wysyłania wychodzącego dla adapterów kanałów |
    | `plugin-sdk/outbound-runtime` | Pomocniki dostarczania wychodzącego, tożsamości, delegata wysyłania, sesji, formatowania i planowania ładunku |
    | `plugin-sdk/poll-runtime` | Wąskie pomocniki normalizacji ankiet |
    | `plugin-sdk/thread-bindings-runtime` | Pomocniki cyklu życia powiązań wątku i adaptera |
    | `plugin-sdk/agent-media-payload` | Starszy konstruktor ładunku multimediów agenta |
    | `plugin-sdk/conversation-runtime` | Pomocniki powiązania konwersacji/wątku, parowania i skonfigurowanego powiązania |
    | `plugin-sdk/runtime-config-snapshot` | Pomocnik migawki konfiguracji środowiska wykonawczego |
    | `plugin-sdk/runtime-group-policy` | Pomocniki rozwiązywania group-policy środowiska wykonawczego |
    | `plugin-sdk/channel-status` | Współdzielone pomocniki migawki/podsumowania statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Pomocniki autoryzacji zapisu konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty prelude pluginu kanału |
    | `plugin-sdk/allowlist-config-edit` | Pomocniki edycji/odczytu konfiguracji allowlisty |
    | `plugin-sdk/group-access` | Współdzielone pomocniki decyzji dostępu grupowego |
    | `plugin-sdk/direct-dm` | Współdzielone pomocniki uwierzytelniania/osłon bezpośrednich wiadomości DM |
    | `plugin-sdk/discord` | Przestarzała fasada kompatybilności Discord dla opublikowanego `@openclaw/discord@2026.3.13` i śledzonej kompatybilności właściciela; nowe pluginy powinny używać ogólnych ścieżek podrzędnych SDK kanału |
    | `plugin-sdk/telegram-account` | Przestarzała fasada kompatybilności rozwiązywania kont Telegram dla śledzonej kompatybilności właściciela; nowe pluginy powinny używać wstrzykiwanych pomocników środowiska wykonawczego lub ogólnych ścieżek podrzędnych SDK kanału |
    | `plugin-sdk/zalouser` | Przestarzała fasada kompatybilności Zalo Personal dla opublikowanych pakietów Lark/Zalo, które nadal importują autoryzację poleceń nadawcy; nowe pluginy powinny używać `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Pomocniki semantycznej prezentacji wiadomości, dostarczania i starszych interaktywnych odpowiedzi. Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel kompatybilności dla debounce przychodzącego, dopasowywania wzmianek, pomocników zasad wzmianek i pomocników koperty |
    | `plugin-sdk/channel-inbound-debounce` | Wąskie pomocniki debounce przychodzącego |
    | `plugin-sdk/channel-mention-gating` | Wąskie pomocniki zasad wzmianek, znaczników wzmianek i tekstu wzmianek bez szerszej powierzchni środowiska wykonawczego przychodzącego |
    | `plugin-sdk/channel-envelope` | Wąskie pomocniki formatowania koperty przychodzącej |
    | `plugin-sdk/channel-location` | Pomocniki kontekstu lokalizacji kanału i formatowania |
    | `plugin-sdk/channel-logging` | Pomocniki logowania kanału dla odrzuceń przychodzących i błędów pisania/potwierdzania |
    | `plugin-sdk/channel-send-result` | Typy wyniku odpowiedzi |
    | `plugin-sdk/channel-actions` | Pomocniki akcji wiadomości kanału oraz przestarzałe pomocniki schematów natywnych utrzymywane dla kompatybilności pluginów |
    | `plugin-sdk/channel-route` | Współdzielone pomocniki normalizacji trasy, rozwiązywania celu sterowanego parserem, serializacji identyfikatora wątku, deduplikacji/kompaktowania kluczy tras, typy sparsowanego celu i pomocniki porównywania tras/celów |
    | `plugin-sdk/channel-targets` | Pomocniki parsowania celów; wywołujący porównanie tras powinni używać `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Typy kontraktu kanału |
    | `plugin-sdk/channel-feedback` | Okablowanie opinii/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie pomocniki kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` i typy celów sekretów |
  </Accordion>

  <Accordion title="Podścieżki dostawców">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Obsługiwana fasada dostawcy LM Studio do konfiguracji, wykrywania katalogu i przygotowania modelu w czasie wykonywania |
    | `plugin-sdk/lmstudio-runtime` | Obsługiwana fasada runtime LM Studio dla domyślnych ustawień lokalnego serwera, wykrywania modeli, nagłówków żądań i helperów załadowanych modeli |
    | `plugin-sdk/provider-setup` | Wyselekcjonowane helpery konfiguracji lokalnego/samodzielnie hostowanego dostawcy |
    | `plugin-sdk/self-hosted-provider-setup` | Wyspecjalizowane helpery konfiguracji samodzielnie hostowanego dostawcy zgodnego z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI + stałe watchdoga |
    | `plugin-sdk/provider-auth-runtime` | Helpery rozwiązywania kluczy API w czasie wykonywania dla Plugin dostawców |
    | `plugin-sdk/provider-auth-api-key` | Helpery onboardingu klucza API/zapisu profilu, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy konstruktor wyniku uwierzytelniania OAuth |
    | `plugin-sdk/provider-auth-login` | Wspólne helpery interaktywnego logowania dla Plugin dostawców |
    | `plugin-sdk/provider-env-vars` | Helpery wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, wspólne konstruktory zasad odtwarzania, helpery punktów końcowych dostawcy oraz helpery normalizacji identyfikatorów modeli, takie jak `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hak runtime rozszerzania katalogu dostawcy oraz szwy rejestru Plugin dostawców do testów kontraktowych |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ogólne helpery możliwości HTTP/punktów końcowych dostawcy, błędy HTTP dostawcy oraz helpery formularzy multipart do transkrypcji audio |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie helpery kontraktu konfiguracji/wyboru web-fetch, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpery rejestracji/pamięci podręcznej dostawcy web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Wąskie helpery konfiguracji/poświadczeń web-search dla dostawców, którzy nie potrzebują okablowania włączania Plugin |
    | `plugin-sdk/provider-web-search-contract` | Wąskie helpery kontraktu konfiguracji/poświadczeń web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, oraz zakresowe settery/gettery poświadczeń |
    | `plugin-sdk/provider-web-search` | Helpery rejestracji/pamięci podręcznej/runtime dostawcy web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematu Gemini + diagnostyka oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` i podobne |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz wspólne helpery wrapperów Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Helpery natywnego transportu dostawcy, takie jak zabezpieczony fetch, transformacje komunikatów transportowych i zapisywalne strumienie zdarzeń transportu |
    | `plugin-sdk/provider-onboard` | Helpery łatek konfiguracji onboardingu |
    | `plugin-sdk/global-singleton` | Helpery singletonów/map/pamięci podręcznej lokalnych dla procesu |
    | `plugin-sdk/group-activation` | Wąskie helpery trybu aktywacji grupy i parsowania poleceń |
  </Accordion>

  <Accordion title="Podścieżki uwierzytelniania i bezpieczeństwa">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpery rejestru poleceń, w tym formatowanie dynamicznego menu argumentów, helpery autoryzacji nadawcy |
    | `plugin-sdk/command-status` | Konstruktory komunikatów poleceń/pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Rozwiązywanie zatwierdzającego i helpery uwierzytelniania akcji w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Helpery profilu/filtra natywnego zatwierdzania exec |
    | `plugin-sdk/approval-delivery-runtime` | Natywne adaptery możliwości/dostarczania zatwierdzeń |
    | `plugin-sdk/approval-gateway-runtime` | Wspólny helper rozwiązywania Gateway zatwierdzeń |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie helpery ładowania natywnego adaptera zatwierdzeń dla gorących punktów wejścia kanału |
    | `plugin-sdk/approval-handler-runtime` | Szersze helpery runtime obsługi zatwierdzeń; preferuj węższe szwy adaptera/Gateway, gdy są wystarczające |
    | `plugin-sdk/approval-native-runtime` | Helpery natywnego celu zatwierdzeń + wiązania konta |
    | `plugin-sdk/approval-reply-runtime` | Helpery ładunku odpowiedzi zatwierdzenia exec/Plugin |
    | `plugin-sdk/approval-runtime` | Helpery ładunku zatwierdzenia exec/Plugin, helpery routingu/runtime natywnych zatwierdzeń oraz helpery strukturalnego wyświetlania zatwierdzeń, takie jak `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Wąskie helpery resetowania deduplikacji odpowiedzi przychodzących |
    | `plugin-sdk/channel-contract-testing` | Wąskie helpery testów kontraktu kanału bez szerokiego barrela testowego |
    | `plugin-sdk/command-auth-native` | Natywne uwierzytelnianie poleceń, formatowanie dynamicznego menu argumentów i helpery natywnego celu sesji |
    | `plugin-sdk/command-detection` | Wspólne helpery wykrywania poleceń |
    | `plugin-sdk/command-primitives-runtime` | Lekkie predykaty tekstu poleceń dla gorących ścieżek kanału |
    | `plugin-sdk/command-surface` | Normalizacja treści polecenia i helpery powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery zbierania kontraktu sekretów dla powierzchni sekretów kanału/Plugin |
    | `plugin-sdk/secret-ref-runtime` | Wąskie helpery typowania `coerceSecretRef` i SecretRef do parsowania kontraktu sekretów/konfiguracji |
    | `plugin-sdk/security-runtime` | Wspólne helpery zaufania, bramkowania DM, treści zewnętrznych, redakcji tekstu wrażliwego, porównywania sekretów w stałym czasie i zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Helpery allowlisty hostów i polityki SSRF sieci prywatnych |
    | `plugin-sdk/ssrf-dispatcher` | Wąskie helpery przypiętego dispatchera bez szerokiej powierzchni runtime infrastruktury |
    | `plugin-sdk/ssrf-runtime` | Przypięty dispatcher, fetch chroniony SSRF, błąd SSRF i helpery polityki SSRF |
    | `plugin-sdk/secret-input` | Helpery parsowania wejścia sekretu |
    | `plugin-sdk/webhook-ingress` | Helpery żądania/celu Webhook oraz koercja surowego websocket/body |
    | `plugin-sdk/webhook-request-guards` | Helpery rozmiaru/limitu czasu treści żądania |
  </Accordion>

  <Accordion title="Podścieżki środowiska uruchomieniowego i przechowywania danych">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie helpery środowiska uruchomieniowego, logowania, kopii zapasowych i instalacji pluginów |
    | `plugin-sdk/runtime-env` | Wąskie helpery środowiska uruchomieniowego: env, loggera, limitu czasu, ponawiania i wycofywania |
    | `plugin-sdk/browser-config` | Obsługiwana fasada konfiguracji przeglądarki do znormalizowanego profilu/wartości domyślnych, parsowania adresu URL CDP i helperów uwierzytelniania sterowania przeglądarką |
    | `plugin-sdk/channel-runtime-context` | Generyczne helpery rejestracji i wyszukiwania kontekstu środowiska uruchomieniowego kanału |
    | `plugin-sdk/matrix` | Przestarzała fasada zgodności Matrix dla starszych pakietów kanałów firm trzecich; nowe pluginy powinny importować bezpośrednio `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Przestarzała fasada zgodności Mattermost dla starszych pakietów kanałów firm trzecich; nowe pluginy powinny importować bezpośrednio generyczne podścieżki SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone helpery poleceń pluginu, hooków, HTTP i interaktywne |
    | `plugin-sdk/hook-runtime` | Współdzielone helpery potoku Webhook i wewnętrznych hooków |
    | `plugin-sdk/lazy-runtime` | Helpery leniwego importu/powiązania środowiska uruchomieniowego, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpery wykonywania procesów |
    | `plugin-sdk/cli-runtime` | Helpery formatowania CLI, oczekiwania, wersji, wywoływania z argumentami i leniwych grup poleceń |
    | `plugin-sdk/gateway-runtime` | Klient Gateway, helper uruchamiania klienta gotowego na pętlę zdarzeń, RPC CLI Gateway, błędy protokołu Gateway i helpery poprawek statusu kanału |
    | `plugin-sdk/config-types` | Powierzchnia konfiguracji wyłącznie typów dla kształtów konfiguracji pluginu, takich jak `OpenClawConfig` oraz typy konfiguracji kanału/dostawcy |
    | `plugin-sdk/plugin-config-runtime` | Helpery wyszukiwania konfiguracji pluginu w środowisku uruchomieniowym, takie jak `requireRuntimeConfig`, `resolvePluginConfigObject` i `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transakcyjne helpery mutacji konfiguracji, takie jak `mutateConfigFile`, `replaceConfigFile` i `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helpery migawki konfiguracji bieżącego procesu, takie jak `getRuntimeConfig`, `getRuntimeConfigSnapshot` i settery migawek testowych |
    | `plugin-sdk/telegram-command-config` | Normalizacja nazw/opisów poleceń Telegram oraz kontrole duplikatów/konfliktów, nawet gdy dołączona powierzchnia kontraktu Telegram jest niedostępna |
    | `plugin-sdk/text-autolink-runtime` | Wykrywanie automatycznych linków odwołań do plików bez szerokiego barrela text-runtime |
    | `plugin-sdk/approval-runtime` | Helpery zatwierdzania wykonywania/pluginów, buildery zdolności zatwierdzania, helpery uwierzytelniania/profilu, helpery natywnego routingu/środowiska uruchomieniowego oraz formatowanie ścieżki wyświetlania ustrukturyzowanego zatwierdzenia |
    | `plugin-sdk/reply-runtime` | Współdzielone helpery środowiska uruchomieniowego przychodzących wiadomości/odpowiedzi, dzielenie na fragmenty, wysyłanie, Heartbeat, planer odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery wysyłania/finalizacji odpowiedzi i etykiet konwersacji |
    | `plugin-sdk/reply-history` | Współdzielone helpery krótkookresowej historii odpowiedzi i znaczniki, takie jak `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie helpery dzielenia tekstu/Markdownu na fragmenty |
    | `plugin-sdk/session-store-runtime` | Helpery ścieżki magazynu sesji, klucza sesji, znacznika aktualizacji i mutacji magazynu |
    | `plugin-sdk/cron-store-runtime` | Helpery ścieżki/ładowania/zapisu magazynu Cron |
    | `plugin-sdk/state-paths` | Helpery ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/routing` | Helpery powiązania trasy/klucza sesji/konta, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone helpery podsumowania statusu kanału/konta, wartości domyślne stanu środowiska uruchomieniowego i helpery metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone helpery resolvera celu |
    | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji slugu/ciągów znaków |
    | `plugin-sdk/request-url` | Wyodrębnianie tekstowych adresów URL z danych wejściowych podobnych do fetch/request |
    | `plugin-sdk/run-command` | Runner poleceń z limitem czasu i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Wspólne czytniki parametrów narzędzi/CLI |
    | `plugin-sdk/tool-payload` | Wyodrębnianie znormalizowanych ładunków z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
    | `plugin-sdk/temp-path` | Współdzielone helpery ścieżek tymczasowego pobierania |
    | `plugin-sdk/logging-core` | Helpery loggera podsystemu i redakcji |
    | `plugin-sdk/markdown-table-runtime` | Helpery trybu tabel Markdown i konwersji |
    | `plugin-sdk/model-session-runtime` | Helpery nadpisań modelu/sesji, takie jak `applyModelOverrideToSessionEntry` i `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpery rozwiązywania konfiguracji dostawcy Talk |
    | `plugin-sdk/json-store` | Małe helpery odczytu/zapisu stanu JSON |
    | `plugin-sdk/file-lock` | Helpery reentrant blokady plików |
    | `plugin-sdk/persistent-dedupe` | Helpery dyskowej pamięci podręcznej deduplikacji |
    | `plugin-sdk/acp-runtime` | Helpery środowiska uruchomieniowego/sesji ACP i wysyłania odpowiedzi |
    | `plugin-sdk/acp-runtime-backend` | Lekkie helpery rejestracji backendu ACP i wysyłania odpowiedzi dla pluginów ładowanych przy starcie |
    | `plugin-sdk/acp-binding-resolve-runtime` | Tylko do odczytu rozwiązywanie powiązań ACP bez importów uruchamiania cyklu życia |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji środowiska uruchomieniowego agenta |
    | `plugin-sdk/boolean-param` | Luźny czytnik parametru logicznego |
    | `plugin-sdk/dangerous-name-runtime` | Helpery rozwiązywania dopasowań niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Helpery bootstrapu urządzenia i tokenów parowania |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy helperów kanału pasywnego, statusu i ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Helpery odpowiedzi polecenia/dostawcy `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpery listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Helpery rejestru/budowania/serializacji poleceń natywnych |
    | `plugin-sdk/agent-harness` | Eksperymentalna powierzchnia zaufanego pluginu dla niskopoziomowych harnessów agentów: typy harnessów, helpery sterowania/przerywania aktywnego uruchomienia, helpery mostu narzędzi OpenClaw, helpery zasad narzędzi planu środowiska uruchomieniowego, klasyfikacja wyniku terminala, helpery formatowania/szczegółów postępu narzędzi i narzędzia wyników prób |
    | `plugin-sdk/provider-zai-endpoint` | Helpery wykrywania endpointu Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper asynchronicznej blokady lokalnej dla procesu dla małych plików stanu środowiska uruchomieniowego |
    | `plugin-sdk/channel-activity-runtime` | Helper telemetrii aktywności kanału |
    | `plugin-sdk/concurrency-runtime` | Helper ograniczonej współbieżności zadań asynchronicznych |
    | `plugin-sdk/dedupe-runtime` | Helpery pamięci podręcznej deduplikacji w pamięci |
    | `plugin-sdk/delivery-queue-runtime` | Helper opróżniania oczekujących dostaw wychodzących |
    | `plugin-sdk/file-access-runtime` | Helpery bezpiecznych ścieżek plików lokalnych i źródeł multimediów |
    | `plugin-sdk/heartbeat-runtime` | Helpery zdarzeń i widoczności Heartbeat |
    | `plugin-sdk/number-runtime` | Helper koercji numerycznej |
    | `plugin-sdk/secure-random-runtime` | Helpery bezpiecznych tokenów/UUID |
    | `plugin-sdk/system-event-runtime` | Helpery kolejki zdarzeń systemowych |
    | `plugin-sdk/transport-ready-runtime` | Helper oczekiwania na gotowość transportu |
    | `plugin-sdk/infra-runtime` | Przestarzały shim zgodności; użyj powyższych ukierunkowanych podścieżek środowiska uruchomieniowego |
    | `plugin-sdk/collection-runtime` | Małe helpery ograniczonej pamięci podręcznej |
    | `plugin-sdk/diagnostic-runtime` | Helpery flag diagnostycznych, zdarzeń i kontekstu śledzenia |
    | `plugin-sdk/error-runtime` | Graf błędów, formatowanie, współdzielone helpery klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Opakowany fetch, proxy, opcja EnvHttpProxyAgent i helpery przypiętego wyszukiwania |
    | `plugin-sdk/runtime-fetch` | Fetch środowiska uruchomieniowego świadomy dispatchera bez importów proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Ograniczony czytnik treści odpowiedzi bez szerokiej powierzchni środowiska uruchomieniowego multimediów |
    | `plugin-sdk/session-binding-runtime` | Bieżący stan powiązania konwersacji bez skonfigurowanego routingu powiązań ani magazynów parowania |
    | `plugin-sdk/session-store-runtime` | Helpery magazynu sesji bez szerokich importów zapisów/utrzymania konfiguracji |
    | `plugin-sdk/context-visibility-runtime` | Rozwiązywanie widoczności kontekstu i filtrowanie kontekstu uzupełniającego bez szerokich importów konfiguracji/bezpieczeństwa |
    | `plugin-sdk/string-coerce-runtime` | Wąskie helpery koercji i normalizacji rekordów prymitywnych/ciągów znaków bez importów Markdownu/logowania |
    | `plugin-sdk/host-runtime` | Helpery normalizacji nazwy hosta i hosta SCP |
    | `plugin-sdk/retry-runtime` | Helpery konfiguracji ponawiania i runnera ponawiania |
    | `plugin-sdk/agent-runtime` | Helpery katalogu/tożsamości/przestrzeni roboczej agenta |
    | `plugin-sdk/directory-runtime` | Zapytanie/deduplikacja katalogu oparte na konfiguracji |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Podścieżki funkcji i testowania">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Współdzielone pomocniki do pobierania/przekształcania/przechowywania multimediów, sondowanie wymiarów wideo oparte na ffprobe oraz konstruktory ładunków multimedialnych |
    | `plugin-sdk/media-store` | Wąskie pomocniki magazynu multimediów, takie jak `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Współdzielone pomocniki przełączania awaryjnego generowania multimediów, wybór kandydatów i komunikaty o brakującym modelu |
    | `plugin-sdk/media-understanding` | Typy dostawców rozumienia multimediów oraz eksporty pomocników obrazów/dźwięku przeznaczone dla dostawców |
    | `plugin-sdk/text-runtime` | Współdzielone pomocniki tekstu/markdown/logowania, takie jak usuwanie tekstu widocznego dla asystenta, pomocniki renderowania/dzielenia na fragmenty/tabel markdown, pomocniki redakcji, pomocniki tagów dyrektyw oraz narzędzia bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Pomocnik dzielenia tekstu wychodzącego na fragmenty |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz eksporty dyrektyw, rejestru, walidacji, konstruktora TTS zgodnego z OpenAI i pomocników mowy przeznaczone dla dostawców |
    | `plugin-sdk/speech-core` | Współdzielone typy dostawców mowy, rejestr, dyrektywa, normalizacja i eksporty pomocników mowy |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji w czasie rzeczywistym, pomocniki rejestru i współdzielony pomocnik sesji WebSocket |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu w czasie rzeczywistym i pomocniki rejestru |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów oraz pomocniki zasobów obrazów/adresów URL danych i konstruktor dostawcy obrazów zgodny z OpenAI |
    | `plugin-sdk/image-generation-core` | Współdzielone typy generowania obrazów, przełączanie awaryjne, uwierzytelnianie i pomocniki rejestru |
    | `plugin-sdk/music-generation` | Typy dostawców/żądań/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Współdzielone typy generowania muzyki, pomocniki przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie odwołań do modeli |
    | `plugin-sdk/video-generation` | Typy dostawców/żądań/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo, pomocniki przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie odwołań do modeli |
    | `plugin-sdk/webhook-targets` | Rejestr celów Webhook i pomocniki instalowania tras |
    | `plugin-sdk/webhook-path` | Pomocniki normalizacji ścieżek Webhook |
    | `plugin-sdk/web-media` | Współdzielone pomocniki ładowania multimediów zdalnych/lokalnych |
    | `plugin-sdk/zod` | Ponownie eksportowany `zod` dla konsumentów SDK Plugin |
    | `plugin-sdk/testing` | Szeroki barrel zgodności dla starszych testów Plugin. Nowe testy rozszerzeń powinny zamiast tego importować ukierunkowane podścieżki SDK, takie jak `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` lub `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Minimalny pomocnik `createTestPluginApi` do bezpośrednich testów jednostkowych rejestracji Plugin bez importowania mostów pomocników testowych repozytorium |
    | `plugin-sdk/agent-runtime-test-contracts` | Natywne fixtures kontraktów adaptera środowiska wykonawczego agenta dla testów uwierzytelniania, dostarczania, mechanizmu awaryjnego, haków narzędzi, nakładki promptu, schematu i projekcji transkrypcji |
    | `plugin-sdk/channel-test-helpers` | Pomocniki testowe zorientowane na kanały dla ogólnych kontraktów akcji/konfiguracji/statusu, asercji katalogów, cyklu życia uruchamiania konta, wątkowania konfiguracji wysyłania, mocków środowiska wykonawczego, problemów ze statusem, dostarczania wychodzącego i rejestracji haków |
    | `plugin-sdk/channel-target-testing` | Współdzielony zestaw przypadków błędów rozwiązywania celów dla testów kanałów |
    | `plugin-sdk/plugin-test-contracts` | Pomocniki kontraktów pakietu Plugin, rejestracji, publicznych artefaktów, bezpośredniego importu, API środowiska wykonawczego i efektów ubocznych importu |
    | `plugin-sdk/provider-test-contracts` | Pomocniki kontraktów środowiska wykonawczego dostawcy, uwierzytelniania, wykrywania, onboardingu, katalogu, kreatora, możliwości multimedialnych, zasad odtwarzania, dźwięku na żywo STT w czasie rzeczywistym, wyszukiwania/pobierania w sieci i strumienia |
    | `plugin-sdk/provider-http-test-mocks` | Opcjonalne mocki HTTP/uwierzytelniania Vitest dla testów dostawców, które sprawdzają `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Ogólne fixtures przechwytywania środowiska wykonawczego CLI, kontekstu piaskownicy, zapisującego umiejętności, wiadomości agenta, zdarzenia systemowego, ponownego ładowania modułu, ścieżki wbudowanego Plugin, tekstu terminala, dzielenia na fragmenty, tokenu uwierzytelniającego i typowanych przypadków |
    | `plugin-sdk/test-node-mocks` | Ukierunkowane pomocniki mocków wbudowanych modułów Node do użycia wewnątrz fabryk Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Podścieżki pamięci">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Wbudowana powierzchnia pomocników memory-core dla pomocników menedżera/konfiguracji/plików/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada środowiska wykonawczego indeksu/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika podstawy hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrakty osadzeń hosta pamięci, dostęp do rejestru, dostawca lokalny oraz ogólne pomocniki wsadowe/zdalne |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika magazynu hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Pomocniki multimodalne hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Pomocniki zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Pomocniki sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Pomocniki dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-core-host-status` | Pomocniki statusu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Pomocniki środowiska wykonawczego CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Pomocniki rdzeniowego środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Pomocniki plików/środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny względem dostawcy alias pomocników rdzeniowego środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny względem dostawcy alias pomocników dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Neutralny względem dostawcy alias pomocników plików/środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-host-markdown` | Współdzielone pomocniki zarządzanego markdown dla Plugin powiązanych z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada środowiska wykonawczego Active memory dla dostępu do menedżera wyszukiwania |
    | `plugin-sdk/memory-host-status` | Neutralny względem dostawcy alias pomocników statusu hosta pamięci |
  </Accordion>

  <Accordion title="Zarezerwowane podścieżki wbudowanych pomocników">
    Obecnie nie ma zarezerwowanych podścieżek SDK wbudowanych pomocników. Pomocniki specyficzne dla właściciela
    znajdują się w pakiecie Plugin właściciela, natomiast kontrakty hosta wielokrotnego użytku
    używają ogólnych podścieżek SDK, takich jak `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` i `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Omówienie SDK Plugin](/pl/plugins/sdk-overview)
- [Konfiguracja SDK Plugin](/pl/plugins/sdk-setup)
- [Tworzenie Plugin](/pl/plugins/building-plugins)
