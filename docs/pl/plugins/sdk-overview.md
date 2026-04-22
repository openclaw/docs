---
read_when:
    - Musisz wiedzieć, z którego subpath SDK importować
    - Chcesz dokumentację wszystkich metod rejestracji w `OpenClawPluginApi`
    - Szukasz konkretnego eksportu SDK
sidebarTitle: SDK Overview
summary: Mapa importów, dokumentacja API rejestracji i architektura SDK
title: Przegląd Plugin SDK
x-i18n:
    generated_at: "2026-04-22T04:26:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8045c11976bbda6afe3303a0aab08caf0d0a86ebcf1aaaf927943b90cc517673
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Przegląd Plugin SDK

Plugin SDK to typowany kontrakt między pluginami a rdzeniem. Ta strona jest
dokumentacją tego, **co importować** i **co można rejestrować**.

<Tip>
  **Szukasz przewodnika krok po kroku?**
  - Pierwszy plugin? Zacznij od [Getting Started](/pl/plugins/building-plugins)
  - Plugin kanału? Zobacz [Channel Plugins](/pl/plugins/sdk-channel-plugins)
  - Plugin providera? Zobacz [Provider Plugins](/pl/plugins/sdk-provider-plugins)
</Tip>

## Konwencja importu

Zawsze importuj z konkretnego subpath:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każdy subpath to mały, samodzielny moduł. Dzięki temu uruchamianie jest szybkie i
zapobiega to problemom z zależnościami cyklicznymi. Dla helperów wejścia/budowania specyficznych dla kanału
preferuj `openclaw/plugin-sdk/channel-core`; zachowaj `openclaw/plugin-sdk/core` dla
szerszej powierzchni parasolowej i współdzielonych helperów, takich jak
`buildChannelConfigSchema`.

Nie dodawaj ani nie polegaj na wygodnych seamach nazwanych od providerów, takich jak
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` lub
brandowanych seamach helperów kanałów. Dołączone pluginy powinny składać generyczne
subpathy SDK we własnych barrelach `api.ts` lub `runtime-api.ts`, a rdzeń
powinien albo używać tych lokalnych barri pluginu, albo dodać wąski generyczny kontrakt SDK,
gdy potrzeba jest rzeczywiście międzykanałowa.

Wygenerowana mapa eksportów nadal zawiera mały zestaw seamów helperów dołączonych pluginów,
takich jak `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` i `plugin-sdk/matrix*`. Te
subpathy istnieją wyłącznie dla utrzymania i zgodności dołączonych pluginów; są
celowo pominięte w typowej tabeli poniżej i nie są zalecaną ścieżką importu
dla nowych pluginów zewnętrznych.

## Dokumentacja subpath

Najczęściej używane subpathy, pogrupowane według przeznaczenia. Wygenerowana pełna lista
ponad 200 subpath znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`.

Zarezerwowane subpathy helperów dołączonych pluginów nadal pojawiają się na tej wygenerowanej liście.
Traktuj je jako powierzchnie szczegółów implementacyjnych/zgodności, chyba że strona dokumentacji
jawnie promuje któryś z nich jako publiczny.

### Punkt wejścia pluginu

| Subpath                     | Kluczowe eksporty                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                   |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                      |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

