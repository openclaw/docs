---
read_when:
    - Implementieren oder Aktualisieren von Gateway-WS-Clients
    - Fehlersuche bei Protokollinkompatibilitäten oder Verbindungsfehlern
    - Protokollschema/-modelle neu generieren
summary: 'Gateway-WebSocket-Protokoll: Handshake, Frames, Versionierung'
title: Gateway-Protokoll
x-i18n:
    generated_at: "2026-05-01T06:42:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6da9ce755b941789ae6b9e866247c8bebb86e9a1530fb8cb258fb0650b24b8a
    source_path: gateway/protocol.md
    workflow: 16
---

Das Gateway-WS-Protokoll ist die **einzige Control Plane + Node-Transport** für
OpenClaw. Alle Clients (CLI, Web-UI, macOS-App, iOS-/Android-Nodes, Headless-
Nodes) verbinden sich per WebSocket und deklarieren beim Handshake ihre **Rolle** + ihren
**Scope**.

## Transport

- WebSocket, Text-Frames mit JSON-Payloads.
- Der erste Frame **muss** eine `connect`-Anfrage sein.
- Pre-Connect-Frames sind auf 64 KiB begrenzt. Nach einem erfolgreichen Handshake sollten Clients
  die Grenzwerte `hello-ok.policy.maxPayload` und
  `hello-ok.policy.maxBufferedBytes` einhalten. Bei aktivierter Diagnose erzeugen
  zu große eingehende Frames und langsame ausgehende Puffer `payload.large`-Events,
  bevor das Gateway schließt oder den betroffenen Frame verwirft. Diese Events behalten
  Größen, Grenzwerte, Oberflächen und sichere Reason-Codes. Sie behalten nicht den Nachrichtenkörper,
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
    "maxProtocol": 3,
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
    "protocol": 3,
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
einen wiederholbaren `UNAVAILABLE`-Fehler mit `details.reason` auf
`"startup-sidecars"` und `retryAfterMs` zurückgeben. Clients sollten diese Antwort
innerhalb ihres gesamten Verbindungsbudgets erneut versuchen, statt sie als terminalen
Handshake-Fehler anzuzeigen.

`server`, `features`, `snapshot` und `policy` sind alle vom Schema erforderlich
(`src/gateway/protocol/schema/frames.ts`). `auth` ist ebenfalls erforderlich und meldet
die ausgehandelte Rolle und Scopes. `canvasHostUrl` ist optional.

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
sie sich mit dem gemeinsamen Gateway-Token/-Passwort authentifizieren. Dieser Pfad ist
für interne Control-Plane-RPCs reserviert und verhindert, dass veraltete CLI-/Device-Pairing-Baselines
lokale Backend-Arbeit wie Subagent-Sitzungsaktualisierungen blockieren. Remote-Clients,
Browser-Origin-Clients, Node-Clients und explizite Device-Token-/Device-Identity-
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

Während einer vertrauenswürdigen Bootstrap-Übergabe kann `hello-ok.auth` außerdem zusätzliche
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

Für den integrierten Node-/Operator-Bootstrap-Flow bleibt das primäre Node-Token bei
`scopes: []`, und jedes übergebene Operator-Token bleibt auf die Bootstrap-
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
    "minProtocol": 3,
    "maxProtocol": 3,
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

Der Methoden-Scope ist nur die erste Schranke. Einige über `chat.send` erreichte
Slash-Commands wenden zusätzlich strengere Command-Level-Prüfungen an. Zum Beispiel erfordern persistente
`/config set`- und `/config unset`-Schreibvorgänge `operator.admin`.

`node.pair.approve` hat zusätzlich zum Basis-Methoden-Scope eine weitere Scope-Prüfung
zum Genehmigungszeitpunkt:

- Anfragen ohne Commands: `operator.pairing`
- Anfragen mit Nicht-Exec-Node-Commands: `operator.pairing` + `operator.write`
- Anfragen, die `system.run`, `system.run.prepare` oder `system.which` enthalten:
  `operator.pairing` + `operator.admin`

### Caps/Commands/Berechtigungen (Node)

Nodes deklarieren Capability-Claims beim Connect-Zeitpunkt:

- `caps`: übergeordnete Capability-Kategorien.
- `commands`: Command-Allowlist für Invoke.
- `permissions`: granulare Umschalter (z. B. `screen.record`, `camera.capture`).

Das Gateway behandelt diese als **Claims** und erzwingt serverseitige Allowlists.

## Presence

- `system-presence` gibt Einträge zurück, die nach Device-Identity geschlüsselt sind.
- Presence-Einträge enthalten `deviceId`, `roles` und `scopes`, damit UIs eine einzelne Zeile pro Device anzeigen können,
  selbst wenn es sowohl als **Operator** als auch als **Node** verbunden ist.
- `node.list` enthält optionale Felder `lastSeenAtMs` und `lastSeenReason`. Verbundene Nodes melden
  ihre aktuelle Verbindungszeit als `lastSeenAtMs` mit dem Grund `connect`; gepairte Nodes können außerdem
  dauerhafte Background-Presence melden, wenn ein vertrauenswürdiges Node-Event ihre Pairing-Metadaten aktualisiert.

