---
read_when:
    - Musisz wiedzieć, z której podścieżki SDK importować
    - Chcesz referencję wszystkich metod rejestracji w OpenClawPluginApi
    - Szukasz konkretnego eksportu SDK
sidebarTitle: SDK Overview
summary: Mapa importów, referencja API rejestracji i architektura SDK
title: Przegląd Plugin SDK
x-i18n:
    generated_at: "2026-04-21T09:57:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4561c074bb45529cd94d9d23ce7820b668cbc4ff6317230fdd5a5f27c5f14c67
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Przegląd Plugin SDK

Plugin SDK to typowany kontrakt między pluginami a core. Ta strona jest
referencją dla **co importować** i **co można rejestrować**.

<Tip>
  **Szukasz przewodnika krok po kroku?**
  - Pierwszy Plugin? Zacznij od [Pierwsze kroki](/pl/plugins/building-plugins)
  - Plugin kanału? Zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins)
  - Plugin dostawcy? Zobacz [Pluginy dostawców](/pl/plugins/sdk-provider-plugins)
</Tip>

## Konwencja importów

Zawsze importuj z konkretnej podścieżki:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każda podścieżka to mały, samowystarczalny moduł. Dzięki temu start jest szybki i
zapobiega problemom z zależnościami cyklicznymi. Dla helperów wejścia/budowania specyficznych dla kanałów
preferuj `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` zachowaj dla
szerszej powierzchni zbiorczej i współdzielonych helperów, takich jak
`buildChannelConfigSchema`.

Nie dodawaj ani nie polegaj na wygodnych seamach nazwanych od dostawców, takich jak
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` ani
helperowych seamach brandowanych kanałem. Dołączone pluginy powinny składać generyczne
podścieżki SDK we własnych barrelach `api.ts` albo `runtime-api.ts`, a core
powinno albo używać tych lokalnych barrelli pluginu, albo dodać wąski generyczny kontrakt SDK,
gdy potrzeba jest rzeczywiście międzykanałowa.

Wygenerowana mapa eksportów nadal zawiera mały zestaw helperowych seamów dołączonych pluginów,
takich jak `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` i `plugin-sdk/matrix*`. Te
podścieżki istnieją wyłącznie dla utrzymania dołączonych pluginów i zgodności; są
celowo pominięte w typowej tabeli poniżej i nie są rekomendowaną ścieżką importu dla nowych pluginów firm trzecich.

## Referencja podścieżek

Najczęściej używane podścieżki, pogrupowane według celu. Wygenerowana pełna lista
ponad 200 podścieżek znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`.

Zarezerwowane helperowe podścieżki dołączonych pluginów nadal pojawiają się na tej wygenerowanej liście.
Traktuj je jako szczegóły implementacyjne/powierzchnie zgodności, chyba że strona dokumentacji
jawnie promuje którąś z nich jako publiczną.

### Wejście pluginu

