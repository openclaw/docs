---
read_when:
    - Musisz wiedzieć, z której podścieżki SDK importować
    - Chcesz mieć opis wszystkich metod rejestracji w OpenClawPluginApi
    - Szukasz konkretnego eksportu SDK
sidebarTitle: SDK Overview
summary: Mapa importów, opis API rejestracji i architektura SDK
title: Przegląd Plugin SDK
x-i18n:
    generated_at: "2026-04-05T14:02:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d7d8b6add0623766d36e81588ae783b525357b2f5245c38c8e2b07c5fc1d2b5
    source_path: plugins/sdk-overview.md
    workflow: 15
---

# Przegląd Plugin SDK

Plugin SDK to typowany kontrakt między pluginami a rdzeniem. Ta strona jest
opisem referencyjnym **co importować** oraz **co można rejestrować**.

<Tip>
  **Szukasz przewodnika krok po kroku?**
  - Pierwszy plugin? Zacznij od [Pierwsze kroki](/plugins/building-plugins)
  - Plugin kanału? Zobacz [Pluginy kanałów](/plugins/sdk-channel-plugins)
  - Plugin dostawcy? Zobacz [Pluginy dostawców](/plugins/sdk-provider-plugins)
</Tip>

## Konwencja importu

Zawsze importuj z konkretnej podścieżki:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Każda podścieżka jest małym, samowystarczalnym modułem. Dzięki temu uruchamianie
pozostaje szybkie i unika się problemów z zależnościami cyklicznymi. Dla pomocników
wejściowych/budujących specyficznych dla kanałów preferuj `openclaw/plugin-sdk/channel-core`;
zachowaj `openclaw/plugin-sdk/core` dla szerszej powierzchni zbiorczej i współdzielonych
helperów, takich jak `buildChannelConfigSchema`.

Nie dodawaj ani nie opieraj się na wygodnych warstwach nazwanych od dostawców, takich jak
`openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp` ani
warstwach helperów oznakowanych nazwą kanału. Dołączone pluginy powinny składać ogólne
podścieżki SDK we własnych barrelach `api.ts` lub `runtime-api.ts`, a rdzeń
powinien albo używać tych lokalnych dla pluginu barrelów, albo dodać wąski ogólny kontrakt SDK,
gdy potrzeba rzeczywiście dotyczy wielu kanałów.

Wygenerowana mapa eksportów nadal zawiera mały zestaw warstw helperów dla dołączonych pluginów,
takich jak `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`,
`plugin-sdk/zalo`, `plugin-sdk/zalo-setup` oraz `plugin-sdk/matrix*`. Te
podścieżki istnieją wyłącznie na potrzeby utrzymania dołączonych pluginów i zgodności;
celowo pominięto je w typowej tabeli poniżej i nie są zalecaną ścieżką importu
dla nowych pluginów zewnętrznych.

## Opis podścieżek

