---
read_when:
    - Wybór właściwej podścieżki plugin-sdk dla importu pluginu
    - Audyt podścieżek dołączonych Pluginów i powierzchni pomocniczych
summary: 'Katalog podścieżek Plugin SDK: które importy znajdują się gdzie, pogrupowane według obszaru'
title: Podścieżki Plugin SDK
x-i18n:
    generated_at: "2026-07-01T20:38:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d67ec0c9d837fa23a80abe46e5bab981e82e6c7a29cfbf84ff47a9eca5cc582f
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

SDK pluginów jest udostępniany jako zestaw wąskich publicznych podścieżek w
`openclaw/plugin-sdk/`. Ta strona kataloguje najczęściej używane podścieżki pogrupowane według
przeznaczenia. Wygenerowany spis punktów wejścia kompilatora znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`; eksporty pakietu są publicznym podzbiorem
po odjęciu lokalnych dla repozytorium podścieżek testowych/wewnętrznych wymienionych w
`scripts/lib/plugin-sdk-private-local-only-subpaths.json`. Maintainerzy mogą audytować
liczbę publicznych eksportów poleceniem `pnpm plugin-sdk:surface` oraz aktywne zarezerwowane
podścieżki pomocnicze poleceniem `pnpm plugins:boundary-report:summary`; nieużywane zarezerwowane
eksporty pomocnicze powodują niepowodzenie raportu CI zamiast pozostawać w publicznym SDK jako
uśpiony dług kompatybilności.

Przewodnik po tworzeniu pluginów znajduje się w sekcji [Przegląd SDK Plugin](/pl/plugins/sdk-overview).

## Wejście Plugin

| Podścieżka                     | Kluczowe eksporty                                                                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | Pomocniki elementów dostawcy migracji, takie jak `createMigrationItem`, stałe powodów, znaczniki statusu elementów, pomocniki redagowania oraz `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | Pomocniki migracji środowiska uruchomieniowego, takie jak `copyMigrationFileItem`, `withCachedMigrationConfigRuntime` i `writeMigrationReport`                         |
| `plugin-sdk/health`            | Typy rejestracji kontroli kondycji doctor, wykrywania, naprawy, wyboru, ważności i ustaleń dla dołączonych konsumentów kondycji                                       |

### Przestarzała kompatybilność i pomocniki testowe

Przestarzałe podścieżki pozostają eksportowane dla starszych pluginów, ale nowy kod powinien używać
wyspecjalizowanych podścieżek SDK poniżej. Utrzymywana lista to
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI odrzuca importy z niej
w dołączonym kodzie produkcyjnym. Szerokie moduły zbiorcze, takie jak `compat`, `config-types`,
`infra-runtime`, `text-runtime` i `zod`, służą wyłącznie kompatybilności. Importuj `zod`
bezpośrednio z `zod`.

