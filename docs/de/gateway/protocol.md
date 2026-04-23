---
read_when:
    - Implementieren oder Aktualisieren von Gateway-WS-Clients
    - Debuggen von Protokollabweichungen oder Verbindungsfehlern
    - Protokollschema/-modelle neu generieren
summary: 'Gateway-WebSocket-Protokoll: Handshake, Frames, Versionierung'
title: Gateway-Protokoll
x-i18n:
    generated_at: "2026-04-23T06:29:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d4ea65fbe31962ed8ece04a645cfe5aaff9fee8b5f89bc896b461cd45567634
    source_path: gateway/protocol.md
    workflow: 15
---

# Gateway-Protokoll (WebSocket)

Das Gateway-WS-Protokoll ist die **einzige Control Plane + der Node-Transport** für
OpenClaw. Alle Clients (CLI, Web-UI, macOS-App, iOS-/Android-Nodes, headless
Nodes) verbinden sich über WebSocket und deklarieren beim
Handshake ihre **Rolle** + ihren **Geltungsbereich**.

## Transport

- WebSocket, Text-Frames mit JSON-Payloads.
- Der erste Frame **muss** eine `connect`-Anfrage sein.
- Frames vor dem Verbindungsaufbau sind auf 64 KiB begrenzt. Nach einem erfolgreichen Handshake sollten Clients
  die Grenzen `hello-ok.policy.maxPayload` und
  `hello-ok.policy.maxBufferedBytes` einhalten. Wenn Diagnosefunktionen aktiviert sind,
  erzeugen zu große eingehende Frames und langsame ausgehende Buffer `payload.large`-Ereignisse,
  bevor das Gateway den betroffenen Frame schließt oder verwirft. Diese Ereignisse enthalten
  Größen, Limits, Oberflächen und sichere Grundcodes. Sie enthalten nicht den Nachrichtentext,
  Anhangsinhalte, den rohen Frame-Body, Token, Cookies oder Secret-Werte.

## Handshake (`connect`)

Gateway → Client (Challenge vor Verbindungsaufbau):

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
meldet die ausgehandelte Rolle/die ausgehandelten Scopes, sofern verfügbar, und enthält `deviceToken`,
wenn das Gateway eines ausgibt.

Wenn kein Device-Token ausgegeben wird, kann `hello-ok.auth` trotzdem die ausgehandelten
Berechtigungen melden:

```json
{
  "auth": {
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

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

Während der vertrauenswürdigen Bootstrap-Übergabe kann `hello-ok.auth` außerdem zusätzliche
gebundene Rolleneinträge in `deviceTokens` enthalten:

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

Beim integrierten Bootstrap-Ablauf für Node/Operator bleibt das primäre Node-Token bei
`scopes: []`, und jedes übergebene Operator-Token bleibt auf die Bootstrap-
Allowlist des Operators begrenzt (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Die Prüfung des Bootstrap-Geltungsbereichs bleibt
rollenpräfixiert: Operator-Einträge erfüllen nur Operator-Anfragen, und Rollen, die keine Operatoren sind,
benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

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

### Rollen

- `operator` = Control-Plane-Client (CLI/UI/Automatisierung).
- `node` = Capability-Host (camera/screen/canvas/system.run).

### Scopes (`operator`)

Häufige Scopes:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` mit `includeSecrets: true` erfordert `operator.talk.secrets`
(oder `operator.admin`).

Von Plugins registrierte Gateway-RPC-Methoden können ihren eigenen Operator-Scope
anfordern, aber reservierte Core-Admin-Präfixe (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) werden immer zu `operator.admin` aufgelöst.

Der Methodenscope ist nur die erste Hürde. Einige Slash-Befehle, die über
`chat.send` erreicht werden, wenden zusätzlich strengere Prüfungen auf Befehlsebene an. Zum Beispiel erfordern persistente
Schreibvorgänge mit `/config set` und `/config unset` `operator.admin`.

`node.pair.approve` hat zusätzlich zur
Basis-Methodenscope noch eine weitere Scope-Prüfung zum Zeitpunkt der Genehmigung:

- Anfragen ohne Befehl: `operator.pairing`
- Anfragen mit Node-Befehlen ohne Exec: `operator.pairing` + `operator.write`
- Anfragen, die `system.run`, `system.run.prepare` oder `system.which` enthalten:
  `operator.pairing` + `operator.admin`

### `caps`/`commands`/`permissions` (`node`)

Nodes deklarieren beim Verbindungsaufbau Capability-Claims:

