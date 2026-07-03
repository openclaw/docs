---
read_when:
    - Gateway-WS-Clients implementieren oder aktualisieren
    - Fehlersuche bei Protokollabweichungen oder Verbindungsfehlern
    - Protokollschema/-modelle neu generieren
summary: 'Gateway-WebSocket-Protokoll: Handshake, Frames, Versionierung'
title: Gateway-Protokoll
x-i18n:
    generated_at: "2026-07-03T09:31:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b58ef44b15e7359ca919e487bcf94c86601f508500ece000aafd8d1a90fb1cf1
    source_path: gateway/protocol.md
    workflow: 16
---

Das Gateway-WS-Protokoll ist die **einzige Steuerungsebene + der Knotentransport** für
OpenClaw. Alle Clients (CLI, Web-UI, macOS-App, iOS-/Android-Knoten, Headless-
Knoten) verbinden sich per WebSocket und deklarieren ihre **Rolle** + ihren **Scope** zum
Handshake-Zeitpunkt.

## Transport

- WebSocket, Text-Frames mit JSON-Payloads.
- Der erste Frame **muss** eine `connect`-Anfrage sein.
- Pre-Connect-Frames sind auf 64 KiB begrenzt. Nach einem erfolgreichen Handshake sollten Clients
  die Grenzwerte `hello-ok.policy.maxPayload` und
  `hello-ok.policy.maxBufferedBytes` einhalten. Bei aktivierter Diagnose erzeugen
  übergroße eingehende Frames und langsame ausgehende Puffer `payload.large`-Ereignisse,
  bevor das Gateway schließt oder den betroffenen Frame verwirft. Diese Ereignisse behalten
  Größen, Grenzwerte, Oberflächen und sichere Reason-Codes. Sie behalten weder den Nachrichtentext,
  noch Anhangsinhalte, den rohen Frame-Body, Tokens, Cookies oder Secret-Werte.

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

Während das Gateway Start-Sidecars noch fertigstellt, kann die `connect`-Anfrage
einen wiederholbaren `UNAVAILABLE`-Fehler mit `details.reason` auf
`"startup-sidecars"` und `retryAfterMs` zurückgeben. Clients sollten diese Antwort
innerhalb ihres gesamten Verbindungsbudgets erneut versuchen, statt sie als terminalen
Handshake-Fehler anzuzeigen.

`server`, `features`, `snapshot` und `policy` sind alle vom Schema
(`packages/gateway-protocol/src/schema/frames.ts`) erforderlich. `auth` ist ebenfalls erforderlich und meldet
die ausgehandelte Rolle/die ausgehandelten Scopes. `pluginSurfaceUrls` ist optional und ordnet Plugin-
Oberflächennamen wie `canvas` bereichsbezogenen gehosteten URLs zu.

Bereichsbezogene Plugin-Oberflächen-URLs können ablaufen. Knoten können
`node.pluginSurface.refresh` mit `{ "surface": "canvas" }` aufrufen, um einen frischen
Eintrag in `pluginSurfaceUrls` zu erhalten. Der experimentelle Canvas-Plugin-Refactor unterstützt nicht
den veralteten Kompatibilitätspfad `canvasHostUrl`, `canvasCapability` oder
`node.canvas.capability.refresh`; aktuelle native Clients und
Gateways müssen Plugin-Oberflächen verwenden.

Wenn kein Device-Token ausgegeben wird, meldet `hello-ok.auth` die ausgehandelten
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
`client.mode: "backend"`) dürfen `device` bei direkten Loopback-Verbindungen weglassen, wenn
sie sich mit dem gemeinsamen Gateway-Token/Passwort authentifizieren. Dieser Pfad ist reserviert
für interne RPCs der Steuerungsebene und verhindert, dass veraltete CLI-/Geräte-Pairing-Baselines
lokale Backend-Arbeit wie Subagent-Sitzungsaktualisierungen blockieren. Remote-Clients,
Clients mit Browser-Origin, Knoten-Clients und explizite Device-Token-/Device-Identity-
Clients verwenden weiterhin die normalen Pairing- und Scope-Upgrade-Prüfungen.

Wenn ein Device-Token ausgegeben wird, enthält `hello-ok` außerdem:

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
Baseline-Setup-Code-Connect-Anfrage gibt ein primäres Knoten-Token plus ein begrenztes
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
Konfiguration lesen kann, die er nach dem Bootstrap benötigt. Umfangreichere Admin- und Pairing-Scopes erfordern
ein separates genehmigtes Operator-Pairing oder einen separaten Token-Flow. Clients sollten
`hello-ok.auth.deviceTokens` nur persistieren,
wenn der Connect Bootstrap-Auth über einen vertrauenswürdigen Transport wie `wss://` oder
Loopback-/lokales Pairing verwendet hat.

### Knotenbeispiel

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

Das vollständige Operator-Scope-Modell, Prüfungen zum Genehmigungszeitpunkt und Shared-Secret-
Semantik finden Sie unter [Operator-Scopes](/de/gateway/operator-scopes).

### Rollen

- `operator` = Client der Steuerungsebene (CLI/UI/Automatisierung).
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
Wenn Secrets enthalten sind, sollten Clients die aktiven Talk-Provider-
Anmeldedaten aus `talk.resolved.config.apiKey` lesen; `talk.providers.<id>.apiKey`
bleibt quellförmig und kann ein SecretRef-Objekt oder eine redigierte Zeichenfolge sein.

Vom Plugin registrierte Gateway-RPC-Methoden können ihren eigenen Operator-Scope anfordern, aber
reservierte Kern-Admin-Präfixe (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) werden immer zu `operator.admin` aufgelöst.

Der Methodenscope ist nur die erste Schranke. Einige Slash-Befehle, die über
`chat.send` erreicht werden, wenden zusätzlich strengere Prüfungen auf Befehlsebene an. Zum Beispiel erfordern persistente
`/config set`- und `/config unset`-Schreibvorgänge `operator.admin`.

`node.pair.approve` hat zusätzlich zum
Basis-Methodenscope auch eine zusätzliche Scope-Prüfung zum Genehmigungszeitpunkt:

- Anfragen ohne Befehle: `operator.pairing`
- Anfragen mit Nicht-Exec-Knotenbefehlen: `operator.pairing` + `operator.write`
- Anfragen, die `system.run`, `system.run.prepare` oder `system.which` enthalten:
  `operator.pairing` + `operator.admin`

### Caps/Befehle/Berechtigungen (Knoten)

Knoten deklarieren Capability-Claims zum Connect-Zeitpunkt:

- `caps`: übergeordnete Capability-Kategorien wie `camera`, `canvas`, `screen`,
  `location`, `voice` und `talk`.
- `commands`: Befehls-Allowlist für Invoke.
- `permissions`: granulare Umschalter (z. B. `screen.record`, `camera.capture`).

Das Gateway behandelt diese als **Claims** und erzwingt serverseitige Allowlists.

## Präsenz

