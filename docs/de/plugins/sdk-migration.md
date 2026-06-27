---
read_when:
    - Sie sehen die Warnung OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Sie sehen die Warnung OPENCLAW_EXTENSION_API_DEPRECATED
    - Sie haben api.registerEmbeddedExtensionFactory vor OpenClaw 2026.4.25 verwendet
    - Sie aktualisieren ein Plugin auf die moderne Plugin-Architektur
    - Sie pflegen ein externes OpenClaw-Plugin
sidebarTitle: Migrate to SDK
summary: Von der alten Abwärtskompatibilitätsschicht zum modernen Plugin-SDK migrieren
title: Plugin-SDK-Migration
x-i18n:
    generated_at: "2026-06-27T17:58:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9061b31567cbd24196458ecb9af1cb1b0351f789a136ea26951c8fb7e576cf08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw ist von einer breiten Rückwärtskompatibilitätsschicht zu einer modernen Plugin-
Architektur mit gezielten, dokumentierten Imports gewechselt. Wenn Ihr Plugin vor
der neuen Architektur erstellt wurde, hilft Ihnen dieser Leitfaden bei der Migration.

## Was sich ändert

Das alte Plugin-System stellte zwei sehr offene Oberflächen bereit, über die Plugins
alles, was sie benötigten, aus einem einzigen Einstiegspunkt importieren konnten:

- **`openclaw/plugin-sdk/compat`** - ein einzelner Import, der Dutzende von
  Hilfsfunktionen erneut exportierte. Er wurde eingeführt, damit ältere Hook-basierte
  Plugins weiter funktionieren, während die neue Plugin-Architektur gebaut wurde.
- **`openclaw/plugin-sdk/infra-runtime`** - ein breites Barrel für Runtime-Hilfsfunktionen, das
  Systemereignisse, Heartbeat-Zustand, Zustellwarteschlangen, Fetch-/Proxy-Hilfen,
  Datei-Hilfen, Approval-Typen und nicht zusammenhängende Dienstprogramme vermischte.
- **`openclaw/plugin-sdk/config-runtime`** - ein breites Barrel für Config-Kompatibilität,
  das während des Migrationsfensters noch veraltete direkte Lade-/Schreibhilfen enthält.
- **`openclaw/extension-api`** - eine Brücke, die Plugins direkten Zugriff auf
  hostseitige Hilfen wie den eingebetteten Agent Runner gab.
- **`api.registerEmbeddedExtensionFactory(...)`** - ein entfernter, nur für den eingebetteten Runner
  bestimmter Hook für mitgelieferte Plugins, der Ereignisse des eingebetteten Runners wie
  `tool_result` beobachten konnte.

Die breiten Import-Oberflächen sind jetzt **veraltet**. Sie funktionieren zur Laufzeit
weiterhin, aber neue Plugins dürfen sie nicht verwenden, und bestehende Plugins sollten vor
dem nächsten Major Release migrieren, in dem sie entfernt werden. Die nur für den eingebetteten
Runner bestimmte API zur Registrierung von Extension Factories wurde entfernt; verwenden Sie stattdessen Tool-result-Middleware.

OpenClaw entfernt oder interpretiert dokumentiertes Plugin-Verhalten nicht in derselben
Änderung neu, die einen Ersatz einführt. Breaking Contract Changes müssen zuerst
über einen Kompatibilitätsadapter, Diagnosen, Dokumentation und ein Deprecation-Fenster laufen.
Das gilt für SDK-Imports, Manifest-Felder, Setup-APIs, Hooks und das
Runtime-Registrierungsverhalten.

<Warning>
  Die Rückwärtskompatibilitätsschicht wird in einem zukünftigen Major Release entfernt.
  Plugins, die weiterhin aus diesen Oberflächen importieren, werden dann nicht mehr funktionieren.
  Legacy-Registrierungen eingebetteter Extension Factories werden bereits nicht mehr geladen.
</Warning>

## Warum sich das geändert hat

Der alte Ansatz verursachte Probleme:

- **Langsamer Start** - das Importieren einer Hilfsfunktion lud Dutzende nicht zusammenhängender Module
- **Zirkuläre Abhängigkeiten** - breite Re-Exports machten es leicht, Import-Zyklen zu erzeugen
- **Unklare API-Oberfläche** - es war nicht erkennbar, welche Exports stabil und welche intern waren

Das moderne Plugin-SDK behebt dies: Jeder Importpfad (`openclaw/plugin-sdk/\<subpath\>`)
ist ein kleines, eigenständiges Modul mit einem klaren Zweck und einem dokumentierten Vertrag.

Legacy-Komfortschnittstellen für Provider bei mitgelieferten Channels sind ebenfalls entfernt.
Channel-gebrandete Hilfsschnittstellen waren private Abkürzungen im Mono-Repo, keine stabilen
Plugin-Verträge. Verwenden Sie stattdessen schmale generische SDK-Unterpfade. Innerhalb des mitgelieferten
Plugin-Workspace sollten Provider-eigene Hilfen im jeweiligen `api.ts` oder
`runtime-api.ts` des Plugins bleiben.

Aktuelle Beispiele für mitgelieferte Provider:

- Anthropic hält Claude-spezifische Stream-Hilfen in seiner eigenen `api.ts` /
  `contract-api.ts`-Schnittstelle
- OpenAI hält Provider-Builder, Hilfen für Standardmodelle und Realtime-Provider-
  Builder in seiner eigenen `api.ts`
- OpenRouter hält Provider-Builder und Onboarding-/Config-Hilfen in seiner eigenen
  `api.ts`

## Migrationsplan für Talk und Echtzeit-Sprache

Realtime Voice-, Telefonie-, Meeting- und Browser-Talk-Code wird von
oberflächenlokaler Turn-Buchhaltung zu einem gemeinsamen Talk Session Controller verschoben, der von
`openclaw/plugin-sdk/realtime-voice` exportiert wird. Der neue Controller besitzt den gemeinsamen Talk-
Event-Umschlag, den aktiven Turn-Zustand, den Capture-Zustand, den Output-Audio-Zustand, den aktuellen
Ereignisverlauf und die Zurückweisung veralteter Turns. Provider-Plugins sollten weiterhin
anbieterspezifische Realtime-Sessions besitzen; Oberflächen-Plugins sollten weiterhin Capture,
Wiedergabe, Telefonie- und Meeting-Besonderheiten besitzen.

Diese Talk-Migration ist absichtlich sauber brechend:

1. Behalten Sie die gemeinsamen Controller-/Runtime-Primitiven in
   `plugin-sdk/realtime-voice`.
2. Verschieben Sie mitgelieferte Oberflächen auf den gemeinsamen Controller: Browser Relay,
   Managed-Room-Handoff, Voice-Call-Realtime, Voice-Call-Streaming-STT, Google
   Meet Realtime und natives Push-to-Talk.
3. Ersetzen Sie alte Talk-RPC-Familien durch die endgültige `talk.session.*`- und
   `talk.client.*`-API.
4. Kündigen Sie einen Live-Talk-Event-Channel in Gateway
   `hello-ok.features.events` an: `talk.event`.
5. Löschen Sie den alten Realtime-HTTP-Endpunkt und jeden Pfad für Instruction-
   Overrides zur Request-Zeit.

Neuer Code sollte `createTalkEventSequencer(...)` nicht direkt aufrufen, es sei denn, er
implementiert einen Low-Level-Adapter oder eine Test-Fixture. Bevorzugen Sie den gemeinsamen Controller,
damit turn-bezogene Ereignisse nicht ohne Turn-ID ausgegeben werden können, veraltete `turnEnd`- /
`turnCancel`-Aufrufe keinen neueren aktiven Turn löschen können und Output-Audio-Lifecycle-
Ereignisse über Telefonie, Meetings, Browser Relay, Managed-Room-
Handoff und native Talk-Clients hinweg konsistent bleiben.

