---
read_when:
    - Implementieren oder Aktualisieren von Gateway-WS-Clients
    - Debugging von Protokollabweichungen oder Verbindungsfehlern
    - Protokollschema/-modelle neu generieren
summary: 'Gateway-WebSocket-Protokoll: Handshake, Frames, Versionierung'
title: Gateway-Protokoll
x-i18n:
    generated_at: "2026-07-12T21:39:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d71b75d49bf8a1ea2d835b1d8e532b1d01e87e8b64d6ab7dcb00f28791d3b8ac
    source_path: gateway/protocol.md
    workflow: 16
---

Das Gateway-WS-Protokoll ist die zentrale Steuerungsebene und der einzige Node-Transport für
OpenClaw. Operator- und Node-Clients (CLI, Web-UI, macOS-App, iOS-/Android-Nodes,
headless Nodes) stellen eine WebSocket-Verbindung her und deklarieren beim
Handshake eine **Rolle** und einen **Scope**.

## Transport und Framing

- WebSocket, Text-Frames, JSON-Payloads.
- Der erste Frame **muss** eine `connect`-Anfrage sein.
- Frames vor dem Verbindungsaufbau sind auf 64 KiB (`MAX_PREAUTH_PAYLOAD_BYTES`) begrenzt. Nach dem
  Handshake gelten `hello-ok.policy.maxPayload` und
  `hello-ok.policy.maxBufferedBytes`. Bei aktivierter Diagnose lösen übergroße
  eingehende Frames und langsame ausgehende Puffer `payload.large`-Ereignisse aus, bevor
  das Gateway die Verbindung schließt oder den Frame verwirft. Diese Ereignisse enthalten `surface`,
  Bytegrößen, Grenzwerte und einen sicheren Ursachencode, jedoch niemals Nachrichteninhalte,
  Inhalte von Anhängen, rohe Frame-Bytes, Tokens, Cookies oder Geheimnisse.

Frame-Formate:

- Anfrage: `{type:"req", id, method, params}`
- Antwort: `{type:"res", id, ok, payload|error}`
- Ereignis: `{type:"event", event, payload, seq?, stateVersion?}`

Methoden mit Nebenwirkungen erfordern Idempotenzschlüssel (siehe Schema).

## Handshake

Das Gateway sendet eine Challenge vor dem Verbindungsaufbau:

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

`server`, `features`, `snapshot`, `policy` und `auth` werden alle von
`HelloOkSchema` (`packages/gateway-protocol/src/schema/frames.ts`) verlangt. `auth`
meldet die ausgehandelte Rolle und die ausgehandelten Scopes auch dann, wenn kein Geräte-Token ausgegeben wird (Format
oben). `pluginSurfaceUrls` ist optional und ordnet Namen von Plugin-Oberflächen (z. B.
`canvas`) bereichsgebundene gehostete URLs zu; der Eintrag kann ablaufen, daher rufen Nodes
`node.pluginSurface.refresh` mit `{ "surface": "canvas" }` auf, um einen neuen Eintrag zu erhalten.
Der veraltete Pfad `canvasHostUrl` / `canvasCapability` / `node.canvas.capability.refresh`
wird nicht unterstützt; verwenden Sie Plugin-Oberflächen.

Während das Gateway den Start von Sidecars noch abschließt, kann `connect` einen
wiederholbaren `UNAVAILABLE`-Fehler mit `details.reason: "startup-sidecars"` und
`retryAfterMs` zurückgeben. Wiederholen Sie den Versuch innerhalb Ihres Verbindungsbudgets, statt dies als
endgültigen Handshake-Fehler zu behandeln.

Wenn ein Geräte-Token ausgegeben wird, wird es zu `hello-ok.auth` hinzugefügt:

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

Der integrierte Bootstrap über QR-/Einrichtungscode ist ein Übergabepfad für Mobilgeräte. Eine erfolgreiche
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
Operator-Schleife und die native Einrichtung zu starten, einschließlich `operator.talk.secrets` zum Lesen
der Talk-Konfiguration, enthält jedoch keine Scopes zum Ändern von Kopplungen und kein `operator.admin`. Umfassenderer
Kopplungs-/Admin-Zugriff erfordert einen separaten genehmigten Kopplungs- oder Token-Ablauf. Speichern Sie
`hello-ok.auth.deviceTokens` nur, wenn die Bootstrap-Authentifizierung über einen vertrauenswürdigen
Transport (`wss://` oder Loopback/lokale Kopplung) erfolgte.

Vertrauenswürdige Backend-Clients im selben Prozess (`client.id: "gateway-client"`,
`client.mode: "backend"`) dürfen bei direkten Loopback-Verbindungen `device` auslassen, wenn
sie sich mit dem gemeinsamen Gateway-Token/-Passwort authentifizieren. Dieser Pfad ist
internen Steuerungsebenen-RPCs vorbehalten (z. B. Sitzungsaktualisierungen von Unteragenten) und verhindert,
dass veraltete CLI-/Gerätekopplungs-Baselines lokale Backend-Arbeit blockieren. Entfernte,
browserbasierte, Node- und explizite Geräte-Token-/Geräteidentitäts-Clients durchlaufen weiterhin
die normalen Prüfungen für Kopplung und Scope-Erweiterungen.

### Worker-Rolle und geschlossenes Protokoll

Cloud-Worker verwenden einen dedizierten Loopback-Eingang über den Gateway-eigenen,
an Hostschlüssel gebundenen SSH-Tunnel. Er akzeptiert ausschließlich Worker-Identitäten und leitet niemals
allgemeine Authentifizierung, Node-Ereignisse, Operator-RPCs oder Plugin-Methoden weiter. Ein striktes `connect`
prüft einen im Ruhezustand gehashten, kurzlebigen Berechtigungsnachweis, der an die Umgebung, den Bundle-
Hash, die Owner-Epoche, die RPC-Set-Version, die Ablaufzeit und eine optionale einzelne Sitzung gebunden ist; außerdem
werden die aktuelle Version und der Funktionsumfang separat geprüft. Bei Erfolg wird ein minimales
`worker-hello-ok` zurückgegeben; die Funktionsaushandlung ist von der allgemeinen Protokollversion
unabhängig. Frames bleiben unter 64 KiB. Die geschlossene Positivliste enthält
`worker.heartbeat`, `worker.transcript.commit` und `worker.live-event`.
Transkript-Commits verwenden Owner-Epochen-Fencing, eine Gateway-eigene Sitzungsbindung, Base-Leaf-
Compare-and-Swap und dauerhafte Sequenzwiedergabe; das Gateway erzeugt Transkript-
Eintrags- und übergeordnete IDs über den normalen Sitzungsschreiber. Eigentümerschaft und Ablauf werden
bei jedem RPC erneut geprüft.

### Client-Fähigkeiten

Operator-Clients können in `connect.params.caps` optionale Fähigkeiten bekannt geben:

- `tool-events`: akzeptiert strukturierte Ereignisse zum Tool-Lebenszyklus.
- `inline-widgets`: kann gehostete Ergebnisse von Inline-Widget-Tools darstellen.

Client-Fähigkeiten beschreiben den verbundenen Client, nicht die Autorisierung. Agent-Tools können erforderliche Fähigkeiten deklarieren; das Gateway lässt diese Tools weg, sofern nicht jede Anforderung in den `caps` des ursprünglichen Clients enthalten ist. Von Kanälen initiierte Ausführungen besitzen keine Gateway-Client-Fähigkeiten, sodass fähigkeitsbeschränkte Tools auch dann nicht verfügbar sind, wenn die Tool-Richtlinie sie ausdrücklich erlaubt.

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

Nodes deklarieren beim Verbindungsaufbau Angaben zu ihren Fähigkeiten:

- `caps`: übergeordnete Kategorien wie `camera`, `canvas`, `screen`,
  `location`, `voice`, `talk`.
- `commands`: Positivliste der Befehle für Aufrufe.
- `permissions`: granulare Schalter (z. B. `screen.record`, `camera.capture`).

Das Gateway behandelt diese Angaben als Behauptungen und erzwingt serverseitige Positivlisten.

## Rollen und Scopes

Das vollständige Modell der Operator-Scopes, Prüfungen zum Genehmigungszeitpunkt und die
Semantik gemeinsamer Geheimnisse finden Sie unter [Operator-Scopes](/de/gateway/operator-scopes).

Rollen:

- `operator`: Client der Steuerungsebene (CLI/UI/Automatisierung).
- `node`: Host für Fähigkeiten (Kamera/Bildschirm/Canvas/system.run).
- `worker`: Cloud-Ausführungshost im dedizierten, geschlossenen Worker-Protokoll.