<AccordionGroup>
  <Accordion title="Subpathy kanałów">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone helpery kreatora konfiguracji, prompty list dozwolonych, konstruktory statusu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpery konfiguracji/Action Gate dla wielu kont, helpery fallbacku konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpery normalizacji identyfikatorów kont |
    | `plugin-sdk/account-resolution` | Wyszukiwanie kont + helpery fallbacku domyślnego |
    | `plugin-sdk/account-helpers` | Wąskie helpery list akcji kont/list kont |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typy schematu konfiguracji kanału |
    | `plugin-sdk/telegram-command-config` | Helpery normalizacji/walidacji niestandardowych poleceń Telegram z fallbackiem kontraktu dołączonego |
    | `plugin-sdk/command-gating` | Wąskie helpery gate autoryzacji poleceń |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helpery cyklu życia/finalizacji strumienia szkicu |
    | `plugin-sdk/inbound-envelope` | Współdzielone helpery budowania tras przychodzących i obwiedni |
    | `plugin-sdk/inbound-reply-dispatch` | Współdzielone helpery zapisu i dispatchu odpowiedzi przychodzących |
    | `plugin-sdk/messaging-targets` | Helpery parsowania/dopasowania celów |
    | `plugin-sdk/outbound-media` | Współdzielone helpery ładowania mediów wychodzących |
    | `plugin-sdk/outbound-runtime` | Helpery tożsamości wychodzącej, delegata wysyłki i planowania payloadów |
    | `plugin-sdk/poll-runtime` | Wąskie helpery normalizacji ankiet |
    | `plugin-sdk/thread-bindings-runtime` | Helpery adapterów i cyklu życia powiązań wątków |
    | `plugin-sdk/agent-media-payload` | Starszy konstruktor payloadu mediów agenta |
    | `plugin-sdk/conversation-runtime` | Helpery powiązań konwersacji/wątków, parowania i skonfigurowanych powiązań |
    | `plugin-sdk/runtime-config-snapshot` | Helper migawki konfiguracji runtime |
    | `plugin-sdk/runtime-group-policy` | Helpery rozwiązywania polityk grup runtime |
    | `plugin-sdk/channel-status` | Współdzielone helpery migawek/podsumowań statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Helpery autoryzacji zapisów konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty prelude pluginów kanałów |
    | `plugin-sdk/allowlist-config-edit` | Helpery odczytu/edycji konfiguracji list dozwolonych |
    | `plugin-sdk/group-access` | Współdzielone helpery decyzji dostępu grupowego |
    | `plugin-sdk/direct-dm` | Współdzielone helpery auth/guard bezpośrednich wiadomości prywatnych |
    | `plugin-sdk/interactive-runtime` | Prezentacja semantyczna wiadomości, dostarczanie i starsze helpery odpowiedzi interaktywnych. Zobacz [Message Presentation](/pl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel zgodności dla debounce przychodzących, dopasowania wzmianek, helperów polityki wzmianek i helperów obwiedni |
    | `plugin-sdk/channel-mention-gating` | Wąskie helpery polityki wzmianek bez szerszej powierzchni inbound runtime |
    | `plugin-sdk/channel-location` | Helpery kontekstu lokalizacji kanału i formatowania |
    | `plugin-sdk/channel-logging` | Helpery logowania kanału dla odrzuceń przychodzących i awarii typing/ack |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | Helpery akcji wiadomości kanału oraz przestarzałe helpery natywnych schematów zachowane dla zgodności pluginów |
    | `plugin-sdk/channel-targets` | Helpery parsowania/dopasowania celów |
    | `plugin-sdk/channel-contract` | Typy kontraktów kanału |
    | `plugin-sdk/channel-feedback` | Połączenia feedbacku/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery kontraktów sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` i typy celów sekretów |
  </Accordion>

  <Accordion title="Subpathy providerów">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratorowane helpery konfiguracji lokalnych/samodzielnie hostowanych providerów |
    | `plugin-sdk/self-hosted-provider-setup` | Skoncentrowane helpery konfiguracji samodzielnie hostowanych providerów zgodnych z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI + stałe watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpery rozwiązywania kluczy API runtime dla pluginów providerów |
    | `plugin-sdk/provider-auth-api-key` | Helpery onboardingu/zapisu profili kluczy API, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy konstruktor wyników uwierzytelniania OAuth |
    | `plugin-sdk/provider-auth-login` | Współdzielone interaktywne helpery logowania dla pluginów providerów |
    | `plugin-sdk/provider-env-vars` | Helpery wyszukiwania zmiennych środowiskowych auth providerów |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory polityki replay, helpery endpointów providerów i helpery normalizacji identyfikatorów modeli, takie jak `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generyczne helpery HTTP/zdolności endpointów providerów |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie helpery kontraktów konfiguracji/wyboru web-fetch, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpery rejestracji/cache providerów web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Wąskie helpery konfiguracji/poświadczeń web-search dla providerów, które nie potrzebują połączeń enable-plugin |
    | `plugin-sdk/provider-web-search-contract` | Wąskie helpery kontraktów konfiguracji/poświadczeń web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` i ustawiające/pobierające scoped credentials |
    | `plugin-sdk/provider-web-search` | Helpery rejestracji/cache/runtime providerów web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematów Gemini + diagnostyka oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` i podobne |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni i współdzielone helpery wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Natywne helpery transportu providerów, takie jak guarded fetch, transformacje wiadomości transportowych i zapisywalne strumienie zdarzeń transportowych |
    | `plugin-sdk/provider-onboard` | Helpery patchowania konfiguracji onboardingu |
    | `plugin-sdk/global-singleton` | Helpery singletonów/map/cache lokalnych dla procesu |
  </Accordion>

  <Accordion title="Subpathy auth i bezpieczeństwa">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpery rejestru poleceń, helpery autoryzacji nadawcy |
    | `plugin-sdk/command-status` | Konstruktory wiadomości poleceń/pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Rozwiązywanie zatwierdzających i helpery action-auth w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Natywne helpery profili/filtrów zatwierdzeń exec |
    | `plugin-sdk/approval-delivery-runtime` | Natywne adaptery capability/dostarczania zatwierdzeń |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony helper rozwiązywania Gateway zatwierdzeń |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie helpery ładowania natywnych adapterów zatwierdzeń dla gorących punktów wejścia kanałów |
    | `plugin-sdk/approval-handler-runtime` | Szersze helpery runtime handlerów zatwierdzeń; preferuj węższe seamy adapter/gateway, gdy są wystarczające |
    | `plugin-sdk/approval-native-runtime` | Natywne helpery celów zatwierdzeń + powiązań kont |
    | `plugin-sdk/approval-reply-runtime` | Helpery payloadów odpowiedzi dla zatwierdzeń exec/pluginów |
    | `plugin-sdk/command-auth-native` | Natywne helpery auth poleceń + helpery natywnych celów sesji |
    | `plugin-sdk/command-detection` | Współdzielone helpery wykrywania poleceń |
    | `plugin-sdk/command-surface` | Normalizacja treści poleceń i helpery powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery zbierania kontraktów sekretów dla powierzchni sekretów kanałów/pluginów |
    | `plugin-sdk/secret-ref-runtime` | Wąskie helpery `coerceSecretRef` i typowania SecretRef do parsowania kontraktów sekretów/konfiguracji |
    | `plugin-sdk/security-runtime` | Współdzielone helpery zaufania, bramkowania wiadomości prywatnych, treści zewnętrznych i zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Helpery list dozwolonych hostów i polityki SSRF dla sieci prywatnych |
    | `plugin-sdk/ssrf-dispatcher` | Wąskie helpery pinned-dispatcher bez szerokiej powierzchni infra runtime |
    | `plugin-sdk/ssrf-runtime` | Helpery pinned-dispatcher, fetch chronionego przez SSRF i polityki SSRF |
    | `plugin-sdk/secret-input` | Helpery parsowania secret input |
    | `plugin-sdk/webhook-ingress` | Helpery żądań/celów Webhook |
    | `plugin-sdk/webhook-request-guards` | Helpery rozmiaru body żądań/limitu czasu |
  </Accordion>

  <Accordion title="Subpathy runtime i storage">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie helpery runtime/logowania/backupów/instalacji pluginów |
    | `plugin-sdk/runtime-env` | Wąskie helpery env runtime, loggera, limitu czasu, retry i backoff |
    | `plugin-sdk/channel-runtime-context` | Generyczne helpery rejestracji i wyszukiwania kontekstu runtime kanału |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone helpery poleceń/hooków/http/interakcji pluginów |
    | `plugin-sdk/hook-runtime` | Współdzielone helpery pipeline Webhooków/wewnętrznych hooków |
    | `plugin-sdk/lazy-runtime` | Helpery leniwego importu/powiązań runtime, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpery exec procesów |
    | `plugin-sdk/cli-runtime` | Helpery formatowania CLI, oczekiwania i wersji |
    | `plugin-sdk/gateway-runtime` | Helpery klienta Gateway i patchowania statusu kanału |
    | `plugin-sdk/config-runtime` | Helpery ładowania/zapisu konfiguracji |
    | `plugin-sdk/telegram-command-config` | Normalizacja nazw/opisów poleceń Telegram oraz sprawdzanie duplikatów/konfliktów, nawet gdy powierzchnia kontraktu dołączonego Telegram jest niedostępna |
    | `plugin-sdk/text-autolink-runtime` | Wykrywanie autolinków odwołań do plików bez szerokiego barra text-runtime |
    | `plugin-sdk/approval-runtime` | Helpery zatwierdzeń exec/pluginów, konstruktory capability zatwierdzeń, helpery auth/profili, natywne helpery trasowania/runtime |
    | `plugin-sdk/reply-runtime` | Współdzielone helpery inbound/reply runtime, dzielenie na części, dispatch, Heartbeat, planowanie odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery dispatchu/finalizacji odpowiedzi |
    | `plugin-sdk/reply-history` | Współdzielone helpery historii odpowiedzi dla krótkiego okna, takie jak `buildHistoryContext`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie helpery dzielenia tekstu/Markdown na części |
    | `plugin-sdk/session-store-runtime` | Helpery ścieżek magazynu sesji + `updated-at` |
    | `plugin-sdk/state-paths` | Helpery ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/routing` | Helpery tras/powiązań kluczy sesji/kont, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone helpery podsumowań statusu kanałów/kont, domyślne ustawienia stanu runtime i helpery metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone helpery resolwera celów |
    | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji slugów/ciągów znaków |
    | `plugin-sdk/request-url` | Wyodrębnianie URL-i jako ciągów znaków z wejść typu fetch/request |
    | `plugin-sdk/run-command` | Runner poleceń z limitem czasu i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Wspólne czytniki parametrów narzędzi/CLI |
    | `plugin-sdk/tool-payload` | Wyodrębnianie znormalizowanych payloadów z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzi |
    | `plugin-sdk/temp-path` | Współdzielone helpery ścieżek tymczasowego pobierania |
    | `plugin-sdk/logging-core` | Helpery loggera podsystemu i redakcji |
    | `plugin-sdk/markdown-table-runtime` | Helpery trybu tabel Markdown |
    | `plugin-sdk/json-store` | Małe helpery odczytu/zapisu stanu JSON |
    | `plugin-sdk/file-lock` | Helpery re-entrant file-lock |
    | `plugin-sdk/persistent-dedupe` | Helpery cache deduplikacji opartej na dysku |
    | `plugin-sdk/acp-runtime` | Helpery runtime/sesji ACP i reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Rozwiązywanie powiązań ACP tylko do odczytu bez importów uruchamiania cyklu życia |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji runtime agenta |
    | `plugin-sdk/boolean-param` | Luźny czytnik parametrów boolean |
    | `plugin-sdk/dangerous-name-runtime` | Helpery rozwiązywania dopasowań niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Helpery bootstrapu urządzeń i tokenów parowania |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy helperów kanałów pasywnych, statusu i ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Helpery odpowiedzi polecenia `/models` i providerów |
    | `plugin-sdk/skill-commands-runtime` | Helpery listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Helpery rejestru/budowania/serializacji natywnych poleceń |
    | `plugin-sdk/agent-harness` | Eksperymentalna powierzchnia zaufanych pluginów dla niskopoziomowych harnessów agentów: typy harnessów, helpery steer/abort aktywnych uruchomień, helpery mostka narzędzi OpenClaw i narzędzia wyników prób |
    | `plugin-sdk/provider-zai-endpoint` | Helpery wykrywania endpointów Z.AI |
    | `plugin-sdk/infra-runtime` | Helpery zdarzeń systemowych/Heartbeat |
    | `plugin-sdk/collection-runtime` | Małe helpery ograniczonego cache |
    | `plugin-sdk/diagnostic-runtime` | Helpery flag i zdarzeń diagnostycznych |
    | `plugin-sdk/error-runtime` | Graf błędów, formatowanie, współdzielone helpery klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Opakowany fetch, proxy i helpery pinned lookup |
    | `plugin-sdk/runtime-fetch` | Świadomy dispatchera fetch runtime bez importów proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Ograniczony czytnik body odpowiedzi bez szerokiej powierzchni media runtime |
    | `plugin-sdk/session-binding-runtime` | Bieżący stan powiązań konwersacji bez trasowania skonfigurowanych powiązań lub magazynów parowania |
    | `plugin-sdk/session-store-runtime` | Helpery odczytu magazynu sesji bez szerokich importów zapisów/utrzymania konfiguracji |
    | `plugin-sdk/context-visibility-runtime` | Rozwiązywanie widoczności kontekstu i filtrowanie uzupełniającego kontekstu bez szerokich importów konfiguracji/bezpieczeństwa |
    | `plugin-sdk/string-coerce-runtime` | Wąskie helpery wymuszania i normalizacji rekordów/prymitywów/ciągów znaków bez importów markdown/logowania |
    | `plugin-sdk/host-runtime` | Helpery normalizacji nazw hostów i hostów SCP |
    | `plugin-sdk/retry-runtime` | Helpery konfiguracji retry i runnera retry |
    | `plugin-sdk/agent-runtime` | Helpery katalogu/tożsamości/workspace agenta |
    | `plugin-sdk/directory-runtime` | Zapytania/deduplikacja katalogów oparte na konfiguracji |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpathy capability i testów">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Współdzielone helpery fetch/transform/store mediów oraz konstruktory payloadów mediów |
    | `plugin-sdk/media-generation-runtime` | Współdzielone helpery failover generowania mediów, wybór kandydatów i komunikaty o brakującym modelu |
    | `plugin-sdk/media-understanding` | Typy providerów rozumienia mediów oraz eksporty helperów obrazów/audio skierowane do providerów |
    | `plugin-sdk/text-runtime` | Współdzielone helpery tekstu/Markdown/logowania, takie jak usuwanie tekstu widocznego dla asystenta, helpery renderowania/dzielenia/tabel Markdown, helpery redakcji, helpery tagów dyrektyw i bezpieczne narzędzia tekstowe |
    | `plugin-sdk/text-chunking` | Helper dzielenia tekstu wychodzącego na części |
    | `plugin-sdk/speech` | Typy providerów mowy oraz helpery dyrektyw, rejestru i walidacji skierowane do providerów |
    | `plugin-sdk/speech-core` | Współdzielone typy providerów mowy, rejestr, dyrektywy i helpery normalizacji |
    | `plugin-sdk/realtime-transcription` | Typy providerów transkrypcji realtime i helpery rejestru |
    | `plugin-sdk/realtime-voice` | Typy providerów głosu realtime i helpery rejestru |
    | `plugin-sdk/image-generation` | Typy providerów generowania obrazów |
    | `plugin-sdk/image-generation-core` | Współdzielone typy generowania obrazów, helpery failover, auth i rejestru |
    | `plugin-sdk/music-generation` | Typy providerów/żądań/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Współdzielone typy generowania muzyki, helpery failover, wyszukiwanie providerów i parsowanie model-ref |
    | `plugin-sdk/video-generation` | Typy providerów/żądań/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo, helpery failover, wyszukiwanie providerów i parsowanie model-ref |
    | `plugin-sdk/webhook-targets` | Rejestr celów Webhook i helpery instalacji tras |
    | `plugin-sdk/webhook-path` | Helpery normalizacji ścieżek Webhook |
    | `plugin-sdk/web-media` | Współdzielone helpery ładowania mediów zdalnych/lokalnych |
    | `plugin-sdk/zod` | Reeksportowane `zod` dla konsumentów Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subpathy Memory">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Powierzchnia helperów dołączonego memory-core dla helperów managera/konfiguracji/plików/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime indeksu/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika foundation hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrakty embeddingów hosta pamięci, dostęp do rejestru, lokalny provider oraz generyczne helpery batch/zdalne |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika storage hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodalne helpery hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Helpery dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-core-host-status` | Helpery statusu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpery runtime CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Główne helpery runtime hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny względem dostawcy alias głównych helperów runtime hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny względem dostawcy alias helperów dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Neutralny względem dostawcy alias helperów plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-markdown` | Współdzielone helpery zarządzanego Markdown dla pluginów powiązanych z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada runtime Active Memory dla dostępu do managera wyszukiwania |
    | `plugin-sdk/memory-host-status` | Neutralny względem dostawcy alias helperów statusu hosta pamięci |
    | `plugin-sdk/memory-lancedb` | Powierzchnia helperów dołączonego memory-lancedb |
  </Accordion>

  <Accordion title="Zarezerwowane subpathy helperów dołączonych">
    | Rodzina | Bieżące subpathy | Zamierzone użycie |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpery wsparcia dołączonego pluginu browser (`browser-support` pozostaje barrelem zgodności) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Powierzchnia helperów/runtime dołączonego Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Powierzchnia helperów/runtime dołączonego LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Powierzchnia helperów dołączonego IRC |
    | Helpery specyficzne dla kanału | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Seamy zgodności/helperów dołączonych kanałów |
    | Helpery specyficzne dla auth/pluginu | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Seamy helperów dołączonych funkcji/pluginów; `plugin-sdk/github-copilot-token` obecnie eksportuje `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` i `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API rejestracji

Callback `register(api)` otrzymuje obiekt `OpenClawPluginApi` z poniższymi
metodami:

### Rejestracja capability

| Metoda                                           | Co rejestruje                          |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Wnioskowanie tekstowe (LLM)            |
| `api.registerAgentHarness(...)`                  | Eksperymentalny niskopoziomowy executor agenta |
| `api.registerCliBackend(...)`                    | Lokalny backend wnioskowania CLI       |
| `api.registerChannel(...)`                       | Kanał wiadomości                       |
| `api.registerSpeechProvider(...)`                | Synteza text-to-speech / STT           |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniową transkrypcję realtime     |
| `api.registerRealtimeVoiceProvider(...)`         | Dupleksowe sesje głosowe realtime      |
| `api.registerMediaUnderstandingProvider(...)`    | Analizę obrazów/audio/wideo            |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów                    |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki                     |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo                      |
| `api.registerWebFetchProvider(...)`              | Provider Web fetch / scrapowania       |
| `api.registerWebSearchProvider(...)`             | Web search                             |

### Narzędzia i polecenia

| Metoda                          | Co rejestruje                                 |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane lub `{ optional: true }`) |
| `api.registerCommand(def)`      | Niestandardowe polecenie (omija LLM)          |

