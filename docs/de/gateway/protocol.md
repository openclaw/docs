---
read_when:
    - Implementieren oder Aktualisieren von Gateway-WS-Clients
    - Fehlersuche bei Protokollabweichungen oder Verbindungsfehlern
    - Protokollschema und -modelle neu generieren
summary: 'Gateway-WebSocket-Protokoll: Handshake, Frames, Versionierung'
title: Gateway-Protokoll
x-i18n:
    generated_at: "2026-05-10T19:36:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: c8bca116f2b05387e3c045f94137dff4eafba281ea5f2eabb65e75469cba8e8e
    source_path: gateway/protocol.md
    workflow: 16
---

Gateway-WS-Protokoll ist die **einzige Control Plane + Node-Transport** für
OpenClaw. Alle Clients (CLI, Web-UI, macOS-App, iOS/Android-Nodes, headless
Nodes) verbinden sich über WebSocket und deklarieren ihre **Rolle** + **Scopes**
zum Handshake-Zeitpunkt.

## Transport

- WebSocket, Text-Frames mit JSON-Payloads.
- Der erste Frame **muss** eine `connect`-Anfrage sein.
- Pre-connect-Frames sind auf 64 KiB begrenzt. Nach einem erfolgreichen Handshake sollten Clients
  die Limits `hello-ok.policy.maxPayload` und
  `hello-ok.policy.maxBufferedBytes` einhalten. Bei aktivierter Diagnose geben
  übergroße eingehende Frames und langsame ausgehende Puffer `payload.large`-Ereignisse aus,
  bevor der Gateway den betroffenen Frame schließt oder verwirft. Diese Ereignisse behalten
  Größen, Limits, Oberflächen und sichere Ursachencodes. Sie behalten nicht den Nachrichtentext,
  Anhangsinhalte, den rohen Frame-Body, Tokens, Cookies oder geheime Werte.

## Handshake (connect)

Gateway → Client (Pre-connect-Challenge):

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
    "minProtocol": 4,
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

Während der Gateway den Start von Sidecars noch abschließt, kann die `connect`-Anfrage
einen wiederholbaren `UNAVAILABLE`-Fehler zurückgeben, bei dem `details.reason` auf
`"startup-sidecars"` gesetzt ist und `retryAfterMs` enthält. Clients sollten diese Antwort
innerhalb ihres gesamten Verbindungsbudgets erneut versuchen, anstatt sie als terminalen
Handshake-Fehler anzuzeigen.

`server`, `features`, `snapshot` und `policy` sind alle durch das Schema erforderlich
(`src/gateway/protocol/schema/frames.ts`). `auth` ist ebenfalls erforderlich und meldet
die ausgehandelten Rollen/Scopes. `pluginSurfaceUrls` ist optional und ordnet Plugin-
Oberflächennamen, etwa `canvas`, scoped gehosteten URLs zu.

Scoped Plugin-Oberflächen-URLs können ablaufen. Nodes können
`node.pluginSurface.refresh` mit `{ "surface": "canvas" }` aufrufen, um einen frischen
Eintrag in `pluginSurfaceUrls` zu erhalten. Das experimentelle Canvas-Plugin-Refactoring
unterstützt den veralteten Kompatibilitätspfad `canvasHostUrl`, `canvasCapability` oder
`node.canvas.capability.refresh` nicht; aktuelle native Clients und Gateways müssen
Plugin-Oberflächen verwenden.

Wenn kein Geräte-Token ausgegeben wird, meldet `hello-ok.auth` die ausgehandelten
Berechtigungen ohne Token-Felder:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Vertrauenswürdige Backend-Clients im selben Prozess (`client.id: "gateway-client"`,
`client.mode: "backend"`) dürfen `device` bei direkten loopback-Verbindungen auslassen,
wenn sie sich mit dem gemeinsam genutzten Gateway-Token/Passwort authentifizieren. Dieser Pfad ist
für interne Control-Plane-RPCs reserviert und verhindert, dass veraltete CLI-/Geräte-Pairing-Baselines
lokale Backend-Arbeit wie Subagent-Sitzungsaktualisierungen blockieren. Remote-Clients,
Clients mit Browser-Origin, Node-Clients und explizite Geräte-Token-/Geräteidentitäts-
Clients verwenden weiterhin die normalen Pairing- und Scope-Upgrade-Prüfungen.

Wenn ein Geräte-Token ausgegeben wird, enthält `hello-ok` außerdem:

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

Für den integrierten Node-/Operator-Bootstrap-Ablauf bleibt das primäre Node-Token bei
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
    "minProtocol": 4,
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
- **Ereignis**: `{type:"event", event, payload, seq?, stateVersion?}`

Methoden mit Seiteneffekten erfordern **Idempotenzschlüssel** (siehe Schema).

## Rollen + Scopes

Das vollständige Operator-Scope-Modell, Prüfungen zum Genehmigungszeitpunkt und
Semantik für gemeinsam genutzte Secrets finden Sie unter [Operator-Scopes](/de/gateway/operator-scopes).

### Rollen

- `operator` = Control-Plane-Client (CLI/UI/Automatisierung).
- `node` = Capability-Host (Kamera/Bildschirm/Canvas/system.run).

### Scopes (Operator)

