---
read_when:
    - Wybór właściwej podścieżki plugin-sdk dla importu Pluginu
    - Audytowanie podścieżek dołączonych Pluginów i interfejsów pomocniczych
summary: 'Katalog podścieżek Plugin SDK: które importy znajdują się gdzie, pogrupowane według obszaru'
title: Ścieżki podrzędne SDK Plugin
x-i18n:
    generated_at: "2026-07-04T11:06:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2a77f70197aca279d44d2b9db62bf9f936594311bb46c3da682413c3fa1378e5
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK Plugin jest udostępniany jako zestaw wąskich publicznych podścieżek w
`openclaw/plugin-sdk/`. Ta strona kataloguje często używane podścieżki pogrupowane
według przeznaczenia. Wygenerowany spis punktów wejścia kompilatora znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`; eksporty pakietu są publicznym podzbiorem
po odjęciu lokalnych dla repozytorium podścieżek testowych/wewnętrznych wymienionych w
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Opiekunowie mogą audytować
liczbę publicznych eksportów za pomocą `pnpm plugin-sdk:surface` oraz aktywne zarezerwowane
podścieżki pomocnicze za pomocą `pnpm plugins:boundary-report:summary`; nieużywane zarezerwowane
eksporty pomocnicze powodują błąd raportu CI, zamiast pozostawać w publicznym SDK jako
uśpiony dług kompatybilności.

Przewodnik tworzenia Pluginów znajdziesz w [Przeglądzie SDK Plugin](/pl/plugins/sdk-overview).

## Wejście Plugin

| Podścieżka                     | Kluczowe eksporty                                                                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Pomocniki elementów dostawcy migracji, takie jak `createMigrationItem`, stałe powodów, znaczniki stanu elementów, pomocniki redakcji oraz `summarizeMigrationItems`     |
| `plugin-sdk/migration-runtime` | Pomocniki migracji środowiska uruchomieniowego, takie jak `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` oraz `writeMigrationReport` |
| `plugin-sdk/health`            | Rejestracja kontroli stanu Doctor, wykrywanie, naprawa, wybór, ważność oraz typy ustaleń dla dołączonych odbiorców stanu                                             |

### Przestarzała kompatybilność i pomocniki testowe

Przestarzałe podścieżki pozostają eksportowane dla starszych Pluginów, ale nowy kod powinien używać
wyspecjalizowanych podścieżek SDK poniżej. Utrzymywana lista znajduje się w
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI odrzuca dołączone
importy produkcyjne z tej listy. Szerokie baryłki, takie jak `compat`, `config-types`,
`infra-runtime`, `text-runtime` i `zod`, służą wyłącznie kompatybilności. Importuj `zod`
bezpośrednio z `zod`.

Podścieżki pomocników testowych OpenClaw opartych na Vitest są wyłącznie lokalne dla repozytorium i nie są
już eksportami pakietu: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` oraz `testing`.

### Zarezerwowane podścieżki pomocnicze dołączonych Pluginów

Te podścieżki są powierzchniami kompatybilności należącymi do Pluginów dla ich właścicielskich dołączonych
Pluginów, a nie ogólnymi API SDK: `plugin-sdk/codex-mcp-projection` oraz
`plugin-sdk/codex-native-task-runtime`. Importy rozszerzeń między właścicielami są blokowane
przez zabezpieczenia kontraktu pakietu.

