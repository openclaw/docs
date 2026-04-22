---
read_when:
    - Widzisz ostrzeżenie OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Widzisz ostrzeżenie OPENCLAW_EXTENSION_API_DEPRECATED
    - Aktualizujesz Plugin do nowoczesnej architektury Plugin
    - Utrzymujesz zewnętrzny Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Migracja ze starszej warstwy zgodności wstecznej do nowoczesnego Plugin SDK
title: Migracja Plugin SDK
x-i18n:
    generated_at: "2026-04-22T04:25:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 72c9fc2d77f5feda336a1119fc42ebe088d5037f99c2b3843e9f06efed20386d
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migracja Plugin SDK

OpenClaw przeszedł ze szerokiej warstwy zgodności wstecznej do nowoczesnej architektury Plugin
z ukierunkowanymi, udokumentowanymi importami. Jeśli Twój Plugin został zbudowany przed
nową architekturą, ten przewodnik pomoże Ci przeprowadzić migrację.

## Co się zmienia

Stary system Plugin udostępniał dwie szeroko otwarte powierzchnie, które pozwalały Plugin importować
wszystko, czego potrzebowały, z jednego punktu wejścia:

- **`openclaw/plugin-sdk/compat`** — pojedynczy import, który re-eksportował dziesiątki
  helperów. Został wprowadzony, aby utrzymać działanie starszych Plugin opartych na hookach, gdy
  budowano nową architekturę Plugin.
- **`openclaw/extension-api`** — most, który dawał Plugin bezpośredni dostęp do
  helperów po stronie hosta, takich jak osadzony runner agenta.

Obie powierzchnie są teraz **deprecated**. Nadal działają w runtime, ale nowe
Plugins nie mogą ich używać, a istniejące Plugins powinny przeprowadzić migrację przed następnym
głównym wydaniem, które je usunie.

<Warning>
  Warstwa zgodności wstecznej zostanie usunięta w przyszłym głównym wydaniu.
  Plugins, które nadal importują z tych powierzchni, przestaną działać, gdy to nastąpi.
</Warning>

## Dlaczego to się zmieniło

Stare podejście powodowało problemy:

- **Powolne uruchamianie** — import jednego helpera ładował dziesiątki niepowiązanych modułów
- **Zależności cykliczne** — szerokie re-eksporty ułatwiały tworzenie cykli importu
- **Niejasna powierzchnia API** — nie było sposobu, by odróżnić eksporty stabilne od wewnętrznych

Nowoczesny Plugin SDK to naprawia: każda ścieżka importu (`openclaw/plugin-sdk/\<subpath\>`)
jest małym, samodzielnym modułem z jasnym przeznaczeniem i udokumentowanym kontraktem.

