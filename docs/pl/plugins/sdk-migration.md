---
read_when:
    - Widzisz ostrzeżenie OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Widzisz ostrzeżenie OPENCLAW_EXTENSION_API_DEPRECATED
    - Używano api.registerEmbeddedExtensionFactory przed OpenClaw 2026.4.25
    - Aktualizujesz plugin do nowoczesnej architektury pluginów
    - Utrzymujesz zewnętrzny Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Przeprowadź migrację z przestarzałej warstwy zgodności wstecznej do nowoczesnego SDK Plugin
title: Migracja Plugin SDK
x-i18n:
    generated_at: "2026-06-27T18:05:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9061b31567cbd24196458ecb9af1cb1b0351f789a136ea26951c8fb7e576cf08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw przeszedł od szerokiej warstwy zgodności wstecznej do nowoczesnej architektury pluginów z zawężonymi, udokumentowanymi importami. Jeśli Twój plugin został zbudowany przed nową architekturą, ten przewodnik pomoże Ci przeprowadzić migrację.

## Co się zmienia

Stary system pluginów udostępniał dwie bardzo szerokie powierzchnie, które pozwalały pluginom importować wszystko, czego potrzebowały, z jednego punktu wejścia:

- **`openclaw/plugin-sdk/compat`** - pojedynczy import, który ponownie eksportował dziesiątki
  helperów. Został wprowadzony, aby starsze pluginy oparte na hookach działały podczas
  budowania nowej architektury pluginów.
- **`openclaw/plugin-sdk/infra-runtime`** - szeroki zbiorczy moduł helperów runtime, który
  mieszał zdarzenia systemowe, stan Heartbeat, kolejki dostarczania, helpery fetch/proxy,
  helpery plików, typy zatwierdzeń i niepowiązane narzędzia.
- **`openclaw/plugin-sdk/config-runtime`** - szeroki zbiorczy moduł zgodności konfiguracji,
  który wciąż przenosi przestarzałe bezpośrednie helpery odczytu/zapisu w oknie migracji.
- **`openclaw/extension-api`** - most, który dawał pluginom bezpośredni dostęp do
  helperów po stronie hosta, takich jak osadzony runner agenta.
- **`api.registerEmbeddedExtensionFactory(...)`** - usunięty hook rozszerzenia wyłącznie dla osadzonego runnera
  wbudowanego, który mógł obserwować zdarzenia osadzonego runnera, takie jak
  `tool_result`.

Szerokie powierzchnie importu są teraz **przestarzałe**. Nadal działają w runtime,
ale nowe pluginy nie mogą ich używać, a istniejące pluginy powinny przeprowadzić migrację, zanim
następne wydanie główne je usunie. API rejestracji fabryki rozszerzeń wyłącznie dla osadzonego runnera
zostało usunięte; zamiast tego użyj middleware wyników narzędzi.

OpenClaw nie usuwa ani nie reinterpretuje udokumentowanego zachowania pluginów w tej samej
zmianie, która wprowadza zamiennik. Zmiany łamiące kontrakt muszą najpierw przejść
przez adapter zgodności, diagnostykę, dokumentację i okno deprecjacji.
Dotyczy to importów SDK, pól manifestu, API konfiguracji, hooków i zachowania
rejestracji runtime.

<Warning>
  Warstwa zgodności wstecznej zostanie usunięta w przyszłym wydaniu głównym.
  Pluginy, które nadal importują z tych powierzchni, przestaną wtedy działać.
  Starsze rejestracje fabryk osadzonych rozszerzeń już się nie ładują.
</Warning>

## Dlaczego to zmieniono

Stare podejście powodowało problemy:

- **Powolny start** - zaimportowanie jednego helpera ładowało dziesiątki niepowiązanych modułów
- **Zależności cykliczne** - szerokie ponowne eksporty ułatwiały tworzenie cykli importów
- **Niejasna powierzchnia API** - nie było sposobu rozróżnienia, które eksporty były stabilne, a które wewnętrzne

Nowoczesne SDK pluginów rozwiązuje ten problem: każda ścieżka importu (`openclaw/plugin-sdk/\<subpath\>`)
jest małym, samodzielnym modułem o jasnym przeznaczeniu i udokumentowanym kontrakcie.

Starsze wygodne punkty integracji dostawców dla wbudowanych kanałów także zniknęły.
Helpery oznaczone markami kanałów były prywatnymi skrótami mono-repozytorium, a nie stabilnymi
kontraktami pluginów. Zamiast tego używaj wąskich, ogólnych podścieżek SDK. W obszarze roboczym
wbudowanych pluginów trzymaj helpery należące do dostawcy we własnym `api.ts` lub
`runtime-api.ts` tego pluginu.

Aktualne przykłady wbudowanych dostawców:

- Anthropic trzyma helpery strumieni specyficzne dla Claude we własnym punkcie integracji `api.ts` /
  `contract-api.ts`
- OpenAI trzyma buildery dostawcy, helpery modelu domyślnego i buildery dostawcy realtime
  we własnym `api.ts`
- OpenRouter trzyma builder dostawcy oraz helpery onboardingu/konfiguracji we własnym
  `api.ts`

## Plan migracji Talk i głosu realtime

Kod głosu realtime, telefonii, spotkań i przeglądarkowego Talk jest przenoszony z
lokalnego dla powierzchni księgowania tur do współdzielonego kontrolera sesji Talk eksportowanego przez
`openclaw/plugin-sdk/realtime-voice`. Nowy kontroler jest właścicielem wspólnej
koperty zdarzeń Talk, stanu aktywnej tury, stanu przechwytywania, stanu wyjścia audio,
historii ostatnich zdarzeń i odrzucania nieaktualnych tur. Pluginy dostawców powinny nadal
zarządzać sesjami realtime specyficznymi dla dostawcy; pluginy powierzchni powinny nadal
zarządzać przechwytywaniem, odtwarzaniem, telefonią i niuansami spotkań.

Ta migracja Talk celowo jest czystą zmianą łamiącą zgodność:

1. Zachowaj współdzielony kontroler/prymitywy runtime w
   `plugin-sdk/realtime-voice`.
2. Przenieś wbudowane powierzchnie na współdzielony kontroler: przekaźnik przeglądarkowy,
   przekazanie pokoju zarządzanego, realtime połączeń głosowych, strumieniowe STT połączeń głosowych, realtime Google
   Meet oraz natywne push-to-talk.
3. Zastąp stare rodziny RPC Talk finalnym API `talk.session.*` i
   `talk.client.*`.
4. Ogłoś jeden kanał zdarzeń Talk na żywo w Gateway
   `hello-ok.features.events`: `talk.event`.
5. Usuń stary endpoint HTTP realtime oraz każdą ścieżkę nadpisywania instrukcji
   w czasie żądania.

Nowy kod nie powinien wywoływać bezpośrednio `createTalkEventSequencer(...)`, chyba że
implementuje niskopoziomowy adapter lub fixture testowy. Preferuj współdzielony kontroler,
aby zdarzenia powiązane z turą nie mogły być emitowane bez identyfikatora tury, nieaktualne wywołania `turnEnd` /
`turnCancel` nie mogły wyczyścić nowszej aktywnej tury, a zdarzenia cyklu życia wyjścia audio
pozostawały spójne w telefonii, spotkaniach, przekaźniku przeglądarkowym, przekazaniu pokoju zarządzanego
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
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Sesje WebRTC/provider-websocket należące do przeglądarki używają `talk.client.create`,
ponieważ przeglądarka jest właścicielem negocjacji dostawcy i transportu mediów, podczas gdy
Gateway jest właścicielem poświadczeń, instrukcji i zasad narzędzi. `talk.session.*` jest
wspólną powierzchnią zarządzaną przez Gateway dla realtime gateway-relay, transkrypcji
gateway-relay oraz sesji natywnych STT/TTS w pokoju zarządzanym.

