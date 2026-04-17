---
read_when:
    - Widzisz ostrzeżenie `OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED`
    - Widzisz ostrzeżenie `OPENCLAW_EXTENSION_API_DEPRECATED`
    - Aktualizujesz plugin do nowoczesnej architektury pluginów
    - Utrzymujesz zewnętrzny plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Przejdź z przestarzałej warstwy kompatybilności wstecznej na nowoczesny Plugin SDK
title: Migracja Plugin SDK
x-i18n:
    generated_at: "2026-04-17T09:49:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0283f949eec358a12a0709db846cde2a1509f28e5c60db6e563cb8a540b979d
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migracja Plugin SDK

OpenClaw przeszedł od szerokiej warstwy kompatybilności wstecznej do nowoczesnej architektury pluginów z ukierunkowanymi, udokumentowanymi importami. Jeśli Twój plugin został zbudowany przed wprowadzeniem nowej architektury, ten przewodnik pomoże Ci przeprowadzić migrację.

## Co się zmienia

Stary system pluginów udostępniał dwie szeroko otwarte powierzchnie, które pozwalały pluginom importować wszystko, czego potrzebowały, z jednego punktu wejścia:

- **`openclaw/plugin-sdk/compat`** — pojedynczy import, który re-eksportował dziesiątki helperów. Został wprowadzony po to, aby starsze pluginy oparte na hookach nadal działały podczas tworzenia nowej architektury pluginów.
- **`openclaw/extension-api`** — pomost, który dawał pluginom bezpośredni dostęp do helperów po stronie hosta, takich jak osadzony runner agenta.

Obie te powierzchnie są teraz **przestarzałe**. Nadal działają w czasie działania, ale nowe pluginy nie mogą z nich korzystać, a istniejące pluginy powinny przejść migrację, zanim kolejna główna wersja je usunie.

<Warning>
  Warstwa kompatybilności wstecznej zostanie usunięta w jednej z przyszłych głównych wersji.
  Pluginy, które nadal importują z tych powierzchni, przestaną działać, gdy to nastąpi.
</Warning>

## Dlaczego to się zmieniło

Stare podejście powodowało problemy:

- **Wolne uruchamianie** — zaimportowanie jednego helpera ładowało dziesiątki niepowiązanych modułów
- **Zależności cykliczne** — szerokie re-eksporty ułatwiały tworzenie cykli importów
- **Niejasna powierzchnia API** — nie było sposobu, aby określić, które eksporty są stabilne, a które wewnętrzne

Nowoczesny Plugin SDK rozwiązuje ten problem: każda ścieżka importu (`openclaw/plugin-sdk/\<subpath\>`) jest małym, samodzielnym modułem z jasno określonym celem i udokumentowanym kontraktem.

