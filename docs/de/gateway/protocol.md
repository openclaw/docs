---
read_when:
    - Gateway-WS-Clients implementieren oder aktualisieren
    - Protokollabweichungen oder Verbindungsfehler debuggen
    - Protokollschema/-modelle neu generieren
summary: 'Gateway-WebSocket-Protokoll: Handshake, Frames, Versionierung'
title: Gateway-Protokoll
x-i18n:
    generated_at: "2026-04-22T04:22:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6efa76f5f0faa6c10a8515b0cf457233e48551e3484a605dffaf6459ddff9231
    source_path: gateway/protocol.md
    workflow: 15
---

# Gateway-Protokoll (WebSocket)

Das Gateway-WS-Protokoll ist die **einzige Control Plane + der Node-Transport**
für OpenClaw. Alle Clients (CLI, Web-UI, macOS-App, iOS/Android-Nodes, Headless-
Nodes) verbinden sich über WebSocket und deklarieren ihre **Rolle** + ihren
**Scope** beim Handshake.

## Transport

- WebSocket, Text-Frames mit JSON-Payloads.
- Der erste Frame **muss** eine `connect`-Anfrage sein.

## Handshake (`connect`)

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

`server`, `features`, `snapshot` und `policy` sind laut Schema alle erforderlich
(`src/gateway/protocol/schema/frames.ts`). `canvasHostUrl` ist optional. `auth`
meldet die ausgehandelte Rolle/die ausgehandelten Scopes, wenn verfügbar, und
enthält `deviceToken`, wenn das Gateway einen ausstellt.

Wenn kein Device-Token ausgestellt wird, kann `hello-ok.auth` dennoch die
ausgehandelten Berechtigungen melden:

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

Während der Übergabe beim vertrauenswürdigen Bootstrap kann `hello-ok.auth`
zusätzlich weitere begrenzte Rolleneinträge in `deviceTokens` enthalten:

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

