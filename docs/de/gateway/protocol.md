---
read_when:
    - Implementieren oder Aktualisieren von Gateway-WS-Clients
    - Debugging von Protokollabweichungen oder Verbindungsfehlern
    - Protokollschema/-modelle neu generieren
summary: 'Gateway-WebSocket-Protokoll: Handshake, Frames, Versionierung'
title: Gateway-Protokoll
x-i18n:
    generated_at: "2026-07-01T05:38:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fbfc5db0169f7ac2eacdb882d2afe08c80d5b8d669b6a1cfb2ffd0edbf71d16
    source_path: gateway/protocol.md
    workflow: 16
---

Das Gateway-WS-Protokoll ist die **einzige Control Plane + Node-Transport** für
OpenClaw. Alle Clients (CLI, Web-UI, macOS-App, iOS-/Android-Nodes, headless
Nodes) verbinden sich über WebSocket und deklarieren ihre **Rolle** + ihren
**Scope** beim Handshake.

## Transport

- WebSocket, Text-Frames mit JSON-Payloads.
- Der erste Frame **muss** eine `connect`-Anfrage sein.
- Pre-Connect-Frames sind auf 64 KiB begrenzt. Nach einem erfolgreichen Handshake sollten Clients die Grenzwerte `hello-ok.policy.maxPayload` und
  `hello-ok.policy.maxBufferedBytes` einhalten. Bei aktivierter Diagnose geben
  zu große eingehende Frames und langsame ausgehende Puffer `payload.large`-Ereignisse aus,
  bevor das Gateway den betroffenen Frame schließt oder verwirft. Diese Ereignisse enthalten
  Größen, Grenzwerte, Oberflächen und sichere Reason-Codes. Sie enthalten nicht den Nachrichtentext,
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
innerhalb ihres gesamten Verbindungsbudgets erneut versuchen, anstatt sie als terminalen
Handshake-Fehler anzuzeigen.

`server`, `features`, `snapshot` und `policy` sind alle vom Schema vorgeschrieben
(`packages/gateway-protocol/src/schema/frames.ts`). `auth` ist ebenfalls erforderlich und meldet
die ausgehandelte Rolle/die ausgehandelten Scopes. `pluginSurfaceUrls` ist optional und ordnet Plugin-
Oberflächennamen, wie `canvas`, scoped gehosteten URLs zu.

Scoped Plugin-Oberflächen-URLs können ablaufen. Nodes können
`node.pluginSurface.refresh` mit `{ "surface": "canvas" }` aufrufen, um einen frischen
Eintrag in `pluginSurfaceUrls` zu erhalten. Das experimentelle Canvas-Plugin-Refactoring unterstützt nicht
den veralteten Kompatibilitätspfad `canvasHostUrl`, `canvasCapability` oder
`node.canvas.capability.refresh`; aktuelle native Clients und Gateways müssen Plugin-Oberflächen verwenden.

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

Vertrauenswürdige Backend-Clients im selben Prozess (`client.id: "gateway-client"`,
`client.mode: "backend"`) dürfen `device` bei direkten Loopback-Verbindungen auslassen, wenn
sie sich mit dem gemeinsamen Gateway-Token/-Passwort authentifizieren. Dieser Pfad ist
für interne Control-Plane-RPCs reserviert und verhindert, dass veraltete CLI-/Device-Pairing-Baselines
lokale Backend-Arbeit wie Subagent-Sitzungsaktualisierungen blockieren. Remote-Clients,
Clients mit Browser-Ursprung, Node-Clients und explizite Device-Token-/Device-Identity-
Clients verwenden weiterhin die normalen Pairing- und Scope-Upgrade-Prüfungen.

Wenn ein Device-Token ausgestellt wird, enthält `hello-ok` zusätzlich:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Das integrierte QR-/Setup-Code-Bootstrap ist ein frischer mobiler Übergabepfad. Eine erfolgreiche
Baseline-Setup-Code-`connect` gibt ein primäres Node-Token plus ein begrenztes
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
mobilen Operator-Loop starten kann, ohne `operator.admin` oder `operator.pairing` zu gewähren.
Sie enthält `operator.talk.secrets`, damit der native Client die Talk-
Konfiguration lesen kann, die er nach dem Bootstrap benötigt. Breitere Admin- und Pairing-Scopes erfordern
ein separates genehmigtes Operator-Pairing oder einen Token-Flow. Clients sollten
`hello-ok.auth.deviceTokens` nur persistieren,
wenn `connect` Bootstrap-Auth über vertrauenswürdigen Transport wie `wss://` oder
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

Das vollständige Operator-Scope-Modell, Prüfungen zum Genehmigungszeitpunkt und die
Semantik gemeinsamer Secrets finden Sie unter [Operator-Scopes](/de/gateway/operator-scopes).

### Rollen

- `operator` = Kontrollplan-Client (CLI/UI/Automatisierung).
- `node` = Capability-Host (Kamera/Bildschirm/Canvas/system.run).

### Scopes (operator)