- `caps`: High-Level-Capability-Kategorien.
- `commands`: Allowlist für Befehle bei `invoke`.
- `permissions`: granulare Umschalter (z. B. `screen.record`, `camera.capture`).

Das Gateway behandelt diese als **Claims** und erzwingt serverseitige Allowlists.

## Presence

- `system-presence` gibt Einträge zurück, die nach Geräteidentität verschlüsselt sind.
- Presence-Einträge enthalten `deviceId`, `roles` und `scopes`, damit UIs pro Gerät eine einzige Zeile anzeigen können,
  auch wenn es sowohl als **operator** als auch als **node** verbunden ist.

## Scope-Begrenzung für Broadcast-Ereignisse

Vom Server gepushte WebSocket-Broadcast-Ereignisse sind scope-begrenzt, damit Sitzungen mit Pairing-Scope oder reine Node-Sitzungen keine Sitzungsinhalte passiv empfangen.

- **Chat-, Agent- und Tool-Ergebnis-Frames** (einschließlich gestreamter `agent`-Ereignisse und Tool-Aufrufergebnisse) erfordern mindestens `operator.read`. Sitzungen ohne `operator.read` überspringen diese Frames vollständig.
- **Plugin-definierte `plugin.*`-Broadcasts** sind auf `operator.write` oder `operator.admin` begrenzt, je nachdem, wie das Plugin sie registriert hat.
- **Status- und Transportereignisse** (`heartbeat`, `presence`, `tick`, Lebenszyklus von connect/disconnect usw.) bleiben uneingeschränkt, damit der Zustand des Transports für jede authentifizierte Sitzung beobachtbar bleibt.
- **Unbekannte Broadcast-Ereignisfamilien** sind standardmäßig scope-begrenzt (fail-closed), sofern ein registrierter Handler sie nicht ausdrücklich lockert.

Jede Client-Verbindung behält ihre eigene Sequenznummer pro Client bei, sodass Broadcasts auf diesem Socket monotone Reihenfolge beibehalten, auch wenn verschiedene Clients unterschiedliche, scope-gefilterte Teilmengen des Ereignisstreams sehen.

## Häufige RPC-Methodenfamilien

Diese Seite ist kein generierter vollständiger Dump, aber die öffentliche WS-Oberfläche ist breiter
als die obigen Beispiele für Handshake/Auth. Dies sind die wichtigsten Methodenfamilien, die
das Gateway derzeit bereitstellt.

`hello-ok.features.methods` ist eine konservative Discovery-Liste, die aus
`src/gateway/server-methods-list.ts` plus exportierten Methoden aus geladenen Plugins/Kanälen aufgebaut wird.
Behandeln Sie sie als Feature-Discovery, nicht als generierten Dump jeder aufrufbaren Hilfsfunktion,
die in `src/gateway/server-methods/*.ts` implementiert ist.

### System und Identität

- `health` gibt den zwischengespeicherten oder frisch geprüften Gateway-Integritätssnapshot zurück.
- `diagnostics.stability` gibt den jüngsten begrenzten Stabilitätsrekorder der Diagnose zurück.
  Er enthält Betriebsmetadaten wie Ereignisnamen, Zähler, Byte-
  Größen, Speicherwerte, Queue-/Sitzungsstatus, Kanal-/Plugin-Namen und Sitzungs-
  IDs. Er enthält keinen Chat-Text, Webhook-Bodies, Tool-Ausgaben, rohe Anfrage- oder
  Antwort-Bodies, Token, Cookies oder Secret-Werte. `operator.read` ist
  erforderlich.
- `status` gibt die Gateway-Zusammenfassung im Stil von `/status` zurück; sensible Felder sind
  nur für Operator-Clients mit Admin-Scope enthalten.
- `gateway.identity.get` gibt die Gateway-Geräteidentität zurück, die von Relay- und
  Pairing-Abläufen verwendet wird.
- `system-presence` gibt den aktuellen Presence-Snapshot für verbundene
  Operator-/Node-Geräte zurück.
- `system-event` hängt ein Systemereignis an und kann den Presence-
  Kontext aktualisieren/übertragen.
- `last-heartbeat` gibt das zuletzt persistent gespeicherte Heartbeat-Ereignis zurück.
- `set-heartbeats` schaltet die Verarbeitung von Heartbeat auf dem Gateway um.

### Modelle und Nutzung

