---
read_when:
    - Widzisz ostrzeżenie OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Widzisz ostrzeżenie OPENCLAW_EXTENSION_API_DEPRECATED
    - Użyto api.registerEmbeddedExtensionFactory przed wersją OpenClaw 2026.4.25.
    - Aktualizujesz Plugin do nowoczesnej architektury Pluginów
    - Utrzymujesz zewnętrzny Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Migruj ze starszej warstwy zgodności wstecznej do nowoczesnego SDK Plugin
title: Migracja Plugin SDK
x-i18n:
    generated_at: "2026-04-30T10:09:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00a1f95a33c50d5c69d7b4768858289365bf29ed069abb3f29218e03c597b4c6
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw przeszedł z szerokiej warstwy zgodności wstecznej na nowoczesną architekturę pluginów z zawężonymi, udokumentowanymi importami. Jeśli Twój plugin został zbudowany przed nową architekturą, ten przewodnik pomoże Ci przeprowadzić migrację.

## Co się zmienia

Stary system pluginów udostępniał dwie bardzo szerokie powierzchnie, które pozwalały pluginom importować wszystko, czego potrzebowały, z jednego punktu wejścia:

- **`openclaw/plugin-sdk/compat`** — pojedynczy import, który reeksportował dziesiątki helperów. Został wprowadzony, aby utrzymać działanie starszych pluginów opartych na hookach podczas budowania nowej architektury pluginów.
- **`openclaw/plugin-sdk/infra-runtime`** — szeroki barrel helperów runtime, który łączył zdarzenia systemowe, stan heartbeat, kolejki dostarczania, helpery fetch/proxy, helpery plików, typy zatwierdzania i niepowiązane narzędzia.
- **`openclaw/plugin-sdk/config-runtime`** — szeroki barrel zgodności konfiguracji, który nadal przenosi przestarzałe bezpośrednie helpery load/write w trakcie okna migracji.
- **`openclaw/extension-api`** — most, który dawał pluginom bezpośredni dostęp do helperów po stronie hosta, takich jak osadzony runner agenta.
- **`api.registerEmbeddedExtensionFactory(...)`** — usunięty hook rozszerzenia tylko dla Pi, który mógł obserwować zdarzenia osadzonego runnera, takie jak `tool_result`.

Szerokie powierzchnie importu są teraz **przestarzałe**. Nadal działają w runtime, ale nowe pluginy nie mogą ich używać, a istniejące pluginy powinny przeprowadzić migrację, zanim następne wydanie główne je usunie. API rejestracji fabryki osadzonych rozszerzeń tylko dla Pi zostało usunięte; zamiast tego użyj middleware wyników narzędzi.

OpenClaw nie usuwa ani nie reinterpretuje udokumentowanego zachowania pluginów w tej samej zmianie, która wprowadza zamiennik. Zmiany łamiące kontrakt muszą najpierw przejść przez adapter zgodności, diagnostykę, dokumentację i okno wycofywania. Dotyczy to importów SDK, pól manifestu, API konfiguracji, hooków i zachowania rejestracji runtime.

<Warning>
  Warstwa zgodności wstecznej zostanie usunięta w przyszłym wydaniu głównym.
  Pluginy, które nadal importują z tych powierzchni, przestaną wtedy działać.
  Rejestracje fabryk osadzonych rozszerzeń tylko dla Pi już się nie ładują.
</Warning>

## Dlaczego to się zmieniło

Stare podejście powodowało problemy:

- **Wolne uruchamianie** — zaimportowanie jednego helpera ładowało dziesiątki niepowiązanych modułów
- **Zależności cykliczne** — szerokie reeksporty ułatwiały tworzenie cykli importu
- **Niejasna powierzchnia API** — nie dało się odróżnić eksportów stabilnych od wewnętrznych

Nowoczesny plugin SDK to naprawia: każda ścieżka importu (`openclaw/plugin-sdk/\<subpath\>`) jest małym, samodzielnym modułem z jasnym celem i udokumentowanym kontraktem.

Starsze seam'y wygody dla dostawców wbudowanych kanałów również zostały usunięte. Helpery seam oznaczone marką kanału były prywatnymi skrótami monorepo, a nie stabilnymi kontraktami pluginów. Zamiast nich używaj wąskich, generycznych podścieżek SDK. W obszarze roboczym wbudowanych pluginów trzymaj helpery należące do dostawcy we własnym `api.ts` lub `runtime-api.ts` tego pluginu.

Aktualne przykłady wbudowanych dostawców:

- Anthropic przechowuje helpery strumieni specyficzne dla Claude we własnym seam `api.ts` / `contract-api.ts`
- OpenAI przechowuje buildery dostawcy, helpery modeli domyślnych i buildery dostawcy realtime we własnym `api.ts`
- OpenRouter przechowuje builder dostawcy oraz helpery onboardingu/konfiguracji we własnym `api.ts`

## Polityka zgodności

W przypadku zewnętrznych pluginów prace nad zgodnością przebiegają w tej kolejności:

1. dodaj nowy kontrakt
2. utrzymaj stare zachowanie podłączone przez adapter zgodności
3. emituj diagnostykę lub ostrzeżenie, które nazywa starą ścieżkę i zamiennik
4. pokryj obie ścieżki testami
5. udokumentuj wycofanie i ścieżkę migracji
6. usuń dopiero po ogłoszonym oknie migracji, zwykle w wydaniu głównym

Maintainerzy mogą audytować bieżącą kolejkę migracji za pomocą `pnpm plugins:boundary-report`. Użyj `pnpm plugins:boundary-report:summary` dla kompaktowych liczników, `--owner <id>` dla jednego pluginu lub właściciela zgodności oraz `pnpm plugins:boundary-report:ci`, gdy gate CI powinien kończyć się niepowodzeniem dla przeterminowanych rekordów zgodności, zarezerwowanych importów SDK między właścicielami lub nieużywanych zarezerwowanych podścieżek SDK. Raport grupuje przestarzałe rekordy zgodności według daty usunięcia, zlicza lokalne odwołania w kodzie/dokumentacji, ujawnia zarezerwowane importy SDK między właścicielami i podsumowuje prywatny most SDK hosta pamięci, aby porządkowanie zgodności pozostawało jawne zamiast polegać na doraźnych wyszukiwaniach. Zarezerwowane podścieżki SDK muszą mieć śledzone użycie właściciela; nieużywane zarezerwowane eksporty helperów należy usunąć z publicznego SDK.

Jeśli pole manifestu jest nadal akceptowane, autorzy pluginów mogą nadal go używać, dopóki dokumentacja i diagnostyka nie powiedzą inaczej. Nowy kod powinien preferować udokumentowany zamiennik, ale istniejące pluginy nie powinny psuć się podczas zwykłych wydań pomniejszych.