### Node-Background-Alive-Event

Nodes können `node.event` mit `event: "node.presence.alive"` aufrufen, um aufzuzeichnen, dass ein gepairter Node
während eines Background-Wake aktiv war, ohne ihn als verbunden zu markieren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` ist ein geschlossenes Enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` oder `connect`. Unbekannte Trigger-Strings werden vom Gateway vor der Persistierung zu
`background` normalisiert. Das Event ist nur für authentifizierte Node-
Device-Sitzungen dauerhaft; sitzungen ohne Device oder ungepairte Sitzungen geben `handled: false` zurück.

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

## Scope-Begrenzung für Broadcast-Events

Serverseitig gepushte WebSocket-Broadcast-Events sind Scope-gesteuert, damit Pairing-Scoped- oder Node-only-Sitzungen keine Sitzungsinhalte passiv empfangen.

- **Chat-, Agent- und Tool-Ergebnis-Frames** (einschließlich gestreamter `agent`-Events und Tool-Call-Ergebnisse) erfordern mindestens `operator.read`. Sitzungen ohne `operator.read` überspringen diese Frames vollständig.
- **Plugin-definierte `plugin.*`-Broadcasts** werden je nach Registrierung durch das Plugin auf `operator.write` oder `operator.admin` begrenzt.
- **Status- und Transport-Events** (`heartbeat`, `presence`, `tick`, Connect-/Disconnect-Lifecycle usw.) bleiben uneingeschränkt, damit die Transportgesundheit für jede authentifizierte Sitzung beobachtbar bleibt.
- **Unbekannte Broadcast-Event-Familien** werden standardmäßig Scope-gesteuert (fail-closed), sofern ein registrierter Handler sie nicht explizit lockert.

Jede Client-Verbindung behält ihre eigene Sequenznummer pro Client, damit Broadcasts auf diesem Socket eine monotone Reihenfolge bewahren, selbst wenn unterschiedliche Clients verschiedene scope-gefilterte Teilmengen des Event-Streams sehen.

## Häufige RPC-Methodenfamilien

