---
read_when:
    - Implementieren oder Aktualisieren von Gateway-WS-Clients
    - Debuggen von Protokollabweichungen oder Verbindungsfehlern
    - Protokollschema/-modelle neu generieren
summary: 'Gateway-WebSocket-Protokoll: Handshake, Frames, Versionierung'
title: Gateway-Protokoll
x-i18n:
    generated_at: "2026-06-27T17:32:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df37fcb4f6a52ef3f6044840a4c1fb1a59bf1d2b880b9f3752490c6eb8a2135f
    source_path: gateway/protocol.md
    workflow: 16
---

Das Gateway-WS-Protokoll ist die **einzige Steuerungsebene + Node-Transport** für
OpenClaw. Alle Clients (CLI, Web-UI, macOS-App, iOS/Android-Nodes, Headless-
Nodes) verbinden sich per WebSocket und deklarieren ihre **Rolle** + ihren
**Scope** beim Handshake.

## Transport

- WebSocket, Text-Frames mit JSON-Payloads.
- Der erste Frame **muss** eine `connect`-Anfrage sein.
- Pre-Connect-Frames sind auf 64 KiB begrenzt. Nach einem erfolgreichen Handshake sollten Clients
  die Grenzwerte `hello-ok.policy.maxPayload` und
  `hello-ok.policy.maxBufferedBytes` einhalten. Bei aktivierter Diagnose
  erzeugen zu große eingehende Frames und langsame ausgehende Puffer `payload.large`-Ereignisse,
  bevor das Gateway den betroffenen Frame schließt oder verwirft. Diese Ereignisse speichern
  Größen, Grenzwerte, Oberflächen und sichere Reason-Codes. Sie speichern nicht den Nachrichtentext,
  Anhangsinhalte, den rohen Frame-Body, Token, Cookies oder geheime Werte.

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

Während das Gateway den Start von Sidecars noch abschließt, kann die `connect`-Anfrage
einen wiederholbaren `UNAVAILABLE`-Fehler zurückgeben, bei dem `details.reason` auf
`"startup-sidecars"` und `retryAfterMs` gesetzt ist. Clients sollten diese Antwort
innerhalb ihres gesamten Verbindungsbudgets erneut versuchen, anstatt sie als terminalen
Handshake-Fehler anzuzeigen.

`server`, `features`, `snapshot` und `policy` sind alle durch das Schema
(`packages/gateway-protocol/src/schema/frames.ts`) erforderlich. `auth` ist ebenfalls erforderlich und meldet
die ausgehandelte Rolle und die Scopes. `pluginSurfaceUrls` ist optional und ordnet Plugin-
Oberflächennamen, etwa `canvas`, scoped gehosteten URLs zu.

Scoped Plugin-Oberflächen-URLs können ablaufen. Nodes können
`node.pluginSurface.refresh` mit `{ "surface": "canvas" }` aufrufen, um einen frischen
Eintrag in `pluginSurfaceUrls` zu erhalten. Das experimentelle Canvas-Plugin-Refactoring unterstützt den
veralteten Kompatibilitätspfad `canvasHostUrl`, `canvasCapability` oder
`node.canvas.capability.refresh` nicht; aktuelle native Clients und
Gateways müssen Plugin-Oberflächen verwenden.

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
`client.mode: "backend"`) dürfen `device` bei direkten Loopback-Verbindungen auslassen, wenn
sie sich mit dem gemeinsamen Gateway-Token/Passwort authentifizieren. Dieser Pfad ist
internen Control-Plane-RPCs vorbehalten und verhindert, dass veraltete CLI-/Geräte-Pairing-Baselines
lokale Backend-Arbeit wie Subagent-Sitzungsaktualisierungen blockieren. Remote-Clients,
Browser-Origin-Clients, Node-Clients und explizite Geräte-Token-/Geräteidentitäts-
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

Der integrierte QR-/Setup-Code-Bootstrap ist ein frischer Übergabepfad für Mobilgeräte. Eine erfolgreiche
Baseline-Setup-Code-`connect`-Anfrage gibt ein primäres Node-Token plus ein begrenztes
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

Die Operator-Übergabe ist absichtlich begrenzt, damit das QR-Onboarding die
mobile Operator-Schleife starten kann, ohne `operator.admin` oder `operator.pairing` zu gewähren.
Sie enthält `operator.talk.secrets`, damit der native Client die Talk-
Konfiguration lesen kann, die er nach dem Bootstrap benötigt. Breitere Admin- und Pairing-Scopes erfordern
ein separates genehmigtes Operator-Pairing oder einen separaten Token-Flow. Clients sollten
`hello-ok.auth.deviceTokens` nur dann dauerhaft speichern,
wenn `connect` Bootstrap-Auth über einen vertrauenswürdigen Transport wie `wss://` oder
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

Methoden mit Seiteneffekten erfordern **Idempotenzschlüssel** (siehe Schema).

## Rollen + Scopes

Das vollständige Operator-Scope-Modell, Prüfungen zum Genehmigungszeitpunkt und
Shared-Secret-Semantik finden Sie unter [Operator-Scopes](/de/gateway/operator-scopes).

### Rollen

- `operator` = Steuerungsebenen-Client (CLI/UI/Automatisierung).
- `node` = Capability-Host (Kamera/Bildschirm/Canvas/system.run).

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

Der Methoden-Scope ist nur die erste Schranke. Einige Slash-Befehle, die über
`chat.send` erreicht werden, wenden zusätzlich strengere Prüfungen auf Befehlsebene an. Zum Beispiel erfordern persistente
`/config set`- und `/config unset`-Schreibvorgänge `operator.admin`.

`node.pair.approve` hat zusätzlich zum
Basis-Methoden-Scope eine zusätzliche Scope-Prüfung zum Genehmigungszeitpunkt:

- Anfragen ohne Befehle: `operator.pairing`
- Anfragen mit Nicht-Exec-Node-Befehlen: `operator.pairing` + `operator.write`
- Anfragen, die `system.run`, `system.run.prepare` oder `system.which` enthalten:
  `operator.pairing` + `operator.admin`

### Caps/Befehle/Berechtigungen (Node)

Nodes deklarieren Capability-Ansprüche beim Verbindungsaufbau:

- `caps`: übergeordnete Capability-Kategorien wie `camera`, `canvas`, `screen`,
  `location`, `voice` und `talk`.
- `commands`: Befehls-Allowlist für invoke.
- `permissions`: granulare Umschalter (z. B. `screen.record`, `camera.capture`).

Das Gateway behandelt diese als **Ansprüche** und erzwingt serverseitige Allowlists.

## Präsenz

- `system-presence` gibt Einträge zurück, die nach Geräteidentität keyed sind.
- Präsenzeinträge enthalten `deviceId`, `roles` und `scopes`, damit UIs eine einzelne Zeile pro Gerät anzeigen können,
  selbst wenn es sowohl als **Operator** als auch als **Node** verbunden ist.
- `node.list` enthält optionale Felder `lastSeenAtMs` und `lastSeenReason`. Verbundene Nodes melden
  ihre aktuelle Verbindungszeit als `lastSeenAtMs` mit dem Grund `connect`; gekoppelte Nodes können außerdem
  dauerhafte Hintergrundpräsenz melden, wenn ein vertrauenswürdiges Node-Ereignis ihre Pairing-Metadaten aktualisiert.

