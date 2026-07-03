---
read_when:
    - Gateway-WS-Clients implementieren oder aktualisieren
    - Fehlersuche bei Protokollabweichungen oder Verbindungsfehlern
    - Protokollschema/-modelle neu generieren
summary: 'Gateway-WebSocket-Protokoll: Handshake, Frames, Versionierung'
title: Gateway-Protokoll
x-i18n:
    generated_at: "2026-07-03T13:22:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 815ac729824587579d112d665df2060d84d2894b4d46235e210804ca8a07082d
    source_path: gateway/protocol.md
    workflow: 16
---

Das Gateway-WS-Protokoll ist die **einzige Steuerungsebene + Node-Transport** für
OpenClaw. Alle Clients (CLI, Web-UI, macOS-App, iOS-/Android-Nodes, headless
Nodes) verbinden sich per WebSocket und deklarieren ihre **Rolle** + ihren
**Scope** zum Handshake-Zeitpunkt.

## Transport

- WebSocket, Text-Frames mit JSON-Payloads.
- Der erste Frame **muss** eine `connect`-Anfrage sein.
- Pre-Connect-Frames sind auf 64 KiB begrenzt. Nach einem erfolgreichen Handshake sollten Clients
  die Limits `hello-ok.policy.maxPayload` und
  `hello-ok.policy.maxBufferedBytes` einhalten. Bei aktivierter Diagnose
  geben zu große eingehende Frames und langsame ausgehende Puffer `payload.large`-Ereignisse aus,
  bevor das Gateway den betroffenen Frame schließt oder verwirft. Diese Ereignisse enthalten
  Größen, Limits, Oberflächen und sichere Reason-Codes. Sie enthalten nicht den Nachrichtentext,
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

Während das Gateway noch Startup-Sidecars abschließt, kann die `connect`-Anfrage
einen wiederholbaren `UNAVAILABLE`-Fehler zurückgeben, bei dem `details.reason` auf
`"startup-sidecars"` gesetzt ist und `retryAfterMs` enthält. Clients sollten diese Antwort
innerhalb ihres gesamten Verbindungsbudgets erneut versuchen, statt sie als terminalen
Handshake-Fehler anzuzeigen.

`server`, `features`, `snapshot` und `policy` sind alle vom Schema erforderlich
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` ist ebenfalls erforderlich und meldet
die ausgehandelte Rolle bzw. die ausgehandelten Scopes. `pluginSurfaceUrls` ist optional und ordnet Plugin-
Oberflächennamen wie `canvas` scoped gehosteten URLs zu.

Scoped Plugin-Oberflächen-URLs können ablaufen. Nodes können
`node.pluginSurface.refresh` mit `{ "surface": "canvas" }` aufrufen, um einen frischen
Eintrag in `pluginSurfaceUrls` zu erhalten. Der experimentelle Canvas-Plugin-Refactor unterstützt den
veralteten Kompatibilitätspfad `canvasHostUrl`, `canvasCapability` oder
`node.canvas.capability.refresh` nicht; aktuelle native Clients und
Gateways müssen Plugin-Oberflächen verwenden.

Wenn kein Gerätetoken ausgegeben wird, meldet `hello-ok.auth` die ausgehandelten
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
sie sich mit dem gemeinsamen Gateway-Token/Passwort authentifizieren. Dieser Pfad ist für
interne Control-Plane-RPCs reserviert und verhindert, dass veraltete CLI-/Geräte-Pairing-Baselines
lokale Backend-Arbeit wie Aktualisierungen von Subagent-Sitzungen blockieren. Remote-Clients,
Browser-Origin-Clients, Node-Clients und explizite Geräte-Token-/Geräteidentitäts-
Clients verwenden weiterhin die normalen Pairing- und Scope-Upgrade-Prüfungen.

Wenn ein Gerätetoken ausgegeben wird, enthält `hello-ok` außerdem:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Der integrierte QR-/Setup-Code-Bootstrap ist ein frischer mobiler Übergabepfad. Eine erfolgreiche
Baseline-Setup-Code-Connect-Anfrage gibt ein primäres Node-Token plus ein begrenztes
Operator-Token zurück:

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

Die Operator-Übergabe ist absichtlich begrenzt, damit QR-Onboarding den
mobilen Operator-Loop starten und die native Einrichtung abschließen kann, ohne Pairing-
Mutations-Scopes oder `operator.admin` zu gewähren. Sie enthält `operator.talk.secrets`, damit der
native Client die Talk-Konfiguration lesen kann, die er nach dem Bootstrap benötigt. Weitergehender
Pairing- und Admin-Zugriff erfordert einen separaten genehmigten Operator-Pairing- oder Token-
Flow. Clients sollten
`hello-ok.auth.deviceTokens` nur persistieren,
wenn die Connect-Anfrage Bootstrap-Authentifizierung über einen vertrauenswürdigen Transport wie `wss://` oder
Loopback-/lokales Pairing verwendet hat.

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
- **Ereignis**: `{type:"event", event, payload, seq?, stateVersion?}`

Methoden mit Nebeneffekten erfordern **Idempotenzschlüssel** (siehe Schema).

## Rollen + Scopes

Das vollständige Operator-Scope-Modell, Prüfungen zum Genehmigungszeitpunkt und Shared-Secret-
Semantik finden Sie unter [Operator-Scopes](/de/gateway/operator-scopes).

### Rollen

- `operator` = Control-Plane-Client (CLI/UI/Automatisierung).
- `node` = Capability-Host (camera/screen/canvas/system.run).

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
Wenn Secrets enthalten sind, sollten Clients die aktiven Talk-Provider-
Zugangsdaten aus `talk.resolved.config.apiKey` lesen; `talk.providers.<id>.apiKey`
bleibt quellenförmig und kann ein SecretRef-Objekt oder ein redigierter String sein.

Vom Plugin registrierte Gateway-RPC-Methoden können ihren eigenen Operator-Scope anfordern, aber
reservierte Core-Admin-Präfixe (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) werden immer zu `operator.admin` aufgelöst.

Der Methoden-Scope ist nur die erste Schranke. Einige Slash-Commands, die über
`chat.send` erreicht werden, wenden zusätzlich strengere Prüfungen auf Command-Ebene an. Persistente
Schreibvorgänge mit `/config set` und `/config unset` erfordern beispielsweise `operator.admin`.

`node.pair.approve` hat außerdem zusätzlich zum
Basis-Methoden-Scope eine zusätzliche Scope-Prüfung zum Genehmigungszeitpunkt:

- Anfragen ohne Commands: `operator.pairing`
- Anfragen mit Nicht-Exec-Node-Commands: `operator.pairing` + `operator.write`
- Anfragen, die `system.run`, `system.run.prepare` oder `system.which` enthalten:
  `operator.pairing` + `operator.admin`

### Caps/Commands/Berechtigungen (Node)

Nodes deklarieren Capability-Claims zum Connect-Zeitpunkt:

- `caps`: übergeordnete Capability-Kategorien wie `camera`, `canvas`, `screen`,
  `location`, `voice` und `talk`.
- `commands`: Command-Allowlist für Invoke.
- `permissions`: granulare Umschalter (z. B. `screen.record`, `camera.capture`).

Das Gateway behandelt diese als **Claims** und erzwingt serverseitige Allowlists.

## Presence

- `system-presence` gibt Einträge zurück, die nach Geräteidentität geschlüsselt sind.
- Presence-Einträge enthalten `deviceId`, `roles` und `scopes`, damit UIs eine einzelne Zeile pro Gerät anzeigen können,
  selbst wenn es sich sowohl als **operator** als auch als **node** verbindet.