Gängige Scopes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` mit `includeSecrets: true` erfordert `operator.talk.secrets`
(oder `operator.admin`).

Von Plugins registrierte Gateway-RPC-Methoden können ihren eigenen Operator-Scope anfordern, aber
reservierte Core-Admin-Präfixe (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) werden immer zu `operator.admin` aufgelöst.

Der Methoden-Scope ist nur die erste Schranke. Einige über
`chat.send` erreichte Slash-Befehle wenden darüber hinaus strengere Prüfungen auf Befehlsebene an. Zum Beispiel erfordern persistente
`/config set`- und `/config unset`-Schreibvorgänge `operator.admin`.

`node.pair.approve` hat zusätzlich zum Basis-Methoden-Scope eine zusätzliche Scope-Prüfung zum Genehmigungszeitpunkt:

- Anfragen ohne Befehl: `operator.pairing`
- Anfragen mit Nicht-Exec-Node-Befehlen: `operator.pairing` + `operator.write`
- Anfragen, die `system.run`, `system.run.prepare` oder `system.which` enthalten:
  `operator.pairing` + `operator.admin`

### Caps/Befehle/Berechtigungen (Node)

Nodes deklarieren Capability-Claims zum Verbindungszeitpunkt:

- `caps`: übergeordnete Capability-Kategorien wie `camera`, `canvas`, `screen`,
  `location`, `voice` und `talk`.
- `commands`: Befehls-Allowlist für invoke.
- `permissions`: granulare Umschalter (z. B. `screen.record`, `camera.capture`).

Der Gateway behandelt diese als **Claims** und erzwingt serverseitige Allowlists.

## Presence

- `system-presence` gibt Einträge zurück, die nach Geräteidentität indiziert sind.
- Presence-Einträge enthalten `deviceId`, `roles` und `scopes`, damit UIs eine einzelne Zeile pro Gerät anzeigen können,
  selbst wenn es sowohl als **Operator** als auch als **Node** verbunden ist.
- `node.list` enthält optionale Felder `lastSeenAtMs` und `lastSeenReason`. Verbundene Nodes melden
  ihre aktuelle Verbindungszeit als `lastSeenAtMs` mit dem Grund `connect`; gekoppelte Nodes können außerdem
  dauerhafte Hintergrund-Presence melden, wenn ein vertrauenswürdiges Node-Ereignis ihre Pairing-Metadaten aktualisiert.

### Node-Hintergrund-Alive-Ereignis

Nodes können `node.event` mit `event: "node.presence.alive"` aufrufen, um aufzuzeichnen, dass ein gekoppelter Node
während eines Hintergrund-Wake aktiv war, ohne ihn als verbunden zu markieren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` ist ein geschlossenes Enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` oder `connect`. Unbekannte Trigger-Strings werden vom Gateway vor der Persistierung zu
`background` normalisiert. Das Ereignis ist nur für authentifizierte Node-
Gerätesitzungen dauerhaft; gerätelose oder nicht gekoppelte Sitzungen geben `handled: false` zurück.

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
bestätigten RPC behandeln, nicht als dauerhafte Presence-Persistierung.

## Scoping von Broadcast-Ereignissen

Vom Server gepushte WebSocket-Broadcast-Ereignisse sind Scope-gated, damit Sitzungen mit Pairing-Scope oder reine Node-Sitzungen Sitzungsinhalte nicht passiv empfangen.

- **Chat-, Agent- und Tool-Result-Frames** (einschließlich gestreamter `agent`-Ereignisse und Tool-Aufrufergebnisse) erfordern mindestens `operator.read`. Sitzungen ohne `operator.read` überspringen diese Frames vollständig.
- **Plugin-definierte `plugin.*`-Broadcasts** werden je nach Registrierung durch das Plugin auf `operator.write` oder `operator.admin` beschränkt.
- **Status- und Transportereignisse** (`heartbeat`, `presence`, `tick`, Connect-/Disconnect-Lebenszyklus usw.) bleiben uneingeschränkt, damit der Transportzustand für jede authentifizierte Sitzung beobachtbar bleibt.
- **Unbekannte Broadcast-Ereignisfamilien** werden standardmäßig Scope-gated (fail-closed), sofern ein registrierter Handler sie nicht ausdrücklich lockert.

Jede Client-Verbindung behält ihre eigene Sequenznummer pro Client, sodass Broadcasts die monotone Reihenfolge auf diesem Socket bewahren, selbst wenn verschiedene Clients unterschiedliche Scope-gefilterte Teilmengen des Ereignisstroms sehen.

## Gängige RPC-Methodenfamilien

Die öffentliche WS-Oberfläche ist breiter als die obigen Handshake-/Auth-Beispiele. Dies
ist kein generierter Dump — `hello-ok.features.methods` ist eine konservative
Discovery-Liste, die aus `src/gateway/server-methods-list.ts` plus geladenen
Plugin-/Channel-Methodenexporten erstellt wird. Behandeln Sie sie als Feature-Discovery, nicht als vollständige
Aufzählung von `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System und Identität">
    - `health` gibt den gecachten oder frisch geprüften Gateway-Health-Snapshot zurück.
    - `diagnostics.stability` gibt den aktuellen begrenzten Diagnose-Stabilitätsrekorder zurück. Er hält Betriebsmetadaten wie Ereignisnamen, Zähler, Bytegrößen, Speicherwerte, Queue-/Sitzungsstatus, Channel-/Plugin-Namen und Sitzungs-IDs vor. Er hält keinen Chat-Text, keine Webhook-Bodys, keine Tool-Ausgaben, keine rohen Anfrage- oder Antwort-Bodys, Tokens, Cookies oder geheimen Werte vor. Operator-Lesescope ist erforderlich.
    - `status` gibt die Gateway-Zusammenfassung im `/status`-Stil zurück; sensitive Felder werden nur für Operator-Clients mit Admin-Scope einbezogen.
    - `gateway.identity.get` gibt die Gateway-Geräteidentität zurück, die von Relay- und Pairing-Abläufen verwendet wird.
    - `system-presence` gibt den aktuellen Presence-Snapshot für verbundene Operator-/Node-Geräte zurück.
    - `system-event` hängt ein Systemereignis an und kann Presence-Kontext aktualisieren/übertragen.
    - `last-heartbeat` gibt das zuletzt persistierte Heartbeat-Ereignis zurück.
    - `set-heartbeats` schaltet die Heartbeat-Verarbeitung auf dem Gateway um.

  </Accordion>

  <Accordion title="Modelle und Nutzung">
    - `models.list` gibt den zur Laufzeit zugelassenen Modellkatalog zurück. Übergeben Sie `{ "view": "configured" }` für auswählgroße konfigurierte Modelle (`agents.defaults.models` zuerst, dann `models.providers.*.models`) oder `{ "view": "all" }` für den vollständigen Katalog.
    - `usage.status` gibt Provider-Nutzungsfenster und Zusammenfassungen des verbleibenden Kontingents zurück.
    - `usage.cost` gibt aggregierte Kostennutzungszusammenfassungen für einen Datumsbereich zurück.
    - `doctor.memory.status` gibt die Bereitschaft des Vektorspeichers bzw. zwischengespeicherter Embeddings für den aktiven Standard-Agenten-Workspace zurück. Übergeben Sie `{ "probe": true }` oder `{ "deep": true }` nur, wenn der Aufrufer ausdrücklich einen Live-Ping an den Embedding-Provider wünscht.
    - `doctor.memory.remHarness` gibt eine begrenzte, schreibgeschützte REM-Harness-Vorschau für Remote-Control-Plane-Clients zurück. Sie kann Workspace-Pfade, Speicherausschnitte, gerendertes grounded Markdown und Kandidaten für Deep Promotion enthalten, daher benötigen Aufrufer `operator.read`.
    - `sessions.usage` gibt Nutzungszusammenfassungen pro Sitzung zurück.
    - `sessions.usage.timeseries` gibt Zeitreihennutzung für eine Sitzung zurück.
    - `sessions.usage.logs` gibt Nutzungsprotokolleinträge für eine Sitzung zurück.

  </Accordion>

  <Accordion title="Kanäle und Anmeldehilfen">
    - `channels.status` gibt Statuszusammenfassungen für integrierte und gebündelte Kanäle/Plugins zurück.
    - `channels.logout` meldet einen bestimmten Kanal/ein bestimmtes Konto ab, sofern der Kanal Abmeldung unterstützt.
    - `web.login.start` startet einen QR-/Web-Anmeldefluss für den aktuellen QR-fähigen Webkanal-Provider.
    - `web.login.wait` wartet, bis dieser QR-/Web-Anmeldefluss abgeschlossen ist, und startet bei Erfolg den Kanal.
    - `push.test` sendet einen Test-APNs-Push an einen registrierten iOS-Node.
    - `voicewake.get` gibt die gespeicherten Wake-Word-Trigger zurück.
    - `voicewake.set` aktualisiert Wake-Word-Trigger und sendet die Änderung per Broadcast.

  </Accordion>

  <Accordion title="Messaging und Protokolle">
    - `send` ist der direkte RPC für ausgehende Zustellung für kanal-/konto-/threadbezogene Sendungen außerhalb des Chat-Runners.
    - `logs.tail` gibt das konfigurierte Gateway-Dateiprotokollende mit Cursor-/Limit- und Max-Byte-Steuerungen zurück.

  </Accordion>

  <Accordion title="Talk und TTS">
    - `talk.catalog` gibt den schreibgeschützten Talk-Provider-Katalog für Sprache, Streaming-Transkription und Echtzeitstimme zurück. Er enthält Provider-IDs, Labels, Konfigurationsstatus, offengelegte Modell-/Voice-IDs, kanonische Modi, Transports, Brain-Strategien und Echtzeit-Audio-/Capability-Flags, ohne Provider-Geheimnisse zurückzugeben oder die globale Konfiguration zu verändern.
    - `talk.config` gibt die effektive Talk-Konfigurationspayload zurück; `includeSecrets` erfordert `operator.talk.secrets` (oder `operator.admin`).
    - `talk.session.create` erstellt eine Gateway-eigene Talk-Sitzung für `realtime/gateway-relay`, `transcription/gateway-relay` oder `stt-tts/managed-room`. `brain: "direct-tools"` erfordert `operator.admin`.
    - `talk.session.join` validiert ein Sitzungstoken für einen Managed Room, gibt bei Bedarf `session.ready`- oder `session.replaced`-Ereignisse aus und gibt Raum-/Sitzungsmetadaten plus aktuelle Talk-Ereignisse ohne Klartexttoken oder gespeicherten Token-Hash zurück.
    - `talk.session.appendAudio` hängt Base64-PCM-Eingabeaudio an Gateway-eigene Echtzeit-Relay- und Transkriptionssitzungen an.
    - `talk.session.startTurn`, `talk.session.endTurn` und `talk.session.cancelTurn` steuern den Turn-Lebenszyklus eines Managed Room mit Ablehnung veralteter Turns, bevor der Zustand gelöscht wird.
    - `talk.session.cancelOutput` stoppt die Audioausgabe des Assistenten, hauptsächlich für VAD-gesteuertes Barge-in in Gateway-Relay-Sitzungen.
    - `talk.session.submitToolResult` schließt einen Provider-Tool-Aufruf ab, der von einer Gateway-eigenen Echtzeit-Relay-Sitzung ausgegeben wurde. Übergeben Sie `options: { willContinue: true }` für vorläufige Tool-Ausgabe, wenn ein finales Ergebnis folgt, oder `options: { suppressResponse: true }`, wenn das Tool-Ergebnis den Provider-Aufruf erfüllen soll, ohne eine weitere Echtzeit-Assistentenantwort zu starten.
    - `talk.session.close` schließt eine Gateway-eigene Relay-, Transkriptions- oder Managed-Room-Sitzung und gibt terminale Talk-Ereignisse aus.
    - `talk.mode` setzt/broadcastet den aktuellen Talk-Moduszustand für WebChat-/Control-UI-Clients.
    - `talk.client.create` erstellt eine client-eigene Echtzeit-Provider-Sitzung mit `webrtc` oder `provider-websocket`, während das Gateway Konfiguration, Anmeldeinformationen, Anweisungen und Tool-Richtlinie besitzt.
    - `talk.client.toolCall` ermöglicht client-eigenen Echtzeit-Transports, Provider-Tool-Aufrufe an die Gateway-Richtlinie weiterzuleiten. Das erste unterstützte Tool ist `openclaw_agent_consult`; Clients erhalten eine Run-ID und warten auf normale Chat-Lebenszyklusereignisse, bevor sie das providerspezifische Tool-Ergebnis übermitteln.
    - `talk.event` ist der einzelne Talk-Ereigniskanal für Echtzeit-, Transkriptions-, STT/TTS-, Managed-Room-, Telefonie- und Meeting-Adapter.
    - `talk.speak` synthetisiert Sprache über den aktiven Talk-Sprach-Provider.
    - `tts.status` gibt den TTS-Aktivierungsstatus, den aktiven Provider, Fallback-Provider und den Provider-Konfigurationsstatus zurück.
    - `tts.providers` gibt das sichtbare TTS-Provider-Inventar zurück.
    - `tts.enable` und `tts.disable` schalten den TTS-Einstellungszustand um.
    - `tts.setProvider` aktualisiert den bevorzugten TTS-Provider.
    - `tts.convert` führt eine einmalige Text-zu-Sprache-Konvertierung aus.

  </Accordion>

  <Accordion title="Geheimnisse, Konfiguration, Update und Assistent">
    - `secrets.reload` löst aktive SecretRefs erneut auf und tauscht den Runtime-Geheimniszustand nur bei vollständigem Erfolg aus.
    - `secrets.resolve` löst Befehlsziel-Geheimniszuweisungen für eine bestimmte Befehls-/Zielmenge auf.
    - `config.get` gibt den aktuellen Konfigurations-Snapshot und Hash zurück.
    - `config.set` schreibt eine validierte Konfigurationspayload.
    - `config.patch` führt eine partielle Konfigurationsaktualisierung zusammen.
    - `config.apply` validiert und ersetzt die vollständige Konfigurationspayload.
    - `config.schema` gibt die Live-Konfigurationsschema-Payload zurück, die von Control UI und CLI-Tools verwendet wird: Schema, `uiHints`, Version und Generierungsmetadaten, einschließlich Plugin- und Kanalschema-Metadaten, wenn die Runtime sie laden kann. Das Schema enthält Feldmetadaten `title` / `description`, die aus denselben Labels und Hilfetexten abgeleitet sind, die von der UI verwendet werden, einschließlich verschachtelter Objekt-, Platzhalter-, Array-Element- und `anyOf`- / `oneOf`- / `allOf`-Kompositionszweige, wenn passende Felddokumentation vorhanden ist.
    - `config.schema.lookup` gibt eine pfadbezogene Lookup-Payload für einen Konfigurationspfad zurück: normalisierter Pfad, ein flacher Schemaknoten, passender Hinweis plus `hintPath` und unmittelbare Kindzusammenfassungen für UI-/CLI-Drilldown. Lookup-Schemaknoten behalten die benutzerorientierte Dokumentation und gängige Validierungsfelder (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerische/String-/Array-/Objektgrenzen und Flags wie `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) bei. Kindzusammenfassungen legen `key`, den normalisierten `path`, `type`, `required`, `hasChildren` sowie das passende `hint` / `hintPath` offen.
    - `update.run` führt den Gateway-Updatefluss aus und plant nur dann einen Neustart, wenn das Update selbst erfolgreich war; Aufrufer mit einer Sitzung können `continuationMessage` einbeziehen, damit der Start einen nachfolgenden Agenten-Turn über die Neustart-Fortsetzungswarteschlange fortsetzt. Package-Manager-Updates erzwingen nach dem Pakettausch einen nicht aufschiebbaren Update-Neustart ohne Cooldown, damit der alte Gateway-Prozess nicht weiterhin Lazy-Loading aus einem ersetzten `dist`-Baum durchführt.
    - `update.status` gibt den neuesten zwischengespeicherten Update-Neustart-Sentinel zurück, einschließlich der nach dem Neustart laufenden Version, sofern verfügbar.
    - `wizard.start`, `wizard.next`, `wizard.status` und `wizard.cancel` stellen den Onboarding-Assistenten über WS RPC bereit.

  </Accordion>

  <Accordion title="Agenten- und Workspace-Hilfen">
    - `agents.list` gibt konfigurierte Agenteneinträge zurück, einschließlich effektivem Modell und Runtime-Metadaten.
    - `agents.create`, `agents.update` und `agents.delete` verwalten Agentendatensätze und Workspace-Verkabelung.
    - `agents.files.list`, `agents.files.get` und `agents.files.set` verwalten die Bootstrap-Workspace-Dateien, die für einen Agenten offengelegt werden.
    - `tasks.list`, `tasks.get` und `tasks.cancel` stellen das Gateway-Aufgabenledger für SDK- und Operator-Clients bereit.
    - `artifacts.list`, `artifacts.get` und `artifacts.download` stellen aus Transkripten abgeleitete Artefaktzusammenfassungen und Downloads für einen expliziten `sessionKey`-, `runId`- oder `taskId`-Scope bereit. Run- und Aufgabenabfragen lösen die besitzende Sitzung serverseitig auf und geben nur Transkriptmedien mit passender Provenienz zurück; unsichere oder lokale URL-Quellen geben nicht unterstützte Downloads zurück, statt serverseitig abgerufen zu werden.
    - `environments.list` und `environments.status` stellen schreibgeschützte Gateway-lokale und Node-Umgebungserkennung für SDK-Clients bereit.
    - `agent.identity.get` gibt die effektive Assistentenidentität für einen Agenten oder eine Sitzung zurück.
    - `agent.wait` wartet, bis ein Run abgeschlossen ist, und gibt den terminalen Snapshot zurück, sofern verfügbar.

  </Accordion>

  <Accordion title="Sitzungssteuerung">
    - `sessions.list` gibt den aktuellen Sitzungsindex zurück, einschließlich `agentRuntime`-Metadaten pro Zeile, wenn ein Agenten-Runtime-Backend konfiguriert ist.
    - `sessions.subscribe` und `sessions.unsubscribe` schalten Sitzungsänderungsereignis-Abonnements für den aktuellen WS-Client um.
    - `sessions.messages.subscribe` und `sessions.messages.unsubscribe` schalten Transkript-/Nachrichtenereignis-Abonnements für eine Sitzung um.
    - `sessions.preview` gibt begrenzte Transkriptvorschauen für bestimmte Sitzungsschlüssel zurück.
    - `sessions.describe` gibt eine Gateway-Sitzungszeile für einen exakten Sitzungsschlüssel zurück.
    - `sessions.resolve` löst ein Sitzungsziel auf oder kanonisiert es.
    - `sessions.create` erstellt einen neuen Sitzungseintrag.
    - `sessions.send` sendet eine Nachricht in eine bestehende Sitzung.
    - `sessions.steer` ist die Unterbrechen-und-Steuern-Variante für eine aktive Sitzung.
    - `sessions.abort` bricht aktive Arbeit für eine Sitzung ab. Ein Aufrufer kann `key` plus optional `runId` übergeben oder nur `runId` für aktive Runs übergeben, die das Gateway einer Sitzung zuordnen kann.
    - `sessions.patch` aktualisiert Sitzungsmetadaten/-Overrides und meldet das aufgelöste kanonische Modell plus effektive `agentRuntime`.
    - `sessions.reset`, `sessions.delete` und `sessions.compact` führen Sitzungswartung aus.
    - `sessions.get` gibt die vollständig gespeicherte Sitzungszeile zurück.
    - Die Chat-Ausführung verwendet weiterhin `chat.history`, `chat.send`, `chat.abort` und `chat.inject`. `chat.history` wird für UI-Clients anzeigennormalisiert: Inline-Direktiv-Tags werden aus sichtbarem Text entfernt, XML-Payloads von Nur-Text-Tool-Aufrufen (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Tool-Aufrufblöcke) sowie durchgesickerte ASCII-/vollbreite Modellsteuerungstoken werden entfernt, reine Silent-Token-Assistentenzeilen wie exakte `NO_REPLY` / `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden.

  </Accordion>

  <Accordion title="Gerätekopplung und Gerätetoken">
    - `device.pair.list` gibt ausstehende und genehmigte gekoppelte Geräte zurück.
    - `device.pair.approve`, `device.pair.reject` und `device.pair.remove` verwalten Gerätekopplungsdatensätze.
    - `device.token.rotate` rotiert ein gekoppeltes Gerätetoken innerhalb seiner genehmigten Rollen- und Aufrufer-Scope-Grenzen.
    - `device.token.revoke` widerruft ein gekoppeltes Gerätetoken innerhalb seiner genehmigten Rollen- und Aufrufer-Scope-Grenzen.

  </Accordion>

  <Accordion title="Node-Kopplung, Invoke und ausstehende Arbeit">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` und `node.pair.verify` decken Node-Kopplung und Bootstrap-Verifizierung ab.
    - `node.list` und `node.describe` geben den bekannten/verbundenen Node-Zustand zurück.
    - `node.rename` aktualisiert ein gekoppeltes Node-Label.
    - `node.invoke` leitet einen Befehl an einen verbundenen Node weiter.
    - `node.invoke.result` gibt das Ergebnis für eine Invoke-Anforderung zurück.
    - `node.event` transportiert von Nodes stammende Ereignisse zurück in das Gateway.
    - `node.pending.pull` und `node.pending.ack` sind die Warteschlangen-APIs für verbundene Nodes.
    - `node.pending.enqueue` und `node.pending.drain` verwalten dauerhafte ausstehende Arbeit für Offline-/getrennte Nodes.

  </Accordion>

  <Accordion title="Genehmigungsfamilien">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` und `exec.approval.resolve` decken einmalige Exec-Genehmigungsanfragen plus Suche/Wiederholung ausstehender Genehmigungen ab.
    - `exec.approval.waitDecision` wartet auf eine ausstehende Exec-Genehmigung und gibt die endgültige Entscheidung zurück (oder `null` bei Timeout).
    - `exec.approvals.get` und `exec.approvals.set` verwalten Snapshots der Gateway-Exec-Genehmigungsrichtlinie.
    - `exec.approvals.node.get` und `exec.approvals.node.set` verwalten die Node-lokale Exec-Genehmigungsrichtlinie über Node-Relay-Befehle.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` und `plugin.approval.resolve` decken Plugin-definierte Genehmigungsabläufe ab.

  </Accordion>

  <Accordion title="Automatisierung, Skills und Tools">
    - Automatisierung: `wake` plant eine sofortige oder nächste-Heartbeat-Wake-Textinjektion; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` verwalten geplante Arbeit.
    - Skills und Tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Häufige Ereignisfamilien

- `chat`: UI-Chat-Aktualisierungen wie `chat.inject` und andere rein transkriptbezogene Chat-
  Ereignisse.
- `session.message` und `session.tool`: Transkript-/Ereignisstream-Aktualisierungen für eine
  abonnierte Sitzung.
- `sessions.changed`: Sitzungsindex oder Metadaten geändert.
- `presence`: Aktualisierungen des System-Präsenz-Snapshots.
- `tick`: periodisches Keepalive-/Liveness-Ereignis.
- `health`: Aktualisierung des Gateway-Integritäts-Snapshots.
- `heartbeat`: Aktualisierung des Heartbeat-Ereignisstreams.
- `cron`: Änderungsereignis für Cron-Läufe/-Jobs.
- `shutdown`: Gateway-Shutdown-Benachrichtigung.
- `node.pair.requested` / `node.pair.resolved`: Node-Pairing-Lebenszyklus.
- `node.invoke.request`: Broadcast einer Node-Invoke-Anfrage.
- `device.pair.requested` / `device.pair.resolved`: Lebenszyklus gekoppelter Geräte.
- `voicewake.changed`: Wake-Word-Trigger-Konfiguration geändert.
- `exec.approval.requested` / `exec.approval.resolved`: Exec-Genehmigungs-
  lebenszyklus.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin-Genehmigungs-
  lebenszyklus.

### Node-Hilfsmethoden

- Nodes können `skills.bins` aufrufen, um die aktuelle Liste der Skill-Executables
  für Auto-Allow-Prüfungen abzurufen.

### Task-Ledger-RPCs

Operator-Clients können Gateway-Datensätze zu Hintergrundaufgaben über
die Task-Ledger-RPCs prüfen und abbrechen. Diese Methoden geben bereinigte Aufgabenzusammenfassungen zurück, keinen rohen
Laufzeitstatus.

- `tasks.list` erfordert `operator.read`.
  - Parameter: optional `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` oder `"timed_out"`) oder ein Array dieser Statuswerte,
    optional `agentId`, optional `sessionKey`, optional `limit` von `1` bis
    `500` und optional die Zeichenfolge `cursor`.
  - Ergebnis: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` erfordert `operator.read`.
  - Parameter: `{ "taskId": string }`.
  - Ergebnis: `{ "task": TaskSummary }`.
  - Fehlende Aufgaben-IDs geben die Not-found-Fehlerform des Gateway zurück.
- `tasks.cancel` erfordert `operator.write`.
  - Parameter: `{ "taskId": string, "reason"?: string }`.
  - Ergebnis:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` meldet, ob das Ledger eine passende Aufgabe hatte. `cancelled`
    meldet, ob die Laufzeitumgebung den Abbruch akzeptiert oder aufgezeichnet hat.

