---
read_when:
    - Widzisz ostrzeżenie OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Widzisz ostrzeżenie OPENCLAW_EXTENSION_API_DEPRECATED
    - Aktualizujesz plugin do nowoczesnej architektury pluginów
    - Utrzymujesz zewnętrzny plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Przejdź ze starszej warstwy zgodności wstecznej na nowoczesny Plugin SDK
title: Migracja Plugin SDK
x-i18n:
    generated_at: "2026-04-08T09:45:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9a2ce7f5553563516a549ca87e776a6a71e8dd8533a773c5ddbecfae43e7b77
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migracja Plugin SDK

OpenClaw przeszedł od szerokiej warstwy zgodności wstecznej do nowoczesnej
architektury pluginów z ukierunkowanymi, udokumentowanymi importami. Jeśli
Twój plugin powstał przed wprowadzeniem nowej architektury, ten przewodnik
pomoże Ci przeprowadzić migrację.

## Co się zmienia

Stary system pluginów udostępniał dwie szeroko otwarte powierzchnie, które
pozwalały pluginom importować wszystko, czego potrzebowały, z jednego punktu
wejścia:

- **`openclaw/plugin-sdk/compat`** — pojedynczy import, który reeksportował
  dziesiątki helperów. Został wprowadzony po to, aby starsze pluginy oparte na
  hookach nadal działały, podczas gdy budowano nową architekturę pluginów.
- **`openclaw/extension-api`** — most, który dawał pluginom bezpośredni dostęp
  do helperów po stronie hosta, takich jak osadzony runner agenta.

Obie te powierzchnie są teraz **przestarzałe**. Nadal działają w runtime, ale
nowe pluginy nie mogą już z nich korzystać, a istniejące pluginy powinny
przeprowadzić migrację, zanim kolejna główna wersja je usunie.

<Warning>
  Warstwa zgodności wstecznej zostanie usunięta w jednej z przyszłych głównych wersji.
  Pluginy, które nadal importują z tych powierzchni, przestaną działać, gdy to nastąpi.
</Warning>

## Dlaczego to się zmieniło

Stare podejście powodowało problemy:

- **Powolne uruchamianie** — zaimportowanie jednego helpera ładowało dziesiątki
  niepowiązanych modułów
- **Zależności cykliczne** — szerokie reeksporty ułatwiały tworzenie cykli importu
- **Niejasna powierzchnia API** — nie było sposobu, by stwierdzić, które eksporty
  są stabilne, a które wewnętrzne

Nowoczesny Plugin SDK rozwiązuje ten problem: każda ścieżka importu (`openclaw/plugin-sdk/\<subpath\>`)
to mały, samodzielny moduł z jasnym przeznaczeniem i udokumentowanym kontraktem.

