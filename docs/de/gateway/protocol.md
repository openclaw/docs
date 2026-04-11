---
read_when:
    - Implementieren oder Aktualisieren von Gateway-WS-Clients
    - Debuggen von Protokollabweichungen oder Verbindungsfehlern
    - Erneutes Generieren von Protokollschema/-modellen
summary: 'Gateway-WebSocket-Protokoll: Handshake, Frames, Versionierung'
title: Gateway-Protokoll
x-i18n:
    generated_at: "2026-04-11T02:44:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83c820c46d4803d571c770468fd6782619eaa1dca253e156e8087dec735c127f
    source_path: gateway/protocol.md
    workflow: 15
---

# Gateway-Protokoll (WebSocket)

Das Gateway-WS-Protokoll ist die **einzige Steuerungsebene + der Knotentransport** für
OpenClaw. Alle Clients (CLI, Web-UI, macOS-App, iOS-/Android-Knoten, headless
Knoten) verbinden sich über WebSocket und deklarieren ihre **Rolle** + ihren **Scope** zum
Zeitpunkt des Handshakes.

## Transport

- WebSocket, Text-Frames mit JSON-Payloads.
- Der erste Frame **muss** eine `connect`-Anfrage sein.

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
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

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

Während einer vertrauenswürdigen Bootstrap-Übergabe kann `hello-ok.auth` außerdem zusätzliche
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

Für den integrierten Bootstrap-Flow für Knoten/Operatoren bleibt das primäre Knotentoken bei
`scopes: []`, und jedes übergebene Operatortoken bleibt auf die Bootstrap-
Allowlist für Operatoren beschränkt (`operator.approvals`, `operator.read`,
`operator.talk.secrets`, `operator.write`). Prüfungen des Bootstrap-Scopes bleiben
rollenpräfixbasiert: Operatoreinträge erfüllen nur Operatoranfragen, und Nicht-Operator-
Rollen benötigen weiterhin Scopes unter ihrem eigenen Rollenpräfix.

### Knotenbeispiel

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

## Rollen + Scopes

### Rollen

- `operator` = Client der Steuerungsebene (CLI/UI/Automatisierung).
- `node` = Fähigkeits-Host (camera/screen/canvas/system.run).

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

Der Methodenscope ist nur die erste Hürde. Einige Slash-Befehle, die über
`chat.send` erreicht werden, wenden zusätzlich strengere Prüfungen auf Befehlsebene an. Zum Beispiel erfordern persistente
Schreibvorgänge mit `/config set` und `/config unset` `operator.admin`.

`node.pair.approve` hat zusätzlich zur
grundlegenden Methodenscope-Prüfung eine weitere Scope-Prüfung zum Zeitpunkt der Genehmigung:

- anfragelose Requests: `operator.pairing`
- Requests mit Nicht-Exec-Knotenbefehlen: `operator.pairing` + `operator.write`
- Requests, die `system.run`, `system.run.prepare` oder `system.which` enthalten:
  `operator.pairing` + `operator.admin`

### Caps/commands/permissions (node)

Knoten deklarieren ihre Fähigkeitsansprüche zum Zeitpunkt von `connect`:

- `caps`: übergeordnete Fähigkeitskategorien.
- `commands`: Allowlist von Befehlen für `invoke`.
- `permissions`: granulare Umschalter (z. B. `screen.record`, `camera.capture`).

Das Gateway behandelt diese als **Ansprüche** und erzwingt serverseitige Allowlists.

## Präsenz

- `system-presence` gibt Einträge zurück, die nach Geräteidentität gruppiert sind.
- Präsenzeinträge enthalten `deviceId`, `roles` und `scopes`, damit UIs eine einzelne Zeile pro Gerät anzeigen können,
  selbst wenn es sowohl als **operator** als auch als **node** verbunden ist.

## Häufige RPC-Methodenfamilien

Diese Seite ist kein vollständig generierter Dump, aber die öffentliche WS-Oberfläche ist breiter
als die oben gezeigten Handshake-/Auth-Beispiele. Dies sind die wichtigsten Methodenfamilien, die das
Gateway heute bereitstellt.

`hello-ok.features.methods` ist eine konservative Discovery-Liste, die aus
`src/gateway/server-methods-list.ts` plus geladenen Plugin-/Kanal-Methodenexporten erstellt wird.
Behandeln Sie sie als Feature-Erkennung, nicht als generierten Dump jeder aufrufbaren Hilfsfunktion,
die in `src/gateway/server-methods/*.ts` implementiert ist.

