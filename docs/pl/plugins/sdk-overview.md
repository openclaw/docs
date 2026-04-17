---
read_when:
    - Musisz wiedzieć, z której podścieżki SDK importować.
    - Potrzebujesz dokumentacji wszystkich metod rejestracji w `OpenClawPluginApi`.
    - Szukasz konkretnego eksportu SDK.
sidebarTitle: SDK Overview
summary: Mapa importów, dokumentacja API rejestracji i architektura SDK
title: Przegląd Plugin SDK
x-i18n:
    generated_at: "2026-04-17T09:49:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: b177fdb6830f415d998a24812bc2c7db8124d3ba77b0174c9a67ac7d747f7e5a
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Przegląd Plugin SDK

Plugin SDK to typowany kontrakt między pluginami a częścią core. Ta strona jest
dokumentacją tego, **co importować** i **co można rejestrować**.

<Tip>
  **Szukasz poradnika?**
  - Pierwszy plugin? Zacznij od [Pierwsze kroki](/pl/plugins/building-plugins)
  - Plugin kanału? Zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins)
  - Plugin dostawcy? Zobacz [Pluginy dostawców](/pl/plugins/sdk-provider-plugins)
</Tip>

## Konwencja importu

Zawsze importuj z konkretnej podścieżki:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każda podścieżka jest małym, samowystarczalnym modułem. Dzięki temu uruchamianie
pozostaje szybkie i pozwala uniknąć problemów z zależnościami cyklicznymi. W przypadku pomocników wejścia/budowy specyficznych dla kanałów,
preferuj `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` zachowaj dla
szerszej powierzchni zbiorczej i współdzielonych pomocników, takich jak
`buildChannelConfigSchema`.

Nie dodawaj ani nie opieraj się na wygodnych warstwach nazwanych od dostawców, takich jak
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` ani
warstwach pomocniczych oznaczonych marką kanału. Pluginy dostarczane w pakiecie powinny składać generyczne
podścieżki SDK we własnych barrelach `api.ts` lub `runtime-api.ts`, a core
powinien albo używać tych lokalnych barrelli pluginu, albo dodać wąski generyczny
kontrakt SDK, gdy potrzeba rzeczywiście dotyczy wielu kanałów.

Wygenerowana mapa eksportów nadal zawiera niewielki zestaw warstw pomocniczych dla pluginów dostarczanych w pakiecie,
takich jak `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` i `plugin-sdk/matrix*`. Te
podścieżki istnieją wyłącznie na potrzeby utrzymania zgodności i konserwacji pluginów dostarczanych w pakiecie; są
celowo pominięte w poniższej wspólnej tabeli i nie są zalecaną
ścieżką importu dla nowych pluginów zewnętrznych.

## Dokumentacja podścieżek

Najczęściej używane podścieżki, pogrupowane według przeznaczenia. Wygenerowana pełna lista
ponad 200 podścieżek znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`.

Zastrzeżone podścieżki pomocnicze dla pluginów dostarczanych w pakiecie nadal pojawiają się na tej wygenerowanej liście.
Traktuj je jako powierzchnie implementacyjne/zgodnościowe, chyba że strona dokumentacji
wyraźnie promuje którąś z nich jako publiczną.

### Wejście pluginu

| Podścieżka                 | Kluczowe eksporty                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