Najczęściej używane podścieżki, pogrupowane według celu. Wygenerowana pełna lista
ponad 200 podścieżek znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`.

Zarezerwowane podścieżki helperów dla dołączonych pluginów nadal pojawiają się na tej wygenerowanej liście.
Traktuj je jako powierzchnie implementacyjne/zgodnościowe, chyba że strona dokumentacji
wyraźnie promuje którąś z nich jako publiczną.

### Wejście pluginu

| Podścieżka                 | Kluczowe eksporty                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Podścieżki kanałów">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, a także `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone helpery kreatora konfiguracji, prompty listy dozwolonych oraz kreatory statusu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Helpery wielu kont i bramki akcji konfiguracji oraz helpery zapasowe dla konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, helpery normalizacji identyfikatorów kont |
    | `plugin-sdk/account-resolution` | Wyszukiwanie kont i helpery zapasowe dla ustawień domyślnych |
    | `plugin-sdk/account-helpers` | Wąskie helpery list akcji na koncie / działań na koncie |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typy schematu konfiguracji kanału |
    | `plugin-sdk/telegram-command-config` | Helpery normalizacji/walidacji niestandardowych poleceń Telegram z zapasowym kontraktem dołączonym |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | Współdzielone helpery tras wejściowych i budowania kopert |
    | `plugin-sdk/inbound-reply-dispatch` | Współdzielone helpery zapisu i wysyłki dla zdarzeń przychodzących |
    | `plugin-sdk/messaging-targets` | Helpery parsowania/dopasowywania celów |
    | `plugin-sdk/outbound-media` | Współdzielone helpery ładowania mediów wychodzących |
    | `plugin-sdk/outbound-runtime` | Helpery tożsamości wychodzącej / delegowania wysyłki |
    | `plugin-sdk/thread-bindings-runtime` | Cykl życia powiązań wątków i helpery adapterów |
    | `plugin-sdk/agent-media-payload` | Starszy kreator payloadów mediów agenta |
    | `plugin-sdk/conversation-runtime` | Helpery powiązań rozmów/wątków, parowania i skonfigurowanych powiązań |
    | `plugin-sdk/runtime-config-snapshot` | Helper migawki konfiguracji środowiska uruchomieniowego |
    | `plugin-sdk/runtime-group-policy` | Helpery rozwiązywania zasad grup w środowisku uruchomieniowym |
    | `plugin-sdk/channel-status` | Współdzielone helpery migawek/podsumowań stanu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy schematu konfiguracji kanału |
    | `plugin-sdk/channel-config-writes` | Helpery autoryzacji zapisu konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty preludium pluginu kanału |
    | `plugin-sdk/allowlist-config-edit` | Helpery odczytu/edycji konfiguracji listy dozwolonych |
    | `plugin-sdk/group-access` | Współdzielone helpery decyzji o dostępie grupowym |
    | `plugin-sdk/direct-dm` | Współdzielone helpery autoryzacji/ochrony bezpośrednich wiadomości |
    | `plugin-sdk/interactive-runtime` | Helpery normalizacji/redukcji payloadów odpowiedzi interaktywnych |
    | `plugin-sdk/channel-inbound` | Debounce, dopasowanie wzmianek, helpery kopert |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | Helpery parsowania/dopasowywania celów |
    | `plugin-sdk/channel-contract` | Typy kontraktu kanału |
    | `plugin-sdk/channel-feedback` | Integracja opinii/reakcji |
  </Accordion>

  <Accordion title="Podścieżki dostawców">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Dobrane helpery konfiguracji dla dostawców lokalnych / self-hosted |
    | `plugin-sdk/self-hosted-provider-setup` | Skoncentrowane helpery konfiguracji samodzielnie hostowanych dostawców zgodnych z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI oraz stałe watchdog |
    | `plugin-sdk/provider-auth-runtime` | Helpery rozwiązywania kluczy API w czasie działania dla pluginów dostawców |
    | `plugin-sdk/provider-auth-api-key` | Helpery onboardingu/zapisu profilu dla kluczy API |
    | `plugin-sdk/provider-auth-result` | Standardowy kreator wyników autoryzacji OAuth |
    | `plugin-sdk/provider-auth-login` | Współdzielone interaktywne helpery logowania dla pluginów dostawców |
    | `plugin-sdk/provider-env-vars` | Helpery wyszukiwania zmiennych środowiskowych autoryzacji dostawcy |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone kreatory polityk replay, helpery endpointów dostawców oraz helpery normalizacji identyfikatorów modeli, takie jak `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ogólne helpery możliwości HTTP/endpointów dostawców |
    | `plugin-sdk/provider-web-fetch` | Helpery rejestracji/pamięci podręcznej dla dostawców web-fetch |
    | `plugin-sdk/provider-web-search` | Helpery rejestracji/pamięci podręcznej/konfiguracji dla dostawców web-search |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematu Gemini + diagnostyka oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` i podobne |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz współdzielone helpery wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-onboard` | Helpery poprawek konfiguracji onboardingu |
    | `plugin-sdk/global-singleton` | Pomocniki singletonów/map/pamięci podręcznej lokalnych dla procesu |
  </Accordion>

  <Accordion title="Podścieżki autoryzacji i bezpieczeństwa">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, helpery rejestru poleceń, helpery autoryzacji nadawcy |
    | `plugin-sdk/approval-auth-runtime` | Helpery rozwiązywania zatwierdzających i autoryzacji działań w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Helpery profili/filtrów zatwierdzania natywnego exec |
    | `plugin-sdk/approval-delivery-runtime` | Adaptery możliwości/dostarczania natywnego zatwierdzania |
    | `plugin-sdk/approval-native-runtime` | Helpery celu i powiązania kont dla natywnego zatwierdzania |
    | `plugin-sdk/approval-reply-runtime` | Helpery payloadów odpowiedzi dla zatwierdzania exec/pluginów |
    | `plugin-sdk/command-auth-native` | Helpery natywnej autoryzacji poleceń i natywnych celów sesji |
    | `plugin-sdk/command-detection` | Współdzielone helpery wykrywania poleceń |
    | `plugin-sdk/command-surface` | Helpery normalizacji treści poleceń i powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | Współdzielone helpery zaufania, bramkowania DM, treści zewnętrznych i zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Helpery listy dozwolonych hostów i polityki SSRF dla sieci prywatnych |
    | `plugin-sdk/ssrf-runtime` | Helpery pinned-dispatcher, fetch chronionego przed SSRF oraz polityki SSRF |
    | `plugin-sdk/secret-input` | Helpery parsowania danych wejściowych sekretów |
    | `plugin-sdk/webhook-ingress` | Helpery żądań/celów webhooków |
    | `plugin-sdk/webhook-request-guards` | Helpery rozmiaru treści i limitu czasu żądań |
  </Accordion>

  <Accordion title="Podścieżki środowiska uruchomieniowego i pamięci">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie helpery runtime/logowania/kopii zapasowych/instalacji pluginów |
    | `plugin-sdk/runtime-env` | Wąskie helpery środowiska runtime, loggera, limitów czasu, ponawiania i backoff |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone helpery poleceń/hooków/http/interakcji pluginów |
    | `plugin-sdk/hook-runtime` | Współdzielone helpery potoku webhooków i hooków wewnętrznych |
    | `plugin-sdk/lazy-runtime` | Helpery leniwego importu/powiązań runtime, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Helpery wykonywania procesów |
    | `plugin-sdk/cli-runtime` | Helpery formatowania CLI, oczekiwania i wersji |
    | `plugin-sdk/gateway-runtime` | Helpery klienta Gateway i poprawek stanu kanału |
    | `plugin-sdk/config-runtime` | Helpery ładowania/zapisu konfiguracji |
    | `plugin-sdk/telegram-command-config` | Normalizacja nazw/opisów poleceń Telegram i sprawdzanie duplikatów/konfliktów, nawet gdy dołączona powierzchnia kontraktu Telegram nie jest dostępna |
    | `plugin-sdk/approval-runtime` | Helpery zatwierdzania exec/pluginów, kreatory możliwości zatwierdzania, helpery autoryzacji/profili, helpery natywnego routingu/runtime |
    | `plugin-sdk/reply-runtime` | Współdzielone helpery runtime przychodzących wiadomości/odpowiedzi, dzielenie na fragmenty, wysyłka, heartbeat, planer odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery wysyłki/finalizacji odpowiedzi |
    | `plugin-sdk/reply-history` | Współdzielone helpery krótkookresowej historii odpowiedzi, takie jak `buildHistoryContext`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie helpery dzielenia tekstu/markdown |
    | `plugin-sdk/session-store-runtime` | Helpery ścieżek pamięci sesji i `updated-at` |
    | `plugin-sdk/state-paths` | Helpery ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/routing` | Helpery routingu/powiązań kluczy sesji/kont, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone helpery podsumowań stanu kanałów/kont, domyślne stany runtime i helpery metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone helpery rozwiązywania celów |
    | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji slugów/ciągów znaków |
    | `plugin-sdk/request-url` | Wyodrębnianie URL-i tekstowych z wejść podobnych do fetch/request |
    | `plugin-sdk/run-command` | Uruchamianie poleceń z limitem czasu i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Typowe czytniki parametrów narzędzi/CLI |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
    | `plugin-sdk/temp-path` | Współdzielone helpery ścieżek tymczasowego pobierania |
    | `plugin-sdk/logging-core` | Logger podsystemu i helpery redagowania |
    | `plugin-sdk/markdown-table-runtime` | Helpery trybów tabel markdown |
    | `plugin-sdk/json-store` | Małe helpery odczytu/zapisu stanu JSON |
    | `plugin-sdk/file-lock` | Reentrantne helpery blokady plików |
    | `plugin-sdk/persistent-dedupe` | Helpery pamięci podręcznej deduplikacji opartej na dysku |
    | `plugin-sdk/acp-runtime` | Helpery sesji/runtime ACP |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy schematu konfiguracji runtime agenta |
    | `plugin-sdk/boolean-param` | Luźny czytnik parametrów logicznych |
    | `plugin-sdk/dangerous-name-runtime` | Helpery rozwiązywania dopasowań nazw niebezpiecznych |
    | `plugin-sdk/device-bootstrap` | Helpery bootstrapu urządzenia i tokenów parowania |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy pomocnicze dla kanałów pasywnych i stanu |
    | `plugin-sdk/models-provider-runtime` | Helpery odpowiedzi polecenia `/models` i dostawców |
    | `plugin-sdk/skill-commands-runtime` | Helpery listowania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Helpery rejestru/budowy/serializacji natywnych poleceń |
    | `plugin-sdk/provider-zai-endpoint` | Helpery wykrywania endpointów Z.AI |
    | `plugin-sdk/infra-runtime` | Helpery zdarzeń systemowych/heartbeat |
    | `plugin-sdk/collection-runtime` | Małe helpery ograniczonych pamięci podręcznych |
    | `plugin-sdk/diagnostic-runtime` | Helpery flag i zdarzeń diagnostycznych |
    | `plugin-sdk/error-runtime` | Graf błędów, formatowanie, współdzielone helpery klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Opakowany fetch, proxy i helpery przypiętego wyszukiwania |
    | `plugin-sdk/host-runtime` | Helpery normalizacji nazw hostów i hostów SCP |
    | `plugin-sdk/retry-runtime` | Helpery konfiguracji ponawiania i wykonawcy ponowień |
    | `plugin-sdk/agent-runtime` | Helpery katalogów/tożsamości/przestrzeni roboczych agenta |
    | `plugin-sdk/directory-runtime` | Zapytania do katalogów oparte na konfiguracji / deduplikacja |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Podścieżki możliwości i testowania">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Współdzielone helpery pobierania/przekształcania/przechowywania mediów oraz kreatory payloadów mediów |
    | `plugin-sdk/media-understanding` | Typy dostawców rozumienia mediów oraz helpery obrazów/audio po stronie dostawcy |
    | `plugin-sdk/text-runtime` | Współdzielone helpery tekstu/markdown/logowania, takie jak usuwanie tekstu widocznego dla asystenta, helpery renderowania/dzielenia/tabel markdown, helpery redagowania, helpery tagów dyrektyw i narzędzia bezpiecznego tekstu |
    | `plugin-sdk/text-chunking` | Helper dzielenia tekstu wychodzącego |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz helpery dyrektyw, rejestru i walidacji po stronie dostawcy |
    | `plugin-sdk/speech-core` | Współdzielone typy dostawców mowy, rejestr, dyrektywy i helpery normalizacji |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji w czasie rzeczywistym i helpery rejestru |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu w czasie rzeczywistym i helpery rejestru |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów |
    | `plugin-sdk/image-generation-core` | Współdzielone typy generowania obrazów, failover, autoryzacja i helpery rejestru |
    | `plugin-sdk/video-generation` | Typy żądań/wyników generowania wideo i dostawców |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo, helpery failover, wyszukiwania dostawców i parsowania model-ref |
    | `plugin-sdk/webhook-targets` | Rejestr celów webhooków i helpery instalacji tras |
    | `plugin-sdk/webhook-path` | Helpery normalizacji ścieżek webhooków |
    | `plugin-sdk/web-media` | Współdzielone helpery ładowania mediów zdalnych/lokalnych |
    | `plugin-sdk/zod` | Reeksport `zod` dla użytkowników Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Podścieżki pamięci">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Dołączona powierzchnia helperów memory-core dla helperów managera/konfiguracji/plików/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime indeksowania/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika bazowego hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Eksporty silnika embeddingów hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika pamięci masowej hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Multimodalne helpery hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-status` | Helpery stanu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Helpery runtime CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Helpery głównego runtime hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/runtime hosta pamięci |
    | `plugin-sdk/memory-lancedb` | Dołączona powierzchnia helperów memory-lancedb |
  </Accordion>

  <Accordion title="Zarezerwowane podścieżki helperów dołączonych">
    | Rodzina | Bieżące podścieżki | Przeznaczenie |
    | --- | --- | --- |
    | Przeglądarka | `plugin-sdk/browser-config-support`, `plugin-sdk/browser-support` | Helpery wsparcia dołączonego pluginu przeglądarki |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Powierzchnia helperów/runtime dla dołączonego Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Powierzchnia helperów/runtime dla dołączonego LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Powierzchnia helperów dla dołączonego IRC |
    | Helpery specyficzne dla kanałów | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Warstwy zgodności/helperów dla dołączonych kanałów |
    | Helpery specyficzne dla autoryzacji/pluginów | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Warstwy helperów dla dołączonych funkcji/pluginów; `plugin-sdk/github-copilot-token` obecnie eksportuje `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` oraz `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## API rejestracji

Wywołanie zwrotne `register(api)` otrzymuje obiekt `OpenClawPluginApi` z następującymi
metodami:

### Rejestracja możliwości

| Metoda                                           | Co rejestruje                   |
| ------------------------------------------------ | ------------------------------- |
| `api.registerProvider(...)`                      | Wnioskowanie tekstowe (LLM)     |
| `api.registerCliBackend(...)`                    | Lokalny backend wnioskowania CLI |
| `api.registerChannel(...)`                       | Kanał wiadomości                |
| `api.registerSpeechProvider(...)`                | Synteza tekst-na-mowę / STT     |
| `api.registerRealtimeTranscriptionProvider(...)` | Strumieniowa transkrypcja w czasie rzeczywistym |
| `api.registerRealtimeVoiceProvider(...)`         | Dwukierunkowe sesje głosowe w czasie rzeczywistym |
| `api.registerMediaUnderstandingProvider(...)`    | Analiza obrazów/audio/wideo     |
| `api.registerImageGenerationProvider(...)`       | Generowanie obrazów             |
| `api.registerVideoGenerationProvider(...)`       | Generowanie wideo               |
| `api.registerWebFetchProvider(...)`              | Dostawca pobierania / scrapingu z sieci |
| `api.registerWebSearchProvider(...)`             | Wyszukiwanie w sieci            |

### Narzędzia i polecenia

| Metoda                          | Co rejestruje                                |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Narzędzie agenta (wymagane lub `{ optional: true }`) |
| `api.registerCommand(def)`      | Niestandardowe polecenie (omija LLM)         |

### Infrastruktura

| Metoda                                         | Co rejestruje        |
| ---------------------------------------------- | -------------------- |
| `api.registerHook(events, handler, opts?)`     | Hook zdarzeń         |
| `api.registerHttpRoute(params)`                | Endpoint HTTP Gateway |
| `api.registerGatewayMethod(name, handler)`     | Metoda RPC Gateway   |
| `api.registerCli(registrar, opts?)`            | Podpolecenie CLI     |
| `api.registerService(service)`                 | Usługa działająca w tle |
| `api.registerInteractiveHandler(registration)` | Obsługa interaktywna |

Zarezerwowane przestrzenie nazw administracyjnych rdzenia (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) zawsze pozostają `operator.admin`, nawet jeśli plugin próbuje przypisać
węższy zakres dla metody Gateway. Dla metod należących do pluginu preferuj prefiksy
specyficzne dla pluginu.

### Metadane rejestracji CLI

`api.registerCli(registrar, opts?)` akceptuje dwa rodzaje metadanych najwyższego poziomu:

- `commands`: jawne główne polecenia należące do rejestratora
- `descriptors`: deskryptory poleceń na etapie parsowania używane dla głównej pomocy CLI,
  routingu i leniwej rejestracji CLI pluginu

Jeśli chcesz, aby polecenie pluginu pozostało leniwie ładowane w normalnej ścieżce głównego CLI,
podaj `descriptors`, które obejmują każdy główny korzeń poleceń udostępniany przez ten
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
Ta ścieżka zgodności eager nadal jest obsługiwana, ale nie instaluje
placeholderów opartych na deskryptorach dla leniwego ładowania na etapie parsowania.

### Rejestracja backendu CLI

`api.registerCliBackend(...)` pozwala pluginowi posiadać domyślną konfigurację dla lokalnego
backendu CLI AI, takiego jak `claude-cli` lub `codex-cli`.

- `id` backendu staje się prefiksem dostawcy w odwołaniach do modeli, takich jak `claude-cli/opus`.
- `config` backendu używa tego samego kształtu co `agents.defaults.cliBackends.<id>`.
- Konfiguracja użytkownika nadal ma pierwszeństwo. OpenClaw scala `agents.defaults.cliBackends.<id>` z konfiguracją
  domyślną pluginu przed uruchomieniem CLI.
- Użyj `normalizeConfig`, gdy backend wymaga poprawek zgodności po scaleniu
  (na przykład normalizacji starych kształtów flag).

### Wyłączne sloty

| Metoda                                     | Co rejestruje                        |
| ------------------------------------------ | ------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Silnik kontekstu (aktywny jeden naraz) |
| `api.registerMemoryPromptSection(builder)` | Kreator sekcji promptu pamięci       |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver planu opróżniania pamięci   |
| `api.registerMemoryRuntime(runtime)`       | Adapter runtime pamięci              |

### Adaptery embeddingów pamięci

| Metoda                                         | Co rejestruje                                  |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Adapter embeddingów pamięci dla aktywnego pluginu |

- `registerMemoryPromptSection`, `registerMemoryFlushPlan` oraz
  `registerMemoryRuntime` są wyłączne dla pluginów pamięci.
- `registerMemoryEmbeddingProvider` pozwala aktywnemu pluginowi pamięci rejestrować jeden
  lub więcej identyfikatorów adapterów embeddingów (na przykład `openai`, `gemini` lub
  własny identyfikator zdefiniowany przez plugin).
- Konfiguracja użytkownika, taka jak `agents.defaults.memorySearch.provider` oraz
  `agents.defaults.memorySearch.fallback`, jest rozwiązywana względem tych zarejestrowanych
  identyfikatorów adapterów.

### Zdarzenia i cykl życia

| Metoda                                       | Co robi                       |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Typowany hook cyklu życia     |
| `api.onConversationBindingResolved(handler)` | Callback rozwiązania powiązania rozmowy |

### Semantyka decyzji hooków

- `before_tool_call`: zwrócenie `{ block: true }` jest ostateczne. Gdy którykolwiek handler ustawi tę wartość, handlery o niższym priorytecie są pomijane.
- `before_tool_call`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `before_install`: zwrócenie `{ block: true }` jest ostateczne. Gdy którykolwiek handler ustawi tę wartość, handlery o niższym priorytecie są pomijane.
- `before_install`: zwrócenie `{ block: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `block`), a nie jako nadpisanie.
- `message_sending`: zwrócenie `{ cancel: true }` jest ostateczne. Gdy którykolwiek handler ustawi tę wartość, handlery o niższym priorytecie są pomijane.
- `message_sending`: zwrócenie `{ cancel: false }` jest traktowane jako brak decyzji (tak samo jak pominięcie `cancel`), a nie jako nadpisanie.