- `system-presence` gibt Einträge zurück, die nach Geräteidentität verschlüsselt sind.
- Präsenzeinträge enthalten `deviceId`, `roles` und `scopes`, damit UIs eine einzelne Zeile pro Gerät anzeigen können,
  auch wenn es sowohl als **Operator** als auch als **Knoten** verbunden ist.
- `node.list` enthält optionale Felder `lastSeenAtMs` und `lastSeenReason`. Verbundene Knoten melden
  ihre aktuelle Verbindungszeit als `lastSeenAtMs` mit Grund `connect`; gekoppelte Knoten können auch
  dauerhafte Hintergrundpräsenz melden, wenn ein vertrauenswürdiges Knotenereignis ihre Pairing-Metadaten aktualisiert.

### Hintergrund-Alive-Ereignis des Knotens

Knoten können `node.event` mit `event: "node.presence.alive"` aufrufen, um aufzuzeichnen, dass ein gekoppelter Knoten
während eines Hintergrund-Wake aktiv war, ohne ihn als verbunden zu markieren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` ist eine geschlossene Enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` oder `connect`. Unbekannte Trigger-Zeichenfolgen werden vom Gateway vor der Persistierung zu
`background` normalisiert. Das Ereignis ist nur für authentifizierte Knoten-
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

Vom Server gepushte WebSocket-Broadcast-Ereignisse werden nach Scope beschränkt, sodass Pairing-Scoped- oder reine Knoten-Sitzungen keine Sitzungsinhalte passiv empfangen.

- **Chat-, Agent- und Tool-Ergebnis-Frames** (einschließlich gestreamter `agent`-Ereignisse und Tool-Aufrufergebnisse) erfordern mindestens `operator.read`. Sitzungen ohne `operator.read` überspringen diese Frames vollständig.
- **Plugin-definierte `plugin.*`-Broadcasts** werden auf `operator.write` oder `operator.admin` beschränkt, je nachdem, wie das Plugin sie registriert hat.
- **Status- und Transportereignisse** (`heartbeat`, `presence`, `tick`, Connect-/Disconnect-Lebenszyklus usw.) bleiben uneingeschränkt, damit die Transportintegrität für jede authentifizierte Sitzung beobachtbar bleibt.
- **Unbekannte Broadcast-Ereignisfamilien** werden standardmäßig nach Scope beschränkt (fail-closed), sofern ein registrierter Handler sie nicht explizit lockert.

Jede Client-Verbindung behält ihre eigene Sequenznummer pro Client, sodass Broadcasts eine monotone Reihenfolge auf diesem Socket beibehalten, selbst wenn verschiedene Clients unterschiedliche Scope-gefilterte Teilmengen des Ereignisstroms sehen.

## Häufige RPC-Methodenfamilien

