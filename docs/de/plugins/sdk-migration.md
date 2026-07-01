---
read_when:
    - Sie sehen die Warnung OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Sie sehen die Warnung OPENCLAW_EXTENSION_API_DEPRECATED
    - Sie haben api.registerEmbeddedExtensionFactory vor OpenClaw 2026.4.25 verwendet
    - Sie aktualisieren ein Plugin auf die moderne Plugin-Architektur
    - Sie pflegen ein externes OpenClaw-Plugin
sidebarTitle: Migrate to SDK
summary: Von der alten Abwärtskompatibilitätsschicht zum modernen Plugin-SDK migrieren
title: Migration des Plugin SDK
x-i18n:
    generated_at: "2026-07-01T07:57:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f05bd42cc0a6fc53f6670377b4330bb452b2a06f4d0542a494875970ee81e08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw ist von einer breiten Rückwärtskompatibilitätsschicht zu einer modernen Plugin-
Architektur mit fokussierten, dokumentierten Imports gewechselt. Wenn Ihr Plugin vor
der neuen Architektur erstellt wurde, hilft Ihnen dieser Leitfaden bei der Migration.

## Was sich ändert

Das alte Plugin-System stellte zwei sehr offene Oberflächen bereit, über die Plugins
alles, was sie brauchten, über einen einzigen Einstiegspunkt importieren konnten:

- **`openclaw/plugin-sdk/compat`** - ein einzelner Import, der Dutzende von
  Hilfsfunktionen erneut exportierte. Er wurde eingeführt, um ältere Hook-basierte
  Plugins funktionsfähig zu halten, während die neue Plugin-Architektur aufgebaut wurde.
- **`openclaw/plugin-sdk/infra-runtime`** - ein breites Runtime-Hilfs-Barrel, das
  Systemereignisse, Heartbeat-Status, Zustellwarteschlangen, Fetch-/Proxy-Hilfen,
  Datei-Hilfen, Freigabetypen und nicht zusammenhängende Utilities vermischte.
- **`openclaw/plugin-sdk/config-runtime`** - ein breites Konfigurations-Kompatibilitäts-Barrel,
  das während des Migrationsfensters noch veraltete direkte Lade-/Schreibhilfen enthält.
- **`openclaw/extension-api`** - eine Brücke, die Plugins direkten Zugriff auf
  hostseitige Hilfen wie den eingebetteten Agent-Runner gab.
- **`api.registerEmbeddedExtensionFactory(...)`** - ein entfernter, nur für den eingebetteten Runner
  bestimmter Hook für gebündelte Erweiterungen, der Ereignisse des eingebetteten Runners wie
  `tool_result` beobachten konnte.

Die breiten Importoberflächen sind jetzt **veraltet**. Zur Laufzeit funktionieren
sie weiterhin, aber neue Plugins dürfen sie nicht verwenden, und bestehende Plugins
sollten migrieren, bevor die nächste Major-Version sie entfernt. Die nur für den
eingebetteten Runner bestimmte API zur Registrierung von Extension Factories wurde
entfernt; verwenden Sie stattdessen Tool-Result-Middleware.

OpenClaw entfernt oder reinterpretet dokumentiertes Plugin-Verhalten nicht in
derselben Änderung, die einen Ersatz einführt. Breaking Changes an Verträgen müssen
zuerst über einen Kompatibilitätsadapter, Diagnosen, Dokumentation und ein
Deprecation-Fenster laufen. Das gilt für SDK-Imports, Manifestfelder, Setup-APIs,
Hooks und Runtime-Registrierungsverhalten.

<Warning>
  Die Rückwärtskompatibilitätsschicht wird in einer zukünftigen Major-Version entfernt.
  Plugins, die weiterhin aus diesen Oberflächen importieren, werden dann nicht mehr funktionieren.
  Legacy-Registrierungen für eingebettete Extension Factories werden bereits nicht mehr geladen.
</Warning>

## Warum dies geändert wurde

Der alte Ansatz verursachte Probleme:

- **Langsamer Start** - das Importieren einer Hilfsfunktion lud Dutzende nicht zusammenhängender Module
- **Zirkuläre Abhängigkeiten** - breite Re-Exports machten es einfach, Importzyklen zu erzeugen
- **Unklare API-Oberfläche** - es gab keine Möglichkeit zu erkennen, welche Exporte stabil und welche intern waren

Das moderne Plugin-SDK behebt dies: Jeder Importpfad (`openclaw/plugin-sdk/\<subpath\>`)
ist ein kleines, eigenständiges Modul mit klarem Zweck und dokumentiertem Vertrag.

Legacy-Komfort-Seams für Provider bei gebündelten Kanälen gibt es ebenfalls nicht mehr.
Kanalgebrandete Hilfs-Seams waren private Mono-Repo-Abkürzungen, keine stabilen
Plugin-Verträge. Verwenden Sie stattdessen schmale generische SDK-Unterpfade. Innerhalb des
gebündelten Plugin-Workspace sollten Provider-eigene Hilfen in der eigenen `api.ts` oder
`runtime-api.ts` dieses Plugins bleiben.

Aktuelle Beispiele für gebündelte Provider:

- Anthropic hält Claude-spezifische Stream-Hilfen in seinem eigenen `api.ts`- /
  `contract-api.ts`-Seam
- OpenAI hält Provider-Builder, Hilfen für Standardmodelle und Realtime-Provider-
  Builder in seinem eigenen `api.ts`
- OpenRouter hält Provider-Builder und Onboarding-/Konfigurationshilfen in seinem eigenen
  `api.ts`

## Migrationsplan für Talk und Realtime-Voice

Realtime-Voice-, Telefonie-, Meeting- und Browser-Talk-Code wird von
oberflächenlokaler Turn-Buchhaltung zu einem gemeinsam genutzten Talk-Session-Controller verschoben, der von
`openclaw/plugin-sdk/realtime-voice` exportiert wird. Der neue Controller besitzt das gemeinsame Talk-
Ereignis-Envelope, den aktiven Turn-Status, Capture-Status, Output-Audio-Status, den jüngsten
Ereignisverlauf und die Ablehnung veralteter Turns. Provider-Plugins sollten weiterhin
anbieterspezifische Realtime-Sessions besitzen; Surface-Plugins sollten weiterhin Capture,
Wiedergabe, Telefonie- und Meeting-Besonderheiten besitzen.

Diese Talk-Migration ist bewusst als sauberer Bruch angelegt:

1. Halten Sie die gemeinsamen Controller-/Runtime-Primitiven in
   `plugin-sdk/realtime-voice`.
2. Verschieben Sie gebündelte Oberflächen auf den gemeinsamen Controller: Browser-Relay,
   Managed-Room-Handoff, Voice-Call-Realtime, Voice-Call-Streaming-STT, Google
   Meet Realtime und natives Push-to-Talk.
3. Ersetzen Sie alte Talk-RPC-Familien durch die finale API `talk.session.*` und
   `talk.client.*`.
4. Bewerben Sie einen Live-Talk-Ereigniskanal in Gateway
   `hello-ok.features.events`: `talk.event`.
5. Löschen Sie den alten Realtime-HTTP-Endpunkt und jeden pfad für requestzeitliche Instruction-
   Overrides.

