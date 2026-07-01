---
read_when:
    - Widzisz ostrzeżenie OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Widzisz ostrzeżenie OPENCLAW_EXTENSION_API_DEPRECATED
    - Użyto api.registerEmbeddedExtensionFactory przed OpenClaw 2026.4.25
    - Aktualizujesz plugin do nowoczesnej architektury pluginów
    - Utrzymujesz zewnętrzny Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Migracja ze starszej warstwy zgodności wstecznej do nowoczesnego SDK pluginów
title: Migracja Plugin SDK
x-i18n:
    generated_at: "2026-07-01T08:35:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f05bd42cc0a6fc53f6670377b4330bb452b2a06f4d0542a494875970ee81e08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw przeszedł z szerokiej warstwy zgodności wstecznej na nowoczesną
architekturę pluginów z ukierunkowanymi, udokumentowanymi importami. Jeśli Twój
plugin został zbudowany przed nową architekturą, ten przewodnik pomoże Ci go
zmigrować.

## Co się zmienia

Stary system pluginów udostępniał dwie bardzo szerokie powierzchnie, które
pozwalały pluginom importować wszystko, czego potrzebowały, z jednego punktu
wejścia:

- **`openclaw/plugin-sdk/compat`** - pojedynczy import, który reeksportował
  dziesiątki helperów. Wprowadzono go, aby utrzymać działanie starszych
  pluginów opartych na hookach podczas budowania nowej architektury pluginów.
- **`openclaw/plugin-sdk/infra-runtime`** - szeroki barrel helperów runtime,
  który mieszał zdarzenia systemowe, stan heartbeat, kolejki dostarczania,
  helpery fetch/proxy, helpery plików, typy zatwierdzeń i niepowiązane narzędzia.
- **`openclaw/plugin-sdk/config-runtime`** - szeroki barrel zgodności
  konfiguracji, który w okresie migracji nadal zawiera przestarzałe helpery
  bezpośredniego ładowania/zapisu.
- **`openclaw/extension-api`** - most dający pluginom bezpośredni dostęp do
  helperów po stronie hosta, takich jak wbudowany runner agenta.
- **`api.registerEmbeddedExtensionFactory(...)`** - usunięty hook rozszerzenia
  bundled przeznaczony tylko dla wbudowanego runnera, który mógł obserwować
  zdarzenia wbudowanego runnera, takie jak `tool_result`.

Szerokie powierzchnie importu są teraz **przestarzałe**. Nadal działają w
runtime, ale nowe pluginy nie mogą ich używać, a istniejące pluginy powinny
zmigrować przed kolejnym głównym wydaniem, które je usunie. API rejestracji
fabryki rozszerzeń przeznaczone tylko dla wbudowanego runnera zostało usunięte;
zamiast niego użyj middleware wyników narzędzi.

OpenClaw nie usuwa ani nie reinterpretuje udokumentowanego zachowania pluginów
w tej samej zmianie, która wprowadza zamiennik. Zmiany łamiące kontrakt muszą
najpierw przejść przez adapter zgodności, diagnostykę, dokumentację i okres
deprecjacji. Dotyczy to importów SDK, pól manifestu, API konfiguracji, hooków
i zachowania rejestracji runtime.

<Warning>
  Warstwa zgodności wstecznej zostanie usunięta w przyszłym głównym wydaniu.
  Pluginy, które nadal importują z tych powierzchni, przestaną wtedy działać.
  Starsze rejestracje fabryk wbudowanych rozszerzeń już się nie ładują.
</Warning>

## Dlaczego to zmieniono

Stare podejście powodowało problemy:

- **Wolny start** - import jednego helpera ładował dziesiątki niepowiązanych modułów
- **Zależności cykliczne** - szerokie reeksporty ułatwiały tworzenie cykli importów
- **Niejasna powierzchnia API** - nie dało się stwierdzić, które eksporty były stabilne, a które wewnętrzne

Nowoczesne SDK pluginów rozwiązuje ten problem: każda ścieżka importu (`openclaw/plugin-sdk/\<subpath\>`)
jest małym, samodzielnym modułem o jasnym celu i udokumentowanym kontrakcie.

Starsze wygodne powierzchnie providerów dla kanałów bundled również zostały
usunięte. Helpery oznaczone marką kanału były prywatnymi skrótami mono-repo,
a nie stabilnymi kontraktami pluginów. Zamiast nich używaj wąskich ogólnych
podścieżek SDK. W workspace pluginów bundled trzymaj helpery należące do
providera w jego własnym `api.ts` lub `runtime-api.ts`.

Aktualne przykłady providerów bundled:

- Anthropic trzyma helpery strumieni specyficzne dla Claude we własnej
  powierzchni `api.ts` / `contract-api.ts`
- OpenAI trzyma buildery providerów, helpery domyślnych modeli i buildery
  providerów realtime we własnym `api.ts`
- OpenRouter trzyma builder providera oraz helpery onboardingu/konfiguracji we
  własnym `api.ts`

## Plan migracji Talk i głosu realtime

Kod głosu realtime, telefonii, spotkań i przeglądarkowego Talk jest przenoszony
z lokalnego dla powierzchni księgowania tur do współdzielonego kontrolera sesji
Talk eksportowanego przez `openclaw/plugin-sdk/realtime-voice`. Nowy kontroler
posiada wspólną kopertę zdarzeń Talk, aktywny stan tury, stan przechwytywania,
stan dźwięku wyjściowego, historię ostatnich zdarzeń i odrzucanie nieaktualnych
tur. Pluginy providerów powinny nadal posiadać sesje realtime specyficzne dla
vendora; pluginy powierzchni powinny nadal posiadać szczegóły przechwytywania,
odtwarzania, telefonii i spotkań.

Ta migracja Talk jest celowo czysta i łamiąca:

1. Trzymaj współdzielony kontroler/prymitywy runtime w
   `plugin-sdk/realtime-voice`.
2. Przenieś powierzchnie bundled na współdzielony kontroler: przekaźnik
   przeglądarki, przekazanie pokoju zarządzanego, realtime połączenia głosowego,
   strumieniowy STT połączenia głosowego, realtime Google Meet i natywny
   push-to-talk.
3. Zastąp stare rodziny RPC Talk finalnym API `talk.session.*` i
   `talk.client.*`.
4. Ogłaszaj jeden kanał zdarzeń Talk na żywo w Gateway
   `hello-ok.features.events`: `talk.event`.
5. Usuń stary endpoint HTTP realtime oraz każdą ścieżkę nadpisywania instrukcji
   w czasie żądania.

Nowy kod nie powinien wywoływać `createTalkEventSequencer(...)` bezpośrednio,
chyba że implementuje niskopoziomowy adapter lub fixture testowy. Preferuj
współdzielony kontroler, aby zdarzenia ograniczone do tury nie mogły być
emitowane bez identyfikatora tury, nieaktualne wywołania `turnEnd` /
`turnCancel` nie mogły wyczyścić nowszej aktywnej tury, a zdarzenia cyklu życia
dźwięku wyjściowego pozostawały spójne w telefonii, spotkaniach, przekaźniku
przeglądarki, przekazaniu pokoju zarządzanego i natywnych klientach Talk.

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
`talk.client.create`, ponieważ przeglądarka posiada negocjację providera
i transport mediów, podczas gdy Gateway posiada poświadczenia, instrukcje
i politykę narzędzi. `talk.session.*` jest wspólną powierzchnią zarządzaną przez
Gateway dla sesji realtime gateway-relay, transkrypcji gateway-relay oraz
natywnych sesji STT/TTS pokoju zarządzanego.

