---
read_when:
    - Widzisz ostrzeżenie OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Widzisz ostrzeżenie OPENCLAW_EXTENSION_API_DEPRECATED
    - Użyto api.registerEmbeddedExtensionFactory przed OpenClaw 2026.4.25
    - Aktualizujesz Plugin do nowoczesnej architektury Pluginów
    - Utrzymujesz zewnętrzny Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Migruj ze starszej warstwy zgodności wstecznej do nowoczesnego SDK Plugin
title: Migracja Plugin SDK
x-i18n:
    generated_at: "2026-05-06T09:24:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: f629f6e3f9a0c122f3065d9b0b6b418e1c1ba29d42aff9ed025d61189be3e42a
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw przeszedł z szerokiej warstwy zgodności wstecznej na nowoczesną architekturę pluginów
z ukierunkowanymi, udokumentowanymi importami. Jeśli Twój plugin został zbudowany przed
nową architekturą, ten przewodnik pomoże Ci przeprowadzić migrację.

## Co się zmienia

Stary system pluginów udostępniał dwie bardzo szerokie powierzchnie, które pozwalały pluginom importować
wszystko, czego potrzebowały, z jednego punktu wejścia:

- **`openclaw/plugin-sdk/compat`** - pojedynczy import, który ponownie eksportował dziesiątki
  helperów. Został wprowadzony, aby starsze pluginy oparte na hookach nadal działały, gdy
  budowano nową architekturę pluginów.
- **`openclaw/plugin-sdk/infra-runtime`** - szeroki barrel helperów runtime, który
  mieszał zdarzenia systemowe, stan heartbeat, kolejki dostarczania, helpery fetch/proxy,
  helpery plików, typy zatwierdzeń i niepowiązane narzędzia.
- **`openclaw/plugin-sdk/config-runtime`** - szeroki barrel zgodności konfiguracji,
  który w oknie migracji nadal zawiera przestarzałe bezpośrednie helpery load/write.
- **`openclaw/extension-api`** - most, który dawał pluginom bezpośredni dostęp do
  helperów po stronie hosta, takich jak wbudowany runner agenta.
- **`api.registerEmbeddedExtensionFactory(...)`** - usunięty hook wyłącznie dla Pi, dotyczący pakietowanych
  rozszerzeń, który mógł obserwować zdarzenia wbudowanego runnera, takie jak
  `tool_result`.

Szerokie powierzchnie importu są teraz **przestarzałe**. Nadal działają w runtime,
ale nowe pluginy nie mogą ich używać, a istniejące pluginy powinny przeprowadzić migrację, zanim
następne wydanie główne je usunie. API rejestracji fabryki wbudowanych rozszerzeń wyłącznie dla Pi
zostało usunięte; zamiast tego użyj middleware wyniku narzędzia.

OpenClaw nie usuwa ani nie reinterpretuje udokumentowanego zachowania pluginów w tej samej
zmianie, która wprowadza zamiennik. Zmiany kontraktu powodujące niezgodność muszą najpierw przejść
przez adapter zgodności, diagnostykę, dokumentację i okno wycofania.
Dotyczy to importów SDK, pól manifestu, API konfiguracji, hooków i zachowania
rejestracji runtime.

<Warning>
  Warstwa zgodności wstecznej zostanie usunięta w przyszłym wydaniu głównym.
  Pluginy, które nadal importują z tych powierzchni, przestaną wtedy działać.
  Rejestracje fabryk wbudowanych rozszerzeń wyłącznie dla Pi już się nie ładują.
</Warning>

## Dlaczego to się zmieniło

Stare podejście powodowało problemy:

- **Wolne uruchamianie** - import jednego helpera ładował dziesiątki niepowiązanych modułów
- **Zależności cykliczne** - szerokie ponowne eksporty ułatwiały tworzenie cykli importów
- **Niejasna powierzchnia API** - brak sposobu, aby stwierdzić, które eksporty były stabilne, a które wewnętrzne

Nowoczesne SDK pluginów rozwiązuje ten problem: każda ścieżka importu (`openclaw/plugin-sdk/\<subpath\>`)
jest małym, samodzielnym modułem o jasnym celu i udokumentowanym kontrakcie.

Starsze pomocnicze punkty integracji providerów dla pakietowanych kanałów również zniknęły.
Helpery oznaczone marką kanału były prywatnymi skrótami mono-repo, a nie stabilnymi
kontraktami pluginów. Zamiast nich używaj wąskich, ogólnych podścieżek SDK. W obszarze roboczym pakietowanego
pluginu trzymaj helpery należące do providera w jego własnym `api.ts` lub
`runtime-api.ts`.

Aktualne przykłady pakietowanych providerów:

- Anthropic trzyma helpery strumieni specyficzne dla Claude we własnym punkcie integracji `api.ts` /
  `contract-api.ts`
- OpenAI trzyma buildery providera, helpery modeli domyślnych i buildery providera realtime
  we własnym `api.ts`
- OpenRouter trzyma builder providera oraz helpery onboardingu/konfiguracji we własnym
  `api.ts`

## Plan migracji Talk i głosu realtime

Kod realtime voice, telefonii, spotkań i przeglądarkowego Talk przechodzi z
lokalnego dla powierzchni księgowania tur na współdzielony kontroler sesji Talk eksportowany przez
`openclaw/plugin-sdk/realtime-voice`. Nowy kontroler zarządza wspólną kopertą zdarzeń Talk,
stanem aktywnej tury, stanem przechwytywania, stanem wyjściowego audio, historią ostatnich
zdarzeń oraz odrzucaniem nieaktualnych tur. Pluginy providerów powinny nadal zarządzać
sesjami realtime specyficznymi dla dostawcy; pluginy powierzchni powinny nadal zarządzać przechwytywaniem,
odtwarzaniem, telefonią i specyfiką spotkań.

Ta migracja Talk celowo wprowadza czyste przełamanie:

1. Utrzymaj współdzielony kontroler i prymitywy runtime w
   `plugin-sdk/realtime-voice`.
2. Przenieś pakietowane powierzchnie na współdzielony kontroler: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime oraz natywne push-to-talk.
3. Zastąp stare rodziny RPC Talk finalnym API `talk.session.*` i
   `talk.client.*`.
4. Ogłoś jeden aktywny kanał zdarzeń Talk w Gateway
   `hello-ok.features.events`: `talk.event`.
5. Usuń stary endpoint HTTP realtime i każdą ścieżkę nadpisywania instrukcji
   w czasie żądania.

Nowy kod nie powinien wywoływać `createTalkEventSequencer(...)` bezpośrednio, chyba że
implementuje niskopoziomowy adapter lub fixture testowy. Preferuj współdzielony kontroler,
aby zdarzenia o zakresie tury nie mogły być emitowane bez identyfikatora tury, nieaktualne wywołania `turnEnd` /
`turnCancel` nie mogły wyczyścić nowszej aktywnej tury, a zdarzenia cyklu życia wyjściowego audio
pozostawały spójne w telefonii, spotkaniach, browser relay, managed-room
handoff i natywnych klientach Talk.

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
ponieważ przeglądarka zarządza negocjacją providera i transportem mediów, podczas gdy
Gateway zarządza poświadczeniami, instrukcjami i polityką narzędzi. `talk.session.*` jest
wspólną powierzchnią zarządzaną przez Gateway dla gateway-relay realtime, gateway-relay
transcription oraz sesji STT/TTS natywnych managed-room.