Starsze konfiguracje, które umieszczały selektory realtime obok `talk.provider` /
`talk.providers`, powinny zostać naprawione przez `openclaw doctor --fix`; runtime Talk
nie reinterpretuje konfiguracji dostawcy mowy/TTS jako konfiguracji dostawcy realtime.

Obsługiwane kombinacje `talk.session.create` są celowo niewielkie:

| Tryb            | Transport       | Brain           | Właściciel         | Uwagi                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Pełnodupleksowy dźwięk dostawcy mostkowany przez Gateway; wywołania narzędzi są trasowane przez narzędzie agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Tylko strumieniowe STT; wywołujący wysyłają dźwięk wejściowy i odbierają zdarzenia transkrypcji.                  |
| `stt-tts`       | `managed-room`  | `agent-consult` | Pokój natywny/klienta | Pokoje w stylu push-to-talk i walkie-talkie, gdzie klient jest właścicielem przechwytywania/odtwarzania, a Gateway stanu tury. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Pokój natywny/klienta | Tryb pokoju tylko dla administratorów dla zaufanych powierzchni własnych, które wykonują akcje narzędzi Gateway bezpośrednio. |

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
  | `talk.session.cancelTurn`       | wszystkie sesje należące do Gateway                     | Anuluj aktywne przechwytywanie, pracę dostawcy, agenta lub TTS dla tury.                                                                                                                 |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Zatrzymaj wyjście audio asystenta bez koniecznego kończenia tury użytkownika.                                                                                                            |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Zakończ wywołanie narzędzia dostawcy wyemitowane przez przekaźnik; przekaż `options.willContinue` dla wyjścia pośredniego lub `options.suppressResponse`, aby spełnić wywołanie bez kolejnej odpowiedzi asystenta. |
  | `talk.session.steer`            | sesje Talk wspierane przez agenta                       | Wyślij mówioną kontrolę `status`, `steer`, `cancel` lub `followup` do aktywnego osadzonego uruchomienia rozwiązanego z sesji Talk.                                                       |
  | `talk.session.close`            | wszystkie ujednolicone sesje                            | Zatrzymaj sesje przekaźnika lub unieważnij stan zarządzanego pokoju, a następnie zapomnij identyfikator ujednoliconej sesji.                                                            |

  Nie wprowadzaj w rdzeniu specjalnych przypadków dostawców ani platform, aby to działało.
  Rdzeń odpowiada za semantykę sesji Talk. Pluginy dostawców odpowiadają za konfigurację sesji dostawcy.
  Połączenia głosowe i Google Meet odpowiadają za adaptery telefonii i spotkań. Przeglądarki oraz aplikacje natywne
  odpowiadają za UX przechwytywania i odtwarzania na urządzeniu.

  ## Polityka zgodności

  W przypadku zewnętrznych pluginów prace nad zgodnością przebiegają w tej kolejności:

  1. dodaj nowy kontrakt
  2. zachowaj stare zachowanie podłączone przez adapter zgodności
  3. wyemituj diagnostykę lub ostrzeżenie, które nazywa starą ścieżkę i zamiennik
  4. obejmij testami obie ścieżki
  5. udokumentuj wycofanie oraz ścieżkę migracji
  6. usuń dopiero po ogłoszonym oknie migracji, zwykle w wydaniu głównym

  Opiekunowie mogą audytować bieżącą kolejkę migracji za pomocą
  `pnpm plugins:boundary-report`. Użyj `pnpm plugins:boundary-report:summary` dla
  zwartych zliczeń, `--owner <id>` dla jednego pluginu lub właściciela zgodności oraz
  `pnpm plugins:boundary-report:ci`, gdy bramka CI powinna zakończyć się niepowodzeniem z powodu wymagalnych
  rekordów zgodności, zastrzeżonych importów SDK między właścicielami albo nieużywanych zastrzeżonych
  podścieżek SDK. Raport grupuje przestarzałe
  rekordy zgodności według daty usunięcia, zlicza lokalne odniesienia w kodzie i dokumentacji,
  ujawnia zastrzeżone importy SDK między właścicielami oraz podsumowuje prywatny
  most SDK hosta pamięci, dzięki czemu czyszczenie zgodności pozostaje jawne zamiast
  polegać na doraźnych wyszukiwaniach. Zastrzeżone podścieżki SDK muszą mieć śledzone użycie przez właściciela;
  nieużywane zastrzeżone eksporty pomocnicze należy usunąć z publicznego SDK.

  Jeśli pole manifestu jest nadal akceptowane, autorzy pluginów mogą go dalej używać, dopóki
  dokumentacja i diagnostyka nie powiedzą inaczej. Nowy kod powinien preferować udokumentowany
  zamiennik, ale istniejące pluginy nie powinny psuć się podczas zwykłych wydań
  pomniejszych.

  ## Jak migrować

  <Steps>
  <Step title="Zmigruj pomocniki ładowania i zapisu konfiguracji środowiska wykonawczego">
    Wbudowane pluginy powinny przestać bezpośrednio wywoływać
    `api.runtime.config.loadConfig()` i
    `api.runtime.config.writeConfigFile(...)`. Preferuj konfigurację, która została
    już przekazana do aktywnej ścieżki wywołania. Długotrwałe handlery, które potrzebują
    bieżącej migawki procesu, mogą używać `api.runtime.config.current()`. Długotrwałe
    narzędzia agenta powinny używać `ctx.getRuntimeConfig()` z kontekstu narzędzia wewnątrz
    `execute`, aby narzędzie utworzone przed zapisem konfiguracji nadal widziało odświeżoną
    konfigurację środowiska wykonawczego.

    Zapisy konfiguracji muszą przechodzić przez pomocniki transakcyjne i wybierać
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
    dalsze działania i celowo chce wyciszyć planer ponownego ładowania.
    Wyniki mutacji zawierają typowane podsumowanie `followUp` dla testów i logowania;
    gateway pozostaje odpowiedzialny za zastosowanie lub zaplanowanie restartu.
    `loadConfig` i `writeConfigFile` pozostają przestarzałymi pomocnikami zgodności
    dla zewnętrznych pluginów w czasie okna migracji i ostrzegają raz z
    kodem zgodności `runtime-config-load-write`. Wbudowane pluginy i kod środowiska wykonawczego
    repozytorium są chronione przez zabezpieczenia skanera w
    `pnpm check:deprecated-api-usage` i
    `pnpm check:no-runtime-action-load-config`: nowe użycie w pluginach produkcyjnych
    kończy się bezwarunkowym niepowodzeniem, bezpośrednie zapisy konfiguracji kończą się niepowodzeniem, metody serwera gateway muszą używać
    migawki środowiska wykonawczego z żądania, pomocniki wysyłania, akcji i klienta kanału środowiska wykonawczego
    muszą otrzymać konfigurację ze swojej granicy, a długotrwałe moduły środowiska wykonawczego mają
    zerową liczbę dozwolonych otaczających wywołań `loadConfig()`.

    Nowy kod pluginu powinien też unikać importowania szerokiego
    barrela zgodności `openclaw/plugin-sdk/config-runtime`. Użyj wąskiej
    podścieżki SDK pasującej do zadania:

    | Potrzeba | Import |
    | --- | --- |
    | Typy konfiguracji, takie jak `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Asercje już załadowanej konfiguracji i wyszukiwanie konfiguracji wejścia pluginu | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Odczyty bieżącej migawki środowiska wykonawczego | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Zapisy konfiguracji | `openclaw/plugin-sdk/config-mutation` |
    | Pomocniki magazynu sesji | `openclaw/plugin-sdk/session-store-runtime` |
    | Konfiguracja tabeli Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Pomocniki środowiska wykonawczego polityki grup | `openclaw/plugin-sdk/runtime-group-policy` |
    | Rozwiązywanie wejścia sekretu | `openclaw/plugin-sdk/secret-input-runtime` |
    | Nadpisania modelu/sesji | `openclaw/plugin-sdk/model-session-runtime` |

    Wbudowane pluginy i ich testy są chronione skanerem przed szerokim
    barrelem, aby importy i mocki pozostawały lokalne wobec zachowania, którego potrzebują. Szeroki
    barrel nadal istnieje dla zgodności zewnętrznej, ale nowy kod nie powinien
    od niego zależeć.

  </Step>

  <Step title="Zmigruj osadzone rozszerzenia wyników narzędzi do middleware">
    Wbudowane pluginy muszą zastąpić handlery wyników narzędzi
    `api.registerEmbeddedExtensionFactory(...)` przeznaczone wyłącznie dla osadzonego uruchamiacza
    middleware neutralnym względem środowiska wykonawczego.

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

    Zainstalowane pluginy mogą też rejestrować middleware wyników narzędzi, gdy są
    jawnie włączone i deklarują każde docelowe środowisko wykonawcze w
    `contracts.agentToolResultMiddleware`. Niezadeklarowane rejestracje zainstalowanego middleware
    są odrzucane.

  </Step>

  <Step title="Zmigruj handlery natywne dla zatwierdzeń do faktów możliwości">
    Pluginy kanałów obsługujące zatwierdzenia ujawniają teraz natywne zachowanie zatwierdzeń przez
    `approvalCapability.nativeRuntime` oraz współdzielony rejestr kontekstu środowiska wykonawczego.

    Kluczowe zmiany:

    - Zastąp `approvalCapability.handler.loadRuntime(...)` przez
      `approvalCapability.nativeRuntime`
    - Przenieś auth/dostarczanie specyficzne dla zatwierdzeń ze starego okablowania `plugin.auth` /
      `plugin.approvals` do `approvalCapability`
    - `ChannelPlugin.approvals` został usunięty z publicznego kontraktu pluginu kanału;
      przenieś pola dostarczania/natywne/renderowania do `approvalCapability`
    - `plugin.auth` pozostaje tylko dla przepływów logowania/wylogowania kanału; hooki auth
      zatwierdzeń nie są już tam odczytywane przez rdzeń
    - Rejestruj obiekty środowiska wykonawczego należące do kanału, takie jak klienci, tokeny lub aplikacje Bolt,
      przez `openclaw/plugin-sdk/channel-runtime-context`
    - Nie wysyłaj należących do pluginu powiadomień o przekierowaniu z natywnych handlerów zatwierdzeń;
      rdzeń odpowiada teraz za powiadomienia o przekierowaniu gdzie indziej na podstawie rzeczywistych wyników dostarczenia
    - Przekazując `channelRuntime` do `createChannelManager(...)`, podaj
      rzeczywistą powierzchnię `createPluginRuntime().channel`. Częściowe stuby są odrzucane.

    Zobacz `/plugins/sdk-channel-plugins`, aby poznać bieżący układ możliwości zatwierdzeń.

  </Step>

  <Step title="Przeaudytuj zachowanie fallback wrapperów Windows">
    Jeśli twój plugin używa `openclaw/plugin-sdk/windows-spawn`, nierozwiązane wrappery Windows
    `.cmd`/`.bat` teraz domyślnie zawodzą w trybie zamkniętym, chyba że jawnie przekażesz
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

    Jeśli twój wywołujący nie polega celowo na fallback przez powłokę, nie ustawiaj
    `allowShellFallback` i zamiast tego obsłuż rzucony błąd.

  </Step>

  <Step title="Znajdź przestarzałe importy">
    Przeszukaj swój plugin pod kątem importów z jednej z przestarzałych powierzchni:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Zastąp ukierunkowanymi importami">
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

    W przypadku pomocników po stronie hosta użyj wstrzykniętego środowiska wykonawczego pluginu zamiast
    bezpośredniego importowania:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Ten sam wzorzec dotyczy innych starszych pomocników mostka:

    | Stary import | Nowoczesny odpowiednik |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | pomocnicy magazynu sesji | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` nadal istnieje ze względu na zgodność
    zewnętrzną, ale nowy kod powinien importować zawężony zestaw pomocników,
    którego faktycznie potrzebuje:

    | Potrzeba | Import |
    | --- | --- |
    | Pomocnicy kolejki zdarzeń systemowych | `openclaw/plugin-sdk/system-event-runtime` |
    | Pomocnicy wybudzania Heartbeat, zdarzeń i widoczności | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Opróżnianie kolejki oczekujących dostarczeń | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetria aktywności kanału | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Pamięci podręczne deduplikacji w pamięci | `openclaw/plugin-sdk/dedupe-runtime` |
    | Pomocnicy bezpiecznych ścieżek do plików lokalnych/mediów | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch świadomy dyspozytora | `openclaw/plugin-sdk/runtime-fetch` |
    | Pomocnicy proxy i chronionego fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Typy zasad dyspozytora SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typy żądań/zatwierdzeń zgód | `openclaw/plugin-sdk/approval-runtime` |
    | Ładunek odpowiedzi na zgodę i pomocnicy poleceń | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Pomocnicy formatowania błędów | `openclaw/plugin-sdk/error-runtime` |
    | Oczekiwanie na gotowość transportu | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Pomocnicy bezpiecznych tokenów | `openclaw/plugin-sdk/secure-random-runtime` |
    | Ograniczona współbieżność zadań asynchronicznych | `openclaw/plugin-sdk/concurrency-runtime` |
    | Koercja liczbowa | `openclaw/plugin-sdk/number-runtime` |
    | Lokalna dla procesu blokada asynchroniczna | `openclaw/plugin-sdk/async-lock-runtime` |
    | Blokady plików | `openclaw/plugin-sdk/file-lock` |

    Dołączone pluginy są chronione skanerem przed `infra-runtime`, więc kod repozytorium
    nie może wrócić do szerokiego barrela.

  </Step>

  <Step title="Migrate channel route helpers">
    Nowy kod tras kanałów powinien używać `openclaw/plugin-sdk/channel-route`.
    Starsze nazwy route-key i comparable-target pozostają jako aliasy zgodności
    w okresie migracji, ale nowe pluginy powinny używać nazw tras,
    które bezpośrednio opisują zachowanie:

    | Stary pomocnik | Nowoczesny pomocnik |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Nowoczesne pomocniki tras spójnie normalizują `{ channel, to, accountId, threadId }`
    w natywnych zgodach, tłumieniu odpowiedzi, deduplikacji przychodzącej,
    dostarczaniu cron i trasowaniu sesji.

    Nie dodawaj nowych użyć `ChannelMessagingAdapter.parseExplicitTarget` ani
    pomocników załadowanych tras opartych na parserze (`parseExplicitTargetForLoadedChannel`
    lub `resolveRouteTargetForLoadedChannel`) ani
    `resolveChannelRouteTargetWithParser(...)` z `plugin-sdk/channel-route`.
    Te haki są przestarzałe i pozostają tylko dla starszych pluginów w okresie
    migracji. Nowe pluginy kanałów powinny używać
    `messaging.targetResolver.resolveTarget(...)` do normalizacji identyfikatora celu
    i awaryjnej obsługi braku w katalogu, `messaging.inferTargetChatType(...)`, gdy rdzeń
    potrzebuje wczesnego typu peera, oraz `messaging.resolveOutboundSessionRoute(...)`
    do natywnej dla dostawcy tożsamości sesji i wątku.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Odwołanie do ścieżek importu

  <Accordion title="Tabela typowych ścieżek importu">
  | Ścieżka importu | Cel | Kluczowe eksporty |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanoniczna funkcja pomocnicza wejścia Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Starszy zbiorczy reeksport definicji/konstruktorów wejść kanałów | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Eksport głównego schematu konfiguracji | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Funkcja pomocnicza wejścia pojedynczego dostawcy | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Wyspecjalizowane definicje i konstruktory wejść kanałów | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Współdzielone funkcje pomocnicze kreatora konfiguracji | Translator konfiguracji, monity listy dozwolonych, konstruktory statusu konfiguracji |
  | `plugin-sdk/setup-runtime` | Funkcje pomocnicze środowiska wykonawczego w czasie konfiguracji | `createSetupTranslator`, bezpieczne dla importu adaptery poprawek konfiguracji, funkcje pomocnicze notatek wyszukiwania, `promptResolvedAllowFrom`, `splitSetupEntries`, delegowane proxy konfiguracji |
  | `plugin-sdk/setup-adapter-runtime` | Przestarzały alias adaptera konfiguracji | Użyj `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Funkcje pomocnicze narzędzi konfiguracji | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Funkcje pomocnicze wielu kont | Funkcje pomocnicze listy kont/konfiguracji/bramki akcji |
  | `plugin-sdk/account-id` | Funkcje pomocnicze identyfikatorów kont | `DEFAULT_ACCOUNT_ID`, normalizacja identyfikatora konta |
  | `plugin-sdk/account-resolution` | Funkcje pomocnicze wyszukiwania kont | Wyszukiwanie kont + funkcje pomocnicze domyślnego fallbacku |
  | `plugin-sdk/account-helpers` | Wąskie funkcje pomocnicze kont | Funkcje pomocnicze listy kont/akcji konta |
  | `plugin-sdk/channel-setup` | Adaptery kreatora konfiguracji | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, a także `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Prymitywy parowania DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Okablowanie prefiksu odpowiedzi, sygnalizacji pisania i dostarczania źródłowego | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabryki adapterów konfiguracji i funkcje pomocnicze dostępu DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Konstruktory schematów konfiguracji | Tylko współdzielone prymitywy schematu konfiguracji kanału i generyczny konstruktor |
  | `plugin-sdk/bundled-channel-config-schema` | Dołączone schematy konfiguracji | Tylko dołączone pluginy utrzymywane przez OpenClaw; nowe pluginy muszą definiować lokalne schematy pluginu |
  | `plugin-sdk/channel-config-schema-legacy` | Przestarzałe dołączone schematy konfiguracji | Tylko alias zgodności; użyj `plugin-sdk/bundled-channel-config-schema` dla utrzymywanych dołączonych pluginów |
  | `plugin-sdk/telegram-command-config` | Funkcje pomocnicze konfiguracji poleceń Telegram | Normalizacja nazw poleceń, przycinanie opisów, walidacja duplikatów/konfliktów |
  | `plugin-sdk/channel-policy` | Rozstrzyganie zasad grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Przestarzała fasada zgodności | Użyj `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Funkcje pomocnicze kopert przychodzących | Współdzielone funkcje pomocnicze trasy + konstruktora kopert |
  | `plugin-sdk/channel-inbound` | Funkcje pomocnicze odbioru przychodzącego | Budowanie kontekstu, formatowanie, korzenie, uruchamiacze, przygotowana wysyłka odpowiedzi i predykaty wysyłki |
  | `plugin-sdk/messaging-targets` | Przestarzała ścieżka importu parsowania celów | Użyj `plugin-sdk/channel-targets` dla generycznych funkcji pomocniczych parsowania celów, `plugin-sdk/channel-route` dla porównywania tras oraz należących do pluginu `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` dla rozstrzygania celów specyficznego dla dostawcy |
  | `plugin-sdk/outbound-media` | Funkcje pomocnicze mediów wychodzących | Współdzielone ładowanie mediów wychodzących |
  | `plugin-sdk/outbound-send-deps` | Przestarzała fasada zgodności | Użyj `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Funkcje pomocnicze cyklu życia wiadomości wychodzących | Adaptery wiadomości, potwierdzenia, funkcje pomocnicze trwałego wysyłania, funkcje pomocnicze podglądu na żywo/streamingu, opcje odpowiedzi, funkcje pomocnicze cyklu życia, tożsamość wychodząca i planowanie ładunku |
  | `plugin-sdk/channel-streaming` | Przestarzała fasada zgodności | Użyj `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Przestarzała fasada zgodności | Użyj `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Funkcje pomocnicze wiązań wątków | Funkcje pomocnicze cyklu życia wiązań wątków i adapterów |
  | `plugin-sdk/agent-media-payload` | Starsze funkcje pomocnicze ładunku mediów | Konstruktor ładunku mediów agenta dla starszych układów pól |
  | `plugin-sdk/channel-runtime` | Przestarzały shim zgodności | Tylko starsze narzędzia środowiska wykonawczego kanału |
  | `plugin-sdk/channel-send-result` | Typy wyników wysyłania | Typy wyników odpowiedzi |
  | `plugin-sdk/runtime-store` | Trwały magazyn pluginów | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Szerokie funkcje pomocnicze środowiska wykonawczego | Funkcje pomocnicze środowiska wykonawczego/logowania/kopii zapasowych/instalacji pluginów |
  | `plugin-sdk/runtime-env` | Wąskie funkcje pomocnicze środowiska wykonawczego | Logger/środowisko wykonawcze, limit czasu, ponawianie i backoff |
  | `plugin-sdk/plugin-runtime` | Współdzielone funkcje pomocnicze środowiska wykonawczego pluginów | Funkcje pomocnicze poleceń/hooków/http/interakcji pluginów |
  | `plugin-sdk/hook-runtime` | Funkcje pomocnicze potoku hooków | Współdzielone funkcje pomocnicze potoku Webhook/wewnętrznych hooków |
  | `plugin-sdk/lazy-runtime` | Funkcje pomocnicze leniwego środowiska wykonawczego | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Funkcje pomocnicze procesów | Współdzielone funkcje pomocnicze exec |
  | `plugin-sdk/cli-runtime` | Funkcje pomocnicze środowiska wykonawczego CLI | Formatowanie poleceń, oczekiwania, funkcje pomocnicze wersji |
  | `plugin-sdk/gateway-runtime` | Funkcje pomocnicze Gateway | Klient Gateway, funkcja pomocnicza startu gotowego dla pętli zdarzeń oraz funkcje pomocnicze poprawek statusu kanału |
  | `plugin-sdk/config-runtime` | Przestarzały shim zgodności konfiguracji | Preferuj `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` i `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Funkcje pomocnicze poleceń Telegram | Stabilne względem fallbacku funkcje pomocnicze walidacji poleceń Telegram, gdy dołączona powierzchnia kontraktu Telegram jest niedostępna |
  | `plugin-sdk/approval-runtime` | Funkcje pomocnicze monitów zatwierdzania | Ładunek zatwierdzania exec/plugin, funkcje pomocnicze możliwości/profilu zatwierdzania, natywne kierowanie/środowisko wykonawcze zatwierdzania oraz formatowanie ścieżek wyświetlania strukturalnego zatwierdzania |
  | `plugin-sdk/approval-auth-runtime` | Funkcje pomocnicze autoryzacji zatwierdzania | Rozstrzyganie zatwierdzającego, autoryzacja akcji w tym samym czacie |
  | `plugin-sdk/approval-client-runtime` | Funkcje pomocnicze klienta zatwierdzania | Funkcje pomocnicze profilu/filtra natywnego zatwierdzania exec |
  | `plugin-sdk/approval-delivery-runtime` | Funkcje pomocnicze dostarczania zatwierdzeń | Adaptery natywnej możliwości/dostarczania zatwierdzeń |
  | `plugin-sdk/approval-gateway-runtime` | Funkcje pomocnicze Gateway zatwierdzania | Współdzielona funkcja pomocnicza rozstrzygania Gateway zatwierdzania |
  | `plugin-sdk/approval-handler-adapter-runtime` | Funkcje pomocnicze adapterów zatwierdzania | Lekkie funkcje pomocnicze ładowania natywnych adapterów zatwierdzania dla gorących punktów wejścia kanałów |
  | `plugin-sdk/approval-handler-runtime` | Funkcje pomocnicze obsługi zatwierdzania | Szersze funkcje pomocnicze środowiska wykonawczego obsługi zatwierdzania; preferuj węższe powierzchnie adaptera/Gateway, gdy wystarczają |
  | `plugin-sdk/approval-native-runtime` | Funkcje pomocnicze celów zatwierdzania | Funkcje pomocnicze wiązania natywnego celu/konta zatwierdzania |
  | `plugin-sdk/approval-reply-runtime` | Funkcje pomocnicze odpowiedzi zatwierdzania | Funkcje pomocnicze ładunku odpowiedzi zatwierdzania exec/plugin |
  | `plugin-sdk/channel-runtime-context` | Funkcje pomocnicze kontekstu środowiska wykonawczego kanału | Generyczne funkcje pomocnicze rejestrowania/pobierania/obserwowania kontekstu środowiska wykonawczego kanału |
  | `plugin-sdk/security-runtime` | Funkcje pomocnicze bezpieczeństwa | Współdzielone funkcje pomocnicze zaufania, bramkowania DM, plików/ścieżek ograniczonych do korzenia, treści zewnętrznych i zbierania sekretów |
  | `plugin-sdk/ssrf-policy` | Funkcje pomocnicze zasad SSRF | Funkcje pomocnicze listy dozwolonych hostów i zasad sieci prywatnej |
  | `plugin-sdk/ssrf-runtime` | Funkcje pomocnicze środowiska wykonawczego SSRF | Przypięty dyspozytor, chroniony fetch, funkcje pomocnicze zasad SSRF |
  | `plugin-sdk/system-event-runtime` | Funkcje pomocnicze zdarzeń systemowych | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Funkcje pomocnicze Heartbeat | Funkcje pomocnicze wybudzania, zdarzeń i widoczności Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Funkcje pomocnicze kolejki dostarczania | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Funkcje pomocnicze aktywności kanału | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Funkcje pomocnicze deduplikacji | Pamięci podręczne deduplikacji w pamięci |
  | `plugin-sdk/file-access-runtime` | Funkcje pomocnicze dostępu do plików | Funkcje pomocnicze bezpiecznych ścieżek plików lokalnych/mediów |
  | `plugin-sdk/transport-ready-runtime` | Funkcje pomocnicze gotowości transportu | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Funkcje pomocnicze zasad zatwierdzania exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Funkcje pomocnicze ograniczonej pamięci podręcznej | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Funkcje pomocnicze bramkowania diagnostyki | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Funkcje pomocnicze formatowania błędów | `formatUncaughtError`, `isApprovalNotFoundError`, funkcje pomocnicze grafu błędów |
  | `plugin-sdk/fetch-runtime` | Opakowane funkcje pomocnicze fetch/proxy | `resolveFetch`, funkcje pomocnicze proxy, funkcje pomocnicze opcji EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Funkcje pomocnicze normalizacji hostów | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Funkcje pomocnicze ponawiania | `RetryConfig`, `retryAsync`, uruchamiacze zasad |
  | `plugin-sdk/allow-from` | Formatowanie listy dozwolonych i mapowanie danych wejściowych | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Bramkowanie poleceń i funkcje pomocnicze powierzchni poleceń | `resolveControlCommandGate`, funkcje pomocnicze autoryzacji nadawcy, funkcje pomocnicze rejestru poleceń, w tym formatowanie menu argumentów dynamicznych |
  | `plugin-sdk/command-status` | Renderery statusu/pomocy poleceń | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsowanie danych wejściowych sekretów | Funkcje pomocnicze danych wejściowych sekretów |
  | `plugin-sdk/webhook-ingress` | Funkcje pomocnicze żądań Webhook | Narzędzia celów Webhook |
  | `plugin-sdk/webhook-request-guards` | Funkcje pomocnicze strażników ciała Webhook | Funkcje pomocnicze odczytu/limitu ciała żądania |
  | `plugin-sdk/reply-runtime` | Współdzielone środowisko wykonawcze odpowiedzi | Wysyłka przychodząca, heartbeat, planer odpowiedzi, dzielenie na fragmenty |
  | `plugin-sdk/reply-dispatch-runtime` | Wąskie funkcje pomocnicze wysyłki odpowiedzi | Finalizacja, wysyłka dostawcy i funkcje pomocnicze etykiet konwersacji |
  | `plugin-sdk/reply-history` | Funkcje pomocnicze historii odpowiedzi | `createChannelHistoryWindow`; przestarzałe eksporty zgodności funkcji pomocniczych map, takie jak `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planowanie referencji odpowiedzi | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Funkcje pomocnicze fragmentów odpowiedzi | Funkcje pomocnicze dzielenia tekstu/markdownu na fragmenty |
  | `plugin-sdk/session-store-runtime` | Funkcje pomocnicze magazynu sesji | Funkcje pomocnicze ścieżki magazynu + czasu aktualizacji |
  | `plugin-sdk/state-paths` | Funkcje pomocnicze ścieżek stanu | Funkcje pomocnicze katalogów stanu i OAuth |
  | `plugin-sdk/routing` | Pomocniki routingu/klucza sesji | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, pomocniki normalizacji klucza sesji |
  | `plugin-sdk/status-helpers` | Pomocniki statusu kanału | Konstruktory podsumowań statusu kanału/konta, wartości domyślne stanu uruchomieniowego, pomocniki metadanych problemów |
  | `plugin-sdk/target-resolver-runtime` | Pomocniki rozpoznawania celu | Współdzielone pomocniki rozpoznawania celu |
  | `plugin-sdk/string-normalization-runtime` | Pomocniki normalizacji ciągów znaków | Pomocniki normalizacji slugów/ciągów znaków |
  | `plugin-sdk/request-url` | Pomocniki adresów URL żądań | Wyodrębniaj adresy URL jako ciągi znaków z wejść podobnych do żądań |
  | `plugin-sdk/run-command` | Pomocniki poleceń z limitem czasu | Uruchamiacz poleceń z limitem czasu i znormalizowanymi stdout/stderr |
  | `plugin-sdk/param-readers` | Czytniki parametrów | Wspólne czytniki parametrów narzędzi/CLI |
  | `plugin-sdk/tool-payload` | Wyodrębnianie ładunku narzędzia | Wyodrębniaj znormalizowane ładunki z obiektów wyników narzędzi |
  | `plugin-sdk/tool-send` | Wyodrębnianie wysyłki narzędzia | Wyodrębniaj kanoniczne pola celu wysyłki z argumentów narzędzia |
  | `plugin-sdk/temp-path` | Pomocniki ścieżek tymczasowych | Współdzielone pomocniki ścieżek pobierania tymczasowego |
  | `plugin-sdk/logging-core` | Pomocniki rejestrowania | Rejestrator podsystemu i pomocniki redakcji |
  | `plugin-sdk/markdown-table-runtime` | Pomocniki tabel Markdown | Pomocniki trybu tabel Markdown |
  | `plugin-sdk/reply-payload` | Typy odpowiedzi wiadomości | Typy ładunku odpowiedzi |
  | `plugin-sdk/provider-setup` | Wyselekcjonowane pomocniki konfiguracji lokalnych/samodzielnie hostowanych dostawców | Pomocniki wykrywania/konfiguracji samodzielnie hostowanych dostawców |
  | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowane pomocniki konfiguracji samodzielnie hostowanych dostawców zgodnych z OpenAI | Te same pomocniki wykrywania/konfiguracji samodzielnie hostowanych dostawców |
  | `plugin-sdk/provider-auth-runtime` | Pomocniki uwierzytelniania dostawcy w czasie działania | Pomocniki rozpoznawania kluczy API w czasie działania |
  | `plugin-sdk/provider-auth-api-key` | Pomocniki konfiguracji klucza API dostawcy | Pomocniki onboardingu/zapisu profilu dla kluczy API |
  | `plugin-sdk/provider-auth-result` | Pomocniki wyników uwierzytelniania dostawcy | Standardowy konstruktor wyników uwierzytelniania OAuth |
  | `plugin-sdk/provider-selection-runtime` | Pomocniki wyboru dostawcy | Skonfigurowany lub automatyczny wybór dostawcy oraz scalanie surowej konfiguracji dostawcy |
  | `plugin-sdk/provider-env-vars` | Pomocniki zmiennych środowiskowych dostawcy | Pomocniki wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
  | `plugin-sdk/provider-model-shared` | Współdzielone pomocniki modeli/powtórek dostawcy | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory zasad powtórek, pomocniki punktów końcowych dostawcy oraz pomocniki normalizacji identyfikatorów modeli |
  | `plugin-sdk/provider-catalog-shared` | Współdzielone pomocniki katalogu dostawcy | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Łatki onboardingu dostawcy | Pomocniki konfiguracji onboardingu |
  | `plugin-sdk/provider-http` | Pomocniki HTTP dostawcy | Ogólne pomocniki możliwości HTTP/punktów końcowych dostawcy, w tym pomocniki formularzy wieloczęściowych transkrypcji audio |
  | `plugin-sdk/provider-web-fetch` | Pomocniki pobierania z sieci dostawcy | Pomocniki rejestracji/pamięci podręcznej dostawcy pobierania z sieci |
  | `plugin-sdk/provider-web-search-config-contract` | Pomocniki konfiguracji wyszukiwania w sieci dostawcy | Wąskie pomocniki konfiguracji/poświadczeń wyszukiwania w sieci dla dostawców, którzy nie potrzebują okablowania włączania Plugin |
  | `plugin-sdk/provider-web-search-contract` | Pomocniki kontraktu wyszukiwania w sieci dostawcy | Wąskie pomocniki kontraktu konfiguracji/poświadczeń wyszukiwania w sieci, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowe settery/gettery poświadczeń |
  | `plugin-sdk/provider-web-search` | Pomocniki wyszukiwania w sieci dostawcy | Pomocniki rejestracji/pamięci podręcznej/czasu działania dostawcy wyszukiwania w sieci |
  | `plugin-sdk/provider-tools` | Pomocniki zgodności narzędzi/schematów dostawcy | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` oraz czyszczenie schematów + diagnostyka DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Pomocniki użycia dostawcy | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` oraz inne pomocniki użycia dostawców |
  | `plugin-sdk/provider-stream` | Pomocniki wrapperów strumieni dostawcy | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz współdzielone pomocniki wrapperów Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Pomocniki transportu dostawcy | Natywne pomocniki transportu dostawcy, takie jak strzeżone pobieranie, transformacje komunikatów transportowych i zapisywalne strumienie zdarzeń transportu |
  | `plugin-sdk/keyed-async-queue` | Uporządkowana kolejka asynchroniczna | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Współdzielone pomocniki multimediów | Pomocniki pobierania/transformacji/przechowywania multimediów, sondowanie wymiarów wideo oparte na ffprobe oraz konstruktory ładunków multimediów |
  | `plugin-sdk/media-generation-runtime` | Współdzielone pomocniki generowania multimediów | Współdzielone pomocniki przełączania awaryjnego, wyboru kandydatów i komunikatów o brakującym modelu dla generowania obrazów/wideo/muzyki |
  | `plugin-sdk/media-understanding` | Pomocniki rozumienia multimediów | Typy dostawców rozumienia multimediów oraz eksporty pomocników obrazów/audio skierowane do dostawców |
  | `plugin-sdk/text-runtime` | Przestarzały szeroki eksport zgodności tekstu | Użyj `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` i `logging-core` |
  | `plugin-sdk/text-chunking` | Pomocniki dzielenia tekstu na fragmenty | Pomocnik dzielenia tekstu wychodzącego na fragmenty |
  | `plugin-sdk/speech` | Pomocniki mowy | Typy dostawców mowy oraz skierowane do dostawców pomocniki dyrektyw, rejestru i walidacji, a także konstruktor TTS zgodny z OpenAI |
  | `plugin-sdk/speech-core` | Współdzielony rdzeń mowy | Typy dostawców mowy, rejestr, dyrektywy, normalizacja |
  | `plugin-sdk/realtime-transcription` | Pomocniki transkrypcji w czasie rzeczywistym | Typy dostawców, pomocniki rejestru oraz współdzielony pomocnik sesji WebSocket |
  | `plugin-sdk/realtime-voice` | Pomocniki głosu w czasie rzeczywistym | Typy dostawców, pomocniki rejestru/rozpoznawania, pomocniki sesji pomostowych, współdzielone kolejki odpowiedzi głosowej agenta, sterowanie głosem aktywnego uruchomienia, kondycja transkryptu/zdarzeń, tłumienie echa, dopasowywanie pytań konsultacyjnych, koordynacja wymuszonej konsultacji, śledzenie kontekstu tury, śledzenie aktywności wyjściowej oraz szybkie pomocniki konsultacji kontekstu |
  | `plugin-sdk/image-generation` | Pomocniki generowania obrazów | Typy dostawców generowania obrazów oraz pomocniki zasobów obrazów/adresów URL danych i konstruktor dostawcy obrazów zgodny z OpenAI |
  | `plugin-sdk/image-generation-core` | Współdzielony rdzeń generowania obrazów | Typy generowania obrazów, przełączanie awaryjne, uwierzytelnianie i pomocniki rejestru |
  | `plugin-sdk/music-generation` | Pomocniki generowania muzyki | Typy dostawców/żądań/wyników generowania muzyki |
  | `plugin-sdk/music-generation-core` | Współdzielony rdzeń generowania muzyki | Typy generowania muzyki, pomocniki przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie odwołań do modeli |
  | `plugin-sdk/video-generation` | Pomocniki generowania wideo | Typy dostawców/żądań/wyników generowania wideo |
  | `plugin-sdk/video-generation-core` | Współdzielony rdzeń generowania wideo | Typy generowania wideo, pomocniki przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie odwołań do modeli |
  | `plugin-sdk/interactive-runtime` | Pomocniki odpowiedzi interaktywnych | Normalizacja/redukcja ładunku odpowiedzi interaktywnej |
  | `plugin-sdk/channel-config-primitives` | Prymitywy konfiguracji kanału | Wąskie prymitywy schematu konfiguracji kanału |
  | `plugin-sdk/channel-config-writes` | Pomocniki zapisu konfiguracji kanału | Pomocniki autoryzacji zapisu konfiguracji kanału |
  | `plugin-sdk/channel-plugin-common` | Współdzielony wstęp kanału | Współdzielone eksporty wstępu Plugin kanału |
  | `plugin-sdk/channel-status` | Pomocniki statusu kanału | Współdzielone pomocniki migawki/podsumowania statusu kanału |
  | `plugin-sdk/allowlist-config-edit` | Pomocniki konfiguracji listy dozwolonych | Pomocniki edycji/odczytu konfiguracji listy dozwolonych |
  | `plugin-sdk/group-access` | Pomocniki dostępu grupowego | Współdzielone pomocniki decyzji dostępu grupowego |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Przestarzałe fasady zgodności | Użyj `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Pomocniki strażnika Direct-DM | Wąskie pomocniki zasad strażnika przed szyfrowaniem |
  | `plugin-sdk/extension-shared` | Współdzielone pomocniki rozszerzeń | Prymitywy kanału pasywnego/statusu i pomocników ambient proxy |
  | `plugin-sdk/webhook-targets` | Pomocniki celów Webhook | Rejestr celów Webhook i pomocniki instalacji tras |
  | `plugin-sdk/webhook-path` | Przestarzały alias ścieżki Webhook | Użyj `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Współdzielone pomocniki multimediów sieciowych | Pomocniki ładowania zdalnych/lokalnych multimediów |
  | `plugin-sdk/zod` | Przestarzały reeksport zgodności Zod | Importuj `zod` z `zod` bezpośrednio |
  | `plugin-sdk/memory-core` | Pomocniki dołączonego rdzenia pamięci | Powierzchnia pomocników menedżera/konfiguracji/plików/CLI pamięci |
  | `plugin-sdk/memory-core-engine-runtime` | Fasada czasu działania silnika pamięci | Fasada czasu działania indeksu/wyszukiwania pamięci |
  | `plugin-sdk/memory-core-host-embedding-registry` | Rejestr osadzania pamięci | Lekkie pomocniki rejestru dostawców osadzania pamięci |
  | `plugin-sdk/memory-core-host-engine-foundation` | Silnik fundamentu hosta pamięci | Eksporty silnika fundamentu hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Silnik osadzania hosta pamięci | Kontrakty osadzania pamięci, dostęp do rejestru, dostawca lokalny oraz ogólne pomocniki wsadowe/zdalne; konkretni zdalni dostawcy znajdują się w swoich właścicielskich Pluginach |
  | `plugin-sdk/memory-core-host-engine-qmd` | Silnik QMD hosta pamięci | Eksporty silnika QMD hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-storage` | Silnik pamięci masowej hosta pamięci | Eksporty silnika pamięci masowej hosta pamięci |
  | `plugin-sdk/memory-core-host-multimodal` | Pomocniki multimodalne hosta pamięci | Pomocniki multimodalne hosta pamięci |
  | `plugin-sdk/memory-core-host-query` | Pomocniki zapytań hosta pamięci | Pomocniki zapytań hosta pamięci |
  | `plugin-sdk/memory-core-host-secret` | Pomocniki sekretów hosta pamięci | Pomocniki sekretów hosta pamięci |
  | `plugin-sdk/memory-core-host-events` | Przestarzały alias zdarzeń pamięci | Użyj `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Pomocniki statusu hosta pamięci | Pomocniki statusu hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-cli` | Czas działania CLI hosta pamięci | Pomocniki czasu działania CLI hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-core` | Rdzeniowy czas działania hosta pamięci | Pomocniki rdzeniowego czasu działania hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-files` | Pomocniki plików/czasu działania hosta pamięci | Pomocniki plików/czasu działania hosta pamięci |
  | `plugin-sdk/memory-host-core` | Alias rdzeniowego czasu działania hosta pamięci | Neutralny względem dostawcy alias pomocników rdzeniowego czasu działania hosta pamięci |
  | `plugin-sdk/memory-host-events` | Alias dziennika zdarzeń hosta pamięci | Neutralny względem dostawcy alias pomocników dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-host-files` | Przestarzały alias plików/czasu działania pamięci | Użyj `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Zarządzane pomocniki Markdown | Współdzielone pomocniki zarządzanego Markdown dla Pluginów związanych z pamięcią |
  | `plugin-sdk/memory-host-search` | Fasada wyszukiwania Active Memory | Leniwa fasada czasu działania menedżera wyszukiwania Active Memory |
  | `plugin-sdk/memory-host-status` | Przestarzały alias statusu hosta pamięci | Użyj `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Narzędzia testowe | Lokalny dla repozytorium, przestarzały barrel zgodności; użyj ukierunkowanych lokalnych dla repozytorium podścieżek testowych, takich jak `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` i `plugin-sdk/test-fixtures` |