<AccordionGroup>
  <Accordion title="Podścieżki kanałów">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, a także `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone pomocniki kreatora konfiguracji, prompty allowlisty, konstruktory statusu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Pomocniki konfiguracji/wrót działań dla wielu kont, pomocniki domyślnego fallbacku konta |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, pomocniki normalizacji identyfikatora konta |
    | `plugin-sdk/account-resolution` | Wyszukiwanie konta + pomocniki domyślnego fallbacku |
    | `plugin-sdk/account-helpers` | Wąskie pomocniki listy kont/działań na koncie |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typy schematu konfiguracji kanału |
    | `plugin-sdk/telegram-command-config` | Pomocniki normalizacji/walidacji niestandardowych komend Telegram z fallbackiem do kontraktu dostarczanego w pakiecie |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Współdzielone pomocniki tras wejściowych + budowania envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Współdzielone pomocniki zapisu i dyspozycji wejściowej |
    | `plugin-sdk/messaging-targets` | Pomocniki parsowania/dopasowywania celów |
    | `plugin-sdk/outbound-media` | Współdzielone pomocniki ładowania mediów wychodzących |
    | `plugin-sdk/outbound-runtime` | Pomocniki delegatów tożsamości/wysyłki wychodzącej |
    | `plugin-sdk/thread-bindings-runtime` | Pomocniki cyklu życia i adapterów wiązań wątków |
    | `plugin-sdk/agent-media-payload` | Starszy konstruktor ładunku mediów agenta |
    | `plugin-sdk/conversation-runtime` | Pomocniki wiązania konwersacji/wątku, parowania i skonfigurowanych wiązań |
    | `plugin-sdk/runtime-config-snapshot` | Pomocnik migawki konfiguracji runtime |
    | `plugin-sdk/runtime-group-policy` | Pomocniki rozstrzygania polityk grupowych w runtime |
    | `plugin-sdk/channel-status` | Współdzielone pomocniki migawki/podsumowania statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Pomocniki autoryzacji zapisu konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty preludium pluginu kanału |
    | `plugin-sdk/allowlist-config-edit` | Pomocniki odczytu/edycji konfiguracji allowlisty |
    | `plugin-sdk/group-access` | Współdzielone pomocniki decyzji o dostępie grupowym |
    | `plugin-sdk/direct-dm` | Współdzielone pomocniki auth/guard dla bezpośrednich wiadomości |
    | `plugin-sdk/interactive-runtime` | Pomocniki normalizacji/redukcji interaktywnych ładunków odpowiedzi |
    | `plugin-sdk/channel-inbound` | Pomocniki debounce wejściowego, dopasowania wzmianek, polityki wzmianek oraz envelope |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Pomocniki parsowania/dopasowywania celów |
    | `plugin-sdk/channel-contract` | Typy kontraktu kanału |
    | `plugin-sdk/channel-feedback` | Powiązanie informacji zwrotnej/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie pomocniki kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, oraz typy celu sekretu |
  </Accordion>

  <Accordion title="Podścieżki dostawców">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Starannie dobrane pomocniki konfiguracji lokalnych/samohostowanych dostawców |
    | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane pomocniki konfiguracji samohostowanych dostawców zgodnych z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI + stałe watchdog |
    | `plugin-sdk/provider-auth-runtime` | Pomocniki rozstrzygania kluczy API w runtime dla pluginów dostawców |
    | `plugin-sdk/provider-auth-api-key` | Pomocniki onboardingu/zapisu profilu dla kluczy API, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy konstruktor wyniku auth OAuth |
    | `plugin-sdk/provider-auth-login` | Współdzielone interaktywne pomocniki logowania dla pluginów dostawców |
    | `plugin-sdk/provider-env-vars` | Pomocniki wyszukiwania zmiennych środowiskowych auth dostawców |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory polityk replay, pomocniki endpointów dostawców oraz pomocniki normalizacji identyfikatorów modeli, takie jak `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generyczne pomocniki możliwości HTTP/endpointów dostawców |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie pomocniki kontraktu konfiguracji/wyboru web-fetch, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Pomocniki rejestracji/cache dostawców web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Wąskie pomocniki konfiguracji/danych uwierzytelniających web-search dla dostawców, którzy nie potrzebują powiązania włączania pluginu |
    | `plugin-sdk/provider-web-search-contract` | Wąskie pomocniki kontraktu konfiguracji/danych uwierzytelniających web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowane settery/gettery danych uwierzytelniających |
    | `plugin-sdk/provider-web-search` | Pomocniki rejestracji/cache/runtime dostawców web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematów Gemini + diagnostyka oraz pomocniki zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` i podobne |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz współdzielone pomocniki wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Pomocniki łatek konfiguracji onboardingu |
    | `plugin-sdk/global-singleton` | Pomocniki lokalnych dla procesu singletonów/map/cache |
  </Accordion>

  <Accordion title="Podścieżki auth i bezpieczeństwa">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, pomocniki rejestru komend, pomocniki autoryzacji nadawcy |
    | `plugin-sdk/command-status` | Konstruktory komunikatów komend/pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Pomocniki rozstrzygania zatwierdzającego i auth działań w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Pomocniki profilu/filtra zatwierdzania dla natywnego wykonania |
    | `plugin-sdk/approval-delivery-runtime` | Adaptery dostarczania/możliwości natywnego zatwierdzania |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony pomocnik rozstrzygania Gateway zatwierdzania |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie pomocniki ładowania natywnego adaptera zatwierdzania dla gorących punktów wejścia kanałów |
    | `plugin-sdk/approval-handler-runtime` | Szersze pomocniki runtime obsługi zatwierdzania; gdy wystarczą, preferuj węższe warstwy adaptera/Gateway |
    | `plugin-sdk/approval-native-runtime` | Pomocniki celu natywnego zatwierdzania + wiązania konta |
    | `plugin-sdk/approval-reply-runtime` | Pomocniki ładunku odpowiedzi zatwierdzania exec/pluginu |
    | `plugin-sdk/command-auth-native` | Pomocniki natywnego auth komend + natywnego celu sesji |
    | `plugin-sdk/command-detection` | Współdzielone pomocniki wykrywania komend |
    | `plugin-sdk/command-surface` | Pomocniki normalizacji treści komend i powierzchni komend |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąskie pomocniki zbierania kontraktów sekretów dla powierzchni sekretów kanałów/pluginów |
    | `plugin-sdk/secret-ref-runtime` | Wąskie pomocniki `coerceSecretRef` i typowania SecretRef do parsowania kontraktu sekretów/konfiguracji |
    | `plugin-sdk/security-runtime` | Współdzielone pomocniki zaufania, bramkowania DM, treści zewnętrznych i zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Pomocniki polityki SSRF dla allowlisty hostów i sieci prywatnych |
    | `plugin-sdk/ssrf-runtime` | Pomocniki pinned-dispatcher, fetch chronionego przez SSRF i polityki SSRF |
    | `plugin-sdk/secret-input` | Pomocniki parsowania wejścia sekretów |
    | `plugin-sdk/webhook-ingress` | Pomocniki żądań/celów Webhook |
    | `plugin-sdk/webhook-request-guards` | Pomocniki rozmiaru treści żądania/timeoutu |
  </Accordion>

  <Accordion title="Podścieżki runtime i storage">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie pomocniki runtime/logowania/kopii zapasowych/instalacji pluginów |
    | `plugin-sdk/runtime-env` | Wąskie pomocniki env runtime, loggera, timeoutu, ponawiania i backoff |
    | `plugin-sdk/channel-runtime-context` | Generyczne pomocniki rejestracji i wyszukiwania kontekstu runtime kanału |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone pomocniki komend/hooków/http/interakcji pluginów |
    | `plugin-sdk/hook-runtime` | Współdzielone pomocniki pipeline webhooków/wewnętrznych hooków |
    | `plugin-sdk/lazy-runtime` | Pomocniki leniwego importu/wiązania runtime, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Pomocniki wykonywania procesów |
    | `plugin-sdk/cli-runtime` | Pomocniki formatowania, oczekiwania i wersji CLI |
    | `plugin-sdk/gateway-runtime` | Pomocniki klienta Gateway i łatania statusu kanału |
    | `plugin-sdk/config-runtime` | Pomocniki ładowania/zapisu konfiguracji |
    | `plugin-sdk/telegram-command-config` | Pomocniki normalizacji nazw/opisów komend Telegram oraz sprawdzania duplikatów/konfliktów, nawet gdy powierzchnia kontraktu Telegram dostarczana w pakiecie jest niedostępna |
    | `plugin-sdk/approval-runtime` | Pomocniki zatwierdzania exec/pluginów, konstruktory możliwości zatwierdzania, pomocniki auth/profili, pomocniki natywnego routingu/runtime |
    | `plugin-sdk/reply-runtime` | Współdzielone pomocniki runtime wejścia/odpowiedzi, chunkingu, dyspozycji, Heartbeat, planera odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie pomocniki dyspozycji/finalizacji odpowiedzi |
    | `plugin-sdk/reply-history` | Współdzielone pomocniki historii odpowiedzi dla krótkich okien czasowych, takie jak `buildHistoryContext`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie pomocniki chunkingu tekstu/Markdown |
    | `plugin-sdk/session-store-runtime` | Pomocniki ścieżki storage sesji + `updated-at` |
    | `plugin-sdk/state-paths` | Pomocniki ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/routing` | Pomocniki tras/kluczy sesji/wiązania kont, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone pomocniki podsumowania statusu kanału/konta, domyślne ustawienia stanu runtime i pomocniki metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone pomocniki rozstrzygania celów |
    | `plugin-sdk/string-normalization-runtime` | Pomocniki normalizacji slugów/ciągów znaków |
    | `plugin-sdk/request-url` | Wyodrębniaj adresy URL jako ciągi znaków z wejść typu fetch/request |
    | `plugin-sdk/run-command` | Uruchamianie komend z limitem czasu i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Typowe czytniki parametrów narzędzi/CLI |
    | `plugin-sdk/tool-payload` | Wyodrębnianie znormalizowanych ładunków z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzi |
    | `plugin-sdk/temp-path` | Współdzielone pomocniki ścieżek tymczasowego pobierania |
    | `plugin-sdk/logging-core` | Pomocniki loggera subsystemu i redakcji |
    | `plugin-sdk/markdown-table-runtime` | Pomocniki trybu tabel Markdown |
    | `plugin-sdk/json-store` | Małe pomocniki odczytu/zapisu stanu JSON |
    | `plugin-sdk/file-lock` | Pomocniki reentrant locków plików |
    | `plugin-sdk/persistent-dedupe` | Pomocniki cache deduplikacji opartego na dysku |
    | `plugin-sdk/acp-runtime` | Pomocniki ACP runtime/sesji i dyspozycji odpowiedzi |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji runtime agenta |
    | `plugin-sdk/boolean-param` | Elastyczny czytnik parametrów logicznych |
    | `plugin-sdk/dangerous-name-runtime` | Pomocniki rozstrzygania dopasowania niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Pomocniki bootstrapu urządzeń i tokenów parowania |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy pomocnicze dla kanałów pasywnych, statusu i ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Pomocniki odpowiedzi dostawców/komendy `/models` |
    | `plugin-sdk/skill-commands-runtime` | Pomocniki listowania komend Skills |
    | `plugin-sdk/native-command-registry` | Pomocniki rejestru/budowy/serializacji natywnych komend |
    | `plugin-sdk/agent-harness` | Eksperymentalna powierzchnia zaufanego pluginu dla niskopoziomowych harnessów agentów: typy harnessów, pomocniki sterowania/przerywania aktywnego uruchomienia, pomocniki mostu narzędzi OpenClaw oraz narzędzia wyników prób |
    | `plugin-sdk/provider-zai-endpoint` | Pomocniki wykrywania endpointów Z.AI |
    | `plugin-sdk/infra-runtime` | Pomocniki zdarzeń systemowych/Heartbeat |
    | `plugin-sdk/collection-runtime` | Małe pomocniki cache z ograniczeniem rozmiaru |
    | `plugin-sdk/diagnostic-runtime` | Pomocniki flag i zdarzeń diagnostycznych |
    | `plugin-sdk/error-runtime` | Graf błędów, formatowanie, współdzielone pomocniki klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Pomocniki opakowanego fetch, proxy i pinned lookup |
    | `plugin-sdk/host-runtime` | Pomocniki normalizacji nazwy hosta i hosta SCP |
    | `plugin-sdk/retry-runtime` | Pomocniki konfiguracji ponawiania i uruchamiania ponowień |
    | `plugin-sdk/agent-runtime` | Pomocniki katalogu/tożsamości/workspace agenta |
    | `plugin-sdk/directory-runtime` | Zapytania/deduplikacja katalogów oparta na konfiguracji |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Podścieżki możliwości i testowania">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Współdzielone pomocniki pobierania/przekształcania/storage mediów oraz konstruktory ładunków mediów |
    | `plugin-sdk/media-generation-runtime` | Współdzielone pomocniki failover generowania mediów, wybór kandydatów i komunikaty o brakujących modelach |
    | `plugin-sdk/media-understanding` | Typy dostawców rozumienia mediów oraz eksporty pomocnicze dla obrazów/audio skierowane do dostawców |
    | `plugin-sdk/text-runtime` | Współdzielone pomocniki tekstu/Markdown/logowania, takie jak usuwanie tekstu widocznego dla asystenta, pomocniki renderowania/chunkingu/tabel Markdown, pomocniki redakcji, pomocniki tagów dyrektyw i narzędzia bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Pomocnik chunkingu tekstu wychodzącego |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz eksporty pomocnicze dla dyrektyw, rejestru i walidacji skierowane do dostawców |
    | `plugin-sdk/speech-core` | Współdzielone typy dostawców mowy, pomocniki rejestru, dyrektyw i normalizacji |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji w czasie rzeczywistym i pomocniki rejestru |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu w czasie rzeczywistym i pomocniki rejestru |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów |
    | `plugin-sdk/image-generation-core` | Współdzielone typy generowania obrazów, pomocniki failover, auth i rejestru |
    | `plugin-sdk/music-generation` | Typy dostawców/żądań/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Współdzielone typy generowania muzyki, pomocniki failover, wyszukiwanie dostawców i parsowanie model-ref |
    | `plugin-sdk/video-generation` | Typy dostawców/żądań/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo, pomocniki failover, wyszukiwanie dostawców i parsowanie model-ref |
    | `plugin-sdk/webhook-targets` | Rejestr celów Webhook i pomocniki instalacji tras |
    | `plugin-sdk/webhook-path` | Pomocniki normalizacji ścieżek Webhook |
    | `plugin-sdk/web-media` | Współdzielone pomocniki ładowania mediów zdalnych/lokalnych |
    | `plugin-sdk/zod` | Reeksport `zod` dla użytkowników Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Podścieżki pamięci">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Powierzchnia pomocnicza `memory-core` dostarczana w pakiecie dla pomocników managera/konfiguracji/plików/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime indeksowania/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika foundation hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrakty embeddingów hosta pamięci, dostęp do rejestru, lokalny dostawca oraz generyczne pomocniki batch/zdalne |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika storage hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Pomocniki multimodalne hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Pomocniki zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Pomocniki sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Pomocniki dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-core-host-status` | Pomocniki statusu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Pomocniki CLI runtime hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Pomocniki core runtime hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Pomocniki plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny względem dostawcy alias dla pomocników core runtime hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny względem dostawcy alias dla pomocników dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Neutralny względem dostawcy alias dla pomocników plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-markdown` | Współdzielone pomocniki zarządzanego Markdown dla pluginów powiązanych z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada runtime Active Memory dla dostępu do managera wyszukiwania |
    | `plugin-sdk/memory-host-status` | Neutralny względem dostawcy alias dla pomocników statusu hosta pamięci |
    | `plugin-sdk/memory-lancedb` | Powierzchnia pomocnicza `memory-lancedb` dostarczana w pakiecie |
  </Accordion>

  <Accordion title="Zastrzeżone podścieżki pomocnicze dostarczane w pakiecie">
    | Rodzina | Bieżące podścieżki | Zamierzone użycie |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Pomocniki wsparcia dla pluginu Browser dostarczanego w pakiecie (`browser-support` pozostaje barrelem zgodnościowym) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Powierzchnia pomocnicza/runtime Matrix dostarczana w pakiecie |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Powierzchnia pomocnicza/runtime LINE dostarczana w pakiecie |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Powierzchnia pomocnicza IRC dostarczana w pakiecie |
    | Pomocniki specyficzne dla kanałów | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Warstwy zgodnościowe/pomocnicze kanałów dostarczanych w pakiecie |
    | Pomocniki specyficzne dla auth/pluginów | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Warstwy pomocnicze funkcji/pluginów dostarczanych w pakiecie; `plugin-sdk/github-copilot-token` obecnie eksportuje `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` i `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API rejestracji

Callback `register(api)` otrzymuje obiekt `OpenClawPluginApi` z następującymi
metodami:

### Rejestracja możliwości

| Metoda                                           | Co rejestruje                         |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Inferencję tekstową (LLM)             |
| `api.registerAgentHarness(...)`                  | Eksperymentalny niskopoziomowy wykonawca agenta |
| `api.registerCliBackend(...)`                    | Lokalny backend inferencji CLI        |
| `api.registerChannel(...)`                       | Kanał komunikacyjny                   |
| `api.registerSpeechProvider(...)`                | Syntezę tekst-na-mowę / STT           |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniową transkrypcję w czasie rzeczywistym |
| `api.registerRealtimeVoiceProvider(...)`         | Dwukierunkowe sesje głosowe w czasie rzeczywistym |
| `api.registerMediaUnderstandingProvider(...)`    | Analizę obrazów/audio/wideo           |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów                   |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki                    |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo                     |
| `api.registerWebFetchProvider(...)`              | Dostawcę web fetch / scrape           |
| `api.registerWebSearchProvider(...)`             | Wyszukiwanie w sieci                  |

### Narzędzia i komendy

| Metoda                          | Co rejestruje                                 |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane lub `{ optional: true }`) |
| `api.registerCommand(def)`      | Komendę niestandardową (z pominięciem LLM)    |

### Infrastruktura

| Metoda                                         | Co rejestruje                           |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook zdarzeń                            |
| `api.registerHttpRoute(params)`                | Punkt końcowy HTTP Gateway              |
| `api.registerGatewayMethod(name, handler)`     | Metodę RPC Gateway                      |
| `api.registerCli(registrar, opts?)`            | Podkomendę CLI                          |
| `api.registerService(service)`                 | Usługę działającą w tle                 |
| `api.registerInteractiveHandler(registration)` | Interaktywny handler                    |
| `api.registerMemoryPromptSupplement(builder)`  | Dodatkową sekcję promptu związaną z pamięcią |
| `api.registerMemoryCorpusSupplement(adapter)`  | Dodatkowy korpus pamięci do wyszukiwania/odczytu |

Zastrzeżone przestrzenie nazw administracyjnych core (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze pozostają `operator.admin`, nawet jeśli plugin próbuje przypisać
węższy zakres metody Gateway. Dla
metod należących do pluginu preferuj prefiksy specyficzne dla pluginu.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` akceptuje dwa rodzaje metadanych najwyższego poziomu:

- `commands`: jawne korzenie komend należące do rejestratora
- `descriptors`: deskryptory komend czasu parsowania używane dla głównej pomocy CLI,
  routingu i leniwej rejestracji CLI pluginu

Jeśli chcesz, aby komenda pluginu pozostała leniwie ładowana w zwykłej ścieżce głównego CLI,
podaj `descriptors`, które obejmują każdy korzeń komendy najwyższego poziomu udostępniany przez ten
rejestrator.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Zarządzaj kontami Matrix, weryfikacją, urządzeniami i stanem profilu",
        hasSubcommands: true,
      },
    ],
  },
);
```

Używaj samego `commands` tylko wtedy, gdy nie potrzebujesz leniwej rejestracji w głównym CLI.
Ta zgodnościowa ścieżka eager nadal jest wspierana, ale nie instaluje
placeholderów opartych na deskryptorach do leniwego ładowania w czasie parsowania.

### Rejestracja backendu CLI

`api.registerCliBackend(...)` pozwala pluginowi przejąć domyślną konfigurację dla lokalnego
backendu CLI AI, takiego jak `codex-cli`.

- `id` backendu staje się prefiksem dostawcy w odwołaniach do modeli takich jak `codex-cli/gpt-5`.
- `config` backendu używa tego samego kształtu co `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal ma pierwszeństwo. OpenClaw scala `agents.defaults.cliBackends.<id>` z domyślną konfiguracją
  pluginu przed uruchomieniem CLI.
