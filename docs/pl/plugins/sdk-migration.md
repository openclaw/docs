---
read_when:
    - Widzisz ostrzeżenie OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Widzisz ostrzeżenie OPENCLAW_EXTENSION_API_DEPRECATED
    - Aktualizujesz wtyczkę do nowoczesnej architektury wtyczek OpenClaw
    - Utrzymujesz zewnętrzną wtyczkę OpenClaw
sidebarTitle: Migrate to SDK
summary: Migracja ze starszej warstwy zgodności wstecznej do nowoczesnego Plugin SDK
title: Migracja Plugin SDK
x-i18n:
    generated_at: "2026-04-05T14:02:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: c420b8d7de17aee16c5aa67e3a88da5750f0d84b07dd541f061081080e081196
    source_path: plugins/sdk-migration.md
    workflow: 15
---

# Migracja Plugin SDK

OpenClaw przeszedł od szerokiej warstwy zgodności wstecznej do nowoczesnej
architektury wtyczek z ukierunkowanymi, udokumentowanymi importami. Jeśli Twoja
wtyczka została zbudowana przed wprowadzeniem nowej architektury, ten przewodnik
pomoże Ci przeprowadzić migrację.

## Co się zmienia

Stary system wtyczek udostępniał dwie szerokie powierzchnie, które pozwalały
wtyczkom importować wszystko, czego potrzebowały, z jednego punktu wejścia:

- **`openclaw/plugin-sdk/compat`** — pojedynczy import, który ponownie eksportował dziesiątki
  helperów. Został wprowadzony, aby starsze wtyczki oparte na hookach nadal działały podczas
  budowy nowej architektury wtyczek.
- **`openclaw/extension-api`** — most, który dawał wtyczkom bezpośredni dostęp do
  helperów po stronie hosta, takich jak osadzony runner agenta.

Obie te powierzchnie są teraz **przestarzałe**. Nadal działają w środowisku uruchomieniowym, ale nowe
wtyczki nie mogą ich używać, a istniejące wtyczki powinny przeprowadzić migrację przed kolejnym
dużym wydaniem, w którym zostaną usunięte.

<Warning>
  Warstwa zgodności wstecznej zostanie usunięta w przyszłym dużym wydaniu.
  Wtyczki, które nadal importują z tych powierzchni, przestaną działać, gdy to nastąpi.
</Warning>

## Dlaczego to się zmieniło

Stare podejście powodowało problemy:

- **Wolne uruchamianie** — import jednego helpera ładował dziesiątki niepowiązanych modułów
- **Zależności cykliczne** — szerokie reeksporty ułatwiały tworzenie cykli importów
- **Niejasna powierzchnia API** — nie dało się określić, które eksporty są stabilne, a które wewnętrzne

Nowoczesne Plugin SDK rozwiązuje ten problem: każda ścieżka importu (`openclaw/plugin-sdk/\<subpath\>`)
jest małym, samodzielnym modułem o jasno określonym celu i udokumentowanym kontrakcie.

Starsze wygodne powierzchnie dostawców dla wbudowanych kanałów również zostały usunięte. Importy
takie jak `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
pomocnicze powierzchnie oznaczone marką kanału oraz
`openclaw/plugin-sdk/telegram-core` były prywatnymi skrótami monorepo, a nie
stabilnymi kontraktami wtyczek. Zamiast tego używaj wąskich, ogólnych subścieżek SDK. W obrębie
obszaru roboczego wbudowanych wtyczek trzymaj helpery należące do dostawcy we własnym
`api.ts` lub `runtime-api.ts` tej wtyczki.

Aktualne przykłady wbudowanych dostawców:

- Anthropic trzyma helpery strumieni specyficzne dla Claude we własnej powierzchni `api.ts` /
  `contract-api.ts`
- OpenAI trzyma konstruktory dostawców, helpery modeli domyślnych oraz konstruktory dostawców
  realtime we własnym `api.ts`
- OpenRouter trzyma konstruktor dostawcy oraz helpery onboardingu/konfiguracji we własnym
  `api.ts`

## Jak przeprowadzić migrację

<Steps>
  <Step title="Sprawdź zachowanie awaryjne wrappera Windows">
    Jeśli Twoja wtyczka używa `openclaw/plugin-sdk/windows-spawn`, nierozwiązane wrappery Windows
    `.cmd`/`.bat` teraz domyślnie kończą się błędem, chyba że jawnie przekażesz
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

    Jeśli Twój kod wywołujący nie opiera się celowo na fallbacku powłoki, nie ustawiaj
    `allowShellFallback` i zamiast tego obsłuż zgłoszony błąd.

  </Step>

  <Step title="Znajdź przestarzałe importy">
    Przeszukaj swoją wtyczkę pod kątem importów z dowolnej z dwóch przestarzałych powierzchni:

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

    W przypadku helperów po stronie hosta użyj wstrzykniętego środowiska uruchomieniowego wtyczki zamiast
    importować je bezpośrednio:

    ```typescript
    // Przed (przestarzały most extension-api)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // Po (wstrzyknięte środowisko uruchomieniowe)
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