Die öffentliche WS-Oberfläche ist breiter als die obigen Handshake-/Auth-Beispiele. Dies
ist kein generierter Dump — `hello-ok.features.methods` ist eine konservative
Discovery-Liste, die aus `src/gateway/server-methods-list.ts` plus geladenen
Plugin-/Channel-Methodenexporten erstellt wird. Behandeln Sie sie als Feature Discovery, nicht als vollständige
Aufzählung von `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System and identity">
    - `health` gibt den zwischengespeicherten oder frisch geprüften Gateway-Health-Snapshot zurück.
    - `diagnostics.stability` gibt den aktuellen begrenzten Diagnostic-Stability-Recorder zurück. Er behält operative Metadaten wie Event-Namen, Zählwerte, Bytegrößen, Speichermesswerte, Queue-/Sitzungsstatus, Channel-/Plugin-Namen und Sitzungs-IDs. Er behält keine Chat-Texte, Webhook-Bodies, Tool-Ausgaben, rohen Anfrage- oder Antwort-Bodies, Tokens, Cookies oder geheime Werte. Operator-Lese-Scope ist erforderlich.
    - `status` gibt die Gateway-Zusammenfassung im `/status`-Stil zurück; sensible Felder werden nur für Operator-Clients mit Admin-Scope einbezogen.
    - `gateway.identity.get` gibt die Gateway-Device-Identity zurück, die von Relay- und Pairing-Flows verwendet wird.
    - `system-presence` gibt den aktuellen Presence-Snapshot für verbundene Operator-/Node-Devices zurück.
    - `system-event` hängt ein System-Event an und kann Presence-Kontext aktualisieren/broadcasten.
    - `last-heartbeat` gibt das zuletzt persistierte Heartbeat-Event zurück.
    - `set-heartbeats` schaltet die Heartbeat-Verarbeitung auf dem Gateway um.

  </Accordion>

  <Accordion title="Modelle und Nutzung">
    - `models.list` gibt den zur Laufzeit zulässigen Modellkatalog zurück. Übergeben Sie `{ "view": "configured" }` für auswahlgerechte konfigurierte Modelle (zuerst `agents.defaults.models`, dann `models.providers.*.models`) oder `{ "view": "all" }` für den vollständigen Katalog.
    - `usage.status` gibt Provider-Nutzungsfenster und Zusammenfassungen des verbleibenden Kontingents zurück.
    - `usage.cost` gibt aggregierte Kostennutzungszusammenfassungen für einen Datumsbereich zurück.
    - `doctor.memory.status` gibt die Bereitschaft von Vektorspeicher / zwischengespeicherten Embeddings für den aktiven Standard-Agent-Arbeitsbereich zurück. Übergeben Sie `{ "probe": true }` oder `{ "deep": true }` nur, wenn der Aufrufer ausdrücklich einen Live-Ping an den Embedding-Provider wünscht.
    - `doctor.memory.remHarness` gibt eine begrenzte, schreibgeschützte REM-Harness-Vorschau für entfernte Control-Plane-Clients zurück. Sie kann Arbeitsbereichspfade, Speicherausschnitte, gerendertes fundiertes Markdown und Kandidaten für Deep Promotion enthalten, daher benötigen Aufrufer `operator.read`.
    - `sessions.usage` gibt Nutzungszusammenfassungen pro Sitzung zurück.
    - `sessions.usage.timeseries` gibt Zeitreihennutzung für eine Sitzung zurück.
    - `sessions.usage.logs` gibt Nutzungsprotokolleinträge für eine Sitzung zurück.

  </Accordion>

  <Accordion title="Kanäle und Anmeldehilfen">
    - `channels.status` gibt Statuszusammenfassungen für integrierte + gebündelte Kanäle/Plugins zurück.
    - `channels.logout` meldet einen bestimmten Kanal/ein bestimmtes Konto ab, sofern der Kanal Abmeldung unterstützt.
    - `web.login.start` startet einen QR-/Web-Anmeldefluss für den aktuellen QR-fähigen Webkanal-Provider.
    - `web.login.wait` wartet auf den Abschluss dieses QR-/Web-Anmeldeflusses und startet den Kanal bei Erfolg.
    - `push.test` sendet einen Test-APNs-Push an einen registrierten iOS-Node.
    - `voicewake.get` gibt die gespeicherten Wake-Word-Auslöser zurück.
    - `voicewake.set` aktualisiert Wake-Word-Auslöser und sendet die Änderung.

  </Accordion>

  <Accordion title="Nachrichten und Protokolle">
    - `send` ist der direkte RPC für ausgehende Zustellung für kanal-/konto-/threadbezogene Sendungen außerhalb des Chat-Runners.
    - `logs.tail` gibt das konfigurierte Gateway-Dateiprotokollende mit Cursor-/Limit- und Max-Byte-Steuerung zurück.

  </Accordion>

  <Accordion title="Talk und TTS">
    - `talk.config` gibt die effektive Talk-Konfigurationsnutzlast zurück; `includeSecrets` erfordert `operator.talk.secrets` (oder `operator.admin`).
    - `talk.mode` setzt/sendet den aktuellen Talk-Moduszustand für WebChat-/Control-UI-Clients.
    - `talk.speak` synthetisiert Sprache über den aktiven Talk-Sprach-Provider.
    - `tts.status` gibt den TTS-Aktivierungszustand, den aktiven Provider, Fallback-Provider und den Provider-Konfigurationszustand zurück.
    - `tts.providers` gibt das sichtbare TTS-Provider-Inventar zurück.
    - `tts.enable` und `tts.disable` schalten den TTS-Einstellungszustand um.
    - `tts.setProvider` aktualisiert den bevorzugten TTS-Provider.
    - `tts.convert` führt eine einmalige Text-zu-Sprache-Konvertierung aus.

  </Accordion>

  <Accordion title="Secrets, Konfiguration, Aktualisierung und Assistent">
    - `secrets.reload` löst aktive SecretRefs erneut auf und tauscht den Laufzeit-Secret-Zustand nur bei vollständigem Erfolg aus.
    - `secrets.resolve` löst befehlszielbezogene Secret-Zuweisungen für einen bestimmten Befehls-/Zielsatz auf.
    - `config.get` gibt den aktuellen Konfigurations-Snapshot und Hash zurück.
    - `config.set` schreibt eine validierte Konfigurationsnutzlast.
    - `config.patch` führt eine teilweise Konfigurationsaktualisierung zusammen.
    - `config.apply` validiert und ersetzt die vollständige Konfigurationsnutzlast.
    - `config.schema` gibt die Live-Konfigurationsschemanutzlast zurück, die von Control UI und CLI-Tools verwendet wird: Schema, `uiHints`, Version und Generierungsmetadaten, einschließlich Plugin- + Kanal-Schemametadaten, wenn die Laufzeit sie laden kann. Das Schema enthält Feldmetadaten `title` / `description`, die aus denselben Beschriftungen und Hilfetexten abgeleitet sind, die die UI verwendet, einschließlich verschachtelter Objekte, Wildcards, Array-Elemente und `anyOf`- / `oneOf`- / `allOf`-Kompositionszweige, wenn passende Felddokumentation vorhanden ist.
    - `config.schema.lookup` gibt eine pfadbezogene Lookup-Nutzlast für einen Konfigurationspfad zurück: normalisierter Pfad, ein flacher Schemaknoten, passender Hinweis + `hintPath` und direkte untergeordnete Zusammenfassungen für UI-/CLI-Drilldown. Lookup-Schemaknoten behalten die nutzerseitige Dokumentation und gängige Validierungsfelder (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, Grenzen für Zahlen/Strings/Arrays/Objekte und Flags wie `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`) bei. Untergeordnete Zusammenfassungen stellen `key`, den normalisierten `path`, `type`, `required`, `hasChildren` sowie den passenden `hint` / `hintPath` bereit.
    - `update.run` führt den Gateway-Aktualisierungsfluss aus und plant einen Neustart nur, wenn die Aktualisierung selbst erfolgreich war.
    - `update.status` gibt den neuesten zwischengespeicherten Sentinel für Aktualisierungsneustarts zurück, einschließlich der nach dem Neustart ausgeführten Version, sofern verfügbar.
    - `wizard.start`, `wizard.next`, `wizard.status` und `wizard.cancel` stellen den Onboarding-Assistenten über WS RPC bereit.

  </Accordion>

  <Accordion title="Agent- und Arbeitsbereichshilfen">
    - `agents.list` gibt konfigurierte Agent-Einträge zurück, einschließlich effektivem Modell und Laufzeitmetadaten.
    - `agents.create`, `agents.update` und `agents.delete` verwalten Agent-Datensätze und Arbeitsbereichsverdrahtung.
    - `agents.files.list`, `agents.files.get` und `agents.files.set` verwalten die Bootstrap-Arbeitsbereichsdateien, die für einen Agent offengelegt werden.
    - `artifacts.list`, `artifacts.get` und `artifacts.download` stellen aus Transkripten abgeleitete Artefaktzusammenfassungen und Downloads für einen expliziten `sessionKey`-, `runId`- oder `taskId`-Geltungsbereich bereit. Run- und Task-Abfragen lösen die zugehörige Sitzung serverseitig auf und geben nur Transkriptmedien mit passender Herkunft zurück; unsichere oder lokale URL-Quellen geben nicht unterstützte Downloads zurück, statt serverseitig abzurufen.
    - `agent.identity.get` gibt die effektive Assistant-Identität für einen Agent oder eine Sitzung zurück.
    - `agent.wait` wartet auf den Abschluss eines Runs und gibt den finalen Snapshot zurück, sofern verfügbar.

  </Accordion>

  <Accordion title="Sitzungssteuerung">
    - `sessions.list` gibt den aktuellen Sitzungsindex zurück, einschließlich zeilenweiser `agentRuntime`-Metadaten, wenn ein Agent-Laufzeit-Backend konfiguriert ist.
    - `sessions.subscribe` und `sessions.unsubscribe` schalten Ereignisabonnements für Sitzungsänderungen für den aktuellen WS-Client um.
    - `sessions.messages.subscribe` und `sessions.messages.unsubscribe` schalten Transkript-/Nachrichtenereignisabonnements für eine Sitzung um.
    - `sessions.preview` gibt begrenzte Transkriptvorschauen für bestimmte Sitzungsschlüssel zurück.
    - `sessions.resolve` löst ein Sitzungsziel auf oder kanonisiert es.
    - `sessions.create` erstellt einen neuen Sitzungseintrag.
    - `sessions.send` sendet eine Nachricht in eine bestehende Sitzung.
    - `sessions.steer` ist die Unterbrechen-und-Steuern-Variante für eine aktive Sitzung.
    - `sessions.abort` bricht aktive Arbeit für eine Sitzung ab. Ein Aufrufer kann `key` plus optional `runId` übergeben oder nur `runId` für aktive Runs übergeben, die das Gateway einer Sitzung zuordnen kann.
    - `sessions.patch` aktualisiert Sitzungsmetadaten/-Overrides und meldet das aufgelöste kanonische Modell plus effektive `agentRuntime`.
    - `sessions.reset`, `sessions.delete` und `sessions.compact` führen Sitzungswartung aus.
    - `sessions.get` gibt die vollständig gespeicherte Sitzungszeile zurück.
    - Die Chat-Ausführung verwendet weiterhin `chat.history`, `chat.send`, `chat.abort` und `chat.inject`. `chat.history` ist für UI-Clients anzeigennormalisiert: Inline-Direktiv-Tags werden aus sichtbarem Text entfernt, reine Text-Tool-Call-XML-Nutzlasten (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke) sowie durchgesickerte ASCII-/Vollbreiten-Modellsteuerungstokens werden entfernt, reine Silent-Token-Assistant-Zeilen wie exaktes `NO_REPLY` / `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden.

  </Accordion>

  <Accordion title="Gerätekopplung und Gerätetokens">
    - `device.pair.list` gibt ausstehende und genehmigte gekoppelte Geräte zurück.
    - `device.pair.approve`, `device.pair.reject` und `device.pair.remove` verwalten Gerätekopplungsdatensätze.
    - `device.token.rotate` rotiert ein gekoppeltes Gerätetoken innerhalb seiner genehmigten Rollen- und Aufrufer-Geltungsbereichsgrenzen.
    - `device.token.revoke` widerruft ein gekoppeltes Gerätetoken innerhalb seiner genehmigten Rollen- und Aufrufer-Geltungsbereichsgrenzen.

  </Accordion>

  <Accordion title="Node-Kopplung, Invoke und ausstehende Arbeit">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` und `node.pair.verify` decken Node-Kopplung und Bootstrap-Verifizierung ab.
    - `node.list` und `node.describe` geben bekannten/verbundenen Node-Zustand zurück.
    - `node.rename` aktualisiert die Bezeichnung eines gekoppelten Node.
    - `node.invoke` leitet einen Befehl an einen verbundenen Node weiter.
    - `node.invoke.result` gibt das Ergebnis für eine Invoke-Anfrage zurück.
    - `node.event` trägt von Nodes ausgehende Ereignisse zurück in das Gateway.
    - `node.canvas.capability.refresh` aktualisiert bereichsbezogene Canvas-Capability-Tokens.
    - `node.pending.pull` und `node.pending.ack` sind die Warteschlangen-APIs für verbundene Nodes.
    - `node.pending.enqueue` und `node.pending.drain` verwalten dauerhaft ausstehende Arbeit für Offline-/getrennte Nodes.

  </Accordion>

  <Accordion title="Approval-Familien">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` und `exec.approval.resolve` decken einmalige Exec-Approval-Anfragen sowie Lookup/Wiedergabe ausstehender Approvals ab.
    - `exec.approval.waitDecision` wartet auf eine ausstehende Exec-Approval und gibt die endgültige Entscheidung zurück (oder `null` bei Zeitüberschreitung).
    - `exec.approvals.get` und `exec.approvals.set` verwalten Snapshots der Gateway-Exec-Approval-Richtlinie.
    - `exec.approvals.node.get` und `exec.approvals.node.set` verwalten die Node-lokale Exec-Approval-Richtlinie über Node-Relay-Befehle.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` und `plugin.approval.resolve` decken Plugin-definierte Approval-Flows ab.

  </Accordion>

  <Accordion title="Automatisierung, Skills und Tools">
    - Automatisierung: `wake` plant eine sofortige oder beim nächsten Heartbeat erfolgende Wake-Textinjektion; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` verwalten geplante Arbeit.
    - Skills und Tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

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
- `cron`: Ereignis zu Cron-Run-/Job-Änderung.
- `shutdown`: Gateway-Herunterfahrbenachrichtigung.
- `node.pair.requested` / `node.pair.resolved`: Lebenszyklus der Node-Kopplung.
- `node.invoke.request`: Broadcast einer Node-Invoke-Anfrage.
- `device.pair.requested` / `device.pair.resolved`: Lebenszyklus gekoppelter Geräte.
- `voicewake.changed`: Wake-Word-Auslöserkonfiguration geändert.
- `exec.approval.requested` / `exec.approval.resolved`: Exec-Approval-
  Lebenszyklus.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin-Approval-
  Lebenszyklus.