### Hintergrund-Alive-Ereignis für Nodes

Nodes können `node.event` mit `event: "node.presence.alive"` aufrufen, um festzuhalten, dass ein gekoppelter Node
während eines Hintergrund-Wakeups aktiv war, ohne ihn als verbunden zu markieren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` ist ein geschlossenes Enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` oder `connect`. Unbekannte Trigger-Strings werden vom
Gateway vor der Persistierung zu `background` normalisiert. Das Ereignis ist nur für authentifizierte Node-
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
bestätigten RPC behandeln, nicht als dauerhafte Präsenzpersistierung.

## Scope-Begrenzung von Broadcast-Ereignissen

Vom Server gepushte WebSocket-Broadcast-Ereignisse werden per Scope begrenzt, sodass Sitzungen mit Pairing-Scope oder reine Node-Sitzungen Sitzungsinhalte nicht passiv empfangen.

- **Chat-, Agent- und Tool-Ergebnis-Frames** (einschließlich gestreamter `agent`-Ereignisse und Tool-Call-Ergebnisse) erfordern mindestens `operator.read`. Sitzungen ohne `operator.read` überspringen diese Frames vollständig.
- **Plugin-definierte `plugin.*`-Broadcasts** werden je nach Registrierung durch das Plugin auf `operator.write` oder `operator.admin` begrenzt.
- **Status- und Transportereignisse** (`heartbeat`, `presence`, `tick`, Connect-/Disconnect-Lebenszyklus usw.) bleiben uneingeschränkt, damit die Transportintegrität für jede authentifizierte Sitzung beobachtbar bleibt.
- **Unbekannte Broadcast-Ereignisfamilien** werden standardmäßig per Scope begrenzt (fail-closed), sofern ein registrierter Handler sie nicht ausdrücklich lockert.

Jede Client-Verbindung verwaltet ihre eigene Sequenznummer pro Client, sodass Broadcasts auf diesem Socket eine monotone Reihenfolge beibehalten, selbst wenn verschiedene Clients unterschiedliche, nach Scope gefilterte Teilmengen des Ereignisstroms sehen.

## Häufige RPC-Methodenfamilien

