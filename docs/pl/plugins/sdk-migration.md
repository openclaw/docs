---
read_when:
    - Widzisz ostrzeżenie OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Widzisz ostrzeżenie OPENCLAW_EXTENSION_API_DEPRECATED
    - Aktualizujesz plugin do nowoczesnej architektury pluginów
    - Utrzymujesz zewnętrzny plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Przejdź ze starszej warstwy zgodności wstecznej na nowoczesny plugin SDK
title: Migracja Plugin SDK
x-i18n:
    generated_at: "2026-04-06T09:46:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 94f12d1376edd8184714cc4dbea4a88fa8ed652f65e9365ede6176f3bf441b33
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migracja Plugin SDK

OpenClaw przeszedł od szerokiej warstwy zgodności wstecznej do nowoczesnej
architektury pluginów z ukierunkowanymi, udokumentowanymi importami. Jeśli Twój plugin został zbudowany przed
nową architekturą, ten przewodnik pomoże Ci przeprowadzić migrację.

## Co się zmienia

Stary system pluginów udostępniał dwie szeroko otwarte powierzchnie, które pozwalały pluginom importować
wszystko, czego potrzebowały, z jednego punktu wejścia:

- **`openclaw/plugin-sdk/compat`** — pojedynczy import, który ponownie eksportował dziesiątki
  pomocników. Został wprowadzony, aby starsze pluginy oparte na hookach nadal działały podczas budowy
  nowej architektury pluginów.
- **`openclaw/extension-api`** — pomost, który dawał pluginom bezpośredni dostęp do
  pomocników po stronie hosta, takich jak osadzony runner agenta.

Obie powierzchnie są teraz **przestarzałe**. Nadal działają w czasie działania, ale nowe
pluginy nie mogą z nich korzystać, a istniejące pluginy powinny przeprowadzić migrację przed następnym
głównym wydaniem, które je usunie.

<Warning>
  Warstwa zgodności wstecznej zostanie usunięta w jednym z przyszłych głównych wydań.
  Pluginy, które nadal importują z tych powierzchni, przestaną działać, gdy to nastąpi.
</Warning>

## Dlaczego to się zmieniło

Stare podejście powodowało problemy:

- **Powolne uruchamianie** — zaimportowanie jednego pomocnika wczytywało dziesiątki niepowiązanych modułów
- **Zależności cykliczne** — szerokie ponowne eksporty ułatwiały tworzenie cykli importów
- **Niejasna powierzchnia API** — nie było sposobu, aby określić, które eksporty są stabilne, a które wewnętrzne

Nowoczesny plugin SDK to naprawia: każda ścieżka importu (`openclaw/plugin-sdk/\<subpath\>`)
to mały, samowystarczalny moduł o jasnym przeznaczeniu i udokumentowanym kontrakcie.