### Node-Hilfsmethoden

- Nodes können `skills.bins` aufrufen, um die aktuelle Liste der ausführbaren Skill-Dateien
  für Auto-Allow-Prüfungen abzurufen.

### Operator-Hilfsmethoden

- Operatoren können `commands.list` (`operator.read`) aufrufen, um das Laufzeit-
  Befehlsinventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den standardmäßigen Agent-Arbeitsbereich zu lesen.
  - `scope` steuert, auf welche Oberfläche das primäre `name` zielt:
    - `text` gibt das primäre Textbefehlstoken ohne führendes `/` zurück
    - `native` und der standardmäßige `both`-Pfad geben Provider-bewusste native Namen zurück,
      sofern verfügbar
  - `textAliases` enthält exakte Slash-Aliase wie `/model` und `/m`.
  - `nativeName` enthält den Provider-bewussten nativen Befehlsnamen, sofern einer vorhanden ist.
  - `provider` ist optional und wirkt sich nur auf native Benennung sowie die Verfügbarkeit nativer Plugin-
    Befehle aus.
  - `includeArgs=false` lässt serialisierte Argumentmetadaten in der Antwort weg.
- Operatoren können `tools.catalog` (`operator.read`) aufrufen, um den Laufzeit-Toolkatalog für einen
  Agenten abzurufen. Die Antwort enthält gruppierte Tools und Herkunftsmetadaten:
  - `source`: `core` oder `plugin`
  - `pluginId`: Plugin-Eigentümer, wenn `source="plugin"`
  - `optional`: ob ein Plugin-Tool optional ist
