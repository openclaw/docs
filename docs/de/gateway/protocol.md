---
read_when:
    - Gateway-WS-Clients implementieren oder aktualisieren
    - Fehlersuche bei Protokollinkompatibilitäten oder Verbindungsfehlern
    - Protokollschema/-modelle neu generieren
summary: 'Gateway-WebSocket-Protokoll: Handshake, Frames, Versionierung'
title: Gateway-Protokoll
x-i18n:
    generated_at: "2026-05-11T20:30:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92a8ea464fa3ca1fdc6cc32fdcd7d981c186c9900bb8dc2eeaf1a2d2be05d
    source_path: gateway/protocol.md
    workflow: 16
---

Der Gateway-WS-Protokoll ist die **einzige Steuerungsebene + Node-Transport** für
OpenClaw. Alle Clients (CLI, Web-UI, macOS-App, iOS-/Android-Nodes, headless
Nodes) verbinden sich per WebSocket und deklarieren beim Handshake ihre **Rolle** + ihren **Scope**.

## Transport

- WebSocket, Text-Frames mit JSON-Payloads.
- Der erste Frame **muss** eine `connect`-Anfrage sein.
- Pre-Connect-Frames sind auf 64 KiB begrenzt. Nach einem erfolgreichen Handshake sollten Clients
  die Limits `hello-ok.policy.maxPayload` und
  `hello-ok.policy.maxBufferedBytes` einhalten. Bei aktivierter Diagnose
  geben zu große eingehende Frames und langsame ausgehende Puffer `payload.large`-Events aus,
  bevor der Gateway den betroffenen Frame schließt oder verwirft. Diese Events behalten
  Größen, Limits, Oberflächen und sichere Reason-Codes. Sie behalten nicht den Nachrichtentext,
  Anhangsinhalte, den rohen Frame-Body, Tokens, Cookies oder geheime Werte.

## Handshake (connect)

Gateway → Client (Pre-Connect-Challenge):

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Client → Gateway:

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

Gateway → Client:

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 4,
    "server": { "version": "…", "connId": "…" },
    "features": { "methods": ["…"], "events": ["…"] },
    "snapshot": { "…": "…" },
    "auth": {
      "role": "operator",
      "scopes": ["operator.read", "operator.write"]
    },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

Während der Gateway noch Startup-Sidecars fertigstellt, kann die `connect`-Anfrage
einen wiederholbaren `UNAVAILABLE`-Fehler zurückgeben, bei dem `details.reason` auf
`"startup-sidecars"` und `retryAfterMs` gesetzt ist. Clients sollten diese Antwort
innerhalb ihres gesamten Verbindungsbudgets erneut versuchen, statt sie als endgültigen
Handshake-Fehler anzuzeigen.

`server`, `features`, `snapshot` und `policy` sind alle vom Schema
(`src/gateway/protocol/schema/frames.ts`) erforderlich. `auth` ist ebenfalls erforderlich und meldet
die ausgehandelte Rolle und Scopes. `pluginSurfaceUrls` ist optional und ordnet Plugin-
Oberflächennamen wie `canvas` bereichsgebundenen gehosteten URLs zu.

Bereichsgebundene Plugin-Oberflächen-URLs können ablaufen. Nodes können
`node.pluginSurface.refresh` mit `{ "surface": "canvas" }` aufrufen, um einen frischen
Eintrag in `pluginSurfaceUrls` zu erhalten. Das experimentelle Refactoring des Canvas-Plugins
unterstützt den veralteten Kompatibilitätspfad `canvasHostUrl`, `canvasCapability` oder
`node.canvas.capability.refresh` nicht; aktuelle native Clients und
Gateways müssen Plugin-Oberflächen verwenden.

Wenn kein Device-Token ausgestellt wird, meldet `hello-ok.auth` die ausgehandelten
Berechtigungen ohne Token-Felder:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Vertrauenswürdige Same-Process-Backend-Clients (`client.id: "gateway-client"`,
`client.mode: "backend"`) dürfen `device` bei direkten Loopback-Verbindungen weglassen, wenn
sie sich mit dem gemeinsamen Gateway-Token/Passwort authentifizieren. Dieser Pfad ist für interne
Control-Plane-RPCs reserviert und verhindert, dass veraltete CLI-/Device-Pairing-Baselines
lokale Backend-Arbeit wie Subagent-Session-Updates blockieren. Remote-Clients,
Browser-Origin-Clients, Node-Clients und explizite Device-Token-/Device-Identity-
Clients verwenden weiterhin die normalen Pairing- und Scope-Upgrade-Prüfungen.

Wenn ein Device-Token ausgestellt wird, enthält `hello-ok` außerdem:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Während der vertrauenswürdigen Bootstrap-Übergabe kann `hello-ok.auth` außerdem zusätzliche
begrenzte Rolleneinträge in `deviceTokens` enthalten:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "node",
    "scopes": [],
    "deviceTokens": [
      {
        "deviceToken": "…",
        "role": "operator",
        "scopes": ["operator.approvals", "operator.read", "operator.talk.secrets", "operator.write"]
      }
    ]
  }
}
```

Für den eingebauten Node-/Operator-Bootstrap-Flow bleibt das primäre Node-Token bei
`scopes: []`, und jedes übergebene Operator-Token bleibt auf die Bootstrap-
Operator-Allowlist (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`) begrenzt. Bootstrap-Scope-Prüfungen bleiben
rollenpräfixiert: Operator-Einträge erfüllen nur Operator-Anfragen, und Nicht-Operator-
Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

### Node-Beispiel

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 4,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

## Framing

- **Anfrage**: `{type:"req", id, method, params}`
- **Antwort**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Methoden mit Seiteneffekten erfordern **Idempotency Keys** (siehe Schema).

## Rollen + Scopes

Das vollständige Operator-Scope-Modell, Approval-Time-Prüfungen und Shared-Secret-
Semantik finden Sie unter [Operator-Scopes](/de/gateway/operator-scopes).

### Rollen

- `operator` = Control-Plane-Client (CLI/UI/Automatisierung).
- `node` = Capability-Host (camera/screen/canvas/system.run).

### Scopes (Operator)