Zniknęły też starsze wygodne seamy providera dla bundled channels. Importy
takie jak `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
helper seamy markowane kanałem oraz
`openclaw/plugin-sdk/telegram-core` były prywatnymi skrótami mono-repo, a nie
stabilnymi kontraktami Plugin. Zamiast tego używaj wąskich ogólnych podścieżek SDK. W obrębie
obszaru roboczego bundled plugin przechowuj helpery należące do providera we własnym
`api.ts` lub `runtime-api.ts` tego Plugin.

Obecne przykłady bundled providerów:

- Anthropic przechowuje helpery stream specyficzne dla Claude we własnym seamie `api.ts` /
  `contract-api.ts`
- OpenAI przechowuje buildery providera, helpery modeli domyślnych i buildery providera realtime
  we własnym `api.ts`
- OpenRouter przechowuje builder providera oraz helpery onboardingu/konfiguracji we własnym
  `api.ts`

## Jak przeprowadzić migrację

<Steps>
  <Step title="Zmigruj approval-native handlers do approvalCapability">
    Plugin kanałów obsługujące zatwierdzanie udostępniają teraz natywne zachowanie zatwierdzania przez
    `approvalCapability.nativeRuntime` oraz współdzielony rejestr kontekstu runtime.

    Kluczowe zmiany:

    - Zastąp `approvalCapability.handler.loadRuntime(...)` przez
      `approvalCapability.nativeRuntime`
    - Przenieś uwierzytelnianie/dostarczanie specyficzne dla zatwierdzania ze starszego połączenia `plugin.auth` /
      `plugin.approvals` do `approvalCapability`
    - `ChannelPlugin.approvals` zostało usunięte z publicznego kontraktu
      Plugin kanału; przenieś pola delivery/native/render do `approvalCapability`
    - `plugin.auth` pozostaje tylko dla przepływów logowania/wylogowania kanału; hooki
      uwierzytelniania zatwierdzania nie są już odczytywane przez core
    - Rejestruj obiekty runtime należące do kanału, takie jak klienci, tokeny lub aplikacje
      Bolt, przez `openclaw/plugin-sdk/channel-runtime-context`
    - Nie wysyłaj powiadomień o przekierowaniu należących do Plugin z natywnych approval handlerów;
      core jest teraz właścicielem powiadomień routed-elsewhere na podstawie rzeczywistych wyników dostarczania
    - Podczas przekazywania `channelRuntime` do `createChannelManager(...)` podaj
      rzeczywistą powierzchnię `createPluginRuntime().channel`. Częściowe stuby są odrzucane.

    Zobacz `/plugins/sdk-channel-plugins`, aby poznać obecny układ approval capability.

  </Step>

  <Step title="Sprawdź zachowanie fallback wrapperów Windows">
    Jeśli Twój Plugin używa `openclaw/plugin-sdk/windows-spawn`, nierozwiązane wrappery Windows
    `.cmd`/`.bat` teraz domyślnie kończą się bezpieczną odmową, chyba że jawnie przekażesz `allowShellFallback: true`.

    ```typescript
    // Przed
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Po
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Ustawiaj to tylko dla zaufanych wywołujących zgodności, którzy celowo
      // akceptują fallback pośredniczony przez shell.
      allowShellFallback: true,
    });
    ```

    Jeśli Twój wywołujący nie polega celowo na fallback do shell, nie ustawiaj
    `allowShellFallback` i zamiast tego obsłuż zgłaszany błąd.

  </Step>

  <Step title="Znajdź deprecated importy">
    Przeszukaj swój Plugin pod kątem importów z którejkolwiek z deprecated powierzchni:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Zastąp je ukierunkowanymi importami">
    Każdy eksport ze starej powierzchni mapuje się na określoną nowoczesną ścieżkę importu:

    ```typescript
    // Przed (deprecated warstwa zgodności wstecznej)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Po (nowoczesne ukierunkowane importy)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Dla helperów po stronie hosta używaj wstrzykniętego runtime Plugin zamiast importować je
    bezpośrednio:

    ```typescript
    // Przed (deprecated most extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Po (wstrzyknięty runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Ten sam wzorzec dotyczy innych starszych helperów mostu:

    | Stary import | Nowoczesny odpowiednik |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpery session store | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Zbuduj i przetestuj">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Dokumentacja referencyjna ścieżek importu

  <Accordion title="Tabela typowych ścieżek importu">
  | Ścieżka importu | Przeznaczenie | Kluczowe eksporty |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanoniczny helper entry Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Starszy zbiorczy re-eksport dla definicji/builderów entry kanałów | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Eksport głównego schematu konfiguracji | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper entry pojedynczego providera | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Ukierunkowane definicje i buildery entry kanałów | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Współdzielone helpery kreatora konfiguracji | Prompty allowlisty, buildery statusu konfiguracji |
  | `plugin-sdk/setup-runtime` | Helpery runtime na czas konfiguracji | Bezpieczne importowo adaptery patch konfiguracji, helpery lookup-note, `promptResolvedAllowFrom`, `splitSetupEntries`, delegowane proxy konfiguracji |
  | `plugin-sdk/setup-adapter-runtime` | Helpery adaptera konfiguracji | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpery narzędzi konfiguracji | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpery wielu kont | Helpery listy kont/konfiguracji/bramki akcji |
  | `plugin-sdk/account-id` | Helpery account-id | `DEFAULT_ACCOUNT_ID`, normalizacja account-id |
  | `plugin-sdk/account-resolution` | Helpery wyszukiwania kont | Helpery wyszukiwania kont + awaryjnego użycia wartości domyślnej |
  | `plugin-sdk/account-helpers` | Wąskie helpery kont | Helpery listy kont/akcji konta |
  | `plugin-sdk/channel-setup` | Adaptery kreatora konfiguracji | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Prymitywy parowania DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Połączenia prefixu odpowiedzi + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabryki adapterów konfiguracji | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Buildery schematów konfiguracji | Typy schematów konfiguracji kanałów |
  | `plugin-sdk/telegram-command-config` | Helpery konfiguracji poleceń Telegram | Normalizacja nazw poleceń, przycinanie opisów, walidacja duplikatów/konfliktów |
  | `plugin-sdk/channel-policy` | Rozwiązywanie polityk grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpery statusu konta i cyklu życia draft stream | `createAccountStatusSink`, helpery finalizacji podglądu draft |
  | `plugin-sdk/inbound-envelope` | Helpery obwiedni przychodzących | Współdzielone helpery budowania route + obwiedni |
  | `plugin-sdk/inbound-reply-dispatch` | Helpery odpowiedzi przychodzących | Współdzielone helpery record-and-dispatch |
  | `plugin-sdk/messaging-targets` | Parsowanie targetów wiadomości | Helpery parsowania/dopasowania targetów |
  | `plugin-sdk/outbound-media` | Helpery mediów wychodzących | Współdzielone ładowanie mediów wychodzących |
  | `plugin-sdk/outbound-runtime` | Helpery runtime wychodzącego | Helpery tożsamości/delegowania wysyłki wychodzącej i planowania payloadów |
  | `plugin-sdk/thread-bindings-runtime` | Helpery thread-binding | Helpery cyklu życia i adapterów thread-binding |
  | `plugin-sdk/agent-media-payload` | Starsze helpery payloadów mediów | Builder payloadów mediów agenta dla starszych układów pól |
  | `plugin-sdk/channel-runtime` | Deprecated shim zgodności | Tylko starsze narzędzia channel runtime |
  | `plugin-sdk/channel-send-result` | Typy wyników wysyłki | Typy wyników odpowiedzi |
  | `plugin-sdk/runtime-store` | Trwała pamięć Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Szerokie helpery runtime | Helpery runtime/logowania/kopii zapasowych/instalacji Plugin |
  | `plugin-sdk/runtime-env` | Wąskie helpery runtime env | Logger/runtime env, helpery timeout, retry i backoff |
  | `plugin-sdk/plugin-runtime` | Współdzielone helpery runtime Plugin | Współdzielone helpery poleceń/hooków/http/interaktywnych Plugin |
  | `plugin-sdk/hook-runtime` | Helpery pipeline hook | Współdzielone helpery pipeline Webhook/wewnętrznych hook |
  | `plugin-sdk/lazy-runtime` | Helpery leniwego runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpery procesów | Współdzielone helpery exec |
  | `plugin-sdk/cli-runtime` | Helpery runtime CLI | Formatowanie poleceń, oczekiwania, helpery wersji |
  | `plugin-sdk/gateway-runtime` | Helpery Gateway | Helpery klienta Gateway i patch statusu kanału |
  | `plugin-sdk/config-runtime` | Helpery konfiguracji | Helpery ładowania/zapisu konfiguracji |
  | `plugin-sdk/telegram-command-config` | Helpery poleceń Telegram | Stabilne fallback helpery walidacji poleceń Telegram, gdy bundled contract surface Telegram jest niedostępna |
  | `plugin-sdk/approval-runtime` | Helpery promptów zatwierdzania | Payload zatwierdzania exec/Plugin, helpery approval capability/profile, natywne helpery routingu/runtime zatwierdzania |
  | `plugin-sdk/approval-auth-runtime` | Helpery uwierzytelniania zatwierdzania | Rozwiązywanie approver, uwierzytelnianie akcji same-chat |
  | `plugin-sdk/approval-client-runtime` | Helpery klienta zatwierdzania | Helpery natywnego profilu/filtrowania zatwierdzania exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpery dostarczania zatwierdzania | Adaptery natywnego approval capability/delivery |
  | `plugin-sdk/approval-gateway-runtime` | Helpery Gateway zatwierdzania | Współdzielony helper rozwiązywania approval gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpery adaptera zatwierdzania | Lekkie helpery ładowania natywnego adaptera zatwierdzania dla gorących entrypointów kanałów |
  | `plugin-sdk/approval-handler-runtime` | Helpery handlera zatwierdzania | Szersze helpery runtime handlera zatwierdzania; preferuj węższe seamy adapter/gateway, gdy są wystarczające |
  | `plugin-sdk/approval-native-runtime` | Helpery targetów zatwierdzania | Helpery natywnego wiązania targetu/konta zatwierdzania |
  | `plugin-sdk/approval-reply-runtime` | Helpery odpowiedzi zatwierdzania | Helpery payloadów odpowiedzi zatwierdzania exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Helpery channel runtime-context | Ogólne helpery register/get/watch channel runtime-context |
  | `plugin-sdk/security-runtime` | Helpery bezpieczeństwa | Współdzielone helpery zaufania, bramkowania DM, zewnętrznej zawartości i zbierania sekretów |
  | `plugin-sdk/ssrf-policy` | Helpery polityki SSRF | Helpery allowlisty hostów i polityki sieci prywatnej |
  | `plugin-sdk/ssrf-runtime` | Helpery runtime SSRF | Pinned-dispatcher, guarded fetch, helpery polityki SSRF |
  | `plugin-sdk/collection-runtime` | Helpery ograniczonej pamięci podręcznej | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpery bramkowania diagnostyki | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpery formatowania błędów | `formatUncaughtError`, `isApprovalNotFoundError`, helpery grafu błędów |
  | `plugin-sdk/fetch-runtime` | Helpery opakowanego fetch/proxy | `resolveFetch`, helpery proxy |
  | `plugin-sdk/host-runtime` | Helpery normalizacji hosta | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpery retry | `RetryConfig`, `retryAsync`, wykonawcy polityk |
  | `plugin-sdk/allow-from` | Formatowanie allowlisty | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapowanie wejść allowlisty | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Bramkowanie poleceń i helpery command-surface | `resolveControlCommandGate`, helpery autoryzacji nadawcy, helpery rejestru poleceń |
  | `plugin-sdk/command-status` | Renderery statusu/pomocy poleceń | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsowanie secret input | Helpery secret input |
  | `plugin-sdk/webhook-ingress` | Helpery żądań Webhook | Narzędzia targetów Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpery guard treści żądania Webhook | Helpery odczytu/limitów treści żądania |
  | `plugin-sdk/reply-runtime` | Współdzielony reply runtime | Inbound dispatch, Heartbeat, planner odpowiedzi, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery reply dispatch | Helpery finalize + dispatch providera |
  | `plugin-sdk/reply-history` | Helpery reply-history | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planowanie referencji odpowiedzi | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpery fragmentowania odpowiedzi | Helpery fragmentowania tekstu/Markdown |
  | `plugin-sdk/session-store-runtime` | Helpery session store | Helpery ścieżki magazynu + updated-at |
  | `plugin-sdk/state-paths` | Helpery ścieżek stanu | Helpery katalogów stanu i OAuth |
  | `plugin-sdk/routing` | Helpery routingu/kluczy sesji | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpery normalizacji kluczy sesji |
  | `plugin-sdk/status-helpers` | Helpery statusu kanału | Buildery podsumowań statusu kanału/konta, wartości domyślne stanu runtime, helpery metadanych problemów |
  | `plugin-sdk/target-resolver-runtime` | Helpery rozwiązywania targetów | Współdzielone helpery rozwiązywania targetów |
  | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji stringów | Helpery normalizacji slug/string |
  | `plugin-sdk/request-url` | Helpery URL żądania | Wyodrębnianie URL-i string z wejść podobnych do żądań |
  | `plugin-sdk/run-command` | Helpery poleceń z pomiarem czasu | Runner poleceń z ujednoliconym stdout/stderr |
  | `plugin-sdk/param-readers` | Odczyty parametrów | Typowe odczyty parametrów narzędzi/CLI |
  | `plugin-sdk/tool-payload` | Wyodrębnianie payloadów narzędzi | Wyodrębnianie znormalizowanych payloadów z obiektów wyników narzędzi |
  | `plugin-sdk/tool-send` | Wyodrębnianie wysyłki narzędzi | Wyodrębnianie kanonicznych pól targetu wysyłki z argumentów narzędzia |
  | `plugin-sdk/temp-path` | Helpery ścieżek tymczasowych | Współdzielone helpery ścieżek tymczasowego pobierania |
  | `plugin-sdk/logging-core` | Helpery logowania | Logger podsystemu i helpery redakcji |
  | `plugin-sdk/markdown-table-runtime` | Helpery tabel Markdown | Helpery trybu tabel Markdown |
  | `plugin-sdk/reply-payload` | Typy odpowiedzi wiadomości | Typy payloadów odpowiedzi |
  | `plugin-sdk/provider-setup` | Kuratorowane helpery konfiguracji lokalnych/self-hosted providerów | Helpery wykrywania/konfiguracji self-hosted providerów |
  | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane helpery konfiguracji self-hosted providerów zgodnych z OpenAI | Te same helpery wykrywania/konfiguracji self-hosted providerów |
  | `plugin-sdk/provider-auth-runtime` | Helpery uwierzytelniania runtime providera | Helpery rozwiązywania kluczy API w runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpery konfiguracji klucza API providera | Helpery onboardingu/zapisu profilu klucza API |
  | `plugin-sdk/provider-auth-result` | Helpery auth-result providera | Standardowy builder auth-result OAuth |
  | `plugin-sdk/provider-auth-login` | Helpery interaktywnego logowania providera | Współdzielone helpery interaktywnego logowania |
  | `plugin-sdk/provider-env-vars` | Helpery zmiennych środowiskowych providera | Helpery wyszukiwania zmiennych środowiskowych uwierzytelniania providera |
  | `plugin-sdk/provider-model-shared` | Współdzielone helpery modeli/replay providera | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone buildery polityki replay, helpery endpointów providera oraz helpery normalizacji identyfikatorów modeli |
  | `plugin-sdk/provider-catalog-shared` | Współdzielone helpery katalogu providera | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patche onboardingu providera | Helpery konfiguracji onboardingu |
  | `plugin-sdk/provider-http` | Helpery HTTP providera | Ogólne helpery HTTP/możliwości endpointów providera |
  | `plugin-sdk/provider-web-fetch` | Helpery web-fetch providera | Helpery rejestracji/pamięci podręcznej providera web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpery konfiguracji web-search providera | Wąskie helpery konfiguracji/poświadczeń web-search dla providerów, które nie potrzebują połączenia włączania Plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpery kontraktu web-search providera | Wąskie helpery kontraktu konfiguracji/poświadczeń web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowane settery/gettery poświadczeń |
  | `plugin-sdk/provider-web-search` | Helpery web-search providera | Helpery rejestracji/pamięci podręcznej/runtime providera web-search |
  | `plugin-sdk/provider-tools` | Helpery zgodności narzędzi/schematów providera | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematów Gemini + diagnostyka oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpery użycia providera | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` i inne helpery użycia providera |
  | `plugin-sdk/provider-stream` | Helpery wrapperów stream providera | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów stream oraz współdzielone helpery wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpery transportu providera | Natywne helpery transportu providera, takie jak guarded fetch, transformacje wiadomości transportowych i zapisywalne strumienie zdarzeń transportowych |
  | `plugin-sdk/keyed-async-queue` | Uporządkowana kolejka async | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Współdzielone helpery mediów | Helpery fetch/transform/store mediów oraz buildery payloadów mediów |
  | `plugin-sdk/media-generation-runtime` | Współdzielone helpery generowania mediów | Współdzielone helpery failover, wybór kandydatów i komunikaty o brakującym modelu dla generowania obrazów/wideo/muzyki |
  | `plugin-sdk/media-understanding` | Helpery media-understanding | Typy providera media understanding oraz eksporty helperów obrazów/audio skierowane do providerów |
  | `plugin-sdk/text-runtime` | Współdzielone helpery tekstu | Usuwanie tekstu widocznego dla asystenta, helpery renderowania/chunkingu/tabel Markdown, helpery redakcji, helpery directive-tag, narzędzia safe-text i powiązane helpery tekstu/logowania |
  | `plugin-sdk/text-chunking` | Helpery chunkingu tekstu | Helper chunkingu tekstu wychodzącego |
  | `plugin-sdk/speech` | Helpery mowy | Typy providera mowy oraz helpery dyrektyw, rejestru i walidacji skierowane do providerów |
  | `plugin-sdk/speech-core` | Wspólny speech core | Typy providera mowy, rejestr, dyrektywy, normalizacja |
  | `plugin-sdk/realtime-transcription` | Helpery transkrypcji realtime | Typy providera i helpery rejestru |
  | `plugin-sdk/realtime-voice` | Helpery głosu realtime | Typy providera i helpery rejestru |
  | `plugin-sdk/image-generation-core` | Wspólny image-generation core | Typy image-generation, helpery failover, auth i rejestru |
  | `plugin-sdk/music-generation` | Helpery generowania muzyki | Typy providera/żądań/wyników generowania muzyki |
  | `plugin-sdk/music-generation-core` | Wspólny music-generation core | Typy generowania muzyki, helpery failover, wyszukiwanie providera i parsowanie model-ref |
  | `plugin-sdk/video-generation` | Helpery generowania wideo | Typy providera/żądań/wyników generowania wideo |
  | `plugin-sdk/video-generation-core` | Wspólny video-generation core | Typy generowania wideo, helpery failover, wyszukiwanie providera i parsowanie model-ref |
  | `plugin-sdk/interactive-runtime` | Helpery odpowiedzi interaktywnych | Normalizacja/redukcja payloadów odpowiedzi interaktywnych |
  | `plugin-sdk/channel-config-primitives` | Prymitywy konfiguracji kanału | Wąskie prymitywy channel config-schema |
  | `plugin-sdk/channel-config-writes` | Helpery zapisu konfiguracji kanału | Helpery autoryzacji zapisu konfiguracji kanału |
  | `plugin-sdk/channel-plugin-common` | Wspólne preludium kanału | Eksporty współdzielonego preludium Plugin kanału |
  | `plugin-sdk/channel-status` | Helpery statusu kanału | Współdzielone helpery snapshotów/podsumowań statusu kanału |
  | `plugin-sdk/allowlist-config-edit` | Helpery konfiguracji allowlisty | Helpery edycji/odczytu konfiguracji allowlisty |
  | `plugin-sdk/group-access` | Helpery dostępu grupowego | Współdzielone helpery decyzji dostępu grupowego |
  | `plugin-sdk/direct-dm` | Helpery bezpośredniego DM | Współdzielone helpery uwierzytelniania/guard bezpośredniego DM |
  | `plugin-sdk/extension-shared` | Współdzielone helpery rozszerzeń | Prymitywy helperów passive-channel/status i ambient proxy |
  | `plugin-sdk/webhook-targets` | Helpery targetów Webhook | Rejestr targetów Webhook i helpery instalacji tras |
  | `plugin-sdk/webhook-path` | Helpery ścieżek Webhook | Helpery normalizacji ścieżek Webhook |
  | `plugin-sdk/web-media` | Współdzielone helpery web media | Helpery ładowania zdalnych/lokalnych mediów |
  | `plugin-sdk/zod` | Re-eksport Zod | Re-eksportowany `zod` dla konsumentów Plugin SDK |
  | `plugin-sdk/memory-core` | Helpery bundled memory-core | Powierzchnia helperów menedżera/konfiguracji/plików/CLI pamięci |
  | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime silnika pamięci | Fasada runtime indeksowania/wyszukiwania pamięci |
  | `plugin-sdk/memory-core-host-engine-foundation` | Podstawowy silnik hosta pamięci | Eksporty podstawowego silnika hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Silnik embedding hosta pamięci | Kontrakty embedding, dostęp do rejestru, lokalny provider i ogólne helpery batch/zdalne; konkretni zdalni providerzy znajdują się we własnych Plugin |
  | `plugin-sdk/memory-core-host-engine-qmd` | Silnik QMD hosta pamięci | Eksporty silnika QMD hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-storage` | Silnik storage hosta pamięci | Eksporty silnika storage hosta pamięci |
  | `plugin-sdk/memory-core-host-multimodal` | Helpery multimodal hosta pamięci | Helpery multimodal hosta pamięci |
  | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci | Helpery zapytań hosta pamięci |
  | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci | Helpery sekretów hosta pamięci |
  | `plugin-sdk/memory-core-host-events` | Helpery dziennika zdarzeń hosta pamięci | Helpery dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-core-host-status` | Helpery statusu hosta pamięci | Helpery statusu hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI hosta pamięci | Helpery runtime CLI hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-core` | Główny runtime hosta pamięci | Helpery głównego runtime hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/runtime hosta pamięci | Helpery plików/runtime hosta pamięci |
  | `plugin-sdk/memory-host-core` | Alias głównego runtime hosta pamięci | Neutralny vendorowo alias helperów głównego runtime hosta pamięci |
  | `plugin-sdk/memory-host-events` | Alias dziennika zdarzeń hosta pamięci | Neutralny vendorowo alias helperów dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-host-files` | Alias plików/runtime hosta pamięci | Neutralny vendorowo alias helperów plików/runtime hosta pamięci |
  | `plugin-sdk/memory-host-markdown` | Helpery zarządzanego Markdown | Współdzielone helpery managed-markdown dla Plugin powiązanych z pamięcią |
  | `plugin-sdk/memory-host-search` | Fasada wyszukiwania Active Memory | Leniwa fasada runtime menedżera wyszukiwania Active Memory |
  | `plugin-sdk/memory-host-status` | Alias statusu hosta pamięci | Neutralny vendorowo alias helperów statusu hosta pamięci |
  | `plugin-sdk/memory-lancedb` | Helpery bundled memory-lancedb | Powierzchnia helperów memory-lancedb |
  | `plugin-sdk/testing` | Narzędzia testowe | Helpery testowe i mocki |
