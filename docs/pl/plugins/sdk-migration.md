---
read_when:
    - Widzisz ostrzeżenie OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Widzisz ostrzeżenie OPENCLAW_EXTENSION_API_DEPRECATED
    - Aktualizujesz wtyczkę do nowoczesnej architektury wtyczek
    - Utrzymujesz zewnętrzną wtyczkę OpenClaw
sidebarTitle: Migrate to SDK
summary: Migracja ze starszej warstwy zgodności wstecznej do nowoczesnego SDK wtyczek
title: Migracja Plugin SDK
x-i18n:
    generated_at: "2026-04-07T09:48:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3691060e9dc00ca8bee49240a047f0479398691bd14fb96e9204cc9243fdb32c
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migracja Plugin SDK

OpenClaw przeszedł od szerokiej warstwy zgodności wstecznej do nowoczesnej
architektury wtyczek z precyzyjnymi, udokumentowanymi importami. Jeśli Twoja
wtyczka została zbudowana przed wprowadzeniem nowej architektury, ten przewodnik
pomoże Ci przeprowadzić migrację.

## Co się zmienia

Stary system wtyczek udostępniał dwie szeroko otwarte powierzchnie, które pozwalały wtyczkom importować
wszystko, czego potrzebowały, z jednego punktu wejścia:

- **`openclaw/plugin-sdk/compat`** — pojedynczy import, który re-eksportował dziesiątki
  helperów. Został wprowadzony, aby utrzymać działanie starszych wtyczek opartych na hookach,
  podczas gdy budowano nową architekturę wtyczek.
- **`openclaw/extension-api`** — most, który dawał wtyczkom bezpośredni dostęp do
  helperów po stronie hosta, takich jak osadzony runner agenta.

Obie powierzchnie są teraz **przestarzałe**. Nadal działają w czasie wykonywania, ale nowe
wtyczki nie mogą ich używać, a istniejące wtyczki powinny przeprowadzić migrację, zanim kolejna
główna wersja je usunie.

<Warning>
  Warstwa zgodności wstecznej zostanie usunięta w jednej z przyszłych głównych wersji.
  Wtyczki, które nadal importują z tych powierzchni, przestaną działać, gdy to nastąpi.
</Warning>

## Dlaczego to się zmieniło

Stare podejście powodowało problemy:

- **Powolny start** — zaimportowanie jednego helpera ładowało dziesiątki niezwiązanych modułów
- **Zależności cykliczne** — szerokie re-eksporty ułatwiały tworzenie cykli importu
- **Niejasna powierzchnia API** — nie było sposobu, aby stwierdzić, które eksporty są stabilne, a które wewnętrzne

Nowoczesne SDK wtyczek rozwiązuje ten problem: każda ścieżka importu (`openclaw/plugin-sdk/\<subpath\>`)
jest małym, samodzielnym modułem z jasno określonym przeznaczeniem i udokumentowanym kontraktem.

