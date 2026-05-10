---
read_when:
    - Sie sehen die Warnung OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Sie sehen die Warnung OPENCLAW_EXTENSION_API_DEPRECATED
    - Sie haben api.registerEmbeddedExtensionFactory vor OpenClaw 2026.4.25 verwendet
    - Sie stellen ein Plugin auf die moderne Plugin-Architektur um
    - Sie pflegen ein externes OpenClaw-Plugin
sidebarTitle: Migrate to SDK
summary: Von der veralteten Abwärtskompatibilitätsschicht zum modernen Plugin-SDK migrieren
title: Plugin-SDK-Migration
x-i18n:
    generated_at: "2026-05-10T19:46:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: e7595b41c15ce36dd8d2a3faf320cc9847b013b1f4807c02b8b97c6feaee4415
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw ist von einer breiten Abwärtskompatibilitätsschicht zu einer modernen Plugin-
Architektur mit fokussierten, dokumentierten Imports gewechselt. Wenn Ihr Plugin vor
der neuen Architektur erstellt wurde, hilft Ihnen dieser Leitfaden bei der Migration.

## Was sich ändert

Das alte Plugin-System stellte zwei weit geöffnete Oberflächen bereit, über die Plugins
alles, was sie benötigten, von einem einzigen Einstiegspunkt importieren konnten:

- **`openclaw/plugin-sdk/compat`** - ein einzelner Import, der Dutzende
  Hilfsfunktionen erneut exportierte. Er wurde eingeführt, um ältere Hook-basierte
  Plugins funktionsfähig zu halten, während die neue Plugin-Architektur aufgebaut
  wurde.
- **`openclaw/plugin-sdk/infra-runtime`** - ein breites Runtime-Hilfs- barrel, das
  Systemereignisse, Heartbeat-Status, Zustellungswarteschlangen, Fetch-/Proxy-Hilfen,
  Dateihilfen, Genehmigungstypen und nicht verwandte Dienstprogramme vermischte.
- **`openclaw/plugin-sdk/config-runtime`** - ein breites Config-Kompatibilitäts-barrel,
  das während des Migrationsfensters weiterhin veraltete direkte Lade-/Schreibhilfen
  enthält.
- **`openclaw/extension-api`** - eine Brücke, die Plugins direkten Zugriff auf
  hostseitige Hilfen wie den eingebetteten Agent-Runner gab.
- **`api.registerEmbeddedExtensionFactory(...)`** - ein entfernter, nur für Pi
  gebündelter Extension-Hook, der eingebettete Runner-Ereignisse wie
  `tool_result` beobachten konnte.

Die breiten Import-Oberflächen sind jetzt **veraltet**. Sie funktionieren zur Laufzeit
weiterhin, aber neue Plugins dürfen sie nicht verwenden, und bestehende Plugins sollten
migriert werden, bevor sie im nächsten Major-Release entfernt werden. Die Pi-only-API
zur Registrierung einer eingebetteten Extension-Factory wurde entfernt; verwenden Sie
stattdessen Tool-Result-Middleware.

OpenClaw entfernt oder reinterpretieren dokumentiertes Plugin-Verhalten nicht in derselben
Änderung, die einen Ersatz einführt. Breaking-Contract-Änderungen müssen zuerst durch
einen Kompatibilitätsadapter, Diagnosen, Dokumentation und ein Deprecation-Fenster gehen.
Das gilt für SDK-Imports, Manifest-Felder, Setup-APIs, Hooks und Runtime-
Registrierungsverhalten.

<Warning>
  Die Abwärtskompatibilitätsschicht wird in einem zukünftigen Major-Release entfernt.
  Plugins, die weiterhin von diesen Oberflächen importieren, werden dann nicht mehr
  funktionieren. Pi-only-Registrierungen für eingebettete Extension-Factories werden
  bereits nicht mehr geladen.
</Warning>

## Warum sich das geändert hat

Der alte Ansatz verursachte Probleme:

- **Langsamer Start** - das Importieren einer Hilfsfunktion lud Dutzende nicht verwandter Module
- **Zyklische Abhängigkeiten** - breite Re-Exports machten es leicht, Import-Zyklen zu erzeugen
- **Unklare API-Oberfläche** - es war nicht erkennbar, welche Exports stabil und welche intern waren

Das moderne Plugin-SDK behebt das: Jeder Import-Pfad (`openclaw/plugin-sdk/\<subpath\>`)
ist ein kleines, eigenständiges Modul mit klarem Zweck und dokumentiertem Vertrag.

Legacy-Komfortseams für Provider gebündelter Channels sind ebenfalls entfernt.
Channel-gebrandete Hilfsseams waren private Mono-Repo-Abkürzungen, keine stabilen
Plugin-Verträge. Verwenden Sie stattdessen schmale generische SDK-Subpaths. Innerhalb
des gebündelten Plugin-Workspace sollten Provider-eigene Hilfen im jeweiligen eigenen
`api.ts` oder `runtime-api.ts` des Plugins bleiben.

Aktuelle Beispiele für gebündelte Provider:

- Anthropic hält Claude-spezifische Stream-Hilfen in seinem eigenen `api.ts`- /
  `contract-api.ts`-Seam
- OpenAI hält Provider-Builder, Default-Model-Hilfen und Realtime-Provider-
  Builder in seinem eigenen `api.ts`
- OpenRouter hält Provider-Builder und Onboarding-/Config-Hilfen in seinem eigenen
  `api.ts`

## Migrationsplan für Talk und Echtzeit-Sprache

Realtime-Voice-, Telefonie-, Meeting- und Browser-Talk-Code wird von
oberflächenlokaler Turn-Buchführung zu einem gemeinsamen Talk-Session-Controller
verschoben, der von `openclaw/plugin-sdk/realtime-voice` exportiert wird. Der neue
Controller verwaltet die gemeinsame Talk-Event-Hülle, den aktiven Turn-Status,
Capture-Status, Output-Audio-Status, die aktuelle Ereignishistorie und die Zurückweisung
veralteter Turns. Provider-Plugins sollten weiterhin anbieterspezifische Realtime-
Sessions besitzen; Surface-Plugins sollten weiterhin Capture, Wiedergabe, Telefonie
und Meeting-Eigenheiten besitzen.

Diese Talk-Migration ist absichtlich sauber brechend:

1. Behalten Sie die gemeinsamen Controller-/Runtime-Primitiven in
   `plugin-sdk/realtime-voice`.
2. Verschieben Sie gebündelte Surfaces auf den gemeinsamen Controller: Browser-Relay,
   Managed-Room-Handoff, Voice-Call-Realtime, Voice-Call-Streaming-STT, Google
   Meet-Realtime und natives Push-to-Talk.
3. Ersetzen Sie alte Talk-RPC-Familien durch die endgültige `talk.session.*`- und
   `talk.client.*`-API.
4. Bewerben Sie einen Live-Talk-Ereigniskanal in Gateway
   `hello-ok.features.events`: `talk.event`.
5. Löschen Sie den alten Realtime-HTTP-Endpunkt und jeden Pfad für Request-time-
   Instruction-Overrides.

Neuer Code sollte `createTalkEventSequencer(...)` nicht direkt aufrufen, es sei denn,
er implementiert einen Low-Level-Adapter oder eine Test-Fixture. Bevorzugen Sie den
gemeinsamen Controller, damit turn-bezogene Ereignisse nicht ohne Turn-ID ausgegeben
werden können, veraltete `turnEnd`- / `turnCancel`-Aufrufe keinen neueren aktiven
Turn löschen können und Output-Audio-Lifecycle-Ereignisse über Telefonie, Meetings,
Browser-Relay, Managed-Room-Handoff und native Talk-Clients hinweg konsistent bleiben.

