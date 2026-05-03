---
read_when:
    - Implementieren oder Aktualisieren von Gateway-WS-Clients
    - Fehlersuche bei Protokollabweichungen oder Verbindungsfehlern
    - Protokollschema und -modelle neu generieren
summary: 'Gateway-WebSocket-Protokoll: Handshake, Frames, Versionierung'
title: Gateway-Protokoll
x-i18n:
    generated_at: "2026-05-03T06:38:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 06f6e1f2188860362bff481e646bd1c4bae4cf8f9a9ccae4fbd5ceea434d2247
    source_path: gateway/protocol.md
    workflow: 16
---

Das Gateway-WS-Protokoll ist die **einzige Control Plane + der Node-Transport** für
OpenClaw. Alle Clients (CLI, Web-UI, macOS-App, iOS-/Android-Nodes, Headless-
Nodes) verbinden sich über WebSocket und deklarieren ihre **Rolle** + ihren
**Scope** zum Zeitpunkt des Handshakes.

## Transport

- WebSocket, Text-Frames mit JSON-Payloads.
- Der erste Frame **muss** eine `connect`-Anfrage sein.
- Pre-Connect-Frames sind auf 64 KiB begrenzt. Nach einem erfolgreichen Handshake sollten Clients
  die Grenzwerte `hello-ok.policy.maxPayload` und
  `hello-ok.policy.maxBufferedBytes` einhalten. Bei aktivierter Diagnose
  erzeugen übergroße eingehende Frames und langsame ausgehende Puffer `payload.large`-Ereignisse,
  bevor das Gateway den betroffenen Frame schließt oder verwirft. Diese Ereignisse speichern
  Größen, Grenzwerte, Oberflächen und sichere Reason-Codes. Sie speichern nicht den Nachrichtentext,
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

Während das Gateway noch die Startup-Sidecars abschließt, kann die `connect`-Anfrage
einen wiederholbaren `UNAVAILABLE`-Fehler zurückgeben, bei dem `details.reason` auf
`"startup-sidecars"` und `retryAfterMs` gesetzt ist. Clients sollten diese Antwort
innerhalb ihres gesamten Verbindungsbudgets erneut versuchen, statt sie als terminalen
Handshake-Fehler anzuzeigen.

`server`, `features`, `snapshot` und `policy` sind alle durch das Schema erforderlich
(`src/gateway/protocol/schema/frames.ts`). `auth` ist ebenfalls erforderlich und meldet
die ausgehandelte Rolle/die ausgehandelten Scopes. `canvasHostUrl` ist optional.

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
`client.mode: "backend"`) dürfen `device` bei direkten Loopback-Verbindungen auslassen, wenn
sie sich mit dem gemeinsamen Gateway-Token/Passwort authentifizieren. Dieser Pfad ist
für interne Control-Plane-RPCs reserviert und verhindert, dass veraltete CLI-/Geräte-Pairing-
Baselines lokale Backend-Arbeit wie Subagent-Sitzungsaktualisierungen blockieren. Remote-Clients,
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
- **Ereignis**: `{type:"event", event, payload, seq?, stateVersion?}`

Methoden mit Seiteneffekten erfordern **Idempotenzschlüssel** (siehe Schema).

## Rollen + Scopes

Das vollständige Operator-Scope-Modell, Prüfungen zum Genehmigungszeitpunkt und Shared-Secret-
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

Von Plugins registrierte Gateway-RPC-Methoden können ihren eigenen Operator-Scope anfordern, aber
reservierte Core-Admin-Präfixe (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) werden immer zu `operator.admin` aufgelöst.

Der Methoden-Scope ist nur die erste Hürde. Einige Slash-Befehle, die über
`chat.send` erreicht werden, wenden darüber hinaus strengere Prüfungen auf Befehlsebene an.
Beispielsweise erfordern persistente Schreibvorgänge mit `/config set` und `/config unset`
`operator.admin`.

`node.pair.approve` hat zusätzlich zum Basis-Methoden-Scope eine weitere Scope-Prüfung
zum Genehmigungszeitpunkt:

- Anfragen ohne Befehl: `operator.pairing`
- Anfragen mit Nicht-Exec-Node-Befehlen: `operator.pairing` + `operator.write`
- Anfragen, die `system.run`, `system.run.prepare` oder `system.which` enthalten:
  `operator.pairing` + `operator.admin`

### Caps/Befehle/Berechtigungen (Node)

Nodes deklarieren Capability-Claims zum Verbindungszeitpunkt:

- `caps`: übergeordnete Capability-Kategorien.
- `commands`: Befehls-Allowlist für Invoke.
- `permissions`: granulare Schalter (z. B. `screen.record`, `camera.capture`).

Das Gateway behandelt diese als **Claims** und erzwingt serverseitige Allowlists.

## Presence

- `system-presence` gibt Einträge zurück, die nach Geräteidentität indiziert sind.
- Presence-Einträge enthalten `deviceId`, `roles` und `scopes`, damit UIs eine einzelne Zeile pro Gerät anzeigen können,
  selbst wenn es sowohl als **Operator** als auch als **Node** verbunden ist.