Die öffentliche WS-Oberfläche ist breiter als die obigen Handshake-/Auth-Beispiele. Dies
ist kein generierter Dump — `hello-ok.features.methods` ist eine konservative
Discovery-Liste, die aus `src/gateway/server-methods-list.ts` plus geladenen
Plugin-/Channel-Methodenexporten aufgebaut wird. Behandeln Sie sie als Feature-Discovery, nicht als vollständige
Aufzählung von `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="System und Identität">
    - `health` gibt den zwischengespeicherten oder frisch abgefragten Gateway-Zustandssnapshot zurück.
    - `diagnostics.stability` gibt den aktuellen begrenzten Diagnose-Stabilitätsrekorder zurück. Er speichert Betriebsmetadaten wie Ereignisnamen, Zählwerte, Bytegrößen, Speicherwerte, Warteschlangen-/Sitzungsstatus, Channel-/Plugin-Namen und Sitzungs-IDs. Er speichert keine Chat-Texte, Webhook-Bodys, Tool-Ausgaben, Rohdaten von Anfrage- oder Antwort-Bodys, Tokens, Cookies oder geheime Werte. Operator-Leseberechtigung ist erforderlich.
    - `status` gibt die Gateway-Zusammenfassung im Stil von `/status` zurück; sensible Felder werden nur für Operator-Clients mit Admin-Berechtigungsumfang eingeschlossen.
    - `gateway.identity.get` gibt die Gateway-Geräteidentität zurück, die von Relay- und Pairing-Flows verwendet wird.
    - `system-presence` gibt den aktuellen Präsenz-Snapshot für verbundene Operator-/Node-Geräte zurück.
    - `system-event` hängt ein Systemereignis an und kann den Präsenzkontext aktualisieren/übertragen.
    - `last-heartbeat` gibt das zuletzt persistierte Heartbeat-Ereignis zurück.
    - `set-heartbeats` schaltet die Heartbeat-Verarbeitung auf dem Gateway um.

  </Accordion>

  <Accordion title="Modelle und Nutzung">
    - `models.list` gibt den zur Laufzeit erlaubten Modellkatalog zurück. Übergeben Sie `{ "view": "configured" }` für auswahlgeeignete konfigurierte Modelle (`agents.defaults.models` zuerst, dann `models.providers.*.models`) oder `{ "view": "all" }` für den vollständigen Katalog.
    - `usage.status` gibt Provider-Nutzungsfenster und Zusammenfassungen verbleibender Kontingente zurück.
    - `usage.cost` gibt aggregierte Kostennutzungszusammenfassungen für einen Datumsbereich zurück.
      Übergeben Sie `agentId` für einen Agenten oder `agentScope: "all"`, um konfigurierte Agenten zu aggregieren.
    - `doctor.memory.status` gibt die Bereitschaft von Vektorspeicher / zwischengespeicherten Embeddings für den aktiven Standard-Agent-Arbeitsbereich zurück. Übergeben Sie `{ "probe": true }` oder `{ "deep": true }` nur, wenn der Aufrufer explizit einen Live-Ping an den Embedding-Provider wünscht. Dreaming-fähige Clients können außerdem `{ "agentId": "agent-id" }` übergeben, um Dreaming-Store-Statistiken auf einen ausgewählten Agent-Arbeitsbereich zu begrenzen; ohne `agentId` bleibt der Fallback auf den Standard-Agenten erhalten und konfigurierte Dreaming-Arbeitsbereiche werden aggregiert.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` und `doctor.memory.dedupeDreamDiary` akzeptieren optionale `{ "agentId": "agent-id" }`-Parameter für Dreaming-Ansichten/-Aktionen ausgewählter Agenten. Wenn `agentId` ausgelassen wird, arbeiten sie auf dem konfigurierten Standard-Agent-Arbeitsbereich.
    - `doctor.memory.remHarness` gibt eine begrenzte, schreibgeschützte REM-Harness-Vorschau für Remote-Control-Plane-Clients zurück. Sie kann Arbeitsbereichspfade, Speicher-Snippets, gerendertes geerdetes Markdown und Deep-Promotion-Kandidaten enthalten, daher benötigen Aufrufer `operator.read`.
    - `sessions.usage` gibt Nutzungszusammenfassungen pro Sitzung zurück. Übergeben Sie `agentId` für einen
      Agenten oder `agentScope: "all"`, um konfigurierte Agenten gemeinsam aufzulisten.
    - `sessions.usage.timeseries` gibt Zeitreihen-Nutzung für eine Sitzung zurück.
    - `sessions.usage.logs` gibt Nutzungseinträge aus dem Protokoll für eine Sitzung zurück.

  </Accordion>

  <Accordion title="Channels und Anmeldehilfen">
    - `channels.status` gibt Statuszusammenfassungen für integrierte und gebündelte Channel/Plugin zurück.
    - `channels.logout` meldet einen bestimmten Channel/Account ab, sofern der Channel Abmeldung unterstützt.
    - `web.login.start` startet einen QR-/Web-Anmeldeflow für den aktuellen QR-fähigen Web-Channel-Provider.
    - `web.login.wait` wartet, bis dieser QR-/Web-Anmeldeflow abgeschlossen ist, und startet bei Erfolg den Channel.
    - `push.test` sendet einen Test-APNs-Push an einen registrierten iOS-Node.
    - `voicewake.get` gibt die gespeicherten Wake-Word-Trigger zurück.
    - `voicewake.set` aktualisiert Wake-Word-Trigger und überträgt die Änderung.

  </Accordion>

  <Accordion title="Messaging und Protokolle">
    - `send` ist der direkte RPC für ausgehende Zustellung bei Channel-/Account-/Thread-zielgerichteten Sends außerhalb des Chat-Runners.
    - `logs.tail` gibt das konfigurierte Dateiprotokoll-Tail des Gateway mit Cursor-/Limit- und Max-Byte-Steuerung zurück.

  </Accordion>

  <Accordion title="Talk und TTS">
    - `talk.catalog` gibt den schreibgeschützten Talk-Provider-Katalog für Sprache, Streaming-Transkription und Echtzeitstimme zurück. Er enthält Provider-IDs, Labels, Konfigurationsstatus, offengelegte Modell-/Stimmen-IDs, kanonische Modi, Transports, Brain-Strategien und Echtzeit-Audio-/Capability-Flags, ohne Provider-Geheimnisse zurückzugeben oder die globale Konfiguration zu ändern.
    - `talk.config` gibt die effektive Talk-Konfigurationspayload zurück; `includeSecrets` erfordert `operator.talk.secrets` (oder `operator.admin`).
    - `talk.session.create` erstellt eine Gateway-eigene Talk-Sitzung für `realtime/gateway-relay`, `transcription/gateway-relay` oder `stt-tts/managed-room`. Für `stt-tts/managed-room` müssen `operator.write`-Aufrufer, die `sessionKey` übergeben, auch `spawnedBy` für bereichsgebundene Session-Key-Sichtbarkeit übergeben; unbereichsgebundene `sessionKey`-Erstellung und `brain: "direct-tools"` erfordern `operator.admin`.
    - `talk.session.join` validiert ein Managed-Room-Sitzungstoken, sendet bei Bedarf `session.ready`- oder `session.replaced`-Ereignisse und gibt Raum-/Sitzungsmetadaten sowie aktuelle Talk-Ereignisse ohne Klartext-Token oder gespeicherten Token-Hash zurück.
    - `talk.session.appendAudio` hängt Base64-PCM-Eingabeaudio an Gateway-eigene Echtzeit-Relay- und Transkriptionssitzungen an.
    - `talk.session.startTurn`, `talk.session.endTurn` und `talk.session.cancelTurn` steuern den Turn-Lebenszyklus von Managed-Rooms mit Ablehnung veralteter Turns, bevor der Status gelöscht wird.
    - `talk.session.cancelOutput` stoppt die Audioausgabe des Assistenten, primär für VAD-gesteuertes Barge-in in Gateway-Relay-Sitzungen.
    - `talk.session.submitToolResult` schließt einen Provider-Toolaufruf ab, der von einer Gateway-eigenen Echtzeit-Relay-Sitzung ausgegeben wurde. Übergeben Sie `options: { willContinue: true }` für vorläufige Tool-Ausgaben, wenn ein finales Ergebnis folgt, oder `options: { suppressResponse: true }`, wenn das Tool-Ergebnis den Provider-Aufruf erfüllen soll, ohne eine weitere Echtzeit-Assistentenantwort zu starten.
    - `talk.session.steer` sendet Sprachsteuerung für einen aktiven Run in eine Gateway-eigene agentengestützte Talk-Sitzung. Es akzeptiert `{ sessionId, text, mode? }`, wobei `mode` `status`, `steer`, `cancel` oder `followup` ist; ein ausgelassener Modus wird aus dem gesprochenen Text klassifiziert.
    - `talk.session.close` schließt eine Gateway-eigene Relay-, Transkriptions- oder Managed-Room-Sitzung und sendet terminale Talk-Ereignisse.
    - `talk.mode` setzt/überträgt den aktuellen Talk-Modusstatus für WebChat-/Control-UI-Clients.
    - `talk.client.create` erstellt eine client-eigene Echtzeit-Provider-Sitzung mit `webrtc` oder `provider-websocket`, während das Gateway Konfiguration, Zugangsdaten, Anweisungen und Tool-Policy besitzt.
    - `talk.client.toolCall` erlaubt client-eigenen Echtzeit-Transports, Provider-Toolaufrufe an die Gateway-Policy weiterzuleiten. Das erste unterstützte Tool ist `openclaw_agent_consult`; Clients erhalten eine Run-ID und warten auf normale Chat-Lebenszyklusereignisse, bevor sie das providerspezifische Tool-Ergebnis übermitteln.
    - `talk.client.steer` sendet Sprachsteuerung für einen aktiven Run bei client-eigenen Echtzeit-Transports. Das Gateway löst den aktiven eingebetteten Run aus `sessionKey` auf und gibt ein strukturiertes akzeptiert/abgelehnt-Ergebnis zurück, statt Steering stillschweigend zu verwerfen.
    - `talk.event` ist der einzelne Talk-Ereigniskanal für Echtzeit-, Transkriptions-, STT/TTS-, Managed-Room-, Telefonie- und Meeting-Adapter.
    - `talk.speak` synthetisiert Sprache über den aktiven Talk-Sprach-Provider.
    - `tts.status` gibt den aktivierten TTS-Status, den aktiven Provider, Fallback-Provider und den Provider-Konfigurationsstatus zurück.
    - `tts.providers` gibt das sichtbare TTS-Provider-Inventar zurück.
    - `tts.enable` und `tts.disable` schalten den TTS-Präferenzstatus um.
    - `tts.setProvider` aktualisiert den bevorzugten TTS-Provider.
    - `tts.convert` führt eine einmalige Text-zu-Sprache-Konvertierung aus.

  </Accordion>

  <Accordion title="Secrets, Konfiguration, Update und Assistent">
    - `secrets.reload` löst aktive SecretRefs erneut auf und tauscht den Laufzeit-Geheimnisstatus nur bei vollständigem Erfolg aus.
    - `secrets.resolve` löst befehlszielbezogene Geheimniszuweisungen für einen bestimmten Befehls-/Zielsatz auf.
    - `config.get` gibt den aktuellen Konfigurations-Snapshot und Hash zurück.
    - `config.set` schreibt eine validierte Konfigurationspayload.
    - `config.patch` führt eine partielle Konfigurationsaktualisierung zusammen. Destruktiver Array-
      Ersatz erfordert den betroffenen Pfad in `replacePaths`; verschachtelte Arrays
      unter Array-Einträgen verwenden `[]`-Pfade wie `agents.list[].skills`.
    - `config.apply` validiert und ersetzt die vollständige Konfigurationspayload.
    - `config.schema` gibt die Live-Konfigurationsschema-Payload zurück, die von Control UI und CLI-Tools verwendet wird: Schema, `uiHints`, Version und Generierungsmetadaten, einschließlich Plugin- und Channel-Schemametadaten, wenn die Laufzeit sie laden kann. Das Schema enthält Feldmetadaten `title` / `description`, die aus denselben Labels und Hilfetexten abgeleitet sind, die von der UI verwendet werden, einschließlich verschachtelter Objekt-, Wildcard-, Array-Item- und `anyOf` / `oneOf` / `allOf`-Kompositionszweige, wenn passende Felddokumentation existiert.
    - `config.schema.lookup` gibt eine pfadbezogene Lookup-Payload für einen Konfigurationspfad zurück: normalisierter Pfad, ein flacher Schemaknoten, passender Hinweis + `hintPath`, optionales `reloadKind` und unmittelbare Kindzusammenfassungen für UI-/CLI-Drilldown. `reloadKind` ist eines von `restart`, `hot` oder `none` und spiegelt den Gateway-Konfigurations-Reload-Planer für den angeforderten Pfad wider. Lookup-Schemaknoten behalten die benutzerseitige Dokumentation und übliche Validierungsfelder (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerische/String-/Array-/Objektgrenzen sowie Flags wie `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) bei. Kindzusammenfassungen legen `key`, normalisierten `path`, `type`, `required`, `hasChildren`, optionales `reloadKind` sowie den passenden `hint` / `hintPath` offen.
    - `update.run` führt den Gateway-Update-Flow aus und plant einen Neustart nur, wenn das Update selbst erfolgreich war; Aufrufer mit einer Sitzung können `continuationMessage` einschließen, damit der Start einen Folge-Agenten-Turn über die Neustart-Fortsetzungswarteschlange fortsetzt. Paketmanager-Updates und überwachte Git-Checkout-Updates aus der Control Plane verwenden eine abgekoppelte Managed-Service-Übergabe, statt den Paketbaum zu ersetzen oder Checkout-/Build-Ausgaben im laufenden Gateway zu ändern. Eine gestartete Übergabe gibt `ok: true` mit `result.reason: "managed-service-handoff-started"` und `handoff.status: "started"` zurück; nicht verfügbare oder fehlgeschlagene Übergaben geben `ok: false` mit `managed-service-handoff-unavailable` oder `managed-service-handoff-failed` zurück, plus `handoff.command`, wenn ein manuelles Shell-Update erforderlich ist. Eine nicht verfügbare Übergabe bedeutet, dass OpenClaw keine sichere Supervisor-Grenze oder dauerhafte Dienstidentität hat, beispielsweise `OPENCLAW_SYSTEMD_UNIT` für systemd. Während einer gestarteten Übergabe kann der Neustart-Sentinel kurz `stats.reason: "restart-health-pending"` melden; die Fortsetzung wird verzögert, bis die CLI das neu gestartete Gateway verifiziert und den finalen `ok`-Sentinel schreibt.
    - `update.status` aktualisiert den neuesten Update-Neustart-Sentinel und gibt ihn zurück, einschließlich der nach dem Neustart laufenden Version, sofern verfügbar.
    - `wizard.start`, `wizard.next`, `wizard.status` und `wizard.cancel` stellen den Onboarding-Assistenten über WS RPC bereit.

  </Accordion>

  <Accordion title="Agent- und Arbeitsbereich-Helfer">
    - `agents.list` gibt konfigurierte Agent-Einträge zurück, einschließlich des effektiven Modells und der Runtime-Metadaten.
    - `agents.create`, `agents.update` und `agents.delete` verwalten Agent-Datensätze und die Arbeitsbereich-Verdrahtung.
    - `agents.files.list`, `agents.files.get` und `agents.files.set` verwalten die Bootstrap-Arbeitsbereichsdateien, die für einen Agent offengelegt werden.
    - `tasks.list`, `tasks.get` und `tasks.cancel` stellen das Gateway-Aufgaben-Ledger für SDK- und Operator-Clients bereit.
    - `artifacts.list`, `artifacts.get` und `artifacts.download` stellen aus Transkripten abgeleitete Artefaktzusammenfassungen und Downloads für einen expliziten `sessionKey`-, `runId`- oder `taskId`-Scope bereit. Run- und Task-Abfragen lösen die zugehörige Sitzung serverseitig auf und geben nur Transkriptmedien mit passender Provenienz zurück; unsichere oder lokale URL-Quellen geben nicht unterstützte Downloads zurück, statt serverseitig abzurufen.
    - `environments.list` und `environments.status` stellen schreibgeschützte Gateway-lokale und Node-Umgebungserkennung für SDK-Clients bereit.
    - `agent.identity.get` gibt die effektive Assistant-Identität für einen Agent oder eine Sitzung zurück.
    - `agent.wait` wartet, bis ein Run beendet ist, und gibt, falls verfügbar, den terminalen Snapshot zurück.

  </Accordion>

  <Accordion title="Sitzungssteuerung">
    - `sessions.list` gibt den aktuellen Sitzungsindex zurück, einschließlich `agentRuntime`-Metadaten pro Zeile, wenn ein Agent-Runtime-Backend konfiguriert ist.
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
    - Die Chat-Ausführung verwendet weiterhin `chat.history`, `chat.send`, `chat.abort` und `chat.inject`. `chat.history` ist für UI-Clients anzeigennormalisiert: Inline-Direktiv-Tags werden aus sichtbarem Text entfernt, Klartext-Tool-Call-XML-Payloads (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke) sowie durchgesickerte ASCII-/Vollbreiten-Modellsteuerungstoken werden entfernt, reine Silent-Token-Assistant-Zeilen wie exakte `NO_REPLY` / `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden.
    - `chat.message.get` ist der additive begrenzte Vollnachrichten-Reader für einen einzelnen sichtbaren Transkripteintrag. Clients übergeben `sessionKey`, optional `agentId`, wenn die Sitzungsauswahl agentbezogen ist, plus eine Transkript-`messageId`, die zuvor über `chat.history` angezeigt wurde, und das Gateway gibt dieselbe anzeigennormalisierte Projektion ohne die leichte Verlaufskappung zurück, wenn der gespeicherte Eintrag noch verfügbar und nicht übergroß ist.
    - `chat.send` akzeptiert einmalig `fastMode: "auto"`, um den schnellen Modus für Modellaufrufe zu verwenden, die vor dem Auto-Cutoff gestartet werden, und spätere Wiederholungs-, Fallback-, Tool-Ergebnis- oder Fortsetzungsaufrufe ohne schnellen Modus zu starten. Der Cutoff ist standardmäßig 60 Sekunden und kann pro Modell mit `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` konfiguriert werden. Ein `chat.send`-Aufrufer kann einmalig `fastAutoOnSeconds` übergeben, um den Cutoff für diese Anfrage zu überschreiben.

  </Accordion>

  <Accordion title="Gerätekopplung und Gerätetoken">
    - `device.pair.list` gibt ausstehende und genehmigte gekoppelte Geräte zurück.
    - `device.pair.approve`, `device.pair.reject` und `device.pair.remove` verwalten Gerätekopplungs-Datensätze.
    - `device.token.rotate` rotiert ein gekoppeltes Gerätetoken innerhalb seiner genehmigten Rollen- und Aufrufer-Scope-Grenzen.
    - `device.token.revoke` widerruft ein gekoppeltes Gerätetoken innerhalb seiner genehmigten Rollen- und Aufrufer-Scope-Grenzen.

  </Accordion>

  <Accordion title="Node-Kopplung, Invoke und ausstehende Arbeit">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` und `node.pair.verify` decken Node-Kopplung und Bootstrap-Verifizierung ab.
    - `node.list` und `node.describe` geben den bekannten/verbundenen Node-Status zurück.
    - `node.rename` aktualisiert ein gekoppeltes Node-Label.
    - `node.invoke` leitet einen Befehl an einen verbundenen Node weiter.
    - `node.invoke.result` gibt das Ergebnis für eine Invoke-Anfrage zurück.
    - `node.event` überträgt von Nodes stammende Ereignisse zurück in das Gateway.
    - `node.pending.pull` und `node.pending.ack` sind die Warteschlangen-APIs für verbundene Nodes.
    - `node.pending.enqueue` und `node.pending.drain` verwalten dauerhaft ausstehende Arbeit für Offline-/getrennte Nodes.

  </Accordion>

  <Accordion title="Genehmigungsfamilien">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` und `exec.approval.resolve` decken einmalige Exec-Genehmigungsanfragen plus Suche/Wiedergabe ausstehender Genehmigungen ab.
    - `exec.approval.waitDecision` wartet auf eine ausstehende Exec-Genehmigung und gibt die endgültige Entscheidung zurück (oder `null` bei Timeout).
    - `exec.approvals.get` und `exec.approvals.set` verwalten Gateway-Snapshots der Exec-Genehmigungsrichtlinie.
    - `exec.approvals.node.get` und `exec.approvals.node.set` verwalten die Node-lokale Exec-Genehmigungsrichtlinie über Node-Relay-Befehle.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` und `plugin.approval.resolve` decken Plugin-definierte Genehmigungsabläufe ab.

  </Accordion>

  <Accordion title="Automatisierung, Skills und Werkzeuge">
    - Automatisierung: `wake` plant eine sofortige oder nächste-Heartbeat-Wake-Texteinfügung; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` verwalten geplante Arbeit.
    - `cron.run` bleibt ein Enqueue-artiger RPC für manuelle Runs. Clients, die Abschlusssemantik benötigen, sollten die zurückgegebene `runId` lesen und `cron.runs` pollen.
    - `cron.runs` akzeptiert einen optionalen nicht leeren `runId`-Filter, sodass Clients einem in die Warteschlange gestellten manuellen Run folgen können, ohne mit anderen Verlaufseinträgen für denselben Job zu konkurrieren.
    - Skills und Werkzeuge: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Häufige Ereignisfamilien

- `chat`: UI-Chat-Aktualisierungen wie `chat.inject` und andere rein transkriptbezogene Chat-
  Ereignisse. In Protokoll v4 enthalten Delta-Payloads `deltaText`; `message` bleibt
  der kumulative Assistant-Snapshot. Nicht-Präfix-Ersetzungen setzen `replace=true`
  und verwenden `deltaText` als Ersetzungstext.
- `session.message`, `session.operation` und `session.tool`: Transkript-,
  laufende Sitzungsoperation- und Ereignisstream-Aktualisierungen für eine abonnierte
  Sitzung.
- `sessions.changed`: Sitzungsindex oder Metadaten geändert.
- `presence`: Aktualisierungen des Systempräsenz-Snapshots.
- `tick`: periodisches Keepalive-/Liveness-Ereignis.
- `health`: Aktualisierung des Gateway-Zustands-Snapshots.
- `heartbeat`: Aktualisierung des Heartbeat-Ereignisstreams.
- `cron`: Cron-Run-/Job-Änderungsereignis.
- `shutdown`: Gateway-Shutdown-Benachrichtigung.
- `node.pair.requested` / `node.pair.resolved`: Node-Kopplungslebenszyklus.
- `node.invoke.request`: Broadcast einer Node-Invoke-Anfrage.
- `device.pair.requested` / `device.pair.resolved`: Lebenszyklus gekoppelter Geräte.
- `voicewake.changed`: Wake-Word-Trigger-Konfiguration geändert.
- `exec.approval.requested` / `exec.approval.resolved`: Exec-Genehmigungs-
  lebenszyklus.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin-Genehmigungs-
  lebenszyklus.

### Node-Hilfsmethoden

- Nodes können `skills.bins` aufrufen, um die aktuelle Liste der ausführbaren Skill-Dateien
  für Auto-Allow-Prüfungen abzurufen.

### Task-Ledger-RPCs

Operator-Clients können Gateway-Hintergrundaufgabendatensätze über
die Task-Ledger-RPCs prüfen und abbrechen. Diese Methoden geben bereinigte Aufgabenzusammenfassungen zurück, nicht den rohen
Runtime-Status.

- `tasks.list` erfordert `operator.read`.
  - Parameter: optional `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` oder `"timed_out"`) oder ein Array dieser Statuswerte,
    optional `agentId`, optional `sessionKey`, optional `limit` von `1` bis
    `500` und optionaler String `cursor`.
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
    meldet, ob die Runtime den Abbruch akzeptiert oder aufgezeichnet hat.