Häufige Scopes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` mit `includeSecrets: true` erfordert `operator.talk.secrets`
(oder `operator.admin`).

Vom Plugin registrierte Gateway-RPC-Methoden können ihren eigenen Operator-Scope anfordern, aber
reservierte Core-Admin-Präfixe (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) werden immer zu `operator.admin` aufgelöst.

Der Methoden-Scope ist nur die erste Hürde. Einige Slash Commands, die über
`chat.send` erreicht werden, wenden zusätzlich strengere Prüfungen auf Befehlsebene an. Beispielsweise erfordern dauerhafte
Schreibvorgänge `/config set` und `/config unset` `operator.admin`.

`node.pair.approve` hat zusätzlich zum grundlegenden Methodenscope eine weitere Approval-Time-
Scope-Prüfung:

- Anfragen ohne Befehle: `operator.pairing`
- Anfragen mit Nicht-Exec-Node-Befehlen: `operator.pairing` + `operator.write`
- Anfragen, die `system.run`, `system.run.prepare` oder `system.which` enthalten:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (Node)

Nodes deklarieren Capability-Claims beim Verbinden:

- `caps`: übergeordnete Capability-Kategorien wie `camera`, `canvas`, `screen`,
  `location`, `voice` und `talk`.
- `commands`: Command-Allowlist für Invoke.
- `permissions`: granulare Umschalter (z. B. `screen.record`, `camera.capture`).

Der Gateway behandelt diese als **Claims** und erzwingt serverseitige Allowlists.

## Präsenz

- `system-presence` gibt Einträge zurück, die nach Device-Identity geschlüsselt sind.
- Präsenz-Einträge enthalten `deviceId`, `roles` und `scopes`, damit UIs eine einzelne Zeile pro Gerät anzeigen können,
  auch wenn es sowohl als **Operator** als auch als **Node** verbunden ist.
- `node.list` enthält optionale Felder `lastSeenAtMs` und `lastSeenReason`. Verbundene Nodes melden
  ihre aktuelle Verbindungszeit als `lastSeenAtMs` mit dem Grund `connect`; gepaarte Nodes können außerdem
  dauerhafte Hintergrundpräsenz melden, wenn ein vertrauenswürdiges Node-Event ihre Pairing-Metadaten aktualisiert.

### Node-Hintergrund-alive-Event

Nodes können `node.event` mit `event: "node.presence.alive"` aufrufen, um aufzuzeichnen, dass ein gepaarter Node
während eines Hintergrund-Weckvorgangs aktiv war, ohne ihn als verbunden zu markieren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` ist ein geschlossenes Enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` oder `connect`. Unbekannte Trigger-Strings werden vom Gateway vor der Persistierung zu
`background` normalisiert. Das Event ist nur für authentifizierte Node-
Device-Sessions dauerhaft; device-lose oder nicht gepaarte Sessions geben `handled: false` zurück.

Erfolgreiche Gateways geben ein strukturiertes Ergebnis zurück:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Ältere Gateways können für `node.event` weiterhin `{ "ok": true }` zurückgeben; Clients sollten dies als
bestätigten RPC behandeln, nicht als dauerhafte Präsenzpersistierung.

## Scope-Eingrenzung für Broadcast-Events

Serverseitig gepushte WebSocket-Broadcast-Events sind durch Scopes geschützt, damit Pairing-begrenzte oder reine Node-Sessions nicht passiv Session-Inhalte empfangen.

- **Chat-, Agent- und Tool-Result-Frames** (einschließlich gestreamter `agent`-Events und Tool-Call-Ergebnisse) erfordern mindestens `operator.read`. Sessions ohne `operator.read` überspringen diese Frames vollständig.
- **Plugin-definierte `plugin.*`-Broadcasts** werden je nachdem, wie das Plugin sie registriert hat, auf `operator.write` oder `operator.admin` begrenzt.
- **Status- und Transport-Events** (`heartbeat`, `presence`, `tick`, Connect-/Disconnect-Lebenszyklus usw.) bleiben uneingeschränkt, damit die Transportintegrität für jede authentifizierte Session beobachtbar bleibt.
- **Unbekannte Broadcast-Event-Familien** sind standardmäßig durch Scopes geschützt (fail-closed), sofern ein registrierter Handler sie nicht ausdrücklich lockert.

Jede Client-Verbindung behält ihre eigene clientbezogene Sequenznummer, damit Broadcasts auf diesem Socket eine monotone Reihenfolge bewahren, auch wenn unterschiedliche Clients verschiedene scope-gefilterte Teilmengen des Event-Streams sehen.

## Häufige RPC-Methodenfamilien

Die öffentliche WS-Oberfläche ist umfangreicher als die obigen Handshake-/Auth-Beispiele. Dies
ist kein generierter Dump — `hello-ok.features.methods` ist eine konservative
Discovery-Liste, die aus `src/gateway/server-methods-list.ts` plus geladenen
Plugin-/Channel-Methodenexporten erstellt wird. Behandeln Sie sie als Feature-Discovery, nicht als vollständige
Aufzählung von `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System und Identität">
    - `health` gibt den zwischengespeicherten oder frisch geprüften Gateway-Health-Snapshot zurück.
    - `diagnostics.stability` gibt den aktuellen begrenzten Recorder für diagnostische Stabilität zurück. Er behält operative Metadaten wie Event-Namen, Zählungen, Bytegrößen, Speicherwerte, Queue-/Session-Zustand, Channel-/Plugin-Namen und Session-IDs. Er behält keine Chat-Texte, Webhook-Bodys, Tool-Ausgaben, rohen Anfrage- oder Antwort-Bodys, Tokens, Cookies oder geheimen Werte. Operator-Read-Scope ist erforderlich.
    - `status` gibt die Gateway-Zusammenfassung im Stil von `/status` zurück; sensible Felder werden nur für admin-begrenzte Operator-Clients einbezogen.
    - `gateway.identity.get` gibt die Gateway-Device-Identity zurück, die von Relay- und Pairing-Flows verwendet wird.
    - `system-presence` gibt den aktuellen Präsenz-Snapshot für verbundene Operator-/Node-Geräte zurück.
    - `system-event` hängt ein System-Event an und kann Präsenzkontext aktualisieren/übertragen.
    - `last-heartbeat` gibt das zuletzt persistierte Heartbeat-Event zurück.
    - `set-heartbeats` schaltet die Heartbeat-Verarbeitung auf dem Gateway um.

  </Accordion>

  <Accordion title="Modelle und Nutzung">
    - `models.list` gibt den zur Laufzeit zulässigen Modellkatalog zurück. Übergeben Sie `{ "view": "configured" }` für konfigurierte Modelle in Picker-Größe (`agents.defaults.models` zuerst, dann `models.providers.*.models`) oder `{ "view": "all" }` für den vollständigen Katalog.
    - `usage.status` gibt Provider-Nutzungsfenster und Zusammenfassungen des verbleibenden Kontingents zurück.
    - `usage.cost` gibt aggregierte Kostennutzungszusammenfassungen für einen Datumsbereich zurück.
    - `doctor.memory.status` gibt die Bereitschaft von Vektorspeicher / gecachten Einbettungen für den aktiven Standard-Agent-Arbeitsbereich zurück. Übergeben Sie `{ "probe": true }` oder `{ "deep": true }` nur, wenn der Aufrufer ausdrücklich einen Live-Ping an den Embedding-Provider wünscht.
    - `doctor.memory.remHarness` gibt eine begrenzte, schreibgeschützte REM-Harness-Vorschau für Remote-Control-Plane-Clients zurück. Sie kann Arbeitsbereichspfade, Speicherausschnitte, gerendertes grounded Markdown und Kandidaten für Deep Promotion enthalten, daher benötigen Aufrufer `operator.read`.
    - `sessions.usage` gibt Nutzungszusammenfassungen pro Sitzung zurück.
    - `sessions.usage.timeseries` gibt Zeitreihen-Nutzung für eine Sitzung zurück.
    - `sessions.usage.logs` gibt Nutzungsprotokolleinträge für eine Sitzung zurück.

  </Accordion>

  <Accordion title="Kanäle und Login-Helfer">
    - `channels.status` gibt Statuszusammenfassungen für integrierte + gebündelte Kanäle/Plugins zurück.
    - `channels.logout` meldet einen bestimmten Kanal/Account ab, sofern der Kanal Logout unterstützt.
    - `web.login.start` startet einen QR-/Web-Login-Ablauf für den aktuellen QR-fähigen Web-Channel-Provider.
    - `web.login.wait` wartet, bis dieser QR-/Web-Login-Ablauf abgeschlossen ist, und startet den Kanal bei Erfolg.
    - `push.test` sendet einen Test-APNs-Push an einen registrierten iOS-Node.
    - `voicewake.get` gibt die gespeicherten Wake-Word-Auslöser zurück.
    - `voicewake.set` aktualisiert Wake-Word-Auslöser und verteilt die Änderung.

  </Accordion>

  <Accordion title="Nachrichten und Protokolle">
    - `send` ist der direkte RPC für ausgehende Zustellung für auf Kanal/Account/Thread ausgerichtetes Senden außerhalb des Chat-Runners.
    - `logs.tail` gibt den konfigurierten Gateway-Dateiprotokoll-Tail mit Cursor-/Limit- und Max-Byte-Steuerung zurück.

  </Accordion>

  <Accordion title="Talk und TTS">
    - `talk.catalog` gibt den schreibgeschützten Talk-Provider-Katalog für Sprache, Streaming-Transkription und Echtzeitstimme zurück. Er enthält Provider-IDs, Bezeichnungen, Konfigurationsstatus, offengelegte Modell-/Voice-IDs, kanonische Modi, Transporte, Brain-Strategien sowie Echtzeit-Audio-/Capability-Flags, ohne Provider-Secrets zurückzugeben oder die globale Konfiguration zu verändern.
    - `talk.config` gibt die effektive Talk-Konfigurations-Payload zurück; `includeSecrets` erfordert `operator.talk.secrets` (oder `operator.admin`).
    - `talk.session.create` erstellt eine vom Gateway verwaltete Talk-Sitzung für `realtime/gateway-relay`, `transcription/gateway-relay` oder `stt-tts/managed-room`. `brain: "direct-tools"` erfordert `operator.admin`.
    - `talk.session.join` validiert ein Managed-Room-Sitzungstoken, gibt bei Bedarf `session.ready`- oder `session.replaced`-Events aus und gibt Raum-/Sitzungsmetadaten plus aktuelle Talk-Events zurück, ohne das Klartext-Token oder den gespeicherten Token-Hash.
    - `talk.session.appendAudio` hängt base64-codiertes PCM-Eingabeaudio an vom Gateway verwaltete Echtzeit-Relay- und Transkriptionssitzungen an.
    - `talk.session.startTurn`, `talk.session.endTurn` und `talk.session.cancelTurn` steuern den Turn-Lebenszyklus für Managed Rooms mit Ablehnung veralteter Turns, bevor der Zustand gelöscht wird.
    - `talk.session.cancelOutput` stoppt die Audioausgabe des Assistenten, hauptsächlich für VAD-gesteuertes Barge-in in Gateway-Relay-Sitzungen.
    - `talk.session.submitToolResult` schließt einen Provider-Tool-Aufruf ab, der von einer vom Gateway verwalteten Echtzeit-Relay-Sitzung ausgegeben wurde. Übergeben Sie `options: { willContinue: true }` für vorläufige Tool-Ausgabe, wenn ein finales Ergebnis folgt, oder `options: { suppressResponse: true }`, wenn das Tool-Ergebnis den Provider-Aufruf erfüllen soll, ohne eine weitere Echtzeit-Assistentenantwort zu starten.
    - `talk.session.close` schließt eine vom Gateway verwaltete Relay-, Transkriptions- oder Managed-Room-Sitzung und gibt abschließende Talk-Events aus.
    - `talk.mode` setzt/verteilt den aktuellen Talk-Moduszustand für WebChat-/Control-UI-Clients.
    - `talk.client.create` erstellt eine clientverwaltete Echtzeit-Provider-Sitzung mit `webrtc` oder `provider-websocket`, während das Gateway Konfiguration, Anmeldedaten, Anweisungen und Tool-Richtlinie verwaltet.
    - `talk.client.toolCall` lässt clientverwaltete Echtzeit-Transporte Provider-Tool-Aufrufe an die Gateway-Richtlinie weiterleiten. Das erste unterstützte Tool ist `openclaw_agent_consult`; Clients erhalten eine Run-ID und warten auf normale Chat-Lebenszyklus-Events, bevor sie das Provider-spezifische Tool-Ergebnis übermitteln.
    - `talk.event` ist der zentrale Talk-Event-Kanal für Echtzeit-, Transkriptions-, STT/TTS-, Managed-Room-, Telefonie- und Meeting-Adapter.
    - `talk.speak` synthetisiert Sprache über den aktiven Talk-Sprach-Provider.
    - `tts.status` gibt TTS-Aktivierungsstatus, aktiven Provider, Fallback-Provider und Provider-Konfigurationsstatus zurück.
    - `tts.providers` gibt das sichtbare TTS-Provider-Inventar zurück.
    - `tts.enable` und `tts.disable` schalten den TTS-Präferenzstatus um.
    - `tts.setProvider` aktualisiert den bevorzugten TTS-Provider.
    - `tts.convert` führt eine einmalige Text-zu-Sprache-Konvertierung aus.

  </Accordion>

  <Accordion title="Secrets, Konfiguration, Update und Wizard">
    - `secrets.reload` löst aktive SecretRefs erneut auf und tauscht den Laufzeit-Secret-Zustand nur bei vollständigem Erfolg aus.
    - `secrets.resolve` löst auf einen Befehl ausgerichtete Secret-Zuweisungen für eine bestimmte Befehls-/Zielmenge auf.
    - `config.get` gibt den aktuellen Konfigurations-Snapshot und Hash zurück.
    - `config.set` schreibt eine validierte Konfigurations-Payload.
    - `config.patch` führt eine partielle Konfigurationsaktualisierung zusammen.
    - `config.apply` validiert und ersetzt die vollständige Konfigurations-Payload.
    - `config.schema` gibt die Live-Konfigurationsschema-Payload zurück, die von Control UI und CLI-Tooling verwendet wird: Schema, `uiHints`, Version und Generierungsmetadaten, einschließlich Plugin- + Kanalschema-Metadaten, wenn die Laufzeit sie laden kann. Das Schema enthält Feld-`title`- / `description`-Metadaten, die aus denselben Bezeichnungen und Hilfetexten abgeleitet sind, die von der UI verwendet werden, einschließlich verschachtelter Objekt-, Platzhalter-, Array-Element- und `anyOf`- / `oneOf`- / `allOf`-Kompositionszweige, wenn passende Felddokumentation vorhanden ist.
    - `config.schema.lookup` gibt eine pfadbezogene Lookup-Payload für einen Konfigurationspfad zurück: normalisierter Pfad, ein flacher Schema-Knoten, passender Hint + `hintPath` und unmittelbare Kindzusammenfassungen für UI-/CLI-Drilldown. Lookup-Schema-Knoten behalten die nutzerseitige Dokumentation und gängige Validierungsfelder bei (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerische/String-/Array-/Objektgrenzen und Flags wie `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Kindzusammenfassungen legen `key`, normalisierten `path`, `type`, `required`, `hasChildren` sowie den passenden `hint` / `hintPath` offen.
    - `update.run` führt den Gateway-Update-Ablauf aus und plant einen Neustart nur, wenn das Update selbst erfolgreich war; Aufrufer mit einer Sitzung können `continuationMessage` einbeziehen, damit der Start einen nachfolgenden Agent-Turn über die Neustart-Fortsetzungswarteschlange fortsetzt. Package-Manager-Updates erzwingen nach dem Pakettausch einen nicht aufschiebbaren Update-Neustart ohne Cooldown, damit der alte Gateway-Prozess nicht weiter Lazy Loading aus einem ersetzten `dist`-Baum ausführt.
    - `update.status` gibt den neuesten gecachten Update-Neustart-Sentinel zurück, einschließlich der nach dem Neustart laufenden Version, sofern verfügbar.
    - `wizard.start`, `wizard.next`, `wizard.status` und `wizard.cancel` stellen den Onboarding-Wizard über WS RPC bereit.

  </Accordion>

  <Accordion title="Agent- und Arbeitsbereichshelfer">
    - `agents.list` gibt konfigurierte Agent-Einträge zurück, einschließlich effektivem Modell und Laufzeitmetadaten.
    - `agents.create`, `agents.update` und `agents.delete` verwalten Agent-Datensätze und Arbeitsbereichsverkabelung.
    - `agents.files.list`, `agents.files.get` und `agents.files.set` verwalten die Bootstrap-Arbeitsbereichsdateien, die für einen Agent offengelegt werden.
    - `tasks.list`, `tasks.get` und `tasks.cancel` stellen SDK- und Operator-Clients das Gateway-Aufgabenbuch bereit.
    - `artifacts.list`, `artifacts.get` und `artifacts.download` stellen aus Transkripten abgeleitete Artefaktzusammenfassungen und Downloads für einen expliziten `sessionKey`-, `runId`- oder `taskId`-Scope bereit. Run- und Task-Abfragen lösen die zugehörige Sitzung serverseitig auf und geben nur Transkriptmedien mit passender Provenienz zurück; unsichere oder lokale URL-Quellen geben nicht unterstützte Downloads zurück, statt serverseitig abgerufen zu werden.
    - `environments.list` und `environments.status` stellen schreibgeschützte Gateway-lokale und Node-Umgebungserkennung für SDK-Clients bereit.
    - `agent.identity.get` gibt die effektive Assistentenidentität für einen Agent oder eine Sitzung zurück.
    - `agent.wait` wartet, bis ein Run abgeschlossen ist, und gibt den terminalen Snapshot zurück, sofern verfügbar.

  </Accordion>

  <Accordion title="Sitzungssteuerung">
    - `sessions.list` gibt den aktuellen Sitzungsindex zurück, einschließlich `agentRuntime`-Metadaten pro Zeile, wenn ein Agent-Laufzeit-Backend konfiguriert ist.
    - `sessions.subscribe` und `sessions.unsubscribe` schalten Sitzungsänderungs-Event-Abonnements für den aktuellen WS-Client um.
    - `sessions.messages.subscribe` und `sessions.messages.unsubscribe` schalten Transkript-/Nachrichten-Event-Abonnements für eine Sitzung um.
    - `sessions.preview` gibt begrenzte Transkriptvorschauen für bestimmte Sitzungsschlüssel zurück.
    - `sessions.describe` gibt eine Gateway-Sitzungszeile für einen exakten Sitzungsschlüssel zurück.
    - `sessions.resolve` löst ein Sitzungsziel auf oder kanonisiert es.
    - `sessions.create` erstellt einen neuen Sitzungseintrag.
    - `sessions.send` sendet eine Nachricht in eine bestehende Sitzung.
    - `sessions.steer` ist die Unterbrechen-und-Steuern-Variante für eine aktive Sitzung.
    - `sessions.abort` bricht aktive Arbeit für eine Sitzung ab. Ein Aufrufer kann `key` plus optional `runId` übergeben oder nur `runId` für aktive Runs übergeben, die das Gateway einer Sitzung zuordnen kann.
    - `sessions.patch` aktualisiert Sitzungsmetadaten/-Overrides und meldet das aufgelöste kanonische Modell plus effektives `agentRuntime`.
    - `sessions.reset`, `sessions.delete` und `sessions.compact` führen Sitzungswartung aus.
    - `sessions.get` gibt die vollständige gespeicherte Sitzungszeile zurück.
    - Die Chat-Ausführung verwendet weiterhin `chat.history`, `chat.send`, `chat.abort` und `chat.inject`. `chat.history` ist für UI-Clients anzeige-normalisiert: Inline-Direktiv-Tags werden aus sichtbarem Text entfernt, Klartext-Tool-Call-XML-Payloads (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke) und durchgesickerte ASCII-/Full-Width-Modellsteuerungstokens werden entfernt, reine Silent-Token-Assistentenzeilen wie exakt `NO_REPLY` / `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden.

  </Accordion>

  <Accordion title="Gerätekopplung und Gerätetoken">
    - `device.pair.list` gibt ausstehende und genehmigte gekoppelte Geräte zurück.
    - `device.pair.approve`, `device.pair.reject` und `device.pair.remove` verwalten Gerätekopplungsdatensätze.
    - `device.token.rotate` rotiert ein gekoppeltes Gerätetoken innerhalb seiner genehmigten Rollen- und Aufrufer-Scope-Grenzen.
    - `device.token.revoke` widerruft ein gekoppeltes Gerätetoken innerhalb seiner genehmigten Rollen- und Aufrufer-Scope-Grenzen.

  </Accordion>

  <Accordion title="Node-Kopplung, Aufruf und ausstehende Arbeit">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` und `node.pair.verify` decken Node-Kopplung und Bootstrap-Verifizierung ab.
    - `node.list` und `node.describe` geben bekannte/verbundene Node-Zustände zurück.
    - `node.rename` aktualisiert eine gekoppelte Node-Bezeichnung.
    - `node.invoke` leitet einen Befehl an einen verbundenen Node weiter.
    - `node.invoke.result` gibt das Ergebnis für eine Aufrufanforderung zurück.
    - `node.event` transportiert vom Node stammende Events zurück in das Gateway.
    - `node.pending.pull` und `node.pending.ack` sind die Warteschlangen-APIs für verbundene Nodes.
    - `node.pending.enqueue` und `node.pending.drain` verwalten dauerhafte ausstehende Arbeit für offline/disconnectete Nodes.

  </Accordion>

  <Accordion title="Genehmigungsfamilien">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` und `exec.approval.resolve` decken einmalige Exec-Genehmigungsanfragen sowie das Nachschlagen/Wiedergeben ausstehender Genehmigungen ab.
    - `exec.approval.waitDecision` wartet auf eine ausstehende Exec-Genehmigung und gibt die endgültige Entscheidung zurück (oder `null` bei Zeitüberschreitung).
    - `exec.approvals.get` und `exec.approvals.set` verwalten Snapshots der Exec-Genehmigungsrichtlinie des Gateways.
    - `exec.approvals.node.get` und `exec.approvals.node.set` verwalten die node-lokale Exec-Genehmigungsrichtlinie über Node-Relay-Befehle.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` und `plugin.approval.resolve` decken Plugin-definierte Genehmigungsabläufe ab.

  </Accordion>

  <Accordion title="Automatisierung, Skills und Tools">
    - Automatisierung: `wake` plant eine sofortige oder nächste Heartbeat-Wecktext-Injektion; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` verwalten geplante Arbeit.
    - Skills und Tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Häufige Ereignisfamilien

- `chat`: UI-Chat-Aktualisierungen wie `chat.inject` und andere rein transkriptbezogene Chat-
  Ereignisse.
- `session.message` und `session.tool`: Transkript-/Ereignisstrom-Aktualisierungen für eine
  abonnierte Sitzung.
- `sessions.changed`: Sitzungsindex oder Metadaten geändert.
- `presence`: Aktualisierungen des Systempräsenz-Snapshots.
- `tick`: periodisches Keepalive-/Liveness-Ereignis.
- `health`: Aktualisierung des Gateway-Zustands-Snapshots.
- `heartbeat`: Aktualisierung des Heartbeat-Ereignisstroms.
- `cron`: Ereignis zur Änderung eines Cron-Laufs/-Jobs.
- `shutdown`: Benachrichtigung zum Herunterfahren des Gateways.
- `node.pair.requested` / `node.pair.resolved`: Node-Pairing-Lebenszyklus.
- `node.invoke.request`: Broadcast einer Node-Aufrufanfrage.
- `device.pair.requested` / `device.pair.resolved`: Lebenszyklus gekoppelter Geräte.
- `voicewake.changed`: Wake-Word-Trigger-Konfiguration geändert.
- `exec.approval.requested` / `exec.approval.resolved`: Exec-Genehmigungs-
  Lebenszyklus.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin-Genehmigungs-
  Lebenszyklus.

### Node-Hilfsmethoden

- Nodes können `skills.bins` aufrufen, um die aktuelle Liste der ausführbaren Skill-Dateien
  für Auto-Allow-Prüfungen abzurufen.

### Task-Ledger-RPCs

Operator-Clients können Gateway-Hintergrundaufgabendatensätze über die
Task-Ledger-RPCs prüfen und abbrechen. Diese Methoden geben bereinigte Aufgabenzusammenfassungen zurück, nicht den rohen
Laufzeitstatus.

- `tasks.list` erfordert `operator.read`.
  - Parameter: optional `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` oder `"timed_out"`) oder ein Array dieser Statuswerte,
    optional `agentId`, optional `sessionKey`, optional `limit` von `1` bis
    `500` und optionaler String `cursor`.
  - Ergebnis: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` erfordert `operator.read`.
  - Parameter: `{ "taskId": string }`.
  - Ergebnis: `{ "task": TaskSummary }`.
  - Fehlende Task-IDs geben die Not-Found-Fehlerform des Gateways zurück.
- `tasks.cancel` erfordert `operator.write`.
  - Parameter: `{ "taskId": string, "reason"?: string }`.
  - Ergebnis:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` meldet, ob das Ledger eine passende Aufgabe enthielt. `cancelled`
    meldet, ob die Laufzeit den Abbruch akzeptiert oder aufgezeichnet hat.