- `node.list` enthält optionale Felder `lastSeenAtMs` und `lastSeenReason`. Verbundene Nodes melden
  ihre aktuelle Verbindungszeit als `lastSeenAtMs` mit dem Grund `connect`; gepairte Nodes können außerdem
  dauerhafte Background-Presence melden, wenn ein vertrauenswürdiges Node-Ereignis ihre Pairing-Metadaten aktualisiert.

### Background-Alive-Ereignis des Nodes

Nodes können `node.event` mit `event: "node.presence.alive"` aufrufen, um zu protokollieren, dass ein gepairter Node
während eines Background-Wake aktiv war, ohne ihn als verbunden zu markieren.

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` ist ein geschlossenes Enum: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual` oder `connect`. Unbekannte Trigger-Strings werden vom Gateway vor der Persistierung zu
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
bestätigten RPC behandeln, nicht als dauerhafte Presence-Persistierung.

## Scoping von Broadcast-Ereignissen

Vom Server gepushte WebSocket-Broadcast-Ereignisse sind scope-gesteuert, sodass Sitzungen mit Pairing-Scope oder reine Node-Sitzungen Sitzungsinhalte nicht passiv empfangen.

- **Chat-, Agent- und Tool-Ergebnis-Frames** (einschließlich gestreamter `agent`-Ereignisse und Tool-Call-Ergebnisse) erfordern mindestens `operator.read`. Sitzungen ohne `operator.read` überspringen diese Frames vollständig.
- **Plugin-definierte `plugin.*`-Broadcasts** werden auf `operator.write` oder `operator.admin` begrenzt, abhängig davon, wie das Plugin sie registriert hat.
- **Status- und Transportereignisse** (`heartbeat`, `presence`, `tick`, Connect-/Disconnect-Lifecycle usw.) bleiben uneingeschränkt, damit der Transportzustand für jede authentifizierte Sitzung beobachtbar bleibt.
- **Unbekannte Broadcast-Ereignisfamilien** sind standardmäßig scope-gesteuert (fail-closed), sofern ein registrierter Handler sie nicht ausdrücklich lockert.

Jede Client-Verbindung behält ihre eigene Sequenznummer pro Client, sodass Broadcasts auf diesem Socket eine monotone Reihenfolge bewahren, selbst wenn verschiedene Clients unterschiedliche scope-gefilterte Teilmengen des Ereignisstroms sehen.

## Häufige RPC-Methodenfamilien