Die öffentliche WS-Oberfläche ist breiter als die obigen Handshake-/Auth-Beispiele. Dies
ist kein generierter Dump — `hello-ok.features.methods` ist eine konservative
Discovery-Liste, die aus `src/gateway/server-methods-list.ts` plus geladenen
Plugin-/Channel-Methodenexporten aufgebaut wird. Behandeln Sie sie als Feature-Discovery, nicht als vollständige
Aufzählung von `src/gateway/server-methods/*.ts`.

  <AccordionGroup>
  <Accordion title="System und Identität">
    - `health` gibt den zwischengespeicherten oder frisch geprüften Gateway-Health-Snapshot zurück.
    - `diagnostics.stability` gibt den aktuellen begrenzten Recorder für Diagnosestabilität zurück. Er speichert operative Metadaten wie Ereignisnamen, Zählwerte, Byte-Größen, Speichermesswerte, Warteschlangen-/Sitzungsstatus, Kanal-/Plugin-Namen und Sitzungs-IDs. Er speichert keine Chat-Texte, Webhook-Bodys, Tool-Ausgaben, Rohdaten von Anfrage- oder Antwort-Bodys, Tokens, Cookies oder geheimen Werte. Operator-Leseumfang ist erforderlich.
    - `status` gibt die Gateway-Zusammenfassung im Stil von `/status` zurück; sensible Felder werden nur für operatorseitige Clients mit Admin-Umfang einbezogen.
    - `gateway.identity.get` gibt die Gateway-Geräteidentität zurück, die von Relay- und Pairing-Flows verwendet wird.
    - `system-presence` gibt den aktuellen Präsenz-Snapshot für verbundene Operator-/Node-Geräte zurück.
    - `system-event` hängt ein Systemereignis an und kann Präsenzkontext aktualisieren/übertragen.
    - `last-heartbeat` gibt das zuletzt persistierte Heartbeat-Ereignis zurück.
    - `set-heartbeats` schaltet die Heartbeat-Verarbeitung auf dem Gateway um.

  </Accordion>

  <Accordion title="Modelle und Nutzung">
    - `models.list` gibt den zur Laufzeit erlaubten Modellkatalog zurück. Übergeben Sie `{ "view": "configured" }` für auswahlgerechte konfigurierte Modelle (zuerst `agents.defaults.models`, dann `models.providers.*.models`) oder `{ "view": "all" }` für den vollständigen Katalog.
    - `usage.status` gibt Provider-Nutzungsfenster/Zusammenfassungen des verbleibenden Kontingents zurück.
    - `usage.cost` gibt aggregierte Kostennutzungs-Zusammenfassungen für einen Datumsbereich zurück.
      Übergeben Sie `agentId` für einen Agenten oder `agentScope: "all"`, um konfigurierte Agenten zu aggregieren.
    - `doctor.memory.status` gibt die Bereitschaft von Vektorspeicher / zwischengespeicherten Einbettungen für den aktiven Standard-Agent-Arbeitsbereich zurück. Übergeben Sie `{ "probe": true }` oder `{ "deep": true }` nur, wenn der Aufrufer ausdrücklich einen Live-Ping an den Embedding-Provider wünscht. Dreaming-fähige Clients können außerdem `{ "agentId": "agent-id" }` übergeben, um Dreaming-Store-Statistiken auf einen ausgewählten Agent-Arbeitsbereich zu begrenzen; ohne `agentId` bleibt der Fallback auf den Standard-Agenten erhalten, und konfigurierte Dreaming-Arbeitsbereiche werden aggregiert.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` und `doctor.memory.dedupeDreamDiary` akzeptieren optionale `{ "agentId": "agent-id" }`-Parameter für Dreaming-Ansichten/-Aktionen ausgewählter Agenten. Wenn `agentId` ausgelassen wird, arbeiten sie im konfigurierten Standard-Agent-Arbeitsbereich.
    - `doctor.memory.remHarness` gibt eine begrenzte, schreibgeschützte REM-Harness-Vorschau für Remote-Control-Plane-Clients zurück. Sie kann Arbeitsbereichspfade, Speicherausschnitte, gerendertes Grounded Markdown und Kandidaten für Deep Promotion enthalten, daher benötigen Aufrufer `operator.read`.
    - `sessions.usage` gibt Nutzungszusammenfassungen pro Sitzung zurück. Übergeben Sie `agentId` für einen
      Agenten oder `agentScope: "all"`, um konfigurierte Agenten zusammen aufzulisten.
    - `sessions.usage.timeseries` gibt Zeitreihen-Nutzung für eine Sitzung zurück.
    - `sessions.usage.logs` gibt Nutzungsprotokolleinträge für eine Sitzung zurück.

  </Accordion>

  <Accordion title="Kanäle und Anmeldehilfen">
    - `channels.status` gibt Statuszusammenfassungen für integrierte und gebündelte Kanäle/Plugins zurück.
    - `channels.logout` meldet einen bestimmten Kanal/ein bestimmtes Konto ab, sofern der Kanal die Abmeldung unterstützt.
    - `web.login.start` startet einen QR-/Web-Anmeldeablauf für den aktuellen QR-fähigen Webkanal-Provider.
    - `web.login.wait` wartet, bis dieser QR-/Web-Anmeldeablauf abgeschlossen ist, und startet bei Erfolg den Kanal.
    - `push.test` sendet einen Test-APNs-Push an einen registrierten iOS-Node.
    - `voicewake.get` gibt die gespeicherten Wake-Word-Trigger zurück.
    - `voicewake.set` aktualisiert Wake-Word-Trigger und überträgt die Änderung.

  </Accordion>

  <Accordion title="Messaging und Logs">
    - `send` ist der direkte RPC für ausgehende Zustellung für kanal-, konto- und threadbezogene Sendungen außerhalb der Chat-Ausführung.
    - `logs.tail` gibt den konfigurierten Gateway-Datei-Log-Tail mit Cursor-/Limit- und Max-Byte-Steuerung zurück.

  </Accordion>

  <Accordion title="Talk und TTS">
    - `talk.catalog` gibt den schreibgeschützten Talk-Provider-Katalog für Sprache, Streaming-Transkription und Echtzeitstimme zurück. Er enthält kanonische Provider-IDs, Registry-Aliase, Labels, den konfigurierten Zustand, ein optionales gruppenweites `ready`-Ergebnis, offengelegte Modell-/Voice-IDs, kanonische Modi, Transporte, Brain-Strategien sowie Echtzeit-Audio-/Capability-Flags, ohne Provider-Secrets zurückzugeben oder die globale Konfiguration zu verändern. Aktuelle Gateways setzen `ready`, nachdem die Runtime-Provider-Auswahl angewendet wurde; Clients sollten dessen Fehlen zur Kompatibilität mit älteren Gateways als nicht verifiziert behandeln.
    - `talk.config` gibt die effektive Talk-Konfigurationsnutzlast zurück; `includeSecrets` erfordert `operator.talk.secrets` (oder `operator.admin`).
    - `talk.session.create` erstellt eine Gateway-eigene Talk-Sitzung für `realtime/gateway-relay`, `transcription/gateway-relay` oder `stt-tts/managed-room`. Für `stt-tts/managed-room` müssen Aufrufer mit `operator.write`, die `sessionKey` übergeben, auch `spawnedBy` für bereichsgebundene Sichtbarkeit des Sitzungsschlüssels übergeben; die Erstellung eines ungebundenen `sessionKey` und `brain: "direct-tools"` erfordern `operator.admin`.
    - `talk.session.join` validiert ein Managed-Room-Sitzungstoken, gibt bei Bedarf `session.ready`- oder `session.replaced`-Ereignisse aus und gibt Raum-/Sitzungsmetadaten sowie aktuelle Talk-Ereignisse ohne Klartext-Token oder gespeicherten Token-Hash zurück.
    - `talk.session.appendAudio` hängt Base64-PCM-Eingabeaudio an Gateway-eigene Echtzeit-Relay- und Transkriptionssitzungen an.
    - `talk.session.startTurn`, `talk.session.endTurn` und `talk.session.cancelTurn` steuern den Managed-Room-Turn-Lebenszyklus mit Ablehnung veralteter Turns, bevor der Zustand gelöscht wird.
    - `talk.session.cancelOutput` stoppt die Audioausgabe des Assistenten, hauptsächlich für VAD-gesteuertes Barge-in in Gateway-Relay-Sitzungen.
    - `talk.session.submitToolResult` schließt einen Provider-Toolaufruf ab, der von einer Gateway-eigenen Echtzeit-Relay-Sitzung ausgegeben wurde. Übergeben Sie `options: { willContinue: true }` für vorläufige Toolausgabe, wenn ein finales Ergebnis folgt, oder `options: { suppressResponse: true }`, wenn das Toolergebnis den Provider-Aufruf erfüllen soll, ohne eine weitere Echtzeit-Assistentenantwort zu starten.
    - `talk.session.steer` sendet Sprachsteuerung für einen aktiven Lauf in eine Gateway-eigene agentengestützte Talk-Sitzung. Es akzeptiert `{ sessionId, text, mode? }`, wobei `mode` `status`, `steer`, `cancel` oder `followup` ist; ein ausgelassener Modus wird aus dem gesprochenen Text klassifiziert.
    - `talk.session.close` schließt eine Gateway-eigene Relay-, Transkriptions- oder Managed-Room-Sitzung und gibt terminale Talk-Ereignisse aus.
    - `talk.mode` setzt/überträgt den aktuellen Talk-Moduszustand für WebChat-/Control-UI-Clients.
    - `talk.client.create` erstellt eine client-eigene Echtzeit-Provider-Sitzung mit `webrtc` oder `provider-websocket`, während der Gateway Konfiguration, Anmeldedaten, Anweisungen und Tool-Richtlinie besitzt.
    - `talk.client.toolCall` ermöglicht client-eigenen Echtzeit-Transporten, Provider-Toolaufrufe an die Gateway-Richtlinie weiterzuleiten. Das erste unterstützte Tool ist `openclaw_agent_consult`; Clients erhalten eine Lauf-ID und warten auf normale Chat-Lebenszyklusereignisse, bevor sie das providerspezifische Toolergebnis übermitteln.
    - `talk.client.steer` sendet Sprachsteuerung für aktive Läufe bei client-eigenen Echtzeit-Transporten. Der Gateway löst den aktiven eingebetteten Lauf aus `sessionKey` auf und gibt ein strukturiertes angenommenes/abgelehntes Ergebnis zurück, statt Steuerung stillschweigend zu verwerfen.
    - `talk.event` ist der einzelne Talk-Ereigniskanal für Echtzeit-, Transkriptions-, STT/TTS-, Managed-Room-, Telefonie- und Meeting-Adapter.
    - `talk.speak` synthetisiert Sprache über den aktiven Talk-Sprach-Provider.
    - `tts.status` gibt den aktivierten TTS-Zustand, den aktiven Provider, Fallback-Provider und den Provider-Konfigurationszustand zurück.
    - `tts.providers` gibt das sichtbare TTS-Provider-Inventar zurück.
    - `tts.enable` und `tts.disable` schalten den TTS-Voreinstellungszustand um.
    - `tts.setProvider` aktualisiert den bevorzugten TTS-Provider.
    - `tts.convert` führt eine einmalige Text-zu-Sprache-Konvertierung aus.

  </Accordion>

  <Accordion title="Secrets, Konfiguration, Update und Assistent">
    - `secrets.reload` löst aktive SecretRefs erneut auf und tauscht den Runtime-Secret-Zustand nur bei vollständigem Erfolg aus.
    - `secrets.resolve` löst kommandozielbezogene Secret-Zuweisungen für eine bestimmte Kommando-/Zielmenge auf.
    - `config.get` gibt den aktuellen Konfigurationssnapshot und Hash zurück.
    - `config.set` schreibt eine validierte Konfigurationsnutzlast.
    - `config.patch` führt ein partielles Konfigurationsupdate zusammen. Destruktive Array-
      Ersetzung erfordert den betroffenen Pfad in `replacePaths`; verschachtelte Arrays
      unter Array-Einträgen verwenden `[]`-Pfade wie `agents.list[].skills`.
    - `config.apply` validiert + ersetzt die vollständige Konfigurationsnutzlast.
    - `config.schema` gibt die Live-Konfigurationsschemanutzlast zurück, die von Control UI und CLI-Tools verwendet wird: Schema, `uiHints`, Version und Generierungsmetadaten, einschließlich Plugin- und Kanalschemametadaten, wenn die Runtime sie laden kann. Das Schema enthält Feldmetadaten `title` / `description`, die aus denselben Labels und Hilfetexten abgeleitet sind, die von der UI verwendet werden, einschließlich verschachtelter Objekt-, Platzhalter-, Array-Element- und `anyOf`- / `oneOf`- / `allOf`-Kompositionszweige, wenn passende Felddokumentation vorhanden ist.
    - `config.schema.lookup` gibt eine pfadbezogene Lookup-Nutzlast für einen Konfigurationspfad zurück: normalisierter Pfad, ein flacher Schemaknoten, passender Hinweis + `hintPath`, optionales `reloadKind` und unmittelbare Kindzusammenfassungen für UI-/CLI-Drilldown. `reloadKind` ist eines von `restart`, `hot` oder `none` und spiegelt den Gateway-Konfigurations-Neuladeplaner für den angeforderten Pfad wider. Lookup-Schemaknoten behalten die benutzerorientierte Dokumentation und gängige Validierungsfelder (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerische/String-/Array-/Objektgrenzen und Flags wie `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Kindzusammenfassungen legen `key`, normalisierten `path`, `type`, `required`, `hasChildren`, optionales `reloadKind` sowie den passenden `hint` / `hintPath` offen.
    - `update.run` führt den Gateway-Updateablauf aus und plant einen Neustart nur, wenn das Update selbst erfolgreich war; Aufrufer mit einer Sitzung können `continuationMessage` einschließen, damit der Start einen Folge-Agenten-Turn über die Neustart-Fortsetzungswarteschlange fortsetzt. Paketmanager-Updates und überwachte Git-Checkout-Updates aus der Steuerungsebene verwenden eine losgelöste Managed-Service-Übergabe, statt den Paketbaum zu ersetzen oder Checkout-/Build-Ausgabe innerhalb des laufenden Gateway zu verändern. Eine gestartete Übergabe gibt `ok: true` mit `result.reason: "managed-service-handoff-started"` und `handoff.status: "started"` zurück; nicht verfügbare oder fehlgeschlagene Übergaben geben `ok: false` mit `managed-service-handoff-unavailable` oder `managed-service-handoff-failed` sowie `handoff.command` zurück, wenn ein manuelles Shell-Update erforderlich ist. Eine nicht verfügbare Übergabe bedeutet, dass OpenClaw keine sichere Supervisor-Grenze oder dauerhafte Service-Identität hat, etwa `OPENCLAW_SYSTEMD_UNIT` für systemd. Während einer gestarteten Übergabe kann der Neustart-Sentinel kurzzeitig `stats.reason: "restart-health-pending"` melden; die Fortsetzung wird verzögert, bis die CLI den neu gestarteten Gateway verifiziert und den finalen `ok`-Sentinel schreibt.
    - `update.status` aktualisiert den neuesten Update-Neustart-Sentinel und gibt ihn zurück, einschließlich der nach dem Neustart laufenden Version, sofern verfügbar.
    - `wizard.start`, `wizard.next`, `wizard.status` und `wizard.cancel` stellen den Onboarding-Assistenten über WS-RPC bereit.

  </Accordion>

  <Accordion title="Agent- und Arbeitsbereich-Hilfen">
    - `agents.list` gibt konfigurierte Agent-Einträge zurück, einschließlich effektivem Modell und Laufzeitmetadaten.
    - `agents.create`, `agents.update` und `agents.delete` verwalten Agent-Datensätze und Arbeitsbereich-Verdrahtung.
    - `agents.files.list`, `agents.files.get` und `agents.files.set` verwalten die Bootstrap-Arbeitsbereichsdateien, die für einen Agent bereitgestellt werden.
    - `tasks.list`, `tasks.get` und `tasks.cancel` stellen das Gateway-Aufgabenjournal für SDK- und Operator-Clients bereit.
    - `artifacts.list`, `artifacts.get` und `artifacts.download` stellen aus Transkripten abgeleitete Artefaktzusammenfassungen und Downloads für einen expliziten Geltungsbereich `sessionKey`, `runId` oder `taskId` bereit.
    - `environments.list` und `environments.status` stellen schreibgeschützte Gateway-lokale und Node-Umgebungserkennung für SDK-Clients bereit.
    - `agent.identity.get` gibt die effektive Assistentenidentität für einen Agent oder eine Sitzung zurück.
    - `agent.wait` wartet, bis ein Lauf abgeschlossen ist, und gibt den terminalen Snapshot zurück, sofern verfügbar.

  </Accordion>

  <Accordion title="Sitzungssteuerung">
    - `sessions.list` gibt den aktuellen Sitzungsindex zurück, einschließlich `agentRuntime`-Metadaten pro Zeile, wenn ein Agent-Laufzeit-Backend konfiguriert ist.
    - `sessions.subscribe` und `sessions.unsubscribe` schalten Abonnements für Sitzungsänderungsereignisse für den aktuellen WS-Client um.
    - `sessions.messages.subscribe` und `sessions.messages.unsubscribe` schalten Transkript-/Nachrichtenereignis-Abonnements für eine Sitzung um.
    - `sessions.preview` gibt begrenzte Transkriptvorschauen für bestimmte Sitzungsschlüssel zurück.
    - `sessions.describe` gibt eine Gateway-Sitzungszeile für einen exakten Sitzungsschlüssel zurück.
    - `sessions.resolve` löst ein Sitzungsziel auf oder kanonisiert es.
    - `sessions.create` erstellt einen neuen Sitzungseintrag.
    - `sessions.send` sendet eine Nachricht in eine bestehende Sitzung.
    - `sessions.steer` ist die Unterbrechen-und-Steuern-Variante für eine aktive Sitzung.
    - `sessions.abort` bricht aktive Arbeit für eine Sitzung ab.
    - `sessions.patch` aktualisiert Sitzungsmetadaten/-Überschreibungen und meldet das aufgelöste kanonische Modell plus effektive `agentRuntime`.
    - `sessions.reset`, `sessions.delete` und `sessions.compact` führen Sitzungswartung aus.
    - `sessions.get` gibt die vollständig gespeicherte Sitzungszeile zurück.
    - Die Chat-Ausführung verwendet weiterhin `chat.history`, `chat.send`, `chat.abort` und `chat.inject`.
    - `chat.message.get` ist der additive, begrenzte Vollnachrichtenleser für einen einzelnen sichtbaren Transkripteintrag.
    - `chat.send` akzeptiert ein einmaliges `fastMode: "auto"`, um den Schnellmodus für Modellaufrufe zu verwenden, die vor dem automatischen Grenzwert gestartet wurden, und spätere Wiederholungs-, Fallback-, Tool-Ergebnis- oder Fortsetzungsaufrufe ohne Schnellmodus zu starten.

  </Accordion>

  <Accordion title="Gerätekopplung und Geräte-Token">
    - `device.pair.list` gibt ausstehende und genehmigte gekoppelte Geräte zurück.
    - `device.pair.approve`, `device.pair.reject` und `device.pair.remove` verwalten Gerätekopplungsdatensätze.
    - `device.token.rotate` rotiert ein gekoppeltes Geräte-Token innerhalb seiner genehmigten Rollen- und Aufrufer-Geltungsbereichsgrenzen.
    - `device.token.revoke` widerruft ein gekoppeltes Geräte-Token innerhalb seiner genehmigten Rollen- und Aufrufer-Geltungsbereichsgrenzen.

  </Accordion>

  <Accordion title="Node-Kopplung, Aufruf und ausstehende Arbeit">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` und `node.pair.verify` decken Node-Kopplung und Bootstrap-Verifizierung ab.
    - `node.list` und `node.describe` geben bekannten/verbundenen Node-Status zurück.
    - `node.rename` aktualisiert eine gekoppelte Node-Bezeichnung.
    - `node.invoke` leitet einen Befehl an einen verbundenen Node weiter.
    - `node.invoke.result` gibt das Ergebnis für eine Aufrufanforderung zurück.
    - `node.event` transportiert von Nodes stammende Ereignisse zurück in den Gateway.
    - `node.pending.pull` und `node.pending.ack` sind die Warteschlangen-APIs für verbundene Nodes.
    - `node.pending.enqueue` und `node.pending.drain` verwalten dauerhafte ausstehende Arbeit für offline/getrennte Nodes.

  </Accordion>

  <Accordion title="Genehmigungsfamilien">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` und `exec.approval.resolve` decken einmalige Exec-Genehmigungsanforderungen plus Suche/Wiedergabe ausstehender Genehmigungen ab.
    - `exec.approval.waitDecision` wartet auf eine ausstehende Exec-Genehmigung und gibt die endgültige Entscheidung zurück (oder `null` bei Timeout).
    - `exec.approvals.get` und `exec.approvals.set` verwalten Gateway-Snapshots der Exec-Genehmigungsrichtlinie.
    - `exec.approvals.node.get` und `exec.approvals.node.set` verwalten Node-lokale Exec-Genehmigungsrichtlinien über Node-Relay-Befehle.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` und `plugin.approval.resolve` decken Plugin-definierte Genehmigungsabläufe ab.

  </Accordion>

  <Accordion title="Automatisierung, Skills und Tools">
    - Automatisierung: `wake` plant eine sofortige oder nächste-Heartbeat-Wecktext-Injektion; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` verwalten geplante Arbeit.
    - `cron.run` bleibt ein Enqueue-artiges RPC für manuelle Läufe.
    - `cron.runs` akzeptiert einen optionalen nicht leeren `runId`-Filter, damit Clients einem einzelnen eingereihten manuellen Lauf folgen können, ohne mit anderen Verlaufseinträgen desselben Jobs zu konkurrieren.
    - Skills und Tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Häufige Ereignisfamilien