- `models.list` gibt den zur Laufzeit erlaubten Modellkatalog zurück.
- `usage.status` gibt Zusammenfassungen zu Providernutzung, Zeitfenstern und verbleibender Quote zurück.
- `usage.cost` gibt aggregierte Zusammenfassungen der Kostennutzung für einen Datumsbereich zurück.
- `doctor.memory.status` gibt den Bereitschaftsstatus von Vektorspeicher/Embeddings für den
  aktiven Standard-Agent-Workspace zurück.
- `sessions.usage` gibt Nutzungszusammenfassungen pro Sitzung zurück.
- `sessions.usage.timeseries` gibt Nutzungszeitreihen für eine Sitzung zurück.
- `sessions.usage.logs` gibt Nutzungsloproteinträge für eine Sitzung zurück.

### Kanäle und Login-Helfer

- `channels.status` gibt Statuszusammenfassungen für integrierte und gebündelte Kanal-/Plugin-Summaries zurück.
- `channels.logout` meldet ein bestimmtes Kanal-/Konto ab, sofern der Kanal
  Logout unterstützt.
- `web.login.start` startet einen QR-/Web-Login-Ablauf für den aktuellen QR-fähigen Web-
  Kanal-Provider.
- `web.login.wait` wartet darauf, dass dieser QR-/Web-Login-Ablauf abgeschlossen wird, und startet bei Erfolg den
  Kanal.
- `push.test` sendet einen Test-APNs-Push an einen registrierten iOS-Node.
- `voicewake.get` gibt die gespeicherten Wake-Word-Trigger zurück.
- `voicewake.set` aktualisiert Wake-Word-Trigger und überträgt die Änderung.

### Messaging und Protokolle

- `send` ist die direkte RPC für ausgehende Zustellung für Kanal-/Konto-/Thread-Ziele
  außerhalb des Chat-Runners.
- `logs.tail` gibt das konfigurierte Gateway-Dateiprotokollende mit Cursor-/Limit- und
  Max-Byte-Steuerung zurück.

### Talk und TTS

- `talk.config` gibt die effektive Talk-Konfigurations-Payload zurück; `includeSecrets`
  erfordert `operator.talk.secrets` (oder `operator.admin`).
- `talk.mode` setzt/überträgt den aktuellen Talk-Modusstatus für WebChat-/Control-UI-
  Clients.
- `talk.speak` synthetisiert Sprache über den aktiven Talk-Sprachprovider.
- `tts.status` gibt den aktivierten TTS-Status, den aktiven Provider, Fallback-Provider
  und den Provider-Konfigurationsstatus zurück.
- `tts.providers` gibt das sichtbare TTS-Provider-Inventar zurück.
- `tts.enable` und `tts.disable` schalten den TTS-Präferenzstatus um.
- `tts.setProvider` aktualisiert den bevorzugten TTS-Provider.
- `tts.convert` führt eine einmalige Text-zu-Sprache-Konvertierung aus.

### Secrets, Konfiguration, Update und Wizard

- `secrets.reload` löst aktive SecretRefs erneut auf und tauscht den Laufzeitstatus der Secrets
  nur bei vollständigem Erfolg aus.
- `secrets.resolve` löst auf Befehlsziele gerichtete Secret-Zuweisungen für eine bestimmte
  Menge aus Befehl/Ziel auf.
- `config.get` gibt den aktuellen Konfigurations-Snapshot und Hash zurück.
- `config.set` schreibt eine validierte Konfigurations-Payload.
- `config.patch` führt ein Merge für eine partielle Konfigurationsaktualisierung aus.
- `config.apply` validiert + ersetzt die vollständige Konfigurations-Payload.
- `config.schema` gibt die Live-Konfigurationsschema-Payload zurück, die von Control UI und
  CLI-Tooling verwendet wird: Schema, `uiHints`, Version und Generierungsmetadaten, einschließlich
  Plugin- + Kanal-Schemametadaten, wenn die Laufzeitumgebung sie laden kann. Das Schema
  enthält Feldmetadaten `title` / `description`, die von denselben Labels
  und Hilfetexten abgeleitet sind wie in der UI, einschließlich verschachtelter Objekte, Wildcards, Array-Elementen
  und Verzweigungen mit `anyOf` / `oneOf` / `allOf`, wenn passende Felddokumentation
  vorhanden ist.
