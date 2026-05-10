---
read_when:
    - Widzisz ostrzeżenie OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Widzisz ostrzeżenie OPENCLAW_EXTENSION_API_DEPRECATED
    - Użyto api.registerEmbeddedExtensionFactory przed OpenClaw 2026.4.25
    - Aktualizujesz plugin do nowoczesnej architektury pluginów
    - Utrzymujesz zewnętrzny plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Migracja ze starszej warstwy zgodności wstecznej do nowoczesnego SDK Plugin
title: Migracja Plugin SDK
x-i18n:
    generated_at: "2026-05-10T19:49:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7595b41c15ce36dd8d2a3faf320cc9847b013b1f4807c02b8b97c6feaee4415
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw przeszedł z szerokiej warstwy kompatybilności wstecznej na nowoczesną
architekturę Pluginów z ukierunkowanymi, udokumentowanymi importami. Jeśli Twój Plugin został zbudowany przed
nową architekturą, ten przewodnik pomoże Ci przeprowadzić migrację.

## Co się zmienia

Stary system Pluginów udostępniał dwie szeroko otwarte powierzchnie, które pozwalały Pluginom importować
wszystko, czego potrzebowały, z jednego punktu wejścia:

- **`openclaw/plugin-sdk/compat`** - pojedynczy import, który reeksportował dziesiątki
  pomocników. Został wprowadzony, aby utrzymać działanie starszych Pluginów opartych na hookach podczas
  budowania nowej architektury Pluginów.
- **`openclaw/plugin-sdk/infra-runtime`** - szeroki barrel pomocników runtime, który
  mieszał zdarzenia systemowe, stan heartbeat, kolejki dostarczania, pomocniki fetch/proxy,
  pomocniki plikowe, typy zatwierdzeń i niepowiązane narzędzia.
- **`openclaw/plugin-sdk/config-runtime`** - szeroki barrel kompatybilności konfiguracji,
  który nadal przenosi przestarzałe bezpośrednie pomocniki odczytu/zapisu w oknie migracji.
- **`openclaw/extension-api`** - most, który dawał Pluginom bezpośredni dostęp do
  pomocników po stronie hosta, takich jak wbudowany runner agenta.
- **`api.registerEmbeddedExtensionFactory(...)`** - usunięty hook bundled extension tylko dla Pi,
  który mógł obserwować zdarzenia embedded-runnera, takie jak
  `tool_result`.

Szerokie powierzchnie importu są teraz **przestarzałe**. Nadal działają w runtime,
ale nowe Pluginy nie mogą ich używać, a istniejące Pluginy powinny przeprowadzić migrację, zanim
następne wydanie główne je usunie. API rejestracji embedded extension factory tylko dla Pi
zostało usunięte; zamiast tego użyj middleware wyników narzędzi.

OpenClaw nie usuwa ani nie reinterpretuje udokumentowanego zachowania Pluginów w tej samej
zmianie, która wprowadza zamiennik. Zmiany łamiące kontrakt muszą najpierw przejść
przez adapter kompatybilności, diagnostykę, dokumentację i okno deprecjacji.
Dotyczy to importów SDK, pól manifestu, API konfiguracji, hooków i zachowania
rejestracji runtime.

<Warning>
  Warstwa kompatybilności wstecznej zostanie usunięta w przyszłym wydaniu głównym.
  Pluginy, które nadal importują z tych powierzchni, przestaną wtedy działać.
  Rejestracje embedded extension factory tylko dla Pi już się nie ładują.
</Warning>

## Dlaczego to się zmieniło

Stare podejście powodowało problemy:

- **Wolny start** - zaimportowanie jednego pomocnika ładowało dziesiątki niepowiązanych modułów
- **Zależności cykliczne** - szerokie reeksporty ułatwiały tworzenie cykli importów
- **Niejasna powierzchnia API** - nie było sposobu, aby określić, które eksporty były stabilne, a które wewnętrzne

Nowoczesny SDK Pluginów to naprawia: każda ścieżka importu (`openclaw/plugin-sdk/\<subpath\>`)
jest małym, samodzielnym modułem z jasnym celem i udokumentowanym kontraktem.

Starsze wygodne seam'y providerów dla bundled channels również zniknęły.
Seam'y pomocnicze oznaczone marką kanału były prywatnymi skrótami mono-repo, a nie stabilnymi
kontraktami Pluginów. Zamiast tego używaj wąskich, generycznych subścieżek SDK. W przestrzeni roboczej bundled
Pluginu trzymaj pomocniki należące do providera w jego własnym `api.ts` lub
`runtime-api.ts`.

Aktualne przykłady bundled providerów:

- Anthropic trzyma pomocniki strumieniowania specyficzne dla Claude we własnym seam'ie `api.ts` /
  `contract-api.ts`
- OpenAI trzyma buildery providera, pomocniki modeli domyślnych i buildery providera realtime
  we własnym `api.ts`
- OpenRouter trzyma builder providera oraz pomocniki onboardingu/konfiguracji we własnym
  `api.ts`

## Plan migracji Talk i głosu realtime

Kod Talk dla głosu realtime, telefonii, spotkań i przeglądarki przechodzi z
lokalnego dla powierzchni księgowania tur na wspólny kontroler sesji Talk eksportowany przez
`openclaw/plugin-sdk/realtime-voice`. Nowy kontroler posiada wspólną
kopertę zdarzeń Talk, stan aktywnej tury, stan przechwytywania, stan wyjściowego
audio, historię ostatnich zdarzeń oraz odrzucanie nieaktualnych tur. Pluginy providerów powinny nadal posiadać
sesje realtime specyficzne dla dostawcy; Pluginy powierzchni powinny nadal posiadać przechwytywanie,
odtwarzanie, telefonię i osobliwości spotkań.

Ta migracja Talk celowo zrywa zgodność w czysty sposób:

1. Trzymaj współdzielony kontroler i prymitywy runtime w
   `plugin-sdk/realtime-voice`.
2. Przenieś bundled powierzchnie na wspólny kontroler: relay przeglądarkowy,
   handoff managed-room, realtime rozmów głosowych, streaming STT rozmów głosowych, Google
   Meet realtime oraz natywny push-to-talk.
3. Zastąp stare rodziny RPC Talk finalnym API `talk.session.*` i
   `talk.client.*`.
4. Ogłaszaj jeden żywy kanał zdarzeń Talk w Gateway
   `hello-ok.features.events`: `talk.event`.
5. Usuń stary endpoint HTTP realtime oraz każdą ścieżkę nadpisywania instrukcji
   w czasie żądania.

Nowy kod nie powinien wywoływać `createTalkEventSequencer(...)` bezpośrednio, chyba że
implementuje niskopoziomowy adapter lub fixture testową. Preferuj wspólny kontroler,
aby zdarzenia ograniczone do tury nie mogły być emitowane bez identyfikatora tury, nieaktualne wywołania `turnEnd` /
`turnCancel` nie mogły czyścić nowszej aktywnej tury, a zdarzenia cyklu życia wyjściowego audio
pozostawały spójne w telefonii, spotkaniach, relayu przeglądarkowym, handoffie managed-room
i natywnych klientach Talk.