- `chat`: UI-Chat-Aktualisierungen wie `chat.inject` und andere rein transkriptbezogene Chat-Ereignisse.
- `session.message`, `session.operation` und `session.tool`: Transkript-, laufende Sitzungsoperations- und Ereignisstream-Aktualisierungen für eine abonnierte Sitzung.
- `sessions.changed`: Sitzungsindex oder Metadaten geändert.
- `presence`: Aktualisierungen von Systempräsenz-Snapshots.
- `tick`: periodisches Keepalive-/Liveness-Ereignis.
- `health`: Aktualisierung des Gateway-Gesundheits-Snapshots.
- `heartbeat`: Aktualisierung des Heartbeat-Ereignisstreams.
- `cron`: Cron-Lauf-/Job-Änderungsereignis.
- `shutdown`: Gateway-Shutdown-Benachrichtigung.
- `node.pair.requested` / `node.pair.resolved`: Node-Kopplungslebenszyklus.
- `node.invoke.request`: Broadcast einer Node-Aufrufanforderung.
- `device.pair.requested` / `device.pair.resolved`: Lebenszyklus gekoppelter Geräte.
- `voicewake.changed`: Wake-Word-Auslöserkonfiguration geändert.
- `exec.approval.requested` / `exec.approval.resolved`: Exec-Genehmigungslebenszyklus.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin-Genehmigungslebenszyklus.