Podścieżki pomocników testowych OpenClaw oparte na Vitest są wyłącznie lokalne dla repozytorium i nie są
już eksportami pakietu: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-test-api`, `plugin-test-contracts`, `plugin-test-runtime`,
`provider-http-test-mocks`, `provider-test-contracts`, `test-env`,
`test-fixtures`, `test-node-mocks` oraz `testing`.

### Zarezerwowane podścieżki pomocnicze dołączonych pluginów

Te podścieżki są powierzchniami kompatybilności należącymi do pluginów dla ich dołączonych
pluginów właścicielskich, a nie ogólnymi API SDK: `plugin-sdk/codex-mcp-projection` i
`plugin-sdk/codex-native-task-runtime`. Importy rozszerzeń między właścicielami są blokowane
przez zabezpieczenia kontraktu pakietu.

<AccordionGroup>
  <Accordion title="Channel subpaths">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/json-schema-runtime` | Buforowany pomocnik walidacji JSON Schema dla schematów należących do pluginu |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone pomocniki kreatora konfiguracji, translator konfiguracji, monity listy dozwolonych, konstruktory statusu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Przestarzały alias zgodności; użyj `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Pomocniki konfiguracji i bramek akcji dla wielu kont, pomocniki fallbacku konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, pomocniki normalizacji identyfikatora konta |
    | `plugin-sdk/account-resolution` | Pomocniki wyszukiwania konta i domyślnego fallbacku |
    | `plugin-sdk/account-helpers` | Wąskie pomocniki list kont i akcji konta |
    | `plugin-sdk/access-groups` | Pomocniki parsowania listy dozwolonych grup dostępu i zredagowanej diagnostyki grup |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Współdzielone prymitywy schematu konfiguracji kanału oraz konstruktory Zod i bezpośrednie JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Schematy konfiguracji wbudowanych kanałów OpenClaw tylko dla utrzymywanych wbudowanych pluginów |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Kanoniczne identyfikatory wbudowanych/oficjalnych kanałów czatu oraz etykiety/aliasy formatujące dla pluginów, które muszą rozpoznawać tekst z prefiksem koperty bez kodowania własnej tabeli na sztywno. |
    | `plugin-sdk/channel-config-schema-legacy` | Przestarzały alias zgodności dla schematów konfiguracji wbudowanych kanałów |
    | `plugin-sdk/telegram-command-config` | Pomocniki normalizacji/walidacji własnych poleceń Telegram z fallbackiem kontraktu wbudowanego |
    | `plugin-sdk/command-gating` | Wąskie pomocniki bramki autoryzacji poleceń |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | Przestarzała niskopoziomowa fasada zgodności wejścia kanału. Nowe ścieżki odbioru powinny używać `plugin-sdk/channel-ingress-runtime`. |
    | `plugin-sdk/channel-ingress-runtime` | Eksperymentalny wysokopoziomowy resolver runtime wejścia kanału i konstruktory faktów trasy dla zmigrowanych ścieżek odbioru kanału. Preferuj to zamiast składania efektywnych list dozwolonych, list dozwolonych poleceń i starszych projekcji w każdym pluginie. Zobacz [API wejścia kanału](/pl/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Kontrakty cyklu życia wiadomości oraz opcje potoku odpowiedzi, potwierdzenia, podgląd/strumieniowanie na żywo, pomocniki cyklu życia, tożsamość wychodząca, planowanie ładunku, trwałe wysyłki i pomocniki kontekstu wysyłania wiadomości. Zobacz [API wychodzące kanału](/pl/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Przestarzały alias zgodności dla `plugin-sdk/channel-outbound` oraz starszych fasad wysyłania odpowiedzi. |
    | `plugin-sdk/channel-message-runtime` | Przestarzały alias zgodności dla `plugin-sdk/channel-outbound` oraz starszych fasad wysyłania odpowiedzi. |
    | `plugin-sdk/inbound-envelope` | Współdzielone pomocniki trasy przychodzącej i konstruktora koperty |
    | `plugin-sdk/inbound-reply-dispatch` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-inbound` dla runnerów przychodzących i predykatów wysyłki oraz `plugin-sdk/channel-outbound` dla pomocników dostarczania wiadomości. |
    | `plugin-sdk/messaging-targets` | Przestarzały alias parsowania celu; użyj `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Współdzielone pomocniki ładowania mediów wychodzących i stanu hostowanych mediów |
    | `plugin-sdk/outbound-send-deps` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Wąskie pomocniki normalizacji ankiet |
    | `plugin-sdk/thread-bindings-runtime` | Pomocniki cyklu życia powiązań wątków i adapterów |
    | `plugin-sdk/agent-media-payload` | Starszy konstruktor ładunku mediów agenta |
    | `plugin-sdk/conversation-runtime` | Pomocniki powiązań konwersacji/wątku, parowania i skonfigurowanych powiązań |
    | `plugin-sdk/runtime-config-snapshot` | Pomocnik migawki konfiguracji runtime |
    | `plugin-sdk/runtime-group-policy` | Pomocniki rozstrzygania polityki grup runtime |
    | `plugin-sdk/channel-status` | Współdzielone pomocniki migawki/podsumowania statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Pomocniki autoryzacji zapisu konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty prelude pluginu kanału |
    | `plugin-sdk/allowlist-config-edit` | Pomocniki edycji/odczytu konfiguracji listy dozwolonych |
    | `plugin-sdk/group-access` | Współdzielone pomocniki decyzji dostępu grupowego |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Przestarzałe fasady zgodności. Użyj `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Wąskie pomocniki polityki strażnika direct-DM przed kryptografią |
    | `plugin-sdk/discord` | Przestarzała fasada zgodności Discord dla opublikowanego `@openclaw/discord@2026.3.13` i śledzonej zgodności właściciela; nowe pluginy powinny używać ogólnych podścieżek SDK kanału |
    | `plugin-sdk/telegram-account` | Przestarzała fasada zgodności rozstrzygania kont Telegram dla śledzonej zgodności właściciela; nowe pluginy powinny używać wstrzykniętych pomocników runtime albo ogólnych podścieżek SDK kanału |
    | `plugin-sdk/zalouser` | Przestarzała fasada zgodności Zalo Personal dla opublikowanych pakietów Lark/Zalo, które nadal importują autoryzację poleceń nadawcy; nowe pluginy powinny używać `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | Semantyczna prezentacja wiadomości, dostarczanie i starsze interaktywne pomocniki odpowiedzi. Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Współdzielone pomocniki przychodzące do klasyfikacji zdarzeń, budowania kontekstu, formatowania, korzeni, debounce, dopasowywania wzmianek, polityki wzmianek i logowania przychodzącego |
    | `plugin-sdk/channel-inbound-debounce` | Wąskie pomocniki debounce przychodzącego |
    | `plugin-sdk/channel-mention-gating` | Wąskie pomocniki polityki wzmianek, znacznika wzmianki i tekstu wzmianki bez szerszej powierzchni runtime przychodzącego |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Przestarzałe fasady zgodności. Użyj `plugin-sdk/channel-inbound` albo `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Przestarzała fasada zgodności. Użyj `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | Pomocniki akcji wiadomości kanału oraz przestarzałe pomocniki natywnego schematu zachowane dla zgodności pluginów |
    | `plugin-sdk/channel-route` | Współdzielona normalizacja tras, rozstrzyganie celu sterowane parserem, zamiana identyfikatora wątku na ciąg, klucze tras dedupe/compact, typy sparsowanego celu oraz pomocniki porównywania tras/celów |
    | `plugin-sdk/channel-targets` | Pomocniki parsowania celów; wywołujący porównania tras powinni używać `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Typy kontraktu kanału |
    | `plugin-sdk/channel-feedback` | Okablowanie opinii/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie pomocniki kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` i typy celów sekretów |
  </Accordion>

Przestarzałe rodziny pomocników kanałów pozostają dostępne tylko dla zgodności
opublikowanych pluginów. Plan usunięcia jest następujący: zachować je przez
okno migracji zewnętrznych pluginów, utrzymać pluginy repozytorium/wbudowane na
`channel-inbound` i `channel-outbound`, a następnie usunąć podścieżki zgodności
podczas kolejnego dużego porządkowania SDK. Dotyczy to starych rodzin wiadomości/runtime
kanału, strumieniowania kanału, dostępu direct-DM, rozdzielonych pomocników
przychodzących, opcji odpowiedzi i ścieżek parowania.

  <Accordion title="Podścieżki dostawcy">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Obsługiwana fasada dostawcy LM Studio do konfiguracji, wykrywania katalogu i przygotowania modeli w środowisku wykonawczym |
    | `plugin-sdk/lmstudio-runtime` | Obsługiwana fasada środowiska wykonawczego LM Studio do domyślnych ustawień lokalnego serwera, wykrywania modeli, nagłówków żądań i pomocników załadowanych modeli |
    | `plugin-sdk/provider-setup` | Wyselekcjonowane pomocniki konfiguracji lokalnych/samodzielnie hostowanych dostawców |
    | `plugin-sdk/self-hosted-provider-setup` | Wyspecjalizowane pomocniki konfiguracji samodzielnie hostowanych dostawców zgodnych z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia zaplecza CLI + stałe watchdog |
    | `plugin-sdk/provider-auth-runtime` | Pomocniki rozwiązywania kluczy API w środowisku wykonawczym dla Pluginów dostawców |
    | `plugin-sdk/provider-oauth-runtime` | Ogólne typy wywołań zwrotnych OAuth dostawcy, renderowanie strony wywołania zwrotnego, pomocniki PKCE/stanu, parsowanie danych wejściowych autoryzacji, pomocniki wygaśnięcia tokenów i pomocniki przerywania |
    | `plugin-sdk/provider-auth-api-key` | Pomocniki wdrażania klucza API/zapisu profilu, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy konstruktor wyniku uwierzytelniania OAuth |
    | `plugin-sdk/provider-env-vars` | Pomocniki wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, pomocniki importu uwierzytelniania OpenAI Codex, przestarzały eksport zgodności `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory zasad powtórzeń, pomocniki punktów końcowych dostawcy i współdzielone pomocniki normalizacji identyfikatorów modeli |
    | `plugin-sdk/provider-catalog-live-runtime` | Pomocniki katalogu modeli dostawcy na żywo dla strzeżonego wykrywania w stylu `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrowanie identyfikatorów modeli, pamięć podręczna TTL i statyczny wariant awaryjny |
    | `plugin-sdk/provider-catalog-runtime` | Hak środowiska wykonawczego rozszerzania katalogu dostawcy i punkty styku rejestru Plugin-dostawca do testów kontraktowych |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ogólne pomocniki możliwości HTTP/punktów końcowych dostawcy, błędy HTTP dostawcy i pomocniki formularzy wieloczęściowych transkrypcji audio |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie pomocniki kontraktu konfiguracji/wyboru pobierania z sieci, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Pomocniki rejestracji/pamięci podręcznej dostawcy pobierania z sieci |
    | `plugin-sdk/provider-web-search-config-contract` | Wąskie pomocniki konfiguracji/poświadczeń wyszukiwania w sieci dla dostawców, którzy nie potrzebują okablowania włączania Pluginu |
    | `plugin-sdk/provider-web-search-contract` | Wąskie pomocniki kontraktu konfiguracji/poświadczeń wyszukiwania w sieci, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowe settery/gettery poświadczeń |
    | `plugin-sdk/provider-web-search` | Pomocniki rejestracji/pamięci podręcznej/środowiska wykonawczego dostawcy wyszukiwania w sieci |
    | `plugin-sdk/embedding-providers` | Ogólne typy dostawców osadzeń i pomocniki odczytu, w tym `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` i `listEmbeddingProviders(...)`; Pluginy rejestrują dostawców przez `api.registerEmbeddingProvider(...)`, więc własność manifestu jest egzekwowana |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` oraz czyszczenie schematów DeepSeek/Gemini/OpenAI + diagnostyka |
    | `plugin-sdk/provider-usage` | Typy migawek użycia dostawcy, współdzielone pomocniki pobierania użycia oraz pobieracze dostawców, takie jak `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni, zgodność wywołań narzędzi w zwykłym tekście oraz współdzielone pomocniki wrapperów Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-stream-shared` | Publiczne współdzielone pomocniki wrapperów strumieni dostawcy, w tym `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` oraz narzędzia strumieni zgodnych z Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Pomocniki natywnego transportu dostawcy, takie jak strzeżone fetch, wyodrębnianie tekstu wyników narzędzi, transformacje komunikatów transportu i zapisywalne strumienie zdarzeń transportu |
    | `plugin-sdk/provider-onboard` | Pomocniki łatania konfiguracji wdrażania |
    | `plugin-sdk/global-singleton` | Pomocniki singletonów/map/pamięci podręcznych lokalnych dla procesu |
    | `plugin-sdk/group-activation` | Wąskie pomocniki trybu aktywacji grup i parsowania poleceń |
  </Accordion>