### Infrastruktura

| Metoda                                         | Co rejestruje                          |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook zdarzeń                           |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                  |
| `api.registerGatewayMethod(name, handler)`     | Metodę RPC Gateway                     |
| `api.registerCli(registrar, opts?)`            | Podpolecenie CLI                       |
| `api.registerService(service)`                 | Usługę w tle                           |
| `api.registerInteractiveHandler(registration)` | Handler interaktywny                   |
| `api.registerMemoryPromptSupplement(builder)`  | Addytywną sekcję promptu powiązaną z pamięcią |
| `api.registerMemoryCorpusSupplement(adapter)`  | Addytywny korpus wyszukiwania/odczytu pamięci |

Zarezerwowane przestrzenie nazw administracyjnych rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze pozostają `operator.admin`, nawet jeśli plugin spróbuje przypisać
węższy zakres metody Gateway. Dla metod należących do pluginu preferuj prefiksy
specyficzne dla pluginu.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` akceptuje dwa rodzaje metadanych najwyższego poziomu:

- `commands`: jawne główne korzenie poleceń należące do rejestratora
- `descriptors`: deskryptory poleceń używane w czasie parsowania dla root help CLI,
  trasowania i leniwej rejestracji CLI pluginów

Jeśli chcesz, aby polecenie pluginu pozostało leniwie ładowane w zwykłej ścieżce głównego CLI,
podaj `descriptors`, które obejmują każdy główny korzeń poleceń udostępniany przez
ten rejestrator.

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
Ta ścieżka zgodności eager nadal jest obsługiwana, ale nie instaluje
placeholderów opartych na deskryptorach do leniwego ładowania w czasie parsowania.

### Rejestracja backendu CLI

`api.registerCliBackend(...)` pozwala pluginowi być właścicielem domyślnej konfiguracji
lokalnego backendu CLI AI, takiego jak `codex-cli`.

- `id` backendu staje się prefiksem providera w referencjach modeli, takich jak `codex-cli/gpt-5`.
- `config` backendu używa tego samego kształtu co `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal ma pierwszeństwo. OpenClaw scala `agents.defaults.cliBackends.<id>` z wartością nad
  domyślną pluginu przed uruchomieniem CLI.