### System und Identität

- `health` gibt den gecachten oder frisch geprüften Gateway-Health-Snapshot zurück.
- `status` gibt die Gateway-Zusammenfassung im Stil von `/status` zurück; sensible Felder sind
  nur für Operator-Clients mit Admin-Scope enthalten.
- `gateway.identity.get` gibt die Gateway-Geräteidentität zurück, die von Relay- und
  Pairing-Flows verwendet wird.
- `system-presence` gibt den aktuellen Präsenz-Snapshot für verbundene
  Operator-/Knotengeräte zurück.
- `system-event` hängt ein Systemereignis an und kann den Präsenzkontext
  aktualisieren/übertragen.
- `last-heartbeat` gibt das zuletzt persistierte Heartbeat-Ereignis zurück.
- `set-heartbeats` schaltet die Heartbeat-Verarbeitung auf dem Gateway um.

### Modelle und Nutzung

- `models.list` gibt den zur Laufzeit erlaubten Modellkatalog zurück.
- `usage.status` gibt Zusammenfassungen von Provider-Nutzungsfenstern/verbleibender Quote zurück.
- `usage.cost` gibt aggregierte Kosten-Nutzungszusammenfassungen für einen Datumsbereich zurück.
- `doctor.memory.status` gibt die Bereitschaft von Vektorspeicher/Embeddings für den
  aktiven Standard-Agent-Workspace zurück.
- `sessions.usage` gibt Nutzungszusammenfassungen pro Sitzung zurück.
- `sessions.usage.timeseries` gibt Zeitreihen-Nutzungsdaten für eine Sitzung zurück.
- `sessions.usage.logs` gibt Nutzungseinträge für eine Sitzung zurück.

### Kanäle und Login-Helfer

- `channels.status` gibt Statuszusammenfassungen für integrierte und gebündelte Kanäle/Plugins zurück.
- `channels.logout` meldet einen bestimmten Kanal/ein bestimmtes Konto ab, wenn der Kanal
  Logout unterstützt.
- `web.login.start` startet einen QR-/Web-Login-Flow für den aktuellen QR-fähigen Web-
  Kanal-Provider.
- `web.login.wait` wartet auf den Abschluss dieses QR-/Web-Login-Flows und startet bei Erfolg den
  Kanal.
- `push.test` sendet einen Test-APNs-Push an einen registrierten iOS-Knoten.
- `voicewake.get` gibt die gespeicherten Wake-Word-Trigger zurück.
- `voicewake.set` aktualisiert Wake-Word-Trigger und überträgt die Änderung.

### Messaging und Logs

- `send` ist die direkte RPC für ausgehende Zustellung für auf Kanal/Konto/Thread ausgerichtete
  Sendungen außerhalb des Chat-Runners.
- `logs.tail` gibt den konfigurierten Gateway-Dateilog-Tail mit Cursor-/Limit- und
  Max-Byte-Steuerung zurück.

### Talk und TTS

- `talk.config` gibt die effektive Talk-Konfigurations-Payload zurück; `includeSecrets`
  erfordert `operator.talk.secrets` (oder `operator.admin`).
- `talk.mode` setzt/überträgt den aktuellen Zustand des Talk-Modus für WebChat-/Control-UI-
  Clients.
- `talk.speak` synthetisiert Sprache über den aktiven Talk-Sprachprovider.
- `tts.status` gibt den aktivierten TTS-Status, den aktiven Provider, Fallback-Provider
  und den Zustand der Provider-Konfiguration zurück.
- `tts.providers` gibt das sichtbare Inventar der TTS-Provider zurück.
- `tts.enable` und `tts.disable` schalten den TTS-Präferenzstatus um.
- `tts.setProvider` aktualisiert den bevorzugten TTS-Provider.
- `tts.convert` führt eine einmalige Text-zu-Sprache-Konvertierung aus.

### Secrets, Konfiguration, Update und Wizard

- `secrets.reload` löst aktive SecretRefs erneut auf und tauscht den Laufzeit-Secret-Status
  nur bei vollständigem Erfolg aus.
- `secrets.resolve` löst zielgerichtete Secret-Zuweisungen für einen bestimmten
  Befehl/Zielsatz auf.
