---
read_when:
    - Implementieren oder Aktualisieren von Gateway-WS-Clients
    - Debuggen von Protokollabweichungen oder Verbindungsfehlern
    - Erneutes Generieren von Protokollschemas/-modellen
summary: 'Gateway-WebSocket-Protokoll: Handshake, Frames, Versionierung'
title: Gateway-Protokoll
x-i18n:
    generated_at: "2026-04-26T11:30:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01f873c7051f2a462cbefb50331e04edfdcedadeda8b3d7b7320ceb2462edccc
    source_path: gateway/protocol.md
    workflow: 15
---

Das Gateway-WS-Protokoll ist die **einzige Control Plane + der einzige Node-Transport** für
OpenClaw. Alle Clients (CLI, Web-UI, macOS-App, iOS/Android-Nodes, Headless-
Nodes) verbinden sich über WebSocket und deklarieren beim
Handshake ihre **Rolle** + ihren **Bereich**.

## Transport

- WebSocket, Text-Frames mit JSON-Payloads.
- Der erste Frame **muss** eine `connect`-Anfrage sein.
- Frames vor dem Verbindungsaufbau sind auf 64 KiB begrenzt. Nach einem erfolgreichen Handshake sollten Clients
  die Limits `hello-ok.policy.maxPayload` und
  `hello-ok.policy.maxBufferedBytes` einhalten. Wenn Diagnosen aktiviert sind,
  lösen zu große eingehende Frames und langsame ausgehende Buffer `payload.large`-Ereignisse aus,
  bevor das Gateway den betroffenen Frame schließt oder verwirft. Diese Ereignisse enthalten
  Größen, Limits, Oberflächen und sichere Reason-Codes. Sie enthalten weder den Nachrichtentext,
  Anhangsinhalte, den rohen Frame-Body, Tokens, Cookies noch Secret-Werte.

## Handshake (`connect`)

Gateway → Client (Challenge vor dem Verbindungsaufbau):

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

`server`, `features`, `snapshot` und `policy` sind laut Schema alle erforderlich
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` ist optional. `auth`
meldet die ausgehandelte Rolle/die ausgehandelten Bereiche, wenn verfügbar, und enthält `deviceToken`,
wenn das Gateway eines ausstellt.

Wenn kein Gerätetoken ausgestellt wird, kann `hello-ok.auth` dennoch die ausgehandelten
Berechtigungen melden:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Vertrauenswürdige Backend-Clients im selben Prozess (`client.id: "gateway-client"`,
`client.mode: "backend"`) dürfen `device` bei direkten local loopback-Verbindungen weglassen, wenn
sie sich mit dem gemeinsamen Gateway-Token/-Passwort authentifizieren. Dieser Pfad ist für
interne Control-Plane-RPCs reserviert und verhindert, dass veraltete CLI-/Gerätekopplungs-Baselines
lokale Backend-Arbeit wie Aktualisierungen von Unteragent-Sitzungen blockieren. Remote-Clients,
Clients aus Browser-Ursprung, Node-Clients und explizite Gerätetoken-/Geräteidentitäts-Clients
verwenden weiterhin die normalen Prüfungen für Kopplung und Bereichs-Upgrades.

Wenn ein Gerätetoken ausgestellt wird, enthält `hello-ok` außerdem:

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

Für den integrierten Bootstrap-Ablauf für Node/Operator bleibt das primäre Node-Token bei
`scopes: []`, und jedes übergebene Operator-Token bleibt auf die Bootstrap-Allowlist für Operatoren
begrenzt (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Prüfungen für Bootstrap-Bereiche bleiben
rollenpräfixbasiert: Operator-Einträge erfüllen nur Operator-Anfragen, und nicht-Operator-
Rollen benötigen weiterhin Bereiche unter ihrem eigenen Rollenpräfix.

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

Methoden mit Seiteneffekten erfordern **Idempotency Keys** (siehe Schema).

## Rollen + Bereiche

### Rollen

- `operator` = Control-Plane-Client (CLI/UI/Automatisierung).
- `node` = Fähigkeits-Host (camera/screen/canvas/system.run).

### Bereiche (`operator`)

Häufige Bereiche:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` mit `includeSecrets: true` erfordert `operator.talk.secrets`
(oder `operator.admin`).

Von Plugins registrierte Gateway-RPC-Methoden können ihren eigenen Operator-Bereich anfordern, aber
reservierte Core-Admin-Präfixe (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) werden immer zu `operator.admin` aufgelöst.

