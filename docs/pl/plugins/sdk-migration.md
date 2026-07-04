---
read_when:
    - Widzisz ostrzeżenie OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Widzisz ostrzeżenie OPENCLAW_EXTENSION_API_DEPRECATED
    - Użyto api.registerEmbeddedExtensionFactory przed OpenClaw 2026.4.25
    - Aktualizujesz Plugin do nowoczesnej architektury Plugin
    - Utrzymujesz zewnętrzny Plugin OpenClaw
sidebarTitle: Migrate to SDK
summary: Przeprowadź migrację ze starszej warstwy zgodności wstecznej do nowoczesnego SDK Plugin
title: Migracja Plugin SDK
x-i18n:
    generated_at: "2026-07-04T15:39:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7873de40aea56f456781ecf8ac9a4705c958030f7c68f8a112ad3f0fce62f078
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw przeszedł z szerokiej warstwy zgodności wstecznej na nowoczesną
architekturę pluginów ze skoncentrowanymi, udokumentowanymi importami. Jeśli Twój plugin został zbudowany przed
nową architekturą, ten przewodnik pomoże Ci przeprowadzić migrację.

## Co się zmienia

Stary system pluginów udostępniał dwie bardzo szerokie powierzchnie, które pozwalały pluginom importować
wszystko, czego potrzebowały, z jednego punktu wejścia:

- **`openclaw/plugin-sdk/compat`** - pojedynczy import, który ponownie eksportował dziesiątki
  helperów. Został wprowadzony, aby starsze pluginy oparte na hookach nadal działały, gdy
  budowano nową architekturę pluginów.
- **`openclaw/plugin-sdk/infra-runtime`** - szeroki barrel helperów uruchomieniowych, który
  mieszał zdarzenia systemowe, stan heartbeat, kolejki dostarczania, helpery fetch/proxy,
  helpery plików, typy zatwierdzeń i niepowiązane narzędzia.
- **`openclaw/plugin-sdk/config-runtime`** - szeroki barrel zgodności konfiguracji,
  który wciąż przenosi przestarzałe bezpośrednie helpery ładowania/zapisu w okresie migracji.
- **`openclaw/extension-api`** - most, który dawał pluginom bezpośredni dostęp do
  helperów po stronie hosta, takich jak osadzony runner agenta.
- **`api.registerEmbeddedExtensionFactory(...)`** - usunięty hook bundled
  extension tylko dla osadzonego runnera, który mógł obserwować zdarzenia osadzonego runnera, takie jak
  `tool_result`.

Szerokie powierzchnie importu są teraz **przestarzałe**. Nadal działają w runtime,
ale nowe pluginy nie mogą ich używać, a istniejące pluginy powinny przeprowadzić migrację, zanim
następne wydanie główne je usunie. API rejestracji factory rozszerzeń wyłącznie dla osadzonego runnera
zostało usunięte; zamiast tego użyj middleware wyników narzędzi.

OpenClaw nie usuwa ani nie interpretuje ponownie udokumentowanego zachowania pluginów w tej samej
zmianie, która wprowadza zamiennik. Zmiany łamiące kontrakt muszą najpierw przejść
przez adapter zgodności, diagnostykę, dokumentację i okres wycofywania.
Dotyczy to importów SDK, pól manifestu, API setup, hooków i zachowania
rejestracji runtime.

<Warning>
  Warstwa zgodności wstecznej zostanie usunięta w przyszłym wydaniu głównym.
  Pluginy, które nadal importują z tych powierzchni, przestaną wtedy działać.
  Starsze rejestracje factory osadzonych rozszerzeń już się nie ładują.
</Warning>

## Dlaczego to się zmieniło

Stare podejście powodowało problemy:

- **Powolny startup** - import jednego helpera ładował dziesiątki niepowiązanych modułów
- **Zależności cykliczne** - szerokie ponowne eksporty ułatwiały tworzenie cykli importu
- **Niejasna powierzchnia API** - nie było sposobu, aby stwierdzić, które eksporty były stabilne, a które wewnętrzne

Nowoczesny plugin SDK rozwiązuje ten problem: każda ścieżka importu (`openclaw/plugin-sdk/\<subpath\>`)
jest małym, samodzielnym modułem o jasnym przeznaczeniu i udokumentowanym kontrakcie.

Starsze wygodne seamy providerów dla bundled kanałów również zniknęły.
Helper seamy oznaczone marką kanału były prywatnymi skrótami mono-repo, a nie stabilnymi
kontraktami pluginów. Zamiast tego używaj wąskich, ogólnych podścieżek SDK. Wewnątrz bundled
przestrzeni roboczej pluginów trzymaj helpery należące do providera we własnym `api.ts` lub
`runtime-api.ts` tego pluginu.

Aktualne przykłady bundled providerów:

- Anthropic trzyma helpery strumieni specyficzne dla Claude we własnym seamie `api.ts` /
  `contract-api.ts`
- OpenAI trzyma buildery providerów, helpery modeli domyślnych i buildery providerów realtime
  we własnym `api.ts`
- OpenRouter trzyma builder providera oraz helpery onboardingu/konfiguracji we własnym
  `api.ts`

## Plan migracji Talk i głosu realtime

Kod głosu realtime, telefonii, spotkań i przeglądarkowego Talk jest przenoszony z
lokalnego dla powierzchni księgowania tur do współdzielonego kontrolera sesji Talk eksportowanego przez
`openclaw/plugin-sdk/realtime-voice`. Nowy kontroler odpowiada za wspólną kopertę
zdarzeń Talk, stan aktywnej tury, stan przechwytywania, stan dźwięku wyjściowego, ostatnią
historię zdarzeń i odrzucanie przestarzałych tur. Pluginy providerów powinny nadal odpowiadać za
sesje realtime specyficzne dla dostawcy; pluginy powierzchni powinny nadal odpowiadać za przechwytywanie,
odtwarzanie, telefonię i osobliwości spotkań.

Ta migracja Talk jest celowo czysto łamiąca:

1. Utrzymaj współdzielony kontroler/prymitywy runtime w
   `plugin-sdk/realtime-voice`.
2. Przenieś bundled powierzchnie na współdzielony kontroler: przekaźnik przeglądarkowy,
   przekazanie managed-room, realtime połączeń głosowych, strumieniowe STT połączeń głosowych, realtime Google
   Meet oraz natywne push-to-talk.
3. Zastąp stare rodziny RPC Talk docelowym API `talk.session.*` i
   `talk.client.*`.
4. Ogłaszaj jeden aktywny kanał zdarzeń Talk w Gateway
   `hello-ok.features.events`: `talk.event`.
5. Usuń stary endpoint HTTP realtime i każdą ścieżkę nadpisywania instrukcji
   w czasie żądania.

Nowy kod nie powinien wywoływać `createTalkEventSequencer(...)` bezpośrednio, chyba że
implementuje niskopoziomowy adapter lub fixture testowy. Preferuj współdzielony kontroler,
aby zdarzenia ograniczone do tury nie mogły być emitowane bez id tury, przestarzałe wywołania `turnEnd` /
`turnCancel` nie mogły wyczyścić nowszej aktywnej tury, a zdarzenia cyklu życia
dźwięku wyjściowego pozostawały spójne w telefonii, spotkaniach, przekaźniku przeglądarkowym, przekazaniu
managed-room i natywnych klientach Talk.

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
ponieważ przeglądarka odpowiada za negocjację providera i transport mediów, podczas gdy
Gateway odpowiada za poświadczenia, instrukcje i politykę narzędzi. `talk.session.*` jest
wspólną powierzchnią zarządzaną przez Gateway dla realtime gateway-relay, transkrypcji
gateway-relay i sesji STT/TTS natywnych managed-room.

