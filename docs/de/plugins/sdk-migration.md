---
read_when:
    - Sie sehen die Warnung OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Sie sehen die Warnung OPENCLAW_EXTENSION_API_DEPRECATED
    - Sie haben api.registerEmbeddedExtensionFactory vor OpenClaw 2026.4.25 verwendet
    - Sie aktualisieren ein Plugin auf die moderne Plugin-Architektur
    - Sie pflegen ein externes OpenClaw-Plugin
sidebarTitle: Migrate to SDK
summary: Von der veralteten Abwärtskompatibilitätsschicht zum modernen Plugin-SDK migrieren
title: Plugin-SDK-Migration
x-i18n:
    generated_at: "2026-05-06T06:58:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: f629f6e3f9a0c122f3065d9b0b6b418e1c1ba29d42aff9ed025d61189be3e42a
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw ist von einer breiten Abwärtskompatibilitätsschicht zu einer modernen Plugin-Architektur mit fokussierten, dokumentierten Imports gewechselt. Wenn Ihr Plugin vor der neuen Architektur erstellt wurde, hilft Ihnen dieser Leitfaden bei der Migration.

## Was sich ändert

Das alte Plugin-System stellte zwei sehr offene Oberflächen bereit, über die Plugins alles, was sie benötigten, aus einem einzigen Einstiegspunkt importieren konnten:

- **`openclaw/plugin-sdk/compat`** - ein einzelner Import, der Dutzende von Hilfsfunktionen erneut exportierte. Er wurde eingeführt, um ältere hook-basierte Plugins funktionsfähig zu halten, während die neue Plugin-Architektur entwickelt wurde.
- **`openclaw/plugin-sdk/infra-runtime`** - ein breites Barrel für Runtime-Hilfsfunktionen, das Systemereignisse, Heartbeat-Status, Zustellungswarteschlangen, Fetch-/Proxy-Hilfsfunktionen, Datei-Hilfsfunktionen, Genehmigungstypen und nicht zusammenhängende Dienstprogramme vermischte.
- **`openclaw/plugin-sdk/config-runtime`** - ein breites Config-Kompatibilitäts-Barrel, das während des Migrationsfensters weiterhin veraltete direkte Load-/Write-Hilfsfunktionen enthält.
- **`openclaw/extension-api`** - eine Brücke, die Plugins direkten Zugriff auf hostseitige Hilfsfunktionen wie den eingebetteten Agent Runner gab.
- **`api.registerEmbeddedExtensionFactory(...)`** - ein entfernter, nur für Pi vorgesehener Hook für gebündelte Erweiterungen, der eingebettete Runner-Ereignisse wie `tool_result` beobachten konnte.

Die breiten Import-Oberflächen sind jetzt **veraltet**. Sie funktionieren zur Laufzeit weiterhin, aber neue Plugins dürfen sie nicht verwenden, und bestehende Plugins sollten migrieren, bevor sie im nächsten Major Release entfernt werden. Die nur für Pi vorgesehene API zur Registrierung eingebetteter Erweiterungs-Factorys wurde entfernt; verwenden Sie stattdessen Tool-Ergebnis-Middleware.

OpenClaw entfernt oder interpretiert dokumentiertes Plugin-Verhalten nicht in derselben Änderung neu, die einen Ersatz einführt. Breaking Changes an Verträgen müssen zuerst über einen Kompatibilitätsadapter, Diagnosen, Dokumentation und ein Deprecation-Fenster laufen. Das gilt für SDK-Imports, Manifest-Felder, Setup-APIs, Hooks und Runtime-Registrierungsverhalten.

<Warning>
  Die Abwärtskompatibilitätsschicht wird in einem zukünftigen Major Release entfernt.
  Plugins, die weiterhin aus diesen Oberflächen importieren, werden dann nicht mehr funktionieren.
  Nur für Pi vorgesehene Registrierungen eingebetteter Erweiterungs-Factorys werden bereits nicht mehr geladen.
</Warning>

## Warum sich das geändert hat

Der alte Ansatz verursachte Probleme:

- **Langsamer Start** - das Importieren einer Hilfsfunktion lud Dutzende nicht zusammenhängender Module
- **Zirkuläre Abhängigkeiten** - breite Re-Exports machten es leicht, Importzyklen zu erzeugen
- **Unklare API-Oberfläche** - es gab keine Möglichkeit zu erkennen, welche Exports stabil und welche intern waren

Das moderne Plugin-SDK behebt dies: Jeder Importpfad (`openclaw/plugin-sdk/\<subpath\>`) ist ein kleines, eigenständiges Modul mit einem klaren Zweck und einem dokumentierten Vertrag.

Veraltete Provider-Komfortseams für gebündelte Channels sind ebenfalls entfernt.
Channel-gebrandete Hilfsseams waren private Monorepo-Abkürzungen, keine stabilen Plugin-Verträge. Verwenden Sie stattdessen schmale generische SDK-Unterpfade. Innerhalb des gebündelten Plugin-Workspace sollten Provider-eigene Hilfsfunktionen in der jeweiligen `api.ts` oder `runtime-api.ts` dieses Plugins bleiben.

Aktuelle Beispiele gebündelter Provider:

- Anthropic behält Claude-spezifische Stream-Hilfsfunktionen in seiner eigenen `api.ts`- / `contract-api.ts`-Seam
- OpenAI behält Provider-Builder, Hilfsfunktionen für Standardmodelle und Realtime-Provider-Builder in seiner eigenen `api.ts`
- OpenRouter behält Provider-Builder und Onboarding-/Config-Hilfsfunktionen in seiner eigenen `api.ts`

## Migrationsplan für Talk und Realtime-Voice

Realtime-Voice-, Telefonie-, Meeting- und Browser-Talk-Code wird von oberflächenlokaler Turn-Buchhaltung zu einem gemeinsamen Talk-Sitzungscontroller verschoben, der von `openclaw/plugin-sdk/realtime-voice` exportiert wird. Der neue Controller besitzt den gemeinsamen Talk-Ereignisumschlag, den aktiven Turn-Status, den Capture-Status, den Ausgabee-Audio-Status, den aktuellen Ereignisverlauf und die Ablehnung veralteter Turns. Provider-Plugins sollten weiterhin anbieterspezifische Realtime-Sitzungen besitzen; Surface-Plugins sollten weiterhin Capture, Wiedergabe, Telefonie und Meeting-Eigenheiten besitzen.

Diese Talk-Migration ist absichtlich klar brechend:

1. Behalten Sie die gemeinsamen Controller-/Runtime-Primitiven in
   `plugin-sdk/realtime-voice`.
2. Verschieben Sie gebündelte Oberflächen auf den gemeinsamen Controller: Browser-Relay,
   Managed-Room-Handoff, Voice-Call-Realtime, Voice-Call-Streaming-STT, Google
   Meet-Realtime und natives Push-to-Talk.
3. Ersetzen Sie alte Talk-RPC-Familien durch die endgültige `talk.session.*`- und
   `talk.client.*`-API.
4. Bewerben Sie einen Live-Talk-Ereigniskanal in Gateway
   `hello-ok.features.events`: `talk.event`.
5. Löschen Sie den alten Realtime-HTTP-Endpunkt und jeden Pfad für
   anfragezeitliche Instruction-Overrides.

Neuer Code sollte `createTalkEventSequencer(...)` nicht direkt aufrufen, außer er implementiert einen Low-Level-Adapter oder eine Test-Fixture. Bevorzugen Sie den gemeinsamen Controller, damit turn-bezogene Ereignisse nicht ohne Turn-ID ausgegeben werden können, veraltete `turnEnd`- / `turnCancel`-Aufrufe keinen neueren aktiven Turn löschen können und Ausgabee-Audio-Lifecycle-Ereignisse über Telefonie, Meetings, Browser-Relay, Managed-Room-Handoff und native Talk-Clients hinweg konsistent bleiben.