- Użyj `normalizeConfig`, gdy backend potrzebuje przepisań zgodności po scaleniu
  (na przykład normalizacji starszych kształtów flag).

### Sloty wyłączne

| Metoda                                     | Co rejestruje                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Context engine (aktywny może być tylko jeden). Callback `assemble()` otrzymuje `availableTools` i `citationsMode`, aby silnik mógł dostosować dodatki do promptu. |
| `api.registerMemoryCapability(capability)` | Ujednolicony capability pamięci                                                                                                                        |
| `api.registerMemoryPromptSection(builder)` | Konstruktor sekcji promptu pamięci                                                                                                                     |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu flush pamięci                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime pamięci                                                                                                                                |

### Adaptery embeddingów pamięci

| Metoda                                         | Co rejestruje                                  |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embeddingów pamięci dla aktywnego pluginu |

- `registerMemoryCapability` jest preferowanym API wyłącznego pluginu pamięci.
- `registerMemoryCapability` może także udostępniać `publicArtifacts.listArtifacts(...)`,
  aby pluginy towarzyszące mogły konsumować eksportowane artefakty pamięci przez
  `openclaw/plugin-sdk/memory-host-core` zamiast sięgać do prywatnego
  układu konkretnego pluginu pamięci.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` i
  `registerMemoryRuntime` to zachowane dla zgodności starsze wyłączne API pluginów pamięci.
- `registerMemoryEmbeddingProvider` pozwala aktywnemu pluginowi pamięci zarejestrować jeden
  lub więcej identyfikatorów adapterów embeddingów (na przykład `openai`, `gemini` albo niestandardowy identyfikator zdefiniowany przez plugin).
- Konfiguracja użytkownika, taka jak `agents.defaults.memorySearch.provider` i
  `agents.defaults.memorySearch.fallback`, jest rozwiązywana względem tych zarejestrowanych
  identyfikatorów adapterów.

### Zdarzenia i cykl życia

| Metoda                                       | Co robi                      |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Typowany hook cyklu życia    |
| `api.onConversationBindingResolved(handler)` | Callback rozwiązania powiązania konwersacji |

### Semantyka decyzji hooków

- `before_tool_call`: zwrócenie `{ block: true }` jest terminalne. Gdy którykolwiek handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest terminalne. Gdy którykolwiek handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest terminalne. Gdy którykolwiek handler przejmie dispatch, handlery o niższym priorytecie i domyślna ścieżka dispatchu modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest terminalne. Gdy którykolwiek handler to ustawi, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.

### Pola obiektu API

| Pole                     | Typ                       | Opis                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identyfikator pluginu                                                                       |
| `api.name`               | `string`                  | Nazwa wyświetlana                                                                           |
| `api.version`            | `string?`                 | Wersja pluginu (opcjonalna)                                                                 |
| `api.description`        | `string?`                 | Opis pluginu (opcjonalny)                                                                   |
| `api.source`             | `string`                  | Ścieżka źródłowa pluginu                                                                    |
| `api.rootDir`            | `string?`                 | Katalog główny pluginu (opcjonalny)                                                        |
| `api.config`             | `OpenClawConfig`          | Bieżąca migawka konfiguracji (aktywna migawka runtime w pamięci, gdy jest dostępna)        |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfiguracja specyficzna dla pluginu z `plugins.entries.<id>.config`                        |
| `api.runtime`            | `PluginRuntime`           | [Runtime Helpers](/pl/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Logger z zakresem (`debug`, `info`, `warn`, `error`)                                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno startu/konfiguracji przed pełnym punktem wejścia |
| `api.resolvePath(input)` | `(string) => string`      | Rozwiązuje ścieżkę względem katalogu głównego pluginu                                       |

## Wewnętrzna konwencja modułów

Wewnątrz swojego pluginu używaj lokalnych plików barrel do importów wewnętrznych:

```
my-plugin/
  api.ts            # Publiczne eksporty dla zewnętrznych konsumentów
  runtime-api.ts    # Eksporty runtime tylko do użytku wewnętrznego
  index.ts          # Punkt wejścia pluginu
  setup-entry.ts    # Lekki punkt wejścia tylko do konfiguracji (opcjonalny)
