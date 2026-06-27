---
read_when:
    - Wybór właściwej podścieżki plugin-sdk dla importu wtyczki
    - Audytowanie podścieżek bundled-plugin i powierzchni pomocniczych
summary: 'Katalog podścieżek Plugin SDK: które importy znajdują się gdzie, pogrupowane według obszaru'
title: Podścieżki SDK Plugin
x-i18n:
    generated_at: "2026-06-27T18:06:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120877dfcc2ddc17237f1ea1a6eb6daf38dcf714ae6446f59ee06e0ef0dfdcc
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Plugin SDK jest udostępniany jako zestaw wąskich publicznych podścieżek w ramach
`openclaw/plugin-sdk/`. Ta strona kataloguje często używane podścieżki pogrupowane
według celu. Wygenerowany inwentarz punktów wejścia kompilatora znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`; eksporty pakietu są publicznym podzbiorem
po odjęciu lokalnych dla repozytorium podścieżek testowych/wewnętrznych wymienionych w
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Opiekunowie mogą audytować
liczbę publicznych eksportów za pomocą `pnpm plugin-sdk:surface` oraz aktywne
zarezerwowane podścieżki pomocnicze za pomocą `pnpm plugins:boundary-report:summary`;
nieużywane zarezerwowane eksporty pomocnicze powodują niepowodzenie raportu CI zamiast
pozostawać w publicznym SDK jako uśpiony dług zgodności.

Przewodnik tworzenia Plugin znajdziesz w [Omówieniu Plugin SDK](/pl/plugins/sdk-overview).

## Punkt wejścia Plugin

| Podścieżka                     | Kluczowe eksporty                                                                                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Pomocnicze elementy dostawcy migracji, takie jak `createMigrationItem`, stałe powodów, znaczniki stanu elementów, helpery redakcji oraz `summarizeMigrationItems`       |
| `plugin-sdk/migration-runtime` | Pomocnicze funkcje migracji w czasie wykonywania, takie jak `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` i `writeMigrationReport`                       |
| `plugin-sdk/health`            | Rejestracja kontroli kondycji Doctor, typy wykrywania, naprawy, wyboru, ważności i ustaleń dla wbudowanych konsumentów kondycji                                       |

### Przestarzałe helpery zgodności i testów

Przestarzałe podścieżki pozostają eksportowane dla starszych Plugin, ale nowy kod powinien używać
wyspecjalizowanych podścieżek SDK poniżej. Utrzymywana lista znajduje się w
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI odrzuca importy produkcyjne
wbudowanych elementów z tej listy. Szerokie baryłki, takie jak `compat`, `config-types`,
`infra-runtime`, `text-runtime` i `zod`, służą wyłącznie zgodności. Importuj `zod`
bezpośrednio z `zod`.

Podścieżki helperów testowych OpenClaw opartych na Vitest są wyłącznie lokalne dla repozytorium i
nie są już eksportami pakietu: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` i `testing`.

### Zarezerwowane podścieżki pomocnicze wbudowanego Plugin

Te podścieżki są powierzchniami zgodności należącymi do Plugin dla ich właścicielskiego wbudowanego
Plugin, a nie ogólnymi API SDK: `plugin-sdk/codex-mcp-projection` i
`plugin-sdk/codex-native-task-runtime`. Importy rozszerzeń między właścicielami są blokowane
przez zabezpieczenia kontraktu pakietu.

