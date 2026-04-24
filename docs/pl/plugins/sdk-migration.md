---
read_when:
    - Widzisz ostrzeżenie OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Widzisz ostrzeżenie OPENCLAW_EXTENSION_API_DEPRECATED
    - Aktualizujesz plugin do nowoczesnej architektury pluginów
    - Utrzymujesz zewnętrzny plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Przejdź ze starszej warstwy zgodności wstecznej na nowoczesne SDK pluginów
title: Migracja Plugin SDK
x-i18n:
    generated_at: "2026-04-24T09:24:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1461ae8a7de0a802c9deb59f843e7d93d9d73bea22c27d837ca2db8ae9d14b7
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw przeszedł od szerokiej warstwy zgodności wstecznej do nowoczesnej architektury pluginów
z ukierunkowanymi, udokumentowanymi importami. Jeśli Twój plugin został zbudowany przed
nową architekturą, ten przewodnik pomoże Ci przeprowadzić migrację.

## Co się zmienia

Stary system pluginów udostępniał dwie szeroko otwarte powierzchnie, które pozwalały pluginom importować
wszystko, czego potrzebowały, z jednego punktu wejścia:

- **`openclaw/plugin-sdk/compat`** — pojedynczy import, który ponownie eksportował dziesiątki
  helperów. Został wprowadzony, aby starsze pluginy oparte na hookach nadal działały, podczas gdy
  budowano nową architekturę pluginów.
- **`openclaw/extension-api`** — most, który dawał pluginom bezpośredni dostęp do
  helperów po stronie hosta, takich jak osadzony runner agenta.

Obie powierzchnie są teraz **przestarzałe**. Nadal działają w runtime, ale nowe
pluginy nie mogą ich używać, a istniejące pluginy powinny przeprowadzić migrację, zanim następne
główne wydanie je usunie.

OpenClaw nie usuwa ani nie reinterpretuję udokumentowanego zachowania pluginów w tej samej zmianie,
w której wprowadza zamiennik. Zmiany kontraktu powodujące niezgodność muszą najpierw przejść
przez adapter zgodności, diagnostykę, dokumentację i okres wycofywania.
Dotyczy to importów SDK, pól manifestu, API konfiguracji, hooków i zachowania rejestracji w runtime.

<Warning>
  Warstwa zgodności wstecznej zostanie usunięta w jednym z przyszłych głównych wydań.
  Pluginy, które nadal importują z tych powierzchni, przestaną działać, gdy to nastąpi.
</Warning>

## Dlaczego to się zmieniło

Stare podejście powodowało problemy:

- **Powolne uruchamianie** — zaimportowanie jednego helpera ładowało dziesiątki niepowiązanych modułów
- **Zależności cykliczne** — szerokie ponowne eksporty ułatwiały tworzenie cykli importów
- **Niejasna powierzchnia API** — nie było sposobu, by odróżnić, które eksporty były stabilne, a które wewnętrzne

Nowoczesne SDK pluginów rozwiązuje ten problem: każda ścieżka importu (`openclaw/plugin-sdk/\<subpath\>`)
jest małym, samowystarczalnym modułem o jasno określonym celu i udokumentowanym kontrakcie.