Der Methodenbereich ist nur die erste Schranke. Einige Slash-Commands, die über
`chat.send` erreicht werden, wenden darüber hinaus strengere Prüfungen auf Befehlsebene an. Zum Beispiel erfordern persistente
Schreibvorgänge mit `/config set` und `/config unset` `operator.admin`.

`node.pair.approve` hat zusätzlich zu dem
Basisbereich der Methode noch eine zusätzliche Bereichsprüfung zur Genehmigungszeit:

- Anfragen ohne Befehl: `operator.pairing`
- Anfragen mit nicht-ausführbaren Node-Befehlen: `operator.pairing` + `operator.write`
- Anfragen, die `system.run`, `system.run.prepare` oder `system.which` enthalten:
  `operator.pairing` + `operator.admin`

### `caps`/`commands`/`permissions` (`node`)

Nodes deklarieren beim Verbindungsaufbau Fähigkeitsansprüche:

- `caps`: Kategorien von Fähigkeiten auf hoher Ebene.
- `commands`: Allowlist von Befehlen für Aufrufe.
- `permissions`: granulare Schalter (z. B. `screen.record`, `camera.capture`).

Das Gateway behandelt diese als **Ansprüche** und erzwingt serverseitige Allowlists.

## Presence

- `system-presence` gibt Einträge zurück, die nach Geräteidentität geschlüsselt sind.
- Presence-Einträge enthalten `deviceId`, `roles` und `scopes`, damit UIs eine einzelne Zeile pro Gerät anzeigen können,
  auch wenn es sowohl als **operator** als auch als **node** verbunden ist.

## Bereichssteuerung für Broadcast-Ereignisse

Vom Server gepushte WebSocket-Broadcast-Ereignisse sind bereichsgesteuert, sodass Sitzungen mit nur Kopplungsbereich oder reine Node-Sitzungen nicht passiv Sitzungsinhalte empfangen.

- **Chat-, Agenten- und Tool-Ergebnis-Frames** (einschließlich gestreamter `agent`-Ereignisse und Ergebnissen von Tool-Aufrufen) erfordern mindestens `operator.read`. Sitzungen ohne `operator.read` überspringen diese Frames vollständig.
- **Von Plugins definierte `plugin.*`-Broadcasts** werden je nach Registrierung durch das Plugin auf `operator.write` oder `operator.admin` begrenzt.
- **Status- und Transportereignisse** (`heartbeat`, `presence`, `tick`, Lebenszyklus von Verbindung/Trennung usw.) bleiben uneingeschränkt, damit die Gesundheit des Transports für jede authentifizierte Sitzung beobachtbar bleibt.
- **Unbekannte Broadcast-Ereignisfamilien** sind standardmäßig bereichsgesteuert (fail-closed), sofern ein registrierter Handler sie nicht explizit lockert.

Jede Client-Verbindung behält ihre eigene Sequenznummer pro Client, sodass Broadcasts auf diesem Socket monotone Reihenfolge beibehalten, auch wenn verschiedene Clients unterschiedliche, nach Bereichen gefilterte Teilmengen des Ereignisstroms sehen.

## Häufige RPC-Methodenfamilien

