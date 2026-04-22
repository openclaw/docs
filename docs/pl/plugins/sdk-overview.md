---
read_when:
    - Musisz wiedzieć, z której podścieżki SDK importować
    - Potrzebujesz dokumentacji wszystkich metod rejestracji w OpenClawPluginApi
    - Szukasz konkretnego eksportu SDK
sidebarTitle: SDK Overview
summary: Mapa importów, dokumentacja interfejsu API rejestracji i architektura SDK
title: Omówienie Plugin SDK
x-i18n:
    generated_at: "2026-04-22T09:52:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: e57019e6f9a7fed7842ac575e025b6db41d125f5fa9d0d1de03923fdb1f6bcc3
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Omówienie Plugin SDK

SDK Pluginów to typowany kontrakt między Pluginami a rdzeniem. Ta strona jest
dokumentacją referencyjną dotyczącą **tego, co importować** i **co można zarejestrować**.

<Tip>
  **Szukasz przewodnika krok po kroku?**
  - Pierwszy Plugin? Zacznij od [Pierwsze kroki](/pl/plugins/building-plugins)
  - Plugin kanału? Zobacz [Pluginy kanałów](/pl/plugins/sdk-channel-plugins)
  - Plugin dostawcy? Zobacz [Pluginy dostawców](/pl/plugins/sdk-provider-plugins)
</Tip>

## Konwencja importu

Zawsze importuj z konkretnej podścieżki:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każda podścieżka jest małym, samodzielnym modułem. Dzięki temu uruchamianie jest szybkie
i zapobiega to problemom z cyklicznymi zależnościami. W przypadku helperów punktu wejścia/budowania specyficznych dla kanałów
preferuj `openclaw/plugin-sdk/channel-core`; zostaw `openclaw/plugin-sdk/core` dla
szerszej powierzchni zbiorczej i współdzielonych helperów, takich jak
`buildChannelConfigSchema`.

Nie dodawaj ani nie zależ od pomocniczych interfejsów nazwanych od dostawców, takich jak
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` ani
interfejsów pomocniczych oznaczonych marką kanału. Dołączone Pluginy powinny składać ogólne
podścieżki SDK we własnych plikach barrel `api.ts` lub `runtime-api.ts`, a rdzeń
powinien albo używać tych lokalnych barrelów Pluginu, albo dodać wąski ogólny kontrakt SDK,
gdy potrzeba rzeczywiście dotyczy wielu kanałów.

Wygenerowana mapa eksportów nadal zawiera mały zestaw pomocniczych
interfejsów dołączonych Pluginów, takich jak `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` i `plugin-sdk/matrix*`. Te
podścieżki istnieją wyłącznie na potrzeby utrzymania dołączonych Pluginów i zgodności; zostały
celowo pominięte w typowej tabeli poniżej i nie są zalecaną
ścieżką importu dla nowych zewnętrznych Pluginów.

## Dokumentacja podścieżek

Najczęściej używane podścieżki, pogrupowane według przeznaczenia. Wygenerowana pełna lista
ponad 200 podścieżek znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`.

Zarezerwowane pomocnicze podścieżki dołączonych Pluginów nadal pojawiają się na tej wygenerowanej liście.
Traktuj je jako powierzchnie implementacyjne/zgodności, chyba że jakaś strona dokumentacji
wyraźnie promuje jedną z nich jako publiczną.

### Punkt wejścia Pluginu

