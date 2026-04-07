---
read_when:
    - Musisz wiedzieć, z którego subpath SDK importować
    - Chcesz mieć referencję wszystkich metod rejestracji w OpenClawPluginApi
    - Szukasz konkretnego eksportu SDK
sidebarTitle: SDK Overview
summary: Mapa importów, referencja API rejestracji i architektura SDK
title: Przegląd Plugin SDK
x-i18n:
    generated_at: "2026-04-07T09:49:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ba11d1708a117f3872a09fd0bebb0481d36b89b473aec861192e8c2745ef727
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Przegląd Plugin SDK

Plugin SDK to typowany kontrakt między pluginami a core. Ta strona jest
referencją dla **tego, co importować** i **co można rejestrować**.

<Tip>
  **Szukasz przewodnika krok po kroku?**
  - Pierwszy plugin? Zacznij od [Getting Started](/pl/plugins/building-plugins)
  - Plugin kanału? Zobacz [Channel Plugins](/pl/plugins/sdk-channel-plugins)
  - Plugin dostawcy? Zobacz [Provider Plugins](/pl/plugins/sdk-provider-plugins)
</Tip>

## Konwencja importu

Zawsze importuj z konkretnego subpath:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każdy subpath to mały, samodzielny moduł. Dzięki temu uruchamianie jest szybkie i
zapobiega to problemom z zależnościami cyklicznymi. Dla helperów wejścia/buildu specyficznych dla kanałów
preferuj `openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` zachowaj dla
szerszej powierzchni parasolowej i współdzielonych helperów, takich jak
`buildChannelConfigSchema`.

Nie dodawaj ani nie opieraj się na pomocniczych interfejsach nazwanych od dostawców, takich jak
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` ani
helperowych interfejsach oznaczonych marką kanału. Dołączone pluginy powinny składać ogólne
subpathy SDK we własnych barrelach `api.ts` lub `runtime-api.ts`, a core
powinno albo używać tych lokalnych barreli pluginu, albo dodać wąski ogólny kontrakt SDK,
gdy potrzeba jest rzeczywiście międzykanałowa.

Wygenerowana mapa eksportów nadal zawiera mały zestaw helperowych
interfejsów dołączonych pluginów, takich jak `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` oraz `plugin-sdk/matrix*`. Te
subpathy istnieją wyłącznie dla utrzymania zgodności i obsługi dołączonych pluginów; są
celowo pominięte w poniższej wspólnej tabeli i nie są zalecaną
ścieżką importu dla nowych pluginów zewnętrznych.

## Referencja subpath

Najczęściej używane subpathy, pogrupowane według przeznaczenia. Wygenerowana pełna lista
ponad 200 subpath znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`.

Zarezerwowane helperowe subpathy dołączonych pluginów nadal pojawiają się w tej wygenerowanej liście.
Traktuj je jako szczegół implementacyjny/powierzchnie zgodności, chyba że strona dokumentacji
jawnie promuje któryś z nich jako publiczny.

### Punkt wejścia pluginu

