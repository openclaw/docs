---
read_when:
    - Widzisz ostrzeżenie OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Widzisz ostrzeżenie OPENCLAW_EXTENSION_API_DEPRECATED
    - Aktualizujesz plugin do nowoczesnej architektury pluginów
    - Utrzymujesz zewnętrzny plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Migracja ze starszej warstwy zgodności wstecznej do nowoczesnego Plugin SDK
title: Migracja Plugin SDK
x-i18n:
    generated_at: "2026-04-21T09:57:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: d3d2ea9a8cc869b943ad774ac0ddb8828b80ce86432ece7b9aeed4f1edb30859
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migracja Plugin SDK

OpenClaw przeszedł ze szerokiej warstwy zgodności wstecznej do nowoczesnej architektury
pluginów z ukierunkowanymi, udokumentowanymi importami. Jeśli twój plugin został zbudowany przed
nową architekturą, ten przewodnik pomoże ci przeprowadzić migrację.

## Co się zmienia

Stary system pluginów udostępniał dwie szeroko otwarte powierzchnie, które pozwalały pluginom importować
wszystko, czego potrzebowały, z jednego punktu wejścia:

- **`openclaw/plugin-sdk/compat`** — pojedynczy import, który reeksportował dziesiątki
  helperów. Został wprowadzony, aby starsze pluginy oparte na hookach nadal działały, gdy
  budowano nową architekturę pluginów.
- **`openclaw/extension-api`** — pomost, który dawał pluginom bezpośredni dostęp do
  helperów po stronie hosta, takich jak osadzony runner agenta.

Obie powierzchnie są teraz **deprecated**. Nadal działają w runtime, ale nowe
pluginy nie mogą już ich używać, a istniejące pluginy powinny przeprowadzić migrację przed następnym
głównym wydaniem, które je usunie.

<Warning>
  Warstwa zgodności wstecznej zostanie usunięta w przyszłym głównym wydaniu.
  Pluginy, które nadal importują z tych powierzchni, przestaną działać, gdy to nastąpi.
</Warning>

## Dlaczego to się zmieniło

Stare podejście powodowało problemy:

- **Powolny start** — import jednego helpera ładował dziesiątki niepowiązanych modułów
- **Zależności cykliczne** — szerokie reeksporty ułatwiały tworzenie cykli importów
- **Niejasna powierzchnia API** — nie było sposobu, by stwierdzić, które eksporty były stabilne, a które wewnętrzne

Nowoczesne Plugin SDK to naprawia: każda ścieżka importu (`openclaw/plugin-sdk/\<subpath\>`)
jest małym, samodzielnym modułem o jasno określonym celu i udokumentowanym kontrakcie.