Starsze konfiguracje, które umieszczały selektory realtime obok `talk.provider` /
`talk.providers`, powinny zostać naprawione przez `openclaw doctor --fix`; runtime Talk
nie interpretuje ponownie konfiguracji providera speech/TTS jako konfiguracji providera realtime.

Obsługiwane kombinacje `talk.session.create` są celowo niewielkie:

| Tryb            | Transport       | Brain           | Właściciel         | Uwagi                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Dźwięk providera full-duplex mostkowany przez Gateway; wywołania narzędzi są kierowane przez narzędzie agent-consult.      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Tylko strumieniowe STT; wywołujący wysyłają dźwięk wejściowy i otrzymują zdarzenia transkryptu.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Pokój natywny/klienta | Pokoje w stylu push-to-talk i walkie-talkie, w których klient odpowiada za przechwytywanie/odtwarzanie, a Gateway za stan tury. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Pokój natywny/klienta | Tryb pokoju tylko dla administratorów dla zaufanych powierzchni first-party, które wykonują akcje narzędzi Gateway bezpośrednio.                  |

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

Ujednolicony słownik sterowania jest również celowo wąski:

  | Metoda                          | Dotyczy                                                | Kontrakt                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Dołącz fragment audio PCM zakodowany w base64 do sesji dostawcy należącej do tego samego połączenia Gateway.                                                                             |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Rozpocznij turę użytkownika w pokoju zarządzanym.                                                                                                                                        |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Zakończ aktywną turę po walidacji nieaktualnej tury.                                                                                                                                     |
  | `talk.session.cancelTurn`       | wszystkie sesje należące do Gateway                     | Anuluj aktywne przechwytywanie, pracę dostawcy, agenta i TTS dla tury.                                                                                                                    |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Zatrzymaj wyjście audio asystenta bez konieczności kończenia tury użytkownika.                                                                                                           |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Dokończ wywołanie narzędzia dostawcy wyemitowane przez przekaźnik; przekaż `options.willContinue` dla wyjścia tymczasowego lub `options.suppressResponse`, aby spełnić wywołanie bez kolejnej odpowiedzi asystenta. |
  | `talk.session.steer`            | sesje Talk wspierane przez agenta                       | Wyślij mówioną kontrolę `status`, `steer`, `cancel` lub `followup` do aktywnego osadzonego uruchomienia rozwiązanego z sesji Talk.                                                       |
  | `talk.session.close`            | wszystkie ujednolicone sesje                            | Zatrzymaj sesje przekaźnika lub unieważnij stan pokoju zarządzanego, a następnie zapomnij ujednolicony identyfikator sesji.                                                              |

  Nie wprowadzaj w rdzeniu specjalnych przypadków dostawcy ani platformy, aby to działało.
  Rdzeń odpowiada za semantykę sesji Talk. Pluginy dostawców odpowiadają za konfigurację sesji dostawcy.
  Voice-call i Google Meet odpowiadają za adaptery telefonii/spotkań. Przeglądarka i aplikacje natywne
  odpowiadają za UX przechwytywania/odtwarzania urządzenia.

  ## Zasady zgodności

  Dla zewnętrznych pluginów prace nad zgodnością przebiegają w tej kolejności:

  1. dodaj nowy kontrakt
  2. zachowaj stare zachowanie podłączone przez adapter zgodności
  3. emituj diagnostykę lub ostrzeżenie, które wskazuje starą ścieżkę i zamiennik
  4. pokryj obie ścieżki testami
  5. udokumentuj wycofanie i ścieżkę migracji
  6. usuń dopiero po ogłoszonym oknie migracji, zwykle w wydaniu major

  Maintainerzy mogą audytować bieżącą kolejkę migracji za pomocą
  `pnpm plugins:boundary-report`. Użyj `pnpm plugins:boundary-report:summary` dla
  zwartych zliczeń, `--owner <id>` dla jednego pluginu lub właściciela zgodności oraz
  `pnpm plugins:boundary-report:ci`, gdy bramka CI ma kończyć się niepowodzeniem przy zaległych
  rekordach zgodności, zastrzeżonych importach SDK między właścicielami albo nieużywanych zastrzeżonych
  podścieżkach SDK. Raport grupuje przestarzałe
  rekordy zgodności według daty usunięcia, zlicza lokalne odwołania w kodzie/dokumentacji,
  ujawnia zastrzeżone importy SDK między właścicielami i podsumowuje prywatny
  most SDK memory-host, aby sprzątanie zgodności pozostawało jawne zamiast
  polegać na doraźnych wyszukiwaniach. Zastrzeżone podścieżki SDK muszą mieć śledzone użycie przez właścicieli;
  nieużywane zastrzeżone eksporty pomocnicze należy usunąć z publicznego SDK.

  Jeśli pole manifestu jest nadal akceptowane, autorzy pluginów mogą go dalej używać, dopóki
  dokumentacja i diagnostyka nie powiedzą inaczej. Nowy kod powinien preferować udokumentowany
  zamiennik, ale istniejące pluginy nie powinny psuć się podczas zwykłych wydań minor.

  ## Jak migrować

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    Dołączone pluginy powinny przestać wywoływać
    `api.runtime.config.loadConfig()` i
    `api.runtime.config.writeConfigFile(...)` bezpośrednio. Preferuj konfigurację, która została
    już przekazana do aktywnej ścieżki wywołania. Długotrwałe handlery, które potrzebują
    bieżącego zrzutu procesu, mogą użyć `api.runtime.config.current()`. Długotrwałe
    narzędzia agenta powinny używać `ctx.getRuntimeConfig()` z kontekstu narzędzia wewnątrz
    `execute`, aby narzędzie utworzone przed zapisem konfiguracji nadal widziało odświeżoną
    konfigurację runtime.

    Zapisy konfiguracji muszą przechodzić przez pomocniki transakcyjne i wybrać
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
    że zmiana wymaga czystego restartu gateway, oraz
    `afterWrite: { mode: "none", reason: "..." }` tylko wtedy, gdy wywołujący odpowiada za
    dalsze działania i celowo chce pominąć planner przeładowania.
    Wyniki mutacji zawierają typowane podsumowanie `followUp` dla testów i logowania;
    gateway pozostaje odpowiedzialny za zastosowanie lub zaplanowanie restartu.
    `loadConfig` i `writeConfigFile` pozostają jako przestarzałe pomocniki zgodności
    dla zewnętrznych pluginów w trakcie okna migracji i ostrzegają raz z
    kodem zgodności `runtime-config-load-write`. Dołączone pluginy i kod runtime
    repozytorium są chronione przez zabezpieczenia skanera w
    `pnpm check:deprecated-api-usage` i
    `pnpm check:no-runtime-action-load-config`: nowe użycie produkcyjnego pluginu
    kończy się bezpośrednim niepowodzeniem, bezpośrednie zapisy konfiguracji zawodzą, metody serwera gateway muszą używać
    zrzutu runtime żądania, pomocniki wysyłki/akcji/klienta kanału runtime
    muszą otrzymywać konfigurację ze swojej granicy, a długotrwałe moduły runtime mają
    zero dozwolonych otaczających wywołań `loadConfig()`.

    Nowy kod pluginu powinien także unikać importowania szerokiego
    barrela zgodności `openclaw/plugin-sdk/config-runtime`. Użyj wąskiej
    podścieżki SDK dopasowanej do zadania:

    | Potrzeba | Import |
    | --- | --- |
    | Typy konfiguracji, takie jak `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Asercje już załadowanej konfiguracji i wyszukiwanie konfiguracji wejścia pluginu | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Odczyty bieżącego zrzutu runtime | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Zapisy konfiguracji | `openclaw/plugin-sdk/config-mutation` |
    | Pomocniki magazynu sesji | `openclaw/plugin-sdk/session-store-runtime` |
    | Konfiguracja tabel Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Pomocniki runtime zasad grup | `openclaw/plugin-sdk/runtime-group-policy` |
    | Rozwiązywanie wejścia sekretu | `openclaw/plugin-sdk/secret-input-runtime` |
    | Nadpisania modelu/sesji | `openclaw/plugin-sdk/model-session-runtime` |

    Dołączone pluginy i ich testy są chronione skanerem przed szerokim
    barrelem, aby importy i mocki pozostawały lokalne wobec potrzebnego im zachowania. Szeroki
    barrel nadal istnieje dla zgodności zewnętrznej, ale nowy kod nie powinien
    od niego zależeć.

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    Dołączone pluginy muszą zastąpić handlery wyników narzędzi
    `api.registerEmbeddedExtensionFactory(...)` przeznaczone tylko dla embedded-runnera
    neutralnym wobec runtime middleware.

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

    Zainstalowane pluginy mogą również rejestrować middleware wyników narzędzi, gdy są
    jawnie włączone i deklarują każdy docelowy runtime w
    `contracts.agentToolResultMiddleware`. Niezadeklarowane rejestracje zainstalowanego middleware
    są odrzucane.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Pluginy kanałów obsługujące zatwierdzenia ujawniają teraz natywne zachowanie zatwierdzeń przez
    `approvalCapability.nativeRuntime` oraz współdzielony rejestr kontekstu runtime.

    Kluczowe zmiany:

    - Zastąp `approvalCapability.handler.loadRuntime(...)` przez
      `approvalCapability.nativeRuntime`
    - Przenieś autoryzację/dostarczanie specyficzne dla zatwierdzeń ze starego okablowania `plugin.auth` /
      `plugin.approvals` na `approvalCapability`
    - `ChannelPlugin.approvals` zostało usunięte z publicznego kontraktu pluginu kanału;
      przenieś pola delivery/native/render na `approvalCapability`
    - `plugin.auth` pozostaje tylko dla przepływów logowania/wylogowania kanału; hooki autoryzacji
      zatwierdzeń w tym miejscu nie są już odczytywane przez rdzeń
    - Rejestruj obiekty runtime należące do kanału, takie jak klienci, tokeny lub aplikacje Bolt,
      przez `openclaw/plugin-sdk/channel-runtime-context`
    - Nie wysyłaj powiadomień o przekierowaniu należących do pluginu z natywnych handlerów zatwierdzeń;
      rdzeń odpowiada teraz za powiadomienia o skierowaniu gdzie indziej na podstawie rzeczywistych wyników dostarczenia
    - Przekazując `channelRuntime` do `createChannelManager(...)`, zapewnij
      rzeczywistą powierzchnię `createPluginRuntime().channel`. Częściowe stuby są odrzucane.

    Zobacz `/plugins/sdk-channel-plugins`, aby poznać bieżący układ capability zatwierdzeń.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Jeśli Twój plugin używa `openclaw/plugin-sdk/windows-spawn`, nierozwiązane wrappery Windows
    `.cmd`/`.bat` teraz zawodzą w trybie zamkniętym, chyba że jawnie przekażesz
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
    Przeszukaj swój plugin pod kątem importów z dowolnej przestarzałej powierzchni:

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

    W przypadku pomocników po stronie hosta użyj wstrzykniętego runtime pluginu zamiast importować
    bezpośrednio:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Ten sam wzorzec dotyczy innych pomocników starszego mostu:

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
    `openclaw/plugin-sdk/infra-runtime` nadal istnieje na potrzeby zgodności
    zewnętrznej, ale nowy kod powinien importować zawężoną powierzchnię pomocniczą,
    której faktycznie potrzebuje:

    | Potrzeba | Import |
    | --- | --- |
    | Pomocnicy kolejki zdarzeń systemowych | `openclaw/plugin-sdk/system-event-runtime` |
    | Pomocnicy wybudzania, zdarzeń i widoczności Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Opróżnianie kolejki oczekujących dostarczeń | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetria aktywności kanału | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Pamięci podręczne deduplikacji w pamięci i oparte na trwałym zapisie | `openclaw/plugin-sdk/dedupe-runtime` |
    | Pomocnicy bezpiecznych ścieżek lokalnych plików/mediów | `openclaw/plugin-sdk/file-access-runtime` |
    | Pobieranie świadome dyspozytora | `openclaw/plugin-sdk/runtime-fetch` |
    | Pomocnicy proxy i chronionego pobierania | `openclaw/plugin-sdk/fetch-runtime` |
    | Typy zasad dyspozytora SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typy żądań/rozstrzygnięć zatwierdzeń | `openclaw/plugin-sdk/approval-runtime` |
    | Ładunek odpowiedzi zatwierdzenia i pomocnicy poleceń | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Pomocnicy formatowania błędów | `openclaw/plugin-sdk/error-runtime` |
    | Oczekiwanie na gotowość transportu | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Pomocnicy bezpiecznych tokenów | `openclaw/plugin-sdk/secure-random-runtime` |
    | Ograniczona współbieżność zadań asynchronicznych | `openclaw/plugin-sdk/concurrency-runtime` |
    | Koercja liczbowa | `openclaw/plugin-sdk/number-runtime` |
    | Procesowo lokalna blokada asynchroniczna | `openclaw/plugin-sdk/async-lock-runtime` |
    | Blokady plików | `openclaw/plugin-sdk/file-lock` |

    Wbudowane pluginy są chronione przez skaner przed `infra-runtime`, więc kod repozytorium
    nie może cofnąć się do szerokiego barrela.

  </Step>

  <Step title="Migrate channel route helpers">
    Nowy kod tras kanału powinien używać `openclaw/plugin-sdk/channel-route`.
    Starsze nazwy klucza trasy i porównywalnego celu pozostają aliasami zgodności
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
    w natywnych zatwierdzeniach, tłumieniu odpowiedzi, deduplikacji przychodzącej,
    dostarczaniu Cron i routingu sesji.

    Nie dodawaj nowych użyć `ChannelMessagingAdapter.parseExplicitTarget` ani
    pomocników załadowanych tras opartych na parserze (`parseExplicitTargetForLoadedChannel`
    lub `resolveRouteTargetForLoadedChannel`) ani
    `resolveChannelRouteTargetWithParser(...)` z `plugin-sdk/channel-route`.
    Te hooki są przestarzałe i pozostają tylko dla starszych pluginów w okresie
    migracji. Nowe pluginy kanałów powinny używać
    `messaging.targetResolver.resolveTarget(...)` do normalizacji identyfikatora celu
    i awaryjnej obsługi chybienia katalogu, `messaging.inferTargetChatType(...)`, gdy core
    potrzebuje wczesnego rodzaju peera, oraz `messaging.resolveOutboundSessionRoute(...)`
    dla natywnej dla dostawcy sesji i tożsamości wątku.

  </Step>

  <Step title="Build and test">
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
  | `plugin-sdk/core` | Starszy zbiorczy reeksport definicji/konstruktorów punktów wejścia kanału | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Eksport głównego schematu konfiguracji | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Pomocnik punktu wejścia pojedynczego dostawcy | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Skoncentrowane definicje i konstruktory punktów wejścia kanału | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Współdzielone pomocniki kreatora konfiguracji | Translator konfiguracji, prompty listy dozwolonych, konstruktory stanu konfiguracji |
  | `plugin-sdk/setup-runtime` | Pomocniki środowiska uruchomieniowego na czas konfiguracji | `createSetupTranslator`, bezpieczne dla importu adaptery poprawek konfiguracji, pomocniki notatek wyszukiwania, `promptResolvedAllowFrom`, `splitSetupEntries`, delegowane proxy konfiguracji |
  | `plugin-sdk/setup-adapter-runtime` | Przestarzały alias adaptera konfiguracji | Użyj `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Pomocniki narzędzi konfiguracji | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Pomocniki wielu kont | Pomocniki listy kont/konfiguracji/bramki akcji |
  | `plugin-sdk/account-id` | Pomocniki identyfikatora konta | `DEFAULT_ACCOUNT_ID`, normalizacja identyfikatora konta |
  | `plugin-sdk/account-resolution` | Pomocniki wyszukiwania kont | Pomocniki wyszukiwania kont i domyślnego fallbacku |
  | `plugin-sdk/account-helpers` | Wąskie pomocniki kont | Pomocniki listy kont/akcji konta |
  | `plugin-sdk/channel-setup` | Adaptery kreatora konfiguracji | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Prymitywy parowania DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Prefiks odpowiedzi, pisanie i okablowanie dostarczania źródłowego | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabryki adapterów konfiguracji i pomocniki dostępu DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Konstruktory schematów konfiguracji | Współdzielone prymitywy schematu konfiguracji kanału i tylko ogólny konstruktor |
  | `plugin-sdk/bundled-channel-config-schema` | Dołączone schematy konfiguracji | Tylko dołączone plugins utrzymywane przez OpenClaw; nowe plugins muszą definiować schematy lokalne dla Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Przestarzałe dołączone schematy konfiguracji | Tylko alias zgodności; użyj `plugin-sdk/bundled-channel-config-schema` dla utrzymywanych dołączonych plugins |
  | `plugin-sdk/telegram-command-config` | Pomocniki konfiguracji poleceń Telegram | Normalizacja nazw poleceń, przycinanie opisów, walidacja duplikatów/konfliktów |
  | `plugin-sdk/channel-policy` | Rozwiązywanie zasad grup/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Przestarzała fasada zgodności | Użyj `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Pomocniki kopert przychodzących | Współdzielone pomocniki tras i konstruktora kopert |
  | `plugin-sdk/channel-inbound` | Pomocniki odbioru przychodzącego | Budowanie kontekstu, formatowanie, korzenie, uruchamiacze, przygotowane wysyłanie odpowiedzi i predykaty wysyłki |
  | `plugin-sdk/messaging-targets` | Przestarzała ścieżka importu parsowania celu | Użyj `plugin-sdk/channel-targets` dla ogólnych pomocników parsowania celu, `plugin-sdk/channel-route` do porównywania tras oraz należących do Plugin `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` do rozwiązywania celu specyficznego dla dostawcy |
  | `plugin-sdk/outbound-media` | Pomocniki mediów wychodzących | Współdzielone ładowanie mediów wychodzących |
  | `plugin-sdk/outbound-send-deps` | Przestarzała fasada zgodności | Użyj `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Pomocniki cyklu życia wiadomości wychodzących | Adaptery wiadomości, potwierdzenia odbioru, pomocniki trwałego wysyłania, pomocniki podglądu na żywo/streamingu, opcje odpowiedzi, pomocniki cyklu życia, tożsamość wychodząca i planowanie ładunku |
  | `plugin-sdk/channel-streaming` | Przestarzała fasada zgodności | Użyj `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Przestarzała fasada zgodności | Użyj `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Pomocniki wiązania wątku | Pomocniki cyklu życia i adapterów wiązania wątku |
  | `plugin-sdk/agent-media-payload` | Starsze pomocniki ładunku mediów | Konstruktor ładunku mediów agenta dla starszych układów pól |
  | `plugin-sdk/channel-runtime` | Przestarzały shim zgodności | Tylko narzędzia środowiska uruchomieniowego starszych kanałów |
  | `plugin-sdk/channel-send-result` | Typy wyników wysyłania | Typy wyników odpowiedzi |
  | `plugin-sdk/runtime-store` | Trwała pamięć Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Szerokie pomocniki środowiska uruchomieniowego | Pomocniki środowiska uruchomieniowego/logowania/kopii zapasowej/instalacji Plugin |
  | `plugin-sdk/runtime-env` | Wąskie pomocniki środowiska uruchomieniowego env | Pomocniki loggera/środowiska uruchomieniowego env, limitu czasu, ponawiania i backoffu |
  | `plugin-sdk/plugin-runtime` | Współdzielone pomocniki środowiska uruchomieniowego Plugin | Pomocniki poleceń/hooków/http/interaktywne Plugin |
  | `plugin-sdk/hook-runtime` | Pomocniki potoku hooków | Współdzielone pomocniki potoku hooków Webhook/wewnętrznych |
  | `plugin-sdk/lazy-runtime` | Leniwe pomocniki środowiska uruchomieniowego | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Pomocniki procesów | Współdzielone pomocniki wykonywania |
  | `plugin-sdk/cli-runtime` | Pomocniki środowiska uruchomieniowego CLI | Formatowanie poleceń, oczekiwania, pomocniki wersji |
  | `plugin-sdk/gateway-runtime` | Pomocniki Gateway | Klient Gateway, pomocnik startu gotowy na pętlę zdarzeń, rozwiązywanie ogłaszanego hosta LAN i pomocniki poprawek stanu kanału |
  | `plugin-sdk/config-runtime` | Przestarzały shim zgodności konfiguracji | Preferuj `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` i `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Pomocniki poleceń Telegram | Stabilne względem fallbacku pomocniki walidacji poleceń Telegram, gdy powierzchnia kontraktu dołączonego Telegram jest niedostępna |
  | `plugin-sdk/approval-runtime` | Pomocniki promptów zatwierdzania | Ładunek zatwierdzania exec/Plugin, pomocniki możliwości/profili zatwierdzania, natywne pomocniki routingu/środowiska uruchomieniowego zatwierdzania i formatowanie ścieżek wyświetlania zatwierdzeń strukturalnych |
  | `plugin-sdk/approval-auth-runtime` | Pomocniki autoryzacji zatwierdzania | Rozwiązywanie zatwierdzającego, autoryzacja akcji w tym samym czacie |
  | `plugin-sdk/approval-client-runtime` | Pomocniki klienta zatwierdzania | Natywne pomocniki profilu/filtra zatwierdzania exec |
  | `plugin-sdk/approval-delivery-runtime` | Pomocniki dostarczania zatwierdzeń | Natywne adaptery możliwości/dostarczania zatwierdzeń |
  | `plugin-sdk/approval-gateway-runtime` | Pomocniki Gateway zatwierdzania | Współdzielony pomocnik rozwiązywania Gateway zatwierdzania |
  | `plugin-sdk/approval-handler-adapter-runtime` | Pomocniki adapterów zatwierdzania | Lekkie pomocniki ładowania natywnych adapterów zatwierdzania dla gorących punktów wejścia kanału |
  | `plugin-sdk/approval-handler-runtime` | Pomocniki obsługi zatwierdzania | Szersze pomocniki środowiska uruchomieniowego obsługi zatwierdzania; preferuj węższe szwy adaptera/Gateway, gdy wystarczają |
  | `plugin-sdk/approval-native-runtime` | Pomocniki celu zatwierdzania | Natywne pomocniki wiązania celu/konta zatwierdzania |
  | `plugin-sdk/approval-reply-runtime` | Pomocniki odpowiedzi zatwierdzania | Pomocniki ładunku odpowiedzi zatwierdzania exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Pomocniki kontekstu środowiska uruchomieniowego kanału | Ogólne pomocniki rejestracji/pobierania/obserwowania kontekstu środowiska uruchomieniowego kanału |
  | `plugin-sdk/security-runtime` | Pomocniki bezpieczeństwa | Współdzielone pomocniki zaufania, bramkowania DM, ograniczonych do korzenia plików/ścieżek, treści zewnętrznych i zbierania sekretów |
  | `plugin-sdk/ssrf-policy` | Pomocniki zasad SSRF | Pomocniki listy dozwolonych hostów i zasad sieci prywatnych |
  | `plugin-sdk/ssrf-runtime` | Pomocniki środowiska uruchomieniowego SSRF | Przypięty dispatcher, chroniony fetch, pomocniki zasad SSRF |
  | `plugin-sdk/system-event-runtime` | Pomocniki zdarzeń systemowych | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Pomocniki Heartbeat | Pomocniki wybudzania, zdarzeń i widoczności Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Pomocniki kolejki dostarczania | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Pomocniki aktywności kanału | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Pomocniki deduplikacji | Pamięci podręczne deduplikacji w pamięci i oparte na trwałej pamięci |
  | `plugin-sdk/file-access-runtime` | Pomocniki dostępu do plików | Pomocniki bezpiecznych ścieżek plików/mediów lokalnych |
  | `plugin-sdk/transport-ready-runtime` | Pomocniki gotowości transportu | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Pomocniki zasad zatwierdzania exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Pomocniki ograniczonej pamięci podręcznej | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Pomocniki bramkowania diagnostycznego | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Pomocniki formatowania błędów | `formatUncaughtError`, `isApprovalNotFoundError`, pomocniki grafu błędów |
  | `plugin-sdk/fetch-runtime` | Pomocniki opakowanego fetch/proxy | `resolveFetch`, pomocniki proxy, pomocniki opcji EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Pomocniki normalizacji hosta | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Pomocniki ponawiania | `RetryConfig`, `retryAsync`, uruchamiacze zasad |
  | `plugin-sdk/allow-from` | Formatowanie listy dozwolonych i mapowanie wejścia | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Pomocniki bramkowania poleceń i powierzchni poleceń | `resolveControlCommandGate`, pomocniki autoryzacji nadawcy, pomocniki rejestru poleceń, w tym formatowanie dynamicznego menu argumentów |
  | `plugin-sdk/command-status` | Renderery stanu/pomocy poleceń | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsowanie wejścia sekretu | Pomocniki wejścia sekretu |
  | `plugin-sdk/webhook-ingress` | Pomocniki żądań Webhook | Narzędzia celu Webhook |
  | `plugin-sdk/webhook-request-guards` | Pomocniki strażnika treści Webhook | Pomocniki odczytu/limitu treści żądania |
  | `plugin-sdk/reply-runtime` | Współdzielone środowisko uruchomieniowe odpowiedzi | Wysyłka przychodząca, Heartbeat, planer odpowiedzi, dzielenie na fragmenty |
  | `plugin-sdk/reply-dispatch-runtime` | Wąskie pomocniki wysyłki odpowiedzi | Finalizacja, wysyłka dostawcy i pomocniki etykiet konwersacji |
  | `plugin-sdk/reply-history` | Pomocniki historii odpowiedzi | `createChannelHistoryWindow`; przestarzałe eksporty zgodności pomocników map, takie jak `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` i `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planowanie referencji odpowiedzi | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Pomocniki fragmentów odpowiedzi | Pomocniki dzielenia tekstu/Markdown na fragmenty |
  | `plugin-sdk/session-store-runtime` | Pomocniki magazynu sesji | Pomocniki ścieżki magazynu i czasu updated-at |
  | `plugin-sdk/state-paths` | Pomocniki ścieżek stanu | Pomocniki katalogów stanu i OAuth |
  | `plugin-sdk/routing` | Pomocnicy routingu/kluczy sesji | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, pomocnicy normalizacji kluczy sesji |
  | `plugin-sdk/status-helpers` | Pomocnicy statusu kanału | Konstruktory podsumowań statusu kanału/konta, wartości domyślne stanu runtime, pomocnicy metadanych problemów |
  | `plugin-sdk/target-resolver-runtime` | Pomocnicy resolwera celu | Współdzieleni pomocnicy resolwera celu |
  | `plugin-sdk/string-normalization-runtime` | Pomocnicy normalizacji ciągów znaków | Pomocnicy normalizacji slugów/ciągów znaków |
  | `plugin-sdk/request-url` | Pomocnicy URL-i żądań | Wyodrębnianie URL-i tekstowych z danych wejściowych podobnych do żądań |
  | `plugin-sdk/run-command` | Pomocnicy poleceń z limitem czasu | Uruchamianie poleceń z limitem czasu i znormalizowanymi stdout/stderr |
  | `plugin-sdk/param-readers` | Czytniki parametrów | Wspólne czytniki parametrów narzędzi/CLI |
  | `plugin-sdk/tool-payload` | Wyodrębnianie payloadu narzędzia | Wyodrębnianie znormalizowanych payloadów z obiektów wyniku narzędzia |
  | `plugin-sdk/tool-send` | Wyodrębnianie wysyłki narzędzia | Wyodrębnianie kanonicznych pól celu wysyłki z argumentów narzędzia |
  | `plugin-sdk/temp-path` | Pomocnicy ścieżek tymczasowych | Współdzieleni pomocnicy ścieżek tymczasowego pobierania |
  | `plugin-sdk/logging-core` | Pomocnicy logowania | Logger podsystemu i pomocnicy redakcji |
  | `plugin-sdk/markdown-table-runtime` | Pomocnicy tabel Markdown | Pomocnicy trybu tabel Markdown |
  | `plugin-sdk/reply-payload` | Typy odpowiedzi wiadomości | Typy payloadu odpowiedzi |
  | `plugin-sdk/provider-setup` | Wyselekcjonowani pomocnicy konfiguracji lokalnego/samoobsługowego dostawcy | Pomocnicy wykrywania/konfiguracji dostawcy samoobsługowego |
  | `plugin-sdk/self-hosted-provider-setup` | Ukierunkowani pomocnicy konfiguracji samoobsługowego dostawcy zgodnego z OpenAI | Ci sami pomocnicy wykrywania/konfiguracji dostawcy samoobsługowego |
  | `plugin-sdk/provider-auth-runtime` | Pomocnicy uwierzytelniania runtime dostawcy | Pomocnicy rozwiązywania kluczy API w runtime |
  | `plugin-sdk/provider-auth-api-key` | Pomocnicy konfiguracji klucza API dostawcy | Pomocnicy onboardingu/zapisu profilu dla kluczy API |
  | `plugin-sdk/provider-auth-result` | Pomocnicy wyniku uwierzytelniania dostawcy | Standardowy konstruktor wyniku uwierzytelniania OAuth |
  | `plugin-sdk/provider-selection-runtime` | Pomocnicy wyboru dostawcy | Wybór skonfigurowanego lub automatycznego dostawcy i scalanie surowej konfiguracji dostawcy |
  | `plugin-sdk/provider-env-vars` | Pomocnicy zmiennych środowiskowych dostawcy | Pomocnicy wyszukiwania zmiennych środowiskowych uwierzytelniania dostawcy |
  | `plugin-sdk/provider-model-shared` | Współdzieleni pomocnicy modelu/odtwarzania dostawcy | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, współdzielone konstruktory zasad odtwarzania, pomocnicy endpointów dostawcy i pomocnicy normalizacji identyfikatorów modeli |
  | `plugin-sdk/provider-catalog-shared` | Współdzieleni pomocnicy katalogu dostawców | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Poprawki onboardingu dostawcy | Pomocnicy konfiguracji onboardingu |
  | `plugin-sdk/provider-http` | Pomocnicy HTTP dostawcy | Ogólni pomocnicy możliwości HTTP/endpointów dostawcy, w tym pomocnicy formularzy multipart do transkrypcji audio |
  | `plugin-sdk/provider-web-fetch` | Pomocnicy web-fetch dostawcy | Pomocnicy rejestracji/cache dostawcy web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Pomocnicy konfiguracji wyszukiwania WWW dostawcy | Wąscy pomocnicy konfiguracji/poświadczeń wyszukiwania WWW dla dostawców, którzy nie potrzebują okablowania włączania pluginu |
  | `plugin-sdk/provider-web-search-contract` | Pomocnicy kontraktu wyszukiwania WWW dostawcy | Wąscy pomocnicy kontraktu konfiguracji/poświadczeń wyszukiwania WWW, tacy jak `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` oraz zakresowe settery/gettery poświadczeń |
  | `plugin-sdk/provider-web-search` | Pomocnicy wyszukiwania WWW dostawcy | Pomocnicy rejestracji/cache/runtime dostawcy wyszukiwania WWW |
  | `plugin-sdk/provider-tools` | Pomocnicy zgodności narzędzi/schematów dostawcy | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` oraz czyszczenie schematów + diagnostyka dla DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Pomocnicy użycia dostawcy | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` i inni pomocnicy użycia dostawcy |
  | `plugin-sdk/provider-stream` | Pomocnicy wrapperów strumieni dostawcy | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, typy wrapperów strumieni oraz współdzieleni pomocnicy wrapperów Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Pomocnicy transportu dostawcy | Natywni pomocnicy transportu dostawcy, tacy jak chroniony fetch, wyodrębnianie tekstu z wyników narzędzi, transformacje wiadomości transportu i zapisywalne strumienie zdarzeń transportu |
  | `plugin-sdk/keyed-async-queue` | Uporządkowana kolejka asynchroniczna | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Współdzieleni pomocnicy mediów | Pomocnicy pobierania/przekształcania/przechowywania mediów, sondowanie wymiarów wideo oparte na ffprobe oraz konstruktory payloadów mediów |
  | `plugin-sdk/media-generation-runtime` | Współdzieleni pomocnicy generowania mediów | Współdzieleni pomocnicy przełączania awaryjnego, wyboru kandydatów i komunikatów o brakującym modelu dla generowania obrazów/wideo/muzyki |
  | `plugin-sdk/media-understanding` | Pomocnicy rozumienia mediów | Typy dostawców rozumienia mediów oraz eksporty pomocników obrazów/audio dla dostawców |
  | `plugin-sdk/text-runtime` | Przestarzały szeroki eksport zgodności tekstu | Użyj `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` i `logging-core` |
  | `plugin-sdk/text-chunking` | Pomocnicy dzielenia tekstu na fragmenty | Pomocnik dzielenia tekstu wychodzącego na fragmenty |
  | `plugin-sdk/speech` | Pomocnicy mowy | Typy dostawców mowy oraz pomocnicy dyrektyw, rejestru i walidacji dla dostawców, a także konstruktor TTS zgodny z OpenAI |
  | `plugin-sdk/speech-core` | Współdzielony rdzeń mowy | Typy dostawców mowy, rejestr, dyrektywy, normalizacja |
  | `plugin-sdk/realtime-transcription` | Pomocnicy transkrypcji w czasie rzeczywistym | Typy dostawców, pomocnicy rejestru i współdzielony pomocnik sesji WebSocket |
  | `plugin-sdk/realtime-voice` | Pomocnicy głosu w czasie rzeczywistym | Typy dostawców, pomocnicy rejestru/rozwiązywania, pomocnicy sesji mostka, współdzielone kolejki mowy zwrotnej agenta, sterowanie głosem aktywnego uruchomienia, kondycja transkryptu/zdarzeń, tłumienie echa, dopasowywanie pytań konsultacyjnych, koordynacja wymuszonej konsultacji, śledzenie kontekstu tury, śledzenie aktywności wyjścia i pomocnicy szybkiej konsultacji kontekstu |
  | `plugin-sdk/image-generation` | Pomocnicy generowania obrazów | Typy dostawców generowania obrazów oraz pomocnicy zasobów obrazów/adresów URL danych i konstruktor dostawcy obrazów zgodny z OpenAI |
  | `plugin-sdk/image-generation-core` | Współdzielony rdzeń generowania obrazów | Typy generowania obrazów, przełączanie awaryjne, uwierzytelnianie i pomocnicy rejestru |
  | `plugin-sdk/music-generation` | Pomocnicy generowania muzyki | Typy dostawców/żądań/wyników generowania muzyki |
  | `plugin-sdk/music-generation-core` | Współdzielony rdzeń generowania muzyki | Typy generowania muzyki, pomocnicy przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie referencji modelu |
  | `plugin-sdk/video-generation` | Pomocnicy generowania wideo | Typy dostawców/żądań/wyników generowania wideo |
  | `plugin-sdk/video-generation-core` | Współdzielony rdzeń generowania wideo | Typy generowania wideo, pomocnicy przełączania awaryjnego, wyszukiwanie dostawcy i parsowanie referencji modelu |
  | `plugin-sdk/interactive-runtime` | Pomocnicy interaktywnych odpowiedzi | Normalizacja/redukcja payloadu interaktywnej odpowiedzi |
  | `plugin-sdk/channel-config-primitives` | Prymitywy konfiguracji kanału | Wąskie prymitywy schematu konfiguracji kanału |
  | `plugin-sdk/channel-config-writes` | Pomocnicy zapisu konfiguracji kanału | Pomocnicy autoryzacji zapisu konfiguracji kanału |
  | `plugin-sdk/channel-plugin-common` | Współdzielony prelude kanału | Współdzielone eksporty prelude pluginu kanału |
  | `plugin-sdk/channel-status` | Pomocnicy statusu kanału | Współdzieleni pomocnicy snapshotów/podsumowań statusu kanału |
  | `plugin-sdk/allowlist-config-edit` | Pomocnicy konfiguracji listy dozwolonych | Pomocnicy edycji/odczytu konfiguracji listy dozwolonych |
  | `plugin-sdk/group-access` | Pomocnicy dostępu grupowego | Współdzieleni pomocnicy decyzji o dostępie grupowym |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Przestarzałe fasady zgodności | Użyj `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Pomocnicy ochrony bezpośrednich DM | Wąscy pomocnicy zasad ochrony przed kryptografią |
  | `plugin-sdk/extension-shared` | Współdzieleni pomocnicy rozszerzeń | Prymitywy pomocników pasywnego kanału/statusu i ambient proxy |
  | `plugin-sdk/webhook-targets` | Pomocnicy celów Webhook | Rejestr celów Webhook i pomocnicy instalacji tras |
  | `plugin-sdk/webhook-path` | Przestarzały alias ścieżki webhooka | Użyj `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Współdzieleni pomocnicy mediów WWW | Pomocnicy ładowania mediów zdalnych/lokalnych |
  | `plugin-sdk/zod` | Przestarzały reeksport zgodności Zod | Importuj `zod` z `zod` bezpośrednio |
  | `plugin-sdk/memory-core` | Dołączani pomocnicy memory-core | Powierzchnia pomocników menedżera/konfiguracji/plików/CLI pamięci |
  | `plugin-sdk/memory-core-engine-runtime` | Fasada runtime silnika pamięci | Fasada runtime indeksu/wyszukiwania pamięci |
  | `plugin-sdk/memory-core-host-embedding-registry` | Rejestr embeddingów pamięci | Lekkie pomocniki rejestru dostawców embeddingów pamięci |
  | `plugin-sdk/memory-core-host-engine-foundation` | Silnik foundation hosta pamięci | Eksporty silnika foundation hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Silnik embeddingów hosta pamięci | Kontrakty embeddingów pamięci, dostęp do rejestru, dostawca lokalny oraz ogólni pomocnicy batch/zdalni; konkretni dostawcy zdalni żyją w swoich pluginach właścicielskich |
  | `plugin-sdk/memory-core-host-engine-qmd` | Silnik QMD hosta pamięci | Eksporty silnika QMD hosta pamięci |
  | `plugin-sdk/memory-core-host-engine-storage` | Silnik storage hosta pamięci | Eksporty silnika storage hosta pamięci |
  | `plugin-sdk/memory-core-host-multimodal` | Pomocnicy multimodalni hosta pamięci | Pomocnicy multimodalni hosta pamięci |
  | `plugin-sdk/memory-core-host-query` | Pomocnicy zapytań hosta pamięci | Pomocnicy zapytań hosta pamięci |
  | `plugin-sdk/memory-core-host-secret` | Pomocnicy sekretów hosta pamięci | Pomocnicy sekretów hosta pamięci |
  | `plugin-sdk/memory-core-host-events` | Przestarzały alias zdarzeń pamięci | Użyj `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Pomocnicy statusu hosta pamięci | Pomocnicy statusu hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime CLI hosta pamięci | Pomocnicy runtime CLI hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime rdzenia hosta pamięci | Pomocnicy runtime rdzenia hosta pamięci |
  | `plugin-sdk/memory-core-host-runtime-files` | Pomocnicy plików/runtime hosta pamięci | Pomocnicy plików/runtime hosta pamięci |
  | `plugin-sdk/memory-host-core` | Alias runtime rdzenia hosta pamięci | Neutralny względem dostawcy alias pomocników runtime rdzenia hosta pamięci |
  | `plugin-sdk/memory-host-events` | Alias dziennika zdarzeń hosta pamięci | Neutralny względem dostawcy alias pomocników dziennika zdarzeń hosta pamięci |
  | `plugin-sdk/memory-host-files` | Przestarzały alias plików/runtime pamięci | Użyj `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Pomocnicy zarządzanego Markdown | Współdzieleni pomocnicy zarządzanego Markdown dla pluginów sąsiadujących z pamięcią |
  | `plugin-sdk/memory-host-search` | Fasada wyszukiwania Active Memory | Leniwa fasada runtime menedżera wyszukiwania Active Memory |
  | `plugin-sdk/memory-host-status` | Przestarzały alias statusu hosta pamięci | Użyj `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Narzędzia testowe | Przestarzały repozytoryjny barrel zgodności; użyj ukierunkowanych repozytoryjnych podścieżek testowych, takich jak `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` i `plugin-sdk/test-fixtures` |
</Accordion>

Ta tabela jest celowo wspólnym podzbiorem migracji, a nie pełną powierzchnią
SDK. Inwentarz punktów wejścia kompilatora znajduje się w
`scripts/lib/plugin-sdk-entrypoints.json`; eksporty pakietu są generowane z
publicznego podzbioru.

Zarezerwowane pomocnicze styki dla dołączonych plugins zostały wycofane z
publicznej mapy eksportów SDK z wyjątkiem jawnie udokumentowanych fasad
zgodności, takich jak przestarzały shim `plugin-sdk/discord` zachowany dla
opublikowanego pakietu `@openclaw/discord@2026.3.13`. Pomocniki specyficzne
dla właściciela znajdują się w pakiecie właścicielskiego plugin; wspólne
zachowanie hosta powinno przechodzić przez ogólne kontrakty SDK, takie jak
`plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` i
`plugin-sdk/plugin-config-runtime`.

Użyj najwęższego importu pasującego do zadania. Jeśli nie możesz znaleźć
eksportu, sprawdź źródło w `src/plugin-sdk/` albo zapytaj maintainerów, który
ogólny kontrakt powinien go posiadać.

## Aktywne wycofania

Węższe wycofania, które mają zastosowanie w całym SDK plugin, kontrakcie
providera, powierzchni runtime i manifeście. Każde z nich nadal działa dzisiaj,
ale zostanie usunięte w przyszłej wersji major. Wpis pod każdym elementem
mapuje stare API na jego kanoniczny zamiennik.

<AccordionGroup>
  <Accordion title="Konstruktory pomocy command-auth → command-status">
    **Stare (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Nowe (`openclaw/plugin-sdk/command-status`)**: te same sygnatury, te
    same eksporty - tylko importowane z węższej podścieżki. `command-auth`
    reeksportuje je jako stuby zgodności.

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

    Niżej położone plugins kanałów (Slack, Discord, Matrix, MS Teams) już się
    przełączyły.

  </Accordion>

  <Accordion title="Shim runtime kanału i pomocniki akcji kanału">
    `openclaw/plugin-sdk/channel-runtime` to shim zgodności dla starszych
    plugins kanałów. Nie importuj go w nowym kodzie; użyj
    `openclaw/plugin-sdk/channel-runtime-context` do rejestrowania obiektów
    runtime.

    Pomocniki `channelActions*` w `openclaw/plugin-sdk/channel-actions` są
    przestarzałe wraz z surowymi eksportami kanału "actions". Udostępniaj
    capabilities przez semantyczną powierzchnię `presentation` zamiast tego -
    plugins kanałów deklarują, co renderują (karty, przyciski, selecty), a nie
    które surowe nazwy akcji akceptują.

  </Accordion>

  <Accordion title="Pomocnik providerów wyszukiwania w sieci tool() → createTool() w plugin">
    **Stare**: fabryka `tool()` z `openclaw/plugin-sdk/provider-web-search`.

    **Nowe**: zaimplementuj `createTool(...)` bezpośrednio w plugin providera.
    OpenClaw nie potrzebuje już pomocnika SDK do rejestrowania wrappera
    narzędzia.

  </Accordion>

  <Accordion title="Koperty kanałów w plaintext → BodyForAgent">
    **Stare**: `formatInboundEnvelope(...)` (i
    `ChannelMessageForAgent.channelEnvelope`) do budowania płaskiej koperty
    promptu w plaintext z przychodzących wiadomości kanału.

    **Nowe**: `BodyForAgent` oraz ustrukturyzowane bloki kontekstu użytkownika.
    Plugins kanałów dołączają metadane routingu (wątek, temat, odpowiedź-do,
    reakcje) jako typowane pola zamiast konkatenować je w ciąg promptu. Pomocnik
    `formatAgentEnvelope(...)` nadal jest obsługiwany dla syntetyzowanych
    kopert kierowanych do asystenta, ale przychodzące koperty w plaintext są
    wycofywane.

    Dotknięte obszary: `inbound_claim`, `message_received` i każdy niestandardowy
    plugin kanału, który przetwarzał tekst `channelEnvelope` po fakcie.

  </Accordion>

  <Accordion title="Hook deactivate → gateway_stop">
    **Stare**: `api.on("deactivate", handler)`.

    **Nowe**: `api.on("gateway_stop", handler)`. Zdarzenie i kontekst są tym
    samym kontraktem sprzątania przy zamykaniu; zmienia się tylko nazwa hooka.

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

  <Accordion title="Hook subagent_spawning → powiązanie wątku w core">
    **Stare**: `api.on("subagent_spawning", handler)` zwracające
    `threadBindingReady` albo `deliveryOrigin`.

    **Nowe**: pozwól core przygotować powiązania subagentów `thread: true`
    przez adapter powiązań sesji kanału. Używaj
    `api.on("subagent_spawned", handler)` wyłącznie do obserwacji po
    uruchomieniu.

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
    `PluginHookSubagentSpawningResult` i
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` pozostają wyłącznie
    jako przestarzałe powierzchnie zgodności, gdy zewnętrzne plugins migrują.

  </Accordion>

  <Accordion title="Typy wykrywania providerów → typy katalogu providerów">
    Cztery aliasy typów wykrywania są teraz cienkimi wrapperami wokół typów z
    ery katalogu:

    | Stary alias               | Nowy typ                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Dodatkowo starszy statyczny zbiór `ProviderCapabilities` - plugins
    providerów powinny używać jawnych hooków providera, takich jak
    `buildReplayPolicy`, `normalizeToolSchemas` i `wrapStreamFn`, zamiast
    statycznego obiektu.

  </Accordion>

  <Accordion title="Hooki zasad Thinking → resolveThinkingProfile">
    **Stare** (trzy osobne hooki w `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` i
    `resolveDefaultThinkingLevel(ctx)`.

    **Nowe**: pojedyncze `resolveThinkingProfile(ctx)`, które zwraca
    `ProviderThinkingProfile` z kanonicznym `id`, opcjonalnym `label` i
    rankingowaną listą poziomów. OpenClaw automatycznie obniża nieaktualne
    zapisane wartości według rangi profilu.

    Kontekst obejmuje `provider`, `modelId`, opcjonalnie scalone `reasoning`
    oraz opcjonalnie scalone fakty `compat` modelu. Plugins providerów mogą
    używać tych faktów katalogu, aby ujawniać profil specyficzny dla modelu
    tylko wtedy, gdy skonfigurowany kontrakt żądania go obsługuje.

    Zaimplementuj jeden hook zamiast trzech. Starsze hooki nadal działają w
    oknie wycofywania, ale nie są komponowane z wynikiem profilu.

  </Accordion>

  <Accordion title="Zewnętrzni providerzy uwierzytelniania → contracts.externalAuthProviders">
    **Stare**: implementowanie zewnętrznych hooków uwierzytelniania bez
    deklarowania providera w manifeście plugin.

    **Nowe**: zadeklaruj `contracts.externalAuthProviders` w manifeście plugin
    **oraz** zaimplementuj `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Wyszukiwanie zmiennych env providera → setup.providers[].envVars">
    **Stare** pole manifestu: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Nowe**: odzwierciedl to samo wyszukiwanie zmiennych env w
    `setup.providers[].envVars` w manifeście. Konsoliduje to metadane env dla
    setup/status w jednym miejscu i unika uruchamiania runtime plugin tylko po
    to, aby odpowiedzieć na zapytania o zmienne env.

    `providerAuthEnvVars` pozostaje obsługiwane przez adapter zgodności, dopóki
    okno wycofywania się nie zamknie.

  </Accordion>

  <Accordion title="Rejestracja plugin pamięci → registerMemoryCapability">
    **Stare**: trzy osobne wywołania -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Nowe**: jedno wywołanie w API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Te same sloty, pojedyncze wywołanie rejestracji. Addytywne pomocniki promptu
    i korpusu (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)
    nie są dotknięte.

  </Accordion>

  <Accordion title="API providera embeddingów pamięci">
    **Stare**: `api.registerMemoryEmbeddingProvider(...)` plus
    `contracts.memoryEmbeddingProviders`.

    **Nowe**: `api.registerEmbeddingProvider(...)` plus
    `contracts.embeddingProviders`.

    Ogólny kontrakt providera embeddingów jest wielokrotnego użytku poza
    pamięcią i stanowi obsługiwaną ścieżkę dla nowych providerów. Specyficzne
    dla pamięci API rejestracji pozostaje podłączone jako przestarzała zgodność,
    gdy istniejący providerzy migrują. Inspekcja plugin zgłasza użycie poza
    dołączonymi plugins jako dług zgodności.

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
    **Stare**: `runtime.tasks.flow` (liczba pojedyncza) zwracało aktywny akcesor
    przepływu zadań.

    **Nowe**: `runtime.tasks.managedFlows` utrzymuje zarządzany runtime mutacji
    TaskFlow dla plugins, które tworzą, aktualizują, anulują lub uruchamiają
    zadania podrzędne z przepływu. Użyj `runtime.tasks.flows`, gdy plugin
    potrzebuje tylko odczytów opartych na DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Osadzone fabryki rozszerzeń → middleware wyników narzędzi agenta">
    Omówiono powyżej w sekcji "Jak migrować → Migrowanie osadzonych rozszerzeń
    wyników narzędzi do middleware". Uwzględniono tutaj dla kompletności:
    usunięta ścieżka `api.registerEmbeddedExtensionFactory(...)` dostępna tylko
    dla osadzonego runnera została zastąpiona przez
    `api.registerAgentToolResultMiddleware(...)` z jawną listą runtime w
    `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
    `OpenClawSchemaType` reeksportowany z `openclaw/plugin-sdk` jest teraz
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
Wycofania na poziomie rozszerzeń (wewnątrz dołączonych plugins kanałów/providerów
pod `extensions/`) są śledzone w ich własnych barrelach `api.ts` i
`runtime-api.ts`. Nie wpływają one na kontrakty plugins firm trzecich i nie są
tutaj wymienione. Jeśli korzystasz bezpośrednio z lokalnego barrela dołączonego
plugin, przeczytaj komentarze o wycofaniach w tym barrelu przed aktualizacją.
</Note>

## Harmonogram usuwania

| Kiedy                  | Co się dzieje                                                          |
| ---------------------- | ---------------------------------------------------------------------- |
| **Teraz**              | Przestarzałe powierzchnie emitują ostrzeżenia w czasie działania       |
| **Następne wydanie główne** | Przestarzałe powierzchnie zostaną usunięte; pluginy, które nadal ich używają, przestaną działać |

Wszystkie pluginy rdzeniowe zostały już zmigrowane. Zewnętrzne pluginy powinny przeprowadzić migrację
przed następnym wydaniem głównym.

## Tymczasowe wyciszanie ostrzeżeń

Ustaw te zmienne środowiskowe podczas pracy nad migracją:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

To tymczasowa furtka awaryjna, nie trwałe rozwiązanie.

## Powiązane

- [Pierwsze kroki](/pl/plugins/building-plugins) - zbuduj swój pierwszy plugin
- [Omówienie SDK](/pl/plugins/sdk-overview) - pełna referencja importów podścieżek
- [Pluginy kanałów](/pl/plugins/sdk-channel-plugins) - budowanie pluginów kanałów
- [Pluginy dostawców](/pl/plugins/sdk-provider-plugins) - budowanie pluginów dostawców
- [Wnętrze pluginów](/pl/plugins/architecture) - szczegółowe omówienie architektury
- [Manifest pluginu](/pl/plugins/manifest) - referencja schematu manifestu