- `config.get` gibt den aktuellen Konfigurations-Snapshot und Hash zurück.
- `config.set` schreibt eine validierte Konfigurations-Payload.
- `config.patch` führt eine teilweise Konfigurationsaktualisierung zusammen.
- `config.apply` validiert und ersetzt die vollständige Konfigurations-Payload.
- `config.schema` gibt die Live-Konfigurationsschema-Payload zurück, die von Control UI und
  CLI-Tooling verwendet wird: Schema, `uiHints`, Version und Generierungsmetadaten, einschließlich
  Plugin- und Kanalschema-Metadaten, wenn die Laufzeit sie laden kann. Das Schema
  enthält die Feldmetadaten `title` / `description`, die aus denselben Labels
  und Hilfetexten abgeleitet sind, die von der UI verwendet werden, einschließlich verschachtelter Objekt-,
  Wildcard-, Array-Item- und `anyOf` / `oneOf` / `allOf`-Kompositionszweige, wenn passende Felddokumentation vorhanden ist.
- `config.schema.lookup` gibt eine pfadbezogene Lookup-Payload für einen Konfigurationspfad zurück:
  normalisierter Pfad, ein flacher Schemaknoten, passender Hint + `hintPath` sowie
  Zusammenfassungen der unmittelbaren Kinder für UI-/CLI-Drill-down.
  - Lookup-Schemaknoten behalten die benutzerseitige Dokumentation und allgemeine Validierungsfelder:
    `title`, `description`, `type`, `enum`, `const`, `format`, `pattern`,
    numerische/String-/Array-/Objekt-Grenzen sowie boolesche Flags wie
    `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`.
  - Kindzusammenfassungen stellen `key`, normalisierten `path`, `type`, `required`,
    `hasChildren` sowie den passenden `hint` / `hintPath` bereit.
- `update.run` führt den Gateway-Update-Flow aus und plant einen Neustart nur dann,
  wenn das Update selbst erfolgreich war.
- `wizard.start`, `wizard.next`, `wizard.status` und `wizard.cancel` stellen den
  Onboarding-Wizard über WS RPC bereit.

### Bestehende große Familien

#### Agenten- und Workspace-Helfer

- `agents.list` gibt konfigurierte Agenteneinträge zurück.
- `agents.create`, `agents.update` und `agents.delete` verwalten Agentendatensätze und
  Workspace-Verdrahtung.
- `agents.files.list`, `agents.files.get` und `agents.files.set` verwalten die
  exponierten Bootstrap-Workspace-Dateien eines Agenten.
- `agent.identity.get` gibt die effektive Assistentenidentität für einen Agenten oder
  eine Sitzung zurück.
- `agent.wait` wartet darauf, dass ein Lauf abgeschlossen wird, und gibt den terminalen Snapshot zurück,
  wenn verfügbar.

#### Sitzungssteuerung

- `sessions.list` gibt den aktuellen Sitzungsindex zurück.
- `sessions.subscribe` und `sessions.unsubscribe` schalten Abonnements für Sitzungsänderungsereignisse
  für den aktuellen WS-Client ein bzw. aus.
- `sessions.messages.subscribe` und `sessions.messages.unsubscribe` schalten
  Protokoll-/Nachrichtenereignis-Abonnements für eine Sitzung ein bzw. aus.
- `sessions.preview` gibt begrenzte Protokollvorschauen für bestimmte Sitzungsschlüssel
  zurück.
- `sessions.resolve` löst ein Sitzungsziel auf oder kanonisiert es.
- `sessions.create` erstellt einen neuen Sitzungseintrag.
- `sessions.send` sendet eine Nachricht in eine bestehende Sitzung.
- `sessions.steer` ist die Interrupt-und-Steer-Variante für eine aktive Sitzung.
- `sessions.abort` bricht aktive Arbeit für eine Sitzung ab.
- `sessions.patch` aktualisiert Sitzungsmetadaten/-Überschreibungen.
- `sessions.reset`, `sessions.delete` und `sessions.compact` führen Sitzungs-
  Wartungsaufgaben aus.
- `sessions.get` gibt die vollständige gespeicherte Sitzungszeile zurück.
- Die Chat-Ausführung verwendet weiterhin `chat.history`, `chat.send`, `chat.abort` und
  `chat.inject`.