`TaskSummary` enthält `id`, `status` und optionale Metadaten wie `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, Zeitstempel, Fortschritt,
abschließende Zusammenfassung und bereinigten Fehlertext.

### Operator-Hilfsmethoden

- Operatoren können `commands.list` (`operator.read`) aufrufen, um den Laufzeit-
  Befehlsbestand für einen Agent abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agent-Workspace zu lesen.
  - `scope` steuert, auf welche Oberfläche das primäre `name` zielt:
    - `text` gibt das primäre Textbefehlstoken ohne führendes `/` zurück
    - `native` und der standardmäßige `both`-Pfad geben Provider-bewusste native Namen
      zurück, wenn verfügbar
  - `textAliases` enthält exakte Slash-Aliase wie `/model` und `/m`.
  - `nativeName` enthält den Provider-bewussten nativen Befehlsnamen, wenn einer existiert.
  - `provider` ist optional und wirkt sich nur auf native Benennung sowie native Plugin-
    Befehlsverfügbarkeit aus.
  - `includeArgs=false` lässt serialisierte Argumentmetadaten in der Antwort weg.
- Operatoren können `tools.catalog` (`operator.read`) aufrufen, um den Laufzeit-Toolkatalog für einen
  Agent abzurufen. Die Antwort enthält gruppierte Tools und Provenienzmetadaten:
  - `source`: `core` oder `plugin`
  - `pluginId`: Plugin-Besitzer, wenn `source="plugin"`
  - `optional`: ob ein Plugin-Tool optional ist
- Operatoren können `tools.effective` (`operator.read`) aufrufen, um den zur Laufzeit wirksamen Tool-
  Bestand für eine Sitzung abzurufen.
  - `sessionKey` ist erforderlich.
  - Das Gateway leitet vertrauenswürdigen Laufzeitkontext serverseitig aus der Sitzung ab, statt
    vom Aufrufer bereitgestellten Auth- oder Zustellungskontext zu akzeptieren.
  - Die Antwort ist sitzungsbezogen und spiegelt wider, was die aktive Unterhaltung jetzt verwenden kann,
    einschließlich Core-, Plugin- und Kanal-Tools.
- Operatoren können `tools.invoke` (`operator.write`) aufrufen, um ein verfügbares Tool über denselben
  Gateway-Richtlinienpfad wie `/tools/invoke` aufzurufen.
  - `name` ist erforderlich. `args`, `sessionKey`, `agentId`, `confirm` und
    `idempotencyKey` sind optional.
  - Wenn sowohl `sessionKey` als auch `agentId` vorhanden sind, muss der aufgelöste Sitzungs-Agent
    `agentId` entsprechen.
  - Die Antwort ist ein SDK-seitiges Envelope mit `ok`, `toolName`, optionalem `output` und typisierten
    `error`-Feldern. Genehmigungs- oder Richtlinienablehnungen geben `ok:false` in der Nutzlast zurück, statt
    die Gateway-Tool-Richtlinienpipeline zu umgehen.
- Operatoren können `skills.status` (`operator.read`) aufrufen, um den sichtbaren
  Skill-Bestand für einen Agent abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agent-Workspace zu lesen.
  - Die Antwort enthält Eignung, fehlende Anforderungen, Konfigurationsprüfungen und
    bereinigte Installationsoptionen, ohne rohe Secret-Werte offenzulegen.
- Operatoren können `skills.search` und `skills.detail` (`operator.read`) für
  ClawHub-Discovery-Metadaten aufrufen.
- Operatoren können `skills.upload.begin`, `skills.upload.chunk` und
  `skills.upload.commit` (`operator.admin`) aufrufen, um ein privates Skill-Archiv
  vor der Installation bereitzustellen. Dies ist ein separater Admin-Upload-Pfad für vertrauenswürdige Clients,
  nicht der normale ClawHub-Skill-Installationsablauf, und standardmäßig deaktiviert, sofern
  `skills.install.allowUploadedArchives` nicht aktiviert ist.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    erstellt einen Upload, der an diesen Slug- und Force-Wert gebunden ist.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` hängt Bytes am
    exakt decodierten Offset an.
  - `skills.upload.commit({ uploadId, sha256? })` prüft die endgültige Größe und
    SHA-256. Commit schließt nur den Upload ab; es installiert den Skill nicht.
  - Hochgeladene Skill-Archive sind ZIP-Archive, die eine `SKILL.md`-Root enthalten. Der
    interne Verzeichnisname des Archivs wählt niemals das Installationsziel aus.
