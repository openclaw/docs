---
read_when:
    - Implementierung oder Aktualisierung von Gateway-WS-Clients
    - Fehlersuche bei Protokollinkompatibilitäten oder Verbindungsfehlern
    - Protokollschema/-modelle neu generieren
summary: 'Gateway-WebSocket-Protokoll: Handshake, Frames, Versionierung'
title: Gateway-Protokoll
x-i18n:
    generated_at: "2026-05-07T13:17:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75580b3ad8b2a511cf53975b8d734d18db88bcbfe33bd62c360c24333d65d1c6
    source_path: gateway/protocol.md
    workflow: 16
---

Das Gateway-WS-Protokoll ist die **einzige Steuerungsebene + Node-Transport** für
OpenClaw. Alle Clients (CLI, Web-UI, macOS-App, iOS-/Android-Nodes, headless
Nodes) verbinden sich über WebSocket und deklarieren beim Handshake ihre **Rolle** + ihren **Scope**.

## Transport

- WebSocket, Text-Frames mit JSON-Payloads.
- Der erste Frame **muss** eine `connect`-Anfrage sein.
- Pre-Connect-Frames sind auf 64 KiB begrenzt. Nach einem erfolgreichen Handshake sollten Clients
  die Grenzwerte `hello-ok.policy.maxPayload` und
  `hello-ok.policy.maxBufferedBytes` einhalten. Wenn Diagnosen aktiviert sind,
  erzeugen übergroße eingehende Frames und langsame ausgehende Puffer `payload.large`-Ereignisse,
  bevor das Gateway den betroffenen Frame schließt oder verwirft. Diese Ereignisse enthalten
  Größen, Grenzwerte, Oberflächen und sichere Ursachencodes. Sie enthalten nicht den Nachrichtentext,
  Inhalte von Anhängen, den rohen Frame-Body, Tokens, Cookies oder geheime Werte.

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

Während das Gateway den Start von Sidecars noch abschließt, kann die `connect`-Anfrage
einen wiederholbaren `UNAVAILABLE`-Fehler zurückgeben, bei dem `details.reason` auf
`"startup-sidecars"` und `retryAfterMs` gesetzt ist. Clients sollten diese Antwort
innerhalb ihres gesamten Verbindungsbudgets erneut versuchen, statt sie als endgültigen
Handshake-Fehler anzuzeigen.

`server`, `features`, `snapshot` und `policy` sind alle durch das Schema erforderlich
(`src/gateway/protocol/schema/frames.ts`). `auth` ist ebenfalls erforderlich und meldet
die ausgehandelte Rolle/die ausgehandelten Scopes. `pluginSurfaceUrls` ist optional und ordnet Plugin-
Oberflächennamen wie `canvas` scoped gehosteten URLs zu.

Scoped Plugin-Oberflächen-URLs können ablaufen. Nodes können
`node.pluginSurface.refresh` mit `{ "surface": "canvas" }` aufrufen, um einen frischen
Eintrag in `pluginSurfaceUrls` zu erhalten. Das experimentelle Refactoring des Canvas-Plugins
unterstützt nicht den veralteten Kompatibilitätspfad `canvasHostUrl`, `canvasCapability` oder
`node.canvas.capability.refresh`; aktuelle native Clients und Gateways müssen Plugin-Oberflächen verwenden.

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

Vertrauenswürdige Same-Process-Backend-Clients (`client.id: "gateway-client"`,
`client.mode: "backend"`) dürfen `device` bei direkten Loopback-Verbindungen weglassen, wenn
sie sich mit dem gemeinsam genutzten Gateway-Token/Passwort authentifizieren. Dieser Pfad ist für
interne RPCs der Steuerungsebene reserviert und verhindert, dass veraltete CLI-/Gerätekopplungs-Baselines
lokale Backend-Arbeit wie Aktualisierungen von Subagent-Sitzungen blockieren. Remote-Clients,
Clients mit Browser-Origin, Node-Clients und explizite Geräte-Token-/Geräteidentitäts-
Clients verwenden weiterhin die normalen Kopplungs- und Scope-Upgrade-Prüfungen.

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

Während der vertrauenswürdigen Bootstrap-Übergabe kann `hello-ok.auth` auch zusätzliche
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