`TaskSummary` enthält `id`, `status` und optionale Metadaten wie `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, Zeitstempel, Fortschritt,
abschließende Zusammenfassung und bereinigten Fehlertext.

### Operator-Hilfsmethoden

- Operatoren können `commands.list` (`operator.read`) aufrufen, um das Laufzeit-
  Befehlsinventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agent-Workspace zu lesen.
  - `scope` steuert, auf welche Oberfläche das primäre `name` zielt:
    - `text` gibt das primäre Textbefehlstoken ohne führendes `/` zurück
    - `native` und der Standardpfad `both` geben Provider-bewusste native Namen
      zurück, sofern verfügbar
  - `textAliases` enthält exakte Slash-Aliasse wie `/model` und `/m`.
  - `nativeName` enthält den Provider-bewussten nativen Befehlsnamen, wenn einer vorhanden ist.
  - `provider` ist optional und beeinflusst nur native Benennung plus Verfügbarkeit nativer Plugin-
    Befehle.
  - `includeArgs=false` lässt serialisierte Argumentmetadaten in der Antwort weg.
- Operatoren können `tools.catalog` (`operator.read`) aufrufen, um den Laufzeit-Toolkatalog für einen
  Agenten abzurufen. Die Antwort enthält gruppierte Tools und Provenienzmetadaten:
  - `source`: `core` oder `plugin`
  - `pluginId`: Plugin-Besitzer, wenn `source="plugin"`
  - `optional`: ob ein Plugin-Tool optional ist
- Operatoren können `tools.effective` (`operator.read`) aufrufen, um das zur Laufzeit effektive Tool-
  Inventar für eine Sitzung abzurufen.
  - `sessionKey` ist erforderlich.
  - Das Gateway leitet vertrauenswürdigen Laufzeitkontext serverseitig aus der Sitzung ab, statt vom
    Aufrufer gelieferte Authentifizierungs- oder Zustellungskontexte zu akzeptieren.
  - Die Antwort ist sitzungsbezogen und spiegelt wider, was die aktive Unterhaltung jetzt verwenden kann,
    einschließlich Core-, Plugin- und Channel-Tools.
- Operatoren können `tools.invoke` (`operator.write`) aufrufen, um ein verfügbares Tool über denselben
  Gateway-Richtlinienpfad wie `/tools/invoke` aufzurufen.
  - `name` ist erforderlich. `args`, `sessionKey`, `agentId`, `confirm` und
    `idempotencyKey` sind optional.
  - Wenn sowohl `sessionKey` als auch `agentId` vorhanden sind, muss der aufgelöste Sitzungsagent mit
    `agentId` übereinstimmen.
  - Die Antwort ist ein SDK-orientierter Umschlag mit `ok`, `toolName`, optionalem `output` und typisierten
    `error`-Feldern. Genehmigungs- oder Richtlinienablehnungen geben `ok:false` in der Payload zurück, statt
    die Gateway-Tool-Richtlinienpipeline zu umgehen.
- Operatoren können `skills.status` (`operator.read`) aufrufen, um das sichtbare
  Skill-Inventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agent-Workspace zu lesen.
  - Die Antwort enthält Eignung, fehlende Anforderungen, Konfigurationsprüfungen und
    bereinigte Installationsoptionen, ohne rohe Secret-Werte offenzulegen.
- Operatoren können `skills.search` und `skills.detail` (`operator.read`) für
  ClawHub-Discovery-Metadaten aufrufen.
- Operatoren können `skills.upload.begin`, `skills.upload.chunk` und
  `skills.upload.commit` (`operator.admin`) aufrufen, um ein privates Skill-Archiv
  vor der Installation bereitzustellen. Dies ist ein separater Admin-Uploadpfad für vertrauenswürdige Clients,
  nicht der normale ClawHub-Skill-Installationsablauf, und ist standardmäßig deaktiviert, sofern nicht
  `skills.install.allowUploadedArchives` aktiviert ist.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    erstellt einen Upload, der an diesen Slug und Force-Wert gebunden ist.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` hängt Bytes am
    exakt decodierten Offset an.
  - `skills.upload.commit({ uploadId, sha256? })` prüft die endgültige Größe und
    SHA-256. Commit finalisiert nur den Upload; es installiert den Skill nicht.
  - Hochgeladene Skill-Archive sind ZIP-Archive, die einen `SKILL.md`-Root enthalten. Der
    interne Verzeichnisname des Archivs wählt nie das Installationsziel aus.