### Node-Hilfsmethoden

- Nodes können `skills.bins` aufrufen, um die aktuelle Liste der ausführbaren Skill-Dateien für Auto-Allow-Prüfungen abzurufen.

### Aufgabenjournal-RPCs

Operator-Clients können Gateway-Hintergrundaufgabendatensätze über die Aufgabenjournal-RPCs prüfen und abbrechen. Diese Methoden geben bereinigte Aufgabenzusammenfassungen zurück, keinen rohen Laufzeitstatus.

- `tasks.list` erfordert `operator.read`.
  - Parameter: optionaler `status` (`"queued"`, `"running"`, `"completed"`, `"failed"`, `"cancelled"` oder `"timed_out"`) oder ein Array dieser Statuswerte, optionaler `agentId`, optionaler `sessionKey`, optionales `limit` von `1` bis `500` und optionaler String `cursor`.
  - Ergebnis: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` erfordert `operator.read`.
  - Parameter: `{ "taskId": string }`.
  - Ergebnis: `{ "task": TaskSummary }`.
  - Fehlende Aufgaben-IDs geben die Not-found-Fehlerform des Gateway zurück.
- `tasks.cancel` erfordert `operator.write`.
  - Parameter: `{ "taskId": string, "reason"?: string }`.
  - Ergebnis:
    `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` meldet, ob das Journal eine passende Aufgabe enthielt. `cancelled` meldet, ob die Laufzeit den Abbruch akzeptiert oder aufgezeichnet hat.

`TaskSummary` enthält `id`, `status` und optionale Metadaten wie `kind`, `runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`, `runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, Zeitstempel, Fortschritt, terminale Zusammenfassung und bereinigten Fehlertext. `agentId` identifiziert den Agent, der die Aufgabe ausführt; `sessionKey` und `ownerKey` bewahren Anforderer- und Steuerungskontext.