Die öffentliche WS-Oberfläche ist breiter als die oben gezeigten Handshake-/Auth-Beispiele. Dies
ist kein generierter Dump — `hello-ok.features.methods` ist eine konservative
Discovery-Liste, die aus `src/gateway/server-methods-list.ts` sowie geladenen
Plugin-/Channel-Methodenexporten erstellt wird. Behandeln Sie sie als Feature-Discovery, nicht als vollständige
Aufzählung von `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System und Identität">
    - `health` gibt den gecachten oder frisch geprüften Gateway-Health-Snapshot zurück.
    - `diagnostics.stability` gibt den aktuellen begrenzten Diagnose-Stabilitätsrekorder zurück. Er speichert operative Metadaten wie Ereignisnamen, Zählwerte, Bytegrößen, Speicherwerte, Queue-/Sitzungszustand, Channel-/Plugin-Namen und Sitzungs-IDs. Er speichert keinen Chattext, keine Webhook-Bodys, keine Tool-Ausgaben, keine rohen Anfrage- oder Antwort-Bodys, Tokens, Cookies oder geheimen Werte. Operator-Lese-Scope ist erforderlich.
    - `status` gibt die Gateway-Zusammenfassung im Stil von `/status` zurück; sensible Felder werden nur für Operator-Clients mit Admin-Scope einbezogen.
    - `gateway.identity.get` gibt die Gateway-Geräteidentität zurück, die von Relay- und Pairing-Flows verwendet wird.
    - `system-presence` gibt den aktuellen Presence-Snapshot für verbundene Operator-/Node-Geräte zurück.
    - `system-event` fügt ein Systemereignis an und kann Presence-Kontext aktualisieren/übertragen.
    - `last-heartbeat` gibt das zuletzt persistierte Heartbeat-Ereignis zurück.
    - `set-heartbeats` schaltet die Heartbeat-Verarbeitung auf dem Gateway um.

  </Accordion>

  <Accordion title="Modelle und Nutzung">
    - `models.list` gibt den zur Laufzeit erlaubten Modellkatalog zurück. Übergeben Sie `{ "view": "configured" }` für Picker-große konfigurierte Modelle (`agents.defaults.models` zuerst, dann `models.providers.*.models`) oder `{ "view": "all" }` für den vollständigen Katalog.
    - `usage.status` gibt Provider-Nutzungsfenster und Zusammenfassungen des verbleibenden Kontingents zurück.
    - `usage.cost` gibt aggregierte Kostennutzungszusammenfassungen für einen Datumsbereich zurück.
    - `doctor.memory.status` gibt die Bereitschaft von Vektorspeicher / zwischengespeicherten Einbettungen für den aktiven Standard-Agent-Arbeitsbereich zurück. Übergeben Sie `{ "probe": true }` oder `{ "deep": true }` nur, wenn der Aufrufer ausdrücklich einen Live-Ping an den Einbettungs-Provider wünscht.
    - `doctor.memory.remHarness` gibt eine begrenzte, schreibgeschützte REM-Harness-Vorschau für Remote-Control-Plane-Clients zurück. Sie kann Arbeitsbereichspfade, Speicherausschnitte, gerendertes fundiertes Markdown und Kandidaten für Deep Promotion enthalten, daher benötigen Aufrufer `operator.read`.
    - `sessions.usage` gibt Nutzungszusammenfassungen pro Sitzung zurück.
    - `sessions.usage.timeseries` gibt Zeitreihennutzung für eine Sitzung zurück.
    - `sessions.usage.logs` gibt Nutzungsprotokolleinträge für eine Sitzung zurück.

  </Accordion>

  <Accordion title="Kanäle und Anmeldehilfen">
    - `channels.status` gibt Statuszusammenfassungen für integrierte + gebündelte Kanäle/Plugins zurück.
    - `channels.logout` meldet einen bestimmten Kanal/ein bestimmtes Konto ab, sofern der Kanal Abmeldung unterstützt.
    - `web.login.start` startet einen QR-/Web-Anmeldefluss für den aktuellen QR-fähigen Webkanal-Provider.
    - `web.login.wait` wartet auf den Abschluss dieses QR-/Web-Anmeldeflusses und startet den Kanal bei Erfolg.
    - `push.test` sendet einen APNs-Test-Push an einen registrierten iOS-Node.
    - `voicewake.get` gibt die gespeicherten Wake-Word-Auslöser zurück.
    - `voicewake.set` aktualisiert Wake-Word-Auslöser und überträgt die Änderung.

  </Accordion>

  <Accordion title="Messaging und Protokolle">
    - `send` ist der direkte RPC für ausgehende Zustellung für kanal-/konto-/threadbezogene Sends außerhalb des Chat-Runners.
    - `logs.tail` gibt das konfigurierte Gateway-Dateiprotokollende mit Cursor-/Limit- und Max-Byte-Steuerung zurück.

  </Accordion>

  <Accordion title="Talk und TTS">
    - `talk.config` gibt die effektive Talk-Konfigurationsnutzlast zurück; `includeSecrets` erfordert `operator.talk.secrets` (oder `operator.admin`).
    - `talk.mode` setzt/überträgt den aktuellen Talk-Moduszustand für WebChat-/Control-UI-Clients.
    - `talk.speak` synthetisiert Sprache über den aktiven Talk-Sprach-Provider.
    - `tts.status` gibt den aktivierten TTS-Zustand, den aktiven Provider, Fallback-Provider und den Provider-Konfigurationszustand zurück.
    - `tts.providers` gibt das sichtbare TTS-Provider-Inventar zurück.
    - `tts.enable` und `tts.disable` schalten den TTS-Einstellungszustand um.
    - `tts.setProvider` aktualisiert den bevorzugten TTS-Provider.
    - `tts.convert` führt eine einmalige Text-zu-Sprache-Konvertierung aus.

  </Accordion>

  <Accordion title="Geheimnisse, Konfiguration, Update und Assistent">
    - `secrets.reload` löst aktive SecretRefs erneut auf und tauscht den Laufzeit-Geheimniszustand nur bei vollständigem Erfolg aus.
    - `secrets.resolve` löst befehlszielbezogene Geheimniszuweisungen für einen bestimmten Befehls-/Zielsatz auf.
    - `config.get` gibt den aktuellen Konfigurations-Snapshot und Hash zurück.
    - `config.set` schreibt eine validierte Konfigurationsnutzlast.
    - `config.patch` führt eine partielle Konfigurationsaktualisierung zusammen.
    - `config.apply` validiert + ersetzt die vollständige Konfigurationsnutzlast.
    - `config.schema` gibt die Live-Konfigurationsschemanutzlast zurück, die von Control UI und CLI-Tools verwendet wird: Schema, `uiHints`, Version und Generierungsmetadaten, einschließlich Plugin- + Kanalschemametadaten, wenn die Laufzeit sie laden kann. Das Schema enthält Feldmetadaten `title` / `description`, die aus denselben Labels und Hilfetexten abgeleitet sind, die auch die UI verwendet, einschließlich verschachtelter Objekte, Wildcards, Array-Elemente und `anyOf` / `oneOf` / `allOf`-Kompositionszweige, wenn passende Felddokumentation vorhanden ist.
    - `config.schema.lookup` gibt eine pfadbezogene Lookup-Nutzlast für einen Konfigurationspfad zurück: normalisierter Pfad, ein flacher Schemaknoten, passender Hinweis + `hintPath` und unmittelbare Kindzusammenfassungen für UI-/CLI-Drilldown. Lookup-Schemaknoten behalten die benutzerorientierte Dokumentation und allgemeine Validierungsfelder (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerische/String-/Array-/Objektgrenzen und Flags wie `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Kindzusammenfassungen stellen `key`, normalisierten `path`, `type`, `required`, `hasChildren` sowie den passenden `hint` / `hintPath` bereit.
    - `update.run` führt den Gateway-Update-Fluss aus und plant einen Neustart nur, wenn das Update selbst erfolgreich war. Package-Manager-Updates erzwingen nach dem Pakettausch einen nicht verzögerten Update-Neustart ohne Cooldown, damit der alte Gateway-Prozess nicht weiter Lazy Loading aus einem ersetzten `dist`-Baum ausführt.
    - `update.status` gibt den zuletzt zwischengespeicherten Sentinel für den Update-Neustart zurück, einschließlich der nach dem Neustart laufenden Version, sofern verfügbar.
    - `wizard.start`, `wizard.next`, `wizard.status` und `wizard.cancel` stellen den Onboarding-Assistenten über WS-RPC bereit.

  </Accordion>

  <Accordion title="Agent- und Arbeitsbereichshilfen">
    - `agents.list` gibt konfigurierte Agent-Einträge zurück, einschließlich effektivem Modell und Laufzeitmetadaten.
    - `agents.create`, `agents.update` und `agents.delete` verwalten Agent-Datensätze und Arbeitsbereichsverdrahtung.
    - `agents.files.list`, `agents.files.get` und `agents.files.set` verwalten die Bootstrap-Arbeitsbereichsdateien, die für einen Agent offengelegt werden.
    - `artifacts.list`, `artifacts.get` und `artifacts.download` stellen aus Transkripten abgeleitete Artefaktzusammenfassungen und Downloads für einen expliziten `sessionKey`-, `runId`- oder `taskId`-Geltungsbereich bereit. Run- und Task-Abfragen lösen die zugehörige Sitzung serverseitig auf und geben nur Transkriptmedien mit passender Provenienz zurück; unsichere oder lokale URL-Quellen geben nicht unterstützte Downloads zurück, statt serverseitig abgerufen zu werden.
    - `agent.identity.get` gibt die effektive Assistant-Identität für einen Agent oder eine Sitzung zurück.
    - `agent.wait` wartet auf das Ende eines Runs und gibt den terminalen Snapshot zurück, sofern verfügbar.

  </Accordion>

  <Accordion title="Sitzungssteuerung">
    - `sessions.list` gibt den aktuellen Sitzungsindex zurück, einschließlich `agentRuntime`-Metadaten pro Zeile, wenn ein Agent-Laufzeit-Backend konfiguriert ist.
    - `sessions.subscribe` und `sessions.unsubscribe` schalten Sitzungsänderungsereignis-Abonnements für den aktuellen WS-Client um.
    - `sessions.messages.subscribe` und `sessions.messages.unsubscribe` schalten Transkript-/Nachrichtenereignis-Abonnements für eine Sitzung um.
    - `sessions.preview` gibt begrenzte Transkriptvorschauen für bestimmte Sitzungsschlüssel zurück.
    - `sessions.describe` gibt eine Gateway-Sitzungszeile für einen exakten Sitzungsschlüssel zurück.
    - `sessions.resolve` löst ein Sitzungsziel auf oder kanonisiert es.
    - `sessions.create` erstellt einen neuen Sitzungseintrag.
    - `sessions.send` sendet eine Nachricht in eine vorhandene Sitzung.
    - `sessions.steer` ist die Interrupt-and-Steer-Variante für eine aktive Sitzung.
    - `sessions.abort` bricht aktive Arbeit für eine Sitzung ab. Ein Aufrufer kann `key` plus optional `runId` übergeben oder nur `runId` für aktive Runs übergeben, die das Gateway einer Sitzung zuordnen kann.
    - `sessions.patch` aktualisiert Sitzungsmetadaten/-Überschreibungen und meldet das aufgelöste kanonische Modell sowie die effektive `agentRuntime`.
    - `sessions.reset`, `sessions.delete` und `sessions.compact` führen Sitzungswartung aus.
    - `sessions.get` gibt die vollständige gespeicherte Sitzungszeile zurück.
    - Die Chatausführung verwendet weiterhin `chat.history`, `chat.send`, `chat.abort` und `chat.inject`. `chat.history` ist für UI-Clients anzeige-normalisiert: Inline-Direktiv-Tags werden aus sichtbarem Text entfernt, Klartext-XML-Nutzlasten für Tool-Aufrufe (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Tool-Aufrufblöcke) sowie durchgesickerte ASCII-/Vollbreiten-Modellsteuerungstokens werden entfernt, reine Silent-Token-Assistant-Zeilen wie exaktes `NO_REPLY` / `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden.

  </Accordion>

  <Accordion title="Gerätekopplung und Gerätetokens">
    - `device.pair.list` gibt ausstehende und genehmigte gekoppelte Geräte zurück.
    - `device.pair.approve`, `device.pair.reject` und `device.pair.remove` verwalten Gerätekopplungsdatensätze.
    - `device.token.rotate` rotiert ein gekoppeltes Gerätetoken innerhalb seiner genehmigten Rollen- und Aufrufergeltungsbereichsgrenzen.
    - `device.token.revoke` widerruft ein gekoppeltes Gerätetoken innerhalb seiner genehmigten Rollen- und Aufrufergeltungsbereichsgrenzen.

  </Accordion>

  <Accordion title="Node-Kopplung, Invoke und ausstehende Arbeit">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove` und `node.pair.verify` decken Node-Kopplung und Bootstrap-Verifizierung ab.
    - `node.list` und `node.describe` geben den bekannten/verbundenen Node-Zustand zurück.
    - `node.rename` aktualisiert ein gekoppeltes Node-Label.
    - `node.invoke` leitet einen Befehl an einen verbundenen Node weiter.
    - `node.invoke.result` gibt das Ergebnis für eine Invoke-Anforderung zurück.
    - `node.event` trägt von Nodes stammende Ereignisse zurück in das Gateway.
    - `node.canvas.capability.refresh` aktualisiert bereichsbezogene Canvas-Capability-Tokens.
    - `node.pending.pull` und `node.pending.ack` sind die APIs der verbundenen Node-Warteschlange.
    - `node.pending.enqueue` und `node.pending.drain` verwalten dauerhafte ausstehende Arbeit für Offline-/getrennte Nodes.

  </Accordion>

  <Accordion title="Genehmigungsfamilien">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` und `exec.approval.resolve` decken einmalige Exec-Genehmigungsanforderungen sowie Suche/Wiedergabe ausstehender Genehmigungen ab.
    - `exec.approval.waitDecision` wartet auf eine ausstehende Exec-Genehmigung und gibt die endgültige Entscheidung zurück (oder `null` bei Timeout).
    - `exec.approvals.get` und `exec.approvals.set` verwalten Gateway-Snapshots der Exec-Genehmigungsrichtlinie.
    - `exec.approvals.node.get` und `exec.approvals.node.set` verwalten die Node-lokale Exec-Genehmigungsrichtlinie über Node-Relay-Befehle.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` und `plugin.approval.resolve` decken Plugin-definierte Genehmigungsflüsse ab.

  </Accordion>

  <Accordion title="Automatisierung, Skills und Tools">
    - Automatisierung: `wake` plant eine sofortige oder beim nächsten Heartbeat erfolgende Wake-Textinjektion; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` verwalten geplante Arbeit.
    - Skills und Tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`.

  </Accordion>