Starsze wygodne powierzchnie providerów dla wbudowanych kanałów również zostały usunięte. Importy
takie jak `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
powierzchnie helperów oznaczone marką kanału oraz
`openclaw/plugin-sdk/telegram-core` były prywatnymi skrótami mono-repo, a nie
stabilnymi kontraktami pluginów. Zamiast nich używaj wąskich, ogólnych podścieżek SDK. Wewnątrz
workspace wbudowanych pluginów przechowuj helpery należące do providera we własnym
`api.ts` lub `runtime-api.ts` tego pluginu.

Bieżące przykłady wbudowanych providerów:

- Anthropic przechowuje helpery strumieni specyficzne dla Claude we własnej powierzchni `api.ts` /
  `contract-api.ts`
- OpenAI przechowuje buildery providerów, helpery modeli domyślnych i buildery providerów
  realtime we własnym `api.ts`
- OpenRouter przechowuje builder providera oraz helpery onboardingu/konfiguracji we własnym
  `api.ts`

## Jak przeprowadzić migrację

<Steps>
  <Step title="Przenieś handlery natywnych zatwierdzeń do capability facts">
    Pluginy kanałów obsługujące zatwierdzanie udostępniają teraz natywne zachowanie zatwierdzania przez
    `approvalCapability.nativeRuntime` oraz współdzielony rejestr runtime-context.

    Najważniejsze zmiany:

    - Zastąp `approvalCapability.handler.loadRuntime(...)` przez
      `approvalCapability.nativeRuntime`
    - Przenieś uwierzytelnianie i dostarczanie specyficzne dla zatwierdzeń ze starszego powiązania `plugin.auth` /
      `plugin.approvals` do `approvalCapability`
    - `ChannelPlugin.approvals` zostało usunięte z publicznego kontraktu
      pluginu kanału; przenieś pola delivery/native/render do `approvalCapability`
    - `plugin.auth` pozostaje wyłącznie dla przepływów logowania/wylogowania kanału; hooki
      uwierzytelniania zatwierdzeń w tym miejscu nie są już odczytywane przez core
    - Rejestruj obiekty runtime należące do kanału, takie jak klienci, tokeny lub aplikacje
      Bolt, przez `openclaw/plugin-sdk/channel-runtime-context`
    - Nie wysyłaj komunikatów o przekierowaniu należących do pluginu z natywnych handlerów zatwierdzeń;
      core zarządza teraz komunikatami o dostarczeniu w inne miejsce na podstawie rzeczywistych wyników delivery
    - Przy przekazywaniu `channelRuntime` do `createChannelManager(...)` podaj
      rzeczywistą powierzchnię `createPluginRuntime().channel`. Częściowe stuby są odrzucane.

    Aktualny układ capability zatwierdzeń znajdziesz w
    `/plugins/sdk-channel-plugins`.

  </Step>

  <Step title="Sprawdź zachowanie zapasowe wrapperów Windows">
    Jeśli Twój plugin używa `openclaw/plugin-sdk/windows-spawn`, nierozwiązane wrappery Windows
    `.cmd`/`.bat` teraz kończą się bezpieczną porażką, chyba że jawnie przekażesz
    `allowShellFallback: true`.

    ```typescript
    // Przed
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // Po
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Ustaw to tylko dla zaufanych wywołujących zgodności, którzy świadomie
      // akceptują zapasowe wywołanie przez shell.
      allowShellFallback: true,
    });
    ```

    Jeśli Twój kod wywołujący nie polega świadomie na zapasowym wywołaniu przez shell, nie ustawiaj
    `allowShellFallback` i zamiast tego obsłuż zgłaszany błąd.

  </Step>

  <Step title="Znajdź przestarzałe importy">
    Przeszukaj plugin pod kątem importów z którejkolwiek z przestarzałych powierzchni:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Zastąp je ukierunkowanymi importami">
    Każdy eksport ze starej powierzchni odpowiada konkretnej nowoczesnej ścieżce importu:

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

    Ten sam wzorzec dotyczy innych starszych helperów mostu:

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
  | `plugin-sdk/core` | Starszy zbiorczy reeksport definicji/builderów wejść kanałów | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Eksport schematu głównej konfiguracji | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper punktu wejścia pojedynczego providera | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Ukierunkowane definicje i buildery wejść kanałów | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Współdzielone helpery kreatora konfiguracji | Prompty allowlist i buildery statusu konfiguracji |
  | `plugin-sdk/setup-runtime` | Helpery runtime dla konfiguracji | Bezpieczne przy imporcie adaptery poprawek konfiguracji, helpery notatek lookup, `promptResolvedAllowFrom`, `splitSetupEntries`, delegowane proxy konfiguracji |
  | `plugin-sdk/setup-adapter-runtime` | Helpery adaptera konfiguracji | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpery narzędzi konfiguracji | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpery wielu kont | Helpery listy kont/konfiguracji/bramek akcji |
  | `plugin-sdk/account-id` | Helpery account-id | `DEFAULT_ACCOUNT_ID`, normalizacja account-id |
  | `plugin-sdk/account-resolution` | Helpery wyszukiwania kont | Helpery wyszukiwania kont i domyślnego fallbacku |
  | `plugin-sdk/account-helpers` | Wąskie helpery kont | Helpery listy kont/akcji na kontach |
  | `plugin-sdk/channel-setup` | Adaptery kreatora konfiguracji | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Prymitywy parowania DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Powiązanie prefiksu odpowiedzi i wskaźnika pisania | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabryki adapterów konfiguracji | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Buildery schematu konfiguracji | Typy schematu konfiguracji kanału |
  | `plugin-sdk/telegram-command-config` | Helpery konfiguracji poleceń Telegram | Normalizacja nazw poleceń, przycinanie opisów, walidacja duplikatów/konfliktów |
  | `plugin-sdk/channel-policy` | Rozwiązywanie polityk grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Śledzenie statusu kont | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helpery kopert wejściowych | Współdzielone helpery routingu i budowania kopert |
  | `plugin-sdk/inbound-reply-dispatch` | Helpery odpowiedzi wejściowych | Współdzielone helpery zapisu i dispatch |
  | `plugin-sdk/messaging-targets` | Parsowanie celów wiadomości | Helpery parsowania/dopasowania celów |
  | `plugin-sdk/outbound-media` | Helpery mediów wychodzących | Współdzielone ładowanie mediów wychodzących |
  | `plugin-sdk/outbound-runtime` | Helpery runtime dla wyjścia | Helpery tożsamości wychodzącej/delegatów wysyłki |
  | `plugin-sdk/thread-bindings-runtime` | Helpery powiązań wątków | Helpery cyklu życia powiązań wątków i adapterów |
  | `plugin-sdk/agent-media-payload` | Starsze helpery payloadu mediów | Builder payloadu mediów agenta dla starszych układów pól |
  | `plugin-sdk/channel-runtime` | Przestarzały shim zgodności | Tylko starsze narzędzia runtime kanału |
  | `plugin-sdk/channel-send-result` | Typy wyników wysyłki | Typy wyników odpowiedzi |
  | `plugin-sdk/runtime-store` | Trwałe przechowywanie pluginu | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Szerokie helpery runtime | Helpery runtime/logowania/backupu/instalacji pluginów |
  | `plugin-sdk/runtime-env` | Wąskie helpery środowiska runtime | Logger/runtime env, helpery timeoutów, retry i backoff |
  | `plugin-sdk/plugin-runtime` | Współdzielone helpery runtime pluginów | Helpery poleceń/hooków/http/interaktywnych funkcji pluginu |
  | `plugin-sdk/hook-runtime` | Helpery pipeline hooków | Współdzielone helpery pipeline webhooków/wewnętrznych hooków |
  | `plugin-sdk/lazy-runtime` | Helpery lazy runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpery procesów | Współdzielone helpery exec |
  | `plugin-sdk/cli-runtime` | Helpery runtime CLI | Formatowanie poleceń, oczekiwania, helpery wersji |
  | `plugin-sdk/gateway-runtime` | Helpery Gateway | Klient Gateway i helpery poprawek statusu kanału |
  | `plugin-sdk/config-runtime` | Helpery konfiguracji | Helpery ładowania/zapisu konfiguracji |
  | `plugin-sdk/telegram-command-config` | Helpery poleceń Telegram | Stabilne fallbackowe helpery walidacji poleceń Telegram, gdy powierzchnia kontraktu wbudowanego Telegrama jest niedostępna |
  | `plugin-sdk/approval-runtime` | Helpery promptów zatwierdzania | Payload zatwierdzeń exec/pluginu, helpery capability/profile zatwierdzeń, natywny routing/runtime zatwierdzeń |
  | `plugin-sdk/approval-auth-runtime` | Helpery uwierzytelniania zatwierdzeń | Rozwiązywanie approvera, autoryzacja akcji w tym samym czacie |
  | `plugin-sdk/approval-client-runtime` | Helpery klienta zatwierdzeń | Helpery profilu/filtra natywnych zatwierdzeń exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpery dostarczania zatwierdzeń | Adaptery capability/delivery natywnych zatwierdzeń |
  | `plugin-sdk/approval-gateway-runtime` | Helpery Gateway dla zatwierdzeń | Współdzielony helper rozwiązywania approval gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpery adaptera zatwierdzeń | Lekkie helpery ładowania natywnych adapterów zatwierdzeń dla gorących punktów wejścia kanałów |
  | `plugin-sdk/approval-handler-runtime` | Helpery handlerów zatwierdzeń | Szersze helpery runtime handlerów zatwierdzeń; preferuj węższe powierzchnie adaptera/gateway, gdy są wystarczające |
  | `plugin-sdk/approval-native-runtime` | Helpery celu zatwierdzeń | Helpery natywnego celu zatwierdzeń/powiązania kont |
  | `plugin-sdk/approval-reply-runtime` | Helpery odpowiedzi zatwierdzeń | Helpery payloadu odpowiedzi zatwierdzeń exec/pluginu |
  | `plugin-sdk/channel-runtime-context` | Helpery runtime-context kanału | Ogólne helpery register/get/watch dla runtime-context kanału |
  | `plugin-sdk/security-runtime` | Helpery bezpieczeństwa | Współdzielone helpery zaufania, bramek DM, treści zewnętrznych i zbierania sekretów |
  | `plugin-sdk/ssrf-policy` | Helpery polityki SSRF | Helpery allowlist hostów i polityki sieci prywatnych |
  | `plugin-sdk/ssrf-runtime` | Helpery runtime SSRF | Pinned-dispatcher, guarded fetch, helpery polityki SSRF |
  | `plugin-sdk/collection-runtime` | Helpery ograniczonego cache | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpery bramkowania diagnostyki | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpery formatowania błędów | `formatUncaughtError`, `isApprovalNotFoundError`, helpery grafu błędów |
  | `plugin-sdk/fetch-runtime` | Opakowane helpery fetch/proxy | `resolveFetch`, helpery proxy |
  | `plugin-sdk/host-runtime` | Helpery normalizacji hosta | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpery retry | `RetryConfig`, `retryAsync`, executory polityk |
  | `plugin-sdk/allow-from` | Formatowanie allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapowanie danych wejściowych allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Bramkowanie poleceń i helpery powierzchni poleceń | `resolveControlCommandGate`, helpery autoryzacji nadawcy, helpery rejestru poleceń |
  | `plugin-sdk/secret-input` | Parsowanie wejścia sekretów | Helpery wejścia sekretów |
  | `plugin-sdk/webhook-ingress` | Helpery żądań webhook | Narzędzia celu webhook |
  | `plugin-sdk/webhook-request-guards` | Helpery guardów treści webhook | Helpery odczytu/limitów treści żądania |
  | `plugin-sdk/reply-runtime` | Współdzielony runtime odpowiedzi | Dispatch wejściowy, heartbeat, planer odpowiedzi, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery dispatch odpowiedzi | Helpery finalize i dispatch providera |
  | `plugin-sdk/reply-history` | Helpery historii odpowiedzi | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planowanie referencji odpowiedzi | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpery chunków odpowiedzi | Helpery chunkingu tekstu/markdown |
  | `plugin-sdk/session-store-runtime` | Helpery magazynu sesji | Helpery ścieżki magazynu i updated-at |
  | `plugin-sdk/state-paths` | Helpery ścieżek stanu | Helpery katalogów stanu i OAuth |
  | `plugin-sdk/routing` | Helpery routingu/kluczy sesji | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpery normalizacji kluczy sesji |
  | `plugin-sdk/status-helpers` | Helpery statusu kanału | Buildery podsumowania statusu kanału/konta, domyślne wartości stanu runtime, helpery metadanych problemów |
  | `plugin-sdk/target-resolver-runtime` | Helpery rozwiązywania celu | Współdzielone helpery target resolver |
  | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji ciągów | Helpery normalizacji slugów/ciągów |
  | `plugin-sdk/request-url` | Helpery URL żądania | Wyodrębnianie URL-i jako stringów z danych wejściowych podobnych do request |
  | `plugin-sdk/run-command` | Helpery poleceń z limitem czasu | Uruchamianie poleceń z limitem czasu i znormalizowanym stdout/stderr |
  | `plugin-sdk/param-readers` | Odczyt parametrów | Typowe odczyty parametrów narzędzi/CLI |
  | `plugin-sdk/tool-payload` | Wyodrębnianie payloadu narzędzi | Wyodrębnianie znormalizowanych payloadów z obiektów wyników narzędzi |
  | `plugin-sdk/tool-send` | Wyodrębnianie wysyłki narzędzi | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzi |
  | `plugin-sdk/temp-path` | Helpery ścieżek tymczasowych | Współdzielone helpery ścieżek tymczasowego pobierania |
  | `plugin-sdk/logging-core` | Helpery logowania | Logger podsystemu i helpery redakcji |
  | `plugin-sdk/markdown-table-runtime` | Helpery tabel Markdown | Helpery trybu tabel Markdown |
  | `plugin-sdk/reply-payload` | Typy odpowiedzi wiadomości | Typy payloadu odpowiedzi |
  | `plugin-sdk/provider-setup` | Kuratorowane helpery konfiguracji lokalnych/samohostowanych providerów | Helpery wykrywania/konfiguracji samohostowanych providerów |
  | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane helpery konfiguracji samohostowanych providerów zgodnych z OpenAI | Te same helpery wykrywania/konfiguracji samohostowanych providerów |
  | `plugin-sdk/provider-auth-runtime` | Helpery uwierzytelniania providera w runtime | Helpery rozwiązywania kluczy API w runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpery konfiguracji klucza API providera | Helpery onboardingu/zapisu profilu klucza API |
  | `plugin-sdk/provider-auth-result` | Helpery wyniku uwierzytelniania providera | Standardowy builder wyniku uwierzytelniania OAuth |
  | `plugin-sdk/provider-auth-login` | Helpery interaktywnego logowania providera | Współdzielone helpery interaktywnego logowania |
  | `plugin-sdk/provider-env-vars` | Helpery zmiennych środowiskowych providera | Helpery wyszukiwania zmiennych środowiskowych do uwierzytelniania providera |
  | `plugin-sdk/provider-model-shared` | Współdzielone helpery modeli/odtwarzania providera | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone buildery polityki replay, helpery endpointów providera i helpery normalizacji model-id |
  | `plugin-sdk/provider-catalog-shared` | Współdzielone helpery katalogu providera | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Poprawki onboardingu providera | Helpery konfiguracji onboardingu |
  | `plugin-sdk/provider-http` | Helpery HTTP providera | Ogólne helpery HTTP/zdolności endpointów providera |
  | `plugin-sdk/provider-web-fetch` | Helpery web-fetch providera | Helpery rejestracji/cache providera web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Helpery konfiguracji web-search providera | Wąskie helpery konfiguracji/poświadczeń web-search dla providerów, które nie wymagają powiązania włączania pluginu |
  | `plugin-sdk/provider-web-search-contract` | Helpery kontraktu web-search providera | Wąskie helpery kontraktu konfiguracji/poświadczeń web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowe settery/gettery poświadczeń |
  | `plugin-sdk/provider-web-search` | Helpery web-search providera | Helpery rejestracji/cache/runtime providera web-search |
  | `plugin-sdk/provider-tools` | Helpery zgodności narzędzi/schematów providera | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematów Gemini + diagnostyka oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpery użycia providera | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` i inne helpery użycia providera |
  | `plugin-sdk/provider-stream` | Helpery opakowań strumienia providera | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy opakowań strumienia oraz współdzielone helpery opakowań Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Uporządkowana kolejka async | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Współdzielone helpery mediów | Helpery pobierania/przekształcania/przechowywania mediów oraz buildery payloadów mediów |
  | `plugin-sdk/media-generation-runtime` | Współdzielone helpery generowania mediów | Współdzielone helpery failover, wybór kandydatów i komunikaty o brakującym modelu dla generowania obrazów/wideo/muzyki |
  | `plugin-sdk/media-understanding` | Helpery rozumienia mediów | Typy providerów rozumienia mediów oraz eksporty helperów obrazów/audio dla providerów |
  | `plugin-sdk/text-runtime` | Współdzielone helpery tekstowe | Usuwanie tekstu widocznego dla asystenta, helpery renderowania/chunkingu/tabel markdown, helpery redakcji, helpery tagów dyrektyw, narzędzia bezpiecznego tekstu i pokrewne helpery tekstu/logowania |
  | `plugin-sdk/text-chunking` | Helpery chunkingu tekstu | Helper chunkingu tekstu wychodzącego |
  | `plugin-sdk/speech` | Helpery mowy | Typy providerów mowy oraz eksporty helperów dyrektyw, rejestru i walidacji dla providerów |
  | `plugin-sdk/speech-core` | Współdzielony rdzeń mowy | Typy providerów mowy, rejestr, dyrektywy, normalizacja |
  | `plugin-sdk/realtime-transcription` | Helpery transkrypcji realtime | Typy providerów i helpery rejestru |
  | `plugin-sdk/realtime-voice` | Helpery głosu realtime | Typy providerów i helpery rejestru |
  | `plugin-sdk/image-generation-core` | Współdzielony rdzeń generowania obrazów | Typy generowania obrazów, failover, uwierzytelnianie i helpery rejestru |
  | `plugin-sdk/music-generation` | Helpery generowania muzyki | Typy providera/żądania/wyniku generowania muzyki |
  | `plugin-sdk/music-generation-core` | Współdzielony rdzeń generowania muzyki | Typy generowania muzyki, helpery failover, wyszukiwanie providera i parsowanie model-ref |
  | `plugin-sdk/video-generation` | Helpery generowania wideo | Typy providera/żądania/wyniku generowania wideo |
  | `plugin-sdk/video-generation-core` | Współdzielony rdzeń generowania wideo | Typy generowania wideo, helpery failover, wyszukiwanie providera i parsowanie model-ref |
  | `plugin-sdk/interactive-runtime` | Helpery interaktywnych odpowiedzi | Normalizacja/redukcja payloadu interaktywnych odpowiedzi |
  | `plugin-sdk/channel-config-primitives` | Prymitywy konfiguracji kanału | Wąskie prymitywy channel config-schema |
  | `plugin-sdk/channel-config-writes` | Helpery zapisu konfiguracji kanału | Helpery autoryzacji zapisu konfiguracji kanału |
  | `plugin-sdk/channel-plugin-common` | Współdzielone preludium kanału | Współdzielone eksporty preludium pluginu kanału |
  | `plugin-sdk/channel-status` | Helpery statusu kanału | Współdzielone helpery snapshotu/podsumowania statusu kanału |
  | `plugin-sdk/allowlist-config-edit` | Helpery konfiguracji allowlist | Helpery edycji/odczytu konfiguracji allowlist |
  | `plugin-sdk/group-access` | Helpery dostępu do grup | Współdzielone helpery decyzji dostępu do grup |
  | `plugin-sdk/direct-dm` | Helpery bezpośrednich DM | Współdzielone helpery autoryzacji/guardów bezpośrednich DM |
  | `plugin-sdk/extension-shared` | Współdzielone helpery rozszerzeń | Prymitywy helperów kanałów pasywnych/statusu i ambient proxy |
  | `plugin-sdk/webhook-targets` | Helpery celów webhook | Rejestr celów webhook i helpery instalacji rout |
  | `plugin-sdk/webhook-path` | Helpery ścieżek webhook | Helpery normalizacji ścieżek webhook |
  | `plugin-sdk/web-media` | Współdzielone helpery web media | Helpery ładowania mediów zdalnych/lokalnych |
  | `plugin-sdk/zod` | Reeksport zod | Reeksportowany `zod` dla użytkowników Plugin SDK |
  | `plugin-sdk/memory-core` | Helpery wbudowanego memory-core | Powierzchnia helperów menedżera pamięci/konfiguracji/plików/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime silnika pamięci | Fasada runtime indeksu/wyszukiwania pamięci |
  | `plugin-sdk/memory-core-host-engine-foundation` | Silnik hosta foundation dla pamięci | Eksporty silnika hosta foundation dla pamięci |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Silnik embeddingów hosta dla pamięci | Eksporty silnika embeddingów hosta dla pamięci |
  | `plugin-sdk/memory-core-host-engine-qmd` | Silnik QMD hosta dla pamięci | Eksporty silnika QMD hosta dla pamięci |
  | `plugin-sdk/memory-core-host-engine-storage` | Silnik storage hosta dla pamięci | Eksporty silnika storage hosta dla pamięci |
  | `plugin-sdk/memory-core-host-multimodal` | Helpery multimodalnego hosta pamięci | Helpery multimodalnego hosta pamięci |
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
  | `plugin-sdk/memory-host-markdown` | Helpery zarządzanego markdown | Współdzielone helpery zarządzanego markdown dla pluginów sąsiadujących z pamięcią |
  | `plugin-sdk/memory-host-search` | Fasada wyszukiwania aktywnej pamięci | Leniwa fasada runtime menedżera wyszukiwania aktywnej pamięci |
  | `plugin-sdk/memory-host-status` | Alias statusu hosta pamięci | Neutralny wobec dostawcy alias helperów statusu hosta pamięci |
  | `plugin-sdk/memory-lancedb` | Helpery wbudowanego memory-lancedb | Powierzchnia helperów memory-lancedb |
  | `plugin-sdk/testing` | Narzędzia testowe | Helpery testowe i mocki |
