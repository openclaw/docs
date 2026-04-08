---
read_when:
    - Musisz wiedzieć, z której ścieżki podrzędnej SDK importować
    - Chcesz uzyskać dokumentację referencyjną wszystkich metod rejestracji w `OpenClawPluginApi`
    - Szukasz konkretnego eksportu SDK
sidebarTitle: SDK Overview
summary: Mapa importów, dokumentacja referencyjna API rejestracji i architektura SDK
title: Przegląd Plugin SDK
x-i18n:
    generated_at: "2026-04-08T09:45:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e7b420eb0f3faa8916357d52df949f6c9a46f1c843a1e6a0c0b8bb26db6cbff
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Przegląd Plugin SDK

Plugin SDK to typowany kontrakt między pluginami a rdzeniem. Ta strona jest
dokumentacją referencyjną dla **tego, co importować** i **co można rejestrować**.

<Tip>
  **Szukasz przewodnika krok po kroku?**
  - Pierwszy plugin? Zacznij od [Wprowadzenia](/pl/plugins/building-plugins)
  - Plugin kanału? Zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins)
  - Plugin dostawcy? Zobacz [Pluginy dostawców](/pl/plugins/sdk-provider-plugins)
</Tip>

## Konwencja importów

Zawsze importuj z konkretnej ścieżki podrzędnej:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każda ścieżka podrzędna to mały, samodzielny moduł. Dzięki temu uruchamianie
jest szybkie i można uniknąć problemów z cyklicznymi zależnościami. W przypadku
pomocników wejścia/budowania specyficznych dla kanałów preferuj
`openclaw/plugin-sdk/channel-core`; zachowaj `openclaw/plugin-sdk/core` dla
szerszej powierzchni parasolowej i współdzielonych helperów, takich jak
`buildChannelConfigSchema`.

Nie dodawaj ani nie polegaj na wygodnych warstwach nazwanych od dostawców, takich jak
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` ani
warstwach helperów markowanych kanałem. Zestawione pluginy powinny składać
ogólne ścieżki podrzędne SDK we własnych barrelach `api.ts` lub `runtime-api.ts`, a rdzeń
powinien albo używać tych lokalnych barrelów pluginu, albo dodać wąski ogólny
kontrakt SDK, gdy potrzeba jest rzeczywiście międzykanałowa.

Wygenerowana mapa eksportów nadal zawiera mały zestaw warstw helperów
zestawionych pluginów, takich jak `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` i `plugin-sdk/matrix*`. Te
ścieżki podrzędne istnieją wyłącznie na potrzeby utrzymania i zgodności zestawionych pluginów;
celowo pominięto je w typowej tabeli poniżej i nie są zalecaną
ścieżką importu dla nowych pluginów zewnętrznych.

## Dokumentacja referencyjna ścieżek podrzędnych

Najczęściej używane ścieżki podrzędne, pogrupowane według przeznaczenia. Wygenerowana pełna lista
ponad 200 ścieżek podrzędnych znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`.

Zarezerwowane ścieżki podrzędne helperów zestawionych pluginów nadal pojawiają się na tej wygenerowanej liście.
Traktuj je jako szczegół implementacyjny/powierzchnie zgodności, chyba że dana strona dokumentacji
wyraźnie promuje którąś z nich jako publiczną.

### Wejście pluginu

| Ścieżka podrzędna           | Kluczowe eksporty                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                  |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                     |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                    |