Die Zielgestalt der öffentlichen API ist:

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
weil der Browser die Provider-Aushandlung und den Medientransport besitzt, während das
Gateway Credentials, Instructions und Tool-Policy besitzt. `talk.session.*` ist die
gemeinsame Gateway-verwaltete Oberfläche für Gateway-Relay-Realtime, Gateway-Relay-
Transkription und Managed-Room-native STT-/TTS-Sessions.

Legacy-Configs, die Realtime-Selektoren neben `talk.provider` /
`talk.providers` platziert haben, sollten mit `openclaw doctor --fix` repariert werden; Runtime Talk
interpretiert Speech-/TTS-Provider-Config nicht als Realtime-Provider-Config neu.

Die unterstützten `talk.session.create`-Kombinationen sind absichtlich klein:

| Modus           | Transport       | Brain           | Verantwortlich     | Hinweise                                                                                                           |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Full-Duplex-Provider-Audio wird über das Gateway gebrückt; Tool-Aufrufe werden über das Agent-Consult-Tool geroutet. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Nur Streaming-STT; Aufrufer senden Eingabe-Audio und empfangen Transkript-Ereignisse.                              |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | Push-to-Talk- und Walkie-Talkie-artige Räume, in denen der Client Capture/Wiedergabe besitzt und das Gateway den Turn-Zustand besitzt. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Admin-only-Raummodus für vertrauenswürdige First-Party-Oberflächen, die Gateway-Tool-Aktionen direkt ausführen.    |

Zuordnung entfernter Methoden:

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

