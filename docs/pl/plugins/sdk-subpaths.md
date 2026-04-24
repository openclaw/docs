---
read_when:
    - Wybór właściwej podścieżki plugin-sdk dla importu Pluginu
    - Audyt podścieżek dołączonych Pluginów i powierzchni pomocników
summary: 'Katalog podścieżek Plugin SDK: gdzie znajdują się które importy, pogrupowane według obszaru'
title: Podścieżki Plugin SDK
x-i18n:
    generated_at: "2026-04-24T09:25:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 20b923e392b3ec65cfc958ccc7452b52d82bc372ae57cc9becad74a5085ed71b
    source_path: plugins/sdk-subpaths.md
    workflow: 15
---

  Plugin SDK jest udostępniany jako zestaw wąskich podścieżek pod `openclaw/plugin-sdk/`.
  Ta strona kataloguje najczęściej używane podścieżki pogrupowane według celu. Wygenerowana
  pełna lista ponad 200 podścieżek znajduje się w `scripts/lib/plugin-sdk-entrypoints.json`;
  zastrzeżone podścieżki pomocników dołączonych Pluginów również się tam pojawiają, ale są szczegółem implementacyjnym, chyba że strona dokumentacji jawnie je promuje.

  Przewodnik dla autorów Pluginów znajdziesz w [Plugin SDK overview](/pl/plugins/sdk-overview).

  ## Wejście Pluginu

  | Podścieżka                  | Kluczowe eksporty                                                                                                                     |
  | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
  | `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                   |
  | `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
  | `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                      |
  | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                     |

  <AccordionGroup>
  <Accordion title="Podścieżki kanałów">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | Eksport głównego schematu Zod `openclaw.json` (`OpenClawSchema`) |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, a także `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | Współdzielone pomocniki kreatora konfiguracji, prompty listy dozwolonych, kreatory statusu konfiguracji |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | Pomocniki konfiguracji/bramek akcji dla wielu kont, pomocniki fallbacku konta domyślnego |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`, pomocniki normalizacji identyfikatora konta |
    | `plugin-sdk/account-resolution` | Wyszukiwanie konta + pomocniki fallbacku domyślnego |
    | `plugin-sdk/account-helpers` | Wąskie pomocniki list kont/akcji na koncie |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Typy schematu konfiguracji kanału |
    | `plugin-sdk/telegram-command-config` | Pomocniki normalizacji/walidacji niestandardowych poleceń Telegram z fallbackiem dołączonego kontraktu |
    | `plugin-sdk/command-gating` | Wąskie pomocniki bramkowania autoryzacji poleceń |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, pomocniki cyklu życia/finalizacji draft stream |
    | `plugin-sdk/inbound-envelope` | Współdzielone pomocniki budowania tras i kopert przychodzących |
    | `plugin-sdk/inbound-reply-dispatch` | Współdzielone pomocniki rejestrowania i wysyłki przychodzącej |
    | `plugin-sdk/messaging-targets` | Pomocniki parsowania/dopasowywania celów |
    | `plugin-sdk/outbound-media` | Współdzielone pomocniki ładowania wychodzących multimediów |
    | `plugin-sdk/outbound-runtime` | Pomocniki tożsamości wychodzącej, delegata wysyłki i planowania payloadu |
    | `plugin-sdk/poll-runtime` | Wąskie pomocniki normalizacji ankiet |
    | `plugin-sdk/thread-bindings-runtime` | Pomocniki cyklu życia powiązań wątków i adapterów |
    | `plugin-sdk/agent-media-payload` | Starszy builder payloadu multimediów agenta |
    | `plugin-sdk/conversation-runtime` | Powiązania konwersacji/wątków, parowanie i pomocniki skonfigurowanych powiązań |
    | `plugin-sdk/runtime-config-snapshot` | Pomocnik migawki konfiguracji runtime |
    | `plugin-sdk/runtime-group-policy` | Pomocniki rozwiązywania polityki grup runtime |
    | `plugin-sdk/channel-status` | Współdzielone pomocniki migawki/podsumowania statusu kanału |
    | `plugin-sdk/channel-config-primitives` | Wąskie prymitywy config-schema kanału |
    | `plugin-sdk/channel-config-writes` | Pomocniki autoryzacji zapisów konfiguracji kanału |
    | `plugin-sdk/channel-plugin-common` | Współdzielone eksporty preludium Pluginu kanału |
    | `plugin-sdk/allowlist-config-edit` | Pomocniki edycji/odczytu konfiguracji listy dozwolonych |
    | `plugin-sdk/group-access` | Współdzielone pomocniki decyzji dostępu grupowego |
    | `plugin-sdk/direct-dm` | Współdzielone pomocniki auth/ochrony bezpośrednich wiadomości prywatnych |
    | `plugin-sdk/interactive-runtime` | Semantyczna prezentacja wiadomości, dostarczanie i starsze pomocniki odpowiedzi interaktywnych. Zobacz [Message Presentation](/pl/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | Barrel zgodności dla debounce przychodzącego, dopasowywania wzmianek, pomocników polityki wzmianek i pomocników kopert |
    | `plugin-sdk/channel-inbound-debounce` | Wąskie pomocniki debounce przychodzącego |
    | `plugin-sdk/channel-mention-gating` | Wąskie pomocniki polityki wzmianek i tekstu wzmianki bez szerszej powierzchni inbound runtime |
    | `plugin-sdk/channel-envelope` | Wąskie pomocniki formatowania kopert przychodzących |
    | `plugin-sdk/channel-location` | Pomocniki kontekstu i formatowania lokalizacji kanału |
    | `plugin-sdk/channel-logging` | Pomocniki logowania kanału dla odrzuceń przychodzących i błędów typing/ack |
    | `plugin-sdk/channel-send-result` | Typy wyników odpowiedzi |
    | `plugin-sdk/channel-actions` | Pomocniki akcji wiadomości kanału oraz przestarzałe pomocniki natywnych schematów zachowane dla zgodności Pluginów |
    | `plugin-sdk/channel-targets` | Pomocniki parsowania/dopasowywania celów |
    | `plugin-sdk/channel-contract` | Typy kontraktów kanału |
    | `plugin-sdk/channel-feedback` | Okablowanie feedbacku/reakcji |
    | `plugin-sdk/channel-secret-runtime` | Wąskie pomocniki kontraktu sekretów, takie jak `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment`, oraz typy celów sekretów |
  </Accordion>

  <Accordion title="Podścieżki dostawców">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | Kuratorowane pomocniki konfiguracji lokalnych/samodzielnie hostowanych dostawców |
    | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane pomocniki konfiguracji samodzielnie hostowanych dostawców zgodnych z OpenAI |
    | `plugin-sdk/cli-backend` | Domyślne ustawienia backendu CLI + stałe watchdog |
    | `plugin-sdk/provider-auth-runtime` | Pomocniki rozwiązywania kluczy API runtime dla Pluginów dostawców |
    | `plugin-sdk/provider-auth-api-key` | Pomocniki onboardingu klucza API/zapisu profilu, takie jak `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | Standardowy builder wyniku auth OAuth |
    | `plugin-sdk/provider-auth-login` | Współdzielone pomocniki interaktywnego logowania dla Pluginów dostawców |
    | `plugin-sdk/provider-env-vars` | Pomocniki wyszukiwania zmiennych środowiskowych auth dostawców |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone buildery replay-policy, pomocniki endpointów dostawców oraz pomocniki normalizacji identyfikatorów modeli, takie jak `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | Ogólne pomocniki HTTP/możliwości endpointów dostawców, w tym pomocniki multipart form do transkrypcji audio |
    | `plugin-sdk/provider-web-fetch-contract` | Wąskie pomocniki kontraktu konfiguracji/wyboru web-fetch, takie jak `enablePluginInConfig` i `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | Pomocniki rejestracji/cache dostawców web-fetch |
    | `plugin-sdk/provider-web-search-config-contract` | Wąskie pomocniki konfiguracji/poświadczeń wyszukiwania w sieci dla dostawców, którzy nie potrzebują okablowania enable Pluginu |
    | `plugin-sdk/provider-web-search-contract` | Wąskie pomocniki kontraktu konfiguracji/poświadczeń wyszukiwania w sieci, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz ograniczone settery/gettery poświadczeń |
    | `plugin-sdk/provider-web-search` | Pomocniki rejestracji/cache/runtime dostawców wyszukiwania w sieci |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematu Gemini + diagnostyka oraz pomocniki zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` i podobne |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumienia oraz współdzielone pomocniki wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
    | `plugin-sdk/provider-transport-runtime` | Natywne pomocniki transportu dostawcy, takie jak guarded fetch, transformacje komunikatów transportu i zapisywalne strumienie zdarzeń transportu |
    | `plugin-sdk/provider-onboard` | Pomocniki łatek konfiguracji onboardingu |
    | `plugin-sdk/global-singleton` | Pomocniki singleton/map/cache lokalne dla procesu |
    | `plugin-sdk/group-activation` | Wąskie pomocniki trybu aktywacji grupy i parsowania poleceń |
  </Accordion>

  <Accordion title="Podścieżki auth i bezpieczeństwa">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, pomocniki rejestru poleceń, pomocniki autoryzacji nadawcy |
    | `plugin-sdk/command-status` | Buildery komunikatów poleceń/pomocy, takie jak `buildCommandsMessagePaginated` i `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | Pomocniki rozwiązywania zatwierdzających i auth akcji w tym samym czacie |
    | `plugin-sdk/approval-client-runtime` | Natywne pomocniki profilu/filtrów zatwierdzeń exec |
    | `plugin-sdk/approval-delivery-runtime` | Natywne adaptery możliwości/dostarczania zatwierdzeń |
    | `plugin-sdk/approval-gateway-runtime` | Współdzielony pomocnik rozwiązywania gateway zatwierdzeń |
    | `plugin-sdk/approval-handler-adapter-runtime` | Lekkie pomocniki ładowania natywnego adaptera zatwierdzeń dla gorących punktów wejścia kanałów |
    | `plugin-sdk/approval-handler-runtime` | Szersze pomocniki runtime handlera zatwierdzeń; preferuj węższe połączenia adapter/gateway, gdy są wystarczające |
    | `plugin-sdk/approval-native-runtime` | Natywne pomocniki celów zatwierdzeń + powiązań kont |
    | `plugin-sdk/approval-reply-runtime` | Pomocniki payloadu odpowiedzi zatwierdzeń exec/Pluginu |
    | `plugin-sdk/reply-dedupe` | Wąskie pomocniki resetowania deduplikacji odpowiedzi przychodzących |
    | `plugin-sdk/channel-contract-testing` | Wąskie pomocniki testowe kontraktu kanału bez szerokiego bara testowego |
    | `plugin-sdk/command-auth-native` | Natywne auth poleceń + natywne pomocniki celów sesji |
    | `plugin-sdk/command-detection` | Współdzielone pomocniki wykrywania poleceń |
    | `plugin-sdk/command-primitives-runtime` | Lekkie predykaty tekstu poleceń dla gorących ścieżek kanałów |
    | `plugin-sdk/command-surface` | Pomocniki normalizacji treści poleceń i powierzchni poleceń |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Wąskie pomocniki zbierania kontraktów sekretów dla powierzchni sekretów kanałów/Pluginów |
    | `plugin-sdk/secret-ref-runtime` | Wąskie pomocniki `coerceSecretRef` i typowania SecretRef do parsowania kontraktów sekretów/konfiguracji |
    | `plugin-sdk/security-runtime` | Współdzielone pomocniki zaufania, bramkowania DM, zewnętrznej treści i zbierania sekretów |
    | `plugin-sdk/ssrf-policy` | Pomocniki list dozwolonych hostów i polityki SSRF dla sieci prywatnych |
    | `plugin-sdk/ssrf-dispatcher` | Wąskie pomocniki pinned-dispatcher bez szerokiej powierzchni infra runtime |
    | `plugin-sdk/ssrf-runtime` | Pomocniki pinned-dispatcher, fetch chronionego przez SSRF i polityki SSRF |
    | `plugin-sdk/secret-input` | Pomocniki parsowania wejścia sekretów |
    | `plugin-sdk/webhook-ingress` | Pomocniki żądań/celów Webhook |
    | `plugin-sdk/webhook-request-guards` | Pomocniki limitu rozmiaru body żądania/limitu czasu |
  </Accordion>

  <Accordion title="Podścieżki runtime i przechowywania">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/runtime` | Szerokie pomocniki runtime/logowania/backupu/instalacji Pluginów |
    | `plugin-sdk/runtime-env` | Wąskie pomocniki runtime env, loggera, limitów czasu, retry i backoff |
    | `plugin-sdk/channel-runtime-context` | Ogólne pomocniki rejestracji i wyszukiwania kontekstu runtime kanału |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | Współdzielone pomocniki poleceń/haków/http/interaktywnych funkcji Pluginu |
    | `plugin-sdk/hook-runtime` | Współdzielone pomocniki potoku Webhook/wewnętrznych haków |
    | `plugin-sdk/lazy-runtime` | Pomocniki leniwego importu/powiązań runtime, takie jak `createLazyRuntimeModule`, `createLazyRuntimeMethod` i `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | Pomocniki exec procesu |
    | `plugin-sdk/cli-runtime` | Pomocniki formatowania CLI, wait i wersji |
    | `plugin-sdk/gateway-runtime` | Pomocniki klienta Gateway i łatek statusu kanału |
    | `plugin-sdk/config-runtime` | Pomocniki ładowania/zapisu konfiguracji i wyszukiwania konfiguracji Pluginu |
    | `plugin-sdk/telegram-command-config` | Normalizacja nazw/opisów poleceń Telegram i kontrole duplikatów/konfliktów, nawet gdy dołączona powierzchnia kontraktu Telegram jest niedostępna |
    | `plugin-sdk/text-autolink-runtime` | Wykrywanie autolinków referencji do plików bez szerokiego bara text-runtime |
    | `plugin-sdk/approval-runtime` | Pomocniki zatwierdzeń exec/Pluginów, buildery możliwości zatwierdzeń, pomocniki auth/profili, natywne pomocniki routingu/runtime |
    | `plugin-sdk/reply-runtime` | Współdzielone pomocniki runtime inbound/reply, chunking, dispatch, Heartbeat, planner odpowiedzi |
    | `plugin-sdk/reply-dispatch-runtime` | Wąskie pomocniki dispatch/finalizacji odpowiedzi i etykiet konwersacji |
    | `plugin-sdk/reply-history` | Współdzielone pomocniki krótkiego okna historii odpowiedzi, takie jak `buildHistoryContext`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | Wąskie pomocniki chunkingu tekstu/Markdown |
    | `plugin-sdk/session-store-runtime` | Pomocniki ścieżek magazynu sesji + `updated-at` |
    | `plugin-sdk/state-paths` | Pomocniki ścieżek katalogów stanu/OAuth |
    | `plugin-sdk/routing` | Pomocniki tras/kluczy sesji/powiązań kont, takie jak `resolveAgentRoute`, `buildAgentSessionKey` i `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | Współdzielone pomocniki podsumowań statusu kanału/konta, domyślne ustawienia stanu runtime i pomocniki metadanych problemów |
    | `plugin-sdk/target-resolver-runtime` | Współdzielone pomocniki resolve target |
    | `plugin-sdk/string-normalization-runtime` | Pomocniki normalizacji slug/string |
    | `plugin-sdk/request-url` | Wyodrębnianie URL-i string z wejść typu fetch/request |
    | `plugin-sdk/run-command` | Runner poleceń z limitem czasu i znormalizowanymi wynikami stdout/stderr |
    | `plugin-sdk/param-readers` | Wspólni czytelnicy parametrów narzędzi/CLI |
    | `plugin-sdk/tool-payload` | Wyodrębnianie znormalizowanych payloadów z obiektów wyników narzędzi |
    | `plugin-sdk/tool-send` | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
    | `plugin-sdk/temp-path` | Współdzielone pomocniki ścieżek tymczasowych pobrań |
    | `plugin-sdk/logging-core` | Pomocniki loggera podsystemu i redakcji |
    | `plugin-sdk/markdown-table-runtime` | Pomocniki trybu tabel Markdown i konwersji |
    | `plugin-sdk/json-store` | Małe pomocniki odczytu/zapisu stanu JSON |
    | `plugin-sdk/file-lock` | Pomocniki re-entrant file-lock |
    | `plugin-sdk/persistent-dedupe` | Pomocniki cache deduplikacji opartej na dysku |
    | `plugin-sdk/acp-runtime` | Pomocniki runtime/sesji ACP i reply-dispatch |
    | `plugin-sdk/acp-binding-resolve-runtime` | Resolve powiązań ACP tylko do odczytu bez importów startupowych cyklu życia |
    | `plugin-sdk/agent-config-primitives` | Wąskie prymitywy config-schema runtime agenta |
    | `plugin-sdk/boolean-param` | Luźny czytnik parametru boolowskiego |
    | `plugin-sdk/dangerous-name-runtime` | Pomocniki rozwiązywania dopasowań niebezpiecznych nazw |
    | `plugin-sdk/device-bootstrap` | Pomocniki bootstrap urządzenia i tokenów parowania |
    | `plugin-sdk/extension-shared` | Współdzielone prymitywy pomocników passive-channel, statusu i ambient proxy |
    | `plugin-sdk/models-provider-runtime` | Pomocniki odpowiedzi polecenia `/models`/dostawcy |
    | `plugin-sdk/skill-commands-runtime` | Pomocniki wyświetlania poleceń Skills |
    | `plugin-sdk/native-command-registry` | Natywne pomocniki rejestru/budowania/serializacji poleceń |
    | `plugin-sdk/agent-harness` | Eksperymentalna powierzchnia zaufanych Pluginów dla niskopoziomowych harnessów agentów: typy harness, pomocniki steering/abort aktywnego uruchomienia, pomocniki mostu narzędzi OpenClaw, pomocniki formatowania/szczegółów postępu narzędzi i narzędzia wyniku próby |
    | `plugin-sdk/provider-zai-endpoint` | Pomocniki wykrywania endpointów Z.AI |
    | `plugin-sdk/infra-runtime` | Pomocniki zdarzeń systemowych/Heartbeat |
    | `plugin-sdk/collection-runtime` | Małe pomocniki ograniczonego cache |
    | `plugin-sdk/diagnostic-runtime` | Pomocniki flag i zdarzeń diagnostycznych |
    | `plugin-sdk/error-runtime` | Graf błędów, formatowanie, współdzielone pomocniki klasyfikacji błędów, `isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | Pomocniki wrapped fetch, proxy i pinned lookup |
    | `plugin-sdk/runtime-fetch` | Runtime fetch świadomy dispatchera bez importów proxy/guarded-fetch |
    | `plugin-sdk/response-limit-runtime` | Czytnik ograniczonego body odpowiedzi bez szerokiej powierzchni media runtime |
    | `plugin-sdk/session-binding-runtime` | Bieżący stan powiązania konwersacji bez routingu skonfigurowanych powiązań lub magazynów parowania |
    | `plugin-sdk/session-store-runtime` | Pomocniki odczytu magazynu sesji bez szerokich importów zapisów konfiguracji/utrzymania |
    | `plugin-sdk/context-visibility-runtime` | Rozwiązywanie widoczności kontekstu i filtrowanie kontekstu uzupełniającego bez szerokich importów config/security |
    | `plugin-sdk/string-coerce-runtime` | Wąskie pomocniki koercji i normalizacji rekordów/stringów prymitywnych bez importów Markdown/logowania |
    | `plugin-sdk/host-runtime` | Pomocniki normalizacji nazw hostów i hostów SCP |
    | `plugin-sdk/retry-runtime` | Pomocniki konfiguracji retry i runnera retry |
    | `plugin-sdk/agent-runtime` | Pomocniki katalogu agenta/tożsamości/obszaru roboczego |
    | `plugin-sdk/directory-runtime` | Zapytanie/deduplikacja katalogów opartych na konfiguracji |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="Podścieżki możliwości i testowania">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/media-runtime` | Współdzielone pomocniki fetch/transform/store mediów oraz buildery payloadów mediów |
    | `plugin-sdk/media-store` | Wąskie pomocniki magazynu mediów, takie jak `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | Współdzielone pomocniki failover generowania mediów, wyboru kandydatów i komunikatów o brakującym modelu |
    | `plugin-sdk/media-understanding` | Typy dostawców rozumienia mediów oraz eksporty pomocników image/audio skierowane do dostawców |
    | `plugin-sdk/text-runtime` | Współdzielone pomocniki tekstu/Markdown/logowania, takie jak usuwanie tekstu widocznego dla asystenta, pomocniki renderowania/chunkingu/tabel Markdown, pomocniki redakcji, pomocniki tagów dyrektyw i narzędzia safe-text |
    | `plugin-sdk/text-chunking` | Pomocnik chunkingu tekstu wychodzącego |
    | `plugin-sdk/speech` | Typy dostawców mowy oraz pomocniki dyrektyw, rejestru i walidacji skierowane do dostawców |
    | `plugin-sdk/speech-core` | Współdzielone typy dostawców mowy, rejestr, dyrektywy i pomocniki normalizacji |
    | `plugin-sdk/realtime-transcription` | Typy dostawców transkrypcji w czasie rzeczywistym, pomocniki rejestru i współdzielony pomocnik sesji WebSocket |
    | `plugin-sdk/realtime-voice` | Typy dostawców głosu w czasie rzeczywistym i pomocniki rejestru |
    | `plugin-sdk/image-generation` | Typy dostawców generowania obrazów |
    | `plugin-sdk/image-generation-core` | Współdzielone typy generowania obrazów, failover, auth i pomocniki rejestru |
    | `plugin-sdk/music-generation` | Typy dostawców/żądań/wyników generowania muzyki |
    | `plugin-sdk/music-generation-core` | Współdzielone typy generowania muzyki, pomocniki failover, wyszukiwanie dostawców i parsowanie referencji modeli |
    | `plugin-sdk/video-generation` | Typy dostawców/żądań/wyników generowania wideo |
    | `plugin-sdk/video-generation-core` | Współdzielone typy generowania wideo, pomocniki failover, wyszukiwanie dostawców i parsowanie referencji modeli |
    | `plugin-sdk/webhook-targets` | Rejestr celów Webhook i pomocniki instalacji tras |
    | `plugin-sdk/webhook-path` | Pomocniki normalizacji ścieżek Webhook |
    | `plugin-sdk/web-media` | Współdzielone pomocniki ładowania zdalnych/lokalnych mediów |
    | `plugin-sdk/zod` | Reeksportowane `zod` dla konsumentów Plugin SDK |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="Podścieżki pamięci">
    | Podścieżka | Kluczowe eksporty |
    | --- | --- |
    | `plugin-sdk/memory-core` | Powierzchnia pomocników dołączonego memory-core dla managera/konfiguracji/plików/CLI |
    | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime indeksu/wyszukiwania pamięci |
    | `plugin-sdk/memory-core-host-engine-foundation` | Eksporty silnika bazowego hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-embeddings` | Kontrakty embeddingów hosta pamięci, dostęp do rejestru, lokalny dostawca oraz ogólne pomocniki batch/zdalne |
    | `plugin-sdk/memory-core-host-engine-qmd` | Eksporty silnika QMD hosta pamięci |
    | `plugin-sdk/memory-core-host-engine-storage` | Eksporty silnika przechowywania hosta pamięci |
    | `plugin-sdk/memory-core-host-multimodal` | Pomocniki multimodalne hosta pamięci |
    | `plugin-sdk/memory-core-host-query` | Pomocniki zapytań hosta pamięci |
    | `plugin-sdk/memory-core-host-secret` | Pomocniki sekretów hosta pamięci |
    | `plugin-sdk/memory-core-host-events` | Pomocniki dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-core-host-status` | Pomocniki statusu hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-cli` | Pomocniki runtime CLI hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-core` | Pomocniki core runtime hosta pamięci |
    | `plugin-sdk/memory-core-host-runtime-files` | Pomocniki plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-core` | Neutralny względem dostawcy alias dla pomocników core runtime hosta pamięci |
    | `plugin-sdk/memory-host-events` | Neutralny względem dostawcy alias dla pomocników dziennika zdarzeń hosta pamięci |
    | `plugin-sdk/memory-host-files` | Neutralny względem dostawcy alias dla pomocników plików/runtime hosta pamięci |
    | `plugin-sdk/memory-host-markdown` | Współdzielone pomocniki managed-markdown dla Pluginów powiązanych z pamięcią |
    | `plugin-sdk/memory-host-search` | Fasada runtime Active Memory do dostępu do search-manager |
    | `plugin-sdk/memory-host-status` | Neutralny względem dostawcy alias dla pomocników statusu hosta pamięci |
    | `plugin-sdk/memory-lancedb` | Powierzchnia pomocników dołączonego memory-lancedb |
  </Accordion>

  <Accordion title="Zastrzeżone podścieżki dołączonych pomocników">
    | Rodzina | Bieżące podścieżki | Zamierzone użycie |
    | --- | --- | --- |
    | Browser | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | Pomocniki wsparcia dołączonego Pluginu przeglądarki (`browser-support` pozostaje barem zgodności) |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | Powierzchnia pomocników/runtime dołączonego Matrix |
    | Line | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | Powierzchnia pomocników/runtime dołączonego LINE |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | Powierzchnia pomocników dołączonego IRC |
    | Pomocniki specyficzne dla kanału | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | Połączenia zgodności/pomocników dołączonych kanałów |
    | Pomocniki specyficzne dla auth/Pluginu | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | Połączenia pomocników dołączonych funkcji/Pluginów; `plugin-sdk/github-copilot-token` obecnie eksportuje `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` i `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## Powiązane

- [Plugin SDK overview](/pl/plugins/sdk-overview)
- [Plugin SDK setup](/pl/plugins/sdk-setup)
- [Building plugins](/pl/plugins/building-plugins)