- Operatoren können `skills.install` (`operator.admin`) in drei Modi aufrufen:
  - ClawHub-Modus: `{ source: "clawhub", slug, version?, force? }` installiert einen
    Skill-Ordner in das Verzeichnis `skills/` des Standard-Agent-Workspace.
  - Uploadmodus: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installiert einen committeten Upload in das Verzeichnis `skills/<slug>`
    des Standard-Agent-Workspace. Slug und Force-Wert müssen mit der ursprünglichen
    Anfrage `skills.upload.begin` übereinstimmen. Dieser Modus wird abgelehnt, sofern
    `skills.install.allowUploadedArchives` nicht aktiviert ist. Die Einstellung wirkt sich nicht
    auf ClawHub-Installationen aus.
  - Gateway-Installer-Modus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    führt eine deklarierte Aktion `metadata.openclaw.install` auf dem Gateway-Host aus.
- Operatoren können `skills.update` (`operator.admin`) in zwei Modi aufrufen:
  - Der ClawHub-Modus aktualisiert einen nachverfolgten Slug oder alle nachverfolgten ClawHub-Installationen im
    Standard-Agent-Workspace.
  - Der Konfigurationsmodus patcht Werte unter `skills.entries.<skillKey>` wie `enabled`,
    `apiKey` und `env`.