Für den integrierten Node-/Operator-Bootstrap-Ablauf bleibt das primäre Node-Token
bei `scopes: []`, und jedes übergebene Operator-Token bleibt auf die Bootstrap-
Operator-Allowlist begrenzt (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap-Scope-Prüfungen bleiben
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

Das vollständige Operator-Scope-Modell, Prüfungen zum Genehmigungszeitpunkt und die
Semantik geteilter Geheimnisse finden Sie unter [Operator-Scopes](/de/gateway/operator-scopes).

### Rollen

- `operator` = Client der Steuerungsebene (CLI/UI/Automatisierung).
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
reservierte Kern-Admin-Präfixe (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) werden immer zu `operator.admin` aufgelöst.

Der Methoden-Scope ist nur die erste Schranke. Einige Slash-Commands, die über
`chat.send` erreicht werden, wenden zusätzlich strengere Prüfungen auf Command-Ebene an. Zum Beispiel erfordern persistente
`/config set`- und `/config unset`-Schreibvorgänge `operator.admin`.

`node.pair.approve` hat zusätzlich zum Basis-Methoden-Scope eine zusätzliche Scope-Prüfung zum Genehmigungszeitpunkt:

- Anfragen ohne Commands: `operator.pairing`
- Anfragen mit Nicht-Exec-Node-Commands: `operator.pairing` + `operator.write`
- Anfragen, die `system.run`, `system.run.prepare` oder `system.which` enthalten:
  `operator.pairing` + `operator.admin`

### Caps/Commands/Berechtigungen (Node)

Nodes deklarieren Capability-Claims beim Verbindungsaufbau:

- `caps`: übergeordnete Capability-Kategorien wie `camera`, `canvas`, `screen`,
  `location`, `voice` und `talk`.
- `commands`: Command-Allowlist für Invoke.
- `permissions`: granulare Umschalter (z. B. `screen.record`, `camera.capture`).

Das Gateway behandelt diese als **Claims** und erzwingt serverseitige Allowlists.

## Präsenz

- `system-presence` gibt Einträge zurück, die nach Geräteidentität geschlüsselt sind.
- Präsenzeinträge enthalten `deviceId`, `roles` und `scopes`, damit UIs eine einzelne Zeile pro Gerät anzeigen können,
  selbst wenn es sich sowohl als **Operator** als auch als **Node** verbindet.
- `node.list` enthält optionale Felder `lastSeenAtMs` und `lastSeenReason`. Verbundene Nodes melden
  ihre aktuelle Verbindungszeit als `lastSeenAtMs` mit dem Grund `connect`; gekoppelte Nodes können auch
  dauerhafte Hintergrundpräsenz melden, wenn ein vertrauenswürdiges Node-Ereignis ihre Kopplungsmetadaten aktualisiert.

### Node-Hintergrund-Alive-Ereignis

Nodes können `node.event` mit `event: "node.presence.alive"` aufrufen, um festzuhalten, dass ein gekoppelter Node
während eines Hintergrund-Wake aktiv war, ohne ihn als verbunden zu markieren.

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

## Scoping von Broadcast-Ereignissen

Serverseitig gepushte WebSocket-Broadcast-Ereignisse sind scope-gated, damit Sitzungen mit Pairing-Scope oder nur Node-Sitzungen keine Sitzungsinhalte passiv empfangen.

- **Chat-, Agent- und Tool-Ergebnis-Frames** (einschließlich gestreamter `agent`-Ereignisse und Tool-Call-Ergebnisse) erfordern mindestens `operator.read`. Sitzungen ohne `operator.read` überspringen diese Frames vollständig.
- **Vom Plugin definierte `plugin.*`-Broadcasts** werden je nach Registrierung durch das Plugin auf `operator.write` oder `operator.admin` beschränkt.
- **Status- und Transportereignisse** (`heartbeat`, `presence`, `tick`, Connect-/Disconnect-Lebenszyklus usw.) bleiben uneingeschränkt, damit die Transportintegrität für jede authentifizierte Sitzung beobachtbar bleibt.
- **Unbekannte Broadcast-Ereignisfamilien** sind standardmäßig scope-gated (fail-closed), sofern ein registrierter Handler sie nicht ausdrücklich lockert.

Jede Client-Verbindung behält ihre eigene Sequenznummer pro Client, sodass Broadcasts die monotone Reihenfolge auf diesem Socket beibehalten, selbst wenn verschiedene Clients unterschiedliche scope-gefilterte Teilmengen des Ereignisstroms sehen.

## Häufige RPC-Methodenfamilien

Die öffentliche WS-Oberfläche ist breiter als die obigen Handshake-/Auth-Beispiele. Dies
ist kein generierter Dump — `hello-ok.features.methods` ist eine konservative
Discovery-Liste, die aus `src/gateway/server-methods-list.ts` plus geladenen
Plugin-/Channel-Methodenexporten erstellt wird. Behandeln Sie sie als Feature-Discovery, nicht als vollständige
Aufzählung von `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System und Identität">
    - `health` gibt den zwischengespeicherten oder frisch geprüften Gateway-Health-Snapshot zurück.
    - `diagnostics.stability` gibt den aktuellen begrenzten Diagnose-Stabilitätsrekorder zurück. Er speichert betriebliche Metadaten wie Ereignisnamen, Zählwerte, Bytegrößen, Speicherwerte, Queue-/Sitzungsstatus, Channel-/Plugin-Namen und Sitzungs-IDs. Er speichert keinen Chat-Text, Webhook-Bodies, Tool-Ausgaben, rohe Anfrage- oder Antwort-Bodies, Tokens, Cookies oder geheime Werte. Operator-Read-Scope ist erforderlich.
    - `status` gibt die Gateway-Zusammenfassung im Stil von `/status` zurück; sensible Felder werden nur für Operator-Clients mit Admin-Scope einbezogen.
    - `gateway.identity.get` gibt die Gateway-Geräteidentität zurück, die von Relay- und Pairing-Flows verwendet wird.
    - `system-presence` gibt den aktuellen Präsenz-Snapshot für verbundene Operator-/Node-Geräte zurück.
    - `system-event` fügt ein Systemereignis an und kann Präsenzkontext aktualisieren/broadcasten.
    - `last-heartbeat` gibt das zuletzt persistierte Heartbeat-Ereignis zurück.
    - `set-heartbeats` schaltet die Heartbeat-Verarbeitung auf dem Gateway um.

  </Accordion>

  <Accordion title="Modelle und Nutzung">
    - `models.list` gibt den zur Laufzeit zugelassenen Modellkatalog zurück. Übergeben Sie `{ "view": "configured" }` für auswahlgerechte konfigurierte Modelle (`agents.defaults.models` zuerst, dann `models.providers.*.models`) oder `{ "view": "all" }` für den vollständigen Katalog.
    - `usage.status` gibt Provider-Nutzungsfenster und Zusammenfassungen des verbleibenden Kontingents zurück.
    - `usage.cost` gibt aggregierte Kostennutzungszusammenfassungen für einen Datumsbereich zurück.
    - `doctor.memory.status` gibt die Bereitschaft von Vektorspeicher / zwischengespeicherten Embeddings für den aktiven Standard-Agenten-Arbeitsbereich zurück. Übergeben Sie `{ "probe": true }` oder `{ "deep": true }` nur, wenn der Aufrufer ausdrücklich einen Live-Ping an den Embedding-Provider wünscht.
    - `doctor.memory.remHarness` gibt eine begrenzte, schreibgeschützte REM-Harness-Vorschau für Remote-Control-Plane-Clients zurück. Sie kann Arbeitsbereichspfade, Speicherausschnitte, gerendertes fundiertes Markdown und Kandidaten für Deep-Promotion enthalten, daher benötigen Aufrufer `operator.read`.
    - `sessions.usage` gibt Nutzungszusammenfassungen pro Sitzung zurück.
    - `sessions.usage.timeseries` gibt Zeitreihen zur Nutzung für eine Sitzung zurück.
    - `sessions.usage.logs` gibt Nutzungsprotokolleinträge für eine Sitzung zurück.

  </Accordion>

  <Accordion title="Kanäle und Login-Hilfen">
    - `channels.status` gibt Statuszusammenfassungen für eingebaute + gebündelte Kanäle/Plugins zurück.
    - `channels.logout` meldet einen bestimmten Kanal/ein bestimmtes Konto ab, sofern der Kanal die Abmeldung unterstützt.
    - `web.login.start` startet einen QR-/Web-Login-Ablauf für den aktuellen QR-fähigen Web-Kanal-Provider.
    - `web.login.wait` wartet, bis dieser QR-/Web-Login-Ablauf abgeschlossen ist, und startet den Kanal bei Erfolg.
    - `push.test` sendet einen Test-APNs-Push an einen registrierten iOS-Node.
    - `voicewake.get` gibt die gespeicherten Wake-Word-Auslöser zurück.
    - `voicewake.set` aktualisiert Wake-Word-Auslöser und sendet die Änderung.

  </Accordion>

  <Accordion title="Messaging und Protokolle">
    - `send` ist der direkte RPC für ausgehende Zustellung für kanal-/konto-/threadbezogene Sends außerhalb des Chat-Runners.
    - `logs.tail` gibt den konfigurierten Gateway-Dateiprotokoll-Tail mit Cursor-/Limit- und Max-Byte-Steuerung zurück.

  </Accordion>

  <Accordion title="Talk und TTS">
    - `talk.catalog` gibt den schreibgeschützten Talk-Provider-Katalog für Sprache, Streaming-Transkription und Echtzeitstimme zurück. Er enthält Provider-IDs, Labels, konfigurierten Zustand, offengelegte Modell-/Voice-IDs, kanonische Modi, Transporte, Brain-Strategien und Echtzeit-Audio-/Capability-Flags, ohne Provider-Secrets zurückzugeben oder die globale Konfiguration zu verändern.
    - `talk.config` gibt die effektive Talk-Konfigurationsnutzlast zurück; `includeSecrets` erfordert `operator.talk.secrets` (oder `operator.admin`).
    - `talk.session.create` erstellt eine Gateway-eigene Talk-Sitzung für `realtime/gateway-relay`, `transcription/gateway-relay` oder `stt-tts/managed-room`. `brain: "direct-tools"` erfordert `operator.admin`.
    - `talk.session.join` validiert ein Managed-Room-Sitzungstoken, gibt bei Bedarf `session.ready`- oder `session.replaced`-Ereignisse aus und gibt Raum-/Sitzungsmetadaten sowie aktuelle Talk-Ereignisse ohne Klartexttoken oder gespeicherten Token-Hash zurück.
    - `talk.session.appendAudio` hängt base64-PCM-Eingabeaudio an Gateway-eigene Echtzeit-Relay- und Transkriptionssitzungen an.
    - `talk.session.startTurn`, `talk.session.endTurn` und `talk.session.cancelTurn` steuern den Managed-Room-Turn-Lebenszyklus mit Ablehnung veralteter Turns, bevor der Zustand gelöscht wird.
    - `talk.session.cancelOutput` stoppt die Audioausgabe des Assistenten, vor allem für VAD-gesteuertes Barge-in in Gateway-Relay-Sitzungen.
    - `talk.session.submitToolResult` schließt einen Provider-Toolaufruf ab, der von einer Gateway-eigenen Echtzeit-Relay-Sitzung ausgegeben wurde.
    - `talk.session.close` schließt eine Gateway-eigene Relay-, Transkriptions- oder Managed-Room-Sitzung und gibt terminale Talk-Ereignisse aus.
    - `talk.mode` setzt/sendert den aktuellen Talk-Moduszustand für WebChat-/Control-UI-Clients.
    - `talk.client.create` erstellt eine client-eigene Echtzeit-Provider-Sitzung mit `webrtc` oder `provider-websocket`, während das Gateway Konfiguration, Anmeldedaten, Anweisungen und Tool-Richtlinie besitzt.
    - `talk.client.toolCall` ermöglicht client-eigenen Echtzeittransporten, Provider-Toolaufrufe an die Gateway-Richtlinie weiterzuleiten. Das erste unterstützte Tool ist `openclaw_agent_consult`; Clients erhalten eine Run-ID und warten auf normale Chat-Lebenszyklusereignisse, bevor sie das providerspezifische Tool-Ergebnis einreichen.
    - `talk.event` ist der zentrale Talk-Ereigniskanal für Echtzeit, Transkription, STT/TTS, Managed-Room, Telefonie und Meeting-Adapter.
    - `talk.speak` synthetisiert Sprache über den aktiven Talk-Sprach-Provider.
    - `tts.status` gibt den TTS-aktiviert-Zustand, den aktiven Provider, Fallback-Provider und den Provider-Konfigurationszustand zurück.
    - `tts.providers` gibt das sichtbare TTS-Provider-Inventar zurück.
    - `tts.enable` und `tts.disable` schalten den TTS-Einstellungszustand um.
    - `tts.setProvider` aktualisiert den bevorzugten TTS-Provider.
    - `tts.convert` führt eine einmalige Text-zu-Sprache-Konvertierung aus.

  </Accordion>

  <Accordion title="Secrets, Konfiguration, Update und Assistent">
    - `secrets.reload` löst aktive SecretRefs erneut auf und tauscht den Laufzeit-Secret-Zustand nur bei vollständigem Erfolg aus.
    - `secrets.resolve` löst befehlsbezogene Secret-Zuweisungen für eine bestimmte Befehls-/Zielmenge auf.
    - `config.get` gibt den aktuellen Konfigurations-Snapshot und Hash zurück.
    - `config.set` schreibt eine validierte Konfigurationsnutzlast.
    - `config.patch` führt ein partielles Konfigurationsupdate zusammen.
    - `config.apply` validiert + ersetzt die vollständige Konfigurationsnutzlast.
    - `config.schema` gibt die Live-Konfigurationsschema-Nutzlast zurück, die von Control UI und CLI-Tools verwendet wird: Schema, `uiHints`, Version und Generierungsmetadaten, einschließlich Plugin- + Kanalschema-Metadaten, wenn die Laufzeit sie laden kann. Das Schema enthält Feldmetadaten für `title` / `description`, die aus denselben Labels und Hilfetexten abgeleitet sind, die von der UI verwendet werden, einschließlich verschachtelter Objekt-, Wildcard-, Array-Element- und `anyOf`- / `oneOf`- / `allOf`-Kompositionszweige, wenn passende Felddokumentation vorhanden ist.
    - `config.schema.lookup` gibt eine pfadbezogene Lookup-Nutzlast für einen Konfigurationspfad zurück: normalisierter Pfad, ein flacher Schemaknoten, passender Hinweis + `hintPath` und unmittelbare Zusammenfassungen untergeordneter Elemente für UI-/CLI-Drill-down. Lookup-Schemaknoten behalten die benutzerseitige Dokumentation und gängige Validierungsfelder (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerische/String-/Array-/Objektgrenzen und Flags wie `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Untergeordnete Zusammenfassungen legen `key`, normalisierten `path`, `type`, `required`, `hasChildren` sowie den passenden `hint` / `hintPath` offen.
    - `update.run` führt den Gateway-Update-Ablauf aus und plant einen Neustart nur, wenn das Update selbst erfolgreich war; Aufrufer mit einer Sitzung können `continuationMessage` einschließen, damit der Start einen Folge-Agenten-Turn über die Neustart-Fortsetzungswarteschlange fortsetzt. Paketmanager-Updates erzwingen nach dem Pakettausch einen nicht verzögerten Update-Neustart ohne Cooldown, damit der alte Gateway-Prozess nicht weiter Lazy-Loading aus einem ersetzten `dist`-Baum ausführt.
    - `update.status` gibt den neuesten zwischengespeicherten Update-Neustart-Sentinel zurück, einschließlich der nach dem Neustart ausgeführten Version, sofern verfügbar.
    - `wizard.start`, `wizard.next`, `wizard.status` und `wizard.cancel` stellen den Onboarding-Assistenten über WS RPC bereit.

  </Accordion>

  <Accordion title="Agenten- und Arbeitsbereichshilfen">
    - `agents.list` gibt konfigurierte Agenteneinträge zurück, einschließlich effektivem Modell und Laufzeitmetadaten.
    - `agents.create`, `agents.update` und `agents.delete` verwalten Agentendatensätze und Arbeitsbereichsverdrahtung.
    - `agents.files.list`, `agents.files.get` und `agents.files.set` verwalten die Bootstrap-Arbeitsbereichsdateien, die für einen Agenten offengelegt werden.
    - `artifacts.list`, `artifacts.get` und `artifacts.download` stellen aus Transkripten abgeleitete Artefaktzusammenfassungen und Downloads für einen expliziten `sessionKey`-, `runId`- oder `taskId`-Scope bereit. Run- und Task-Abfragen lösen die besitzende Sitzung serverseitig auf und geben nur Transkriptmedien mit passender Provenienz zurück; unsichere oder lokale URL-Quellen geben nicht unterstützte Downloads zurück, statt serverseitig abgerufen zu werden.
    - `environments.list` und `environments.status` stellen schreibgeschützte Gateway-lokale und Node-Umgebungserkennung für SDK-Clients bereit.
    - `agent.identity.get` gibt die effektive Assistentenidentität für einen Agenten oder eine Sitzung zurück.
    - `agent.wait` wartet, bis ein Run abgeschlossen ist, und gibt den terminalen Snapshot zurück, sofern verfügbar.

  </Accordion>

  <Accordion title="Sitzungssteuerung">
    - `sessions.list` gibt den aktuellen Sitzungsindex zurück, einschließlich `agentRuntime`-Metadaten pro Zeile, wenn ein Agenten-Laufzeit-Backend konfiguriert ist.
    - `sessions.subscribe` und `sessions.unsubscribe` schalten Sitzungsänderungsereignis-Abonnements für den aktuellen WS-Client um.
    - `sessions.messages.subscribe` und `sessions.messages.unsubscribe` schalten Transkript-/Nachrichtenereignis-Abonnements für eine Sitzung um.
    - `sessions.preview` gibt begrenzte Transkriptvorschauen für bestimmte Sitzungsschlüssel zurück.
    - `sessions.describe` gibt eine Gateway-Sitzungszeile für einen exakten Sitzungsschlüssel zurück.
    - `sessions.resolve` löst ein Sitzungsziel auf oder kanonisiert es.
    - `sessions.create` erstellt einen neuen Sitzungseintrag.
    - `sessions.send` sendet eine Nachricht in eine vorhandene Sitzung.
    - `sessions.steer` ist die Unterbrechen-und-Steuern-Variante für eine aktive Sitzung.
    - `sessions.abort` bricht aktive Arbeit für eine Sitzung ab. Ein Aufrufer kann `key` plus optional `runId` übergeben oder nur `runId` für aktive Runs übergeben, die das Gateway zu einer Sitzung auflösen kann.
    - `sessions.patch` aktualisiert Sitzungsmetadaten/-Overrides und meldet das aufgelöste kanonische Modell sowie die effektive `agentRuntime`.
    - `sessions.reset`, `sessions.delete` und `sessions.compact` führen Sitzungswartung aus.
    - `sessions.get` gibt die vollständige gespeicherte Sitzungszeile zurück.
    - Die Chat-Ausführung verwendet weiterhin `chat.history`, `chat.send`, `chat.abort` und `chat.inject`. `chat.history` ist für UI-Clients anzeige-normalisiert: Inline-Direktiv-Tags werden aus sichtbarem Text entfernt, Nur-Text-Toolaufruf-XML-Nutzlasten (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Toolaufruf-Blöcke) und durchgesickerte ASCII-/Vollbreiten-Modellsteuerungstokens werden entfernt, reine Silent-Token-Assistentenzeilen wie exaktes `NO_REPLY` / `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden.

  </Accordion>

  <Accordion title="Gerätekopplung und Gerätetokens">
    - `device.pair.list` gibt ausstehende und genehmigte gekoppelte Geräte zurück.
    - `device.pair.approve`, `device.pair.reject` und `device.pair.remove` verwalten Gerätekopplungsdatensätze.
    - `device.token.rotate` rotiert ein gekoppeltes Gerätetoken innerhalb seiner genehmigten Rollen- und Aufrufer-Scope-Grenzen.
    - `device.token.revoke` widerruft ein gekoppeltes Gerätetoken innerhalb seiner genehmigten Rollen- und Aufrufer-Scope-Grenzen.

  </Accordion>

  <Accordion title="Node-Kopplung, Aufruf und ausstehende Arbeit">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` und `node.pair.verify` decken Node-Kopplung und Bootstrap-Verifizierung ab.
    - `node.list` und `node.describe` geben den bekannten/verbundenen Node-Zustand zurück.
    - `node.rename` aktualisiert ein gekoppeltes Node-Label.
    - `node.invoke` leitet einen Befehl an einen verbundenen Node weiter.
    - `node.invoke.result` gibt das Ergebnis für eine Aufrufanforderung zurück.
    - `node.event` transportiert vom Node ausgehende Ereignisse zurück in das Gateway.
    - `node.pending.pull` und `node.pending.ack` sind die Warteschlangen-APIs für verbundene Nodes.
    - `node.pending.enqueue` und `node.pending.drain` verwalten dauerhafte ausstehende Arbeit für Offline-/getrennte Nodes.

  </Accordion>

  <Accordion title="Genehmigungsfamilien">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` und `exec.approval.resolve` decken einmalige Exec-Genehmigungsanfragen sowie das Nachschlagen/Wiedergeben ausstehender Genehmigungen ab.
    - `exec.approval.waitDecision` wartet auf eine ausstehende Exec-Genehmigung und gibt die endgültige Entscheidung zurück (oder `null` bei Zeitüberschreitung).
    - `exec.approvals.get` und `exec.approvals.set` verwalten Snapshots der Exec-Genehmigungsrichtlinie des Gateway.
    - `exec.approvals.node.get` und `exec.approvals.node.set` verwalten die node-lokale Exec-Genehmigungsrichtlinie über Node-Relay-Befehle.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` und `plugin.approval.resolve` decken Plugin-definierte Genehmigungsabläufe ab.

  </Accordion>

  <Accordion title="Automatisierung, Skills und Tools">
    - Automatisierung: `wake` plant eine sofortige oder beim nächsten Heartbeat erfolgende Wake-Textinjektion; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` verwalten geplante Arbeit.
    - Skills und Tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Häufige Ereignisfamilien

- `chat`: UI-Chat-Updates wie `chat.inject` und andere rein transkriptbezogene Chat-
  Ereignisse.
- `session.message` und `session.tool`: Transkript-/Ereignisstream-Updates für eine
  abonnierte Sitzung.
- `sessions.changed`: Sitzungsindex oder Metadaten geändert.
- `presence`: Updates des Systempräsenz-Snapshots.
- `tick`: periodisches Keepalive-/Liveness-Ereignis.
- `health`: Update des Gateway-Health-Snapshots.
- `heartbeat`: Update des Heartbeat-Ereignisstreams.
- `cron`: Änderungsereignis für Cron-Lauf/-Job.
- `shutdown`: Benachrichtigung zum Herunterfahren des Gateway.
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

### Operator-Hilfsmethoden

- Operatoren können `commands.list` (`operator.read`) aufrufen, um das Laufzeit-
  Befehlsinventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agent-Arbeitsbereich zu lesen.
  - `scope` steuert, welche Oberfläche das primäre `name` adressiert:
    - `text` gibt das primäre Textbefehlstoken ohne führendes `/` zurück
    - `native` und der standardmäßige `both`-Pfad geben Provider-bewusste native Namen
      zurück, wenn verfügbar
  - `textAliases` enthält exakte Slash-Aliasse wie `/model` und `/m`.
  - `nativeName` enthält den Provider-bewussten nativen Befehlsnamen, wenn einer vorhanden ist.
  - `provider` ist optional und wirkt sich nur auf native Benennung sowie native Plugin-
    Befehlsverfügbarkeit aus.
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
    vom Aufrufer bereitgestellten Authentifizierungs- oder Auslieferungskontext zu akzeptieren.
  - Die Antwort ist sitzungsbezogen und spiegelt wider, was die aktive Konversation aktuell verwenden kann,
    einschließlich Kern-, Plugin- und Kanal-Tools.
- Operatoren können `tools.invoke` (`operator.write`) aufrufen, um ein verfügbares Tool über denselben
  Gateway-Richtlinienpfad wie `/tools/invoke` aufzurufen.
  - `name` ist erforderlich. `args`, `sessionKey`, `agentId`, `confirm` und
    `idempotencyKey` sind optional.
  - Wenn sowohl `sessionKey` als auch `agentId` vorhanden sind, muss der aufgelöste Sitzungsagent
    mit `agentId` übereinstimmen.
  - Die Antwort ist ein SDK-seitiger Umschlag mit `ok`, `toolName`, optionalem `output` und typisierten
    `error`-Feldern. Genehmigungs- oder Richtlinienablehnungen geben `ok:false` in der Nutzlast zurück, statt
    die Gateway-Toolrichtlinien-Pipeline zu umgehen.
- Operatoren können `skills.status` (`operator.read`) aufrufen, um das sichtbare
  Skill-Inventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agent-Arbeitsbereich zu lesen.
  - Die Antwort enthält Eignung, fehlende Anforderungen, Konfigurationsprüfungen und
    bereinigte Installationsoptionen, ohne rohe Geheimwerte offenzulegen.
- Operatoren können `skills.search` und `skills.detail` (`operator.read`) für
  ClawHub-Erkennungsmetadaten aufrufen.
- Operatoren können `skills.install` (`operator.admin`) in zwei Modi aufrufen:
  - ClawHub-Modus: `{ source: "clawhub", slug, version?, force? }` installiert einen
    Skill-Ordner in das Verzeichnis `skills/` des Standard-Agent-Arbeitsbereichs.
  - Gateway-Installer-Modus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    führt eine deklarierte `metadata.openclaw.install`-Aktion auf dem Gateway-Host aus.
- Operatoren können `skills.update` (`operator.admin`) in zwei Modi aufrufen:
  - Der ClawHub-Modus aktualisiert einen nachverfolgten Slug oder alle nachverfolgten ClawHub-Installationen im
    Standard-Agent-Arbeitsbereich.
  - Der Konfigurationsmodus patcht `skills.entries.<skillKey>`-Werte wie `enabled`,
    `apiKey` und `env`.

### `models.list`-Ansichten

`models.list` akzeptiert einen optionalen `view`-Parameter:

- Weggelassen oder `"default"`: aktuelles Laufzeitverhalten. Wenn `agents.defaults.models` konfiguriert ist, ist die Antwort der zulässige Katalog; andernfalls ist die Antwort der vollständige Gateway-Katalog.
- `"configured"`: Verhalten in Picker-Größe. Wenn `agents.defaults.models` konfiguriert ist, hat es weiterhin Vorrang. Andernfalls verwendet die Antwort explizite `models.providers.*.models`-Einträge und fällt nur dann auf den vollständigen Katalog zurück, wenn keine konfigurierten Modellzeilen vorhanden sind.
- `"all"`: vollständiger Gateway-Katalog, wobei `agents.defaults.models` umgangen wird. Verwenden Sie dies für Diagnose- und Erkennungs-UIs, nicht für normale Modell-Picker.

## Exec-Genehmigungen

- Wenn eine Exec-Anfrage eine Genehmigung benötigt, sendet das Gateway `exec.approval.requested`.
- Operator-Clients lösen sie durch Aufruf von `exec.approval.resolve` auf (erfordert den Scope `operator.approvals`).
- Für `host=node` muss `exec.approval.request` `systemRunPlan` enthalten (kanonische `argv`/`cwd`/`rawCommand`/Sitzungsmetadaten). Anfragen ohne `systemRunPlan` werden abgelehnt.
- Nach der Genehmigung verwenden weitergeleitete `node.invoke system.run`-Aufrufe diesen kanonischen
  `systemRunPlan` als maßgeblichen Befehls-/cwd-/Sitzungskontext.
- Wenn ein Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` zwischen Vorbereitung und der endgültig genehmigten `system.run`-Weiterleitung mutiert, lehnt das
  Gateway den Lauf ab, statt der mutierten Nutzlast zu vertrauen.

## Agent-Auslieferungs-Fallback

- `agent`-Anfragen können `deliver=true` enthalten, um ausgehende Auslieferung anzufordern.
- `bestEffortDeliver=false` behält striktes Verhalten bei: nicht auflösbare oder nur interne Auslieferungsziele geben `INVALID_REQUEST` zurück.
- `bestEffortDeliver=true` erlaubt den Fallback auf reine Sitzungsausführung, wenn keine extern auslieferbare Route aufgelöst werden kann (zum Beispiel interne/Webchat-Sitzungen oder mehrdeutige Mehrkanal-Konfigurationen).

## Versionierung

- `PROTOCOL_VERSION` befindet sich in `src/gateway/protocol/version.ts`.
- Clients senden `minProtocol` + `maxProtocol`; der Server lehnt Nichtübereinstimmungen ab.
- Schemas + Modelle werden aus TypeBox-Definitionen generiert:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Client-Konstanten

Der Referenzclient in `src/gateway/client.ts` verwendet diese Standardwerte. Die Werte sind
über Protokoll v4 hinweg stabil und bilden die erwartete Basis für Drittanbieter-Clients.

| Konstante                                 | Standardwert                                         | Quelle                                                                                    |
| ----------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                  | `src/gateway/protocol/version.ts`                                                         |
| Anfrage-Timeout (pro RPC)                 | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)                                              |
| Preauth-/Connect-Challenge-Timeout        | `15_000` ms                                          | `src/gateway/handshake-timeouts.ts` (config/env kann das gekoppelte Server-/Client-Budget erhöhen) |
| Initialer Reconnect-Backoff               | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                                                     |
| Maximaler Reconnect-Backoff               | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)                                             |
| Fast-Retry-Begrenzung nach Device-Token-Close | `250` ms                                         | `src/gateway/client.ts`                                                                   |
| Force-Stop-Kulanz vor `terminate()`       | `250` ms                                             | `FORCE_STOP_TERMINATE_GRACE_MS`                                                           |
| Standard-Timeout von `stopAndWait()`      | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                                                |
| Standardmäßiges Tick-Intervall (vor `hello-ok`) | `30_000` ms                                     | `src/gateway/client.ts`                                                                   |
| Tick-Timeout-Close                        | Code `4000`, wenn Stille `tickIntervalMs * 2` überschreitet | `src/gateway/client.ts`                                                             |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                                                         |