</Accordion>

Ta tabela celowo zawiera typowy podzbiór migracyjny, a nie pełną
powierzchnię SDK. Pełna lista ponad 200 punktów wejścia znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`.

Ta lista nadal zawiera niektóre powierzchnie helperów wbudowanych pluginów, takie jak
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` i `plugin-sdk/matrix*`. Pozostają one eksportowane na potrzeby
utrzymania i zgodności wbudowanych pluginów, ale celowo
pominięto je w typowej tabeli migracyjnej i nie są zalecanym celem dla
nowego kodu pluginów.

Ta sama zasada dotyczy innych rodzin helperów wbudowanych pluginów, takich jak:

- helpery obsługi przeglądarki: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- powierzchnie wbudowanych helperów/pluginów, takie jak `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` i `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` obecnie udostępnia wąską
powierzchnię helperów tokenów `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` i `resolveCopilotApiToken`.

Używaj najwęższego importu, który pasuje do zadania. Jeśli nie możesz znaleźć eksportu,
sprawdź źródło w `src/plugin-sdk/` lub zapytaj na Discord.

## Harmonogram usunięcia

| Kiedy                  | Co się dzieje                                                          |
| ---------------------- | ---------------------------------------------------------------------- |
| **Teraz**              | Przestarzałe powierzchnie emitują ostrzeżenia w runtime                |
| **Następna główna wersja** | Przestarzałe powierzchnie zostaną usunięte; pluginy nadal z nich korzystające przestaną działać |

Wszystkie podstawowe pluginy zostały już zmigrowane. Zewnętrzne pluginy powinny
przeprowadzić migrację przed następną główną wersją.

## Tymczasowe wyciszanie ostrzeżeń

Ustaw te zmienne środowiskowe podczas pracy nad migracją:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

To tymczasowa furtka awaryjna, a nie trwałe rozwiązanie.

## Powiązane

- [Pierwsze kroki](/pl/plugins/building-plugins) — zbuduj swój pierwszy plugin
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełne odniesienie do importów podścieżek
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — tworzenie pluginów kanałów
- [Pluginy providerów](/pl/plugins/sdk-provider-plugins) — tworzenie pluginów providerów
- [Wnętrze pluginów](/pl/plugins/architecture) — szczegółowe omówienie architektury
- [Manifest pluginu](/pl/plugins/manifest) — odniesienie do schematu manifestu