</Accordion>

Ta tabela jest celowo wspólnym podzbiorem migracji, a nie pełną
powierzchnią SDK. Inwentarz entrypointów kompilatora znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`; eksporty pakietów są generowane z
publicznego podzbioru.

Zarezerwowane pomocnicze seams dla wbudowanych pluginów zostały wycofane z publicznej
mapy eksportów SDK z wyjątkiem jawnie udokumentowanych fasad zgodności, takich jak
przestarzały shim `plugin-sdk/discord` zachowany dla opublikowanego pakietu
`@openclaw/discord@2026.3.13`. Pomocniki specyficzne dla właściciela znajdują się
wewnątrz pakietu pluginu będącego właścicielem; współdzielone zachowanie hosta powinno
przechodzić przez ogólne kontrakty SDK, takie jak `plugin-sdk/gateway-runtime`,
`plugin-sdk/security-runtime` i `plugin-sdk/plugin-config-runtime`.

Użyj najwęższego importu pasującego do zadania. Jeśli nie możesz znaleźć eksportu,
sprawdź źródło w `src/plugin-sdk/` albo zapytaj maintainerów, który ogólny kontrakt
powinien być jego właścicielem.

## Aktywne przestarzałe elementy

Węższe przestarzałe elementy, które dotyczą całego plugin SDK, kontraktu providera,
powierzchni runtime i manifestu. Każdy z nich nadal działa dzisiaj, ale zostanie usunięty
w przyszłym wydaniu głównym. Wpis pod każdym elementem mapuje stare API na jego
kanoniczny zamiennik.

<AccordionGroup>
  <Accordion title="buildery pomocy command-auth → command-status">
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
    **Stare**: `resolveInboundMentionRequirement({ facts, policy })` i
    `shouldDropInboundForMention(...)` z
    `openclaw/plugin-sdk/channel-inbound` albo
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nowe**: `resolveInboundMentionDecision({ facts, policy })` - zwraca
    pojedynczy obiekt decyzji zamiast dwóch rozdzielonych wywołań.

    Pluginy kanałów downstream (Slack, Discord, Matrix, MS Teams) już się
    przełączyły.

  </Accordion>

  <Accordion title="Shim runtime kanału i pomocniki akcji kanału">
    `openclaw/plugin-sdk/channel-runtime` jest shimem zgodności dla starszych
    pluginów kanałów. Nie importuj go z nowego kodu; użyj
    `openclaw/plugin-sdk/channel-runtime-context` do rejestrowania obiektów
    runtime.

    Pomocniki `channelActions*` w `openclaw/plugin-sdk/channel-actions` są
    przestarzałe razem z surowymi eksportami kanałowymi "actions". Udostępniaj
    możliwości przez semantyczną powierzchnię `presentation` zamiast tego - pluginy
    kanałów deklarują, co renderują (karty, przyciski, listy wyboru), a nie które
    surowe nazwy akcji akceptują.

  </Accordion>

  <Accordion title="Pomocnik tool() providera wyszukiwania w sieci → createTool() w pluginie">
    **Stare**: fabryka `tool()` z `openclaw/plugin-sdk/provider-web-search`.

    **Nowe**: zaimplementuj `createTool(...)` bezpośrednio w pluginie providera.
    OpenClaw nie potrzebuje już pomocnika SDK do rejestrowania wrappera narzędzia.

  </Accordion>

  <Accordion title="Koperty kanału plaintext → BodyForAgent">
    **Stare**: `formatInboundEnvelope(...)` (oraz
    `ChannelMessageForAgent.channelEnvelope`) do budowania płaskiej koperty promptu
    plaintext z przychodzących wiadomości kanału.

    **Nowe**: `BodyForAgent` plus strukturalne bloki kontekstu użytkownika. Pluginy
    kanałów dołączają metadane routingu (wątek, temat, odpowiedź do, reakcje) jako
    typowane pola zamiast sklejać je w string promptu. Pomocnik
    `formatAgentEnvelope(...)` jest nadal wspierany dla syntetyzowanych kopert
    kierowanych do asystenta, ale przychodzące koperty plaintext są wycofywane.

    Obszary objęte zmianą: `inbound_claim`, `message_received` oraz każdy niestandardowy
    plugin kanału, który przetwarzał tekst `channelEnvelope`.

  </Accordion>

  <Accordion title="hook deactivate → gateway_stop">
    **Stare**: `api.on("deactivate", handler)`.

    **Nowe**: `api.on("gateway_stop", handler)`. Zdarzenie i kontekst są tym samym
    kontraktem sprzątania przy zamykaniu; zmienia się tylko nazwa hooka.

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

    `deactivate` pozostaje podłączony jako przestarzały alias zgodności do czasu po
    2026-08-16.

  </Accordion>

  <Accordion title="hook subagent_spawning → wiązanie wątku przez core">
    **Stare**: `api.on("subagent_spawning", handler)` zwracające
    `threadBindingReady` albo `deliveryOrigin`.

    **Nowe**: pozwól core przygotować wiązania subagenta `thread: true` przez
    adapter session-binding kanału. Używaj `api.on("subagent_spawned", handler)`
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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` pozostają wyłącznie jako
    przestarzałe powierzchnie zgodności, dopóki zewnętrzne pluginy migrują.

  </Accordion>

  <Accordion title="Typy wykrywania providerów → typy katalogu providerów">
    Cztery aliasy typów wykrywania są teraz cienkimi wrapperami nad typami z ery
    katalogu:

    | Stary alias               | Nowy typ                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Do tego starszy statyczny worek `ProviderCapabilities` - pluginy providerów
    powinny używać jawnych hooków providera, takich jak `buildReplayPolicy`,
    `normalizeToolSchemas` i `wrapStreamFn`, zamiast statycznego obiektu.

  </Accordion>

  <Accordion title="Hooki polityki Thinking → resolveThinkingProfile">
    **Stare** (trzy osobne hooki w `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` oraz
    `resolveDefaultThinkingLevel(ctx)`.

    **Nowe**: pojedyncze `resolveThinkingProfile(ctx)`, które zwraca
    `ProviderThinkingProfile` z kanonicznym `id`, opcjonalnym `label` oraz
    uszeregowaną listą poziomów. OpenClaw automatycznie degraduje nieaktualne zapisane
    wartości według rangi profilu.

    Kontekst obejmuje `provider`, `modelId`, opcjonalnie scalone `reasoning`
    oraz opcjonalnie scalone fakty `compat` modelu. Pluginy providerów mogą używać
    tych faktów katalogu, aby udostępnić profil specyficzny dla modelu tylko wtedy,
    gdy skonfigurowany kontrakt żądania go obsługuje.

    Zaimplementuj jeden hook zamiast trzech. Starsze hooki nadal działają w oknie
    deprecjacji, ale nie są komponowane z wynikiem profilu.

  </Accordion>

  <Accordion title="Zewnętrzni providerzy auth → contracts.externalAuthProviders">
    **Stare**: implementowanie zewnętrznych hooków auth bez deklarowania providera
    w manifeście pluginu.

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

  <Accordion title="Wyszukiwanie env-var providera → setup.providers[].envVars">
    **Stare** pole manifestu: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nowe**: odzwierciedl to samo wyszukiwanie env-var w `setup.providers[].envVars`
    w manifeście. Konsoliduje to metadane env dla setup/status w jednym miejscu
    i pozwala uniknąć uruchamiania runtime pluginu tylko po to, aby odpowiedzieć na
    wyszukiwania env-var.

    `providerAuthEnvVars` pozostaje wspierane przez adapter zgodności do zamknięcia
    okna deprecjacji.

  </Accordion>

  <Accordion title="Rejestracja pluginu pamięci → registerMemoryCapability">
    **Stare**: trzy osobne wywołania -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nowe**: jedno wywołanie w API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Te same sloty, pojedyncze wywołanie rejestracji. Dodatkowe pomocniki promptu i korpusu
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) nie są objęte zmianą.

  </Accordion>

  <Accordion title="API providera embeddingów pamięci">
    **Stare**: `api.registerMemoryEmbeddingProvider(...)` plus
    `contracts.memoryEmbeddingProviders`.

    **Nowe**: `api.registerEmbeddingProvider(...)` plus
    `contracts.embeddingProviders`.

    Ogólny kontrakt providera embeddingów nadaje się do ponownego użycia poza pamięcią
    i jest wspieraną ścieżką dla nowych providerów. API rejestracji specyficzne dla pamięci
    pozostaje podłączone jako przestarzała zgodność, dopóki istniejący providerzy migrują.
    Raporty inspekcji pluginów zgłaszają użycie poza wbudowanymi pluginami jako dług zgodności.

  </Accordion>

  <Accordion title="Zmieniono nazwy typów wiadomości sesji subagenta">
    Dwa starsze aliasy typów nadal eksportowane z `src/plugins/runtime/types.ts`:

    | Stare                         | Nowe                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Metoda runtime `readSession` jest przestarzała na rzecz
    `getSessionMessages`. Ta sama sygnatura; stara metoda wywołuje nową.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Stare**: `runtime.tasks.flow` (liczba pojedyncza) zwracało aktywny accessor task-flow.

    **Nowe**: `runtime.tasks.managedFlows` zachowuje runtime mutacji zarządzanego TaskFlow
    dla pluginów, które tworzą, aktualizują, anulują albo uruchamiają zadania potomne z
    flow. Użyj `runtime.tasks.flows`, gdy plugin potrzebuje tylko odczytów opartych na DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Wbudowane fabryki extension → middleware wyników narzędzi agenta">
    Omówione powyżej w sekcji "Jak migrować → Migruj wbudowane extension wyników narzędzi do
    middleware". Uwzględnione tutaj dla kompletności: usunięta ścieżka tylko dla embedded-runnera
    `api.registerEmbeddedExtensionFactory(...)` została zastąpiona przez
    `api.registerAgentToolResultMiddleware(...)` z jawną listą runtime w
    `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` re-eksportowany z `openclaw/plugin-sdk` jest teraz
    jednowierszowym aliasem dla `OpenClawConfig`. Preferuj kanoniczną nazwę.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Deprecjacje na poziomie extension (wewnątrz wbudowanych pluginów kanałów/providerów pod
`extensions/`) są śledzone w ich własnych barrelach `api.ts` i `runtime-api.ts`.
Nie wpływają na kontrakty pluginów zewnętrznych i nie są tutaj wymienione.
Jeśli korzystasz bezpośrednio z lokalnego barrela wbudowanego pluginu, przeczytaj
komentarze deprecjacji w tym barrelu przed aktualizacją.
</Note>

## Harmonogram usunięcia

| Kiedy                       | Co się dzieje                                                                    |
| --------------------------- | -------------------------------------------------------------------------------- |
| **Teraz**                   | Przestarzałe powierzchnie emitują ostrzeżenia w czasie wykonywania               |
| **Następne wydanie główne** | Przestarzałe powierzchnie zostaną usunięte; pluginy nadal ich używające zawiodą |

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
- [Omówienie SDK](/pl/plugins/sdk-overview) - pełna dokumentacja importów podścieżek
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) - tworzenie pluginów kanałów
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) - tworzenie pluginów dostawców
- [Wewnętrzne mechanizmy pluginów](/pl/plugins/architecture) - szczegółowe omówienie architektury
- [Manifest pluginu](/pl/plugins/manifest) - dokumentacja schematu manifestu