Der Server kündigt die wirksamen `policy.tickIntervalMs`, `policy.maxPayload`
und `policy.maxBufferedBytes` in `hello-ok` an; Clients sollten diese Werte
statt der Vor-Handshake-Standardwerte beachten.

## Auth

- Shared-Secret-Gateway-Authentifizierung verwendet je nach konfiguriertem Authentifizierungsmodus `connect.params.auth.token` oder
  `connect.params.auth.password`.
- Identitätstragende Modi wie Tailscale Serve
  (`gateway.auth.allowTailscale: true`) oder nicht über Loopback laufendes
  `gateway.auth.mode: "trusted-proxy"` erfüllen die Authentifizierungsprüfung für `connect` über
  Anfrage-Header statt über `connect.params.auth.*`.
- Private-Ingress `gateway.auth.mode: "none"` überspringt die Shared-Secret-Authentifizierung für `connect`
  vollständig; setzen Sie diesen Modus nicht an öffentlichem/nicht vertrauenswürdigem Ingress ein.
- Nach dem Pairing stellt der Gateway ein **Gerätetoken** aus, das auf die Verbindungsrolle
  + Scopes begrenzt ist. Es wird in `hello-ok.auth.deviceToken` zurückgegeben und sollte
  vom Client für zukünftige Verbindungen dauerhaft gespeichert werden.