Die öffentliche WS-Oberfläche ist breiter als die Handshake-/Auth-Beispiele oben. Dies
ist kein generierter Dump — `hello-ok.features.methods` ist eine konservative
Discovery-Liste, die aus `src/gateway/server-methods-list.ts` plus geladenen
Plugin-/Kanal-Methodenexporten aufgebaut wird. Behandeln Sie sie als Feature-Erkennung, nicht als vollständige
Aufzählung von `src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System und Identität">
    - `health` gibt den zwischengespeicherten oder frisch abgefragten Gateway-Health-Snapshot zurück.
    - `diagnostics.stability` gibt den aktuellen begrenzten Diagnostic-Stability-Recorder zurück. Er enthält operative Metadaten wie Ereignisnamen, Zähler, Byte-Größen, Speicherwerte, Queue-/Sitzungszustand, Kanal-/Plugin-Namen und Sitzungs-IDs. Er enthält weder Chat-Text, Webhook-Bodies, Tool-Ausgaben, rohe Anfrage- oder Antwort-Bodies, Tokens, Cookies noch Secret-Werte. `operator.read` ist erforderlich.
    - `status` gibt die Gateway-Zusammenfassung im Stil von `/status` zurück; sensible Felder werden nur für Operator-Clients mit Admin-Bereich enthalten.
    - `gateway.identity.get` gibt die Gateway-Geräteidentität zurück, die von Relay- und Kopplungsabläufen verwendet wird.
    - `system-presence` gibt den aktuellen Presence-Snapshot für verbundene Operator-/Node-Geräte zurück.
    - `system-event` hängt ein Systemereignis an und kann den Presence-Kontext aktualisieren/broadcasten.
    - `last-heartbeat` gibt das zuletzt persistent gespeicherte Heartbeat-Ereignis zurück.
    - `set-heartbeats` schaltet die Heartbeat-Verarbeitung auf dem Gateway um.

  </Accordion>

  <Accordion title="Modelle und Nutzung">
    - `models.list` gibt den zur Laufzeit erlaubten Modellkatalog zurück.
    - `usage.status` gibt Zusammenfassungen von Provider-Nutzungsfenstern/verbleibenden Kontingenten zurück.
    - `usage.cost` gibt aggregierte Zusammenfassungen der Kosten-Nutzung für einen Datumsbereich zurück.
    - `doctor.memory.status` gibt die Bereitschaft von Vector Memory/Embeddings für den aktiven Standard-Agenten-Workspace zurück.
    - `sessions.usage` gibt Nutzungszusammenfassungen pro Sitzung zurück.
    - `sessions.usage.timeseries` gibt Zeitreihen der Nutzung für eine Sitzung zurück.
    - `sessions.usage.logs` gibt Nutzungslokaleinträge für eine Sitzung zurück.

  </Accordion>

  <Accordion title="Kanäle und Login-Helfer">
    - `channels.status` gibt Statuszusammenfassungen für integrierte und gebündelte Kanäle/Plugins zurück.
    - `channels.logout` meldet einen bestimmten Kanal/ein bestimmtes Konto ab, sofern der Kanal Logout unterstützt.
    - `web.login.start` startet einen QR-/Web-Login-Ablauf für den aktuellen QR-fähigen Web-Kanal-Provider.
    - `web.login.wait` wartet darauf, dass dieser QR-/Web-Login-Ablauf abgeschlossen wird, und startet den Kanal bei Erfolg.
    - `push.test` sendet einen APNs-Test-Push an einen registrierten iOS-Node.
    - `voicewake.get` gibt die gespeicherten Wake-Word-Trigger zurück.
    - `voicewake.set` aktualisiert Wake-Word-Trigger und broadcastet die Änderung.

  </Accordion>

  <Accordion title="Nachrichten und Logs">
    - `send` ist die direkte RPC für ausgehende Zustellung an Kanal-/Konto-/Thread-Ziele außerhalb des Chat-Runners.
    - `logs.tail` gibt das konfigurierte Gateway-Dateilog-Tail mit Cursor-/Limit- und Max-Byte-Steuerung zurück.

  </Accordion>

  <Accordion title="Talk und TTS">
    - `talk.config` gibt die effektive Talk-Konfigurations-Payload zurück; `includeSecrets` erfordert `operator.talk.secrets` (oder `operator.admin`).
    - `talk.mode` setzt/broadcastet den aktuellen Talk-Modus-Status für WebChat-/Control-UI-Clients.
    - `talk.speak` synthetisiert Sprache über den aktiven Talk-Sprach-Provider.
    - `tts.status` gibt den TTS-Aktivierungsstatus, den aktiven Provider, Fallback-Provider und den Zustand der Provider-Konfiguration zurück.
    - `tts.providers` gibt das sichtbare Inventar der TTS-Provider zurück.
    - `tts.enable` und `tts.disable` schalten den TTS-Präferenzstatus um.
    - `tts.setProvider` aktualisiert den bevorzugten TTS-Provider.
    - `tts.convert` führt eine einmalige Text-zu-Sprache-Konvertierung aus.

  </Accordion>

  <Accordion title="Secrets, Konfiguration, Update und Assistent">
    - `secrets.reload` löst aktive SecretRefs erneut auf und tauscht den Secret-Zustand zur Laufzeit nur bei vollständigem Erfolg aus.
    - `secrets.resolve` löst command-gerichtete Secret-Zuweisungen für einen bestimmten Befehl/Zielsatz auf.
    - `config.get` gibt den aktuellen Konfigurations-Snapshot und Hash zurück.
    - `config.set` schreibt eine validierte Konfigurations-Payload.
    - `config.patch` führt einen Merge für ein partielles Konfigurations-Update aus.
    - `config.apply` validiert + ersetzt die vollständige Konfigurations-Payload.
    - `config.schema` gibt die Live-Konfigurationsschema-Payload zurück, die von Control UI und CLI-Tools verwendet wird: Schema, `uiHints`, Version und Generierungsmetadaten, einschließlich Plugin- + Kanal-Schema-Metadaten, wenn die Laufzeit sie laden kann. Das Schema enthält die Feldmetadaten `title` / `description`, abgeleitet aus denselben Labels und Hilfetexten, die auch von der UI verwendet werden, einschließlich verschachtelter Objekte, Wildcard-, Array-Item- und `anyOf` / `oneOf` / `allOf`-Kompositionszweige, wenn passende Felddokumentation vorhanden ist.
    - `config.schema.lookup` gibt eine pfadbezogene Lookup-Payload für einen Konfigurationspfad zurück: normalisierter Pfad, ein flacher Schemaknoten, passender Hint + `hintPath` sowie Zusammenfassungen der unmittelbaren Kindknoten für Drill-down in UI/CLI. Lookup-Schemaknoten behalten die benutzerseitige Dokumentation und gängige Validierungsfelder (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, numerische/String-/Array-/Objektgrenzen und Flags wie `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Kindzusammenfassungen stellen `key`, normalisierten `path`, `type`, `required`, `hasChildren` sowie den passenden `hint` / `hintPath` bereit.
    - `update.run` führt den Gateway-Update-Ablauf aus und plant einen Neustart nur dann, wenn das Update selbst erfolgreich war.
    - `wizard.start`, `wizard.next`, `wizard.status` und `wizard.cancel` stellen den Onboarding-Assistenten über WS RPC bereit.

  </Accordion>

  <Accordion title="Agenten- und Workspace-Helfer">
    - `agents.list` gibt konfigurierte Agenten-Einträge zurück.
    - `agents.create`, `agents.update` und `agents.delete` verwalten Agenten-Datensätze und Workspace-Verkabelung.
    - `agents.files.list`, `agents.files.get` und `agents.files.set` verwalten die Bootstrap-Workspace-Dateien, die für einen Agenten bereitgestellt werden.
    - `agent.identity.get` gibt die effektive Assistenten-Identität für einen Agenten oder eine Sitzung zurück.
    - `agent.wait` wartet, bis ein Lauf beendet ist, und gibt den terminalen Snapshot zurück, wenn verfügbar.

  </Accordion>

  <Accordion title="Sitzungssteuerung">
    - `sessions.list` gibt den aktuellen Sitzungsindex zurück.
    - `sessions.subscribe` und `sessions.unsubscribe` schalten Abonnements für Sitzungsänderungsereignisse für den aktuellen WS-Client um.
    - `sessions.messages.subscribe` und `sessions.messages.unsubscribe` schalten Abonnements für Transkript-/Nachrichtenereignisse für eine Sitzung um.
    - `sessions.preview` gibt begrenzte Transkriptvorschauen für bestimmte Sitzungsschlüssel zurück.
    - `sessions.resolve` löst ein Sitzungsziel auf oder kanonisiert es.
    - `sessions.create` erstellt einen neuen Sitzungseintrag.
    - `sessions.send` sendet eine Nachricht in eine bestehende Sitzung.
    - `sessions.steer` ist die Variante zum Unterbrechen und Umlenken für eine aktive Sitzung.
    - `sessions.abort` bricht aktive Arbeit für eine Sitzung ab.
    - `sessions.patch` aktualisiert Sitzungsmetadaten/-Überschreibungen.
    - `sessions.reset`, `sessions.delete` und `sessions.compact` führen Sitzungswartung aus.
    - `sessions.get` gibt die vollständige gespeicherte Sitzungszeile zurück.
    - Die Chat-Ausführung verwendet weiterhin `chat.history`, `chat.send`, `chat.abort` und `chat.inject`. `chat.history` ist für UI-Clients anzeige-normalisiert: Inline-Direktiv-Tags werden aus sichtbarem Text entfernt, XML-Payloads von Tool-Aufrufen im Klartext (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzter Tool-Call-Blöcke) sowie durchgesickerte ASCII-/vollbreite Modell-Steuer-Tokens werden entfernt, reine stille Assistant-Zeilen wie exaktes `NO_REPLY` / `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden.

  </Accordion>

  <Accordion title="Gerätekopplung und Gerätetokens">
    - `device.pair.list` gibt ausstehende und genehmigte gekoppelte Geräte zurück.
    - `device.pair.approve`, `device.pair.reject` und `device.pair.remove` verwalten Gerätekopplungs-Datensätze.
    - `device.token.rotate` rotiert ein gepaartes Gerätetoken innerhalb seiner genehmigten Rolle und der Bereichsgrenzen des Aufrufers.
    - `device.token.revoke` widerruft ein gepaartes Gerätetoken innerhalb seiner genehmigten Rolle und der Bereichsgrenzen des Aufrufers.

  </Accordion>

  <Accordion title="Node-Kopplung, Invoke und ausstehende Arbeit">
    - `node.pair.request`, `node.pair.list`, `node.pair.approve`, `node.pair.reject` und `node.pair.verify` decken Node-Kopplung und Bootstrap-Verifikation ab.
    - `node.list` und `node.describe` geben den Zustand bekannter/verbundener Nodes zurück.
    - `node.rename` aktualisiert ein Label eines gepaarten Node.
    - `node.invoke` leitet einen Befehl an einen verbundenen Node weiter.
    - `node.invoke.result` gibt das Ergebnis für eine Invoke-Anfrage zurück.
    - `node.event` trägt vom Node stammende Ereignisse zurück in das Gateway.
    - `node.canvas.capability.refresh` aktualisiert bereichsgebundene Canvas-Fähigkeitstokens.
    - `node.pending.pull` und `node.pending.ack` sind die Queue-APIs für verbundene Nodes.
    - `node.pending.enqueue` und `node.pending.drain` verwalten dauerhafte ausstehende Arbeit für offline/getrennte Nodes.

  </Accordion>

  <Accordion title="Genehmigungsfamilien">
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` und `exec.approval.resolve` decken einmalige Exec-Genehmigungsanfragen plus Lookup/Wiedergabe ausstehender Genehmigungen ab.
    - `exec.approval.waitDecision` wartet auf eine ausstehende Exec-Genehmigung und gibt die endgültige Entscheidung zurück (oder `null` bei Timeout).
    - `exec.approvals.get` und `exec.approvals.set` verwalten Snapshots der Gateway-Exec-Genehmigungsrichtlinie.
    - `exec.approvals.node.get` und `exec.approvals.node.set` verwalten die node-lokale Exec-Genehmigungsrichtlinie über Node-Relay-Befehle.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` und `plugin.approval.resolve` decken von Plugins definierte Genehmigungsabläufe ab.

  </Accordion>

  <Accordion title="Automatisierung, Skills und Tools">
    - Automatisierung: `wake` plant das Einspeisen eines unmittelbaren oder beim nächsten Heartbeat erfolgenden Wake-Textes; `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` verwalten geplante Arbeit.
    - Skills und Tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`.

  </Accordion>