- `chat.history` ist für UI-Clients anzeige-normalisiert: Inline-Direktiv-Tags werden
  aus sichtbarem Text entfernt, XML-Payloads von Tool-Aufrufen im Klartext (einschließlich
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und
  abgeschnittener Tool-Call-Blöcke) sowie durchgesickerte ASCII-/Full-Width-
  Modellsteuerungstoken werden entfernt, reine stille-Token-Assistentenzeilen wie exakt `NO_REPLY` /
  `no_reply` werden ausgelassen, und übergroße Zeilen können durch Platzhalter ersetzt werden.

#### Geräte-Pairing und Gerätetoken

- `device.pair.list` gibt ausstehende und genehmigte gepaarte Geräte zurück.
- `device.pair.approve`, `device.pair.reject` und `device.pair.remove` verwalten
  Geräte-Pairing-Einträge.
- `device.token.rotate` rotiert ein gepaartes Gerätetoken innerhalb seiner genehmigten Rollen-
  und Scope-Grenzen.
- `device.token.revoke` widerruft ein gepaartes Gerätetoken.

#### Knoten-Pairing, Invoke und ausstehende Arbeit

- `node.pair.request`, `node.pair.list`, `node.pair.approve`,
  `node.pair.reject` und `node.pair.verify` decken Knoten-Pairing und Bootstrap-
  Verifizierung ab.
- `node.list` und `node.describe` geben den bekannten/verbundenen Knotenzustand zurück.
- `node.rename` aktualisiert eine Bezeichnung eines gepaarten Knotens.
- `node.invoke` leitet einen Befehl an einen verbundenen Knoten weiter.
- `node.invoke.result` gibt das Ergebnis für eine Invoke-Anfrage zurück.
- `node.event` überträgt von Knoten stammende Ereignisse zurück in das Gateway.
- `node.canvas.capability.refresh` aktualisiert bereichsbezogene Canvas-Fähigkeitstoken.
- `node.pending.pull` und `node.pending.ack` sind die Queue-APIs für verbundene Knoten.
- `node.pending.enqueue` und `node.pending.drain` verwalten dauerhafte ausstehende Arbeit
  für offline/getrennte Knoten.

#### Genehmigungsfamilien

- `exec.approval.request`, `exec.approval.get`, `exec.approval.list` und
  `exec.approval.resolve` decken einmalige Exec-Genehmigungsanfragen plus Nachschlagen/Wiederholen
  ausstehender Genehmigungen ab.
- `exec.approval.waitDecision` wartet auf eine ausstehende Exec-Genehmigung und gibt
  die endgültige Entscheidung zurück (oder `null` bei Zeitüberschreitung).
- `exec.approvals.get` und `exec.approvals.set` verwalten Gateway-Exec-Genehmigungs-
  Richtlinien-Snapshots.
- `exec.approvals.node.get` und `exec.approvals.node.set` verwalten knotenspezifische Exec-
  Genehmigungsrichtlinien über Knoten-Relay-Befehle.
- `plugin.approval.request`, `plugin.approval.list`,
  `plugin.approval.waitDecision` und `plugin.approval.resolve` decken
  plugin-definierte Genehmigungs-Flows ab.

#### Andere große Familien

- Automatisierung:
  - `wake` plant eine sofortige oder bei einem nächsten Heartbeat erfolgende Wake-Text-Injektion
  - `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`,
    `cron.run`, `cron.runs`