| Podścieżka                | Kluczowe eksporty                                                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry` | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | Eksport schematu Zod głównego `openclaw.json` (`OpenClawSchema`)                                                                    |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                    |

<AccordionGroup>
  <Accordion title="Podścieżki kanałów">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport schematu Zod głównego `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, a także `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone helpery kreatora konfiguracji, prompty allowlist i konstruktory stanu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpery konfiguracji wielu kont/bramek działań oraz helpery awaryjnego przełączania na konto domyślne |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpery normalizacji identyfikatorów kont |
    | `plugin-sdk/account-resolution` | Helpery wyszukiwania kont i awaryjnego przełączania na wartości domyślne |
    | `plugin-sdk/account-helpers` | Wąskie helpery list działań na kontach/list kont |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typy schematu konfiguracji kanałów |
    | `plugin-sdk/telegram-command-config` | Helpery normalizacji/walidacji niestandardowych poleceń Telegram z awaryjnym przejściem na kontrakt dołączony |
    | `plugin-sdk/command-gating` | Wąskie helpery bramek autoryzacji poleceń |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, helpery cyklu życia/finalizacji strumienia roboczego |
    | `plugin-sdk/inbound-envelope` | Współdzielone helpery tras przychodzących i budowania envelope |
    | `plugin-sdk/inbound-reply-dispatch` | Współdzielone helpery rejestrowania i dyspozycji odpowiedzi przychodzących |
    | `plugin-sdk/messaging-targets` | Helpery parsowania/dopasowywania celów |
    | `plugin-sdk/outbound-media` | Współdzielone helpery ładowania mediów wychodzących |
    | `plugin-sdk/outbound-runtime` | Helpery tożsamości wychodzącej, delegata wysyłania i planowania ładunków |
    | `plugin-sdk/poll-runtime` | Wąskie helpery normalizacji ankiet |
    | `plugin-sdk/thread-bindings-runtime` | Helpery cyklu życia i adapterów powiązań wątków |
    | `plugin-sdk/agent-media-payload` | Starszy konstruktor ładunku mediów agenta |
    | `plugin-sdk/conversation-runtime` | Helpery powiązań rozmów/wątków, parowania i skonfigurowanych powiązań |
    | `plugin-sdk/runtime-config-snapshot` | Helper zrzutu konfiguracji środowiska uruchomieniowego |
    | `plugin-sdk/runtime-group-policy` | Helpery rozstrzygania polityki grup środowiska uruchomieniowego |
    | `plugin-sdk/channel-status` | Współdzielone helpery migawki/podsumowania stanu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanałów |
    | `plugin-sdk/channel-config-writes` | Helpery autoryzacji zapisu konfiguracji kanałów |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty prelude dla Pluginów kanałów |
    | `plugin-sdk/allowlist-config-edit` | Helpery odczytu/edycji konfiguracji allowlist |
    | `plugin-sdk/group-access` | Współdzielone helpery decyzji dostępu grupowego |
    | `plugin-sdk/direct-dm` | Współdzielone helpery autoryzacji/ochrony bezpośrednich DM |
    | `plugin-sdk/interactive-runtime` | Semantyczna prezentacja wiadomości, dostarczanie i starsze helpery odpowiedzi interaktywnych. Zobacz [Prezentacja wiadomości](/pl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel zgodności dla helperów debounce wejścia, dopasowania wzmianek, polityki wzmianek i envelope |
    | `plugin-sdk/channel-mention-gating` | Wąskie helpery polityki wzmianek bez szerszej powierzchni runtime wejścia |
    | `plugin-sdk/channel-location` | Helpery kontekstu i formatowania lokalizacji kanału |
    | `plugin-sdk/channel-logging` | Helpery logowania kanałów dla odrzuceń wejścia i błędów pisania/potwierdzeń |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | Helpery akcji na wiadomościach kanału oraz przestarzałe helpery natywnego schematu zachowane dla zgodności Pluginów |
    | `plugin-sdk/channel-targets` | Helpery parsowania/dopasowywania celów |
    | `plugin-sdk/channel-contract` | Typy kontraktu kanału |
    | `plugin-sdk/channel-feedback` | Podłączanie informacji zwrotnych/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` i typy docelowe sekretów |
  </Accordion>

  <Accordion title="Podścieżki dostawców">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Dobrane helpery konfiguracji lokalnych/self-hosted dostawców |
    | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane helpery konfiguracji dostawców self-hosted zgodnych z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI i stałe watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpery rozstrzygania kluczy API runtime dla Pluginów dostawców |
    | `plugin-sdk/provider-auth-api-key` | Helpery wdrażania/zapisu profilu klucza API, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy konstruktor wyniku autoryzacji OAuth |
    | `plugin-sdk/provider-auth-login` | Współdzielone helpery interaktywnego logowania dla Pluginów dostawców |
    | `plugin-sdk/provider-env-vars` | Helpery wyszukiwania zmiennych środowiskowych autoryzacji dostawców |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory polityki replay, helpery endpointów dostawców i helpery normalizacji identyfikatorów modeli, takie jak `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ogólne helpery HTTP/obsługi endpointów dostawców |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie helpery kontraktu konfiguracji/wyboru web fetch, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Helpery rejestracji/pamięci podręcznej dostawcy web fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Wąskie helpery konfiguracji/poświadczeń web search dla dostawców, którzy nie potrzebują logiki włączania Pluginu |
    | `plugin-sdk/provider-web-search-contract` | Wąskie helpery kontraktu konfiguracji/poświadczeń web search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowane settery/gettery poświadczeń |
    | `plugin-sdk/provider-web-search` | Helpery rejestracji/pamięci podręcznej/runtime dostawcy web search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematu Gemini + diagnostyka oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` i podobne |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni i współdzielone helpery wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Natywne helpery transportu dostawców, takie jak guarded fetch, transformacje komunikatów transportowych i zapisywalne strumienie zdarzeń transportowych |
    | `plugin-sdk/provider-onboard` | Helpery łatek konfiguracji wdrażania |
    | `plugin-sdk/global-singleton` | Helpery singletonów/map/pamięci podręcznej lokalnych dla procesu |
  </Accordion>

  <Accordion title="Podścieżki autoryzacji i bezpieczeństwa">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpery rejestru poleceń, helpery autoryzacji nadawcy |
    | `plugin-sdk/command-status` | Konstruktory komunikatów poleceń/pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Helpery rozstrzygania zatwierdzających i autoryzacji działań w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Natywne helpery profili/filtrów zatwierdzania wykonania |
    | `plugin-sdk/approval-delivery-runtime` | Natywne adaptery możliwości/dostarczania zatwierdzeń |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony helper rozstrzygania Gateway dla zatwierdzeń |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie helpery ładowania natywnych adapterów zatwierdzeń dla gorących punktów wejścia kanałów |
    | `plugin-sdk/approval-handler-runtime` | Szersze helpery runtime obsługi zatwierdzeń; preferuj węższe interfejsy adaptera/Gateway, gdy są wystarczające |
    | `plugin-sdk/approval-native-runtime` | Natywne helpery celu zatwierdzeń i powiązań kont |
    | `plugin-sdk/approval-reply-runtime` | Helpery ładunku odpowiedzi dla zatwierdzeń wykonania/Pluginów |
    | `plugin-sdk/command-auth-native` | Natywna autoryzacja poleceń i natywne helpery celu sesji |
    | `plugin-sdk/command-detection` | Współdzielone helpery wykrywania poleceń |
    | `plugin-sdk/command-surface` | Helpery normalizacji treści poleceń i powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąskie helpery zbierania kontraktów sekretów dla powierzchni sekretów kanałów/Pluginów |
    | `plugin-sdk/secret-ref-runtime` | Wąskie helpery `coerceSecretRef` i typowania SecretRef do parsowania kontraktów sekretów/konfiguracji |
    | `plugin-sdk/security-runtime` | Współdzielone helpery zaufania, bramek DM, treści zewnętrznych i zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Helpery allowlist hostów i polityki SSRF dla sieci prywatnych |
    | `plugin-sdk/ssrf-dispatcher` | Wąskie helpery pinned-dispatcher bez szerokiej powierzchni runtime infrastruktury |
    | `plugin-sdk/ssrf-runtime` | Helpery pinned-dispatcher, fetch chronionego przez SSRF i polityki SSRF |
    | `plugin-sdk/secret-input` | Helpery parsowania wejścia sekretów |
    | `plugin-sdk/webhook-ingress` | Helpery żądań/celów Webhook |
    | `plugin-sdk/webhook-request-guards` | Helpery rozmiaru treści żądania/timeoutów |
  </Accordion>

  <Accordion title="Podścieżki runtime i przechowywania">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie helpery runtime/logowania/kopii zapasowych/instalacji Pluginów |
    | `plugin-sdk/runtime-env` | Wąskie helpery środowiska runtime, loggera, timeoutów, ponawiania prób i backoff |
    | `plugin-sdk/channel-runtime-context` | Ogólne helpery rejestracji i wyszukiwania kontekstu runtime kanałów |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone helpery poleceń/hooków/http/interaktywne dla Pluginów |
    | `plugin-sdk/hook-runtime` | Współdzielone helpery pipeline Webhooków/hooków wewnętrznych |
    | `plugin-sdk/lazy-runtime` | Helpery leniwego importu/powiązań runtime, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpery wykonywania procesów |
    | `plugin-sdk/cli-runtime` | Helpery formatowania CLI, oczekiwania i wersji |
    | `plugin-sdk/gateway-runtime` | Helpery klienta Gateway i łatek stanu kanałów |
    | `plugin-sdk/config-runtime` | Helpery ładowania/zapisu konfiguracji |
    | `plugin-sdk/telegram-command-config` | Helpery normalizacji nazw/opisów poleceń Telegram oraz sprawdzania duplikatów/konfliktów, nawet gdy dołączona powierzchnia kontraktu Telegram jest niedostępna |
    | `plugin-sdk/text-autolink-runtime` | Wykrywanie autolinków odwołań do plików bez szerokiego barrel `text-runtime` |
    | `plugin-sdk/approval-runtime` | Helpery zatwierdzeń wykonania/Pluginów, konstruktory możliwości zatwierdzeń, helpery autoryzacji/profili, natywne helpery routingu/runtime |
    | `plugin-sdk/reply-runtime` | Współdzielone helpery runtime dla wejścia/odpowiedzi, dzielenie na fragmenty, dyspozycja, Heartbeat, planer odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery dyspozycji/finalizacji odpowiedzi |
    | `plugin-sdk/reply-history` | Współdzielone helpery historii odpowiedzi dla krótkiego okna czasowego, takie jak `buildHistoryContext`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie helpery dzielenia tekstu/Markdown na fragmenty |
    | `plugin-sdk/session-store-runtime` | Helpery ścieżek session store i `updated-at` |
    | `plugin-sdk/state-paths` | Helpery ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/routing` | Helpery routingu/powiązań klucza sesji/konta, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone helpery podsumowania stanu kanałów/kont, domyślne wartości stanu runtime i helpery metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone helpery rozstrzygania celów |
    | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji slugów/ciągów |
    | `plugin-sdk/request-url` | Wyodrębnianie tekstowych URL-i z danych wejściowych podobnych do fetch/request |
    | `plugin-sdk/run-command` | Runner poleceń z limitem czasu i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Typowe czytniki parametrów narzędzi/CLI |
    | `plugin-sdk/tool-payload` | Wyodrębnianie znormalizowanych ładunków z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzi |
    | `plugin-sdk/temp-path` | Współdzielone helpery ścieżek tymczasowego pobierania |
    | `plugin-sdk/logging-core` | Helpery loggera podsystemów i redakcji danych |
    | `plugin-sdk/markdown-table-runtime` | Helpery trybu tabel Markdown |
    | `plugin-sdk/json-store` | Małe helpery odczytu/zapisu stanu JSON |
    | `plugin-sdk/file-lock` | Helpery reentrant file-lock |
    | `plugin-sdk/persistent-dedupe` | Helpery pamięci podręcznej deduplikacji opartej na dysku |
    | `plugin-sdk/acp-runtime` | Helpery runtime/sesji ACP i dyspozycji odpowiedzi |
    | `plugin-sdk/acp-binding-resolve-runtime` | Rozstrzyganie powiązań ACP tylko do odczytu bez importów uruchamiania cyklu życia |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji runtime agentów |
    | `plugin-sdk/boolean-param` | Tolerancyjny czytnik parametrów logicznych |
    | `plugin-sdk/dangerous-name-runtime` | Helpery rozstrzygania dopasowań niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Helpery bootstrapu urządzenia i tokenów parowania |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy helperów kanałów pasywnych, stanu i ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Helpery odpowiedzi polecenia `/models` i dostawców |
    | `plugin-sdk/skill-commands-runtime` | Helpery listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Natywne helpery rejestru/budowania/serializacji poleceń |
    | `plugin-sdk/agent-harness` | Eksperymentalna powierzchnia zaufanych Pluginów dla niskopoziomowych harnessów agentów: typy harnessów, helpery sterowania/przerywania aktywnego uruchomienia, helpery mostka narzędzi OpenClaw i narzędzia wyników prób |
    | `plugin-sdk/provider-zai-endpoint` | Helpery wykrywania endpointów Z.A.I |
    | `plugin-sdk/infra-runtime` | Helpery zdarzeń systemowych/Heartbeat |
    | `plugin-sdk/collection-runtime` | Małe helpery ograniczonej pamięci podręcznej |
    | `plugin-sdk/diagnostic-runtime` | Helpery flag diagnostycznych i zdarzeń |
    | `plugin-sdk/error-runtime` | Graf błędów, formatowanie, współdzielone helpery klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Opakowany fetch, proxy i helpery pinned lookup |
    | `plugin-sdk/runtime-fetch` | Fetch runtime uwzględniający dispatcher bez importów proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Ograniczony czytnik treści odpowiedzi bez szerokiej powierzchni runtime mediów |
    | `plugin-sdk/session-binding-runtime` | Bieżący stan powiązania rozmowy bez routingu skonfigurowanych powiązań lub magazynów parowania |
    | `plugin-sdk/session-store-runtime` | Helpery odczytu session store bez szerokich importów zapisu/utrzymania konfiguracji |
    | `plugin-sdk/context-visibility-runtime` | Rozstrzyganie widoczności kontekstu i filtrowanie kontekstu uzupełniającego bez szerokich importów konfiguracji/bezpieczeństwa |
    | `plugin-sdk/string-coerce-runtime` | Wąskie helpery wymuszania i normalizacji rekordów/prymitywów tekstowych bez importów markdown/logowania |
    | `plugin-sdk/host-runtime` | Helpery normalizacji nazw hostów i hostów SCP |
    | `plugin-sdk/retry-runtime` | Helpery konfiguracji ponawiania prób i runnera ponowień |
    | `plugin-sdk/agent-runtime` | Helpery katalogów/tożsamości/obszarów roboczych agentów |
    | `plugin-sdk/directory-runtime` | Zapytania do katalogów oparte na konfiguracji/deduplikacja |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Podścieżki możliwości i testowania">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Współdzielone helpery pobierania/przekształcania/przechowywania mediów oraz konstruktory ładunków mediów |
    | `plugin-sdk/media-generation-runtime` | Współdzielone helpery failover generowania mediów, wybór kandydatów i komunikaty o brakujących modelach |
    | `plugin-sdk/media-understanding` | Typy dostawców rozumienia mediów oraz eksporty helperów obrazów/audio dla dostawców |
    | `plugin-sdk/text-runtime` | Współdzielone helpery tekstu/Markdown/logowania, takie jak usuwanie tekstu widocznego dla asystenta, helpery renderowania/dzielenia/tabel Markdown, helpery redakcji, helpery tagów dyrektyw i narzędzia bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Helper dzielenia wychodzącego tekstu na fragmenty |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz helpery dyrektyw, rejestru i walidacji dla dostawców |
    | `plugin-sdk/speech-core` | Współdzielone typy dostawców mowy oraz helpery rejestru, dyrektyw i normalizacji |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji w czasie rzeczywistym i helpery rejestru |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu w czasie rzeczywistym i helpery rejestru |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów |
    | `plugin-sdk/image-generation-core` | Współdzielone typy generowania obrazów oraz helpery failover, autoryzacji i rejestru |
    | `plugin-sdk/music-generation` | Typy dostawców/żądań/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Współdzielone typy generowania muzyki oraz helpery failover, wyszukiwania dostawców i parsowania model-ref |
    | `plugin-sdk/video-generation` | Typy dostawców/żądań/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo oraz helpery failover, wyszukiwania dostawców i parsowania model-ref |
    | `plugin-sdk/webhook-targets` | Rejestr celów Webhook i helpery instalacji tras |
    | `plugin-sdk/webhook-path` | Helpery normalizacji ścieżek Webhook |
    | `plugin-sdk/web-media` | Współdzielone helpery ładowania mediów zdalnych/lokalnych |
    | `plugin-sdk/zod` | Ponownie eksportowany `zod` dla odbiorców Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Podścieżki pamięci">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Dołączona powierzchnia helperów memory-core dla helperów managera/konfiguracji/plików/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime indeksu/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika foundation hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrakty embeddingów hosta pamięci, dostęp do rejestru, lokalny dostawca oraz ogólne helpery wsadowe/zdalne |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika storage hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodalne helpery hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Helpery dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-core-host-status` | Helpery stanu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpery runtime CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Pomocniki głównego runtime hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny względem dostawcy alias helperów głównego runtime hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny względem dostawcy alias helperów dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Neutralny względem dostawcy alias helperów plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-markdown` | Współdzielone helpery zarządzanego Markdown dla Pluginów powiązanych z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada runtime Active Memory dla dostępu do menedżera wyszukiwania |
    | `plugin-sdk/memory-host-status` | Neutralny względem dostawcy alias helperów stanu hosta pamięci |
    | `plugin-sdk/memory-lancedb` | Dołączona powierzchnia helperów memory-lancedb |
  </Accordion>

  <Accordion title="Zarezerwowane podścieżki dołączonych helperów">
    | Rodzina | Bieżące podścieżki | Zamierzone użycie |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Helpery wsparcia dołączonego Pluginu browser (`browser-support` pozostaje barrelem zgodności) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Powierzchnia helperów/runtime dołączonego Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Powierzchnia helperów/runtime dołączonego LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Powierzchnia helperów dołączonego IRC |
    | Helpery specyficzne dla kanałów | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Interfejsy zgodności/pomocnicze dołączonych kanałów |
    | Helpery autoryzacji/specyficzne dla Pluginów | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Interfejsy helperów dołączonych funkcji/Pluginów; `plugin-sdk/github-copilot-token` obecnie eksportuje `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` i `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API rejestracji