- `node.list` enthält optionale Felder `lastSeenAtMs` und `lastSeenReason`. Verbundene Nodes melden
  ihre aktuelle Verbindungszeit als `lastSeenAtMs` mit dem Reason `connect`; gepairte Nodes können außerdem
  dauerhafte Hintergrund-Presence melden, wenn ein vertrauenswürdiges Node-Ereignis ihre Pairing-Metadaten aktualisiert.

### Node-Hintergrund-Alive-Ereignis

Nodes können `node.event` mit `event: "node.presence.alive"` aufrufen, um aufzuzeichnen, dass ein gepairter Node
während eines Hintergrund-Wake alive war, ohne ihn als verbunden zu markieren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` ist ein geschlossenes Enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` oder `connect`. Unbekannte Trigger-Strings werden vom Gateway vor der Persistenz zu
`background` normalisiert. Das Ereignis ist nur für authentifizierte Node-
Gerätesitzungen dauerhaft; gerätelose oder ungepairte Sitzungen geben `handled: false` zurück.

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
bestätigten RPC behandeln, nicht als dauerhafte Presence-Persistenz.

## Scoping von Broadcast-Ereignissen

Serverseitig gepushte WebSocket-Broadcast-Ereignisse sind Scope-geschützt, sodass Pairing-scoped oder Node-only-Sitzungen Sitzungsinhalte nicht passiv empfangen.

- **Chat-, Agent- und Tool-Result-Frames** (einschließlich gestreamter `agent`-Ereignisse und Tool-Call-Ergebnisse) erfordern mindestens `operator.read`. Sitzungen ohne `operator.read` überspringen diese Frames vollständig.
- **Plugin-definierte `plugin.*`-Broadcasts** werden je nachdem, wie das Plugin sie registriert hat, mit `operator.write` oder `operator.admin` geschützt.
- **Status- und Transportereignisse** (`heartbeat`, `presence`, `tick`, Connect-/Disconnect-Lebenszyklus usw.) bleiben uneingeschränkt, damit die Transportgesundheit für jede authentifizierte Sitzung beobachtbar bleibt.
- **Unbekannte Broadcast-Ereignisfamilien** sind standardmäßig Scope-geschützt (fail-closed), sofern ein registrierter Handler sie nicht ausdrücklich lockert.

Jede Client-Verbindung behält ihre eigene Sequenznummer pro Client, sodass Broadcasts auf diesem Socket eine monotone Reihenfolge beibehalten, auch wenn unterschiedliche Clients unterschiedliche Scope-gefilterte Teilmengen des Ereignisstroms sehen.

## Gängige RPC-Methodenfamilien