</AccordionGroup>

### Häufige Ereignisfamilien

- `chat`: UI-Chat-Aktualisierungen wie `chat.inject` und andere rein transkriptbezogene Chat-Ereignisse.
- `session.message` und `session.tool`: Transkript-/Ereignisstream-Aktualisierungen für eine abonnierte Sitzung.
- `sessions.changed`: Sitzungsindex oder Metadaten wurden geändert.
- `presence`: Aktualisierungen des Systempräsenz-Snapshots.
- `tick`: periodisches Keepalive-/Liveness-Ereignis.
- `health`: Aktualisierung des Gateway-Integritäts-Snapshots.
- `heartbeat`: Aktualisierung des Heartbeat-Ereignisstreams.
- `cron`: Änderungsereignis für Cron-Run/-Job.
- `shutdown`: Gateway-Herunterfahrbenachrichtigung.
- `node.pair.requested` / `node.pair.resolved`: Node-Kopplungslebenszyklus.
- `node.invoke.request`: Broadcast der Node-Invoke-Anforderung.
- `device.pair.requested` / `device.pair.resolved`: Lebenszyklus gekoppelter Geräte.
- `voicewake.changed`: Wake-Word-Auslöserkonfiguration geändert.
- `exec.approval.requested` / `exec.approval.resolved`: Exec-Genehmigungslebenszyklus.
- `plugin.approval.requested` / `plugin.approval.resolved`: Plugin-Genehmigungslebenszyklus.