## Informacje o ścieżkach importu

<Accordion title="Tabela typowych ścieżek importu">
  | Ścieżka importu | Przeznaczenie | Kluczowe eksporty |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanoniczny helper punktu wejścia wtyczki | `definePluginEntry` |
  | `plugin-sdk/core` | Starszy zbiorczy reeksport definicji/konstruktorów wejść kanałów | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Eksport schematu konfiguracji głównej | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper punktu wejścia pojedynczego dostawcy | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Ukierunkowane definicje i konstruktory wejść kanałów | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Wspólne helpery kreatora konfiguracji | Prompty allowlisty, konstruktory statusu konfiguracji |
  | `plugin-sdk/setup-runtime` | Helpery środowiska uruchomieniowego dla konfiguracji | Bezpieczne do importu adaptery łatek konfiguracji, helpery notatek wyszukiwania, `promptResolvedAllowFrom`, `splitSetupEntries`, delegowane proxy konfiguracji |
  | `plugin-sdk/setup-adapter-runtime` | Helpery adapterów konfiguracji | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Helpery narzędzi konfiguracji | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpery wielu kont | Helpery list kont/konfiguracji/bramkowania działań |
  | `plugin-sdk/account-id` | Helpery ID konta | `DEFAULT_ACCOUNT_ID`, normalizacja ID konta |
  | `plugin-sdk/account-resolution` | Helpery wyszukiwania kont | Helpery wyszukiwania konta + fallbacku domyślnego |
  | `plugin-sdk/account-helpers` | Wąskie helpery kont | Helpery list kont/działań na kontach |
  | `plugin-sdk/channel-setup` | Adaptery kreatora konfiguracji | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Podstawy parowania DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Łączenie prefiksu odpowiedzi i pisania | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | Fabryki adapterów konfiguracji | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | Konstruktory schematów konfiguracji | Typy schematów konfiguracji kanałów |
  | `plugin-sdk/telegram-command-config` | Helpery konfiguracji poleceń Telegram | Normalizacja nazw poleceń, przycinanie opisów, walidacja duplikatów/konfliktów |
  | `plugin-sdk/channel-policy` | Rozwiązywanie polityk grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Śledzenie stanu kont | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | Helpery koperty przychodzącej | Wspólne helpery tras i konstruktorów kopert |
  | `plugin-sdk/inbound-reply-dispatch` | Helpery odpowiedzi przychodzących | Wspólne helpery rejestrowania i wysyłki |
  | `plugin-sdk/messaging-targets` | Parsowanie celów wiadomości | Helpery parsowania/dopasowywania celów |
  | `plugin-sdk/outbound-media` | Helpery mediów wychodzących | Wspólne ładowanie mediów wychodzących |
  | `plugin-sdk/outbound-runtime` | Helpery środowiska uruchomieniowego dla ruchu wychodzącego | Helpery tożsamości wychodzącej/delegata wysyłki |
  | `plugin-sdk/thread-bindings-runtime` | Helpery powiązań wątków | Helpery cyklu życia i adapterów powiązań wątków |
  | `plugin-sdk/agent-media-payload` | Starsze helpery payloadu mediów | Konstruktor payloadu mediów agenta dla starszych układów pól |
  | `plugin-sdk/channel-runtime` | Przestarzały shim zgodności | Tylko starsze narzędzia środowiska uruchomieniowego kanałów |
  | `plugin-sdk/channel-send-result` | Typy wyników wysyłki | Typy wyników odpowiedzi |
  | `plugin-sdk/runtime-store` | Trwała pamięć wtyczki | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Szerokie helpery środowiska uruchomieniowego | Helpery runtime/logowania/backupu/instalacji wtyczek |
  | `plugin-sdk/runtime-env` | Wąskie helpery środowiska runtime | Logger/środowisko runtime, helpery timeoutów, ponawiania i backoffu |
  | `plugin-sdk/plugin-runtime` | Wspólne helpery środowiska uruchomieniowego wtyczek | Helpery poleceń/hooków/HTTP/interaktywne dla wtyczek |
  | `plugin-sdk/hook-runtime` | Helpery pipeline hooków | Wspólne helpery pipeline webhooków/wewnętrznych hooków |
  | `plugin-sdk/lazy-runtime` | Helpery leniwego środowiska uruchomieniowego | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpery procesów | Wspólne helpery exec |
  | `plugin-sdk/cli-runtime` | Helpery środowiska uruchomieniowego CLI | Formatowanie poleceń, oczekiwania, helpery wersji |
  | `plugin-sdk/gateway-runtime` | Helpery gateway | Klient gateway i helpery łatek statusu kanałów |
  | `plugin-sdk/config-runtime` | Helpery konfiguracji | Helpery ładowania/zapisu konfiguracji |
  | `plugin-sdk/telegram-command-config` | Helpery poleceń Telegram | Stabilne helpery walidacji poleceń Telegram z fallbackiem, gdy powierzchnia kontraktu wbudowanego Telegrama jest niedostępna |
  | `plugin-sdk/approval-runtime` | Helpery promptów zatwierdzania | Payloady zatwierdzania exec/wtyczek, helpery możliwości/profilu zatwierdzania, natywne trasowanie/runtime zatwierdzania |
  | `plugin-sdk/approval-auth-runtime` | Helpery uwierzytelniania zatwierdzania | Rozwiązywanie zatwierdzającego, uwierzytelnianie działań w tym samym czacie |
  | `plugin-sdk/approval-client-runtime` | Helpery klienta zatwierdzania | Helpery profilu/filtrowania natywnego zatwierdzania exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpery dostarczania zatwierdzania | Adaptery natywnych możliwości/dostarczania zatwierdzania |
  | `plugin-sdk/approval-native-runtime` | Helpery celu zatwierdzania | Helpery natywnego celu zatwierdzania/powiązania kont |
  | `plugin-sdk/approval-reply-runtime` | Helpery odpowiedzi zatwierdzania | Helpery payloadu odpowiedzi zatwierdzania exec/wtyczek |
  | `plugin-sdk/security-runtime` | Helpery bezpieczeństwa | Wspólne helpery zaufania, bramkowania DM, treści zewnętrznych i zbierania sekretów |
  | `plugin-sdk/ssrf-policy` | Helpery polityki SSRF | Helpery allowlisty hostów i polityki sieci prywatnych |
  | `plugin-sdk/ssrf-runtime` | Helpery środowiska uruchomieniowego SSRF | Przypięty dispatcher, guarded fetch, helpery polityki SSRF |
  | `plugin-sdk/collection-runtime` | Helpery ograniczonego cache | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpery bramkowania diagnostyki | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpery formatowania błędów | `formatUncaughtError`, `isApprovalNotFoundError`, helpery grafu błędów |
  | `plugin-sdk/fetch-runtime` | Helpery opakowanego fetch/proxy | `resolveFetch`, helpery proxy |
  | `plugin-sdk/host-runtime` | Helpery normalizacji hosta | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpery ponawiania | `RetryConfig`, `retryAsync`, wykonawcy polityk |
  | `plugin-sdk/allow-from` | Formatowanie allowlisty | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapowanie wejść allowlisty | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Bramkowanie poleceń i helpery powierzchni poleceń | `resolveControlCommandGate`, helpery autoryzacji nadawcy, helpery rejestru poleceń |
  | `plugin-sdk/secret-input` | Parsowanie wejścia sekretów | Helpery wejścia sekretów |
  | `plugin-sdk/webhook-ingress` | Helpery żądań webhooków | Narzędzia celu webhooka |
  | `plugin-sdk/webhook-request-guards` | Helpery ochrony żądań webhooków | Helpery odczytu/ograniczania treści żądania |
  | `plugin-sdk/reply-runtime` | Wspólne środowisko uruchomieniowe odpowiedzi | Wysyłka przychodząca, heartbeat, planista odpowiedzi, dzielenie na fragmenty |
  | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery wysyłki odpowiedzi | Helpery finalizacji i wysyłki do dostawcy |
  | `plugin-sdk/reply-history` | Helpery historii odpowiedzi | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planowanie referencji odpowiedzi | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpery dzielenia odpowiedzi | Helpery dzielenia tekstu/Markdown |
  | `plugin-sdk/session-store-runtime` | Helpery magazynu sesji | Helpery ścieżki magazynu i `updated-at` |
  | `plugin-sdk/state-paths` | Helpery ścieżek stanu | Helpery katalogów stanu i OAuth |
  | `plugin-sdk/routing` | Helpery routingu/klucza sesji | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpery normalizacji klucza sesji |
  | `plugin-sdk/status-helpers` | Helpery statusu kanałów | Konstruktory podsumowań statusu kanałów/kont, domyślne stany runtime, helpery metadanych problemów |
  | `plugin-sdk/target-resolver-runtime` | Helpery rozwiązywania celów | Wspólne helpery rozwiązywania celów |
  | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji tekstu | Helpery normalizacji slugów/łańcuchów |
  | `plugin-sdk/request-url` | Helpery URL żądań | Wyodrębnianie tekstowych URL-i z wejść podobnych do żądań |
  | `plugin-sdk/run-command` | Helpery poleceń z limitem czasu | Uruchamianie poleceń z normalizowanym stdout/stderr |
  | `plugin-sdk/param-readers` | Odczyt parametrów | Wspólne odczyty parametrów narzędzi/CLI |
  | `plugin-sdk/tool-send` | Ekstrakcja wysyłki narzędzia | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
  | `plugin-sdk/temp-path` | Helpery ścieżek tymczasowych | Wspólne helpery ścieżek tymczasowych pobrań |
  | `plugin-sdk/logging-core` | Helpery logowania | Logger podsystemu i helpery redakcji |
  | `plugin-sdk/markdown-table-runtime` | Helpery tabel Markdown | Helpery trybu tabel Markdown |
  | `plugin-sdk/reply-payload` | Typy odpowiedzi wiadomości | Typy payloadu odpowiedzi |
  | `plugin-sdk/provider-setup` | Kuratorowane helpery konfiguracji dostawców lokalnych/self-hosted | Helpery wykrywania/konfiguracji dostawców self-hosted |
  | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane helpery konfiguracji dostawców self-hosted zgodnych z OpenAI | Te same helpery wykrywania/konfiguracji dostawców self-hosted |
  | `plugin-sdk/provider-auth-runtime` | Helpery uwierzytelniania dostawców w runtime | Helpery rozwiązywania kluczy API w runtime |
  | `plugin-sdk/provider-auth-api-key` | Helpery konfiguracji kluczy API dostawców | Helpery onboardingu kluczy API/zapisu profilu |
  | `plugin-sdk/provider-auth-result` | Helpery wyników uwierzytelniania dostawców | Standardowy konstruktor wyniku uwierzytelniania OAuth |
  | `plugin-sdk/provider-auth-login` | Helpery interaktywnego logowania dostawców | Wspólne helpery interaktywnego logowania |
  | `plugin-sdk/provider-env-vars` | Helpery zmiennych środowiskowych dostawców | Helpery wyszukiwania zmiennych środowiskowych uwierzytelniania dostawców |
  | `plugin-sdk/provider-model-shared` | Wspólne helpery modeli/odtwarzania dostawców | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, wspólne konstruktory polityki odtwarzania, helpery endpointów dostawców oraz normalizacji identyfikatorów modeli |
  | `plugin-sdk/provider-catalog-shared` | Wspólne helpery katalogów dostawców | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Łatki onboardingu dostawców | Helpery konfiguracji onboardingu |
  | `plugin-sdk/provider-http` | Helpery HTTP dostawców | Ogólne helpery HTTP/zdolności endpointów dostawców |
  | `plugin-sdk/provider-web-fetch` | Helpery web-fetch dostawców | Helpery rejestracji/cache dostawców web-fetch |
  | `plugin-sdk/provider-web-search` | Helpery web-search dostawców | Helpery rejestracji/cache/konfiguracji dostawców web-search |
  | `plugin-sdk/provider-tools` | Helpery zgodności narzędzi/schematów dostawców | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematów Gemini + diagnostyka oraz helpery zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Helpery zużycia dostawców | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` i inne helpery zużycia dostawców |
  | `plugin-sdk/provider-stream` | Helpery wrapperów strumieni dostawców | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz wspólne helpery wrapperów Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/keyed-async-queue` | Uporządkowana kolejka asynchroniczna | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Wspólne helpery mediów | Helpery pobierania/przekształcania/przechowywania mediów oraz konstruktory payloadów mediów |
  | `plugin-sdk/media-understanding` | Helpery rozumienia mediów | Typy dostawców rozumienia mediów oraz eksporty helperów obrazów/audio dla dostawców |
  | `plugin-sdk/text-runtime` | Wspólne helpery tekstu | Usuwanie tekstu widocznego dla asystenta, renderowanie/dzielenie/tabele Markdown, helpery redakcji, helpery tagów dyrektyw, narzędzia bezpiecznego tekstu oraz powiązane helpery tekstu/logowania |
  | `plugin-sdk/text-chunking` | Helpery dzielenia tekstu | Helper dzielenia tekstu wychodzącego |
  | `plugin-sdk/speech` | Helpery mowy | Typy dostawców mowy oraz eksporty helperów dyrektyw, rejestru i walidacji dla dostawców |
  | `plugin-sdk/speech-core` | Wspólny rdzeń mowy | Typy dostawców mowy, rejestr, dyrektywy, normalizacja |
  | `plugin-sdk/realtime-transcription` | Helpery transkrypcji realtime | Typy dostawców i helpery rejestru |
  | `plugin-sdk/realtime-voice` | Helpery głosu realtime | Typy dostawców i helpery rejestru |
  | `plugin-sdk/image-generation-core` | Wspólny rdzeń generowania obrazów | Helpery typów, failoveru, uwierzytelniania i rejestru generowania obrazów |
  | `plugin-sdk/video-generation` | Helpery generowania wideo | Typy dostawców/żądań/wyników generowania wideo |
  | `plugin-sdk/video-generation-core` | Wspólny rdzeń generowania wideo | Typy generowania wideo, helpery failoveru, wyszukiwanie dostawców i parsowanie referencji modeli |
  | `plugin-sdk/interactive-runtime` | Helpery odpowiedzi interaktywnych | Normalizacja/redukcja payloadów odpowiedzi interaktywnych |
  | `plugin-sdk/channel-config-primitives` | Prymitywy konfiguracji kanałów | Wąskie prymitywy schematu konfiguracji kanałów |
  | `plugin-sdk/channel-config-writes` | Helpery zapisu konfiguracji kanałów | Helpery autoryzacji zapisu konfiguracji kanałów |
  | `plugin-sdk/channel-plugin-common` | Wspólne preludium kanału | Wspólne eksporty preludium wtyczek kanałów |
  | `plugin-sdk/channel-status` | Helpery statusu kanałów | Wspólne helpery snapshotów/podsumowań statusu kanałów |
  | `plugin-sdk/allowlist-config-edit` | Helpery konfiguracji allowlisty | Helpery edycji/odczytu konfiguracji allowlisty |
  | `plugin-sdk/group-access` | Helpery dostępu grupowego | Wspólne helpery decyzji dostępu grupowego |
  | `plugin-sdk/direct-dm` | Helpery bezpośrednich DM | Wspólne helpery uwierzytelniania/ochrony bezpośrednich DM |
  | `plugin-sdk/extension-shared` | Wspólne helpery rozszerzeń | Prymitywy pomocnicze pasywnych kanałów/statusu |
  | `plugin-sdk/webhook-targets` | Helpery celów webhooków | Rejestr celów webhooków i helpery instalacji tras |
  | `plugin-sdk/webhook-path` | Helpery ścieżek webhooków | Helpery normalizacji ścieżek webhooków |
  | `plugin-sdk/web-media` | Wspólne helpery mediów webowych | Helpery ładowania mediów zdalnych/lokalnych |
  | `plugin-sdk/zod` | Reeksport Zod | Reeksportowane `zod` dla odbiorców Plugin SDK |
  | `plugin-sdk/memory-core` | Wbudowane helpery memory-core | Powierzchnia helperów managera/pamięci/pliku/CLI memory-core |
  | `plugin-sdk/memory-core-engine-runtime` | Fasada środowiska uruchomieniowego silnika pamięci | Fasada runtime indeksowania/wyszukiwania pamięci |
  | `plugin-sdk/memory-core-host-engine-foundation` | Podstawowy silnik hosta pamięci | Eksporty podstawowego silnika hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Silnik embeddingów hosta pamięci | Eksporty silnika embeddingów hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-qmd` | Silnik QMD hosta pamięci | Eksporty silnika QMD hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-storage` | Silnik storage hosta pamięci | Eksporty silnika storage hosta pamięci |
  | `plugin-sdk/memory-core-host-multimodal` | Helpery multimodalne hosta pamięci | Helpery multimodalne hosta pamięci |
  | `plugin-sdk/memory-core-host-query` | Helpery zapytań hosta pamięci | Helpery zapytań hosta pamięci |
  | `plugin-sdk/memory-core-host-secret` | Helpery sekretów hosta pamięci | Helpery sekretów hosta pamięci |
  | `plugin-sdk/memory-core-host-status` | Helpery statusu hosta pamięci | Helpery statusu hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-cli` | Środowisko uruchomieniowe CLI hosta pamięci | Helpery środowiska uruchomieniowego CLI hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-core` | Główne środowisko uruchomieniowe hosta pamięci | Główne helpery środowiska uruchomieniowego hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-files` | Helpery plików/runtime hosta pamięci | Helpery plików/runtime hosta pamięci |
  | `plugin-sdk/memory-lancedb` | Wbudowane helpery memory-lancedb | Powierzchnia helperów memory-lancedb |
  | `plugin-sdk/testing` | Narzędzia testowe | Helpery testowe i mocki |
</Accordion>

Ta tabela celowo obejmuje typowy podzbiór migracyjny, a nie pełną
powierzchnię SDK. Pełna lista ponad 200 punktów wejścia znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`.