Starsze konfiguracje, które umieszczały selektory realtime obok `talk.provider` /
`talk.providers`, powinny zostać naprawione za pomocą `openclaw doctor --fix`;
runtime Talk nie reinterpretuje konfiguracji providera speech/TTS jako
konfiguracji providera realtime.

Obsługiwane kombinacje `talk.session.create` są celowo niewielkie:

| Tryb            | Transport       | Brain           | Właściciel         | Uwagi                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Pełnodupleksowy dźwięk providera przekazywany przez Gateway; wywołania narzędzi są routowane przez narzędzie agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Tylko strumieniowy STT; wywołujący wysyłają dźwięk wejściowy i odbierają zdarzenia transkryptu.                   |
| `stt-tts`       | `managed-room`  | `agent-consult` | Pokój natywny/klienta | Pokoje w stylu push-to-talk i walkie-talkie, w których klient posiada przechwytywanie/odtwarzanie, a Gateway posiada stan tury. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Pokój natywny/klienta | Tryb pokoju tylko dla administratorów, dla zaufanych powierzchni first-party, które wykonują akcje narzędzi Gateway bezpośrednio. |

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

Ujednolicone słownictwo sterowania jest również celowo wąskie:

  | Metoda                          | Dotyczy                                                 | Kontrakt                                                                                                                                                                                         |
  | ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Dołącz fragment audio PCM w base64 do sesji dostawcy należącej do tego samego połączenia Gateway.                                                                                                |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Rozpocznij turę użytkownika w zarządzanym pokoju.                                                                                                                                                |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Zakończ aktywną turę po walidacji nieaktualnej tury.                                                                                                                                             |
  | `talk.session.cancelTurn`       | wszystkie sesje należące do Gateway                     | Anuluj aktywne przechwytywanie, pracę dostawcy, agenta i TTS dla tury.                                                                                                                           |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Zatrzymaj wyjście audio asystenta bez koniecznego kończenia tury użytkownika.                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Dokończ wywołanie narzędzia dostawcy wyemitowane przez przekaźnik; przekaż `options.willContinue` dla wyjścia tymczasowego albo `options.suppressResponse`, aby spełnić wywołanie bez kolejnej odpowiedzi asystenta. |
  | `talk.session.steer`            | sesje Talk obsługiwane przez agenta                     | Wyślij mówioną kontrolę `status`, `steer`, `cancel` lub `followup` do aktywnego osadzonego przebiegu rozwiązanego z sesji Talk.                                                                  |
  | `talk.session.close`            | wszystkie zunifikowane sesje                            | Zatrzymaj sesje przekaźnika albo unieważnij stan zarządzanego pokoju, a następnie zapomnij identyfikator zunifikowanej sesji.                                                                    |

  Nie wprowadzaj w core specjalnych przypadków dostawców ani platform, aby to zadziałało.
  Core odpowiada za semantykę sesji Talk. Pluginy dostawców odpowiadają za konfigurację sesji dostawcy.
  Połączenia głosowe i Google Meet odpowiadają za adaptery telefonii i spotkań. Przeglądarka i aplikacje natywne
  odpowiadają za UX przechwytywania i odtwarzania z urządzeń.

  ## Zasady zgodności

  W przypadku zewnętrznych Pluginów prace nad zgodnością mają następującą kolejność:

  1. dodaj nowy kontrakt
  2. utrzymaj stare zachowanie podłączone przez adapter zgodności
  3. wyemituj diagnostykę lub ostrzeżenie, które wskazuje starą ścieżkę i zamiennik
  4. pokryj obie ścieżki testami
  5. udokumentuj wycofanie i ścieżkę migracji
  6. usuń dopiero po ogłoszonym oknie migracji, zwykle w wydaniu głównym

  Opiekunowie mogą audytować bieżącą kolejkę migracji za pomocą
  `pnpm plugins:boundary-report`. Użyj `pnpm plugins:boundary-report:summary` dla
  kompaktowych liczników, `--owner <id>` dla jednego Pluginu lub właściciela zgodności oraz
  `pnpm plugins:boundary-report:ci`, gdy bramka CI powinna kończyć się niepowodzeniem dla przeterminowanych
  rekordów zgodności, zarezerwowanych importów SDK między właścicielami albo nieużywanych zarezerwowanych
  podścieżek SDK. Raport grupuje przestarzałe
  rekordy zgodności według daty usunięcia, zlicza lokalne odwołania w kodzie i dokumentacji,
  ujawnia zarezerwowane importy SDK między właścicielami i podsumowuje prywatny
  most SDK hosta pamięci, dzięki czemu czyszczenie zgodności pozostaje jawne zamiast
  polegać na doraźnych wyszukiwaniach. Zarezerwowane podścieżki SDK muszą mieć śledzone użycie właściciela;
  nieużywane zarezerwowane eksporty helperów należy usunąć z publicznego SDK.

  Jeśli pole manifestu nadal jest akceptowane, autorzy Pluginów mogą nadal go używać, dopóki
  dokumentacja i diagnostyka nie wskażą inaczej. Nowy kod powinien preferować udokumentowany
  zamiennik, ale istniejące Pluginy nie powinny psuć się podczas zwykłych wydań
  pomniejszych.

  ## Jak migrować

  <Steps>
  <Step title="Migruj helpery ładowania i zapisu konfiguracji środowiska uruchomieniowego">
    Pluginy w pakiecie powinny przestać wywoływać
    `api.runtime.config.loadConfig()` i
    `api.runtime.config.writeConfigFile(...)` bezpośrednio. Preferuj konfigurację, która została
    już przekazana do aktywnej ścieżki wywołania. Długotrwałe handlery, które potrzebują
    bieżącej migawki procesu, mogą używać `api.runtime.config.current()`. Długotrwałe
    narzędzia agenta powinny używać `ctx.getRuntimeConfig()` z kontekstu narzędzia wewnątrz
    `execute`, aby narzędzie utworzone przed zapisem konfiguracji nadal widziało odświeżoną
    konfigurację środowiska uruchomieniowego.

    Zapisy konfiguracji muszą przechodzić przez helpery transakcyjne i wybierać
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
    że zmiana wymaga czystego restartu bramy, oraz
    `afterWrite: { mode: "none", reason: "..." }` tylko wtedy, gdy wywołujący odpowiada za
    dalsze działania i celowo chce pominąć planer przeładowania.
    Wyniki mutacji zawierają typowane podsumowanie `followUp` do testów i logowania;
    Gateway pozostaje odpowiedzialny za zastosowanie lub zaplanowanie restartu.
    `loadConfig` i `writeConfigFile` pozostają jako przestarzałe helpery zgodności
    dla zewnętrznych Pluginów podczas okna migracji i ostrzegają raz z
    kodem zgodności `runtime-config-load-write`. Pluginy w pakiecie i kod środowiska uruchomieniowego
    repozytorium są chronione barierami skanera w
    `pnpm check:deprecated-api-usage` i
    `pnpm check:no-runtime-action-load-config`: nowe produkcyjne użycie w Pluginie
    kończy się od razu niepowodzeniem, bezpośrednie zapisy konfiguracji kończą się niepowodzeniem, metody serwera Gateway muszą używać
    migawki środowiska uruchomieniowego żądania, helpery wysyłania/działania/klienta kanału środowiska uruchomieniowego
    muszą otrzymywać konfigurację ze swojej granicy, a długotrwałe moduły środowiska uruchomieniowego mają
    zero dozwolonych otaczających wywołań `loadConfig()`.

    Nowy kod Pluginu powinien również unikać importowania szerokiego
    barrela zgodności `openclaw/plugin-sdk/config-runtime`. Użyj wąskiej
    podścieżki SDK, która pasuje do zadania:

    | Potrzeba | Import |
    | --- | --- |
    | Typy konfiguracji, takie jak `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Asercje już załadowanej konfiguracji i wyszukiwanie konfiguracji wejścia Pluginu | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Odczyty bieżącej migawki środowiska uruchomieniowego | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Zapisy konfiguracji | `openclaw/plugin-sdk/config-mutation` |
    | Helpery magazynu sesji | `openclaw/plugin-sdk/session-store-runtime` |
    | Konfiguracja tabeli Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helpery środowiska uruchomieniowego polityki grup | `openclaw/plugin-sdk/runtime-group-policy` |
    | Rozwiązywanie wejścia sekretów | `openclaw/plugin-sdk/secret-input-runtime` |
    | Nadpisania modelu/sesji | `openclaw/plugin-sdk/model-session-runtime` |

    Pluginy w pakiecie i ich testy są chronione skanerem przed szerokim
    barrelem, aby importy i mocki pozostawały lokalne względem zachowania, którego potrzebują. Szeroki
    barrel nadal istnieje dla zewnętrznej zgodności, ale nowy kod nie powinien
    od niego zależeć.

  </Step>

  <Step title="Migruj osadzone rozszerzenia wyników narzędzi do middleware">
    Pluginy w pakiecie muszą zastąpić przeznaczone wyłącznie dla osadzonego runnera
    handlery wyników narzędzi `api.registerEmbeddedExtensionFactory(...)`
    neutralnym względem środowiska uruchomieniowego middleware.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Zaktualizuj jednocześnie manifest Pluginu:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Zainstalowane Pluginy mogą również rejestrować middleware wyników narzędzi, gdy są
    jawnie włączone i deklarują każde docelowe środowisko uruchomieniowe w
    `contracts.agentToolResultMiddleware`. Niezadeklarowane rejestracje zainstalowanego middleware
    są odrzucane.

  </Step>

  <Step title="Migruj natywne handlery zatwierdzeń do faktów możliwości">
    Pluginy kanałów obsługujące zatwierdzenia udostępniają teraz natywne zachowanie zatwierdzeń przez
    `approvalCapability.nativeRuntime` oraz współdzielony rejestr kontekstu środowiska uruchomieniowego.

    Kluczowe zmiany:

    - Zastąp `approvalCapability.handler.loadRuntime(...)` przez
      `approvalCapability.nativeRuntime`
    - Przenieś specyficzne dla zatwierdzeń uwierzytelnianie/dostarczanie ze starszego okablowania `plugin.auth` /
      `plugin.approvals` na `approvalCapability`
    - `ChannelPlugin.approvals` zostało usunięte z publicznego kontraktu Pluginu kanału;
      przenieś pola delivery/native/render na `approvalCapability`
    - `plugin.auth` pozostaje tylko dla przepływów logowania/wylogowania kanału; hooki uwierzytelniania zatwierdzeń
      w tym miejscu nie są już czytane przez core
    - Rejestruj należące do kanału obiekty środowiska uruchomieniowego, takie jak klienci, tokeny lub aplikacje Bolt,
      przez `openclaw/plugin-sdk/channel-runtime-context`
    - Nie wysyłaj należących do Pluginu powiadomień o przekierowaniu z natywnych handlerów zatwierdzeń;
      core odpowiada teraz za powiadomienia o skierowaniu gdzie indziej na podstawie rzeczywistych wyników dostarczania
    - Podczas przekazywania `channelRuntime` do `createChannelManager(...)` podaj
      rzeczywistą powierzchnię `createPluginRuntime().channel`. Częściowe stuby są odrzucane.

    Zobacz `/plugins/sdk-channel-plugins`, aby poznać bieżący układ możliwości zatwierdzeń.

  </Step>

  <Step title="Audytuj zachowanie fallbacku wrappera Windows">
    Jeśli Twój Plugin używa `openclaw/plugin-sdk/windows-spawn`, nierozwiązane wrappery Windows
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

    Jeśli Twój wywołujący nie polega celowo na fallbacku powłoki, nie ustawiaj
    `allowShellFallback` i zamiast tego obsłuż rzucony błąd.

  </Step>

  <Step title="Znajdź przestarzałe importy">
    Przeszukaj swój Plugin pod kątem importów z dowolnej przestarzałej powierzchni:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Zastąp skoncentrowanymi importami">
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

    W przypadku helperów po stronie hosta użyj wstrzykniętego środowiska uruchomieniowego Pluginu zamiast importowania
    bezpośrednio:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
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
    `openclaw/plugin-sdk/infra-runtime` nadal istnieje na potrzeby zgodności
    zewnętrznej, ale nowy kod powinien importować ukierunkowaną powierzchnię
    helperów, której faktycznie potrzebuje:

    | Potrzeba | Import |
    | --- | --- |
    | Helpery kolejki zdarzeń systemowych | `openclaw/plugin-sdk/system-event-runtime` |
    | Helpery wybudzania, zdarzeń i widoczności Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Opróżnianie kolejki oczekujących dostarczeń | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetria aktywności kanału | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Pamięci podręczne deduplikacji w pamięci | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helpery bezpiecznych ścieżek do lokalnych plików/multimediów | `openclaw/plugin-sdk/file-access-runtime` |
    | Pobieranie świadome dyspozytora | `openclaw/plugin-sdk/runtime-fetch` |
    | Helpery proxy i chronionego pobierania | `openclaw/plugin-sdk/fetch-runtime` |
    | Typy zasad dyspozytora SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typy żądań/rozstrzygnięć zatwierdzania | `openclaw/plugin-sdk/approval-runtime` |
    | Helpery ładunku odpowiedzi zatwierdzania i poleceń | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helpery formatowania błędów | `openclaw/plugin-sdk/error-runtime` |
    | Oczekiwanie na gotowość transportu | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helpery bezpiecznych tokenów | `openclaw/plugin-sdk/secure-random-runtime` |
    | Ograniczona współbieżność zadań asynchronicznych | `openclaw/plugin-sdk/concurrency-runtime` |
    | Koercja liczbowa | `openclaw/plugin-sdk/number-runtime` |
    | Procesowa blokada asynchroniczna | `openclaw/plugin-sdk/async-lock-runtime` |
    | Blokady plików | `openclaw/plugin-sdk/file-lock` |

    Dołączone pluginy są chronione skanerem przed `infra-runtime`, więc kod
    repozytorium nie może wrócić do szerokiego barrela.

  </Step>

  <Step title="Migruj helpery tras kanałów">
    Nowy kod tras kanałów powinien używać `openclaw/plugin-sdk/channel-route`.
    Starsze nazwy route-key i comparable-target pozostają aliasami zgodności
    w oknie migracji, ale nowe pluginy powinny używać nazw tras, które
    bezpośrednio opisują zachowanie:

    | Stary helper | Nowoczesny helper |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Nowoczesne helpery tras spójnie normalizują `{ channel, to, accountId, threadId }`
    w natywnych zatwierdzeniach, wyciszaniu odpowiedzi, deduplikacji przychodzącej,
    dostarczaniu Cron i routingu sesji.

    Nie dodawaj nowych użyć `ChannelMessagingAdapter.parseExplicitTarget` ani
    helperów załadowanych tras opartych na parserze (`parseExplicitTargetForLoadedChannel`
    lub `resolveRouteTargetForLoadedChannel`) ani
    `resolveChannelRouteTargetWithParser(...)` z `plugin-sdk/channel-route`.
    Te punkty zaczepienia są przestarzałe i pozostają tylko dla starszych pluginów
    w oknie migracji. Nowe pluginy kanałów powinny używać
    `messaging.targetResolver.resolveTarget(...)` do normalizacji identyfikatora celu
    i fallbacku przy braku katalogu, `messaging.inferTargetChatType(...)`, gdy core
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

## Odwołanie do ścieżek importu

  <Accordion title="Common import path table">
  | Ścieżka importu | Cel | Kluczowe eksporty |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanoniczny pomocnik punktu wejścia Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Starszy zbiorczy reeksport definicji/konstruktorów punktów wejścia kanałów | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Eksport głównego schematu konfiguracji | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Pomocnik punktu wejścia pojedynczego dostawcy | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Wyspecjalizowane definicje i konstruktory punktów wejścia kanałów | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Współdzielone pomocniki kreatora konfiguracji | Tłumacz konfiguracji, monity listy dozwolonych, konstruktory statusu konfiguracji |
  | `plugin-sdk/setup-runtime` | Pomocniki środowiska uruchomieniowego na czas konfiguracji | `createSetupTranslator`, bezpieczne dla importu adaptery poprawek konfiguracji, pomocniki notatek wyszukiwania, `promptResolvedAllowFrom`, `splitSetupEntries`, delegowane proxy konfiguracji |
  | `plugin-sdk/setup-adapter-runtime` | Przestarzały alias adaptera konfiguracji | Użyj `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Pomocniki narzędzi konfiguracji | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Pomocniki wielu kont | Pomocniki listy kont/konfiguracji/bramki akcji |
  | `plugin-sdk/account-id` | Pomocniki identyfikatora konta | `DEFAULT_ACCOUNT_ID`, normalizacja identyfikatora konta |
  | `plugin-sdk/account-resolution` | Pomocniki wyszukiwania kont | Wyszukiwanie kont + pomocniki awaryjnego wyboru domyślnego |
  | `plugin-sdk/account-helpers` | Wąskie pomocniki kont | Pomocniki listy kont/akcji konta |
  | `plugin-sdk/channel-setup` | Adaptery kreatora konfiguracji | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, oraz `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Prymitywy parowania DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Okablowanie prefiksu odpowiedzi, pisania i dostarczania źródłowego | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabryki adapterów konfiguracji i pomocniki dostępu DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Konstruktory schematu konfiguracji | Tylko współdzielone prymitywy schematu konfiguracji kanału i ogólny konstruktor |
  | `plugin-sdk/bundled-channel-config-schema` | Dołączone schematy konfiguracji | Tylko Pluginy utrzymywane przez OpenClaw; nowe Pluginy muszą definiować schematy lokalne dla Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Przestarzałe dołączone schematy konfiguracji | Tylko alias zgodności; dla utrzymywanych dołączonych Pluginów użyj `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Pomocniki konfiguracji poleceń Telegram | Normalizacja nazw poleceń, przycinanie opisów, walidacja duplikatów/konfliktów |
  | `plugin-sdk/channel-policy` | Rozstrzyganie zasad grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Przestarzała fasada zgodności | Użyj `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Pomocniki kopert przychodzących | Współdzielone pomocniki tras + konstruktora kopert |
  | `plugin-sdk/channel-inbound` | Pomocniki odbioru przychodzącego | Budowanie kontekstu, formatowanie, katalogi główne, uruchamiacze, przygotowana wysyłka odpowiedzi i predykaty wysyłki |
  | `plugin-sdk/messaging-targets` | Przestarzała ścieżka importu parsowania celów | Użyj `plugin-sdk/channel-targets` dla ogólnych pomocników parsowania celów, `plugin-sdk/channel-route` do porównywania tras oraz należących do Plugin `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` do rozstrzygania celów specyficznego dla dostawcy |
  | `plugin-sdk/outbound-media` | Pomocniki multimediów wychodzących | Współdzielone ładowanie multimediów wychodzących |
  | `plugin-sdk/outbound-send-deps` | Przestarzała fasada zgodności | Użyj `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Pomocniki cyklu życia wiadomości wychodzących | Adaptery wiadomości, potwierdzenia, pomocniki trwałego wysyłania, pomocniki podglądu na żywo/strumieniowania, opcje odpowiedzi, pomocniki cyklu życia, tożsamość wychodząca i planowanie ładunku |
  | `plugin-sdk/channel-streaming` | Przestarzała fasada zgodności | Użyj `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Przestarzała fasada zgodności | Użyj `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Pomocniki powiązań wątków | Cykl życia powiązań wątków i pomocniki adapterów |
  | `plugin-sdk/agent-media-payload` | Starsze pomocniki ładunku multimediów | Konstruktor ładunku multimediów agenta dla starszych układów pól |
  | `plugin-sdk/channel-runtime` | Przestarzała podkładka zgodności | Tylko starsze narzędzia środowiska uruchomieniowego kanału |
  | `plugin-sdk/channel-send-result` | Typy wyniku wysłania | Typy wyniku odpowiedzi |
  | `plugin-sdk/runtime-store` | Trwałe przechowywanie Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Szerokie pomocniki środowiska uruchomieniowego | Pomocniki środowiska uruchomieniowego/rejestrowania/kopii zapasowej/instalacji Plugin |
  | `plugin-sdk/runtime-env` | Wąskie pomocniki środowiska uruchomieniowego | Pomocniki rejestratora/środowiska uruchomieniowego, limitu czasu, ponawiania i wycofywania |
  | `plugin-sdk/plugin-runtime` | Współdzielone pomocniki środowiska uruchomieniowego Plugin | Pomocniki poleceń/haków/http/interaktywne Plugin |
  | `plugin-sdk/hook-runtime` | Pomocniki potoku haków | Współdzielone pomocniki potoku Webhook/wewnętrznych haków |
  | `plugin-sdk/lazy-runtime` | Pomocniki leniwego środowiska uruchomieniowego | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Pomocniki procesów | Współdzielone pomocniki wykonywania |
  | `plugin-sdk/cli-runtime` | Pomocniki środowiska uruchomieniowego CLI | Formatowanie poleceń, oczekiwania, pomocniki wersji |
  | `plugin-sdk/gateway-runtime` | Pomocniki Gateway | Klient Gateway, pomocnik startu gotowego dla pętli zdarzeń i pomocniki poprawek statusu kanału |
  | `plugin-sdk/config-runtime` | Przestarzała podkładka zgodności konfiguracji | Preferuj `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` i `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Pomocniki poleceń Telegram | Stabilne awaryjnie pomocniki walidacji poleceń Telegram, gdy powierzchnia dołączonego kontraktu Telegram jest niedostępna |
  | `plugin-sdk/approval-runtime` | Pomocniki monitów zatwierdzania | Ładunek zatwierdzania wykonania/Plugin, pomocniki możliwości/profilu zatwierdzania, natywne trasowanie/środowisko uruchomieniowe zatwierdzania i formatowanie ścieżek wyświetlania ustrukturyzowanego zatwierdzania |
  | `plugin-sdk/approval-auth-runtime` | Pomocniki autoryzacji zatwierdzania | Rozstrzyganie osoby zatwierdzającej, autoryzacja akcji w tym samym czacie |
  | `plugin-sdk/approval-client-runtime` | Pomocniki klienta zatwierdzania | Pomocniki natywnego profilu/filtra zatwierdzania wykonania |
  | `plugin-sdk/approval-delivery-runtime` | Pomocniki dostarczania zatwierdzeń | Adaptery natywnych możliwości/dostarczania zatwierdzeń |
  | `plugin-sdk/approval-gateway-runtime` | Pomocniki Gateway zatwierdzania | Współdzielony pomocnik rozstrzygania Gateway zatwierdzania |
  | `plugin-sdk/approval-handler-adapter-runtime` | Pomocniki adaptera zatwierdzania | Lekkie pomocniki ładowania natywnego adaptera zatwierdzania dla gorących punktów wejścia kanałów |
  | `plugin-sdk/approval-handler-runtime` | Pomocniki obsługi zatwierdzania | Szersze pomocniki środowiska uruchomieniowego obsługi zatwierdzania; preferuj węższe powierzchnie adaptera/Gateway, gdy wystarczają |
  | `plugin-sdk/approval-native-runtime` | Pomocniki celu zatwierdzania | Pomocniki powiązania natywnego celu/konta zatwierdzania |
  | `plugin-sdk/approval-reply-runtime` | Pomocniki odpowiedzi zatwierdzania | Pomocniki ładunku odpowiedzi zatwierdzania wykonania/Plugin |
  | `plugin-sdk/channel-runtime-context` | Pomocniki kontekstu środowiska uruchomieniowego kanału | Ogólne pomocniki rejestracji/pobierania/obserwowania kontekstu środowiska uruchomieniowego kanału |
  | `plugin-sdk/security-runtime` | Pomocniki bezpieczeństwa | Współdzielone zaufanie, bramkowanie DM, pomocniki plików/ścieżek ograniczonych do katalogu głównego, treści zewnętrzne i pomocniki zbierania sekretów |
  | `plugin-sdk/ssrf-policy` | Pomocniki zasad SSRF | Pomocniki listy dozwolonych hostów i zasad sieci prywatnej |
  | `plugin-sdk/ssrf-runtime` | Pomocniki środowiska uruchomieniowego SSRF | Przypięty dyspozytor, chronione pobieranie, pomocniki zasad SSRF |
  | `plugin-sdk/system-event-runtime` | Pomocniki zdarzeń systemowych | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Pomocniki Heartbeat | Wybudzanie, zdarzenie i pomocniki widoczności Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Pomocniki kolejki dostarczania | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Pomocniki aktywności kanału | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Pomocniki deduplikacji | Pamięci podręczne deduplikacji w pamięci |
  | `plugin-sdk/file-access-runtime` | Pomocniki dostępu do plików | Pomocniki bezpiecznych lokalnych ścieżek plików/multimediów |
  | `plugin-sdk/transport-ready-runtime` | Pomocniki gotowości transportu | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Pomocniki zasad zatwierdzania wykonania | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Pomocniki ograniczonej pamięci podręcznej | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Pomocniki bramkowania diagnostyki | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Pomocniki formatowania błędów | `formatUncaughtError`, `isApprovalNotFoundError`, pomocniki grafu błędów |
  | `plugin-sdk/fetch-runtime` | Opakowane pomocniki pobierania/proxy | `resolveFetch`, pomocniki proxy, pomocniki opcji EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Pomocniki normalizacji hosta | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Pomocniki ponawiania | `RetryConfig`, `retryAsync`, uruchamiacze zasad |
  | `plugin-sdk/allow-from` | Formatowanie listy dozwolonych i mapowanie danych wejściowych | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Bramkowanie poleceń i pomocniki powierzchni poleceń | `resolveControlCommandGate`, pomocniki autoryzacji nadawcy, pomocniki rejestru poleceń, w tym dynamiczne formatowanie menu argumentów |
  | `plugin-sdk/command-status` | Renderery statusu/pomocy poleceń | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsowanie wejścia sekretu | Pomocniki wejścia sekretu |
  | `plugin-sdk/webhook-ingress` | Pomocniki żądań Webhook | Narzędzia celu Webhook |
  | `plugin-sdk/webhook-request-guards` | Pomocniki ochrony treści Webhook | Pomocniki odczytu/limitu treści żądania |
  | `plugin-sdk/reply-runtime` | Współdzielone środowisko uruchomieniowe odpowiedzi | Wysyłka przychodząca, heartbeat, planer odpowiedzi, dzielenie na fragmenty |
  | `plugin-sdk/reply-dispatch-runtime` | Wąskie pomocniki wysyłki odpowiedzi | Finalizacja, wysyłka dostawcy i pomocniki etykiet konwersacji |
  | `plugin-sdk/reply-history` | Pomocniki historii odpowiedzi | `createChannelHistoryWindow`; przestarzałe eksporty zgodności pomocników map, takie jak `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planowanie odniesienia odpowiedzi | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Pomocniki fragmentów odpowiedzi | Pomocniki dzielenia tekstu/Markdown na fragmenty |
  | `plugin-sdk/session-store-runtime` | Pomocniki magazynu sesji | Pomocniki ścieżki magazynu + czasu aktualizacji |
  | `plugin-sdk/state-paths` | Pomocniki ścieżek stanu | Pomocniki katalogów stanu i OAuth |
  | `plugin-sdk/routing` | Pomocniki routingu/klucza sesji | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, pomocniki normalizacji klucza sesji |
  | `plugin-sdk/status-helpers` | Pomocniki statusu kanału | Konstruktory podsumowań statusu kanału/konta, domyślne wartości stanu środowiska uruchomieniowego, pomocniki metadanych problemów |
  | `plugin-sdk/target-resolver-runtime` | Pomocniki resolvera celu | Współdzielone pomocniki resolvera celu |
  | `plugin-sdk/string-normalization-runtime` | Pomocniki normalizacji ciągów znaków | Pomocniki normalizacji slugów/ciągów znaków |
  | `plugin-sdk/request-url` | Pomocniki adresu URL żądania | Wyodrębnianie adresów URL jako ciągów znaków z danych wejściowych podobnych do żądań |
  | `plugin-sdk/run-command` | Pomocniki poleceń z limitem czasu | Uruchamianie poleceń z limitem czasu i znormalizowanymi stdout/stderr |
  | `plugin-sdk/param-readers` | Czytniki parametrów | Wspólne czytniki parametrów narzędzi/CLI |
  | `plugin-sdk/tool-payload` | Wyodrębnianie ładunku narzędzia | Wyodrębnianie znormalizowanych ładunków z obiektów wyników narzędzi |
  | `plugin-sdk/tool-send` | Wyodrębnianie wysyłki narzędzia | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
  | `plugin-sdk/temp-path` | Pomocniki ścieżek tymczasowych | Współdzielone pomocniki tymczasowych ścieżek pobierania |
  | `plugin-sdk/logging-core` | Pomocniki rejestrowania | Rejestrator podsystemu i pomocniki redakcji |
  | `plugin-sdk/markdown-table-runtime` | Pomocniki tabel Markdown | Pomocniki trybu tabel Markdown |
  | `plugin-sdk/reply-payload` | Typy odpowiedzi na wiadomość | Typy ładunku odpowiedzi |
  | `plugin-sdk/provider-setup` | Wyselekcjonowane pomocniki konfiguracji lokalnego/samodzielnie hostowanego dostawcy | Pomocniki wykrywania/konfiguracji samodzielnie hostowanego dostawcy |
  | `plugin-sdk/self-hosted-provider-setup` | Skoncentrowane pomocniki konfiguracji samodzielnie hostowanego dostawcy zgodnego z OpenAI | Te same pomocniki wykrywania/konfiguracji samodzielnie hostowanego dostawcy |
  | `plugin-sdk/provider-auth-runtime` | Pomocniki uwierzytelniania dostawcy w środowisku uruchomieniowym | Pomocniki rozwiązywania kluczy API w środowisku uruchomieniowym |
  | `plugin-sdk/provider-auth-api-key` | Pomocniki konfiguracji klucza API dostawcy | Pomocniki wdrażania klucza API/zapisu profilu |
  | `plugin-sdk/provider-auth-result` | Pomocniki wyniku uwierzytelniania dostawcy | Standardowy konstruktor wyniku uwierzytelniania OAuth |
  | `plugin-sdk/provider-selection-runtime` | Pomocniki wyboru dostawcy | Wybór skonfigurowanego lub automatycznego dostawcy oraz scalanie surowej konfiguracji dostawcy |
  | `plugin-sdk/provider-env-vars` | Pomocniki zmiennych środowiskowych dostawcy | Pomocniki wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
  | `plugin-sdk/provider-model-shared` | Współdzielone pomocniki modeli/odtwarzania dostawcy | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory zasad odtwarzania, pomocniki punktów końcowych dostawcy i pomocniki normalizacji identyfikatorów modeli |
  | `plugin-sdk/provider-catalog-shared` | Współdzielone pomocniki katalogu dostawcy | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Łatki wdrażania dostawcy | Pomocniki konfiguracji wdrażania |
  | `plugin-sdk/provider-http` | Pomocniki HTTP dostawcy | Ogólne pomocniki możliwości HTTP/punktów końcowych dostawcy, w tym pomocniki formularzy wieloczęściowych do transkrypcji audio |
  | `plugin-sdk/provider-web-fetch` | Pomocniki pobierania z sieci dostawcy | Pomocniki rejestracji/pamięci podręcznej dostawcy pobierania z sieci |
  | `plugin-sdk/provider-web-search-config-contract` | Pomocniki konfiguracji wyszukiwania internetowego dostawcy | Wąskie pomocniki konfiguracji/poświadczeń wyszukiwania internetowego dla dostawców, którzy nie potrzebują okablowania włączania Pluginu |
  | `plugin-sdk/provider-web-search-contract` | Pomocniki kontraktu wyszukiwania internetowego dostawcy | Wąskie pomocniki kontraktu konfiguracji/poświadczeń wyszukiwania internetowego, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowe ustawiacze/pobieracze poświadczeń |
  | `plugin-sdk/provider-web-search` | Pomocniki wyszukiwania internetowego dostawcy | Pomocniki rejestracji/pamięci podręcznej/środowiska uruchomieniowego dostawcy wyszukiwania internetowego |
  | `plugin-sdk/provider-tools` | Pomocniki zgodności narzędzi/schematu dostawcy | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` oraz czyszczenie schematów i diagnostyka DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Pomocniki użycia dostawcy | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` i inne pomocniki użycia dostawcy |
  | `plugin-sdk/provider-stream` | Pomocniki opakowań strumienia dostawcy | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy opakowań strumieni oraz współdzielone pomocniki opakowań Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Pomocniki transportu dostawcy | Natywne pomocniki transportu dostawcy, takie jak chronione pobieranie, wyodrębnianie tekstu wyniku narzędzia, transformacje wiadomości transportowych i zapisywalne strumienie zdarzeń transportu |
  | `plugin-sdk/keyed-async-queue` | Uporządkowana kolejka asynchroniczna | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Współdzielone pomocniki mediów | Pomocniki pobierania/przekształcania/przechowywania mediów, badanie wymiarów wideo oparte na ffprobe oraz konstruktory ładunków mediów |
  | `plugin-sdk/media-generation-runtime` | Współdzielone pomocniki generowania mediów | Współdzielone pomocniki przełączania awaryjnego, wybór kandydatów i komunikaty o brakujących modelach dla generowania obrazów/wideo/muzyki |
  | `plugin-sdk/media-understanding` | Pomocniki rozumienia mediów | Typy dostawców rozumienia mediów oraz eksporty pomocników obrazów/audio skierowane do dostawców |
  | `plugin-sdk/text-runtime` | Przestarzały szeroki eksport zgodności tekstu | Użyj `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` i `logging-core` |
  | `plugin-sdk/text-chunking` | Pomocniki dzielenia tekstu na fragmenty | Pomocnik dzielenia tekstu wychodzącego na fragmenty |
  | `plugin-sdk/speech` | Pomocniki mowy | Typy dostawców mowy oraz skierowane do dostawców pomocniki dyrektyw, rejestru, walidacji i konstruktor TTS zgodny z OpenAI |
  | `plugin-sdk/speech-core` | Współdzielony rdzeń mowy | Typy dostawców mowy, rejestr, dyrektywy, normalizacja |
  | `plugin-sdk/realtime-transcription` | Pomocniki transkrypcji w czasie rzeczywistym | Typy dostawców, pomocniki rejestru i współdzielony pomocnik sesji WebSocket |
  | `plugin-sdk/realtime-voice` | Pomocniki głosu w czasie rzeczywistym | Typy dostawców, pomocniki rejestru/rozwiązywania, pomocniki sesji mostka, współdzielone kolejki odpowiedzi głosowych agenta, sterowanie głosem aktywnego uruchomienia, stan transkryptu/zdarzeń, tłumienie echa, dopasowywanie pytań konsultacyjnych, koordynacja wymuszonych konsultacji, śledzenie kontekstu tury, śledzenie aktywności wyjściowej i pomocniki szybkiej konsultacji kontekstu |
  | `plugin-sdk/image-generation` | Pomocniki generowania obrazów | Typy dostawców generowania obrazów oraz pomocniki zasobów obrazów/adresów URL danych i konstruktor dostawcy obrazów zgodny z OpenAI |
  | `plugin-sdk/image-generation-core` | Współdzielony rdzeń generowania obrazów | Typy generowania obrazów, przełączanie awaryjne, uwierzytelnianie i pomocniki rejestru |
  | `plugin-sdk/music-generation` | Pomocniki generowania muzyki | Typy dostawców/żądań/wyników generowania muzyki |
  | `plugin-sdk/music-generation-core` | Współdzielony rdzeń generowania muzyki | Typy generowania muzyki, pomocniki przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie referencji modelu |
  | `plugin-sdk/video-generation` | Pomocniki generowania wideo | Typy dostawców/żądań/wyników generowania wideo |
  | `plugin-sdk/video-generation-core` | Współdzielony rdzeń generowania wideo | Typy generowania wideo, pomocniki przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie referencji modelu |
  | `plugin-sdk/interactive-runtime` | Pomocniki odpowiedzi interaktywnych | Normalizacja/redukcja ładunku odpowiedzi interaktywnej |
  | `plugin-sdk/channel-config-primitives` | Prymitywy konfiguracji kanału | Wąskie prymitywy schematu konfiguracji kanału |
  | `plugin-sdk/channel-config-writes` | Pomocniki zapisu konfiguracji kanału | Pomocniki autoryzacji zapisu konfiguracji kanału |
  | `plugin-sdk/channel-plugin-common` | Współdzielony wstęp kanału | Eksporty współdzielonego wstępu Pluginu kanału |
  | `plugin-sdk/channel-status` | Pomocniki statusu kanału | Współdzielone pomocniki migawki/podsumowania statusu kanału |
  | `plugin-sdk/allowlist-config-edit` | Pomocniki konfiguracji listy dozwolonych | Pomocniki edycji/odczytu konfiguracji listy dozwolonych |
  | `plugin-sdk/group-access` | Pomocniki dostępu grupowego | Współdzielone pomocniki decyzji o dostępie grupowym |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Przestarzałe fasady zgodności | Użyj `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Pomocniki ochrony bezpośrednich wiadomości DM | Wąskie pomocniki zasad ochrony przed szyfrowaniem |
  | `plugin-sdk/extension-shared` | Współdzielone pomocniki rozszerzeń | Prymitywy pomocnicze kanału pasywnego/statusu i otaczającego proxy |
  | `plugin-sdk/webhook-targets` | Pomocniki celów Webhook | Rejestr celów Webhook i pomocniki instalacji tras |
  | `plugin-sdk/webhook-path` | Przestarzały alias ścieżki Webhook | Użyj `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Współdzielone pomocniki mediów internetowych | Pomocniki ładowania mediów zdalnych/lokalnych |
  | `plugin-sdk/zod` | Przestarzały reeksport zgodności Zod | Importuj `zod` z `zod` bezpośrednio |
  | `plugin-sdk/memory-core` | Dołączone pomocniki memory-core | Powierzchnia pomocników menedżera pamięci/konfiguracji/plików/CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Fasada środowiska uruchomieniowego silnika pamięci | Fasada środowiska uruchomieniowego indeksu/wyszukiwania pamięci |
  | `plugin-sdk/memory-core-host-embedding-registry` | Rejestr osadzania pamięci | Lekkie pomocniki rejestru dostawców osadzania pamięci |
  | `plugin-sdk/memory-core-host-engine-foundation` | Silnik fundamentu hosta pamięci | Eksporty silnika fundamentu hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Silnik osadzania hosta pamięci | Kontrakty osadzania pamięci, dostęp do rejestru, lokalny dostawca oraz ogólne pomocniki wsadowe/zdalne; konkretni zdalni dostawcy znajdują się w należących do nich Pluginach |
  | `plugin-sdk/memory-core-host-engine-qmd` | Silnik QMD hosta pamięci | Eksporty silnika QMD hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-storage` | Silnik pamięci masowej hosta pamięci | Eksporty silnika pamięci masowej hosta pamięci |
  | `plugin-sdk/memory-core-host-multimodal` | Pomocniki multimodalne hosta pamięci | Pomocniki multimodalne hosta pamięci |
  | `plugin-sdk/memory-core-host-query` | Pomocniki zapytań hosta pamięci | Pomocniki zapytań hosta pamięci |
  | `plugin-sdk/memory-core-host-secret` | Pomocniki sekretów hosta pamięci | Pomocniki sekretów hosta pamięci |
  | `plugin-sdk/memory-core-host-events` | Przestarzały alias zdarzeń pamięci | Użyj `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Pomocniki statusu hosta pamięci | Pomocniki statusu hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-cli` | Środowisko uruchomieniowe CLI hosta pamięci | Pomocniki środowiska uruchomieniowego CLI hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-core` | Główne środowisko uruchomieniowe hosta pamięci | Pomocniki głównego środowiska uruchomieniowego hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-files` | Pomocniki plików/środowiska uruchomieniowego hosta pamięci | Pomocniki plików/środowiska uruchomieniowego hosta pamięci |
  | `plugin-sdk/memory-host-core` | Alias głównego środowiska uruchomieniowego hosta pamięci | Neutralny względem dostawcy alias pomocników głównego środowiska uruchomieniowego hosta pamięci |
  | `plugin-sdk/memory-host-events` | Alias dziennika zdarzeń hosta pamięci | Neutralny względem dostawcy alias pomocników dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-host-files` | Przestarzały alias plików/środowiska uruchomieniowego pamięci | Użyj `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Pomocniki zarządzanego Markdown | Współdzielone pomocniki zarządzanego Markdown dla Pluginów powiązanych z pamięcią |
  | `plugin-sdk/memory-host-search` | Fasada wyszukiwania Active Memory | Leniwa fasada środowiska uruchomieniowego menedżera wyszukiwania Active Memory |
  | `plugin-sdk/memory-host-status` | Przestarzały alias statusu hosta pamięci | Użyj `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Narzędzia testowe | Przestarzały moduł zbiorczy zgodności lokalny dla repozytorium; użyj skoncentrowanych lokalnych dla repozytorium podścieżek testowych, takich jak `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` i `plugin-sdk/test-fixtures` |