- `config.schema.lookup` gibt eine auf einen Pfad begrenzte Lookup-Payload für einen Konfigurations-
  pfad zurück: normalisierter Pfad, ein flacher Schemaknoten, passender Hint + `hintPath` sowie
  Zusammenfassungen unmittelbarer Kindknoten für Drill-down in UI/CLI.
  - Lookup-Schemaknoten behalten die benutzerseitige Dokumentation und gängige Validierungsfelder:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    numerische/String-/Array-/Objektgrenzen sowie boolesche Flags wie
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Zusammenfassungen von Kindknoten zeigen `key`, normalisierten `path`, `type`, `required`,
    `hasChildren` sowie den passenden `hint` / `hintPath`.
- `update.run` führt den Gateway-Update-Ablauf aus und plant einen Neustart nur dann,
  wenn das Update selbst erfolgreich war.
- `wizard.start`, `wizard.next`, `wizard.status` und `wizard.cancel` stellen den
  Onboarding-Wizard über WS-RPC bereit.

### Vorhandene große Familien

#### Agent- und Workspace-Helfer

- `agents.list` gibt konfigurierte Agent-Einträge zurück.
- `agents.create`, `agents.update` und `agents.delete` verwalten Agent-Datensätze und
  Workspace-Verkabelung.
- `agents.files.list`, `agents.files.get` und `agents.files.set` verwalten die
  freigegebenen Bootstrap-Workspace-Dateien eines Agent.
- `agent.identity.get` gibt die effektive Assistentenidentität für einen Agent oder
  eine Sitzung zurück.
- `agent.wait` wartet, bis ein Lauf beendet ist, und gibt, wenn verfügbar, den Endzustands-Snapshot zurück.

#### Sitzungssteuerung

- `sessions.list` gibt den aktuellen Sitzungsindex zurück.
- `sessions.subscribe` und `sessions.unsubscribe` schalten Sitzungänderungs-
  abonnements für den aktuellen WS-Client um.
- `sessions.messages.subscribe` und `sessions.messages.unsubscribe` schalten
  Transkript-/Nachrichtenereignis-Abonnements für eine Sitzung um.
- `sessions.preview` gibt begrenzte Transkriptvorschauen für bestimmte Sitzungs-
  schlüssel zurück.
- `sessions.resolve` löst ein Sitzungsziel auf oder kanonisiert es.
- `sessions.create` erstellt einen neuen Sitzungseintrag.
- `sessions.send` sendet eine Nachricht in eine vorhandene Sitzung.
- `sessions.steer` ist die Interrupt-and-Steer-Variante für eine aktive Sitzung.
- `sessions.abort` bricht aktive Arbeit für eine Sitzung ab.
- `sessions.patch` aktualisiert Sitzungsmetadaten/-Overrides.
- `sessions.reset`, `sessions.delete` und `sessions.compact` führen Sitzungs-
  wartung aus.
- `sessions.get` gibt die vollständige gespeicherte Sitzungszeile zurück.
- Die Chat-Ausführung verwendet weiterhin `chat.history`, `chat.send`, `chat.abort` und
  `chat.inject`.
- `chat.history` ist für UI-Clients anzeige-normalisiert: Inline-Direktiv-Tags werden
  aus sichtbarem Text entfernt, XML-Payloads von Tool-Aufrufen im Klartext (einschließlich
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und
  abgeschnittener Tool-Call-Blöcke) sowie geleakte ASCII-/Full-Width-Modell-Steuertoken
  werden entfernt, reine Assistant-Zeilen mit stillem Token wie exakt `NO_REPLY` /
  `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden.

#### Geräte-Pairing und Device-Token

- `device.pair.list` gibt ausstehende und genehmigte gekoppelte Geräte zurück.
- `device.pair.approve`, `device.pair.reject` und `device.pair.remove` verwalten
  Datensätze für Geräte-Pairing.
- `device.token.rotate` rotiert ein Token für ein gekoppeltes Gerät innerhalb seiner genehmigten Rollen-
  und Scope-Grenzen.
- `device.token.revoke` widerruft ein Token für ein gekoppeltes Gerät.

#### Node-Pairing, Invoke und ausstehende Arbeit

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` und `node.pair.verify` decken Node-Pairing und Bootstrap-
  Verifikation ab.
- `node.list` und `node.describe` geben bekannten/verbundenen Node-Status zurück.
- `node.rename` aktualisiert ein Label eines gekoppelten Node.
- `node.invoke` leitet einen Befehl an einen verbundenen Node weiter.
- `node.invoke.result` gibt das Ergebnis einer Invoke-Anfrage zurück.
- `node.event` transportiert Node-seitige Ereignisse zurück in das Gateway.
- `node.canvas.capability.refresh` aktualisiert scope-begrenzte Canvas-Capability-Token.
- `node.pending.pull` und `node.pending.ack` sind die Queue-APIs für verbundene Nodes.
- `node.pending.enqueue` und `node.pending.drain` verwalten dauerhafte ausstehende Arbeit
  für offline/getrennte Nodes.