| Subpath                     | Kluczowe eksporty                                                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

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
    | `plugin-sdk/account-core` | Helpery konfiguracji/akcyjnych bramek dla wielu kont, helpery fallbacku konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpery normalizacji identyfikatorów kont |
    | `plugin-sdk/account-resolution` | Helpery wyszukiwania kont + fallbacku domyślnego |
    | `plugin-sdk/account-helpers` | Wąskie helpery list kont/akcji na kontach |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typy schematu konfiguracji kanału |
    | `plugin-sdk/telegram-command-config` | Helpery normalizacji/walidacji niestandardowych poleceń Telegram z fallbackiem kontraktu dołączonego |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Współdzielone helpery routingu przychodzącego + budowania envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Współdzielone helpery zapisu i dispatchu przychodzących wiadomości |
    | `plugin-sdk/messaging-targets` | Helpery parsowania/dopasowywania celów |
    | `plugin-sdk/outbound-media` | Współdzielone helpery ładowania mediów wychodzących |
    | `plugin-sdk/outbound-runtime` | Helpery tożsamości wychodzącej/delegowania wysyłki |
    | `plugin-sdk/thread-bindings-runtime` | Helpery cyklu życia powiązań wątków i adapterów |
    | `plugin-sdk/agent-media-payload` | Starszy builder payloadów mediów agenta |
    | `plugin-sdk/conversation-runtime` | Helpery konwersacji/powiązań wątków, parowania i skonfigurowanych powiązań |
    | `plugin-sdk/runtime-config-snapshot` | Helper snapshotu konfiguracji runtime |
    | `plugin-sdk/runtime-group-policy` | Helpery rozwiązywania polityki grup w runtime |
    | `plugin-sdk/channel-status` | Współdzielone helpery snapshotu/podsumowania statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Helpery autoryzacji zapisów konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty prelude pluginu kanału |
    | `plugin-sdk/allowlist-config-edit` | Helpery edycji/odczytu konfiguracji allowlist |
    | `plugin-sdk/group-access` | Współdzielone helpery decyzji dostępu do grup |
    | `plugin-sdk/direct-dm` | Współdzielone helpery uwierzytelniania/ochrony bezpośrednich DM |
    | `plugin-sdk/interactive-runtime` | Helpery normalizacji/redukcji interaktywnych payloadów odpowiedzi |
    | `plugin-sdk/channel-inbound` | Helpery debounce przychodzących wiadomości, dopasowania wzmianek, polityki wzmianek i helpery envelope |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helpery parsowania/dopasowywania celów |
    | `plugin-sdk/channel-contract` | Typy kontraktu kanału |
    | `plugin-sdk/channel-feedback` | Integracja feedbacku/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` oraz typy docelowe sekretów |
  </Accordion>

  <Accordion title="Subpathy dostawców">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratorowane helpery konfiguracji dostawców local/self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Skoncentrowane helpery konfiguracji self-hosted dostawców zgodnych z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI + stałe watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpery rozwiązywania kluczy API w runtime dla pluginów dostawców |
    | `plugin-sdk/provider-auth-api-key` | Helpery onboardingu/zapisu profilu dla kluczy API, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy builder wyniku uwierzytelniania OAuth |
    | `plugin-sdk/provider-auth-login` | Współdzielone interaktywne helpery logowania dla pluginów dostawców |
    | `plugin-sdk/provider-env-vars` | Helpery wyszukiwania zmiennych środowiskowych uwierzytelniania dostawców |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone buildery polityk replay, helpery endpointów dostawców i helpery normalizacji identyfikatorów modeli, takie jak `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ogólne helpery HTTP/możliwości endpointów dostawców |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie helpery kontraktu konfiguracji/wyboru web-fetch, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpery rejestracji/pamięci podręcznej web-fetch |
    | `plugin-sdk/provider-web-search-contract` | Wąskie helpery kontraktu konfiguracji/poświadczeń web-search, takie jak `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz setter/getter poświadczeń o ograniczonym zakresie |
    | `plugin-sdk/provider-web-search` | Helpery rejestracji/pamięci podręcznej/runtime dla web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematów Gemini + diagnostyka oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` i podobne |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów streamów oraz współdzielone helpery wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helpery łatek konfiguracji onboardingu |
    | `plugin-sdk/global-singleton` | Lokalne dla procesu helpery singletonów/map/cache |
  </Accordion>

  <Accordion title="Subpathy uwierzytelniania i bezpieczeństwa">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpery rejestru poleceń, helpery autoryzacji nadawców |
    | `plugin-sdk/approval-auth-runtime` | Helpery rozwiązywania approvera i uwierzytelniania akcji w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Helpery natywnego profilu/filtrowania zatwierdzeń exec |
    | `plugin-sdk/approval-delivery-runtime` | Natywne adaptery możliwości/dostarczania zatwierdzeń |
    | `plugin-sdk/approval-native-runtime` | Helpery natywnych celów zatwierdzeń + powiązań kont |
    | `plugin-sdk/approval-reply-runtime` | Helpery payloadów odpowiedzi zatwierdzeń exec/pluginów |
    | `plugin-sdk/command-auth-native` | Natywne uwierzytelnianie poleceń + helpery natywnych celów sesji |
    | `plugin-sdk/command-detection` | Współdzielone helpery wykrywania poleceń |
    | `plugin-sdk/command-surface` | Normalizacja treści polecenia i helpery powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery zbierania kontraktu sekretów dla powierzchni sekretów kanałów/pluginów |
    | `plugin-sdk/secret-ref-runtime` | Wąskie helpery `coerceSecretRef` i typowania SecretRef do parsowania kontraktów sekretów/konfiguracji |
    | `plugin-sdk/security-runtime` | Współdzielone helpery zaufania, bramek DM, treści zewnętrznych i zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Helpery allowlist hostów i polityki SSRF dla sieci prywatnych |
    | `plugin-sdk/ssrf-runtime` | Helpery pinned-dispatcher, fetch chronionego przed SSRF i polityki SSRF |
    | `plugin-sdk/secret-input` | Helpery parsowania danych wejściowych sekretów |
    | `plugin-sdk/webhook-ingress` | Helpery żądań/celów webhooków |
    | `plugin-sdk/webhook-request-guards` | Helpery rozmiaru body/timeoutu żądań |
  </Accordion>

  <Accordion title="Subpathy runtime i storage">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szeroka powierzchnia helperów runtime/logowania/kopii zapasowych/instalacji pluginów |
    | `plugin-sdk/runtime-env` | Wąskie helpery env runtime, loggera, timeoutu, retry i backoff |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone helpery poleceń/hooków/http/interaktywne pluginów |
    | `plugin-sdk/hook-runtime` | Współdzielone helpery pipeline webhooków/wewnętrznych hooków |
    | `plugin-sdk/lazy-runtime` | Helpery leniwego importu/powiązania runtime, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpery wykonywania procesów |
    | `plugin-sdk/cli-runtime` | Helpery formatowania, oczekiwania i wersji CLI |
    | `plugin-sdk/gateway-runtime` | Helpery klienta Gateway i łatek statusu kanału |
    | `plugin-sdk/config-runtime` | Helpery ładowania/zapisu konfiguracji |
    | `plugin-sdk/telegram-command-config` | Helpery normalizacji nazwy/opisu poleceń Telegram i sprawdzania duplikatów/konfliktów, nawet gdy powierzchnia kontraktu dołączonego Telegram nie jest dostępna |
    | `plugin-sdk/approval-runtime` | Helpery zatwierdzeń exec/pluginów, buildery możliwości zatwierdzeń, helpery auth/profili, natywne helpery routingu/runtime |
    | `plugin-sdk/reply-runtime` | Współdzielone helpery runtime dla wiadomości przychodzących/odpowiedzi, chunking, dispatch, heartbeat, planer odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery dispatchu/finalizacji odpowiedzi |
    | `plugin-sdk/reply-history` | Współdzielone helpery krótkiego okna historii odpowiedzi, takie jak `buildHistoryContext`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie helpery chunkingu tekstu/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpery ścieżek magazynu sesji + updated-at |
    | `plugin-sdk/state-paths` | Helpery ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/routing` | Helpery routingu/kluczy sesji/powiązań kont, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone helpery podsumowań statusu kanałów/kont, domyślne stany runtime i helpery metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone helpery rozwiązywania celów |
    | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji slugów/ciągów |
    | `plugin-sdk/request-url` | Wyodrębnianie URL-i tekstowych z wejść typu fetch/request |
    | `plugin-sdk/run-command` | Runner poleceń z timeoutem i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Wspólni czytelnicy parametrów narzędzi/CLI |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
    | `plugin-sdk/temp-path` | Współdzielone helpery ścieżek tymczasowego pobierania |
    | `plugin-sdk/logging-core` | Logger podsystemu i helpery redakcji |
    | `plugin-sdk/markdown-table-runtime` | Helpery trybu tabel Markdown |
    | `plugin-sdk/json-store` | Małe helpery odczytu/zapisu stanu JSON |
    | `plugin-sdk/file-lock` | Helpery reentrant file-lock |
    | `plugin-sdk/persistent-dedupe` | Helpery pamięci podręcznej deduplikacji opartej na dysku |
    | `plugin-sdk/acp-runtime` | Helpery runtime/sesji ACP i dispatchu odpowiedzi |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji runtime agenta |
    | `plugin-sdk/boolean-param` | Luźny czytnik parametrów bool |
    | `plugin-sdk/dangerous-name-runtime` | Helpery rozwiązywania niebezpiecznego dopasowania nazw |
    | `plugin-sdk/device-bootstrap` | Helpery bootstrapu urządzenia i tokenów parowania |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy helperów kanałów pasywnych, statusu i ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Helpery odpowiedzi dla polecenia `/models` i dostawców |
    | `plugin-sdk/skill-commands-runtime` | Helpery listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Helpery rejestru/build/serializacji natywnych poleceń |
    | `plugin-sdk/provider-zai-endpoint` | Helpery wykrywania endpointu Z.AI |
    | `plugin-sdk/infra-runtime` | Helpery zdarzeń systemowych/heartbeat |
    | `plugin-sdk/collection-runtime` | Małe helpery ograniczonej pamięci podręcznej |
    | `plugin-sdk/diagnostic-runtime` | Helpery flag i zdarzeń diagnostycznych |
    | `plugin-sdk/error-runtime` | Graf błędów, formatowanie, współdzielone helpery klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Opakowany fetch, proxy i helpery pinned lookup |
    | `plugin-sdk/host-runtime` | Helpery normalizacji hostname i hostów SCP |
    | `plugin-sdk/retry-runtime` | Helpery konfiguracji retry i runnera retry |
    | `plugin-sdk/agent-runtime` | Helpery katalogu/tożsamości/workspace agenta |
    | `plugin-sdk/directory-runtime` | Zapytania/dedup directory oparte na konfiguracji |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Subpathy możliwości i testowania">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Współdzielone helpery pobierania/przekształcania/przechowywania mediów oraz buildery payloadów mediów |
    | `plugin-sdk/media-generation-runtime` | Współdzielone helpery failover generowania mediów, wybór kandydatów i komunikaty o brakującym modelu |
    | `plugin-sdk/media-understanding` | Typy dostawców rozumienia mediów oraz eksporty helperów obrazów/audio dla dostawców |
    | `plugin-sdk/text-runtime` | Współdzielone helpery tekstu/Markdown/logowania, takie jak usuwanie tekstu widocznego dla asystenta, renderowanie/chunking/tabele Markdown, helpery redakcji, helpery tagów dyrektyw i bezpieczne narzędzia tekstowe |
    | `plugin-sdk/text-chunking` | Helper chunkingu tekstu wychodzącego |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz eksporty helperów dyrektyw, rejestru i walidacji dla dostawców |
    | `plugin-sdk/speech-core` | Współdzielone typy dostawców mowy, helpery rejestru, dyrektyw i normalizacji |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji w czasie rzeczywistym i helpery rejestru |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu w czasie rzeczywistym i helpery rejestru |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów |
    | `plugin-sdk/image-generation-core` | Współdzielone typy, failover, helpery auth i rejestru dla generowania obrazów |
    | `plugin-sdk/music-generation` | Typy dostawców/żądań/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Współdzielone typy generowania muzyki, helpery failover, wyszukiwania dostawców i parsowania referencji modeli |
    | `plugin-sdk/video-generation` | Typy dostawców/żądań/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo, helpery failover, wyszukiwania dostawców i parsowania referencji modeli |
    | `plugin-sdk/webhook-targets` | Rejestr celów webhooków i helpery instalacji tras |
    | `plugin-sdk/webhook-path` | Helpery normalizacji ścieżek webhooków |
    | `plugin-sdk/web-media` | Współdzielone helpery ładowania zdalnych/lokalnych mediów |
    | `plugin-sdk/zod` | Reeksport `zod` dla użytkowników Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Subpathy pamięci">
    | Subpath | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Dołączona pomocnicza powierzchnia memory-core dla helperów managera/konfiguracji/plików/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime indeksu/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika podstawowego hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Eksporty silnika embeddingów hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika storage hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Helpery multimodalne hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Helpery dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-core-host-status` | Helpery statusu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpery runtime CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpery podstawowego runtime hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny wobec producenta alias helperów podstawowego runtime hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny wobec producenta alias helperów dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Neutralny wobec producenta alias helperów plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-markdown` | Współdzielone helpery managed-markdown dla pluginów sąsiadujących z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada aktywnego runtime pamięci dla dostępu do search-manager |
    | `plugin-sdk/memory-host-status` | Neutralny wobec producenta alias helperów statusu hosta pamięci |
    | `plugin-sdk/memory-lancedb` | Dołączona pomocnicza powierzchnia memory-lancedb |
  </Accordion>

  <Accordion title="Zarezerwowane subpathy helperów dołączonych">
    | Rodzina | Aktualne subpathy | Zamierzone użycie |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpery wsparcia dołączonego pluginu browser (`browser-support` pozostaje barrelem zgodności) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Powierzchnia helperów/runtime dołączonego Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Powierzchnia helperów/runtime dołączonego LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Powierzchnia helperów dołączonego IRC |
    | Helpery specyficzne dla kanału | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Interfejsy zgodności/helperów dołączonych kanałów |
    | Helpery specyficzne dla auth/pluginów | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Interfejsy helperów dołączonych funkcji/pluginów; `plugin-sdk/github-copilot-token` eksportuje obecnie `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` i `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API rejestracji