- Operatoren können `tools.effective` (`operator.read`) aufrufen, um das zur Laufzeit wirksame Tool-
  Inventar für eine Sitzung abzurufen.
  - `sessionKey` ist erforderlich.
  - Das Gateway leitet vertrauenswürdigen Laufzeitkontext serverseitig aus der Sitzung ab, statt vom
    Aufrufer bereitgestellten Authentifizierungs- oder Zustellungskontext zu akzeptieren.
  - Die Antwort ist sitzungsbezogen und spiegelt wider, was die aktive Unterhaltung genau jetzt verwenden kann,
    einschließlich Core-, Plugin- und Kanal-Tools.
- Operatoren können `skills.status` (`operator.read`) aufrufen, um das sichtbare
  Skill-Inventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den standardmäßigen Agent-Arbeitsbereich zu lesen.
  - Die Antwort enthält Eignung, fehlende Anforderungen, Konfigurationsprüfungen und
    bereinigte Installationsoptionen, ohne Rohwerte von Geheimnissen offenzulegen.
- Operatoren können `skills.search` und `skills.detail` (`operator.read`) für
  ClawHub-Erkennungsmetadaten aufrufen.
- Operatoren können `skills.install` (`operator.admin`) in zwei Modi aufrufen:
  - ClawHub-Modus: `{ source: "clawhub", slug, version?, force? }` installiert einen
    Skill-Ordner in das `skills/`-Verzeichnis des standardmäßigen Agent-Arbeitsbereichs.
  - Gateway-Installationsmodus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    führt eine deklarierte `metadata.openclaw.install`-Aktion auf dem Gateway-Host aus.