### Pola obiektu API

| Pole                    | Typ                       | Opis                                                                                     |
| ----------------------- | ------------------------- | ---------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Identyfikator pluginu                                                                    |
| `api.name`               | `string`                  | Nazwa wyświetlana                                                                        |
| `api.version`            | `string?`                 | Wersja pluginu (opcjonalna)                                                              |
| `api.description`        | `string?`                 | Opis pluginu (opcjonalny)                                                                |
| `api.source`             | `string`                  | Ścieżka źródłowa pluginu                                                                 |
| `api.rootDir`            | `string?`                 | Katalog główny pluginu (opcjonalny)                                                      |
| `api.config`             | `OpenClawConfig`          | Bieżąca migawka konfiguracji (aktywna migawka runtime w pamięci, gdy dostępna)          |
| `api.pluginConfig`       | `Record<string, unknown>` | Konfiguracja specyficzna dla pluginu z `plugins.entries.<id>.config`                     |
| `api.runtime`            | `PluginRuntime`           | [Helpery runtime](/plugins/sdk-runtime)                                                  |
| `api.logger`             | `PluginLogger`            | Logger o ograniczonym zakresie (`debug`, `info`, `warn`, `error`)                        |
| `api.registrationMode`   | `PluginRegistrationMode`  | Bieżący tryb ładowania; `"setup-runtime"` to lekkie okno uruchomienia/konfiguracji przed pełnym wejściem |
| `api.resolvePath(input)` | `(string) => string`      | Rozwiązywanie ścieżki względem katalogu głównego pluginu                                 |