Die angestrebte Form der öffentlichen API ist:

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

Browser-eigene WebRTC-/Provider-Websocket-Sitzungen verwenden `talk.client.create`, weil der Browser die Provider-Aushandlung und den Medientransport besitzt, während das Gateway Credentials, Instructions und Tool-Policy besitzt. `talk.session.*` ist die gemeinsame Gateway-verwaltete Oberfläche für Gateway-Relay-Realtime, Gateway-Relay-Transcription und Managed-Room-native STT-/TTS-Sitzungen.

Legacy-Configs, die Realtime-Selektoren neben `talk.provider` /
`talk.providers` platziert haben, sollten mit `openclaw doctor --fix` repariert werden; Runtime-Talk interpretiert Speech-/TTS-Provider-Config nicht als Realtime-Provider-Config neu.

Die unterstützten `talk.session.create`-Kombinationen sind absichtlich klein:

| Modus           | Transport       | Brain           | Besitzer           | Hinweise                                                                                                           |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Full-Duplex-Provider-Audio wird über das Gateway gebridged; Tool-Aufrufe werden über das agent-consult-Tool geroutet. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Nur Streaming-STT; Aufrufer senden Eingabeaudio und empfangen Transkriptereignisse.                                |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Push-to-Talk- und Walkie-Talkie-artige Räume, in denen der Client Capture/Wiedergabe besitzt und das Gateway den Turn-Status besitzt. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Nur-Admin-Raummodus für vertrauenswürdige First-Party-Oberflächen, die Gateway-Tool-Aktionen direkt ausführen.     |

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

Das vereinheitlichte Steuerungsvokabular ist ebenfalls bewusst schmal:

| Methode                         | Gilt für                                                | Vertrag                                                                                       |
| ------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Fügt der Provider-Sitzung, die derselben Gateway-Verbindung gehört, einen base64-PCM-Audiochunk hinzu. |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Startet einen Managed-Room-Benutzerturn.                                                       |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Beendet den aktiven Turn nach Validierung auf veraltete Turns.                                |
| `talk.session.cancelTurn`       | alle Gateway-eigenen Sitzungen                          | Bricht aktive Capture-/Provider-/Agent-/TTS-Arbeit für einen Turn ab.                         |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Stoppt die Audioausgabe des Assistenten, ohne den Benutzerturn zwingend zu beenden.           |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Schließt einen vom Relay ausgegebenen Provider-Tool-Aufruf ab.                                |
| `talk.session.close`            | alle vereinheitlichten Sitzungen                        | Stoppt Relay-Sitzungen oder widerruft Managed-Room-Status und vergisst anschließend die vereinheitlichte Sitzungs-ID. |

Führen Sie keine Provider- oder Plattform-Sonderfälle in Core ein, damit dies funktioniert.
Core besitzt Talk-Sitzungssemantik. Provider-Plugins besitzen das Setup von Vendor-Sitzungen.
Voice-Call und Google Meet besitzen Telefonie-/Meeting-Adapter. Browser- und native
Apps besitzen UX für Geräte-Capture/-Wiedergabe.

## Kompatibilitätsrichtlinie

Für externe Plugins folgt Kompatibilitätsarbeit dieser Reihenfolge:

1. neuen Vertrag hinzufügen
2. altes Verhalten über einen Kompatibilitätsadapter verdrahtet lassen
3. Diagnose oder Warnung ausgeben, die den alten Pfad und den Ersatz nennt
4. beide Pfade in Tests abdecken
5. Deprecation und Migrationspfad dokumentieren
6. erst nach dem angekündigten Migrationsfenster entfernen, normalerweise in einem Major Release

  Maintainer können die aktuelle Migrationswarteschlange mit
  `pnpm plugins:boundary-report` prüfen. Verwenden Sie `pnpm plugins:boundary-report:summary` für
  kompakte Zählungen, `--owner <id>` für ein Plugin oder einen Kompatibilitäts-Owner und
  `pnpm plugins:boundary-report:ci`, wenn ein CI-Gate bei fälligen
  Kompatibilitätsdatensätzen, ownerübergreifenden reservierten SDK-Importen oder ungenutzten reservierten SDK-
  Unterpfaden fehlschlagen soll. Der Bericht gruppiert veraltete
  Kompatibilitätsdatensätze nach Entfernungsdatum, zählt lokale Code-/Doku-Referenzen,
  zeigt ownerübergreifende reservierte SDK-Importe und fasst die private
  Memory-Host-SDK-Bridge zusammen, damit Kompatibilitätsbereinigung explizit bleibt, anstatt
  sich auf Ad-hoc-Suchen zu stützen. Reservierte SDK-Unterpfade müssen nachverfolgte Owner-Nutzung haben;
  ungenutzte reservierte Helper-Exporte sollten aus dem öffentlichen SDK entfernt werden.

  Wenn ein Manifestfeld weiterhin akzeptiert wird, können Plugin-Autoren es weiter verwenden, bis
  Dokumentation und Diagnose etwas anderes angeben. Neuer Code sollte die dokumentierte
  Alternative bevorzugen, aber bestehende Plugins sollten bei gewöhnlichen Minor-
  Releases nicht brechen.

  ## Migration

  <Steps>
  <Step title="Runtime-Config-Load-/Write-Helper migrieren">
    Gebündelte Plugins sollten
    `api.runtime.config.loadConfig()` und
    `api.runtime.config.writeConfigFile(...)` nicht mehr direkt aufrufen. Bevorzugen Sie Konfiguration, die
    bereits an den aktiven Aufrufpfad übergeben wurde. Langlebige Handler, die den
    aktuellen Prozess-Snapshot benötigen, können `api.runtime.config.current()` verwenden. Langlebige
    Agent-Tools sollten innerhalb von
    `execute` `ctx.getRuntimeConfig()` aus dem Tool-Kontext verwenden, damit ein Tool, das vor einem Config-Write erstellt wurde, weiterhin die aktualisierte
    Runtime-Config sieht.

    Config-Writes müssen über die transaktionalen Helper laufen und eine
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
    `afterWrite: { mode: "none", reason: "..." }` nur dann, wenn der Aufrufer die
    Nachbereitung besitzt und den Reload-Planer bewusst unterdrücken möchte.
    Mutationsergebnisse enthalten eine typisierte `followUp`-Zusammenfassung für Tests und Logging;
    das Gateway bleibt dafür verantwortlich, den Neustart anzuwenden oder zu planen.
    `loadConfig` und `writeConfigFile` bleiben während des Migrationsfensters als veraltete Kompatibilitäts-
    Helper für externe Plugins erhalten und warnen einmalig mit
    dem Kompatibilitätscode `runtime-config-load-write`. Gebündelte Plugins und Repo-
    Runtime-Code werden durch Scanner-Schutzmechanismen in
    `pnpm check:deprecated-internal-config-api` und
    `pnpm check:no-runtime-action-load-config` geschützt: neue produktive Plugin-Nutzung
    schlägt direkt fehl, direkte Config-Writes schlagen fehl, Gateway-Servermethoden müssen
    den Request-Runtime-Snapshot verwenden, Runtime-Channel-Send-/Action-/Client-Helper
    müssen Config von ihrer Grenze erhalten, und langlebige Runtime-Module haben
    null erlaubte ambiente `loadConfig()`-Aufrufe.

    Neuer Plugin-Code sollte außerdem den Import des breiten
    Kompatibilitäts-Barrels `openclaw/plugin-sdk/config-runtime` vermeiden. Verwenden Sie den schmalen
    SDK-Unterpfad, der zur Aufgabe passt:

    | Bedarf | Import |
    | --- | --- |
    | Config-Typen wie `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Bereits geladene Config-Assertions und Config-Lookup für Plugin-Einträge | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lesezugriffe auf den aktuellen Runtime-Snapshot | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Config-Writes | `openclaw/plugin-sdk/config-mutation` |
    | Session-Store-Helper | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown-Tabellen-Config | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtime-Helper für Gruppenrichtlinien | `openclaw/plugin-sdk/runtime-group-policy` |
    | Auflösung geheimer Eingaben | `openclaw/plugin-sdk/secret-input-runtime` |
    | Modell-/Session-Overrides | `openclaw/plugin-sdk/model-session-runtime` |

    Gebündelte Plugins und ihre Tests werden per Scanner gegen das breite
    Barrel geschützt, damit Importe und Mocks lokal auf das benötigte Verhalten begrenzt bleiben. Das breite
    Barrel existiert weiterhin für externe Kompatibilität, aber neuer Code sollte
    nicht davon abhängen.

  </Step>

  <Step title="Pi-Tool-Result-Erweiterungen zu Middleware migrieren">
    Gebündelte Plugins müssen Pi-spezifische
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

    Externe Plugins können keine Tool-Result-Middleware registrieren, da sie
    Tool-Ausgaben mit hohem Vertrauen umschreiben kann, bevor das Modell sie sieht.

  </Step>

  <Step title="Approval-native Handler zu Capability-Fakten migrieren">
    Approval-fähige Channel-Plugins machen natives Approval-Verhalten jetzt über
    `approvalCapability.nativeRuntime` plus die gemeinsame Runtime-Context-Registry verfügbar.

    Wichtige Änderungen:

    - Ersetzen Sie `approvalCapability.handler.loadRuntime(...)` durch
      `approvalCapability.nativeRuntime`
    - Verschieben Sie Approval-spezifische Authentifizierung/Zustellung von der alten `plugin.auth`-/
      `plugin.approvals`-Verkabelung auf `approvalCapability`
    - `ChannelPlugin.approvals` wurde aus dem öffentlichen Channel-Plugin-
      Vertrag entfernt; verschieben Sie delivery/native/render-Felder auf `approvalCapability`
    - `plugin.auth` bleibt nur für Channel-Login-/Logout-Flows erhalten; Approval-Auth-
      Hooks dort werden vom Core nicht mehr gelesen
    - Registrieren Sie channel-eigene Runtime-Objekte wie Clients, Tokens oder Bolt-
      Apps über `openclaw/plugin-sdk/channel-runtime-context`
    - Senden Sie keine plugin-eigenen Umleitungsmitteilungen aus nativen Approval-Handlern;
      Core besitzt jetzt „anderweitig zugestellt“-Mitteilungen aus tatsächlichen Zustellungsergebnissen
    - Wenn Sie `channelRuntime` an `createChannelManager(...)` übergeben, stellen Sie eine
      echte `createPluginRuntime().channel`-Oberfläche bereit. Partielle Stubs werden abgelehnt.

    Siehe `/plugins/sdk-channel-plugins` für das aktuelle Layout der Approval-Capability.

  </Step>

  <Step title="Fallback-Verhalten des Windows-Wrappers prüfen">
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
    `allowShellFallback` nicht und behandeln stattdessen den ausgelösten Fehler.

  </Step>

  <Step title="Veraltete Importe finden">
    Durchsuchen Sie Ihr Plugin nach Importen aus einer der veralteten Oberflächen:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Durch fokussierte Importe ersetzen">
    Jeder Export aus der alten Oberfläche entspricht einem bestimmten modernen Importpfad:

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

    Verwenden Sie für hostseitige Helper die injizierte Plugin-Runtime, anstatt
    direkt zu importieren:

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

  <Step title="Breite infra-runtime-Importe ersetzen">
    `openclaw/plugin-sdk/infra-runtime` existiert weiterhin für externe
    Kompatibilität, aber neuer Code sollte die fokussierte Helper-Oberfläche importieren, die er
    tatsächlich benötigt:

    | Bedarf | Import |
    | --- | --- |
    | Helper für System-Event-Queue | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat-Event- und Sichtbarkeits-Helper | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Drain der ausstehenden Zustellungswarteschlange | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Channel-Aktivitäts-Telemetrie | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-Memory-Dedupe-Caches | `openclaw/plugin-sdk/dedupe-runtime` |
    | Sichere Helper für lokale Datei-/Medienpfade | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-fähiges Fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy- und geschützte Fetch-Helper | `openclaw/plugin-sdk/fetch-runtime` |
    | Typen für SSRF-Dispatcher-Richtlinien | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typen für Approval-Anfrage/-Auflösung | `openclaw/plugin-sdk/approval-runtime` |
    | Helper für Approval-Antwort-Payload und -Befehle | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helper für Fehlerformatierung | `openclaw/plugin-sdk/error-runtime` |
    | Wartelogik für Transportbereitschaft | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helper für sichere Tokens | `openclaw/plugin-sdk/secure-random-runtime` |
    | Begrenzte Nebenläufigkeit asynchroner Tasks | `openclaw/plugin-sdk/concurrency-runtime` |
    | Numerische Erzwingung | `openclaw/plugin-sdk/number-runtime` |
    | Prozesslokale asynchrone Sperre | `openclaw/plugin-sdk/async-lock-runtime` |
    | Dateisperren | `openclaw/plugin-sdk/file-lock` |

    Gebündelte Plugins werden per Scanner gegen `infra-runtime` geschützt, sodass Repo-Code
    nicht zum breiten Barrel zurückfallen kann.

  </Step>

  <Step title="Channel-Route-Helper migrieren">
    Neuer Channel-Route-Code sollte `openclaw/plugin-sdk/channel-route` verwenden.
    Die älteren Namen für Route-Key und vergleichbares Ziel bleiben während des Migrationsfensters als Kompatibilitäts-
    Aliasse erhalten, aber neue Plugins sollten die Route-
    Namen verwenden, die das Verhalten direkt beschreiben:

    | Alter Helper | Moderner Helper |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Die modernen Route-Hilfsfunktionen normalisieren `{ channel, to, accountId, threadId }`
    konsistent über native Genehmigungen, Antwortunterdrückung, Deduplizierung
    eingehender Nachrichten, Cron-Zustellung und Sitzungsrouting hinweg. Wenn Ihr
    Plugin eine benutzerdefinierte Zielgrammatik besitzt, verwenden Sie
    `resolveChannelRouteTargetWithParser(...)`, um diesen Parser an denselben
    Route-Zielvertrag anzupassen.

  </Step>

  <Step title="Erstellen und testen">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referenz der Importpfade

  <Accordion title="Tabelle gängiger Importpfade">
  | Importpfad | Zweck | Wichtige Exporte |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonische Hilfsfunktion für Plugin-Einstiege | `definePluginEntry` |
  | `plugin-sdk/core` | Legacy-Sammel-Reexport für Kanaleinstiegsdefinitionen/-Ersteller | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export des Wurzel-Konfigurationsschemas | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Einstiegshilfsfunktion für einzelne Provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Fokussierte Kanaleinstiegsdefinitionen und -Ersteller | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gemeinsame Einrichtungsassistent-Hilfsfunktionen | Allowlist-Eingabeaufforderungen, Ersteller für Einrichtungsstatus |
  | `plugin-sdk/setup-runtime` | Laufzeit-Hilfsfunktionen für die Einrichtung | Importsichere Einrichtungs-Patch-Adapter, Lookup-Notiz-Hilfsfunktionen, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Einrichtungs-Proxys |
  | `plugin-sdk/setup-adapter-runtime` | Hilfsfunktionen für Einrichtungsadapter | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Hilfsfunktionen für Einrichtungswerkzeuge | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Hilfsfunktionen für mehrere Konten | Hilfsfunktionen für Kontoliste/Konfiguration/Aktions-Gate |
  | `plugin-sdk/account-id` | Hilfsfunktionen für Konto-IDs | `DEFAULT_ACCOUNT_ID`, Normalisierung von Konto-IDs |
  | `plugin-sdk/account-resolution` | Hilfsfunktionen für Kontosuche | Hilfsfunktionen für Kontosuche + Standard-Fallback |
  | `plugin-sdk/account-helpers` | Schmale Kontohilfsfunktionen | Hilfsfunktionen für Kontolisten/Kontoaktionen |
  | `plugin-sdk/channel-setup` | Adapter für den Einrichtungsassistenten | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM-Kopplungsprimitive | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Verdrahtung für Antwortpräfix, Tippanzeige und Quellzustellung | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabriken für Konfigurationsadapter und Hilfsfunktionen für DM-Zugriff | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Ersteller für Konfigurationsschemata | Gemeinsame Primitive für Kanalkonfigurationsschemas und nur der generische Ersteller |
  | `plugin-sdk/bundled-channel-config-schema` | Gebündelte Konfigurationsschemas | Nur von OpenClaw gepflegte gebündelte Plugins; neue Plugins müssen Plugin-lokale Schemas definieren |
  | `plugin-sdk/channel-config-schema-legacy` | Veraltete gebündelte Konfigurationsschemas | Nur Kompatibilitätsalias; verwenden Sie `plugin-sdk/bundled-channel-config-schema` für gepflegte gebündelte Plugins |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für Telegram-Befehlskonfiguration | Normalisierung von Befehlsnamen, Kürzen von Beschreibungen, Validierung von Duplikaten/Konflikten |
  | `plugin-sdk/channel-policy` | Auflösung von Gruppen-/DM-Richtlinien | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Hilfsfunktionen für Kontostatus und Lebenszyklus von Entwurfsstreams | `createAccountStatusSink`, Hilfsfunktionen zur Finalisierung von Entwurfsvorschauen |
  | `plugin-sdk/inbound-envelope` | Hilfsfunktionen für eingehende Umschläge | Gemeinsame Hilfsfunktionen für Routen- und Umschlagserstellung |
  | `plugin-sdk/inbound-reply-dispatch` | Hilfsfunktionen für eingehende Antworten | Gemeinsame Hilfsfunktionen für Aufzeichnung und Weiterleitung |
  | `plugin-sdk/messaging-targets` | Parsen von Nachrichtenzielen | Hilfsfunktionen für Zielparsing/-abgleich |
  | `plugin-sdk/outbound-media` | Hilfsfunktionen für ausgehende Medien | Gemeinsames Laden ausgehender Medien |
  | `plugin-sdk/outbound-send-deps` | Hilfsfunktionen für Abhängigkeiten ausgehender Sendungen | Leichtgewichtige `resolveOutboundSendDep`-Suche ohne Import der vollständigen ausgehenden Laufzeit |
  | `plugin-sdk/outbound-runtime` | Hilfsfunktionen für ausgehende Laufzeit | Hilfsfunktionen für ausgehende Zustellung, Identitäts-/Sende-Delegierung, Sitzung, Formatierung und Nutzlastplanung |
  | `plugin-sdk/thread-bindings-runtime` | Hilfsfunktionen für Thread-Bindungen | Hilfsfunktionen für Lebenszyklus und Adapter von Thread-Bindungen |
  | `plugin-sdk/agent-media-payload` | Legacy-Hilfsfunktionen für Mediennutzlasten | Ersteller für Agent-Mediennutzlasten für Legacy-Feldlayouts |
  | `plugin-sdk/channel-runtime` | Veralteter Kompatibilitäts-Shim | Nur Legacy-Kanallaufzeit-Dienstprogramme |
  | `plugin-sdk/channel-send-result` | Typen für Sendeergebnisse | Typen für Antwortergebnisse |
  | `plugin-sdk/runtime-store` | Persistenter Plugin-Speicher | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Breite Laufzeit-Hilfsfunktionen | Hilfsfunktionen für Laufzeit/Protokollierung/Sicherung/Plugin-Installation |
  | `plugin-sdk/runtime-env` | Schmale Laufzeitumgebungs-Hilfsfunktionen | Logger/Laufzeitumgebung, Zeitlimit, Wiederholung und Backoff-Hilfsfunktionen |
  | `plugin-sdk/plugin-runtime` | Gemeinsame Plugin-Laufzeit-Hilfsfunktionen | Hilfsfunktionen für Plugin-Befehle/Hooks/HTTP/Interaktivität |
  | `plugin-sdk/hook-runtime` | Hilfsfunktionen für Hook-Pipelines | Gemeinsame Hilfsfunktionen für Webhook/interne Hook-Pipelines |
  | `plugin-sdk/lazy-runtime` | Lazy-Laufzeit-Hilfsfunktionen | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Prozess-Hilfsfunktionen | Gemeinsame Exec-Hilfsfunktionen |
  | `plugin-sdk/cli-runtime` | CLI-Laufzeit-Hilfsfunktionen | Befehlsformatierung, Wartefunktionen, Versionshilfen |
  | `plugin-sdk/gateway-runtime` | Gateway-Hilfsfunktionen | Gateway-Client, Start-Hilfsfunktion für bereite Ereignisschleife und Hilfsfunktionen für Kanalstatus-Patches |
  | `plugin-sdk/config-runtime` | Veralteter Konfigurations-Kompatibilitäts-Shim | Bevorzugen Sie `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` und `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für Telegram-Befehle | Fallback-stabile Hilfsfunktionen für Telegram-Befehlsvalidierung, wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
  | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Genehmigungsaufforderungen | Exec-/Plugin-Genehmigungsnutzlast, Hilfsfunktionen für Genehmigungsfähigkeiten/-profile, natives Genehmigungsrouting/-laufzeit und Formatierung strukturierter Genehmigungsanzeigepfade |
  | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen für Genehmigungsauthentifizierung | Auflösung von Genehmigenden, Aktionsauthentifizierung im selben Chat |
  | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für Genehmigungsclient | Native Hilfsfunktionen für Exec-Genehmigungsprofile/-filter |
  | `plugin-sdk/approval-delivery-runtime` | Hilfsfunktionen für Genehmigungszustellung | Native Adapter für Genehmigungsfähigkeit/-zustellung |
  | `plugin-sdk/approval-gateway-runtime` | Hilfsfunktionen für Genehmigungs-Gateway | Gemeinsame Hilfsfunktion zur Auflösung des Genehmigungs-Gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Hilfsfunktionen für Genehmigungsadapter | Leichtgewichtige Hilfsfunktionen zum Laden nativer Genehmigungsadapter für heiße Kanaleinstiegspunkte |
  | `plugin-sdk/approval-handler-runtime` | Hilfsfunktionen für Genehmigungshandler | Breitere Laufzeit-Hilfsfunktionen für Genehmigungshandler; bevorzugen Sie die schmaleren Adapter-/Gateway-Schnittstellen, wenn sie ausreichen |
  | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen für Genehmigungsziele | Native Hilfsfunktionen für Genehmigungsziel-/Kontobindung |
  | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Genehmigungsantworten | Hilfsfunktionen für Exec-/Plugin-Genehmigungsantwortnutzlasten |
  | `plugin-sdk/channel-runtime-context` | Hilfsfunktionen für Kanallaufzeitkontext | Generische Hilfsfunktionen zum Registrieren/Abrufen/Überwachen des Kanallaufzeitkontexts |
  | `plugin-sdk/security-runtime` | Sicherheits-Hilfsfunktionen | Gemeinsame Hilfsfunktionen für Vertrauen, DM-Gating, wurzelbegrenzte Dateien/Pfade, externe Inhalte und Secret-Erfassung |
  | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für SSRF-Richtlinien | Hilfsfunktionen für Host-Allowlist und Richtlinien für private Netzwerke |
  | `plugin-sdk/ssrf-runtime` | SSRF-Laufzeit-Hilfsfunktionen | Angehefteter Dispatcher, geschütztes Abrufen, Hilfsfunktionen für SSRF-Richtlinien |
  | `plugin-sdk/system-event-runtime` | Hilfsfunktionen für Systemereignisse | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat-Hilfsfunktionen | Hilfsfunktionen für Heartbeat-Ereignisse und Sichtbarkeit |
  | `plugin-sdk/delivery-queue-runtime` | Hilfsfunktionen für Zustellwarteschlangen | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Hilfsfunktionen für Kanalaktivität | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Hilfsfunktionen für Deduplizierung | In-Memory-Deduplizierungs-Caches |
  | `plugin-sdk/file-access-runtime` | Hilfsfunktionen für Dateizugriff | Sichere Hilfsfunktionen für lokale Datei-/Medienpfade |
  | `plugin-sdk/transport-ready-runtime` | Hilfsfunktionen für Transportbereitschaft | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Hilfsfunktionen für begrenzte Caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen für Diagnose-Gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hilfsfunktionen für Fehlerformatierung | `formatUncaughtError`, `isApprovalNotFoundError`, Hilfsfunktionen für Fehlergraphen |
  | `plugin-sdk/fetch-runtime` | Umhüllte Fetch-/Proxy-Hilfsfunktionen | `resolveFetch`, Proxy-Hilfsfunktionen, Hilfsfunktionen für EnvHttpProxyAgent-Optionen |
  | `plugin-sdk/host-runtime` | Hilfsfunktionen für Hostnormalisierung | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Hilfsfunktionen für Wiederholungen | `RetryConfig`, `retryAsync`, Richtlinienausführungen |
  | `plugin-sdk/allow-from` | Allowlist-Formatierung | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Zuordnung von Allowlist-Eingaben | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Hilfsfunktionen für Befehls-Gating und Befehlsoberflächen | `resolveControlCommandGate`, Hilfsfunktionen für Absenderautorisierung, Befehlsregistrierungs-Hilfsfunktionen einschließlich Formatierung dynamischer Argumentmenüs |
  | `plugin-sdk/command-status` | Renderer für Befehlsstatus/-hilfe | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsen von Secret-Eingaben | Hilfsfunktionen für Secret-Eingaben |
  | `plugin-sdk/webhook-ingress` | Hilfsfunktionen für Webhook-Anfragen | Webhook-Zieldienstprogramme |
  | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Webhook-Body-Guards | Hilfsfunktionen zum Lesen/Begrenzen von Anfragebodys |
  | `plugin-sdk/reply-runtime` | Gemeinsame Antwortlaufzeit | Eingehende Weiterleitung, Heartbeat, Antwortplaner, Aufteilung in Stücke |
  | `plugin-sdk/reply-dispatch-runtime` | Schmale Hilfsfunktionen für Antwortweiterleitung | Finalisierung, Provider-Weiterleitung und Hilfsfunktionen für Konversationslabels |
  | `plugin-sdk/reply-history` | Hilfsfunktionen für Antwortverlauf | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planung von Antwortreferenzen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Hilfsfunktionen für Antwortstücke | Hilfsfunktionen zur Aufteilung von Text/Markdown |
  | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Sitzungsspeicher | Hilfsfunktionen für Speicherpfad + Aktualisierungszeitpunkt |
  | `plugin-sdk/state-paths` | Hilfsfunktionen für Zustandspfade | Hilfsfunktionen für Zustands- und OAuth-Verzeichnisse |
  | `plugin-sdk/routing` | Hilfsfunktionen für Routing/Sitzungsschlüssel | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, Hilfsfunktionen zur Normalisierung von Sitzungsschlüsseln |
  | `plugin-sdk/status-helpers` | Hilfsfunktionen für Kanalstatus | Ersteller für Kanal-/Kontostatuszusammenfassungen, Laufzeitzustands-Standards, Hilfsfunktionen für Problemmetadaten |
  | `plugin-sdk/target-resolver-runtime` | Hilfsfunktionen für Zielauflöser | Gemeinsame Hilfsfunktionen für Zielauflöser |
  | `plugin-sdk/string-normalization-runtime` | Hilfsfunktionen für String-Normalisierung | Hilfsfunktionen für Slug-/String-Normalisierung |
  | `plugin-sdk/request-url` | Hilfsfunktionen für Anfrage-URLs | String-URLs aus anfrageähnlichen Eingaben extrahieren |
  | `plugin-sdk/run-command` | Hilfsfunktionen für zeitgesteuerte Befehle | Zeitgesteuerter Befehlsausführer mit normalisiertem stdout/stderr |
  | `plugin-sdk/param-readers` | Parameterleser | Allgemeine Parameterleser für Werkzeuge/CLI |
  | `plugin-sdk/tool-payload` | Tool-Payload-Extraktion | Extrahiert normalisierte Payloads aus Tool-Ergebnisobjekten |
  | `plugin-sdk/tool-send` | Tool-Send-Extraktion | Extrahiert kanonische Send-Zielfelder aus Tool-Argumenten |
  | `plugin-sdk/temp-path` | Hilfsfunktionen für temporäre Pfade | Gemeinsame Hilfsfunktionen für temporäre Download-Pfade |
  | `plugin-sdk/logging-core` | Logging-Hilfsfunktionen | Subsystem-Logger und Redaction-Hilfsfunktionen |
  | `plugin-sdk/markdown-table-runtime` | Hilfsfunktionen für Markdown-Tabellen | Hilfsfunktionen für Markdown-Tabellenmodi |
  | `plugin-sdk/reply-payload` | Typen für Nachrichtenantworten | Typen für Antwort-Payloads |
  | `plugin-sdk/provider-setup` | Kuratierte Hilfsfunktionen für lokale/self-hosted Provider-Einrichtung | Hilfsfunktionen für Erkennung/Konfiguration self-hosted Provider |
  | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Hilfsfunktionen für OpenAI-kompatible self-hosted Provider-Einrichtung | Dieselben Hilfsfunktionen für Erkennung/Konfiguration self-hosted Provider |
  | `plugin-sdk/provider-auth-runtime` | Hilfsfunktionen für Provider-Runtime-Authentifizierung | Hilfsfunktionen zur Laufzeitauflösung von API-Schlüsseln |
  | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen für Provider-API-Schlüsseleinrichtung | Hilfsfunktionen für API-Schlüssel-Onboarding und Profilschreiben |
  | `plugin-sdk/provider-auth-result` | Hilfsfunktionen für Provider-Auth-Ergebnisse | Standard-Builder für OAuth-Auth-Ergebnisse |
  | `plugin-sdk/provider-auth-login` | Hilfsfunktionen für interaktive Provider-Anmeldung | Gemeinsame Hilfsfunktionen für interaktive Anmeldung |
  | `plugin-sdk/provider-selection-runtime` | Hilfsfunktionen für Provider-Auswahl | Konfigurierte-oder-automatische Provider-Auswahl und Zusammenführung roher Provider-Konfiguration |
  | `plugin-sdk/provider-env-vars` | Hilfsfunktionen für Provider-Env-Variablen | Hilfsfunktionen für die Suche nach Provider-Auth-Env-Variablen |
  | `plugin-sdk/provider-model-shared` | Gemeinsame Hilfsfunktionen für Provider-Modelle/Replay | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Replay-Policy-Builder, Provider-Endpoint-Hilfsfunktionen und Hilfsfunktionen zur Model-ID-Normalisierung |
  | `plugin-sdk/provider-catalog-shared` | Gemeinsame Hilfsfunktionen für Provider-Kataloge | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Provider-Onboarding-Patches | Hilfsfunktionen für Onboarding-Konfiguration |
  | `plugin-sdk/provider-http` | Provider-HTTP-Hilfsfunktionen | Generische Hilfsfunktionen für Provider-HTTP/Endpoint-Fähigkeiten, einschließlich Multipart-Formular-Hilfsfunktionen für Audio-Transkription |
  | `plugin-sdk/provider-web-fetch` | Provider-Web-Fetch-Hilfsfunktionen | Hilfsfunktionen für Web-Fetch-Provider-Registrierung/Cache |
  | `plugin-sdk/provider-web-search-config-contract` | Hilfsfunktionen für Provider-Web-Search-Konfiguration | Schmale Hilfsfunktionen für Web-Search-Konfiguration/Anmeldedaten für Provider, die keine Plugin-Aktivierungsverdrahtung benötigen |
  | `plugin-sdk/provider-web-search-contract` | Hilfsfunktionen für Provider-Web-Search-Contract | Schmale Hilfsfunktionen für Web-Search-Konfigurations-/Anmeldedaten-Contracts wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsgebundene Setter/Getter für Anmeldedaten |
  | `plugin-sdk/provider-web-search` | Provider-Web-Search-Hilfsfunktionen | Hilfsfunktionen für Web-Search-Provider-Registrierung/Cache/Runtime |
  | `plugin-sdk/provider-tools` | Hilfsfunktionen für Provider-Tool-/Schema-Kompatibilität | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini-Schema-Bereinigung + Diagnose sowie xAI-Kompatibilitäts-Hilfsfunktionen wie `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Hilfsfunktionen für Provider-Nutzung | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` und weitere Hilfsfunktionen für Provider-Nutzung |
  | `plugin-sdk/provider-stream` | Hilfsfunktionen für Provider-Stream-Wrapper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Wrapper-Hilfsfunktionen für Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Hilfsfunktionen für Provider-Transport | Native Provider-Transport-Hilfsfunktionen wie geschützter Fetch, Transport-Nachrichtentransformationen und beschreibbare Transport-Ereignisstreams |
  | `plugin-sdk/keyed-async-queue` | Geordnete asynchrone Queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gemeinsame Medien-Hilfsfunktionen | Hilfsfunktionen für Medienabruf/-transformation/-speicherung, ffprobe-gestützte Ermittlung von Videodimensionen und Media-Payload-Builder |
  | `plugin-sdk/media-generation-runtime` | Gemeinsame Hilfsfunktionen für Mediengenerierung | Gemeinsame Failover-Hilfsfunktionen, Kandidatenauswahl und Meldungen zu fehlenden Modellen für Bild-/Video-/Musikgenerierung |
  | `plugin-sdk/media-understanding` | Hilfsfunktionen für Medienverständnis | Provider-Typen für Medienverständnis plus Provider-orientierte Exportfunktionen für Bild/Audio |
  | `plugin-sdk/text-runtime` | Gemeinsame Text-Hilfsfunktionen | Entfernen von assistentensichtbarem Text, Hilfsfunktionen für Markdown-Rendering/Chunking/Tabellen, Redaction-Hilfsfunktionen, Hilfsfunktionen für Direktiven-Tags, Safe-Text-Utilities und zugehörige Text-/Logging-Hilfsfunktionen |
  | `plugin-sdk/text-chunking` | Hilfsfunktionen für Text-Chunking | Hilfsfunktion für ausgehendes Text-Chunking |
  | `plugin-sdk/speech` | Speech-Hilfsfunktionen | Speech-Provider-Typen plus Provider-orientierte Hilfsfunktionen für Direktiven, Registry und Validierung sowie OpenAI-kompatibler TTS-Builder |
  | `plugin-sdk/speech-core` | Gemeinsamer Speech-Core | Speech-Provider-Typen, Registry, Direktiven, Normalisierung |
  | `plugin-sdk/realtime-transcription` | Hilfsfunktionen für Echtzeittranskription | Provider-Typen, Registry-Hilfsfunktionen und gemeinsame WebSocket-Sitzungshilfsfunktion |
  | `plugin-sdk/realtime-voice` | Hilfsfunktionen für Echtzeit-Sprache | Provider-Typen, Registry-/Auflösungshilfsfunktionen, Bridge-Sitzungshilfsfunktionen, gemeinsame Agent-Talk-Back-Queues, Transkript-/Ereignisgesundheit, Echo-Unterdrückung und schnelle Kontext-Consult-Hilfsfunktionen |
  | `plugin-sdk/image-generation` | Hilfsfunktionen für Bildgenerierung | Provider-Typen für Bildgenerierung plus Hilfsfunktionen für Bild-Assets/Daten-URLs und OpenAI-kompatibler Bild-Provider-Builder |
  | `plugin-sdk/image-generation-core` | Gemeinsamer Core für Bildgenerierung | Bildgenerierungstypen, Failover, Authentifizierung und Registry-Hilfsfunktionen |
  | `plugin-sdk/music-generation` | Hilfsfunktionen für Musikgenerierung | Provider-/Request-/Result-Typen für Musikgenerierung |
  | `plugin-sdk/music-generation-core` | Gemeinsamer Core für Musikgenerierung | Musikgenerierungstypen, Failover-Hilfsfunktionen, Provider-Suche und Model-Ref-Parsing |
  | `plugin-sdk/video-generation` | Hilfsfunktionen für Videogenerierung | Provider-/Request-/Result-Typen für Videogenerierung |
  | `plugin-sdk/video-generation-core` | Gemeinsamer Core für Videogenerierung | Videogenerierungstypen, Failover-Hilfsfunktionen, Provider-Suche und Model-Ref-Parsing |
  | `plugin-sdk/interactive-runtime` | Hilfsfunktionen für interaktive Antworten | Normalisierung/Reduktion von Payloads für interaktive Antworten |
  | `plugin-sdk/channel-config-primitives` | Channel-Konfigurationsprimitive | Schmale Primitive für Channel-Konfigurationsschemas |
  | `plugin-sdk/channel-config-writes` | Hilfsfunktionen für Channel-Konfigurationsschreibvorgänge | Hilfsfunktionen für Autorisierung von Channel-Konfigurationsschreibvorgängen |
  | `plugin-sdk/channel-plugin-common` | Gemeinsamer Channel-Prelude | Gemeinsame Channel-Plugin-Prelude-Exporte |
  | `plugin-sdk/channel-status` | Hilfsfunktionen für Channel-Status | Gemeinsame Hilfsfunktionen für Channel-Status-Snapshot/-Zusammenfassung |
  | `plugin-sdk/allowlist-config-edit` | Hilfsfunktionen für Allowlist-Konfiguration | Hilfsfunktionen zum Bearbeiten/Lesen der Allowlist-Konfiguration |
  | `plugin-sdk/group-access` | Hilfsfunktionen für Gruppenzugriff | Gemeinsame Hilfsfunktionen für Gruppenzugriffsentscheidungen |
  | `plugin-sdk/direct-dm` | Hilfsfunktionen für direkte DMs | Gemeinsame Hilfsfunktionen für Authentifizierung/Schutz direkter DMs |
  | `plugin-sdk/extension-shared` | Gemeinsame Erweiterungs-Hilfsfunktionen | Primitive für passive Channels/Status und Ambient-Proxy-Hilfsfunktionen |
  | `plugin-sdk/webhook-targets` | Webhook-Ziel-Hilfsfunktionen | Webhook-Ziel-Registry und Hilfsfunktionen für Routeninstallation |
  | `plugin-sdk/webhook-path` | Webhook-Pfad-Hilfsfunktionen | Hilfsfunktionen für Webhook-Pfadnormalisierung |
  | `plugin-sdk/web-media` | Gemeinsame Webmedien-Hilfsfunktionen | Hilfsfunktionen für Remote-/lokales Laden von Medien |
  | `plugin-sdk/zod` | Zod-Re-Export | Re-exportiertes `zod` für Plugin-SDK-Nutzer |
  | `plugin-sdk/memory-core` | Gebündelte Memory-Core-Hilfsfunktionen | Oberfläche für Memory-Manager-/Konfigurations-/Datei-/CLI-Hilfsfunktionen |
  | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade für Memory-Engine | Runtime-Fassade für Memory-Index/-Suche |
  | `plugin-sdk/memory-core-host-engine-foundation` | Memory-Host-Foundation-Engine | Exporte der Memory-Host-Foundation-Engine |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Memory-Host-Embedding-Engine | Memory-Embedding-Contracts, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Hilfsfunktionen; konkrete Remote-Provider liegen in ihren besitzenden Plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | Memory-Host-QMD-Engine | Exporte der Memory-Host-QMD-Engine |
  | `plugin-sdk/memory-core-host-engine-storage` | Memory-Host-Storage-Engine | Exporte der Memory-Host-Storage-Engine |
  | `plugin-sdk/memory-core-host-multimodal` | Hilfsfunktionen für multimodalen Memory-Host | Hilfsfunktionen für multimodalen Memory-Host |
  | `plugin-sdk/memory-core-host-query` | Hilfsfunktionen für Memory-Host-Abfragen | Hilfsfunktionen für Memory-Host-Abfragen |
  | `plugin-sdk/memory-core-host-secret` | Hilfsfunktionen für Memory-Host-Secrets | Hilfsfunktionen für Memory-Host-Secrets |
  | `plugin-sdk/memory-core-host-events` | Hilfsfunktionen für Memory-Host-Ereignisjournal | Hilfsfunktionen für Memory-Host-Ereignisjournal |
  | `plugin-sdk/memory-core-host-status` | Hilfsfunktionen für Memory-Host-Status | Hilfsfunktionen für Memory-Host-Status |
  | `plugin-sdk/memory-core-host-runtime-cli` | Memory-Host-CLI-Runtime | Hilfsfunktionen für Memory-Host-CLI-Runtime |
  | `plugin-sdk/memory-core-host-runtime-core` | Memory-Host-Core-Runtime | Hilfsfunktionen für Memory-Host-Core-Runtime |
  | `plugin-sdk/memory-core-host-runtime-files` | Hilfsfunktionen für Memory-Host-Dateien/-Runtime | Hilfsfunktionen für Memory-Host-Dateien/-Runtime |
  | `plugin-sdk/memory-host-core` | Alias für Memory-Host-Core-Runtime | Vendor-neutraler Alias für Hilfsfunktionen der Memory-Host-Core-Runtime |
  | `plugin-sdk/memory-host-events` | Alias für Memory-Host-Ereignisjournal | Vendor-neutraler Alias für Hilfsfunktionen des Memory-Host-Ereignisjournals |
  | `plugin-sdk/memory-host-files` | Alias für Memory-Host-Dateien/-Runtime | Vendor-neutraler Alias für Hilfsfunktionen für Memory-Host-Dateien/-Runtime |
  | `plugin-sdk/memory-host-markdown` | Hilfsfunktionen für verwaltetes Markdown | Gemeinsame Hilfsfunktionen für verwaltetes Markdown für Memory-nahe Plugins |
  | `plugin-sdk/memory-host-search` | Active-Memory-Suchfassade | Lazy-Runtime-Fassade für Active-Memory-Suchmanager |
  | `plugin-sdk/memory-host-status` | Alias für Memory-Host-Status | Vendor-neutraler Alias für Hilfsfunktionen für Memory-Host-Status |
  | `plugin-sdk/testing` | Test-Utilities | Legacy-Barrel für breite Kompatibilität; bevorzugen Sie fokussierte Test-Unterpfade wie `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` und `plugin-sdk/test-fixtures` |