Starsze konfiguracje, które umieszczały selektory realtime obok `talk.provider` /
`talk.providers`, należy naprawić za pomocą `openclaw doctor --fix`; runtime Talk
nie reinterpretuje konfiguracji providera speech/TTS jako konfiguracji providera realtime.

Obsługiwane kombinacje `talk.session.create` są celowo ograniczone:

| Tryb            | Transport       | Brain           | Właściciel        | Uwagi                                                                                                              |
| --------------- | --------------- | --------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway           | Pełnodupleksowe audio providera mostkowane przez Gateway; wywołania narzędzi są kierowane przez narzędzie agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway           | Tylko strumieniowe STT; wywołujący wysyłają wejściowe audio i otrzymują zdarzenia transkrypcji.                    |
| `stt-tts`       | `managed-room`  | `agent-consult` | Pokój natywny/klienta | Pokoje w stylu push-to-talk i walkie-talkie, w których klient zarządza przechwytywaniem/odtwarzaniem, a Gateway stanem tury. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Pokój natywny/klienta | Tryb pokoju tylko dla administratorów, dla zaufanych powierzchni first-party, które wykonują akcje narzędzi Gateway bezpośrednio. |

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

Ujednolicone słownictwo sterowania również jest celowo wąskie:

| Metoda                          | Dotyczy                                                 | Kontrakt                                                                                      |
| ------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Dołącz fragment audio PCM w base64 do sesji providera należącej do tego samego połączenia Gateway. |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Rozpocznij turę użytkownika managed-room.                                                     |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Zakończ aktywną turę po walidacji nieaktualnej tury.                                          |
| `talk.session.cancelTurn`       | wszystkie sesje należące do Gateway                     | Anuluj aktywne przechwytywanie/provider/agent/TTS dla tury.                                   |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Zatrzymaj wyjściowe audio asystenta bez koniecznego kończenia tury użytkownika.               |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Dokończ wywołanie narzędzia providera wyemitowane przez relay.                                |
| `talk.session.close`            | wszystkie ujednolicone sesje                            | Zatrzymaj sesje relay albo unieważnij stan managed-room, a następnie zapomnij identyfikator ujednoliconej sesji. |

Nie wprowadzaj w core specjalnych przypadków providera ani platformy, aby to zadziałało.
Core zarządza semantyką sesji Talk. Pluginy providerów zarządzają konfiguracją sesji dostawców.
Voice-call i Google Meet zarządzają adapterami telefonii/spotkań. Aplikacje przeglądarkowe i natywne
zarządzają UX przechwytywania/odtwarzania urządzenia.

## Polityka zgodności

Dla zewnętrznych pluginów prace nad zgodnością przebiegają w tej kolejności:

1. dodaj nowy kontrakt
2. utrzymaj stare zachowanie podłączone przez adapter zgodności
3. emituj diagnostykę lub ostrzeżenie, które nazywa starą ścieżkę i zamiennik
4. pokryj obie ścieżki testami
5. udokumentuj wycofanie i ścieżkę migracji
6. usuń dopiero po ogłoszonym oknie migracji, zwykle w wydaniu głównym

  Maintainerzy mogą audytować bieżącą kolejkę migracji za pomocą
  `pnpm plugins:boundary-report`. Użyj `pnpm plugins:boundary-report:summary`, aby
  uzyskać kompaktowe zliczenia, `--owner <id>` dla jednego pluginu lub właściciela
  zgodności oraz `pnpm plugins:boundary-report:ci`, gdy bramka CI ma kończyć się
  niepowodzeniem dla wymagalnych rekordów zgodności, zarezerwowanych importów SDK
  między właścicielami albo nieużywanych zarezerwowanych podścieżek SDK. Raport
  grupuje przestarzałe rekordy zgodności według daty usunięcia, zlicza lokalne
  odwołania w kodzie i dokumentacji, ujawnia zarezerwowane importy SDK między
  właścicielami oraz podsumowuje prywatny most SDK hosta pamięci, aby czyszczenie
  zgodności pozostawało jawne zamiast polegać na doraźnych wyszukiwaniach.
  Zarezerwowane podścieżki SDK muszą mieć śledzone użycie właściciela; nieużywane
  zarezerwowane eksporty pomocnicze należy usunąć z publicznego SDK.

  Jeśli pole manifestu jest nadal akceptowane, autorzy pluginów mogą nadal go
  używać, dopóki dokumentacja i diagnostyka nie stwierdzą inaczej. Nowy kod
  powinien preferować udokumentowany zamiennik, ale istniejące pluginy nie powinny
  psuć się podczas zwykłych wydań podrzędnych.

  ## Jak migrować

  <Steps>
  <Step title="Migruj helpery ładowania/zapisu konfiguracji runtime">
    Dołączone pluginy powinny przestać wywoływać bezpośrednio
    `api.runtime.config.loadConfig()` i
    `api.runtime.config.writeConfigFile(...)`. Preferuj konfigurację, która
    została już przekazana do aktywnej ścieżki wywołania. Długotrwałe handlery,
    które potrzebują bieżącego zrzutu procesu, mogą używać
    `api.runtime.config.current()`. Długotrwałe narzędzia agenta powinny używać
    `ctx.getRuntimeConfig()` z kontekstu narzędzia wewnątrz `execute`, aby
    narzędzie utworzone przed zapisem konfiguracji nadal widziało odświeżoną
    konfigurację runtime.

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
    że zmiana wymaga czystego restartu gatewaya, oraz
    `afterWrite: { mode: "none", reason: "..." }` tylko wtedy, gdy wywołujący
    posiada dalszą obsługę i celowo chce pominąć planistę przeładowania.
    Wyniki mutacji zawierają typowane podsumowanie `followUp` dla testów i
    logowania; gateway pozostaje odpowiedzialny za zastosowanie lub zaplanowanie
    restartu. `loadConfig` i `writeConfigFile` pozostają jako przestarzałe
    helpery zgodności dla zewnętrznych pluginów w oknie migracji i ostrzegają
    raz z kodem zgodności `runtime-config-load-write`. Dołączone pluginy i kod
    runtime repozytorium są chronione przez zabezpieczenia skanera w
    `pnpm check:deprecated-internal-config-api` i
    `pnpm check:no-runtime-action-load-config`: nowe użycie w produkcyjnym
    pluginie kończy się bezwzględnym niepowodzeniem, bezpośrednie zapisy
    konfiguracji kończą się niepowodzeniem, metody serwera gatewaya muszą używać
    zrzutu runtime żądania, helpery wysyłania/akcji/klienta kanału runtime muszą
    otrzymywać konfigurację ze swojej granicy, a długotrwałe moduły runtime mają
    zero dozwolonych otaczających wywołań `loadConfig()`.

    Nowy kod pluginu powinien także unikać importowania szerokiego barrela
    zgodności `openclaw/plugin-sdk/config-runtime`. Użyj wąskiej podścieżki SDK,
    która odpowiada zadaniu:

    | Potrzeba | Import |
    | --- | --- |
    | Typy konfiguracji, takie jak `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Asercje już załadowanej konfiguracji i wyszukiwanie konfiguracji punktu wejścia pluginu | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Odczyty bieżącego zrzutu runtime | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Zapisy konfiguracji | `openclaw/plugin-sdk/config-mutation` |
    | Helpery magazynu sesji | `openclaw/plugin-sdk/session-store-runtime` |
    | Konfiguracja tabel Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Helpery runtime polityki grup | `openclaw/plugin-sdk/runtime-group-policy` |
    | Rozwiązywanie wejścia sekretu | `openclaw/plugin-sdk/secret-input-runtime` |
    | Nadpisania modelu/sesji | `openclaw/plugin-sdk/model-session-runtime` |

    Dołączone pluginy i ich testy są chronione skanerem przed szerokim barrelem,
    aby importy i mocki pozostawały lokalne względem potrzebnego im zachowania.
    Szeroki barrel nadal istnieje dla zgodności zewnętrznej, ale nowy kod nie
    powinien od niego zależeć.

  </Step>

  <Step title="Migruj rozszerzenia wyniku narzędzia Pi do middleware">
    Dołączone pluginy muszą zastąpić obsługę wyników narzędzi wyłącznie dla Pi
    `api.registerEmbeddedExtensionFactory(...)` middleware neutralnym względem
    runtime.

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

    Zewnętrzne pluginy nie mogą rejestrować middleware wyniku narzędzia, ponieważ
    może ono przepisać wysoce zaufane wyjście narzędzia, zanim zobaczy je model.

  </Step>

  <Step title="Migruj natywne handlery zatwierdzeń do faktów capability">
    Pluginy kanałów obsługujące zatwierdzenia udostępniają teraz natywne
    zachowanie zatwierdzeń przez `approvalCapability.nativeRuntime` oraz
    współdzielony rejestr kontekstu runtime.

    Kluczowe zmiany:

    - Zastąp `approvalCapability.handler.loadRuntime(...)` przez
      `approvalCapability.nativeRuntime`
    - Przenieś specyficzne dla zatwierdzeń uwierzytelnianie/dostarczanie z
      przestarzałego okablowania `plugin.auth` / `plugin.approvals` do
      `approvalCapability`
    - `ChannelPlugin.approvals` zostało usunięte z publicznego kontraktu pluginu
      kanału; przenieś pola delivery/native/render do `approvalCapability`
    - `plugin.auth` pozostaje tylko dla przepływów logowania/wylogowania kanału;
      hooki uwierzytelniania zatwierdzeń w tym miejscu nie są już odczytywane
      przez core
    - Rejestruj obiekty runtime należące do kanału, takie jak klienty, tokeny lub
      aplikacje Bolt, przez `openclaw/plugin-sdk/channel-runtime-context`
    - Nie wysyłaj z natywnych handlerów zatwierdzeń powiadomień o przekierowaniu
      należących do pluginu; core posiada teraz powiadomienia o przekierowaniu
      gdzie indziej na podstawie rzeczywistych wyników dostarczenia
    - Przekazując `channelRuntime` do `createChannelManager(...)`, podaj
      rzeczywistą powierzchnię `createPluginRuntime().channel`. Częściowe stuby
      są odrzucane.

    Zobacz `/plugins/sdk-channel-plugins`, aby poznać bieżący układ capability
    zatwierdzeń.

  </Step>

  <Step title="Audytuj zachowanie fallback wrappera Windows">
    Jeśli twój plugin używa `openclaw/plugin-sdk/windows-spawn`, nierozwiązane
    wrappery Windows `.cmd`/`.bat` kończą się teraz bezpiecznym niepowodzeniem,
    chyba że jawnie przekażesz `allowShellFallback: true`.

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

    Jeśli twój wywołujący nie polega celowo na fallbacku powłoki, nie ustawiaj
    `allowShellFallback` i zamiast tego obsłuż rzucony błąd.

  </Step>

  <Step title="Znajdź przestarzałe importy">
    Wyszukaj w swoim pluginie importy z dowolnej z przestarzałych powierzchni:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Zastąp ukierunkowanymi importami">
    Każdy eksport ze starej powierzchni mapuje się na konkretną nowoczesną
    ścieżkę importu:

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

    Dla helperów po stronie hosta używaj wstrzykniętego runtime pluginu zamiast
    importować bezpośrednio:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Ten sam wzorzec dotyczy innych przestarzałych helperów mostu:

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
    `openclaw/plugin-sdk/infra-runtime` nadal istnieje dla zgodności zewnętrznej,
    ale nowy kod powinien importować ukierunkowaną powierzchnię helperów, której
    rzeczywiście potrzebuje:

    | Potrzeba | Import |
    | --- | --- |
    | Helpery kolejki zdarzeń systemowych | `openclaw/plugin-sdk/system-event-runtime` |
    | Zdarzenie Heartbeat i helpery widoczności | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Opróżnianie kolejki oczekujących dostarczeń | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetria aktywności kanału | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Deduplicate cache w pamięci | `openclaw/plugin-sdk/dedupe-runtime` |
    | Bezpieczne helpery ścieżek plików lokalnych/mediów | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch świadomy dispatchera | `openclaw/plugin-sdk/runtime-fetch` |
    | Helpery proxy i strzeżonego fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Typy polityki dispatchera SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typy żądania/rozwiązania zatwierdzenia | `openclaw/plugin-sdk/approval-runtime` |
    | Helpery ładunku odpowiedzi zatwierdzenia i poleceń | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helpery formatowania błędów | `openclaw/plugin-sdk/error-runtime` |
    | Oczekiwanie na gotowość transportu | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helpery bezpiecznych tokenów | `openclaw/plugin-sdk/secure-random-runtime` |
    | Ograniczona współbieżność zadań asynchronicznych | `openclaw/plugin-sdk/concurrency-runtime` |
    | Koercja liczbowa | `openclaw/plugin-sdk/number-runtime` |
    | Asynchroniczna blokada lokalna dla procesu | `openclaw/plugin-sdk/async-lock-runtime` |
    | Blokady plików | `openclaw/plugin-sdk/file-lock` |

    Dołączone pluginy są chronione skanerem przed `infra-runtime`, więc kod
    repozytorium nie może wrócić do szerokiego barrela.

  </Step>

  <Step title="Migruj helpery tras kanałów">
    Nowy kod tras kanałów powinien używać `openclaw/plugin-sdk/channel-route`.
    Starsze nazwy klucza trasy i porównywalnego celu pozostają aliasami
    zgodności w oknie migracji, ale nowe pluginy powinny używać nazw tras, które
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

    Nowoczesne funkcje pomocnicze routingu normalizują `{ channel, to, accountId, threadId }`
    spójnie w natywnych zatwierdzeniach, pomijaniu odpowiedzi, deduplikacji przychodzącej,
    dostarczaniu Cron i routingu sesji. Jeśli Twój Plugin ma własną
    gramatykę celu, użyj `resolveChannelRouteTargetWithParser(...)`, aby dostosować ten
    parser do tego samego kontraktu celu routingu.

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
  | Ścieżka importu | Cel | Kluczowe eksporty |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanoniczny pomocnik punktu wejścia Pluginu | `definePluginEntry` |
  | `plugin-sdk/core` | Starszy zbiorczy reeksport dla definicji/konstruktorów punktów wejścia kanałów | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Eksport głównego schematu konfiguracji | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Pomocnik punktu wejścia pojedynczego dostawcy | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Skoncentrowane definicje i konstruktory punktów wejścia kanałów | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Współdzielone pomocniki kreatora konfiguracji | Prompty listy dozwolonych, konstruktory statusu konfiguracji |
  | `plugin-sdk/setup-runtime` | Pomocniki środowiska wykonawczego czasu konfiguracji | Bezpieczne do importu adaptery łatek konfiguracji, pomocniki notatek wyszukiwania, `promptResolvedAllowFrom`, `splitSetupEntries`, delegowane proxy konfiguracji |
  | `plugin-sdk/setup-adapter-runtime` | Pomocniki adapterów konfiguracji | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Pomocniki narzędzi konfiguracji | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Pomocniki wielu kont | Pomocniki listy kont/konfiguracji/bramki akcji |
  | `plugin-sdk/account-id` | Pomocniki identyfikatora konta | `DEFAULT_ACCOUNT_ID`, normalizacja identyfikatora konta |
  | `plugin-sdk/account-resolution` | Pomocniki wyszukiwania kont | Pomocniki wyszukiwania kont i domyślnego fallbacku |
  | `plugin-sdk/account-helpers` | Wąskie pomocniki kont | Pomocniki listy kont/akcji konta |
  | `plugin-sdk/channel-setup` | Adaptery kreatora konfiguracji | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Prymitywy parowania DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Okablowanie prefiksu odpowiedzi, pisania i dostarczania źródła | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabryki adapterów konfiguracji i pomocniki dostępu DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Konstruktory schematów konfiguracji | Współdzielone prymitywy schematu konfiguracji kanału i tylko generyczny konstruktor |
  | `plugin-sdk/bundled-channel-config-schema` | Dołączone schematy konfiguracji | Tylko dołączone Pluginy utrzymywane przez OpenClaw; nowe Pluginy muszą definiować schematy lokalne dla Pluginu |
  | `plugin-sdk/channel-config-schema-legacy` | Przestarzałe dołączone schematy konfiguracji | Tylko alias zgodności; używaj `plugin-sdk/bundled-channel-config-schema` dla utrzymywanych dołączonych Pluginów |
  | `plugin-sdk/telegram-command-config` | Pomocniki konfiguracji poleceń Telegram | Normalizacja nazw poleceń, przycinanie opisów, walidacja duplikatów/konfliktów |
  | `plugin-sdk/channel-policy` | Rozwiązywanie polityk grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Pomocniki statusu konta i cyklu życia strumienia szkicu | `createAccountStatusSink`, pomocniki finalizacji podglądu szkicu |
  | `plugin-sdk/inbound-envelope` | Pomocniki kopert przychodzących | Współdzielone pomocniki trasy i konstruktora koperty |
  | `plugin-sdk/inbound-reply-dispatch` | Pomocniki odpowiedzi przychodzących | Współdzielone pomocniki rejestrowania i wysyłania |
  | `plugin-sdk/messaging-targets` | Parsowanie celów wiadomości | Pomocniki parsowania/dopasowywania celów |
  | `plugin-sdk/outbound-media` | Pomocniki mediów wychodzących | Współdzielone wczytywanie mediów wychodzących |
  | `plugin-sdk/outbound-send-deps` | Pomocniki zależności wysyłania wychodzącego | Lekkie wyszukiwanie `resolveOutboundSendDep` bez importowania pełnego środowiska wykonawczego wychodzącego |
  | `plugin-sdk/outbound-runtime` | Pomocniki środowiska wykonawczego wychodzącego | Pomocniki dostarczania wychodzącego, delegata tożsamości/wysyłania, sesji, formatowania i planowania ładunku |
  | `plugin-sdk/thread-bindings-runtime` | Pomocniki powiązań wątków | Pomocniki cyklu życia powiązań wątków i adapterów |
  | `plugin-sdk/agent-media-payload` | Starsze pomocniki ładunku mediów | Konstruktor ładunku mediów agenta dla starszych układów pól |
  | `plugin-sdk/channel-runtime` | Przestarzała warstwa zgodności | Tylko starsze narzędzia środowiska wykonawczego kanału |
  | `plugin-sdk/channel-send-result` | Typy wyników wysyłania | Typy wyników odpowiedzi |
  | `plugin-sdk/runtime-store` | Trwały magazyn Pluginu | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Szerokie pomocniki środowiska wykonawczego | Pomocniki środowiska wykonawczego/logowania/kopii zapasowej/instalacji Pluginu |
  | `plugin-sdk/runtime-env` | Wąskie pomocniki środowiska wykonawczego | Logger/środowisko wykonawcze, limit czasu, ponawianie i pomocniki backoffu |
  | `plugin-sdk/plugin-runtime` | Współdzielone pomocniki środowiska wykonawczego Pluginu | Pomocniki poleceń/hooków/http/interaktywne Pluginu |
  | `plugin-sdk/hook-runtime` | Pomocniki potoku hooków | Współdzielone pomocniki potoku Webhook/wewnętrznych hooków |
  | `plugin-sdk/lazy-runtime` | Pomocniki leniwego środowiska wykonawczego | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Pomocniki procesów | Współdzielone pomocniki exec |
  | `plugin-sdk/cli-runtime` | Pomocniki środowiska wykonawczego CLI | Formatowanie poleceń, oczekiwania, pomocniki wersji |
  | `plugin-sdk/gateway-runtime` | Pomocniki Gateway | Klient Gateway, pomocnik startu gotowości pętli zdarzeń i pomocniki łatek statusu kanału |
  | `plugin-sdk/config-runtime` | Przestarzała warstwa zgodności konfiguracji | Preferuj `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` i `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Pomocniki poleceń Telegram | Stabilne względem fallbacku pomocniki walidacji poleceń Telegram, gdy powierzchnia kontraktu dołączonego Telegram jest niedostępna |
  | `plugin-sdk/approval-runtime` | Pomocniki promptów zatwierdzeń | Ładunek zatwierdzenia exec/Pluginu, pomocniki zdolności/profilu zatwierdzania, natywne pomocniki routingu/środowiska wykonawczego zatwierdzania oraz formatowanie ścieżki wyświetlania strukturalnego zatwierdzenia |
  | `plugin-sdk/approval-auth-runtime` | Pomocniki autoryzacji zatwierdzeń | Rozwiązywanie zatwierdzającego, autoryzacja akcji w tym samym czacie |
  | `plugin-sdk/approval-client-runtime` | Pomocniki klienta zatwierdzeń | Pomocniki natywnego profilu/filtra zatwierdzania exec |
  | `plugin-sdk/approval-delivery-runtime` | Pomocniki dostarczania zatwierdzeń | Adaptery natywnej zdolności/dostarczania zatwierdzeń |
  | `plugin-sdk/approval-gateway-runtime` | Pomocniki Gateway zatwierdzeń | Współdzielony pomocnik rozwiązywania Gateway zatwierdzeń |
  | `plugin-sdk/approval-handler-adapter-runtime` | Pomocniki adapterów zatwierdzeń | Lekkie pomocniki ładowania natywnego adaptera zatwierdzeń dla gorących punktów wejścia kanałów |
  | `plugin-sdk/approval-handler-runtime` | Pomocniki obsługi zatwierdzeń | Szersze pomocniki środowiska wykonawczego obsługi zatwierdzeń; preferuj węższe powierzchnie adaptera/Gateway, gdy wystarczają |
  | `plugin-sdk/approval-native-runtime` | Pomocniki celów zatwierdzeń | Pomocniki powiązania natywnego celu/konta zatwierdzeń |
  | `plugin-sdk/approval-reply-runtime` | Pomocniki odpowiedzi zatwierdzeń | Pomocniki ładunku odpowiedzi zatwierdzenia exec/Pluginu |
  | `plugin-sdk/channel-runtime-context` | Pomocniki kontekstu środowiska wykonawczego kanału | Generyczne pomocniki rejestrowania/pobierania/obserwowania kontekstu środowiska wykonawczego kanału |
  | `plugin-sdk/security-runtime` | Pomocniki bezpieczeństwa | Współdzielone pomocniki zaufania, bramkowania DM, plików/ścieżek ograniczonych do katalogu głównego, treści zewnętrznych i zbierania sekretów |
  | `plugin-sdk/ssrf-policy` | Pomocniki polityki SSRF | Pomocniki listy dozwolonych hostów i polityki sieci prywatnej |
  | `plugin-sdk/ssrf-runtime` | Pomocniki środowiska wykonawczego SSRF | Przypięty dyspozytor, chronione fetch, pomocniki polityki SSRF |
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
  | `plugin-sdk/fetch-runtime` | Opakowane pomocniki fetch/proxy | `resolveFetch`, pomocniki proxy, pomocniki opcji EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Pomocniki normalizacji hosta | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Pomocniki ponawiania | `RetryConfig`, `retryAsync`, uruchamiacze polityk |
  | `plugin-sdk/allow-from` | Formatowanie listy dozwolonych | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapowanie danych wejściowych listy dozwolonych | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Bramkowanie poleceń i pomocniki powierzchni poleceń | `resolveControlCommandGate`, pomocniki autoryzacji nadawcy, pomocniki rejestru poleceń, w tym formatowanie menu argumentów dynamicznych |
  | `plugin-sdk/command-status` | Renderery statusu/pomocy poleceń | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsowanie danych wejściowych sekretów | Pomocniki danych wejściowych sekretów |
  | `plugin-sdk/webhook-ingress` | Pomocniki żądań Webhook | Narzędzia celów Webhook |
  | `plugin-sdk/webhook-request-guards` | Pomocniki strażników treści Webhook | Pomocniki odczytu/limitu treści żądania |
  | `plugin-sdk/reply-runtime` | Współdzielone środowisko wykonawcze odpowiedzi | Wysyłanie przychodzące, Heartbeat, planer odpowiedzi, dzielenie na fragmenty |
  | `plugin-sdk/reply-dispatch-runtime` | Wąskie pomocniki wysyłania odpowiedzi | Finalizacja, wysyłanie przez dostawcę i pomocniki etykiet konwersacji |
  | `plugin-sdk/reply-history` | Pomocniki historii odpowiedzi | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planowanie referencji odpowiedzi | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Pomocniki fragmentów odpowiedzi | Pomocniki dzielenia tekstu/Markdown na fragmenty |
  | `plugin-sdk/session-store-runtime` | Pomocniki magazynu sesji | Pomocniki ścieżki magazynu i updated-at |
  | `plugin-sdk/state-paths` | Pomocniki ścieżek stanu | Pomocniki stanu i katalogu OAuth |
  | `plugin-sdk/routing` | Pomocniki routingu/klucza sesji | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, pomocniki normalizacji klucza sesji |
  | `plugin-sdk/status-helpers` | Pomocniki statusu kanału | Konstruktory podsumowań statusu kanału/konta, domyślne wartości stanu środowiska wykonawczego, pomocniki metadanych problemów |
  | `plugin-sdk/target-resolver-runtime` | Pomocniki resolvera celów | Współdzielone pomocniki resolvera celów |
  | `plugin-sdk/string-normalization-runtime` | Pomocniki normalizacji ciągów | Pomocniki normalizacji slug/ciągów |
  | `plugin-sdk/request-url` | Pomocniki URL żądania | Wyodrębnianie URL-i jako ciągów z wejść podobnych do żądań |
  | `plugin-sdk/run-command` | Pomocniki poleceń z limitem czasu | Uruchamiacz poleceń z limitem czasu i znormalizowanymi stdout/stderr |
  | `plugin-sdk/param-readers` | Czytniki parametrów | Wspólne czytniki parametrów narzędzi/CLI |
  | `plugin-sdk/tool-payload` | Wyodrębnianie ładunku narzędzia | Wyodrębnia znormalizowane ładunki z obiektów wyników narzędzi |
  | `plugin-sdk/tool-send` | Wyodrębnianie wysyłki narzędzia | Wyodrębnia kanoniczne pola celu wysyłki z argumentów narzędzia |
  | `plugin-sdk/temp-path` | Pomocnicze funkcje ścieżek tymczasowych | Współdzielone funkcje pomocnicze ścieżek pobierania tymczasowego |
  | `plugin-sdk/logging-core` | Pomocnicze funkcje logowania | Rejestrator podsystemu i funkcje pomocnicze redakcji |
  | `plugin-sdk/markdown-table-runtime` | Pomocnicze funkcje tabel Markdown | Funkcje pomocnicze trybu tabel Markdown |
  | `plugin-sdk/reply-payload` | Typy odpowiedzi wiadomości | Typy ładunku odpowiedzi |
  | `plugin-sdk/provider-setup` | Wyselekcjonowane funkcje pomocnicze konfiguracji lokalnego/samodzielnie hostowanego dostawcy | Funkcje pomocnicze wykrywania/konfiguracji samodzielnie hostowanego dostawcy |
  | `plugin-sdk/self-hosted-provider-setup` | Wyspecjalizowane funkcje pomocnicze konfiguracji samodzielnie hostowanego dostawcy zgodnego z OpenAI | Te same funkcje pomocnicze wykrywania/konfiguracji samodzielnie hostowanego dostawcy |
  | `plugin-sdk/provider-auth-runtime` | Pomocnicze funkcje uwierzytelniania dostawcy w czasie działania | Funkcje pomocnicze rozpoznawania klucza API w czasie działania |
  | `plugin-sdk/provider-auth-api-key` | Pomocnicze funkcje konfiguracji klucza API dostawcy | Funkcje pomocnicze wdrażania klucza API/zapisu profilu |
  | `plugin-sdk/provider-auth-result` | Pomocnicze funkcje wyniku uwierzytelniania dostawcy | Standardowy konstruktor wyniku uwierzytelniania OAuth |
  | `plugin-sdk/provider-auth-login` | Pomocnicze funkcje interaktywnego logowania dostawcy | Współdzielone funkcje pomocnicze interaktywnego logowania |
  | `plugin-sdk/provider-selection-runtime` | Pomocnicze funkcje wyboru dostawcy | Wybór skonfigurowanego lub automatycznego dostawcy i scalanie surowej konfiguracji dostawcy |
  | `plugin-sdk/provider-env-vars` | Pomocnicze funkcje zmiennych środowiskowych dostawcy | Funkcje pomocnicze wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
  | `plugin-sdk/provider-model-shared` | Współdzielone funkcje pomocnicze modeli/odtwarzania dostawcy | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory zasad odtwarzania, funkcje pomocnicze punktów końcowych dostawców i funkcje pomocnicze normalizacji identyfikatorów modeli |
  | `plugin-sdk/provider-catalog-shared` | Współdzielone funkcje pomocnicze katalogu dostawcy | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Poprawki wdrażania dostawcy | Funkcje pomocnicze konfiguracji wdrażania |
  | `plugin-sdk/provider-http` | Pomocnicze funkcje HTTP dostawcy | Ogólne funkcje pomocnicze możliwości HTTP/punktów końcowych dostawcy, w tym funkcje pomocnicze wieloczęściowych formularzy transkrypcji audio |
  | `plugin-sdk/provider-web-fetch` | Pomocnicze funkcje pobierania z sieci dostawcy | Funkcje pomocnicze rejestracji/pamięci podręcznej dostawcy pobierania z sieci |
  | `plugin-sdk/provider-web-search-config-contract` | Pomocnicze funkcje konfiguracji wyszukiwania w sieci dostawcy | Wąskie funkcje pomocnicze konfiguracji/poświadczeń wyszukiwania w sieci dla dostawców, którzy nie potrzebują okablowania włączania Plugin |
  | `plugin-sdk/provider-web-search-contract` | Pomocnicze funkcje kontraktu wyszukiwania w sieci dostawcy | Wąskie funkcje pomocnicze kontraktu konfiguracji/poświadczeń wyszukiwania w sieci, takie jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowe ustawiacze/pobieracze poświadczeń |
  | `plugin-sdk/provider-web-search` | Pomocnicze funkcje wyszukiwania w sieci dostawcy | Funkcje pomocnicze rejestracji/pamięci podręcznej/czasu działania dostawcy wyszukiwania w sieci |
  | `plugin-sdk/provider-tools` | Pomocnicze funkcje zgodności narzędzi/schematów dostawcy | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, czyszczenie schematów Gemini + diagnostyka oraz funkcje pomocnicze zgodności xAI, takie jak `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Pomocnicze funkcje użycia dostawcy | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` i inne funkcje pomocnicze użycia dostawcy |
  | `plugin-sdk/provider-stream` | Pomocnicze funkcje opakowań strumieni dostawcy | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy opakowań strumieni oraz współdzielone funkcje pomocnicze opakowań Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Pomocnicze funkcje transportu dostawcy | Natywne funkcje pomocnicze transportu dostawcy, takie jak strzeżone pobieranie, transformacje komunikatów transportu i zapisywalne strumienie zdarzeń transportu |
  | `plugin-sdk/keyed-async-queue` | Uporządkowana kolejka asynchroniczna | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Współdzielone funkcje pomocnicze multimediów | Funkcje pomocnicze pobierania/przekształcania/przechowywania multimediów, sondowanie wymiarów wideo oparte na ffprobe oraz konstruktory ładunków multimediów |
  | `plugin-sdk/media-generation-runtime` | Współdzielone funkcje pomocnicze generowania multimediów | Współdzielone funkcje pomocnicze przełączania awaryjnego, wybór kandydatów i komunikaty o brakującym modelu dla generowania obrazów/wideo/muzyki |
  | `plugin-sdk/media-understanding` | Pomocnicze funkcje rozumienia multimediów | Typy dostawców rozumienia multimediów oraz eksporty funkcji pomocniczych obrazów/audio dla dostawców |
  | `plugin-sdk/text-runtime` | Współdzielone funkcje pomocnicze tekstu | Usuwanie tekstu widocznego dla asystenta, funkcje pomocnicze renderowania/dzielenia/tabel Markdown, funkcje pomocnicze redakcji, funkcje pomocnicze tagów dyrektyw, narzędzia bezpiecznego tekstu oraz powiązane funkcje pomocnicze tekstu/logowania |
  | `plugin-sdk/text-chunking` | Pomocnicze funkcje dzielenia tekstu | Funkcja pomocnicza dzielenia tekstu wychodzącego |
  | `plugin-sdk/speech` | Pomocnicze funkcje mowy | Typy dostawców mowy oraz eksporty dyrektyw, rejestru i funkcji pomocniczych walidacji dla dostawców, a także konstruktor TTS zgodny z OpenAI |
  | `plugin-sdk/speech-core` | Współdzielony rdzeń mowy | Typy dostawców mowy, rejestr, dyrektywy, normalizacja |
  | `plugin-sdk/realtime-transcription` | Pomocnicze funkcje transkrypcji w czasie rzeczywistym | Typy dostawców, funkcje pomocnicze rejestru i współdzielona funkcja pomocnicza sesji WebSocket |
  | `plugin-sdk/realtime-voice` | Pomocnicze funkcje głosu w czasie rzeczywistym | Typy dostawców, funkcje pomocnicze rejestru/rozpoznawania, funkcje pomocnicze sesji mostka, współdzielone kolejki odpowiedzi głosowych agenta, kondycja transkrypcji/zdarzeń, tłumienie echa i szybkie funkcje pomocnicze konsultacji kontekstu |
  | `plugin-sdk/image-generation` | Pomocnicze funkcje generowania obrazów | Typy dostawców generowania obrazów oraz funkcje pomocnicze zasobów obrazów/adresów URL danych i konstruktor dostawcy obrazów zgodny z OpenAI |
  | `plugin-sdk/image-generation-core` | Współdzielony rdzeń generowania obrazów | Typy generowania obrazów, przełączanie awaryjne, uwierzytelnianie i funkcje pomocnicze rejestru |
  | `plugin-sdk/music-generation` | Pomocnicze funkcje generowania muzyki | Typy dostawcy/żądania/wyniku generowania muzyki |
  | `plugin-sdk/music-generation-core` | Współdzielony rdzeń generowania muzyki | Typy generowania muzyki, funkcje pomocnicze przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie odwołań do modeli |
  | `plugin-sdk/video-generation` | Pomocnicze funkcje generowania wideo | Typy dostawcy/żądania/wyniku generowania wideo |
  | `plugin-sdk/video-generation-core` | Współdzielony rdzeń generowania wideo | Typy generowania wideo, funkcje pomocnicze przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie odwołań do modeli |
  | `plugin-sdk/interactive-runtime` | Pomocnicze funkcje odpowiedzi interaktywnych | Normalizacja/redukcja ładunku odpowiedzi interaktywnej |
  | `plugin-sdk/channel-config-primitives` | Prymitywy konfiguracji kanału | Wąskie prymitywy schematu konfiguracji kanału |
  | `plugin-sdk/channel-config-writes` | Pomocnicze funkcje zapisu konfiguracji kanału | Funkcje pomocnicze autoryzacji zapisu konfiguracji kanału |
  | `plugin-sdk/channel-plugin-common` | Współdzielony prelude kanału | Współdzielone eksporty prelude Plugin kanału |
  | `plugin-sdk/channel-status` | Pomocnicze funkcje statusu kanału | Współdzielone funkcje pomocnicze migawki/podsumowania statusu kanału |
  | `plugin-sdk/allowlist-config-edit` | Pomocnicze funkcje konfiguracji listy dozwolonych | Funkcje pomocnicze edycji/odczytu konfiguracji listy dozwolonych |
  | `plugin-sdk/group-access` | Pomocnicze funkcje dostępu grupowego | Współdzielone funkcje pomocnicze decyzji dostępu grupowego |
  | `plugin-sdk/direct-dm` | Pomocnicze funkcje bezpośrednich DM | Współdzielone funkcje pomocnicze uwierzytelniania/ochrony bezpośrednich DM |
  | `plugin-sdk/extension-shared` | Współdzielone funkcje pomocnicze rozszerzeń | Prymitywy funkcji pomocniczych kanału pasywnego/statusu i otaczającego proxy |
  | `plugin-sdk/webhook-targets` | Pomocnicze funkcje celów Webhook | Rejestr celów Webhook i funkcje pomocnicze instalowania tras |
  | `plugin-sdk/webhook-path` | Pomocnicze funkcje ścieżek Webhook | Funkcje pomocnicze normalizacji ścieżek Webhook |
  | `plugin-sdk/web-media` | Współdzielone funkcje pomocnicze multimediów sieciowych | Funkcje pomocnicze ładowania multimediów zdalnych/lokalnych |
  | `plugin-sdk/zod` | Reeksport Zod | Reeksportowany `zod` dla konsumentów SDK Plugin |
  | `plugin-sdk/memory-core` | Dołączone funkcje pomocnicze memory-core | Powierzchnia funkcji pomocniczych menedżera/konfiguracji/plików/CLI pamięci |
  | `plugin-sdk/memory-core-engine-runtime` | Fasada czasu działania silnika pamięci | Fasada czasu działania indeksowania/wyszukiwania pamięci |
  | `plugin-sdk/memory-core-host-engine-foundation` | Silnik podstawy hosta pamięci | Eksporty silnika podstawy hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Silnik osadzania hosta pamięci | Kontrakty osadzania pamięci, dostęp do rejestru, lokalny dostawca i ogólne funkcje pomocnicze wsadowe/zdalne; konkretni dostawcy zdalni znajdują się w swoich właścicielskich plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | Silnik QMD hosta pamięci | Eksporty silnika QMD hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-storage` | Silnik przechowywania hosta pamięci | Eksporty silnika przechowywania hosta pamięci |
  | `plugin-sdk/memory-core-host-multimodal` | Pomocnicze funkcje multimodalne hosta pamięci | Pomocnicze funkcje multimodalne hosta pamięci |
  | `plugin-sdk/memory-core-host-query` | Pomocnicze funkcje zapytań hosta pamięci | Pomocnicze funkcje zapytań hosta pamięci |
  | `plugin-sdk/memory-core-host-secret` | Pomocnicze funkcje sekretów hosta pamięci | Pomocnicze funkcje sekretów hosta pamięci |
  | `plugin-sdk/memory-core-host-events` | Pomocnicze funkcje dziennika zdarzeń hosta pamięci | Pomocnicze funkcje dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-core-host-status` | Pomocnicze funkcje statusu hosta pamięci | Pomocnicze funkcje statusu hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-cli` | Czas działania CLI hosta pamięci | Funkcje pomocnicze czasu działania CLI hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-core` | Podstawowy czas działania hosta pamięci | Funkcje pomocnicze podstawowego czasu działania hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-files` | Pomocnicze funkcje plików/czasu działania hosta pamięci | Pomocnicze funkcje plików/czasu działania hosta pamięci |
  | `plugin-sdk/memory-host-core` | Alias podstawowego czasu działania hosta pamięci | Neutralny względem dostawcy alias funkcji pomocniczych podstawowego czasu działania hosta pamięci |
  | `plugin-sdk/memory-host-events` | Alias dziennika zdarzeń hosta pamięci | Neutralny względem dostawcy alias funkcji pomocniczych dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-host-files` | Alias plików/czasu działania hosta pamięci | Neutralny względem dostawcy alias funkcji pomocniczych plików/czasu działania hosta pamięci |
  | `plugin-sdk/memory-host-markdown` | Zarządzane funkcje pomocnicze Markdown | Współdzielone funkcje pomocnicze zarządzanego Markdown dla plugins sąsiadujących z pamięcią |
  | `plugin-sdk/memory-host-search` | Fasada wyszukiwania Active Memory | Leniwa fasada czasu działania menedżera wyszukiwania Active Memory |
  | `plugin-sdk/memory-host-status` | Alias statusu hosta pamięci | Neutralny względem dostawcy alias funkcji pomocniczych statusu hosta pamięci |
  | `plugin-sdk/testing` | Narzędzia testowe | Starszy szeroki barrel zgodności; preferuj wyspecjalizowane podścieżki testowe, takie jak `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` i `plugin-sdk/test-fixtures` |