`TaskSummary` enthält `id`, `status` und optionale Metadaten wie `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, Zeitstempel, Fortschritt,
terminale Zusammenfassung und bereinigten Fehlertext. `agentId` identifiziert den Agent,
der die Aufgabe ausführt; `sessionKey` und `ownerKey` bewahren Anforderer- und Steuerungs-
kontext.

### Operator-Hilfsmethoden

- Operatoren können `commands.list` (`operator.read`) aufrufen, um das Runtime-
  Befehlsinventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agent-Workspace zu lesen.
  - `scope` steuert, auf welche Oberfläche der primäre `name` abzielt:
    - `text` gibt das primäre Textbefehlstoken ohne führendes `/` zurück
    - `native` und der standardmäßige `both`-Pfad geben Provider-bewusste native Namen
      zurück, sofern verfügbar
  - `textAliases` enthält exakte Slash-Aliase wie `/model` und `/m`.
  - `nativeName` enthält den Provider-bewussten nativen Befehlsnamen, sofern vorhanden.
  - `provider` ist optional und wirkt sich nur auf native Benennung sowie die
    Verfügbarkeit nativer Plugin-Befehle aus.
  - `includeArgs=false` lässt serialisierte Argumentmetadaten in der Antwort weg.
- Operatoren können `tools.catalog` (`operator.read`) aufrufen, um den Runtime-Toolkatalog für einen
  Agenten abzurufen. Die Antwort enthält gruppierte Tools und Provenienzmetadaten:
  - `source`: `core` oder `plugin`
  - `pluginId`: Plugin-Besitzer, wenn `source="plugin"`
  - `optional`: ob ein Plugin-Tool optional ist
- Operatoren können `tools.effective` (`operator.read`) aufrufen, um das zur Runtime wirksame Tool-
  Inventar für eine Sitzung abzurufen.
  - `sessionKey` ist erforderlich.
  - Das Gateway leitet vertrauenswürdigen Runtime-Kontext serverseitig aus der Sitzung ab, statt
    vom Aufrufer bereitgestellten Auth- oder Zustellungskontext zu akzeptieren.
  - Die Antwort ist eine sitzungsbezogene, serverseitig abgeleitete Projektion des aktiven Inventars,
    einschließlich Core-, Plugin-, Kanal- und bereits entdeckter MCP-Server-Tools.
  - `tools.effective` ist für MCP schreibgeschützt: Es kann einen warmen MCP-Katalog einer Sitzung durch die
    endgültige Tool-Richtlinie projizieren, erstellt aber keine MCP-Runtimes, verbindet keine Transporte und gibt kein
    `tools/list` aus. Wenn kein passender warmer Katalog vorhanden ist, kann die Antwort einen Hinweis wie
    `mcp-not-yet-connected`, `mcp-not-yet-listed` oder `mcp-stale-catalog` enthalten.
  - Effektive Tool-Einträge verwenden `source="core"`, `source="plugin"`, `source="channel"` oder
    `source="mcp"`.
- Operatoren können `tools.invoke` (`operator.write`) aufrufen, um ein verfügbares Tool über denselben
  Gateway-Richtlinienpfad wie `/tools/invoke` aufzurufen.
  - `name` ist erforderlich. `args`, `sessionKey`, `agentId`, `confirm` und
    `idempotencyKey` sind optional.
  - Wenn sowohl `sessionKey` als auch `agentId` vorhanden sind, muss der aufgelöste Sitzungs-Agent
    mit `agentId` übereinstimmen.
  - Owner-only-Core-Wrapper wie `cron`, `gateway` und `nodes` erfordern
    Besitzer-/Admin-Identität (`operator.admin`), obwohl die Methode `tools.invoke`
    selbst `operator.write` ist.
  - Die Antwort ist ein SDK-orientierter Umschlag mit `ok`, `toolName`, optionalem `output` und typisierten
    `error`-Feldern. Genehmigungs- oder Richtlinienablehnungen geben `ok:false` in der Nutzlast zurück, statt
    die Gateway-Tool-Richtlinienpipeline zu umgehen.
- Operatoren können `skills.status` (`operator.read`) aufrufen, um das sichtbare
  Skill-Inventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agent-Workspace zu lesen.
  - Die Antwort enthält Berechtigung, fehlende Anforderungen, Konfigurationsprüfungen und
    bereinigte Installationsoptionen, ohne rohe geheime Werte offenzulegen.
- Operatoren können `skills.search` und `skills.detail` (`operator.read`) für
  ClawHub-Discovery-Metadaten aufrufen.
- Operatoren können `skills.upload.begin`, `skills.upload.chunk` und
  `skills.upload.commit` (`operator.admin`) aufrufen, um ein privates Skill-Archiv
  vor der Installation bereitzustellen. Dies ist ein separater Admin-Upload-Pfad für vertrauenswürdige Clients,
  nicht der normale ClawHub-Skill-Installationsablauf, und standardmäßig deaktiviert, sofern nicht
  `skills.install.allowUploadedArchives` aktiviert ist.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    erstellt einen Upload, der an diesen Slug und Force-Wert gebunden ist.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` hängt Bytes am
    exakt dekodierten Offset an.
  - `skills.upload.commit({ uploadId, sha256? })` überprüft die endgültige Größe und
    SHA-256. Commit finalisiert nur den Upload; es installiert den Skill nicht.
  - Hochgeladene Skill-Archive sind ZIP-Archive mit einem `SKILL.md`-Stamm. Der
    interne Verzeichnisname des Archivs wählt niemals das Installationsziel aus.
