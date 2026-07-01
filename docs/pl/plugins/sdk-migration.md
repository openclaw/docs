---
read_when:
    - Widzisz ostrzeżenie OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Widzisz ostrzeżenie OPENCLAW_EXTENSION_API_DEPRECATED
    - Użyto api.registerEmbeddedExtensionFactory przed OpenClaw 2026.4.25
    - Aktualizujesz Plugin, aby korzystał z nowoczesnej architektury Plugin
    - Utrzymujesz zewnętrzny Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Migruj ze starszej warstwy zgodności wstecznej do nowoczesnego SDK Plugin
title: Migracja Plugin SDK
x-i18n:
    generated_at: "2026-07-01T13:24:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9f6f9b4334ca3bdbcc6602cfe2bb1499d5758de95a9163e0ef75619a712a1c3
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw przeszedł z szerokiej warstwy zgodności wstecznej na nowoczesną
architekturę Plugin z ukierunkowanymi, udokumentowanymi importami. Jeśli Twój
Plugin został zbudowany przed nową architekturą, ten przewodnik pomoże Ci go
zmigrować.

## Co się zmienia

Stary system Plugin udostępniał dwie bardzo szerokie powierzchnie, które
pozwalały Pluginom importować wszystko, czego potrzebowały, z jednego punktu
wejścia:

- **`openclaw/plugin-sdk/compat`** - pojedynczy import, który reeksportował
  dziesiątki helperów. Wprowadzono go, aby starsze Pluginy oparte na hookach
  działały podczas budowy nowej architektury Plugin.
- **`openclaw/plugin-sdk/infra-runtime`** - szeroki barrel helperów runtime,
  który mieszał zdarzenia systemowe, stan heartbeat, kolejki dostarczania,
  helpery fetch/proxy, helpery plików, typy zatwierdzeń i niepowiązane narzędzia.
- **`openclaw/plugin-sdk/config-runtime`** - szeroki barrel zgodności konfiguracji,
  który nadal przenosi przestarzałe bezpośrednie helpery ładowania/zapisu w oknie
  migracji.
- **`openclaw/extension-api`** - most, który dawał Pluginom bezpośredni dostęp do
  helperów po stronie hosta, takich jak osadzony runner agenta.
- **`api.registerEmbeddedExtensionFactory(...)`** - usunięty hook bundled
  extension przeznaczony tylko dla osadzonego runnera, który mógł obserwować
  zdarzenia osadzonego runnera, takie jak `tool_result`.

Szerokie powierzchnie importu są teraz **przestarzałe**. Nadal działają w runtime,
ale nowe Pluginy nie mogą ich używać, a istniejące Pluginy powinny zmigrować
przed następnym wydaniem głównym, które je usunie. API rejestracji fabryki
rozszerzeń przeznaczone wyłącznie dla osadzonego runnera zostało usunięte; użyj
zamiast tego middleware wyników narzędzi.

OpenClaw nie usuwa ani nie reinterpretuje udokumentowanego zachowania Plugin w tej
samej zmianie, która wprowadza zamiennik. Zmiany łamiące kontrakt muszą najpierw
przejść przez adapter zgodności, diagnostykę, dokumentację i okno deprecjacji.
Dotyczy to importów SDK, pól manifestu, API konfiguracji, hooków i zachowania
rejestracji runtime.

<Warning>
  Warstwa zgodności wstecznej zostanie usunięta w przyszłym wydaniu głównym.
  Pluginy, które nadal importują z tych powierzchni, przestaną wtedy działać.
  Starsze rejestracje fabryk osadzonych rozszerzeń już się nie ładują.
</Warning>

## Dlaczego to zmieniono

Stare podejście powodowało problemy:

- **Powolne uruchamianie** - import jednego helpera ładował dziesiątki
  niepowiązanych modułów
- **Zależności cykliczne** - szerokie reeksporty ułatwiały tworzenie cykli importu
- **Niejasna powierzchnia API** - nie dało się rozpoznać, które eksporty były
  stabilne, a które wewnętrzne

Nowoczesny SDK Plugin rozwiązuje ten problem: każda ścieżka importu
(`openclaw/plugin-sdk/\<subpath\>`) jest małym, samodzielnym modułem o jasnym celu
i udokumentowanym kontrakcie.

Starsze wygodne seams dostawców dla bundled channels również zostały usunięte.
Helper seams oznaczone marką kanału były prywatnymi skrótami monorepo, a nie
stabilnymi kontraktami Plugin. Używaj zamiast tego wąskich, ogólnych podścieżek
SDK. W bundled plugin workspace trzymaj helpery należące do dostawcy we własnym
`api.ts` lub `runtime-api.ts` tego Plugin.

Aktualne przykłady bundled provider:

- Anthropic trzyma helpery strumieni specyficzne dla Claude we własnym seam
  `api.ts` / `contract-api.ts`
- OpenAI trzyma buildery dostawcy, helpery modeli domyślnych i buildery
  dostawcy realtime we własnym `api.ts`
- OpenRouter trzyma builder dostawcy oraz helpery onboardingu/konfiguracji we
  własnym `api.ts`

## Plan migracji Talk i głosu w czasie rzeczywistym

Kod głosu w czasie rzeczywistym, telefonii, spotkań i przeglądarkowego Talk
przechodzi z lokalnego dla powierzchni księgowania tur na współdzielony kontroler
sesji Talk eksportowany przez `openclaw/plugin-sdk/realtime-voice`. Nowy kontroler
posiada wspólną kopertę zdarzeń Talk, stan aktywnej tury, stan przechwytywania,
stan dźwięku wyjściowego, historię ostatnich zdarzeń i odrzucanie przestarzałych
tur. Pluginy dostawców powinny nadal posiadać sesje realtime specyficzne dla
dostawcy; Pluginy powierzchni powinny nadal posiadać szczegóły przechwytywania,
odtwarzania, telefonii i spotkań.

Ta migracja Talk jest celowo czystą zmianą łamiącą:

1. Zachowaj współdzielony kontroler/prymitywy runtime w
   `plugin-sdk/realtime-voice`.
2. Przenieś bundled surfaces na współdzielony kontroler: przekaźnik
   przeglądarkowy, przekazanie managed-room, realtime voice-call, streaming STT
   voice-call, Google Meet realtime i natywny push-to-talk.
3. Zastąp stare rodziny RPC Talk finalnym API `talk.session.*` i
   `talk.client.*`.
4. Ogłoś jeden żywy kanał zdarzeń Talk w Gateway
   `hello-ok.features.events`: `talk.event`.
5. Usuń stary endpoint HTTP realtime i każdą ścieżkę nadpisywania instrukcji w
   czasie żądania.

Nowy kod nie powinien wywoływać `createTalkEventSequencer(...)` bezpośrednio,
chyba że implementuje niskopoziomowy adapter lub fixture testowy. Preferuj
współdzielony kontroler, aby zdarzenia w zakresie tury nie mogły być emitowane
bez identyfikatora tury, przestarzałe wywołania `turnEnd` / `turnCancel` nie
mogły czyścić nowszej aktywnej tury, a zdarzenia cyklu życia dźwięku wyjściowego
pozostawały spójne w telefonii, spotkaniach, przekaźniku przeglądarkowym,
przekazaniu managed-room i natywnych klientach Talk.

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
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Sesje WebRTC/provider-websocket należące do przeglądarki używają
`talk.client.create`, ponieważ przeglądarka posiada negocjację dostawcy i
transport mediów, podczas gdy Gateway posiada poświadczenia, instrukcje i politykę
narzędzi. `talk.session.*` jest wspólną powierzchnią zarządzaną przez Gateway dla
realtime gateway-relay, transkrypcji gateway-relay oraz sesji natywnego STT/TTS
managed-room.