#### Freigabefamilien

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` und
  `exec.approval.resolve` decken einmalige Exec-Freigabeanfragen sowie ausstehende
  Freigabe-Lookups/-Wiedergaben ab.
- `exec.approval.waitDecision` wartet auf eine ausstehende Exec-Freigabe und gibt
  die endgültige Entscheidung zurück (oder `null` bei Zeitüberschreitung).
- `exec.approvals.get` und `exec.approvals.set` verwalten Snapshots der Gateway-Exec-
  Freigaberichtlinie.
- `exec.approvals.node.get` und `exec.approvals.node.set` verwalten Node-lokale Exec-
  Freigaberichtlinien über Node-Relay-Befehle.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` und `plugin.approval.resolve` decken
  Plugin-definierte Freigabeabläufe ab.

#### Andere große Familien

- Automatisierung:
  - `wake` plant eine sofortige oder beim nächsten Heartbeat erfolgende Wake-Text-Injektion
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/Tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Häufige Ereignisfamilien

- `chat`: UI-Chat-Aktualisierungen wie `chat.inject` und andere rein transkriptbezogene Chat-
  Ereignisse.
- `session.message` und `session.tool`: Transkript-/Ereignisstream-Aktualisierungen für eine
  abonnierte Sitzung.
- `sessions.changed`: Sitzungsindex oder Metadaten wurden geändert.
- `presence`: Aktualisierungen des System-Presence-Snapshots.
- `tick`: periodisches Keepalive-/Liveness-Ereignis.
- `health`: Aktualisierung des Gateway-Integritätssnapshots.
- `heartbeat`: Aktualisierung des Heartbeat-Ereignisstreams.
- `cron`: Änderungsereignis für Cron-Lauf/Job.
- `shutdown`: Gateway-Shutdown-Benachrichtigung.
- `node.pair.requested` / `node.pair.resolved`: Lebenszyklus des Node-Pairings.
- `node.invoke.request`: Broadcast einer Node-Invoke-Anfrage.
- `device.pair.requested` / `device.pair.resolved`: Lebenszyklus gekoppelter Geräte.
- `voicewake.changed`: Konfiguration der Wake-Word-Trigger wurde geändert.
- `exec.approval.requested` / `exec.approval.resolved`: Lebenszyklus der Exec-
  Freigabe.
- `plugin.approval.requested` / `plugin.approval.resolved`: Lebenszyklus der Plugin-Freigabe.

### Node-Hilfsmethoden

- Nodes können `skills.bins` aufrufen, um die aktuelle Liste der Skill-Executables
  für Prüfungen mit automatischer Allowlist abzurufen.

### Operator-Hilfsmethoden

- Operatoren können `commands.list` (`operator.read`) aufrufen, um das Laufzeit-
  befehlsinventar für einen Agent abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agent-Workspace zu lesen.
  - `scope` steuert, welche Oberfläche der primäre `name` adressiert:
    - `text` gibt das primäre Text-Befehlstoken ohne führendes `/` zurück
    - `native` und der Standardpfad `both` geben providerbewusste native Namen zurück,
      wenn verfügbar
  - `textAliases` enthält exakte Slash-Aliase wie `/model` und `/m`.
  - `nativeName` enthält den providerbewussten nativen Befehlsnamen, wenn einer vorhanden ist.
  - `provider` ist optional und wirkt sich nur auf native Benennung sowie die Verfügbarkeit nativer Plugin-
    Befehle aus.
  - `includeArgs=false` lässt serialisierte Argumentmetadaten in der Antwort weg.
- Operatoren können `tools.catalog` (`operator.read`) aufrufen, um den Laufzeit-Tool-Katalog für einen
  Agent abzurufen. Die Antwort enthält gruppierte Tools und Provenance-Metadaten:
  - `source`: `core` oder `plugin`
  - `pluginId`: Plugin-Eigentümer, wenn `source="plugin"`
  - `optional`: ob ein Plugin-Tool optional ist