<AccordionGroup>
  <Accordion title="Channel subpaths">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Buforowany pomocnik walidacji JSON Schema dla schematów należących do pluginów |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone pomocniki kreatora konfiguracji, translator konfiguracji, prompty listy dozwolonych oraz konstruktory stanu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Przestarzały alias zgodności; użyj `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Pomocniki konfiguracji wielu kont i bramki akcji, pomocniki fallbacku konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, pomocniki normalizacji identyfikatora konta |
    | `plugin-sdk/account-resolution` | Pomocniki wyszukiwania konta i domyślnego fallbacku |
    | `plugin-sdk/account-helpers` | Wąskie pomocniki listy kont i akcji konta |
    | `plugin-sdk/access-groups` | Pomocniki parsowania listy dozwolonych grup dostępu i zredagowanej diagnostyki grup |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Współdzielone prymitywy schematu konfiguracji kanału oraz konstruktory Zod i bezpośrednie JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Schematy konfiguracji kanałów dołączonych do OpenClaw tylko dla utrzymywanych dołączonych pluginów |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Kanoniczne identyfikatory dołączonych/oficjalnych kanałów czatu oraz etykiety/aliasy formattera dla pluginów, które muszą rozpoznawać tekst z prefiksem koperty bez twardego kodowania własnej tabeli. |
    | `plugin-sdk/channel-config-schema-legacy` | Przestarzały alias zgodności dla schematów konfiguracji kanałów dołączonych |
    | `plugin-sdk/telegram-command-config` | Pomocniki normalizacji/walidacji niestandardowych poleceń Telegram z fallbackiem kontraktu dołączonego |
    | `plugin-sdk/command-gating` | Wąskie pomocniki bramki autoryzacji poleceń |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Przestarzała niskopoziomowa fasada zgodności wejścia kanału. Nowe ścieżki odbioru powinny używać `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Eksperymentalny wysokopoziomowy resolver runtime wejścia kanału i konstruktory faktów tras dla zmigrowanych ścieżek odbioru kanału. Preferuj to zamiast składania efektywnych list dozwolonych, list dozwolonych poleceń i starszych projekcji w każdym pluginie. Zobacz [API wejścia kanału](/pl/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Kontrakty cyklu życia wiadomości oraz opcje potoku odpowiedzi, potwierdzenia, podgląd/streaming na żywo, pomocniki cyklu życia, tożsamość wychodząca, planowanie payloadu, trwałe wysyłki i pomocniki kontekstu wysyłania wiadomości. Zobacz [API wyjścia kanału](/pl/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Przestarzały alias zgodności dla `plugin-sdk/channel-outbound` oraz starszych fasad dispatchu odpowiedzi. |
    | `plugin-sdk/channel-message-runtime` | Przestarzały alias zgodności dla `plugin-sdk/channel-outbound` oraz starszych fasad dispatchu odpowiedzi. |
    | `plugin-sdk/inbound-envelope` | Współdzielone pomocniki trasy przychodzącej i konstruktora koperty |
    | `plugin-sdk/inbound-reply-dispatch` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-inbound` dla runnerów przychodzących i predykatów dispatchu oraz `plugin-sdk/channel-outbound` dla pomocników dostarczania wiadomości. |
    | `plugin-sdk/messaging-targets` | Przestarzały alias parsowania celu; użyj `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Współdzielone pomocniki ładowania mediów wychodzących i stanu hostowanych mediów |
    | `plugin-sdk/outbound-send-deps` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Wąskie pomocniki normalizacji ankiet |
    | `plugin-sdk/thread-bindings-runtime` | Pomocniki cyklu życia powiązań wątków i adaptera |
    | `plugin-sdk/agent-media-payload` | Starszy konstruktor payloadu mediów agenta |
    | `plugin-sdk/conversation-runtime` | Pomocniki konwersacji/powiązania wątku, parowania i skonfigurowanego powiązania |
    | `plugin-sdk/runtime-config-snapshot` | Pomocnik migawki konfiguracji runtime |
    | `plugin-sdk/runtime-group-policy` | Pomocniki rozwiązywania zasad grup runtime |
    | `plugin-sdk/channel-status` | Współdzielone pomocniki migawki/podsumowania stanu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Pomocniki autoryzacji zapisu konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty prelude pluginu kanału |
    | `plugin-sdk/allowlist-config-edit` | Pomocniki edycji/odczytu konfiguracji listy dozwolonych |
    | `plugin-sdk/group-access` | Współdzielone pomocniki decyzji dostępu grup |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Przestarzałe fasady zgodności. Użyj `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Wąskie pomocniki zasad ochrony direct-DM przed kryptografią |
    | `plugin-sdk/discord` | Przestarzała fasada zgodności Discord dla opublikowanego `@openclaw/discord@2026.3.13` i śledzonej zgodności właściciela; nowe pluginy powinny używać ogólnych podścieżek SDK kanału |
    | `plugin-sdk/telegram-account` | Przestarzała fasada zgodności rozwiązywania kont Telegram dla śledzonej zgodności właściciela; nowe pluginy powinny używać wstrzykniętych pomocników runtime albo ogólnych podścieżek SDK kanału |
    | `plugin-sdk/zalouser` | Przestarzała fasada zgodności Zalo Personal dla opublikowanych pakietów Lark/Zalo, które nadal importują autoryzację poleceń nadawcy; nowe pluginy powinny używać `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Semantyczna prezentacja i dostarczanie wiadomości oraz starsze pomocniki interaktywnych odpowiedzi. Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Współdzielone pomocniki przychodzące do klasyfikacji zdarzeń, budowania kontekstu, formatowania, korzeni, debounce, dopasowywania wzmianek, zasad wzmianek i logowania przychodzącego |
    | `plugin-sdk/channel-inbound-debounce` | Wąskie pomocniki debounce przychodzącego |
    | `plugin-sdk/channel-mention-gating` | Wąskie pomocniki zasad wzmianek, znaczników wzmianek i tekstu wzmianek bez szerszej powierzchni runtime przychodzącego |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Przestarzałe fasady zgodności. Użyj `plugin-sdk/channel-inbound` albo `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | Pomocniki akcji wiadomości kanału oraz przestarzałe pomocniki natywnego schematu zachowane dla zgodności pluginów |
    | `plugin-sdk/channel-route` | Współdzielona normalizacja tras, rozwiązywanie celów sterowane parserem, stringifikacja identyfikatorów wątków, klucze tras do deduplikacji/kompaktowania, typy sparsowanych celów oraz pomocniki porównywania tras/celów |
    | `plugin-sdk/channel-targets` | Pomocniki parsowania celów; wywołania porównania tras powinny używać `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Typy kontraktów kanału |
    | `plugin-sdk/channel-feedback` | Okablowanie opinii/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie pomocniki kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` oraz typy celów sekretów |
  </Accordion>

Przestarzałe rodziny pomocników kanału pozostają dostępne tylko na potrzeby
zgodności opublikowanych pluginów. Plan usunięcia jest następujący: zachować je
przez okno migracji zewnętrznych pluginów, utrzymywać pluginy z repozytorium i
dołączone pluginy na `channel-inbound` oraz `channel-outbound`, a następnie
usunąć podścieżki zgodności podczas następnego większego czyszczenia SDK.
Dotyczy to starych rodzin komunikatów/runtime kanału, streamingu kanału,
dostępu direct-DM, odłamów pomocników przychodzących, opcji odpowiedzi
i ścieżek parowania.

  <Accordion title="Podścieżki dostawcy">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Obsługiwana fasada dostawcy LM Studio do konfiguracji, wykrywania katalogu i przygotowywania modelu w środowisku uruchomieniowym |
    | `plugin-sdk/lmstudio-runtime` | Obsługiwana fasada środowiska uruchomieniowego LM Studio do domyślnych ustawień serwera lokalnego, wykrywania modeli, nagłówków żądań i pomocników załadowanych modeli |
    | `plugin-sdk/provider-setup` | Wyselekcjonowani pomocnicy konfiguracji lokalnych/samodzielnie hostowanych dostawców |
    | `plugin-sdk/self-hosted-provider-setup` | Wyspecjalizowani pomocnicy konfiguracji samodzielnie hostowanych dostawców zgodnych z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI + stałe mechanizmu watchdog |
    | `plugin-sdk/provider-auth-runtime` | Pomocnicy rozwiązywania kluczy API w środowisku uruchomieniowym dla Pluginów dostawców |
    | `plugin-sdk/provider-oauth-runtime` | Ogólne typy wywołań zwrotnych OAuth dostawcy, renderowanie strony wywołania zwrotnego, pomocnicy PKCE/stanu, parsowanie danych wejściowych autoryzacji, pomocnicy wygasania tokenów i pomocnicy przerywania |
    | `plugin-sdk/provider-auth-api-key` | Pomocnicy onboardingu klucza API/zapisu profilu, tacy jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy konstruktor wyniku uwierzytelniania OAuth |
    | `plugin-sdk/provider-env-vars` | Pomocnicy wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, pomocnicy importu uwierzytelniania OpenAI Codex, przestarzały eksport zgodności `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory polityki odtwarzania, pomocnicy punktów końcowych dostawcy i współdzieleni pomocnicy normalizacji identyfikatorów modeli |
    | `plugin-sdk/provider-catalog-live-runtime` | Pomocnicy katalogu modeli dostawcy na żywo do strzeżonego wykrywania w stylu `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrowanie identyfikatorów modeli, pamięć podręczna TTL i statyczna ścieżka awaryjna |
    | `plugin-sdk/provider-catalog-runtime` | Hak środowiska uruchomieniowego rozszerzania katalogu dostawcy i styki rejestru Pluginów dostawcy do testów kontraktu |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ogólni pomocnicy możliwości HTTP/punktów końcowych dostawcy, błędy HTTP dostawcy i pomocnicy formularzy wieloczęściowych transkrypcji audio |
    | `plugin-sdk/provider-web-fetch-contract` | Wąscy pomocnicy kontraktu konfiguracji/wyboru pobierania z sieci, tacy jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Pomocnicy rejestracji/pamięci podręcznej dostawcy pobierania z sieci |
    | `plugin-sdk/provider-web-search-config-contract` | Wąscy pomocnicy konfiguracji/poświadczeń wyszukiwania w sieci dla dostawców, którzy nie potrzebują okablowania włączania Pluginu |
    | `plugin-sdk/provider-web-search-contract` | Wąscy pomocnicy kontraktu konfiguracji/poświadczeń wyszukiwania w sieci, tacy jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz ustawiające/pobierające funkcje poświadczeń o ograniczonym zakresie |
    | `plugin-sdk/provider-web-search` | Pomocnicy rejestracji/pamięci podręcznej/środowiska uruchomieniowego dostawcy wyszukiwania w sieci |
    | `plugin-sdk/embedding-providers` | Ogólne typy dostawców embeddingów i pomocnicy odczytu, w tym `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` i `listEmbeddingProviders(...)`; Pluginy rejestrują dostawców przez `api.registerEmbeddingProvider(...)`, dzięki czemu wymuszana jest własność manifestu |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` oraz czyszczenie schematów + diagnostyka DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Typy migawek użycia dostawcy, współdzieleni pomocnicy pobierania użycia i funkcje pobierające dostawców, takie jak `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy opakowań strumieni, zgodność wywołań narzędzi w zwykłym tekście oraz współdzieleni pomocnicy opakowań Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Publiczni współdzieleni pomocnicy opakowań strumieni dostawcy, w tym `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` oraz narzędzia strumieni zgodnych z Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Natywni pomocnicy transportu dostawcy, tacy jak strzeżone pobieranie, transformacje komunikatów transportowych i zapisywalne strumienie zdarzeń transportu |
    | `plugin-sdk/provider-onboard` | Pomocnicy łatania konfiguracji onboardingu |
    | `plugin-sdk/global-singleton` | Pomocnicy singletonów/map/pamięci podręcznych lokalnych dla procesu |
    | `plugin-sdk/group-activation` | Wąscy pomocnicy trybu aktywacji grupy i parsowania poleceń |
  </Accordion>

Migawki użycia dostawcy zwykle raportują jedno lub więcej `windows` limitów, każde z
etykietą, procentem użycia i opcjonalnym czasem resetu. Dostawcy, którzy zamiast
resetowalnych okien limitów udostępniają tekst salda lub stanu konta, powinni zwracać
`summary` z pustą tablicą `windows`, zamiast fabrykować wartości procentowe.
OpenClaw wyświetla ten tekst podsumowania w danych wyjściowych statusu; używaj `error` tylko wtedy, gdy
punkt końcowy użycia nie powiódł się lub nie zwrócił użytecznych danych użycia.

  <Accordion title="Podścieżki uwierzytelniania i zabezpieczeń">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, pomocnicy rejestru poleceń, w tym dynamiczne formatowanie menu argumentów, pomocnicy autoryzacji nadawcy |
    | `plugin-sdk/command-status` | Konstruktory komunikatów poleceń/pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Pomocnicy rozwiązywania zatwierdzających i uwierzytelniania akcji w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Pomocnicy natywnego profilu/filtra zatwierdzeń exec |
    | `plugin-sdk/approval-delivery-runtime` | Natywne adaptery możliwości/dostarczania zatwierdzeń |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony pomocnik rozwiązywania Gateway zatwierdzeń |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie pomocniki ładowania natywnego adaptera zatwierdzeń dla gorących punktów wejścia kanałów |
    | `plugin-sdk/approval-handler-runtime` | Szersi pomocnicy środowiska uruchomieniowego obsługi zatwierdzeń; preferuj węższe styki adaptera/Gateway, gdy są wystarczające |
    | `plugin-sdk/approval-native-runtime` | Pomocnicy natywnego celu zatwierdzenia, powiązania konta, bramki trasy, awaryjnego przekazywania i tłumienia lokalnego natywnego promptu exec |
    | `plugin-sdk/approval-reaction-runtime` | Zakodowane na stałe powiązania reakcji zatwierdzeń, ładunki promptów reakcji, magazyny celów reakcji i eksport zgodności dla tłumienia lokalnego natywnego promptu exec |
    | `plugin-sdk/approval-reply-runtime` | Pomocnicy ładunków odpowiedzi zatwierdzeń exec/Pluginu |
    | `plugin-sdk/approval-runtime` | Pomocnicy ładunków zatwierdzeń exec/Pluginu, pomocnicy routingu/środowiska uruchomieniowego natywnych zatwierdzeń oraz pomocnicy strukturalnego wyświetlania zatwierdzeń, tacy jak `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Wąscy pomocnicy resetowania deduplikacji odpowiedzi przychodzących |
    | `plugin-sdk/channel-contract-testing` | Wąscy pomocnicy testów kontraktu kanału bez szerokiego barrela testowego |
    | `plugin-sdk/command-auth-native` | Natywne uwierzytelnianie poleceń, dynamiczne formatowanie menu argumentów i natywni pomocnicy celu sesji |
    | `plugin-sdk/command-detection` | Współdzieleni pomocnicy wykrywania poleceń |
    | `plugin-sdk/command-primitives-runtime` | Lekkie predykaty tekstu poleceń dla gorących ścieżek kanałów |
    | `plugin-sdk/command-surface` | Normalizacja treści polecenia i pomocnicy powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąscy pomocnicy zbierania kontraktu sekretów dla powierzchni sekretów kanału/Pluginu |
    | `plugin-sdk/secret-ref-runtime` | Wąscy pomocnicy `coerceSecretRef` i typowania SecretRef do parsowania kontraktu sekretów/konfiguracji |
    | `plugin-sdk/secret-provider-integration` | Manifest integracji dostawcy SecretRef tylko dla typów i kontrakty presetów dla Pluginów, które publikują presety zewnętrznych dostawców sekretów |
    | `plugin-sdk/security-runtime` | Współdzielone zaufanie, bramkowanie DM, pomocnicy plików/ścieżek ograniczonych do katalogu głównego, w tym zapisy tylko przy tworzeniu, synchroniczna/asynchroniczna atomowa zamiana plików, zapisy do tymczasowych plików siostrzanych, awaryjne przenoszenie między urządzeniami, pomocnicy prywatnego magazynu plików, osłony nadrzędnych dowiązań symbolicznych, treści zewnętrzne, redakcja tekstu wrażliwego, porównywanie sekretów w stałym czasie i pomocnicy zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Pomocnicy listy dozwolonych hostów i polityki SSRF dla sieci prywatnych |
    | `plugin-sdk/ssrf-dispatcher` | Wąscy pomocnicy przypiętego dyspozytora bez szerokiej powierzchni środowiska uruchomieniowego infrastruktury |
    | `plugin-sdk/ssrf-runtime` | Przypięty dyspozytor, pobieranie strzeżone przez SSRF, błąd SSRF i pomocnicy polityki SSRF |
    | `plugin-sdk/secret-input` | Pomocnicy parsowania danych wejściowych sekretów |
    | `plugin-sdk/webhook-ingress` | Pomocnicy żądań/celów Webhook i koercja surowego websocket/treści |
    | `plugin-sdk/webhook-request-guards` | Pomocnicy rozmiaru/limitu czasu treści żądania |
  </Accordion>

  <Accordion title="Podścieżki środowiska uruchomieniowego i pamięci">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie helpery środowiska uruchomieniowego, logowania, kopii zapasowych i instalacji pluginów |
    | `plugin-sdk/runtime-env` | Wąskie helpery env środowiska uruchomieniowego, loggera, limitu czasu, ponawiania i wycofywania |
    | `plugin-sdk/browser-config` | Obsługiwana fasada konfiguracji przeglądarki dla znormalizowanych profili/wartości domyślnych, parsowania adresu URL CDP i helperów uwierzytelniania sterowania przeglądarką |
    | `plugin-sdk/agent-harness-task-runtime` | Ogólne helpery cyklu życia zadania i dostarczania ukończenia dla agentów opartych na harnessie, używających zakresu zadania wydanego przez hosta |
    | `plugin-sdk/codex-mcp-projection` | Zarezerwowany, dołączany helper Codex do rzutowania konfiguracji serwera MCP użytkownika na konfigurację wątku Codex; nie dla pluginów innych firm |
    | `plugin-sdk/codex-native-task-runtime` | Prywatny, dołączany helper Codex do natywnego okablowania lustra zadania/środowiska uruchomieniowego; nie dla pluginów innych firm |
    | `plugin-sdk/channel-runtime-context` | Ogólne helpery rejestracji i wyszukiwania kontekstu środowiska uruchomieniowego kanału |
    | `plugin-sdk/matrix` | Przestarzała fasada zgodności Matrix dla starszych pakietów kanałów innych firm; nowe pluginy powinny importować `plugin-sdk/run-command` bezpośrednio |
    | `plugin-sdk/mattermost` | Przestarzała fasada zgodności Mattermost dla starszych pakietów kanałów innych firm; nowe pluginy powinny importować ogólne podścieżki SDK bezpośrednio |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Wspólne helpery poleceń/hooków/http/interakcji pluginów |
    | `plugin-sdk/hook-runtime` | Wspólne helpery potoku webhooków/wewnętrznych hooków |
    | `plugin-sdk/lazy-runtime` | Helpery leniwego importu/wiązania środowiska uruchomieniowego, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpery wykonywania procesów |
    | `plugin-sdk/cli-runtime` | Helpery formatowania CLI, oczekiwania, wersji, wywołania z argumentami i leniwych grup poleceń |
    | `plugin-sdk/qa-live-transport-scenarios` | Wspólne identyfikatory scenariuszy QA transportu live, helpery pokrycia bazowego i helper wyboru scenariusza |
    | `plugin-sdk/gateway-method-runtime` | Zarezerwowany helper wysyłania metod Gateway dla tras HTTP pluginów, które deklarują `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Klient Gateway, helper uruchamiania klienta gotowego na pętlę zdarzeń, RPC CLI Gateway, błędy protokołu Gateway i helpery poprawek statusu kanału |
    | `plugin-sdk/config-contracts` | Skupiona, wyłącznie typowa powierzchnia konfiguracji dla kształtów konfiguracji pluginów, takich jak `OpenClawConfig`, oraz typów konfiguracji kanałów/dostawców |
    | `plugin-sdk/plugin-config-runtime` | Helpery wyszukiwania konfiguracji pluginów w środowisku uruchomieniowym, takie jak `requireRuntimeConfig`, `resolvePluginConfigObject` i `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transakcyjne helpery mutacji konfiguracji, takie jak `mutateConfigFile`, `replaceConfigFile` i `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Wspólne ciągi podpowiedzi metadanych dostarczania message-tool |
    | `plugin-sdk/runtime-config-snapshot` | Helpery migawki konfiguracji bieżącego procesu, takie jak `getRuntimeConfig`, `getRuntimeConfigSnapshot`, oraz settery migawek testowych |
    | `plugin-sdk/telegram-command-config` | Normalizacja nazw/opisów poleceń Telegram i sprawdzanie duplikatów/konfliktów, nawet gdy dołączana powierzchnia kontraktu Telegram jest niedostępna |
    | `plugin-sdk/text-autolink-runtime` | Wykrywanie autolinków odwołań do plików bez szerokiego barrela tekstowego |
    | `plugin-sdk/approval-reaction-runtime` | Zakodowane na stałe wiązania reakcji zatwierdzeń, ładunki promptów reakcji, magazyny celów reakcji i eksport zgodności do tłumienia lokalnych natywnych promptów exec |
    | `plugin-sdk/approval-runtime` | Helpery zatwierdzania exec/pluginów, buildery capability zatwierdzania, helpery auth/profili, helpery routingu/środowiska uruchomieniowego natywnego oraz formatowanie ścieżek wyświetlania ustrukturyzowanych zatwierdzeń |
    | `plugin-sdk/reply-runtime` | Wspólne helpery środowiska uruchomieniowego przychodzących wiadomości/odpowiedzi, dzielenie na fragmenty, wysyłka, Heartbeat, planer odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery wysyłki/finalizacji odpowiedzi i etykiet konwersacji |
    | `plugin-sdk/reply-history` | Wspólne helpery historii odpowiedzi z krótkiego okna. Nowy kod tur wiadomości powinien używać `createChannelHistoryWindow`; helpery map niższego poziomu pozostają wyłącznie przestarzałymi eksportami zgodności |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie helpery dzielenia tekstu/markdownu na fragmenty |
    | `plugin-sdk/session-store-runtime` | Helpery przepływu pracy sesji (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), ograniczone odczyty tekstu transkrypcji ostatniego użytkownika/asystenta według tożsamości sesji, starsze helpery ścieżki magazynu sesji/klucza sesji, odczyty updated-at oraz przejściowe helpery zgodności całego magazynu/ścieżki pliku |
    | `plugin-sdk/session-transcript-runtime` | Tożsamość transkrypcji, helpery zakresowego celu/odczytu/zapisu, publikowanie aktualizacji, blokady zapisu i klucze trafień pamięci transkrypcji |
    | `plugin-sdk/sqlite-runtime` | Skupione helpery schematu agenta SQLite, ścieżek i transakcji dla własnego środowiska uruchomieniowego |
    | `plugin-sdk/cron-store-runtime` | Helpery ścieżki/ładowania/zapisywania magazynu Cron |
    | `plugin-sdk/state-paths` | Helpery ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Typy stanów kluczowanych bocznej bazy SQLite pluginu oraz scentralizowana konfiguracja pragma połączenia i utrzymania WAL dla baz danych należących do pluginów |
    | `plugin-sdk/routing` | Helpery wiązania trasy/klucza sesji/konta, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Wspólne helpery podsumowania statusu kanału/konta, domyślne wartości stanu środowiska uruchomieniowego i helpery metadanych problemu |
    | `plugin-sdk/target-resolver-runtime` | Wspólne helpery resolvera celu |
    | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji sluga/ciągów |
    | `plugin-sdk/request-url` | Wyodrębnianie ciągów URL z wejść podobnych do fetch/request |
    | `plugin-sdk/run-command` | Runner poleceń z limitem czasu i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Wspólne czytniki parametrów narzędzi/CLI |
    | `plugin-sdk/tool-plugin` | Definiowanie prostego typowanego pluginu narzędzia agenta i udostępnianie statycznych metadanych do generowania manifestu |
    | `plugin-sdk/tool-payload` | Wyodrębnianie znormalizowanych ładunków z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłania z argumentów narzędzia |
    | `plugin-sdk/sandbox` | Typy backendu piaskownicy oraz helpery poleceń SSH/OpenShell, w tym szybki preflight polecenia exec kończący się niepowodzeniem |
    | `plugin-sdk/temp-path` | Wspólne helpery ścieżek pobrań tymczasowych i prywatne bezpieczne tymczasowe przestrzenie robocze |
    | `plugin-sdk/logging-core` | Logger podsystemu i helpery redakcji |
    | `plugin-sdk/markdown-table-runtime` | Helpery trybu tabel Markdown i konwersji |
    | `plugin-sdk/model-session-runtime` | Helpery nadpisywania modelu/sesji, takie jak `applyModelOverrideToSessionEntry` i `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Helpery rozpoznawania konfiguracji dostawcy Talk |
    | `plugin-sdk/json-store` | Małe helpery odczytu/zapisu stanu JSON |
    | `plugin-sdk/json-unsafe-integers` | Helpery parsowania JSON, które zachowują niebezpieczne literały całkowite jako ciągi |
    | `plugin-sdk/file-lock` | Helpery reentrant blokady pliku |
    | `plugin-sdk/persistent-dedupe` | Helpery cache deduplikacji opartych na dysku |
    | `plugin-sdk/acp-runtime` | Helpery środowiska uruchomieniowego/sesji ACP i wysyłki odpowiedzi |
    | `plugin-sdk/acp-runtime-backend` | Lekkie helpery rejestracji backendu ACP i wysyłki odpowiedzi dla pluginów ładowanych przy starcie |
    | `plugin-sdk/acp-binding-resolve-runtime` | Tylko do odczytu rozpoznawanie wiązań ACP bez importów uruchamiania cyklu życia |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji środowiska uruchomieniowego agenta |
    | `plugin-sdk/boolean-param` | Luźny czytnik parametrów boolean |
    | `plugin-sdk/dangerous-name-runtime` | Helpery rozpoznawania dopasowania dangerous-name |
    | `plugin-sdk/device-bootstrap` | Helpery bootstrapu urządzenia i tokenów parowania |
    | `plugin-sdk/extension-shared` | Wspólne prymitywy kanału pasywnego, statusu i pomocnika ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Helpery odpowiedzi polecenia/dostawcy `/models` |
    | `plugin-sdk/skill-commands-runtime` | Helpery listowania poleceń Skill |
    | `plugin-sdk/native-command-registry` | Helpery rejestru/budowania/serializacji natywnych poleceń |
    | `plugin-sdk/agent-harness` | Eksperymentalna powierzchnia zaufanych pluginów dla niskopoziomowych harnessów agentów: typy harnessu, helpery sterowania/przerywania aktywnego uruchomienia, helpery mostu narzędzi OpenClaw, helpery polityki narzędzi planu środowiska uruchomieniowego, klasyfikacja wyniku terminala, helpery formatowania/szczegółów postępu narzędzi i narzędzia wyników prób |
    | `plugin-sdk/provider-zai-endpoint` | Przestarzała fasada wykrywania endpointu należącego do dostawcy Z.AI; użyj publicznego API pluginu Z.AI |
    | `plugin-sdk/async-lock-runtime` | Helper asynchronicznej blokady lokalnej dla procesu dla małych plików stanu środowiska uruchomieniowego |
    | `plugin-sdk/channel-activity-runtime` | Helper telemetrii aktywności kanału |
    | `plugin-sdk/concurrency-runtime` | Helper ograniczonej współbieżności zadań asynchronicznych |
    | `plugin-sdk/dedupe-runtime` | Helpery cache deduplikacji w pamięci |
    | `plugin-sdk/delivery-queue-runtime` | Helper opróżniania oczekującego dostarczania wychodzącego |
    | `plugin-sdk/file-access-runtime` | Helpery bezpiecznych ścieżek plików lokalnych i źródeł multimediów |
    | `plugin-sdk/heartbeat-runtime` | Helpery wybudzania, zdarzeń i widoczności Heartbeat |
    | `plugin-sdk/number-runtime` | Helper koercji liczbowej |
    | `plugin-sdk/secure-random-runtime` | Helpery bezpiecznych tokenów/UUID |
    | `plugin-sdk/system-event-runtime` | Helpery kolejki zdarzeń systemowych |
    | `plugin-sdk/transport-ready-runtime` | Helper oczekiwania na gotowość transportu |
    | `plugin-sdk/exec-approvals-runtime` | Helpery pliku polityki zatwierdzeń exec bez szerokiego barrela infra-runtime |
    | `plugin-sdk/infra-runtime` | Przestarzały shim zgodności; użyj skupionych podścieżek środowiska uruchomieniowego powyżej |
    | `plugin-sdk/collection-runtime` | Małe helpery ograniczonego cache |
    | `plugin-sdk/diagnostic-runtime` | Helpery flag diagnostycznych, zdarzeń i kontekstu śledzenia |
    | `plugin-sdk/error-runtime` | Graf błędów, formatowanie, wspólne helpery klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Opakowany fetch, proxy, opcja EnvHttpProxyAgent i helpery przypiętego wyszukiwania |
    | `plugin-sdk/runtime-fetch` | Świadomy dispatchera fetch środowiska uruchomieniowego bez importów proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer inline image data URL i helpery wykrywania sygnatur bez szerokiej powierzchni środowiska uruchomieniowego mediów |
    | `plugin-sdk/response-limit-runtime` | Ograniczony czytnik treści odpowiedzi bez szerokiej powierzchni środowiska uruchomieniowego mediów |
    | `plugin-sdk/session-binding-runtime` | Bieżący stan wiązania konwersacji bez skonfigurowanego routingu wiązań ani magazynów parowania |
    | `plugin-sdk/session-store-runtime` | Helpery magazynu sesji bez szerokich importów zapisów/utrzymania konfiguracji |
    | `plugin-sdk/sqlite-runtime` | Skupione helpery schematu agenta SQLite, ścieżek i transakcji bez kontroli cyklu życia bazy danych |
    | `plugin-sdk/context-visibility-runtime` | Rozpoznawanie widoczności kontekstu i filtrowanie kontekstu uzupełniającego bez szerokich importów konfiguracji/bezpieczeństwa |
    | `plugin-sdk/string-coerce-runtime` | Wąskie helpery koercji i normalizacji rekordów prymitywnych/ciągów bez importów markdownu/logowania |
    | `plugin-sdk/host-runtime` | Helpery normalizacji nazwy hosta i hosta SCP |
    | `plugin-sdk/retry-runtime` | Helpery konfiguracji ponawiania i runnera ponawiania |
    | `plugin-sdk/agent-runtime` | Helpery katalogu/tożsamości/przestrzeni roboczej agenta, w tym `resolveAgentDir`, `resolveDefaultAgentDir` i przestarzały eksport zgodności `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Zapytanie/deduplikacja katalogów oparte na konfiguracji |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Ścieżki podrzędne funkcji i testowania">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Współdzielone pomocniki pobierania/przekształcania/przechowywania multimediów, w tym `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` oraz przestarzałe `fetchRemoteMedia`; preferuj pomocniki magazynu przed odczytami bufora, gdy URL ma stać się multimedium OpenClaw |
    | `plugin-sdk/media-mime` | Wąska normalizacja MIME, mapowanie rozszerzeń plików, wykrywanie MIME i pomocniki rodzaju multimediów |
    | `plugin-sdk/media-store` | Wąskie pomocniki magazynu multimediów, takie jak `saveMediaBuffer` i `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Współdzielone pomocniki przełączania awaryjnego generowania multimediów, wybór kandydatów i komunikaty o brakującym modelu |
    | `plugin-sdk/media-understanding` | Typy dostawców rozumienia multimediów oraz eksporty pomocników obrazów/audio/ekstrakcji strukturalnej dla dostawców |
    | `plugin-sdk/text-chunking` | Pomocniki dzielenia/renderowania tekstu i markdown, konwersja tabel markdown, usuwanie tagów dyrektyw oraz narzędzia bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Pomocnik dzielenia tekstu wychodzącego |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz eksporty dyrektyw, rejestru, walidacji, konstruktora TTS zgodnego z OpenAI i pomocników mowy dla dostawców |
    | `plugin-sdk/speech-core` | Współdzielone typy dostawców mowy, rejestr, dyrektywa, normalizacja i eksporty pomocników mowy |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji w czasie rzeczywistym, pomocniki rejestru i współdzielony pomocnik sesji WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Pomocnik inicjalizacji profilu czasu rzeczywistego do ograniczonego wstrzykiwania kontekstu `IDENTITY.md`, `USER.md` i `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu w czasie rzeczywistym, pomocniki rejestru i współdzielone pomocniki zachowania głosu w czasie rzeczywistym, w tym śledzenie aktywności wyjściowej |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów oraz pomocniki zasobów obrazów/adresów URL danych i konstruktor dostawcy obrazów zgodny z OpenAI |
    | `plugin-sdk/image-generation-core` | Współdzielone typy generowania obrazów, przełączanie awaryjne, uwierzytelnianie i pomocniki rejestru |
    | `plugin-sdk/music-generation` | Typy dostawców/żądań/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Współdzielone typy generowania muzyki, pomocniki przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie odwołań do modelu |
    | `plugin-sdk/video-generation` | Typy dostawców/żądań/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo, pomocniki przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie odwołań do modelu |
    | `plugin-sdk/transcripts` | Współdzielone typy dostawców źródeł transkrypcji, pomocniki rejestru, deskryptory sesji i metadane wypowiedzi |
    | `plugin-sdk/webhook-targets` | Rejestr celów Webhook i pomocniki instalowania tras |
    | `plugin-sdk/webhook-path` | Przestarzały alias zgodności; użyj `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Współdzielone pomocniki ładowania zdalnych/lokalnych multimediów |
    | `plugin-sdk/zod` | Przestarzały reeksport zgodności; importuj `zod` bezpośrednio z `zod` |
    | `plugin-sdk/testing` | Lokalny dla repozytorium przestarzały barrel zgodności dla starszych testów OpenClaw. Nowe testy repozytorium powinny zamiast tego importować ukierunkowane lokalne ścieżki podrzędne testów, takie jak `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` lub `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Lokalny dla repozytorium minimalny pomocnik `createTestPluginApi` do bezpośrednich testów jednostkowych rejestracji Plugin bez importowania mostków pomocników testowych repozytorium |
    | `plugin-sdk/agent-runtime-test-contracts` | Lokalne dla repozytorium natywne fixtures kontraktów adaptera środowiska uruchomieniowego agenta dla testów uwierzytelniania, dostarczania, fallbacku, hooków narzędzi, nakładki promptu, schematu i projekcji transkrypcji |
    | `plugin-sdk/channel-test-helpers` | Lokalne dla repozytorium pomocniki testowe zorientowane na kanały dla kontraktów ogólnych akcji/konfiguracji/statusu, asercji katalogów, cyklu życia uruchamiania konta, wątkowania konfiguracji wysyłania, mocków środowiska uruchomieniowego, problemów statusu, dostarczania wychodzącego i rejestracji hooków |
    | `plugin-sdk/channel-target-testing` | Lokalny dla repozytorium współdzielony zestaw przypadków błędów rozpoznawania celów dla testów kanałów |
    | `plugin-sdk/plugin-test-contracts` | Lokalne dla repozytorium pomocniki kontraktów pakietu Plugin, rejestracji, artefaktu publicznego, bezpośredniego importu, API środowiska uruchomieniowego i efektów ubocznych importu |
    | `plugin-sdk/provider-test-contracts` | Lokalne dla repozytorium pomocniki kontraktów środowiska uruchomieniowego dostawcy, uwierzytelniania, odkrywania, onboardingu, katalogu, kreatora, funkcji multimedialnych, zasad odtwarzania, STT audio na żywo w czasie rzeczywistym, wyszukiwania/pobierania z sieci i strumienia |
    | `plugin-sdk/provider-http-test-mocks` | Lokalne dla repozytorium opcjonalne mocki HTTP/uwierzytelniania Vitest dla testów dostawców, które wykonują `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Lokalne dla repozytorium ogólne fixtures przechwytywania środowiska uruchomieniowego CLI, kontekstu sandboxa, zapisu Skills, wiadomości agenta, zdarzeń systemowych, przeładowania modułów, ścieżki dołączonego Plugin, tekstu terminala, dzielenia, tokenu uwierzytelniania i typowanych przypadków |
    | `plugin-sdk/test-node-mocks` | Lokalne dla repozytorium ukierunkowane pomocniki mocków wbudowanych Node do użycia wewnątrz fabryk Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Ścieżki podrzędne pamięci">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Dołączona powierzchnia pomocników memory-core dla pomocników menedżera/konfiguracji/plików/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada środowiska uruchomieniowego indeksu/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-embedding-registry` | Lekkie pomocniki rejestru dostawców embeddingów pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika podstawowego hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrakty embeddingów hosta pamięci, dostęp do rejestru, lokalny dostawca oraz ogólne pomocniki wsadowe/zdalne. `registerMemoryEmbeddingProvider` na tej powierzchni jest przestarzałe; dla nowych dostawców użyj ogólnego API dostawcy embeddingów. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika magazynu hosta pamięci |
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
    | `plugin-sdk/memory-host-markdown` | Współdzielone pomocniki zarządzanego markdown dla Plugin sąsiadujących z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada środowiska uruchomieniowego aktywnej pamięci dla dostępu do menedżera wyszukiwania |
    | `plugin-sdk/memory-host-status` | Przestarzały alias zgodności; użyj `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Zarezerwowane ścieżki podrzędne dołączonych pomocników">
    Zarezerwowane ścieżki podrzędne SDK dołączonych pomocników są wąskimi powierzchniami specyficznymi dla właściciela dla
    kodu dołączonego Plugin. Są śledzone w inwentarzu SDK, aby kompilacje
    pakietów i aliasowanie pozostawały deterministyczne, ale nie są ogólnymi API
    tworzenia Plugin. Nowe kontrakty hosta wielokrotnego użytku powinny używać ogólnych ścieżek podrzędnych SDK,
    takich jak `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` i
    `plugin-sdk/plugin-config-runtime`.

    | Ścieżka podrzędna | Właściciel i przeznaczenie |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Pomocnik dołączonego Plugin Codex do projekcji konfiguracji serwera MCP użytkownika na konfigurację wątku serwera aplikacji Codex |
    | `plugin-sdk/codex-native-task-runtime` | Pomocnik dołączonego Plugin Codex do odzwierciedlania natywnych podagentów serwera aplikacji Codex w stanie zadań OpenClaw |

  </Accordion>
</AccordionGroup>

## Powiązane

- [Omówienie Plugin SDK](/pl/plugins/sdk-overview)
- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Budowanie Plugin](/pl/plugins/building-plugins)