- Operatoren können `skills.install` (`operator.admin`) in drei Modi aufrufen:
  - ClawHub-Modus: `{ source: "clawhub", slug, version?, force? }` installiert einen
    Skill-Ordner in das `skills/`-Verzeichnis des Standard-Agent-Workspaces.
  - Upload-Modus: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installiert einen abgeschlossenen Upload in das Verzeichnis `skills/<slug>`
    des Standard-Agent-Workspaces. Slug und Force-Wert müssen der ursprünglichen
    `skills.upload.begin`-Anfrage entsprechen. Dieser Modus wird abgelehnt, sofern
    `skills.install.allowUploadedArchives` nicht aktiviert ist. Die Einstellung wirkt sich nicht
    auf ClawHub-Installationen aus.
  - Gateway-Installer-Modus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    führt eine deklarierte `metadata.openclaw.install`-Aktion auf dem Gateway-Host aus.
- Operatoren können `skills.update` (`operator.admin`) in zwei Modi aufrufen:
  - Der ClawHub-Modus aktualisiert einen nachverfolgten Slug oder alle nachverfolgten ClawHub-Installationen im
    Standard-Agent-Workspace.
  - Der Konfigurationsmodus patcht Werte unter `skills.entries.<skillKey>` wie `enabled`,
    `apiKey` und `env`.