<AccordionGroup>
  <Accordion title="Ścieżki podrzędne kanałów">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone helpery kreatora konfiguracji, prompty allowlist i kreatory statusu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpery konfiguracji/wielu kont/bramki akcji oraz helpery awaryjnego wyboru konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpery normalizacji identyfikatora konta |
    | `plugin-sdk/account-resolution` | Helpery wyszukiwania kont i awaryjnego wyboru domyślnego |
    | `plugin-sdk/account-helpers` | Wąskie helpery list kont/akcji na kontach |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typy schematu konfiguracji kanału |
    | `plugin-sdk/telegram-command-config` | Helpery normalizacji/walidacji niestandardowych poleceń Telegram z awaryjną obsługą kontraktu zestawionego |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Współdzielone helpery budowania tras przychodzących i kopert |
    | `plugin-sdk/inbound-reply-dispatch` | Współdzielone helpery zapisu i dyspozycji wiadomości przychodzących |
    | `plugin-sdk/messaging-targets` | Helpery parsowania/dopasowywania celów |
    | `plugin-sdk/outbound-media` | Współdzielone helpery ładowania mediów wychodzących |
    | `plugin-sdk/outbound-runtime` | Helpery tożsamości wychodzącej/delegowania wysyłki |
    | `plugin-sdk/thread-bindings-runtime` | Helpery cyklu życia i adapterów powiązań wątków |
    | `plugin-sdk/agent-media-payload` | Starszy kreator payloadów mediów agenta |
    | `plugin-sdk/conversation-runtime` | Powiązania konwersacji/wątków, parowanie i helpery skonfigurowanych powiązań |
    | `plugin-sdk/runtime-config-snapshot` | Helper migawki konfiguracji środowiska wykonawczego |
    | `plugin-sdk/runtime-group-policy` | Helpery rozstrzygania zasad grupowych środowiska wykonawczego |
    | `plugin-sdk/channel-status` | Współdzielone helpery migawek/podsumowań statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Helpery autoryzacji zapisu konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty preludium pluginów kanałów |
    | `plugin-sdk/allowlist-config-edit` | Helpery odczytu/edycji konfiguracji allowlist |
    | `plugin-sdk/group-access` | Współdzielone helpery decyzji o dostępie grupowym |
    | `plugin-sdk/direct-dm` | Współdzielone helpery uwierzytelniania/ochrony bezpośrednich DM |
    | `plugin-sdk/interactive-runtime` | Helpery normalizacji/redukcji payloadów odpowiedzi interaktywnych |
    | `plugin-sdk/channel-inbound` | Pomocniki debounce dla ruchu przychodzącego, dopasowywania wzmianek, zasad wzmianek i helpery kopert |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helpery parsowania/dopasowywania celów |
    | `plugin-sdk/channel-contract` | Typy kontraktu kanału |
    | `plugin-sdk/channel-feedback` | Łączenie informacji zwrotnych/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` oraz typy celów sekretów |
  </Accordion>

  <Accordion title="Ścieżki podrzędne dostawców">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratorowane helpery konfiguracji lokalnych/samohostowanych dostawców |
    | `plugin-sdk/self-hosted-provider-setup` | Skoncentrowane helpery konfiguracji samohostowanych dostawców zgodnych z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI + stałe watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpery rozstrzygania kluczy API w czasie działania dla pluginów dostawców |
    | `plugin-sdk/provider-auth-api-key` | Helpery onboardingu/zapisu profilu klucza API, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy kreator wyniku uwierzytelniania OAuth |
    | `plugin-sdk/provider-auth-login` | Współdzielone interaktywne helpery logowania dla pluginów dostawców |
    | `plugin-sdk/provider-env-vars` | Helpery wyszukiwania zmiennych środowiskowych uwierzytelniania dostawców |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone kreatory zasad powtórzeń, helpery punktów końcowych dostawców oraz helpery normalizacji identyfikatorów modeli, takie jak `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ogólne helpery HTTP/możliwości punktów końcowych dostawców |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie helpery kontraktu konfiguracji/wyboru web-fetch, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpery rejestracji/pamięci podręcznej dostawców web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Wąskie helpery konfiguracji/danych uwierzytelniających web-search dla dostawców, którzy nie potrzebują mechanizmu włączania pluginu |
    | `plugin-sdk/provider-web-search-contract` | Wąskie helpery kontraktu konfiguracji/danych uwierzytelniających web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowane settery/gettery danych uwierzytelniających |
    | `plugin-sdk/provider-web-search` | Helpery rejestracji/pamięci podręcznej/środowiska wykonawczego dostawców web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematów Gemini + diagnostyka oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` i podobne |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy opakowań strumieni oraz współdzielone helpery opakowań Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helpery łatania konfiguracji onboardingu |
    | `plugin-sdk/global-singleton` | Helpery singletonów/map/pamięci podręcznej lokalnych dla procesu |
  </Accordion>

  <Accordion title="Ścieżki podrzędne uwierzytelniania i bezpieczeństwa">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpery rejestru poleceń, helpery autoryzacji nadawcy |
    | `plugin-sdk/approval-auth-runtime` | Helpery rozstrzygania zatwierdzających i uwierzytelniania akcji w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Helpery profili/filtrów zatwierdzania dla natywnego wykonania |
    | `plugin-sdk/approval-delivery-runtime` | Adaptery możliwości/dostarczania natywnego zatwierdzania |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony helper rozstrzygania bramy zatwierdzania |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie helpery ładowania adapterów natywnego zatwierdzania dla gorących punktów wejścia kanałów |
    | `plugin-sdk/approval-handler-runtime` | Szersze helpery środowiska wykonawczego obsługi zatwierdzeń; gdy to wystarcza, preferuj węższe warstwy adapter/gateway |
    | `plugin-sdk/approval-native-runtime` | Helpery celów natywnego zatwierdzania + powiązań kont |
    | `plugin-sdk/approval-reply-runtime` | Helpery payloadów odpowiedzi zatwierdzeń exec/pluginów |
    | `plugin-sdk/command-auth-native` | Natywne helpery uwierzytelniania poleceń + helpery celów sesji natywnych |
    | `plugin-sdk/command-detection` | Współdzielone helpery wykrywania poleceń |
    | `plugin-sdk/command-surface` | Normalizacja treści poleceń i helpery powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery zbierania kontraktu sekretów dla powierzchni sekretów kanału/pluginu |
    | `plugin-sdk/secret-ref-runtime` | Wąskie helpery `coerceSecretRef` i typowania SecretRef do parsowania kontraktów sekretów/konfiguracji |
    | `plugin-sdk/security-runtime` | Współdzielone helpery zaufania, ograniczania DM, treści zewnętrznych i zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Helpery allowlist hostów i zasad SSRF dla sieci prywatnych |
    | `plugin-sdk/ssrf-runtime` | Helpery pinned-dispatcher, fetch chronionego przez SSRF i zasad SSRF |
    | `plugin-sdk/secret-input` | Helpery parsowania wejść sekretów |
    | `plugin-sdk/webhook-ingress` | Helpery żądań/celów webhooków |
    | `plugin-sdk/webhook-request-guards` | Helpery rozmiaru treści/timeoutów żądań |
  </Accordion>

  <Accordion title="Ścieżki podrzędne środowiska wykonawczego i przechowywania">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie helpery środowiska wykonawczego/logowania/kopii zapasowych/instalacji pluginów |
    | `plugin-sdk/runtime-env` | Wąskie helpery środowiska wykonawczego env, loggera, timeoutów, ponowień i backoff |
    | `plugin-sdk/channel-runtime-context` | Ogólne helpery rejestracji i wyszukiwania kontekstu środowiska wykonawczego kanału |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone helpery poleceń/hooków/HTTP/interaktywne pluginu |
    | `plugin-sdk/hook-runtime` | Współdzielone helpery potoku webhooków/wewnętrznych hooków |
    | `plugin-sdk/lazy-runtime` | Helpery opóźnionego importu/powiązań środowiska wykonawczego, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpery wykonywania procesów |
    | `plugin-sdk/cli-runtime` | Helpery formatowania CLI, oczekiwania i wersji |
    | `plugin-sdk/gateway-runtime` | Helpery klienta gateway i łatania statusu kanału |
    | `plugin-sdk/config-runtime` | Helpery ładowania/zapisu konfiguracji |
    | `plugin-sdk/telegram-command-config` | Normalizacja nazw/opisów poleceń Telegram oraz sprawdzanie duplikatów/konfliktów, nawet gdy powierzchnia kontraktu zestawionego Telegram jest niedostępna |
    | `plugin-sdk/approval-runtime` | Helpery zatwierdzeń exec/pluginów, kreatory możliwości zatwierdzania, helpery auth/profili, helpery natywnego routingu/środowiska wykonawczego |
    | `plugin-sdk/reply-runtime` | Współdzielone helpery środowiska wykonawczego ruchu przychodzącego/odpowiedzi, dzielenia, dyspozycji, heartbeat, planisty odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery dyspozycji/finalizacji odpowiedzi |
    | `plugin-sdk/reply-history` | Współdzielone helpery historii odpowiedzi dla krótkiego okna, takie jak `buildHistoryContext`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie helpery dzielenia tekstu/Markdown |
    | `plugin-sdk/session-store-runtime` | Helpery ścieżek magazynu sesji + `updated-at` |
    | `plugin-sdk/state-paths` | Helpery ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/routing` | Helpery tras/kluczy sesji/powiązań kont, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone helpery podsumowań statusu kanałów/kont, domyślne stany środowiska wykonawczego i helpery metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone helpery rozstrzygania celów |
    | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji slugów/ciągów |
    | `plugin-sdk/request-url` | Wyodrębnianie URL-i tekstowych z danych wejściowych typu fetch/request |
    | `plugin-sdk/run-command` | Uruchamianie poleceń z limitem czasu i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Typowe czytniki parametrów narzędzi/CLI |
    | `plugin-sdk/tool-payload` | Wyodrębnianie znormalizowanych payloadów z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzi |
    | `plugin-sdk/temp-path` | Współdzielone helpery ścieżek tymczasowego pobierania |
    | `plugin-sdk/logging-core` | Helpery loggera podsystemu i redakcji |
    | `plugin-sdk/markdown-table-runtime` | Helpery trybu tabel Markdown |
    | `plugin-sdk/json-store` | Małe helpery odczytu/zapisu stanu JSON |
    | `plugin-sdk/file-lock` | Helpery re-entrant file-lock |
    | `plugin-sdk/persistent-dedupe` | Helpery pamięci podręcznej deduplikacji na dysku |
    | `plugin-sdk/acp-runtime` | Helpery środowiska wykonawczego/sesji ACP i dyspozycji odpowiedzi |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji środowiska wykonawczego agenta |
    | `plugin-sdk/boolean-param` | Czytnik parametrów luźnych wartości logicznych |
    | `plugin-sdk/dangerous-name-runtime` | Helpery rozstrzygania dopasowań niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Helpery bootstrapu urządzenia i tokenów parowania |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy helperów kanałów pasywnych, statusu i ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Helpery odpowiedzi polecenia `/models` i dostawców |
    | `plugin-sdk/skill-commands-runtime` | Helpery listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Helpery rejestru/budowania/serializacji natywnych poleceń |
    | `plugin-sdk/provider-zai-endpoint` | Helpery wykrywania punktów końcowych Z.AI |
    | `plugin-sdk/infra-runtime` | Helpery zdarzeń systemowych/heartbeat |
    | `plugin-sdk/collection-runtime` | Małe helpery ograniczonej pamięci podręcznej |
    | `plugin-sdk/diagnostic-runtime` | Helpery flag i zdarzeń diagnostycznych |
    | `plugin-sdk/error-runtime` | Graf błędów, formatowanie, współdzielone helpery klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Opakowany fetch, proxy i helpery pinned lookup |
    | `plugin-sdk/host-runtime` | Helpery normalizacji nazw hostów i hostów SCP |
    | `plugin-sdk/retry-runtime` | Helpery konfiguracji ponowień i uruchamiania ponowień |
    | `plugin-sdk/agent-runtime` | Helpery katalogów/tożsamości/obszarów roboczych agenta |
    | `plugin-sdk/directory-runtime` | Zapytania/deduplikacja katalogów na podstawie konfiguracji |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Ścieżki podrzędne możliwości i testowania">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Współdzielone helpery pobierania/przekształcania/przechowywania mediów oraz kreatory payloadów mediów |
    | `plugin-sdk/media-generation-runtime` | Współdzielone helpery failover generowania mediów, wybór kandydatów i komunikaty o brakujących modelach |
    | `plugin-sdk/media-understanding` | Typy dostawców rozumienia mediów oraz eksporty helperów obrazu/audio skierowane do dostawców |
    | `plugin-sdk/text-runtime` | Współdzielone helpery tekstu/Markdown/logowania, takie jak usuwanie tekstu widocznego dla asystenta, renderowanie/dzielenie/tabele Markdown, helpery redakcji, helpery tagów dyrektyw i narzędzia bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Helper dzielenia tekstu wychodzącego |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz helpery dyrektyw, rejestru i walidacji skierowane do dostawców |
    | `plugin-sdk/speech-core` | Współdzielone typy dostawców mowy, rejestr, dyrektywy i helpery normalizacji |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji w czasie rzeczywistym i helpery rejestru |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu w czasie rzeczywistym i helpery rejestru |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów |
    | `plugin-sdk/image-generation-core` | Współdzielone typy generowania obrazów, helpery failover, auth i rejestru |
    | `plugin-sdk/music-generation` | Typy dostawców/żądań/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Współdzielone typy generowania muzyki, helpery failover, wyszukiwanie dostawców i parsowanie model-ref |
    | `plugin-sdk/video-generation` | Typy dostawców/żądań/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo, helpery failover, wyszukiwanie dostawców i parsowanie model-ref |
    | `plugin-sdk/webhook-targets` | Rejestr celów webhooków i helpery instalacji tras |
    | `plugin-sdk/webhook-path` | Helpery normalizacji ścieżek webhooków |
    | `plugin-sdk/web-media` | Współdzielone helpery ładowania zdalnych/lokalnych mediów |
    | `plugin-sdk/zod` | Reeksport `zod` dla odbiorców Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Ścieżki podrzędne pamięci">
    | Ścieżka podrzędna | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Powierzchnia helperów zestawionego memory-core dla helperów managera/konfiguracji/plików/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada środowiska wykonawczego indeksowania/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika fundamentów hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Eksporty silnika embeddingów hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika przechowywania hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Helpery multimodalne hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Helpery dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-core-host-status` | Helpery statusu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpery środowiska wykonawczego CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpery głównego środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny wobec dostawcy alias dla helperów głównego środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny wobec dostawcy alias dla helperów dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Neutralny wobec dostawcy alias dla helperów plików/środowiska wykonawczego hosta pamięci |
    | `plugin-sdk/memory-host-markdown` | Współdzielone helpery managed-markdown dla pluginów powiązanych z pamięcią |
    | `plugin-sdk/memory-host-search` | Aktywna fasada środowiska wykonawczego pamięci do dostępu do search-manager |
    | `plugin-sdk/memory-host-status` | Neutralny wobec dostawcy alias dla helperów statusu hosta pamięci |
    | `plugin-sdk/memory-lancedb` | Powierzchnia helperów zestawionego memory-lancedb |
  </Accordion>

  <Accordion title="Zarezerwowane ścieżki podrzędne zestawionych helperów">
    | Rodzina | Bieżące ścieżki podrzędne | Zamierzone użycie |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpery wsparcia zestawionego pluginu browser (`browser-support` pozostaje barrelem zgodności) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Powierzchnia helperów/środowiska wykonawczego zestawionego Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Powierzchnia helperów/środowiska wykonawczego zestawionego LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Powierzchnia helperów zestawionego IRC |
    | Helpery specyficzne dla kanałów | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Warstwy zgodności/helperów zestawionych kanałów |
    | Helpery specyficzne dla auth/pluginów | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Warstwy helperów zestawionych funkcji/pluginów; `plugin-sdk/github-copilot-token` obecnie eksportuje `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` i `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API rejestracji