### Node-Hilfsmethoden

- Nodes können `skills.bins` aufrufen, um die aktuelle Liste der Skill-Ausführungsdateien für Auto-Allow-Prüfungen abzurufen.

### Operator-Hilfsmethoden

- Operatoren können `commands.list` (`operator.read`) aufrufen, um das Laufzeit-
  Befehlsinventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agentenarbeitsbereich zu lesen.
  - `scope` steuert, auf welche Oberfläche das primäre `name` zielt:
    - `text` gibt das primäre Textbefehlstoken ohne führendes `/` zurück
    - `native` und der standardmäßige `both`-Pfad geben Provider-bewusste native Namen zurück,
      sofern verfügbar
  - `textAliases` enthält exakte Slash-Aliasse wie `/model` und `/m`.
  - `nativeName` enthält den Provider-bewussten nativen Befehlsnamen, sofern einer existiert.
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
    vom Aufrufer bereitgestellten Authentifizierungs- oder Zustellungskontext zu akzeptieren.
  - Die Antwort ist sitzungsbezogen und spiegelt wider, was die aktive Unterhaltung derzeit verwenden kann,
    einschließlich Core-, Plugin- und Kanal-Tools.
- Operatoren können `tools.invoke` (`operator.write`) aufrufen, um ein verfügbares Tool über denselben
  Gateway-Policy-Pfad wie `/tools/invoke` aufzurufen.
  - `name` ist erforderlich. `args`, `sessionKey`, `agentId`, `confirm` und
    `idempotencyKey` sind optional.
  - Wenn sowohl `sessionKey` als auch `agentId` vorhanden sind, muss der aufgelöste Sitzungsagent mit
    `agentId` übereinstimmen.
  - Die Antwort ist ein SDK-orientierter Antwortumschlag mit `ok`, `toolName`, optionalem `output` und typisierten
    `error`-Feldern. Genehmigungs- oder Policy-Ablehnungen geben `ok:false` in der Nutzlast zurück, statt
    die Gateway-Tool-Policy-Pipeline zu umgehen.
