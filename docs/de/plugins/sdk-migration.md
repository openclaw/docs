---
read_when:
    - Sie sehen die Warnung OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Sie sehen die Warnung OPENCLAW_EXTENSION_API_DEPRECATED
    - Sie haben vor OpenClaw 2026.4.25 api.registerEmbeddedExtensionFactory verwendet
    - Sie aktualisieren ein Plugin auf die moderne Plugin-Architektur
    - Sie pflegen ein externes OpenClaw Plugin
sidebarTitle: Migrate to SDK
summary: Von der alten Abwärtskompatibilitätsschicht zum modernen Plugin-SDK migrieren
title: Plugin-SDK-Migration
x-i18n:
    generated_at: "2026-07-01T12:54:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a9f6f9b4334ca3bdbcc6602cfe2bb1499d5758de95a9163e0ef75619a712a1c3
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw ist von einer breiten Abwärtskompatibilitätsebene zu einer modernen Plugin-
Architektur mit fokussierten, dokumentierten Imports gewechselt. Wenn Ihr Plugin vor
der neuen Architektur erstellt wurde, hilft Ihnen diese Anleitung bei der Migration.

## Was sich ändert

Das alte Plugin-System stellte zwei sehr offene Oberflächen bereit, über die Plugins
alles, was sie brauchten, von einem einzigen Einstiegspunkt importieren konnten:

- **`openclaw/plugin-sdk/compat`** - ein einzelner Import, der Dutzende von
  Hilfsfunktionen erneut exportierte. Er wurde eingeführt, um ältere Hook-basierte
  Plugins funktionsfähig zu halten, während die neue Plugin-Architektur aufgebaut
  wurde.
- **`openclaw/plugin-sdk/infra-runtime`** - ein breites Runtime-Hilfs-Barrel, das
  Systemereignisse, Heartbeat-Zustand, Zustellungswarteschlangen, Fetch-/Proxy-Hilfen,
  Datei-Hilfen, Genehmigungstypen und nicht zusammenhängende Utilities mischte.
- **`openclaw/plugin-sdk/config-runtime`** - ein breites Konfigurations-Kompatibilitäts-Barrel,
  das während des Migrationsfensters weiterhin veraltete direkte Lade-/Schreibhilfen
  enthält.
- **`openclaw/extension-api`** - eine Brücke, die Plugins direkten Zugriff auf
  hostseitige Hilfen wie den eingebetteten Agent-Runner gab.
- **`api.registerEmbeddedExtensionFactory(...)`** - ein entfernter, nur für den eingebetteten Runner
  bestimmter gebündelter Extension-Hook, der Ereignisse des eingebetteten Runners wie
  `tool_result` beobachten konnte.

Die breiten Import-Oberflächen sind jetzt **veraltet**. Sie funktionieren zur Laufzeit
weiterhin, aber neue Plugins dürfen sie nicht verwenden, und bestehende Plugins sollten
vor dem nächsten Major-Release migrieren, der sie entfernt. Die nur für den eingebetteten
Runner bestimmte API zur Registrierung von Extension-Factorys wurde entfernt; verwenden Sie
stattdessen Tool-Result-Middleware.

OpenClaw entfernt oder interpretiert dokumentiertes Plugin-Verhalten nicht in derselben
Änderung neu, die einen Ersatz einführt. Breaking-Contract-Änderungen müssen zuerst über
einen Kompatibilitätsadapter, Diagnosen, Dokumentation und ein Deprecation-Fenster laufen.
Das gilt für SDK-Imports, Manifestfelder, Setup-APIs, Hooks und Runtime-
Registrierungsverhalten.

<Warning>
  Die Abwärtskompatibilitätsebene wird in einem zukünftigen Major-Release entfernt.
  Plugins, die weiterhin aus diesen Oberflächen importieren, werden dann brechen.
  Legacy-Registrierungen für eingebettete Extension-Factorys werden bereits nicht mehr geladen.
</Warning>

## Warum sich das geändert hat

Der alte Ansatz verursachte Probleme:

- **Langsamer Start** - das Importieren einer Hilfsfunktion lud Dutzende nicht zusammenhängender Module
- **Zirkuläre Abhängigkeiten** - breite Re-Exports machten es leicht, Importzyklen zu erzeugen
- **Unklare API-Oberfläche** - es war nicht erkennbar, welche Exports stabil und welche intern waren

Das moderne Plugin-SDK behebt dies: Jeder Importpfad (`openclaw/plugin-sdk/\<subpath\>`)
ist ein kleines, in sich geschlossenes Modul mit klarem Zweck und dokumentiertem Vertrag.

Legacy-Komfortschnittstellen für Provider gebündelter Kanäle sind ebenfalls entfernt.
Kanal-gebrandete Hilfsschnittstellen waren private Mono-Repo-Abkürzungen, keine stabilen
Plugin-Verträge. Verwenden Sie stattdessen schmale generische SDK-Unterpfade. Behalten Sie
innerhalb des gebündelten Plugin-Workspace Provider-eigene Hilfen im jeweiligen `api.ts` oder
`runtime-api.ts` dieses Plugins.

Aktuelle Beispiele für gebündelte Provider:

- Anthropic hält Claude-spezifische Stream-Hilfen in seiner eigenen `api.ts`- /
  `contract-api.ts`-Schnittstelle
- OpenAI hält Provider-Builder, Default-Model-Hilfen und Realtime-Provider-
  Builder in seiner eigenen `api.ts`
- OpenRouter hält Provider-Builder sowie Onboarding-/Konfigurationshilfen in seiner eigenen
  `api.ts`

## Migrationsplan für Talk und Echtzeit-Sprache

Echtzeit-Sprache, Telefonie, Meeting- und Browser-Talk-Code wird von
oberflächenlokaler Turn-Buchführung auf einen gemeinsamen Talk-Sitzungscontroller verschoben, der von
`openclaw/plugin-sdk/realtime-voice` exportiert wird. Der neue Controller besitzt den gemeinsamen Talk-
Ereignisumschlag, den aktiven Turn-Zustand, den Capture-Zustand, den Output-Audio-Zustand, den aktuellen
Ereignisverlauf und die Ablehnung veralteter Turns. Provider-Plugins sollten weiterhin
anbieterspezifische Echtzeitsitzungen besitzen; Oberflächen-Plugins sollten weiterhin Capture,
Wiedergabe, Telefonie und Meeting-Besonderheiten besitzen.

Diese Talk-Migration ist bewusst sauber brechend:

1. Behalten Sie den gemeinsamen Controller und die Runtime-Primitiven in
   `plugin-sdk/realtime-voice`.
2. Verschieben Sie gebündelte Oberflächen auf den gemeinsamen Controller: Browser-Relay,
   Managed-Room-Handoff, Voice-Call-Echtzeit, Voice-Call-Streaming-STT, Google
   Meet-Echtzeit und natives Push-to-Talk.
3. Ersetzen Sie alte Talk-RPC-Familien durch die finalen APIs `talk.session.*` und
   `talk.client.*`.
4. Kündigen Sie in Gateway
   `hello-ok.features.events` einen Live-Talk-Ereigniskanal an: `talk.event`.
5. Löschen Sie den alten Echtzeit-HTTP-Endpunkt und jeden Pfad für Instruktions-
   Overrides zur Anfragezeit.

Neuer Code sollte `createTalkEventSequencer(...)` nicht direkt aufrufen, außer er
implementiert einen Low-Level-Adapter oder ein Test-Fixture. Bevorzugen Sie den gemeinsamen Controller,
damit Turn-bezogene Ereignisse nicht ohne Turn-ID emittiert werden können, veraltete `turnEnd`- /
`turnCancel`-Aufrufe keinen neueren aktiven Turn löschen können und Output-Audio-Lifecycle-
Ereignisse über Telefonie, Meetings, Browser-Relay, Managed-Room-Handoff und native Talk-Clients
hinweg konsistent bleiben.

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