Starsze wygodne powierzchnie dostawców dla dołączonych kanałów również zostały usunięte. Importy
takie jak `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
powierzchnie helperów oznaczone marką kanału oraz
`openclaw/plugin-sdk/telegram-core` były prywatnymi skrótami mono-repo, a nie
stabilnymi kontraktami pluginów. Zamiast tego używaj wąskich, ogólnych podścieżek SDK. W obrębie
dołączonego obszaru roboczego pluginu trzymaj helpery zarządzane przez dostawcę we własnym
`api.ts` lub `runtime-api.ts` tego pluginu.

Przykłady bieżących dołączonych dostawców:

- Anthropic trzyma helpery strumieni specyficzne dla Claude we własnej powierzchni `api.ts` /
  `contract-api.ts`
- OpenAI trzyma buildery dostawców, helpery domyślnych modeli i buildery dostawców
  realtime we własnym `api.ts`
- OpenRouter trzyma builder dostawcy i helpery onboardingu/konfiguracji we własnym
  `api.ts`

## Polityka zgodności

W przypadku zewnętrznych pluginów prace nad zgodnością przebiegają w tej kolejności:

1. dodanie nowego kontraktu
2. pozostawienie starego zachowania podłączonego przez adapter zgodności
3. emitowanie diagnostyki lub ostrzeżenia, które wskazuje starą ścieżkę i zamiennik
4. objęcie testami obu ścieżek
5. udokumentowanie wycofania i ścieżki migracji
6. usunięcie dopiero po ogłoszonym oknie migracji, zwykle w głównym wydaniu

Jeśli pole manifestu jest nadal akceptowane, autorzy pluginów mogą nadal go używać, dopóki
dokumentacja i diagnostyka nie powiedzą inaczej. Nowy kod powinien preferować udokumentowany
zamiennik, ale istniejące pluginy nie powinny przestawać działać podczas zwykłych wydań
minor.

## Jak przeprowadzić migrację

<Steps>
  <Step title="Przenieś handlery natywnych zatwierdzeń na capability facts">
    Pluginy kanałów obsługujących zatwierdzenia udostępniają teraz natywne zachowanie zatwierdzeń przez
    `approvalCapability.nativeRuntime` oraz współdzielony rejestr kontekstu runtime.

    Najważniejsze zmiany:

    - Zastąp `approvalCapability.handler.loadRuntime(...)` przez
      `approvalCapability.nativeRuntime`
    - Przenieś uwierzytelnianie/dostarczanie specyficzne dla zatwierdzeń ze starszego połączenia `plugin.auth` /
      `plugin.approvals` do `approvalCapability`
    - `ChannelPlugin.approvals` zostało usunięte z publicznego kontraktu
      pluginu kanału; przenieś pola delivery/native/render do `approvalCapability`
    - `plugin.auth` pozostaje tylko dla przepływów logowania/wylogowania kanału; hooki
      uwierzytelniania zatwierdzeń w tym miejscu nie są już odczytywane przez core
    - Rejestruj obiekty runtime należące do kanału, takie jak klienci, tokeny lub aplikacje
      Bolt, przez `openclaw/plugin-sdk/channel-runtime-context`
    - Nie wysyłaj komunikatów o przekierowaniu należących do pluginu z natywnych handlerów zatwierdzeń;
      core zarządza teraz komunikatami o przekierowaniu na podstawie rzeczywistych wyników dostarczania
    - Przy przekazywaniu `channelRuntime` do `createChannelManager(...)` podaj
      rzeczywistą powierzchnię `createPluginRuntime().channel`. Częściowe stuby są odrzucane.

    Aktualny układ capability zatwierdzeń znajdziesz w `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Sprawdź zachowanie fallbacku wrappera Windows">
    Jeśli Twój plugin używa `openclaw/plugin-sdk/windows-spawn`, nierozwiązane wrappery Windows
    `.cmd`/`.bat` kończą się teraz bezpieczną odmową, chyba że jawnie przekażesz
    `allowShellFallback: true`.

    ```typescript
    // Przed
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Po
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Ustawiaj to tylko dla zaufanych wywołujących zgodności, którzy świadomie
      // akceptują fallback pośredniczony przez shell.
      allowShellFallback: true,
    });
    ```

    Jeśli wywołujący nie polega świadomie na fallbacku shell, nie ustawiaj
    `allowShellFallback` i zamiast tego obsłuż zgłaszany błąd.

  </Step>

  <Step title="Znajdź przestarzałe importy">
    Przeszukaj plugin w poszukiwaniu importów z którejkolwiek z przestarzałych powierzchni:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Zastąp je ukierunkowanymi importami">
    Każdy eksport ze starej powierzchni mapuje się na konkretną nowoczesną ścieżkę importu:

    ```typescript
    // Przed (przestarzała warstwa zgodności wstecznej)
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

    W przypadku helperów po stronie hosta używaj wstrzykniętego runtime pluginu zamiast importować je
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

## Referencja ścieżek importu

  <Accordion title="Tabela typowych ścieżek importu">
  | Ścieżka importu | Cel | Kluczowe eksporty |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanoniczny helper punktu wejścia pluginu | `definePluginEntry` |
  | `plugin-sdk/core` | Starszy zbiorczy re-eksport dla definicji/builderów punktów wejścia kanałów | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Eksport schematu konfiguracji głównej | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper punktu wejścia pojedynczego dostawcy | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Ukierunkowane definicje i buildery punktów wejścia kanałów | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Współdzielone helpery kreatora konfiguracji | Prompty allowlist, buildery stanu konfiguracji |
  | `plugin-sdk/setup-runtime` | Helpery runtime dla konfiguracji | Bezpieczne do importu adaptery łatania konfiguracji, helpery notatek lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, delegowane proxy konfiguracji |
  | `plugin-sdk/setup-adapter-runtime` | Helpery adaptera konfiguracji | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpery narzędzi konfiguracji | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpery wielu kont | Helpery listy kont/konfiguracji/bramki akcji |
  | `plugin-sdk/account-id` | Helpery identyfikatora konta | `DEFAULT_ACCOUNT_ID`, normalizacja identyfikatora konta |
  | `plugin-sdk/account-resolution` | Helpery wyszukiwania konta | Helpery wyszukiwania konta + fallbacku do wartości domyślnej |
  | `plugin-sdk/account-helpers` | Wąskie helpery kont | Helpery listy kont/akcji na koncie |
  | `plugin-sdk/channel-setup` | Adaptery kreatora konfiguracji | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Prymitywy parowania DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Połączenie prefiksu odpowiedzi i typing | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabryki adapterów konfiguracji | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Buildery schematu konfiguracji | Typy schematu konfiguracji kanału |
  | `plugin-sdk/telegram-command-config` | Helpery konfiguracji poleceń Telegram | Normalizacja nazw poleceń, przycinanie opisów, walidacja duplikatów/konfliktów |
  | `plugin-sdk/channel-policy` | Rozwiązywanie polityki grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpery stanu konta i cyklu życia strumienia szkiców | `createAccountStatusSink`, helpery finalizacji podglądu szkicu |
  | `plugin-sdk/inbound-envelope` | Helpery koperty wejściowej | Współdzielone helpery routingu + buildera koperty |
  | `plugin-sdk/inbound-reply-dispatch` | Helpery odpowiedzi wejściowych | Współdzielone helpery zapisu i dispatch |
  | `plugin-sdk/messaging-targets` | Parsowanie celów wiadomości | Helpery parsowania/dopasowania celów |
  | `plugin-sdk/outbound-media` | Helpery mediów wychodzących | Współdzielone ładowanie mediów wychodzących |
  | `plugin-sdk/outbound-runtime` | Helpery runtime dla ruchu wychodzącego | Helpery tożsamości/delegata wysyłki wychodzącej i planowania payloadów |
  | `plugin-sdk/thread-bindings-runtime` | Helpery powiązań wątków | Helpery cyklu życia i adapterów powiązań wątków |
  | `plugin-sdk/agent-media-payload` | Starsze helpery payloadu mediów | Builder payloadu mediów agenta dla starszych układów pól |
  | `plugin-sdk/channel-runtime` | Przestarzały shim zgodności | Tylko starsze narzędzia runtime kanału |
  | `plugin-sdk/channel-send-result` | Typy wyniku wysyłki | Typy wyniku odpowiedzi |
  | `plugin-sdk/runtime-store` | Trwałe przechowywanie pluginu | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Szerokie helpery runtime | Helpery runtime/logowania/kopii zapasowych/instalacji pluginu |
  | `plugin-sdk/runtime-env` | Wąskie helpery środowiska runtime | Logger/runtime env, helpery timeout, retry i backoff |
  | `plugin-sdk/plugin-runtime` | Współdzielone helpery runtime pluginu | Helpery poleceń/hooków/http/interaktywne pluginu |
  | `plugin-sdk/hook-runtime` | Helpery potoku hooków | Współdzielone helpery potoku Webhook/wewnętrznych hooków |
  | `plugin-sdk/lazy-runtime` | Helpery leniwego runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpery procesów | Współdzielone helpery exec |
  | `plugin-sdk/cli-runtime` | Helpery runtime CLI | Formatowanie poleceń, oczekiwania, helpery wersji |
  | `plugin-sdk/gateway-runtime` | Helpery Gateway | Klient Gateway i helpery patchowania stanu kanału |
  | `plugin-sdk/config-runtime` | Helpery konfiguracji | Helpery ładowania/zapisu konfiguracji |
  | `plugin-sdk/telegram-command-config` | Helpery poleceń Telegram | Stabilne pod względem fallbacku helpery walidacji poleceń Telegram, gdy dołączona powierzchnia kontraktu Telegram jest niedostępna |
  | `plugin-sdk/approval-runtime` | Helpery promptów zatwierdzeń | Helpery payloadów exec/zatwierdzeń pluginów, helpery capability/profili zatwierdzeń, helpery routingu/runtime natywnych zatwierdzeń |
  | `plugin-sdk/approval-auth-runtime` | Helpery uwierzytelniania zatwierdzeń | Rozwiązywanie zatwierdzającego, uwierzytelnianie akcji w tym samym czacie |
  | `plugin-sdk/approval-client-runtime` | Helpery klienta zatwierdzeń | Helpery profili/filtrów natywnych zatwierdzeń exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpery dostarczania zatwierdzeń | Adaptery capability/dostarczania natywnych zatwierdzeń |
  | `plugin-sdk/approval-gateway-runtime` | Helpery Gateway zatwierdzeń | Współdzielony helper rozwiązywania Gateway zatwierdzeń |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpery adaptera zatwierdzeń | Lekkie helpery ładowania natywnego adaptera zatwierdzeń dla gorących punktów wejścia kanałów |
  | `plugin-sdk/approval-handler-runtime` | Helpery handlera zatwierdzeń | Szersze helpery runtime handlera zatwierdzeń; preferuj węższe powierzchnie adaptera/Gateway, gdy są wystarczające |
  | `plugin-sdk/approval-native-runtime` | Helpery celu zatwierdzeń | Helpery natywnego powiązania celu/konta zatwierdzeń |
  | `plugin-sdk/approval-reply-runtime` | Helpery odpowiedzi zatwierdzeń | Helpery payloadów odpowiedzi exec/zatwierdzeń pluginów |
  | `plugin-sdk/channel-runtime-context` | Helpery channel runtime-context | Ogólne helpery register/get/watch channel runtime-context |
  | `plugin-sdk/security-runtime` | Helpery bezpieczeństwa | Współdzielone helpery zaufania, bramkowania DM, treści zewnętrznych i zbierania sekretów |
  | `plugin-sdk/ssrf-policy` | Helpery polityki SSRF | Helpery allowlist hostów i polityki sieci prywatnej |
  | `plugin-sdk/ssrf-runtime` | Helpery runtime SSRF | Helpery pinned-dispatcher, guarded fetch, polityki SSRF |
  | `plugin-sdk/collection-runtime` | Helpery ograniczonej pamięci podręcznej | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpery bramkowania diagnostyki | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpery formatowania błędów | `formatUncaughtError`, `isApprovalNotFoundError`, helpery grafu błędów |
  | `plugin-sdk/fetch-runtime` | Helpery opakowanego fetch/proxy | `resolveFetch`, helpery proxy |
  | `plugin-sdk/host-runtime` | Helpery normalizacji hosta | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpery retry | `RetryConfig`, `retryAsync`, executory polityki |
  | `plugin-sdk/allow-from` | Formatowanie allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapowanie wejść allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Bramkowanie poleceń i helpery powierzchni poleceń | `resolveControlCommandGate`, helpery autoryzacji nadawcy, helpery rejestru poleceń |
  | `plugin-sdk/command-status` | Renderery stanu/pomocy poleceń | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsowanie wejścia sekretów | Helpery wejścia sekretów |
  | `plugin-sdk/webhook-ingress` | Helpery żądań Webhook | Narzędzia celu Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpery guardów żądań Webhook | Helpery odczytu/limitów treści żądań |
  | `plugin-sdk/reply-runtime` | Współdzielony runtime odpowiedzi | Dispatch wejściowy, Heartbeat, planer odpowiedzi, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery dispatch odpowiedzi | Finalizacja, dispatch dostawcy i helpery etykiet konwersacji |
  | `plugin-sdk/reply-history` | Helpery historii odpowiedzi | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planowanie referencji odpowiedzi | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpery chunków odpowiedzi | Helpery chunkingu tekstu/markdown |
  | `plugin-sdk/session-store-runtime` | Helpery session store | Helpery ścieżek store + updated-at |
  | `plugin-sdk/state-paths` | Helpery ścieżek stanu | Helpery katalogów stanu i OAuth |
  | `plugin-sdk/routing` | Helpery routingu/klucza sesji | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpery normalizacji klucza sesji |
  | `plugin-sdk/status-helpers` | Helpery stanu kanału | Buildery podsumowania stanu kanału/konta, domyślne wartości stanu runtime, helpery metadanych problemów |
  | `plugin-sdk/target-resolver-runtime` | Helpery rozwiązywania celu | Współdzielone helpery rozwiązywania celu |
  | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji ciągów | Helpery normalizacji slug/ciągów |
  | `plugin-sdk/request-url` | Helpery URL żądania | Wyodrębnianie URL jako ciągu z wejść podobnych do żądań |
  | `plugin-sdk/run-command` | Helpery poleceń z limitem czasu | Runner poleceń z limitem czasu ze znormalizowanym stdout/stderr |
  | `plugin-sdk/param-readers` | Odczytywacze parametrów | Wspólne odczytywacze parametrów narzędzi/CLI |
  | `plugin-sdk/tool-payload` | Wyodrębnianie payloadu narzędzia | Wyodrębnianie znormalizowanych payloadów z obiektów wyników narzędzi |
  | `plugin-sdk/tool-send` | Wyodrębnianie wysyłki narzędzia | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
  | `plugin-sdk/temp-path` | Helpery ścieżek tymczasowych | Współdzielone helpery ścieżek tymczasowego pobierania |
  | `plugin-sdk/logging-core` | Helpery logowania | Logger podsystemu i helpery redakcji |
  | `plugin-sdk/markdown-table-runtime` | Helpery tabel Markdown | Helpery trybu tabel Markdown |
  | `plugin-sdk/reply-payload` | Typy odpowiedzi wiadomości | Typy payloadu odpowiedzi |
  | `plugin-sdk/provider-setup` | Kuratorowane helpery konfiguracji lokalnych/self-hosted dostawców | Helpery wykrywania/konfiguracji self-hosted dostawców |
  | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane helpery konfiguracji self-hosted dostawców zgodnych z OpenAI | Te same helpery wykrywania/konfiguracji self-hosted dostawców |
  | `plugin-sdk/provider-auth-runtime` | Helpery uwierzytelniania dostawcy w runtime | Helpery rozwiązywania kluczy API w runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpery konfiguracji klucza API dostawcy | Helpery onboardingu/zapisu profilu klucza API |
  | `plugin-sdk/provider-auth-result` | Helpery wyniku uwierzytelnienia dostawcy | Standardowy builder wyniku uwierzytelnienia OAuth |
  | `plugin-sdk/provider-auth-login` | Helpery interaktywnego logowania dostawcy | Współdzielone helpery interaktywnego logowania |
  | `plugin-sdk/provider-selection-runtime` | Helpery wyboru dostawcy | Wybór skonfigurowanego lub automatycznego dostawcy i scalanie surowej konfiguracji dostawcy |
  | `plugin-sdk/provider-env-vars` | Helpery zmiennych środowiskowych dostawcy | Helpery wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
  | `plugin-sdk/provider-model-shared` | Współdzielone helpery modelu/replay dostawcy | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone buildery polityki replay, helpery endpointów dostawcy i helpery normalizacji identyfikatora modelu |
  | `plugin-sdk/provider-catalog-shared` | Współdzielone helpery katalogu dostawcy | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patche onboardingu dostawcy | Helpery konfiguracji onboardingu |
  | `plugin-sdk/provider-http` | Helpery HTTP dostawcy | Ogólne helpery HTTP/capability endpointów dostawcy, w tym helpery formularzy multipart do transkrypcji audio |
  | `plugin-sdk/provider-web-fetch` | Helpery web-fetch dostawcy | Helpery rejestracji/pamięci podręcznej dostawcy web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpery konfiguracji web-search dostawcy | Wąskie helpery konfiguracji/poświadczeń web-search dla dostawców, którzy nie potrzebują połączenia enable pluginu |
  | `plugin-sdk/provider-web-search-contract` | Helpery kontraktu web-search dostawcy | Wąskie helpery kontraktu konfiguracji/poświadczeń web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowe settery/gettery poświadczeń |
  | `plugin-sdk/provider-web-search` | Helpery web-search dostawcy | Helpery rejestracji/pamięci podręcznej/runtime dostawcy web-search |
  | `plugin-sdk/provider-tools` | Helpery zgodności narzędzi/schematu dostawcy | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematu Gemini + diagnostyka oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpery użycia dostawcy | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` oraz inne helpery użycia dostawcy |
  | `plugin-sdk/provider-stream` | Helpery wrapperów strumienia dostawcy | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumienia oraz współdzielone helpery wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Helpery transportu dostawcy | Natywne helpery transportu dostawcy, takie jak guarded fetch, transformacje komunikatów transportu i zapisywalne strumienie zdarzeń transportu |
  | `plugin-sdk/keyed-async-queue` | Uporządkowana kolejka async | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Współdzielone helpery multimediów | Helpery pobierania/transformacji/przechowywania multimediów oraz buildery payloadów multimediów |
  | `plugin-sdk/media-generation-runtime` | Współdzielone helpery generowania multimediów | Współdzielone helpery failover, wybór kandydatów i komunikaty o brakującym modelu dla generowania obrazów/wideo/muzyki |
  | `plugin-sdk/media-understanding` | Helpery rozumienia multimediów | Typy dostawców rozumienia multimediów oraz eksporty helperów obrazów/audio dla dostawców |
  | `plugin-sdk/text-runtime` | Współdzielone helpery tekstu | Usuwanie tekstu widocznego dla asystenta, helpery renderowania/chunkingu/tabel Markdown, helpery redakcji, helpery tagów dyrektyw, narzędzia bezpiecznego tekstu i powiązane helpery tekstu/logowania |
  | `plugin-sdk/text-chunking` | Helpery chunkingu tekstu | Helper chunkingu tekstu wychodzącego |
  | `plugin-sdk/speech` | Helpery mowy | Typy dostawców mowy oraz helpery dyrektyw, rejestru i walidacji dla dostawców |
  | `plugin-sdk/speech-core` | Współdzielony rdzeń mowy | Typy dostawców mowy, rejestr, dyrektywy, normalizacja |
  | `plugin-sdk/realtime-transcription` | Helpery transkrypcji realtime | Typy dostawców, helpery rejestru i współdzielony helper sesji WebSocket |
  | `plugin-sdk/realtime-voice` | Helpery głosu realtime | Typy dostawców, helpery rejestru/rozwiązywania i helpery sesji bridge |
  | `plugin-sdk/image-generation-core` | Współdzielony rdzeń generowania obrazów | Typy generowania obrazów, helpery failover, auth i rejestru |
  | `plugin-sdk/music-generation` | Helpery generowania muzyki | Typy dostawcy/żądania/wyniku generowania muzyki |
  | `plugin-sdk/music-generation-core` | Współdzielony rdzeń generowania muzyki | Typy generowania muzyki, helpery failover, wyszukiwanie dostawcy i parsowanie model-ref |
  | `plugin-sdk/video-generation` | Helpery generowania wideo | Typy dostawcy/żądania/wyniku generowania wideo |
  | `plugin-sdk/video-generation-core` | Współdzielony rdzeń generowania wideo | Typy generowania wideo, helpery failover, wyszukiwanie dostawcy i parsowanie model-ref |
  | `plugin-sdk/interactive-runtime` | Helpery interaktywnych odpowiedzi | Normalizacja/redukcja payloadu interaktywnych odpowiedzi |
  | `plugin-sdk/channel-config-primitives` | Prymitywy konfiguracji kanału | Wąskie prymitywy channel config-schema |
  | `plugin-sdk/channel-config-writes` | Helpery zapisu konfiguracji kanału | Helpery autoryzacji zapisu konfiguracji kanału |
  | `plugin-sdk/channel-plugin-common` | Współdzielone preludium kanału | Współdzielone eksporty preludium pluginu kanału |
  | `plugin-sdk/channel-status` | Helpery stanu kanału | Współdzielone helpery snapshotu/podsumowania stanu kanału |
  | `plugin-sdk/allowlist-config-edit` | Helpery konfiguracji allowlist | Helpery edycji/odczytu konfiguracji allowlist |
  | `plugin-sdk/group-access` | Helpery dostępu grupowego | Współdzielone helpery decyzji dostępu grupowego |
  | `plugin-sdk/direct-dm` | Helpery bezpośredniego DM | Współdzielone helpery auth/guard bezpośredniego DM |
  | `plugin-sdk/extension-shared` | Współdzielone helpery rozszerzeń | Prymitywy helperów pasywnego kanału/stanu i ambient proxy |
  | `plugin-sdk/webhook-targets` | Helpery celów Webhook | Rejestr celów Webhook i helpery instalacji routingu |
  | `plugin-sdk/webhook-path` | Helpery ścieżek Webhook | Helpery normalizacji ścieżek Webhook |
  | `plugin-sdk/web-media` | Współdzielone helpery web media | Helpery ładowania zdalnych/lokalnych multimediów |
  | `plugin-sdk/zod` | Re-eksport Zod | Re-eksportowane `zod` dla odbiorców SDK pluginów |
  | `plugin-sdk/memory-core` | Dołączone helpery memory-core | Powierzchnia helperów menedżera pamięci/konfiguracji/plików/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime silnika pamięci | Fasada runtime indeksu/wyszukiwania pamięci |
  | `plugin-sdk/memory-core-host-engine-foundation` | Silnik foundation hosta pamięci | Eksporty silnika foundation hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Silnik embedding hosta pamięci | Kontrakty embeddingów pamięci, dostęp do rejestru, lokalny dostawca i ogólne helpery batch/zdalne; konkretni zdalni dostawcy znajdują się we własnych pluginach |
  | `plugin-sdk/memory-core-host-engine-qmd` | Silnik QMD hosta pamięci | Eksporty silnika QMD hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-storage` | Silnik storage hosta pamięci | Eksporty silnika storage hosta pamięci |
  | `plugin-sdk/memory-core-host-multimodal` | Helpery multimodalne hosta pamięci | Helpery multimodalne hosta pamięci |
  | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci | Helpery zapytań hosta pamięci |
  | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci | Helpery sekretów hosta pamięci |
  | `plugin-sdk/memory-core-host-events` | Helpery dziennika zdarzeń hosta pamięci | Helpery dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-core-host-status` | Helpery stanu hosta pamięci | Helpery stanu hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI hosta pamięci | Helpery runtime CLI hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-core` | Główny runtime hosta pamięci | Helpery głównego runtime hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/runtime hosta pamięci | Helpery plików/runtime hosta pamięci |
  | `plugin-sdk/memory-host-core` | Alias głównego runtime hosta pamięci | Neutralny względem dostawcy alias dla helperów głównego runtime hosta pamięci |
  | `plugin-sdk/memory-host-events` | Alias dziennika zdarzeń hosta pamięci | Neutralny względem dostawcy alias dla helperów dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-host-files` | Alias plików/runtime hosta pamięci | Neutralny względem dostawcy alias dla helperów plików/runtime hosta pamięci |
  | `plugin-sdk/memory-host-markdown` | Helpery zarządzanego Markdown | Współdzielone helpery zarządzanego Markdown dla pluginów powiązanych z pamięcią |
  | `plugin-sdk/memory-host-search` | Fasada wyszukiwania Active Memory | Leniwa fasada runtime menedżera wyszukiwania active-memory |
  | `plugin-sdk/memory-host-status` | Alias stanu hosta pamięci | Neutralny względem dostawcy alias dla helperów stanu hosta pamięci |
  | `plugin-sdk/memory-lancedb` | Dołączone helpery memory-lancedb | Powierzchnia helperów memory-lancedb |
  | `plugin-sdk/testing` | Narzędzia testowe | Helpery testowe i mocki |