### Ansichten von `models.list`

`models.list` akzeptiert einen optionalen Parameter `view`:

- Weggelassen oder `"default"`: aktuelles Laufzeitverhalten. Wenn `agents.defaults.models` konfiguriert ist, ist die Antwort der erlaubte Katalog, einschließlich dynamisch gefundener Modelle für `provider/*`-Einträge. Andernfalls ist die Antwort der vollständige Gateway-Katalog.
- `"configured"`: Verhalten in Picker-Größe. Wenn `agents.defaults.models` konfiguriert ist, hat es weiterhin Vorrang, einschließlich Provider-bezogener Discovery für `provider/*`-Einträge. Ohne Allowlist verwendet die Antwort explizite Einträge unter `models.providers.*.models` und fällt nur dann auf den vollständigen Katalog zurück, wenn keine konfigurierten Modellzeilen vorhanden sind.
- `"all"`: vollständiger Gateway-Katalog, wobei `agents.defaults.models` umgangen wird. Verwenden Sie dies für Diagnose- und Discovery-UIs, nicht für normale Modell-Picker.

## Exec-Genehmigungen

- Wenn eine Exec-Anfrage eine Genehmigung benötigt, sendet das Gateway `exec.approval.requested`.
- Operator-Clients lösen sie durch Aufruf von `exec.approval.resolve` auf (erfordert den Scope `operator.approvals`).
- Für `host=node` muss `exec.approval.request` `systemRunPlan` enthalten (kanonische `argv`/`cwd`/`rawCommand`/Sitzungsmetadaten). Anfragen ohne `systemRunPlan` werden abgelehnt.
- Nach der Genehmigung verwenden weitergeleitete `node.invoke system.run`-Aufrufe diesen kanonischen
  `systemRunPlan` als maßgeblichen Befehls-/cwd-/Sitzungskontext.
