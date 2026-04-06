---
read_when:
    - Musisz wiedzieć, z której podścieżki SDK importować
    - Chcesz znaleźć dokumentację wszystkich metod rejestracji w `OpenClawPluginApi`
    - Szukasz konkretnego eksportu SDK
sidebarTitle: SDK Overview
summary: Mapa importów, dokumentacja referencyjna API rejestracji i architektura SDK
title: Przegląd Plugin SDK
x-i18n:
    generated_at: "2026-04-06T09:46:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: acd2887ef52c66b2f234858d812bb04197ecd0bfb3e4f7bf3622f8fdc765acad
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Przegląd Plugin SDK

Plugin SDK to typowany kontrakt między pluginami a rdzeniem. Ta strona jest
dokumentacją referencyjną dla **tego, co importować** i **co można rejestrować**.

<Tip>
  **Szukasz przewodnika krok po kroku?**
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
pozostaje szybkie i unika się problemów z zależnościami cyklicznymi. W przypadku
pomocników budowania/punktów wejścia specyficznych dla kanałów preferuj
`openclaw/plugin-sdk/channel-core`; `openclaw/plugin-sdk/core` zachowaj dla
szerszej powierzchni parasolowej i współdzielonych pomocników, takich jak
`buildChannelConfigSchema`.

Nie dodawaj ani nie polegaj na wygodnych interfejsach nazwanych od dostawców,
takich jak `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, ani na
pomocniczych interfejsach oznaczonych marką kanału. Bundled plugins powinny
składać generyczne podścieżki SDK we własnych barrelach `api.ts` lub
`runtime-api.ts`, a rdzeń powinien albo używać tych lokalnych barrelów pluginu,
albo dodać wąski generyczny kontrakt SDK, gdy potrzeba faktycznie dotyczy wielu
kanałów.

Wygenerowana mapa eksportów nadal zawiera mały zestaw pomocniczych interfejsów
dla bundled plugins, takich jak `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` i `plugin-sdk/matrix*`. Te
podścieżki istnieją wyłącznie na potrzeby utrzymania bundled plugins i
zgodności; celowo pominięto je w typowej tabeli poniżej i nie są zalecaną
ścieżką importu dla nowych pluginów zewnętrznych.

## Dokumentacja podścieżek

Najczęściej używane podścieżki pogrupowane według przeznaczenia. Wygenerowana
pełna lista ponad 200 podścieżek znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`.

Zastrzeżone pomocnicze podścieżki bundled plugins nadal pojawiają się na tej
wygenerowanej liście. Traktuj je jako szczegóły implementacyjne lub powierzchnie
zgodności, chyba że jakaś strona dokumentacji wyraźnie promuje daną z nich jako
publiczną.