Starsze wygodne granice dostawców dla dołączonych kanałów również zniknęły. Importy
takie jak `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
pomocnicze granice oznaczone marką kanału oraz
`openclaw/plugin-sdk/telegram-core` były prywatnymi skrótami monorepo, a nie
stabilnymi kontraktami wtyczek. Zamiast tego używaj wąskich, generycznych ścieżek podrzędnych SDK. W obrębie
dołączonego workspace wtyczek trzymaj helpery należące do dostawcy we własnym
`api.ts` lub `runtime-api.ts` tej wtyczki.

Aktualne przykłady dołączonych dostawców:

- Anthropic przechowuje helpery strumieni specyficzne dla Claude we własnej granicy `api.ts` /
  `contract-api.ts`
- OpenAI przechowuje konstruktory dostawcy, helpery modeli domyślnych i konstruktory
  dostawców realtime we własnym `api.ts`
- OpenRouter przechowuje konstruktor dostawcy oraz helpery onboardingu/konfiguracji we własnym
  `api.ts`

## Jak przeprowadzić migrację

<Steps>
  <Step title="Sprawdź zachowanie fallbacku wrappera Windows">
    Jeśli Twoja wtyczka używa `openclaw/plugin-sdk/windows-spawn`, nierozwiązane wrappery Windows
    `.cmd`/`.bat` teraz kończą działanie w trybie fail-closed, chyba że jawnie przekażesz
    `allowShellFallback: true`.

    ```typescript
    // Przed
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Po
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Ustaw to tylko dla zaufanych wywołań zgodności, które celowo
      // akceptują fallback pośredniczony przez powłokę.
      allowShellFallback: true,
    });
    ```

    Jeśli Twój kod wywołujący nie polega celowo na fallbacku powłoki, nie ustawiaj
    `allowShellFallback` i zamiast tego obsłuż zgłoszony błąd.

  </Step>

  <Step title="Znajdź przestarzałe importy">
    Przeszukaj swoją wtyczkę pod kątem importów z jednej z tych przestarzałych powierzchni:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Zastąp je precyzyjnymi importami">
    Każdy eksport ze starej powierzchni mapuje się na konkretną nowoczesną ścieżkę importu:

    ```typescript
    // Przed (przestarzała warstwa zgodności wstecznej)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // Po (nowoczesne precyzyjne importy)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    W przypadku helperów po stronie hosta użyj wstrzykniętego runtime wtyczki zamiast importować je
    bezpośrednio:

    ```typescript
    // Przed (przestarzały most extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Po (wstrzyknięty runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Ten sam wzorzec dotyczy innych helperów starszego mostu:

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

## Dokumentacja ścieżek importu

<Accordion title="Tabela typowych ścieżek importu">
  | Ścieżka importu | Przeznaczenie | Kluczowe eksporty |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanoniczny helper punktu wejścia wtyczki | `definePluginEntry` |
  | `plugin-sdk/core` | Starszy parasolowy re-eksport dla definicji/builderów punktów wejścia kanału | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Eksport schematu głównej konfiguracji | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper punktu wejścia pojedynczego dostawcy | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Precyzyjne definicje i buildery punktów wejścia kanału | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Wspólne helpery kreatora konfiguracji | Prompty allowlisty, buildery statusu konfiguracji |
  | `plugin-sdk/setup-runtime` | Helpery runtime dla czasu konfiguracji | Bezpieczne importowo adaptery poprawek konfiguracji, helpery notatek wyszukiwania, `promptResolvedAllowFrom`, `splitSetupEntries`, delegowane proxy konfiguracji |
  | `plugin-sdk/setup-adapter-runtime` | Helpery adaptera konfiguracji | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpery narzędzi konfiguracji | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpery wielu kont | Helpery listy kont/konfiguracji/bramkowania działań |
  | `plugin-sdk/account-id` | Helpery identyfikatora konta | `DEFAULT_ACCOUNT_ID`, normalizacja identyfikatora konta |
  | `plugin-sdk/account-resolution` | Helpery wyszukiwania konta | Helpery wyszukiwania konta + fallbacku do wartości domyślnej |
  | `plugin-sdk/account-helpers` | Wąskie helpery konta | Helpery listy kont/działań na koncie |
  | `plugin-sdk/channel-setup` | Adaptery kreatora konfiguracji | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, a także `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Prymitywy parowania DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Łączenie prefiksu odpowiedzi i typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabryki adapterów konfiguracji | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Buildery schematów konfiguracji | Typy schematów konfiguracji kanału |
  | `plugin-sdk/telegram-command-config` | Helpery konfiguracji poleceń Telegram | Normalizacja nazw poleceń, przycinanie opisów, walidacja duplikatów/konfliktów |
  | `plugin-sdk/channel-policy` | Rozstrzyganie polityki grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Śledzenie statusu konta | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helpery koperty wejściowej | Wspólne helpery routingu i budowania koperty |
  | `plugin-sdk/inbound-reply-dispatch` | Helpery odpowiedzi wejściowej | Wspólne helpery zapisu i dyspozycji |
  | `plugin-sdk/messaging-targets` | Parsowanie celów wiadomości | Helpery parsowania/dopasowywania celów |
  | `plugin-sdk/outbound-media` | Helpery mediów wychodzących | Wspólne ładowanie mediów wychodzących |
  | `plugin-sdk/outbound-runtime` | Helpery runtime dla ruchu wychodzącego | Helpery tożsamości wychodzącej/delegatów wysyłki |
  | `plugin-sdk/thread-bindings-runtime` | Helpery powiązań wątków | Helpery cyklu życia powiązań wątków i adapterów |
  | `plugin-sdk/agent-media-payload` | Starsze helpery ładunku mediów | Builder ładunku mediów agenta dla starszych układów pól |
  | `plugin-sdk/channel-runtime` | Przestarzały shim zgodności | Tylko starsze narzędzia runtime kanału |
  | `plugin-sdk/channel-send-result` | Typy wyników wysyłki | Typy wyników odpowiedzi |
  | `plugin-sdk/runtime-store` | Trwałe przechowywanie wtyczki | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Szerokie helpery runtime | Helpery runtime/logowania/kopii zapasowych/instalacji wtyczek |
  | `plugin-sdk/runtime-env` | Wąskie helpery środowiska runtime | Logger/środowisko runtime, timeout, retry i helpery backoff |
  | `plugin-sdk/plugin-runtime` | Wspólne helpery runtime wtyczek | Helpery poleceń/hooków/http/interaktywne dla wtyczek |
  | `plugin-sdk/hook-runtime` | Helpery pipeline hooków | Wspólne helpery pipeline webhooków/wewnętrznych hooków |
  | `plugin-sdk/lazy-runtime` | Helpery leniwego runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpery procesów | Wspólne helpery exec |
  | `plugin-sdk/cli-runtime` | Helpery runtime CLI | Formatowanie poleceń, oczekiwania, helpery wersji |
  | `plugin-sdk/gateway-runtime` | Helpery Gateway | Klient Gateway i helpery poprawek statusu kanałów |
  | `plugin-sdk/config-runtime` | Helpery konfiguracji | Helpery ładowania/zapisu konfiguracji |
  | `plugin-sdk/telegram-command-config` | Helpery poleceń Telegram | Stabilne w fallbacku helpery walidacji poleceń Telegram, gdy dołączona powierzchnia kontraktu Telegram jest niedostępna |
  | `plugin-sdk/approval-runtime` | Helpery promptów zatwierdzania | Ładunek zatwierdzania exec/wtyczki, helpery capability/profili zatwierdzania, natywny routing/runtime zatwierdzania |
  | `plugin-sdk/approval-auth-runtime` | Helpery uwierzytelniania zatwierdzania | Rozstrzyganie zatwierdzającego, uwierzytelnianie akcji w tym samym czacie |
  | `plugin-sdk/approval-client-runtime` | Helpery klienta zatwierdzania | Natywne helpery profili/filtrów zatwierdzania exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpery dostarczania zatwierdzania | Natywne adaptery capability/dostarczania zatwierdzania |
  | `plugin-sdk/approval-native-runtime` | Helpery celu zatwierdzania | Natywne helpery celu zatwierdzania/powiązania konta |
  | `plugin-sdk/approval-reply-runtime` | Helpery odpowiedzi zatwierdzania | Helpery ładunku odpowiedzi zatwierdzania exec/wtyczki |
  | `plugin-sdk/security-runtime` | Helpery bezpieczeństwa | Wspólne helpery zaufania, bramkowania DM, treści zewnętrznych i zbierania sekretów |
  | `plugin-sdk/ssrf-policy` | Helpery polityki SSRF | Helpery allowlisty hostów i polityki sieci prywatnych |
  | `plugin-sdk/ssrf-runtime` | Helpery runtime SSRF | Helpery pinned-dispatcher, guarded fetch i polityki SSRF |
  | `plugin-sdk/collection-runtime` | Helpery ograniczonego cache | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpery bramkowania diagnostyki | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpery formatowania błędów | `formatUncaughtError`, `isApprovalNotFoundError`, helpery grafu błędów |
  | `plugin-sdk/fetch-runtime` | Helpery opakowanego fetch/proxy | `resolveFetch`, helpery proxy |
  | `plugin-sdk/host-runtime` | Helpery normalizacji hosta | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpery retry | `RetryConfig`, `retryAsync`, wykonawcy polityk |
  | `plugin-sdk/allow-from` | Formatowanie allowlisty | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapowanie wejść allowlisty | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Bramkowanie poleceń i helpery powierzchni poleceń | `resolveControlCommandGate`, helpery autoryzacji nadawcy, helpery rejestru poleceń |
  | `plugin-sdk/secret-input` | Parsowanie wejścia sekretów | Helpery wejścia sekretów |
  | `plugin-sdk/webhook-ingress` | Helpery żądań webhook | Narzędzia celu webhooka |
  | `plugin-sdk/webhook-request-guards` | Helpery strażników treści webhooka | Helpery odczytu/limitów treści żądania |
  | `plugin-sdk/reply-runtime` | Wspólny runtime odpowiedzi | Dyspozycja wejściowa, heartbeat, planer odpowiedzi, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery dyspozycji odpowiedzi | Helpery finalizacji i dyspozycji dostawcy |
  | `plugin-sdk/reply-history` | Helpery historii odpowiedzi | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planowanie referencji odpowiedzi | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpery chunków odpowiedzi | Helpery dzielenia tekstu/Markdown |
  | `plugin-sdk/session-store-runtime` | Helpery session store | Helpery ścieżki store i updated-at |
  | `plugin-sdk/state-paths` | Helpery ścieżek stanu | Helpery katalogów stanu i OAuth |
  | `plugin-sdk/routing` | Helpery routingu/kluczy sesji | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpery normalizacji klucza sesji |
  | `plugin-sdk/status-helpers` | Helpery statusu kanałów | Buildery podsumowania statusu kanału/konta, domyślne wartości stanu runtime, helpery metadanych problemów |
  | `plugin-sdk/target-resolver-runtime` | Helpery rozstrzygania celu | Wspólne helpery rozstrzygania celu |
  | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji ciągów | Helpery normalizacji slugów/ciągów |
  | `plugin-sdk/request-url` | Helpery URL żądania | Wyodrębnianie tekstowych URL-i z wejść podobnych do żądania |
  | `plugin-sdk/run-command` | Helpery poleceń z pomiarem czasu | Runner poleceń z normalizowanym stdout/stderr |
  | `plugin-sdk/param-readers` | Odczytywacze parametrów | Typowe odczytywacze parametrów narzędzi/CLI |
  | `plugin-sdk/tool-send` | Ekstrakcja wysyłki narzędzia | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
  | `plugin-sdk/temp-path` | Helpery ścieżek tymczasowych | Wspólne helpery ścieżek tymczasowego pobierania |
  | `plugin-sdk/logging-core` | Helpery logowania | Logger podsystemu i helpery redakcji |
  | `plugin-sdk/markdown-table-runtime` | Helpery tabel Markdown | Helpery trybu tabel Markdown |
  | `plugin-sdk/reply-payload` | Typy ładunku odpowiedzi | Typy ładunku odpowiedzi |
  | `plugin-sdk/provider-setup` | Kuratorowane helpery konfiguracji lokalnego/self-hosted dostawcy | Helpery wykrywania/konfiguracji self-hosted dostawcy |
  | `plugin-sdk/self-hosted-provider-setup` | Precyzyjne helpery konfiguracji self-hosted dostawców zgodnych z OpenAI | Te same helpery wykrywania/konfiguracji self-hosted dostawcy |
  | `plugin-sdk/provider-auth-runtime` | Helpery runtime uwierzytelniania dostawcy | Helpery rozstrzygania kluczy API w runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpery konfiguracji klucza API dostawcy | Helpery onboardingu/zapisu profilu dla kluczy API |
  | `plugin-sdk/provider-auth-result` | Helpery wyniku uwierzytelniania dostawcy | Standardowy builder wyniku uwierzytelniania OAuth |
  | `plugin-sdk/provider-auth-login` | Helpery interaktywnego logowania dostawcy | Wspólne helpery interaktywnego logowania |
  | `plugin-sdk/provider-env-vars` | Helpery zmiennych środowiskowych dostawcy | Helpery wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
  | `plugin-sdk/provider-model-shared` | Wspólne helpery modeli/replay dostawców | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, wspólne buildery polityki replay, helpery punktów końcowych dostawcy i helpery normalizacji identyfikatorów modeli |
  | `plugin-sdk/provider-catalog-shared` | Wspólne helpery katalogu dostawcy | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Poprawki onboardingu dostawcy | Helpery konfiguracji onboardingu |
  | `plugin-sdk/provider-http` | Helpery HTTP dostawcy | Generyczne helpery HTTP/zdolności punktów końcowych dostawcy |
  | `plugin-sdk/provider-web-fetch` | Helpery web-fetch dostawcy | Helpery rejestracji/cache dostawcy web-fetch |
  | `plugin-sdk/provider-web-search-contract` | Helpery kontraktu web-search dostawcy | Wąskie helpery kontraktu konfiguracji/poświadczeń web-search, takie jak `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowane settery/gettery poświadczeń |
  | `plugin-sdk/provider-web-search` | Helpery web-search dostawcy | Helpery rejestracji/cache/runtime dostawcy web-search |
  | `plugin-sdk/provider-tools` | Helpery zgodności narzędzi/schematów dostawcy | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematów Gemini + diagnostyka oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpery użycia dostawcy | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` i inne helpery użycia dostawcy |
  | `plugin-sdk/provider-stream` | Helpery wrapperów strumieni dostawcy | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz wspólne helpery wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Uporządkowana kolejka asynchroniczna | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Wspólne helpery mediów | Helpery pobierania/transformacji/przechowywania mediów oraz buildery ładunków mediów |
  | `plugin-sdk/media-generation-runtime` | Wspólne helpery generowania mediów | Wspólne helpery failover, wybór kandydatów i komunikaty o brakującym modelu dla generowania obrazów/wideo/muzyki |
  | `plugin-sdk/media-understanding` | Helpery rozumienia mediów | Typy dostawców rozumienia mediów oraz eksporty helperów obrazów/audio dla dostawców |
  | `plugin-sdk/text-runtime` | Wspólne helpery tekstu | Usuwanie tekstu widocznego dla asystenta, helpery renderowania/chunkingu/tabel Markdown, helpery redakcji, helpery znaczników dyrektyw, narzędzia bezpiecznego tekstu i powiązane helpery tekstu/logowania |
  | `plugin-sdk/text-chunking` | Helpery chunkingu tekstu | Helper dzielenia tekstu wychodzącego na chunki |
  | `plugin-sdk/speech` | Helpery mowy | Typy dostawców mowy oraz eksporty helperów dyrektyw, rejestru i walidacji dla dostawców |
  | `plugin-sdk/speech-core` | Wspólny rdzeń mowy | Typy dostawców mowy, rejestr, dyrektywy, normalizacja |
  | `plugin-sdk/realtime-transcription` | Helpery transkrypcji realtime | Typy dostawców i helpery rejestru |
  | `plugin-sdk/realtime-voice` | Helpery głosu realtime | Typy dostawców i helpery rejestru |
  | `plugin-sdk/image-generation-core` | Wspólny rdzeń generowania obrazów | Typy generowania obrazów, failover, uwierzytelnianie i helpery rejestru |
  | `plugin-sdk/music-generation` | Helpery generowania muzyki | Typy dostawców/żądań/wyników generowania muzyki |
  | `plugin-sdk/music-generation-core` | Wspólny rdzeń generowania muzyki | Typy generowania muzyki, helpery failover, wyszukiwanie dostawcy i parsowanie model-ref |
  | `plugin-sdk/video-generation` | Helpery generowania wideo | Typy dostawców/żądań/wyników generowania wideo |
  | `plugin-sdk/video-generation-core` | Wspólny rdzeń generowania wideo | Typy generowania wideo, helpery failover, wyszukiwanie dostawcy i parsowanie model-ref |
  | `plugin-sdk/interactive-runtime` | Helpery odpowiedzi interaktywnych | Normalizacja/redukcja ładunku odpowiedzi interaktywnych |
  | `plugin-sdk/channel-config-primitives` | Prymitywy konfiguracji kanału | Wąskie prymitywy channel config-schema |
  | `plugin-sdk/channel-config-writes` | Helpery zapisu konfiguracji kanału | Helpery autoryzacji zapisu konfiguracji kanału |
  | `plugin-sdk/channel-plugin-common` | Wspólne preludium kanału | Wspólne eksporty preludium wtyczki kanału |
  | `plugin-sdk/channel-status` | Helpery statusu kanału | Wspólne helpery snapshotów/podsumowań statusu kanału |
  | `plugin-sdk/allowlist-config-edit` | Helpery konfiguracji allowlisty | Helpery edycji/odczytu konfiguracji allowlisty |
  | `plugin-sdk/group-access` | Helpery dostępu grupowego | Wspólne helpery decyzji dostępu grupowego |
  | `plugin-sdk/direct-dm` | Helpery direct-DM | Wspólne helpery uwierzytelniania/ochrony direct-DM |
  | `plugin-sdk/extension-shared` | Wspólne helpery rozszerzeń | Prymitywy pomocnicze dla pasywnego kanału/statusu i ambient proxy |
  | `plugin-sdk/webhook-targets` | Helpery celów webhook | Rejestr celów webhook i helpery instalacji tras |
  | `plugin-sdk/webhook-path` | Helpery ścieżek webhook | Helpery normalizacji ścieżek webhook |
  | `plugin-sdk/web-media` | Wspólne helpery mediów web | Helpery ładowania zdalnych/lokalnych mediów |
  | `plugin-sdk/zod` | Re-eksport Zod | Re-eksportowany `zod` dla użytkowników plugin SDK |
  | `plugin-sdk/memory-core` | Dołączone helpery memory-core | Powierzchnia helperów menedżera pamięci/konfiguracji/plików/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime silnika pamięci | Fasada runtime indeksu/wyszukiwania pamięci |
  | `plugin-sdk/memory-core-host-engine-foundation` | Silnik podstawowy hosta pamięci | Eksporty silnika podstawowego hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Silnik embeddingów hosta pamięci | Eksporty silnika embeddingów hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-qmd` | Silnik QMD hosta pamięci | Eksporty silnika QMD hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-storage` | Silnik przechowywania hosta pamięci | Eksporty silnika przechowywania hosta pamięci |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodalne helpery hosta pamięci | Multimodalne helpery hosta pamięci |
  | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci | Helpery zapytań hosta pamięci |
  | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci | Helpery sekretów hosta pamięci |
  | `plugin-sdk/memory-core-host-events` | Helpery dziennika zdarzeń hosta pamięci | Helpery dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-core-host-status` | Helpery statusu hosta pamięci | Helpery statusu hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI hosta pamięci | Helpery runtime CLI hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-core` | Główny runtime hosta pamięci | Helpery głównego runtime hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/runtime hosta pamięci | Helpery plików/runtime hosta pamięci |
  | `plugin-sdk/memory-host-core` | Alias głównego runtime hosta pamięci | Neutralny wobec dostawcy alias helperów głównego runtime hosta pamięci |
  | `plugin-sdk/memory-host-events` | Alias dziennika zdarzeń hosta pamięci | Neutralny wobec dostawcy alias helperów dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-host-files` | Alias plików/runtime hosta pamięci | Neutralny wobec dostawcy alias helperów plików/runtime hosta pamięci |
  | `plugin-sdk/memory-host-markdown` | Helpery zarządzanego Markdown | Wspólne helpery zarządzanego Markdown dla wtyczek związanych z pamięcią |
  | `plugin-sdk/memory-host-search` | Fasada aktywnego wyszukiwania pamięci | Leniwa fasada runtime menedżera wyszukiwania aktywnej pamięci |
  | `plugin-sdk/memory-host-status` | Alias statusu hosta pamięci | Neutralny wobec dostawcy alias helperów statusu hosta pamięci |
  | `plugin-sdk/memory-lancedb` | Dołączone helpery memory-lancedb | Powierzchnia helperów memory-lancedb |
  | `plugin-sdk/testing` | Narzędzia testowe | Helpery testowe i mocki |
</Accordion>

Ta tabela celowo obejmuje typowy podzbiór migracyjny, a nie pełną powierzchnię
SDK. Pełna lista ponad 200 punktów wejścia znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`.