- Wenn ein Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` zwischen Vorbereitung und der endgültig genehmigten Weiterleitung von `system.run` verändert, lehnt das
  Gateway den Lauf ab, statt der veränderten Payload zu vertrauen.

## Fallback für Agent-Zustellung

- `agent`-Anfragen können `deliver=true` enthalten, um ausgehende Zustellung anzufordern.
- `bestEffortDeliver=false` behält striktes Verhalten bei: nicht auflösbare oder nur interne Zustellziele geben `INVALID_REQUEST` zurück.
- `bestEffortDeliver=true` erlaubt den Fallback auf reine Sitzungsausführung, wenn keine extern zustellbare Route aufgelöst werden kann (zum Beispiel interne/Webchat-Sitzungen oder mehrdeutige Mehrkanal-Konfigurationen).
- Endgültige `agent`-Ergebnisse können `result.deliveryStatus` enthalten, wenn Zustellung
  angefordert wurde, mit denselben Statuswerten `sent`, `suppressed`, `partial_failed` und `failed`,
  die für [`openclaw agent --json --deliver`](/de/cli/agent#json-delivery-status) dokumentiert sind.

## Versionierung

- `PROTOCOL_VERSION` befindet sich in `src/gateway/protocol/version.ts`.
- Clients senden `minProtocol` + `maxProtocol`; der Server lehnt Nichtübereinstimmungen ab.
- Schemas + Modelle werden aus TypeBox-Definitionen generiert:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Client-Konstanten

Der Referenzclient in `src/gateway/client.ts` verwendet diese Standardwerte. Die Werte sind
über Protokoll v4 hinweg stabil und sind die erwartete Baseline für Drittanbieter-Clients.

| Konstante                                 | Standardwert                                          | Quelle                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `src/gateway/protocol/version.ts`                                                          |
| Request-Timeout (pro RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth-/Connect-Challenge-Timeout        | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (Konfiguration/Env kann das gekoppelte Server-/Client-Budget erhöhen) |
| Initialer Reconnect-Backoff               | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maximaler Reconnect-Backoff               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-Retry-Begrenzung nach Device-Token-Schließung | `250` ms                                      | `src/gateway/client.ts`                                                                    |
| Force-Stop-Kulanz vor `terminate()`       | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Standard-Timeout für `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Standard-Tick-Intervall (vor `hello-ok`)  | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick-Timeout-Schließung                   | Code `4000`, wenn Stille `tickIntervalMs * 2` überschreitet | `src/gateway/client.ts`                                                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Der Server gibt die effektiven Werte `policy.tickIntervalMs`, `policy.maxPayload`
und `policy.maxBufferedBytes` in `hello-ok` bekannt; Clients sollten diese Werte
anstelle der Standardwerte vor dem Handshake berücksichtigen.