Callback `register(api)` otrzymuje obiekt `OpenClawPluginApi` z następującymi
metodami:

### Rejestracja możliwości

| Metoda                                           | Co rejestruje                        |
| ------------------------------------------------ | ------------------------------------ |
| `api.registerProvider(...)`                      | Wnioskowanie tekstowe (LLM)          |
| `api.registerAgentHarness(...)`                  | Eksperymentalny niskopoziomowy executor agenta |
| `api.registerCliBackend(...)`                    | Lokalny backend wnioskowania CLI     |
| `api.registerChannel(...)`                       | Kanał komunikacyjny                  |
| `api.registerSpeechProvider(...)`                | Synteza tekstu na mowę / STT         |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniowa transkrypcja w czasie rzeczywistym |
| `api.registerRealtimeVoiceProvider(...)`         | Dwukierunkowe sesje głosu w czasie rzeczywistym |
| `api.registerMediaUnderstandingProvider(...)`    | Analiza obrazów/audio/wideo          |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów                  |
| `api.registerMusicGenerationProvider(...)`       | Generowanie muzyki                   |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo                    |
| `api.registerWebFetchProvider(...)`              | Dostawca pobierania / scrapowania z sieci |
| `api.registerWebSearchProvider(...)`             | Wyszukiwanie w sieci                 |