- Operatoren können `tools.effective` (`operator.read`) aufrufen, um das zur Laufzeit effektive Tool-
  inventar für eine Sitzung abzurufen.
  - `sessionKey` ist erforderlich.
  - Das Gateway leitet vertrauenswürdigen Laufzeitkontext serverseitig aus der Sitzung ab, statt vom
    Aufrufer bereitgestellten Auth- oder Zustellungskontext zu akzeptieren.
  - Die Antwort ist sitzungsbezogen und spiegelt wider, was die aktive Unterhaltung aktuell verwenden kann,
    einschließlich Core-, Plugin- und Kanal-Tools.
- Operatoren können `skills.status` (`operator.read`) aufrufen, um das sichtbare
  Skill-Inventar für einen Agent abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agent-Workspace zu lesen.
  - Die Antwort enthält Eignung, fehlende Anforderungen, Konfigurationsprüfungen und
    bereinigte Installationsoptionen, ohne rohe Secret-Werte offenzulegen.
- Operatoren können `skills.search` und `skills.detail` (`operator.read`) für
  ClawHub-Discovery-Metadaten aufrufen.
- Operatoren können `skills.install` (`operator.admin`) in zwei Modi aufrufen:
  - ClawHub-Modus: `{ source: "clawhub", slug, version?, force? }` installiert einen
    Skill-Ordner in das `skills/`-Verzeichnis des Standard-Agent-Workspace.
  - Gateway-Installer-Modus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    führt eine deklarierte Aktion `metadata.openclaw.install` auf dem Gateway-Host aus.
- Operatoren können `skills.update` (`operator.admin`) in zwei Modi aufrufen:
  - Der ClawHub-Modus aktualisiert einen verfolgten Slug oder alle verfolgten ClawHub-Installationen im
    Standard-Agent-Workspace.
  - Der Konfigurationsmodus patcht Werte in `skills.entries.<skillKey>` wie `enabled`,
    `apiKey` und `env`.

## Exec-Freigaben

- Wenn eine Exec-Anfrage eine Freigabe benötigt, broadcastet das Gateway `exec.approval.requested`.
- Operator-Clients lösen dies durch Aufruf von `exec.approval.resolve` auf (erfordert den Scope `operator.approvals`).
- Für `host=node` muss `exec.approval.request` `systemRunPlan` enthalten (kanonisches `argv`/`cwd`/`rawCommand`/Sitzungsmetadaten). Anfragen ohne `systemRunPlan` werden abgelehnt.
- Nach der Freigabe verwenden weitergeleitete `node.invoke system.run`-Aufrufe diesen kanonischen
  `systemRunPlan` erneut als autoritativen Kontext für Befehl/cwd/Sitzung.
- Wenn ein Aufrufer zwischen dem Vorbereiten und dem finalen freigegebenen `system.run`-Weiterleiten
  `command`, `rawCommand`, `cwd`, `agentId` oder `sessionKey` verändert, lehnt das
  Gateway den Lauf ab, statt der veränderten Payload zu vertrauen.

## Agent-Zustellungsfallback

- `agent`-Anfragen können `deliver=true` enthalten, um ausgehende Zustellung anzufordern.
- `bestEffortDeliver=false` behält strenges Verhalten bei: nicht auflösbare oder nur intern verfügbare Zustellziele geben `INVALID_REQUEST` zurück.
- `bestEffortDeliver=true` erlaubt Fallback auf reine Sitzungsausführung, wenn keine extern zustellbare Route aufgelöst werden kann (zum Beispiel interne/WebChat-Sitzungen oder mehrdeutige Multikanal-Konfigurationen).

## Versionierung

- `PROTOCOL_VERSION` befindet sich in `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clients senden `minProtocol` + `maxProtocol`; der Server lehnt Abweichungen ab.
- Schemas + Modelle werden aus TypeBox-Definitionen generiert:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Client-Konstanten

Der Referenzclient in `src/gateway/client.ts` verwendet diese Standardwerte. Die Werte sind
über Protokoll-v3 hinweg stabil und bilden die erwartete Basis für Clients von Drittanbietern.

| Konstante                                 | Standardwert                                          | Quelle                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Anfrage-Timeout (pro RPC)                 | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Timeout für Preauth / Connect-Challenge   | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (Clamp `250`–`10_000`) |
| Initiales Reconnect-Backoff               | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Maximales Reconnect-Backoff               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Fast-Retry-Clamp nach Device-Token-Close  | `250` ms                                              | `src/gateway/client.ts`                                    |
| Grace für Force-Stop vor `terminate()`    | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Standard-Timeout für `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Standard-Tick-Intervall (vor `hello-ok`)  | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Tick-Timeout-Close                        | Code `4000`, wenn Stille `tickIntervalMs * 2` überschreitet | `src/gateway/client.ts`                               |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Der Server kündigt in `hello-ok` die effektiven Werte für `policy.tickIntervalMs`, `policy.maxPayload`
und `policy.maxBufferedBytes` an; Clients sollten diese Werte einhalten
statt der Standardwerte vor dem Handshake.