### Punkt wejścia pluginu

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
    | `plugin-sdk/setup` | Współdzielone pomocniki kreatora konfiguracji, prompty list dozwolonych i konstruktory statusu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Pomocniki konfiguracji wielukontowej/bramek akcji oraz pomocniki domyślnego konta awaryjnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, pomocniki normalizacji identyfikatora konta |
    | `plugin-sdk/account-resolution` | Wyszukiwanie konta + pomocniki domyślnego fallbacku |
    | `plugin-sdk/account-helpers` | Wąskie pomocniki list akcji konta i działań na koncie |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typy schematu konfiguracji kanału |
    | `plugin-sdk/telegram-command-config` | Pomocniki normalizacji/walidacji niestandardowych komend Telegram z fallbackiem kontraktu bundled |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Współdzielone pomocniki routingu przychodzącego + konstruktora koperty |
    | `plugin-sdk/inbound-reply-dispatch` | Współdzielone pomocniki zapisu i wysyłki dla wiadomości przychodzących |
    | `plugin-sdk/messaging-targets` | Pomocniki parsowania/dopasowywania celów |
    | `plugin-sdk/outbound-media` | Współdzielone pomocniki ładowania mediów wychodzących |
    | `plugin-sdk/outbound-runtime` | Pomocniki tożsamości wychodzącej i delegatów wysyłania |
    | `plugin-sdk/thread-bindings-runtime` | Pomocniki cyklu życia i adapterów wiązań wątków |
    | `plugin-sdk/agent-media-payload` | Starszy konstruktor ładunku mediów agenta |
    | `plugin-sdk/conversation-runtime` | Pomocniki wiązania konwersacji/wątków, parowania i skonfigurowanych wiązań |
    | `plugin-sdk/runtime-config-snapshot` | Pomocnik migawki konfiguracji runtime |
    | `plugin-sdk/runtime-group-policy` | Pomocniki rozstrzygania polityki grup runtime |
    | `plugin-sdk/channel-status` | Współdzielone pomocniki migawki/podsumowania statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Pomocniki autoryzacji zapisu konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty preludium pluginów kanałów |
    | `plugin-sdk/allowlist-config-edit` | Pomocniki odczytu/edycji konfiguracji listy dozwolonych |
    | `plugin-sdk/group-access` | Współdzielone pomocniki decyzji dostępu grupowego |
    | `plugin-sdk/direct-dm` | Współdzielone pomocniki autoryzacji/ochrony dla bezpośrednich DM |
    | `plugin-sdk/interactive-runtime` | Pomocniki normalizacji/redukcji ładunków interaktywnych odpowiedzi |
    | `plugin-sdk/channel-inbound` | Debounce, dopasowywanie wzmianek, pomocniki kopert |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Pomocniki parsowania/dopasowywania celów |
    | `plugin-sdk/channel-contract` | Typy kontraktu kanału |
    | `plugin-sdk/channel-feedback` | Okablowanie opinii/reakcji |
  </Accordion>

  <Accordion title="Podścieżki dostawców">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratorowane pomocniki konfiguracji lokalnych/self-hosted dostawców |
    | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane pomocniki konfiguracji self-hosted dostawców zgodnych z OpenAI |
    | `plugin-sdk/provider-auth-runtime` | Pomocniki rozstrzygania kluczy API w runtime dla pluginów dostawców |
    | `plugin-sdk/provider-auth-api-key` | Pomocniki onboardingu kluczy API/zapisu profilu |
    | `plugin-sdk/provider-auth-result` | Standardowy konstruktor wyniku autoryzacji OAuth |
    | `plugin-sdk/provider-auth-login` | Współdzielone pomocniki interaktywnego logowania dla pluginów dostawców |
    | `plugin-sdk/provider-env-vars` | Pomocniki wyszukiwania zmiennych środowiskowych autoryzacji dostawców |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory polityk replay, pomocniki endpointów dostawców oraz pomocniki normalizacji identyfikatorów modeli, takie jak `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Generyczne pomocniki możliwości HTTP/endpointów dostawców |
    | `plugin-sdk/provider-web-fetch` | Pomocniki rejestracji/cache dostawców pobierania z internetu |
    | `plugin-sdk/provider-web-search` | Pomocniki rejestracji/cache/konfiguracji dostawców wyszukiwania w internecie |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematów Gemini + diagnostyka oraz pomocniki zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` i podobne |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz współdzielone pomocniki wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Pomocniki łatania konfiguracji onboardingu |
    | `plugin-sdk/global-singleton` | Pomocniki lokalnych dla procesu singletonów/map/cache |
  </Accordion>

  <Accordion title="Podścieżki autoryzacji i bezpieczeństwa">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, pomocniki rejestru komend, pomocniki autoryzacji nadawcy |
    | `plugin-sdk/approval-auth-runtime` | Pomocniki rozstrzygania zatwierdzających i autoryzacji działań w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Pomocniki natywnego wykonania dla profili/filtrów zatwierdzania |
    | `plugin-sdk/approval-delivery-runtime` | Adaptery możliwości/dostarczania natywnego zatwierdzania |
    | `plugin-sdk/approval-native-runtime` | Pomocniki celu natywnego zatwierdzania + wiązania kont |
    | `plugin-sdk/approval-reply-runtime` | Pomocniki ładunków odpowiedzi zatwierdzania exec/plugin |
    | `plugin-sdk/command-auth-native` | Natywna autoryzacja komend + pomocniki natywnego celu sesji |
    | `plugin-sdk/command-detection` | Współdzielone pomocniki wykrywania komend |
    | `plugin-sdk/command-surface` | Pomocniki normalizacji treści komend i powierzchni komend |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | Współdzielone pomocniki zaufania, bramkowania DM, zewnętrznych treści i zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Pomocniki allowlist hostów i polityki SSRF dla sieci prywatnych |
    | `plugin-sdk/ssrf-runtime` | Pomocniki przypiętego dispatchera, fetch chronionego przed SSRF i polityki SSRF |
    | `plugin-sdk/secret-input` | Pomocniki parsowania wejść sekretów |
    | `plugin-sdk/webhook-ingress` | Pomocniki żądań/docelowych webhooków |
    | `plugin-sdk/webhook-request-guards` | Pomocniki limitu rozmiaru treści i limitu czasu żądań |
  </Accordion>

  <Accordion title="Podścieżki runtime i pamięci trwałej">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szeroka powierzchnia pomocników runtime/logowania/kopii zapasowych/instalacji pluginów |
    | `plugin-sdk/runtime-env` | Wąskie pomocniki środowiska runtime, loggera, timeoutów, ponowień i backoffu |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone pomocniki komend/hooków/http/interakcji pluginów |
    | `plugin-sdk/hook-runtime` | Współdzielone pomocniki pipeline webhooków i hooków wewnętrznych |
    | `plugin-sdk/lazy-runtime` | Pomocniki leniwego importu/powiązań runtime, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Pomocniki uruchamiania procesów |
    | `plugin-sdk/cli-runtime` | Pomocniki formatowania CLI, oczekiwania i wersji |
    | `plugin-sdk/gateway-runtime` | Pomocniki klienta Gateway i łatania statusu kanału |
    | `plugin-sdk/config-runtime` | Pomocniki ładowania/zapisu konfiguracji |
    | `plugin-sdk/telegram-command-config` | Normalizacja nazw/opisów komend Telegram oraz wykrywanie duplikatów/konfliktów, nawet gdy powierzchnia kontraktu bundled Telegram jest niedostępna |
    | `plugin-sdk/approval-runtime` | Pomocniki zatwierdzania exec/plugin, konstruktory możliwości zatwierdzania, pomocniki auth/profili, pomocniki natywnego routingu/runtime |
    | `plugin-sdk/reply-runtime` | Współdzielone pomocniki runtime dla wiadomości przychodzących/odpowiedzi, chunking, dispatch, heartbeat, planer odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie pomocniki dispatch/finalizacji odpowiedzi |
    | `plugin-sdk/reply-history` | Współdzielone pomocniki krótkookresowej historii odpowiedzi, takie jak `buildHistoryContext`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie pomocniki chunkingu tekstu/Markdown |
    | `plugin-sdk/session-store-runtime` | Pomocniki ścieżek magazynu sesji + `updated-at` |
    | `plugin-sdk/state-paths` | Pomocniki ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/routing` | Pomocniki wiązania trasy/klucza sesji/konta, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone pomocniki podsumowania statusu kanału/konta, domyślne stany runtime i pomocniki metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone pomocniki rozstrzygania celu |
    | `plugin-sdk/string-normalization-runtime` | Pomocniki normalizacji slugów/ciągów znaków |
    | `plugin-sdk/request-url` | Wyodrębnianie URL-i tekstowych z wejść typu fetch/request |
    | `plugin-sdk/run-command` | Uruchamianie komend z limitem czasu i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Typowe czytniki parametrów narzędzi/CLI |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzi |
    | `plugin-sdk/temp-path` | Współdzielone pomocniki ścieżek tymczasowego pobierania |
    | `plugin-sdk/logging-core` | Logger podsystemu i pomocniki redakcji |
    | `plugin-sdk/markdown-table-runtime` | Pomocniki trybu tabel Markdown |
    | `plugin-sdk/json-store` | Małe pomocniki odczytu/zapisu stanu JSON |
    | `plugin-sdk/file-lock` | Pomocniki reentrantnych blokad plików |
    | `plugin-sdk/persistent-dedupe` | Pomocniki cache deduplikacji na dysku |
    | `plugin-sdk/acp-runtime` | Pomocniki ACP runtime/sesji i dispatchu odpowiedzi |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji runtime agenta |
    | `plugin-sdk/boolean-param` | Czytnik luźnych parametrów logicznych |
    | `plugin-sdk/dangerous-name-runtime` | Pomocniki rozstrzygania dopasowań niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Pomocniki bootstrapu urządzenia i tokenów parowania |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy pomocników pasywnego kanału i statusu |
    | `plugin-sdk/models-provider-runtime` | Pomocniki odpowiedzi dostawców/komendy `/models` |
    | `plugin-sdk/skill-commands-runtime` | Pomocniki listowania komend Skills |
    | `plugin-sdk/native-command-registry` | Pomocniki rejestru/budowania/serializacji natywnych komend |
    | `plugin-sdk/provider-zai-endpoint` | Pomocniki wykrywania endpointów Z.A.I |
    | `plugin-sdk/infra-runtime` | Pomocniki zdarzeń systemowych/heartbeat |
    | `plugin-sdk/collection-runtime` | Pomocniki małych ograniczonych cache |
    | `plugin-sdk/diagnostic-runtime` | Pomocniki flag diagnostycznych i zdarzeń |
    | `plugin-sdk/error-runtime` | Graf błędów, formatowanie, współdzielone pomocniki klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Pomocniki opakowanego fetch, proxy i przypiętych lookupów |
    | `plugin-sdk/host-runtime` | Pomocniki normalizacji hostname i hostów SCP |
    | `plugin-sdk/retry-runtime` | Pomocniki konfiguracji ponowień i wykonawcy ponowień |
    | `plugin-sdk/agent-runtime` | Pomocniki katalogu/tożsamości/obszaru roboczego agenta |
    | `plugin-sdk/directory-runtime` | Zapytania deduplikacja katalogów oparta na konfiguracji |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Podścieżki możliwości i testowania">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Współdzielone pomocniki pobierania/transformacji/przechowywania mediów oraz konstruktory ładunków mediów |
    | `plugin-sdk/media-generation-runtime` | Współdzielone pomocniki failover dla generowania mediów, wybór kandydatów i komunikaty o brakujących modelach |
    | `plugin-sdk/media-understanding` | Typy dostawców rozumienia mediów oraz eksporty pomocników obrazów/audio skierowane do dostawców |
    | `plugin-sdk/text-runtime` | Współdzielone pomocniki tekstu/Markdown/logowania, takie jak usuwanie tekstu widocznego dla asystenta, pomocniki renderowania/chunkingu/tabel Markdown, pomocniki redakcji, pomocniki tagów dyrektyw i narzędzia bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Pomocnik chunkingu tekstu wychodzącego |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz eksporty pomocników dyrektyw, rejestru i walidacji skierowane do dostawców |
    | `plugin-sdk/speech-core` | Współdzielone typy dostawców mowy oraz pomocniki rejestru, dyrektyw i normalizacji |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji realtime i pomocniki rejestru |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu realtime i pomocniki rejestru |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów |
    | `plugin-sdk/image-generation-core` | Współdzielone typy generowania obrazów oraz pomocniki failover, auth i rejestru |
    | `plugin-sdk/music-generation` | Typy dostawców/żądań/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Współdzielone typy generowania muzyki, pomocniki failover, wyszukiwanie dostawców i parsowanie model-ref |
    | `plugin-sdk/video-generation` | Typy dostawców/żądań/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo, pomocniki failover, wyszukiwanie dostawców i parsowanie model-ref |
    | `plugin-sdk/webhook-targets` | Rejestr celów webhooków i pomocniki instalacji tras |
    | `plugin-sdk/webhook-path` | Pomocniki normalizacji ścieżek webhooków |
    | `plugin-sdk/web-media` | Współdzielone pomocniki ładowania zdalnych/lokalnych mediów |
    | `plugin-sdk/zod` | Reeksport `zod` dla odbiorców Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Podścieżki pamięci">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Powierzchnia pomocnicza bundled memory-core dla menedżera/konfiguracji/plików/pomocników CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime indeksu/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika podstaw hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Eksporty silnika embeddingów hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika przechowywania hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Pomocniki multimodalne hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Pomocniki zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Pomocniki sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Pomocniki dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-core-host-status` | Pomocniki statusu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Pomocniki CLI runtime hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Pomocniki rdzeniowego runtime hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Pomocniki plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny względem dostawcy alias pomocników rdzeniowego runtime hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny względem dostawcy alias pomocników dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Neutralny względem dostawcy alias pomocników plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-markdown` | Współdzielone pomocniki zarządzanego Markdown dla pluginów powiązanych z pamięcią |
    | `plugin-sdk/memory-host-search` | Aktywna fasada runtime pamięci dla dostępu do menedżera wyszukiwania |
    | `plugin-sdk/memory-host-status` | Neutralny względem dostawcy alias pomocników statusu hosta pamięci |
    | `plugin-sdk/memory-lancedb` | Powierzchnia pomocnicza bundled memory-lancedb |
  </Accordion>

  <Accordion title="Zastrzeżone pomocnicze podścieżki bundled">
    | Rodzina | Bieżące podścieżki | Przeznaczenie |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Pomocniki wsparcia bundled browser plugin (`browser-support` pozostaje barrelem zgodności) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Powierzchnia pomocnicza/runtime bundled Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Powierzchnia pomocnicza/runtime bundled LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Powierzchnia pomocnicza bundled IRC |
    | Pomocniki specyficzne dla kanałów | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Interfejsy pomocnicze/zgodności bundled kanałów |
    | Pomocniki specyficzne dla auth/pluginów | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Interfejsy pomocnicze bundled funkcji/pluginów; `plugin-sdk/github-copilot-token` obecnie eksportuje `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` i `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API rejestracji