- Operatoren können `skills.update` (`operator.admin`) in zwei Modi aufrufen:
  - Der ClawHub-Modus aktualisiert einen nachverfolgten Slug oder alle nachverfolgten ClawHub-Installationen im
    standardmäßigen Agent-Arbeitsbereich.
  - Der Konfigurationsmodus patcht Werte von `skills.entries.<skillKey>` wie `enabled`,
    `apiKey` und `env`.

### `models.list`-Ansichten

`models.list` akzeptiert einen optionalen `view`-Parameter:

- Weggelassen oder `"default"`: aktuelles Laufzeitverhalten. Wenn `agents.defaults.models` konfiguriert ist, ist die Antwort der erlaubte Katalog; andernfalls ist die Antwort der vollständige Gateway-Katalog.
- `"configured"`: Picker-großes Verhalten. Wenn `agents.defaults.models` konfiguriert ist, hat es weiterhin Vorrang. Andernfalls verwendet die Antwort explizite `models.providers.*.models`-Einträge und fällt nur dann auf den vollständigen Katalog zurück, wenn keine konfigurierten Modellzeilen vorhanden sind.
- `"all"`: vollständiger Gateway-Katalog, wobei `agents.defaults.models` umgangen wird. Verwenden Sie dies für Diagnose- und Erkennungsoberflächen, nicht für normale Modell-Picker.

## Exec-Genehmigungen

- Wenn eine Exec-Anfrage eine Genehmigung benötigt, sendet das Gateway `exec.approval.requested`.
- Operator-Clients lösen dies durch Aufruf von `exec.approval.resolve` auf (erfordert den `operator.approvals`-Scope).
- Für `host=node` muss `exec.approval.request` `systemRunPlan` enthalten (kanonische `argv`/`cwd`/`rawCommand`/Sitzungsmetadaten). Anfragen ohne `systemRunPlan` werden abgelehnt.
- Nach der Genehmigung verwenden weitergeleitete `node.invoke system.run`-Aufrufe denselben kanonischen
  `systemRunPlan` als autoritativen Befehls-/cwd-/Sitzungskontext.
- Wenn ein Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` zwischen Vorbereitung und der final genehmigten `system.run`-Weiterleitung ändert, lehnt das
  Gateway die Ausführung ab, statt dem geänderten Payload zu vertrauen.

## Fallback für Agent-Zustellung

- `agent`-Anfragen können `deliver=true` enthalten, um ausgehende Zustellung anzufordern.
- `bestEffortDeliver=false` behält striktes Verhalten bei: nicht auflösbare oder nur interne Zustellungsziele geben `INVALID_REQUEST` zurück.
- `bestEffortDeliver=true` erlaubt den Fallback auf reine Sitzungsausführung, wenn keine extern zustellbare Route aufgelöst werden kann (zum Beispiel interne/Webchat-Sitzungen oder mehrdeutige Mehrkanal-Konfigurationen).

## Versionierung

- `PROTOCOL_VERSION` befindet sich in `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clients senden `minProtocol` + `maxProtocol`; der Server lehnt Abweichungen ab.
- Schemata + Modelle werden aus TypeBox-Definitionen generiert:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Client-Konstanten

Der Referenz-Client in `src/gateway/client.ts` verwendet diese Standardwerte. Die Werte sind
über Protokoll v3 hinweg stabil und bilden die erwartete Basis für Drittanbieter-Clients.