- Operatoren können `skills.install` (`operator.admin`) in drei Modi aufrufen:
  - ClawHub-Modus: `{ source: "clawhub", slug, version?, force? }` installiert einen
    Skill-Ordner in das Verzeichnis `skills/` des Standard-Agent-Workspace.
  - Upload-Modus: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installiert einen abgeschlossenen Upload in das Verzeichnis `skills/<slug>`
    des Standard-Agent-Workspace. Der Slug und der Force-Wert müssen mit der ursprünglichen
    `skills.upload.begin`-Anfrage übereinstimmen. Dieser Modus wird abgelehnt, sofern nicht
    `skills.install.allowUploadedArchives` aktiviert ist. Die Einstellung wirkt sich nicht
    auf ClawHub-Installationen aus.
  - Gateway-Installer-Modus: `{ name, installId, timeoutMs? }`
    führt eine deklarierte `metadata.openclaw.install`-Aktion auf dem Gateway-Host aus.
    Ältere Clients können weiterhin `dangerouslyForceUnsafeInstall` senden; dieses Feld ist
    veraltet, wird nur aus Protokollkompatibilität akzeptiert und ignoriert. Verwenden Sie
    `security.installPolicy` für operatorgesteuerte Installationsentscheidungen.
- Operatoren können `skills.update` (`operator.admin`) in zwei Modi aufrufen:
  - Der ClawHub-Modus aktualisiert einen verfolgten Slug oder alle verfolgten ClawHub-Installationen im
    Standard-Agent-Workspace.
  - Der Konfigurationsmodus patcht `skills.entries.<skillKey>`-Werte wie `enabled`,
    `apiKey` und `env`.