Starsze wygodne szwy dostawców dla bundlowanych kanałów również zniknęły. Importy
takie jak `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
szwy helperów oznaczone marką kanału oraz
`openclaw/plugin-sdk/telegram-core` były prywatnymi skrótami mono-repo, a nie
stabilnymi kontraktami pluginów. Zamiast tego używaj wąskich, ogólnych podścieżek SDK. Wewnątrz
bundlowanego workspace pluginu trzymaj helpery należące do dostawcy we własnym
`api.ts` lub `runtime-api.ts` tego pluginu.

Aktualne przykłady bundlowanych dostawców:

- Anthropic trzyma helpery strumieniowania specyficzne dla Claude we własnym szwie `api.ts` /
  `contract-api.ts`
- OpenAI trzyma buildery dostawców, helpery modeli domyślnych i buildery dostawców realtime
  we własnym `api.ts`
- OpenRouter trzyma builder dostawcy oraz helpery onboardingu/konfiguracji we własnym
  `api.ts`

## Jak przeprowadzić migrację

<Steps>
  <Step title="Przenieś handlery natywnych zatwierdzeń na capability facts">
    Pluginy kanałów obsługujące zatwierdzenia udostępniają teraz natywne zachowanie zatwierdzeń przez
    `approvalCapability.nativeRuntime` plus współdzielony rejestr kontekstu runtime.

    Kluczowe zmiany:

    - Zastąp `approvalCapability.handler.loadRuntime(...)` przez
      `approvalCapability.nativeRuntime`
    - Przenieś uwierzytelnianie/dostarczanie specyficzne dla zatwierdzeń ze starszego okablowania `plugin.auth` /
      `plugin.approvals` do `approvalCapability`
    - `ChannelPlugin.approvals` zostało usunięte z publicznego kontraktu
      pluginu kanału; przenieś pola delivery/native/render do `approvalCapability`
    - `plugin.auth` pozostaje tylko dla przepływów logowania/wylogowania kanału; hooki
      uwierzytelniania zatwierdzeń w tym miejscu nie są już odczytywane przez core
    - Rejestruj obiekty runtime należące do kanału, takie jak klienty, tokeny lub aplikacje
      Bolt, przez `openclaw/plugin-sdk/channel-runtime-context`
    - Nie wysyłaj komunikatów o przekierowaniu należących do pluginu z natywnych handlerów zatwierdzeń;
      core zarządza teraz komunikatami o przekierowaniu gdzie indziej na podstawie rzeczywistych wyników dostarczania
    - Przy przekazywaniu `channelRuntime` do `createChannelManager(...)` podaj
      rzeczywistą powierzchnię `createPluginRuntime().channel`. Częściowe stuby są odrzucane.

    Zobacz `/plugins/sdk-channel-plugins`, aby sprawdzić bieżący układ
    capability zatwierdzeń.

  </Step>

  <Step title="Przeprowadź audyt zachowania zapasowego Windows wrapper">
    Jeśli twój plugin używa `openclaw/plugin-sdk/windows-spawn`, nierozwiązane wrapery Windows
    `.cmd`/`.bat` kończą się teraz bezpieczną odmową, chyba że jawnie przekażesz
    `allowShellFallback: true`.

    ```typescript
    // Przed
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Po
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Ustaw to tylko dla zaufanych wywołań zgodności, które celowo
      // akceptują zapasowe przejście przez powłokę.
      allowShellFallback: true,
    });
    ```

    Jeśli twój kod wywołujący nie polega celowo na zapasowym przejściu przez powłokę, nie ustawiaj
    `allowShellFallback` i zamiast tego obsłuż zgłaszany błąd.

  </Step>

  <Step title="Znajdź deprecated importy">
    Przeszukaj plugin pod kątem importów z którejkolwiek z deprecated powierzchni:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Zastąp ukierunkowanymi importami">
    Każdy eksport ze starej powierzchni mapuje się na konkretną nowoczesną ścieżkę importu:

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

    W przypadku helperów po stronie hosta używaj wstrzykniętego runtime pluginu zamiast importować
    je bezpośrednio:

    ```typescript
    // Przed (deprecated pomost extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Po (wstrzyknięty runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Ten sam wzorzec dotyczy innych helperów starszego pomostu:

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

