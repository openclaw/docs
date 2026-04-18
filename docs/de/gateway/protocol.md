---
read_when:
    - Implementieren oder Aktualisieren von Gateway-WS-Clients
    - Debuggen von Protokollabweichungen oder Verbindungsfehlern
    - Erneutes Generieren von Protokollschema/-modellen
summary: 'Gateway-WebSocket-Protokoll: Handshake, Frames, Versionierung'
title: Gateway-Protokoll
x-i18n:
    generated_at: "2026-04-18T06:12:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f0eebcfdd8c926c90b4753a6d96c59e3134ddb91740f65478f11eb75be85e41
    source_path: gateway/protocol.md
    workflow: 15
---

# Gateway-Protokoll (WebSocket)

Das Gateway-WS-Protokoll ist die **einzige Kontrollebene + der einzige Node-Transport** für
OpenClaw. Alle Clients (CLI, Web-UI, macOS-App, iOS/Android-Nodes, Headless-
Nodes) verbinden sich über WebSocket und deklarieren ihre **Rolle** + ihren **Geltungsbereich** beim
Handshake.

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

`server`, `features`, `snapshot` und `policy` sind laut Schema
(`src/gateway/protocol/schema/frames.ts`) alle erforderlich. `canvasHostUrl` ist optional. `auth`
meldet die ausgehandelte Rolle/die ausgehandelten Geltungsbereiche, wenn verfügbar, und enthält `deviceToken`,
wenn das Gateway eines ausstellt.

Wenn kein Device-Token ausgestellt wird, kann `hello-ok.auth` trotzdem die ausgehandelten
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