### `models.list`-Ansichten

`models.list` akzeptiert einen optionalen Parameter `view`:

- Weggelassen oder `"default"`: aktuelles Runtime-Verhalten. Wenn `agents.defaults.models` konfiguriert ist, ist die Antwort der erlaubte Katalog, einschließlich dynamisch entdeckter Modelle für `provider/*`-Einträge. Andernfalls ist die Antwort der vollständige Gateway-Katalog.
- `"configured"`: Picker-gerechtes Verhalten. Wenn `agents.defaults.models` konfiguriert ist, hat es weiterhin Vorrang, einschließlich Provider-spezifischer Discovery für `provider/*`-Einträge. Ohne Allowlist verwendet die Antwort explizite `models.providers.*.models`-Einträge und fällt nur dann auf den vollständigen Katalog zurück, wenn keine konfigurierten Modellzeilen vorhanden sind.
- `"all"`: vollständiger Gateway-Katalog, der `agents.defaults.models` umgeht. Verwenden Sie dies für Diagnose- und Discovery-UIs, nicht für normale Modell-Picker.

## Exec-Genehmigungen

- Wenn eine Exec-Anfrage eine Genehmigung benötigt, sendet das Gateway `exec.approval.requested`.
- Operator-Clients lösen dies durch Aufruf von `exec.approval.resolve` auf (erfordert den Scope `operator.approvals`).
- Für `host=node` muss `exec.approval.request` `systemRunPlan` enthalten (kanonische `argv`/`cwd`/`rawCommand`/Sitzungsmetadaten). Anfragen ohne `systemRunPlan` werden abgelehnt.
- Nach der Genehmigung verwenden weitergeleitete `node.invoke system.run`-Aufrufe diesen kanonischen
  `systemRunPlan` als maßgeblichen Befehls-/cwd-/Sitzungskontext.