Callback `register(api)` otrzymuje obiekt `OpenClawPluginApi` z tymi metodami:

### Rejestracja możliwości

| Metoda                                           | Co rejestruje                    |
| ------------------------------------------------ | -------------------------------- |
| `api.registerProvider(...)`                      | Wnioskowanie tekstowe (LLM)      |
| `api.registerChannel(...)`                       | Kanał wiadomości                 |
| `api.registerSpeechProvider(...)`                | Synteza tekstu na mowę / STT     |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniowa transkrypcja realtime |
| `api.registerRealtimeVoiceProvider(...)`         | Dwukierunkowe sesje głosu realtime |
| `api.registerMediaUnderstandingProvider(...)`    | Analiza obrazu/audio/wideo       |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów              |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki               |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo                |
| `api.registerWebFetchProvider(...)`              | Dostawca pobierania / scrapingu z internetu |
| `api.registerWebSearchProvider(...)`             | Wyszukiwanie w internecie        |

### Narzędzia i komendy

| Metoda                          | Co rejestruje                                 |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane lub `{ optional: true }`) |
| `api.registerCommand(def)`      | Niestandardową komendę (z pominięciem LLM)    |

### Infrastruktura

| Metoda                                         | Co rejestruje                         |
| ---------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook zdarzeń                          |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway                 |
| `api.registerGatewayMethod(name, handler)`     | Metodę RPC Gateway                    |
| `api.registerCli(registrar, opts?)`            | Podkomendę CLI                        |
| `api.registerService(service)`                 | Usługę działającą w tle               |
| `api.registerInteractiveHandler(registration)` | Obsługę interaktywną                  |
| `api.registerMemoryPromptSupplement(builder)`  | Addytywną sekcję promptu związaną z pamięcią |
| `api.registerMemoryCorpusSupplement(adapter)`  | Addytywny korpus wyszukiwania/odczytu pamięci |