Häufige Scopes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` mit `includeSecrets: true` erfordert `operator.talk.secrets`
(oder `operator.admin`).
Wenn Secrets enthalten sind, sollten Clients die aktiven Talk-Provider-
Anmeldedaten aus `talk.resolved.config.apiKey` lesen; `talk.providers.<id>.apiKey`
behält die Quellform bei und kann ein SecretRef-Objekt oder eine geschwärzte Zeichenfolge sein.

Vom Plugin registrierte Gateway-RPC-Methoden können ihren eigenen operator-Scope anfordern, aber
reservierte Kern-Admin-Präfixe (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) werden immer zu `operator.admin` aufgelöst.

Der Methodenscope ist nur die erste Schranke. Einige Slash-Befehle, die über
`chat.send` erreicht werden, wenden zusätzlich strengere Prüfungen auf Befehlsebene an. Zum Beispiel erfordern persistente
`/config set`- und `/config unset`-Schreibvorgänge `operator.admin`.

`node.pair.approve` hat zusätzlich zum
Basis-Methodenscope auch eine zusätzliche Scope-Prüfung zum Genehmigungszeitpunkt:

- Anfragen ohne Befehl: `operator.pairing`
- Anfragen mit nicht-exec-Node-Befehlen: `operator.pairing` + `operator.write`
- Anfragen, die `system.run`, `system.run.prepare` oder `system.which` enthalten:
  `operator.pairing` + `operator.admin`

### Caps/Befehle/Berechtigungen (node)

Nodes deklarieren Capability-Ansprüche beim Verbindungsaufbau:

- `caps`: allgemeine Capability-Kategorien wie `camera`, `canvas`, `screen`,
  `location`, `voice` und `talk`.
- `commands`: Befehls-Allowlist für Aufrufe.
- `permissions`: granulare Umschalter (z. B. `screen.record`, `camera.capture`).

Das Gateway behandelt diese als **Ansprüche** und erzwingt serverseitige Allowlists.

## Präsenz

- `system-presence` gibt Einträge zurück, die nach Geräteidentität verschlüsselt sind.
- Präsenzeinträge enthalten `deviceId`, `roles` und `scopes`, damit UIs eine einzelne Zeile pro Gerät anzeigen können,
  auch wenn es sowohl als **operator** als auch als **node** verbunden ist.
- `node.list` enthält optionale Felder `lastSeenAtMs` und `lastSeenReason`. Verbundene Nodes melden
  ihre aktuelle Verbindungszeit als `lastSeenAtMs` mit dem Grund `connect`; gekoppelte Nodes können außerdem
  dauerhafte Hintergrundpräsenz melden, wenn ein vertrauenswürdiges Node-Ereignis ihre Kopplungsmetadaten aktualisiert.

### Node-Hintergrund-Alive-Ereignis

Nodes können `node.event` mit `event: "node.presence.alive"` aufrufen, um zu erfassen, dass ein gekoppelter Node
während eines Hintergrund-Wake aktiv war, ohne ihn als verbunden zu markieren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` ist ein geschlossenes Enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` oder `connect`. Unbekannte trigger-Zeichenfolgen werden vom Gateway vor der Persistierung zu
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
bestätigten RPC behandeln, nicht als dauerhafte Präsenzpersistierung.

## Scoping von Broadcast-Ereignissen

Vom Server gepushte WebSocket-Broadcast-Ereignisse sind scope-gesteuert, sodass Sitzungen mit Pairing-Scope oder reine Node-Sitzungen Sitzungsinhalte nicht passiv empfangen.

- **Chat-, Agent- und Tool-Ergebnis-Frames** (einschließlich gestreamter `agent`-Ereignisse und Tool-Aufrufergebnisse) erfordern mindestens `operator.read`. Sitzungen ohne `operator.read` überspringen diese Frames vollständig.
- **Plugin-definierte `plugin.*`-Broadcasts** werden je nachdem, wie das Plugin sie registriert hat, auf `operator.write` oder `operator.admin` beschränkt.
- **Status- und Transportereignisse** (`heartbeat`, `presence`, `tick`, Verbindungs-/Trennungs-Lebenszyklus usw.) bleiben uneingeschränkt, damit die Transportintegrität für jede authentifizierte Sitzung beobachtbar bleibt.
- **Unbekannte Broadcast-Ereignisfamilien** sind standardmäßig scope-gesteuert (fail-closed), sofern ein registrierter Handler sie nicht ausdrücklich lockert.

Jede Clientverbindung behält ihre eigene Sequenznummer pro Client bei, sodass Broadcasts auf diesem Socket die monotone Reihenfolge beibehalten, auch wenn verschiedene Clients unterschiedliche scope-gefilterte Teilmengen des Ereignisstroms sehen.

## Häufige RPC-Methodenfamilien

Die öffentliche WS-Oberfläche ist breiter als die obigen Handshake-/Auth-Beispiele. Dies
ist kein generierter Dump — `hello-ok.features.methods` ist eine konservative
Discovery-Liste, die aus `src/gateway/server-methods-list.ts` plus geladenen
Plugin-/Channel-Methodenexports aufgebaut wird. Behandeln Sie sie als Feature-Discovery, nicht als vollständige
Aufzählung von `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="System and identity">
    - `health` gibt den zwischengespeicherten oder frisch geprüften Gateway-Zustands-Snapshot zurück.
    - `diagnostics.stability` gibt den aktuellen begrenzten Recorder für Diagnosestabilität zurück. Er speichert Betriebsmetadaten wie Ereignisnamen, Zähler, Bytegrößen, Speicherwerte, Warteschlangen-/Sitzungsstatus, Kanal-/Plugin-Namen und Sitzungs-IDs. Er speichert keinen Chattext, keine Webhook-Bodys, Tool-Ausgaben, rohen Anfrage- oder Antwort-Bodys, Token, Cookies oder Geheimwerte. Der Lesebereich für Operatoren ist erforderlich.
    - `status` gibt die Gateway-Zusammenfassung im Stil von `/status` zurück; sensible Felder werden nur für Operator-Clients mit Admin-Bereich einbezogen.
    - `gateway.identity.get` gibt die Gateway-Geräteidentität zurück, die von Relay- und Pairing-Abläufen verwendet wird.
    - `system-presence` gibt den aktuellen Presence-Snapshot für verbundene Operator-/Node-Geräte zurück.
    - `system-event` hängt ein Systemereignis an und kann den Presence-Kontext aktualisieren/übertragen.
    - `last-heartbeat` gibt das zuletzt persistierte Heartbeat-Ereignis zurück.
    - `set-heartbeats` schaltet die Heartbeat-Verarbeitung auf dem Gateway um.

  </Accordion>

  <Accordion title="Models and usage">
    - `models.list` gibt den zur Laufzeit erlaubten Modellkatalog zurück. Übergeben Sie `{ "view": "configured" }` für auswahlgeeignete konfigurierte Modelle (`agents.defaults.models` zuerst, dann `models.providers.*.models`) oder `{ "view": "all" }` für den vollständigen Katalog.
    - `usage.status` gibt Provider-Nutzungsfenster und Zusammenfassungen des verbleibenden Kontingents zurück.
    - `usage.cost` gibt aggregierte Kostennutzungszusammenfassungen für einen Datumsbereich zurück.
      Übergeben Sie `agentId` für einen Agenten oder `agentScope: "all"`, um konfigurierte Agenten zu aggregieren.
    - `doctor.memory.status` gibt die Bereitschaft von Vektorspeicher / zwischengespeicherten Embeddings für den aktiven Standard-Agent-Arbeitsbereich zurück. Übergeben Sie `{ "probe": true }` oder `{ "deep": true }` nur, wenn der Aufrufer ausdrücklich einen Live-Ping des Embedding-Providers wünscht. Dreaming-fähige Clients können auch `{ "agentId": "agent-id" }` übergeben, um Dreaming-Store-Statistiken auf einen ausgewählten Agent-Arbeitsbereich zu beschränken; ohne `agentId` bleibt der Fallback auf den Standard-Agent erhalten und konfigurierte Dreaming-Arbeitsbereiche werden aggregiert.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` und `doctor.memory.dedupeDreamDiary` akzeptieren optionale `{ "agentId": "agent-id" }`-Parameter für Dreaming-Ansichten/-Aktionen ausgewählter Agenten. Wenn `agentId` ausgelassen wird, arbeiten sie auf dem konfigurierten Standard-Agent-Arbeitsbereich.
    - `doctor.memory.remHarness` gibt eine begrenzte, schreibgeschützte REM-Harness-Vorschau für Remote-Control-Plane-Clients zurück. Sie kann Arbeitsbereichspfade, Speicherausschnitte, gerendertes geerdetes Markdown und Kandidaten für Deep Promotion enthalten, daher benötigen Aufrufer `operator.read`.
    - `sessions.usage` gibt nutzungsbezogene Zusammenfassungen pro Sitzung zurück. Übergeben Sie `agentId` für einen
      Agenten oder `agentScope: "all"`, um konfigurierte Agenten gemeinsam aufzulisten.
    - `sessions.usage.timeseries` gibt Zeitreihen zur Nutzung für eine Sitzung zurück.
    - `sessions.usage.logs` gibt Nutzungsprotokolleinträge für eine Sitzung zurück.

  </Accordion>

  <Accordion title="Channels and login helpers">
    - `channels.status` gibt Statuszusammenfassungen für integrierte + gebündelte Kanäle/Plugins zurück.
    - `channels.logout` meldet einen bestimmten Kanal/Account ab, sofern der Kanal Logout unterstützt.
    - `web.login.start` startet einen QR-/Web-Login-Ablauf für den aktuellen QR-fähigen Web-Channel-Provider.
    - `web.login.wait` wartet auf den Abschluss dieses QR-/Web-Login-Ablaufs und startet den Kanal bei Erfolg.
    - `push.test` sendet einen Test-APNs-Push an einen registrierten iOS-Node.
    - `voicewake.get` gibt die gespeicherten Wake-Word-Trigger zurück.
    - `voicewake.set` aktualisiert Wake-Word-Trigger und überträgt die Änderung.

  </Accordion>

  <Accordion title="Messaging and logs">
    - `send` ist der direkte RPC für ausgehende Zustellung bei kanal-/account-/threadzielgerichteten Sends außerhalb des Chat-Runners.
    - `logs.tail` gibt das konfigurierte Gateway-Dateiprotokoll-Ende mit Cursor-/Limit- und Max-Byte-Steuerung zurück.

  </Accordion>

  <Accordion title="Talk and TTS">
    - `talk.catalog` gibt den schreibgeschützten Talk-Provider-Katalog für Sprache, Streaming-Transkription und Echtzeitstimme zurück. Er enthält Provider-IDs, Labels, Konfigurationsstatus, offengelegte Modell-/Voice-IDs, kanonische Modi, Transports, Brain-Strategien und Echtzeit-Audio-/Capability-Flags, ohne Provider-Geheimnisse zurückzugeben oder die globale Konfiguration zu verändern.
    - `talk.config` gibt die effektive Talk-Konfigurations-Payload zurück; `includeSecrets` erfordert `operator.talk.secrets` (oder `operator.admin`).
    - `talk.session.create` erstellt eine Gateway-eigene Talk-Sitzung für `realtime/gateway-relay`, `transcription/gateway-relay` oder `stt-tts/managed-room`. Für `stt-tts/managed-room` müssen Aufrufer mit `operator.write`, die `sessionKey` übergeben, auch `spawnedBy` für bereichsgebundene Sichtbarkeit des Sitzungsschlüssels übergeben; die Erstellung eines unscoped `sessionKey` und `brain: "direct-tools"` erfordern `operator.admin`.
    - `talk.session.join` validiert ein Managed-Room-Sitzungstoken, gibt bei Bedarf `session.ready`- oder `session.replaced`-Ereignisse aus und gibt Raum-/Sitzungsmetadaten sowie aktuelle Talk-Ereignisse ohne Klartexttoken oder gespeicherten Token-Hash zurück.
    - `talk.session.appendAudio` hängt base64-PCM-Eingabeaudio an Gateway-eigene Echtzeit-Relay- und Transkriptionssitzungen an.
    - `talk.session.startTurn`, `talk.session.endTurn` und `talk.session.cancelTurn` steuern den Managed-Room-Turn-Lebenszyklus mit Ablehnung veralteter Turns, bevor der Status gelöscht wird.
    - `talk.session.cancelOutput` stoppt die Audioausgabe des Assistenten, primär für VAD-gesteuertes Barge-in in Gateway-Relay-Sitzungen.
    - `talk.session.submitToolResult` schließt einen Provider-Tool-Aufruf ab, der von einer Gateway-eigenen Echtzeit-Relay-Sitzung ausgegeben wurde. Übergeben Sie `options: { willContinue: true }` für vorläufige Tool-Ausgabe, wenn ein finales Ergebnis folgen wird, oder `options: { suppressResponse: true }`, wenn das Tool-Ergebnis den Provider-Aufruf erfüllen soll, ohne eine weitere Echtzeit-Assistentenantwort zu starten.
    - `talk.session.steer` sendet Sprachsteuerung für einen aktiven Run in eine Gateway-eigene agentengestützte Talk-Sitzung. Akzeptiert wird `{ sessionId, text, mode? }`, wobei `mode` `status`, `steer`, `cancel` oder `followup` ist; ein ausgelassener Modus wird aus dem gesprochenen Text klassifiziert.
    - `talk.session.close` schließt eine Gateway-eigene Relay-, Transkriptions- oder Managed-Room-Sitzung und gibt terminale Talk-Ereignisse aus.
    - `talk.mode` setzt/überträgt den aktuellen Talk-Modusstatus für WebChat-/Control-UI-Clients.
    - `talk.client.create` erstellt eine client-eigene Echtzeit-Provider-Sitzung mit `webrtc` oder `provider-websocket`, während das Gateway Konfiguration, Anmeldedaten, Anweisungen und Tool-Policy besitzt.
    - `talk.client.toolCall` lässt client-eigene Echtzeit-Transports Provider-Tool-Aufrufe an die Gateway-Policy weiterleiten. Das erste unterstützte Tool ist `openclaw_agent_consult`; Clients erhalten eine Run-ID und warten auf normale Chat-Lebenszyklusereignisse, bevor sie das providerspezifische Tool-Ergebnis einreichen.
    - `talk.client.steer` sendet Sprachsteuerung für aktive Runs bei client-eigenen Echtzeit-Transports. Das Gateway löst den aktiven eingebetteten Run aus `sessionKey` auf und gibt ein strukturiertes angenommenes/abgelehntes Ergebnis zurück, statt Steuerung stillschweigend zu verwerfen.
    - `talk.event` ist der zentrale Talk-Ereigniskanal für Echtzeit-, Transkriptions-, STT/TTS-, Managed-Room-, Telefonie- und Meeting-Adapter.
    - `talk.speak` synthetisiert Sprache über den aktiven Talk-Speech-Provider.
    - `tts.status` gibt den aktivierten TTS-Status, den aktiven Provider, Fallback-Provider und den Provider-Konfigurationsstatus zurück.
    - `tts.providers` gibt das sichtbare TTS-Provider-Inventar zurück.
    - `tts.enable` und `tts.disable` schalten den TTS-Einstellungsstatus um.
    - `tts.setProvider` aktualisiert den bevorzugten TTS-Provider.
    - `tts.convert` führt eine einmalige Text-zu-Sprache-Konvertierung aus.

  </Accordion>

  <Accordion title="Secrets, config, update, and wizard">
    - `secrets.reload` löst aktive SecretRefs erneut auf und tauscht den Runtime-Geheimnisstatus nur bei vollständigem Erfolg aus.
    - `secrets.resolve` löst befehlszielbezogene Geheimniszuweisungen für einen bestimmten Befehl-/Zielsatz auf.
    - `config.get` gibt den aktuellen Konfigurations-Snapshot und Hash zurück.
    - `config.set` schreibt eine validierte Konfigurations-Payload.
    - `config.patch` führt ein teilweises Konfigurationsupdate zusammen. Destruktiver Array-
      Ersatz erfordert den betroffenen Pfad in `replacePaths`; verschachtelte Arrays
      unter Array-Einträgen verwenden `[]`-Pfade wie `agents.list[].skills`.
    - `config.apply` validiert + ersetzt die vollständige Konfigurations-Payload.
    - `config.schema` gibt die Live-Konfigurationsschema-Payload zurück, die von Control UI und CLI-Tools verwendet wird: Schema, `uiHints`, Version und Generierungsmetadaten, einschließlich Plugin- + Kanalschema-Metadaten, wenn die Runtime sie laden kann. Das Schema enthält Feldmetadaten `title` / `description`, die aus denselben Labels und Hilfetexten abgeleitet sind, die von der UI verwendet werden, einschließlich verschachtelter Objekt-, Wildcard-, Array-Item- und `anyOf` / `oneOf` / `allOf`-Kompositionszweige, wenn passende Felddokumentation vorhanden ist.
    - `config.schema.lookup` gibt eine pfadbezogene Lookup-Payload für einen Konfigurationspfad zurück: normalisierter Pfad, ein flacher Schemaknoten, passender Hinweis + `hintPath`, optionales `reloadKind` und unmittelbare Child-Zusammenfassungen für UI-/CLI-Drilldown. `reloadKind` ist eines von `restart`, `hot` oder `none` und spiegelt den Gateway-Konfigurations-Reload-Planer für den angeforderten Pfad wider. Lookup-Schemaknoten behalten die benutzerorientierte Dokumentation und gängige Validierungsfelder (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerische/String-/Array-/Objektgrenzen und Flags wie `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) bei. Child-Zusammenfassungen stellen `key`, den normalisierten `path`, `type`, `required`, `hasChildren`, optionales `reloadKind` sowie den passenden `hint` / `hintPath` bereit.
    - `update.run` führt den Gateway-Update-Ablauf aus und plant einen Neustart nur, wenn das Update selbst erfolgreich war; Aufrufer mit einer Sitzung können `continuationMessage` einbeziehen, damit der Start einen Folge-Agent-Turn über die Neustart-Fortsetzungswarteschlange wiederaufnimmt. Paketmanager-Updates und überwachte Git-Checkout-Updates aus der Control Plane verwenden eine abgekoppelte Managed-Service-Übergabe, statt den Paketbaum zu ersetzen oder Checkout-/Build-Ausgabe innerhalb des laufenden Gateways zu verändern. Eine gestartete Übergabe gibt `ok: true` mit `result.reason: "managed-service-handoff-started"` und `handoff.status: "started"` zurück; nicht verfügbare oder fehlgeschlagene Übergaben geben `ok: false` mit `managed-service-handoff-unavailable` oder `managed-service-handoff-failed` zurück, plus `handoff.command`, wenn ein manuelles Shell-Update erforderlich ist. Eine nicht verfügbare Übergabe bedeutet, dass OpenClaw keine sichere Supervisor-Grenze oder dauerhafte Dienstidentität hat, wie `OPENCLAW_SYSTEMD_UNIT` für systemd. Während einer gestarteten Übergabe kann der Neustart-Sentinel kurz `stats.reason: "restart-health-pending"` melden; die Fortsetzung wird verzögert, bis die CLI das neu gestartete Gateway verifiziert und den finalen `ok`-Sentinel schreibt.
    - `update.status` aktualisiert den neuesten Update-Neustart-Sentinel und gibt ihn zurück, einschließlich der nach dem Neustart laufenden Version, wenn verfügbar.
    - `wizard.start`, `wizard.next`, `wizard.status` und `wizard.cancel` stellen den Onboarding-Assistenten über WS RPC bereit.

  </Accordion>

  <Accordion title="Agent- und Arbeitsbereichs-Helfer">
    - `agents.list` gibt konfigurierte Agent-Einträge zurück, einschließlich effektivem Modell und Runtime-Metadaten.
    - `agents.create`, `agents.update` und `agents.delete` verwalten Agent-Datensätze und die Arbeitsbereichsverdrahtung.
    - `agents.files.list`, `agents.files.get` und `agents.files.set` verwalten die Bootstrap-Arbeitsbereichsdateien, die für einen Agent offengelegt werden.
    - `tasks.list`, `tasks.get` und `tasks.cancel` stellen das Gateway-Aufgabenprotokoll für SDK- und Operator-Clients bereit.
    - `artifacts.list`, `artifacts.get` und `artifacts.download` stellen aus Transkripten abgeleitete Artefaktzusammenfassungen und Downloads für einen expliziten Geltungsbereich `sessionKey`, `runId` oder `taskId` bereit. Run- und Aufgabenabfragen lösen die zugehörige Sitzung serverseitig auf und geben nur Transkriptmedien mit passender Herkunft zurück; unsichere oder lokale URL-Quellen geben nicht unterstützte Downloads zurück, statt serverseitig abgerufen zu werden.
    - `environments.list` und `environments.status` stellen schreibgeschützte Gateway-lokale und Node-Umgebungserkennung für SDK-Clients bereit.
    - `agent.identity.get` gibt die effektive Assistentenidentität für einen Agent oder eine Sitzung zurück.
    - `agent.wait` wartet, bis ein Run abgeschlossen ist, und gibt den terminalen Snapshot zurück, sofern verfügbar.

  </Accordion>

  <Accordion title="Sitzungssteuerung">
    - `sessions.list` gibt den aktuellen Sitzungsindex zurück, einschließlich `agentRuntime`-Metadaten pro Zeile, wenn ein Agent-Runtime-Backend konfiguriert ist.
    - `sessions.subscribe` und `sessions.unsubscribe` schalten Abonnements für Sitzungsänderungsereignisse für den aktuellen WS-Client um.
    - `sessions.messages.subscribe` und `sessions.messages.unsubscribe` schalten Abonnements für Transkript-/Nachrichtenereignisse für eine Sitzung um.
    - `sessions.preview` gibt begrenzte Transkriptvorschauen für bestimmte Sitzungsschlüssel zurück.
    - `sessions.describe` gibt eine Gateway-Sitzungszeile für einen exakten Sitzungsschlüssel zurück.
    - `sessions.resolve` löst ein Sitzungsziel auf oder kanonisiert es.
    - `sessions.create` erstellt einen neuen Sitzungseintrag.
    - `sessions.send` sendet eine Nachricht in eine vorhandene Sitzung.
    - `sessions.steer` ist die Unterbrechen-und-Steuern-Variante für eine aktive Sitzung.
    - `sessions.abort` bricht aktive Arbeit für eine Sitzung ab. Ein Aufrufer kann `key` plus optional `runId` übergeben oder nur `runId` für aktive Runs übergeben, die das Gateway einer Sitzung zuordnen kann.
    - `sessions.patch` aktualisiert Sitzungsmetadaten/-Überschreibungen und meldet das aufgelöste kanonische Modell plus effektives `agentRuntime`.
    - `sessions.reset`, `sessions.delete` und `sessions.compact` führen Sitzungswartung aus.
    - `sessions.get` gibt die vollständig gespeicherte Sitzungszeile zurück.
    - Die Chat-Ausführung verwendet weiterhin `chat.history`, `chat.send`, `chat.abort` und `chat.inject`. `chat.history` ist für UI-Clients anzeige-normalisiert: Inline-Direktiven-Tags werden aus sichtbarem Text entfernt, XML-Payloads von Nur-Text-Tool-Aufrufen (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Tool-Aufrufblöcke) sowie durchgesickerte ASCII-/vollbreite Modellsteuerungstokens werden entfernt, reine Silent-Token-Assistentenzeilen wie exaktes `NO_REPLY` / `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden.
    - `chat.message.get` ist der additive, begrenzte Vollnachrichtenleser für einen einzelnen sichtbaren Transkripteintrag. Clients übergeben `sessionKey`, optional `agentId`, wenn die Sitzungsauswahl agentbezogen ist, plus eine Transkript-`messageId`, die zuvor über `chat.history` bereitgestellt wurde, und das Gateway gibt dieselbe anzeige-normalisierte Projektion ohne die leichte Verlaufskürzungsgrenze zurück, wenn der gespeicherte Eintrag noch verfügbar und nicht übergroß ist.
    - `chat.send` akzeptiert ein einmaliges `fastMode: "auto"`, um den schnellen Modus für Modellaufrufe zu verwenden, die vor dem automatischen Grenzwert gestartet wurden, und spätere Wiederholungs-, Fallback-, Tool-Ergebnis- oder Fortsetzungsaufrufe ohne schnellen Modus zu starten. Der Grenzwert ist standardmäßig 60 Sekunden und kann pro Modell mit `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` konfiguriert werden. Ein `chat.send`-Aufrufer kann einmalig `fastAutoOnSeconds` übergeben, um den Grenzwert für diese Anfrage zu überschreiben.

  </Accordion>

  <Accordion title="Gerätekopplung und Geräte-Tokens">
    - `device.pair.list` gibt ausstehende und genehmigte gekoppelte Geräte zurück.
    - `device.pair.approve`, `device.pair.reject` und `device.pair.remove` verwalten Gerätekopplungsdatensätze.
    - `device.token.rotate` rotiert ein gekoppeltes Geräte-Token innerhalb seiner genehmigten Rollen- und Aufrufer-Geltungsbereichsgrenzen.
    - `device.token.revoke` widerruft ein gekoppeltes Geräte-Token innerhalb seiner genehmigten Rollen- und Aufrufer-Geltungsbereichsgrenzen.

  </Accordion>

  <Accordion title="Node-Kopplung, Aufruf und ausstehende Arbeit">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` und `node.pair.verify` decken Node-Kopplung und Bootstrap-Verifizierung ab.
    - `node.list` und `node.describe` geben bekannten/verbundenen Node-Status zurück.
    - `node.rename` aktualisiert die Bezeichnung eines gekoppelten Node.
    - `node.invoke` leitet einen Befehl an einen verbundenen Node weiter.
    - `node.invoke.result` gibt das Ergebnis für eine Aufrufanfrage zurück.
    - `node.event` überträgt von Node stammende Ereignisse zurück in das Gateway.
    - `node.pending.pull` und `node.pending.ack` sind die verbundenen Node-Warteschlangen-APIs.
    - `node.pending.enqueue` und `node.pending.drain` verwalten dauerhafte ausstehende Arbeit für Offline-/getrennte Nodes.

  </Accordion>

  <Accordion title="Genehmigungsfamilien">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` und `exec.approval.resolve` decken einmalige Exec-Genehmigungsanfragen plus ausstehende Genehmigungsabfrage/-wiedergabe ab.
    - `exec.approval.waitDecision` wartet auf eine ausstehende Exec-Genehmigung und gibt die endgültige Entscheidung zurück (oder `null` bei Timeout).
    - `exec.approvals.get` und `exec.approvals.set` verwalten Snapshots der Gateway-Exec-Genehmigungsrichtlinie.
    - `exec.approvals.node.get` und `exec.approvals.node.set` verwalten Node-lokale Exec-Genehmigungsrichtlinien über Node-Relay-Befehle.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` und `plugin.approval.resolve` decken Plugin-definierte Genehmigungsabläufe ab.

  </Accordion>

  <Accordion title="Automatisierung, Skills und Tools">
    - Automatisierung: `wake` plant eine sofortige oder nächste-Heartbeat-Textinjektion; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` verwalten geplante Arbeit.
    - `cron.run` bleibt ein Enqueue-artiger RPC für manuelle Runs. Clients, die Abschlusssemantik benötigen, sollten die zurückgegebene `runId` lesen und `cron.runs` abfragen.
    - `cron.runs` akzeptiert einen optionalen, nicht leeren `runId`-Filter, damit Clients einem einzelnen eingereihten manuellen Run folgen können, ohne mit anderen Verlaufseinträgen für denselben Job zu konkurrieren.
    - Skills und Tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Häufige Ereignisfamilien

- `chat`: UI-Chat-Aktualisierungen wie `chat.inject` und andere rein transkriptbezogene Chat-
  Ereignisse. In Protokoll v4 tragen Delta-Payloads `deltaText`; `message` bleibt
  der kumulative Assistenten-Snapshot. Nicht-Präfix-Ersetzungen setzen `replace=true`
  und verwenden `deltaText` als Ersetzungstext.
- `session.message`, `session.operation` und `session.tool`: Transkript-,
  laufende Sitzungsoperationen und Event-Stream-Aktualisierungen für eine abonnierte
  Sitzung.
- `sessions.changed`: Sitzungsindex oder Metadaten geändert.
- `presence`: Aktualisierungen des Systempräsenz-Snapshots.
- `tick`: periodisches Keepalive-/Liveness-Ereignis.
- `health`: Aktualisierung des Gateway-Health-Snapshots.
- `heartbeat`: Aktualisierung des Heartbeat-Ereignisstreams.
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

### Node-Helfermethoden

- Nodes können `skills.bins` aufrufen, um die aktuelle Liste der Skill-Ausführungsdateien
  für Auto-Allow-Prüfungen abzurufen.

### Aufgabenprotokoll-RPCs

Operator-Clients können Gateway-Hintergrundaufgabendatensätze über
die Aufgabenprotokoll-RPCs prüfen und abbrechen. Diese Methoden geben bereinigte Aufgabenzusammenfassungen zurück, keinen rohen
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
  - `found` meldet, ob das Protokoll eine passende Aufgabe enthielt. `cancelled`
    meldet, ob die Runtime den Abbruch akzeptiert oder aufgezeichnet hat.

`TaskSummary` enthält `id`, `status` und optionale Metadaten wie `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, Zeitstempel, Fortschritt,
terminale Zusammenfassung und bereinigten Fehlertext. `agentId` identifiziert den Agent,
der die Aufgabe ausführt; `sessionKey` und `ownerKey` bewahren Anforderer- und Steuerungs-
kontext.