Ta lista nadal zawiera niektóre powierzchnie helperów wbudowanych wtyczek, takie jak
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` i `plugin-sdk/matrix*`. Nadal są one eksportowane
na potrzeby utrzymania wbudowanych wtyczek i zgodności, ale celowo
pominięto je w tabeli typowej migracji i nie są zalecanym celem dla
nowego kodu wtyczek.

Ta sama zasada dotyczy innych rodzin wbudowanych helperów, takich jak:

- helpery obsługi przeglądarki: `plugin-sdk/browser-config-support`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- powierzchnie wbudowanych helperów/wtyczek, takie jak `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership` i `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` obecnie udostępnia wąską powierzchnię
helperów tokenów `DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken` i `resolveCopilotApiToken`.

Używaj możliwie najwęższego importu pasującego do zadania. Jeśli nie możesz znaleźć eksportu,
sprawdź źródła w `src/plugin-sdk/` lub zapytaj na Discord.

## Oś czasu usunięcia

| Kiedy                  | Co się dzieje                                                          |
| ---------------------- | ---------------------------------------------------------------------- |
| **Teraz**              | Przestarzałe powierzchnie emitują ostrzeżenia w runtime               |
| **Następne duże wydanie** | Przestarzałe powierzchnie zostaną usunięte; wtyczki nadal ich używające przestaną działać |

Wszystkie główne wtyczki zostały już zmigrowane. Zewnętrzne wtyczki powinny przeprowadzić migrację
przed następnym dużym wydaniem.

## Tymczasowe wyciszenie ostrzeżeń

Ustaw te zmienne środowiskowe podczas pracy nad migracją:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

To tymczasowa furtka awaryjna, a nie trwałe rozwiązanie.

## Powiązane

- [Pierwsze kroki](/plugins/building-plugins) — zbuduj swoją pierwszą wtyczkę
- [Przegląd SDK](/plugins/sdk-overview) — pełna referencja importów subścieżek
- [Wtyczki kanałów](/plugins/sdk-channel-plugins) — tworzenie wtyczek kanałów
- [Wtyczki dostawców](/plugins/sdk-provider-plugins) — tworzenie wtyczek dostawców
- [Wnętrze wtyczek](/plugins/architecture) — szczegółowe omówienie architektury
- [Manifest wtyczki](/plugins/manifest) — referencja schematu manifestu