- Użyj `normalizeConfig`, gdy backend potrzebuje przepisania zgodności po scaleniu
  (na przykład normalizacji starych kształtów flag).

### Sloty wyłączne

| Metoda                                     | Co rejestruje                                                                                                                                         |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (aktywny może być tylko jeden naraz). Callback `assemble()` otrzymuje `availableTools` i `citationsMode`, aby silnik mógł dopasować dodatki do promptu. |
| `api.registerMemoryCapability(capability)` | Ujednoliconą możliwość pamięci                                                                                                                        |
| `api.registerMemoryPromptSection(builder)` | Konstruktor sekcji promptu pamięci                                                                                                                    |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu opróżniania pamięci                                                                                                                    |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime pamięci                                                                                                                               |

### Adaptery embeddingów pamięci

| Metoda                                         | Co rejestruje                                  |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embeddingów pamięci dla aktywnego pluginu |

- `registerMemoryCapability` to preferowane wyłączne API pluginu pamięci.
- `registerMemoryCapability` może także udostępniać `publicArtifacts.listArtifacts(...)`,
  aby pluginy towarzyszące mogły korzystać z eksportowanych artefaktów pamięci przez
  `openclaw/plugin-sdk/memory-host-core`, zamiast sięgać do prywatnego układu
  konkretnego pluginu pamięci.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` i
  `registerMemoryRuntime` to zgodnościowe starsze wyłączne API pluginu pamięci.
- `registerMemoryEmbeddingProvider` pozwala aktywnemu pluginowi pamięci rejestrować jeden
  lub więcej identyfikatorów adapterów embeddingów (na przykład `openai`, `gemini` lub niestandardowy
  identyfikator zdefiniowany przez plugin).
- Konfiguracja użytkownika, taka jak `agents.defaults.memorySearch.provider` i
  `agents.defaults.memorySearch.fallback`, jest rozstrzygana względem tych zarejestrowanych
  identyfikatorów adapterów.

### Zdarzenia i cykl życia

| Metoda                                       | Co robi                     |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Typowany hook cyklu życia   |
| `api.onConversationBindingResolved(handler)` | Callback rozstrzygnięcia wiązania konwersacji |

### Semantyka decyzji hooków

- `before_tool_call`: zwrócenie `{ block: true }` jest rozstrzygające. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest rozstrzygające. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest rozstrzygające. Gdy dowolny handler przejmie dyspozycję, handlery o niższym priorytecie i domyślna ścieżka dyspozycji modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest rozstrzygające. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.

### Pola obiektu API

| Pole                     | Typ                       | Opis                                                                                       |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Identyfikator pluginu                                                                      |
| `api.name`               | `string`                  | Nazwa wyświetlana                                                                          |
| `api.version`            | `string?`                 | Wersja pluginu (opcjonalna)                                                                |
| `api.description`        | `string?`                 | Opis pluginu (opcjonalny)                                                                  |
| `api.source`             | `string`                  | Ścieżka źródłowa pluginu                                                                   |
| `api.rootDir`            | `string?`                 | Katalog główny pluginu (opcjonalny)                                                        |
| `api.config`             | `OpenClawConfig`          | Bieżąca migawka konfiguracji (aktywny snapshot runtime w pamięci, gdy jest dostępny)      |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfiguracja specyficzna dla pluginu z `plugins.entries.<id>.config`                       |
| `api.runtime`            | `PluginRuntime`           | [Pomocniki runtime](/pl/plugins/sdk-runtime)                                                  |
| `api.logger`             | `PluginLogger`            | Logger o zawężonym zakresie (`debug`, `info`, `warn`, `error`)                             |
| `api.registrationMode`   | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno uruchamiania/konfiguracji przed pełnym wejściem |
| `api.resolvePath(input)` | `(string) => string`      | Rozstrzyga ścieżkę względem katalogu głównego pluginu                                      |

## Konwencja modułów wewnętrznych

W obrębie pluginu używaj lokalnych plików barrel do importów wewnętrznych:

```
my-plugin/
  api.ts            # Publiczne eksporty dla zewnętrznych odbiorców
  runtime-api.ts    # Eksporty runtime wyłącznie do użytku wewnętrznego
  index.ts          # Punkt wejścia pluginu
  setup-entry.ts    # Lekki punkt wejścia tylko do konfiguracji (opcjonalny)