Für den eingebauten Bootstrap-Ablauf für Node/Operator bleibt der primäre
Node-Token bei `scopes: []`, und jeder übergebene Operator-Token bleibt auf die
Bootstrap-Operator-Allowlist begrenzt (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Prüfungen der Bootstrap-Scopes
bleiben rollenpräfixbasiert: Operator-Einträge erfüllen nur Operator-Anfragen,
und Nicht-Operator-Rollen benötigen weiterhin Scopes unter ihrem eigenen
Rollenpräfix.

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

Von Plugins registrierte Gateway-RPC-Methoden können ihren eigenen
`operator`-Scope anfordern, aber reservierte Kern-Admin-Präfixe (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) werden immer zu `operator.admin`
aufgelöst.

Der Methodenscope ist nur die erste Hürde. Einige Slash-Befehle, die über
`chat.send` erreicht werden, wenden darüber hinaus strengere prüfungen auf
Befehlsebene an. Zum Beispiel erfordern persistente Schreibvorgänge mit
`/config set` und `/config unset` `operator.admin`.

`node.pair.approve` hat zusätzlich zur Basismethodenscope-Prüfung noch eine
weitere Scope-Prüfung zum Genehmigungszeitpunkt:

- anfrageloser Befehl: `operator.pairing`
- Anfragen mit Node-Befehlen ohne Exec: `operator.pairing` + `operator.write`
- Anfragen, die `system.run`, `system.run.prepare` oder `system.which`
  enthalten: `operator.pairing` + `operator.admin`

### Caps/Commands/Permissions (`node`)

Nodes deklarieren Capability-Claims beim Verbinden:

- `caps`: übergeordnete Capability-Kategorien.
- `commands`: Command-Allowlist für `invoke`.
- `permissions`: granulare Schalter (z. B. `screen.record`, `camera.capture`).

Das Gateway behandelt diese als **Claims** und erzwingt serverseitige
Allowlists.

## Presence

- `system-presence` gibt Einträge zurück, die nach Geräteidentität geschlüsselt
  sind.
- Presence-Einträge enthalten `deviceId`, `roles` und `scopes`, sodass UIs eine
  einzelne Zeile pro Gerät anzeigen können, selbst wenn es sowohl als
  **operator** als auch als **node** verbunden ist.

## Scope-Begrenzung für Broadcast-Events

Vom Server gepushte WebSocket-Broadcast-Events sind scopebegrenzt, damit
Sitzungen mit Pairing-Scopes oder reine Node-Sitzungen nicht passiv
Sitzungsinhalte empfangen.

- **Chat-, Agent- und Tool-Result-Frames** (einschließlich gestreamter
  `agent`-Events und Tool-Call-Ergebnisse) erfordern mindestens
  `operator.read`. Sitzungen ohne `operator.read` überspringen diese Frames
  vollständig.
- **Plugin-definierte `plugin.*`-Broadcasts** sind auf `operator.write` oder
  `operator.admin` begrenzt, abhängig davon, wie das Plugin sie registriert hat.
- **Status- und Transport-Events** (`heartbeat`, `presence`, `tick`,
  Connect-/Disconnect-Lebenszyklus usw.) bleiben uneingeschränkt, damit die
  Transportintegrität für jede authentifizierte Sitzung beobachtbar bleibt.
- **Unbekannte Broadcast-Event-Familien** sind standardmäßig scopebegrenzt
  (fail-closed), sofern ein registrierter Handler sie nicht explizit lockert.

Jede Client-Verbindung behält ihre eigene clientbezogene Sequenznummer bei,
sodass Broadcasts auf diesem Socket eine monotone Reihenfolge beibehalten,
selbst wenn unterschiedliche Clients verschiedene, per Scope gefilterte
Teilmengen des Event-Streams sehen.

## Häufige RPC-Methodenfamilien

Diese Seite ist kein generierter vollständiger Dump, aber die öffentliche
WS-Oberfläche ist umfangreicher als die oben gezeigten Handshake-/Auth-Beispiele.
Dies sind die wichtigsten Methodenfamilien, die das Gateway derzeit bereitstellt.

`hello-ok.features.methods` ist eine konservative Discovery-Liste, die aus
`src/gateway/server-methods-list.ts` sowie geladenen Plugin-/Channel-
Methodenexporten aufgebaut wird. Behandeln Sie sie als Feature Discovery, nicht
als generierten Dump jedes aufrufbaren Helpers, der in
`src/gateway/server-methods/*.ts` implementiert ist.

### System und Identität

- `health` gibt den zwischengespeicherten oder frisch geprüften Gateway-
  Integritäts-Snapshot zurück.
- `status` gibt die Gateway-Zusammenfassung im Stil von `/status` zurück;
  sensible Felder werden nur für operator-Clients mit Admin-Scope eingeschlossen.
- `gateway.identity.get` gibt die Gateway-Geräteidentität zurück, die von Relay-
  und Pairing-Abläufen verwendet wird.
- `system-presence` gibt den aktuellen Presence-Snapshot für verbundene
  Operator-/Node-Geräte zurück.
- `system-event` hängt ein Systemereignis an und kann Presence-Kontext
  aktualisieren/übertragen.
- `last-heartbeat` gibt das zuletzt persistierte Heartbeat-Ereignis zurück.
- `set-heartbeats` schaltet die Heartbeat-Verarbeitung auf dem Gateway um.

### Modelle und Nutzung

- `models.list` gibt den zur Laufzeit erlaubten Modellkatalog zurück.
- `usage.status` gibt Zusammenfassungen zu Anbieternutzung,
  Nutzungsfenstern/verbleibendem Kontingent zurück.
- `usage.cost` gibt aggregierte Kosten-Nutzungszusammenfassungen für einen
  Datumsbereich zurück.
- `doctor.memory.status` gibt die Bereitschaft von Vektorspeicher/Embeddings für
  den aktiven Workspace des Standardagenten zurück.
- `sessions.usage` gibt Nutzungszusammenfassungen pro Sitzung zurück.
- `sessions.usage.timeseries` gibt Zeitreihen zur Nutzung für eine Sitzung
  zurück.
- `sessions.usage.logs` gibt Usage-Log-Einträge für eine Sitzung zurück.

### Channels und Login-Helper

- `channels.status` gibt Statuszusammenfassungen für eingebaute und gebündelte
  Channels/Plugins zurück.
- `channels.logout` meldet ein bestimmtes Channel-/Konto ab, wenn der Channel
  Logout unterstützt.
- `web.login.start` startet einen QR-/Web-Login-Ablauf für den aktuellen
  QR-fähigen Web-Channel-Provider.
- `web.login.wait` wartet auf den Abschluss dieses QR-/Web-Login-Ablaufs und
  startet den Channel bei Erfolg.
- `push.test` sendet einen APNs-Test-Push an einen registrierten iOS-Node.
- `voicewake.get` gibt die gespeicherten Wake-Word-Trigger zurück.
- `voicewake.set` aktualisiert Wake-Word-Trigger und überträgt die Änderung.

### Messaging und Logs

- `send` ist das direkte RPC für ausgehende Zustellung für kanal-/konto-/
  threadzielgerichtete Sendungen außerhalb des Chat-Runners.
- `logs.tail` gibt den konfigurierten Gateway-Dateilog-Tail mit Cursor/Limit-
  und Max-Byte-Steuerung zurück.

### Talk und TTS

- `talk.config` gibt die effektive Talk-Konfigurations-Payload zurück;
  `includeSecrets` erfordert `operator.talk.secrets` (oder `operator.admin`).
- `talk.mode` setzt/überträgt den aktuellen Talk-Modusstatus für WebChat-/
  Control-UI-Clients.
- `talk.speak` synthetisiert Sprache über den aktiven Talk-Sprachanbieter.
- `tts.status` gibt den TTS-Aktivierungsstatus, den aktiven Anbieter,
  Fallback-Anbieter und den Zustand der Anbieterkonfiguration zurück.
- `tts.providers` gibt das sichtbare TTS-Anbieterverzeichnis zurück.
- `tts.enable` und `tts.disable` schalten den TTS-Präferenzstatus um.
- `tts.setProvider` aktualisiert den bevorzugten TTS-Anbieter.
- `tts.convert` führt eine einmalige Text-zu-Sprache-Konvertierung aus.

### Secrets, Konfiguration, Update und Wizard

- `secrets.reload` löst aktive SecretRefs neu auf und tauscht den Laufzeitstatus
  von Secrets nur bei vollständigem Erfolg aus.
- `secrets.resolve` löst Secret-Zuweisungen für Befehlsziele für eine bestimmte
  Menge aus Befehlen/Zielen auf.
- `config.get` gibt den aktuellen Konfigurations-Snapshot und Hash zurück.
- `config.set` schreibt eine validierte Konfigurations-Payload.
- `config.patch` führt ein Merge einer partiellen Konfigurationsaktualisierung
  aus.
- `config.apply` validiert und ersetzt die vollständige Konfigurations-Payload.
- `config.schema` gibt die Live-Konfigurationsschema-Payload zurück, die von
  Control UI und CLI-Tooling verwendet wird: Schema, `uiHints`, Version und
  Generierungsmetadaten, einschließlich Metadaten zu Plugin- und Channel-
  Schemata, wenn die Laufzeit sie laden kann. Das Schema enthält Feldmetadaten
  `title` / `description`, die aus denselben Labels und Hilfetexten abgeleitet
  sind, die von der UI verwendet werden, einschließlich verschachtelter Objekte,
  Wildcards, Array-Items und Kompositionszweigen von `anyOf` / `oneOf` /
  `allOf`, wenn passende Felddokumentation existiert.
- `config.schema.lookup` gibt eine pfadbezogene Lookup-Payload für einen
  Konfigurationspfad zurück: normalisierter Pfad, ein flacher Schemanknoten,
  passender Hint + `hintPath` sowie unmittelbare Kindzusammenfassungen für
  Drill-down in UI/CLI.
  - Lookup-Schemanknoten behalten die benutzerseitige Dokumentation und
    gebräuchliche Validierungsfelder bei: `title`, `description`, `type`,
    `enum`, `const`, `format`, `pattern`, numerische/String-/Array-/Objekt-
    Grenzen und boolesche Flags wie `additionalProperties`, `deprecated`,
    `readOnly`, `writeOnly`.
  - Kindzusammenfassungen enthalten `key`, normalisierten `path`, `type`,
    `required`, `hasChildren` sowie den passenden `hint` / `hintPath`.
- `update.run` führt den Gateway-Update-Ablauf aus und plant einen Neustart nur,
  wenn das Update selbst erfolgreich war.
- `wizard.start`, `wizard.next`, `wizard.status` und `wizard.cancel` stellen den
  Onboarding-Wizard über WS-RPC bereit.

### Vorhandene große Familien

#### Agenten- und Workspace-Helper

- `agents.list` gibt konfigurierte Agenteneinträge zurück.
- `agents.create`, `agents.update` und `agents.delete` verwalten Agentendatensätze und
  die Workspace-Verdrahtung.
- `agents.files.list`, `agents.files.get` und `agents.files.set` verwalten die
  bereitgestellten Bootstrap-Workspace-Dateien für einen Agenten.
- `agent.identity.get` gibt die effektive Assistant-Identität für einen Agenten oder
  eine Sitzung zurück.
- `agent.wait` wartet, bis ein Lauf beendet ist, und gibt, wenn verfügbar,
  den terminalen Snapshot zurück.

#### Sitzungssteuerung

- `sessions.list` gibt den aktuellen Sitzungsindex zurück.
- `sessions.subscribe` und `sessions.unsubscribe` schalten Sitzungsänderungs-Event-
  Abonnements für den aktuellen WS-Client um.
- `sessions.messages.subscribe` und `sessions.messages.unsubscribe` schalten
  Transcript-/Nachrichten-Event-Abonnements für eine Sitzung um.
- `sessions.preview` gibt begrenzte Transcript-Vorschauen für bestimmte
  Sitzungsschlüssel zurück.
- `sessions.resolve` löst ein Sitzungsziel auf oder kanonisiert es.
- `sessions.create` erstellt einen neuen Sitzungseintrag.
- `sessions.send` sendet eine Nachricht in eine bestehende Sitzung.
- `sessions.steer` ist die Interrupt-und-Steer-Variante für eine aktive Sitzung.
- `sessions.abort` bricht aktive Arbeit für eine Sitzung ab.
- `sessions.patch` aktualisiert Sitzungsmetadaten/-Überschreibungen.
- `sessions.reset`, `sessions.delete` und `sessions.compact` führen Sitzungs-
  Wartungsarbeiten aus.
- `sessions.get` gibt die vollständige gespeicherte Sitzungszeile zurück.
- Die Chat-Ausführung verwendet weiterhin `chat.history`, `chat.send`, `chat.abort` und
  `chat.inject`.
- `chat.history` ist für UI-Clients anzeige-normalisiert: Inline-Direktiv-Tags werden
  aus sichtbarem Text entfernt, XML-Payloads für Tool-Calls in Klartext (einschließlich
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und
  abgeschnittener Tool-Call-Blöcke) sowie durchgesickerte ASCII-/Full-Width-
  Modell-Steuertokens werden entfernt, reine Assistant-Zeilen mit stillen Tokens wie exaktes `NO_REPLY` /
  `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden.

#### Geräte-Kopplung und Device-Tokens

- `device.pair.list` gibt ausstehende und genehmigte gekoppelte Geräte zurück.
- `device.pair.approve`, `device.pair.reject` und `device.pair.remove` verwalten
  Geräte-Kopplungsdatensätze.
- `device.token.rotate` rotiert einen gekoppelten Device-Token innerhalb seiner genehmigten Rollen-
  und Scope-Grenzen.
- `device.token.revoke` widerruft einen gekoppelten Device-Token.

#### Node-Kopplung, Invoke und ausstehende Arbeit

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` und `node.pair.verify` decken Node-Kopplung und Bootstrap-
  Verifizierung ab.
- `node.list` und `node.describe` geben bekannten/verbundenen Node-Status zurück.
- `node.rename` aktualisiert ein Label eines gekoppelten Node.
- `node.invoke` leitet einen Befehl an einen verbundenen Node weiter.
- `node.invoke.result` gibt das Ergebnis für eine Invoke-Anfrage zurück.
- `node.event` trägt von Nodes stammende Events zurück ins Gateway.
- `node.canvas.capability.refresh` aktualisiert bereichsbezogene Canvas-Capability-Tokens.
- `node.pending.pull` und `node.pending.ack` sind die Queue-APIs für verbundene Nodes.
- `node.pending.enqueue` und `node.pending.drain` verwalten dauerhafte ausstehende Arbeit
  für offline/getrennte Nodes.

#### Genehmigungsfamilien

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` und
  `exec.approval.resolve` decken einmalige Exec-Genehmigungsanfragen sowie Lookup/Replay
  ausstehender Genehmigungen ab.
- `exec.approval.waitDecision` wartet auf eine ausstehende Exec-Genehmigung und gibt
  die endgültige Entscheidung zurück (oder `null` bei Timeout).
- `exec.approvals.get` und `exec.approvals.set` verwalten Snapshots der Gateway-Exec-
  Genehmigungsrichtlinie.
- `exec.approvals.node.get` und `exec.approvals.node.set` verwalten die Node-lokale Exec-
  Genehmigungsrichtlinie über Node-Relay-Befehle.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` und `plugin.approval.resolve` decken
  von Plugins definierte Genehmigungsabläufe ab.

#### Weitere große Familien

- Automatisierung:
  - `wake` plant eine sofortige oder beim nächsten Heartbeat erfolgende Textinjektion
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/Tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Häufige Event-Familien

- `chat`: UI-Chat-Aktualisierungen wie `chat.inject` und andere nur-transkriptbezogene Chat-
  Events.
- `session.message` und `session.tool`: Transcript-/Event-Stream-Aktualisierungen für eine
  abonnierte Sitzung.
- `sessions.changed`: Sitzungsindex oder Metadaten wurden geändert.
- `presence`: Aktualisierungen des System-Presence-Snapshots.
- `tick`: periodisches Keepalive-/Lebenszeichen-Event.
- `health`: Aktualisierung des Gateway-Health-Snapshots.
- `heartbeat`: Aktualisierung des Heartbeat-Event-Streams.
- `cron`: Event für Änderung von Cron-Lauf/Job.
- `shutdown`: Benachrichtigung über Gateway-Shutdown.
- `node.pair.requested` / `node.pair.resolved`: Lebenszyklus der Node-Kopplung.
- `node.invoke.request`: Broadcast einer Node-Invoke-Anfrage.
- `device.pair.requested` / `device.pair.resolved`: Lebenszyklus gekoppelter Geräte.
- `voicewake.changed`: Konfiguration des Wake-Word-Triggers wurde geändert.
- `exec.approval.requested` / `exec.approval.resolved`: Lebenszyklus der Exec-
  Genehmigung.
- `plugin.approval.requested` / `plugin.approval.resolved`: Lebenszyklus der Plugin-
  Genehmigung.

### Node-Helper-Methoden

- Nodes können `skills.bins` aufrufen, um die aktuelle Liste ausführbarer Skill-Dateien
  für Auto-Allow-Prüfungen abzurufen.

### Operator-Helper-Methoden

- Operatoren können `commands.list` (`operator.read`) aufrufen, um das Laufzeit-
  Befehlsinventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Workspace des Standardagenten zu lesen.
  - `scope` steuert, auf welche Oberfläche sich der primäre `name` bezieht:
    - `text` gibt das primäre Text-Befehlstoken ohne führendes `/` zurück
    - `native` und der Standardpfad `both` geben anbieterbewusste native Namen
      zurück, wenn verfügbar
  - `textAliases` enthält exakte Slash-Aliasse wie `/model` und `/m`.
  - `nativeName` enthält den anbieterbewussten nativen Befehlsnamen, wenn einer existiert.
  - `provider` ist optional und beeinflusst nur die native Benennung sowie die Verfügbarkeit
    nativer Plugin-Befehle.
  - `includeArgs=false` lässt serialisierte Argumentmetadaten in der Antwort weg.
- Operatoren können `tools.catalog` (`operator.read`) aufrufen, um den Laufzeit-Tool-Katalog für einen
  Agenten abzurufen. Die Antwort enthält gruppierte Tools und Provenienzmetadaten:
  - `source`: `core` oder `plugin`
  - `pluginId`: Plugin-Eigentümer, wenn `source="plugin"`
  - `optional`: ob ein Plugin-Tool optional ist
- Operatoren können `tools.effective` (`operator.read`) aufrufen, um das zur Laufzeit effektive Tool-
  Inventar für eine Sitzung abzurufen.
  - `sessionKey` ist erforderlich.
  - Das Gateway leitet vertrauenswürdigen Laufzeitkontext serverseitig aus der Sitzung ab, statt
    vom Aufrufer gelieferten Auth- oder Zustellungskontext zu akzeptieren.
  - Die Antwort ist sitzungsbezogen und spiegelt wider, was die aktive Unterhaltung im Moment verwenden kann,
    einschließlich Core-, Plugin- und Channel-Tools.
- Operatoren können `skills.status` (`operator.read`) aufrufen, um das sichtbare
  Skill-Inventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Workspace des Standardagenten zu lesen.
  - Die Antwort enthält Eignung, fehlende Anforderungen, Konfigurationsprüfungen und
    bereinigte Installationsoptionen, ohne rohe Secret-Werte offenzulegen.
- Operatoren können `skills.search` und `skills.detail` (`operator.read`) für
  ClawHub-Discovery-Metadaten aufrufen.
- Operatoren können `skills.install` (`operator.admin`) in zwei Modi aufrufen:
  - ClawHub-Modus: `{ source: "clawhub", slug, version?, force? }` installiert einen
    Skill-Ordner in das `skills/`-Verzeichnis des Workspace des Standardagenten.
  - Gateway-Installer-Modus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    führt eine deklarierte Aktion `metadata.openclaw.install` auf dem Gateway-Host aus.
- Operatoren können `skills.update` (`operator.admin`) in zwei Modi aufrufen:
  - Der ClawHub-Modus aktualisiert einen verfolgten Slug oder alle verfolgten ClawHub-Installationen im
    Workspace des Standardagenten.
  - Der Konfigurationsmodus patcht Werte unter `skills.entries.<skillKey>` wie `enabled`,
    `apiKey` und `env`.

## Exec-Genehmigungen

- Wenn eine Exec-Anfrage genehmigt werden muss, sendet das Gateway `exec.approval.requested`.
- Operator-Clients lösen dies durch Aufruf von `exec.approval.resolve` (erfordert Scope `operator.approvals`).
- Für `host=node` muss `exec.approval.request` `systemRunPlan` enthalten (kanonisches `argv`/`cwd`/`rawCommand`/Sitzungsmetadaten). Anfragen ohne `systemRunPlan` werden abgelehnt.
- Nach der Genehmigung verwenden weitergeleitete `node.invoke system.run`-Aufrufe denselben kanonischen
  `systemRunPlan` als maßgeblichen Kontext für Befehl/`cwd`/Sitzung.
- Wenn ein Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` zwischen Prepare und dem finalen genehmigten Weiterleiten von `system.run` verändert, lehnt das
  Gateway den Lauf ab, statt der veränderten Payload zu vertrauen.

## Agent-Zustellungs-Fallback

- `agent`-Anfragen können `deliver=true` enthalten, um eine ausgehende Zustellung anzufordern.
- `bestEffortDeliver=false` behält striktes Verhalten bei: nicht auflösbare oder nur intern zustellbare Ziele geben `INVALID_REQUEST` zurück.
- `bestEffortDeliver=true` erlaubt einen Fallback auf reine Sitzungsausführung, wenn keine extern zustellbare Route aufgelöst werden kann (zum Beispiel interne/WebChat-Sitzungen oder mehrdeutige Mehrkanalkonfigurationen).

## Versionierung

- `PROTOCOL_VERSION` befindet sich in `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clients senden `minProtocol` + `maxProtocol`; der Server lehnt Nichtübereinstimmungen ab.
- Schemas + Modelle werden aus TypeBox-Definitionen generiert:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Client-Konstanten

Der Referenz-Client in `src/gateway/client.ts` verwendet diese Standardwerte. Die Werte sind
über Protokoll-v3 hinweg stabil und die erwartete Basislinie für Clients von Drittanbietern.

| Constant                                  | Standard                                             | Quelle                                                     |
| ----------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                  | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Anfragetimeout (pro RPC)                  | `30_000` ms                                          | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Preauth- / Connect-Challenge-Timeout      | `10_000` ms                                          | `src/gateway/handshake-timeouts.ts` (Clamp `250`–`10_000`) |
| Initialer Reconnect-Backoff               | `1_000` ms                                           | `src/gateway/client.ts` (`backoffMs`)                      |
| Maximaler Reconnect-Backoff               | `30_000` ms                                          | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Fast-Retry-Clamp nach Device-Token-Close  | `250` ms                                             | `src/gateway/client.ts`                                    |
| Force-Stop-Gnadenfrist vor `terminate()`  | `250` ms                                             | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Standard-Timeout von `stopAndWait()`      | `1_000` ms                                           | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Standard-Tick-Intervall (vor `hello-ok`)  | `30_000` ms                                          | `src/gateway/client.ts`                                    |
| Tick-Timeout-Close                        | Code `4000`, wenn Stille `tickIntervalMs * 2` übersteigt | `src/gateway/client.ts`                                    |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                           | `src/gateway/server-constants.ts`                          |

Der Server kündigt das effektive `policy.tickIntervalMs`, `policy.maxPayload`
und `policy.maxBufferedBytes` in `hello-ok` an; Clients sollten diese Werte
statt der Standardwerte vor dem Handshake beachten.

## Auth

- Die Gateway-Authentifizierung mit gemeinsamem Geheimnis verwendet `connect.params.auth.token` oder
  `connect.params.auth.password`, abhängig vom konfigurierten Auth-Modus.
- Modi mit Identitätsträgern wie Tailscale Serve
  (`gateway.auth.allowTailscale: true`) oder Nicht-Loopback-
  `gateway.auth.mode: "trusted-proxy"` erfüllen die Connect-Auth-Prüfung über
  Request-Header statt über `connect.params.auth.*`.
- `gateway.auth.mode: "none"` für private Ingresses überspringt die Shared-Secret-Connect-Auth
  vollständig; setzen Sie diesen Modus nicht an öffentlichem/nicht vertrauenswürdigem Ingress ein.
- Nach dem Pairing stellt das Gateway einen **Device-Token** aus, der auf die Rolle + Scopes
  der Verbindung begrenzt ist. Er wird in `hello-ok.auth.deviceToken` zurückgegeben und sollte
  vom Client für künftige Verbindungen gespeichert werden.
- Clients sollten den primären `hello-ok.auth.deviceToken` nach jeder
  erfolgreichen Verbindung speichern.
- Eine erneute Verbindung mit diesem **gespeicherten** Device-Token sollte auch den gespeicherten
  genehmigten Scope-Satz für diesen Token wiederverwenden. Dadurch bleiben bereits gewährte
  Zugriffe für read/probe/status erhalten und es wird vermieden, dass erneute Verbindungen stillschweigend auf einen
  engeren impliziten Admin-only-Scope zusammenfallen.
- Clientseitige Zusammenstellung der Connect-Auth (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` ist orthogonal und wird immer weitergeleitet, wenn es gesetzt ist.
  - `auth.token` wird in dieser Prioritätsreihenfolge gefüllt: zuerst expliziter Shared-Token,
    dann ein expliziter `deviceToken`, dann ein gespeicherter gerätebezogener Token (geschlüsselt nach
    `deviceId` + `role`).
  - `auth.bootstrapToken` wird nur gesendet, wenn keines der obigen Mittel ein
    `auth.token` aufgelöst hat. Ein Shared-Token oder ein aufgelöster Device-Token unterdrückt ihn.
  - Die automatische Hochstufung eines gespeicherten Device-Tokens beim einmaligen
    Retry `AUTH_TOKEN_MISMATCH` ist auf **nur vertrauenswürdige Endpunkte** beschränkt —
    Loopback oder `wss://` mit gepinntem `tlsFingerprint`. Öffentliches `wss://`
    ohne Pinning qualifiziert sich nicht.
- Zusätzliche Einträge in `hello-ok.auth.deviceTokens` sind Bootstrap-Handoff-Tokens.
  Speichern Sie sie nur, wenn die Verbindung Bootstrap-Auth auf einem vertrauenswürdigen Transport
  wie `wss://` oder Loopback/lokales Pairing verwendet hat.
- Wenn ein Client einen **expliziten** `deviceToken` oder explizite `scopes` angibt, bleibt dieser
  vom Aufrufer angeforderte Scope-Satz maßgeblich; zwischengespeicherte Scopes werden nur
  wiederverwendet, wenn der Client den gespeicherten gerätebezogenen Token erneut verwendet.
- Device-Tokens können über `device.token.rotate` und
  `device.token.revoke` rotiert/widerrufen werden (erfordert Scope `operator.pairing`).
- Token-Ausstellung/-Rotation bleibt auf den genehmigten Rollensatz begrenzt, der im
  Pairing-Eintrag dieses Geräts gespeichert ist; durch Rotieren eines Tokens kann das Gerät nicht auf eine
  Rolle erweitert werden, die bei der Pairing-Genehmigung nie gewährt wurde.
- Für Sitzungen mit gepaarten Device-Tokens ist die Geräteverwaltung selbstbegrenzt, sofern der
  Aufrufer nicht zusätzlich `operator.admin` hat: Nicht-Admin-Aufrufer können nur
  ihren **eigenen** Geräteeintrag entfernen/widerrufen/rotieren.
- `device.token.rotate` prüft den angeforderten Operator-Scope-Satz außerdem gegen die
  aktuellen Sitzungsscopes des Aufrufers. Nicht-Admin-Aufrufer können einen Token nicht in
  einen breiteren Operator-Scope-Satz rotieren, als sie bereits besitzen.
- Auth-Fehler enthalten `error.details.code` plus Hinweise zur Wiederherstellung:
  - `error.details.canRetryWithDeviceToken` (boolesch)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Client-Verhalten für `AUTH_TOKEN_MISMATCH`:
  - Vertrauenswürdige Clients dürfen einen begrenzten Retry mit einem zwischengespeicherten gerätebezogenen Token versuchen.
  - Wenn dieser Retry fehlschlägt, sollten Clients automatische Reconnect-Schleifen stoppen und Hinweise für Operator-Aktionen anzeigen.

## Geräteidentität + Pairing

- Nodes sollten eine stabile Geräteidentität (`device.id`) einschließen, die aus dem
  Fingerabdruck eines Schlüsselpaares abgeleitet ist.
- Gateways stellen Tokens pro Gerät + Rolle aus.
- Pairing-Genehmigungen sind für neue Geräte-IDs erforderlich, sofern lokale Auto-Genehmigung
  nicht aktiviert ist.
- Die Auto-Genehmigung für Pairing ist auf direkte lokale Loopback-Verbindungen ausgerichtet.
- OpenClaw hat außerdem einen engen backend-/containerlokalen Self-Connect-Pfad für
  vertrauenswürdige Helper-Flows mit Shared Secret.
- Tailnet- oder LAN-Verbindungen auf demselben Host werden für Pairing weiterhin als remote behandelt und
  erfordern Genehmigung.
- Alle WS-Clients müssen während `connect` eine `device`-Identität einschließen (operator + node).
  Control UI kann sie nur in diesen Modi weglassen:
  - `gateway.controlUi.allowInsecureAuth=true` für localhost-only-Kompatibilität mit unsicherem HTTP.
  - erfolgreiche Operator-Control-UI-Auth mit `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (Break-Glass, schwerwiegende Sicherheitsabsenkung).
- Alle Verbindungen müssen die vom Server bereitgestellte Nonce von `connect.challenge` signieren.

### Diagnosen für die Migration der Geräteauthentifizierung

Für Legacy-Clients, die weiterhin das Signaturverhalten vor der Challenge verwenden, gibt `connect` jetzt
Codes `DEVICE_AUTH_*` unter `error.details.code` mit einem stabilen `error.details.reason` zurück.

Häufige Migrationsfehler:

| Meldung                     | details.code                     | details.reason           | Bedeutung                                                   |
| --------------------------- | -------------------------------- | ------------------------ | ----------------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client hat `device.nonce` ausgelassen (oder leer gesendet). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client hat mit einer veralteten/falschen Nonce signiert.    |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signatur-Payload stimmt nicht mit der v2-Payload überein.   |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Signierter Zeitstempel liegt außerhalb der erlaubten Toleranz. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` stimmt nicht mit dem Fingerabdruck des Public Key überein. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public-Key-Format/Kanonisierung fehlgeschlagen.             |

Migrationsziel:

- Immer auf `connect.challenge` warten.
- Die v2-Payload signieren, die die Server-Nonce enthält.
- Dieselbe Nonce in `connect.params.device.nonce` senden.
- Die bevorzugte Signatur-Payload ist `v3`, die zusätzlich zu device/client/role/scopes/token/nonce-Feldern auch `platform` und `deviceFamily` bindet.
- Legacy-`v2`-Signaturen werden aus Kompatibilitätsgründen weiterhin akzeptiert, aber das Pinning von Metadaten gepaarter Geräte steuert weiterhin die Command-Richtlinie bei erneuten Verbindungen.

## TLS + Pinning

- TLS wird für WS-Verbindungen unterstützt.
- Clients können optional den Fingerabdruck des Gateway-Zertifikats pinnen (siehe `gateway.tls`-
  Konfiguration plus `gateway.remote.tlsFingerprint` oder CLI `--tls-fingerprint`).

## Umfang

Dieses Protokoll stellt die **vollständige Gateway-API** bereit (status, channels, models, chat,
agent, sessions, nodes, approvals usw.). Die genaue Oberfläche wird durch die
TypeBox-Schemas in `src/gateway/protocol/schema.ts` definiert.