Das vereinheitlichte Kontrollvokabular ist ebenfalls bewusst schmal:

  | Methode                         | Gilt für                                                | Vertrag                                                                                                                                                                                                                              |
  | ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Hängt einen Base64-PCM-Audio-Chunk an die Provider-Sitzung an, die derselben Gateway-Verbindung gehört.                                                                                                                              |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Startet einen Benutzer-Turn in einem verwalteten Raum.                                                                                                                                                                               |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Beendet den aktiven Turn nach der Validierung veralteter Turns.                                                                                                                                                                      |
  | `talk.session.cancelTurn`       | alle Gateway-eigenen Sitzungen                          | Bricht aktive Erfassungs-, Provider-, Agent- und TTS-Arbeit für einen Turn ab.                                                                                                                                                       |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Stoppt die Audioausgabe des Assistenten, ohne den Benutzer-Turn zwingend zu beenden.                                                                                                                                                 |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Schließt einen vom Relay ausgegebenen Provider-Toolaufruf ab; übergeben Sie `options.willContinue` für Zwischenausgabe oder `options.suppressResponse`, um den Aufruf ohne weitere Assistentenantwort zu erfüllen.                  |
  | `talk.session.steer`            | agentengestützte Talk-Sitzungen                         | Sendet gesprochene `status`-, `steer`-, `cancel`- oder `followup`-Steuerung an den aktiven eingebetteten Lauf, der aus der Talk-Sitzung aufgelöst wurde.                                                                             |
  | `talk.session.close`            | alle vereinheitlichten Sitzungen                        | Stoppt Relay-Sitzungen oder widerruft den Status eines verwalteten Raums und vergisst anschließend die vereinheitlichte Sitzungs-ID.                                                                                                  |

  Führen Sie keine Provider- oder Plattform-Sonderfälle im Core ein, damit dies funktioniert.
  Core besitzt die Semantik von Talk-Sitzungen. Provider-Plugins besitzen die Einrichtung von Vendor-Sitzungen.
  Voice-call und Google Meet besitzen Telefonie-/Meeting-Adapter. Browser und native
  Apps besitzen die UX für Geräteerfassung/-wiedergabe.

  ## Kompatibilitätsrichtlinie

  Für externe Plugins folgt Kompatibilitätsarbeit dieser Reihenfolge:

  1. den neuen Vertrag hinzufügen
  2. das alte Verhalten über einen Kompatibilitätsadapter weiter verdrahten
  3. eine Diagnose oder Warnung ausgeben, die den alten Pfad und den Ersatz nennt
  4. beide Pfade in Tests abdecken
  5. die Veraltung und den Migrationspfad dokumentieren
  6. erst nach dem angekündigten Migrationsfenster entfernen, üblicherweise in einem Major-Release

  Maintainer können die aktuelle Migrationswarteschlange mit
  `pnpm plugins:boundary-report` prüfen. Verwenden Sie `pnpm plugins:boundary-report:summary` für
  kompakte Zählwerte, `--owner <id>` für ein einzelnes Plugin oder einen Kompatibilitäts-Owner und
  `pnpm plugins:boundary-report:ci`, wenn ein CI-Gate bei fälligen
  Kompatibilitätsdatensätzen, ownerübergreifenden reservierten SDK-Imports oder ungenutzten reservierten SDK-
  Unterpfaden fehlschlagen soll. Der Bericht gruppiert veraltete
  Kompatibilitätsdatensätze nach Entfernungsdatum, zählt lokale Code-/Dokumentationsreferenzen,
  zeigt ownerübergreifende reservierte SDK-Imports an und fasst die private
  Memory-Host-SDK-Bridge zusammen, damit Kompatibilitätsbereinigung explizit bleibt, statt
  sich auf Ad-hoc-Suchen zu verlassen. Reservierte SDK-Unterpfade müssen nachverfolgte Owner-Nutzung haben;
  ungenutzte reservierte Hilfsexporte sollten aus dem öffentlichen SDK entfernt werden.

  Wenn ein Manifestfeld weiterhin akzeptiert wird, können Plugin-Autoren es weiter verwenden, bis
  Dokumentation und Diagnosen etwas anderes sagen. Neuer Code sollte den dokumentierten
  Ersatz bevorzugen, aber bestehende Plugins sollten bei normalen Minor-
  Releases nicht brechen.

  ## Migration

  <Steps>
  <Step title="Lade-/Schreibhelfer für Laufzeitkonfiguration migrieren">
    Gebündelte Plugins sollten aufhören,
    `api.runtime.config.loadConfig()` und
    `api.runtime.config.writeConfigFile(...)` direkt aufzurufen. Bevorzugen Sie Konfiguration, die
    bereits in den aktiven Aufrufpfad übergeben wurde. Langlebige Handler, die den
    aktuellen Prozess-Snapshot benötigen, können `api.runtime.config.current()` verwenden. Langlebige
    Agent-Tools sollten innerhalb von
    `execute` `ctx.getRuntimeConfig()` aus dem Tool-Kontext verwenden, damit ein vor einem Konfigurationsschreibvorgang erstelltes Tool weiterhin die aktualisierte
    Laufzeitkonfiguration sieht.

    Konfigurationsschreibvorgänge müssen über die transaktionalen Helfer laufen und eine
    Nach-Schreib-Richtlinie wählen:

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
    Nacharbeit besitzt und den Reload-Planer bewusst unterdrücken möchte.
    Mutationsergebnisse enthalten eine typisierte `followUp`-Zusammenfassung für Tests und Logging;
    das Gateway bleibt dafür verantwortlich, den Neustart anzuwenden oder zu planen.
    `loadConfig` und `writeConfigFile` bleiben während des Migrationsfensters als veraltete Kompatibilitäts-
    helfer für externe Plugins erhalten und warnen einmal mit
    dem Kompatibilitätscode `runtime-config-load-write`. Gebündelte Plugins und Repo-
    Laufzeitcode werden durch Scanner-Leitplanken in
    `pnpm check:deprecated-api-usage` und
    `pnpm check:no-runtime-action-load-config` geschützt: neue Produktions-Plugin-Nutzung
    schlägt direkt fehl, direkte Konfigurationsschreibvorgänge schlagen fehl, Gateway-Servermethoden müssen
    den Request-Laufzeit-Snapshot verwenden, Runtime-Channel-Send-/Action-/Client-Helfer
    müssen Konfiguration von ihrer Boundary erhalten, und langlebige Laufzeitmodule haben
    null erlaubte ambient `loadConfig()`-Aufrufe.

    Neuer Plugin-Code sollte auch den Import des breiten
    Kompatibilitäts-Barrels `openclaw/plugin-sdk/config-runtime` vermeiden. Verwenden Sie den engen
    SDK-Unterpfad, der zur Aufgabe passt:

    | Bedarf | Import |
    | --- | --- |
    | Konfigurationstypen wie `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Bereits geladene Konfigurations-Assertions und Plugin-Entry-Konfigurationssuche | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lesezugriffe auf den aktuellen Laufzeit-Snapshot | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Konfigurationsschreibvorgänge | `openclaw/plugin-sdk/config-mutation` |
    | Sitzungs-Store-Helfer | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown-Tabellenkonfiguration | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Laufzeithelfer für Gruppenrichtlinien | `openclaw/plugin-sdk/runtime-group-policy` |
    | Auflösung geheimer Eingaben | `openclaw/plugin-sdk/secret-input-runtime` |
    | Modell-/Sitzungs-Overrides | `openclaw/plugin-sdk/model-session-runtime` |

    Gebündelte Plugins und ihre Tests werden per Scanner gegen das breite
    Barrel abgesichert, damit Imports und Mocks lokal zu dem Verhalten bleiben, das sie benötigen. Das breite
    Barrel existiert weiterhin für externe Kompatibilität, aber neuer Code sollte nicht
    davon abhängen.

  </Step>

  <Step title="Eingebettete Tool-Ergebnis-Erweiterungen zu Middleware migrieren">
    Gebündelte Plugins müssen nur für den eingebetteten Runner bestimmte
    `api.registerEmbeddedExtensionFactory(...)`-Tool-Ergebnis-Handler durch
    laufzeitneutrale Middleware ersetzen.

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
    explizit aktiviert sind und jede Ziel-Laufzeit in
    `contracts.agentToolResultMiddleware` deklarieren. Nicht deklarierte installierte Middleware-
    Registrierungen werden abgelehnt.

  </Step>

  <Step title="Native Approval-Handler zu Capability-Fakten migrieren">
    Approval-fähige Channel-Plugins stellen natives Approval-Verhalten jetzt über
    `approvalCapability.nativeRuntime` plus die gemeinsame Laufzeitkontext-Registry bereit.

    Wichtige Änderungen:

    - Ersetzen Sie `approvalCapability.handler.loadRuntime(...)` durch
      `approvalCapability.nativeRuntime`
    - Verschieben Sie Approval-spezifische Auth-/Delivery-Logik von der alten `plugin.auth`- /
      `plugin.approvals`-Verdrahtung auf `approvalCapability`
    - `ChannelPlugin.approvals` wurde aus dem öffentlichen Channel-Plugin-
      Vertrag entfernt; verschieben Sie Delivery-/Native-/Render-Felder auf `approvalCapability`
    - `plugin.auth` bleibt nur für Channel-Login-/Logout-Flows erhalten; Approval-Auth-
      Hooks dort werden vom Core nicht mehr gelesen
    - Registrieren Sie channel-eigene Laufzeitobjekte wie Clients, Tokens oder Bolt-
      Apps über `openclaw/plugin-sdk/channel-runtime-context`
    - Senden Sie keine plugin-eigenen Umleitungsmitteilungen aus nativen Approval-Handlern;
      Core besitzt jetzt anderweitig geroutete Mitteilungen aus tatsächlichen Delivery-Ergebnissen
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

    Wenn Ihr Aufrufer nicht absichtlich auf Shell-Fallback angewiesen ist, setzen Sie
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

    Verwenden Sie für hostseitige Helfer die injizierte Plugin-Laufzeit, statt
    direkt zu importieren:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Dasselbe Muster gilt für andere Legacy-Bridge-Hilfsfunktionen:

    | Alter Import | Moderne Entsprechung |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | Session-Store-Hilfsfunktionen | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` existiert aus Gründen der externen
    Kompatibilität weiterhin, neuer Code sollte jedoch die fokussierte
    Hilfsoberfläche importieren, die er tatsächlich benötigt:

    | Bedarf | Import |
    | --- | --- |
    | Hilfsfunktionen für die Systemereignis-Warteschlange | `openclaw/plugin-sdk/system-event-runtime` |
    | Hilfsfunktionen für Heartbeat-Wake, Ereignisse und Sichtbarkeit | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Abarbeitung der ausstehenden Zustellungswarteschlange | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetrie für Kanalaktivität | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-Memory-Dedupe-Caches | `openclaw/plugin-sdk/dedupe-runtime` |
    | Sichere Hilfsfunktionen für lokale Datei-/Medienpfade | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-bewusstes Fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Hilfsfunktionen für Proxy und geschütztes Fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF-Dispatcher-Policy-Typen | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typen für Genehmigungsanfragen/-auflösungen | `openclaw/plugin-sdk/approval-runtime` |
    | Hilfsfunktionen für Genehmigungsantwort-Payload und Befehle | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Hilfsfunktionen für Fehlerformatierung | `openclaw/plugin-sdk/error-runtime` |
    | Wartefunktionen für Transportbereitschaft | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Hilfsfunktionen für sichere Tokens | `openclaw/plugin-sdk/secure-random-runtime` |
    | Begrenzte Nebenläufigkeit für asynchrone Aufgaben | `openclaw/plugin-sdk/concurrency-runtime` |
    | Numerische Umwandlung | `openclaw/plugin-sdk/number-runtime` |
    | Prozesslokaler asynchroner Lock | `openclaw/plugin-sdk/async-lock-runtime` |
    | Datei-Locks | `openclaw/plugin-sdk/file-lock` |

    Bundled Plugins werden per Scanner gegen `infra-runtime` abgesichert, sodass
    Repo-Code nicht zum breiten Barrel zurückfallen kann.

  </Step>

  <Step title="Migrate channel route helpers">
    Neuer Kanalrouten-Code sollte `openclaw/plugin-sdk/channel-route` verwenden.
    Die älteren Namen für Route-Key und Comparable-Target bleiben während des
    Migrationsfensters als Kompatibilitätsaliase erhalten, neue Plugins sollten
    jedoch die Routennamen verwenden, die das Verhalten direkt beschreiben:

    | Alte Hilfsfunktion | Moderne Hilfsfunktion |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Die modernen Routen-Hilfsfunktionen normalisieren `{ channel, to, accountId, threadId }`
    konsistent über native Genehmigungen, Antwortunterdrückung, eingehende Deduplizierung,
    Cron-Zustellung und Sitzungsrouting hinweg.

    Fügen Sie keine neuen Verwendungen von `ChannelMessagingAdapter.parseExplicitTarget`,
    der parsergestützten Loaded-Route-Hilfsfunktionen (`parseExplicitTargetForLoadedChannel`
    oder `resolveRouteTargetForLoadedChannel`) oder
    `resolveChannelRouteTargetWithParser(...)` aus `plugin-sdk/channel-route` hinzu.
    Diese Hooks sind veraltet und bleiben nur für ältere Plugins während des
    Migrationsfensters bestehen. Neue Kanal-Plugins sollten
    `messaging.targetResolver.resolveTarget(...)` für Ziel-ID-Normalisierung
    und Fallback bei Directory-Miss, `messaging.inferTargetChatType(...)`, wenn Core
    früh eine Peer-Art benötigt, und `messaging.resolveOutboundSessionRoute(...)`
    für provider-native Sitzungs- und Thread-Identität verwenden.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Importpfad-Referenz

  <Accordion title="Tabelle der gängigen Importpfade">
  | Importpfad | Zweck | Wichtige Exporte |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonische Plugin-Entry-Hilfsfunktion | `definePluginEntry` |
  | `plugin-sdk/core` | Veralteter Sammel-Re-Export für Channel-Entry-Definitionen/-Builder | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export des Root-Konfigurationsschemas | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Entry-Hilfsfunktion für einzelne Provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Fokussierte Channel-Entry-Definitionen und -Builder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gemeinsame Hilfsfunktionen für den Einrichtungsassistenten | Setup-Übersetzer, Allowlist-Prompts, Builder für den Einrichtungsstatus |
  | `plugin-sdk/setup-runtime` | Runtime-Hilfsfunktionen zur Einrichtungszeit | `createSetupTranslator`, importsichere Setup-Patch-Adapter, Lookup-Notiz-Hilfsfunktionen, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Setup-Proxys |
  | `plugin-sdk/setup-adapter-runtime` | Veralteter Setup-Adapter-Alias | Verwenden Sie `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Hilfsfunktionen für Setup-Werkzeuge | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Hilfsfunktionen für mehrere Konten | Hilfsfunktionen für Kontolisten, Konfiguration und Aktions-Gates |
  | `plugin-sdk/account-id` | Hilfsfunktionen für Konto-IDs | `DEFAULT_ACCOUNT_ID`, Normalisierung von Konto-IDs |
  | `plugin-sdk/account-resolution` | Hilfsfunktionen für Kontosuche | Hilfsfunktionen für Kontosuche und Standard-Fallbacks |
  | `plugin-sdk/account-helpers` | Schmale Konto-Hilfsfunktionen | Hilfsfunktionen für Kontolisten und Kontoaktionen |
  | `plugin-sdk/channel-setup` | Adapter für den Einrichtungsassistenten | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM-Pairing-Primitiven | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Verkabelung von Antwortpräfix, Tippen und Quellzustellung | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabriken für Konfigurationsadapter und Hilfsfunktionen für DM-Zugriff | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Builder für Konfigurationsschemas | Nur gemeinsame Primitiven für Channel-Konfigurationsschemas und der generische Builder |
  | `plugin-sdk/bundled-channel-config-schema` | Gebündelte Konfigurationsschemas | Nur von OpenClaw gepflegte gebündelte Plugins; neue Plugins müssen Plugin-lokale Schemas definieren |
  | `plugin-sdk/channel-config-schema-legacy` | Veraltete gebündelte Konfigurationsschemas | Nur Kompatibilitätsalias; verwenden Sie `plugin-sdk/bundled-channel-config-schema` für gepflegte gebündelte Plugins |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für die Telegram-Befehlskonfiguration | Normalisierung von Befehlsnamen, Kürzen von Beschreibungen, Validierung von Duplikaten/Konflikten |
  | `plugin-sdk/channel-policy` | Auflösung von Gruppen-/DM-Richtlinien | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Veraltete Kompatibilitäts-Fassade | Verwenden Sie `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Hilfsfunktionen für eingehende Umschläge | Gemeinsame Hilfsfunktionen für Routen- und Umschlag-Builder |
  | `plugin-sdk/channel-inbound` | Hilfsfunktionen für eingehenden Empfang | Kontextaufbau, Formatierung, Roots, Runner, vorbereitete Antwortzustellung und Dispatch-Prädikate |
  | `plugin-sdk/messaging-targets` | Veralteter Importpfad für Ziel-Parsing | Verwenden Sie `plugin-sdk/channel-targets` für generische Hilfsfunktionen zum Ziel-Parsing, `plugin-sdk/channel-route` für Routenvergleiche und Plugin-eigene `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` für Provider-spezifische Zielauflösung |
  | `plugin-sdk/outbound-media` | Hilfsfunktionen für ausgehende Medien | Gemeinsames Laden ausgehender Medien |
  | `plugin-sdk/outbound-send-deps` | Veraltete Kompatibilitäts-Fassade | Verwenden Sie `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Hilfsfunktionen für den Lebenszyklus ausgehender Nachrichten | Nachrichtenadapter, Empfangsbestätigungen, Hilfsfunktionen für dauerhaftes Senden, Hilfsfunktionen für Live-Vorschau/Streaming, Antwortoptionen, Lebenszyklus-Hilfsfunktionen, ausgehende Identität und Payload-Planung |
  | `plugin-sdk/channel-streaming` | Veraltete Kompatibilitäts-Fassade | Verwenden Sie `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Veraltete Kompatibilitäts-Fassade | Verwenden Sie `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Hilfsfunktionen für Thread-Bindings | Lebenszyklus- und Adapter-Hilfsfunktionen für Thread-Bindings |
  | `plugin-sdk/agent-media-payload` | Hilfsfunktionen für veraltete Medien-Payloads | Builder für Agent-Medien-Payloads für veraltete Feldlayouts |
  | `plugin-sdk/channel-runtime` | Veralteter Kompatibilitäts-Shim | Nur veraltete Channel-Runtime-Werkzeuge |
  | `plugin-sdk/channel-send-result` | Typen für Sendeergebnisse | Typen für Antwortergebnisse |
  | `plugin-sdk/runtime-store` | Persistenter Plugin-Speicher | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Breite Runtime-Hilfsfunktionen | Hilfsfunktionen für Runtime/Logging/Backup/Plugin-Installation |
  | `plugin-sdk/runtime-env` | Schmale Runtime-Env-Hilfsfunktionen | Hilfsfunktionen für Logger/Runtime-Env, Timeout, Retry und Backoff |
  | `plugin-sdk/plugin-runtime` | Gemeinsame Plugin-Runtime-Hilfsfunktionen | Hilfsfunktionen für Plugin-Befehle, Hooks, HTTP und Interaktion |
  | `plugin-sdk/hook-runtime` | Hilfsfunktionen für Hook-Pipelines | Gemeinsame Hilfsfunktionen für Webhook-/interne Hook-Pipelines |
  | `plugin-sdk/lazy-runtime` | Lazy-Runtime-Hilfsfunktionen | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Prozess-Hilfsfunktionen | Gemeinsame Exec-Hilfsfunktionen |
  | `plugin-sdk/cli-runtime` | CLI-Runtime-Hilfsfunktionen | Befehlsformatierung, Wartevorgänge, Versions-Hilfsfunktionen |
  | `plugin-sdk/gateway-runtime` | Gateway-Hilfsfunktionen | Gateway-Client, Start-Hilfsfunktion für Event-Loop-Bereitschaft und Hilfsfunktionen für Channel-Status-Patches |
  | `plugin-sdk/config-runtime` | Veralteter Konfigurations-Kompatibilitäts-Shim | Bevorzugen Sie `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` und `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Hilfsfunktionen für Telegram-Befehle | Fallback-stabile Hilfsfunktionen für die Validierung von Telegram-Befehlen, wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
  | `plugin-sdk/approval-runtime` | Hilfsfunktionen für Genehmigungs-Prompts | Exec-/Plugin-Genehmigungs-Payload, Hilfsfunktionen für Genehmigungsfähigkeit/-profil, native Genehmigungs-Routing-/Runtime-Hilfsfunktionen und strukturierte Formatierung von Genehmigungsanzeigepfaden |
  | `plugin-sdk/approval-auth-runtime` | Hilfsfunktionen für Genehmigungs-Auth | Auflösung von Genehmigenden, Aktions-Auth im selben Chat |
  | `plugin-sdk/approval-client-runtime` | Hilfsfunktionen für Genehmigungsclients | Native Hilfsfunktionen für Exec-Genehmigungsprofile/-filter |
  | `plugin-sdk/approval-delivery-runtime` | Hilfsfunktionen für Genehmigungszustellung | Native Adapter für Genehmigungsfähigkeit/-zustellung |
  | `plugin-sdk/approval-gateway-runtime` | Hilfsfunktionen für Genehmigungs-Gateway | Gemeinsame Hilfsfunktion zur Auflösung des Genehmigungs-Gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Hilfsfunktionen für Genehmigungsadapter | Leichtgewichtige Hilfsfunktionen zum Laden nativer Genehmigungsadapter für heiße Channel-Entrypoints |
  | `plugin-sdk/approval-handler-runtime` | Hilfsfunktionen für Genehmigungs-Handler | Breitere Runtime-Hilfsfunktionen für Genehmigungs-Handler; bevorzugen Sie die schmaleren Adapter-/Gateway-Schnittstellen, wenn sie ausreichen |
  | `plugin-sdk/approval-native-runtime` | Hilfsfunktionen für Genehmigungsziele | Hilfsfunktionen für native Genehmigungsziel-/Kontobindungen |
  | `plugin-sdk/approval-reply-runtime` | Hilfsfunktionen für Genehmigungsantworten | Hilfsfunktionen für Exec-/Plugin-Genehmigungsantwort-Payloads |
  | `plugin-sdk/channel-runtime-context` | Hilfsfunktionen für Channel-Runtime-Kontext | Generische Hilfsfunktionen zum Registrieren/Abrufen/Beobachten von Channel-Runtime-Kontext |
  | `plugin-sdk/security-runtime` | Sicherheits-Hilfsfunktionen | Gemeinsame Hilfsfunktionen für Vertrauen, DM-Gating, root-begrenzte Datei-/Pfadzugriffe, externe Inhalte und Secret-Erfassung |
  | `plugin-sdk/ssrf-policy` | Hilfsfunktionen für SSRF-Richtlinien | Hilfsfunktionen für Host-Allowlists und Richtlinien für private Netzwerke |
  | `plugin-sdk/ssrf-runtime` | SSRF-Runtime-Hilfsfunktionen | Pinned-Dispatcher, geschütztes Fetch, Hilfsfunktionen für SSRF-Richtlinien |
  | `plugin-sdk/system-event-runtime` | Hilfsfunktionen für Systemereignisse | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat-Hilfsfunktionen | Hilfsfunktionen für Heartbeat-Wecken, -Ereignisse und -Sichtbarkeit |
  | `plugin-sdk/delivery-queue-runtime` | Hilfsfunktionen für Zustellungswarteschlangen | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Hilfsfunktionen für Channel-Aktivität | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Dedupe-Hilfsfunktionen | In-Memory-Dedupe-Caches |
  | `plugin-sdk/file-access-runtime` | Hilfsfunktionen für Dateizugriff | Sichere Hilfsfunktionen für lokale Datei-/Medienpfade |
  | `plugin-sdk/transport-ready-runtime` | Hilfsfunktionen für Transportbereitschaft | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Hilfsfunktionen für Exec-Genehmigungsrichtlinien | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Hilfsfunktionen für begrenzte Caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Hilfsfunktionen für Diagnose-Gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Hilfsfunktionen für Fehlerformatierung | `formatUncaughtError`, `isApprovalNotFoundError`, Hilfsfunktionen für Fehlergraphen |
  | `plugin-sdk/fetch-runtime` | Gekapselte Fetch-/Proxy-Hilfsfunktionen | `resolveFetch`, Proxy-Hilfsfunktionen, Hilfsfunktionen für EnvHttpProxyAgent-Optionen |
  | `plugin-sdk/host-runtime` | Hilfsfunktionen für Host-Normalisierung | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Retry-Hilfsfunktionen | `RetryConfig`, `retryAsync`, Richtlinien-Runner |
  | `plugin-sdk/allow-from` | Allowlist-Formatierung und Eingabezuordnung | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Befehls-Gating und Hilfsfunktionen für Befehlsoberflächen | `resolveControlCommandGate`, Hilfsfunktionen für Absenderautorisierung, Hilfsfunktionen für Befehlsregistries einschließlich Formatierung dynamischer Argumentmenüs |
  | `plugin-sdk/command-status` | Renderer für Befehlsstatus/-hilfe | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing von Secret-Eingaben | Hilfsfunktionen für Secret-Eingaben |
  | `plugin-sdk/webhook-ingress` | Hilfsfunktionen für Webhook-Anfragen | Webhook-Zielwerkzeuge |
  | `plugin-sdk/webhook-request-guards` | Hilfsfunktionen für Webhook-Body-Guards | Hilfsfunktionen zum Lesen/Begrenzen von Request-Bodys |
  | `plugin-sdk/reply-runtime` | Gemeinsame Antwort-Runtime | Eingehender Dispatch, Heartbeat, Antwortplaner, Chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Schmale Hilfsfunktionen für Antwort-Dispatch | Finalisierung, Provider-Dispatch und Hilfsfunktionen für Konversationslabels |
  | `plugin-sdk/reply-history` | Hilfsfunktionen für Antwortverlauf | `createChannelHistoryWindow`; veraltete Kompatibilitätsexporte für Map-Hilfsfunktionen wie `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planung von Antwortreferenzen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Hilfsfunktionen für Antwort-Chunks | Hilfsfunktionen für Text-/Markdown-Chunking |
  | `plugin-sdk/session-store-runtime` | Hilfsfunktionen für Sitzungsspeicher | Hilfsfunktionen für Speicherpfade und Aktualisierungszeitpunkte |
  | `plugin-sdk/state-paths` | Hilfsfunktionen für State-Pfade | Hilfsfunktionen für State- und OAuth-Verzeichnisse |
  | `plugin-sdk/routing` | Routing-/Sitzungsschlüssel-Hilfen | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, Hilfen zur Sitzungsschlüssel-Normalisierung |
  | `plugin-sdk/status-helpers` | Hilfen für Kanalstatus | Builder für Kanal-/Kontostatus-Zusammenfassungen, Standardwerte für Runtime-State, Hilfen für Issue-Metadaten |
  | `plugin-sdk/target-resolver-runtime` | Hilfen für Target Resolver | Gemeinsame Hilfen für Target Resolver |
  | `plugin-sdk/string-normalization-runtime` | Hilfen zur String-Normalisierung | Hilfen zur Slug-/String-Normalisierung |
  | `plugin-sdk/request-url` | Hilfen für Request-URLs | String-URLs aus request-ähnlichen Eingaben extrahieren |
  | `plugin-sdk/run-command` | Hilfen für zeitgesteuerte Befehle | Zeitgesteuerter Befehls-Runner mit normalisiertem stdout/stderr |
  | `plugin-sdk/param-readers` | Param-Reader | Gemeinsame Tool-/CLI-Param-Reader |
  | `plugin-sdk/tool-payload` | Extraktion von Tool-Payloads | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
  | `plugin-sdk/tool-send` | Extraktion von Tool-Sendeangaben | Kanonische Send-Zielfelder aus Tool-Argumenten extrahieren |
  | `plugin-sdk/temp-path` | Hilfen für temporäre Pfade | Gemeinsame Hilfen für temporäre Download-Pfade |
  | `plugin-sdk/logging-core` | Logging-Hilfen | Subsystem-Logger und Schwärzungshilfen |
  | `plugin-sdk/markdown-table-runtime` | Markdown-Tabellen-Hilfen | Hilfen für Markdown-Tabellenmodi |
  | `plugin-sdk/reply-payload` | Typen für Nachrichtenantworten | Reply-Payload-Typen |
  | `plugin-sdk/provider-setup` | Kuratierte Hilfen zur Einrichtung lokaler/selbstgehosteter Provider | Hilfen zur Erkennung/Konfiguration selbstgehosteter Provider |
  | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Hilfen zur Einrichtung OpenAI-kompatibler selbstgehosteter Provider | Dieselben Hilfen zur Erkennung/Konfiguration selbstgehosteter Provider |
  | `plugin-sdk/provider-auth-runtime` | Hilfen für Provider-Runtime-Authentifizierung | Hilfen zur Runtime-Auflösung von API-Schlüsseln |
  | `plugin-sdk/provider-auth-api-key` | Hilfen zur Einrichtung von Provider-API-Schlüsseln | Hilfen für API-Schlüssel-Onboarding/Profilschreibung |
  | `plugin-sdk/provider-auth-result` | Hilfen für Provider-Authentifizierungsergebnisse | Standard-Builder für OAuth-Authentifizierungsergebnisse |
  | `plugin-sdk/provider-selection-runtime` | Hilfen zur Provider-Auswahl | Konfigurierte oder automatische Provider-Auswahl und Zusammenführung roher Provider-Konfigurationen |
  | `plugin-sdk/provider-env-vars` | Hilfen für Provider-Umgebungsvariablen | Hilfen zum Nachschlagen von Provider-Authentifizierungs-Umgebungsvariablen |
  | `plugin-sdk/provider-model-shared` | Gemeinsame Hilfen für Provider-Modelle/Replays | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Replay-Policy-Builder, Provider-Endpunkt-Hilfen und Hilfen zur Normalisierung von Modell-IDs |
  | `plugin-sdk/provider-catalog-shared` | Gemeinsame Hilfen für Provider-Kataloge | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Provider-Onboarding-Patches | Hilfen für Onboarding-Konfigurationen |
  | `plugin-sdk/provider-http` | Provider-HTTP-Hilfen | Generische Hilfen für Provider-HTTP-/Endpunkt-Fähigkeiten, einschließlich Multipart-Form-Hilfen für Audio-Transkription |
  | `plugin-sdk/provider-web-fetch` | Hilfen für Provider-Web-Fetch | Hilfen für Registrierung/Cache von Web-Fetch-Providern |
  | `plugin-sdk/provider-web-search-config-contract` | Hilfen für Provider-Websuche-Konfiguration | Enge Hilfen für Websuche-Konfiguration/-Anmeldedaten für Provider, die keine Plugin-Aktivierungsverdrahtung benötigen |
  | `plugin-sdk/provider-web-search-contract` | Hilfen für Provider-Websuche-Contract | Enge Contract-Hilfen für Websuche-Konfiguration/-Anmeldedaten wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` und bereichsgebundene Credential-Setter/-Getter |
  | `plugin-sdk/provider-web-search` | Hilfen für Provider-Websuche | Hilfen für Registrierung/Cache/Runtime von Websuche-Providern |
  | `plugin-sdk/provider-tools` | Provider-Tool-/Schema-Kompatibilitätshilfen | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` und Schema-Bereinigung + Diagnosen für DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Hilfen zur Provider-Nutzung | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` und weitere Hilfen zur Provider-Nutzung |
  | `plugin-sdk/provider-stream` | Hilfen für Provider-Stream-Wrapper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Wrapper-Hilfen für Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Hilfen für Provider-Transport | Native Provider-Transport-Hilfen wie geschützter Fetch, Transport-Nachrichtentransformationen und beschreibbare Transport-Ereignisstreams |
  | `plugin-sdk/keyed-async-queue` | Geordnete asynchrone Queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gemeinsame Medien-Hilfen | Hilfen zum Abrufen/Transformieren/Speichern von Medien, ffprobe-gestützte Ermittlung von Videodimensionen und Builder für Medien-Payloads |
  | `plugin-sdk/media-generation-runtime` | Gemeinsame Hilfen zur Mediengenerierung | Gemeinsame Failover-Hilfen, Kandidatenauswahl und Meldungen zu fehlenden Modellen für Bild-/Video-/Musikgenerierung |
  | `plugin-sdk/media-understanding` | Hilfen für Medienverständnis | Provider-Typen für Medienverständnis plus providerseitige Exporte für Bild-/Audio-Hilfen |
  | `plugin-sdk/text-runtime` | Veralteter breiter Textkompatibilitäts-Export | Verwenden Sie `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` und `logging-core` |
  | `plugin-sdk/text-chunking` | Hilfen für Textaufteilung | Hilfe für ausgehende Textaufteilung |
  | `plugin-sdk/speech` | Sprach-Hilfen | Sprach-Provider-Typen plus providerseitige Hilfen für Direktiven, Registry und Validierung sowie OpenAI-kompatibler TTS-Builder |
  | `plugin-sdk/speech-core` | Gemeinsamer Sprach-Core | Sprach-Provider-Typen, Registry, Direktiven, Normalisierung |
  | `plugin-sdk/realtime-transcription` | Hilfen für Echtzeit-Transkription | Provider-Typen, Registry-Hilfen und gemeinsame WebSocket-Sitzungshilfe |
  | `plugin-sdk/realtime-voice` | Hilfen für Echtzeit-Sprache | Provider-Typen, Registry-/Auflösungshilfen, Bridge-Sitzungshilfen, gemeinsame Agent-Talkback-Queues, Sprachsteuerung aktiver Runs, Transkript-/Ereigniszustand, Echounterdrückung, Abgleich von Rückfragefragen, Koordination erzwungener Rückfragen, Turn-Kontext-Tracking, Tracking von Ausgabeaktivität und schnelle Kontext-Rückfragehilfen |
  | `plugin-sdk/image-generation` | Hilfen für Bildgenerierung | Bildgenerierungs-Provider-Typen plus Hilfen für Bild-Assets/Daten-URLs und OpenAI-kompatibler Bild-Provider-Builder |
  | `plugin-sdk/image-generation-core` | Gemeinsamer Core für Bildgenerierung | Bildgenerierungstypen, Failover, Authentifizierung und Registry-Hilfen |
  | `plugin-sdk/music-generation` | Hilfen für Musikgenerierung | Provider-/Request-/Result-Typen für Musikgenerierung |
  | `plugin-sdk/music-generation-core` | Gemeinsamer Core für Musikgenerierung | Musikgenerierungstypen, Failover-Hilfen, Provider-Lookup und Modell-Ref-Parsing |
  | `plugin-sdk/video-generation` | Hilfen für Videogenerierung | Provider-/Request-/Result-Typen für Videogenerierung |
  | `plugin-sdk/video-generation-core` | Gemeinsamer Core für Videogenerierung | Videogenerierungstypen, Failover-Hilfen, Provider-Lookup und Modell-Ref-Parsing |
  | `plugin-sdk/interactive-runtime` | Hilfen für interaktive Antworten | Normalisierung/Reduktion interaktiver Antwort-Payloads |
  | `plugin-sdk/channel-config-primitives` | Primitive für Kanalkonfiguration | Enge Primitive für Kanalkonfigurationsschemas |
  | `plugin-sdk/channel-config-writes` | Hilfen für Kanalkonfigurationsschreibvorgänge | Hilfen zur Autorisierung von Kanalkonfigurationsschreibvorgängen |
  | `plugin-sdk/channel-plugin-common` | Gemeinsames Kanal-Prelude | Gemeinsame Exporte für Kanal-Plugin-Prelude |
  | `plugin-sdk/channel-status` | Hilfen für Kanalstatus | Gemeinsame Hilfen für Kanalstatus-Snapshots/-Zusammenfassungen |
  | `plugin-sdk/allowlist-config-edit` | Hilfen für Allowlist-Konfiguration | Hilfen zum Bearbeiten/Lesen von Allowlist-Konfigurationen |
  | `plugin-sdk/group-access` | Hilfen für Gruppenzugriff | Gemeinsame Entscheidungshilfen für Gruppenzugriff |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Veraltete Kompatibilitätsfassaden | Verwenden Sie `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Hilfen für Direct-DM-Guard | Enge Guard-Policy-Hilfen vor Crypto |
  | `plugin-sdk/extension-shared` | Gemeinsame Erweiterungshilfen | Primitive für Passive-Channel/Status und Ambient-Proxy-Hilfen |
  | `plugin-sdk/webhook-targets` | Hilfen für Webhook-Ziele | Registry für Webhook-Ziele und Hilfen zur Routeninstallation |
  | `plugin-sdk/webhook-path` | Veralteter Webhook-Pfad-Alias | Verwenden Sie `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Gemeinsame Webmedien-Hilfen | Hilfen zum Laden von Remote-/lokalen Medien |
  | `plugin-sdk/zod` | Veralteter Zod-Kompatibilitäts-Reexport | Importieren Sie `zod` direkt aus `zod` |
  | `plugin-sdk/memory-core` | Gebündelte memory-core-Hilfen | Hilfsoberfläche für Speicher-Manager/-Konfiguration/-Datei/-CLI |
  | `plugin-sdk/memory-core-engine-runtime` | Runtime-Fassade der Memory Engine | Runtime-Fassade für Speicherindex/-suche |
  | `plugin-sdk/memory-core-host-embedding-registry` | Speicher-Embedding-Registry | Leichtgewichtige Hilfen für Speicher-Embedding-Provider-Registry |
  | `plugin-sdk/memory-core-host-engine-foundation` | Memory-Host-Foundation-Engine | Exporte der Memory-Host-Foundation-Engine |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Memory-Host-Embedding-Engine | Speicher-Embedding-Contracts, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Hilfen; konkrete Remote-Provider befinden sich in ihren besitzenden Plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | Memory-Host-QMD-Engine | Exporte der Memory-Host-QMD-Engine |
  | `plugin-sdk/memory-core-host-engine-storage` | Memory-Host-Storage-Engine | Exporte der Memory-Host-Storage-Engine |
  | `plugin-sdk/memory-core-host-multimodal` | Memory-Host-Multimodal-Hilfen | Memory-Host-Multimodal-Hilfen |
  | `plugin-sdk/memory-core-host-query` | Memory-Host-Query-Hilfen | Memory-Host-Query-Hilfen |
  | `plugin-sdk/memory-core-host-secret` | Memory-Host-Secret-Hilfen | Memory-Host-Secret-Hilfen |
  | `plugin-sdk/memory-core-host-events` | Veralteter Speicherereignis-Alias | Verwenden Sie `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Memory-Host-Statushilfen | Memory-Host-Statushilfen |
  | `plugin-sdk/memory-core-host-runtime-cli` | Memory-Host-CLI-Runtime | Memory-Host-CLI-Runtime-Hilfen |
  | `plugin-sdk/memory-core-host-runtime-core` | Memory-Host-Core-Runtime | Memory-Host-Core-Runtime-Hilfen |
  | `plugin-sdk/memory-core-host-runtime-files` | Memory-Host-Datei-/Runtime-Hilfen | Memory-Host-Datei-/Runtime-Hilfen |
  | `plugin-sdk/memory-host-core` | Alias für Memory-Host-Core-Runtime | Vendor-neutraler Alias für Memory-Host-Core-Runtime-Hilfen |
  | `plugin-sdk/memory-host-events` | Alias für Memory-Host-Ereignisjournal | Vendor-neutraler Alias für Memory-Host-Ereignisjournal-Hilfen |
  | `plugin-sdk/memory-host-files` | Veralteter Speicherdatei-/Runtime-Alias | Verwenden Sie `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Hilfen für verwaltetes Markdown | Gemeinsame Hilfen für verwaltetes Markdown für speichernahe Plugins |
  | `plugin-sdk/memory-host-search` | Active Memory-Suchfassade | Lazy Runtime-Fassade für Active-Memory-Suchmanager |
  | `plugin-sdk/memory-host-status` | Veralteter Memory-Host-Statusalias | Verwenden Sie `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Testwerkzeuge | Repo-lokales veraltetes Kompatibilitäts-Barrel; verwenden Sie fokussierte repo-lokale Testunterpfade wie `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` und `plugin-sdk/test-fixtures` |
</Accordion>

Diese Tabelle ist bewusst die gemeinsame Migrations-Teilmenge, nicht die vollständige SDK-Oberfläche. Das Inventar der Compiler-Einstiegspunkte befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`; Paket-Exporte werden aus der öffentlichen Teilmenge generiert.