Die öffentliche WS-Oberfläche ist breiter als die obigen Handshake-/Auth-Beispiele. Dies
ist kein generierter Dump — `hello-ok.features.methods` ist eine konservative
Discovery-Liste, die aus `src/gateway/server-methods-list.ts` plus geladenen
Plugin-/Channel-Methodenexporten erstellt wird. Behandeln Sie sie als Feature Discovery, nicht als vollständige
Aufzählung von `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="System und Identität">
    - `health` gibt den zwischengespeicherten oder frisch geprüften Gateway-Health-Snapshot zurück.
    - `diagnostics.stability` gibt den aktuellen begrenzten Diagnostic-Stability-Recorder zurück. Er speichert Betriebsmetadaten wie Ereignisnamen, Zählwerte, Byte-Größen, Speichermesswerte, Queue-/Sitzungsstatus, Kanal-/Plugin-Namen und Sitzungs-IDs. Er speichert keine Chat-Texte, Webhook-Bodies, Tool-Ausgaben, rohen Request- oder Response-Bodies, Token, Cookies oder geheimen Werte. Operator-Lesezugriff ist erforderlich.
    - `status` gibt die Gateway-Zusammenfassung im Stil von `/status` zurück; sensible Felder sind nur für Operator-Clients mit Admin-Scope enthalten.
    - `gateway.identity.get` gibt die Gateway-Geräteidentität zurück, die von Relay- und Pairing-Flows verwendet wird.
    - `system-presence` gibt den aktuellen Presence-Snapshot für verbundene Operator-/Node-Geräte zurück.
    - `system-event` hängt ein Systemereignis an und kann den Presence-Kontext aktualisieren/übertragen.
    - `last-heartbeat` gibt das neueste persistierte Heartbeat-Ereignis zurück.
    - `set-heartbeats` schaltet die Heartbeat-Verarbeitung auf dem Gateway um.

  </Accordion>

  <Accordion title="Modelle und Nutzung">
    - `models.list` gibt den zur Laufzeit erlaubten Modellkatalog zurück. Übergeben Sie `{ "view": "configured" }` für Picker-große konfigurierte Modelle (zuerst `agents.defaults.models`, dann `models.providers.*.models`) oder `{ "view": "all" }` für den vollständigen Katalog.
    - `usage.status` gibt Provider-Nutzungsfenster/Zusammenfassungen des verbleibenden Kontingents zurück.
    - `usage.cost` gibt aggregierte Kostennutzungszusammenfassungen für einen Datumsbereich zurück.
      Übergeben Sie `agentId` für einen Agenten oder `agentScope: "all"`, um konfigurierte Agenten zu aggregieren.
    - `doctor.memory.status` gibt die Bereitschaft von Vector-Memory / zwischengespeicherten Embeddings für den aktiven Standard-Agent-Workspace zurück. Übergeben Sie `{ "probe": true }` oder `{ "deep": true }` nur, wenn der Aufrufer ausdrücklich einen Live-Ping des Embedding-Providers wünscht. Dreaming-fähige Clients können außerdem `{ "agentId": "agent-id" }` übergeben, um Dreaming-Store-Statistiken auf einen ausgewählten Agent-Workspace einzugrenzen; wenn `agentId` weggelassen wird, bleibt der Fallback auf den Standard-Agenten erhalten und konfigurierte Dreaming-Workspaces werden aggregiert.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` und `doctor.memory.dedupeDreamDiary` akzeptieren optionale `{ "agentId": "agent-id" }`-Parameter für Dreaming-Ansichten/-Aktionen ausgewählter Agenten. Wenn `agentId` weggelassen wird, arbeiten sie auf dem konfigurierten Standard-Agent-Workspace.
    - `doctor.memory.remHarness` gibt eine begrenzte, schreibgeschützte REM-Harness-Vorschau für Remote-Control-Plane-Clients zurück. Sie kann Workspace-Pfade, Memory-Snippets, gerendertes Grounded-Markdown und Kandidaten für Deep Promotion enthalten, daher benötigen Aufrufer `operator.read`.
    - `sessions.usage` gibt Nutzungszusammenfassungen pro Sitzung zurück. Übergeben Sie `agentId` für einen
      Agenten oder `agentScope: "all"`, um konfigurierte Agenten gemeinsam aufzulisten.
    - `sessions.usage.timeseries` gibt Zeitreihen-Nutzung für eine Sitzung zurück.
    - `sessions.usage.logs` gibt Nutzungslogeinträge für eine Sitzung zurück.

  </Accordion>

  <Accordion title="Kanäle und Login-Helfer">
    - `channels.status` gibt integrierte + gebündelte Kanal-/Plugin-Statuszusammenfassungen zurück.
    - `channels.logout` meldet einen bestimmten Kanal/ein bestimmtes Konto ab, sofern der Kanal Logout unterstützt.
    - `web.login.start` startet einen QR-/Web-Login-Flow für den aktuellen QR-fähigen Web-Channel-Provider.
    - `web.login.wait` wartet, bis dieser QR-/Web-Login-Flow abgeschlossen ist, und startet bei Erfolg den Kanal.
    - `push.test` sendet einen Test-APNs-Push an einen registrierten iOS-Node.
    - `voicewake.get` gibt die gespeicherten Wake-Word-Trigger zurück.
    - `voicewake.set` aktualisiert Wake-Word-Trigger und überträgt die Änderung.

  </Accordion>

  <Accordion title="Messaging und Logs">
    - `send` ist der direkte RPC für ausgehende Zustellung für kanal-/konto-/threadbezogene Sends außerhalb des Chat-Runners.
    - `logs.tail` gibt den konfigurierten Gateway-Dateilog-Tail mit Cursor-/Limit- und Max-Byte-Steuerung zurück.

  </Accordion>

  <Accordion title="Talk und TTS">
    - `talk.catalog` gibt den schreibgeschützten Talk-Provider-Katalog für Sprache, Streaming-Transkription und Echtzeitstimme zurück. Er enthält kanonische Provider-IDs, Registry-Aliase, Labels, konfigurierten Status, ein optionales gruppenbezogenes `ready`-Ergebnis, offengelegte Modell-/Voice-IDs, kanonische Modi, Transports, Brain-Strategien und Echtzeit-Audio-/Capability-Flags, ohne Provider-Secrets zurückzugeben oder die globale Config zu verändern. Aktuelle Gateways setzen `ready`, nachdem die Laufzeit-Provider-Auswahl angewendet wurde; Clients sollten dessen Fehlen als ungeprüft behandeln, um mit älteren Gateways kompatibel zu bleiben.
    - `talk.config` gibt die effektive Talk-Config-Payload zurück; `includeSecrets` erfordert `operator.talk.secrets` (oder `operator.admin`).
    - `talk.session.create` erstellt eine Gateway-eigene Talk-Sitzung für `realtime/gateway-relay`, `transcription/gateway-relay` oder `stt-tts/managed-room`. Für `stt-tts/managed-room` müssen `operator.write`-Aufrufer, die `sessionKey` übergeben, auch `spawnedBy` für eingegrenzte Session-Key-Sichtbarkeit übergeben; nicht eingegrenzte `sessionKey`-Erstellung und `brain: "direct-tools"` erfordern `operator.admin`.
    - `talk.session.join` validiert ein Managed-Room-Sitzungstoken, gibt bei Bedarf `session.ready`- oder `session.replaced`-Ereignisse aus und gibt Raum-/Sitzungsmetadaten sowie aktuelle Talk-Ereignisse ohne Klartext-Token oder gespeicherten Token-Hash zurück.
    - `talk.session.appendAudio` hängt Base64-PCM-Eingabeaudio an Gateway-eigene Echtzeit-Relay- und Transkriptionssitzungen an.
    - `talk.session.startTurn`, `talk.session.endTurn` und `talk.session.cancelTurn` steuern den Managed-Room-Turn-Lebenszyklus mit Ablehnung veralteter Turns, bevor der Status gelöscht wird.
    - `talk.session.cancelOutput` stoppt die Audioausgabe des Assistenten, hauptsächlich für VAD-gesteuertes Barge-in in Gateway-Relay-Sitzungen.
    - `talk.session.submitToolResult` schließt einen Provider-Tool-Aufruf ab, der von einer Gateway-eigenen Echtzeit-Relay-Sitzung ausgegeben wurde. Übergeben Sie `options: { willContinue: true }` für vorläufige Tool-Ausgabe, wenn ein finales Ergebnis folgt, oder `options: { suppressResponse: true }`, wenn das Tool-Ergebnis den Provider-Aufruf erfüllen soll, ohne eine weitere Echtzeit-Antwort des Assistenten zu starten.
    - `talk.session.steer` sendet Sprachsteuerung für einen aktiven Run in eine Gateway-eigene agentengestützte Talk-Sitzung. Es akzeptiert `{ sessionId, text, mode? }`, wobei `mode` `status`, `steer`, `cancel` oder `followup` ist; ein weggelassener Modus wird aus dem gesprochenen Text klassifiziert.
    - `talk.session.close` schließt eine Gateway-eigene Relay-, Transkriptions- oder Managed-Room-Sitzung und gibt terminale Talk-Ereignisse aus.
    - `talk.mode` setzt/überträgt den aktuellen Talk-Modusstatus für WebChat-/Control-UI-Clients.
    - `talk.client.create` erstellt eine client-eigene Echtzeit-Provider-Sitzung mit `webrtc` oder `provider-websocket`, während das Gateway Config, Zugangsdaten, Anweisungen und Tool-Policy besitzt.
    - `talk.client.toolCall` lässt client-eigene Echtzeit-Transports Provider-Tool-Aufrufe an die Gateway-Policy weiterleiten. Das erste unterstützte Tool ist `openclaw_agent_consult`; Clients erhalten eine Run-ID und warten auf normale Chat-Lebenszyklusereignisse, bevor sie das providerspezifische Tool-Ergebnis übermitteln.
    - `talk.client.steer` sendet Sprachsteuerung für einen aktiven Run für client-eigene Echtzeit-Transports. Das Gateway löst den aktiven eingebetteten Run aus `sessionKey` auf und gibt ein strukturiertes angenommen/abgelehnt-Ergebnis zurück, statt Steuerung stillschweigend zu verwerfen.
    - `talk.event` ist der einzige Talk-Ereigniskanal für Echtzeit-, Transkriptions-, STT/TTS-, Managed-Room-, Telefonie- und Meeting-Adapter.
    - `talk.speak` synthetisiert Sprache über den aktiven Talk-Sprach-Provider.
    - `tts.status` gibt den aktivierten TTS-Status, den aktiven Provider, Fallback-Provider und den Provider-Config-Status zurück.
    - `tts.providers` gibt das sichtbare TTS-Provider-Inventar zurück.
    - `tts.enable` und `tts.disable` schalten den TTS-Prefs-Status um.
    - `tts.setProvider` aktualisiert den bevorzugten TTS-Provider.
    - `tts.convert` führt eine einmalige Text-zu-Sprache-Konvertierung aus.

  </Accordion>

  <Accordion title="Secrets, Config, Update und Assistent">
    - `secrets.reload` löst aktive SecretRefs erneut auf und tauscht den Laufzeit-Secret-Status nur bei vollständigem Erfolg aus.
    - `secrets.resolve` löst kommandozielbezogene Secret-Zuweisungen für ein bestimmtes Kommando-/Zielset auf.
    - `config.get` gibt den aktuellen Config-Snapshot und Hash zurück.
    - `config.set` schreibt eine validierte Config-Payload.
    - `config.patch` führt ein partielles Config-Update zusammen. Destruktiver Array-
      Ersatz erfordert den betroffenen Pfad in `replacePaths`; verschachtelte Arrays
      unter Array-Einträgen verwenden `[]`-Pfade wie `agents.list[].skills`.
    - `config.apply` validiert + ersetzt die vollständige Config-Payload.
    - `config.schema` gibt die Live-Config-Schema-Payload zurück, die von Control UI und CLI-Tools verwendet wird: Schema, `uiHints`, Version und Generierungsmetadaten, einschließlich Plugin- + Kanal-Schemametadaten, wenn die Laufzeit sie laden kann. Das Schema enthält Feldmetadaten `title` / `description`, die aus denselben Labels und Hilfetexten abgeleitet sind, die von der UI verwendet werden, einschließlich verschachtelter Objekt-, Wildcard-, Array-Item- und `anyOf` / `oneOf` / `allOf`-Kompositionszweige, wenn passende Felddokumentation vorhanden ist.
    - `config.schema.lookup` gibt eine pfadbezogene Lookup-Payload für einen Config-Pfad zurück: normalisierter Pfad, ein flacher Schemaknoten, passender Hinweis + `hintPath`, optionales `reloadKind` und unmittelbare Kindzusammenfassungen für UI-/CLI-Drilldown. `reloadKind` ist eines von `restart`, `hot` oder `none` und spiegelt den Gateway-Config-Reload-Planner für den angeforderten Pfad wider. Lookup-Schemaknoten behalten die nutzerorientierten Docs und gängigen Validierungsfelder (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerische/String-/Array-/Objektgrenzen und Flags wie `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Kindzusammenfassungen stellen `key`, den normalisierten `path`, `type`, `required`, `hasChildren`, optionales `reloadKind` sowie den passenden `hint` / `hintPath` bereit.
    - `update.run` führt den Gateway-Update-Flow aus und plant einen Neustart nur, wenn das Update selbst erfolgreich war; Aufrufer mit einer Sitzung können `continuationMessage` einschließen, damit der Start einen anschließenden Agent-Turn über die Neustart-Fortsetzungsqueue fortsetzt. Package-Manager-Updates und überwachte Git-Checkout-Updates aus der Control Plane verwenden eine entkoppelte Managed-Service-Übergabe, statt den Package-Baum zu ersetzen oder Checkout-/Build-Ausgabe innerhalb des laufenden Gateways zu verändern. Eine gestartete Übergabe gibt `ok: true` mit `result.reason: "managed-service-handoff-started"` und `handoff.status: "started"` zurück; nicht verfügbare oder fehlgeschlagene Übergaben geben `ok: false` mit `managed-service-handoff-unavailable` oder `managed-service-handoff-failed` sowie `handoff.command` zurück, wenn ein manuelles Shell-Update erforderlich ist. Eine nicht verfügbare Übergabe bedeutet, dass OpenClaw keine sichere Supervisor-Grenze oder dauerhafte Service-Identität hat, etwa `OPENCLAW_SYSTEMD_UNIT` für systemd. Während einer gestarteten Übergabe kann der Neustart-Sentinel kurz `stats.reason: "restart-health-pending"` melden; die Fortsetzung wird verzögert, bis die CLI das neu gestartete Gateway verifiziert und den finalen `ok`-Sentinel schreibt.
    - `update.status` aktualisiert den neuesten Update-Neustart-Sentinel und gibt ihn zurück, einschließlich der nach dem Neustart laufenden Version, sofern verfügbar.
    - `wizard.start`, `wizard.next`, `wizard.status` und `wizard.cancel` stellen den Onboarding-Assistenten über WS RPC bereit.

  </Accordion>

  <Accordion title="Agent- und Arbeitsbereichshelfer">
    - `agents.list` gibt konfigurierte Agent-Einträge zurück, einschließlich effektivem Modell und Laufzeitmetadaten.
    - `agents.create`, `agents.update` und `agents.delete` verwalten Agent-Datensätze und Arbeitsbereichsverdrahtung.
    - `agents.files.list`, `agents.files.get` und `agents.files.set` verwalten die Bootstrap-Arbeitsbereichsdateien, die für einen Agent offengelegt werden.
    - `tasks.list`, `tasks.get` und `tasks.cancel` legen das Gateway-Aufgabenprotokoll für SDK- und Betreiberclients offen.
    - `artifacts.list`, `artifacts.get` und `artifacts.download` legen aus Transkripten abgeleitete Artefaktzusammenfassungen und Downloads für einen expliziten Scope `sessionKey`, `runId` oder `taskId` offen. Run- und Task-Abfragen lösen die besitzende Sitzung serverseitig auf und geben nur Transkriptmedien mit passender Provenienz zurück; unsichere oder lokale URL-Quellen geben nicht unterstützte Downloads zurück, statt serverseitig abgerufen zu werden.
    - `environments.list` und `environments.status` legen schreibgeschützte Gateway-lokale und Node-Umgebungserkennung für SDK-Clients offen.
    - `agent.identity.get` gibt die effektive Assistentenidentität für einen Agent oder eine Sitzung zurück.
    - `agent.wait` wartet, bis ein Run abgeschlossen ist, und gibt den terminalen Snapshot zurück, wenn verfügbar.

  </Accordion>

  <Accordion title="Sitzungssteuerung">
    - `sessions.list` gibt den aktuellen Sitzungsindex zurück, einschließlich `agentRuntime`-Metadaten pro Zeile, wenn ein Agent-Laufzeit-Backend konfiguriert ist.
    - `sessions.subscribe` und `sessions.unsubscribe` schalten Abonnements für Sitzungsänderungsereignisse für den aktuellen WS-Client um.
    - `sessions.messages.subscribe` und `sessions.messages.unsubscribe` schalten Abonnements für Transkript-/Nachrichtenereignisse für eine Sitzung um.
    - `sessions.preview` gibt begrenzte Transkriptvorschauen für bestimmte Sitzungsschlüssel zurück.
    - `sessions.describe` gibt eine Gateway-Sitzungszeile für einen exakten Sitzungsschlüssel zurück.
    - `sessions.resolve` löst ein Sitzungsziel auf oder kanonisiert es.
    - `sessions.create` erstellt einen neuen Sitzungseintrag.
    - `sessions.send` sendet eine Nachricht in eine vorhandene Sitzung.
    - `sessions.steer` ist die Unterbrechen-und-Steuern-Variante für eine aktive Sitzung.
    - `sessions.abort` bricht aktive Arbeit für eine Sitzung ab. Ein Aufrufer kann `key` plus optional `runId` übergeben oder nur `runId` für aktive Runs übergeben, die das Gateway einer Sitzung zuordnen kann.
    - `sessions.patch` aktualisiert Sitzungsmetadaten/-Overrides und meldet das aufgelöste kanonische Modell plus effektives `agentRuntime`.
    - `sessions.reset`, `sessions.delete` und `sessions.compact` führen Sitzungswartung aus.
    - `sessions.get` gibt die vollständig gespeicherte Sitzungszeile zurück.
    - Die Chat-Ausführung verwendet weiterhin `chat.history`, `chat.send`, `chat.abort` und `chat.inject`. `chat.history` ist für UI-Clients anzeigennormalisiert: Inline-Direktiv-Tags werden aus sichtbarem Text entfernt, Klartext-XML-Nutzdaten von Tool-Aufrufen (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittenen Tool-Aufrufblöcken) sowie geleakte ASCII-/vollbreite Modell-Steuerungstoken werden entfernt, reine Silent-Token-Assistentenzeilen wie exaktes `NO_REPLY` / `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden.
    - `chat.message.get` ist der additive begrenzte Vollnachrichtenleser für einen einzelnen sichtbaren Transkripteintrag. Clients übergeben `sessionKey`, optional `agentId`, wenn die Sitzungsauswahl Agent-gescopet ist, plus eine Transkript-`messageId`, die zuvor über `chat.history` offengelegt wurde, und das Gateway gibt dieselbe anzeigennormalisierte Projektion ohne die leichte Verlaufskürzungsobergrenze zurück, wenn der gespeicherte Eintrag noch verfügbar und nicht übergroß ist.
    - `chat.send` akzeptiert einmalig `fastMode: "auto"`, um den Schnellmodus für Modellaufrufe zu verwenden, die vor dem Auto-Grenzwert gestartet wurden, und spätere Retry-, Fallback-, Tool-Ergebnis- oder Fortsetzungsaufrufe ohne Schnellmodus zu starten. Der Grenzwert ist standardmäßig 60 Sekunden und kann pro Modell mit `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` konfiguriert werden. Ein `chat.send`-Aufrufer kann einmalig `fastAutoOnSeconds` übergeben, um den Grenzwert für diese Anfrage zu überschreiben.

  </Accordion>

  <Accordion title="Gerätekopplung und Gerätetoken">
    - `device.pair.list` gibt ausstehende und genehmigte gekoppelte Geräte zurück.
    - `device.pair.approve`, `device.pair.reject` und `device.pair.remove` verwalten Gerätekopplungsdatensätze.
    - `device.token.rotate` rotiert ein gekoppeltes Gerätetoken innerhalb seiner genehmigten Rollen- und Aufrufer-Scope-Grenzen.
    - `device.token.revoke` widerruft ein gekoppeltes Gerätetoken innerhalb seiner genehmigten Rollen- und Aufrufer-Scope-Grenzen.

  </Accordion>

  <Accordion title="Node-Kopplung, Aufruf und ausstehende Arbeit">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` und `node.pair.verify` decken Node-Kopplung und Bootstrap-Verifizierung ab.
    - `node.list` und `node.describe` geben den bekannten/verbundenen Node-Zustand zurück.
    - `node.rename` aktualisiert ein gekoppeltes Node-Label.
    - `node.invoke` leitet einen Befehl an eine verbundene Node weiter.
    - `node.invoke.result` gibt das Ergebnis für eine Aufrufanfrage zurück.
    - `node.event` transportiert von Nodes stammende Ereignisse zurück in das Gateway.
    - `node.pending.pull` und `node.pending.ack` sind die Queue-APIs für verbundene Nodes.
    - `node.pending.enqueue` und `node.pending.drain` verwalten dauerhafte ausstehende Arbeit für Offline-/getrennte Nodes.

  </Accordion>

  <Accordion title="Genehmigungsfamilien">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` und `exec.approval.resolve` decken einmalige Exec-Genehmigungsanfragen sowie die Suche/Wiederholung ausstehender Genehmigungen ab.
    - `exec.approval.waitDecision` wartet auf eine ausstehende Exec-Genehmigung und gibt die finale Entscheidung zurück (oder `null` bei Timeout).
    - `exec.approvals.get` und `exec.approvals.set` verwalten Snapshots der Gateway-Exec-Genehmigungsrichtlinie.
    - `exec.approvals.node.get` und `exec.approvals.node.set` verwalten die Node-lokale Exec-Genehmigungsrichtlinie über Node-Relay-Befehle.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` und `plugin.approval.resolve` decken Plugin-definierte Genehmigungsabläufe ab.

  </Accordion>

  <Accordion title="Automatisierung, Skills und Tools">
    - Automatisierung: `wake` plant eine sofortige oder nächste-Heartbeat-Wecktext-Injektion; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` verwalten geplante Arbeit.
    - `cron.run` bleibt ein Enqueue-artiger RPC für manuelle Runs. Clients, die Abschlusssemantik benötigen, sollten die zurückgegebene `runId` lesen und `cron.runs` abfragen.
    - `cron.runs` akzeptiert einen optionalen nicht leeren `runId`-Filter, damit Clients einem einzelnen eingereihten manuellen Run folgen können, ohne mit anderen Verlaufseinträgen für denselben Job zu konkurrieren.
    - Skills und Tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Häufige Ereignisfamilien

- `chat`: UI-Chat-Updates wie `chat.inject` und andere rein transkriptbezogene Chat-
  Ereignisse. In Protokoll v4 tragen Delta-Nutzdaten `deltaText`; `message` bleibt
  der kumulative Assistenten-Snapshot. Nicht-Präfix-Ersetzungen setzen `replace=true`
  und verwenden `deltaText` als Ersetzungstext.
- `session.message`, `session.operation` und `session.tool`: Transkript-,
  laufende Sitzungsoperation- und Ereignisstream-Updates für eine abonnierte
  Sitzung.
- `sessions.changed`: Sitzungsindex oder Metadaten geändert.
- `presence`: Updates des Systempräsenz-Snapshots.
- `tick`: periodisches Keepalive-/Liveness-Ereignis.
- `health`: Update des Gateway-Health-Snapshots.
- `heartbeat`: Update des Heartbeat-Ereignisstreams.
- `cron`: Cron-Run-/Job-Änderungsereignis.
- `shutdown`: Gateway-Shutdown-Benachrichtigung.
- `node.pair.requested` / `node.pair.resolved`: Node-Kopplungslebenszyklus.
- `node.invoke.request`: Broadcast einer Node-Aufrufanfrage.
- `device.pair.requested` / `device.pair.resolved`: Lebenszyklus gekoppelter Geräte.
- `voicewake.changed`: Wake-Word-Trigger-Konfiguration geändert.
- `exec.approval.requested` / `exec.approval.resolved`: Exec-Genehmigungs-
  lebenszyklus.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin-Genehmigungs-
  lebenszyklus.

### Node-Hilfsmethoden

- Nodes können `skills.bins` aufrufen, um die aktuelle Liste der Skill-Ausführdateien
  für Auto-Allow-Prüfungen abzurufen.

### Aufgabenprotokoll-RPCs

Betreiberclients können Gateway-Hintergrundaufgabendatensätze über
die Aufgabenprotokoll-RPCs inspizieren und abbrechen. Diese Methoden geben bereinigte Aufgabenzusammenfassungen zurück, nicht den rohen
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
  - Fehlende Task-IDs geben die Not-found-Fehlerform des Gateway zurück.
- `tasks.cancel` erfordert `operator.write`.
  - Parameter: `{ "taskId": string, "reason"?: string }`.
  - Ergebnis:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` meldet, ob das Protokoll eine passende Aufgabe hatte. `cancelled`
    meldet, ob die Laufzeit den Abbruch akzeptiert oder aufgezeichnet hat.

`TaskSummary` enthält `id`, `status` und optionale Metadaten wie `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, Zeitstempel, Fortschritt,
terminale Zusammenfassung und bereinigten Fehlertext. `agentId` identifiziert den Agent,
der die Aufgabe ausführt; `sessionKey` und `ownerKey` erhalten Anfrage- und Steuerungs-
kontext.

### Betreiber-Hilfsmethoden

- Operatoren können `commands.list` (`operator.read`) aufrufen, um das Laufzeit-
  Befehlsinventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den standardmäßigen Agent-Arbeitsbereich zu lesen.
  - `scope` steuert, auf welche Oberfläche der primäre `name` zielt:
    - `text` gibt das primäre Textbefehlstoken ohne führendes `/` zurück
    - `native` und der standardmäßige `both`-Pfad geben Provider-bewusste native Namen zurück,
      wenn verfügbar
  - `textAliases` enthält exakte Slash-Aliasse wie `/model` und `/m`.
  - `nativeName` enthält den Provider-bewussten nativen Befehlsnamen, sofern vorhanden.
  - `provider` ist optional und wirkt sich nur auf native Benennung sowie die Verfügbarkeit nativer Plugin-
    Befehle aus.
  - `includeArgs=false` lässt serialisierte Argumentmetadaten in der Antwort weg.
- Operatoren können `tools.catalog` (`operator.read`) aufrufen, um den Laufzeit-Toolkatalog für einen
  Agenten abzurufen. Die Antwort enthält gruppierte Tools und Provenienzmetadaten:
  - `source`: `core` oder `plugin`
  - `pluginId`: Plugin-Eigentümer, wenn `source="plugin"`
  - `optional`: ob ein Plugin-Tool optional ist
- Operatoren können `tools.effective` (`operator.read`) aufrufen, um das zur Laufzeit effektive Tool-
  Inventar für eine Sitzung abzurufen.
  - `sessionKey` ist erforderlich.
  - Das Gateway leitet vertrauenswürdigen Laufzeitkontext serverseitig aus der Sitzung ab, statt
    vom Aufrufer bereitgestellten Authentifizierungs- oder Auslieferungskontext zu akzeptieren.
  - Die Antwort ist eine sitzungsbezogene, serverseitig abgeleitete Projektion des aktiven Inventars,
    einschließlich Core-, Plugin-, Kanal- und bereits entdeckter MCP-Server-Tools.
  - `tools.effective` ist für MCP schreibgeschützt: Es kann einen warmen Sitzungs-MCP-Katalog durch die
    finale Tool-Richtlinie projizieren, erstellt aber keine MCP-Laufzeiten, verbindet keine Transports
    und gibt kein `tools/list` aus. Wenn kein passender warmer Katalog vorhanden ist, kann die Antwort
    einen Hinweis wie `mcp-not-yet-connected`, `mcp-not-yet-listed` oder `mcp-stale-catalog` enthalten.
  - Effektive Tool-Einträge verwenden `source="core"`, `source="plugin"`, `source="channel"` oder
    `source="mcp"`.
- Operatoren können `tools.invoke` (`operator.write`) aufrufen, um ein verfügbares Tool über denselben
  Gateway-Richtlinienpfad wie `/tools/invoke` aufzurufen.
  - `name` ist erforderlich. `args`, `sessionKey`, `agentId`, `confirm` und
    `idempotencyKey` sind optional.
  - Wenn sowohl `sessionKey` als auch `agentId` vorhanden sind, muss der aufgelöste Sitzungsagent mit
    `agentId` übereinstimmen.
  - Nur für Eigentümer bestimmte Core-Wrapper wie `cron`, `gateway` und `nodes` erfordern
    Eigentümer-/Admin-Identität (`operator.admin`), obwohl die Methode `tools.invoke`
    selbst `operator.write` ist.
  - Die Antwort ist ein SDK-seitiger Umschlag mit `ok`, `toolName`, optionalem `output` und typisierten
    `error`-Feldern. Genehmigungs- oder Richtlinienablehnungen geben `ok:false` in der Nutzlast zurück,
    statt die Gateway-Tool-Richtlinienpipeline zu umgehen.
- Operatoren können `skills.status` (`operator.read`) aufrufen, um das sichtbare
  Skills-Inventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den standardmäßigen Agent-Arbeitsbereich zu lesen.
  - Die Antwort enthält Eignung, fehlende Anforderungen, Konfigurationsprüfungen und
    bereinigte Installationsoptionen, ohne rohe geheime Werte offenzulegen.
- Operatoren können `skills.search` und `skills.detail` (`operator.read`) für
  ClawHub-Discovery-Metadaten aufrufen.
- Operatoren können `skills.upload.begin`, `skills.upload.chunk` und
  `skills.upload.commit` (`operator.admin`) aufrufen, um ein privates Skill-Archiv
  vor der Installation bereitzustellen. Dies ist ein separater Admin-Upload-Pfad für vertrauenswürdige Clients,
  nicht der normale ClawHub-Skill-Installationsablauf, und ist standardmäßig deaktiviert, sofern nicht
  `skills.install.allowUploadedArchives` aktiviert ist.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    erstellt einen Upload, der an diesen Slug und Force-Wert gebunden ist.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` hängt Bytes am
    exakt dekodierten Offset an.
  - `skills.upload.commit({ uploadId, sha256? })` überprüft die endgültige Größe und
    SHA-256. Commit schließt nur den Upload ab; es installiert den Skill nicht.
  - Hochgeladene Skill-Archive sind ZIP-Archive, die eine `SKILL.md`-Wurzel enthalten. Der
    interne Verzeichnisname des Archivs wählt niemals das Installationsziel aus.
- Operatoren können `skills.install` (`operator.admin`) in drei Modi aufrufen:
  - ClawHub-Modus: `{ source: "clawhub", slug, version?, force? }` installiert einen
    Skill-Ordner in das Verzeichnis `skills/` des standardmäßigen Agent-Arbeitsbereichs.
  - Upload-Modus: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installiert einen abgeschlossenen Upload in das Verzeichnis `skills/<slug>` des standardmäßigen Agent-Arbeitsbereichs.
    Der Slug und der Force-Wert müssen mit der ursprünglichen
    `skills.upload.begin`-Anfrage übereinstimmen. Dieser Modus wird abgelehnt, sofern
    `skills.install.allowUploadedArchives` nicht aktiviert ist. Die Einstellung wirkt sich nicht
    auf ClawHub-Installationen aus.
  - Gateway-Installer-Modus: `{ name, installId, timeoutMs? }`
    führt eine deklarierte `metadata.openclaw.install`-Aktion auf dem Gateway-Host aus.
    Ältere Clients können weiterhin `dangerouslyForceUnsafeInstall` senden; dieses Feld ist
    veraltet, wird nur aus Gründen der Protokollkompatibilität akzeptiert und ignoriert. Verwenden Sie
    `security.installPolicy` für operatorgesteuerte Installationsentscheidungen.
- Operatoren können `skills.update` (`operator.admin`) in zwei Modi aufrufen:
  - Der ClawHub-Modus aktualisiert einen verfolgten Slug oder alle verfolgten ClawHub-Installationen im
    standardmäßigen Agent-Arbeitsbereich.
  - Der Konfigurationsmodus patcht `skills.entries.<skillKey>`-Werte wie `enabled`,
    `apiKey` und `env`.

### `models.list`-Ansichten

`models.list` akzeptiert einen optionalen Parameter `view`:

- Weggelassen oder `"default"`: aktuelles Laufzeitverhalten. Wenn `agents.defaults.models` konfiguriert ist, ist die Antwort der erlaubte Katalog, einschließlich dynamisch entdeckter Modelle für `provider/*`-Einträge. Andernfalls ist die Antwort der vollständige Gateway-Katalog.
- `"configured"`: verhaltensweise für Auswahlmenüs. Wenn `agents.defaults.models` konfiguriert ist, hat es weiterhin Vorrang, einschließlich Provider-bezogener Discovery für `provider/*`-Einträge. Ohne Allowlist verwendet die Antwort explizite `models.providers.*.models`-Einträge und fällt nur dann auf den vollständigen Katalog zurück, wenn keine konfigurierten Modellzeilen vorhanden sind.
- `"all"`: vollständiger Gateway-Katalog, der `agents.defaults.models` umgeht. Verwenden Sie dies für Diagnose- und Discovery-UIs, nicht für normale Modellauswahlen.

## Exec-Genehmigungen

- Wenn eine Exec-Anfrage Genehmigung benötigt, sendet das Gateway `exec.approval.requested`.
- Operator-Clients lösen dies durch Aufruf von `exec.approval.resolve` auf (erfordert den Scope `operator.approvals`).
- Für `host=node` muss `exec.approval.request` `systemRunPlan` enthalten (kanonische `argv`/`cwd`/`rawCommand`/Sitzungsmetadaten). Anfragen ohne `systemRunPlan` werden abgelehnt.
- Nach der Genehmigung verwenden weitergeleitete `node.invoke system.run`-Aufrufe diesen kanonischen
  `systemRunPlan` als autoritativen Befehls-/cwd-/Sitzungskontext.
- Wenn ein Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` zwischen Vorbereitung und der final genehmigten `system.run`-Weiterleitung mutiert, lehnt das
  Gateway den Lauf ab, statt der mutierten Nutzlast zu vertrauen.

## Agent-Auslieferungsfallback

- `agent`-Anfragen können `deliver=true` enthalten, um ausgehende Auslieferung anzufordern.
- `bestEffortDeliver=false` behält striktes Verhalten bei: nicht auflösbare oder nur interne Auslieferungsziele geben `INVALID_REQUEST` zurück.
- `bestEffortDeliver=true` erlaubt den Fallback auf sitzungsgebundene Ausführung, wenn keine extern auslieferbare Route aufgelöst werden kann (zum Beispiel interne/Webchat-Sitzungen oder mehrdeutige Mehrkanal-Konfigurationen).
- Finale `agent`-Ergebnisse können `result.deliveryStatus` enthalten, wenn Auslieferung
  angefordert wurde, mit denselben Statuswerten `sent`, `suppressed`, `partial_failed` und `failed`,
  die für [`openclaw agent --json --deliver`](/de/cli/agent#json-delivery-status) dokumentiert sind.

## Versionierung

- `PROTOCOL_VERSION` befindet sich in `packages/gateway-protocol/src/version.ts`.
- Clients senden `minProtocol` + `maxProtocol`; der Server lehnt Bereiche ab, die
  sein aktuelles Protokoll nicht enthalten. Aktuelle Clients und Server erfordern
  Protokoll v4.
- Schemas + Modelle werden aus TypeBox-Definitionen generiert:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Client-Konstanten

Der Referenzclient in `src/gateway/client.ts` verwendet diese Standardwerte. Die Werte sind
über Protokoll v4 hinweg stabil und die erwartete Basis für Drittanbieter-Clients.

| Konstante                                 | Standard                                              | Quelle                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Anfrage-Timeout (pro RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth-/Connect-Challenge-Timeout        | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (Konfiguration/Env kann das gekoppelte Server-/Client-Budget erhöhen) |
| Anfänglicher Reconnect-Backoff            | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maximaler Reconnect-Backoff               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-Retry-Begrenzung nach Device-Token-Schließen | `250` ms                                      | `src/gateway/client.ts`                                                                    |
| Force-Stop-Schonfrist vor `terminate()`   | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Standard-Timeout von `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Standard-Tick-Intervall (vor `hello-ok`)  | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick-Timeout-Schließen                    | Code `4000`, wenn Stille `tickIntervalMs * 2` überschreitet | `src/gateway/client.ts`                                                               |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Der Server kündigt die effektiven Werte `policy.tickIntervalMs`, `policy.maxPayload`
und `policy.maxBufferedBytes` in `hello-ok` an; Clients sollten diese Werte
statt der Standardwerte vor dem Handshake beachten.

## Auth

- Die Gateway-Authentifizierung mit Shared Secret verwendet je nach konfiguriertem Auth-Modus `connect.params.auth.token` oder
  `connect.params.auth.password`.
- Modi mit Identitätsangabe wie Tailscale Serve
  (`gateway.auth.allowTailscale: true`) oder nicht über local loopback
  `gateway.auth.mode: "trusted-proxy"` erfüllen die Connect-Auth-Prüfung über
  Anfrage-Header statt über `connect.params.auth.*`.
- Private-Ingress `gateway.auth.mode: "none"` überspringt die Connect-Authentifizierung
  mit Shared Secret vollständig; stellen Sie diesen Modus nicht auf öffentlichem/nicht vertrauenswürdigem Ingress bereit.
- Nach dem Pairing gibt das Gateway ein **Geräte-Token** aus, das auf die Verbindungsrolle
  + Scopes begrenzt ist. Es wird in `hello-ok.auth.deviceToken` zurückgegeben und sollte
  vom Client für zukünftige Verbindungen gespeichert werden.
- Clients sollten das primäre `hello-ok.auth.deviceToken` nach jeder
  erfolgreichen Verbindung speichern.
- Beim erneuten Verbinden mit diesem **gespeicherten** Geräte-Token sollte auch die gespeicherte
  genehmigte Scope-Menge für dieses Token wiederverwendet werden. Dadurch bleibt bereits
  gewährter Lese-/Probe-/Statuszugriff erhalten, und erneute Verbindungen fallen nicht stillschweigend
  auf einen engeren impliziten Nur-Admin-Scope zurück.
- Clientseitiger Aufbau der Connect-Authentifizierung (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` ist unabhängig und wird immer weitergeleitet, wenn gesetzt.
  - `auth.token` wird in Prioritätsreihenfolge befüllt: zuerst explizites Shared Token,
    dann ein explizites `deviceToken`, dann ein gespeichertes gerätespezifisches Token (indiziert nach
    `deviceId` + `role`).
  - `auth.bootstrapToken` wird nur gesendet, wenn keines der obigen Felder ein
    `auth.token` ergeben hat. Ein Shared Token oder ein beliebiges aufgelöstes Geräte-Token unterdrückt es.
  - Die automatische Hochstufung eines gespeicherten Geräte-Tokens beim einmaligen
    `AUTH_TOKEN_MISMATCH`-Wiederholungsversuch ist auf **vertrauenswürdige Endpunkte** beschränkt —
    loopback oder `wss://` mit einem angehefteten `tlsFingerprint`. Öffentliches `wss://`
    ohne Pinning qualifiziert sich nicht.
- Der integrierte Setup-Code-Bootstrap gibt das primäre Node-
  `hello-ok.auth.deviceToken` plus ein begrenztes Operator-Token in
  `hello-ok.auth.deviceTokens` für die vertrauenswürdige mobile Übergabe zurück. Das Operator-Token
  enthält `operator.talk.secrets` für native Talk-Konfigurationslesevorgänge, schließt aber
  Scopes für Pairing-Mutationen und `operator.admin` aus.
- Während ein Nicht-Baseline-Setup-Code-Bootstrap auf Genehmigung wartet, enthalten `PAIRING_REQUIRED`-
  Details `recommendedNextStep: "wait_then_retry"`, `retryable: true`
  und `pauseReconnect: false`. Clients sollten sich mit demselben
  Bootstrap-Token weiter erneut verbinden, bis die Anfrage genehmigt wurde oder das Token ungültig wird.
- Speichern Sie `hello-ok.auth.deviceTokens` nur, wenn die Verbindung Bootstrap-Authentifizierung
  über einen vertrauenswürdigen Transport wie `wss://` oder loopback/lokales Pairing verwendet hat.
- Wenn ein Client ein **explizites** `deviceToken` oder explizite `scopes` liefert, bleibt diese
  vom Aufrufer angeforderte Scope-Menge maßgeblich; zwischengespeicherte Scopes werden nur
  wiederverwendet, wenn der Client das gespeicherte gerätespezifische Token erneut verwendet.
- Geräte-Token können über `device.token.rotate` und
  `device.token.revoke` rotiert/widerrufen werden (erfordert den Scope `operator.pairing`). Das Rotieren oder
  Widerrufen eines Node oder einer anderen Nicht-Operator-Rolle erfordert außerdem `operator.admin`.
- `device.token.rotate` gibt Rotationsmetadaten zurück. Es gibt das ersetzende
  Bearer-Token nur bei Aufrufen desselben Geräts zurück, die bereits mit
  diesem Geräte-Token authentifiziert sind, damit tokenbasierte Clients ihren Ersatz vor
  dem erneuten Verbinden speichern können. Shared-/Admin-Rotationen geben das Bearer-Token nicht zurück.
- Token-Ausstellung, -Rotation und -Widerruf bleiben auf die genehmigte Rollenmenge begrenzt,
  die im Pairing-Eintrag dieses Geräts aufgezeichnet ist; Token-Mutationen können keine
  Geräterolle erweitern oder als Ziel verwenden, die durch die Pairing-Genehmigung nie gewährt wurde.
- Bei Token-Sitzungen gekoppelter Geräte ist die Geräteverwaltung selbstbeschränkt, sofern der
  Aufrufer nicht auch `operator.admin` hat: Nicht-Admin-Aufrufer können nur das
  Operator-Token für ihren **eigenen** Geräteeintrag verwalten. Node- und andere Nicht-Operator-
  Tokenverwaltung ist nur für Admins möglich, selbst für das eigene Gerät des Aufrufers.
- `device.token.rotate` und `device.token.revoke` prüfen außerdem die Ziel-Operator-
  Token-Scope-Menge gegen die aktuellen Sitzungsscopes des Aufrufers. Nicht-Admin-Aufrufer
  können kein breiteres Operator-Token rotieren oder widerrufen, als sie selbst besitzen.
- Auth-Fehler enthalten `error.details.code` plus Wiederherstellungshinweise:
  - `error.details.canRetryWithDeviceToken` (boolesch)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Client-Verhalten für `AUTH_TOKEN_MISMATCH`:
  - Vertrauenswürdige Clients können einen begrenzten Wiederholungsversuch mit einem zwischengespeicherten gerätespezifischen Token versuchen.
  - Wenn dieser Wiederholungsversuch fehlschlägt, sollten Clients automatische Reconnect-Schleifen stoppen und Hinweise für Operator-Aktionen anzeigen.
- `AUTH_SCOPE_MISMATCH` bedeutet, dass das Geräte-Token erkannt wurde, aber die
  angeforderte Rolle/die angeforderten Scopes nicht abdeckt. Clients sollten dies nicht als fehlerhaftes Token darstellen;
  fordern Sie den Operator auf, das Pairing erneut durchzuführen oder den engeren/breiteren Scope-Vertrag zu genehmigen.

## Geräteidentität + Pairing

- Nodes sollten eine stabile Geräteidentität (`device.id`) enthalten, die aus einem
  Schlüsselpaar-Fingerabdruck abgeleitet ist.
- Gateways geben Tokens pro Gerät + Rolle aus.
- Pairing-Genehmigungen sind für neue Geräte-IDs erforderlich, sofern lokale automatische Genehmigung
  nicht aktiviert ist.
- Die automatische Pairing-Genehmigung ist auf direkte local loopback-Verbindungen ausgerichtet.
- OpenClaw verfügt außerdem über einen engen backend-/containerlokalen Selbstverbindungspfad für
  vertrauenswürdige Shared-Secret-Hilfsabläufe.
- Tailnet- oder LAN-Verbindungen vom selben Host werden für Pairing weiterhin als remote behandelt und
  erfordern Genehmigung.
- WS-Clients enthalten normalerweise während `connect` eine `device`-Identität (Operator +
  Node). Die einzigen gerätelosen Operator-Ausnahmen sind explizite Vertrauenspfade:
  - `gateway.controlUi.allowInsecureAuth=true` für localhost-only unsichere HTTP-Kompatibilität.
  - erfolgreiche Operator-Control-UI-Authentifizierung mit `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (Break-Glass, schwere Sicherheitsherabstufung).
  - Direct-loopback-`gateway-client`-Backend-RPCs auf dem reservierten internen
    Hilfspfad.
- Das Weglassen der Geräteidentität hat Auswirkungen auf Scopes. Wenn eine gerätelose Operator-
  Verbindung über einen expliziten Vertrauenspfad zugelassen wird, löscht OpenClaw dennoch
  selbst deklarierte Scopes zu einer leeren Menge, sofern dieser Pfad keine benannte
  Ausnahme zur Scope-Erhaltung hat. Scope-geschützte Methoden schlagen dann mit
  `missing scope` fehl.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` ist ein Control-UI-
  Break-Glass-Pfad zur Scope-Erhaltung. Er gewährt keinen beliebigen
  benutzerdefinierten Backend- oder CLI-förmigen WebSocket-Clients Scopes.
- Der reservierte direct-loopback-`gateway-client`-Backend-Hilfspfad erhält
  Scopes nur für interne lokale Control-Plane-RPCs; benutzerdefinierte Backend-IDs erhalten diese
  Ausnahme nicht.
- Alle Verbindungen müssen die vom Server bereitgestellte `connect.challenge`-Nonce signieren.

### Diagnose zur Geräte-Auth-Migration

Für Legacy-Clients, die noch das Signierverhalten vor Challenge verwenden, gibt `connect` jetzt
`DEVICE_AUTH_*`-Detailcodes unter `error.details.code` mit einem stabilen `error.details.reason` zurück.

Häufige Migrationsfehler:

| Nachricht                   | details.code                     | details.reason           | Bedeutung                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client hat `device.nonce` ausgelassen (oder leer gesendet). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client hat mit einer veralteten/falschen Nonce signiert. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signatur-Payload stimmt nicht mit v2-Payload überein. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Signierter Zeitstempel liegt außerhalb des zulässigen Skew. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` stimmt nicht mit dem Fingerabdruck des öffentlichen Schlüssels überein. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/Kanonisierung des öffentlichen Schlüssels fehlgeschlagen. |

Migrationsziel:

- Warten Sie immer auf `connect.challenge`.
- Signieren Sie den v2-Payload, der die Server-Nonce enthält.
- Senden Sie dieselbe Nonce in `connect.params.device.nonce`.
- Der bevorzugte Signatur-Payload ist `v3`, der zusätzlich zu Geräte-/Client-/Rollen-/Scopes-/Token-/Nonce-Feldern
  `platform` und `deviceFamily` bindet.
- Legacy-`v2`-Signaturen bleiben aus Kompatibilitätsgründen akzeptiert, aber das Metadaten-Pinning
  gekoppelter Geräte steuert weiterhin die Befehlsrichtlinie beim erneuten Verbinden.

## TLS + Pinning

- TLS wird für WS-Verbindungen unterstützt.
- Clients können optional den Gateway-Zertifikatsfingerabdruck anheften (siehe `gateway.tls`-
  Konfiguration plus `gateway.remote.tlsFingerprint` oder CLI `--tls-fingerprint`).

## Scope

Dieses Protokoll stellt die **vollständige Gateway-API** bereit (Status, Channels, Modelle, Chat,
Agent, Sitzungen, Nodes, Genehmigungen usw.). Die genaue Oberfläche wird durch die
TypeBox-Schemas in `packages/gateway-protocol/src/schema.ts` definiert.

## Verwandte Themen

- [Bridge-Protokoll](/de/gateway/bridge-protocol)
- [Gateway-Runbook](/de/gateway)