### Narzędzia i polecenia

| Metoda                          | Co rejestruje                                |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane lub `{ optional: true }`) |
| `api.registerCommand(def)`      | Własne polecenie (omija LLM)                 |

### Infrastruktura

| Metoda                                          | Co rejestruje                          |
| ----------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Hook zdarzeń                           |
| `api.registerHttpRoute(params)`                 | Endpoint HTTP Gateway                  |
| `api.registerGatewayMethod(name, handler)`      | Metoda RPC Gateway                     |
| `api.registerCli(registrar, opts?)`             | Podpolecenie CLI                       |
| `api.registerService(service)`                  | Usługa działająca w tle                |
| `api.registerInteractiveHandler(registration)`  | Handler interaktywny                   |
| `api.registerEmbeddedExtensionFactory(factory)` | Fabryka osadzonych rozszerzeń runnera Pi |
| `api.registerMemoryPromptSupplement(builder)`   | Addytywna sekcja promptu powiązana z pamięcią |
| `api.registerMemoryCorpusSupplement(adapter)`   | Addytywny korpus pamięci do wyszukiwania/odczytu |

Zarezerwowane przestrzenie nazw administracyjnych rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze pozostają `operator.admin`, nawet jeśli Plugin próbuje przypisać
węższy zakres metody Gateway. Dla metod należących do Pluginu preferuj prefiksy
specyficzne dla Pluginu.