### Operator-Helfermethoden

- Operatoren können `commands.list` (`operator.read`) aufrufen, um das Laufzeit-
  Befehlsinventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den standardmäßigen Agent-Arbeitsbereich zu lesen.
  - `scope` steuert, welche Oberfläche das primäre `name` adressiert:
    - `text` gibt das primäre Textbefehl-Token ohne führendes `/` zurück
    - `native` und der standardmäßige Pfad `both` geben Provider-bewusste native Namen zurück,
      wenn verfügbar
  - `textAliases` enthält exakte Slash-Aliase wie `/model` und `/m`.
  - `nativeName` enthält den Provider-bewussten nativen Befehlsnamen, wenn einer existiert.
  - `provider` ist optional und wirkt sich nur auf native Benennung sowie die Verfügbarkeit
    nativer Plugin-Befehle aus.
  - `includeArgs=false` lässt serialisierte Argumentmetadaten in der Antwort aus.
- Operatoren können `tools.catalog` (`operator.read`) aufrufen, um den Laufzeit-Werkzeugkatalog für einen
  Agenten abzurufen. Die Antwort enthält gruppierte Werkzeuge und Herkunftsmetadaten:
  - `source`: `core` oder `plugin`
  - `pluginId`: Plugin-Eigentümer, wenn `source="plugin"`
  - `optional`: ob ein Plugin-Werkzeug optional ist