Starsze wygodne warstwy dostawców dla wbudowanych kanałów również zostały usunięte. Importy
takie jak `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
pomocnicze warstwy oznaczone marką kanału oraz
`openclaw/plugin-sdk/telegram-core` były prywatnymi skrótami mono-repo, a nie
stabilnymi kontraktami pluginów. Zamiast tego używaj wąskich, generycznych podścieżek SDK. W obrębie
pakietu roboczego wbudowanych pluginów przechowuj pomocniki należące do dostawcy we własnym
`api.ts` lub `runtime-api.ts` tego pluginu.

Aktualne przykłady wbudowanych dostawców:

- Anthropic przechowuje pomocniki strumieni specyficzne dla Claude we własnej warstwie `api.ts` /
  `contract-api.ts`
- OpenAI przechowuje buildery dostawców, pomocniki domyślnych modeli i buildery dostawców realtime
  we własnym `api.ts`
- OpenRouter przechowuje builder dostawcy oraz pomocniki onboardingu/konfiguracji we własnym
  `api.ts`

## Jak przeprowadzić migrację

<Steps>
  <Step title="Sprawdź zachowanie fallbacku wrappera Windows">
    Jeśli Twój plugin używa `openclaw/plugin-sdk/windows-spawn`, nierozwiązane wrappery Windows
    `.cmd`/`.bat` teraz kończą się bezpieczną odmową, chyba że jawnie przekażesz
    `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Jeśli Twój wywołujący nie polega świadomie na fallbacku powłoki, nie ustawiaj
    `allowShellFallback` i zamiast tego obsłuż zgłoszony błąd.

  </Step>

  <Step title="Znajdź przestarzałe importy">
    Przeszukaj swój plugin pod kątem importów z którejkolwiek z przestarzałych powierzchni:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Zastąp je ukierunkowanymi importami">
    Każdy eksport ze starej powierzchni odpowiada konkretnej nowoczesnej ścieżce importu:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    W przypadku pomocników po stronie hosta użyj wstrzykniętego runtime pluginu zamiast importować je
    bezpośrednio:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Ten sam wzorzec dotyczy innych starszych pomocników pomostowych:

    | Stary import | Nowoczesny odpowiednik |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | pomocniki magazynu sesji | `api.runtime.agent.session.*` |

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
  | `plugin-sdk/plugin-entry` | Kanoniczny pomocnik punktu wejścia pluginu | `definePluginEntry` |
  | `plugin-sdk/core` | Starszy zbiorczy ponowny eksport definicji/builderów punktów wejścia kanałów | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Eksport głównego schematu konfiguracji | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Pomocnik punktu wejścia pojedynczego dostawcy | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Ukierunkowane definicje i buildery punktów wejścia kanałów | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Współdzielone pomocniki kreatora konfiguracji | Prompty allowlisty, buildery statusu konfiguracji |
  | `plugin-sdk/setup-runtime` | Pomocniki runtime na etapie konfiguracji | Bezpieczne dla importu adaptery łatek konfiguracji, pomocniki notatek wyszukiwania, `promptResolvedAllowFrom`, `splitSetupEntries`, delegowane proxy konfiguracji |
  | `plugin-sdk/setup-adapter-runtime` | Pomocniki adaptera konfiguracji | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Pomocniki narzędzi konfiguracji | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Pomocniki wielu kont | Pomocniki listy kont/konfiguracji/bramkowania akcji |
  | `plugin-sdk/account-id` | Pomocniki identyfikatora konta | `DEFAULT_ACCOUNT_ID`, normalizacja identyfikatora konta |
  | `plugin-sdk/account-resolution` | Pomocniki wyszukiwania konta | Pomocniki wyszukiwania konta + fallbacku domyślnego |
  | `plugin-sdk/account-helpers` | Wąskie pomocniki kont | Pomocniki listy kont/akcji na koncie |
  | `plugin-sdk/channel-setup` | Adaptery kreatora konfiguracji | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Prymitywy parowania DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Okablowanie prefiksu odpowiedzi + wpisywania | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabryki adapterów konfiguracji | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Buildery schematu konfiguracji | Typy schematu konfiguracji kanału |
  | `plugin-sdk/telegram-command-config` | Pomocniki konfiguracji komend Telegram | Normalizacja nazw komend, przycinanie opisów, walidacja duplikatów/konfliktów |
  | `plugin-sdk/channel-policy` | Rozwiązywanie polityki grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Śledzenie statusu konta | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Pomocniki kopert wejściowych | Współdzielone pomocniki trasy + buildera koperty |
  | `plugin-sdk/inbound-reply-dispatch` | Pomocniki odpowiedzi wejściowych | Współdzielone pomocniki zapisu i dyspozycji |
  | `plugin-sdk/messaging-targets` | Parsowanie celów wiadomości | Pomocniki parsowania/dopasowywania celów |
  | `plugin-sdk/outbound-media` | Pomocniki mediów wychodzących | Współdzielone ładowanie mediów wychodzących |
  | `plugin-sdk/outbound-runtime` | Pomocniki runtime wychodzącego | Pomocniki tożsamości wychodzącej/delegata wysyłki |
  | `plugin-sdk/thread-bindings-runtime` | Pomocniki powiązań wątków | Pomocniki cyklu życia powiązań wątków i adapterów |
  | `plugin-sdk/agent-media-payload` | Starsze pomocniki payloadów mediów | Builder payloadu mediów agenta dla starszych układów pól |
  | `plugin-sdk/channel-runtime` | Przestarzała warstwa zgodności | Tylko starsze narzędzia runtime kanału |
  | `plugin-sdk/channel-send-result` | Typy wyniku wysyłki | Typy wyniku odpowiedzi |
  | `plugin-sdk/runtime-store` | Trwała pamięć pluginu | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Szerokie pomocniki runtime | Pomocniki runtime/logowania/backupu/instalacji pluginów |
  | `plugin-sdk/runtime-env` | Wąskie pomocniki środowiska runtime | Logger/runtime env, timeout, retry i pomocniki backoff |
  | `plugin-sdk/plugin-runtime` | Współdzielone pomocniki runtime pluginu | Pomocniki komend/hooków/http/interaktywnych pluginu |
  | `plugin-sdk/hook-runtime` | Pomocniki pipeline hooków | Współdzielone pomocniki pipeline webhooków/wewnętrznych hooków |
  | `plugin-sdk/lazy-runtime` | Pomocniki leniwego runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Pomocniki procesów | Współdzielone pomocniki exec |
  | `plugin-sdk/cli-runtime` | Pomocniki runtime CLI | Formatowanie komend, oczekiwania, pomocniki wersji |
  | `plugin-sdk/gateway-runtime` | Pomocniki gateway | Klient gateway i pomocniki łatek statusu kanałów |
  | `plugin-sdk/config-runtime` | Pomocniki konfiguracji | Pomocniki wczytywania/zapisu konfiguracji |
  | `plugin-sdk/telegram-command-config` | Pomocniki komend Telegram | Pomocniki walidacji komend Telegram stabilne przy fallbacku, gdy powierzchnia kontraktu wbudowanego Telegram jest niedostępna |
  | `plugin-sdk/approval-runtime` | Pomocniki promptów akceptacji | Payload akceptacji exec/pluginu, pomocniki możliwości/profilu akceptacji, natywne trasowanie/runtime akceptacji |
  | `plugin-sdk/approval-auth-runtime` | Pomocniki autoryzacji akceptacji | Rozwiązywanie osoby zatwierdzającej, autoryzacja działań w tym samym czacie |
  | `plugin-sdk/approval-client-runtime` | Pomocniki klienta akceptacji | Pomocniki profilu/filtra natywnej akceptacji exec |
  | `plugin-sdk/approval-delivery-runtime` | Pomocniki dostarczania akceptacji | Adaptery możliwości/dostarczania natywnej akceptacji |
  | `plugin-sdk/approval-native-runtime` | Pomocniki celu akceptacji | Pomocniki powiązania celu/konta natywnej akceptacji |
  | `plugin-sdk/approval-reply-runtime` | Pomocniki odpowiedzi akceptacji | Pomocniki payloadu odpowiedzi akceptacji exec/pluginu |
  | `plugin-sdk/security-runtime` | Pomocniki bezpieczeństwa | Współdzielone pomocniki zaufania, bramkowania DM, treści zewnętrznych i zbierania sekretów |
  | `plugin-sdk/ssrf-policy` | Pomocniki polityki SSRF | Pomocniki allowlisty hostów i polityki sieci prywatnych |
  | `plugin-sdk/ssrf-runtime` | Pomocniki runtime SSRF | Pomocniki przypiętego dispatchera, guarded fetch i polityki SSRF |
  | `plugin-sdk/collection-runtime` | Pomocniki ograniczonej pamięci podręcznej | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Pomocniki bramkowania diagnostyki | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Pomocniki formatowania błędów | `formatUncaughtError`, `isApprovalNotFoundError`, pomocniki grafu błędów |
  | `plugin-sdk/fetch-runtime` | Pomocniki opakowanego fetch/proxy | `resolveFetch`, pomocniki proxy |
  | `plugin-sdk/host-runtime` | Pomocniki normalizacji hosta | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Pomocniki retry | `RetryConfig`, `retryAsync`, wykonawcy polityk |
  | `plugin-sdk/allow-from` | Formatowanie allowlisty | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapowanie danych wejściowych allowlisty | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Bramkowanie komend i pomocniki powierzchni komend | `resolveControlCommandGate`, pomocniki autoryzacji nadawcy, pomocniki rejestru komend |
  | `plugin-sdk/secret-input` | Parsowanie danych wejściowych sekretów | Pomocniki danych wejściowych sekretów |
  | `plugin-sdk/webhook-ingress` | Pomocniki żądań webhooków | Narzędzia celu webhooka |
  | `plugin-sdk/webhook-request-guards` | Pomocniki guardów treści webhooków | Pomocniki odczytu/limitu ciała żądania |
  | `plugin-sdk/reply-runtime` | Współdzielony runtime odpowiedzi | Dyspozycja wejściowa, heartbeat, planer odpowiedzi, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Wąskie pomocniki dyspozycji odpowiedzi | Pomocniki finalizacji + dyspozycji dostawcy |
  | `plugin-sdk/reply-history` | Pomocniki historii odpowiedzi | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planowanie odniesień odpowiedzi | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Pomocniki chunków odpowiedzi | Pomocniki chunkingu tekstu/markdown |
  | `plugin-sdk/session-store-runtime` | Pomocniki magazynu sesji | Pomocniki ścieżki magazynu i czasu aktualizacji |
  | `plugin-sdk/state-paths` | Pomocniki ścieżek stanu | Pomocniki katalogów stanu i OAuth |
  | `plugin-sdk/routing` | Pomocniki routingu/kluczy sesji | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, pomocniki normalizacji kluczy sesji |
  | `plugin-sdk/status-helpers` | Pomocniki statusu kanału | Buildery podsumowań statusu kanału/konta, domyślne ustawienia stanu runtime, pomocniki metadanych problemów |
  | `plugin-sdk/target-resolver-runtime` | Pomocniki rozwiązywania celu | Współdzielone pomocniki resolvera celu |
  | `plugin-sdk/string-normalization-runtime` | Pomocniki normalizacji ciągów | Pomocniki normalizacji slugów/ciągów |
  | `plugin-sdk/request-url` | Pomocniki URL żądań | Wyodrębnianie URL-i tekstowych z danych wejściowych podobnych do żądania |
  | `plugin-sdk/run-command` | Pomocniki komend z limitem czasu | Runner komend z normalizowanym stdout/stderr |
  | `plugin-sdk/param-readers` | Odczytywacze parametrów | Typowe odczytywacze parametrów narzędzi/CLI |
  | `plugin-sdk/tool-send` | Ekstrakcja wysyłki narzędzia | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
  | `plugin-sdk/temp-path` | Pomocniki ścieżek tymczasowych | Współdzielone pomocniki ścieżek tymczasowego pobierania |
  | `plugin-sdk/logging-core` | Pomocniki logowania | Logger podsystemu i pomocniki redakcji |
  | `plugin-sdk/markdown-table-runtime` | Pomocniki tabel markdown | Pomocniki trybu tabel markdown |
  | `plugin-sdk/reply-payload` | Typy odpowiedzi wiadomości | Typy payloadu odpowiedzi |
  | `plugin-sdk/provider-setup` | Kuratorowane pomocniki konfiguracji lokalnego/samohostowanego dostawcy | Pomocniki wykrywania/konfiguracji samohostowanego dostawcy |
  | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane pomocniki konfiguracji samohostowanego dostawcy zgodnego z OpenAI | Te same pomocniki wykrywania/konfiguracji samohostowanego dostawcy |
  | `plugin-sdk/provider-auth-runtime` | Pomocniki runtime autoryzacji dostawcy | Pomocniki rozwiązywania klucza API w runtime |
  | `plugin-sdk/provider-auth-api-key` | Pomocniki konfiguracji klucza API dostawcy | Pomocniki onboardingu/zapisu profilu klucza API |
  | `plugin-sdk/provider-auth-result` | Pomocniki wyniku autoryzacji dostawcy | Standardowy builder wyniku autoryzacji OAuth |
  | `plugin-sdk/provider-auth-login` | Pomocniki interaktywnego logowania dostawcy | Współdzielone pomocniki interaktywnego logowania |
  | `plugin-sdk/provider-env-vars` | Pomocniki zmiennych środowiskowych dostawcy | Pomocniki wyszukiwania zmiennych środowiskowych autoryzacji dostawcy |
  | `plugin-sdk/provider-model-shared` | Współdzielone pomocniki modeli/replay dostawcy | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone buildery polityki replay, pomocniki punktów końcowych dostawcy oraz pomocniki normalizacji identyfikatora modelu |
  | `plugin-sdk/provider-catalog-shared` | Współdzielone pomocniki katalogu dostawców | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Łatki onboardingu dostawcy | Pomocniki konfiguracji onboardingu |
  | `plugin-sdk/provider-http` | Pomocniki HTTP dostawcy | Generyczne pomocniki możliwości HTTP/punktów końcowych dostawcy |
  | `plugin-sdk/provider-web-fetch` | Pomocniki web-fetch dostawcy | Pomocniki rejestracji/cache dostawcy web-fetch |
  | `plugin-sdk/provider-web-search` | Pomocniki web-search dostawcy | Pomocniki rejestracji/cache/konfiguracji dostawcy web-search |
  | `plugin-sdk/provider-tools` | Pomocniki zgodności narzędzi/schematów dostawcy | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematu Gemini + diagnostyka oraz pomocniki zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Pomocniki użycia dostawcy | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` i inne pomocniki użycia dostawcy |
  | `plugin-sdk/provider-stream` | Pomocniki opakowań strumieni dostawcy | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy opakowań strumieni oraz współdzielone pomocniki opakowań Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Uporządkowana kolejka async | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Współdzielone pomocniki mediów | Pomocniki pobierania/transformacji/przechowywania mediów oraz buildery payloadów mediów |
  | `plugin-sdk/media-generation-runtime` | Współdzielone pomocniki generowania mediów | Współdzielone pomocniki failover, wyboru kandydatów i komunikatów o brakującym modelu dla generowania obrazów/wideo/muzyki |
  | `plugin-sdk/media-understanding` | Pomocniki rozumienia mediów | Typy dostawców rozumienia mediów oraz eksporty pomocników obrazów/audio skierowane do dostawców |
  | `plugin-sdk/text-runtime` | Współdzielone pomocniki tekstowe | Usuwanie tekstu widocznego dla asystenta, pomocniki renderowania/chunkingu/tabel markdown, pomocniki redakcji, pomocniki tagów dyrektyw, narzędzia bezpiecznego tekstu oraz powiązane pomocniki tekstu/logowania |
  | `plugin-sdk/text-chunking` | Pomocniki chunkingu tekstu | Pomocnik chunkingu tekstu wychodzącego |
  | `plugin-sdk/speech` | Pomocniki mowy | Typy dostawców mowy oraz eksporty pomocników dyrektyw, rejestru i walidacji skierowane do dostawców |
  | `plugin-sdk/speech-core` | Współdzielony rdzeń mowy | Typy dostawców mowy, rejestr, dyrektywy, normalizacja |
  | `plugin-sdk/realtime-transcription` | Pomocniki transkrypcji realtime | Typy dostawców i pomocniki rejestru |
  | `plugin-sdk/realtime-voice` | Pomocniki głosu realtime | Typy dostawców i pomocniki rejestru |
  | `plugin-sdk/image-generation-core` | Współdzielony rdzeń generowania obrazów | Pomocniki typów, failover, autoryzacji i rejestru generowania obrazów |
  | `plugin-sdk/music-generation` | Pomocniki generowania muzyki | Typy dostawcy/żądania/wyniku generowania muzyki |
  | `plugin-sdk/music-generation-core` | Współdzielony rdzeń generowania muzyki | Typy generowania muzyki, pomocniki failover, wyszukiwanie dostawcy i parsowanie model-ref |
  | `plugin-sdk/video-generation` | Pomocniki generowania wideo | Typy dostawcy/żądania/wyniku generowania wideo |
  | `plugin-sdk/video-generation-core` | Współdzielony rdzeń generowania wideo | Typy generowania wideo, pomocniki failover, wyszukiwanie dostawcy i parsowanie model-ref |
  | `plugin-sdk/interactive-runtime` | Pomocniki odpowiedzi interaktywnych | Normalizacja/redukcja payloadu odpowiedzi interaktywnych |
  | `plugin-sdk/channel-config-primitives` | Prymitywy konfiguracji kanału | Wąskie prymitywy schema konfiguracji kanału |
  | `plugin-sdk/channel-config-writes` | Pomocniki zapisu konfiguracji kanału | Pomocniki autoryzacji zapisu konfiguracji kanału |
  | `plugin-sdk/channel-plugin-common` | Współdzielone preludium kanału | Eksporty współdzielonego preludium pluginu kanału |
  | `plugin-sdk/channel-status` | Pomocniki statusu kanału | Współdzielone pomocniki snapshotów/podsumowań statusu kanału |
  | `plugin-sdk/allowlist-config-edit` | Pomocniki konfiguracji allowlisty | Pomocniki edycji/odczytu konfiguracji allowlisty |
  | `plugin-sdk/group-access` | Pomocniki dostępu grupowego | Współdzielone pomocniki decyzji o dostępie grupowym |
  | `plugin-sdk/direct-dm` | Pomocniki bezpośrednich DM | Współdzielone pomocniki autoryzacji/guardów bezpośrednich DM |
  | `plugin-sdk/extension-shared` | Współdzielone pomocniki rozszerzeń | Prymitywy pomocników pasywnego kanału/statusu |
  | `plugin-sdk/webhook-targets` | Pomocniki celów webhooków | Rejestr celów webhooków i pomocniki instalacji tras |
  | `plugin-sdk/webhook-path` | Pomocniki ścieżek webhooków | Pomocniki normalizacji ścieżek webhooków |
  | `plugin-sdk/web-media` | Współdzielone pomocniki web media | Pomocniki ładowania zdalnych/lokalnych mediów |
  | `plugin-sdk/zod` | Ponowny eksport Zod | Ponownie eksportowany `zod` dla konsumentów plugin SDK |
  | `plugin-sdk/memory-core` | Wbudowane pomocniki memory-core | Powierzchnia pomocników memory manager/config/file/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime silnika pamięci | Fasada runtime indeksowania/wyszukiwania pamięci |
  | `plugin-sdk/memory-core-host-engine-foundation` | Bazowy silnik hosta pamięci | Eksporty bazowego silnika hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Silnik embeddingów hosta pamięci | Eksporty silnika embeddingów hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-qmd` | Silnik QMD hosta pamięci | Eksporty silnika QMD hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-storage` | Silnik storage hosta pamięci | Eksporty silnika storage hosta pamięci |
  | `plugin-sdk/memory-core-host-multimodal` | Pomocniki multimodalne hosta pamięci | Pomocniki multimodalne hosta pamięci |
  | `plugin-sdk/memory-core-host-query` | Pomocniki zapytań hosta pamięci | Pomocniki zapytań hosta pamięci |
  | `plugin-sdk/memory-core-host-secret` | Pomocniki sekretów hosta pamięci | Pomocniki sekretów hosta pamięci |
  | `plugin-sdk/memory-core-host-events` | Pomocniki dziennika zdarzeń hosta pamięci | Pomocniki dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-core-host-status` | Pomocniki statusu hosta pamięci | Pomocniki statusu hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI hosta pamięci | Pomocniki runtime CLI hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime rdzenia hosta pamięci | Pomocniki runtime rdzenia hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-files` | Pomocniki plików/runtime hosta pamięci | Pomocniki plików/runtime hosta pamięci |
  | `plugin-sdk/memory-host-core` | Alias runtime rdzenia hosta pamięci | Neutralny względem dostawcy alias dla pomocników runtime rdzenia hosta pamięci |
  | `plugin-sdk/memory-host-events` | Alias dziennika zdarzeń hosta pamięci | Neutralny względem dostawcy alias dla pomocników dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-host-files` | Alias plików/runtime hosta pamięci | Neutralny względem dostawcy alias dla pomocników plików/runtime hosta pamięci |
  | `plugin-sdk/memory-host-markdown` | Pomocniki zarządzanego markdown | Współdzielone pomocniki zarządzanego markdown dla pluginów powiązanych z pamięcią |
  | `plugin-sdk/memory-host-search` | Fasada wyszukiwania aktywnej pamięci | Leniwa fasada runtime search-manager aktywnej pamięci |
  | `plugin-sdk/memory-host-status` | Alias statusu hosta pamięci | Neutralny względem dostawcy alias dla pomocników statusu hosta pamięci |
  | `plugin-sdk/memory-lancedb` | Wbudowane pomocniki memory-lancedb | Powierzchnia pomocników memory-lancedb |
  | `plugin-sdk/testing` | Narzędzia testowe | Pomocniki testowe i mocki |