</Accordion>

Ta tabela celowo obejmuje wspólny podzbiór migracyjny, a nie pełną powierzchnię SDK.
Pełna lista ponad 200 punktów wejścia znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`.

Ta lista nadal zawiera niektóre powierzchnie helperów dołączonych pluginów, takie jak
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` oraz `plugin-sdk/matrix*`. Nadal są one eksportowane na potrzeby
utrzymania i zgodności dołączonych pluginów, ale celowo pominięto je w tabeli wspólnej migracji i nie są zalecanym celem dla
nowego kodu pluginów.

Ta sama zasada dotyczy innych rodzin dołączonych helperów, takich jak:

- helpery obsługi przeglądarki: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- powierzchnie dołączonych helperów/pluginów, takie jak `plugin-sdk/googlechat`,
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

Używaj najwęższego importu odpowiadającego zadaniu. Jeśli nie możesz znaleźć eksportu,
sprawdź źródło w `src/plugin-sdk/` albo zapytaj na Discord.

## Harmonogram usunięcia

| Kiedy                  | Co się dzieje                                                          |
| ---------------------- | ---------------------------------------------------------------------- |
| **Teraz**              | Przestarzałe powierzchnie emitują ostrzeżenia w runtime                |
| **Następne główne wydanie** | Przestarzałe powierzchnie zostaną usunięte; pluginy, które nadal ich używają, przestaną działać |

Wszystkie podstawowe pluginy zostały już zmigrowane. Zewnętrzne pluginy powinny przeprowadzić migrację
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
- [Wnętrze pluginów](/pl/plugins/architecture) — szczegółowe omówienie architektury
- [Manifest pluginu](/pl/plugins/manifest) — referencja schematu manifestu