Zastrzeżone przestrzenie nazw administracyjnych rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze pozostają `operator.admin`, nawet jeśli plugin próbuje
przypisać węższy zakres metody Gateway. Dla metod należących do pluginu
preferuj prefiksy specyficzne dla pluginu.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` akceptuje dwa rodzaje metadanych najwyższego poziomu:

- `commands`: jawne korzenie komend należące do registrara
- `descriptors`: deskryptory komend używane na etapie parsowania dla głównej pomocy CLI,
  routingu i leniwej rejestracji CLI pluginu

Jeśli chcesz, aby komenda pluginu pozostała leniwie ładowana w normalnej
ścieżce głównego CLI, podaj `descriptors`, które obejmują każdy korzeń komendy
najwyższego poziomu udostępniany przez ten registrar.

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

Używaj samego `commands` tylko wtedy, gdy nie potrzebujesz leniwej rejestracji
w głównym CLI. Ta zgodnościowa ścieżka eager nadal jest wspierana, ale nie
instaluje placeholderów opartych na deskryptorach dla leniwego ładowania na
etapie parsowania.

### Sloty wyłączne

| Metoda                                     | Co rejestruje                        |
| ------------------------------------------ | ------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (jeden aktywny naraz) |
| `api.registerMemoryPromptSection(builder)` | Konstruktor sekcji promptu pamięci   |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu opróżniania pamięci   |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime pamięci              |

### Adaptery osadzania pamięci

| Metoda                                         | Co rejestruje                                  |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter osadzania pamięci dla aktywnego pluginu |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan` i
  `registerMemoryRuntime` są wyłączne dla pluginów pamięci.