```

<Warning>
  Nigdy nie importuj własnego pluginu przez `openclaw/plugin-sdk/<your-plugin>`
  z kodu produkcyjnego. Kieruj importy wewnętrzne przez `./api.ts` lub
  `./runtime-api.ts`. Ścieżka SDK jest wyłącznie kontraktem zewnętrznym.
</Warning>

Ładowane przez fasadę publiczne powierzchnie dołączonych pluginów (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` i podobne publiczne pliki wejściowe) teraz preferują
aktywną migawkę konfiguracji runtime, jeśli OpenClaw już działa. Jeśli migawka runtime
jeszcze nie istnieje, wracają do rozwiązanej konfiguracji z pliku na dysku.

Pluginy providerów mogą również udostępniać wąski lokalny barrel kontraktu pluginu, gdy helper jest
celowo specyficzny dla providera i jeszcze nie należy do generycznego
subpath SDK. Bieżący dołączony przykład: provider Anthropic trzyma swoje helpery
strumienia Claude we własnym publicznym seamie `api.ts` / `contract-api.ts` zamiast
promować logikę nagłówków beta Anthropic i `service_tier` do generycznego
kontraktu `plugin-sdk/*`.

Inne bieżące dołączone przykłady:

- `@openclaw/openai-provider`: `api.ts` eksportuje konstruktory providerów,
  helpery modeli domyślnych i konstruktory providerów realtime