Callback `register(api)` otrzymuje obiekt `OpenClawPluginApi` z tymi
metodami:

### Rejestracja możliwości

| Metoda                                           | Co rejestruje                  |
| ------------------------------------------------ | ------------------------------ |
| `api.registerProvider(...)`                      | Wnioskowanie tekstowe (LLM)    |
| `api.registerCliBackend(...)`                    | Lokalny backend wnioskowania CLI |
| `api.registerChannel(...)`                       | Kanał wiadomości               |
| `api.registerSpeechProvider(...)`                | Synteza text-to-speech / STT   |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniowa transkrypcja w czasie rzeczywistym |
| `api.registerRealtimeVoiceProvider(...)`         | Dwukierunkowe sesje głosowe w czasie rzeczywistym |
| `api.registerMediaUnderstandingProvider(...)`    | Analiza obrazu/audio/wideo     |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów            |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki             |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo              |
| `api.registerWebFetchProvider(...)`              | Dostawca web fetch / scrapingu |
| `api.registerWebSearchProvider(...)`             | Web search                     |

### Narzędzia i polecenia

| Metoda                          | Co rejestruje                                 |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane lub `{ optional: true }`) |
| `api.registerCommand(def)`      | Niestandardowe polecenie (omija LLM)          |

### Infrastruktura

