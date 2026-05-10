---
read_when:
    - Wybór właściwej podścieżki plugin-sdk dla importu Plugin
    - Audyt podścieżek dołączonego Plugin i powierzchni pomocniczych
summary: 'Katalog podścieżek Plugin SDK: gdzie znajdują się poszczególne importy, pogrupowane według obszaru'
title: Podścieżki SDK Plugin
x-i18n:
    generated_at: "2026-05-10T19:50:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: ddcb1223ce9f749e57e866cc0ed3329a1aeeb5d90d00568b5942f7f779086f1f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin jest udostępniany jako zestaw wąskich publicznych podścieżek w
`openclaw/plugin-sdk/`. Ta strona kataloguje często używane podścieżki pogrupowane
według celu. Wygenerowany inwentarz punktów wejścia kompilatora znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`; eksporty pakietu to publiczny podzbiór
po odjęciu lokalnych dla repozytorium podścieżek testowych/wewnętrznych wymienionych w
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Opiekunowie mogą audytować
liczbę publicznych eksportów za pomocą `pnpm plugin-sdk:surface` oraz aktywne zarezerwowane
podścieżki pomocnicze za pomocą `pnpm plugins:boundary-report:summary`; nieużywane zarezerwowane
eksporty pomocnicze powodują niepowodzenie raportu CI zamiast pozostawać w publicznym SDK jako
uśpiony dług zgodności.

Przewodnik po tworzeniu Plugin znajdziesz w [omówieniu SDK Plugin](/pl/plugins/sdk-overview).

## Punkt wejścia Plugin

| Podścieżka                     | Kluczowe eksporty                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Pomocnicze elementy dostawcy migracji, takie jak `createMigrationItem`, stałe przyczyn, znaczniki statusu elementów, pomocniki redakcji oraz `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Pomocniki migracji w czasie wykonywania, takie jak `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` oraz `writeMigrationReport`                             |

### Przestarzała zgodność i pomocniki testowe

Te podścieżki pozostają eksportami pakietu dla starszych Plugin i zestawów testowych OpenClaw,
ale nowy kod nie powinien dodawać importów z nich: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `provider-http-test-mocks`,
`provider-test-contracts`, `test-env`, `test-fixtures`, `test-node-mocks`,
`testing`, `channel-runtime`, `compat`, `config-types`, `infra-runtime`,
`text-runtime` oraz `zod`. W nowym kodzie Plugin importuj `zod` bezpośrednio z `zod`.
`plugin-test-runtime` nadal jest aktywną, wyspecjalizowaną podścieżką pomocnika testowego.

### Przestarzałe nieużywane publiczne podścieżki

Te publiczne podścieżki istniały przez co najmniej miesiąc i obecnie nie mają
produkcyjnych importów z dołączonych rozszerzeń. Pozostają importowalne ze względu na zgodność,
ale nowy kod Plugin powinien zamiast nich używać wyspecjalizowanych, aktywnie używanych podścieżek SDK:
`agent-config-primitives`, `channel-config-schema-legacy`,
`channel-reply-pipeline`, `channel-runtime`, `channel-secret-runtime`,
`command-auth`, `compat`, `config-runtime`, `config-schema`, `discord`,
`group-access`, `infra-runtime`, `matrix`, `mattermost`,
`media-generation-runtime-shared`, `memory-core-engine-runtime`,
`memory-core-host-multimodal`, `memory-core-host-query`,
`music-generation-core`, `self-hosted-provider-setup`, `telegram-account`,
`telegram-command-config` oraz `zalouser`.

### Przestarzałe rzadkie publiczne podścieżki

