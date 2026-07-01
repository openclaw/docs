---
read_when:
    - Wybór właściwej podścieżki plugin-sdk dla importu Plugin
    - Audytowanie podścieżek wbudowanych Pluginów i powierzchni pomocniczych
summary: 'Katalog podścieżek Plugin SDK: które importy znajdują się gdzie, pogrupowane według obszaru'
title: Podścieżki Plugin SDK
x-i18n:
    generated_at: "2026-07-01T13:25:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 589b5581626e50ddb5056ff2aaa60a0af48b92e09c0ca5aa22e2dbf2aed736db
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Zestaw SDK Plugin jest udostępniany jako zbiór wąskich publicznych podścieżek w
`openclaw/plugin-sdk/`. Ta strona kataloguje często używane podścieżki pogrupowane według
przeznaczenia. Wygenerowany inwentarz punktów wejścia kompilatora znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`; eksporty pakietu są publicznym podzbiorem
po odjęciu repozytoryjnych podścieżek testowych/wewnętrznych wymienionych w
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Maintainerzy mogą audytować
liczbę publicznych eksportów za pomocą `pnpm plugin-sdk:surface` oraz aktywne zarezerwowane
podścieżki pomocnicze za pomocą `pnpm plugins:boundary-report:summary`; nieużywane zarezerwowane
eksporty pomocnicze powodują błąd raportu CI zamiast pozostawać w publicznym SDK jako
uśpiony dług zgodności.

Przewodnik po tworzeniu Plugin znajdziesz w [Przegląd SDK Plugin](/pl/plugins/sdk-overview).

## Punkt wejścia Plugin

| Podścieżka                     | Kluczowe eksporty                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Pomocnicze elementy dostawcy migracji, takie jak `createMigrationItem`, stałe powodów, znaczniki statusu elementów, pomocnicy redakcji oraz `summarizeMigrationItems`   |
| `plugin-sdk/migration-runtime` | Pomocnicy migracji środowiska uruchomieniowego, tacy jak `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` oraz `writeMigrationReport`                       |
| `plugin-sdk/health`            | Rejestracja, wykrywanie, naprawa, wybór, ważność i typy wyników kontroli kondycji doctor dla dołączonych konsumentów kondycji                                         |

### Przestarzała zgodność i pomocnicy testowi

Przestarzałe podścieżki pozostają eksportowane dla starszych Plugin, ale nowy kod powinien używać
wyspecjalizowanych podścieżek SDK poniżej. Utrzymywana lista to
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI odrzuca dołączone
importy produkcyjne z tej listy. Szerokie barrele, takie jak `compat`, `config-types`,
`infra-runtime`, `text-runtime` i `zod`, służą wyłącznie zgodności. Importuj `zod`
bezpośrednio z `zod`.

Podścieżki pomocników testowych OpenClaw oparte na Vitest są wyłącznie lokalne dla repozytorium i nie są już
eksportami pakietu: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` oraz `testing`.

### Zarezerwowane podścieżki pomocnicze dołączonych Plugin