## Auth

- Gemeinsame Gateway-Secret-Authentifizierung verwendet `connect.params.auth.token` oder
  `connect.params.auth.password`, abhängig vom konfigurierten Auth-Modus.
- Identitätstragende Modi wie Tailscale Serve
  (`gateway.auth.allowTailscale: true`) oder nicht-loopback-
  `gateway.auth.mode: "trusted-proxy"` erfüllen die Connect-Auth-Prüfung anhand von
  Anfrage-Headern statt über `connect.params.auth.*`.
- Private-Ingress mit `gateway.auth.mode: "none"` überspringt die Connect-Authentifizierung mit gemeinsamem Secret
  vollständig; setzen Sie diesen Modus nicht an öffentlichem/nicht vertrauenswürdigem Ingress ein.
- Nach dem Pairing gibt das Gateway ein **Device-Token** aus, das auf die Rolle + Scopes
  der Verbindung begrenzt ist. Es wird in `hello-ok.auth.deviceToken` zurückgegeben und sollte vom Client
  für zukünftige Verbindungen persistent gespeichert werden.
- Clients sollten das primäre `hello-ok.auth.deviceToken` nach jeder
  erfolgreichen Verbindung persistent speichern.
- Bei einer erneuten Verbindung mit diesem **gespeicherten** Device-Token sollte auch die gespeicherte
  genehmigte Scope-Menge für dieses Token wiederverwendet werden. Dadurch bleiben bereits
  gewährte Lese-/Probe-/Statuszugriffe erhalten und es wird vermieden, dass Reconnects stillschweigend auf einen
  engeren impliziten Admin-Only-Scope zurückfallen.