Starsze konfiguracje, które umieszczały selektory realtime obok `talk.provider` /
`talk.providers`, powinny zostać naprawione przez `openclaw doctor --fix`; runtime
Talk nie reinterpretuje konfiguracji dostawcy speech/TTS jako konfiguracji
dostawcy realtime.

Obsługiwane kombinacje `talk.session.create` są celowo niewielkie:

| Tryb            | Transport       | Brain           | Właściciel              | Uwagi                                                                                                                    |
| --------------- | --------------- | --------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway                 | Pełnodupleksowy dźwięk dostawcy mostkowany przez Gateway; wywołania narzędzi są routowane przez narzędzie agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway                 | Tylko streaming STT; wywołujący wysyłają dźwięk wejściowy i odbierają zdarzenia transkrypcji.                            |
| `stt-tts`       | `managed-room`  | `agent-consult` | Natywny/pokój klienta   | Pokoje w stylu push-to-talk i walkie-talkie, w których klient posiada przechwytywanie/odtwarzanie, a Gateway posiada stan tury. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Natywny/pokój klienta   | Tryb pokoju tylko dla administratorów, dla zaufanych powierzchni first-party, które wykonują akcje narzędzi Gateway bezpośrednio. |

Mapa usuniętych metod:

| Stare                            | Nowe                                                     |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` or `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