- `registerMemoryEmbeddingProvider` pozwala aktywnemu pluginowi pamięci
  zarejestrować jeden lub więcej identyfikatorów adapterów osadzania
  (na przykład `openai`, `gemini` albo niestandardowy identyfikator
  zdefiniowany przez plugin).
- Konfiguracja użytkownika, taka jak `agents.defaults.memorySearch.provider` i
  `agents.defaults.memorySearch.fallback`, jest rozstrzygana względem tych
  zarejestrowanych identyfikatorów adapterów.

### Zdarzenia i cykl życia

| Metoda                                       | Co robi                     |
| -------------------------------------------- | --------------------------- |
| `api.on(hookName, handler, opts?)`           | Typowany hook cyklu życia   |
| `api.onConversationBindingResolved(handler)` | Callback rozstrzygnięcia wiązania konwersacji |

### Semantyka decyzji hooków

- `before_tool_call`: zwrócenie `{ block: true }` jest końcowe. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest końcowe. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest końcowe. Gdy dowolny handler przejmie dispatch, handlery o niższym priorytecie oraz domyślna ścieżka dispatchu modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest końcowe. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.

### Pola obiektu API

| Pole                    | Typ                       | Opis                                                                                        |
| ----------------------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                | `string`                  | Identyfikator pluginu                                                                       |
| `api.name`              | `string`                  | Nazwa wyświetlana                                                                           |
| `api.version`           | `string?`                 | Wersja pluginu (opcjonalnie)                                                                |
| `api.description`       | `string?`                 | Opis pluginu (opcjonalnie)                                                                  |
| `api.source`            | `string`                  | Ścieżka źródłowa pluginu                                                                    |
| `api.rootDir`           | `string?`                 | Katalog główny pluginu (opcjonalnie)                                                        |
| `api.config`            | `OpenClawConfig`          | Bieżąca migawka konfiguracji (aktywny snapshot runtime w pamięci, gdy jest dostępny)       |
| `api.pluginConfig`      | `Record<string, unknown>` | Konfiguracja specyficzna dla pluginu z `plugins.entries.<id>.config`                        |
| `api.runtime`           | `PluginRuntime`           | [Pomocniki runtime](/pl/plugins/sdk-runtime)                                                   |
| `api.logger`            | `PluginLogger`            | Logger o zawężonym zakresie (`debug`, `info`, `warn`, `error`)                              |
| `api.registrationMode`  | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekki etap uruchamiania/konfiguracji przed pełnym entry |
| `api.resolvePath(input)` | `(string) => string`     | Rozstrzyganie ścieżki względem katalogu głównego pluginu                                    |