Migawki użycia dostawcy zwykle raportują jedno lub więcej `windows` limitów,
każde z etykietą, procentem użycia i opcjonalnym czasem resetu. Dostawcy, którzy
zamiast resetowalnych okien limitów udostępniają saldo lub tekst stanu konta,
powinni zwracać `summary` z pustą tablicą `windows`, zamiast fabrykować
procenty. OpenClaw wyświetla ten tekst podsumowania w wyjściu statusu; używaj
`error` tylko wtedy, gdy punkt końcowy użycia zawiódł lub nie zwrócił użytecznych
danych użycia.

  <Accordion title="Podścieżki uwierzytelniania i bezpieczeństwa">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, pomocniki rejestru poleceń, w tym formatowanie dynamicznego menu argumentów, pomocniki autoryzacji nadawcy |
    | `plugin-sdk/command-status` | Konstruktory komunikatów poleceń/pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Pomocniki rozwiązywania zatwierdzających i uwierzytelniania akcji w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Pomocniki profili/filtrów zatwierdzania natywnego exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptery natywnych możliwości/dostarczania zatwierdzeń |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony pomocnik rozwiązywania Gateway zatwierdzeń |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie pomocniki ładowania natywnych adapterów zatwierdzeń dla gorących punktów wejścia kanałów |
    | `plugin-sdk/approval-handler-runtime` | Szersze pomocniki środowiska wykonawczego obsługi zatwierdzeń; preferuj węższe punkty styku adaptera/Gateway, gdy wystarczają |
    | `plugin-sdk/approval-native-runtime` | Pomocniki natywnego celu zatwierdzenia, powiązania konta, bramki trasy, awaryjnego przekazywania i wyciszania lokalnego natywnego monitu exec |
    | `plugin-sdk/approval-reaction-runtime` | Twardo zakodowane powiązania reakcji zatwierdzania, ładunki monitów reakcji, magazyny celów reakcji i eksport zgodności dla wyciszania lokalnego natywnego monitu exec |
    | `plugin-sdk/approval-reply-runtime` | Pomocniki ładunków odpowiedzi zatwierdzeń exec/Pluginu |
    | `plugin-sdk/approval-runtime` | Pomocniki ładunków zatwierdzeń exec/Pluginu, pomocniki routingu/środowiska wykonawczego natywnych zatwierdzeń oraz pomocniki strukturalnego wyświetlania zatwierdzeń, takie jak `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Wąskie pomocniki resetowania deduplikacji odpowiedzi przychodzących |
    | `plugin-sdk/channel-contract-testing` | Wąskie pomocniki testów kontraktowych kanału bez szerokiego barrela testowego |
    | `plugin-sdk/command-auth-native` | Natywne uwierzytelnianie poleceń, formatowanie dynamicznego menu argumentów i natywne pomocniki celu sesji |
    | `plugin-sdk/command-detection` | Współdzielone pomocniki wykrywania poleceń |
    | `plugin-sdk/command-primitives-runtime` | Lekkie predykaty tekstu poleceń dla gorących ścieżek kanałów |
    | `plugin-sdk/command-surface` | Normalizacja treści poleceń i pomocniki powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Leniwe pomocniki przepływu logowania uwierzytelniania dostawcy dla kanału prywatnego i parowania kodu urządzenia internetowego interfejsu użytkownika |
    | `plugin-sdk/channel-secret-runtime` | Wąskie pomocniki kolekcji kontraktu sekretów dla powierzchni sekretów kanału/Pluginu |
    | `plugin-sdk/secret-ref-runtime` | Wąskie `coerceSecretRef` i pomocniki typowania SecretRef do parsowania kontraktu sekretów/konfiguracji |
    | `plugin-sdk/secret-provider-integration` | Manifest integracji dostawcy SecretRef tylko na poziomie typów oraz kontrakty presetów dla Pluginów publikujących zewnętrzne presety dostawców sekretów |
    | `plugin-sdk/security-runtime` | Współdzielone pomocniki zaufania, bramkowania DM, plików/ścieżek ograniczonych do katalogu głównego, w tym zapisy tylko tworzące, synchroniczna/asynchroniczna atomowa wymiana plików, zapisy do tymczasowych plików równorzędnych, awaryjne przenoszenie między urządzeniami, pomocniki prywatnego magazynu plików, strażnicy rodziców symlinków, treść zewnętrzna, redagowanie tekstu wrażliwego, porównywanie sekretów w stałym czasie i pomocniki kolekcji sekretów |
    | `plugin-sdk/ssrf-policy` | Pomocniki listy dozwolonych hostów i zasad SSRF sieci prywatnej |
    | `plugin-sdk/ssrf-dispatcher` | Wąskie pomocniki przypiętego dispatchera bez szerokiej powierzchni środowiska wykonawczego infrastruktury |
    | `plugin-sdk/ssrf-runtime` | Przypięty dispatcher, fetch strzeżony przez SSRF, błąd SSRF i pomocniki zasad SSRF |
    | `plugin-sdk/secret-input` | Pomocniki parsowania danych wejściowych sekretów |
    | `plugin-sdk/webhook-ingress` | Pomocniki żądań/celów Webhook i koercja surowego websocketu/treści |
    | `plugin-sdk/webhook-request-guards` | Pomocniki rozmiaru treści żądania/limitu czasu |
  </Accordion>

  <Accordion title="Runtime and storage subpaths">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie funkcje pomocnicze środowiska uruchomieniowego, logowania, kopii zapasowych i instalacji pluginów |
    | `plugin-sdk/runtime-env` | Wąskie funkcje pomocnicze środowiska uruchomieniowego, loggera, limitu czasu, ponawiania i backoffu |
    | `plugin-sdk/browser-config` | Obsługiwana fasada konfiguracji przeglądarki dla znormalizowanych profili/wartości domyślnych, parsowania adresów URL CDP i funkcji pomocniczych uwierzytelniania sterowania przeglądarką |
    | `plugin-sdk/agent-harness-task-runtime` | Ogólne funkcje pomocnicze cyklu życia zadania i dostarczania ukończenia dla agentów opartych na harnessie, używających zakresu zadania wydanego przez hosta |
    | `plugin-sdk/codex-mcp-projection` | Zarezerwowana dołączona funkcja pomocnicza Codex do projekcji konfiguracji serwera MCP użytkownika na konfigurację wątku Codex; nie dla pluginów firm trzecich |
    | `plugin-sdk/codex-native-task-runtime` | Prywatna dołączona funkcja pomocnicza Codex do okablowania natywnego odbicia zadania/środowiska uruchomieniowego; nie dla pluginów firm trzecich |
    | `plugin-sdk/channel-runtime-context` | Ogólne funkcje pomocnicze rejestracji i wyszukiwania kontekstu środowiska uruchomieniowego kanału |
    | `plugin-sdk/matrix` | Przestarzała fasada zgodności Matrix dla starszych pakietów kanałów firm trzecich; nowe pluginy powinny importować `plugin-sdk/run-command` bezpośrednio |
    | `plugin-sdk/mattermost` | Przestarzała fasada zgodności Mattermost dla starszych pakietów kanałów firm trzecich; nowe pluginy powinny importować ogólne ścieżki podrzędne SDK bezpośrednio |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone funkcje pomocnicze poleceń, hooków, HTTP i interakcji pluginów |
    | `plugin-sdk/hook-runtime` | Współdzielone funkcje pomocnicze potoku Webhook/wewnętrznych hooków |
    | `plugin-sdk/lazy-runtime` | Funkcje pomocnicze leniwego importu/wiązania środowiska uruchomieniowego, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Funkcje pomocnicze wykonywania procesów |
    | `plugin-sdk/cli-runtime` | Funkcje pomocnicze formatowania CLI, oczekiwania, wersji, wywoływania argumentów i leniwych grup poleceń |
    | `plugin-sdk/qa-live-transport-scenarios` | Współdzielone identyfikatory scenariuszy QA transportu na żywo, funkcje pomocnicze pokrycia bazowego i funkcja pomocnicza wyboru scenariusza |
    | `plugin-sdk/gateway-method-runtime` | Zarezerwowana funkcja pomocnicza dyspozycji metod Gateway dla tras HTTP pluginów, które deklarują `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Klient Gateway, funkcja pomocnicza startu klienta gotowego na pętlę zdarzeń, RPC CLI Gateway, błędy protokołu Gateway, rozwiązywanie reklamowanego hosta LAN i funkcje pomocnicze łatek statusu kanału |
    | `plugin-sdk/config-contracts` | Skupiona, wyłącznie typowana powierzchnia konfiguracji dla kształtów konfiguracji pluginów, takich jak `OpenClawConfig` oraz typy konfiguracji kanałów/dostawców |
    | `plugin-sdk/plugin-config-runtime` | Funkcje pomocnicze wyszukiwania konfiguracji pluginów w środowisku uruchomieniowym, takie jak `requireRuntimeConfig`, `resolvePluginConfigObject` i `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Transakcyjne funkcje pomocnicze mutacji konfiguracji, takie jak `mutateConfigFile`, `replaceConfigFile` i `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Współdzielone ciągi podpowiedzi metadanych dostarczania narzędzi wiadomości |
    | `plugin-sdk/runtime-config-snapshot` | Funkcje pomocnicze migawki konfiguracji bieżącego procesu, takie jak `getRuntimeConfig`, `getRuntimeConfigSnapshot` i settery migawek testowych |
    | `plugin-sdk/telegram-command-config` | Normalizacja nazw/opisów poleceń Telegram oraz sprawdzanie duplikatów/konfliktów, nawet gdy dołączona powierzchnia kontraktu Telegram jest niedostępna |
    | `plugin-sdk/text-autolink-runtime` | Wykrywanie autolinków odwołań do plików bez szerokiego zbiorczego modułu tekstowego |
    | `plugin-sdk/approval-reaction-runtime` | Zakodowane na stałe wiązania reakcji zatwierdzenia, payloady promptów reakcji, magazyny celów reakcji oraz eksport zgodności dla lokalnego tłumienia natywnych promptów exec |
    | `plugin-sdk/approval-runtime` | Funkcje pomocnicze zatwierdzania exec/pluginów, buildery zdolności zatwierdzania, funkcje pomocnicze uwierzytelniania/profili, funkcje pomocnicze natywnego routingu/środowiska uruchomieniowego oraz formatowanie ścieżek wyświetlania zatwierdzeń strukturalnych |
    | `plugin-sdk/reply-runtime` | Współdzielone funkcje pomocnicze środowiska uruchomieniowego przychodzących odpowiedzi/odpowiedzi, dzielenie na fragmenty, dyspozycja, Heartbeat, planer odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie funkcje pomocnicze dyspozycji/finalizacji odpowiedzi i etykiet konwersacji |
    | `plugin-sdk/reply-history` | Współdzielone funkcje pomocnicze krótkookienkowej historii odpowiedzi. Nowy kod tur wiadomości powinien używać `createChannelHistoryWindow`; funkcje pomocnicze map niższego poziomu pozostają wyłącznie przestarzałymi eksportami zgodności |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie funkcje pomocnicze dzielenia tekstu/Markdown na fragmenty |
    | `plugin-sdk/session-store-runtime` | Funkcje pomocnicze przepływu sesji (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), ograniczone odczyty tekstu ostatnich transkryptów użytkownika/asystenta według tożsamości sesji, funkcje pomocnicze starszej ścieżki magazynu sesji/klucza sesji, odczyty updated-at oraz przejściowe funkcje pomocnicze zgodności całego magazynu/ścieżki pliku |
    | `plugin-sdk/session-transcript-runtime` | Tożsamość transkryptu, zakresowe funkcje pomocnicze celów/odczytu/zapisu, publikowanie aktualizacji, blokady zapisu i klucze trafień pamięci transkryptu |
    | `plugin-sdk/sqlite-runtime` | Skupione funkcje pomocnicze schematu agenta SQLite, ścieżki i transakcji dla własnego środowiska uruchomieniowego |
    | `plugin-sdk/cron-store-runtime` | Funkcje pomocnicze ścieżki/ładowania/zapisu magazynu Cron |
    | `plugin-sdk/state-paths` | Funkcje pomocnicze ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/plugin-state-runtime` | Typy kluczowanego stanu w bocznym SQLite pluginów oraz scentralizowana konfiguracja pragm połączeń i utrzymania WAL dla baz danych posiadanych przez pluginy |
    | `plugin-sdk/routing` | Funkcje pomocnicze tras/kluczy sesji/wiązań kont, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone funkcje pomocnicze podsumowania statusu kanału/konta, domyślne wartości stanu środowiska uruchomieniowego i funkcje pomocnicze metadanych issue |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone funkcje pomocnicze rozwiązywania celów |
    | `plugin-sdk/string-normalization-runtime` | Funkcje pomocnicze normalizacji slugów/ciągów |
    | `plugin-sdk/request-url` | Wyodrębnianie adresów URL jako ciągów z wejść podobnych do fetch/request |
    | `plugin-sdk/run-command` | Runner poleceń z limitem czasu i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Wspólne czytniki parametrów narzędzi/CLI |
    | `plugin-sdk/tool-plugin` | Definiowanie prostego typowanego pluginu narzędzia agenta i udostępnianie statycznych metadanych do generowania manifestu |
    | `plugin-sdk/tool-payload` | Wyodrębnianie znormalizowanych payloadów z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłania z argumentów narzędzia |
    | `plugin-sdk/sandbox` | Typy backendu piaskownicy i funkcje pomocnicze poleceń SSH/OpenShell, w tym kontrola wstępna polecenia exec z szybkim niepowodzeniem |
    | `plugin-sdk/temp-path` | Współdzielone funkcje pomocnicze ścieżek tymczasowych pobrań i prywatne bezpieczne tymczasowe obszary robocze |
    | `plugin-sdk/logging-core` | Logger podsystemu i funkcje pomocnicze redakcji |
    | `plugin-sdk/markdown-table-runtime` | Funkcje pomocnicze trybu tabel Markdown i konwersji |
    | `plugin-sdk/model-session-runtime` | Funkcje pomocnicze nadpisywania modelu/sesji, takie jak `applyModelOverrideToSessionEntry` i `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Funkcje pomocnicze rozwiązywania konfiguracji dostawcy Talk |
    | `plugin-sdk/json-store` | Małe funkcje pomocnicze odczytu/zapisu stanu JSON |
    | `plugin-sdk/json-unsafe-integers` | Funkcje pomocnicze parsowania JSON, które zachowują niebezpieczne literały całkowite jako ciągi |
    | `plugin-sdk/file-lock` | Współbieżne funkcje pomocnicze blokady pliku |
    | `plugin-sdk/persistent-dedupe` | Funkcje pomocnicze cache deduplikacji opartego na dysku |
    | `plugin-sdk/acp-runtime` | Funkcje pomocnicze środowiska uruchomieniowego/sesji ACP i dyspozycji odpowiedzi |
    | `plugin-sdk/acp-runtime-backend` | Lekkie funkcje pomocnicze rejestracji backendu ACP i dyspozycji odpowiedzi dla pluginów ładowanych przy starcie |
    | `plugin-sdk/acp-binding-resolve-runtime` | Rozwiązywanie wiązań ACP tylko do odczytu bez importów startu cyklu życia |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji środowiska uruchomieniowego agenta |
    | `plugin-sdk/boolean-param` | Luźny czytnik parametrów boolowskich |
    | `plugin-sdk/dangerous-name-runtime` | Funkcje pomocnicze rozwiązywania dopasowań niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Funkcje pomocnicze bootstrapu urządzenia i tokenów parowania |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy funkcji pomocniczych kanału pasywnego, statusu i ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Funkcje pomocnicze odpowiedzi polecenia/dostawcy `/models` |
    | `plugin-sdk/skill-commands-runtime` | Funkcje pomocnicze listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Funkcje pomocnicze rejestru/budowania/serializacji natywnych poleceń |
    | `plugin-sdk/agent-harness` | Eksperymentalna powierzchnia zaufanych pluginów dla niskopoziomowych harnessów agentów: typy harnessów, funkcje pomocnicze sterowania/przerywania aktywnych uruchomień, funkcje pomocnicze mostu narzędzi OpenClaw, funkcje pomocnicze polityki narzędzi planu środowiska uruchomieniowego, klasyfikacja wyniku terminalowego, funkcje pomocnicze formatowania/szczegółów postępu narzędzia oraz narzędzia wyników prób |
    | `plugin-sdk/provider-zai-endpoint` | Przestarzała, należąca do dostawcy Z.AI fasada wykrywania endpointów; użyj publicznego API pluginu Z.AI |
    | `plugin-sdk/async-lock-runtime` | Procesowo lokalna funkcja pomocnicza blokady asynchronicznej dla małych plików stanu środowiska uruchomieniowego |
    | `plugin-sdk/channel-activity-runtime` | Funkcja pomocnicza telemetrii aktywności kanału |
    | `plugin-sdk/concurrency-runtime` | Funkcja pomocnicza ograniczonej współbieżności zadań asynchronicznych |
    | `plugin-sdk/dedupe-runtime` | Funkcje pomocnicze cache deduplikacji w pamięci |
    | `plugin-sdk/delivery-queue-runtime` | Funkcja pomocnicza opróżniania oczekujących dostarczeń wychodzących |
    | `plugin-sdk/file-access-runtime` | Funkcje pomocnicze bezpiecznych ścieżek plików lokalnych i źródeł mediów |
    | `plugin-sdk/heartbeat-runtime` | Funkcje pomocnicze wybudzania Heartbeat, zdarzeń i widoczności |
    | `plugin-sdk/number-runtime` | Funkcja pomocnicza koercji numerycznej |
    | `plugin-sdk/secure-random-runtime` | Funkcje pomocnicze bezpiecznych tokenów/UUID |
    | `plugin-sdk/system-event-runtime` | Funkcje pomocnicze kolejki zdarzeń systemowych |
    | `plugin-sdk/transport-ready-runtime` | Funkcja pomocnicza oczekiwania na gotowość transportu |
    | `plugin-sdk/exec-approvals-runtime` | Funkcje pomocnicze pliku polityki zatwierdzeń exec bez szerokiego zbiorczego modułu infra-runtime |
    | `plugin-sdk/infra-runtime` | Przestarzały shim zgodności; użyj skupionych ścieżek podrzędnych środowiska uruchomieniowego powyżej |
    | `plugin-sdk/collection-runtime` | Małe funkcje pomocnicze ograniczonego cache |
    | `plugin-sdk/diagnostic-runtime` | Funkcje pomocnicze flag diagnostycznych, zdarzeń i kontekstu śledzenia |
    | `plugin-sdk/error-runtime` | Graf błędów, formatowanie, współdzielone funkcje pomocnicze klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Opakowany fetch, proxy, opcja EnvHttpProxyAgent i funkcje pomocnicze przypiętego wyszukiwania |
    | `plugin-sdk/runtime-fetch` | Fetch środowiska uruchomieniowego świadomy dyspozytora bez importów proxy/guarded-fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Sanitizer wbudowanych adresów URL danych obrazów i funkcje pomocnicze wykrywania sygnatur bez szerokiej powierzchni środowiska uruchomieniowego mediów |
    | `plugin-sdk/response-limit-runtime` | Ograniczony czytnik treści odpowiedzi bez szerokiej powierzchni środowiska uruchomieniowego mediów |
    | `plugin-sdk/session-binding-runtime` | Bieżący stan wiązania konwersacji bez skonfigurowanego routingu wiązań lub magazynów parowania |
    | `plugin-sdk/session-store-runtime` | Funkcje pomocnicze magazynu sesji bez szerokich importów zapisów/utrzymania konfiguracji |
    | `plugin-sdk/sqlite-runtime` | Skupione funkcje pomocnicze schematu agenta SQLite, ścieżki i transakcji bez kontroli cyklu życia bazy danych |
    | `plugin-sdk/context-visibility-runtime` | Rozwiązywanie widoczności kontekstu i filtrowanie kontekstu uzupełniającego bez szerokich importów konfiguracji/bezpieczeństwa |
    | `plugin-sdk/string-coerce-runtime` | Wąskie funkcje pomocnicze koercji i normalizacji rekordów prymitywnych/ciągów bez importów markdown/logowania |
    | `plugin-sdk/host-runtime` | Funkcje pomocnicze normalizacji nazwy hosta i hosta SCP |
    | `plugin-sdk/retry-runtime` | Funkcje pomocnicze konfiguracji ponawiania i runnera ponawiania |
    | `plugin-sdk/agent-runtime` | Funkcje pomocnicze katalogu/tożsamości/obszaru roboczego agenta, w tym `resolveAgentDir`, `resolveDefaultAgentDir` i przestarzały eksport zgodności `resolveOpenClawAgentDir` |
    | `plugin-sdk/directory-runtime` | Zapytania/deduplikacja katalogów oparta na konfiguracji |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Podścieżki funkcji i testowania">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Współdzielone helpery pobierania/przekształcania/przechowywania multimediów, w tym `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` oraz przestarzałe `fetchRemoteMedia`; preferuj helpery magazynu przed odczytami bufora, gdy URL ma stać się multimedium OpenClaw |
    | `plugin-sdk/media-mime` | Wąska normalizacja MIME, mapowanie rozszerzeń plików, wykrywanie MIME oraz helpery rodzaju multimediów |
    | `plugin-sdk/media-store` | Wąskie helpery magazynu multimediów, takie jak `saveMediaBuffer` i `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Współdzielone helpery awaryjnego przełączania generowania multimediów, wybór kandydatów oraz komunikaty o brakującym modelu |
    | `plugin-sdk/media-understanding` | Typy dostawcy rozumienia multimediów oraz eksporty helperów obrazu/audio/ekstrakcji strukturalnej przeznaczone dla dostawców |
    | `plugin-sdk/text-chunking` | Helpery dzielenia/renderowania tekstu i markdown, konwersja tabel markdown, usuwanie tagów dyrektyw oraz narzędzia bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Helper dzielenia tekstu wychodzącego |
    | `plugin-sdk/speech` | Typy dostawcy mowy oraz eksporty dyrektyw, rejestru, walidacji, konstruktora TTS zgodnego z OpenAI i helperów mowy przeznaczone dla dostawców |
    | `plugin-sdk/speech-core` | Współdzielone typy dostawcy mowy, rejestr, dyrektywa, normalizacja oraz eksporty helperów mowy |
    | `plugin-sdk/realtime-transcription` | Typy dostawcy transkrypcji w czasie rzeczywistym, helpery rejestru oraz współdzielony helper sesji WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Helper inicjalizacji profilu czasu rzeczywistego dla ograniczonego wstrzykiwania kontekstu `IDENTITY.md`, `USER.md` i `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Typy dostawcy głosu czasu rzeczywistego, helpery rejestru oraz współdzielone helpery zachowania głosu czasu rzeczywistego, w tym śledzenie aktywności wyjścia |
    | `plugin-sdk/image-generation` | Typy dostawcy generowania obrazów oraz helpery zasobów obrazów/adresów URL danych i konstruktor dostawcy obrazów zgodny z OpenAI |
    | `plugin-sdk/image-generation-core` | Współdzielone typy generowania obrazów, awaryjne przełączanie, uwierzytelnianie oraz helpery rejestru |
    | `plugin-sdk/music-generation` | Typy dostawcy/żądania/wyniku generowania muzyki |
    | `plugin-sdk/music-generation-core` | Współdzielone typy generowania muzyki, helpery awaryjnego przełączania, wyszukiwanie dostawcy oraz parsowanie odwołań do modeli |
    | `plugin-sdk/video-generation` | Typy dostawcy/żądania/wyniku generowania wideo |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo, helpery awaryjnego przełączania, wyszukiwanie dostawcy oraz parsowanie odwołań do modeli |
    | `plugin-sdk/transcripts` | Współdzielone typy dostawcy źródła transkryptów, helpery rejestru, deskryptory sesji oraz metadane wypowiedzi |
    | `plugin-sdk/webhook-targets` | Rejestr celów Webhook i helpery instalacji tras |
    | `plugin-sdk/webhook-path` | Przestarzały alias zgodności; użyj `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Współdzielone helpery ładowania zdalnych/lokalnych multimediów |
    | `plugin-sdk/zod` | Przestarzały reeksport zgodności; importuj `zod` bezpośrednio z `zod` |
    | `plugin-sdk/testing` | Lokalny dla repozytorium przestarzały moduł zbiorczy zgodności dla starszych testów OpenClaw. Nowe testy repozytorium powinny zamiast tego importować ukierunkowane lokalne podścieżki testowe, takie jak `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` lub `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | Lokalny dla repozytorium minimalny helper `createTestPluginApi` do bezpośrednich testów jednostkowych rejestracji pluginu bez importowania mostków helperów testowych repozytorium |
    | `plugin-sdk/agent-runtime-test-contracts` | Lokalne dla repozytorium natywne fikstury kontraktów adaptera środowiska uruchomieniowego agentów dla testów uwierzytelniania, dostarczania, rozwiązania awaryjnego, hooków narzędzi, nakładki promptu, schematu i projekcji transkryptu |
    | `plugin-sdk/channel-test-helpers` | Lokalne dla repozytorium helpery testowe zorientowane na kanały dla kontraktów ogólnych akcji/konfiguracji/statusu, asercji katalogów, cyklu życia startu konta, wątkowania konfiguracji wysyłania, mocków środowiska uruchomieniowego, problemów statusu, dostarczania wychodzącego i rejestracji hooków |
    | `plugin-sdk/channel-target-testing` | Lokalny dla repozytorium współdzielony zestaw przypadków błędów rozwiązywania celów dla testów kanałów |
    | `plugin-sdk/plugin-test-contracts` | Lokalne dla repozytorium helpery kontraktów pakietu pluginu, rejestracji, publicznego artefaktu, bezpośredniego importu, API środowiska uruchomieniowego i efektów ubocznych importu |
    | `plugin-sdk/provider-test-contracts` | Lokalne dla repozytorium helpery kontraktów środowiska uruchomieniowego dostawcy, uwierzytelniania, odkrywania, onboardingu, katalogu, kreatora, funkcji multimediów, zasad odtwarzania, STT czasu rzeczywistego dla dźwięku na żywo, wyszukiwania/pobierania z sieci i strumienia |
    | `plugin-sdk/provider-http-test-mocks` | Lokalne dla repozytorium opcjonalne mocki HTTP/uwierzytelniania Vitest dla testów dostawców, które ćwiczą `plugin-sdk/provider-http` |
    | `plugin-sdk/test-fixtures` | Lokalne dla repozytorium ogólne fikstury przechwytywania środowiska uruchomieniowego CLI, kontekstu piaskownicy, zapisu Skills, wiadomości agenta, zdarzeń systemowych, ponownego ładowania modułów, ścieżki bundled pluginu, tekstu terminala, dzielenia, tokena uwierzytelniania i typowanych przypadków |
    | `plugin-sdk/test-node-mocks` | Lokalne dla repozytorium ukierunkowane helpery mocków wbudowanych elementów Node do użycia wewnątrz fabryk Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Podścieżki pamięci">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Powierzchnia bundled helperów memory-core dla helperów menedżera/konfiguracji/plików/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada środowiska uruchomieniowego indeksu/wyszukiwania pamięci |
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
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpery środowiska uruchomieniowego CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpery głównego środowiska uruchomieniowego hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/środowiska uruchomieniowego hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny względem dostawcy alias dla helperów głównego środowiska uruchomieniowego hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny względem dostawcy alias dla helperów dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Przestarzały alias zgodności; użyj `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Współdzielone helpery zarządzanego markdown dla pluginów sąsiadujących z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada środowiska uruchomieniowego Active Memory dla dostępu do menedżera wyszukiwania |
    | `plugin-sdk/memory-host-status` | Przestarzały alias zgodności; użyj `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Zarezerwowane podścieżki bundled helperów">
    Zarezerwowane podścieżki SDK bundled helperów to wąskie powierzchnie specyficzne dla właścicieli,
    przeznaczone dla kodu bundled pluginów. Są śledzone w inwentarzu SDK, aby kompilacje
    pakietów i aliasowanie pozostawały deterministyczne, ale nie są ogólnymi API
    tworzenia pluginów. Nowe współdzielone kontrakty hosta powinny używać ogólnych podścieżek SDK,
    takich jak `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` i
    `plugin-sdk/plugin-config-runtime`.

    | Podścieżka | Właściciel i cel |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Bundled helper pluginu Codex do projekcji konfiguracji serwera MCP użytkownika do konfiguracji wątku serwera aplikacji Codex |
    | `plugin-sdk/codex-native-task-runtime` | Bundled helper pluginu Codex do odzwierciedlania natywnych subagentów serwera aplikacji Codex w stanie zadań OpenClaw |

  </Accordion>
</AccordionGroup>

## Powiązane

- [Przegląd Plugin SDK](/pl/plugins/sdk-overview)
- [Konfiguracja Plugin SDK](/pl/plugins/sdk-setup)
- [Budowanie pluginów](/pl/plugins/building-plugins)