Publiczne podścieżki używane obecnie tylko przez jednego lub dwóch właścicieli dołączonych Plugin również są
przestarzałe dla nowego kodu Plugin. Pozostają eksportami pakietu ze względu na zgodność,
ale nowy kod powinien preferować aktywnie współdzielone punkty styku SDK albo należące do Plugin
API pakietów. Opiekunowie śledzą dokładny zestaw w
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` oraz bieżący budżet
za pomocą `pnpm plugin-sdk:surface`.

### Przestarzałe szerokie baryłki

Te szerokie baryłki reeksportów pozostają możliwe do zbudowania dla źródeł OpenClaw i
kontroli zgodności, ale nowy kod powinien preferować wyspecjalizowane podścieżki SDK:
`agent-runtime`, `channel-lifecycle`, `channel-runtime`, `cli-runtime`,
`compat`, `config-types`, `conversation-runtime`, `hook-runtime`,
`infra-runtime`, `media-runtime`, `plugin-runtime`, `security-runtime` oraz
`text-runtime`. `channel-runtime`, `compat`, `config-types`, `infra-runtime`
oraz `text-runtime` pozostają eksportami pakietu wyłącznie dla zgodności wstecznej; zamiast nich używaj
wyspecjalizowanych podścieżek kanałów/czasu wykonywania, `config-contracts`, `string-coerce-runtime`,
`text-chunking`, `text-utility-runtime` oraz `logging-core`.

  <AccordionGroup>
  <Accordion title="Podścieżki kanału">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Buforowany pomocnik walidacji JSON Schema dla schematów należących do wtyczki |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone pomocniki kreatora konfiguracji, monity listy dozwolonych, konstruktory statusu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Przestarzały alias zgodności; użyj `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Pomocniki konfiguracji wielu kont/bramki akcji, pomocniki awaryjnego konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, pomocniki normalizacji identyfikatora konta |
    | `plugin-sdk/account-resolution` | Pomocniki wyszukiwania konta i awaryjnego użycia wartości domyślnej |
    | `plugin-sdk/account-helpers` | Wąskie pomocniki listy kont/akcji konta |
    | `plugin-sdk/access-groups` | Pomocniki parsowania listy dozwolonych grup dostępu i zredagowanej diagnostyki grup |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Pomocniki starszego potoku odpowiedzi. Nowy kod potoku odpowiedzi kanału powinien używać `createChannelMessageReplyPipeline` i `resolveChannelMessageSourceReplyDeliveryMode` z `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Współdzielone prymitywy schematu konfiguracji kanału oraz konstruktory Zod i bezpośrednie konstruktory JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Dołączone schematy konfiguracji kanałów OpenClaw tylko dla utrzymywanych dołączonych wtyczek |
    | `plugin-sdk/channel-config-schema-legacy` | Przestarzały alias zgodności dla schematów konfiguracji dołączonych kanałów |
    | `plugin-sdk/telegram-command-config` | Pomocniki normalizacji/walidacji niestandardowych poleceń Telegram z awaryjnym użyciem dołączonego kontraktu |
    | `plugin-sdk/command-gating` | Wąskie pomocniki bramki autoryzacji poleceń |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Przestarzała fasada zgodności niskopoziomowego wejścia kanału. Nowe ścieżki odbioru powinny używać `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Eksperymentalny, wysokopoziomowy resolver środowiska wykonawczego wejścia kanału i konstruktory faktów trasy dla zmigrowanych ścieżek odbioru kanału. Preferuj to zamiast składania efektywnych list dozwolonych, list dozwolonych poleceń i starszych projekcji w każdej wtyczce. Zobacz [API wejścia kanału](/pl/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` i starsze pomocniki cyklu życia strumienia wersji roboczej. Nowy kod finalizacji podglądu powinien używać `plugin-sdk/channel-message`. |
    | `plugin-sdk/channel-message` | Tanie pomocniki kontraktu cyklu życia wiadomości, takie jak `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`, wyprowadzanie możliwości trwałej finalizacji, pomocniki dowodów możliwości wysyłania/odbioru/efektów ubocznych, `MessageReceiveContext`, dowody zasad potwierdzania odbioru, `defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`, dowody możliwości podglądu na żywo i finalizatora na żywo, trwały stan odzyskiwania, `RenderedMessageBatch`, typy potwierdzeń wiadomości i pomocniki identyfikatorów potwierdzeń. Zobacz [API wiadomości kanału](/pl/plugins/sdk-channel-message). Starsze fasady rozsyłania odpowiedzi są tylko przestarzałą zgodnością. |
    | `plugin-sdk/channel-message-runtime` | Pomocniki dostarczania środowiska wykonawczego, które mogą ładować dostarczanie wychodzące, w tym `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch` i `withDurableMessageSendContext`. Przestarzałe mosty rozsyłania odpowiedzi pozostają importowalne tylko dla dyspozytorów zgodności. Używaj z modułów środowiska wykonawczego monitorowania/wysyłania, nie z gorących plików startowych wtyczki. |
    | `plugin-sdk/inbound-envelope` | Współdzielone pomocniki trasy przychodzącej i konstruktora koperty |
    | `plugin-sdk/inbound-reply-dispatch` | Starsze współdzielone pomocniki rejestrowania i rozsyłania rekordów przychodzących, predykaty widocznego/finalnego rozsyłania oraz przestarzała zgodność `deliverDurableInboundReplyPayload` dla przygotowanych dyspozytorów kanałów. Nowy kod odbioru/rozsyłania kanału powinien importować pomocniki cyklu życia środowiska wykonawczego z `plugin-sdk/channel-message-runtime`. |
    | `plugin-sdk/messaging-targets` | Pomocniki parsowania/dopasowywania celów |
    | `plugin-sdk/outbound-media` | Współdzielone pomocniki ładowania multimediów wychodzących |
    | `plugin-sdk/outbound-send-deps` | Lekkie wyszukiwanie zależności wysyłania wychodzącego dla adapterów kanału |
    | `plugin-sdk/outbound-runtime` | Pomocniki tożsamości wychodzącej, delegata wysyłania, sesji, formatowania i planowania ładunku. Bezpośrednie pomocniki dostarczania, takie jak `deliverOutboundPayloads`, są przestarzałą warstwą zgodności; używaj `plugin-sdk/channel-message-runtime` dla nowych ścieżek wysyłania. |
    | `plugin-sdk/poll-runtime` | Wąskie pomocniki normalizacji ankiet |
    | `plugin-sdk/thread-bindings-runtime` | Pomocniki cyklu życia wiązań wątku i adapterów |
    | `plugin-sdk/agent-media-payload` | Starszy konstruktor ładunku multimediów agenta |
    | `plugin-sdk/conversation-runtime` | Pomocniki wiązania rozmowy/wątku, parowania i skonfigurowanego wiązania |
    | `plugin-sdk/runtime-config-snapshot` | Pomocnik migawki konfiguracji środowiska wykonawczego |
    | `plugin-sdk/runtime-group-policy` | Pomocniki rozwiązywania zasad grup środowiska wykonawczego |
    | `plugin-sdk/channel-status` | Współdzielone pomocniki migawki/podsumowania statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Pomocniki autoryzacji zapisu konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty wstępu wtyczki kanału |
    | `plugin-sdk/allowlist-config-edit` | Pomocniki edycji/odczytu konfiguracji listy dozwolonych |
    | `plugin-sdk/group-access` | Współdzielone pomocniki decyzji dostępu grupowego |
    | `plugin-sdk/direct-dm` | Współdzielone pomocniki uwierzytelniania/ochrony bezpośrednich wiadomości DM |
    | `plugin-sdk/discord` | Przestarzała fasada zgodności Discord dla opublikowanego `@openclaw/discord@2026.3.13` i śledzonej zgodności właściciela; nowe wtyczki powinny używać ogólnych podścieżek SDK kanału |
    | `plugin-sdk/telegram-account` | Przestarzała fasada zgodności rozwiązywania kont Telegram dla śledzonej zgodności właściciela; nowe wtyczki powinny używać wstrzykniętych pomocników środowiska wykonawczego albo ogólnych podścieżek SDK kanału |
    | `plugin-sdk/zalouser` | Przestarzała fasada zgodności Zalo Personal dla opublikowanych pakietów Lark/Zalo, które nadal importują autoryzację poleceń nadawcy; nowe wtyczki powinny używać `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Semantyczna prezentacja wiadomości, dostarczanie i starsze pomocniki interaktywnych odpowiedzi. Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel zgodności dla odbijania wejścia, dopasowywania wzmianek, pomocników zasad wzmianek i pomocników kopert |
    | `plugin-sdk/channel-inbound-debounce` | Wąskie pomocniki odbijania wejścia |
    | `plugin-sdk/channel-mention-gating` | Wąskie pomocniki zasad wzmianek, znaczników wzmianek i tekstu wzmianek bez szerszej powierzchni środowiska wykonawczego wejścia |
    | `plugin-sdk/channel-envelope` | Wąskie pomocniki formatowania koperty przychodzącej |
    | `plugin-sdk/channel-location` | Kontekst lokalizacji kanału i pomocniki formatowania |
    | `plugin-sdk/channel-logging` | Pomocniki logowania kanału dla odrzuceń przychodzących i niepowodzeń wpisywania/potwierdzania |
    | `plugin-sdk/channel-send-result` | Typy wyniku odpowiedzi |
    | `plugin-sdk/channel-actions` | Pomocniki akcji wiadomości kanału oraz przestarzałe pomocniki schematów natywnych zachowane dla zgodności wtyczek |
    | `plugin-sdk/channel-route` | Współdzielona normalizacja trasy, rozwiązywanie celów sterowane parserem, konwersja identyfikatora wątku na ciąg, deduplikacja/kompaktowanie kluczy trasy, typy sparsowanych celów i pomocniki porównywania trasy/celu |
    | `plugin-sdk/channel-targets` | Pomocniki parsowania celów; wywołujący porównanie tras powinni używać `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Typy kontraktu kanału |
    | `plugin-sdk/channel-feedback` | Okablowanie opinii/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie pomocniki kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` i typy celów sekretów |
  </Accordion>

  <Accordion title="Podścieżki dostawców">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Obsługiwana fasada dostawcy LM Studio do konfiguracji, wykrywania katalogu i przygotowywania modelu w czasie działania |
    | `plugin-sdk/lmstudio-runtime` | Obsługiwana fasada czasu działania LM Studio dla lokalnych ustawień domyślnych serwera, wykrywania modeli, nagłówków żądań i helperów wczytanych modeli |
    | `plugin-sdk/provider-setup` | Wyselekcjonowane helpery konfiguracji lokalnych/samodzielnie hostowanych dostawców |
    | `plugin-sdk/self-hosted-provider-setup` | Wyspecjalizowane helpery konfiguracji samodzielnie hostowanych dostawców zgodnych z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI + stałe watchdoga |
    | `plugin-sdk/provider-auth-runtime` | Helpery rozwiązywania kluczy API w czasie działania dla pluginów dostawców |
    | `plugin-sdk/provider-auth-api-key` | Helpery onboardingu kluczy API/zapisu profilu, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy builder wyniku uwierzytelniania OAuth |
    | `plugin-sdk/provider-env-vars` | Helpery wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, przestarzały eksport zgodności `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone buildery zasad odtwarzania, helpery punktów końcowych dostawcy oraz współdzielone helpery normalizacji identyfikatorów modeli |
    | `plugin-sdk/provider-catalog-runtime` | Hook czasu działania rozszerzania katalogu dostawcy i szwy rejestru plugin-dostawca do testów kontraktu |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ogólne helpery możliwości HTTP/punktów końcowych dostawcy, błędy HTTP dostawcy i helpery formularzy multipart do transkrypcji audio |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie helpery kontraktu konfiguracji/wyboru web-fetch, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpery rejestracji/pamięci podręcznej dostawcy web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Wąskie helpery konfiguracji/poświadczeń wyszukiwania w sieci dla dostawców, którzy nie potrzebują okablowania włączania pluginu |
    | `plugin-sdk/provider-web-search-contract` | Wąskie helpery kontraktu konfiguracji/poświadczeń wyszukiwania w sieci, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowe settery/gettery poświadczeń |
    | `plugin-sdk/provider-web-search` | Helpery rejestracji/pamięci podręcznej/czasu działania dostawcy wyszukiwania w sieci |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` oraz czyszczenie schematów Gemini + diagnostyka |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` i podobne |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumienia oraz współdzielone helpery wrapperów Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Natywne helpery transportu dostawcy, takie jak chronione fetch, transformacje komunikatów transportu i zapisywalne strumienie zdarzeń transportu |
    | `plugin-sdk/provider-onboard` | Helpery łatek konfiguracji onboardingu |
    | `plugin-sdk/global-singleton` | Helpery singletonów/map/pamięci podręcznej lokalnych dla procesu |
    | `plugin-sdk/group-activation` | Wąskie helpery trybu aktywacji grupy i parsowania poleceń |
  </Accordion>

  <Accordion title="Podścieżki uwierzytelniania i bezpieczeństwa">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpery rejestru poleceń, w tym formatowanie dynamicznego menu argumentów, helpery autoryzacji nadawcy |
    | `plugin-sdk/command-status` | Buildery komunikatów poleceń/pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpery rozwiązywania zatwierdzających i uwierzytelniania akcji w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Natywne helpery profilu/filtra zatwierdzania exec |
    | `plugin-sdk/approval-delivery-runtime` | Natywne adaptery możliwości/dostarczania zatwierdzeń |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony helper rozwiązywania Gateway zatwierdzeń |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie helpery ładowania natywnych adapterów zatwierdzeń dla gorących punktów wejścia kanałów |
    | `plugin-sdk/approval-handler-runtime` | Szersze helpery czasu działania obsługi zatwierdzeń; preferuj węższe szwy adaptera/Gateway, gdy wystarczą |
    | `plugin-sdk/approval-native-runtime` | Natywne helpery celu zatwierdzenia + powiązania konta |
    | `plugin-sdk/approval-reply-runtime` | Helpery ładunku odpowiedzi zatwierdzenia exec/pluginu |
    | `plugin-sdk/approval-runtime` | Helpery ładunku zatwierdzenia exec/pluginu, natywne helpery routingu/czasu działania zatwierdzeń oraz helpery uporządkowanego wyświetlania zatwierdzeń, takie jak `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Wąskie helpery resetowania deduplikacji odpowiedzi przychodzących |
    | `plugin-sdk/channel-contract-testing` | Wąskie helpery testów kontraktu kanału bez szerokiej beczki testowej |
    | `plugin-sdk/command-auth-native` | Natywne uwierzytelnianie poleceń, formatowanie dynamicznego menu argumentów i natywne helpery celu sesji |
    | `plugin-sdk/command-detection` | Współdzielone helpery wykrywania poleceń |
    | `plugin-sdk/command-primitives-runtime` | Lekkie predykaty tekstu poleceń dla gorących ścieżek kanałów |
    | `plugin-sdk/command-surface` | Normalizacja treści polecenia i helpery powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery zbierania kontraktu sekretów dla powierzchni sekretów kanału/pluginu |
    | `plugin-sdk/secret-ref-runtime` | Wąskie helpery typowania `coerceSecretRef` i SecretRef do parsowania kontraktu sekretów/konfiguracji |
    | `plugin-sdk/security-runtime` | Współdzielone helpery zaufania, bramkowania DM, plików/ścieżek ograniczonych do katalogu głównego, w tym zapisy tylko tworzące, synchroniczna/asynchroniczna atomowa wymiana plików, zapisy do sąsiednich plików tymczasowych, awaryjne przenoszenie między urządzeniami, helpery prywatnego magazynu plików, zabezpieczenia rodziców symlinków, treści zewnętrzne, redakcja wrażliwego tekstu, porównywanie sekretów w stałym czasie i helpery zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Helpery listy dozwolonych hostów i polityki SSRF sieci prywatnej |
    | `plugin-sdk/ssrf-dispatcher` | Wąskie helpery przypiętego dispatchera bez szerokiej powierzchni czasu działania infrastruktury |
    | `plugin-sdk/ssrf-runtime` | Przypięty dispatcher, fetch chroniony przed SSRF, błąd SSRF i helpery polityki SSRF |
    | `plugin-sdk/secret-input` | Helpery parsowania wejścia sekretu |
    | `plugin-sdk/webhook-ingress` | Helpery żądań/celów Webhooka i koercja surowego websocket/body |
    | `plugin-sdk/webhook-request-guards` | Helpery rozmiaru/limitu czasu treści żądania |
  </Accordion>

  <Accordion title="Ścieżki podrzędne środowiska uruchomieniowego i przechowywania">
    | Ścieżka podrzędna | Główne eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie helpery środowiska uruchomieniowego, logowania, kopii zapasowych i instalacji pluginów |
    | `plugin-sdk/runtime-env` | Wąskie helpery środowiska uruchomieniowego, rejestratora, limitów czasu, ponawiania prób i opóźnień wykładniczych |
    | `plugin-sdk/browser-config` | Obsługiwana fasada konfiguracji przeglądarki do znormalizowanego profilu/wartości domyślnych, parsowania adresu URL CDP i helperów uwierzytelniania sterowania przeglądarką |
    | `plugin-sdk/channel-runtime-context` | Generyczne helpery rejestracji i wyszukiwania kontekstu środowiska uruchomieniowego kanału |
    | `plugin-sdk/matrix` | Przestarzała fasada zgodności Matrix dla starszych pakietów kanałów innych firm; nowe pluginy powinny importować `plugin-sdk/run-command` bezpośrednio |
    | `plugin-sdk/mattermost` | Przestarzała fasada zgodności Mattermost dla starszych pakietów kanałów innych firm; nowe pluginy powinny importować generyczne ścieżki podrzędne SDK bezpośrednio |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone helpery poleceń/hooków/http/interaktywnych pluginów |
    | `plugin-sdk/hook-runtime` | Współdzielone helpery potoku Webhooków/hooków wewnętrznych |
    | `plugin-sdk/lazy-runtime` | Helpery leniwego importu/powiązań środowiska uruchomieniowego, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpery wykonywania procesów |
    | `plugin-sdk/cli-runtime` | Helpery formatowania CLI, oczekiwania, wersji, wywołań argumentów i leniwych grup poleceń |
    | `plugin-sdk/gateway-runtime` | Klient Gateway, helper uruchamiania klienta gotowego na pętlę zdarzeń, RPC CLI Gateway, błędy protokołu Gateway i helpery poprawek statusu kanału |
    | `plugin-sdk/config-contracts` | Skupiona, wyłącznie typowa powierzchnia konfiguracji dla kształtów konfiguracji pluginów, takich jak `OpenClawConfig` oraz typy konfiguracji kanałów/dostawców |
    | `plugin-sdk/plugin-config-runtime` | Helpery wyszukiwania konfiguracji pluginów w środowisku uruchomieniowym, takie jak `requireRuntimeConfig`, `resolvePluginConfigObject` i `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helpery transakcyjnej mutacji konfiguracji, takie jak `mutateConfigFile`, `replaceConfigFile` i `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | Helpery migawki konfiguracji bieżącego procesu, takie jak `getRuntimeConfig`, `getRuntimeConfigSnapshot` i settery migawek testowych |
    | `plugin-sdk/telegram-command-config` | Normalizacja nazw/opisów poleceń Telegram oraz sprawdzanie duplikatów/konfliktów, nawet gdy dołączona powierzchnia kontraktu Telegram jest niedostępna |
    | `plugin-sdk/text-autolink-runtime` | Wykrywanie autolinków odwołań do plików bez szerokiego modułu zbiorczego tekstu |
    | `plugin-sdk/approval-runtime` | Helpery zatwierdzania exec/pluginów, konstruktory capability zatwierdzania, helpery uwierzytelniania/profili, helpery natywnego routingu/środowiska uruchomieniowego i formatowanie ścieżek wyświetlania ustrukturyzowanych zatwierdzeń |
    | `plugin-sdk/reply-runtime` | Współdzielone helpery środowiska uruchomieniowego wiadomości przychodzących/odpowiedzi, dzielenie na fragmenty, wysyłka, Heartbeat, planer odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery wysyłki/finalizacji odpowiedzi i etykiet rozmów |
    | `plugin-sdk/reply-history` | Współdzielone helpery historii odpowiedzi krótkiego okna i znaczniki, takie jak `buildHistoryContext`, `HISTORY_CONTEXT_MARKER`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie helpery dzielenia tekstu/markdownu na fragmenty |
    | `plugin-sdk/session-store-runtime` | Helpery ścieżki magazynu sesji, klucza sesji, czasu aktualizacji i mutacji magazynu |
    | `plugin-sdk/cron-store-runtime` | Helpery ścieżki/wczytywania/zapisywania magazynu Cron |
    | `plugin-sdk/state-paths` | Helpery ścieżek katalogu stanu/OAuth |
    | `plugin-sdk/routing` | Helpery routingu/klucza sesji/powiązania konta, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone helpery podsumowania statusu kanału/konta, wartości domyślne stanu środowiska uruchomieniowego i helpery metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone helpery resolwera celu |
    | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji slugów/ciągów znaków |
    | `plugin-sdk/request-url` | Wyodrębnianie adresów URL jako ciągów znaków z wejść podobnych do fetch/request |
    | `plugin-sdk/run-command` | Uruchamiacz poleceń z limitem czasu i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Wspólne czytniki parametrów narzędzi/CLI |
    | `plugin-sdk/tool-payload` | Wyodrębnianie znormalizowanych ładunków z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
    | `plugin-sdk/temp-path` | Współdzielone helpery ścieżek tymczasowych pobrań i prywatne bezpieczne tymczasowe przestrzenie robocze |
    | `plugin-sdk/logging-core` | Rejestrator podsystemu i helpery redakcji |
    | `plugin-sdk/markdown-table-runtime` | Helpery trybu tabel Markdown i konwersji |
    | `plugin-sdk/model-session-runtime` | Helpery nadpisań modelu/sesji, takie jak `applyModelOverrideToSessionEntry` i `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpery rozwiązywania konfiguracji dostawcy rozmów |
    | `plugin-sdk/json-store` | Małe helpery odczytu/zapisu stanu JSON |
    | `plugin-sdk/file-lock` | Helpery reentrantnej blokady pliku |
    | `plugin-sdk/persistent-dedupe` | Helpery pamięci podręcznej deduplikacji opartej na dysku |
    | `plugin-sdk/acp-runtime` | Helpery środowiska uruchomieniowego/sesji ACP i wysyłki odpowiedzi |
    | `plugin-sdk/acp-runtime-backend` | Lekkie helpery rejestracji backendu ACP i wysyłki odpowiedzi dla pluginów ładowanych przy starcie |
    | `plugin-sdk/acp-binding-resolve-runtime` | Tylko do odczytu rozwiązywanie powiązań ACP bez importów uruchamiania cyklu życia |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji środowiska uruchomieniowego agenta |
    | `plugin-sdk/boolean-param` | Luźny czytnik parametrów logicznych |
    | `plugin-sdk/dangerous-name-runtime` | Helpery rozwiązywania dopasowań niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Helpery rozruchu urządzenia i tokenów parowania |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy pasywnego kanału, statusu i helperów ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Helpery odpowiedzi polecenia/dostawcy `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpery listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Helpery rejestru/budowania/serializacji natywnych poleceń |
    | `plugin-sdk/agent-harness` | Eksperymentalna powierzchnia zaufanego pluginu dla niskopoziomowych uprzęży agentów: typy uprzęży, helpery sterowania/przerywania aktywnego uruchomienia, helpery mostu narzędzi OpenClaw, helpery polityki narzędzi planu środowiska uruchomieniowego, klasyfikacja wyniku terminala, helpery formatowania/szczegółów postępu narzędzi i narzędzia wyników prób |
    | `plugin-sdk/provider-zai-endpoint` | Przestarzała, należąca do dostawcy Z.AI fasada wykrywania endpointów; użyj publicznego API pluginu Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper lokalnej dla procesu blokady asynchronicznej dla małych plików stanu środowiska uruchomieniowego |
    | `plugin-sdk/channel-activity-runtime` | Helper telemetrii aktywności kanału |
    | `plugin-sdk/concurrency-runtime` | Helper ograniczonej współbieżności zadań asynchronicznych |
    | `plugin-sdk/dedupe-runtime` | Helpery pamięci podręcznej deduplikacji w pamięci |
    | `plugin-sdk/delivery-queue-runtime` | Helper opróżniania oczekujących wysyłek wychodzących |
    | `plugin-sdk/file-access-runtime` | Helpery bezpiecznych ścieżek plików lokalnych i źródeł mediów |
    | `plugin-sdk/heartbeat-runtime` | Helpery wybudzania, zdarzeń i widoczności Heartbeat |
    | `plugin-sdk/number-runtime` | Helper koercji liczbowej |
    | `plugin-sdk/secure-random-runtime` | Helpery bezpiecznych tokenów/UUID |
    | `plugin-sdk/system-event-runtime` | Helpery kolejki zdarzeń systemowych |
    | `plugin-sdk/transport-ready-runtime` | Helper oczekiwania na gotowość transportu |
    | `plugin-sdk/infra-runtime` | Przestarzały shim zgodności; użyj powyższych skupionych ścieżek podrzędnych środowiska uruchomieniowego |
    | `plugin-sdk/collection-runtime` | Małe helpery ograniczonej pamięci podręcznej |
    | `plugin-sdk/diagnostic-runtime` | Helpery flag diagnostycznych, zdarzeń i kontekstu śledzenia |
    | `plugin-sdk/error-runtime` | Graf błędów, formatowanie, współdzielone helpery klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Opakowany fetch, proxy, opcja EnvHttpProxyAgent i helpery przypiętego wyszukiwania |
    | `plugin-sdk/runtime-fetch` | Świadomy dispatchera fetch środowiska uruchomieniowego bez importów proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Ograniczony czytnik treści odpowiedzi bez szerokiej powierzchni środowiska uruchomieniowego mediów |
    | `plugin-sdk/session-binding-runtime` | Bieżący stan powiązania rozmowy bez skonfigurowanego routingu powiązań lub magazynów parowania |
    | `plugin-sdk/session-store-runtime` | Helpery magazynu sesji bez szerokich importów zapisu/utrzymania konfiguracji |
    | `plugin-sdk/context-visibility-runtime` | Rozwiązywanie widoczności kontekstu i filtrowanie kontekstu uzupełniającego bez szerokich importów konfiguracji/zabezpieczeń |
    | `plugin-sdk/string-coerce-runtime` | Wąskie helpery koercji i normalizacji prymitywnych rekordów/ciągów znaków bez importów markdownu/logowania |
    | `plugin-sdk/host-runtime` | Helpery normalizacji nazwy hosta i hosta SCP |
    | `plugin-sdk/retry-runtime` | Helpery konfiguracji ponawiania i uruchamiania ponowień |
    | `plugin-sdk/agent-runtime` | Helpery katalogu/tożsamości/przestrzeni roboczej agenta, w tym `resolveAgentDir`, `resolveDefaultAgentDir` i przestarzały eksport zgodności `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Zapytanie/deduplikacja katalogu oparta na konfiguracji |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Podścieżki możliwości i testowania">
    | Podścieżka | Główne eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Współdzielone helpery pobierania/przekształcania/przechowywania multimediów, wykrywanie wymiarów wideo oparte na ffprobe oraz konstruktory ładunków multimedialnych |
    | `plugin-sdk/media-mime` | Wąska normalizacja MIME, mapowanie rozszerzeń plików, wykrywanie MIME oraz helpery rodzaju multimediów |
    | `plugin-sdk/media-store` | Wąskie helpery magazynu multimediów, takie jak `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Współdzielone helpery przełączania awaryjnego generowania multimediów, wybór kandydatów oraz komunikaty o brakującym modelu |
    | `plugin-sdk/media-understanding` | Typy dostawcy rozumienia multimediów oraz eksporty helperów obrazów/dźwięku przeznaczone dla dostawców |
    | `plugin-sdk/text-chunking` | Helpery dzielenia/renderowania tekstu i markdown, konwersja tabel markdown, usuwanie tagów dyrektyw oraz narzędzia bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Helper dzielenia tekstu wychodzącego |
    | `plugin-sdk/speech` | Typy dostawcy mowy oraz eksporty dyrektyw, rejestru, walidacji, konstruktora TTS zgodnego z OpenAI i helperów mowy przeznaczone dla dostawców |
    | `plugin-sdk/speech-core` | Współdzielone typy dostawcy mowy, rejestr, dyrektywa, normalizacja oraz eksporty helperów mowy |
    | `plugin-sdk/realtime-transcription` | Typy dostawcy transkrypcji w czasie rzeczywistym, helpery rejestru oraz współdzielony helper sesji WebSocket |
    | `plugin-sdk/realtime-voice` | Typy dostawcy głosu w czasie rzeczywistym i helpery rejestru |
    | `plugin-sdk/image-generation` | Typy dostawcy generowania obrazów oraz helpery zasobów obrazów/adresów URL danych i konstruktor dostawcy obrazów zgodny z OpenAI |
    | `plugin-sdk/image-generation-core` | Współdzielone typy generowania obrazów, przełączanie awaryjne, uwierzytelnianie i helpery rejestru |
    | `plugin-sdk/music-generation` | Typy dostawcy/żądania/wyniku generowania muzyki |
    | `plugin-sdk/music-generation-core` | Współdzielone typy generowania muzyki, helpery przełączania awaryjnego, wyszukiwanie dostawcy oraz parsowanie odwołań do modeli |
    | `plugin-sdk/video-generation` | Typy dostawcy/żądania/wyniku generowania wideo |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo, helpery przełączania awaryjnego, wyszukiwanie dostawcy oraz parsowanie odwołań do modeli |
    | `plugin-sdk/webhook-targets` | Rejestr celów Webhook i helpery instalowania tras |
    | `plugin-sdk/webhook-path` | Przestarzały alias zgodności; użyj `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Współdzielone helpery ładowania zdalnych/lokalnych multimediów |
    | `plugin-sdk/zod` | Przestarzały reeksport zgodności; importuj `zod` bezpośrednio z `zod` |
    | `plugin-sdk/testing` | Lokalny dla repozytorium, przestarzały barrel zgodności dla starszych testów OpenClaw. Nowe testy repozytorium powinny zamiast tego importować ukierunkowane lokalne podścieżki testowe, takie jak `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` lub `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Lokalny dla repozytorium, minimalny helper `createTestPluginApi` do bezpośrednich testów jednostkowych rejestracji pluginów bez importowania mostków helperów testowych repozytorium |
    | `plugin-sdk/agent-runtime-test-contracts` | Lokalne dla repozytorium natywne fixtury kontraktów adaptera środowiska wykonawczego agenta dla testów uwierzytelniania, dostarczania, fallbacku, hooków narzędzi, nakładki promptu, schematu i projekcji transkryptu |
    | `plugin-sdk/channel-test-helpers` | Lokalne dla repozytorium helpery testowe zorientowane na kanały dla ogólnych kontraktów akcji/konfiguracji/statusu, asercji katalogów, cyklu życia uruchamiania konta, wątkowania konfiguracji wysyłania, mocków środowiska wykonawczego, problemów statusu, dostarczania wychodzącego i rejestracji hooków |
    | `plugin-sdk/channel-target-testing` | Lokalny dla repozytorium współdzielony zestaw przypadków błędów rozwiązywania celu dla testów kanałów |
    | `plugin-sdk/plugin-test-contracts` | Lokalne dla repozytorium helpery kontraktów pakietu pluginu, rejestracji, publicznego artefaktu, bezpośredniego importu, runtime API i efektów ubocznych importu |
    | `plugin-sdk/provider-test-contracts` | Lokalne dla repozytorium helpery kontraktów środowiska wykonawczego dostawcy, uwierzytelniania, wykrywania, onboardingu, katalogu, kreatora, możliwości multimedialnych, zasad odtwarzania, dźwięku na żywo STT w czasie rzeczywistym, wyszukiwania/pobierania w sieci oraz strumienia |
    | `plugin-sdk/provider-http-test-mocks` | Lokalne dla repozytorium opcjonalne mocki HTTP/uwierzytelniania Vitest dla testów dostawców, które ćwiczą `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Lokalne dla repozytorium ogólne fixtury przechwytywania środowiska wykonawczego CLI, kontekstu piaskownicy, pisarza Skills, wiadomości agenta, zdarzenia systemowego, przeładowania modułu, ścieżki spakowanego pluginu, tekstu terminala, dzielenia tekstu, tokenu uwierzytelniania i typowanych przypadków |
    | `plugin-sdk/test-node-mocks` | Lokalne dla repozytorium ukierunkowane helpery mocków wbudowanych Node do użycia wewnątrz fabryk Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Podścieżki pamięci">
    | Podścieżka | Główne eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Powierzchnia helperów spakowanego memory-core dla helperów menedżera/konfiguracji/plików/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada środowiska wykonawczego indeksu/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika podstaw hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrakty osadzeń hosta pamięci, dostęp do rejestru, lokalny dostawca oraz ogólne helpery wsadowe/zdalne |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika przechowywania hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Helpery multimodalne hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Przestarzały alias zgodności; użyj `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helpery statusu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpery środowiska wykonawczego CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpery głównego środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny względem dostawcy alias dla helperów głównego środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny względem dostawcy alias dla helperów dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Przestarzały alias zgodności; użyj `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Współdzielone helpery zarządzanego markdown dla pluginów powiązanych z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada środowiska wykonawczego aktywnej pamięci dla dostępu do menedżera wyszukiwania |
    | `plugin-sdk/memory-host-status` | Przestarzały alias zgodności; użyj `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Zarezerwowane podścieżki spakowanych helperów">
    Obecnie nie ma zarezerwowanych podścieżek SDK spakowanych helperów. Helpery
    specyficzne dla właściciela znajdują się w pakiecie pluginu właściciela,
    a kontrakty hosta wielokrotnego użytku korzystają z ogólnych podścieżek SDK,
    takich jak `plugin-sdk/gateway-runtime`,
    `plugin-sdk/security-runtime` i `plugin-sdk/plugin-config-runtime`.
  </Accordion>
</AccordionGroup>

## Powiązane

- [Omówienie Plugin SDK](/pl/plugins/sdk-overview)
- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Tworzenie pluginów](/pl/plugins/building-plugins)