## Konwencja modułów wewnętrznych

Wewnątrz pluginu używaj lokalnych plików barrel do importów wewnętrznych:

```
my-plugin/
  api.ts            # Publiczne eksporty dla zewnętrznych odbiorców
  runtime-api.ts    # Eksporty runtime wyłącznie do użytku wewnętrznego
  index.ts          # Punkt wejścia pluginu
  setup-entry.ts    # Lekki punkt wejścia tylko do konfiguracji (opcjonalny)
```

<Warning>
  Nigdy nie importuj własnego pluginu przez `openclaw/plugin-sdk/<your-plugin>`
  w kodzie produkcyjnym. Kieruj importy wewnętrzne przez `./api.ts` albo
  `./runtime-api.ts`. Ścieżka SDK jest wyłącznie kontraktem zewnętrznym.
</Warning>

Publiczne powierzchnie bundled plugins ładowane przez fasadę (`api.ts`,
`runtime-api.ts`, `index.ts`, `setup-entry.ts` i podobne publiczne pliki wejściowe)
preferują teraz aktywną migawkę konfiguracji runtime, gdy OpenClaw jest już
uruchomiony. Jeśli migawka runtime jeszcze nie istnieje, przechodzą na
konfigurację rozstrzygniętą z pliku na dysku.