```

<Warning>
  Nigdy nie importuj własnego pluginu przez `openclaw/plugin-sdk/<your-plugin>`
  w kodzie produkcyjnym. Kieruj importy wewnętrzne przez `./api.ts` lub
  `./runtime-api.ts`. Ścieżka SDK jest wyłącznie kontraktem zewnętrznym.
</Warning>

Ładowane przez fasadę publiczne powierzchnie pluginów dostarczanych w pakiecie (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` i podobne publiczne pliki wejściowe) preferują teraz
aktywną migawkę konfiguracji runtime, gdy OpenClaw już działa. Jeśli migawka runtime
nie istnieje jeszcze, wracają do rozstrzygniętego pliku konfiguracji na dysku.

Pluginy dostawców mogą także udostępniać wąski lokalny barrel kontraktu pluginu, gdy
pomocnik jest celowo specyficzny dla dostawcy i nie należy jeszcze do generycznej podścieżki SDK.
Bieżący przykład dostarczany w pakiecie: dostawca Anthropic przechowuje swoje pomocniki
strumieni Claude we własnej publicznej warstwie `api.ts` / `contract-api.ts`, zamiast
promować logikę nagłówków beta Anthropic i `service_tier` do generycznego
kontraktu `plugin-sdk/*`.

Inne bieżące przykłady dostarczane w pakiecie:

- `@openclaw/openai-provider`: `api.ts` eksportuje konstruktory dostawców,
  pomocniki modeli domyślnych i konstruktory dostawców realtime
- `@openclaw/openrouter-provider`: `api.ts` eksportuje konstruktor dostawcy oraz
  pomocniki onboardingu/konfiguracji

<Warning>
  Kod produkcyjny rozszerzeń powinien także unikać importów `openclaw/plugin-sdk/<other-plugin>`.
  Jeśli pomocnik jest rzeczywiście współdzielony, przenieś go do neutralnej podścieżki SDK,
  takiej jak `openclaw/plugin-sdk/speech`, `.../provider-model-shared` lub innej
  powierzchni zorientowanej na możliwości, zamiast ściśle wiązać ze sobą dwa pluginy.
</Warning>

## Powiązane

- [Punkty wejścia](/pl/plugins/sdk-entrypoints) — opcje `definePluginEntry` i `defineChannelPluginEntry`
- [Pomocniki runtime](/pl/plugins/sdk-runtime) — pełna dokumentacja przestrzeni nazw `api.runtime`
- [Konfiguracja i config](/pl/plugins/sdk-setup) — pakowanie, manifesty, schematy konfiguracji
- [Testowanie](/pl/plugins/sdk-testing) — narzędzia testowe i reguły lint
- [Migracja SDK](/pl/plugins/sdk-migration) — migracja ze starszych, wycofywanych powierzchni
- [Wnętrze pluginów](/pl/plugins/architecture) — szczegółowa architektura i model możliwości