</AccordionGroup>

### Häufige Ereignisfamilien

- `chat`: UI-Chat-Updates wie `chat.inject` und andere reine Transkript-
  Chat-Ereignisse.
- `session.message` und `session.tool`: Updates des Transkripts/Ereignisstroms für eine
  abonnierte Sitzung.
- `sessions.changed`: Sitzungsindex oder Metadaten wurden geändert.
- `presence`: Updates des System-Presence-Snapshots.
- `tick`: periodisches Keepalive-/Liveness-Ereignis.
- `health`: Update des Gateway-Health-Snapshots.
- `heartbeat`: Update des Heartbeat-Ereignisstroms.
- `cron`: Änderungsereignis für Cron-Lauf/Job.
- `shutdown`: Gateway-Notification beim Herunterfahren.
- `node.pair.requested` / `node.pair.resolved`: Lebenszyklus der Node-Kopplung.
- `node.invoke.request`: Broadcast einer Node-Invoke-Anfrage.
- `device.pair.requested` / `device.pair.resolved`: Lebenszyklus gekoppelter Geräte.
- `voicewake.changed`: Konfiguration der Wake-Word-Trigger wurde geändert.
- `exec.approval.requested` / `exec.approval.resolved`: Lebenszyklus der Exec-
  Genehmigung.