</Accordion>

Ta tabela jest celowo wspólnym podzbiorem migracyjnym, a nie pełną
powierzchnią SDK. Pełna lista ponad 200 punktów wejścia znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`.

Ta lista nadal zawiera niektóre seamy helperów bundled plugin, takie jak
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` i `plugin-sdk/matrix*`. Pozostają one eksportowane na potrzeby
utrzymania bundled plugin i zgodności, ale celowo pominięto je w tabeli typowej migracji
i nie są zalecanym celem dla nowego kodu Plugin.

Ta sama zasada dotyczy innych rodzin bundled helperów, takich jak:

- helpery obsługi przeglądarki: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- bundled helper/plugin surfaces, takie jak `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` i `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` obecnie udostępnia wąską
powierzchnię helperów tokenów: `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` i `resolveCopilotApiToken`.

Używaj najwęższego importu pasującego do zadania. Jeśli nie możesz znaleźć eksportu,
sprawdź źródła w `src/plugin-sdk/` albo zapytaj na Discord.

## Harmonogram usunięcia

| Kiedy                  | Co się stanie                                                            |
| ---------------------- | ------------------------------------------------------------------------ |
| **Teraz**              | Deprecated surfaces emitują ostrzeżenia runtime                          |
| **Następne główne wydanie** | Deprecated surfaces zostaną usunięte; Plugins, które nadal ich używają, przestaną działać |

Wszystkie core Plugins zostały już zmigrowane. Zewnętrzne Plugins powinny przeprowadzić migrację
przed następnym głównym wydaniem.

## Tymczasowe wyciszenie ostrzeżeń

Ustaw te zmienne środowiskowe podczas pracy nad migracją:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

To tymczasowy escape hatch, a nie trwałe rozwiązanie.

## Powiązane

- [Getting Started](/pl/plugins/building-plugins) — zbuduj swój pierwszy Plugin
- [SDK Overview](/pl/plugins/sdk-overview) — pełna dokumentacja referencyjna importów subpath
- [Channel Plugins](/pl/plugins/sdk-channel-plugins) — tworzenie Plugin kanałów
- [Provider Plugins](/pl/plugins/sdk-provider-plugins) — tworzenie Plugin providerów
- [Plugin Internals](/pl/plugins/architecture) — dogłębne omówienie architektury
- [Plugin Manifest](/pl/plugins/manifest) — dokumentacja referencyjna schematu manifestu
