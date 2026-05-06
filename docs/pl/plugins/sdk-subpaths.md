---
read_when:
    - Wybór właściwej podścieżki plugin-sdk dla importu Plugin
    - Audyt podścieżek dołączonych Pluginów i interfejsów pomocniczych
summary: 'Katalog podścieżek Plugin SDK: gdzie znajdują się poszczególne importy, pogrupowane według obszaru'
title: Podścieżki Plugin SDK
x-i18n:
    generated_at: "2026-05-06T09:25:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 98b16cd3fcd6babc64df20ad4e679c35553fc21894617f30907bbf0e579a4d89
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin jest udostępniany jako zestaw wąskich podścieżek pod `openclaw/plugin-sdk/`.
Ta strona kataloguje często używane podścieżki pogrupowane według przeznaczenia. Wygenerowana
pełna lista ponad 200 podścieżek znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`;
zarezerwowane podścieżki pomocnicze dla wbudowanych pluginów pojawiają się tam, ale są szczegółem
implementacyjnym, chyba że strona dokumentacji wyraźnie je promuje. Maintainerzy mogą audytować aktywne
zarezerwowane podścieżki pomocnicze za pomocą `pnpm plugins:boundary-report:summary`; nieużywane
zarezerwowane eksporty pomocnicze powodują niepowodzenie raportu CI zamiast pozostawać w publicznym SDK
jako uśpiony dług kompatybilności.

Przewodnik tworzenia Plugin znajdziesz w [Omówienie SDK Plugin](/pl/plugins/sdk-overview).

## Wpis Plugin

| Podścieżka                                 | Kluczowe eksporty                                                                                                                                                            |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`                 | `definePluginEntry`                                                                                                                                                          |
| `plugin-sdk/core`                         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`       |
| `plugin-sdk/config-schema`                | `OpenClawSchema`                                                                                                                                                             |
| `plugin-sdk/provider-entry`               | `defineSingleProviderPluginEntry`                                                                                                                                            |
| `plugin-sdk/testing`                      | Szeroki barrel kompatybilności dla starszych testów pluginów; w nowych testach rozszerzeń preferuj ukierunkowane podścieżki testowe                                        |
| `plugin-sdk/plugin-test-api`              | Minimalny kreator mocków `OpenClawPluginApi` do bezpośrednich testów jednostkowych rejestracji pluginu                                                                       |
| `plugin-sdk/agent-runtime-test-contracts` | Natywne fixture kontraktów adaptera agent-runtime dla profili auth, pomijania dostarczania, klasyfikacji fallback, hooków narzędzi, nakładek promptów, schematów i naprawy transkryptu |
| `plugin-sdk/channel-test-helpers`         | Pomocniki testowe dla cyklu życia konta kanału, katalogu, send-config, mocka runtime, hooka, wpisu wbudowanego kanału, znacznika czasu koperty, odpowiedzi parowania i ogólnego kontraktu kanału |
| `plugin-sdk/channel-target-testing`       | Wspólny zestaw testów przypadków błędów rozpoznawania celu kanału                                                                                                            |
| `plugin-sdk/plugin-test-contracts`        | Pomocniki kontraktów rejestracji pluginu, manifestu pakietu, publicznego artefaktu, API runtime, efektu ubocznego importu i bezpośredniego importu                          |
| `plugin-sdk/plugin-test-runtime`          | Fixture runtime pluginu, rejestru, rejestracji providera, kreatora konfiguracji i runtime task-flow do testów                                                               |
| `plugin-sdk/provider-test-contracts`      | Pomocniki kontraktów runtime providera, auth, discovery, onboard, katalogu, możliwości media, zasad replay, realtime STT live-audio, web-search/fetch i kreatora             |
| `plugin-sdk/provider-http-test-mocks`     | Opcjonalne mocki HTTP/auth Vitest dla testów providerów, które wykonują `plugin-sdk/provider-http`                                                                           |
| `plugin-sdk/test-env`                     | Fixture środowiska testowego, fetch/network, jednorazowego serwera HTTP, żądania przychodzącego, live-test, tymczasowego systemu plików i kontroli czasu                    |
| `plugin-sdk/test-fixtures`                | Ogólne fixture CLI, sandboxa, skill, agent-message, system-event, przeładowania modułu, ścieżki wbudowanego pluginu, terminala, chunkingu, auth-token i typowanych przypadków testowych |
| `plugin-sdk/test-node-mocks`              | Ukierunkowane pomocniki mocków wbudowanych Node do użycia wewnątrz fabryk Vitest `vi.mock("node:*")`                                                                         |
| `plugin-sdk/migration`                    | Pomocniki elementów providera migracji, takie jak `createMigrationItem`, stałe powodów, znaczniki statusu elementów, pomocniki redakcji i `summarizeMigrationItems`          |
| `plugin-sdk/migration-runtime`            | Pomocniki migracji runtime, takie jak `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` i `writeMigrationReport`                                                   |

  <AccordionGroup>
  <Accordion title="Channel subpaths">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod dla `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone pomocniki kreatora konfiguracji, monity listy dozwolonych, konstruktory statusu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Pomocniki konfiguracji wielu kont i bramki akcji, pomocniki awaryjnego konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, pomocniki normalizacji identyfikatora konta |
    | `plugin-sdk/account-resolution` | Pomocniki wyszukiwania konta i domyślnego rozwiązania awaryjnego |
    | `plugin-sdk/account-helpers` | Wąskie pomocniki listy kont i akcji konta |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Pomocniki starszego potoku odpowiedzi. Nowy kod potoku odpowiedzi kanału powinien używać `createChannelMessageReplyPipeline` i `resolveChannelMessageSourceReplyDeliveryMode` z `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Współdzielone prymitywy schematu konfiguracji kanału oraz konstruktory Zod i bezpośrednie konstruktory JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Schematy konfiguracji kanałów OpenClaw w pakiecie tylko dla utrzymywanych Pluginów w pakiecie |
    | `plugin-sdk/channel-config-schema-legacy` | Przestarzały alias zgodności dla schematów konfiguracji kanałów w pakiecie |
    | `plugin-sdk/telegram-command-config` | Pomocniki normalizacji i walidacji niestandardowych poleceń Telegram z awaryjnym kontraktem w pakiecie |
    | `plugin-sdk/command-gating` | Wąskie pomocniki bramki autoryzacji poleceń |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` oraz pomocniki cyklu życia starszego strumienia wersji roboczej. Nowy kod finalizacji podglądu powinien używać `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Tanie pomocniki kontraktu cyklu życia wiadomości, takie jak `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, fasady zgodności, wyprowadzanie zdolności trwałej finalizacji, pomocniki dowodów zdolności dla zdolności wysyłania/odbioru/skutków ubocznych, `MessageReceiveContext`, dowody zasad potwierdzania odbioru, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, dowody zdolności podglądu na żywo i finalizatora na żywo, stan trwałego odzyskiwania, `RenderedMessageBatch`, typy potwierdzeń odbioru wiadomości oraz pomocniki identyfikatorów potwierdzeń odbioru. Zobacz [API wiadomości kanału](/pl/plugins/sdk-channel-message). Starsze `createChannelTurnReplyPipeline` pozostaje tylko dla dyspozytorów zgodności. |
    | `plugin-sdk/channel-message-runtime` | Pomocniki dostarczania w czasie wykonywania, które mogą ładować dostarczanie wychodzące, w tym `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch`, `withDurableMessageSendContext`, `dispatchChannelMessageReplyWithBase` i `recordChannelMessageReplyDispatch`. Używaj z modułów środowiska uruchomieniowego monitorowania/wysyłania, nie z gorących plików uruchamiania Pluginu. |
    | `plugin-sdk/inbound-envelope` | Współdzielone pomocniki trasy przychodzącej i konstruktora koperty |
    | `plugin-sdk/inbound-reply-dispatch` | Starsze współdzielone pomocniki rejestrowania i dyspozycji ruchu przychodzącego, predykaty dyspozycji widocznej/finalnej oraz przestarzała zgodność `deliverDurableInboundReplyPayload` dla przygotowanych dyspozytorów kanałów. Nowy kod odbioru/dyspozycji kanału powinien importować pomocniki cyklu życia środowiska uruchomieniowego z `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Pomocniki parsowania i dopasowywania celów |
    | `plugin-sdk/outbound-media` | Współdzielone pomocniki ładowania mediów wychodzących |
    | `plugin-sdk/outbound-send-deps` | Lekkie wyszukiwanie zależności wysyłania wychodzącego dla adapterów kanałów |
    | `plugin-sdk/outbound-runtime` | Pomocniki dostarczania wychodzącego, tożsamości, delegata wysyłania, sesji, formatowania i planowania ładunku |
    | `plugin-sdk/poll-runtime` | Wąskie pomocniki normalizacji ankiet |
    | `plugin-sdk/thread-bindings-runtime` | Pomocniki cyklu życia powiązań wątków i adapterów |
    | `plugin-sdk/agent-media-payload` | Starszy konstruktor ładunku multimediów agenta |
    | `plugin-sdk/conversation-runtime` | Pomocniki konwersacji/powiązania wątku, parowania i skonfigurowanego powiązania |
    | `plugin-sdk/runtime-config-snapshot` | Pomocnik migawki konfiguracji środowiska uruchomieniowego |
    | `plugin-sdk/runtime-group-policy` | Pomocniki rozwiązywania zasad grupowych środowiska uruchomieniowego |
    | `plugin-sdk/channel-status` | Współdzielone pomocniki migawki i podsumowania statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Pomocniki autoryzacji zapisu konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty wstępu Pluginu kanału |
    | `plugin-sdk/allowlist-config-edit` | Pomocniki edycji i odczytu konfiguracji listy dozwolonych |
    | `plugin-sdk/group-access` | Współdzielone pomocniki decyzji dostępu grupowego |
    | `plugin-sdk/direct-dm` | Współdzielone pomocniki autoryzacji i strażnika bezpośrednich wiadomości DM |
    | `plugin-sdk/discord` | Przestarzała fasada zgodności Discord dla opublikowanego `@openclaw/discord@2026.3.13` i śledzonej zgodności właściciela; nowe Pluginy powinny używać ogólnych podścieżek SDK kanału |
    | `plugin-sdk/telegram-account` | Przestarzała fasada zgodności rozwiązywania kont Telegram dla śledzonej zgodności właściciela; nowe Pluginy powinny używać wstrzykiwanych pomocników środowiska uruchomieniowego lub ogólnych podścieżek SDK kanału |
    | `plugin-sdk/zalouser` | Przestarzała fasada zgodności Zalo Personal dla opublikowanych pakietów Lark/Zalo, które nadal importują autoryzację poleceń nadawcy; nowe Pluginy powinny używać `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Semantyczna prezentacja wiadomości, dostarczanie i starsze pomocniki odpowiedzi interaktywnych. Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Beczka zgodności dla odbicia przychodzącego, dopasowywania wzmianek, pomocników zasad wzmianek i pomocników kopert |
    | `plugin-sdk/channel-inbound-debounce` | Wąskie pomocniki odbicia przychodzącego |
    | `plugin-sdk/channel-mention-gating` | Wąskie pomocniki zasad wzmianek, znaczników wzmianek i tekstu wzmianek bez szerszej powierzchni środowiska uruchomieniowego przychodzącego |
    | `plugin-sdk/channel-envelope` | Wąskie pomocniki formatowania kopert przychodzących |
    | `plugin-sdk/channel-location` | Kontekst lokalizacji kanału i pomocniki formatowania |
    | `plugin-sdk/channel-logging` | Pomocniki rejestrowania kanału dla odrzuceń przychodzących oraz błędów wpisywania/potwierdzania |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | Pomocniki akcji wiadomości kanału oraz przestarzałe pomocniki schematu natywnego zachowane dla zgodności Pluginu |
    | `plugin-sdk/channel-route` | Współdzielone pomocniki normalizacji tras, rozwiązywania celów sterowanego parserem, konwersji identyfikatora wątku na ciąg znaków, deduplikacji/kompaktowania kluczy tras, typów sparsowanych celów oraz porównywania tras/celów |
    | `plugin-sdk/channel-targets` | Pomocniki parsowania celów; wywołujący porównanie tras powinni używać `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Typy kontraktu kanału |
    | `plugin-sdk/channel-feedback` | Okablowanie opinii/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie pomocniki kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` oraz typy celów sekretów |
  </Accordion>

  <Accordion title="Ścieżki podrzędne dostawców">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Obsługiwana fasada dostawcy LM Studio do konfiguracji, wykrywania katalogu i przygotowywania modeli w czasie działania |
    | `plugin-sdk/lmstudio-runtime` | Obsługiwana fasada środowiska uruchomieniowego LM Studio dla domyślnych ustawień serwera lokalnego, wykrywania modeli, nagłówków żądań i pomocników załadowanych modeli |
    | `plugin-sdk/provider-setup` | Wyselekcjonowane pomocniki konfiguracji lokalnych/samodzielnie hostowanych dostawców |
    | `plugin-sdk/self-hosted-provider-setup` | Wyspecjalizowane pomocniki konfiguracji samodzielnie hostowanych dostawców zgodnych z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI + stałe watchdog |
    | `plugin-sdk/provider-auth-runtime` | Pomocniki rozpoznawania kluczy API w czasie działania dla Pluginów dostawców |
    | `plugin-sdk/provider-auth-api-key` | Pomocniki onboardingu kluczy API/zapisu profilu, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy konstruktor wyniku uwierzytelniania OAuth |
    | `plugin-sdk/provider-auth-login` | Wspólne pomocniki interaktywnego logowania dla Pluginów dostawców |
    | `plugin-sdk/provider-env-vars` | Pomocniki wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, przestarzały eksport zgodności `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory zasad odtwarzania, pomocniki punktów końcowych dostawców oraz pomocniki normalizacji identyfikatorów modeli, takie jak `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-runtime` | Hook środowiska uruchomieniowego rozszerzania katalogu dostawców i szwy rejestru dostawców Pluginów do testów kontraktowych |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ogólne pomocniki możliwości HTTP/punktów końcowych dostawców, błędy HTTP dostawców i pomocniki formularzy multipart do transkrypcji audio |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie pomocniki kontraktu konfiguracji/wyboru pobierania z sieci, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Pomocniki rejestracji/pamięci podręcznej dostawcy pobierania z sieci |
    | `plugin-sdk/provider-web-search-config-contract` | Wąskie pomocniki konfiguracji/poświadczeń wyszukiwania w sieci dla dostawców, którzy nie potrzebują okablowania włączania Pluginu |
    | `plugin-sdk/provider-web-search-contract` | Wąskie pomocniki kontraktu konfiguracji/poświadczeń wyszukiwania w sieci, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowe settery/gettery poświadczeń |
    | `plugin-sdk/provider-web-search` | Pomocniki rejestracji/pamięci podręcznej/środowiska uruchomieniowego dostawcy wyszukiwania w sieci |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematów Gemini + diagnostyka oraz pomocniki zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` i podobne |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz współdzielone pomocniki wrapperów Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Pomocniki natywnego transportu dostawców, takie jak chronione fetch, transformacje komunikatów transportowych i zapisywalne strumienie zdarzeń transportowych |
    | `plugin-sdk/provider-onboard` | Pomocniki łatek konfiguracji onboardingu |
    | `plugin-sdk/global-singleton` | Pomocniki singletonów/map/pamięci podręcznych lokalnych dla procesu |
    | `plugin-sdk/group-activation` | Wąskie pomocniki trybu aktywacji grupy i parsowania poleceń |
  </Accordion>

  <Accordion title="Ścieżki podrzędne uwierzytelniania i zabezpieczeń">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, pomocniki rejestru poleceń, w tym dynamiczne formatowanie menu argumentów, pomocniki autoryzacji nadawcy |
    | `plugin-sdk/command-status` | Konstruktory komunikatów poleceń/pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Pomocniki rozpoznawania zatwierdzających i uwierzytelniania działań w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Pomocniki profili/filtrów natywnego zatwierdzania exec |
    | `plugin-sdk/approval-delivery-runtime` | Natywne adaptery możliwości/dostarczania zatwierdzeń |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony pomocnik rozpoznawania Gateway zatwierdzeń |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie pomocniki ładowania natywnego adaptera zatwierdzeń dla gorących punktów wejścia kanału |
    | `plugin-sdk/approval-handler-runtime` | Szersze pomocniki środowiska uruchomieniowego obsługi zatwierdzeń; preferuj węższe szwy adaptera/Gateway, gdy są wystarczające |
    | `plugin-sdk/approval-native-runtime` | Natywny cel zatwierdzeń + pomocniki wiązania kont |
    | `plugin-sdk/approval-reply-runtime` | Pomocniki ładunku odpowiedzi zatwierdzeń exec/Pluginu |
    | `plugin-sdk/approval-runtime` | Pomocniki ładunku zatwierdzeń exec/Pluginu, pomocniki routingu/środowiska uruchomieniowego natywnych zatwierdzeń oraz pomocniki uporządkowanego wyświetlania zatwierdzeń, takie jak `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Wąskie pomocniki resetowania deduplikacji odpowiedzi przychodzących |
    | `plugin-sdk/channel-contract-testing` | Wąskie pomocniki testów kontraktu kanału bez szerokiego barrel testowego |
    | `plugin-sdk/command-auth-native` | Natywne uwierzytelnianie poleceń, dynamiczne formatowanie menu argumentów i natywne pomocniki celu sesji |
    | `plugin-sdk/command-detection` | Współdzielone pomocniki wykrywania poleceń |
    | `plugin-sdk/command-primitives-runtime` | Lekkie predykaty tekstu polecenia dla gorących ścieżek kanałów |
    | `plugin-sdk/command-surface` | Normalizacja treści polecenia i pomocniki powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąskie pomocniki zbierania kontraktów sekretów dla powierzchni sekretów kanału/Pluginu |
    | `plugin-sdk/secret-ref-runtime` | Wąskie pomocniki typowania `coerceSecretRef` i SecretRef do parsowania kontraktu sekretów/konfiguracji |
    | `plugin-sdk/security-runtime` | Współdzielone pomocniki zaufania, bramkowania DM, plików/ścieżek ograniczonych do katalogu głównego, w tym zapisy tylko tworzące, synchroniczne/asynchroniczne atomowe zastępowanie plików, zapisy do tymczasowych plików sąsiednich, fallback przenoszenia między urządzeniami, pomocniki prywatnego magazynu plików, strażnicy rodzica symlinków, treści zewnętrzne, redakcja tekstu wrażliwego, porównywanie sekretów w stałym czasie i pomocniki zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Pomocniki listy dozwolonych hostów i zasad SSRF dla sieci prywatnych |
    | `plugin-sdk/ssrf-dispatcher` | Wąskie pomocniki przypiętego dyspozytora bez szerokiej powierzchni infrastruktury środowiska uruchomieniowego |
    | `plugin-sdk/ssrf-runtime` | Przypięty dyspozytor, fetch chroniony przed SSRF, błąd SSRF i pomocniki zasad SSRF |
    | `plugin-sdk/secret-input` | Pomocniki parsowania wejścia sekretu |
    | `plugin-sdk/webhook-ingress` | Pomocniki żądań/celów Webhook i surowa koercja websocket/treści |
    | `plugin-sdk/webhook-request-guards` | Pomocniki rozmiaru treści żądania/limitu czasu |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie pomocniki środowiska runtime, logowania, kopii zapasowych i instalacji pluginów |
    | `plugin-sdk/runtime-env` | Wąskie pomocniki środowiska runtime, loggera, limitu czasu, ponawiania i strategii backoff |
    | `plugin-sdk/browser-config` | Obsługiwana fasada konfiguracji przeglądarki do znormalizowanego profilu i wartości domyślnych, parsowania adresów URL CDP oraz pomocników uwierzytelniania sterowania przeglądarką |
    | `plugin-sdk/channel-runtime-context` | Ogólne pomocniki rejestracji i wyszukiwania kontekstu runtime kanału |
    | `plugin-sdk/matrix` | Przestarzała fasada zgodności Matrix dla starszych pakietów kanałów firm trzecich; nowe pluginy powinny importować `plugin-sdk/run-command` bezpośrednio |
    | `plugin-sdk/mattermost` | Przestarzała fasada zgodności Mattermost dla starszych pakietów kanałów firm trzecich; nowe pluginy powinny importować ogólne ścieżki podrzędne SDK bezpośrednio |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Wspólne pomocniki poleceń, hooków, HTTP i interakcji pluginów |
    | `plugin-sdk/hook-runtime` | Wspólne pomocniki potoku webhooków i hooków wewnętrznych |
    | `plugin-sdk/lazy-runtime` | Pomocniki leniwego importu i wiązania runtime, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Pomocniki wykonywania procesów |
    | `plugin-sdk/cli-runtime` | Pomocniki formatowania CLI, oczekiwania, wersji, wywoływania argumentów i leniwych grup poleceń |
    | `plugin-sdk/gateway-runtime` | Klient Gateway, pomocnik uruchamiania klienta gotowego na pętlę zdarzeń, RPC CLI Gateway, błędy protokołu Gateway i pomocniki poprawek statusu kanału |
    | `plugin-sdk/config-types` | Powierzchnia konfiguracji wyłącznie typów dla kształtów konfiguracji pluginów, takich jak `OpenClawConfig`, oraz typów konfiguracji kanału/dostawcy |
    | `plugin-sdk/plugin-config-runtime` | Pomocniki wyszukiwania konfiguracji pluginów w runtime, takie jak `requireRuntimeConfig`, `resolvePluginConfigObject` i `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transakcyjne pomocniki mutacji konfiguracji, takie jak `mutateConfigFile`, `replaceConfigFile` i `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Pomocniki migawki konfiguracji bieżącego procesu, takie jak `getRuntimeConfig`, `getRuntimeConfigSnapshot`, oraz settery migawek testowych |
    | `plugin-sdk/telegram-command-config` | Normalizacja nazw i opisów poleceń Telegram oraz sprawdzanie duplikatów i konfliktów, nawet gdy dołączona powierzchnia kontraktu Telegram jest niedostępna |
    | `plugin-sdk/text-autolink-runtime` | Wykrywanie automatycznych linków do odwołań plikowych bez szerokiego barrela text-runtime |
    | `plugin-sdk/approval-runtime` | Pomocniki zatwierdzania exec/plugin, konstruktory możliwości zatwierdzania, pomocniki uwierzytelniania/profili, pomocniki natywnego routingu/runtime oraz formatowanie ścieżek wyświetlania zatwierdzeń strukturalnych |
    | `plugin-sdk/reply-runtime` | Wspólne pomocniki runtime wiadomości przychodzących/odpowiedzi, dzielenie na fragmenty, dispatch, Heartbeat, planer odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie pomocniki dispatch/finalizacji odpowiedzi i etykiet konwersacji |
    | `plugin-sdk/reply-history` | Wspólne pomocniki i znaczniki krótkiego okna historii odpowiedzi, takie jak `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie pomocniki dzielenia tekstu/Markdown na fragmenty |
    | `plugin-sdk/session-store-runtime` | Pomocniki ścieżki magazynu sesji, klucza sesji, updated-at i mutacji magazynu |
    | `plugin-sdk/cron-store-runtime` | Pomocniki ścieżki, ładowania i zapisywania magazynu Cron |
    | `plugin-sdk/state-paths` | Pomocniki ścieżek katalogu stanu/OAuth |
    | `plugin-sdk/routing` | Pomocniki routingu/klucza sesji/wiązania konta, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Wspólne pomocniki podsumowania statusu kanału/konta, domyślne wartości stanu runtime i pomocniki metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Wspólne pomocniki resolvera celu |
    | `plugin-sdk/string-normalization-runtime` | Pomocniki normalizacji slugów/ciągów znaków |
    | `plugin-sdk/request-url` | Wyodrębnianie tekstowych adresów URL z wejść podobnych do fetch/request |
    | `plugin-sdk/run-command` | Runner poleceń z limitem czasu ze znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Wspólne czytniki parametrów narzędzi/CLI |
    | `plugin-sdk/tool-payload` | Wyodrębnianie znormalizowanych payloadów z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
    | `plugin-sdk/temp-path` | Wspólne pomocniki ścieżek tymczasowego pobierania i prywatne bezpieczne tymczasowe obszary robocze |
    | `plugin-sdk/logging-core` | Pomocniki loggera podsystemu i redakcji |
    | `plugin-sdk/markdown-table-runtime` | Pomocniki trybu tabel Markdown i konwersji |
    | `plugin-sdk/model-session-runtime` | Pomocniki nadpisań modelu/sesji, takie jak `applyModelOverrideToSessionEntry` i `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Pomocniki rozwiązywania konfiguracji dostawcy rozmów |
    | `plugin-sdk/json-store` | Małe pomocniki odczytu/zapisu stanu JSON |
    | `plugin-sdk/file-lock` | Pomocniki reentrant blokady pliku |
    | `plugin-sdk/persistent-dedupe` | Pomocniki pamięci podręcznej deduplikacji opartej na dysku |
    | `plugin-sdk/acp-runtime` | Pomocniki ACP runtime/sesji i dispatch odpowiedzi |
    | `plugin-sdk/acp-runtime-backend` | Lekkie pomocniki rejestracji backendu ACP i dispatch odpowiedzi dla pluginów ładowanych przy starcie |
    | `plugin-sdk/acp-binding-resolve-runtime` | Rozwiązywanie wiązań ACP tylko do odczytu bez importów uruchamiania cyklu życia |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji runtime agenta |
    | `plugin-sdk/boolean-param` | Luźny czytnik parametru logicznego |
    | `plugin-sdk/dangerous-name-runtime` | Pomocniki rozwiązywania dopasowania niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Pomocniki bootstrapu urządzenia i tokenów parowania |
    | `plugin-sdk/extension-shared` | Wspólne prymitywy pomocnicze kanału pasywnego, statusu i ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Pomocniki odpowiedzi polecenia/dostawcy `/models` |
    | `plugin-sdk/skill-commands-runtime` | Pomocniki listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Pomocniki rejestru/budowania/serializacji poleceń natywnych |
    | `plugin-sdk/agent-harness` | Eksperymentalna powierzchnia zaufanych pluginów dla niskopoziomowych harnessów agentów: typy harnessów, pomocniki sterowania/przerywania aktywnego uruchomienia, pomocniki mostu narzędzi OpenClaw, pomocniki zasad narzędzi planu runtime, klasyfikacja wyników terminala, pomocniki formatowania/szczegółów postępu narzędzi oraz narzędzia wyników prób |
    | `plugin-sdk/provider-zai-endpoint` | Pomocniki wykrywania punktu końcowego Z.AI |
    | `plugin-sdk/async-lock-runtime` | Pomocnik lokalnej dla procesu blokady asynchronicznej dla małych plików stanu runtime |
    | `plugin-sdk/channel-activity-runtime` | Pomocnik telemetrii aktywności kanału |
    | `plugin-sdk/concurrency-runtime` | Pomocnik ograniczonej współbieżności zadań asynchronicznych |
    | `plugin-sdk/dedupe-runtime` | Pomocniki pamięci podręcznej deduplikacji w pamięci |
    | `plugin-sdk/delivery-queue-runtime` | Pomocnik opróżniania oczekujących dostaw wychodzących |
    | `plugin-sdk/file-access-runtime` | Pomocniki bezpiecznych ścieżek plików lokalnych i źródeł multimediów |
    | `plugin-sdk/heartbeat-runtime` | Pomocniki zdarzeń i widoczności Heartbeat |
    | `plugin-sdk/number-runtime` | Pomocnik koercji liczbowej |
    | `plugin-sdk/secure-random-runtime` | Pomocniki bezpiecznych tokenów/UUID |
    | `plugin-sdk/system-event-runtime` | Pomocniki kolejki zdarzeń systemowych |
    | `plugin-sdk/transport-ready-runtime` | Pomocnik oczekiwania na gotowość transportu |
    | `plugin-sdk/infra-runtime` | Przestarzały shim zgodności; użyj skoncentrowanych ścieżek podrzędnych runtime powyżej |
    | `plugin-sdk/collection-runtime` | Małe pomocniki ograniczonej pamięci podręcznej |
    | `plugin-sdk/diagnostic-runtime` | Pomocniki flag diagnostycznych, zdarzeń i kontekstu śledzenia |
    | `plugin-sdk/error-runtime` | Pomocniki grafu błędów, formatowania i wspólnej klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Opakowany fetch, proxy, opcja EnvHttpProxyAgent i pomocniki przypiętego lookupu |
    | `plugin-sdk/runtime-fetch` | Fetch runtime świadomy dispatchera bez importów proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Ograniczony czytnik treści odpowiedzi bez szerokiej powierzchni runtime multimediów |
    | `plugin-sdk/session-binding-runtime` | Bieżący stan wiązania konwersacji bez skonfigurowanego routingu wiązań ani magazynów parowania |
    | `plugin-sdk/session-store-runtime` | Pomocniki magazynu sesji bez szerokich importów zapisu/utrzymania konfiguracji |
    | `plugin-sdk/context-visibility-runtime` | Rozwiązywanie widoczności kontekstu i filtrowanie kontekstu uzupełniającego bez szerokich importów konfiguracji/bezpieczeństwa |
    | `plugin-sdk/string-coerce-runtime` | Wąskie pomocniki koercji i normalizacji prymitywnego rekordu/ciągu znaków bez importów markdown/logging |
    | `plugin-sdk/host-runtime` | Pomocniki normalizacji nazwy hosta i hosta SCP |
    | `plugin-sdk/retry-runtime` | Pomocniki konfiguracji ponawiania i runnera ponawiania |
    | `plugin-sdk/agent-runtime` | Pomocniki katalogu agenta/tożsamości/obszaru roboczego, w tym eksporty zgodności `resolveAgentDir`, `resolveDefaultAgentDir` i przestarzały `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Zapytanie/deduplikacja katalogu wspierana konfiguracją |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Podścieżki możliwości i testowania">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Wspólne helpery pobierania/przekształcania/przechowywania mediów, sondowanie wymiarów wideo oparte na ffprobe oraz konstruktory ładunków mediów |
    | `plugin-sdk/media-store` | Wąskie helpery magazynu mediów, takie jak `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Wspólne helpery przełączania awaryjnego generowania mediów, wybór kandydatów i komunikaty o brakującym modelu |
    | `plugin-sdk/media-understanding` | Typy dostawców rozumienia mediów oraz eksporty helperów obrazu/audio przeznaczone dla dostawców |
    | `plugin-sdk/text-runtime` | Wspólne helpery tekstu/Markdown/logowania, takie jak usuwanie tekstu widocznego dla asystenta, helpery renderowania/dzielenia na fragmenty/tabel Markdown, helpery redakcji, helpery tagów dyrektyw i narzędzia bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Helper dzielenia tekstu wychodzącego na fragmenty |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz eksporty dyrektyw, rejestru, walidacji, konstruktora TTS zgodnego z OpenAI i helperów mowy przeznaczone dla dostawców |
    | `plugin-sdk/speech-core` | Wspólne typy dostawców mowy, rejestr, dyrektywa, normalizacja i eksporty helperów mowy |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji w czasie rzeczywistym, helpery rejestru i wspólny helper sesji WebSocket |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu w czasie rzeczywistym i helpery rejestru |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów oraz helpery zasobów obrazów/adresów URL danych i konstruktor dostawcy obrazów zgodny z OpenAI |
    | `plugin-sdk/image-generation-core` | Wspólne typy generowania obrazów, przełączanie awaryjne, uwierzytelnianie i helpery rejestru |
    | `plugin-sdk/music-generation` | Typy dostawców/żądań/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Wspólne typy generowania muzyki, helpery przełączania awaryjnego, wyszukiwanie dostawców i parsowanie odwołań do modeli |
    | `plugin-sdk/video-generation` | Typy dostawców/żądań/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Wspólne typy generowania wideo, helpery przełączania awaryjnego, wyszukiwanie dostawców i parsowanie odwołań do modeli |
    | `plugin-sdk/webhook-targets` | Rejestr celów Webhook i helpery instalacji tras |
    | `plugin-sdk/webhook-path` | Helpery normalizacji ścieżek Webhook |
    | `plugin-sdk/web-media` | Wspólne helpery ładowania mediów zdalnych/lokalnych |
    | `plugin-sdk/zod` | Ponownie eksportowany `zod` dla konsumentów plugin SDK |
    | `plugin-sdk/testing` | Szeroki barrel zgodności dla starszych testów pluginów. Nowe testy rozszerzeń powinny zamiast tego importować skoncentrowane podścieżki SDK, takie jak `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` lub `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Minimalny helper `createTestPluginApi` do bezpośrednich testów jednostkowych rejestracji pluginów bez importowania pomostów helperów testowych repozytorium |
    | `plugin-sdk/agent-runtime-test-contracts` | Natywne fixture’y kontraktów adaptera agent-runtime do testów uwierzytelniania, dostarczania, fallbacku, hooków narzędzi, nakładek promptów, schematów i projekcji transkryptu |
    | `plugin-sdk/channel-test-helpers` | Helpery testowe zorientowane na kanały dla ogólnych kontraktów działań/konfiguracji/statusu, asercji katalogów, cyklu życia uruchamiania konta, wątkowania konfiguracji wysyłania, mocków runtime, problemów statusu, dostarczania wychodzącego i rejestracji hooków |
    | `plugin-sdk/channel-target-testing` | Wspólny zestaw przypadków błędów rozwiązywania celów dla testów kanałów |
    | `plugin-sdk/plugin-test-contracts` | Helpery kontraktów pakietu pluginu, rejestracji, artefaktów publicznych, bezpośredniego importu, API runtime i efektów ubocznych importu |
    | `plugin-sdk/provider-test-contracts` | Helpery kontraktów runtime dostawcy, uwierzytelniania, wykrywania, onboardingu, katalogu, kreatora, możliwości mediów, zasad odtwarzania, STT audio na żywo w czasie rzeczywistym, wyszukiwania/pobierania z sieci i strumieni |
    | `plugin-sdk/provider-http-test-mocks` | Opcjonalne mocki HTTP/uwierzytelniania Vitest dla testów dostawców, które ćwiczą `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Ogólne fixture’y przechwytywania runtime CLI, kontekstu sandboxa, zapisywania Skills, wiadomości agenta, zdarzeń systemowych, ponownego ładowania modułów, ścieżki dołączonego pluginu, tekstu terminala, dzielenia na fragmenty, tokena uwierzytelniania i typowanych przypadków |
    | `plugin-sdk/test-node-mocks` | Skoncentrowane helpery mocków wbudowanych Node do użycia w fabrykach Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Podścieżki pamięci">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Dołączona powierzchnia helperów memory-core dla helperów menedżera/konfiguracji/plików/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime indeksu/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika podstawy hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrakty osadzania hosta pamięci, dostęp do rejestru, dostawca lokalny i ogólne helpery wsadowe/zdalne |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika przechowywania hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Helpery multimodalne hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Helpery dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-core-host-status` | Helpery statusu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpery runtime CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpery głównego runtime hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny względem dostawcy alias dla helperów głównego runtime hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny względem dostawcy alias dla helperów dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Neutralny względem dostawcy alias dla helperów plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-markdown` | Wspólne helpery zarządzanego Markdown dla pluginów sąsiadujących z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada runtime aktywnej pamięci dla dostępu do menedżera wyszukiwania |
    | `plugin-sdk/memory-host-status` | Neutralny względem dostawcy alias dla helperów statusu hosta pamięci |
  </Accordion>

  <Accordion title="Zarezerwowane podścieżki dołączonych helperów">
    Obecnie nie ma zarezerwowanych podścieżek SDK dołączonych helperów. Helpery
    specyficzne dla właściciela znajdują się wewnątrz pakietu pluginu właściciela,
    a kontrakty hosta wielokrotnego użytku korzystają z ogólnych podścieżek SDK,
    takich jak `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` i
    `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Omówienie SDK pluginów](/pl/plugins/sdk-overview)
- [Konfiguracja SDK pluginów](/pl/plugins/sdk-setup)
- [Tworzenie pluginów](/pl/plugins/building-plugins)