| Podścieżka                 | Kluczowe eksporty                                                                                                                       |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`  | `definePluginEntry`                                                                                                                     |
| `plugin-sdk/core`          | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema` | `OpenClawSchema`                                                                                                                        |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Podścieżki kanałów">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone helpery kreatora konfiguracji, prompty allowlist, buildery statusu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpery konfiguracji/akcyjnych bramek dla wielu kont, helpery zapasowe dla konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpery normalizacji identyfikatora konta |
    | `plugin-sdk/account-resolution` | Helpery wyszukiwania konta + zapasowego konta domyślnego |
    | `plugin-sdk/account-helpers` | Wąskie helpery listy kont/akcji na koncie |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typy schematu konfiguracji kanału |
    | `plugin-sdk/telegram-command-config` | Helpery normalizacji/walidacji niestandardowych poleceń Telegram z zapasowym kontraktem dołączonym |
    | `plugin-sdk/command-gating` | Wąskie helpery bramkowania autoryzacji poleceń |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Współdzielone helpery routowania inbound + budowania koperty |
    | `plugin-sdk/inbound-reply-dispatch` | Współdzielone helpery zapisywania i dispatchowania inbound |
    | `plugin-sdk/messaging-targets` | Helpery parsowania/dopasowywania celów |
    | `plugin-sdk/outbound-media` | Współdzielone helpery ładowania mediów outbound |
    | `plugin-sdk/outbound-runtime` | Helpery tożsamości outbound, delegata wysyłki i planowania payloadów |
    | `plugin-sdk/poll-runtime` | Wąskie helpery normalizacji ankiet |
    | `plugin-sdk/thread-bindings-runtime` | Helpery lifecycle i adapterów dla powiązań wątków |
    | `plugin-sdk/agent-media-payload` | Starszy builder payloadu mediów agenta |
    | `plugin-sdk/conversation-runtime` | Helpery powiązań rozmów/wątków, parowania i skonfigurowanych powiązań |
    | `plugin-sdk/runtime-config-snapshot` | Helper migawki konfiguracji runtime |
    | `plugin-sdk/runtime-group-policy` | Helpery rozwiązywania polityki grupowej runtime |
    | `plugin-sdk/channel-status` | Współdzielone helpery migawek/podsumowań statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Helpery autoryzacji zapisów konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty preludium pluginów kanału |
    | `plugin-sdk/allowlist-config-edit` | Helpery edycji/odczytu konfiguracji allowlist |
    | `plugin-sdk/group-access` | Współdzielone helpery decyzji o dostępie do grup |
    | `plugin-sdk/direct-dm` | Współdzielone helpery auth/guard dla bezpośrednich DM |
    | `plugin-sdk/interactive-runtime` | Helpery normalizacji/redukcji payloadów odpowiedzi interaktywnych |
    | `plugin-sdk/channel-inbound` | Barrel zgodności dla debouncingu inbound, dopasowywania wzmianek, helperów polityki wzmianek i helperów kopert |
    | `plugin-sdk/channel-mention-gating` | Wąskie helpery polityki wzmianek bez szerszej powierzchni runtime inbound |
    | `plugin-sdk/channel-location` | Helpery kontekstu lokalizacji kanału i formatowania |
    | `plugin-sdk/channel-logging` | Helpery logowania kanału dla odrzuceń inbound i błędów typing/ack |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helpery parsowania/dopasowywania celów |
    | `plugin-sdk/channel-contract` | Typy kontraktu kanału |
    | `plugin-sdk/channel-feedback` | Okablowanie feedback/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` i typy celów sekretów |
  </Accordion>

  <Accordion title="Podścieżki dostawców">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratorowane helpery konfiguracji lokalnych/samohostowanych dostawców |
    | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane helpery konfiguracji samohostowanych dostawców zgodnych z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI + stałe watchdoga |
    | `plugin-sdk/provider-auth-runtime` | Helpery rozwiązywania kluczy API w runtime dla pluginów dostawców |
    | `plugin-sdk/provider-auth-api-key` | Helpery onboardingu/zapisu profilu klucza API, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy builder wyniku uwierzytelniania OAuth |
    | `plugin-sdk/provider-auth-login` | Współdzielone helpery interaktywnego logowania dla pluginów dostawców |
    | `plugin-sdk/provider-env-vars` | Helpery wyszukiwania zmiennych środowiskowych uwierzytelniania dostawców |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone buildery polityki replay, helpery endpointów dostawców i helpery normalizacji identyfikatorów modeli, takie jak `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generyczne helpery HTTP/możliwości endpointów dostawców |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie helpery kontraktu konfiguracji/wyboru web-fetch, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpery rejestracji/cache web-fetch dostawców |
    | `plugin-sdk/provider-web-search-config-contract` | Wąskie helpery konfiguracji/poświadczeń web-search dla dostawców, którzy nie potrzebują okablowania włączenia pluginu |
    | `plugin-sdk/provider-web-search-contract` | Wąskie helpery kontraktu konfiguracji/poświadczeń web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowane settery/gettery poświadczeń |
    | `plugin-sdk/provider-web-search` | Helpery rejestracji/cache/runtime web-search dostawców |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, cleanup + diagnostyka schematów Gemini oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` i podobne |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni i współdzielone helpery wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Natywne helpery transportu dostawców, takie jak guarded fetch, transformacje wiadomości transportowych i zapisywalne strumienie zdarzeń transportowych |
    | `plugin-sdk/provider-onboard` | Helpery łatek konfiguracji onboardingu |
    | `plugin-sdk/global-singleton` | Helpery singletonów/map/cache lokalnych dla procesu |
  </Accordion>

  <Accordion title="Podścieżki auth i bezpieczeństwa">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpery rejestru poleceń, helpery autoryzacji nadawcy |
    | `plugin-sdk/command-status` | Buildery wiadomości poleceń/pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpery rozwiązywania zatwierdzających i autoryzacji akcji w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Natywne helpery profilu/filtra zatwierdzeń exec |
    | `plugin-sdk/approval-delivery-runtime` | Natywne adaptery możliwości/dostarczania zatwierdzeń |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony helper rozwiązywania gateway zatwierdzeń |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie helpery ładowania natywnego adaptera zatwierdzeń dla gorących entrypointów kanałów |
    | `plugin-sdk/approval-handler-runtime` | Szersze helpery runtime obsługi zatwierdzeń; preferuj węższe seamy adapter/gateway, gdy wystarczają |
    | `plugin-sdk/approval-native-runtime` | Helpery natywnego celu zatwierdzeń + powiązań kont |
    | `plugin-sdk/approval-reply-runtime` | Helpery payloadów odpowiedzi zatwierdzeń exec/plugin |
    | `plugin-sdk/command-auth-native` | Natywne auth poleceń + helpery natywnego celu sesji |
    | `plugin-sdk/command-detection` | Współdzielone helpery wykrywania poleceń |
    | `plugin-sdk/command-surface` | Helpery normalizacji treści polecenia i powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery zbierania kontraktu sekretów dla powierzchni sekretów kanału/pluginu |
    | `plugin-sdk/secret-ref-runtime` | Wąskie helpery `coerceSecretRef` i typowania SecretRef dla parsowania kontraktu sekretów/konfiguracji |
    | `plugin-sdk/security-runtime` | Współdzielone helpery zaufania, bramkowania DM, treści zewnętrznych i zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Helpery allowlist hostów i polityki SSRF dla sieci prywatnej |
    | `plugin-sdk/ssrf-dispatcher` | Wąskie helpery przypiętego dispatchera bez szerokiej powierzchni runtime infrastruktury |
    | `plugin-sdk/ssrf-runtime` | Helpery przypiętego dispatchera, fetch chronionego SSRF i polityki SSRF |
    | `plugin-sdk/secret-input` | Helpery parsowania wejścia sekretów |
    | `plugin-sdk/webhook-ingress` | Helpery żądań/celów Webhook |
    | `plugin-sdk/webhook-request-guards` | Helpery rozmiaru body/timeoutu żądania |
  </Accordion>

  <Accordion title="Podścieżki runtime i storage">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie helpery runtime/logowania/backupu/instalacji pluginów |
    | `plugin-sdk/runtime-env` | Wąskie helpery env runtime, loggera, timeoutu, retry i backoff |
    | `plugin-sdk/channel-runtime-context` | Generyczne helpery rejestracji i wyszukiwania kontekstu runtime kanału |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone helpery poleceń/hooków/http/interaktywne dla pluginów |
    | `plugin-sdk/hook-runtime` | Współdzielone helpery pipeline Webhook/wewnętrznych hooków |
    | `plugin-sdk/lazy-runtime` | Helpery leniwego importu/powiązań runtime, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpery exec procesów |
    | `plugin-sdk/cli-runtime` | Helpery formatowania CLI, oczekiwania i wersji |
    | `plugin-sdk/gateway-runtime` | Helpery klienta Gateway i łatania statusu kanału |
    | `plugin-sdk/config-runtime` | Helpery ładowania/zapisu konfiguracji |
    | `plugin-sdk/telegram-command-config` | Helpery normalizacji nazw/opisów poleceń Telegram i sprawdzania duplikatów/konfliktów, nawet gdy dołączona powierzchnia kontraktu Telegram jest niedostępna |
    | `plugin-sdk/text-autolink-runtime` | Wykrywanie autolinków odwołań do plików bez szerokiego barrela text-runtime |
    | `plugin-sdk/approval-runtime` | Helpery zatwierdzeń exec/plugin, buildery możliwości zatwierdzeń, helpery auth/profili, helpery natywnego routowania/runtime |
    | `plugin-sdk/reply-runtime` | Współdzielone helpery runtime inbound/odpowiedzi, chunking, dispatch, Heartbeat, planner odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery dispatch/finalizacji odpowiedzi |
    | `plugin-sdk/reply-history` | Współdzielone helpery historii odpowiedzi z krótkiego okna, takie jak `buildHistoryContext`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie helpery chunkingu tekstu/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpery ścieżki store sesji + `updated-at` |
    | `plugin-sdk/state-paths` | Helpery ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/routing` | Helpery routingu/klucza sesji/powiązań kont, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone helpery podsumowań statusu kanału/konta, domyślne stany runtime i helpery metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone helpery resolvera celu |
    | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji slugów/ciągów |
    | `plugin-sdk/request-url` | Wyodrębnianie URL jako string z wejść podobnych do fetch/request |
    | `plugin-sdk/run-command` | Runner poleceń z limitem czasu i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Typowe readery parametrów narzędzi/CLI |
    | `plugin-sdk/tool-payload` | Wyodrębnianie znormalizowanych payloadów z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
    | `plugin-sdk/temp-path` | Współdzielone helpery ścieżek tymczasowych pobrań |
    | `plugin-sdk/logging-core` | Helpery loggera subsystemu i redakcji |
    | `plugin-sdk/markdown-table-runtime` | Helpery trybu tabel Markdown |
    | `plugin-sdk/json-store` | Małe helpery odczytu/zapisu stanu JSON |
    | `plugin-sdk/file-lock` | Reentrant helpery blokady pliku |
    | `plugin-sdk/persistent-dedupe` | Helpery cache deduplikacji opartej na dysku |
    | `plugin-sdk/acp-runtime` | Helpery ACP runtime/sesji i dispatchu odpowiedzi |
    | `plugin-sdk/acp-binding-resolve-runtime` | Tylko do odczytu rozwiązywanie powiązań ACP bez importów startowych lifecycle |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji runtime agenta |
    | `plugin-sdk/boolean-param` | Luźny reader parametru boolean |
    | `plugin-sdk/dangerous-name-runtime` | Helpery rozwiązywania dopasowania niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Helpery bootstrapu urządzeń i tokenów parowania |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy helperów kanałów pasywnych, statusu i ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Helpery odpowiedzi polecenia `/models`/dostawców |
    | `plugin-sdk/skill-commands-runtime` | Helpery listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Helpery rejestru/budowania/serializacji natywnych poleceń |
    | `plugin-sdk/agent-harness` | Eksperymentalna powierzchnia zaufanego pluginu dla niskopoziomowych harnessów agentów: typy harness, helpery steer/abort aktywnych uruchomień, helpery mostka narzędzi OpenClaw i narzędzia wyników prób |
    | `plugin-sdk/provider-zai-endpoint` | Helpery wykrywania endpointów Z.AI |
    | `plugin-sdk/infra-runtime` | Helpery zdarzeń systemowych/Heartbeat |
    | `plugin-sdk/collection-runtime` | Małe helpery ograniczonego cache |
    | `plugin-sdk/diagnostic-runtime` | Helpery flag diagnostycznych i zdarzeń |
    | `plugin-sdk/error-runtime` | Graf błędów, formatowanie, współdzielone helpery klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Opakowany fetch, proxy i helpery przypiętego lookup |
    | `plugin-sdk/runtime-fetch` | Fetch runtime świadomy dispatchera bez importów proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Reader body odpowiedzi z ograniczeniem bez szerokiej powierzchni media runtime |
    | `plugin-sdk/session-binding-runtime` | Bieżący stan powiązania rozmowy bez skonfigurowanego routowania powiązań ani store parowania |
    | `plugin-sdk/session-store-runtime` | Helpery odczytu store sesji bez szerokich importów zapisów/utrzymania konfiguracji |
    | `plugin-sdk/context-visibility-runtime` | Rozwiązywanie widoczności kontekstu i filtrowanie dodatkowego kontekstu bez szerokich importów config/security |
    | `plugin-sdk/string-coerce-runtime` | Wąskie helpery koercji i normalizacji prymitywnych rekordów/stringów bez importów Markdown/logowania |
    | `plugin-sdk/host-runtime` | Helpery normalizacji hostname i hosta SCP |
    | `plugin-sdk/retry-runtime` | Helpery konfiguracji retry i runnera retry |
    | `plugin-sdk/agent-runtime` | Helpery katalogu/tożsamości/workspace agenta |
    | `plugin-sdk/directory-runtime` | Query/dedup katalogów oparte na konfiguracji |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Podścieżki możliwości i testowania">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Współdzielone helpery fetch/transform/store mediów plus buildery payloadów mediów |
    | `plugin-sdk/media-generation-runtime` | Współdzielone helpery failover generowania mediów, wybór kandydatów i komunikaty o brakującym modelu |
    | `plugin-sdk/media-understanding` | Typy dostawców rozumienia mediów plus eksporty helperów obrazów/audio skierowane do dostawców |
    | `plugin-sdk/text-runtime` | Współdzielone helpery tekstu/Markdown/logowania, takie jak usuwanie tekstu widocznego dla asystenta, helpery renderowania/chunkingu/tabel Markdown, helpery redakcji, helpery tagów dyrektyw i narzędzia bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Helper chunkingu tekstu outbound |
    | `plugin-sdk/speech` | Typy dostawców mowy plus helpery dyrektyw, rejestru i walidacji skierowane do dostawców |
    | `plugin-sdk/speech-core` | Współdzielone typy dostawców mowy, rejestr, dyrektywy i helpery normalizacji |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji realtime i helpery rejestru |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu realtime i helpery rejestru |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów |
    | `plugin-sdk/image-generation-core` | Współdzielone typy generowania obrazów, failover, auth i helpery rejestru |
    | `plugin-sdk/music-generation` | Typy dostawców/żądań/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Współdzielone typy generowania muzyki, helpery failover, lookup dostawców i parsowanie model-ref |
    | `plugin-sdk/video-generation` | Typy dostawców/żądań/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo, helpery failover, lookup dostawców i parsowanie model-ref |
    | `plugin-sdk/webhook-targets` | Rejestr celów Webhook i helpery instalacji tras |
    | `plugin-sdk/webhook-path` | Helpery normalizacji ścieżek Webhook |
    | `plugin-sdk/web-media` | Współdzielone helpery ładowania zdalnych/lokalnych mediów |
    | `plugin-sdk/zod` | Reeksportowane `zod` dla użytkowników Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Podścieżki pamięci">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Dołączona powierzchnia helperów memory-core dla helperów manager/config/file/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime indeksu/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika bazowego hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrakty embeddingów hosta pamięci, dostęp do rejestru, lokalny dostawca i generyczne helpery batch/zdalne |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika storage hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodalne helpery hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Helpery dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-core-host-status` | Helpery statusu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpery runtime CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpery core runtime hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny względem dostawcy alias dla helperów core runtime hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny względem dostawcy alias dla helperów dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Neutralny względem dostawcy alias dla helperów plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-markdown` | Współdzielone helpery managed-markdown dla pluginów powiązanych z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada runtime Active Memory dla dostępu do search-manager |
    | `plugin-sdk/memory-host-status` | Neutralny względem dostawcy alias dla helperów statusu hosta pamięci |
    | `plugin-sdk/memory-lancedb` | Dołączona powierzchnia helperów memory-lancedb |
  </Accordion>

  <Accordion title="Zarezerwowane podścieżki dołączonych helperów">
    | Rodzina | Bieżące podścieżki | Zamierzone użycie |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpery wsparcia dołączonego pluginu browser (`browser-support` pozostaje barrelem zgodności) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Powierzchnia helperów/runtime dołączonego Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Powierzchnia helperów/runtime dołączonego LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Powierzchnia helperów dołączonego IRC |
    | Helpery specyficzne dla kanałów | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seamy zgodności/helperów dołączonych kanałów |
    | Helpery specyficzne dla auth/pluginów | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seamy helperów dołączonych funkcji/pluginów; `plugin-sdk/github-copilot-token` obecnie eksportuje `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` i `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API rejestracji

Callback `register(api)` otrzymuje obiekt `OpenClawPluginApi` z tymi
metodami:

### Rejestracja możliwości

| Metoda                                           | Co rejestruje                          |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Inferencję tekstową (LLM)              |
| `api.registerAgentHarness(...)`                  | Eksperymentalny niskopoziomowy executor agenta |
| `api.registerCliBackend(...)`                    | Lokalny backend inferencji CLI         |
| `api.registerChannel(...)`                       | Kanał komunikacyjny                    |
| `api.registerSpeechProvider(...)`                | Syntezę tekst-na-mowę / STT            |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniową transkrypcję realtime     |
| `api.registerRealtimeVoiceProvider(...)`         | Dwukierunkowe sesje głosu realtime     |
| `api.registerMediaUnderstandingProvider(...)`    | Analizę obrazów/audio/wideo            |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów                    |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki                     |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo                      |
| `api.registerWebFetchProvider(...)`              | Dostawcę web fetch / scrapingu         |
| `api.registerWebSearchProvider(...)`             | Wyszukiwanie w sieci                   |

### Narzędzia i polecenia

| Metoda                          | Co rejestruje                                  |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane albo `{ optional: true }`) |
| `api.registerCommand(def)`      | Niestandardowe polecenie (omija LLM)           |

### Infrastruktura

| Metoda                                         | Co rejestruje                         |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook zdarzeń                          |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                 |
| `api.registerGatewayMethod(name, handler)`     | Metodę RPC Gateway                    |
| `api.registerCli(registrar, opts?)`            | Podpolecenie CLI                      |
| `api.registerService(service)`                 | Usługę działającą w tle               |
| `api.registerInteractiveHandler(registration)` | Handler interaktywny                  |
| `api.registerMemoryPromptSupplement(builder)`  | Addytywną sekcję promptu powiązaną z pamięcią |
| `api.registerMemoryCorpusSupplement(adapter)`  | Addytywny korpus wyszukiwania/odczytu pamięci |

Zarezerwowane przestrzenie nazw administracyjnych core (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze pozostają `operator.admin`, nawet jeśli plugin próbuje przypisać
węższy scope metody gateway. Preferuj prefiksy specyficzne dla pluginu dla
metod należących do pluginu.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` akceptuje dwa rodzaje metadanych najwyższego poziomu:

- `commands`: jawne korzenie poleceń należące do registrara
- `descriptors`: deskryptory poleceń na etapie parsowania używane do pomocy głównego CLI,
  routowania i leniwej rejestracji CLI pluginów

Jeśli chcesz, aby polecenie pluginu pozostawało ładowane leniwie w normalnej ścieżce głównego CLI,
podaj `descriptors`, które obejmują każdy korzeń polecenia najwyższego poziomu wystawiany przez tego
registrara.

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

Używaj samego `commands` tylko wtedy, gdy nie potrzebujesz leniwej rejestracji głównego CLI.
Ta eager ścieżka zgodności nadal jest wspierana, ale nie instaluje
placeholderów opartych na descriptorach do leniwego ładowania na etapie parsowania.

### Rejestracja backendu CLI

`api.registerCliBackend(...)` pozwala pluginowi posiadać domyślną konfigurację dla lokalnego
backendu AI CLI, takiego jak `codex-cli`.

- Backend `id` staje się prefiksem dostawcy w model-ref, takich jak `codex-cli/gpt-5`.
- Backend `config` używa tego samego kształtu co `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal wygrywa. OpenClaw scala `agents.defaults.cliBackends.<id>` ponad
  domyślną konfiguracją pluginu przed uruchomieniem CLI.
- Użyj `normalizeConfig`, gdy backend potrzebuje przepisań zgodności po scaleniu
  (na przykład normalizacji starszych kształtów flag).

### Sloty wyłączne

| Metoda                                     | Co rejestruje                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (aktywny może być tylko jeden na raz). Callback `assemble()` otrzymuje `availableTools` i `citationsMode`, aby silnik mógł dostosować dodatki do promptu. |
| `api.registerMemoryCapability(capability)` | Ujednoliconą możliwość pamięci                                                                                                                         |
| `api.registerMemoryPromptSection(builder)` | Builder sekcji promptu pamięci                                                                                                                         |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu flush pamięci                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime pamięci                                                                                                                                |

### Adaptery embeddingów pamięci

| Metoda                                         | Co rejestruje                                 |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embeddingów pamięci dla aktywnego pluginu |

- `registerMemoryCapability` to preferowane wyłączne API pluginów pamięci.
- `registerMemoryCapability` może też udostępniać `publicArtifacts.listArtifacts(...)`,
  aby pluginy towarzyszące mogły korzystać z eksportowanych artefaktów pamięci przez
  `openclaw/plugin-sdk/memory-host-core` zamiast sięgać do prywatnego
  layoutu konkretnego pluginu pamięci.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` i
  `registerMemoryRuntime` to starsze, zgodne wstecz wyłączne API pluginów pamięci.