- Skills/Tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`

### Häufige Ereignisfamilien

- `chat`: UI-Chat-Updates wie `chat.inject` und andere reine Protokoll-Chat-
  Ereignisse.
- `session.message` und `session.tool`: Protokoll-/Ereignisstream-Updates für eine
  abonnierte Sitzung.
- `sessions.changed`: Sitzungsindex oder Metadaten haben sich geändert.
- `presence`: Snapshot-Aktualisierungen der Systempräsenz.
- `tick`: periodisches Keepalive-/Liveness-Ereignis.
- `health`: Gateway-Health-Snapshot-Aktualisierung.
- `heartbeat`: Aktualisierung des Heartbeat-Ereignisstreams.
- `cron`: Änderungsereignis für Cron-Lauf/-Job.
- `shutdown`: Gateway-Abschaltbenachrichtigung.
- `node.pair.requested` / `node.pair.resolved`: Lebenszyklus des Knoten-Pairings.
- `node.invoke.request`: Broadcast einer Knoten-Invoke-Anfrage.
- `device.pair.requested` / `device.pair.resolved`: Lebenszyklus gepaarter Geräte.
- `voicewake.changed`: Konfiguration von Wake-Word-Triggern wurde geändert.
- `exec.approval.requested` / `exec.approval.resolved`: Lebenszyklus der Exec-
  Genehmigung.
- `plugin.approval.requested` / `plugin.approval.resolved`: Lebenszyklus der Plugin-Genehmigung.

### Hilfsmethoden für Knoten

- Knoten können `skills.bins` aufrufen, um die aktuelle Liste ausführbarer Skills
  für Auto-Allow-Prüfungen abzurufen.

### Hilfsmethoden für Operatoren

- Operatoren können `commands.list` (`operator.read`) aufrufen, um das Laufzeit-
  Befehlsinventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agent-Workspace zu lesen.
  - `scope` steuert, welche Oberfläche vom primären `name` angesprochen wird:
    - `text` gibt das primäre Textbefehlstoken ohne führendes `/` zurück
    - `native` und der Standardpfad `both` geben providerbewusste native Namen
      zurück, wenn verfügbar
  - `textAliases` enthält exakte Slash-Aliasse wie `/model` und `/m`.
  - `nativeName` enthält den providerbewussten nativen Befehlsnamen, wenn einer existiert.
  - `provider` ist optional und beeinflusst nur native Benennung sowie die Verfügbarkeit
    nativer Plugin-Befehle.
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
    vom Aufrufer gelieferten Auth- oder Zustellungskontext zu akzeptieren.
  - Die Antwort ist sitzungsbezogen und spiegelt wider, was die aktive Unterhaltung derzeit nutzen kann,
    einschließlich Core-, Plugin- und Kanal-Tools.
- Operatoren können `skills.status` (`operator.read`) aufrufen, um das sichtbare
  Skill-Inventar für einen Agenten abzurufen.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agent-Workspace zu lesen.
  - Die Antwort enthält Eignung, fehlende Anforderungen, Konfigurationsprüfungen und
    bereinigte Installationsoptionen, ohne rohe Secret-Werte offenzulegen.
- Operatoren können `skills.search` und `skills.detail` (`operator.read`) für
  ClawHub-Discovery-Metadaten aufrufen.
- Operatoren können `skills.install` (`operator.admin`) in zwei Modi aufrufen:
  - ClawHub-Modus: `{ source: "clawhub", slug, version?, force? }` installiert einen
    Skill-Ordner in das `skills/`-Verzeichnis des Standard-Agent-Workspace.
  - Gateway-Installer-Modus: `{ name, installId, dangerouslyForceUnsafeInstall?, timeoutMs? }`
    führt eine deklarierte `metadata.openclaw.install`-Aktion auf dem Gateway-Host aus.
- Operatoren können `skills.update` (`operator.admin`) in zwei Modi aufrufen:
  - Der ClawHub-Modus aktualisiert einen verfolgten Slug oder alle verfolgten ClawHub-Installationen im
    Standard-Agent-Workspace.
  - Der Konfigurationsmodus patcht `skills.entries.<skillKey>`-Werte wie `enabled`,
    `apiKey` und `env`.

## Exec-Genehmigungen

- Wenn eine Exec-Anfrage eine Genehmigung benötigt, überträgt das Gateway `exec.approval.requested`.
- Operator-Clients lösen dies durch Aufruf von `exec.approval.resolve` auf (erfordert Scope `operator.approvals`).
- Für `host=node` muss `exec.approval.request` `systemRunPlan` enthalten (kanonische `argv`/`cwd`/`rawCommand`/Sitzungsmetadaten). Anfragen ohne `systemRunPlan` werden abgelehnt.
- Nach der Genehmigung verwenden weitergeleitete `node.invoke system.run`-Aufrufe dieses kanonische
  `systemRunPlan` als maßgeblichen Befehls-/cwd-/Sitzungskontext.
- Wenn ein Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` zwischen der Vorbereitung und der endgültigen genehmigten Weiterleitung von `system.run` verändert, lehnt das
  Gateway den Lauf ab, statt der veränderten Payload zu vertrauen.

## Agenten-Zustellungs-Fallback

- `agent`-Anfragen können `deliver=true` enthalten, um ausgehende Zustellung anzufordern.
- `bestEffortDeliver=false` behält striktes Verhalten bei: nicht auflösbare oder nur intern verfügbare Zustellungsziele geben `INVALID_REQUEST` zurück.
- `bestEffortDeliver=true` erlaubt Fallback auf reine Sitzungsausführung, wenn keine extern zustellbare Route aufgelöst werden kann (zum Beispiel interne/WebChat-Sitzungen oder mehrdeutige Multi-Kanal-Konfigurationen).