## Jak przeprowadzić migrację

<Steps>
  <Step title="Przenieś helpery load/write konfiguracji runtime">
    Wbudowane pluginy powinny przestać wywoływać bezpośrednio
    `api.runtime.config.loadConfig()` i
    `api.runtime.config.writeConfigFile(...)`. Preferuj konfigurację, która została
    już przekazana do aktywnej ścieżki wywołania. Długowieczne handlery, które potrzebują
    bieżącego snapshotu procesu, mogą używać `api.runtime.config.current()`. Długowieczne
    narzędzia agentów powinny używać `ctx.getRuntimeConfig()` z kontekstu narzędzia wewnątrz
    `execute`, aby narzędzie utworzone przed zapisem konfiguracji nadal widziało odświeżoną
    konfigurację runtime.

    Zapisy konfiguracji muszą przechodzić przez helpery transakcyjne i wybrać
    politykę po zapisie:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Użyj `afterWrite: { mode: "restart", reason: "..." }`, gdy wywołujący wie,
    że zmiana wymaga czystego restartu Gateway, oraz
    `afterWrite: { mode: "none", reason: "..." }` tylko wtedy, gdy wywołujący jest właścicielem
    dalszych działań i celowo chce pominąć planner przeładowania.
    Wyniki mutacji zawierają typowane podsumowanie `followUp` dla testów i logowania;
    Gateway pozostaje odpowiedzialny za zastosowanie lub zaplanowanie restartu.
    `loadConfig` i `writeConfigFile` pozostają przestarzałymi helperami zgodności
    dla zewnętrznych pluginów w trakcie okna migracji i ostrzegają raz z kodem zgodności
    `runtime-config-load-write`. Wbudowane pluginy i kod runtime repozytorium są chronione
    przez guardraile skanera w
    `pnpm check:deprecated-internal-config-api` i
    `pnpm check:no-runtime-action-load-config`: nowe użycie w produkcyjnym pluginie
    kończy się bezpośrednim niepowodzeniem, bezpośrednie zapisy konfiguracji kończą się niepowodzeniem,
    metody serwera Gateway muszą używać snapshotu runtime żądania, helpery wysyłania/akcji/klienta
    kanału runtime muszą otrzymywać konfigurację ze swojej granicy, a długowieczne moduły runtime mają
    zero dozwolonych ambientowych wywołań `loadConfig()`.

    Nowy kod pluginu powinien także unikać importowania szerokiego barrela zgodności
    `openclaw/plugin-sdk/config-runtime`. Użyj wąskiej podścieżki SDK pasującej do zadania:

    | Potrzeba | Import |
    | --- | --- |
    | Typy konfiguracji, takie jak `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Asercje już załadowanej konfiguracji i wyszukiwanie konfiguracji wejścia pluginu | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Odczyty bieżącego snapshotu runtime | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Zapisy konfiguracji | `openclaw/plugin-sdk/config-mutation` |
    | Helpery magazynu sesji | `openclaw/plugin-sdk/session-store-runtime` |
    | Konfiguracja tabel Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helpery runtime polityki grup | `openclaw/plugin-sdk/runtime-group-policy` |
    | Rozwiązywanie wejścia sekretu | `openclaw/plugin-sdk/secret-input-runtime` |
    | Nadpisania modelu/sesji | `openclaw/plugin-sdk/model-session-runtime` |

    Wbudowane pluginy i ich testy są chronione skanerem przed szerokim
    barrelem, aby importy i mocki pozostawały lokalne względem zachowania, którego potrzebują. Szeroki
    barrel nadal istnieje dla zgodności zewnętrznej, ale nowy kod nie powinien
    od niego zależeć.

  </Step>

  <Step title="Przenieś rozszerzenia wyników narzędzi Pi do middleware">
    Wbudowane pluginy muszą zastąpić handlery wyników narzędzi tylko dla Pi
    `api.registerEmbeddedExtensionFactory(...)`
    neutralnym względem runtime middleware.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Zaktualizuj manifest pluginu w tym samym czasie:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Zewnętrzne pluginy nie mogą rejestrować middleware wyników narzędzi, ponieważ może ono
    przepisywać wyjście narzędzia o wysokim zaufaniu, zanim zobaczy je model.

  </Step>

  <Step title="Przenieś natywne handlery zatwierdzeń do faktów capability">
    Pluginy kanałów obsługujące zatwierdzenia ujawniają teraz natywne zachowanie zatwierdzania przez
    `approvalCapability.nativeRuntime` oraz współdzielony rejestr kontekstu runtime.

    Kluczowe zmiany:

    - Zastąp `approvalCapability.handler.loadRuntime(...)` przez
      `approvalCapability.nativeRuntime`
    - Przenieś auth/dostarczanie specyficzne dla zatwierdzeń ze starszego okablowania `plugin.auth` /
      `plugin.approvals` na `approvalCapability`
    - `ChannelPlugin.approvals` zostało usunięte z publicznego kontraktu pluginu kanału;
      przenieś pola delivery/native/render na `approvalCapability`
    - `plugin.auth` pozostaje tylko dla przepływów logowania/wylogowania kanału; hooki auth
      dla zatwierdzeń nie są już tam odczytywane przez core
    - Rejestruj obiekty runtime należące do kanału, takie jak klienci, tokeny lub aplikacje Bolt,
      przez `openclaw/plugin-sdk/channel-runtime-context`
    - Nie wysyłaj powiadomień o przekierowaniu należących do pluginu z natywnych handlerów zatwierdzeń;
      core jest teraz właścicielem powiadomień routed-elsewhere z rzeczywistych wyników dostarczenia
    - Podczas przekazywania `channelRuntime` do `createChannelManager(...)` podaj
      rzeczywistą powierzchnię `createPluginRuntime().channel`. Częściowe stuby są odrzucane.

    Zobacz `/plugins/sdk-channel-plugins`, aby poznać bieżący układ approval capability.

  </Step>

  <Step title="Zaudytuj zachowanie fallbacku wrappera Windows">
    Jeśli Twój plugin używa `openclaw/plugin-sdk/windows-spawn`, nierozwiązane wrappery Windows
    `.cmd`/`.bat` teraz kończą się bezpiecznym niepowodzeniem, chyba że jawnie przekażesz
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

    Jeśli wywołujący nie polega celowo na shell fallback, nie ustawiaj
    `allowShellFallback` i zamiast tego obsłuż rzucony błąd.

  </Step>

  <Step title="Znajdź przestarzałe importy">
    Przeszukaj swój plugin pod kątem importów z którejkolwiek przestarzałej powierzchni:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Zastąp je zawężonymi importami">
    Każdy eksport ze starej powierzchni mapuje się na określoną nowoczesną ścieżkę importu:

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

    W przypadku helperów po stronie hosta użyj wstrzykniętego runtime pluginu zamiast importować
    bezpośrednio:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Ten sam wzorzec dotyczy innych starszych helperów mostka:

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

  <Step title="Zastąp szerokie importy infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` nadal istnieje dla zgodności
    zewnętrznej, ale nowy kod powinien importować zawężoną powierzchnię helperów,
    której faktycznie potrzebuje:

    | Potrzeba | Import |
    | --- | --- |
    | Helpery kolejki zdarzeń systemowych | `openclaw/plugin-sdk/system-event-runtime` |
    | Helpery zdarzeń Heartbeat i widoczności | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Opróżnianie kolejki oczekujących dostaw | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetria aktywności kanału | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Pamięci podręczne deduplikacji w pamięci | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helpery bezpiecznych ścieżek do lokalnych plików/multimediów | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch świadomy dyspozytora | `openclaw/plugin-sdk/runtime-fetch` |
    | Helpery proxy i chronionego fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Typy polityki dyspozytora SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typy żądań/zatwierdzeń akceptacji | `openclaw/plugin-sdk/approval-runtime` |
    | Helpery ładunku odpowiedzi akceptacji i poleceń | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helpery formatowania błędów | `openclaw/plugin-sdk/error-runtime` |
    | Oczekiwanie na gotowość transportu | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helpery bezpiecznych tokenów | `openclaw/plugin-sdk/secure-random-runtime` |
    | Ograniczona współbieżność zadań asynchronicznych | `openclaw/plugin-sdk/concurrency-runtime` |
    | Koercja liczbowa | `openclaw/plugin-sdk/number-runtime` |
    | Lokalna dla procesu blokada asynchroniczna | `openclaw/plugin-sdk/async-lock-runtime` |
    | Blokady plików | `openclaw/plugin-sdk/file-lock` |

    Dołączone pluginy są chronione skanerem przed `infra-runtime`, więc kod repozytorium
    nie może cofnąć się do szerokiego barrela.

  </Step>

  <Step title="Zmigruj helpery tras kanałów">
    Nowy kod tras kanałów powinien używać `openclaw/plugin-sdk/channel-route`.
    Starsze nazwy klucza trasy i porównywalnego celu pozostają aliasami zgodności
    w okresie migracji, ale nowe pluginy powinny używać nazw tras, które
    bezpośrednio opisują zachowanie:

    | Stary helper | Nowoczesny helper |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Nowoczesne helpery tras spójnie normalizują `{ channel, to, accountId, threadId }`
    w natywnych akceptacjach, tłumieniu odpowiedzi, deduplikacji przychodzącej,
    dostawie Cron i trasowaniu sesji. Jeśli Twój plugin posiada własną gramatykę celu,
    użyj `resolveChannelRouteTargetWithParser(...)`, aby dostosować ten parser do
    tego samego kontraktu celu trasy.

  </Step>

  <Step title="Zbuduj i przetestuj">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referencja ścieżek importu

  <Accordion title="Common import path table">
  | Ścieżka importu | Przeznaczenie | Kluczowe eksporty |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanoniczny pomocnik punktu wejścia Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Starszy zbiorczy ponowny eksport definicji/konstruktorów punktów wejścia kanału | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Eksport głównego schematu konfiguracji | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Pomocnik punktu wejścia pojedynczego dostawcy | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Ukierunkowane definicje i konstruktory punktów wejścia kanału | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Współdzielone pomocniki kreatora konfiguracji | Monity listy dozwolonych, konstruktory stanu konfiguracji |
  | `plugin-sdk/setup-runtime` | Pomocniki środowiska uruchomieniowego używane podczas konfiguracji | Bezpieczne przy imporcie adaptery poprawek konfiguracji, pomocniki notatek wyszukiwania, `promptResolvedAllowFrom`, `splitSetupEntries`, delegowane proxy konfiguracji |
  | `plugin-sdk/setup-adapter-runtime` | Pomocniki adaptera konfiguracji | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Pomocniki narzędzi konfiguracji | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Pomocniki wielu kont | Pomocniki listy kont/konfiguracji/bramki akcji |
  | `plugin-sdk/account-id` | Pomocniki identyfikatora konta | `DEFAULT_ACCOUNT_ID`, normalizacja identyfikatora konta |
  | `plugin-sdk/account-resolution` | Pomocniki wyszukiwania kont | Pomocniki wyszukiwania kont i domyślnego przejścia awaryjnego |
  | `plugin-sdk/account-helpers` | Wąskie pomocniki kont | Pomocniki listy kont/akcji konta |
  | `plugin-sdk/channel-setup` | Adaptery kreatora konfiguracji | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, oraz `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Prymitywy parowania DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Prefiks odpowiedzi, sygnalizacja pisania i okablowanie dostarczania źródeł | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabryki adapterów konfiguracji i pomocniki dostępu DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Konstruktory schematów konfiguracji | Tylko współdzielone prymitywy schematu konfiguracji kanału i ogólny konstruktor |
  | `plugin-sdk/bundled-channel-config-schema` | Schematy konfiguracji wbudowanych Pluginów | Tylko wbudowane Pluginy utrzymywane przez OpenClaw; nowe Pluginy muszą definiować schematy lokalne dla Pluginu |
  | `plugin-sdk/channel-config-schema-legacy` | Przestarzałe schematy konfiguracji wbudowanych Pluginów | Tylko alias zgodności; dla utrzymywanych wbudowanych Pluginów użyj `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Pomocniki konfiguracji poleceń Telegram | Normalizacja nazw poleceń, przycinanie opisów, walidacja duplikatów/konfliktów |
  | `plugin-sdk/channel-policy` | Rozstrzyganie zasad grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Pomocniki stanu konta i cyklu życia strumienia wersji roboczej | `createAccountStatusSink`, pomocniki finalizacji podglądu wersji roboczej |
  | `plugin-sdk/inbound-envelope` | Pomocniki kopert przychodzących | Współdzielone pomocniki trasy i konstruktora koperty |
  | `plugin-sdk/inbound-reply-dispatch` | Pomocniki odpowiedzi przychodzących | Współdzielone pomocniki zapisu i wysyłki |
  | `plugin-sdk/messaging-targets` | Parsowanie celu wiadomości | Pomocniki parsowania/dopasowywania celów |
  | `plugin-sdk/outbound-media` | Pomocniki mediów wychodzących | Współdzielone wczytywanie mediów wychodzących |
  | `plugin-sdk/outbound-send-deps` | Pomocniki zależności wysyłania wychodzącego | Lekkie wyszukiwanie `resolveOutboundSendDep` bez importowania pełnego środowiska uruchomieniowego wychodzącego |
  | `plugin-sdk/outbound-runtime` | Pomocniki środowiska uruchomieniowego wychodzącego | Pomocniki dostarczania wychodzącego, delegowania tożsamości/wysyłki, sesji, formatowania i planowania ładunku |
  | `plugin-sdk/thread-bindings-runtime` | Pomocniki wiązania wątków | Pomocniki cyklu życia wiązania wątków i adapterów |
  | `plugin-sdk/agent-media-payload` | Starsze pomocniki ładunku mediów | Konstruktor ładunku mediów agenta dla starszych układów pól |
  | `plugin-sdk/channel-runtime` | Przestarzała nakładka zgodności | Tylko narzędzia starszego środowiska uruchomieniowego kanału |
  | `plugin-sdk/channel-send-result` | Typy wyniku wysyłania | Typy wyniku odpowiedzi |
  | `plugin-sdk/runtime-store` | Trwały magazyn Pluginu | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Szerokie pomocniki środowiska uruchomieniowego | Pomocniki środowiska uruchomieniowego/rejestrowania/kopii zapasowej/instalacji Pluginu |
  | `plugin-sdk/runtime-env` | Wąskie pomocniki środowiska uruchomieniowego | Pomocniki loggera/środowiska uruchomieniowego, limitu czasu, ponowień i wycofywania |
  | `plugin-sdk/plugin-runtime` | Współdzielone pomocniki środowiska uruchomieniowego Pluginu | Pomocniki poleceń/haków/http/interaktywne Pluginu |
  | `plugin-sdk/hook-runtime` | Pomocniki potoku haków | Pomocniki potoku haków Webhook/wewnętrznych |
  | `plugin-sdk/lazy-runtime` | Pomocniki leniwego środowiska uruchomieniowego | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Pomocniki procesów | Współdzielone pomocniki wykonywania |
  | `plugin-sdk/cli-runtime` | Pomocniki środowiska uruchomieniowego CLI | Formatowanie poleceń, oczekiwania, pomocniki wersji |
  | `plugin-sdk/gateway-runtime` | Pomocniki Gateway | Klient Gateway, pomocnik uruchamiania gotowości pętli zdarzeń i pomocniki poprawek stanu kanału |
  | `plugin-sdk/config-runtime` | Przestarzała nakładka zgodności konfiguracji | Preferuj `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` i `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Pomocniki poleceń Telegram | Stabilne awaryjnie pomocniki walidacji poleceń Telegram, gdy powierzchnia kontraktu wbudowanego Telegram jest niedostępna |
  | `plugin-sdk/approval-runtime` | Pomocniki monitów zatwierdzenia | Ładunek zatwierdzenia exec/Pluginu, pomocniki możliwości/profilu zatwierdzeń, natywne kierowanie zatwierdzeń/pomocniki środowiska uruchomieniowego oraz formatowanie ścieżki wyświetlania strukturalnego zatwierdzenia |
  | `plugin-sdk/approval-auth-runtime` | Pomocniki autoryzacji zatwierdzeń | Rozstrzyganie zatwierdzającego, autoryzacja akcji w tym samym czacie |
  | `plugin-sdk/approval-client-runtime` | Pomocniki klienta zatwierdzeń | Pomocniki natywnego profilu/filtra zatwierdzeń exec |
  | `plugin-sdk/approval-delivery-runtime` | Pomocniki dostarczania zatwierdzeń | Adaptery natywnych możliwości/dostarczania zatwierdzeń |
  | `plugin-sdk/approval-gateway-runtime` | Pomocniki Gateway zatwierdzeń | Współdzielony pomocnik rozstrzygania Gateway zatwierdzeń |
  | `plugin-sdk/approval-handler-adapter-runtime` | Pomocniki adaptera zatwierdzeń | Lekkie pomocniki ładowania natywnego adaptera zatwierdzeń dla gorących punktów wejścia kanału |
  | `plugin-sdk/approval-handler-runtime` | Pomocniki obsługi zatwierdzeń | Szersze pomocniki środowiska uruchomieniowego obsługi zatwierdzeń; preferuj węższe granice adaptera/Gateway, gdy wystarczą |
  | `plugin-sdk/approval-native-runtime` | Pomocniki celów zatwierdzeń | Pomocniki wiązania natywnego celu/konta zatwierdzeń |
  | `plugin-sdk/approval-reply-runtime` | Pomocniki odpowiedzi zatwierdzeń | Pomocniki ładunku odpowiedzi zatwierdzenia exec/Pluginu |
  | `plugin-sdk/channel-runtime-context` | Pomocniki kontekstu środowiska uruchomieniowego kanału | Ogólne pomocniki rejestracji/pobierania/obserwacji kontekstu środowiska uruchomieniowego kanału |
  | `plugin-sdk/security-runtime` | Pomocniki bezpieczeństwa | Współdzielone pomocniki zaufania, bramkowania DM, treści zewnętrznych i zbierania sekretów |
  | `plugin-sdk/ssrf-policy` | Pomocniki zasad SSRF | Pomocniki listy dozwolonych hostów i zasad sieci prywatnej |
  | `plugin-sdk/ssrf-runtime` | Pomocniki środowiska uruchomieniowego SSRF | Przypięty dyspozytor, strzeżony fetch, pomocniki zasad SSRF |
  | `plugin-sdk/system-event-runtime` | Pomocniki zdarzeń systemowych | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Pomocniki Heartbeat | Pomocniki zdarzeń i widoczności Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Pomocniki kolejki dostarczania | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Pomocniki aktywności kanału | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Pomocniki deduplikacji | Pamięci podręczne deduplikacji w pamięci |
  | `plugin-sdk/file-access-runtime` | Pomocniki dostępu do plików | Pomocniki bezpiecznych ścieżek lokalnych plików/mediów |
  | `plugin-sdk/transport-ready-runtime` | Pomocniki gotowości transportu | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Pomocniki ograniczonej pamięci podręcznej | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Pomocniki bramkowania diagnostyki | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Pomocniki formatowania błędów | `formatUncaughtError`, `isApprovalNotFoundError`, pomocniki grafu błędów |
  | `plugin-sdk/fetch-runtime` | Pomocniki opakowanego fetch/proxy | `resolveFetch`, pomocniki proxy, pomocniki opcji EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Pomocniki normalizacji hostów | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Pomocniki ponowień | `RetryConfig`, `retryAsync`, uruchamiacze zasad |
  | `plugin-sdk/allow-from` | Formatowanie listy dozwolonych | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapowanie danych wejściowych listy dozwolonych | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Pomocniki bramkowania poleceń i powierzchni poleceń | `resolveControlCommandGate`, pomocniki autoryzacji nadawcy, pomocniki rejestru poleceń, w tym formatowanie menu argumentów dynamicznych |
  | `plugin-sdk/command-status` | Renderery stanu/pomocy poleceń | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsowanie danych wejściowych sekretu | Pomocniki danych wejściowych sekretów |
  | `plugin-sdk/webhook-ingress` | Pomocniki żądań Webhook | Narzędzia celów Webhook |
  | `plugin-sdk/webhook-request-guards` | Pomocniki strażnika treści Webhook | Pomocniki odczytu/limitu treści żądania |
  | `plugin-sdk/reply-runtime` | Współdzielone środowisko uruchomieniowe odpowiedzi | Wysyłka przychodząca, Heartbeat, planer odpowiedzi, dzielenie na fragmenty |
  | `plugin-sdk/reply-dispatch-runtime` | Wąskie pomocniki wysyłki odpowiedzi | Finalizacja, wysyłka dostawcy i pomocniki etykiet rozmów |
  | `plugin-sdk/reply-history` | Pomocniki historii odpowiedzi | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planowanie odniesień odpowiedzi | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Pomocniki fragmentów odpowiedzi | Pomocniki dzielenia tekstu/Markdown na fragmenty |
  | `plugin-sdk/session-store-runtime` | Pomocniki magazynu sesji | Ścieżka magazynu i pomocniki czasu aktualizacji |
  | `plugin-sdk/state-paths` | Pomocniki ścieżek stanu | Pomocniki katalogów stanu i OAuth |
  | `plugin-sdk/routing` | Pomocniki routingu/klucza sesji | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, pomocniki normalizacji klucza sesji |
  | `plugin-sdk/status-helpers` | Pomocniki stanu kanału | Konstruktory podsumowań stanu kanału/konta, domyślne wartości stanu środowiska uruchomieniowego, pomocniki metadanych problemów |
  | `plugin-sdk/target-resolver-runtime` | Pomocniki rozstrzygania celów | Współdzielone pomocniki rozstrzygania celów |
  | `plugin-sdk/string-normalization-runtime` | Pomocniki normalizacji ciągów znaków | Pomocniki normalizacji slug/ciągów znaków |
  | `plugin-sdk/request-url` | Pomocniki URL żądania | Wyodrębnianie tekstowych URL-i z wejść podobnych do żądań |
  | `plugin-sdk/run-command` | Pomocniki poleceń czasowych | Uruchamiacz poleceń czasowych ze znormalizowanymi stdout/stderr |
  | `plugin-sdk/param-readers` | Czytniki parametrów | Wspólne czytniki parametrów narzędzi/CLI |
  | `plugin-sdk/tool-payload` | Wyodrębnianie ładunku narzędzia | Wyodrębnia znormalizowane ładunki z obiektów wyników narzędzi |
  | `plugin-sdk/tool-send` | Wyodrębnianie wysyłki narzędzia | Wyodrębnia kanoniczne pola celu wysyłki z argumentów narzędzia |
  | `plugin-sdk/temp-path` | Pomocniki ścieżek tymczasowych | Współdzielone pomocniki ścieżek tymczasowego pobierania |
  | `plugin-sdk/logging-core` | Pomocniki logowania | Pomocniki loggera podsystemu i redagowania |
  | `plugin-sdk/markdown-table-runtime` | Pomocniki tabel Markdown | Pomocniki trybu tabel Markdown |
  | `plugin-sdk/reply-payload` | Typy odpowiedzi wiadomości | Typy ładunku odpowiedzi |
  | `plugin-sdk/provider-setup` | Wyselekcjonowane pomocniki konfiguracji lokalnych/samoobsługowych dostawców | Pomocniki wykrywania/konfiguracji dostawców samoobsługowych |
  | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane pomocniki konfiguracji samoobsługowych dostawców zgodnych z OpenAI | Te same pomocniki wykrywania/konfiguracji dostawców samoobsługowych |
  | `plugin-sdk/provider-auth-runtime` | Pomocniki uwierzytelniania dostawcy w czasie wykonywania | Pomocniki rozwiązywania kluczy API w czasie wykonywania |
  | `plugin-sdk/provider-auth-api-key` | Pomocniki konfiguracji klucza API dostawcy | Pomocniki wdrażania klucza API/zapisu profilu |
  | `plugin-sdk/provider-auth-result` | Pomocniki wyniku uwierzytelniania dostawcy | Standardowy konstruktor wyniku uwierzytelniania OAuth |
  | `plugin-sdk/provider-auth-login` | Pomocniki interaktywnego logowania dostawcy | Współdzielone pomocniki interaktywnego logowania |
  | `plugin-sdk/provider-selection-runtime` | Pomocniki wyboru dostawcy | Wybór dostawcy skonfigurowanego lub automatycznego oraz scalanie surowej konfiguracji dostawcy |
  | `plugin-sdk/provider-env-vars` | Pomocniki zmiennych środowiskowych dostawcy | Pomocniki wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
  | `plugin-sdk/provider-model-shared` | Współdzielone pomocniki modeli/powtórek dostawcy | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory zasad powtórek, pomocniki punktów końcowych dostawcy oraz pomocniki normalizacji identyfikatorów modeli |
  | `plugin-sdk/provider-catalog-shared` | Współdzielone pomocniki katalogu dostawcy | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Poprawki wdrażania dostawcy | Pomocniki konfiguracji wdrażania |
  | `plugin-sdk/provider-http` | Pomocniki HTTP dostawcy | Ogólne pomocniki możliwości HTTP/punktów końcowych dostawcy, w tym pomocniki formularzy multipart do transkrypcji audio |
  | `plugin-sdk/provider-web-fetch` | Pomocniki pobierania z sieci dostawcy | Pomocniki rejestracji/pamięci podręcznej dostawcy pobierania z sieci |
  | `plugin-sdk/provider-web-search-config-contract` | Pomocniki konfiguracji wyszukiwania w sieci dostawcy | Wąskie pomocniki konfiguracji/poświadczeń wyszukiwania w sieci dla dostawców, którzy nie potrzebują okablowania włączania Plugin |
  | `plugin-sdk/provider-web-search-contract` | Pomocniki kontraktu wyszukiwania w sieci dostawcy | Wąskie pomocniki kontraktu konfiguracji/poświadczeń wyszukiwania w sieci, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowe settery/gettery poświadczeń |
  | `plugin-sdk/provider-web-search` | Pomocniki wyszukiwania w sieci dostawcy | Pomocniki rejestracji/pamięci podręcznej/czasu wykonywania dostawcy wyszukiwania w sieci |
  | `plugin-sdk/provider-tools` | Pomocniki zgodności narzędzi/schematów dostawcy | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematu Gemini + diagnostyka oraz pomocniki zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Pomocniki użycia dostawcy | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` oraz inne pomocniki użycia dostawcy |
  | `plugin-sdk/provider-stream` | Pomocniki wrapperów strumienia dostawcy | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz współdzielone pomocniki wrapperów Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Pomocniki transportu dostawcy | Natywne pomocniki transportu dostawcy, takie jak chronione pobieranie, transformacje komunikatów transportu i zapisywalne strumienie zdarzeń transportu |
  | `plugin-sdk/keyed-async-queue` | Uporządkowana kolejka asynchroniczna | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Współdzielone pomocniki mediów | Pomocniki pobierania/przekształcania/przechowywania mediów, sondowanie wymiarów wideo oparte na ffprobe oraz konstruktory ładunków mediów |
  | `plugin-sdk/media-generation-runtime` | Współdzielone pomocniki generowania mediów | Współdzielone pomocniki przełączania awaryjnego, wybór kandydatów i komunikaty o brakującym modelu dla generowania obrazów/wideo/muzyki |
  | `plugin-sdk/media-understanding` | Pomocniki rozumienia mediów | Typy dostawców rozumienia mediów oraz eksporty pomocników obrazu/audio przeznaczone dla dostawców |
  | `plugin-sdk/text-runtime` | Współdzielone pomocniki tekstu | Usuwanie tekstu widocznego dla asystenta, pomocniki renderowania/dzielenia na fragmenty/tabel Markdown, pomocniki redagowania, pomocniki tagów dyrektyw, narzędzia bezpiecznego tekstu oraz powiązane pomocniki tekstu/logowania |
  | `plugin-sdk/text-chunking` | Pomocniki dzielenia tekstu na fragmenty | Pomocnik dzielenia tekstu wychodzącego na fragmenty |
  | `plugin-sdk/speech` | Pomocniki mowy | Typy dostawców mowy oraz przeznaczone dla dostawców pomocniki dyrektyw, rejestru i walidacji, a także konstruktor TTS zgodny z OpenAI |
  | `plugin-sdk/speech-core` | Współdzielony rdzeń mowy | Typy dostawców mowy, rejestr, dyrektywy, normalizacja |
  | `plugin-sdk/realtime-transcription` | Pomocniki transkrypcji w czasie rzeczywistym | Typy dostawców, pomocniki rejestru i współdzielony pomocnik sesji WebSocket |
  | `plugin-sdk/realtime-voice` | Pomocniki głosu w czasie rzeczywistym | Typy dostawców, pomocniki rejestru/rozwiązywania i pomocniki sesji mostka |
  | `plugin-sdk/image-generation` | Pomocniki generowania obrazów | Typy dostawców generowania obrazów oraz pomocniki zasobów obrazów/adresów URL danych i konstruktor dostawcy obrazów zgodny z OpenAI |
  | `plugin-sdk/image-generation-core` | Współdzielony rdzeń generowania obrazów | Typy generowania obrazów, przełączanie awaryjne, uwierzytelnianie i pomocniki rejestru |
  | `plugin-sdk/music-generation` | Pomocniki generowania muzyki | Typy dostawców/żądań/wyników generowania muzyki |
  | `plugin-sdk/music-generation-core` | Współdzielony rdzeń generowania muzyki | Typy generowania muzyki, pomocniki przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie odwołań do modeli |
  | `plugin-sdk/video-generation` | Pomocniki generowania wideo | Typy dostawców/żądań/wyników generowania wideo |
  | `plugin-sdk/video-generation-core` | Współdzielony rdzeń generowania wideo | Typy generowania wideo, pomocniki przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie odwołań do modeli |
  | `plugin-sdk/interactive-runtime` | Pomocniki interaktywnych odpowiedzi | Normalizacja/redukcja ładunku interaktywnych odpowiedzi |
  | `plugin-sdk/channel-config-primitives` | Prymitywy konfiguracji kanału | Wąskie prymitywy schematu konfiguracji kanału |
  | `plugin-sdk/channel-config-writes` | Pomocniki zapisu konfiguracji kanału | Pomocniki autoryzacji zapisu konfiguracji kanału |
  | `plugin-sdk/channel-plugin-common` | Współdzielone wprowadzenie kanału | Współdzielone eksporty wprowadzenia Plugin kanału |
  | `plugin-sdk/channel-status` | Pomocniki statusu kanału | Współdzielone pomocniki migawki/podsumowania statusu kanału |
  | `plugin-sdk/allowlist-config-edit` | Pomocniki konfiguracji listy dozwolonych | Pomocniki edycji/odczytu konfiguracji listy dozwolonych |
  | `plugin-sdk/group-access` | Pomocniki dostępu grupowego | Współdzielone pomocniki decyzji dostępu grupowego |
  | `plugin-sdk/direct-dm` | Pomocniki bezpośrednich DM | Współdzielone pomocniki uwierzytelniania/strażnika bezpośrednich DM |
  | `plugin-sdk/extension-shared` | Współdzielone pomocniki rozszerzeń | Prymitywy pomocników kanału pasywnego/statusu i otaczającego proxy |
  | `plugin-sdk/webhook-targets` | Pomocniki celów Webhook | Rejestr celów Webhook i pomocniki instalacji tras |
  | `plugin-sdk/webhook-path` | Pomocniki ścieżek Webhook | Pomocniki normalizacji ścieżek Webhook |
  | `plugin-sdk/web-media` | Współdzielone pomocniki mediów internetowych | Pomocniki ładowania mediów zdalnych/lokalnych |
  | `plugin-sdk/zod` | Reeksport Zod | Reeksportowane `zod` dla konsumentów SDK Plugin |
  | `plugin-sdk/memory-core` | Dołączone pomocniki rdzenia pamięci | Powierzchnia pomocników menedżera pamięci/konfiguracji/plików/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Fasada czasu wykonywania silnika pamięci | Fasada czasu wykonywania indeksu/wyszukiwania pamięci |
  | `plugin-sdk/memory-core-host-engine-foundation` | Silnik podstaw hosta pamięci | Eksporty silnika podstaw hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Silnik osadzania hosta pamięci | Kontrakty osadzania pamięci, dostęp do rejestru, dostawca lokalny oraz ogólne pomocniki batch/zdalne; konkretni dostawcy zdalni znajdują się w swoich właścicielskich plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | Silnik QMD hosta pamięci | Eksporty silnika QMD hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-storage` | Silnik przechowywania hosta pamięci | Eksporty silnika przechowywania hosta pamięci |
  | `plugin-sdk/memory-core-host-multimodal` | Pomocniki multimodalne hosta pamięci | Pomocniki multimodalne hosta pamięci |
  | `plugin-sdk/memory-core-host-query` | Pomocniki zapytań hosta pamięci | Pomocniki zapytań hosta pamięci |
  | `plugin-sdk/memory-core-host-secret` | Pomocniki sekretów hosta pamięci | Pomocniki sekretów hosta pamięci |
  | `plugin-sdk/memory-core-host-events` | Pomocniki dziennika zdarzeń hosta pamięci | Pomocniki dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-core-host-status` | Pomocniki statusu hosta pamięci | Pomocniki statusu hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-cli` | Czas wykonywania CLI hosta pamięci | Pomocniki czasu wykonywania CLI hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-core` | Główny czas wykonywania hosta pamięci | Pomocniki głównego czasu wykonywania hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-files` | Pomocniki plików/czasu wykonywania hosta pamięci | Pomocniki plików/czasu wykonywania hosta pamięci |
  | `plugin-sdk/memory-host-core` | Alias głównego czasu wykonywania hosta pamięci | Neutralny względem dostawcy alias pomocników głównego czasu wykonywania hosta pamięci |
  | `plugin-sdk/memory-host-events` | Alias dziennika zdarzeń hosta pamięci | Neutralny względem dostawcy alias pomocników dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-host-files` | Alias plików/czasu wykonywania hosta pamięci | Neutralny względem dostawcy alias pomocników plików/czasu wykonywania hosta pamięci |
  | `plugin-sdk/memory-host-markdown` | Zarządzane pomocniki Markdown | Współdzielone pomocniki zarządzanego Markdown dla plugins powiązanych z pamięcią |
  | `plugin-sdk/memory-host-search` | Fasada wyszukiwania Active Memory | Leniwa fasada czasu wykonywania menedżera wyszukiwania active-memory |
  | `plugin-sdk/memory-host-status` | Alias statusu hosta pamięci | Neutralny względem dostawcy alias pomocników statusu hosta pamięci |
  | `plugin-sdk/testing` | Narzędzia testowe | Starszy szeroki barrel zgodności; preferuj ukierunkowane podścieżki testowe, takie jak `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` i `plugin-sdk/test-fixtures` |