- `registerMemoryEmbeddingProvider` pozwala aktywnemu pluginowi pamięci zarejestrować jeden
  albo więcej identyfikatorów adapterów embeddingów (na przykład `openai`, `gemini` albo własny identyfikator zdefiniowany przez plugin).
- Konfiguracja użytkownika, taka jak `agents.defaults.memorySearch.provider` i
  `agents.defaults.memorySearch.fallback`, jest rozwiązywana względem tych zarejestrowanych
  identyfikatorów adapterów.

### Zdarzenia i lifecycle

| Metoda                                       | Co robi                      |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Typowany hook lifecycle      |
| `api.onConversationBindingResolved(handler)` | Callback rozwiązania powiązania rozmowy |

### Semantyka decyzji hooków

- `before_tool_call`: zwrócenie `{ block: true }` jest terminalne. Gdy tylko którykolwiek handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest terminalne. Gdy tylko którykolwiek handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest terminalne. Gdy tylko którykolwiek handler przejmie dispatch, handlery o niższym priorytecie i domyślna ścieżka dispatchu modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest terminalne. Gdy tylko którykolwiek handler to ustawi, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.

### Pola obiektu API

| Pole                     | Typ                       | Opis                                                                                       |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Identyfikator pluginu                                                                      |
| `api.name`               | `string`                  | Wyświetlana nazwa                                                                          |
| `api.version`            | `string?`                 | Wersja pluginu (opcjonalnie)                                                               |
| `api.description`        | `string?`                 | Opis pluginu (opcjonalnie)                                                                 |
| `api.source`             | `string`                  | Ścieżka źródłowa pluginu                                                                   |
| `api.rootDir`            | `string?`                 | Katalog główny pluginu (opcjonalnie)                                                       |
| `api.config`             | `OpenClawConfig`          | Bieżąca migawka konfiguracji (aktywna migawka runtime w pamięci, gdy jest dostępna)       |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfiguracja specyficzna dla pluginu z `plugins.entries.<id>.config`                       |
| `api.runtime`            | `PluginRuntime`           | [Helpery runtime](/pl/plugins/sdk-runtime)                                                    |
| `api.logger`             | `PluginLogger`            | Logger z zakresem (`debug`, `info`, `warn`, `error`)                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno uruchamiania/konfiguracji przed pełnym entry |
| `api.resolvePath(input)` | `(string) => string`      | Rozwiąż ścieżkę względem katalogu głównego pluginu                                         |