### Operator-Hilfsmethoden

- Operatoren können `commands.list` (`operator.read`) aufrufen, um das Laufzeit-
  Befehlsinventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agent-Workspace zu lesen.
  - `scope` steuert, auf welche Oberfläche das primäre `name` zielt:
    - `text` gibt das primäre Text-Befehlstoken ohne führendes `/` zurück
    - `native` und der Standardpfad `both` geben Provider-bewusste native Namen zurück,
      sofern verfügbar
  - `textAliases` enthält exakte Slash-Aliasse wie `/model` und `/m`.
  - `nativeName` enthält den Provider-bewussten nativen Befehlsnamen, sofern vorhanden.
  - `provider` ist optional und wirkt sich nur auf native Benennung sowie die
    Verfügbarkeit nativer Plugin-Befehle aus.
  - `includeArgs=false` lässt serialisierte Argumentmetadaten in der Antwort weg.
- Operatoren können `tools.catalog` (`operator.read`) aufrufen, um den Laufzeit-Toolkatalog für einen
  Agenten abzurufen. Die Antwort enthält gruppierte Tools und Herkunftsmetadaten:
  - `source`: `core` oder `plugin`
  - `pluginId`: Plugin-Eigentümer, wenn `source="plugin"`
  - `optional`: ob ein Plugin-Tool optional ist
- Operatoren können `tools.effective` (`operator.read`) aufrufen, um das zur Laufzeit wirksame Tool-
  Inventar für eine Sitzung abzurufen.
  - `sessionKey` ist erforderlich.
  - Das Gateway leitet vertrauenswürdigen Laufzeitkontext serverseitig aus der Sitzung ab, statt
    vom Aufrufer bereitgestellten Authentifizierungs- oder Zustellungskontext zu akzeptieren.
  - Die Antwort ist eine sitzungsbezogene, serverseitig abgeleitete Projektion des aktiven Inventars,
    einschließlich Core-, Plugin-, Kanal- und bereits entdeckter MCP-Server-Tools.
  - `tools.effective` ist für MCP schreibgeschützt: Es kann einen warmen Sitzungs-MCP-Katalog durch die
    finale Tool-Policy projizieren, erstellt aber keine MCP-Runtimes, verbindet keine Transporte und gibt kein
    `tools/list` aus. Wenn kein passender warmer Katalog vorhanden ist, kann die Antwort einen Hinweis wie
    `mcp-not-yet-connected`, `mcp-not-yet-listed` oder `mcp-stale-catalog` enthalten.
  - Effektive Tool-Einträge verwenden `source="core"`, `source="plugin"`, `source="channel"` oder
    `source="mcp"`.
- Operatoren können `tools.invoke` (`operator.write`) aufrufen, um ein verfügbares Tool über denselben
  Gateway-Policy-Pfad wie `/tools/invoke` aufzurufen.
  - `name` ist erforderlich. `args`, `sessionKey`, `agentId`, `confirm` und
    `idempotencyKey` sind optional.
  - Wenn sowohl `sessionKey` als auch `agentId` vorhanden sind, muss der aufgelöste Sitzungs-Agent mit
    `agentId` übereinstimmen.
  - Nur Eigentümern vorbehaltene Core-Wrapper wie `cron`, `gateway` und `nodes` erfordern
    Eigentümer-/Admin-Identität (`operator.admin`), auch wenn die Methode `tools.invoke`
    selbst `operator.write` ist.
  - Die Antwort ist ein SDK-orientierter Umschlag mit `ok`, `toolName`, optionalem `output` und typisierten
    `error`-Feldern. Genehmigungs- oder Policy-Ablehnungen geben `ok:false` in der Nutzlast zurück, statt
    die Gateway-Tool-Policy-Pipeline zu umgehen.
- Operatoren können `skills.status` (`operator.read`) aufrufen, um das sichtbare
  Skills-Inventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agent-Workspace zu lesen.
  - Die Antwort enthält Eignung, fehlende Anforderungen, Konfigurationsprüfungen und
    bereinigte Installationsoptionen, ohne rohe Geheimniswerte offenzulegen.
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
    exakt dekodierten Offset an.
  - `skills.upload.commit({ uploadId, sha256? })` verifiziert die endgültige Größe und
    SHA-256. Commit finalisiert nur den Upload; es installiert den Skill nicht.
  - Hochgeladene Skill-Archive sind ZIP-Archive mit einer `SKILL.md`-Wurzel. Der
    interne Verzeichnisname des Archivs wählt niemals das Installationsziel aus.
- Operatoren können `skills.install` (`operator.admin`) in drei Modi aufrufen:
  - ClawHub-Modus: `{ source: "clawhub", slug, version?, force? }` installiert einen
    Skill-Ordner in das `skills/`-Verzeichnis des Standard-Agent-Workspace.
  - Upload-Modus: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installiert einen festgeschriebenen Upload in das Verzeichnis `skills/<slug>`
    des Standard-Agent-Workspace. Der Slug- und Force-Wert muss mit der ursprünglichen
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
    Standard-Agent-Workspace.
  - Der Konfigurationsmodus patcht `skills.entries.<skillKey>`-Werte wie `enabled`,
    `apiKey` und `env`.

### `models.list`-Ansichten

`models.list` akzeptiert einen optionalen Parameter `view`:

- Weggelassen oder `"default"`: aktuelles Laufzeitverhalten. Wenn `agents.defaults.models` konfiguriert ist, ist die Antwort der erlaubte Katalog, einschließlich dynamisch entdeckter Modelle für `provider/*`-Einträge. Andernfalls ist die Antwort der vollständige Gateway-Katalog.
- `"configured"`: für Picker dimensioniertes Verhalten. Wenn `agents.defaults.models` konfiguriert ist, hat es weiterhin Vorrang, einschließlich Provider-bezogener Discovery für `provider/*`-Einträge. Ohne Allowlist verwendet die Antwort explizite `models.providers.*.models`-Einträge und fällt nur dann auf den vollständigen Katalog zurück, wenn keine konfigurierten Modellzeilen vorhanden sind.
- `"all"`: vollständiger Gateway-Katalog, wobei `agents.defaults.models` umgangen wird. Verwenden Sie dies für Diagnose- und Discovery-UIs, nicht für normale Modell-Picker.

## Exec-Genehmigungen