Neuer Code sollte `createTalkEventSequencer(...)` nicht direkt aufrufen, es sei denn, er
implementiert einen Low-Level-Adapter oder eine Test-Fixture. Bevorzugen Sie den gemeinsamen Controller,
damit turnbezogene Ereignisse nicht ohne Turn-ID ausgegeben werden können, veraltete `turnEnd`- /
`turnCancel`-Aufrufe keinen neueren aktiven Turn löschen können und Output-Audio-Lifecycle-
Ereignisse über Telefonie, Meetings, Browser-Relay, Managed-Room-
Handoff und native Talk-Clients hinweg konsistent bleiben.

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
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Browser-eigene WebRTC-/Provider-Websocket-Sessions verwenden `talk.client.create`,
weil der Browser die Provider-Aushandlung und den Medientransport besitzt, während der
Gateway Zugangsdaten, Instructions und Tool-Policy besitzt. `talk.session.*` ist die
gemeinsame vom Gateway verwaltete Oberfläche für Gateway-Relay-Realtime, Gateway-Relay-
Transkription und Managed-Room-native STT-/TTS-Sessions.

Legacy-Konfigurationen, die Realtime-Selektoren neben `talk.provider` /
`talk.providers` platziert haben, sollten mit `openclaw doctor --fix` repariert werden; Runtime-Talk
reinterpretet Speech-/TTS-Provider-Konfiguration nicht als Realtime-Provider-Konfiguration.

Die unterstützten `talk.session.create`-Kombinationen sind absichtlich klein:

| Modus           | Transport       | Brain           | Besitzer           | Hinweise                                                                                                           |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Full-Duplex-Provider-Audio wird durch den Gateway gebrückt; Tool-Aufrufe werden über das Agent-Consult-Tool geroutet. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Nur Streaming-STT; Aufrufer senden Eingabeaudio und empfangen Transkriptereignisse.                                |
| `stt-tts`       | `managed-room`  | `agent-consult` | Nativer/Client-Raum | Push-to-Talk- und Walkie-Talkie-artige Räume, in denen der Client Capture/Wiedergabe besitzt und der Gateway den Turn-Status besitzt. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Nativer/Client-Raum | Nur-Admin-Raummodus für vertrauenswürdige First-Party-Oberflächen, die Gateway-Tool-Aktionen direkt ausführen.     |

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