</Accordion>

Ta tabela jest celowo wspólnym podzbiorem migracyjnym, a nie pełną
powierzchnią SDK. Inwentarz entrypointu kompilatora znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`; eksporty pakietów są generowane z
publicznego podzbioru.

Zarezerwowane punkty integracji pomocników bundled-plugin zostały wycofane z
publicznej mapy eksportów SDK, z wyjątkiem jawnie udokumentowanych fasad
zgodności, takich jak przestarzały shim `plugin-sdk/discord` zachowany dla
opublikowanego pakietu `@openclaw/discord@2026.3.13`. Pomocniki specyficzne
dla właściciela znajdują się w pakiecie pluginu właściciela; wspólne zachowanie
hosta powinno przechodzić przez generyczne kontrakty SDK, takie jak
`plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` oraz
`plugin-sdk/plugin-config-runtime`.

Użyj najwęższego importu pasującego do zadania. Jeśli nie możesz znaleźć
eksportu, sprawdź źródło w `src/plugin-sdk/` albo zapytaj opiekunów, który
generyczny kontrakt powinien go posiadać.

## Aktywne wycofania

Węższe wycofania, które dotyczą całego SDK pluginów, kontraktu dostawcy,
powierzchni runtime i manifestu. Każde z nich nadal działa dzisiaj, ale zostanie
usunięte w przyszłym wydaniu głównym. Wpis pod każdym elementem mapuje stare
API na jego kanoniczny zamiennik.

<AccordionGroup>
  <Accordion title="Pomocniki budowania pomocy command-auth → command-status">
    **Stare (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nowe (`openclaw/plugin-sdk/command-status`)**: te same sygnatury, te same
    eksporty - po prostu importowane z węższej podścieżki. `command-auth`
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
    `openclaw/plugin-sdk/channel-inbound` lub
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nowe**: `resolveInboundMentionDecision({ facts, policy })` - zwraca jeden
    obiekt decyzji zamiast dwóch rozdzielonych wywołań.

    Podrzędne pluginy kanałów (Slack, Discord, Matrix, MS Teams) zostały już
    przełączone.

  </Accordion>

  <Accordion title="Shim runtime kanału i pomocniki akcji kanału">
    `openclaw/plugin-sdk/channel-runtime` to shim zgodności dla starszych
    pluginów kanałów. Nie importuj go z nowego kodu; użyj
    `openclaw/plugin-sdk/channel-runtime-context` do rejestrowania obiektów
    runtime.

    Pomocniki `channelActions*` w `openclaw/plugin-sdk/channel-actions` są
    przestarzałe razem z surowymi eksportami kanałów „actions”. Udostępniaj
    możliwości przez semantyczną powierzchnię `presentation` zamiast tego -
    pluginy kanałów deklarują, co renderują (karty, przyciski, selecty), a nie
    które surowe nazwy akcji akceptują.

  </Accordion>

  <Accordion title="Pomocnik tool() dostawcy wyszukiwania w sieci → createTool() w pluginie">
    **Stare**: fabryka `tool()` z `openclaw/plugin-sdk/provider-web-search`.

    **Nowe**: zaimplementuj `createTool(...)` bezpośrednio w pluginie dostawcy.
    OpenClaw nie potrzebuje już pomocnika SDK do rejestrowania wrappera
    narzędzia.

  </Accordion>

  <Accordion title="Koperty kanału plaintext → BodyForAgent">
    **Stare**: `formatInboundEnvelope(...)` (oraz
    `ChannelMessageForAgent.channelEnvelope`) do budowania płaskiej koperty
    promptu plaintext z przychodzących wiadomości kanału.

    **Nowe**: `BodyForAgent` plus ustrukturyzowane bloki kontekstu użytkownika.
    Pluginy kanałów dołączają metadane routingu (wątek, temat, odpowiedź do,
    reakcje) jako typowane pola zamiast łączyć je w string promptu. Pomocnik
    `formatAgentEnvelope(...)` jest nadal obsługiwany dla syntetyzowanych
    kopert skierowanych do asystenta, ale przychodzące koperty plaintext są
    wycofywane.

    Obszary objęte zmianą: `inbound_claim`, `message_received` oraz każdy
    niestandardowy plugin kanału, który postprzetwarzał tekst
    `channelEnvelope`.

  </Accordion>

  <Accordion title="Hook deactivate → gateway_stop">
    **Stare**: `api.on("deactivate", handler)`.

    **Nowe**: `api.on("gateway_stop", handler)`. Zdarzenie i kontekst są tym
    samym kontraktem sprzątania przy wyłączaniu; zmienia się tylko nazwa hooka.

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
    czasu po 2026-08-16.

  </Accordion>

  <Accordion title="Hook subagent_spawning → wiązanie wątku przez core">
    **Stare**: `api.on("subagent_spawning", handler)` zwracające
    `threadBindingReady` lub `deliveryOrigin`.

    **Nowe**: pozwól core przygotować wiązania podagentów `thread: true` przez
    adapter wiązania sesji kanału. Używaj `api.on("subagent_spawned", handler)`
    tylko do obserwacji po uruchomieniu.

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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` pozostają wyłącznie
    jako przestarzałe powierzchnie zgodności na czas migracji zewnętrznych
    pluginów.

  </Accordion>

  <Accordion title="Typy wykrywania dostawców → typy katalogu dostawców">
    Cztery aliasy typów wykrywania są teraz cienkimi wrapperami nad typami ery
    katalogu:

    | Stary alias               | Nowy typ                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Plus starszy statyczny zbiór `ProviderCapabilities` - pluginy dostawców
    powinny używać jawnych hooków dostawcy, takich jak `buildReplayPolicy`,
    `normalizeToolSchemas` i `wrapStreamFn`, zamiast statycznego obiektu.

  </Accordion>

  <Accordion title="Hooki polityki myślenia → resolveThinkingProfile">
    **Stare** (trzy oddzielne hooki w `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` oraz
    `resolveDefaultThinkingLevel(ctx)`.

    **Nowe**: pojedyncze `resolveThinkingProfile(ctx)`, które zwraca
    `ProviderThinkingProfile` z kanonicznym `id`, opcjonalnym `label` i
    uszeregowaną listą poziomów. OpenClaw automatycznie obniża nieaktualne
    zapisane wartości według rangi profilu.

    Kontekst zawiera `provider`, `modelId`, opcjonalnie scalone `reasoning`
    oraz opcjonalnie scalone fakty `compat` modelu. Pluginy dostawców mogą
    używać tych faktów katalogu, aby udostępnić profil specyficzny dla modelu
    tylko wtedy, gdy skonfigurowany kontrakt żądania go obsługuje.

    Zaimplementuj jeden hook zamiast trzech. Starsze hooki nadal działają w
    oknie wycofywania, ale nie są komponowane z wynikiem profilu.

  </Accordion>

  <Accordion title="Zewnętrzni dostawcy uwierzytelniania → contracts.externalAuthProviders">
    **Stare**: implementowanie zewnętrznych hooków uwierzytelniania bez
    deklarowania dostawcy w manifeście pluginu.

    **Nowe**: zadeklaruj `contracts.externalAuthProviders` w manifeście pluginu
    **oraz** zaimplementuj `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Wyszukiwanie zmiennych env dostawcy → setup.providers[].envVars">
    **Stare** pole manifestu: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nowe**: odwzoruj to samo wyszukiwanie zmiennych env do
    `setup.providers[].envVars` w manifeście. Konsoliduje to metadane env
    konfiguracji/statusu w jednym miejscu i unika uruchamiania runtime pluginu
    tylko po to, by odpowiedzieć na wyszukiwania zmiennych env.

    `providerAuthEnvVars` pozostaje obsługiwane przez adapter zgodności do
    zamknięcia okna wycofywania.

  </Accordion>

  <Accordion title="Rejestracja pluginu pamięci → registerMemoryCapability">
    **Stare**: trzy oddzielne wywołania -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nowe**: jedno wywołanie w API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Te same sloty, pojedyncze wywołanie rejestracji. Addytywne pomocniki
    promptu i korpusu (`registerMemoryPromptSupplement`,
    `registerMemoryCorpusSupplement`) nie są objęte zmianą.

  </Accordion>

  <Accordion title="API dostawcy embeddingów pamięci">
    **Stare**: `api.registerMemoryEmbeddingProvider(...)` plus
    `contracts.memoryEmbeddingProviders`.

    **Nowe**: `api.registerEmbeddingProvider(...)` plus
    `contracts.embeddingProviders`.

    Generyczny kontrakt dostawcy embeddingów nadaje się do ponownego użycia
    poza pamięcią i jest obsługiwaną ścieżką dla nowych dostawców. Specyficzne
    dla pamięci API rejestracji pozostaje podłączone jako przestarzała zgodność
    na czas migracji istniejących dostawców. Raporty inspekcji pluginów
    zgłaszają użycie poza bundled plugins jako dług zgodności.

  </Accordion>

  <Accordion title="Zmieniono nazwy typów wiadomości sesji podagenta">
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

    **Nowe**: `runtime.tasks.managedFlows` zachowuje runtime mutacji
    zarządzanego TaskFlow dla pluginów, które tworzą, aktualizują, anulują lub
    uruchamiają zadania podrzędne z przepływu. Użyj `runtime.tasks.flows`, gdy
    plugin potrzebuje tylko odczytów opartych na DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Fabryki osadzonych rozszerzeń → middleware wyników narzędzi agenta">
    Omówione powyżej w sekcji „Jak migrować → Migruj osadzone rozszerzenia
    wyników narzędzi do middleware”. Uwzględnione tutaj dla kompletności:
    usunięta ścieżka tylko dla embedded-runner
    `api.registerEmbeddedExtensionFactory(...)` została zastąpiona przez
    `api.registerAgentToolResultMiddleware(...)` z jawną listą runtime w
    `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` reeksportowany z `openclaw/plugin-sdk` jest teraz
    jednowierszowym aliasem dla `OpenClawConfig`. Preferuj nazwę kanoniczną.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Wycofania na poziomie rozszerzeń (wewnątrz bundled plugins kanałów/dostawców w
`extensions/`) są śledzone w ich własnych barrelach `api.ts` i `runtime-api.ts`.
Nie wpływają na kontrakty pluginów firm trzecich i nie są tutaj wymienione.
Jeśli używasz bezpośrednio lokalnego barrela bundled pluginu, przed aktualizacją
przeczytaj komentarze o wycofaniach w tym barrelu.
</Note>

## Harmonogram usuwania

| Kiedy                   | Co się dzieje                                                                 |
| ----------------------- | ----------------------------------------------------------------------------- |
| **Teraz**               | Przestarzałe interfejsy emitują ostrzeżenia w czasie działania                |
| **Następne wydanie główne** | Przestarzałe interfejsy zostaną usunięte; pluginy nadal ich używające przestaną działać |

Wszystkie podstawowe pluginy zostały już zmigrowane. Zewnętrzne pluginy powinny przeprowadzić migrację
przed następnym wydaniem głównym.

## Tymczasowe wyciszanie ostrzeżeń

Ustaw te zmienne środowiskowe podczas pracy nad migracją:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

To tymczasowe wyjście awaryjne, a nie trwałe rozwiązanie.

## Powiązane

- [Pierwsze kroki](/pl/plugins/building-plugins) - zbuduj swój pierwszy plugin
- [Przegląd SDK](/pl/plugins/sdk-overview) - pełna referencja importów podścieżek
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) - tworzenie pluginów kanałów
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) - tworzenie pluginów dostawców
- [Wewnętrzne mechanizmy Plugin](/pl/plugins/architecture) - szczegółowy opis architektury
- [Manifest Plugin](/pl/plugins/manifest) - referencja schematu manifestu
