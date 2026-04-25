---
read_when:
    - Gateway-WS-Clients implementieren oder aktualisieren
    - Protokollabweichungen oder Verbindungsfehler debuggen
    - Protokollschema/-modelle neu generieren
summary: 'Gateway-WebSocket-Protokoll: Handshake, Frames, Versionierung'
title: Gateway-Protokoll
x-i18n:
    generated_at: "2026-04-25T13:48:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 03f729a1ee755cdd8a8dd1fef5ae1cb0111ec16818bd9080acd2ab0ca2dbc677
    source_path: gateway/protocol.md
    workflow: 15
---

Das Gateway-WS-Protokoll ist die **einzige Control Plane + der einzige Node-Transport** für
OpenClaw. Alle Clients (CLI, Web-UI, macOS-App, iOS-/Android-Nodes, Headless-
Nodes) verbinden sich über WebSocket und deklarieren ihre **Rolle** + ihren **Scope** beim
Handshake.

## Transport

- WebSocket, Text-Frames mit JSON-Payloads.
- Der erste Frame **muss** eine `connect`-Anfrage sein.
- Pre-Connect-Frames sind auf 64 KiB begrenzt. Nach einem erfolgreichen Handshake sollten Clients
  die Grenzwerte `hello-ok.policy.maxPayload` und
  `hello-ok.policy.maxBufferedBytes` einhalten. Wenn Diagnosen aktiviert sind,
  erzeugen übergroße eingehende Frames und langsame ausgehende Puffer `payload.large`-Ereignisse,
  bevor das Gateway den betroffenen Frame schließt oder verwirft. Diese Ereignisse enthalten
  Größen, Limits, Oberflächen und sichere Reason-Codes. Sie enthalten weder den Nachrichten-
  Body, Anhangsinhalte, den rohen Frame-Body, Tokens, Cookies noch Secret-Werte.

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
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    }
  }
}
```

`server`, `features`, `snapshot` und `policy` sind laut Schema
(`src/gateway/protocol/schema/frames.ts`) alle erforderlich. `canvasHostUrl` ist optional. `auth`
meldet die ausgehandelte Rolle/Scopes, wenn verfügbar, und enthält `deviceToken`,
wenn das Gateway einen ausstellt.

Wenn kein Device-Token ausgestellt wird, kann `hello-ok.auth` dennoch die ausgehandelten
Berechtigungen melden:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

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

Während der Übergabe beim vertrauenswürdigen Bootstrap kann `hello-ok.auth` außerdem zusätzliche
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

Für den integrierten Bootstrap-Ablauf für Node/Operator bleibt das primäre Node-Token bei
`scopes: []`, und jedes übergebene Operator-Token bleibt auf die Allowlist des Bootstrap-
Operators begrenzt (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Scope-Prüfungen beim Bootstrap bleiben
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

- **Request**: `{type:"req", id, method, params}`
- **Response**: `{type:"res", id, ok, payload|error}`
- **Event**: `{type:"event", event, payload, seq?, stateVersion?}`

Methoden mit Nebenwirkungen erfordern **Idempotency-Keys** (siehe Schema).

## Rollen + Scopes

### Rollen

- `operator` = Control-Plane-Client (CLI/UI/Automatisierung).
- `node` = Capability-Host (camera/screen/canvas/system.run).

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

Von Plugins registrierte Gateway-RPC-Methoden können ihren eigenen Operator-Scope anfordern, aber
reservierte Core-Admin-Präfixe (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) werden immer zu `operator.admin` aufgelöst.

Der Method-Scope ist nur die erste Hürde. Einige Slash-Befehle, die über
`chat.send` erreicht werden, wenden darüber hinaus strengere Prüfungen auf Befehlsebene an. Zum Beispiel erfordern persistente
Schreibvorgänge mit `/config set` und `/config unset` `operator.admin`.

`node.pair.approve` hat zusätzlich zur Basis-Scope-Prüfung der Methode
noch eine zusätzliche Scope-Prüfung zum Genehmigungszeitpunkt:

- Anfragen ohne Befehl: `operator.pairing`
- Anfragen mit Node-Befehlen, die kein Exec sind: `operator.pairing` + `operator.write`
- Anfragen, die `system.run`, `system.run.prepare` oder `system.which` enthalten:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Nodes deklarieren beim Verbinden Capability-Claims:

- `caps`: übergeordnete Capability-Kategorien.
- `commands`: Allowlist für Befehle bei `invoke`.
- `permissions`: granulare Schalter (z. B. `screen.record`, `camera.capture`).

Das Gateway behandelt diese als **Claims** und erzwingt serverseitige Allowlists.

## Presence

- `system-presence` gibt Einträge zurück, die nach Geräteidentität indiziert sind.
- Presence-Einträge enthalten `deviceId`, `roles` und `scopes`, damit UIs eine einzelne Zeile pro Gerät anzeigen können,
  selbst wenn es sowohl als **operator** als auch als **node** verbunden ist.

## Scope-Begrenzung bei Broadcast-Ereignissen

Vom Server gepushte WebSocket-Broadcast-Ereignisse sind scopebegrenzt, sodass Sessions mit Pairing-Scope oder reine Node-Sessions nicht passiv Session-Inhalte empfangen.

- **Frames für Chat, Agent und Tool-Ergebnisse** (einschließlich gestreamter `agent`-Ereignisse und Ergebnissen von Tool-Aufrufen) erfordern mindestens `operator.read`. Sessions ohne `operator.read` überspringen diese Frames vollständig.
- **Plugin-definierte `plugin.*`-Broadcasts** sind je nach Registrierung durch das Plugin auf `operator.write` oder `operator.admin` begrenzt.
- **Status- und Transport-Ereignisse** (`heartbeat`, `presence`, `tick`, Lebenszyklus von Verbindungen/Trennungen usw.) bleiben uneingeschränkt, damit der Zustand des Transports für jede authentifizierte Session beobachtbar bleibt.
- **Unbekannte Broadcast-Ereignisfamilien** sind standardmäßig scopebegrenzt (Fail-Closed), sofern ein registrierter Handler sie nicht ausdrücklich lockert.

Jede Client-Verbindung behält ihre eigene clientbezogene Sequenznummer, sodass Broadcasts auf diesem Socket eine monotone Reihenfolge beibehalten, selbst wenn verschiedene Clients unterschiedliche, scopegefilterte Teilmengen des Ereignisstroms sehen.

## Häufige RPC-Methodenfamilien

Die öffentliche WS-Oberfläche ist breiter als die obigen Beispiele zu Handshake/Auth. Dies
ist kein generierter Dump — `hello-ok.features.methods` ist eine konservative
Discovery-Liste, die aus `src/gateway/server-methods-list.ts` sowie geladenen
Methoden-Exporten von Plugins/Channels aufgebaut wird. Behandeln Sie sie als Feature-Discovery, nicht als vollständige
Aufzählung von `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System und Identität">
    - `health` gibt den gecachten oder frisch geprüften Integritäts-Snapshot des Gateway zurück.
    - `diagnostics.stability` gibt den aktuellen begrenzten diagnostischen Stability-Recorder zurück. Er speichert betriebliche Metadaten wie Ereignisnamen, Zählungen, Byte-Größen, Speichermesswerte, Warteschlangen-/Session-Status, Channel-/Plugin-Namen und Session-IDs. Er speichert weder Chat-Text, Webhook-Bodies, Tool-Ausgaben, rohe Request- oder Response-Bodies, Tokens, Cookies noch Secret-Werte. Scope `operator.read` ist erforderlich.
    - `status` gibt die Gateway-Zusammenfassung im Stil von `/status` zurück; sensible Felder werden nur für Operator-Clients mit Admin-Scope einbezogen.
    - `gateway.identity.get` gibt die Gateway-Geräteidentität zurück, die von Relay- und Pairing-Abläufen verwendet wird.
    - `system-presence` gibt den aktuellen Presence-Snapshot für verbundene Operator-/Node-Geräte zurück.
    - `system-event` hängt ein Systemereignis an und kann den Presence-Kontext aktualisieren/übertragen.
    - `last-heartbeat` gibt das zuletzt persistent gespeicherte Heartbeat-Ereignis zurück.
    - `set-heartbeats` schaltet die Heartbeat-Verarbeitung auf dem Gateway um.
  </Accordion>

  <Accordion title="Modelle und Nutzung">
    - `models.list` gibt den zur Laufzeit erlaubten Modellkatalog zurück.
    - `usage.status` gibt Zusammenfassungen zu Nutzungsfenstern/Restkontingenten pro Anbieter zurück.
    - `usage.cost` gibt aggregierte Zusammenfassungen der Kostennutzung für einen Datumsbereich zurück.
    - `doctor.memory.status` gibt die Bereitschaft von Vector-Memory / Embeddings für den aktiven Standard-Agent-Workspace zurück.
    - `sessions.usage` gibt Nutzungszusammenfassungen pro Session zurück.
    - `sessions.usage.timeseries` gibt Zeitreihen zur Nutzung für eine Session zurück.
    - `sessions.usage.logs` gibt Einträge aus dem Nutzungslog für eine Session zurück.
  </Accordion>

  <Accordion title="Channels und Login-Helfer">
    - `channels.status` gibt Statuszusammenfassungen für integrierte + gebündelte Channels/Plugins zurück.
    - `channels.logout` meldet ein bestimmtes Channel-/Konto ab, wenn der Channel Logout unterstützt.
    - `web.login.start` startet einen QR-/Web-Login-Ablauf für den aktuellen QR-fähigen Web-Channel-Anbieter.
    - `web.login.wait` wartet darauf, dass dieser QR-/Web-Login-Ablauf abgeschlossen wird, und startet den Channel bei Erfolg.
    - `push.test` sendet einen Test-APNs-Push an einen registrierten iOS-Node.
    - `voicewake.get` gibt die gespeicherten Wake-Word-Trigger zurück.
    - `voicewake.set` aktualisiert Wake-Word-Trigger und überträgt die Änderung.
  </Accordion>

  <Accordion title="Nachrichten und Logs">
    - `send` ist die direkte RPC für ausgehende Zustellung für auf Channel/Konto/Thread zielende Sendungen außerhalb des Chat-Runners.
    - `logs.tail` gibt den konfigurierten Tail des Gateway-Dateilogs mit Cursor-/Limit- und Max-Byte-Steuerung zurück.
  </Accordion>

  <Accordion title="Talk und TTS">
    - `talk.config` gibt die effektive Talk-Konfiguration zurück; `includeSecrets` erfordert `operator.talk.secrets` (oder `operator.admin`).
    - `talk.mode` setzt/überträgt den aktuellen Zustand des Talk-Modus für WebChat-/Control-UI-Clients.
    - `talk.speak` synthetisiert Sprache über den aktiven Talk-Sprachanbieter.
    - `tts.status` gibt den aktivierten TTS-Status, den aktiven Anbieter, Fallback-Anbieter und den Zustand der Anbieter-Konfiguration zurück.
    - `tts.providers` gibt das sichtbare Inventar der TTS-Anbieter zurück.
    - `tts.enable` und `tts.disable` schalten den Status der TTS-Einstellungen um.
    - `tts.setProvider` aktualisiert den bevorzugten TTS-Anbieter.
    - `tts.convert` führt eine einmalige Text-zu-Sprache-Konvertierung aus.
  </Accordion>

  <Accordion title="Secrets, Konfiguration, Update und Wizard">
    - `secrets.reload` löst aktive SecretRefs erneut auf und tauscht den Laufzeit-Secret-Status nur bei vollständigem Erfolg aus.
    - `secrets.resolve` löst Secret-Zuweisungen für befehlsbezogene Ziele für ein bestimmtes Befehls-/Zielset auf.
    - `config.get` gibt den aktuellen Konfigurations-Snapshot und Hash zurück.
    - `config.set` schreibt eine validierte Konfigurations-Payload.
    - `config.patch` führt ein Merge mit einer partiellen Konfigurationsaktualisierung durch.
    - `config.apply` validiert + ersetzt die vollständige Konfigurations-Payload.
    - `config.schema` gibt die Live-Konfigurationsschema-Payload zurück, die von Control UI und CLI-Tooling verwendet wird: Schema, `uiHints`, Version und Generierungsmetadaten, einschließlich Metadaten zu Plugin- + Channel-Schemas, wenn die Laufzeit sie laden kann. Das Schema enthält Feldmetadaten `title` / `description`, abgeleitet aus denselben Labels und Hilfetexten, die von der UI verwendet werden, einschließlich verschachtelter Objekt-, Wildcard-, Array-Item- und `anyOf` / `oneOf` / `allOf`-Kompositionszweige, wenn passende Felddokumentation vorhanden ist.
    - `config.schema.lookup` gibt eine pfadbezogene Lookup-Payload für einen Konfigurationspfad zurück: normalisierter Pfad, ein flacher Schema-Knoten, passender Hint + `hintPath` und unmittelbare Zusammenfassungen untergeordneter Elemente für Drill-down in UI/CLI. Lookup-Schema-Knoten behalten die benutzerseitigen Dokumente und gängige Validierungsfelder (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerische/String-/Array-/Objekt-Grenzen und Flags wie `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Zusammenfassungen untergeordneter Elemente zeigen `key`, normalisierten `path`, `type`, `required`, `hasChildren` sowie den passenden `hint` / `hintPath`.
    - `update.run` führt den Gateway-Update-Ablauf aus und plant einen Neustart nur dann ein, wenn das Update selbst erfolgreich war.
    - `wizard.start`, `wizard.next`, `wizard.status` und `wizard.cancel` stellen den Onboarding-Wizard über WS RPC bereit.
  </Accordion>

  <Accordion title="Agent- und Workspace-Helfer">
    - `agents.list` gibt konfigurierte Agent-Einträge zurück.
    - `agents.create`, `agents.update` und `agents.delete` verwalten Agent-Datensätze und Workspace-Verkabelung.
    - `agents.files.list`, `agents.files.get` und `agents.files.set` verwalten die exponierten Bootstrap-Workspace-Dateien für einen Agenten.
    - `agent.identity.get` gibt die effektive Assistentenidentität für einen Agenten oder eine Session zurück.
    - `agent.wait` wartet darauf, dass ein Lauf beendet wird, und gibt, sofern verfügbar, den terminalen Snapshot zurück.
  </Accordion>

  <Accordion title="Session-Steuerung">
    - `sessions.list` gibt den aktuellen Session-Index zurück.
    - `sessions.subscribe` und `sessions.unsubscribe` schalten Abonnements für Session-Änderungsereignisse für den aktuellen WS-Client um.
    - `sessions.messages.subscribe` und `sessions.messages.unsubscribe` schalten Transcript-/Nachrichtenereignis-Abonnements für eine Session um.
    - `sessions.preview` gibt begrenzte Transcript-Vorschauen für bestimmte Session-Schlüssel zurück.
    - `sessions.resolve` löst ein Session-Ziel auf oder kanonisiert es.
    - `sessions.create` erstellt einen neuen Session-Eintrag.
    - `sessions.send` sendet eine Nachricht in eine bestehende Session.
    - `sessions.steer` ist die Variante zum Unterbrechen und Steuern für eine aktive Session.
    - `sessions.abort` bricht aktive Arbeit für eine Session ab.
    - `sessions.patch` aktualisiert Session-Metadaten/-Überschreibungen.
    - `sessions.reset`, `sessions.delete` und `sessions.compact` führen Session-Wartung aus.
    - `sessions.get` gibt die vollständige gespeicherte Session-Zeile zurück.
    - Die Chat-Ausführung verwendet weiterhin `chat.history`, `chat.send`, `chat.abort` und `chat.inject`. `chat.history` ist für UI-Clients anzeige-normalisiert: Inline-Direktiv-Tags werden aus dem sichtbaren Text entfernt, XML-Payloads für Tool-Aufrufe im Klartext (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke) sowie durchgesickerte ASCII-/Full-Width-Kontroll-Tokens des Modells werden entfernt, reine Assistentenzeilen mit stillen Tokens wie exakt `NO_REPLY` / `no_reply` werden weggelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden.
  </Accordion>

  <Accordion title="Geräte-Pairing und Device-Tokens">
    - `device.pair.list` gibt ausstehende und genehmigte gekoppelte Geräte zurück.
    - `device.pair.approve`, `device.pair.reject` und `device.pair.remove` verwalten Datensätze für Geräte-Pairing.
    - `device.token.rotate` rotiert ein gekoppeltes Device-Token innerhalb seiner genehmigten Rollen- und Scope-Grenzen.
    - `device.token.revoke` widerruft ein gekoppeltes Device-Token.
  </Accordion>

  <Accordion title="Node-Pairing, Invoke und ausstehende Arbeit">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` und `node.pair.verify` decken Node-Pairing und Bootstrap-Verifizierung ab.
    - `node.list` und `node.describe` geben den bekannten/verbundenen Node-Status zurück.
    - `node.rename` aktualisiert ein Label für einen gekoppelten Node.
    - `node.invoke` leitet einen Befehl an einen verbundenen Node weiter.
    - `node.invoke.result` gibt das Ergebnis für eine Invoke-Anfrage zurück.
    - `node.event` überträgt von Nodes stammende Ereignisse zurück in das Gateway.
    - `node.canvas.capability.refresh` aktualisiert bereichsbezogene Canvas-Capability-Tokens.
    - `node.pending.pull` und `node.pending.ack` sind die Queue-APIs für verbundene Nodes.
    - `node.pending.enqueue` und `node.pending.drain` verwalten dauerhafte ausstehende Arbeit für offline/getrennte Nodes.
  </Accordion>

  <Accordion title="Genehmigungsfamilien">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` und `exec.approval.resolve` decken einmalige Exec-Genehmigungsanfragen sowie Lookup/Replay ausstehender Genehmigungen ab.
    - `exec.approval.waitDecision` wartet auf eine ausstehende Exec-Genehmigung und gibt die endgültige Entscheidung zurück (oder `null` bei Timeout).
    - `exec.approvals.get` und `exec.approvals.set` verwalten Snapshots der Exec-Genehmigungsrichtlinie des Gateway.
    - `exec.approvals.node.get` und `exec.approvals.node.set` verwalten die node-lokale Exec-Genehmigungsrichtlinie über Relay-Befehle des Node.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` und `plugin.approval.resolve` decken von Plugins definierte Genehmigungsabläufe ab.
  </Accordion>

  <Accordion title="Automatisierung, Skills und Tools">
    - Automatisierung: `wake` plant eine sofortige oder nächste-Heartbeat-Injektion von Wake-Text; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` verwalten geplante Arbeit.
    - Skills und Tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.
  </Accordion>
</AccordionGroup>

### Häufige Ereignisfamilien

- `chat`: UI-Chat-Aktualisierungen wie `chat.inject` und andere rein transcriptbezogene Chat-
  Ereignisse.
- `session.message` und `session.tool`: Transcript-/Ereignisstrom-Aktualisierungen für eine
  abonnierte Session.
- `sessions.changed`: Session-Index oder Metadaten wurden geändert.
- `presence`: Aktualisierungen des System-Presence-Snapshots.
- `tick`: periodisches Keepalive-/Liveness-Ereignis.
- `health`: Aktualisierung des Gateway-Integritäts-Snapshots.
- `heartbeat`: Aktualisierung des Heartbeat-Ereignisstroms.
- `cron`: Änderungsereignis für Cron-Lauf/Job.
- `shutdown`: Benachrichtigung über das Herunterfahren des Gateway.
- `node.pair.requested` / `node.pair.resolved`: Node-Pairing-Lebenszyklus.
- `node.invoke.request`: Broadcast für Node-Invoke-Anfrage.
- `device.pair.requested` / `device.pair.resolved`: Lebenszyklus gekoppelter Geräte.
- `voicewake.changed`: Konfiguration der Wake-Word-Trigger wurde geändert.
- `exec.approval.requested` / `exec.approval.resolved`: Lebenszyklus der Exec-
  Genehmigung.
- `plugin.approval.requested` / `plugin.approval.resolved`: Lebenszyklus der Plugin-
  Genehmigung.

### Node-Helfermethoden

- Nodes können `skills.bins` aufrufen, um die aktuelle Liste der Skill-Executables
  für Prüfungen der Auto-Allow-Funktion abzurufen.

### Operator-Helfermethoden

- Operatoren können `commands.list` (`operator.read`) aufrufen, um das Laufzeit-
  Befehlsinventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agent-Workspace zu lesen.
  - `scope` steuert, auf welche Oberfläche sich das primäre `name` bezieht:
    - `text` gibt das primäre Text-Befehlstoken ohne führenden `/` zurück
    - `native` und der Standardpfad `both` geben anbieterspezifische native Namen
      zurück, wenn verfügbar
  - `textAliases` enthält exakte Slash-Aliase wie `/model` und `/m`.
  - `nativeName` enthält den anbieterspezifischen nativen Befehlsnamen, wenn ein solcher existiert.
  - `provider` ist optional und beeinflusst nur die native Benennung sowie die Verfügbarkeit nativer Plugin-
    Befehle.
  - `includeArgs=false` lässt serialisierte Argumentmetadaten in der Antwort weg.
- Operatoren können `tools.catalog` (`operator.read`) aufrufen, um den Laufzeit-Toolkatalog für einen
  Agenten abzurufen. Die Antwort enthält gruppierte Tools und Herkunftsmetadaten:
  - `source`: `core` oder `plugin`
  - `pluginId`: Plugin-Eigentümer, wenn `source="plugin"`
  - `optional`: ob ein Plugin-Tool optional ist
- Operatoren können `tools.effective` (`operator.read`) aufrufen, um das zur Laufzeit wirksame Tool-
  Inventar für eine Session abzurufen.
  - `sessionKey` ist erforderlich.
  - Das Gateway leitet den vertrauenswürdigen Laufzeitkontext serverseitig aus der Session ab, statt vom Aufrufer gelieferte
    Auth- oder Zustellkontexte zu akzeptieren.
  - Die Antwort ist sessionbezogen und spiegelt wider, was die aktive Unterhaltung gerade verwenden kann,
    einschließlich Core-, Plugin- und Channel-Tools.
- Operatoren können `skills.status` (`operator.read`) aufrufen, um das sichtbare
  Skill-Inventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agent-Workspace zu lesen.
  - Die Antwort enthält Berechtigung, fehlende Anforderungen, Konfigurationsprüfungen und
    bereinigte Installationsoptionen, ohne rohe Secret-Werte offenzulegen.
- Operatoren können `skills.search` und `skills.detail` (`operator.read`) für
  ClawHub-Discovery-Metadaten aufrufen.
- Operatoren können `skills.install` (`operator.admin`) in zwei Modi aufrufen:
  - ClawHub-Modus: `{ source: "clawhub", slug, version?, force? }` installiert einen
    Skill-Ordner in das Verzeichnis `skills/` des Standard-Agent-Workspace.
  - Gateway-Installer-Modus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    führt eine deklarierte Aktion `metadata.openclaw.install` auf dem Gateway-Host aus.
- Operatoren können `skills.update` (`operator.admin`) in zwei Modi aufrufen:
  - Im ClawHub-Modus wird ein verfolgter Slug oder alle verfolgten ClawHub-Installationen im
    Standard-Agent-Workspace aktualisiert.
  - Der Konfigurationsmodus patched Werte unter `skills.entries.<skillKey>` wie `enabled`,
    `apiKey` und `env`.

## Exec-Genehmigungen

- Wenn eine Exec-Anfrage eine Genehmigung benötigt, sendet das Gateway `exec.approval.requested`.
- Operator-Clients lösen dies durch Aufruf von `exec.approval.resolve` (erfordert den Scope `operator.approvals`).
- Für `host=node` muss `exec.approval.request` `systemRunPlan` enthalten (kanonisches `argv`/`cwd`/`rawCommand`/Session-Metadaten). Anfragen ohne `systemRunPlan` werden abgelehnt.
- Nach der Genehmigung verwenden weitergeleitete Aufrufe von `node.invoke system.run` dieses kanonische
  `systemRunPlan` als autoritativen Kontext für Befehl/cwd/Session.
- Wenn ein Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` zwischen der Vorbereitung und dem final weitergeleiteten, genehmigten `system.run` verändert, lehnt das
  Gateway die Ausführung ab, statt der veränderten Payload zu vertrauen.

## Agent-Zustell-Fallback

- `agent`-Anfragen können `deliver=true` enthalten, um eine ausgehende Zustellung anzufordern.
- `bestEffortDeliver=false` behält striktes Verhalten bei: nicht auflösbare oder nur intern verfügbare Zustellziele geben `INVALID_REQUEST` zurück.
- `bestEffortDeliver=true` erlaubt den Fallback auf eine reine Session-Ausführung, wenn keine extern zustellbare Route aufgelöst werden kann (zum Beispiel interne/WebChat-Sessions oder mehrdeutige Multi-Channel-Konfigurationen).

## Versionierung

- `PROTOCOL_VERSION` befindet sich in `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clients senden `minProtocol` + `maxProtocol`; der Server lehnt Nichtübereinstimmungen ab.
- Schemata + Modelle werden aus TypeBox-Definitionen generiert:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Client-Konstanten

Der Referenz-Client in `src/gateway/client.ts` verwendet diese Standardwerte. Die Werte sind
über Protokoll v3 hinweg stabil und die erwartete Basis für Clients von Drittanbietern.

| Konstante                                 | Standard                                              | Quelle                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Anfrage-Timeout (pro RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Preauth- / Connect-Challenge-Timeout      | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (Clamp `250`–`10_000`) |
| Initialer Reconnect-Backoff               | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Maximaler Reconnect-Backoff               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Fast-Retry-Clamp nach Device-Token-Close  | `250` ms                                              | `src/gateway/client.ts`                                    |
| Grace vor `terminate()` bei Force-Stop    | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Standard-Timeout von `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Standard-Tick-Intervall (vor `hello-ok`)  | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Schließen bei Tick-Timeout                | Code `4000`, wenn Stille `tickIntervalMs * 2` überschreitet | `src/gateway/client.ts`                                |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Der Server kündigt die effektiven Werte `policy.tickIntervalMs`, `policy.maxPayload`
und `policy.maxBufferedBytes` in `hello-ok` an; Clients sollten diese Werte
statt der Standardwerte vor dem Handshake beachten.

## Auth

- Gateway-Auth mit gemeinsamem Secret verwendet `connect.params.auth.token` oder
  `connect.params.auth.password`, abhängig vom konfigurierten Auth-Modus.
- Modi mit Identitätsbezug wie Tailscale Serve
  (`gateway.auth.allowTailscale: true`) oder nicht-loopback
  `gateway.auth.mode: "trusted-proxy"` erfüllen die Connect-Auth-Prüfung über
  Request-Header statt über `connect.params.auth.*`.
- Privater Ingress mit `gateway.auth.mode: "none"` überspringt Connect-Auth mit gemeinsamem Secret
  vollständig; setzen Sie diesen Modus nicht an öffentlichem/nicht vertrauenswürdigem Ingress ein.
- Nach dem Pairing stellt das Gateway ein **Device-Token** aus, das auf die Verbindungs-
  Rolle + Scopes begrenzt ist. Es wird in `hello-ok.auth.deviceToken` zurückgegeben und sollte
  vom Client für zukünftige Verbindungen persistent gespeichert werden.
- Clients sollten das primäre `hello-ok.auth.deviceToken` nach jeder
  erfolgreichen Verbindung persistent speichern.
- Bei einer erneuten Verbindung mit diesem **gespeicherten** Device-Token sollte außerdem das gespeicherte
  genehmigte Scope-Set für dieses Token wiederverwendet werden. So bleiben bereits gewährte
  Zugriffe auf Lesen/Probe/Status erhalten und Reconnects kollabieren nicht stillschweigend auf einen
  engeren impliziten Admin-Only-Scope.
- Clientseitiger Aufbau der Connect-Auth (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` ist orthogonal und wird immer weitergeleitet, wenn es gesetzt ist.
  - `auth.token` wird in dieser Prioritätsreihenfolge gefüllt: zuerst explizites Shared-Token,
    dann ein explizites `deviceToken`, dann ein gespeichertes Token pro Gerät (indiziert nach
    `deviceId` + `role`).
  - `auth.bootstrapToken` wird nur gesendet, wenn keiner der obigen Fälle ein
    `auth.token` aufgelöst hat. Ein Shared-Token oder ein aufgelöstes Device-Token unterdrückt es.
  - Die automatische Hochstufung eines gespeicherten Device-Tokens beim einmaligen
    Retry `AUTH_TOKEN_MISMATCH` ist nur für **vertrauenswürdige Endpunkte** aktiviert —
    loopback oder `wss://` mit gepinntem `tlsFingerprint`. Öffentliches `wss://`
    ohne Pinning qualifiziert sich nicht.
- Zusätzliche Einträge `hello-ok.auth.deviceTokens` sind Bootstrap-Handoff-Tokens.
  Speichern Sie sie nur dann persistent, wenn die Verbindung Bootstrap-Auth auf einem vertrauenswürdigen Transport
  wie `wss://` oder loopback/local pairing verwendet hat.
- Wenn ein Client ein **explizites** `deviceToken` oder explizite `scopes` liefert, bleibt dieses
  vom Aufrufer angeforderte Scope-Set autoritativ; gecachte Scopes werden nur wiederverwendet, wenn der
  Client das gespeicherte Token pro Gerät erneut verwendet.
- Device-Tokens können über `device.token.rotate` und
  `device.token.revoke` rotiert/widerrufen werden (erfordert Scope `operator.pairing`).
- Ausstellung/Rotation von Tokens bleibt auf das genehmigte Rollenset begrenzt, das im
  Pairing-Eintrag dieses Geräts gespeichert ist; durch Rotieren eines Tokens kann ein Gerät nicht in eine
  Rolle erweitert werden, die bei der Pairing-Genehmigung nie erlaubt wurde.
- Für Sessions mit Token gekoppelte Geräte ist die Geräteverwaltung selbstbereichsbezogen, sofern der
  Aufrufer nicht zusätzlich `operator.admin` hat: Nicht-Admin-Aufrufer können nur ihren **eigenen**
  Geräteeintrag entfernen/widerrufen/rotieren.
- `device.token.rotate` prüft außerdem das angeforderte Operator-Scope-Set gegen die
  aktuellen Session-Scopes des Aufrufers. Nicht-Admin-Aufrufer können ein Token nicht in ein
  breiteres Operator-Scope-Set rotieren, als sie bereits besitzen.
- Auth-Fehler enthalten `error.details.code` plus Hinweise zur Wiederherstellung:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Client-Verhalten bei `AUTH_TOKEN_MISMATCH`:
  - Vertrauenswürdige Clients können einen begrenzten einmaligen Retry mit einem gecachten Token pro Gerät versuchen.
  - Wenn dieser Retry fehlschlägt, sollten Clients automatische Reconnect-Schleifen beenden und Hinweise für Operator-Aktionen anzeigen.

## Geräteidentität + Pairing

- Nodes sollten eine stabile Geräteidentität (`device.id`) einschließen, die von einem
  Fingerprint eines Schlüsselpaares abgeleitet ist.
- Gateways stellen Tokens pro Gerät + Rolle aus.
- Pairing-Genehmigungen sind für neue Geräte-IDs erforderlich, sofern lokale Auto-Genehmigung
  nicht aktiviert ist.
- Die Auto-Genehmigung für Pairing ist auf direkte lokale Loopback-Verbindungen ausgerichtet.
- OpenClaw hat außerdem einen engen backend-/containerlokalen Self-Connect-Pfad für
  vertrauenswürdige Hilfsabläufe mit gemeinsamem Secret.
- Verbindungen aus demselben Tailnet oder LAN auf demselben Host werden für das Pairing weiterhin als remote behandelt und
  erfordern eine Genehmigung.
- Alle WS-Clients müssen beim `connect` eine `device`-Identität einschließen (Operator + Node).
  Control UI kann sie nur in diesen Modi weglassen:
  - `gateway.controlUi.allowInsecureAuth=true` für localhost-only-Kompatibilität mit unsicherem HTTP.
  - erfolgreiche Operator-Control-UI-Authentifizierung mit `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (Break-Glass, starke Sicherheitsabwertung).
- Alle Verbindungen müssen die vom Server bereitgestellte Nonce aus `connect.challenge` signieren.

### Migrationsdiagnosen für Device-Auth

Für Legacy-Clients, die weiterhin das Signaturverhalten vor der Challenge verwenden, gibt `connect` jetzt
Detailcodes `DEVICE_AUTH_*` unter `error.details.code` mit einer stabilen `error.details.reason` zurück.

Häufige Migrationsfehler:

| Nachricht                  | details.code                     | details.reason           | Bedeutung                                           |
| -------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------- |
| `device nonce required`    | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client hat `device.nonce` weggelassen (oder leer gesendet). |
| `device nonce mismatch`    | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client hat mit einer veralteten/falschen Nonce signiert. |
| `device signature invalid` | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signatur-Payload entspricht nicht der v2-Payload.   |
| `device signature expired` | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Signierter Zeitstempel liegt außerhalb der erlaubten Abweichung. |
| `device identity mismatch` | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` stimmt nicht mit dem Fingerprint des öffentlichen Schlüssels überein. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`     | Format/Kanonisierung des öffentlichen Schlüssels fehlgeschlagen. |

Migrationsziel:

- Warten Sie immer auf `connect.challenge`.
- Signieren Sie die v2-Payload, die die Server-Nonce enthält.
- Senden Sie dieselbe Nonce in `connect.params.device.nonce`.
- Die bevorzugte Signatur-Payload ist `v3`, die zusätzlich zu device/client/role/scopes/token/nonce-Feldern auch `platform` und `deviceFamily` bindet.
- Legacy-Signaturen `v2` bleiben aus Kompatibilitätsgründen weiterhin akzeptiert, aber das Pinning von Metadaten gekoppelter Geräte steuert die Befehlsrichtlinie beim Reconnect weiterhin.

## TLS + Pinning

- TLS wird für WS-Verbindungen unterstützt.
- Clients können optional den Fingerprint des Gateway-Zertifikats pinnen (siehe Konfiguration `gateway.tls`
  sowie `gateway.remote.tlsFingerprint` oder CLI `--tls-fingerprint`).

## Scope

Dieses Protokoll stellt die **vollständige Gateway-API** bereit (Status, Channels, Modelle, Chat,
Agent, Sessions, Nodes, Genehmigungen usw.). Die genaue Oberfläche wird durch die
TypeBox-Schemas in `src/gateway/protocol/schema.ts` definiert.

## Verwandt

- [Bridge-Protokoll](/de/gateway/bridge-protocol)
- [Gateway-Runbook](/de/gateway)