Das vereinheitlichte Steuerungsvokabular ist ebenfalls absichtlich schmal:

  | Methode                         | Gilt für                                                | Vertrag                                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Hängt einen base64-kodierten PCM-Audio-Chunk an die Provider-Sitzung an, die derselben Gateway-Verbindung gehört.                                                                                         |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Startet einen Benutzer-Turn in einem verwalteten Raum.                                                                                                                                                    |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Beendet den aktiven Turn nach der Validierung auf veraltete Turns.                                                                                                                                        |
  | `talk.session.cancelTurn`       | alle Gateway-eigenen Sitzungen                          | Bricht aktive Erfassungs-/Provider-/Agent-/TTS-Arbeit für einen Turn ab.                                                                                                                                  |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Stoppt die Audioausgabe des Assistenten, ohne den Benutzer-Turn zwingend zu beenden.                                                                                                                      |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Schließt einen vom Relay ausgegebenen Provider-Tool-Aufruf ab; übergeben Sie `options.willContinue` für Zwischenausgabe oder `options.suppressResponse`, um den Aufruf ohne weitere Assistentenantwort zu erfüllen. |
  | `talk.session.steer`            | agentengestützte Talk-Sitzungen                         | Sendet gesprochene `status`-, `steer`-, `cancel`- oder `followup`-Steuerung an den aktiven eingebetteten Lauf, der aus der Talk-Sitzung aufgelöst wurde.                                                   |
  | `talk.session.close`            | alle vereinheitlichten Sitzungen                        | Stoppt Relay-Sitzungen oder widerruft den Zustand des verwalteten Raums und vergisst anschließend die vereinheitlichte Sitzungs-ID.                                                                        |

  Führen Sie keine Provider- oder Plattform-Sonderfälle im Core ein, damit dies funktioniert.
  Core besitzt die Semantik von Talk-Sitzungen. Provider-Plugins besitzen die Einrichtung von Vendor-Sitzungen.
  Sprachanrufe und Google Meet besitzen Telefonie-/Meeting-Adapter. Browser- und native
  Apps besitzen die UX für Geräteerfassung/-wiedergabe.

  ## Kompatibilitätsrichtlinie

  Für externe Plugins folgt Kompatibilitätsarbeit dieser Reihenfolge:

  1. den neuen Vertrag hinzufügen
  2. das alte Verhalten über einen Kompatibilitätsadapter angeschlossen halten
  3. eine Diagnose oder Warnung ausgeben, die den alten Pfad und den Ersatz nennt
  4. beide Pfade in Tests abdecken
  5. die Deprecation und den Migrationspfad dokumentieren
  6. erst nach dem angekündigten Migrationsfenster entfernen, üblicherweise in einem Major-Release

  Maintainer können die aktuelle Migrationswarteschlange mit
  `pnpm plugins:boundary-report` prüfen. Verwenden Sie `pnpm plugins:boundary-report:summary` für
  kompakte Zählungen, `--owner <id>` für ein Plugin oder einen Kompatibilitäts-Owner und
  `pnpm plugins:boundary-report:ci`, wenn ein CI-Gate bei fälligen
  Kompatibilitätseinträgen, ownerübergreifenden reservierten SDK-Importen oder ungenutzten reservierten SDK-
  Unterpfaden fehlschlagen soll. Der Bericht gruppiert veraltete
  Kompatibilitätseinträge nach Entfernungsdatum, zählt lokale Code-/Dokumentationsreferenzen,
  zeigt ownerübergreifende reservierte SDK-Importe an und fasst die private
  Memory-Host-SDK-Bridge zusammen, damit Kompatibilitätsbereinigung explizit bleibt, statt
  sich auf Ad-hoc-Suchen zu verlassen. Reservierte SDK-Unterpfade müssen nachverfolgte Owner-Nutzung haben;
  ungenutzte reservierte Helper-Exporte sollten aus dem öffentlichen SDK entfernt werden.

  Wenn ein Manifestfeld noch akzeptiert wird, können Plugin-Autoren es weiter verwenden, bis
  Dokumentation und Diagnosen etwas anderes sagen. Neuer Code sollte den dokumentierten
  Ersatz bevorzugen, aber bestehende Plugins sollten während gewöhnlicher Minor-
  Releases nicht brechen.

  ## Migration

  <Steps>
  <Step title="Runtime-Hilfsfunktionen zum Laden/Schreiben der Konfiguration migrieren">
    Gebündelte Plugins sollten
    `api.runtime.config.loadConfig()` und
    `api.runtime.config.writeConfigFile(...)` nicht mehr direkt aufrufen. Bevorzugen Sie Konfiguration, die
    bereits in den aktiven Aufrufpfad übergeben wurde. Langlebige Handler, die den
    aktuellen Prozess-Snapshot benötigen, können `api.runtime.config.current()` verwenden. Langlebige
    Agent-Tools sollten den `ctx.getRuntimeConfig()` des Tool-Kontexts innerhalb von
    `execute` verwenden, damit ein Tool, das vor einem Konfigurationsschreibvorgang erstellt wurde, trotzdem die aktualisierte
    Runtime-Konfiguration sieht.

    Konfigurationsschreibvorgänge müssen über die transaktionalen Helper laufen und eine
    Richtlinie nach dem Schreiben auswählen:

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
    Nachbereitung besitzt und den Reload-Planer bewusst unterdrücken möchte.
    Mutationsergebnisse enthalten eine typisierte `followUp`-Zusammenfassung für Tests und Logging;
    der Gateway bleibt dafür verantwortlich, den Neustart anzuwenden oder zu planen.
    `loadConfig` und `writeConfigFile` bleiben während des Migrationsfensters als veraltete Kompatibilitäts-
    Helper für externe Plugins erhalten und warnen einmal mit
    dem Kompatibilitätscode `runtime-config-load-write`. Gebündelte Plugins und Repo-
    Runtime-Code werden durch Scanner-Leitplanken in
    `pnpm check:deprecated-api-usage` und
    `pnpm check:no-runtime-action-load-config` geschützt: neue Produktions-Plugin-Nutzung
    schlägt direkt fehl, direkte Konfigurationsschreibvorgänge schlagen fehl, Gateway-Servermethoden müssen
    den Runtime-Snapshot der Anfrage verwenden, Runtime-Channel-Sende-/Action-/Client-Helper
    müssen Konfiguration von ihrer Grenze erhalten, und langlebige Runtime-Module haben
    null erlaubte ambiente `loadConfig()`-Aufrufe.

    Neuer Plugin-Code sollte außerdem den Import des breiten Kompatibilitäts-Barrels
    `openclaw/plugin-sdk/config-runtime` vermeiden. Verwenden Sie den schmalen
    SDK-Unterpfad, der zur Aufgabe passt:

    | Bedarf | Import |
    | --- | --- |
    | Konfigurationstypen wie `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Bereits geladene Konfigurationszusicherungen und Plugin-Entry-Konfigurationssuche | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lesezugriffe auf den aktuellen Runtime-Snapshot | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Konfigurationsschreibvorgänge | `openclaw/plugin-sdk/config-mutation` |
    | Sitzungsspeicher-Helper | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown-Tabellenkonfiguration | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtime-Helper für Gruppenrichtlinien | `openclaw/plugin-sdk/runtime-group-policy` |
    | Auflösung geheimer Eingaben | `openclaw/plugin-sdk/secret-input-runtime` |
    | Modell-/Sitzungsüberschreibungen | `openclaw/plugin-sdk/model-session-runtime` |

    Gebündelte Plugins und ihre Tests werden durch Scanner gegen das breite
    Barrel geschützt, damit Importe und Mocks lokal für das benötigte Verhalten bleiben. Das breite
    Barrel existiert weiterhin für externe Kompatibilität, aber neuer Code sollte nicht
    davon abhängen.

  </Step>

  <Step title="Eingebettete Tool-Ergebnis-Erweiterungen zu Middleware migrieren">
    Gebündelte Plugins müssen nur für eingebettete Runner vorgesehene
    `api.registerEmbeddedExtensionFactory(...)`-Tool-Ergebnis-Handler durch
    runtime-neutrale Middleware ersetzen.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Aktualisieren Sie gleichzeitig das Plugin-Manifest:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Installierte Plugins können ebenfalls Tool-Ergebnis-Middleware registrieren, wenn sie
    explizit aktiviert sind und jede Ziel-Runtime in
    `contracts.agentToolResultMiddleware` deklarieren. Nicht deklarierte installierte Middleware-
    Registrierungen werden abgelehnt.

  </Step>

  <Step title="Approval-native Handler zu Capability-Fakten migrieren">
    Approval-fähige Channel-Plugins stellen natives Approval-Verhalten jetzt über
    `approvalCapability.nativeRuntime` plus die gemeinsame Runtime-Kontext-Registry bereit.

    Wichtige Änderungen:

    - Ersetzen Sie `approvalCapability.handler.loadRuntime(...)` durch
      `approvalCapability.nativeRuntime`
    - Verschieben Sie Approval-spezifische Authentifizierung/Zustellung von der Legacy-Verkabelung `plugin.auth` /
      `plugin.approvals` auf `approvalCapability`
    - `ChannelPlugin.approvals` wurde aus dem öffentlichen Channel-Plugin-
      Vertrag entfernt; verschieben Sie Zustellungs-/native-/Render-Felder auf `approvalCapability`
    - `plugin.auth` bleibt nur für Channel-Login-/Logout-Flows; Approval-Auth-
      Hooks dort werden nicht mehr vom Core gelesen
    - Registrieren Sie channel-eigene Runtime-Objekte wie Clients, Tokens oder Bolt-
      Apps über `openclaw/plugin-sdk/channel-runtime-context`
    - Senden Sie keine plugin-eigenen Umleitungsbenachrichtigungen aus nativen Approval-Handlern;
      Core besitzt jetzt anderweitig geroutete Benachrichtigungen aus tatsächlichen Zustellungsergebnissen
    - Wenn Sie `channelRuntime` an `createChannelManager(...)` übergeben, stellen Sie eine
      echte `createPluginRuntime().channel`-Oberfläche bereit. Partielle Stubs werden abgelehnt.

    Siehe `/plugins/sdk-channel-plugins` für das aktuelle Approval-Capability-
    Layout.

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

    Wenn Ihr Aufrufer sich nicht bewusst auf Shell-Fallback verlässt, setzen Sie
    `allowShellFallback` nicht und behandeln Sie stattdessen den ausgelösten Fehler.

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

    Verwenden Sie für hostseitige Helper die injizierte Plugin-Runtime, statt
    direkt zu importieren:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Dasselbe Muster gilt für andere ältere Bridge-Helfer:

    | Alter Import | Moderne Entsprechung |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | Session-Store-Helfer | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` besteht für externe
    Kompatibilität weiterhin, neuer Code sollte jedoch die fokussierte Helferoberfläche importieren, die er
    tatsächlich benötigt:

    | Bedarf | Import |
    | --- | --- |
    | Helfer für die Systemereigniswarteschlange | `openclaw/plugin-sdk/system-event-runtime` |
    | Helfer für Heartbeat-Wecken, -Ereignisse und -Sichtbarkeit | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Leeren der Warteschlange ausstehender Zustellungen | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetrie für Kanalaktivität | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-Memory-Dedupe-Caches | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helfer für sichere lokale Datei-/Medienpfade | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-bewusstes Fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy- und geschützte Fetch-Helfer | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF-Dispatcher-Richtlinientypen | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typen für Genehmigungsanforderung/-auflösung | `openclaw/plugin-sdk/approval-runtime` |
    | Helfer für Genehmigungsantwort-Payload und -Befehle | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helfer zur Fehlerformatierung | `openclaw/plugin-sdk/error-runtime` |
    | Wartevorgänge für Transportbereitschaft | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helfer für sichere Tokens | `openclaw/plugin-sdk/secure-random-runtime` |
    | Begrenzte Nebenläufigkeit asynchroner Aufgaben | `openclaw/plugin-sdk/concurrency-runtime` |
    | Numerische Koersion | `openclaw/plugin-sdk/number-runtime` |
    | Prozesslokale asynchrone Sperre | `openclaw/plugin-sdk/async-lock-runtime` |
    | Dateisperren | `openclaw/plugin-sdk/file-lock` |

    Gebündelte Plugins sind durch Scanner gegen `infra-runtime` geschützt, sodass Repo-Code
    nicht zum breiten Barrel-Modul zurückfallen kann.

  </Step>

  <Step title="Migrate channel route helpers">
    Neuer Kanalrouten-Code sollte `openclaw/plugin-sdk/channel-route` verwenden.
    Die älteren Namen für Route-Key und Comparable-Target bleiben während des Migrationsfensters als Kompatibilitätsaliase
    erhalten, neue Plugins sollten jedoch die Routennamen verwenden,
    die das Verhalten direkt beschreiben:

    | Alter Helfer | Moderner Helfer |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Die modernen Routenhelfer normalisieren `{ channel, to, accountId, threadId }`
    konsistent über native Genehmigungen, Antwortunterdrückung, eingehende Deduplizierung,
    Cron-Zustellung und Sitzungsrouting hinweg.

    Fügen Sie keine neuen Verwendungen von `ChannelMessagingAdapter.parseExplicitTarget` oder
    den parsergestützten Loaded-Route-Helfern (`parseExplicitTargetForLoadedChannel`
    oder `resolveRouteTargetForLoadedChannel`) oder
    `resolveChannelRouteTargetWithParser(...)` aus `plugin-sdk/channel-route` hinzu.
    Diese Hooks sind veraltet und bleiben nur für ältere Plugins während des
    Migrationsfensters erhalten. Neue Kanal-Plugins sollten
    `messaging.targetResolver.resolveTarget(...)` für die Normalisierung von Ziel-IDs
    und den Fallback bei fehlendem Verzeichnistreffer verwenden, `messaging.inferTargetChatType(...)`, wenn Core
    frühzeitig eine Peer-Art benötigt, und `messaging.resolveOutboundSessionRoute(...)`
    für Provider-native Sitzungs- und Thread-Identität.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Importpfadreferenz

  <Accordion title="Common import path table">
  | Importpfad | Zweck | Wichtige Exporte |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonischer Plugin-Einstiegshelfer | `definePluginEntry` |
  | `plugin-sdk/core` | Veralteter zusammenfassender Re-Export für Channel-Einstiegsdefinitionen/-Builder | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export des Root-Konfigurationsschemas | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Einstiegshelfer für einzelne Provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Fokussierte Channel-Einstiegsdefinitionen und Builder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gemeinsame Helfer für den Einrichtungsassistenten | Einrichtungsübersetzer, Allowlist-Eingabeaufforderungen, Builder für Einrichtungsstatus |
  | `plugin-sdk/setup-runtime` | Runtime-Helfer für die Einrichtung | `createSetupTranslator`, importsichere Adapter für Einrichtungspatches, Helfer für Lookup-Hinweise, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Einrichtungsproxys |
  | `plugin-sdk/setup-adapter-runtime` | Veralteter Alias für den Einrichtungsadapter | `plugin-sdk/setup-runtime` verwenden |
  | `plugin-sdk/setup-tools` | Helfer für Einrichtungswerkzeuge | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helfer für mehrere Konten | Helfer für Kontoliste/Konfiguration/Aktions-Gate |
  | `plugin-sdk/account-id` | Helfer für Konto-IDs | `DEFAULT_ACCOUNT_ID`, Normalisierung von Konto-IDs |
  | `plugin-sdk/account-resolution` | Helfer für Kontosuche | Helfer für Kontosuche + Standard-Fallback |
  | `plugin-sdk/account-helpers` | Enge Kontohelfer | Helfer für Kontoliste/Kontoaktionen |
  | `plugin-sdk/channel-setup` | Adapter für den Einrichtungsassistenten | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM-Kopplungsprimitive | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Verdrahtung für Antwortpräfix, Tippen und Quellzustellung | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Konfigurationsadapter-Factories und DM-Zugriffshelfer | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Builder für Konfigurationsschemas | Gemeinsame Primitive für Channel-Konfigurationsschemas und nur der generische Builder |
  | `plugin-sdk/bundled-channel-config-schema` | Gebündelte Konfigurationsschemas | Nur von OpenClaw gepflegte gebündelte Plugins; neue Plugins müssen Plugin-lokale Schemas definieren |
  | `plugin-sdk/channel-config-schema-legacy` | Veraltete gebündelte Konfigurationsschemas | Nur Kompatibilitätsalias; für gepflegte gebündelte Plugins `plugin-sdk/bundled-channel-config-schema` verwenden |
  | `plugin-sdk/telegram-command-config` | Helfer für Telegram-Befehlskonfiguration | Normalisierung von Befehlsnamen, Kürzen von Beschreibungen, Validierung auf Duplikate/Konflikte |
  | `plugin-sdk/channel-policy` | Auflösung von Gruppen-/DM-Richtlinien | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Veraltete Kompatibilitätsfassade | `plugin-sdk/channel-outbound` verwenden |
  | `plugin-sdk/inbound-envelope` | Helfer für eingehende Umschläge | Gemeinsame Helfer für Routen- und Umschlag-Builder |
  | `plugin-sdk/channel-inbound` | Helfer für eingehenden Empfang | Kontextaufbau, Formatierung, Roots, Runner, vorbereiteter Antwortversand und Versandprädikate |
  | `plugin-sdk/messaging-targets` | Veralteter Importpfad für Zielparsing | Verwenden Sie `plugin-sdk/channel-targets` für generische Helfer zum Zielparsing, `plugin-sdk/channel-route` für Routenvergleich und Plugin-eigene `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` für Provider-spezifische Zielauflösung |
  | `plugin-sdk/outbound-media` | Helfer für ausgehende Medien | Gemeinsames Laden ausgehender Medien |
  | `plugin-sdk/outbound-send-deps` | Veraltete Kompatibilitätsfassade | `plugin-sdk/channel-outbound` verwenden |
  | `plugin-sdk/channel-outbound` | Helfer für den Lebenszyklus ausgehender Nachrichten | Nachrichtenadapter, Belege, Helfer für dauerhaftes Senden, Helfer für Live-Vorschau/Streaming, Antwortoptionen, Lebenszyklushelfer, ausgehende Identität und Payload-Planung |
  | `plugin-sdk/channel-streaming` | Veraltete Kompatibilitätsfassade | `plugin-sdk/channel-outbound` verwenden |
  | `plugin-sdk/outbound-runtime` | Veraltete Kompatibilitätsfassade | `plugin-sdk/channel-outbound` verwenden |
  | `plugin-sdk/thread-bindings-runtime` | Thread-Binding-Helfer | Lebenszyklus- und Adapterhelfer für Thread-Bindings |
  | `plugin-sdk/agent-media-payload` | Helfer für veraltete Medien-Payloads | Builder für Agent-Medien-Payloads für veraltete Feldlayouts |
  | `plugin-sdk/channel-runtime` | Veralteter Kompatibilitäts-Shim | Nur veraltete Channel-Runtime-Dienstprogramme |
  | `plugin-sdk/channel-send-result` | Typen für Sendeergebnisse | Typen für Antwortergebnisse |
  | `plugin-sdk/runtime-store` | Persistenter Plugin-Speicher | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Breite Runtime-Helfer | Helfer für Runtime/Logging/Backup/Plugin-Installation |
  | `plugin-sdk/runtime-env` | Enge Helfer für Runtime-Umgebung | Helfer für Logger/Runtime-Umgebung, Timeout, Wiederholung und Backoff |
  | `plugin-sdk/plugin-runtime` | Gemeinsame Plugin-Runtime-Helfer | Helfer für Plugin-Befehle/Hooks/HTTP/Interaktion |
  | `plugin-sdk/hook-runtime` | Helfer für Hook-Pipelines | Gemeinsame Helfer für Webhook/interne Hook-Pipelines |
  | `plugin-sdk/lazy-runtime` | Lazy-Runtime-Helfer | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Prozesshelfer | Gemeinsame Exec-Helfer |
  | `plugin-sdk/cli-runtime` | CLI-Runtime-Helfer | Befehlsformatierung, Wartevorgänge, Versionshelfer |
  | `plugin-sdk/gateway-runtime` | Gateway-Helfer | Gateway-Client, startbereiter Helfer für die Ereignisschleife und Helfer für Channel-Status-Patches |
  | `plugin-sdk/config-runtime` | Veralteter Shim für Konfigurationskompatibilität | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` und `config-mutation` bevorzugen |
  | `plugin-sdk/telegram-command-config` | Helfer für Telegram-Befehle | Fallback-stabile Helfer zur Validierung von Telegram-Befehlen, wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
  | `plugin-sdk/approval-runtime` | Helfer für Genehmigungsaufforderungen | Exec/Plugin-Genehmigungs-Payload, Helfer für Genehmigungsfähigkeit/-profil, native Genehmigungsrouting-/Runtime-Helfer und formatierte strukturierte Anzeige-Pfadformatierung für Genehmigungen |
  | `plugin-sdk/approval-auth-runtime` | Helfer für Genehmigungsauthentifizierung | Auflösung von Genehmigenden, Aktionsauthentifizierung im selben Chat |
  | `plugin-sdk/approval-client-runtime` | Helfer für Genehmigungsclients | Native Exec-Genehmigungsprofil-/Filterhelfer |
  | `plugin-sdk/approval-delivery-runtime` | Helfer für Genehmigungszustellung | Native Adapter für Genehmigungsfähigkeit/-zustellung |
  | `plugin-sdk/approval-gateway-runtime` | Helfer für Genehmigungs-Gateway | Gemeinsamer Helfer zur Auflösung des Genehmigungs-Gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helfer für Genehmigungsadapter | Leichtgewichtige Ladehelfer für native Genehmigungsadapter für Hot-Channel-Einstiegspunkte |
  | `plugin-sdk/approval-handler-runtime` | Helfer für Genehmigungshandler | Breitere Runtime-Helfer für Genehmigungshandler; bevorzugen Sie die engeren Adapter-/Gateway-Schnittstellen, wenn sie ausreichen |
  | `plugin-sdk/approval-native-runtime` | Helfer für Genehmigungsziele | Native Helfer für Bindung von Genehmigungsziel/Konto |
  | `plugin-sdk/approval-reply-runtime` | Helfer für Genehmigungsantworten | Helfer für Exec/Plugin-Genehmigungsantwort-Payloads |
  | `plugin-sdk/channel-runtime-context` | Helfer für Channel-Runtime-Kontext | Generische Helfer zum Registrieren/Abrufen/Beobachten von Channel-Runtime-Kontexten |
  | `plugin-sdk/security-runtime` | Sicherheitshelfer | Gemeinsame Helfer für Vertrauen, DM-Gating, root-begrenzte Datei-/Pfadzugriffe, externe Inhalte und Secret-Erfassung |
  | `plugin-sdk/ssrf-policy` | Helfer für SSRF-Richtlinien | Helfer für Host-Allowlist- und Private-Network-Richtlinien |
  | `plugin-sdk/ssrf-runtime` | SSRF-Runtime-Helfer | Helfer für gepinnte Dispatcher, geschütztes Fetch und SSRF-Richtlinien |
  | `plugin-sdk/system-event-runtime` | Helfer für Systemereignisse | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat-Helfer | Helfer für Heartbeat-Wecken, -Ereignisse und -Sichtbarkeit |
  | `plugin-sdk/delivery-queue-runtime` | Helfer für Zustellwarteschlangen | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helfer für Channel-Aktivität | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Dedupe-Helfer | In-Memory-Dedupe-Caches |
  | `plugin-sdk/file-access-runtime` | Helfer für Dateizugriff | Sichere Helfer für lokale Datei-/Medienpfade |
  | `plugin-sdk/transport-ready-runtime` | Helfer für Transportbereitschaft | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Helfer für Exec-Genehmigungsrichtlinien | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Helfer für begrenzte Caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helfer für Diagnose-Gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helfer für Fehlerformatierung | `formatUncaughtError`, `isApprovalNotFoundError`, Helfer für Fehlergraphen |
  | `plugin-sdk/fetch-runtime` | Helfer für umschlossenes Fetch/Proxy | `resolveFetch`, Proxy-Helfer, Optionshelfer für EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Helfer für Host-Normalisierung | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Wiederholungshelfer | `RetryConfig`, `retryAsync`, Richtlinien-Runner |
  | `plugin-sdk/allow-from` | Allowlist-Formatierung und Eingabezuordnung | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Befehls-Gating und Helfer für Befehlsoberflächen | `resolveControlCommandGate`, Helfer für Absenderautorisierung, Befehlsregistrierungshelfer einschließlich Formatierung dynamischer Argumentmenüs |
  | `plugin-sdk/command-status` | Renderer für Befehlsstatus/-hilfe | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing von Secret-Eingaben | Helfer für Secret-Eingaben |
  | `plugin-sdk/webhook-ingress` | Helfer für Webhook-Anfragen | Webhook-Zieldienstprogramme |
  | `plugin-sdk/webhook-request-guards` | Helfer für Webhook-Body-Guards | Helfer für Lesen/Begrenzen von Request-Bodys |
  | `plugin-sdk/reply-runtime` | Gemeinsame Antwort-Runtime | Eingehender Versand, Heartbeat, Antwortplaner, Chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Enge Helfer für Antwortversand | Finalisierung, Provider-Versand und Helfer für Konversationslabels |
  | `plugin-sdk/reply-history` | Helfer für Antwortverlauf | `createChannelHistoryWindow`; veraltete Kompatibilitätsexporte für Map-Helfer wie `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planung von Antwortreferenzen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helfer für Antwort-Chunks | Helfer für Text-/Markdown-Chunking |
  | `plugin-sdk/session-store-runtime` | Helfer für Sitzungsspeicher | Helfer für Speicherpfad + updated-at |
  | `plugin-sdk/state-paths` | Helfer für Statuspfade | Helfer für Status- und OAuth-Verzeichnisse |
  | `plugin-sdk/routing` | Routing-/Session-Key-Helfer | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, Helfer zur Session-Key-Normalisierung |
  | `plugin-sdk/status-helpers` | Helfer für Kanalstatus | Builder für Kanal-/Kontostatus-Zusammenfassungen, Runtime-State-Defaults, Helfer für Issue-Metadaten |
  | `plugin-sdk/target-resolver-runtime` | Helfer für Zielauflöser | Gemeinsame Helfer für Zielauflöser |
  | `plugin-sdk/string-normalization-runtime` | Helfer für String-Normalisierung | Helfer für Slug-/String-Normalisierung |
  | `plugin-sdk/request-url` | Helfer für Request-URLs | String-URLs aus request-artigen Eingaben extrahieren |
  | `plugin-sdk/run-command` | Helfer für zeitgesteuerte Befehle | Zeitgesteuerter Befehls-Runner mit normalisiertem stdout/stderr |
  | `plugin-sdk/param-readers` | Parameterleser | Gemeinsame Tool-/CLI-Parameterleser |
  | `plugin-sdk/tool-payload` | Tool-Payload-Extraktion | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
  | `plugin-sdk/tool-send` | Tool-Send-Extraktion | Kanonische Send-Zielfelder aus Tool-Argumenten extrahieren |
  | `plugin-sdk/temp-path` | Helfer für temporäre Pfade | Gemeinsame Helfer für temporäre Download-Pfade |
  | `plugin-sdk/logging-core` | Logging-Helfer | Subsystem-Logger und Redaction-Helfer |
  | `plugin-sdk/markdown-table-runtime` | Markdown-Tabellen-Helfer | Helfer für Markdown-Tabellenmodi |
  | `plugin-sdk/reply-payload` | Nachrichtenantworttypen | Antwort-Payload-Typen |
  | `plugin-sdk/provider-setup` | Kuratierte Helfer für lokale/self-hosted Provider-Einrichtung | Discovery-/Konfigurationshelfer für self-hosted Provider |
  | `plugin-sdk/self-hosted-provider-setup` | Fokussierte OpenAI-kompatible Helfer für self-hosted Provider-Einrichtung | Dieselben Discovery-/Konfigurationshelfer für self-hosted Provider |
  | `plugin-sdk/provider-auth-runtime` | Helfer für Provider-Runtime-Authentifizierung | Helfer zur Runtime-Auflösung von API-Keys |
  | `plugin-sdk/provider-auth-api-key` | Helfer für Provider-API-Key-Einrichtung | Helfer für API-Key-Onboarding/Profilschreibung |
  | `plugin-sdk/provider-auth-result` | Helfer für Provider-Auth-Ergebnisse | Standard-Builder für OAuth-Auth-Ergebnisse |
  | `plugin-sdk/provider-selection-runtime` | Helfer für Provider-Auswahl | Konfigurierte-oder-automatische Provider-Auswahl und Zusammenführung von Roh-Provider-Konfigurationen |
  | `plugin-sdk/provider-env-vars` | Helfer für Provider-Umgebungsvariablen | Helfer zum Nachschlagen von Provider-Auth-Umgebungsvariablen |
  | `plugin-sdk/provider-model-shared` | Gemeinsame Helfer für Provider-Modell/Replay | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Replay-Policy-Builder, Provider-Endpoint-Helfer und Helfer zur Modell-ID-Normalisierung |
  | `plugin-sdk/provider-catalog-shared` | Gemeinsame Helfer für Provider-Kataloge | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Provider-Onboarding-Patches | Helfer für Onboarding-Konfiguration |
  | `plugin-sdk/provider-http` | Provider-HTTP-Helfer | Generische Helfer für Provider-HTTP-/Endpoint-Fähigkeiten, einschließlich multipart-form-Helfern für Audio-Transkription |
  | `plugin-sdk/provider-web-fetch` | Provider-Web-Fetch-Helfer | Helfer für Web-Fetch-Provider-Registrierung/-Cache |
  | `plugin-sdk/provider-web-search-config-contract` | Helfer für Provider-Web-Search-Konfiguration | Schmale Web-Search-Konfigurations-/Credential-Helfer für Provider, die keine Plugin-Aktivierungsverdrahtung benötigen |
  | `plugin-sdk/provider-web-search-contract` | Helfer für Provider-Web-Search-Contract | Schmale Web-Search-Konfigurations-/Credential-Contract-Helfer wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsgebundene Credential-Setter/-Getter |
  | `plugin-sdk/provider-web-search` | Provider-Web-Search-Helfer | Helfer für Web-Search-Provider-Registrierung/-Cache/-Runtime |
  | `plugin-sdk/provider-tools` | Helfer für Provider-Tool-/Schema-Kompatibilität | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` und DeepSeek/Gemini/OpenAI-Schema-Bereinigung + Diagnostik |
  | `plugin-sdk/provider-usage` | Helfer für Provider-Nutzung | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` und weitere Helfer für Provider-Nutzung |
  | `plugin-sdk/provider-stream` | Helfer für Provider-Stream-Wrapper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot-Wrapper-Helfer |
  | `plugin-sdk/provider-transport-runtime` | Helfer für Provider-Transport | Native Provider-Transport-Helfer wie geschützter Fetch, Tool-Result-Text-Extraktion, Transport-Nachrichtentransformationen und schreibbare Transport-Event-Streams |
  | `plugin-sdk/keyed-async-queue` | Geordnete Async-Queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gemeinsame Medienhelfer | Helfer für Medienabruf/-transformation/-speicherung, ffprobe-gestützte Prüfung von Videodimensionen und Medien-Payload-Builder |
  | `plugin-sdk/media-generation-runtime` | Gemeinsame Mediengenerierungshelfer | Gemeinsame Failover-Helfer, Kandidatenauswahl und Meldungen zu fehlenden Modellen für Bild-/Video-/Musikgenerierung |
  | `plugin-sdk/media-understanding` | Helfer für Medienverständnis | Provider-Typen für Medienverständnis plus providerseitige Exporte für Bild-/Audio-Helfer |
  | `plugin-sdk/text-runtime` | Veralteter breiter Texkompatibilitäts-Export | Verwenden Sie `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` und `logging-core` |
  | `plugin-sdk/text-chunking` | Helfer für Textsegmentierung | Helfer für ausgehende Textsegmentierung |
  | `plugin-sdk/speech` | Speech-Helfer | Speech-Provider-Typen plus providerseitige Directive-, Registry- und Validierungshelfer sowie OpenAI-kompatibler TTS-Builder |
  | `plugin-sdk/speech-core` | Gemeinsamer Speech-Kern | Speech-Provider-Typen, Registry, Directives, Normalisierung |
  | `plugin-sdk/realtime-transcription` | Helfer für Echtzeittranskription | Provider-Typen, Registry-Helfer und gemeinsamer WebSocket-Session-Helfer |
  | `plugin-sdk/realtime-voice` | Helfer für Echtzeitstimme | Provider-Typen, Registry-/Auflösungshelfer, Bridge-Session-Helfer, gemeinsame Agent-Talkback-Queues, Sprachsteuerung aktiver Runs, Transcript-/Event-Health, Echo-Unterdrückung, Zuordnung von Rückfragefragen, Koordination erzwungener Rückfragen, Turn-Context-Tracking, Output-Aktivitätsverfolgung und schnelle Kontext-Rückfragehelfer |
  | `plugin-sdk/image-generation` | Bildgenerierungshelfer | Bildgenerierungs-Provider-Typen plus Helfer für Bildassets/Daten-URLs und OpenAI-kompatibler Bild-Provider-Builder |
  | `plugin-sdk/image-generation-core` | Gemeinsamer Bildgenerierungskern | Bildgenerierungstypen, Failover, Auth und Registry-Helfer |
  | `plugin-sdk/music-generation` | Musikgenerierungshelfer | Typen für Musikgenerierungs-Provider/-Request/-Result |
  | `plugin-sdk/music-generation-core` | Gemeinsamer Musikgenerierungskern | Musikgenerierungstypen, Failover-Helfer, Provider-Lookup und Model-Ref-Parsing |
  | `plugin-sdk/video-generation` | Videogenerierungshelfer | Typen für Videogenerierungs-Provider/-Request/-Result |
  | `plugin-sdk/video-generation-core` | Gemeinsamer Videogenerierungskern | Videogenerierungstypen, Failover-Helfer, Provider-Lookup und Model-Ref-Parsing |
  | `plugin-sdk/interactive-runtime` | Interaktive Antworthelfer | Normalisierung/Reduktion interaktiver Antwort-Payloads |
  | `plugin-sdk/channel-config-primitives` | Channel-Konfigurationsprimitive | Schmale Channel-Konfigurationsschema-Primitive |
  | `plugin-sdk/channel-config-writes` | Helfer für Channel-Konfigurationsschreibvorgänge | Autorisierungshelfer für Channel-Konfigurationsschreibvorgänge |
  | `plugin-sdk/channel-plugin-common` | Gemeinsames Channel-Prelude | Gemeinsame Exporte für Channel-Plugin-Prelude |
  | `plugin-sdk/channel-status` | Helfer für Channel-Status | Gemeinsame Helfer für Channel-Status-Snapshots/-Zusammenfassungen |
  | `plugin-sdk/allowlist-config-edit` | Allowlist-Konfigurationshelfer | Helfer zum Bearbeiten/Lesen von Allowlist-Konfiguration |
  | `plugin-sdk/group-access` | Helfer für Gruppenzugriff | Gemeinsame Entscheidungshelfer für Gruppenzugriff |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Veraltete Kompatibilitätsfassaden | Verwenden Sie `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Direct-DM-Guard-Helfer | Schmale Pre-Crypto-Guard-Policy-Helfer |
  | `plugin-sdk/extension-shared` | Gemeinsame Erweiterungshelfer | Primitive für Passive-Channel-/Status- und Ambient-Proxy-Helfer |
  | `plugin-sdk/webhook-targets` | Webhook-Zielhelfer | Webhook-Ziel-Registry und Route-Installationshelfer |
  | `plugin-sdk/webhook-path` | Veralteter Webhook-Pfad-Alias | Verwenden Sie `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Gemeinsame Webmedienhelfer | Helfer zum Laden remote/lokaler Medien |
  | `plugin-sdk/zod` | Veralteter Zod-Kompatibilitäts-Re-Export | Importieren Sie `zod` direkt aus `zod` |
  | `plugin-sdk/memory-core` | Gebündelte Memory-Core-Helfer | Memory-Manager-/Konfigurations-/Datei-/CLI-Hilfsoberfläche |
  | `plugin-sdk/memory-core-engine-runtime` | Memory-Engine-Runtime-Fassade | Memory-Index-/Such-Runtime-Fassade |
  | `plugin-sdk/memory-core-host-embedding-registry` | Memory-Embedding-Registry | Leichtgewichtige Helfer für Memory-Embedding-Provider-Registry |
  | `plugin-sdk/memory-core-host-engine-foundation` | Memory-Host-Foundation-Engine | Exporte für Memory-Host-Foundation-Engine |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Memory-Host-Embedding-Engine | Memory-Embedding-Contracts, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Helfer; konkrete Remote-Provider leben in ihren besitzenden Plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | Memory-Host-QMD-Engine | Exporte für Memory-Host-QMD-Engine |
  | `plugin-sdk/memory-core-host-engine-storage` | Memory-Host-Storage-Engine | Exporte für Memory-Host-Storage-Engine |
  | `plugin-sdk/memory-core-host-multimodal` | Memory-Host-Multimodal-Helfer | Memory-Host-Multimodal-Helfer |
  | `plugin-sdk/memory-core-host-query` | Memory-Host-Query-Helfer | Memory-Host-Query-Helfer |
  | `plugin-sdk/memory-core-host-secret` | Memory-Host-Secret-Helfer | Memory-Host-Secret-Helfer |
  | `plugin-sdk/memory-core-host-events` | Veralteter Memory-Event-Alias | Verwenden Sie `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Memory-Host-Status-Helfer | Memory-Host-Status-Helfer |
  | `plugin-sdk/memory-core-host-runtime-cli` | Memory-Host-CLI-Runtime | Memory-Host-CLI-Runtime-Helfer |
  | `plugin-sdk/memory-core-host-runtime-core` | Memory-Host-Core-Runtime | Memory-Host-Core-Runtime-Helfer |
  | `plugin-sdk/memory-core-host-runtime-files` | Memory-Host-Datei-/Runtime-Helfer | Memory-Host-Datei-/Runtime-Helfer |
  | `plugin-sdk/memory-host-core` | Alias für Memory-Host-Core-Runtime | Vendor-neutraler Alias für Memory-Host-Core-Runtime-Helfer |
  | `plugin-sdk/memory-host-events` | Alias für Memory-Host-Event-Journal | Vendor-neutraler Alias für Memory-Host-Event-Journal-Helfer |
  | `plugin-sdk/memory-host-files` | Veralteter Memory-Datei-/Runtime-Alias | Verwenden Sie `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Managed-Markdown-Helfer | Gemeinsame Managed-Markdown-Helfer für memory-nahe Plugins |
  | `plugin-sdk/memory-host-search` | Active-Memory-Suchfassade | Lazy Active-Memory-Search-Manager-Runtime-Fassade |
  | `plugin-sdk/memory-host-status` | Veralteter Memory-Host-Status-Alias | Verwenden Sie `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Testhilfsprogramme | Repo-lokales, veraltetes Kompatibilitäts-Barrel; verwenden Sie fokussierte repo-lokale Test-Unterpfade wie `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` und `plugin-sdk/test-fixtures` |
</Accordion>

Diese Tabelle ist bewusst die gemeinsame Migrations-Teilmenge, nicht die vollständige SDK-
Oberfläche. Das Inventar des Compiler-Einstiegspunkts liegt in
`scripts/lib/plugin-sdk-entrypoints.json`; Paket-Exporte werden aus der
öffentlichen Teilmenge generiert.

Reservierte Helper-Seams für gebündelte Plugins wurden aus der öffentlichen SDK-
Export-Map entfernt, außer ausdrücklich dokumentierten Kompatibilitäts-Fassaden wie dem
veralteten `plugin-sdk/discord`-Shim, das für das veröffentlichte Paket
`@openclaw/discord@2026.3.13` beibehalten wird. Ownerspezifische Helper liegen im
jeweils verantwortlichen Plugin-Paket; gemeinsam genutztes Host-Verhalten sollte über generische SDK-
Verträge wie `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`
und `plugin-sdk/plugin-config-runtime` laufen.

Verwenden Sie den engsten Import, der zur Aufgabe passt. Wenn Sie keinen Export finden,
prüfen Sie die Quelle unter `src/plugin-sdk/` oder fragen Sie die Maintainer, welcher generische Vertrag
dafür zuständig sein sollte.

## Aktive Deprecations

Engere Deprecations, die für das Plugin-SDK, den Provider-Vertrag,
die Runtime-Oberfläche und das Manifest gelten. Jede davon funktioniert heute noch, wird aber
in einem zukünftigen Major-Release entfernt. Der Eintrag unter jedem Punkt ordnet die alte API ihrem
kanonischen Ersatz zu.

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **Alt (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Neu (`openclaw/plugin-sdk/command-status`)**: gleiche Signaturen, gleiche
    Exporte - nur aus dem engeren Unterpfad importiert. `command-auth`
    re-exportiert sie als Kompatibilitäts-Stubs.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **Alt**: `resolveInboundMentionRequirement({ facts, policy })` und
    `shouldDropInboundForMention(...)` aus
    `openclaw/plugin-sdk/channel-inbound` oder
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Neu**: `resolveInboundMentionDecision({ facts, policy })` - gibt ein
    einzelnes Entscheidungsobjekt zurück statt zweier getrennter Aufrufe.

    Nachgelagerte Channel-Plugins (Slack, Discord, Matrix, MS Teams) haben bereits
    umgestellt.

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` ist ein Kompatibilitäts-Shim für ältere
    Channel-Plugins. Importieren Sie ihn nicht aus neuem Code; verwenden Sie
    `openclaw/plugin-sdk/channel-runtime-context` zum Registrieren von Runtime-
    Objekten.

    `channelActions*`-Helper in `openclaw/plugin-sdk/channel-actions` sind
    zusammen mit rohen „actions“-Channel-Exporten veraltet. Stellen Sie Capabilities
    stattdessen über die semantische `presentation`-Oberfläche bereit - Channel-Plugins
    deklarieren, was sie rendern (Karten, Buttons, Auswahlfelder), statt welche rohen
    Aktionsnamen sie akzeptieren.

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **Alt**: `tool()`-Factory aus `openclaw/plugin-sdk/provider-web-search`.

    **Neu**: Implementieren Sie `createTool(...)` direkt im Provider-Plugin.
    OpenClaw benötigt den SDK-Helper nicht mehr, um den Tool-Wrapper zu registrieren.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **Alt**: `formatInboundEnvelope(...)` (und
    `ChannelMessageForAgent.channelEnvelope`) zum Erstellen eines flachen Plaintext-Prompt-
    Envelopes aus eingehenden Channel-Nachrichten.

    **Neu**: `BodyForAgent` plus strukturierte User-Context-Blöcke. Channel-
    Plugins hängen Routing-Metadaten (Thread, Topic, Reply-to, Reaktionen) als
    typisierte Felder an, statt sie zu einem Prompt-String zusammenzufügen. Der
    Helper `formatAgentEnvelope(...)` wird weiterhin für synthetisierte,
    assistant-seitige Envelopes unterstützt, aber eingehende Plaintext-Envelopes werden
    auslaufen.

    Betroffene Bereiche: `inbound_claim`, `message_received` und jedes benutzerdefinierte
    Channel-Plugin, das `channelEnvelope`-Text nachverarbeitet hat.

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **Alt**: `api.on("deactivate", handler)`.

    **Neu**: `api.on("gateway_stop", handler)`. Event und Kontext sind derselbe
    Shutdown-Cleanup-Vertrag; nur der Hook-Name ändert sich.

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

    `deactivate` bleibt bis nach dem 2026-08-16 als veralteter
    Kompatibilitäts-Alias verdrahtet.

  </Accordion>

  <Accordion title="subagent_spawning hook → core thread binding">
    **Alt**: `api.on("subagent_spawning", handler)` mit Rückgabe von
    `threadBindingReady` oder `deliveryOrigin`.

    **Neu**: Lassen Sie Core `thread: true`-Subagent-Bindings über den
    Session-Binding-Adapter des Channels vorbereiten. Verwenden Sie
    `api.on("subagent_spawned", handler)` nur für Beobachtung nach dem Start.

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
    `PluginHookSubagentSpawningResult` und
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` bleiben nur als
    veraltete Kompatibilitäts-Oberflächen bestehen, während externe Plugins migrieren.

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    Vier Discovery-Typaliases sind jetzt dünne Wrapper über die
    Catalog-Ära-Typen:

    | Alter Alias               | Neuer Typ                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Dazu kommt der alte statische `ProviderCapabilities`-Container - Provider-Plugins
    sollten explizite Provider-Hooks wie `buildReplayPolicy`,
    `normalizeToolSchemas` und `wrapStreamFn` verwenden statt eines statischen Objekts.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **Alt** (drei getrennte Hooks auf `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` und
    `resolveDefaultThinkingLevel(ctx)`.

    **Neu**: ein einzelnes `resolveThinkingProfile(ctx)`, das ein
    `ProviderThinkingProfile` mit der kanonischen `id`, optionalem `label` und
    gerankter Level-Liste zurückgibt. OpenClaw stuft veraltete gespeicherte Werte
    automatisch anhand des Profil-Rangs herunter.

    Der Kontext enthält `provider`, `modelId`, optional zusammengeführte `reasoning`-
    Fakten und optional zusammengeführte Modell-`compat`-Fakten. Provider-Plugins können diese
    Katalogfakten verwenden, um ein modellspezifisches Profil nur dann bereitzustellen, wenn der konfigurierte
    Request-Vertrag es unterstützt.

    Implementieren Sie einen Hook statt drei. Die Legacy-Hooks funktionieren während
    des Deprecation-Fensters weiterhin, werden aber nicht mit dem Profilergebnis kombiniert.

  </Accordion>

  <Accordion title="External auth providers → contracts.externalAuthProviders">
    **Alt**: externe Auth-Hooks implementieren, ohne den Provider
    im Plugin-Manifest zu deklarieren.

    **Neu**: Deklarieren Sie `contracts.externalAuthProviders` im Plugin-Manifest
    **und** implementieren Sie `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    **Altes** Manifestfeld: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Neu**: Spiegeln Sie dieselbe Env-Var-Suche in `setup.providers[].envVars`
    im Manifest. Das konsolidiert Setup-/Status-Env-Metadaten an einem
    Ort und vermeidet, die Plugin-Runtime nur für Env-Var-
    Suchen zu starten.

    `providerAuthEnvVars` bleibt über einen Kompatibilitätsadapter unterstützt,
    bis das Deprecation-Fenster schließt.

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **Alt**: drei getrennte Aufrufe -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Neu**: ein Aufruf auf der Memory-State-API -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Gleiche Slots, ein einzelner Registrierungsaufruf. Additive Prompt- und Corpus-Helper
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) sind
    nicht betroffen.

  </Accordion>

  <Accordion title="Memory embedding provider API">
    **Alt**: `api.registerMemoryEmbeddingProvider(...)` plus
    `contracts.memoryEmbeddingProviders`.

    **Neu**: `api.registerEmbeddingProvider(...)` plus
    `contracts.embeddingProviders`.

    Der generische Embedding-Provider-Vertrag ist außerhalb von Memory wiederverwendbar und ist
    der unterstützte Pfad für neue Provider. Die memory-spezifische Registrierungs-API
    bleibt als veraltete Kompatibilität verdrahtet, während bestehende Provider migrieren.
    Plugin-Inspektion meldet nicht gebündelte Nutzung als Kompatibilitätsschuld.

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    Zwei Legacy-Typaliases werden weiterhin aus `src/plugins/runtime/types.ts` exportiert:

    | Alt                           | Neu                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Die Runtime-Methode `readSession` ist zugunsten von
    `getSessionMessages` veraltet. Gleiche Signatur; die alte Methode ruft die
    neue durch.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Alt**: `runtime.tasks.flow` (Singular) gab einen Live-TaskFlow-Accessor zurück.

    **Neu**: `runtime.tasks.managedFlows` behält die Managed-TaskFlow-Mutations-
    Runtime für Plugins bei, die Child-Tasks aus einem Flow erstellen, aktualisieren,
    abbrechen oder ausführen. Verwenden Sie `runtime.tasks.flows`, wenn das Plugin nur
    DTO-basierte Lesezugriffe benötigt.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    Oben unter „So migrieren Sie → Eingebettete Tool-Result-Extensions zu
    Middleware migrieren“ behandelt. Der Vollständigkeit halber hier aufgenommen: Der entfernte, nur für den Embedded Runner vorgesehene
    Pfad `api.registerEmbeddedExtensionFactory(...)` wird durch
    `api.registerAgentToolResultMiddleware(...)` mit einer expliziten Runtime-
    Liste in `contracts.agentToolResultMiddleware` ersetzt.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
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
Deprecations auf Extension-Ebene (innerhalb gebündelter Channel-/Provider-Plugins unter
`extensions/`) werden in deren eigenen `api.ts`- und `runtime-api.ts`-
Barrels nachverfolgt. Sie betreffen keine Drittanbieter-Plugin-Verträge und sind hier nicht
aufgeführt. Wenn Sie das lokale Barrel eines gebündelten Plugins direkt konsumieren, lesen Sie vor dem
Upgrade die Deprecation-Kommentare in diesem Barrel.
</Note>

## Zeitplan für die Entfernung

| Wann                   | Was passiert                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Jetzt**              | Veraltete Schnittstellen geben Laufzeitwarnungen aus                    |
| **Nächstes Major-Release** | Veraltete Schnittstellen werden entfernt; Plugins, die sie noch verwenden, schlagen fehl |

Alle Core-Plugins wurden bereits migriert. Externe Plugins sollten vor dem
nächsten Major-Release migrieren.

## Warnungen vorübergehend unterdrücken

Setzen Sie diese Umgebungsvariablen, während Sie an der Migration arbeiten:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dies ist eine vorübergehende Ausweichmöglichkeit, keine dauerhafte Lösung.

## Verwandte Themen

- [Erste Schritte](/de/plugins/building-plugins) - erstellen Sie Ihr erstes Plugin
- [SDK-Überblick](/de/plugins/sdk-overview) - vollständige Referenz für Subpath-Imports
- [Channel-Plugins](/de/plugins/sdk-channel-plugins) - Channel-Plugins erstellen
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) - Provider-Plugins erstellen
- [Plugin-Interna](/de/plugins/architecture) - ausführlicher Architekturüberblick
- [Plugin-Manifest](/de/plugins/manifest) - Referenz zum Manifest-Schema