</Accordion>

Ta tabela celowo obejmuje typowy podzbiór migracyjny, a nie pełną powierzchnię SDK.
Pełna lista ponad 200 punktów wejścia znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`.

Ta lista nadal zawiera niektóre pomocnicze warstwy wbudowanych pluginów, takie jak
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` i `plugin-sdk/matrix*`. Nadal są one eksportowane na potrzeby
utrzymania i zgodności wbudowanych pluginów, ale zostały celowo
pominięte w typowej tabeli migracyjnej i nie są zalecanym celem dla
nowego kodu pluginów.

Ta sama zasada dotyczy innych rodzin wbudowanych pomocników, takich jak:

- pomocniki obsługi przeglądarki: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- wbudowane powierzchnie pomocników/pluginów, takie jak `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` i `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` obecnie udostępnia wąską
powierzchnię pomocników tokenów `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` i `resolveCopilotApiToken`.

Używaj najwęższego importu pasującego do zadania. Jeśli nie możesz znaleźć eksportu,
sprawdź źródło w `src/plugin-sdk/` lub zapytaj na Discord.

## Harmonogram usunięcia

| Kiedy                  | Co się dzieje                                                         |
| ---------------------- | --------------------------------------------------------------------- |
| **Teraz**              | Przestarzałe powierzchnie emitują ostrzeżenia w runtime               |
| **Następne główne wydanie** | Przestarzałe powierzchnie zostaną usunięte; pluginy, które nadal z nich korzystają, przestaną działać |

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
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełna dokumentacja importów podścieżek
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — tworzenie pluginów kanałów
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — tworzenie pluginów dostawców
- [Wnętrze pluginów](/pl/plugins/architecture) — szczegółowe omówienie architektury
- [Manifest pluginu](/pl/plugins/manifest) — dokumentacja schematu manifestu