- Clientseitiger Aufbau der Connect-Auth (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` ist orthogonal und wird immer weitergeleitet, wenn gesetzt.
  - `auth.token` wird in dieser Prioritätsreihenfolge befüllt: zuerst explizites gemeinsames Token,
    dann ein explizites `deviceToken`, dann ein gespeichertes Token pro Gerät (verschlüsselt nach
    `deviceId` + `role`).
  - `auth.bootstrapToken` wird nur gesendet, wenn keines der oben genannten ein
    `auth.token` auflösen konnte. Ein gemeinsames Token oder ein beliebiges aufgelöstes Device-Token unterdrückt es.
  - Die automatische Hochstufung eines gespeicherten Device-Tokens beim einmaligen
    Retry nach `AUTH_TOKEN_MISMATCH` ist nur für **vertrauenswürdige Endpunkte** aktiviert —
    loopback oder `wss://` mit angeheftetem `tlsFingerprint`. Öffentliches `wss://`
    ohne Pinning qualifiziert sich nicht.
- Zusätzliche Einträge in `hello-ok.auth.deviceTokens` sind Bootstrap-Übergabetoken.
  Speichern Sie sie nur dann persistent, wenn die Verbindung Bootstrap-Auth über einen vertrauenswürdigen Transport
  wie `wss://` oder loopback/lokales Pairing verwendet hat.
- Wenn ein Client ein **explizites** `deviceToken` oder explizite `scopes` angibt, bleibt diese
  vom Aufrufer angeforderte Scope-Menge autoritativ; gecachte Scopes werden nur dann
  wiederverwendet, wenn der Client das gespeicherte Token pro Gerät erneut verwendet.
- Device-Token können über `device.token.rotate` und
  `device.token.revoke` rotiert/widerrufen werden (erfordert `operator.pairing`-Scope).
- Ausgabe/Rotation von Token bleibt auf die genehmigte Rollenmenge beschränkt, die im
  Pairing-Eintrag dieses Geräts gespeichert ist; das Rotieren eines Tokens kann das Gerät nicht auf eine
  Rolle erweitern, die durch die Pairing-Freigabe nie erlaubt wurde.
- Bei Sitzungen mit gepaarten Device-Token ist das Gerätemanagement selbstbegrenzt, sofern der
  Aufrufer nicht zusätzlich `operator.admin` hat: Nicht-Admin-Aufrufer können nur ihren **eigenen**
  Geräteeintrag entfernen/widerrufen/rotieren.
- `device.token.rotate` prüft die angeforderte Operator-Scope-Menge außerdem gegen die
  aktuellen Sitzungsscopes des Aufrufers. Nicht-Admin-Aufrufer können ein Token nicht in eine
  breitere Operator-Scope-Menge rotieren, als sie bereits besitzen.
- Auth-Fehler enthalten `error.details.code` plus Hinweise zur Wiederherstellung:
  - `error.details.canRetryWithDeviceToken` (boolesch)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Client-Verhalten bei `AUTH_TOKEN_MISMATCH`:
  - Vertrauenswürdige Clients dürfen einen begrenzten Retry mit einem gecachten Token pro Gerät versuchen.
  - Wenn dieser Retry fehlschlägt, sollten Clients automatische Reconnect-Schleifen beenden und Hinweise für eine Operator-Aktion anzeigen.

## Geräteidentität + Pairing

- Nodes sollten eine stabile Geräteidentität (`device.id`) einschließen, die aus dem
  Fingerabdruck eines Schlüsselpaares abgeleitet ist.
- Gateways geben Token pro Gerät + Rolle aus.
- Pairing-Freigaben sind für neue Geräte-IDs erforderlich, sofern lokale automatische Freigabe
  nicht aktiviert ist.
- Die automatische Pairing-Freigabe ist auf direkte lokale loopback-Verbindungen ausgerichtet.
- OpenClaw hat außerdem einen engen Self-Connect-Pfad für vertrauenswürdige Hilfsabläufe mit gemeinsamem Secret auf Backend-/Container-Lokalebene.
- Tailnet- oder LAN-Verbindungen auf demselben Host werden für das Pairing weiterhin als remote behandelt und
  erfordern eine Freigabe.
- Alle WS-Clients müssen während `connect` die `device`-Identität einschließen (operator + node).
  Control UI darf sie nur in diesen Modi weglassen:
  - `gateway.controlUi.allowInsecureAuth=true` für nur localhost-kompatible unsichere HTTP-Kompatibilität.
  - erfolgreiche `gateway.auth.mode: "trusted-proxy"`-Authentifizierung der Operator-Control-UI.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (Break-Glass, schwerwiegende Sicherheitsabsenkung).
- Alle Verbindungen müssen die vom Server bereitgestellte `connect.challenge`-Nonce signieren.

### Migrationsdiagnosen für Device-Auth

Für Legacy-Clients, die weiterhin das Signaturverhalten vor der Challenge verwenden, gibt `connect` jetzt
`DEVICE_AUTH_*`-Detailcodes unter `error.details.code` mit einer stabilen `error.details.reason` zurück.

Häufige Migrationsfehler:

| Nachricht                    | details.code                     | details.reason           | Bedeutung                                           |
| --------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client hat `device.nonce` weggelassen (oder leer gesendet). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client hat mit einer veralteten/falschen Nonce signiert. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signatur-Payload entspricht nicht der v2-Payload.   |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Signierter Zeitstempel liegt außerhalb der erlaubten Abweichung. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` stimmt nicht mit dem Fingerabdruck des öffentlichen Schlüssels überein. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/Kanonisierung des öffentlichen Schlüssels ist fehlgeschlagen. |

Migrationsziel:

- Warten Sie immer auf `connect.challenge`.
- Signieren Sie die v2-Payload, die die Server-Nonce enthält.
- Senden Sie dieselbe Nonce in `connect.params.device.nonce`.
- Die bevorzugte Signatur-Payload ist `v3`, die zusätzlich zu den Feldern für device/client/role/scopes/token/nonce auch `platform` und `deviceFamily` bindet.
- Legacy-`v2`-Signaturen bleiben aus Kompatibilitätsgründen weiterhin akzeptiert, aber das Anheften von Metadaten gepaarter Geräte steuert weiterhin die Befehlsrichtlinie beim Reconnect.

## TLS + Pinning

- TLS wird für WS-Verbindungen unterstützt.
- Clients können optional den Fingerabdruck des Gateway-Zertifikats anheften (siehe Konfiguration `gateway.tls`
  sowie `gateway.remote.tlsFingerprint` oder CLI `--tls-fingerprint`).

## Umfang

Dieses Protokoll stellt die **vollständige Gateway-API** bereit (Status, Kanäle, Modelle, Chat,
Agent, Sitzungen, Nodes, Freigaben usw.). Die genaue Oberfläche wird durch die
TypeBox-Schemas in `src/gateway/protocol/schema.ts` definiert.