- `plugin.approval.requested` / `plugin.approval.resolved`: Lebenszyklus der Plugin-Genehmigung.

### Node-Hilfsmethoden

- Nodes können `skills.bins` aufrufen, um die aktuelle Liste der Skill-Executables
  für Auto-Allow-Prüfungen abzurufen.

### Operator-Hilfsmethoden

- Operatoren können `commands.list` (`operator.read`) aufrufen, um das Laufzeit-
  Befehlsinventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agenten-Workspace auszulesen.
  - `scope` steuert, auf welche Oberfläche sich der primäre `name` bezieht:
    - `text` gibt das primäre Text-Befehlstoken ohne führendes `/` zurück
    - `native` und der Standardpfad `both` geben providerbewusste native Namen
      zurück, wenn verfügbar
  - `textAliases` enthält exakte Slash-Aliasse wie `/model` und `/m`.
  - `nativeName` enthält den providerbewussten nativen Befehlsnamen, wenn es einen gibt.
  - `provider` ist optional und beeinflusst nur natives Naming sowie die Verfügbarkeit nativer Plugin-
    Befehle.
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
    vom Aufrufer bereitgestellten Auth- oder Zustellungskontext zu akzeptieren.
  - Die Antwort ist sitzungsbezogen und spiegelt wider, was die aktive Unterhaltung gerade nutzen kann,
    einschließlich Core-, Plugin- und Kanal-Tools.