## Referencja ścieżek importu

  <Accordion title="Tabela typowych ścieżek importu">
  | Import path | Przeznaczenie | Kluczowe eksporty |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanoniczny helper wpisu pluginu | `definePluginEntry` |
  | `plugin-sdk/core` | Starszy zbiorczy reeksport dla definicji/builderów wpisów kanałów | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Eksport schematu konfiguracji głównej | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper wpisu pojedynczego dostawcy | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Ukierunkowane definicje i buildery wpisów kanałów | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Współdzielone helpery kreatora konfiguracji | Monity allowlisty, buildery statusu konfiguracji |
  | `plugin-sdk/setup-runtime` | Helpery runtime czasu konfiguracji | Bezpieczne względem importu adaptery poprawek konfiguracji, helpery notatek wyszukiwania, `promptResolvedAllowFrom`, `splitSetupEntries`, delegowane proxy konfiguracji |
  | `plugin-sdk/setup-adapter-runtime` | Helpery adaptera konfiguracji | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpery narzędzi konfiguracji | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpery wielu kont | Helpery listy kont/konfiguracji/bramek działań |
  | `plugin-sdk/account-id` | Helpery account-id | `DEFAULT_ACCOUNT_ID`, normalizacja account-id |
  | `plugin-sdk/account-resolution` | Helpery wyszukiwania kont | Helpery wyszukiwania kont + zapasowego konta domyślnego |
  | `plugin-sdk/account-helpers` | Wąskie helpery kont | Helpery listy kont/działań konta |
  | `plugin-sdk/channel-setup` | Adaptery kreatora konfiguracji | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Prymitywy parowania DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Okablowanie prefiksu odpowiedzi + typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabryki adapterów konfiguracji | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Buildery schematów konfiguracji | Typy schematów konfiguracji kanałów |
  | `plugin-sdk/telegram-command-config` | Helpery konfiguracji poleceń Telegram | Normalizacja nazw poleceń, przycinanie opisów, walidacja duplikatów/konfliktów |
  | `plugin-sdk/channel-policy` | Rozwiązywanie zasad grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Śledzenie statusu konta | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helpery kopert wejściowych | Współdzielone helpery routingu + buildera kopert |
  | `plugin-sdk/inbound-reply-dispatch` | Helpery odpowiedzi wejściowych | Współdzielone helpery zapisu i dispatch |
  | `plugin-sdk/messaging-targets` | Parsowanie celów wiadomości | Helpery parsowania/dopasowywania celów |
  | `plugin-sdk/outbound-media` | Helpery mediów wychodzących | Współdzielone ładowanie mediów wychodzących |
  | `plugin-sdk/outbound-runtime` | Helpery runtime wychodzącego | Helpery tożsamości/send delegate oraz planowania ładunku wychodzącego |
  | `plugin-sdk/thread-bindings-runtime` | Helpery powiązań wątków | Helpery cyklu życia powiązań wątków i adapterów |
  | `plugin-sdk/agent-media-payload` | Starsze helpery ładunku mediów | Builder ładunku mediów agenta dla starszych układów pól |
  | `plugin-sdk/channel-runtime` | Deprecated shim zgodności | Tylko starsze narzędzia runtime kanału |
  | `plugin-sdk/channel-send-result` | Typy wyników wysyłki | Typy wyników odpowiedzi |
  | `plugin-sdk/runtime-store` | Trwałe przechowywanie pluginu | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Szerokie helpery runtime | Helpery runtime/logowania/backupu/instalacji pluginów |
  | `plugin-sdk/runtime-env` | Wąskie helpery środowiska runtime | Logger/środowisko runtime, timeout, retry i helpery backoff |
  | `plugin-sdk/plugin-runtime` | Współdzielone helpery runtime pluginów | Helpery plugin commands/hooks/http/interactive |
  | `plugin-sdk/hook-runtime` | Helpery pipeline hooków | Współdzielone helpery pipeline webhooków/wewnętrznych hooków |
  | `plugin-sdk/lazy-runtime` | Helpery lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpery procesów | Współdzielone helpery exec |
  | `plugin-sdk/cli-runtime` | Helpery CLI runtime | Formatowanie poleceń, oczekiwania, helpery wersji |
  | `plugin-sdk/gateway-runtime` | Helpery Gateway | Klient Gateway i helpery poprawek statusu kanałów |
  | `plugin-sdk/config-runtime` | Helpery konfiguracji | Helpery ładowania/zapisu konfiguracji |
  | `plugin-sdk/telegram-command-config` | Helpery poleceń Telegram | Stabilne zapasowe helpery walidacji poleceń Telegram, gdy bundlowana powierzchnia kontraktu Telegram jest niedostępna |
  | `plugin-sdk/approval-runtime` | Helpery promptów zatwierdzeń | Ładunek zatwierdzeń exec/plugin, helpery capability/profili zatwierdzeń, helpery natywnego routingu/runtime zatwierdzeń |
  | `plugin-sdk/approval-auth-runtime` | Helpery uwierzytelniania zatwierdzeń | Rozwiązywanie zatwierdzających, uwierzytelnianie działań w tym samym czacie |
  | `plugin-sdk/approval-client-runtime` | Helpery klienta zatwierdzeń | Helpery natywnych profili/filtrów zatwierdzeń exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpery dostarczania zatwierdzeń | Adaptery capability/dostarczania natywnych zatwierdzeń |
  | `plugin-sdk/approval-gateway-runtime` | Helpery Gateway zatwierdzeń | Współdzielony helper rozwiązywania Gateway zatwierdzeń |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpery adaptera zatwierdzeń | Lekkie helpery ładowania adapterów natywnych zatwierdzeń dla gorących entrypointów kanałów |
  | `plugin-sdk/approval-handler-runtime` | Helpery handlerów zatwierdzeń | Szersze helpery runtime handlerów zatwierdzeń; preferuj węższe szwy adapter/gateway, gdy są wystarczające |
  | `plugin-sdk/approval-native-runtime` | Helpery celów zatwierdzeń | Helpery powiązań celów/kont natywnych zatwierdzeń |
  | `plugin-sdk/approval-reply-runtime` | Helpery odpowiedzi zatwierdzeń | Helpery ładunku odpowiedzi zatwierdzeń exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Helpery channel runtime-context | Ogólne helpery register/get/watch channel runtime-context |
  | `plugin-sdk/security-runtime` | Helpery bezpieczeństwa | Współdzielone helpery zaufania, bramkowania DM, treści zewnętrznych i zbierania sekretów |
  | `plugin-sdk/ssrf-policy` | Helpery zasad SSRF | Helpery allowlisty hostów i zasad sieci prywatnej |
  | `plugin-sdk/ssrf-runtime` | Helpery SSRF runtime | Pinned-dispatcher, guarded fetch, helpery zasad SSRF |
  | `plugin-sdk/collection-runtime` | Helpery ograniczonej pamięci podręcznej | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpery bramkowania diagnostyki | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpery formatowania błędów | `formatUncaughtError`, `isApprovalNotFoundError`, helpery grafu błędów |
  | `plugin-sdk/fetch-runtime` | Helpery opakowanego fetch/proxy | `resolveFetch`, helpery proxy |
  | `plugin-sdk/host-runtime` | Helpery normalizacji hosta | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpery retry | `RetryConfig`, `retryAsync`, uruchamiacze polityk |
  | `plugin-sdk/allow-from` | Formatowanie allowlisty | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapowanie wejść allowlisty | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Bramkowanie poleceń i helpery powierzchni poleceń | `resolveControlCommandGate`, helpery autoryzacji nadawcy, helpery rejestru poleceń |
  | `plugin-sdk/command-status` | Renderery statusu/pomocy poleceń | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsowanie danych wejściowych sekretów | Helpery danych wejściowych sekretów |
  | `plugin-sdk/webhook-ingress` | Helpery żądań Webhook | Narzędzia docelowe Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpery guardów żądań Webhook | Helpery odczytu/limitów treści żądań |
  | `plugin-sdk/reply-runtime` | Współdzielony runtime odpowiedzi | Dispatch wejściowy, Heartbeat, planner odpowiedzi, dzielenie na części |
  | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery dispatch odpowiedzi | Helpery finalize + provider dispatch |
  | `plugin-sdk/reply-history` | Helpery historii odpowiedzi | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planowanie odniesień odpowiedzi | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpery dzielenia odpowiedzi | Helpery dzielenia tekstu/markdown |
  | `plugin-sdk/session-store-runtime` | Helpery magazynu sesji | Helpery ścieżki magazynu + updated-at |
  | `plugin-sdk/state-paths` | Helpery ścieżek stanu | Helpery katalogów stanu i OAuth |
  | `plugin-sdk/routing` | Helpery routingu/kluczy sesji | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpery normalizacji kluczy sesji |
  | `plugin-sdk/status-helpers` | Helpery statusu kanałów | Buildery podsumowań statusu kanału/konta, domyślne stany runtime, helpery metadanych problemów |
  | `plugin-sdk/target-resolver-runtime` | Helpery rozwiązywania celów | Współdzielone helpery rozwiązywania celów |
  | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji stringów | Helpery normalizacji slugów/stringów |
  | `plugin-sdk/request-url` | Helpery adresów URL żądań | Wyodrębnianie stringowych URL z wejść podobnych do żądań |
  | `plugin-sdk/run-command` | Helpery poleceń z limitem czasu | Runner poleceń z limitem czasu ze znormalizowanym stdout/stderr |
  | `plugin-sdk/param-readers` | Odczytywanie parametrów | Typowe odczyty parametrów narzędzi/CLI |
  | `plugin-sdk/tool-payload` | Ekstrakcja ładunku narzędzia | Wyodrębnianie znormalizowanych ładunków z obiektów wyników narzędzi |
  | `plugin-sdk/tool-send` | Ekstrakcja wysyłki narzędzia | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzi |
  | `plugin-sdk/temp-path` | Helpery ścieżek tymczasowych | Współdzielone helpery ścieżek tymczasowego pobierania |
  | `plugin-sdk/logging-core` | Helpery logowania | Helpery loggera podsystemu i redakcji |
  | `plugin-sdk/markdown-table-runtime` | Helpery tabel markdown | Helpery trybu tabel markdown |
  | `plugin-sdk/reply-payload` | Typy odpowiedzi wiadomości | Typy ładunku odpowiedzi |
  | `plugin-sdk/provider-setup` | Kuratorowane helpery konfiguracji dostawców local/self-hosted | Helpery wykrywania/konfiguracji dostawców self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane helpery konfiguracji dostawców self-hosted kompatybilnych z OpenAI | Te same helpery wykrywania/konfiguracji dostawców self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helpery runtime uwierzytelniania dostawców | Helpery rozwiązywania kluczy API w runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpery konfiguracji kluczy API dostawców | Helpery onboardingu/zapisu profilu klucza API |
  | `plugin-sdk/provider-auth-result` | Helpery wyniku uwierzytelniania dostawcy | Standardowy builder wyniku uwierzytelniania OAuth |
  | `plugin-sdk/provider-auth-login` | Helpery interaktywnego logowania dostawców | Współdzielone helpery interaktywnego logowania |
  | `plugin-sdk/provider-env-vars` | Helpery zmiennych środowiskowych dostawców | Helpery wyszukiwania zmiennych środowiskowych uwierzytelniania dostawców |
  | `plugin-sdk/provider-model-shared` | Współdzielone helpery modeli/replay dostawców | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone buildery polityk replay, helpery endpointów dostawców i helpery normalizacji identyfikatorów modeli |
  | `plugin-sdk/provider-catalog-shared` | Współdzielone helpery katalogu dostawców | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Poprawki onboardingu dostawców | Helpery konfiguracji onboardingu |
  | `plugin-sdk/provider-http` | Helpery HTTP dostawców | Ogólne helpery HTTP/zdolności endpointów dostawców |
  | `plugin-sdk/provider-web-fetch` | Helpery web-fetch dostawców | Helpery rejestracji/pamięci podręcznej dostawców web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpery konfiguracji web-search dostawców | Wąskie helpery konfiguracji/poświadczeń web-search dla dostawców, którzy nie potrzebują okablowania włączania pluginu |
  | `plugin-sdk/provider-web-search-contract` | Helpery kontraktów web-search dostawców | Wąskie helpery kontraktu konfiguracji/poświadczeń web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowe settery/gettery poświadczeń |
  | `plugin-sdk/provider-web-search` | Helpery web-search dostawców | Helpery rejestracji/pamięci podręcznej/runtime dostawców web-search |
  | `plugin-sdk/provider-tools` | Helpery zgodności narzędzi/schematów dostawców | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematu Gemini + diagnostyka oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpery użycia dostawców | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` i inne helpery użycia dostawców |
  | `plugin-sdk/provider-stream` | Helpery wrapperów strumieni dostawców | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz współdzielone helpery wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpery transportu dostawców | Natywne helpery transportu dostawców, takie jak guarded fetch, transformacje komunikatów transportu i zapisywalne strumienie zdarzeń transportu |
  | `plugin-sdk/keyed-async-queue` | Uporządkowana kolejka async | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Współdzielone helpery mediów | Helpery pobierania/transformacji/przechowywania mediów oraz buildery ładunków mediów |
  | `plugin-sdk/media-generation-runtime` | Współdzielone helpery generowania mediów | Współdzielone helpery failover, wybór kandydatów i komunikaty o brakującym modelu dla generowania obrazów/wideo/muzyki |
  | `plugin-sdk/media-understanding` | Helpery rozumienia mediów | Typy dostawców rozumienia mediów oraz eksporty helperów obrazów/audio skierowane do dostawców |
  | `plugin-sdk/text-runtime` | Współdzielone helpery tekstu | Usuwanie tekstu widocznego dla asystenta, helpery renderowania/dzielenia/tabel markdown, helpery redakcji, helpery tagów dyrektyw, narzędzia bezpiecznego tekstu oraz powiązane helpery tekstu/logowania |
  | `plugin-sdk/text-chunking` | Helpery dzielenia tekstu | Helper dzielenia tekstu wychodzącego |
  | `plugin-sdk/speech` | Helpery mowy | Typy dostawców mowy oraz helpery dyrektyw, rejestru i walidacji skierowane do dostawców |
  | `plugin-sdk/speech-core` | Współdzielony rdzeń mowy | Typy dostawców mowy, rejestr, dyrektywy, normalizacja |
  | `plugin-sdk/realtime-transcription` | Helpery realtime transcription | Typy dostawców i helpery rejestru |
  | `plugin-sdk/realtime-voice` | Helpery realtime voice | Typy dostawców i helpery rejestru |
  | `plugin-sdk/image-generation-core` | Współdzielony rdzeń generowania obrazów | Typy generowania obrazów, helpery failover, uwierzytelniania i rejestru |
  | `plugin-sdk/music-generation` | Helpery generowania muzyki | Typy dostawcy/żądania/wyniku generowania muzyki |
  | `plugin-sdk/music-generation-core` | Współdzielony rdzeń generowania muzyki | Typy generowania muzyki, helpery failover, wyszukiwanie dostawców i parsowanie model-ref |
  | `plugin-sdk/video-generation` | Helpery generowania wideo | Typy dostawcy/żądania/wyniku generowania wideo |
  | `plugin-sdk/video-generation-core` | Współdzielony rdzeń generowania wideo | Typy generowania wideo, helpery failover, wyszukiwanie dostawców i parsowanie model-ref |
  | `plugin-sdk/interactive-runtime` | Helpery odpowiedzi interaktywnych | Normalizacja/redukcja ładunków odpowiedzi interaktywnych |
  | `plugin-sdk/channel-config-primitives` | Prymitywy konfiguracji kanałów | Wąskie prymitywy channel config-schema |
  | `plugin-sdk/channel-config-writes` | Helpery zapisu konfiguracji kanałów | Helpery autoryzacji zapisu konfiguracji kanałów |
  | `plugin-sdk/channel-plugin-common` | Współdzielone preludium kanału | Współdzielone eksporty preludium pluginów kanałów |
  | `plugin-sdk/channel-status` | Helpery statusu kanałów | Współdzielone helpery migawek/podsumowań statusu kanałów |
  | `plugin-sdk/allowlist-config-edit` | Helpery konfiguracji allowlisty | Helpery edycji/odczytu konfiguracji allowlisty |
  | `plugin-sdk/group-access` | Helpery dostępu grupowego | Współdzielone helpery decyzji dostępu grupowego |
  | `plugin-sdk/direct-dm` | Helpery bezpośrednich DM | Współdzielone helpery uwierzytelniania/guardów bezpośrednich DM |
  | `plugin-sdk/extension-shared` | Współdzielone helpery rozszerzeń | Prymitywy helperów pasywnych kanałów/statusu i ambient proxy |
  | `plugin-sdk/webhook-targets` | Helpery celów Webhook | Rejestr celów Webhook i helpery instalacji tras |
  | `plugin-sdk/webhook-path` | Helpery ścieżek Webhook | Helpery normalizacji ścieżek Webhook |
  | `plugin-sdk/web-media` | Współdzielone helpery web media | Helpery ładowania zdalnych/lokalnych mediów |
  | `plugin-sdk/zod` | Reeksport Zod | Reeksportowane `zod` dla konsumentów Plugin SDK |
  | `plugin-sdk/memory-core` | Bundlowane helpery memory-core | Powierzchnia helperów menedżera/konfiguracji/plików/CLI pamięci |
  | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime silnika pamięci | Fasada runtime indeksu/wyszukiwania pamięci |
  | `plugin-sdk/memory-core-host-engine-foundation` | Silnik fundamentów hosta pamięci | Eksporty silnika fundamentów hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Silnik embeddingów hosta pamięci | Kontrakty embeddingów pamięci, dostęp do rejestru, dostawca lokalny i ogólne helpery batch/zdalne; konkretni zdalni dostawcy znajdują się w należących do nich pluginach |
  | `plugin-sdk/memory-core-host-engine-qmd` | Silnik QMD hosta pamięci | Eksporty silnika QMD hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-storage` | Silnik storage hosta pamięci | Eksporty silnika storage hosta pamięci |
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
  | `plugin-sdk/memory-host-search` | Fasada wyszukiwania Active Memory | Lazy fasada runtime menedżera wyszukiwania active-memory |
  | `plugin-sdk/memory-host-status` | Alias statusu hosta pamięci | Neutralny względem dostawcy alias helperów statusu hosta pamięci |
  | `plugin-sdk/memory-lancedb` | Bundlowane helpery memory-lancedb | Powierzchnia helperów memory-lancedb |
  | `plugin-sdk/testing` | Narzędzia testowe | Helpery testowe i mocki |