<AccordionGroup>
  <Accordion title="Ścieżki podrzędne kanałów">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Pomocnik walidacji JSON Schema z pamięcią podręczną dla schematów należących do pluginów |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone pomocniki kreatora konfiguracji, translator konfiguracji, monity listy dozwolonych, konstruktory statusu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Przestarzały alias zgodności; użyj `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Pomocniki konfiguracji wielu kont/bramki akcji, pomocniki awaryjnego konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, pomocniki normalizacji identyfikatora konta |
    | `plugin-sdk/account-resolution` | Pomocniki wyszukiwania konta i domyślnego mechanizmu awaryjnego |
    | `plugin-sdk/account-helpers` | Wąskie pomocniki listy kont/akcji konta |
    | `plugin-sdk/access-groups` | Pomocniki parsowania listy dozwolonych grup dostępu i zredagowanej diagnostyki grup |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Współdzielone prymitywy schematu konfiguracji kanału oraz konstruktory Zod i bezpośrednie konstruktory JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Dołączone schematy konfiguracji kanałów OpenClaw tylko dla utrzymywanych dołączonych pluginów |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Kanoniczne identyfikatory dołączonych/oficjalnych kanałów czatu oraz etykiety/aliasy formatujące dla pluginów, które muszą rozpoznawać tekst z prefiksem koperty bez kodowania własnej tabeli na stałe. |
    | `plugin-sdk/channel-config-schema-legacy` | Przestarzały alias zgodności dla dołączonych schematów konfiguracji kanałów |
    | `plugin-sdk/telegram-command-config` | Pomocniki normalizacji/walidacji niestandardowych poleceń Telegram z awaryjnym kontraktem dołączonym |
    | `plugin-sdk/command-gating` | Wąskie pomocniki bramki autoryzacji poleceń |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Przestarzała niskopoziomowa fasada zgodności ruchu przychodzącego kanału. Nowe ścieżki odbioru powinny używać `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Eksperymentalny wysokopoziomowy resolver środowiska uruchomieniowego ruchu przychodzącego kanału i konstruktory faktów trasy dla zmigrowanych ścieżek odbioru kanału. Preferuj to zamiast składania efektywnych list dozwolonych, list dozwolonych poleceń i starszych projekcji w każdym pluginie. Zobacz [API ruchu przychodzącego kanału](/pl/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Kontrakty cyklu życia wiadomości oraz opcje potoku odpowiedzi, potwierdzenia, podgląd na żywo/strumieniowanie, pomocniki cyklu życia, tożsamość wychodząca, planowanie ładunku, trwałe wysyłki i pomocniki kontekstu wysyłania wiadomości. Zobacz [API ruchu wychodzącego kanału](/pl/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Przestarzały alias zgodności dla `plugin-sdk/channel-outbound` oraz starsze fasady wysyłania odpowiedzi. |
    | `plugin-sdk/channel-message-runtime` | Przestarzały alias zgodności dla `plugin-sdk/channel-outbound` oraz starsze fasady wysyłania odpowiedzi. |
    | `plugin-sdk/inbound-envelope` | Współdzielone pomocniki trasy przychodzącej i konstruktora koperty |
    | `plugin-sdk/inbound-reply-dispatch` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-inbound` dla runnerów przychodzących i predykatów wysyłania oraz `plugin-sdk/channel-outbound` dla pomocników dostarczania wiadomości. |
    | `plugin-sdk/messaging-targets` | Przestarzały alias parsowania celu; użyj `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Współdzielone pomocniki ładowania multimediów wychodzących i stanu hostowanych multimediów |
    | `plugin-sdk/outbound-send-deps` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Wąskie pomocniki normalizacji ankiet |
    | `plugin-sdk/thread-bindings-runtime` | Pomocniki cyklu życia powiązań wątku i adapterów |
    | `plugin-sdk/agent-media-payload` | Starszy konstruktor ładunku multimediów agenta |
    | `plugin-sdk/conversation-runtime` | Pomocniki powiązań rozmowy/wątku, parowania i skonfigurowanych powiązań |
    | `plugin-sdk/runtime-config-snapshot` | Pomocnik migawki konfiguracji środowiska uruchomieniowego |
    | `plugin-sdk/runtime-group-policy` | Pomocniki rozwiązywania zasad grup w środowisku uruchomieniowym |
    | `plugin-sdk/channel-status` | Współdzielone pomocniki migawki/podsumowania statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Pomocniki autoryzacji zapisu konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty wstępu pluginu kanału |
    | `plugin-sdk/allowlist-config-edit` | Pomocniki edycji/odczytu konfiguracji listy dozwolonych |
    | `plugin-sdk/group-access` | Współdzielone pomocniki decyzji dostępu grupowego |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Przestarzałe fasady zgodności. Użyj `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Wąskie pomocniki zasad strażnika bezpośrednich DM przed kryptografią |
    | `plugin-sdk/discord` | Przestarzała fasada zgodności Discord dla opublikowanego `@openclaw/discord@2026.3.13` i śledzonej zgodności właściciela; nowe pluginy powinny używać ogólnych ścieżek podrzędnych SDK kanału |
    | `plugin-sdk/telegram-account` | Przestarzała fasada zgodności rozwiązywania kont Telegram dla śledzonej zgodności właściciela; nowe pluginy powinny używać wstrzykniętych pomocników środowiska uruchomieniowego lub ogólnych ścieżek podrzędnych SDK kanału |
    | `plugin-sdk/zalouser` | Przestarzała fasada zgodności Zalo Personal dla opublikowanych pakietów Lark/Zalo, które nadal importują autoryzację poleceń nadawcy; nowe pluginy powinny używać `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Semantyczna prezentacja wiadomości, dostarczanie i starsze pomocniki interaktywnych odpowiedzi. Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Współdzielone pomocniki przychodzące do klasyfikacji zdarzeń, budowania kontekstu, formatowania, korzeni, debounce, dopasowywania wzmianek, zasad wzmianek i rejestrowania ruchu przychodzącego |
    | `plugin-sdk/channel-inbound-debounce` | Wąskie pomocniki debounce dla ruchu przychodzącego |
    | `plugin-sdk/channel-mention-gating` | Wąskie pomocniki zasad wzmianek, znacznika wzmianki i tekstu wzmianki bez szerszej powierzchni środowiska uruchomieniowego ruchu przychodzącego |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Przestarzałe fasady zgodności. Użyj `plugin-sdk/channel-inbound` lub `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | Pomocniki akcji wiadomości kanału oraz przestarzałe pomocniki schematu natywnego zachowane dla zgodności pluginów |
    | `plugin-sdk/channel-route` | Współdzielona normalizacja tras, rozwiązywanie celów sterowane parserem, konwersja identyfikatora wątku na ciąg znaków, klucze deduplikacji/kompaktowej trasy, typy sparsowanego celu oraz pomocniki porównywania tras/celów |
    | `plugin-sdk/channel-targets` | Pomocniki parsowania celów; wywołujący porównania tras powinni używać `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Typy kontraktów kanału |
    | `plugin-sdk/channel-feedback` | Okablowanie informacji zwrotnych/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie pomocniki kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` i typy celów sekretów |
  </Accordion>

Przestarzałe rodziny pomocników kanałów pozostają dostępne tylko dla
zgodności opublikowanych pluginów. Plan usunięcia jest następujący: zachować je
przez okres migracji zewnętrznych pluginów, utrzymywać pluginy repozytorium/dołączone
na `channel-inbound` i `channel-outbound`, a następnie usunąć ścieżki podrzędne
zgodności podczas kolejnego dużego porządkowania SDK. Dotyczy to starszych rodzin
komunikatów/środowiska uruchomieniowego kanału, strumieniowania kanału, dostępu
direct-DM, odłamów pomocników ruchu przychodzącego, opcji odpowiedzi i ścieżek
parowania.

  <Accordion title="Podścieżki dostawcy">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Obsługiwana fasada dostawcy LM Studio do konfiguracji, wykrywania katalogu i przygotowywania modelu w czasie wykonywania |
    | `plugin-sdk/lmstudio-runtime` | Obsługiwana fasada runtime LM Studio dla domyślnych ustawień lokalnego serwera, wykrywania modeli, nagłówków żądań i pomocników załadowanych modeli |
    | `plugin-sdk/provider-setup` | Wyselekcjonowane pomocniki konfiguracji lokalnych/samodzielnie hostowanych dostawców |
    | `plugin-sdk/self-hosted-provider-setup` | Skoncentrowane pomocniki konfiguracji samodzielnie hostowanego dostawcy zgodnego z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI + stałe watchdog |
    | `plugin-sdk/provider-auth-runtime` | Pomocniki rozwiązywania kluczy API w czasie wykonywania dla pluginów dostawców |
    | `plugin-sdk/provider-oauth-runtime` | Ogólne typy wywołań zwrotnych OAuth dostawców, renderowanie strony wywołania zwrotnego, pomocniki PKCE/stanu, parsowanie danych wejściowych autoryzacji, pomocniki wygasania tokenów i pomocniki przerywania |
    | `plugin-sdk/provider-auth-api-key` | Pomocniki onboardingu klucza API/zapisu profilu, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy konstruktor wyniku uwierzytelniania OAuth |
    | `plugin-sdk/provider-env-vars` | Pomocniki wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, pomocniki importu uwierzytelniania OpenAI Codex, przestarzały eksport zgodności `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory zasad odtwarzania, pomocniki punktów końcowych dostawcy i współdzielone pomocniki normalizacji identyfikatorów modeli |
    | `plugin-sdk/provider-catalog-live-runtime` | Pomocniki katalogu modeli dostawcy na żywo dla strzeżonego wykrywania w stylu `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrowanie identyfikatorów modeli, pamięć podręczna TTL i statyczny fallback |
    | `plugin-sdk/provider-catalog-runtime` | Hak runtime rozszerzania katalogu dostawcy oraz punkty styku rejestru plugin-dostawca dla testów kontraktowych |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ogólne pomocniki HTTP/możliwości punktów końcowych dostawcy, błędy HTTP dostawcy oraz pomocniki formularza wieloczęściowego transkrypcji audio |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie pomocniki kontraktu konfiguracji/wyboru web-fetch, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Pomocniki rejestracji/pamięci podręcznej dostawcy web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Wąskie pomocniki konfiguracji/poświadczeń web-search dla dostawców, którzy nie potrzebują okablowania włączania pluginu |
    | `plugin-sdk/provider-web-search-contract` | Wąskie pomocniki kontraktu konfiguracji/poświadczeń web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowe settery/gettery poświadczeń |
    | `plugin-sdk/provider-web-search` | Pomocniki rejestracji/pamięci podręcznej/runtime dostawcy web-search |
    | `plugin-sdk/embedding-providers` | Ogólne typy dostawców osadzeń i pomocniki odczytu, w tym `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` i `listEmbeddingProviders(...)`; pluginy rejestrują dostawców przez `api.registerEmbeddingProvider(...)`, aby wymusić własność manifestu |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` oraz czyszczenie schematów + diagnostyka DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Typy migawek użycia dostawcy, współdzielone pomocniki pobierania użycia oraz pobieracze dostawców, takie jak `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni, zgodność wywołań narzędzi w zwykłym tekście oraz współdzielone pomocniki wrapperów Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Publiczne współdzielone pomocniki wrapperów strumieni dostawców, w tym `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` oraz narzędzia strumieni zgodnych z Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Natywne pomocniki transportu dostawcy, takie jak strzeżony fetch, wyodrębnianie tekstu wyników narzędzi, transformacje komunikatów transportowych i zapisywalne strumienie zdarzeń transportu |
    | `plugin-sdk/provider-onboard` | Pomocniki poprawek konfiguracji onboardingu |
    | `plugin-sdk/global-singleton` | Pomocniki singletonów/map/pamięci podręcznych lokalnych dla procesu |
    | `plugin-sdk/group-activation` | Wąskie pomocniki trybu aktywacji grupy i parsowania poleceń |
  </Accordion>

Migawki użycia dostawcy zwykle raportują jedno lub więcej `windows` limitów, każde z
etykietą, procentem użycia i opcjonalnym czasem resetu. Dostawcy, którzy zamiast
resetowalnych okien limitów udostępniają saldo lub tekst stanu konta, powinni zwracać
`summary` z pustą tablicą `windows`, zamiast fabrykować wartości procentowe.
OpenClaw wyświetla ten tekst podsumowania w danych wyjściowych statusu; używaj `error`
tylko wtedy, gdy punkt końcowy użycia zawiódł lub nie zwrócił żadnych użytecznych danych użycia.

  <Accordion title="Podścieżki uwierzytelniania i bezpieczeństwa">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, pomocniki rejestru poleceń, w tym formatowanie menu argumentów dynamicznych, pomocniki autoryzacji nadawcy |
    | `plugin-sdk/command-status` | Konstruktory komunikatów poleceń/pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Rozwiązywanie zatwierdzających i pomocniki uwierzytelniania akcji w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Pomocniki profilu/filtra natywnego zatwierdzania exec |
    | `plugin-sdk/approval-delivery-runtime` | Natywne adaptery możliwości/dostarczania zatwierdzeń |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony pomocnik rozwiązywania Gateway zatwierdzeń |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie pomocniki ładowania natywnych adapterów zatwierdzania dla gorących punktów wejścia kanałów |
    | `plugin-sdk/approval-handler-runtime` | Szersze pomocniki runtime obsługi zatwierdzania; preferuj węższe punkty styku adaptera/Gateway, gdy są wystarczające |
    | `plugin-sdk/approval-native-runtime` | Pomocniki natywnego celu zatwierdzania, wiązania konta, bramki tras, fallbacku przekazywania oraz tłumienia lokalnego natywnego monitu exec |
    | `plugin-sdk/approval-reaction-runtime` | Zakodowane na stałe powiązania reakcji zatwierdzania, ładunki monitów reakcji, magazyny celów reakcji, pomocniki tekstu podpowiedzi reakcji oraz eksport zgodności dla tłumienia lokalnego natywnego monitu exec |
    | `plugin-sdk/approval-reply-runtime` | Pomocniki ładunków odpowiedzi zatwierdzania exec/pluginu |
    | `plugin-sdk/approval-runtime` | Pomocniki ładunków zatwierdzania exec/pluginu, pomocniki routingu/runtime natywnego zatwierdzania oraz pomocniki strukturalnego wyświetlania zatwierdzeń, takie jak `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Wąskie pomocniki resetowania deduplikacji przychodzących odpowiedzi |
    | `plugin-sdk/channel-contract-testing` | Wąskie pomocniki testów kontraktowych kanału bez szerokiego barrela testowego |
    | `plugin-sdk/command-auth-native` | Natywne uwierzytelnianie poleceń, formatowanie menu argumentów dynamicznych i pomocniki natywnego celu sesji |
    | `plugin-sdk/command-detection` | Współdzielone pomocniki wykrywania poleceń |
    | `plugin-sdk/command-primitives-runtime` | Lekkie predykaty tekstu poleceń dla gorących ścieżek kanałów |
    | `plugin-sdk/command-surface` | Normalizacja treści poleceń i pomocniki powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Leniwe pomocniki przepływu logowania uwierzytelniania dostawcy dla prywatnego kanału i parowania kodem urządzenia w Web UI |
    | `plugin-sdk/channel-secret-runtime` | Wąskie pomocniki zbierania kontraktów sekretów dla powierzchni sekretów kanału/pluginu |
    | `plugin-sdk/secret-ref-runtime` | Wąskie pomocniki typowania `coerceSecretRef` i SecretRef dla parsowania kontraktu sekretów/konfiguracji |
    | `plugin-sdk/secret-provider-integration` | Manifest integracji dostawcy SecretRef tylko na poziomie typów oraz kontrakty presetów dla pluginów publikujących zewnętrzne presety dostawców sekretów |
    | `plugin-sdk/security-runtime` | Współdzielone pomocniki zaufania, bramkowania DM, plików/ścieżek ograniczonych do katalogu głównego, w tym zapisy tylko tworzące, synchroniczna/asynchroniczna atomowa podmiana plików, zapisy do tymczasowych plików sąsiednich, fallback przenoszenia między urządzeniami, pomocniki prywatnego magazynu plików, strażnicy nadrzędnych katalogów symlinków, treść zewnętrzna, redakcja tekstu wrażliwego, porównywanie sekretów w stałym czasie oraz pomocniki zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Pomocniki listy dozwolonych hostów i polityki SSRF sieci prywatnej |
    | `plugin-sdk/ssrf-dispatcher` | Wąskie pomocniki przypiętego dispatchera bez szerokiej powierzchni runtime infrastruktury |
    | `plugin-sdk/ssrf-runtime` | Przypięty dispatcher, fetch strzeżony przez SSRF, błąd SSRF i pomocniki polityki SSRF |
    | `plugin-sdk/secret-input` | Pomocniki parsowania wejścia sekretów |
    | `plugin-sdk/webhook-ingress` | Pomocniki żądań/celów Webhook oraz koercja surowego websocket/ciała |
    | `plugin-sdk/webhook-request-guards` | Pomocniki rozmiaru/limitu czasu treści żądania |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie pomocniki środowiska wykonawczego, logowania, kopii zapasowych i instalacji Plugin |
    | `plugin-sdk/runtime-env` | Wąskie pomocniki środowiska wykonawczego, loggera, limitu czasu, ponawiania i wycofywania |
    | `plugin-sdk/browser-config` | Obsługiwana fasada konfiguracji przeglądarki dla znormalizowanego profilu i wartości domyślnych, parsowania adresu URL CDP oraz pomocników uwierzytelniania sterowania przeglądarką |
    | `plugin-sdk/agent-harness-task-runtime` | Ogólne pomocniki cyklu życia zadania i dostarczania ukończenia dla agentów opartych na harnessie, używających zakresu zadania wydanego przez hosta |
    | `plugin-sdk/codex-mcp-projection` | Zarezerwowany dołączony pomocnik Codex do rzutowania konfiguracji serwera MCP użytkownika na konfigurację wątku Codex; nie dla Plugin firm trzecich |
    | `plugin-sdk/codex-native-task-runtime` | Prywatny dołączony pomocnik Codex do natywnego lustra zadań i okablowania środowiska wykonawczego; nie dla Plugin firm trzecich |
    | `plugin-sdk/channel-runtime-context` | Ogólne pomocniki rejestracji i wyszukiwania kontekstu środowiska wykonawczego kanału |
    | `plugin-sdk/matrix` | Przestarzała fasada zgodności Matrix dla starszych pakietów kanałów firm trzecich; nowe Plugin powinny importować `plugin-sdk/run-command` bezpośrednio |
    | `plugin-sdk/mattermost` | Przestarzała fasada zgodności Mattermost dla starszych pakietów kanałów firm trzecich; nowe Plugin powinny importować ogólne ścieżki podrzędne SDK bezpośrednio |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone pomocniki poleceń, hooków, HTTP i interaktywne Plugin |
    | `plugin-sdk/hook-runtime` | Współdzielone pomocniki potoku webhooków i wewnętrznych hooków |
    | `plugin-sdk/lazy-runtime` | Pomocniki leniwego importu i wiązania środowiska wykonawczego, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Pomocniki wykonywania procesów |
    | `plugin-sdk/cli-runtime` | Pomocniki formatowania CLI, oczekiwania, wersji, wywołań argumentów i leniwych grup poleceń |
    | `plugin-sdk/qa-live-transport-scenarios` | Współdzielone identyfikatory scenariuszy QA transportu live, pomocniki pokrycia bazowego i pomocnik wyboru scenariuszy |
    | `plugin-sdk/gateway-method-runtime` | Zarezerwowany pomocnik dispatchu metod Gateway dla tras HTTP Plugin deklarujących `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Klient Gateway, pomocnik uruchamiania klienta gotowego na pętlę zdarzeń, RPC CLI Gateway, błędy protokołu Gateway, rozwiązywanie rozgłaszanego hosta LAN oraz pomocniki łatek statusu kanału |
    | `plugin-sdk/config-contracts` | Skupiona powierzchnia konfiguracji wyłącznie typów dla kształtów konfiguracji Plugin, takich jak `OpenClawConfig`, oraz typów konfiguracji kanału i dostawcy |
    | `plugin-sdk/plugin-config-runtime` | Pomocniki wyszukiwania konfiguracji Plugin w środowisku wykonawczym, takie jak `requireRuntimeConfig`, `resolvePluginConfigObject` i `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Pomocniki transakcyjnej mutacji konfiguracji, takie jak `mutateConfigFile`, `replaceConfigFile` i `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Współdzielone ciągi wskazówek metadanych dostarczania narzędzi wiadomości |
    | `plugin-sdk/runtime-config-snapshot` | Pomocniki migawki konfiguracji bieżącego procesu, takie jak `getRuntimeConfig`, `getRuntimeConfigSnapshot`, oraz settery migawek testowych |
    | `plugin-sdk/telegram-command-config` | Normalizacja nazw i opisów poleceń Telegram oraz kontrole duplikatów i konfliktów, nawet gdy dołączona powierzchnia kontraktu Telegram jest niedostępna |
    | `plugin-sdk/text-autolink-runtime` | Wykrywanie autolinków odwołań do plików bez szerokiego barrela tekstowego |
    | `plugin-sdk/approval-reaction-runtime` | Zakodowane na stałe wiązania reakcji zatwierdzeń, ładunki promptów reakcji, magazyny celów reakcji, pomocniki tekstu wskazówek reakcji oraz eksport zgodności do tłumienia lokalnego natywnego promptu wykonania |
    | `plugin-sdk/approval-runtime` | Pomocniki zatwierdzania exec/Plugin, konstruktory zdolności zatwierdzania, pomocniki uwierzytelniania/profili, pomocniki natywnego routingu/środowiska wykonawczego oraz formatowanie ścieżki strukturalnego wyświetlania zatwierdzeń |
    | `plugin-sdk/reply-runtime` | Współdzielone pomocniki środowiska wykonawczego przychodzących wiadomości/odpowiedzi, dzielenie na fragmenty, dispatch, Heartbeat, planer odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie pomocniki dispatchu/finalizacji odpowiedzi i etykiet konwersacji |
    | `plugin-sdk/reply-history` | Współdzielone pomocniki krótkookienkowej historii odpowiedzi. Nowy kod tur wiadomości powinien używać `createChannelHistoryWindow`; pomocniki map niższego poziomu pozostają tylko przestarzałymi eksportami zgodności |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie pomocniki dzielenia tekstu/Markdown na fragmenty |
    | `plugin-sdk/session-store-runtime` | Pomocniki przepływu pracy sesji (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), ograniczone odczyty tekstu ostatniego transkryptu użytkownika/asystenta według tożsamości sesji, pomocniki ścieżki magazynu starszych sesji/klucza sesji, odczyty updated-at oraz pomocniki zgodności całego magazynu/ścieżki pliku tylko na czas przejścia |
    | `plugin-sdk/session-transcript-runtime` | Tożsamość transkryptu, pomocniki ograniczonego celu/odczytu/zapisu, publikowanie aktualizacji, blokady zapisu i klucze trafień pamięci transkryptu |
    | `plugin-sdk/sqlite-runtime` | Skupione pomocniki schematu agenta SQLite, ścieżki i transakcji dla środowiska wykonawczego first-party |
    | `plugin-sdk/cron-store-runtime` | Pomocniki ścieżki/ładowania/zapisu magazynu Cron |
    | `plugin-sdk/state-paths` | Pomocniki ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Typy kluczowanego stanu SQLite sidecara Plugin oraz scentralizowana konfiguracja pragmy połączenia i utrzymania WAL dla baz danych należących do Plugin |
    | `plugin-sdk/routing` | Pomocniki wiązania trasy/klucza sesji/konta, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone pomocniki podsumowania statusu kanału/konta, wartości domyślne stanu środowiska wykonawczego i pomocniki metadanych zgłoszeń |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone pomocniki rozwiązywania celów |
    | `plugin-sdk/string-normalization-runtime` | Pomocniki normalizacji slugów/ciągów |
    | `plugin-sdk/request-url` | Wyodrębnianie adresów URL w postaci ciągów z wejść podobnych do fetch/request |
    | `plugin-sdk/run-command` | Ograniczony czasowo runner poleceń ze znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Wspólne readery parametrów narzędzi/CLI |
    | `plugin-sdk/tool-plugin` | Definiowanie prostego typowanego Plugin narzędzia agenta i udostępnianie statycznych metadanych do generowania manifestu |
    | `plugin-sdk/tool-payload` | Wyodrębnianie znormalizowanych ładunków z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
    | `plugin-sdk/sandbox` | Typy backendu piaskownicy i pomocniki poleceń SSH/OpenShell, w tym preflight polecenia exec z szybkim niepowodzeniem |
    | `plugin-sdk/temp-path` | Współdzielone pomocniki ścieżek tymczasowych pobrań i prywatne bezpieczne tymczasowe obszary robocze |
    | `plugin-sdk/logging-core` | Pomocniki loggera podsystemu i redakcji |
    | `plugin-sdk/markdown-table-runtime` | Tryb tabel Markdown i pomocniki konwersji |
    | `plugin-sdk/model-session-runtime` | Pomocniki nadpisań modelu/sesji, takie jak `applyModelOverrideToSessionEntry` i `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Pomocniki rozwiązywania konfiguracji dostawcy rozmów |
    | `plugin-sdk/json-store` | Małe pomocniki odczytu/zapisu stanu JSON |
    | `plugin-sdk/json-unsafe-integers` | Pomocniki parsowania JSON zachowujące niebezpieczne literały całkowite jako ciągi |
    | `plugin-sdk/file-lock` | Pomocniki wielokrotnego wchodzenia w blokadę pliku |
    | `plugin-sdk/persistent-dedupe` | Pomocniki cache deduplikacji opartego na dysku |
    | `plugin-sdk/acp-runtime` | Pomocniki środowiska wykonawczego/sesji ACP i dispatchu odpowiedzi |
    | `plugin-sdk/acp-runtime-backend` | Lekkie pomocniki rejestracji backendu ACP i dispatchu odpowiedzi dla Plugin ładowanych podczas startu |
    | `plugin-sdk/acp-binding-resolve-runtime` | Rozwiązywanie wiązań ACP tylko do odczytu bez importów startu cyklu życia |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji środowiska wykonawczego agenta |
    | `plugin-sdk/boolean-param` | Luźny reader parametru logicznego |
    | `plugin-sdk/dangerous-name-runtime` | Pomocniki rozwiązywania dopasowań niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Pomocniki bootstrapu urządzenia i tokenu parowania |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy pomocników kanału pasywnego, statusu i ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Pomocniki odpowiedzi poleceń/dostawcy `/models` |
    | `plugin-sdk/skill-commands-runtime` | Pomocniki listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Pomocniki natywnego rejestru poleceń, budowania i serializacji |
    | `plugin-sdk/agent-harness` | Eksperymentalna powierzchnia zaufanych Plugin dla niskopoziomowych harnessów agentów: typy harnessów, pomocniki sterowania/przerywania aktywnego uruchomienia, pomocniki mostka narzędzi OpenClaw, pomocniki polityki narzędzi planu środowiska wykonawczego, klasyfikacja wyniku terminala, pomocniki formatowania/szczegółów postępu narzędzi oraz narzędzia wyników prób |
    | `plugin-sdk/provider-zai-endpoint` | Przestarzała fasada wykrywania punktów końcowych należąca do dostawcy Z.AI; użyj publicznego API Plugin Z.AI |
    | `plugin-sdk/async-lock-runtime` | Pomocnik lokalnej dla procesu blokady asynchronicznej dla małych plików stanu środowiska wykonawczego |
    | `plugin-sdk/channel-activity-runtime` | Pomocnik telemetrii aktywności kanału |
    | `plugin-sdk/concurrency-runtime` | Pomocnik ograniczonej współbieżności zadań asynchronicznych |
    | `plugin-sdk/dedupe-runtime` | Pomocniki cache deduplikacji w pamięci i opartego na trwałym zapleczu |
    | `plugin-sdk/delivery-queue-runtime` | Pomocnik opróżniania oczekujących dostaw wychodzących |
    | `plugin-sdk/file-access-runtime` | Bezpieczne pomocniki ścieżek plików lokalnych i źródeł mediów |
    | `plugin-sdk/heartbeat-runtime` | Pomocniki wybudzania, zdarzeń i widoczności Heartbeat |
    | `plugin-sdk/number-runtime` | Pomocnik koercji numerycznej |
    | `plugin-sdk/secure-random-runtime` | Pomocniki bezpiecznych tokenów/UUID |
    | `plugin-sdk/system-event-runtime` | Pomocniki kolejki zdarzeń systemowych |
    | `plugin-sdk/transport-ready-runtime` | Pomocnik oczekiwania na gotowość transportu |
    | `plugin-sdk/exec-approvals-runtime` | Pomocniki plików polityki zatwierdzania exec bez szerokiego barrela infra-runtime |
    | `plugin-sdk/infra-runtime` | Przestarzały shim zgodności; użyj skupionych ścieżek podrzędnych środowiska wykonawczego powyżej |
    | `plugin-sdk/collection-runtime` | Małe pomocniki ograniczonego cache |
    | `plugin-sdk/diagnostic-runtime` | Pomocniki flag diagnostycznych, zdarzeń i kontekstu śledzenia |
    | `plugin-sdk/error-runtime` | Graf błędów, formatowanie, współdzielone pomocniki klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Opakowany fetch, proxy, opcja EnvHttpProxyAgent i pomocniki przypiętego lookupu |
    | `plugin-sdk/runtime-fetch` | Świadomy dispatchera fetch środowiska wykonawczego bez importów proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer adresu URL danych obrazu inline i pomocniki wykrywania sygnatur bez szerokiej powierzchni środowiska wykonawczego mediów |
    | `plugin-sdk/response-limit-runtime` | Ograniczony reader treści odpowiedzi bez szerokiej powierzchni środowiska wykonawczego mediów |
    | `plugin-sdk/session-binding-runtime` | Stan wiązania bieżącej konwersacji bez skonfigurowanego routingu wiązań ani magazynów parowania |
    | `plugin-sdk/session-store-runtime` | Pomocniki magazynu sesji bez szerokich importów zapisu/utrzymania konfiguracji |
    | `plugin-sdk/sqlite-runtime` | Skupione pomocniki schematu agenta SQLite, ścieżki i transakcji bez kontroli cyklu życia bazy danych |
    | `plugin-sdk/context-visibility-runtime` | Rozwiązywanie widoczności kontekstu i filtrowanie kontekstu uzupełniającego bez szerokich importów konfiguracji/zabezpieczeń |
    | `plugin-sdk/string-coerce-runtime` | Wąskie pomocniki koercji i normalizacji prymitywnych rekordów/ciągów bez importów markdown/logowania |
    | `plugin-sdk/host-runtime` | Pomocniki normalizacji nazw hostów i hostów SCP |
    | `plugin-sdk/retry-runtime` | Pomocniki konfiguracji ponawiania i runnera ponawiania |
    | `plugin-sdk/agent-runtime` | Pomocniki katalogu agenta/tożsamości/obszaru roboczego, w tym `resolveAgentDir`, `resolveDefaultAgentDir` oraz przestarzały eksport zgodności `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Zapytanie/deduplikacja katalogu opartego na konfiguracji |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Podścieżki funkcji i testowania">
    | Podścieżka | Główne eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Wspólne pomocnicze funkcje pobierania/przekształcania/przechowywania multimediów, w tym `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` oraz przestarzałe `fetchRemoteMedia`; preferuj pomocnicze funkcje magazynu przed odczytami bufora, gdy URL ma stać się multimedium OpenClaw |
    | `plugin-sdk/media-mime` | Wąska normalizacja MIME, mapowanie rozszerzeń plików, wykrywanie MIME i pomocnicze funkcje rodzaju multimediów |
    | `plugin-sdk/media-store` | Wąskie pomocnicze funkcje magazynu multimediów, takie jak `saveMediaBuffer` i `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Wspólne pomocnicze funkcje przełączania awaryjnego generowania multimediów, wybór kandydatów i komunikaty o brakującym modelu |
    | `plugin-sdk/media-understanding` | Typy dostawców rozumienia multimediów oraz eksporty pomocniczych funkcji obrazu/audio/ekstrakcji strukturalnej skierowane do dostawców |
    | `plugin-sdk/text-chunking` | Pomocnicze funkcje dzielenia/renderowania tekstu i markdown, konwersja tabel markdown, usuwanie tagów dyrektyw i narzędzia bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Pomocnicza funkcja dzielenia tekstu wychodzącego |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz eksporty dyrektyw, rejestru, walidacji, konstruktora TTS zgodnego z OpenAI i pomocniczych funkcji mowy skierowane do dostawców |
    | `plugin-sdk/speech-core` | Wspólne typy dostawców mowy, eksporty rejestru, dyrektyw, normalizacji i pomocniczych funkcji mowy |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji w czasie rzeczywistym, pomocnicze funkcje rejestru i wspólna pomocnicza funkcja sesji WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Pomocnicza funkcja inicjalizacji profilu w czasie rzeczywistym do ograniczonego wstrzykiwania kontekstu `IDENTITY.md`, `USER.md` i `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu w czasie rzeczywistym, pomocnicze funkcje rejestru i wspólne pomocnicze funkcje zachowania głosu w czasie rzeczywistym, w tym śledzenie aktywności wyjścia |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów oraz pomocnicze funkcje zasobów obrazu/adresów URL danych i konstruktor dostawcy obrazów zgodny z OpenAI |
    | `plugin-sdk/image-generation-core` | Wspólne typy generowania obrazów, przełączanie awaryjne, uwierzytelnianie i pomocnicze funkcje rejestru |
    | `plugin-sdk/music-generation` | Typy dostawców/żądań/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Wspólne typy generowania muzyki, pomocnicze funkcje przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie odwołań do modeli |
    | `plugin-sdk/video-generation` | Typy dostawców/żądań/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Wspólne typy generowania wideo, pomocnicze funkcje przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie odwołań do modeli |
    | `plugin-sdk/transcripts` | Wspólne typy dostawców źródeł transkrypcji, pomocnicze funkcje rejestru, deskryptory sesji i metadane wypowiedzi |
    | `plugin-sdk/webhook-targets` | Rejestr celów Webhook i pomocnicze funkcje instalowania tras |
    | `plugin-sdk/webhook-path` | Przestarzały alias zgodności; użyj `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Wspólne pomocnicze funkcje ładowania multimediów zdalnych/lokalnych |
    | `plugin-sdk/zod` | Przestarzały ponowny eksport zgodności; importuj `zod` bezpośrednio z `zod` |
    | `plugin-sdk/testing` | Repozytoryjna lokalna przestarzała beczka zgodności dla starszych testów OpenClaw. Nowe testy repozytorium powinny zamiast tego importować ukierunkowane lokalne podścieżki testowe, takie jak `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` lub `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Repozytoryjna lokalna minimalna pomocnicza funkcja `createTestPluginApi` do bezpośrednich testów jednostkowych rejestracji pluginów bez importowania mostków pomocniczych testów repozytorium |
    | `plugin-sdk/agent-runtime-test-contracts` | Repozytoryjne lokalne natywne fikstury kontraktów adaptera agent-runtime dla testów uwierzytelniania, dostarczania, fallbacku, haka narzędzi, nakładki promptu, schematu i projekcji transkrypcji |
    | `plugin-sdk/channel-test-helpers` | Repozytoryjne lokalne pomocnicze funkcje testowe zorientowane na kanały dla ogólnych kontraktów akcji/konfiguracji/statusu, asercji katalogów, cyklu życia uruchamiania konta, wątkowania konfiguracji wysyłania, atrap runtime, problemów statusu, dostarczania wychodzącego i rejestracji haków |
    | `plugin-sdk/channel-target-testing` | Repozytoryjny lokalny wspólny zestaw przypadków błędów rozwiązywania celów dla testów kanałów |
    | `plugin-sdk/plugin-test-contracts` | Repozytoryjne lokalne pomocnicze funkcje kontraktów pakietu pluginu, rejestracji, publicznego artefaktu, bezpośredniego importu, API runtime i efektów ubocznych importu |
    | `plugin-sdk/provider-test-contracts` | Repozytoryjne lokalne pomocnicze funkcje kontraktów runtime dostawcy, uwierzytelniania, odkrywania, onboardingu, katalogu, kreatora, funkcji multimedialnych, zasad odtwarzania, STT audio na żywo w czasie rzeczywistym, wyszukiwania/pobierania w sieci i strumienia |
    | `plugin-sdk/provider-http-test-mocks` | Repozytoryjne lokalne opcjonalne atrapy HTTP/uwierzytelniania Vitest dla testów dostawców, które ćwiczą `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Repozytoryjne lokalne ogólne fikstury przechwytywania runtime CLI, kontekstu piaskownicy, autora Skills, komunikatów agenta, zdarzeń systemowych, przeładowania modułów, ścieżki dołączonego pluginu, tekstu terminala, dzielenia tekstu, tokenu uwierzytelniania i typowanych przypadków |
    | `plugin-sdk/test-node-mocks` | Repozytoryjne lokalne ukierunkowane pomocnicze atrapy wbudowanych modułów Node do użycia wewnątrz fabryk Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Podścieżki pamięci">
    | Podścieżka | Główne eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Dołączona powierzchnia pomocnicza memory-core dla pomocniczych funkcji menedżera/konfiguracji/pliku/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime indeksu/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-embedding-registry` | Lekkie pomocnicze funkcje rejestru dostawców osadzania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika podstaw hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrakty osadzania hosta pamięci, dostęp do rejestru, lokalny dostawca i ogólne pomocnicze funkcje wsadowe/zdalne. `registerMemoryEmbeddingProvider` na tej powierzchni jest przestarzałe; dla nowych dostawców używaj ogólnego API dostawcy osadzania. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika magazynu hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Pomocnicze funkcje multimodalne hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Pomocnicze funkcje zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Pomocnicze funkcje sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Przestarzały alias zgodności; użyj `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Pomocnicze funkcje statusu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Pomocnicze funkcje runtime CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Pomocnicze funkcje głównego runtime hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Pomocnicze funkcje plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny względem dostawcy alias dla pomocniczych funkcji głównego runtime hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny względem dostawcy alias dla pomocniczych funkcji dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Przestarzały alias zgodności; użyj `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Wspólne pomocnicze funkcje zarządzanego markdown dla pluginów powiązanych z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada runtime aktywnej pamięci dla dostępu do menedżera wyszukiwania |
    | `plugin-sdk/memory-host-status` | Przestarzały alias zgodności; użyj `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Zarezerwowane podścieżki dołączonych funkcji pomocniczych">
    Zarezerwowane podścieżki SDK dołączonych funkcji pomocniczych to wąskie, właścicielskie powierzchnie dla
    kodu dołączonych pluginów. Są śledzone w inwentarzu SDK, aby kompilacje
    pakietów i aliasowanie pozostawały deterministyczne, ale nie są ogólnymi API
    do tworzenia pluginów. Nowe kontrakty hosta wielokrotnego użytku powinny używać ogólnych podścieżek SDK,
    takich jak `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` i
    `plugin-sdk/plugin-config-runtime`.

    | Podścieżka | Właściciel i przeznaczenie |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Pomocnicza funkcja dołączonego pluginu Codex do projekcji konfiguracji serwera MCP użytkownika do konfiguracji wątku serwera aplikacji Codex |
    | `plugin-sdk/codex-native-task-runtime` | Pomocnicza funkcja dołączonego pluginu Codex do odzwierciedlania natywnych subagentów serwera aplikacji Codex w stanie zadania OpenClaw |

  </Accordion>
</AccordionGroup>

## Powiązane

- [Omówienie SDK Plugin](/pl/plugins/sdk-overview)
- [Konfiguracja SDK Plugin](/pl/plugins/sdk-setup)
- [Budowanie pluginów](/pl/plugins/building-plugins)
