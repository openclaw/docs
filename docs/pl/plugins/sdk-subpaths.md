---
read_when:
    - Wybór właściwej podścieżki plugin-sdk dla importu Plugin
    - Audytowanie podścieżek bundled-plugin i powierzchni pomocniczych
summary: 'Katalog podścieżek Plugin SDK: które importy znajdują się gdzie, pogrupowane według obszaru'
title: Ścieżki podrzędne Plugin SDK
x-i18n:
    generated_at: "2026-07-01T08:36:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 689af6c9c17eb6b3231c5f445d7de0af97d1a8a087bdbc26640851d4b11ada2b
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK pluginów jest udostępniany jako zestaw wąskich publicznych podścieżek w
`openclaw/plugin-sdk/`. Ta strona kataloguje często używane podścieżki pogrupowane według
przeznaczenia. Wygenerowany inwentarz punktów wejścia kompilatora znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`; eksporty pakietu są publicznym podzbiorem
po odjęciu lokalnych dla repozytorium podścieżek testowych/wewnętrznych wymienionych w
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Opiekunowie mogą audytować
liczbę publicznych eksportów za pomocą `pnpm plugin-sdk:surface` oraz aktywne zarezerwowane
podścieżki pomocnicze za pomocą `pnpm plugins:boundary-report:summary`; nieużywane zarezerwowane
eksporty pomocnicze powodują niepowodzenie raportu CI, zamiast pozostawać w publicznym SDK jako
uśpiony dług zgodności.

Przewodnik tworzenia pluginów znajdziesz w [Omówieniu Plugin SDK](/pl/plugins/sdk-overview).

## Punkt wejścia pluginu

| Podścieżka                     | Kluczowe eksporty                                                                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Pomocniki elementów dostawcy migracji, takie jak `createMigrationItem`, stałe powodów, znaczniki statusu elementów, pomocniki redakcji oraz `summarizeMigrationItems`   |
| `plugin-sdk/migration-runtime` | Pomocniki migracji w czasie wykonywania, takie jak `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` oraz `writeMigrationReport`                             |
| `plugin-sdk/health`            | Rejestracja, wykrywanie, naprawa, wybór, ważność oraz typy ustaleń kontroli stanu Doctor dla dołączonych konsumentów stanu                                             |

### Przestarzała zgodność i pomocniki testowe

Przestarzałe podścieżki pozostają eksportowane dla starszych pluginów, ale nowy kod powinien używać
wyspecjalizowanych podścieżek SDK poniżej. Utrzymywana lista znajduje się w
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI odrzuca importy produkcyjne
dołączonych pluginów z tej listy. Szerokie barrele, takie jak `compat`, `config-types`,
`infra-runtime`, `text-runtime` i `zod`, służą wyłącznie zgodności. Importuj `zod`
bezpośrednio z `zod`.

Podścieżki pomocników testowych OpenClaw opartych na Vitest są wyłącznie lokalne dla repozytorium i nie są już
eksportami pakietu: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` oraz `testing`.

### Zarezerwowane podścieżki pomocnicze dołączonych pluginów

Te podścieżki są należącymi do pluginów powierzchniami zgodności dla ich właścicielskich dołączonych
pluginów, a nie ogólnymi API SDK: `plugin-sdk/codex-mcp-projection` oraz
`plugin-sdk/codex-native-task-runtime`. Importy rozszerzeń między właścicielami są blokowane
przez mechanizmy ochronne kontraktu pakietu.