## Authentifizierung

- Gateway-Authentifizierung mit gemeinsamem Geheimnis verwendet `connect.params.auth.token` oder
  `connect.params.auth.password`, abhängig vom konfigurierten Authentifizierungsmodus.
- Identität tragende Modi wie Tailscale Serve
  (`gateway.auth.allowTailscale: true`) oder nicht-Loopback
  `gateway.auth.mode: "trusted-proxy"` erfüllen die Connect-Authentifizierungsprüfung über
  Request-Header statt über `connect.params.auth.*`.
- Private-Ingress `gateway.auth.mode: "none"` überspringt die Connect-Authentifizierung mit gemeinsamem Geheimnis
  vollständig; stellen Sie diesen Modus nicht über öffentlichen/nicht vertrauenswürdigen Ingress bereit.
- Nach dem Pairing stellt das Gateway ein **Device-Token** aus, das auf die Verbindungsrolle
  und Scopes begrenzt ist. Es wird in `hello-ok.auth.deviceToken` zurückgegeben und sollte vom
  Client für zukünftige Verbindungen gespeichert werden.
- Clients sollten das primäre `hello-ok.auth.deviceToken` nach jeder
  erfolgreichen Verbindung speichern.
- Beim erneuten Verbinden mit diesem **gespeicherten** Device-Token sollte auch das gespeicherte
  genehmigte Scope-Set für dieses Token wiederverwendet werden. Dadurch bleibt bereits gewährter
  Lese-/Probe-/Statuszugriff erhalten und es wird vermieden, dass Reconnects stillschweigend auf einen
  engeren impliziten Nur-Admin-Scope reduziert werden.