- Wenn eine Exec-Anfrage Genehmigung benötigt, sendet das Gateway `exec.approval.requested`.
- Operator-Clients lösen dies durch Aufruf von `exec.approval.resolve` auf (erfordert Scope `operator.approvals`).
- Für `host=node` muss `exec.approval.request` `systemRunPlan` enthalten (kanonische `argv`/`cwd`/`rawCommand`/Sitzungsmetadaten). Anfragen ohne `systemRunPlan` werden abgelehnt.
- Nach der Genehmigung verwenden weitergeleitete `node.invoke system.run`-Aufrufe diesen kanonischen
  `systemRunPlan` als maßgeblichen Befehls-/cwd-/Sitzungskontext.
- Wenn ein Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` zwischen Vorbereitung und der final genehmigten `system.run`-Weiterleitung mutiert, lehnt das
  Gateway die Ausführung ab, statt der mutierten Nutzlast zu vertrauen.

## Agent-Zustellungsfallback

- `agent`-Anfragen können `deliver=true` enthalten, um ausgehende Zustellung anzufordern.
- `bestEffortDeliver=false` behält striktes Verhalten bei: nicht auflösbare oder nur interne Zustellungsziele geben `INVALID_REQUEST` zurück.
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

Der Referenzclient in `src/gateway/client.ts` verwendet diese Standardwerte. Die Werte sind
über Protokoll v4 hinweg stabil und die erwartete Baseline für Drittanbieter-Clients.

| Konstante                                 | Standardwert                                          | Quelle                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                 |
| Anfrage-Timeout (pro RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth-/Connect-Challenge-Timeout        | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (config/env kann das gekoppelte Server-/Client-Budget erhöhen) |
| Initiales Reconnect-Backoff               | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maximales Reconnect-Backoff               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-Retry-Begrenzung nach Device-Token-Close | `250` ms                                          | `src/gateway/client.ts`                                                                    |
| Grace-Period vor `terminate()` bei Force-Stop | `250` ms                                          | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Standard-Timeout für `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Standard-Tick-Intervall (vor `hello-ok`)  | `30_000` ms                                           | `src/gateway/client.ts`                                                                    |
| Tick-Timeout-Close                        | Code `4000`, wenn Stille `tickIntervalMs * 2` überschreitet | `src/gateway/client.ts`                                                               |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Der Server bewirbt die effektiven Werte `policy.tickIntervalMs`, `policy.maxPayload`
und `policy.maxBufferedBytes` in `hello-ok`; Clients sollten diese Werte beachten
statt der Standardwerte vor dem Handshake.

## Auth

- Shared-Secret-Gateway-Auth verwendet `connect.params.auth.token` oder
  `connect.params.auth.password`, abhängig vom konfigurierten Auth-Modus.
- Identitätstragende Modi wie Tailscale Serve
  (`gateway.auth.allowTailscale: true`) oder nicht-loopback
  `gateway.auth.mode: "trusted-proxy"` erfüllen die Connect-Auth-Prüfung über
  Request-Header statt über `connect.params.auth.*`.
- Private-Ingress `gateway.auth.mode: "none"` überspringt Shared-Secret-Connect-Auth
  vollständig; stellen Sie diesen Modus nicht auf öffentlichem/nicht vertrauenswürdigem Ingress bereit.
- Nach dem Pairing stellt der Gateway ein **Geräte-Token** aus, das auf Rolle
  + Scopes der Verbindung beschränkt ist. Es wird in `hello-ok.auth.deviceToken`
  zurückgegeben und sollte vom Client für zukünftige Verbindungen dauerhaft gespeichert werden.
- Clients sollten das primäre `hello-ok.auth.deviceToken` nach jeder
  erfolgreichen Verbindung dauerhaft speichern.
- Eine erneute Verbindung mit diesem **gespeicherten** Geräte-Token sollte auch den gespeicherten
  genehmigten Scope-Satz für dieses Token wiederverwenden. Dadurch bleiben bereits gewährte Lese-/Probe-/Status-Zugriffe
  erhalten, und erneute Verbindungen werden nicht stillschweigend auf einen
  engeren, impliziten reinen Admin-Scope reduziert.