| Metoda                                         | Co rejestruje                    |
| ---------------------------------------------- | -------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook zdarzeń                     |
| `api.registerHttpRoute(params)`                | Punkt końcowy HTTP gateway       |
| `api.registerGatewayMethod(name, handler)`     | Metoda RPC gateway               |
| `api.registerCli(registrar, opts?)`            | Podpolecenie CLI                 |
| `api.registerService(service)`                 | Usługa działająca w tle          |
| `api.registerInteractiveHandler(registration)` | Handler interaktywny             |
| `api.registerMemoryPromptSupplement(builder)`  | Dodatkowa sekcja promptu związana z pamięcią |
| `api.registerMemoryCorpusSupplement(adapter)`  | Dodatkowy korpus wyszukiwania/odczytu pamięci |

Zarezerwowane przestrzenie nazw administracyjnych rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze pozostają `operator.admin`, nawet jeśli plugin próbuje przypisać
węższy zakres metod gateway. Dla metod należących do pluginu preferuj
prefiksy specyficzne dla pluginu.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` przyjmuje dwa rodzaje metadanych najwyższego poziomu:

- `commands`: jawne korzenie poleceń należące do rejestratora
- `descriptors`: deskryptory poleceń w czasie parsowania używane dla głównej pomocy CLI,
  routingu i leniwej rejestracji CLI pluginów

Jeśli chcesz, aby polecenie pluginu pozostało ładowane leniwie w normalnej ścieżce głównego CLI,
podaj `descriptors`, które obejmują każdy korzeń polecenia najwyższego poziomu udostępniany przez ten
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

Używaj samego `commands` tylko wtedy, gdy nie potrzebujesz leniwej rejestracji głównego CLI.
Ta ścieżka zgodności z eager loading pozostaje wspierana, ale nie instaluje
placeholderów opartych na descriptorach dla leniwego ładowania w czasie parsowania.

### Rejestracja backendu CLI

`api.registerCliBackend(...)` pozwala pluginowi posiadać domyślną konfigurację lokalnego
backendu CLI AI, takiego jak `codex-cli`.

- `id` backendu staje się prefiksem dostawcy w odwołaniach do modeli, takich jak `codex-cli/gpt-5`.
- `config` backendu używa tego samego kształtu co `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal ma pierwszeństwo. OpenClaw scala `agents.defaults.cliBackends.<id>` z
  domyślną konfiguracją pluginu przed uruchomieniem CLI.