- Wenn ein Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` zwischen Vorbereitung und der endgültig genehmigten `system.run`-Weiterleitung mutiert, lehnt das
  Gateway die Ausführung ab, statt der mutierten Nutzlast zu vertrauen.

## Agent-Zustellungs-Fallback

- `agent`-Anfragen können `deliver=true` enthalten, um ausgehende Zustellung anzufordern.
- `bestEffortDeliver=false` behält striktes Verhalten bei: nicht aufgelöste oder nur interne Zustellungsziele geben `INVALID_REQUEST` zurück.
- `bestEffortDeliver=true` erlaubt den Fallback auf sitzungsgebundene Ausführung, wenn keine externe zustellbare Route aufgelöst werden kann (zum Beispiel interne/Webchat-Sitzungen oder mehrdeutige Mehrkanal-Konfigurationen).
- Finale `agent`-Ergebnisse können `result.deliveryStatus` enthalten, wenn Zustellung
  angefordert wurde, mit denselben Statuswerten `sent`, `suppressed`, `partial_failed` und `failed`,
  die für [`openclaw agent --json --deliver`](/de/cli/agent#json-delivery-status) dokumentiert sind.

## Versionierung

- `PROTOCOL_VERSION` befindet sich in `packages/gateway-protocol/src/version.ts`.
- Clients senden `minProtocol` + `maxProtocol`; der Server lehnt Bereiche ab, die
  sein aktuelles Protokoll nicht einschließen. Aktuelle Clients und Server erfordern
  Protokoll v4.
- Schemas + Modelle werden aus TypeBox-Definitionen generiert:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Client-Konstanten

Der Referenz-Client in `src/gateway/client.ts` verwendet diese Standardwerte. Die Werte sind
über Protokoll v4 hinweg stabil und die erwartete Baseline für Drittanbieter-Clients.

| Konstante                                 | Standardwert                                         | Quelle                                                                                    |
| ----------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                  | `packages/gateway-protocol/src/version.ts`                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                  | `packages/gateway-protocol/src/version.ts`                                                |
| Anfrage-Timeout (pro RPC)                 | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)                                              |
| Preauth-/Connect-Challenge-Timeout        | `15_000` ms                                          | `src/gateway/handshake-timeouts.ts` (Konfiguration/env kann das gekoppelte Server-/Client-Budget erhöhen) |
| Initialer Reconnect-Backoff               | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                                                     |
| Maximaler Reconnect-Backoff               | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)                                             |
| Fast-Retry-Begrenzung nach Device-Token-Schließung | `250` ms                                     | `src/gateway/client.ts`                                                                   |
| Force-Stop-Schonfrist vor `terminate()`   | `250` ms                                             | `FORCE_STOP_TERMINATE_GRACE_MS`                                                           |
| Standard-Timeout für `stopAndWait()`      | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                                                |
| Standard-Tick-Intervall (vor `hello-ok`)  | `30_000` ms                                          | `src/gateway/client.ts`                                                                   |
| Tick-Timeout-Schließung                   | Code `4000`, wenn Stille `tickIntervalMs * 2` überschreitet | `src/gateway/client.ts`                                                            |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                                                         |

Der Server kündigt die effektiven Werte `policy.tickIntervalMs`, `policy.maxPayload`
und `policy.maxBufferedBytes` in `hello-ok` an; Clients sollten diese Werte
anstelle der Standardwerte vor dem Handshake beachten.

## Auth

- Die Shared-Secret-Gateway-Authentifizierung verwendet `connect.params.auth.token` oder
  `connect.params.auth.password`, abhängig vom konfigurierten Authentifizierungsmodus.
- Modi mit Identität wie Tailscale Serve
  (`gateway.auth.allowTailscale: true`) oder nicht über local loopback laufendes
  `gateway.auth.mode: "trusted-proxy"` erfüllen die Connect-Authentifizierungsprüfung über
  Anfrage-Header statt über `connect.params.auth.*`.
- Private-Ingress `gateway.auth.mode: "none"` überspringt die Shared-Secret-Connect-Authentifizierung
  vollständig; setzen Sie diesen Modus nicht für öffentlichen/nicht vertrauenswürdigen Ingress ein.
- Nach dem Pairing gibt das Gateway ein **Gerätetoken** aus, das auf die Verbindungsrolle
  und die Scopes begrenzt ist. Es wird in `hello-ok.auth.deviceToken` zurückgegeben und sollte
  vom Client für zukünftige Verbindungen persistiert werden.
- Clients sollten das primäre `hello-ok.auth.deviceToken` nach jeder
  erfolgreichen Verbindung persistieren.
- Eine erneute Verbindung mit diesem **gespeicherten** Gerätetoken sollte auch den gespeicherten
  genehmigten Scope-Satz für dieses Token wiederverwenden. Das bewahrt Lese-/Probe-/Statuszugriff,
  der bereits gewährt wurde, und verhindert, dass erneute Verbindungen stillschweigend auf einen
  engeren impliziten reinen Admin-Scope reduziert werden.
- Clientseitiger Aufbau der Connect-Authentifizierung (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` ist orthogonal und wird immer weitergeleitet, wenn es gesetzt ist.
  - `auth.token` wird in Prioritätsreihenfolge befüllt: zuerst explizites Shared Token,
    dann ein explizites `deviceToken`, dann ein gespeichertes Token pro Gerät (indiziert über
    `deviceId` + `role`).
  - `auth.bootstrapToken` wird nur gesendet, wenn keines der oben genannten Elemente ein
    `auth.token` ergeben hat. Ein Shared Token oder ein beliebig aufgelöstes Gerätetoken unterdrückt es.
  - Die automatische Hochstufung eines gespeicherten Gerätetokens beim einmaligen
    `AUTH_TOKEN_MISMATCH`-Wiederholungsversuch ist auf **vertrauenswürdige Endpunkte** beschränkt:
    loopback oder `wss://` mit gepinntem `tlsFingerprint`. Öffentliches `wss://`
    ohne Pinning qualifiziert sich nicht.
- Der integrierte Setup-Code-Bootstrap gibt das primäre Node-`hello-ok.auth.deviceToken`
  plus ein begrenztes Operator-Token in `hello-ok.auth.deviceTokens` für eine vertrauenswürdige
  mobile Übergabe zurück. Das Operator-Token enthält `operator.talk.secrets` für native
  Lesezugriffe auf die Talk-Konfiguration und schließt `operator.admin` sowie `operator.pairing` aus.
- Während ein nicht baseline-basierter Setup-Code-Bootstrap auf Genehmigung wartet, enthalten
  `PAIRING_REQUIRED`-Details `recommendedNextStep: "wait_then_retry"`, `retryable: true`
  und `pauseReconnect: false`. Clients sollten mit demselben Bootstrap-Token weiter erneut
  verbinden, bis die Anfrage genehmigt wird oder das Token ungültig wird.
- Persistieren Sie `hello-ok.auth.deviceTokens` nur, wenn die Verbindung Bootstrap-Authentifizierung
  über einen vertrauenswürdigen Transport wie `wss://` oder loopback/lokales Pairing verwendet hat.
- Wenn ein Client ein **explizites** `deviceToken` oder explizite `scopes` bereitstellt, bleibt dieser
  vom Aufrufer angeforderte Scope-Satz maßgeblich; zwischengespeicherte Scopes werden nur
  wiederverwendet, wenn der Client das gespeicherte Token pro Gerät wiederverwendet.
- Gerätetokens können über `device.token.rotate` und
  `device.token.revoke` rotiert/widerrufen werden (erfordert den Scope `operator.pairing`). Das Rotieren oder
  Widerrufen eines Node- oder anderen Nicht-Operator-Rollen-Tokens erfordert zusätzlich `operator.admin`.