Użyj `api.registerEmbeddedExtensionFactory(...)`, gdy Plugin potrzebuje natywnego dla Pi
timingu zdarzeń podczas uruchomień osadzonych OpenClaw, na przykład asynchronicznych
przepisań `tool_result`, które muszą nastąpić przed wysłaniem końcowej wiadomości
z wynikiem narzędzia. Jest to obecnie interfejs dołączonych Pluginów: tylko dołączone
Pluginy mogą taki zarejestrować i muszą zadeklarować `contracts.embeddedExtensionFactories: ["pi"]` w
`openclaw.plugin.json`. Zachowaj zwykłe hooki Pluginów OpenClaw dla wszystkiego, co
nie wymaga tego niższego poziomu.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` akceptuje dwa rodzaje metadanych najwyższego poziomu:

- `commands`: jawne główne polecenia należące do rejestratora
- `descriptors`: deskryptory poleceń na etapie parsowania używane do pomocy głównego CLI,
  routingu i leniwej rejestracji CLI Pluginu

Jeśli chcesz, aby polecenie Pluginu pozostawało ładowane leniwie w zwykłej ścieżce głównego CLI,
podaj `descriptors`, które obejmują każdy główny korzeń polecenia udostępniany przez tego
rejestratora.

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
Ta zgodna wstecz ścieżka eager nadal jest wspierana, ale nie instaluje
placeholderów opartych na deskryptorach do leniwego ładowania na etapie parsowania.

### Rejestracja backendu CLI

`api.registerCliBackend(...)` pozwala Pluginowi zarządzać domyślną konfiguracją lokalnego
backendu AI CLI, takiego jak `codex-cli`.

- `id` backendu staje się prefiksem dostawcy w odwołaniach do modeli, takich jak `codex-cli/gpt-5`.
- `config` backendu używa tego samego kształtu co `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal ma pierwszeństwo. OpenClaw scala `agents.defaults.cliBackends.<id>` z
  domyślną konfiguracją Pluginu przed uruchomieniem CLI.