Browser-eigene WebRTC-/Provider-Websocket-Sitzungen verwenden `talk.client.create`,
weil der Browser die Provider-Aushandlung und den Medientransport besitzt, während das
Gateway Anmeldedaten, Instruktionen und Tool-Policy besitzt. `talk.session.*` ist die
gemeinsame Gateway-verwaltete Oberfläche für Gateway-Relay-Echtzeit, Gateway-Relay-
Transkription und Managed-Room-native STT/TTS-Sitzungen.

Legacy-Konfigurationen, die Echtzeit-Selektoren neben `talk.provider` /
`talk.providers` platziert haben, sollten mit `openclaw doctor --fix` repariert werden; Runtime Talk
interpretiert Speech-/TTS-Provider-Konfiguration nicht als Echtzeit-Provider-Konfiguration neu.

Die unterstützten `talk.session.create`-Kombinationen sind bewusst klein:

| Modus           | Transport       | Brain           | Zuständig          | Hinweise                                                                                                           |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Full-Duplex-Provider-Audio, das über das Gateway überbrückt wird; Tool-Aufrufe werden über das agent-consult-Tool geleitet. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Nur Streaming-STT; Aufrufer senden Eingabeaudio und empfangen Transkriptereignisse.                                |
| `stt-tts`       | `managed-room`  | `agent-consult` | Nativer/Client-Raum | Push-to-Talk- und Walkie-Talkie-artige Räume, in denen der Client Capture/Wiedergabe besitzt und das Gateway den Turn-Zustand besitzt. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Nativer/Client-Raum | Nur-Admin-Raummodus für vertrauenswürdige First-Party-Oberflächen, die Gateway-Tool-Aktionen direkt ausführen.      |

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

  | Methode                         | Gilt für                                                | Vertrag                                                                                                                                                                                     |
  | ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Hängen Sie einen base64-PCM-Audio-Chunk an die Provider-Sitzung an, die derselben Gateway-Verbindung gehört.                                                                                |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Starten Sie einen Benutzer-Turn in einem verwalteten Raum.                                                                                                                                  |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Beenden Sie den aktiven Turn nach der Validierung auf veraltete Turns.                                                                                                                      |
  | `talk.session.cancelTurn`       | alle Gateway-eigenen Sitzungen                          | Brechen Sie aktive Capture-/Provider-/Agent-/TTS-Arbeit für einen Turn ab.                                                                                                                  |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Stoppen Sie die Audioausgabe des Assistenten, ohne den Benutzer-Turn zwingend zu beenden.                                                                                                  |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Schließen Sie einen vom Relay ausgegebenen Provider-Toolaufruf ab; übergeben Sie `options.willContinue` für Zwischenausgabe oder `options.suppressResponse`, um den Aufruf ohne weitere Assistentenantwort zu erfüllen. |
  | `talk.session.steer`            | agentgestützte Talk-Sitzungen                           | Senden Sie gesprochene `status`-, `steer`-, `cancel`- oder `followup`-Steuerung an den aktiven eingebetteten Lauf, der aus der Talk-Sitzung aufgelöst wurde.                               |
  | `talk.session.close`            | alle vereinheitlichten Sitzungen                        | Stoppen Sie Relay-Sitzungen oder widerrufen Sie den Zustand des verwalteten Raums und vergessen Sie anschließend die vereinheitlichte Sitzungs-ID.                                          |

  Führen Sie dafür keine Provider- oder Plattform-Sonderfälle im Core ein.
  Core besitzt die Talk-Sitzungssemantik. Provider-Plugins besitzen die Einrichtung
  von Vendor-Sitzungen. Voice-Call und Google Meet besitzen Telefonie-/Meeting-Adapter.
  Browser und native Apps besitzen die UX für Geräteerfassung und Wiedergabe.

  ## Kompatibilitätsrichtlinie

  Für externe Plugins folgt Kompatibilitätsarbeit dieser Reihenfolge:

  1. den neuen Vertrag hinzufügen
  2. das alte Verhalten über einen Kompatibilitätsadapter verdrahtet lassen
  3. eine Diagnose oder Warnung ausgeben, die den alten Pfad und den Ersatz nennt
  4. beide Pfade in Tests abdecken
  5. die Deprecation und den Migrationspfad dokumentieren
  6. erst nach dem angekündigten Migrationsfenster entfernen, üblicherweise in einem Major-Release

  Maintainer können die aktuelle Migrationswarteschlange mit
  `pnpm plugins:boundary-report` auditieren. Verwenden Sie `pnpm plugins:boundary-report:summary` für
  kompakte Zählungen, `--owner <id>` für ein Plugin oder einen Kompatibilitätseigentümer und
  `pnpm plugins:boundary-report:ci`, wenn ein CI-Gate bei fälligen
  Kompatibilitätseinträgen, reservierten SDK-Importen über Eigentümergrenzen hinweg oder ungenutzten reservierten SDK-
  Unterpfaden fehlschlagen soll. Der Bericht gruppiert veraltete
  Kompatibilitätseinträge nach Entfernungsdatum, zählt lokale Code-/Docs-Referenzen,
  zeigt reservierte SDK-Importe über Eigentümergrenzen hinweg an und fasst die private
  memory-host-SDK-Bridge zusammen, damit Kompatibilitätsbereinigung explizit bleibt,
  statt sich auf Ad-hoc-Suchen zu verlassen. Reservierte SDK-Unterpfade müssen nachverfolgte Eigentümernutzung haben;
  ungenutzte reservierte Helper-Exporte sollten aus dem öffentlichen SDK entfernt werden.

  Wenn ein Manifestfeld noch akzeptiert wird, können Plugin-Autoren es weiter verwenden, bis
  Dokumentation und Diagnosen etwas anderes sagen. Neuer Code sollte den dokumentierten
  Ersatz bevorzugen, aber bestehende Plugins sollten bei gewöhnlichen Minor-
  Releases nicht brechen.

  ## Migration

  <Steps>
  <Step title="Runtime-Config-Lese-/Schreib-Helper migrieren">
    Gebündelte Plugins sollten aufhören,
    `api.runtime.config.loadConfig()` und
    `api.runtime.config.writeConfigFile(...)` direkt aufzurufen. Bevorzugen Sie Config, die
    bereits in den aktiven Aufrufpfad übergeben wurde. Langlebige Handler, die den
    aktuellen Prozess-Snapshot benötigen, können `api.runtime.config.current()` verwenden. Langlebige
    Agent-Tools sollten innerhalb von
    `execute` `ctx.getRuntimeConfig()` aus dem Toolkontext verwenden, damit ein Tool, das vor einem Config-Schreibvorgang erstellt wurde, weiterhin die aktualisierte
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
    `afterWrite: { mode: "none", reason: "..." }` nur, wenn der Aufrufer den
    Folgeprozess besitzt und den Reload-Planer bewusst unterdrücken möchte.
    Mutationsergebnisse enthalten eine typisierte `followUp`-Zusammenfassung für Tests und Logging;
    das Gateway bleibt dafür verantwortlich, den Neustart anzuwenden oder einzuplanen.
    `loadConfig` und `writeConfigFile` bleiben während des Migrationsfensters als veraltete Kompatibilitäts-
    Helper für externe Plugins bestehen und warnen einmal mit
    dem Kompatibilitätscode `runtime-config-load-write`. Gebündelte Plugins und Repo-
    Runtime-Code werden durch Scanner-Leitplanken in
    `pnpm check:deprecated-api-usage` und
    `pnpm check:no-runtime-action-load-config` geschützt: neue Nutzung in Produktions-Plugins
    schlägt direkt fehl, direkte Config-Schreibvorgänge schlagen fehl, Gateway-Servermethoden müssen
    den Runtime-Snapshot der Anfrage verwenden, Runtime-Channel-Send-/Action-/Client-Helper
    müssen Config von ihrer Grenze erhalten, und langlebige Runtime-Module haben
    null erlaubte umgebende `loadConfig()`-Aufrufe.

    Neuer Plugin-Code sollte außerdem vermeiden, das breite
    Kompatibilitäts-Barrel `openclaw/plugin-sdk/config-runtime` zu importieren. Verwenden Sie den schmalen
    SDK-Unterpfad, der zur Aufgabe passt:

    | Bedarf | Import |
    | --- | --- |
    | Config-Typen wie `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Assertions für bereits geladene Config und Config-Lookup am Plugin-Einstieg | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lesezugriffe auf aktuelle Runtime-Snapshots | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Config-Schreibvorgänge | `openclaw/plugin-sdk/config-mutation` |
    | Helper für den Sitzungsspeicher | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown-Tabellen-Config | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtime-Helper für Gruppenrichtlinien | `openclaw/plugin-sdk/runtime-group-policy` |
    | Auflösung geheimer Eingaben | `openclaw/plugin-sdk/secret-input-runtime` |
    | Modell-/Sitzungs-Overrides | `openclaw/plugin-sdk/model-session-runtime` |

    Gebündelte Plugins und ihre Tests sind per Scanner gegen das breite
    Barrel abgesichert, damit Imports und Mocks lokal bei dem Verhalten bleiben, das sie benötigen. Das breite
    Barrel existiert weiterhin für externe Kompatibilität, aber neuer Code sollte nicht
    davon abhängen.

  </Step>

  <Step title="Eingebettete Tool-Ergebnis-Erweiterungen zu Middleware migrieren">
    Gebündelte Plugins müssen nur für den eingebetteten Runner gedachte
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

  <Step title="Genehmigungsnative Handler zu Capability-Fakten migrieren">
    Genehmigungsfähige Channel-Plugins stellen natives Genehmigungsverhalten jetzt über
    `approvalCapability.nativeRuntime` plus die gemeinsame Runtime-Kontext-Registry bereit.

    Wichtige Änderungen:

    - Ersetzen Sie `approvalCapability.handler.loadRuntime(...)` durch
      `approvalCapability.nativeRuntime`
    - Verschieben Sie genehmigungsspezifische Authentifizierung/Auslieferung von der alten `plugin.auth`- /
      `plugin.approvals`-Verdrahtung auf `approvalCapability`
    - `ChannelPlugin.approvals` wurde aus dem öffentlichen Channel-Plugin-
      Vertrag entfernt; verschieben Sie Delivery-/Native-/Render-Felder auf `approvalCapability`
    - `plugin.auth` bleibt nur für Channel-Login-/Logout-Flows bestehen; Approval-Auth-
      Hooks dort werden vom Core nicht mehr gelesen
    - Registrieren Sie Channel-eigene Runtime-Objekte wie Clients, Tokens oder Bolt-
      Apps über `openclaw/plugin-sdk/channel-runtime-context`
    - Senden Sie keine Plugin-eigenen Umleitungsbenachrichtigungen aus nativen Genehmigungs-Handlern;
      Core besitzt jetzt Anderweitig-geroutet-Benachrichtigungen aus tatsächlichen Auslieferungsergebnissen
    - Wenn Sie `channelRuntime` an `createChannelManager(...)` übergeben, stellen Sie eine
      echte `createPluginRuntime().channel`-Oberfläche bereit. Teilweise Stubs werden abgelehnt.

    Siehe `/plugins/sdk-channel-plugins` für das aktuelle Layout der Approval-Capability.

  </Step>

  <Step title="Fallback-Verhalten des Windows-Wrappers auditieren">
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

    Für hostseitige Helper verwenden Sie die injizierte Plugin-Runtime, statt
    direkt zu importieren:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    Dasselbe Muster gilt für andere Legacy-Bridge-Hilfsfunktionen:

    | Alter Import | Modernes Äquivalent |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | Hilfsfunktionen für den Sitzungsspeicher | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Ersetzen breiter infra-runtime-Importe">
    `openclaw/plugin-sdk/infra-runtime` existiert weiterhin für externe
    Kompatibilität, aber neuer Code sollte die fokussierte Hilfsoberfläche
    importieren, die er tatsächlich benötigt:

    | Bedarf | Import |
    | --- | --- |
    | Hilfsfunktionen für die Systemereignis-Warteschlange | `openclaw/plugin-sdk/system-event-runtime` |
    | Hilfsfunktionen für Heartbeat-Wecken, Ereignisse und Sichtbarkeit | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Abarbeitung der Warteschlange für ausstehende Zustellungen | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetrie für Kanalaktivität | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-Memory-Dedupe-Caches | `openclaw/plugin-sdk/dedupe-runtime` |
    | Sichere Hilfsfunktionen für lokale Datei-/Medienpfade | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-bewusstes Fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Hilfsfunktionen für Proxy und geschütztes Fetch | `openclaw/plugin-sdk/fetch-runtime` |
    | Richtlinientypen für den SSRF-Dispatcher | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typen für Genehmigungsanfrage/-auflösung | `openclaw/plugin-sdk/approval-runtime` |
    | Hilfsfunktionen für Genehmigungsantwort-Payload und Befehle | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Hilfsfunktionen zur Fehlerformatierung | `openclaw/plugin-sdk/error-runtime` |
    | Wartevorgänge für Transportbereitschaft | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Hilfsfunktionen für sichere Token | `openclaw/plugin-sdk/secure-random-runtime` |
    | Begrenzte Nebenläufigkeit asynchroner Aufgaben | `openclaw/plugin-sdk/concurrency-runtime` |
    | Numerische Erzwingung | `openclaw/plugin-sdk/number-runtime` |
    | Prozesslokale asynchrone Sperre | `openclaw/plugin-sdk/async-lock-runtime` |
    | Dateisperren | `openclaw/plugin-sdk/file-lock` |

    Gebündelte Plugins werden per Scanner gegen `infra-runtime` abgesichert,
    sodass Repo-Code nicht auf den breiten Barrel zurückfallen kann.

  </Step>

  <Step title="Migrieren von Kanalrouten-Hilfsfunktionen">
    Neuer Kanalrouten-Code sollte `openclaw/plugin-sdk/channel-route` verwenden.
    Die älteren Namen für Route-Key und Comparable-Target bleiben während des
    Migrationsfensters als Kompatibilitätsaliase erhalten, aber neue Plugins
    sollten die Routennamen verwenden, die das Verhalten direkt beschreiben:

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

    Fügen Sie keine neuen Verwendungen von `ChannelMessagingAdapter.parseExplicitTarget` oder
    der parsergestützten Hilfsfunktionen für geladene Routen (`parseExplicitTargetForLoadedChannel`
    oder `resolveRouteTargetForLoadedChannel`) oder
    `resolveChannelRouteTargetWithParser(...)` aus `plugin-sdk/channel-route` hinzu.
    Diese Hooks sind veraltet und bleiben nur für ältere Plugins während des
    Migrationsfensters erhalten. Neue Kanal-Plugins sollten
    `messaging.targetResolver.resolveTarget(...)` für die Normalisierung der Ziel-ID
    und den Fallback bei Verzeichnis-Fehltreffern verwenden,
    `messaging.inferTargetChatType(...)`, wenn der Core frühzeitig eine Peer-Art
    benötigt, und `messaging.resolveOutboundSessionRoute(...)`
    für Provider-native Sitzungs- und Thread-Identität.

  </Step>

  <Step title="Erstellen und testen">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referenz für Importpfade

  <Accordion title="Tabelle gängiger Importpfade">
  | Importpfad | Zweck | Wichtige Exporte |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonischer Helfer für Plugin-Einstiege | `definePluginEntry` |
  | `plugin-sdk/core` | Legacy-Sammel-Re-Export für Channel-Einstiegsdefinitionen/-Builder | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export des Root-Konfigurationsschemas | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Einstiegshilfe für Einzel-Provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Fokussierte Channel-Einstiegsdefinitionen und Builder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gemeinsame Helfer für den Setup-Assistenten | Setup-Übersetzer, Allowlist-Prompts, Builder für Setup-Status |
  | `plugin-sdk/setup-runtime` | Runtime-Helfer für die Setup-Zeit | `createSetupTranslator`, importsichere Setup-Patch-Adapter, Lookup-Notiz-Helfer, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Setup-Proxys |
  | `plugin-sdk/setup-adapter-runtime` | Veralteter Alias für Setup-Adapter | Verwenden Sie `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Helfer für Setup-Tools | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Helfer für mehrere Konten | Helfer für Kontoliste/Konfiguration/Aktions-Gate |
  | `plugin-sdk/account-id` | Helfer für Konto-IDs | `DEFAULT_ACCOUNT_ID`, Normalisierung von Konto-IDs |
  | `plugin-sdk/account-resolution` | Helfer für Kontosuche | Kontosuche und Helfer für Default-Fallbacks |
  | `plugin-sdk/account-helpers` | Schmale Kontohelfer | Helfer für Kontolisten/Kontoaktionen |
  | `plugin-sdk/channel-setup` | Adapter für den Setup-Assistenten | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard` sowie `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitive für DM-Pairing | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Verkabelung für Antwortpräfix, Tippen und Quellzustellung | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabriken für Konfigurationsadapter und Helfer für DM-Zugriff | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Builder für Konfigurationsschemas | Gemeinsame Primitive für Channel-Konfigurationsschemas und nur der generische Builder |
  | `plugin-sdk/bundled-channel-config-schema` | Gebündelte Konfigurationsschemas | Nur von OpenClaw gepflegte gebündelte Plugins; neue Plugins müssen Plugin-lokale Schemas definieren |
  | `plugin-sdk/channel-config-schema-legacy` | Veraltete gebündelte Konfigurationsschemas | Nur Kompatibilitätsalias; verwenden Sie `plugin-sdk/bundled-channel-config-schema` für gepflegte gebündelte Plugins |
  | `plugin-sdk/telegram-command-config` | Helfer für Telegram-Befehlskonfiguration | Normalisierung von Befehlsnamen, Kürzen von Beschreibungen, Validierung von Duplikaten/Konflikten |
  | `plugin-sdk/channel-policy` | Auflösung von Gruppen-/DM-Richtlinien | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Veraltete Kompatibilitätsfassade | Verwenden Sie `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Helfer für eingehende Envelopes | Gemeinsame Helfer für Route und Envelope-Builder |
  | `plugin-sdk/channel-inbound` | Helfer für eingehenden Empfang | Kontextaufbau, Formatierung, Roots, Runner, vorbereitete Antwort-Dispatches und Dispatch-Prädikate |
  | `plugin-sdk/messaging-targets` | Veralteter Importpfad für Ziel-Parsing | Verwenden Sie `plugin-sdk/channel-targets` für generische Helfer zum Ziel-Parsing, `plugin-sdk/channel-route` für Routenvergleich und Plugin-eigene `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` für Provider-spezifische Zielauflösung |
  | `plugin-sdk/outbound-media` | Helfer für ausgehende Medien | Gemeinsames Laden ausgehender Medien |
  | `plugin-sdk/outbound-send-deps` | Veraltete Kompatibilitätsfassade | Verwenden Sie `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Helfer für den Lebenszyklus ausgehender Nachrichten | Nachrichtenadapter, Empfangsbelege, Helfer für dauerhaften Versand, Live-Vorschau-/Streaming-Helfer, Antwortoptionen, Lebenszyklushelfer, ausgehende Identität und Payload-Planung |
  | `plugin-sdk/channel-streaming` | Veraltete Kompatibilitätsfassade | Verwenden Sie `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Veraltete Kompatibilitätsfassade | Verwenden Sie `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Helfer für Thread-Bindings | Lebenszyklus- und Adapterhelfer für Thread-Bindings |
  | `plugin-sdk/agent-media-payload` | Legacy-Helfer für Medien-Payloads | Builder für Agent-Medien-Payloads für Legacy-Feldlayouts |
  | `plugin-sdk/channel-runtime` | Veralteter Kompatibilitäts-Shim | Nur Legacy-Channel-Runtime-Utilities |
  | `plugin-sdk/channel-send-result` | Typen für Sendeergebnisse | Typen für Antwortergebnisse |
  | `plugin-sdk/runtime-store` | Persistenter Plugin-Speicher | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Breite Runtime-Helfer | Helfer für Runtime/Logging/Backup/Plugin-Installation |
  | `plugin-sdk/runtime-env` | Schmale Helfer für Runtime-Umgebung | Logger-/Runtime-Umgebung, Timeout-, Retry- und Backoff-Helfer |
  | `plugin-sdk/plugin-runtime` | Gemeinsame Plugin-Runtime-Helfer | Helfer für Plugin-Befehle/Hooks/HTTP/Interaktion |
  | `plugin-sdk/hook-runtime` | Helfer für Hook-Pipelines | Gemeinsame Helfer für Webhook-/interne Hook-Pipelines |
  | `plugin-sdk/lazy-runtime` | Lazy-Runtime-Helfer | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Prozesshelfer | Gemeinsame Exec-Helfer |
  | `plugin-sdk/cli-runtime` | CLI-Runtime-Helfer | Befehlsformatierung, Wartevorgänge, Versionshelfer |
  | `plugin-sdk/gateway-runtime` | Gateway-Helfer | Gateway-Client, Starthelfer für Event-Loop-Bereitschaft, Auflösung des angekündigten LAN-Hosts und Patch-Helfer für Channel-Status |
  | `plugin-sdk/config-runtime` | Veralteter Kompatibilitäts-Shim für Konfiguration | Bevorzugen Sie `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` und `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Helfer für Telegram-Befehle | Fallback-stabile Helfer zur Validierung von Telegram-Befehlen, wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
  | `plugin-sdk/approval-runtime` | Helfer für Genehmigungs-Prompts | Exec-/Plugin-Genehmigungs-Payload, Helfer für Genehmigungsfähigkeit/-profil, natives Genehmigungsrouting/Runtime-Helfer und strukturierte Formatierung von Genehmigungsanzeigepfaden |
  | `plugin-sdk/approval-auth-runtime` | Helfer für Genehmigungs-Auth | Auflösung von Genehmigenden, Auth für Aktionen im selben Chat |
  | `plugin-sdk/approval-client-runtime` | Helfer für Genehmigungsclients | Native Exec-Genehmigungsprofil-/Filterhelfer |
  | `plugin-sdk/approval-delivery-runtime` | Helfer für Genehmigungszustellung | Native Adapter für Genehmigungsfähigkeit/-zustellung |
  | `plugin-sdk/approval-gateway-runtime` | Helfer für Approval-Gateway | Gemeinsamer Helfer zur Approval-Gateway-Auflösung |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helfer für Genehmigungsadapter | Leichtgewichtige Ladehelfer für native Genehmigungsadapter für heiße Channel-Einstiegspunkte |
  | `plugin-sdk/approval-handler-runtime` | Helfer für Genehmigungshandler | Breitere Runtime-Helfer für Genehmigungshandler; bevorzugen Sie die schmaleren Adapter-/Gateway-Schnittstellen, wenn sie ausreichen |
  | `plugin-sdk/approval-native-runtime` | Helfer für Genehmigungsziele | Native Helfer für Genehmigungsziel-/Kontobindung |
  | `plugin-sdk/approval-reply-runtime` | Helfer für Genehmigungsantworten | Helfer für Exec-/Plugin-Genehmigungsantwort-Payloads |
  | `plugin-sdk/channel-runtime-context` | Helfer für Channel-Runtime-Kontext | Generische Helfer zum Registrieren/Abrufen/Beobachten von Channel-Runtime-Kontexten |
  | `plugin-sdk/security-runtime` | Sicherheitshelfer | Gemeinsame Helfer für Vertrauen, DM-Gating, Root-begrenzte Dateien/Pfade, externe Inhalte und Secret-Sammlung |
  | `plugin-sdk/ssrf-policy` | Helfer für SSRF-Richtlinien | Helfer für Host-Allowlist und Richtlinien für private Netzwerke |
  | `plugin-sdk/ssrf-runtime` | SSRF-Runtime-Helfer | Pinned Dispatcher, geschützter Fetch, Helfer für SSRF-Richtlinien |
  | `plugin-sdk/system-event-runtime` | Helfer für Systemereignisse | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat-Helfer | Helfer für Heartbeat-Wake, -Ereignis und -Sichtbarkeit |
  | `plugin-sdk/delivery-queue-runtime` | Helfer für Zustellwarteschlangen | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helfer für Channel-Aktivität | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Dedupe-Helfer | In-Memory-Dedupe-Caches |
  | `plugin-sdk/file-access-runtime` | Helfer für Dateizugriff | Sichere Helfer für lokale Datei-/Medienpfade |
  | `plugin-sdk/transport-ready-runtime` | Helfer für Transportbereitschaft | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Helfer für Exec-Genehmigungsrichtlinien | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Helfer für begrenzte Caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helfer für Diagnose-Gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helfer für Fehlerformatierung | `formatUncaughtError`, `isApprovalNotFoundError`, Fehlergraph-Helfer |
  | `plugin-sdk/fetch-runtime` | Helfer für umschlossenen Fetch/Proxy | `resolveFetch`, Proxy-Helfer, Optionshelfer für EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Helfer für Host-Normalisierung | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Retry-Helfer | `RetryConfig`, `retryAsync`, Richtlinien-Runner |
  | `plugin-sdk/allow-from` | Allowlist-Formatierung und Eingabezuordnung | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Befehls-Gating und Helfer für Befehlsoberflächen | `resolveControlCommandGate`, Helfer für Senderautorisierung, Befehlsregistry-Helfer einschließlich Formatierung dynamischer Argumentmenüs |
  | `plugin-sdk/command-status` | Renderer für Befehlsstatus/-hilfe | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing von Secret-Eingaben | Helfer für Secret-Eingaben |
  | `plugin-sdk/webhook-ingress` | Helfer für Webhook-Anfragen | Webhook-Ziel-Utilities |
  | `plugin-sdk/webhook-request-guards` | Helfer für Webhook-Body-Guards | Helfer für Lesen/Limitieren von Request-Bodies |
  | `plugin-sdk/reply-runtime` | Gemeinsame Antwort-Runtime | Eingehender Dispatch, Heartbeat, Antwortplaner, Chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Schmale Helfer für Antwort-Dispatch | Finalisieren, Provider-Dispatch und Helfer für Konversationslabels |
  | `plugin-sdk/reply-history` | Helfer für Antwortverlauf | `createChannelHistoryWindow`; veraltete Kompatibilitätsexporte für Map-Helfer wie `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planung von Antwortreferenzen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helfer für Antwort-Chunks | Helfer für Text-/Markdown-Chunking |
  | `plugin-sdk/session-store-runtime` | Helfer für Session-Speicher | Speicherpfad und updated-at-Helfer |
  | `plugin-sdk/state-paths` | Helfer für State-Pfade | Helfer für State- und OAuth-Verzeichnisse |
  | `plugin-sdk/routing` | Routing-/Sitzungsschlüssel-Hilfsfunktionen | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, Hilfsfunktionen zur Sitzungsschlüssel-Normalisierung |
  | `plugin-sdk/status-helpers` | Kanalstatus-Hilfsfunktionen | Builder für Kanal-/Kontostatus-Zusammenfassungen, Standardwerte für Laufzeitstatus, Hilfsfunktionen für Problemmetadaten |
  | `plugin-sdk/target-resolver-runtime` | Zielauflöser-Hilfsfunktionen | Gemeinsame Zielauflöser-Hilfsfunktionen |
  | `plugin-sdk/string-normalization-runtime` | Hilfsfunktionen zur Zeichenketten-Normalisierung | Hilfsfunktionen zur Slug-/Zeichenketten-Normalisierung |
  | `plugin-sdk/request-url` | Anfrage-URL-Hilfsfunktionen | Zeichenketten-URLs aus anfrageähnlichen Eingaben extrahieren |
  | `plugin-sdk/run-command` | Hilfsfunktionen für zeitbegrenzte Befehle | Zeitbegrenzter Befehls-Runner mit normalisiertem stdout/stderr |
  | `plugin-sdk/param-readers` | Parameterleser | Gemeinsame Tool-/CLI-Parameterleser |
  | `plugin-sdk/tool-payload` | Tool-Payload-Extraktion | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
  | `plugin-sdk/tool-send` | Tool-Sendeextraktion | Kanonische Send-Zielfelder aus Tool-Argumenten extrahieren |
  | `plugin-sdk/temp-path` | Hilfsfunktionen für temporäre Pfade | Gemeinsame Hilfsfunktionen für temporäre Download-Pfade |
  | `plugin-sdk/logging-core` | Logging-Hilfsfunktionen | Subsystem-Logger und Redaktions-Hilfsfunktionen |
  | `plugin-sdk/markdown-table-runtime` | Markdown-Tabellen-Hilfsfunktionen | Hilfsfunktionen für Markdown-Tabellenmodi |
  | `plugin-sdk/reply-payload` | Nachricht-Antworttypen | Antwort-Payload-Typen |
  | `plugin-sdk/provider-setup` | Kuratierte Hilfsfunktionen für lokales/selbstgehostetes Provider-Setup | Hilfsfunktionen für Erkennung/Konfiguration selbstgehosteter Provider |
  | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Hilfsfunktionen für OpenAI-kompatibles selbstgehostetes Provider-Setup | Dieselben Hilfsfunktionen für Erkennung/Konfiguration selbstgehosteter Provider |
  | `plugin-sdk/provider-auth-runtime` | Hilfsfunktionen für Provider-Laufzeit-Authentifizierung | Hilfsfunktionen zur Laufzeitauflösung von API-Schlüsseln |
  | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen für Provider-API-Schlüssel-Setup | Hilfsfunktionen für API-Schlüssel-Onboarding/Profilschreiben |
  | `plugin-sdk/provider-auth-result` | Hilfsfunktionen für Provider-Authentifizierungsergebnisse | Standard-Builder für OAuth-Authentifizierungsergebnisse |
  | `plugin-sdk/provider-selection-runtime` | Hilfsfunktionen zur Provider-Auswahl | Konfigurierte oder automatische Provider-Auswahl und Zusammenführung roher Provider-Konfiguration |
  | `plugin-sdk/provider-env-vars` | Hilfsfunktionen für Provider-Umgebungsvariablen | Hilfsfunktionen für die Suche nach Provider-Authentifizierungs-Umgebungsvariablen |
  | `plugin-sdk/provider-model-shared` | Gemeinsame Hilfsfunktionen für Provider-Modelle/Replays | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Builder für Replay-Richtlinien, Provider-Endpunkt-Hilfsfunktionen und Hilfsfunktionen zur Modell-ID-Normalisierung |
  | `plugin-sdk/provider-catalog-shared` | Gemeinsame Hilfsfunktionen für Provider-Kataloge | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Provider-Onboarding-Patches | Hilfsfunktionen für Onboarding-Konfiguration |
  | `plugin-sdk/provider-http` | Provider-HTTP-Hilfsfunktionen | Generische Provider-HTTP-/Endpunkt-Capability-Hilfsfunktionen, einschließlich Multipart-Formular-Hilfsfunktionen für Audiotranskription |
  | `plugin-sdk/provider-web-fetch` | Hilfsfunktionen für Provider-Webabruf | Hilfsfunktionen für Registrierung/Cache von Webabruf-Providern |
  | `plugin-sdk/provider-web-search-config-contract` | Hilfsfunktionen für Provider-Websuche-Konfiguration | Schmale Websuche-Konfigurations-/Anmeldeinformations-Hilfsfunktionen für Provider, die keine Plugin-Aktivierungsverdrahtung benötigen |
  | `plugin-sdk/provider-web-search-contract` | Hilfsfunktionen für Provider-Websuche-Vertrag | Schmale Vertrags-Hilfsfunktionen für Websuche-Konfiguration/Anmeldeinformationen wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` sowie bereichsbezogene Setter/Getter für Anmeldeinformationen |
  | `plugin-sdk/provider-web-search` | Hilfsfunktionen für Provider-Websuche | Hilfsfunktionen für Registrierung/Cache/Laufzeit von Websuche-Providern |
  | `plugin-sdk/provider-tools` | Hilfsfunktionen für Provider-Tool-/Schema-Kompatibilität | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` und DeepSeek/Gemini/OpenAI-Schema-Bereinigung + Diagnosen |
  | `plugin-sdk/provider-usage` | Provider-Nutzungshilfsfunktionen | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` und weitere Provider-Nutzungshilfsfunktionen |
  | `plugin-sdk/provider-stream` | Hilfsfunktionen für Provider-Stream-Wrapper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen und gemeinsame Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot-Wrapper-Hilfsfunktionen |
  | `plugin-sdk/provider-transport-runtime` | Hilfsfunktionen für Provider-Transport | Native Provider-Transport-Hilfsfunktionen wie abgesicherter Abruf, Textextraktion aus Tool-Ergebnissen, Transformationen von Transportnachrichten und beschreibbare Transport-Ereignisstreams |
  | `plugin-sdk/keyed-async-queue` | Geordnete asynchrone Warteschlange | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gemeinsame Medien-Hilfsfunktionen | Hilfsfunktionen für Medienabruf/-transformation/-speicherung, ffprobe-gestützte Prüfung von Videodimensionen und Medien-Payload-Builder |
  | `plugin-sdk/media-generation-runtime` | Gemeinsame Hilfsfunktionen für Mediengenerierung | Gemeinsame Failover-Hilfsfunktionen, Kandidatenauswahl und Meldungen zu fehlenden Modellen für Bild-/Video-/Musikgenerierung |
  | `plugin-sdk/media-understanding` | Hilfsfunktionen für Medienverständnis | Provider-Typen für Medienverständnis plus Provider-seitige Exportfunktionen für Bild-/Audio-Hilfsfunktionen |
  | `plugin-sdk/text-runtime` | Veralteter breiter Textkompatibilitäts-Export | Verwenden Sie `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` und `logging-core` |
  | `plugin-sdk/text-chunking` | Hilfsfunktionen für Textsegmentierung | Hilfsfunktion für ausgehende Textsegmentierung |
  | `plugin-sdk/speech` | Sprach-Hilfsfunktionen | Sprach-Provider-Typen plus Provider-seitige Direktiven-, Registrierungs- und Validierungs-Hilfsfunktionen sowie OpenAI-kompatibler TTS-Builder |
  | `plugin-sdk/speech-core` | Gemeinsamer Sprachkern | Sprach-Provider-Typen, Registry, Direktiven, Normalisierung |
  | `plugin-sdk/realtime-transcription` | Echtzeit-Transkriptions-Hilfsfunktionen | Provider-Typen, Registry-Hilfsfunktionen und gemeinsame WebSocket-Sitzungs-Hilfsfunktion |
  | `plugin-sdk/realtime-voice` | Echtzeit-Sprach-Hilfsfunktionen | Provider-Typen, Registry-/Auflösungs-Hilfsfunktionen, Bridge-Sitzungs-Hilfsfunktionen, gemeinsame Agent-Rücksprechwarteschlangen, Sprachsteuerung aktiver Ausführungen, Transkript-/Ereigniszustand, Echounterdrückung, Abgleich von Konsultationsfragen, Koordination erzwungener Konsultationen, Verfolgung des Gesprächskontexts, Verfolgung von Ausgabeaktivität und schnelle Kontextkonsultations-Hilfsfunktionen |
  | `plugin-sdk/image-generation` | Bildgenerierungs-Hilfsfunktionen | Bildgenerierungs-Provider-Typen plus Hilfsfunktionen für Bildassets/Daten-URLs und der OpenAI-kompatible Bild-Provider-Builder |
  | `plugin-sdk/image-generation-core` | Gemeinsamer Bildgenerierungskern | Bildgenerierungstypen, Failover, Authentifizierung und Registry-Hilfsfunktionen |
  | `plugin-sdk/music-generation` | Musikgenerierungs-Hilfsfunktionen | Musikgenerierungs-Provider-/Anfrage-/Ergebnistypen |
  | `plugin-sdk/music-generation-core` | Gemeinsamer Musikgenerierungskern | Musikgenerierungstypen, Failover-Hilfsfunktionen, Provider-Suche und Modellreferenz-Parsing |
  | `plugin-sdk/video-generation` | Videogenerierungs-Hilfsfunktionen | Videogenerierungs-Provider-/Anfrage-/Ergebnistypen |
  | `plugin-sdk/video-generation-core` | Gemeinsamer Videogenerierungskern | Videogenerierungstypen, Failover-Hilfsfunktionen, Provider-Suche und Modellreferenz-Parsing |
  | `plugin-sdk/interactive-runtime` | Interaktive Antwort-Hilfsfunktionen | Normalisierung/Reduktion interaktiver Antwort-Payloads |
  | `plugin-sdk/channel-config-primitives` | Primitive für Kanalkonfiguration | Schmale Primitive für Kanalkonfigurationsschemas |
  | `plugin-sdk/channel-config-writes` | Hilfsfunktionen für Kanalkonfigurations-Schreibvorgänge | Hilfsfunktionen zur Autorisierung von Kanalkonfigurations-Schreibvorgängen |
  | `plugin-sdk/channel-plugin-common` | Gemeinsames Kanal-Prelude | Gemeinsame Exporte für Kanal-Plugin-Prelude |
  | `plugin-sdk/channel-status` | Kanalstatus-Hilfsfunktionen | Gemeinsame Hilfsfunktionen für Kanalstatus-Snapshot/-Zusammenfassung |
  | `plugin-sdk/allowlist-config-edit` | Allowlist-Konfigurations-Hilfsfunktionen | Hilfsfunktionen zum Bearbeiten/Lesen von Allowlist-Konfiguration |
  | `plugin-sdk/group-access` | Gruppenzugriffs-Hilfsfunktionen | Gemeinsame Entscheidungs-Hilfsfunktionen für Gruppenzugriff |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Veraltete Kompatibilitätsfassaden | Verwenden Sie `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Direct-DM-Schutz-Hilfsfunktionen | Schmale Schutzrichtlinien-Hilfsfunktionen vor Krypto |
  | `plugin-sdk/extension-shared` | Gemeinsame Erweiterungs-Hilfsfunktionen | Primitive für passive Kanal-/Status- und Ambient-Proxy-Hilfsfunktionen |
  | `plugin-sdk/webhook-targets` | Webhook-Ziel-Hilfsfunktionen | Webhook-Ziel-Registry und Hilfsfunktionen zur Routeninstallation |
  | `plugin-sdk/webhook-path` | Veralteter Webhook-Pfadalias | Verwenden Sie `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Gemeinsame Webmedien-Hilfsfunktionen | Hilfsfunktionen zum Laden entfernter/lokaler Medien |
  | `plugin-sdk/zod` | Veralteter Zod-Kompatibilitäts-Reexport | Importieren Sie `zod` direkt aus `zod` |
  | `plugin-sdk/memory-core` | Gebündelte Memory-Core-Hilfsfunktionen | Oberfläche für Speicher-Manager-/Konfigurations-/Datei-/CLI-Hilfsfunktionen |
  | `plugin-sdk/memory-core-engine-runtime` | Laufzeitfassade für Speicher-Engine | Laufzeitfassade für Speicherindex/-suche |
  | `plugin-sdk/memory-core-host-embedding-registry` | Speicher-Embedding-Registry | Leichtgewichtige Registry-Hilfsfunktionen für Speicher-Embedding-Provider |
  | `plugin-sdk/memory-core-host-engine-foundation` | Speicher-Host-Foundation-Engine | Exporte der Speicher-Host-Foundation-Engine |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Speicher-Host-Embedding-Engine | Speicher-Embedding-Verträge, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Hilfsfunktionen; konkrete Remote-Provider leben in ihren besitzenden Plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | Speicher-Host-QMD-Engine | Exporte der Speicher-Host-QMD-Engine |
  | `plugin-sdk/memory-core-host-engine-storage` | Speicher-Host-Speicher-Engine | Exporte der Speicher-Host-Speicher-Engine |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodale Speicher-Host-Hilfsfunktionen | Multimodale Speicher-Host-Hilfsfunktionen |
  | `plugin-sdk/memory-core-host-query` | Speicher-Host-Abfrage-Hilfsfunktionen | Speicher-Host-Abfrage-Hilfsfunktionen |
  | `plugin-sdk/memory-core-host-secret` | Speicher-Host-Geheimnis-Hilfsfunktionen | Speicher-Host-Geheimnis-Hilfsfunktionen |
  | `plugin-sdk/memory-core-host-events` | Veralteter Speicherereignis-Alias | Verwenden Sie `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Speicher-Host-Status-Hilfsfunktionen | Speicher-Host-Status-Hilfsfunktionen |
  | `plugin-sdk/memory-core-host-runtime-cli` | Speicher-Host-CLI-Laufzeit | Hilfsfunktionen für Speicher-Host-CLI-Laufzeit |
  | `plugin-sdk/memory-core-host-runtime-core` | Speicher-Host-Kernlaufzeit | Hilfsfunktionen für Speicher-Host-Kernlaufzeit |
  | `plugin-sdk/memory-core-host-runtime-files` | Speicher-Host-Datei-/Laufzeit-Hilfsfunktionen | Speicher-Host-Datei-/Laufzeit-Hilfsfunktionen |
  | `plugin-sdk/memory-host-core` | Alias für Speicher-Host-Kernlaufzeit | Vendor-neutraler Alias für Hilfsfunktionen der Speicher-Host-Kernlaufzeit |
  | `plugin-sdk/memory-host-events` | Alias für Speicher-Host-Ereignisjournal | Vendor-neutraler Alias für Speicher-Host-Ereignisjournal-Hilfsfunktionen |
  | `plugin-sdk/memory-host-files` | Veralteter Speicher-Datei-/Laufzeit-Alias | Verwenden Sie `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Managed-Markdown-Hilfsfunktionen | Gemeinsame Managed-Markdown-Hilfsfunktionen für speichernahe Plugins |
  | `plugin-sdk/memory-host-search` | Active Memory-Suchfassade | Lazy-Laufzeitfassade für Active Memory-Suchmanager |
  | `plugin-sdk/memory-host-status` | Veralteter Speicher-Host-Status-Alias | Verwenden Sie `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Testhilfsprogramme | Repo-lokales veraltetes Kompatibilitäts-Barrel; verwenden Sie fokussierte repo-lokale Test-Unterpfade wie `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` und `plugin-sdk/test-fixtures` |
