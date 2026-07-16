---
read_when:
    - Implementieren oder Aktualisieren von Gateway-WS-Clients
    - Debugging von Protokollabweichungen oder Verbindungsfehlern
    - Protokollschema/-modelle neu generieren
summary: 'Gateway-WebSocket-Protokoll: Handshake, Frames, Versionierung'
title: Gateway-Protokoll
x-i18n:
    generated_at: "2026-07-16T12:47:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cc92cfed4cf1bcc7b9499d90eef9f9225a89c0e6a71bb6230bb416f8f6884b5
    source_path: gateway/protocol.md
    workflow: 16
---

Das Gateway-WS-Protokoll ist die zentrale Steuerungsebene und der Node-Transport für
OpenClaw. Operator- und Node-Clients (CLI, Web-UI, macOS-App, iOS-/Android-Nodes,
Headless-Nodes) stellen eine WebSocket-Verbindung her und deklarieren beim
Handshake eine **Rolle** und einen **Scope**.

## Transport und Framing

- WebSocket, Text-Frames, JSON-Nutzdaten.
- Der erste Frame **muss** eine `connect`-Anfrage sein.
- Frames vor dem Verbindungsaufbau sind auf 64 KiB begrenzt (`MAX_PREAUTH_PAYLOAD_BYTES`). Nach
  dem Handshake gelten `hello-ok.policy.maxPayload` und
  `hello-ok.policy.maxBufferedBytes`. Bei aktivierter Diagnose lösen übergroße
  eingehende Frames und langsame ausgehende Puffer `payload.large`-Ereignisse aus, bevor
  das Gateway die Verbindung schließt oder den Frame verwirft. Diese Ereignisse enthalten `surface`, Byte-
  Größen, Grenzwerte und einen sicheren Ursachencode, jedoch niemals Nachrichteninhalte, Inhalte
  von Anhängen, Rohbytes von Frames, Tokens, Cookies oder Geheimnisse.

Frame-Formate:

- Anfrage: `{type:"req", id, method, params}`
- Antwort: `{type:"res", id, ok, payload|error}`
- Ereignis: `{type:"event", event, payload, seq?, stateVersion?}`

Methoden mit Seiteneffekten erfordern Idempotenzschlüssel (siehe Schema).

## Handshake

Das Gateway sendet vor dem Verbindungsaufbau eine Challenge:

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

Der Client antwortet mit `connect`:

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

Das Gateway antwortet mit `hello-ok`:

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

`server`, `features`, `snapshot`, `policy` und `auth` sind gemäß
`HelloOkSchema` (`packages/gateway-protocol/src/schema/frames.ts`) alle erforderlich. `auth`
meldet die ausgehandelte Rolle und die ausgehandelten Scopes auch dann, wenn kein Geräte-Token ausgegeben wird (Format
oben). `pluginSurfaceUrls` ist optional und ordnet Namen von Plugin-Oberflächen (z. B.
`canvas`) gehosteten URLs mit begrenztem Scope zu; der Eintrag kann ablaufen, weshalb Nodes
`node.pluginSurface.refresh` mit `{ "surface": "canvas" }` aufrufen, um einen aktuellen Eintrag abzurufen.
Der veraltete Pfad `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
wird nicht unterstützt; verwenden Sie Plugin-Oberflächen.
Das optionale `appliedConfigHash` des Snapshots ist die aufgelöste Revision der Quellkonfiguration,
die von der aktiven Gateway-Laufzeit akzeptiert wurde. Clients können sie mit
`config.get.configRevisionHash` vergleichen, um festzustellen, ob eine neuere gespeicherte Konfiguration weiterhin
einen Neustart erfordert. `config.get.hash` bleibt die rohe Revision der Stammdatei, die von
Konfigurationsschreibvorgängen zur Konfliktvermeidung verwendet wird.

Solange das Gateway den Start seiner Sidecars noch abschließt, kann `connect` einen
wiederholbaren `UNAVAILABLE`-Fehler mit `details.reason: "startup-sidecars"` und
`retryAfterMs` zurückgeben. Wiederholen Sie den Versuch innerhalb Ihres Verbindungsbudgets, statt dies als
endgültigen Handshake-Fehler zu behandeln.

Wenn ein Geräte-Token ausgegeben wird, fügt `hello-ok.auth` es hinzu:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Der integrierte Bootstrap über QR-/Einrichtungscode dient der Übergabe an Mobilgeräte. Eine erfolgreiche
Basisverbindung per Einrichtungscode gibt ein primäres Node-Token sowie ein begrenztes
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

Diese Operator-Übergabe ist absichtlich begrenzt: Sie reicht aus, um die mobile
Operator-Schleife und die native Einrichtung zu starten, einschließlich `operator.talk.secrets` für das Lesen der Talk-
Konfiguration, umfasst jedoch keine Scopes zum Ändern von Kopplungen und kein `operator.admin`. Umfassenderer
Kopplungs-/Administratorzugriff erfordert einen separaten genehmigten Kopplungs- oder Token-Ablauf. Speichern Sie
`hello-ok.auth.deviceTokens` nur dann dauerhaft, wenn die Bootstrap-Authentifizierung über einen vertrauenswürdigen
Transport erfolgte (`wss://` oder Loopback-/lokale Kopplung).

Vertrauenswürdige Backend-Clients im selben Prozess (`client.id: "gateway-client"`,
`client.mode: "backend"`) dürfen bei direkten Loopback-Verbindungen `device` weglassen, wenn
sie sich mit dem gemeinsam verwendeten Gateway-Token/-Passwort authentifizieren. Dieser Pfad ist
internen RPCs der Steuerungsebene vorbehalten (z. B. Sitzungsaktualisierungen durch Subagenten) und verhindert,
dass veraltete CLI-/Gerätekopplungs-Baselines lokale Backend-Arbeit blockieren. Entfernte Clients,
Clients mit Browser-Ursprung, Nodes sowie Clients mit explizitem Geräte-Token bzw. expliziter Geräteidentität durchlaufen weiterhin
die regulären Prüfungen für Kopplung und Scope-Erweiterung.

### Worker-Rolle und geschlossenes Protokoll

Cloud-Worker verwenden einen dedizierten Loopback-Eingang über den Gateway-eigenen,
an den Hostschlüssel gebundenen SSH-Tunnel. Er akzeptiert ausschließlich Worker-Identitäten und leitet niemals
allgemeine Authentifizierung, Node-Ereignisse, Operator-RPCs oder Plugin-Methoden weiter. Ein striktes `connect`
überprüft einen im Ruhezustand gehashten, kurzlebigen Berechtigungsnachweis, der an die Umgebung, den Bundle-
Hash, die Eigentümer-Epoche, die RPC-Satzversion, den Ablaufzeitpunkt und eine optionale Sitzung gebunden ist; zusätzlich
werden die aktuelle Version und der Funktionsumfang separat geprüft. Bei Erfolg wird ein minimales
`worker-hello-ok` zurückgegeben; die Funktionsaushandlung ist unabhängig von der allgemeinen Protokollversion.
Frames bleiben unter 64 KiB; ausgenommen ist ein ausgehandelter `worker.inference.start`-
Frame, der bis zu 25 MiB groß sein darf. Die geschlossene Positivliste enthält `worker.heartbeat`,
`worker.transcript.commit`, `worker.live-event`, `worker.inference.start` und
`worker.inference.cancel`.

Transkript-Commits verwenden Fencing anhand der Eigentümer-Epoche, eine Gateway-eigene Sitzungsbindung,
Compare-and-Swap des Basisblatts und dauerhafte Sequenzwiedergabe; das Gateway erzeugt
Transkripteintrags- und Eltern-IDs über den regulären Sitzungsschreiber. Eigentümerschaft und
Ablauf werden bei jedem RPC erneut geprüft.

### Client-Fähigkeiten

Operator-Clients können in `connect.params.caps` optionale Fähigkeiten ankündigen:

- `tool-events`: akzeptiert strukturierte Ereignisse des Tool-Lebenszyklus.
- `inline-widgets`: kann gehostete Inline-Widget-Ergebnisse von Tools darstellen.

Client-Fähigkeiten beschreiben den verbundenen Client, nicht die Autorisierung. Agenten-Tools können erforderliche Fähigkeiten deklarieren; das Gateway lässt diese Tools aus, sofern nicht jede Anforderung in `caps` des ursprünglichen Clients enthalten ist. Über Kanäle gestartete Ausführungen besitzen keine Gateway-Client-Fähigkeiten, daher sind fähigkeitsbeschränkte Tools auch dann nicht verfügbar, wenn die Tool-Richtlinie sie ausdrücklich zulässt.

### Beispiel für eine Node-Verbindung

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

Nodes deklarieren beim Verbindungsaufbau Fähigkeitsangaben:

- `caps`: übergeordnete Kategorien wie `camera`, `canvas`, `screen`,
  `location`, `voice`, `talk`.
- `commands`: Positivliste der zur Ausführung zugelassenen Befehle.
- `permissions`: granulare Schalter (z. B. `screen.record`, `camera.capture`).

Das Gateway behandelt diese Angaben als Behauptungen und erzwingt serverseitige Positivlisten.

## Rollen und Scopes

Das vollständige Modell der Operator-Scopes, Prüfungen zum Genehmigungszeitpunkt und die
Semantik gemeinsam verwendeter Geheimnisse finden Sie unter [Operator-Scopes](/de/gateway/operator-scopes).

Rollen:

- `operator`: Client der Steuerungsebene (CLI/UI/Automatisierung).
- `node`: Host für Fähigkeiten (Kamera/Bildschirm/Canvas/system.run).
- `worker`: Cloud-Ausführungshost im dedizierten, geschlossenen Worker-Protokoll.

Operator-Scopes (`src/gateway/operator-scopes.ts`), der vollständige geschlossene Satz:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` mit `includeSecrets: true` erfordert `operator.talk.secrets` (oder
`operator.admin`). Wenn Geheimnisse enthalten sind, lesen Sie den Berechtigungsnachweis des aktiven Talk-Providers
aus `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
behält die Form der Quelle bei und kann ein SecretRef-Objekt oder eine redigierte Zeichenfolge sein.

Vom Plugin registrierte Gateway-RPC-Methoden können einen eigenen Operator-Scope anfordern,
diese reservierten Kernpräfixe werden jedoch stets zu `operator.admin`
(`src/shared/gateway-method-policy.ts`) aufgelöst: `config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`.

Der Methoden-Scope ist nur die erste Schranke. Einige über
`chat.send` aufgerufene Slash-Befehle wenden strengere Prüfungen auf Befehlsebene an: Dauerhafte Schreibvorgänge für `/config set` und
`/config unset` erfordern `operator.admin`, selbst bei Gateway-Clients, die
bereits einen niedrigeren Operator-Scope besitzen.

`node.pair.approve` verfügt zusätzlich zum grundlegenden
Methoden-Scope (`operator.pairing`) über eine zusätzliche Scope-Prüfung zum Genehmigungszeitpunkt, die auf den deklarierten
`commands` (`src/infra/node-pairing-authz.ts`) der ausstehenden Anfrage basiert:

| Deklarierte Befehle                                                                                                           | Erforderliche Scopes                     |
| ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| keine                                                                                                                         | `operator.pairing`                       |
| gewöhnliche Befehle                                                                                                           | `operator.pairing` + `operator.write` |
| enthält `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` oder `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

### Caps/Befehle/Berechtigungen (Node)

Nodes deklarieren beim Verbindungsaufbau Fähigkeitsangaben:

- `caps`: übergeordnete Fähigkeitskategorien wie `camera`, `canvas`, `screen`,
  `location`, `voice` und `talk`.
- `commands`: Positivliste der zur Ausführung zugelassenen Befehle.
- `permissions`: granulare Schalter (z. B. `screen.record`, `camera.capture`).

Der Gateway behandelt diese als **Claims** und erzwingt serverseitige Zulassungslisten.
Verbundene Nodes können nach einer erfolgreichen Verbindung oder erneuten
Verbindung optionale, für Agents sichtbare Plugin- oder MCP-Tool-
Deskriptoren mit `node.pluginTools.update` veröffentlichen. Headless-Node-Hosts werden neu gestartet, um deklarative Änderungen
am MCP-Inventar anzuwenden. Diese Aktualisierungsmethode ist der einzige Veröffentlichungsweg; Plugin-Tool-Deskriptoren werden in
den Parametern von `connect` nicht akzeptiert. Jeder Deskriptor muss einen Provider-sicheren Tool-`name` verwenden und
einen `command` aus der aktuellen Befehlszulassungsliste der Node benennen. Der Gateway vertraut den Deskriptor-
Metadaten der gekoppelten Node, filtert Deskriptoren außerhalb der genehmigten Befehls-
oberfläche, entfernt sie, wenn die Node die Verbindung trennt, und weist Versuche von Betreibern zurück,
den Katalog einer anderen Node zu verändern. Setzen Sie `gateway.nodes.pluginTools.enabled: false`,
um von Nodes veröffentlichte Deskriptoren zu ignorieren.

Verbundene Node-Hosts veröffentlichen ihren vollständigen Ersatzkatalog für Skills mit
`node.skills.update`. Diese Methode für die Node-Rolle ist der einzige Veröffentlichungsweg
für Node-Skills; Skills werden in den Parametern von `connect` nicht akzeptiert. Jeder Deskriptor enthält einen
sicheren Namen, eine Beschreibung und begrenzten `SKILL.md`-Inhalt. Der Gateway analysiert diesen
Inhalt mit dem normalen Skills-Loader, nimmt ihn in Agent-Skill-Snapshots auf,
solange die Node verbunden ist, und entfernt ihn bei der Trennung. Setzen Sie
`gateway.nodes.skills.enabled: false`, um von Nodes veröffentlichte Skills zu ignorieren.

## Präsenz

- `system-presence` gibt nach Geräteidentität indizierte Einträge zurück, einschließlich
  `deviceId`, `roles` und `scopes`, sodass Benutzeroberflächen auch dann eine Zeile pro Gerät anzeigen können,
  wenn es sowohl als Betreiber als auch als Node verbunden ist.
- `node.list` enthält optional `lastSeenAtMs` und `lastSeenReason`. Verbundene
  Nodes melden die aktuelle Verbindungszeit mit dem Grund `connect`; gekoppelte Nodes können
  außerdem über ein vertrauenswürdiges Node-Ereignis eine dauerhafte Hintergrundpräsenz melden.

Native macOS-Nodes können außerdem authentifizierte `node.presence.activity`-Ereignisse
mit begrenzter Eingabeinaktivitätszeit senden. Der Gateway leitet Aktivitätszeitstempel anhand seiner
eigenen Uhr ab, stellt den zuletzt aktiven verbundenen Mac über `node.list` und
`node.describe` bereit und überträgt `node.presence`-Aktualisierungen an Clients mit Leseberechtigung.
Informationen zu Auswahl, Datenschutz, Modellkontext und Verhalten bei der
Benachrichtigungsweiterleitung finden Sie unter [Präsenz des aktiven Computers](/de/nodes/presence).

### Hintergrundaktivitätsereignis der Node

Nodes rufen `node.event` mit `event: "node.presence.alive"` auf, um zu erfassen, dass eine
gekoppelte Node während einer Hintergrundaktivierung aktiv war, ohne sie als verbunden zu markieren:

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peters iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` ist eine geschlossene Enumeration: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, `connect`. Unbekannte Werte werden zu
`background` (`src/shared/node-presence.ts`) normalisiert. Das Ereignis wird nur für
authentifizierte Node-Gerätesitzungen dauerhaft gespeichert; gerätelose oder nicht gekoppelte Sitzungen geben
`handled: false` zurück.

Erfolgreiche Gateways geben ein strukturiertes Ergebnis zurück:

```json
{
  "ok": true,
  "event": "node.presence.alive",
  "handled": true,
  "reason": "persisted"
}
```

Ältere Gateways geben für `node.event` möglicherweise nur `{ "ok": true }` zurück; behandeln Sie dies
als bestätigten RPC-Aufruf, nicht als dauerhafte Speicherung der Präsenz.

## Gültigkeitsbereiche von Broadcast-Ereignissen

Vom Server übertragene Broadcast-Ereignisse werden anhand von Gültigkeitsbereichen eingeschränkt, sodass auf Kopplung beschränkte oder reine Node-
Sitzungen nicht passiv Sitzungsinhalte empfangen
(`src/gateway/server-broadcast.ts`):

- Chat-, Agent- und Tool-Ergebnis-Frames (gestreamte `agent`-Ereignisse, Tool-Ergebnis-
  ereignisse) erfordern mindestens `operator.read`. Sitzungen ohne diese Berechtigung überspringen diese
  Frames vollständig.
- Vom Plugin definierte `plugin.*`-Broadcasts sind standardmäßig auf `operator.write` oder
  `operator.admin` beschränkt; explizite Einträge wie
  `plugin.approval.requested` / `plugin.approval.resolved` verwenden
  stattdessen `operator.approvals`.
- Status-/Transportereignisse (`heartbeat`, `presence`, `tick`, Verbindungs-/Trennungs-
  lebenszyklus) bleiben uneingeschränkt, sodass der Transportzustand für jede
  authentifizierte Sitzung sichtbar ist.
- Unbekannte Broadcast-Ereignisfamilien werden standardmäßig nach Gültigkeitsbereich eingeschränkt (Fail-Closed),
  sofern ein registrierter Handler diese Einschränkungen nicht ausdrücklich lockert.

Jede Clientverbindung verwaltet ihre eigene clientbezogene Sequenznummer, sodass Broadcasts
auf diesem Socket monoton geordnet bleiben, selbst wenn verschiedene Clients
unterschiedliche, nach Gültigkeitsbereich gefilterte Teilmengen des Ereignisstroms sehen.

## RPC-Methodenfamilien

