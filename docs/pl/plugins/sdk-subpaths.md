---
read_when:
    - Wybór właściwej podścieżki plugin-sdk dla importu Plugin
    - Audyt podścieżek dołączonych Pluginów i powierzchni pomocniczych
summary: 'Katalog podścieżek SDK Plugin: które importy znajdują się gdzie, pogrupowane według obszaru'
title: Podścieżki Plugin SDK
x-i18n:
    generated_at: "2026-05-02T20:57:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: bc0d2dcf030796d2c73d4d679b9f8d7f6a8aaf71c6b5232b60afbbb50f42b348
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

  SDK pluginów jest udostępniany jako zestaw wąskich podścieżek w `openclaw/plugin-sdk/`.
  Ta strona kataloguje często używane podścieżki pogrupowane według przeznaczenia. Wygenerowana
  pełna lista ponad 200 podścieżek znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`;
  zarezerwowane podścieżki pomocnicze dla dołączonych pluginów również się tam pojawiają, ale są szczegółem
  implementacyjnym, chyba że strona dokumentacji wyraźnie je promuje. Maintainerzy mogą audytować aktywne
  zarezerwowane podścieżki pomocnicze za pomocą `pnpm plugins:boundary-report:summary`; nieużywane
  zarezerwowane eksporty pomocnicze powodują niepowodzenie raportu CI zamiast pozostawać w publicznym SDK
  jako uśpiony dług kompatybilności.

  Przewodnik tworzenia pluginów znajdziesz w [Przegląd SDK Plugin](/pl/plugins/sdk-overview).

  ## Wejście Plugin

  | Podścieżka                                 | Kluczowe eksporty                                                                                                                                                             |
  | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
  | `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
  | `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
  | `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
  | `plugin-sdk/testing`                      | Szeroki barrel kompatybilności dla starszych testów pluginów; w nowych testach rozszerzeń preferuj ukierunkowane podścieżki testowe                                          |
  | `plugin-sdk/plugin-test-api`              | Minimalny builder mocka `OpenClawPluginApi` do bezpośrednich testów jednostkowych rejestracji pluginu                                                                         |
  | `plugin-sdk/agent-runtime-test-contracts` | Natywne fixture’y kontraktu adaptera środowiska uruchomieniowego agenta dla profili uwierzytelniania, wyciszania dostarczania, klasyfikacji fallbacku, hooków narzędzi, nakładek promptów, schematów i naprawy transkryptu |
  | `plugin-sdk/channel-test-helpers`         | Helpery testowe cyklu życia konta kanału, katalogu, konfiguracji wysyłania, mocka środowiska uruchomieniowego, hooka, wpisu dołączonego kanału, znacznika czasu koperty, odpowiedzi parowania oraz ogólnego kontraktu kanału |
  | `plugin-sdk/channel-target-testing`       | Wspólny zestaw testów przypadków błędów rozwiązywania celu kanału                                                                                                            |
  | `plugin-sdk/plugin-test-contracts`        | Helpery kontraktu rejestracji pluginu, manifestu pakietu, publicznego artefaktu, API środowiska uruchomieniowego, efektów ubocznych importu i bezpośredniego importu          |
  | `plugin-sdk/plugin-test-runtime`          | Fixture’y testowe środowiska uruchomieniowego pluginu, rejestru, rejestracji providera, kreatora konfiguracji oraz TaskFlow środowiska uruchomieniowego                      |
  | `plugin-sdk/provider-test-contracts`      | Helpery kontraktu środowiska uruchomieniowego providera, uwierzytelniania, discovery, onboardingu, katalogu, możliwości multimediów, polityki odtwarzania, realtime STT live-audio, web-search/fetch i kreatora |
  | `plugin-sdk/provider-http-test-mocks`     | Opcjonalne mocki HTTP/uwierzytelniania Vitest dla testów providerów, które wykonują `plugin-sdk/provider-http`                                                               |
  | `plugin-sdk/test-env`                     | Fixture’y środowiska testowego, fetch/sieci, jednorazowego serwera HTTP, żądania przychodzącego, live-testu, tymczasowego systemu plików i kontroli czasu                    |
  | `plugin-sdk/test-fixtures`                | Ogólne fixture’y testowe CLI, sandboxa, Skills, wiadomości agenta, zdarzenia systemowego, przeładowania modułu, ścieżki dołączonego pluginu, terminala, dzielenia na fragmenty, tokenu uwierzytelniania i typowanego przypadku |
  | `plugin-sdk/test-node-mocks`              | Ukierunkowane helpery mockowania wbudowanych modułów Node do użycia w fabrykach Vitest `vi.mock("node:*")`                                                                   |
  | `plugin-sdk/migration`                    | Helpery elementów providera migracji, takie jak `createMigrationItem`, stałe powodów, znaczniki statusu elementów, helpery redakcji i `summarizeMigrationItems`              |
  | `plugin-sdk/migration-runtime`            | Helpery migracji środowiska uruchomieniowego, takie jak `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` i `writeMigrationReport`                                 |

  <AccordionGroup>
  <Accordion title="Podścieżki kanałów">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport schematu Zod głównego `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Wspólne helpery kreatora konfiguracji, prompty listy dozwolonych, buildery statusu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpery konfiguracji wielu kont i bramki akcji, helpery fallbacku konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpery normalizacji identyfikatora konta |
    | `plugin-sdk/account-resolution` | Helpery wyszukiwania konta i fallbacku domyślnego |
    | `plugin-sdk/account-helpers` | Wąskie helpery listy kont i akcji konta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Wspólne prymitywy schematu konfiguracji kanału oraz buildery Zod i bezpośrednie JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Schematy konfiguracji dołączonych kanałów OpenClaw wyłącznie dla utrzymywanych dołączonych pluginów |
    | `plugin-sdk/channel-config-schema-legacy` | Przestarzały alias kompatybilności dla schematów konfiguracji dołączonych kanałów |
    | `plugin-sdk/telegram-command-config` | Helpery normalizacji/walidacji niestandardowych poleceń Telegram z fallbackiem kontraktu dołączonego pluginu |
    | `plugin-sdk/command-gating` | Wąskie helpery bramki autoryzacji poleceń |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue`, helpery cyklu życia/finalizacji szkicu strumienia |
    | `plugin-sdk/inbound-envelope` | Wspólne helpery trasy przychodzącej i buildera koperty |
    | `plugin-sdk/inbound-reply-dispatch` | Wspólne helpery rejestrowania i dispatchu przychodzącego |
    | `plugin-sdk/messaging-targets` | Helpery parsowania/dopasowywania celów |
    | `plugin-sdk/outbound-media` | Wspólne helpery ładowania multimediów wychodzących |
    | `plugin-sdk/outbound-send-deps` | Lekki lookup zależności wysyłania wychodzącego dla adapterów kanałów |
    | `plugin-sdk/outbound-runtime` | Helpery dostarczania wychodzącego, tożsamości, delegata wysyłania, sesji, formatowania i planowania payloadu |
    | `plugin-sdk/poll-runtime` | Wąskie helpery normalizacji ankiet |
    | `plugin-sdk/thread-bindings-runtime` | Helpery cyklu życia i adaptera powiązań wątku |
    | `plugin-sdk/agent-media-payload` | Starszy builder payloadu multimediów agenta |
    | `plugin-sdk/conversation-runtime` | Helpery konwersacji/powiązań wątku, parowania i skonfigurowanych powiązań |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshotu konfiguracji środowiska uruchomieniowego |
    | `plugin-sdk/runtime-group-policy` | Helpery rozwiązywania polityki grupowej środowiska uruchomieniowego |
    | `plugin-sdk/channel-status` | Wspólne helpery snapshotu/podsumowania statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Helpery autoryzacji zapisu konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Wspólne eksporty prelude pluginu kanału |
    | `plugin-sdk/allowlist-config-edit` | Helpery edycji/odczytu konfiguracji listy dozwolonych |
    | `plugin-sdk/group-access` | Wspólne helpery decyzji dostępu grupowego |
    | `plugin-sdk/direct-dm` | Wspólne helpery uwierzytelniania/guardów bezpośrednich DM |
    | `plugin-sdk/discord` | Przestarzała fasada kompatybilności Discord dla opublikowanego `@openclaw/discord@2026.3.13` i śledzonej kompatybilności właściciela; nowe pluginy powinny używać ogólnych podścieżek SDK kanałów |
    | `plugin-sdk/telegram-account` | Przestarzała fasada kompatybilności rozwiązywania kont Telegram dla śledzonej kompatybilności właściciela; nowe pluginy powinny używać wstrzykniętych helperów środowiska uruchomieniowego albo ogólnych podścieżek SDK kanałów |
    | `plugin-sdk/zalouser` | Przestarzała fasada kompatybilności Zalo Personal dla opublikowanych pakietów Lark/Zalo, które nadal importują autoryzację poleceń nadawcy; nowe pluginy powinny używać `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Helpery semantycznej prezentacji wiadomości, dostarczania i starszych interaktywnych odpowiedzi. Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel kompatybilności dla debounce przychodzących, dopasowywania wzmianek, helperów polityki wzmianek i helperów kopert |
    | `plugin-sdk/channel-inbound-debounce` | Wąskie helpery debounce przychodzących |
    | `plugin-sdk/channel-mention-gating` | Wąskie helpery polityki wzmianek, znacznika wzmianki i tekstu wzmianki bez szerszej powierzchni środowiska uruchomieniowego przychodzących |
    | `plugin-sdk/channel-envelope` | Wąskie helpery formatowania koperty przychodzącej |
    | `plugin-sdk/channel-location` | Helpery kontekstu lokalizacji kanału i formatowania |
    | `plugin-sdk/channel-logging` | Helpery logowania kanału dla odrzuceń przychodzących i błędów pisania/ack |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | Helpery akcji wiadomości kanału oraz przestarzałe helpery schematów natywnych zachowane dla kompatybilności pluginów |
    | `plugin-sdk/channel-route` | Wspólne helpery normalizacji tras, rozwiązywania celów sterowanego parserem, stringifikacji identyfikatora wątku, kluczy tras dedupe/compact, typów sparsowanych celów oraz porównywania tras/celów |
    | `plugin-sdk/channel-targets` | Helpery parsowania celów; wywołujący porównywanie tras powinni używać `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Typy kontraktu kanału |
    | `plugin-sdk/channel-feedback` | Okablowanie feedbacku/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` oraz typy celów sekretów |
  </Accordion>

  <Accordion title="Provider subpaths">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Obsługiwana fasada dostawcy LM Studio do konfiguracji, wykrywania katalogu i przygotowywania modeli w czasie wykonywania |
    | `plugin-sdk/lmstudio-runtime` | Obsługiwana fasada czasu wykonywania LM Studio dla domyślnych ustawień lokalnego serwera, wykrywania modeli, nagłówków żądań i pomocników dla załadowanych modeli |
    | `plugin-sdk/provider-setup` | Wyselekcjonowane pomocniki konfiguracji lokalnych/samohostowanych dostawców |
    | `plugin-sdk/self-hosted-provider-setup` | Wyspecjalizowane pomocniki konfiguracji samohostowanych dostawców zgodnych z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI + stałe watchdog |
    | `plugin-sdk/provider-auth-runtime` | Pomocniki rozwiązywania kluczy API w czasie wykonywania dla Pluginów dostawców |
    | `plugin-sdk/provider-auth-api-key` | Pomocniki wdrażania/zapisu profilu klucza API, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy konstruktor wyniku uwierzytelniania OAuth |
    | `plugin-sdk/provider-auth-login` | Współdzielone pomocniki interaktywnego logowania dla Pluginów dostawców |
    | `plugin-sdk/provider-env-vars` | Pomocniki wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory zasad odtwarzania, pomocniki punktów końcowych dostawcy oraz pomocniki normalizacji identyfikatorów modeli, takie jak `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hak czasu wykonywania rozszerzania katalogu dostawców oraz szwy rejestru Plugin-dostawca do testów kontraktowych |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ogólne pomocniki możliwości HTTP/punktów końcowych dostawcy, błędy HTTP dostawcy oraz pomocniki formularzy multipart do transkrypcji audio |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie pomocniki kontraktu konfiguracji/wyboru web-fetch, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Pomocniki rejestracji/pamięci podręcznej dostawcy web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Wąskie pomocniki konfiguracji/poświadczeń web-search dla dostawców, którzy nie potrzebują okablowania włączania Pluginu |
    | `plugin-sdk/provider-web-search-contract` | Wąskie pomocniki kontraktu konfiguracji/poświadczeń web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, oraz zakresowe settery/gettery poświadczeń |
    | `plugin-sdk/provider-web-search` | Pomocniki rejestracji/pamięci podręcznej/czasu wykonywania dostawcy web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematów Gemini + diagnostyka oraz pomocniki zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` i podobne |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz współdzielone pomocniki wrapperów Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Natywne pomocniki transportu dostawcy, takie jak chroniony fetch, przekształcenia komunikatów transportu i zapisywalne strumienie zdarzeń transportu |
    | `plugin-sdk/provider-onboard` | Pomocniki poprawek konfiguracji wdrażania |
    | `plugin-sdk/global-singleton` | Pomocniki singletonów/map/pamięci podręcznej lokalnych dla procesu |
    | `plugin-sdk/group-activation` | Wąskie pomocniki trybu aktywacji grupy i parsowania poleceń |
  </Accordion>

  <Accordion title="Auth and security subpaths">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, pomocniki rejestru poleceń, w tym formatowanie dynamicznego menu argumentów, pomocniki autoryzacji nadawcy |
    | `plugin-sdk/command-status` | Konstruktory komunikatów poleceń/pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Pomocniki rozwiązywania zatwierdzających i uwierzytelniania akcji w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Pomocniki natywnych profili/filtrów zatwierdzania exec |
    | `plugin-sdk/approval-delivery-runtime` | Natywne adaptery możliwości/dostarczania zatwierdzeń |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony pomocnik rozwiązywania Gateway zatwierdzeń |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie pomocniki ładowania natywnego adaptera zatwierdzeń dla gorących punktów wejścia kanałów |
    | `plugin-sdk/approval-handler-runtime` | Szersze pomocniki czasu wykonywania handlera zatwierdzeń; preferuj węższe szwy adaptera/Gateway, gdy wystarczają |
    | `plugin-sdk/approval-native-runtime` | Pomocniki natywnego celu zatwierdzeń + powiązania konta |
    | `plugin-sdk/approval-reply-runtime` | Pomocniki payloadu odpowiedzi zatwierdzenia exec/Pluginu |
    | `plugin-sdk/approval-runtime` | Pomocniki payloadu zatwierdzeń exec/Pluginu, natywne pomocniki routingu/czasu wykonywania zatwierdzeń oraz pomocniki strukturalnego wyświetlania zatwierdzeń, takie jak `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Wąskie pomocniki resetowania deduplikacji odpowiedzi przychodzących |
    | `plugin-sdk/channel-contract-testing` | Wąskie pomocniki testów kontraktowych kanału bez szerokiej beczki testowej |
    | `plugin-sdk/command-auth-native` | Natywne uwierzytelnianie poleceń, formatowanie dynamicznego menu argumentów i natywne pomocniki celu sesji |
    | `plugin-sdk/command-detection` | Współdzielone pomocniki wykrywania poleceń |
    | `plugin-sdk/command-primitives-runtime` | Lekkie predykaty tekstu poleceń dla gorących ścieżek kanałów |
    | `plugin-sdk/command-surface` | Normalizacja treści polecenia i pomocniki powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąskie pomocniki zbierania kontraktów sekretów dla powierzchni sekretów kanału/Pluginu |
    | `plugin-sdk/secret-ref-runtime` | Wąskie pomocniki typowania `coerceSecretRef` i SecretRef do parsowania kontraktu sekretów/konfiguracji |
    | `plugin-sdk/security-runtime` | Współdzielone pomocniki zaufania, bramkowania DM, treści zewnętrznych, redakcji tekstu wrażliwego, porównywania sekretów w stałym czasie i zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Pomocniki listy dozwolonych hostów i zasad SSRF dla sieci prywatnej |
    | `plugin-sdk/ssrf-dispatcher` | Wąskie pomocniki przypiętego dispatchera bez szerokiej powierzchni czasu wykonywania infrastruktury |
    | `plugin-sdk/ssrf-runtime` | Pomocniki przypiętego dispatchera, fetch chroniony przed SSRF, błąd SSRF i pomocniki zasad SSRF |
    | `plugin-sdk/secret-input` | Pomocniki parsowania danych wejściowych sekretu |
    | `plugin-sdk/webhook-ingress` | Pomocniki żądań/celów Webhook oraz koercja surowego websocket/body |
    | `plugin-sdk/webhook-request-guards` | Pomocniki rozmiaru/limitu czasu treści żądania |
  </Accordion>

  <Accordion title="Podścieżki środowiska uruchomieniowego i pamięci masowej">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie helpery środowiska uruchomieniowego, logowania, kopii zapasowych i instalacji pluginów |
    | `plugin-sdk/runtime-env` | Wąskie helpery środowiska uruchomieniowego, loggera, limitu czasu, ponawiania i opóźniania wykładniczego |
    | `plugin-sdk/browser-config` | Obsługiwana fasada konfiguracji przeglądarki do znormalizowanego profilu/wartości domyślnych, parsowania adresów URL CDP i helperów uwierzytelniania sterowania przeglądarką |
    | `plugin-sdk/channel-runtime-context` | Generyczne helpery rejestracji i wyszukiwania kontekstu środowiska uruchomieniowego kanału |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Wspólne helpery poleceń, hooków, HTTP i interakcji pluginu |
    | `plugin-sdk/hook-runtime` | Wspólne helpery potoku Webhooków/hooków wewnętrznych |
    | `plugin-sdk/lazy-runtime` | Helpery leniwego importu/powiązania środowiska uruchomieniowego, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpery wykonywania procesów |
    | `plugin-sdk/cli-runtime` | Helpery formatowania CLI, oczekiwania, wersji, wywoływania argumentów i leniwych grup poleceń |
    | `plugin-sdk/gateway-runtime` | Klient Gateway, helper uruchamiania klienta gotowego na pętlę zdarzeń, RPC CLI Gateway, błędy protokołu Gateway i helpery poprawek statusu kanału |
    | `plugin-sdk/config-types` | Powierzchnia konfiguracji tylko typów dla kształtów konfiguracji pluginu, takich jak `OpenClawConfig` oraz typy konfiguracji kanału/dostawcy |
    | `plugin-sdk/plugin-config-runtime` | Helpery wyszukiwania konfiguracji pluginu w środowisku uruchomieniowym, takie jak `requireRuntimeConfig`, `resolvePluginConfigObject` i `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helpery transakcyjnej mutacji konfiguracji, takie jak `mutateConfigFile`, `replaceConfigFile` i `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helpery migawki konfiguracji bieżącego procesu, takie jak `getRuntimeConfig`, `getRuntimeConfigSnapshot` i settery migawek testowych |
    | `plugin-sdk/telegram-command-config` | Normalizacja nazw/opisów poleceń Telegram oraz kontrole duplikatów/konfliktów, nawet gdy dołączona powierzchnia kontraktu Telegram jest niedostępna |
    | `plugin-sdk/text-autolink-runtime` | Wykrywanie automatycznych linków odwołań do plików bez szerokiego barrela text-runtime |
    | `plugin-sdk/approval-runtime` | Helpery zatwierdzania exec/pluginów, konstruktory możliwości zatwierdzania, helpery uwierzytelniania/profili, helpery natywnego routingu/środowiska uruchomieniowego oraz formatowanie ścieżki wyświetlania ustrukturyzowanych zatwierdzeń |
    | `plugin-sdk/reply-runtime` | Wspólne helpery środowiska uruchomieniowego wiadomości przychodzących/odpowiedzi, dzielenie na fragmenty, wysyłanie, Heartbeat, planista odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery wysyłania/finalizacji odpowiedzi i etykiet konwersacji |
    | `plugin-sdk/reply-history` | Wspólne helpery krótkiego okna historii odpowiedzi i znaczniki, takie jak `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie helpery dzielenia tekstu/Markdown na fragmenty |
    | `plugin-sdk/session-store-runtime` | Helpery ścieżki magazynu sesji, klucza sesji, znacznika aktualizacji i mutacji magazynu |
    | `plugin-sdk/cron-store-runtime` | Helpery ścieżki/wczytywania/zapisu magazynu Cron |
    | `plugin-sdk/state-paths` | Helpery ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/routing` | Helpery routingu/klucza sesji/powiązania konta, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Wspólne helpery podsumowania statusu kanału/konta, domyślne wartości stanu środowiska uruchomieniowego i helpery metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Wspólne helpery rozwiązywania celu |
    | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji slugów/ciągów znaków |
    | `plugin-sdk/request-url` | Wyodrębnianie adresów URL jako ciągów znaków z wejść podobnych do fetch/request |
    | `plugin-sdk/run-command` | Runner poleceń z limitem czasu i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Wspólne czytniki parametrów narzędzi/CLI |
    | `plugin-sdk/tool-payload` | Wyodrębnianie znormalizowanych ładunków z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
    | `plugin-sdk/temp-path` | Wspólne helpery ścieżek tymczasowego pobierania |
    | `plugin-sdk/logging-core` | Helpery loggera podsystemu i redagowania |
    | `plugin-sdk/markdown-table-runtime` | Helpery trybu tabel Markdown i konwersji |
    | `plugin-sdk/model-session-runtime` | Helpery nadpisywania modelu/sesji, takie jak `applyModelOverrideToSessionEntry` i `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpery rozwiązywania konfiguracji dostawcy rozmów |
    | `plugin-sdk/json-store` | Małe helpery odczytu/zapisu stanu JSON |
    | `plugin-sdk/file-lock` | Helpery reentrant blokady pliku |
    | `plugin-sdk/persistent-dedupe` | Helpery pamięci podręcznej deduplikacji wspieranej dyskiem |
    | `plugin-sdk/acp-runtime` | Helpery środowiska uruchomieniowego/sesji ACP i wysyłania odpowiedzi |
    | `plugin-sdk/acp-runtime-backend` | Lekkie helpery rejestracji backendu ACP i wysyłania odpowiedzi dla pluginów ładowanych podczas uruchamiania |
    | `plugin-sdk/acp-binding-resolve-runtime` | Rozwiązywanie powiązań ACP tylko do odczytu bez importów uruchamiania cyklu życia |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji środowiska uruchomieniowego agenta |
    | `plugin-sdk/boolean-param` | Luźny czytnik parametrów boolowskich |
    | `plugin-sdk/dangerous-name-runtime` | Helpery rozwiązywania dopasowań niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Helpery inicjalizacji urządzenia i tokenów parowania |
    | `plugin-sdk/extension-shared` | Wspólne prymitywy helperów pasywnego kanału, statusu i ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Helpery odpowiedzi polecenia/dostawcy `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpery listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Helpery rejestru/budowania/serializacji poleceń natywnych |
    | `plugin-sdk/agent-harness` | Eksperymentalna powierzchnia zaufanego pluginu dla niskopoziomowych uprzęży agenta: typy uprzęży, helpery sterowania/przerywania aktywnego uruchomienia, helpery mostka narzędzi OpenClaw, helpery zasad narzędzi planu środowiska uruchomieniowego, klasyfikacja wyników terminala, helpery formatowania/szczegółów postępu narzędzi oraz narzędzia wyników prób |
    | `plugin-sdk/provider-zai-endpoint` | Helpery wykrywania punktu końcowego Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper lokalnej dla procesu blokady asynchronicznej dla małych plików stanu środowiska uruchomieniowego |
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
    | `plugin-sdk/infra-runtime` | Przestarzały shim zgodności; użyj powyższych skoncentrowanych podścieżek środowiska uruchomieniowego |
    | `plugin-sdk/collection-runtime` | Małe helpery ograniczonej pamięci podręcznej |
    | `plugin-sdk/diagnostic-runtime` | Helpery flag diagnostycznych, zdarzeń i kontekstu śledzenia |
    | `plugin-sdk/error-runtime` | Helpery grafu błędów, formatowania i wspólnej klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Opakowany fetch, proxy, opcja EnvHttpProxyAgent i helpery przypiętego wyszukiwania |
    | `plugin-sdk/runtime-fetch` | Świadomy dispatchera fetch środowiska uruchomieniowego bez importów proxy/chronionego fetch |
    | `plugin-sdk/response-limit-runtime` | Ograniczony czytnik treści odpowiedzi bez szerokiej powierzchni środowiska uruchomieniowego multimediów |
    | `plugin-sdk/session-binding-runtime` | Bieżący stan powiązania konwersacji bez skonfigurowanego routingu powiązań ani magazynów parowania |
    | `plugin-sdk/session-store-runtime` | Helpery magazynu sesji bez szerokich importów zapisu/utrzymania konfiguracji |
    | `plugin-sdk/context-visibility-runtime` | Rozwiązywanie widoczności kontekstu i filtrowanie kontekstu uzupełniającego bez szerokich importów konfiguracji/zabezpieczeń |
    | `plugin-sdk/string-coerce-runtime` | Wąskie helpery koercji i normalizacji rekordów prymitywnych/ciągów znaków bez importów markdown/logowania |
    | `plugin-sdk/host-runtime` | Helpery normalizacji nazwy hosta i hosta SCP |
    | `plugin-sdk/retry-runtime` | Helpery konfiguracji ponawiania i runnera ponawiania |
    | `plugin-sdk/agent-runtime` | Helpery katalogu agenta/tożsamości/przestrzeni roboczej |
    | `plugin-sdk/directory-runtime` | Zapytania/deduplikacja katalogów oparta na konfiguracji |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Podścieżki możliwości i testowania">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Współdzielone helpery pobierania/przekształcania/przechowywania multimediów, wykrywanie wymiarów wideo oparte na ffprobe oraz konstruktory payloadów multimediów |
    | `plugin-sdk/media-store` | Wąskie helpery magazynu multimediów, takie jak `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Współdzielone helpery przełączania awaryjnego generowania multimediów, wybór kandydatów i komunikaty o brakującym modelu |
    | `plugin-sdk/media-understanding` | Typy dostawców rozumienia multimediów oraz eksporty helperów obrazów/audio dla dostawców |
    | `plugin-sdk/text-runtime` | Współdzielone helpery tekstu/Markdown/logowania, takie jak usuwanie tekstu widocznego dla asystenta, helpery renderowania/dzielenia na fragmenty/tabel Markdown, helpery redakcji, helpery tagów dyrektyw i narzędzia bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Helper dzielenia tekstu wychodzącego na fragmenty |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz eksporty dyrektyw, rejestru, walidacji, konstruktora TTS zgodnego z OpenAI i helperów mowy dla dostawców |
    | `plugin-sdk/speech-core` | Współdzielone typy dostawców mowy, rejestr, dyrektywa, normalizacja i eksporty helperów mowy |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji w czasie rzeczywistym, helpery rejestru i współdzielony helper sesji WebSocket |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu w czasie rzeczywistym i helpery rejestru |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów oraz helpery zasobów obrazów/adresów URL danych i konstruktor dostawcy obrazów zgodny z OpenAI |
    | `plugin-sdk/image-generation-core` | Współdzielone typy generowania obrazów, przełączanie awaryjne, uwierzytelnianie i helpery rejestru |
    | `plugin-sdk/music-generation` | Typy dostawców/żądań/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Współdzielone typy generowania muzyki, helpery przełączania awaryjnego, wyszukiwanie dostawców i parsowanie odwołań do modeli |
    | `plugin-sdk/video-generation` | Typy dostawców/żądań/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo, helpery przełączania awaryjnego, wyszukiwanie dostawców i parsowanie odwołań do modeli |
    | `plugin-sdk/webhook-targets` | Rejestr celów Webhook i helpery instalowania tras |
    | `plugin-sdk/webhook-path` | Helpery normalizacji ścieżek Webhook |
    | `plugin-sdk/web-media` | Współdzielone helpery ładowania zdalnych/lokalnych multimediów |
    | `plugin-sdk/zod` | Ponownie eksportowany `zod` dla konsumentów SDK Plugin |
    | `plugin-sdk/testing` | Szeroki barrel zgodności dla starszych testów Plugin. Nowe testy rozszerzeń powinny zamiast tego importować wyspecjalizowane podścieżki SDK, takie jak `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` lub `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Minimalny helper `createTestPluginApi` do bezpośrednich testów jednostkowych rejestracji Plugin bez importowania mostków helperów testowych repozytorium |
    | `plugin-sdk/agent-runtime-test-contracts` | Natywne fikstury kontraktów adaptera środowiska wykonawczego agenta dla testów uwierzytelniania, dostarczania, fallbacku, hooków narzędzi, nakładki promptu, schematu i projekcji transkrypcji |
    | `plugin-sdk/channel-test-helpers` | Helpery testowe ukierunkowane na kanały dla ogólnych kontraktów akcji/konfiguracji/statusu, asercji katalogu, cyklu życia uruchamiania konta, wątkowania konfiguracji wysyłania, mocków środowiska wykonawczego, problemów statusu, dostarczania wychodzącego i rejestracji hooków |
    | `plugin-sdk/channel-target-testing` | Współdzielony zestaw przypadków błędów rozwiązywania celów dla testów kanałów |
    | `plugin-sdk/plugin-test-contracts` | Helpery kontraktów pakietu Plugin, rejestracji, artefaktu publicznego, bezpośredniego importu, API środowiska wykonawczego i efektów ubocznych importu |
    | `plugin-sdk/provider-test-contracts` | Helpery kontraktów środowiska wykonawczego dostawcy, uwierzytelniania, odkrywania, onboardingu, katalogu, kreatora, możliwości multimediów, polityki odtwarzania, dźwięku na żywo STT w czasie rzeczywistym, wyszukiwania/pobierania w sieci i strumienia |
    | `plugin-sdk/provider-http-test-mocks` | Opcjonalne mocki HTTP/uwierzytelniania Vitest dla testów dostawców, które sprawdzają `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Ogólne fikstury przechwytywania środowiska wykonawczego CLI, kontekstu piaskownicy, autora Skills, komunikatu agenta, zdarzenia systemowego, ponownego ładowania modułu, ścieżki dołączonego Plugin, tekstu terminala, dzielenia na fragmenty, tokenu uwierzytelniania i typowanych przypadków |
    | `plugin-sdk/test-node-mocks` | Wyspecjalizowane helpery mocków wbudowanych modułów Node do użycia wewnątrz fabryk Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Podścieżki pamięci">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Dołączona powierzchnia helperów memory-core dla helperów menedżera/konfiguracji/plików/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada środowiska wykonawczego indeksu/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika podstawowego hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrakty osadzeń hosta pamięci, dostęp do rejestru, lokalny dostawca i ogólne helpery wsadowe/zdalne |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika magazynu hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Helpery multimodalne hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Helpery dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-core-host-status` | Helpery statusu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpery środowiska wykonawczego CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpery podstawowego środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny względem dostawcy alias dla helperów podstawowego środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny względem dostawcy alias dla helperów dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Neutralny względem dostawcy alias dla helperów plików/środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-host-markdown` | Współdzielone helpery zarządzanego Markdown dla Plugin sąsiadujących z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada środowiska wykonawczego pamięci aktywnej dla dostępu do menedżera wyszukiwania |
    | `plugin-sdk/memory-host-status` | Neutralny względem dostawcy alias dla helperów statusu hosta pamięci |
  </Accordion>

  <Accordion title="Zarezerwowane podścieżki dołączonych helperów">
    Obecnie nie ma zarezerwowanych podścieżek SDK dla dołączonych helperów. Helpery specyficzne dla właściciela
    znajdują się w pakiecie Plugin właściciela, natomiast kontrakty hosta wielokrotnego użytku
    używają ogólnych podścieżek SDK, takich jak `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` i `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Omówienie SDK Plugin](/pl/plugins/sdk-overview)
- [Konfiguracja SDK Plugin](/pl/plugins/sdk-setup)
- [Tworzenie Plugin](/pl/plugins/building-plugins)