</Accordion>

Diese Tabelle ist absichtlich die gemeinsame Migrations-Teilmenge, nicht die vollständige SDK-Oberfläche. Das Inventar der Compiler-Einstiegspunkte befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`; Paket-Exporte werden aus der öffentlichen Teilmenge generiert.

Reservierte Hilfs-Schnittstellen für gebündelte Plugins wurden aus der öffentlichen SDK-Export-Map entfernt, außer ausdrücklich dokumentierten Kompatibilitäts-Fassaden wie dem veralteten Shim `plugin-sdk/discord`, der für das veröffentlichte Paket
`@openclaw/discord@2026.3.13` beibehalten wird. Eigentümerspezifische Hilfsfunktionen befinden sich im jeweiligen Plugin-Paket; gemeinsames Host-Verhalten sollte über generische SDK-Verträge wie `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` und `plugin-sdk/plugin-config-runtime` laufen.

Verwenden Sie den engsten Import, der zur Aufgabe passt. Wenn Sie keinen Export finden, prüfen Sie den Quellcode unter `src/plugin-sdk/` oder fragen Sie die Maintainer, welcher generische Vertrag dafür zuständig sein sollte.

## Aktive Deprecations

Engere Deprecations, die über das Plugin-SDK, den Provider-Vertrag, die Runtime-Oberfläche und das Manifest hinweg gelten. Jede davon funktioniert heute noch, wird aber in einem zukünftigen Major-Release entfernt. Der Eintrag unter jedem Punkt ordnet die alte API ihrem kanonischen Ersatz zu.

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
    einzelnes Entscheidungsobjekt statt zwei getrennter Aufrufe zurück.

    Nachgelagerte Channel-Plugins (Slack, Discord, Matrix, MS Teams) wurden
    bereits umgestellt.

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` ist ein Kompatibilitäts-Shim für ältere
    Channel-Plugins. Importieren Sie ihn nicht in neuem Code; verwenden Sie
    `openclaw/plugin-sdk/channel-runtime-context`, um Runtime-Objekte zu
    registrieren.

    `channelActions*`-Hilfsfunktionen in `openclaw/plugin-sdk/channel-actions`
    sind zusammen mit rohen Channel-Exporten für „actions“ veraltet. Stellen Sie
    Fähigkeiten stattdessen über die semantische `presentation`-Oberfläche bereit -
    Channel-Plugins deklarieren, was sie rendern (Karten, Buttons, Auswahlfelder),
    statt welche rohen Action-Namen sie akzeptieren.

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **Alt**: `tool()`-Factory aus `openclaw/plugin-sdk/provider-web-search`.

    **Neu**: Implementieren Sie `createTool(...)` direkt im Provider-Plugin.
    OpenClaw benötigt die SDK-Hilfsfunktion nicht mehr, um den Tool-Wrapper zu
    registrieren.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **Alt**: `formatInboundEnvelope(...)` (und
    `ChannelMessageForAgent.channelEnvelope`), um aus eingehenden Channel-Nachrichten
    einen flachen Klartext-Prompt-Umschlag zu erstellen.

    **Neu**: `BodyForAgent` plus strukturierte Benutzerkontext-Blöcke. Channel-Plugins
    hängen Routing-Metadaten (Thread, Thema, Antwort-an, Reaktionen) als typisierte
    Felder an, statt sie zu einem Prompt-String zusammenzufügen. Die Hilfsfunktion
    `formatAgentEnvelope(...)` wird weiterhin für synthetisierte, an den Assistant
    gerichtete Umschläge unterstützt, aber eingehende Klartext-Umschläge werden
    auslaufen.

    Betroffene Bereiche: `inbound_claim`, `message_received` und jedes eigene
    Channel-Plugin, das `channelEnvelope`-Text nachverarbeitet hat.

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **Alt**: `api.on("deactivate", handler)`.

    **Neu**: `api.on("gateway_stop", handler)`. Ereignis und Kontext sind derselbe
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
    Kompatibilitätsalias verdrahtet.

  </Accordion>

  <Accordion title="subagent_spawning hook → core thread binding">
    **Alt**: `api.on("subagent_spawning", handler)` mit Rückgabe von
    `threadBindingReady` oder `deliveryOrigin`.

    **Neu**: Lassen Sie Core `thread: true`-Subagent-Bindungen über den
    Channel-Adapter für Sitzungsbindungen vorbereiten. Verwenden Sie
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
    veraltete Kompatibilitätsoberflächen erhalten, während externe Plugins migrieren.

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    Vier Discovery-Typaliasse sind jetzt dünne Wrapper über die Typen der
    Katalog-Ära:

    | Alter Alias               | Neuer Typ                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Dazu kommt der ältere statische Behälter `ProviderCapabilities` - Provider-Plugins
    sollten explizite Provider-Hooks wie `buildReplayPolicy`,
    `normalizeToolSchemas` und `wrapStreamFn` statt eines statischen Objekts verwenden.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **Alt** (drei separate Hooks auf `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` und
    `resolveDefaultThinkingLevel(ctx)`.

    **Neu**: ein einzelnes `resolveThinkingProfile(ctx)`, das ein
    `ProviderThinkingProfile` mit der kanonischen `id`, optionalem `label` und
    sortierter Level-Liste zurückgibt. OpenClaw stuft veraltete gespeicherte Werte
    automatisch anhand des Profilrangs herab.

    Der Kontext enthält `provider`, `modelId`, optional zusammengeführtes
    `reasoning` und optional zusammengeführte Modell-`compat`-Fakten. Provider-Plugins
    können diese Katalog-Fakten verwenden, um ein modellspezifisches Profil nur dann
    offenzulegen, wenn der konfigurierte Request-Vertrag es unterstützt.

    Implementieren Sie einen Hook statt drei. Die älteren Hooks funktionieren während
    des Deprecation-Fensters weiter, werden aber nicht mit dem Profilergebnis
    kombiniert.

  </Accordion>

  <Accordion title="External auth providers → contracts.externalAuthProviders">
    **Alt**: externe Auth-Hooks implementieren, ohne den Provider im Plugin-Manifest
    zu deklarieren.

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

    **Neu**: Spiegeln Sie denselben Env-Var-Lookup in `setup.providers[].envVars`
    im Manifest. Dadurch werden Setup-/Status-Env-Metadaten an einem Ort
    zusammengeführt, und das Starten der Plugin-Runtime nur zur Beantwortung von
    Env-Var-Lookups wird vermieden.

    `providerAuthEnvVars` bleibt über einen Kompatibilitätsadapter unterstützt,
    bis das Deprecation-Fenster geschlossen wird.

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **Alt**: drei separate Aufrufe -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Neu**: ein Aufruf auf der Memory-State-API -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Gleiche Slots, ein einzelner Registrierungsaufruf. Additive Prompt- und
    Corpus-Hilfsfunktionen (`registerMemoryPromptSupplement`,
    `registerMemoryCorpusSupplement`) sind nicht betroffen.

  </Accordion>

  <Accordion title="Memory embedding provider API">
    **Alt**: `api.registerMemoryEmbeddingProvider(...)` plus
    `contracts.memoryEmbeddingProviders`.

    **Neu**: `api.registerEmbeddingProvider(...)` plus
    `contracts.embeddingProviders`.

    Der generische Embedding-Provider-Vertrag ist außerhalb von Memory
    wiederverwendbar und der unterstützte Weg für neue Provider. Die
    Memory-spezifische Registrierungs-API bleibt als veraltete Kompatibilität
    verdrahtet, während bestehende Provider migrieren. Die Plugin-Inspektion meldet
    nicht gebündelte Nutzung als Kompatibilitätsschuld.

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    Zwei ältere Typaliasse werden weiterhin aus `src/plugins/runtime/types.ts`
    exportiert:

    | Alt                           | Neu                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Die Runtime-Methode `readSession` ist zugunsten von `getSessionMessages`
    veraltet. Gleiche Signatur; die alte Methode ruft die neue durch.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Alt**: `runtime.tasks.flow` (Singular) gab einen Live-TaskFlow-Accessor
    zurück.

    **Neu**: `runtime.tasks.managedFlows` behält die verwaltete TaskFlow-Mutations-Runtime
    für Plugins bei, die aus einem Flow heraus Child-Tasks erstellen, aktualisieren,
    abbrechen oder ausführen. Verwenden Sie `runtime.tasks.flows`, wenn das Plugin
    nur DTO-basierte Lesezugriffe benötigt.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    Oben in „So migrieren Sie → Eingebettete Tool-Result-Extensions zu Middleware
    migrieren“ behandelt. Der Vollständigkeit halber hier aufgenommen: Der entfernte,
    nur für Embedded-Runner bestimmte Pfad `api.registerEmbeddedExtensionFactory(...)`
    wird durch `api.registerAgentToolResultMiddleware(...)` mit einer expliziten
    Runtime-Liste in `contracts.agentToolResultMiddleware` ersetzt.
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
`extensions/`) werden in deren eigenen Barrels `api.ts` und `runtime-api.ts`
nachverfolgt. Sie betreffen keine Plugin-Verträge von Drittanbietern und sind hier
nicht aufgeführt. Wenn Sie das lokale Barrel eines gebündelten Plugins direkt
verwenden, lesen Sie vor dem Upgrade die Deprecation-Kommentare in diesem Barrel.
</Note>

## Zeitplan für die Entfernung

| Wann                   | Was passiert                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **Jetzt**              | Veraltete Schnittstellen geben Laufzeitwarnungen aus                    |
| **Nächstes Major-Release** | Veraltete Schnittstellen werden entfernt; Plugins, die sie weiterhin verwenden, schlagen fehl |

Alle Core-Plugins wurden bereits migriert. Externe Plugins sollten vor dem
nächsten Major-Release migrieren.

## Warnungen vorübergehend unterdrücken

Setzen Sie diese Umgebungsvariablen, während Sie an der Migration arbeiten:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dies ist ein temporärer Ausweg, keine dauerhafte Lösung.

## Verwandte Themen

- [Erste Schritte](/de/plugins/building-plugins) - Ihr erstes Plugin erstellen
- [SDK-Überblick](/de/plugins/sdk-overview) - vollständige Referenz für Subpath-Importe
- [Channel-Plugins](/de/plugins/sdk-channel-plugins) - Channel-Plugins erstellen
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) - Provider-Plugins erstellen
- [Plugin-Interna](/de/plugins/architecture) - ausführlicher Architekturüberblick
- [Plugin-Manifest](/de/plugins/manifest) - Referenz zum Manifest-Schema