Docelowy kształt publicznego API to:

```typescript
// Gateway-owned Talk session API.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
```

Sesje WebRTC/provider-websocket należące do przeglądarki używają `talk.client.create`,
ponieważ przeglądarka posiada negocjację providera i transport mediów, podczas gdy
Gateway posiada poświadczenia, instrukcje i politykę narzędzi. `talk.session.*` jest
wspólną powierzchnią zarządzaną przez Gateway dla sesji realtime gateway-relay, transkrypcji
gateway-relay oraz natywnych sesji STT/TTS managed-room.

Starsze konfiguracje, które umieszczały selektory realtime obok `talk.provider` /
`talk.providers`, powinny zostać naprawione za pomocą `openclaw doctor --fix`; runtime Talk
nie reinterpretuje konfiguracji providera speech/TTS jako konfiguracji providera realtime.

Obsługiwane kombinacje `talk.session.create` są celowo niewielkie:

| Tryb            | Transport       | Logika          | Właściciel         | Uwagi                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Pełnodupleksowe audio providera mostkowane przez Gateway; wywołania narzędzi są routowane przez narzędzie agent-consult.      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Tylko streaming STT; wywołujący wysyłają audio wejściowe i odbierają zdarzenia transkrypcji.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Pokój natywny/klienta | Pokoje w stylu push-to-talk i walkie-talkie, gdzie klient posiada przechwytywanie/odtwarzanie, a Gateway posiada stan tury. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Pokój natywny/klienta | Tryb pokoju tylko dla administratorów, dla zaufanych powierzchni first-party, które bezpośrednio wykonują akcje narzędzi Gateway.                  |

Mapa usuniętych metod:

| Stare                            | Nowe                                                     |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` lub `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

Ujednolicone słownictwo kontroli jest również celowo wąskie:

| Metoda                          | Dotyczy                                                | Kontrakt                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Dołącz fragment audio PCM w base64 do sesji providera należącej do tego samego połączenia Gateway.                                                                                            |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Rozpocznij turę użytkownika managed-room.                                                                                                                                                          |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Zakończ aktywną turę po walidacji nieaktualnej tury.                                                                                                                                         |
| `talk.session.cancelTurn`       | wszystkie sesje należące do Gateway                              | Anuluj aktywne przechwytywanie/pracę providera/agenta/TTS dla tury.                                                                                                                                |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Zatrzymaj wyjściowe audio asystenta bez koniecznego kończenia tury użytkownika.                                                                                                                    |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Zakończ wywołanie narzędzia providera wyemitowane przez relay; przekaż `options.willContinue` dla wyniku pośredniego lub `options.suppressResponse`, aby zaspokoić wywołanie bez kolejnej odpowiedzi asystenta. |
| `talk.session.close`            | wszystkie ujednolicone sesje                                    | Zatrzymaj sesje relay lub unieważnij stan managed-room, a następnie zapomnij ujednolicony identyfikator sesji.                                                                                                    |

  Nie wprowadzaj w rdzeniu wyjątków specyficznych dla dostawcy lub platformy, aby to zadziałało.
  Rdzeń odpowiada za semantykę sesji Talk. Pluginy dostawców odpowiadają za konfigurację sesji dostawcy.
  Połączenia głosowe i Google Meet odpowiadają za adaptery telefonii/spotkań. Przeglądarka i natywne
  aplikacje odpowiadają za UX przechwytywania/odtwarzania z urządzeń.

  ## Zasady zgodności

  W przypadku zewnętrznych pluginów prace nad zgodnością przebiegają w tej kolejności:

  1. dodaj nowy kontrakt
  2. zachowaj stare zachowanie podłączone przez adapter zgodności
  3. wyemituj diagnostykę lub ostrzeżenie, które wskazuje starą ścieżkę i zamiennik
  4. pokryj obie ścieżki testami
  5. udokumentuj wycofanie oraz ścieżkę migracji
  6. usuń dopiero po ogłoszonym oknie migracji, zwykle w wydaniu głównym

  Maintainerzy mogą przeprowadzić audyt bieżącej kolejki migracji za pomocą
  `pnpm plugins:boundary-report`. Użyj `pnpm plugins:boundary-report:summary` dla
  zwięzłych liczników, `--owner <id>` dla jednego pluginu lub właściciela zgodności oraz
  `pnpm plugins:boundary-report:ci`, gdy bramka CI powinna kończyć się niepowodzeniem przy zaległych
  rekordach zgodności, importach z zastrzeżonego SDK między właścicielami lub nieużywanych zastrzeżonych
  podścieżkach SDK. Raport grupuje przestarzałe
  rekordy zgodności według daty usunięcia, liczy lokalne odwołania w kodzie/dokumentacji,
  ujawnia importy z zastrzeżonego SDK między właścicielami i podsumowuje prywatny
  most SDK hosta pamięci, aby porządkowanie zgodności pozostawało jawne zamiast
  opierać się na doraźnych wyszukiwaniach. Zastrzeżone podścieżki SDK muszą mieć śledzone użycie przez właścicieli;
  nieużywane eksporty zastrzeżonych helperów należy usunąć z publicznego SDK.

  Jeśli pole manifestu jest nadal akceptowane, autorzy pluginów mogą dalej go używać, dopóki
  dokumentacja i diagnostyka nie powiedzą inaczej. Nowy kod powinien preferować udokumentowany
  zamiennik, ale istniejące pluginy nie powinny psuć się podczas zwykłych wydań
  pomniejszych.

  ## Jak przeprowadzić migrację

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Dołączone pluginy powinny przestać wywoływać
    `api.runtime.config.loadConfig()` i
    `api.runtime.config.writeConfigFile(...)` bezpośrednio. Preferuj konfigurację, która została
    już przekazana do aktywnej ścieżki wywołania. Długotrwałe handlery, które potrzebują
    bieżącej migawki procesu, mogą używać `api.runtime.config.current()`. Długotrwałe
    narzędzia agentów powinny używać `ctx.getRuntimeConfig()` z kontekstu narzędzia wewnątrz
    `execute`, aby narzędzie utworzone przed zapisem konfiguracji nadal widziało odświeżoną
    konfigurację runtime.

    Zapisy konfiguracji muszą przechodzić przez helpery transakcyjne i wybierać
    zasadę po zapisie:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Użyj `afterWrite: { mode: "restart", reason: "..." }`, gdy wywołujący wie,
    że zmiana wymaga czystego restartu gatewaya, oraz
    `afterWrite: { mode: "none", reason: "..." }` tylko wtedy, gdy wywołujący odpowiada za
    dalsze działania i celowo chce pominąć planer przeładowania.
    Wyniki mutacji zawierają typowane podsumowanie `followUp` dla testów i logowania;
    gateway pozostaje odpowiedzialny za zastosowanie lub zaplanowanie restartu.
    `loadConfig` i `writeConfigFile` pozostają przestarzałymi helperami zgodności
    dla zewnętrznych pluginów podczas okna migracji i ostrzegają raz z
    kodem zgodności `runtime-config-load-write`. Dołączone pluginy i kod runtime
    repozytorium są chronione przez bariery skanera w
    `pnpm check:deprecated-api-usage` i
    `pnpm check:no-runtime-action-load-config`: nowe użycie w produkcyjnych pluginach
    kończy się bezwzględnym niepowodzeniem, bezpośrednie zapisy konfiguracji kończą się niepowodzeniem, metody serwera gatewaya muszą używać
    migawki runtime żądania, helpery wysyłania/akcji/klienta kanału runtime
    muszą otrzymywać konfigurację ze swojej granicy, a długotrwałe moduły runtime mają
    zero dozwolonych otaczających wywołań `loadConfig()`.

    Nowy kod pluginów powinien także unikać importowania szerokiego
    barrela zgodności `openclaw/plugin-sdk/config-runtime`. Użyj wąskiej
    podścieżki SDK pasującej do zadania:

    | Potrzeba | Import |
    | --- | --- |
    | Typy konfiguracji, takie jak `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Asercje już wczytanej konfiguracji i wyszukiwanie konfiguracji wpisu pluginu | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Odczyty bieżącej migawki runtime | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Zapisy konfiguracji | `openclaw/plugin-sdk/config-mutation` |
    | Helpery magazynu sesji | `openclaw/plugin-sdk/session-store-runtime` |
    | Konfiguracja tabel Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helpery runtime zasad grup | `openclaw/plugin-sdk/runtime-group-policy` |
    | Rozwiązywanie wejścia sekretów | `openclaw/plugin-sdk/secret-input-runtime` |
    | Nadpisania modeli/sesji | `openclaw/plugin-sdk/model-session-runtime` |

    Dołączone pluginy i ich testy są chronione skanerem przed szerokim
    barrelem, dzięki czemu importy i mocki pozostają lokalne względem zachowania, którego potrzebują. Szeroki
    barrel nadal istnieje dla zgodności zewnętrznej, ale nowy kod nie powinien
    od niego zależeć.

  </Step>

  <Step title="Migrate Pi tool-result extensions to middleware">
    Dołączone pluginy muszą zastąpić handlery wyników narzędzi specyficzne dla Pi
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
    przepisać wynik narzędzia o wysokim zaufaniu, zanim model go zobaczy.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Pluginy kanałów obsługujące zatwierdzanie udostępniają teraz natywne zachowanie zatwierdzania przez
    `approvalCapability.nativeRuntime` oraz współdzielony rejestr kontekstu runtime.

    Kluczowe zmiany:

    - Zastąp `approvalCapability.handler.loadRuntime(...)` przez
      `approvalCapability.nativeRuntime`
    - Przenieś autoryzację/dostarczanie specyficzne dla zatwierdzania ze starszego okablowania `plugin.auth` /
      `plugin.approvals` na `approvalCapability`
    - `ChannelPlugin.approvals` zostało usunięte z publicznego kontraktu pluginu kanału;
      przenieś pola dostarczania/natywne/renderowania na `approvalCapability`
    - `plugin.auth` pozostaje tylko dla przepływów logowania/wylogowania kanału; hooki autoryzacji zatwierdzania
      w tym miejscu nie są już odczytywane przez rdzeń
    - Rejestruj obiekty runtime należące do kanału, takie jak klienci, tokeny lub aplikacje Bolt,
      przez `openclaw/plugin-sdk/channel-runtime-context`
    - Nie wysyłaj powiadomień o przekierowaniu należących do pluginu z natywnych handlerów zatwierdzania;
      rdzeń odpowiada teraz za powiadomienia o dostarczeniu gdzie indziej na podstawie rzeczywistych wyników dostarczenia
    - Podczas przekazywania `channelRuntime` do `createChannelManager(...)` podaj
      rzeczywistą powierzchnię `createPluginRuntime().channel`. Częściowe stuby są odrzucane.

    Zobacz `/plugins/sdk-channel-plugins`, aby sprawdzić bieżący układ capability zatwierdzania.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Jeśli Twój plugin używa `openclaw/plugin-sdk/windows-spawn`, nierozwiązane wrappery Windows
    `.cmd`/`.bat` kończą się teraz zamkniętym niepowodzeniem, chyba że jawnie przekażesz
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

    Jeśli wywołujący nie opiera się celowo na awaryjnym użyciu powłoki, nie ustawiaj
    `allowShellFallback` i zamiast tego obsłuż zgłoszony błąd.

  </Step>

  <Step title="Find deprecated imports">
    Wyszukaj w swoim pluginie importy z jednej z przestarzałych powierzchni:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    Każdy eksport ze starej powierzchni mapuje się na konkretną nowoczesną ścieżkę importu:

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

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` nadal istnieje dla zgodności
    zewnętrznej, ale nowy kod powinien importować zawężoną powierzchnię helperów, której
    faktycznie potrzebuje:

    | Potrzeba | Import |
    | --- | --- |
    | Helpery kolejki zdarzeń systemowych | `openclaw/plugin-sdk/system-event-runtime` |
    | Helpery wybudzania, zdarzeń i widoczności Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Opróżnianie kolejki oczekujących dostarczeń | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetria aktywności kanału | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Pamięci podręczne deduplikacji w pamięci | `openclaw/plugin-sdk/dedupe-runtime` |
    | Bezpieczne helpery ścieżek lokalnych plików/mediów | `openclaw/plugin-sdk/file-access-runtime` |
    | Pobieranie świadome dispatchera | `openclaw/plugin-sdk/runtime-fetch` |
    | Helpery proxy i chronionego pobierania | `openclaw/plugin-sdk/fetch-runtime` |
    | Typy zasad dispatchera SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typy żądania/rozwiązania zatwierdzenia | `openclaw/plugin-sdk/approval-runtime` |
    | Helpery ładunku odpowiedzi zatwierdzenia i poleceń | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helpery formatowania błędów | `openclaw/plugin-sdk/error-runtime` |
    | Oczekiwania gotowości transportu | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helpery bezpiecznych tokenów | `openclaw/plugin-sdk/secure-random-runtime` |
    | Ograniczona współbieżność zadań asynchronicznych | `openclaw/plugin-sdk/concurrency-runtime` |
    | Koercja liczbowa | `openclaw/plugin-sdk/number-runtime` |
    | Lokalna dla procesu blokada asynchroniczna | `openclaw/plugin-sdk/async-lock-runtime` |
    | Blokady plików | `openclaw/plugin-sdk/file-lock` |

    Dołączone pluginy są chronione skanerem przed `infra-runtime`, więc kod repozytorium
    nie może cofnąć się do szerokiego barrela.

  </Step>

  <Step title="Migrate channel route helpers">
    Nowy kod tras kanałów powinien używać `openclaw/plugin-sdk/channel-route`.
    Starsze nazwy klucza trasy i porównywalnego celu pozostają aliasami zgodności
    podczas okna migracji, ale nowe pluginy powinny używać nazw tras,
    które bezpośrednio opisują zachowanie:

    | Stary helper | Nowoczesny helper |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Nowoczesne helpery tras normalizują `{ channel, to, accountId, threadId }`
    spójnie w natywnych zatwierdzeniach, pomijaniu odpowiedzi, deduplikacji przychodzącej,
    dostarczaniu cron oraz routingu sesji. Jeśli Twój plugin ma własną gramatykę celu,
    użyj `resolveChannelRouteTargetWithParser(...)`, aby dostosować ten
    parser do tego samego kontraktu celu trasy.

  </Step>

  <Step title="Budowanie i testowanie">
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
  | `plugin-sdk/plugin-entry` | Kanoniczny helper punktu wejścia Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Starszy zbiorczy re-eksport dla definicji/builderów punktów wejścia kanału | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Eksport głównego schematu konfiguracji | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Helper punktu wejścia dla pojedynczego dostawcy | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Skoncentrowane definicje i buildery punktów wejścia kanału | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Wspólne helpery kreatora konfiguracji | Prompty allowlist, buildery stanu konfiguracji |
  | `plugin-sdk/setup-runtime` | Helpery środowiska uruchomieniowego na czas konfiguracji | Bezpieczne importowo adaptery łatek konfiguracji, helpery notatek wyszukiwania, `promptResolvedAllowFrom`, `splitSetupEntries`, delegowane proxy konfiguracji |
  | `plugin-sdk/setup-adapter-runtime` | Przestarzały alias adaptera konfiguracji | Użyj `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Helpery narzędziowe konfiguracji | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helpery wielu kont | Helpery listy kont/konfiguracji/bramki akcji |
  | `plugin-sdk/account-id` | Helpery identyfikatora konta | `DEFAULT_ACCOUNT_ID`, normalizacja identyfikatora konta |
  | `plugin-sdk/account-resolution` | Helpery wyszukiwania kont | Helpery wyszukiwania kont + domyślnego fallbacku |
  | `plugin-sdk/account-helpers` | Wąskie helpery kont | Helpery listy kont/akcji konta |
  | `plugin-sdk/channel-setup` | Adaptery kreatora konfiguracji | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Prymitywy parowania DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Powiązanie prefiksu odpowiedzi, wpisywania i dostarczania źródła | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabryki adapterów konfiguracji i helpery dostępu DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Buildery schematów konfiguracji | Tylko wspólne prymitywy schematu konfiguracji kanału i ogólny builder |
  | `plugin-sdk/bundled-channel-config-schema` | Dołączone schematy konfiguracji | Tylko dołączone pluginy utrzymywane przez OpenClaw; nowe pluginy muszą definiować schematy lokalne dla Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Przestarzałe dołączone schematy konfiguracji | Tylko alias zgodności; używaj `plugin-sdk/bundled-channel-config-schema` dla utrzymywanych dołączonych pluginów |
  | `plugin-sdk/telegram-command-config` | Helpery konfiguracji poleceń Telegram | Normalizacja nazw poleceń, przycinanie opisów, walidacja duplikatów/konfliktów |
  | `plugin-sdk/channel-policy` | Rozwiązywanie zasad grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Helpery stanu konta i cyklu życia strumienia szkiców | `createAccountStatusSink`, helpery finalizacji podglądu szkicu |
  | `plugin-sdk/inbound-envelope` | Helpery kopert przychodzących | Wspólne helpery tras + buildera kopert |
  | `plugin-sdk/inbound-reply-dispatch` | Helpery odpowiedzi przychodzących | Wspólne helpery rejestrowania i wysyłki |
  | `plugin-sdk/messaging-targets` | Parsowanie celów wiadomości | Helpery parsowania/dopasowywania celów |
  | `plugin-sdk/outbound-media` | Helpery mediów wychodzących | Wspólne ładowanie mediów wychodzących |
  | `plugin-sdk/outbound-send-deps` | Helpery zależności wysyłki wychodzącej | Lekkie wyszukiwanie `resolveOutboundSendDep` bez importowania pełnego środowiska wychodzącego |
  | `plugin-sdk/outbound-runtime` | Helpery środowiska wychodzącego | Helpery dostarczania wychodzącego, delegata tożsamości/wysyłki, sesji, formatowania i planowania ładunku |
  | `plugin-sdk/thread-bindings-runtime` | Helpery powiązań wątków | Helpery cyklu życia powiązań wątków i adapterów |
  | `plugin-sdk/agent-media-payload` | Starsze helpery ładunku mediów | Builder ładunku mediów agenta dla starszych układów pól |
  | `plugin-sdk/channel-runtime` | Przestarzała podkładka zgodności | Tylko starsze narzędzia środowiska kanału |
  | `plugin-sdk/channel-send-result` | Typy wyniku wysyłki | Typy wyniku odpowiedzi |
  | `plugin-sdk/runtime-store` | Trwały magazyn Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Szerokie helpery środowiska uruchomieniowego | Helpery środowiska uruchomieniowego/logowania/kopii zapasowej/instalacji Plugin |
  | `plugin-sdk/runtime-env` | Wąskie helpery środowiska uruchomieniowego | Logger/środowisko uruchomieniowe, limit czasu, ponowienie i helpery backoff |
  | `plugin-sdk/plugin-runtime` | Wspólne helpery środowiska uruchomieniowego Plugin | Helpery poleceń/hooków/http/interaktywne Plugin |
  | `plugin-sdk/hook-runtime` | Helpery potoku hooków | Wspólne helpery potoku webhooków/hooków wewnętrznych |
  | `plugin-sdk/lazy-runtime` | Helpery leniwego środowiska uruchomieniowego | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Helpery procesów | Wspólne helpery exec |
  | `plugin-sdk/cli-runtime` | Helpery środowiska CLI | Formatowanie poleceń, oczekiwania, helpery wersji |
  | `plugin-sdk/gateway-runtime` | Helpery Gateway | Klient Gateway, helper uruchamiania gotowego dla pętli zdarzeń oraz helpery łatek stanu kanału |
  | `plugin-sdk/config-runtime` | Przestarzała podkładka zgodności konfiguracji | Preferuj `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` i `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Helpery poleceń Telegram | Stabilne względem fallbacku helpery walidacji poleceń Telegram, gdy powierzchnia kontraktu dołączonego Telegram jest niedostępna |
  | `plugin-sdk/approval-runtime` | Helpery promptów zatwierdzania | Ładunek zatwierdzania exec/Plugin, helpery możliwości/profilu zatwierdzania, natywne trasowanie/środowisko zatwierdzania oraz formatowanie ścieżki wyświetlania strukturalnego zatwierdzenia |
  | `plugin-sdk/approval-auth-runtime` | Helpery autoryzacji zatwierdzania | Rozwiązywanie zatwierdzającego, autoryzacja akcji w tym samym czacie |
  | `plugin-sdk/approval-client-runtime` | Helpery klienta zatwierdzania | Natywne helpery profilu/filtra zatwierdzania exec |
  | `plugin-sdk/approval-delivery-runtime` | Helpery dostarczania zatwierdzeń | Natywne adaptery możliwości/dostarczania zatwierdzeń |
  | `plugin-sdk/approval-gateway-runtime` | Helpery Gateway zatwierdzania | Wspólny helper rozwiązywania Gateway zatwierdzania |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helpery adaptera zatwierdzania | Lekkie helpery ładowania natywnego adaptera zatwierdzania dla gorących punktów wejścia kanału |
  | `plugin-sdk/approval-handler-runtime` | Helpery obsługi zatwierdzania | Szersze helpery środowiska obsługi zatwierdzania; preferuj węższe powierzchnie adaptera/Gateway, gdy wystarczają |
  | `plugin-sdk/approval-native-runtime` | Helpery celu zatwierdzania | Natywne helpery wiązania celu/konta zatwierdzania |
  | `plugin-sdk/approval-reply-runtime` | Helpery odpowiedzi zatwierdzania | Helpery ładunku odpowiedzi zatwierdzania exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Helpery kontekstu środowiska kanału | Ogólne helpery rejestrowania/pobierania/obserwowania kontekstu środowiska kanału |
  | `plugin-sdk/security-runtime` | Helpery bezpieczeństwa | Wspólne helpery zaufania, bramkowania DM, plików/ścieżek ograniczonych do katalogu głównego, treści zewnętrznych i zbierania sekretów |
  | `plugin-sdk/ssrf-policy` | Helpery zasad SSRF | Helpery allowlist hostów i zasad sieci prywatnych |
  | `plugin-sdk/ssrf-runtime` | Helpery środowiska SSRF | Przypięty dyspozytor, chronione pobieranie, helpery zasad SSRF |
  | `plugin-sdk/system-event-runtime` | Helpery zdarzeń systemowych | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Helpery Heartbeat | Helpery wybudzania, zdarzeń i widoczności Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Helpery kolejki dostarczania | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helpery aktywności kanału | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Helpery deduplikacji | Pamięci podręczne deduplikacji w pamięci |
  | `plugin-sdk/file-access-runtime` | Helpery dostępu do plików | Helpery bezpiecznych ścieżek plików/mediów lokalnych |
  | `plugin-sdk/transport-ready-runtime` | Helpery gotowości transportu | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Helpery ograniczonej pamięci podręcznej | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helpery bramkowania diagnostyki | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helpery formatowania błędów | `formatUncaughtError`, `isApprovalNotFoundError`, helpery grafu błędów |
  | `plugin-sdk/fetch-runtime` | Helpery opakowanego fetch/proxy | `resolveFetch`, helpery proxy, helpery opcji EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Helpery normalizacji hostów | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Helpery ponowień | `RetryConfig`, `retryAsync`, uruchamiacze zasad |
  | `plugin-sdk/allow-from` | Formatowanie allowlist | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapowanie wejść allowlist | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Bramkowanie poleceń i helpery powierzchni poleceń | `resolveControlCommandGate`, helpery autoryzacji nadawcy, helpery rejestru poleceń obejmujące dynamiczne formatowanie menu argumentów |
  | `plugin-sdk/command-status` | Renderery stanu/pomocy poleceń | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsowanie wejścia sekretów | Helpery wejścia sekretów |
  | `plugin-sdk/webhook-ingress` | Helpery żądań Webhook | Narzędzia celów Webhook |
  | `plugin-sdk/webhook-request-guards` | Helpery strażników treści Webhook | Helpery odczytu/limitu treści żądania |
  | `plugin-sdk/reply-runtime` | Wspólne środowisko odpowiedzi | Wysyłka przychodząca, Heartbeat, planer odpowiedzi, dzielenie na fragmenty |
  | `plugin-sdk/reply-dispatch-runtime` | Wąskie helpery wysyłki odpowiedzi | Finalizacja, wysyłka dostawcy i helpery etykiet konwersacji |
  | `plugin-sdk/reply-history` | Helpery historii odpowiedzi | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planowanie odwołań odpowiedzi | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helpery fragmentów odpowiedzi | Helpery dzielenia tekstu/markdown na fragmenty |
  | `plugin-sdk/session-store-runtime` | Helpery magazynu sesji | Helpery ścieżki magazynu + updated-at |
  | `plugin-sdk/state-paths` | Helpery ścieżek stanu | Helpery katalogów stanu i OAuth |
  | `plugin-sdk/routing` | Helpery trasowania/klucza sesji | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, helpery normalizacji klucza sesji |
  | `plugin-sdk/status-helpers` | Helpery stanu kanału | Buildery podsumowania stanu kanału/konta, domyślne wartości stanu środowiska uruchomieniowego, helpery metadanych problemu |
  | `plugin-sdk/target-resolver-runtime` | Helpery resolvera celów | Wspólne helpery resolvera celów |
  | `plugin-sdk/string-normalization-runtime` | Helpery normalizacji ciągów | Helpery normalizacji slug/ciągów |
  | `plugin-sdk/request-url` | Helpery URL żądania | Wyodrębnianie URL-i jako ciągów z wejść podobnych do żądania |
  | `plugin-sdk/run-command` | Helpery poleceń z limitem czasu | Runner poleceń z limitem czasu i znormalizowanymi stdout/stderr |
  | `plugin-sdk/param-readers` | Czytniki parametrów | Wspólne czytniki parametrów narzędzi/CLI |
  | `plugin-sdk/tool-payload` | Wyodrębnianie ładunku narzędzia | Wyodrębnia znormalizowane ładunki z obiektów wyników narzędzi |
  | `plugin-sdk/tool-send` | Wyodrębnianie wysyłki narzędzia | Wyodrębnia kanoniczne pola celu wysyłki z argumentów narzędzia |
  | `plugin-sdk/temp-path` | Pomocniki ścieżek tymczasowych | Współdzielone pomocniki ścieżek pobierania tymczasowego |
  | `plugin-sdk/logging-core` | Pomocniki rejestrowania | Pomocniki loggera podsystemu i redakcji |
  | `plugin-sdk/markdown-table-runtime` | Pomocniki tabel Markdown | Pomocniki trybu tabel Markdown |
  | `plugin-sdk/reply-payload` | Typy odpowiedzi wiadomości | Typy ładunku odpowiedzi |
  | `plugin-sdk/provider-setup` | Wyselekcjonowane pomocniki konfiguracji lokalnych/samohostowanych dostawców | Pomocniki wykrywania/konfiguracji samohostowanych dostawców |
  | `plugin-sdk/self-hosted-provider-setup` | Skupione pomocniki konfiguracji samohostowanych dostawców zgodnych z OpenAI | Te same pomocniki wykrywania/konfiguracji samohostowanych dostawców |
  | `plugin-sdk/provider-auth-runtime` | Pomocniki uwierzytelniania środowiska uruchomieniowego dostawcy | Pomocniki rozwiązywania klucza API w czasie wykonywania |
  | `plugin-sdk/provider-auth-api-key` | Pomocniki konfiguracji klucza API dostawcy | Pomocniki onboardingu i zapisu profilu klucza API |
  | `plugin-sdk/provider-auth-result` | Pomocniki wyniku uwierzytelniania dostawcy | Standardowy konstruktor wyniku uwierzytelniania OAuth |
  | `plugin-sdk/provider-selection-runtime` | Pomocniki wyboru dostawcy | Wybór skonfigurowanego lub automatycznego dostawcy oraz scalanie surowej konfiguracji dostawcy |
  | `plugin-sdk/provider-env-vars` | Pomocniki zmiennych środowiskowych dostawcy | Pomocniki wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
  | `plugin-sdk/provider-model-shared` | Współdzielone pomocniki modelu/odtwarzania dostawcy | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory zasad odtwarzania, pomocniki punktów końcowych dostawcy i pomocniki normalizacji identyfikatorów modeli |
  | `plugin-sdk/provider-catalog-shared` | Współdzielone pomocniki katalogu dostawcy | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Poprawki onboardingu dostawcy | Pomocniki konfiguracji onboardingu |
  | `plugin-sdk/provider-http` | Pomocniki HTTP dostawcy | Ogólne pomocniki możliwości HTTP/punktów końcowych dostawcy, w tym pomocniki formularza multipart do transkrypcji audio |
  | `plugin-sdk/provider-web-fetch` | Pomocniki pobierania z sieci dostawcy | Pomocniki rejestracji/pamięci podręcznej dostawcy pobierania z sieci |
  | `plugin-sdk/provider-web-search-config-contract` | Pomocniki konfiguracji wyszukiwania w sieci dostawcy | Wąskie pomocniki konfiguracji/poświadczeń wyszukiwania w sieci dla dostawców, którzy nie potrzebują okablowania włączania Plugin |
  | `plugin-sdk/provider-web-search-contract` | Pomocniki kontraktu wyszukiwania w sieci dostawcy | Wąskie pomocniki kontraktu konfiguracji/poświadczeń wyszukiwania w sieci, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowe settery/gettery poświadczeń |
  | `plugin-sdk/provider-web-search` | Pomocniki wyszukiwania w sieci dostawcy | Pomocniki rejestracji/pamięci podręcznej/środowiska uruchomieniowego dostawcy wyszukiwania w sieci |
  | `plugin-sdk/provider-tools` | Pomocniki zgodności narzędzi/schematu dostawcy | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` oraz czyszczenie schematu Gemini i diagnostyka |
  | `plugin-sdk/provider-usage` | Pomocniki użycia dostawcy | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` i inne pomocniki użycia dostawcy |
  | `plugin-sdk/provider-stream` | Pomocniki opakowań strumienia dostawcy | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy opakowań strumieni oraz współdzielone pomocniki opakowań Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Pomocniki transportu dostawcy | Natywne pomocniki transportu dostawcy, takie jak chronione pobieranie, transformacje komunikatów transportu i zapisywalne strumienie zdarzeń transportu |
  | `plugin-sdk/keyed-async-queue` | Uporządkowana kolejka asynchroniczna | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Współdzielone pomocniki mediów | Pomocniki pobierania/przekształcania/przechowywania mediów, sondowanie wymiarów wideo oparte na ffprobe oraz konstruktory ładunków mediów |
  | `plugin-sdk/media-generation-runtime` | Współdzielone pomocniki generowania mediów | Współdzielone pomocniki przełączania awaryjnego, wybór kandydatów i komunikaty o brakujących modelach dla generowania obrazów/wideo/muzyki |
  | `plugin-sdk/media-understanding` | Pomocniki rozumienia mediów | Typy dostawców rozumienia mediów oraz eksporty pomocników obrazu/audio skierowane do dostawców |
  | `plugin-sdk/text-runtime` | Przestarzały szeroki eksport zgodności tekstu | Użyj `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` i `logging-core` |
  | `plugin-sdk/text-chunking` | Pomocniki dzielenia tekstu | Pomocnik dzielenia tekstu wychodzącego |
  | `plugin-sdk/speech` | Pomocniki mowy | Typy dostawców mowy oraz skierowane do dostawców pomocniki dyrektyw, rejestru i walidacji, a także konstruktor TTS zgodny z OpenAI |
  | `plugin-sdk/speech-core` | Współdzielony rdzeń mowy | Typy dostawców mowy, rejestr, dyrektywy, normalizacja |
  | `plugin-sdk/realtime-transcription` | Pomocniki transkrypcji w czasie rzeczywistym | Typy dostawców, pomocniki rejestru i współdzielony pomocnik sesji WebSocket |
  | `plugin-sdk/realtime-voice` | Pomocniki głosu w czasie rzeczywistym | Typy dostawców, pomocniki rejestru/rozwiązywania, pomocniki sesji mostka, współdzielone kolejki odpowiedzi głosowych agenta, kondycja transkrypcji/zdarzeń, tłumienie echa i pomocniki szybkiej konsultacji kontekstu |
  | `plugin-sdk/image-generation` | Pomocniki generowania obrazów | Typy dostawców generowania obrazów oraz pomocniki zasobów obrazu/adresów URL danych i konstruktor dostawcy obrazów zgodny z OpenAI |
  | `plugin-sdk/image-generation-core` | Współdzielony rdzeń generowania obrazów | Typy generowania obrazów, przełączanie awaryjne, uwierzytelnianie i pomocniki rejestru |
  | `plugin-sdk/music-generation` | Pomocniki generowania muzyki | Typy dostawców/żądań/wyników generowania muzyki |
  | `plugin-sdk/music-generation-core` | Współdzielony rdzeń generowania muzyki | Typy generowania muzyki, pomocniki przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie odwołań do modeli |
  | `plugin-sdk/video-generation` | Pomocniki generowania wideo | Typy dostawców/żądań/wyników generowania wideo |
  | `plugin-sdk/video-generation-core` | Współdzielony rdzeń generowania wideo | Typy generowania wideo, pomocniki przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie odwołań do modeli |
  | `plugin-sdk/interactive-runtime` | Pomocniki odpowiedzi interaktywnych | Normalizacja/redukcja ładunku odpowiedzi interaktywnej |
  | `plugin-sdk/channel-config-primitives` | Prymitywy konfiguracji kanału | Wąskie prymitywy schematu konfiguracji kanału |
  | `plugin-sdk/channel-config-writes` | Pomocniki zapisu konfiguracji kanału | Pomocniki autoryzacji zapisu konfiguracji kanału |
  | `plugin-sdk/channel-plugin-common` | Współdzielona preambuła kanału | Współdzielone eksporty preambuły Plugin kanału |
  | `plugin-sdk/channel-status` | Pomocniki statusu kanału | Współdzielone pomocniki migawki/podsumowania statusu kanału |
  | `plugin-sdk/allowlist-config-edit` | Pomocniki konfiguracji listy dozwolonych | Pomocniki edycji/odczytu konfiguracji listy dozwolonych |
  | `plugin-sdk/group-access` | Pomocniki dostępu grupowego | Współdzielone pomocniki decyzji dostępu grupowego |
  | `plugin-sdk/direct-dm` | Pomocniki bezpośrednich DM | Współdzielone pomocniki uwierzytelniania/ochrony bezpośrednich DM |
  | `plugin-sdk/extension-shared` | Współdzielone pomocniki rozszerzeń | Prymitywy pomocników kanału pasywnego/statusu i proxy otoczenia |
  | `plugin-sdk/webhook-targets` | Pomocniki celów Webhook | Rejestr celów Webhook i pomocniki instalacji tras |
  | `plugin-sdk/webhook-path` | Przestarzały alias ścieżki webhooka | Użyj `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Współdzielone pomocniki mediów internetowych | Pomocniki ładowania mediów zdalnych/lokalnych |
  | `plugin-sdk/zod` | Przestarzały reeksport zgodności Zod | Importuj `zod` bezpośrednio z `zod` |
  | `plugin-sdk/memory-core` | Dołączone pomocniki rdzenia pamięci | Powierzchnia pomocnicza menedżera/konfiguracji/plików/CLI pamięci |
  | `plugin-sdk/memory-core-engine-runtime` | Fasada środowiska uruchomieniowego silnika pamięci | Fasada środowiska uruchomieniowego indeksu/wyszukiwania pamięci |
  | `plugin-sdk/memory-core-host-engine-foundation` | Silnik fundamentu hosta pamięci | Eksporty silnika fundamentu hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Silnik osadzania hosta pamięci | Kontrakty osadzania pamięci, dostęp do rejestru, dostawca lokalny oraz ogólne pomocniki wsadowe/zdalne; konkretni dostawcy zdalni żyją we własnych Plugin |
  | `plugin-sdk/memory-core-host-engine-qmd` | Silnik QMD hosta pamięci | Eksporty silnika QMD hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-storage` | Silnik magazynu hosta pamięci | Eksporty silnika magazynu hosta pamięci |
  | `plugin-sdk/memory-core-host-multimodal` | Pomocniki multimodalne hosta pamięci | Pomocniki multimodalne hosta pamięci |
  | `plugin-sdk/memory-core-host-query` | Pomocniki zapytań hosta pamięci | Pomocniki zapytań hosta pamięci |
  | `plugin-sdk/memory-core-host-secret` | Pomocniki sekretów hosta pamięci | Pomocniki sekretów hosta pamięci |
  | `plugin-sdk/memory-core-host-events` | Przestarzały alias zdarzeń pamięci | Użyj `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Pomocniki statusu hosta pamięci | Pomocniki statusu hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-cli` | Środowisko uruchomieniowe CLI hosta pamięci | Pomocniki środowiska uruchomieniowego CLI hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-core` | Rdzeniowe środowisko uruchomieniowe hosta pamięci | Pomocniki rdzeniowego środowiska uruchomieniowego hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-files` | Pomocniki plików/środowiska uruchomieniowego hosta pamięci | Pomocniki plików/środowiska uruchomieniowego hosta pamięci |
  | `plugin-sdk/memory-host-core` | Alias rdzeniowego środowiska uruchomieniowego hosta pamięci | Neutralny względem dostawcy alias pomocników rdzeniowego środowiska uruchomieniowego hosta pamięci |
  | `plugin-sdk/memory-host-events` | Alias dziennika zdarzeń hosta pamięci | Neutralny względem dostawcy alias pomocników dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-host-files` | Przestarzały alias plików/środowiska uruchomieniowego pamięci | Użyj `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Pomocniki zarządzanego Markdown | Współdzielone pomocniki zarządzanego Markdown dla Plugin sąsiadujących z pamięcią |
  | `plugin-sdk/memory-host-search` | Fasada wyszukiwania aktywnej pamięci | Leniwa fasada środowiska uruchomieniowego menedżera wyszukiwania aktywnej pamięci |
  | `plugin-sdk/memory-host-status` | Przestarzały alias statusu hosta pamięci | Użyj `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Narzędzia testowe | Lokalny dla repozytorium przestarzały barrel zgodności; używaj skupionych lokalnych podścieżek testowych repozytorium, takich jak `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` i `plugin-sdk/test-fixtures` |
</Accordion>

Ta tabela celowo obejmuje wspólny podzbiór migracyjny, a nie całą
powierzchnię SDK. Inwentarz punktów wejścia kompilatora znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`; eksporty pakietu są generowane z
publicznego podzbioru.