- Użyj `normalizeConfig`, gdy backend wymaga przepisań zgodności po scaleniu
  (na przykład normalizacji starych kształtów flag).

### Gniazda wyłączne

| Metoda                                     | Co rejestruje                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (aktywny może być tylko jeden naraz). Callback `assemble()` otrzymuje `availableTools` i `citationsMode`, aby silnik mógł dostosować dodatki do promptu. |
| `api.registerMemoryCapability(capability)` | Ujednolicona możliwość pamięci                                                                                                                         |
| `api.registerMemoryPromptSection(builder)` | Konstruktor sekcji promptu pamięci                                                                                                                     |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu flush pamięci                                                                                                                           |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime pamięci                                                                                                                                |

### Adaptery embeddingów pamięci

| Metoda                                         | Co rejestruje                                   |
| ---------------------------------------------- | ----------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embeddingów pamięci dla aktywnego Pluginu |

- `registerMemoryCapability` jest preferowanym API wyłącznego Pluginu pamięci.
- `registerMemoryCapability` może także udostępniać `publicArtifacts.listArtifacts(...)`,
  aby Pluginy towarzyszące mogły korzystać z eksportowanych artefaktów pamięci przez
  `openclaw/plugin-sdk/memory-host-core` zamiast sięgać do prywatnego układu
  konkretnego Pluginu pamięci.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` i
  `registerMemoryRuntime` to zgodne wstecz, wyłączne API Pluginów pamięci.
- `registerMemoryEmbeddingProvider` pozwala aktywnemu Pluginowi pamięci zarejestrować jeden
  lub więcej identyfikatorów adapterów embeddingów (na przykład `openai`, `gemini` lub własny identyfikator zdefiniowany przez Plugin).
- Konfiguracja użytkownika, taka jak `agents.defaults.memorySearch.provider` i
  `agents.defaults.memorySearch.fallback`, jest rozstrzygana względem tych zarejestrowanych
  identyfikatorów adapterów.

### Zdarzenia i cykl życia

| Metoda                                      | Co robi                      |
| ------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`          | Typowany hook cyklu życia    |
| `api.onConversationBindingResolved(handler)` | Callback powiązania rozmowy |