## Konwencja modułów wewnętrznych

Wewnątrz swojego pluginu używaj lokalnych plików barrel do importów wewnętrznych:

```
my-plugin/
  api.ts            # Publiczne eksporty dla zewnętrznych odbiorców
  runtime-api.ts    # Eksporty runtime tylko do użytku wewnętrznego
  index.ts          # Entry point pluginu
  setup-entry.ts    # Lekkie entry tylko do konfiguracji (opcjonalne)
```

<Warning>
  Nigdy nie importuj własnego pluginu przez `openclaw/plugin-sdk/<your-plugin>`
  z kodu produkcyjnego. Kieruj importy wewnętrzne przez `./api.ts` albo
  `./runtime-api.ts`. Ścieżka SDK jest wyłącznie kontraktem zewnętrznym.
</Warning>

Publiczne powierzchnie dołączonych pluginów ładowane przez fasadę (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` i podobne publiczne pliki entry) teraz preferują
aktywną migawkę konfiguracji runtime, gdy OpenClaw już działa. Jeśli migawka runtime
jeszcze nie istnieje, zapasowo używają rozwiązanej konfiguracji z pliku na dysku.

Pluginy dostawców mogą także wystawiać wąski lokalny barrel kontraktu pluginu, gdy
helper jest celowo specyficzny dla dostawcy i jeszcze nie należy do generycznej podścieżki SDK.
Bieżący dołączony przykład: dostawca Anthropic trzyma swoje helpery strumieni Claude
we własnym publicznym seam `api.ts` / `contract-api.ts`, zamiast
promować logikę nagłówka beta Anthropic i `service_tier` do generycznego
kontraktu `plugin-sdk/*`.

Inne bieżące dołączone przykłady:

- `@openclaw/openai-provider`: `api.ts` eksportuje buildery dostawców,
  helpery domyślnych modeli i buildery dostawców realtime
- `@openclaw/openrouter-provider`: `api.ts` eksportuje builder dostawcy oraz
  helpery onboardingu/konfiguracji

<Warning>
  Kod produkcyjny rozszerzeń powinien także unikać importów `openclaw/plugin-sdk/<other-plugin>`.
  Jeśli helper jest rzeczywiście współdzielony, przenieś go do neutralnej podścieżki SDK,
  takiej jak `openclaw/plugin-sdk/speech`, `.../provider-model-shared` albo innej
  powierzchni zorientowanej na możliwości, zamiast łączyć ze sobą dwa pluginy.
</Warning>

## Powiązane

- [Entry Points](/pl/plugins/sdk-entrypoints) — opcje `definePluginEntry` i `defineChannelPluginEntry`
- [Helpery runtime](/pl/plugins/sdk-runtime) — pełna referencja przestrzeni nazw `api.runtime`
- [Konfiguracja i config](/pl/plugins/sdk-setup) — pakowanie, manifesty, schematy konfiguracji
- [Testowanie](/pl/plugins/sdk-testing) — narzędzia testowe i reguły lint
- [Migracja SDK](/pl/plugins/sdk-migration) — migracja z przestarzałych powierzchni
- [Wnętrze pluginów](/pl/plugins/architecture) — szczegółowa architektura i model możliwości