Zarezerwowane pomocnicze punkty integracji wbudowanych Pluginów zostały wycofane z publicznej mapy eksportów SDK
z wyjątkiem jawnie udokumentowanych fasad zgodności, takich jak
przestarzały shim `plugin-sdk/discord`, zachowany dla opublikowanego
pakietu `@openclaw/discord@2026.3.13`. Pomocnicy specyficzni dla właściciela znajdują się wewnątrz
pakietu Pluginu właściciela; współdzielone zachowanie hosta powinno przechodzić przez ogólne
kontrakty SDK, takie jak `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`
i `plugin-sdk/plugin-config-runtime`.

Używaj najwęższego importu pasującego do zadania. Jeśli nie możesz znaleźć eksportu,
sprawdź źródło w `src/plugin-sdk/` albo zapytaj maintainerów, który ogólny kontrakt
powinien go posiadać.

## Aktywne wycofania

Węższe wycofania, które dotyczą całego SDK Pluginów, kontraktu providera,
powierzchni runtime i manifestu. Każde z nich nadal dziś działa, ale zostanie usunięte
w przyszłym wydaniu głównym. Wpis pod każdym elementem mapuje stare API na jego
kanoniczny zamiennik.

<AccordionGroup>
  <Accordion title="konstruktory pomocy command-auth → command-status">
    **Stare (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nowe (`openclaw/plugin-sdk/command-status`)**: te same sygnatury, te same
    eksporty - tylko importowane z węższej podścieżki. `command-auth`
    reeksportuje je jako stuby zgodności.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Pomocnicy bramkowania wzmianek → resolveInboundMentionDecision">
    **Stare**: `resolveInboundMentionRequirement({ facts, policy })` i
    `shouldDropInboundForMention(...)` z
    `openclaw/plugin-sdk/channel-inbound` albo
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nowe**: `resolveInboundMentionDecision({ facts, policy })` - zwraca
    pojedynczy obiekt decyzji zamiast dwóch rozdzielonych wywołań.

    Niżej położone Pluginy kanałów (Slack, Discord, Matrix, MS Teams) już się
    przełączyły.

  </Accordion>

  <Accordion title="Shim runtime kanału i pomocnicy akcji kanału">
    `openclaw/plugin-sdk/channel-runtime` to shim zgodności dla starszych
    Pluginów kanałów. Nie importuj go z nowego kodu; użyj
    `openclaw/plugin-sdk/channel-runtime-context` do rejestrowania obiektów
    runtime.

    Pomocnicy `channelActions*` w `openclaw/plugin-sdk/channel-actions` są
    przestarzali razem z surowymi eksportami kanałów typu "actions". Zamiast tego wystawiaj możliwości
    przez semantyczną powierzchnię `presentation` - Pluginy kanałów
    deklarują, co renderują (karty, przyciski, selecty), a nie które surowe
    nazwy akcji akceptują.

  </Accordion>

  <Accordion title="Pomocnik tool() providera wyszukiwania webowego → createTool() w Pluginie">
    **Stare**: fabryka `tool()` z `openclaw/plugin-sdk/provider-web-search`.

    **Nowe**: zaimplementuj `createTool(...)` bezpośrednio w Pluginie providera.
    OpenClaw nie potrzebuje już pomocnika SDK do rejestrowania wrappera narzędzia.

  </Accordion>

  <Accordion title="Koperty kanału w tekście zwykłym → BodyForAgent">
    **Stare**: `formatInboundEnvelope(...)` (i
    `ChannelMessageForAgent.channelEnvelope`) do budowania płaskiej koperty promptu
    w tekście zwykłym z przychodzących wiadomości kanału.

    **Nowe**: `BodyForAgent` oraz ustrukturyzowane bloki kontekstu użytkownika. Pluginy kanałów
    dołączają metadane routingu (wątek, temat, odpowiedź-do, reakcje) jako
    typowane pola zamiast konkatenować je w string promptu. Pomocnik
    `formatAgentEnvelope(...)` jest nadal wspierany dla syntetyzowanych
    kopert skierowanych do asystenta, ale przychodzące koperty w tekście zwykłym są
    wycofywane.

    Obszary objęte zmianą: `inbound_claim`, `message_received` i każdy niestandardowy
    Plugin kanału, który przetwarzał tekst `channelEnvelope` po fakcie.

  </Accordion>

  <Accordion title="Typy discovery providerów → typy katalogu providerów">
    Cztery aliasy typów discovery są teraz cienkimi wrapperami nad
    typami z epoki katalogu:

    | Stary alias               | Nowy typ                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Do tego starszy statyczny zbiór `ProviderCapabilities` - Pluginy providerów
    powinny używać jawnych hooków providera, takich jak `buildReplayPolicy`,
    `normalizeToolSchemas` i `wrapStreamFn`, zamiast statycznego obiektu.

  </Accordion>

  <Accordion title="Hooki polityki thinking → resolveThinkingProfile">
    **Stare** (trzy osobne hooki w `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` i
    `resolveDefaultThinkingLevel(ctx)`.

    **Nowe**: pojedyncze `resolveThinkingProfile(ctx)`, które zwraca
    `ProviderThinkingProfile` z kanonicznym `id`, opcjonalnym `label` i
    rankingowaną listą poziomów. OpenClaw automatycznie obniża nieaktualne zapisane wartości według
    rankingu profilu.

    Zaimplementuj jeden hook zamiast trzech. Starsze hooki nadal działają w trakcie
    okna wycofania, ale nie są komponowane z wynikiem profilu.

  </Accordion>

  <Accordion title="Fallback zewnętrznego providera OAuth → contracts.externalAuthProviders">
    **Stare**: implementowanie `resolveExternalOAuthProfiles(...)` bez
    deklarowania providera w manifeście Pluginu.

    **Nowe**: zadeklaruj `contracts.externalAuthProviders` w manifeście Pluginu
    **oraz** zaimplementuj `resolveExternalAuthProfiles(...)`. Stara ścieżka
    "fallback auth" emituje ostrzeżenie w runtime i zostanie usunięta.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Wyszukiwanie zmiennych środowiskowych providera → setup.providers[].envVars">
    **Stare** pole manifestu: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nowe**: odzwierciedl to samo wyszukiwanie zmiennych środowiskowych w `setup.providers[].envVars`
    w manifeście. Konsoliduje to metadane środowiska setup/status w jednym
    miejscu i pozwala uniknąć uruchamiania runtime Pluginu tylko po to, aby odpowiedzieć na
    zapytania o zmienne środowiskowe.

    `providerAuthEnvVars` pozostaje wspierane przez adapter zgodności
    do zamknięcia okna wycofania.

  </Accordion>

  <Accordion title="Rejestracja Pluginu pamięci → registerMemoryCapability">
    **Stare**: trzy osobne wywołania -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nowe**: jedno wywołanie w API stanu pamięci -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Te same sloty, pojedyncze wywołanie rejestrujące. Addytywne pomocniki pamięci
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) nie są objęte zmianą.

  </Accordion>

  <Accordion title="Zmienione nazwy typów wiadomości sesji subagenta">
    Dwa starsze aliasy typów nadal eksportowane z `src/plugins/runtime/types.ts`:

    | Stare                         | Nowe                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Metoda runtime `readSession` jest przestarzała na rzecz
    `getSessionMessages`. Ta sama sygnatura; stara metoda przekazuje wywołanie do
    nowej.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Stare**: `runtime.tasks.flow` (liczba pojedyncza) zwracało aktywny accessor task-flow.

    **Nowe**: `runtime.tasks.managedFlows` zachowuje zarządzany runtime mutacji TaskFlow
    dla Pluginów, które tworzą, aktualizują, anulują lub uruchamiają zadania potomne z
    flow. Użyj `runtime.tasks.flows`, gdy Plugin potrzebuje tylko odczytów opartych na DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Fabryki osadzonych rozszerzeń → middleware wyników narzędzi agenta">
    Omówione w sekcji "Jak migrować → Migruj rozszerzenia wyników narzędzi Pi do
    middleware" powyżej. Uwzględnione tutaj dla kompletności: usunięta ścieżka tylko dla Pi
    `api.registerEmbeddedExtensionFactory(...)` jest zastąpiona przez
    `api.registerAgentToolResultMiddleware(...)` z jawną listą runtime
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
Wycofania na poziomie rozszerzeń (wewnątrz wbudowanych Pluginów kanałów/providerów pod
`extensions/`) są śledzone w ich własnych barrelach `api.ts` i `runtime-api.ts`.
Nie wpływają na kontrakty Pluginów zewnętrznych i nie są tutaj wymienione.
Jeśli konsumujesz lokalny barrel wbudowanego Pluginu bezpośrednio, przed aktualizacją przeczytaj
komentarze o wycofaniu w tym barrelu.
</Note>

## Harmonogram usunięcia

| Kiedy                  | Co się dzieje                                                          |
| ---------------------- | ----------------------------------------------------------------------- |
| **Teraz**              | Przestarzałe powierzchnie emitują ostrzeżenia runtime                   |
| **Następne wydanie główne** | Przestarzałe powierzchnie zostaną usunięte; Pluginy nadal ich używające zakończą się błędem |

Wszystkie podstawowe Pluginy zostały już zmigrowane. Pluginy zewnętrzne powinny zmigrować
przed następnym wydaniem głównym.

## Tymczasowe wyciszanie ostrzeżeń

Ustaw te zmienne środowiskowe podczas pracy nad migracją:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

To tymczasowa furtka, a nie trwałe rozwiązanie.

## Powiązane

- [Pierwsze kroki](/pl/plugins/building-plugins) - zbuduj swój pierwszy Plugin
- [Przegląd SDK](/pl/plugins/sdk-overview) - pełna referencja importów podścieżek
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) - budowanie Pluginów kanałów
- [Pluginy providerów](/pl/plugins/sdk-provider-plugins) - budowanie Pluginów providerów
- [Wewnętrzna architektura Pluginów](/pl/plugins/architecture) - szczegółowe omówienie architektury
- [Manifest Pluginu](/pl/plugins/manifest) - referencja schematu manifestu
