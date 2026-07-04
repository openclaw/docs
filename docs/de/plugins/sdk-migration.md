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
    generated_at: "2026-07-04T10:35:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7873de40aea56f456781ecf8ac9a4705c958030f7c68f8a112ad3f0fce62f078
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw ist von einer breiten Rückwärtskompatibilitätsschicht zu einer modernen Plugin-
Architektur mit fokussierten, dokumentierten Imports gewechselt. Wenn Ihr Plugin vor
der neuen Architektur gebaut wurde, hilft Ihnen dieser Leitfaden bei der Migration.

## Was sich ändert

Das alte Plugin-System stellte zwei weit offene Oberflächen bereit, über die Plugins
alles, was sie benötigten, von einem einzigen Einstiegspunkt importieren konnten:

- **`openclaw/plugin-sdk/compat`** - ein einzelner Import, der Dutzende
  Hilfsfunktionen erneut exportierte. Er wurde eingeführt, damit ältere Hook-basierte
  Plugins weiter funktionieren konnten, während die neue Plugin-Architektur aufgebaut wurde.
- **`openclaw/plugin-sdk/infra-runtime`** - ein breites Runtime-Hilfs-Barrel, das
  Systemereignisse, Heartbeat-Zustand, Zustellungswarteschlangen, Fetch-/Proxy-Hilfen,
  Dateihilfen, Freigabetypen und nicht verwandte Hilfsfunktionen mischte.
- **`openclaw/plugin-sdk/config-runtime`** - ein breites Konfigurations-Kompatibilitäts-Barrel,
  das während des Migrationsfensters weiterhin veraltete direkte Lade-/Schreibhilfen enthält.
- **`openclaw/extension-api`** - eine Brücke, die Plugins direkten Zugriff auf
  hostseitige Hilfen wie den eingebetteten Agent-Runner gab.
- **`api.registerEmbeddedExtensionFactory(...)`** - ein entfernter, nur für den Embedded Runner
  bestimmter Hook für gebündelte Extensions, der Embedded-Runner-Ereignisse wie
  `tool_result` beobachten konnte.

Die breiten Import-Oberflächen sind jetzt **veraltet**. Sie funktionieren zur Laufzeit
weiterhin, aber neue Plugins dürfen sie nicht verwenden, und bestehende Plugins sollten
vor der nächsten Hauptversion migrieren, in der sie entfernt werden. Die nur für den
Embedded Runner bestimmte Extension-Factory-Registrierungs-API wurde entfernt; verwenden
Sie stattdessen Tool-Result-Middleware.

OpenClaw entfernt oder interpretiert dokumentiertes Plugin-Verhalten nicht in derselben
Änderung neu, die einen Ersatz einführt. Vertragsbrechende Änderungen müssen zuerst
über einen Kompatibilitätsadapter, Diagnosen, Dokumentation und ein Deprecation-Fenster
laufen. Das gilt für SDK-Imports, Manifest-Felder, Setup-APIs, Hooks und das
Registrierungsverhalten zur Laufzeit.

<Warning>
  Die Rückwärtskompatibilitätsschicht wird in einer zukünftigen Hauptversion entfernt.
  Plugins, die weiterhin aus diesen Oberflächen importieren, werden dann nicht mehr funktionieren.
  Legacy-Registrierungen für eingebettete Extension-Factories werden bereits nicht mehr geladen.
</Warning>

## Warum sich das geändert hat

Der alte Ansatz verursachte Probleme:

- **Langsamer Start** - das Importieren einer Hilfsfunktion lud Dutzende nicht verwandter Module
- **Zirkuläre Abhängigkeiten** - breite Re-Exports machten es leicht, Importzyklen zu erzeugen
- **Unklare API-Oberfläche** - es war nicht erkennbar, welche Exporte stabil und welche intern waren

Das moderne Plugin-SDK behebt dies: Jeder Importpfad (`openclaw/plugin-sdk/\<subpath\>`)
ist ein kleines, eigenständiges Modul mit klarem Zweck und dokumentiertem Vertrag.

Legacy-Komfort-Schnittstellen für Provider in gebündelten Channels sind ebenfalls entfernt.
Channel-gebrandete Hilfsschnittstellen waren private Mono-Repo-Abkürzungen, keine stabilen
Plugin-Verträge. Verwenden Sie stattdessen enge generische SDK-Unterpfade. Innerhalb des
gebündelten Plugin-Workspace sollten Provider-eigene Hilfen in der eigenen `api.ts` oder
`runtime-api.ts` dieses Plugins bleiben.

Aktuelle Beispiele für gebündelte Provider:

- Anthropic hält Claude-spezifische Stream-Hilfen in seiner eigenen `api.ts`- /
  `contract-api.ts`-Schnittstelle
- OpenAI hält Provider-Builder, Default-Model-Hilfen und Realtime-Provider-
  Builder in seiner eigenen `api.ts`
- OpenRouter hält Provider-Builder und Onboarding-/Konfigurationshilfen in seiner eigenen
  `api.ts`

## Migrationsplan für Talk und Echtzeit-Sprache

Realtime-Voice-, Telefonie-, Meeting- und Browser-Talk-Code wird von
oberflächenlokaler Turn-Buchhaltung zu einem gemeinsamen Talk-Sitzungscontroller verschoben,
der von `openclaw/plugin-sdk/realtime-voice` exportiert wird. Der neue Controller verwaltet
den gemeinsamen Talk-Ereignisumschlag, den aktiven Turn-Zustand, den Capture-Zustand,
den Ausgabe-Audio-Zustand, den Verlauf der letzten Ereignisse und die Zurückweisung
veralteter Turns. Provider-Plugins sollten weiterhin anbieterspezifische Realtime-Sitzungen
verwalten; Oberflächen-Plugins sollten weiterhin Capture, Wiedergabe, Telefonie und
Meeting-Besonderheiten verwalten.

Diese Talk-Migration ist bewusst als sauberer Bruch angelegt:

1. Behalten Sie die gemeinsamen Controller-/Runtime-Primitiven in
   `plugin-sdk/realtime-voice`.
2. Verschieben Sie gebündelte Oberflächen auf den gemeinsamen Controller: Browser-Relay,
   Managed-Room-Handoff, Voice-Call-Realtime, Voice-Call-Streaming-STT, Google
   Meet-Realtime und natives Push-to-Talk.
3. Ersetzen Sie alte Talk-RPC-Familien durch die finale `talk.session.*`- und
   `talk.client.*`-API.
4. Veröffentlichen Sie einen Live-Talk-Ereigniskanal in Gateway
   `hello-ok.features.events`: `talk.event`.
5. Löschen Sie den alten Realtime-HTTP-Endpunkt und jeden Pfad für
   anfragezeitige Instruction-Overrides.

Neuer Code sollte `createTalkEventSequencer(...)` nicht direkt aufrufen, außer er
implementiert einen Low-Level-Adapter oder eine Test-Fixture. Bevorzugen Sie den
gemeinsamen Controller, damit turn-bezogene Ereignisse nicht ohne Turn-ID ausgegeben
werden können, veraltete `turnEnd`- / `turnCancel`-Aufrufe keinen neueren aktiven Turn
löschen können und Ausgabe-Audio-Lebenszyklusereignisse über Telefonie, Meetings,
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
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Browser-eigene WebRTC-/Provider-WebSocket-Sitzungen verwenden `talk.client.create`,
weil der Browser die Provider-Aushandlung und den Medientransport besitzt, während das
Gateway Zugangsdaten, Instructions und Tool-Policy besitzt. `talk.session.*` ist die
gemeinsame vom Gateway verwaltete Oberfläche für Gateway-Relay-Realtime,
Gateway-Relay-Transkription und Managed-Room-native STT/TTS-Sitzungen.

Legacy-Konfigurationen, die Realtime-Selektoren neben `talk.provider` /
`talk.providers` platziert haben, sollten mit `openclaw doctor --fix` repariert werden;
Runtime Talk interpretiert Speech-/TTS-Provider-Konfiguration nicht als
Realtime-Provider-Konfiguration neu.