## Versionierung

- `PROTOCOL_VERSION` befindet sich in `src/gateway/protocol/schema.ts`.
- Clients senden `minProtocol` + `maxProtocol`; der Server lehnt Abweichungen ab.
- Schemas + Modelle werden aus TypeBox-Definitionen generiert:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

## Auth

- Gateway-Auth mit gemeinsamem Secret verwendet `connect.params.auth.token` oder
  `connect.params.auth.password`, abhängig vom konfigurierten Auth-Modus.
- Identitätstragende Modi wie Tailscale Serve
  (`gateway.auth.allowTailscale: true`) oder Nicht-Loopback-
  `gateway.auth.mode: "trusted-proxy"` erfüllen die Connect-Auth-Prüfung über
  Request-Header statt über `connect.params.auth.*`.
- `gateway.auth.mode: "none"` für private Ingress überspringt die Connect-Auth mit gemeinsamem Secret
  vollständig; setzen Sie diesen Modus nicht an öffentlichem/nicht vertrauenswürdigem Ingress ein.
- Nach dem Pairing stellt das Gateway ein **Gerätetoken** aus, das auf die Verbindungs-
  Rolle + Scopes begrenzt ist. Es wird in `hello-ok.auth.deviceToken` zurückgegeben und sollte
  vom Client für zukünftige Verbindungen persistiert werden.
- Clients sollten das primäre `hello-ok.auth.deviceToken` nach jeder
  erfolgreichen Verbindung persistieren.
- Eine erneute Verbindung mit diesem **gespeicherten** Gerätetoken sollte außerdem den gespeicherten
  genehmigten Scope-Satz für dieses Token wiederverwenden. Dadurch bleibt bereits gewährter
  Lese-/Probe-/Status-Zugriff erhalten und es wird vermieden, dass Reconnects stillschweigend auf einen
  engeren impliziten Admin-Only-Scope zurückfallen.
- Die normale Priorität bei Connect-Auth ist zuerst explizites gemeinsames Token/Passwort, dann
  explizites `deviceToken`, dann gespeichertes gerätespezifisches Token, dann Bootstrap-Token.
- Zusätzliche Einträge in `hello-ok.auth.deviceTokens` sind Bootstrap-Übergabetoken.
  Persistieren Sie diese nur, wenn die Verbindung Bootstrap-Auth auf einem vertrauenswürdigen Transport
  wie `wss://` oder Loopback/lokal verwendet hat.
- Wenn ein Client ein **explizites** `deviceToken` oder explizite `scopes` angibt, bleibt dieser
  vom Aufrufer angeforderte Scope-Satz maßgeblich; gecachte Scopes werden nur
  wiederverwendet, wenn der Client das gespeicherte gerätespezifische Token wiederverwendet.
- Gerätetoken können über `device.token.rotate` und
  `device.token.revoke` rotiert/widerrufen werden (erfordert Scope `operator.pairing`).
- Die Ausgabe/Rotation von Token bleibt auf den genehmigten Rollensatz begrenzt, der im
  Pairing-Eintrag dieses Geräts gespeichert ist; durch das Rotieren eines Tokens kann das Gerät nicht auf eine
  Rolle erweitert werden, die durch die Pairing-Genehmigung nie erteilt wurde.
- Für Sitzungen mit gepaarten Gerätetokens ist die Geräteverwaltung auf das eigene Gerät beschränkt, sofern der
  Aufrufer nicht zusätzlich `operator.admin` hat: Nicht-Admin-Aufrufer können nur ihren **eigenen**
  Geräteeintrag entfernen/widerrufen/rotieren.
- `device.token.rotate` prüft außerdem den angeforderten Operator-Scope-Satz gegen die
  aktuellen Sitzungsscopes des Aufrufers. Nicht-Admin-Aufrufer können ein Token nicht in einen
  breiteren Operator-Scope-Satz rotieren, als sie bereits besitzen.
- Auth-Fehler enthalten `error.details.code` plus Wiederherstellungshinweise:
  - `error.details.canRetryWithDeviceToken` (boolean)
  - `error.details.recommendedNextStep` (`retry_with_device_token`, `update_auth_configuration`, `update_auth_credentials`, `wait_then_retry`, `review_auth_configuration`)