- Operatoren können `skills.status` (`operator.read`) aufrufen, um das sichtbare
  Skill-Inventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agenten-Workspace auszulesen.
  - Die Antwort enthält Eignung, fehlende Anforderungen, Konfigurationsprüfungen und
    bereinigte Installationsoptionen, ohne rohe Secret-Werte offenzulegen.
- Operatoren können `skills.search` und `skills.detail` (`operator.read`) für
  ClawHub-Discovery-Metadaten aufrufen.
- Operatoren können `skills.install` (`operator.admin`) in zwei Modi aufrufen:
  - ClawHub-Modus: `{ source: "clawhub", slug, version?, force? }` installiert einen
    Skill-Ordner in das `skills/`-Verzeichnis des Standard-Agenten-Workspace.
  - Gateway-Installer-Modus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    führt eine deklarierte Aktion `metadata.openclaw.install` auf dem Gateway-Host aus.
- Operatoren können `skills.update` (`operator.admin`) in zwei Modi aufrufen:
  - Der ClawHub-Modus aktualisiert einen verfolgten Slug oder alle verfolgten ClawHub-Installationen im
    Standard-Agenten-Workspace.
  - Der Konfigurationsmodus patched Werte unter `skills.entries.<skillKey>` wie `enabled`,
    `apiKey` und `env`.

## Exec-Genehmigungen

- Wenn eine Exec-Anfrage Genehmigung benötigt, broadcastet das Gateway `exec.approval.requested`.
- Operator-Clients lösen dies durch Aufruf von `exec.approval.resolve` (erfordert den Bereich `operator.approvals`).
- Für `host=node` muss `exec.approval.request` `systemRunPlan` enthalten (kanonisches `argv`/`cwd`/`rawCommand`/Sitzungsmetadaten). Anfragen ohne `systemRunPlan` werden abgelehnt.
- Nach der Genehmigung verwenden weitergeleitete `node.invoke system.run`-Aufrufe dieses kanonische
  `systemRunPlan` erneut als maßgeblichen Kontext für Befehl/cwd/Sitzung.
- Wenn ein Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` zwischen Vorbereitung und dem endgültig genehmigten `system.run`-Forward verändert, lehnt das
  Gateway den Lauf ab, statt der veränderten Payload zu vertrauen.

## Fallback für Agent-Zustellung

- `agent`-Anfragen können `deliver=true` enthalten, um ausgehende Zustellung anzufordern.
- `bestEffortDeliver=false` behält striktes Verhalten bei: nicht auflösbare oder nur intern mögliche Zustellungsziele liefern `INVALID_REQUEST` zurück.
- `bestEffortDeliver=true` erlaubt einen Fallback auf reine Sitzungsverarbeitung, wenn keine externe zustellbare Route aufgelöst werden kann (zum Beispiel interne/WebChat-Sitzungen oder mehrdeutige Mehrkanal-Konfigurationen).

## Versionierung

- `PROTOCOL_VERSION` liegt in `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clients senden `minProtocol` + `maxProtocol`; der Server lehnt Nichtübereinstimmungen ab.
- Schemas + Modelle werden aus TypeBox-Definitionen generiert:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Client-Konstanten

Der Referenzclient in `src/gateway/client.ts` verwendet diese Standardwerte. Die Werte sind
über Protokoll v3 hinweg stabil und die erwartete Basislinie für Clients von Drittanbietern.