</Accordion>

Ta tabela jest celowo wspólnym podzbiorem migracji, a nie pełną
powierzchnią SDK. Pełna lista ponad 200 punktów wejścia znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`.

Zarezerwowane pomocnicze punkty integracji dołączonych Pluginów zostały wycofane z mapy
eksportów publicznego SDK z wyjątkiem jawnie udokumentowanych fasad zgodności, takich jak
przestarzały shim `plugin-sdk/discord` zachowany dla opublikowanego pakietu
`@openclaw/discord@2026.3.13`. Pomocniki specyficzne dla właściciela znajdują się wewnątrz
pakietu właścicielskiego Pluginu; współdzielone zachowanie hosta powinno przechodzić przez ogólne
kontrakty SDK, takie jak `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`
i `plugin-sdk/plugin-config-runtime`.

Używaj najwęższego importu pasującego do zadania. Jeśli nie możesz znaleźć eksportu,
sprawdź źródło w `src/plugin-sdk/` albo zapytaj opiekunów, który ogólny kontrakt
powinien go obejmować.

## Aktywne wycofania

Węższe wycofania, które mają zastosowanie w całym SDK Pluginu, kontrakcie dostawcy,
powierzchni uruchomieniowej i manifeście. Każde z nich nadal działa dzisiaj, ale zostanie usunięte
w przyszłym wydaniu głównym. Wpis pod każdym elementem mapuje stare API na jego
kanoniczny zamiennik.

<AccordionGroup>
  <Accordion title="Konstruktory pomocy command-auth → command-status">
    **Stare (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nowe (`openclaw/plugin-sdk/command-status`)**: te same sygnatury, te same
    eksporty — tylko importowane z węższej ścieżki podrzędnej. `command-auth`
    reeksportuje je jako stuby zgodności.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Pomocniki bramkowania wzmianek → resolveInboundMentionDecision">
    **Stare**: `resolveInboundMentionRequirement({ facts, policy })` oraz
    `shouldDropInboundForMention(...)` z
    `openclaw/plugin-sdk/channel-inbound` albo
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nowe**: `resolveInboundMentionDecision({ facts, policy })` — zwraca
    pojedynczy obiekt decyzji zamiast dwóch rozdzielonych wywołań.

    Podrzędne Pluginy kanałów (Slack, Discord, Matrix, MS Teams) zostały już
    przełączone.

  </Accordion>

  <Accordion title="Shim środowiska uruchomieniowego kanału i pomocniki akcji kanału">
    `openclaw/plugin-sdk/channel-runtime` to shim zgodności dla starszych
    Pluginów kanałów. Nie importuj go z nowego kodu; używaj
    `openclaw/plugin-sdk/channel-runtime-context` do rejestrowania obiektów
    uruchomieniowych.

    Pomocniki `channelActions*` w `openclaw/plugin-sdk/channel-actions` są
    przestarzałe wraz z surowymi eksportami „actions” kanału. Zamiast tego udostępniaj możliwości
    przez semantyczną powierzchnię `presentation` — Pluginy kanałów
    deklarują, co renderują (karty, przyciski, pola wyboru), a nie jakie surowe
    nazwy akcji akceptują.

  </Accordion>

  <Accordion title="Pomocnik tool() dostawcy wyszukiwania w sieci → createTool() w Pluginie">
    **Stare**: fabryka `tool()` z `openclaw/plugin-sdk/provider-web-search`.

    **Nowe**: zaimplementuj `createTool(...)` bezpośrednio w Pluginie dostawcy.
    OpenClaw nie potrzebuje już pomocnika SDK do rejestrowania opakowania narzędzia.

  </Accordion>

  <Accordion title="Jawnotekstowe koperty kanału → BodyForAgent">
    **Stare**: `formatInboundEnvelope(...)` (oraz
    `ChannelMessageForAgent.channelEnvelope`) do budowania płaskiej jawnotekstowej koperty promptu
    z przychodzących wiadomości kanału.

    **Nowe**: `BodyForAgent` plus ustrukturyzowane bloki kontekstu użytkownika. Pluginy
    kanałów dołączają metadane routingu (wątek, temat, odpowiedź do, reakcje) jako
    typowane pola zamiast konkatenować je w ciąg promptu. Pomocnik
    `formatAgentEnvelope(...)` jest nadal obsługiwany dla syntetyzowanych
    kopert przeznaczonych dla asystenta, ale przychodzące jawnotekstowe koperty są
    wycofywane.

    Objęte obszary: `inbound_claim`, `message_received` oraz każdy niestandardowy
    Plugin kanału, który przetwarzał tekst `channelEnvelope`.

  </Accordion>

  <Accordion title="Typy wykrywania dostawcy → typy katalogu dostawców">
    Cztery aliasy typów wykrywania są teraz cienkimi opakowaniami nad
    typami z ery katalogu:

    | Stary alias               | Nowy typ                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Do tego starszy statyczny zbiór `ProviderCapabilities` — Pluginy dostawców
    powinny używać jawnych hooków dostawcy, takich jak `buildReplayPolicy`,
    `normalizeToolSchemas` i `wrapStreamFn`, zamiast statycznego obiektu.

  </Accordion>

  <Accordion title="Hooki zasad myślenia → resolveThinkingProfile">
    **Stare** (trzy osobne hooki w `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` oraz
    `resolveDefaultThinkingLevel(ctx)`.

    **Nowe**: pojedyncze `resolveThinkingProfile(ctx)`, które zwraca
    `ProviderThinkingProfile` z kanonicznym `id`, opcjonalnym `label` oraz
    uszeregowaną listą poziomów. OpenClaw automatycznie obniża przestarzałe zapisane wartości
    według rangi profilu.

    Zaimplementuj jeden hook zamiast trzech. Starsze hooki nadal działają w trakcie
    okna wycofania, ale nie są komponowane z wynikiem profilu.

  </Accordion>

  <Accordion title="Awaryjna ścieżka zewnętrznego dostawcy OAuth → contracts.externalAuthProviders">
    **Stare**: implementowanie `resolveExternalOAuthProfiles(...)` bez
    deklarowania dostawcy w manifeście Pluginu.

    **Nowe**: zadeklaruj `contracts.externalAuthProviders` w manifeście Pluginu
    **oraz** zaimplementuj `resolveExternalAuthProfiles(...)`. Stara ścieżka „awaryjnego
    uwierzytelniania” emituje ostrzeżenie w czasie działania i zostanie usunięta.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Wyszukiwanie zmiennych środowiskowych dostawcy → setup.providers[].envVars">
    **Stare** pole manifestu: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nowe**: odzwierciedl to samo wyszukiwanie zmiennych środowiskowych w `setup.providers[].envVars`
    w manifeście. Konsoliduje to metadane środowiskowe konfiguracji/statusu w jednym
    miejscu i pozwala uniknąć uruchamiania środowiska uruchomieniowego Pluginu tylko po to, aby obsłużyć
    wyszukiwania zmiennych środowiskowych.

    `providerAuthEnvVars` pozostaje obsługiwane przez adapter zgodności
    do zamknięcia okna wycofania.

  </Accordion>

  <Accordion title="Rejestracja Pluginu pamięci → registerMemoryCapability">
    **Stare**: trzy osobne wywołania —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nowe**: jedno wywołanie w API stanu pamięci —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Te same sloty, pojedyncze wywołanie rejestracji. Addytywne pomocniki pamięci
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) nie są objęte zmianą.

  </Accordion>

  <Accordion title="Zmieniono nazwy typów wiadomości sesji subagenta">
    Dwa starsze aliasy typów nadal eksportowane z `src/plugins/runtime/types.ts`:

    | Stare                         | Nowe                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Metoda uruchomieniowa `readSession` jest przestarzała na rzecz
    `getSessionMessages`. Ta sama sygnatura; stara metoda przekazuje wywołanie do
    nowej.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Stare**: `runtime.tasks.flow` (liczba pojedyncza) zwracało aktywny akcesor przepływu zadań.

    **Nowe**: `runtime.tasks.managedFlows` zachowuje zarządzane środowisko uruchomieniowe mutacji TaskFlow
    dla Pluginów, które tworzą, aktualizują, anulują lub uruchamiają zadania podrzędne z
    przepływu. Używaj `runtime.tasks.flows`, gdy Plugin potrzebuje tylko odczytów opartych na DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Fabryki osadzonych rozszerzeń → middleware wyniku narzędzia agenta">
    Omówione w sekcji „Jak migrować → Migrowanie rozszerzeń wyników narzędzi Pi do
    middleware” powyżej. Uwzględnione tutaj dla kompletności: usunięta ścieżka tylko dla Pi
    `api.registerEmbeddedExtensionFactory(...)` została zastąpiona przez
    `api.registerAgentToolResultMiddleware(...)` z jawną listą środowisk uruchomieniowych
    w `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` reeksportowany z `openclaw/plugin-sdk` jest teraz
    jednoliniowym aliasem dla `OpenClawConfig`. Preferuj kanoniczną nazwę.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Wycofania na poziomie rozszerzeń (wewnątrz dołączonych Pluginów kanałów/dostawców w
`extensions/`) są śledzone w ich własnych beczkach `api.ts` i `runtime-api.ts`.
Nie wpływają na kontrakty Pluginów firm trzecich i nie są tutaj wymienione.
Jeśli bezpośrednio używasz lokalnej beczki dołączonego Pluginu, przed aktualizacją przeczytaj
komentarze o wycofaniu w tej beczce.
</Note>

## Harmonogram usuwania

| Kiedy                  | Co się stanie                                                         |
| ---------------------- | ----------------------------------------------------------------------- |
| **Teraz**              | Przestarzałe powierzchnie emitują ostrzeżenia w czasie działania         |
| **Następne wydanie główne** | Przestarzałe powierzchnie zostaną usunięte; Pluginy, które nadal ich używają, przestaną działać |

Wszystkie podstawowe Pluginy zostały już zmigrowane. Zewnętrzne Pluginy powinny migrować
przed następnym wydaniem głównym.

## Tymczasowe wyciszanie ostrzeżeń

Ustaw te zmienne środowiskowe podczas pracy nad migracją:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

To jest tymczasowe wyjście awaryjne, a nie trwałe rozwiązanie.

## Powiązane

- [Pierwsze kroki](/pl/plugins/building-plugins) — zbuduj swój pierwszy Plugin
- [Przegląd SDK](/pl/plugins/sdk-overview) — pełne odniesienie importów ścieżek podrzędnych
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) — budowanie Pluginów kanałów
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) — budowanie Pluginów dostawców
- [Wnętrze Pluginów](/pl/plugins/architecture) — szczegółowe omówienie architektury
- [Manifest Pluginu](/pl/plugins/manifest) — odniesienie schematu manifestu