Ujednolicony słownik sterowania jest również celowo wąski:

  | Metoda                          | Dotyczy                                                 | Kontrakt                                                                                                                                                                                |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Dołącz fragment audio PCM w base64 do sesji dostawcy należącej do tego samego połączenia Gateway.                                                                                       |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Rozpocznij turę użytkownika w zarządzanym pokoju.                                                                                                                                        |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Zakończ aktywną turę po walidacji nieaktualnej tury.                                                                                                                                     |
  | `talk.session.cancelTurn`       | wszystkie sesje należące do Gateway                     | Anuluj aktywne przechwytywanie, pracę dostawcy, agenta i TTS dla tury.                                                                                                                   |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Zatrzymaj wyjście audio asystenta bez koniecznego kończenia tury użytkownika.                                                                                                            |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Ukończ wywołanie narzędzia dostawcy wyemitowane przez przekaźnik; przekaż `options.willContinue` dla wyjścia tymczasowego albo `options.suppressResponse`, aby spełnić wywołanie bez kolejnej odpowiedzi asystenta. |
  | `talk.session.steer`            | sesje Talk oparte na agencie                            | Wyślij mówioną kontrolę `status`, `steer`, `cancel` lub `followup` do aktywnego osadzonego uruchomienia rozwiązanego z sesji Talk.                                                       |
  | `talk.session.close`            | wszystkie ujednolicone sesje                            | Zatrzymaj sesje przekaźnika lub unieważnij stan zarządzanego pokoju, a następnie zapomnij ujednolicony identyfikator sesji.                                                              |

  Nie wprowadzaj w rdzeniu przypadków specjalnych dostawcy ani platformy, aby to działało.
  Rdzeń odpowiada za semantykę sesji Talk. Pluginy dostawców odpowiadają za konfigurację sesji dostawców.
  Połączenia głosowe i Google Meet odpowiadają za adaptery telefonii i spotkań. Przeglądarka i aplikacje natywne
  odpowiadają za UX przechwytywania i odtwarzania na urządzeniu.

  ## Zasady zgodności

  W przypadku zewnętrznych pluginów prace nad zgodnością odbywają się w tej kolejności:

  1. dodaj nowy kontrakt
  2. zachowaj stare zachowanie podłączone przez adapter zgodności
  3. wyemituj diagnostykę lub ostrzeżenie nazywające starą ścieżkę i zamiennik
  4. obejmij testami obie ścieżki
  5. udokumentuj wycofanie oraz ścieżkę migracji
  6. usuń dopiero po ogłoszonym oknie migracji, zwykle w wydaniu głównym

  Opiekunowie mogą audytować bieżącą kolejkę migracji za pomocą
  `pnpm plugins:boundary-report`. Użyj `pnpm plugins:boundary-report:summary` do
  zwięzłych liczników, `--owner <id>` dla jednego pluginu lub właściciela zgodności oraz
  `pnpm plugins:boundary-report:ci`, gdy bramka CI powinna kończyć się niepowodzeniem przy zaległych
  rekordach zgodności, zarezerwowanych importach SDK między właścicielami albo nieużywanych zarezerwowanych
  podścieżkach SDK. Raport grupuje przestarzałe
  rekordy zgodności według daty usunięcia, zlicza lokalne odwołania w kodzie i dokumentacji,
  ujawnia zarezerwowane importy SDK między właścicielami oraz podsumowuje prywatny
  most SDK hosta pamięci, aby porządkowanie zgodności pozostawało jawne zamiast
  opierać się na doraźnych wyszukiwaniach. Zarezerwowane podścieżki SDK muszą mieć śledzone użycie właściciela;
  nieużywane zarezerwowane eksporty pomocnicze należy usunąć z publicznego SDK.

  Jeśli pole manifestu nadal jest akceptowane, autorzy pluginów mogą dalej go używać, dopóki
  dokumentacja i diagnostyka nie powiedzą inaczej. Nowy kod powinien preferować udokumentowany
  zamiennik, ale istniejące pluginy nie powinny psuć się podczas zwykłych wydań
  pomocniczych.

  ## Jak migrować

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Bundlowane pluginy powinny przestać wywoływać bezpośrednio
    `api.runtime.config.loadConfig()` oraz
    `api.runtime.config.writeConfigFile(...)`. Preferuj konfigurację, która została
    już przekazana do aktywnej ścieżki wywołania. Długotrwałe handlery, które potrzebują
    bieżącej migawki procesu, mogą używać `api.runtime.config.current()`. Długotrwałe
    narzędzia agenta powinny używać `ctx.getRuntimeConfig()` z kontekstu narzędzia wewnątrz
    `execute`, aby narzędzie utworzone przed zapisem konfiguracji nadal widziało odświeżoną
    konfigurację runtime.

    Zapisy konfiguracji muszą przechodzić przez transakcyjne helpery i wybierać
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
    że zmiana wymaga czystego restartu gateway, oraz
    `afterWrite: { mode: "none", reason: "..." }` tylko wtedy, gdy wywołujący odpowiada za
    dalsze działania i celowo chce wyciszyć planer przeładowania.
    Wyniki mutacji zawierają typowane podsumowanie `followUp` dla testów i logowania;
    gateway pozostaje odpowiedzialny za zastosowanie lub zaplanowanie restartu.
    `loadConfig` i `writeConfigFile` pozostają przestarzałymi helperami zgodności
    dla zewnętrznych pluginów w oknie migracji i ostrzegają raz z kodem zgodności
    `runtime-config-load-write`. Bundlowane pluginy i kod runtime repozytorium
    są chronione przez bariery skanera w
    `pnpm check:deprecated-api-usage` oraz
    `pnpm check:no-runtime-action-load-config`: nowe użycie w produkcyjnym pluginie
    kończy się od razu niepowodzeniem, bezpośrednie zapisy konfiguracji kończą się niepowodzeniem,
    metody serwera gateway muszą używać migawki runtime żądania, helpery wysyłania, akcji i klienta
    kanału runtime muszą otrzymywać konfigurację ze swojej granicy, a długotrwałe moduły runtime mają
    zero dozwolonych ambientowych wywołań `loadConfig()`.

    Nowy kod pluginu powinien też unikać importowania szerokiej beczki zgodności
    `openclaw/plugin-sdk/config-runtime`. Użyj wąskiej
    podścieżki SDK pasującej do zadania:

    | Potrzeba | Import |
    | --- | --- |
    | Typy konfiguracji, takie jak `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Asercje już wczytanej konfiguracji i wyszukiwanie konfiguracji wejścia pluginu | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Odczyty bieżącej migawki runtime | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Zapisy konfiguracji | `openclaw/plugin-sdk/config-mutation` |
    | Helpery magazynu sesji | `openclaw/plugin-sdk/session-store-runtime` |
    | Konfiguracja tabel Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helpery runtime polityki grup | `openclaw/plugin-sdk/runtime-group-policy` |
    | Rozwiązywanie wejścia sekretu | `openclaw/plugin-sdk/secret-input-runtime` |
    | Nadpisania modelu/sesji | `openclaw/plugin-sdk/model-session-runtime` |

    Bundlowane pluginy i ich testy są chronione skanerem przed szeroką
    beczką, aby importy i mocki pozostawały lokalne względem potrzebnego zachowania. Szeroka
    beczka nadal istnieje dla zgodności zewnętrznej, ale nowy kod nie powinien
    od niej zależeć.

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    Bundlowane pluginy muszą zastąpić obsługę wyników narzędzi
    `api.registerEmbeddedExtensionFactory(...)`, ograniczoną tylko do embedded-runnera,
    neutralnym względem runtime middleware.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Jednocześnie zaktualizuj manifest pluginu:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Zainstalowane pluginy mogą także rejestrować middleware wyników narzędzi, gdy są
    jawnie włączone i deklarują każdy docelowy runtime w
    `contracts.agentToolResultMiddleware`. Niezadeklarowane rejestracje zainstalowanego middleware
    są odrzucane.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Pluginy kanałów obsługujące zatwierdzenia ujawniają teraz natywne zachowanie zatwierdzania przez
    `approvalCapability.nativeRuntime` oraz współdzielony rejestr kontekstu runtime.

    Kluczowe zmiany:

    - Zastąp `approvalCapability.handler.loadRuntime(...)` przez
      `approvalCapability.nativeRuntime`
    - Przenieś specyficzne dla zatwierdzeń uwierzytelnianie i dostarczanie z dawnego okablowania `plugin.auth` /
      `plugin.approvals` do `approvalCapability`
    - `ChannelPlugin.approvals` zostało usunięte z publicznego kontraktu pluginu kanału;
      przenieś pola delivery/native/render do `approvalCapability`
    - `plugin.auth` pozostaje tylko dla przepływów logowania/wylogowania kanału; hooki uwierzytelniania
      zatwierdzeń w tym miejscu nie są już odczytywane przez rdzeń
    - Rejestruj obiekty runtime należące do kanału, takie jak klienty, tokeny lub aplikacje Bolt,
      przez `openclaw/plugin-sdk/channel-runtime-context`
    - Nie wysyłaj powiadomień o przekierowaniu należących do pluginu z natywnych handlerów zatwierdzeń;
      rdzeń odpowiada teraz za powiadomienia o przekierowaniu gdzie indziej wynikające z rzeczywistych rezultatów dostarczania
    - Podczas przekazywania `channelRuntime` do `createChannelManager(...)` podaj
      rzeczywistą powierzchnię `createPluginRuntime().channel`. Częściowe stuby są odrzucane.

    Zobacz `/plugins/sdk-channel-plugins`, aby poznać bieżący układ możliwości zatwierdzania.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Jeśli Twój plugin używa `openclaw/plugin-sdk/windows-spawn`, nierozwiązane wrappery Windows
    `.cmd`/`.bat` kończą się teraz niepowodzeniem w trybie fail-closed, chyba że jawnie przekażesz
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

    Jeśli Twój wywołujący nie polega celowo na fallbacku powłoki, nie ustawiaj
    `allowShellFallback` i zamiast tego obsłuż rzucony błąd.

  </Step>

  <Step title="Find deprecated imports">
    Wyszukaj w swoim pluginie importy z którejkolwiek przestarzałej powierzchni:

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
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Ten sam wzorzec dotyczy innych starszych pomocniczych funkcji mostka:

    | Stary import | Nowoczesny odpowiednik |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | pomocnicze funkcje magazynu sesji | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Zastąp szerokie importy infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` nadal istnieje dla zgodności
    zewnętrznej, ale nowy kod powinien importować ukierunkowaną powierzchnię
    pomocniczą, której faktycznie potrzebuje:

    | Potrzeba | Import |
    | --- | --- |
    | Pomocnicze funkcje kolejki zdarzeń systemowych | `openclaw/plugin-sdk/system-event-runtime` |
    | Pomocnicze funkcje wybudzania, zdarzeń i widoczności Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Opróżnianie kolejki oczekujących dostarczeń | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetria aktywności kanału | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Pamięci podręczne deduplikacji w pamięci | `openclaw/plugin-sdk/dedupe-runtime` |
    | Bezpieczne pomocnicze funkcje ścieżek lokalnych plików/multimediów | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch świadomy dyspozytora | `openclaw/plugin-sdk/runtime-fetch` |
    | Pomocnicze funkcje proxy i chronionego fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Typy zasad dyspozytora SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typy żądania/rozstrzygnięcia zatwierdzenia | `openclaw/plugin-sdk/approval-runtime` |
    | Pomocnicze funkcje ładunku odpowiedzi zatwierdzenia i poleceń | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Pomocnicze funkcje formatowania błędów | `openclaw/plugin-sdk/error-runtime` |
    | Oczekiwanie na gotowość transportu | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Pomocnicze funkcje bezpiecznych tokenów | `openclaw/plugin-sdk/secure-random-runtime` |
    | Ograniczona współbieżność zadań asynchronicznych | `openclaw/plugin-sdk/concurrency-runtime` |
    | Koercja liczbowa | `openclaw/plugin-sdk/number-runtime` |
    | Lokalna dla procesu blokada asynchroniczna | `openclaw/plugin-sdk/async-lock-runtime` |
    | Blokady plików | `openclaw/plugin-sdk/file-lock` |

    Dołączone pluginy są chronione skanerem przed `infra-runtime`, więc kod
    repozytorium nie może cofnąć się do szerokiego barrel.

  </Step>

  <Step title="Migruj pomocnicze funkcje tras kanałów">
    Nowy kod tras kanałów powinien używać `openclaw/plugin-sdk/channel-route`.
    Starsze nazwy route-key i comparable-target pozostają aliasami zgodności
    w okresie migracji, ale nowe pluginy powinny używać nazw tras, które
    bezpośrednio opisują zachowanie:

    | Stara funkcja pomocnicza | Nowoczesna funkcja pomocnicza |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Nowoczesne pomocnicze funkcje tras spójnie normalizują `{ channel, to, accountId, threadId }`
    w natywnych zatwierdzeniach, tłumieniu odpowiedzi, deduplikacji przychodzącej,
    dostarczaniu Cron i trasowaniu sesji.

    Nie dodawaj nowych użyć `ChannelMessagingAdapter.parseExplicitTarget` ani
    pomocniczych funkcji załadowanych tras opartych na parserze (`parseExplicitTargetForLoadedChannel`
    lub `resolveRouteTargetForLoadedChannel`) ani
    `resolveChannelRouteTargetWithParser(...)` z `plugin-sdk/channel-route`.
    Te haki są przestarzałe i pozostają tylko dla starszych pluginów w okresie
    migracji. Nowe pluginy kanałów powinny używać
    `messaging.targetResolver.resolveTarget(...)` do normalizacji identyfikatora celu
    i awaryjnej obsługi braku w katalogu, `messaging.inferTargetChatType(...)`, gdy core
    potrzebuje wczesnego rodzaju peera, oraz `messaging.resolveOutboundSessionRoute(...)`
    dla natywnej dla dostawcy sesji i tożsamości wątku.

  </Step>

  <Step title="Zbuduj i przetestuj">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Odniesienie do ścieżek importu

  <Accordion title="Common import path table">
  | Ścieżka importu | Cel | Kluczowe eksporty |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanoniczny pomocnik wejścia wtyczki | `definePluginEntry` |
  | `plugin-sdk/core` | Starszy zbiorczy reeksport definicji/konstruktorów wejść kanałów | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Eksport głównego schematu konfiguracji | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Pomocnik wejścia pojedynczego dostawcy | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Wyspecjalizowane definicje wejść kanałów i konstruktory | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Wspólne pomocniki kreatora konfiguracji | Translator konfiguracji, monity listy dozwolonych, konstruktory statusu konfiguracji |
  | `plugin-sdk/setup-runtime` | Pomocniki środowiska uruchomieniowego podczas konfiguracji | `createSetupTranslator`, bezpieczne do importu adaptery poprawek konfiguracji, pomocniki notatek wyszukiwania, `promptResolvedAllowFrom`, `splitSetupEntries`, delegowane proxy konfiguracji |
  | `plugin-sdk/setup-adapter-runtime` | Przestarzały alias adaptera konfiguracji | Użyj `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Pomocniki narzędzi konfiguracji | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Pomocniki wielu kont | Pomocniki listy kont/konfiguracji/bramki akcji |
  | `plugin-sdk/account-id` | Pomocniki identyfikatora konta | `DEFAULT_ACCOUNT_ID`, normalizacja identyfikatora konta |
  | `plugin-sdk/account-resolution` | Pomocniki wyszukiwania kont | Pomocniki wyszukiwania kont i domyślnego rozwiązania awaryjnego |
  | `plugin-sdk/account-helpers` | Wąskie pomocniki kont | Pomocniki listy kont/akcji konta |
  | `plugin-sdk/channel-setup` | Adaptery kreatora konfiguracji | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Prymitywy parowania DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Prefiks odpowiedzi, pisanie i okablowanie dostarczania źródeł | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabryki adapterów konfiguracji i pomocniki dostępu DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Konstruktory schematów konfiguracji | Tylko współdzielone prymitywy schematu konfiguracji kanału i ogólny konstruktor |
  | `plugin-sdk/bundled-channel-config-schema` | Dołączone schematy konfiguracji | Tylko dołączone wtyczki utrzymywane przez OpenClaw; nowe wtyczki muszą definiować schematy lokalne dla wtyczki |
  | `plugin-sdk/channel-config-schema-legacy` | Przestarzałe dołączone schematy konfiguracji | Tylko alias zgodności; użyj `plugin-sdk/bundled-channel-config-schema` dla utrzymywanych dołączonych wtyczek |
  | `plugin-sdk/telegram-command-config` | Pomocniki konfiguracji poleceń Telegram | Normalizacja nazw poleceń, przycinanie opisów, walidacja duplikatów/konfliktów |
  | `plugin-sdk/channel-policy` | Rozstrzyganie zasad grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Przestarzała fasada zgodności | Użyj `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Pomocniki kopert przychodzących | Wspólne pomocniki tras i konstruktora kopert |
  | `plugin-sdk/channel-inbound` | Pomocniki odbioru przychodzącego | Budowanie kontekstu, formatowanie, katalogi główne, uruchamiacze, przygotowana wysyłka odpowiedzi i predykaty wysyłki |
  | `plugin-sdk/messaging-targets` | Przestarzała ścieżka importu parsowania celu | Użyj `plugin-sdk/channel-targets` dla ogólnych pomocników parsowania celu, `plugin-sdk/channel-route` do porównywania tras oraz należących do wtyczki `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` do rozstrzygania celów specyficznych dla dostawcy |
  | `plugin-sdk/outbound-media` | Pomocniki multimediów wychodzących | Wspólne ładowanie multimediów wychodzących |
  | `plugin-sdk/outbound-send-deps` | Przestarzała fasada zgodności | Użyj `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Pomocniki cyklu życia wiadomości wychodzących | Adaptery wiadomości, potwierdzenia, pomocniki trwałego wysyłania, pomocniki podglądu na żywo/strumieniowania, opcje odpowiedzi, pomocniki cyklu życia, tożsamość wychodząca i planowanie ładunku |
  | `plugin-sdk/channel-streaming` | Przestarzała fasada zgodności | Użyj `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Przestarzała fasada zgodności | Użyj `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Pomocniki wiązania wątków | Pomocniki cyklu życia wiązania wątków i adapterów |
  | `plugin-sdk/agent-media-payload` | Starsze pomocniki ładunku multimediów | Konstruktor ładunku multimediów agenta dla starszych układów pól |
  | `plugin-sdk/channel-runtime` | Przestarzała podkładka zgodności | Tylko starsze narzędzia środowiska uruchomieniowego kanałów |
  | `plugin-sdk/channel-send-result` | Typy wyników wysyłania | Typy wyników odpowiedzi |
  | `plugin-sdk/runtime-store` | Trwały magazyn wtyczek | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Szerokie pomocniki środowiska uruchomieniowego | Pomocniki środowiska uruchomieniowego/rejestrowania/kopii zapasowych/instalacji wtyczek |
  | `plugin-sdk/runtime-env` | Wąskie pomocniki środowiska środowiska uruchomieniowego | Pomocniki rejestratora/środowiska uruchomieniowego, limitu czasu, ponawiania i wycofywania |
  | `plugin-sdk/plugin-runtime` | Wspólne pomocniki środowiska uruchomieniowego wtyczek | Pomocniki poleceń/haków/http/interaktywne wtyczek |
  | `plugin-sdk/hook-runtime` | Pomocniki potoku haków | Wspólne pomocniki potoku Webhook/wewnętrznych haków |
  | `plugin-sdk/lazy-runtime` | Pomocniki leniwego środowiska uruchomieniowego | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Pomocniki procesów | Wspólne pomocniki wykonywania |
  | `plugin-sdk/cli-runtime` | Pomocniki środowiska uruchomieniowego CLI | Formatowanie poleceń, oczekiwania, pomocniki wersji |
  | `plugin-sdk/gateway-runtime` | Pomocniki Gateway | Klient Gateway, pomocnik uruchamiania gotowego na pętlę zdarzeń, rozstrzyganie ogłaszanego hosta LAN i pomocniki poprawek statusu kanału |
  | `plugin-sdk/config-runtime` | Przestarzała podkładka zgodności konfiguracji | Preferuj `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` i `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Pomocniki poleceń Telegram | Stabilne awaryjnie pomocniki walidacji poleceń Telegram, gdy dołączona powierzchnia kontraktu Telegram jest niedostępna |
  | `plugin-sdk/approval-runtime` | Pomocniki monitu zatwierdzania | Ładunek zatwierdzania wykonania/wtyczki, pomocniki możliwości/profilu zatwierdzania, natywne pomocniki trasowania/środowiska uruchomieniowego zatwierdzania oraz formatowanie ścieżki wyświetlania ustrukturyzowanego zatwierdzania |
  | `plugin-sdk/approval-auth-runtime` | Pomocniki autoryzacji zatwierdzania | Rozstrzyganie zatwierdzającego, autoryzacja akcji w tym samym czacie |
  | `plugin-sdk/approval-client-runtime` | Pomocniki klienta zatwierdzania | Natywne pomocniki profilu/filtra zatwierdzania wykonania |
  | `plugin-sdk/approval-delivery-runtime` | Pomocniki dostarczania zatwierdzania | Natywne adaptery możliwości/dostarczania zatwierdzania |
  | `plugin-sdk/approval-gateway-runtime` | Pomocniki Gateway zatwierdzania | Wspólny pomocnik rozstrzygania Gateway zatwierdzania |
  | `plugin-sdk/approval-handler-adapter-runtime` | Pomocniki adaptera zatwierdzania | Lekkie pomocniki ładowania natywnego adaptera zatwierdzania dla gorących punktów wejścia kanału |
  | `plugin-sdk/approval-handler-runtime` | Pomocniki procedury obsługi zatwierdzania | Szersze pomocniki środowiska uruchomieniowego procedury obsługi zatwierdzania; preferuj węższe styki adaptera/Gateway, gdy wystarczają |
  | `plugin-sdk/approval-native-runtime` | Pomocniki celu zatwierdzania | Natywne pomocniki wiązania celu/konta zatwierdzania |
  | `plugin-sdk/approval-reply-runtime` | Pomocniki odpowiedzi zatwierdzania | Pomocniki ładunku odpowiedzi zatwierdzania wykonania/wtyczki |
  | `plugin-sdk/channel-runtime-context` | Pomocniki kontekstu środowiska uruchomieniowego kanału | Ogólne pomocniki rejestrowania/pobierania/obserwowania kontekstu środowiska uruchomieniowego kanału |
  | `plugin-sdk/security-runtime` | Pomocniki bezpieczeństwa | Wspólne pomocniki zaufania, bramkowania DM, plików/ścieżek ograniczonych do katalogu głównego, treści zewnętrznych i zbierania sekretów |
  | `plugin-sdk/ssrf-policy` | Pomocniki zasad SSRF | Pomocniki listy dozwolonych hostów i zasad sieci prywatnej |
  | `plugin-sdk/ssrf-runtime` | Pomocniki środowiska uruchomieniowego SSRF | Przypięty dyspozytor, chronione pobieranie, pomocniki zasad SSRF |
  | `plugin-sdk/system-event-runtime` | Pomocniki zdarzeń systemowych | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Pomocniki Heartbeat | Pomocniki wybudzania, zdarzeń i widoczności Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Pomocniki kolejki dostarczania | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Pomocniki aktywności kanału | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Pomocniki deduplikacji | Pamięci podręczne deduplikacji w pamięci |
  | `plugin-sdk/file-access-runtime` | Pomocniki dostępu do plików | Pomocniki bezpiecznych ścieżek lokalnych plików/multimediów |
  | `plugin-sdk/transport-ready-runtime` | Pomocniki gotowości transportu | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Pomocniki zasad zatwierdzania wykonywania | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Pomocniki ograniczonej pamięci podręcznej | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Pomocniki bramkowania diagnostyki | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Pomocniki formatowania błędów | `formatUncaughtError`, `isApprovalNotFoundError`, pomocniki grafu błędów |
  | `plugin-sdk/fetch-runtime` | Pomocniki opakowanego pobierania/proxy | `resolveFetch`, pomocniki proxy, pomocniki opcji EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Pomocniki normalizacji hosta | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Pomocniki ponawiania | `RetryConfig`, `retryAsync`, uruchamiacze zasad |
  | `plugin-sdk/allow-from` | Formatowanie listy dozwolonych i mapowanie danych wejściowych | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Pomocniki bramkowania poleceń i powierzchni poleceń | `resolveControlCommandGate`, pomocniki autoryzacji nadawcy, pomocniki rejestru poleceń, w tym formatowanie menu dynamicznych argumentów |
  | `plugin-sdk/command-status` | Renderery statusu/pomocy poleceń | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsowanie danych wejściowych sekretu | Pomocniki danych wejściowych sekretu |
  | `plugin-sdk/webhook-ingress` | Pomocniki żądań Webhook | Narzędzia celów Webhook |
  | `plugin-sdk/webhook-request-guards` | Pomocniki strażnika treści Webhook | Pomocniki odczytu/limitu treści żądania |
  | `plugin-sdk/reply-runtime` | Wspólne środowisko uruchomieniowe odpowiedzi | Wysyłka przychodząca, Heartbeat, planer odpowiedzi, dzielenie na fragmenty |
  | `plugin-sdk/reply-dispatch-runtime` | Wąskie pomocniki wysyłki odpowiedzi | Finalizacja, wysyłka dostawcy i pomocniki etykiet konwersacji |
  | `plugin-sdk/reply-history` | Pomocniki historii odpowiedzi | `createChannelHistoryWindow`; przestarzałe eksporty zgodności pomocników mapy, takie jak `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planowanie odwołań odpowiedzi | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Pomocniki fragmentów odpowiedzi | Pomocniki dzielenia tekstu/markdown na fragmenty |
  | `plugin-sdk/session-store-runtime` | Pomocniki magazynu sesji | Pomocniki ścieżki magazynu i czasu aktualizacji |
  | `plugin-sdk/state-paths` | Pomocniki ścieżek stanu | Pomocniki katalogów stanu i OAuth |
  | `plugin-sdk/routing` | Pomocniki routingu/klucza sesji | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, pomocniki normalizacji klucza sesji |
  | `plugin-sdk/status-helpers` | Pomocniki statusu kanału | Konstruktory podsumowań statusu kanału/konta, domyślne wartości stanu wykonawczego, pomocniki metadanych problemów |
  | `plugin-sdk/target-resolver-runtime` | Pomocniki rozpoznawania celu | Współdzielone pomocniki rozpoznawania celu |
  | `plugin-sdk/string-normalization-runtime` | Pomocniki normalizacji ciągów znaków | Pomocniki normalizacji slugów/ciągów znaków |
  | `plugin-sdk/request-url` | Pomocniki adresów URL żądań | Wyodrębnianie ciągów URL z danych wejściowych podobnych do żądań |
  | `plugin-sdk/run-command` | Pomocniki poleceń z limitem czasu | Uruchamianie poleceń z limitem czasu i znormalizowanym stdout/stderr |
  | `plugin-sdk/param-readers` | Czytniki parametrów | Wspólne czytniki parametrów narzędzi/CLI |
  | `plugin-sdk/tool-payload` | Wyodrębnianie ładunku narzędzia | Wyodrębnianie znormalizowanych ładunków z obiektów wyników narzędzi |
  | `plugin-sdk/tool-send` | Wyodrębnianie wysyłania narzędzia | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
  | `plugin-sdk/temp-path` | Pomocniki ścieżek tymczasowych | Współdzielone pomocniki ścieżek tymczasowego pobierania |
  | `plugin-sdk/logging-core` | Pomocniki logowania | Logger podsystemu i pomocniki redakcji |
  | `plugin-sdk/markdown-table-runtime` | Pomocniki tabel Markdown | Pomocniki trybu tabel Markdown |
  | `plugin-sdk/reply-payload` | Typy odpowiedzi wiadomości | Typy ładunków odpowiedzi |
  | `plugin-sdk/provider-setup` | Wyselekcjonowane pomocniki konfiguracji lokalnego/samodzielnie hostowanego dostawcy | Pomocniki wykrywania/konfiguracji samodzielnie hostowanego dostawcy |
  | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane pomocniki konfiguracji samodzielnie hostowanego dostawcy zgodnego z OpenAI | Te same pomocniki wykrywania/konfiguracji samodzielnie hostowanego dostawcy |
  | `plugin-sdk/provider-auth-runtime` | Pomocniki uwierzytelniania wykonawczego dostawcy | Pomocniki rozpoznawania kluczy API w czasie wykonania |
  | `plugin-sdk/provider-auth-api-key` | Pomocniki konfiguracji klucza API dostawcy | Pomocniki wdrażania i zapisu profilu dla kluczy API |
  | `plugin-sdk/provider-auth-result` | Pomocniki wyników uwierzytelniania dostawcy | Standardowy konstruktor wyników uwierzytelniania OAuth |
  | `plugin-sdk/provider-selection-runtime` | Pomocniki wyboru dostawcy | Wybór skonfigurowanego lub automatycznego dostawcy oraz scalanie surowej konfiguracji dostawcy |
  | `plugin-sdk/provider-env-vars` | Pomocniki zmiennych środowiskowych dostawcy | Pomocniki wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
  | `plugin-sdk/provider-model-shared` | Współdzielone pomocniki modeli/powtórek dostawcy | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory zasad powtórek, pomocniki endpointów dostawcy oraz pomocniki normalizacji identyfikatorów modeli |
  | `plugin-sdk/provider-catalog-shared` | Współdzielone pomocniki katalogu dostawcy | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Poprawki wdrażania dostawcy | Pomocniki konfiguracji wdrażania |
  | `plugin-sdk/provider-http` | Pomocniki HTTP dostawcy | Ogólne pomocniki funkcji HTTP/endpointów dostawcy, w tym pomocniki formularzy wieloczęściowych do transkrypcji audio |
  | `plugin-sdk/provider-web-fetch` | Pomocniki web-fetch dostawcy | Pomocniki rejestracji/pamięci podręcznej dostawcy web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Pomocniki konfiguracji web-search dostawcy | Wąskie pomocniki konfiguracji/poświadczeń web-search dla dostawców, którzy nie potrzebują okablowania włączania pluginu |
  | `plugin-sdk/provider-web-search-contract` | Pomocniki kontraktu web-search dostawcy | Wąskie pomocniki kontraktu konfiguracji/poświadczeń web-search, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowe settery/gettery poświadczeń |
  | `plugin-sdk/provider-web-search` | Pomocniki web-search dostawcy | Pomocniki rejestracji/pamięci podręcznej/środowiska wykonawczego dostawcy web-search |
  | `plugin-sdk/provider-tools` | Pomocniki zgodności narzędzi/schematów dostawcy | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` oraz czyszczenie schematów i diagnostyka DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Pomocniki użycia dostawcy | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` i inne pomocniki użycia dostawcy |
  | `plugin-sdk/provider-stream` | Pomocniki wrapperów strumieni dostawcy | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz współdzielone pomocniki wrapperów Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Pomocniki transportu dostawcy | Pomocniki natywnego transportu dostawcy, takie jak chronione pobieranie, wyodrębnianie tekstu z wyników narzędzi, transformacje wiadomości transportowych i zapisywalne strumienie zdarzeń transportu |
  | `plugin-sdk/keyed-async-queue` | Uporządkowana kolejka asynchroniczna | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Współdzielone pomocniki multimediów | Pomocniki pobierania/transformacji/przechowywania multimediów, sondowanie wymiarów wideo oparte na ffprobe oraz konstruktory ładunków multimedialnych |
  | `plugin-sdk/media-generation-runtime` | Współdzielone pomocniki generowania multimediów | Współdzielone pomocniki failover, wybór kandydatów i komunikaty o brakujących modelach dla generowania obrazów/wideo/muzyki |
  | `plugin-sdk/media-understanding` | Pomocniki rozumienia multimediów | Typy dostawców rozumienia multimediów oraz eksporty pomocników obrazów/audio dla dostawców |
  | `plugin-sdk/text-runtime` | Przestarzały szeroki eksport zgodności tekstu | Użyj `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` i `logging-core` |
  | `plugin-sdk/text-chunking` | Pomocniki dzielenia tekstu | Pomocnik dzielenia tekstu wychodzącego |
  | `plugin-sdk/speech` | Pomocniki mowy | Typy dostawców mowy oraz pomocniki dyrektyw, rejestru i walidacji dla dostawców, a także konstruktor TTS zgodny z OpenAI |
  | `plugin-sdk/speech-core` | Współdzielony rdzeń mowy | Typy dostawców mowy, rejestr, dyrektywy, normalizacja |
  | `plugin-sdk/realtime-transcription` | Pomocniki transkrypcji w czasie rzeczywistym | Typy dostawców, pomocniki rejestru i współdzielony pomocnik sesji WebSocket |
  | `plugin-sdk/realtime-voice` | Pomocniki głosu w czasie rzeczywistym | Typy dostawców, pomocniki rejestru/rozpoznawania, pomocniki sesji mostka, współdzielone kolejki odpowiedzi głosowych agenta, sterowanie głosem aktywnego uruchomienia, kondycja transkrypcji/zdarzeń, tłumienie echa, dopasowywanie pytań konsultacyjnych, koordynacja wymuszonej konsultacji, śledzenie kontekstu tury, śledzenie aktywności wyjściowej i szybkie pomocniki konsultacji kontekstu |
  | `plugin-sdk/image-generation` | Pomocniki generowania obrazów | Typy dostawców generowania obrazów oraz pomocniki zasobów obrazów/adresów URL danych i konstruktor dostawcy obrazów zgodny z OpenAI |
  | `plugin-sdk/image-generation-core` | Współdzielony rdzeń generowania obrazów | Typy generowania obrazów, failover, uwierzytelnianie i pomocniki rejestru |
  | `plugin-sdk/music-generation` | Pomocniki generowania muzyki | Typy dostawców/żądań/wyników generowania muzyki |
  | `plugin-sdk/music-generation-core` | Współdzielony rdzeń generowania muzyki | Typy generowania muzyki, pomocniki failover, wyszukiwanie dostawcy i parsowanie odwołań do modeli |
  | `plugin-sdk/video-generation` | Pomocniki generowania wideo | Typy dostawców/żądań/wyników generowania wideo |
  | `plugin-sdk/video-generation-core` | Współdzielony rdzeń generowania wideo | Typy generowania wideo, pomocniki failover, wyszukiwanie dostawcy i parsowanie odwołań do modeli |
  | `plugin-sdk/interactive-runtime` | Pomocniki odpowiedzi interaktywnych | Normalizacja/redukcja ładunków odpowiedzi interaktywnych |
  | `plugin-sdk/channel-config-primitives` | Prymitywy konfiguracji kanału | Wąskie prymitywy schematu konfiguracji kanału |
  | `plugin-sdk/channel-config-writes` | Pomocniki zapisu konfiguracji kanału | Pomocniki autoryzacji zapisu konfiguracji kanału |
  | `plugin-sdk/channel-plugin-common` | Współdzielony wstęp kanału | Eksporty współdzielonego wstępu pluginu kanału |
  | `plugin-sdk/channel-status` | Pomocniki statusu kanału | Współdzielone pomocniki migawek/podsumowań statusu kanału |
  | `plugin-sdk/allowlist-config-edit` | Pomocniki konfiguracji allowlist | Pomocniki edycji/odczytu konfiguracji allowlist |
  | `plugin-sdk/group-access` | Pomocniki dostępu grupowego | Współdzielone pomocniki decyzji dostępu grupowego |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Przestarzałe fasady zgodności | Użyj `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Pomocniki ochrony Direct-DM | Wąskie pomocniki zasad ochrony przed kryptografią |
  | `plugin-sdk/extension-shared` | Współdzielone pomocniki rozszerzeń | Prymitywy kanału pasywnego/statusu i pomocników proxy otoczenia |
  | `plugin-sdk/webhook-targets` | Pomocniki celów Webhook | Rejestr celów Webhook i pomocniki instalacji tras |
  | `plugin-sdk/webhook-path` | Przestarzały alias ścieżki webhooka | Użyj `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Współdzielone pomocniki multimediów webowych | Pomocniki ładowania multimediów zdalnych/lokalnych |
  | `plugin-sdk/zod` | Przestarzały reeksport zgodności Zod | Importuj `zod` bezpośrednio z `zod` |
  | `plugin-sdk/memory-core` | Dołączone pomocniki memory-core | Powierzchnia pomocników menedżera pamięci/konfiguracji/plików/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Fasada środowiska wykonawczego silnika pamięci | Fasada środowiska wykonawczego indeksu/wyszukiwania pamięci |
  | `plugin-sdk/memory-core-host-embedding-registry` | Rejestr osadzania pamięci | Lekkie pomocniki rejestru dostawców osadzania pamięci |
  | `plugin-sdk/memory-core-host-engine-foundation` | Silnik fundamentu hosta pamięci | Eksporty silnika fundamentu hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Silnik osadzania hosta pamięci | Kontrakty osadzania pamięci, dostęp do rejestru, dostawca lokalny oraz ogólne pomocniki wsadowe/zdalne; konkretni dostawcy zdalni znajdują się w swoich pluginach właścicielskich |
  | `plugin-sdk/memory-core-host-engine-qmd` | Silnik QMD hosta pamięci | Eksporty silnika QMD hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-storage` | Silnik przechowywania hosta pamięci | Eksporty silnika przechowywania hosta pamięci |
  | `plugin-sdk/memory-core-host-multimodal` | Pomocniki multimodalne hosta pamięci | Pomocniki multimodalne hosta pamięci |
  | `plugin-sdk/memory-core-host-query` | Pomocniki zapytań hosta pamięci | Pomocniki zapytań hosta pamięci |
  | `plugin-sdk/memory-core-host-secret` | Pomocniki sekretów hosta pamięci | Pomocniki sekretów hosta pamięci |
  | `plugin-sdk/memory-core-host-events` | Przestarzały alias zdarzeń pamięci | Użyj `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Pomocniki statusu hosta pamięci | Pomocniki statusu hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-cli` | Środowisko wykonawcze CLI hosta pamięci | Pomocniki środowiska wykonawczego CLI hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-core` | Główne środowisko wykonawcze hosta pamięci | Pomocniki głównego środowiska wykonawczego hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-files` | Pomocniki plików/środowiska wykonawczego hosta pamięci | Pomocniki plików/środowiska wykonawczego hosta pamięci |
  | `plugin-sdk/memory-host-core` | Alias głównego środowiska wykonawczego hosta pamięci | Neutralny względem dostawcy alias pomocników głównego środowiska wykonawczego hosta pamięci |
  | `plugin-sdk/memory-host-events` | Alias dziennika zdarzeń hosta pamięci | Neutralny względem dostawcy alias pomocników dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-host-files` | Przestarzały alias plików/środowiska wykonawczego pamięci | Użyj `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Zarządzane pomocniki Markdown | Współdzielone pomocniki zarządzanego Markdown dla pluginów sąsiadujących z pamięcią |
  | `plugin-sdk/memory-host-search` | Fasada wyszukiwania Active Memory | Leniwa fasada środowiska wykonawczego menedżera wyszukiwania Active Memory |
  | `plugin-sdk/memory-host-status` | Przestarzały alias statusu hosta pamięci | Użyj `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Narzędzia testowe | Repozytoryjny lokalny przestarzały barrel zgodności; użyj ukierunkowanych repozytoryjnych lokalnych podścieżek testowych, takich jak `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` i `plugin-sdk/test-fixtures` |
</Accordion>

Ta tabela celowo obejmuje wspólny podzbiór migracyjny, a nie pełną
powierzchnię SDK. Inwentarz punktów wejścia kompilatora znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`; eksporty pakietu są generowane z
publicznego podzbioru.

