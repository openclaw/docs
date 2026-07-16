---
read_when:
    - Wybór właściwej podścieżki plugin-sdk dla importu Pluginu
    - Audytowanie podścieżek dołączonych pluginów i powierzchni funkcji pomocniczych
summary: 'Katalog podścieżek zestawu Plugin SDK: gdzie znajdują się poszczególne importy, pogrupowane według obszaru'
title: Podścieżki SDK Pluginu
x-i18n:
    generated_at: "2026-07-16T18:59:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 937b616d7a95c250f7ff328ea3faa12143272722ffa638f50214fdd72ef5f225
    source_path: plugins/sdk-subpaths.md
    workflow: 16
---

Zestaw SDK Plugin jest udostępniany jako zbiór wąskich publicznych podścieżek w
`openclaw/plugin-sdk/`. Ta strona zawiera katalog często używanych podścieżek pogrupowanych według
przeznaczenia. Zakres definiują trzy pliki:

- `scripts/lib/plugin-sdk-entrypoints.json`: utrzymywany wykaz punktów wejścia,
  które kompiluje proces budowania.
- `scripts/lib/plugin-sdk-private-local-only-subpaths.json`: lokalne dla repozytorium
  podścieżki testowe/wewnętrzne. Eksporty pakietu to wykaz pomniejszony o tę listę.
- `src/plugin-sdk/entrypoints.ts`: metadane klasyfikacji przestarzałych
  podścieżek, zarezerwowanych dołączonych funkcji pomocniczych, obsługiwanych dołączonych fasad oraz
  publicznych powierzchni należących do pluginów.

Opiekunowie kontrolują liczbę publicznych eksportów za pomocą `pnpm plugin-sdk:surface` oraz
aktywne podścieżki zarezerwowanych funkcji pomocniczych za pomocą `pnpm plugins:boundary-report:summary`;
nieużywane eksporty zarezerwowanych funkcji pomocniczych powodują niepowodzenie raportu CI, zamiast pozostawać w
publicznym SDK jako nieaktywny dług zgodności.

Przewodnik tworzenia pluginów znajduje się w sekcji [Omówienie SDK Plugin](/pl/plugins/sdk-overview).

## Punkt wejścia pluginu

| Podścieżka                     | Kluczowe eksporty                                                                                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                                                     |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema`, `resolveTailscalePublishedHost` |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                                                       |
| `plugin-sdk/migration`         | Funkcje pomocnicze elementów dostawcy migracji, takie jak `createMigrationItem`, stałe przyczyn, znaczniki stanu elementów, funkcje pomocnicze redagowania oraz `summarizeMigrationItems`                                                  |
| `plugin-sdk/migration-runtime` | Funkcje pomocnicze migracji środowiska uruchomieniowego, takie jak `copyMigrationFileItem`, `resolvePlannedMigrationTargets`, `withCachedMigrationConfigRuntime` oraz `writeMigrationReport`                                             |
| `plugin-sdk/health`            | Rejestrowanie, wykrywanie, naprawa i wybór kontroli kondycji Doctor oraz typy ważności i ustaleń dla dołączonych odbiorców informacji o kondycji                                                         |
| `plugin-sdk/config-schema`     | Przestarzałe. Główny schemat Zod `openclaw.json` (`OpenClawSchema`); zamiast niego należy definiować schematy lokalne dla pluginu i weryfikować je za pomocą `plugin-sdk/json-schema-runtime`                                                  |

### Przestarzałe funkcje pomocnicze zgodności i testów

Przestarzałe podścieżki pozostają eksportowane dla starszych pluginów, ale nowy kod powinien używać
wyspecjalizowanych podścieżek SDK wymienionych poniżej. Utrzymywana lista to
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json`; CI odrzuca z niej importy
produkcyjne dołączonych komponentów. Szerokie moduły zbiorcze, takie jak `plugin-sdk/compat`,
`plugin-sdk/config-types`, `plugin-sdk/infra-runtime` oraz
`plugin-sdk/text-runtime`, służą wyłącznie do zapewniania zgodności, a `plugin-sdk/zod` jest
ponownym eksportem zgodności: należy importować `zod` bezpośrednio z `zod`. Szerokie
moduły zbiorcze domen `plugin-sdk/agent-runtime`, `plugin-sdk/channel-lifecycle`,
`plugin-sdk/channel-runtime`, `plugin-sdk/cli-runtime`,
`plugin-sdk/conversation-runtime`, `plugin-sdk/hook-runtime`,
`plugin-sdk/media-runtime`, `plugin-sdk/plugin-runtime` oraz
`plugin-sdk/security-runtime` są również przestarzałe; zamiast nich należy używać wyspecjalizowanych
podścieżek.

Podścieżki funkcji pomocniczych testów OpenClaw oparte na Vitest są wyłącznie lokalne dla repozytorium i nie są już
eksportami pakietu: `agent-runtime-test-contracts`,
`channel-contract-testing`, `channel-target-testing`, `channel-test-helpers`,
`plugin-state-test-runtime`, `plugin-test-api`, `plugin-test-contracts`,
`plugin-test-runtime`, `provider-http-test-mocks`, `provider-test-contracts`,
`reply-payload-testing`, `sqlite-runtime-testing`, `test-env`, `test-fixtures`,
`test-node-mocks` oraz `testing`. Prywatne powierzchnie dołączonych funkcji pomocniczych
`ssrf-runtime-internal` oraz `codex-native-task-runtime` są również wyłącznie lokalne dla
repozytorium.

### Zarezerwowane podścieżki funkcji pomocniczych dołączonych pluginów

`plugin-sdk/codex-mcp-projection` jest jedyną zarezerwowaną podścieżką: należącą do pluginu
powierzchnią zgodności dla dołączonego pluginu Codex, a nie ogólnym interfejsem API SDK.
Importy między pluginami należącymi do różnych właścicieli są blokowane przez zabezpieczenia kontraktu pakietu, a
CI kończy się niepowodzeniem, gdy zarezerwowana podścieżka przestaje być importowana.
`plugin-sdk/codex-native-task-runtime` jest wyłącznie lokalna dla repozytorium i nie stanowi eksportu
pakietu.