- Użyj `normalizeConfig`, gdy backend potrzebuje przekształceń zgodności po scaleniu
  (na przykład normalizacji starych kształtów flag).

### Sloty wyłączne

| Metoda                                     | Co rejestruje                                                                                                                                         |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (aktywny tylko jeden naraz). Callback `assemble()` otrzymuje `availableTools` i `citationsMode`, aby silnik mógł dostosować dodatki do promptu. |
| `api.registerMemoryCapability(capability)` | Ujednolicona możliwość pamięci                                                                                                                        |
| `api.registerMemoryPromptSection(builder)` | Kreator sekcji promptu pamięci                                                                                                                        |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu opróżniania pamięci                                                                                                                    |
| `api.registerMemoryRuntime(runtime)`       | Adapter środowiska wykonawczego pamięci                                                                                                               |

### Adaptery embeddingów pamięci

| Metoda                                         | Co rejestruje                              |
| ---------------------------------------------- | ------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embeddingów pamięci dla aktywnego pluginu |

- `registerMemoryCapability` to preferowane wyłączne API pluginów pamięci.
- `registerMemoryCapability` może także udostępniać `publicArtifacts.listArtifacts(...)`,
  aby pluginy towarzyszące mogły korzystać z eksportowanych artefaktów pamięci przez
  `openclaw/plugin-sdk/memory-host-core` zamiast sięgać do prywatnego
  układu konkretnego pluginu pamięci.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` i
  `registerMemoryRuntime` to starsze, nadal zgodne wyłączne API pluginów pamięci.
- `registerMemoryEmbeddingProvider` pozwala aktywnemu pluginowi pamięci zarejestrować jeden
  lub więcej identyfikatorów adapterów embeddingów (na przykład `openai`, `gemini` lub własny identyfikator zdefiniowany przez plugin).
- Konfiguracja użytkownika, taka jak `agents.defaults.memorySearch.provider` i
  `agents.defaults.memorySearch.fallback`, jest rozstrzygana względem tych zarejestrowanych
  identyfikatorów adapterów.

### Zdarzenia i cykl życia

| Metoda                                       | Co robi                       |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Typowany hook cyklu życia     |
| `api.onConversationBindingResolved(handler)` | Callback rozwiązania powiązania konwersacji |

### Semantyka decyzji hooków

- `before_tool_call`: zwrócenie `{ block: true }` jest końcowe. Gdy którykolwiek handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest końcowe. Gdy którykolwiek handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest końcowe. Gdy którykolwiek handler przejmie dyspozycję, handlery o niższym priorytecie i domyślna ścieżka dyspozycji modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest końcowe. Gdy którykolwiek handler to ustawi, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.

### Pola obiektu API

| Pole                    | Typ                       | Opis                                                                                       |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------ |
| `api.id`                 | `string`                  | Identyfikator pluginu                                                                      |
| `api.name`               | `string`                  | Nazwa wyświetlana                                                                          |
| `api.version`            | `string?`                 | Wersja pluginu (opcjonalna)                                                                |
| `api.description`        | `string?`                 | Opis pluginu (opcjonalny)                                                                  |
| `api.source`             | `string`                  | Ścieżka źródłowa pluginu                                                                   |
| `api.rootDir`            | `string?`                 | Katalog główny pluginu (opcjonalny)                                                        |
| `api.config`             | `OpenClawConfig`          | Bieżąca migawka konfiguracji (aktywna migawka środowiska wykonawczego w pamięci, gdy jest dostępna) |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfiguracja specyficzna dla pluginu z `plugins.entries.<id>.config`                       |
| `api.runtime`            | `PluginRuntime`           | [Helpery środowiska wykonawczego](/pl/plugins/sdk-runtime)                                    |
| `api.logger`             | `PluginLogger`            | Logger z zakresem (`debug`, `info`, `warn`, `error`)                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno uruchamiania/konfiguracji przed pełnym wejściem |
| `api.resolvePath(input)` | `(string) => string`      | Rozwiązywanie ścieżki względem katalogu głównego pluginu                                   |

## Wewnętrzna konwencja modułów

Wewnątrz pluginu używaj lokalnych plików barrel dla importów wewnętrznych:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Nigdy nie importuj własnego pluginu przez `openclaw/plugin-sdk/<your-plugin>`
  z kodu produkcyjnego. Kieruj importy wewnętrzne przez `./api.ts` lub
  `./runtime-api.ts`. Ścieżka SDK jest wyłącznie kontraktem zewnętrznym.
</Warning>

Powierzchnie publiczne zestawionych pluginów ładowane przez fasady (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` i podobne publiczne pliki wejściowe) teraz preferują
aktywną migawkę konfiguracji środowiska wykonawczego, gdy OpenClaw już działa. Jeśli migawka środowiska
wykonawczego jeszcze nie istnieje, wracają do rozstrzygniętego pliku konfiguracji na dysku.