- Operatoren können `skills.status` (`operator.read`) aufrufen, um das sichtbare
  Skills-Inventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agentenarbeitsbereich zu lesen.
  - Die Antwort enthält Berechtigung, fehlende Anforderungen, Konfigurationsprüfungen und
    bereinigte Installationsoptionen, ohne rohe geheime Werte offenzulegen.
- Operatoren können `skills.search` und `skills.detail` (`operator.read`) für
  ClawHub-Erkennungsmetadaten aufrufen.
- Operatoren können `skills.install` (`operator.admin`) in zwei Modi aufrufen:
  - ClawHub-Modus: `{ source: "clawhub", slug, version?, force? }` installiert einen
    Skills-Ordner in das `skills/`-Verzeichnis des Standard-Agentenarbeitsbereichs.
  - Gateway-Installationsmodus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    führt eine deklarierte `metadata.openclaw.install`-Aktion auf dem Gateway-Host aus.
- Operatoren können `skills.update` (`operator.admin`) in zwei Modi aufrufen:
  - Der ClawHub-Modus aktualisiert einen nachverfolgten Slug oder alle nachverfolgten ClawHub-Installationen im
    Standard-Agentenarbeitsbereich.
  - Der Konfigurationsmodus patcht `skills.entries.<skillKey>`-Werte wie `enabled`,
    `apiKey` und `env`.

### `models.list`-Ansichten

`models.list` akzeptiert einen optionalen `view`-Parameter:

- Weggelassen oder `"default"`: aktuelles Laufzeitverhalten. Wenn `agents.defaults.models` konfiguriert ist, ist die Antwort der erlaubte Katalog; andernfalls ist die Antwort der vollständige Gateway-Katalog.
- `"configured"`: Auswahlverhalten in Picker-Größe. Wenn `agents.defaults.models` konfiguriert ist, hat es weiterhin Vorrang. Andernfalls verwendet die Antwort explizite `models.providers.*.models`-Einträge und fällt nur dann auf den vollständigen Katalog zurück, wenn keine konfigurierten Modellzeilen existieren.
- `"all"`: vollständiger Gateway-Katalog, wobei `agents.defaults.models` umgangen wird. Verwenden Sie dies für Diagnose- und Erkennungs-UIs, nicht für normale Modellauswahlen.

## Ausführungsgenehmigungen

- Wenn eine Ausführungsanforderung Genehmigung benötigt, sendet das Gateway `exec.approval.requested`.
- Operator-Clients lösen dies durch Aufruf von `exec.approval.resolve` auf (erfordert den Scope `operator.approvals`).
- Für `host=node` muss `exec.approval.request` `systemRunPlan` enthalten (kanonische `argv`/`cwd`/`rawCommand`/Sitzungsmetadaten). Anforderungen ohne `systemRunPlan` werden abgelehnt.
- Nach Genehmigung verwenden weitergeleitete `node.invoke system.run`-Aufrufe denselben kanonischen
  `systemRunPlan` als maßgeblichen Befehls-/cwd-/Sitzungskontext.
- Wenn ein Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` zwischen Vorbereitung und der final genehmigten `system.run`-Weiterleitung verändert, lehnt das
  Gateway die Ausführung ab, statt der veränderten Nutzlast zu vertrauen.

## Fallback für Agentenzustellung

- `agent`-Anforderungen können `deliver=true` enthalten, um ausgehende Zustellung anzufordern.
- `bestEffortDeliver=false` behält striktes Verhalten bei: nicht auflösbare oder nur interne Zustellungsziele geben `INVALID_REQUEST` zurück.
- `bestEffortDeliver=true` erlaubt den Fallback auf sitzungsgebundene Ausführung, wenn keine extern zustellbare Route aufgelöst werden kann (zum Beispiel interne/Webchat-Sitzungen oder mehrdeutige Mehrkanalkonfigurationen).

## Versionierung

- `PROTOCOL_VERSION` befindet sich in `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clients senden `minProtocol` + `maxProtocol`; der Server lehnt Nichtübereinstimmungen ab.
- Schemas + Modelle werden aus TypeBox-Definitionen generiert:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Client-Konstanten

Der Referenzclient in `src/gateway/client.ts` verwendet diese Standardwerte. Werte sind
über Protokoll v3 hinweg stabil und bilden die erwartete Basis für Drittanbieter-Clients.