- Clients sollten das primäre `hello-ok.auth.deviceToken` nach jeder
  erfolgreichen Verbindung dauerhaft speichern.
- Eine erneute Verbindung mit diesem **gespeicherten** Gerätetoken sollte auch die gespeicherte
  genehmigte Scope-Menge für dieses Token wiederverwenden. Dadurch bleibt bereits gewährter Lese-/Probe-/Statuszugriff
  erhalten, und erneute Verbindungen werden nicht unbemerkt auf einen
  engeren impliziten Nur-Admin-Scope reduziert.
- Clientseitige Zusammenstellung der Authentifizierung für `connect` (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` ist unabhängig und wird immer weitergeleitet, wenn es gesetzt ist.
  - `auth.token` wird in Prioritätsreihenfolge befüllt: zuerst explizites gemeinsames Token,
    dann ein explizites `deviceToken`, dann ein gespeichertes Token pro Gerät (indiziert nach
    `deviceId` + `role`).
  - `auth.bootstrapToken` wird nur gesendet, wenn keiner der oben genannten Werte ein
    `auth.token` ergeben hat. Ein gemeinsames Token oder ein aufgelöstes Gerätetoken unterdrückt es.
  - Die automatische Heraufstufung eines gespeicherten Gerätetokens beim einmaligen
    `AUTH_TOKEN_MISMATCH`-Wiederholungsversuch ist auf **vertrauenswürdige Endpunkte** beschränkt —
    Loopback oder `wss://` mit angeheftetem `tlsFingerprint`. Öffentliches `wss://`
    ohne Pinning qualifiziert sich nicht.
- Zusätzliche Einträge in `hello-ok.auth.deviceTokens` sind Bootstrap-Übergabetokens.
  Speichern Sie sie nur dauerhaft, wenn die Verbindung Bootstrap-Authentifizierung über einen vertrauenswürdigen Transport
  wie `wss://` oder Loopback/lokales Pairing verwendet hat.
- Wenn ein Client ein **explizites** `deviceToken` oder explizite `scopes` bereitstellt, bleibt diese
  vom Aufrufer angeforderte Scope-Menge maßgeblich; zwischengespeicherte Scopes werden nur
  wiederverwendet, wenn der Client das gespeicherte Token pro Gerät wiederverwendet.
- Gerätetokens können über `device.token.rotate` und
  `device.token.revoke` rotiert/widerrufen werden (erfordert Scope `operator.pairing`).
- `device.token.rotate` gibt Rotationsmetadaten zurück. Es gibt das Ersatz-Bearer-Token
  nur bei Aufrufen desselben Geräts aus, die bereits mit
  diesem Gerätetoken authentifiziert sind, damit reine Token-Clients ihren Ersatz vor
  einer erneuten Verbindung dauerhaft speichern können. Shared-/Admin-Rotationen geben das Bearer-Token nicht aus.
- Token-Ausstellung, -Rotation und -Widerruf bleiben auf die genehmigte Rollenmenge beschränkt,
  die im Pairing-Eintrag dieses Geräts aufgezeichnet ist; Token-Mutationen können keine Geräterolle erweitern oder
  als Ziel wählen, die durch die Pairing-Genehmigung nie gewährt wurde.
- Bei Token-Sitzungen gekoppelter Geräte ist die Geräteverwaltung selbstbegrenzt, es sei denn,
  der Aufrufer hat zusätzlich `operator.admin`: Nicht-Admin-Aufrufer können nur ihren **eigenen**
  Geräteeintrag entfernen/widerrufen/rotieren.
- `device.token.rotate` und `device.token.revoke` prüfen außerdem die Scope-Menge des Ziel-Operator-Tokens
  gegen die aktuellen Sitzungsscopes des Aufrufers. Nicht-Admin-Aufrufer
  können kein umfassenderes Operator-Token rotieren oder widerrufen, als sie bereits besitzen.
- Authentifizierungsfehler enthalten `error.details.code` sowie Hinweise zur Wiederherstellung:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Clientverhalten bei `AUTH_TOKEN_MISMATCH`:
  - Vertrauenswürdige Clients können einen begrenzten Wiederholungsversuch mit einem zwischengespeicherten Token pro Gerät ausführen.
  - Wenn dieser Wiederholungsversuch fehlschlägt, sollten Clients automatische Wiederverbindungsschleifen beenden und Hinweise für Operator-Maßnahmen anzeigen.

## Geräteidentität + Pairing

- Nodes sollten eine stabile Geräteidentität (`device.id`) enthalten, die aus einem
  Schlüsselpaar-Fingerprint abgeleitet ist.
- Gateways stellen Tokens pro Gerät + Rolle aus.
- Pairing-Genehmigungen sind für neue Geräte-IDs erforderlich, sofern die lokale automatische Genehmigung
  nicht aktiviert ist.
- Die automatische Pairing-Genehmigung ist auf direkte lokale Loopback-Verbindungen ausgerichtet.
- OpenClaw hat außerdem einen engen backend-/containerlokalen Selbstverbindungspfad für
  vertrauenswürdige Shared-Secret-Hilfsabläufe.
- Tailnet- oder LAN-Verbindungen desselben Hosts werden für das Pairing weiterhin als remote behandelt und
  erfordern Genehmigung.
- WS-Clients enthalten während `connect` normalerweise eine `device`-Identität (Operator +
  Node). Die einzigen gerätelosen Operator-Ausnahmen sind explizite Vertrauenspfade:
  - `gateway.controlUi.allowInsecureAuth=true` für localhost-only unsichere HTTP-Kompatibilität.
  - erfolgreiche Operator-Control-UI-Authentifizierung mit `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (Notfalloption, erhebliche Sicherheitsabsenkung).
  - direkte Loopback-`gateway-client`-Backend-RPCs, die mit dem gemeinsamen
    Gateway-Token/-Passwort authentifiziert sind.
- Alle Verbindungen müssen die vom Server bereitgestellte Nonce `connect.challenge` signieren.

### Migrationsdiagnosen für Geräteauthentifizierung

Für Legacy-Clients, die noch das Signierverhalten vor der Challenge verwenden, gibt `connect` jetzt
`DEVICE_AUTH_*`-Detailcodes unter `error.details.code` mit einem stabilen `error.details.reason` zurück.

Häufige Migrationsfehler:

| Meldung                     | details.code                     | details.reason           | Bedeutung                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client hat `device.nonce` ausgelassen (oder leer gesendet). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client hat mit einer veralteten/falschen Nonce signiert. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signatur-Payload entspricht nicht dem v2-Payload.  |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Signierter Zeitstempel liegt außerhalb der zulässigen Abweichung. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` stimmt nicht mit dem Public-Key-Fingerprint überein. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public-Key-Format/Kanonisierung fehlgeschlagen.    |

Migrationsziel:

- Warten Sie immer auf `connect.challenge`.
- Signieren Sie den v2-Payload, der die Server-Nonce enthält.
- Senden Sie dieselbe Nonce in `connect.params.device.nonce`.
- Bevorzugter Signatur-Payload ist `v3`, der zusätzlich zu den Feldern für Gerät/Client/Rolle/Scopes/Token/Nonce
  `platform` und `deviceFamily` bindet.
- Legacy-`v2`-Signaturen werden aus Kompatibilitätsgründen weiterhin akzeptiert, aber das Metadaten-Pinning gekoppelter Geräte
  steuert weiterhin die Befehlsrichtlinie bei erneuter Verbindung.

## TLS + Pinning

- TLS wird für WS-Verbindungen unterstützt.
- Clients können optional den Gateway-Zertifikat-Fingerprint anheften (siehe `gateway.tls`-
  Konfiguration plus `gateway.remote.tlsFingerprint` oder CLI `--tls-fingerprint`).

## Scope

Dieses Protokoll stellt die **vollständige Gateway-API** bereit (Status, Kanäle, Modelle, Chat,
Agent, Sitzungen, Nodes, Genehmigungen usw.). Die genaue Oberfläche wird durch die
TypeBox-Schemas in `src/gateway/protocol/schema.ts` definiert.

## Verwandt

- [Bridge-Protokoll](/de/gateway/bridge-protocol)
- [Gateway-Runbook](/de/gateway)