| Konstante                                 | Standard                                              | Quelle                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Request-Timeout (pro RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Timeout für Preauth / Connect-Challenge   | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (Clamp `250`–`10_000`) |
| Initialer Reconnect-Backoff               | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Maximaler Reconnect-Backoff               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Fast-Retry-Clamp nach Device-Token-Close  | `250` ms                                              | `src/gateway/client.ts`                                    |
| Grace-Periode vor `terminate()` bei Force-Stop | `250` ms                                         | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Standard-Timeout für `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Standard-Tick-Intervall (vor `hello-ok`)  | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Tick-Timeout-Close                        | Code `4000`, wenn Stille `tickIntervalMs * 2` überschreitet | `src/gateway/client.ts`                               |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Der Server kündigt die effektiven Werte `policy.tickIntervalMs`, `policy.maxPayload`
und `policy.maxBufferedBytes` in `hello-ok` an; Clients sollten diese Werte
statt der Standardwerte vor dem Handshake einhalten.

## Auth

- Authentifizierung des Gateways mit gemeinsamem Secret verwendet `connect.params.auth.token` oder
  `connect.params.auth.password`, abhängig vom konfigurierten Auth-Modus.
- Identitätstragende Modi wie Tailscale Serve
  (`gateway.auth.allowTailscale: true`) oder nicht-Loopback-
  `gateway.auth.mode: "trusted-proxy"` erfüllen die Connect-Authentifizierungsprüfung aus
  Anfrage-Headern statt aus `connect.params.auth.*`.
- Bei privatem Ingress überspringt `gateway.auth.mode: "none"` die Connect-Authentifizierung mit gemeinsamem Secret
  vollständig; setzen Sie diesen Modus nicht auf öffentlichem/nicht vertrauenswürdigem Ingress ein.
- Nach der Kopplung stellt das Gateway ein **Gerätetoken** aus, das auf die Rolle + Bereiche
  der Verbindung begrenzt ist. Es wird in `hello-ok.auth.deviceToken` zurückgegeben und sollte
  vom Client für zukünftige Verbindungen persistent gespeichert werden.
- Clients sollten das primäre `hello-ok.auth.deviceToken` nach jeder
  erfolgreichen Verbindung persistent speichern.
- Bei einer Wiederverbindung mit diesem **gespeicherten** Gerätetoken sollte auch die gespeicherte
  genehmigte Bereichsmenge für dieses Token wiederverwendet werden. Dadurch bleiben bereits gewährte Zugriffe
  auf Lesen/Probe/Status erhalten und es wird vermieden, dass Wiederverbindungen stillschweigend auf einen
  engeren impliziten Admin-only-Bereich zusammenfallen.
- Clientseitiger Aufbau der Connect-Authentifizierung (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` ist orthogonal und wird immer weitergeleitet, wenn es gesetzt ist.
  - `auth.token` wird in Prioritätsreihenfolge befüllt: zuerst explizites gemeinsames Token,
    dann ein explizites `deviceToken`, dann ein gespeichertes Token pro Gerät (geschlüsselt nach
    `deviceId` + `role`).
  - `auth.bootstrapToken` wird nur gesendet, wenn keines der obigen Verfahren ein
    `auth.token` aufgelöst hat. Ein gemeinsames Token oder irgendein aufgelöstes Gerätetoken unterdrückt es.
  - Auto-Promotion eines gespeicherten Gerätetokens beim einmaligen
    Retry `AUTH_TOKEN_MISMATCH` ist nur für **vertrauenswürdige Endpunkte** freigeschaltet —
    loopback oder `wss://` mit angeheftetem `tlsFingerprint`. Öffentliches `wss://`
    ohne Pinning qualifiziert sich nicht.
- Zusätzliche Einträge in `hello-ok.auth.deviceTokens` sind Bootstrap-Handoff-Tokens.
  Speichern Sie sie nur dann persistent, wenn die Verbindung Bootstrap-Auth auf einem vertrauenswürdigen Transport
  wie `wss://` oder Loopback/lokaler Kopplung verwendet hat.
- Wenn ein Client ein **explizites** `deviceToken` oder explizite `scopes` angibt, dann
  bleibt diese vom Aufrufer angeforderte Bereichsmenge maßgeblich; zwischengespeicherte Bereiche werden nur
  wiederverwendet, wenn der Client das gespeicherte Token pro Gerät erneut verwendet.
- Gerätetokens können über `device.token.rotate` und
  `device.token.revoke` rotiert/widerrufen werden (erfordert den Bereich `operator.pairing`).
- Ausgabe, Rotation und Widerruf von Tokens bleiben auf die genehmigte Rollenmenge beschränkt,
  die im Kopplungseintrag dieses Geräts aufgezeichnet ist; Token-Mutation kann weder eine Geräte-Rolle erweitern
  noch auf eine solche zielen, die durch die Kopplung nie genehmigt wurde.
- Für Sitzungen mit gepaartem Gerätetoken ist die Geräteverwaltung selbstbezogen, sofern der
  Aufrufer nicht auch `operator.admin` hat: Aufrufer ohne Admin-Rechte können nur **ihren eigenen**
  Geräteeintrag entfernen/widerrufen/rotieren.
- `device.token.rotate` und `device.token.revoke` prüfen auch die Bereichsmenge des Ziel-Operator-
  Tokens gegen die aktuellen Sitzungsbereiche des Aufrufers. Aufrufer ohne Admin-Rechte
  können kein breiteres Operator-Token rotieren oder widerrufen, als sie bereits besitzen.
- Authentifizierungsfehler enthalten `error.details.code` plus Hinweise zur Wiederherstellung:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Client-Verhalten bei `AUTH_TOKEN_MISMATCH`:
  - Vertrauenswürdige Clients dürfen einen begrenzten Wiederholungsversuch mit einem zwischengespeicherten Token pro Gerät ausführen.
  - Wenn dieser Wiederholungsversuch fehlschlägt, sollten Clients automatische Wiederverbindungsschleifen stoppen und Hinweise für Operator-Aktionen anzeigen.

## Geräteidentität + Kopplung

- Nodes sollten eine stabile Geräteidentität (`device.id`) angeben, die von einem
  Fingerabdruck eines Schlüsselpaars abgeleitet ist.
- Gateways stellen Tokens pro Gerät + Rolle aus.
- Kopplungsgenehmigungen sind für neue Geräte-IDs erforderlich, sofern nicht lokale automatische Genehmigung
  aktiviert ist.
- Die automatische Genehmigung der Kopplung ist auf direkte lokale Loopback-Verbindungen ausgerichtet.
- OpenClaw hat außerdem einen engen backend-/containerlokalen Selbstverbindungspfad für
  vertrauenswürdige Helper-Abläufe mit gemeinsamem Secret.
- Verbindungen über Tailnet oder LAN vom selben Host werden für die Kopplung weiterhin als remote behandelt und
  erfordern Genehmigung.
- WS-Clients schließen normalerweise beim `connect` die Identität von `device` ein (Operator +
  Node). Die einzigen gerätelosen Ausnahmen für Operatoren sind explizite Vertrauenspfade:
  - `gateway.controlUi.allowInsecureAuth=true` für nur localhost betreffende Kompatibilität mit unsicherem HTTP.
  - erfolgreiche Authentifizierung der Operator-Control-UI über `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (Notfalloption, starke Sicherheitsabsenkung).
  - direkte Loopback-Backend-RPCs von `gateway-client`, authentifiziert mit dem gemeinsamen
    Gateway-Token/-Passwort.
- Alle Verbindungen müssen die vom Server bereitgestellte Nonce `connect.challenge` signieren.

### Diagnosen zur Migration der Geräteauthentifizierung

Für ältere Clients, die noch das Signierungsverhalten vor der Challenge verwenden, gibt `connect` jetzt
`DEVICE_AUTH_*`-Detailcodes unter `error.details.code` mit einem stabilen `error.details.reason` zurück.

Häufige Migrationsfehler:

| Meldung                     | details.code                     | details.reason           | Bedeutung                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client hat `device.nonce` weggelassen (oder leer gesendet). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client hat mit einer veralteten/falschen Nonce signiert. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signatur-Payload entspricht nicht der v2-Payload. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Signierter Zeitstempel liegt außerhalb der erlaubten Abweichung. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` stimmt nicht mit dem Fingerabdruck des öffentlichen Schlüssels überein. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/Kanonisierung des öffentlichen Schlüssels fehlgeschlagen. |

Migrationsziel:

- Immer auf `connect.challenge` warten.
- Die v2-Payload signieren, die die Server-Nonce enthält.
- Dieselbe Nonce in `connect.params.device.nonce` senden.
- Die bevorzugte Signatur-Payload ist `v3`, die zusätzlich `platform` und `deviceFamily`
  an Felder für device/client/role/scopes/token/nonce bindet.
- Ältere `v2`-Signaturen bleiben aus Kompatibilitätsgründen akzeptiert, aber Pinning der Metadaten
  gepaarter Geräte steuert weiterhin die Befehlsrichtlinie bei Wiederverbindungen.

## TLS + Pinning

- TLS wird für WS-Verbindungen unterstützt.
- Clients können optional den Fingerabdruck des Gateway-Zertifikats anheften (siehe Konfiguration `gateway.tls`
  plus `gateway.remote.tlsFingerprint` oder CLI `--tls-fingerprint`).

## Geltungsbereich

Dieses Protokoll stellt die **vollständige Gateway-API** bereit (Status, Kanäle, Modelle, Chat,
Agent, Sitzungen, Nodes, Genehmigungen usw.). Die genaue Oberfläche ist durch die
TypeBox-Schemas in `src/gateway/protocol/schema.ts` definiert.

## Verwandt

- [Bridge-Protokoll](/de/gateway/bridge-protocol)
- [Gateway-Runbook](/de/gateway)