</Accordion>

Ta tabela jest celowo wspólnym podzbiorem migracyjnym, a nie pełną powierzchnią
SDK. Pełna lista ponad 200 entrypointów znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`.

Ta lista nadal zawiera niektóre szwy helperów bundlowanych pluginów, takie jak
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` oraz `plugin-sdk/matrix*`. Nadal są one eksportowane na potrzeby
utrzymania bundlowanych pluginów i zgodności, ale celowo pominięto je we wspólnej tabeli migracyjnej i nie są zalecanym celem dla
nowego kodu pluginów.

Ta sama zasada dotyczy innych rodzin bundlowanych helperów, takich jak:

- helpery obsługi przeglądarki: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- bundlowane powierzchnie helperów/pluginów, takie jak `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` i `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` obecnie udostępnia wąską powierzchnię helperów tokena
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` oraz `resolveCopilotApiToken`.

Używaj możliwie najwęższego importu pasującego do zadania. Jeśli nie możesz znaleźć eksportu,
sprawdź źródło w `src/plugin-sdk/` albo zapytaj na Discord.

## Harmonogram usunięcia

| Kiedy                  | Co się stanie                                                          |
| ---------------------- | ---------------------------------------------------------------------- |
| **Teraz**              | Deprecated powierzchnie emitują ostrzeżenia runtime                    |
| **Następne główne wydanie** | Deprecated powierzchnie zostaną usunięte; pluginy nadal ich używające przestaną działać |

Wszystkie pluginy core zostały już zmigrowane. Zewnętrzne pluginy powinny przeprowadzić migrację
przed następnym głównym wydaniem.

## Tymczasowe wyciszenie ostrzeżeń

Ustaw te zmienne środowiskowe podczas pracy nad migracją:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

To tymczasowa furtka awaryjna, a nie trwałe rozwiązanie.

## Powiązane

- [Pierwsze kroki](/pl/plugins/building-plugins) — zbuduj swój pierwszy plugin
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełna referencja importów podścieżek
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — budowanie pluginów kanałów
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — budowanie pluginów dostawców
- [Wnętrze pluginów](/pl/plugins/architecture) — dogłębne omówienie architektury
- [Manifest pluginu](/pl/plugins/manifest) — referencja schematu manifestu