| Konstante                                 | Standardwert                                          | Quelle                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`                                         |
| Anfrage-Timeout (pro RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)                                              |
| Preauth-/Connect-Challenge-Timeout        | `15_000` ms                                           | `src/gateway/handshake-timeouts.ts` (Konfig/env kann das gekoppelte Server-/Client-Budget erhöhen) |
| Anfänglicher Reconnect-Backoff            | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                                                     |
| Maximaler Reconnect-Backoff               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)                                             |
| Fast-Retry-Begrenzung nach Device-Token-Schließung | `250` ms                                      | `src/gateway/client.ts`                                                                   |
| Force-Stop-Nachfrist vor `terminate()`    | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                           |
| Standard-Timeout von `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                |
| Standard-Tick-Intervall (vor `hello-ok`)  | `30_000` ms                                           | `src/gateway/client.ts`                                                                   |
| Schließung bei Tick-Timeout               | Code `4000`, wenn Stille `tickIntervalMs * 2` überschreitet | `src/gateway/client.ts`                                                              |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                         |

Der Server kündigt die wirksamen Werte `policy.tickIntervalMs`, `policy.maxPayload`
und `policy.maxBufferedBytes` in `hello-ok` an; Clients sollten diese Werte
statt der Standardwerte vor dem Handshake beachten.

## Auth

- Die Shared-Secret-Authentifizierung des Gateway verwendet `connect.params.auth.token` oder
  `connect.params.auth.password`, abhängig vom konfigurierten Auth-Modus.
- Identität führende Modi wie Tailscale Serve
  (`gateway.auth.allowTailscale: true`) oder nicht über Loopback laufendes
  `gateway.auth.mode: "trusted-proxy"` erfüllen die Connect-Auth-Prüfung über
  Request-Header statt über `connect.params.auth.*`.
- Private-Ingress `gateway.auth.mode: "none"` überspringt die Shared-Secret-Connect-Auth
  vollständig; setzen Sie diesen Modus nicht auf öffentlichem/nicht vertrauenswürdigem Ingress ein.
- Nach dem Pairing stellt das Gateway ein **Geräte-Token** aus, das auf die Verbindungsrolle
  + Scopes beschränkt ist. Es wird in `hello-ok.auth.deviceToken` zurückgegeben und sollte
  vom Client für zukünftige Verbindungen persistent gespeichert werden.
- Clients sollten das primäre `hello-ok.auth.deviceToken` nach jeder
  erfolgreichen Verbindung persistent speichern.
- Beim erneuten Verbinden mit diesem **gespeicherten** Geräte-Token sollte auch der gespeicherte
  genehmigte Scope-Satz für dieses Token wiederverwendet werden. Dadurch bleiben bereits
  gewährte Lese-/Probe-/Statuszugriffe erhalten, und erneute Verbindungen fallen nicht stillschweigend
  auf einen engeren impliziten Nur-Admin-Scope zurück.