Operator-Scopes (`src/gateway/operator-scopes.ts`), die vollständige geschlossene Menge:

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`
- `operator.talk.secrets`

`talk.config` mit `includeSecrets: true` erfordert `operator.talk.secrets` (oder
`operator.admin`). Wenn Geheimnisse enthalten sind, lesen Sie den Berechtigungsnachweis des aktiven Talk-Providers
aus `talk.resolved.config.apiKey`; `talk.providers.<id>.apiKey`
behält das Format der Quelle bei und kann ein SecretRef-Objekt oder eine redigierte Zeichenfolge sein.

Durch Plugins registrierte Gateway-RPC-Methoden können einen eigenen Operator-Scope anfordern,
diese reservierten Kernpräfixe werden jedoch immer zu `operator.admin`
(`src/shared/gateway-method-policy.ts`) aufgelöst: `config.*`, `exec.approvals.*`,
`wizard.*`, `update.*`.

Der Methoden-Scope ist nur die erste Zugriffsschranke. Einige über
`chat.send` erreichbare Slash-Befehle wenden strengere Prüfungen auf Befehlsebene an: Dauerhafte Schreibvorgänge mit `/config set` und
`/config unset` erfordern `operator.admin`, selbst bei Gateway-Clients, die
bereits einen niedrigeren Operator-Scope besitzen.

`node.pair.approve` verfügt zusätzlich zum grundlegenden
Methoden-Scope (`operator.pairing`) über eine weitere Scope-Prüfung zum Genehmigungszeitpunkt, die auf den deklarierten
`commands` der ausstehenden Anfrage basiert (`src/infra/node-pairing-authz.ts`):

| Deklarierte Befehle                                            | Erforderliche Scopes                    |
| -------------------------------------------------------------- | --------------------------------------- |
| keine                                                          | `operator.pairing`                      |
| Nicht-Ausführungsbefehle                                       | `operator.pairing` + `operator.write`   |
| enthält `system.run`, `system.run.prepare` oder `system.which` | `operator.pairing` + `operator.admin`   |

### Caps/Befehle/Berechtigungen (Node)

Nodes deklarieren beim Verbindungsaufbau Angaben zu ihren Fähigkeiten:

- `caps`: übergeordnete Fähigkeitskategorien wie `camera`, `canvas`, `screen`,
  `location`, `voice` und `talk`.
- `commands`: Positivliste der Befehle für Aufrufe.
- `permissions`: granulare Schalter (z. B. `screen.record`, `camera.capture`).

Das Gateway behandelt diese Angaben als **Behauptungen** und erzwingt serverseitige Positivlisten.
Verbundene Nodes können nach einer erfolgreichen Verbindung oder
Wiederverbindung mit `node.pluginTools.update` optionale, für Agenten sichtbare Deskriptoren für Plugin- oder MCP-Tools
veröffentlichen. Headless-Node-Hosts werden neu gestartet, um Änderungen am deklarativen MCP-Inventar
anzuwenden. Diese Aktualisierungsmethode ist der einzige Veröffentlichungsweg; Deskriptoren für Plugin-Tools werden nicht in
`connect`-Parametern akzeptiert. Jeder Deskriptor muss einen providersicheren Tool-`name` verwenden und einen
`command` aus der aktuellen Befehlspositivliste des Nodes angeben. Das Gateway vertraut den Deskriptor-
Metadaten des gekoppelten Nodes, filtert Deskriptoren außerhalb der genehmigten Befehlsoberfläche,
entfernt sie, wenn der Node die Verbindung trennt, und weist Versuche von Operatoren zurück,
den Katalog eines anderen Nodes zu ändern. Setzen Sie `gateway.nodes.pluginTools.enabled: false`,
um von Nodes veröffentlichte Deskriptoren zu ignorieren.

Verbundene Node-Hosts veröffentlichen ihren vollständigen Skill-Ersatzkatalog mit
`node.skills.update`. Diese Node-Rollenmethode ist der einzige Veröffentlichungsweg für Node-Skills;
Skills werden nicht in `connect`-Parametern akzeptiert. Jeder Deskriptor enthält einen
sicheren Namen, eine Beschreibung und begrenzten `SKILL.md`-Inhalt. Das Gateway analysiert diesen
Inhalt mit dem normalen Skills-Loader, nimmt ihn in Snapshots der Agent-Skills auf,
solange der Node verbunden ist, und entfernt ihn bei der Trennung. Setzen Sie
`gateway.nodes.skills.enabled: false`, um von Nodes veröffentlichte Skills zu ignorieren.

## Präsenz

- `system-presence` gibt nach Geräteidentität indizierte Einträge zurück, einschließlich
  `deviceId`, `roles` und `scopes`, sodass Benutzeroberflächen auch dann eine Zeile pro Gerät anzeigen können,
  wenn es sowohl als Operator als auch als Node verbunden ist.
- `node.list` enthält optional `lastSeenAtMs` und `lastSeenReason`. Verbundene
  Nodes melden die aktuelle Verbindungszeit mit dem Grund `connect`; gekoppelte Nodes können
  über ein vertrauenswürdiges Node-Ereignis auch dauerhafte Hintergrundpräsenz melden.

Native macOS-Nodes können außerdem authentifizierte `node.presence.activity`-Ereignisse
mit einer begrenzten Leerlaufzeit für Eingaben senden. Der Gateway leitet Aktivitätszeitstempel
anhand seiner eigenen Uhr ab, stellt den zuletzt aktiven verbundenen Mac über `node.list` und
`node.describe` bereit und sendet `node.presence`-Aktualisierungen an Clients mit Leseberechtigung.
Weitere Informationen zu Auswahl, Datenschutz, Modellkontext und Verhalten beim
Benachrichtigungsrouting finden Sie unter [Präsenz aktiver Computer](/de/nodes/presence).

### Hintergrundereignis für aktiven Node

Nodes rufen `node.event` mit `event: "node.presence.alive"` auf, um zu erfassen, dass ein
gekoppelter Node während einer Aktivierung im Hintergrund aktiv war, ohne ihn als verbunden zu markieren:

```json
{
  "event": "node.presence.alive",
  "payloadJSON": "{\"trigger\":\"silent_push\",\"sentAtMs\":1737264000000,\"displayName\":\"Peter's iPhone\",\"version\":\"2026.4.28\",\"platform\":\"iOS 18.4.0\",\"deviceFamily\":\"iPhone\",\"modelIdentifier\":\"iPhone17,1\",\"pushTransport\":\"relay\"}"
}
```

`trigger` ist eine geschlossene Enumeration: `background`, `silent_push`, `bg_app_refresh`,
`significant_location`, `manual`, `connect`. Unbekannte Werte werden zu
`background` normalisiert (`src/shared/node-presence.ts`). Das Ereignis wird nur für
authentifizierte Node-Gerätesitzungen dauerhaft gespeichert; Sitzungen ohne Gerät oder
ohne Kopplung geben `handled: false` zurück.

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

## Geltungsbereich von Broadcast-Ereignissen

Vom Server übertragene Broadcast-Ereignisse werden anhand des Geltungsbereichs eingeschränkt, sodass
Sitzungen, die auf Kopplung beschränkt oder ausschließlich für Nodes vorgesehen sind, nicht passiv
Sitzungsinhalte empfangen
(`src/gateway/server-broadcast.ts`):

- Frames für Chat, Agent und Werkzeugergebnisse (gestreamte `agent`-Ereignisse,
  Werkzeugergebnis-Ereignisse) erfordern mindestens `operator.read`. Sitzungen ohne diese
  Berechtigung überspringen diese Frames vollständig.
- Von Plugins definierte `plugin.*`-Broadcasts sind standardmäßig auf `operator.write` oder
  `operator.admin` beschränkt; explizite Einträge wie
  `plugin.approval.requested` / `plugin.approval.resolved` verwenden stattdessen
  `operator.approvals`.
- Status-/Transportereignisse (`heartbeat`, `presence`, `tick`, Lebenszyklus von
  Verbindungsaufbau/-trennung) bleiben uneingeschränkt, damit der Transportzustand für jede
  authentifizierte Sitzung sichtbar ist.
- Unbekannte Familien von Broadcast-Ereignissen werden standardmäßig anhand des Geltungsbereichs
  eingeschränkt (Fail-Closed), sofern ein registrierter Handler diese Einschränkung nicht ausdrücklich lockert.

Jede Clientverbindung verwaltet ihre eigene clientspezifische Sequenznummer, sodass Broadcasts
auf diesem Socket monoton geordnet bleiben, selbst wenn verschiedene Clients unterschiedliche,
nach Geltungsbereich gefilterte Teilmengen des Ereignisstroms sehen.

## RPC-Methodenfamilien

`hello-ok.features.methods` ist eine konservative Ermittlungsliste, die aus
`src/gateway/server-methods-list.ts` sowie den exportierten Methoden geladener Plugins/Kanäle
erstellt wird — sie ist kein generierter Auszug jeder Methode, und einige Methoden (zum
Beispiel `push.test`, `web.login.start`, `web.login.wait`, `sessions.usage`)
sind absichtlich von der Ermittlung ausgeschlossen, obwohl sie tatsächlich aufrufbare
Methoden sind. Behandeln Sie dies als Funktionsermittlung, nicht als vollständige Aufzählung von
`src/gateway/server-methods/*.ts`.

<AccordionGroup>
  <Accordion title="System und Identität">
    - `health` gibt den zwischengespeicherten oder neu geprüften Zustands-Snapshot des Gateways zurück.
    - `diagnostics.stability` gibt die zuletzt erfassten, begrenzten Stabilitätsdiagnosen zurück: Ereignisnamen, Anzahlen, Bytegrößen, Speicherwerte, Warteschlangen-/Sitzungsstatus, Kanal-/Plugin-Namen und Sitzungs-IDs. Keine Chattexte, Webhook-Inhalte, Werkzeugausgaben, unformatierten Anfrage-/Antwortinhalte, Token, Cookies oder Secrets. Erfordert `operator.read`.
    - `status` gibt die Gateway-Zusammenfassung im Stil von `/status` zurück; sensible Felder werden nur für Operator-Clients mit Administrator-Geltungsbereich angezeigt.
    - `gateway.identity.get` gibt die Gateway-Geräteidentität zurück, die von Relay- und Kopplungsabläufen verwendet wird.
    - `system-presence` gibt den aktuellen Präsenz-Snapshot für verbundene Operator-/Node-Geräte zurück.
    - `system-event` hängt ein Systemereignis an und kann den Präsenzkontext aktualisieren/senden.
    - `last-heartbeat` gibt das zuletzt dauerhaft gespeicherte Heartbeat-Ereignis zurück.
    - `set-heartbeats` aktiviert oder deaktiviert die Heartbeat-Verarbeitung auf dem Gateway.
    - `gateway.suspend.prepare` erstellt nur dann eine kurze Lease für kooperatives Anhalten, wenn die verfolgte Gateway-Arbeit inaktiv ist. `gateway.suspend.status` prüft diese Lease, und `gateway.suspend.resume` gibt sie nach dem Reaktivieren oder einem abgebrochenen Hostvorgang frei.

  </Accordion>

  <Accordion title="Modelle und Nutzung">
    - `models.list` gibt den zur Laufzeit zugelassenen Modellkatalog zurück. Siehe „`models.list`-Ansichten“ weiter unten.
    - `usage.status` gibt Zusammenfassungen der Provider-Nutzungszeiträume/verbleibenden Kontingente zurück.
    - `usage.cost` gibt aggregierte Kostennutzungszusammenfassungen für einen Datumsbereich zurück. Übergeben Sie `agentId` für einen Agenten oder `agentScope: "all"`, um konfigurierte Agenten zu aggregieren.
    - `doctor.memory.status` gibt die Bereitschaft des Vektorspeichers / zwischengespeicherter Einbettungen für den aktiven Standard-Agenten-Workspace zurück. Übergeben Sie `{ "probe": true }` oder `{ "deep": true }` nur für einen expliziten Live-Ping des Einbettungs-Providers. Übergeben Sie `{ "agentId": "agent-id" }`, um die Statistiken des Dreaming-Speichers auf einen Agenten-Workspace zu beschränken; ohne diese Angabe werden konfigurierte Dreaming-Workspaces aggregiert.
    - `doctor.memory.dreamDiary`, `doctor.memory.backfillDreamDiary`, `doctor.memory.resetDreamDiary`, `doctor.memory.resetGroundedShortTerm`, `doctor.memory.repairDreamingArtifacts` und `doctor.memory.dedupeDreamDiary` akzeptieren optional `{ "agentId": "agent-id" }`; ohne diese Angabe arbeiten sie mit dem konfigurierten Standard-Agenten-Workspace.
    - `doctor.memory.remHarness` gibt eine begrenzte, schreibgeschützte REM-Harness-Vorschau für Remote-Clients der Steuerungsebene zurück, einschließlich Workspace-Pfaden, Speicherausschnitten, gerendertem fundiertem Markdown und Kandidaten für eine tiefgreifende Übernahme. Erfordert `operator.read`.
    - `sessions.usage` gibt Nutzungszusammenfassungen pro Sitzung zurück. Übergeben Sie `agentId` für einen Agenten oder `agentScope: "all"`, um konfigurierte Agenten gemeinsam aufzulisten.
      Beide Nutzungsmethoden akzeptieren `mode: "specific"` mit einer IANA-`timeZone` für DST-gerechte Kalendertagesgrenzen und Intervalle. `utcOffset` wird weiterhin für ältere Clients sowie als Rückfalloption unterstützt, wenn die Gateway-Laufzeit die angeforderte Zone nicht erkennt.
    - `sessions.usage.timeseries` gibt die Zeitreihennutzung für eine Sitzung zurück.
    - `sessions.usage.logs` gibt Nutzungsprotokolleinträge für eine Sitzung zurück.

  </Accordion>

  <Accordion title="Kanäle und Anmeldehilfen">
    - `channels.status` gibt Statuszusammenfassungen integrierter und gebündelter Kanäle/Plugins zurück.
    - `channels.logout` meldet einen bestimmten Kanal/ein bestimmtes Konto ab, sofern der Kanal dies unterstützt.
    - `web.login.start` startet einen QR-/Web-Anmeldeablauf für den aktuellen Webkanal-Provider mit QR-Unterstützung.
    - `web.login.wait` wartet auf den Abschluss dieses Ablaufs und startet bei Erfolg den Kanal.
    - `push.test` sendet eine APNs-Test-Push-Benachrichtigung an einen registrierten iOS-Node.
    - `voicewake.get` gibt die gespeicherten Aktivierungswort-Trigger zurück.
    - `voicewake.set` aktualisiert die Aktivierungswort-Trigger und sendet die Änderung.

  </Accordion>

  <Accordion title="Plugin-Verwaltung">
    - `plugins.list` (`operator.read`) gibt das Inventar der installierten Plugins sowie lokal kuratierte offizielle Empfehlungen, Diagnosen und die Angabe zurück, ob der aktuelle Installationsmodus Änderungen zulässt.
    - `plugins.search` (`operator.read`) sucht nach installierbaren ClawHub-Familien von Code-Plugins und Bundle-Plugins. Übergeben Sie eine nicht leere `query` und optional ein `limit` von 1 bis 100.
    - `plugins.install` (`operator.admin`) installiert entweder einen offiziellen Katalogeintrag mit `{ source: "official", pluginId }` oder ein ClawHub-Paket mit `{ source: "clawhub", packageName, version?, acknowledgeClawHubRisk? }`. ClawHub-Installationen behalten die Vertrauens-, Integritäts- und Installationsrichtlinienprüfungen des Gateways bei. Erfolgreiche Installationen erfordern einen Neustart des Gateways.
    - `plugins.setEnabled` (`operator.admin`) ändert mit `{ pluginId, enabled }` die Aktivierungsrichtlinie eines installierten Plugins. Die Antwort enthält den aktualisierten Katalogeintrag, Neustartmetadaten und alle Warnungen zur Slot-Auswahl.
    - `plugins.uninstall` (`operator.admin`) entfernt mit `{ pluginId }` ein extern installiertes Plugin: Konfigurationsverweise, den Installationsdatensatz und verwaltete Dateien. Gebündelte Plugins können nicht deinstalliert, sondern nur deaktiviert werden. Die Antwort listet die Entfernungsschritte auf und erfordert immer einen Neustart des Gateways.

  </Accordion>

  <Accordion title="Nachrichten und Protokolle">
    - `send` ist der direkte RPC für ausgehende Zustellungen an bestimmte Kanäle/Konten/Threads außerhalb des Chat-Runners.
    - `logs.tail` gibt das Ende des konfigurierten Gateway-Dateiprotokolls mit Cursor-/Limit- und Steuerelementen für die maximale Bytezahl zurück.

  </Accordion>

  <Accordion title="Operator-Terminal">
    - `terminal.open` startet ein Host-PTY für eine explizite `agentId` oder den Standard-Agenten und gibt den aufgelösten Agenten, das Arbeitsverzeichnis, die Shell und den Einschränkungsstatus zurück.
    - `terminal.input`, `terminal.resize` und `terminal.close` arbeiten nur mit Sitzungen, deren Eigentümer die aufrufende Verbindung ist.
    - Die Ereignisse `terminal.data` und `terminal.exit` werden nur an die Verbindung gestreamt, der die Sitzung gehört.
    - Sitzungen, deren Verbindung abbricht, werden getrennt und nicht beendet: Sie können für `gateway.terminal.detachedSessionTimeoutSeconds` (Standardwert 300; `0` stellt das Beenden bei Verbindungstrennung wieder her) erneut angehängt werden, während die letzte Ausgabe in einem begrenzten serverseitigen Puffer gesammelt wird.
    - `terminal.list` gibt anhängbare Sitzungen zurück; `terminal.attach` bindet eine aktive oder getrennte Sitzung erneut an die aufrufende Verbindung und gibt den Wiedergabepuffer zurück (Übernahme im tmux-Stil — ein vorheriger aktiver Eigentümer erhält `terminal.exit` mit dem Grund `detached`); `terminal.text` liest den Puffer als reinen Text, ohne ihn anzuhängen.
    - Jede Terminalmethode erfordert `operator.admin`; `gateway.terminal.enabled` muss explizit auf true gesetzt sein. Vollständig in einer Sandbox ausgeführte Agenten werden abgelehnt, und eine Änderung der Agentenrichtlinie schließt bestehende und laufende PTYs, einschließlich getrennter PTYs.

  </Accordion>

  <Accordion title="Talk und TTS">
    - `talk.catalog` gibt den schreibgeschützten Talk-Provider-Katalog für Sprache, Streaming-Transkription und Echtzeitsprachkommunikation zurück: kanonische Provider-IDs, Registry-Aliasse, Bezeichnungen, Konfigurationsstatus, ein optionales `ready`-Ergebnis auf Gruppenebene, verfügbare Modell-/Stimmen-IDs, kanonische Modi, Transporte, Brain-Strategien sowie Echtzeit-Audio-/Funktions-Flags, ohne Provider-Geheimnisse zurückzugeben oder die globale Konfiguration zu verändern. Aktuelle Gateways setzen `ready` nach Anwendung der Provider-Auswahl zur Laufzeit; behandeln Sie das Fehlen bei älteren Gateways als nicht verifiziert.
    - `talk.config` gibt die effektive Talk-Konfigurationsnutzlast zurück; `includeSecrets` erfordert `operator.talk.secrets` (oder `operator.admin`).
    - `talk.session.create` erstellt eine Gateway-eigene Talk-Sitzung für `realtime/gateway-relay`, `transcription/gateway-relay` oder `stt-tts/managed-room`. Bei `stt-tts/managed-room` müssen Aufrufer mit `operator.write`, die `sessionKey` übergeben, für die bereichsgebundene Sichtbarkeit des Sitzungsschlüssels auch `spawnedBy` übergeben; das Erstellen eines nicht bereichsgebundenen `sessionKey` und `brain: "direct-tools"` erfordern `operator.admin`.
    - `talk.session.join` validiert ein Sitzungstoken für einen verwalteten Raum, gibt bei Bedarf `session.ready` oder `session.replaced` aus und liefert Raum-/Sitzungsmetadaten sowie aktuelle Talk-Ereignisse zurück, jedoch niemals das Klartexttoken oder dessen Hash.
    - `talk.session.appendAudio` hängt Base64-kodierte PCM-Eingabeaudiodaten an Gateway-eigene Echtzeit-Relay- und Transkriptionssitzungen an.
    - `talk.session.startTurn`, `talk.session.endTurn` und `talk.session.cancelTurn` steuern den Turn-Lebenszyklus eines verwalteten Raums und lehnen veraltete Turns ab, bevor der Status gelöscht wird.
    - `talk.session.cancelOutput` stoppt die Audioausgabe des Assistenten, hauptsächlich für VAD-gesteuertes Dazwischensprechen in Gateway-Relay-Sitzungen.
    - `talk.session.submitToolResult` schließt einen Provider-Tool-Aufruf ab, der von einer Gateway-eigenen Echtzeit-Relay-Sitzung ausgegeben wurde. Die Anfrage wartet auf jedes asynchrone Abschlusssignal, das von der Provider-Bridge bereitgestellt wird; fehlgeschlagene Übermittlungen lassen den verknüpften Lauf aktiv und geben kein Ereignis für ein erfolgreiches Tool-Ergebnis aus. Übergeben Sie `options: { willContinue: true }` für vorläufige Tool-Ausgaben oder `options: { suppressResponse: true }`, wenn die Provider-Bridge Unterstützung für die Unterdrückung angibt und das Ergebnis keine weitere Antwort starten soll.
    - `talk.session.steer` sendet Sprachsteuerung für einen aktiven Lauf an eine Gateway-eigene, Agent-gestützte Talk-Sitzung: `{ sessionId, text, mode? }`, wobei `mode` den Wert `status`, `steer`, `cancel` oder `followup` hat; ein ausgelassener Modus wird anhand des gesprochenen Texts klassifiziert.
    - `talk.session.close` schließt eine Gateway-eigene Relay-, Transkriptions- oder Managed-Room-Sitzung und gibt abschließende Talk-Ereignisse aus.
    - `talk.mode` legt den aktuellen Talk-Modusstatus für WebChat-/Control-UI-Clients fest und überträgt ihn.
    - `talk.client.create` erstellt eine Client-eigene Echtzeit-Provider-Sitzung mit `webrtc` oder `provider-websocket`, während das Gateway die Konfiguration, Zugangsdaten, Anweisungen und Tool-Richtlinien verwaltet.
    - `talk.client.toolCall` ermöglicht Client-eigenen Echtzeittransporten, Provider-Tool-Aufrufe an die Gateway-Richtlinie weiterzuleiten. Das erste unterstützte Tool ist `openclaw_agent_consult`; Clients erhalten eine Lauf-ID und warten auf normale Chat-Lebenszyklusereignisse, bevor sie das providerspezifische Tool-Ergebnis übermitteln.
    - `talk.client.steer` sendet Sprachsteuerung für aktive Läufe von Client-eigenen Echtzeittransporten. Das Gateway ermittelt anhand von `sessionKey` den aktiven eingebetteten Lauf und gibt ein strukturiertes Ergebnis für Annahme oder Ablehnung zurück, statt Steuerungsanweisungen stillschweigend zu verwerfen.
    - `talk.event` ist der zentrale Talk-Ereigniskanal für Echtzeit-, Transkriptions-, STT-/TTS-, Managed-Room-, Telefonie- und Meeting-Adapter.
    - `talk.speak` synthetisiert Sprache über den aktiven Talk-Sprach-Provider.
    - `tts.status` gibt den TTS-Aktivierungsstatus, den aktiven Provider, Fallback-Provider und den Provider-Konfigurationsstatus zurück.
    - `tts.providers` gibt den sichtbaren Bestand an TTS-Providern zurück.
    - `tts.enable` und `tts.disable` schalten den Status der TTS-Einstellungen um.
    - `tts.setProvider` aktualisiert den bevorzugten TTS-Provider.
    - `tts.convert` führt eine einmalige Text-zu-Sprache-Konvertierung aus.
    - `tts.speak` (`operator.write`) rendert nicht leeren `text` mit der konfigurierten allgemeinen TTS-Provider-Kette und gibt einen vollständigen Clip inline als `audioBase64` sowie `provider` und optionale Metadaten zu `outputFormat`, `mimeType` und `fileExtension` zurück. Anders als `tts.convert` gibt es keinen Gateway-lokalen Pfad zurück; anders als `talk.speak` erfordert es keinen Talk-Provider. Text oberhalb von `messages.tts.maxTextLength` gibt `INVALID_REQUEST` zurück; Synthesefehler geben `UNAVAILABLE` zurück.

  </Accordion>

  <Accordion title="Geheimnisse, Konfiguration, Aktualisierung und Assistent">
    - `secrets.reload` löst aktive SecretRefs erneut auf und ersetzt den Geheimnisstatus zur Laufzeit nur bei vollständigem Erfolg.
    - `secrets.resolve` löst Geheimniszuweisungen für Befehlsziele für eine bestimmte Befehls-/Zielmenge auf.
    - `config.get` gibt den aktuellen Konfigurations-Snapshot und Hash zurück.
    - `config.set` schreibt eine validierte Konfigurationsnutzlast.
    - `config.patch` führt eine teilweise Konfigurationsaktualisierung zusammen. Die destruktive Ersetzung von Arrays erfordert den betroffenen Pfad in `replacePaths`; verschachtelte Arrays unter Array-Einträgen verwenden `[]`-Pfade wie `agents.list[].skills`.
    - `config.apply` validiert und ersetzt die vollständige Konfigurationsnutzlast.
    - `config.schema` gibt die Live-Konfigurationsschemanutzlast zurück, die von Control UI und CLI-Werkzeugen verwendet wird: Schema, `uiHints`, Version, Generierungsmetadaten sowie Plugin- und Kanalschemametadaten, sofern ladbar. Sie enthält `title`-/`description`-Metadaten aus denselben Bezeichnungen/Hilfetexten wie die Benutzeroberfläche, einschließlich verschachtelter Objekt-, Platzhalter-, Array-Element- und `anyOf`-/`oneOf`-/`allOf`-Kompositionszweige, wenn eine passende Felddokumentation vorhanden ist.
    - `config.schema.lookup` gibt eine pfadbezogene Suchnutzlast für einen Konfigurationspfad zurück: normalisierter Pfad, ein flacher Schemaknoten, passender Hinweis plus `hintPath`, optionaler `reloadKind` und Zusammenfassungen der unmittelbaren untergeordneten Elemente für die Detailnavigation in UI/CLI. `reloadKind` ist entweder `restart`, `hot` oder `none` (`src/config/schema.ts`) und spiegelt den Planer des Gateways zum Neuladen der Konfiguration für den angeforderten Pfad wider. Suchschemaknoten behalten die benutzerorientierte Dokumentation und gängige Validierungsfelder (`title`, `description`, `type`, `enum`, `const`, `format`, `pattern`, Begrenzungen für Zahlen/Zeichenfolgen/Arrays/Objekte, `additionalProperties`, `deprecated`, `readOnly`, `writeOnly`). Zusammenfassungen untergeordneter Elemente stellen `key`, den normalisierten `path`, `type`, `required`, `hasChildren`, den optionalen `reloadKind` sowie den passenden `hint`/`hintPath` bereit.
    - `update.run` führt den Gateway-Aktualisierungsablauf aus und plant nur dann einen Neustart, wenn die Aktualisierung erfolgreich war; Aufrufer mit einer Sitzung können `continuationMessage` einschließen, damit der Start über die Neustart-Fortsetzungswarteschlange einen weiteren Agent-Turn fortsetzt. Paketmanager-Aktualisierungen und überwachte Aktualisierungen eines Git-Checkouts von der Steuerungsebene verwenden eine abgekoppelte Übergabe an einen verwalteten Dienst, anstatt den Paketbaum zu ersetzen oder Checkout-/Build-Ausgaben innerhalb des laufenden Gateways zu verändern. Eine gestartete Übergabe gibt `ok: true` mit `result.reason: "managed-service-handoff-started"` und `handoff.status: "started"` zurück; nicht verfügbare oder fehlgeschlagene Übergaben geben `ok: false` mit `managed-service-handoff-unavailable` oder `managed-service-handoff-failed` sowie `handoff.command` zurück, wenn eine manuelle Shell-Aktualisierung erforderlich ist. Nicht verfügbar bedeutet, dass OpenClaw keine sichere Supervisor-Grenze oder dauerhafte Dienstidentität besitzt, etwa `OPENCLAW_SYSTEMD_UNIT` für systemd. Während einer gestarteten Übergabe kann der Neustart-Sentinel kurzzeitig `stats.reason: "restart-health-pending"` melden; die Fortsetzung wird verzögert, bis die CLI das neu gestartete Gateway verifiziert und den endgültigen `ok`-Sentinel schreibt.
    - `update.status` aktualisiert den neuesten Aktualisierungs-Neustart-Sentinel und gibt ihn zurück, einschließlich der nach dem Neustart ausgeführten Version, sofern verfügbar.
    - `wizard.start`, `wizard.next`, `wizard.status` und `wizard.cancel` stellen den Onboarding-Assistenten über WS-RPC bereit.

  </Accordion>

  <Accordion title="Hilfsfunktionen für Agent und Arbeitsbereich">
    - `agents.list` gibt konfigurierte Agent-Einträge einschließlich effektiver Modell- und Laufzeitmetadaten zurück.
    - `agents.create`, `agents.update` und `agents.delete` verwalten Agent-Datensätze und die Verknüpfung mit Arbeitsbereichen.
    - `agents.files.list`, `agents.files.get` und `agents.files.set` verwalten die für einen Agent bereitgestellten Bootstrap-Arbeitsbereichsdateien.
    - `audit.activity.list` gibt das versionierte Aktivitätsprotokoll ausschließlich mit Metadaten zurück; `audit.list` bleibt der kompatibilitätssichere RPC für Läufe/Tools.
    - `agents.workspace.list` und `agents.workspace.get` (`operator.read`) ermöglichen Clients in der vertrauenswürdigen Operator-Domäne, die unter [Operator-Bereiche](/de/gateway/operator-scopes) beschrieben ist, das schreibgeschützte, paginierte Durchsuchen des Arbeitsbereichsverzeichnisses eines Agent. Anfragen akzeptieren nur arbeitsbereichsrelative Pfade; Lesezugriffe bleiben auf das über seinen realen Pfad aufgelöste Arbeitsbereichsstammverzeichnis beschränkt (Ausbrüche über symbolische Links und Hardlinks werden abgelehnt), sind größenbeschränkt und auf UTF-8-Text sowie gängige Bildtypen (Base64) begrenzt. Antworten legen den Hostpfad des Arbeitsbereichs nicht offen. In diesem Namespace gibt es keine Schreiboperationen.
    - `tasks.list`, `tasks.get` und `tasks.cancel` stellen SDK- und Operator-Clients das Gateway-Aufgabenprotokoll bereit. Siehe unten [RPCs des Aufgabenprotokolls](#task-ledger-rpcs).
    - `artifacts.list`, `artifacts.get` und `artifacts.download` stellen aus Transkripten abgeleitete Artefaktzusammenfassungen und Downloads für einen expliziten Geltungsbereich von `sessionKey`, `runId` oder `taskId` bereit. Lauf- und Aufgabenabfragen ermitteln die zugehörige Sitzung serverseitig und geben nur Transkriptmedien mit übereinstimmender Herkunft zurück; unsichere oder lokale URL-Quellen führen zu nicht unterstützten Downloads, statt serverseitig abgerufen zu werden.
    - `environments.list` und `environments.status` behalten die Gateway-lokale und Node-Umgebungserkennung bei. Konfigurierte Cloud-Worker und dauerhafte Datensätze, die von früheren Profilen zurückgelassen wurden, ergänzen `worker`-Metadaten mit `providerId`, optionaler `leaseId`, `state`, `ageMs`, optionalem `idleMs` und `attachedSessionIds`. Die Lebenszyklusstatus von Workern sind `requested`, `provisioning`, `bootstrapping`, `ready`, `attached`, `idle`, `draining`, `destroying`, `destroyed`, `failed` und `orphaned`.
    - `environments.create` (`{ profileId, idempotencyKey }`) stellt einen Worker anhand eines konfigurierten Plugin-Provider-Profils bereit; Wiederholungsversuche mit demselben Schlüssel verwenden die dauerhafte Operation erneut. `environments.destroy` (`{ environmentId }`) fordert den idempotenten Abbau einer dauerhaften Worker-Umgebung an. Beide erfordern `operator.admin`, sind Schreibvorgänge der Steuerungsebene und geben dieselbe Form der Umgebungszusammenfassung zurück, die auch Statusantworten verwenden.
    - `agent.identity.get` gibt die effektive Assistentenidentität für einen Agent oder eine Sitzung zurück.
    - `agent.wait` wartet auf den Abschluss eines Laufs und gibt den abschließenden Snapshot zurück, sofern verfügbar.

  </Accordion>

  <Accordion title="Sitzungssteuerung">
    - `sessions.list` gibt den aktuellen Sitzungsindex zurück, einschließlich der `agentRuntime`-Metadaten pro Zeile, wenn ein Agent-Runtime-Backend konfiguriert ist.
    - `sessions.subscribe` und `sessions.unsubscribe` aktivieren bzw. deaktivieren Abonnements für Sitzungsänderungsereignisse für den aktuellen WS-Client.
    - `sessions.messages.subscribe` und `sessions.messages.unsubscribe` aktivieren bzw. deaktivieren Abonnements für Transkript-/Nachrichtenereignisse einer Sitzung. Übergeben Sie `includeApprovals: true`, um zusätzlich bereinigte `session.approval`-Lebenszyklusereignisse für Genehmigungen zu empfangen, deren persistierte Zielgruppe genau diese Sitzung umfasst und deren Prüferbindung den abonnierenden Client autorisiert. Die Abonnementantwort enthält dann eine begrenzte ausstehende `approvalReplay`; sie ist maßgeblich, wenn `truncated` false ist. Die Aktivierung gilt pro Abonnementaufruf und ist nicht dauerhaft: Wenn dieselbe Sitzung ohne `includeApprovals: true` erneut abonniert wird, wird ein bestehendes Genehmigungsabonnement entfernt. Zusätzlich zur normalen Berechtigung zum Lesen der Sitzung erfordert diese Aktivierung `operator.admin` oder `operator.approvals` auf einem gekoppelten Gerät.
    - `sessions.preview` gibt begrenzte Transkriptvorschauen für bestimmte Sitzungsschlüssel zurück.
    - `sessions.describe` gibt eine Gateway-Sitzungszeile für einen exakten Sitzungsschlüssel zurück.
    - `sessions.resolve` löst ein Sitzungsziel auf oder kanonisiert es.
    - `sessions.create` erstellt einen neuen Sitzungseintrag. `worktree: true` stellt einen verwalteten Worktree bereit; optional wählen `worktreeBaseRef`/`worktreeName` die Basisreferenz und den Branch-Namen aus, und `execNode` (`operator.admin`) bindet die Ausführung der Sitzung an einen Node-Host. Der erstellte Worktree wird im Ergebnis zurückgegeben und in der Sitzungszeile persistiert (`worktree: { id, branch, repoRoot }`). Wenn der Eintrag erstellt wird, aber sein verschachteltes initiales `chat.send` abgelehnt wird, enthält das erfolgreiche Ergebnis `runStarted: false` und `runError`; Clients können den Prompt beibehalten und den Versuch mit dem zurückgegebenen Sitzungsschlüssel wiederholen.
    - `sessions.groups.list`, `sessions.groups.put`, `sessions.groups.rename` und `sessions.groups.delete` verwalten den Gateway-eigenen Katalog benutzerdefinierter Sitzungsgruppen (Namen + Anzeigereihenfolge). Die Mitgliedschaft verbleibt im Feld `category` jeder Sitzung; Umbenennen und Löschen aktualisieren die zugehörigen Sitzungen serverseitig.
    - `sessions.send` sendet eine Nachricht an eine bestehende Sitzung.
    - `sessions.steer` ist die Variante zum Unterbrechen und Umsteuern einer aktiven Sitzung.
    - `sessions.abort` bricht aktive Arbeit für eine Sitzung ab. Übergeben Sie `key` zusammen mit dem optionalen `runId` oder nur `runId` für aktive Ausführungen, die das Gateway einer Sitzung zuordnen kann.
    - `sessions.patch` aktualisiert Sitzungsmetadaten/-überschreibungen und meldet das aufgelöste kanonische Modell sowie die effektive `agentRuntime`.
    - `sessions.reset`, `sessions.delete` und `sessions.compact` führen Sitzungswartung durch.
    - `sessions.get` gibt die vollständige gespeicherte Sitzungszeile zurück.
    - Die Chat-Ausführung verwendet weiterhin `chat.history`, `chat.send`, `chat.abort` und `chat.inject`. `chat.history` wird für UI-Clients für die Anzeige normalisiert: Inline-Direktiven-Tags werden aus sichtbarem Text entfernt, als Klartext vorliegende Tool-Aufruf-XML-Nutzlasten (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittene Tool-Aufrufblöcke) sowie durchgesickerte ASCII-/vollbreite Modellsteuerungstoken werden entfernt, reine Assistant-Zeilen mit Stille-Token (exakt `NO_REPLY` / `no_reply`) werden ausgelassen und übergroße Zeilen können durch Platzhalter ersetzt werden.
    - `chat.message.get` ist der additive, begrenzte Leser für vollständige Nachrichten eines einzelnen sichtbaren Transkripteintrags. Übergeben Sie `sessionKey`, optional `agentId`, wenn die Sitzungsauswahl Agent-bezogen ist, und eine Transkript-`messageId`, die zuvor über `chat.history` ausgegeben wurde; das Gateway gibt dieselbe für die Anzeige normalisierte Projektion ohne die Begrenzung der Kürzung des leichtgewichtigen Verlaufs zurück, sofern der gespeicherte Eintrag noch verfügbar und nicht übergroß ist.
    - `chat.toolTitles` gibt kurze Zweckbezeichnungen für Tool-Aufrufe zurück, die in der Control UI dargestellt werden (gebündelt, maximal 24 Elemente mit begrenzten Eingaben). Die Funktion muss über `gateway.controlUi.toolTitles` aktiviert werden (standardmäßig deaktiviert); deaktivierte Gateways antworten ohne Modellaufruf mit `{ titles: {}, disabled: true }`, damit Clients keine weiteren Anfragen stellen. Wenn die Funktion aktiviert ist, verwenden Bezeichnungen das standardmäßige Utility-Modell-Routing: ein explizit konfiguriertes `utilityModel` (eine Betreiberentscheidung, die wie alle Utility-Aufgaben begrenzte Aufgabeninhalte an den ausgewählten Provider senden kann), andernfalls den deklarierten Standard des kleinen Modells des Sitzungs-Providers, sodass nicht implizit ein neues Datenübertragungsziel entsteht; ein leeres `utilityModel` deaktiviert sie vollständig. Bezeichnungen greifen niemals auf das primäre Modell zurück. Ergebnisse werden in der zustandsbezogenen Datenbank pro Agent zwischengespeichert, wobei Tool-Name + Eingabe als Schlüssel dienen, sodass wiederholte Ansichten dieselben Aufrufe niemals erneut in Rechnung stellen.
    - `chat.send` akzeptiert das einmalige `fastMode: "auto"`, um den Schnellmodus für Modellaufrufe zu verwenden, die vor dem automatischen Grenzwert gestartet werden, und spätere Wiederholungs-, Fallback-, Tool-Ergebnis- oder Fortsetzungsaufrufe anschließend ohne Schnellmodus zu starten. Der Grenzwert beträgt standardmäßig 60 Sekunden (`DEFAULT_FAST_MODE_AUTO_ON_SECONDS`) und kann pro Modell mit `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` konfiguriert werden. Ein `chat.send`-Aufrufer kann einmalig `fastAutoOnSeconds` übergeben, um den Grenzwert für diese Anfrage zu überschreiben.

  </Accordion>

  <Accordion title="Gerätekopplung und Gerätetoken">
    - `device.pair.list` gibt ausstehende und genehmigte gekoppelte Geräte zurück.
    - `device.pair.setupCode` erstellt einen mobilen Einrichtungscode und standardmäßig eine PNG-QR-Daten-URL. Dies erfordert `operator.admin` und wird absichtlich nicht in der angekündigten Erkennung aufgeführt. Das Ergebnis enthält `setupCode`, optional `qrDataUrl`, `gatewayUrl`, die nicht geheime `auth`-Bezeichnung und `urlSource`.
    - `device.pair.approve`, `device.pair.reject` und `device.pair.remove` verwalten Datensätze zur Gerätekopplung.
    - `device.pair.rename` weist eine Betreiberbezeichnung (`{ deviceId, label }`) zu, die gegenüber dem vom Client gemeldeten Anzeigenamen bevorzugt wird und eine erneute Gerätekopplung oder erneute Genehmigung überdauert.
    - `device.token.rotate` rotiert ein Token eines gekoppelten Geräts innerhalb der Grenzen seiner genehmigten Rolle und des Aufruferbereichs.
    - `device.token.revoke` widerruft ein Token eines gekoppelten Geräts innerhalb der Grenzen seiner genehmigten Rolle und des Aufruferbereichs.

    Der Einrichtungscode enthält einen kurzlebigen Bootstrap-Zugangsnachweis. Clients dürfen ihn nicht
    protokollieren oder über den Kopplungsvorgang hinaus persistieren.

  </Accordion>

  <Accordion title="Node-Kopplung, Aufruf und ausstehende Arbeit">
    - `node.pair.list`, `node.pair.approve`, `node.pair.reject` und `node.pair.remove` decken Genehmigungen von Node-Funktionen ab. `node.pair.request` und `node.pair.verify` wurden in 2026.7 zusammen mit dem eigenständigen Speicher für Node-Kopplungen entfernt; ausstehende Anfragen werden während Node-Verbindungen vom Gateway erstellt.
    - `node.list` und `node.describe` geben den bekannten/verbundenen Node-Status zurück.
    - `node.rename` aktualisiert die Bezeichnung eines gekoppelten Node.
    - `node.invoke` leitet einen Befehl an einen verbundenen Node weiter.
    - `node.invoke.result` gibt das Ergebnis einer Aufrufanfrage zurück.
    - `mcp.tools.call.v1` ist der Headless-Node-Host-Befehl zum Aufrufen eines konfigurierten Node-lokalen MCP-Tools. Er wird über `node.invoke` übertragen, setzt voraus, dass der Node den Befehl deklariert, und unterliegt weiterhin der Kopplungsgenehmigung sowie `gateway.nodes.denyCommands`.
    - `node.event` überträgt vom Node stammende Ereignisse zurück an das Gateway.
    - `node.pluginTools.update` ist der einzige Veröffentlichungsweg zum Ersetzen der Agent-sichtbaren Plugin-/MCP-Tool-Deskriptoren des verbundenen Node; `connect`-Parameter übertragen diese nicht.
    - `node.pending.pull` und `node.pending.ack` sind die Warteschlangen-APIs für verbundene Nodes.
    - `node.pending.enqueue` und `node.pending.drain` verwalten dauerhafte ausstehende Arbeit für offline befindliche/getrennte Nodes.

  </Accordion>

  <Accordion title="Genehmigungsfamilien">
    - `approval.get` und `approval.resolve` sind die typunabhängigen dauerhaften Genehmigungsmethoden (Berechtigungsbereich `operator.approvals`). `approval.get` gibt eine bereinigte ausstehende oder aufbewahrte abschließende Projektion mit einem stabilen `urlPath` zurück; `approval.resolve` akzeptiert die kanonische Genehmigungs-ID, einen expliziten `kind` und eine Entscheidung, wendet die Auflösung nach dem Prinzip „erste Antwort gewinnt“ an und gibt stets das aufgezeichnete kanonische Ergebnis zurück.
    - `exec.approval.request`, `exec.approval.get`, `exec.approval.list` und `exec.approval.resolve` decken einmalige Ausführungsgenehmigungsanfragen sowie die Suche/Wiedergabe ausstehender Genehmigungen ab. Sie sind Adapter an der Protokollgrenze über derselben dauerhaften Genehmigungsregistrierung.
    - `exec.approval.waitDecision` wartet auf eine ausstehende Ausführungsgenehmigung und gibt die endgültige Entscheidung zurück (oder bei Zeitüberschreitung `null`).
    - `exec.approvals.get` und `exec.approvals.set` verwalten Snapshots der Gateway-Richtlinie für Ausführungsgenehmigungen.
    - `exec.approvals.node.get` und `exec.approvals.node.set` verwalten die Node-lokale Richtlinie für Ausführungsgenehmigungen über Node-Relay-Befehle.
    - `plugin.approval.request`, `plugin.approval.list`, `plugin.approval.waitDecision` und `plugin.approval.resolve` decken Plugin-definierte Genehmigungsabläufe ab.

  </Accordion>

  <Accordion title="Automatisierung, Skills und Tools">
    - Automatisierung: `wake` plant eine sofortige oder beim nächsten Heartbeat erfolgende Einspeisung von Aktivierungstext; `cron.get`, `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`, `cron.runs` verwalten geplante Arbeit.
    - `cron.run` bleibt ein RPC im Einreihungsstil für manuelle Ausführungen. Clients, die eine Abschlusssemantik benötigen, sollten die zurückgegebene `runId` lesen und `cron.runs` abfragen.
    - `cron.runs` akzeptiert einen optionalen, nicht leeren `runId`-Filter, damit Clients eine einzelne eingereihte manuelle Ausführung verfolgen können, ohne in eine Race-Condition mit anderen Verlaufseinträgen desselben Jobs zu geraten.
    - Skills und Tools: `commands.list`, `skills.*`, `tools.catalog`, `tools.effective`, `tools.invoke`. Siehe unten [Hilfsmethoden für Betreiber](#operator-helper-methods).

  </Accordion>
</AccordionGroup>

### Allgemeine Ereignisfamilien

- `chat`: UI-Chat-Aktualisierungen wie `chat.inject` und andere ausschließlich das Transkript betreffende Chat-
  Ereignisse. In Protokoll v4 enthalten Delta-Nutzlasten `deltaText`; `message` bleibt
  der kumulative Assistant-Snapshot. Ersetzungen, die kein Präfix ersetzen, setzen
  `replace=true` und verwenden `deltaText` als Ersetzungstext.
- `session.message`, `session.operation`, `session.tool`: Transkript-, laufende
  Sitzungsvorgangs- und Ereignisstream-Aktualisierungen für eine abonnierte Sitzung.
- `session.approval`: bereinigte maßgebliche ausstehende und abschließende Genehmigungsdaten für einen
  explizit aktivierten Abonnenten einer exakten Sitzung. Untergeordnete Genehmigungen verwenden die
  persistierte Zielgruppe des übergeordneten Elements; Ereignisse verändern niemals Transkripte und aktivieren keine Agents.
- `sessions.changed`: Sitzungsindex oder Metadaten wurden geändert.
- `presence`: Aktualisierungen des Snapshots der Systempräsenz.
- `tick`: periodisches Keepalive-/Verfügbarkeitsereignis.
- `health`: Aktualisierung des Gateway-Zustandssnapshots.
- `heartbeat`: Aktualisierung des Heartbeat-Ereignisstreams.
- `cron`: Änderungsereignis einer Cron-Ausführung/eines Cron-Jobs.
- `shutdown`: Benachrichtigung über das Herunterfahren des Gateway.
- `node.pair.requested` / `node.pair.resolved`: Lebenszyklus der Node-Kopplung.
- `node.invoke.request`: Übertragung einer Node-Aufrufanfrage.
- `device.pair.requested` / `device.pair.resolved`: Lebenszyklus gekoppelter Geräte.
- `voicewake.changed`: Konfiguration des Aktivierungswort-Auslösers wurde geändert.
- `exec.approval.requested` / `exec.approval.resolved`: Lebenszyklus der
  Ausführungsgenehmigung.
- `plugin.approval.requested` / `plugin.approval.resolved`: Lebenszyklus der Plugin-Genehmigung.

### Node-Hilfsmethoden

Nodes können `skills.bins` aufrufen, um die aktuelle Liste ausführbarer Skill-Dateien
für Prüfungen der automatischen Zulassung abzurufen.

## RPC des Audit-Hauptbuchs

`audit.activity.list` bietet Betreiber-Clients eine stabile, nach neuesten Einträgen zuerst sortierte Ansicht der Lebenszyklusmetadaten von Agent-
Ausführungen, Tool-Aktionen und optional erfassten Nachrichten. Dies erfordert
`operator.read`. Abfragen schließen Datensätze aus, die älter als 30 Tage sind, und das gemeinsam verwendete
SQLite-Hauptbuch ist auf 100,000 Datensätze begrenzt. Abgelaufene Zeilen werden beim
Start des Gateway, bei der stündlichen Wartung und bei späteren Schreibvorgängen gelöscht. Informationen zum Datenmodell und zur Datenschutzsemantik finden Sie unter
[Auditverlauf](/de/gateway/audit).

- Parameter: optionale exakte Werte für `agentId`, `sessionKey` oder `runId`; optionaler `kind`
  (`"agent_run"`, `"tool_action"` oder `"message"`); optionaler `status`
  (`"started"`, `"succeeded"`, `"failed"`, `"cancelled"`, `"timed_out"`,
  `"blocked"` oder `"unknown"`); optionale Nachrichten-`direction` (`"inbound"` oder
  `"outbound"`) und exakter `channel`; optionale inklusive Unix-Millisekunden-Grenzen
  `after` / `before`; optionales `limit` von `1` bis `500`; und optionaler
  String-`cursor` von der vorherigen Seite.
- Ergebnis: `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.

Die benannte V1-Ergebnis-Union verfügt über separate Schemas für Agent-Ausführungen,
Tool-Aktionen, eingehende Nachrichten und ausgehende Nachrichten. Der Diskriminator
`eventType` ist jeweils `agent_run`, `tool_action`, `inbound_message` oder
`outbound_message`; `kind` und Nachrichten-`direction` bleiben zum Filtern und
Anzeigen verfügbar. Jedes Ereignis hat den ganzzahligen Wert `schemaVersion: 1`.
Referenzen auf Nachrichtenidentitäten verwenden das exakte Format
`hmac-sha256:v1:<32 hex key id>:<64 hex digest>`; die Akteur-ID eines
Channel-Absenders verwendet dasselbe Format.

Alle Varianten erfordern `eventType`, `schemaVersion`, `eventId`, `sequence`,
`sourceSequence`, `occurredAt`, `kind`, `action`, `status`, `actor` und
`redaction`. Die variantenspezifischen Felder sind:

| `eventType`        | Erforderliche Felder                                               | Optionale Felder                                                                                                                |
| ------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `agent_run`        | `agentId`, `runId`; `kind: "agent_run"`                            | `sessionKey`, `sessionId`, `errorCode`                                                                                          |
| `tool_action`      | `agentId`, `runId`; `kind: "tool_action"`                          | `sessionKey`, `sessionId`, `toolCallId`, `toolName`, `errorCode`                                                                |
| `inbound_message`  | `direction: "inbound"`, `channel`, `conversationKind`, `outcome`   | `agentId`, `runId`, `durationMs`, `resultCount`, Identitätsreferenzen, `reasonCode`, `errorCode`                                 |
| `outbound_message` | `direction: "outbound"`, `channel`, `conversationKind`, `outcome`  | `agentId`, `runId`, `durationMs`, `resultCount`, Identitätsreferenzen, `reasonCode`, `deliveryKind`, `failureStage`, `errorCode` |

Die geschlossenen Nachrichten-Enums sind:

- `conversationKind`: `direct`, `group`, `channel` oder `unknown`.
- Eingehender `outcome`: `completed`, `skipped` oder `failed`; optionaler
  `reasonCode`: `duplicate`, `reply_operation_active`,
  `reply_operation_aborted`, `fast_abort`, `plugin_bound_handled`,
  `plugin_bound_unavailable`, `plugin_bound_declined`, `plugin_bound_error`,
  `before_dispatch_handled`, `acp_dispatch_completed`, `acp_dispatch_failed`,
  `acp_dispatch_empty` oder `acp_dispatch_aborted`.
- Ausgehender `outcome`: `sent`, `suppressed`, `failed` oder `unknown`; optionaler
  `reasonCode`: `cancelled_by_message_sending_hook`,
  `cancelled_by_reply_payload_sending_hook`,
  `empty_after_message_sending_hook`, `empty_after_reply_payload_sending_hook`
  oder `no_visible_payload`. Ein Adapter, der keine Plattformidentität
  zurückgibt, ist `unknown`, da die externe Nebenwirkung nicht widerlegt werden kann.
- `deliveryKind`: `text`, `media` oder `other`; `failureStage`:
  `platform_send`, `queue` oder `unknown`.

Terminalfelder sind korreliert und nicht unabhängig voneinander optional:

| Variante           | Terminalzuordnung                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Agent-Ausführung   | `started` hat keinen `errorCode`; jeder abgeschlossene Status außer Erfolg erfordert den entsprechenden `run_*`-Code.                                              |
| Tool-Aktion        | `started` und erfolgreich abgeschlossen haben keinen `errorCode`; jeder andere abgeschlossene Status erfordert den entsprechenden `tool_*`-Code.                   |
| Eingehende Nachricht | erfolgreich = `completed`; blockiert = `skipped`; fehlgeschlagen = `failed` plus `message_processing_failed`. `reasonCode` muss, sofern vorhanden, zu dieser Terminalfamilie gehören. |
| Ausgehende Nachricht | erfolgreich = `sent`; blockiert = `suppressed` plus `reasonCode`; fehlgeschlagen = `failed` plus `errorCode` und `failureStage`; unbekannt = `unknown` plus `failureStage`. |

Jedes Aktivitätsereignis enthält eine stabile Ereignis-ID, eine monotone
Ledger-Sequenz, eine Quellereignis-Sequenz, einen Zeitstempel, einen Akteur, eine
Aktion, einen Status, den ganzzahligen Wert `schemaVersion: 1` und
`redaction: "metadata_only"`. Ausführungs- und Tool-Datensätze erfordern die
Herkunft von Agent und Ausführung und können die Sitzungsh Herkunft enthalten.
Nachrichtendatensätze können Agent- und Ausführungs-IDs enthalten, enthalten
jedoch absichtlich niemals `sessionKey` oder `sessionId`; der Abfragefilter
`sessionKey` gilt daher nur für Ausführungs- und Tool-Zeilen. Tool-Ereignisse
können eine Tool-Aufruf-ID und einen Tool-Namen enthalten.

Nachrichtendatensätze verwenden `message.inbound.processed` oder
`message.outbound.finished` und ergänzen Richtung, Channel, Konversationsart,
normalisiertes Ergebnis sowie optional Zustellungsart, Fehlerphase, Dauer,
Ergebnisanzahl, Ursachencode und installationslokale, schlüsselbasierte
Pseudonyme für Konto, Konversation, Nachricht und Ziel. Diese Pseudonyme
unterstützen die Korrelation, stellen jedoch keine Anonymisierung dar: Die
Statusdatenbank enthält ihren Schlüssel, RPC- und CLI-Exporte hingegen nicht.
Das Ledger speichert keine Prompts, Nachrichteninhalte, Tool-Argumente,
Tool-Ergebnisse, Befehlsausgaben oder unbearbeiteten Fehlertext.
`sessionKey`-Werte von Ausführungen und Tools bleiben unbearbeitete
Korrelationsmetadaten und können Plattformkonto- oder Peer-IDs enthalten;
Nachrichtendatensätze lassen Sitzungsschlüssel weg.

Bei eingehenden Zeilen misst `durationMs` den Core-Dispatch bis zu seinem Endzustand, und
`resultCount` zählt die finalisierten Tool-, Block- und Antwort-Payloads in der Warteschlange. Bei
ausgehenden Zeilen umfasst `durationMs` die Zuständigkeit für die Zustellung bis zur Bestätigung,
Dead-Letter-Behandlung oder Abstimmung (einschließlich der Wartezeit in der Warteschlange), und `resultCount`
zählt die identifizierten physischen Übertragungen an die Plattform. `deliveryKind` beschreibt, sofern vorhanden,
den effektiven Payload nach Hooks und Rendering; unterdrückte oder
durch Abstürze uneindeutige Zeilen enthalten dieses Feld nicht.

Die aktuelle Nachrichtenabdeckung umfasst akzeptierte eingehende Nachrichten, die den Core-
Dispatch erreichen, einschließlich der Core-Ergebnisse für Duplikate und Endzustände. Für ausgehende Nachrichten wird
eine Endzustandszeile pro ursprünglichem logischem Antwort-Payload geschrieben, der die gemeinsame dauerhafte
Zustellung erreicht; Aufteilung in Chunks und Adapter-Fan-out werden in `resultCount` aggregiert. In der Warteschlange befindliche
wiederholbare oder uneindeutige Übertragungen werden erst nach Bestätigung, Dead-Letter-
Behandlung oder Abstimmung aufgezeichnet. Plugin-lokale und direkte Übertragungspfade, die diese
gemeinsamen Grenzen umgehen, werden noch nicht abgedeckt. Die begrenzte Worker-Warteschlange arbeitet nach bestem Bemühen
und kann bei Fehlern oder Sättigung Datensätze verwerfen; daher ist diese Oberfläche kein
verlustfreies Compliance-Archiv.

Die Aufzeichnung ist standardmäßig aktiviert und wird über
[`audit.enabled`](/de/gateway/configuration-reference#audit) gesteuert. Die Nachrichtenaufzeichnung wird
separat über `audit.messages` gesteuert und ist standardmäßig auf `"off"` gesetzt. Wenn die
Aufzeichnung deaktiviert ist, stellt `audit.activity.list` zuvor geschriebene Datensätze weiterhin
bereit, bis diese ablaufen.

Die ausgelieferten Schemas für Anfrage und Ergebnis von `audit.list` sowie für `AuditEvent` bleiben
unverändert und geben nur Datensätze zu Agent-Ausführungen und Tool-Aktionen zurück. Neue Operator-
Clients sollten `audit.activity.list` aufrufen, wenn der Gateway diese Methode ankündigt. Ältere
Gateways können entweder `unknown method: audit.activity.list` oder, da
die Autorisierung in ausgelieferten Versionen vor der Methodensuche erfolgte, `missing scope:
operator.admin` für eine Anfrage mit Leseberechtigung melden. Behandeln Sie Letzteres nur dann als Fehlen der Methode,
wenn die Methode nicht angekündigt wurde. Ein Client kann anschließend nur dann erneut `audit.list`
aufrufen, wenn seine Filter keine Unterstützung für Nachrichtenart, Richtung oder Kanal
erfordern.

Verwenden Sie [`openclaw audit`](/de/cli/audit) für Textabfragen und begrenzte JSON-Exporte.

## Task-Ledger-RPCs

Operator-Clients prüfen und stornieren Datensätze zu Gateway-Hintergrundaufgaben über
die Task-Ledger-RPCs (`packages/gateway-protocol/src/schema/tasks.ts`). Diese
geben bereinigte Aufgabenzusammenfassungen zurück, keinen unbereinigten Laufzeitstatus.

- `tasks.list` erfordert `operator.read`.
  - Parameter: optionales `status` (`"queued"`, `"running"`, `"completed"`,
    `"failed"`, `"cancelled"` oder `"timed_out"`) oder ein Array dieser Statuswerte,
    optionale `agentId`, optionaler `sessionKey`, optionales `limit` von `1` bis
    `500` und optionaler String `cursor`.
  - Ergebnis: `{ "tasks": TaskSummary[], "nextCursor"?: string }`.
- `tasks.get` erfordert `operator.read`.
  - Parameter: `{ "taskId": string }`.
  - Ergebnis: `{ "task": TaskSummary }`.
  - Fehlende Aufgaben-IDs geben die Gateway-Fehlerstruktur für „nicht gefunden“ zurück.
- `tasks.cancel` erfordert `operator.write`.
  - Parameter: `{ "taskId": string, "reason"?: string }`.
  - Ergebnis: `{ "found": boolean, "cancelled": boolean, "reason"?: string, "task"?: TaskSummary }`.
  - `found` gibt an, ob das Ledger eine passende Aufgabe enthielt. `cancelled`
    gibt an, ob die Laufzeitumgebung die Stornierung akzeptiert oder aufgezeichnet hat.

`TaskSummary` enthält `id`, `status` und optionale Metadaten: `kind`,
`runtime`, `title`, `agentId`, `sessionKey`, `childSessionKey`, `ownerKey`,
`runId`, `taskId`, `flowId`, `parentTaskId`, `sourceId`, Zeitstempel, Fortschritt,
Endzustandszusammenfassung und bereinigten Fehlertext. `agentId` identifiziert den Agenten,
der die Aufgabe ausführt; `sessionKey` und `ownerKey` bewahren den Kontext des Anfordernden und der Steuerung.

## Operator-Hilfsmethoden

- `commands.list` (`operator.read`) ruft das Laufzeit-Befehlsinventar für
  einen Agenten ab.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agenten-Workspace auszulesen.
  - `scope` steuert, auf welche Oberfläche der primäre `name` zielt: `text` gibt
    das primäre Textbefehlstoken ohne den führenden `/` zurück; `native` und der
    standardmäßige Pfad `both` geben, sofern verfügbar, Provider-spezifische native Namen zurück.
  - `textAliases` enthält exakte Slash-Aliasse wie `/model` und `/m`.
  - `nativeName` enthält den Provider-spezifischen nativen Befehlsnamen, sofern
    einer vorhanden ist.
  - `provider` ist optional und wirkt sich nur auf die native Benennung sowie die
    Verfügbarkeit nativer Plugin-Befehle aus.
  - `includeArgs=false` lässt serialisierte Argumentmetadaten in der Antwort weg.
- `tools.catalog` (`operator.read`) ruft den Laufzeit-Toolkatalog für einen
  Agenten ab. Die Antwort enthält gruppierte Tools und Herkunftsmetadaten:
  - `source`: `core` oder `plugin`
  - `pluginId`: Eigentümer-Plugin, wenn `source="plugin"`
  - `optional`: ob ein Plugin-Tool optional ist
- `tools.effective` (`operator.read`) ruft das zur Laufzeit wirksame Toolinventar
  für eine Sitzung ab.
  - `sessionKey` ist erforderlich.
  - Das Gateway leitet den vertrauenswürdigen Laufzeitkontext serverseitig aus
    der Sitzung ab, statt vom Aufrufer bereitgestellten Authentifizierungs- oder
    Zustellungskontext zu akzeptieren.
  - Die Antwort ist eine sitzungsbezogene, serverseitig abgeleitete Projektion
    des aktiven Inventars einschließlich Core-, Plugin-, Kanal- und bereits
    erkannter MCP-Server-Tools.
  - `tools.effective` ist für MCP schreibgeschützt: Es kann einen vorgewärmten
    sitzungsbezogenen MCP-Katalog anhand der endgültigen Toolrichtlinie
    projizieren, erstellt jedoch keine MCP-Laufzeitumgebungen, verbindet keine
    Transporte und führt kein `tools/list` aus. Wenn kein passender vorgewärmter
    Katalog vorhanden ist, kann die Antwort einen Hinweis wie
    `mcp-not-yet-connected`, `mcp-not-yet-listed` oder `mcp-stale-catalog`
    enthalten.
  - Wirksame Tooleinträge verwenden `source="core"`, `source="plugin"`,
    `source="channel"` oder `source="mcp"`.
- `tools.invoke` (`operator.write`) ruft ein verfügbares Tool über denselben
  Gateway-Richtlinienpfad wie `/tools/invoke` auf.
  - `name` ist erforderlich. `args`, `sessionKey`, `agentId`, `confirm` und
    `idempotencyKey` sind optional.
  - Wenn sowohl `sessionKey` als auch `agentId` vorhanden sind, muss der
    aufgelöste Sitzungsagent mit `agentId` übereinstimmen.
  - Nur Eigentümern vorbehaltene Core-Wrapper wie `cron`, `gateway` und `nodes`
    erfordern eine Eigentümer-/Administratoridentität (`operator.admin`), obwohl
    `tools.invoke` selbst `operator.write` ist.
  - Die Antwort ist eine für das SDK bestimmte Hülle mit `ok`, `toolName`,
    optionalem `output` und typisierten `error`-Feldern. Ablehnungen aufgrund
    von Genehmigungen oder Richtlinien geben `ok:false` in den Nutzdaten zurück,
    statt die Gateway-Toolrichtlinien-Pipeline zu umgehen.
- `skills.status` (`operator.read`) ruft das sichtbare Skills-Inventar für einen
  Agenten ab.
  - `agentId` ist optional; lassen Sie es weg, um den Standard-Agenten-Workspace auszulesen.
  - Die Antwort enthält Eignung, fehlende Anforderungen, Konfigurationsprüfungen
    und bereinigte Installationsoptionen, ohne rohe Geheimniswerte offenzulegen.
- `skills.search` und `skills.detail` (`operator.read`) geben
  ClawHub-Erkennungsmetadaten zurück.
- `skills.upload.begin`, `skills.upload.chunk` und `skills.upload.commit`
  (`operator.admin`) stellen ein privates Skill-Archiv vor der Installation
  bereit. Dies ist ein separater Administrator-Uploadpfad für vertrauenswürdige
  Clients, nicht der normale Ablauf zur Skill-Installation über ClawHub, und er
  ist standardmäßig deaktiviert, sofern
  `skills.install.allowUploadedArchives` nicht aktiviert ist.
  - `skills.upload.begin({ kind: "skill-archive", slug, sizeBytes, sha256?, force?, idempotencyKey? })`
    erstellt einen Upload, der an diesen Slug und diesen Force-Wert gebunden ist.
  - `skills.upload.chunk({ uploadId, offset, dataBase64 })` hängt Bytes am
    exakten dekodierten Offset an.
  - `skills.upload.commit({ uploadId, sha256? })` überprüft die endgültige Größe
    und SHA-256. Der Commit schließt nur den Upload ab; er installiert den Skill
    nicht.
  - Hochgeladene Skill-Archive sind ZIP-Archive, die im Stammverzeichnis eine
    `SKILL.md` enthalten. Der interne Verzeichnisname des Archivs bestimmt
    niemals das Installationsziel.
- `skills.install` (`operator.admin`) verfügt über drei Modi:
  - ClawHub-Modus: `{ source: "clawhub", slug, version?, force? }` installiert
    einen Skill-Ordner im Verzeichnis `skills/` des Standard-Agenten-Workspace.
  - Upload-Modus: `{ source: "upload", uploadId, slug, force?, sha256?, timeoutMs? }`
    installiert einen abgeschlossenen Upload im Verzeichnis
    `skills/<slug>` des Standard-Agenten-Workspace. Slug und Force-Wert müssen
    mit der ursprünglichen Anfrage an `skills.upload.begin` übereinstimmen. Die
    Anfrage wird abgelehnt, sofern `skills.install.allowUploadedArchives` nicht
    aktiviert ist; die Einstellung wirkt sich nicht auf ClawHub-Installationen
    aus.
  - Gateway-Installationsmodus: `{ name, installId, timeoutMs? }` führt eine
    deklarierte Aktion `metadata.openclaw.install` auf dem Gateway-Host aus.
    Ältere Clients können weiterhin `dangerouslyForceUnsafeInstall` senden;
    dieses Feld ist veraltet, wird nur aus Gründen der Protokollkompatibilität
    akzeptiert und ignoriert. Verwenden Sie `security.installPolicy` für
    Installationsentscheidungen, die vom Betreiber verwaltet werden.
- `skills.update` (`operator.admin`) verfügt über zwei Modi:
  - Der ClawHub-Modus aktualisiert einen nachverfolgten Slug oder alle
    nachverfolgten ClawHub-Installationen im Standard-Agenten-Workspace.
  - Der Konfigurationsmodus aktualisiert Werte unter
    `skills.entries.<skillKey>` wie `enabled`, `apiKey` und `env`.

### Ansichten von `models.list`

`models.list` akzeptiert einen optionalen Parameter `view`
(`src/agents/model-catalog-visibility.ts`):

- Weggelassen oder `"default"`: Wenn `agents.defaults.models` konfiguriert ist,
  enthält die Antwort den zulässigen Katalog einschließlich dynamisch erkannter
  Modelle für `provider/*`-Einträge. Andernfalls enthält die Antwort den
  vollständigen Gateway-Katalog.
- `"configured"`: Verhalten mit für eine Auswahloberfläche geeigneter Größe.
  Wenn `agents.defaults.models` konfiguriert ist, hat es weiterhin Vorrang,
  einschließlich Provider-bezogener Erkennung für `provider/*`-Einträge. Ohne
  Positivliste verwendet die Antwort explizite Einträge unter
  `models.providers.<provider>.models` und greift nur dann auf den vollständigen
  Katalog zurück, wenn keine konfigurierten Modellzeilen vorhanden sind.
- `"provider-config"`: vom Quellsystem definiertes Inventar aus
  `models.providers.*.models`, unabhängig von Positivlisten der
  Auswahloberfläche. Die Zeilen enthalten öffentliche Modellfähigkeiten und
  routenabhängige Verfügbarkeit, lassen jedoch Provider-Endpunkte,
  Authentifizierungsmaterial und die Laufzeit-Anfragekonfiguration weg.
- `"all"`: vollständiger Gateway-Katalog unter Umgehung von
  `agents.defaults.models`. Verwenden Sie dies für Diagnose-/Erkennungsoberflächen,
  nicht für normale Modellauswahloberflächen.

## Exec-Genehmigungen

- Wenn eine Exec-Anfrage eine Genehmigung benötigt, sendet das Gateway
  `exec.approval.requested`.
- Betreiber-Clients lösen sie durch den Aufruf von `exec.approval.resolve` auf
  (erfordert `operator.approvals`).
- Für `host=node` muss `exec.approval.request` einen `systemRunPlan` enthalten
  (kanonische `argv`-/`cwd`-/`rawCommand`-/Sitzungsmetadaten). Anfragen ohne
  `systemRunPlan` werden abgelehnt.
- Nach der Genehmigung verwenden weitergeleitete Aufrufe von
  `node.invoke system.run` diesen kanonischen `systemRunPlan` erneut als
  maßgeblichen Befehls-/Arbeitsverzeichnis-/Sitzungskontext.
- Wenn ein Aufrufer `command`, `rawCommand`, `cwd`, `agentId` oder
  `sessionKey` zwischen der Vorbereitung und der abschließenden genehmigten
  Weiterleitung von `system.run` verändert, lehnt das Gateway die Ausführung
  ab, statt den veränderten Nutzdaten zu vertrauen.

## Fallback bei Agentenzustellung

- `agent`-Anfragen können `deliver=true` enthalten, um eine ausgehende
  Zustellung anzufordern.
- `bestEffortDeliver=false` (der Standardwert) behält das strikte Verhalten
  bei: Nicht auflösbare oder ausschließlich interne Zustellungsziele geben
  `INVALID_REQUEST` zurück.
- `bestEffortDeliver=true` ermöglicht den Fallback auf eine ausschließlich
  sitzungsbezogene Ausführung, wenn keine extern zustellbare Route aufgelöst
  werden kann (beispielsweise bei internen/Webchat-Sitzungen oder mehrdeutigen
  Mehrkanalkonfigurationen).
- Endgültige `agent`-Ergebnisse können `result.deliveryStatus` enthalten, wenn
  eine Zustellung angefordert wurde. Dabei werden dieselben Statuswerte
  `sent`, `suppressed`, `partial_failed` und `failed` verwendet, die für
  [`openclaw agent --json --deliver`](/de/cli/agent#json-delivery-status)
  dokumentiert sind.

## Versionierung

- `PROTOCOL_VERSION`, `MIN_CLIENT_PROTOCOL_VERSION`,
  `MIN_NODE_PROTOCOL_VERSION` und `MIN_PROBE_PROTOCOL_VERSION` befinden sich
  in `packages/gateway-protocol/src/version.ts`.
- Clients senden `minProtocol` + `maxProtocol`. Betreiber- und UI-Clients
  müssen das aktuelle Protokoll in diesem Bereich einschließen; aktuelle
  Clients und Server verwenden Protokoll v4.
- Authentifizierte Clients mit sowohl `role: "node"` als auch
  `client.mode: "node"` können das N-1-Node-Protokoll verwenden (derzeit v3).
  Leichtgewichtige Neustartprüfungen verwenden dasselbe N-1-Fenster.
  Geräteauthentifizierung, Kopplung, Geltungsbereiche, Befehlsrichtlinien und
  Exec-Genehmigungen bleiben durch dieses Kompatibilitätsfenster unverändert.
  Plugin-eigene Node-Fähigkeiten und -Befehle werden zurückgehalten, bis die
  Node auf das aktuelle Protokoll aktualisiert wird, da ihre gehosteten
  Oberflächen nicht Teil des N-1-Vertrags sind.
- Schemas und Modelle werden aus TypeBox-Definitionen generiert:
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

### Client-Konstanten

Die Referenzimplementierung des Clients befindet sich in
`packages/gateway-client/src/` (OpenClaw bindet sie über die schlanke Fassade
`src/gateway/client.ts` ein). Diese Standardwerte sind über Protokoll v4 hinweg
stabil und bilden die erwartete Ausgangsbasis für Drittanbieter-Clients.

| Konstante                                 | Standardwert                                           | Quelle                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `PROTOCOL_VERSION`                        | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_CLIENT_PROTOCOL_VERSION`             | `4`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_NODE_PROTOCOL_VERSION`               | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| `MIN_PROBE_PROTOCOL_VERSION`              | `3`                                                   | `packages/gateway-protocol/src/version.ts`                                                                                |
| Anfrage-Timeout (pro RPC)                 | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`requestTimeoutMs`)                                                              |
| Timeout für Preauth / Verbindungs-Challenge | `15_000` ms                                         | `packages/gateway-client/src/timeouts.ts` (die Umgebungsvariable `OPENCLAW_HANDSHAKE_TIMEOUT_MS` kann das gemeinsame Server-/Client-Zeitbudget erhöhen) |
| Anfänglicher Reconnect-Backoff            | `1_000` ms                                            | `packages/gateway-client/src/client.ts` (`backoffMs`)                                                                     |
| Maximaler Reconnect-Backoff               | `30_000` ms                                           | `packages/gateway-client/src/client.ts` (`scheduleReconnect`)                                                             |
| Begrenzung für schnelle Wiederholung nach Schließen wegen Geräte-Token | `250` ms                          | `packages/gateway-client/src/client.ts`                                                                                   |
| Karenzzeit für erzwungenes Stoppen vor `terminate()` | `250` ms                                  | `FORCE_STOP_TERMINATE_GRACE_MS`                                                                                           |
| Standard-Timeout von `stopAndWait()`      | `1_000` ms                                            | `STOP_AND_WAIT_TIMEOUT_MS`                                                                                                |
| Standardmäßiges Tick-Intervall (vor `hello-ok`) | `30_000` ms                                      | `packages/gateway-client/src/client.ts`                                                                                   |
| Schließen bei Tick-Timeout                | Code `4000`, wenn die Inaktivität `tickIntervalMs * 2` überschreitet | `packages/gateway-client/src/client.ts`                                                                 |
| `MAX_PAYLOAD_BYTES`                       | `25 * 1024 * 1024` (25 MB)                            | `src/gateway/server-constants.ts`                                                                                         |

Der Server gibt die effektiven Werte `policy.tickIntervalMs`,
`policy.maxPayload` und `policy.maxBufferedBytes` in `hello-ok` bekannt; Clients
sollten diese Werte anstelle der Standardwerte vor dem Handshake verwenden.

Der Referenz-Client lässt endliche Anfragen ihre konfigurierte Frist selbst
bestimmen, wenn jede ausstehende Anfrage eine solche besitzt. Eine
`expectFinal`-Anfrage ohne endlichen `timeoutMs`, eine beliebige Anfrage mit
`timeoutMs: null` oder eine Mischung aus endlichen und unbegrenzten Anfragen
hält den Tick-Watchdog aktiv. Wenn eingehende Ereignisse und Antworten über den
Tick-Timeout-Schwellenwert hinaus ausbleiben, schließt der Client den Socket
mit Code `4000`, lehnt jede ausstehende Anfrage ab und stellt die Verbindung
erneut her. Abgelehnte Anfragen werden nach dem erneuten Verbindungsaufbau nicht
wiederholt.

## Authentifizierung

- Die Authentifizierung des Gateway über ein gemeinsames Geheimnis verwendet
  je nach konfiguriertem `gateway.auth.mode`
  (`"none" | "token" | "password" | "trusted-proxy"`) entweder
  `connect.params.auth.token` oder `connect.params.auth.password`.
- Identitätsbehaftete Modi wie Tailscale Serve
  (`gateway.auth.allowTailscale: true`) oder
  `gateway.auth.mode: "trusted-proxy"` außerhalb von Loopback erfüllen die
  Authentifizierungsprüfung beim Verbindungsaufbau anhand der Anfrage-Header
  statt über `connect.params.auth.*`.
- Bei privatem Ingress überspringt `gateway.auth.mode: "none"` die
  Authentifizierung beim Verbindungsaufbau über ein gemeinsames Geheimnis
  vollständig; stellen Sie diesen Modus nicht über öffentlichen oder nicht
  vertrauenswürdigen Ingress bereit.
- Nach dem Pairing stellt das Gateway ein Geräte-Token aus, dessen Gültigkeit
  auf die Rolle und Scopes der Verbindung beschränkt ist und das in
  `hello-ok.auth.deviceToken` zurückgegeben wird. Clients sollten es nach jedem
  erfolgreichen Verbindungsaufbau speichern.
- Beim erneuten Verbindungsaufbau mit diesem gespeicherten Geräte-Token sollte
  auch die dafür gespeicherte genehmigte Scope-Menge wiederverwendet werden.
  Dadurch bleibt bereits gewährter Lese-, Probe- und Statuszugriff erhalten,
  und erneute Verbindungen werden nicht stillschweigend auf einen engeren,
  impliziten, ausschließlich administrativen Scope reduziert.
- Clientseitige Zusammenstellung der Authentifizierung für den
  Verbindungsaufbau (`selectConnectAuth` in
  `packages/gateway-client/src/client.ts`):
  - `auth.password` ist unabhängig und wird immer weitergeleitet, wenn es
    gesetzt ist.
  - `auth.token` wird in folgender Prioritätsreihenfolge befüllt: zuerst ein
    explizites gemeinsames Token, dann ein explizites `deviceToken`, danach ein
    gespeichertes gerätebezogenes Token (indiziert nach `deviceId` + `role`).
  - `auth.bootstrapToken` wird nur gesendet, wenn keiner der zuvor genannten
    Werte für `auth.token` ermittelt wurde. Ein gemeinsames Token oder ein
    beliebiges ermitteltes Geräte-Token unterdrückt es.
  - Die automatische Hochstufung eines gespeicherten Geräte-Tokens beim
    einmaligen Wiederholungsversuch nach `AUTH_TOKEN_MISMATCH` ist nur für
    vertrauenswürdige Endpunkte zulässig: Loopback oder `wss://` mit einem
    angehefteten `tlsFingerprint`. Öffentliches `wss://` ohne Anheftung erfüllt
    diese Voraussetzung nicht.
- Der integrierte Bootstrap über einen Einrichtungscode gibt das
  `hello-ok.auth.deviceToken` des primären Node sowie ein begrenztes
  Operator-Token in `hello-ok.auth.deviceTokens` für die vertrauenswürdige
  Übergabe an Mobilgeräte zurück. Das Operator-Token enthält
  `operator.talk.secrets` für native Lesezugriffe auf die Talk-Konfiguration,
  schließt jedoch Scopes für Pairing-Änderungen und `operator.admin` aus.
- Während ein nicht zur Basis gehörender Bootstrap über einen Einrichtungscode
  auf die Genehmigung wartet, enthalten die `PAIRING_REQUIRED`-Details
  `recommendedNextStep: "wait_then_retry"`, `retryable: true` und
  `pauseReconnect: false`. Stellen Sie die Verbindung mit demselben
  Bootstrap-Token weiterhin erneut her, bis die Anfrage genehmigt wird oder
  das Token ungültig wird.
- Speichern Sie `hello-ok.auth.deviceTokens` nur, wenn für die Verbindung
  Bootstrap-Authentifizierung über einen vertrauenswürdigen Transport wie
  `wss://` oder lokales bzw. Loopback-Pairing verwendet wurde.
- Wenn ein Client ein explizites `deviceToken` oder explizite `scopes`
  bereitstellt, bleibt die vom Aufrufer angeforderte Scope-Menge maßgeblich;
  zwischengespeicherte Scopes werden nur wiederverwendet, wenn der Client das
  gespeicherte gerätebezogene Token erneut verwendet.
- Geräte-Token können über `device.token.rotate` und `device.token.revoke`
  rotiert bzw. widerrufen werden (erfordert `operator.pairing`). Das Rotieren
  oder Widerrufen eines Node oder einer anderen Nicht-Operator-Rolle erfordert
  zusätzlich `operator.admin`.
- `device.token.rotate` gibt Rotationsmetadaten zurück. Das Ersatz-Bearer-Token
  wird nur bei Aufrufen desselben Geräts zurückgegeben, die bereits mit diesem
  Geräte-Token authentifiziert wurden, damit reine Token-Clients ihren Ersatz
  vor dem erneuten Verbindungsaufbau speichern können. Bei Rotationen über
  gemeinsame oder administrative Authentifizierung wird das Bearer-Token nicht
  zurückgegeben.
- Ausstellung, Rotation und Widerruf von Token bleiben auf die genehmigte
  Rollenmenge beschränkt, die im Pairing-Eintrag des jeweiligen Geräts
  verzeichnet ist; Token-Änderungen können keine Geräterolle erweitern oder
  adressieren, die durch die Pairing-Genehmigung nie gewährt wurde.
- Bei Token-Sitzungen gekoppelter Geräte ist die Geräteverwaltung auf das
  eigene Gerät beschränkt, sofern der Aufrufer nicht zusätzlich über
  `operator.admin` verfügt: Aufrufer ohne Administratorrechte können nur das
  Operator-Token ihres eigenen Geräteeintrags verwalten. Die Verwaltung von
  Node- und anderen Nicht-Operator-Token ist ausschließlich Administratoren
  vorbehalten, selbst für das eigene Gerät des Aufrufers.
- `device.token.rotate` und `device.token.revoke` prüfen außerdem die
  Scope-Menge des Ziel-Operator-Tokens gegen die aktuellen Sitzungs-Scopes des
  Aufrufers. Aufrufer ohne Administratorrechte können kein Operator-Token
  rotieren oder widerrufen, dessen Umfang über den eigenen hinausgeht.
- Authentifizierungsfehler enthalten `error.details.code` sowie Hinweise zur
  Wiederherstellung:
  - `error.details.canRetryWithDeviceToken` (boolescher Wert)
  - `error.details.recommendedNextStep`: entweder `retry_with_device_token`,
    `update_auth_configuration`, `update_auth_credentials`,
    `wait_then_retry` oder `review_auth_configuration`
    (`packages/gateway-protocol/src/connect-error-details.ts`).
- Clientverhalten bei `AUTH_TOKEN_MISMATCH`:
  - Vertrauenswürdige Clients können einen einzigen begrenzten
    Wiederholungsversuch mit einem zwischengespeicherten gerätebezogenen Token
    durchführen.
  - Wenn dieser Wiederholungsversuch fehlschlägt, stoppen Sie automatische
    Reconnect-Schleifen und zeigen Sie Hinweise zu erforderlichen Maßnahmen des
    Operators an.
- `AUTH_SCOPE_MISMATCH` bedeutet, dass das Geräte-Token erkannt wurde, jedoch
  die angeforderte Rolle bzw. die angeforderten Scopes nicht abdeckt. Stellen
  Sie dies nicht als ungültiges Token dar; fordern Sie den Operator stattdessen
  auf, das Pairing erneut durchzuführen oder den engeren bzw. breiteren
  Scope-Vertrag zu genehmigen.

## Geräteidentität und Pairing

- Nodes sollten eine stabile Geräteidentität (`device.id`) enthalten, die aus
  dem Fingerabdruck eines Schlüsselpaars abgeleitet wird.
- Gateways stellen Token pro Gerät und Rolle aus.
- Für neue Geräte-IDs sind Pairing-Genehmigungen erforderlich, sofern die
  automatische lokale Genehmigung nicht aktiviert ist.
- Die automatische Pairing-Genehmigung konzentriert sich auf direkte lokale
  Loopback-Verbindungen.
- OpenClaw verfügt außerdem über einen eng begrenzten
  Backend-/Container-lokalen Selbstverbindungspfad für vertrauenswürdige
  Hilfsabläufe mit gemeinsamem Geheimnis.
- Tailnet- oder LAN-Verbindungen auf demselben Host werden für das Pairing
  weiterhin als entfernt behandelt und erfordern eine Genehmigung.
- WS-Clients geben während `connect` normalerweise eine `device`-Identität an
  (Operator + Node). Die einzigen Ausnahmen für Operatoren ohne Gerät sind
  explizite Vertrauenspfade:
  - `gateway.controlUi.allowInsecureAuth=true` für unsichere
    HTTP-Kompatibilität ausschließlich auf localhost.
  - erfolgreiche Operator-Authentifizierung der Control UI über
    `gateway.auth.mode: "trusted-proxy"`.
  - `gateway.controlUi.dangerouslyDisableDeviceAuth=true` (Notfalloption,
    erhebliche Herabstufung der Sicherheit).
  - direkte Loopback-Backend-RPCs von `gateway-client` auf dem reservierten
    internen Hilfspfad.
- Das Weglassen der Geräteidentität hat Auswirkungen auf die Scopes. Wenn eine
  Operator-Verbindung ohne Gerät über einen expliziten Vertrauenspfad
  zugelassen wird, löscht OpenClaw dennoch selbst deklarierte Scopes auf eine
  leere Menge, sofern dieser Pfad keine benannte Ausnahme zur Beibehaltung von
  Scopes besitzt. Scope-geschützte Methoden schlagen dann mit `missing scope`
  fehl.
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true` ist ein Notfallpfad der
  Control UI zur Beibehaltung von Scopes. Er gewährt beliebigen
  benutzerdefinierten Backend- oder CLI-artigen WebSocket-Clients keine Scopes.
- Der reservierte direkte Loopback-Hilfspfad des `gateway-client`-Backends
  behält Scopes nur für interne lokale RPCs der Steuerungsebene bei;
  benutzerdefinierte Backend-IDs erhalten diese Ausnahme nicht.
- Alle Verbindungen müssen die vom Server bereitgestellte Nonce
  `connect.challenge` signieren.

### Diagnose der Migration der Geräteauthentifizierung

Für Legacy-Clients, die weiterhin das Signaturverhalten vor Einführung der
Challenge verwenden, gibt `connect` unter `error.details.code`
`DEVICE_AUTH_*`-Detailcodes mit einem stabilen `error.details.reason` zurück.

Häufige Migrationsfehler:

| Meldung                     | details.code                     | details.reason           | Bedeutung                                                          |
| --------------------------- | -------------------------------- | ------------------------ | ------------------------------------------------------------------ |
| `device nonce required`     | `DEVICE_AUTH_NONCE_REQUIRED`     | `device-nonce-missing`   | Der Client hat `device.nonce` ausgelassen (oder leer übermittelt). |
| `device nonce mismatch`     | `DEVICE_AUTH_NONCE_MISMATCH`     | `device-nonce-mismatch`  | Der Client hat mit einer veralteten/falschen Nonce signiert.       |
| `device signature invalid`  | `DEVICE_AUTH_SIGNATURE_INVALID`  | `device-signature`       | Die Signaturnutzlast stimmt nicht mit der v2-Nutzlast überein.     |
| `device signature expired`  | `DEVICE_AUTH_SIGNATURE_EXPIRED`  | `device-signature-stale` | Der signierte Zeitstempel liegt außerhalb der zulässigen Toleranz.|
| `device identity mismatch`  | `DEVICE_AUTH_DEVICE_ID_MISMATCH` | `device-id-mismatch`     | `device.id` stimmt nicht mit dem Fingerabdruck des öffentlichen Schlüssels überein. |
| `device public key invalid` | `DEVICE_AUTH_PUBLIC_KEY_INVALID` | `device-public-key`      | Format/Kanonisierung des öffentlichen Schlüssels fehlgeschlagen.   |

Migrationsziel:

- Warten Sie immer auf `connect.challenge`.
- Signieren Sie die v2-Nutzlast, die die Server-Nonce enthält.
- Senden Sie dieselbe Nonce in `connect.params.device.nonce`.
- Die bevorzugte Signaturnutzlast ist `v3`
  (`buildDeviceAuthPayloadV3` in `packages/gateway-client/src/device-auth.ts`),
  die zusätzlich zu den Feldern für Gerät/Client/Rolle/Berechtigungsbereiche/Token/Nonce
  auch `platform` und `deviceFamily` bindet.
- Veraltete `v2`-Signaturen werden aus Kompatibilitätsgründen weiterhin akzeptiert, aber das
  Anheften der Metadaten gekoppelter Geräte steuert beim erneuten Verbinden weiterhin die Befehlsrichtlinie.

## TLS und Pinning

- TLS wird für WS-Verbindungen unterstützt (`gateway.tls`-Konfiguration).
- Clients können optional den Fingerabdruck des Gateway-Zertifikats über
  `gateway.remote.tlsFingerprint` oder die CLI-Option `--tls-fingerprint` anheften.

## Umfang

Dieses Protokoll stellt die vollständige Gateway-API bereit: Status, Kanäle, Modelle, Chat,
Agent, Sitzungen, Nodes, Genehmigungen und mehr. Der genaue Umfang wird durch
die aus `packages/gateway-protocol/src/schema.ts` erneut exportierten TypeBox-Schemas definiert.

## Verwandte Themen

- [Bridge-Protokoll](/de/gateway/bridge-protocol)
- [Gateway-Betriebshandbuch](/de/gateway)