`src/plugin-sdk/entrypoints.ts` śledzi również obsługiwane dołączone fasady, czyli punkty wejścia
SDK obsługiwane przez odpowiadający im dołączony plugin do czasu zastąpienia ich
kontraktami ogólnymi: `plugin-sdk/discord`, `plugin-sdk/lmstudio`, `plugin-sdk/lmstudio-runtime`,
`plugin-sdk/matrix`, `plugin-sdk/mattermost`,
`plugin-sdk/memory-core-engine-runtime`, `plugin-sdk/provider-zai-endpoint`,
`plugin-sdk/qa-runner-runtime`, `plugin-sdk/telegram-account`,
`plugin-sdk/tts-runtime` oraz `plugin-sdk/zalouser`. Kilka z nich jest również
przestarzałych w nowym kodzie; zobacz uwagi przy poszczególnych wierszach poniżej.

  <AccordionGroup>
  <Accordion title="Ścieżki podrzędne kanałów">
    | Ścieżka podrzędna | Główne eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `createChannelConfigUiHints` |
    | `plugin-sdk/json-schema-runtime` | Pomocnicza funkcja buforowanej walidacji JSON Schema dla schematów należących do pluginów |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, a także `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone funkcje pomocnicze kreatora konfiguracji, translator konfiguracji, monity listy dozwolonych oraz konstruktory stanu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | Przestarzały alias zgodności; należy używać `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Funkcje pomocnicze konfiguracji wielu kont i bramki akcji oraz funkcje pomocnicze obsługi konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, funkcje pomocnicze normalizacji identyfikatora konta |
    | `plugin-sdk/account-resolution` | Funkcje pomocnicze wyszukiwania konta i obsługi konta domyślnego |
    | `plugin-sdk/account-helpers` | Wąsko wyspecjalizowane funkcje pomocnicze listy kont i działań na kontach |
    | `plugin-sdk/access-groups` | Analiza listy dozwolonych grup dostępu i funkcje pomocnicze zanonimizowanej diagnostyki grup |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | Przestarzała fasada zgodności. Należy używać `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | Współdzielone elementy podstawowe schematów konfiguracji kanałów oraz konstruktory Zod i bezpośrednie konstruktory JSON/TypeBox |
    | `plugin-sdk/bundled-channel-config-schema` | Dołączone schematy konfiguracji kanałów OpenClaw wyłącznie dla utrzymywanych dołączonych pluginów |
    | `plugin-sdk/chat-channel-ids` | `BUNDLED_CHAT_CHANNEL_IDS`, `BUNDLED_CHAT_CHANNEL_ENVELOPE_PREFIXES`, `ChatChannelId`. Kanoniczne identyfikatory dołączonych/oficjalnych kanałów czatu oraz etykiety/aliasy formatera dla pluginów, które muszą rozpoznawać tekst z prefiksem koperty bez kodowania własnej tabeli na stałe. |
    | `plugin-sdk/channel-config-schema-legacy` | Przestarzały alias zgodności dla schematów konfiguracji dołączonych kanałów |
    | `plugin-sdk/telegram-command-config` | Przestarzała normalizacja nazw/opisów poleceń Telegram oraz sprawdzanie duplikatów/konfliktów; w nowym kodzie pluginów należy używać lokalnej dla pluginu obsługi konfiguracji poleceń |
    | `plugin-sdk/command-gating` | Wąsko wyspecjalizowane funkcje pomocnicze bramki autoryzacji poleceń |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress-runtime` | Eksperymentalny, wysokopoziomowy mechanizm rozpoznawania środowiska wykonawczego przychodzących danych kanału oraz konstruktory faktów routingu dla zmigrowanych ścieżek odbioru kanałów. Jest preferowany zamiast tworzenia w każdym pluginie efektywnych list dozwolonych, list dozwolonych poleceń i starszych projekcji. Zobacz [API przychodzących danych kanału](/pl/plugins/sdk-channel-ingress). |
    | `plugin-sdk/channel-lifecycle` | Przestarzała fasada zgodności. Należy używać `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-outbound` | Kontrakty cyklu życia wiadomości oraz opcje potoku odpowiedzi, potwierdzenia, podgląd na żywo/przesyłanie strumieniowe, funkcje pomocnicze cyklu życia, tożsamość wychodząca, planowanie ładunku, trwałe wysyłanie i funkcje pomocnicze kontekstu wysyłania wiadomości. Zobacz [API danych wychodzących kanału](/pl/plugins/sdk-channel-outbound). |
    | `plugin-sdk/channel-message` | Przestarzały alias zgodności dla `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-message-runtime` | Przestarzały alias zgodności dla `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/inbound-envelope` | Współdzielone funkcje pomocnicze konstruktora routingu przychodzącego i koperty |
    | `plugin-sdk/inbound-reply-dispatch` | Przestarzała fasada zgodności. Należy używać `plugin-sdk/channel-inbound` dla mechanizmów uruchamiania danych przychodzących i predykatów wysyłania oraz `plugin-sdk/channel-outbound` dla funkcji pomocniczych dostarczania wiadomości. |
    | `plugin-sdk/messaging-targets` | Przestarzały alias analizy celu; należy używać `plugin-sdk/channel-targets` |
    | `plugin-sdk/outbound-media` | Współdzielone funkcje pomocnicze wczytywania multimediów wychodzących i stanu hostowanych multimediów |
    | `plugin-sdk/outbound-send-deps` | Przestarzała fasada zgodności. Należy używać `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/outbound-runtime` | Przestarzała fasada zgodności. Należy używać `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/poll-runtime` | Wąsko wyspecjalizowane funkcje pomocnicze normalizacji ankiet |
    | `plugin-sdk/thread-bindings-runtime` | Cykl życia powiązania wątku i funkcje pomocnicze adaptera |
    | `plugin-sdk/agent-media-payload` | Katalogi główne i moduły wczytujące ładunki multimedialne agenta |
    | `plugin-sdk/conversation-runtime` | Przestarzały, szeroki moduł zbiorczy funkcji pomocniczych powiązań konwersacji/wątków, parowania i skonfigurowanych powiązań; preferowane są wyspecjalizowane ścieżki podrzędne powiązań, takie jak `plugin-sdk/thread-bindings-runtime` i `plugin-sdk/session-binding-runtime` |
    | `plugin-sdk/runtime-group-policy` | Funkcje pomocnicze rozpoznawania zasad grup w środowisku wykonawczym |
    | `plugin-sdk/channel-status` | Współdzielone funkcje pomocnicze migawek/podsumowań stanu kanałów |
    | `plugin-sdk/channel-config-primitives` | Wąsko wyspecjalizowane elementy podstawowe schematów konfiguracji kanałów |
    | `plugin-sdk/channel-config-writes` | Funkcje pomocnicze autoryzacji zapisu konfiguracji kanałów |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty preludium pluginu kanału |
    | `plugin-sdk/allowlist-config-edit` | Funkcje pomocnicze edycji/odczytu konfiguracji listy dozwolonych |
    | `plugin-sdk/group-access` | Przestarzałe funkcje pomocnicze decyzji o dostępie grupowym; należy używać `resolveChannelMessageIngress` z `plugin-sdk/channel-ingress-runtime` |
    | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Przestarzałe fasady zgodności. Należy używać `plugin-sdk/channel-inbound`. |
    | `plugin-sdk/direct-dm-guard-policy` | Wąsko wyspecjalizowane funkcje pomocnicze zasad zabezpieczeń bezpośrednich wiadomości prywatnych przed szyfrowaniem |
    | `plugin-sdk/discord` | Przestarzała fasada zgodności Discord dla opublikowanego `@openclaw/discord@2026.3.13` i śledzonej zgodności właściciela; nowe pluginy powinny używać ogólnych ścieżek podrzędnych SDK kanałów |
    | `plugin-sdk/telegram-account` | Przestarzała fasada zgodności rozpoznawania kont Telegram dla śledzonej zgodności właściciela; nowe pluginy powinny używać wstrzykiwanych funkcji pomocniczych środowiska wykonawczego lub ogólnych ścieżek podrzędnych SDK kanałów |
    | `plugin-sdk/zalouser` | Przestarzała fasada zgodności Zalo Personal dla opublikowanych pakietów Lark/Zalo, które nadal importują autoryzację poleceń nadawcy; nowe pluginy powinny używać ogólnych ścieżek podrzędnych SDK kanałów |
    | `plugin-sdk/interactive-runtime` | Funkcje pomocnicze semantycznej prezentacji i dostarczania wiadomości oraz starszych odpowiedzi interaktywnych. Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Współdzielone funkcje pomocnicze danych przychodzących do klasyfikacji zdarzeń, tworzenia kontekstu, formatowania, katalogów głównych, eliminacji drgań, dopasowywania wzmianek, zasad wzmianek i rejestrowania danych przychodzących |
    | `plugin-sdk/channel-inbound-debounce` | Wąsko wyspecjalizowane funkcje pomocnicze eliminacji drgań danych przychodzących |
    | `plugin-sdk/channel-mention-gating` | Wąsko wyspecjalizowane funkcje pomocnicze zasad wzmianek, znaczników wzmianek i tekstu wzmianek bez szerszej powierzchni środowiska wykonawczego danych przychodzących |
    | `plugin-sdk/channel-envelope`, `plugin-sdk/channel-inbound-roots`, `plugin-sdk/channel-location`, `plugin-sdk/channel-logging` | Przestarzałe fasady zgodności. Należy używać `plugin-sdk/channel-inbound` lub `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-pairing-paths` | Przestarzała fasada zgodności. Należy używać `plugin-sdk/channel-pairing`. |
    | `plugin-sdk/channel-reply-options-runtime` | Przestarzała fasada zgodności. Należy używać `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-streaming` | Przestarzała fasada zgodności. Należy używać `plugin-sdk/channel-outbound`. |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | Funkcje pomocnicze działań na wiadomościach kanału oraz przestarzałe funkcje pomocnicze natywnych schematów zachowane dla zgodności pluginów |
    | `plugin-sdk/channel-route` | Współdzielona normalizacja routingu, oparte na parserze rozpoznawanie celów, konwersja identyfikatorów wątków na ciągi znaków, klucze routingu do deduplikacji/kompaktowania, typy przeanalizowanych celów oraz funkcje pomocnicze porównywania routingów/celów |
    | `plugin-sdk/channel-targets` | Funkcje pomocnicze analizy celów; kod wywołujący porównywanie routingów powinien używać `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Typy kontraktów kanałów |
    | `plugin-sdk/channel-feedback` | Integracja informacji zwrotnych/reakcji |
  </Accordion>

Przestarzałe rodziny funkcji pomocniczych kanałów pozostają dostępne wyłącznie w celu zachowania zgodności opublikowanych pluginów. Plan usunięcia jest następujący: zachować je przez okres migracji zewnętrznych pluginów, utrzymywać pluginy repozytorium/dołączone na `channel-inbound` i `channel-outbound`, a następnie usunąć podścieżki zgodności podczas kolejnego dużego porządkowania SDK. Dotyczy to starych rodzin wiadomości/środowiska uruchomieniowego kanałów, strumieniowania kanałów, bezpośredniego dostępu do wiadomości prywatnych, wydzielonych przychodzących funkcji pomocniczych, opcji odpowiedzi oraz ścieżek parowania.

  <Accordion title="Ścieżki podrzędne dostawców">
    | Ścieżka podrzędna | Główne eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | Obsługiwana fasada dostawcy LM Studio do konfiguracji, wykrywania katalogu i przygotowywania modeli w czasie wykonywania |
    | `plugin-sdk/lmstudio-runtime` | Obsługiwana fasada środowiska wykonawczego LM Studio do ustawień domyślnych serwera lokalnego, wykrywania modeli, nagłówków żądań i funkcji pomocniczych załadowanych modeli |
    | `plugin-sdk/provider-setup` | Wyselekcjonowane funkcje pomocnicze konfiguracji dostawców lokalnych i hostowanych samodzielnie |
    | `plugin-sdk/self-hosted-provider-setup` | Przestarzałe funkcje pomocnicze konfiguracji samodzielnie hostowanych dostawców zgodnych z OpenAI; należy używać `plugin-sdk/provider-setup` lub funkcji pomocniczych konfiguracji należących do pluginów |
    | `plugin-sdk/cli-backend` | Ustawienia domyślne zaplecza CLI i stałe mechanizmu nadzorującego |
    | `plugin-sdk/provider-auth-runtime` | Funkcje pomocnicze uwierzytelniania dostawcy w czasie wykonywania: przepływ OAuth z adresem zwrotnym loopback, wymiana tokenów, utrwalanie danych uwierzytelniania i rozpoznawanie klucza API |
    | `plugin-sdk/provider-oauth-runtime` | Ogólne typy wywołań zwrotnych OAuth dostawców, renderowanie strony wywołania zwrotnego, funkcje pomocnicze PKCE/stanu, analizowanie danych wejściowych autoryzacji, funkcje pomocnicze wygasania tokenów i przerywania |
    | `plugin-sdk/provider-auth-api-key` | Funkcje pomocnicze wdrażania klucza API i zapisywania profilu, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy konstruktor wyniku uwierzytelniania OAuth |
    | `plugin-sdk/provider-env-vars` | Funkcje pomocnicze wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`, funkcje pomocnicze importu uwierzytelniania OpenAI Codex, przestarzały eksport zgodności `resolveOpenClawAgentDir` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory zasad ponawiania, funkcje pomocnicze punktów końcowych dostawców i współdzielone funkcje pomocnicze normalizacji identyfikatorów modeli |
    | `plugin-sdk/provider-catalog-live-runtime` | Funkcje pomocnicze katalogu aktywnych modeli dostawców do zabezpieczonego wykrywania w stylu `/models`: `buildLiveModelProviderConfig`, `fetchLiveProviderModelRows`, `getCachedLiveProviderModelRows`, `fetchLiveProviderModelIds`, `LiveModelCatalogHttpError`, `clearLiveCatalogCacheForTests`, filtrowanie identyfikatorów modeli, pamięć podręczna TTL i statyczny mechanizm awaryjny |
    | `plugin-sdk/provider-catalog-runtime` | Punkt zaczepienia środowiska wykonawczego rozszerzania katalogu dostawców i interfejsy rejestru dostawców pluginów do testów kontraktowych |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ogólne funkcje pomocnicze możliwości HTTP/punktów końcowych dostawców, błędy HTTP dostawców i funkcje pomocnicze wieloczęściowych formularzy transkrypcji dźwięku |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie funkcje pomocnicze kontraktu konfiguracji i wyboru pobierania z sieci, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Funkcje pomocnicze rejestracji i pamięci podręcznej dostawców pobierania z sieci |
    | `plugin-sdk/provider-web-search-config-contract` | Wąskie funkcje pomocnicze konfiguracji i poświadczeń wyszukiwania w sieci dla dostawców, którzy nie wymagają mechanizmu włączania pluginu |
    | `plugin-sdk/provider-web-search-contract` | Wąskie funkcje pomocnicze kontraktu konfiguracji i poświadczeń wyszukiwania w sieci, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, oraz funkcje ustawiające i pobierające poświadczenia o ograniczonym zakresie |
    | `plugin-sdk/provider-web-search` | Funkcje pomocnicze rejestracji, pamięci podręcznej i środowiska wykonawczego dostawców wyszukiwania w sieci |
    | `plugin-sdk/embedding-providers` | Ogólne typy dostawców osadzeń i funkcje pomocnicze odczytu, w tym `EmbeddingProviderAdapter`, `getEmbeddingProvider(...)` i `listEmbeddingProviders(...)`; pluginy rejestrują dostawców za pośrednictwem `api.registerEmbeddingProvider(...)`, aby wymusić własność manifestu |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` oraz czyszczenie schematów i diagnostyka DeepSeek/Gemini/OpenAI |
    | `plugin-sdk/provider-usage` | Typy migawek użycia dostawców, współdzielone funkcje pomocnicze pobierania użycia i funkcje pobierające dostawców, takie jak `fetchClaudeUsage` |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy opakowań strumieni, zgodność wywołań narzędzi w postaci zwykłego tekstu oraz współdzielone funkcje pomocnicze opakowań Anthropic/Google/Kilocode/MiniMax/Moonshot/OpenAI/OpenRouter/Z.AI |
    | `plugin-sdk/provider-stream-shared` | Publiczne współdzielone funkcje pomocnicze opakowań strumieni dostawców, w tym `composeProviderStreamWrappers`, `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPlainTextToolCallCompatWrapper`, `createPayloadPatchStreamWrapper`, `createToolStreamWrapper`, `normalizeOpenAICompatibleReasoningPayload`, `setQwenChatTemplateThinking` oraz narzędzia strumieni zgodnych z Anthropic/DeepSeek/OpenAI |
    | `plugin-sdk/provider-transport-runtime` | Natywne funkcje pomocnicze transportu dostawców, takie jak zabezpieczone pobieranie, wyodrębnianie tekstu wyników narzędzi, przekształcenia komunikatów transportowych i zapisywalne strumienie zdarzeń transportowych |
    | `plugin-sdk/provider-onboard` | Funkcje pomocnicze modyfikowania konfiguracji wdrażania |
    | `plugin-sdk/global-singleton` | Funkcje pomocnicze lokalnych dla procesu singletonów, map i pamięci podręcznych |
    | `plugin-sdk/group-activation` | Wąskie funkcje pomocnicze trybu aktywacji grupy i analizowania poleceń |
  </Accordion>

Migawki użycia dostawców zwykle zgłaszają co najmniej jedno `windows` limitu, każde z
etykietą, procentem wykorzystania i opcjonalnym czasem resetowania. Dostawcy, którzy zamiast
resetowalnych limitów udostępniają saldo lub tekst stanu konta, powinni zwracać
`summary` z pustą tablicą `windows`, zamiast tworzyć fikcyjne wartości procentowe.
OpenClaw wyświetla ten tekst podsumowania w danych wyjściowych stanu; należy używać `error` tylko wtedy, gdy
punkt końcowy użycia zakończył się niepowodzeniem lub nie zwrócił użytecznych danych o użyciu.

  <Accordion title="Ścieżki podrzędne uwierzytelniania i zabezpieczeń">
    | Ścieżka podrzędna | Główne eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | Przestarzała szeroka powierzchnia autoryzacji poleceń (`resolveControlCommandGate`, funkcje pomocnicze rejestru poleceń, w tym formatowanie menu argumentów dynamicznych, funkcje pomocnicze autoryzacji nadawcy); należy używać autoryzacji wejściowej kanału lub autoryzacji w czasie wykonywania albo funkcji pomocniczych stanu poleceń |
    | `plugin-sdk/command-status` | Konstruktory komunikatów poleceń i pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Rozpoznawanie zatwierdzającego i funkcje pomocnicze uwierzytelniania działań w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Funkcje pomocnicze profili i filtrów zatwierdzania natywnego wykonywania |
    | `plugin-sdk/approval-delivery-runtime` | Adaptery możliwości i dostarczania natywnych zatwierdzeń |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony mechanizm rozpoznawania Gateway zatwierdzeń |
    | `plugin-sdk/approval-reference-runtime` | Deterministyczna funkcja pomocnicza trwałego lokalizatora dla wywołań zwrotnych zatwierdzania ograniczonych przez transport |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie funkcje pomocnicze ładowania natywnych adapterów zatwierdzania dla często używanych punktów wejścia kanałów |
    | `plugin-sdk/approval-handler-runtime` | Szersze funkcje pomocnicze środowiska wykonawczego obsługi zatwierdzeń; gdy wystarczają węższe interfejsy adaptera lub Gateway, należy preferować je |
    | `plugin-sdk/approval-native-runtime` | Funkcje pomocnicze celu natywnego zatwierdzenia, powiązania konta, bramy tras, mechanizmu awaryjnego przekazywania i pomijania lokalnych monitów natywnego wykonywania |
    | `plugin-sdk/approval-reaction-runtime` | Zakodowane na stałe powiązania reakcji zatwierdzania, ładunki monitów reakcji, magazyny celów reakcji, funkcje pomocnicze tekstu wskazówek reakcji i eksport zgodności do pomijania lokalnych monitów natywnego wykonywania |
    | `plugin-sdk/approval-reply-runtime` | Funkcje pomocnicze ładunków odpowiedzi zatwierdzania wykonywania/pluginu |
    | `plugin-sdk/approval-runtime` | Funkcje pomocnicze ładunków zatwierdzania wykonywania/pluginu, konstruktory możliwości zatwierdzania, funkcje pomocnicze uwierzytelniania i profili zatwierdzania, funkcje pomocnicze trasowania i środowiska wykonawczego natywnych zatwierdzeń oraz funkcje pomocnicze strukturalnego wyświetlania zatwierdzeń, takie jak `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | Przestarzałe wąskie funkcje pomocnicze resetowania deduplikacji odpowiedzi przychodzących |
    | `plugin-sdk/command-auth-native` | Natywne uwierzytelnianie poleceń, formatowanie menu argumentów dynamicznych i funkcje pomocnicze natywnych celów sesji |
    | `plugin-sdk/command-detection` | Współdzielone funkcje pomocnicze wykrywania poleceń |
    | `plugin-sdk/command-primitives-runtime` | Lekkie predykaty tekstu poleceń dla często używanych ścieżek kanałów |
    | `plugin-sdk/command-surface` | Normalizacja treści poleceń i funkcje pomocnicze powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/provider-auth-login-flow-runtime` | Leniwie ładowane funkcje pomocnicze przepływu logowania uwierzytelniania dostawcy do parowania kanału prywatnego i internetowego interfejsu użytkownika przy użyciu kodu urządzenia |
    | `plugin-sdk/channel-secret-runtime` | Przestarzała szeroka powierzchnia kontraktu danych poufnych (`collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, typy celów danych poufnych); należy preferować wyspecjalizowane ścieżki podrzędne poniżej |
    | `plugin-sdk/channel-secret-basic-runtime` | Wąskie eksporty kontraktu danych poufnych i konstruktory rejestrów celów dla powierzchni danych poufnych kanałów/pluginów innych niż TTS |
    | `plugin-sdk/channel-secret-tts-runtime` | Wąskie funkcje pomocnicze przypisywania zagnieżdżonych danych poufnych TTS kanałów |
    | `plugin-sdk/secret-ref-runtime` | Wąskie typowanie i rozpoznawanie SecretRef oraz wyszukiwanie ścieżek celów planu na potrzeby analizowania kontraktu danych poufnych/konfiguracji |
    | `plugin-sdk/secret-provider-integration` | Kontrakty manifestów i ustawień wstępnych integracji dostawców SecretRef przeznaczone wyłącznie do typowania dla pluginów publikujących ustawienia wstępne zewnętrznych dostawców danych poufnych |
    | `plugin-sdk/security-runtime` | Przestarzały szeroki moduł zbiorczy dotyczący zaufania, bramkowania wiadomości prywatnych, ograniczonych do katalogu głównego funkcji pomocniczych plików i ścieżek, w tym zapisów wyłącznie tworzących, synchronicznego i asynchronicznego atomowego zastępowania plików, zapisów do sąsiednich plików tymczasowych, awaryjnego przenoszenia między urządzeniami, funkcji pomocniczych prywatnego magazynu plików, zabezpieczeń nadrzędnych dowiązań symbolicznych, treści zewnętrznej, redagowania tekstu poufnego, porównywania danych poufnych w stałym czasie i funkcji pomocniczych gromadzenia danych poufnych; należy preferować wyspecjalizowane ścieżki podrzędne zabezpieczeń/SSRF/danych poufnych |
    | `plugin-sdk/ssrf-policy` | Lista dozwolonych hostów i funkcje pomocnicze zasad SSRF dla sieci prywatnej |
    | `plugin-sdk/ssrf-dispatcher` | Wąskie funkcje pomocnicze przypiętego dyspozytora bez szerokiej powierzchni środowiska wykonawczego infrastruktury |
    | `plugin-sdk/ssrf-runtime` | Funkcje pomocnicze przypiętego dyspozytora, pobierania zabezpieczonego przed SSRF, błędów SSRF i zasad SSRF |
    | `plugin-sdk/secret-input` | Funkcje pomocnicze analizowania danych wejściowych danych poufnych |
    | `plugin-sdk/webhook-ingress` | Funkcje pomocnicze żądań/celów Webhooka oraz konwersja nieprzetworzonych danych websocket/treści |
    | `plugin-sdk/webhook-request-guards` | Funkcje pomocnicze rozmiaru treści żądania/limitu czasu i `runDetachedWebhookWork` do śledzonego przetwarzania po potwierdzeniu |
  </Accordion>

  <Accordion title="Podścieżki środowiska uruchomieniowego i pamięci masowej">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Pomocnicze funkcje środowiska uruchomieniowego, rejestrowania, kopii zapasowych i procesów oraz ostrzeżenia dotyczące ścieżek instalacji pluginów |
    | `plugin-sdk/runtime-env` | Wyspecjalizowane funkcje pomocnicze zmiennych środowiskowych środowiska uruchomieniowego, loggera, limitów czasu, ponawiania i wycofywania |
    | `plugin-sdk/browser-config` | Obsługiwana fasada konfiguracji przeglądarki do znormalizowanego profilu i wartości domyślnych, analizowania adresów URL CDP oraz funkcji pomocniczych uwierzytelniania sterowania przeglądarką |
    | `plugin-sdk/agent-harness-task-runtime` | Ogólne funkcje pomocnicze cyklu życia zadań i dostarczania wyników ukończenia dla agentów opartych na aparaturze, korzystających z zakresu zadania nadanego przez hosta |
    | `plugin-sdk/codex-mcp-projection` | Zastrzeżona, dołączona funkcja pomocnicza Codex do odwzorowywania konfiguracji serwera MCP użytkownika na konfigurację wątku Codex; nieprzeznaczona dla pluginów innych firm |
    | `plugin-sdk/codex-native-task-runtime` | Lokalna dla repozytorium, dołączona funkcja pomocnicza Codex do natywnego powiązania kopii lustrzanej zadań i środowiska uruchomieniowego; nie jest eksportem pakietu |
    | `plugin-sdk/channel-runtime-context` | Ogólne funkcje pomocnicze rejestrowania i wyszukiwania kontekstu środowiska uruchomieniowego kanału |
    | `plugin-sdk/matrix` | Przestarzała fasada zgodności Matrix dla starszych pakietów kanałów innych firm; nowe pluginy powinny importować bezpośrednio `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | Przestarzała fasada zgodności Mattermost dla starszych pakietów kanałów innych firm; nowe pluginy powinny bezpośrednio importować ogólne podścieżki SDK |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Przestarzały szeroki plik zbiorczy funkcji pomocniczych poleceń, haków, HTTP i interakcji pluginów; preferowane są wyspecjalizowane podścieżki środowiska uruchomieniowego pluginów |
    | `plugin-sdk/hook-runtime` | Przestarzały szeroki plik zbiorczy funkcji pomocniczych Webhooków i potoku wewnętrznych haków; preferowane są wyspecjalizowane podścieżki środowiska uruchomieniowego haków i pluginów |
    | `plugin-sdk/lazy-runtime` | Funkcje pomocnicze leniwego importowania i wiązania środowiska uruchomieniowego, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Funkcje pomocnicze wykonywania procesów |
    | `plugin-sdk/node-host` | Funkcje pomocnicze rozpoznawania plików wykonywalnych hosta Node i wznawiania PTY |
    | `plugin-sdk/cli-runtime` | Przestarzały szeroki plik zbiorczy funkcji pomocniczych formatowania CLI, oczekiwania, wersji, wywoływania argumentów i leniwego ładowania grup poleceń; preferowane są wyspecjalizowane podścieżki CLI i środowiska uruchomieniowego |
    | `plugin-sdk/qa-runner-runtime` | Obsługiwana fasada udostępniająca scenariusze kontroli jakości pluginów za pośrednictwem interfejsu poleceń CLI |
    | `plugin-sdk/tts-runtime` | Obsługiwana fasada schematów konfiguracji zamiany tekstu na mowę i funkcji pomocniczych środowiska uruchomieniowego |
    | `plugin-sdk/gateway-method-runtime` | Zastrzeżona funkcja pomocnicza wysyłania metod Gateway dla tras HTTP pluginów deklarujących `contracts.gatewayMethodDispatch: ["authenticated-request"]` |
    | `plugin-sdk/gateway-runtime` | Klient Gateway, funkcja pomocnicza uruchamiania klienta gotowego na pętlę zdarzeń, RPC CLI Gateway, błędy protokołu Gateway, rozpoznawanie ogłaszanego hosta LAN i funkcje pomocnicze aktualizowania stanu kanału |
    | `plugin-sdk/config-contracts` | Wyspecjalizowany, obejmujący tylko typy interfejs konfiguracji dla kształtów konfiguracji pluginów, takich jak `OpenClawConfig`, oraz typów konfiguracji kanałów i dostawców |
    | `plugin-sdk/plugin-config-runtime` | Funkcje pomocnicze konfiguracji pluginów środowiska uruchomieniowego, takie jak `mergeDeep`, `requireRuntimeConfig`, `resolvePluginConfigObject` i `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | Funkcje pomocnicze transakcyjnej modyfikacji konfiguracji, takie jak `mutateConfigFile`, `replaceConfigFile` i `logConfigUpdated` |
    | `plugin-sdk/message-tool-delivery-hints` | Współdzielone ciągi podpowiedzi metadanych dostarczania dla narzędzi wiadomości |
    | `plugin-sdk/runtime-config-snapshot` | Funkcje pomocnicze migawki konfiguracji bieżącego procesu, takie jak `getRuntimeConfig`, `getRuntimeConfigSnapshot`, oraz funkcje ustawiające migawki testowe |
    | `plugin-sdk/text-autolink-runtime` | Wykrywanie automatycznych linków do odwołań do plików bez szerokiego pliku zbiorczego funkcji tekstowych |
    | `plugin-sdk/reply-runtime` | Współdzielone funkcje pomocnicze środowiska uruchomieniowego wiadomości przychodzących i odpowiedzi, dzielenia na fragmenty, wysyłania, Heartbeat oraz planowania odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wyspecjalizowane funkcje pomocnicze wysyłania i finalizowania odpowiedzi oraz etykietowania konwersacji |
    | `plugin-sdk/reply-history` | Współdzielone funkcje pomocnicze krótkookresowej historii odpowiedzi. Nowy kod obsługi tur wiadomości powinien używać `createChannelHistoryWindow`; funkcje pomocnicze map niższego poziomu pozostają wyłącznie przestarzałymi eksportami zgodności |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wyspecjalizowane funkcje pomocnicze dzielenia tekstu i Markdown na fragmenty |
    | `plugin-sdk/session-store-runtime` | Funkcje pomocnicze przepływu pracy sesji (`getSessionEntry`, `listSessionEntries`, `patchSessionEntry`, `upsertSessionEntry`), funkcje pomocnicze naprawy i cyklu życia (`deleteSessionEntry`, `cleanupSessionLifecycleArtifacts`, `resolveSessionStoreBackupPaths`), funkcje pomocnicze znaczników dla przejściowych wartości `sessionFile`, ograniczone odczyty tekstu ostatnich transkrypcji użytkownika i asystenta według tożsamości sesji, funkcje pomocnicze ścieżki magazynu sesji i klucza sesji oraz odczyty czasu aktualizacji, bez szerokich importów zapisu i konserwacji konfiguracji |
    | `plugin-sdk/session-transcript-runtime` | Tożsamość transkrypcji, funkcje pomocnicze określania zakresu celu, odczytu i zapisu, projekcja widocznych wpisów wiadomości, publikowanie aktualizacji, blokady zapisu i klucze trafień pamięci transkrypcji |
    | `plugin-sdk/sqlite-runtime` | Wyspecjalizowane funkcje pomocnicze schematu agenta SQLite, ścieżek i transakcji dla własnego środowiska uruchomieniowego, bez mechanizmów sterowania cyklem życia bazy danych |
    | `plugin-sdk/cron-store-runtime` | Funkcje pomocnicze ścieżki, wczytywania i zapisywania magazynu Cron |
    | `plugin-sdk/state-paths` | Funkcje pomocnicze ścieżek katalogów stanu i OAuth |
    | `plugin-sdk/plugin-state-runtime` | Typy stanów kluczowanych w pomocniczej bazie SQLite pluginu oraz scentralizowane ustawienia pragma połączenia, zweryfikowana konserwacja WAL i funkcje pomocnicze atomowej migracji schematu STRICT dla baz danych należących do pluginów |
    | `plugin-sdk/routing` | Funkcje pomocnicze wiązania tras, kluczy sesji i kont, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone funkcje pomocnicze podsumowania stanu kanałów i kont, domyślne wartości stanu środowiska uruchomieniowego oraz funkcje pomocnicze metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone funkcje pomocnicze rozpoznawania celów |
    | `plugin-sdk/string-normalization-runtime` | Funkcje pomocnicze normalizacji slugów i ciągów znaków |
    | `plugin-sdk/request-url` | Wyodrębnianie adresów URL w postaci ciągów z danych wejściowych podobnych do fetch/request |
    | `plugin-sdk/run-command` | Ograniczony czasowo moduł uruchamiania poleceń ze znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Wspólne funkcje odczytu parametrów narzędzi i CLI |
    | `plugin-sdk/tool-plugin` | Definiowanie prostego, typowanego pluginu narzędzia agenta i udostępnianie statycznych metadanych do generowania manifestu |
    | `plugin-sdk/tool-payload` | Wyodrębnianie znormalizowanych ładunków z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłania z argumentów narzędzia |
    | `plugin-sdk/sandbox` | Typy zaplecza piaskownicy i funkcje pomocnicze poleceń SSH/OpenShell, w tym wstępne sprawdzanie poleceń wykonania z natychmiastowym zgłaszaniem błędów |
    | `plugin-sdk/temp-path` | Współdzielone funkcje pomocnicze ścieżek pobierania tymczasowego i prywatne, bezpieczne tymczasowe przestrzenie robocze |
    | `plugin-sdk/logging-core` | Funkcje pomocnicze loggera podsystemu i redagowania |
    | `plugin-sdk/markdown-table-runtime` | Tryb tabel Markdown i funkcje pomocnicze konwersji |
    | `plugin-sdk/model-session-runtime` | Funkcje pomocnicze zastępowania modelu i sesji, takie jak `applyModelOverrideToSessionEntry` i `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Funkcje pomocnicze rozpoznawania konfiguracji dostawcy rozmów |
    | `plugin-sdk/json-store` | Małe funkcje pomocnicze odczytu i zapisu stanu JSON |
    | `plugin-sdk/json-unsafe-integers` | Funkcje pomocnicze analizowania JSON, które zachowują niebezpieczne literały liczb całkowitych jako ciągi znaków |
    | `plugin-sdk/file-lock` | Funkcje pomocnicze wielokrotnie wchodzących blokad plików |
    | `plugin-sdk/persistent-dedupe` | Funkcje pomocnicze pamięci podręcznej deduplikacji opartej na dysku |
    | `plugin-sdk/acp-runtime` | Funkcje pomocnicze środowiska uruchomieniowego i sesji ACP oraz wysyłania odpowiedzi |
    | `plugin-sdk/acp-runtime-backend` | Lekkie funkcje pomocnicze rejestrowania zaplecza ACP i wysyłania odpowiedzi dla pluginów wczytywanych podczas uruchamiania |
    | `plugin-sdk/acp-binding-resolve-runtime` | Rozpoznawanie wiązań ACP tylko do odczytu bez importów uruchamiania cyklu życia |
    | `plugin-sdk/agent-config-primitives` | Przestarzałe elementy podstawowe schematu konfiguracji środowiska uruchomieniowego agenta; elementy podstawowe schematu należy importować z utrzymywanego interfejsu należącego do pluginu |
    | `plugin-sdk/boolean-param` | Tolerancyjna funkcja odczytu parametru logicznego |
    | `plugin-sdk/dangerous-name-runtime` | Funkcje pomocnicze rozpoznawania dopasowań niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Funkcje pomocnicze inicjalizacji urządzeń i tokenów parowania, w tym `BOOTSTRAP_HANDOFF_OPERATOR_SCOPES` |
    | `plugin-sdk/extension-shared` | Współdzielone elementy podstawowe funkcji pomocniczych kanałów pasywnych, stanu i pośrednika otoczenia |
    | `plugin-sdk/models-provider-runtime` | Funkcje pomocnicze odpowiedzi poleceń i dostawców `/models` |
    | `plugin-sdk/skill-commands-runtime` | Funkcje pomocnicze wyświetlania listy poleceń Skills |
    | `plugin-sdk/native-command-registry` | Funkcje pomocnicze rejestru, budowania i serializacji natywnych poleceń |
    | `plugin-sdk/agent-harness` | Eksperymentalny interfejs zaufanych pluginów dla niskopoziomowych aparatur agentów: typy aparatury, funkcje pomocnicze sterowania i przerywania aktywnego uruchomienia, funkcje pomocnicze mostka narzędzi OpenClaw, funkcje pomocnicze zasad narzędzi planu środowiska uruchomieniowego, klasyfikacja wyniku końcowego, funkcje pomocnicze formatowania i szczegółów postępu narzędzia oraz narzędzia wyników prób |
    | `plugin-sdk/provider-zai-endpoint` | Przestarzała, należąca do dostawcy Z.AI fasada wykrywania punktów końcowych; należy używać publicznego API pluginu Z.AI |
    | `plugin-sdk/async-lock-runtime` | Lokalna dla procesu funkcja pomocnicza asynchronicznej blokady dla małych plików stanu środowiska uruchomieniowego |
    | `plugin-sdk/channel-activity-runtime` | Funkcja pomocnicza telemetrii aktywności kanału |
    | `plugin-sdk/concurrency-runtime` | Funkcja pomocnicza ograniczania współbieżności zadań asynchronicznych |
    | `plugin-sdk/dedupe-runtime` | Funkcje pomocnicze pamięci podręcznej deduplikacji w pamięci i opartej na trwałym magazynie |
    | `plugin-sdk/delivery-queue-runtime` | Funkcja pomocnicza opróżniania oczekujących dostaw wychodzących |
    | `plugin-sdk/file-access-runtime` | Funkcje pomocnicze bezpiecznych ścieżek do plików lokalnych i źródeł multimediów |
    | `plugin-sdk/heartbeat-runtime` | Funkcje pomocnicze wybudzania, zdarzeń i widoczności Heartbeat |
    | `plugin-sdk/expect-runtime` | Funkcja pomocnicza asercji wymaganej wartości dla możliwych do udowodnienia niezmienników środowiska uruchomieniowego |
    | `plugin-sdk/number-runtime` | Funkcja pomocnicza konwersji wartości numerycznych |
    | `plugin-sdk/secure-random-runtime` | Funkcje pomocnicze bezpiecznych tokenów i UUID |
    | `plugin-sdk/system-event-runtime` | Funkcje pomocnicze kolejki zdarzeń systemowych |
    | `plugin-sdk/transport-ready-runtime` | Funkcja pomocnicza oczekiwania na gotowość transportu |
    | `plugin-sdk/exec-approvals-runtime` | Funkcje pomocnicze pliku zasad zatwierdzania wykonywania bez szerokiego pliku zbiorczego infrastruktury środowiska uruchomieniowego |
    | `plugin-sdk/infra-runtime` | Przestarzała warstwa zgodności; należy używać wyspecjalizowanych podścieżek środowiska uruchomieniowego wymienionych wyżej |
    | `plugin-sdk/collection-runtime` | Małe funkcje pomocnicze ograniczonej pamięci podręcznej |
    | `plugin-sdk/diagnostic-runtime` | Funkcje pomocnicze flag diagnostycznych, zdarzeń i kontekstu śledzenia |
    | `plugin-sdk/error-runtime` | Graf błędów, formatowanie, współdzielone funkcje pomocnicze klasyfikacji błędów, `PlatformMessageNotDispatchedError`, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Funkcje pomocnicze opakowanego fetch, pośrednika, opcji EnvHttpProxyAgent i przypiętego wyszukiwania |
    | `plugin-sdk/runtime-fetch` | Funkcja fetch środowiska uruchomieniowego uwzględniająca dyspozytor, bez importów pośrednika ani chronionej funkcji fetch |
    | `plugin-sdk/inline-image-data-url-runtime` | Funkcje pomocnicze oczyszczania adresów URL danych obrazów wbudowanych i rozpoznawania sygnatur bez szerokiego interfejsu środowiska uruchomieniowego multimediów |
    | `plugin-sdk/response-limit-runtime` | Funkcje odczytu treści odpowiedzi ograniczone liczbą bajtów, czasem bezczynności i terminem, bez szerokiego interfejsu środowiska uruchomieniowego multimediów |
    | `plugin-sdk/session-binding-runtime` | Stan bieżącego wiązania konwersacji bez skonfigurowanego trasowania wiązań ani magazynów parowania |
    | `plugin-sdk/context-visibility-runtime` | Rozpoznawanie widoczności kontekstu i filtrowanie kontekstu uzupełniającego bez szerokich importów konfiguracji i zabezpieczeń |
    | `plugin-sdk/string-coerce-runtime` | Wyspecjalizowane podstawowe funkcje pomocnicze konwersji i normalizacji rekordów i ciągów znaków bez importów Markdown i rejestrowania |
    | `plugin-sdk/html-entity-runtime` | Jednoprzebiegowe dekodowanie encji HTML5 zakończonych średnikiem bez szerokich narzędzi tekstowych |
    | `plugin-sdk/text-utility-runtime` | Niskopoziomowe funkcje pomocnicze tekstu i ścieżek, w tym kodowanie pięciu encji HTML |
    | `plugin-sdk/widget-html` | Wykrywanie kompletnego dokumentu, weryfikacja rozmiaru i błędy danych wejściowych narzędzia dla samodzielnych widżetów HTML |
    | `plugin-sdk/host-runtime` | Funkcje pomocnicze normalizacji nazw hostów i hostów SCP |
    | `plugin-sdk/retry-runtime` | Funkcje pomocnicze konfiguracji i wykonywania ponawiania |
    | `plugin-sdk/agent-runtime` | Przestarzały szeroki plik zbiorczy funkcji pomocniczych katalogu, tożsamości i przestrzeni roboczej agenta, w tym `resolveAgentDir`, `resolveDefaultAgentDir` oraz przestarzały eksport zgodności `resolveOpenClawAgentDir`; preferowane są wyspecjalizowane podścieżki agenta i środowiska uruchomieniowego |
    | `plugin-sdk/directory-runtime` | Oparte na konfiguracji wyszukiwanie i deduplikacja katalogów |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Podścieżki funkcji i testowania">
    | Podścieżka | Główne eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Przestarzały szeroki moduł zbiorczy multimediów, obejmujący `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` i przestarzały `fetchRemoteMedia`; preferowane są `plugin-sdk/media-store`, `plugin-sdk/media-mime`, `plugin-sdk/outbound-media` oraz podścieżki środowiska uruchomieniowego funkcji, a gdy adres URL ma zostać przekształcony w multimedia OpenClaw, przed odczytem bufora należy preferować funkcje pomocnicze magazynu |
    | `plugin-sdk/media-mime` | Wąsko ukierunkowane funkcje pomocnicze do normalizacji typów MIME, mapowania rozszerzeń plików, wykrywania typów MIME i określania rodzaju multimediów |
    | `plugin-sdk/media-store` | Wąsko ukierunkowane funkcje pomocnicze magazynu multimediów, takie jak `saveMediaBuffer` i `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | Współdzielone funkcje pomocnicze przełączania awaryjnego generowania multimediów, wyboru kandydatów i komunikatów o brakującym modelu |
    | `plugin-sdk/media-understanding` | Typy dostawców rozpoznawania multimediów oraz eksporty funkcji pomocniczych dla dostawców dotyczących obrazów, dźwięku i wyodrębniania danych strukturalnych |
    | `plugin-sdk/text-chunking` | Dzielenie tekstu wychodzącego na fragmenty i zakresy z zachowaniem przesunięć, dzielenie Markdown na fragmenty i funkcje pomocnicze renderowania, tokenizacja znaczników HTML z uwzględnieniem cudzysłowów, konwersja tabel Markdown, usuwanie znaczników dyrektyw oraz narzędzia do bezpiecznego przetwarzania tekstu |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz eksporty dyrektyw, rejestru, walidacji, konstruktora TTS zgodnego z OpenAI i funkcji pomocniczych mowy przeznaczone dla dostawców |
    | `plugin-sdk/speech-core` | Współdzielone typy dostawców mowy oraz eksporty rejestru, dyrektyw, normalizacji i funkcji pomocniczych mowy |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji w czasie rzeczywistym, funkcje pomocnicze rejestru i współdzielona funkcja pomocnicza sesji WebSocket |
    | `plugin-sdk/realtime-bootstrap-context` | Funkcja pomocnicza inicjalizacji profilu czasu rzeczywistego do ograniczonego wstrzykiwania kontekstu `IDENTITY.md`, `USER.md` i `SOUL.md` |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu w czasie rzeczywistym, funkcje pomocnicze rejestru i współdzielone funkcje pomocnicze zachowania głosu w czasie rzeczywistym, w tym śledzenie aktywności wyjściowej |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów, funkcje pomocnicze zasobów obrazów i adresów URL danych oraz konstruktor dostawcy obrazów zgodnego z OpenAI |
    | `plugin-sdk/image-generation-core` | Współdzielone typy generowania obrazów oraz funkcje pomocnicze przełączania awaryjnego, uwierzytelniania i rejestru |
    | `plugin-sdk/music-generation` | Typy dostawcy, żądania i wyniku generowania muzyki |
    | `plugin-sdk/music-generation-core` | Przestarzałe współdzielone typy generowania muzyki, funkcje pomocnicze przełączania awaryjnego, wyszukiwanie dostawcy i analizowanie odwołań do modeli; preferowane są powierzchnie dostawców muzyki należące do pluginów |
    | `plugin-sdk/video-generation` | Typy dostawcy, żądania i wyniku generowania wideo |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo, funkcje pomocnicze przełączania awaryjnego, wyszukiwanie dostawcy i analizowanie odwołań do modeli |
    | `plugin-sdk/transcripts` | Współdzielone typy dostawców źródeł transkrypcji, funkcje pomocnicze rejestru, deskryptory sesji i metadane wypowiedzi |
    | `plugin-sdk/webhook-targets` | Rejestr celów Webhook i funkcje pomocnicze instalowania tras |
    | `plugin-sdk/webhook-path` | Przestarzały alias zgodności; należy użyć `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | Współdzielone funkcje pomocnicze zdalnego i lokalnego ładowania multimediów |
    | `plugin-sdk/zod` | Przestarzały reeksport zgodności; należy importować `zod` bezpośrednio z `zod` |
    | `plugin-sdk/plugin-test-api` | Minimalna lokalna dla repozytorium funkcja pomocnicza `createTestPluginApi` do testów jednostkowych bezpośredniej rejestracji pluginów bez importowania pomostów do funkcji pomocniczych testów repozytorium |
    | `plugin-sdk/agent-runtime-test-contracts` | Lokalne dla repozytorium fikstury kontraktów natywnego adaptera środowiska uruchomieniowego agenta do testów uwierzytelniania, dostarczania, mechanizmu awaryjnego, haków narzędzi, nakładki promptu, schematu i projekcji transkrypcji |
    | `plugin-sdk/channel-test-helpers` | Lokalne dla repozytorium funkcje pomocnicze testów ukierunkowanych na kanały, dotyczące kontraktów ogólnych działań, konfiguracji i stanu, asercji katalogów, cyklu życia uruchamiania konta, przekazywania konfiguracji wysyłania, atrap środowiska uruchomieniowego, problemów ze stanem, dostarczania wychodzącego i rejestracji haków |
    | `plugin-sdk/channel-target-testing` | Lokalny dla repozytorium współdzielony zestaw przypadków błędów rozpoznawania celu do testów kanałów |
    | `plugin-sdk/channel-contract-testing` | Lokalne dla repozytorium wąsko ukierunkowane funkcje pomocnicze testów kontraktów kanałów bez szerokiego modułu zbiorczego testowania |
    | `plugin-sdk/plugin-test-contracts` | Lokalne dla repozytorium funkcje pomocnicze kontraktów pakietu pluginu, rejestracji, artefaktów publicznych, bezpośredniego importu, API środowiska uruchomieniowego i skutków ubocznych importu |
    | `plugin-sdk/plugin-state-test-runtime` | Lokalne dla repozytorium funkcje pomocnicze testów magazynu stanu pluginu, kolejki ruchu przychodzącego i bazy danych stanu |
    | `plugin-sdk/provider-test-contracts` | Lokalne dla repozytorium funkcje pomocnicze kontraktów środowiska uruchomieniowego dostawcy, uwierzytelniania, wykrywania, wdrażania, katalogu, kreatora, funkcji multimedialnych, zasad odtwarzania, dźwięku na żywo STT w czasie rzeczywistym, wyszukiwania i pobierania z internetu oraz strumienia |
    | `plugin-sdk/provider-http-test-mocks` | Lokalne dla repozytorium opcjonalne atrapy HTTP i uwierzytelniania Vitest do testów dostawców korzystających z `plugin-sdk/provider-http` |
    | `plugin-sdk/reply-payload-testing` | Lokalne dla repozytorium funkcje pomocnicze do dołączania metadanych do fikstur ładunków odpowiedzi |
    | `plugin-sdk/sqlite-runtime-testing` | Lokalne dla repozytorium funkcje pomocnicze cyklu życia SQLite do testów własnych |
    | `plugin-sdk/test-fixtures` | Lokalne dla repozytorium fikstury ogólnego przechwytywania środowiska uruchomieniowego CLI, kontekstu piaskownicy, modułu zapisującego umiejętności, komunikatów agenta, zdarzeń systemowych, ponownego ładowania modułów, ścieżki dołączonego pluginu, tekstu terminala, dzielenia na fragmenty, tokenów uwierzytelniających i typowanych przypadków |
    | `plugin-sdk/test-node-mocks` | Lokalne dla repozytorium ukierunkowane funkcje pomocnicze atrap wbudowanych modułów Node do użycia wewnątrz fabryk Vitest `vi.mock("node:*")` |
  </Accordion>

  <Accordion title="Podścieżki pamięci">
    | Podścieżka | Główne eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Przestarzały alias zgodności; należy użyć `plugin-sdk/memory-host-core` |
    | `plugin-sdk/memory-core-engine-runtime` | Przestarzała fasada środowiska uruchomieniowego indeksowania i wyszukiwania pamięci; preferowane są niezależne od dostawcy podścieżki hosta pamięci |
    | `plugin-sdk/memory-core-host-embedding-registry` | Lekkie funkcje pomocnicze rejestru dostawców osadzania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty podstawowego silnika hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrakty osadzania hosta pamięci, dostęp do rejestru, dostawca lokalny oraz ogólne funkcje pomocnicze przetwarzania wsadowego i zdalnego. `registerMemoryEmbeddingProvider` na tej powierzchni jest przestarzały; w przypadku nowych dostawców należy używać ogólnego API dostawcy osadzania. |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika pamięci masowej hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Przestarzałe multimodalne funkcje pomocnicze hosta pamięci; preferowane są niezależne od dostawcy podścieżki hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Przestarzałe funkcje pomocnicze zapytań hosta pamięci; preferowane są niezależne od dostawcy podścieżki hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Funkcje pomocnicze sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Przestarzały alias zgodności; należy użyć `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | Funkcje pomocnicze stanu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Funkcje pomocnicze środowiska uruchomieniowego CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Podstawowe funkcje pomocnicze środowiska uruchomieniowego hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Funkcje pomocnicze plików i środowiska uruchomieniowego hosta pamięci |
    | `plugin-sdk/memory-host-core` | Niezależny od dostawcy alias podstawowych funkcji pomocniczych środowiska uruchomieniowego hosta pamięci |
    | `plugin-sdk/memory-host-events` | Niezależny od dostawcy alias funkcji pomocniczych dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Przestarzały alias zgodności; należy użyć `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | Współdzielone funkcje pomocnicze zarządzanego Markdown dla pluginów powiązanych z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada środowiska uruchomieniowego Active Memory zapewniająca dostęp do menedżera wyszukiwania |
    | `plugin-sdk/memory-host-status` | Przestarzały alias zgodności; należy użyć `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="Zastrzeżone podścieżki funkcji pomocniczych dołączonych pluginów">
    Zastrzeżone podścieżki SDK funkcji pomocniczych dołączonych pluginów to wąskie powierzchnie
    właściwe dla poszczególnych właścicieli, przeznaczone dla kodu dołączonych pluginów. Są śledzone w spisie SDK, aby kompilacje
    pakietów i tworzenie aliasów pozostawały deterministyczne, ale nie są ogólnymi API
    do tworzenia pluginów. Nowe kontrakty hosta wielokrotnego użytku powinny korzystać z ogólnych podścieżek SDK,
    takich jak `plugin-sdk/gateway-runtime`, `plugin-sdk/ssrf-runtime` i
    `plugin-sdk/plugin-config-runtime`.

    | Podścieżka | Właściciel i przeznaczenie |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | Funkcja pomocnicza dołączonego pluginu Codex do odwzorowywania konfiguracji serwera MCP użytkownika na konfigurację wątku serwera aplikacji Codex (zastrzeżony eksport pakietu) |
    | `plugin-sdk/codex-native-task-runtime` | Funkcja pomocnicza dołączonego pluginu Codex do odwzorowywania natywnych podagentów serwera aplikacji Codex na stan zadań OpenClaw (tylko lokalnie w repozytorium, nie jest eksportem pakietu) |

  </Accordion>
</AccordionGroup>

## Powiązane materiały

- [Przegląd SDK pluginów](/pl/plugins/sdk-overview)
- [Konfiguracja SDK pluginów](/pl/plugins/sdk-setup)
- [Tworzenie pluginów](/pl/plugins/building-plugins)