- Clientseitige Zusammenstellung der Connect-Auth (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` ist orthogonal und wird immer weitergeleitet, wenn es gesetzt ist.
  - `auth.token` wird nach Priorität befüllt: zuerst explizites Shared Token,
    dann ein explizites `deviceToken`, danach ein gespeichertes gerätespezifisches Token (indiziert nach
    `deviceId` + `role`).
  - `auth.bootstrapToken` wird nur gesendet, wenn keiner der obigen Werte ein
    `auth.token` ergeben hat. Ein Shared Token oder ein beliebig aufgelöstes Geräte-Token unterdrückt es.
  - Die automatische Hochstufung eines gespeicherten Geräte-Tokens beim einmaligen
    `AUTH_TOKEN_MISMATCH`-Retry ist auf **vertrauenswürdige Endpunkte** beschränkt —
    Loopback oder `wss://` mit fest gepinntem `tlsFingerprint`. Öffentliches `wss://`
    ohne Pinning qualifiziert sich nicht.
- Zusätzliche Einträge in `hello-ok.auth.deviceTokens` sind Bootstrap-Handoff-Tokens.
  Speichern Sie sie nur persistent, wenn die Verbindung Bootstrap-Auth über einen vertrauenswürdigen Transport
  wie `wss://` oder Loopback/lokales Pairing verwendet hat.
- Wenn ein Client ein **explizites** `deviceToken` oder explizite `scopes` angibt, bleibt dieser
  vom Aufrufer angeforderte Scope-Satz maßgeblich; gecachte Scopes werden nur
  wiederverwendet, wenn der Client das gespeicherte gerätespezifische Token wiederverwendet.
- Geräte-Tokens können über `device.token.rotate` und
  `device.token.revoke` rotiert/widerrufen werden (erfordert den Scope `operator.pairing`).
- `device.token.rotate` gibt Rotationsmetadaten zurück. Es gibt das Ersatz-Bearer-Token
  nur bei Aufrufen desselben Geräts zurück, die bereits mit
  diesem Geräte-Token authentifiziert sind, damit Token-only-Clients ihren Ersatz vor
  dem erneuten Verbinden persistent speichern können. Shared-/Admin-Rotationen geben das Bearer-Token nicht zurück.
- Token-Ausstellung, Rotation und Widerruf bleiben auf den genehmigten Rollensatz begrenzt,
  der im Pairing-Eintrag dieses Geräts gespeichert ist; Token-Mutationen können keine Geräterolle erweitern oder
  anvisieren, die durch die Pairing-Genehmigung nie gewährt wurde.
- Für Token-Sitzungen gepairter Geräte ist die Geräteverwaltung selbstbeschränkt, sofern der
  Aufrufer nicht zusätzlich `operator.admin` besitzt: Nicht-Admin-Aufrufer können nur ihren **eigenen**
  Geräteeintrag entfernen/widerrufen/rotieren.
- `device.token.rotate` und `device.token.revoke` prüfen außerdem den Ziel-Operator-
  Token-Scope-Satz gegen die aktuellen Sitzungsscopes des Aufrufers. Nicht-Admin-Aufrufer
  können kein breiteres Operator-Token rotieren oder widerrufen, als sie bereits besitzen.
- Auth-Fehler enthalten `error.details.code` plus Wiederherstellungshinweise:
  - `error.details.canRetryWithDeviceToken` (boolesch)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Client-Verhalten bei `AUTH_TOKEN_MISMATCH`:
  - Vertrauenswürdige Clients dürfen einen begrenzten Retry mit einem gecachten gerätespezifischen Token versuchen.
  - Wenn dieser Retry fehlschlägt, sollten Clients automatische Wiederverbindungsschleifen stoppen und Hinweise für Operator-Aktionen anzeigen.

## Geräteidentität + Pairing

- Nodes sollten eine stabile Geräteidentität (`device.id`) enthalten, die aus einem
  Schlüsselpaar-Fingerabdruck abgeleitet ist.
- Gateways stellen Tokens pro Gerät + Rolle aus.
- Pairing-Genehmigungen sind für neue Geräte-IDs erforderlich, sofern lokale automatische Genehmigung
  nicht aktiviert ist.
- Automatische Pairing-Genehmigung ist auf direkte local loopback-Verbindungen ausgerichtet.
- OpenClaw verfügt außerdem über einen schmalen backend-/containerlokalen Selbstverbindungspfad für
  vertrauenswürdige Shared-Secret-Hilfsflows.
- Tailnet- oder LAN-Verbindungen auf demselben Host werden für das Pairing weiterhin als remote behandelt und
  erfordern Genehmigung.
- WS-Clients enthalten während `connect` normalerweise die `device`-Identität (Operator +
  Node). Die einzigen gerätelosen Operator-Ausnahmen sind explizite Vertrauenspfade:
  - `gateway.controlUi.allowInsecureAuth=true` für localhost-only unsichere HTTP-Kompatibilität.
  - erfolgreiche Operator-Control-UI-Auth mit `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (Notfalloption, starke Sicherheitsabsenkung).
  - Direct-Loopback-`gateway-client`-Backend-RPCs, die mit dem gemeinsamen
    Gateway-Token/-Passwort authentifiziert sind.
- Alle Verbindungen müssen die vom Server bereitgestellte Nonce `connect.challenge` signieren.

### Diagnosen zur Geräte-Auth-Migration

Für Legacy-Clients, die noch Signierverhalten vor der Challenge verwenden, gibt `connect` jetzt
`DEVICE_AUTH_*`-Detailcodes unter `error.details.code` mit einem stabilen `error.details.reason` zurück.

Häufige Migrationsfehler:

| Meldung                     | details.code                     | details.reason           | Bedeutung                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client hat `device.nonce` ausgelassen (oder leer gesendet). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client hat mit einer veralteten/falschen Nonce signiert. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signatur-Payload entspricht nicht dem v2-Payload. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Signierter Zeitstempel liegt außerhalb der erlaubten Abweichung. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` stimmt nicht mit dem Public-Key-Fingerabdruck überein. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public-Key-Format/Kanonisierung fehlgeschlagen.   |

Migrationsziel:

- Immer auf `connect.challenge` warten.
- Den v2-Payload signieren, der die Server-Nonce enthält.
- Dieselbe Nonce in `connect.params.device.nonce` senden.
- Bevorzugter Signatur-Payload ist `v3`, der zusätzlich zu den Feldern device/client/role/scopes/token/nonce
  `platform` und `deviceFamily` bindet.
- Legacy-`v2`-Signaturen werden aus Kompatibilitätsgründen weiterhin akzeptiert, aber das Metadaten-Pinning
  gepairter Geräte steuert weiterhin die Befehlsrichtlinie beim erneuten Verbinden.

## TLS + Pinning

- TLS wird für WS-Verbindungen unterstützt.
- Clients können optional den Fingerabdruck des Gateway-Zertifikats pinnen (siehe `gateway.tls`-
  Konfiguration plus `gateway.remote.tlsFingerprint` oder CLI `--tls-fingerprint`).

## Umfang

Dieses Protokoll stellt die **vollständige Gateway-API** bereit (Status, Kanäle, Modelle, Chat,
Agent, Sitzungen, Nodes, Genehmigungen usw.). Die genaue Oberfläche wird durch die
TypeBox-Schemas in `src/gateway/protocol/schema.ts` definiert.

## Verwandte Themen

- [Bridge-Protokoll](/de/gateway/bridge-protocol)
- [Gateway-Runbook](/de/gateway)