- `@openclaw/openrouter-provider`: `api.ts` eksportuje konstruktor providera oraz
  helpery onboardingu/konfiguracji

<Warning>
  Kod produkcyjny rozszerzeń powinien także unikać importów `openclaw/plugin-sdk/<other-plugin>`.
  Jeśli helper jest rzeczywiście współdzielony, przenieś go do neutralnego subpath SDK,
  takiego jak `openclaw/plugin-sdk/speech`, `.../provider-model-shared` lub innej
  powierzchni zorientowanej na capability, zamiast sprzęgać ze sobą dwa pluginy.
</Warning>

## Powiązane

- [Entry Points](/pl/plugins/sdk-entrypoints) — opcje `definePluginEntry` i `defineChannelPluginEntry`
- [Runtime Helpers](/pl/plugins/sdk-runtime) — pełna dokumentacja przestrzeni nazw `api.runtime`
- [Setup and Config](/pl/plugins/sdk-setup) — pakowanie, manifesty, schematy konfiguracji
- [Testing](/pl/plugins/sdk-testing) — narzędzia testowe i reguły lint
- [SDK Migration](/pl/plugins/sdk-migration) — migracja z przestarzałych powierzchni
- [Plugin Internals](/pl/plugins/architecture) — szczegółowa architektura i model capability