</Accordion>

Diese Tabelle ist bewusst die gemeinsame Teilmenge für die Migration, nicht die vollständige SDK-Oberfläche. Die vollständige Liste mit über 200 Einstiegspunkten befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`.

Reservierte Hilfs-Seams für gebündelte Plugins wurden aus der Export-Map des öffentlichen SDK entfernt, mit Ausnahme ausdrücklich dokumentierter Kompatibilitäts-Fassaden wie dem veralteten `plugin-sdk/discord`-Shim, der für das veröffentlichte Paket `@openclaw/discord@2026.3.13` beibehalten wird. Owner-spezifische Hilfsfunktionen befinden sich im jeweils verantwortlichen Plugin-Paket; gemeinsam genutztes Host-Verhalten sollte über generische SDK-Verträge wie `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` und `plugin-sdk/plugin-config-runtime` laufen.

Verwenden Sie den engsten Import, der zur Aufgabe passt. Wenn Sie keinen Export finden, prüfen Sie die Quelle unter `src/plugin-sdk/` oder fragen Sie die Maintainer, welcher generische Vertrag dafür zuständig sein sollte.

## Aktive Veraltungen

Engere Veraltungen, die über das Plugin-SDK, den Provider-Vertrag, die Laufzeitoberfläche und das Manifest hinweg gelten. Jede davon funktioniert heute noch, wird aber in einer zukünftigen Hauptversion entfernt. Der Eintrag unter jedem Punkt ordnet die alte API ihrem kanonischen Ersatz zu.

<AccordionGroup>
  <Accordion title="command-auth-Hilfsfunktionen für Hilfe → command-status">
    **Alt (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Neu (`openclaw/plugin-sdk/command-status`)**: gleiche Signaturen, gleiche
    Exporte – nur aus dem engeren Unterpfad importiert. `command-auth`
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

    **Neu**: `resolveInboundMentionDecision({ facts, policy })` – gibt ein
    einzelnes Entscheidungsobjekt statt zweier getrennter Aufrufe zurück.

    Nachgelagerte Kanal-Plugins (Slack, Discord, Matrix, MS Teams) wurden bereits
    umgestellt.

  </Accordion>

  <Accordion title="Channel-Runtime-Shim und Channel-Actions-Hilfsfunktionen">
    `openclaw/plugin-sdk/channel-runtime` ist ein Kompatibilitäts-Shim für ältere
    Kanal-Plugins. Importieren Sie ihn nicht in neuem Code; verwenden Sie
    `openclaw/plugin-sdk/channel-runtime-context`, um Laufzeitobjekte zu
    registrieren.

    `channelActions*`-Hilfsfunktionen in `openclaw/plugin-sdk/channel-actions`
    sind zusammen mit rohen „actions“-Kanalexporten veraltet. Stellen Sie
    Fähigkeiten stattdessen über die semantische `presentation`-Oberfläche
    bereit – Kanal-Plugins deklarieren, was sie rendern (Karten, Buttons,
    Auswahlfelder), statt welche rohen Action-Namen sie akzeptieren.

  </Accordion>

  <Accordion title="Web-Search-Provider-Hilfsfunktion tool() → createTool() im Plugin">
    **Alt**: `tool()`-Factory aus `openclaw/plugin-sdk/provider-web-search`.

    **Neu**: Implementieren Sie `createTool(...)` direkt im Provider-Plugin.
    OpenClaw benötigt die SDK-Hilfsfunktion nicht mehr, um den Tool-Wrapper zu
    registrieren.

  </Accordion>

  <Accordion title="Plaintext-Kanalumschläge → BodyForAgent">
    **Alt**: `formatInboundEnvelope(...)` (und
    `ChannelMessageForAgent.channelEnvelope`), um aus eingehenden
    Kanalnachrichten einen flachen Plaintext-Prompt-Umschlag zu erstellen.

    **Neu**: `BodyForAgent` plus strukturierte Benutzerkontext-Blöcke.
    Kanal-Plugins hängen Routing-Metadaten (Thread, Thema, Antwortbezug,
    Reaktionen) als typisierte Felder an, statt sie zu einem Prompt-String zu
    verketten. Die Hilfsfunktion `formatAgentEnvelope(...)` wird für synthetisierte
    assistentenbezogene Umschläge weiterhin unterstützt, aber eingehende
    Plaintext-Umschläge werden auslaufen.

    Betroffene Bereiche: `inbound_claim`, `message_received` und jedes
    benutzerdefinierte Kanal-Plugin, das `channelEnvelope`-Text nachverarbeitet
    hat.

  </Accordion>

  <Accordion title="Provider-Discovery-Typen → Provider-Katalogtypen">
    Vier Discovery-Typaliase sind jetzt dünne Wrapper über den Typen der
    Katalog-Ära:

    | Alter Alias               | Neuer Typ                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Außerdem der alte statische `ProviderCapabilities`-Container – Provider-Plugins
    sollten explizite Provider-Hooks wie `buildReplayPolicy`,
    `normalizeToolSchemas` und `wrapStreamFn` verwenden statt eines statischen
    Objekts.

  </Accordion>

  <Accordion title="Thinking-Policy-Hooks → resolveThinkingProfile">
    **Alt** (drei separate Hooks auf `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` und
    `resolveDefaultThinkingLevel(ctx)`.

    **Neu**: ein einzelnes `resolveThinkingProfile(ctx)`, das ein
    `ProviderThinkingProfile` mit der kanonischen `id`, optionalem `label` und
    sortierter Level-Liste zurückgibt. OpenClaw stuft veraltete gespeicherte
    Werte automatisch anhand des Profilrangs herunter.

    Implementieren Sie einen Hook statt drei. Die Legacy-Hooks funktionieren
    während des Veraltungsfensters weiter, werden aber nicht mit dem
    Profilergebnis kombiniert.

  </Accordion>

  <Accordion title="Fallback für externe OAuth-Provider → contracts.externalAuthProviders">
    **Alt**: `resolveExternalOAuthProfiles(...)` implementieren, ohne den
    Provider im Plugin-Manifest zu deklarieren.

    **Neu**: Deklarieren Sie `contracts.externalAuthProviders` im Plugin-Manifest
    **und** implementieren Sie `resolveExternalAuthProfiles(...)`. Der alte
    „Auth-Fallback“-Pfad gibt zur Laufzeit eine Warnung aus und wird entfernt.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider-Env-Var-Suche → setup.providers[].envVars">
    **Altes** Manifestfeld: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Neu**: Spiegeln Sie dieselbe Env-Var-Suche in `setup.providers[].envVars`
    im Manifest. Dadurch werden Setup-/Status-Env-Metadaten an einer Stelle
    konsolidiert und es wird vermieden, die Plugin-Laufzeit nur zur Beantwortung
    von Env-Var-Suchen zu starten.

    `providerAuthEnvVars` bleibt über einen Kompatibilitätsadapter unterstützt,
    bis das Veraltungsfenster geschlossen wird.

  </Accordion>

  <Accordion title="Registrierung von Memory-Plugins → registerMemoryCapability">
    **Alt**: drei separate Aufrufe –
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Neu**: ein Aufruf auf der Memory-State-API –
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Gleiche Slots, ein einzelner Registrierungsaufruf. Additive Memory-Hilfsfunktionen
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) sind nicht betroffen.

  </Accordion>

  <Accordion title="Subagent-Sitzungsnachrichtentypen umbenannt">
    Zwei Legacy-Typaliase werden weiterhin aus `src/plugins/runtime/types.ts`
    exportiert:

    | Alt                           | Neu                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Die Laufzeitmethode `readSession` ist zugunsten von `getSessionMessages`
    veraltet. Gleiche Signatur; die alte Methode ruft die neue durch.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Alt**: `runtime.tasks.flow` (Singular) gab einen Live-Task-Flow-Accessor zurück.

    **Neu**: `runtime.tasks.managedFlows` behält die verwaltete TaskFlow-Mutationslaufzeit
    für Plugins bei, die Child-Tasks aus einem Flow erstellen, aktualisieren,
    abbrechen oder ausführen. Verwenden Sie `runtime.tasks.flows`, wenn das Plugin
    nur DTO-basierte Lesezugriffe benötigt.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Eingebettete Extension-Factorys → Middleware für Agent-Tool-Ergebnisse">
    Oben unter „Migration → Pi-Tool-Ergebnis-Erweiterungen zu Middleware
    migrieren“ behandelt. Der Vollständigkeit halber hier aufgenommen: Der
    entfernte Pi-spezifische Pfad `api.registerEmbeddedExtensionFactory(...)`
    wird durch `api.registerAgentToolResultMiddleware(...)` mit einer expliziten
    Laufzeitliste in `contracts.agentToolResultMiddleware` ersetzt.
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
Veraltungen auf Extension-Ebene (innerhalb gebündelter Kanal-/Provider-Plugins
unter `extensions/`) werden in ihren eigenen `api.ts`- und `runtime-api.ts`-Barrels
nachverfolgt. Sie betreffen keine Plugin-Verträge von Drittanbietern und sind
hier nicht aufgeführt. Wenn Sie das lokale Barrel eines gebündelten Plugins direkt
verwenden, lesen Sie vor dem Upgrade die Veraltungskommentare in diesem Barrel.
</Note>

## Zeitplan für die Entfernung

| Wann                   | Was passiert                                                           |
| ---------------------- | ----------------------------------------------------------------------- |
| **Jetzt**              | Veraltete Oberflächen geben Laufzeitwarnungen aus                       |
| **Nächste Hauptversion** | Veraltete Oberflächen werden entfernt; Plugins, die sie noch verwenden, schlagen fehl |

Alle Core-Plugins wurden bereits migriert. Externe Plugins sollten vor der
nächsten Hauptversion migrieren.

## Warnungen vorübergehend unterdrücken

Setzen Sie diese Umgebungsvariablen, während Sie an der Migration arbeiten:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dies ist ein temporärer Ausweg, keine dauerhafte Lösung.

## Verwandte Themen

- [Erste Schritte](/de/plugins/building-plugins) – Ihr erstes Plugin erstellen
- [SDK-Überblick](/de/plugins/sdk-overview) – vollständige Referenz für Unterpfad-Importe
- [Kanal-Plugins](/de/plugins/sdk-channel-plugins) – Kanal-Plugins erstellen
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) – Provider-Plugins erstellen
- [Plugin-Interna](/de/plugins/architecture) – detaillierter Architekturüberblick
- [Plugin-Manifest](/de/plugins/manifest) – Referenz zum Manifest-Schema