- Operatoren können `tools.effective` (`operator.read`) aufrufen, um das zur Laufzeit wirksame
  Werkzeuginventar für eine Sitzung abzurufen.
  - `sessionKey` ist erforderlich.
  - Der Gateway leitet vertrauenswürdigen Laufzeitkontext serverseitig aus der Sitzung ab,
    statt vom Aufrufer bereitgestellten Auth- oder Zustellungskontext zu akzeptieren.
  - Die Antwort ist eine sitzungsbezogene, serverseitig abgeleitete Projektion des aktiven Inventars,
    einschließlich Core-, Plugin-, Kanal- und bereits entdeckter MCP-Server-Werkzeuge.
  - `tools.effective` ist für MCP schreibgeschützt: Es kann einen warmen Sitzungs-MCP-Katalog durch die
    finale Werkzeugrichtlinie projizieren, erstellt aber keine MCP-Laufzeiten, verbindet keine Transporte und gibt kein
    `tools/list` aus. Wenn kein passender warmer Katalog existiert, kann die Antwort einen Hinweis wie
    `mcp-not-yet-connected`, `mcp-not-yet-listed` oder `mcp-stale-catalog` enthalten.
  - Effektive Werkzeugeinträge verwenden `source="core"`, `source="plugin"`, `source="channel"` oder
    `source="mcp"`.