### `models.list`-Ansichten

`models.list` akzeptiert einen optionalen `view`-Parameter:

- Weggelassen oder `"default"`: aktuelles Laufzeitverhalten. Wenn `agents.defaults.models` konfiguriert ist, ist die Antwort der erlaubte Katalog, einschließlich dynamisch entdeckter Modelle für `provider/*`-Einträge. Andernfalls ist die Antwort der vollständige Gateway-Katalog.
- `"configured"`: Picker-großes Verhalten. Wenn `agents.defaults.models` konfiguriert ist, hat es weiterhin Vorrang, einschließlich Provider-bezogener Discovery für `provider/*`-Einträge. Ohne Allowlist verwendet die Antwort explizite `models.providers.*.models`-Einträge und fällt nur dann auf den vollständigen Katalog zurück, wenn keine konfigurierten Modellzeilen existieren.
- `"all"`: vollständiger Gateway-Katalog unter Umgehung von `agents.defaults.models`. Verwenden Sie dies für Diagnose- und Discovery-UIs, nicht für normale Modell-Picker.

## Exec-Genehmigungen

- Wenn eine Exec-Anfrage Genehmigung benötigt, sendet das Gateway `exec.approval.requested`.
- Operator-Clients lösen dies durch Aufruf von `exec.approval.resolve` auf (erfordert den Scope `operator.approvals`).
- Für `host=node` muss `exec.approval.request` `systemRunPlan` enthalten (kanonische `argv`/`cwd`/`rawCommand`/Sitzungsmetadaten). Anfragen ohne `systemRunPlan` werden abgelehnt.
- Nach der Genehmigung verwenden weitergeleitete `node.invoke system.run`-Aufrufe diesen kanonischen
  `systemRunPlan` als autoritativen Befehls-/cwd-/Sitzungskontext.