Starsze wygodne warstwy providerów dla wbudowanych kanałów również zostały usunięte. Importy takie jak `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, helperowe warstwy oznaczone marką kanału oraz `openclaw/plugin-sdk/telegram-core` były prywatnymi skrótami mono-repo, a nie stabilnymi kontraktami pluginów. Zamiast tego używaj wąskich, generycznych podścieżek SDK. W obrębie workspace wbudowanych pluginów trzymaj helpery należące do providera we własnym `api.ts` lub `runtime-api.ts` tego pluginu.

Aktualne przykłady wbudowanych providerów:

- Anthropic przechowuje helpery strumieni specyficzne dla Claude we własnej warstwie `api.ts` / `contract-api.ts`
- OpenAI przechowuje buildery providerów, helpery modeli domyślnych i buildery providerów realtime we własnym `api.ts`
- OpenRouter przechowuje helpery buildera providera oraz onboarding/config we własnym `api.ts`

## Jak przeprowadzić migrację

<Steps>
  <Step title="Przenieś handlery natywne dla zatwierdzeń do faktów capability">
    Pluginy kanałów obsługujące zatwierdzenia udostępniają teraz natywne zachowanie zatwierdzeń przez `approvalCapability.nativeRuntime` wraz ze współdzielonym rejestrem kontekstu runtime.

    Najważniejsze zmiany:

    - Zastąp `approvalCapability.handler.loadRuntime(...)` przez `approvalCapability.nativeRuntime`
    - Przenieś uwierzytelnianie/dostarczanie specyficzne dla zatwierdzeń ze starszego połączenia `plugin.auth` / `plugin.approvals` do `approvalCapability`
    - `ChannelPlugin.approvals` zostało usunięte z publicznego kontraktu pluginu kanału; przenieś pola delivery/native/render do `approvalCapability`
    - `plugin.auth` pozostaje wyłącznie dla przepływów logowania/wylogowania kanału; hooki uwierzytelniania zatwierdzeń nie są już tam odczytywane przez core
    - Rejestruj obiekty runtime należące do kanału, takie jak klienci, tokeny lub aplikacje Bolt, przez `openclaw/plugin-sdk/channel-runtime-context`
    - Nie wysyłaj komunikatów o przekierowaniu należących do pluginu z natywnych handlerów zatwierdzeń; core obsługuje teraz komunikaty „dostarczono gdzie indziej” na podstawie rzeczywistych wyników dostarczenia
    - Przy przekazywaniu `channelRuntime` do `createChannelManager(...)` podaj rzeczywistą powierzchnię `createPluginRuntime().channel`. Częściowe stuby są odrzucane.

    Aktualny układ capability zatwierdzeń znajdziesz w `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Sprawdź zachowanie fallbacku wrappera Windows">
    Jeśli Twój plugin używa `openclaw/plugin-sdk/windows-spawn`, nierozwiązane wrappery Windows `.cmd`/`.bat` teraz domyślnie kończą się błędem, chyba że jawnie przekażesz `allowShellFallback: true`.

    ```typescript
    // Przed
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Po
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Ustaw to tylko dla zaufanych wywołań zgodności, które celowo
      // akceptują fallback pośredniczony przez shell.
      allowShellFallback: true,
    });
    ```

    Jeśli Twój kod wywołujący nie polega celowo na fallbacku shella, nie ustawiaj `allowShellFallback` i zamiast tego obsłuż zgłaszany błąd.

  </Step>

  <Step title="Znajdź przestarzałe importy">
    Przeszukaj plugin pod kątem importów z którejkolwiek z przestarzałych powierzchni:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Zastąp je ukierunkowanymi importami">
    Każdy eksport ze starej powierzchni odpowiada określonej nowoczesnej ścieżce importu:

    ```typescript
    // Przed (przestarzała warstwa kompatybilności wstecznej)
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

    W przypadku helperów po stronie hosta używaj wstrzykniętego runtime pluginu zamiast importować je bezpośrednio:

    ```typescript
    // Przed (przestarzały pomost extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Po (wstrzyknięty runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Ten sam wzorzec dotyczy innych starszych helperów pomostu:

    | Stary import | Nowoczesny odpowiednik |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpery magazynu sesji | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Zbuduj i przetestuj">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Odniesienie do ścieżek importu

  <Accordion title="Tabela typowych ścieżek importu">
  | Ścieżka importu | Przeznaczenie | Kluczowe eksporty |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanoniczny helper punktu wejścia pluginu | `definePluginEntry` |
  | `plugin-sdk/core` | Starszy zbiorczy re-eksport dla definicji/builderów punktów wejścia kanału | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Eksport głównego schematu konfiguracji | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper punktu wejścia pojedynczego providera | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Ukierunkowane definicje i buildery punktów wejścia kanału | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Współdzielone helpery kreatora konfiguracji | Prompty allowlisty, buildery statusu konfiguracji |
  | `plugin-sdk/setup-runtime` | Helpery runtime dla czasu konfiguracji | Bezpieczne dla importu adaptery łatek konfiguracji, helpery notatek lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, delegowane proxy konfiguracji |
  | `plugin-sdk/setup-adapter-runtime` | Helpery adaptera konfiguracji | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpery narzędzi konfiguracji | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpery dla wielu kont | Helpery list kont/konfiguracji/bramek akcji |
  | `plugin-sdk/account-id` | Helpery account-id | `DEFAULT_ACCOUNT_ID`, normalizacja account-id |
  | `plugin-sdk/account-resolution` | Helpery wyszukiwania kont | Helpery wyszukiwania konta + fallbacku domyślnego |
  | `plugin-sdk/account-helpers` | Wąskie helpery kont | Helpery list kont/akcji na kontach |
  | `plugin-sdk/channel-setup` | Adaptery kreatora konfiguracji | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, a także `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Prymitywy parowania DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Logika prefiksu odpowiedzi + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabryki adapterów konfiguracji | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Buildery schematu konfiguracji | Typy schematu konfiguracji kanału |
  | `plugin-sdk/telegram-command-config` | Helpery konfiguracji komend Telegram | Normalizacja nazw komend, przycinanie opisów, walidacja duplikatów/konfliktów |
  | `plugin-sdk/channel-policy` | Rozwiązywanie polityk grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Śledzenie statusu konta | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helpery kopert wejściowych | Współdzielone helpery routingu + buildera kopert |
  | `plugin-sdk/inbound-reply-dispatch` | Helpery odpowiedzi wejściowych | Współdzielone helpery zapisu i dyspozycji |
  | `plugin-sdk/messaging-targets` | Parsowanie celów wiadomości | Helpery parsowania/dopasowywania celów |
  | `plugin-sdk/outbound-media` | Helpery mediów wychodzących | Współdzielone ładowanie mediów wychodzących |
  | `plugin-sdk/outbound-runtime` | Helpery runtime dla ruchu wychodzącego | Helpery tożsamości wychodzącej/delegatów wysyłki |
  | `plugin-sdk/thread-bindings-runtime` | Helpery powiązań wątków | Helpery cyklu życia powiązań wątków i adapterów |
  | `plugin-sdk/agent-media-payload` | Starsze helpery payloadów mediów | Builder payloadu mediów agenta dla starszych układów pól |
  | `plugin-sdk/channel-runtime` | Przestarzała warstwa zgodności | Tylko starsze narzędzia channel runtime |
  | `plugin-sdk/channel-send-result` | Typy wyników wysyłki | Typy wyników odpowiedzi |
  | `plugin-sdk/runtime-store` | Trwałe przechowywanie pluginu | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Szerokie helpery runtime | Helpery runtime/logowania/kopii zapasowej/instalacji pluginu |
  | `plugin-sdk/runtime-env` | Wąskie helpery środowiska runtime | Logger/runtime env, helpery timeout, retry i backoff |
  | `plugin-sdk/plugin-runtime` | Współdzielone helpery runtime pluginu | Helpery poleceń/hooków/http/interaktywne pluginu |
  | `plugin-sdk/hook-runtime` | Helpery pipeline hooków | Współdzielone helpery pipeline webhooków/wewnętrznych hooków |
  | `plugin-sdk/lazy-runtime` | Helpery lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpery procesów | Współdzielone helpery exec |
  | `plugin-sdk/cli-runtime` | Helpery runtime CLI | Formatowanie komend, oczekiwania, helpery wersji |
  | `plugin-sdk/gateway-runtime` | Helpery Gateway | Klient Gateway i helpery łatek statusu kanału |
  | `plugin-sdk/config-runtime` | Helpery konfiguracji | Helpery ładowania/zapisu konfiguracji |
  | `plugin-sdk/telegram-command-config` | Helpery komend Telegram | Helpery walidacji komend Telegram o stabilnym fallbacku, gdy powierzchnia kontraktu wbudowanego Telegram jest niedostępna |
  | `plugin-sdk/approval-runtime` | Helpery promptów zatwierdzeń | Payload wykonania/pluginu zatwierdzeń, helpery capability/profili zatwierdzeń, helpery routingu/runtime dla natywnych zatwierdzeń |
  | `plugin-sdk/approval-auth-runtime` | Helpery uwierzytelniania zatwierdzeń | Rozwiązywanie approvera, uwierzytelnianie działań w tym samym czacie |
  | `plugin-sdk/approval-client-runtime` | Helpery klienta zatwierdzeń | Helpery profili/filtrów natywnych zatwierdzeń wykonania |
  | `plugin-sdk/approval-delivery-runtime` | Helpery dostarczania zatwierdzeń | Adaptery capability/dostarczania natywnych zatwierdzeń |
  | `plugin-sdk/approval-gateway-runtime` | Helpery Gateway dla zatwierdzeń | Współdzielony helper rozwiązywania approval gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpery adaptera zatwierdzeń | Lekkie helpery ładowania natywnego adaptera zatwierdzeń dla gorących punktów wejścia kanału |
  | `plugin-sdk/approval-handler-runtime` | Helpery handlera zatwierdzeń | Szersze helpery runtime handlera zatwierdzeń; preferuj węższe warstwy adapter/gateway, gdy są wystarczające |
  | `plugin-sdk/approval-native-runtime` | Helpery celu zatwierdzeń | Helpery powiązań celu/konta dla natywnych zatwierdzeń |
  | `plugin-sdk/approval-reply-runtime` | Helpery odpowiedzi zatwierdzeń | Helpery payloadów odpowiedzi zatwierdzeń wykonania/pluginu |
  | `plugin-sdk/channel-runtime-context` | Helpery runtime-context kanału | Generyczne helpery register/get/watch dla runtime-context kanału |
  | `plugin-sdk/security-runtime` | Helpery bezpieczeństwa | Współdzielone helpery zaufania, bramkowania DM, treści zewnętrznych i zbierania sekretów |
  | `plugin-sdk/ssrf-policy` | Helpery polityki SSRF | Helpery allowlisty hostów i polityki sieci prywatnych |
  | `plugin-sdk/ssrf-runtime` | Helpery runtime SSRF | Przypięty dispatcher, guardowany fetch, helpery polityki SSRF |
  | `plugin-sdk/collection-runtime` | Helpery ograniczonej pamięci podręcznej | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpery bramkowania diagnostyki | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpery formatowania błędów | `formatUncaughtError`, `isApprovalNotFoundError`, helpery grafu błędów |
  | `plugin-sdk/fetch-runtime` | Helpery opakowanego fetch/proxy | `resolveFetch`, helpery proxy |
  | `plugin-sdk/host-runtime` | Helpery normalizacji hosta | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpery retry | `RetryConfig`, `retryAsync`, uruchamiacze polityk |
  | `plugin-sdk/allow-from` | Formatowanie allowlisty | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapowanie wejścia allowlisty | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Bramkowanie komend i helpery powierzchni komend | `resolveControlCommandGate`, helpery autoryzacji nadawcy, helpery rejestru komend |
  | `plugin-sdk/command-status` | Renderery statusu/pomocy komend | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsowanie wejścia sekretów | Helpery wejścia sekretów |
  | `plugin-sdk/webhook-ingress` | Helpery żądań Webhook | Narzędzia celu Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpery ochrony żądań Webhook body | Helpery odczytu/limitów body żądania |
  | `plugin-sdk/reply-runtime` | Współdzielony runtime odpowiedzi | Dyspozycja wejściowa, Heartbeat, planner odpowiedzi, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery dyspozycji odpowiedzi | Helpery finalizacji + dyspozycji providera |
  | `plugin-sdk/reply-history` | Helpery historii odpowiedzi | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planowanie referencji odpowiedzi | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpery chunków odpowiedzi | Helpery chunkingu tekstu/markdown |
  | `plugin-sdk/session-store-runtime` | Helpery magazynu sesji | Ścieżka magazynu + helpery updated-at |
  | `plugin-sdk/state-paths` | Helpery ścieżek stanu | Helpery katalogów stanu i OAuth |
  | `plugin-sdk/routing` | Helpery routingu/session-key | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpery normalizacji session-key |
  | `plugin-sdk/status-helpers` | Helpery statusu kanału | Buildery podsumowania statusu kanału/konta, domyślne wartości stanu runtime, helpery metadanych problemów |
  | `plugin-sdk/target-resolver-runtime` | Helpery resolvera celu | Współdzielone helpery resolvera celu |
  | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji ciągów | Helpery normalizacji slugów/ciągów |
  | `plugin-sdk/request-url` | Helpery URL żądania | Wyodrębnianie tekstowych URL-i z wejść podobnych do request |
  | `plugin-sdk/run-command` | Helpery poleceń z pomiarem czasu | Runner poleceń z normalizowanym stdout/stderr |
  | `plugin-sdk/param-readers` | Czytniki parametrów | Typowe czytniki parametrów narzędzi/CLI |
  | `plugin-sdk/tool-payload` | Wyodrębnianie payloadu narzędzi | Wyodrębnianie znormalizowanych payloadów z obiektów wyników narzędzi |
  | `plugin-sdk/tool-send` | Wyodrębnianie wysyłki narzędzi | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
  | `plugin-sdk/temp-path` | Helpery ścieżek tymczasowych | Współdzielone helpery ścieżek tymczasowego pobierania |
  | `plugin-sdk/logging-core` | Helpery logowania | Logger podsystemu i helpery redakcji |
  | `plugin-sdk/markdown-table-runtime` | Helpery tabel markdown | Helpery trybu tabel markdown |
  | `plugin-sdk/reply-payload` | Typy payloadów odpowiedzi | Typy payloadów odpowiedzi |
  | `plugin-sdk/provider-setup` | Kuratorowane helpery konfiguracji providerów lokalnych/self-hosted | Helpery wykrywania/konfiguracji providerów self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane helpery konfiguracji self-hosted providerów zgodnych z OpenAI | Te same helpery wykrywania/konfiguracji providerów self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helpery runtime uwierzytelniania providera | Helpery rozwiązywania kluczy API runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpery konfiguracji kluczy API providera | Helpery onboardingu/zapisu profilu kluczy API |
  | `plugin-sdk/provider-auth-result` | Helpery wyników uwierzytelniania providera | Standardowy builder wyniku uwierzytelniania OAuth |
  | `plugin-sdk/provider-auth-login` | Helpery interaktywnego logowania providera | Współdzielone helpery interaktywnego logowania |
  | `plugin-sdk/provider-env-vars` | Helpery zmiennych środowiskowych providera | Helpery wyszukiwania zmiennych środowiskowych uwierzytelniania providera |
  | `plugin-sdk/provider-model-shared` | Współdzielone helpery modeli/odtwarzania providera | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone buildery polityki replay, helpery endpointów providera oraz helpery normalizacji model-id |
  | `plugin-sdk/provider-catalog-shared` | Współdzielone helpery katalogu providera | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Łatki onboardingu providera | Helpery konfiguracji onboardingu |
  | `plugin-sdk/provider-http` | Helpery HTTP providera | Generyczne helpery HTTP/endpoint capability providera |
  | `plugin-sdk/provider-web-fetch` | Helpery web-fetch providera | Helpery rejestracji/pamięci podręcznej providera web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpery konfiguracji web-search providera | Wąskie helpery konfiguracji/poświadczeń web-search dla providerów, które nie potrzebują połączenia enable plugin |
  | `plugin-sdk/provider-web-search-contract` | Helpery kontraktu web-search providera | Wąskie helpery kontraktu konfiguracji/poświadczeń web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowane settery/gettery poświadczeń |
  | `plugin-sdk/provider-web-search` | Helpery web-search providera | Helpery rejestracji/pamięci podręcznej/runtime providera web-search |
  | `plugin-sdk/provider-tools` | Helpery zgodności narzędzi/schematów providera | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematu Gemini + diagnostyka oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpery użycia providera | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` oraz inne helpery użycia providera |
  | `plugin-sdk/provider-stream` | Helpery wrapperów strumieni providera | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz współdzielone helpery wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Uporządkowana kolejka async | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Współdzielone helpery mediów | Helpery pobierania/przekształcania/przechowywania mediów oraz buildery payloadów mediów |
  | `plugin-sdk/media-generation-runtime` | Współdzielone helpery generowania mediów | Współdzielone helpery failover, wybór kandydatów i komunikaty o brakującym modelu dla generowania obrazów/wideo/muzyki |
  | `plugin-sdk/media-understanding` | Helpery media-understanding | Typy providera media understanding oraz eksporty helperów obrazów/audio skierowane do providerów |
  | `plugin-sdk/text-runtime` | Współdzielone helpery tekstowe | Usuwanie tekstu widocznego dla asystenta, helpery renderowania/chunkingu/tabel markdown, helpery redakcji, helpery tagów dyrektyw, narzędzia safe-text oraz powiązane helpery tekstowe/logowania |
  | `plugin-sdk/text-chunking` | Helpery chunkingu tekstu | Helper chunkingu tekstu wychodzącego |
  | `plugin-sdk/speech` | Helpery speech | Typy providerów speech oraz helpery dyrektyw, rejestru i walidacji skierowane do providerów |
  | `plugin-sdk/speech-core` | Współdzielony rdzeń speech | Typy providerów speech, rejestr, dyrektywy, normalizacja |
  | `plugin-sdk/realtime-transcription` | Helpery transkrypcji realtime | Typy providerów i helpery rejestru |
  | `plugin-sdk/realtime-voice` | Helpery głosu realtime | Typy providerów i helpery rejestru |
  | `plugin-sdk/image-generation-core` | Współdzielony rdzeń generowania obrazów | Typy generowania obrazów, helpery failover, auth i rejestru |
  | `plugin-sdk/music-generation` | Helpery generowania muzyki | Typy providera/żądania/wyniku generowania muzyki |
  | `plugin-sdk/music-generation-core` | Współdzielony rdzeń generowania muzyki | Typy generowania muzyki, helpery failover, wyszukiwanie providera i parsowanie model-ref |
  | `plugin-sdk/video-generation` | Helpery generowania wideo | Typy providera/żądania/wyniku generowania wideo |
  | `plugin-sdk/video-generation-core` | Współdzielony rdzeń generowania wideo | Typy generowania wideo, helpery failover, wyszukiwanie providera i parsowanie model-ref |
  | `plugin-sdk/interactive-runtime` | Helpery odpowiedzi interaktywnych | Normalizacja/redukcja payloadów odpowiedzi interaktywnych |
  | `plugin-sdk/channel-config-primitives` | Prymitywy konfiguracji kanału | Wąskie prymitywy channel config-schema |
  | `plugin-sdk/channel-config-writes` | Helpery zapisu konfiguracji kanału | Helpery autoryzacji zapisu konfiguracji kanału |
  | `plugin-sdk/channel-plugin-common` | Współdzielone preludium kanału | Eksporty współdzielonego preludium pluginu kanału |
  | `plugin-sdk/channel-status` | Helpery statusu kanału | Współdzielone helpery snapshotów/podsumowań statusu kanału |
  | `plugin-sdk/allowlist-config-edit` | Helpery konfiguracji allowlisty | Helpery edycji/odczytu konfiguracji allowlisty |
  | `plugin-sdk/group-access` | Helpery dostępu grupowego | Współdzielone helpery decyzji dostępu grupowego |
  | `plugin-sdk/direct-dm` | Helpery Direct-DM | Współdzielone helpery auth/guard Direct-DM |
  | `plugin-sdk/extension-shared` | Współdzielone helpery rozszerzeń | Prymitywy helperów passive-channel/status i ambient proxy |
  | `plugin-sdk/webhook-targets` | Helpery celów Webhook | Rejestr celów Webhook i helpery instalacji tras |
  | `plugin-sdk/webhook-path` | Helpery ścieżek Webhook | Helpery normalizacji ścieżek Webhook |
  | `plugin-sdk/web-media` | Współdzielone helpery mediów web | Helpery ładowania mediów zdalnych/lokalnych |
  | `plugin-sdk/zod` | Re-eksport Zod | Re-eksportowane `zod` dla odbiorców Plugin SDK |
  | `plugin-sdk/memory-core` | Wbudowane helpery memory-core | Powierzchnia helperów menedżera pamięci/konfiguracji/plików/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime silnika pamięci | Fasada runtime indeksowania/wyszukiwania pamięci |
  | `plugin-sdk/memory-core-host-engine-foundation` | Silnik foundation hosta pamięci | Eksporty silnika foundation hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Silnik embedding hosta pamięci | Kontrakty embeddingów pamięci, dostęp do rejestru, lokalny provider oraz generyczne helpery batch/zdalne; konkretni zdalni providerzy pozostają we własnych pluginach |
  | `plugin-sdk/memory-core-host-engine-qmd` | Silnik QMD hosta pamięci | Eksporty silnika QMD hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-storage` | Silnik przechowywania hosta pamięci | Eksporty silnika przechowywania hosta pamięci |
  | `plugin-sdk/memory-core-host-multimodal` | Helpery multimodalne hosta pamięci | Helpery multimodalne hosta pamięci |
  | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci | Helpery zapytań hosta pamięci |
  | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci | Helpery sekretów hosta pamięci |
  | `plugin-sdk/memory-core-host-events` | Helpery dziennika zdarzeń hosta pamięci | Helpery dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-core-host-status` | Helpery statusu hosta pamięci | Helpery statusu hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI hosta pamięci | Helpery runtime CLI hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-core` | Główny runtime hosta pamięci | Helpery głównego runtime hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/runtime hosta pamięci | Helpery plików/runtime hosta pamięci |
  | `plugin-sdk/memory-host-core` | Alias głównego runtime hosta pamięci | Neutralny względem dostawcy alias helperów głównego runtime hosta pamięci |
  | `plugin-sdk/memory-host-events` | Alias dziennika zdarzeń hosta pamięci | Neutralny względem dostawcy alias helperów dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-host-files` | Alias plików/runtime hosta pamięci | Neutralny względem dostawcy alias helperów plików/runtime hosta pamięci |
  | `plugin-sdk/memory-host-markdown` | Helpery zarządzanego markdown | Współdzielone helpery zarządzanego markdown dla pluginów powiązanych z pamięcią |
  | `plugin-sdk/memory-host-search` | Fasada wyszukiwania Active Memory | Lenewa fasada runtime menedżera wyszukiwania active memory |
  | `plugin-sdk/memory-host-status` | Alias statusu hosta pamięci | Neutralny względem dostawcy alias helperów statusu hosta pamięci |
  | `plugin-sdk/memory-lancedb` | Wbudowane helpery memory-lancedb | Powierzchnia helperów memory-lancedb |
  | `plugin-sdk/testing` | Narzędzia testowe | Helpery testowe i mocki |