## Konwencja modułów wewnętrznych

Wewnątrz pluginu używaj lokalnych plików barrel do importów wewnętrznych:

```
my-plugin/
  api.ts            # Eksporty publiczne dla zewnętrznych konsumentów
  runtime-api.ts    # Eksporty runtime tylko do użytku wewnętrznego
  index.ts          # Punkt wejścia pluginu
  setup-entry.ts    # Lekki punkt wejścia tylko dla konfiguracji (opcjonalnie)
```

<Warning>
  Nigdy nie importuj własnego pluginu przez `openclaw/plugin-sdk/<your-plugin>`
  w kodzie produkcyjnym. Kieruj importy wewnętrzne przez `./api.ts` lub
  `./runtime-api.ts`. Ścieżka SDK jest wyłącznie kontraktem zewnętrznym.
</Warning>

Publiczne powierzchnie dołączonych pluginów ładowane przez fasady (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` i podobne publiczne pliki wejściowe) preferują teraz
aktywną migawkę konfiguracji runtime, gdy OpenClaw już działa. Jeśli migawka runtime
nie istnieje jeszcze, wracają do rozwiązanego pliku konfiguracji na dysku.

Pluginy dostawców mogą także udostępniać wąski lokalny barrel kontraktu pluginu, gdy helper
jest celowo specyficzny dla dostawcy i jeszcze nie należy do ogólnej podścieżki SDK.
Obecny dołączony przykład: dostawca Anthropic trzyma swoje helpery strumieni Claude
we własnej publicznej warstwie `api.ts` / `contract-api.ts` zamiast promować logikę
nagłówków beta Anthropic i `service_tier` do ogólnego kontraktu `plugin-sdk/*`.

Inne obecne dołączone przykłady:

- `@openclaw/openai-provider`: `api.ts` eksportuje buildery dostawców,
  helpery modeli domyślnych i buildery dostawców realtime
- `@openclaw/openrouter-provider`: `api.ts` eksportuje builder dostawcy oraz
  helpery onboardingu/konfiguracji

<Warning>
  Kod produkcyjny rozszerzeń powinien także unikać importów `openclaw/plugin-sdk/<other-plugin>`.
  Jeśli helper jest rzeczywiście współdzielony, przenieś go do neutralnej podścieżki SDK,
  takiej jak `openclaw/plugin-sdk/speech`, `.../provider-model-shared` albo innej
  powierzchni zorientowanej na możliwości, zamiast łączyć ze sobą dwa pluginy.
</Warning>

## Powiązane

- [Punkty wejścia](/plugins/sdk-entrypoints) — opcje `definePluginEntry` i `defineChannelPluginEntry`
- [Helpery runtime](/plugins/sdk-runtime) — pełny opis przestrzeni nazw `api.runtime`
- [Konfiguracja i ustawienia](/plugins/sdk-setup) — pakowanie, manifesty, schematy konfiguracji
- [Testowanie](/plugins/sdk-testing) — narzędzia testowe i reguły lint
- [Migracja SDK](/plugins/sdk-migration) — migracja z przestarzałych powierzchni
- [Wnętrze pluginów](/plugins/architecture) — szczegółowa architektura i model możliwości