- Wenn ein Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` zwischen Vorbereitung und der abschließenden genehmigten `system.run`-Weiterleitung verändert, lehnt das
  Gateway den Lauf ab, statt der veränderten Nutzlast zu vertrauen.

## Fallback für Agent-Zustellung

- `agent`-Anfragen können `deliver=true` enthalten, um ausgehende Zustellung anzufordern.
- `bestEffortDeliver=false` behält striktes Verhalten bei: nicht auflösbare oder nur interne Zustellziele geben `INVALID_REQUEST` zurück.
- `bestEffortDeliver=true` erlaubt einen Fallback auf sitzungsgebundene Ausführung, wenn keine extern zustellbare Route aufgelöst werden kann (zum Beispiel interne/Webchat-Sitzungen oder mehrdeutige Mehrkanal-Konfigurationen).
- Finale `agent`-Ergebnisse können `result.deliveryStatus` enthalten, wenn Zustellung
  angefordert wurde, und verwenden dabei dieselben Statuswerte `sent`, `suppressed`, `partial_failed` und `failed`,
  die für [`openclaw agent --json --deliver`](/de/cli/agent#json-delivery-status) dokumentiert sind.

## Versionierung

- `PROTOCOL_VERSION` befindet sich in `src/gateway/protocol/version.ts`.
- Clients senden `minProtocol` + `maxProtocol`; der Server lehnt Bereiche ab, die
  sein aktuelles Protokoll nicht einschließen. Native Clients verwenden eine v3-Untergrenze, sodass
  additive v4-Clients weiterhin v3-Gateways erreichen können.
- Schemas + Modelle werden aus TypeBox-Definitionen generiert:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Client-Konstanten

Der Referenzclient in `src/gateway/client.ts` verwendet diese Standardwerte. Werte sind
über Protokoll v4 hinweg stabil und sind die erwartete Grundlage für Drittanbieter-Clients.

| Konstante                                 | Standardwert                                          | Quelle                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `3`                                                   | `src/gateway/protocol/version.ts`                                                          |
| Anfrage-Timeout (pro RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth-/Connect-Challenge-Timeout        | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (Konfiguration/Env kann das gekoppelte Server-/Client-Budget erhöhen) |
| Anfänglicher Reconnect-Backoff            | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maximaler Reconnect-Backoff               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-Retry-Begrenzung nach Device-Token-Schließung | `250` ms                                      | `src/gateway/client.ts`                                                                    |
| Force-Stop-Kulanz vor `terminate()`       | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Standard-Timeout von `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Standard-Tick-Intervall (vor `hello-ok`)  | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick-Timeout-Schließung                   | Code `4000`, wenn Stille `tickIntervalMs * 2` überschreitet | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Der Server gibt die effektiven Werte `policy.tickIntervalMs`, `policy.maxPayload`
und `policy.maxBufferedBytes` in `hello-ok` bekannt; Clients sollten diese Werte
anstelle der Standardwerte vor dem Handshake beachten.