Te podścieżki są powierzchniami zgodności należącymi do Plugin dla ich właścicielskiego dołączonego
Plugin, a nie ogólnymi API SDK: `plugin-sdk/codex-mcp-projection` oraz
`plugin-sdk/codex-native-task-runtime`. Importy rozszerzeń między właścicielami są blokowane
przez zabezpieczenia kontraktu pakietu.

  <AccordionGroup>
  <Accordion title="Podścieżki kanałów">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Buforowany helper walidacji JSON Schema dla schematów należących do pluginu |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone helpery kreatora konfiguracji, translator konfiguracji, monity listy dozwolonych, konstruktory statusu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Przestarzały alias zgodności; użyj `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpery konfiguracji wielu kont / bramki akcji, helpery fallbacku konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpery normalizacji identyfikatora konta |
    | `plugin-sdk/account-resolution` | Helpery wyszukiwania konta + fallbacku domyślnego |
    | `plugin-sdk/account-helpers` | Wąskie helpery listy kont / akcji konta |
    | `plugin-sdk/access-groups` | Helpery parsowania list dozwolonych grup dostępu i zredagowanej diagnostyki grup |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Współdzielone prymitywy schematu konfiguracji kanału oraz konstruktory Zod i bezpośrednie JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Dołączone schematy konfiguracji kanałów OpenClaw wyłącznie dla utrzymywanych dołączonych pluginów |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Kanoniczne identyfikatory dołączonych/oficjalnych kanałów czatu oraz etykiety/aliasy formatera dla pluginów, które muszą rozpoznawać tekst z prefiksem koperty bez kodowania własnej tabeli na stałe. |
    | `plugin-sdk/channel-config-schema-legacy` | Przestarzały alias zgodności dla dołączonych schematów konfiguracji kanałów |
    | `plugin-sdk/telegram-command-config` | Helpery normalizacji/walidacji własnych poleceń Telegram z fallbackiem kontraktu dołączonego |
    | `plugin-sdk/command-gating` | Wąskie helpery bramki autoryzacji poleceń |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Przestarzała niskopoziomowa fasada zgodności wejścia kanału. Nowe ścieżki odbioru powinny używać `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Eksperymentalny wysokopoziomowy resolver środowiska wykonawczego wejścia kanału i konstruktory faktów tras dla zmigrowanych ścieżek odbioru kanału. Preferuj to zamiast składania efektywnych list dozwolonych, list dozwolonych poleceń i projekcji legacy w każdym pluginie. Zobacz [API wejścia kanału](/pl/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Kontrakty cyklu życia wiadomości oraz opcje potoku odpowiedzi, potwierdzenia, podgląd/streaming na żywo, helpery cyklu życia, tożsamość wychodząca, planowanie ładunku, trwałe wysyłki i helpery kontekstu wysyłania wiadomości. Zobacz [API wyjścia kanału](/pl/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Przestarzały alias zgodności dla `plugin-sdk/channel-outbound` oraz fasady legacy wysyłania odpowiedzi. |
    | `plugin-sdk/channel-message-runtime` | Przestarzały alias zgodności dla `plugin-sdk/channel-outbound` oraz fasady legacy wysyłania odpowiedzi. |
    | `plugin-sdk/inbound-envelope` | Współdzielone helpery trasy wejściowej + konstruktora koperty |
    | `plugin-sdk/inbound-reply-dispatch` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-inbound` dla runnerów wejściowych i predykatów dispatch, a `plugin-sdk/channel-outbound` dla helperów dostarczania wiadomości. |
    | `plugin-sdk/messaging-targets` | Przestarzały alias parsowania celów; użyj `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Współdzielone helpery ładowania mediów wychodzących i stanu hostowanych mediów |
    | `plugin-sdk/outbound-send-deps` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Wąskie helpery normalizacji ankiet |
    | `plugin-sdk/thread-bindings-runtime` | Helpery cyklu życia powiązania wątku i adaptera |
    | `plugin-sdk/agent-media-payload` | Konstruktor ładunku mediów agenta legacy |
    | `plugin-sdk/conversation-runtime` | Helpery powiązania konwersacji/wątku, parowania i skonfigurowanego powiązania |
    | `plugin-sdk/runtime-config-snapshot` | Helper migawki konfiguracji środowiska wykonawczego |
    | `plugin-sdk/runtime-group-policy` | Helpery rozstrzygania zasad grup w środowisku wykonawczym |
    | `plugin-sdk/channel-status` | Współdzielone helpery migawki/podsumowania statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Helpery autoryzacji zapisu konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty wstępu pluginu kanału |
    | `plugin-sdk/allowlist-config-edit` | Helpery edycji/odczytu konfiguracji listy dozwolonych |
    | `plugin-sdk/group-access` | Współdzielone helpery decyzji dostępu grupowego |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Przestarzałe fasady zgodności. Użyj `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Wąskie helpery zasad strażnika direct-DM przed kryptografią |
    | `plugin-sdk/discord` | Przestarzała fasada zgodności Discord dla opublikowanego `@openclaw/discord@2026.3.13` i śledzonej zgodności właściciela; nowe pluginy powinny używać ogólnych podścieżek SDK kanałów |
    | `plugin-sdk/telegram-account` | Przestarzała fasada zgodności rozstrzygania kont Telegram dla śledzonej zgodności właściciela; nowe pluginy powinny używać wstrzykiwanych helperów środowiska wykonawczego lub ogólnych podścieżek SDK kanałów |
    | `plugin-sdk/zalouser` | Przestarzała fasada zgodności Zalo Personal dla opublikowanych pakietów Lark/Zalo, które nadal importują autoryzację poleceń nadawcy; nowe pluginy powinny używać `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Semantyczna prezentacja i dostarczanie wiadomości oraz helpery interaktywnych odpowiedzi legacy. Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Współdzielone helpery wejściowe do klasyfikacji zdarzeń, budowania kontekstu, formatowania, korzeni, debounce, dopasowywania wzmianek, zasad wzmianek i logowania wejściowego |
    | `plugin-sdk/channel-inbound-debounce` | Wąskie helpery debounce wejścia |
    | `plugin-sdk/channel-mention-gating` | Wąskie helpery zasad wzmianek, znacznika wzmianki i tekstu wzmianki bez szerszej powierzchni środowiska wykonawczego wejścia |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Przestarzałe fasady zgodności. Użyj `plugin-sdk/channel-inbound` lub `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | Helpery akcji wiadomości kanału oraz przestarzałe helpery natywnego schematu zachowane dla zgodności pluginów |
    | `plugin-sdk/channel-route` | Współdzielone helpery normalizacji tras, rozstrzygania celu sterowanego parserem, zamiany identyfikatora wątku na ciąg znaków, kluczy tras deduplikacji/kompaktowych, typów sparsowanych celów oraz porównywania tras/celów |
    | `plugin-sdk/channel-targets` | Helpery parsowania celów; wywołujący porównanie tras powinni używać `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Typy kontraktu kanału |
    | `plugin-sdk/channel-feedback` | Okablowanie informacji zwrotnej/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, oraz typy celów sekretów |
  </Accordion>

Przestarzałe rodziny helperów kanałów pozostają dostępne wyłącznie dla zgodności opublikowanych pluginów. Plan usunięcia jest następujący: zachować je przez okres migracji zewnętrznych pluginów, utrzymać pluginy repozytorium/wbudowane na `channel-inbound` i `channel-outbound`, a następnie usunąć podścieżki zgodności podczas kolejnego większego porządkowania SDK. Dotyczy to starych rodzin komunikatów/runtime kanału, strumieniowania kanału, bezpośredniego dostępu do DM, odłamanej rodziny helperów przychodzących, opcji odpowiedzi oraz ścieżki parowania.

  <Accordion title="Ścieżki podrzędne dostawcy">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Obsługiwana fasada dostawcy LM Studio do konfiguracji, wykrywania katalogu i przygotowywania modeli w czasie działania |
    | `plugin-sdk/lmstudio-runtime` | Obsługiwana fasada środowiska uruchomieniowego LM Studio dla domyślnych ustawień serwera lokalnego, wykrywania modeli, nagłówków żądań i pomocników załadowanych modeli |
    | `plugin-sdk/provider-setup` | Wyselekcjonowani pomocnicy konfiguracji lokalnych/samodzielnie hostowanych dostawców |
    | `plugin-sdk/self-hosted-provider-setup` | Wyspecjalizowani pomocnicy konfiguracji samodzielnie hostowanych dostawców zgodnych z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia zaplecza CLI + stałe watchdog |
    | `plugin-sdk/provider-auth-runtime` | Pomocnicy rozpoznawania kluczy API w czasie działania dla Pluginów dostawców |
    | `plugin-sdk/provider-oauth-runtime` | Ogólne typy wywołań zwrotnych OAuth dostawcy, renderowanie strony wywołania zwrotnego, pomocnicy PKCE/stanu, parsowanie danych wejściowych autoryzacji, pomocnicy wygasania tokenów i pomocnicy przerywania |
    | `plugin-sdk/provider-auth-api-key` | Pomocnicy onboardingu klucza API/zapisu profilu, tacy jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy konstruktor wyniku uwierzytelniania OAuth |
    | `plugin-sdk/provider-env-vars` | Pomocnicy wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, pomocnicy importu uwierzytelniania OpenAI Codex, przestarzały eksport zgodności `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory zasad powtórek, pomocnicy punktów końcowych dostawcy i współdzieleni pomocnicy normalizacji identyfikatorów modeli |
    | `plugin-sdk/provider-catalog-live-runtime` | Pomocnicy katalogu modeli dostawcy na żywo dla chronionego wykrywania w stylu `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrowanie identyfikatorów modeli, pamięć podręczna TTL i statyczny mechanizm awaryjny |
    | `plugin-sdk/provider-catalog-runtime` | Hak środowiska uruchomieniowego rozszerzania katalogu dostawcy i styki rejestru Pluginów dostawców na potrzeby testów kontraktowych |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ogólni pomocnicy możliwości HTTP/punktów końcowych dostawcy, błędy HTTP dostawcy i pomocnicy formularza multipart do transkrypcji audio |
    | `plugin-sdk/provider-web-fetch-contract` | Wąscy pomocnicy kontraktu konfiguracji/wyboru web-fetch, tacy jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Pomocnicy rejestracji/pamięci podręcznej dostawcy web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Wąscy pomocnicy konfiguracji/danych uwierzytelniających web-search dla dostawców, którzy nie potrzebują okablowania włączania Pluginu |
    | `plugin-sdk/provider-web-search-contract` | Wąscy pomocnicy kontraktu konfiguracji/danych uwierzytelniających web-search, tacy jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz ograniczone zakresem settery/gettery danych uwierzytelniających |
    | `plugin-sdk/provider-web-search` | Pomocnicy rejestracji/pamięci podręcznej/środowiska uruchomieniowego dostawcy web-search |
    | `plugin-sdk/embedding-providers` | Ogólne typy dostawców osadzeń i pomocnicy odczytu, w tym `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` i `listEmbeddingProviders(...)`; Pluginy rejestrują dostawców przez `api.registerEmbeddingProvider(...)`, aby wymusić własność manifestu |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` oraz czyszczenie schematów i diagnostyka DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Typy migawek użycia dostawcy, współdzieleni pomocnicy pobierania użycia oraz pobieracze dostawców, takie jak `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni, zgodność wywołań narzędzi w zwykłym tekście oraz współdzieleni pomocnicy wrapperów Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Publiczni współdzieleni pomocnicy wrapperów strumieni dostawców, w tym `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` oraz narzędzia strumieniowe zgodne z Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Pomocnicy natywnego transportu dostawcy, tacy jak chronione pobieranie, wyodrębnianie tekstu wyników narzędzi, transformacje komunikatów transportu i zapisywalne strumienie zdarzeń transportu |
    | `plugin-sdk/provider-onboard` | Pomocnicy łatania konfiguracji onboardingu |
    | `plugin-sdk/global-singleton` | Pomocnicy singletonów/map/pamięci podręcznej lokalnych dla procesu |
    | `plugin-sdk/group-activation` | Wąscy pomocnicy trybu aktywacji grupy i parsowania poleceń |
  </Accordion>

Migawki użycia dostawcy zwykle raportują co najmniej jedno `windows` limitu, każde z
etykietą, procentem użycia i opcjonalnym czasem resetu. Dostawcy, którzy zamiast
resetowalnych okien limitu ujawniają saldo lub tekst stanu konta, powinni zwracać
`summary` z pustą tablicą `windows` zamiast fabrykować wartości procentowe.
OpenClaw wyświetla ten tekst podsumowania w danych wyjściowych statusu; używaj
`error` tylko wtedy, gdy punkt końcowy użycia zakończył się niepowodzeniem albo nie
zwrócił żadnych użytecznych danych użycia.

  <Accordion title="Ścieżki podrzędne uwierzytelniania i zabezpieczeń">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, pomocnicy rejestru poleceń, w tym dynamiczne formatowanie menu argumentów, pomocnicy autoryzacji nadawcy |
    | `plugin-sdk/command-status` | Konstruktory komunikatów poleceń/pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Pomocnicy rozpoznawania zatwierdzającego i uwierzytelniania akcji w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Pomocnicy natywnych profili/filtrów zatwierdzania exec |
    | `plugin-sdk/approval-delivery-runtime` | Natywne adaptery możliwości/dostarczania zatwierdzeń |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony pomocnik rozpoznawania Gateway zatwierdzeń |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie pomocniki ładowania natywnych adapterów zatwierdzeń dla gorących punktów wejścia kanałów |
    | `plugin-sdk/approval-handler-runtime` | Szersze pomocniki środowiska uruchomieniowego obsługi zatwierdzeń; preferuj węższe styki adaptera/Gateway, gdy wystarczają |
    | `plugin-sdk/approval-native-runtime` | Pomocnicy natywnego celu zatwierdzania, powiązania konta, bramki routingu, awaryjnego przekazywania i tłumienia lokalnych natywnych monitów exec |
    | `plugin-sdk/approval-reaction-runtime` | Zakodowane na stałe powiązania reakcji zatwierdzania, ładunki monitów reakcji, magazyny celów reakcji i eksport zgodności dla tłumienia lokalnych natywnych monitów exec |
    | `plugin-sdk/approval-reply-runtime` | Pomocnicy ładunków odpowiedzi zatwierdzeń exec/Pluginu |
    | `plugin-sdk/approval-runtime` | Pomocnicy ładunków zatwierdzeń exec/Pluginu, pomocnicy routingu/środowiska uruchomieniowego natywnych zatwierdzeń oraz pomocnicy uporządkowanego wyświetlania zatwierdzeń, tacy jak `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Wąscy pomocnicy resetowania deduplikacji odpowiedzi przychodzących |
    | `plugin-sdk/channel-contract-testing` | Wąscy pomocnicy testów kontraktu kanału bez szerokiej beczki testowej |
    | `plugin-sdk/command-auth-native` | Natywne uwierzytelnianie poleceń, dynamiczne formatowanie menu argumentów i natywni pomocnicy celów sesji |
    | `plugin-sdk/command-detection` | Współdzieleni pomocnicy wykrywania poleceń |
    | `plugin-sdk/command-primitives-runtime` | Lekkie predykaty tekstu poleceń dla gorących ścieżek kanałów |
    | `plugin-sdk/command-surface` | Normalizacja treści polecenia i pomocnicy powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąscy pomocnicy zbierania kontraktów sekretów dla powierzchni sekretów kanału/Pluginu |
    | `plugin-sdk/secret-ref-runtime` | Wąscy pomocnicy typowania `coerceSecretRef` i SecretRef do parsowania kontraktów sekretów/konfiguracji |
    | `plugin-sdk/secret-provider-integration` | Manifest integracji dostawcy SecretRef wyłącznie typowy i kontrakty presetów dla Pluginów publikujących zewnętrzne presety dostawców sekretów |
    | `plugin-sdk/security-runtime` | Współdzieleni pomocnicy zaufania, bramkowania DM, plików/ścieżek ograniczonych do katalogu głównego, w tym zapisy tylko przy tworzeniu, synchroniczna/asynchroniczna atomowa zamiana plików, zapisy tymczasowe w katalogu równorzędnym, awaryjne przenoszenie między urządzeniami, pomocnicy prywatnego magazynu plików, strażnicy nadrzędnych katalogów symlinków, treść zewnętrzna, redakcja tekstu wrażliwego, porównywanie sekretów w stałym czasie i pomocnicy zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Pomocnicy listy dozwolonych hostów i zasad SSRF dla sieci prywatnych |
    | `plugin-sdk/ssrf-dispatcher` | Wąscy pomocnicy przypiętego dispatchera bez szerokiej powierzchni środowiska uruchomieniowego infrastruktury |
    | `plugin-sdk/ssrf-runtime` | Przypięty dispatcher, pobieranie chronione przed SSRF, błąd SSRF i pomocnicy zasad SSRF |
    | `plugin-sdk/secret-input` | Pomocnicy parsowania danych wejściowych sekretów |
    | `plugin-sdk/webhook-ingress` | Pomocnicy żądań/celów Webhook oraz wymuszania surowego websocket/treści |
    | `plugin-sdk/webhook-request-guards` | Pomocnicy rozmiaru treści żądania/limitu czasu |
  </Accordion>

  <Accordion title="Podścieżki środowiska wykonawczego i magazynu">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie pomocniki środowiska wykonawczego, logowania, kopii zapasowych i instalacji pluginów |
    | `plugin-sdk/runtime-env` | Wąskie pomocniki środowiska wykonawczego: środowisko, logger, limit czasu, ponawianie i backoff |
    | `plugin-sdk/browser-config` | Obsługiwana fasada konfiguracji przeglądarki dla znormalizowanego profilu/wartości domyślnych, parsowania adresu URL CDP i pomocników uwierzytelniania sterowania przeglądarką |
    | `plugin-sdk/agent-harness-task-runtime` | Ogólne pomocniki cyklu życia zadań i dostarczania ukończenia dla agentów opartych na harnessie, używających zakresu zadania wydanego przez host |
    | `plugin-sdk/codex-mcp-projection` | Zarezerwowany, dołączany pomocnik Codex do rzutowania konfiguracji serwera MCP użytkownika na konfigurację wątku Codex; nie dla pluginów innych firm |
    | `plugin-sdk/codex-native-task-runtime` | Prywatny, dołączany pomocnik Codex do natywnego okablowania lustra zadania/środowiska wykonawczego; nie dla pluginów innych firm |
    | `plugin-sdk/channel-runtime-context` | Ogólne pomocniki rejestracji i wyszukiwania kontekstu środowiska wykonawczego kanału |
    | `plugin-sdk/matrix` | Przestarzała fasada zgodności Matrix dla starszych pakietów kanałów innych firm; nowe pluginy powinny importować bezpośrednio `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Przestarzała fasada zgodności Mattermost dla starszych pakietów kanałów innych firm; nowe pluginy powinny importować bezpośrednio ogólne podścieżki SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Wspólne pomocniki poleceń, hooków, HTTP i interaktywne dla pluginów |
    | `plugin-sdk/hook-runtime` | Wspólne pomocniki potoku Webhook/wewnętrznych hooków |
    | `plugin-sdk/lazy-runtime` | Pomocniki leniwego importu/powiązania środowiska wykonawczego, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Pomocniki wykonywania procesów |
    | `plugin-sdk/cli-runtime` | Pomocniki formatowania CLI, oczekiwania, wersji, wywołań argumentów i leniwych grup poleceń |
    | `plugin-sdk/qa-live-transport-scenarios` | Wspólne identyfikatory scenariuszy QA transportu live, pomocniki pokrycia bazowego i pomocnik wyboru scenariusza |
    | `plugin-sdk/gateway-method-runtime` | Zarezerwowany pomocnik dispatchu metod Gateway dla tras HTTP pluginów deklarujących `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Klient Gateway, pomocnik uruchamiania klienta gotowego na pętlę zdarzeń, RPC CLI Gateway, błędy protokołu Gateway, rozwiązywanie rozgłaszanego hosta LAN i pomocniki poprawek statusu kanału |
    | `plugin-sdk/config-contracts` | Skupiona, wyłącznie typowa powierzchnia konfiguracji dla kształtów konfiguracji pluginów, takich jak `OpenClawConfig` oraz typy konfiguracji kanału/dostawcy |
    | `plugin-sdk/plugin-config-runtime` | Pomocniki wyszukiwania konfiguracji pluginu w środowisku wykonawczym, takie jak `requireRuntimeConfig`, `resolvePluginConfigObject` i `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transakcyjne pomocniki mutacji konfiguracji, takie jak `mutateConfigFile`, `replaceConfigFile` i `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Wspólne ciągi podpowiedzi metadanych dostarczania narzędzi wiadomości |
    | `plugin-sdk/runtime-config-snapshot` | Pomocniki bieżącej migawki konfiguracji procesu, takie jak `getRuntimeConfig`, `getRuntimeConfigSnapshot` i settery migawek testowych |
    | `plugin-sdk/telegram-command-config` | Normalizacja nazw/opisów poleceń Telegram oraz sprawdzanie duplikatów/konfliktów, nawet gdy dołączana powierzchnia kontraktu Telegram jest niedostępna |
    | `plugin-sdk/text-autolink-runtime` | Wykrywanie autolinków odniesień do plików bez szerokiego modułu zbiorczego tekstu |
    | `plugin-sdk/approval-reaction-runtime` | Zakodowane na stałe powiązania reakcji zatwierdzania, ładunki monitów reakcji, magazyny celów reakcji i eksport zgodności dla lokalnego tłumienia natywnego monitu exec |
    | `plugin-sdk/approval-runtime` | Pomocniki zatwierdzania exec/pluginów, konstruktory możliwości zatwierdzania, pomocniki auth/profili, pomocniki natywnego routingu/środowiska wykonawczego oraz formatowanie ścieżek wyświetlania uporządkowanych zatwierdzeń |
    | `plugin-sdk/reply-runtime` | Wspólne pomocniki środowiska wykonawczego przychodzących wiadomości/odpowiedzi, dzielenie na fragmenty, dispatch, Heartbeat, planer odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie pomocniki dispatchu/finalizacji odpowiedzi i etykiet konwersacji |
    | `plugin-sdk/reply-history` | Wspólne pomocniki historii odpowiedzi w krótkim oknie. Nowy kod tur wiadomości powinien używać `createChannelHistoryWindow`; pomocniki map niższego poziomu pozostają wyłącznie przestarzałymi eksportami zgodności |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie pomocniki dzielenia tekstu/Markdown na fragmenty |
    | `plugin-sdk/session-store-runtime` | Pomocniki przepływu pracy sesji (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), ograniczone odczyty ostatniego tekstu transkryptu użytkownika/asystenta według tożsamości sesji, pomocniki starszej ścieżki magazynu sesji/klucza sesji, odczyty updated-at oraz przejściowe pomocniki zgodności całego magazynu/ścieżki pliku |
    | `plugin-sdk/session-transcript-runtime` | Tożsamość transkryptu, pomocniki zakresowego celu/odczytu/zapisu, publikowanie aktualizacji, blokady zapisu i klucze trafień pamięci transkryptu |
    | `plugin-sdk/sqlite-runtime` | Skupione pomocniki schematu agenta SQLite, ścieżek i transakcji dla środowiska wykonawczego first-party |
    | `plugin-sdk/cron-store-runtime` | Pomocniki ścieżki/ładowania/zapisu magazynu Cron |
    | `plugin-sdk/state-paths` | Pomocniki ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Typy kluczowanego stanu bocznego SQLite pluginów oraz scentralizowana konfiguracja pragmy połączenia i konserwacji WAL dla baz danych należących do pluginów |
    | `plugin-sdk/routing` | Pomocniki tras/kluczy sesji/powiązań kont, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Wspólne pomocniki podsumowania statusu kanału/konta, wartości domyślne stanu środowiska wykonawczego i pomocniki metadanych zgłoszeń |
    | `plugin-sdk/target-resolver-runtime` | Wspólne pomocniki resolvera celu |
    | `plugin-sdk/string-normalization-runtime` | Pomocniki normalizacji slugów/ciągów |
    | `plugin-sdk/request-url` | Wyodrębnianie adresów URL jako ciągów z wejść podobnych do fetch/request |
    | `plugin-sdk/run-command` | Runner poleceń z limitem czasu i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Wspólne czytniki parametrów narzędzi/CLI |
    | `plugin-sdk/tool-plugin` | Definiowanie prostego typowanego pluginu narzędzia agenta i udostępnianie statycznych metadanych do generowania manifestu |
    | `plugin-sdk/tool-payload` | Wyodrębnianie znormalizowanych ładunków z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
    | `plugin-sdk/sandbox` | Typy backendu sandboxa i pomocniki poleceń SSH/OpenShell, w tym preflight polecenia exec z szybkim niepowodzeniem |
    | `plugin-sdk/temp-path` | Wspólne pomocniki ścieżek tymczasowych pobrań i prywatne bezpieczne tymczasowe obszary robocze |
    | `plugin-sdk/logging-core` | Logger podsystemu i pomocniki redakcji |
    | `plugin-sdk/markdown-table-runtime` | Pomocniki trybu tabel Markdown i konwersji |
    | `plugin-sdk/model-session-runtime` | Pomocniki nadpisań modelu/sesji, takie jak `applyModelOverrideToSessionEntry` i `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Pomocniki rozwiązywania konfiguracji dostawcy rozmowy |
    | `plugin-sdk/json-store` | Małe pomocniki odczytu/zapisu stanu JSON |
    | `plugin-sdk/json-unsafe-integers` | Pomocniki parsowania JSON, które zachowują niebezpieczne literały liczb całkowitych jako ciągi |
    | `plugin-sdk/file-lock` | Pomocniki reentrant file-lock |
    | `plugin-sdk/persistent-dedupe` | Pomocniki cache deduplikacji opartego na dysku |
    | `plugin-sdk/acp-runtime` | Pomocniki środowiska wykonawczego/sesji ACP i dispatchu odpowiedzi |
    | `plugin-sdk/acp-runtime-backend` | Lekkie pomocniki rejestracji backendu ACP i dispatchu odpowiedzi dla pluginów ładowanych przy starcie |
    | `plugin-sdk/acp-binding-resolve-runtime` | Tylko do odczytu rozwiązywanie powiązań ACP bez importów uruchamiania cyklu życia |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji środowiska wykonawczego agenta |
    | `plugin-sdk/boolean-param` | Luźny czytnik parametrów boolean |
    | `plugin-sdk/dangerous-name-runtime` | Pomocniki rozwiązywania dopasowań niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Pomocniki bootstrapu urządzenia i tokenów parowania |
    | `plugin-sdk/extension-shared` | Wspólne prymitywy pomocnicze kanału pasywnego, statusu i ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Pomocniki odpowiedzi polecenia/dostawcy `/models` |
    | `plugin-sdk/skill-commands-runtime` | Pomocniki listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Pomocniki rejestru/budowania/serializacji poleceń natywnych |
    | `plugin-sdk/agent-harness` | Eksperymentalna powierzchnia zaufanego pluginu dla niskopoziomowych harnessów agentów: typy harnessu, pomocniki sterowania/przerywania aktywnego uruchomienia, pomocniki mostu narzędzi OpenClaw, pomocniki polityki narzędzi planu środowiska wykonawczego, klasyfikacja wyniku terminalowego, pomocniki formatowania/szczegółów postępu narzędzi oraz narzędzia wyników prób |
    | `plugin-sdk/provider-zai-endpoint` | Przestarzała fasada wykrywania endpointu należąca do dostawcy Z.AI; użyj publicznego API pluginu Z.AI |
    | `plugin-sdk/async-lock-runtime` | Pomocnik asynchronicznej blokady lokalnej dla procesu dla małych plików stanu środowiska wykonawczego |
    | `plugin-sdk/channel-activity-runtime` | Pomocnik telemetrii aktywności kanału |
    | `plugin-sdk/concurrency-runtime` | Pomocnik ograniczonej współbieżności zadań asynchronicznych |
    | `plugin-sdk/dedupe-runtime` | Pomocniki cache deduplikacji w pamięci |
    | `plugin-sdk/delivery-queue-runtime` | Pomocnik opróżniania oczekującego dostarczania wychodzącego |
    | `plugin-sdk/file-access-runtime` | Pomocniki bezpiecznych ścieżek plików lokalnych i źródeł mediów |
    | `plugin-sdk/heartbeat-runtime` | Pomocniki wybudzania, zdarzeń i widoczności Heartbeat |
    | `plugin-sdk/number-runtime` | Pomocnik koercji numerycznej |
    | `plugin-sdk/secure-random-runtime` | Pomocniki bezpiecznych tokenów/UUID |
    | `plugin-sdk/system-event-runtime` | Pomocniki kolejki zdarzeń systemowych |
    | `plugin-sdk/transport-ready-runtime` | Pomocnik oczekiwania na gotowość transportu |
    | `plugin-sdk/exec-approvals-runtime` | Pomocniki plików polityki zatwierdzania exec bez szerokiego modułu zbiorczego infra-runtime |
    | `plugin-sdk/infra-runtime` | Przestarzały shim zgodności; użyj powyższych skupionych podścieżek środowiska wykonawczego |
    | `plugin-sdk/collection-runtime` | Małe pomocniki ograniczonego cache |
    | `plugin-sdk/diagnostic-runtime` | Pomocniki flag diagnostycznych, zdarzeń i kontekstu śledzenia |
    | `plugin-sdk/error-runtime` | Graf błędów, formatowanie, wspólne pomocniki klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Opakowany fetch, proxy, opcja EnvHttpProxyAgent i pomocniki przypiętego lookupu |
    | `plugin-sdk/runtime-fetch` | Fetch środowiska wykonawczego świadomy dispatchera bez importów proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer inline image data URL i pomocniki wykrywania sygnatur bez szerokiej powierzchni środowiska wykonawczego mediów |
    | `plugin-sdk/response-limit-runtime` | Ograniczony czytnik body odpowiedzi bez szerokiej powierzchni środowiska wykonawczego mediów |
    | `plugin-sdk/session-binding-runtime` | Bieżący stan powiązania konwersacji bez skonfigurowanego routingu powiązań ani magazynów parowania |
    | `plugin-sdk/session-store-runtime` | Pomocniki magazynu sesji bez szerokich importów zapisów/konserwacji konfiguracji |
    | `plugin-sdk/sqlite-runtime` | Skupione pomocniki schematu agenta SQLite, ścieżek i transakcji bez kontroli cyklu życia bazy danych |
    | `plugin-sdk/context-visibility-runtime` | Rozwiązywanie widoczności kontekstu i filtrowanie kontekstu uzupełniającego bez szerokich importów konfiguracji/bezpieczeństwa |
    | `plugin-sdk/string-coerce-runtime` | Wąskie pomocniki koercji i normalizacji prymitywnych rekordów/ciągów bez importów markdown/logging |
    | `plugin-sdk/host-runtime` | Pomocniki normalizacji nazwy hosta i hosta SCP |
    | `plugin-sdk/retry-runtime` | Pomocniki konfiguracji ponawiania i runnera ponawiania |
    | `plugin-sdk/agent-runtime` | Pomocniki katalogu/tożsamości/obszaru roboczego agenta, w tym `resolveAgentDir`, `resolveDefaultAgentDir` i przestarzały eksport zgodności `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Zapytanie/deduplikacja katalogów oparte na konfiguracji |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Podścieżki możliwości i testowania">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Wspólne helpery pobierania/przekształcania/przechowywania mediów, w tym `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` oraz przestarzałe `fetchRemoteMedia`; preferuj helpery magazynu przed odczytami bufora, gdy adres URL ma stać się mediami OpenClaw |
    | `plugin-sdk/media-mime` | Wąska normalizacja MIME, mapowanie rozszerzeń plików, wykrywanie MIME oraz helpery rodzaju mediów |
    | `plugin-sdk/media-store` | Wąskie helpery magazynu mediów, takie jak `saveMediaBuffer` i `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Wspólne helpery przełączania awaryjnego generowania mediów, wyboru kandydatów oraz komunikatów o brakującym modelu |
    | `plugin-sdk/media-understanding` | Typy dostawców rozumienia mediów oraz eksporty helperów obrazów/audio/ekstrakcji strukturalnej dla dostawców |
    | `plugin-sdk/text-chunking` | Helpery dzielenia/renderowania tekstu i Markdown, konwersja tabel Markdown, usuwanie tagów dyrektyw oraz narzędzia bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Helper dzielenia tekstu wychodzącego |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz eksporty dyrektyw, rejestru, walidacji, buildera TTS zgodnego z OpenAI i helperów mowy dla dostawców |
    | `plugin-sdk/speech-core` | Wspólne typy dostawców mowy, rejestr, dyrektywa, normalizacja oraz eksporty helperów mowy |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji w czasie rzeczywistym, helpery rejestru oraz wspólny helper sesji WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Helper inicjalizacji profilu w czasie rzeczywistym do ograniczonego wstrzykiwania kontekstu `IDENTITY.md`, `USER.md` i `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu w czasie rzeczywistym, helpery rejestru oraz wspólne helpery zachowania głosu w czasie rzeczywistym, w tym śledzenie aktywności wyjścia |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów oraz helpery zasobów obrazów/adresów URL danych i builder dostawcy obrazów zgodny z OpenAI |
    | `plugin-sdk/image-generation-core` | Wspólne typy generowania obrazów, przełączanie awaryjne, uwierzytelnianie oraz helpery rejestru |
    | `plugin-sdk/music-generation` | Typy dostawców/żądań/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Wspólne typy generowania muzyki, helpery przełączania awaryjnego, wyszukiwanie dostawców oraz parsowanie odwołań do modeli |
    | `plugin-sdk/video-generation` | Typy dostawców/żądań/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Wspólne typy generowania wideo, helpery przełączania awaryjnego, wyszukiwanie dostawców oraz parsowanie odwołań do modeli |
    | `plugin-sdk/transcripts` | Wspólne typy dostawców źródeł transkryptów, helpery rejestru, deskryptory sesji oraz metadane wypowiedzi |
    | `plugin-sdk/webhook-targets` | Rejestr celów Webhook oraz helpery instalowania tras |
    | `plugin-sdk/webhook-path` | Przestarzały alias zgodności; użyj `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Wspólne helpery ładowania mediów zdalnych/lokalnych |
    | `plugin-sdk/zod` | Przestarzały reeksport zgodności; importuj `zod` bezpośrednio z `zod` |
    | `plugin-sdk/testing` | Lokalny dla repozytorium przestarzały moduł zbiorczy zgodności dla starszych testów OpenClaw. Nowe testy repozytorium powinny zamiast tego importować ukierunkowane lokalne podścieżki testowe, takie jak `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` lub `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Lokalny dla repozytorium minimalny helper `createTestPluginApi` do bezpośrednich testów jednostkowych rejestracji Pluginu bez importowania mostków helperów testowych repozytorium |
    | `plugin-sdk/agent-runtime-test-contracts` | Lokalne dla repozytorium natywne fixture kontraktów adaptera środowiska wykonawczego agentów do testów uwierzytelniania, dostarczania, przełączania awaryjnego, haka narzędzi, nakładki promptu, schematu i projekcji transkryptu |
    | `plugin-sdk/channel-test-helpers` | Lokalne dla repozytorium helpery testowe zorientowane na kanały dla ogólnych kontraktów akcji/konfiguracji/statusu, asercji katalogów, cyklu życia uruchamiania konta, wątkowania konfiguracji wysyłania, mocków środowiska wykonawczego, problemów statusu, dostarczania wychodzącego i rejestracji haków |
    | `plugin-sdk/channel-target-testing` | Lokalny dla repozytorium wspólny zestaw przypadków błędów rozwiązywania celów dla testów kanałów |
    | `plugin-sdk/plugin-test-contracts` | Lokalne dla repozytorium helpery kontraktów pakietu Pluginu, rejestracji, artefaktu publicznego, bezpośredniego importu, API środowiska wykonawczego oraz efektów ubocznych importu |
    | `plugin-sdk/provider-test-contracts` | Lokalne dla repozytorium helpery kontraktów środowiska wykonawczego dostawcy, uwierzytelniania, wykrywania, onboardingu, katalogu, kreatora, możliwości mediów, zasad odtwarzania, STT audio na żywo w czasie rzeczywistym, wyszukiwania/pobierania z sieci oraz strumienia |
    | `plugin-sdk/provider-http-test-mocks` | Lokalne dla repozytorium opcjonalne mocki HTTP/uwierzytelniania Vitest dla testów dostawców, które wykonują `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Lokalne dla repozytorium ogólne fixture przechwytywania środowiska wykonawczego CLI, kontekstu piaskownicy, writera Skills, wiadomości agenta, zdarzenia systemowego, ponownego ładowania modułu, ścieżki bundled plugin, tekstu terminala, dzielenia na fragmenty, tokenu uwierzytelniania oraz typowanych przypadków |
    | `plugin-sdk/test-node-mocks` | Lokalne dla repozytorium ukierunkowane helpery mocków wbudowanych modułów Node do użycia wewnątrz fabryk Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Podścieżki pamięci">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Powierzchnia helperów bundled memory-core dla helperów menedżera/konfiguracji/plików/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada środowiska wykonawczego indeksu/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-embedding-registry` | Lekkie helpery rejestru dostawców osadzeń pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika podstawy hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrakty osadzeń hosta pamięci, dostęp do rejestru, lokalny dostawca oraz ogólne helpery wsadowe/zdalne. `registerMemoryEmbeddingProvider` na tej powierzchni jest przestarzałe; dla nowych dostawców użyj ogólnego API dostawcy osadzeń. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika magazynu hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Helpery multimodalne hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Przestarzały alias zgodności; użyj `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helpery statusu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpery środowiska wykonawczego CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpery rdzeniowego środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny względem dostawcy alias helperów rdzeniowego środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny względem dostawcy alias helperów dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Przestarzały alias zgodności; użyj `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Wspólne helpery zarządzanego Markdown dla Pluginów sąsiadujących z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada środowiska wykonawczego aktywnej pamięci do dostępu do menedżera wyszukiwania |
    | `plugin-sdk/memory-host-status` | Przestarzały alias zgodności; użyj `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Zarezerwowane podścieżki helperów bundled">
    Zarezerwowane podścieżki SDK helperów bundled to wąskie powierzchnie specyficzne dla właściciela dla
    kodu bundled plugin. Są śledzone w inwentarzu SDK, dzięki czemu kompilacje
    pakietów i aliasowanie pozostają deterministyczne, ale nie są ogólnymi interfejsami API
    tworzenia Pluginów. Nowe kontrakty hosta wielokrotnego użytku powinny używać ogólnych podścieżek SDK,
    takich jak `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` i
    `plugin-sdk/plugin-config-runtime`.

    | Podścieżka | Właściciel i przeznaczenie |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper bundled Pluginu Codex do projekcji konfiguracji serwera MCP użytkownika do konfiguracji wątku serwera aplikacji Codex |
    | `plugin-sdk/codex-native-task-runtime` | Helper bundled Pluginu Codex do odzwierciedlania natywnych podagentów serwera aplikacji Codex w stanie zadań OpenClaw |

  </Accordion>
</AccordionGroup>

## Powiązane

- [Przegląd Plugin SDK](/pl/plugins/sdk-overview)
- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Tworzenie Pluginów](/pl/plugins/building-plugins)