<AccordionGroup>
  <Accordion title="Podścieżki kanałów">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Buforowany helper walidacji JSON Schema dla schematów należących do pluginów |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Wspólne helpery kreatora konfiguracji, translator konfiguracji, monity listy dozwolonych, konstruktory statusu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Przestarzały alias zgodności; użyj `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpery konfiguracji wielu kont/bramki akcji, helpery awaryjnego konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpery normalizacji identyfikatorów kont |
    | `plugin-sdk/account-resolution` | Helpery wyszukiwania kont i domyślnego fallbacku |
    | `plugin-sdk/account-helpers` | Wąskie helpery listy kont/akcji konta |
    | `plugin-sdk/access-groups` | Helpery parsowania listy dozwolonych grup dostępu i zredagowanej diagnostyki grup |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Wspólne prymitywy schematu konfiguracji kanału oraz konstruktory Zod i bezpośrednie JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Schematy konfiguracji kanałów dołączonych do OpenClaw wyłącznie dla utrzymywanych dołączonych pluginów |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Kanoniczne identyfikatory dołączonych/oficjalnych kanałów czatu oraz etykiety/aliasy formatera dla pluginów, które muszą rozpoznawać tekst z prefiksem koperty bez wpisywania własnej tabeli na stałe. |
    | `plugin-sdk/channel-config-schema-legacy` | Przestarzały alias zgodności dla schematów konfiguracji dołączonych kanałów |
    | `plugin-sdk/telegram-command-config` | Helpery normalizacji/walidacji niestandardowych poleceń Telegram z fallbackiem kontraktu dołączonego |
    | `plugin-sdk/command-gating` | Wąskie helpery bramki autoryzacji poleceń |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Przestarzała niskopoziomowa fasada zgodności wejścia kanału. Nowe ścieżki odbioru powinny używać `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Eksperymentalny wysokopoziomowy resolver środowiska uruchomieniowego wejścia kanału i konstruktory faktów tras dla zmigrowanych ścieżek odbioru kanału. Preferuj to zamiast składania efektywnych list dozwolonych, list dozwolonych poleceń i projekcji starszego typu w każdym pluginie. Zobacz [API wejścia kanału](/pl/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Kontrakty cyklu życia wiadomości oraz opcje potoku odpowiedzi, potwierdzenia, podgląd/streaming na żywo, helpery cyklu życia, tożsamość wychodząca, planowanie payloadu, trwałe wysyłki i helpery kontekstu wysyłania wiadomości. Zobacz [API wyjścia kanału](/pl/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Przestarzały alias zgodności dla `plugin-sdk/channel-outbound` oraz starsze fasady wysyłania odpowiedzi. |
    | `plugin-sdk/channel-message-runtime` | Przestarzały alias zgodności dla `plugin-sdk/channel-outbound` oraz starsze fasady wysyłania odpowiedzi. |
    | `plugin-sdk/inbound-envelope` | Wspólne helpery trasy przychodzącej i konstruktora koperty |
    | `plugin-sdk/inbound-reply-dispatch` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-inbound` dla runnerów przychodzących i predykatów wysyłania oraz `plugin-sdk/channel-outbound` dla helperów dostarczania wiadomości. |
    | `plugin-sdk/messaging-targets` | Przestarzały alias parsowania celu; użyj `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Wspólne helpery ładowania mediów wychodzących i stanu hostowanych mediów |
    | `plugin-sdk/outbound-send-deps` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Wąskie helpery normalizacji ankiet |
    | `plugin-sdk/thread-bindings-runtime` | Helpery cyklu życia powiązań wątków i adapterów |
    | `plugin-sdk/agent-media-payload` | Starszy konstruktor payloadu multimediów agenta |
    | `plugin-sdk/conversation-runtime` | Helpery konwersacji/powiązań wątków, parowania i skonfigurowanych powiązań |
    | `plugin-sdk/runtime-config-snapshot` | Helper migawki konfiguracji środowiska uruchomieniowego |
    | `plugin-sdk/runtime-group-policy` | Helpery rozstrzygania zasad grup środowiska uruchomieniowego |
    | `plugin-sdk/channel-status` | Wspólne helpery migawki/podsumowania statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Helpery autoryzacji zapisu konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Wspólne eksporty preludium pluginu kanału |
    | `plugin-sdk/allowlist-config-edit` | Helpery edycji/odczytu konfiguracji listy dozwolonych |
    | `plugin-sdk/group-access` | Wspólne helpery decyzji dostępu grupowego |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Przestarzałe fasady zgodności. Użyj `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Wąskie helpery zasad strażnika bezpośrednich DM przed kryptografią |
    | `plugin-sdk/discord` | Przestarzała fasada zgodności Discord dla opublikowanego `@openclaw/discord@2026.3.13` i śledzonej zgodności właściciela; nowe pluginy powinny używać ogólnych podścieżek SDK kanału |
    | `plugin-sdk/telegram-account` | Przestarzała fasada zgodności rozstrzygania kont Telegram dla śledzonej zgodności właściciela; nowe pluginy powinny używać wstrzykiwanych helperów środowiska uruchomieniowego lub ogólnych podścieżek SDK kanału |
    | `plugin-sdk/zalouser` | Przestarzała fasada zgodności Zalo Personal dla opublikowanych pakietów Lark/Zalo, które nadal importują autoryzację poleceń nadawcy; nowe pluginy powinny używać `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Semantyczna prezentacja i dostarczanie wiadomości oraz starsze helpery interaktywnych odpowiedzi. Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Wspólne helpery przychodzące dla klasyfikacji zdarzeń, budowania kontekstu, formatowania, korzeni, debounce, dopasowywania wzmianek, zasad wzmianek i logowania przychodzącego |
    | `plugin-sdk/channel-inbound-debounce` | Wąskie helpery debounce przychodzącego |
    | `plugin-sdk/channel-mention-gating` | Wąskie helpery zasad wzmianek, znaczników wzmianek i tekstu wzmianek bez szerszej powierzchni środowiska uruchomieniowego wejścia |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Przestarzałe fasady zgodności. Użyj `plugin-sdk/channel-inbound` lub `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | Helpery akcji wiadomości kanału oraz przestarzałe helpery schematów natywnych zachowane dla zgodności pluginów |
    | `plugin-sdk/channel-route` | Wspólne helpery normalizacji tras, rozstrzygania celów sterowanego parserem, zamiany identyfikatorów wątków na ciągi znaków, kluczy tras deduplikacji/kompaktowania, typów sparsowanych celów oraz porównywania tras/celów |
    | `plugin-sdk/channel-targets` | Helpery parsowania celów; wywołujący porównanie tras powinni używać `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Typy kontraktu kanału |
    | `plugin-sdk/channel-feedback` | Okablowanie informacji zwrotnej/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, oraz typy celów sekretów |
  </Accordion>

Przestarzałe rodziny helperów kanałów pozostają dostępne wyłącznie dla
zgodności opublikowanych pluginów. Plan usunięcia jest następujący:
zachować je przez okres migracji zewnętrznych pluginów, utrzymywać pluginy
repozytorium/dołączone na `channel-inbound` i `channel-outbound`, a następnie
usunąć podścieżki zgodności podczas następnego dużego czyszczenia SDK.
Dotyczy to starych rodzin wiadomości/środowiska uruchomieniowego kanału,
streamingu kanału, dostępu direct-DM, odłamów helperów przychodzących,
opcji odpowiedzi i ścieżek parowania.

  <Accordion title="Podścieżki dostawców">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Obsługiwana fasada dostawcy LM Studio do konfiguracji, wykrywania katalogu i przygotowywania modeli w środowisku wykonawczym |
    | `plugin-sdk/lmstudio-runtime` | Obsługiwana fasada środowiska wykonawczego LM Studio dla domyślnych ustawień serwera lokalnego, wykrywania modeli, nagłówków żądań i helperów załadowanych modeli |
    | `plugin-sdk/provider-setup` | Wyselekcjonowane helpery konfiguracji lokalnych/samohostowanych dostawców |
    | `plugin-sdk/self-hosted-provider-setup` | Skoncentrowane helpery konfiguracji samohostowanego dostawcy zgodnego z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI + stałe watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpery rozwiązywania kluczy API w środowisku wykonawczym dla pluginów dostawców |
    | `plugin-sdk/provider-oauth-runtime` | Ogólne typy wywołań zwrotnych OAuth dostawcy, renderowanie strony wywołania zwrotnego, helpery PKCE/stanu, parsowanie danych wejściowych autoryzacji, helpery wygasania tokenów i helpery przerywania |
    | `plugin-sdk/provider-auth-api-key` | Helpery onboardingu klucza API/zapisu profilu, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy konstruktor wyniku uwierzytelniania OAuth |
    | `plugin-sdk/provider-env-vars` | Helpery wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, helpery importu uwierzytelniania OpenAI Codex, przestarzały eksport zgodności `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory zasad odtwarzania, helpery punktów końcowych dostawcy i współdzielone helpery normalizacji identyfikatorów modeli |
    | `plugin-sdk/provider-catalog-live-runtime` | Helpery katalogu modeli aktywnego dostawcy dla chronionego wykrywania w stylu `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrowanie identyfikatorów modeli, pamięć podręczna TTL i statyczny fallback |
    | `plugin-sdk/provider-catalog-runtime` | Hak środowiska wykonawczego rozszerzania katalogu dostawcy i szwy rejestru pluginów dostawców do testów kontraktowych |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ogólne helpery możliwości HTTP/punktów końcowych dostawcy, błędy HTTP dostawcy i helpery wieloczęściowego formularza transkrypcji audio |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie helpery kontraktu konfiguracji/wyboru pobierania z sieci, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpery rejestracji/pamięci podręcznej dostawcy pobierania z sieci |
    | `plugin-sdk/provider-web-search-config-contract` | Wąskie helpery konfiguracji/poświadczeń wyszukiwania w sieci dla dostawców, którzy nie potrzebują okablowania włączania pluginu |
    | `plugin-sdk/provider-web-search-contract` | Wąskie helpery kontraktu konfiguracji/poświadczeń wyszukiwania w sieci, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz ograniczone zakresem settery/gettery poświadczeń |
    | `plugin-sdk/provider-web-search` | Helpery rejestracji/pamięci podręcznej/środowiska wykonawczego dostawcy wyszukiwania w sieci |
    | `plugin-sdk/embedding-providers` | Ogólne typy dostawców embeddingów i helpery odczytu, w tym `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` i `listEmbeddingProviders(...)`; pluginy rejestrują dostawców przez `api.registerEmbeddingProvider(...)`, aby wymusić własność manifestu |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` oraz czyszczenie schematów + diagnostyka DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Typy migawek użycia dostawcy, współdzielone helpery pobierania użycia i fetchery dostawców, takie jak `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni, zgodność wywołań narzędzi w tekście zwykłym oraz współdzielone helpery wrapperów Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Publiczne współdzielone helpery wrapperów strumienia dostawcy, w tym `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` oraz narzędzia strumieni zgodnych z Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Natywne helpery transportu dostawcy, takie jak chronione pobieranie, wyodrębnianie tekstu wyników narzędzi, transformacje komunikatów transportowych i zapisywalne strumienie zdarzeń transportowych |
    | `plugin-sdk/provider-onboard` | Helpery łatania konfiguracji onboardingu |
    | `plugin-sdk/global-singleton` | Helpery singletonów/map/pamięci podręcznych lokalnych dla procesu |
    | `plugin-sdk/group-activation` | Wąskie helpery trybu aktywacji grupy i parsowania poleceń |
  </Accordion>

Migawki użycia dostawcy zwykle raportują jedno lub więcej `windows` limitu,
każde z etykietą, procentem wykorzystania i opcjonalnym czasem resetu.
Dostawcy, którzy udostępniają tekst salda lub stanu konta zamiast resetowalnych
okien limitu, powinni zwracać `summary` z pustą tablicą `windows`, zamiast
fabrykować procenty. OpenClaw wyświetla ten tekst podsumowania w wyjściu statusu;
używaj `error` tylko wtedy, gdy punkt końcowy użycia zawiódł albo nie zwrócił
żadnych użytecznych danych użycia.

  <Accordion title="Podścieżki uwierzytelniania i zabezpieczeń">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpery rejestru poleceń, w tym formatowanie dynamicznego menu argumentów, helpery autoryzacji nadawcy |
    | `plugin-sdk/command-status` | Konstruktory komunikatów poleceń/pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpery rozwiązywania zatwierdzających i uwierzytelniania akcji w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Helpery natywnego profilu/filtra zatwierdzania exec |
    | `plugin-sdk/approval-delivery-runtime` | Natywne adaptery możliwości/dostarczania zatwierdzeń |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony helper rozwiązywania Gateway zatwierdzeń |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie helpery ładowania natywnego adaptera zatwierdzeń dla gorących punktów wejścia kanału |
    | `plugin-sdk/approval-handler-runtime` | Szersze helpery środowiska wykonawczego obsługi zatwierdzeń; preferuj węższe szwy adaptera/Gateway, gdy wystarczają |
    | `plugin-sdk/approval-native-runtime` | Helpery natywnego celu zatwierdzeń, powiązania konta, bramki trasy, fallbacku przekazywania i wyciszania lokalnego natywnego monitu exec |
    | `plugin-sdk/approval-reaction-runtime` | Zakodowane na stałe powiązania reakcji zatwierdzeń, ładunki monitów reakcji, magazyny celów reakcji i eksport zgodności dla wyciszania lokalnego natywnego monitu exec |
    | `plugin-sdk/approval-reply-runtime` | Helpery ładunku odpowiedzi zatwierdzenia exec/pluginu |
    | `plugin-sdk/approval-runtime` | Helpery ładunku zatwierdzenia exec/pluginu, helpery routingu/środowiska wykonawczego natywnych zatwierdzeń i helpery strukturalnego wyświetlania zatwierdzeń, takie jak `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Wąskie helpery resetowania deduplikacji odpowiedzi przychodzących |
    | `plugin-sdk/channel-contract-testing` | Wąskie helpery testów kontraktowych kanału bez szerokiej beczki testowej |
    | `plugin-sdk/command-auth-native` | Natywne uwierzytelnianie poleceń, formatowanie dynamicznego menu argumentów i natywne helpery celu sesji |
    | `plugin-sdk/command-detection` | Współdzielone helpery wykrywania poleceń |
    | `plugin-sdk/command-primitives-runtime` | Lekkie predykaty tekstu poleceń dla gorących ścieżek kanałów |
    | `plugin-sdk/command-surface` | Normalizacja treści polecenia i helpery powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery zbierania kontraktu sekretów dla powierzchni sekretów kanału/pluginu |
    | `plugin-sdk/secret-ref-runtime` | Wąskie helpery typowania `coerceSecretRef` i SecretRef do parsowania kontraktu sekretów/konfiguracji |
    | `plugin-sdk/secret-provider-integration` | Manifest integracji dostawcy SecretRef tylko na poziomie typów i kontrakty presetów dla pluginów publikujących presety zewnętrznych dostawców sekretów |
    | `plugin-sdk/security-runtime` | Współdzielone helpery zaufania, bramkowania DM, plików/ścieżek ograniczonych do katalogu głównego, w tym zapisy tylko przy tworzeniu, synchroniczna/asynchroniczna atomowa podmiana pliku, zapisy do tymczasowych plików sąsiednich, fallback przenoszenia między urządzeniami, helpery prywatnego magazynu plików, osłony rodziców dowiązań symbolicznych, treści zewnętrzne, redakcja tekstu wrażliwego, stałoczasowe porównywanie sekretów i helpery zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Helpery listy dozwolonych hostów i polityki SSRF sieci prywatnych |
    | `plugin-sdk/ssrf-dispatcher` | Wąskie helpery przypiętego dispatchera bez szerokiej powierzchni środowiska wykonawczego infrastruktury |
    | `plugin-sdk/ssrf-runtime` | Przypięty dispatcher, pobieranie chronione przed SSRF, błąd SSRF i helpery polityki SSRF |
    | `plugin-sdk/secret-input` | Helpery parsowania danych wejściowych sekretów |
    | `plugin-sdk/webhook-ingress` | Helpery żądań/celów Webhook i wymuszanie surowego websocket/treści |
    | `plugin-sdk/webhook-request-guards` | Helpery rozmiaru/limitu czasu treści żądania |
  </Accordion>

  <Accordion title="Podścieżki środowiska uruchomieniowego i pamięci masowej">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie helpery środowiska uruchomieniowego, logowania, kopii zapasowych i instalacji pluginów |
    | `plugin-sdk/runtime-env` | Wąskie helpery środowiska uruchomieniowego: env, logger, limit czasu, ponawianie i backoff |
    | `plugin-sdk/browser-config` | Obsługiwana fasada konfiguracji przeglądarki dla znormalizowanego profilu/wartości domyślnych, parsowania URL CDP i helperów autoryzacji sterowania przeglądarką |
    | `plugin-sdk/agent-harness-task-runtime` | Ogólne helpery cyklu życia zadania i dostarczania ukończenia dla agentów opartych na harnessie, używających zakresu zadania wystawionego przez hosta |
    | `plugin-sdk/codex-mcp-projection` | Zarezerwowany helper wbudowanego Codex do rzutowania konfiguracji serwera MCP użytkownika na konfigurację wątku Codex; nie dla pluginów firm trzecich |
    | `plugin-sdk/codex-native-task-runtime` | Prywatny helper wbudowanego Codex do okablowania natywnego lustra zadania/środowiska uruchomieniowego; nie dla pluginów firm trzecich |
    | `plugin-sdk/channel-runtime-context` | Ogólne helpery rejestracji i wyszukiwania kontekstu środowiska uruchomieniowego kanału |
    | `plugin-sdk/matrix` | Przestarzała fasada zgodności Matrix dla starszych pakietów kanałów firm trzecich; nowe pluginy powinny importować bezpośrednio `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Przestarzała fasada zgodności Mattermost dla starszych pakietów kanałów firm trzecich; nowe pluginy powinny importować bezpośrednio ogólne podścieżki SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone helpery poleceń, hooków, HTTP i interaktywne pluginów |
    | `plugin-sdk/hook-runtime` | Współdzielone helpery potoku hooków webhooków/wewnętrznych |
    | `plugin-sdk/lazy-runtime` | Helpery leniwego importu/wiązania środowiska uruchomieniowego, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpery wykonywania procesów |
    | `plugin-sdk/cli-runtime` | Helpery formatowania CLI, oczekiwania, wersji, wywołań z argumentami i leniwych grup poleceń |
    | `plugin-sdk/qa-live-transport-scenarios` | Współdzielone identyfikatory scenariuszy QA transportu live, helpery pokrycia bazowego i helper wyboru scenariusza |
    | `plugin-sdk/gateway-method-runtime` | Zarezerwowany helper wysyłania metod Gateway dla tras HTTP pluginów deklarujących `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Klient Gateway, helper uruchamiania klienta gotowego na pętlę zdarzeń, RPC CLI gateway, błędy protokołu gateway i helpery łatek statusu kanału |
    | `plugin-sdk/config-contracts` | Skoncentrowana powierzchnia konfiguracji tylko typów dla kształtów konfiguracji pluginów, takich jak `OpenClawConfig` oraz typy konfiguracji kanałów/dostawców |
    | `plugin-sdk/plugin-config-runtime` | Helpery wyszukiwania konfiguracji pluginów w środowisku uruchomieniowym, takie jak `requireRuntimeConfig`, `resolvePluginConfigObject` i `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Helpery transakcyjnej mutacji konfiguracji, takie jak `mutateConfigFile`, `replaceConfigFile` i `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Współdzielone ciągi wskazówek metadanych dostarczania narzędzi wiadomości |
    | `plugin-sdk/runtime-config-snapshot` | Helpery migawki konfiguracji bieżącego procesu, takie jak `getRuntimeConfig`, `getRuntimeConfigSnapshot` i settery migawek testowych |
    | `plugin-sdk/telegram-command-config` | Normalizacja nazw/opisów poleceń Telegram oraz kontrole duplikatów/konfliktów, nawet gdy wbudowana powierzchnia kontraktu Telegram jest niedostępna |
    | `plugin-sdk/text-autolink-runtime` | Wykrywanie autolinków odwołań do plików bez szerokiego barrela tekstowego |
    | `plugin-sdk/approval-reaction-runtime` | Zakodowane na stałe wiązania reakcji zatwierdzania, payloady promptów reakcji, magazyny celów reakcji i eksport zgodności do lokalnego tłumienia natywnego promptu exec |
    | `plugin-sdk/approval-runtime` | Helpery zatwierdzania exec/pluginów, buildery możliwości zatwierdzania, helpery autoryzacji/profilu, helpery natywnego routingu/środowiska uruchomieniowego i formatowanie ścieżek strukturalnego wyświetlania zatwierdzeń |
    | `plugin-sdk/reply-runtime` | Współdzielone helpery środowiska uruchomieniowego wiadomości przychodzących/odpowiedzi, dzielenie na fragmenty, wysyłka, Heartbeat, planer odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery wysyłki/finalizacji odpowiedzi i etykiet konwersacji |
    | `plugin-sdk/reply-history` | Współdzielone helpery krótkookiennej historii odpowiedzi. Nowy kod tur wiadomości powinien używać `createChannelHistoryWindow`; helpery map niższego poziomu pozostają wyłącznie przestarzałymi eksportami zgodności |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie helpery dzielenia tekstu/markdownu na fragmenty |
    | `plugin-sdk/session-store-runtime` | Helpery przepływu pracy sesji (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), ograniczone odczyty niedawnego tekstu transkryptu użytkownika/asystenta według tożsamości sesji, helpery starszej ścieżki magazynu sesji/klucza sesji, odczyty updated-at oraz przejściowe helpery zgodności całego magazynu/ścieżki pliku |
    | `plugin-sdk/session-transcript-runtime` | Tożsamość transkryptu, helpery celów/odczytu/zapisu o ograniczonym zakresie, publikowanie aktualizacji, blokady zapisu i klucze trafień pamięci transkryptu |
    | `plugin-sdk/sqlite-runtime` | Skoncentrowane helpery schematu agenta SQLite, ścieżki i transakcji dla własnego środowiska uruchomieniowego |
    | `plugin-sdk/cron-store-runtime` | Helpery ścieżki/ładowania/zapisywania magazynu Cron |
    | `plugin-sdk/state-paths` | Helpery ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Typy stanu kluczowanego w bocznej bazie SQLite pluginu oraz scentralizowana konfiguracja pragm połączenia i utrzymania WAL dla baz danych należących do pluginów |
    | `plugin-sdk/routing` | Helpery routingu/klucza sesji/wiązania konta, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone helpery podsumowania statusu kanału/konta, domyślne wartości stanu środowiska uruchomieniowego i helpery metadanych zgłoszeń |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone helpery resolvera celów |
    | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji slugów/ciągów |
    | `plugin-sdk/request-url` | Wyodrębnianie adresów URL jako ciągów z wejść podobnych do fetch/request |
    | `plugin-sdk/run-command` | Runner poleceń z limitem czasu i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Wspólne readery parametrów narzędzi/CLI |
    | `plugin-sdk/tool-plugin` | Definiowanie prostego typowanego pluginu narzędzia agenta i udostępnianie statycznych metadanych do generowania manifestu |
    | `plugin-sdk/tool-payload` | Wyodrębnianie znormalizowanych payloadów z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
    | `plugin-sdk/sandbox` | Typy backendu sandboxa i helpery poleceń SSH/OpenShell, w tym preflight polecenia exec z szybkim niepowodzeniem |
    | `plugin-sdk/temp-path` | Współdzielone helpery ścieżek tymczasowych pobrań i prywatne bezpieczne tymczasowe przestrzenie robocze |
    | `plugin-sdk/logging-core` | Logger podsystemu i helpery redakcji |
    | `plugin-sdk/markdown-table-runtime` | Helpery trybu tabel Markdown i konwersji |
    | `plugin-sdk/model-session-runtime` | Helpery nadpisań modelu/sesji, takie jak `applyModelOverrideToSessionEntry` i `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpery rozwiązywania konfiguracji dostawcy Talk |
    | `plugin-sdk/json-store` | Małe helpery odczytu/zapisu stanu JSON |
    | `plugin-sdk/json-unsafe-integers` | Helpery parsowania JSON zachowujące niebezpieczne literały całkowite jako ciągi |
    | `plugin-sdk/file-lock` | Helpery reentrantowej blokady pliku |
    | `plugin-sdk/persistent-dedupe` | Helpery dyskowej pamięci podręcznej deduplikacji |
    | `plugin-sdk/acp-runtime` | Helpery środowiska uruchomieniowego/sesji ACP i wysyłki odpowiedzi |
    | `plugin-sdk/acp-runtime-backend` | Lekkie helpery rejestracji backendu ACP i wysyłki odpowiedzi dla pluginów ładowanych przy starcie |
    | `plugin-sdk/acp-binding-resolve-runtime` | Tylko do odczytu rozwiązywanie wiązań ACP bez importów startowych cyklu życia |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji środowiska uruchomieniowego agenta |
    | `plugin-sdk/boolean-param` | Luźny reader parametru boolean |
    | `plugin-sdk/dangerous-name-runtime` | Helpery rozwiązywania dopasowania niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Helpery bootstrapu urządzenia i tokenów parowania |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy helperów kanału pasywnego, statusu i proxy ambient |
    | `plugin-sdk/models-provider-runtime` | Helpery odpowiedzi polecenia/dostawcy `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpery listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Helpery rejestru/budowania/serializacji natywnych poleceń |
    | `plugin-sdk/agent-harness` | Eksperymentalna powierzchnia zaufanych pluginów dla niskopoziomowych harnessów agentów: typy harnessa, helpery sterowania/przerywania aktywnego uruchomienia, helpery mostka narzędzi OpenClaw, helpery polityki narzędzi planu środowiska uruchomieniowego, klasyfikacja wyniku terminalnego, helpery formatowania/szczegółów postępu narzędzi oraz narzędzia wyników prób |
    | `plugin-sdk/provider-zai-endpoint` | Przestarzała fasada wykrywania endpointu należącego do dostawcy Z.AI; użyj publicznego API pluginu Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper lokalnej dla procesu blokady asynchronicznej dla małych plików stanu środowiska uruchomieniowego |
    | `plugin-sdk/channel-activity-runtime` | Helper telemetrii aktywności kanału |
    | `plugin-sdk/concurrency-runtime` | Helper ograniczonej współbieżności zadań asynchronicznych |
    | `plugin-sdk/dedupe-runtime` | Helpery pamięci podręcznej deduplikacji w pamięci |
    | `plugin-sdk/delivery-queue-runtime` | Helper opróżniania oczekujących dostaw wychodzących |
    | `plugin-sdk/file-access-runtime` | Helpery bezpiecznych ścieżek plików lokalnych i źródeł mediów |
    | `plugin-sdk/heartbeat-runtime` | Helpery wybudzania, zdarzeń i widoczności Heartbeat |
    | `plugin-sdk/number-runtime` | Helper koercji numerycznej |
    | `plugin-sdk/secure-random-runtime` | Helpery bezpiecznych tokenów/UUID |
    | `plugin-sdk/system-event-runtime` | Helpery kolejki zdarzeń systemowych |
    | `plugin-sdk/transport-ready-runtime` | Helper oczekiwania na gotowość transportu |
    | `plugin-sdk/exec-approvals-runtime` | Helpery pliku polityki zatwierdzania exec bez szerokiego barrela infra-runtime |
    | `plugin-sdk/infra-runtime` | Przestarzały shim zgodności; użyj powyższych skoncentrowanych podścieżek środowiska uruchomieniowego |
    | `plugin-sdk/collection-runtime` | Małe helpery ograniczonej pamięci podręcznej |
    | `plugin-sdk/diagnostic-runtime` | Helpery flag diagnostycznych, zdarzeń i kontekstu śledzenia |
    | `plugin-sdk/error-runtime` | Helpery grafu błędów, formatowania, współdzielonej klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Opakowany fetch, proxy, opcja EnvHttpProxyAgent i helpery przypiętego lookupu |
    | `plugin-sdk/runtime-fetch` | Fetch środowiska uruchomieniowego świadomy dispatchera bez importów proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer URL danych obrazów inline i helpery wykrywania sygnatur bez szerokiej powierzchni środowiska uruchomieniowego mediów |
    | `plugin-sdk/response-limit-runtime` | Ograniczony reader treści odpowiedzi bez szerokiej powierzchni środowiska uruchomieniowego mediów |
    | `plugin-sdk/session-binding-runtime` | Bieżący stan wiązania konwersacji bez skonfigurowanego routingu wiązań ani magazynów parowania |
    | `plugin-sdk/session-store-runtime` | Helpery magazynu sesji bez szerokich importów zapisów/utrzymania konfiguracji |
    | `plugin-sdk/sqlite-runtime` | Skoncentrowane helpery schematu agenta SQLite, ścieżki i transakcji bez kontroli cyklu życia bazy danych |
    | `plugin-sdk/context-visibility-runtime` | Rozwiązywanie widoczności kontekstu i filtrowanie kontekstu uzupełniającego bez szerokich importów konfiguracji/zabezpieczeń |
    | `plugin-sdk/string-coerce-runtime` | Wąskie helpery koercji i normalizacji prymitywnych rekordów/ciągów bez importów markdownu/logowania |
    | `plugin-sdk/host-runtime` | Helpery normalizacji nazw hostów i hostów SCP |
    | `plugin-sdk/retry-runtime` | Helpery konfiguracji ponawiania i runnera ponawiania |
    | `plugin-sdk/agent-runtime` | Helpery katalogu/tożsamości/przestrzeni roboczej agenta, w tym `resolveAgentDir`, `resolveDefaultAgentDir` i przestarzały eksport zgodności `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Zapytanie/deduplikacja katalogu opartego na konfiguracji |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Podścieżki możliwości i testowania">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Wspólne helpery pobierania/przekształcania/przechowywania multimediów, w tym `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` oraz przestarzałe `fetchRemoteMedia`; preferuj helpery magazynu przed odczytami bufora, gdy URL ma stać się multimedium OpenClaw |
    | `plugin-sdk/media-mime` | Wąska normalizacja MIME, mapowanie rozszerzeń plików, wykrywanie MIME oraz helpery rodzaju multimediów |
    | `plugin-sdk/media-store` | Wąskie helpery magazynu multimediów, takie jak `saveMediaBuffer` i `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Wspólne helpery przełączania awaryjnego generowania multimediów, wybór kandydatów i komunikaty o brakującym modelu |
    | `plugin-sdk/media-understanding` | Typy dostawców rozumienia multimediów oraz eksporty helperów obrazu/audio/ekstrakcji strukturalnej skierowane do dostawców |
    | `plugin-sdk/text-chunking` | Helpery dzielenia/renderowania tekstu i markdown, konwersja tabel markdown, usuwanie tagów dyrektyw oraz narzędzia bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Helper dzielenia tekstu wychodzącego |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz eksporty dyrektyw, rejestru, walidacji, buildera TTS zgodnego z OpenAI i helperów mowy skierowane do dostawców |
    | `plugin-sdk/speech-core` | Wspólne typy dostawców mowy, rejestr, dyrektywa, normalizacja i eksporty helperów mowy |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji w czasie rzeczywistym, helpery rejestru i wspólny helper sesji WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Helper bootstrapu profilu czasu rzeczywistego do ograniczonego wstrzykiwania kontekstu `IDENTITY.md`, `USER.md` i `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu w czasie rzeczywistym, helpery rejestru i wspólne helpery zachowania głosu w czasie rzeczywistym, w tym śledzenie aktywności wyjścia |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów oraz helpery zasobów obrazów/adresów URL danych i builder dostawcy obrazów zgodny z OpenAI |
    | `plugin-sdk/image-generation-core` | Wspólne typy generowania obrazów, przełączanie awaryjne, uwierzytelnianie i helpery rejestru |
    | `plugin-sdk/music-generation` | Typy dostawców/żądań/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Wspólne typy generowania muzyki, helpery przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie odwołań do modeli |
    | `plugin-sdk/video-generation` | Typy dostawców/żądań/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Wspólne typy generowania wideo, helpery przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie odwołań do modeli |
    | `plugin-sdk/transcripts` | Wspólne typy dostawców źródeł transkryptów, helpery rejestru, deskryptory sesji i metadane wypowiedzi |
    | `plugin-sdk/webhook-targets` | Rejestr celów Webhook i helpery instalacji tras |
    | `plugin-sdk/webhook-path` | Przestarzały alias zgodności; użyj `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Wspólne helpery ładowania zdalnych/lokalnych multimediów |
    | `plugin-sdk/zod` | Przestarzały reeksport zgodności; importuj `zod` bezpośrednio z `zod` |
    | `plugin-sdk/testing` | Lokalny dla repozytorium przestarzały barrel zgodności dla starszych testów OpenClaw. Nowe testy repozytorium powinny zamiast tego importować ukierunkowane lokalne podścieżki testowe, takie jak `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` lub `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Lokalny dla repozytorium minimalny helper `createTestPluginApi` do bezpośrednich testów jednostkowych rejestracji pluginów bez importowania mostów helperów testowych repozytorium |
    | `plugin-sdk/agent-runtime-test-contracts` | Lokalne dla repozytorium natywne fikstury kontraktów adaptera środowiska uruchomieniowego agenta do testów uwierzytelniania, dostarczania, fallbacku, hooków narzędzi, nakładki promptu, schematu i projekcji transkryptu |
    | `plugin-sdk/channel-test-helpers` | Lokalne dla repozytorium helpery testowe zorientowane na kanały dla kontraktów ogólnych akcji/konfiguracji/statusu, asercji katalogów, cyklu życia uruchamiania konta, wątkowania konfiguracji wysyłania, mocków środowiska uruchomieniowego, problemów statusu, dostarczania wychodzącego i rejestracji hooków |
    | `plugin-sdk/channel-target-testing` | Lokalny dla repozytorium wspólny zestaw przypadków błędów rozpoznawania celów dla testów kanałów |
    | `plugin-sdk/plugin-test-contracts` | Lokalne dla repozytorium helpery kontraktów pakietu pluginu, rejestracji, artefaktu publicznego, bezpośredniego importu, API środowiska uruchomieniowego i efektów ubocznych importu |
    | `plugin-sdk/provider-test-contracts` | Lokalne dla repozytorium helpery kontraktów środowiska uruchomieniowego dostawcy, uwierzytelniania, wykrywania, onboardingu, katalogu, kreatora, możliwości multimediów, zasad odtwarzania, STT audio na żywo w czasie rzeczywistym, wyszukiwania/pobierania w sieci i strumienia |
    | `plugin-sdk/provider-http-test-mocks` | Lokalne dla repozytorium opcjonalne mocki HTTP/uwierzytelniania Vitest dla testów dostawców, które wykonują `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Lokalne dla repozytorium ogólne fikstury przechwytywania środowiska uruchomieniowego CLI, kontekstu piaskownicy, writera Skills, komunikatu agenta, zdarzenia systemowego, przeładowania modułu, ścieżki bundled pluginu, tekstu terminala, dzielenia na fragmenty, tokenu uwierzytelniania i typowanych przypadków |
    | `plugin-sdk/test-node-mocks` | Lokalne dla repozytorium ukierunkowane helpery mocków wbudowanych modułów Node do użycia wewnątrz fabryk Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Podścieżki pamięci">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Powierzchnia helperów bundled memory-core dla helperów menedżera/konfiguracji/plików/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada środowiska uruchomieniowego indeksu/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-embedding-registry` | Lekkie helpery rejestru dostawców embeddingów pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika fundamentu hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrakty embeddingów hosta pamięci, dostęp do rejestru, dostawca lokalny oraz ogólne helpery wsadowe/zdalne. `registerMemoryEmbeddingProvider` na tej powierzchni jest przestarzałe; dla nowych dostawców użyj ogólnego API dostawcy embeddingów. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika magazynu hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Helpery multimodalne hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Przestarzały alias zgodności; użyj `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Helpery statusu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpery środowiska uruchomieniowego CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpery podstawowego środowiska uruchomieniowego hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/środowiska uruchomieniowego hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny względem dostawcy alias dla helperów podstawowego środowiska uruchomieniowego hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny względem dostawcy alias dla helperów dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Przestarzały alias zgodności; użyj `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Wspólne helpery zarządzanego markdown dla pluginów sąsiadujących z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada środowiska uruchomieniowego aktywnej pamięci dla dostępu do menedżera wyszukiwania |
    | `plugin-sdk/memory-host-status` | Przestarzały alias zgodności; użyj `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Zarezerwowane podścieżki helperów bundled">
    Zarezerwowane podścieżki SDK helperów bundled to wąskie powierzchnie specyficzne dla właścicieli dla
    kodu bundled pluginów. Są śledzone w inwentarzu SDK, aby buildy pakietów
    i aliasowanie pozostawały deterministyczne, ale nie są ogólnymi API
    do tworzenia pluginów. Nowe wielokrotnego użytku kontrakty hosta powinny używać ogólnych podścieżek SDK,
    takich jak `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` i
    `plugin-sdk/plugin-config-runtime`.

    | Podścieżka | Właściciel i cel |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Helper bundled pluginu Codex do projektowania konfiguracji serwera MCP użytkownika na konfigurację wątku serwera aplikacji Codex |
    | `plugin-sdk/codex-native-task-runtime` | Helper bundled pluginu Codex do odzwierciedlania natywnych podagentów serwera aplikacji Codex w stanie zadań OpenClaw |

  </Accordion>
</AccordionGroup>

## Powiązane

- [Przegląd SDK pluginów](/pl/plugins/sdk-overview)
- [Konfiguracja SDK pluginów](/pl/plugins/sdk-setup)
- [Tworzenie pluginów](/pl/plugins/building-plugins)