### Semantyka decyzji hooków

- `before_tool_call`: zwrócenie `{ block: true }` jest końcowe. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest końcowe. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `reply_dispatch`: zwrócenie `{ handled: true, ... }` jest końcowe. Gdy dowolny handler przejmie dyspozycję, handlery o niższym priorytecie oraz domyślna ścieżka dyspozycji modelu są pomijane.
- `message_sending`: zwrócenie `{ cancel: true }` jest końcowe. Gdy dowolny handler to ustawi, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.

### Pola obiektu API

| Pole                     | Typ                       | Opis                                                                                        |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identyfikator Pluginu                                                                       |
| `api.name`               | `string`                  | Nazwa wyświetlana                                                                           |
| `api.version`            | `string?`                 | Wersja Pluginu (opcjonalnie)                                                                |
| `api.description`        | `string?`                 | Opis Pluginu (opcjonalnie)                                                                  |
| `api.source`             | `string`                  | Ścieżka źródłowa Pluginu                                                                    |
| `api.rootDir`            | `string?`                 | Katalog główny Pluginu (opcjonalnie)                                                       |
| `api.config`             | `OpenClawConfig`          | Bieżąca migawka konfiguracji (aktywna migawka runtime w pamięci, gdy jest dostępna)       |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfiguracja specyficzna dla Pluginu z `plugins.entries.<id>.config`                       |
| `api.runtime`            | `PluginRuntime`           | [Pomocniki runtime](/pl/plugins/sdk-runtime)                                                   |
| `api.logger`             | `PluginLogger`            | Logger zakresowany (`debug`, `info`, `warn`, `error`)                                      |
| `api.registrationMode`   | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekki etap uruchamiania/konfiguracji przed pełnym wejściem |
| `api.resolvePath(input)` | `(string) => string`      | Rozwiązuje ścieżkę względem katalogu głównego Pluginu                                      |