Callback `register(api)` otrzymuje obiekt `OpenClawPluginApi` z następującymi
metodami:

### Rejestracja możliwości

| Metoda                                           | Co rejestruje                   |
| ------------------------------------------------ | -------------------------------- |
| `api.registerProvider(...)`                      | Wnioskowanie tekstowe (LLM)      |
| `api.registerCliBackend(...)`                    | Lokalny backend wnioskowania CLI |
| `api.registerChannel(...)`                       | Kanał wiadomości                 |
| `api.registerSpeechProvider(...)`                | Synteza text-to-speech / STT     |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniową transkrypcję w czasie rzeczywistym |
| `api.registerRealtimeVoiceProvider(...)`         | Dwukierunkowe sesje głosowe w czasie rzeczywistym |
| `api.registerMediaUnderstandingProvider(...)`    | Analizę obrazu/audio/wideo       |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów              |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki               |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo                |
| `api.registerWebFetchProvider(...)`              | Dostawcę web fetch / scrape      |
| `api.registerWebSearchProvider(...)`             | Wyszukiwanie w sieci             |

### Narzędzia i polecenia

| Metoda                          | Co rejestruje                                |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane lub `{ optional: true }`) |
| `api.registerCommand(def)`      | Polecenie niestandardowe (omija LLM)         |