Reservierte Hilfs-Schnittstellen für gebündelte Plugins wurden aus der öffentlichen SDK-Export-Map entfernt, mit Ausnahme ausdrücklich dokumentierter Kompatibilitäts-Fassaden wie dem veralteten Shim `plugin-sdk/discord`, der für das veröffentlichte Paket
`@openclaw/discord@2026.3.13` beibehalten wird. Owner-spezifische Helfer befinden sich im jeweils besitzenden Plugin-Paket; gemeinsames Host-Verhalten sollte über generische SDK-Verträge wie `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` und `plugin-sdk/plugin-config-runtime` laufen.

Verwenden Sie den engsten Import, der zur Aufgabe passt. Wenn Sie keinen Export finden, prüfen Sie den Quellcode unter `src/plugin-sdk/` oder fragen Sie die Maintainer, welcher generische Vertrag dafür zuständig sein soll.

## Aktive Veraltungen

Engere Veraltungen, die für das Plugin-SDK, den Provider-Vertrag, die Runtime-Oberfläche und das Manifest gelten. Jede funktioniert heute noch, wird aber in einem künftigen Major-Release entfernt. Der Eintrag unter jedem Punkt ordnet die alte API ihrem kanonischen Ersatz zu.

<AccordionGroup>
  <Accordion title="command-auth-Hilfs-Builder → command-status">
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

  <Accordion title="Mention-Gating-Helfer → resolveInboundMentionDecision">
    **Alt**: `resolveInboundMentionRequirement({ facts, policy })` und
    `shouldDropInboundForMention(...)` aus
    `openclaw/plugin-sdk/channel-inbound` oder
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Neu**: `resolveInboundMentionDecision({ facts, policy })` - gibt ein
    einzelnes Entscheidungsobjekt statt zwei getrennter Aufrufe zurück.

    Nachgelagerte Channel-Plugins (Slack, Discord, Matrix, MS Teams) wurden bereits
    umgestellt.

  </Accordion>

  <Accordion title="Channel-Runtime-Shim und Channel-Actions-Helfer">
    `openclaw/plugin-sdk/channel-runtime` ist ein Kompatibilitäts-Shim für ältere
    Channel-Plugins. Importieren Sie ihn nicht in neuem Code; verwenden Sie
    `openclaw/plugin-sdk/channel-runtime-context`, um Runtime-Objekte zu
    registrieren.

    `channelActions*`-Helfer in `openclaw/plugin-sdk/channel-actions` sind
    zusammen mit rohen Channel-Exporten für "actions" veraltet. Stellen Sie
    Fähigkeiten stattdessen über die semantische Oberfläche `presentation`
    bereit - Channel-Plugins deklarieren, was sie rendern (Karten, Buttons,
    Auswahllisten), statt welche rohen Action-Namen sie akzeptieren.

  </Accordion>

  <Accordion title="Web-Search-Provider-Helfer tool() → createTool() auf dem Plugin">
    **Alt**: `tool()`-Factory aus `openclaw/plugin-sdk/provider-web-search`.

    **Neu**: Implementieren Sie `createTool(...)` direkt auf dem Provider-Plugin.
    OpenClaw benötigt den SDK-Helfer nicht mehr, um den Tool-Wrapper zu registrieren.

  </Accordion>

  <Accordion title="Plaintext-Channel-Umschläge → BodyForAgent">
    **Alt**: `formatInboundEnvelope(...)` (und
    `ChannelMessageForAgent.channelEnvelope`), um aus eingehenden Channel-Nachrichten
    einen flachen Plaintext-Prompt-Umschlag zu erstellen.

    **Neu**: `BodyForAgent` plus strukturierte Benutzerkontext-Blöcke. Channel-Plugins
    hängen Routing-Metadaten (Thread, Thema, Antwort-an, Reaktionen) als
    typisierte Felder an, statt sie in einen Prompt-String zu verketten. Der
    Helfer `formatAgentEnvelope(...)` wird für synthetisierte
    assistentenorientierte Umschläge weiterhin unterstützt, aber eingehende
    Plaintext-Umschläge werden auslaufen.

    Betroffene Bereiche: `inbound_claim`, `message_received` und jedes eigene
    Channel-Plugin, das `channelEnvelope`-Text nachverarbeitet hat.

  </Accordion>

  <Accordion title="deactivate-Hook → gateway_stop">
    **Alt**: `api.on("deactivate", handler)`.

    **Neu**: `api.on("gateway_stop", handler)`. Ereignis und Kontext sind derselbe
    Vertrag für Shutdown-Cleanup; nur der Hook-Name ändert sich.

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
    Kompatibilitätsalias verdrahtet.

  </Accordion>

  <Accordion title="subagent_spawning-Hook → Core-Thread-Binding">
    **Alt**: `api.on("subagent_spawning", handler)`, das
    `threadBindingReady` oder `deliveryOrigin` zurückgibt.

    **Neu**: Lassen Sie Core `thread: true`-Subagent-Bindings über den
    Channel-Session-Binding-Adapter vorbereiten. Verwenden Sie
    `api.on("subagent_spawned", handler)` nur zur Beobachtung nach dem Start.

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
    veraltete Kompatibilitätsoberflächen erhalten, während externe Plugins
    migrieren.

  </Accordion>

  <Accordion title="Provider-Discovery-Typen → Provider-Katalogtypen">
    Vier Discovery-Typaliasse sind jetzt dünne Wrapper über die Typen der
    Katalog-Ära:

    | Alter Alias               | Neuer Typ                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Dazu kommt der alte statische Block `ProviderCapabilities` - Provider-Plugins
    sollten explizite Provider-Hooks wie `buildReplayPolicy`,
    `normalizeToolSchemas` und `wrapStreamFn` statt eines statischen Objekts
    verwenden.

  </Accordion>

  <Accordion title="Thinking-Policy-Hooks → resolveThinkingProfile">
    **Alt** (drei separate Hooks auf `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` und
    `resolveDefaultThinkingLevel(ctx)`.

    **Neu**: ein einzelnes `resolveThinkingProfile(ctx)`, das ein
    `ProviderThinkingProfile` mit der kanonischen `id`, optionalem `label` und
    gerankter Level-Liste zurückgibt. OpenClaw stuft veraltete gespeicherte Werte
    automatisch anhand des Profil-Rangs herunter.

    Der Kontext enthält `provider`, `modelId`, optional zusammengeführtes
    `reasoning` und optional zusammengeführte Modell-`compat`-Fakten. Provider-Plugins
    können diese Katalogfakten nutzen, um ein modellspezifisches Profil nur dann
    bereitzustellen, wenn der konfigurierte Request-Vertrag es unterstützt.

    Implementieren Sie einen Hook statt drei. Die alten Hooks funktionieren während
    des Veraltungsfensters weiter, werden aber nicht mit dem Profilergebnis
    kombiniert.

  </Accordion>

  <Accordion title="Externe Auth-Provider → contracts.externalAuthProviders">
    **Alt**: externe Auth-Hooks implementieren, ohne den Provider im
    Plugin-Manifest zu deklarieren.

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

  <Accordion title="Provider-Env-Var-Lookup → setup.providers[].envVars">
    **Altes** Manifestfeld: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Neu**: Spiegeln Sie denselben Env-Var-Lookup in `setup.providers[].envVars`
    im Manifest. Dadurch werden Setup-/Status-Env-Metadaten an einer Stelle
    zusammengeführt, und die Plugin-Runtime muss nicht nur für Env-Var-Lookups
    gestartet werden.

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

    Gleiche Slots, ein einzelner Registrierungsaufruf. Additive Prompt- und
    Korpus-Helfer (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)
    sind nicht betroffen.

  </Accordion>

  <Accordion title="Memory-Embedding-Provider-API">
    **Alt**: `api.registerMemoryEmbeddingProvider(...)` plus
    `contracts.memoryEmbeddingProviders`.

    **Neu**: `api.registerEmbeddingProvider(...)` plus
    `contracts.embeddingProviders`.

    Der generische Embedding-Provider-Vertrag ist außerhalb von Memory
    wiederverwendbar und der unterstützte Pfad für neue Provider. Die
    Memory-spezifische Registrierungs-API bleibt als veraltete Kompatibilität
    verdrahtet, während bestehende Provider migrieren. Plugin-Inspektionsberichte
    melden nicht gebündelte Nutzung als Kompatibilitätsschuld.

  </Accordion>

  <Accordion title="Subagent-Session-Nachrichtentypen umbenannt">
    Zwei alte Typaliasse werden weiterhin aus `src/plugins/runtime/types.ts` exportiert:

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

    **Neu**: `runtime.tasks.managedFlows` behält die verwaltete
    TaskFlow-Mutations-Runtime für Plugins bei, die Child-Tasks aus einem Flow
    erstellen, aktualisieren, abbrechen oder ausführen. Verwenden Sie
    `runtime.tasks.flows`, wenn das Plugin nur DTO-basierte Lesezugriffe benötigt.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Eingebettete Extension-Factories → Middleware für Agent-Tool-Ergebnisse">
    Oben in "So migrieren Sie → Eingebettete Tool-Ergebnis-Extensions zu
    Middleware migrieren" behandelt. Der Vollständigkeit halber hier enthalten:
    Der entfernte, nur für den Embedded-Runner gedachte Pfad
    `api.registerEmbeddedExtensionFactory(...)` wird durch
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
`extensions/`) werden in deren eigenen Barrels `api.ts` und `runtime-api.ts`
nachverfolgt. Sie betreffen keine Verträge für Drittanbieter-Plugins und sind hier
nicht aufgeführt. Wenn Sie das lokale Barrel eines gebündelten Plugins direkt
verwenden, lesen Sie vor dem Upgrade die Veraltungskommentare in diesem Barrel.
</Note>

## Zeitplan für die Entfernung

| Wann                   | Was passiert                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Jetzt**              | Veraltete Schnittstellen geben Laufzeitwarnungen aus                    |
| **Nächste Hauptversion** | Veraltete Schnittstellen werden entfernt; Plugins, die sie weiterhin verwenden, schlagen fehl |

Alle Kern-Plugins wurden bereits migriert. Externe Plugins sollten vor der
nächsten Hauptversion migrieren.

## Warnungen vorübergehend unterdrücken

Setzen Sie diese Umgebungsvariablen, während Sie an der Migration arbeiten:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dies ist eine vorübergehende Ausweichmöglichkeit, keine dauerhafte Lösung.

## Verwandte Themen

- [Erste Schritte](/de/plugins/building-plugins) - Ihr erstes Plugin erstellen
- [SDK-Überblick](/de/plugins/sdk-overview) - vollständige Referenz für Subpath-Importe
- [Channel-Plugins](/de/plugins/sdk-channel-plugins) - Channel-Plugins erstellen
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) - Provider-Plugins erstellen
- [Plugin-Interna](/de/plugins/architecture) - ausführlicher Architekturüberblick
- [Plugin-Manifest](/de/plugins/manifest) - Referenz zum Manifest-Schema