`hello-ok.features.methods` ist eine konservative Erkennungsliste, die aus
`src/gateway/server-methods-list.ts` sowie den geladenen Methodenexporten von Plugins und Channels
erstellt wird – sie ist keine generierte Auflistung aller Methoden, und einige Methoden (zum
Beispiel `push.test`, `web.login.start`, `web.login.wait`, `sessions.usage`)
sind absichtlich von der Erkennung ausgeschlossen, obwohl es sich um echte, aufrufbare
Methoden handelt. Behandeln Sie dies als Funktionserkennung, nicht als vollständige Aufzählung von
`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System und Identität">
    - `health` gibt den zwischengespeicherten oder neu geprüften Zustands-Snapshot des Gateways zurück.
    - `diagnostics.stability` gibt den aktuellen begrenzten Diagnose-Recorder für Stabilitätsdaten zurück: Ereignisnamen, Anzahlen, Bytegrößen, Speicherwerte, Warteschlangen-/Sitzungsstatus, Channel-/Plugin-Namen und Sitzungs-IDs. Keine Chattexte, Webhook-Inhalte, Tool-Ausgaben, unverarbeiteten Anfrage-/Antwortinhalte, Tokens, Cookies oder Secrets. Erfordert `operator.read`.
    - `status` gibt die Gateway-Zusammenfassung im Stil von `/status` zurück; vertrauliche Felder nur für Betreiber-Clients mit Administratorberechtigung.
    - `gateway.identity.get` gibt die Gateway-Geräteidentität zurück, die von Relay- und Kopplungsabläufen verwendet wird.
    - `system-presence` gibt den aktuellen Präsenz-Snapshot für verbundene Betreiber-/Node-Geräte zurück.
    - `system-event` fügt ein Systemereignis hinzu und kann den Präsenzkontext aktualisieren/übertragen.
    - `last-heartbeat` gibt das zuletzt dauerhaft gespeicherte Heartbeat-Ereignis zurück.
    - `set-heartbeats` schaltet die Heartbeat-Verarbeitung auf dem Gateway ein oder aus.
    - `gateway.suspend.prepare` erstellt nur dann eine kurze Lease für eine kooperative Unterbrechung, wenn die verfolgte Gateway-Arbeit inaktiv ist. `gateway.suspend.status` prüft diese Lease, und `gateway.suspend.resume` gibt sie nach dem Fortsetzen oder einem abgebrochenen Host-Vorgang frei.

  </Accordion>

  <Accordion title="Modelle und Nutzung">
    - `models.list` gibt den zur Laufzeit zulässigen Modellkatalog zurück. Siehe „`models.list`-Ansichten“ weiter unten.
    - `usage.status` gibt Zusammenfassungen der Provider-Nutzungszeiträume und verbleibenden Kontingente zurück.
    - `usage.cost` gibt aggregierte Kostennutzungsübersichten für einen Datumsbereich zurück. Übergeben Sie `agentId` für einen Agent oder `agentScope: "all"`, um konfigurierte Agents zu aggregieren.
    - `doctor.memory.status` gibt die Bereitschaft des Vektorspeichers bzw. zwischengespeicherter Embeddings für den aktiven Standard-Agent-Arbeitsbereich zurück. Übergeben Sie `{ "probe": true }` oder `{ "deep": true }` nur für einen expliziten Live-Ping des Embedding-Providers. Übergeben Sie `{ "agentId": "agent-id" }`, um die Statistiken des Dreaming-Speichers auf einen Agent-Arbeitsbereich zu beschränken; ohne diesen Wert werden konfigurierte Dreaming-Arbeitsbereiche aggregiert.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` und `doctor.memory.dedupeDreamDiary` akzeptieren optional `{ "agentId": "agent-id" }`; ohne Angabe arbeiten sie im konfigurierten Standard-Agent-Arbeitsbereich.
    - `doctor.memory.remHarness` gibt eine begrenzte, schreibgeschützte Vorschau des REM-Testsystems für Remote-Clients der Steuerungsebene zurück, einschließlich Arbeitsbereichspfaden, Speicherausschnitten, gerendertem fundiertem Markdown und Kandidaten für eine umfassende Hochstufung. Erfordert `operator.read`.
    - `sessions.usage` gibt Nutzungsübersichten pro Sitzung zurück. Übergeben Sie `agentId` für einen Agent oder `agentScope: "all"`, um konfigurierte Agents gemeinsam aufzulisten.
      Beide Nutzungsmethoden akzeptieren `mode: "specific"` mit einer IANA-`timeZone` für Sommerzeit berücksichtigende Kalendertagesgrenzen und Zeitabschnitte. `utcOffset` wird weiterhin für ältere Clients sowie als Ausweichlösung unterstützt, wenn die Gateway-Laufzeit die angeforderte Zone nicht erkennt.
    - `sessions.usage.timeseries` gibt Zeitreihennutzungsdaten für eine Sitzung zurück.
    - `sessions.usage.logs` gibt Nutzungsprotokolleinträge für eine Sitzung zurück.

  </Accordion>

  <Accordion title="Channels und Anmeldehilfen">
    - `channels.status` gibt Statusübersichten für integrierte und gebündelte Channels/Plugins zurück.
    - `channels.logout` meldet einen bestimmten Channel bzw. ein bestimmtes Konto ab, sofern der Channel dies unterstützt.
    - `web.login.start` startet einen QR-/Web-Anmeldeablauf für den aktuellen QR-fähigen Web-Channel-Provider.
    - `web.login.wait` wartet auf den Abschluss dieses Ablaufs und startet bei Erfolg den Channel.
    - `push.test` sendet eine APNs-Test-Pushnachricht an eine registrierte iOS-Node.
    - `voicewake.get` gibt die gespeicherten Aktivierungswort-Trigger zurück.
    - `voicewake.set` aktualisiert die Aktivierungswort-Trigger und überträgt die Änderung.

  </Accordion>

  <Accordion title="Plugin-Verwaltung">
    - `plugins.list` (`operator.read`) gibt das Inventar der installierten Plugins sowie lokal kuratierte offizielle Empfehlungen, Diagnosedaten und die Information zurück, ob der aktuelle Installationsmodus Änderungen zulässt.
    - `plugins.search` (`operator.read`) durchsucht installierbare ClawHub-Familien von Code-Plugins und Bundle-Plugins. Übergeben Sie einen nicht leeren Wert für `query` und optional `limit` von 1 bis 100.
    - `plugins.install` (`operator.admin`) installiert entweder einen offiziellen Katalogeintrag mit `{ source: "official", pluginId }` oder ein ClawHub-Paket mit `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }`. ClawHub-Installationen behalten die Vertrauens-, Integritäts- und Installationsrichtlinienprüfungen des Gateways bei. Erfolgreiche Installationen erfordern einen Neustart des Gateways.
    - `plugins.setEnabled` (`operator.admin`) ändert mit `{ pluginId, enabled }` die Aktivierungsrichtlinie eines installierten Plugins. Die Antwort enthält den aktualisierten Katalogeintrag, Neustartmetadaten und etwaige Warnungen zur Slot-Auswahl.
    - `plugins.uninstall` (`operator.admin`) entfernt mit `{ pluginId }` ein extern installiertes Plugin: Konfigurationsreferenzen, den Installationseintrag und verwaltete Dateien. Gebündelte Plugins können nicht deinstalliert, sondern nur deaktiviert werden. Die Antwort listet die Entfernungsschritte auf und erfordert immer einen Neustart des Gateways.

  </Accordion>

  <Accordion title="Nachrichten und Protokolle">
    - `send` ist der direkte RPC für ausgehende Zustellungen an bestimmte Channels, Konten und Thread-Ziele außerhalb des Chat-Runners.
    - `logs.tail` gibt das konfigurierte Ende des Gateway-Dateiprotokolls mit Steuerelementen für Cursor, Limit und maximale Byteanzahl zurück.

  </Accordion>

  <Accordion title="Operator-Terminal">
    - `terminal.open` startet eine Host-PTY für einen expliziten `agentId` oder den Standard-Agenten und gibt den aufgelösten Agenten, das Arbeitsverzeichnis, die Shell und den Isolationsstatus zurück.
    - `terminal.input`, `terminal.resize` und `terminal.close` arbeiten ausschließlich mit Sitzungen, die der aufrufenden Verbindung gehören.
    - `terminal.upload` akzeptiert eine Base64-Datei mit bis zu 16 MiB, legt sie in einem privaten temporären Verzeichnis mit einer Aufbewahrungsdauer von 24 Stunden auf dem Gateway der Sitzung oder dem Host des gekoppelten Node ab und gibt den absoluten Pfad zurück. Der Aufrufer muss diesen Pfad weiterhin einfügen oder anderweitig verwenden; der RPC schreibt niemals Terminaleingaben und führt keinen Befehl aus.
    - `terminal.data`- und `terminal.exit`-Ereignisse werden ausschließlich an die Verbindung gestreamt, der die Sitzung gehört.
    - Sitzungen, deren Verbindung abbricht, werden getrennt und nicht beendet: Sie können für `gateway.terminal.detachedSessionTimeoutSeconds` (Standardwert 300; `0` stellt das Beenden bei einem Verbindungsabbruch wieder her) erneut verbunden werden, während sich die jüngste Ausgabe in einem begrenzten serverseitigen Puffer ansammelt.
    - `terminal.list` gibt verbindbare Sitzungen zurück; `terminal.attach` bindet eine aktive oder getrennte Sitzung erneut an die aufrufende Verbindung und gibt den Wiedergabepuffer zurück (Übernahme nach Art von tmux – ein vorheriger aktiver Besitzer erhält `terminal.exit` mit dem Grund `detached`); `terminal.text` liest den Puffer als Klartext, ohne eine Verbindung herzustellen.
    - Jede Terminalmethode erfordert `operator.admin`; `gateway.terminal.enabled` muss ausdrücklich auf „true“ gesetzt sein. Vollständig sandboxisolierte Agenten werden abgelehnt, und eine Änderung der Agentenrichtlinie schließt bestehende sowie gerade gestartete PTYs einschließlich der getrennten.

  </Accordion>

  <Accordion title="Sprache und TTS">
    - `talk.catalog` gibt den schreibgeschützten Katalog der Talk-Provider für Sprachausgabe, Streaming-Transkription und Echtzeit-Sprachkommunikation zurück: kanonische Provider-IDs, Registry-Aliasse, Bezeichnungen, Konfigurationsstatus, ein optionales `ready`-Ergebnis auf Gruppenebene, offengelegte Modell-/Sprach-IDs, kanonische Modi, Übertragungswege, Brain-Strategien sowie Flags für Echtzeit-Audio und -Funktionen, ohne Provider-Geheimnisse zurückzugeben oder die globale Konfiguration zu verändern. Aktuelle Gateways setzen `ready` nach Anwendung der Provider-Auswahl zur Laufzeit; bei älteren Gateways ist das Fehlen dieses Werts als nicht verifiziert zu behandeln.
    - `talk.config` gibt die effektive Talk-Konfigurationsnutzlast zurück; `includeSecrets` erfordert `operator.talk.secrets` (oder `operator.admin`).
    - `talk.session.create` erstellt eine dem Gateway gehörende Talk-Sitzung für `realtime/gateway-relay`, `transcription/gateway-relay` oder `stt-tts/managed-room`. Bei `stt-tts/managed-room` müssen `operator.write`-Aufrufer, die `sessionKey` übergeben, für die bereichsgebundene Sichtbarkeit des Sitzungsschlüssels ebenfalls `spawnedBy` übergeben; die Erstellung von `sessionKey` ohne Bereichsbindung und `brain: "direct-tools"` erfordern `operator.admin`.
    - `talk.session.join` validiert ein Sitzungstoken für einen verwalteten Raum, gibt je nach Bedarf `session.ready` oder `session.replaced` aus und gibt Raum-/Sitzungsmetadaten sowie jüngste Talk-Ereignisse zurück, jedoch niemals das Klartexttoken oder dessen Hash.
    - `talk.session.appendAudio` hängt Base64-kodierte PCM-Audioeingaben an dem Gateway gehörende Echtzeit-Relay- und Transkriptionssitzungen an.
    - `talk.session.startTurn`, `talk.session.endTurn` und `talk.session.cancelTurn` steuern den Turn-Lebenszyklus verwalteter Räume und lehnen veraltete Turns ab, bevor der Zustand gelöscht wird.
    - `talk.session.cancelOutput` stoppt die Audioausgabe des Assistenten, hauptsächlich für VAD-gesteuertes Unterbrechen in Gateway-Relay-Sitzungen.
    - `talk.session.submitToolResult` schließt einen Provider-Tool-Aufruf ab, den eine dem Gateway gehörende Echtzeit-Relay-Sitzung ausgegeben hat. Die Anfrage wartet auf jedes vom Provider-Bridge offengelegte asynchrone Abschlusssignal; fehlgeschlagene Übermittlungen lassen den verknüpften Lauf aktiv und geben kein Ereignis für ein erfolgreiches Tool-Ergebnis aus. Übergeben Sie `options: { willContinue: true }` für vorläufige Tool-Ausgaben oder `options: { suppressResponse: true }`, wenn der Provider-Bridge die Unterstützung für Unterdrückung signalisiert und das Ergebnis keine weitere Antwort starten soll.
    - `talk.session.steer` sendet die Sprachsteuerung eines aktiven Laufs an eine dem Gateway gehörende, agentengestützte Talk-Sitzung: `{ sessionId, text, mode? }`, wobei `mode` entweder `status`, `steer`, `cancel` oder `followup` ist; ein nicht angegebener Modus wird anhand des gesprochenen Texts klassifiziert.
    - `talk.session.close` schließt eine dem Gateway gehörende Relay-, Transkriptions- oder verwaltete Raumsitzung und gibt abschließende Talk-Ereignisse aus.
    - `talk.mode` setzt den aktuellen Zustand des Talk-Modus für WebChat-/Control-UI-Clients und überträgt ihn.
    - `talk.client.create` erstellt mithilfe von `webrtc` oder `provider-websocket` eine clientseitig verwaltete Echtzeit-Provider-Sitzung, während das Gateway die Konfiguration, Anmeldedaten, Anweisungen und Tool-Richtlinien verwaltet.
    - `talk.client.toolCall` ermöglicht es clientseitig verwalteten Echtzeit-Übertragungswegen, Provider-Tool-Aufrufe an die Gateway-Richtlinie weiterzuleiten. Das erste unterstützte Tool ist `openclaw_agent_consult`; Clients erhalten eine Lauf-ID und warten auf die normalen Ereignisse des Chat-Lebenszyklus, bevor sie das providerspezifische Tool-Ergebnis übermitteln.
    - `talk.client.steer` sendet die Sprachsteuerung eines aktiven Laufs für clientseitig verwaltete Echtzeit-Übertragungswege. Das Gateway ermittelt den aktiven eingebetteten Lauf aus `sessionKey` und gibt ein strukturiertes Annahme-/Ablehnungsergebnis zurück, statt Steuerungsanweisungen stillschweigend zu verwerfen.
    - `talk.event` ist der zentrale Talk-Ereigniskanal für Echtzeit-, Transkriptions-, STT-/TTS-, verwaltete Raum-, Telefonie- und Meeting-Adapter.
    - `talk.speak` synthetisiert Sprache über den aktiven Talk-Sprach-Provider.
    - `tts.status` gibt den TTS-Aktivierungsstatus, den aktiven Provider, Fallback-Provider und den Provider-Konfigurationsstatus zurück.
    - `tts.providers` gibt das sichtbare Inventar der TTS-Provider zurück.
    - `tts.enable` und `tts.disable` schalten den Zustand der TTS-Einstellungen um.
    - `tts.setProvider` aktualisiert den bevorzugten TTS-Provider.
    - `tts.convert` führt eine einmalige Text-zu-Sprache-Konvertierung aus.
    - `tts.speak` (`operator.write`) rendert einen nicht leeren `text` mit der konfigurierten allgemeinen TTS-Provider-Kette und gibt einen vollständigen Clip inline als `audioBase64` sowie `provider` und optionale Metadaten für `outputFormat`, `mimeType` und `fileExtension` zurück. Anders als `tts.convert` gibt es keinen Gateway-lokalen Pfad zurück; anders als `talk.speak` erfordert es keinen Talk-Provider. Text oberhalb von `messages.tts.maxTextLength` gibt `INVALID_REQUEST` zurück; Synthesefehler geben `UNAVAILABLE` zurück.

  </Accordion>

  <Accordion title="Geheimnisse, Konfiguration, Aktualisierung und Assistent">
    - `secrets.reload` löst aktive SecretRefs erneut auf und ersetzt den geheimen Laufzeitzustand nur bei vollständigem Erfolg.
    - `secrets.resolve` löst Geheimniszuweisungen für Befehlsziele eines bestimmten Befehls-/Zielsatzes auf.
    - `config.get` gibt den aktuellen Konfigurations-Snapshot auf dem Datenträger, den unverarbeiteten `hash` der Stammdatei, den aufgelösten `configRevisionHash` und optional `appliedConfigHash` für die aufgelöste, von der aktiven Gateway-Laufzeit akzeptierte Revision zurück.
    - `config.set` schreibt eine validierte Konfigurationsnutzlast.
    - `config.patch` führt eine partielle Konfigurationsaktualisierung zusammen. Eine destruktive Array-Ersetzung erfordert den betroffenen Pfad in `replacePaths`; verschachtelte Arrays unter Array-Einträgen verwenden `[]`-Pfade wie `agents.list[].skills`.
    - `config.apply` validiert und ersetzt die vollständige Konfigurationsnutzlast.
    - `config.schema` gibt die Live-Nutzlast des Konfigurationsschemas zurück, die von Control UI und CLI-Tools verwendet wird: Schema, `uiHints`, Version, Generierungsmetadaten sowie Plugin- und Kanalschema-Metadaten, sofern sie geladen werden können. Sie enthält `title`-/`description`-Metadaten aus denselben Bezeichnungen/Hilfetexten wie die Benutzeroberfläche, einschließlich verschachtelter Objekt-, Platzhalter- und Array-Element-Zweige sowie `anyOf`-/`oneOf`-/`allOf`-Kompositionszweige, wenn eine passende Felddokumentation vorhanden ist.
    - `config.schema.lookup` gibt eine pfadbezogene Suchnutzlast für einen Konfigurationspfad zurück: den normalisierten Pfad, einen flachen Schemaknoten, den passenden Hinweis plus `hintPath`, optional `reloadKind` und Zusammenfassungen der unmittelbaren untergeordneten Elemente für die Detailnavigation in UI/CLI. `reloadKind` ist entweder `restart`, `hot` oder `none` (`src/config/schema.ts`) und bildet den Gateway-Planer zum erneuten Laden der Konfiguration für den angeforderten Pfad ab. Suchschemaknoten behalten die benutzerorientierte Dokumentation und gängige Validierungsfelder bei (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, Grenzwerte für Zahlen/Zeichenfolgen/Arrays/Objekte, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Zusammenfassungen untergeordneter Elemente legen `key`, den normalisierten `path`, `type`, `required`, `hasChildren`, optional `reloadKind` sowie die passenden `hint`/`hintPath` offen.
    - `update.run` führt den Gateway-Aktualisierungsablauf aus und plant nur dann einen Neustart, wenn die Aktualisierung erfolgreich war; Aufrufer mit einer Sitzung können `continuationMessage` angeben, damit beim Start über die Fortsetzungswarteschlange für Neustarts ein nachfolgender Agenten-Turn fortgesetzt wird. Paketmanager-Aktualisierungen und überwachte Aktualisierungen von Git-Checkouts aus der Steuerungsebene verwenden eine getrennte Übergabe an einen verwalteten Dienst, statt den Paketbaum zu ersetzen oder Checkout-/Build-Ausgaben innerhalb des laufenden Gateways zu verändern. Eine gestartete Übergabe gibt `ok: true` mit `result.reason: "managed-service-handoff-started"` und `handoff.status: "started"` zurück; nicht verfügbare oder fehlgeschlagene Übergaben geben `ok: false` mit `managed-service-handoff-unavailable` oder `managed-service-handoff-failed` sowie `handoff.command` zurück, wenn eine manuelle Aktualisierung über die Shell erforderlich ist. „Nicht verfügbar“ bedeutet, dass OpenClaw keine sichere Supervisor-Grenze oder dauerhafte Dienstidentität besitzt, etwa `OPENCLAW_SYSTEMD_UNIT` für systemd. Während einer gestarteten Übergabe meldet der Neustart-Sentinel möglicherweise kurzzeitig `stats.reason: "restart-health-pending"`; die Fortsetzung wird verzögert, bis die CLI das neu gestartete Gateway verifiziert und den endgültigen `ok`-Sentinel schreibt.
    - `update.status` aktualisiert den neuesten Neustart-Sentinel der Aktualisierung und gibt ihn zurück, einschließlich der nach dem Neustart ausgeführten Version, sofern verfügbar.
    - `wizard.start`, `wizard.next`, `wizard.status` und `wizard.cancel` stellen den Einrichtungsassistenten über WS-RPC bereit.

  </Accordion>

  <Accordion title="Hilfsfunktionen für Agent und Workspace">
    - `agents.list` gibt konfigurierte Agent-Einträge einschließlich der effektiven Modell- und Laufzeitmetadaten zurück.
    - `agents.create`, `agents.update` und `agents.delete` verwalten Agent-Datensätze und die Workspace-Anbindung.
    - `agents.files.list`, `agents.files.get` und `agents.files.set` verwalten die für einen Agent bereitgestellten Bootstrap-Workspace-Dateien.
    - `audit.activity.list` gibt das versionierte, ausschließlich Metadaten enthaltende Aktivitätsprotokoll zurück; `audit.list` bleibt der kompatibilitätssichere RPC für Ausführungen und Tools.
    - `agents.workspace.list` und `agents.workspace.get` (`operator.read`) ermöglichen Clients in der vertrauenswürdigen Operator-Domäne, die unter [Operator-Bereiche](/de/gateway/operator-scopes) beschrieben ist, das schreibgeschützte, paginierte Durchsuchen des Workspace-Verzeichnisses eines Agent. Anfragen akzeptieren ausschließlich Workspace-relative Pfade; Lesezugriffe bleiben auf den per realpath aufgelösten Workspace-Stamm beschränkt (Ausbrüche über symbolische und feste Verknüpfungen werden abgewiesen), sind größenbeschränkt und auf UTF-8-Text sowie gängige Bildtypen (Base64) begrenzt. Antworten legen den Workspace-Pfad des Hosts nicht offen. In diesem Namespace gibt es keine Schreiboperationen.
    - `tasks.list`, `tasks.get` und `tasks.cancel` stellen das Gateway-Aufgabenprotokoll für SDK- und Operator-Clients bereit. Siehe unten [RPCs für das Aufgabenprotokoll](#task-ledger-rpcs).
    - `artifacts.list`, `artifacts.get` und `artifacts.download` stellen aus Transkripten abgeleitete Artefaktzusammenfassungen und Downloads für einen expliziten Bereich vom Typ `sessionKey`, `runId` oder `taskId` bereit. Ausführungs- und Aufgabenabfragen ermitteln die zugehörige Sitzung serverseitig und geben nur Transkriptmedien mit übereinstimmender Herkunft zurück; unsichere oder lokale URL-Quellen führen zu nicht unterstützten Downloads, statt serverseitig abgerufen zu werden.
    - `environments.list` und `environments.status` bewahren die lokale Umgebungs- und Node-Erkennung des Gateway. Konfigurierte Cloud-Worker und persistente Datensätze aus früheren Profilen ergänzen `worker`-Metadaten mit `providerId`, optionalem `leaseId`, `state`, `ageMs`, optionalem `idleMs` und `attachedSessionIds`. Die Lebenszykluszustände von Workern sind `requested`, `provisioning`, `bootstrapping`, `ready`, `attached`, `idle`, `draining`, `destroying`, `destroyed`, `failed` und `orphaned`.
    - `environments.create` (`{ profileId, idempotencyKey }`) stellt einen Worker aus einem konfigurierten Provider-Profil eines Plugins bereit; Wiederholungsversuche mit demselben Schlüssel verwenden den persistenten Vorgang erneut. `environments.destroy` (`{ environmentId }`) fordert den idempotenten Abbau einer persistenten Worker-Umgebung an. Beide erfordern `operator.admin`, sind Schreibvorgänge der Steuerungsebene und geben dieselbe Form der Umgebungszusammenfassung zurück, die auch Statusantworten verwenden.
    - `agent.identity.get` gibt die effektive Assistentenidentität für einen Agent oder eine Sitzung zurück.
    - `agent.wait` wartet auf den Abschluss einer Ausführung und gibt, sofern verfügbar, den abschließenden Snapshot zurück.

  </Accordion>

  <Accordion title="Sitzungssteuerung">
    - `sessions.list` gibt den aktuellen Sitzungsindex zurück, einschließlich der `agentRuntime`-Metadaten pro Zeile, wenn ein Agent-Runtime-Backend konfiguriert ist. Wenn die Platzierung auf Cloud-Workern aktiviert ist oder ein dauerhafter Wiederherstellungsstatus vorliegt, enthalten Sitzungszeilen außerdem einen abgeschlossenen `placement`-Status (`local`, `requested`, `provisioning`, `syncing`, `starting`, `active`, `draining`, `reconciling`, `reclaimed` oder `failed`) sowie statusabhängige Felder für Umgebung, Owner-Epoche, Workspace, Bundle, ACK-Cursor oder Wiederherstellung.
    - `sessions.subscribe` und `sessions.unsubscribe` aktivieren bzw. deaktivieren Abonnements für Sitzungsänderungsereignisse des aktuellen WS-Clients.
    - `sessions.messages.subscribe` und `sessions.messages.unsubscribe` aktivieren bzw. deaktivieren Abonnements für Transkript-/Nachrichtenereignisse einer Sitzung. Übergeben Sie `includeApprovals: true`, um zusätzlich bereinigte `session.approval`-Lebenszyklusereignisse für Genehmigungen zu empfangen, deren persistierte Zielgruppe genau diese Sitzung umfasst und deren Prüferbindung den abonnierenden Client autorisiert. Die Abonnementantwort enthält dann eine begrenzte ausstehende `approvalReplay`; sie ist maßgeblich, wenn `truncated` den Wert „false“ hat. Die Aktivierung gilt pro Abonnementaufruf und bleibt nicht bestehen: Wird dieselbe Sitzung ohne `includeApprovals: true` erneut abonniert, wird ein vorhandenes Genehmigungsabonnement entfernt. Zusätzlich zur normalen Leseberechtigung für Sitzungen erfordert diese Aktivierung `operator.admin` oder auf einem gekoppelten Gerät `operator.approvals`.
    - `sessions.preview` gibt begrenzte Transkriptvorschauen für bestimmte Sitzungsschlüssel zurück.
    - `sessions.describe` gibt eine Gateway-Sitzungszeile für einen exakten Sitzungsschlüssel zurück.
    - `sessions.resolve` löst ein Sitzungsziel auf oder kanonisiert es.
    - `sessions.create` erstellt einen neuen Sitzungseintrag. Optionale Werte für `model` und `thinkingLevel` speichern die anfänglichen Modell- und Reasoning-Überschreibungen atomar. `worktree: true` stellt einen verwalteten Worktree bereit; optional wählen `worktreeBaseRef`/`worktreeName` die Basisreferenz und den Branch-Namen aus, und `execNode` (`operator.admin`) bindet die Befehlsausführung der Sitzung an einen Node-Host. Der erstellte Worktree wird im Ergebnis zurückgegeben und in der Sitzungszeile (`worktree: { id, branch, repoRoot }`) gespeichert. Wenn der Eintrag erstellt, aber sein verschachtelter anfänglicher `chat.send` abgelehnt wird, enthält das erfolgreiche Ergebnis `runStarted: false` und `runError`; Clients können den Prompt beibehalten und den Vorgang mit dem zurückgegebenen Sitzungsschlüssel wiederholen.
    - `sessions.dispatch` (`operator.admin`) verschiebt eine vorhandene lokale OpenClaw-Sitzung mit einem sitzungseigenen verwalteten Worktree in ein konfiguriertes Cloud-Worker-Profil. Übergeben Sie `{ key, profileId, agentId? }`. Die Methode ist nicht vorhanden, wenn kein Worker-Profil konfiguriert ist, unterbindet vor dem Abschluss aktiver Arbeit die lokale Annahme weiterer Turns und kehrt erst zurück, nachdem die Platzierung den Zustand `active` unter Worker-Eigentümerschaft erreicht hat. Die Weiterleitung erfolgt nur in eine Richtung; die Rückübertragung vom Worker zum lokalen System ist nicht Teil dieses RPC.
    - `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` und `sessions.groups.delete` verwalten den Gateway-eigenen Katalog benutzerdefinierter Sitzungsgruppen (Namen und Anzeigereihenfolge). Die Mitgliedschaft verbleibt im Feld `category` jeder Sitzung; beim Umbenennen und Löschen werden Mitgliedssitzungen serverseitig aktualisiert.
    - `sessions.send` sendet eine Nachricht an eine vorhandene Sitzung.
    - `sessions.steer` ist die Variante zum Unterbrechen und Umsteuern einer aktiven Sitzung.
    - `sessions.abort` bricht aktive Arbeit für eine Sitzung ab. Übergeben Sie `key` zusammen mit dem optionalen `runId` oder ausschließlich `runId` für aktive Ausführungen, die das Gateway einer Sitzung zuordnen kann.
    - `sessions.patch` aktualisiert Sitzungsmetadaten/-überschreibungen und meldet das aufgelöste kanonische Modell sowie den effektiven Wert für `agentRuntime`.
    - `sessions.reset`, `sessions.delete` und `sessions.compact` führen Sitzungswartungsaufgaben aus.
    - `sessions.get` gibt die vollständige gespeicherte Sitzungszeile zurück.
    - Die Chat-Ausführung verwendet weiterhin `chat.history`, `chat.send`, `chat.abort` und `chat.inject`. `chat.history` wird für UI-Clients zur Anzeige normalisiert: Eingebettete Direktiven-Tags werden aus dem sichtbaren Text entfernt, XML-Nutzlasten von Tool-Aufrufen im Klartext (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzte Tool-Aufrufblöcke) sowie offengelegte ASCII-/vollbreite Modellsteuerungstoken werden entfernt, reine Assistant-Zeilen mit Silent-Token (exakt `NO_REPLY` / `no_reply`) werden ausgelassen und übergroße Zeilen können durch Platzhalter ersetzt werden.
    - `chat.message.get` ist der additive, begrenzte Leser vollständiger Nachrichten für einen einzelnen sichtbaren Transkripteintrag. Übergeben Sie `sessionKey`, optional `agentId`, wenn die Sitzungsauswahl Agent-spezifisch ist, sowie einen Transkriptwert für `messageId`, der zuvor über `chat.history` bereitgestellt wurde; das Gateway gibt dieselbe für die Anzeige normalisierte Projektion ohne die Kürzungsobergrenze des kompakten Verlaufs zurück, sofern der gespeicherte Eintrag noch verfügbar und nicht übergroß ist.
    - `chat.toolTitles` gibt kurze Zweckbezeichnungen für Tool-Aufrufe zurück, die in der Control UI dargestellt werden (gebündelt, maximal 24 Elemente mit begrenzten Eingaben). Die Funktion muss über `gateway.controlUi.toolTitles` aktiviert werden (standardmäßig deaktiviert); deaktivierte Gateways beantworten `{ titles: {}, disabled: true }` ohne Modellaufruf, damit Clients keine weiteren Anfragen stellen. Wenn die Funktion aktiviert ist, verwenden die Bezeichnungen das standardmäßige Routing für Utility-Modelle: entweder ein explizit konfiguriertes `utilityModel` (eine Betreiberentscheidung, durch die wie bei allen Utility-Aufgaben begrenzte Aufgabeninhalte an den ausgewählten Provider gesendet werden können) oder andernfalls den deklarierten Standard für kleine Modelle des Sitzungs-Providers, sodass nicht implizit ein neues Egress-Ziel entsteht; ein leeres `utilityModel` deaktiviert sie vollständig. Die Bezeichnungen greifen niemals auf das primäre Modell zurück. Die Ergebnisse werden in der Agent-spezifischen Statusdatenbank anhand von Tool-Name und Eingabe zwischengespeichert, sodass wiederholte Ansichten dieselben Aufrufe nie erneut in Rechnung stellen.
    - `chat.send` akzeptiert das für einen Turn geltende `fastMode: "auto"`, um den schnellen Modus für Modellaufrufe zu verwenden, die vor dem automatischen Grenzwert gestartet werden, und spätere Wiederholungs-, Fallback-, Tool-Ergebnis- oder Fortsetzungsaufrufe anschließend ohne schnellen Modus zu starten. Der Grenzwert beträgt standardmäßig 60 Sekunden (`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`) und kann mit `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` pro Modell konfiguriert werden. Ein `chat.send`-Aufrufer kann das für einen Turn geltende `fastAutoOnSeconds` übergeben, um den Grenzwert für diese Anfrage zu überschreiben. Übergeben Sie `queueMode` (`steer`, `followup`, `collect` oder `interrupt`), um den gespeicherten Warteschlangenmodus ausschließlich für diese Anfrage zu überschreiben; explizite Umsteuerungsaktionen der Control UI verwenden `queueMode: "steer"`.

  </Accordion>

  <Accordion title="Gerätekopplung und Gerätetoken">
    - `device.pair.list` gibt ausstehende und genehmigte gekoppelte Geräte zurück.
    - `device.pair.setupCode` erstellt einen mobilen Einrichtungscode und standardmäßig eine PNG-QR-Daten-URL. Dies erfordert `operator.admin` und wird absichtlich nicht in der angekündigten Erkennung aufgeführt. Das Ergebnis enthält `setupCode`, optional `qrDataUrl`, `gatewayUrl`, die nicht geheime Bezeichnung `auth` und `urlSource`.
    - `device.pair.approve`, `device.pair.reject` und `device.pair.remove` verwalten Datensätze zur Gerätekopplung.
    - `device.pair.rename` weist eine Operatorbezeichnung (`{ deviceId, label }`) zu, die gegenüber dem vom Client gemeldeten Anzeigenamen bevorzugt wird und eine Gerätereparatur oder erneute Genehmigung überdauert.
    - `device.token.rotate` rotiert ein Token eines gekoppelten Geräts innerhalb der Grenzen seiner genehmigten Rolle und des Geltungsbereichs des Aufrufers.
    - `device.token.revoke` widerruft ein Token eines gekoppelten Geräts innerhalb der Grenzen seiner genehmigten Rolle und des Geltungsbereichs des Aufrufers.

    Der Einrichtungscode enthält kurzzeitig gültige Bootstrap-Anmeldedaten. Clients dürfen
    diese nicht protokollieren oder über den Kopplungsvorgang hinaus speichern.

  </Accordion>

  <Accordion title="Node-Kopplung, Aufruf und ausstehende Arbeit">
    - `node.pair.list`, `node.pair.approve`, `node.pair.reject` und `node.pair.remove` decken Genehmigungen für Node-Funktionen ab. `node.pair.request` und `node.pair.verify` wurden in 2026.7 zusammen mit dem eigenständigen Speicher für Node-Kopplungen entfernt; ausstehende Anfragen werden vom Gateway erstellt, wenn Nodes eine Verbindung herstellen.
    - `node.list` und `node.describe` geben den bekannten/verbundenen Node-Status zurück.
    - `node.rename` aktualisiert die Bezeichnung eines gekoppelten Nodes.
    - `node.invoke` leitet einen Befehl an einen verbundenen Node weiter.
    - `node.invoke.result` gibt das Ergebnis einer Aufrufanfrage zurück.
    - `mcp.tools.call.v1` ist der Headless-Node-Host-Befehl zum Aufrufen eines konfigurierten Node-lokalen MCP-Tools. Er wird über `node.invoke` übertragen, setzt voraus, dass der Node den Befehl deklariert, und unterliegt weiterhin der Kopplungsgenehmigung und `gateway.nodes.denyCommands`.
    - `node.event` überträgt vom Node stammende Ereignisse zurück an das Gateway.
    - `node.pluginTools.update` ist der einzige Veröffentlichungspfad zum Ersetzen der für den Agenten sichtbaren Plugin-/MCP-Tool-Deskriptoren des verbundenen Nodes; die Parameter von `connect` übertragen sie nicht.
    - `node.pending.pull` und `node.pending.ack` sind die Warteschlangen-APIs für verbundene Nodes.
    - `node.pending.enqueue` und `node.pending.drain` verwalten dauerhafte ausstehende Arbeit für offline befindliche/getrennte Nodes.

  </Accordion>

  <Accordion title="Genehmigungsfamilien">
    - `approval.get` und `approval.resolve` sind die artunabhängigen dauerhaften Genehmigungsmethoden (Geltungsbereich `operator.approvals`). `approval.get` gibt eine bereinigte ausstehende oder beibehaltene terminale Projektion mit einer stabilen `urlPath` zurück; `approval.resolve` akzeptiert die kanonische Genehmigungs-ID, eine explizite `kind` und eine Entscheidung, wendet eine Auflösung nach dem Prinzip „erste Antwort gewinnt“ an und gibt stets das aufgezeichnete kanonische Ergebnis zurück.
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` und `exec.approval.resolve` decken einmalige Exec-Genehmigungsanfragen sowie das Nachschlagen/Wiedergeben ausstehender Genehmigungen ab. Sie sind Adapter an der Protokollgrenze über derselben dauerhaften Genehmigungsregistrierung.
    - `exec.approval.waitDecision` wartet auf eine ausstehende Exec-Genehmigung und gibt die endgültige Entscheidung zurück (oder bei einer Zeitüberschreitung `null`).
    - `exec.approvals.get` und `exec.approvals.set` verwalten Snapshots der Exec-Genehmigungsrichtlinie des Gateways.
    - `exec.approvals.node.get` und `exec.approvals.node.set` verwalten die Node-lokale Exec-Genehmigungsrichtlinie über Node-Relay-Befehle.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` und `plugin.approval.resolve` decken durch Plugins definierte Genehmigungsabläufe ab.

  </Accordion>

  <Accordion title="Automatisierung, Skills und Tools">
    - Automatisierung: `wake` plant das Einfügen eines Wecktexts sofort oder beim nächsten Heartbeat; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` verwalten geplante Arbeit.
    - `cron.run` bleibt ein RPC im Stil einer Einreihung in die Warteschlange für manuelle Ausführungen. Clients, die eine Abschlusssemantik benötigen, sollten die zurückgegebene `runId` lesen und `cron.runs` abfragen.
    - `cron.runs` akzeptiert einen optionalen, nicht leeren `runId`-Filter, damit Clients einer einzelnen in die Warteschlange eingereihten manuellen Ausführung folgen können, ohne mit anderen Verlaufseinträgen für denselben Auftrag in Konflikt zu geraten.
    - Skills und Tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. Siehe unten [Hilfsmethoden für Operatoren](#operator-helper-methods).

  </Accordion>
</AccordionGroup>

### Häufige Ereignisfamilien

- `chat`: UI-Chat-Aktualisierungen wie `chat.inject` und andere ausschließlich das Transkript betreffende Chat-
  Ereignisse. In Protokoll v4 enthalten Delta-Nutzlasten `deltaText`; `message` bleibt
  der kumulative Assistenten-Snapshot. Ersetzungen, die keine Präfixe sind, setzen
  `replace=true` und verwenden `deltaText` als Ersetzungstext.
- `session.message`, `session.operation`, `session.tool`: Aktualisierungen von Transkript, laufenden
  Sitzungsoperationen und Ereignisstrom für eine abonnierte Sitzung.
- `session.approval`: bereinigter ausstehender und terminaler Genehmigungsstatus für einen
  ausdrücklich angemeldeten Abonnenten der exakten Sitzung. Untergeordnete Genehmigungen verwenden die
  persistierte Zielgruppe des Vorfahren; Ereignisse ändern niemals Transkripte und wecken keine Agenten.
- `sessions.changed`: Sitzungsindex oder Metadaten geändert.
- `presence`: Aktualisierungen des Systemanwesenheits-Snapshots.
- `tick`: periodisches Keepalive-/Verfügbarkeitssignal.
- `health`: Aktualisierung des Gateway-Zustands-Snapshots.
- `heartbeat`: Aktualisierung des Heartbeat-Ereignisstroms.
- `cron`: Ereignis einer Änderung an einer Cron-Ausführung/einem Cron-Auftrag.
- `shutdown`: Benachrichtigung über das Herunterfahren des Gateways.
- `node.pair.requested` / `node.pair.resolved`: Lebenszyklus der Node-Kopplung.
- `node.invoke.request`: Übertragung einer Node-Aufrufanfrage.
- `device.pair.requested` / `device.pair.resolved`: Lebenszyklus gekoppelter Geräte.
- `voicewake.changed`: Konfiguration des Aktivierungswort-Auslösers geändert.
- `exec.approval.requested` / `exec.approval.resolved`: Lebenszyklus der
  Exec-Genehmigung.
- `plugin.approval.requested` / `plugin.approval.resolved`: Lebenszyklus der
  Plugin-Genehmigung.

### Node-Hilfsmethoden

Nodes können `skills.bins` aufrufen, um die aktuelle Liste ausführbarer Skill-Dateien
für Prüfungen der automatischen Zulassung abzurufen.

## RPC für das Audit-Ledger

`audit.activity.list` stellt Operator-Clients eine stabile, nach den neuesten Einträgen zuerst sortierte Ansicht der Metadaten zum Lebenszyklus von Agenten-
ausführungen, Tool-Aktionen und optional erfassten Nachrichten bereit. Dies erfordert
`operator.read`. Abfragen schließen Datensätze aus, die älter als 30 Tage sind, und das gemeinsam genutzte
SQLite-Ledger ist auf 100,000 Datensätze begrenzt. Abgelaufene Zeilen werden beim
Start des Gateways, bei der stündlichen Wartung und bei späteren Schreibvorgängen gelöscht. Siehe
[Audit-Verlauf](/de/gateway/audit) zum Datenmodell und zur Datenschutzsemantik.

- Parameter: optional exakte `agentId`, `sessionKey` oder `runId`; optionale `kind`
  (`"agent_run"`, `"tool_action"` oder `"message"`); optionale `status`
  (`"started"`, `"succeeded"`, `"failed"`, `"cancelled"`, `"timed_out"`,
  `"blocked"` oder `"unknown"`); optionale Nachrichten-`direction` (`"inbound"` oder
  `"outbound"`) und exakte `channel`; optionale inklusive Unix-Millisekunden-Grenzen `after` / `before`;
  optionale `limit` von `1` bis `500`; und optionale
  Zeichenfolge `cursor` von der vorherigen Seite.
- Ergebnis: `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.

Die benannte V1-Ergebnis-Union verfügt über separate Schemas für Agentenausführungen, Tool-Aktionen, eingehende Nachrichten
und ausgehende Nachrichten. Der Diskriminator `eventType` ist jeweils
`agent_run`, `tool_action`, `inbound_message` oder `outbound_message`; `kind` und die Nachrichten-
`direction` bleiben zum Filtern und Anzeigen verfügbar. Jedes Ereignis hat eine ganzzahlige
`schemaVersion: 1`. Referenzen auf Nachrichtenidentitäten verwenden das exakte
Format `hmac-sha256:v1:<32 hex key id>:<64 hex digest>`; die Akteur-ID eines Kanalabsenders
verwendet dasselbe Format.

Alle Varianten erfordern `eventType`, `schemaVersion`, `eventId`, `sequence`,
`sourceSequence`, `occurredAt`, `kind`, `action`, `status`, `actor` und
`redaction`. Die Variantenfelder sind:

| `eventType`        | Pflichtfelder                                                      | Optionale Felder                                                                                                                 |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`, `runId`; `kind: "agent_run"`                           | `sessionKey`, `sessionId`, `errorCode`                                                                                          |
| `tool_action`      | `agentId`, `runId`; `kind: "tool_action"`                         | `sessionKey`, `sessionId`, `toolCallId`, `toolName`, `errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`, `channel`, `conversationKind`, `outcome`  | `agentId`, `runId`, `durationMs`, `resultCount`, Identitätsreferenzen, `reasonCode`, `errorCode`                                 |
| `outbound_message` | `direction: "outbound"`, `channel`, `conversationKind`, `outcome` | `agentId`, `runId`, `durationMs`, `resultCount`, Identitätsreferenzen, `reasonCode`, `deliveryKind`, `failureStage`, `errorCode` |

Die geschlossenen Nachrichten-Enums sind:

- `conversationKind`: `direct`, `group`, `channel` oder `unknown`.
- Eingehende `outcome`: `completed`, `skipped` oder `failed`; optionale
  `reasonCode`: `duplicate`, `reply_operation_active`,
  `reply_operation_aborted`, `fast_abort`, `plugin_bound_handled`,
  `plugin_bound_unavailable`, `plugin_bound_declined`, `plugin_bound_error`,
  `before_dispatch_handled`, `acp_dispatch_completed`, `acp_dispatch_failed`,
  `acp_dispatch_empty` oder `acp_dispatch_aborted`.
- Ausgehende `outcome`: `sent`, `suppressed`, `failed` oder `unknown`; optionale
  `reasonCode`: `cancelled_by_message_sending_hook`,
  `cancelled_by_reply_payload_sending_hook`,
  `empty_after_message_sending_hook`, `empty_after_reply_payload_sending_hook`
  oder `no_visible_payload`. Ein Adapter, der keine Plattformidentität zurückgibt, ist
  `unknown`, da die externe Nebenwirkung nicht widerlegt werden kann.
- `deliveryKind`: `text`, `media` oder `other`; `failureStage`:
  `platform_send`, `queue` oder `unknown`.

Terminale Felder sind korreliert und nicht unabhängig voneinander optional:

| Variante          | Terminale Zuordnung                                                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Agentenausführung | `started` hat keine `errorCode`; jeder abgeschlossene Status, der keinen Erfolg darstellt, erfordert den zugehörigen `run_*`-Code.                         |
| Tool-Aktion       | `started` und „erfolgreich“ haben keine `errorCode`; jeder andere abgeschlossene Status erfordert den zugehörigen `tool_*`-Code.                           |
| Eingehende Nachricht | erfolgreich = `completed`; blockiert = `skipped`; fehlgeschlagen = `failed` plus `message_processing_failed`. Falls `reasonCode` vorhanden ist, muss es zu dieser terminalen Familie gehören. |
| Ausgehende Nachricht | erfolgreich = `sent`; blockiert = `suppressed` plus `reasonCode`; fehlgeschlagen = `failed` plus `errorCode` und `failureStage`; unbekannt = `unknown` plus `failureStage`.      |

Jedes Aktivitätsereignis enthält eine stabile Ereignis-ID, eine monotone Ledger-Sequenz,
eine Quellereignissequenz, einen Zeitstempel, Akteur, Aktion, Status, den ganzzahligen Wert
`schemaVersion: 1` und `redaction: "metadata_only"`. Ausführungs- und Tool-Datensätze
erfordern Agenten- und Ausführungsherkunft und können eine Sitzungsh herkunft enthalten. Nachrichten-
datensätze können Agenten- und Ausführungs-IDs enthalten, enthalten jedoch absichtlich niemals
`sessionKey` oder `sessionId`; der Abfragefilter `sessionKey` gilt daher nur für
Ausführungs- und Tool-Zeilen. Tool-Ereignisse können eine Tool-Aufruf-ID und einen Tool-Namen enthalten.

Nachrichtendatensätze verwenden `message.inbound.processed` oder
`message.outbound.finished` und ergänzen Richtung, Kanal, Konversationsart,
normalisiertes Ergebnis sowie optional Zustellungsart, Fehlerphase, Dauer,
Ergebnisanzahl, Ursachencode und installationslokale, schlüsselbasierte
Konto-/Konversations-/Nachrichten-/Zielpseudonyme. Diese Pseudonyme erleichtern
die Korrelation, stellen jedoch keine Anonymisierung dar: Die Zustandsdatenbank enthält ihren Schlüssel,
RPC- und CLI-Exporte dagegen nicht. Das Ledger speichert keine Prompts, Nachrichten-
inhalte, Tool-Argumente, Tool-Ergebnisse, Befehlsausgaben oder unformatierten Fehlertext.
Die `sessionKey`-Werte von Ausführungen/Tools bleiben unverarbeitete Korrelationsmetadaten und können
Plattformkonto- oder Peer-IDs enthalten; Nachrichtendatensätze lassen Sitzungsschlüssel weg.

Bei eingehenden Zeilen misst `durationMs` die Kerndisposition bis zu ihrem Abschluss und
`resultCount` zählt abgeschlossene, in die Warteschlange gestellte Tool-, Block- und Antwortnutzlasten. Bei
ausgehenden Zeilen umfasst `durationMs` die Zustellungsverantwortung bis zur Bestätigung,
Dead-Letter-Verarbeitung oder Abstimmung (einschließlich Warteschlangenwartezeit), und `resultCount`
zählt identifizierte physische Sendungen an die Plattform. `deliveryKind` beschreibt, sofern vorhanden,
die effektive Nutzlast nach Hooks und Rendering; unterdrückte oder hinsichtlich eines Absturzes
mehrdeutige Zeilen lassen diesen Wert weg.

Die aktuelle Nachrichtenabdeckung umfasst akzeptierte eingehende Nachrichten, die die Kern-
disposition erreichen, einschließlich Kern-Duplikat- und Abschlussergebnissen. Für ausgehende Nachrichten wird
pro ursprünglicher logischer Antwortnutzlast, die die gemeinsame dauerhafte
Zustellung erreicht, eine Abschlusszeile geschrieben; Aufteilung und Adapter-Auffächerung werden in `resultCount` zusammengefasst. In die Warteschlange gestellte
wiederholbare oder mehrdeutige Sendungen werden erst nach Bestätigung, Dead-Letter-
Verarbeitung oder Abstimmung aufgezeichnet. Plugin-lokale und direkte Sendepfade, die diese
gemeinsamen Grenzen umgehen, sind noch nicht abgedeckt. Die begrenzte Worker-Warteschlange arbeitet nach bestem Bemühen
und kann bei Fehlern oder Überlastung Datensätze verwerfen; daher ist diese Oberfläche kein
verlustfreies Compliance-Archiv.

Die Aufzeichnung ist standardmäßig aktiviert und wird über
[`audit.enabled`](/de/gateway/configuration-reference#audit) gesteuert. Die Nachrichtenaufzeichnung wird
separat über `audit.messages` gesteuert und verwendet standardmäßig `"off"`. Wenn
die Aufzeichnung deaktiviert ist, liefert `audit.activity.list` weiterhin zuvor geschriebene Datensätze,
bis diese ablaufen.

Die ausgelieferten Anfrage-, Ergebnis- und `AuditEvent`-Schemas von `audit.list`
bleiben unverändert und geben nur Agentenausführungs- und Tool-Aktionsdatensätze zurück. Neue Operator-
Clients sollten `audit.activity.list` aufrufen, wenn der Gateway diese Methode ankündigt. Ältere
Gateways können entweder `unknown method: audit.activity.list` oder, da in ausgelieferten Versionen
die Autorisierung vor der Methodensuche erfolgte, `missing scope:
operator.admin` für eine Anfrage mit Leseberechtigung melden. Behandeln Sie Letzteres nur dann als fehlende Methode,
wenn die Methode nicht angekündigt wurde. Ein Client kann anschließend nur dann `audit.list`
erneut versuchen, wenn seine Filter keine Unterstützung für Nachrichtenart, Richtung oder Kanal
erfordern.

Verwenden Sie [`openclaw audit`](/de/cli/audit) für Textabfragen und begrenzte JSON-Exporte.

## Task-Ledger-RPCs

Operator-Clients prüfen und stornieren Datensätze von Gateway-Hintergrundaufgaben über
die Task-Ledger-RPCs (`packages/gateway-protocol/src/schema/tasks.ts`). Diese
geben bereinigte Aufgabenzusammenfassungen zurück, keinen unverarbeiteten Laufzeitzustand.

- `tasks.list` erfordert `operator.read`.
  - Parameter: optional `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` oder `"timed_out"`) oder ein Array dieser Statuswerte,
    optional `agentId`, optional `sessionKey`, optional `limit` von `1` bis
    `500` und optional die Zeichenfolge `cursor`.
  - Ergebnis: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` erfordert `operator.read`.
  - Parameter: `{ "taskId": string }`.
  - Ergebnis: `{ "task": TaskSummary }`.
  - Fehlende Aufgaben-IDs geben die „Nicht gefunden“-Fehlerstruktur des Gateways zurück.
- `tasks.cancel` erfordert `operator.write`.
  - Parameter: `{ "taskId": string, "reason"?: string }`.
  - Ergebnis: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` gibt an, ob das Ledger eine passende Aufgabe enthielt. `cancelled`
    gibt an, ob die Laufzeitumgebung die Stornierung akzeptiert oder aufgezeichnet hat.

`TaskSummary` enthält `id`, `status` und optionale Metadaten: `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, Zeitstempel, Fortschritt,
Abschlusszusammenfassung und bereinigten Fehlertext. `agentId` identifiziert den Agenten,
der die Aufgabe ausführt; `sessionKey` und `ownerKey` bewahren den Kontext des Anfragenden und der Steuerung.

## Hilfsmethoden für Operatoren

- `commands.list` (`operator.read`) ruft das Laufzeit-Befehlsinventar für
  einen Agenten ab.
  - `agentId` ist optional; lassen Sie es weg, um den Standardarbeitsbereich des Agenten zu lesen.
  - `scope` steuert, auf welche Oberfläche das primäre `name` verweist: `text` gibt
    das primäre Textbefehlstoken ohne das führende `/` zurück; `native` und der
    Standardpfad `both` geben, sofern verfügbar, Provider-spezifische native Namen zurück.
  - `textAliases` enthält exakte Slash-Aliasse wie `/model` und `/m`.
  - `nativeName` enthält den Provider-spezifischen nativen Befehlsnamen, sofern einer
    vorhanden ist.
  - `provider` ist optional und beeinflusst nur die native Benennung sowie die Verfügbarkeit nativer Plugin-
    Befehle.
  - `includeArgs=false` lässt serialisierte Argumentmetadaten in der Antwort weg.
- `tools.catalog` (`operator.read`) ruft den Laufzeit-Toolkatalog für einen
  Agenten ab. Die Antwort enthält gruppierte Tools und Herkunftsmetadaten:
  - `source`: `core` oder `plugin`
  - `pluginId`: Plugin-Eigentümer, wenn `source="plugin"`
  - `optional`: ob ein Plugin-Tool optional ist
- `tools.effective` (`operator.read`) ruft das zur Laufzeit effektive Tool-
  inventar für eine Sitzung ab.
  - `sessionKey` ist erforderlich.
  - Der Gateway leitet den vertrauenswürdigen Laufzeitkontext serverseitig aus der Sitzung ab,
    statt vom Aufrufer bereitgestellten Authentifizierungs- oder Zustellungskontext zu akzeptieren.
  - Die Antwort ist eine sitzungsbezogene, serverseitig abgeleitete Projektion des aktiven
    Inventars, einschließlich bereits erkannter Tools von Kern, Plugin, Kanal und MCP-
    Servern.
  - `tools.effective` ist für MCP schreibgeschützt: Es kann einen aufgewärmten MCP-
    Katalog der Sitzung durch die endgültige Tool-Richtlinie projizieren, erstellt jedoch keine MCP-Laufzeitumgebungen,
    verbindet keine Transporte und sendet kein `tools/list`. Wenn kein passender aufgewärmter Katalog
    vorhanden ist, kann die Antwort einen Hinweis wie `mcp-not-yet-connected`,
    `mcp-not-yet-listed` oder `mcp-stale-catalog` enthalten.
  - Effektive Tool-Einträge verwenden `source="core"`, `source="plugin"`,
    `source="channel"` oder `source="mcp"`.
- `tools.invoke` (`operator.write`) ruft ein verfügbares Tool über denselben
  Gateway-Richtlinienpfad wie `/tools/invoke` auf.
  - `name` ist erforderlich. `args`, `sessionKey`, `agentId`, `confirm` und
    `idempotencyKey` sind optional.
  - Wenn sowohl `sessionKey` als auch `agentId` vorhanden sind, muss der aufgelöste Sitzungsagent
    mit `agentId` übereinstimmen.
  - Nur für Eigentümer bestimmte Kern-Wrapper wie `cron`, `gateway` und `nodes` erfordern
    eine Eigentümer-/Administratoridentität (`operator.admin`), obwohl `tools.invoke` selbst
    `operator.write` ist.
  - Die Antwort ist eine SDK-orientierte Hülle mit `ok`, `toolName`, optional
    `output` und typisierten `error`-Feldern. Ablehnungen aufgrund von Genehmigungen oder Richtlinien geben
    `ok:false` in der Nutzlast zurück, statt die Gateway-Pipeline für Tool-Richtlinien
    zu umgehen.
- `skills.status` (`operator.read`) ruft das sichtbare Skills-Inventar für einen
  Agenten ab.
  - `agentId` ist optional; lassen Sie es weg, um den Standardarbeitsbereich des Agenten zu lesen.
  - Die Antwort enthält Eignung, fehlende Anforderungen, Konfigurationsprüfungen
    und bereinigte Installationsoptionen, ohne unverarbeitete Geheimniswerte offenzulegen.
- `skills.search` und `skills.detail` (`operator.read`) geben ClawHub-
  Erkennungsmetadaten zurück.
- `skills.upload.begin`, `skills.upload.chunk` und `skills.upload.commit`
  (`operator.admin`) stellen vor der Installation ein privates Skills-Archiv bereit. Dies
  ist ein separater Administrator-Uploadpfad für vertrauenswürdige Clients, nicht der normale ClawHub-
  Installationsablauf für Skills, und ist standardmäßig deaktiviert, sofern nicht
  `skills.install.allowUploadedArchives` aktiviert ist.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    erstellt einen Upload, der an diesen Slug und diesen Force-Wert gebunden ist.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` hängt Bytes am
    exakten dekodierten Offset an.
  - `skills.upload.commit({ uploadId, sha256? })` überprüft die endgültige Größe und
    SHA-256. Das Commit schließt nur den Upload ab; es installiert das Skill nicht.
  - Hochgeladene Skills-Archive sind ZIP-Archive, die einen `SKILL.md`-Stamm enthalten. Der
    interne Verzeichnisname des Archivs bestimmt niemals das Installationsziel.
- `skills.install` (`operator.admin`) hat drei Modi:
  - ClawHub-Modus: `{ source: "clawhub", slug, version?, force? }` installiert einen
    Skills-Ordner im Verzeichnis `skills/` des Standardarbeitsbereichs des Agenten.
  - Upload-Modus: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installiert einen abgeschlossenen Upload im Verzeichnis
    `skills/<slug>` des Standardarbeitsbereichs des Agenten. Slug und Force-Wert müssen mit der
    ursprünglichen `skills.upload.begin`-Anfrage übereinstimmen. Wird abgelehnt, sofern nicht
    `skills.install.allowUploadedArchives` aktiviert ist; die Einstellung wirkt sich nicht
    auf ClawHub-Installationen aus.
  - Gateway-Installationsmodus: `{ name, installId, timeoutMs? }` führt eine deklarierte
    `metadata.openclaw.install`-Aktion auf dem Gateway-Host aus. Ältere Clients senden möglicherweise
    weiterhin `dangerouslyForceUnsafeInstall`; dieses Feld ist veraltet,
    wird nur aus Gründen der Protokollkompatibilität akzeptiert und ignoriert. Verwenden Sie
    `security.installPolicy` für vom Operator verantwortete Installationsentscheidungen.
- `skills.update` (`operator.admin`) hat zwei Modi:
  - Der ClawHub-Modus aktualisiert einen nachverfolgten Slug oder alle nachverfolgten ClawHub-Installationen im
    Standardarbeitsbereich des Agenten.
  - Der Konfigurationsmodus ändert `skills.entries.<skillKey>`-Werte wie `enabled`,
    `apiKey` und `env`.

### `models.list`-Ansichten

`models.list` akzeptiert einen optionalen `view`-Parameter
(`src/agents/model-catalog-visibility.ts`):

- Ausgelassen oder `"default"`: Wenn `agents.defaults.models` konfiguriert ist, enthält die
  Antwort den zulässigen Katalog einschließlich dynamisch ermittelter Modelle
  für `provider/*`-Einträge. Andernfalls enthält die Antwort den vollständigen Gateway-
  Katalog.
- `"configured"`: Verhalten in Auswahlgröße. Wenn `agents.defaults.models`
  konfiguriert ist, hat es weiterhin Vorrang, einschließlich der Provider-spezifischen Ermittlung für
  `provider/*`-Einträge. Ohne Positivliste verwendet die Antwort explizite
  `models.providers.<provider>.models`-Einträge und greift nur dann auf den vollständigen
  Katalog zurück, wenn keine konfigurierten Modellzeilen vorhanden sind.
- `"provider-config"`: vom Quellcode definierter `models.providers.*.models`-Bestand,
  unabhängig von Positivlisten der Auswahl. Zeilen enthalten öffentliche Modellfähigkeiten und
  routenbezogene Verfügbarkeit, lassen jedoch Provider-Endpunkte, Authentifizierungsmaterial und
  Laufzeit-Anfragekonfiguration aus.
- `"all"`: vollständiger Gateway-Katalog unter Umgehung von `agents.defaults.models`. Für
  Diagnose-/Ermittlungsoberflächen verwenden, nicht für normale Modellauswahlen.

## Ausführungsgenehmigungen

- Wenn eine Ausführungsanfrage eine Genehmigung benötigt, sendet das Gateway
  `exec.approval.requested`.
- Operator-Clients lösen sie durch Aufruf von `exec.approval.resolve` auf (erfordert
  `operator.approvals`).
- Für `host=node` muss `exec.approval.request` `systemRunPlan`
  enthalten (kanonische `argv`-/`cwd`-/`rawCommand`-/Sitzungsmetadaten). Anfragen ohne
  `systemRunPlan` werden abgelehnt.
- Nach der Genehmigung verwenden weitergeleitete `node.invoke system.run`-Aufrufe diese
  kanonische `systemRunPlan` als maßgeblichen Befehls-/Arbeitsverzeichnis-/Sitzungskontext.
- Wenn ein Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` zwischen der Vorbereitung und der endgültigen genehmigten `system.run`-Weiterleitung ändert,
  lehnt das Gateway die Ausführung ab, anstatt der geänderten Nutzlast zu vertrauen.

## Fallback bei Agent-Zustellung

- `agent`-Anfragen können `deliver=true` enthalten, um eine ausgehende Zustellung anzufordern.
- `bestEffortDeliver=false` (der Standardwert) behält das strikte Verhalten bei: Nicht auflösbare oder
  ausschließlich interne Zustellziele geben `INVALID_REQUEST` zurück.
- `bestEffortDeliver=true` ermöglicht den Fallback auf eine reine Sitzungsausführung, wenn keine
  extern zustellbare Route aufgelöst werden kann (beispielsweise interne/Webchat-
  Sitzungen oder mehrdeutige Mehrkanalkonfigurationen).
- Endgültige `agent`-Ergebnisse können `result.deliveryStatus` enthalten, wenn eine Zustellung
  angefordert wurde, und verwenden dabei dieselben Statuswerte `sent`, `suppressed`, `partial_failed` und
  `failed`, die für
  [`openclaw agent --json --deliver`](/de/cli/agent#json-delivery-status) dokumentiert sind.

## Versionierung

- `PROTOCOL_VERSION`, `MIN_CLIENT_PROTOCOL_VERSION`,
  `MIN_NODE_PROTOCOL_VERSION` und `MIN_PROBE_PROTOCOL_VERSION` befinden sich in
  `packages/gateway-protocol/src/version.ts`.
- Clients senden `minProtocol` + `maxProtocol`. Operator- und UI-Clients müssen
  das aktuelle Protokoll in diesem Bereich einschließen; aktuelle Clients und Server verwenden
  Protokoll v4.
- Authentifizierte Clients mit sowohl `role: "node"` als auch `client.mode: "node"`
  können das N-1-Node-Protokoll verwenden (derzeit v3). Leichtgewichtige Neustartprüfungen verwenden
  dasselbe N-1-Fenster. Geräteauthentifizierung, Kopplung, Geltungsbereiche, Befehlsrichtlinie und Ausführungs-
  genehmigungen bleiben durch dieses Kompatibilitätsfenster unverändert. Plugin-eigene Node-
  Fähigkeiten und Befehle werden zurückgehalten, bis die Node auf das aktuelle
  Protokoll aktualisiert wurde, da ihre bereitgestellten Oberflächen nicht Teil des N-1-Vertrags sind.
- Schemas und Modelle werden aus TypeBox-Definitionen generiert:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Client-Konstanten

Die Referenzimplementierung des Clients befindet sich in `packages/gateway-client/src/`
(OpenClaw bindet sie über die schlanke `src/gateway/client.ts`-Fassade ein). Diese
Standardwerte sind über Protokoll v4 hinweg stabil und bilden die erwartete Ausgangsbasis für
Drittanbieter-Clients.

| Konstante                                 | Standardwert                                          | Quelle                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| Anfrage-Timeout (pro RPC)                 | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                              |
| Timeout für Vorabauthentifizierung/Verbindungsaufforderung | `15_000` ms                                           | `packages/gateway-client/src/timeouts.ts` (die Umgebungsvariable `OPENCLAW_HANDSHAKE_TIMEOUT_MS` kann das gekoppelte Server-/Client-Budget erhöhen) |
| Anfängliche Verzögerung für Neuverbindung | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Maximale Verzögerung für Neuverbindung    | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`GATEWAY_RECONNECT_POLICY`)                                                      |
| Begrenzung für schnellen Wiederholungsversuch nach Schließen wegen Geräte-Token | `250` ms                                              | `packages/gateway-client/src/client.ts`                                                                                   |
| Schonfrist für erzwungenes Beenden vor `terminate()` | `250` ms                                              | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| Standard-Timeout für `stopAndWait()`   | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| Standardmäßiges Tick-Intervall (vor `hello-ok`) | `30_000` ms                                           | `packages/gateway-client/src/client.ts`                                                                                   |
| Schließen bei Tick-Timeout                | Code `4000`, wenn die Stille `tickIntervalMs * 2` überschreitet | `packages/gateway-client/src/client.ts`                                                                                   |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

Der Server gibt die effektiven Werte für `policy.tickIntervalMs`,
`policy.maxPayload` und `policy.maxBufferedBytes` in `hello-ok` bekannt; Clients
sollten diese Werte anstelle der Standardwerte vor dem Handshake berücksichtigen.

Der Referenz-Client lässt endliche Anfragen ihre konfigurierte Frist selbst verwalten, wenn
jede ausstehende Anfrage eine solche besitzt. Eine `expectFinal`-Anfrage ohne endlichen
`timeoutMs`, eine Anfrage mit `timeoutMs: null` oder eine Mischung aus endlichen und
unbegrenzten Anfragen hält den Tick-Watchdog aktiv. Wenn eingehende Ereignisse und
Antworten über den Tick-Timeout-Schwellenwert hinaus ausbleiben, schließt der Client den
Socket mit Code `4000`, lehnt jede ausstehende Anfrage ab und stellt die Verbindung erneut her. Er
wiederholt abgelehnte Anfragen nach der erneuten Verbindung nicht.

## Authentifizierung

- Die Gateway-Authentifizierung mit gemeinsamem Geheimnis verwendet `connect.params.auth.token` oder
  `connect.params.auth.password`, abhängig von der konfigurierten
  `gateway.auth.mode` (`"none" | "token" | "password" | "trusted-proxy"`).
- Identitätstragende Modi wie Tailscale Serve (`gateway.auth.allowTailscale: true`)
  oder `gateway.auth.mode: "trusted-proxy"` außerhalb des Loopbacks erfüllen die
  Authentifizierungsprüfung beim Verbindungsaufbau anhand der Anfrage-Header statt anhand von `connect.params.auth.*`.
- Bei privatem Ingress überspringt `gateway.auth.mode: "none"` die Verbindungs­authentifizierung
  mit gemeinsamem Geheimnis vollständig; stellen Sie diesen Modus nicht über öffentlichen/nicht vertrauenswürdigen Ingress bereit.
- Nach dem Pairing stellt das Gateway ein Geräte-Token aus, dessen Gültigkeitsbereich
  auf Verbindungsrolle und Scopes beschränkt ist und das in `hello-ok.auth.deviceToken` zurückgegeben wird. Clients sollten
  es nach jeder erfolgreichen Verbindung dauerhaft speichern.
- Bei einer erneuten Verbindung mit diesem gespeicherten Geräte-Token sollte auch der gespeicherte
  genehmigte Scope-Satz für dieses Token wiederverwendet werden. Dadurch bleiben bereits gewährte
  Lese-, Prüf- und Statuszugriffe erhalten, und erneute Verbindungen werden nicht unbemerkt
  auf einen engeren, impliziten, ausschließlich administrativen Scope reduziert.
- Clientseitige Zusammenstellung der Authentifizierung für den Verbindungsaufbau (`selectConnectAuth` in
  `packages/gateway-client/src/client.ts`):
  - `auth.password` ist unabhängig davon und wird immer weitergeleitet, wenn es festgelegt ist.
  - `auth.token` wird in folgender Prioritätsreihenfolge befüllt: zuerst ein explizites gemeinsames Token,
    dann ein explizites `deviceToken`, anschließend ein gespeichertes gerätespezifisches Token (indiziert nach
    `deviceId` + `role`).
  - `auth.bootstrapToken` wird nur gesendet, wenn keine der obigen Optionen
    `auth.token` aufgelöst hat. Ein gemeinsames Token oder ein beliebiges aufgelöstes Geräte-Token unterdrückt es.
  - Die automatische Hochstufung eines gespeicherten Geräte-Tokens beim einmaligen
    `AUTH_TOKEN_MISMATCH`-Wiederholungsversuch ist ausschließlich auf vertrauenswürdige Endpunkte beschränkt: Loopback
    oder `wss://` mit einem angehefteten `tlsFingerprint`. Öffentliches `wss://` ohne Pinning
    erfüllt diese Voraussetzung nicht.
- Der integrierte Bootstrap über einen Einrichtungscode gibt den primären Node
  `hello-ok.auth.deviceToken` sowie ein begrenztes Operator-Token in
  `hello-ok.auth.deviceTokens` für die vertrauenswürdige Übergabe an Mobilgeräte zurück. Das Operator-Token
  enthält `operator.talk.secrets` für native Lesezugriffe auf die Talk-Konfiguration, schließt jedoch
  Scopes zur Änderung des Pairings und `operator.admin` aus.
- Während ein Bootstrap mit einem nicht standardmäßigen Einrichtungscode auf die Genehmigung wartet,
  enthalten die Details von `PAIRING_REQUIRED` `recommendedNextStep: "wait_then_retry"`,
  `retryable: true` und `pauseReconnect: false`. Stellen Sie weiterhin mit demselben
  Bootstrap-Token erneut eine Verbindung her, bis die Anfrage genehmigt wird oder das Token
  ungültig wird.
- Speichern Sie `hello-ok.auth.deviceTokens` nur dauerhaft, wenn die Verbindung die Bootstrap-
  Authentifizierung über einen vertrauenswürdigen Transport wie `wss://` oder lokales/Loopback-Pairing verwendet hat.
- Wenn ein Client ein explizites `deviceToken` oder ein explizites `scopes` bereitstellt, bleibt dieser
  vom Aufrufer angeforderte Scope-Satz maßgeblich; zwischengespeicherte Scopes werden nur
  wiederverwendet, wenn der Client das gespeicherte gerätespezifische Token erneut verwendet.
- Geräte-Tokens können über `device.token.rotate` und
  `device.token.revoke` rotiert/widerrufen werden (erfordert `operator.pairing`). Das Rotieren oder Widerrufen eines
  Node oder einer anderen Nicht-Operator-Rolle erfordert außerdem `operator.admin`.
- `device.token.rotate` gibt Rotationsmetadaten zurück. Das Ersatz-
  Bearer-Token wird nur bei Aufrufen desselben Geräts zurückgegeben, die bereits mit diesem
  Geräte-Token authentifiziert wurden, sodass Clients, die ausschließlich Tokens verwenden, den Ersatz vor
  der erneuten Verbindung dauerhaft speichern können. Bei Rotationen über gemeinsame/administrative Authentifizierung wird das Bearer-Token nicht zurückgegeben.
- Ausstellung, Rotation und Widerruf von Tokens bleiben auf den genehmigten Rollensatz
  beschränkt, der im Pairing-Eintrag dieses Geräts verzeichnet ist; eine Token-Änderung kann keine
  Geräterolle erweitern oder ansprechen, die bei der Pairing-Genehmigung nie gewährt wurde.
- Bei Token-Sitzungen gekoppelter Geräte ist die Geräteverwaltung auf das eigene Gerät beschränkt, sofern
  der Aufrufer nicht zusätzlich über `operator.admin` verfügt: Nicht administrative Aufrufer können nur das
  Operator-Token für ihren eigenen Geräteeintrag verwalten. Die Verwaltung von Node- und anderen
  Nicht-Operator-Tokens ist ausschließlich Administratoren vorbehalten, selbst für das eigene Gerät des Aufrufers.
- `device.token.rotate` und `device.token.revoke` prüfen außerdem den Scope-Satz des
  Ziel-Operator-Tokens anhand der aktuellen Sitzungsscopes des Aufrufers.
  Nicht administrative Aufrufer können kein Operator-Token rotieren oder widerrufen, dessen Scope breiter ist als der,
  über den sie bereits verfügen.
- Authentifizierungsfehler enthalten `error.details.code` sowie Hinweise zur Wiederherstellung:
  - `error.details.canRetryWithDeviceToken` (boolescher Wert)
  - `error.details.recommendedNextStep`: eines von `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry`, `review_auth_configuration`
    (`packages/gateway-protocol/src/connect-error-details.ts`).
- Clientverhalten für `AUTH_TOKEN_MISMATCH`:
  - Vertrauenswürdige Clients dürfen einen einzigen begrenzten Wiederholungsversuch mit einem zwischengespeicherten gerätespezifischen
    Token unternehmen.
  - Wenn dieser Wiederholungsversuch fehlschlägt, beenden Sie automatische Schleifen zur erneuten Verbindungsherstellung und zeigen Sie
    dem Operator Handlungshinweise an.
- `AUTH_SCOPE_MISMATCH` bedeutet, dass das Geräte-Token erkannt wurde, aber
  die angeforderte Rolle bzw. die angeforderten Scopes nicht abdeckt. Stellen Sie dies nicht als ungültiges Token dar; fordern Sie
  den Operator auf, das Gerät erneut zu koppeln oder den engeren bzw. breiteren Scope-Vertrag zu genehmigen.

## Geräteidentität und Pairing

- Nodes sollten eine stabile Geräteidentität (`device.id`) enthalten, die aus dem
  Fingerabdruck eines Schlüsselpaars abgeleitet wird.
- Gateways stellen Tokens pro Gerät und Rolle aus.
- Für neue Geräte-IDs sind Pairing-Genehmigungen erforderlich, sofern die lokale
  automatische Genehmigung nicht aktiviert ist.
- Die automatische Pairing-Genehmigung ist auf direkte lokale Loopback-Verbindungen ausgerichtet.
- OpenClaw verfügt außerdem über einen eng begrenzten, Backend-/Container-lokalen Selbstverbindungspfad für
  vertrauenswürdige Hilfsabläufe mit gemeinsamem Geheimnis.
- Tailnet- oder LAN-Verbindungen auf demselben Host werden beim Pairing weiterhin als remote
  behandelt und erfordern eine Genehmigung.
- WS-Clients enthalten während `connect` normalerweise die Identität `device` (Operator +
  Node). Die einzigen Operator-Ausnahmen ohne Gerät sind explizite Vertrauenspfade:
  - `gateway.controlUi.allowInsecureAuth=true` für unsichere HTTP-Kompatibilität,
    die ausschließlich auf localhost beschränkt ist.
  - erfolgreiche Operator-Authentifizierung der Control UI über `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (Notfallzugriff, erhebliche
    Herabstufung der Sicherheit).
  - Direkte Loopback-Backend-RPCs über `gateway-client` auf dem reservierten internen
    Hilfspfad.
- Das Auslassen der Geräteidentität hat Folgen für die Scopes. Wenn eine
  Operator-Verbindung ohne Gerät über einen expliziten Vertrauenspfad zugelassen wird, löscht OpenClaw
  selbst deklarierte Scopes dennoch und setzt sie auf eine leere Menge, sofern dieser Pfad keine
  benannte Ausnahme zur Beibehaltung von Scopes aufweist. Scope-geschützte Methoden schlagen dann mit
  `missing scope` fehl.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` ist ein Notfallpfad der Control UI
  zur Beibehaltung von Scopes. Er gewährt beliebigen benutzerdefinierten Backend- oder CLI-artigen
  WebSocket-Clients keine Scopes.
- Der reservierte direkte Loopback-Backend-Hilfspfad `gateway-client` behält
  Scopes nur für interne lokale Control-Plane-RPCs bei; benutzerdefinierte Backend-IDs erhalten
  diese Ausnahme nicht.
- Alle Verbindungen müssen den vom Server bereitgestellten Nonce `connect.challenge` signieren.

### Migrationsdiagnose für die Geräteauthentifizierung

Für ältere Clients, die noch das Signaturverhalten vor Einführung der Challenge verwenden, gibt `connect`
unter `error.details.code` die Detailcodes `DEVICE_AUTH_*` mit einem stabilen
`error.details.reason` zurück.

Häufige Migrationsfehler:

| Nachricht                   | details.code                     | details.reason           | Bedeutung                                          |
| --------------------------- | -------------------------------- | ------------------------ | -------------------------------------------------- |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Der Client hat `device.nonce` ausgelassen (oder leer gesendet). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Der Client hat mit einem veralteten/falschen Nonce signiert. |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Die Signaturnutzlast entspricht nicht der v2-Nutzlast. |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Der signierte Zeitstempel liegt außerhalb der zulässigen Abweichung. |
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` entspricht nicht dem Fingerabdruck des öffentlichen Schlüssels. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/Kanonisierung des öffentlichen Schlüssels ist fehlgeschlagen. |

Migrationsziel:

- Warten Sie immer auf `connect.challenge`.
- Signieren Sie die v2-Nutzlast, die den Server-Nonce enthält.
- Senden Sie denselben Nonce in `connect.params.device.nonce`.
- Die bevorzugte Signaturnutzlast ist `v3`
  (`buildDeviceAuthPayloadV3` in `packages/gateway-client/src/device-auth.ts`),
  die zusätzlich zu den Feldern für Gerät/Client/Rolle/Scopes/Token/Nonce auch
  `platform` und `deviceFamily` bindet.
- Ältere `v2`-Signaturen werden aus Kompatibilitätsgründen weiterhin akzeptiert, doch das Anheften
  der Metadaten gekoppelter Geräte steuert bei einer erneuten Verbindung weiterhin die Befehlsrichtlinie.

## TLS und Pinning

- TLS wird für WS-Verbindungen unterstützt (`gateway.tls`-Konfiguration).
- Clients können den Zertifikatsfingerabdruck des Gateways optional über
  `gateway.remote.tlsFingerprint` oder die CLI-Option `--tls-fingerprint` anheften.

## Umfang

Dieses Protokoll stellt die vollständige Gateway-API bereit: Status, Kanäle, Modelle, Chat,
Agent, Sitzungen, Nodes, Genehmigungen und mehr. Der genaue Umfang wird durch
die aus `packages/gateway-protocol/src/schema.ts` erneut exportierten TypeBox-Schemas definiert.

## Verwandte Themen

- [Bridge-Protokoll](/de/gateway/bridge-protocol)
- [Gateway-Betriebshandbuch](/de/gateway)