### Infrastruktura

| Metoda                                         | Co rejestruje                       |
| ---------------------------------------------- | ----------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook zdarzeń                        |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway               |
| `api.registerGatewayMethod(name, handler)`     | Metodę RPC Gateway                  |
| `api.registerCli(registrar, opts?)`            | Podpolecenie CLI                    |
| `api.registerService(service)`                 | Usługę działającą w tle             |
| `api.registerInteractiveHandler(registration)` | Handler interaktywny                |
| `api.registerMemoryPromptSupplement(builder)`  | Addytywną sekcję promptu sąsiadującą z pamięcią |
| `api.registerMemoryCorpusSupplement(adapter)`  | Addytywny korpus pamięci do wyszukiwania/odczytu |

Zarezerwowane podstawowe administracyjne przestrzenie nazw (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze pozostają `operator.admin`, nawet jeśli plugin spróbuje przypisać
węższy zakres metody Gateway. Dla metod należących do pluginu preferuj prefiksy
specyficzne dla pluginu.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` akceptuje dwa rodzaje metadanych najwyższego poziomu:

- `commands`: jawne rooty poleceń należące do registrara
- `descriptors`: deskryptory poleceń używane w czasie parsowania dla głównej pomocy CLI,
  routingu i leniwej rejestracji CLI pluginów

Jeśli chcesz, aby polecenie pluginu pozostawało leniwie ładowane w normalnej ścieżce głównego CLI,
podaj `descriptors`, które obejmują każdy root polecenia najwyższego poziomu ujawniany przez tego
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
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Używaj samego `commands` tylko wtedy, gdy nie potrzebujesz leniwej rejestracji głównego CLI.
Ta ścieżka zgodności eager nadal jest obsługiwana, ale nie instaluje
placeholderów opartych na deskryptorach dla leniwego ładowania w czasie parsowania.

### Rejestracja backendu CLI

`api.registerCliBackend(...)` pozwala pluginowi posiadać domyślną konfigurację lokalnego
backendu AI CLI, takiego jak `codex-cli`.

- `id` backendu staje się prefiksem dostawcy w referencjach modeli takich jak `codex-cli/gpt-5`.
- `config` backendu używa tego samego kształtu co `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal wygrywa. OpenClaw scala `agents.defaults.cliBackends.<id>` z
  domyślną konfiguracją pluginu przed uruchomieniem CLI.
- Użyj `normalizeConfig`, gdy backend wymaga przepisania zgodności po scaleniu
  (na przykład normalizacji starych kształtów flag).

### Sloty wyłączne

| Metoda                                     | Co rejestruje                        |
| ------------------------------------------ | ------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (aktywny jeden naraz) |
| `api.registerMemoryCapability(capability)` | Ujednoliconą możliwość pamięci       |
| `api.registerMemoryPromptSection(builder)` | Builder sekcji promptu pamięci       |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu flush pamięci         |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime pamięci              |

### Adaptery embeddingów pamięci

| Metoda                                         | Co rejestruje                                 |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embeddingów pamięci dla aktywnego pluginu |

- `registerMemoryCapability` to preferowane wyłączne API pluginu pamięci.
- `registerMemoryCapability` może również udostępniać `publicArtifacts.listArtifacts(...)`,
  aby pluginy towarzyszące mogły korzystać z eksportowanych artefaktów pamięci przez
  `openclaw/plugin-sdk/memory-host-core` zamiast sięgać do prywatnego układu konkretnego
  pluginu pamięci.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` oraz
  `registerMemoryRuntime` to starsze, zgodne wstecz wyłączne API pluginów pamięci.
- `registerMemoryEmbeddingProvider` pozwala aktywnemu pluginowi pamięci rejestrować jeden
  lub więcej identyfikatorów adapterów embeddingów (na przykład `openai`, `gemini` lub własny identyfikator zdefiniowany przez plugin).
- Konfiguracja użytkownika, taka jak `agents.defaults.memorySearch.provider` i
  `agents.defaults.memorySearch.fallback`, rozwiązuje się względem tych zarejestrowanych
  identyfikatorów adapterów.

### Zdarzenia i cykl życia

| Metoda                                       | Co robi                        |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | Typowany hook cyklu życia      |
| `api.onConversationBindingResolved(handler)` | Callback rozwiązania powiązania konwersacji |

### Semantyka decyzji hooków

- `before_tool_call`: zwrócenie `{ block: true }` jest rozstrzygające. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest rozstrzygające. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest rozstrzygające. Gdy dowolny handler przejmie dispatch, handlery o niższym priorytecie i domyślna ścieżka dispatchu modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest rozstrzygające. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.

### Pola obiektu API

| Pole                    | Typ                       | Opis                                                                                          |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identyfikator pluginu                                                                         |
| `api.name`               | `string`                  | Nazwa wyświetlana                                                                             |
| `api.version`            | `string?`                 | Wersja pluginu (opcjonalnie)                                                                  |
| `api.description`        | `string?`                 | Opis pluginu (opcjonalnie)                                                                    |
| `api.source`             | `string`                  | Ścieżka źródłowa pluginu                                                                      |
| `api.rootDir`            | `string?`                 | Katalog główny pluginu (opcjonalnie)                                                          |
| `api.config`             | `OpenClawConfig`          | Bieżący snapshot konfiguracji (aktywny snapshot runtime w pamięci, gdy dostępny)             |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfiguracja specyficzna dla pluginu z `plugins.entries.<id>.config`                          |
| `api.runtime`            | `PluginRuntime`           | [Runtime Helpers](/pl/plugins/sdk-runtime)                                                       |
| `api.logger`             | `PluginLogger`            | Logger o ograniczonym zakresie (`debug`, `info`, `warn`, `error`)                             |
| `api.registrationMode`   | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno uruchamiania/konfiguracji przed pełnym wejściem |
| `api.resolvePath(input)` | `(string) => string`      | Rozwiązanie ścieżki względem katalogu głównego pluginu                                        |

## Konwencja modułów wewnętrznych

Wewnątrz pluginu używaj lokalnych plików barrel do importów wewnętrznych:

```
my-plugin/
  api.ts            # Publiczne eksporty dla zewnętrznych konsumentów
  runtime-api.ts    # Eksporty runtime tylko do użytku wewnętrznego
  index.ts          # Punkt wejścia pluginu
  setup-entry.ts    # Lekki punkt wejścia tylko do konfiguracji (opcjonalnie)
```

<Warning>
  Nigdy nie importuj własnego pluginu przez `openclaw/plugin-sdk/<your-plugin>`
  w kodzie produkcyjnym. Prowadź importy wewnętrzne przez `./api.ts` lub
  `./runtime-api.ts`. Ścieżka SDK jest wyłącznie kontraktem zewnętrznym.
</Warning>

Publiczne powierzchnie dołączonych pluginów ładowane przez fasady (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` i podobne publiczne pliki wejściowe) preferują teraz
aktywny snapshot konfiguracji runtime, gdy OpenClaw już działa. Jeśli snapshot runtime
nie istnieje jeszcze, wracają do rozpoznanego pliku konfiguracyjnego na dysku.