| Konstante                                 | Standardwert                                          | Quelle                                                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                          |
| Anfrage-Timeout (pro RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                               |
| Preauth-/Connect-Challenge-Timeout        | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (Konfiguration/Env kann das gekoppelte Server-/Client-Budget erhöhen) |
| Initialer Reconnect-Backoff               | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                      |
| Maximaler Reconnect-Backoff               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                              |
| Fast-Retry-Klemmung nach Device-Token-Schließen | `250` ms                                        | `src/gateway/client.ts`                                                                    |
| Force-Stop-Nachfrist vor `terminate()`    | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                            |
| Standard-Timeout von `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                 |
| Standardmäßiges Tick-Intervall (vor `hello-ok`) | `30_000` ms                                      | `src/gateway/client.ts`                                                                    |
| Tick-Timeout-Schließen                    | Code `4000`, wenn Stille `tickIntervalMs * 2` überschreitet | `src/gateway/client.ts`                                                             |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                          |

Der Server veröffentlicht das wirksame `policy.tickIntervalMs`, `policy.maxPayload`
und `policy.maxBufferedBytes` in `hello-ok`; Clients sollten diese Werte beachten
statt der Standardwerte vor dem Handshake.

## Authentifizierung

- Shared-Secret-Gateway-Authentifizierung verwendet `connect.params.auth.token` oder
  `connect.params.auth.password`, abhängig vom konfigurierten Authentifizierungsmodus.
- Identität tragende Modi wie Tailscale Serve
  (`gateway.auth.allowTailscale: true`) oder nicht-loopback
  `gateway.auth.mode: "trusted-proxy"` erfüllen die Connect-Authentifizierungsprüfung über
  Anfrage-Header statt über `connect.params.auth.*`.
- Private-Ingress `gateway.auth.mode: "none"` überspringt Shared-Secret-Connect-Authentifizierung
  vollständig; stellen Sie diesen Modus nicht auf öffentlichem/nicht vertrauenswürdigem Ingress bereit.
- Nach dem Pairing gibt das Gateway ein **Device-Token** aus, das auf die Verbindungs-
  Rolle + Scopes beschränkt ist. Es wird in `hello-ok.auth.deviceToken` zurückgegeben und sollte vom
  Client für künftige Verbindungen dauerhaft gespeichert werden.
- Clients sollten das primäre `hello-ok.auth.deviceToken` nach jedem
  erfolgreichen Verbindungsaufbau dauerhaft speichern.
- Beim erneuten Verbinden mit diesem **gespeicherten** Device-Token sollte auch das gespeicherte
  genehmigte Scope-Set für dieses Token wiederverwendet werden. Dadurch bleiben Lese-/Probe-/Statuszugriffe
  erhalten, die bereits gewährt wurden, und es wird vermieden, Reconnects stillschweigend auf einen
  engeren impliziten Nur-Admin-Scope zu reduzieren.
- Clientseitige Zusammenstellung der Connect-Authentifizierung (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` ist orthogonal und wird immer weitergeleitet, wenn gesetzt.
  - `auth.token` wird in Prioritätsreihenfolge befüllt: zuerst explizites Shared-Token,
    dann ein explizites `deviceToken`, danach ein gespeichertes gerätespezifisches Token (nach
    `deviceId` + `role` verschlüsselt).
  - `auth.bootstrapToken` wird nur gesendet, wenn keine der obigen Optionen ein
    `auth.token` ergeben hat. Ein Shared-Token oder ein beliebiges aufgelöstes Device-Token unterdrückt es.
  - Die automatische Hochstufung eines gespeicherten Device-Tokens beim einmaligen
    `AUTH_TOKEN_MISMATCH`-Retry ist auf **vertrauenswürdige Endpunkte** beschränkt:
    loopback oder `wss://` mit angeheftetem `tlsFingerprint`. Öffentliches `wss://`
    ohne Pinning qualifiziert sich nicht.
- Zusätzliche `hello-ok.auth.deviceTokens`-Einträge sind Bootstrap-Übergabe-Token.
  Speichern Sie sie nur dauerhaft, wenn die Verbindung Bootstrap-Authentifizierung über einen vertrauenswürdigen Transport
  wie `wss://` oder loopback/lokales Pairing verwendet hat.
- Wenn ein Client ein **explizites** `deviceToken` oder explizite `scopes` bereitstellt, bleibt dieses
  vom Aufrufer angeforderte Scope-Set autoritativ; zwischengespeicherte Scopes werden nur
  wiederverwendet, wenn der Client das gespeicherte gerätespezifische Token wiederverwendet.
- Device-Token können über `device.token.rotate` und
  `device.token.revoke` rotiert/widerrufen werden (erfordert den `operator.pairing`-Scope).
- `device.token.rotate` gibt Rotationsmetadaten zurück. Es gibt das Ersatz-
  Bearer-Token nur bei Aufrufen desselben Geräts wieder, die bereits mit
  diesem Device-Token authentifiziert sind, damit reine Token-Clients ihren Ersatz vor dem
  erneuten Verbinden dauerhaft speichern können. Shared-/Admin-Rotationen geben das Bearer-Token nicht wieder.
- Token-Ausgabe, -Rotation und -Widerruf bleiben auf das genehmigte Rollenset beschränkt,
  das im Pairing-Eintrag dieses Geräts aufgezeichnet ist; Token-Mutation kann keine Geräte-
  Rolle erweitern oder ansteuern, die durch die Pairing-Genehmigung nie gewährt wurde.
- Für Paired-Device-Token-Sitzungen ist die Geräteverwaltung selbstbezogen, sofern der
  Aufrufer nicht auch `operator.admin` besitzt: Nicht-Admin-Aufrufer können nur ihren **eigenen**
  Geräteeintrag entfernen/widerrufen/rotieren.
- `device.token.rotate` und `device.token.revoke` prüfen außerdem das Ziel-Operator-
  Token-Scope-Set gegen die aktuellen Sitzungsscopes des Aufrufers. Nicht-Admin-Aufrufer
  können kein breiteres Operator-Token rotieren oder widerrufen, als sie bereits besitzen.
- Authentifizierungsfehler enthalten `error.details.code` plus Hinweise zur Wiederherstellung:
  - `error.details.canRetryWithDeviceToken` (boolesch)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Clientverhalten für `AUTH_TOKEN_MISMATCH`:
  - Vertrauenswürdige Clients können einen begrenzten Retry mit einem zwischengespeicherten gerätespezifischen Token versuchen.
  - Wenn dieser Retry fehlschlägt, sollten Clients automatische Reconnect-Schleifen stoppen und Hinweise für Operator-Maßnahmen anzeigen.

## Geräteidentität + Pairing

- Nodes sollten eine stabile Geräteidentität (`device.id`) enthalten, die aus einem
  Schlüsselpaar-Fingerprint abgeleitet ist.
- Gateways stellen Tokens pro Gerät + Rolle aus.
- Für neue Geräte-IDs sind Pairing-Genehmigungen erforderlich, sofern die lokale
  automatische Genehmigung nicht aktiviert ist.
- Die automatische Pairing-Genehmigung ist auf direkte local loopback-Verbindungen
  ausgerichtet.
- OpenClaw verfügt außerdem über einen engen backend-/containerlokalen
  Selbstverbindungspfad für vertrauenswürdige Shared-Secret-Hilfsabläufe.
- Tailnet- oder LAN-Verbindungen auf demselben Host werden für das Pairing weiterhin
  als remote behandelt und erfordern eine Genehmigung.
- WS-Clients enthalten normalerweise während `connect` eine `device`-Identität
  (Operator + Node). Die einzigen operatorseitigen Ausnahmen ohne Gerät sind
  explizite Vertrauenspfade:
  - `gateway.controlUi.allowInsecureAuth=true` für localhost-only unsichere HTTP-Kompatibilität.
  - erfolgreiche `gateway.auth.mode: "trusted-proxy"`-Operator-Control-UI-Authentifizierung.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (Break-Glass, erhebliche Sicherheitsherabstufung).
  - direct-loopback-`gateway-client`-Backend-RPCs, die mit dem gemeinsamen
    Gateway-Token/Passwort authentifiziert sind.
- Alle Verbindungen müssen die vom Server bereitgestellte `connect.challenge`-Nonce
  signieren.

### Diagnosedaten zur Migration der Geräteauthentifizierung

Für Legacy-Clients, die noch das Signierverhalten vor der Challenge verwenden, gibt `connect` jetzt
`DEVICE_AUTH_*`-Detailcodes unter `error.details.code` mit einem stabilen `error.details.reason` zurück.

Häufige Migrationsfehler:

| Meldung                     | details.code                     | details.reason           | Bedeutung                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client hat `device.nonce` weggelassen (oder leer gesendet). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client hat mit einer veralteten/falschen Nonce signiert. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signatur-Payload stimmt nicht mit dem v2-Payload überein. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Signierter Zeitstempel liegt außerhalb der zulässigen Abweichung. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` stimmt nicht mit dem Public-Key-Fingerprint überein. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public-Key-Format/Kanonisierung fehlgeschlagen.    |

Migrationsziel:

- Warten Sie immer auf `connect.challenge`.
- Signieren Sie den v2-Payload, der die Server-Nonce enthält.
- Senden Sie dieselbe Nonce in `connect.params.device.nonce`.
- Der bevorzugte Signatur-Payload ist `v3`, der zusätzlich zu den Feldern für
  Gerät/Client/Rolle/Scopes/Token/Nonce auch `platform` und `deviceFamily` bindet.
- Legacy-`v2`-Signaturen werden aus Kompatibilitätsgründen weiterhin akzeptiert,
  aber das Metadaten-Pinning gekoppelter Geräte steuert beim erneuten Verbinden
  weiterhin die Befehlsrichtlinie.

## TLS + Pinning

- TLS wird für WS-Verbindungen unterstützt.
- Clients können optional den Fingerprint des Gateway-Zertifikats pinnen (siehe
  `gateway.tls`-Konfiguration plus `gateway.remote.tlsFingerprint` oder CLI
  `--tls-fingerprint`).

## Geltungsbereich

Dieses Protokoll stellt die **vollständige Gateway-API** bereit (Status, Kanäle,
Modelle, Chat, Agent, Sitzungen, Nodes, Genehmigungen usw.). Die genaue Oberfläche
wird durch die TypeBox-Schemas in `src/gateway/protocol/schema.ts` definiert.

## Verwandte Themen

- [Bridge-Protokoll](/de/gateway/bridge-protocol)
- [Gateway-Runbook](/de/gateway)