- Clientseitige Zusammenstellung der Connect-Authentifizierung (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` ist orthogonal und wird immer weitergeleitet, wenn gesetzt.
  - `auth.token` wird in Prioritätsreihenfolge befüllt: zuerst ein explizites Shared Token,
    dann ein explizites `deviceToken`, dann ein gespeichertes Token pro Gerät (nach
    `deviceId` + `role` geschlüsselt).
  - `auth.bootstrapToken` wird nur gesendet, wenn keiner der obigen Schritte ein
    `auth.token` aufgelöst hat. Ein Shared Token oder ein aufgelöstes Device-Token unterdrückt es.
  - Die automatische Hochstufung eines gespeicherten Device-Tokens beim einmaligen
    `AUTH_TOKEN_MISMATCH`-Retry ist auf **vertrauenswürdige Endpunkte** beschränkt:
    Loopback oder `wss://` mit angeheftetem `tlsFingerprint`. Öffentliches `wss://`
    ohne Pinning qualifiziert sich nicht.
- Zusätzliche `hello-ok.auth.deviceTokens`-Einträge sind Bootstrap-Handoff-Tokens.
  Speichern Sie sie nur, wenn die Verbindung Bootstrap-Authentifizierung über einen vertrauenswürdigen Transport
  wie `wss://` oder Loopback/lokales Pairing verwendet hat.
- Wenn ein Client ein **explizites** `deviceToken` oder explizite `scopes` bereitstellt, bleibt dieses
  vom Aufrufer angeforderte Scope-Set maßgeblich; zwischengespeicherte Scopes werden nur
  wiederverwendet, wenn der Client das gespeicherte Token pro Gerät wiederverwendet.
- Device-Tokens können über `device.token.rotate` und
  `device.token.revoke` rotiert/widerrufen werden (erfordert Scope `operator.pairing`).
- `device.token.rotate` gibt Rotationsmetadaten zurück. Es gibt das ersetzende
  Bearer Token nur bei Same-Device-Aufrufen aus, die bereits mit
  diesem Device-Token authentifiziert sind, sodass Token-only-Clients ihren Ersatz speichern können, bevor
  sie sich erneut verbinden. Shared-/Admin-Rotationen geben das Bearer Token nicht aus.
- Token-Ausstellung, -Rotation und -Widerruf bleiben auf das genehmigte Rollenset beschränkt,
  das im Pairing-Eintrag dieses Geräts aufgezeichnet ist; Token-Mutation kann keine Geräterolle erweitern oder
  adressieren, die durch die Pairing-Genehmigung nie gewährt wurde.
- Bei Token-Sessions gekoppelter Geräte ist die Geräteverwaltung selbstbezogen, sofern der
  Aufrufer nicht zusätzlich `operator.admin` besitzt: Nicht-Admin-Aufrufer können nur ihren **eigenen**
  Geräteeintrag entfernen/widerrufen/rotieren.
- `device.token.rotate` und `device.token.revoke` prüfen außerdem das Scope-Set des Ziel-Operator-Tokens
  gegen die aktuellen Session-Scopes des Aufrufers. Nicht-Admin-Aufrufer können
  kein breiteres Operator-Token rotieren oder widerrufen, als sie bereits besitzen.
- Authentifizierungsfehler enthalten `error.details.code` plus Wiederherstellungshinweise:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Clientverhalten bei `AUTH_TOKEN_MISMATCH`:
  - Vertrauenswürdige Clients dürfen einen begrenzten Retry mit einem zwischengespeicherten Token pro Gerät versuchen.
  - Wenn dieser Retry fehlschlägt, sollten Clients automatische Reconnect-Schleifen stoppen und Hinweise für Bedienermaßnahmen anzeigen.

## Geräteidentität + Pairing

- Nodes sollten eine stabile Geräteidentität (`device.id`) enthalten, die aus einem
  Keypair-Fingerprint abgeleitet ist.
- Gateways stellen Tokens pro Gerät + Rolle aus.
- Pairing-Genehmigungen sind für neue Geräte-IDs erforderlich, sofern lokale automatische Genehmigung
  nicht aktiviert ist.
- Pairing-Autogenehmigung ist auf direkte local loopback-Verbindungen ausgerichtet.
- OpenClaw hat außerdem einen engen backend-/containerlokalen Self-Connect-Pfad für
  vertrauenswürdige Hilfsflüsse mit gemeinsamem Geheimnis.
- Same-Host-Tailnet- oder LAN-Verbindungen werden für Pairing weiterhin als remote behandelt und
  erfordern Genehmigung.
- WS-Clients enthalten während `connect` normalerweise die `device`-Identität (Operator +
  Node). Die einzigen device-losen Operator-Ausnahmen sind explizite Vertrauenspfade:
  - `gateway.controlUi.allowInsecureAuth=true` für localhost-only unsichere HTTP-Kompatibilität.
  - erfolgreiche Operator-Control-UI-Authentifizierung mit `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (Break-Glass, erhebliche Sicherheitsherabstufung).
  - direkte Loopback-`gateway-client`-Backend-RPCs, authentifiziert mit dem gemeinsamen
    Gateway-Token/Passwort.
- Alle Verbindungen müssen die vom Server bereitgestellte `connect.challenge`-Nonce signieren.

### Diagnose der Geräteauthentifizierungs-Migration

Für Legacy-Clients, die noch Signierverhalten von vor der Challenge verwenden, gibt `connect` jetzt
`DEVICE_AUTH_*`-Detailcodes unter `error.details.code` mit einem stabilen `error.details.reason` zurück.

Häufige Migrationsfehler:

| Nachricht                   | details.code                     | details.reason           | Bedeutung                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client hat `device.nonce` ausgelassen (oder leer gesendet). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client hat mit einer veralteten/falschen Nonce signiert. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signatur-Payload entspricht nicht dem v2-Payload.  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Signierter Zeitstempel liegt außerhalb der erlaubten Abweichung. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` entspricht nicht dem Public-Key-Fingerprint. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public-Key-Format/Kanonisierung fehlgeschlagen.    |

Migrationsziel:

- Immer auf `connect.challenge` warten.
- Den v2-Payload signieren, der die Server-Nonce enthält.
- Dieselbe Nonce in `connect.params.device.nonce` senden.
- Bevorzugter Signatur-Payload ist `v3`, der zusätzlich zu Geräte-/Client-/Rollen-/Scopes-/Token-/Nonce-Feldern
  auch `platform` und `deviceFamily` bindet.
- Legacy-`v2`-Signaturen werden aus Kompatibilitätsgründen weiterhin akzeptiert, aber das Pinning von Metadaten
  gekoppelter Geräte steuert weiterhin die Befehlsrichtlinie beim Reconnect.

## TLS + Pinning

- TLS wird für WS-Verbindungen unterstützt.
- Clients können optional den Gateway-Zertifikats-Fingerprint pinnen (siehe `gateway.tls`-
  Konfiguration plus `gateway.remote.tlsFingerprint` oder CLI `--tls-fingerprint`).

## Umfang

Dieses Protokoll stellt die **vollständige Gateway-API** bereit (Status, Channels, Modelle, Chat,
Agent, Sessions, Nodes, Genehmigungen usw.). Die genaue Oberfläche wird durch die
TypeBox-Schemas in `src/gateway/protocol/schema.ts` definiert.

## Verwandt

- [Bridge-Protokoll](/de/gateway/bridge-protocol)
- [Gateway-Runbook](/de/gateway)