- Operatoren können `tools.invoke` (`operator.write`) aufrufen, um ein verfügbares Werkzeug über denselben
  Gateway-Richtlinienpfad wie `/tools/invoke` aufzurufen.
  - `name` ist erforderlich. `args`, `sessionKey`, `agentId`, `confirm` und
    `idempotencyKey` sind optional.
  - Wenn sowohl `sessionKey` als auch `agentId` vorhanden sind, muss der aufgelöste Sitzungs-Agent mit
    `agentId` übereinstimmen.
  - Eigentümer-exklusive Core-Wrapper wie `cron`, `gateway` und `nodes` erfordern
    Eigentümer-/Admin-Identität (`operator.admin`), obwohl die Methode `tools.invoke`
    selbst `operator.write` ist.
  - Die Antwort ist ein SDK-orientierter Umschlag mit `ok`, `toolName`, optionalem `output` und typisierten
    `error`-Feldern. Genehmigungs- oder Richtlinienablehnungen geben `ok:false` in der Nutzlast zurück, statt
    die Gateway-Werkzeugrichtlinien-Pipeline zu umgehen.
- Operatoren können `skills.status` (`operator.read`) aufrufen, um das sichtbare
  Skill-Inventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den standardmäßigen Agent-Arbeitsbereich zu lesen.
  - Die Antwort enthält Berechtigung, fehlende Anforderungen, Konfigurationsprüfungen und
    bereinigte Installationsoptionen, ohne rohe Geheimniswerte offenzulegen.