Die angestrebte öffentliche API-Form ist:

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

Browser-eigene WebRTC-/Provider-Websocket-Sessions verwenden `talk.client.create`,
weil der Browser die Provider-Aushandlung und den Medientransport besitzt, während das
Gateway Zugangsdaten, Instruktionen und Tool-Policy besitzt. `talk.session.*` ist die
gemeinsame Gateway-verwaltete Oberfläche für Gateway-Relay-Realtime, Gateway-Relay-
Transkription und native Managed-Room-STT-/TTS-Sessions.

Legacy-Configs, die Realtime-Selektoren neben `talk.provider` /
`talk.providers` platziert haben, sollten mit `openclaw doctor --fix` repariert werden;
Runtime-Talk interpretiert Speech-/TTS-Provider-Config nicht als Realtime-Provider-
Config um.

Die unterstützten `talk.session.create`-Kombinationen sind absichtlich klein:

| Modus           | Transport       | Brain           | Besitzer           | Hinweise                                                                                                             |
| --------------- | --------------- | --------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Full-Duplex-Provider-Audio wird über das Gateway überbrückt; Tool-Aufrufe werden über das agent-consult-Tool geroutet. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Nur Streaming-STT; Aufrufer senden Eingabeaudio und empfangen Transkriptionsereignisse.                              |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Push-to-Talk- und Walkie-Talkie-artige Räume, in denen der Client Capture/Wiedergabe besitzt und das Gateway den Turn-Status besitzt. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Admin-only-Raummodus für vertrauenswürdige First-Party-Surfaces, die Gateway-Tool-Aktionen direkt ausführen.        |

Entfernte Methodenzuordnung:

| Alt                              | Neu                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` oder `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

Das vereinheitlichte Steuervokabular ist ebenfalls bewusst schmal:

| Methode                         | Gilt für                                                | Vertrag                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Hängt einen base64-PCM-Audio-Chunk an die Provider-Session an, die derselben Gateway-Verbindung gehört.                                                                                  |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Startet einen Managed-Room-Benutzer-Turn.                                                                                                                                                |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Beendet den aktiven Turn nach der Validierung veralteter Turns.                                                                                                                          |
| `talk.session.cancelTurn`       | alle Gateway-eigenen Sessions                           | Bricht aktive Capture-/Provider-/Agent-/TTS-Arbeit für einen Turn ab.                                                                                                                    |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Stoppt die Audioausgabe des Assistenten, ohne den Benutzer-Turn zwangsläufig zu beenden.                                                                                                 |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Schließt einen vom Relay ausgegebenen Provider-Tool-Aufruf ab; übergeben Sie `options.willContinue` für Zwischenausgabe oder `options.suppressResponse`, um den Aufruf ohne weitere Assistentenantwort zu erfüllen. |
| `talk.session.close`            | alle vereinheitlichten Sessions                         | Stoppt Relay-Sessions oder widerruft Managed-Room-Status und vergisst anschließend die vereinheitlichte Session-ID.                                                                      |

  Führen Sie keine Provider- oder Plattform-Sonderfälle im Core ein, damit dies funktioniert.
  Der Core besitzt die Talk-Sitzungssemantik. Provider-Plugins besitzen die Einrichtung von Vendor-Sitzungen.
  Sprachanruf und Google Meet besitzen Telefonie-/Meeting-Adapter. Browser und native
  Apps besitzen die UX für Geräteerfassung/-wiedergabe.

  ## Kompatibilitätsrichtlinie

  Für externe Plugins folgt Kompatibilitätsarbeit dieser Reihenfolge:

  1. neuen Vertrag hinzufügen
  2. altes Verhalten über einen Kompatibilitätsadapter weiter verdrahtet lassen
  3. Diagnose oder Warnung ausgeben, die den alten Pfad und den Ersatz nennt
  4. beide Pfade in Tests abdecken
  5. Deprecation und Migrationspfad dokumentieren
  6. erst nach dem angekündigten Migrationsfenster entfernen, üblicherweise in einem Major-Release

  Maintainer können die aktuelle Migrationswarteschlange mit
  `pnpm plugins:boundary-report` prüfen. Verwenden Sie `pnpm plugins:boundary-report:summary` für
  kompakte Zählungen, `--owner <id>` für ein Plugin oder einen Kompatibilitätseigentümer und
  `pnpm plugins:boundary-report:ci`, wenn ein CI-Gate bei fälligen
  Kompatibilitätseinträgen, owner-übergreifenden reservierten SDK-Importen oder ungenutzten reservierten SDK-
  Subpfaden fehlschlagen soll. Der Bericht gruppiert veraltete
  Kompatibilitätseinträge nach Entfernungsdatum, zählt lokale Code-/Docs-Referenzen,
  zeigt owner-übergreifende reservierte SDK-Importe an und fasst die private
  Memory-Host-SDK-Bridge zusammen, damit Kompatibilitätsbereinigung explizit bleibt, statt sich
  auf Ad-hoc-Suchen zu verlassen. Reservierte SDK-Subpfade müssen nachverfolgte Owner-Nutzung haben;
  ungenutzte reservierte Helper-Exporte sollten aus dem öffentlichen SDK entfernt werden.

  Wenn ein Manifest-Feld weiterhin akzeptiert wird, können Plugin-Autoren es weiter verwenden, bis
  die Dokumentation und Diagnosen etwas anderes sagen. Neuer Code sollte den dokumentierten
  Ersatz bevorzugen, aber bestehende Plugins sollten während gewöhnlicher Minor-
  Releases nicht brechen.

  ## Migration

  <Steps>
  <Step title="Runtime-Config-Load-/Write-Helper migrieren">
    Gebündelte Plugins sollten aufhören,
    `api.runtime.config.loadConfig()` und
    `api.runtime.config.writeConfigFile(...)` direkt aufzurufen. Bevorzugen Sie Config, die
    bereits in den aktiven Aufrufpfad übergeben wurde. Langlebige Handler, die den
    aktuellen Prozess-Snapshot benötigen, können `api.runtime.config.current()` verwenden. Langlebige
    Agent-Tools sollten im `execute` den `ctx.getRuntimeConfig()` des Tool-Kontexts verwenden,
    damit ein vor einem Config-Schreibvorgang erstelltes Tool weiterhin die aktualisierte
    Runtime-Config sieht.

    Config-Schreibvorgänge müssen über die transaktionalen Helper laufen und eine
    After-Write-Richtlinie wählen:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Verwenden Sie `afterWrite: { mode: "restart", reason: "..." }`, wenn der Aufrufer weiß,
    dass die Änderung einen sauberen Gateway-Neustart erfordert, und
    `afterWrite: { mode: "none", reason: "..." }` nur, wenn der Aufrufer die
    Folgeaktion besitzt und den Reload-Planner bewusst unterdrücken möchte.
    Mutationsergebnisse enthalten eine typisierte `followUp`-Zusammenfassung für Tests und Logging;
    der Gateway bleibt dafür verantwortlich, den Neustart anzuwenden oder einzuplanen.
    `loadConfig` und `writeConfigFile` bleiben während des Migrationsfensters als veraltete
    Kompatibilitäts-Helper für externe Plugins erhalten und warnen einmal mit
    dem Kompatibilitätscode `runtime-config-load-write`. Gebündelte Plugins und Repo-
    Runtime-Code werden durch Scanner-Leitplanken in
    `pnpm check:deprecated-api-usage` und
    `pnpm check:no-runtime-action-load-config` geschützt: neue Nutzung in Produktions-Plugins
    schlägt sofort fehl, direkte Config-Schreibvorgänge schlagen fehl, Gateway-Server-Methoden müssen
    den Request-Runtime-Snapshot verwenden, Runtime-Channel-Send-/Action-/Client-Helper
    müssen Config von ihrer Grenze erhalten, und langlebige Runtime-Module haben
    null erlaubte umgebende `loadConfig()`-Aufrufe.

    Neuer Plugin-Code sollte außerdem den Import des breiten
    Kompatibilitäts-Barrels `openclaw/plugin-sdk/config-runtime` vermeiden. Verwenden Sie den schmalen
    SDK-Subpfad, der zur Aufgabe passt:

    | Bedarf | Import |
    | --- | --- |
    | Config-Typen wie `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Bereits geladene Config-Assertions und Config-Lookup für Plugin-Entrys | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Reads des aktuellen Runtime-Snapshots | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Config-Schreibvorgänge | `openclaw/plugin-sdk/config-mutation` |
    | Session-Store-Helper | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown-Tabellen-Config | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtime-Helper für Gruppenrichtlinien | `openclaw/plugin-sdk/runtime-group-policy` |
    | Secret-Input-Auflösung | `openclaw/plugin-sdk/secret-input-runtime` |
    | Modell-/Session-Overrides | `openclaw/plugin-sdk/model-session-runtime` |

    Gebündelte Plugins und ihre Tests werden per Scanner gegen das breite
    Barrel geschützt, damit Imports und Mocks lokal zu dem benötigten Verhalten bleiben. Das breite
    Barrel existiert weiterhin für externe Kompatibilität, aber neuer Code sollte nicht
    davon abhängen.

  </Step>

  <Step title="Pi-Tool-Result-Erweiterungen auf Middleware migrieren">
    Gebündelte Plugins müssen Pi-only
    `api.registerEmbeddedExtensionFactory(...)`-Tool-Result-Handler durch
    runtime-neutrale Middleware ersetzen.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Aktualisieren Sie gleichzeitig das Plugin-Manifest:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Externe Plugins können keine Tool-Result-Middleware registrieren, weil sie
    hochvertrauenswürdige Tool-Ausgabe umschreiben kann, bevor das Modell sie sieht.

  </Step>

  <Step title="Approval-native Handler auf Capability-Facts migrieren">
    Approval-fähige Channel-Plugins machen natives Approval-Verhalten jetzt über
    `approvalCapability.nativeRuntime` plus die gemeinsame Runtime-Context-Registry verfügbar.

    Wichtige Änderungen:

    - Ersetzen Sie `approvalCapability.handler.loadRuntime(...)` durch
      `approvalCapability.nativeRuntime`
    - Verschieben Sie Approval-spezifische Auth-/Delivery-Logik von der alten `plugin.auth`- /
      `plugin.approvals`-Verdrahtung auf `approvalCapability`
    - `ChannelPlugin.approvals` wurde aus dem öffentlichen Channel-Plugin-
      Vertrag entfernt; verschieben Sie Delivery-/Native-/Render-Felder auf `approvalCapability`
    - `plugin.auth` bleibt nur für Channel-Login-/Logout-Flows; Approval-Auth-
      Hooks dort werden vom Core nicht mehr gelesen
    - Registrieren Sie channel-eigene Runtime-Objekte wie Clients, Tokens oder Bolt-
      Apps über `openclaw/plugin-sdk/channel-runtime-context`
    - Senden Sie keine plugin-eigenen Reroute-Hinweise aus nativen Approval-Handlern;
      der Core besitzt jetzt „anderswo zugestellt“-Hinweise aus tatsächlichen Delivery-Ergebnissen
    - Wenn Sie `channelRuntime` an `createChannelManager(...)` übergeben, stellen Sie eine
      echte `createPluginRuntime().channel`-Oberfläche bereit. Partielle Stubs werden abgelehnt.

    Siehe `/plugins/sdk-channel-plugins` für das aktuelle Approval-Capability-
    Layout.

  </Step>

  <Step title="Windows-Wrapper-Fallback-Verhalten prüfen">
    Wenn Ihr Plugin `openclaw/plugin-sdk/windows-spawn` verwendet, schlagen nicht aufgelöste Windows-
    `.cmd`-/`.bat`-Wrapper jetzt geschlossen fehl, sofern Sie nicht explizit
    `allowShellFallback: true` übergeben.

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

    Wenn Ihr Aufrufer nicht bewusst auf Shell-Fallback angewiesen ist, setzen Sie
    `allowShellFallback` nicht und behandeln Sie stattdessen den ausgelösten Fehler.

  </Step>

  <Step title="Veraltete Imports finden">
    Durchsuchen Sie Ihr Plugin nach Imports aus einer der veralteten Oberflächen:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Durch fokussierte Imports ersetzen">
    Jeder Export aus der alten Oberfläche wird einem bestimmten modernen Importpfad zugeordnet:

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

    Verwenden Sie für hostseitige Helper die injizierte Plugin-Runtime statt eines
    direkten Imports:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    Dasselbe Muster gilt für andere alte Bridge-Helper:

    | Alter Import | Moderne Entsprechung |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | Session-Store-Helper | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Breite infra-runtime-Imports ersetzen">
    `openclaw/plugin-sdk/infra-runtime` existiert weiterhin für externe
    Kompatibilität, aber neuer Code sollte die fokussierte Helper-Oberfläche importieren, die er
    tatsächlich benötigt:

    | Bedarf | Import |
    | --- | --- |
    | System-Event-Queue-Helper | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat-Wake-, Event- und Visibility-Helper | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Drain der Pending-Delivery-Queue | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Channel-Aktivitätstelemetrie | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-Memory-Dedupe-Caches | `openclaw/plugin-sdk/dedupe-runtime` |
    | Sichere Helper für lokale Datei-/Medienpfade | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-bewusster Fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy- und Guarded-Fetch-Helper | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF-Dispatcher-Richtlinientypen | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Approval-Request-/Resolution-Typen | `openclaw/plugin-sdk/approval-runtime` |
    | Approval-Reply-Payload- und Command-Helper | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helper zur Fehlerformatierung | `openclaw/plugin-sdk/error-runtime` |
    | Wartefunktionen für Transport-Readiness | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Sichere Token-Helper | `openclaw/plugin-sdk/secure-random-runtime` |
    | Begrenzte Nebenläufigkeit für asynchrone Tasks | `openclaw/plugin-sdk/concurrency-runtime` |
    | Numerische Koersion | `openclaw/plugin-sdk/number-runtime` |
    | Prozesslokaler Async-Lock | `openclaw/plugin-sdk/async-lock-runtime` |
    | Datei-Locks | `openclaw/plugin-sdk/file-lock` |

    Gebündelte Plugins werden per Scanner gegen `infra-runtime` geschützt, sodass Repo-Code
    nicht zum breiten Barrel regressieren kann.

  </Step>

  <Step title="Channel-Route-Helper migrieren">
    Neuer Channel-Route-Code sollte `openclaw/plugin-sdk/channel-route` verwenden.
    Die älteren Route-Key- und Comparable-Target-Namen bleiben während des Migrationsfensters als Kompatibilitäts-
    Aliasse erhalten, aber neue Plugins sollten die Route-
    Namen verwenden, die das Verhalten direkt beschreiben:

    | Alte Hilfsfunktion | Moderne Hilfsfunktion |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Die modernen Route-Hilfsfunktionen normalisieren `{ channel, to, accountId, threadId }`
    konsistent über native Genehmigungen, Antwortunterdrückung, eingehende Deduplizierung,
    Cron-Zustellung und Sitzungs-Routing hinweg. Wenn Ihr Plugin eine eigene Zielgrammatik
    besitzt, verwenden Sie `resolveChannelRouteTargetWithParser(...)`, um diesen
    Parser an denselben Vertrag für Route-Ziele anzupassen.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Importpfad-Referenz

  <Accordion title="Common import path table">
  | Importpfad | Zweck | Wichtige Exporte |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonische Einstiegshilfe fuer Plugins | `definePluginEntry` |
  | `plugin-sdk/core` | Veralteter Sammel-Re-Export fuer Kanal-Einstiegsdefinitionen/-Builder | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export des Root-Konfigurationsschemas | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Einstiegshilfe fuer einen einzelnen Provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Fokussierte Kanal-Einstiegsdefinitionen und -Builder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gemeinsame Hilfsfunktionen fuer den Einrichtungsassistenten | Allowlist-Abfragen, Builder fuer den Einrichtungsstatus |
  | `plugin-sdk/setup-runtime` | Runtime-Hilfsfunktionen zur Einrichtungszeit | Importsichere Adapter fuer Einrichtungspatches, Hilfsfunktionen fuer Lookup-Hinweise, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Einrichtungs-Proxys |
  | `plugin-sdk/setup-adapter-runtime` | Veralteter Alias fuer Einrichtungsadapter | Verwenden Sie `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Hilfsfunktionen fuer Einrichtungswerkzeuge | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Hilfsfunktionen fuer mehrere Konten | Hilfsfunktionen fuer Kontolisten, Konfiguration und Aktions-Gates |
  | `plugin-sdk/account-id` | Hilfsfunktionen fuer Konto-IDs | `DEFAULT_ACCOUNT_ID`, Normalisierung von Konto-IDs |
  | `plugin-sdk/account-resolution` | Hilfsfunktionen fuer die Kontosuche | Hilfsfunktionen fuer Kontosuche und Standard-Fallbacks |
  | `plugin-sdk/account-helpers` | Enge Hilfsfunktionen fuer Konten | Hilfsfunktionen fuer Kontolisten und Kontoaktionen |
  | `plugin-sdk/channel-setup` | Adapter fuer den Einrichtungsassistenten | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive fuer DM-Kopplung | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Verkabelung fuer Antwortpraefix, Tippen und Quellzustellung | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabriken fuer Konfigurationsadapter und Hilfsfunktionen fuer DM-Zugriff | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Builder fuer Konfigurationsschemata | Nur gemeinsame Primitive fuer Kanal-Konfigurationsschemata und der generische Builder |
  | `plugin-sdk/bundled-channel-config-schema` | Gebuendelte Konfigurationsschemata | Nur von OpenClaw gepflegte gebuendelte Plugins; neue Plugins muessen Plugin-lokale Schemata definieren |
  | `plugin-sdk/channel-config-schema-legacy` | Veraltete gebuendelte Konfigurationsschemata | Nur Kompatibilitaetsalias; verwenden Sie `plugin-sdk/bundled-channel-config-schema` fuer gepflegte gebuendelte Plugins |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen fuer Telegram-Befehlskonfiguration | Normalisierung von Befehlsnamen, Kuerzen von Beschreibungen, Validierung auf Duplikate/Konflikte |
  | `plugin-sdk/channel-policy` | Aufloesung von Gruppen-/DM-Richtlinien | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Hilfsfunktionen fuer Kontostatus und Lebenszyklus von Entwurfsstreams | `createAccountStatusSink`, Hilfsfunktionen zum Finalisieren von Entwurfsvorschauen |
  | `plugin-sdk/inbound-envelope` | Hilfsfunktionen fuer eingehende Umschlaege | Gemeinsame Hilfsfunktionen fuer Routen und Umschlag-Builder |
  | `plugin-sdk/inbound-reply-dispatch` | Hilfsfunktionen fuer eingehende Antworten | Gemeinsame Hilfsfunktionen fuer Aufzeichnung und Dispatch |
  | `plugin-sdk/messaging-targets` | Parsen von Messaging-Zielen | Hilfsfunktionen zum Parsen und Abgleichen von Zielen |
  | `plugin-sdk/outbound-media` | Hilfsfunktionen fuer ausgehende Medien | Gemeinsames Laden ausgehender Medien |
  | `plugin-sdk/outbound-send-deps` | Hilfsfunktionen fuer Abhaengigkeiten beim ausgehenden Senden | Schlanker `resolveOutboundSendDep`-Lookup ohne Import der vollstaendigen ausgehenden Runtime |
  | `plugin-sdk/outbound-runtime` | Hilfsfunktionen fuer ausgehende Runtime | Hilfsfunktionen fuer ausgehende Zustellung, Identitaets-/Sende-Delegation, Sitzung, Formatierung und Payload-Planung |
  | `plugin-sdk/thread-bindings-runtime` | Hilfsfunktionen fuer Thread-Bindung | Lebenszyklus- und Adapter-Hilfsfunktionen fuer Thread-Bindung |
  | `plugin-sdk/agent-media-payload` | Veraltete Hilfsfunktionen fuer Medien-Payloads | Builder fuer Agent-Medien-Payloads fuer veraltete Feldlayouts |
  | `plugin-sdk/channel-runtime` | Veralteter Kompatibilitaets-Shim | Nur veraltete Kanal-Runtime-Dienstprogramme |
  | `plugin-sdk/channel-send-result` | Typen fuer Sendeergebnisse | Typen fuer Antwortergebnisse |
  | `plugin-sdk/runtime-store` | Persistenter Plugin-Speicher | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Breite Runtime-Hilfsfunktionen | Hilfsfunktionen fuer Runtime, Protokollierung, Backup und Plugin-Installation |
  | `plugin-sdk/runtime-env` | Enge Hilfsfunktionen fuer Runtime-Umgebungen | Hilfsfunktionen fuer Logger/Runtime-Umgebung, Timeout, Wiederholung und Backoff |
  | `plugin-sdk/plugin-runtime` | Gemeinsame Hilfsfunktionen fuer Plugin-Runtime | Hilfsfunktionen fuer Plugin-Befehle, Hooks, HTTP und Interaktion |
  | `plugin-sdk/hook-runtime` | Hilfsfunktionen fuer Hook-Pipelines | Gemeinsame Hilfsfunktionen fuer Webhook-/interne Hook-Pipelines |
  | `plugin-sdk/lazy-runtime` | Hilfsfunktionen fuer verzogerte Runtime | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Prozess-Hilfsfunktionen | Gemeinsame Exec-Hilfsfunktionen |
  | `plugin-sdk/cli-runtime` | CLI-Runtime-Hilfsfunktionen | Hilfsfunktionen fuer Befehlsformatierung, Wartezeiten und Versionen |
  | `plugin-sdk/gateway-runtime` | Gateway-Hilfsfunktionen | Gateway-Client, Starthilfe fuer ereignisschleifenbereite Starts und Hilfsfunktionen fuer Kanalstatus-Patches |
  | `plugin-sdk/config-runtime` | Veralteter Shim fuer Konfigurationskompatibilitaet | Bevorzugen Sie `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` und `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen fuer Telegram-Befehle | Fallback-stabile Hilfsfunktionen zur Validierung von Telegram-Befehlen, wenn die gebuendelte Telegram-Vertragsoberflaeche nicht verfuegbar ist |
  | `plugin-sdk/approval-runtime` | Hilfsfunktionen fuer Genehmigungsaufforderungen | Exec-/Plugin-Genehmigungs-Payload, Hilfsfunktionen fuer Genehmigungsfaehigkeit/-profil, native Genehmigungsweiterleitung/-Runtime und strukturierte Formatierung des Anzeigepfads fuer Genehmigungen |
  | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen fuer Genehmigungsautorisierung | Aufloesung von Genehmigenden, Aktionsautorisierung im selben Chat |
  | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen fuer Genehmigungsclients | Native Hilfsfunktionen fuer Exec-Genehmigungsprofile/-filter |
  | `plugin-sdk/approval-delivery-runtime` | Hilfsfunktionen fuer Genehmigungszustellung | Native Adapter fuer Genehmigungsfaehigkeit/-zustellung |
  | `plugin-sdk/approval-gateway-runtime` | Hilfsfunktionen fuer Genehmigungs-Gateway | Gemeinsame Hilfsfunktion zur Aufloesung von Genehmigungs-Gateways |
  | `plugin-sdk/approval-handler-adapter-runtime` | Hilfsfunktionen fuer Genehmigungsadapter | Schlanke Hilfsfunktionen zum Laden nativer Genehmigungsadapter fuer heisse Kanal-Einstiegspunkte |
  | `plugin-sdk/approval-handler-runtime` | Hilfsfunktionen fuer Genehmigungs-Handler | Breitere Runtime-Hilfsfunktionen fuer Genehmigungs-Handler; bevorzugen Sie die engeren Adapter-/Gateway-Schnittstellen, wenn sie ausreichen |
  | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen fuer Genehmigungsziele | Native Hilfsfunktionen fuer Ziel-/Kontobindung bei Genehmigungen |
  | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen fuer Genehmigungsantworten | Hilfsfunktionen fuer Exec-/Plugin-Genehmigungsantwort-Payloads |
  | `plugin-sdk/channel-runtime-context` | Hilfsfunktionen fuer Kanal-Runtime-Kontext | Generische Hilfsfunktionen zum Registrieren/Abrufen/Ueberwachen von Kanal-Runtime-Kontexten |
  | `plugin-sdk/security-runtime` | Sicherheits-Hilfsfunktionen | Gemeinsame Hilfsfunktionen fuer Vertrauen, DM-Gating, root-begrenzte Dateien/Pfade, externe Inhalte und Secret-Sammlung |
  | `plugin-sdk/ssrf-policy` | Hilfsfunktionen fuer SSRF-Richtlinien | Hilfsfunktionen fuer Host-Allowlist und Richtlinien fuer private Netzwerke |
  | `plugin-sdk/ssrf-runtime` | SSRF-Runtime-Hilfsfunktionen | Angepinnter Dispatcher, geschuetzter Fetch, Hilfsfunktionen fuer SSRF-Richtlinien |
  | `plugin-sdk/system-event-runtime` | Hilfsfunktionen fuer Systemereignisse | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat-Hilfsfunktionen | Hilfsfunktionen fuer Heartbeat-Wecken, -Ereignisse und -Sichtbarkeit |
  | `plugin-sdk/delivery-queue-runtime` | Hilfsfunktionen fuer Zustellwarteschlangen | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Hilfsfunktionen fuer Kanalaktivitaet | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Hilfsfunktionen fuer Deduplizierung | In-Memory-Deduplizierungs-Caches |
  | `plugin-sdk/file-access-runtime` | Hilfsfunktionen fuer Dateizugriff | Sichere Hilfsfunktionen fuer lokale Datei-/Medienpfade |
  | `plugin-sdk/transport-ready-runtime` | Hilfsfunktionen fuer Transportbereitschaft | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Hilfsfunktionen fuer begrenzte Caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen fuer Diagnose-Gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hilfsfunktionen fuer Fehlerformatierung | `formatUncaughtError`, `isApprovalNotFoundError`, Hilfsfunktionen fuer Fehlergraphen |
  | `plugin-sdk/fetch-runtime` | Hilfsfunktionen fuer umschlossenen Fetch/Proxy | `resolveFetch`, Proxy-Hilfsfunktionen, Hilfsfunktionen fuer EnvHttpProxyAgent-Optionen |
  | `plugin-sdk/host-runtime` | Hilfsfunktionen fuer Host-Normalisierung | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Hilfsfunktionen fuer Wiederholungen | `RetryConfig`, `retryAsync`, Richtlinien-Runner |
  | `plugin-sdk/allow-from` | Allowlist-Formatierung | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Zuordnung von Allowlist-Eingaben | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Hilfsfunktionen fuer Befehls-Gating und Befehlsoberflaechen | `resolveControlCommandGate`, Hilfsfunktionen fuer Absenderautorisierung, Hilfsfunktionen fuer Befehlsregistrierung einschliesslich Formatierung dynamischer Argumentmenues |
  | `plugin-sdk/command-status` | Renderer fuer Befehlsstatus/-hilfe | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsen von Secret-Eingaben | Hilfsfunktionen fuer Secret-Eingaben |
  | `plugin-sdk/webhook-ingress` | Hilfsfunktionen fuer Webhook-Anfragen | Webhook-Zieldienstprogramme |
  | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen fuer Webhook-Body-Guards | Hilfsfunktionen zum Lesen/Begrenzen von Anfrage-Bodys |
  | `plugin-sdk/reply-runtime` | Gemeinsame Antwort-Runtime | Eingehender Dispatch, Heartbeat, Antwortplaner, Chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Enge Hilfsfunktionen fuer Antwort-Dispatch | Hilfsfunktionen fuer Finalisierung, Provider-Dispatch und Konversationslabels |
  | `plugin-sdk/reply-history` | Hilfsfunktionen fuer Antwortverlauf | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planung von Antwortreferenzen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Hilfsfunktionen fuer Antwort-Chunks | Hilfsfunktionen fuer Text-/Markdown-Chunking |
  | `plugin-sdk/session-store-runtime` | Hilfsfunktionen fuer Sitzungsspeicher | Hilfsfunktionen fuer Speicherpfad und Aktualisiert-am |
  | `plugin-sdk/state-paths` | Hilfsfunktionen fuer Zustandspfade | Hilfsfunktionen fuer Zustands- und OAuth-Verzeichnisse |
  | `plugin-sdk/routing` | Hilfsfunktionen fuer Routing/Sitzungsschluessel | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, Hilfsfunktionen fuer Sitzungsschluessel-Normalisierung |
  | `plugin-sdk/status-helpers` | Hilfsfunktionen fuer Kanalstatus | Builder fuer Kanal-/Kontostatus-Zusammenfassungen, Standardwerte fuer Runtime-Zustand, Hilfsfunktionen fuer Problem-Metadaten |
  | `plugin-sdk/target-resolver-runtime` | Hilfsfunktionen fuer Zielaufloeser | Gemeinsame Hilfsfunktionen fuer Zielaufloeser |
  | `plugin-sdk/string-normalization-runtime` | Hilfsfunktionen fuer String-Normalisierung | Hilfsfunktionen fuer Slug-/String-Normalisierung |
  | `plugin-sdk/request-url` | Hilfsfunktionen fuer Anfrage-URLs | String-URLs aus anfrageaehnlichen Eingaben extrahieren |
  | `plugin-sdk/run-command` | Hilfsfunktionen fuer zeitgesteuerte Befehle | Runner fuer zeitgesteuerte Befehle mit normalisiertem stdout/stderr |
  | `plugin-sdk/param-readers` | Parameterleser | Gemeinsame Parameterleser fuer Tool/CLI |
  | `plugin-sdk/tool-payload` | Tool-Payload-Extraktion | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
  | `plugin-sdk/tool-send` | Tool-Send-Extraktion | Kanonische Send-Zielfelder aus Tool-Argumenten extrahieren |
  | `plugin-sdk/temp-path` | Temp-Pfad-Helfer | Gemeinsame Temp-Download-Pfadhelfer |
  | `plugin-sdk/logging-core` | Logging-Helfer | Subsystem-Logger und Redaktionshelfer |
  | `plugin-sdk/markdown-table-runtime` | Markdown-Tabellen-Helfer | Markdown-Tabellenmodus-Helfer |
  | `plugin-sdk/reply-payload` | Nachrichtenantworttypen | Antwort-Payload-Typen |
  | `plugin-sdk/provider-setup` | Kuratierte Helfer für lokale/selbst gehostete Provider-Einrichtung | Erkennungs-/Konfigurationshelfer für selbst gehostete Provider |
  | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Helfer für OpenAI-kompatible selbst gehostete Provider-Einrichtung | Dieselben Erkennungs-/Konfigurationshelfer für selbst gehostete Provider |
  | `plugin-sdk/provider-auth-runtime` | Provider-Runtime-Authentifizierungshelfer | Runtime-Helfer für API-Schlüssel-Auflösung |
  | `plugin-sdk/provider-auth-api-key` | Helfer für Provider-API-Schlüssel-Einrichtung | Helfer für API-Schlüssel-Onboarding/Profilschreiben |
  | `plugin-sdk/provider-auth-result` | Provider-Authentifizierungsergebnis-Helfer | Standard-OAuth-Authentifizierungsergebnis-Builder |
  | `plugin-sdk/provider-selection-runtime` | Provider-Auswahlhelfer | Auswahl konfigurierter oder automatischer Provider und Zusammenführung roher Provider-Konfiguration |
  | `plugin-sdk/provider-env-vars` | Provider-Umgebungsvariablen-Helfer | Helfer zum Nachschlagen von Provider-Authentifizierungsumgebungsvariablen |
  | `plugin-sdk/provider-model-shared` | Gemeinsame Provider-Modell-/Replay-Helfer | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Replay-Richtlinien-Builder, Provider-Endpunkt-Helfer und Modell-ID-Normalisierungshelfer |
  | `plugin-sdk/provider-catalog-shared` | Gemeinsame Provider-Kataloghelfer | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Provider-Onboarding-Patches | Onboarding-Konfigurationshelfer |
  | `plugin-sdk/provider-http` | Provider-HTTP-Helfer | Generische Provider-HTTP-/Endpunkt-Capability-Helfer, einschließlich Multipart-Formularhelfern für Audiotranskription |
  | `plugin-sdk/provider-web-fetch` | Provider-Web-Fetch-Helfer | Web-Fetch-Provider-Registrierungs-/Cache-Helfer |
  | `plugin-sdk/provider-web-search-config-contract` | Provider-Websuche-Konfigurationshelfer | Schmale Websuche-Konfigurations-/Anmeldeinformationshelfer für Provider, die keine Plugin-Aktivierungsverdrahtung benötigen |
  | `plugin-sdk/provider-web-search-contract` | Provider-Websuche-Vertragshelfer | Schmale Websuche-Konfigurations-/Anmeldeinformations-Vertragshelfer wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsgebundene Anmeldeinformations-Setter/-Getter |
  | `plugin-sdk/provider-web-search` | Provider-Websuche-Helfer | Websuche-Provider-Registrierungs-/Cache-/Runtime-Helfer |
  | `plugin-sdk/provider-tools` | Provider-Tool-/Schema-Kompatibilitätshelfer | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` und Gemini-Schema-Bereinigung + Diagnose |
  | `plugin-sdk/provider-usage` | Provider-Nutzungshelfer | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` und andere Provider-Nutzungshelfer |
  | `plugin-sdk/provider-stream` | Provider-Stream-Wrapper-Helfer | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot-Wrapper-Helfer |
  | `plugin-sdk/provider-transport-runtime` | Provider-Transporthelfer | Native Provider-Transporthelfer wie geschütztes Fetch, Transportnachrichten-Transformationen und beschreibbare Transportereignis-Streams |
  | `plugin-sdk/keyed-async-queue` | Geordnete asynchrone Queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gemeinsame Medienhelfer | Helfer zum Abrufen/Transformieren/Speichern von Medien, ffprobe-gestützte Ermittlung von Videodimensionen und Medien-Payload-Builder |
  | `plugin-sdk/media-generation-runtime` | Gemeinsame Mediengenerierungshelfer | Gemeinsame Failover-Helfer, Kandidatenauswahl und Meldungen für fehlende Modelle bei Bild-/Video-/Musikgenerierung |
  | `plugin-sdk/media-understanding` | Medienverständnis-Helfer | Provider-Typen für Medienverständnis plus Provider-seitige Bild-/Audio-Helfer-Exporte |
  | `plugin-sdk/text-runtime` | Veralteter breiter Text-Kompatibilitätsexport | Verwenden Sie `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` und `logging-core` |
  | `plugin-sdk/text-chunking` | Textsegmentierungshelfer | Helfer für ausgehende Textsegmentierung |
  | `plugin-sdk/speech` | Speech-Helfer | Speech-Provider-Typen plus Provider-seitige Direktiven-, Registry-, Validierungshelfer und OpenAI-kompatibler TTS-Builder |
  | `plugin-sdk/speech-core` | Gemeinsamer Speech-Kern | Speech-Provider-Typen, Registry, Direktiven, Normalisierung |
  | `plugin-sdk/realtime-transcription` | Echtzeit-Transkriptionshelfer | Provider-Typen, Registry-Helfer und gemeinsamer WebSocket-Sitzungshelfer |
  | `plugin-sdk/realtime-voice` | Echtzeit-Sprachhelfer | Provider-Typen, Registry-/Auflösungshelfer, Bridge-Sitzungshelfer, gemeinsame Agent-Rücksprech-Queues, Transkript-/Ereigniszustand, Echounterdrückung und schnelle Kontextabfrage-Helfer |
  | `plugin-sdk/image-generation` | Bildgenerierungshelfer | Bildgenerierungs-Provider-Typen plus Bild-Asset-/Daten-URL-Helfer und der OpenAI-kompatible Bild-Provider-Builder |
  | `plugin-sdk/image-generation-core` | Gemeinsamer Bildgenerierungskern | Bildgenerierungstypen, Failover, Authentifizierung und Registry-Helfer |
  | `plugin-sdk/music-generation` | Musikgenerierungshelfer | Musikgenerierungs-Provider-/Request-/Result-Typen |
  | `plugin-sdk/music-generation-core` | Gemeinsamer Musikgenerierungskern | Musikgenerierungstypen, Failover-Helfer, Provider-Suche und Modellreferenz-Parsing |
  | `plugin-sdk/video-generation` | Videogenerierungshelfer | Videogenerierungs-Provider-/Request-/Result-Typen |
  | `plugin-sdk/video-generation-core` | Gemeinsamer Videogenerierungskern | Videogenerierungstypen, Failover-Helfer, Provider-Suche und Modellreferenz-Parsing |
  | `plugin-sdk/interactive-runtime` | Interaktive Antworthelfer | Normalisierung/Reduktion interaktiver Antwort-Payloads |
  | `plugin-sdk/channel-config-primitives` | Channel-Konfigurationsprimitive | Schmale Channel-Konfigurationsschema-Primitive |
  | `plugin-sdk/channel-config-writes` | Helfer für Channel-Konfigurationsschreibvorgänge | Autorisierungshelfer für Channel-Konfigurationsschreibvorgänge |
  | `plugin-sdk/channel-plugin-common` | Gemeinsames Channel-Präludium | Gemeinsame Channel-Plugin-Präludium-Exporte |
  | `plugin-sdk/channel-status` | Channel-Statushelfer | Gemeinsame Channel-Status-Snapshot-/Zusammenfassungshelfer |
  | `plugin-sdk/allowlist-config-edit` | Allowlist-Konfigurationshelfer | Helfer zum Bearbeiten/Lesen der Allowlist-Konfiguration |
  | `plugin-sdk/group-access` | Gruppenzugriffshelfer | Gemeinsame Entscheidungshelfer für Gruppenzugriff |
  | `plugin-sdk/direct-dm` | Direct-DM-Helfer | Gemeinsame Direct-DM-Authentifizierungs-/Guard-Helfer |
  | `plugin-sdk/extension-shared` | Gemeinsame Erweiterungshelfer | Primitive für Passive-Channel-/Status- und Umgebungsproxy-Helfer |
  | `plugin-sdk/webhook-targets` | Webhook-Zielhelfer | Webhook-Ziel-Registry und Routeninstallationshelfer |
  | `plugin-sdk/webhook-path` | Veralteter Webhook-Pfadalias | Verwenden Sie `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Gemeinsame Webmedien-Helfer | Helfer zum Laden von Remote-/lokalen Medien |
  | `plugin-sdk/zod` | Veralteter Zod-Kompatibilitäts-Re-Export | Importieren Sie `zod` direkt aus `zod` |
  | `plugin-sdk/memory-core` | Gebündelte Memory-Core-Helfer | Memory-Manager-/Konfigurations-/Datei-/CLI-Helferoberfläche |
  | `plugin-sdk/memory-core-engine-runtime` | Memory-Engine-Runtime-Fassade | Memory-Index-/Such-Runtime-Fassade |
  | `plugin-sdk/memory-core-host-engine-foundation` | Memory-Host-Foundation-Engine | Memory-Host-Foundation-Engine-Exporte |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Memory-Host-Embedding-Engine | Memory-Embedding-Verträge, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Helfer; konkrete Remote-Provider befinden sich in ihren zuständigen Plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | Memory-Host-QMD-Engine | Memory-Host-QMD-Engine-Exporte |
  | `plugin-sdk/memory-core-host-engine-storage` | Memory-Host-Storage-Engine | Memory-Host-Storage-Engine-Exporte |
  | `plugin-sdk/memory-core-host-multimodal` | Memory-Host-Multimodal-Helfer | Memory-Host-Multimodal-Helfer |
  | `plugin-sdk/memory-core-host-query` | Memory-Host-Query-Helfer | Memory-Host-Query-Helfer |
  | `plugin-sdk/memory-core-host-secret` | Memory-Host-Secret-Helfer | Memory-Host-Secret-Helfer |
  | `plugin-sdk/memory-core-host-events` | Veralteter Memory-Ereignisalias | Verwenden Sie `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Memory-Host-Statushelfer | Memory-Host-Statushelfer |
  | `plugin-sdk/memory-core-host-runtime-cli` | Memory-Host-CLI-Runtime | Memory-Host-CLI-Runtime-Helfer |
  | `plugin-sdk/memory-core-host-runtime-core` | Memory-Host-Core-Runtime | Memory-Host-Core-Runtime-Helfer |
  | `plugin-sdk/memory-core-host-runtime-files` | Memory-Host-Datei-/Runtime-Helfer | Memory-Host-Datei-/Runtime-Helfer |
  | `plugin-sdk/memory-host-core` | Memory-Host-Core-Runtime-Alias | Herstellerneutraler Alias für Memory-Host-Core-Runtime-Helfer |
  | `plugin-sdk/memory-host-events` | Memory-Host-Ereignisjournal-Alias | Herstellerneutraler Alias für Memory-Host-Ereignisjournal-Helfer |
  | `plugin-sdk/memory-host-files` | Veralteter Memory-Datei-/Runtime-Alias | Verwenden Sie `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Verwaltete Markdown-Helfer | Gemeinsame Managed-Markdown-Helfer für Memory-nahe Plugins |
  | `plugin-sdk/memory-host-search` | Active Memory-Suchfassade | Lazy Active-Memory-Suchmanager-Runtime-Fassade |
  | `plugin-sdk/memory-host-status` | Veralteter Memory-Host-Statusalias | Verwenden Sie `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Testdienstprogramme | Repo-lokales veraltetes Kompatibilitäts-Barrel; verwenden Sie fokussierte repo-lokale Test-Unterpfade wie `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` und `plugin-sdk/test-fixtures` |
</Accordion>

Diese Tabelle ist bewusst die gemeinsame Teilmenge für die Migration, nicht die vollständige SDK-Oberfläche. Das Inventar der Compiler-Einstiegspunkte liegt in `scripts/lib/plugin-sdk-entrypoints.json`; Package-Exports werden aus der öffentlichen Teilmenge generiert.

Reservierte Hilfs-Seams für gebündelte Plugins wurden aus der öffentlichen SDK-Export-Map entfernt, außer ausdrücklich dokumentierten Kompatibilitäts-Fassaden wie dem veralteten `plugin-sdk/discord`-Shim, der für das veröffentlichte Package `@openclaw/discord@2026.3.13` beibehalten wurde. Owner-spezifische Hilfsfunktionen leben im owning Plugin-Package; gemeinsames Host-Verhalten sollte über generische SDK-Verträge wie `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` und `plugin-sdk/plugin-config-runtime` laufen.

Verwenden Sie den engsten Import, der zur Aufgabe passt. Wenn Sie keinen Export finden, prüfen Sie die Quelle unter `src/plugin-sdk/` oder fragen Sie die Maintainer, welcher generische Vertrag dafür zuständig sein sollte.

## Aktive Veraltungen

Engere Veraltungen, die für das Plugin SDK, den Provider-Vertrag, die Runtime-Oberfläche und das Manifest gelten. Jede funktioniert heute noch, wird aber in einem zukünftigen Major-Release entfernt. Der Eintrag unter jedem Punkt ordnet die alte API ihrem kanonischen Ersatz zu.

<AccordionGroup>
  <Accordion title="command-auth-Hilfsfunktionen für Hilfe → command-status">
    **Alt (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Neu (`openclaw/plugin-sdk/command-status`)**: gleiche Signaturen, gleiche
    Exports - nur aus dem engeren Unterpfad importiert. `command-auth`
    re-exportiert sie als Kompatibilitäts-Stubs.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention-Gating-Hilfsfunktionen → resolveInboundMentionDecision">
    **Alt**: `resolveInboundMentionRequirement({ facts, policy })` und
    `shouldDropInboundForMention(...)` aus
    `openclaw/plugin-sdk/channel-inbound` oder
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Neu**: `resolveInboundMentionDecision({ facts, policy })` - gibt ein
    einzelnes Entscheidungsobjekt statt zweier getrennter Aufrufe zurück.

    Nachgelagerte Channel-Plugins (Slack, Discord, Matrix, MS Teams) sind bereits
    umgestellt.

  </Accordion>

  <Accordion title="Channel-Runtime-Shim und Hilfsfunktionen für Channel-Aktionen">
    `openclaw/plugin-sdk/channel-runtime` ist ein Kompatibilitäts-Shim für ältere
    Channel-Plugins. Importieren Sie ihn nicht aus neuem Code; verwenden Sie
    `openclaw/plugin-sdk/channel-runtime-context` zum Registrieren von Runtime-Objekten.

    `channelActions*`-Hilfsfunktionen in `openclaw/plugin-sdk/channel-actions` sind
    zusammen mit rohen Channel-Exports für "actions" veraltet. Stellen Sie Fähigkeiten
    stattdessen über die semantische `presentation`-Oberfläche bereit - Channel-Plugins
    deklarieren, was sie rendern (Karten, Buttons, Auswahllisten), statt welche rohen
    Aktionsnamen sie akzeptieren.

  </Accordion>

  <Accordion title="Websuch-Provider-Hilfsfunktion tool() → createTool() auf dem Plugin">
    **Alt**: `tool()`-Factory aus `openclaw/plugin-sdk/provider-web-search`.

    **Neu**: Implementieren Sie `createTool(...)` direkt auf dem Provider-Plugin.
    OpenClaw benötigt die SDK-Hilfsfunktion nicht mehr, um den Tool-Wrapper zu registrieren.

  </Accordion>

  <Accordion title="Klartext-Channel-Envelopes → BodyForAgent">
    **Alt**: `formatInboundEnvelope(...)` (und
    `ChannelMessageForAgent.channelEnvelope`), um aus eingehenden Channel-Nachrichten
    ein flaches Klartext-Prompt-Envelope zu erstellen.

    **Neu**: `BodyForAgent` plus strukturierte Blöcke für Benutzerkontext. Channel-Plugins
    hängen Routing-Metadaten (Thread, Thema, Antwort-auf, Reaktionen) als typisierte
    Felder an, statt sie zu einem Prompt-String zusammenzufügen. Die Hilfsfunktion
    `formatAgentEnvelope(...)` wird für synthetisierte, assistentenorientierte
    Envelopes weiterhin unterstützt, aber eingehende Klartext-Envelopes werden
    auslaufen.

    Betroffene Bereiche: `inbound_claim`, `message_received` und jedes eigene
    Channel-Plugin, das `channelEnvelope`-Text nachverarbeitet hat.

  </Accordion>

  <Accordion title="Provider-Discovery-Typen → Provider-Katalogtypen">
    Vier Discovery-Typaliase sind jetzt dünne Wrapper über den Typen aus der
    Katalog-Ära:

    | Alter Alias               | Neuer Typ                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Außerdem das alte statische Bag `ProviderCapabilities` - Provider-Plugins
    sollten explizite Provider-Hooks wie `buildReplayPolicy`,
    `normalizeToolSchemas` und `wrapStreamFn` verwenden, statt eines statischen Objekts.

  </Accordion>

  <Accordion title="Thinking-Policy-Hooks → resolveThinkingProfile">
    **Alt** (drei separate Hooks auf `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` und
    `resolveDefaultThinkingLevel(ctx)`.

    **Neu**: ein einzelnes `resolveThinkingProfile(ctx)`, das ein
    `ProviderThinkingProfile` mit der kanonischen `id`, optionalem `label` und
    gerankter Level-Liste zurückgibt. OpenClaw stuft veraltete gespeicherte Werte
    automatisch nach Profilrang herunter.

    Implementieren Sie einen Hook statt drei. Die alten Hooks funktionieren während
    des Veraltungsfensters weiterhin, werden aber nicht mit dem Profilergebnis
    kombiniert.

  </Accordion>

  <Accordion title="Fallback für externen OAuth-Provider → contracts.externalAuthProviders">
    **Alt**: `resolveExternalOAuthProfiles(...)` implementieren, ohne den Provider
    im Plugin-Manifest zu deklarieren.

    **Neu**: Deklarieren Sie `contracts.externalAuthProviders` im Plugin-Manifest
    **und** implementieren Sie `resolveExternalAuthProfiles(...)`. Der alte
    "auth fallback"-Pfad gibt zur Laufzeit eine Warnung aus und wird entfernt.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider-Env-Var-Lookup → setup.providers[].envVars">
    **Altes** Manifestfeld: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Neu**: Spiegeln Sie denselben Env-Var-Lookup in `setup.providers[].envVars`
    im Manifest. Dadurch werden Setup-/Status-Env-Metadaten an einer Stelle
    zusammengeführt, und das Booten der Plugin-Runtime nur zum Beantworten von
    Env-Var-Lookups wird vermieden.

    `providerAuthEnvVars` bleibt über einen Kompatibilitätsadapter unterstützt,
    bis das Veraltungsfenster geschlossen wird.

  </Accordion>

  <Accordion title="Memory-Plugin-Registrierung → registerMemoryCapability">
    **Alt**: drei separate Aufrufe -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Neu**: ein Aufruf auf der Memory-State-API -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Gleiche Slots, ein einzelner Registrierungsaufruf. Additive Memory-Hilfsfunktionen
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) sind nicht betroffen.

  </Accordion>

  <Accordion title="Typen für Subagent-Session-Nachrichten umbenannt">
    Zwei alte Typaliase, die weiterhin aus `src/plugins/runtime/types.ts` exportiert werden:

    | Alt                           | Neu                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Die Runtime-Methode `readSession` ist zugunsten von `getSessionMessages`
    veraltet. Gleiche Signatur; die alte Methode leitet an die neue weiter.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Alt**: `runtime.tasks.flow` (Singular) gab einen Live-Task-Flow-Accessor zurück.

    **Neu**: `runtime.tasks.managedFlows` hält die verwaltete TaskFlow-Mutations-Runtime
    für Plugins bereit, die aus einem Flow heraus untergeordnete Tasks erstellen,
    aktualisieren, abbrechen oder ausführen. Verwenden Sie `runtime.tasks.flows`,
    wenn das Plugin nur DTO-basierte Lesezugriffe benötigt.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Eingebettete Extension-Factories → Middleware für Agent-Tool-Ergebnisse">
    Oben unter "Migration durchführen → Pi-Tool-Ergebnis-Extensions zu Middleware migrieren"
    behandelt. Der Vollständigkeit halber hier enthalten: Der entfernte, nur für Pi
    vorgesehene Pfad `api.registerEmbeddedExtensionFactory(...)` wird durch
    `api.registerAgentToolResultMiddleware(...)` mit einer expliziten Runtime-Liste
    in `contracts.agentToolResultMiddleware` ersetzt.
  </Accordion>

  <Accordion title="OpenClawSchemaType-Alias → OpenClawConfig">
    `OpenClawSchemaType`, re-exportiert aus `openclaw/plugin-sdk`, ist jetzt ein
    einzeiliger Alias für `OpenClawConfig`. Bevorzugen Sie den kanonischen Namen.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Veraltungen auf Extension-Ebene (innerhalb gebündelter Channel-/Provider-Plugins unter
`extensions/`) werden in ihren eigenen Barrels `api.ts` und `runtime-api.ts`
verfolgt. Sie betreffen keine Verträge von Drittanbieter-Plugins und sind hier
nicht aufgeführt. Wenn Sie das lokale Barrel eines gebündelten Plugins direkt
verwenden, lesen Sie vor dem Upgrade die Veraltungskommentare in diesem Barrel.
</Note>

## Zeitplan für die Entfernung

| Wann                   | Was geschieht                                                          |
| ---------------------- | ----------------------------------------------------------------------- |
| **Jetzt**              | Veraltete Oberflächen geben Runtime-Warnungen aus                       |
| **Nächstes Major-Release** | Veraltete Oberflächen werden entfernt; Plugins, die sie weiterhin verwenden, schlagen fehl |

Alle Core-Plugins wurden bereits migriert. Externe Plugins sollten vor dem nächsten
Major-Release migrieren.

## Warnungen vorübergehend unterdrücken

Setzen Sie diese Umgebungsvariablen, während Sie an der Migration arbeiten:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dies ist ein temporärer Ausweg, keine dauerhafte Lösung.

## Verwandte Themen

- [Erste Schritte](/de/plugins/building-plugins) - Ihr erstes Plugin erstellen
- [SDK-Übersicht](/de/plugins/sdk-overview) - vollständige Referenz für Unterpfad-Importe
- [Channel-Plugins](/de/plugins/sdk-channel-plugins) - Channel-Plugins erstellen
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) - Provider-Plugins erstellen
- [Plugin-Interna](/de/plugins/architecture) - tiefgehender Einblick in die Architektur
- [Plugin-Manifest](/de/plugins/manifest) - Referenz zum Manifest-Schema