Für den integrierten Node/Operator-Bootstrap-Ablauf bleibt das primäre Node-Token bei
`scopes: []`, und jedes übergebene Operator-Token bleibt auf die Bootstrap-
Operator-Allowlist begrenzt (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Bootstrap-Geltungsbereichsprüfungen bleiben
rollenpräfixiert: Operator-Einträge erfüllen nur Operator-Anfragen, und Nicht-Operator-
Rollen benötigen weiterhin Geltungsbereiche unter ihrem eigenen Rollenpräfix.

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

Methoden mit Nebeneffekten erfordern **Idempotenzschlüssel** (siehe Schema).

## Rollen + Geltungsbereiche

### Rollen

- `operator` = Kontrollebenen-Client (CLI/UI/Automatisierung).
- `node` = Fähigkeits-Host (camera/screen/canvas/system.run).

### Geltungsbereiche (Operator)

Häufige Geltungsbereiche:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` mit `includeSecrets: true` erfordert `operator.talk.secrets`
(oder `operator.admin`).

Von Plugins registrierte Gateway-RPC-Methoden können ihren eigenen Operator-Geltungsbereich anfordern, aber
reservierte zentrale Admin-Präfixe (`config.*`, `exec.approvals.*`, `wizard.*`,
`update.*`) werden immer zu `operator.admin` aufgelöst.

Der Methodengeltungsbereich ist nur die erste Hürde. Einige Slash-Befehle, die über
`chat.send` erreicht werden, wenden darüber hinaus strengere Prüfungen auf Befehlsebene an. Zum Beispiel erfordern
persistente Schreibvorgänge mit `/config set` und `/config unset` `operator.admin`.

`node.pair.approve` hat zusätzlich zur
Basis-Methodenprüfung noch eine zusätzliche Geltungsbereichsprüfung zur Genehmigungszeit:

- Anfragen ohne Befehle: `operator.pairing`
- Anfragen mit Nicht-Exec-Node-Befehlen: `operator.pairing` + `operator.write`
- Anfragen, die `system.run`, `system.run.prepare` oder `system.which` enthalten:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (Node)

Nodes deklarieren Fähigkeitsansprüche bei `connect`:

- `caps`: Kategorien auf hoher Ebene für Fähigkeiten.
- `commands`: Allowlist für Befehle bei `invoke`.
- `permissions`: granulare Schalter (z. B. `screen.record`, `camera.capture`).

Das Gateway behandelt diese als **Ansprüche** und erzwingt serverseitige Allowlists.

## Presence

- `system-presence` gibt Einträge zurück, die nach Geräteidentität verschlüsselt sind.
- Presence-Einträge enthalten `deviceId`, `roles` und `scopes`, damit UIs eine einzelne Zeile pro Gerät anzeigen können,
  auch wenn es sowohl als **operator** als auch als **node** verbunden ist.

## Häufige RPC-Methodenfamilien

Diese Seite ist kein generierter vollständiger Dump, aber die öffentliche WS-Oberfläche ist umfangreicher
als die Handshake-/Auth-Beispiele oben. Dies sind die wichtigsten Methodenfamilien, die das
Gateway derzeit bereitstellt.

`hello-ok.features.methods` ist eine konservative Discovery-Liste, die aus
`src/gateway/server-methods-list.ts` plus geladenen Methodenexporten von Plugins/Kanälen erstellt wird.
Behandle sie als Funktions-Discovery, nicht als generierten Dump jeder aufrufbaren Hilfsfunktion,
die in `src/gateway/server-methods/*.ts` implementiert ist.

### System und Identität

- `health` gibt den gecachten oder frisch geprüften Gateway-Health-Snapshot zurück.
- `status` gibt die Gateway-Zusammenfassung im Stil von `/status` zurück; sensible Felder werden
  nur für operator-Clients mit Admin-Geltungsbereich einbezogen.
- `gateway.identity.get` gibt die Gateway-Geräteidentität zurück, die für Relay- und
  Pairing-Abläufe verwendet wird.
- `system-presence` gibt den aktuellen Presence-Snapshot für verbundene
  Operator-/Node-Geräte zurück.
- `system-event` hängt ein Systemereignis an und kann den Presence-
  Kontext aktualisieren/übertragen.
- `last-heartbeat` gibt das zuletzt persistierte Heartbeat-Ereignis zurück.
- `set-heartbeats` schaltet die Heartbeat-Verarbeitung auf dem Gateway um.

### Modelle und Nutzung

- `models.list` gibt den zur Laufzeit zulässigen Modellkatalog zurück.
- `usage.status` gibt Zusammenfassungen zu Nutzungsfenstern/verbleibendem Kontingent des Providers zurück.
- `usage.cost` gibt aggregierte Zusammenfassungen der Kostennutzung für einen Datumsbereich zurück.
- `doctor.memory.status` gibt den Bereitschaftsstatus von Vektorspeicher/Einbettungen für den
  aktiven Standard-Agent-Workspace zurück.
- `sessions.usage` gibt Nutzungszusammenfassungen pro Sitzung zurück.
- `sessions.usage.timeseries` gibt Zeitreihennutzung für eine Sitzung zurück.
- `sessions.usage.logs` gibt Nutzungslokaleinträge für eine Sitzung zurück.

### Kanäle und Login-Hilfen

- `channels.status` gibt Statuszusammenfassungen für integrierte und gebündelte Kanäle/Plugins zurück.
- `channels.logout` meldet ein bestimmtes Kanal-/Konto ab, wenn der Kanal
  Logout unterstützt.
- `web.login.start` startet einen QR-/Web-Login-Ablauf für den aktuellen QR-fähigen Web-
  Kanal-Provider.
- `web.login.wait` wartet darauf, dass dieser QR-/Web-Login-Ablauf abgeschlossen wird, und startet bei
  Erfolg den Kanal.
- `push.test` sendet einen APNs-Test-Push an einen registrierten iOS-Node.
- `voicewake.get` gibt die gespeicherten Wake-Word-Trigger zurück.
- `voicewake.set` aktualisiert Wake-Word-Trigger und überträgt die Änderung.

### Nachrichten und Logs

- `send` ist die direkte Outbound-Delivery-RPC für Kanal-/Konto-/Thread-zielgerichtete
  Sendevorgänge außerhalb des Chat-Runners.
- `logs.tail` gibt den konfigurierten Gateway-Dateilog-Tail mit Cursor/Limit und
  Steuerelementen für maximale Bytes zurück.

### Talk und TTS

- `talk.config` gibt die effektive Talk-Konfigurations-Payload zurück; `includeSecrets`
  erfordert `operator.talk.secrets` (oder `operator.admin`).
- `talk.mode` setzt/überträgt den aktuellen Talk-Modus-Zustand für WebChat-/Control-UI-
  Clients.
- `talk.speak` synthetisiert Sprache über den aktiven Talk-Sprach-Provider.
- `tts.status` gibt den Aktivierungsstatus von TTS, den aktiven Provider, Fallback-Provider
  und den Provider-Konfigurationsstatus zurück.
- `tts.providers` gibt das sichtbare TTS-Provider-Inventar zurück.
- `tts.enable` und `tts.disable` schalten den TTS-Präferenzstatus um.
- `tts.setProvider` aktualisiert den bevorzugten TTS-Provider.
- `tts.convert` führt eine einmalige Text-zu-Sprache-Konvertierung aus.

### Secrets, Konfiguration, Update und Assistent

- `secrets.reload` löst aktive SecretRefs erneut auf und tauscht den Laufzeit-Secret-Status
  nur bei vollständigem Erfolg aus.
- `secrets.resolve` löst zielgerichtete Secret-Zuweisungen für einen bestimmten
  Befehl/Zielsatz auf.
- `config.get` gibt den aktuellen Konfigurations-Snapshot und Hash zurück.
- `config.set` schreibt eine validierte Konfigurations-Payload.
- `config.patch` führt ein Merge eines partiellen Konfigurations-Updates aus.
- `config.apply` validiert und ersetzt die vollständige Konfigurations-Payload.
- `config.schema` gibt die Live-Konfigurationsschema-Payload zurück, die von Control UI und
  CLI-Tooling verwendet wird: Schema, `uiHints`, Version und Generierungsmetadaten, einschließlich
  Plugin- und Kanal-Schema-Metadaten, wenn die Laufzeit sie laden kann. Das Schema
  enthält Feldmetadaten `title` / `description`, die von denselben Labels
  und Hilfetexten abgeleitet werden, die von der UI verwendet werden, einschließlich verschachtelter Objekt-,
  Wildcard-, Array-Item- und `anyOf` / `oneOf` / `allOf`-Verzweigungen für Zusammensetzungen,
  wenn passende Felddokumentation vorhanden ist.
- `config.schema.lookup` gibt eine pfadbezogene Lookup-Payload für einen Konfigurationspfad zurück:
  normalisierter Pfad, ein flacher Schemaknoten, ein abgeglichener Hinweis + `hintPath` und
  Zusammenfassungen unmittelbarer untergeordneter Elemente für Drill-downs in UI/CLI.
  - Lookup-Schemaknoten behalten die benutzerorientierte Dokumentation und gängige Validierungsfelder:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    numerische/String-/Array-/Objektgrenzen und boolesche Flags wie
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Zusammenfassungen untergeordneter Elemente stellen `key`, normalisierten `path`, `type`, `required`,
    `hasChildren` sowie den abgeglichenen `hint` / `hintPath` bereit.
- `update.run` führt den Gateway-Update-Ablauf aus und plant einen Neustart nur dann,
  wenn das Update selbst erfolgreich war.
- `wizard.start`, `wizard.next`, `wizard.status` und `wizard.cancel` stellen den
  Onboarding-Assistenten über WS-RPC bereit.

### Vorhandene große Familien

#### Agent- und Workspace-Hilfen

- `agents.list` gibt konfigurierte Agent-Einträge zurück.
- `agents.create`, `agents.update` und `agents.delete` verwalten Agent-Datensätze und
  Workspace-Verkabelung.
- `agents.files.list`, `agents.files.get` und `agents.files.set` verwalten die
  exponierten Bootstrap-Workspace-Dateien für einen Agenten.
- `agent.identity.get` gibt die effektive Assistant-Identität für einen Agenten oder
  eine Sitzung zurück.
- `agent.wait` wartet darauf, dass ein Lauf abgeschlossen wird, und gibt den terminalen Snapshot zurück, wenn
  verfügbar.

#### Sitzungssteuerung

- `sessions.list` gibt den aktuellen Sitzungsindex zurück.
- `sessions.subscribe` und `sessions.unsubscribe` schalten Abonnements für Sitzungsänderungsereignisse
  für den aktuellen WS-Client um.
- `sessions.messages.subscribe` und `sessions.messages.unsubscribe` schalten
  Abonnements für Transkript-/Nachrichtenereignisse für eine Sitzung um.
- `sessions.preview` gibt begrenzte Transkriptvorschauen für bestimmte Sitzungs-
  Schlüssel zurück.
- `sessions.resolve` löst ein Sitzungsziel auf oder kanonisiert es.
- `sessions.create` erstellt einen neuen Sitzungseintrag.
- `sessions.send` sendet eine Nachricht in eine bestehende Sitzung.
- `sessions.steer` ist die Interrupt-und-Steuern-Variante für eine aktive Sitzung.
- `sessions.abort` bricht aktive Arbeit für eine Sitzung ab.
- `sessions.patch` aktualisiert Sitzungsmetadaten/-überschreibungen.
- `sessions.reset`, `sessions.delete` und `sessions.compact` führen Sitzungs-
  Wartung aus.
- `sessions.get` gibt die vollständige gespeicherte Sitzungszeile zurück.
- Die Chat-Ausführung verwendet weiterhin `chat.history`, `chat.send`, `chat.abort` und
  `chat.inject`.
- `chat.history` ist für UI-Clients anzeigennormalisiert: Inline-Direktiv-Tags werden
  aus sichtbarem Text entfernt, XML-Payloads für Tool-Aufrufe im Klartext (einschließlich
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und
  abgeschnittener Tool-Call-Blöcke) sowie durchgesickerte ASCII-/Vollbreiten-
  Modell-Steuertokens werden entfernt, reine stille-Token-Assistant-Zeilen wie exaktes `NO_REPLY` /
  `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden.

#### Geräte-Pairing und Geräte-Tokens

- `device.pair.list` gibt ausstehende und genehmigte gepairte Geräte zurück.
- `device.pair.approve`, `device.pair.reject` und `device.pair.remove` verwalten
  Datensätze für Geräte-Pairing.
- `device.token.rotate` rotiert ein gepaartes Geräte-Token innerhalb seiner genehmigten Rollen-
  und Geltungsbereichsgrenzen.
- `device.token.revoke` widerruft ein gepaartes Geräte-Token.

#### Node-Pairing, Invoke und ausstehende Arbeit

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` und `node.pair.verify` decken Node-Pairing und Bootstrap-
  Verifizierung ab.
- `node.list` und `node.describe` geben den bekannten/verbundenen Node-Status zurück.
- `node.rename` aktualisiert ein Label für einen gepaarten Node.
- `node.invoke` leitet einen Befehl an einen verbundenen Node weiter.
- `node.invoke.result` gibt das Ergebnis für eine Invoke-Anfrage zurück.
- `node.event` transportiert von Nodes ausgehende Ereignisse zurück ins Gateway.
- `node.canvas.capability.refresh` aktualisiert bereichsbezogene Canvas-Fähigkeitstokens.
- `node.pending.pull` und `node.pending.ack` sind die Queue-APIs für verbundene Nodes.
- `node.pending.enqueue` und `node.pending.drain` verwalten dauerhafte ausstehende Arbeit
  für offline/getrennte Nodes.

#### Genehmigungsfamilien

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` und
  `exec.approval.resolve` decken einmalige Exec-Genehmigungsanfragen sowie ausstehende
  Genehmigungssuche/-wiedergabe ab.
- `exec.approval.waitDecision` wartet auf eine ausstehende Exec-Genehmigung und gibt
  die endgültige Entscheidung zurück (oder `null` bei Zeitüberschreitung).
- `exec.approvals.get` und `exec.approvals.set` verwalten Snapshots der Gateway-Exec-
  Genehmigungsrichtlinie.
- `exec.approvals.node.get` und `exec.approvals.node.set` verwalten die Node-lokale Exec-
  Genehmigungsrichtlinie über Node-Relay-Befehle.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` und `plugin.approval.resolve` decken
  von Plugins definierte Genehmigungsabläufe ab.

#### Andere große Familien

- Automatisierung:
  - `wake` plant eine sofortige oder beim nächsten Heartbeat erfolgende Wake-Text-Injektion
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/Tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Häufige Ereignisfamilien

- `chat`: UI-Chat-Updates wie `chat.inject` und andere nur das Transkript betreffende Chat-
  Ereignisse.
- `session.message` und `session.tool`: Updates des Transkripts/Ereignisstreams für eine
  abonnierte Sitzung.
- `sessions.changed`: Sitzungsindex oder Metadaten wurden geändert.
- `presence`: Updates des System-Presence-Snapshots.
- `tick`: periodisches Keepalive-/Liveness-Ereignis.
- `health`: Update des Gateway-Health-Snapshots.
- `heartbeat`: Update des Heartbeat-Ereignisstreams.
- `cron`: Änderungsereignis für Cron-Lauf/Job.
- `shutdown`: Benachrichtigung über Gateway-Shutdown.
- `node.pair.requested` / `node.pair.resolved`: Lebenszyklus des Node-Pairings.
- `node.invoke.request`: Broadcast einer Node-Invoke-Anfrage.
- `device.pair.requested` / `device.pair.resolved`: Lebenszyklus gepaarter Geräte.
- `voicewake.changed`: Konfiguration der Wake-Word-Trigger wurde geändert.
- `exec.approval.requested` / `exec.approval.resolved`: Lebenszyklus der Exec-
  Genehmigung.
- `plugin.approval.requested` / `plugin.approval.resolved`: Lebenszyklus der Plugin-
  Genehmigung.

### Node-Hilfsmethoden

- Nodes können `skills.bins` aufrufen, um die aktuelle Liste der ausführbaren Skill-Dateien
  für Auto-Allow-Prüfungen abzurufen.

### Operator-Hilfsmethoden

- Operatoren können `commands.list` (`operator.read`) aufrufen, um das Laufzeit-
  Befehlsinventar für einen Agenten abzurufen.
  - `agentId` ist optional; lasse es weg, um den Standard-Agent-Workspace zu lesen.
  - `scope` steuert, auf welche Oberfläche sich der primäre `name` bezieht:
    - `text` gibt das primäre Text-Befehlstoken ohne führendes `/` zurück
    - `native` und der Standardpfad `both` geben providerbewusste native Namen
      zurück, wenn verfügbar
  - `textAliases` enthält exakte Slash-Aliasse wie `/model` und `/m`.
  - `nativeName` enthält den providerbewussten nativen Befehlsnamen, wenn ein solcher existiert.
  - `provider` ist optional und beeinflusst nur native Benennung sowie native Plugin-
    Befehlsverfügbarkeit.
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
    vom Aufrufer bereitgestellten Auth- oder Delivery-Kontext zu akzeptieren.
  - Die Antwort ist sitzungsbezogen und spiegelt wider, was die aktive Unterhaltung derzeit verwenden kann,
    einschließlich Core-, Plugin- und Channel-Tools.
- Operatoren können `skills.status` (`operator.read`) aufrufen, um das sichtbare
  Skill-Inventar für einen Agenten abzurufen.
  - `agentId` ist optional; lasse es weg, um den Standard-Agent-Workspace zu lesen.
  - Die Antwort enthält Eignung, fehlende Anforderungen, Konfigurationsprüfungen und
    bereinigte Installationsoptionen, ohne rohe Secret-Werte offenzulegen.
- Operatoren können `skills.search` und `skills.detail` (`operator.read`) für
  ClawHub-Discovery-Metadaten aufrufen.
- Operatoren können `skills.install` (`operator.admin`) in zwei Modi aufrufen:
  - ClawHub-Modus: `{ source: "clawhub", slug, version?, force? }` installiert einen
    Skill-Ordner in das Verzeichnis `skills/` des Standard-Agent-Workspaces.
  - Gateway-Installer-Modus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    führt eine deklarierte `metadata.openclaw.install`-Aktion auf dem Gateway-Host aus.
- Operatoren können `skills.update` (`operator.admin`) in zwei Modi aufrufen:
  - Der ClawHub-Modus aktualisiert einen verfolgten Slug oder alle verfolgten ClawHub-Installationen im
    Standard-Agent-Workspace.
  - Der Konfigurationsmodus patched Werte unter `skills.entries.<skillKey>` wie `enabled`,
    `apiKey` und `env`.

## Exec-Genehmigungen

- Wenn eine Exec-Anfrage genehmigt werden muss, sendet das Gateway `exec.approval.requested`.
- Operator-Clients lösen dies durch Aufruf von `exec.approval.resolve` (erfordert den Geltungsbereich `operator.approvals`).
- Für `host=node` muss `exec.approval.request` `systemRunPlan` enthalten (kanonische `argv`/`cwd`/`rawCommand`/Sitzungsmetadaten). Anfragen ohne `systemRunPlan` werden abgelehnt.
- Nach der Genehmigung verwenden weitergeleitete `node.invoke system.run`-Aufrufe dieses kanonische
  `systemRunPlan` erneut als maßgeblichen Befehl-/cwd-/Sitzungskontext.
- Wenn ein Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` zwischen der Vorbereitung und der endgültigen genehmigten `system.run`-Weiterleitung verändert, lehnt das
  Gateway den Lauf ab, statt der veränderten Payload zu vertrauen.

## Fallback für Agent-Delivery

- `agent`-Anfragen können `deliver=true` enthalten, um Outbound-Delivery anzufordern.
- `bestEffortDeliver=false` behält striktes Verhalten bei: nicht auflösbare oder nur intern nutzbare Delivery-Ziele geben `INVALID_REQUEST` zurück.
- `bestEffortDeliver=true` erlaubt einen Fallback auf reine Sitzungsausführung, wenn keine externe zustellbare Route aufgelöst werden kann (zum Beispiel interne/WebChat-Sitzungen oder mehrdeutige Multi-Channel-Konfigurationen).

## Versionierung

- `PROTOCOL_VERSION` befindet sich in `src/gateway/protocol/schema/protocol-schemas.ts`.
- Clients senden `minProtocol` + `maxProtocol`; der Server lehnt Abweichungen ab.
- Schemas + Modelle werden aus TypeBox-Definitionen generiert:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Client-Konstanten

Der Referenzclient in `src/gateway/client.ts` verwendet diese Standardwerte. Die Werte sind
über Protokoll-v3 hinweg stabil und bilden die erwartete Basis für Drittanbieter-Clients.

| Konstante                                 | Standardwert                                          | Quelle                                                     |
| ----------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `3`                                                   | `src/gateway/protocol/schema/protocol-schemas.ts`          |
| Anforderungs-Timeout (pro RPC)            | `30_000` ms                                           | `src/gateway/client.ts` (`requestTimeoutMs`)               |
| Preauth-/Connect-Challenge-Timeout        | `10_000` ms                                           | `src/gateway/handshake-timeouts.ts` (Clamp `250`–`10_000`) |
| Initialer Reconnect-Backoff               | `1_000` ms                                            | `src/gateway/client.ts` (`backoffMs`)                      |
| Maximaler Reconnect-Backoff               | `30_000` ms                                           | `src/gateway/client.ts` (`scheduleReconnect`)              |
| Fast-Retry-Clamp nach Device-Token-Close  | `250` ms                                              | `src/gateway/client.ts`                                    |
| Force-Stop-Schonfrist vor `terminate()`   | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                            |
| Standard-Timeout für `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                 |
| Standard-Tick-Intervall (vor `hello-ok`)  | `30_000` ms                                           | `src/gateway/client.ts`                                    |
| Tick-Timeout-Close                        | Code `4000`, wenn Stille `tickIntervalMs * 2` überschreitet | `src/gateway/client.ts`                               |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                          |

Der Server kündigt das effektive `policy.tickIntervalMs`, `policy.maxPayload`
und `policy.maxBufferedBytes` in `hello-ok` an; Clients sollten diese Werte
statt der Standardwerte vor dem Handshake beachten.

## Auth

- Shared-Secret-Gateway-Auth verwendet `connect.params.auth.token` oder
  `connect.params.auth.password`, abhängig vom konfigurierten Auth-Modus.
- Identitätstragende Modi wie Tailscale Serve
  (`gateway.auth.allowTailscale: true`) oder nicht-loopback
  `gateway.auth.mode: "trusted-proxy"` erfüllen die Connect-Auth-Prüfung über
  Request-Header statt über `connect.params.auth.*`.
- `gateway.auth.mode: "none"` für privaten Ingress überspringt Shared-Secret-Connect-Auth
  vollständig; diesen Modus nicht auf öffentlichem/nicht vertrauenswürdigem Ingress bereitstellen.
- Nach dem Pairing stellt das Gateway ein **Geräte-Token** aus, das auf die Verbindungs-
  Rolle + Geltungsbereiche beschränkt ist. Es wird in `hello-ok.auth.deviceToken` zurückgegeben und
  sollte vom Client für zukünftige Verbindungen persistiert werden.
- Clients sollten das primäre `hello-ok.auth.deviceToken` nach jeder
  erfolgreichen Verbindung persistieren.
- Beim Wiederverbinden mit diesem **gespeicherten** Geräte-Token sollte auch der gespeicherte
  genehmigte Geltungsbereichssatz für dieses Token wiederverwendet werden. Dadurch bleibt bereits gewährter
  Lese-/Probe-/Status-Zugriff erhalten und es wird vermieden, dass Wiederverbindungen stillschweigend auf einen
  engeren impliziten Admin-only-Geltungsbereich zusammenfallen.
- Client-seitige Zusammenstellung der Connect-Auth (`selectConnectAuth` in
  `src/gateway/client.ts`):
  - `auth.password` ist orthogonal und wird immer weitergeleitet, wenn es gesetzt ist.
  - `auth.token` wird in folgender Prioritätsreihenfolge befüllt: zuerst explizites Shared-Token,
    dann ein explizites `deviceToken`, dann ein gespeichertes gerätespezifisches Token (indiziert nach
    `deviceId` + `role`).
  - `auth.bootstrapToken` wird nur gesendet, wenn keines der oben genannten ein
    `auth.token` aufgelöst hat. Ein Shared-Token oder ein aufgelöstes Geräte-Token unterdrückt es.
  - Die automatische Hochstufung eines gespeicherten Geräte-Tokens beim einmaligen
    `AUTH_TOKEN_MISMATCH`-Retry ist auf **nur vertrauenswürdige Endpunkte** beschränkt —
    loopback oder `wss://` mit angeheftetem `tlsFingerprint`. Öffentliches `wss://`
    ohne Pinning qualifiziert sich nicht.
- Zusätzliche Einträge in `hello-ok.auth.deviceTokens` sind Bootstrap-Handoff-Tokens.
  Persistiere sie nur, wenn die Verbindung Bootstrap-Auth über einen vertrauenswürdigen Transport
  wie `wss://` oder loopback/local pairing verwendet hat.
- Wenn ein Client ein **explizites** `deviceToken` oder explizite `scopes` angibt, bleibt dieser
  vom Aufrufer angeforderte Geltungsbereichssatz maßgeblich; gecachte Geltungsbereiche werden nur
  wiederverwendet, wenn der Client das gespeicherte gerätespezifische Token wiederverwendet.
- Geräte-Tokens können über `device.token.rotate` und
  `device.token.revoke` rotiert/widerrufen werden (erfordert den Geltungsbereich `operator.pairing`).
- Ausgabe/Rotation von Tokens bleibt auf den genehmigten Rollensatz beschränkt, der im
  Pairing-Eintrag dieses Geräts gespeichert ist; das Rotieren eines Tokens kann das Gerät nicht in eine
  Rolle erweitern, die durch die Pairing-Genehmigung nie gewährt wurde.
- Für gepaarte Geräte-Token-Sitzungen ist die Geräteverwaltung auf das eigene Gerät beschränkt, es sei denn, der
  Aufrufer hat zusätzlich `operator.admin`: Nicht-Admin-Aufrufer können nur ihren **eigenen**
  Geräteeintrag entfernen/widerrufen/rotieren.
- `device.token.rotate` prüft außerdem den angeforderten Operator-Geltungsbereichssatz gegen die
  aktuellen Sitzungs-Geltungsbereiche des Aufrufers. Nicht-Admin-Aufrufer können ein Token nicht in einen
  weiter gefassten Operator-Geltungsbereichssatz rotieren, als sie bereits besitzen.
- Auth-Fehler enthalten `error.details.code` plus Hinweise zur Wiederherstellung:
  - `error.details.canRetryWithDeviceToken` (Boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Client-Verhalten für `AUTH_TOKEN_MISMATCH`:
  - Vertrauenswürdige Clients können einen begrenzten Retry mit einem gecachten gerätespezifischen Token versuchen.
  - Wenn dieser Retry fehlschlägt, sollten Clients automatische Wiederverbindungsschleifen beenden und Hinweise für Maßnahmen durch den Operator anzeigen.

## Geräteidentität + Pairing

- Nodes sollten eine stabile Geräteidentität (`device.id`) angeben, die von einem
  Schlüsselpaar-Fingerprint abgeleitet ist.
- Gateways stellen Tokens pro Gerät + Rolle aus.
- Pairing-Genehmigungen sind für neue Geräte-IDs erforderlich, es sei denn, lokale automatische Genehmigung
  ist aktiviert.
- Die automatische Pairing-Genehmigung ist auf direkte lokale loopback-Verbindungen ausgerichtet.
- OpenClaw hat außerdem einen engen Backend-/container-lokalen Self-Connect-Pfad für
  vertrauenswürdige Shared-Secret-Helferabläufe.
- Tailnet- oder LAN-Verbindungen auf demselben Host werden weiterhin als remote behandelt und
  erfordern Pairing-Genehmigung.
- Alle WS-Clients müssen beim `connect` die `device`-Identität angeben (operator + node).
  Control UI kann sie nur in diesen Modi weglassen:
  - `gateway.controlUi.allowInsecureAuth=true` für localhost-only inkompatible HTTP-Kompatibilität.
  - erfolgreiche `gateway.auth.mode: "trusted-proxy"`-Operator-Control-UI-Auth.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (Notfallmaßnahme, erhebliche Sicherheitsverschlechterung).
- Alle Verbindungen müssen die vom Server bereitgestellte `connect.challenge`-Nonce signieren.

### Migrationsdiagnosen für Geräte-Auth

Für Legacy-Clients, die weiterhin Verhalten mit Signierung vor der Challenge verwenden, gibt `connect` jetzt
`DEVICE_AUTH_*`-Detailcodes unter `error.details.code` mit einem stabilen `error.details.reason` zurück.

Häufige Migrationsfehler:

| Nachricht                   | details.code                     | details.reason           | Bedeutung                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client hat `device.nonce` weggelassen (oder leer gesendet). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client hat mit einer veralteten/falschen Nonce signiert. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Signatur-Payload stimmt nicht mit der v2-Payload überein. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Signierter Zeitstempel liegt außerhalb der zulässigen Abweichung. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` stimmt nicht mit dem Public-Key-Fingerprint überein. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Public-Key-Format/Kanonisierung ist fehlgeschlagen. |

Migrationsziel:

- Immer auf `connect.challenge` warten.
- Die v2-Payload signieren, die die Server-Nonce enthält.
- Dieselbe Nonce in `connect.params.device.nonce` senden.
- Bevorzugte Signatur-Payload ist `v3`, die zusätzlich zu device/client/role/scopes/token/nonce-Feldern auch `platform` und `deviceFamily` bindet.
- Legacy-`v2`-Signaturen bleiben aus Kompatibilitätsgründen akzeptiert, aber das Anheften gepaarter Geräte-
  Metadaten steuert weiterhin die Befehlsrichtlinie bei Wiederverbindungen.

## TLS + Pinning

- TLS wird für WS-Verbindungen unterstützt.
- Clients können optional den Gateway-Zertifikats-Fingerprint anheften (siehe `gateway.tls`-
  Konfiguration plus `gateway.remote.tlsFingerprint` oder CLI `--tls-fingerprint`).

## Geltungsbereich

Dieses Protokoll stellt die **vollständige Gateway-API** bereit (Status, Kanäle, Modelle, Chat,
Agent, Sitzungen, Nodes, Genehmigungen usw.). Die genaue Oberfläche ist durch die
TypeBox-Schemas in `src/gateway/protocol/schema.ts` definiert.