Pluginy dostawców mogą także udostępniać wąski lokalny barrel kontraktu pluginu,
gdy pomocnik jest celowo specyficzny dla dostawcy i nie pasuje jeszcze do
generycznej podścieżki SDK. Bieżący bundled przykład: dostawca Anthropic
przechowuje swoje pomocniki strumieni Claude we własnym publicznym interfejsie
`api.ts` / `contract-api.ts` zamiast promować logikę nagłówków beta Anthropic i
`service_tier` do generycznego kontraktu `plugin-sdk/*`.

Inne bieżące bundled przykłady:

- `@openclaw/openai-provider`: `api.ts` eksportuje konstruktory dostawców,
  pomocniki modeli domyślnych i konstruktory dostawców realtime
- `@openclaw/openrouter-provider`: `api.ts` eksportuje konstruktor dostawcy oraz
  pomocniki onboardingu/konfiguracji

<Warning>
  Kod produkcyjny rozszerzeń powinien także unikać importów
  `openclaw/plugin-sdk/<other-plugin>`. Jeśli jakiś pomocnik jest faktycznie
  współdzielony, przenieś go do neutralnej podścieżki SDK, takiej jak
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` lub innej
  powierzchni zorientowanej na możliwości, zamiast wiązać dwa pluginy ze sobą.
</Warning>

## Powiązane

- [Punkty wejścia](/pl/plugins/sdk-entrypoints) — opcje `definePluginEntry` i `defineChannelPluginEntry`
- [Pomocniki runtime](/pl/plugins/sdk-runtime) — pełna dokumentacja referencyjna przestrzeni nazw `api.runtime`
- [Konfiguracja i setup](/pl/plugins/sdk-setup) — pakowanie, manifesty, schematy konfiguracji
- [Testowanie](/pl/plugins/sdk-testing) — narzędzia testowe i reguły lint
- [Migracja SDK](/pl/plugins/sdk-migration) — migracja z przestarzałych powierzchni
- [Wnętrze pluginów](/pl/plugins/architecture) — szczegółowa architektura i model możliwości