</Accordion>

Ta tabela jest celowo wspólnym podzbiorem migracji, a nie pełną
powierzchnią SDK. Pełna lista ponad 200 punktów wejścia znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`.

Zarezerwowane pomocnicze interfejsy dołączonych Pluginów zostały wycofane z
publicznej mapy eksportów SDK, z wyjątkiem jawnie udokumentowanych fasad
zgodności, takich jak przestarzały shim `plugin-sdk/discord`, zachowany dla
opublikowanego pakietu `@openclaw/discord@2026.3.13`. Pomocniki specyficzne
dla właściciela znajdują się w pakiecie właścicielskiego Pluginu; współdzielone
zachowanie hosta powinno przechodzić przez ogólne kontrakty SDK, takie jak
`plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` i
`plugin-sdk/plugin-config-runtime`.

Używaj najwęższego importu, który pasuje do zadania. Jeśli nie możesz znaleźć
eksportu, sprawdź źródło w `src/plugin-sdk/` albo zapytaj opiekunów, który
ogólny kontrakt powinien być jego właścicielem.

## Aktywne deprecjacje

Węższe deprecjacje, które dotyczą całego SDK Pluginów, kontraktu dostawcy,
powierzchni runtime i manifestu. Każda z nich nadal działa dzisiaj, ale zostanie
usunięta w przyszłym wydaniu głównym. Wpis pod każdym elementem mapuje stare
API na jego kanoniczny zamiennik.

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **Stare (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nowe (`openclaw/plugin-sdk/command-status`)**: te same sygnatury, te same
    eksporty - tylko importowane z węższej ścieżki podrzędnej. `command-auth`
    reeksportuje je jako atrapy zgodności.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **Stare**: `resolveInboundMentionRequirement({ facts, policy })` i
    `shouldDropInboundForMention(...)` z
    `openclaw/plugin-sdk/channel-inbound` lub
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Nowe**: `resolveInboundMentionDecision({ facts, policy })` - zwraca
    pojedynczy obiekt decyzji zamiast dwóch oddzielnych wywołań.

    Podrzędne Pluginy kanałów (Slack, Discord, Matrix, MS Teams) zostały już
    przełączone.

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` to shim zgodności dla starszych
    Pluginów kanałów. Nie importuj go w nowym kodzie; używaj
    `openclaw/plugin-sdk/channel-runtime-context` do rejestrowania obiektów
    runtime.

    Pomocniki `channelActions*` w `openclaw/plugin-sdk/channel-actions` są
    przestarzałe wraz z surowymi eksportami kanałowych „akcji”. Udostępniaj
    możliwości przez semantyczną powierzchnię `presentation` - Pluginy kanałów
    deklarują, co renderują (karty, przyciski, listy wyboru), a nie jakie surowe
    nazwy akcji akceptują.

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **Stare**: fabryka `tool()` z `openclaw/plugin-sdk/provider-web-search`.

    **Nowe**: zaimplementuj `createTool(...)` bezpośrednio w Pluginie
    dostawcy. OpenClaw nie potrzebuje już pomocnika SDK do rejestrowania
    wrappera narzędzia.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **Stare**: `formatInboundEnvelope(...)` (oraz
    `ChannelMessageForAgent.channelEnvelope`) do budowania płaskiej koperty
    promptu w postaci tekstu zwykłego z przychodzących wiadomości kanału.

    **Nowe**: `BodyForAgent` plus strukturalne bloki kontekstu użytkownika.
    Pluginy kanałów dołączają metadane routingu (wątek, temat, odpowiedź do,
    reakcje) jako typowane pola zamiast konkatenować je w ciąg promptu. Pomocnik
    `formatAgentEnvelope(...)` jest nadal obsługiwany dla syntetyzowanych kopert
    widocznych dla asystenta, ale przychodzące koperty w postaci tekstu zwykłego
    są wycofywane.

    Dotknięte obszary: `inbound_claim`, `message_received` oraz każdy niestandardowy
    Plugin kanału, który przetwarzał tekst `channelEnvelope` po fakcie.

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    Cztery aliasy typów discovery są teraz cienkimi wrapperami na typach z ery
    katalogu:

    | Stary alias                | Nowy typ                  |
    | -------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Do tego starszy statyczny zbiór `ProviderCapabilities` - Pluginy dostawców
    powinny używać jawnych hooków dostawcy, takich jak `buildReplayPolicy`,
    `normalizeToolSchemas` i `wrapStreamFn`, zamiast statycznego obiektu.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **Stare** (trzy oddzielne hooki w `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` i
    `resolveDefaultThinkingLevel(ctx)`.

    **Nowe**: pojedyncze `resolveThinkingProfile(ctx)`, które zwraca
    `ProviderThinkingProfile` z kanonicznym `id`, opcjonalną `label` i
    uszeregowaną listą poziomów. OpenClaw automatycznie obniża nieaktualne
    zapisane wartości według rangi profilu.

    Zaimplementuj jeden hook zamiast trzech. Starsze hooki nadal działają w
    oknie deprecjacji, ale nie są komponowane z wynikiem profilu.

  </Accordion>

  <Accordion title="External OAuth provider fallback → contracts.externalAuthProviders">
    **Stare**: implementowanie `resolveExternalOAuthProfiles(...)` bez
    deklarowania dostawcy w manifeście Pluginu.

    **Nowe**: zadeklaruj `contracts.externalAuthProviders` w manifeście Pluginu
    **oraz** zaimplementuj `resolveExternalAuthProfiles(...)`. Stara ścieżka
    „awaryjnego auth” emituje ostrzeżenie w runtime i zostanie usunięta.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    **Stare** pole manifestu: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nowe**: odzwierciedl to samo wyszukiwanie zmiennych środowiskowych w
    `setup.providers[].envVars` w manifeście. Konsoliduje to metadane środowiska
    setup/status w jednym miejscu i pozwala uniknąć uruchamiania runtime Pluginu
    tylko po to, aby odpowiedzieć na wyszukiwania zmiennych środowiskowych.

    `providerAuthEnvVars` pozostaje obsługiwane przez adapter zgodności, dopóki
    okno deprecjacji się nie zamknie.

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **Stare**: trzy oddzielne wywołania -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nowe**: jedno wywołanie w API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Te same sloty, pojedyncze wywołanie rejestrujące. Addytywne pomocniki pamięci
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) nie są dotknięte.

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    Dwa starsze aliasy typów nadal eksportowane z `src/plugins/runtime/types.ts`:

    | Stare                         | Nowe                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Metoda runtime `readSession` jest przestarzała na rzecz
    `getSessionMessages`. Ta sama sygnatura; stara metoda przekazuje wywołanie
    do nowej.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Stare**: `runtime.tasks.flow` (liczba pojedyncza) zwracało żywy akcesor
    przepływu zadań.

    **Nowe**: `runtime.tasks.managedFlows` zachowuje zarządzany runtime mutacji
    TaskFlow dla Pluginów, które tworzą, aktualizują, anulują lub uruchamiają
    zadania potomne z przepływu. Używaj `runtime.tasks.flows`, gdy Plugin
    potrzebuje tylko odczytów opartych na DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    Omówione powyżej w sekcji „Jak migrować → Migruj rozszerzenia wyników
    narzędzi Pi do middleware”. Dołączone tutaj dla kompletności: usunięta
    ścieżka tylko dla Pi `api.registerEmbeddedExtensionFactory(...)` została
    zastąpiona przez `api.registerAgentToolResultMiddleware(...)` z jawną listą
    runtime w `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
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
Deprecjacje na poziomie rozszerzeń (wewnątrz dołączonych Pluginów
kanałów/dostawców w `extensions/`) są śledzone w ich własnych barrelach `api.ts`
i `runtime-api.ts`. Nie wpływają na kontrakty Pluginów innych firm i nie są
tutaj wymienione. Jeśli konsumujesz lokalny barrel dołączonego Pluginu
bezpośrednio, przeczytaj komentarze o deprecjacji w tym barrelu przed
aktualizacją.
</Note>

## Harmonogram usuwania

| Kiedy                  | Co się dzieje                                                          |
| ---------------------- | --------------------------------------------------------------------- |
| **Teraz**              | Przestarzałe powierzchnie emitują ostrzeżenia w runtime               |
| **Następne wydanie główne** | Przestarzałe powierzchnie zostaną usunięte; Pluginy nadal ich używające przestaną działać |

Wszystkie Pluginy core zostały już zmigrowane. Zewnętrzne Pluginy powinny
zmigrować przed następnym wydaniem głównym.

## Tymczasowe wyciszanie ostrzeżeń

Ustaw te zmienne środowiskowe podczas pracy nad migracją:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

To tymczasowa furtka awaryjna, a nie trwałe rozwiązanie.

## Powiązane

- [Pierwsze kroki](/pl/plugins/building-plugins) - zbuduj swój pierwszy Plugin
- [Przegląd SDK](/pl/plugins/sdk-overview) - pełna referencja importów ścieżek podrzędnych
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) - budowanie Pluginów kanałów
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) - budowanie Pluginów dostawców
- [Wewnętrzne mechanizmy Pluginów](/pl/plugins/architecture) - dogłębne omówienie architektury
- [Manifest Pluginu](/pl/plugins/manifest) - referencja schematu manifestu