## Konwencja modułów wewnętrznych

W obrębie swojego Pluginu używaj lokalnych plików barrel do importów wewnętrznych:

```
my-plugin/
  api.ts            # Eksporty publiczne dla zewnętrznych odbiorców
  runtime-api.ts    # Eksporty runtime tylko do użytku wewnętrznego
  index.ts          # Punkt wejścia Pluginu
  setup-entry.ts    # Lekki punkt wejścia tylko do konfiguracji (opcjonalnie)
```

<Warning>
  Nigdy nie importuj własnego Pluginu przez `openclaw/plugin-sdk/<your-plugin>`
  w kodzie produkcyjnym. Kieruj importy wewnętrzne przez `./api.ts` lub
  `./runtime-api.ts`. Ścieżka SDK jest wyłącznie kontraktem zewnętrznym.
</Warning>

Ładowane przez fasadę publiczne powierzchnie dołączonych Pluginów (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` i podobne publiczne pliki wejściowe) preferują teraz
aktywną migawkę konfiguracji runtime, gdy OpenClaw już działa. Jeśli migawka runtime
jeszcze nie istnieje, przechodzą awaryjnie do rozwiązanego pliku konfiguracji na dysku.

Pluginy dostawców mogą także udostępniać wąski lokalny barrel kontraktu Pluginu, gdy dany
helper jest celowo specyficzny dla dostawcy i jeszcze nie należy do ogólnej
podścieżki SDK. Obecny dołączony przykład: dostawca Anthropic trzyma swoje helpery
strumieni Claude we własnym publicznym interfejsie `api.ts` / `contract-api.ts` zamiast
promować logikę nagłówków beta Anthropic i `service_tier` do ogólnego
kontraktu `plugin-sdk/*`.

Inne obecne dołączone przykłady:

- `@openclaw/openai-provider`: `api.ts` eksportuje konstruktory dostawców,
  helpery domyślnych modeli i konstruktory dostawców czasu rzeczywistego
- `@openclaw/openrouter-provider`: `api.ts` eksportuje konstruktor dostawcy oraz
  helpery wdrażania/konfiguracji

<Warning>
  Kod produkcyjny rozszerzeń powinien również unikać importów `openclaw/plugin-sdk/<other-plugin>`.
  Jeśli helper jest rzeczywiście współdzielony, przenieś go do neutralnej podścieżki SDK,
  takiej jak `openclaw/plugin-sdk/speech`, `.../provider-model-shared` lub innej
  powierzchni zorientowanej na możliwości, zamiast wiązać ze sobą dwa Pluginy.
</Warning>

## Powiązane

- [Punkty wejścia](/pl/plugins/sdk-entrypoints) — opcje `definePluginEntry` i `defineChannelPluginEntry`
- [Pomocniki runtime](/pl/plugins/sdk-runtime) — pełna dokumentacja przestrzeni nazw `api.runtime`
- [Konfiguracja i ustawienia](/pl/plugins/sdk-setup) — pakowanie, manifesty, schematy konfiguracji
- [Testowanie](/pl/plugins/sdk-testing) — narzędzia testowe i reguły lint
- [Migracja SDK](/pl/plugins/sdk-migration) — migracja ze starszych powierzchni
- [Wewnętrzne elementy Pluginów](/pl/plugins/architecture) — szczegółowa architektura i model możliwości