Pluginy dostawców mogą również udostępniać wąski lokalny barrel kontraktu pluginu, gdy helper
jest celowo specyficzny dla dostawcy i jeszcze nie należy do ogólnej ścieżki podrzędnej SDK.
Bieżący zestawiony przykład: dostawca Anthropic przechowuje helpery strumieni Claude
we własnej publicznej warstwie `api.ts` / `contract-api.ts`, zamiast promować logikę
nagłówków beta Anthropic i `service_tier` do ogólnego kontraktu
`plugin-sdk/*`.

Inne bieżące zestawione przykłady:

- `@openclaw/openai-provider`: `api.ts` eksportuje kreatory dostawców,
  helpery modeli domyślnych i kreatory dostawców realtime
- `@openclaw/openrouter-provider`: `api.ts` eksportuje kreator dostawcy oraz
  helpery onboardingu/konfiguracji

<Warning>
  Kod produkcyjny rozszerzeń powinien również unikać importów `openclaw/plugin-sdk/<other-plugin>`.
  Jeśli helper jest rzeczywiście współdzielony, przenieś go do neutralnej ścieżki podrzędnej SDK,
  takiej jak `openclaw/plugin-sdk/speech`, `.../provider-model-shared` lub innej
  powierzchni zorientowanej na możliwości, zamiast wiązać dwa pluginy ze sobą.
</Warning>

## Powiązane

- [Punkty wejścia](/pl/plugins/sdk-entrypoints) — opcje `definePluginEntry` i `defineChannelPluginEntry`
- [Helpery środowiska wykonawczego](/pl/plugins/sdk-runtime) — pełna dokumentacja referencyjna przestrzeni nazw `api.runtime`
- [Konfiguracja i config](/pl/plugins/sdk-setup) — pakowanie, manifesty, schematy konfiguracji
- [Testowanie](/pl/plugins/sdk-testing) — narzędzia testowe i reguły lint
- [Migracja SDK](/pl/plugins/sdk-migration) — migracja z przestarzałych powierzchni
- [Wnętrze pluginów](/pl/plugins/architecture) — szczegółowa architektura i model możliwości