- Client-Verhalten für `AUTH_TOKEN_MISMATCH`:
  - Vertrauenswürdige Clients können einen begrenzten Wiederholungsversuch mit einem gecachten gerätespezifischen Token unternehmen.
  - Wenn dieser Wiederholungsversuch fehlschlägt, sollten Clients automatische Reconnect-Schleifen beenden und Hinweise für erforderliche Operatoraktionen anzeigen.

## Geräteidentität + Pairing

- Knoten sollten eine stabile Geräteidentität (`device.id`) angeben, die von einem
  Schlüsselpaar-Fingerprint abgeleitet ist.
- Gateways stellen Token pro Gerät + Rolle aus.
- Pairing-Genehmigungen sind für neue Geräte-IDs erforderlich, sofern keine lokale automatische Genehmigung
  aktiviert ist.
- Die automatische Pairing-Genehmigung konzentriert sich auf direkte lokale local loopback-Verbindungen.
- OpenClaw hat außerdem einen engen backend-/containerlokalen Self-Connect-Pfad für
  vertrauenswürdige Helper-Flows mit gemeinsamem Secret.
- Same-Host-Tailnet- oder LAN-Verbindungen werden für das Pairing weiterhin als remote behandelt und
  erfordern eine Genehmigung.
- Alle WS-Clients müssen während `connect` eine `device`-Identität angeben (operator + node).
  Control UI kann sie nur in diesen Modi weglassen:
  - `gateway.controlUi.allowInsecureAuth=true` für localhost-only inkompatibilitätsbedingte unsichere HTTP-Unterstützung.
  - erfolgreiche `gateway.auth.mode: "trusted-proxy"`-Authentifizierung für operator Control UI.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (Break-Glass, schwerwiegende Sicherheitsverschlechterung).
- Alle Verbindungen müssen den vom Server bereitgestellten `connect.challenge`-Nonce signieren.

### Diagnostik für die Migration der Geräteauthentifizierung

Für Legacy-Clients, die noch das Signaturverhalten vor der Challenge verwenden, gibt `connect` jetzt
`DEVICE_AUTH_*`-Detailcodes unter `error.details.code` mit einem stabilen `error.details.reason` zurück.

Häufige Migrationsfehler:

| Nachricht                    | details.code                     | details.reason           | Bedeutung                                           |
| ---------------------------- | -------------------------------- | ------------------------ | --------------------------------------------------- |
| `device nonce required`      | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Client hat `device.nonce` weggelassen (oder leer gesendet). |
| `device nonce mismatch`      | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Client hat mit einem veralteten/falschen Nonce signiert. |
| `device signature invalid`   | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Die Signatur-Payload stimmt nicht mit der v2-Payload überein. |
| `device signature expired`   | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Der signierte Zeitstempel liegt außerhalb der zulässigen Abweichung. |
| `device identity mismatch`   | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` stimmt nicht mit dem Public-Key-Fingerprint überein. |
| `device public key invalid`  | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/Kanonisierung des Public Key ist fehlgeschlagen. |

Migrationsziel:

- Warten Sie immer auf `connect.challenge`.
- Signieren Sie die v2-Payload, die den Server-Nonce enthält.
- Senden Sie denselben Nonce in `connect.params.device.nonce`.
- Die bevorzugte Signatur-Payload ist `v3`, die zusätzlich zu den Feldern für device/client/role/scopes/token/nonce auch `platform` und `deviceFamily` bindet.
- Legacy-`v2`-Signaturen bleiben aus Kompatibilitätsgründen akzeptiert, aber das Pinning der gepaarten Geräte-
  Metadaten steuert weiterhin die Befehlsrichtlinie beim Wiederverbinden.

## TLS + Pinning

- TLS wird für WS-Verbindungen unterstützt.
- Clients können optional den Gateway-Zertifikat-Fingerprint pinnen (siehe `gateway.tls`-
  Konfiguration plus `gateway.remote.tlsFingerprint` oder CLI `--tls-fingerprint`).

## Scope

Dieses Protokoll stellt die **vollständige Gateway-API** bereit (status, channels, models, chat,
agent, sessions, nodes, approvals usw.). Die genaue Oberfläche ist durch die
TypeBox-Schemas in `src/gateway/protocol/schema.ts` definiert.