- Clientseitiger Aufbau der Connect-Auth (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` ist orthogonal und wird immer weitergeleitet, wenn es gesetzt ist.
  - `auth.token` wird in Prioritätsreihenfolge befüllt: zuerst explizites Shared-Token,
    dann ein explizites `deviceToken`, dann ein gespeichertes gerätespezifisches Token (indiziert nach
    `deviceId` + `role`).
  - `auth.bootstrapToken` wird nur gesendet, wenn keiner der obigen Werte ein
    `auth.token` ergeben hat. Ein Shared-Token oder ein beliebiges aufgelöstes Geräte-Token unterdrückt es.
  - Die automatische Hochstufung eines gespeicherten Geräte-Tokens beim einmaligen
    `AUTH_TOKEN_MISMATCH`-Wiederholungsversuch ist auf **vertrauenswürdige Endpunkte beschränkt**:
    loopback oder `wss://` mit einem angepinnten `tlsFingerprint`. Öffentliches `wss://`
    ohne Pinning qualifiziert sich nicht.
- Der eingebaute Setup-Code-Bootstrap gibt das primäre Node-`hello-ok.auth.deviceToken`
  plus ein begrenztes Operator-Token in `hello-ok.auth.deviceTokens` für vertrauenswürdige
  mobile Übergabe zurück. Das Operator-Token enthält `operator.talk.secrets` für native
  Talk-Konfigurationslesevorgänge und schließt `operator.admin` und `operator.pairing` aus.
- Während ein nicht-baseline Setup-Code-Bootstrap auf Genehmigung wartet, enthalten `PAIRING_REQUIRED`-Details
  `recommendedNextStep: "wait_then_retry"`, `retryable: true`
  und `pauseReconnect: false`. Clients sollten die erneute Verbindung mit demselben
  Bootstrap-Token fortsetzen, bis die Anfrage genehmigt ist oder das Token ungültig wird.
- Speichern Sie `hello-ok.auth.deviceTokens` nur dauerhaft, wenn die Verbindung Bootstrap-Auth
  über einen vertrauenswürdigen Transport wie `wss://` oder loopback/lokales Pairing verwendet hat.
- Wenn ein Client ein **explizites** `deviceToken` oder explizite `scopes` angibt, bleibt dieser
  vom Aufrufer angeforderte Scope-Satz maßgeblich; zwischengespeicherte Scopes werden nur
  wiederverwendet, wenn der Client das gespeicherte gerätespezifische Token wiederverwendet.
- Geräte-Token können über `device.token.rotate` und
  `device.token.revoke` rotiert/widerrufen werden (erfordert den Scope `operator.pairing`). Das Rotieren oder
  Widerrufen einer Node- oder anderen Nicht-Operator-Rolle erfordert außerdem `operator.admin`.
- `device.token.rotate` gibt Rotationsmetadaten zurück. Es gibt das Ersatz-Bearer-Token
  nur bei Same-Device-Aufrufen zurück, die bereits mit
  diesem Geräte-Token authentifiziert sind, damit tokenbasierte Clients ihren Ersatz dauerhaft speichern können, bevor
  sie sich erneut verbinden. Shared/Admin-Rotationen geben das Bearer-Token nicht zurück.
- Token-Ausstellung, -Rotation und -Widerruf bleiben auf den genehmigten Rollensatz beschränkt,
  der im Pairing-Eintrag dieses Geräts aufgezeichnet ist; Token-Mutation kann keine Geräterolle erweitern oder
  adressieren, die nie durch Pairing-Genehmigung gewährt wurde.
- Bei Token-Sitzungen gekoppelter Geräte ist die Geräteverwaltung selbstbeschränkt, sofern der
  Aufrufer nicht auch `operator.admin` hat: Nicht-Admin-Aufrufer können nur das
  Operator-Token für ihren **eigenen** Geräteeintrag verwalten. Node- und andere Nicht-Operator-
  Tokenverwaltung ist nur Admins vorbehalten, selbst für das eigene Gerät des Aufrufers.
- `device.token.rotate` und `device.token.revoke` prüfen außerdem den Ziel-Operator-
  Token-Scope-Satz gegen die aktuellen Sitzungsscopes des Aufrufers. Nicht-Admin-Aufrufer
  können kein umfassenderes Operator-Token rotieren oder widerrufen, als sie bereits besitzen.
- Auth-Fehler enthalten `error.details.code` plus Wiederherstellungshinweise:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Clientverhalten bei `AUTH_TOKEN_MISMATCH`:
  - Vertrauenswürdige Clients dürfen einen begrenzten Wiederholungsversuch mit einem zwischengespeicherten gerätespezifischen Token ausführen.
  - Wenn dieser Wiederholungsversuch fehlschlägt, sollten Clients automatische Wiederverbindungsschleifen beenden und Hinweise zu erforderlichen Operator-Aktionen anzeigen.
- `AUTH_SCOPE_MISMATCH` bedeutet, dass das Geräte-Token erkannt wurde, aber die
  angeforderte Rolle/die angeforderten Scopes nicht abdeckt. Clients sollten dies nicht als ungültiges Token darstellen;
  fordern Sie den Operator auf, erneut zu pairen oder den engeren/weiteren Scope-Vertrag zu genehmigen.

## Geräteidentität + Pairing

- Nodes sollten eine stabile Geräteidentität (`device.id`) enthalten, die aus einem
  Schlüsselpaar-Fingerprint abgeleitet ist.
- Gateways stellen Token pro Gerät + Rolle aus.
- Pairing-Genehmigungen sind für neue Geräte-IDs erforderlich, sofern lokale automatische Genehmigung
  nicht aktiviert ist.
- Automatische Pairing-Genehmigung konzentriert sich auf direkte local loopback-Verbindungen.
- OpenClaw hat außerdem einen engen backend-/containerlokalen Self-Connect-Pfad für
  vertrauenswürdige Shared-Secret-Hilfsflows.
- Same-Host-Tailnet- oder LAN-Verbindungen werden für Pairing weiterhin als remote behandelt und
  erfordern eine Genehmigung.
- WS-Clients enthalten normalerweise während `connect` eine `device`-Identität (Operator +
  Node). Die einzigen gerätelosen Operator-Ausnahmen sind explizite Vertrauenspfade:
  - `gateway.controlUi.allowInsecureAuth=true` für nur localhost-unsichere HTTP-Kompatibilität.
  - erfolgreiche `gateway.auth.mode: "trusted-proxy"`-Operator-Control-UI-Auth.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (Break-Glass, schwere Sicherheitsherabstufung).
  - direkte loopback-`gateway-client`-Backend-RPCs auf dem reservierten internen
    Hilfspad.
- Das Weglassen der Geräteidentität hat Scope-Auswirkungen. Wenn eine gerätelose Operator-
  Verbindung über einen expliziten Vertrauenspfad erlaubt wird, löscht OpenClaw dennoch
  selbst deklarierte Scopes auf einen leeren Satz, sofern dieser Pfad keine benannte
  Scope-Erhaltungs-Ausnahme hat. Scope-gesteuerte Methoden schlagen dann mit
  `missing scope` fehl.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` ist ein Control-UI-
  Break-Glass-Pfad zur Scope-Erhaltung. Er gewährt beliebigen
  benutzerdefinierten Backend- oder CLI-förmigen WebSocket-Clients keine Scopes.
- Der reservierte direkte loopback-`gateway-client`-Backend-Hilfspfad erhält
  Scopes nur für interne lokale Control-Plane-RPCs; benutzerdefinierte Backend-IDs erhalten
  diese Ausnahme nicht.
- Alle Verbindungen müssen die vom Server bereitgestellte `connect.challenge`-Nonce signieren.

### Diagnose für Geräte-Auth-Migration

Für Legacy-Clients, die noch Signierverhalten vor Challenge verwenden, gibt `connect` jetzt
`DEVICE_AUTH_*`-Detailcodes unter `error.details.code` mit einem stabilen `error.details.reason` zurück.

Häufige Migrationsfehler:

| Meldung                     | details.code                     | details.reason           | Bedeutung                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client hat `device.nonce` weggelassen (oder leer gesendet). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client hat mit einer veralteten/falschen Nonce signiert. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signatur-Payload stimmt nicht mit v2-Payload überein. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Signierter Zeitstempel liegt außerhalb der zulässigen Abweichung. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` stimmt nicht mit dem Public-Key-Fingerprint überein. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public-Key-Format/Kanonisierung fehlgeschlagen.    |

Migrationsziel:

- Warten Sie immer auf `connect.challenge`.
- Signieren Sie den v2-Payload, der die Server-Nonce enthält.
- Senden Sie dieselbe Nonce in `connect.params.device.nonce`.
- Der bevorzugte Signatur-Payload ist `v3`, der zusätzlich zu Geräte-/Client-/Rollen-/Scopes-/Token-/Nonce-Feldern
  `platform` und `deviceFamily` bindet.
- Legacy-`v2`-Signaturen bleiben aus Kompatibilitätsgründen akzeptiert, aber das Metadaten-Pinning
  gekoppelter Geräte steuert weiterhin die Befehlsrichtlinie bei erneuter Verbindung.

## TLS + Pinning

- TLS wird für WS-Verbindungen unterstützt.
- Clients können optional den Fingerprint des Gateway-Zertifikats anpinnen (siehe `gateway.tls`-
  Konfiguration plus `gateway.remote.tlsFingerprint` oder CLI `--tls-fingerprint`).

## Scope

Dieses Protokoll stellt die **vollständige Gateway-API** bereit (Status, Kanäle, Modelle, Chat,
Agent, Sitzungen, Nodes, Genehmigungen usw.). Die genaue Oberfläche wird durch die
TypeBox-Schemas in `packages/gateway-protocol/src/schema.ts` definiert.

## Verwandt

- [Bridge-Protokoll](/de/gateway/bridge-protocol)
- [Gateway-Runbook](/de/gateway)
