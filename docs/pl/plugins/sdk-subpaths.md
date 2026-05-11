---
read_when:
    - Wybór właściwej podścieżki plugin-sdk dla importu Plugin
    - Audyt ścieżek podrzędnych dołączonych Pluginów i powierzchni pomocniczych
summary: 'Katalog podścieżek Plugin SDK: gdzie znajdują się poszczególne importy, pogrupowane według obszaru'
title: Podścieżki Plugin SDK
x-i18n:
    generated_at: "2026-05-11T20:35:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2ef3c37e00ca59a567e55b3b47962803e43514d6791d8fda75c7bfeffb1e142
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin jest udostępniany jako zestaw wąskich publicznych podścieżek w
`openclaw/plugin-sdk/`. Ta strona kataloguje często używane podścieżki pogrupowane według
celu. Wygenerowany inwentarz punktów wejścia kompilatora znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`; eksporty pakietu są publicznym podzbiorem
po odjęciu repozytoryjnych podścieżek testowych/wewnętrznych wymienionych w
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Maintainerzy mogą audytować
liczbę publicznych eksportów za pomocą `pnpm plugin-sdk:surface` oraz aktywne zarezerwowane
podścieżki pomocnicze za pomocą `pnpm plugins:boundary-report:summary`; nieużywane zarezerwowane
eksporty pomocnicze powodują niepowodzenie raportu CI zamiast pozostawać w publicznym SDK jako
uśpiony dług zgodności.

Przewodnik po tworzeniu Plugin znajdziesz w [Omówienie Plugin SDK](/pl/plugins/sdk-overview).

## Punkt wejścia Plugin

| Podścieżka                     | Kluczowe eksporty                                                                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Pomocniki elementów dostawcy migracji, takie jak `createMigrationItem`, stałe powodów, znaczniki statusu elementów, pomocniki redakcji oraz `summarizeMigrationItems`   |
| `plugin-sdk/migration-runtime` | Pomocniki migracji w czasie działania, takie jak `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` i `writeMigrationReport`                                  |

### Przestarzała zgodność i pomocniki testowe

Te podścieżki pozostają eksportami pakietu dla starszych Plugin i zestawów testów OpenClaw,
ale nowy kod nie powinien dodawać importów z nich: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime` i `zod`. W nowym kodzie Plugin importuj `zod` bezpośrednio z `zod`.
`plugin-test-runtime` nadal jest aktywną, wyspecjalizowaną podścieżką pomocnika testowego.

### Przestarzałe nieużywane publiczne podścieżki

Te publiczne podścieżki istniały przez co najmniej jeden miesiąc i obecnie nie mają
produkcyjnych importów z dołączonych Plugin. Pozostają importowalne ze względu na zgodność,
ale nowy kod Plugin powinien zamiast tego używać wyspecjalizowanych, aktywnie używanych podścieżek SDK:
`agent-config-primitives`, `channel-config-schema-legacy`,
`channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`,
`command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`,
`group-access`, `infra-runtime`, `matrix`, `mattermost`,
`media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config` i `zalouser`.

### Przestarzałe rzadkie publiczne podścieżki