## Authentifizierung

- Shared-Secret-Gateway-Authentifizierung verwendet `connect.params.auth.token` oder
  `connect.params.auth.password`, abhängig vom konfigurierten Authentifizierungsmodus.
- Identitätstragende Modi wie Tailscale Serve
  (`gateway.auth.allowTailscale: true`) oder nicht über Loopback laufendes
  `gateway.auth.mode: "trusted-proxy"` erfüllen die Connect-Authentifizierungsprüfung über
  Anfrage-Header statt über `connect.params.auth.*`.
- Private-Ingress `gateway.auth.mode: "none"` überspringt die Shared-Secret-Connect-Authentifizierung
  vollständig; stellen Sie diesen Modus nicht auf öffentlichem/nicht vertrauenswürdigem Ingress bereit.
- Nach dem Pairing stellt der Gateway ein **Device Token** aus, das auf die Verbindungsrolle
  und Scopes begrenzt ist. Es wird in `hello-ok.auth.deviceToken` zurückgegeben und sollte
  vom Client für zukünftige Verbindungen persistiert werden.
- Clients sollten das primäre `hello-ok.auth.deviceToken` nach jeder
  erfolgreichen Verbindung persistieren.
- Beim erneuten Verbinden mit diesem **gespeicherten** Device Token sollte auch die gespeicherte
  genehmigte Scope-Menge für dieses Token wiederverwendet werden. Dadurch bleibt Lese-/Probe-/Statuszugriff
  erhalten, der bereits gewährt wurde, und es wird vermieden, dass Reconnects stillschweigend auf einen
  engeren impliziten Nur-Admin-Scope reduziert werden.