- `device.token.rotate` gibt Rotationsmetadaten zurück. Es gibt das ersetzende
  Bearer-Token nur bei Aufrufen desselben Geräts zurück, die bereits mit
  diesem Gerätetoken authentifiziert sind, damit tokenbasierte Clients ihren Ersatz vor
  der erneuten Verbindung persistieren können. Shared-/Admin-Rotationen geben das Bearer-Token nicht zurück.
- Token-Ausstellung, -Rotation und -Widerruf bleiben auf den genehmigten Rollensatz begrenzt,
  der im Pairing-Eintrag dieses Geräts aufgezeichnet ist; Token-Mutation kann keine Geräterolle
  erweitern oder anvisieren, die durch die Pairing-Genehmigung nie gewährt wurde.
- Für Token-Sitzungen gekoppelter Geräte ist die Geräteverwaltung selbstbezogen, sofern der
  Aufrufer nicht auch `operator.admin` besitzt: Nicht-Admin-Aufrufer können nur das
  Operator-Token für ihren **eigenen** Geräteeintrag verwalten. Node- und andere Nicht-Operator-
  Token-Verwaltung ist ausschließlich Admins vorbehalten, selbst für das eigene Gerät des Aufrufers.
- `device.token.rotate` und `device.token.revoke` prüfen außerdem den Scope-Satz des Ziel-Operator-
  Tokens gegen die aktuellen Sitzungsscopes des Aufrufers. Nicht-Admin-Aufrufer können kein
  umfassenderes Operator-Token rotieren oder widerrufen, als sie selbst besitzen.
- Authentifizierungsfehler enthalten `error.details.code` plus Hinweise zur Wiederherstellung:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Clientverhalten für `AUTH_TOKEN_MISMATCH`:
  - Vertrauenswürdige Clients können einen begrenzten Wiederholungsversuch mit einem zwischengespeicherten Token pro Gerät versuchen.
  - Wenn dieser Wiederholungsversuch fehlschlägt, sollten Clients automatische Wiederverbindungsschleifen stoppen und Hinweise für Operator-Aktionen anzeigen.
- `AUTH_SCOPE_MISMATCH` bedeutet, dass das Gerätetoken erkannt wurde, aber die
  angeforderte Rolle/die angeforderten Scopes nicht abdeckt. Clients sollten dies nicht als ungültiges Token darstellen;
  fordern Sie den Operator auf, erneut zu koppeln oder den engeren/weiteren Scope-Vertrag zu genehmigen.

## Geräteidentität + Pairing

- Nodes sollten eine stabile Geräteidentität (`device.id`) enthalten, die aus einem
  Schlüsselpaar-Fingerprint abgeleitet ist.
- Gateways geben Tokens pro Gerät und Rolle aus.
- Pairing-Genehmigungen sind für neue Geräte-IDs erforderlich, sofern lokale automatische Genehmigung
  nicht aktiviert ist.
- Automatische Pairing-Genehmigung ist auf direkte local loopback-Verbindungen ausgerichtet.
- OpenClaw hat außerdem einen schmalen backend-/container-lokalen Selbstverbindungspfad für
  vertrauenswürdige Shared-Secret-Hilfsabläufe.
- Verbindungen über Tailnet oder LAN auf demselben Host werden für das Pairing weiterhin als remote behandelt und
  erfordern eine Genehmigung.
- WS-Clients enthalten während `connect` normalerweise die `device`-Identität (Operator +
  Node). Die einzigen gerätelosen Operator-Ausnahmen sind explizite Vertrauenspfade:
  - `gateway.controlUi.allowInsecureAuth=true` für localhost-only unsichere HTTP-Kompatibilität.
  - erfolgreiche Operator-Control-UI-Authentifizierung mit `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (Break-Glass, erhebliche Sicherheitsabstufung).
  - direct-loopback `gateway-client`-Backend-RPCs auf dem reservierten internen
    Hilfspfad.
- Das Weglassen der Geräteidentität hat Scope-Folgen. Wenn eine gerätelose Operator-
  Verbindung über einen expliziten Vertrauenspfad erlaubt wird, leert OpenClaw dennoch
  selbst deklarierte Scopes zu einem leeren Satz, sofern dieser Pfad keine benannte
  Scope-Preservation-Ausnahme hat. Scope-gesteuerte Methoden schlagen dann mit
  `missing scope` fehl.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` ist ein Control-UI-
  Break-Glass-Pfad zur Scope-Preservation. Er gewährt beliebigen
  benutzerdefinierten Backend- oder CLI-artigen WebSocket-Clients keine Scopes.
- Der reservierte direct-loopback `gateway-client`-Backend-Hilfspfad bewahrt
  Scopes nur für interne lokale Control-Plane-RPCs; benutzerdefinierte Backend-IDs erhalten
  diese Ausnahme nicht.
- Alle Verbindungen müssen die vom Server bereitgestellte `connect.challenge`-Nonce signieren.

### Diagnose der Geräteauthentifizierungsmigration

Für Legacy-Clients, die noch das Signaturverhalten vor Challenge verwenden, gibt `connect` nun
`DEVICE_AUTH_*`-Detailcodes unter `error.details.code` mit stabilem `error.details.reason` zurück.

Häufige Migrationsfehler:

| Nachricht                   | details.code                     | details.reason           | Bedeutung                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client hat `device.nonce` ausgelassen (oder leer gesendet). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client hat mit einer veralteten/falschen Nonce signiert. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signatur-Payload stimmt nicht mit v2-Payload überein. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Signierter Zeitstempel liegt außerhalb der erlaubten Abweichung. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` stimmt nicht mit dem Public-Key-Fingerprint überein. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public-Key-Format/Kanonisierung ist fehlgeschlagen. |

Migrationsziel:

- Warten Sie immer auf `connect.challenge`.
- Signieren Sie den v2-Payload, der die Server-Nonce enthält.
- Senden Sie dieselbe Nonce in `connect.params.device.nonce`.
- Bevorzugter Signatur-Payload ist `v3`, der zusätzlich zu Geräte-/Client-/Rollen-/Scopes-/Token-/Nonce-Feldern
  `platform` und `deviceFamily` bindet.
- Legacy-`v2`-Signaturen werden aus Kompatibilitätsgründen weiterhin akzeptiert, aber das Pinning von
  Metadaten gekoppelter Geräte steuert weiterhin die Befehlsrichtlinie bei erneuter Verbindung.

## TLS + Pinning

- TLS wird für WS-Verbindungen unterstützt.
- Clients können optional den Gateway-Zertifikat-Fingerprint pinnen (siehe `gateway.tls`-
  Konfiguration plus `gateway.remote.tlsFingerprint` oder CLI `--tls-fingerprint`).

## Scope

Dieses Protokoll stellt die **vollständige Gateway-API** bereit (Status, Channels, Modelle, Chat,
Agent, Sitzungen, Nodes, Genehmigungen usw.). Die genaue Oberfläche wird durch die
TypeBox-Schemas in `packages/gateway-protocol/src/schema.ts` definiert.

## Verwandte Themen

- [Bridge-Protokoll](/de/gateway/bridge-protocol)
- [Gateway-Runbook](/de/gateway)