Publiczne podścieżki używane obecnie tylko przez jednego lub dwóch właścicieli dołączonych Plugin są również
przestarzałe dla nowego kodu Plugin. Pozostają eksportami pakietu ze względu na zgodność,
ale nowy kod powinien preferować aktywnie współdzielone styki SDK lub należące do Plugin
API pakietów. Maintainerzy śledzą dokładny zestaw w
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` oraz bieżący budżet
za pomocą `pnpm plugin-sdk:surface`.

### Przestarzałe szerokie baryłki

Te szerokie baryłki ponownego eksportu pozostają możliwe do zbudowania na potrzeby źródeł OpenClaw i
sprawdzeń zgodności, ale nowy kod powinien preferować wyspecjalizowane podścieżki SDK:
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime` i
`text-runtime`. `channel-runtime`, `compat`, `config-types`, `infra-runtime`
i `text-runtime` pozostają eksportami pakietu tylko dla zgodności wstecznej; zamiast nich używaj
wyspecjalizowanych podścieżek channel/runtime, `config-contracts`, `string-coerce-runtime`,
`text-chunking`, `text-utility-runtime` i `logging-core`.

  <AccordionGroup>
  <Accordion title="Podścieżki kanałów">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod dla `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Pomocnik buforowanej walidacji JSON Schema dla schematów należących do Plugin |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone pomocniki kreatora konfiguracji, monity listy dozwolonych, konstruktory statusu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Przestarzały alias zgodności; użyj `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Pomocniki konfiguracji i bramki akcji dla wielu kont, pomocniki rezerwowego konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, pomocniki normalizacji identyfikatora konta |
    | `plugin-sdk/account-resolution` | Pomocniki wyszukiwania konta i domyślnego rozwiązania rezerwowego |
    | `plugin-sdk/account-helpers` | Wąskie pomocniki listy kont i akcji konta |
    | `plugin-sdk/access-groups` | Pomocniki parsowania list dozwolonych grup dostępu oraz zredagowanej diagnostyki grup |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Starsze pomocniki potoku odpowiedzi. Nowy kod potoku odpowiedzi kanału powinien używać `createChannelMessageReplyPipeline` i `resolveChannelMessageSourceReplyDeliveryMode` z `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Współdzielone prymitywy schematu konfiguracji kanału oraz konstruktory Zod i bezpośrednie JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Dołączone schematy konfiguracji kanału OpenClaw wyłącznie dla utrzymywanych dołączonych Plugin |
    | `plugin-sdk/channel-config-schema-legacy` | Przestarzały alias zgodności dla dołączonych schematów konfiguracji kanału |
    | `plugin-sdk/telegram-command-config` | Pomocniki normalizacji/walidacji niestandardowych poleceń Telegram z rezerwowym kontraktem dołączonym |
    | `plugin-sdk/command-gating` | Wąskie pomocniki bramki autoryzacji poleceń |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Przestarzała niskopoziomowa fasada zgodności wejścia kanału. Nowe ścieżki odbioru powinny używać `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Eksperymentalny wysokopoziomowy resolver runtime wejścia kanału i konstruktory faktów tras dla zmigrowanych ścieżek odbioru kanału. Preferuj to zamiast składania efektywnych list dozwolonych, list dozwolonych poleceń i starszych projekcji w każdym Plugin. Zobacz [API wejścia kanału](/pl/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` oraz starsze pomocniki cyklu życia strumienia wersji roboczych. Nowy kod finalizacji podglądu powinien używać `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Tanie pomocniki kontraktu cyklu życia wiadomości, takie jak `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, wyprowadzanie zdolności trwałej finalizacji, pomocniki dowodu zdolności wysyłania/odbioru/skutków ubocznych, `MessageReceiveContext`, dowody polityki potwierdzeń odbioru, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, dowody zdolności podglądu na żywo i finalizatora na żywo, trwały stan odzyskiwania, `RenderedMessageBatch`, typy potwierdzeń wiadomości oraz pomocniki identyfikatorów potwierdzeń. Zobacz [API wiadomości kanału](/pl/plugins/sdk-channel-message). Starsze fasady dyspozycji odpowiedzi są wyłącznie przestarzałą zgodnością. |
    | `plugin-sdk/channel-message-runtime` | Pomocniki dostarczania runtime, które mogą ładować dostarczanie wychodzące, w tym `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch` i `withDurableMessageSendContext`. Przestarzałe mostki dyspozycji odpowiedzi pozostają importowalne wyłącznie dla dyspozytorów zgodności. Używaj z modułów runtime monitorowania/wysyłania, nie z gorących plików startowych Plugin. |
    | `plugin-sdk/inbound-envelope` | Współdzielone pomocniki trasy przychodzącej i konstruktora koperty |
    | `plugin-sdk/inbound-reply-dispatch` | Starsze współdzielone pomocniki rejestrowania i dyspozycji rekordów przychodzących, predykaty dyspozycji widocznej/finalnej oraz przestarzała zgodność `deliverDurableInboundReplyPayload` dla przygotowanych dyspozytorów kanałów. Nowy kod odbioru/dyspozycji kanału powinien importować pomocniki cyklu życia runtime z `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Pomocniki parsowania/dopasowywania celów |
    | `plugin-sdk/outbound-media` | Współdzielone pomocniki ładowania mediów wychodzących |
    | `plugin-sdk/outbound-send-deps` | Lekki mechanizm wyszukiwania zależności wysyłania wychodzącego dla adapterów kanałów |
    | `plugin-sdk/outbound-runtime` | Pomocniki tożsamości wychodzącej, delegata wysyłania, sesji, formatowania i planowania ładunku. Bezpośrednie pomocniki dostarczania, takie jak `deliverOutboundPayloads`, są przestarzałym substratem zgodności; używaj `plugin-sdk/channel-message-runtime` dla nowych ścieżek wysyłania. |
    | `plugin-sdk/poll-runtime` | Wąskie pomocniki normalizacji ankiet |
    | `plugin-sdk/thread-bindings-runtime` | Pomocniki cyklu życia powiązań wątków i adapterów |
    | `plugin-sdk/agent-media-payload` | Starszy konstruktor ładunku mediów agenta |
    | `plugin-sdk/conversation-runtime` | Pomocniki powiązań rozmów/wątków, parowania i skonfigurowanych powiązań |
    | `plugin-sdk/runtime-config-snapshot` | Pomocnik migawki konfiguracji runtime |
    | `plugin-sdk/runtime-group-policy` | Pomocniki rozwiązywania polityki grup runtime |
    | `plugin-sdk/channel-status` | Współdzielone pomocniki migawki/podsumowania statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Pomocniki autoryzacji zapisu konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty preambuły Plugin kanału |
    | `plugin-sdk/allowlist-config-edit` | Pomocniki edycji/odczytu konfiguracji listy dozwolonych |
    | `plugin-sdk/group-access` | Współdzielone pomocniki decyzji dostępu grupowego |
    | `plugin-sdk/direct-dm` | Współdzielone pomocniki uwierzytelniania/ochrony bezpośrednich DM |
    | `plugin-sdk/discord` | Przestarzała fasada zgodności Discord dla opublikowanego `@openclaw/discord@2026.3.13` i śledzonej zgodności właściciela; nowe Plugin powinny używać ogólnych podścieżek SDK kanałów |
    | `plugin-sdk/telegram-account` | Przestarzała fasada zgodności rozwiązywania kont Telegram dla śledzonej zgodności właściciela; nowe Plugin powinny używać wstrzykniętych pomocników runtime lub ogólnych podścieżek SDK kanałów |
    | `plugin-sdk/zalouser` | Przestarzała fasada zgodności Zalo Personal dla opublikowanych pakietów Lark/Zalo, które nadal importują autoryzację poleceń nadawcy; nowe Plugin powinny używać `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Semantyczna prezentacja wiadomości, dostarczanie i starsze pomocniki odpowiedzi interaktywnych. Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel zgodności dla debouncingu przychodzącego, dopasowywania wzmianek, pomocników polityki wzmianek i pomocników kopert |
    | `plugin-sdk/channel-inbound-debounce` | Wąskie pomocniki debouncingu przychodzącego |
    | `plugin-sdk/channel-mention-gating` | Wąskie pomocniki polityki wzmianek, znaczników wzmianek i tekstu wzmianek bez szerszej powierzchni runtime przychodzącego |
    | `plugin-sdk/channel-envelope` | Wąskie pomocniki formatowania koperty przychodzącej |
    | `plugin-sdk/channel-location` | Pomocniki kontekstu lokalizacji kanału i formatowania |
    | `plugin-sdk/channel-logging` | Pomocniki logowania kanału dla odrzuceń przychodzących oraz niepowodzeń pisania/potwierdzeń |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | Pomocniki akcji wiadomości kanału oraz przestarzałe pomocniki schematów natywnych zachowane dla zgodności Plugin |
    | `plugin-sdk/channel-route` | Współdzielona normalizacja tras, rozwiązywanie celów sterowane parserem, zamiana identyfikatorów wątków na ciągi, deduplikacja/kompaktowanie kluczy tras, typy sparsowanych celów oraz pomocniki porównywania tras/celów |
    | `plugin-sdk/channel-targets` | Pomocniki parsowania celów; wywołania porównania tras powinny używać `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Typy kontraktu kanału |
    | `plugin-sdk/channel-feedback` | Okablowanie opinii/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie pomocniki kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` oraz typy celów sekretów |
  </Accordion>

  <Accordion title="Ścieżki podrzędne dostawców">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Obsługiwana fasada dostawcy LM Studio do konfiguracji, wykrywania katalogu i przygotowywania modelu w czasie wykonywania |
    | `plugin-sdk/lmstudio-runtime` | Obsługiwana fasada środowiska uruchomieniowego LM Studio do domyślnych ustawień lokalnego serwera, wykrywania modeli, nagłówków żądań i helperów załadowanych modeli |
    | `plugin-sdk/provider-setup` | Wyselekcjonowane helpery konfiguracji lokalnych/samodzielnie hostowanych dostawców |
    | `plugin-sdk/self-hosted-provider-setup` | Wyspecjalizowane helpery konfiguracji samodzielnie hostowanych dostawców zgodnych z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI + stałe watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpery rozwiązywania kluczy API w czasie wykonywania dla pluginów dostawców |
    | `plugin-sdk/provider-auth-api-key` | Helpery wdrażania/zapisu profili kluczy API, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy konstruktor wyniku uwierzytelniania OAuth |
    | `plugin-sdk/provider-env-vars` | Helpery wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, przestarzały eksport zgodności `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory polityki odtwarzania, helpery punktów końcowych dostawców oraz współdzielone helpery normalizacji identyfikatorów modeli |
    | `plugin-sdk/provider-catalog-runtime` | Hook środowiska uruchomieniowego rozszerzania katalogu dostawców oraz szwy rejestru plugin-dostawca do testów kontraktu |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ogólne helpery możliwości HTTP/punktów końcowych dostawców, błędy HTTP dostawców oraz helpery formularzy wieloczęściowych do transkrypcji audio |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie helpery kontraktu konfiguracji/wyboru web-fetch, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpery rejestracji/pamięci podręcznej dostawcy web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Wąskie helpery konfiguracji/poświadczeń web-search dla dostawców, którzy nie potrzebują okablowania włączania pluginu |
    | `plugin-sdk/provider-web-search-contract` | Wąskie helpery kontraktu konfiguracji/poświadczeń web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz ograniczone zakresem settery/gettery poświadczeń |
    | `plugin-sdk/provider-web-search` | Helpery rejestracji/pamięci podręcznej/środowiska uruchomieniowego dostawcy web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` oraz czyszczenie schematów Gemini + diagnostyka |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` i podobne |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy opakowań strumieni oraz współdzielone helpery opakowań Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Natywne helpery transportu dostawcy, takie jak chroniony fetch, transformacje komunikatów transportu i zapisywalne strumienie zdarzeń transportu |
    | `plugin-sdk/provider-onboard` | Helpery łatania konfiguracji wdrażania |
    | `plugin-sdk/global-singleton` | Helpery singletonów/map/pamięci podręcznych lokalnych dla procesu |
    | `plugin-sdk/group-activation` | Wąskie helpery trybu aktywacji grupowej i parsowania poleceń |
  </Accordion>

  <Accordion title="Ścieżki podrzędne uwierzytelniania i bezpieczeństwa">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpery rejestru poleceń, w tym formatowanie menu argumentów dynamicznych, helpery autoryzacji nadawcy |
    | `plugin-sdk/command-status` | Konstruktory komunikatów poleceń/pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpery rozwiązywania zatwierdzających i uwierzytelniania akcji w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Helpery natywnych profili/filtrów zatwierdzania exec |
    | `plugin-sdk/approval-delivery-runtime` | Natywne adaptery możliwości/dostarczania zatwierdzeń |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony helper rozwiązywania Gateway zatwierdzeń |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie helpery ładowania natywnego adaptera zatwierdzeń dla gorących punktów wejścia kanałów |
    | `plugin-sdk/approval-handler-runtime` | Szersze helpery środowiska uruchomieniowego obsługi zatwierdzeń; preferuj węższe szwy adaptera/Gateway, gdy są wystarczające |
    | `plugin-sdk/approval-native-runtime` | Natywny cel zatwierdzania + helpery wiązania kont |
    | `plugin-sdk/approval-reply-runtime` | Helpery ładunku odpowiedzi zatwierdzenia exec/plugin |
    | `plugin-sdk/approval-runtime` | Helpery ładunku zatwierdzenia exec/plugin, helpery routingu/środowiska uruchomieniowego natywnych zatwierdzeń oraz helpery strukturalnego wyświetlania zatwierdzeń, takie jak `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Wąskie helpery resetowania deduplikacji odpowiedzi przychodzących |
    | `plugin-sdk/channel-contract-testing` | Wąskie helpery testów kontraktu kanału bez szerokiej beczki testowej |
    | `plugin-sdk/command-auth-native` | Natywne uwierzytelnianie poleceń, formatowanie menu argumentów dynamicznych oraz helpery natywnego celu sesji |
    | `plugin-sdk/command-detection` | Współdzielone helpery wykrywania poleceń |
    | `plugin-sdk/command-primitives-runtime` | Lekkie predykaty tekstu poleceń dla gorących ścieżek kanałów |
    | `plugin-sdk/command-surface` | Normalizacja treści poleceń i helpery powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery zbierania kontraktu sekretów dla powierzchni sekretów kanału/pluginu |
    | `plugin-sdk/secret-ref-runtime` | Wąskie helpery `coerceSecretRef` i typowania SecretRef do parsowania kontraktu sekretów/konfiguracji |
    | `plugin-sdk/security-runtime` | Współdzielone helpery zaufania, bramkowania DM, plików/ścieżek ograniczonych do katalogu głównego, w tym zapisy tylko przy tworzeniu, synchroniczna/asynchroniczna atomowa podmiana plików, zapisy do tymczasowych plików rodzeństwa, awaryjne przenoszenie między urządzeniami, helpery prywatnego magazynu plików, osłony rodziców symlinków, treści zewnętrzne, redagowanie tekstu wrażliwego, stałoczasowe porównywanie sekretów i helpery zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Helpery listy dozwolonych hostów i polityki SSRF sieci prywatnej |
    | `plugin-sdk/ssrf-dispatcher` | Wąskie helpery przypiętego dispatchera bez szerokiej powierzchni środowiska uruchomieniowego infrastruktury |
    | `plugin-sdk/ssrf-runtime` | Przypięty dispatcher, fetch chroniony przed SSRF, błąd SSRF i helpery polityki SSRF |
    | `plugin-sdk/secret-input` | Helpery parsowania danych wejściowych sekretów |
    | `plugin-sdk/webhook-ingress` | Helpery żądań/celów Webhook i surowe przekształcanie websocket/body |
    | `plugin-sdk/webhook-request-guards` | Helpery rozmiaru/limitu czasu treści żądania |
  </Accordion>

  <Accordion title="Ścieżki podrzędne środowiska wykonawczego i przechowywania">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie pomocniki środowiska wykonawczego, logowania, kopii zapasowych i instalacji pluginów |
    | `plugin-sdk/runtime-env` | Wąskie pomocniki środowiska wykonawczego, loggera, limitu czasu, ponawiania prób i wycofywania |
    | `plugin-sdk/browser-config` | Obsługiwana fasada konfiguracji przeglądarki do znormalizowanego profilu/wartości domyślnych, parsowania adresu URL CDP i pomocników uwierzytelniania sterowania przeglądarką |
    | `plugin-sdk/channel-runtime-context` | Ogólne pomocniki rejestracji i wyszukiwania kontekstu środowiska wykonawczego kanału |
    | `plugin-sdk/matrix` | Przestarzała fasada zgodności Matrix dla starszych pakietów kanałów firm trzecich; nowe pluginy powinny importować bezpośrednio `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Przestarzała fasada zgodności Mattermost dla starszych pakietów kanałów firm trzecich; nowe pluginy powinny importować bezpośrednio ogólne ścieżki podrzędne SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone pomocniki poleceń, hooków, HTTP i interakcji pluginu |
    | `plugin-sdk/hook-runtime` | Współdzielone pomocniki potoku webhooków/hooków wewnętrznych |
    | `plugin-sdk/lazy-runtime` | Pomocniki leniwego importu/powiązania środowiska wykonawczego, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Pomocniki wykonywania procesów |
    | `plugin-sdk/cli-runtime` | Pomocniki formatowania CLI, oczekiwania, wersji, wywołań argumentów i leniwych grup poleceń |
    | `plugin-sdk/gateway-runtime` | Klient Gateway, pomocnik uruchamiania klienta gotowego do pętli zdarzeń, RPC CLI Gateway, błędy protokołu Gateway i pomocniki łatek statusu kanału |
    | `plugin-sdk/config-contracts` | Skoncentrowana, wyłącznie typowa powierzchnia konfiguracji dla kształtów konfiguracji pluginu, takich jak `OpenClawConfig` i typy konfiguracji kanału/dostawcy |
    | `plugin-sdk/plugin-config-runtime` | Pomocniki wyszukiwania konfiguracji pluginu w środowisku wykonawczym, takie jak `requireRuntimeConfig`, `resolvePluginConfigObject` i `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Pomocniki transakcyjnej mutacji konfiguracji, takie jak `mutateConfigFile`, `replaceConfigFile` i `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Pomocniki migawki konfiguracji bieżącego procesu, takie jak `getRuntimeConfig`, `getRuntimeConfigSnapshot` i ustawiacze migawek testowych |
    | `plugin-sdk/telegram-command-config` | Normalizacja nazw/opisów poleceń Telegram oraz kontrole duplikatów/konfliktów, nawet gdy powierzchnia kontraktu dołączonego Telegram jest niedostępna |
    | `plugin-sdk/text-autolink-runtime` | Wykrywanie autolinków odwołań do plików bez szerokiego barrela tekstowego |
    | `plugin-sdk/approval-runtime` | Pomocniki zatwierdzania exec/pluginów, konstruktory możliwości zatwierdzania, pomocniki uwierzytelniania/profili, pomocniki natywnego routingu/środowiska wykonawczego oraz formatowanie ścieżki wyświetlania strukturalnych zatwierdzeń |
    | `plugin-sdk/reply-runtime` | Współdzielone pomocniki środowiska wykonawczego przychodzących wiadomości/odpowiedzi, dzielenie na fragmenty, wysyłanie, heartbeat, planer odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie pomocniki wysyłania/finalizacji odpowiedzi i etykiet konwersacji |
    | `plugin-sdk/reply-history` | Współdzielone pomocniki i znaczniki historii odpowiedzi z krótkiego okna, takie jak `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie pomocniki dzielenia tekstu/Markdown na fragmenty |
    | `plugin-sdk/session-store-runtime` | Pomocniki ścieżki magazynu sesji, klucza sesji, znacznika updated-at i mutacji magazynu |
    | `plugin-sdk/cron-store-runtime` | Pomocniki ścieżki/wczytywania/zapisywania magazynu Cron |
    | `plugin-sdk/state-paths` | Pomocniki ścieżek katalogu stanu/OAuth |
    | `plugin-sdk/routing` | Pomocniki routingu, klucza sesji i powiązania konta, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone pomocniki podsumowania statusu kanału/konta, wartości domyślne stanu środowiska wykonawczego i pomocniki metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone pomocniki resolvera celu |
    | `plugin-sdk/string-normalization-runtime` | Pomocniki normalizacji slugów/ciągów znaków |
    | `plugin-sdk/request-url` | Wyodrębnianie adresów URL jako ciągów znaków z danych wejściowych podobnych do fetch/request |
    | `plugin-sdk/run-command` | Runner poleceń z limitem czasu i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Wspólne czytniki parametrów narzędzi/CLI |
    | `plugin-sdk/tool-payload` | Wyodrębnianie znormalizowanych ładunków z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
    | `plugin-sdk/temp-path` | Współdzielone pomocniki ścieżek tymczasowych pobrań i prywatne bezpieczne tymczasowe obszary robocze |
    | `plugin-sdk/logging-core` | Logger podsystemu i pomocniki redakcji |
    | `plugin-sdk/markdown-table-runtime` | Pomocniki trybu i konwersji tabel Markdown |
    | `plugin-sdk/model-session-runtime` | Pomocniki nadpisań modelu/sesji, takie jak `applyModelOverrideToSessionEntry` i `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Pomocniki rozwiązywania konfiguracji dostawcy Talk |
    | `plugin-sdk/json-store` | Małe pomocniki odczytu/zapisu stanu JSON |
    | `plugin-sdk/file-lock` | Pomocniki współbieżnej blokady pliku z ponownym wejściem |
    | `plugin-sdk/persistent-dedupe` | Pomocniki cache deduplikacji opartego na dysku |
    | `plugin-sdk/acp-runtime` | Pomocniki środowiska wykonawczego/sesji ACP i wysyłania odpowiedzi |
    | `plugin-sdk/acp-runtime-backend` | Lekkie pomocniki rejestracji backendu ACP i wysyłania odpowiedzi dla pluginów ładowanych przy starcie |
    | `plugin-sdk/acp-binding-resolve-runtime` | Rozwiązywanie powiązań ACP tylko do odczytu bez importów startu cyklu życia |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji środowiska wykonawczego agenta |
    | `plugin-sdk/boolean-param` | Luźny czytnik parametru boolean |
    | `plugin-sdk/dangerous-name-runtime` | Pomocniki rozwiązywania dopasowań niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Pomocniki bootstrapu urządzenia i tokenu parowania |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy pomocników kanału pasywnego, statusu i otaczającego proxy |
    | `plugin-sdk/models-provider-runtime` | Pomocniki odpowiedzi polecenia/dostawcy `/models` |
    | `plugin-sdk/skill-commands-runtime` | Pomocniki listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Pomocniki rejestru/budowania/serializacji poleceń natywnych |
    | `plugin-sdk/agent-harness` | Eksperymentalna powierzchnia zaufanego pluginu dla niskopoziomowych uprzęży agentów: typy uprzęży, pomocniki sterowania/przerywania aktywnego uruchomienia, pomocniki mostka narzędzi OpenClaw, pomocniki zasad narzędzi planu środowiska wykonawczego, klasyfikacja wyników terminala, pomocniki formatowania/szczegółów postępu narzędzi i narzędzia wyników prób |
    | `plugin-sdk/provider-zai-endpoint` | Przestarzała fasada wykrywania punktu końcowego należącego do dostawcy Z.AI; użyj publicznego API pluginu Z.AI |
    | `plugin-sdk/async-lock-runtime` | Pomocnik lokalnej dla procesu blokady asynchronicznej dla małych plików stanu środowiska wykonawczego |
    | `plugin-sdk/channel-activity-runtime` | Pomocnik telemetrii aktywności kanału |
    | `plugin-sdk/concurrency-runtime` | Pomocnik ograniczonej współbieżności zadań asynchronicznych |
    | `plugin-sdk/dedupe-runtime` | Pomocniki cache deduplikacji w pamięci |
    | `plugin-sdk/delivery-queue-runtime` | Pomocnik opróżniania oczekujących dostaw wychodzących |
    | `plugin-sdk/file-access-runtime` | Pomocniki bezpiecznych ścieżek plików lokalnych i źródeł multimediów |
    | `plugin-sdk/heartbeat-runtime` | Pomocniki wybudzania, zdarzeń i widoczności Heartbeat |
    | `plugin-sdk/number-runtime` | Pomocnik koercji numerycznej |
    | `plugin-sdk/secure-random-runtime` | Pomocniki bezpiecznych tokenów/UUID |
    | `plugin-sdk/system-event-runtime` | Pomocniki kolejki zdarzeń systemowych |
    | `plugin-sdk/transport-ready-runtime` | Pomocnik oczekiwania na gotowość transportu |
    | `plugin-sdk/infra-runtime` | Przestarzały shim zgodności; użyj powyższych, skoncentrowanych ścieżek podrzędnych środowiska wykonawczego |
    | `plugin-sdk/collection-runtime` | Małe pomocniki ograniczonego cache |
    | `plugin-sdk/diagnostic-runtime` | Pomocniki flag diagnostycznych, zdarzeń i kontekstu śledzenia |
    | `plugin-sdk/error-runtime` | Graf błędów, formatowanie, współdzielone pomocniki klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Opakowany fetch, proxy, opcja EnvHttpProxyAgent i pomocniki przypiętego wyszukiwania |
    | `plugin-sdk/runtime-fetch` | Fetch środowiska wykonawczego świadomy dyspozytora bez importów proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Ograniczony czytnik treści odpowiedzi bez szerokiej powierzchni środowiska wykonawczego multimediów |
    | `plugin-sdk/session-binding-runtime` | Bieżący stan powiązania konwersacji bez skonfigurowanego routingu powiązań lub magazynów parowania |
    | `plugin-sdk/session-store-runtime` | Pomocniki magazynu sesji bez szerokich importów zapisu/utrzymania konfiguracji |
    | `plugin-sdk/context-visibility-runtime` | Rozwiązywanie widoczności kontekstu i filtrowanie kontekstu uzupełniającego bez szerokich importów konfiguracji/bezpieczeństwa |
    | `plugin-sdk/string-coerce-runtime` | Wąskie pomocniki koercji i normalizacji prymitywnych rekordów/ciągów znaków bez importów Markdown/logowania |
    | `plugin-sdk/host-runtime` | Pomocniki normalizacji nazwy hosta i hosta SCP |
    | `plugin-sdk/retry-runtime` | Pomocniki konfiguracji ponawiania prób i runnera ponawiania prób |
    | `plugin-sdk/agent-runtime` | Pomocniki katalogu/tożsamości/obszaru roboczego agenta, w tym `resolveAgentDir`, `resolveDefaultAgentDir` i przestarzały eksport zgodności `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Zapytania/deduplikacja katalogów oparte na konfiguracji |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Podścieżki funkcji i testowania">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Współdzielone pomocniki pobierania/przekształcania/przechowywania multimediów, wykrywanie wymiarów wideo oparte na ffprobe oraz kreatory ładunków multimedialnych |
    | `plugin-sdk/media-mime` | Wąska normalizacja MIME, mapowanie rozszerzeń plików, wykrywanie MIME oraz pomocniki rodzaju multimediów |
    | `plugin-sdk/media-store` | Wąskie pomocniki magazynu multimediów, takie jak `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Współdzielone pomocniki przełączania awaryjnego generowania multimediów, wybór kandydatów oraz komunikaty o brakującym modelu |
    | `plugin-sdk/media-understanding` | Typy dostawców rozumienia multimediów oraz eksporty pomocników obrazu/audio/ustrukturyzowanej ekstrakcji przeznaczone dla dostawców |
    | `plugin-sdk/text-chunking` | Pomocniki dzielenia/renderowania tekstu i markdown, konwersja tabel markdown, usuwanie tagów dyrektyw oraz narzędzia bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Pomocnik dzielenia tekstu wychodzącego |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz eksporty dyrektyw, rejestru, walidacji, kreatora TTS zgodnego z OpenAI i pomocników mowy przeznaczone dla dostawców |
    | `plugin-sdk/speech-core` | Współdzielone typy dostawców mowy, rejestr, dyrektywa, normalizacja oraz eksporty pomocników mowy |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji w czasie rzeczywistym, pomocniki rejestru oraz współdzielony pomocnik sesji WebSocket |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu w czasie rzeczywistym i pomocniki rejestru |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów oraz pomocniki zasobów obrazów/adresów URL danych i kreator dostawcy obrazów zgodny z OpenAI |
    | `plugin-sdk/image-generation-core` | Współdzielone typy generowania obrazów, przełączanie awaryjne, uwierzytelnianie oraz pomocniki rejestru |
    | `plugin-sdk/music-generation` | Typy dostawców/żądań/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Współdzielone typy generowania muzyki, pomocniki przełączania awaryjnego, wyszukiwanie dostawcy oraz parsowanie odwołań do modeli |
    | `plugin-sdk/video-generation` | Typy dostawców/żądań/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo, pomocniki przełączania awaryjnego, wyszukiwanie dostawcy oraz parsowanie odwołań do modeli |
    | `plugin-sdk/webhook-targets` | Rejestr miejsc docelowych Webhook oraz pomocniki instalowania tras |
    | `plugin-sdk/webhook-path` | Przestarzały alias zgodności; użyj `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Współdzielone pomocniki ładowania multimediów zdalnych/lokalnych |
    | `plugin-sdk/zod` | Przestarzały reeksport zgodności; importuj `zod` bezpośrednio z `zod` |
    | `plugin-sdk/testing` | Lokalny w repozytorium przestarzały barrel zgodności dla starszych testów OpenClaw. Nowe testy repozytorium powinny zamiast tego importować wyspecjalizowane lokalne podścieżki testowe, takie jak `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` lub `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Lokalny w repozytorium minimalny pomocnik `createTestPluginApi` do bezpośrednich testów jednostkowych rejestracji Plugin bez importowania mostów pomocników testowych repozytorium |
    | `plugin-sdk/agent-runtime-test-contracts` | Lokalne w repozytorium natywne fixture kontraktów adaptera środowiska uruchomieniowego agenta dla testów uwierzytelniania, dostarczania, fallbacku, hooków narzędzi, nakładki promptu, schematu oraz projekcji transkrypcji |
    | `plugin-sdk/channel-test-helpers` | Lokalne w repozytorium pomocniki testowe zorientowane na kanały dla ogólnych kontraktów akcji/konfiguracji/statusu, asercji katalogów, cyklu życia uruchamiania konta, wątkowania konfiguracji wysyłki, mocków środowiska uruchomieniowego, problemów statusu, dostarczania wychodzącego oraz rejestracji hooków |
    | `plugin-sdk/channel-target-testing` | Lokalny w repozytorium współdzielony zestaw przypadków błędów rozwiązywania miejsc docelowych dla testów kanałów |
    | `plugin-sdk/plugin-test-contracts` | Lokalne w repozytorium pomocniki kontraktów pakietu Plugin, rejestracji, artefaktów publicznych, bezpośredniego importu, API środowiska uruchomieniowego oraz efektów ubocznych importu |
    | `plugin-sdk/provider-test-contracts` | Lokalne w repozytorium pomocniki kontraktów środowiska uruchomieniowego dostawcy, uwierzytelniania, wykrywania, onboardingu, katalogu, kreatora, funkcji multimedialnych, polityki replay, dźwięku na żywo STT w czasie rzeczywistym, wyszukiwania/pobierania z sieci oraz strumienia |
    | `plugin-sdk/provider-http-test-mocks` | Lokalne w repozytorium opcjonalne mocki HTTP/uwierzytelniania Vitest dla testów dostawców, które korzystają z `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Lokalne w repozytorium ogólne fixture przechwytywania środowiska uruchomieniowego CLI, kontekstu sandboxa, autora Skills, komunikatu agenta, zdarzenia systemowego, przeładowania modułu, ścieżki do dołączonego Plugin, tekstu terminala, dzielenia na fragmenty, tokenu uwierzytelniającego oraz typowanych przypadków |
    | `plugin-sdk/test-node-mocks` | Lokalne w repozytorium wyspecjalizowane pomocniki mocków wbudowanych modułów Node do użycia wewnątrz fabryk Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Podścieżki pamięci">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Dołączona powierzchnia pomocników memory-core dla pomocników menedżera/konfiguracji/plików/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada środowiska uruchomieniowego indeksu/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty bazowego silnika hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrakty osadzeń hosta pamięci, dostęp do rejestru, lokalny dostawca oraz ogólne pomocniki wsadowe/zdalne |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika przechowywania hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Pomocniki multimodalne hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Pomocniki zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Pomocniki sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Przestarzały alias zgodności; użyj `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Pomocniki statusu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Pomocniki środowiska uruchomieniowego CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Pomocniki podstawowego środowiska uruchomieniowego hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Pomocniki plików/środowiska uruchomieniowego hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny względem dostawcy alias pomocników podstawowego środowiska uruchomieniowego hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny względem dostawcy alias pomocników dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Przestarzały alias zgodności; użyj `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Współdzielone pomocniki zarządzanego markdown dla Plugin powiązanych z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada środowiska uruchomieniowego Active Memory do dostępu do menedżera wyszukiwania |
    | `plugin-sdk/memory-host-status` | Przestarzały alias zgodności; użyj `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Zarezerwowane podścieżki dołączonych pomocników">
    Obecnie nie ma zarezerwowanych podścieżek SDK dołączonych pomocników. Pomocniki specyficzne dla właściciela
    znajdują się wewnątrz pakietu Plugin właściciela, natomiast kontrakty hosta wielokrotnego użytku
    używają ogólnych podścieżek SDK, takich jak `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` i `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Omówienie SDK Plugin](/pl/plugins/sdk-overview)
- [Konfiguracja SDK Plugin](/pl/plugins/sdk-setup)
- [Budowanie Plugin](/pl/plugins/building-plugins)