- Clientseitige Connect-Auth-Zusammenstellung (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` ist orthogonal und wird immer weitergeleitet, wenn gesetzt.
  - `auth.token` wird in Prioritätsreihenfolge befüllt: zuerst explizites Shared Token,
    dann ein explizites `deviceToken`, dann ein gespeichertes gerätespezifisches Token (indiziert nach
    `deviceId` + `role`).
  - `auth.bootstrapToken` wird nur gesendet, wenn keines der oben Genannten ein
    `auth.token` ergeben hat. Ein Shared Token oder ein aufgelöstes Device Token unterdrückt es.
  - Die automatische Hochstufung eines gespeicherten Device Tokens beim einmaligen
    `AUTH_TOKEN_MISMATCH`-Retry ist auf **vertrauenswürdige Endpunkte beschränkt**:
    Loopback oder `wss://` mit angepinntem `tlsFingerprint`. Öffentliches `wss://`
    ohne Pinning qualifiziert sich nicht.
- Zusätzliche Einträge in `hello-ok.auth.deviceTokens` sind Bootstrap-Handoff-Tokens.
  Persistieren Sie sie nur, wenn die Verbindung Bootstrap-Auth über einen vertrauenswürdigen Transport
  wie `wss://` oder Loopback/lokales Pairing verwendet hat.
- Wenn ein Client ein **explizites** `deviceToken` oder explizite `scopes` angibt, bleibt diese
  vom Aufrufer angeforderte Scope-Menge maßgeblich; gecachte Scopes werden nur wiederverwendet,
  wenn der Client das gespeicherte gerätespezifische Token wiederverwendet.
- Device Tokens können über `device.token.rotate` und
  `device.token.revoke` rotiert/widerrufen werden (erfordert den Scope `operator.pairing`).
- `device.token.rotate` gibt Rotationsmetadaten zurück. Es gibt das ersetzende
  Bearer-Token nur bei Aufrufen desselben Geräts aus, die bereits mit
  diesem Device Token authentifiziert sind, damit tokenbasierte Clients ihren Ersatz persistieren können,
  bevor sie sich erneut verbinden. Shared-/Admin-Rotationen geben das Bearer-Token nicht aus.
- Token-Ausstellung, -Rotation und -Widerruf bleiben auf die genehmigte Rollenmenge begrenzt,
  die im Pairing-Eintrag dieses Geräts erfasst ist; Token-Mutation kann keine Geräterolle erweitern oder
  ansteuern, die durch die Pairing-Genehmigung nie gewährt wurde.
- Bei Token-Sitzungen gekoppelter Geräte ist die Geräteverwaltung selbstbegrenzt, sofern der
  Aufrufer nicht auch `operator.admin` besitzt: Nicht-Admin-Aufrufer können nur ihren **eigenen**
  Geräteeintrag entfernen/widerrufen/rotieren.
- `device.token.rotate` und `device.token.revoke` prüfen außerdem die Ziel-Operator-Token-Scope-Menge
  gegen die aktuellen Sitzungsscopes des Aufrufers. Nicht-Admin-Aufrufer
  können kein breiteres Operator-Token rotieren oder widerrufen, als sie bereits besitzen.
- Authentifizierungsfehler enthalten `error.details.code` plus Wiederherstellungshinweise:
  - `error.details.canRetryWithDeviceToken` (boolesch)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Clientverhalten bei `AUTH_TOKEN_MISMATCH`:
  - Vertrauenswürdige Clients dürfen einen begrenzten Retry mit einem gecachten gerätespezifischen Token versuchen.
  - Wenn dieser Retry fehlschlägt, sollten Clients automatische Reconnect-Schleifen beenden und Handlungsanleitung für den Operator anzeigen.
- `AUTH_SCOPE_MISMATCH` bedeutet, dass das Device Token erkannt wurde, aber die
  angeforderte Rolle/Scopes nicht abdeckt. Clients sollten dies nicht als fehlerhaftes Token darstellen;
  fordern Sie den Operator auf, erneut zu pairen oder den engeren/breiteren Scope-Vertrag zu genehmigen.

## Geräteidentität + Pairing

- Nodes sollten eine stabile Geräteidentität (`device.id`) enthalten, die aus einem
  Keypair-Fingerprint abgeleitet ist.
- Gateways stellen Tokens pro Gerät + Rolle aus.
- Pairing-Genehmigungen sind für neue Geräte-IDs erforderlich, sofern lokale automatische Genehmigung
  nicht aktiviert ist.
- Automatische Pairing-Genehmigung ist auf direkte local loopback-Verbindungen ausgerichtet.
- OpenClaw hat außerdem einen engen Backend-/Container-lokalen Self-Connect-Pfad für
  vertrauenswürdige Shared-Secret-Hilfsabläufe.
- Same-Host-Tailnet- oder LAN-Verbindungen werden für Pairing weiterhin als remote behandelt und
  erfordern Genehmigung.
- WS-Clients enthalten normalerweise während `connect` eine `device`-Identität (Operator +
  Node). Die einzigen gerätelosen Operator-Ausnahmen sind explizite Vertrauenspfade:
  - `gateway.controlUi.allowInsecureAuth=true` für nur auf localhost beschränkte unsichere HTTP-Kompatibilität.
  - erfolgreiche Operator-Control-UI-Auth mit `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (Break-Glass, schwere Sicherheitsherabstufung).
  - direkte Loopback-`gateway-client`-Backend-RPCs, die mit dem gemeinsamen
    Gateway-Token/Passwort authentifiziert sind.
- Alle Verbindungen müssen die vom Server bereitgestellte `connect.challenge`-Nonce signieren.

### Diagnose für Geräteauthentifizierungs-Migration

Für Legacy-Clients, die noch Signierverhalten vor der Challenge verwenden, gibt `connect` nun
`DEVICE_AUTH_*`-Detailcodes unter `error.details.code` mit einem stabilen `error.details.reason` zurück.

Häufige Migrationsfehler:

| Nachricht                   | details.code                     | details.reason           | Bedeutung                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client hat `device.nonce` ausgelassen (oder leer gesendet). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client hat mit einer veralteten/falschen Nonce signiert. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signatur-Payload entspricht nicht dem v2-Payload.  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Signierter Zeitstempel liegt außerhalb der erlaubten Abweichung. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` stimmt nicht mit dem Public-Key-Fingerprint überein. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public-Key-Format/Kanonisierung ist fehlgeschlagen. |

Migrationsziel:

- Warten Sie immer auf `connect.challenge`.
- Signieren Sie den v2-Payload, der die Server-Nonce enthält.
- Senden Sie dieselbe Nonce in `connect.params.device.nonce`.
- Bevorzugter Signatur-Payload ist `v3`, der zusätzlich zu Geräte-/Client-/Rollen-/Scope-/Token-/Nonce-Feldern
  `platform` und `deviceFamily` bindet.
- Legacy-`v2`-Signaturen werden aus Kompatibilitätsgründen weiterhin akzeptiert, aber Metadaten-Pinning
  für gekoppelte Geräte steuert weiterhin die Befehlsrichtlinie beim Reconnect.

## TLS + Pinning

- TLS wird für WS-Verbindungen unterstützt.
- Clients können optional den Gateway-Zertifikatsfingerprint pinnen (siehe `gateway.tls`-
  Konfiguration plus `gateway.remote.tlsFingerprint` oder CLI `--tls-fingerprint`).

## Scope

Dieses Protokoll stellt die **vollständige Gateway-API** bereit (Status, Kanäle, Modelle, Chat,
Agent, Sitzungen, Nodes, Genehmigungen usw.). Die genaue Oberfläche wird durch die
TypeBox-Schemas in `src/gateway/protocol/schema.ts` definiert.

## Verwandte Themen

- [Bridge-Protokoll](/de/gateway/bridge-protocol)
- [Gateway-Runbook](/de/gateway)