Pluginy dostawców mogą także ujawniać wąski lokalny barrel kontraktu pluginu, gdy
helper jest celowo specyficzny dla dostawcy i jeszcze nie należy do ogólnego subpath SDK.
Aktualny dołączony przykład: dostawca Anthropic przechowuje swoje helpery
strumieni Claude we własnym publicznym interfejsie `api.ts` / `contract-api.ts` zamiast
promować logikę nagłówków beta Anthropic i `service_tier` do ogólnego
kontraktu `plugin-sdk/*`.

Inne aktualne dołączone przykłady:

- `@openclaw/openai-provider`: `api.ts` eksportuje buildery dostawców,
  helpery modeli domyślnych i buildery dostawców realtime
- `@openclaw/openrouter-provider`: `api.ts` eksportuje builder dostawcy oraz
  helpery onboardingu/konfiguracji

<Warning>
  Produkcyjny kod rozszerzeń powinien także unikać importów `openclaw/plugin-sdk/<other-plugin>`.
  Jeśli helper jest rzeczywiście współdzielony, przenieś go do neutralnego subpath SDK,
  takiego jak `openclaw/plugin-sdk/speech`, `.../provider-model-shared` lub innej
  powierzchni zorientowanej na możliwości zamiast łączyć dwa pluginy ze sobą.
</Warning>

## Powiązane

- [Entry Points](/pl/plugins/sdk-entrypoints) — opcje `definePluginEntry` i `defineChannelPluginEntry`
- [Runtime Helpers](/pl/plugins/sdk-runtime) — pełna referencja przestrzeni nazw `api.runtime`
- [Setup and Config](/pl/plugins/sdk-setup) — pakowanie, manifesty, schematy konfiguracji
- [Testing](/pl/plugins/sdk-testing) — narzędzia testowe i reguły lint
- [SDK Migration](/pl/plugins/sdk-migration) — migracja ze starych powierzchni
- [Plugin Internals](/pl/plugins/architecture) — szczegółowa architektura i model możliwości