- Operatoren können `skills.search` und `skills.detail` (`operator.read`) für
  ClawHub-Entdeckungsmetadaten aufrufen.
- Operatoren können `skills.upload.begin`, `skills.upload.chunk` und
  `skills.upload.commit` (`operator.admin`) aufrufen, um ein privates Skill-Archiv
  vor der Installation bereitzustellen. Dies ist ein separater Admin-Uploadpfad für vertrauenswürdige Clients,
  nicht der normale ClawHub-Skill-Installationsablauf, und ist standardmäßig deaktiviert, sofern
  `skills.install.allowUploadedArchives` nicht aktiviert ist.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    erstellt einen Upload, der an diesen Slug und Force-Wert gebunden ist.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` hängt Bytes am
    exakt dekodierten Offset an.
  - `skills.upload.commit({ uploadId, sha256? })` prüft die endgültige Größe und
    SHA-256. Commit schließt nur den Upload ab; es installiert den Skill nicht.
  - Hochgeladene Skill-Archive sind Zip-Archive mit einem `SKILL.md`-Stamm. Der
    interne Verzeichnisname des Archivs wählt niemals das Installationsziel aus.
- Operatoren können `skills.install` (`operator.admin`) in drei Modi aufrufen:
  - ClawHub-Modus: `{ source: "clawhub", slug, version?, force? }` installiert einen
    Skill-Ordner in das Verzeichnis `skills/` des standardmäßigen Agent-Arbeitsbereichs.
  - Upload-Modus: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installiert einen festgeschriebenen Upload in das Verzeichnis `skills/<slug>`
    des standardmäßigen Agent-Arbeitsbereichs. Slug und Force-Wert müssen mit der ursprünglichen
    `skills.upload.begin`-Anfrage übereinstimmen. Dieser Modus wird abgelehnt, sofern
    `skills.install.allowUploadedArchives` nicht aktiviert ist. Die Einstellung wirkt sich nicht
    auf ClawHub-Installationen aus.
  - Gateway-Installationsmodus: `{ name, installId, timeoutMs? }`
    führt eine deklarierte `metadata.openclaw.install`-Aktion auf dem Gateway-Host aus.
    Ältere Clients können weiterhin `dangerouslyForceUnsafeInstall` senden; dieses Feld ist
    veraltet, wird nur aus Gründen der Protokollkompatibilität akzeptiert und ignoriert. Verwenden Sie
    `security.installPolicy` für operatorgesteuerte Installationsentscheidungen.
- Operatoren können `skills.update` (`operator.admin`) in zwei Modi aufrufen:
  - Der ClawHub-Modus aktualisiert einen nachverfolgten Slug oder alle nachverfolgten ClawHub-Installationen im
    standardmäßigen Agent-Arbeitsbereich.
  - Der Konfigurationsmodus patcht `skills.entries.<skillKey>`-Werte wie `enabled`,
    `apiKey` und `env`.

### `models.list`-Ansichten

`models.list` akzeptiert einen optionalen Parameter `view`:

- Weggelassen oder `"default"`: aktuelles Laufzeitverhalten. Wenn `agents.defaults.models` konfiguriert ist, ist die Antwort der erlaubte Katalog, einschließlich dynamisch entdeckter Modelle für `provider/*`-Einträge. Andernfalls ist die Antwort der vollständige Gateway-Katalog.
- `"configured"`: Verhalten in Picker-Größe. Wenn `agents.defaults.models` konfiguriert ist, hat es weiterhin Vorrang, einschließlich Provider-bezogener Entdeckung für `provider/*`-Einträge. Ohne Allowlist verwendet die Antwort explizite `models.providers.*.models`-Einträge und fällt nur dann auf den vollständigen Katalog zurück, wenn keine konfigurierten Modellzeilen existieren.
- `"all"`: vollständiger Gateway-Katalog, unter Umgehung von `agents.defaults.models`. Verwenden Sie dies für Diagnose- und Entdeckungs-UIs, nicht für normale Modell-Picker.

## Exec-Genehmigungen

- Wenn eine Exec-Anfrage Genehmigung benötigt, sendet der Gateway `exec.approval.requested`.
- Operator-Clients lösen dies durch Aufruf von `exec.approval.resolve` auf (erfordert den Scope `operator.approvals`).
- Für `host=node` muss `exec.approval.request` `systemRunPlan` enthalten (kanonische `argv`/`cwd`/`rawCommand`/Sitzungsmetadaten). Anfragen ohne `systemRunPlan` werden abgelehnt.
- Nach der Genehmigung verwenden weitergeleitete `node.invoke system.run`-Aufrufe diesen kanonischen
  `systemRunPlan` erneut als maßgeblichen Befehls-/cwd-/Sitzungskontext.
- Wenn ein Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` zwischen Vorbereitung und der final genehmigten `system.run`-Weiterleitung verändert, lehnt der
  Gateway die Ausführung ab, statt der veränderten Nutzlast zu vertrauen.

## Fallback für Agent-Zustellung

- `agent`-Anfragen können `deliver=true` enthalten, um ausgehende Zustellung anzufordern.
- `bestEffortDeliver=false` behält striktes Verhalten bei: nicht auflösbare oder nur interne Zustellungsziele geben `INVALID_REQUEST` zurück.
- `bestEffortDeliver=true` erlaubt den Fallback auf sitzungsgebundene Ausführung, wenn keine extern zustellbare Route aufgelöst werden kann (zum Beispiel interne/Webchat-Sitzungen oder mehrdeutige Mehrkanal-Konfigurationen).
- Finale `agent`-Ergebnisse können `result.deliveryStatus` enthalten, wenn Zustellung
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

Der Referenz-Client in `src/gateway/client.ts` verwendet diese Standardwerte. Werte sind
über Protokoll v4 hinweg stabil und bilden die erwartete Basis für Drittanbieter-Clients.

| Konstante                                 | Standard                                              | Quelle                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Anfrage-Timeout (pro RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth-/Connect-Challenge-Timeout        | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env kann das gekoppelte Server-/Client-Budget erhöhen) |
| Initialer Reconnect-Backoff               | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maximaler Reconnect-Backoff               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-Retry-Begrenzung nach Device-Token-Schließen | `250` ms                                      | `src/gateway/client.ts`                                                                    |
| Force-Stop-Kulanz vor `terminate()`       | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Standard-Timeout für `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Standard-Tick-Intervall (vor `hello-ok`)  | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick-Timeout-Schließen                    | Code `4000`, wenn Stille `tickIntervalMs * 2` überschreitet | `src/gateway/client.ts`                                                               |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Der Server kündigt das wirksame `policy.tickIntervalMs`, `policy.maxPayload`
und `policy.maxBufferedBytes` in `hello-ok` an; Clients sollten diese Werte
statt der Standardwerte vor dem Handshake berücksichtigen.

## Auth

- Shared-Secret-Gateway-Auth verwendet `connect.params.auth.token` oder
  `connect.params.auth.password`, abhängig vom konfigurierten Auth-Modus. 
- Identitätsführende Modi wie Tailscale Serve
  (`gateway.auth.allowTailscale: true`) oder nicht-Loopback
  `gateway.auth.mode: "trusted-proxy"` erfüllen die Connect-Auth-Prüfung über
  Request-Header statt über `connect.params.auth.*`.
- Private-Ingress `gateway.auth.mode: "none"` überspringt Shared-Secret-Connect-Auth
  vollständig; setzen Sie diesen Modus nicht auf öffentlichem/nicht vertrauenswürdigem Ingress ein.
- Nach dem Pairing stellt der Gateway ein **Gerätetoken** aus, das auf die Verbindungsrolle
  + Scopes begrenzt ist. Es wird in `hello-ok.auth.deviceToken` zurückgegeben und sollte
  vom Client für zukünftige Verbindungen persistiert werden.
- Clients sollten das primäre `hello-ok.auth.deviceToken` nach jeder
  erfolgreichen Verbindung persistieren.
- Beim erneuten Verbinden mit diesem **gespeicherten** Gerätetoken sollte auch der gespeicherte
  genehmigte Scope-Satz für dieses Token wiederverwendet werden. Dadurch bleiben Lese-/Probe-/Statuszugriffe
  erhalten, die bereits gewährt wurden, und erneute Verbindungen werden nicht stillschweigend auf einen
  engeren impliziten Nur-Admin-Scope reduziert.
- Clientseitige Connect-Auth-Zusammenstellung (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` ist orthogonal und wird immer weitergeleitet, wenn gesetzt.
  - `auth.token` wird in Prioritätsreihenfolge befüllt: zuerst explizites Shared Token,
    dann ein explizites `deviceToken`, dann ein gespeichertes Token pro Gerät (nach
    `deviceId` + `role` indiziert).
  - `auth.bootstrapToken` wird nur gesendet, wenn keiner der obigen Werte ein
    `auth.token` aufgelöst hat. Ein Shared Token oder ein beliebiges aufgelöstes Gerätetoken unterdrückt es.
  - Die automatische Hochstufung eines gespeicherten Gerätetokens beim einmaligen
    `AUTH_TOKEN_MISMATCH`-Retry ist auf **vertrauenswürdige Endpunkte** beschränkt —
    Loopback oder `wss://` mit angeheftetem `tlsFingerprint`. Öffentliches `wss://`
    ohne Pinning qualifiziert sich nicht.
- Der integrierte Setup-Code-Bootstrap gibt das primäre Node
  `hello-ok.auth.deviceToken` plus ein begrenztes Operator-Token in
  `hello-ok.auth.deviceTokens` für vertrauenswürdige mobile Übergaben zurück. Das Operator-Token
  enthält `operator.talk.secrets` für native Talk-Konfigurationslesevorgänge und
  schließt `operator.admin` und `operator.pairing` aus.
- Während ein nicht-baseline Setup-Code-Bootstrap auf Genehmigung wartet, enthalten `PAIRING_REQUIRED`-
  Details `recommendedNextStep: "wait_then_retry"`, `retryable: true`
  und `pauseReconnect: false`. Clients sollten mit demselben
  Bootstrap-Token weiter erneut verbinden, bis die Anfrage genehmigt ist oder das Token ungültig wird.
- Persistieren Sie `hello-ok.auth.deviceTokens` nur, wenn die Verbindung Bootstrap-Auth
  über einen vertrauenswürdigen Transport wie `wss://` oder Loopback/lokales Pairing verwendet hat.
- Wenn ein Client ein **explizites** `deviceToken` oder explizite `scopes` bereitstellt, bleibt dieser
  vom Aufrufer angeforderte Scope-Satz maßgeblich; zwischengespeicherte Scopes werden nur
  wiederverwendet, wenn der Client das gespeicherte Gerätetoken pro Gerät wiederverwendet.
- Gerätetokens können über `device.token.rotate` und
  `device.token.revoke` rotiert/widerrufen werden (erfordert Scope `operator.pairing`). Das Rotieren oder
  Widerrufen einer Node- oder anderen Nicht-Operator-Rolle erfordert außerdem `operator.admin`.
- `device.token.rotate` gibt Rotationsmetadaten zurück. Es spiegelt das Ersatz-
  Bearer-Token nur für Aufrufe desselben Geräts wider, die bereits mit
  diesem Gerätetoken authentifiziert sind, sodass reine Token-Clients ihren Ersatz persistieren können, bevor
  sie erneut verbinden. Shared/Admin-Rotationen spiegeln das Bearer-Token nicht wider.
- Token-Ausstellung, -Rotation und -Widerruf bleiben auf den genehmigten Rollensatz begrenzt,
  der im Pairing-Eintrag dieses Geräts aufgezeichnet ist; Token-Mutation kann keine
  Geräterolle erweitern oder anvisieren, die durch die Pairing-Genehmigung nie gewährt wurde.
- Für Token-Sitzungen gepaarter Geräte ist Geräteverwaltung selbstbeschränkt, sofern der
  Aufrufer nicht auch `operator.admin` hat: Nicht-Admin-Aufrufer können nur das
  Operator-Token für ihren **eigenen** Geräteeintrag verwalten. Node- und andere Nicht-Operator-
  Token-Verwaltung ist nur Admins vorbehalten, selbst für das eigene Gerät des Aufrufers.
- `device.token.rotate` und `device.token.revoke` prüfen außerdem den Ziel-Operator-
  Token-Scope-Satz gegen die aktuellen Sitzungs-Scopes des Aufrufers. Nicht-Admin-Aufrufer
  können kein breiteres Operator-Token rotieren oder widerrufen, als sie bereits halten.
- Auth-Fehler enthalten `error.details.code` plus Hinweise zur Wiederherstellung:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Clientverhalten für `AUTH_TOKEN_MISMATCH`:
  - Vertrauenswürdige Clients dürfen einen begrenzten Retry mit einem zwischengespeicherten Gerätetoken pro Gerät versuchen.
  - Wenn dieser Retry fehlschlägt, sollten Clients automatische Reconnect-Schleifen beenden und Hinweise für Operator-Aktionen anzeigen.
- `AUTH_SCOPE_MISMATCH` bedeutet, dass das Gerätetoken erkannt wurde, aber die
  angeforderte Rolle/Scopes nicht abdeckt. Clients sollten dies nicht als fehlerhaftes Token darstellen;
  fordern Sie den Operator auf, erneut zu pairen oder den engeren/breiteren Scope-Vertrag zu genehmigen.

## Geräteidentität + Pairing

- Nodes sollten eine stabile Geräteidentität (`device.id`) enthalten, die aus einem
  Keypair-Fingerprint abgeleitet ist.
- Gateways stellen Tokens pro Gerät + Rolle aus.
- Pairing-Genehmigungen sind für neue Geräte-IDs erforderlich, sofern lokale Auto-Genehmigung
  nicht aktiviert ist.
- Pairing-Auto-Genehmigung konzentriert sich auf direkte local loopback-Verbindungen.
- OpenClaw hat außerdem einen engen Backend/containerlokalen Self-Connect-Pfad für
  vertrauenswürdige Shared-Secret-Hilfsflüsse.
- Same-Host-Tailnet- oder LAN-Verbindungen werden für Pairing weiterhin als remote behandelt und
  erfordern Genehmigung.
- WS-Clients enthalten normalerweise während `connect` eine `device`-Identität (Operator +
  Node). Die einzigen gerätelosen Operator-Ausnahmen sind explizite Vertrauenspfade:
  - `gateway.controlUi.allowInsecureAuth=true` für reine Localhost-Kompatibilität mit unsicherem HTTP.
  - erfolgreiche Operator-Control-UI-Auth mit `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (Break-Glass, erhebliche Sicherheitsabstufung).
  - Direct-Loopback-`gateway-client`-Backend-RPCs auf dem reservierten internen
    Hilfspfad.
- Das Weglassen der Geräteidentität hat Scope-Folgen. Wenn eine gerätelose Operator-
  Verbindung über einen expliziten Vertrauenspfad zugelassen wird, leert OpenClaw weiterhin
  selbst deklarierte Scopes auf eine leere Menge, sofern dieser Pfad keine benannte
  Scope-Erhaltungs-Ausnahme hat. Scope-gesteuerte Methoden schlagen dann mit
  `missing scope` fehl.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` ist ein Control-UI-
  Break-Glass-Pfad zur Scope-Erhaltung. Er gewährt keinen beliebigen
  benutzerdefinierten Backend- oder CLI-förmigen WebSocket-Clients Scopes.
- Der reservierte Direct-Loopback-`gateway-client`-Backend-Hilfspfad erhält
  Scopes nur für interne lokale Control-Plane-RPCs; benutzerdefinierte Backend-IDs erhalten
  diese Ausnahme nicht.
- Alle Verbindungen müssen die vom Server bereitgestellte `connect.challenge`-Nonce signieren.

### Diagnose zur Geräte-Auth-Migration

Für Legacy-Clients, die noch das Signierverhalten vor Challenge verwenden, gibt `connect` jetzt
`DEVICE_AUTH_*`-Detailcodes unter `error.details.code` mit einem stabilen `error.details.reason` zurück.

Häufige Migrationsfehler:

| Nachricht                   | details.code                     | details.reason           | Bedeutung                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client hat `device.nonce` weggelassen (oder leer gesendet). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client hat mit einer veralteten/falschen Nonce signiert. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signatur-Payload entspricht nicht dem v2-Payload.  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Signierter Zeitstempel liegt außerhalb der erlaubten Abweichung. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` stimmt nicht mit dem Public-Key-Fingerprint überein. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public-Key-Format/Kanonisierung fehlgeschlagen.    |

Migrationsziel:

- Warten Sie immer auf `connect.challenge`.
- Signieren Sie den v2-Payload, der die Server-Nonce enthält.
- Senden Sie dieselbe Nonce in `connect.params.device.nonce`.
- Bevorzugter Signatur-Payload ist `v3`, der zusätzlich zu Geräte-/Client-/Rollen-/Scopes-/Token-/Nonce-Feldern
  `platform` und `deviceFamily` bindet.
- Legacy-`v2`-Signaturen werden aus Kompatibilitätsgründen weiterhin akzeptiert, aber das Metadaten-Pinning
  gepaarter Geräte steuert weiterhin die Command-Policy beim erneuten Verbinden.

## TLS + Pinning

- TLS wird für WS-Verbindungen unterstützt.
- Clients können optional den Fingerprint des Gateway-Zertifikats pinnen (siehe `gateway.tls`-
  Konfiguration plus `gateway.remote.tlsFingerprint` oder CLI `--tls-fingerprint`).

## Scope

Dieses Protokoll stellt die **vollständige Gateway-API** bereit (Status, Channels, Modelle, Chat,
Agent, Sitzungen, Nodes, Genehmigungen usw.). Die genaue Oberfläche wird durch die
TypeBox-Schemas in `packages/gateway-protocol/src/schema.ts` definiert.

## Verwandt

- [Bridge-Protokoll](/de/gateway/bridge-protocol)
- [Gateway-Runbook](/de/gateway)