Ta lista nadal obejmuje niektóre pomocnicze granice dołączonych wtyczek, takie jak
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` oraz `plugin-sdk/matrix*`. Pozostają one eksportowane na potrzeby
utrzymania i zgodności dołączonych wtyczek, ale są celowo pominięte w typowej tabeli migracyjnej
i nie są zalecanym celem dla nowego kodu wtyczek.

Ta sama zasada dotyczy innych rodzin dołączonych helperów, takich jak:

- helpery obsługi przeglądarki: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- dołączone powierzchnie helperów/wtyczek, takie jak `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` oraz `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` obecnie udostępnia wąską powierzchnię
helperów tokena `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` i `resolveCopilotApiToken`.

Używaj możliwie najwęższego importu, który pasuje do zadania. Jeśli nie możesz znaleźć eksportu,
sprawdź źródło w `src/plugin-sdk/` lub zapytaj na Discord.

## Harmonogram usunięcia

| Kiedy                  | Co się dzieje                                                           |
| ---------------------- | ----------------------------------------------------------------------- |
| **Teraz**              | Przestarzałe powierzchnie emitują ostrzeżenia w czasie wykonywania      |
| **Następna główna wersja** | Przestarzałe powierzchnie zostaną usunięte; wtyczki nadal z nich korzystające przestaną działać |

Wszystkie główne wtyczki zostały już zmigrowane. Zewnętrzne wtyczki powinny przeprowadzić migrację
przed następną główną wersją.

## Tymczasowe wyciszenie ostrzeżeń

Ustaw te zmienne środowiskowe podczas pracy nad migracją:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

To tymczasowa furtka awaryjna, a nie trwałe rozwiązanie.

## Powiązane

- [Pierwsze kroki](/pl/plugins/building-plugins) — zbuduj swoją pierwszą wtyczkę
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełna dokumentacja importów ścieżek podrzędnych
- [Wtyczki kanałów](/pl/plugins/sdk-channel-plugins) — budowanie wtyczek kanałów
- [Wtyczki dostawców](/pl/plugins/sdk-provider-plugins) — budowanie wtyczek dostawców
- [Wnętrze wtyczek](/pl/plugins/architecture) — szczegółowe omówienie architektury
- [Manifest wtyczki](/pl/plugins/manifest) — dokumentacja schematu manifestu