Die unterstützten `talk.session.create`-Kombinationen sind bewusst klein:

| Modus           | Transport       | Brain           | Zuständig          | Hinweise                                                                                                           |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Full-Duplex-Provider-Audio wird über das Gateway gebrückt; Tool-Aufrufe werden über das agent-consult-Tool geroutet. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Nur Streaming-STT; Aufrufer senden Eingabeaudio und empfangen Transkriptereignisse.                                |
| `stt-tts`       | `managed-room`  | `agent-consult` | Nativer/Client-Raum | Räume im Push-to-Talk- und Walkie-Talkie-Stil, bei denen der Client Capture/Wiedergabe besitzt und das Gateway den Turn-Zustand besitzt. |
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

Das vereinheitlichte Kontrollvokabular ist ebenfalls bewusst eng gefasst:

  | Methode                         | Gilt für                                                | Vertrag                                                                                                                                                                                        |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Hängt einen base64-codierten PCM-Audio-Chunk an die Provider-Sitzung an, die derselben Gateway-Verbindung gehört.                                                                              |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Startet einen Nutzer-Turn in einem verwalteten Raum.                                                                                                                                           |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Beendet den aktiven Turn nach der Validierung auf veraltete Turns.                                                                                                                             |
  | `talk.session.cancelTurn`       | alle Gateway-eigenen Sitzungen                          | Bricht aktive Capture-/Provider-/Agent-/TTS-Arbeit für einen Turn ab.                                                                                                                          |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Stoppt die Audioausgabe des Assistant, ohne den Nutzer-Turn zwingend zu beenden.                                                                                                               |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Schließt einen vom Relay ausgegebenen Provider-Toolaufruf ab; übergeben Sie `options.willContinue` für Zwischenausgabe oder `options.suppressResponse`, um den Aufruf ohne weitere Assistant-Antwort zu erfüllen. |
  | `talk.session.steer`            | agentengestützte Talk-Sitzungen                         | Sendet gesprochene `status`-, `steer`-, `cancel`- oder `followup`-Steuerung an den aktiven eingebetteten Lauf, der aus der Talk-Sitzung aufgelöst wurde.                                      |
  | `talk.session.close`            | alle vereinheitlichten Sitzungen                        | Stoppt Relay-Sitzungen oder widerruft den Zustand des verwalteten Raums und vergisst anschließend die vereinheitlichte Sitzungs-ID.                                                            |

  Führen Sie keine Provider- oder Plattform-Sonderfälle im Core ein, damit dies funktioniert.
  Core besitzt die Semantik von Talk-Sitzungen. Provider-Plugins besitzen die Einrichtung von Vendor-Sitzungen.
  Sprachanruf und Google Meet besitzen Telefonie-/Meeting-Adapter. Browser und native
  Apps besitzen die UX für Geräteaufnahme und Wiedergabe.

  ## Kompatibilitätsrichtlinie

  Für externe Plugins folgt Kompatibilitätsarbeit dieser Reihenfolge:

  1. den neuen Vertrag hinzufügen
  2. das alte Verhalten über einen Kompatibilitätsadapter verdrahtet lassen
  3. eine Diagnose oder Warnung ausgeben, die den alten Pfad und den Ersatz benennt
  4. beide Pfade in Tests abdecken
  5. die Deprecation und den Migrationspfad dokumentieren
  6. erst nach dem angekündigten Migrationsfenster entfernen, üblicherweise in einem Major Release

  Maintainer können die aktuelle Migrationswarteschlange mit
  `pnpm plugins:boundary-report` prüfen. Verwenden Sie `pnpm plugins:boundary-report:summary` für
  kompakte Zählungen, `--owner <id>` für ein einzelnes Plugin oder einen Kompatibilitäts-Owner und
  `pnpm plugins:boundary-report:ci`, wenn ein CI-Gate bei fälligen
  Kompatibilitätseinträgen, ownerübergreifenden reservierten SDK-Importen oder ungenutzten reservierten SDK-
  Unterpfaden fehlschlagen soll. Der Bericht gruppiert veraltete
  Kompatibilitätseinträge nach Entfernungsdatum, zählt lokale Code-/Docs-Referenzen,
  zeigt ownerübergreifende reservierte SDK-Importe an und fasst die private
  Memory-Host-SDK-Bridge zusammen, damit Kompatibilitätsbereinigung explizit bleibt, statt sich
  auf Ad-hoc-Suchen zu verlassen. Reservierte SDK-Unterpfade müssen nachverfolgte Owner-Nutzung haben;
  ungenutzte reservierte Helper-Exports sollten aus dem öffentlichen SDK entfernt werden.

  Wenn ein Manifest-Feld weiterhin akzeptiert wird, können Plugin-Autoren es weiter verwenden, bis
  Docs und Diagnosen etwas anderes sagen. Neuer Code sollte den dokumentierten
  Ersatz bevorzugen, aber bestehende Plugins sollten bei gewöhnlichen Minor
  Releases nicht brechen.

  ## So migrieren Sie

  <Steps>
  <Step title="Runtime-Konfigurations-Load-/Write-Helper migrieren">
    Gebündelte Plugins sollten aufhören,
    `api.runtime.config.loadConfig()` und
    `api.runtime.config.writeConfigFile(...)` direkt aufzurufen. Bevorzugen Sie Konfiguration, die
    bereits in den aktiven Aufrufpfad übergeben wurde. Langlebige Handler, die den
    aktuellen Prozess-Snapshot benötigen, können `api.runtime.config.current()` verwenden. Langlebige
    Agent-Tools sollten innerhalb von
    `execute` `ctx.getRuntimeConfig()` aus dem Tool-Kontext verwenden, damit ein vor einem Konfigurations-Write erstelltes Tool weiterhin die aktualisierte
    Runtime-Konfiguration sieht.

    Konfigurations-Writes müssen über die transaktionalen Helper laufen und eine
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
    Nacharbeit besitzt und den Reload-Planner bewusst unterdrücken möchte.
    Mutationsergebnisse enthalten eine typisierte `followUp`-Zusammenfassung für Tests und Logging;
    der Gateway bleibt dafür verantwortlich, den Neustart anzuwenden oder zu planen.
    `loadConfig` und `writeConfigFile` bleiben während des Migrationsfensters als veraltete Kompatibilitäts-
    Helper für externe Plugins bestehen und warnen einmal mit dem
    Kompatibilitätscode `runtime-config-load-write`. Gebündelte Plugins und Repo-
    Runtime-Code werden durch Scanner-Guardrails in
    `pnpm check:deprecated-api-usage` und
    `pnpm check:no-runtime-action-load-config` geschützt: neue Produktions-Plugin-Nutzung
    schlägt direkt fehl, direkte Konfigurations-Writes schlagen fehl, Gateway-Servermethoden müssen
    den Runtime-Snapshot der Anfrage verwenden, Runtime-Channel-Send-/Action-/Client-Helper
    müssen Konfiguration von ihrer Grenze erhalten, und langlebige Runtime-Module haben
    null erlaubte ambiente `loadConfig()`-Aufrufe.

    Neuer Plugin-Code sollte außerdem den breiten
    Kompatibilitäts-Barrel `openclaw/plugin-sdk/config-runtime` nicht importieren. Verwenden Sie den schmalen
    SDK-Unterpfad, der zur Aufgabe passt:

    | Bedarf | Import |
    | --- | --- |
    | Konfigurationstypen wie `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Bereits geladene Konfigurations-Assertions und Plugin-Entry-Konfigurationslookup | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Lesezugriffe auf den aktuellen Runtime-Snapshot | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Konfigurations-Writes | `openclaw/plugin-sdk/config-mutation` |
    | Session-Store-Helper | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown-Tabellenkonfiguration | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Runtime-Helper für Gruppenrichtlinien | `openclaw/plugin-sdk/runtime-group-policy` |
    | Secret-Input-Auflösung | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model-/Sitzungs-Overrides | `openclaw/plugin-sdk/model-session-runtime` |

    Gebündelte Plugins und ihre Tests sind durch Scanner gegen den breiten
    Barrel geschützt, damit Importe und Mocks lokal zu dem Verhalten bleiben, das sie benötigen. Der breite
    Barrel existiert weiterhin für externe Kompatibilität, aber neuer Code sollte nicht
    davon abhängen.

  </Step>

  <Step title="Eingebettete Tool-Ergebnis-Erweiterungen zu Middleware migrieren">
    Gebündelte Plugins müssen nur für Embedded Runner gedachte
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
    Genehmigungsfähige Channel-Plugins stellen natives Genehmigungsverhalten jetzt über
    `approvalCapability.nativeRuntime` plus die gemeinsame Runtime-Kontext-Registry bereit.

    Wichtige Änderungen:

    - Ersetzen Sie `approvalCapability.handler.loadRuntime(...)` durch
      `approvalCapability.nativeRuntime`
    - Verschieben Sie genehmigungsspezifische Authentifizierung/Zustellung von alter `plugin.auth`- /
      `plugin.approvals`-Verdrahtung auf `approvalCapability`
    - `ChannelPlugin.approvals` wurde aus dem öffentlichen Channel-Plugin-
      Vertrag entfernt; verschieben Sie delivery-/native-/render-Felder auf `approvalCapability`
    - `plugin.auth` bleibt nur für Channel-Login-/Logout-Flows; Approval-Auth-
      Hooks dort werden vom Core nicht mehr gelesen
    - Registrieren Sie channel-eigene Runtime-Objekte wie Clients, Tokens oder Bolt-
      Apps über `openclaw/plugin-sdk/channel-runtime-context`
    - Senden Sie keine plugin-eigenen Reroute-Hinweise aus nativen Approval-Handlern;
      Core besitzt nun auf tatsächlichen Zustellergebnissen basierende Routed-Elsewhere-Hinweise
    - Wenn Sie `channelRuntime` an `createChannelManager(...)` übergeben, stellen Sie eine
      echte `createPluginRuntime().channel`-Oberfläche bereit. Partielle Stubs werden abgelehnt.

    Siehe `/plugins/sdk-channel-plugins` für das aktuelle Approval-Capability-
    Layout.

  </Step>

  <Step title="Fallback-Verhalten des Windows-Wrappers prüfen">
    Wenn Ihr Plugin `openclaw/plugin-sdk/windows-spawn` verwendet, schlagen nicht aufgelöste Windows-
    `.cmd`-/`.bat`-Wrapper jetzt fail-closed fehl, sofern Sie nicht explizit
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

    Dasselbe Muster gilt für andere alte Bridge-Helfer:

    | Alter Import | Moderne Entsprechung |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | Helfer für Sitzungsspeicher | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` existiert weiterhin für externe
    Kompatibilität, aber neuer Code sollte die fokussierte Helferoberfläche importieren, die er
    tatsächlich benötigt:

    | Bedarf | Import |
    | --- | --- |
    | Helfer für Systemereignis-Warteschlangen | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat-Weck-, Ereignis- und Sichtbarkeitshelfer | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Leeren der Warteschlange ausstehender Zustellungen | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetrie für Kanalaktivität | `openclaw/plugin-sdk/channel-activity-runtime` |
    | In-Memory- und persistenzgestützte Dedupe-Caches | `openclaw/plugin-sdk/dedupe-runtime` |
    | Sichere Helfer für lokale Datei-/Medienpfade | `openclaw/plugin-sdk/file-access-runtime` |
    | Dispatcher-bewusstes Fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | Proxy- und geschützte Fetch-Helfer | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF-Dispatcher-Richtlinientypen | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Typen für Genehmigungsanfragen/-auflösungen | `openclaw/plugin-sdk/approval-runtime` |
    | Nutzlast für Genehmigungsantworten und Befehlshelfer | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helfer für Fehlerformatierung | `openclaw/plugin-sdk/error-runtime` |
    | Wartevorgänge für Transportbereitschaft | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helfer für sichere Token | `openclaw/plugin-sdk/secure-random-runtime` |
    | Begrenzte Nebenläufigkeit für asynchrone Aufgaben | `openclaw/plugin-sdk/concurrency-runtime` |
    | Numerische Erzwingung | `openclaw/plugin-sdk/number-runtime` |
    | Prozesslokale asynchrone Sperre | `openclaw/plugin-sdk/async-lock-runtime` |
    | Dateisperren | `openclaw/plugin-sdk/file-lock` |

    Gebündelte Plugins werden per Scanner gegen `infra-runtime` geschützt, sodass Repo-Code
    nicht wieder auf das breite Barrel zurückfallen kann.

  </Step>

  <Step title="Migrate channel route helpers">
    Neuer Kanalrouten-Code sollte `openclaw/plugin-sdk/channel-route` verwenden.
    Die älteren Route-Key- und Comparable-Target-Namen bleiben während des
    Migrationsfensters als Kompatibilitätsaliase erhalten, aber neue Plugins sollten die Routennamen
    verwenden, die das Verhalten direkt beschreiben:

    | Alter Helfer | Moderner Helfer |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Die modernen Routenhelfer normalisieren `{ channel, to, accountId, threadId }`
    konsistent über native Genehmigungen, Antwortunterdrückung, eingehende Dedupe,
    Cron-Zustellung und Sitzungsrouting hinweg.

    Fügen Sie keine neuen Verwendungen von `ChannelMessagingAdapter.parseExplicitTarget` oder
    den parsergestützten Helfern für geladene Routen (`parseExplicitTargetForLoadedChannel`
    oder `resolveRouteTargetForLoadedChannel`) oder
    `resolveChannelRouteTargetWithParser(...)` aus `plugin-sdk/channel-route` hinzu.
    Diese Hooks sind veraltet und bleiben nur für ältere Plugins während des
    Migrationsfensters erhalten. Neue Kanal-Plugins sollten
    `messaging.targetResolver.resolveTarget(...)` für die Normalisierung von Ziel-IDs
    und den Fallback bei fehlendem Verzeichnistreffer verwenden, `messaging.inferTargetChatType(...)`, wenn Core
    früh eine Peer-Art benötigt, und `messaging.resolveOutboundSessionRoute(...)`
    für Provider-native Sitzungs- und Thread-Identität.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referenz für Importpfade

  <Accordion title="Common import path table">
  | Importpfad | Zweck | Wichtige Exporte |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Kanonischer Plugin-Einstiegshelfer | `definePluginEntry` |
  | `plugin-sdk/core` | Legacy-Umbrella-Re-Export für Channel-Einstiegsdefinitionen/-Builder | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Export des Root-Konfigurationsschemas | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Einstiegshelfer für einzelne Provider | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Fokussierte Channel-Einstiegsdefinitionen und -Builder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Gemeinsame Helfer für den Einrichtungsassistenten | Einrichtungsübersetzer, Allowlist-Eingabeaufforderungen, Builder für Einrichtungsstatus |
  | `plugin-sdk/setup-runtime` | Runtime-Helfer zur Einrichtungszeit | `createSetupTranslator`, importsichere Einrichtungs-Patch-Adapter, Lookup-Notiz-Helfer, `promptResolvedAllowFrom`, `splitSetupEntries`, delegierte Einrichtungs-Proxys |
  | `plugin-sdk/setup-adapter-runtime` | Veralteter Alias für Einrichtungsadapter | Verwenden Sie `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Helfer für Einrichtungswerkzeuge | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Multi-Account-Helfer | Helfer für Kontoliste/Konfiguration/Aktions-Gate |
  | `plugin-sdk/account-id` | Helfer für Konto-IDs | `DEFAULT_ACCOUNT_ID`, Normalisierung von Konto-IDs |
  | `plugin-sdk/account-resolution` | Helfer für Kontosuche | Helfer für Kontosuche und Default-Fallback |
  | `plugin-sdk/account-helpers` | Schmale Kontohelfer | Helfer für Kontolisten/Kontoaktionen |
  | `plugin-sdk/channel-setup` | Adapter für Einrichtungsassistenten | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, plus `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM-Pairing-Primitiven | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Verkabelung für Antwortpräfix, Tippen und Quellzustellung | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fabriken für Konfigurationsadapter und DM-Zugriffshelfer | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Builder für Konfigurationsschemas | Gemeinsame Primitiven für Channel-Konfigurationsschemas und nur der generische Builder |
  | `plugin-sdk/bundled-channel-config-schema` | Gebündelte Konfigurationsschemas | Nur von OpenClaw gepflegte gebündelte Plugins; neue Plugins müssen Plugin-lokale Schemas definieren |
  | `plugin-sdk/channel-config-schema-legacy` | Veraltete gebündelte Konfigurationsschemas | Nur Kompatibilitätsalias; verwenden Sie `plugin-sdk/bundled-channel-config-schema` für gepflegte gebündelte Plugins |
  | `plugin-sdk/telegram-command-config` | Helfer für Telegram-Befehlskonfiguration | Normalisierung von Befehlsnamen, Kürzen von Beschreibungen, Validierung auf Duplikate/Konflikte |
  | `plugin-sdk/channel-policy` | Auflösung von Gruppen-/DM-Richtlinien | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Veraltete Kompatibilitäts-Fassade | Verwenden Sie `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Helfer für eingehende Envelopes | Gemeinsame Routen- und Envelope-Builder-Helfer |
  | `plugin-sdk/channel-inbound` | Helfer für eingehenden Empfang | Kontextaufbau, Formatierung, Roots, Runner, vorbereiteter Antwortversand und Dispatch-Prädikate |
  | `plugin-sdk/messaging-targets` | Veralteter Importpfad für Zielparsing | Verwenden Sie `plugin-sdk/channel-targets` für generische Helfer zum Zielparsing, `plugin-sdk/channel-route` für Routenvergleich und Plugin-eigene `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` für Provider-spezifische Zielauflösung |
  | `plugin-sdk/outbound-media` | Helfer für ausgehende Medien | Gemeinsames Laden ausgehender Medien |
  | `plugin-sdk/outbound-send-deps` | Veraltete Kompatibilitäts-Fassade | Verwenden Sie `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Helfer für den Lebenszyklus ausgehender Nachrichten | Nachrichtenadapter, Empfangsbestätigungen, Helfer für dauerhaften Versand, Helfer für Live-Vorschau/Streaming, Antwortoptionen, Lebenszyklushelfer, ausgehende Identität und Payload-Planung |
  | `plugin-sdk/channel-streaming` | Veraltete Kompatibilitäts-Fassade | Verwenden Sie `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Veraltete Kompatibilitäts-Fassade | Verwenden Sie `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Thread-Binding-Helfer | Lebenszyklus- und Adapterhelfer für Thread-Binding |
  | `plugin-sdk/agent-media-payload` | Legacy-Medien-Payload-Helfer | Builder für Agent-Medien-Payloads für Legacy-Feldlayouts |
  | `plugin-sdk/channel-runtime` | Veralteter Kompatibilitäts-Shim | Nur Legacy-Channel-Runtime-Dienstprogramme |
  | `plugin-sdk/channel-send-result` | Send-Ergebnistypen | Antwort-Ergebnistypen |
  | `plugin-sdk/runtime-store` | Persistenter Plugin-Speicher | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Breite Runtime-Helfer | Runtime-/Logging-/Backup-/Plugin-Installationshelfer |
  | `plugin-sdk/runtime-env` | Schmale Runtime-Env-Helfer | Logger-/Runtime-Env-, Timeout-, Retry- und Backoff-Helfer |
  | `plugin-sdk/plugin-runtime` | Gemeinsame Plugin-Runtime-Helfer | Helfer für Plugin-Befehle/Hooks/HTTP/Interaktivität |
  | `plugin-sdk/hook-runtime` | Helfer für Hook-Pipelines | Gemeinsame Webhook-/interne Hook-Pipeline-Helfer |
  | `plugin-sdk/lazy-runtime` | Lazy-Runtime-Helfer | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Prozesshelfer | Gemeinsame Exec-Helfer |
  | `plugin-sdk/cli-runtime` | CLI-Runtime-Helfer | Befehlsformatierung, Wartevorgänge, Versionshelfer |
  | `plugin-sdk/gateway-runtime` | Gateway-Helfer | Gateway-Client, event-loop-bereiter Starthelfer, Auflösung des angekündigten LAN-Hosts und Helfer für Channel-Status-Patches |
  | `plugin-sdk/config-runtime` | Veralteter Shim für Konfigurationskompatibilität | Bevorzugen Sie `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` und `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Helfer für Telegram-Befehle | Fallback-stabile Helfer für die Validierung von Telegram-Befehlen, wenn die gebündelte Telegram-Vertragsoberfläche nicht verfügbar ist |
  | `plugin-sdk/approval-runtime` | Helfer für Genehmigungsaufforderungen | Payload für Exec-/Plugin-Genehmigungen, Helfer für Genehmigungsfähigkeit/-profil, native Helfer für Genehmigungsrouting/-Runtime und strukturierte Formatierung von Anzeigepfaden für Genehmigungen |
  | `plugin-sdk/approval-auth-runtime` | Helfer für Genehmigungsautorisierung | Auflösung von Genehmigenden, Aktionsautorisierung im selben Chat |
  | `plugin-sdk/approval-client-runtime` | Helfer für Genehmigungsclient | Native Helfer für Exec-Genehmigungsprofil/-filter |
  | `plugin-sdk/approval-delivery-runtime` | Helfer für Genehmigungszustellung | Native Adapter für Genehmigungsfähigkeit/-zustellung |
  | `plugin-sdk/approval-gateway-runtime` | Helfer für Genehmigungs-Gateway | Gemeinsamer Helfer zur Auflösung des Genehmigungs-Gateway |
  | `plugin-sdk/approval-handler-adapter-runtime` | Helfer für Genehmigungsadapter | Leichtgewichtige Helfer zum Laden nativer Genehmigungsadapter für heiße Channel-Einstiegspunkte |
  | `plugin-sdk/approval-handler-runtime` | Helfer für Genehmigungs-Handler | Breitere Runtime-Helfer für Genehmigungs-Handler; bevorzugen Sie die schmaleren Adapter-/Gateway-Seams, wenn sie ausreichen |
  | `plugin-sdk/approval-native-runtime` | Helfer für Genehmigungsziele | Native Helfer für Genehmigungsziel-/Kontobindung |
  | `plugin-sdk/approval-reply-runtime` | Helfer für Genehmigungsantworten | Helfer für Antwort-Payloads auf Exec-/Plugin-Genehmigungen |
  | `plugin-sdk/channel-runtime-context` | Helfer für Channel-Runtime-Kontext | Generische Helfer zum Registrieren/Abrufen/Beobachten von Channel-Runtime-Kontexten |
  | `plugin-sdk/security-runtime` | Sicherheitshelfer | Gemeinsame Helfer für Vertrauen, DM-Gating, root-begrenzte Datei-/Pfadhelfer, externe Inhalte und Secret-Erfassung |
  | `plugin-sdk/ssrf-policy` | SSRF-Richtlinienhelfer | Helfer für Host-Allowlist und Private-Network-Richtlinie |
  | `plugin-sdk/ssrf-runtime` | SSRF-Runtime-Helfer | Pinned-Dispatcher, geschütztes Fetch, SSRF-Richtlinienhelfer |
  | `plugin-sdk/system-event-runtime` | Systemereignis-Helfer | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat-Helfer | Heartbeat-Weck-, Ereignis- und Sichtbarkeitshelfer |
  | `plugin-sdk/delivery-queue-runtime` | Helfer für Zustellungswarteschlangen | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Helfer für Channel-Aktivität | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Dedupe-Helfer | In-Memory- und persistent gestützte Dedupe-Caches |
  | `plugin-sdk/file-access-runtime` | Helfer für Dateizugriff | Sichere Helfer für lokale Datei-/Medienpfade |
  | `plugin-sdk/transport-ready-runtime` | Helfer für Transportbereitschaft | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Helfer für Exec-Genehmigungsrichtlinien | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Helfer für begrenzte Caches | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Helfer für Diagnose-Gating | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Helfer für Fehlerformatierung | `formatUncaughtError`, `isApprovalNotFoundError`, Helfer für Fehlergraphen |
  | `plugin-sdk/fetch-runtime` | Helfer für umschlossenes Fetch/Proxy | `resolveFetch`, Proxy-Helfer, Helfer für EnvHttpProxyAgent-Optionen |
  | `plugin-sdk/host-runtime` | Helfer für Host-Normalisierung | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Retry-Helfer | `RetryConfig`, `retryAsync`, Richtlinien-Runner |
  | `plugin-sdk/allow-from` | Allowlist-Formatierung und Eingabezuordnung | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Helfer für Befehls-Gating und Befehlsoberflächen | `resolveControlCommandGate`, Helfer für Senderautorisierung, Befehlsregistrierungshelfer einschließlich Formatierung dynamischer Argumentmenüs |
  | `plugin-sdk/command-status` | Renderer für Befehlsstatus/-hilfe | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Parsing von Secret-Eingaben | Helfer für Secret-Eingaben |
  | `plugin-sdk/webhook-ingress` | Helfer für Webhook-Anfragen | Dienstprogramme für Webhook-Ziele |
  | `plugin-sdk/webhook-request-guards` | Helfer für Webhook-Body-Guards | Helfer zum Lesen/Begrenzen von Request-Bodys |
  | `plugin-sdk/reply-runtime` | Gemeinsame Antwort-Runtime | Eingehender Dispatch, Heartbeat, Antwortplaner, Chunking |
  | `plugin-sdk/reply-dispatch-runtime` | Schmale Helfer für Antwort-Dispatch | Finalisieren, Provider-Dispatch und Konversationslabel-Helfer |
  | `plugin-sdk/reply-history` | Antwortverlaufs-Helfer | `createChannelHistoryWindow`; veraltete Kompatibilitätsexporte für Map-Helfer wie `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` und `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planung von Antwortreferenzen | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Helfer für Antwort-Chunks | Helfer für Text-/Markdown-Chunking |
  | `plugin-sdk/session-store-runtime` | Helfer für Sitzungsspeicher | Speicherpfad- und updated-at-Helfer |
  | `plugin-sdk/state-paths` | Helfer für Zustandspfade | Helfer für Zustands- und OAuth-Verzeichnisse |
  | `plugin-sdk/routing` | Routing-/Sitzungsschlüssel-Hilfsfunktionen | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, Hilfsfunktionen zur Sitzungsschlüssel-Normalisierung |
  | `plugin-sdk/status-helpers` | Kanalstatus-Hilfsfunktionen | Builder für Kanal-/Kontostatus-Zusammenfassungen, Laufzeitstatus-Standards, Hilfsfunktionen für Issue-Metadaten |
  | `plugin-sdk/target-resolver-runtime` | Zielauflöser-Hilfsfunktionen | Gemeinsame Zielauflöser-Hilfsfunktionen |
  | `plugin-sdk/string-normalization-runtime` | Zeichenketten-Normalisierungs-Hilfsfunktionen | Slug-/Zeichenketten-Normalisierungs-Hilfsfunktionen |
  | `plugin-sdk/request-url` | Anfrage-URL-Hilfsfunktionen | Zeichenketten-URLs aus anfrageähnlichen Eingaben extrahieren |
  | `plugin-sdk/run-command` | Zeitgesteuerte Befehls-Hilfsfunktionen | Zeitgesteuerter Befehlsrunner mit normalisiertem stdout/stderr |
  | `plugin-sdk/param-readers` | Parameterleser | Allgemeine Tool-/CLI-Parameterleser |
  | `plugin-sdk/tool-payload` | Tool-Payload-Extraktion | Normalisierte Payloads aus Tool-Ergebnisobjekten extrahieren |
  | `plugin-sdk/tool-send` | Tool-Sendeextraktion | Kanonische Sendeziel-Felder aus Tool-Argumenten extrahieren |
  | `plugin-sdk/temp-path` | Temporäre-Pfad-Hilfsfunktionen | Gemeinsame Hilfsfunktionen für temporäre Download-Pfade |
  | `plugin-sdk/logging-core` | Logging-Hilfsfunktionen | Subsystem-Logger und Hilfsfunktionen zur Schwärzung |
  | `plugin-sdk/markdown-table-runtime` | Markdown-Tabellen-Hilfsfunktionen | Hilfsfunktionen für Markdown-Tabellenmodi |
  | `plugin-sdk/reply-payload` | Nachrichtenantwort-Typen | Antwort-Payload-Typen |
  | `plugin-sdk/provider-setup` | Kuratierte Hilfsfunktionen für lokale/selbst gehostete Provider-Einrichtung | Ermittlungs-/Konfigurations-Hilfsfunktionen für selbst gehostete Provider |
  | `plugin-sdk/self-hosted-provider-setup` | Fokussierte Hilfsfunktionen für OpenAI-kompatible selbst gehostete Provider-Einrichtung | Dieselben Ermittlungs-/Konfigurations-Hilfsfunktionen für selbst gehostete Provider |
  | `plugin-sdk/provider-auth-runtime` | Hilfsfunktionen für Provider-Laufzeit-Authentifizierung | Hilfsfunktionen zur Laufzeitauflösung von API-Schlüsseln |
  | `plugin-sdk/provider-auth-api-key` | Hilfsfunktionen zur Provider-API-Schlüssel-Einrichtung | Hilfsfunktionen für API-Schlüssel-Onboarding und Profilschreibung |
  | `plugin-sdk/provider-auth-result` | Hilfsfunktionen für Provider-Authentifizierungsergebnisse | Standard-Builder für OAuth-Authentifizierungsergebnisse |
  | `plugin-sdk/provider-selection-runtime` | Provider-Auswahl-Hilfsfunktionen | Auswahl konfigurierter oder automatischer Provider und Zusammenführung roher Provider-Konfigurationen |
  | `plugin-sdk/provider-env-vars` | Hilfsfunktionen für Provider-Umgebungsvariablen | Hilfsfunktionen zur Suche von Provider-Authentifizierungs-Umgebungsvariablen |
  | `plugin-sdk/provider-model-shared` | Gemeinsame Provider-Modell-/Replay-Hilfsfunktionen | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, gemeinsame Replay-Policy-Builder, Provider-Endpunkt-Hilfsfunktionen und Hilfsfunktionen zur Modell-ID-Normalisierung |
  | `plugin-sdk/provider-catalog-shared` | Gemeinsame Provider-Katalog-Hilfsfunktionen | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Provider-Onboarding-Patches | Onboarding-Konfigurations-Hilfsfunktionen |
  | `plugin-sdk/provider-http` | Provider-HTTP-Hilfsfunktionen | Generische Hilfsfunktionen für Provider-HTTP-/Endpunkt-Fähigkeiten, einschließlich Multipart-Formular-Hilfsfunktionen für Audio-Transkription |
  | `plugin-sdk/provider-web-fetch` | Provider-Web-Fetch-Hilfsfunktionen | Registrierungs-/Cache-Hilfsfunktionen für Web-Fetch-Provider |
  | `plugin-sdk/provider-web-search-config-contract` | Provider-Websuche-Konfigurations-Hilfsfunktionen | Schmale Websuche-Konfigurations-/Zugangsdaten-Hilfsfunktionen für Provider, die keine Plugin-Aktivierungsverdrahtung benötigen |
  | `plugin-sdk/provider-web-search-contract` | Provider-Websuche-Vertrags-Hilfsfunktionen | Schmale Vertrags-Hilfsfunktionen für Websuche-Konfiguration/Zugangsdaten wie `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` sowie bereichsbezogene Zugangsdaten-Setter/-Getter |
  | `plugin-sdk/provider-web-search` | Provider-Websuche-Hilfsfunktionen | Registrierungs-/Cache-/Laufzeit-Hilfsfunktionen für Websuche-Provider |
  | `plugin-sdk/provider-tools` | Hilfsfunktionen für Provider-Tool-/Schema-Kompatibilität | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` und DeepSeek-/Gemini-/OpenAI-Schemabereinigung plus Diagnosen |
  | `plugin-sdk/provider-usage` | Provider-Nutzungs-Hilfsfunktionen | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` und weitere Hilfsfunktionen zur Provider-Nutzung |
  | `plugin-sdk/provider-stream` | Hilfsfunktionen für Provider-Stream-Wrapper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, Stream-Wrapper-Typen sowie gemeinsame Anthropic-/Bedrock-/DeepSeek V4-/Google-/Kilocode-/Moonshot-/OpenAI-/OpenRouter-/Z.A.I-/MiniMax-/Copilot-Wrapper-Hilfsfunktionen |
  | `plugin-sdk/provider-transport-runtime` | Provider-Transport-Hilfsfunktionen | Native Provider-Transport-Hilfsfunktionen wie geschütztes Fetch, Tool-Ergebnis-Textextraktion, Transportnachrichten-Transformationen und beschreibbare Transportereignis-Streams |
  | `plugin-sdk/keyed-async-queue` | Geordnete asynchrone Warteschlange | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Gemeinsame Medien-Hilfsfunktionen | Hilfsfunktionen zum Abrufen/Transformieren/Speichern von Medien, ffprobe-gestützte Ermittlung von Videodimensionen und Medien-Payload-Builder |
  | `plugin-sdk/media-generation-runtime` | Gemeinsame Mediengenerierungs-Hilfsfunktionen | Gemeinsame Failover-Hilfsfunktionen, Kandidatenauswahl und Meldungen zu fehlenden Modellen für Bild-/Video-/Musikgenerierung |
  | `plugin-sdk/media-understanding` | Medienverständnis-Hilfsfunktionen | Provider-Typen für Medienverständnis plus providerseitige Bild-/Audio-Hilfs-Exporte |
  | `plugin-sdk/text-runtime` | Veralteter breiter Textkompatibilitäts-Export | Verwenden Sie `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` und `logging-core` |
  | `plugin-sdk/text-chunking` | Textsegmentierungs-Hilfsfunktionen | Hilfsfunktion zur ausgehenden Textsegmentierung |
  | `plugin-sdk/speech` | Sprach-Hilfsfunktionen | Sprach-Provider-Typen plus providerseitige Direktiven, Registry, Validierungs-Hilfsfunktionen und OpenAI-kompatibler TTS-Builder |
  | `plugin-sdk/speech-core` | Gemeinsamer Sprach-Kern | Sprach-Provider-Typen, Registry, Direktiven, Normalisierung |
  | `plugin-sdk/realtime-transcription` | Echtzeit-Transkriptions-Hilfsfunktionen | Provider-Typen, Registry-Hilfsfunktionen und gemeinsame WebSocket-Sitzungshilfsfunktion |
  | `plugin-sdk/realtime-voice` | Echtzeit-Sprach-Hilfsfunktionen | Provider-Typen, Registry-/Auflösungs-Hilfsfunktionen, Bridge-Sitzungs-Hilfsfunktionen, gemeinsame Agent-Talkback-Warteschlangen, Sprachsteuerung aktiver Runs, Transkript-/Ereignisgesundheit, Echounterdrückung, Abgleich von Beratungsfragen, Koordination erzwungener Beratungen, Turn-Kontextverfolgung, Ausgabeaktivitätsverfolgung und schnelle Kontextberatungs-Hilfsfunktionen |
  | `plugin-sdk/image-generation` | Bildgenerierungs-Hilfsfunktionen | Bildgenerierungs-Provider-Typen plus Hilfsfunktionen für Bildassets/Daten-URLs und der OpenAI-kompatible Bild-Provider-Builder |
  | `plugin-sdk/image-generation-core` | Gemeinsamer Bildgenerierungs-Kern | Bildgenerierungstypen, Failover, Authentifizierung und Registry-Hilfsfunktionen |
  | `plugin-sdk/music-generation` | Musikgenerierungs-Hilfsfunktionen | Provider-/Anfrage-/Ergebnistypen für Musikgenerierung |
  | `plugin-sdk/music-generation-core` | Gemeinsamer Musikgenerierungs-Kern | Musikgenerierungstypen, Failover-Hilfsfunktionen, Provider-Suche und Modellreferenz-Parsing |
  | `plugin-sdk/video-generation` | Videogenerierungs-Hilfsfunktionen | Provider-/Anfrage-/Ergebnistypen für Videogenerierung |
  | `plugin-sdk/video-generation-core` | Gemeinsamer Videogenerierungs-Kern | Videogenerierungstypen, Failover-Hilfsfunktionen, Provider-Suche und Modellreferenz-Parsing |
  | `plugin-sdk/interactive-runtime` | Interaktive Antwort-Hilfsfunktionen | Normalisierung/Reduktion interaktiver Antwort-Payloads |
  | `plugin-sdk/channel-config-primitives` | Kanal-Konfigurationsprimitive | Schmale Primitive für Kanal-Konfigurationsschemas |
  | `plugin-sdk/channel-config-writes` | Hilfsfunktionen für Kanal-Konfigurationsschreibvorgänge | Autorisierungs-Hilfsfunktionen für Kanal-Konfigurationsschreibvorgänge |
  | `plugin-sdk/channel-plugin-common` | Gemeinsames Kanal-Prelude | Gemeinsame Exporte für Kanal-Plugin-Prelude |
  | `plugin-sdk/channel-status` | Kanalstatus-Hilfsfunktionen | Gemeinsame Hilfsfunktionen für Kanalstatus-Snapshots/-Zusammenfassungen |
  | `plugin-sdk/allowlist-config-edit` | Allowlist-Konfigurations-Hilfsfunktionen | Hilfsfunktionen zum Bearbeiten/Lesen der Allowlist-Konfiguration |
  | `plugin-sdk/group-access` | Gruppenzugriffs-Hilfsfunktionen | Gemeinsame Hilfsfunktionen für Gruppenzugriffsentscheidungen |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Veraltete Kompatibilitätsfassaden | Verwenden Sie `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Direct-DM-Guard-Hilfsfunktionen | Schmale Guard-Policy-Hilfsfunktionen vor Krypto |
  | `plugin-sdk/extension-shared` | Gemeinsame Erweiterungs-Hilfsfunktionen | Passive Kanal-/Status- und Ambient-Proxy-Hilfsprimitive |
  | `plugin-sdk/webhook-targets` | Webhook-Ziel-Hilfsfunktionen | Webhook-Ziel-Registry und Hilfsfunktionen zur Routeninstallation |
  | `plugin-sdk/webhook-path` | Veralteter Webhook-Pfad-Alias | Verwenden Sie `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Gemeinsame Webmedien-Hilfsfunktionen | Hilfsfunktionen zum Laden entfernter/lokaler Medien |
  | `plugin-sdk/zod` | Veralteter Zod-Kompatibilitäts-Re-Export | Importieren Sie `zod` direkt aus `zod` |
  | `plugin-sdk/memory-core` | Gebündelte Memory-Core-Hilfsfunktionen | Oberfläche für Memory-Manager-/Konfigurations-/Datei-/CLI-Hilfsfunktionen |
  | `plugin-sdk/memory-core-engine-runtime` | Memory-Engine-Laufzeitfassade | Memory-Index-/Such-Laufzeitfassade |
  | `plugin-sdk/memory-core-host-embedding-registry` | Memory-Embedding-Registry | Leichtgewichtige Registry-Hilfsfunktionen für Memory-Embedding-Provider |
  | `plugin-sdk/memory-core-host-engine-foundation` | Memory-Host-Foundation-Engine | Exporte der Memory-Host-Foundation-Engine |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Memory-Host-Embedding-Engine | Memory-Embedding-Verträge, Registry-Zugriff, lokaler Provider und generische Batch-/Remote-Hilfsfunktionen; konkrete Remote-Provider liegen in ihren jeweiligen besitzenden Plugins |
  | `plugin-sdk/memory-core-host-engine-qmd` | Memory-Host-QMD-Engine | Exporte der Memory-Host-QMD-Engine |
  | `plugin-sdk/memory-core-host-engine-storage` | Memory-Host-Storage-Engine | Exporte der Memory-Host-Storage-Engine |
  | `plugin-sdk/memory-core-host-multimodal` | Multimodale Memory-Host-Hilfsfunktionen | Multimodale Memory-Host-Hilfsfunktionen |
  | `plugin-sdk/memory-core-host-query` | Memory-Host-Abfrage-Hilfsfunktionen | Memory-Host-Abfrage-Hilfsfunktionen |
  | `plugin-sdk/memory-core-host-secret` | Memory-Host-Secret-Hilfsfunktionen | Memory-Host-Secret-Hilfsfunktionen |
  | `plugin-sdk/memory-core-host-events` | Veralteter Memory-Ereignis-Alias | Verwenden Sie `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Memory-Host-Status-Hilfsfunktionen | Memory-Host-Status-Hilfsfunktionen |
  | `plugin-sdk/memory-core-host-runtime-cli` | Memory-Host-CLI-Laufzeit | Memory-Host-CLI-Laufzeit-Hilfsfunktionen |
  | `plugin-sdk/memory-core-host-runtime-core` | Memory-Host-Kernlaufzeit | Memory-Host-Kernlaufzeit-Hilfsfunktionen |
  | `plugin-sdk/memory-core-host-runtime-files` | Memory-Host-Datei-/Laufzeit-Hilfsfunktionen | Memory-Host-Datei-/Laufzeit-Hilfsfunktionen |
  | `plugin-sdk/memory-host-core` | Alias für Memory-Host-Kernlaufzeit | Anbieterneutraler Alias für Memory-Host-Kernlaufzeit-Hilfsfunktionen |
  | `plugin-sdk/memory-host-events` | Alias für Memory-Host-Ereignisjournal | Anbieterneutraler Alias für Memory-Host-Ereignisjournal-Hilfsfunktionen |
  | `plugin-sdk/memory-host-files` | Veralteter Memory-Datei-/Laufzeit-Alias | Verwenden Sie `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Verwaltete Markdown-Hilfsfunktionen | Gemeinsame Hilfsfunktionen für verwaltetes Markdown für Memory-nahe Plugins |
  | `plugin-sdk/memory-host-search` | Active Memory-Suchfassade | Lazy Active Memory-Suchmanager-Laufzeitfassade |
  | `plugin-sdk/memory-host-status` | Veralteter Memory-Host-Status-Alias | Verwenden Sie `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Testhilfsprogramme | Repo-lokales veraltetes Kompatibilitäts-Barrel; verwenden Sie fokussierte repo-lokale Test-Unterpfade wie `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` und `plugin-sdk/test-fixtures` |
</Accordion>

Diese Tabelle ist absichtlich die gemeinsame Migrations-Teilmenge, nicht die vollständige SDK-
Oberfläche. Das Inventar der Compiler-Einstiegspunkte liegt in
`scripts/lib/plugin-sdk-entrypoints.json`; Paket-Exports werden aus der
öffentlichen Teilmenge generiert.

Reservierte Helper-Seams für gebündelte Plugins wurden aus der öffentlichen SDK-
Export-Map entfernt, außer ausdrücklich dokumentierten Kompatibilitäts-Fassaden wie dem
veralteten `plugin-sdk/discord`-Shim, der für das veröffentlichte
Paket `@openclaw/discord@2026.3.13` beibehalten wird. Owner-spezifische Helper befinden sich im
jeweiligen Plugin-Paket; gemeinsames Host-Verhalten sollte über generische SDK-
Verträge wie `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`
und `plugin-sdk/plugin-config-runtime` laufen.

Verwenden Sie den engsten Import, der zur Aufgabe passt. Wenn Sie keinen Export finden,
prüfen Sie die Quelle unter `src/plugin-sdk/` oder fragen Sie Maintainer, welcher generische Vertrag
dafür zuständig sein sollte.

## Aktive Veraltungen

Engere Veraltungen, die für das gesamte Plugin-SDK, den Provider-Vertrag,
die Runtime-Oberfläche und das Manifest gelten. Jede davon funktioniert heute noch, wird aber
in einem zukünftigen Major-Release entfernt. Der Eintrag unter jedem Element ordnet die alte API
ihrem kanonischen Ersatz zu.

<AccordionGroup>
  <Accordion title="command-auth-Hilfe-Builder → command-status">
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

  <Accordion title="Mention-Gating-Helper → resolveInboundMentionDecision">
    **Alt**: `resolveInboundMentionRequirement({ facts, policy })` und
    `shouldDropInboundForMention(...)` aus
    `openclaw/plugin-sdk/channel-inbound` oder
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Neu**: `resolveInboundMentionDecision({ facts, policy })` - gibt ein
    einzelnes Entscheidungsobjekt statt zweier getrennter Aufrufe zurück.

    Nachgelagerte Kanal-Plugins (Slack, Discord, Matrix, MS Teams) wurden bereits
    umgestellt.

  </Accordion>

  <Accordion title="Kanal-Runtime-Shim und Helper für Kanalaktionen">
    `openclaw/plugin-sdk/channel-runtime` ist ein Kompatibilitäts-Shim für ältere
    Kanal-Plugins. Importieren Sie ihn nicht aus neuem Code; verwenden Sie
    `openclaw/plugin-sdk/channel-runtime-context`, um Runtime-
    Objekte zu registrieren.

    `channelActions*`-Helper in `openclaw/plugin-sdk/channel-actions` sind
    zusammen mit rohen "actions"-Kanal-Exports veraltet. Stellen Sie Fähigkeiten
    stattdessen über die semantische `presentation`-Oberfläche bereit - Kanal-Plugins
    deklarieren, was sie rendern (Karten, Buttons, Auswahlelemente), statt welche rohen
    Aktionsnamen sie akzeptieren.

  </Accordion>

  <Accordion title="Websuche-Provider-Helper tool() → createTool() am Plugin">
    **Alt**: `tool()`-Factory aus `openclaw/plugin-sdk/provider-web-search`.

    **Neu**: Implementieren Sie `createTool(...)` direkt am Provider-Plugin.
    OpenClaw benötigt den SDK-Helper nicht mehr, um den Tool-Wrapper zu registrieren.

  </Accordion>

  <Accordion title="Klartext-Kanal-Envelopes → BodyForAgent">
    **Alt**: `formatInboundEnvelope(...)` (und
    `ChannelMessageForAgent.channelEnvelope`), um aus eingehenden Kanalnachrichten
    ein flaches Klartext-Prompt-Envelope zu bauen.

    **Neu**: `BodyForAgent` plus strukturierte Benutzerkontext-Blöcke. Kanal-
    Plugins hängen Routing-Metadaten (Thread, Thema, Antwort-an, Reaktionen) als
    typisierte Felder an, statt sie in einen Prompt-String zu konkatenieren. Der
    Helper `formatAgentEnvelope(...)` wird für synthetisierte
    assistentenorientierte Envelopes weiterhin unterstützt, aber eingehende Klartext-Envelopes werden
    abgeschafft.

    Betroffene Bereiche: `inbound_claim`, `message_received` und jedes benutzerdefinierte
    Kanal-Plugin, das `channelEnvelope`-Text nachverarbeitet hat.

  </Accordion>

  <Accordion title="deactivate-Hook → gateway_stop">
    **Alt**: `api.on("deactivate", handler)`.

    **Neu**: `api.on("gateway_stop", handler)`. Das Ereignis und der Kontext sind derselbe
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

    `deactivate` bleibt bis nach dem 16.08.2026 als veralteter Kompatibilitätsalias
    verdrahtet.

  </Accordion>

  <Accordion title="subagent_spawning-Hook → Core-Thread-Bindung">
    **Alt**: `api.on("subagent_spawning", handler)` mit Rückgabe von
    `threadBindingReady` oder `deliveryOrigin`.

    **Neu**: Lassen Sie Core `thread: true`-Subagent-Bindungen über den
    Kanal-Session-Binding-Adapter vorbereiten. Verwenden Sie `api.on("subagent_spawned", handler)`
    nur für die Beobachtung nach dem Start.

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
    veraltete Kompatibilitätsoberflächen bestehen, während externe Plugins migrieren.

  </Accordion>

  <Accordion title="Provider-Discovery-Typen → Provider-Katalogtypen">
    Vier Discovery-Typaliasse sind jetzt dünne Wrapper über die
    Typen der Katalog-Ära:

    | Alter Alias               | Neuer Typ                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Außerdem der alte statische `ProviderCapabilities`-Container - Provider-Plugins
    sollten explizite Provider-Hooks wie `buildReplayPolicy`,
    `normalizeToolSchemas` und `wrapStreamFn` statt eines statischen Objekts verwenden.

  </Accordion>

  <Accordion title="Thinking-Policy-Hooks → resolveThinkingProfile">
    **Alt** (drei separate Hooks auf `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` und
    `resolveDefaultThinkingLevel(ctx)`.

    **Neu**: ein einzelnes `resolveThinkingProfile(ctx)`, das ein
    `ProviderThinkingProfile` mit der kanonischen `id`, optionalem `label` und
    sortierter Stufenliste zurückgibt. OpenClaw stuft veraltete gespeicherte Werte automatisch
    anhand des Profilrangs herunter.

    Der Kontext enthält `provider`, `modelId`, optional zusammengeführtes `reasoning`
    und optional zusammengeführte Modell-`compat`-Fakten. Provider-Plugins können diese
    Katalogfakten verwenden, um ein modellspezifisches Profil nur dann bereitzustellen, wenn der konfigurierte
    Request-Vertrag es unterstützt.

    Implementieren Sie einen Hook statt drei. Die alten Hooks funktionieren während
    des Veraltungsfensters weiter, werden aber nicht mit dem Profilergebnis kombiniert.

  </Accordion>

  <Accordion title="Externe Auth-Provider → contracts.externalAuthProviders">
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

  <Accordion title="Provider-Env-Var-Lookup → setup.providers[].envVars">
    **Altes** Manifestfeld: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Neu**: Spiegeln Sie denselben Env-Var-Lookup in `setup.providers[].envVars`
    im Manifest. Das konsolidiert Setup-/Status-Env-Metadaten an einer
    Stelle und vermeidet, die Plugin-Runtime nur zum Beantworten von Env-Var-
    Lookups zu starten.

    `providerAuthEnvVars` bleibt über einen Kompatibilitätsadapter unterstützt,
    bis das Veraltungsfenster endet.

  </Accordion>

  <Accordion title="Memory-Plugin-Registrierung → registerMemoryCapability">
    **Alt**: drei separate Aufrufe -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Neu**: ein Aufruf auf der Memory-State-API -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Gleiche Slots, einzelner Registrierungsaufruf. Additive Prompt- und Corpus-Helper
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) sind
    nicht betroffen.

  </Accordion>

  <Accordion title="Memory-Embedding-Provider-API">
    **Alt**: `api.registerMemoryEmbeddingProvider(...)` plus
    `contracts.memoryEmbeddingProviders`.

    **Neu**: `api.registerEmbeddingProvider(...)` plus
    `contracts.embeddingProviders`.

    Der generische Embedding-Provider-Vertrag ist außerhalb von Memory wiederverwendbar und ist
    der unterstützte Pfad für neue Provider. Die Memory-spezifische Registrierungs-API
    bleibt als veraltete Kompatibilität verdrahtet, während bestehende Provider migrieren.
    Plugin-Inspektionsberichte melden nicht gebündelte Nutzung als Kompatibilitätsschuld.

  </Accordion>

  <Accordion title="Typen für Subagent-Session-Nachrichten umbenannt">
    Zwei alte Typaliasse, die weiterhin aus `src/plugins/runtime/types.ts` exportiert werden:

    | Alt                           | Neu                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    Die Runtime-Methode `readSession` ist zugunsten von
    `getSessionMessages` veraltet. Gleiche Signatur; die alte Methode ruft die
    neue durch.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Alt**: `runtime.tasks.flow` (Singular) gab einen Live-Task-Flow-Accessor zurück.

    **Neu**: `runtime.tasks.managedFlows` behält die Managed-TaskFlow-Mutations-
    Runtime für Plugins bei, die Child Tasks aus einem
    Flow erstellen, aktualisieren, abbrechen oder ausführen. Verwenden Sie `runtime.tasks.flows`, wenn das Plugin nur DTO-basierte Lesezugriffe benötigt.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Eingebettete Extension-Factories → Agent-Tool-Result-Middleware">
    Oben in "So migrieren Sie → Eingebettete Tool-Result-Extensions zu
    Middleware migrieren" behandelt. Der Vollständigkeit halber hier enthalten: Der entfernte, nur für eingebettete Runner bestimmte
    Pfad `api.registerEmbeddedExtensionFactory(...)` wird durch
    `api.registerAgentToolResultMiddleware(...)` mit einer expliziten Runtime-
    Liste in `contracts.agentToolResultMiddleware` ersetzt.
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
Veraltungen auf Extension-Ebene (innerhalb gebündelter Kanal-/Provider-Plugins unter
`extensions/`) werden in ihren eigenen Barrels `api.ts` und `runtime-api.ts`
nachverfolgt. Sie betreffen keine Drittanbieter-Plugin-Verträge und sind hier nicht
aufgeführt. Wenn Sie das lokale Barrel eines gebündelten Plugins direkt verwenden, lesen Sie die
Veraltungskommentare in diesem Barrel, bevor Sie ein Upgrade durchführen.
</Note>

## Zeitplan für die Entfernung

| Wann                       | Was passiert                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------- |
| **Jetzt**                  | Veraltete Schnittstellen geben Laufzeitwarnungen aus                                |
| **Nächste Major-Version**  | Veraltete Schnittstellen werden entfernt; Plugins, die sie weiter verwenden, schlagen fehl |

Alle Kern-Plugins wurden bereits migriert. Externe Plugins sollten vor der
nächsten Major-Version migrieren.

## Warnungen vorübergehend unterdrücken

Setzen Sie diese Umgebungsvariablen, während Sie an der Migration arbeiten:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Dies ist ein temporärer Ausweg, keine dauerhafte Lösung.

## Verwandte Themen

- [Erste Schritte](/de/plugins/building-plugins) - erstellen Sie Ihr erstes Plugin
- [SDK-Übersicht](/de/plugins/sdk-overview) - vollständige Referenz für Subpath-Importe
- [Channel-Plugins](/de/plugins/sdk-channel-plugins) - Channel-Plugins erstellen
- [Provider-Plugins](/de/plugins/sdk-provider-plugins) - Provider-Plugins erstellen
- [Plugin-Interna](/de/plugins/architecture) - ausführlicher Architekturüberblick
- [Plugin-Manifest](/de/plugins/manifest) - Referenz zum Manifest-Schema