</Accordion>

Ta tabela jest celowo wspólnym podzbiorem migracyjnym, a nie pełną powierzchnią SDK. Pełna lista ponad 200 punktów wejścia znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`.

Ta lista nadal zawiera niektóre warstwy helperów wbudowanych pluginów, takie jak
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` oraz `plugin-sdk/matrix*`. Nadal są one eksportowane na potrzeby utrzymania i zgodności wbudowanych pluginów, ale celowo pominięto je w tabeli wspólnej migracji i nie są zalecanym celem dla nowego kodu pluginów.

Ta sama zasada dotyczy innych rodzin helperów wbudowanych, takich jak:

- helpery obsługi przeglądarki: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- powierzchnie helperów/pluginów wbudowanych, takie jak `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` oraz `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` obecnie udostępnia wąską powierzchnię helperów tokenów:
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` oraz `resolveCopilotApiToken`.

Używaj możliwie najwęższego importu, który odpowiada danemu zadaniu. Jeśli nie możesz znaleźć eksportu, sprawdź źródła w `src/plugin-sdk/` lub zapytaj na Discord.

## Harmonogram usunięcia

| Kiedy | Co się stanie |
| ---------------------- | ----------------------------------------------------------------------- |
| **Teraz** | Przestarzałe powierzchnie emitują ostrzeżenia w runtime |
| **Następna główna wersja** | Przestarzałe powierzchnie zostaną usunięte; pluginy, które nadal z nich korzystają, przestaną działać |

Wszystkie pluginy core zostały już zmigrowane. Zewnętrzne pluginy powinny przejść migrację przed następną główną wersją.

## Tymczasowe wyciszenie ostrzeżeń

Ustaw te zmienne środowiskowe podczas pracy nad migracją:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

To tymczasowy mechanizm awaryjny, a nie trwałe rozwiązanie.

## Powiązane

- [Pierwsze kroki](/pl/plugins/building-plugins) — zbuduj swój pierwszy plugin
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełne odniesienie do importów podścieżek
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — tworzenie pluginów kanałów
- [Pluginy providerów](/pl/plugins/sdk-provider-plugins) — tworzenie pluginów providerów
- [Wnętrze pluginów](/pl/plugins/architecture) — szczegółowe omówienie architektury
- [Manifest pluginu](/pl/plugins/manifest) — odniesienie do schematu manifestu