Zarezerwowane pomocnicze szwy dla wbudowanych pluginów zostały wycofane z
publicznej mapy eksportów SDK z wyjątkiem jawnie udokumentowanych fasad
zgodności, takich jak przestarzały shim `plugin-sdk/discord` zachowany dla
opublikowanego pakietu `@openclaw/discord@2026.3.13`. Pomocniki specyficzne
dla właściciela znajdują się w pakiecie pluginu właściciela; współdzielone
zachowanie hosta powinno przechodzić przez generyczne kontrakty SDK, takie jak
`plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` i
`plugin-sdk/plugin-config-runtime`.

Używaj najwęższego importu pasującego do zadania. Jeśli nie możesz znaleźć
eksportu, sprawdź źródło w `src/plugin-sdk/` albo zapytaj maintainerów, który
generyczny kontrakt powinien go posiadać.

## Aktywne przestarzałe API

Węższe przestarzałe API, które dotyczą całego SDK pluginów, kontraktu dostawcy,
powierzchni runtime i manifestu. Każde z nich nadal działa dzisiaj, ale zostanie
usunięte w przyszłej wersji major. Wpis pod każdym elementem mapuje stare API na
jego kanoniczny zamiennik.

<AccordionGroup>
  <Accordion title="Konstruktory pomocy command-auth → command-status">
    **Stare (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nowe (`openclaw/plugin-sdk/command-status`)**: te same sygnatury, te same
    eksporty - tylko importowane z węższej podścieżki. `command-auth`
    re-eksportuje je jako stuby zgodności.

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

    **Nowe**: `resolveInboundMentionDecision({ facts, policy })` - zwraca
    pojedynczy obiekt decyzji zamiast dwóch rozdzielonych wywołań.

    Podrzędne pluginy kanałów (Slack, Discord, Matrix, MS Teams) już się
    przełączyły.

  </Accordion>

  <Accordion title="Shim runtime kanału i pomocniki akcji kanału">
    `openclaw/plugin-sdk/channel-runtime` to shim zgodności dla starszych
    pluginów kanałów. Nie importuj go w nowym kodzie; użyj
    `openclaw/plugin-sdk/channel-runtime-context` do rejestrowania obiektów
    runtime.

    Pomocniki `channelActions*` w `openclaw/plugin-sdk/channel-actions` są
    przestarzałe razem z surowymi eksportami kanału "actions". Udostępniaj
    capabilities przez semantyczną powierzchnię `presentation` - pluginy
    kanałów deklarują, co renderują (karty, przyciski, listy wyboru), a nie
    które surowe nazwy akcji akceptują.

  </Accordion>

  <Accordion title="Pomocnik tool() dostawcy wyszukiwania w sieci → createTool() w pluginie">
    **Stare**: fabryka `tool()` z `openclaw/plugin-sdk/provider-web-search`.

    **Nowe**: zaimplementuj `createTool(...)` bezpośrednio w pluginie dostawcy.
    OpenClaw nie potrzebuje już pomocnika SDK do rejestrowania wrappera
    narzędzia.

  </Accordion>

  <Accordion title="Koperty kanału w tekście zwykłym → BodyForAgent">
    **Stare**: `formatInboundEnvelope(...)` (oraz
    `ChannelMessageForAgent.channelEnvelope`) do budowania płaskiej koperty
    promptu w tekście zwykłym z przychodzących wiadomości kanału.

    **Nowe**: `BodyForAgent` plus ustrukturyzowane bloki kontekstu użytkownika.
    Pluginy kanałów dołączają metadane routingu (wątek, temat, odpowiedź do,
    reakcje) jako typowane pola zamiast konkatenować je w ciąg promptu.
    Pomocnik `formatAgentEnvelope(...)` jest nadal obsługiwany dla
    syntetyzowanych kopert skierowanych do asystenta, ale przychodzące koperty
    w tekście zwykłym są wycofywane.

    Obszary objęte zmianą: `inbound_claim`, `message_received` oraz każdy
    niestandardowy plugin kanału, który post-przetwarzał tekst
    `channelEnvelope`.

  </Accordion>

  <Accordion title="Hook deactivate → gateway_stop">
    **Stare**: `api.on("deactivate", handler)`.

    **Nowe**: `api.on("gateway_stop", handler)`. Zdarzenie i kontekst są tym
    samym kontraktem czyszczenia przy zamykaniu; zmienia się tylko nazwa hooka.

    ```typescript
    // Before
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // After
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` pozostaje podłączone jako przestarzały alias zgodności do
    okresu po 2026-08-16.

  </Accordion>

  <Accordion title="Hook subagent_spawning → powiązanie wątku core">
    **Stare**: `api.on("subagent_spawning", handler)` zwracające
    `threadBindingReady` albo `deliveryOrigin`.

    **Nowe**: pozwól core przygotować powiązania subagentów `thread: true`
    przez adapter wiązania sesji kanału. Używaj
    `api.on("subagent_spawned", handler)` tylko do obserwacji po uruchomieniu.

    ```typescript
    // Before
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // After
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult` oraz
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` pozostają tylko jako
    przestarzałe powierzchnie zgodności na czas migracji zewnętrznych pluginów.

  </Accordion>

  <Accordion title="Typy odkrywania dostawców → typy katalogu dostawców">
    Cztery aliasy typów odkrywania są teraz cienkimi wrapperami nad typami z
    ery katalogu:

    | Stary alias               | Nowy typ                   |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Plus starszy statyczny zestaw `ProviderCapabilities` - pluginy dostawców
    powinny używać jawnych hooków dostawcy, takich jak `buildReplayPolicy`,
    `normalizeToolSchemas` i `wrapStreamFn`, zamiast statycznego obiektu.

  </Accordion>

  <Accordion title="Hooki zasad thinking → resolveThinkingProfile">
    **Stare** (trzy osobne hooki w `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` oraz
    `resolveDefaultThinkingLevel(ctx)`.

    **Nowe**: pojedyncze `resolveThinkingProfile(ctx)`, które zwraca
    `ProviderThinkingProfile` z kanonicznym `id`, opcjonalnym `label` i
    uszeregowaną listą poziomów. OpenClaw automatycznie obniża przestarzałe
    zapisane wartości według rangi profilu.

    Kontekst obejmuje `provider`, `modelId`, opcjonalnie scalone `reasoning`
    oraz opcjonalnie scalone fakty `compat` modelu. Pluginy dostawców mogą
    używać tych faktów katalogowych, aby udostępnić profil specyficzny dla
    modelu tylko wtedy, gdy skonfigurowany kontrakt żądania go obsługuje.

    Zaimplementuj jeden hook zamiast trzech. Starsze hooki działają dalej w
    okresie deprecjacji, ale nie są komponowane z wynikiem profilu.

  </Accordion>

  <Accordion title="Zewnętrzni dostawcy auth → contracts.externalAuthProviders">
    **Stare**: implementowanie hooków zewnętrznego auth bez zadeklarowania
    dostawcy w manifeście pluginu.

    **Nowe**: zadeklaruj `contracts.externalAuthProviders` w manifeście pluginu
    **i** zaimplementuj `resolveExternalAuthProfiles(...)`.

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

    **Nowe**: odzwierciedl to samo wyszukiwanie zmiennych środowiskowych w
    `setup.providers[].envVars` w manifeście. Konsoliduje to metadane
    środowiska setup/status w jednym miejscu i unika uruchamiania runtime
    pluginu tylko po to, aby odpowiedzieć na zapytania o zmienne środowiskowe.

    `providerAuthEnvVars` pozostaje obsługiwane przez adapter zgodności do
    zamknięcia okna deprecjacji.

  </Accordion>

  <Accordion title="Rejestracja pluginu pamięci → registerMemoryCapability">
    **Stare**: trzy osobne wywołania -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nowe**: jedno wywołanie w API stanu pamięci -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Te same sloty, pojedyncze wywołanie rejestracji. Addytywne pomocniki promptu
    i korpusu (`registerMemoryPromptSupplement`,
    `registerMemoryCorpusSupplement`) nie są objęte zmianą.

  </Accordion>

  <Accordion title="API dostawcy embeddingów pamięci">
    **Stare**: `api.registerMemoryEmbeddingProvider(...)` plus
    `contracts.memoryEmbeddingProviders`.

    **Nowe**: `api.registerEmbeddingProvider(...)` plus
    `contracts.embeddingProviders`.

    Generyczny kontrakt dostawcy embeddingów jest wielokrotnego użytku poza
    pamięcią i jest obsługiwaną ścieżką dla nowych dostawców. API rejestracji
    specyficzne dla pamięci pozostaje podłączone jako przestarzała zgodność,
    gdy istniejący dostawcy migrują. Raporty inspekcji pluginów zgłaszają
    użycie poza wbudowanymi pluginami jako dług zgodności.

  </Accordion>

  <Accordion title="Zmieniono nazwy typów wiadomości sesji subagentów">
    Dwa starsze aliasy typów nadal eksportowane z `src/plugins/runtime/types.ts`:

    | Stare                         | Nowe                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Metoda runtime `readSession` jest przestarzała na rzecz
    `getSessionMessages`. Ta sama sygnatura; stara metoda wywołuje nową.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Stare**: `runtime.tasks.flow` (liczba pojedyncza) zwracało żywy accessor
    task-flow.

    **Nowe**: `runtime.tasks.managedFlows` zachowuje zarządzany runtime mutacji
    TaskFlow dla pluginów, które tworzą, aktualizują, anulują albo uruchamiają
    zadania podrzędne z przepływu. Użyj `runtime.tasks.flows`, gdy plugin
    potrzebuje tylko odczytów opartych na DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Fabryki osadzonych rozszerzeń → middleware wyników narzędzi agenta">
    Omówione w sekcji „Jak migrować → Migruj osadzone rozszerzenia wyników
    narzędzi do middleware” powyżej. Uwzględnione tutaj dla kompletności:
    usunięta ścieżka tylko dla embedded-runnera
    `api.registerEmbeddedExtensionFactory(...)` została zastąpiona przez
    `api.registerAgentToolResultMiddleware(...)` z jawną listą runtime w
    `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` re-eksportowany z `openclaw/plugin-sdk` jest teraz
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
Deprecjacje na poziomie rozszerzeń (wewnątrz wbudowanych pluginów kanałów i
dostawców pod `extensions/`) są śledzone w ich własnych barrelach `api.ts` i
`runtime-api.ts`. Nie wpływają na kontrakty pluginów zewnętrznych i nie są tutaj
wymienione. Jeśli bezpośrednio używasz lokalnego barrela wbudowanego pluginu,
przeczytaj komentarze deprecjacyjne w tym barrelu przed aktualizacją.
</Note>

## Harmonogram usuwania

| Kiedy                  | Co się dzieje                                                                 |
| ---------------------- | ----------------------------------------------------------------------------- |
| **Teraz**              | Przestarzałe interfejsy emitują ostrzeżenia w czasie wykonywania              |
| **Następne wydanie główne** | Przestarzałe interfejsy zostaną usunięte; Pluginy nadal ich używające przestaną działać |

Wszystkie podstawowe Pluginy zostały już zmigrowane. Zewnętrzne Pluginy powinny przeprowadzić migrację
przed następnym wydaniem głównym.

## Tymczasowe wyciszanie ostrzeżeń

Ustaw te zmienne środowiskowe podczas pracy nad migracją:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

To jest tymczasowa furtka awaryjna, a nie trwałe rozwiązanie.

## Powiązane

- [Pierwsze kroki](/pl/plugins/building-plugins) - zbuduj swój pierwszy Plugin
- [Omówienie SDK](/pl/plugins/sdk-overview) - pełna referencja importów podścieżek
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) - budowanie Pluginów kanałów
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) - budowanie Pluginów dostawców
- [Elementy wewnętrzne Pluginów](/pl/plugins/architecture) - szczegółowe omówienie architektury
- [Manifest Pluginu](/pl/plugins/manifest) - referencja schematu manifestu
